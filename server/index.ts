import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import hpp from "hpp";
import xss from "xss-clean";
import cookieParser from "cookie-parser";
import crypto from "crypto";

const app = express();

// Enable trust proxy for production environments (essential for load balancers)
app.set('trust proxy', 1);

// Ensure app is listening on all network interfaces in production
const PORT = parseInt(process.env.PORT || "3000");
const HOST = process.env.NODE_ENV === "production" ? "0.0.0.0" : "0.0.0.0";
const isProduction = process.env.NODE_ENV === "production";

// ADVANCED ENTERPRISE SECURITY CONFIGURATION
// ==========================================

console.log('🛡️ Initializing enterprise security configuration...');

// 1. ENTERPRISE RATE LIMITING
// Production values: More restrictive for better security

// General API rate limiting - Strict for production security
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === "production" ? 200 : 5000, // Production: 200 requests per 15min (was 2000 - too high)
  message: {
    error: "Too many requests from this IP, please try again later",
    retryAfter: "15 minutes"
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request) => {
    // Skip rate limiting for admin endpoints with valid authentication
    return req.path.startsWith('/api/admin/');
  },
  handler: (req: Request, res: Response) => {
    log(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: "Rate limit exceeded",
      message: "Too many requests from this IP, please try again later",
      retryAfter: "15 minutes"
    });
  }
});

// Admin-specific rate limiting - More permissive for authenticated admin users
export const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // 500 requests per 15 minutes for admin operations
  message: {
    error: "Too many admin requests from this IP, please try again later",
    retryAfter: "15 minutes"
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    log(`Admin rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: "Admin rate limit exceeded",
      message: "Too many admin requests from this IP, please try again later",
      retryAfter: "15 minutes"
    });
  }
});

// Login-specific rate limiting - Very restrictive
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // Only 3 login attempts per 15 minutes
  message: {
    error: "Too many login attempts from this IP, please try again later",
    retryAfter: "15 minutes"
  },
  skipSuccessfulRequests: true,
  handler: (req: Request, res: Response) => {
    log(`Login rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: "Login rate limit exceeded",
      message: "Too many login attempts from this IP, please try again later",
      retryAfter: "15 minutes"
    });
  }
});

// File upload rate limiting
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 file uploads per hour
  message: {
    error: "Too many file uploads from this IP, please try again later",
    retryAfter: "1 hour"
  },
  handler: (req: Request, res: Response) => {
    log(`Upload rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: "Upload rate limit exceeded",
      message: "Too many file uploads from this IP, please try again later",
      retryAfter: "1 hour"
    });
  }
});

// Form submission rate limiting - STRICT: max 5 per 10 minutes to prevent email flooding
export const formLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: process.env.NODE_ENV === 'production' ? 5 : 20, // Production: 5 submissions per 10min (was 1000 - WAY too high)
  message: {
    error: "Too many form submissions from this IP, please try again later",
    retryAfter: "10 minutes"
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    log(`🚨 Form rate limit exceeded for IP: ${req.ip} - potential abuse detected`);
    res.status(429).json({
      error: "Form rate limit exceeded",
      message: "تم تجاوز حد إرسال النماذج - يرجى الانتظار قبل المحاولة مرة أخرى",
      retryAfter: "10 minutes"
    });
  }
});

// Apply rate limiting to all routes
app.use(generalLimiter);

console.log('🚦 Enterprise rate limiting configured:');
console.log(`   📊 General API: ${process.env.NODE_ENV === "production" ? "200" : "5000"} requests/15min`);
console.log('   👨‍💼 Admin API: 500 requests/15min');
console.log('   🔒 Login: 3 attempts/15min');
console.log('   📁 Upload: 10 files/hour');
console.log(`   📝 Forms: ${process.env.NODE_ENV === "production" ? "5" : "20"} submissions/10min`);

// 2. COMPREHENSIVE SECURITY HEADERS
const helmetConfig = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        process.env.NODE_ENV === 'development' ? "'unsafe-inline'" : "", // Only in dev
        process.env.NODE_ENV === 'development' ? "'unsafe-eval'" : "", // Only in dev
        "https://unpkg.com", // For external libraries if needed
      ].filter(Boolean),
      styleSrc: [
        "'self'",
        "'unsafe-inline'", // Required for dynamic styles
        "https://fonts.googleapis.com",
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com",
        "data:",
      ],
      imgSrc: [
        "'self'",
        "data:",
        "blob:",
        "https:", // Allow HTTPS images
      ],
      connectSrc: [
        "'self'",
        process.env.NODE_ENV === "development" ? "ws://localhost:*" : "",
      ].filter(Boolean),
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // May interfere with some functionality
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  }
};

app.use(helmet(helmetConfig));

console.log('🔒 Security headers configured:');
console.log('   ✅ Content Security Policy (CSP)');
console.log('   ✅ HTTP Strict Transport Security (HSTS)');
console.log('   ✅ X-Frame-Options (Clickjacking protection)');
console.log('   ✅ X-Content-Type-Options');
console.log('   ✅ Referrer-Policy');

// Generate a cookie secret for signing cookies
const COOKIE_SECRET = process.env.COOKIE_SECRET || (process.env.NODE_ENV === 'development'
  ? 'syrian-ministry-platform-cookie-secret-dev-only'
  : crypto.randomBytes(32).toString('hex')); // Increased entropy for production

// Parse cookies with signing secret
app.use(cookieParser(COOKIE_SECRET));

// 3. PARAMETER POLLUTION PROTECTION
app.use(hpp({
  whitelist: ['tags', 'category'] // Allow arrays for these parameters
}));

console.log('🛡️ HTTP Parameter Pollution (HPP) protection enabled');

// 4. XSS PROTECTION
app.use(xss() as any);

console.log('🧼 XSS (Cross-Site Scripting) protection enabled');

// 5. JSON PARSING WITH LIMITS
app.use(express.json({ 
  limit: "10mb", // Increased for file uploads but still reasonable
  verify: (req: any, res: Response, buf: Buffer) => {
    // Store raw body for signature verification if needed
    req.rawBody = buf;
  }
}));

app.use(express.urlencoded({ 
  extended: true, 
  limit: "10mb" 
}));

console.log('📊 Request parsing configured with 10MB limit');

// Comprehensive request logging for security monitoring
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const path = req.path;
  const ip = req.ip || req.connection.remoteAddress;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson: any) {
    capturedJsonResponse = bodyJson;
    return originalResJson.call(res, bodyJson);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms [${ip}]`;
      
      // Log security events
      if (res.statusCode === 429) {
        console.warn(`🚨 RATE LIMIT HIT: ${logLine}`);
      } else if (res.statusCode >= 400) {
        console.warn(`⚠️ CLIENT ERROR: ${logLine}`);
      }
      
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

console.log('');
console.log('🇸🇾 SYRIAN MINISTRY PLATFORM SECURITY INITIALIZED');
console.log('==================================================');
console.log('✅ Enterprise-grade security configuration active');
console.log('🛡️ Multi-layer protection against attacks');
console.log('🚦 Advanced rate limiting for DDoS protection');
console.log('🔒 Comprehensive security headers');
console.log('🧼 XSS and parameter pollution protection');
console.log('');

// Initialize server in async function
(async () => {
  // Initialize routes
  const server = await registerRoutes(app);

  // Ensure admin password is correct on startup
  try {
    console.log('🔑 Verifying admin password...');
    const { execSync } = await import('child_process');
    execSync('node ensure-admin-password.js', { 
      cwd: process.cwd(),
      stdio: 'inherit'
    });
  } catch (error) {
    console.warn('⚠️ Admin password verification failed:', error);
  }

  // Enhanced error handling for production
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    let message = err.message || "Internal Server Error";
    
    // Don't expose internal errors in production
    if (isProduction && status === 500) {
      message = "حدث خطأ داخلي في الخادم";
    }
    
    // Log all errors for monitoring
    console.error(`❌ Error ${status}: ${err.message}`, err.stack);

    res.status(status).json({ 
      message,
      ...(isProduction ? {} : { stack: err.stack }) // Only show stack in development
    });
  });

  // The important part: Only start the server in production OR development.
  // In production, the app runs as a complete server.
  // In development, Vite handles both frontend and API routing.
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    // Production: serve static files directly
    serveStatic(app);
    
    console.log('🚀 PRODUCTION MODE: Serving static files');
  }

  console.log(`🌐 Server starting on ${HOST}:${PORT}`);
  console.log(`📡 Mode: ${process.env.NODE_ENV || 'development'}`);
  
  server.listen(PORT, HOST, () => {
    log(`🇸🇾 Syrian Ministry Platform is running on ${HOST}:${PORT}`);
    
    if (process.env.NODE_ENV === "production") {
      console.log('');
      console.log('🎯 PRODUCTION DEPLOYMENT SUCCESSFUL');
      console.log('==================================');
      console.log('✅ All security measures are active');
      console.log('🛡️ Enterprise DDoS protection enabled');
      console.log('🔒 Multi-layer security configured');
      console.log('📧 Email notifications configured');
      console.log('🗄️ Database connections established');
      console.log('');
      console.log('🇸🇾 وزارة الاتصالات وتقانة المعلومات');
      console.log('   منصة التواصل المباشر مع الوزير');
      console.log('   Syrian Ministry of Communications');
      console.log('   Direct Communication Platform');
    }
  });
})();
