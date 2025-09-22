import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { storage } from '../database/storage';
import { requirePermission } from '../middleware/rbac';
import { tenantFilter } from '../middleware/tenant';
import { logAuditEvent } from '../services/auditService';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// Get white-label configuration
router.get('/config', tenantFilter, async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const config = await storage.getWhiteLabelConfig(tenantId);
    
    if (!config) {
      // Return default configuration
      const defaultConfig = {
        id: 'default',
        tenantId: tenantId || 'default',
        name: 'Default Configuration',
        description: 'Default white-label configuration',
        theme: {
          primaryColor: '#3b82f6',
          secondaryColor: '#64748b',
          accentColor: '#f59e0b',
          backgroundColor: '#ffffff',
          textColor: '#1f2937',
          borderColor: '#e5e7eb',
          successColor: '#10b981',
          warningColor: '#f59e0b',
          errorColor: '#ef4444',
          infoColor: '#3b82f6',
          fontFamily: 'Inter, sans-serif',
          fontSize: {
            xs: '0.75rem',
            sm: '0.875rem',
            base: '1rem',
            lg: '1.125rem',
            xl: '1.25rem',
            '2xl': '1.5rem',
            '3xl': '1.875rem',
          },
          spacing: {
            xs: '0.25rem',
            sm: '0.5rem',
            base: '1rem',
            lg: '1.5rem',
            xl: '2rem',
            '2xl': '3rem',
            '3xl': '4rem',
          },
          borderRadius: {
            sm: '0.125rem',
            base: '0.25rem',
            lg: '0.5rem',
            xl: '0.75rem',
          },
          shadows: {
            sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
            base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
            lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
            xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
          },
        },
        customDomains: [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      return res.json(defaultConfig);
    }
    
    res.json(config);
  } catch (error) {
    console.error('Error fetching white-label config:', error);
    res.status(500).json({ error: 'Failed to fetch white-label configuration' });
  }
});

// Update white-label configuration
router.put('/config', tenantFilter, requirePermission('white_label:update'), async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const updates = req.body;
    
    const config = await storage.updateWhiteLabelConfig(updates, tenantId);
    
    await logAuditEvent({
      userId: req.user?.id,
      action: 'white_label_config_updated',
      resourceType: 'white_label_config',
      resourceId: config?.id,
      details: { updates },
      tenantId,
    });
    
    res.json(config);
  } catch (error) {
    console.error('Error updating white-label config:', error);
    res.status(500).json({ error: 'Failed to update white-label configuration' });
  }
});

// Get theme templates
router.get('/templates', async (req, res) => {
  try {
    const templates = await storage.getWhiteLabelTemplates();
    res.json(templates);
  } catch (error) {
    console.error('Error fetching theme templates:', error);
    res.status(500).json({ error: 'Failed to fetch theme templates' });
  }
});

// Apply theme template
router.post('/templates/:templateId/apply', tenantFilter, requirePermission('white_label:update'), async (req, res) => {
  try {
    const { templateId } = req.params;
    const { tenantId } = req.body;
    
    const config = await storage.applyWhiteLabelTemplate(templateId, tenantId);
    
    await logAuditEvent({
      userId: req.user?.id,
      action: 'theme_template_applied',
      resourceType: 'white_label_config',
      resourceId: config?.id,
      details: { templateId },
      tenantId,
    });
    
    res.json(config);
  } catch (error) {
    console.error('Error applying theme template:', error);
    res.status(500).json({ error: 'Failed to apply theme template' });
  }
});

// Upload logo
router.post('/upload/logo', tenantFilter, requirePermission('white_label:update'), upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const tenantId = req.tenantId;
    const file = req.file;
    
    // Generate unique filename
    const ext = path.extname(file.originalname);
    const filename = `logo_${Date.now()}${ext}`;
    const filepath = path.join('uploads', filename);
    
    // Move file to permanent location
    await fs.rename(file.path, filepath);
    
    // Generate URL
    const baseUrl = process.env.BASE_URL || 'http://localhost:3001';
    const url = `${baseUrl}/uploads/${filename}`;
    
    const result = {
      url,
      alt: req.body.alt || 'Logo',
      width: req.body.width ? parseInt(req.body.width) : undefined,
      height: req.body.height ? parseInt(req.body.height) : undefined,
    };
    
    await logAuditEvent({
      userId: req.user?.id,
      action: 'logo_uploaded',
      resourceType: 'white_label_config',
      details: { filename, url },
      tenantId,
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error uploading logo:', error);
    res.status(500).json({ error: 'Failed to upload logo' });
  }
});

// Upload favicon
router.post('/upload/favicon', tenantFilter, requirePermission('white_label:update'), upload.single('favicon'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const tenantId = req.tenantId;
    const file = req.file;
    
    // Generate unique filename
    const ext = path.extname(file.originalname);
    const filename = `favicon_${Date.now()}${ext}`;
    const filepath = path.join('uploads', filename);
    
    // Move file to permanent location
    await fs.rename(file.path, filepath);
    
    // Generate URL
    const baseUrl = process.env.BASE_URL || 'http://localhost:3001';
    const url = `${baseUrl}/uploads/${filename}`;
    
    const result = {
      url,
      type: file.mimetype,
    };
    
    await logAuditEvent({
      userId: req.user?.id,
      action: 'favicon_uploaded',
      resourceType: 'white_label_config',
      details: { filename, url },
      tenantId,
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error uploading favicon:', error);
    res.status(500).json({ error: 'Failed to upload favicon' });
  }
});

// Get custom domains
router.get('/domains', tenantFilter, async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const domains = await storage.getWhiteLabelDomains(tenantId);
    res.json(domains);
  } catch (error) {
    console.error('Error fetching custom domains:', error);
    res.status(500).json({ error: 'Failed to fetch custom domains' });
  }
});

// Add custom domain
router.post('/domains', tenantFilter, requirePermission('white_label:update'), async (req, res) => {
  try {
    const { domain } = req.body;
    const tenantId = req.tenantId;
    
    if (!domain) {
      return res.status(400).json({ error: 'Domain is required' });
    }
    
    const newDomain = await storage.addWhiteLabelDomain(domain, tenantId);
    
    await logAuditEvent({
      userId: req.user?.id,
      action: 'custom_domain_added',
      resourceType: 'white_label_domain',
      resourceId: newDomain?.id,
      details: { domain },
      tenantId,
    });
    
    res.json(newDomain);
  } catch (error) {
    console.error('Error adding custom domain:', error);
    res.status(500).json({ error: 'Failed to add custom domain' });
  }
});

// Verify custom domain
router.post('/domains/:domainId/verify', requirePermission('white_label:update'), async (req, res) => {
  try {
    const { domainId } = req.params;
    
    const result = await storage.verifyWhiteLabelDomain(domainId);
    
    await logAuditEvent({
      userId: req.user?.id,
      action: 'custom_domain_verified',
      resourceType: 'white_label_domain',
      resourceId: domainId,
      details: { verified: result.verified },
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error verifying custom domain:', error);
    res.status(500).json({ error: 'Failed to verify custom domain' });
  }
});

// Delete custom domain
router.delete('/domains/:domainId', requirePermission('white_label:delete'), async (req, res) => {
  try {
    const { domainId } = req.params;
    
    const success = await storage.deleteWhiteLabelDomain(domainId);
    
    if (success) {
      await logAuditEvent({
        userId: req.user?.id,
        action: 'custom_domain_deleted',
        resourceType: 'white_label_domain',
        resourceId: domainId,
      });
    }
    
    res.json({ success });
  } catch (error) {
    console.error('Error deleting custom domain:', error);
    res.status(500).json({ error: 'Failed to delete custom domain' });
  }
});

// Get custom CSS
router.get('/css', tenantFilter, async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const css = await storage.getWhiteLabelCustomCSS(tenantId);
    res.set('Content-Type', 'text/css');
    res.send(css);
  } catch (error) {
    console.error('Error fetching custom CSS:', error);
    res.status(500).json({ error: 'Failed to fetch custom CSS' });
  }
});

// Update custom CSS
router.put('/css', tenantFilter, requirePermission('white_label:update'), async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const css = req.body;
    
    await storage.updateWhiteLabelCustomCSS(css, tenantId);
    
    await logAuditEvent({
      userId: req.user?.id,
      action: 'custom_css_updated',
      resourceType: 'white_label_config',
      details: { cssLength: css.length },
      tenantId,
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating custom CSS:', error);
    res.status(500).json({ error: 'Failed to update custom CSS' });
  }
});

// Validate custom CSS
router.post('/css/validate', async (req, res) => {
  try {
    const css = req.body;
    
    // Basic CSS validation (in a real implementation, you'd use a proper CSS parser)
    const errors: string[] = [];
    
    // Check for basic syntax issues
    const openBraces = (css.match(/\{/g) || []).length;
    const closeBraces = (css.match(/\}/g) || []).length;
    
    if (openBraces !== closeBraces) {
      errors.push('Mismatched braces');
    }
    
    // Check for common issues
    if (css.includes('@import') && !css.includes('url(')) {
      errors.push('Invalid @import syntax');
    }
    
    res.json({
      valid: errors.length === 0,
      errors,
    });
  } catch (error) {
    console.error('Error validating CSS:', error);
    res.status(500).json({ error: 'Failed to validate CSS' });
  }
});

// Get white-label stats
router.get('/stats', tenantFilter, async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const stats = await storage.getWhiteLabelStats(tenantId);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching white-label stats:', error);
    res.status(500).json({ error: 'Failed to fetch white-label stats' });
  }
});

// Export white-label configuration
router.get('/export', tenantFilter, async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const config = await storage.exportWhiteLabelConfig(tenantId);
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="white-label-config.json"');
    res.json(config);
  } catch (error) {
    console.error('Error exporting white-label config:', error);
    res.status(500).json({ error: 'Failed to export white-label configuration' });
  }
});

// Import white-label configuration
router.post('/import', tenantFilter, requirePermission('white_label:update'), async (req, res) => {
  try {
    const { config } = req.body;
    const tenantId = req.tenantId;
    
    const success = await storage.importWhiteLabelConfig(config, tenantId);
    
    if (success) {
      await logAuditEvent({
        userId: req.user?.id,
        action: 'white_label_config_imported',
        resourceType: 'white_label_config',
        details: { configId: config.id },
        tenantId,
      });
    }
    
    res.json({ success });
  } catch (error) {
    console.error('Error importing white-label config:', error);
    res.status(500).json({ error: 'Failed to import white-label configuration' });
  }
});

export default router;
