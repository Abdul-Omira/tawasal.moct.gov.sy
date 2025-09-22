import express from 'express';
import { z } from 'zod';
import { requirePermission } from '../middleware/rbac';
import { tenantFilter } from '../middleware/tenant';
import { logAuditEvent } from '../middleware/auditLogging';
import { storage } from '../database/storage';

const router = express.Router();

// Report Configuration Schemas
const ReportFiltersSchema = z.object({
  dateRange: z.object({
    start: z.date(),
    end: z.date(),
  }),
  formIds: z.array(z.string()).optional(),
  ministryIds: z.array(z.string()).optional(),
  status: z.array(z.string()).optional(),
  customFilters: z.record(z.any()).optional(),
});

const ReportColumnSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['text', 'number', 'date', 'boolean', 'select']),
  source: z.enum(['form_field', 'submission_meta', 'calculated']),
  fieldPath: z.string().optional(),
  calculation: z.string().optional(),
  format: z.string().optional(),
});

const ReportAggregationSchema = z.object({
  field: z.string(),
  function: z.enum(['count', 'sum', 'avg', 'min', 'max', 'distinct']),
  label: z.string(),
});

const ReportScheduleSchema = z.object({
  enabled: z.boolean(),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'quarterly']),
  time: z.string(),
  dayOfWeek: z.number().optional(),
  dayOfMonth: z.number().optional(),
  recipients: z.array(z.string()),
  format: z.enum(['pdf', 'excel', 'csv']),
});

const ReportConfigSchema = z.object({
  name: z.string().min(1),
  description: z.string(),
  type: z.enum(['summary', 'detailed', 'custom']),
  filters: ReportFiltersSchema,
  columns: z.array(ReportColumnSchema),
  groupBy: z.array(z.string()).optional(),
  aggregations: z.array(ReportAggregationSchema).optional(),
  schedule: ReportScheduleSchema.optional(),
  isPublic: z.boolean(),
});

// Report CRUD Operations
router.post('/', requirePermission('CREATE_REPORTS'), tenantFilter, async (req, res) => {
  try {
    const reportData = ReportConfigSchema.parse(req.body);
    const report = await storage.createReport({
      ...reportData,
      createdBy: req.user!.id.toString(),
    });

    await logAuditEvent({
      userId: req.user!.id,
      action: 'CREATE_REPORT',
      resourceType: 'report',
      resourceId: report.id,
      details: { reportName: report.name },
    });

    res.status(201).json(report);
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(400).json({ error: 'Failed to create report' });
  }
});

router.get('/', requirePermission('VIEW_REPORTS'), tenantFilter, async (req, res) => {
  try {
    const reports = await storage.getReports(req.tenant?.id);
    res.json(reports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

router.get('/:id', requirePermission('VIEW_REPORTS'), tenantFilter, async (req, res) => {
  try {
    const report = await storage.getReportById(req.params.id, req.tenant?.id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    res.json(report);
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({ error: 'Failed to fetch report' });
  }
});

router.put('/:id', requirePermission('EDIT_REPORTS'), tenantFilter, async (req, res) => {
  try {
    const reportData = ReportConfigSchema.partial().parse(req.body);
    const report = await storage.updateReport(req.params.id, reportData, req.tenant?.id);
    
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    await logAuditEvent({
      userId: req.user!.id,
      action: 'UPDATE_REPORT',
      resourceType: 'report',
      resourceId: req.params.id,
      details: { reportName: report.name },
    });

    res.json(report);
  } catch (error) {
    console.error('Error updating report:', error);
    res.status(400).json({ error: 'Failed to update report' });
  }
});

router.delete('/:id', requirePermission('DELETE_REPORTS'), tenantFilter, async (req, res) => {
  try {
    const success = await storage.deleteReport(req.params.id, req.tenant?.id);
    if (!success) {
      return res.status(404).json({ error: 'Report not found' });
    }

    await logAuditEvent({
      userId: req.user!.id,
      action: 'DELETE_REPORT',
      resourceType: 'report',
      resourceId: req.params.id,
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({ error: 'Failed to delete report' });
  }
});

// Report Generation
router.post('/:id/generate', requirePermission('GENERATE_REPORTS'), tenantFilter, async (req, res) => {
  try {
    const { filters } = req.body;
    const report = await storage.getReportById(req.params.id, req.tenant?.id);
    
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Generate report data based on configuration
    const reportData = await generateReportData(report, filters, req.tenant?.id);
    
    // Store generated report data
    const generatedReport = await storage.createGeneratedReport({
      reportId: req.params.id,
      data: reportData,
      metadata: {
        totalRows: reportData.length,
        generatedAt: new Date(),
        filters: filters || report.filters,
        generatedBy: req.user!.id.toString(),
      },
      status: 'completed',
    });

    await logAuditEvent({
      userId: req.user!.id,
      action: 'GENERATE_REPORT',
      resourceType: 'report',
      resourceId: req.params.id,
      details: { generatedReportId: generatedReport.id },
    });

    res.json(generatedReport);
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

router.get('/:id/data', requirePermission('VIEW_REPORTS'), tenantFilter, async (req, res) => {
  try {
    const { page = 1, limit = 100 } = req.query;
    const reportData = await storage.getReportData(
      req.params.id,
      parseInt(page as string),
      parseInt(limit as string),
      req.tenant?.id
    );
    res.json(reportData);
  } catch (error) {
    console.error('Error fetching report data:', error);
    res.status(500).json({ error: 'Failed to fetch report data' });
  }
});

router.get('/:id/download', requirePermission('DOWNLOAD_REPORTS'), tenantFilter, async (req, res) => {
  try {
    const { format = 'pdf' } = req.query;
    const report = await storage.getReportById(req.params.id, req.tenant?.id);
    
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Generate and return file based on format
    const fileBuffer = await generateReportFile(report, format as string);
    const mimeType = getMimeType(format as string);
    const filename = `report-${report.name}-${Date.now()}.${format}`;

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(fileBuffer);
  } catch (error) {
    console.error('Error downloading report:', error);
    res.status(500).json({ error: 'Failed to download report' });
  }
});

// Report Templates
router.get('/templates', requirePermission('VIEW_REPORTS'), tenantFilter, async (req, res) => {
  try {
    const templates = await storage.getReportTemplates(req.tenant?.id);
    res.json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

router.post('/templates', requirePermission('CREATE_REPORTS'), tenantFilter, async (req, res) => {
  try {
    const templateData = z.object({
      name: z.string().min(1),
      description: z.string(),
      category: z.string(),
      config: ReportConfigSchema.partial(),
      isPublic: z.boolean(),
    }).parse(req.body);

    const template = await storage.createReportTemplate({
      ...templateData,
      createdBy: req.user!.id.toString(),
      usageCount: 0,
    });

    await logAuditEvent({
      userId: req.user!.id,
      action: 'CREATE_REPORT_TEMPLATE',
      resourceType: 'report_template',
      resourceId: template.id,
      details: { templateName: template.name },
    });

    res.status(201).json(template);
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(400).json({ error: 'Failed to create template' });
  }
});

router.post('/templates/:id/use', requirePermission('CREATE_REPORTS'), tenantFilter, async (req, res) => {
  try {
    const { overrides } = req.body;
    const template = await storage.getReportTemplateById(req.params.id, req.tenant?.id);
    
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const report = await storage.createReport({
      ...template.config,
      ...overrides,
      createdBy: req.user!.id.toString(),
    });

    // Increment template usage count
    await storage.incrementTemplateUsage(req.params.id);

    await logAuditEvent({
      userId: req.user!.id,
      action: 'USE_REPORT_TEMPLATE',
      resourceType: 'report_template',
      resourceId: req.params.id,
      details: { reportId: report.id },
    });

    res.json(report);
  } catch (error) {
    console.error('Error using template:', error);
    res.status(500).json({ error: 'Failed to use template' });
  }
});

// Report Scheduling
router.get('/scheduled', requirePermission('VIEW_REPORTS'), tenantFilter, async (req, res) => {
  try {
    const reports = await storage.getScheduledReports(req.tenant?.id);
    res.json(reports);
  } catch (error) {
    console.error('Error fetching scheduled reports:', error);
    res.status(500).json({ error: 'Failed to fetch scheduled reports' });
  }
});

router.put('/:id/schedule', requirePermission('EDIT_REPORTS'), tenantFilter, async (req, res) => {
  try {
    const schedule = ReportScheduleSchema.parse(req.body);
    await storage.updateReportSchedule(req.params.id, schedule, req.tenant?.id);

    await logAuditEvent({
      userId: req.user!.id,
      action: 'UPDATE_REPORT_SCHEDULE',
      resourceType: 'report',
      resourceId: req.params.id,
      details: { schedule },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating schedule:', error);
    res.status(400).json({ error: 'Failed to update schedule' });
  }
});

// Report Sharing
router.post('/:id/share', requirePermission('SHARE_REPORTS'), tenantFilter, async (req, res) => {
  try {
    const { isPublic, allowedUsers, allowedRoles, expiresAt } = req.body;
    const shareToken = await storage.shareReport(req.params.id, {
      isPublic,
      allowedUsers,
      allowedRoles,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    }, req.tenant?.id);

    const shareUrl = `${process.env.CLIENT_URL}/shared-reports/${shareToken}`;

    await logAuditEvent({
      userId: req.user!.id,
      action: 'SHARE_REPORT',
      resourceType: 'report',
      resourceId: req.params.id,
      details: { isPublic, shareToken },
    });

    res.json({ shareUrl, accessToken: shareToken });
  } catch (error) {
    console.error('Error sharing report:', error);
    res.status(500).json({ error: 'Failed to share report' });
  }
});

router.get('/shared', requirePermission('VIEW_REPORTS'), tenantFilter, async (req, res) => {
  try {
    const reports = await storage.getSharedReports(req.tenant?.id);
    res.json(reports);
  } catch (error) {
    console.error('Error fetching shared reports:', error);
    res.status(500).json({ error: 'Failed to fetch shared reports' });
  }
});

// Report Analytics
router.get('/analytics', requirePermission('VIEW_ANALYTICS'), tenantFilter, async (req, res) => {
  try {
    const analytics = await storage.getReportAnalytics(req.tenant?.id);
    res.json(analytics);
  } catch (error) {
    console.error('Error fetching report analytics:', error);
    res.status(500).json({ error: 'Failed to fetch report analytics' });
  }
});

// Helper Functions
async function generateReportData(report: any, filters: any, tenantId?: string) {
  // This is a simplified implementation
  // In a real system, you would query the database based on the report configuration
  const mockData = [
    { id: 1, name: 'Sample Data 1', value: 100, date: new Date() },
    { id: 2, name: 'Sample Data 2', value: 200, date: new Date() },
    { id: 3, name: 'Sample Data 3', value: 300, date: new Date() },
  ];

  return mockData;
}

async function generateReportFile(report: any, format: string): Promise<Buffer> {
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
