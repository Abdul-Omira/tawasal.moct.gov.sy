import { Request, Response, NextFunction } from 'express';

/**
 * Security headers middleware to protect against common vulnerabilities
 */
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  // Prevent clickjacking attacks
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS filter
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Content Security Policy
  res.setHeader('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "font-src 'self' data:; " +
    "connect-src 'self' ws: wss:; " +
    "frame-ancestors 'none';"
  );
  
  // Strict Transport Security (HSTS)
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  
  // Permissions Policy
  res.setHeader('Permissions-Policy', 
    'camera=(), ' +
    'microphone=(), ' +
    'geolocation=(), ' +
    'payment=(), ' +
    'usb=(), ' +
    'magnetometer=(), ' +
    'accelerometer=()'
  );
  
  next();
}

/**
 * CSRF protection for state-changing operations
 */
export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  // Skip CSRF check for GET requests
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return next();
  }
  
  // Check Origin header for production
  if (process.env.NODE_ENV === 'production') {
    const origin = req.get('origin');
    const host = req.get('host');
    
    if (!origin || !host) {
      return res.status(403).json({ message: 'Forbidden: Missing origin header' });
    }
    
    const allowedOrigins = [
      `https://${host}`,
      `http://${host}`,
      process.env.FRONTEND_URL
    ].filter(Boolean);
    
    if (!allowedOrigins.includes(origin)) {
      return res.status(403).json({ message: 'Forbidden: Invalid origin' });
    }
  }
  
  next();
}

/**
 * Prevent directory traversal attacks in file paths
 */
export function sanitizePath(filePath: string): string {
  // Remove any directory traversal patterns
  return filePath
    .replace(/\.\./g, '')
    .replace(/[\/\\]{2,}/g, '/')
    .replace(/^[\/\\]/, '');
}

/**
 * Rate limiting configuration for different endpoints
 */
export const rateLimitConfig = {
  login: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts
    message: 'Too many login attempts, please try again later'
  },
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests
    message: 'Too many requests, please try again later'
  },
  admin: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // 200 requests for admin
    message: 'Too many requests, please try again later'
  }
};