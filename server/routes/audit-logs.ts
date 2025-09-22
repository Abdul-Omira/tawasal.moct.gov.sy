/**
 * Audit Logs API Routes
 * Handles audit log management and retrieval
 * 
 * @author Syrian Ministry of Communications
 * @version 1.0.0
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { auditService } from '../services/auditService';
import { requirePermission } from '../middleware/rbac';
import { PERMISSIONS } from '../middleware/rbac';
import { tenantFilter } from '../middleware/tenant';

const router = Router();

// Validation schemas
const getAuditLogsSchema = z.object({
  userId: z.string().optional(),
  action: z.string().optional(),
  resourceType: z.string().optional(),
  resourceId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('20'),
});

const createAuditLogSchema = z.object({
  userId: z.number().optional(),
  action: z.string().min(1),
  resourceType: z.string().optional(),
  resourceId: z.string().optional(),
  details: z.any().optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
});

// Get audit logs with filtering and pagination
router.get('/', 
  requirePermission(PERMISSIONS.VIEW_AUDIT_LOGS),
  tenantFilter,
  async (req: Request, res: Response) => {
    try {
      const query = getAuditLogsSchema.parse(req.query);
      
      const filters = {
        userId: query.userId ? parseInt(query.userId) : undefined,
        action: query.action,
        resourceType: query.resourceType,
        resourceId: query.resourceId,
        startDate: query.startDate ? new Date(query.startDate) : undefined,
        endDate: query.endDate ? new Date(query.endDate) : undefined,
        page: parseInt(query.page),
        limit: parseInt(query.limit),
      };

      const result = await auditService.getLogs(filters);
      
      res.json({
        success: true,
        data: result.logs,
        total: result.total,
        totalPages: result.totalPages,
        currentPage: filters.page,
        limit: filters.limit,
      });
    } catch (error) {
      console.error('Error getting audit logs:', error);
      res.status(500).json({
        success: false,
        message: 'فشل في جلب سجلات التدقيق',
        error: error instanceof Error ? error.message : 'خطأ غير معروف',
      });
    }
  }
);

// Get audit log by ID
router.get('/:id', 
  requirePermission(PERMISSIONS.VIEW_AUDIT_LOGS),
  tenantFilter,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      const log = await auditService.getLogById(id);
      
      if (!log) {
        return res.status(404).json({
          success: false,
          message: 'سجل التدقيق غير موجود',
        });
      }
      
      res.json({
        success: true,
        data: log,
      });
    } catch (error) {
      console.error('Error getting audit log:', error);
      res.status(500).json({
        success: false,
        message: 'فشل في جلب سجل التدقيق',
        error: error instanceof Error ? error.message : 'خطأ غير معروف',
      });
    }
  }
);

// Create audit log
router.post('/', 
  requirePermission(PERMISSIONS.CREATE_AUDIT_LOGS),
  tenantFilter,
  async (req: Request, res: Response) => {
    try {
      const data = createAuditLogSchema.parse(req.body);
      
      const log = await auditService.logEvent({
        userId: data.userId,
        action: data.action,
        resourceType: data.resourceType,
        resourceId: data.resourceId,
        details: data.details,
        ipAddress: data.ipAddress || req.ip,
        userAgent: data.userAgent || req.get('User-Agent'),
        tenantId: req.tenant?.id,
      });
      
      res.status(201).json({
        success: true,
        data: log,
        message: 'تم إنشاء سجل التدقيق بنجاح',
      });
    } catch (error) {
      console.error('Error creating audit log:', error);
      res.status(500).json({
        success: false,
        message: 'فشل في إنشاء سجل التدقيق',
        error: error instanceof Error ? error.message : 'خطأ غير معروف',
      });
    }
  }
);

// Get audit statistics
router.get('/stats/overview', 
  requirePermission(PERMISSIONS.VIEW_AUDIT_LOGS),
  tenantFilter,
  async (req: Request, res: Response) => {
    try {
      const stats = await auditService.getStatistics({
        tenantId: req.tenant?.id,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      });
      
      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error('Error getting audit statistics:', error);
      res.status(500).json({
        success: false,
        message: 'فشل في جلب إحصائيات التدقيق',
        error: error instanceof Error ? error.message : 'خطأ غير معروف',
      });
    }
  }
);

// Export audit logs
router.get('/export/csv', 
  requirePermission(PERMISSIONS.EXPORT_AUDIT_LOGS),
  tenantFilter,
  async (req: Request, res: Response) => {
    try {
      const query = getAuditLogsSchema.parse(req.query);
      
      const filters = {
        userId: query.userId ? parseInt(query.userId) : undefined,
        action: query.action,
        resourceType: query.resourceType,
        resourceId: query.resourceId,
        startDate: query.startDate ? new Date(query.startDate) : undefined,
        endDate: query.endDate ? new Date(query.endDate) : undefined,
        page: 1,
        limit: 10000, // Export all matching records
      };

      const result = await auditService.getLogs(filters);
      
      // Generate CSV content
      const csvHeader = 'ID,User ID,Action,Resource Type,Resource ID,IP Address,User Agent,Created At,Details\n';
      const csvRows = result.logs.map(log => {
        const details = log.details ? JSON.stringify(log.details).replace(/"/g, '""') : '';
        return `"${log.id}","${log.userId || ''}","${log.action}","${log.resourceType || ''}","${log.resourceId || ''}","${log.ipAddress || ''}","${log.userAgent || ''}","${log.createdAt}","${details}"`;
      }).join('\n');
      
      const csvContent = csvHeader + csvRows;
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csvContent);
    } catch (error) {
      console.error('Error exporting audit logs:', error);
      res.status(500).json({
        success: false,
        message: 'فشل في تصدير سجلات التدقيق',
        error: error instanceof Error ? error.message : 'خطأ غير معروف',
      });
    }
  }
);

// Delete old audit logs
router.delete('/cleanup', 
  requirePermission(PERMISSIONS.DELETE_AUDIT_LOGS),
  tenantFilter,
  async (req: Request, res: Response) => {
    try {
      const { daysToKeep = 90 } = req.body;
      
      const deletedCount = await auditService.deleteOldLogs(daysToKeep);
      
      res.json({
        success: true,
        data: { deletedCount },
        message: `تم حذف ${deletedCount} سجل تدقيق قديم`,
      });
    } catch (error) {
      console.error('Error cleaning up audit logs:', error);
      res.status(500).json({
        success: false,
        message: 'فشل في تنظيف سجلات التدقيق القديمة',
        error: error instanceof Error ? error.message : 'خطأ غير معروف',
      });
    }
  }
);

// Get audit log by ID (for audit service)
router.get('/service/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const log = await auditService.getLogById(id);
    
    if (!log) {
      return res.status(404).json({
        success: false,
        message: 'سجل التدقيق غير موجود',
      });
    }
    
    res.json({
      success: true,
      data: log,
    });
  } catch (error) {
    console.error('Error getting audit log:', error);
    res.status(500).json({
      success: false,
      message: 'فشل في جلب سجل التدقيق',
      error: error instanceof Error ? error.message : 'خطأ غير معروف',
    });
  }
});

export default router;
