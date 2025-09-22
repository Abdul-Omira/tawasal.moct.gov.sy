import { FormSubmissionData, FormAnalyticsSummary } from '@/types/form';

export interface ReportConfig {
  id: string;
  name: string;
  description: string;
  type: 'summary' | 'detailed' | 'custom';
  filters: ReportFilters;
  columns: ReportColumn[];
  groupBy?: string[];
  aggregations?: ReportAggregation[];
  schedule?: ReportSchedule;
  isPublic: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportFilters {
  dateRange: {
    start: Date;
    end: Date;
  };
  formIds?: string[];
  ministryIds?: string[];
  status?: string[];
  customFilters?: Record<string, any>;
}

export interface ReportColumn {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'select';
  source: 'form_field' | 'submission_meta' | 'calculated';
  fieldPath?: string;
  calculation?: string;
  format?: string;
}

export interface ReportAggregation {
  field: string;
  function: 'count' | 'sum' | 'avg' | 'min' | 'max' | 'distinct';
  label: string;
}

export interface ReportSchedule {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  time: string; // HH:MM format
  dayOfWeek?: number; // 0-6 for weekly
  dayOfMonth?: number; // 1-31 for monthly
  recipients: string[];
  format: 'pdf' | 'excel' | 'csv';
}

export interface ReportData {
  id: string;
  reportId: string;
  data: any[];
  metadata: {
    totalRows: number;
    generatedAt: Date;
    filters: ReportFilters;
    generatedBy: string;
  };
  status: 'generating' | 'completed' | 'failed';
  downloadUrl?: string;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  config: Partial<ReportConfig>;
  isPublic: boolean;
  createdBy: string;
  usageCount: number;
}

class ReportService {
  private baseUrl = '/api/reports';

  // Report Configuration Management
  async createReport(config: Omit<ReportConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<ReportConfig> {
    const response = await fetch(`${this.baseUrl}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      throw new Error('Failed to create report');
    }

    return response.json();
  }

  async getReports(): Promise<ReportConfig[]> {
    const response = await fetch(`${this.baseUrl}`);
    if (!response.ok) {
      throw new Error('Failed to fetch reports');
    }
    return response.json();
  }

  async getReport(id: string): Promise<ReportConfig> {
    const response = await fetch(`${this.baseUrl}/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch report');
    }
    return response.json();
  }

  async updateReport(id: string, config: Partial<ReportConfig>): Promise<ReportConfig> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      throw new Error('Failed to update report');
    }

    return response.json();
  }

  async deleteReport(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete report');
    }
  }

  // Report Generation
  async generateReport(reportId: string, filters?: Partial<ReportFilters>): Promise<ReportData> {
    const response = await fetch(`${this.baseUrl}/${reportId}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ filters }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate report');
    }

    return response.json();
  }

  async getReportData(reportId: string, page = 1, limit = 100): Promise<{
    data: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const response = await fetch(`${this.baseUrl}/${reportId}/data?page=${page}&limit=${limit}`);
    if (!response.ok) {
      throw new Error('Failed to fetch report data');
    }
    return response.json();
  }

  async downloadReport(reportId: string, format: 'pdf' | 'excel' | 'csv'): Promise<Blob> {
    const response = await fetch(`${this.baseUrl}/${reportId}/download?format=${format}`);
    if (!response.ok) {
      throw new Error('Failed to download report');
    }
    return response.blob();
  }

  // Report Templates
  async getTemplates(): Promise<ReportTemplate[]> {
    const response = await fetch(`${this.baseUrl}/templates`);
    if (!response.ok) {
      throw new Error('Failed to fetch templates');
    }
    return response.json();
  }

  async createTemplate(template: Omit<ReportTemplate, 'id' | 'usageCount'>): Promise<ReportTemplate> {
    const response = await fetch(`${this.baseUrl}/templates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(template),
    });

    if (!response.ok) {
      throw new Error('Failed to create template');
    }

    return response.json();
  }

  async useTemplate(templateId: string, overrides?: Partial<ReportConfig>): Promise<ReportConfig> {
    const response = await fetch(`${this.baseUrl}/templates/${templateId}/use`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(overrides),
    });

    if (!response.ok) {
      throw new Error('Failed to use template');
    }

    return response.json();
  }

  // Report Scheduling
  async getScheduledReports(): Promise<ReportConfig[]> {
    const response = await fetch(`${this.baseUrl}/scheduled`);
    if (!response.ok) {
      throw new Error('Failed to fetch scheduled reports');
    }
    return response.json();
  }

  async updateSchedule(reportId: string, schedule: ReportSchedule): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${reportId}/schedule`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(schedule),
    });

    if (!response.ok) {
      throw new Error('Failed to update schedule');
    }
  }

  // Report Sharing
  async shareReport(reportId: string, permissions: {
    isPublic: boolean;
    allowedUsers?: string[];
    allowedRoles?: string[];
    expiresAt?: Date;
  }): Promise<{ shareUrl: string; accessToken: string }> {
    const response = await fetch(`${this.baseUrl}/${reportId}/share`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(permissions),
    });

    if (!response.ok) {
      throw new Error('Failed to share report');
    }

    return response.json();
  }

  async getSharedReports(): Promise<ReportConfig[]> {
    const response = await fetch(`${this.baseUrl}/shared`);
    if (!response.ok) {
      throw new Error('Failed to fetch shared reports');
    }
    return response.json();
  }

  // Analytics
  async getReportAnalytics(): Promise<{
    totalReports: number;
    scheduledReports: number;
    sharedReports: number;
    mostUsedTemplates: ReportTemplate[];
    recentActivity: Array<{
      id: string;
      action: string;
      reportName: string;
      user: string;
      timestamp: Date;
    }>;
  }> {
    const response = await fetch(`${this.baseUrl}/analytics`);
    if (!response.ok) {
      throw new Error('Failed to fetch report analytics');
    }
    return response.json();
  }
}

export const reportService = new ReportService();
export default reportService;
