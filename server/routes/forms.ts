/**
 * Form Management API Routes
 * Handles CRUD operations for dynamic forms
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { storage } from '../database/storage';
import { isAuthenticated, isAdmin } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { PERMISSIONS } from '../middleware/rbac';
import { tenantFilter } from '../middleware/tenant';
import { logAuditEvent } from '../middleware/auditLogging';

const router = Router();

// Form creation schema
const CreateFormSchema = z.object({
  title: z.string().min(1, 'العنوان مطلوب'),
  description: z.string().optional(),
  settings: z.object({
    theme: z.object({
      primaryColor: z.string().optional(),
      secondaryColor: z.string().optional(),
      backgroundColor: z.string().optional(),
      textColor: z.string().optional(),
      fontFamily: z.string().optional(),
    }).optional(),
    branding: z.object({
      logo: z.string().optional(),
      title: z.string().optional(),
      description: z.string().optional(),
    }).optional(),
    behavior: z.object({
      showProgress: z.boolean().optional(),
      allowSaveProgress: z.boolean().optional(),
      requireLogin: z.boolean().optional(),
      allowAnonymous: z.boolean().optional(),
    }).optional(),
    notifications: z.object({
      emailOnSubmit: z.boolean().optional(),
      emailTemplate: z.string().optional(),
      webhookUrl: z.string().optional(),
    }).optional(),
  }).optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
});

// Form update schema
const UpdateFormSchema = CreateFormSchema.partial();

// Component schema
const ComponentSchema = z.object({
  id: z.string(),
  type: z.string(),
  config: z.record(z.any()),
  validation: z.record(z.any()).optional(),
  conditionalLogic: z.record(z.any()).optional(),
  orderIndex: z.number(),
  isVisible: z.boolean(),
  isRequired: z.boolean(),
});

// Form submission schema
const FormSubmissionSchema = z.object({
  formId: z.string(),
  responses: z.array(z.object({
    componentId: z.string(),
    value: z.any(),
    submittedAt: z.date(),
  })),
  userInfo: z.record(z.any()).optional(),
  submittedAt: z.date(),
});

// Create a new form
router.post('/', 
  isAuthenticated, 
  requirePermission(PERMISSIONS.CREATE_FORMS),
  tenantFilter,
  async (req: Request, res: Response) => {
    try {
      const validatedData = CreateFormSchema.parse(req.body);
      const userId = (req as any).user?.id;
      const tenantId = (req as any).tenant?.id;

      const form = await storage.createDynamicForm({
        ...validatedData,
        createdBy: userId,
        tenantId,
        ministryId: (req as any).user?.ministryId,
        status: 'draft',
        isPublished: false,
        version: 1,
        submissionCount: 0,
        isActive: true,
      });

      // Log audit event
      await logAuditEvent(req, 'form_create', 'form', form.id, {
        formTitle: form.title,
        formStatus: form.status,
      });

      res.status(201).json({
        success: true,
        data: form,
        message: 'تم إنشاء النموذج بنجاح'
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'بيانات غير صحيحة',
          errors: error.errors
        });
      }

      console.error('Error creating form:', error);
      res.status(500).json({
        success: false,
        message: 'حدث خطأ أثناء إنشاء النموذج'
      });
    }
  }
);

// Get all forms
router.get('/', 
  isAuthenticated, 
  requirePermission(PERMISSIONS.VIEW_FORMS),
  tenantFilter,
  async (req: Request, res: Response) => {
    try {
      const { page = '1', limit = '10', status, search, category, isPublished } = req.query;
      const tenantId = (req as any).tenant?.id;
      const ministryId = (req as any).user?.ministryId;
      
      const forms = await storage.getDynamicForms({
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        status: status as string,
        search: search as string,
        category: category as string,
        isPublished: isPublished ? isPublished === 'true' : undefined,
        tenantId,
        ministryId,
      });

      res.json({
        success: true,
        data: forms.forms,
        pagination: {
          total: forms.total,
          totalPages: forms.totalPages,
          currentPage: forms.currentPage,
          limit: forms.limit
        }
      });
    } catch (error) {
      console.error('Error fetching forms:', error);
      res.status(500).json({
        success: false,
        message: 'حدث خطأ أثناء جلب النماذج'
      });
    }
  }
);

// Get form by ID
router.get('/:id', 
  isAuthenticated, 
  requirePermission(PERMISSIONS.VIEW_FORMS),
  tenantFilter,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const form = await storage.getDynamicForm(id);
      
      if (!form) {
        return res.status(404).json({
          success: false,
          message: 'النموذج غير موجود'
        });
      }

      // Check tenant access
      const tenantId = (req as any).tenant?.id;
      if (form.tenantId && form.tenantId !== tenantId) {
        return res.status(403).json({
          success: false,
          message: 'غير مسموح بالوصول إلى هذا النموذج'
        });
      }

      res.json({
        success: true,
        data: form
      });
    } catch (error) {
      console.error('Error fetching form:', error);
      res.status(500).json({
        success: false,
        message: 'حدث خطأ أثناء جلب النموذج'
      });
    }
  }
);

// Update form
router.put('/:id', 
  isAuthenticated, 
  requirePermission(PERMISSIONS.EDIT_FORMS),
  tenantFilter,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const validatedData = UpdateFormSchema.parse(req.body);

      // Check if form exists and user has access
      const existingForm = await storage.getDynamicForm(id);
      if (!existingForm) {
        return res.status(404).json({
          success: false,
          message: 'النموذج غير موجود'
        });
      }

      // Check tenant access
      const tenantId = (req as any).tenant?.id;
      if (existingForm.tenantId && existingForm.tenantId !== tenantId) {
        return res.status(403).json({
          success: false,
          message: 'غير مسموح بتعديل هذا النموذج'
        });
      }

      const form = await storage.updateDynamicForm(id, {
        ...validatedData,
        version: existingForm.version + 1,
      });

      // Log audit event
      await logAuditEvent(req, 'form_update', 'form', form.id, {
        formTitle: form.title,
        changes: Object.keys(validatedData),
      });

      res.json({
        success: true,
        data: form,
        message: 'تم تحديث النموذج بنجاح'
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'بيانات غير صحيحة',
          errors: error.errors
        });
      }

      console.error('Error updating form:', error);
      res.status(500).json({
        success: false,
        message: 'حدث خطأ أثناء تحديث النموذج'
      });
    }
  }
);

// Delete form
router.delete('/:id', 
  isAuthenticated, 
  requirePermission(PERMISSIONS.DELETE_FORMS),
  tenantFilter,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      // Check if form exists and user has access
      const existingForm = await storage.getDynamicForm(id);
      if (!existingForm) {
        return res.status(404).json({
          success: false,
          message: 'النموذج غير موجود'
        });
      }

      // Check tenant access
      const tenantId = (req as any).tenant?.id;
      if (existingForm.tenantId && existingForm.tenantId !== tenantId) {
        return res.status(403).json({
          success: false,
          message: 'غير مسموح بحذف هذا النموذج'
        });
      }

      await storage.deleteDynamicForm(id);

      // Log audit event
      await logAuditEvent(req, 'form_delete', 'form', id, {
        formTitle: existingForm.title,
      });

      res.json({
        success: true,
        message: 'تم حذف النموذج بنجاح'
      });
    } catch (error) {
      console.error('Error deleting form:', error);
      res.status(500).json({
        success: false,
        message: 'حدث خطأ أثناء حذف النموذج'
      });
    }
  }
);

// Publish form
router.post('/:id/publish', 
  isAuthenticated, 
  requirePermission(PERMISSIONS.PUBLISH_FORMS),
  tenantFilter,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;
      
      // Check if form exists and user has access
      const existingForm = await storage.getDynamicForm(id);
      if (!existingForm) {
        return res.status(404).json({
          success: false,
          message: 'النموذج غير موجود'
        });
      }

      // Check tenant access
      const tenantId = (req as any).tenant?.id;
      if (existingForm.tenantId && existingForm.tenantId !== tenantId) {
        return res.status(403).json({
          success: false,
          message: 'غير مسموح بنشر هذا النموذج'
        });
      }

      const form = await storage.publishForm(id, userId);

      // Log audit event
      await logAuditEvent(req, 'form_publish', 'form', form.id, {
        formTitle: form.title,
        publishedBy: userId,
      });

      res.json({
        success: true,
        data: form,
        message: 'تم نشر النموذج بنجاح'
      });
    } catch (error) {
      console.error('Error publishing form:', error);
      res.status(500).json({
        success: false,
        message: 'حدث خطأ أثناء نشر النموذج'
      });
    }
  }
);

// Unpublish form
router.post('/:id/unpublish', 
  isAuthenticated, 
  requirePermission(PERMISSIONS.PUBLISH_FORMS),
  tenantFilter,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      // Check if form exists and user has access
      const existingForm = await storage.getDynamicForm(id);
      if (!existingForm) {
        return res.status(404).json({
          success: false,
          message: 'النموذج غير موجود'
        });
      }

      // Check tenant access
      const tenantId = (req as any).tenant?.id;
      if (existingForm.tenantId && existingForm.tenantId !== tenantId) {
        return res.status(403).json({
          success: false,
          message: 'غير مسموح بإلغاء نشر هذا النموذج'
        });
      }

      const form = await storage.unpublishForm(id);

      // Log audit event
      await logAuditEvent(req, 'form_unpublish', 'form', form.id, {
        formTitle: form.title,
      });

      res.json({
        success: true,
        data: form,
        message: 'تم إلغاء نشر النموذج بنجاح'
      });
    } catch (error) {
      console.error('Error unpublishing form:', error);
      res.status(500).json({
        success: false,
        message: 'حدث خطأ أثناء إلغاء نشر النموذج'
      });
    }
  }
);

// Archive form
router.post('/:id/archive', 
  isAuthenticated, 
  requirePermission(PERMISSIONS.DELETE_FORMS),
  tenantFilter,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      // Check if form exists and user has access
      const existingForm = await storage.getDynamicForm(id);
      if (!existingForm) {
        return res.status(404).json({
          success: false,
          message: 'النموذج غير موجود'
        });
      }

      // Check tenant access
      const tenantId = (req as any).tenant?.id;
      if (existingForm.tenantId && existingForm.tenantId !== tenantId) {
        return res.status(403).json({
          success: false,
          message: 'غير مسموح بأرشفة هذا النموذج'
        });
      }

      const form = await storage.updateDynamicForm(id, {
        status: 'archived',
        isActive: false,
      });

      // Log audit event
      await logAuditEvent(req, 'form_archive', 'form', form.id, {
        formTitle: form.title,
      });

      res.json({
        success: true,
        data: form,
        message: 'تم أرشفة النموذج بنجاح'
      });
    } catch (error) {
      console.error('Error archiving form:', error);
      res.status(500).json({
        success: false,
        message: 'حدث خطأ أثناء أرشفة النموذج'
      });
    }
  }
);

// Get form components
router.get('/api/forms/:id/components', isAuthenticated, isAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const components = await storage.getFormComponents(id);

    res.json({
      success: true,
      data: components
    });
  } catch (error) {
    console.error('Error fetching form components:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب مكونات النموذج'
    });
  }
});

// Update form components
router.put('/api/forms/:id/components', isAuthenticated, isAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { components } = req.body;

    // Validate components
    const validatedComponents = z.array(ComponentSchema).parse(components);

    await storage.updateFormComponents(id, validatedComponents);

    res.json({
      success: true,
      message: 'تم تحديث مكونات النموذج بنجاح'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'بيانات المكونات غير صحيحة',
        errors: error.errors
      });
    }

    console.error('Error updating form components:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تحديث مكونات النموذج'
    });
  }
});

// Submit form (public endpoint)
router.post('/:id/submit', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = FormSubmissionSchema.parse({
      ...req.body,
      formId: id,
      submittedAt: new Date(),
    });

    // Check if form exists and is published
    const form = await storage.getDynamicForm(id);
    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'النموذج غير موجود'
      });
    }

    if (!form.isPublished || form.status !== 'published') {
      return res.status(400).json({
        success: false,
        message: 'النموذج غير متاح للاستخدام'
      });
    }

    // Check if form is active
    if (!form.isActive) {
      return res.status(400).json({
        success: false,
        message: 'النموذج غير نشط'
      });
    }

    // Check submission limit
    if (form.submissionLimit && form.submissionCount >= form.submissionLimit) {
      return res.status(400).json({
        success: false,
        message: 'تم الوصول إلى الحد الأقصى من الإرسالات'
      });
    }

    // Check if form has expired
    if (form.expiresAt && new Date() > new Date(form.expiresAt)) {
      return res.status(400).json({
        success: false,
        message: 'انتهت صلاحية النموذج'
      });
    }

    // Save form submission
    const submission = await storage.createFormSubmission({
      ...validatedData,
      tenantId: form.tenantId,
      ministryId: form.ministryId,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      sessionId: req.sessionID,
      isAnonymous: !(req as any).user,
      submittedBy: (req as any).user?.id,
      status: 'submitted',
      processingStatus: 'pending',
      priority: 'normal',
      workflowState: 'new',
    });

    // Log analytics event
    await storage.createFormAnalyticsEvent({
      formId: id,
      eventType: 'complete',
      userId: (req as any).user?.id,
      sessionId: req.sessionID,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      tenantId: form.tenantId,
      ministryId: form.ministryId,
      eventData: {
        submissionId: submission.id,
        responseCount: validatedData.responses.length,
      },
    });

    res.status(201).json({
      success: true,
      data: submission,
      message: 'تم إرسال النموذج بنجاح'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'بيانات غير صحيحة',
        errors: error.errors
      });
    }

    console.error('Error submitting form:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء إرسال النموذج'
    });
  }
});

// Get form submissions
router.get('/:id/submissions', 
  isAuthenticated, 
  requirePermission(PERMISSIONS.VIEW_FORM_SUBMISSIONS),
  tenantFilter,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { page = '1', limit = '10', status, priority, assignedTo } = req.query;
      const tenantId = (req as any).tenant?.id;
      const ministryId = (req as any).user?.ministryId;
      
      const submissions = await storage.getFormSubmissions({
        formId: id,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        status: status as string,
        priority: priority as string,
        assignedTo: assignedTo ? parseInt(assignedTo as string) : undefined,
        tenantId,
        ministryId,
      });

      res.json({
        success: true,
        data: submissions.submissions,
        pagination: {
          total: submissions.total,
          totalPages: submissions.totalPages,
          currentPage: submissions.currentPage,
          limit: submissions.limit
        }
      });
    } catch (error) {
      console.error('Error fetching form submissions:', error);
      res.status(500).json({
        success: false,
        message: 'حدث خطأ أثناء جلب إرسالات النموذج'
      });
    }
  }
);

// Get form analytics
router.get('/:id/analytics', 
  isAuthenticated, 
  requirePermission(PERMISSIONS.VIEW_FORM_ANALYTICS),
  tenantFilter,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { startDate, endDate, eventType } = req.query;
      const tenantId = (req as any).tenant?.id;
      const ministryId = (req as any).user?.ministryId;
      
      // Get analytics events
      const events = await storage.getFormAnalytics({
        formId: id,
        startDate: startDate as string,
        endDate: endDate as string,
        eventType: eventType as string,
        tenantId,
        ministryId,
        page: 1,
        limit: 1000, // Get all events for stats calculation
      });

      // Get analytics statistics
      const stats = await storage.getFormAnalyticsStats(id, {
        startDate: startDate as string,
        endDate: endDate as string,
      });

      res.json({
        success: true,
        data: {
          events: events.events,
          stats,
          totalEvents: events.total,
        }
      });
    } catch (error) {
      console.error('Error fetching form analytics:', error);
      res.status(500).json({
        success: false,
        message: 'حدث خطأ أثناء جلب إحصائيات النموذج'
      });
    }
  }
);

export default router;
