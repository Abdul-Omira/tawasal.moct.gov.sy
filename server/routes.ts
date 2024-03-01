/**
 * Syrian Ministry of Communication - Citizen Engagement Platform
 * API Routes and Server Configuration
 * 
 * @author Abdulwahab Omira <abdul@omiratech.com>
 * @version 1.0.0
 * @license MIT
 */

import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { BusinessSubmissionSchema, BusinessSubmission, CitizenCommunicationSchema, CitizenCommunication } from "@shared/schema";
import { z } from "zod";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { setupAuth, isAuthenticated, isAdmin } from "./auth";
import { uploadMiddleware, securityScanMiddleware, handleFileUpload, serveFile } from "./fileUpload";
import { safeServeSecureFile } from "./secure-file-wrapper";
import { extractRequestMetadata, mergeMetadata, sanitizeMetadata, type SubmissionMetadata } from "./metadataCapture";
import { 
  initializeMinistryEmail, 
  sendMinisterNotification, 
  sendCitizenConfirmation 
} from "./ministryEmailService";
import { validateSecureCaptcha, generateSecureCaptchaResponse } from "./captcha-secure";
import { SecureCitizenCommunicationSchema, securityValidationMiddleware } from "./input-security";
import { 
  initializeAIService, 
  analyzeCommunication, 
  generateResponseSuggestions, 
  getAIStatus, 
  healthCheck, 
  aiChat 
} from "./aiService";

// Helper function to translate status to Arabic
function getArabicStatus(status: string): string {
  switch(status) {
    case 'pending': return 'قيد المراجعة';
    case 'approved': return 'تمت الموافقة';
    case 'rejected': return 'مرفوض';
    default: return status;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Import production logging first
  const { logError, logWarn, logInfo, logSecurity, silentLog } = await import('./production-logger');
  
  // Set up authentication FIRST - before any routes that use isAdmin middleware
  await setupAuth(app);
  
  // 🚨 HONEYPOT SYSTEM - Must be EARLY to catch attacks before legitimate routes 🚨
  const { honeypotHandler } = await import('./honeypot');
  
  // Classic admin routes that attackers typically target
  app.all("/admin", honeypotHandler);
  app.all("/admin/*", honeypotHandler);
  app.all("/administrator", honeypotHandler);
  app.all("/administrator/*", honeypotHandler);
  app.all("/wp-admin", honeypotHandler);
  app.all("/wp-admin/*", honeypotHandler);
  app.all("/phpmyadmin", honeypotHandler);
  app.all("/phpmyadmin/*", honeypotHandler);
  app.all("/cpanel", honeypotHandler);
  app.all("/cpanel/*", honeypotHandler);
  app.all("/control", honeypotHandler);
  app.all("/control/*", honeypotHandler);
  app.all("/admin-panel", honeypotHandler);
  app.all("/admin-panel/*", honeypotHandler);
  app.all("/admincp", honeypotHandler);
  app.all("/admincp/*", honeypotHandler);
  app.all("/backend", honeypotHandler);
  app.all("/backend/*", honeypotHandler);
  app.all("/manager", honeypotHandler);
  app.all("/manager/*", honeypotHandler);
  app.all("/management", honeypotHandler);
  app.all("/management/*", honeypotHandler);
  
  // Common config and sensitive file paths
  app.all("/.env", honeypotHandler);
  app.all("/config", honeypotHandler);
  app.all("/config/*", honeypotHandler);
  app.all("/database", honeypotHandler);
  app.all("/database/*", honeypotHandler);
  app.all("/backup", honeypotHandler);
  app.all("/backup/*", honeypotHandler);
  app.all("/logs", honeypotHandler);
  app.all("/logs/*", honeypotHandler);
  
  // API honeypots - dangerous endpoints that should never exist
  app.all("/api/admin", honeypotHandler);
  app.all("/api/v1/admin", honeypotHandler);
  app.all("/api/v2/admin", honeypotHandler);
  app.all("/api/administrator", honeypotHandler);
  app.all("/api/config", honeypotHandler);
  app.all("/api/database", honeypotHandler);
  app.all("/api/system", honeypotHandler);
  app.all("/api/debug", honeypotHandler);

  silentLog.security('Honeypot system activated');
  
  // Initialize ministry email service
  try {
    await initializeMinistryEmail();
    logInfo('Ministry email service initialized');
  } catch (error) {
    logWarn('Ministry email service initialization failed, continuing without email notifications');
  }

  // Initialize AI service for intelligent communication analysis
  try {
    initializeAIService();
    console.log('🤖 AI service initialized for communication analysis');
  } catch (error) {
    console.log('⚠️  AI service initialization failed, continuing without AI features');
  }
  
  // Create test users with proper password hashing
  try {
    // Import the createTestUsers function
    const { createTestUsers } = await import('./createTestUsers');
    
    // Create test users
    await createTestUsers();
    
  } catch (error) {
    console.error('Error creating test users:', error);
  }

  // Import rate limiters
  const { uploadLimiter, formLimiter, adminLimiter } = await import('./index');
  
  // Import production security enhancement
  const { productionSecurityMiddleware, productionRateLimitingMiddleware } = await import('./enhanced-security-seamless-production');
  
  // File upload API endpoint with enhanced security (production ready)
  app.post("/api/uploads", 
    uploadLimiter, 
    productionRateLimitingMiddleware,
    uploadMiddleware, 
    productionSecurityMiddleware,
    securityScanMiddleware, 
    handleFileUpload
  );
  
  // 🔒 SECURE CAPTCHA ENDPOINT
  app.get("/api/captcha", (req: Request, res: Response) => {
    try {
      const captchaData = generateSecureCaptchaResponse(req);
      res.json(captchaData);
    } catch (error) {
      console.error('Error generating CAPTCHA:', error);
      res.status(500).json({ 
        message: "خطأ في إنشاء CAPTCHA",
        error: "CAPTCHA_GENERATION_ERROR"
      });
    }
  });

  // API Routes for citizen communications
  app.get("/api/citizen-communications", isAdmin, async (req: Request, res: Response) => {
    try {
      const communications = await storage.getAllCitizenCommunications();
      res.json(communications);
    } catch (error) {
      res.status(500).json({ message: "حدث خطأ أثناء جلب البيانات" });
    }
  });

  app.get("/api/citizen-communications/:id", isAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "معرف غير صالح" });
      }
      
      const communication = await storage.getCitizenCommunicationById(id);
      if (!communication) {
        return res.status(404).json({ message: "لم يتم العثور على الرسالة" });
      }
      
      res.json(communication);
    } catch (error) {
      res.status(500).json({ message: "حدث خطأ أثناء جلب البيانات" });
    }
  });

  // Test endpoint for debugging
  app.post("/api/test-form", (req: Request, res: Response) => {
    console.log("🧪 [TEST] Test endpoint hit");
    console.log("🧪 [TEST] Headers:", req.headers);
    console.log("🧪 [TEST] Body:", req.body);
    res.json({ success: true, message: "Test successful" });
  });

  app.post("/api/citizen-communications", formLimiter, securityValidationMiddleware, async (req: Request, res: Response) => {
    try {
      console.log("📝 [SECURITY] Endpoint hit: /api/citizen-communications");
      console.log("📝 [REQUEST] Headers:", req.headers);
      console.log("📝 [REQUEST] Body keys:", Object.keys(req.body));
      console.log("📝 [REQUEST] CAPTCHA data:", {
        captchaId: req.body.captchaId,
        captchaAnswer: req.body.captchaAnswer,
        hasToken: !!req.body.captchaToken
      });
      
      // 🚨 MAXIMUM SECURITY IMPLEMENTATION 🚨
      
      // 1. SECURE CAPTCHA VALIDATION - Support both server-based and client-side CAPTCHA
      const { captchaAnswer, captchaId, captchaToken } = req.body;
      
      // Check if using server-based CAPTCHA (has captchaId and captchaToken)
      if (captchaId && captchaToken) {
        // Server-based CAPTCHA validation
        if (!captchaAnswer || typeof captchaAnswer !== 'string' || 
            typeof captchaId !== 'string' || typeof captchaToken !== 'string') {
          console.log("🚨 [SECURITY] Invalid server-based CAPTCHA data:", {
            captchaId: !!captchaId,
            captchaAnswer: !!captchaAnswer,
            captchaToken: !!captchaToken
          });
          return res.status(400).json({ 
            message: "فشل التحقق من CAPTCHA - يرجى إعادة المحاولة",
            error: "CAPTCHA_VALIDATION_FAILED"
          });
        }
        
        // Validate CAPTCHA using secure cryptographic verification
        const isCaptchaValid = validateSecureCaptcha(captchaId, captchaAnswer, captchaToken, req);
        if (!isCaptchaValid) {
          console.log("🚨 [SECURITY] Invalid server-based CAPTCHA - potential bypass attempt");
          return res.status(400).json({ 
            message: "إجابة CAPTCHA غير صحيحة أو محاولة تجاوز غير مصرح بها",
            error: "CAPTCHA_SECURITY_VIOLATION"
          });
        }
        console.log("✅ [SECURITY] Server-based CAPTCHA validation successful");
      } else {
        // Client-side CAPTCHA validation (AdaptiveCaptcha)
        if (!captchaAnswer || typeof captchaAnswer !== 'string' || captchaAnswer !== 'verified') {
          console.log("🚨 [SECURITY] Invalid client-side CAPTCHA data:", {
            captchaAnswer: captchaAnswer,
            type: typeof captchaAnswer
          });
          return res.status(400).json({ 
            message: "فشل التحقق من CAPTCHA - يرجى إعادة المحاولة",
            error: "CAPTCHA_VALIDATION_FAILED"
          });
        }
        console.log("✅ [SECURITY] Client-side CAPTCHA validation successful");
      }
      
      // 2. XSS PROTECTION - Block all script injections
      const { fullName, email, phone, subject, message } = req.body;
      const xssPatterns = [
        /<script[^>]*>.*?<\/script>/gi,
        /<iframe[^>]*>.*?<\/iframe>/gi,
        /javascript:/gi,
        /vbscript:/gi,
        /onload\s*=/gi,
        /onerror\s*=/gi,
        /onclick\s*=/gi,
        /onmouseover\s*=/gi,
        /<img[^>]+onerror/gi,
        /eval\s*\(/gi,
        /document\.write/gi,
        /window\.location/gi,
        /<object[^>]*>/gi,
        /<embed[^>]*>/gi,
        /<svg[^>]*onload/gi,
        /data:text\/html/gi
      ];
      
      const fieldsToCheck = [fullName, email, phone, subject, message];
      for (const field of fieldsToCheck) {
        if (field && typeof field === 'string') {
          for (const pattern of xssPatterns) {
            if (pattern.test(field)) {
              console.log(`🚨 [SECURITY] XSS attempt blocked: ${pattern}`);
              return res.status(400).json({ 
                message: "تم اكتشاف محتوى خطير في النموذج - تم حظر الطلب لأسباب أمنية",
                error: "XSS_CONTENT_DETECTED"
              });
            }
          }
        }
      }
      
      // 3. MALICIOUS PATTERN DETECTION
      const maliciousPatterns = [
        /<?php/gi,
        /<%/gi,
        /%>/gi,
        /<\?/gi,
        /\?>/gi,
        /eval\(/gi,
        /exec\(/gi,
        /system\(/gi,
        /shell_exec\(/gi,
        /base64_decode\(/gi,
        /file_get_contents\(/gi,
        /curl_exec\(/gi,
        /sql\s*(insert|update|delete|drop|create|alter)\s/gi,
        /union\s+select/gi,
        /or\s+1\s*=\s*1/gi,
        /and\s+1\s*=\s*1/gi,
        /'.*or.*'/gi,
        /";.*--/gi,
        /\/\*.*\*\//gi
      ];
      
      for (const field of fieldsToCheck) {
        if (field && typeof field === 'string') {
          for (const pattern of maliciousPatterns) {
            if (pattern.test(field)) {
              console.log(`🚨 [SECURITY] Malicious pattern blocked: ${pattern}`);
              return res.status(400).json({ 
                message: "تم اكتشاف محتوى مشبوه - تم رفض الطلب لأسباب أمنية",
                error: "MALICIOUS_CONTENT_DETECTED"
              });
            }
          }
        }
      }
      
      // 4. STRICT EMAIL VALIDATION
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!email || !emailRegex.test(email)) {
        return res.status(400).json({ 
          message: "عنوان البريد الإلكتروني غير صالح",
          error: "INVALID_EMAIL_FORMAT"
        });
      }
      
      // 5. PHONE NUMBER VALIDATION (optional field)
      const phoneRegex = /^\+?[0-9\s\-\(\)]{7,20}$/;
      if (phone && !phoneRegex.test(phone)) {
        return res.status(400).json({ 
          message: "رقم الهاتف غير صالح",
          error: "INVALID_PHONE_FORMAT"
        });
      }
      
      // 6. LENGTH LIMITS TO PREVENT OVERFLOW
      if (fullName && fullName.length > 100) {
        return res.status(400).json({ 
          message: "الاسم طويل جداً - الحد الأقصى 100 حرف",
          error: "NAME_TOO_LONG"
        });
      }
      
      if (subject && subject.length > 200) {
        return res.status(400).json({ 
          message: "الموضوع طويل جداً - الحد الأقصى 200 حرف",
          error: "SUBJECT_TOO_LONG"
        });
      }
      
      if (message && message.length > 5000) {
        return res.status(400).json({ 
          message: "الرسالة طويلة جداً - الحد الأقصى 5000 حرف",
          error: "MESSAGE_TOO_LONG"
        });
      }
      
      // 7. CLEAN AND SANITIZE INPUT
      const cleanInput = (str: string) => {
        if (!str) return str;
        return str
          .replace(/[<>]/g, '') // Remove angle brackets
          .replace(/['"]/g, '') // Remove quotes
          .replace(/[&]/g, '&amp;') // Escape ampersands
          .trim();
      };
      
      // Handle different content types
      if (req.headers['content-type']?.includes('multipart/form-data')) {
        return res.status(400).json({ 
          message: "لإرسال ملفات، يرجى استخدام نقطة النهاية المخصصة للتحميل",
          error: "Use /api/uploads endpoint for file uploads first, then submit the form with the file URL"
        });
      }

      const { clientMetadata, ...communication } = req.body;
      
      // Clean the communication object
      const cleanedCommunication = {
        ...communication,
        fullName: cleanInput(communication.fullName),
        email: cleanInput(communication.email),
        phone: cleanInput(communication.phone),
        subject: cleanInput(communication.subject),
        message: cleanInput(communication.message),
        captchaAnswer: null // Remove captcha from stored data
      };
      
      console.log("📝 [SECURITY] All validation checks passed");
      
      // Validate the submission data using secure schema
      const validationResult = SecureCitizenCommunicationSchema.safeParse(req.body);
      if (!validationResult.success) {
        console.log("📝 [SECURITY] Validation failed:", validationResult.error);
        const validationError = fromZodError(validationResult.error);
        return res.status(400).json({ 
          message: "البيانات المرسلة لا تتوافق مع معايير الأمان", 
          errors: validationError.details 
        });
      }
      
      console.log("📝 [SECURITY] Schema validation successful");
      // Extract server-side metadata
      const serverMetadata = extractRequestMetadata(req);
      // Merge client and server metadata
      const combinedMetadata = mergeMetadata(serverMetadata, clientMetadata || {});
      // Sanitize metadata for security
      const sanitizedMetadata = sanitizeMetadata(combinedMetadata);
      // Add metadata to the communication object
      const communicationWithMetadata = {
        ...communication,
        ipAddress: sanitizedMetadata.ipAddress,
        geolocation: sanitizedMetadata.geolocation,
        ispInfo: sanitizedMetadata.ispInfo,
        vpnDetection: sanitizedMetadata.vpnDetection,
        hostingProvider: sanitizedMetadata.hostingProvider,
        userAgent: sanitizedMetadata.userAgent,
        browserInfo: sanitizedMetadata.browserInfo,
        deviceType: sanitizedMetadata.deviceType,
        language: sanitizedMetadata.language,
        screenResolution: sanitizedMetadata.screenResolution,
        timezone: sanitizedMetadata.timezone,
        touchSupport: sanitizedMetadata.touchSupport,
        batteryStatus: sanitizedMetadata.batteryStatus,
        installedFonts: sanitizedMetadata.installedFonts,
        referrerUrl: sanitizedMetadata.referrerUrl,
        pageUrl: sanitizedMetadata.pageUrl,
        pageLoadTime: sanitizedMetadata.pageLoadTime,
        javascriptEnabled: sanitizedMetadata.javascriptEnabled,
        cookiesEnabled: sanitizedMetadata.cookiesEnabled,
        doNotTrack: sanitizedMetadata.doNotTrack,
        browserPlugins: sanitizedMetadata.browserPlugins,
        webglFingerprint: sanitizedMetadata.webglFingerprint,
      };
      console.log("📝 [DEBUG] communicationWithMetadata:", JSON.stringify(communicationWithMetadata));
      // Create the communication in the DB
      let createdCommunication;
      try {
        createdCommunication = await storage.createCitizenCommunication(communicationWithMetadata);
        console.log("📝 [DEBUG] DB insert result:", createdCommunication);
      } catch (dbError) {
        console.error("📝 [ERROR] DB insert failed:", dbError);
        return res.status(500).json({ message: "DB insert failed", error: (dbError as any).message });
      }
      
      // 📧 SEND EMAIL NOTIFICATION TO MINISTER
      try {
        console.log("📧 [EMAIL] Sending notification to minister...");
        const emailSent = await sendMinisterNotification(createdCommunication);
        if (emailSent) {
          console.log(`📧 ✅ Email notification sent successfully for communication #${createdCommunication.id}`);
        } else {
          console.log(`📧 ⚠️ Email notification failed for communication #${createdCommunication.id}`);
        }
      } catch (emailError) {
        console.error("📧 ❌ Email notification error:", emailError);
        // Don't fail the request if email fails - the communication was saved successfully
      }
      
      // 📧 SEND CONFIRMATION EMAIL TO CITIZEN
      try {
        console.log("📧 [EMAIL] Sending confirmation email to citizen...");
        const confirmationSent = await sendCitizenConfirmation(createdCommunication);
        if (confirmationSent) {
          console.log(`📧 ✅ Confirmation email sent successfully to ${createdCommunication.email}`);
        } else {
          console.log(`📧 ⚠️ Confirmation email failed for ${createdCommunication.email}`);
        }
      } catch (confirmationError) {
        console.error("📧 ❌ Citizen confirmation email error:", confirmationError);
        // Don't fail the request if email fails - the communication was saved successfully
      }
      
      res.status(201).json(createdCommunication);
    } catch (error) {
      console.error('📝 [ERROR] Unhandled error in /api/citizen-communications:', error);
      console.error('📝 [ERROR] Stack:', (error as any).stack);
      res.status(500).json({ message: "حدث خطأ أثناء إنشاء الرسالة", error: (error as any).message });
    }
  });

  app.patch("/api/citizen-communications/:id/status", isAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "معرف غير صالح" });
      }
      
      const { status } = req.body;
      if (!status || typeof status !== 'string') {
        return res.status(400).json({ message: "الحالة مطلوبة" });
      }
      
      const updatedCommunication = await storage.updateCitizenCommunicationStatus(id, status);
      if (!updatedCommunication) {
        return res.status(404).json({ message: "لم يتم العثور على الرسالة" });
      }
      
      // Status update emails disabled - only confirmation emails are sent
      // try {
      //   await sendStatusUpdateEmail(updatedCommunication);
      //   console.log(`📧 Status update email sent for communication #${updatedCommunication.id}`);
      // } catch (error) {
      //   console.log(`⚠️  Failed to send status update email for communication #${updatedCommunication.id}:`, error);
      //   // Don't fail the request if email fails
      // }
      
      res.json(updatedCommunication);
    } catch (error) {
      res.status(500).json({ message: "حدث خطأ أثناء تحديث حالة الرسالة" });
    }
  });

  app.get("/api/admin/citizen-communications", adminLimiter, isAdmin, async (req: Request, res: Response) => {
    try {
      console.log('🔍 [ADMIN API] Hit admin endpoint with query:', req.query);
      const { 
        status, 
        communicationType,
        search, 
        page = '1', 
        limit = '10',
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query as Record<string, string>;
      
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      
      console.log('🔍 [ADMIN API] Parsed params:', { status, communicationType, search, pageNum, limitNum, sortBy, sortOrder });
      
      const result = await storage.getCitizenCommunicationsWithFilters({
        status,
        communicationType,
        search,
        page: pageNum,
        limit: limitNum,
        sortBy,
        sortOrder: (sortOrder === 'asc' ? 'asc' : 'desc') as 'asc' | 'desc'
      });
      
      console.log('🔍 [ADMIN API] Storage result:', { 
        total: result.total, 
        dataLength: result.data?.length, 
        firstItem: result.data?.[0]?.id 
      });
      
      res.json(result);
    } catch (error) {
      console.error('🔍 [ADMIN API] Error:', error);
      res.status(500).json({ message: "حدث خطأ أثناء جلب البيانات" });
    }
  });

  app.get("/api/admin/communication-statistics", adminLimiter, isAdmin, async (req: Request, res: Response) => {
    try {
      const stats = await storage.getCitizenCommunicationStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "حدث خطأ أثناء جلب الإحصائيات" });
    }
  });
  
  // API Routes for business submissions
  app.get("/api/business-submissions", isAdmin, async (req: Request, res: Response) => {
    try {
      const submissions = await storage.getAllBusinessSubmissions();
      res.json(submissions);
    } catch (error) {
      res.status(500).json({ message: "حدث خطأ أثناء جلب البيانات" });
    }
  });

  app.get("/api/business-submissions/:id", isAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "معرف غير صالح" });
      }

      const submission = await storage.getBusinessSubmissionById(id);
      if (!submission) {
        return res.status(404).json({ message: "لم يتم العثور على الطلب" });
      }

      res.json(submission);
    } catch (error) {
      res.status(500).json({ message: "حدث خطأ أثناء جلب البيانات" });
    }
  });

  app.post("/api/business-submissions", async (req: Request, res: Response) => {
    try {
      const { clientMetadata, ...submission } = req.body;
      
      // Validate request body
      const validatedData = BusinessSubmissionSchema.parse(submission);
      
      // Extract server-side metadata
      const serverMetadata = extractRequestMetadata(req);
      
      // Merge client and server metadata
      const combinedMetadata = mergeMetadata(serverMetadata, clientMetadata || {});
      
      // Sanitize metadata for security
      const sanitizedMetadata = sanitizeMetadata(combinedMetadata);
      
      // Add metadata to the submission object
      const submissionWithMetadata = {
        ...validatedData,
        ipAddress: sanitizedMetadata.ipAddress,
        geolocation: sanitizedMetadata.geolocation,
        ispInfo: sanitizedMetadata.ispInfo,
        vpnDetection: sanitizedMetadata.vpnDetection,
        hostingProvider: sanitizedMetadata.hostingProvider,
        userAgent: sanitizedMetadata.userAgent,
        browserInfo: sanitizedMetadata.browserInfo,
        deviceType: sanitizedMetadata.deviceType,
        language: sanitizedMetadata.language,
        screenResolution: sanitizedMetadata.screenResolution,
        timezone: sanitizedMetadata.timezone,
        touchSupport: sanitizedMetadata.touchSupport,
        batteryStatus: sanitizedMetadata.batteryStatus,
        installedFonts: sanitizedMetadata.installedFonts,
        referrerUrl: sanitizedMetadata.referrerUrl,
        pageUrl: sanitizedMetadata.pageUrl,
        pageLoadTime: sanitizedMetadata.pageLoadTime,
        javascriptEnabled: sanitizedMetadata.javascriptEnabled,
        cookiesEnabled: sanitizedMetadata.cookiesEnabled,
        doNotTrack: sanitizedMetadata.doNotTrack,
        browserPlugins: sanitizedMetadata.browserPlugins,
        webglFingerprint: sanitizedMetadata.webglFingerprint,
      };
      
      // Create submission
      const createdSubmission = await storage.createBusinessSubmission(submissionWithMetadata);
      
      // 📧 SEND EMAIL NOTIFICATION TO MINISTER FOR BUSINESS SUBMISSION
      try {
        console.log("📧 [EMAIL] Sending business submission notification to minister...");
        const emailSent = await sendMinisterNotification(createdSubmission as any);
        if (emailSent) {
          console.log(`📧 ✅ Business submission email notification sent successfully for submission #${createdSubmission.id}`);
        } else {
          console.log(`📧 ⚠️ Business submission email notification failed for submission #${createdSubmission.id}`);
        }
      } catch (emailError) {
        console.error("📧 ❌ Business submission email notification error:", emailError);
        // Don't fail the request if email fails - the submission was saved successfully
      }
      
      res.status(201).json(createdSubmission);
    } catch (error) {
      if (error instanceof ZodError) {
        // Convert Zod error to a more user-friendly format
        const validationError = fromZodError(error);
        return res.status(400).json({ 
          message: "خطأ في البيانات المدخلة", 
          errors: validationError.details 
        });
      }
      
      res.status(500).json({ message: "حدث خطأ أثناء حفظ البيانات" });
    }
  });

  app.patch("/api/business-submissions/:id/status", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "معرف غير صالح" });
      }

      const { status } = req.body;
      if (!status || !["pending", "approved", "rejected"].includes(status)) {
        return res.status(400).json({ message: "حالة غير صالحة" });
      }

      const submission = await storage.updateBusinessSubmissionStatus(id, status);
      if (!submission) {
        return res.status(404).json({ message: "لم يتم العثور على الطلب" });
      }

      res.json(submission);
    } catch (error) {
      res.status(500).json({ message: "حدث خطأ أثناء تحديث الحالة" });
    }
  });

  // File upload endpoint for citizen communication attachments (enhanced security applied above)
  
  // Secure file serving endpoint (deprecated - use secure-files)
  app.get('/api/files/:filename', serveFile);
  
  // New secure token-based file serving endpoint - ADMIN ONLY
  app.get('/api/secure-files/:token', isAuthenticated, isAdmin, safeServeSecureFile);

  // Our new auth.ts file handles these routes:
  // - /api/login
  // - /api/register
  // - /api/logout
  // - /api/user

  // Admin-only routes (protected) - Citizen communication platform only

  app.get("/api/admin/statistics", adminLimiter, isAdmin, async (req: Request, res: Response) => {
    try {
      const stats = await storage.getCitizenCommunicationStats();
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Statistics error:', error);
      res.status(500).json({ 
        message: 'حدث خطأ أثناء جلب الإحصائيات',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Export functionality removed as requested

  // Make a specific user an admin (protected with admin auth)
  app.post("/api/admin/promote", adminLimiter, isAdmin, async (req: Request, res: Response) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: "معرف المستخدم مطلوب" });
      }
      
      const user = await storage.setUserAsAdmin(userId);
      
      if (!user) {
        return res.status(404).json({ message: "لم يتم العثور على المستخدم" });
      }
      
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "حدث خطأ أثناء ترقية المستخدم إلى مدير" });
    }
  });

  // Password update route
  app.post("/api/user/change-password", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "كلمة المرور الحالية والجديدة مطلوبة" });
      }
      
      if (newPassword.length < 8) {
        return res.status(400).json({ message: "يجب أن تكون كلمة المرور الجديدة 8 أحرف على الأقل" });
      }
      
      // Get user from the session
      const userId = (req.user as any).id;
      if (!userId) {
        return res.status(401).json({ message: "المستخدم غير مسجل الدخول" });
      }
      
      // Get user from database to verify current password
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "المستخدم غير موجود" });
      }
      
      // Import the comparePasswords function from auth.ts
      const { comparePasswords } = await import('./auth');
      
      // Verify the current password
      const isPasswordValid = await comparePasswords(currentPassword, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "كلمة المرور الحالية غير صحيحة" });
      }
      
      // Update the password
      const updatedUser = await storage.updateUserPassword(user.username, newPassword);
      
      if (!updatedUser) {
        return res.status(500).json({ message: "فشل تحديث كلمة المرور" });
      }
      
      res.status(200).json({ message: "تم تحديث كلمة المرور بنجاح" });
    } catch (error) {
      res.status(500).json({ message: "حدث خطأ أثناء تغيير كلمة المرور" });
    }
  });

  // Test email endpoint (development only)
  app.post("/api/test-email", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ 
          message: "Email address is required",
          error: "MISSING_EMAIL"
        });
      }

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ 
          message: "Invalid email format",
          error: "INVALID_EMAIL"
        });
      }

      // Import and call the test email function
      // const { sendTestEmail } = await import('./emailService'); // Removed - using ministry email only
      const success = false; // await sendTestEmail(email); // Disabled - using ministry email only
      
      if (success) {
        res.json({ 
          success: true,
          message: `Test email sent successfully to ${email}`,
          timestamp: new Date().toISOString(),
          testId: Math.random().toString(36).substr(2, 9)
        });
      } else {
        res.status(500).json({ 
          success: false,
          message: "Failed to send test email",
          error: "EMAIL_SEND_FAILED"
        });
      }
    } catch (error) {
      console.error('Test email error:', error);
      res.status(500).json({ 
        success: false,
        message: "Internal server error while sending test email",
        error: "INTERNAL_ERROR"
      });
    }
  });

  // 🤖 AI-POWERED ENDPOINTS FOR SYRIAN MINISTRY PLATFORM
  
  // AI Status endpoint (admin only)
  app.get("/api/ai/status", adminLimiter, isAdmin, async (req: Request, res: Response) => {
    try {
      const status = await getAIStatus();
      res.json({
        success: true,
        ...status
      });
    } catch (error) {
      console.error('AI status error:', error);
      res.status(500).json({ 
        success: false,
        message: "Failed to get AI status",
        error: "AI_STATUS_ERROR"
      });
    }
  });

  // AI Health check (admin only)
  app.get("/api/ai/health", adminLimiter, isAdmin, async (req: Request, res: Response) => {
    try {
      const isHealthy = await healthCheck();
      res.json({
        success: true,
        healthy: isHealthy,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('AI health check error:', error);
      res.status(500).json({ 
        success: false,
        healthy: false,
        message: "AI health check failed",
        error: "AI_HEALTH_ERROR"
      });
    }
  });

  // Analyze communication with AI (admin only)
  app.post("/api/ai/analyze", adminLimiter, isAdmin, async (req: Request, res: Response) => {
    try {
      const { communicationId } = req.body;
      
      if (!communicationId) {
        return res.status(400).json({ 
          message: "Communication ID is required",
          error: "MISSING_COMMUNICATION_ID"
        });
      }

      // Get the communication from database
      const communication = await storage.getCitizenCommunicationById(parseInt(communicationId));
      
      if (!communication) {
        return res.status(404).json({ 
          message: "Communication not found",
          error: "COMMUNICATION_NOT_FOUND"
        });
      }

      console.log(`🤖 [AI-API] Analyzing communication #${communication.id} via API`);
      
      const analysis = await analyzeCommunication(communication);
      
      if (analysis) {
        res.json({
          success: true,
          analysis,
          communicationId: communication.id,
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(500).json({ 
          success: false,
          message: "AI analysis failed",
          error: "AI_ANALYSIS_FAILED"
        });
      }
    } catch (error) {
      console.error('AI analysis error:', error);
      res.status(500).json({ 
        success: false,
        message: "Internal server error during AI analysis",
        error: "AI_ANALYSIS_ERROR"
      });
    }
  });

  // Generate response suggestions with AI (admin only)
  app.post("/api/ai/suggestions", adminLimiter, isAdmin, async (req: Request, res: Response) => {
    try {
      const { communicationId, context } = req.body;
      
      if (!communicationId) {
        return res.status(400).json({ 
          message: "Communication ID is required",
          error: "MISSING_COMMUNICATION_ID"
        });
      }

      // Get the communication from database
      const communication = await storage.getCitizenCommunicationById(parseInt(communicationId));
      
      if (!communication) {
        return res.status(404).json({ 
          message: "Communication not found",
          error: "COMMUNICATION_NOT_FOUND"
        });
      }

      console.log(`🤖 [AI-API] Generating suggestions for communication #${communication.id}`);
      
      const suggestions = await generateResponseSuggestions(communication, context);
      
      res.json({
        success: true,
        suggestions,
        communicationId: communication.id,
        context: context || null,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('AI suggestions error:', error);
      res.status(500).json({ 
        success: false,
        message: "Internal server error during AI suggestion generation",
        error: "AI_SUGGESTIONS_ERROR"
      });
    }
  });

  // AI Chat interface for admins
  app.post("/api/ai/chat", adminLimiter, isAdmin, async (req: Request, res: Response) => {
    try {
      const { message, context } = req.body;
      
      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        return res.status(400).json({ 
          message: "Message is required",
          error: "MISSING_MESSAGE"
        });
      }

      if (message.length > 1000) {
        return res.status(400).json({ 
          message: "Message too long (max 1000 characters)",
          error: "MESSAGE_TOO_LONG"
        });
      }

      console.log(`🤖 [AI-CHAT] Processing admin chat request`);
      
      const chatResponse = await aiChat(message.trim(), context);
      
      res.json({
        ...chatResponse,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('AI chat error:', error);
      res.status(500).json({ 
        success: false,
        message: "Internal server error during AI chat",
        error: "AI_CHAT_ERROR"
      });
    }
  });

  // 📧 EMAIL TEST ENDPOINT (Admin only)
  app.post("/api/test-email", adminLimiter, isAdmin, async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      
      if (!email || typeof email !== 'string') {
        return res.status(400).json({ 
          success: false,
          message: "Email address is required",
          error: "MISSING_EMAIL"
        });
      }

      // Validate email format
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ 
          success: false,
          message: "Invalid email format",
          error: "INVALID_EMAIL_FORMAT"
        });
      }

      console.log(`📧 [TEST-EMAIL] Admin ${req.user?.username} testing email to: ${email}`);
      
      // Disabled - only ministry email is used
      const emailSent = false; // await sendTestEmail(email);
      
      if (emailSent) {
        res.json({
          success: true,
          message: "Test email sent successfully",
          recipient: email,
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Failed to send test email",
          error: "EMAIL_SEND_FAILED"
        });
      }
    } catch (error) {
      console.error('Test email error:', error);
      res.status(500).json({ 
        success: false,
        message: "Internal server error during email test",
        error: "EMAIL_TEST_ERROR"
      });
    }
  });

  // 📧 LOCAL SENDGRID EMAIL MANAGEMENT API ENDPOINTS

  // Get email service status
  app.get("/api/email/status", adminLimiter, isAdmin, async (req: Request, res: Response) => {
    try {
      // Disabled - only ministry email is used
      const status = { error: "Email status endpoint disabled" }; // getEmailStatus();
      res.json({
        success: true,
        status: status,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Email status error:', error);
      res.status(500).json({
        success: false,
        message: "Failed to get email status",
        error: "EMAIL_STATUS_ERROR"
      });
    }
  });

  // Get email statistics
  app.get("/api/email/stats", adminLimiter, isAdmin, async (req: Request, res: Response) => {
    try {
      // Disabled - only ministry email is used
      const stats = { error: "Email stats endpoint disabled" }; // getEmailStats();
      res.json({
        success: true,
        stats: stats,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Email stats error:', error);
      res.status(500).json({
        success: false,
        message: "Failed to get email statistics",
        error: "EMAIL_STATS_ERROR"
      });
    }
  });

  // Queue a new email
  app.post("/api/email/queue", adminLimiter, isAdmin, async (req: Request, res: Response) => {
    try {
      const { to, subject, html, text, templateId, templateData } = req.body;
      
      if (!to || !subject) {
        return res.status(400).json({
          success: false,
          message: "Recipient and subject are required",
          error: "MISSING_REQUIRED_FIELDS"
        });
      }

      // Disabled - only ministry email is used
      const emailId = "disabled-" + Date.now(); // await queueEmail({ to, subject, html, text, templateId, templateData });

      console.log(`📧 [QUEUE] Admin ${req.user?.username} queued email ${emailId} to: ${to}`);

      res.json({
        success: true,
        message: "Email queued successfully",
        emailId: emailId,
        recipient: to,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Email queue error:', error);
      res.status(500).json({
        success: false,
        message: "Failed to queue email",
        error: "EMAIL_QUEUE_ERROR"
      });
    }
  });

  // Send test email with Local SendGrid
  app.post("/api/email/test-local", adminLimiter, isAdmin, async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      
      if (!email || typeof email !== 'string') {
        return res.status(400).json({
          success: false,
          message: "Email address is required",
          error: "MISSING_EMAIL"
        });
      }

      // Validate email format
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: "Invalid email format",
          error: "INVALID_EMAIL_FORMAT"
        });
      }

      console.log(`📧 [LOCAL-TEST] Admin ${req.user?.username} testing Local SendGrid to: ${email}`);

      // Use the Local SendGrid queue system directly
      // Disabled - only ministry email is used
      const emailId = "disabled-" + Date.now(); /* await queueEmail({
        to: email,
        subject: '🧪 اختبار النظام المحلي SendGrid - وزارة الاتصالات',
        templateId: 'welcome-template',
        templateData: {
          name: `${req.user?.name || 'مدير النظام'}`,
          email: email
        }
      }); */

      if (emailId) {
        res.json({
          success: true,
          message: "Test email queued successfully in Local SendGrid",
          emailId: emailId,
          recipient: email,
          method: "Local SendGrid Queue",
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Failed to queue test email in Local SendGrid",
          error: "LOCAL_SENDGRID_QUEUE_FAILED"
        });
      }
    } catch (error) {
      console.error('Local SendGrid test error:', error);
      res.status(500).json({
        success: false,
        message: "Internal server error during Local SendGrid test",
        error: "LOCAL_SENDGRID_TEST_ERROR"
      });
    }
  });

  // 🚨 ADDITIONAL SECURITY MEASURES 🚨
  
  // Block known attack tools and bots before any processing
  app.use((req: Request, res: Response, next: NextFunction) => {
    const userAgent = req.get('user-agent') || '';
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    
    // Block known attack tools
    const blockedAgents = [
      'sqlmap', 'nikto', 'nmap', 'metasploit', 'hydra', 'dirb', 'gobuster',
      'masscan', 'nuclei', 'whatweb', 'httprobe', 'subfinder', 'amass',
      'burp', 'zap', 'acunetix', 'nessus', 'qualys', 'rapid7'
    ];
    
    for (const agent of blockedAgents) {
      if (userAgent.toLowerCase().includes(agent)) {
        console.log(`🚨 [SECURITY] Blocked attack tool: ${agent} from IP: ${ip}`);
        return res.status(403).json({
          error: 'ACCESS_DENIED',
          message: 'تم حظر الوصول - أداة مشبوهة مكتشفة',
          code: 'ATTACK_TOOL_DETECTED'
        });
      }
    }
    
    // Check for suspicious request patterns
    const path = req.path.toLowerCase();
    const suspiciousPaths = [
      'eval(', 'base64_decode', '<?php', '<%', 'javascript:', 'vbscript:',
      'onload=', 'onerror=', 'onclick=', '<script', '</script>', 'document.write'
    ];
    
    for (const pattern of suspiciousPaths) {
      if (path.includes(pattern) || req.originalUrl.includes(pattern)) {
        console.log(`🚨 [SECURITY] Suspicious path pattern: ${pattern} from IP: ${ip}`);
        return res.status(403).json({
          error: 'ACCESS_DENIED',
          message: 'تم حظر الوصول - نمط مشبوه في الطلب',
          code: 'SUSPICIOUS_PATH_DETECTED'
        });
      }
    }
    
    next();
  });

  const httpServer = createServer(app);
  return httpServer;
}
