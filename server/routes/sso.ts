/**
 * Syrian Ministry of Communication - Citizen Engagement Platform
 * SSO Management API Routes
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
import passport from 'passport';
import { Strategy as SamlStrategy } from 'passport-saml';
import { Strategy as OAuth2Strategy } from 'passport-oauth2';
import { Strategy as GoogleStrategy } from 'passport-google-oauth2';
import { Strategy as MicrosoftStrategy } from 'passport-microsoft';
import jwt from 'jsonwebtoken';

const router = Router();

// SSO Provider validation schemas
const SSOProviderSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['saml', 'oauth2', 'oidc', 'government']),
  isActive: z.boolean().default(true),
  config: z.object({
    clientId: z.string().optional(),
    clientSecret: z.string().optional(),
    redirectUri: z.string().url().optional(),
    authorizationUrl: z.string().url().optional(),
    tokenUrl: z.string().url().optional(),
    userInfoUrl: z.string().url().optional(),
    issuer: z.string().optional(),
    entryPoint: z.string().url().optional(),
    cert: z.string().optional(),
    logoutUrl: z.string().url().optional(),
    nameIdFormat: z.string().optional(),
    signatureAlgorithm: z.string().optional(),
    digestAlgorithm: z.string().optional(),
    wantAssertionsSigned: z.boolean().optional(),
    wantAuthnResponseSigned: z.boolean().optional(),
    wantLogoutResponseSigned: z.boolean().optional(),
    wantLogoutRequestSigned: z.boolean().optional(),
    forceAuthn: z.boolean().optional(),
    passive: z.boolean().optional(),
    allowCreate: z.boolean().optional(),
    requestId: z.string().optional(),
    providerName: z.string().optional(),
    skipRequestCompression: z.boolean().optional(),
    disableRequestedAuthnContext: z.boolean().optional(),
    authnRequestBinding: z.string().optional(),
    racComparison: z.string().optional(),
    attributeConsumingServiceIndex: z.string().optional(),
    disableRequestAcsUrl: z.boolean().optional(),
    scopes: z.array(z.string()).optional(),
    responseType: z.string().optional(),
    responseMode: z.string().optional(),
    acrValues: z.array(z.string()).optional(),
    claims: z.record(z.any()).optional(),
    customParameters: z.record(z.any()).optional(),
  }),
  attributes: z.object({
    id: z.string().default('sub'),
    name: z.string().default('name'),
    email: z.string().default('email'),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    department: z.string().optional(),
    position: z.string().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    governmentId: z.string().optional(),
    ministryId: z.string().optional(),
    role: z.string().optional(),
    permissions: z.string().optional(),
  }),
});

const SSOSessionSchema = z.object({
  userId: z.string(),
  providerId: z.string(),
  providerType: z.string(),
  sessionId: z.string(),
  accessToken: z.string().optional(),
  refreshToken: z.string().optional(),
  idToken: z.string().optional(),
  expiresAt: z.date(),
  ipAddress: z.string(),
  userAgent: z.string(),
  isActive: z.boolean().default(true),
});

// SSO Provider Management Routes
router.get('/providers', requirePermission('SSO_READ'), tenantFilter, async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.query;
    const providers = await storage.getSSOProviders(tenantId as string);
    res.json(providers);
  } catch (error) {
    console.error('Error fetching SSO providers:', error);
    res.status(500).json({ error: 'Failed to fetch SSO providers' });
  }
});

router.get('/providers/:id', requirePermission('SSO_READ'), tenantFilter, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { tenantId } = req.query;
    const provider = await storage.getSSOProviderById(id, tenantId as string);
    
    if (!provider) {
      return res.status(404).json({ error: 'SSO provider not found' });
    }
    
    res.json(provider);
  } catch (error) {
    console.error('Error fetching SSO provider:', error);
    res.status(500).json({ error: 'Failed to fetch SSO provider' });
  }
});

router.post('/providers', requirePermission('SSO_CREATE'), tenantFilter, async (req: Request, res: Response) => {
  try {
    const providerData = SSOProviderSchema.parse(req.body);
    const { tenantId } = req.query;
    
    const provider = await storage.createSSOProvider({
      ...providerData,
      tenantId: tenantId as string,
    });
    
    await logAuditEvent({
      action: 'sso_provider.created',
      resourceType: 'sso_provider',
      resourceId: provider.id,
      details: { name: provider.name, type: provider.type },
      userId: req.user?.id,
      tenantId: tenantId as string,
    });
    
    res.status(201).json(provider);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Error creating SSO provider:', error);
    res.status(500).json({ error: 'Failed to create SSO provider' });
  }
});

router.put('/providers/:id', requirePermission('SSO_UPDATE'), tenantFilter, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { tenantId } = req.query;
    const updates = SSOProviderSchema.partial().parse(req.body);
    
    const provider = await storage.updateSSOProvider(id, updates, tenantId as string);
    
    if (!provider) {
      return res.status(404).json({ error: 'SSO provider not found' });
    }
    
    await logAuditEvent({
      action: 'sso_provider.updated',
      resourceType: 'sso_provider',
      resourceId: id,
      details: updates,
      userId: req.user?.id,
      tenantId: tenantId as string,
    });
    
    res.json(provider);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Error updating SSO provider:', error);
    res.status(500).json({ error: 'Failed to update SSO provider' });
  }
});

router.delete('/providers/:id', requirePermission('SSO_DELETE'), tenantFilter, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { tenantId } = req.query;
    
    const success = await storage.deleteSSOProvider(id, tenantId as string);
    
    if (!success) {
      return res.status(404).json({ error: 'SSO provider not found' });
    }
    
    await logAuditEvent({
      action: 'sso_provider.deleted',
      resourceType: 'sso_provider',
      resourceId: id,
      userId: req.user?.id,
      tenantId: tenantId as string,
    });
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting SSO provider:', error);
    res.status(500).json({ error: 'Failed to delete SSO provider' });
  }
});

// Authentication Routes
router.post('/auth/:providerId/login', requirePermission('SSO_LOGIN'), async (req: Request, res: Response) => {
  try {
    const { providerId } = req.params;
    const { redirectUri, state, nonce, prompt, maxAge, acrValues, customParameters } = req.body;
    
    const provider = await storage.getSSOProviderById(providerId);
    if (!provider || !provider.isActive) {
      return res.status(404).json({ error: 'SSO provider not found or inactive' });
    }
    
    const authUrl = await storage.initiateSSOLogin(providerId, {
      redirectUri,
      state,
      nonce,
      prompt,
      maxAge,
      acrValues,
      customParameters,
    });
    
    res.json({ redirectUrl: authUrl, state, nonce });
  } catch (error) {
    console.error('Error initiating SSO login:', error);
    res.status(500).json({ error: 'Failed to initiate SSO login' });
  }
});

router.post('/auth/:providerId/callback', requirePermission('SSO_LOGIN'), async (req: Request, res: Response) => {
  try {
    const { providerId } = req.params;
    const { code, state, samlResponse, relayState, error, errorDescription } = req.body;
    
    if (error) {
      return res.status(400).json({ error, errorDescription });
    }
    
    const result = await storage.handleSSOCallback(providerId, {
      code,
      state,
      samlResponse,
      relayState,
    });
    
    await logAuditEvent({
      action: 'sso_login.success',
      resourceType: 'sso_session',
      resourceId: result.session.id,
      details: { providerId, userId: result.user.id },
      userId: result.user.id,
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error handling SSO callback:', error);
    res.status(500).json({ error: 'Failed to handle SSO callback' });
  }
});

router.post('/auth/logout', requirePermission('SSO_LOGOUT'), async (req: Request, res: Response) => {
  try {
    const { sessionId, providerId } = req.body;
    
    const result = await storage.logoutSSO(sessionId, providerId);
    
    await logAuditEvent({
      action: 'sso_logout',
      resourceType: 'sso_session',
      resourceId: sessionId,
      userId: req.user?.id,
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error logging out SSO:', error);
    res.status(500).json({ error: 'Failed to logout' });
  }
});

router.post('/auth/refresh', requirePermission('SSO_REFRESH'), async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.body;
    
    const result = await storage.refreshSSOToken(sessionId);
    
    res.json(result);
  } catch (error) {
    console.error('Error refreshing SSO token:', error);
    res.status(500).json({ error: 'Failed to refresh token' });
  }
});

// Session Management Routes
router.get('/sessions', requirePermission('SSO_READ'), tenantFilter, async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.query;
    const sessions = await storage.getSSOSessions(tenantId as string);
    res.json(sessions);
  } catch (error) {
    console.error('Error fetching SSO sessions:', error);
    res.status(500).json({ error: 'Failed to fetch SSO sessions' });
  }
});

router.get('/sessions/:id', requirePermission('SSO_READ'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const session = await storage.getSSOSessionById(id);
    
    if (!session) {
      return res.status(404).json({ error: 'SSO session not found' });
    }
    
    res.json(session);
  } catch (error) {
    console.error('Error fetching SSO session:', error);
    res.status(500).json({ error: 'Failed to fetch SSO session' });
  }
});

router.delete('/sessions/:id', requirePermission('SSO_LOGOUT'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const success = await storage.terminateSSOSession(id);
    
    if (!success) {
      return res.status(404).json({ error: 'SSO session not found' });
    }
    
    await logAuditEvent({
      action: 'sso_session.terminated',
      resourceType: 'sso_session',
      resourceId: id,
      userId: req.user?.id,
    });
    
    res.status(204).send();
  } catch (error) {
    console.error('Error terminating SSO session:', error);
    res.status(500).json({ error: 'Failed to terminate SSO session' });
  }
});

router.delete('/sessions/user/:userId', requirePermission('SSO_LOGOUT'), async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    const success = await storage.terminateAllSSOSessions(userId);
    
    await logAuditEvent({
      action: 'sso_sessions.terminated_all',
      resourceType: 'sso_session',
      resourceId: userId,
      userId: req.user?.id,
    });
    
    res.json({ success });
  } catch (error) {
    console.error('Error terminating all SSO sessions:', error);
    res.status(500).json({ error: 'Failed to terminate all SSO sessions' });
  }
});

// User Management Routes
router.get('/users', requirePermission('SSO_READ'), tenantFilter, async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.query;
    const users = await storage.getSSOUsers(tenantId as string);
    res.json(users);
  } catch (error) {
    console.error('Error fetching SSO users:', error);
    res.status(500).json({ error: 'Failed to fetch SSO users' });
  }
});

router.get('/users/:id', requirePermission('SSO_READ'), tenantFilter, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { tenantId } = req.query;
    const user = await storage.getSSOUserById(id, tenantId as string);
    
    if (!user) {
      return res.status(404).json({ error: 'SSO user not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error fetching SSO user:', error);
    res.status(500).json({ error: 'Failed to fetch SSO user' });
  }
});

router.put('/users/:id', requirePermission('SSO_UPDATE'), tenantFilter, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { tenantId } = req.query;
    const updates = req.body;
    
    const user = await storage.updateSSOUser(id, updates, tenantId as string);
    
    if (!user) {
      return res.status(404).json({ error: 'SSO user not found' });
    }
    
    await logAuditEvent({
      action: 'sso_user.updated',
      resourceType: 'sso_user',
      resourceId: id,
      details: updates,
      userId: req.user?.id,
      tenantId: tenantId as string,
    });
    
    res.json(user);
  } catch (error) {
    console.error('Error updating SSO user:', error);
    res.status(500).json({ error: 'Failed to update SSO user' });
  }
});

router.delete('/users/:id', requirePermission('SSO_DELETE'), tenantFilter, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { tenantId } = req.query;
    
    const success = await storage.deleteSSOUser(id, tenantId as string);
    
    if (!success) {
      return res.status(404).json({ error: 'SSO user not found' });
    }
    
    await logAuditEvent({
      action: 'sso_user.deleted',
      resourceType: 'sso_user',
      resourceId: id,
      userId: req.user?.id,
      tenantId: tenantId as string,
    });
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting SSO user:', error);
    res.status(500).json({ error: 'Failed to delete SSO user' });
  }
});

// Configuration Routes
router.get('/config', requirePermission('SSO_READ'), tenantFilter, async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.query;
    const config = await storage.getSSOConfig(tenantId as string);
    res.json(config);
  } catch (error) {
    console.error('Error fetching SSO config:', error);
    res.status(500).json({ error: 'Failed to fetch SSO config' });
  }
});

router.put('/config', requirePermission('SSO_UPDATE'), tenantFilter, async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.query;
    const config = req.body;
    
    const updatedConfig = await storage.updateSSOConfig(config, tenantId as string);
    
    await logAuditEvent({
      action: 'sso_config.updated',
      resourceType: 'sso_config',
      details: config,
      userId: req.user?.id,
      tenantId: tenantId as string,
    });
    
    res.json(updatedConfig);
  } catch (error) {
    console.error('Error updating SSO config:', error);
    res.status(500).json({ error: 'Failed to update SSO config' });
  }
});

// Statistics Routes
router.get('/stats', requirePermission('SSO_READ'), tenantFilter, async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.query;
    const stats = await storage.getSSOStats(tenantId as string);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching SSO stats:', error);
    res.status(500).json({ error: 'Failed to fetch SSO stats' });
  }
});

router.get('/analytics', requirePermission('SSO_READ'), tenantFilter, async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, tenantId } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }
    
    const period = {
      start: new Date(startDate as string),
      end: new Date(endDate as string),
    };
    
    const analytics = await storage.getSSOAnalytics(period, tenantId as string);
    res.json(analytics);
  } catch (error) {
    console.error('Error fetching SSO analytics:', error);
    res.status(500).json({ error: 'Failed to fetch SSO analytics' });
  }
});

// Government ID Integration Routes
router.post('/government-id/validate', requirePermission('SSO_READ'), async (req: Request, res: Response) => {
  try {
    const { governmentId, providerId } = req.body;
    
    const result = await storage.validateGovernmentId(governmentId, providerId);
    res.json(result);
  } catch (error) {
    console.error('Error validating government ID:', error);
    res.status(500).json({ error: 'Failed to validate government ID' });
  }
});

router.get('/government-id/providers', async (req: Request, res: Response) => {
  try {
    const providers = await storage.getGovernmentIdProviders();
    res.json(providers);
  } catch (error) {
    console.error('Error fetching government ID providers:', error);
    res.status(500).json({ error: 'Failed to fetch government ID providers' });
  }
});

// Ministry Integration Routes
router.get('/ministry/:ministryId/users', requirePermission('SSO_READ'), tenantFilter, async (req: Request, res: Response) => {
  try {
    const { ministryId } = req.params;
    const { tenantId } = req.query;
    const users = await storage.getMinistrySSOUsers(ministryId, tenantId as string);
    res.json(users);
  } catch (error) {
    console.error('Error fetching ministry SSO users:', error);
    res.status(500).json({ error: 'Failed to fetch ministry SSO users' });
  }
});

router.post('/ministry/:ministryId/sync', requirePermission('SSO_SYNC'), tenantFilter, async (req: Request, res: Response) => {
  try {
    const { ministryId } = req.params;
    const { tenantId } = req.query;
    
    const result = await storage.syncMinistrySSOUsers(ministryId, tenantId as string);
    
    await logAuditEvent({
      action: 'sso_ministry.synced',
      resourceType: 'sso_ministry',
      resourceId: ministryId,
      details: result,
      userId: req.user?.id,
      tenantId: tenantId as string,
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error syncing ministry SSO users:', error);
    res.status(500).json({ error: 'Failed to sync ministry SSO users' });
  }
});

// Testing Routes
router.post('/providers/:id/test', requirePermission('SSO_TEST'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { testData } = req.body;
    
    const result = await storage.testSSOProvider(id, testData);
    res.json(result);
  } catch (error) {
    console.error('Error testing SSO provider:', error);
    res.status(500).json({ error: 'Failed to test SSO provider' });
  }
});

router.post('/providers/:id/test-connection', requirePermission('SSO_TEST'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await storage.testSSOConnection(id);
    res.json(result);
  } catch (error) {
    console.error('Error testing SSO connection:', error);
    res.status(500).json({ error: 'Failed to test SSO connection' });
  }
});

// Templates Routes
router.get('/templates', async (req: Request, res: Response) => {
  try {
    const templates = await storage.getSSOProviderTemplates();
    res.json(templates);
  } catch (error) {
    console.error('Error fetching SSO provider templates:', error);
    res.status(500).json({ error: 'Failed to fetch SSO provider templates' });
  }
});

router.post('/templates/:templateId/create', requirePermission('SSO_CREATE'), tenantFilter, async (req: Request, res: Response) => {
  try {
    const { templateId } = req.params;
    const { tenantId } = req.query;
    const config = req.body;
    
    const provider = await storage.createSSOProviderFromTemplate(templateId, {
      ...config,
      tenantId: tenantId as string,
    });
    
    res.status(201).json(provider);
  } catch (error) {
    console.error('Error creating SSO provider from template:', error);
    res.status(500).json({ error: 'Failed to create SSO provider from template' });
  }
});

export default router;
