/**
 * Audit Logging Service
 * Comprehensive audit trail for security and compliance
 * 
 * @author Syrian Ministry of Communications
 * @version 1.0.0
 */

import { Request, Response } from 'express';
import { storage } from '../database/storage';
import { AuditLog, InsertAuditLog } from '@shared/schema';

export interface AuditContext {
  userId?: number;
  ipAddress?: string;
  userAgent?: string;
  resourceType?: string;
  resourceId?: string | number;
  details?: Record<string, any>;
}

export class AuditService {
  /**
   * Log an audit event
   */
  static async logEvent(
    action: string,
    context: AuditContext = {}
  ): Promise<void> {
    try {
      const auditLog: InsertAuditLog = {
        userId: context.userId,
        action,
        resourceType: context.resourceType,
        resourceId: context.resourceId?.toString(),
        details: context.details,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent
      };

      await storage.createAuditLog(auditLog);
    } catch (error) {
      console.error('Error logging audit event:', error);
      // Don't throw error to avoid breaking the main flow
    }
  }

  /**
   * Log user authentication events
   */
  static async logAuthEvent(
    action: 'login' | 'logout' | 'login_failed' | 'password_changed' | 'mfa_enabled' | 'mfa_disabled',
    context: AuditContext
  ): Promise<void> {
    await this.logEvent(`auth:${action}`, context);
  }

  /**
   * Log form management events
   */
  static async logFormEvent(
    action: 'create' | 'update' | 'delete' | 'publish' | 'archive' | 'export' | 'import',
    formId: string | number,
    context: AuditContext
  ): Promise<void> {
    await this.logEvent(`form:${action}`, {
      ...context,
      resourceType: 'form',
      resourceId: formId
    });
  }

  /**
   * Log user management events
   */
  static async logUserEvent(
    action: 'create' | 'update' | 'delete' | 'role_changed' | 'permissions_changed' | 'status_changed',
    targetUserId: string | number,
    context: AuditContext
  ): Promise<void> {
    await this.logEvent(`user:${action}`, {
      ...context,
      resourceType: 'user',
      resourceId: targetUserId
    });
  }

  /**
   * Log ministry management events
   */
  static async logMinistryEvent(
    action: 'create' | 'update' | 'delete' | 'settings_changed' | 'branding_changed',
    ministryId: string | number,
    context: AuditContext
  ): Promise<void> {
    await this.logEvent(`ministry:${action}`, {
      ...context,
      resourceType: 'ministry',
      resourceId: ministryId
    });
  }

  /**
   * Log form submission events
   */
  static async logSubmissionEvent(
    action: 'submit' | 'view' | 'update' | 'delete' | 'approve' | 'reject' | 'export',
    submissionId: string | number,
    formId: string | number,
    context: AuditContext
  ): Promise<void> {
    await this.logEvent(`submission:${action}`, {
      ...context,
      resourceType: 'submission',
      resourceId: submissionId,
      details: {
        ...context.details,
        formId
      }
    });
  }

  /**
   * Log security events
   */
  static async logSecurityEvent(
    action: 'access_denied' | 'permission_denied' | 'suspicious_activity' | 'rate_limit_exceeded' | 'invalid_token' | 'session_expired',
    context: AuditContext
  ): Promise<void> {
    await this.logEvent(`security:${action}`, context);
  }

  /**
   * Log system events
   */
  static async logSystemEvent(
    action: 'startup' | 'shutdown' | 'backup' | 'restore' | 'maintenance' | 'error',
    context: AuditContext
  ): Promise<void> {
    await this.logEvent(`system:${action}`, context);
  }

  /**
   * Log data export/import events
   */
  static async logDataEvent(
    action: 'export' | 'import' | 'backup' | 'restore',
    dataType: string,
    context: AuditContext
  ): Promise<void> {
    await this.logEvent(`data:${action}`, {
      ...context,
      resourceType: dataType,
      details: {
        ...context.details,
        dataType
      }
    });
  }

  /**
   * Extract audit context from Express request
   */
  static extractContextFromRequest(req: Request): AuditContext {
    return {
      userId: (req as any).user?.id,
      ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
      userAgent: req.get('user-agent') || 'unknown'
    };
  }

  /**
   * Get audit logs with filtering
   */
  static async getAuditLogs(filters: {
    userId?: number;
    action?: string;
    resourceType?: string;
    resourceId?: string | number;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }): Promise<{
    data: AuditLog[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      return await storage.getAuditLogs(filters);
    } catch (error) {
      console.error('Error getting audit logs:', error);
      throw error;
    }
  }

  /**
   * Get audit logs for a specific user
   */
  static async getUserAuditLogs(
    userId: number,
    page: number = 1,
    limit: number = 50
  ): Promise<{
    data: AuditLog[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return this.getAuditLogs({
      userId,
      page,
      limit
    });
  }

  /**
   * Get audit logs for a specific resource
   */
  static async getResourceAuditLogs(
    resourceType: string,
    resourceId: string | number,
    page: number = 1,
    limit: number = 50
  ): Promise<{
    data: AuditLog[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return this.getAuditLogs({
      resourceType,
      resourceId,
      page,
      limit
    });
  }

  /**
   * Get security-related audit logs
   */
  static async getSecurityAuditLogs(
    startDate?: Date,
    endDate?: Date,
    page: number = 1,
    limit: number = 50
  ): Promise<{
    data: AuditLog[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return this.getAuditLogs({
      action: 'security:%',
      startDate,
      endDate,
      page,
      limit
    });
  }

  /**
   * Get audit statistics
   */
  static async getAuditStatistics(
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalEvents: number;
    eventsByAction: Record<string, number>;
    eventsByUser: Record<string, number>;
    eventsByResourceType: Record<string, number>;
    securityEvents: number;
    topUsers: Array<{ userId: number; count: number }>;
    topActions: Array<{ action: string; count: number }>;
  }> {
    try {
      return await storage.getAuditStatistics(startDate, endDate);
    } catch (error) {
      console.error('Error getting audit statistics:', error);
      throw error;
    }
  }

  /**
   * Clean up old audit logs (retention policy)
   */
  static async cleanupOldLogs(retentionDays: number = 365): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
      
      return await storage.deleteOldAuditLogs(cutoffDate);
    } catch (error) {
      console.error('Error cleaning up old audit logs:', error);
      throw error;
    }
  }

  /**
   * Export audit logs to CSV
   */
  static async exportAuditLogs(
    filters: {
      userId?: number;
      action?: string;
      resourceType?: string;
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<string> {
    try {
      const logs = await this.getAuditLogs({ ...filters, limit: 10000 });
      
      const csvHeader = 'ID,User ID,Action,Resource Type,Resource ID,IP Address,User Agent,Details,Timestamp\n';
      const csvRows = logs.data.map(log => [
        log.id,
        log.userId || '',
        log.action,
        log.resourceType || '',
        log.resourceId || '',
        log.ipAddress || '',
        log.userAgent || '',
        JSON.stringify(log.details || {}),
        log.createdAt.toISOString()
      ].join(',')).join('\n');
      
      return csvHeader + csvRows;
    } catch (error) {
      console.error('Error exporting audit logs:', error);
      throw error;
    }
  }

  /**
   * Middleware to automatically log API requests
   */
  static logApiRequest(action: string) {
    return (req: Request, res: Response, next: Function) => {
      const context = this.extractContextFromRequest(req);
      
      // Log the request
      this.logEvent(`api:${action}`, {
        ...context,
        details: {
          method: req.method,
          path: req.path,
          query: req.query,
          body: req.method !== 'GET' ? req.body : undefined
        }
      });
      
      next();
    };
  }

  /**
   * Log sensitive data access
   */
  static async logSensitiveDataAccess(
    dataType: string,
    dataId: string | number,
    context: AuditContext
  ): Promise<void> {
    await this.logEvent('sensitive_data:access', {
      ...context,
      resourceType: dataType,
      resourceId: dataId,
      details: {
        ...context.details,
        dataType,
        sensitive: true
      }
    });
  }

  /**
   * Log data modification
   */
  static async logDataModification(
    dataType: string,
    dataId: string | number,
    changes: Record<string, any>,
    context: AuditContext
  ): Promise<void> {
    await this.logEvent('data:modify', {
      ...context,
      resourceType: dataType,
      resourceId: dataId,
      details: {
        ...context.details,
        changes,
        dataType
      }
    });
  }
}

export default AuditService;
