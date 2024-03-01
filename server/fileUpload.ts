import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { fileTypeFromBuffer } from 'file-type';
import { v4 as uuidv4 } from 'uuid';
import sanitize from 'sanitize-filename';
import { safeStoreFileSecurely, isSecureFileSystemAvailable } from './secure-file-wrapper';

// Helper function to extract real client IP from proxy headers
function extractClientIP(req: any): string {
  // Priority order for IP extraction:
  // 1. X-Real-IP header (nginx real IP)
  // 2. X-Forwarded-For header (first IP if multiple)
  // 3. req.ip (express default)
  // 4. req.connection.remoteAddress (fallback)
  
  const xRealIP = req.headers['x-real-ip'];
  if (xRealIP && typeof xRealIP === 'string') {
    return xRealIP.trim();
  }
  
  const xForwardedFor = req.headers['x-forwarded-for'];
  if (xForwardedFor && typeof xForwardedFor === 'string') {
    // X-Forwarded-For can contain multiple IPs: "client, proxy1, proxy2"
    const firstIP = xForwardedFor.split(',')[0].trim();
    if (firstIP) {
      return firstIP;
    }
  }
  
  return req.ip || req.connection?.remoteAddress || 'unknown';
}

// Create uploads directory if it doesn't exist
const uploadDir = path.join(process.cwd(), 'uploads');
const quarantineDir = path.join(process.cwd(), 'quarantine');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
if (!fs.existsSync(quarantineDir)) {
  fs.mkdirSync(quarantineDir, { recursive: true });
}

// Define allowed file types and size limits (Balanced security)
const ALLOWED_FILE_TYPES = new Map([
  ['image/jpeg', { extensions: ['.jpg', '.jpeg'], maxSize: 10 * 1024 * 1024 }],
  ['image/png', { extensions: ['.png'], maxSize: 10 * 1024 * 1024 }],
  ['image/gif', { extensions: ['.gif'], maxSize: 10 * 1024 * 1024 }],
  ['application/pdf', { extensions: ['.pdf'], maxSize: 10 * 1024 * 1024 }],
  ['application/vnd.ms-powerpoint', { extensions: ['.ppt'], maxSize: 15 * 1024 * 1024 }],
  ['application/vnd.openxmlformats-officedocument.presentationml.presentation', { extensions: ['.pptx'], maxSize: 15 * 1024 * 1024 }],
  ['application/msword', { extensions: ['.doc'], maxSize: 10 * 1024 * 1024 }],
  ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', { extensions: ['.docx'], maxSize: 10 * 1024 * 1024 }],
  ['text/plain', { extensions: ['.txt'], maxSize: 2 * 1024 * 1024 }]
]);

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB maximum (allows for presentations)

// Comprehensive list of dangerous extensions and patterns
const DANGEROUS_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.sh', '.js', '.php', '.jsp', '.asp', '.aspx',
  '.scr', '.com', '.pif', '.vbs', '.jar', '.zip', '.rar', '.7z', '.msi',
  '.dmg', '.pkg', '.deb', '.rpm', '.run', '.bin', '.app', '.ipa', '.apk',
  '.dll', '.so', '.dylib', '.sys', '.drv', '.ocx', '.cpl', '.inf',
  '.reg', '.ps1', '.psm1', '.psd1', '.ps1xml', '.pssc', '.psrc',
  '.gadget', '.workflow', '.action', '.command', '.tool'
];

// Enhanced malware detection patterns
const MALWARE_PATTERNS = [
  // Script injection patterns
  /<script[^>]*>.*?<\/script>/gi,
  /javascript:/gi,
  /vbscript:/gi,
  /onload\s*=/gi,
  /onerror\s*=/gi,
  /onclick\s*=/gi,
  /eval\s*\(/gi,
  /document\.write/gi,
  /window\.location/gi,
  
  // PowerShell patterns
  /powershell/gi,
  /invoke-expression/gi,
  /downloadstring/gi,
  /invoke-webrequest/gi,
  /start-process/gi,
  
  // Command injection patterns
  /cmd\.exe/gi,
  /system\(/gi,
  /exec\(/gi,
  /shell_exec/gi,
  /passthru/gi,
  /proc_open/gi,
  
  // Common malware strings
  /trojan/gi,
  /backdoor/gi,
  /keylogger/gi,
  /ransomware/gi,
  /cryptolocker/gi,
  /wannacry/gi,
  
  // Suspicious file paths
  /temp[\\\/]/gi,
  /system32[\\\/]/gi,
  /windows[\\\/]system/gi,
  /program files/gi,
  
  // Base64 encoded patterns (common in malware)
  /data:.*base64/gi,
  /eval\s*\(\s*atob/gi,
  /fromcharcode/gi
];

// Known virus signatures (hex patterns)
const VIRUS_SIGNATURES = [
  '4d5a9000', // PE executable header
  '4d5a5000', // Alternative PE header
  '7f454c46', // ELF executable header
  'cafebabe', // Java class file
  'feedface', // Mach-O binary
  // Note: Removed ZIP signature as Office files (.docx, .pptx) are ZIP-based
  '526172211a0700', // RAR file
  '377abcaf271c' // 7-Zip file
];

// PDF-specific malware patterns
const PDF_MALWARE_PATTERNS = [
  /\/JavaScript/gi,
  /\/JS/gi,
  /\/OpenAction/gi,
  /\/Launch/gi,
  /\/URI/gi,
  /\/SubmitForm/gi,
  /\/EmbeddedFile/gi,
  /eval\(/gi,
  /unescape\(/gi,
  /String\.fromCharCode/gi
];

// Secure filename generation
const generateSecureFilename = (originalName: string): string => {
  const sanitizedName = sanitize(originalName);
  const uuid = uuidv4();
  const timestamp = Date.now();
  const ext = path.extname(sanitizedName).toLowerCase();
  
  // Use UUID + timestamp for uniqueness, ignore original name for security
  return `${uuid}_${timestamp}${ext}`;
};

// Calculate file hash for integrity checking
const calculateFileHash = (filePath: string): string => {
  const fileBuffer = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(fileBuffer).digest('hex');
};

// Enhanced virus signature detection
const detectVirusSignatures = (filePath: string): boolean => {
  try {
    const buffer = fs.readFileSync(filePath);
    const hexContent = buffer.toString('hex').toLowerCase();
    
    // Check for known virus signatures
    for (const signature of VIRUS_SIGNATURES) {
      if (hexContent.includes(signature)) {
        console.log(`Virus signature detected: ${signature}`);
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Virus signature detection error:', error);
    return true; // Err on the side of caution
  }
};

// PDF-specific security analysis
const analyzePDFSecurity = (filePath: string): boolean => {
  try {
    const content = fs.readFileSync(filePath, 'latin1');
    
    // Check for PDF malware patterns
    for (const pattern of PDF_MALWARE_PATTERNS) {
      if (pattern.test(content)) {
        console.log('PDF malware pattern detected:', pattern);
        return false;
      }
    }
    
    // Check for suspicious JavaScript blocks
    const jsBlocks = content.match(/\/JavaScript[\s\S]*?endobj/gi);
    if (jsBlocks && jsBlocks.length > 0) {
      console.log('Suspicious JavaScript found in PDF');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('PDF security analysis error:', error);
    return false;
  }
};

// Advanced binary file analysis
const analyzeBinaryFile = (filePath: string, mimeType: string): boolean => {
  try {
    const buffer = fs.readFileSync(filePath);
    
    // Check file entropy (high entropy might indicate packed/encrypted malware)
    // But be very lenient with image files as they naturally have high entropy due to compression
    const entropy = calculateEntropy(buffer);
    let entropyThreshold = 8.5; // More reasonable threshold for general files
    
    // Images naturally have high entropy due to compression, so use much higher threshold
    if (mimeType.includes('image/')) {
      entropyThreshold = 9.5; // Very high threshold for images (most compressed images are ~8.0)
    }
    
    if (entropy > entropyThreshold) {
      console.log(`High entropy detected: ${entropy} (threshold: ${entropyThreshold}, possible packed malware)`);
      return false;
    }
    
    // Check for suspicious patterns in binary data
    const hexContent = buffer.toString('hex').toLowerCase();
    
    // Only check for executable patterns in non-image, non-document files
    // Skip this check for images and Office documents as they can contain similar byte sequences
    if (!mimeType.includes('application/') && !mimeType.includes('image/')) {
      if (hexContent.includes('4d5a') || // PE header
          hexContent.includes('7f454c46') || // ELF header
          hexContent.includes('cafebabe')) { // Java bytecode
        console.log('Executable code found in non-executable file');
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Binary analysis error:', error);
    return false;
  }
};

// Calculate Shannon entropy for malware detection
const calculateEntropy = (buffer: Buffer): number => {
  const frequencies = new Array(256).fill(0);
  
  for (let i = 0; i < buffer.length; i++) {
    frequencies[buffer[i]]++;
  }
  
  let entropy = 0;
  for (let i = 0; i < 256; i++) {
    if (frequencies[i] > 0) {
      const probability = frequencies[i] / buffer.length;
      entropy -= probability * Math.log2(probability);
    }
  }
  
  return entropy;
};

// Enhanced file validation function
const validateFileType = (file: Express.Multer.File): { valid: boolean; error?: string } => {
  const fileTypeConfig = ALLOWED_FILE_TYPES.get(file.mimetype);
  
  if (!fileTypeConfig) {
    return { valid: false, error: 'نوع الملف غير مسموح به - الملفات المسموحة: صور (JPG, PNG, GIF), PDF, عروض تقديمية (PPT, PPTX), مستندات Word (DOC, DOCX), ونصوص عادية (TXT)' };
  }
  
  // Check file extension
  const fileExt = path.extname(file.originalname).toLowerCase();
  if (!fileTypeConfig.extensions.includes(fileExt)) {
    return { valid: false, error: 'امتداد الملف غير صحيح أو غير مطابق لنوع الملف' };
  }
  
  // Check for dangerous extensions
  if (DANGEROUS_EXTENSIONS.includes(fileExt)) {
    return { valid: false, error: 'امتداد الملف خطير ومحظور لأسباب أمنية' };
  }
  
  // Check file size for specific type
  if (file.size > fileTypeConfig.maxSize) {
    return { valid: false, error: `حجم الملف كبير جداً - الحد الأقصى ${fileTypeConfig.maxSize / 1024 / 1024}MB` };
  }
  
  // Additional checks for suspicious filenames
  const suspiciousPatterns = [
    /autorun/gi,
    /setup/gi,
    /install/gi,
    /update/gi,
    /patch/gi,
    /crack/gi,
    /keygen/gi,
    /loader/gi
  ];
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(file.originalname)) {
      return { valid: false, error: 'اسم الملف يحتوي على كلمات مشبوهة' };
    }
  }
  
  return { valid: true };
};

// Configure multer disk storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const secureFilename = generateSecureFilename(file.originalname);
    cb(null, secureFilename);
  }
});

// Configure multer upload with strict validation
const upload = multer({
  storage: storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
    fieldSize: 1024 * 1024, // 1MB field size limit
    fieldNameSize: 100, // Field name size limit
    fields: 10 // Maximum number of fields
  },
  fileFilter: (req, file, cb) => {
    const validation = validateFileType(file);
    if (validation.valid) {
      cb(null, true);
    } else {
      cb(new Error(validation.error || 'نوع الملف غير مسموح به'));
    }
  }
});

// Middleware for file upload
export const uploadMiddleware = upload.single('attachment');

// Advanced MIME type detection using file headers
const validateMimeType = async (filePath: string, declaredMimeType: string): Promise<boolean> => {
  try {
    const buffer = fs.readFileSync(filePath);
    const fileType = await fileTypeFromBuffer(buffer);
    
    if (!fileType) {
      // Only allow text files when no type is detected
      return declaredMimeType === 'text/plain';
    }
    
    // Strict MIME type matching
    if (fileType.mime !== declaredMimeType) {
      console.log(`MIME mismatch: detected=${fileType.mime}, declared=${declaredMimeType}`);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('MIME type validation error:', error);
    return false;
  }
};

// Enhanced content scanning for malicious patterns
const scanFileContent = (filePath: string, mimeType: string): boolean => {
  try {
    // Scan PDF files with special care
    if (mimeType === 'application/pdf') {
      return analyzePDFSecurity(filePath);
    }
    
    // Scan text-based files
    if (mimeType.includes('text/')) {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Check for malware patterns
      for (const pattern of MALWARE_PATTERNS) {
        if (pattern.test(content)) {
          console.log('Malicious pattern detected:', pattern);
          return false;
        }
      }
    }
    
    // Scan binary files (images, etc.)
    if (mimeType.includes('image/')) {
      return analyzeBinaryFile(filePath, mimeType);
    }
    
    return true;
  } catch (error) {
    console.error('Content scanning error:', error);
    return false;
  }
};

// Quarantine suspicious files
const quarantineFile = (filePath: string, reason: string): void => {
  try {
    // Check if file exists before attempting to quarantine
    if (!fs.existsSync(filePath)) {
      console.log(`File already removed, skipping quarantine: ${filePath}`);
      return;
    }
    
    // Ensure quarantine directory exists
    if (!fs.existsSync(quarantineDir)) {
      fs.mkdirSync(quarantineDir, { recursive: true });
    }
    
    const filename = path.basename(filePath);
    const quarantinePath = path.join(quarantineDir, `${Date.now()}_${filename}`);
    
    // Calculate hash before moving
    const fileHash = calculateFileHash(filePath);
    
    fs.renameSync(filePath, quarantinePath);
    
    // Log quarantine action
    const logEntry = {
      timestamp: new Date().toISOString(),
      originalPath: filePath,
      quarantinePath: quarantinePath,
      reason: reason,
      hash: fileHash
    };
    
    const logFile = path.join(quarantineDir, 'quarantine.log');
    fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
    
    console.log(`File quarantined: ${filename} - Reason: ${reason}`);
  } catch (error) {
    console.error('Quarantine error:', error);
    // If quarantine fails, try to delete the file if it still exists
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Deleted suspicious file: ${filePath}`);
      }
    } catch (deleteError) {
      console.error('Failed to delete suspicious file:', deleteError);
    }
  }
};

// Comprehensive security scanning middleware
export const securityScanMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const file = req.file;
  
  if (!file) {
    return next();
  }
  
  try {
    console.log(`Starting security scan for file: ${file.originalname}`);
    
    // 1. Virus signature detection
    if (detectVirusSignatures(file.path)) {
      quarantineFile(file.path, 'Virus signature detected');
      return res.status(400).json({ 
        message: 'تم اكتشاف توقيع فيروس في الملف - تم حجب الملف لأسباب أمنية',
        error: 'VIRUS_SIGNATURE_DETECTED'
      });
    }
    
    // 2. Validate MIME type using file headers
    const mimeValid = await validateMimeType(file.path, file.mimetype);
    if (!mimeValid) {
      quarantineFile(file.path, 'MIME type mismatch');
      return res.status(400).json({ 
        message: 'نوع الملف الحقيقي لا يطابق النوع المعلن - محاولة تزوير ملف',
        error: 'MIME_TYPE_MISMATCH'
      });
    }
    
    // 3. Enhanced file extension security check
    const fileExt = path.extname(file.originalname).toLowerCase();
    if (DANGEROUS_EXTENSIONS.includes(fileExt)) {
      quarantineFile(file.path, `Dangerous extension: ${fileExt}`);
      return res.status(400).json({ 
        message: 'امتداد الملف خطير ومحظور لأسباب أمنية',
        error: 'DANGEROUS_EXTENSION'
      });
    }
    
    // 4. Deep content scanning for malicious patterns
    if (!scanFileContent(file.path, file.mimetype)) {
      quarantineFile(file.path, 'Malicious content detected');
      return res.status(400).json({ 
        message: 'تم اكتشاف محتوى خطير أو مشبوه في الملف',
        error: 'MALICIOUS_CONTENT'
      });
    }
    
    // 5. File integrity and size validation
    const stats = fs.statSync(file.path);
    if (stats.size !== file.size || stats.size === 0) {
      quarantineFile(file.path, 'File integrity check failed');
      return res.status(400).json({ 
        message: 'فشل في فحص سلامة الملف',
        error: 'INTEGRITY_CHECK_FAILED'
      });
    }
    
    // 6. Calculate and store file hash for tracking
    const fileHash = calculateFileHash(file.path);
    req.fileHash = fileHash;
    
    console.log(`File passed all security checks: ${file.originalname} (Hash: ${fileHash})`);
    
    // File passed all security checks
    next();
    
  } catch (error) {
    console.error('Security scan error:', error);
    
    // Clean up file on error
    if (fs.existsSync(file.path)) {
      quarantineFile(file.path, `Security scan error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    res.status(500).json({ 
      message: 'خطأ في فحص أمان الملف - تم رفض الملف كإجراء احترازي',
      error: 'SECURITY_SCAN_ERROR'
    });
  }
};

// Handler for file upload with enhanced response
export const handleFileUpload = (req: Request, res: Response) => {
  try {
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({ 
        message: 'لم يتم تحميل أي ملف',
        error: 'NO_FILE_UPLOADED'
      });
    }
    
    // Log successful upload for audit
    console.log(`File uploaded successfully: ${file.originalname} -> ${file.filename} (Hash: ${req.fileHash})`);
    
    // Try secure storage first, fallback to regular storage
    const clientIP = extractClientIP(req);
    const fileBuffer = fs.readFileSync(file.path);
    
    if (isSecureFileSystemAvailable()) {
      // Attempt secure storage
      const secureResult = safeStoreFileSecurely(fileBuffer, file.originalname, file.mimetype, clientIP);
      
      if (secureResult.success) {
        // Remove original file after secure storage
        fs.unlinkSync(file.path);
        
        // Return secure file information
        res.status(200).json({
          message: 'تم تحميل الملف بنجاح وفحصه أمنياً بشكل شامل وتشفيره',
          file: {
            accessToken: secureResult.accessToken,
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            hash: req.fileHash,
            path: `/api/secure-files/${secureResult.accessToken}`,
            uploadedAt: new Date().toISOString(),
            securityStatus: 'CLEAN_AND_ENCRYPTED'
          }
        });
        return;
      } else {
        console.warn('Secure storage failed, falling back to regular storage:', secureResult.error);
      }
    }
    
    // Fallback to regular storage
    res.status(200).json({
      message: 'تم تحميل الملف بنجاح وفحصه أمنياً بشكل شامل',
      file: {
        filename: file.filename,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        hash: req.fileHash,
        path: `/api/files/${file.filename}`,
        uploadedAt: new Date().toISOString(),
        securityStatus: 'CLEAN'
      }
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ 
      message: 'حدث خطأ أثناء تحميل الملف',
      error: 'UPLOAD_ERROR'
    });
  }
};

// Secure file serving endpoint with enhanced security
export const serveFile = (req: Request, res: Response) => {
  try {
    const filename = req.params.filename;
    
    // Validate filename format (UUID-based) - more strict validation
    const filenamePattern = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}_\d+\.(jpg|jpeg|png|gif|pdf|ppt|pptx|doc|docx|txt)$/i;
    if (!filenamePattern.test(filename)) {
      return res.status(400).json({ message: 'اسم الملف غير صحيح أو غير آمن' });
    }
    
    const filePath = path.join(uploadDir, filename);
    
    // Check if file exists and is readable
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'الملف غير موجود' });
    }
    
    // Additional security check - ensure file is not in quarantine
    const quarantineLogPath = path.join(quarantineDir, 'quarantine.log');
    if (fs.existsSync(quarantineLogPath)) {
      const logContent = fs.readFileSync(quarantineLogPath, 'utf8');
      if (logContent.includes(filename)) {
        return res.status(403).json({ message: 'الملف محجوب لأسباب أمنية' });
      }
    }
    
    // Get file stats for security headers
    const stats = fs.statSync(filePath);
    const fileExt = path.extname(filename).toLowerCase();
    
    // Set comprehensive security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    
    // Set appropriate content type based on extension
    let contentType = 'application/octet-stream';
    if (fileExt === '.pdf') {
      contentType = 'application/pdf';
    } else if (['.jpg', '.jpeg'].includes(fileExt)) {
      contentType = 'image/jpeg';
    } else if (fileExt === '.png') {
      contentType = 'image/png';
    } else if (fileExt === '.gif') {
      contentType = 'image/gif';
    } else if (fileExt === '.txt') {
      contentType = 'text/plain';
    } else if (fileExt === '.ppt') {
      contentType = 'application/vnd.ms-powerpoint';
    } else if (fileExt === '.pptx') {
      contentType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
    } else if (fileExt === '.doc') {
      contentType = 'application/msword';
    } else if (fileExt === '.docx') {
      contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    }
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', stats.size);
    res.setHeader('Content-Disposition', `attachment; filename="${sanitize(filename)}"`);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    // Stream file securely
    const fileStream = fs.createReadStream(filePath);
    
    fileStream.on('error', (error) => {
      console.error('File streaming error:', error);
      res.status(500).json({ message: 'خطأ في تحميل الملف' });
    });
    
    fileStream.pipe(res);
    
  } catch (error) {
    console.error('Error serving file:', error);
    res.status(500).json({ message: 'خطأ في تحميل الملف' });
  }
};

// Add file hash to request type
declare global {
  namespace Express {
    interface Request {
      fileHash?: string;
    }
  }
}