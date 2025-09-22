import express from 'express';
import { z } from 'zod';
import { requirePermission } from '../middleware/rbac';
import { tenantFilter } from '../middleware/tenant';
import { logAuditEvent } from '../middleware/auditLogging';
import { storage } from '../database/storage';

const router = express.Router();

// Performance Metric Schemas
const PerformanceMetricSchema = z.object({
  name: z.string().min(1),
  value: z.number(),
  unit: z.string(),
  category: z.enum(['response_time', 'throughput', 'error_rate', 'resource_usage', 'user_experience']),
  tags: z.record(z.string()).optional(),
});

const PerformanceConditionSchema = z.object({
  metric: z.string(),
  operator: z.enum(['gt', 'lt', 'eq', 'gte', 'lte', 'ne']),
  threshold: z.number(),
  duration: z.number().optional(),
  aggregation: z.enum(['avg', 'max', 'min', 'sum', 'count']).optional(),
});

const PerformanceAlertSchema = z.object({
  name: z.string().min(1),
  description: z.string(),
  condition: PerformanceConditionSchema,
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  status: z.enum(['active', 'triggered', 'resolved', 'disabled']),
  notificationChannels: z.array(z.string()),
});

const PerformanceWidgetSchema = z.object({
  id: z.string(),
  type: z.enum(['chart', 'metric', 'table', 'alert']),
  title: z.string(),
  config: z.any(),
  position: z.object({
    x: z.number(),
    y: z.number(),
    w: z.number(),
    h: z.number(),
  }),
});

const PerformanceDashboardSchema = z.object({
  name: z.string().min(1),
  description: z.string(),
  widgets: z.array(PerformanceWidgetSchema),
  isPublic: z.boolean(),
});

// Performance Metrics
router.post('/metrics', requirePermission('PERFORMANCE_MONITOR'), tenantFilter, async (req, res) => {
  try {
    const metricData = PerformanceMetricSchema.parse(req.body);
    const metric = await storage.createPerformanceMetric({
      ...metricData,
      createdBy: req.user!.id.toString(),
    });

    await logAuditEvent({
      userId: req.user!.id,
      action: 'CREATE_PERFORMANCE_METRIC',
      resourceType: 'performance_metric',
      resourceId: metric.id,
      details: { metricName: metric.name },
    });

    res.status(201).json(metric);
  } catch (error) {
    console.error('Error creating performance metric:', error);
    res.status(400).json({ error: 'Failed to create performance metric' });
  }
});

router.get('/metrics', requirePermission('PERFORMANCE_MONITOR'), tenantFilter, async (req, res) => {
  try {
    const { category, startDate, endDate, tags } = req.query;
    const filters: any = {};
    
    if (category) filters.category = category;
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);
    if (tags) filters.tags = JSON.parse(tags as string);

    const metrics = await storage.getPerformanceMetrics(filters, req.tenant?.id);
    res.json(metrics);
  } catch (error) {
    console.error('Error fetching performance metrics:', error);
    res.status(500).json({ error: 'Failed to fetch performance metrics' });
  }
});

// Performance Alerts
router.post('/alerts', requirePermission('PERFORMANCE_MONITOR'), tenantFilter, async (req, res) => {
  try {
    const alertData = PerformanceAlertSchema.parse(req.body);
    const alert = await storage.createPerformanceAlert({
      ...alertData,
      createdBy: req.user!.id.toString(),
    });

    await logAuditEvent({
      userId: req.user!.id,
      action: 'CREATE_PERFORMANCE_ALERT',
      resourceType: 'performance_alert',
      resourceId: alert.id,
      details: { alertName: alert.name },
    });

    res.status(201).json(alert);
  } catch (error) {
    console.error('Error creating performance alert:', error);
    res.status(400).json({ error: 'Failed to create performance alert' });
  }
});

router.get('/alerts', requirePermission('PERFORMANCE_MONITOR'), tenantFilter, async (req, res) => {
  try {
    const alerts = await storage.getPerformanceAlerts(req.tenant?.id);
    res.json(alerts);
  } catch (error) {
    console.error('Error fetching performance alerts:', error);
    res.status(500).json({ error: 'Failed to fetch performance alerts' });
  }
});

router.put('/alerts/:id', requirePermission('PERFORMANCE_MONITOR'), tenantFilter, async (req, res) => {
  try {
    const alertData = PerformanceAlertSchema.partial().parse(req.body);
    const alert = await storage.updatePerformanceAlert(req.params.id, alertData, req.tenant?.id);
    
    if (!alert) {
      return res.status(404).json({ error: 'Performance alert not found' });
    }

    await logAuditEvent({
      userId: req.user!.id,
      action: 'UPDATE_PERFORMANCE_ALERT',
      resourceType: 'performance_alert',
      resourceId: req.params.id,
      details: { alertName: alert.name },
    });

    res.json(alert);
  } catch (error) {
    console.error('Error updating performance alert:', error);
    res.status(400).json({ error: 'Failed to update performance alert' });
  }
});

router.delete('/alerts/:id', requirePermission('PERFORMANCE_MONITOR'), tenantFilter, async (req, res) => {
  try {
    const success = await storage.deletePerformanceAlert(req.params.id, req.tenant?.id);
    if (!success) {
      return res.status(404).json({ error: 'Performance alert not found' });
    }

    await logAuditEvent({
      userId: req.user!.id,
      action: 'DELETE_PERFORMANCE_ALERT',
      resourceType: 'performance_alert',
      resourceId: req.params.id,
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting performance alert:', error);
    res.status(500).json({ error: 'Failed to delete performance alert' });
  }
});

router.post('/alerts/:id/test', requirePermission('PERFORMANCE_MONITOR'), tenantFilter, async (req, res) => {
  try {
    const alert = await storage.getPerformanceAlertById(req.params.id, req.tenant?.id);
    if (!alert) {
      return res.status(404).json({ error: 'Performance alert not found' });
    }

    // Test the alert condition
    const triggered = await testAlertCondition(alert);
    
    res.json({
      triggered,
      message: triggered ? 'Alert condition is currently triggered' : 'Alert condition is not triggered'
    });
  } catch (error) {
    console.error('Error testing performance alert:', error);
    res.status(500).json({ error: 'Failed to test performance alert' });
  }
});

// Performance Dashboards
router.post('/dashboards', requirePermission('PERFORMANCE_MONITOR'), tenantFilter, async (req, res) => {
  try {
    const dashboardData = PerformanceDashboardSchema.parse(req.body);
    const dashboard = await storage.createPerformanceDashboard({
      ...dashboardData,
      createdBy: req.user!.id.toString(),
    });

    await logAuditEvent({
      userId: req.user!.id,
      action: 'CREATE_PERFORMANCE_DASHBOARD',
      resourceType: 'performance_dashboard',
      resourceId: dashboard.id,
      details: { dashboardName: dashboard.name },
    });

    res.status(201).json(dashboard);
  } catch (error) {
    console.error('Error creating performance dashboard:', error);
    res.status(400).json({ error: 'Failed to create performance dashboard' });
  }
});

router.get('/dashboards', requirePermission('PERFORMANCE_MONITOR'), tenantFilter, async (req, res) => {
  try {
    const dashboards = await storage.getPerformanceDashboards(req.tenant?.id);
    res.json(dashboards);
  } catch (error) {
    console.error('Error fetching performance dashboards:', error);
    res.status(500).json({ error: 'Failed to fetch performance dashboards' });
  }
});

router.put('/dashboards/:id', requirePermission('PERFORMANCE_MONITOR'), tenantFilter, async (req, res) => {
  try {
    const dashboardData = PerformanceDashboardSchema.partial().parse(req.body);
    const dashboard = await storage.updatePerformanceDashboard(req.params.id, dashboardData, req.tenant?.id);
    
    if (!dashboard) {
      return res.status(404).json({ error: 'Performance dashboard not found' });
    }

    await logAuditEvent({
      userId: req.user!.id,
      action: 'UPDATE_PERFORMANCE_DASHBOARD',
      resourceType: 'performance_dashboard',
      resourceId: req.params.id,
      details: { dashboardName: dashboard.name },
    });

    res.json(dashboard);
  } catch (error) {
    console.error('Error updating performance dashboard:', error);
    res.status(400).json({ error: 'Failed to update performance dashboard' });
  }
});

router.delete('/dashboards/:id', requirePermission('PERFORMANCE_MONITOR'), tenantFilter, async (req, res) => {
  try {
    const success = await storage.deletePerformanceDashboard(req.params.id, req.tenant?.id);
    if (!success) {
      return res.status(404).json({ error: 'Performance dashboard not found' });
    }

    await logAuditEvent({
      userId: req.user!.id,
      action: 'DELETE_PERFORMANCE_DASHBOARD',
      resourceType: 'performance_dashboard',
      resourceId: req.params.id,
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting performance dashboard:', error);
    res.status(500).json({ error: 'Failed to delete performance dashboard' });
  }
});

// Performance Reports
router.post('/reports', requirePermission('PERFORMANCE_MONITOR'), tenantFilter, async (req, res) => {
  try {
    const { name, period, metrics, includeRecommendations = true } = req.body;
    
    const report = await storage.generatePerformanceReport({
      name,
      period: {
        start: new Date(period.start),
        end: new Date(period.end),
      },
      metrics,
      includeRecommendations,
      generatedBy: req.user!.id.toString(),
    });

    await logAuditEvent({
      userId: req.user!.id,
      action: 'GENERATE_PERFORMANCE_REPORT',
      resourceType: 'performance_report',
      resourceId: report.id,
      details: { reportName: report.name },
    });

    res.status(201).json(report);
  } catch (error) {
    console.error('Error generating performance report:', error);
    res.status(500).json({ error: 'Failed to generate performance report' });
  }
});

router.get('/reports', requirePermission('PERFORMANCE_MONITOR'), tenantFilter, async (req, res) => {
  try {
    const reports = await storage.getPerformanceReports(req.tenant?.id);
    res.json(reports);
  } catch (error) {
    console.error('Error fetching performance reports:', error);
    res.status(500).json({ error: 'Failed to fetch performance reports' });
  }
});

router.get('/reports/:id/download', requirePermission('PERFORMANCE_MONITOR'), tenantFilter, async (req, res) => {
  try {
    const { format = 'pdf' } = req.query;
    const report = await storage.getPerformanceReportById(req.params.id, req.tenant?.id);
    
    if (!report) {
      return res.status(404).json({ error: 'Performance report not found' });
    }

    // Generate and return file based on format
    const fileBuffer = await generatePerformanceReportFile(report, format as string);
    const mimeType = getMimeType(format as string);
    const filename = `performance-report-${report.name}-${Date.now()}.${format}`;

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(fileBuffer);
  } catch (error) {
    console.error('Error downloading performance report:', error);
    res.status(500).json({ error: 'Failed to download performance report' });
  }
});

// Performance Optimization
router.get('/optimization/suggestions', requirePermission('PERFORMANCE_MONITOR'), tenantFilter, async (req, res) => {
  try {
    const suggestions = await storage.getPerformanceOptimizationSuggestions(req.tenant?.id);
    res.json(suggestions);
  } catch (error) {
    console.error('Error fetching optimization suggestions:', error);
    res.status(500).json({ error: 'Failed to fetch optimization suggestions' });
  }
});

router.post('/optimization/:id/apply', requirePermission('PERFORMANCE_MONITOR'), tenantFilter, async (req, res) => {
  try {
    const result = await storage.applyPerformanceOptimization(req.params.id, req.tenant?.id);
    
    await logAuditEvent({
      userId: req.user!.id,
      action: 'APPLY_PERFORMANCE_OPTIMIZATION',
      resourceType: 'performance_optimization',
      resourceId: req.params.id,
      details: { result },
    });

    res.json(result);
  } catch (error) {
    console.error('Error applying performance optimization:', error);
    res.status(500).json({ error: 'Failed to apply performance optimization' });
  }
});

// Real-time Performance Monitoring
router.get('/realtime', requirePermission('PERFORMANCE_MONITOR'), tenantFilter, async (req, res) => {
  try {
    const metrics = await storage.getRealTimePerformanceMetrics(req.tenant?.id);
    res.json(metrics);
  } catch (error) {
    console.error('Error fetching real-time metrics:', error);
    res.status(500).json({ error: 'Failed to fetch real-time metrics' });
  }
});

// Performance Health Check
router.get('/health', requirePermission('PERFORMANCE_MONITOR'), tenantFilter, async (req, res) => {
  try {
    const healthStatus = await storage.getPerformanceHealthStatus(req.tenant?.id);
    res.json(healthStatus);
  } catch (error) {
    console.error('Error fetching health status:', error);
    res.status(500).json({ error: 'Failed to fetch health status' });
  }
});

// Performance Analytics
router.get('/analytics', requirePermission('PERFORMANCE_MONITOR'), tenantFilter, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const period = {
      start: new Date(startDate as string),
      end: new Date(endDate as string),
    };

    const analytics = await storage.getPerformanceAnalytics(period, req.tenant?.id);
    res.json(analytics);
  } catch (error) {
    console.error('Error fetching performance analytics:', error);
    res.status(500).json({ error: 'Failed to fetch performance analytics' });
  }
});

// Helper Functions
async function testAlertCondition(alert: any): Promise<boolean> {
  // This is a simplified implementation
  // In a real system, you would evaluate the alert condition against current metrics
  const mockMetrics = {
    response_time: 150,
    error_rate: 2.5,
    throughput: 1000,
  };

  const { condition } = alert;
  const currentValue = mockMetrics[condition.metric as keyof typeof mockMetrics] || 0;

  switch (condition.operator) {
    case 'gt': return currentValue > condition.threshold;
    case 'lt': return currentValue < condition.threshold;
    case 'eq': return currentValue === condition.threshold;
    case 'gte': return currentValue >= condition.threshold;
    case 'lte': return currentValue <= condition.threshold;
    case 'ne': return currentValue !== condition.threshold;
    default: return false;
  }
}

async function generatePerformanceReportFile(report: any, format: string): Promise<Buffer> {
  // This is a simplified implementation
  // In a real system, you would use libraries like puppeteer for PDF, exceljs for Excel, etc.
  const data = JSON.stringify(report, null, 2);
  return Buffer.from(data, 'utf-8');
}

function getMimeType(format: string): string {
  switch (format) {
    case 'pdf':
      return 'application/pdf';
    case 'excel':
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    case 'csv':
      return 'text/csv';
    default:
      return 'application/octet-stream';
  }
}

export default router;
