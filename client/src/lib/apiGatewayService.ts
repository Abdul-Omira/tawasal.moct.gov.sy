import { api } from './api';

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  secret: string;
  tenantId?: string;
  permissions: string[];
  rateLimit: {
    requests: number;
    window: number; // in seconds
  };
  isActive: boolean;
  expiresAt?: Date;
  lastUsed?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  metadata?: Record<string, any>;
}

export interface ApiUsage {
  id: string;
  apiKeyId: string;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  timestamp: Date;
  ipAddress: string;
  userAgent?: string;
  tenantId?: string;
  metadata?: Record<string, any>;
}

export interface RateLimit {
  id: string;
  tenantId?: string;
  apiKeyId?: string;
  endpoint?: string;
  requests: number;
  window: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiDocumentation {
  id: string;
  title: string;
  description: string;
  version: string;
  baseUrl: string;
  endpoints: ApiEndpoint[];
  schemas: ApiSchema[];
  examples: ApiExample[];
  isPublic: boolean;
  tenantId?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface ApiEndpoint {
  id: string;
  path: string;
  method: string;
  summary: string;
  description: string;
  parameters: ApiParameter[];
  requestBody?: ApiRequestBody;
  responses: ApiResponse[];
  tags: string[];
  deprecated: boolean;
  rateLimit?: {
    requests: number;
    window: number;
  };
}

export interface ApiParameter {
  name: string;
  in: 'query' | 'path' | 'header' | 'cookie';
  required: boolean;
  description: string;
  type: string;
  example?: any;
  schema?: any;
}

export interface ApiRequestBody {
  description: string;
  required: boolean;
  content: Record<string, any>;
}

export interface ApiResponse {
  statusCode: number;
  description: string;
  content?: Record<string, any>;
  headers?: Record<string, any>;
}

export interface ApiSchema {
  name: string;
  type: string;
  properties: Record<string, any>;
  required: string[];
  example?: any;
}

export interface ApiExample {
  id: string;
  endpointId: string;
  name: string;
  description: string;
  request: {
    method: string;
    url: string;
    headers?: Record<string, string>;
    body?: any;
  };
  response: {
    statusCode: number;
    headers?: Record<string, string>;
    body?: any;
  };
}

class ApiGatewayService {
  // API Key Management
  async getApiKeys(tenantId?: string): Promise<ApiKey[]> {
    const params = tenantId ? `?tenantId=${tenantId}` : '';
    const response = await api.get(`/api-gateway/keys${params}`);
    return response.data;
  }

  async getApiKeyById(id: string): Promise<ApiKey | null> {
    try {
      const response = await api.get(`/api-gateway/keys/${id}`);
      return response.data;
    } catch (error) {
      return null;
    }
  }

  async createApiKey(keyData: Omit<ApiKey, 'id' | 'key' | 'secret' | 'createdAt' | 'updatedAt'>): Promise<ApiKey> {
    const response = await api.post('/api-gateway/keys', keyData);
    return response.data;
  }

  async updateApiKey(id: string, updates: Partial<ApiKey>): Promise<ApiKey> {
    const response = await api.put(`/api-gateway/keys/${id}`, updates);
    return response.data;
  }

  async deleteApiKey(id: string): Promise<boolean> {
    try {
      await api.delete(`/api-gateway/keys/${id}`);
      return true;
    } catch (error) {
      return false;
    }
  }

  async regenerateApiKey(id: string): Promise<ApiKey> {
    const response = await api.post(`/api-gateway/keys/${id}/regenerate`);
    return response.data;
  }

  async validateApiKey(key: string): Promise<{ valid: boolean; apiKey?: ApiKey; error?: string }> {
    try {
      const response = await api.post('/api-gateway/keys/validate', { key });
      return response.data;
    } catch (error) {
      return { valid: false, error: 'Invalid API key' };
    }
  }

  // API Usage Tracking
  async getApiUsage(filters: {
    apiKeyId?: string;
    endpoint?: string;
    startDate?: Date;
    endDate?: Date;
    tenantId?: string;
  } = {}): Promise<ApiUsage[]> {
    const params = new URLSearchParams();
    if (filters.apiKeyId) params.append('apiKeyId', filters.apiKeyId);
    if (filters.endpoint) params.append('endpoint', filters.endpoint);
    if (filters.startDate) params.append('startDate', filters.startDate.toISOString());
    if (filters.endDate) params.append('endDate', filters.endDate.toISOString());
    if (filters.tenantId) params.append('tenantId', filters.tenantId);

    const response = await api.get(`/api-gateway/usage?${params.toString()}`);
    return response.data;
  }

  async getApiUsageStats(tenantId?: string): Promise<any> {
    const params = tenantId ? `?tenantId=${tenantId}` : '';
    const response = await api.get(`/api-gateway/usage/stats${params}`);
    return response.data;
  }

  async getApiUsageAnalytics(period: { start: Date; end: Date }, tenantId?: string): Promise<any> {
    const params = new URLSearchParams();
    params.append('start', period.start.toISOString());
    params.append('end', period.end.toISOString());
    if (tenantId) params.append('tenantId', tenantId);

    const response = await api.get(`/api-gateway/usage/analytics?${params.toString()}`);
    return response.data;
  }

  // Rate Limiting
  async getRateLimits(tenantId?: string): Promise<RateLimit[]> {
    const params = tenantId ? `?tenantId=${tenantId}` : '';
    const response = await api.get(`/api-gateway/rate-limits${params}`);
    return response.data;
  }

  async getRateLimitById(id: string): Promise<RateLimit | null> {
    try {
      const response = await api.get(`/api-gateway/rate-limits/${id}`);
      return response.data;
    } catch (error) {
      return null;
    }
  }

  async createRateLimit(rateLimitData: Omit<RateLimit, 'id' | 'createdAt' | 'updatedAt'>): Promise<RateLimit> {
    const response = await api.post('/api-gateway/rate-limits', rateLimitData);
    return response.data;
  }

  async updateRateLimit(id: string, updates: Partial<RateLimit>): Promise<RateLimit> {
    const response = await api.put(`/api-gateway/rate-limits/${id}`, updates);
    return response.data;
  }

  async deleteRateLimit(id: string): Promise<boolean> {
    try {
      await api.delete(`/api-gateway/rate-limits/${id}`);
      return true;
    } catch (error) {
      return false;
    }
  }

  async checkRateLimit(apiKeyId: string, endpoint: string): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: Date;
    limit: number;
  }> {
    const response = await api.post('/api-gateway/rate-limits/check', {
      apiKeyId,
      endpoint,
    });
    return response.data;
  }

  // API Documentation
  async getApiDocumentation(tenantId?: string): Promise<ApiDocumentation[]> {
    const params = tenantId ? `?tenantId=${tenantId}` : '';
    const response = await api.get(`/api-gateway/documentation${params}`);
    return response.data;
  }

  async getApiDocumentationById(id: string): Promise<ApiDocumentation | null> {
    try {
      const response = await api.get(`/api-gateway/documentation/${id}`);
      return response.data;
    } catch (error) {
      return null;
    }
  }

  async createApiDocumentation(docData: Omit<ApiDocumentation, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiDocumentation> {
    const response = await api.post('/api-gateway/documentation', docData);
    return response.data;
  }

  async updateApiDocumentation(id: string, updates: Partial<ApiDocumentation>): Promise<ApiDocumentation> {
    const response = await api.put(`/api-gateway/documentation/${id}`, updates);
    return response.data;
  }

  async deleteApiDocumentation(id: string): Promise<boolean> {
    try {
      await api.delete(`/api-gateway/documentation/${id}`);
      return true;
    } catch (error) {
      return false;
    }
  }

  async generateApiDocumentation(tenantId?: string): Promise<ApiDocumentation> {
    const params = tenantId ? `?tenantId=${tenantId}` : '';
    const response = await api.post(`/api-gateway/documentation/generate${params}`);
    return response.data;
  }

  // API Health Monitoring
  async getApiHealth(): Promise<any> {
    const response = await api.get('/api-gateway/health');
    return response.data;
  }

  async getApiMetrics(tenantId?: string): Promise<any> {
    const params = tenantId ? `?tenantId=${tenantId}` : '';
    const response = await api.get(`/api-gateway/metrics${params}`);
    return response.data;
  }

  async getApiAlerts(tenantId?: string): Promise<any[]> {
    const params = tenantId ? `?tenantId=${tenantId}` : '';
    const response = await api.get(`/api-gateway/alerts${params}`);
    return response.data;
  }

  // API Testing
  async testApiEndpoint(config: {
    method: string;
    url: string;
    headers?: Record<string, string>;
    body?: any;
    apiKey?: string;
  }): Promise<{
    success: boolean;
    statusCode: number;
    responseTime: number;
    response: any;
    error?: string;
  }> {
    const response = await api.post('/api-gateway/test', config);
    return response.data;
  }

  // API Versioning
  async getApiVersions(tenantId?: string): Promise<any[]> {
    const params = tenantId ? `?tenantId=${tenantId}` : '';
    const response = await api.get(`/api-gateway/versions${params}`);
    return response.data;
  }

  async createApiVersion(versionData: any): Promise<any> {
    const response = await api.post('/api-gateway/versions', versionData);
    return response.data;
  }

  async deprecateApiVersion(versionId: string, deprecationDate: Date): Promise<any> {
    const response = await api.post(`/api-gateway/versions/${versionId}/deprecate`, {
      deprecationDate,
    });
    return response.data;
  }

  // API Caching
  async getCacheStatus(tenantId?: string): Promise<any> {
    const params = tenantId ? `?tenantId=${tenantId}` : '';
    const response = await api.get(`/api-gateway/cache${params}`);
    return response.data;
  }

  async clearCache(pattern?: string, tenantId?: string): Promise<boolean> {
    try {
      const params = new URLSearchParams();
      if (pattern) params.append('pattern', pattern);
      if (tenantId) params.append('tenantId', tenantId);

      await api.delete(`/api-gateway/cache?${params.toString()}`);
      return true;
    } catch (error) {
      return false;
    }
  }

  async setCachePolicy(policy: {
    endpoint: string;
    ttl: number;
    conditions?: Record<string, any>;
    tenantId?: string;
  }): Promise<any> {
    const response = await api.post('/api-gateway/cache/policy', policy);
    return response.data;
  }

  // API Security
  async getSecurityPolicies(tenantId?: string): Promise<any[]> {
    const params = tenantId ? `?tenantId=${tenantId}` : '';
    const response = await api.get(`/api-gateway/security/policies${params}`);
    return response.data;
  }

  async createSecurityPolicy(policy: any): Promise<any> {
    const response = await api.post('/api-gateway/security/policies', policy);
    return response.data;
  }

  async updateSecurityPolicy(id: string, updates: any): Promise<any> {
    const response = await api.put(`/api-gateway/security/policies/${id}`, updates);
    return response.data;
  }

  async deleteSecurityPolicy(id: string): Promise<boolean> {
    try {
      await api.delete(`/api-gateway/security/policies/${id}`);
      return true;
    } catch (error) {
      return false;
    }
  }

  // API Analytics
  async getApiAnalytics(period: { start: Date; end: Date }, tenantId?: string): Promise<any> {
    const params = new URLSearchParams();
    params.append('start', period.start.toISOString());
    params.append('end', period.end.toISOString());
    if (tenantId) params.append('tenantId', tenantId);

    const response = await api.get(`/api-gateway/analytics?${params.toString()}`);
    return response.data;
  }

  async getTopEndpoints(tenantId?: string): Promise<any[]> {
    const params = tenantId ? `?tenantId=${tenantId}` : '';
    const response = await api.get(`/api-gateway/analytics/top-endpoints${params}`);
    return response.data;
  }

  async getErrorRates(tenantId?: string): Promise<any[]> {
    const params = tenantId ? `?tenantId=${tenantId}` : '';
    const response = await api.get(`/api-gateway/analytics/error-rates${params}`);
    return response.data;
  }

  async getResponseTimeMetrics(tenantId?: string): Promise<any> {
    const params = tenantId ? `?tenantId=${tenantId}` : '';
    const response = await api.get(`/api-gateway/analytics/response-times${params}`);
    return response.data;
  }
}

export const apiGatewayService = new ApiGatewayService();
