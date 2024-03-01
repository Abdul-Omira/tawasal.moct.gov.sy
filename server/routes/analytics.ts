/**
 * Form Builder Platform - Analytics API Routes
 * Handles analytics and reporting functionality
 */

import express from 'express';
import { db } from '../db-form-builder';
import { forms, formAnalytics, formResponses } from '../../shared/schema-form-builder';
import { eq, desc, asc, and, gte, lte, sql } from 'drizzle-orm';
import { z } from 'zod';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Validation schemas
const analyticsQuerySchema = z.object({
  formId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  groupBy: z.enum(['day', 'week', 'month']).optional(),
});

// GET /api/analytics/overview - Get overview analytics
router.get('/overview', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }
    
    // Get user's forms
    const userForms = await db
      .select({ id: forms.id })
      .from(forms)
      .where(eq(forms.createdBy, userId));
    
    const formIds = userForms.map(f => f.id);
    
    if (formIds.length === 0) {
      return res.json({
        success: true,
        data: {
          totalForms: 0,
          totalViews: 0,
          totalSubmissions: 0,
          avgCompletionRate: 0,
          recentActivity: [],
        },
      });
    }
    
    // Get total views and submissions
    const totalStats = await db
      .select({
        totalViews: sql<number>`SUM(${formAnalytics.views})`,
        totalSubmissions: sql<number>`SUM(${formAnalytics.submissions})`,
        avgCompletionRate: sql<number>`AVG(${formAnalytics.completionRate})`,
      })
      .from(formAnalytics)
      .where(sql`${formAnalytics.formId} IN (${formIds.join(',')})`);
    
    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentActivity = await db
      .select({
        date: formAnalytics.date,
        views: formAnalytics.views,
        submissions: formAnalytics.submissions,
        formId: formAnalytics.formId,
        formTitle: forms.title,
      })
      .from(formAnalytics)
      .innerJoin(forms, eq(formAnalytics.formId, forms.id))
      .where(
        and(
          sql`${formAnalytics.formId} IN (${formIds.join(',')})`,
          gte(formAnalytics.date, sevenDaysAgo.toISOString().split('T')[0])
        )
      )
      .orderBy(desc(formAnalytics.date))
      .limit(20);
    
    res.json({
      success: true,
      data: {
        totalForms: formIds.length,
        totalViews: totalStats[0]?.totalViews || 0,
        totalSubmissions: totalStats[0]?.totalSubmissions || 0,
        avgCompletionRate: totalStats[0]?.avgCompletionRate || 0,
        recentActivity,
      },
    });
  } catch (error) {
    console.error('Error fetching overview analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch overview analytics',
    });
  }
});

// GET /api/analytics/forms/:id - Get form-specific analytics
router.get('/forms/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate, groupBy = 'day' } = analyticsQuerySchema.parse(req.query);
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }
    
    // Check if form exists and user has permission
    const form = await db
      .select()
      .from(forms)
      .where(eq(forms.id, id))
      .limit(1);
    
    if (form.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Form not found',
      });
    }
    
    if (form[0].createdBy !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to view analytics for this form',
      });
    }
    
    // Build date filter
    const dateFilter = [];
    if (startDate) {
      dateFilter.push(gte(formAnalytics.date, startDate));
    }
    if (endDate) {
      dateFilter.push(lte(formAnalytics.date, endDate));
    }
    
    // Get analytics data
    const analytics = await db
      .select()
      .from(formAnalytics)
      .where(
        and(
          eq(formAnalytics.formId, id),
          ...dateFilter
        )
      )
      .orderBy(asc(formAnalytics.date));
    
    // Get response data for additional insights
    const responses = await db
      .select()
      .from(formResponses)
      .where(eq(formResponses.formId, id))
      .orderBy(desc(formResponses.submittedAt));
    
    // Calculate additional metrics
    const totalResponses = responses.length;
    const completionRate = analytics.length > 0 
      ? analytics.reduce((sum, a) => sum + a.completionRate, 0) / analytics.length 
      : 0;
    
    // Get top performing days
    const topDays = analytics
      .sort((a, b) => b.submissions - a.submissions)
      .slice(0, 5);
    
    // Calculate response trends
    const responseTrends = calculateResponseTrends(responses, groupBy);
    
    res.json({
      success: true,
      data: {
        form: form[0],
        analytics,
        totalResponses,
        completionRate,
        topDays,
        responseTrends,
        summary: {
          totalViews: analytics.reduce((sum, a) => sum + a.views, 0),
          totalSubmissions: analytics.reduce((sum, a) => sum + a.submissions, 0),
          avgCompletionRate: completionRate,
          avgCompletionTime: analytics.length > 0 
            ? analytics.reduce((sum, a) => sum + a.avgCompletionTime, 0) / analytics.length 
            : 0,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching form analytics:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to fetch form analytics',
    });
  }
});

// GET /api/analytics/performance - Get performance metrics
router.get('/performance', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }
    
    // Get user's forms
    const userForms = await db
      .select({ id: forms.id, title: forms.title })
      .from(forms)
      .where(eq(forms.createdBy, userId));
    
    const formIds = userForms.map(f => f.id);
    
    if (formIds.length === 0) {
      return res.json({
        success: true,
        data: {
          forms: [],
          performance: [],
        },
      });
    }
    
    // Get performance data for each form
    const performanceData = await Promise.all(
      userForms.map(async (form) => {
        const analytics = await db
          .select()
          .from(formAnalytics)
          .where(eq(formAnalytics.formId, form.id))
          .orderBy(desc(formAnalytics.date))
          .limit(30); // Last 30 days
        
        const totalViews = analytics.reduce((sum, a) => sum + a.views, 0);
        const totalSubmissions = analytics.reduce((sum, a) => sum + a.submissions, 0);
        const avgCompletionRate = analytics.length > 0 
          ? analytics.reduce((sum, a) => sum + a.completionRate, 0) / analytics.length 
          : 0;
        
        return {
          formId: form.id,
          formTitle: form.title,
          totalViews,
          totalSubmissions,
          avgCompletionRate,
          recentTrend: calculateTrend(analytics),
        };
      })
    );
    
    // Sort by performance (total submissions)
    performanceData.sort((a, b) => b.totalSubmissions - a.totalSubmissions);
    
    res.json({
      success: true,
      data: {
        forms: userForms,
        performance: performanceData,
      },
    });
  } catch (error) {
    console.error('Error fetching performance analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch performance analytics',
    });
  }
});

// GET /api/analytics/export/:formId - Export analytics data
router.get('/export/:formId', authenticateToken, async (req, res) => {
  try {
    const { formId } = req.params;
    const { format = 'json', startDate, endDate } = req.query;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }
    
    // Check if form exists and user has permission
    const form = await db
      .select()
      .from(forms)
      .where(eq(forms.id, formId))
      .limit(1);
    
    if (form.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Form not found',
      });
    }
    
    if (form[0].createdBy !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to export analytics for this form',
      });
    }
    
    // Build date filter
    const dateFilter = [];
    if (startDate) {
      dateFilter.push(gte(formAnalytics.date, startDate as string));
    }
    if (endDate) {
      dateFilter.push(lte(formAnalytics.date, endDate as string));
    }
    
    // Get analytics data
    const analytics = await db
      .select()
      .from(formAnalytics)
      .where(
        and(
          eq(formAnalytics.formId, formId),
          ...dateFilter
        )
      )
      .orderBy(asc(formAnalytics.date));
    
    if (format === 'csv') {
      // Convert to CSV
      const csv = convertAnalyticsToCSV(analytics, form[0]);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="form-${formId}-analytics.csv"`);
      res.send(csv);
    } else {
      // Return as JSON
      res.json({
        success: true,
        data: {
          form: form[0],
          analytics,
        },
      });
    }
  } catch (error) {
    console.error('Error exporting analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export analytics',
    });
  }
});

// Helper function to calculate response trends
function calculateResponseTrends(responses: any[], groupBy: string) {
  const groups: Record<string, number> = {};
  
  responses.forEach(response => {
    const date = new Date(response.submittedAt);
    let key: string;
    
    switch (groupBy) {
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
        break;
      case 'month':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
      default: // day
        key = date.toISOString().split('T')[0];
    }
    
    groups[key] = (groups[key] || 0) + 1;
  });
  
  return Object.entries(groups)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// Helper function to calculate trend
function calculateTrend(analytics: any[]): 'up' | 'down' | 'stable' {
  if (analytics.length < 2) return 'stable';
  
  const recent = analytics.slice(0, 7); // Last 7 days
  const previous = analytics.slice(7, 14); // Previous 7 days
  
  if (recent.length === 0 || previous.length === 0) return 'stable';
  
  const recentAvg = recent.reduce((sum, a) => sum + a.submissions, 0) / recent.length;
  const previousAvg = previous.reduce((sum, a) => sum + a.submissions, 0) / previous.length;
  
  const change = ((recentAvg - previousAvg) / previousAvg) * 100;
  
  if (change > 10) return 'up';
  if (change < -10) return 'down';
  return 'stable';
}

// Helper function to convert analytics to CSV
function convertAnalyticsToCSV(analytics: any[], form: any): string {
  const headers = ['Date', 'Views', 'Submissions', 'Completion Rate', 'Avg Completion Time'];
  
  const rows = analytics.map(a => [
    a.date,
    a.views,
    a.submissions,
    a.completionRate,
    a.avgCompletionTime,
  ]);
  
  return [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');
}

export default router;
