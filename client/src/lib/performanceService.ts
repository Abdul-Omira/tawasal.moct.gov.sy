import { FormSubmissionData, FormAnalyticsSummary } from '@/types/form';

export interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  category: 'response_time' | 'throughput' | 'error_rate' | 'resource_usage' | 'user_experience';
  tags?: Record<string, string>;
}

export interface PerformanceAlert {
  id: string;
  name: string;
  description: string;
  condition: PerformanceCondition;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'triggered' | 'resolved' | 'disabled';
  createdAt: Date;
  triggeredAt?: Date;
  resolvedAt?: Date;
  lastTriggered?: Date;
  triggerCount: number;
  notificationChannels: string[];
}

export interface PerformanceCondition {
  metric: string;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'ne';
  threshold: number;
  duration?: number; // in minutes
  aggregation?: 'avg' | 'max' | 'min' | 'sum' | 'count';
}

export interface PerformanceDashboard {
  id: string;
  name: string;
  description: string;
  widgets: PerformanceWidget[];
  isPublic: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PerformanceWidget {
  id: string;
  type: 'chart' | 'metric' | 'table' | 'alert';
  title: string;
  config: any;
  position: { x: number; y: number; w: number; h: number };
}

export interface PerformanceReport {
  id: string;
  name: string;
  period: {
    start: Date;
    end: Date;
  };
  metrics: PerformanceMetric[];
  summary: {
    avgResponseTime: number;
    totalRequests: number;
    errorRate: number;
    uptime: number;
    topSlowQueries: Array<{ query: string; avgTime: number; count: number }>;
    resourceUsage: {
      cpu: number;
      memory: number;
      disk: number;
      network: number;
    };
  };
  recommendations: string[];
  generatedAt: Date;
  generatedBy: string;
}

class PerformanceService {
  private baseUrl = '/api/performance';

  // Performance Metrics
  async getMetrics(filters: {
    category?: string;
    startDate?: Date;
    endDate?: Date;
    tags?: Record<string, string>;
  }): Promise<PerformanceMetric[]> {
    const params = new URLSearchParams();
    if (filters.category) params.append('category', filters.category);
    if (filters.startDate) params.append('startDate', filters.startDate.toISOString());
    if (filters.endDate) params.append('endDate', filters.endDate.toISOString());
    if (filters.tags) params.append('tags', JSON.stringify(filters.tags));

    const response = await fetch(`${this.baseUrl}/metrics?${params}`);
    if (!response.ok) {
      throw new Error('Failed to fetch performance metrics');
    }
    return response.json();
  }

  async recordMetric(metric: Omit<PerformanceMetric, 'id' | 'timestamp'>): Promise<PerformanceMetric> {
    const response = await fetch(`${this.baseUrl}/metrics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(metric),
    });

    if (!response.ok) {
      throw new Error('Failed to record performance metric');
    }

    return response.json();
  }

  // Performance Alerts
  async getAlerts(): Promise<PerformanceAlert[]> {
    const response = await fetch(`${this.baseUrl}/alerts`);
    if (!response.ok) {
      throw new Error('Failed to fetch performance alerts');
    }
    return response.json();
  }

  async createAlert(alert: Omit<PerformanceAlert, 'id' | 'createdAt' | 'triggerCount'>): Promise<PerformanceAlert> {
    const response = await fetch(`${this.baseUrl}/alerts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(alert),
    });

    if (!response.ok) {
      throw new Error('Failed to create performance alert');
    }

    return response.json();
  }

  async updateAlert(id: string, updates: Partial<PerformanceAlert>): Promise<PerformanceAlert> {
    const response = await fetch(`${this.baseUrl}/alerts/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error('Failed to update performance alert');
    }

    return response.json();
  }

  async deleteAlert(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/alerts/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete performance alert');
    }
  }

  async testAlert(id: string): Promise<{ triggered: boolean; message: string }> {
    const response = await fetch(`${this.baseUrl}/alerts/${id}/test`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('Failed to test performance alert');
    }

    return response.json();
  }

  // Performance Dashboards
  async getDashboards(): Promise<PerformanceDashboard[]> {
    const response = await fetch(`${this.baseUrl}/dashboards`);
    if (!response.ok) {
      throw new Error('Failed to fetch performance dashboards');
    }
    return response.json();
  }

  async createDashboard(dashboard: Omit<PerformanceDashboard, 'id' | 'createdAt' | 'updatedAt'>): Promise<PerformanceDashboard> {
    const response = await fetch(`${this.baseUrl}/dashboards`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dashboard),
    });

    if (!response.ok) {
      throw new Error('Failed to create performance dashboard');
    }

    return response.json();
  }

  async updateDashboard(id: string, updates: Partial<PerformanceDashboard>): Promise<PerformanceDashboard> {
    const response = await fetch(`${this.baseUrl}/dashboards/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error('Failed to update performance dashboard');
    }

    return response.json();
  }

  async deleteDashboard(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/dashboards/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete performance dashboard');
    }
  }

  // Performance Reports
  async generateReport(config: {
    name: string;
    period: { start: Date; end: Date };
    metrics: string[];
    includeRecommendations?: boolean;
  }): Promise<PerformanceReport> {
    const response = await fetch(`${this.baseUrl}/reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      throw new Error('Failed to generate performance report');
    }

    return response.json();
  }

  async getReports(): Promise<PerformanceReport[]> {
    const response = await fetch(`${this.baseUrl}/reports`);
    if (!response.ok) {
      throw new Error('Failed to fetch performance reports');
    }
    return response.json();
  }

  async downloadReport(id: string, format: 'pdf' | 'excel' | 'csv'): Promise<Blob> {
    const response = await fetch(`${this.baseUrl}/reports/${id}/download?format=${format}`);
    if (!response.ok) {
      throw new Error('Failed to download performance report');
    }
    return response.blob();
  }

  // Performance Optimization
  async getOptimizationSuggestions(): Promise<Array<{
    id: string;
    title: string;
    description: string;
    impact: 'low' | 'medium' | 'high';
    effort: 'low' | 'medium' | 'high';
    category: 'database' | 'api' | 'frontend' | 'infrastructure';
    currentValue: number;
    suggestedValue: number;
    potentialImprovement: string;
  }>> {
    const response = await fetch(`${this.baseUrl}/optimization/suggestions`);
    if (!response.ok) {
      throw new Error('Failed to fetch optimization suggestions');
    }
    return response.json();
  }

  async applyOptimization(optimizationId: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${this.baseUrl}/optimization/${optimizationId}/apply`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('Failed to apply optimization');
    }

    return response.json();
  }

  // Real-time Performance Monitoring
  async getRealTimeMetrics(): Promise<{
    responseTime: number;
    requestsPerSecond: number;
    errorRate: number;
    activeUsers: number;
    systemLoad: {
      cpu: number;
      memory: number;
      disk: number;
    };
  }> {
    const response = await fetch(`${this.baseUrl}/realtime`);
    if (!response.ok) {
      throw new Error('Failed to fetch real-time metrics');
    }
    return response.json();
  }

  // Performance Health Check
  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    checks: Array<{
      name: string;
      status: 'pass' | 'fail' | 'warn';
      message: string;
      duration: number;
    }>;
    overallScore: number;
    lastChecked: Date;
  }> {
    const response = await fetch(`${this.baseUrl}/health`);
    if (!response.ok) {
      throw new Error('Failed to fetch health status');
    }
    return response.json();
  }

  // Performance Analytics
  async getPerformanceAnalytics(period: { start: Date; end: Date }): Promise<{
    trends: Array<{
      date: string;
      responseTime: number;
      throughput: number;
      errorRate: number;
    }>;
    topSlowEndpoints: Array<{
      endpoint: string;
      avgResponseTime: number;
      requestCount: number;
    }>;
    errorBreakdown: Array<{
      error: string;
      count: number;
      percentage: number;
    }>;
    userExperience: {
      avgPageLoadTime: number;
      bounceRate: number;
      conversionRate: number;
    };
  }> {
    const params = new URLSearchParams({
      startDate: period.start.toISOString(),
      endDate: period.end.toISOString(),
    });

    const response = await fetch(`${this.baseUrl}/analytics?${params}`);
    if (!response.ok) {
      throw new Error('Failed to fetch performance analytics');
    }
    return response.json();
  }
}

export const performanceService = new PerformanceService();
export default performanceService;
