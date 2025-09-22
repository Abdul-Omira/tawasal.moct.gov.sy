/**
 * Syrian Ministry of Communication - Citizen Engagement Platform
 * Webhook Management API Routes
 * 
 * @author Abdulwahab Omira <abdul@omiratech.com>
 * @version 1.0.0
 * @license MIT
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { storage } from '../database/storage';
import { requirePermission } from '../middleware/rbac';
import { tenantFilter } from '../middleware/tenant';
import { logAuditEvent } from '../services/auditService';
import { generateId } from '../utils/helpers';

const router = Router();

// Webhook validation schemas
const WebhookSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  url: z.string().url('Valid URL is required'),
  events: z.array(z.string()).min(1, 'At least one event is required'),
  secret: z.string().optional(),
  isActive: z.boolean().default(true),
  retryPolicy: z.object({
    maxRetries: z.number().min(0).max(10),
    retryDelay: z.number().min(100).max(60000),
    backoffMultiplier: z.number().min(1).max(5),
  }).default({
    maxRetries: 3,
    retryDelay: 1000,
    backoffMultiplier: 2,
  }),
  headers: z.record(z.string()).optional().default({}),
  filters: z.object({
    formIds: z.array(z.string()).optional().default([]),
    eventTypes: z.array(z.string()).optional().default([]),
    conditions: z.record(z.any()).optional().default({}),
  }).optional().default({
    formIds: [],
    eventTypes: [],
    conditions: {},
  }),
});

const WebhookDeliverySchema = z.object({
  webhookId: z.string(),
  eventType: z.string(),
  payload: z.any(),
  status: z.enum(['pending', 'delivered', 'failed', 'retrying']).default('pending'),
  attempts: z.number().default(0),
  maxAttempts: z.number().default(3),
  nextRetryAt: z.date().optional(),
  response: z.object({
    statusCode: z.number(),
    headers: z.record(z.string()),
    body: z.string(),
  }).optional(),
  error: z.string().optional(),
  deliveredAt: z.date().optional(),
});

// Available webhook events
const AVAILABLE_EVENTS = [
  'form.created',
  'form.updated',
  'form.deleted',
  'form.published',
  'form.unpublished',
  'form.archived',
  'submission.created',
  'submission.updated',
  'submission.deleted',
  'submission.approved',
  'submission.rejected',
  'user.created',
  'user.updated',
  'user.deleted',
  'ministry.created',
  'ministry.updated',
  'ministry.deleted',
  'analytics.report_generated',
  'security.alert_triggered',
  'system.maintenance_scheduled',
];

// Webhook Management Routes
router.get('/', requirePermission('WEBHOOKS_READ'), tenantFilter, async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.query;
    const webhooks = await storage.getWebhooks(tenantId as string);
    res.json(webhooks);
  } catch (error) {
    console.error('Error fetching webhooks:', error);
    res.status(500).json({ error: 'Failed to fetch webhooks' });
  }
});

router.get('/:id', requirePermission('WEBHOOKS_READ'), tenantFilter, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { tenantId } = req.query;
    const webhook = await storage.getWebhookById(id, tenantId as string);
    
    if (!webhook) {
      return res.status(404).json({ error: 'Webhook not found' });
    }
    
    res.json(webhook);
  } catch (error) {
    console.error('Error fetching webhook:', error);
    res.status(500).json({ error: 'Failed to fetch webhook' });
  }
});

router.post('/', requirePermission('WEBHOOKS_CREATE'), tenantFilter, async (req: Request, res: Response) => {
  try {
    const webhookData = WebhookSchema.parse(req.body);
    const { tenantId } = req.query;
    
    const webhook = await storage.createWebhook({
      ...webhookData,
      tenantId: tenantId as string,
    });
    
    await logAuditEvent({
      action: 'webhook.created',
      resourceType: 'webhook',
      resourceId: webhook.id,
      details: { name: webhook.name, url: webhook.url },
      userId: req.user?.id,
      tenantId: tenantId as string,
    });
    
    res.status(201).json(webhook);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Error creating webhook:', error);
    res.status(500).json({ error: 'Failed to create webhook' });
  }
});

router.put('/:id', requirePermission('WEBHOOKS_UPDATE'), tenantFilter, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { tenantId } = req.query;
    const updates = WebhookSchema.partial().parse(req.body);
    
    const webhook = await storage.updateWebhook(id, updates, tenantId as string);
    
    if (!webhook) {
      return res.status(404).json({ error: 'Webhook not found' });
    }
    
    await logAuditEvent({
      action: 'webhook.updated',
      resourceType: 'webhook',
      resourceId: id,
      details: updates,
      userId: req.user?.id,
      tenantId: tenantId as string,
    });
    
    res.json(webhook);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Error updating webhook:', error);
    res.status(500).json({ error: 'Failed to update webhook' });
  }
});

router.delete('/:id', requirePermission('WEBHOOKS_DELETE'), tenantFilter, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { tenantId } = req.query;
    
    const success = await storage.deleteWebhook(id, tenantId as string);
    
    if (!success) {
      return res.status(404).json({ error: 'Webhook not found' });
    }
    
    await logAuditEvent({
      action: 'webhook.deleted',
      resourceType: 'webhook',
      resourceId: id,
      userId: req.user?.id,
      tenantId: tenantId as string,
    });
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting webhook:', error);
    res.status(500).json({ error: 'Failed to delete webhook' });
  }
});

// Webhook Delivery Routes
router.get('/deliveries', requirePermission('WEBHOOKS_READ'), tenantFilter, async (req: Request, res: Response) => {
  try {
    const { webhookId, status, eventType, startDate, endDate } = req.query;
    const filters = {
      webhookId: webhookId as string,
      status: status as string,
      eventType: eventType as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    };
    
    const deliveries = await storage.getWebhookDeliveries(filters);
    res.json(deliveries);
  } catch (error) {
    console.error('Error fetching webhook deliveries:', error);
    res.status(500).json({ error: 'Failed to fetch webhook deliveries' });
  }
});

router.get('/deliveries/:id', requirePermission('WEBHOOKS_READ'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const delivery = await storage.getWebhookDeliveryById(id);
    
    if (!delivery) {
      return res.status(404).json({ error: 'Webhook delivery not found' });
    }
    
    res.json(delivery);
  } catch (error) {
    console.error('Error fetching webhook delivery:', error);
    res.status(500).json({ error: 'Failed to fetch webhook delivery' });
  }
});

router.post('/deliveries/:id/retry', requirePermission('WEBHOOKS_UPDATE'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const delivery = await storage.retryWebhookDelivery(id);
    
    if (!delivery) {
      return res.status(404).json({ error: 'Webhook delivery not found' });
    }
    
    await logAuditEvent({
      action: 'webhook.delivery_retried',
      resourceType: 'webhook_delivery',
      resourceId: id,
      userId: req.user?.id,
    });
    
    res.json(delivery);
  } catch (error) {
    console.error('Error retrying webhook delivery:', error);
    res.status(500).json({ error: 'Failed to retry webhook delivery' });
  }
});

// Webhook Testing Routes
router.post('/:id/test', requirePermission('WEBHOOKS_READ'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { testData } = req.body;
    
    const result = await storage.testWebhook(id, testData);
    res.json(result);
  } catch (error) {
    console.error('Error testing webhook:', error);
    res.status(500).json({ error: 'Failed to test webhook' });
  }
});

router.post('/test-url', requirePermission('WEBHOOKS_READ'), async (req: Request, res: Response) => {
  try {
    const { url, payload, headers } = req.body;
    
    const result = await storage.testWebhookUrl(url, payload, headers);
    res.json(result);
  } catch (error) {
    console.error('Error testing webhook URL:', error);
    res.status(500).json({ error: 'Failed to test webhook URL' });
  }
});

// Webhook Statistics Routes
router.get('/stats', requirePermission('WEBHOOKS_READ'), tenantFilter, async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.query;
    const stats = await storage.getWebhookStats(tenantId as string);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching webhook stats:', error);
    res.status(500).json({ error: 'Failed to fetch webhook stats' });
  }
});

router.get('/analytics', requirePermission('WEBHOOKS_READ'), tenantFilter, async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, tenantId } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }
    
    const period = {
      start: new Date(startDate as string),
      end: new Date(endDate as string),
    };
    
    const analytics = await storage.getWebhookAnalytics(period, tenantId as string);
    res.json(analytics);
  } catch (error) {
    console.error('Error fetching webhook analytics:', error);
    res.status(500).json({ error: 'Failed to fetch webhook analytics' });
  }
});

// Event Management Routes
router.get('/events', async (req: Request, res: Response) => {
  try {
    res.json(AVAILABLE_EVENTS);
  } catch (error) {
    console.error('Error fetching available events:', error);
    res.status(500).json({ error: 'Failed to fetch available events' });
  }
});

router.post('/:id/trigger', requirePermission('WEBHOOKS_TRIGGER'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const event = req.body;
    
    const success = await storage.triggerWebhook(id, event);
    
    if (!success) {
      return res.status(404).json({ error: 'Webhook not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error triggering webhook:', error);
    res.status(500).json({ error: 'Failed to trigger webhook' });
  }
});

// Webhook Health Routes
router.get('/:id/health', requirePermission('WEBHOOKS_READ'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const health = await storage.getWebhookHealth(id);
    res.json(health);
  } catch (error) {
    console.error('Error fetching webhook health:', error);
    res.status(500).json({ error: 'Failed to fetch webhook health' });
  }
});

// Bulk Operations Routes
router.put('/bulk-update', requirePermission('WEBHOOKS_UPDATE'), tenantFilter, async (req: Request, res: Response) => {
  try {
    const { updates } = req.body;
    const { tenantId } = req.query;
    
    const results = await storage.bulkUpdateWebhooks(updates, tenantId as string);
    res.json(results);
  } catch (error) {
    console.error('Error bulk updating webhooks:', error);
    res.status(500).json({ error: 'Failed to bulk update webhooks' });
  }
});

router.delete('/bulk-delete', requirePermission('WEBHOOKS_DELETE'), tenantFilter, async (req: Request, res: Response) => {
  try {
    const { ids } = req.body;
    const { tenantId } = req.query;
    
    const success = await storage.bulkDeleteWebhooks(ids, tenantId as string);
    res.json({ success });
  } catch (error) {
    console.error('Error bulk deleting webhooks:', error);
    res.status(500).json({ error: 'Failed to bulk delete webhooks' });
  }
});

// Webhook Templates Routes
router.get('/templates', async (req: Request, res: Response) => {
  try {
    const templates = await storage.getWebhookTemplates();
    res.json(templates);
  } catch (error) {
    console.error('Error fetching webhook templates:', error);
    res.status(500).json({ error: 'Failed to fetch webhook templates' });
  }
});

router.post('/templates/:templateId/create', requirePermission('WEBHOOKS_CREATE'), tenantFilter, async (req: Request, res: Response) => {
  try {
    const { templateId } = req.params;
    const { tenantId } = req.query;
    const config = req.body;
    
    const webhook = await storage.createWebhookFromTemplate(templateId, {
      ...config,
      tenantId: tenantId as string,
    });
    
    res.status(201).json(webhook);
  } catch (error) {
    console.error('Error creating webhook from template:', error);
    res.status(500).json({ error: 'Failed to create webhook from template' });
  }
});

export default router;
