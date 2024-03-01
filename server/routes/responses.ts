/**
 * Form Builder Platform - Responses API Routes
 * Handles form response collection and management
 */

import express from 'express';
import { db } from '../db-form-builder';
import { forms, formResponses, formAnalytics } from '../../shared/schema-form-builder';
import { eq, desc, asc, and, gte, lte } from 'drizzle-orm';
import { z } from 'zod';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Validation schemas
const submitResponseSchema = z.object({
  formId: z.string(),
  responseData: z.record(z.any()),
  userInfo: z.object({
    userAgent: z.string().optional(),
    language: z.string().optional(),
    timezone: z.string().optional(),
    ipAddress: z.string().optional(),
  }).optional(),
});

const updateResponseSchema = z.object({
  responseData: z.record(z.any()).optional(),
  status: z.enum(['completed', 'partial']).optional(),
});

// POST /api/responses - Submit form response
router.post('/', async (req, res) => {
  try {
    const { formId, responseData, userInfo = {} } = submitResponseSchema.parse(req.body);
    
    // Check if form exists and is published
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
    
    if (form[0].status !== 'published') {
      return res.status(400).json({
        success: false,
        error: 'Form is not published',
      });
    }
    
    // Create response
    const responseId = Math.random().toString(36).substr(2, 9);
    const now = new Date();
    
    const newResponse = await db
      .insert(formResponses)
      .values({
        id: responseId,
        formId,
        responseData: JSON.stringify(responseData),
        submittedAt: now,
        userInfo: JSON.stringify({
          ...userInfo,
          ipAddress: req.ip || req.connection.remoteAddress,
        }),
        status: 'completed',
      })
      .returning();
    
    // Update analytics
    await updateFormAnalytics(formId, now);
    
    res.status(201).json({
      success: true,
      data: newResponse[0],
    });
  } catch (error) {
    console.error('Error submitting response:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to submit response',
    });
  }
});

// GET /api/responses - Get responses (admin only)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { formId, page = 1, limit = 10, status, startDate, endDate } = req.query;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }
    
    const offset = (Number(page) - 1) * Number(limit);
    
    // Build where conditions
    const whereConditions = [];
    
    if (formId) {
      whereConditions.push(eq(formResponses.formId, formId as string));
    }
    
    if (status) {
      whereConditions.push(eq(formResponses.status, status as string));
    }
    
    if (startDate) {
      whereConditions.push(gte(formResponses.submittedAt, new Date(startDate as string)));
    }
    
    if (endDate) {
      whereConditions.push(lte(formResponses.submittedAt, new Date(endDate as string)));
    }
    
    // Get responses
    const responses = await db
      .select()
      .from(formResponses)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(desc(formResponses.submittedAt))
      .limit(Number(limit))
      .offset(offset);
    
    // Get total count
    const totalCount = await db
      .select({ count: formResponses.id })
      .from(formResponses)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);
    
    res.json({
      success: true,
      data: responses,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: totalCount.length,
        totalPages: Math.ceil(totalCount.length / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching responses:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch responses',
    });
  }
});

// GET /api/responses/:id - Get response by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }
    
    const response = await db
      .select()
      .from(formResponses)
      .where(eq(formResponses.id, id))
      .limit(1);
    
    if (response.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Response not found',
      });
    }
    
    // Check if user has permission to view this response
    const form = await db
      .select()
      .from(forms)
      .where(eq(forms.id, response[0].formId))
      .limit(1);
    
    if (form.length === 0 || form[0].createdBy !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to view this response',
      });
    }
    
    res.json({
      success: true,
      data: response[0],
    });
  } catch (error) {
    console.error('Error fetching response:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch response',
    });
  }
});

// PUT /api/responses/:id - Update response
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = updateResponseSchema.parse(req.body);
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }
    
    // Check if response exists and user has permission
    const existingResponse = await db
      .select()
      .from(formResponses)
      .where(eq(formResponses.id, id))
      .limit(1);
    
    if (existingResponse.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Response not found',
      });
    }
    
    const form = await db
      .select()
      .from(forms)
      .where(eq(forms.id, existingResponse[0].formId))
      .limit(1);
    
    if (form.length === 0 || form[0].createdBy !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this response',
      });
    }
    
    const updatedResponse = await db
      .update(formResponses)
      .set({
        ...updates,
        ...(updates.responseData && { responseData: JSON.stringify(updates.responseData) }),
      })
      .where(eq(formResponses.id, id))
      .returning();
    
    res.json({
      success: true,
      data: updatedResponse[0],
    });
  } catch (error) {
    console.error('Error updating response:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to update response',
    });
  }
});

// DELETE /api/responses/:id - Delete response
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }
    
    // Check if response exists and user has permission
    const existingResponse = await db
      .select()
      .from(formResponses)
      .where(eq(formResponses.id, id))
      .limit(1);
    
    if (existingResponse.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Response not found',
      });
    }
    
    const form = await db
      .select()
      .from(forms)
      .where(eq(forms.id, existingResponse[0].formId))
      .limit(1);
    
    if (form.length === 0 || form[0].createdBy !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this response',
      });
    }
    
    await db.delete(formResponses).where(eq(formResponses.id, id));
    
    res.json({
      success: true,
      message: 'Response deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting response:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete response',
    });
  }
});

// GET /api/responses/export/:formId - Export responses
router.get('/export/:formId', authenticateToken, async (req, res) => {
  try {
    const { formId } = req.params;
    const { format = 'json' } = req.query;
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
        error: 'Not authorized to export responses for this form',
      });
    }
    
    // Get all responses for the form
    const responses = await db
      .select()
      .from(formResponses)
      .where(eq(formResponses.formId, formId))
      .orderBy(desc(formResponses.submittedAt));
    
    if (format === 'csv') {
      // Convert to CSV
      const csv = convertToCSV(responses);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="form-${formId}-responses.csv"`);
      res.send(csv);
    } else {
      // Return as JSON
      res.json({
        success: true,
        data: responses,
        form: form[0],
      });
    }
  } catch (error) {
    console.error('Error exporting responses:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export responses',
    });
  }
});

// Helper function to update form analytics
async function updateFormAnalytics(formId: string, date: Date) {
  try {
    const dateStr = date.toISOString().split('T')[0];
    
    // Check if analytics record exists for this date
    const existingAnalytics = await db
      .select()
      .from(formAnalytics)
      .where(and(eq(formAnalytics.formId, formId), eq(formAnalytics.date, dateStr)))
      .limit(1);
    
    if (existingAnalytics.length > 0) {
      // Update existing record
      await db
        .update(formAnalytics)
        .set({
          submissions: existingAnalytics[0].submissions + 1,
          updatedAt: new Date(),
        })
        .where(eq(formAnalytics.id, existingAnalytics[0].id));
    } else {
      // Create new record
      await db
        .insert(formAnalytics)
        .values({
          id: Math.random().toString(36).substr(2, 9),
          formId,
          date: dateStr,
          views: 0,
          submissions: 1,
          completionRate: 1.0,
          avgCompletionTime: 0,
          createdAt: new Date(),
        });
    }
  } catch (error) {
    console.error('Error updating analytics:', error);
  }
}

// Helper function to convert responses to CSV
function convertToCSV(responses: any[]): string {
  if (responses.length === 0) return '';
  
  // Get all unique field names
  const allFields = new Set<string>();
  responses.forEach(response => {
    const data = typeof response.responseData === 'string' 
      ? JSON.parse(response.responseData) 
      : response.responseData;
    Object.keys(data).forEach(key => allFields.add(key));
  });
  
  const fields = Array.from(allFields);
  const headers = ['ID', 'Submitted At', 'Status', ...fields];
  
  const rows = responses.map(response => {
    const data = typeof response.responseData === 'string' 
      ? JSON.parse(response.responseData) 
      : response.responseData;
    
    return [
      response.id,
      response.submittedAt,
      response.status,
      ...fields.map(field => data[field] || ''),
    ];
  });
  
  return [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');
}

export default router;
