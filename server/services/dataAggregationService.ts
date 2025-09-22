/**
 * Data Aggregation Service for Analytics
 * @copyright 2025 Syrian Ministry of Communications and Information Technology
 */

import { analyticsService } from './analyticsService';
import { redisService } from './redisService';
import { storage } from '../database/storage';

export interface AggregatedData {
  formId: string;
  tenantId?: string;
  period: 'hour' | 'day' | 'week' | 'month' | 'year';
  startDate: Date;
  endDate: Date;
  metrics: {
    views: number;
    submissions: number;
    completionRate: number;
    averageTimeToComplete: number;
    bounceRate: number;
    topPages: Array<{ page: number; views: number; dropOffRate: number }>;
    deviceBreakdown: { desktop: number; mobile: number; tablet: number };
    browserBreakdown: Record<string, number>;
    osBreakdown: Record<string, number>;
    timeSeries: Array<{ timestamp: Date; views: number; submissions: number }>;
  };
}

export interface UserAggregatedData {
  userId: string;
  tenantId?: string;
  period: 'hour' | 'day' | 'week' | 'month' | 'year';
  startDate: Date;
  endDate: Date;
  metrics: {
    formsCreated: number;
    formsPublished: number;
    submissionsReceived: number;
    averageCompletionRate: number;
    mostUsedComponents: Array<{ componentType: string; usageCount: number }>;
    activityTimeline: Array<{ timestamp: Date; activity: string; count: number }>;
  };
}

export interface TenantAggregatedData {
  tenantId: string;
  period: 'hour' | 'day' | 'week' | 'month' | 'year';
  startDate: Date;
  endDate: Date;
  metrics: {
    totalForms: number;
    totalSubmissions: number;
    totalUsers: number;
    activeUsers: number;
    storageUsed: number;
    apiCalls: number;
    averageResponseTime: number;
    errorRate: number;
    timeSeries: Array<{ timestamp: Date; forms: number; submissions: number; users: number }>;
  };
}

class DataAggregationService {
  private aggregationCache: Map<string, any> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  // Aggregate form analytics data
  async aggregateFormData(
    formId: string,
    tenantId?: string,
    period: 'hour' | 'day' | 'week' | 'month' | 'year' = 'day',
    startDate?: Date,
    endDate?: Date
  ): Promise<AggregatedData> {
    const cacheKey = `form_aggregation:${formId}:${tenantId || 'global'}:${period}:${startDate?.getTime()}:${endDate?.getTime()}`;
    
    // Check cache first
    const cached = this.aggregationCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    try {
      const now = new Date();
      const start = startDate || this.getPeriodStart(now, period);
      const end = endDate || now;

      // Get raw analytics events
      const events = await analyticsService.getRealTimeAnalytics(tenantId, {
        start: start.getTime(),
        end: end.getTime()
      });

      // Filter events for this form
      const formEvents = events.filter(event => event.formId === formId);

      // Aggregate metrics
      const metrics = this.aggregateFormMetrics(formEvents, start, end, period);

      const aggregatedData: AggregatedData = {
        formId,
        tenantId,
        period,
        startDate: start,
        endDate: end,
        metrics
      };

      // Cache the result
      this.aggregationCache.set(cacheKey, {
        data: aggregatedData,
        timestamp: Date.now()
      });

      return aggregatedData;
    } catch (error) {
      console.error('Error aggregating form data:', error);
      throw error;
    }
  }

  // Aggregate user analytics data
  async aggregateUserData(
    userId: string,
    tenantId?: string,
    period: 'hour' | 'day' | 'week' | 'month' | 'year' = 'day',
    startDate?: Date,
    endDate?: Date
  ): Promise<UserAggregatedData> {
    const cacheKey = `user_aggregation:${userId}:${tenantId || 'global'}:${period}:${startDate?.getTime()}:${endDate?.getTime()}`;
    
    // Check cache first
    const cached = this.aggregationCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    try {
      const now = new Date();
      const start = startDate || this.getPeriodStart(now, period);
      const end = endDate || now;

      // Get user analytics from database
      const userAnalytics = await analyticsService.getUserAnalytics(userId, tenantId);
      
      if (!userAnalytics) {
        throw new Error('User analytics not found');
      }

      // Get raw events for this user
      const events = await analyticsService.getRealTimeAnalytics(tenantId, {
        start: start.getTime(),
        end: end.getTime()
      });

      const userEvents = events.filter(event => event.userId === userId);

      // Aggregate metrics
      const metrics = this.aggregateUserMetrics(userEvents, userAnalytics, start, end, period);

      const aggregatedData: UserAggregatedData = {
        userId,
        tenantId,
        period,
        startDate: start,
        endDate: end,
        metrics
      };

      // Cache the result
      this.aggregationCache.set(cacheKey, {
        data: aggregatedData,
        timestamp: Date.now()
      });

      return aggregatedData;
    } catch (error) {
      console.error('Error aggregating user data:', error);
      throw error;
    }
  }

  // Aggregate tenant analytics data
  async aggregateTenantData(
    tenantId: string,
    period: 'hour' | 'day' | 'week' | 'month' | 'year' = 'day',
    startDate?: Date,
    endDate?: Date
  ): Promise<TenantAggregatedData> {
    const cacheKey = `tenant_aggregation:${tenantId}:${period}:${startDate?.getTime()}:${endDate?.getTime()}`;
    
    // Check cache first
    const cached = this.aggregationCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    try {
      const now = new Date();
      const start = startDate || this.getPeriodStart(now, period);
      const end = endDate || now;

      // Get tenant analytics from database
      const tenantAnalytics = await analyticsService.getTenantAnalytics(tenantId);
      
      if (!tenantAnalytics) {
        throw new Error('Tenant analytics not found');
      }

      // Get raw events for this tenant
      const events = await analyticsService.getRealTimeAnalytics(tenantId, {
        start: start.getTime(),
        end: end.getTime()
      });

      // Aggregate metrics
      const metrics = this.aggregateTenantMetrics(events, tenantAnalytics, start, end, period);

      const aggregatedData: TenantAggregatedData = {
        tenantId,
        period,
        startDate: start,
        endDate: end,
        metrics
      };

      // Cache the result
      this.aggregationCache.set(cacheKey, {
        data: aggregatedData,
        timestamp: Date.now()
      });

      return aggregatedData;
    } catch (error) {
      console.error('Error aggregating tenant data:', error);
      throw error;
    }
  }

  // Aggregate form metrics from events
  private aggregateFormMetrics(events: any[], start: Date, end: Date, period: string) {
    const views = events.filter(e => e.type === 'form_view').length;
    const submissions = events.filter(e => e.type === 'form_submission').length;
    const completionRate = views > 0 ? (submissions / views) * 100 : 0;

    // Calculate average time to complete
    const submissionEvents = events.filter(e => e.type === 'form_submission');
    const averageTimeToComplete = submissionEvents.length > 0 
      ? submissionEvents.reduce((sum, event) => sum + (event.data.timeToComplete || 0), 0) / submissionEvents.length
      : 0;

    // Calculate bounce rate
    const bounceEvents = events.filter(e => e.type === 'form_abandon');
    const bounceRate = views > 0 ? (bounceEvents.length / views) * 100 : 0;

    // Device breakdown
    const deviceBreakdown = { desktop: 0, mobile: 0, tablet: 0 };
    events.forEach(event => {
      if (event.metadata?.deviceType) {
        const device = event.metadata.deviceType.toLowerCase();
        if (device === 'desktop') deviceBreakdown.desktop++;
        else if (device === 'mobile') deviceBreakdown.mobile++;
        else if (device === 'tablet') deviceBreakdown.tablet++;
      }
    });

    // Browser breakdown
    const browserBreakdown: Record<string, number> = {};
    events.forEach(event => {
      if (event.metadata?.browser) {
        const browser = event.metadata.browser;
        browserBreakdown[browser] = (browserBreakdown[browser] || 0) + 1;
      }
    });

    // OS breakdown
    const osBreakdown: Record<string, number> = {};
    events.forEach(event => {
      if (event.metadata?.os) {
        const os = event.metadata.os;
        osBreakdown[os] = (osBreakdown[os] || 0) + 1;
      }
    });

    // Time series
    const timeSeries = this.generateTimeSeries(events, start, end, period);

    return {
      views,
      submissions,
      completionRate,
      averageTimeToComplete,
      bounceRate,
      topPages: [], // This would be calculated from page-specific events
      deviceBreakdown,
      browserBreakdown,
      osBreakdown,
      timeSeries
    };
  }

  // Aggregate user metrics from events
  private aggregateUserMetrics(events: any[], userAnalytics: any, start: Date, end: Date, period: string) {
    const formsCreated = events.filter(e => e.type === 'form_created').length;
    const formsPublished = events.filter(e => e.type === 'form_published').length;
    const submissionsReceived = events.filter(e => e.type === 'form_submission').length;

    // Calculate average completion rate
    const formViews = events.filter(e => e.type === 'form_view');
    const formSubmissions = events.filter(e => e.type === 'form_submission');
    const averageCompletionRate = formViews.length > 0 
      ? (formSubmissions.length / formViews.length) * 100 
      : 0;

    // Most used components
    const mostUsedComponents: Array<{ componentType: string; usageCount: number }> = [];
    const componentUsage: Record<string, number> = {};
    
    events.forEach(event => {
      if (event.type === 'component_added' && event.data.componentType) {
        const componentType = event.data.componentType;
        componentUsage[componentType] = (componentUsage[componentType] || 0) + 1;
      }
    });

    Object.entries(componentUsage).forEach(([componentType, usageCount]) => {
      mostUsedComponents.push({ componentType, usageCount });
    });

    mostUsedComponents.sort((a, b) => b.usageCount - a.usageCount);

    // Activity timeline
    const activityTimeline = this.generateActivityTimeline(events, start, end, period);

    return {
      formsCreated,
      formsPublished,
      submissionsReceived,
      averageCompletionRate,
      mostUsedComponents,
      activityTimeline
    };
  }

  // Aggregate tenant metrics from events
  private aggregateTenantMetrics(events: any[], tenantAnalytics: any, start: Date, end: Date, period: string) {
    const totalForms = events.filter(e => e.type === 'form_created').length;
    const totalSubmissions = events.filter(e => e.type === 'form_submission').length;
    const totalUsers = new Set(events.map(e => e.userId).filter(Boolean)).size;
    const activeUsers = totalUsers; // Users who have events in this period

    // Calculate storage used (mock calculation)
    const storageUsed = events.reduce((sum, event) => {
      return sum + (event.data.storageSize || 0);
    }, 0);

    // Calculate API calls
    const apiCalls = events.filter(e => e.type === 'api_call').length;

    // Calculate average response time
    const apiEvents = events.filter(e => e.type === 'api_call' && e.data.responseTime);
    const averageResponseTime = apiEvents.length > 0
      ? apiEvents.reduce((sum, event) => sum + event.data.responseTime, 0) / apiEvents.length
      : 0;

    // Calculate error rate
    const errorEvents = events.filter(e => e.type === 'api_error');
    const errorRate = apiCalls > 0 ? (errorEvents.length / apiCalls) * 100 : 0;

    // Time series
    const timeSeries = this.generateTimeSeries(events, start, end, period);

    return {
      totalForms,
      totalSubmissions,
      totalUsers,
      activeUsers,
      storageUsed,
      apiCalls,
      averageResponseTime,
      errorRate,
      timeSeries
    };
  }

  // Generate time series data
  private generateTimeSeries(events: any[], start: Date, end: Date, period: string) {
    const timeSeries: Array<{ timestamp: Date; views: number; submissions: number }> = [];
    
    const interval = this.getTimeInterval(period);
    let current = new Date(start);
    
    while (current <= end) {
      const next = new Date(current.getTime() + interval);
      
      const periodEvents = events.filter(event => {
        const eventTime = new Date(event.timestamp);
        return eventTime >= current && eventTime < next;
      });
      
      const views = periodEvents.filter(e => e.type === 'form_view').length;
      const submissions = periodEvents.filter(e => e.type === 'form_submission').length;
      
      timeSeries.push({
        timestamp: new Date(current),
        views,
        submissions
      });
      
      current = next;
    }
    
    return timeSeries;
  }

  // Generate activity timeline
  private generateActivityTimeline(events: any[], start: Date, end: Date, period: string) {
    const timeline: Array<{ timestamp: Date; activity: string; count: number }> = [];
    
    const interval = this.getTimeInterval(period);
    let current = new Date(start);
    
    while (current <= end) {
      const next = new Date(current.getTime() + interval);
      
      const periodEvents = events.filter(event => {
        const eventTime = new Date(event.timestamp);
        return eventTime >= current && eventTime < next;
      });
      
      // Group by activity type
      const activityCounts: Record<string, number> = {};
      periodEvents.forEach(event => {
        activityCounts[event.type] = (activityCounts[event.type] || 0) + 1;
      });
      
      Object.entries(activityCounts).forEach(([activity, count]) => {
        timeline.push({
          timestamp: new Date(current),
          activity,
          count
        });
      });
      
      current = next;
    }
    
    return timeline;
  }

  // Get period start date
  private getPeriodStart(date: Date, period: string): Date {
    const start = new Date(date);
    
    switch (period) {
      case 'hour':
        start.setMinutes(0, 0, 0);
        break;
      case 'day':
        start.setHours(0, 0, 0, 0);
        break;
      case 'week':
        start.setDate(start.getDate() - start.getDay());
        start.setHours(0, 0, 0, 0);
        break;
      case 'month':
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        break;
      case 'year':
        start.setMonth(0, 1);
        start.setHours(0, 0, 0, 0);
        break;
    }
    
    return start;
  }

  // Get time interval in milliseconds
  private getTimeInterval(period: string): number {
    switch (period) {
      case 'hour':
        return 60 * 60 * 1000; // 1 hour
      case 'day':
        return 24 * 60 * 60 * 1000; // 1 day
      case 'week':
        return 7 * 24 * 60 * 60 * 1000; // 1 week
      case 'month':
        return 30 * 24 * 60 * 60 * 1000; // 30 days
      case 'year':
        return 365 * 24 * 60 * 60 * 1000; // 365 days
      default:
        return 24 * 60 * 60 * 1000; // 1 day
    }
  }

  // Clear cache
  public clearCache() {
    this.aggregationCache.clear();
  }

  // Clear cache for specific key pattern
  public clearCachePattern(pattern: string) {
    for (const key of this.aggregationCache.keys()) {
      if (key.includes(pattern)) {
        this.aggregationCache.delete(key);
      }
    }
  }
}

export const dataAggregationService = new DataAggregationService();
export default dataAggregationService;
