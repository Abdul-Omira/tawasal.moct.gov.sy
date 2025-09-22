/**
 * Role-Based Access Control (RBAC) Middleware
 * Implements granular permission system for multi-tenant architecture
 * 
 * @author Syrian Ministry of Communications
 * @version 1.0.0
 */

import { Request, Response, NextFunction } from 'express';
import { storage } from '../database/storage';

// Permission constants
export const PERMISSIONS = {
  // Form permissions
  CREATE_FORMS: 'forms:create',
  VIEW_FORMS: 'forms:view',
  EDIT_FORMS: 'forms:edit',
  DELETE_FORMS: 'forms:delete',
  PUBLISH_FORMS: 'forms:publish',
  ARCHIVE_FORMS: 'forms:archive',
  EXPORT_FORMS: 'forms:export',
  IMPORT_FORMS: 'forms:import',
  VIEW_FORM_SUBMISSIONS: 'forms:view_submissions',
  MANAGE_FORM_SUBMISSIONS: 'forms:manage_submissions',
  VIEW_FORM_ANALYTICS: 'forms:view_analytics',
  MANAGE_FORM_TEMPLATES: 'forms:manage_templates',
  
  // User management permissions
  USERS: {
    CREATE: 'users:create',
    READ: 'users:read',
    UPDATE: 'users:update',
    DELETE: 'users:delete',
    ASSIGN_ROLE: 'users:assign_role',
    MANAGE_PERMISSIONS: 'users:manage_permissions'
  },
  
  // Ministry management permissions
  MINISTRIES: {
    CREATE: 'ministries:create',
    READ: 'ministries:read',
    UPDATE: 'ministries:update',
    DELETE: 'ministries:delete',
    MANAGE_BRANDING: 'ministries:manage_branding',
    MANAGE_SETTINGS: 'ministries:manage_settings'
  },
  
  // Analytics permissions
  ANALYTICS: {
    READ: 'analytics:read',
    EXPORT: 'analytics:export',
    MANAGE_REPORTS: 'analytics:manage_reports'
  },
  
  // Form submissions permissions
  SUBMISSIONS: {
    READ: 'submissions:read',
    UPDATE: 'submissions:update',
    DELETE: 'submissions:delete',
    EXPORT: 'submissions:export',
    APPROVE: 'submissions:approve',
    REJECT: 'submissions:reject'
  },
  
  // System administration permissions
  SYSTEM: {
    MANAGE_ROLES: 'system:manage_roles',
    VIEW_AUDIT_LOGS: 'system:view_audit_logs',
    MANAGE_INTEGRATIONS: 'system:manage_integrations',
    SYSTEM_SETTINGS: 'system:settings'
  },
  
  // Template management permissions
  TEMPLATES: {
    CREATE: 'templates:create',
    READ: 'templates:read',
    UPDATE: 'templates:update',
    DELETE: 'templates:delete',
    SHARE: 'templates:share'
  },

  // Report management permissions
  REPORTS: {
    CREATE: 'reports:create',
    READ: 'reports:read',
    UPDATE: 'reports:update',
    DELETE: 'reports:delete',
    GENERATE: 'reports:generate',
    DOWNLOAD: 'reports:download',
    SHARE: 'reports:share',
    SCHEDULE: 'reports:schedule'
  },

  // Security monitoring permissions
  SECURITY: {
    VIEW_EVENTS: 'security:view_events',
    CREATE_EVENTS: 'security:create_events',
    UPDATE_EVENTS: 'security:update_events',
    DELETE_EVENTS: 'security:delete_events',
    VIEW_ALERTS: 'security:view_alerts',
    CREATE_ALERTS: 'security:create_alerts',
    UPDATE_ALERTS: 'security:update_alerts',
    VIEW_THREATS: 'security:view_threats',
    MANAGE_THREATS: 'security:manage_threats',
    VIEW_DASHBOARDS: 'security:view_dashboards',
    CREATE_DASHBOARDS: 'security:create_dashboards',
    UPDATE_DASHBOARDS: 'security:update_dashboards',
    DELETE_DASHBOARDS: 'security:delete_dashboards',
    VIEW_REPORTS: 'security:view_reports',
    GENERATE_REPORTS: 'security:generate_reports',
    VIEW_ANALYTICS: 'security:view_analytics',
    VIEW_METRICS: 'security:view_metrics',
    EXECUTE_ACTIONS: 'security:execute_actions',
    VIEW_ACTIONS: 'security:view_actions',
    MANAGE_AUTOMATION: 'security:manage_automation',
    VIEW_COMPLIANCE: 'security:view_compliance',
    RUN_COMPLIANCE: 'security:run_compliance',
    VIEW_VULNERABILITIES: 'security:view_vulnerabilities',
    SCAN_VULNERABILITIES: 'security:scan_vulnerabilities'
  },

  // Webhook management permissions
  WEBHOOKS: {
    CREATE: 'webhooks:create',
    READ: 'webhooks:read',
    UPDATE: 'webhooks:update',
    DELETE: 'webhooks:delete',
    TRIGGER: 'webhooks:trigger',
    TEST: 'webhooks:test',
    VIEW_DELIVERIES: 'webhooks:view_deliveries',
    RETRY_DELIVERIES: 'webhooks:retry_deliveries',
    VIEW_ANALYTICS: 'webhooks:view_analytics',
    MANAGE_TEMPLATES: 'webhooks:manage_templates'
  },
  WHITE_LABEL: {
    READ: 'white_label:read',
    UPDATE: 'white_label:update',
    DELETE: 'white_label:delete',
    UPLOAD_ASSETS: 'white_label:upload_assets',
    MANAGE_DOMAINS: 'white_label:manage_domains',
    MANAGE_CSS: 'white_label:manage_css',
    EXPORT: 'white_label:export',
    IMPORT: 'white_label:import'
  }
} as const;

// Role definitions with permissions
export const ROLE_PERMISSIONS: Record<Role, RolePermissions> = {
  super_admin: [
    PERMISSIONS.CREATE_FORMS,
    PERMISSIONS.VIEW_FORMS,
    PERMISSIONS.EDIT_FORMS,
    PERMISSIONS.DELETE_FORMS,
    PERMISSIONS.PUBLISH_FORMS,
    PERMISSIONS.ARCHIVE_FORMS,
    PERMISSIONS.VIEW_FORM_SUBMISSIONS,
    PERMISSIONS.MANAGE_FORM_SUBMISSIONS,
    PERMISSIONS.VIEW_FORM_ANALYTICS,
    PERMISSIONS.MANAGE_FORM_TEMPLATES,
    PERMISSIONS.TEMPLATES.CREATE,
    PERMISSIONS.TEMPLATES.READ,
    PERMISSIONS.TEMPLATES.UPDATE,
    PERMISSIONS.TEMPLATES.DELETE,
    PERMISSIONS.TEMPLATES.SHARE,
    PERMISSIONS.SUBMISSIONS.READ,
    PERMISSIONS.SUBMISSIONS.UPDATE,
    PERMISSIONS.SUBMISSIONS.APPROVE,
    PERMISSIONS.SUBMISSIONS.REJECT,
    PERMISSIONS.ANALYTICS.READ,
    PERMISSIONS.REPORTS.CREATE,
    PERMISSIONS.REPORTS.READ,
    PERMISSIONS.REPORTS.UPDATE,
    PERMISSIONS.REPORTS.DELETE,
    PERMISSIONS.REPORTS.GENERATE,
    PERMISSIONS.REPORTS.DOWNLOAD,
    PERMISSIONS.REPORTS.SHARE,
    PERMISSIONS.REPORTS.SCHEDULE,
    PERMISSIONS.SECURITY.VIEW_EVENTS,
    PERMISSIONS.SECURITY.CREATE_EVENTS,
    PERMISSIONS.SECURITY.UPDATE_EVENTS,
    PERMISSIONS.SECURITY.DELETE_EVENTS,
    PERMISSIONS.SECURITY.VIEW_ALERTS,
    PERMISSIONS.SECURITY.CREATE_ALERTS,
    PERMISSIONS.SECURITY.UPDATE_ALERTS,
    PERMISSIONS.SECURITY.VIEW_THREATS,
    PERMISSIONS.SECURITY.MANAGE_THREATS,
    PERMISSIONS.SECURITY.VIEW_DASHBOARDS,
    PERMISSIONS.SECURITY.CREATE_DASHBOARDS,
    PERMISSIONS.SECURITY.UPDATE_DASHBOARDS,
    PERMISSIONS.SECURITY.DELETE_DASHBOARDS,
    PERMISSIONS.SECURITY.VIEW_REPORTS,
    PERMISSIONS.SECURITY.GENERATE_REPORTS,
    PERMISSIONS.SECURITY.VIEW_ANALYTICS,
    PERMISSIONS.SECURITY.VIEW_METRICS,
    PERMISSIONS.SECURITY.EXECUTE_ACTIONS,
    PERMISSIONS.SECURITY.VIEW_ACTIONS,
    PERMISSIONS.SECURITY.MANAGE_AUTOMATION,
    PERMISSIONS.SECURITY.VIEW_COMPLIANCE,
    PERMISSIONS.SECURITY.RUN_COMPLIANCE,
    PERMISSIONS.SECURITY.VIEW_VULNERABILITIES,
    PERMISSIONS.SECURITY.SCAN_VULNERABILITIES,
    PERMISSIONS.WEBHOOKS.CREATE,
    PERMISSIONS.WEBHOOKS.READ,
    PERMISSIONS.WEBHOOKS.UPDATE,
    PERMISSIONS.WEBHOOKS.DELETE,
    PERMISSIONS.WEBHOOKS.TRIGGER,
    PERMISSIONS.WEBHOOKS.TEST,
    PERMISSIONS.WEBHOOKS.VIEW_DELIVERIES,
    PERMISSIONS.WEBHOOKS.RETRY_DELIVERIES,
    PERMISSIONS.WEBHOOKS.VIEW_ANALYTICS,
    PERMISSIONS.WEBHOOKS.MANAGE_TEMPLATES,
    PERMISSIONS.WHITE_LABEL.READ,
    PERMISSIONS.WHITE_LABEL.UPDATE,
    PERMISSIONS.WHITE_LABEL.DELETE,
    PERMISSIONS.WHITE_LABEL.UPLOAD_ASSETS,
    PERMISSIONS.WHITE_LABEL.MANAGE_DOMAINS,
    PERMISSIONS.WHITE_LABEL.MANAGE_CSS,
    PERMISSIONS.WHITE_LABEL.EXPORT,
    PERMISSIONS.WHITE_LABEL.IMPORT
  ], // All permissions
  ministry_admin: [
    PERMISSIONS.CREATE_FORMS,
    PERMISSIONS.VIEW_FORMS,
    PERMISSIONS.EDIT_FORMS,
    PERMISSIONS.DELETE_FORMS,
    PERMISSIONS.PUBLISH_FORMS,
    PERMISSIONS.ARCHIVE_FORMS,
    PERMISSIONS.VIEW_FORM_SUBMISSIONS,
    PERMISSIONS.MANAGE_FORM_SUBMISSIONS,
    PERMISSIONS.VIEW_FORM_ANALYTICS,
    PERMISSIONS.MANAGE_FORM_TEMPLATES,
    PERMISSIONS.TEMPLATES.CREATE,
    PERMISSIONS.TEMPLATES.READ,
    PERMISSIONS.TEMPLATES.UPDATE,
    PERMISSIONS.TEMPLATES.DELETE,
    PERMISSIONS.TEMPLATES.SHARE,
    PERMISSIONS.REPORTS.CREATE,
    PERMISSIONS.REPORTS.READ,
    PERMISSIONS.REPORTS.UPDATE,
    PERMISSIONS.REPORTS.DELETE,
    PERMISSIONS.REPORTS.GENERATE,
    PERMISSIONS.REPORTS.DOWNLOAD,
    PERMISSIONS.REPORTS.SHARE,
    PERMISSIONS.REPORTS.SCHEDULE,
    PERMISSIONS.SECURITY.VIEW_EVENTS,
    PERMISSIONS.SECURITY.VIEW_ALERTS,
    PERMISSIONS.SECURITY.VIEW_THREATS,
    PERMISSIONS.SECURITY.VIEW_DASHBOARDS,
    PERMISSIONS.SECURITY.VIEW_REPORTS,
    PERMISSIONS.SECURITY.VIEW_ANALYTICS,
    PERMISSIONS.SECURITY.VIEW_METRICS,
    PERMISSIONS.SECURITY.VIEW_COMPLIANCE,
    PERMISSIONS.SECURITY.VIEW_VULNERABILITIES,
    PERMISSIONS.WEBHOOKS.CREATE,
    PERMISSIONS.WEBHOOKS.READ,
    PERMISSIONS.WEBHOOKS.UPDATE,
    PERMISSIONS.WEBHOOKS.DELETE,
    PERMISSIONS.WEBHOOKS.TRIGGER,
    PERMISSIONS.WEBHOOKS.TEST,
    PERMISSIONS.WEBHOOKS.VIEW_DELIVERIES,
    PERMISSIONS.WEBHOOKS.RETRY_DELIVERIES,
    PERMISSIONS.WEBHOOKS.VIEW_ANALYTICS,
    PERMISSIONS.WEBHOOKS.MANAGE_TEMPLATES,
    PERMISSIONS.WHITE_LABEL.READ,
    PERMISSIONS.WHITE_LABEL.UPDATE,
    PERMISSIONS.WHITE_LABEL.UPLOAD_ASSETS,
    PERMISSIONS.WHITE_LABEL.MANAGE_DOMAINS,
    PERMISSIONS.WHITE_LABEL.MANAGE_CSS,
    PERMISSIONS.WHITE_LABEL.EXPORT,
    PERMISSIONS.WHITE_LABEL.IMPORT
  ],
  form_creator: [
    PERMISSIONS.CREATE_FORMS,
    PERMISSIONS.VIEW_FORMS,
    PERMISSIONS.EDIT_FORMS,
    PERMISSIONS.DELETE_FORMS,
    PERMISSIONS.PUBLISH_FORMS,
    PERMISSIONS.VIEW_FORM_SUBMISSIONS,
    PERMISSIONS.VIEW_FORM_ANALYTICS,
    PERMISSIONS.MANAGE_FORM_TEMPLATES,
    PERMISSIONS.TEMPLATES.CREATE,
    PERMISSIONS.TEMPLATES.READ,
    PERMISSIONS.TEMPLATES.UPDATE
  ],
  form_manager: [
    PERMISSIONS.VIEW_FORMS,
    PERMISSIONS.EDIT_FORMS,
    PERMISSIONS.PUBLISH_FORMS,
    PERMISSIONS.VIEW_FORM_SUBMISSIONS,
    PERMISSIONS.MANAGE_FORM_SUBMISSIONS,
    PERMISSIONS.VIEW_FORM_ANALYTICS,
    PERMISSIONS.SUBMISSIONS.READ,
    PERMISSIONS.SUBMISSIONS.UPDATE,
    PERMISSIONS.SUBMISSIONS.APPROVE,
    PERMISSIONS.SUBMISSIONS.REJECT,
    PERMISSIONS.ANALYTICS.READ
  ],
  viewer: [
    PERMISSIONS.VIEW_FORMS,
    PERMISSIONS.VIEW_FORM_SUBMISSIONS,
    PERMISSIONS.VIEW_FORM_ANALYTICS,
    PERMISSIONS.SUBMISSIONS.READ,
    PERMISSIONS.ANALYTICS.READ
  ]
};

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS] | typeof PERMISSIONS.TEMPLATES[keyof typeof PERMISSIONS.TEMPLATES] | typeof PERMISSIONS.SUBMISSIONS[keyof typeof PERMISSIONS.SUBMISSIONS] | typeof PERMISSIONS.ANALYTICS[keyof typeof PERMISSIONS.ANALYTICS] | typeof PERMISSIONS.REPORTS[keyof typeof PERMISSIONS.REPORTS] | typeof PERMISSIONS.SECURITY[keyof typeof PERMISSIONS.SECURITY] | typeof PERMISSIONS.WEBHOOKS[keyof typeof PERMISSIONS.WEBHOOKS] | typeof PERMISSIONS.WHITE_LABEL[keyof typeof PERMISSIONS.WHITE_LABEL];
export type Role = 'super_admin' | 'ministry_admin' | 'form_creator' | 'form_manager' | 'viewer';
export type RolePermissions = Permission[];

/**
 * Check if user has a specific permission
 */
export async function hasPermission(userId: number, permission: Permission): Promise<boolean> {
  try {
    const user = await storage.getUserExtendedById(userId.toString());
    if (!user) return false;

    // Super admin has all permissions
    if (user.role === 'super_admin') return true;

    // Get user's role permissions
    const rolePermissions = ROLE_PERMISSIONS[user.role as Role] || [];
    
    // Check if user has the specific permission
    return rolePermissions.includes(permission);
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
}

/**
 * Check if user has any of the specified permissions
 */
export async function hasAnyPermission(userId: number, permissions: Permission[]): Promise<boolean> {
  for (const permission of permissions) {
    if (await hasPermission(userId, permission)) {
      return true;
    }
  }
  return false;
}

/**
 * Check if user has all of the specified permissions
 */
export async function hasAllPermissions(userId: number, permissions: Permission[]): Promise<boolean> {
  for (const permission of permissions) {
    if (!(await hasPermission(userId, permission))) {
      return false;
    }
  }
  return true;
}

/**
 * Check if user belongs to a specific ministry
 */
export async function belongsToMinistry(userId: number, ministryId: number): Promise<boolean> {
  try {
    const user = await storage.getUserExtendedById(userId.toString());
    if (!user) return false;

    // Super admin can access all ministries
    if (user.role === 'super_admin') return true;

    return user.ministryId === ministryId;
  } catch (error) {
    console.error('Error checking ministry membership:', error);
    return false;
  }
}

/**
 * Middleware to require a specific permission
 */
export function requirePermission(permission: Permission) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'المستخدم غير مسجل الدخول',
          error: 'UNAUTHORIZED'
        });
      }

      const hasAccess = await hasPermission(userId, permission);
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'ليس لديك صلاحية للوصول إلى هذا المورد',
          error: 'FORBIDDEN',
          requiredPermission: permission
        });
      }

      next();
    } catch (error) {
      console.error('Error in requirePermission middleware:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في التحقق من الصلاحيات',
        error: 'PERMISSION_CHECK_ERROR'
      });
    }
  };
}

/**
 * Middleware to require any of the specified permissions
 */
export function requireAnyPermission(permissions: Permission[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'المستخدم غير مسجل الدخول',
          error: 'UNAUTHORIZED'
        });
      }

      const hasAccess = await hasAnyPermission(userId, permissions);
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'ليس لديك صلاحية للوصول إلى هذا المورد',
          error: 'FORBIDDEN',
          requiredPermissions: permissions
        });
      }

      next();
    } catch (error) {
      console.error('Error in requireAnyPermission middleware:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في التحقق من الصلاحيات',
        error: 'PERMISSION_CHECK_ERROR'
      });
    }
  };
}

/**
 * Middleware to require all of the specified permissions
 */
export function requireAllPermissions(permissions: Permission[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'المستخدم غير مسجل الدخول',
          error: 'UNAUTHORIZED'
        });
      }

      const hasAccess = await hasAllPermissions(userId, permissions);
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'ليس لديك صلاحية للوصول إلى هذا المورد',
          error: 'FORBIDDEN',
          requiredPermissions: permissions
        });
      }

      next();
    } catch (error) {
      console.error('Error in requireAllPermissions middleware:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في التحقق من الصلاحيات',
        error: 'PERMISSION_CHECK_ERROR'
      });
    }
  };
}

/**
 * Middleware to require ministry membership
 */
export function requireMinistryMembership(ministryId: number) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'المستخدم غير مسجل الدخول',
          error: 'UNAUTHORIZED'
        });
      }

      const belongs = await belongsToMinistry(userId, ministryId);
      if (!belongs) {
        return res.status(403).json({
          success: false,
          message: 'ليس لديك صلاحية للوصول إلى موارد هذه الوزارة',
          error: 'FORBIDDEN',
          requiredMinistryId: ministryId
        });
      }

      next();
    } catch (error) {
      console.error('Error in requireMinistryMembership middleware:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في التحقق من عضوية الوزارة',
        error: 'MINISTRY_CHECK_ERROR'
      });
    }
  };
}

/**
 * Middleware to require super admin role
 */
export function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  if (!user || user.role !== 'super_admin') {
    return res.status(403).json({
      success: false,
      message: 'يتطلب صلاحيات مدير النظام العام',
      error: 'SUPER_ADMIN_REQUIRED'
    });
  }
  next();
}

/**
 * Middleware to require ministry admin or higher
 */
export function requireMinistryAdmin(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  if (!user || !['super_admin', 'ministry_admin'].includes(user.role)) {
    return res.status(403).json({
      success: false,
      message: 'يتطلب صلاحيات مدير الوزارة أو أعلى',
      error: 'MINISTRY_ADMIN_REQUIRED'
    });
  }
  next();
}

/**
 * Get user's effective permissions
 */
export async function getUserPermissions(userId: number): Promise<Permission[]> {
  try {
    const user = await storage.getUserExtendedById(userId.toString());
    if (!user) return [];

    // Super admin has all permissions
    if (user.role === 'super_admin') {
      return Object.values(PERMISSIONS) as Permission[];
    }

    // Get role-based permissions
    const rolePermissions = ROLE_PERMISSIONS[user.role as Role] || [];
    
    // Get custom permissions from user record
    const customPermissions = user.permissions || [];
    
    // Combine role and custom permissions
    const allPermissions = [...rolePermissions, ...customPermissions];
    return Array.from(new Set(allPermissions)) as Permission[];
  } catch (error) {
    console.error('Error getting user permissions:', error);
    return [];
  }
}

/**
 * Check if user can access a specific resource
 */
export async function canAccessResource(
  userId: number, 
  resourceType: string, 
  resourceId: string | number,
  action: string
): Promise<boolean> {
  try {
    const user = await storage.getUserExtendedById(userId.toString());
    if (!user) return false;

    // Super admin can access everything
    if (user.role === 'super_admin') return true;

    // Check ministry-specific access
    if (user.ministryId) {
      // For ministry-specific resources, check if user belongs to the same ministry
      // This would need to be implemented based on the specific resource type
      return true; // Placeholder
    }

    return false;
  } catch (error) {
    console.error('Error checking resource access:', error);
    return false;
  }
}

export default {
  PERMISSIONS,
  ROLE_PERMISSIONS,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  belongsToMinistry,
  requirePermission,
  requireAnyPermission,
  requireAllPermissions,
  requireMinistryMembership,
  requireSuperAdmin,
  requireMinistryAdmin,
  getUserPermissions,
  canAccessResource
};
