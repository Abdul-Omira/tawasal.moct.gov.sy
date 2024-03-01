/**
 * Form Builder Platform - Analytics Type Definitions
 * TypeScript interfaces for analytics and reporting
 */

import { Form, FormComponent, FormResponse } from './form';

// Analytics data types
export interface FormAnalyticsData {
  formId: string;
  formTitle: string;
  totalViews: number;
  totalSubmissions: number;
  completionRate: number;
  avgCompletionTime: number; // seconds
  bounceRate: number;
  dailyStats: DailyStats[];
  weeklyStats: WeeklyStats[];
  monthlyStats: MonthlyStats[];
  componentStats: ComponentAnalytics[];
  userEngagement: UserEngagementData;
  conversionFunnel: ConversionFunnelData;
  timeSeriesData: TimeSeriesData[];
  geographicData: GeographicData[];
  deviceData: DeviceData[];
  browserData: BrowserData[];
}

// Time-based analytics
export interface DailyStats {
  date: string; // YYYY-MM-DD
  views: number;
  submissions: number;
  completionRate: number;
  avgCompletionTime: number;
  uniqueVisitors: number;
  bounceRate: number;
}

export interface WeeklyStats {
  week: string; // YYYY-WW
  views: number;
  submissions: number;
  completionRate: number;
  avgCompletionTime: number;
  uniqueVisitors: number;
  bounceRate: number;
}

export interface MonthlyStats {
  month: string; // YYYY-MM
  views: number;
  submissions: number;
  completionRate: number;
  avgCompletionTime: number;
  uniqueVisitors: number;
  bounceRate: number;
}

// Component-specific analytics
export interface ComponentAnalytics {
  componentId: string;
  componentType: string;
  label: string;
  responseCount: number;
  completionRate: number;
  avgTime: number; // seconds
  errorRate: number;
  abandonmentRate: number;
  mostCommonValues: CommonValue[];
  responseDistribution: ResponseDistribution[];
  timeToComplete: TimeToCompleteData;
}

export interface CommonValue {
  value: any;
  count: number;
  percentage: number;
}

export interface ResponseDistribution {
  value: any;
  count: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
}

export interface TimeToCompleteData {
  min: number;
  max: number;
  avg: number;
  median: number;
  p95: number;
  p99: number;
}

// User engagement analytics
export interface UserEngagementData {
  totalUsers: number;
  returningUsers: number;
  newUsers: number;
  avgSessionDuration: number; // seconds
  avgPagesPerSession: number;
  userRetentionRate: number;
  topUserSegments: UserSegment[];
  userJourney: UserJourneyStep[];
}

export interface UserSegment {
  name: string;
  count: number;
  percentage: number;
  characteristics: Record<string, any>;
}

export interface UserJourneyStep {
  step: number;
  name: string;
  users: number;
  dropoffRate: number;
  avgTime: number;
}

// Conversion funnel analytics
export interface ConversionFunnelData {
  steps: FunnelStep[];
  overallConversionRate: number;
  stepConversionRates: number[];
  dropoffPoints: DropoffPoint[];
  optimizationOpportunities: OptimizationOpportunity[];
}

export interface FunnelStep {
  step: number;
  name: string;
  users: number;
  conversionRate: number;
  dropoffRate: number;
}

export interface DropoffPoint {
  step: number;
  name: string;
  dropoffRate: number;
  potentialImpact: 'high' | 'medium' | 'low';
  recommendations: string[];
}

export interface OptimizationOpportunity {
  step: number;
  name: string;
  currentRate: number;
  potentialRate: number;
  improvement: number;
  recommendations: string[];
}

// Time series data
export interface TimeSeriesData {
  timestamp: string;
  views: number;
  submissions: number;
  completionRate: number;
  avgCompletionTime: number;
  uniqueVisitors: number;
}

// Geographic analytics
export interface GeographicData {
  country: string;
  region?: string;
  city?: string;
  views: number;
  submissions: number;
  completionRate: number;
  avgCompletionTime: number;
}

// Device analytics
export interface DeviceData {
  deviceType: 'desktop' | 'mobile' | 'tablet';
  count: number;
  percentage: number;
  completionRate: number;
  avgCompletionTime: number;
  bounceRate: number;
}

export interface BrowserData {
  browser: string;
  version: string;
  count: number;
  percentage: number;
  completionRate: number;
  avgCompletionTime: number;
  bounceRate: number;
}

// Analytics filters
export interface AnalyticsFilters {
  dateRange: {
    start: Date;
    end: Date;
  };
  formIds?: string[];
  componentIds?: string[];
  deviceTypes?: string[];
  browsers?: string[];
  countries?: string[];
  userSegments?: string[];
}

// Analytics query parameters
export interface AnalyticsQuery {
  formId: string;
  filters?: AnalyticsFilters;
  groupBy?: 'day' | 'week' | 'month';
  metrics?: AnalyticsMetric[];
  dimensions?: AnalyticsDimension[];
  limit?: number;
  offset?: number;
}

export type AnalyticsMetric = 
  | 'views'
  | 'submissions'
  | 'completionRate'
  | 'avgCompletionTime'
  | 'bounceRate'
  | 'uniqueVisitors'
  | 'errorRate'
  | 'abandonmentRate';

export type AnalyticsDimension = 
  | 'date'
  | 'component'
  | 'device'
  | 'browser'
  | 'country'
  | 'userSegment'
  | 'hour'
  | 'dayOfWeek';

// Analytics dashboard data
export interface AnalyticsDashboardData {
  overview: OverviewMetrics;
  charts: ChartData[];
  tables: TableData[];
  insights: Insight[];
  recommendations: Recommendation[];
}

export interface OverviewMetrics {
  totalForms: number;
  totalViews: number;
  totalSubmissions: number;
  avgCompletionRate: number;
  avgCompletionTime: number;
  totalUsers: number;
  activeForms: number;
  topPerformingForm: {
    id: string;
    title: string;
    completionRate: number;
  };
}

export interface ChartData {
  id: string;
  type: 'line' | 'bar' | 'pie' | 'doughnut' | 'area' | 'scatter';
  title: string;
  data: any[];
  options: any;
  insights?: string[];
}

export interface TableData {
  id: string;
  title: string;
  columns: TableColumn[];
  data: any[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface TableColumn {
  key: string;
  title: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'percentage';
  sortable?: boolean;
  filterable?: boolean;
  formatter?: (value: any) => string;
}

export interface Insight {
  id: string;
  type: 'positive' | 'negative' | 'neutral';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  actionable: boolean;
  recommendations?: string[];
}

export interface Recommendation {
  id: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: string;
  effort: 'low' | 'medium' | 'high';
  category: 'performance' | 'conversion' | 'user-experience' | 'technical';
}

// Export and reporting
export interface ExportOptions {
  format: 'csv' | 'pdf' | 'excel' | 'json';
  dateRange: {
    start: Date;
    end: Date;
  };
  includeMetadata: boolean;
  includeUserInfo: boolean;
  includeCharts: boolean;
  includeInsights: boolean;
  groupBy?: 'day' | 'week' | 'month';
  filters?: AnalyticsFilters;
}

export interface ReportData {
  formId: string;
  formTitle: string;
  generatedAt: Date;
  dateRange: {
    start: Date;
    end: Date;
  };
  data: FormAnalyticsData;
  charts: ChartData[];
  insights: Insight[];
  recommendations: Recommendation[];
}

// Real-time analytics
export interface RealTimeAnalytics {
  activeUsers: number;
  currentViews: number;
  submissionsToday: number;
  completionRateToday: number;
  topForms: Array<{
    formId: string;
    title: string;
    views: number;
    submissions: number;
  }>;
  recentActivity: Activity[];
}

export interface Activity {
  id: string;
  type: 'view' | 'submission' | 'error' | 'completion';
  formId: string;
  formTitle: string;
  timestamp: Date;
  userInfo?: {
    ipAddress?: string;
    userAgent?: string;
    country?: string;
  };
  details?: Record<string, any>;
}

// Analytics API response types
export interface AnalyticsApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Analytics hooks return types
export interface UseAnalyticsReturn {
  data: FormAnalyticsData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
  updateFilters: (filters: AnalyticsFilters) => void;
  exportData: (options: ExportOptions) => Promise<void>;
}

export interface UseRealTimeAnalyticsReturn {
  data: RealTimeAnalytics | null;
  loading: boolean;
  error: string | null;
  isConnected: boolean;
  subscribe: () => void;
  unsubscribe: () => void;
}
