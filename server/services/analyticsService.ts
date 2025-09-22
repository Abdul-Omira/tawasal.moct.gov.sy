/**
 * Analytics Service for Data Collection and Processing
 * @copyright 2025 Syrian Ministry of Communications and Information Technology
 */

import { redisService } from './redisService';
import { storage } from '../database/storage';

export interface AnalyticsEvent {
  id: string;
  type: string;
  formId: string;
  tenantId?: string;
  userId?: string;
  sessionId?: string;
  data: any;
  timestamp: Date;
  metadata?: {
    userAgent?: string;
    ipAddress?: string;
    referrer?: string;
    deviceType?: string;
    browser?: string;
    os?: string;
  };
}

export interface FormAnalytics {
  formId: string;
  tenantId?: string;
  totalViews: number;
  totalSubmissions: number;
  completionRate: number;
  averageTimeToComplete: number;
  bounceRate: number;
  topPages: Array<{
    page: number;
    views: number;
    dropOffRate: number;
  }>;
  deviceBreakdown: {
    desktop: number;
    mobile: number;
    tablet: number;
  };
  browserBreakdown: Record<string, number>;
  osBreakdown: Record<string, number>;
  timeSeries: Array<{
    date: string;
    views: number;
    submissions: number;
  }>;
  lastUpdated: Date;
}

export interface UserAnalytics {
  userId: string;
  tenantId?: string;
  totalFormsCreated: number;
  totalFormsPublished: number;
  totalSubmissionsReceived: number;
  averageFormCompletionRate: number;
  mostUsedComponents: Array<{
    componentType: string;
    usageCount: number;
  }>;
  activityTimeline: Array<{
    date: string;
    activity: string;
    count: number;
  }>;
  lastActive: Date;
}

export interface TenantAnalytics {
  tenantId: string;
  totalForms: number;
  totalSubmissions: number;
  totalUsers: number;
  activeUsers: number;
  storageUsed: number;
  apiCalls: number;
  averageResponseTime: number;
  errorRate: number;
  timeSeries: Array<{
    date: string;
    forms: number;
    submissions: number;
    users: number;
  }>;
  lastUpdated: Date;
}

class AnalyticsService {
  private eventQueue: AnalyticsEvent[] = [];
  private processingInterval: NodeJS.Timeout | null = null;
  private readonly BATCH_SIZE = 100;
  private readonly PROCESSING_INTERVAL = 5000; // 5 seconds

  constructor() {
    this.startProcessing();
  }

  // Start processing events in batches
  private startProcessing() {
    this.processingInterval = setInterval(async () => {
      if (this.eventQueue.length > 0) {
        await this.processBatch();
      }
    }, this.PROCESSING_INTERVAL);
  }

  // Stop processing events
  private stopProcessing() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
  }

  // Process a batch of events
  private async processBatch() {
    const batch = this.eventQueue.splice(0, this.BATCH_SIZE);
    
    try {
      // Store events in Redis for real-time access
      for (const event of batch) {
        await redisService.trackEvent(event.type, event.data, event.tenantId);
      }

      // Store events in database for persistence
      await this.storeEventsInDatabase(batch);

      // Update aggregated analytics
      await this.updateAggregatedAnalytics(batch);
    } catch (error) {
      console.error('Error processing analytics batch:', error);
      // Re-queue failed events
      this.eventQueue.unshift(...batch);
    }
  }

  // Store events in database
  private async storeEventsInDatabase(events: AnalyticsEvent[]) {
    try {
      for (const event of events) {
        await storage.createFormAnalytics({
          formId: event.formId,
          tenantId: event.tenantId,
          eventType: event.type,
          eventData: event.data,
          userId: event.userId,
          sessionId: event.sessionId,
          timestamp: event.timestamp,
          metadata: event.metadata,
        });
      }
    } catch (error) {
      console.error('Error storing events in database:', error);
    }
  }

  // Update aggregated analytics
  private async updateAggregatedAnalytics(events: AnalyticsEvent[]) {
    try {
      // Group events by form and tenant
      const groupedEvents = this.groupEventsByFormAndTenant(events);

      for (const [key, formEvents] of groupedEvents) {
        const [formId, tenantId] = key.split(':');
        await this.updateFormAnalytics(formId, tenantId, formEvents);
      }
    } catch (error) {
      console.error('Error updating aggregated analytics:', error);
    }
  }

  // Group events by form and tenant
  private groupEventsByFormAndTenant(events: AnalyticsEvent[]): Map<string, AnalyticsEvent[]> {
    const grouped = new Map<string, AnalyticsEvent[]>();

    for (const event of events) {
      const key = `${event.formId}:${event.tenantId || 'global'}`;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(event);
    }

    return grouped;
  }

  // Update form analytics
  private async updateFormAnalytics(formId: string, tenantId: string, events: AnalyticsEvent[]) {
    try {
      // Get current analytics
      let analytics = await this.getFormAnalytics(formId, tenantId);
      
      if (!analytics) {
        analytics = {
          formId,
          tenantId,
          totalViews: 0,
          totalSubmissions: 0,
          completionRate: 0,
          averageTimeToComplete: 0,
          bounceRate: 0,
          topPages: [],
          deviceBreakdown: { desktop: 0, mobile: 0, tablet: 0 },
          browserBreakdown: {},
          osBreakdown: {},
          timeSeries: [],
          lastUpdated: new Date(),
        };
      }

      // Update analytics based on events
      for (const event of events) {
        switch (event.type) {
          case 'form_view':
            analytics.totalViews++;
            this.updateDeviceBreakdown(analytics, event.metadata);
            this.updateBrowserBreakdown(analytics, event.metadata);
            this.updateOSBreakdown(analytics, event.metadata);
            break;
          case 'form_submission':
            analytics.totalSubmissions++;
            break;
          case 'form_abandon':
            // Update bounce rate calculation
            break;
        }
      }

      // Recalculate derived metrics
      analytics.completionRate = analytics.totalViews > 0 
        ? (analytics.totalSubmissions / analytics.totalViews) * 100 
        : 0;

      // Update time series
      this.updateTimeSeries(analytics, events);

      // Store updated analytics
      await this.storeFormAnalytics(analytics);
    } catch (error) {
      console.error('Error updating form analytics:', error);
    }
  }

  // Update device breakdown
  private updateDeviceBreakdown(analytics: FormAnalytics, metadata?: any) {
    if (!metadata?.deviceType) return;

    const deviceType = metadata.deviceType.toLowerCase();
    if (deviceType === 'desktop') {
      analytics.deviceBreakdown.desktop++;
    } else if (deviceType === 'mobile') {
      analytics.deviceBreakdown.mobile++;
    } else if (deviceType === 'tablet') {
      analytics.deviceBreakdown.tablet++;
    }
  }

  // Update browser breakdown
  private updateBrowserBreakdown(analytics: FormAnalytics, metadata?: any) {
    if (!metadata?.browser) return;

    const browser = metadata.browser;
    analytics.browserBreakdown[browser] = (analytics.browserBreakdown[browser] || 0) + 1;
  }

  // Update OS breakdown
  private updateOSBreakdown(analytics: FormAnalytics, metadata?: any) {
    if (!metadata?.os) return;

    const os = metadata.os;
    analytics.osBreakdown[os] = (analytics.osBreakdown[os] || 0) + 1;
  }

  // Update time series
  private updateTimeSeries(analytics: FormAnalytics, events: AnalyticsEvent[]) {
    const today = new Date().toISOString().split('T')[0];
    
    // Find or create today's entry
    let todayEntry = analytics.timeSeries.find(entry => entry.date === today);
    if (!todayEntry) {
      todayEntry = { date: today, views: 0, submissions: 0 };
      analytics.timeSeries.push(todayEntry);
    }

    // Update today's metrics
    for (const event of events) {
      if (event.type === 'form_view') {
        todayEntry.views++;
      } else if (event.type === 'form_submission') {
        todayEntry.submissions++;
      }
    }

    // Keep only last 30 days
    analytics.timeSeries = analytics.timeSeries.slice(-30);
  }

  // Store form analytics
  private async storeFormAnalytics(analytics: FormAnalytics) {
    try {
      const key = `analytics:form:${analytics.formId}:${analytics.tenantId || 'global'}`;
      await redisService.set(key, JSON.stringify(analytics), 30 * 24 * 60 * 60); // 30 days TTL
    } catch (error) {
      console.error('Error storing form analytics:', error);
    }
  }

  // Get form analytics
  private async getFormAnalytics(formId: string, tenantId: string): Promise<FormAnalytics | null> {
    try {
      const key = `analytics:form:${formId}:${tenantId || 'global'}`;
      const data = await redisService.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting form analytics:', error);
      return null;
    }
  }

  // Track an event
  async trackEvent(
    type: string,
    formId: string,
    data: any,
    options: {
      tenantId?: string;
      userId?: string;
      sessionId?: string;
      metadata?: any;
    } = {}
  ): Promise<void> {
    const event: AnalyticsEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      formId,
      tenantId: options.tenantId,
      userId: options.userId,
      sessionId: options.sessionId,
      data,
      timestamp: new Date(),
      metadata: options.metadata,
    };

    this.eventQueue.push(event);

    // If queue is getting too large, process immediately
    if (this.eventQueue.length >= this.BATCH_SIZE * 2) {
      await this.processBatch();
    }
  }

  // Get form analytics
  async getFormAnalytics(formId: string, tenantId?: string): Promise<FormAnalytics | null> {
    try {
      const key = `analytics:form:${formId}:${tenantId || 'global'}`;
      const data = await redisService.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting form analytics:', error);
      return null;
    }
  }

  // Get user analytics
  async getUserAnalytics(userId: string, tenantId?: string): Promise<UserAnalytics | null> {
    try {
      const key = `analytics:user:${userId}:${tenantId || 'global'}`;
      const data = await redisService.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting user analytics:', error);
      return null;
    }
  }

  // Get tenant analytics
  async getTenantAnalytics(tenantId: string): Promise<TenantAnalytics | null> {
    try {
      const key = `analytics:tenant:${tenantId}`;
      const data = await redisService.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting tenant analytics:', error);
      return null;
    }
  }

  // Get real-time analytics data
  async getRealTimeAnalytics(tenantId?: string, timeRange?: { start: number; end: number }): Promise<any[]> {
    try {
      return await redisService.getAnalyticsData(tenantId, timeRange);
    } catch (error) {
      console.error('Error getting real-time analytics:', error);
      return [];
    }
  }

  // Get analytics summary
  async getAnalyticsSummary(tenantId?: string): Promise<{
    totalForms: number;
    totalSubmissions: number;
    totalViews: number;
    averageCompletionRate: number;
    topForms: Array<{ formId: string; title: string; submissions: number }>;
  }> {
    try {
      // This would typically query the database for aggregated data
      // For now, return mock data
      return {
        totalForms: 0,
        totalSubmissions: 0,
        totalViews: 0,
        averageCompletionRate: 0,
        topForms: [],
      };
    } catch (error) {
      console.error('Error getting analytics summary:', error);
      return {
        totalForms: 0,
        totalSubmissions: 0,
        totalViews: 0,
        averageCompletionRate: 0,
        topForms: [],
      };
    }
  }

  // Cleanup old data
  async cleanupOldData(daysToKeep = 30): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      // This would typically clean up old analytics data
      console.log(`Cleaning up analytics data older than ${daysToKeep} days`);
    } catch (error) {
      console.error('Error cleaning up old data:', error);
    }
  }

  // Shutdown service
  async shutdown(): Promise<void> {
    this.stopProcessing();
    
    // Process remaining events
    if (this.eventQueue.length > 0) {
      await this.processBatch();
    }
  }
}

export const analyticsService = new AnalyticsService();
export default analyticsService;
