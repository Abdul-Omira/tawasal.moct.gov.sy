/**
 * Template Management API Routes
 * Handles template CRUD operations and management
 */

import express from 'express';
import { z } from 'zod';
import { requirePermission } from '../middleware/rbac';
import { tenantFilter } from '../middleware/tenant';
import { logAuditEvent } from '../middleware/auditLogging';
import { storage } from '../database/storage';

const router = express.Router();

// Validation schemas
const createTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required'),
  description: z.string().optional(),
  category: z.enum(['survey', 'application', 'feedback', 'registration', 'contact']),
  templateData: z.object({
    form: z.object({
      title: z.string(),
      description: z.string().optional(),
      settings: z.object({
        theme: z.object({
          primaryColor: z.string(),
          secondaryColor: z.string(),
          backgroundColor: z.string(),
          textColor: z.string(),
          fontFamily: z.string()
        }).optional(),
        behavior: z.object({
          showProgress: z.boolean(),
          allowSaveProgress: z.boolean(),
          requireLogin: z.boolean(),
          allowAnonymous: z.boolean()
        }).optional(),
        notifications: z.object({
          emailOnSubmit: z.boolean(),
          emailTemplate: z.string().optional(),
          webhookUrl: z.string().optional()
        }).optional()
      }),
      status: z.enum(['draft', 'published', 'archived']).default('draft')
    }),
    components: z.array(z.object({
      id: z.string(),
      type: z.string(),
      config: z.any(),
      validation: z.any(),
      orderIndex: z.number(),
      isVisible: z.boolean(),
      isRequired: z.boolean()
    }))
  }),
  isPublic: z.boolean().default(false)
});

const updateTemplateSchema = createTemplateSchema.partial();

const searchTemplatesSchema = z.object({
  category: z.enum(['survey', 'application', 'feedback', 'registration', 'contact']).optional(),
  isPublic: z.boolean().optional(),
  searchQuery: z.string().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20)
});

// Get all templates with filtering and pagination
router.get('/', 
  tenantFilter,
  requirePermission('MANAGE_FORM_TEMPLATES'),
  async (req, res) => {
    try {
      const { category, isPublic, searchQuery, page = 1, limit = 20 } = searchTemplatesSchema.parse(req.query);
      const tenantId = req.tenant?.id;

      const templates = await storage.getTemplates({
        category,
        isPublic,
        searchQuery,
        tenantId,
        page,
        limit
      });

      res.json({
        success: true,
        data: templates,
        pagination: {
          page,
          limit,
          total: templates.length
        }
      });
    } catch (error) {
      console.error('Error fetching templates:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch templates'
      });
    }
  }
);

// Get template by ID
router.get('/:id',
  tenantFilter,
  requirePermission('MANAGE_FORM_TEMPLATES'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const tenantId = req.tenant?.id;

      const template = await storage.getTemplateById(id, tenantId);
      if (!template) {
        return res.status(404).json({
          success: false,
          error: 'Template not found'
        });
      }

      res.json({
        success: true,
        data: template
      });
    } catch (error) {
      console.error('Error fetching template:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch template'
      });
    }
  }
);

// Create new template
router.post('/',
  tenantFilter,
  requirePermission('MANAGE_FORM_TEMPLATES'),
  async (req, res) => {
    try {
      const templateData = createTemplateSchema.parse(req.body);
      const tenantId = req.tenant?.id;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }

      const template = await storage.createTemplate({
        ...templateData,
        createdBy: userId,
        tenantId
      });

      // Log audit event
      logAuditEvent({
        userId,
        action: 'CREATE_TEMPLATE',
        resourceType: 'template',
        resourceId: template.id,
        details: {
          templateName: template.name,
          category: template.category,
          isPublic: template.isPublic
        },
        tenantId
      });

      res.status(201).json({
        success: true,
        data: template
      });
    } catch (error) {
      console.error('Error creating template:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors
        });
      }
      res.status(500).json({
        success: false,
        error: 'Failed to create template'
      });
    }
  }
);

// Update template
router.put('/:id',
  tenantFilter,
  requirePermission('MANAGE_FORM_TEMPLATES'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = updateTemplateSchema.parse(req.body);
      const tenantId = req.tenant?.id;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }

      const existingTemplate = await storage.getTemplateById(id, tenantId);
      if (!existingTemplate) {
        return res.status(404).json({
          success: false,
          error: 'Template not found'
        });
      }

      const template = await storage.updateTemplate(id, {
        ...updateData,
        updatedAt: new Date()
      });

      // Log audit event
      logAuditEvent({
        userId,
        action: 'UPDATE_TEMPLATE',
        resourceType: 'template',
        resourceId: id,
        details: {
          templateName: template.name,
          changes: Object.keys(updateData)
        },
        tenantId
      });

      res.json({
        success: true,
        data: template
      });
    } catch (error) {
      console.error('Error updating template:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors
        });
      }
      res.status(500).json({
        success: false,
        error: 'Failed to update template'
      });
    }
  }
);

// Delete template
router.delete('/:id',
  tenantFilter,
  requirePermission('MANAGE_FORM_TEMPLATES'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const tenantId = req.tenant?.id;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }

      const existingTemplate = await storage.getTemplateById(id, tenantId);
      if (!existingTemplate) {
        return res.status(404).json({
          success: false,
          error: 'Template not found'
        });
      }

      await storage.deleteTemplate(id, tenantId);

      // Log audit event
      logAuditEvent({
        userId,
        action: 'DELETE_TEMPLATE',
        resourceType: 'template',
        resourceId: id,
        details: {
          templateName: existingTemplate.name
        },
        tenantId
      });

      res.json({
        success: true,
        message: 'Template deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting template:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete template'
      });
    }
  }
);

// Duplicate template
router.post('/:id/duplicate',
  tenantFilter,
  requirePermission('MANAGE_FORM_TEMPLATES'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { name } = req.body;
      const tenantId = req.tenant?.id;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }

      const originalTemplate = await storage.getTemplateById(id, tenantId);
      if (!originalTemplate) {
        return res.status(404).json({
          success: false,
          error: 'Template not found'
        });
      }

      const duplicatedTemplate = await storage.duplicateTemplate(id, {
        name: name || `${originalTemplate.name} (نسخة)`,
        createdBy: userId,
        tenantId
      });

      // Log audit event
      logAuditEvent({
        userId,
        action: 'DUPLICATE_TEMPLATE',
        resourceType: 'template',
        resourceId: duplicatedTemplate.id,
        details: {
          originalTemplateId: id,
          templateName: duplicatedTemplate.name
        },
        tenantId
      });

      res.status(201).json({
        success: true,
        data: duplicatedTemplate
      });
    } catch (error) {
      console.error('Error duplicating template:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to duplicate template'
      });
    }
  }
);

// Export template
router.get('/:id/export',
  tenantFilter,
  requirePermission('MANAGE_FORM_TEMPLATES'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const tenantId = req.tenant?.id;

      const template = await storage.getTemplateById(id, tenantId);
      if (!template) {
        return res.status(404).json({
          success: false,
          error: 'Template not found'
        });
      }

      const exportData = JSON.stringify(template, null, 2);
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${template.name}.json"`);
      res.send(exportData);
    } catch (error) {
      console.error('Error exporting template:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to export template'
      });
    }
  }
);

// Import template
router.post('/import',
  tenantFilter,
  requirePermission('MANAGE_FORM_TEMPLATES'),
  async (req, res) => {
    try {
      const { templateData, name } = req.body;
      const tenantId = req.tenant?.id;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }

      if (!templateData) {
        return res.status(400).json({
          success: false,
          error: 'Template data is required'
        });
      }

      const importedTemplate = await storage.importTemplate(templateData, {
        name: name || 'Imported Template',
        createdBy: userId,
        tenantId
      });

      // Log audit event
      logAuditEvent({
        userId,
        action: 'IMPORT_TEMPLATE',
        resourceType: 'template',
        resourceId: importedTemplate.id,
        details: {
          templateName: importedTemplate.name
        },
        tenantId
      });

      res.status(201).json({
        success: true,
        data: importedTemplate
      });
    } catch (error) {
      console.error('Error importing template:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to import template'
      });
    }
  }
);

// Get template statistics
router.get('/stats/overview',
  tenantFilter,
  requirePermission('MANAGE_FORM_TEMPLATES'),
  async (req, res) => {
    try {
      const tenantId = req.tenant?.id;
      const stats = await storage.getTemplateStats(tenantId);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error fetching template stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch template statistics'
      });
    }
  }
);

// Track template usage
router.post('/:id/usage',
  tenantFilter,
  async (req, res) => {
    try {
      const { id } = req.params;
      const tenantId = req.tenant?.id;

      await storage.trackTemplateUsage(id, tenantId);

      res.json({
        success: true,
        message: 'Template usage tracked'
      });
    } catch (error) {
      console.error('Error tracking template usage:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to track template usage'
      });
    }
  }
);

export default router;
