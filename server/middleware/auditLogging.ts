/**
 * Audit Logging Middleware
 * Automatically logs critical operations for security and compliance
 * 
 * @author Syrian Ministry of Communications
 * @version 1.0.0
 */

import { Request, Response, NextFunction } from 'express';
import { auditService } from '../services/auditService';

// Define operations that should be audited
const AUDITABLE_OPERATIONS = {
  // Authentication operations
  'POST /api/auth/login': 'user_login',
  'POST /api/auth/logout': 'user_logout',
  'POST /api/auth/register': 'user_register',
  'POST /api/mfa/setup': 'mfa_setup',
  'POST /api/mfa/verify': 'mfa_verify',
  'POST /api/mfa/disable': 'mfa_disable',
  
  // User management operations
  'POST /api/admin/users': 'user_create',
  'PUT /api/admin/users/:id': 'user_update',
  'DELETE /api/admin/users/:id': 'user_delete',
  'POST /api/admin/users/:id/assign-role': 'user_role_assign',
  'DELETE /api/admin/users/:id/remove-role': 'user_role_remove',
  
  // Ministry management operations
  'POST /api/ministries': 'ministry_create',
  'PUT /api/ministries/:id': 'ministry_update',
  'DELETE /api/ministries/:id': 'ministry_delete',
  
  // Role management operations
  'POST /api/roles': 'role_create',
  'PUT /api/roles/:id': 'role_update',
  'DELETE /api/roles/:id': 'role_delete',
  
  // Form management operations
  'POST /api/forms': 'form_create',
  'PUT /api/forms/:id': 'form_update',
  'DELETE /api/forms/:id': 'form_delete',
  'POST /api/forms/:id/publish': 'form_publish',
  'POST /api/forms/:id/unpublish': 'form_unpublish',
  
  // Encryption operations
  'POST /api/encryption/rotate': 'encryption_key_rotate',
  'POST /api/encryption/validate': 'encryption_key_validate',
  
  // File operations
  'POST /api/upload': 'file_upload',
  'DELETE /api/files/:id': 'file_delete',
  
  // Business submission operations
  'POST /api/business-submissions': 'business_submission_create',
  'PUT /api/business-submissions/:id': 'business_submission_update',
  'DELETE /api/business-submissions/:id': 'business_submission_delete',
  'POST /api/business-submissions/:id/approve': 'business_submission_approve',
  'POST /api/business-submissions/:id/reject': 'business_submission_reject',
  
  // Citizen communication operations
  'POST /api/citizen-communications': 'citizen_communication_create',
  'PUT /api/citizen-communications/:id': 'citizen_communication_update',
  'DELETE /api/citizen-communications/:id': 'citizen_communication_delete',
  'POST /api/citizen-communications/:id/assign': 'citizen_communication_assign',
  'POST /api/citizen-communications/:id/respond': 'citizen_communication_respond',
};

// Extract resource information from request
function extractResourceInfo(req: Request): { resourceType?: string; resourceId?: string } {
  const path = req.route?.path || req.path;
  const method = req.method;
  
  // Extract resource type and ID from common patterns
  if (path.includes('/users/')) {
    return {
      resourceType: 'user',
      resourceId: req.params.id,
    };
  } else if (path.includes('/ministries/')) {
    return {
      resourceType: 'ministry',
      resourceId: req.params.id,
    };
  } else if (path.includes('/roles/')) {
    return {
      resourceType: 'role',
      resourceId: req.params.id,
    };
  } else if (path.includes('/forms/')) {
    return {
      resourceType: 'form',
      resourceId: req.params.id,
    };
  } else if (path.includes('/business-submissions/')) {
    return {
      resourceType: 'business_submission',
      resourceId: req.params.id,
    };
  } else if (path.includes('/citizen-communications/')) {
    return {
      resourceType: 'citizen_communication',
      resourceId: req.params.id,
    };
  } else if (path.includes('/files/')) {
    return {
      resourceType: 'file',
      resourceId: req.params.id,
    };
  }
  
  return {};
}

// Create audit logging middleware
export function auditLoggingMiddleware() {
  return async (req: Request, res: Response, next: NextFunction) => {
    const originalSend = res.send;
    const originalJson = res.json;
    
    // Override response methods to capture response data
    res.send = function(data: any) {
      // Log the operation after response is sent
      setImmediate(() => logOperation(req, res, data));
      return originalSend.call(this, data);
    };
    
    res.json = function(data: any) {
      // Log the operation after response is sent
      setImmediate(() => logOperation(req, res, data));
      return originalJson.call(this, data);
    };
    
    next();
  };
}

// Log the operation
async function logOperation(req: Request, res: Response, responseData: any) {
  try {
    const method = req.method;
    const path = req.route?.path || req.path;
    const operationKey = `${method} ${path}`;
    
    // Check if this operation should be audited
    const action = AUDITABLE_OPERATIONS[operationKey as keyof typeof AUDITABLE_OPERATIONS];
    if (!action) {
      return; // Skip non-auditable operations
    }
    
    // Only log successful operations (2xx status codes)
    if (res.statusCode < 200 || res.statusCode >= 300) {
      return;
    }
    
    // Extract resource information
    const { resourceType, resourceId } = extractResourceInfo(req);
    
    // Prepare audit log data
    const auditData = {
      userId: (req as any).user?.id,
      action,
      resourceType,
      resourceId,
      details: {
        method,
        path,
        statusCode: res.statusCode,
        responseSuccess: responseData?.success !== false,
        timestamp: new Date().toISOString(),
        userAgent: req.get('User-Agent'),
        referer: req.get('Referer'),
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      tenantId: (req as any).tenant?.id,
    };
    
    // Add request body for certain operations (excluding sensitive data)
    if (shouldLogRequestBody(action)) {
      auditData.details.requestBody = sanitizeRequestBody(req.body);
    }
    
    // Add response data for certain operations
    if (shouldLogResponseData(action)) {
      auditData.details.responseData = sanitizeResponseData(responseData);
    }
    
    // Log the event
    await auditService.logEvent(auditData);
  } catch (error) {
    console.error('Error logging audit event:', error);
    // Don't throw error to avoid breaking the main operation
  }
}

// Determine if request body should be logged
function shouldLogRequestBody(action: string): boolean {
  const sensitiveActions = [
    'user_login',
    'user_register',
    'mfa_setup',
    'mfa_verify',
    'encryption_key_rotate',
  ];
  
  return !sensitiveActions.includes(action);
}

// Determine if response data should be logged
function shouldLogResponseData(action: string): boolean {
  const responseActions = [
    'user_create',
    'user_update',
    'ministry_create',
    'ministry_update',
    'role_create',
    'role_update',
    'form_create',
    'form_update',
  ];
  
  return responseActions.includes(action);
}

// Sanitize request body to remove sensitive information
function sanitizeRequestBody(body: any): any {
  if (!body || typeof body !== 'object') {
    return body;
  }
  
  const sanitized = { ...body };
  const sensitiveFields = ['password', 'secret', 'token', 'key', 'mfaSecret', 'backupCodes'];
  
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });
  
  return sanitized;
}

// Sanitize response data to remove sensitive information
function sanitizeResponseData(data: any): any {
  if (!data || typeof data !== 'object') {
    return data;
  }
  
  const sanitized = { ...data };
  const sensitiveFields = ['password', 'secret', 'token', 'key', 'mfaSecret', 'backupCodes'];
  
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });
  
  return sanitized;
}

// Manual audit logging function for custom operations
export async function logAuditEvent(
  req: Request,
  action: string,
  resourceType?: string,
  resourceId?: string,
  details?: any
): Promise<void> {
  try {
    await auditService.logEvent({
      userId: (req as any).user?.id,
      action,
      resourceType,
      resourceId,
      details: {
        ...details,
        timestamp: new Date().toISOString(),
        userAgent: req.get('User-Agent'),
        referer: req.get('Referer'),
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      tenantId: (req as any).tenant?.id,
    });
  } catch (error) {
    console.error('Error logging custom audit event:', error);
  }
}

export default auditLoggingMiddleware;
