/**
 * Form Builder Platform - Forms API Routes
 * Handles form CRUD operations and management
 */

import express from 'express';
import { db } from '../db-form-builder';
import { forms, formComponents, formResponses, formAnalytics } from '../../shared/schema-form-builder';
import { eq, desc, asc, and, like, or } from 'drizzle-orm';
import { z } from 'zod';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Validation schemas
const createFormSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  settings: z.object({}).optional(),
});

const updateFormSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  settings: z.object({}).optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
});

const createComponentSchema = z.object({
  type: z.string(),
  config: z.object({}),
  orderIndex: z.number().int().min(0),
  conditionalLogic: z.object({}).optional(),
  validationRules: z.object({}).optional(),
});

// GET /api/forms - Get all forms
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status, sortBy = 'updatedAt', sortOrder = 'desc' } = req.query;
    
    const offset = (Number(page) - 1) * Number(limit);
    
    // Build where conditions
    const whereConditions = [];
    
    if (search) {
      whereConditions.push(
        or(
          like(forms.title, `%${search}%`),
          like(forms.description, `%${search}%`)
        )
      );
    }
    
    if (status && status !== 'all') {
      whereConditions.push(eq(forms.status, status as string));
    }
    
    // Build order by
    const orderBy = sortOrder === 'asc' 
      ? asc(forms[sortBy as keyof typeof forms])
      : desc(forms[sortBy as keyof typeof forms]);
    
    // Get forms
    const formsList = await db
      .select()
      .from(forms)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(orderBy)
      .limit(Number(limit))
      .offset(offset);
    
    // Get total count
    const totalCount = await db
      .select({ count: forms.id })
      .from(forms)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);
    
    res.json({
      success: true,
      data: formsList,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: totalCount.length,
        totalPages: Math.ceil(totalCount.length / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching forms:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch forms',
    });
  }
});

// GET /api/forms/:id - Get form by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
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
    
    // Get form components
    const components = await db
      .select()
      .from(formComponents)
      .where(eq(formComponents.formId, id))
      .orderBy(asc(formComponents.orderIndex));
    
    res.json({
      success: true,
      data: {
        ...form[0],
        components,
      },
    });
  } catch (error) {
    console.error('Error fetching form:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch form',
    });
  }
});

// POST /api/forms - Create new form
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, description, settings = {} } = createFormSchema.parse(req.body);
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }
    
    const formId = Math.random().toString(36).substr(2, 9);
    const now = new Date();
    
    const newForm = await db
      .insert(forms)
      .values({
        id: formId,
        title,
        description,
        settings: JSON.stringify(settings),
        status: 'draft',
        createdBy: userId,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    
    res.status(201).json({
      success: true,
      data: newForm[0],
    });
  } catch (error) {
    console.error('Error creating form:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to create form',
    });
  }
});

// PUT /api/forms/:id - Update form
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = updateFormSchema.parse(req.body);
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }
    
    // Check if form exists and user has permission
    const existingForm = await db
      .select()
      .from(forms)
      .where(eq(forms.id, id))
      .limit(1);
    
    if (existingForm.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Form not found',
      });
    }
    
    if (existingForm[0].createdBy !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this form',
      });
    }
    
    const updatedForm = await db
      .update(forms)
      .set({
        ...updates,
        updatedAt: new Date(),
        ...(updates.status === 'published' && { publishedAt: new Date() }),
      })
      .where(eq(forms.id, id))
      .returning();
    
    res.json({
      success: true,
      data: updatedForm[0],
    });
  } catch (error) {
    console.error('Error updating form:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to update form',
    });
  }
});

// DELETE /api/forms/:id - Delete form
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
    
    // Check if form exists and user has permission
    const existingForm = await db
      .select()
      .from(forms)
      .where(eq(forms.id, id))
      .limit(1);
    
    if (existingForm.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Form not found',
      });
    }
    
    if (existingForm[0].createdBy !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this form',
      });
    }
    
    // Delete form (components and responses will be deleted due to CASCADE)
    await db.delete(forms).where(eq(forms.id, id));
    
    res.json({
      success: true,
      message: 'Form deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting form:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete form',
    });
  }
});

// POST /api/forms/:id/components - Add component to form
router.post('/:id/components', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const componentData = createComponentSchema.parse(req.body);
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }
    
    // Check if form exists and user has permission
    const existingForm = await db
      .select()
      .from(forms)
      .where(eq(forms.id, id))
      .limit(1);
    
    if (existingForm.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Form not found',
      });
    }
    
    if (existingForm[0].createdBy !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to modify this form',
      });
    }
    
    const componentId = Math.random().toString(36).substr(2, 9);
    
    const newComponent = await db
      .insert(formComponents)
      .values({
        id: componentId,
        formId: id,
        type: componentData.type,
        config: JSON.stringify(componentData.config),
        orderIndex: componentData.orderIndex,
        conditionalLogic: JSON.stringify(componentData.conditionalLogic || {}),
        validationRules: JSON.stringify(componentData.validationRules || {}),
        createdAt: new Date(),
      })
      .returning();
    
    res.status(201).json({
      success: true,
      data: newComponent[0],
    });
  } catch (error) {
    console.error('Error adding component:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to add component',
    });
  }
});

// PUT /api/forms/:id/components/:componentId - Update component
router.put('/:id/components/:componentId', authenticateToken, async (req, res) => {
  try {
    const { id, componentId } = req.params;
    const updates = req.body;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }
    
    // Check if form exists and user has permission
    const existingForm = await db
      .select()
      .from(forms)
      .where(eq(forms.id, id))
      .limit(1);
    
    if (existingForm.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Form not found',
      });
    }
    
    if (existingForm[0].createdBy !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to modify this form',
      });
    }
    
    // Update component
    const updatedComponent = await db
      .update(formComponents)
      .set({
        ...updates,
        ...(updates.config && { config: JSON.stringify(updates.config) }),
        ...(updates.conditionalLogic && { conditionalLogic: JSON.stringify(updates.conditionalLogic) }),
        ...(updates.validationRules && { validationRules: JSON.stringify(updates.validationRules) }),
      })
      .where(and(eq(formComponents.id, componentId), eq(formComponents.formId, id)))
      .returning();
    
    if (updatedComponent.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Component not found',
      });
    }
    
    res.json({
      success: true,
      data: updatedComponent[0],
    });
  } catch (error) {
    console.error('Error updating component:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update component',
    });
  }
});

// DELETE /api/forms/:id/components/:componentId - Delete component
router.delete('/:id/components/:componentId', authenticateToken, async (req, res) => {
  try {
    const { id, componentId } = req.params;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }
    
    // Check if form exists and user has permission
    const existingForm = await db
      .select()
      .from(forms)
      .where(eq(forms.id, id))
      .limit(1);
    
    if (existingForm.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Form not found',
      });
    }
    
    if (existingForm[0].createdBy !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to modify this form',
      });
    }
    
    // Delete component
    await db
      .delete(formComponents)
      .where(and(eq(formComponents.id, componentId), eq(formComponents.formId, id)));
    
    res.json({
      success: true,
      message: 'Component deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting component:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete component',
    });
  }
});

// GET /api/forms/:id/analytics - Get form analytics
router.get('/:id/analytics', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;
    
    // Check if form exists
    const existingForm = await db
      .select()
      .from(forms)
      .where(eq(forms.id, id))
      .limit(1);
    
    if (existingForm.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Form not found',
      });
    }
    
    // Get analytics data
    const analytics = await db
      .select()
      .from(formAnalytics)
      .where(
        and(
          eq(formAnalytics.formId, id),
          startDate ? gte(formAnalytics.date, startDate as string) : undefined,
          endDate ? lte(formAnalytics.date, endDate as string) : undefined
        )
      )
      .orderBy(desc(formAnalytics.date));
    
    // Get response count
    const responseCount = await db
      .select({ count: formResponses.id })
      .from(formResponses)
      .where(eq(formResponses.formId, id));
    
    res.json({
      success: true,
      data: {
        form: existingForm[0],
        analytics,
        totalResponses: responseCount.length,
      },
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics',
    });
  }
});

export default router;
