/**
 * Syrian Ministry of Communication - Military-Grade Rate Limiting
 * Advanced DDoS Protection and Rate Limiting System
 * 
 * @author Security Team - Emergency Response
 * @version 3.0.0 - Maximum Security Implementation
 */

import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

// Security configuration
const SECURITY_CONFIG = {
  // Base rate limits (per 15 minutes)
  BASE_LIMITS: {
    api: 100,           // General API calls
    form: 5,           // Form submissions (very strict)
    captcha: 20,       // CAPTCHA generation
    upload: 3,         // File uploads
    admin: 30,         // Admin operations
    login: 5           // Login attempts
  },
  
  // Progressive blocking thresholds
  PROGRESSIVE_BLOCKING: {
    warning: 0.7,      // At 70% of limit, start warning
    slowdown: 0.8,     // At 80% of limit, start slowing down
    block: 1.0         // At 100% of limit, block completely
  },
  
  // Block durations (in milliseconds)
  BLOCK_DURATIONS: {
    short: 5 * 60 * 1000,      // 5 minutes
    medium: 30 * 60 * 1000,    // 30 minutes
    long: 2 * 60 * 60 * 1000,  // 2 hours
    extended: 24 * 60 * 60 * 1000 // 24 hours
  },
  
  // Time windows
  WINDOWS: {
    standard: 15 * 60 * 1000,   // 15 minutes
    short: 5 * 60 * 1000,       // 5 minutes
    extended: 60 * 60 * 1000    // 1 hour
  }
};

// IP reputation and tracking
interface IPSecurityProfile {
  ip: string;
  requestCount: number;
  failedAttempts: number;
  securityViolations: number;
  lastViolation: Date;
  riskScore: number;
  isBlocked: boolean;
  blockExpires?: Date;
  userAgent: string;
  firstSeen: Date;
  suspiciousPatterns: string[];
}

// In-memory store for IP profiles (use Redis in production)
const ipProfiles = new Map<string, IPSecurityProfile>();

/**
 * Get or create IP security profile
 */
function getIPProfile(req: Request): IPSecurityProfile {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const userAgent = req.get('user-agent') || 'unknown';
  
  let profile = ipProfiles.get(ip);
  
  if (!profile) {
    profile = {
      ip,
      requestCount: 0,
      failedAttempts: 0,
      securityViolations: 0,
      lastViolation: new Date(),
      riskScore: 0,
      isBlocked: false,
      userAgent,
      firstSeen: new Date(),
      suspiciousPatterns: []
    };
    ipProfiles.set(ip, profile);
  }
  
  return profile;
}

/**
 * Update IP risk score based on behavior
 */
function updateRiskScore(profile: IPSecurityProfile, reason: string): void {
  const riskFactors = {
    'rapid_requests': 10,
    'failed_captcha': 15,
    'security_violation': 25,
    'suspicious_user_agent': 20,
    'form_spam': 30,
    'multiple_violations': 40
  };
  
  const increment = riskFactors[reason as keyof typeof riskFactors] || 5;
  profile.riskScore += increment;
  
  // Cap risk score at 100
  if (profile.riskScore > 100) {
    profile.riskScore = 100;
  }
  
  // Add suspicious pattern
  if (!profile.suspiciousPatterns.includes(reason)) {
    profile.suspiciousPatterns.push(reason);
  }
  
  console.log(`🚨 [RATE-LIMITER] IP ${profile.ip} risk score increased to ${profile.riskScore} (reason: ${reason})`);
}

/**
 * Block IP address with progressive duration
 */
function blockIP(profile: IPSecurityProfile, reason: string): void {
  profile.isBlocked = true;
  profile.lastViolation = new Date();
  
  // Determine block duration based on risk score and violation count
  let blockDuration: number;
  
  if (profile.securityViolations >= 5 || profile.riskScore >= 80) {
    blockDuration = SECURITY_CONFIG.BLOCK_DURATIONS.extended;
  } else if (profile.securityViolations >= 3 || profile.riskScore >= 60) {
    blockDuration = SECURITY_CONFIG.BLOCK_DURATIONS.long;
  } else if (profile.securityViolations >= 2 || profile.riskScore >= 40) {
    blockDuration = SECURITY_CONFIG.BLOCK_DURATIONS.medium;
  } else {
    blockDuration = SECURITY_CONFIG.BLOCK_DURATIONS.short;
  }
  
  profile.blockExpires = new Date(Date.now() + blockDuration);
  profile.securityViolations++;
  
  console.log(`🔒 [RATE-LIMITER] IP ${profile.ip} blocked for ${blockDuration / 60000} minutes (reason: ${reason})`);
}

/**
 * Check if IP should be blocked
 */
function shouldBlockIP(profile: IPSecurityProfile): boolean {
  // Check if already blocked and still in block period
  if (profile.isBlocked && profile.blockExpires && new Date() < profile.blockExpires) {
    return true;
  }
  
  // Unblock if block period has expired
  if (profile.isBlocked && profile.blockExpires && new Date() >= profile.blockExpires) {
    profile.isBlocked = false;
    profile.blockExpires = undefined;
    // Reduce risk score on successful unblock
    profile.riskScore = Math.max(0, profile.riskScore - 20);
    console.log(`🔓 [RATE-LIMITER] IP ${profile.ip} unblocked, risk score reduced to ${profile.riskScore}`);
  }
  
  return profile.isBlocked;
}

/**
 * Custom rate limit handler with security profiling
 */
function createSecureRateLimiter(options: {
  windowMs: number;
  max: number;
  message: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: Request) => string;
}) {
  const limiter = rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: { message: options.message, error: 'RATE_LIMIT_EXCEEDED' },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: options.skipSuccessfulRequests || false,
    skipFailedRequests: options.skipFailedRequests || false,
    keyGenerator: options.keyGenerator || ((req: Request) => req.ip || 'unknown'),
    handler: (req: Request, res: Response) => {
      const profile = getIPProfile(req);
      updateRiskScore(profile, 'rapid_requests');
      
      if (profile.riskScore >= 60) {
        blockIP(profile, 'excessive_rate_limit_violations');
      }
      
      console.log(`🚫 [RATE-LIMITER] Rate limit exceeded for IP ${profile.ip} (risk: ${profile.riskScore})`);
      
      res.status(429).json({
        message: options.message,
        error: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil(options.windowMs / 1000),
        riskLevel: profile.riskScore >= 80 ? 'critical' : 
                   profile.riskScore >= 60 ? 'high' : 
                   profile.riskScore >= 40 ? 'medium' : 'low'
      });
    },
    skip: (req: Request) => {
      const profile = getIPProfile(req);
      return shouldBlockIP(profile);
    }
  });
  
  return limiter;
}

/**
 * IP blocking middleware
 */
export function ipBlockingMiddleware(req: Request, res: Response, next: Function) {
  const profile = getIPProfile(req);
  
  if (shouldBlockIP(profile)) {
    const remainingTime = profile.blockExpires ? 
      Math.ceil((profile.blockExpires.getTime() - Date.now()) / 60000) : 0;
    
    console.log(`🛑 [RATE-LIMITER] Blocked IP ${profile.ip} attempted access (${remainingTime} min remaining)`);
    
    return res.status(403).json({
      message: 'تم حظر عنوان IP الخاص بك بسبب نشاط مشبوه',
      error: 'IP_BLOCKED',
      blockReason: 'متعددة',
      remainingTime: remainingTime,
      riskScore: profile.riskScore
    });
  }
  
  next();
}

/**
 * Security event logger middleware
 */
export function securityEventLogger(eventType: string) {
  return (req: Request, res: Response, next: Function) => {
    const profile = getIPProfile(req);
    profile.requestCount++;
    
    // Log security events
    console.log(`🔍 [SECURITY-EVENT] ${eventType} from IP ${profile.ip} (requests: ${profile.requestCount}, risk: ${profile.riskScore})`);
    
    // Check for suspicious user agents
    const suspiciousAgents = ['curl', 'wget', 'python', 'bot', 'scanner', 'crawler'];
    const userAgent = (req.get('user-agent') || '').toLowerCase();
    
    for (const suspicious of suspiciousAgents) {
      if (userAgent.includes(suspicious)) {
        updateRiskScore(profile, 'suspicious_user_agent');
        break;
      }
    }
    
    next();
  };
}

/**
 * Progressive slowdown middleware
 */
export function progressiveSlowdown(req: Request, res: Response, next: Function) {
  const profile = getIPProfile(req);
  
  // Calculate delay based on recent requests
  let delay = 0;
  if (profile.requestCount > 3) {
    delay = Math.min((profile.requestCount - 3) * 500, 5000);
  }
  
  if (delay > 0) {
    console.log(`⏳ [RATE-LIMITER] Slowing down IP ${profile.ip} by ${delay}ms`);
    setTimeout(() => next(), delay);
  } else {
    next();
  }
}

// Specific rate limiters for different endpoints
export const secureRateLimiters = {
  // General API protection
  api: createSecureRateLimiter({
    windowMs: SECURITY_CONFIG.WINDOWS.standard,
    max: SECURITY_CONFIG.BASE_LIMITS.api,
    message: 'تم تجاوز حد الطلبات المسموح - يرجى المحاولة لاحقاً'
  }),
  
  // Form submission protection (very strict)
  form: createSecureRateLimiter({
    windowMs: SECURITY_CONFIG.WINDOWS.standard,
    max: SECURITY_CONFIG.BASE_LIMITS.form,
    message: 'تم تجاوز حد إرسال النماذج - يرجى الانتظار قبل المحاولة مرة أخرى',
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  }),
  
  // CAPTCHA generation protection
  captcha: createSecureRateLimiter({
    windowMs: SECURITY_CONFIG.WINDOWS.short,
    max: SECURITY_CONFIG.BASE_LIMITS.captcha,
    message: 'تم تجاوز حد طلبات التحقق - يرجى الانتظار'
  }),
  
  // File upload protection
  upload: createSecureRateLimiter({
    windowMs: SECURITY_CONFIG.WINDOWS.extended,
    max: SECURITY_CONFIG.BASE_LIMITS.upload,
    message: 'تم تجاوز حد رفع الملفات - يرجى الانتظار'
  }),
  
  // Admin operations protection
  admin: createSecureRateLimiter({
    windowMs: SECURITY_CONFIG.WINDOWS.standard,
    max: SECURITY_CONFIG.BASE_LIMITS.admin,
    message: 'تم تجاوز حد العمليات الإدارية'
  }),
  
  // Login protection
  login: createSecureRateLimiter({
    windowMs: SECURITY_CONFIG.WINDOWS.extended,
    max: SECURITY_CONFIG.BASE_LIMITS.login,
    message: 'تم تجاوز حد محاولات تسجيل الدخول - الرجاء الانتظار',
    skipSuccessfulRequests: true,
    skipFailedRequests: false
  })
};

/**
 * Failed attempt tracker
 */
export function trackFailedAttempt(req: Request, reason: string): void {
  const profile = getIPProfile(req);
  profile.failedAttempts++;
  updateRiskScore(profile, reason);
  
  // Block after multiple failures
  if (profile.failedAttempts >= 5) {
    blockIP(profile, 'multiple_failed_attempts');
  }
}

/**
 * Security report for monitoring
 */
export function getSecurityReport(): object {
  const now = new Date();
  const report = {
    totalIPs: ipProfiles.size,
    blockedIPs: 0,
    highRiskIPs: 0,
    recentViolations: 0,
    topThreats: [] as string[]
  };
  
  const threatCounts: { [key: string]: number } = {};
  
  ipProfiles.forEach(profile => {
    if (profile.isBlocked) report.blockedIPs++;
    if (profile.riskScore >= 60) report.highRiskIPs++;
    if (now.getTime() - profile.lastViolation.getTime() < 3600000) { // Last hour
      report.recentViolations++;
    }
    
    profile.suspiciousPatterns.forEach(pattern => {
      threatCounts[pattern] = (threatCounts[pattern] || 0) + 1;
    });
  });
  
  // Get top 5 threats
  report.topThreats = Object.entries(threatCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([threat]) => threat);
  
  return report;
}

/**
 * Clean up expired profiles
 */
setInterval(() => {
  const now = new Date();
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  
  let cleaned = 0;
  ipProfiles.forEach((profile, ip) => {
    // Remove profiles older than 3 days with low risk
    if (profile.firstSeen < threeDaysAgo && profile.riskScore < 20 && !profile.isBlocked) {
      ipProfiles.delete(ip);
      cleaned++;
    }
  });
  
  if (cleaned > 0) {
    console.log(`🧹 [RATE-LIMITER] Cleaned ${cleaned} expired IP profiles`);
  }
}, 60 * 60 * 1000); // Run every hour

export default {
  secureRateLimiters,
  ipBlockingMiddleware,
  securityEventLogger,
  progressiveSlowdown,
  trackFailedAttempt,
  getSecurityReport
}; 