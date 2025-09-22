/**
 * Syrian Ministry of Communication - Citizen Engagement Platform
 * SSO Service
 * 
 * @author Abdulwahab Omira <abdul@omiratech.com>
 * @version 1.0.0
 * @license MIT
 */

export interface SSOProvider {
  id: string;
  name: string;
  type: 'saml' | 'oauth2' | 'oidc' | 'government';
  isActive: boolean;
  config: {
    clientId?: string;
    clientSecret?: string;
    redirectUri?: string;
    authorizationUrl?: string;
    tokenUrl?: string;
    userInfoUrl?: string;
    issuer?: string;
    entryPoint?: string;
    cert?: string;
    logoutUrl?: string;
    nameIdFormat?: string;
    signatureAlgorithm?: string;
    digestAlgorithm?: string;
    wantAssertionsSigned?: boolean;
    wantAuthnResponseSigned?: boolean;
    wantLogoutResponseSigned?: boolean;
    wantLogoutRequestSigned?: boolean;
    forceAuthn?: boolean;
    passive?: boolean;
    allowCreate?: boolean;
    requestId?: string;
    providerName?: string;
    skipRequestCompression?: boolean;
    disableRequestedAuthnContext?: boolean;
    authnRequestBinding?: string;
    racComparison?: string;
    attributeConsumingServiceIndex?: string;
    disableRequestAcsUrl?: boolean;
    scopes?: string[];
    responseType?: string;
    responseMode?: string;
    acrValues?: string[];
    claims?: Record<string, any>;
    customParameters?: Record<string, any>;
  };
  attributes: {
    id: string;
    name: string;
    email: string;
    firstName?: string;
    lastName?: string;
    department?: string;
    position?: string;
    phone?: string;
    address?: string;
    governmentId?: string;
    ministryId?: string;
    role?: string;
    permissions?: string[];
  };
  tenantId?: string;
  createdAt: Date;
  updatedAt: Date;
  lastUsed?: Date;
  usageCount: number;
}

export interface SSOSession {
  id: string;
  userId: string;
  providerId: string;
  providerType: string;
  sessionId: string;
  accessToken?: string;
  refreshToken?: string;
  idToken?: string;
  expiresAt: Date;
  createdAt: Date;
  lastActivity: Date;
  ipAddress: string;
  userAgent: string;
  isActive: boolean;
  tenantId?: string;
}

export interface SSOUser {
  id: string;
  providerId: string;
  providerUserId: string;
  email: string;
  firstName: string;
  lastName: string;
  department?: string;
  position?: string;
  phone?: string;
  address?: string;
  governmentId?: string;
  ministryId?: string;
  role?: string;
  permissions?: string[];
  attributes: Record<string, any>;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  tenantId?: string;
}

export interface SSOConfig {
  providers: SSOProvider[];
  defaultProvider?: string;
  sessionTimeout: number;
  rememberMeTimeout: number;
  maxConcurrentSessions: number;
  requireMFA: boolean;
  allowRememberMe: boolean;
  enableGovernmentId: boolean;
  enableMinistryIntegration: boolean;
  enableRoleMapping: boolean;
  enableAttributeMapping: boolean;
  enableAuditLogging: boolean;
  enableSessionManagement: boolean;
  enableSingleLogout: boolean;
  enableBackdoorAccess: boolean;
  backdoorUsers: string[];
  tenantId?: string;
}

export interface SSOStats {
  totalProviders: number;
  activeProviders: number;
  totalSessions: number;
  activeSessions: number;
  totalUsers: number;
  activeUsers: number;
  loginAttempts: number;
  successfulLogins: number;
  failedLogins: number;
  averageSessionDuration: number;
  topProviders: Array<{
    providerId: string;
    name: string;
    usageCount: number;
    successRate: number;
  }>;
  recentLogins: Array<{
    userId: string;
    providerId: string;
    timestamp: Date;
    success: boolean;
    ipAddress: string;
  }>;
}

class SSOService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = '/api/sso';
  }

  // Provider Management
  async getProviders(tenantId?: string): Promise<SSOProvider[]> {
    const url = tenantId ? `${this.baseUrl}/providers?tenantId=${tenantId}` : `${this.baseUrl}/providers`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Failed to fetch SSO providers');
    }

    return response.json();
  }

  async getProviderById(id: string, tenantId?: string): Promise<SSOProvider | null> {
    const url = tenantId ? `${this.baseUrl}/providers/${id}?tenantId=${tenantId}` : `${this.baseUrl}/providers/${id}`;
    const response = await fetch(url);

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error('Failed to fetch SSO provider');
    }

    return response.json();
  }

  async createProvider(providerData: Partial<SSOProvider>): Promise<SSOProvider> {
    const response = await fetch(`${this.baseUrl}/providers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(providerData),
    });

    if (!response.ok) {
      throw new Error('Failed to create SSO provider');
    }

    return response.json();
  }

  async updateProvider(id: string, updates: Partial<SSOProvider>, tenantId?: string): Promise<SSOProvider | null> {
    const url = tenantId ? `${this.baseUrl}/providers/${id}?tenantId=${tenantId}` : `${this.baseUrl}/providers/${id}`;
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error('Failed to update SSO provider');
    }

    return response.json();
  }

  async deleteProvider(id: string, tenantId?: string): Promise<boolean> {
    const url = tenantId ? `${this.baseUrl}/providers/${id}?tenantId=${tenantId}` : `${this.baseUrl}/providers/${id}`;
    const response = await fetch(url, {
      method: 'DELETE',
    });

    return response.ok;
  }

  async toggleProvider(id: string, isActive: boolean, tenantId?: string): Promise<SSOProvider | null> {
    return this.updateProvider(id, { isActive }, tenantId);
  }

  // Authentication
  async initiateLogin(providerId: string, options?: {
    redirectUri?: string;
    state?: string;
    nonce?: string;
    prompt?: string;
    maxAge?: number;
    acrValues?: string[];
    customParameters?: Record<string, any>;
  }): Promise<{ redirectUrl: string; state?: string; nonce?: string }> {
    const response = await fetch(`${this.baseUrl}/auth/${providerId}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
    });

    if (!response.ok) {
      throw new Error('Failed to initiate SSO login');
    }

    return response.json();
  }

  async handleCallback(providerId: string, callbackData: {
    code?: string;
    state?: string;
    samlResponse?: string;
    relayState?: string;
    error?: string;
    errorDescription?: string;
  }): Promise<{ user: SSOUser; session: SSOSession; redirectUrl?: string }> {
    const response = await fetch(`${this.baseUrl}/auth/${providerId}/callback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(callbackData),
    });

    if (!response.ok) {
      throw new Error('Failed to handle SSO callback');
    }

    return response.json();
  }

  async logout(sessionId: string, providerId?: string): Promise<{ redirectUrl?: string }> {
    const response = await fetch(`${this.baseUrl}/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sessionId, providerId }),
    });

    if (!response.ok) {
      throw new Error('Failed to logout');
    }

    return response.json();
  }

  async refreshToken(sessionId: string): Promise<{ accessToken: string; expiresAt: Date }> {
    const response = await fetch(`${this.baseUrl}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sessionId }),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }

    return response.json();
  }

  // Session Management
  async getSessions(tenantId?: string): Promise<SSOSession[]> {
    const url = tenantId ? `${this.baseUrl}/sessions?tenantId=${tenantId}` : `${this.baseUrl}/sessions`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Failed to fetch SSO sessions');
    }

    return response.json();
  }

  async getSessionById(id: string): Promise<SSOSession | null> {
    const response = await fetch(`${this.baseUrl}/sessions/${id}`);

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error('Failed to fetch SSO session');
    }

    return response.json();
  }

  async terminateSession(id: string): Promise<boolean> {
    const response = await fetch(`${this.baseUrl}/sessions/${id}`, {
      method: 'DELETE',
    });

    return response.ok;
  }

  async terminateAllSessions(userId: string): Promise<boolean> {
    const response = await fetch(`${this.baseUrl}/sessions/user/${userId}`, {
      method: 'DELETE',
    });

    return response.ok;
  }

  // User Management
  async getUsers(tenantId?: string): Promise<SSOUser[]> {
    const url = tenantId ? `${this.baseUrl}/users?tenantId=${tenantId}` : `${this.baseUrl}/users`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Failed to fetch SSO users');
    }

    return response.json();
  }

  async getUserById(id: string, tenantId?: string): Promise<SSOUser | null> {
    const url = tenantId ? `${this.baseUrl}/users/${id}?tenantId=${tenantId}` : `${this.baseUrl}/users/${id}`;
    const response = await fetch(url);

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error('Failed to fetch SSO user');
    }

    return response.json();
  }

  async updateUser(id: string, updates: Partial<SSOUser>, tenantId?: string): Promise<SSOUser | null> {
    const url = tenantId ? `${this.baseUrl}/users/${id}?tenantId=${tenantId}` : `${this.baseUrl}/users/${id}`;
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error('Failed to update SSO user');
    }

    return response.json();
  }

  async deleteUser(id: string, tenantId?: string): Promise<boolean> {
    const url = tenantId ? `${this.baseUrl}/users/${id}?tenantId=${tenantId}` : `${this.baseUrl}/users/${id}`;
    const response = await fetch(url, {
      method: 'DELETE',
    });

    return response.ok;
  }

  // Configuration
  async getConfig(tenantId?: string): Promise<SSOConfig> {
    const url = tenantId ? `${this.baseUrl}/config?tenantId=${tenantId}` : `${this.baseUrl}/config`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Failed to fetch SSO config');
    }

    return response.json();
  }

  async updateConfig(config: Partial<SSOConfig>, tenantId?: string): Promise<SSOConfig> {
    const url = tenantId ? `${this.baseUrl}/config?tenantId=${tenantId}` : `${this.baseUrl}/config`;
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      throw new Error('Failed to update SSO config');
    }

    return response.json();
  }

  // Statistics
  async getStats(tenantId?: string): Promise<SSOStats> {
    const url = tenantId ? `${this.baseUrl}/stats?tenantId=${tenantId}` : `${this.baseUrl}/stats`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Failed to fetch SSO stats');
    }

    return response.json();
  }

  async getAnalytics(period: { start: Date; end: Date }, tenantId?: string): Promise<any> {
    const params = new URLSearchParams({
      startDate: period.start.toISOString(),
      endDate: period.end.toISOString(),
    });
    if (tenantId) params.append('tenantId', tenantId);

    const response = await fetch(`${this.baseUrl}/analytics?${params}`);

    if (!response.ok) {
      throw new Error('Failed to fetch SSO analytics');
    }

    return response.json();
  }

  // Government ID Integration
  async validateGovernmentId(governmentId: string, providerId: string): Promise<{
    valid: boolean;
    user?: SSOUser;
    error?: string;
  }> {
    const response = await fetch(`${this.baseUrl}/government-id/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ governmentId, providerId }),
    });

    if (!response.ok) {
      throw new Error('Failed to validate government ID');
    }

    return response.json();
  }

  async getGovernmentIdProviders(): Promise<SSOProvider[]> {
    const response = await fetch(`${this.baseUrl}/government-id/providers`);

    if (!response.ok) {
      throw new Error('Failed to fetch government ID providers');
    }

    return response.json();
  }

  // Ministry Integration
  async getMinistryUsers(ministryId: string, tenantId?: string): Promise<SSOUser[]> {
    const url = tenantId ? `${this.baseUrl}/ministry/${ministryId}/users?tenantId=${tenantId}` : `${this.baseUrl}/ministry/${ministryId}/users`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Failed to fetch ministry users');
    }

    return response.json();
  }

  async syncMinistryUsers(ministryId: string, tenantId?: string): Promise<{
    synced: number;
    errors: number;
    details: Array<{ userId: string; status: string; error?: string }>;
  }> {
    const url = tenantId ? `${this.baseUrl}/ministry/${ministryId}/sync?tenantId=${tenantId}` : `${this.baseUrl}/ministry/${ministryId}/sync`;
    const response = await fetch(url, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('Failed to sync ministry users');
    }

    return response.json();
  }

  // Testing
  async testProvider(providerId: string, testData?: any): Promise<{
    success: boolean;
    responseTime: number;
    error?: string;
    details?: any;
  }> {
    const response = await fetch(`${this.baseUrl}/providers/${providerId}/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ testData }),
    });

    if (!response.ok) {
      throw new Error('Failed to test SSO provider');
    }

    return response.json();
  }

  async testConnection(providerId: string): Promise<{
    success: boolean;
    responseTime: number;
    error?: string;
    details?: any;
  }> {
    const response = await fetch(`${this.baseUrl}/providers/${providerId}/test-connection`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('Failed to test SSO connection');
    }

    return response.json();
  }

  // Templates
  async getProviderTemplates(): Promise<any[]> {
    const response = await fetch(`${this.baseUrl}/templates`);

    if (!response.ok) {
      throw new Error('Failed to fetch SSO provider templates');
    }

    return response.json();
  }

  async createProviderFromTemplate(templateId: string, config: any): Promise<SSOProvider> {
    const response = await fetch(`${this.baseUrl}/templates/${templateId}/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      throw new Error('Failed to create SSO provider from template');
    }

    return response.json();
  }
}

export const ssoService = new SSOService();
export default ssoService;
