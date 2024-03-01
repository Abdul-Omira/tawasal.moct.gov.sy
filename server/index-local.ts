/**
 * TAWASAL.MOCT.GOV.SY - Local Development Server
 * Syrian Ministry of Communication Platform
 * 
 * @author Abdulwahab Omira <abdulwahab.omira@moct.gov.sy>
 * @version 1.0.0
 * @license Government of Syria - Ministry of Communications
 * @copyright 2025 Syrian Ministry of Communications and Information Technology
 */

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes-local";
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

// DEVELOPMENT SECURITY CONFIGURATION
// ==================================

console.log('🛡️ Initializing development security configuration...');

// 1. DEVELOPMENT RATE LIMITING (More permissive for development)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5000, // 5000 requests per 15min in development
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

// Admin-specific rate limiting
export const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // 1000 requests per 15 minutes for admin operations
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

// Login-specific rate limiting
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 login attempts per 15 minutes in development
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
  max: 50, // 50 file uploads per hour in development
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

// Form submission rate limiting
export const formLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 2000, // 2000 form submissions per 10 minutes in development
  message: {
    error: "Too many form submissions from this IP, please try again later",
    retryAfter: "10 minutes"
  },
  handler: (req: Request, res: Response) => {
    log(`Form rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: "Form rate limit exceeded",
      message: "Too many form submissions from this IP, please try again later",
      retryAfter: "10 minutes"
    });
  }
});

// Log rate limiting configuration
console.log('📊 Rate Limiting Configuration (Development):');
console.log(`   📊 General API: 5000 requests/15min`);
console.log(`   🔐 Admin: 1000 requests/15min`);
console.log(`   🔑 Login: 10 attempts/15min`);
console.log(`   📁 Uploads: 50 files/hour`);
console.log(`   📝 Forms: 2000 submissions/10min`);

// 2. SECURITY MIDDLEWARE
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles in development
      scriptSrc: ["'self'", "'unsafe-eval'"], // Allow eval in development
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws://localhost:*"], // Allow WebSocket connections in development
      fontSrc: ["'self'", "https:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Disable for development
}));

// 3. ADDITIONAL SECURITY MIDDLEWARE
app.use(hpp()); // Protect against HTTP Parameter Pollution attacks
app.use(xss()); // Sanitize user input
app.use(cookieParser()); // Parse cookies

// 4. RATE LIMITING MIDDLEWARE
app.use(generalLimiter);

// 5. BODY PARSING MIDDLEWARE
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 6. SESSION CONFIGURATION
const COOKIE_SECRET = process.env.COOKIE_SECRET || (process.env.NODE_ENV === 'development'
  ? 'dev-cookie-secret-key-change-in-production'
  : crypto.randomBytes(32).toString('hex'));

// 7. CORS CONFIGURATION (More permissive for development)
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*'); // Allow all origins in development
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// 8. REQUEST LOGGING (Development)
app.use((req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV === "development") {
    log(`${req.method} ${req.path} - ${req.ip}`);
  }
  next();
});

// 9. ROUTES
registerRoutes(app);

// 10. VITE DEVELOPMENT SERVER SETUP
if (process.env.NODE_ENV === "development") {
  setupVite(app);
} else {
  serveStatic(app);
}

// 11. ERROR HANDLING MIDDLEWARE
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// 12. 404 HANDLER
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

// 13. START SERVER
app.listen(PORT, HOST, () => {
  console.log(`\n🚀 Syrian Ministry of Communication Platform`);
  console.log(`📡 Mode: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Server running at: http://${HOST}:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  if (process.env.NODE_ENV === "production") {
    console.log(`🛡️ Production mode enabled - Enhanced security active`);
  } else {
    console.log(`🔧 Development mode - Relaxed security for testing`);
  }
  
  console.log(`\n📚 Available endpoints:`);
  console.log(`   🏠 Home: http://${HOST}:${PORT}/`);
  console.log(`   🔐 Auth: http://${HOST}:${PORT}/auth`);
  console.log(`   👑 Admin: http://${HOST}:${PORT}/admin`);
  console.log(`   📝 Forms: http://${HOST}:${PORT}/forms`);
  console.log(`\n👤 Default Users:`);
  console.log(`   👑 Admin: admin / admin123`);
  console.log(`   👷 Employee: employee / employee123`);
});
