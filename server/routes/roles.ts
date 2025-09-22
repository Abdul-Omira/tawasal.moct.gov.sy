/**
 * Role Management API Routes
 * Handles CRUD operations for role definitions and permissions
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

// Role creation schema
const CreateRoleSchema = z.object({
  name: z.string().min(1, 'اسم الدور مطلوب').max(50, 'اسم الدور طويل جداً'),
  description: z.string().max(500, 'الوصف طويل جداً').optional(),
  permissions: z.array(z.string()).min(1, 'يجب تحديد صلاحية واحدة على الأقل'),
  ministrySpecific: z.boolean().default(false),
});

// Role update schema
const UpdateRoleSchema = CreateRoleSchema.partial();

// Permission validation schema
const PermissionSchema = z.object({
  resource: z.string().min(1, 'المورد مطلوب'),
  actions: z.array(z.string()).min(1, 'يجب تحديد إجراء واحد على الأقل'),
});

// Create a new role
router.post('/api/roles', isAuthenticated, requirePermission(PERMISSIONS.USERS.CREATE), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const roleData = CreateRoleSchema.parse(req.body);

    // Check if role name is unique
    const existingRole = await storage.getRoleDefinitionByName(roleData.name);
    if (existingRole) {
      return res.status(400).json({
        success: false,
        message: 'اسم الدور مستخدم بالفعل',
        error: 'ROLE_NAME_EXISTS'
      });
    }

    // Validate permissions
    const validPermissions = Object.values(PERMISSIONS).flat();
    const invalidPermissions = roleData.permissions.filter(p => !validPermissions.includes(p));
    if (invalidPermissions.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'صلاحيات غير صالحة',
        error: 'INVALID_PERMISSIONS',
        invalidPermissions
      });
    }

    // Create role
    const role = await storage.createRoleDefinition({
      ...roleData,
      createdBy: userId,
    });

    // Log the creation
    await auditService.logEvent({
      userId,
      action: 'role_created',
      resourceType: 'role',
      resourceId: role.id.toString(),
      details: { name: role.name, permissions: role.permissions },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json({
      success: true,
      data: role,
      message: 'تم إنشاء الدور بنجاح'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'بيانات غير صحيحة',
        errors: error.errors
      });
    }

    console.error('Error creating role:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء إنشاء الدور',
      error: 'ROLE_CREATION_ERROR'
    });
  }
});

// Get all roles
router.get('/api/roles', isAuthenticated, requirePermission(PERMISSIONS.USERS.READ), async (req: Request, res: Response) => {
  try {
    const { ministrySpecific } = req.query as Record<string, string>;
    
    const roles = await storage.getRoleDefinitions();
    
    // Filter by ministry-specific if requested
    let filteredRoles = roles;
    if (ministrySpecific !== undefined) {
      const isMinistrySpecific = ministrySpecific === 'true';
      filteredRoles = roles.filter(role => role.ministrySpecific === isMinistrySpecific);
    }

    res.json({
      success: true,
      data: filteredRoles
    });
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب الأدوار',
      error: 'ROLES_FETCH_ERROR'
    });
  }
});

// Get role by ID
router.get('/api/roles/:id', isAuthenticated, requirePermission(PERMISSIONS.USERS.READ), async (req: Request, res: Response) => {
  try {
    const roleId = req.params.id;
    const role = await storage.getRoleDefinitionById(roleId);

    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'الدور غير موجود',
        error: 'ROLE_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: role
    });
  } catch (error) {
    console.error('Error fetching role:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب الدور',
      error: 'ROLE_FETCH_ERROR'
    });
  }
});

// Update role
router.put('/api/roles/:id', isAuthenticated, requirePermission(PERMISSIONS.USERS.UPDATE), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const roleId = req.params.id;
    const updateData = UpdateRoleSchema.parse(req.body);

    // Check if role exists
    const existingRole = await storage.getRoleDefinitionById(roleId);
    if (!existingRole) {
      return res.status(404).json({
        success: false,
        message: 'الدور غير موجود',
        error: 'ROLE_NOT_FOUND'
      });
    }

    // Check if role name is unique (if being updated)
    if (updateData.name && updateData.name !== existingRole.name) {
      const nameExists = await storage.getRoleDefinitionByName(updateData.name);
      if (nameExists) {
        return res.status(400).json({
          success: false,
          message: 'اسم الدور مستخدم بالفعل',
          error: 'ROLE_NAME_EXISTS'
        });
      }
    }

    // Validate permissions (if being updated)
    if (updateData.permissions) {
      const validPermissions = Object.values(PERMISSIONS).flat();
      const invalidPermissions = updateData.permissions.filter(p => !validPermissions.includes(p));
      if (invalidPermissions.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'صلاحيات غير صالحة',
          error: 'INVALID_PERMISSIONS',
          invalidPermissions
        });
      }
    }

    // Update role
    const updatedRole = await storage.updateRoleDefinition(roleId, updateData);

    // Log the update
    await auditService.logEvent({
      userId,
      action: 'role_updated',
      resourceType: 'role',
      resourceId: roleId,
      details: { 
        changes: updateData,
        previous: existingRole 
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({
      success: true,
      data: updatedRole,
      message: 'تم تحديث الدور بنجاح'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'بيانات غير صحيحة',
        errors: error.errors
      });
    }

    console.error('Error updating role:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تحديث الدور',
      error: 'ROLE_UPDATE_ERROR'
    });
  }
});

// Delete role
router.delete('/api/roles/:id', isAuthenticated, requirePermission(PERMISSIONS.USERS.DELETE), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const roleId = req.params.id;

    // Check if role exists
    const existingRole = await storage.getRoleDefinitionById(roleId);
    if (!existingRole) {
      return res.status(404).json({
        success: false,
        message: 'الدور غير موجود',
        error: 'ROLE_NOT_FOUND'
      });
    }

    // Check if role is being used by users
    const usersWithRole = await storage.getUsersWithRole(roleId);
    if (usersWithRole.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'لا يمكن حذف الدور لوجود مستخدمين يستخدمونه',
        error: 'ROLE_IN_USE',
        usersCount: usersWithRole.length
      });
    }

    // Delete role
    const deleted = await storage.deleteRoleDefinition(roleId);

    if (deleted) {
      // Log the deletion
      await auditService.logEvent({
        userId,
        action: 'role_deleted',
        resourceType: 'role',
        resourceId: roleId,
        details: { name: existingRole.name },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      res.json({
        success: true,
        message: 'تم حذف الدور بنجاح'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'فشل في حذف الدور',
        error: 'ROLE_DELETE_ERROR'
      });
    }
  } catch (error) {
    console.error('Error deleting role:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء حذف الدور',
      error: 'ROLE_DELETE_ERROR'
    });
  }
});

// Get available permissions
router.get('/api/permissions', isAuthenticated, requirePermission(PERMISSIONS.USERS.READ), async (req: Request, res: Response) => {
  try {
    const permissions = {
      forms: {
        create: PERMISSIONS.FORMS.CREATE,
        read: PERMISSIONS.FORMS.READ,
        update: PERMISSIONS.FORMS.UPDATE,
        delete: PERMISSIONS.FORMS.DELETE,
        publish: PERMISSIONS.FORMS.PUBLISH,
      },
      users: {
        create: PERMISSIONS.USERS.CREATE,
        read: PERMISSIONS.USERS.READ,
        update: PERMISSIONS.USERS.UPDATE,
        delete: PERMISSIONS.USERS.DELETE,
      },
      ministries: {
        create: PERMISSIONS.MINISTRIES.CREATE,
        read: PERMISSIONS.MINISTRIES.READ,
        update: PERMISSIONS.MINISTRIES.UPDATE,
        delete: PERMISSIONS.MINISTRIES.DELETE,
      },
      audit_logs: {
        read: PERMISSIONS.AUDIT_LOGS.READ,
        export: PERMISSIONS.AUDIT_LOGS.EXPORT,
      },
      mfa: {
        manage_own: PERMISSIONS.MFA.MANAGE_OWN,
        manage_any: PERMISSIONS.MFA.MANAGE_ANY,
      },
      analytics: {
        read: PERMISSIONS.ANALYTICS.READ,
        export: PERMISSIONS.ANALYTICS.EXPORT,
      },
    };

    res.json({
      success: true,
      data: permissions
    });
  } catch (error) {
    console.error('Error fetching permissions:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب الصلاحيات',
      error: 'PERMISSIONS_FETCH_ERROR'
    });
  }
});

// Assign role to user
router.post('/api/users/:userId/assign-role', isAuthenticated, requirePermission(PERMISSIONS.USERS.UPDATE), async (req: Request, res: Response) => {
  try {
    const adminUserId = (req as any).user?.id;
    const { userId } = req.params;
    const { roleId, ministryId } = req.body;

    if (!roleId) {
      return res.status(400).json({
        success: false,
        message: 'معرف الدور مطلوب',
        error: 'MISSING_ROLE_ID'
      });
    }

    // Check if user exists
    const user = await storage.getUserById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود',
        error: 'USER_NOT_FOUND'
      });
    }

    // Check if role exists
    const role = await storage.getRoleDefinitionById(roleId);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'الدور غير موجود',
        error: 'ROLE_NOT_FOUND'
      });
    }

    // Assign role to user
    await storage.assignRoleToUser(userId, roleId, ministryId);

    // Log the assignment
    await auditService.logEvent({
      userId: adminUserId,
      action: 'role_assigned',
      resourceType: 'user',
      resourceId: userId,
      details: { 
        roleId, 
        roleName: role.name,
        ministryId,
        targetUser: user.username 
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({
      success: true,
      message: 'تم تعيين الدور للمستخدم بنجاح'
    });
  } catch (error) {
    console.error('Error assigning role:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تعيين الدور',
      error: 'ROLE_ASSIGNMENT_ERROR'
    });
  }
});

// Remove role from user
router.delete('/api/users/:userId/remove-role', isAuthenticated, requirePermission(PERMISSIONS.USERS.UPDATE), async (req: Request, res: Response) => {
  try {
    const adminUserId = (req as any).user?.id;
    const { userId } = req.params;
    const { roleId } = req.body;

    if (!roleId) {
      return res.status(400).json({
        success: false,
        message: 'معرف الدور مطلوب',
        error: 'MISSING_ROLE_ID'
      });
    }

    // Check if user exists
    const user = await storage.getUserById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود',
        error: 'USER_NOT_FOUND'
      });
    }

    // Remove role from user
    await storage.removeRoleFromUser(userId, roleId);

    // Log the removal
    await auditService.logEvent({
      userId: adminUserId,
      action: 'role_removed',
      resourceType: 'user',
      resourceId: userId,
      details: { 
        roleId,
        targetUser: user.username 
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({
      success: true,
      message: 'تم إزالة الدور من المستخدم بنجاح'
    });
  } catch (error) {
    console.error('Error removing role:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء إزالة الدور',
      error: 'ROLE_REMOVAL_ERROR'
    });
  }
});

export default router;
