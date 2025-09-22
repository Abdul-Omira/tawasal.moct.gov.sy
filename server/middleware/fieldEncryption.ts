/**
 * Field Encryption Middleware
 * Handles automatic field-level encryption and decryption
 * 
 * @author Syrian Ministry of Communications
 * @version 1.0.0
 */

import { Request, Response, NextFunction } from 'express';
import { 
  encryptFields, 
  decryptFields, 
  SENSITIVE_BUSINESS_FIELDS, 
  SENSITIVE_COMMUNICATION_FIELDS,
  fieldEncryptionManager,
  getEncryptionKeyStats
} from '../security/encryption';
import { auditService } from '../services/auditService';

/**
 * Middleware to automatically encrypt sensitive fields before saving
 */
export const encryptSensitiveFields = (fieldsToEncrypt: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.body && typeof req.body === 'object') {
        // Encrypt sensitive fields
        req.body = await encryptFields(req.body, fieldsToEncrypt);
        
        // Log encryption event
        const userId = (req as any).user?.id;
        if (userId) {
          await auditService.logEvent({
            userId,
            action: 'data_encrypted',
            resourceType: 'sensitive_data',
            details: { 
              fields: fieldsToEncrypt,
              endpoint: req.path,
              method: req.method 
            },
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
          });
        }
      }
      next();
    } catch (error) {
      console.error('Field encryption middleware error:', error);
      next(error);
    }
  };
};

/**
 * Middleware to automatically decrypt sensitive fields after loading
 */
export const decryptSensitiveFields = (fieldsToDecrypt: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Decrypt response data if it's an object
      if (res.locals.data && typeof res.locals.data === 'object') {
        res.locals.data = await decryptFields(res.locals.data, fieldsToDecrypt);
      }
      
      // Decrypt array of objects
      if (Array.isArray(res.locals.data)) {
        for (let i = 0; i < res.locals.data.length; i++) {
          if (typeof res.locals.data[i] === 'object') {
            res.locals.data[i] = await decryptFields(res.locals.data[i], fieldsToDecrypt);
          }
        }
      }
      
      next();
    } catch (error) {
      console.error('Field decryption middleware error:', error);
      next(error);
    }
  };
};

/**
 * Middleware for business submission field encryption
 */
export const encryptBusinessFields = encryptSensitiveFields(SENSITIVE_BUSINESS_FIELDS);

/**
 * Middleware for citizen communication field encryption
 */
export const encryptCommunicationFields = encryptSensitiveFields(SENSITIVE_COMMUNICATION_FIELDS);

/**
 * Middleware for business submission field decryption
 */
export const decryptBusinessFields = decryptSensitiveFields(SENSITIVE_BUSINESS_FIELDS);

/**
 * Middleware for citizen communication field decryption
 */
export const decryptCommunicationFields = decryptSensitiveFields(SENSITIVE_COMMUNICATION_FIELDS);

/**
 * Middleware to handle encryption key rotation
 */
export const handleKeyRotation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { action } = req.body;
    
    if (action === 'rotate_keys') {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'غير مصرح - مطلوب تسجيل الدخول',
          error: 'UNAUTHORIZED'
        });
      }

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
        newKeyId
      });
    } else {
      next();
    }
  } catch (error) {
    console.error('Key rotation error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تدوير مفاتيح التشفير',
      error: 'KEY_ROTATION_ERROR'
    });
  }
};

/**
 * Middleware to get encryption key statistics
 */
export const getKeyStatistics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await getEncryptionKeyStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Key statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب إحصائيات مفاتيح التشفير',
      error: 'KEY_STATS_ERROR'
    });
  }
};

/**
 * Middleware to validate encryption key integrity
 */
export const validateKeyIntegrity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { keyId } = req.params;
    const key = await fieldEncryptionManager.getKeyById(keyId);
    
    if (!key) {
      return res.status(404).json({
        success: false,
        message: 'مفتاح التشفير غير موجود',
        error: 'KEY_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: {
        keyId: key.id,
        version: key.version,
        isActive: key.isActive,
        createdAt: key.createdAt,
        isValid: key.isActive
      }
    });
  } catch (error) {
    console.error('Key validation error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء التحقق من مفتاح التشفير',
      error: 'KEY_VALIDATION_ERROR'
    });
  }
};

/**
 * Middleware to handle encrypted field search
 */
export const handleEncryptedSearch = (fieldsToSearch: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { search } = req.query;
      
      if (search && typeof search === 'string') {
        // Create search hash for encrypted fields
        const searchHash = require('crypto').createHash('sha256').update(search).digest('hex');
        
        // Add search hash to query parameters for encrypted field search
        req.query.encryptedSearchHash = searchHash;
        req.query.encryptedSearchFields = fieldsToSearch.join(',');
      }
      
      next();
    } catch (error) {
      console.error('Encrypted search middleware error:', error);
      next(error);
    }
  };
};

/**
 * Middleware to audit encryption operations
 */
export const auditEncryptionOperations = (operation: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id;
      
      if (userId) {
        await auditService.logEvent({
          userId,
          action: `encryption_${operation}`,
          resourceType: 'encryption',
          details: { 
            endpoint: req.path,
            method: req.method,
            operation 
          },
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        });
      }
      
      next();
    } catch (error) {
      console.error('Encryption audit middleware error:', error);
      next(error);
    }
  };
};
