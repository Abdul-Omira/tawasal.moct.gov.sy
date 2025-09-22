/**
 * Ministry Management API Routes
 * Handles CRUD operations for ministries and tenant management
 * 
 * @author Syrian Ministry of Communications
 * @version 1.0.0
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { isAuthenticated } from '../middleware/auth';
import { requirePermission, PERMISSIONS } from '../middleware/rbac';
import { storage } from '../database/storage';
import { auditService } from '../services/auditService';

const router = Router();

// Ministry creation schema
const CreateMinistrySchema = z.object({
  name: z.string().min(1, 'اسم الوزارة مطلوب').max(255, 'اسم الوزارة طويل جداً'),
  domain: z.string().url('النطاق غير صالح').optional(),
  branding: z.object({
    logo: z.string().url().optional(),
    primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'لون أساسي غير صالح').optional(),
    secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'لون ثانوي غير صالح').optional(),
    fontFamily: z.string().optional(),
  }).optional(),
  settings: z.object({
    allowPublicForms: z.boolean().optional(),
    requireApproval: z.boolean().optional(),
    maxFormsPerUser: z.number().int().min(1).optional(),
    allowedFileTypes: z.array(z.string()).optional(),
    maxFileSize: z.number().int().min(1).optional(),
  }).optional(),
});

// Ministry update schema
const UpdateMinistrySchema = CreateMinistrySchema.partial();

// Create a new ministry
router.post('/api/ministries', isAuthenticated, requirePermission(PERMISSIONS.MINISTRIES.CREATE), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const ministryData = CreateMinistrySchema.parse(req.body);

    // Check if domain is unique
    if (ministryData.domain) {
      const existingMinistry = await storage.getMinistryByDomain(ministryData.domain);
      if (existingMinistry) {
        return res.status(400).json({
          success: false,
          message: 'النطاق مستخدم بالفعل',
          error: 'DOMAIN_ALREADY_EXISTS'
        });
      }
    }

    // Create ministry
    const ministry = await storage.createMinistry({
      ...ministryData,
      createdBy: userId,
    });

    // Log the creation
    await auditService.logEvent({
      userId,
      action: 'ministry_created',
      resourceType: 'ministry',
      resourceId: ministry.id.toString(),
      details: { name: ministry.name, domain: ministry.domain },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json({
      success: true,
      data: ministry,
      message: 'تم إنشاء الوزارة بنجاح'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'بيانات غير صحيحة',
        errors: error.errors
      });
    }

    console.error('Error creating ministry:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء إنشاء الوزارة',
      error: 'MINISTRY_CREATION_ERROR'
    });
  }
});

// Get all ministries with pagination and filters
router.get('/api/ministries', isAuthenticated, requirePermission(PERMISSIONS.MINISTRIES.READ), async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '10', search = '' } = req.query as Record<string, string>;
    
    const result = await storage.getMinistries({
      page: parseInt(page),
      limit: parseInt(limit),
      search: search || undefined,
    });

    res.json({
      success: true,
      data: result.data,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      }
    });
  } catch (error) {
    console.error('Error fetching ministries:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب الوزارات',
      error: 'MINISTRIES_FETCH_ERROR'
    });
  }
});

// Get ministry by ID
router.get('/api/ministries/:id', isAuthenticated, requirePermission(PERMISSIONS.MINISTRIES.READ), async (req: Request, res: Response) => {
  try {
    const ministryId = req.params.id;
    const ministry = await storage.getMinistryById(ministryId);

    if (!ministry) {
      return res.status(404).json({
        success: false,
        message: 'الوزارة غير موجودة',
        error: 'MINISTRY_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: ministry
    });
  } catch (error) {
    console.error('Error fetching ministry:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب الوزارة',
      error: 'MINISTRY_FETCH_ERROR'
    });
  }
});

// Update ministry
router.put('/api/ministries/:id', isAuthenticated, requirePermission(PERMISSIONS.MINISTRIES.UPDATE), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const ministryId = req.params.id;
    const updateData = UpdateMinistrySchema.parse(req.body);

    // Check if ministry exists
    const existingMinistry = await storage.getMinistryById(ministryId);
    if (!existingMinistry) {
      return res.status(404).json({
        success: false,
        message: 'الوزارة غير موجودة',
        error: 'MINISTRY_NOT_FOUND'
      });
    }

    // Check if domain is unique (if being updated)
    if (updateData.domain && updateData.domain !== existingMinistry.domain) {
      const domainExists = await storage.getMinistryByDomain(updateData.domain);
      if (domainExists) {
        return res.status(400).json({
          success: false,
          message: 'النطاق مستخدم بالفعل',
          error: 'DOMAIN_ALREADY_EXISTS'
        });
      }
    }

    // Update ministry
    const updatedMinistry = await storage.updateMinistry(ministryId, updateData);

    // Log the update
    await auditService.logEvent({
      userId,
      action: 'ministry_updated',
      resourceType: 'ministry',
      resourceId: ministryId,
      details: { 
        changes: updateData,
        previous: existingMinistry 
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({
      success: true,
      data: updatedMinistry,
      message: 'تم تحديث الوزارة بنجاح'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'بيانات غير صحيحة',
        errors: error.errors
      });
    }

    console.error('Error updating ministry:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تحديث الوزارة',
      error: 'MINISTRY_UPDATE_ERROR'
    });
  }
});

// Delete ministry
router.delete('/api/ministries/:id', isAuthenticated, requirePermission(PERMISSIONS.MINISTRIES.DELETE), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const ministryId = req.params.id;

    // Check if ministry exists
    const existingMinistry = await storage.getMinistryById(ministryId);
    if (!existingMinistry) {
      return res.status(404).json({
        success: false,
        message: 'الوزارة غير موجودة',
        error: 'MINISTRY_NOT_FOUND'
      });
    }

    // Check if ministry has associated users or forms
    const hasUsers = await storage.getMinistryUserCount(ministryId);
    const hasForms = await storage.getMinistryFormCount(ministryId);

    if (hasUsers > 0 || hasForms > 0) {
      return res.status(400).json({
        success: false,
        message: 'لا يمكن حذف الوزارة لوجود مستخدمين أو نماذج مرتبطة بها',
        error: 'MINISTRY_HAS_DEPENDENCIES'
      });
    }

    // Delete ministry
    const deleted = await storage.deleteMinistry(ministryId);

    if (deleted) {
      // Log the deletion
      await auditService.logEvent({
        userId,
        action: 'ministry_deleted',
        resourceType: 'ministry',
        resourceId: ministryId,
        details: { name: existingMinistry.name },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      res.json({
        success: true,
        message: 'تم حذف الوزارة بنجاح'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'فشل في حذف الوزارة',
        error: 'MINISTRY_DELETE_ERROR'
      });
    }
  } catch (error) {
    console.error('Error deleting ministry:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء حذف الوزارة',
      error: 'MINISTRY_DELETE_ERROR'
    });
  }
});

// Get ministry statistics
router.get('/api/ministries/:id/stats', isAuthenticated, requirePermission(PERMISSIONS.MINISTRIES.READ), async (req: Request, res: Response) => {
  try {
    const ministryId = req.params.id;

    // Check if ministry exists
    const ministry = await storage.getMinistryById(ministryId);
    if (!ministry) {
      return res.status(404).json({
        success: false,
        message: 'الوزارة غير موجودة',
        error: 'MINISTRY_NOT_FOUND'
      });
    }

    // Get statistics
    const stats = await storage.getMinistryStats(ministryId);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching ministry stats:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب إحصائيات الوزارة',
      error: 'MINISTRY_STATS_ERROR'
    });
  }
});

// Get ministry users
router.get('/api/ministries/:id/users', isAuthenticated, requirePermission(PERMISSIONS.USERS.READ), async (req: Request, res: Response) => {
  try {
    const ministryId = req.params.id;
    const { page = '1', limit = '10', search = '' } = req.query as Record<string, string>;

    // Check if ministry exists
    const ministry = await storage.getMinistryById(ministryId);
    if (!ministry) {
      return res.status(404).json({
        success: false,
        message: 'الوزارة غير موجودة',
        error: 'MINISTRY_NOT_FOUND'
      });
    }

    // Get ministry users
    const result = await storage.getMinistryUsers(ministryId, {
      page: parseInt(page),
      limit: parseInt(limit),
      search: search || undefined,
    });

    res.json({
      success: true,
      data: result.data,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      }
    });
  } catch (error) {
    console.error('Error fetching ministry users:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب مستخدمي الوزارة',
      error: 'MINISTRY_USERS_ERROR'
    });
  }
});

export default router;
