import express from 'express';
import { z } from 'zod';
import { storage } from '../database/storage';
import { requirePermission } from '../middleware/rbac';
import { tenantFilter } from '../middleware/tenant';
import { logAuditEvent } from '../middleware/auditLogging';

const router = express.Router();

// Security Event schemas
const SecurityEventSchema = z.object({
  type: z.enum(['login_attempt', 'failed_login', 'suspicious_activity', 'data_breach', 'unauthorized_access', 'malware_detected', 'ddos_attack', 'sql_injection', 'xss_attempt', 'csrf_attack']),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  source: z.string(),
  description: z.string(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  userId: z.string().optional(),
  tenantId: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  status: z.enum(['active', 'investigating', 'resolved', 'false_positive']).default('active'),
  assignedTo: z.string().optional(),
  resolution: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

const SecurityAlertSchema = z.object({
  eventId: z.string(),
  title: z.string(),
  description: z.string(),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  status: z.enum(['active', 'acknowledged', 'investigating', 'resolved']).default('active'),
  assignedTo: z.string().optional(),
  dueDate: z.date().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  category: z.enum(['authentication', 'authorization', 'data_protection', 'network', 'application', 'infrastructure']),
  source: z.string(),
  metadata: z.record(z.any()).optional(),
});

const ThreatIntelligenceSchema = z.object({
  type: z.enum(['ip_address', 'domain', 'email', 'file_hash', 'url']),
  value: z.string(),
  threatLevel: z.enum(['low', 'medium', 'high', 'critical']),
  category: z.enum(['malware', 'phishing', 'botnet', 'spam', 'exploit', 'c2_server']),
  source: z.string(),
  confidence: z.number().min(0).max(1),
  description: z.string(),
  tags: z.array(z.string()).optional(),
  isActive: z.boolean().default(true),
});

const SecurityDashboardSchema = z.object({
  name: z.string(),
  description: z.string(),
  widgets: z.array(z.object({
    id: z.string(),
    type: z.enum(['event_timeline', 'threat_map', 'alert_summary', 'user_activity', 'network_traffic', 'file_scan', 'vulnerability_scan', 'compliance_status']),
    title: z.string(),
    config: z.record(z.any()),
    position: z.object({
      x: z.number(),
      y: z.number(),
      w: z.number(),
      h: z.number(),
    }),
    refreshInterval: z.number().optional(),
  })),
  isPublic: z.boolean().default(false),
  tenantId: z.string().optional(),
});

// Security Events Routes
router.get('/events', tenantFilter, requirePermission('SECURITY_VIEW_EVENTS'), async (req, res) => {
  try {
    const { type, severity, status, startDate, endDate, tenantId } = req.query;
    
    const filters = {
      type: type as string,
      severity: severity as string,
      status: status as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      tenantId: tenantId as string || req.tenantId,
    };

    const events = await storage.getSecurityEvents(filters);
    res.json(events);
  } catch (error) {
    console.error('Failed to get security events:', error);
    res.status(500).json({ error: 'Failed to get security events' });
  }
});

router.get('/events/:id', tenantFilter, requirePermission('SECURITY_VIEW_EVENTS'), async (req, res) => {
  try {
    const { id } = req.params;
    const event = await storage.getSecurityEventById(id, req.tenantId);
    
    if (!event) {
      return res.status(404).json({ error: 'Security event not found' });
    }
    
    res.json(event);
  } catch (error) {
    console.error('Failed to get security event:', error);
    res.status(500).json({ error: 'Failed to get security event' });
  }
});

router.post('/events', tenantFilter, requirePermission('SECURITY_CREATE_EVENTS'), async (req, res) => {
  try {
    const eventData = SecurityEventSchema.parse(req.body);
    const event = await storage.createSecurityEvent({
      ...eventData,
      tenantId: req.tenantId,
    });
    
    await logAuditEvent({
      action: 'CREATE_SECURITY_EVENT',
      resourceType: 'security_event',
      resourceId: event.id,
      userId: req.user?.id,
      tenantId: req.tenantId,
      metadata: { eventType: event.type, severity: event.severity },
    });
    
    res.status(201).json(event);
  } catch (error) {
    console.error('Failed to create security event:', error);
    res.status(400).json({ error: 'Failed to create security event' });
  }
});

router.put('/events/:id', tenantFilter, requirePermission('SECURITY_UPDATE_EVENTS'), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const event = await storage.updateSecurityEvent(id, updates, req.tenantId);
    
    if (!event) {
      return res.status(404).json({ error: 'Security event not found' });
    }
    
    await logAuditEvent({
      action: 'UPDATE_SECURITY_EVENT',
      resourceType: 'security_event',
      resourceId: id,
      userId: req.user?.id,
      tenantId: req.tenantId,
      metadata: { updates },
    });
    
    res.json(event);
  } catch (error) {
    console.error('Failed to update security event:', error);
    res.status(500).json({ error: 'Failed to update security event' });
  }
});

router.delete('/events/:id', tenantFilter, requirePermission('SECURITY_DELETE_EVENTS'), async (req, res) => {
  try {
    const { id } = req.params;
    const success = await storage.deleteSecurityEvent(id, req.tenantId);
    
    if (!success) {
      return res.status(404).json({ error: 'Security event not found' });
    }
    
    await logAuditEvent({
      action: 'DELETE_SECURITY_EVENT',
      resourceType: 'security_event',
      resourceId: id,
      userId: req.user?.id,
      tenantId: req.tenantId,
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to delete security event:', error);
    res.status(500).json({ error: 'Failed to delete security event' });
  }
});

// Security Alerts Routes
router.get('/alerts', tenantFilter, requirePermission('SECURITY_VIEW_ALERTS'), async (req, res) => {
  try {
    const { severity, status, category, assignedTo, tenantId } = req.query;
    
    const filters = {
      severity: severity as string,
      status: status as string,
      category: category as string,
      assignedTo: assignedTo as string,
      tenantId: tenantId as string || req.tenantId,
    };

    const alerts = await storage.getSecurityAlerts(filters);
    res.json(alerts);
  } catch (error) {
    console.error('Failed to get security alerts:', error);
    res.status(500).json({ error: 'Failed to get security alerts' });
  }
});

router.get('/alerts/:id', tenantFilter, requirePermission('SECURITY_VIEW_ALERTS'), async (req, res) => {
  try {
    const { id } = req.params;
    const alert = await storage.getSecurityAlertById(id, req.tenantId);
    
    if (!alert) {
      return res.status(404).json({ error: 'Security alert not found' });
    }
    
    res.json(alert);
  } catch (error) {
    console.error('Failed to get security alert:', error);
    res.status(500).json({ error: 'Failed to get security alert' });
  }
});

router.post('/alerts', tenantFilter, requirePermission('SECURITY_CREATE_ALERTS'), async (req, res) => {
  try {
    const alertData = SecurityAlertSchema.parse(req.body);
    const alert = await storage.createSecurityAlert({
      ...alertData,
      tenantId: req.tenantId,
    });
    
    await logAuditEvent({
      action: 'CREATE_SECURITY_ALERT',
      resourceType: 'security_alert',
      resourceId: alert.id,
      userId: req.user?.id,
      tenantId: req.tenantId,
      metadata: { alertType: alert.category, severity: alert.severity },
    });
    
    res.status(201).json(alert);
  } catch (error) {
    console.error('Failed to create security alert:', error);
    res.status(400).json({ error: 'Failed to create security alert' });
  }
});

router.put('/alerts/:id', tenantFilter, requirePermission('SECURITY_UPDATE_ALERTS'), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const alert = await storage.updateSecurityAlert(id, updates, req.tenantId);
    
    if (!alert) {
      return res.status(404).json({ error: 'Security alert not found' });
    }
    
    await logAuditEvent({
      action: 'UPDATE_SECURITY_ALERT',
      resourceType: 'security_alert',
      resourceId: id,
      userId: req.user?.id,
      tenantId: req.tenantId,
      metadata: { updates },
    });
    
    res.json(alert);
  } catch (error) {
    console.error('Failed to update security alert:', error);
    res.status(500).json({ error: 'Failed to update security alert' });
  }
});

router.post('/alerts/:id/acknowledge', tenantFilter, requirePermission('SECURITY_UPDATE_ALERTS'), async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    
    const alert = await storage.updateSecurityAlert(id, {
      status: 'acknowledged',
      assignedTo: userId,
    }, req.tenantId);
    
    if (!alert) {
      return res.status(404).json({ error: 'Security alert not found' });
    }
    
    await logAuditEvent({
      action: 'ACKNOWLEDGE_SECURITY_ALERT',
      resourceType: 'security_alert',
      resourceId: id,
      userId: req.user?.id,
      tenantId: req.tenantId,
      metadata: { acknowledgedBy: userId },
    });
    
    res.json(alert);
  } catch (error) {
    console.error('Failed to acknowledge security alert:', error);
    res.status(500).json({ error: 'Failed to acknowledge security alert' });
  }
});

router.post('/alerts/:id/resolve', tenantFilter, requirePermission('SECURITY_UPDATE_ALERTS'), async (req, res) => {
  try {
    const { id } = req.params;
    const { resolution, userId } = req.body;
    
    const alert = await storage.updateSecurityAlert(id, {
      status: 'resolved',
      assignedTo: userId,
      resolution,
    }, req.tenantId);
    
    if (!alert) {
      return res.status(404).json({ error: 'Security alert not found' });
    }
    
    await logAuditEvent({
      action: 'RESOLVE_SECURITY_ALERT',
      resourceType: 'security_alert',
      resourceId: id,
      userId: req.user?.id,
      tenantId: req.tenantId,
      metadata: { resolvedBy: userId, resolution },
    });
    
    res.json(alert);
  } catch (error) {
    console.error('Failed to resolve security alert:', error);
    res.status(500).json({ error: 'Failed to resolve security alert' });
  }
});

// Threat Intelligence Routes
router.get('/threat-intelligence', tenantFilter, requirePermission('SECURITY_VIEW_THREATS'), async (req, res) => {
  try {
    const { type, threatLevel, category, isActive, tenantId } = req.query;
    
    const filters = {
      type: type as string,
      threatLevel: threatLevel as string,
      category: category as string,
      isActive: isActive ? isActive === 'true' : undefined,
      tenantId: tenantId as string || req.tenantId,
    };

    const threats = await storage.getThreatIntelligence(filters);
    res.json(threats);
  } catch (error) {
    console.error('Failed to get threat intelligence:', error);
    res.status(500).json({ error: 'Failed to get threat intelligence' });
  }
});

router.post('/threat-intelligence', tenantFilter, requirePermission('SECURITY_MANAGE_THREATS'), async (req, res) => {
  try {
    const threatData = ThreatIntelligenceSchema.parse(req.body);
    const threat = await storage.addThreatIntelligence({
      ...threatData,
      tenantId: req.tenantId,
    });
    
    await logAuditEvent({
      action: 'ADD_THREAT_INTELLIGENCE',
      resourceType: 'threat_intelligence',
      resourceId: threat.id,
      userId: req.user?.id,
      tenantId: req.tenantId,
      metadata: { threatType: threat.type, threatLevel: threat.threatLevel },
    });
    
    res.status(201).json(threat);
  } catch (error) {
    console.error('Failed to add threat intelligence:', error);
    res.status(400).json({ error: 'Failed to add threat intelligence' });
  }
});

router.put('/threat-intelligence/:id', tenantFilter, requirePermission('SECURITY_MANAGE_THREATS'), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const threat = await storage.updateThreatIntelligence(id, updates, req.tenantId);
    
    if (!threat) {
      return res.status(404).json({ error: 'Threat intelligence not found' });
    }
    
    await logAuditEvent({
      action: 'UPDATE_THREAT_INTELLIGENCE',
      resourceType: 'threat_intelligence',
      resourceId: id,
      userId: req.user?.id,
      tenantId: req.tenantId,
      metadata: { updates },
    });
    
    res.json(threat);
  } catch (error) {
    console.error('Failed to update threat intelligence:', error);
    res.status(500).json({ error: 'Failed to update threat intelligence' });
  }
});

router.delete('/threat-intelligence/:id', tenantFilter, requirePermission('SECURITY_MANAGE_THREATS'), async (req, res) => {
  try {
    const { id } = req.params;
    const success = await storage.deleteThreatIntelligence(id, req.tenantId);
    
    if (!success) {
      return res.status(404).json({ error: 'Threat intelligence not found' });
    }
    
    await logAuditEvent({
      action: 'DELETE_THREAT_INTELLIGENCE',
      resourceType: 'threat_intelligence',
      resourceId: id,
      userId: req.user?.id,
      tenantId: req.tenantId,
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to delete threat intelligence:', error);
    res.status(500).json({ error: 'Failed to delete threat intelligence' });
  }
});

// Security Dashboards Routes
router.get('/dashboards', tenantFilter, requirePermission('SECURITY_VIEW_DASHBOARDS'), async (req, res) => {
  try {
    const dashboards = await storage.getSecurityDashboards(req.tenantId);
    res.json(dashboards);
  } catch (error) {
    console.error('Failed to get security dashboards:', error);
    res.status(500).json({ error: 'Failed to get security dashboards' });
  }
});

router.get('/dashboards/:id', tenantFilter, requirePermission('SECURITY_VIEW_DASHBOARDS'), async (req, res) => {
  try {
    const { id } = req.params;
    const dashboard = await storage.getSecurityDashboardById(id, req.tenantId);
    
    if (!dashboard) {
      return res.status(404).json({ error: 'Security dashboard not found' });
    }
    
    res.json(dashboard);
  } catch (error) {
    console.error('Failed to get security dashboard:', error);
    res.status(500).json({ error: 'Failed to get security dashboard' });
  }
});

router.post('/dashboards', tenantFilter, requirePermission('SECURITY_CREATE_DASHBOARDS'), async (req, res) => {
  try {
    const dashboardData = SecurityDashboardSchema.parse(req.body);
    const dashboard = await storage.createSecurityDashboard({
      ...dashboardData,
      createdBy: req.user?.id,
      tenantId: req.tenantId,
    });
    
    await logAuditEvent({
      action: 'CREATE_SECURITY_DASHBOARD',
      resourceType: 'security_dashboard',
      resourceId: dashboard.id,
      userId: req.user?.id,
      tenantId: req.tenantId,
    });
    
    res.status(201).json(dashboard);
  } catch (error) {
    console.error('Failed to create security dashboard:', error);
    res.status(400).json({ error: 'Failed to create security dashboard' });
  }
});

router.put('/dashboards/:id', tenantFilter, requirePermission('SECURITY_UPDATE_DASHBOARDS'), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const dashboard = await storage.updateSecurityDashboard(id, updates, req.tenantId);
    
    if (!dashboard) {
      return res.status(404).json({ error: 'Security dashboard not found' });
    }
    
    await logAuditEvent({
      action: 'UPDATE_SECURITY_DASHBOARD',
      resourceType: 'security_dashboard',
      resourceId: id,
      userId: req.user?.id,
      tenantId: req.tenantId,
    });
    
    res.json(dashboard);
  } catch (error) {
    console.error('Failed to update security dashboard:', error);
    res.status(500).json({ error: 'Failed to update security dashboard' });
  }
});

router.delete('/dashboards/:id', tenantFilter, requirePermission('SECURITY_DELETE_DASHBOARDS'), async (req, res) => {
  try {
    const { id } = req.params;
    const success = await storage.deleteSecurityDashboard(id, req.tenantId);
    
    if (!success) {
      return res.status(404).json({ error: 'Security dashboard not found' });
    }
    
    await logAuditEvent({
      action: 'DELETE_SECURITY_DASHBOARD',
      resourceType: 'security_dashboard',
      resourceId: id,
      userId: req.user?.id,
      tenantId: req.tenantId,
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to delete security dashboard:', error);
    res.status(500).json({ error: 'Failed to delete security dashboard' });
  }
});

// Security Reports Routes
router.get('/reports', tenantFilter, requirePermission('SECURITY_VIEW_REPORTS'), async (req, res) => {
  try {
    const reports = await storage.getSecurityReports(req.tenantId);
    res.json(reports);
  } catch (error) {
    console.error('Failed to get security reports:', error);
    res.status(500).json({ error: 'Failed to get security reports' });
  }
});

router.get('/reports/:id', tenantFilter, requirePermission('SECURITY_VIEW_REPORTS'), async (req, res) => {
  try {
    const { id } = req.params;
    const report = await storage.getSecurityReportById(id, req.tenantId);
    
    if (!report) {
      return res.status(404).json({ error: 'Security report not found' });
    }
    
    res.json(report);
  } catch (error) {
    console.error('Failed to get security report:', error);
    res.status(500).json({ error: 'Failed to get security report' });
  }
});

router.post('/reports/generate', tenantFilter, requirePermission('SECURITY_GENERATE_REPORTS'), async (req, res) => {
  try {
    const { name, type, period, generatedBy, tenantId } = req.body;
    
    const report = await storage.generateSecurityReport({
      name,
      type,
      period,
      generatedBy,
      tenantId: tenantId || req.tenantId,
    });
    
    await logAuditEvent({
      action: 'GENERATE_SECURITY_REPORT',
      resourceType: 'security_report',
      resourceId: report.id,
      userId: req.user?.id,
      tenantId: req.tenantId,
      metadata: { reportType: type, period },
    });
    
    res.status(201).json(report);
  } catch (error) {
    console.error('Failed to generate security report:', error);
    res.status(500).json({ error: 'Failed to generate security report' });
  }
});

// Security Analytics Routes
router.get('/analytics', tenantFilter, requirePermission('SECURITY_VIEW_ANALYTICS'), async (req, res) => {
  try {
    const { start, end, tenantId } = req.query;
    
    const period = {
      start: new Date(start as string),
      end: new Date(end as string),
    };
    
    const analytics = await storage.getSecurityAnalytics(period, tenantId as string || req.tenantId);
    res.json(analytics);
  } catch (error) {
    console.error('Failed to get security analytics:', error);
    res.status(500).json({ error: 'Failed to get security analytics' });
  }
});

router.get('/metrics', tenantFilter, requirePermission('SECURITY_VIEW_METRICS'), async (req, res) => {
  try {
    const metrics = await storage.getSecurityMetrics(req.tenantId);
    res.json(metrics);
  } catch (error) {
    console.error('Failed to get security metrics:', error);
    res.status(500).json({ error: 'Failed to get security metrics' });
  }
});

router.get('/threat-map', tenantFilter, requirePermission('SECURITY_VIEW_THREATS'), async (req, res) => {
  try {
    const threatMap = await storage.getThreatMap(req.tenantId);
    res.json(threatMap);
  } catch (error) {
    console.error('Failed to get threat map:', error);
    res.status(500).json({ error: 'Failed to get threat map' });
  }
});

// Security Actions Routes
router.post('/actions', tenantFilter, requirePermission('SECURITY_EXECUTE_ACTIONS'), async (req, res) => {
  try {
    const actionData = req.body;
    const action = await storage.executeSecurityAction({
      ...actionData,
      tenantId: req.tenantId,
    });
    
    await logAuditEvent({
      action: 'EXECUTE_SECURITY_ACTION',
      resourceType: 'security_action',
      resourceId: action.id,
      userId: req.user?.id,
      tenantId: req.tenantId,
      metadata: { actionType: action.type },
    });
    
    res.status(201).json(action);
  } catch (error) {
    console.error('Failed to execute security action:', error);
    res.status(500).json({ error: 'Failed to execute security action' });
  }
});

router.get('/actions', tenantFilter, requirePermission('SECURITY_VIEW_ACTIONS'), async (req, res) => {
  try {
    const { eventId } = req.query;
    const actions = await storage.getSecurityActions(eventId as string);
    res.json(actions);
  } catch (error) {
    console.error('Failed to get security actions:', error);
    res.status(500).json({ error: 'Failed to get security actions' });
  }
});

// Automated Response Routes
router.get('/automated-response', tenantFilter, requirePermission('SECURITY_MANAGE_AUTOMATION'), async (req, res) => {
  try {
    const rules = await storage.getAutomatedResponseRules(req.tenantId);
    res.json(rules);
  } catch (error) {
    console.error('Failed to get automated response rules:', error);
    res.status(500).json({ error: 'Failed to get automated response rules' });
  }
});

router.post('/automated-response', tenantFilter, requirePermission('SECURITY_MANAGE_AUTOMATION'), async (req, res) => {
  try {
    const ruleData = req.body;
    const rule = await storage.createAutomatedResponseRule({
      ...ruleData,
      tenantId: req.tenantId,
    });
    
    await logAuditEvent({
      action: 'CREATE_AUTOMATED_RESPONSE_RULE',
      resourceType: 'automated_response_rule',
      resourceId: rule.id,
      userId: req.user?.id,
      tenantId: req.tenantId,
    });
    
    res.status(201).json(rule);
  } catch (error) {
    console.error('Failed to create automated response rule:', error);
    res.status(500).json({ error: 'Failed to create automated response rule' });
  }
});

router.put('/automated-response/:id', tenantFilter, requirePermission('SECURITY_MANAGE_AUTOMATION'), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const rule = await storage.updateAutomatedResponseRule(id, updates, req.tenantId);
    
    if (!rule) {
      return res.status(404).json({ error: 'Automated response rule not found' });
    }
    
    await logAuditEvent({
      action: 'UPDATE_AUTOMATED_RESPONSE_RULE',
      resourceType: 'automated_response_rule',
      resourceId: id,
      userId: req.user?.id,
      tenantId: req.tenantId,
    });
    
    res.json(rule);
  } catch (error) {
    console.error('Failed to update automated response rule:', error);
    res.status(500).json({ error: 'Failed to update automated response rule' });
  }
});

router.delete('/automated-response/:id', tenantFilter, requirePermission('SECURITY_MANAGE_AUTOMATION'), async (req, res) => {
  try {
    const { id } = req.params;
    const success = await storage.deleteAutomatedResponseRule(id, req.tenantId);
    
    if (!success) {
      return res.status(404).json({ error: 'Automated response rule not found' });
    }
    
    await logAuditEvent({
      action: 'DELETE_AUTOMATED_RESPONSE_RULE',
      resourceType: 'automated_response_rule',
      resourceId: id,
      userId: req.user?.id,
      tenantId: req.tenantId,
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to delete automated response rule:', error);
    res.status(500).json({ error: 'Failed to delete automated response rule' });
  }
});

// Compliance Routes
router.get('/compliance', tenantFilter, requirePermission('SECURITY_VIEW_COMPLIANCE'), async (req, res) => {
  try {
    const compliance = await storage.getComplianceStatus(req.tenantId);
    res.json(compliance);
  } catch (error) {
    console.error('Failed to get compliance status:', error);
    res.status(500).json({ error: 'Failed to get compliance status' });
  }
});

router.post('/compliance/check/:checkType', tenantFilter, requirePermission('SECURITY_RUN_COMPLIANCE'), async (req, res) => {
  try {
    const { checkType } = req.params;
    const result = await storage.runComplianceCheck(checkType, req.tenantId);
    
    await logAuditEvent({
      action: 'RUN_COMPLIANCE_CHECK',
      resourceType: 'compliance_check',
      resourceId: checkType,
      userId: req.user?.id,
      tenantId: req.tenantId,
      metadata: { checkType },
    });
    
    res.json(result);
  } catch (error) {
    console.error('Failed to run compliance check:', error);
    res.status(500).json({ error: 'Failed to run compliance check' });
  }
});

// Vulnerability Management Routes
router.get('/vulnerabilities', tenantFilter, requirePermission('SECURITY_VIEW_VULNERABILITIES'), async (req, res) => {
  try {
    const { severity, status, category, tenantId } = req.query;
    
    const filters = {
      severity: severity as string,
      status: status as string,
      category: category as string,
      tenantId: tenantId as string || req.tenantId,
    };

    const vulnerabilities = await storage.getVulnerabilities(filters);
    res.json(vulnerabilities);
  } catch (error) {
    console.error('Failed to get vulnerabilities:', error);
    res.status(500).json({ error: 'Failed to get vulnerabilities' });
  }
});

router.post('/vulnerabilities/scan', tenantFilter, requirePermission('SECURITY_SCAN_VULNERABILITIES'), async (req, res) => {
  try {
    const { scanType, target, tenantId } = req.body;
    
    const result = await storage.scanForVulnerabilities(scanType, target, tenantId || req.tenantId);
    
    await logAuditEvent({
      action: 'SCAN_VULNERABILITIES',
      resourceType: 'vulnerability_scan',
      resourceId: result.id,
      userId: req.user?.id,
      tenantId: req.tenantId,
      metadata: { scanType, target },
    });
    
    res.json(result);
  } catch (error) {
    console.error('Failed to scan vulnerabilities:', error);
    res.status(500).json({ error: 'Failed to scan vulnerabilities' });
  }
});

export default router;
