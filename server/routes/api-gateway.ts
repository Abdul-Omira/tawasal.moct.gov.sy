import express from 'express';
import { z } from 'zod';
import { storage } from '../database/storage';
import { requirePermission } from '../middleware/rbac';
import { tenantFilter } from '../middleware/tenant';
import { logAuditEvent } from '../middleware/auditLogging';
import crypto from 'crypto';

const router = express.Router();

// API Key schemas
const ApiKeySchema = z.object({
  name: z.string().min(1),
  permissions: z.array(z.string()),
  rateLimit: z.object({
    requests: z.number().min(1),
    window: z.number().min(1),
  }),
  isActive: z.boolean().default(true),
  expiresAt: z.date().optional(),
  tenantId: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

const RateLimitSchema = z.object({
  tenantId: z.string().optional(),
  apiKeyId: z.string().optional(),
  endpoint: z.string().optional(),
  requests: z.number().min(1),
  window: z.number().min(1),
  isActive: z.boolean().default(true),
});

const ApiDocumentationSchema = z.object({
  title: z.string().min(1),
  description: z.string(),
  version: z.string(),
  baseUrl: z.string().url(),
  endpoints: z.array(z.object({
    id: z.string(),
    path: z.string(),
    method: z.string(),
    summary: z.string(),
    description: z.string(),
    parameters: z.array(z.any()),
    requestBody: z.any().optional(),
    responses: z.array(z.any()),
    tags: z.array(z.string()),
    deprecated: z.boolean().default(false),
    rateLimit: z.any().optional(),
  })),
  schemas: z.array(z.any()),
  examples: z.array(z.any()),
  isPublic: z.boolean().default(false),
  tenantId: z.string().optional(),
});

// API Key Management Routes
router.get('/keys', tenantFilter, requirePermission('API_GATEWAY_VIEW_KEYS'), async (req, res) => {
  try {
    const { tenantId } = req.query;
    const keys = await storage.getApiKeys(tenantId as string || req.tenantId);
    res.json(keys);
  } catch (error) {
    console.error('Failed to get API keys:', error);
    res.status(500).json({ error: 'Failed to get API keys' });
  }
});

router.get('/keys/:id', tenantFilter, requirePermission('API_GATEWAY_VIEW_KEYS'), async (req, res) => {
  try {
    const { id } = req.params;
    const key = await storage.getApiKeyById(id, req.tenantId);
    
    if (!key) {
      return res.status(404).json({ error: 'API key not found' });
    }
    
    res.json(key);
  } catch (error) {
    console.error('Failed to get API key:', error);
    res.status(500).json({ error: 'Failed to get API key' });
  }
});

router.post('/keys', tenantFilter, requirePermission('API_GATEWAY_CREATE_KEYS'), async (req, res) => {
  try {
    const keyData = ApiKeySchema.parse(req.body);
    
    // Generate API key and secret
    const apiKey = crypto.randomBytes(32).toString('hex');
    const secret = crypto.randomBytes(32).toString('hex');
    
    const key = await storage.createApiKey({
      ...keyData,
      key: apiKey,
      secret: secret,
      createdBy: req.user?.id,
      tenantId: req.tenantId,
    });
    
    await logAuditEvent({
      action: 'CREATE_API_KEY',
      resourceType: 'api_key',
      resourceId: key.id,
      userId: req.user?.id,
      tenantId: req.tenantId,
      metadata: { keyName: key.name },
    });
    
    res.status(201).json(key);
  } catch (error) {
    console.error('Failed to create API key:', error);
    res.status(400).json({ error: 'Failed to create API key' });
  }
});

router.put('/keys/:id', tenantFilter, requirePermission('API_GATEWAY_UPDATE_KEYS'), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const key = await storage.updateApiKey(id, updates, req.tenantId);
    
    if (!key) {
      return res.status(404).json({ error: 'API key not found' });
    }
    
    await logAuditEvent({
      action: 'UPDATE_API_KEY',
      resourceType: 'api_key',
      resourceId: id,
      userId: req.user?.id,
      tenantId: req.tenantId,
      metadata: { updates },
    });
    
    res.json(key);
  } catch (error) {
    console.error('Failed to update API key:', error);
    res.status(500).json({ error: 'Failed to update API key' });
  }
});

router.delete('/keys/:id', tenantFilter, requirePermission('API_GATEWAY_DELETE_KEYS'), async (req, res) => {
  try {
    const { id } = req.params;
    const success = await storage.deleteApiKey(id, req.tenantId);
    
    if (!success) {
      return res.status(404).json({ error: 'API key not found' });
    }
    
    await logAuditEvent({
      action: 'DELETE_API_KEY',
      resourceType: 'api_key',
      resourceId: id,
      userId: req.user?.id,
      tenantId: req.tenantId,
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to delete API key:', error);
    res.status(500).json({ error: 'Failed to delete API key' });
  }
});

router.post('/keys/:id/regenerate', tenantFilter, requirePermission('API_GATEWAY_UPDATE_KEYS'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Generate new API key and secret
    const apiKey = crypto.randomBytes(32).toString('hex');
    const secret = crypto.randomBytes(32).toString('hex');
    
    const key = await storage.updateApiKey(id, {
      key: apiKey,
      secret: secret,
    }, req.tenantId);
    
    if (!key) {
      return res.status(404).json({ error: 'API key not found' });
    }
    
    await logAuditEvent({
      action: 'REGENERATE_API_KEY',
      resourceType: 'api_key',
      resourceId: id,
      userId: req.user?.id,
      tenantId: req.tenantId,
    });
    
    res.json(key);
  } catch (error) {
    console.error('Failed to regenerate API key:', error);
    res.status(500).json({ error: 'Failed to regenerate API key' });
  }
});

router.post('/keys/validate', async (req, res) => {
  try {
    const { key } = req.body;
    
    if (!key) {
      return res.status(400).json({ valid: false, error: 'API key is required' });
    }
    
    const apiKey = await storage.validateApiKey(key);
    
    if (!apiKey) {
      return res.json({ valid: false, error: 'Invalid API key' });
    }
    
    if (!apiKey.isActive) {
      return res.json({ valid: false, error: 'API key is inactive' });
    }
    
    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      return res.json({ valid: false, error: 'API key has expired' });
    }
    
    // Update last used timestamp
    await storage.updateApiKey(apiKey.id, { lastUsed: new Date() }, req.tenantId);
    
    res.json({ valid: true, apiKey });
  } catch (error) {
    console.error('Failed to validate API key:', error);
    res.status(500).json({ valid: false, error: 'Failed to validate API key' });
  }
});

// API Usage Tracking Routes
router.get('/usage', tenantFilter, requirePermission('API_GATEWAY_VIEW_USAGE'), async (req, res) => {
  try {
    const { apiKeyId, endpoint, startDate, endDate, tenantId } = req.query;
    
    const filters = {
      apiKeyId: apiKeyId as string,
      endpoint: endpoint as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      tenantId: tenantId as string || req.tenantId,
    };

    const usage = await storage.getApiUsage(filters);
    res.json(usage);
  } catch (error) {
    console.error('Failed to get API usage:', error);
    res.status(500).json({ error: 'Failed to get API usage' });
  }
});

router.get('/usage/stats', tenantFilter, requirePermission('API_GATEWAY_VIEW_USAGE'), async (req, res) => {
  try {
    const stats = await storage.getApiUsageStats(req.tenantId);
    res.json(stats);
  } catch (error) {
    console.error('Failed to get API usage stats:', error);
    res.status(500).json({ error: 'Failed to get API usage stats' });
  }
});

router.get('/usage/analytics', tenantFilter, requirePermission('API_GATEWAY_VIEW_ANALYTICS'), async (req, res) => {
  try {
    const { start, end, tenantId } = req.query;
    
    const period = {
      start: new Date(start as string),
      end: new Date(end as string),
    };
    
    const analytics = await storage.getApiUsageAnalytics(period, tenantId as string || req.tenantId);
    res.json(analytics);
  } catch (error) {
    console.error('Failed to get API usage analytics:', error);
    res.status(500).json({ error: 'Failed to get API usage analytics' });
  }
});

// Rate Limiting Routes
router.get('/rate-limits', tenantFilter, requirePermission('API_GATEWAY_VIEW_RATE_LIMITS'), async (req, res) => {
  try {
    const limits = await storage.getRateLimits(req.tenantId);
    res.json(limits);
  } catch (error) {
    console.error('Failed to get rate limits:', error);
    res.status(500).json({ error: 'Failed to get rate limits' });
  }
});

router.get('/rate-limits/:id', tenantFilter, requirePermission('API_GATEWAY_VIEW_RATE_LIMITS'), async (req, res) => {
  try {
    const { id } = req.params;
    const limit = await storage.getRateLimitById(id, req.tenantId);
    
    if (!limit) {
      return res.status(404).json({ error: 'Rate limit not found' });
    }
    
    res.json(limit);
  } catch (error) {
    console.error('Failed to get rate limit:', error);
    res.status(500).json({ error: 'Failed to get rate limit' });
  }
});

router.post('/rate-limits', tenantFilter, requirePermission('API_GATEWAY_CREATE_RATE_LIMITS'), async (req, res) => {
  try {
    const limitData = RateLimitSchema.parse(req.body);
    const limit = await storage.createRateLimit({
      ...limitData,
      tenantId: req.tenantId,
    });
    
    await logAuditEvent({
      action: 'CREATE_RATE_LIMIT',
      resourceType: 'rate_limit',
      resourceId: limit.id,
      userId: req.user?.id,
      tenantId: req.tenantId,
    });
    
    res.status(201).json(limit);
  } catch (error) {
    console.error('Failed to create rate limit:', error);
    res.status(400).json({ error: 'Failed to create rate limit' });
  }
});

router.put('/rate-limits/:id', tenantFilter, requirePermission('API_GATEWAY_UPDATE_RATE_LIMITS'), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const limit = await storage.updateRateLimit(id, updates, req.tenantId);
    
    if (!limit) {
      return res.status(404).json({ error: 'Rate limit not found' });
    }
    
    await logAuditEvent({
      action: 'UPDATE_RATE_LIMIT',
      resourceType: 'rate_limit',
      resourceId: id,
      userId: req.user?.id,
      tenantId: req.tenantId,
    });
    
    res.json(limit);
  } catch (error) {
    console.error('Failed to update rate limit:', error);
    res.status(500).json({ error: 'Failed to update rate limit' });
  }
});

router.delete('/rate-limits/:id', tenantFilter, requirePermission('API_GATEWAY_DELETE_RATE_LIMITS'), async (req, res) => {
  try {
    const { id } = req.params;
    const success = await storage.deleteRateLimit(id, req.tenantId);
    
    if (!success) {
      return res.status(404).json({ error: 'Rate limit not found' });
    }
    
    await logAuditEvent({
      action: 'DELETE_RATE_LIMIT',
      resourceType: 'rate_limit',
      resourceId: id,
      userId: req.user?.id,
      tenantId: req.tenantId,
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to delete rate limit:', error);
    res.status(500).json({ error: 'Failed to delete rate limit' });
  }
});

router.post('/rate-limits/check', async (req, res) => {
  try {
    const { apiKeyId, endpoint } = req.body;
    
    const result = await storage.checkRateLimit(apiKeyId, endpoint);
    res.json(result);
  } catch (error) {
    console.error('Failed to check rate limit:', error);
    res.status(500).json({ error: 'Failed to check rate limit' });
  }
});

// API Documentation Routes
router.get('/documentation', tenantFilter, requirePermission('API_GATEWAY_VIEW_DOCS'), async (req, res) => {
  try {
    const docs = await storage.getApiDocumentation(req.tenantId);
    res.json(docs);
  } catch (error) {
    console.error('Failed to get API documentation:', error);
    res.status(500).json({ error: 'Failed to get API documentation' });
  }
});

router.get('/documentation/:id', tenantFilter, requirePermission('API_GATEWAY_VIEW_DOCS'), async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await storage.getApiDocumentationById(id, req.tenantId);
    
    if (!doc) {
      return res.status(404).json({ error: 'API documentation not found' });
    }
    
    res.json(doc);
  } catch (error) {
    console.error('Failed to get API documentation:', error);
    res.status(500).json({ error: 'Failed to get API documentation' });
  }
});

router.post('/documentation', tenantFilter, requirePermission('API_GATEWAY_CREATE_DOCS'), async (req, res) => {
  try {
    const docData = ApiDocumentationSchema.parse(req.body);
    const doc = await storage.createApiDocumentation({
      ...docData,
      createdBy: req.user?.id,
      tenantId: req.tenantId,
    });
    
    await logAuditEvent({
      action: 'CREATE_API_DOCUMENTATION',
      resourceType: 'api_documentation',
      resourceId: doc.id,
      userId: req.user?.id,
      tenantId: req.tenantId,
    });
    
    res.status(201).json(doc);
  } catch (error) {
    console.error('Failed to create API documentation:', error);
    res.status(400).json({ error: 'Failed to create API documentation' });
  }
});

router.put('/documentation/:id', tenantFilter, requirePermission('API_GATEWAY_UPDATE_DOCS'), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const doc = await storage.updateApiDocumentation(id, updates, req.tenantId);
    
    if (!doc) {
      return res.status(404).json({ error: 'API documentation not found' });
    }
    
    await logAuditEvent({
      action: 'UPDATE_API_DOCUMENTATION',
      resourceType: 'api_documentation',
      resourceId: id,
      userId: req.user?.id,
      tenantId: req.tenantId,
    });
    
    res.json(doc);
  } catch (error) {
    console.error('Failed to update API documentation:', error);
    res.status(500).json({ error: 'Failed to update API documentation' });
  }
});

router.delete('/documentation/:id', tenantFilter, requirePermission('API_GATEWAY_DELETE_DOCS'), async (req, res) => {
  try {
    const { id } = req.params;
    const success = await storage.deleteApiDocumentation(id, req.tenantId);
    
    if (!success) {
      return res.status(404).json({ error: 'API documentation not found' });
    }
    
    await logAuditEvent({
      action: 'DELETE_API_DOCUMENTATION',
      resourceType: 'api_documentation',
      resourceId: id,
      userId: req.user?.id,
      tenantId: req.tenantId,
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to delete API documentation:', error);
    res.status(500).json({ error: 'Failed to delete API documentation' });
  }
});

router.post('/documentation/generate', tenantFilter, requirePermission('API_GATEWAY_CREATE_DOCS'), async (req, res) => {
  try {
    const doc = await storage.generateApiDocumentation(req.tenantId);
    
    await logAuditEvent({
      action: 'GENERATE_API_DOCUMENTATION',
      resourceType: 'api_documentation',
      resourceId: doc.id,
      userId: req.user?.id,
      tenantId: req.tenantId,
    });
    
    res.status(201).json(doc);
  } catch (error) {
    console.error('Failed to generate API documentation:', error);
    res.status(500).json({ error: 'Failed to generate API documentation' });
  }
});

// API Health and Metrics Routes
router.get('/health', async (req, res) => {
  try {
    const health = await storage.getApiHealth();
    res.json(health);
  } catch (error) {
    console.error('Failed to get API health:', error);
    res.status(500).json({ error: 'Failed to get API health' });
  }
});

router.get('/metrics', tenantFilter, requirePermission('API_GATEWAY_VIEW_METRICS'), async (req, res) => {
  try {
    const metrics = await storage.getApiMetrics(req.tenantId);
    res.json(metrics);
  } catch (error) {
    console.error('Failed to get API metrics:', error);
    res.status(500).json({ error: 'Failed to get API metrics' });
  }
});

router.get('/alerts', tenantFilter, requirePermission('API_GATEWAY_VIEW_ALERTS'), async (req, res) => {
  try {
    const alerts = await storage.getApiAlerts(req.tenantId);
    res.json(alerts);
  } catch (error) {
    console.error('Failed to get API alerts:', error);
    res.status(500).json({ error: 'Failed to get API alerts' });
  }
});

// API Testing Routes
router.post('/test', tenantFilter, requirePermission('API_GATEWAY_TEST_APIS'), async (req, res) => {
  try {
    const { method, url, headers, body, apiKey } = req.body;
    
    const result = await storage.testApiEndpoint({
      method,
      url,
      headers,
      body,
      apiKey,
    });
    
    res.json(result);
  } catch (error) {
    console.error('Failed to test API endpoint:', error);
    res.status(500).json({ error: 'Failed to test API endpoint' });
  }
});

// API Analytics Routes
router.get('/analytics', tenantFilter, requirePermission('API_GATEWAY_VIEW_ANALYTICS'), async (req, res) => {
  try {
    const { start, end, tenantId } = req.query;
    
    const period = {
      start: new Date(start as string),
      end: new Date(end as string),
    };
    
    const analytics = await storage.getApiAnalytics(period, tenantId as string || req.tenantId);
    res.json(analytics);
  } catch (error) {
    console.error('Failed to get API analytics:', error);
    res.status(500).json({ error: 'Failed to get API analytics' });
  }
});

router.get('/analytics/top-endpoints', tenantFilter, requirePermission('API_GATEWAY_VIEW_ANALYTICS'), async (req, res) => {
  try {
    const endpoints = await storage.getTopEndpoints(req.tenantId);
    res.json(endpoints);
  } catch (error) {
    console.error('Failed to get top endpoints:', error);
    res.status(500).json({ error: 'Failed to get top endpoints' });
  }
});

router.get('/analytics/error-rates', tenantFilter, requirePermission('API_GATEWAY_VIEW_ANALYTICS'), async (req, res) => {
  try {
    const errorRates = await storage.getErrorRates(req.tenantId);
    res.json(errorRates);
  } catch (error) {
    console.error('Failed to get error rates:', error);
    res.status(500).json({ error: 'Failed to get error rates' });
  }
});

router.get('/analytics/response-times', tenantFilter, requirePermission('API_GATEWAY_VIEW_ANALYTICS'), async (req, res) => {
  try {
    const metrics = await storage.getResponseTimeMetrics(req.tenantId);
    res.json(metrics);
  } catch (error) {
    console.error('Failed to get response time metrics:', error);
    res.status(500).json({ error: 'Failed to get response time metrics' });
  }
});

export default router;
