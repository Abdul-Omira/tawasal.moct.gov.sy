/**
 * Analytics API Routes
 * @copyright 2025 Syrian Ministry of Communications and Information Technology
 */

import express from 'express';
import { analyticsService } from '../services/analyticsService';
import { redisService } from '../services/redisService';
import { requirePermission } from '../middleware/rbac';
import { tenantResolver } from '../middleware/tenant';
import { auditLoggingMiddleware } from '../middleware/auditLogging';
import { PERMISSIONS } from '../middleware/rbac';

const router = express.Router();

// Apply middleware
router.use(tenantResolver);
router.use(auditLoggingMiddleware);

// Track analytics event
router.post('/events', requirePermission(PERMISSIONS.VIEW_FORM_ANALYTICS), async (req, res) => {
  try {
    const { type, formId, data, metadata } = req.body;
    const tenantId = req.tenant?.id;
    const userId = req.user?.id;
    const sessionId = req.sessionID;

    if (!type || !formId) {
      return res.status(400).json({ error: 'Type and formId are required' });
    }

    await analyticsService.trackEvent(type, formId, data, {
      tenantId,
      userId,
      sessionId,
      metadata: {
        ...metadata,
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip,
        referrer: req.get('Referer'),
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error tracking analytics event:', error);
    res.status(500).json({ error: 'Failed to track analytics event' });
  }
});

// Get form analytics
router.get('/forms/:formId', requirePermission(PERMISSIONS.VIEW_FORM_ANALYTICS), async (req, res) => {
  try {
    const { formId } = req.params;
    const tenantId = req.tenant?.id;

    const analytics = await analyticsService.getFormAnalytics(formId, tenantId);
    
    if (!analytics) {
      return res.status(404).json({ error: 'Analytics not found' });
    }

    res.json(analytics);
  } catch (error) {
    console.error('Error getting form analytics:', error);
    res.status(500).json({ error: 'Failed to get form analytics' });
  }
});

// Get user analytics
router.get('/users/:userId', requirePermission(PERMISSIONS.VIEW_FORM_ANALYTICS), async (req, res) => {
  try {
    const { userId } = req.params;
    const tenantId = req.tenant?.id;

    const analytics = await analyticsService.getUserAnalytics(userId, tenantId);
    
    if (!analytics) {
      return res.status(404).json({ error: 'User analytics not found' });
    }

    res.json(analytics);
  } catch (error) {
    console.error('Error getting user analytics:', error);
    res.status(500).json({ error: 'Failed to get user analytics' });
  }
});

// Get tenant analytics
router.get('/tenant', requirePermission(PERMISSIONS.VIEW_FORM_ANALYTICS), async (req, res) => {
  try {
    const tenantId = req.tenant?.id;

    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    const analytics = await analyticsService.getTenantAnalytics(tenantId);
    
    if (!analytics) {
      return res.status(404).json({ error: 'Tenant analytics not found' });
    }

    res.json(analytics);
  } catch (error) {
    console.error('Error getting tenant analytics:', error);
    res.status(500).json({ error: 'Failed to get tenant analytics' });
  }
});

// Get analytics summary
router.get('/summary', requirePermission(PERMISSIONS.VIEW_FORM_ANALYTICS), async (req, res) => {
  try {
    const tenantId = req.tenant?.id;
    const summary = await analyticsService.getAnalyticsSummary(tenantId);
    res.json(summary);
  } catch (error) {
    console.error('Error getting analytics summary:', error);
    res.status(500).json({ error: 'Failed to get analytics summary' });
  }
});

// Get real-time analytics
router.get('/realtime', requirePermission(PERMISSIONS.VIEW_FORM_ANALYTICS), async (req, res) => {
  try {
    const tenantId = req.tenant?.id;
    const { start, end } = req.query;

    const timeRange = start && end ? {
      start: parseInt(start as string),
      end: parseInt(end as string)
    } : undefined;

    const data = await analyticsService.getRealTimeAnalytics(tenantId, timeRange);
    res.json(data);
  } catch (error) {
    console.error('Error getting real-time analytics:', error);
    res.status(500).json({ error: 'Failed to get real-time analytics' });
  }
});

// Get performance metrics
router.get('/performance', requirePermission(PERMISSIONS.VIEW_FORM_ANALYTICS), async (req, res) => {
  try {
    const { metric, start, end, interval } = req.query;
    const tenantId = req.tenant?.id;

    // This would typically query the performance_metrics table
    // For now, return mock data
    const metrics = {
      responseTime: {
        average: 150,
        p95: 300,
        p99: 500
      },
      throughput: {
        requestsPerSecond: 1000,
        formsPerMinute: 50
      },
      errorRate: 0.5,
      uptime: 99.9
    };

    res.json(metrics);
  } catch (error) {
    console.error('Error getting performance metrics:', error);
    res.status(500).json({ error: 'Failed to get performance metrics' });
  }
});

// Get security events
router.get('/security', requirePermission(PERMISSIONS.VIEW_FORM_ANALYTICS), async (req, res) => {
  try {
    const { severity, start, end } = req.query;
    const tenantId = req.tenant?.id;

    // This would typically query the security_events table
    // For now, return mock data
    const events = [
      {
        id: '1',
        type: 'failed_login',
        severity: 'medium',
        description: 'Multiple failed login attempts',
        timestamp: new Date(),
        ipAddress: '192.168.1.100'
      },
      {
        id: '2',
        type: 'suspicious_activity',
        severity: 'high',
        description: 'Unusual form submission pattern',
        timestamp: new Date(),
        ipAddress: '192.168.1.101'
      }
    ];

    res.json(events);
  } catch (error) {
    console.error('Error getting security events:', error);
    res.status(500).json({ error: 'Failed to get security events' });
  }
});

// Get API usage logs
router.get('/api-usage', requirePermission(PERMISSIONS.VIEW_FORM_ANALYTICS), async (req, res) => {
  try {
    const { endpoint, method, start, end } = req.query;
    const tenantId = req.tenant?.id;

    // This would typically query the api_usage_logs table
    // For now, return mock data
    const logs = [
      {
        id: '1',
        endpoint: '/api/forms',
        method: 'GET',
        statusCode: 200,
        responseTime: 150,
        timestamp: new Date()
      },
      {
        id: '2',
        endpoint: '/api/forms',
        method: 'POST',
        statusCode: 201,
        responseTime: 200,
        timestamp: new Date()
      }
    ];

    res.json(logs);
  } catch (error) {
    console.error('Error getting API usage logs:', error);
    res.status(500).json({ error: 'Failed to get API usage logs' });
  }
});

// Export analytics data
router.post('/export', requirePermission(PERMISSIONS.VIEW_FORM_ANALYTICS), async (req, res) => {
  try {
    const { type, format, start, end, filters } = req.body;
    const tenantId = req.tenant?.id;

    // This would typically generate and return an export file
    // For now, return a mock export
    const exportData = {
      type,
      format,
      start,
      end,
      filters,
      data: [],
      downloadUrl: `/api/analytics/downloads/export_${Date.now()}.${format}`
    };

    res.json(exportData);
  } catch (error) {
    console.error('Error exporting analytics data:', error);
    res.status(500).json({ error: 'Failed to export analytics data' });
  }
});

// Get analytics dashboard data
router.get('/dashboard', requirePermission(PERMISSIONS.VIEW_FORM_ANALYTICS), async (req, res) => {
  try {
    const tenantId = req.tenant?.id;
    const { period = '7d' } = req.query;

    // This would typically aggregate data from multiple sources
    // For now, return mock dashboard data
    const dashboard = {
      overview: {
        totalForms: 25,
        totalSubmissions: 150,
        totalViews: 500,
        completionRate: 30,
        averageTimeToComplete: 180
      },
      charts: {
        submissionsOverTime: [
          { date: '2024-01-01', count: 10 },
          { date: '2024-01-02', count: 15 },
          { date: '2024-01-03', count: 12 }
        ],
        topForms: [
          { formId: '1', title: 'Form 1', submissions: 50 },
          { formId: '2', title: 'Form 2', submissions: 30 }
        ],
        deviceBreakdown: {
          desktop: 60,
          mobile: 35,
          tablet: 5
        }
      },
      realTime: {
        activeUsers: 5,
        currentSubmissions: 2,
        systemLoad: 45
      }
    };

    res.json(dashboard);
  } catch (error) {
    console.error('Error getting dashboard data:', error);
    res.status(500).json({ error: 'Failed to get dashboard data' });
  }
});

// Get analytics reports
router.get('/reports', requirePermission(PERMISSIONS.VIEW_FORM_ANALYTICS), async (req, res) => {
  try {
    const tenantId = req.tenant?.id;
    const { status, type } = req.query;

    // This would typically query the analytics_reports table
    // For now, return mock data
    const reports = [
      {
        id: '1',
        name: 'Monthly Form Analytics',
        type: 'monthly',
        status: 'completed',
        createdAt: new Date(),
        downloadUrl: '/api/analytics/reports/1/download'
      },
      {
        id: '2',
        name: 'User Activity Report',
        type: 'user_activity',
        status: 'pending',
        createdAt: new Date()
      }
    ];

    res.json(reports);
  } catch (error) {
    console.error('Error getting analytics reports:', error);
    res.status(500).json({ error: 'Failed to get analytics reports' });
  }
});

// Create analytics report
router.post('/reports', requirePermission(PERMISSIONS.VIEW_FORM_ANALYTICS), async (req, res) => {
  try {
    const { name, type, parameters } = req.body;
    const tenantId = req.tenant?.id;
    const userId = req.user?.id;

    if (!name || !type) {
      return res.status(400).json({ error: 'Name and type are required' });
    }

    // This would typically create a report generation job
    // For now, return a mock report
    const report = {
      id: `report_${Date.now()}`,
      name,
      type,
      parameters,
      status: 'pending',
      createdAt: new Date()
    };

    res.json(report);
  } catch (error) {
    console.error('Error creating analytics report:', error);
    res.status(500).json({ error: 'Failed to create analytics report' });
  }
});

// Get analytics alerts
router.get('/alerts', requirePermission(PERMISSIONS.VIEW_FORM_ANALYTICS), async (req, res) => {
  try {
    const tenantId = req.tenant?.id;

    // This would typically query the analytics_alerts table
    // For now, return mock data
    const alerts = [
      {
        id: '1',
        name: 'High Error Rate',
        type: 'error_rate',
        condition: { metric: 'error_rate', operator: '>', value: 5 },
        threshold: 5,
        isActive: true,
        lastTriggered: new Date()
      },
      {
        id: '2',
        name: 'Low Completion Rate',
        type: 'completion_rate',
        condition: { metric: 'completion_rate', operator: '<', value: 20 },
        threshold: 20,
        isActive: true,
        lastTriggered: null
      }
    ];

    res.json(alerts);
  } catch (error) {
    console.error('Error getting analytics alerts:', error);
    res.status(500).json({ error: 'Failed to get analytics alerts' });
  }
});

// Create analytics alert
router.post('/alerts', requirePermission(PERMISSIONS.VIEW_FORM_ANALYTICS), async (req, res) => {
  try {
    const { name, type, condition, threshold } = req.body;
    const tenantId = req.tenant?.id;
    const userId = req.user?.id;

    if (!name || !type || !condition || !threshold) {
      return res.status(400).json({ error: 'Name, type, condition, and threshold are required' });
    }

    // This would typically create an alert in the database
    // For now, return a mock alert
    const alert = {
      id: `alert_${Date.now()}`,
      name,
      type,
      condition,
      threshold,
      isActive: true,
      createdAt: new Date()
    };

    res.json(alert);
  } catch (error) {
    console.error('Error creating analytics alert:', error);
    res.status(500).json({ error: 'Failed to create analytics alert' });
  }
});

// WebSocket endpoint for real-time analytics
router.get('/realtime/ws', requirePermission(PERMISSIONS.VIEW_FORM_ANALYTICS), (req, res) => {
  // This would typically set up a WebSocket connection
  // For now, return a message indicating WebSocket is not implemented
  res.json({ message: 'WebSocket endpoint not implemented yet' });
});

export default router;
