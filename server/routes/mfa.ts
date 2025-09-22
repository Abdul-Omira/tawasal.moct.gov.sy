/**
 * Multi-Factor Authentication API Routes
 * Handles MFA setup, verification, and management
 * 
 * @author Syrian Ministry of Communications
 * @version 1.0.0
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { isAuthenticated } from '../middleware/auth';
import MFAService from '../services/mfaService';
import AuditService from '../services/auditService';

const router = Router();

// MFA setup schema
const MFASetupSchema = z.object({
  userEmail: z.string().email('البريد الإلكتروني غير صالح')
});

// MFA verification schema
const MFAVerificationSchema = z.object({
  token: z.string().min(6, 'رمز التحقق يجب أن يكون 6 أرقام').max(6, 'رمز التحقق يجب أن يكون 6 أرقام')
});

// MFA disable schema
const MFADisableSchema = z.object({
  password: z.string().min(1, 'كلمة المرور مطلوبة')
});

// Setup MFA for a user
router.post('/api/auth/mfa/setup', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { userEmail } = MFASetupSchema.parse(req.body);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'المستخدم غير مسجل الدخول',
        error: 'UNAUTHORIZED'
      });
    }

    // Check if MFA is already enabled
    const mfaStatus = await MFAService.getMFAStatus(userId);
    if (mfaStatus.enabled) {
      return res.status(400).json({
        success: false,
        message: 'المصادقة الثنائية مفعلة بالفعل',
        error: 'MFA_ALREADY_ENABLED'
      });
    }

    // Setup MFA
    const setupResult = await MFAService.setupMFA(userId, userEmail);

    // Log the MFA setup attempt
    await AuditService.logAuthEvent('mfa_setup_attempt', {
      userId,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      details: { userEmail }
    });

    res.json({
      success: true,
      data: setupResult,
      message: 'تم إعداد المصادقة الثنائية بنجاح'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'بيانات غير صحيحة',
        errors: error.errors
      });
    }

    console.error('Error setting up MFA:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء إعداد المصادقة الثنائية',
      error: 'MFA_SETUP_ERROR'
    });
  }
});

// Verify and enable MFA
router.post('/api/auth/mfa/verify', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { token } = MFAVerificationSchema.parse(req.body);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'المستخدم غير مسجل الدخول',
        error: 'UNAUTHORIZED'
      });
    }

    // Verify MFA token
    const verificationResult = await MFAService.verifyAndEnableMFA(userId, token);

    if (verificationResult.valid) {
      // Log successful MFA verification
      await AuditService.logAuthEvent('mfa_enabled', {
        userId,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        details: { token: token.substring(0, 2) + '****' }
      });

      res.json({
        success: true,
        message: 'تم تفعيل المصادقة الثنائية بنجاح'
      });
    } else {
      // Log failed MFA verification
      await AuditService.logAuthEvent('mfa_verification_failed', {
        userId,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        details: { token: token.substring(0, 2) + '****' }
      });

      res.status(400).json({
        success: false,
        message: 'رمز التحقق غير صحيح',
        error: 'INVALID_MFA_TOKEN'
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'بيانات غير صحيحة',
        errors: error.errors
      });
    }

    console.error('Error verifying MFA:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء التحقق من المصادقة الثنائية',
      error: 'MFA_VERIFICATION_ERROR'
    });
  }
});

// Disable MFA
router.post('/api/auth/mfa/disable', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { password } = MFADisableSchema.parse(req.body);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'المستخدم غير مسجل الدخول',
        error: 'UNAUTHORIZED'
      });
    }

    // Disable MFA
    const disabled = await MFAService.disableMFA(userId, password);

    if (disabled) {
      // Log MFA disable
      await AuditService.logAuthEvent('mfa_disabled', {
        userId,
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      });

      res.json({
        success: true,
        message: 'تم إلغاء تفعيل المصادقة الثنائية بنجاح'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'كلمة المرور غير صحيحة',
        error: 'INVALID_PASSWORD'
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'بيانات غير صحيحة',
        errors: error.errors
      });
    }

    console.error('Error disabling MFA:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء إلغاء تفعيل المصادقة الثنائية',
      error: 'MFA_DISABLE_ERROR'
    });
  }
});

// Get MFA status
router.get('/api/auth/mfa/status', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'المستخدم غير مسجل الدخول',
        error: 'UNAUTHORIZED'
      });
    }

    const status = await MFAService.getMFAStatus(userId);

    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Error getting MFA status:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب حالة المصادقة الثنائية',
      error: 'MFA_STATUS_ERROR'
    });
  }
});

// Verify MFA token during login
router.post('/api/auth/mfa/validate', async (req: Request, res: Response) => {
  try {
    const { userId, token } = req.body;

    if (!userId || !token) {
      return res.status(400).json({
        success: false,
        message: 'معرف المستخدم ورمز التحقق مطلوبان',
        error: 'MISSING_PARAMETERS'
      });
    }

    // Validate MFA token
    const validationResult = await MFAService.validateMFAToken(userId, token);

    if (validationResult.valid) {
      // Log successful MFA validation
      await AuditService.logAuthEvent('mfa_validation_success', {
        userId,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        details: { 
          token: token.substring(0, 2) + '****',
          backupCodeUsed: validationResult.backupCodeUsed
        }
      });

      res.json({
        success: true,
        message: 'تم التحقق من المصادقة الثنائية بنجاح',
        data: {
          valid: true,
          backupCodeUsed: validationResult.backupCodeUsed
        }
      });
    } else {
      // Log failed MFA validation
      await AuditService.logAuthEvent('mfa_validation_failed', {
        userId,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        details: { token: token.substring(0, 2) + '****' }
      });

      res.status(400).json({
        success: false,
        message: 'رمز التحقق غير صحيح',
        error: 'INVALID_MFA_TOKEN'
      });
    }
  } catch (error) {
    console.error('Error validating MFA token:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء التحقق من المصادقة الثنائية',
      error: 'MFA_VALIDATION_ERROR'
    });
  }
});

// Generate new backup codes
router.post('/api/auth/mfa/backup-codes', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'المستخدم غير مسجل الدخول',
        error: 'UNAUTHORIZED'
      });
    }

    // Check if MFA is enabled
    const mfaStatus = await MFAService.getMFAStatus(userId);
    if (!mfaStatus.enabled) {
      return res.status(400).json({
        success: false,
        message: 'المصادقة الثنائية غير مفعلة',
        error: 'MFA_NOT_ENABLED'
      });
    }

    // Generate new backup codes
    const backupCodes = MFAService.generateBackupCodes();

    // Update user with new backup codes
    await storage.updateUserMFA(userId.toString(), {
      backupCodes
    });

    // Log backup codes generation
    await AuditService.logAuthEvent('mfa_backup_codes_generated', {
      userId,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json({
      success: true,
      data: { backupCodes },
      message: 'تم إنشاء رموز النسخ الاحتياطي الجديدة'
    });
  } catch (error) {
    console.error('Error generating backup codes:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء إنشاء رموز النسخ الاحتياطي',
      error: 'BACKUP_CODES_ERROR'
    });
  }
});

export default router;
