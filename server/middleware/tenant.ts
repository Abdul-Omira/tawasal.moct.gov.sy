/**
 * Multi-Tenant Architecture Middleware
 * Handles tenant isolation and tenant-specific configuration
 * 
 * @author Syrian Ministry of Communications
 * @version 1.0.0
 */

import { Request, Response, NextFunction } from 'express';
import { storage } from '../database/storage';

// Extend Request interface to include tenant information
declare global {
  namespace Express {
    interface Request {
      tenant?: {
        id: string;
        name: string;
        domain?: string;
        branding?: any;
        settings?: any;
      };
    }
  }
}

/**
 * Middleware to extract tenant information from request
 * Supports multiple tenant identification methods:
 * 1. Subdomain (e.g., ministry1.tawasal.moct.gov.sy)
 * 2. Domain (e.g., ministry1.gov.sy)
 * 3. Header (X-Tenant-ID)
 * 4. Query parameter (?tenant=ministry1)
 */
export const tenantResolver = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let tenantId: string | null = null;
    let tenant: any = null;

    // Method 1: Subdomain resolution
    const host = req.get('host') || '';
    const subdomain = host.split('.')[0];
    
    // Check if it's a subdomain (not www or main domain)
    if (subdomain && subdomain !== 'www' && subdomain !== 'tawasal' && subdomain !== 'moct') {
      tenantId = subdomain;
    }

    // Method 2: Custom domain resolution
    if (!tenantId) {
      const domain = host;
      tenant = await storage.getMinistryByDomain(domain);
      if (tenant) {
        tenantId = tenant.id.toString();
      }
    }

    // Method 3: Header-based resolution
    if (!tenantId) {
      tenantId = req.get('X-Tenant-ID') || null;
    }

    // Method 4: Query parameter resolution
    if (!tenantId) {
      tenantId = req.query.tenant as string || null;
    }

    // If we have a tenant ID, fetch the tenant details
    if (tenantId) {
      if (!tenant) {
        tenant = await storage.getMinistryById(tenantId);
      }
      
      if (tenant) {
        req.tenant = {
          id: tenant.id.toString(),
          name: tenant.name,
          domain: tenant.domain,
          branding: tenant.branding || {},
          settings: tenant.settings || {},
        };
      } else {
        // Tenant ID provided but not found
        return res.status(404).json({
          success: false,
          message: 'الوزارة غير موجودة',
          error: 'TENANT_NOT_FOUND'
        });
      }
    }

    next();
  } catch (error) {
    console.error('Error resolving tenant:', error);
    next(error);
  }
};

/**
 * Middleware to require tenant context
 * Ensures that a tenant is identified before proceeding
 */
export const requireTenant = (req: Request, res: Response, next: NextFunction) => {
  if (!req.tenant) {
    return res.status(400).json({
      success: false,
      message: 'يجب تحديد الوزارة',
      error: 'TENANT_REQUIRED'
    });
  }
  next();
};

/**
 * Middleware to filter data by tenant
 * Automatically adds tenant filtering to database queries
 */
export const tenantFilter = (req: Request, res: Response, next: NextFunction) => {
  if (req.tenant) {
    // Add tenant filter to request for use in routes
    (req as any).tenantFilter = {
      ministryId: parseInt(req.tenant.id)
    };
  }
  next();
};

/**
 * Middleware to validate tenant access
 * Ensures user has access to the current tenant
 */
export const validateTenantAccess = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const tenant = req.tenant;

    if (!user || !tenant) {
      return next();
    }

    // Super admin can access all tenants
    if (user.isAdmin) {
      return next();
    }

    // Check if user belongs to this tenant
    if (user.ministryId && user.ministryId.toString() !== tenant.id) {
      return res.status(403).json({
        success: false,
        message: 'ليس لديك صلاحية للوصول إلى هذه الوزارة',
        error: 'TENANT_ACCESS_DENIED'
      });
    }

    next();
  } catch (error) {
    console.error('Error validating tenant access:', error);
    next(error);
  }
};

/**
 * Middleware to apply tenant-specific configuration
 * Sets tenant-specific settings in response headers and locals
 */
export const applyTenantConfig = (req: Request, res: Response, next: NextFunction) => {
  if (req.tenant) {
    // Set tenant-specific headers
    res.set('X-Tenant-ID', req.tenant.id);
    res.set('X-Tenant-Name', req.tenant.name);

    // Set tenant branding in response locals
    res.locals.tenantBranding = req.tenant.branding;
    res.locals.tenantSettings = req.tenant.settings;

    // Apply tenant-specific CORS if needed
    if (req.tenant.domain) {
      res.set('Access-Control-Allow-Origin', `https://${req.tenant.domain}`);
    }
  }
  next();
};

/**
 * Helper function to get current tenant from request
 */
export const getCurrentTenant = (req: Request) => {
  return req.tenant;
};

/**
 * Helper function to check if user belongs to tenant
 */
export const userBelongsToTenant = (user: any, tenant: any) => {
  if (!user || !tenant) return false;
  if (user.isAdmin) return true;
  return user.ministryId && user.ministryId.toString() === tenant.id;
};

/**
 * Helper function to get tenant-specific database filter
 */
export const getTenantFilter = (req: Request) => {
  return (req as any).tenantFilter || {};
};

/**
 * Middleware to handle tenant-specific error responses
 */
export const tenantErrorHandler = (error: any, req: Request, res: Response, next: NextFunction) => {
  if (req.tenant) {
    // Customize error response based on tenant settings
    const errorResponse = {
      success: false,
      message: error.message || 'حدث خطأ غير متوقع',
      error: error.code || 'INTERNAL_ERROR',
      tenant: req.tenant.name,
      timestamp: new Date().toISOString()
    };

    // Apply tenant-specific error styling if configured
    if (req.tenant.settings?.errorTheme) {
      errorResponse.theme = req.tenant.settings.errorTheme;
    }

    return res.status(error.status || 500).json(errorResponse);
  }

  next(error);
};
