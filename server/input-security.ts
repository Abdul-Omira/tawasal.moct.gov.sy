/**
 * Syrian Ministry of Communication - Military-Grade Input Security
 * Comprehensive Input Validation and Sanitization System
 * 
 * @author Security Team - Emergency Response
 * @version 3.0.0 - Maximum Security Implementation
 */

import { z } from 'zod';

/**
 * Dangerous patterns that should be blocked immediately
 */
const DANGEROUS_PATTERNS = [
  // Script injection patterns
  /<script[^>]*>.*?<\/script>/gi,
  /<iframe[^>]*>.*?<\/iframe>/gi,
  /<object[^>]*>.*?<\/object>/gi,
  /<embed[^>]*>.*?<\/embed>/gi,
  /<applet[^>]*>.*?<\/applet>/gi,
  /<meta[^>]*>/gi,
  /<link[^>]*>/gi,
  /<style[^>]*>.*?<\/style>/gi,
  
  // JavaScript execution patterns
  /javascript:/gi,
  /vbscript:/gi,
  /data:text\/html/gi,
  /data:application\/javascript/gi,
  
  // Event handler injection
  /\bon\w+\s*=/gi,
  /onload\s*=/gi,
  /onerror\s*=/gi,
  /onclick\s*=/gi,
  /onmouseover\s*=/gi,
  /onfocus\s*=/gi,
  /onblur\s*=/gi,
  /onchange\s*=/gi,
  /onsubmit\s*=/gi,
  
  // Expression and function calls
  /expression\s*\(/gi,
  /eval\s*\(/gi,
  /setTimeout\s*\(/gi,
  /setInterval\s*\(/gi,
  /Function\s*\(/gi,
  
  // DOM manipulation
  /document\./gi,
  /window\./gi,
  /location\./gi,
  /alert\s*\(/gi,
  /confirm\s*\(/gi,
  /prompt\s*\(/gi,
  
  // SQL injection patterns
  /union\s+select/gi,
  /drop\s+table/gi,
  /delete\s+from/gi,
  /insert\s+into/gi,
  /update\s+set/gi,
  /exec\s*\(/gi,
  /xp_cmdshell/gi,
  
  // LDAP injection
  /\|\||\&\&/g,
  /\(\|\(/g,
  /\)\|\)/g,
  
  // Command injection
  /`[^`]*`/g,
  /\$\([^)]*\)/g,
  /;\s*(rm|del|format|cat|ls|dir|type|copy|move|mkdir|rmdir)/gi,
  
  // Path traversal
  /\.\.\//g,
  /\.\.\\\\/g,
  /\/etc\/passwd/gi,
  /\/windows\/system32/gi,
  
  // File inclusion
  /include\s*\(/gi,
  /require\s*\(/gi,
  /file_get_contents\s*\(/gi,
  
  // Template injection
  /\{\{.*\}\}/g,
  /\$\{.*\}/g,
  /<\?.*\?>/g,
  /<%.*%>/g
];

/**
 * Whitelist of allowed characters for different field types
 */
const ALLOWED_CHARACTERS = {
  name: /^[a-zA-Zأ-ي\u0621-\u064A\u0660-\u0669\s\-'\.]+$/,
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  phone: /^[\+]?[0-9\s\-\(\)]{7,15}$/,
  alphanumeric: /^[a-zA-Z0-9أ-ي\u0621-\u064A\u0660-\u0669\s\-_]+$/,
  text: /^[a-zA-Z0-9أ-ي\u0621-\u064A\u0660-\u0669\s\-_\.,;:!?\(\)\[\]'"]+$/,
  url: /^(https?:\/\/[^\s]+|\/[^\s]*)$/,
  filename: /^[a-zA-Z0-9\u0621-\u064A\u0660-\u0669\s\-_\.]+$/
};

/**
 * Maximum length limits for different field types
 */
const MAX_LENGTHS = {
  name: 100,
  email: 254,
  phone: 20,
  text: 5000,
  subject: 200,
  message: 5000,
  url: 2048,
  filename: 255,
  general: 1000
};

/**
 * Security risk assessment for input content
 */
interface SecurityAssessment {
  isSecure: boolean;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  threats: string[];
  sanitizedValue: string;
}

/**
 * Detect dangerous patterns in input
 */
function detectDangerousPatterns(input: string): string[] {
  const threats: string[] = [];
  
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(input)) {
      threats.push(`Dangerous pattern detected: ${pattern.source}`);
    }
  }
  
  return threats;
}

/**
 * Advanced input sanitization
 */
export function sanitizeInput(input: string, fieldType: 'name' | 'email' | 'phone' | 'text' | 'url' | 'filename' = 'text'): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  let sanitized = input;
  
  // 1. Trim whitespace
  sanitized = sanitized.trim();
  
  // 2. Remove null bytes and control characters
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  // 3. HTML encode dangerous characters (skip for URLs and filenames)
  if (fieldType !== 'url' && fieldType !== 'filename') {
    sanitized = sanitized
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  } else {
    // For URLs and filenames, only encode the most dangerous characters
    sanitized = sanitized
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }
  
  // 4. Additional HTML sanitization (skip for URLs and filenames)
  if (fieldType !== 'url' && fieldType !== 'filename') {
    sanitized = sanitized.replace(/[<>]/g, '');
  }
  
  // 5. Field-specific sanitization
  switch (fieldType) {
    case 'email':
      sanitized = sanitized.toLowerCase().trim();
      break;
    case 'phone':
      sanitized = sanitized.replace(/[^\d\+\-\(\)\s]/g, '');
      break;
    case 'name':
      sanitized = sanitized.replace(/[^\w\s\u0621-\u064A\u0660-\u0669\-'\.]/g, '');
      break;
    case 'url':
      // For URLs, preserve the structure but remove dangerous patterns
      sanitized = sanitized.replace(/<script[^>]*>.*?<\/script>/gi, '');
      sanitized = sanitized.replace(/javascript:/gi, '');
      break;
    case 'filename':
      // For filenames, allow alphanumeric, dots, dashes, and underscores
      sanitized = sanitized.replace(/[^a-zA-Z0-9\-_\.]/g, '');
      break;
  }
  
  // 6. Limit length
  const maxLength = MAX_LENGTHS[fieldType] || MAX_LENGTHS.general;
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  return sanitized;
}

/**
 * Comprehensive security assessment of input
 */
export function assessInputSecurity(input: string, fieldType: 'name' | 'email' | 'phone' | 'text' | 'url' | 'filename' = 'text'): SecurityAssessment {
  const threats = detectDangerousPatterns(input);
  const sanitizedValue = sanitizeInput(input, fieldType);
  
  let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
  
  // Determine risk level
  if (threats.length > 0) {
    const hasScriptPatterns = threats.some(t => t.includes('script') || t.includes('javascript'));
    const hasSqlPatterns = threats.some(t => t.includes('select') || t.includes('drop'));
    const hasEventHandlers = threats.some(t => t.includes('on'));
    
    if (hasScriptPatterns || hasSqlPatterns) {
      riskLevel = 'critical';
    } else if (hasEventHandlers || threats.length > 3) {
      riskLevel = 'high';
    } else if (threats.length > 1) {
      riskLevel = 'medium';
    }
  }
  
  // Check input length
  if (input.length > MAX_LENGTHS[fieldType] * 2) {
    threats.push('Excessive input length detected');
    riskLevel = riskLevel === 'low' ? 'medium' : riskLevel;
  }
  
  // Check for suspicious characters
  if (fieldType !== 'text' && !ALLOWED_CHARACTERS[fieldType]?.test(input)) {
    threats.push(`Invalid characters for ${fieldType} field`);
    riskLevel = riskLevel === 'low' ? 'medium' : riskLevel;
  }
  
  return {
    isSecure: threats.length === 0,
    riskLevel,
    threats,
    sanitizedValue
  };
}

/**
 * Enhanced Zod schema for citizen communications with security validation
 */
export const SecureCitizenCommunicationSchema = z.object({
  fullName: z.string()
    .min(1, { message: "الاسم الكامل مطلوب" })
    .max(MAX_LENGTHS.name, { message: `الاسم لا يمكن أن يتجاوز ${MAX_LENGTHS.name} حرف` })
    .refine((val) => {
      const assessment = assessInputSecurity(val, 'name');
      return assessment.riskLevel !== 'critical';
    }, { message: "الاسم يحتوي على محتوى خطير" })
    .transform((val) => sanitizeInput(val, 'name')),
    
  email: z.string()
    .email({ message: "البريد الإلكتروني غير صالح" })
    .max(MAX_LENGTHS.email, { message: `البريد الإلكتروني لا يمكن أن يتجاوز ${MAX_LENGTHS.email} حرف` })
    .refine((val) => {
      const assessment = assessInputSecurity(val, 'email');
      return assessment.riskLevel !== 'critical';
    }, { message: "البريد الإلكتروني يحتوي على محتوى خطير" })
         .refine((val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), { message: "تنسيق البريد الإلكتروني غير صحيح" })
    .transform((val) => sanitizeInput(val, 'email')),
    
  phone: z.string()
    .optional()
    .refine((val) => {
      if (!val) return true;
      const assessment = assessInputSecurity(val, 'phone');
      return assessment.riskLevel !== 'critical' && ALLOWED_CHARACTERS.phone.test(val);
    }, { message: "رقم الهاتف يحتوي على أحرف غير صالحة" })
    .transform((val) => val ? sanitizeInput(val, 'phone') : undefined),
    
  governorate: z.string()
    .optional()
    .refine((val) => {
      if (!val) return true;
      const assessment = assessInputSecurity(val, 'name');
      return assessment.riskLevel !== 'critical';
    }, { message: "المحافظة تحتوي على محتوى خطير" })
    .transform((val) => val ? sanitizeInput(val, 'name') : undefined),
    
  communicationType: z.string()
    .min(1, { message: "نوع التواصل مطلوب" })
    .refine((val) => {
      const allowedTypes = [
        // Frontend form values - CitizenCommunicationForm
        'اقتراح', 'شكوى', 'استفسار', 'مشروع', 'طلب', 'أخرى',
        // Frontend form values - MinisterCommunicationForm  
        'رأي', 'تعاون',
        // Database analysis values (already in use)
        'شكوي', 'اقتراحات', 'استفسارات', 'طلبات', 'آراء',
        // Additional common variations
        'مشكلة', 'ملاحظة', 'تساؤل', 'عام', 'اخرى', 'مشاريع',
        // English equivalents
        'complaint', 'inquiry', 'suggestion', 'request', 'other', 'general', 'opinion', 'cooperation', 'project'
      ];
      
      return allowedTypes.includes(val);
    }, { message: "نوع التواصل غير صالح" }),
    
  subject: z.string()
    .min(1, { message: "الموضوع مطلوب" })
    .max(MAX_LENGTHS.subject, { message: `الموضوع لا يمكن أن يتجاوز ${MAX_LENGTHS.subject} حرف` })
    .refine((val) => {
      const assessment = assessInputSecurity(val, 'text');
      return assessment.riskLevel !== 'critical';
    }, { message: "الموضوع يحتوي على محتوى خطير" })
    .transform((val) => sanitizeInput(val, 'text')),
    
  message: z.string()
    .min(10, { message: "الرسالة يجب أن تكون 10 أحرف على الأقل" })
    .max(MAX_LENGTHS.message, { message: `الرسالة لا يمكن أن تتجاوز ${MAX_LENGTHS.message} حرف` })
    .refine((val) => {
      const assessment = assessInputSecurity(val, 'text');
      return assessment.riskLevel !== 'critical';
    }, { message: "الرسالة تحتوي على محتوى خطير" })
    .transform((val) => sanitizeInput(val, 'text')),
    
  attachmentUrl: z.string()
    .optional()
    .refine((val) => {
      if (!val) return true;
      
      // Allow various URL formats: full URLs, local paths, and API endpoints
      const isValid = /^https?:\/\/[^\s]+$/.test(val) || 
                     /^\/[^\s]*$/.test(val) || 
                     /^\/api\/files\/[a-zA-Z0-9_\-\.]+$/.test(val) ||
                     /^[a-zA-Z0-9_\-\.\/]+$/.test(val);
      return isValid;
    }, { message: "رابط المرفق غير صالح" })
    .transform((val) => {
      if (!val) return undefined;
      // For attachment URLs, we should NOT sanitize them like other text inputs
      // They need to remain as valid URLs
      return val;
    }),
    
  attachmentType: z.string().optional(),
  attachmentName: z.string().optional(),
  attachmentSize: z.number().optional(),
  
  captchaId: z.string()
    .optional()
    .refine((val) => {
      if (!val) return true;
      // Validate UUID format
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      return uuidPattern.test(val);
    }, { message: "معرف التحقق غير صالح" }),
    
  captchaAnswer: z.string()
    .min(1, { message: "إجابة التحقق مطلوبة" })
    .refine((val) => {
      // Support both numeric answers (server-based) and 'verified' (client-side)
      return /^\d+$/.test(val.trim()) || val.trim() === 'verified';
    }, { message: "إجابة التحقق غير صالحة" }),
    
  captchaToken: z.string()
    .optional()
    .refine((val) => {
      if (!val) return true;
      // Validate hex token format
      return /^[a-f0-9]{64}$/i.test(val);
    }, { message: "رمز التحقق غير صالح" }),
    
  consentToDataUse: z.boolean()
    .refine(val => val === true, { message: "يجب الموافقة على استخدام البيانات" }),
    
  wantsUpdates: z.boolean().default(false)
});

/**
 * Security middleware to validate and sanitize request body
 */
export function securityValidationMiddleware(req: any, res: any, next: any) {
  console.log('🛡️ [INPUT-SECURITY] Starting security validation');
  
  const body = req.body;
  const securityReport: { field: string; threats: string[]; riskLevel: string }[] = [];
  
  // Assess each field
  for (const [field, value] of Object.entries(body)) {
    if (typeof value === 'string') {
      // Skip sanitization for attachment URLs - they need to remain as valid URLs
      if (field === 'attachmentUrl') {
        console.log('🔍 [INPUT-SECURITY] Skipping sanitization for attachment URL field');
        continue;
      }
      
      const fieldType = getFieldType(field);
      const assessment = assessInputSecurity(value, fieldType);
      
      if (!assessment.isSecure) {
        securityReport.push({
          field,
          threats: assessment.threats,
          riskLevel: assessment.riskLevel
        });
        
        // Block critical threats immediately
        if (assessment.riskLevel === 'critical') {
          console.log(`🚨 [INPUT-SECURITY] Critical threat detected in field ${field}:`, assessment.threats);
          return res.status(400).json({
            message: 'تم اكتشاف محتوى خطير في البيانات المرسلة',
            error: 'SECURITY_THREAT_DETECTED',
            field: field
          });
        }
      }
      
      // Replace with sanitized value
      req.body[field] = assessment.sanitizedValue;
    }
  }
  
  // Log security report
  if (securityReport.length > 0) {
    console.log('⚠️ [INPUT-SECURITY] Security threats detected:', securityReport);
    req.securityReport = securityReport;
  } else {
    console.log('✅ [INPUT-SECURITY] All inputs passed security validation');
  }
  
  next();
}

/**
 * Helper function to determine field type
 */
function getFieldType(fieldName: string): 'name' | 'email' | 'phone' | 'text' | 'url' | 'filename' {
  if (fieldName.includes('name') || fieldName.includes('Name')) {
    if (fieldName.includes('attachment') || fieldName.includes('file')) return 'filename';
    return 'name';
  }
  if (fieldName.includes('email') || fieldName.includes('Email')) return 'email';
  if (fieldName.includes('phone') || fieldName.includes('Phone')) return 'phone';
  if (fieldName.includes('url') || fieldName.includes('Url')) return 'url';
  return 'text';
}

/**
 * Rate limiting based on input risk assessment
 */
export function getSecurityBasedRateLimit(riskLevel: 'low' | 'medium' | 'high' | 'critical'): number {
  switch (riskLevel) {
    case 'critical': return 1; // 1 request per hour
    case 'high': return 3; // 3 requests per hour
    case 'medium': return 10; // 10 requests per hour
    case 'low': return 30; // 30 requests per hour
    default: return 5;
  }
}

export default {
  sanitizeInput,
  assessInputSecurity,
  SecureCitizenCommunicationSchema,
  securityValidationMiddleware,
  getSecurityBasedRateLimit
}; 