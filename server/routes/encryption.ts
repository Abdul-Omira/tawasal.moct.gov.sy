/**
 * Encryption Management API Routes
 * Handles encryption key management and field encryption operations
 * 
 * @author Syrian Ministry of Communications
 * @version 1.0.0
 */

import { Router, Request, Response } from 'express';
import { isAuthenticated } from '../middleware/auth';
import { requirePermission, PERMISSIONS } from '../middleware/rbac';
import { 
  fieldEncryptionManager, 
  getEncryptionKeyStats,
  validateEncryptionKey,
  createDataHash 
} from '../security/encryption';
import { auditService } from '../services/auditService';

const router = Router();

// Get encryption key statistics
router.get('/api/encryption/keys/stats', isAuthenticated, requirePermission(PERMISSIONS.AUDIT_LOGS.READ), async (req: Request, res: Response) => {
  try {
    const stats = await getEncryptionKeyStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting encryption key stats:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب إحصائيات مفاتيح التشفير',
      error: 'ENCRYPTION_STATS_ERROR'
    });
  }
});

// Get all encryption keys
router.get('/api/encryption/keys', isAuthenticated, requirePermission(PERMISSIONS.AUDIT_LOGS.READ), async (req: Request, res: Response) => {
  try {
    const keys = await fieldEncryptionManager.getAllKeys();
    
    // Remove sensitive key data from response
    const safeKeys = keys.map(key => ({
      id: key.id,
      version: key.version,
      createdAt: key.createdAt,
      isActive: key.isActive,
    }));
    
    res.json({
      success: true,
      data: safeKeys
    });
  } catch (error) {
    console.error('Error getting encryption keys:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب مفاتيح التشفير',
      error: 'ENCRYPTION_KEYS_ERROR'
    });
  }
});

// Rotate encryption keys
router.post('/api/encryption/keys/rotate', isAuthenticated, requirePermission(PERMISSIONS.AUDIT_LOGS.EXPORT), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    
    // Rotate encryption keys
    const newKeyId = await fieldEncryptionManager.rotateKeys();
    
    // Log key rotation
    await auditService.logEvent({
      userId,
      action: 'encryption_keys_rotated',
      resourceType: 'encryption',
      details: { newKeyId },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });
    
    res.json({
      success: true,
      message: 'تم تدوير مفاتيح التشفير بنجاح',
      data: { newKeyId }
    });
  } catch (error) {
    console.error('Error rotating encryption keys:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تدوير مفاتيح التشفير',
      error: 'KEY_ROTATION_ERROR'
    });
  }
});

// Validate encryption key
router.get('/api/encryption/keys/:keyId/validate', isAuthenticated, requirePermission(PERMISSIONS.AUDIT_LOGS.READ), async (req: Request, res: Response) => {
  try {
    const { keyId } = req.params;
    const isValid = await validateEncryptionKey(keyId);
    
    res.json({
      success: true,
      data: { keyId, isValid }
    });
  } catch (error) {
    console.error('Error validating encryption key:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء التحقق من مفتاح التشفير',
      error: 'KEY_VALIDATION_ERROR'
    });
  }
});

// Get current encryption key info
router.get('/api/encryption/keys/current', isAuthenticated, requirePermission(PERMISSIONS.AUDIT_LOGS.READ), async (req: Request, res: Response) => {
  try {
    const currentKey = await fieldEncryptionManager.getCurrentKey();
    
    // Remove sensitive key data from response
    const safeKey = {
      id: currentKey.id,
      version: currentKey.version,
      createdAt: currentKey.createdAt,
      isActive: currentKey.isActive,
    };
    
    res.json({
      success: true,
      data: safeKey
    });
  } catch (error) {
    console.error('Error getting current encryption key:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب مفتاح التشفير الحالي',
      error: 'CURRENT_KEY_ERROR'
    });
  }
});

// Create data hash for searching
router.post('/api/encryption/hash', isAuthenticated, requirePermission(PERMISSIONS.AUDIT_LOGS.READ), async (req: Request, res: Response) => {
  try {
    const { data } = req.body;
    
    if (!data) {
      return res.status(400).json({
        success: false,
        message: 'البيانات مطلوبة لإنشاء الهاش',
        error: 'MISSING_DATA'
      });
    }
    
    const hash = createDataHash(data);
    
    res.json({
      success: true,
      data: { hash }
    });
  } catch (error) {
    console.error('Error creating data hash:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء إنشاء هاش البيانات',
      error: 'HASH_CREATION_ERROR'
    });
  }
});

// Test encryption/decryption
router.post('/api/encryption/test', isAuthenticated, requirePermission(PERMISSIONS.AUDIT_LOGS.READ), async (req: Request, res: Response) => {
  try {
    const { data, fieldName = 'test' } = req.body;
    
    if (!data) {
      return res.status(400).json({
        success: false,
        message: 'البيانات مطلوبة لاختبار التشفير',
        error: 'MISSING_DATA'
      });
    }
    
    const { encryptField, decryptField } = await import('../security/encryption');
    
    // Encrypt the data
    const encrypted = await encryptField(fieldName, data);
    
    // Decrypt the data
    const decrypted = await decryptField(encrypted);
    
    // Verify the data matches
    const isMatch = JSON.stringify(data) === JSON.stringify(decrypted);
    
    res.json({
      success: true,
      data: {
        original: data,
        encrypted: encrypted.substring(0, 100) + '...', // Truncate for security
        decrypted: decrypted,
        isMatch: isMatch,
        testPassed: isMatch
      }
    });
  } catch (error) {
    console.error('Error testing encryption:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء اختبار التشفير',
      error: 'ENCRYPTION_TEST_ERROR'
    });
  }
});

// Get encryption health status
router.get('/api/encryption/health', isAuthenticated, requirePermission(PERMISSIONS.AUDIT_LOGS.READ), async (req: Request, res: Response) => {
  try {
    const stats = await getEncryptionKeyStats();
    const currentKey = await fieldEncryptionManager.getCurrentKey();
    
    const health = {
      status: 'healthy',
      currentKey: {
        id: currentKey.id,
        version: currentKey.version,
        isActive: currentKey.isActive,
      },
      statistics: stats,
      timestamp: new Date().toISOString(),
    };
    
    // Check if there are any issues
    if (stats.activeKeys === 0) {
      health.status = 'unhealthy';
    } else if (stats.inactiveKeys > stats.activeKeys) {
      health.status = 'warning';
    }
    
    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    console.error('Error getting encryption health:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب حالة التشفير',
      error: 'ENCRYPTION_HEALTH_ERROR'
    });
  }
});

export default router;
