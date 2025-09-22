/**
 * Form Analytics Service
 * Handles analytics tracking for form usage and submissions
 */

export interface FormAnalytics {
  formId: string;
  totalViews: number;
  totalSubmissions: number;
  completionRate: number;
  avgCompletionTime: number; // in seconds
  dailyStats: DailyStats[];
  componentStats: ComponentStats[];
  lastUpdated: Date;
}

export interface DailyStats {
  date: string; // YYYY-MM-DD
  views: number;
  submissions: number;
  completionRate: number;
  avgCompletionTime: number;
}

export interface ComponentStats {
  componentId: string;
  componentType: string;
  componentLabel: string;
  totalInteractions: number;
  completionRate: number;
  avgTimeToComplete: number; // in seconds
  abandonmentRate: number;
}

export interface FormViewEvent {
  formId: string;
  timestamp: Date;
  userAgent?: string;
  referrer?: string;
  sessionId: string;
}

export interface FormSubmissionEvent {
  formId: string;
  timestamp: Date;
  completionTime: number; // in seconds
  sessionId: string;
  componentInteractions: ComponentInteraction[];
}

export interface ComponentInteraction {
  componentId: string;
  componentType: string;
  interactionType: 'focus' | 'blur' | 'change' | 'submit';
  timestamp: Date;
  value?: any;
}

export class AnalyticsService {
  private static instance: AnalyticsService;
  private analytics: Map<string, FormAnalytics> = new Map();
  private viewEvents: FormViewEvent[] = [];
  private submissionEvents: FormSubmissionEvent[] = [];

  private constructor() {}

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  // Track form view
  trackFormView(formId: string, sessionId: string, metadata?: { userAgent?: string; referrer?: string }) {
    const viewEvent: FormViewEvent = {
      formId,
      timestamp: new Date(),
      sessionId,
      userAgent: metadata?.userAgent,
      referrer: metadata?.referrer,
    };

    this.viewEvents.push(viewEvent);
    this.updateFormAnalytics(formId);
  }

  // Track form submission
  trackFormSubmission(
    formId: string, 
    sessionId: string, 
    completionTime: number,
    componentInteractions: ComponentInteraction[]
  ) {
    const submissionEvent: FormSubmissionEvent = {
      formId,
      timestamp: new Date(),
      completionTime,
      sessionId,
      componentInteractions,
    };

    this.submissionEvents.push(submissionEvent);
    this.updateFormAnalytics(formId);
  }

  // Track component interaction
  trackComponentInteraction(
    formId: string,
    componentId: string,
    componentType: string,
    interactionType: ComponentInteraction['interactionType'],
    value?: any
  ) {
    const interaction: ComponentInteraction = {
      componentId,
      componentType,
      interactionType,
      timestamp: new Date(),
      value,
    };

    // Find the most recent submission event for this form and add the interaction
    const recentSubmission = this.submissionEvents
      .filter(event => event.formId === formId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];

    if (recentSubmission) {
      recentSubmission.componentInteractions.push(interaction);
    }
  }

  // Get form analytics
  getFormAnalytics(formId: string): FormAnalytics | null {
    return this.analytics.get(formId) || null;
  }

  // Get all form analytics
  getAllFormAnalytics(): FormAnalytics[] {
    return Array.from(this.analytics.values());
  }

  // Update form analytics
  private updateFormAnalytics(formId: string) {
    const formViews = this.viewEvents.filter(event => event.formId === formId);
    const formSubmissions = this.submissionEvents.filter(event => event.formId === formId);

    const totalViews = formViews.length;
    const totalSubmissions = formSubmissions.length;
    const completionRate = totalViews > 0 ? (totalSubmissions / totalViews) * 100 : 0;
    const avgCompletionTime = formSubmissions.length > 0 
      ? formSubmissions.reduce((sum, event) => sum + event.completionTime, 0) / formSubmissions.length 
      : 0;

    // Calculate daily stats
    const dailyStats = this.calculateDailyStats(formViews, formSubmissions);

    // Calculate component stats
    const componentStats = this.calculateComponentStats(formSubmissions);

    const analytics: FormAnalytics = {
      formId,
      totalViews,
      totalSubmissions,
      completionRate,
      avgCompletionTime,
      dailyStats,
      componentStats,
      lastUpdated: new Date(),
    };

    this.analytics.set(formId, analytics);
  }

  // Calculate daily statistics
  private calculateDailyStats(views: FormViewEvent[], submissions: FormSubmissionEvent[]): DailyStats[] {
    const dailyMap = new Map<string, { views: number; submissions: number; completionTimes: number[] }>();

    // Process views
    views.forEach(view => {
      const date = view.timestamp.toISOString().split('T')[0];
      const existing = dailyMap.get(date) || { views: 0, submissions: 0, completionTimes: [] };
      existing.views++;
      dailyMap.set(date, existing);
    });

    // Process submissions
    submissions.forEach(submission => {
      const date = submission.timestamp.toISOString().split('T')[0];
      const existing = dailyMap.get(date) || { views: 0, submissions: 0, completionTimes: [] };
      existing.submissions++;
      existing.completionTimes.push(submission.completionTime);
      dailyMap.set(date, existing);
    });

    // Convert to DailyStats array
    return Array.from(dailyMap.entries()).map(([date, data]) => ({
      date,
      views: data.views,
      submissions: data.submissions,
      completionRate: data.views > 0 ? (data.submissions / data.views) * 100 : 0,
      avgCompletionTime: data.completionTimes.length > 0 
        ? data.completionTimes.reduce((sum, time) => sum + time, 0) / data.completionTimes.length 
        : 0,
    })).sort((a, b) => a.date.localeCompare(b.date));
  }

  // Calculate component statistics
  private calculateComponentStats(submissions: FormSubmissionEvent[]): ComponentStats[] {
    const componentMap = new Map<string, {
      componentType: string;
      componentLabel: string;
      interactions: ComponentInteraction[];
      completions: number;
    }>();

    // Process all submissions
    submissions.forEach(submission => {
      submission.componentInteractions.forEach(interaction => {
        const existing = componentMap.get(interaction.componentId) || {
          componentType: interaction.componentType,
          componentLabel: interaction.componentId, // This should be replaced with actual label
          interactions: [],
          completions: 0,
        };

        existing.interactions.push(interaction);
        if (interaction.interactionType === 'submit') {
          existing.completions++;
        }

        componentMap.set(interaction.componentId, existing);
      });
    });

    // Convert to ComponentStats array
    return Array.from(componentMap.entries()).map(([componentId, data]) => {
      const totalInteractions = data.interactions.length;
      const completionRate = totalInteractions > 0 ? (data.completions / totalInteractions) * 100 : 0;
      const avgTimeToComplete = data.interactions.length > 0 
        ? data.interactions.reduce((sum, interaction) => sum + interaction.timestamp.getTime(), 0) / data.interactions.length / 1000
        : 0;
      const abandonmentRate = 100 - completionRate;

      return {
        componentId,
        componentType: data.componentType,
        componentLabel: data.componentLabel,
        totalInteractions,
        completionRate,
        avgTimeToComplete,
        abandonmentRate,
      };
    });
  }

  // Export analytics data
  exportAnalytics(formId?: string): any {
    if (formId) {
      return this.getFormAnalytics(formId);
    }
    return {
      analytics: this.getAllFormAnalytics(),
      viewEvents: this.viewEvents,
      submissionEvents: this.submissionEvents,
    };
  }

  // Clear analytics data
  clearAnalytics(formId?: string) {
    if (formId) {
      this.analytics.delete(formId);
      this.viewEvents = this.viewEvents.filter(event => event.formId !== formId);
      this.submissionEvents = this.submissionEvents.filter(event => event.formId !== formId);
    } else {
      this.analytics.clear();
      this.viewEvents = [];
      this.submissionEvents = [];
    }
  }
}

// Export singleton instance
export const analyticsService = AnalyticsService.getInstance();

// React hook for analytics
export const useAnalytics = (formId: string) => {
  const service = analyticsService;

  const trackView = (sessionId: string, metadata?: { userAgent?: string; referrer?: string }) => {
    service.trackFormView(formId, sessionId, metadata);
  };

  const trackSubmission = (sessionId: string, completionTime: number, componentInteractions: ComponentInteraction[]) => {
    service.trackFormSubmission(formId, sessionId, completionTime, componentInteractions);
  };

  const trackInteraction = (
    componentId: string,
    componentType: string,
    interactionType: ComponentInteraction['interactionType'],
    value?: any
  ) => {
    service.trackComponentInteraction(formId, componentId, componentType, interactionType, value);
  };

  const getAnalytics = () => {
    return service.getFormAnalytics(formId);
  };

  return {
    trackView,
    trackSubmission,
    trackInteraction,
    getAnalytics,
  };
};

export default analyticsService;
