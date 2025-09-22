/**
 * Syrian Ministry of Communication - Citizen Engagement Platform
 * Webhook Service
 * 
 * @author Abdulwahab Omira <abdul@omiratech.com>
 * @version 1.0.0
 * @license MIT
 */

export interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  secret: string;
  isActive: boolean;
  retryPolicy: {
    maxRetries: number;
    retryDelay: number;
    backoffMultiplier: number;
  };
  headers: Record<string, string>;
  filters: {
    formIds?: string[];
    eventTypes?: string[];
    conditions?: Record<string, any>;
  };
  tenantId?: string;
  createdAt: Date;
  updatedAt: Date;
  lastTriggered?: Date;
  successCount: number;
  failureCount: number;
  lastError?: string;
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  eventType: string;
  payload: any;
  status: 'pending' | 'delivered' | 'failed' | 'retrying';
  attempts: number;
  maxAttempts: number;
  nextRetryAt?: Date;
  response?: {
    statusCode: number;
    headers: Record<string, string>;
    body: string;
  };
  error?: string;
  deliveredAt?: Date;
  createdAt: Date;
}

export interface WebhookEvent {
  id: string;
  type: string;
  data: any;
  timestamp: Date;
  tenantId?: string;
  formId?: string;
  submissionId?: string;
}

export interface WebhookStats {
  totalWebhooks: number;
  activeWebhooks: number;
  totalDeliveries: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  averageResponseTime: number;
  topEvents: Array<{
    eventType: string;
    count: number;
  }>;
  recentDeliveries: WebhookDelivery[];
}

export interface WebhookTestResult {
  success: boolean;
  statusCode?: number;
  responseTime: number;
  response?: any;
  error?: string;
}

class WebhookService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = '/api/webhooks';
  }

  // Webhook Management
  async createWebhook(webhookData: Partial<Webhook>): Promise<Webhook> {
    const response = await fetch(`${this.baseUrl}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookData),
    });

    if (!response.ok) {
      throw new Error('Failed to create webhook');
    }

    return response.json();
  }

  async getWebhooks(tenantId?: string): Promise<Webhook[]> {
    const url = tenantId ? `${this.baseUrl}?tenantId=${tenantId}` : this.baseUrl;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Failed to fetch webhooks');
    }

    return response.json();
  }

  async getWebhookById(id: string, tenantId?: string): Promise<Webhook | null> {
    const url = tenantId ? `${this.baseUrl}/${id}?tenantId=${tenantId}` : `${this.baseUrl}/${id}`;
    const response = await fetch(url);

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error('Failed to fetch webhook');
    }

    return response.json();
  }

  async updateWebhook(id: string, updates: Partial<Webhook>, tenantId?: string): Promise<Webhook | null> {
    const url = tenantId ? `${this.baseUrl}/${id}?tenantId=${tenantId}` : `${this.baseUrl}/${id}`;
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
      throw new Error('Failed to update webhook');
    }

    return response.json();
  }

  async deleteWebhook(id: string, tenantId?: string): Promise<boolean> {
    const url = tenantId ? `${this.baseUrl}/${id}?tenantId=${tenantId}` : `${this.baseUrl}/${id}`;
    const response = await fetch(url, {
      method: 'DELETE',
    });

    return response.ok;
  }

  async toggleWebhook(id: string, isActive: boolean, tenantId?: string): Promise<Webhook | null> {
    return this.updateWebhook(id, { isActive }, tenantId);
  }

  // Webhook Delivery Management
  async getWebhookDeliveries(webhookId?: string, filters?: any): Promise<WebhookDelivery[]> {
    const params = new URLSearchParams();
    if (webhookId) params.append('webhookId', webhookId);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.eventType) params.append('eventType', filters.eventType);
    if (filters?.startDate) params.append('startDate', filters.startDate.toISOString());
    if (filters?.endDate) params.append('endDate', filters.endDate.toISOString());

    const response = await fetch(`${this.baseUrl}/deliveries?${params}`);

    if (!response.ok) {
      throw new Error('Failed to fetch webhook deliveries');
    }

    return response.json();
  }

  async getWebhookDeliveryById(id: string): Promise<WebhookDelivery | null> {
    const response = await fetch(`${this.baseUrl}/deliveries/${id}`);

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error('Failed to fetch webhook delivery');
    }

    return response.json();
  }

  async retryWebhookDelivery(id: string): Promise<WebhookDelivery | null> {
    const response = await fetch(`${this.baseUrl}/deliveries/${id}/retry`, {
      method: 'POST',
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error('Failed to retry webhook delivery');
    }

    return response.json();
  }

  // Webhook Testing
  async testWebhook(webhookId: string, testData?: any): Promise<WebhookTestResult> {
    const response = await fetch(`${this.baseUrl}/${webhookId}/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ testData }),
    });

    if (!response.ok) {
      throw new Error('Failed to test webhook');
    }

    return response.json();
  }

  async testWebhookUrl(url: string, payload: any, headers?: Record<string, string>): Promise<WebhookTestResult> {
    const response = await fetch(`${this.baseUrl}/test-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url, payload, headers }),
    });

    if (!response.ok) {
      throw new Error('Failed to test webhook URL');
    }

    return response.json();
  }

  // Webhook Statistics
  async getWebhookStats(tenantId?: string): Promise<WebhookStats> {
    const url = tenantId ? `${this.baseUrl}/stats?tenantId=${tenantId}` : `${this.baseUrl}/stats`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Failed to fetch webhook stats');
    }

    return response.json();
  }

  async getWebhookAnalytics(period: { start: Date; end: Date }, tenantId?: string): Promise<any> {
    const params = new URLSearchParams({
      startDate: period.start.toISOString(),
      endDate: period.end.toISOString(),
    });
    if (tenantId) params.append('tenantId', tenantId);

    const response = await fetch(`${this.baseUrl}/analytics?${params}`);

    if (!response.ok) {
      throw new Error('Failed to fetch webhook analytics');
    }

    return response.json();
  }

  // Event Management
  async getAvailableEvents(): Promise<string[]> {
    const response = await fetch(`${this.baseUrl}/events`);

    if (!response.ok) {
      throw new Error('Failed to fetch available events');
    }

    return response.json();
  }

  async triggerWebhook(webhookId: string, event: WebhookEvent): Promise<boolean> {
    const response = await fetch(`${this.baseUrl}/${webhookId}/trigger`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });

    return response.ok;
  }

  // Webhook Health
  async getWebhookHealth(webhookId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/${webhookId}/health`);

    if (!response.ok) {
      throw new Error('Failed to fetch webhook health');
    }

    return response.json();
  }

  // Bulk Operations
  async bulkUpdateWebhooks(updates: Array<{ id: string; updates: Partial<Webhook> }>): Promise<Webhook[]> {
    const response = await fetch(`${this.baseUrl}/bulk-update`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ updates }),
    });

    if (!response.ok) {
      throw new Error('Failed to bulk update webhooks');
    }

    return response.json();
  }

  async bulkDeleteWebhooks(ids: string[]): Promise<boolean> {
    const response = await fetch(`${this.baseUrl}/bulk-delete`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ids }),
    });

    return response.ok;
  }

  // Webhook Templates
  async getWebhookTemplates(): Promise<any[]> {
    const response = await fetch(`${this.baseUrl}/templates`);

    if (!response.ok) {
      throw new Error('Failed to fetch webhook templates');
    }

    return response.json();
  }

  async createWebhookFromTemplate(templateId: string, config: any): Promise<Webhook> {
    const response = await fetch(`${this.baseUrl}/templates/${templateId}/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      throw new Error('Failed to create webhook from template');
    }

    return response.json();
  }
}

export const webhookService = new WebhookService();
export default webhookService;
