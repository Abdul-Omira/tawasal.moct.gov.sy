import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

// IP Reputation and Behavioral Analysis System
interface IPReputation {
  ip: string;
  score: number; // 0-100 (0 = trusted, 100 = highly suspicious)
  attempts: number;
  lastActivity: Date;
  blockedUntil?: Date;
  captchaLevel: 1 | 2 | 3 | 4 | 5; // Progressive difficulty
  behaviorFlags: string[];
  country?: string;
  firstSeen: Date;
  totalRequests: number;
  successfulRequests: number;
  failedCaptchas: number;
  rapidFireDetected: boolean;
  botSignature?: string;
}

interface SuspiciousPattern {
  pattern: string;
  weight: number;
  description: string;
}

// Advanced threat patterns for million-user scale
const THREAT_PATTERNS: SuspiciousPattern[] = [
  { pattern: 'curl/', weight: 40, description: 'Command line tool' },
  { pattern: 'python-requests', weight: 50, description: 'Python automation' },
  { pattern: 'bot', weight: 30, description: 'Bot in user agent' },
  { pattern: 'crawler', weight: 35, description: 'Web crawler' },
  { pattern: 'scanner', weight: 60, description: 'Security scanner' },
  { pattern: 'sqlmap', weight: 100, description: 'SQL injection tool' },
  { pattern: 'nmap', weight: 90, description: 'Network scanner' },
  { pattern: 'metasploit', weight: 100, description: 'Penetration testing' },
  { pattern: 'burp', weight: 80, description: 'Security testing tool' },
  { pattern: 'hydra', weight: 90, description: 'Brute force tool' },
  { pattern: 'nikto', weight: 85, description: 'Web vulnerability scanner' },
  { pattern: 'dirb', weight: 70, description: 'Directory brute forcer' },
  { pattern: 'gobuster', weight: 75, description: 'Directory/file brute forcer' },
  { pattern: 'masscan', weight: 85, description: 'Port scanner' },
  { pattern: 'zap', weight: 60, description: 'OWASP ZAP scanner' },
  { pattern: 'nuclei', weight: 80, description: 'Vulnerability scanner' },
  { pattern: 'whatweb', weight: 50, description: 'Web fingerprinter' },
  { pattern: 'httprobe', weight: 40, description: 'HTTP probe tool' },
  { pattern: 'subfinder', weight: 35, description: 'Subdomain finder' },
  { pattern: 'amass', weight: 40, description: 'Attack surface mapper' }
];

// In-memory reputation cache (Redis recommended for production)
const ipReputationCache = new Map<string, IPReputation>();
const requestHistory = new Map<string, Date[]>();

// Logs directory
const LOGS_DIR = path.join(process.cwd(), 'logs');

/**
 * Enhanced IP extraction with load balancer support
 */
export function getClientIP(req: Request): string {
  const forwarded = req.get('x-forwarded-for');
  const real = req.get('x-real-ip');
  const cloudflare = req.get('cf-connecting-ip');
  const remoteAddress = req.socket.remoteAddress;
  
  // Priority: Cloudflare > X-Real-IP > First X-Forwarded-For > Remote Address
  if (cloudflare) return cloudflare;
  if (real) return real;
  if (forwarded) return forwarded.split(',')[0].trim();
  return remoteAddress || 'unknown';
}

/**
 * Advanced behavioral analysis for bot detection
 */
export function analyzeBehavior(req: Request, ip: string): number {
  let suspicionScore = 0;
  const userAgent = req.get('user-agent') || '';
  const behaviorFlags: string[] = [];

  // Check user agent patterns
  for (const threat of THREAT_PATTERNS) {
    if (userAgent.toLowerCase().includes(threat.pattern)) {
      suspicionScore += threat.weight;
      behaviorFlags.push(`USER_AGENT_${threat.description.toUpperCase()}`);
    }
  }

  // Analyze request patterns
  const history = requestHistory.get(ip) || [];
  if (history.length > 0) {
    const now = new Date();
    const recent = history.filter(time => now.getTime() - time.getTime() < 60000); // Last minute
    
    // Rapid fire detection
    if (recent.length > 20) {
      suspicionScore += 50;
      behaviorFlags.push('RAPID_FIRE_REQUESTS');
    }
    
    // Check for uniform timing (bot behavior)
    if (recent.length >= 3) {
      const intervals = [];
      for (let i = 1; i < recent.length; i++) {
        intervals.push(recent[i].getTime() - recent[i-1].getTime());
      }
      
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
      
      // Very low variance suggests automated requests
      if (variance < 100 && intervals.length > 5) {
        suspicionScore += 30;
        behaviorFlags.push('UNIFORM_TIMING_PATTERN');
      }
    }
  }

  // Missing common browser headers
  const browserHeaders = ['accept-language', 'accept-encoding', 'accept'];
  const missingHeaders = browserHeaders.filter(header => !req.get(header));
  if (missingHeaders.length > 1) {
    suspicionScore += missingHeaders.length * 15;
    behaviorFlags.push('MISSING_BROWSER_HEADERS');
  }

  // Check for automation indicators
  if (!req.get('accept-language')) {
    suspicionScore += 20;
    behaviorFlags.push('NO_ACCEPT_LANGUAGE');
  }

  if (userAgent === '') {
    suspicionScore += 25;
    behaviorFlags.push('EMPTY_USER_AGENT');
  }

  // Suspicious connection patterns
  if (req.get('connection')?.toLowerCase() === 'close') {
    suspicionScore += 10;
    behaviorFlags.push('CONNECTION_CLOSE_PATTERN');
  }

  // Update IP reputation
  const reputation = ipReputationCache.get(ip) || {
    ip,
    score: 0,
    attempts: 0,
    lastActivity: new Date(),
    captchaLevel: 1,
    behaviorFlags: [],
    firstSeen: new Date(),
    totalRequests: 0,
    successfulRequests: 0,
    failedCaptchas: 0,
    rapidFireDetected: false
  };

  reputation.score = Math.min(100, Math.max(0, reputation.score + (suspicionScore - 10))); // Gradual decay
  reputation.behaviorFlags = Array.from(new Set([...reputation.behaviorFlags, ...behaviorFlags]));
  reputation.lastActivity = new Date();
  reputation.totalRequests++;
  reputation.rapidFireDetected = behaviorFlags.includes('RAPID_FIRE_REQUESTS');

  ipReputationCache.set(ip, reputation);

  // Update request history
  if (!requestHistory.has(ip)) {
    requestHistory.set(ip, []);
  }
  const ipHistory = requestHistory.get(ip)!;
  ipHistory.push(new Date());
  
  // Keep only last 100 requests per IP
  if (ipHistory.length > 100) {
    ipHistory.splice(0, ipHistory.length - 100);
  }

  return suspicionScore;
}

/**
 * Determine required captcha level based on IP reputation
 */
export function getCaptchaLevel(ip: string): number {
  const reputation = ipReputationCache.get(ip);
  if (!reputation) return 1;

  if (reputation.score >= 80) return 5; // Maximum difficulty
  if (reputation.score >= 60) return 4;
  if (reputation.score >= 40) return 3;
  if (reputation.score >= 20) return 2;
  return 1; // Minimum difficulty
}

/**
 * Enhanced rate limiter with progressive restrictions
 */
export const createAdaptiveRateLimit = (options: {
  windowMs: number;
  maxRequests: number;
  progressiveDelay: boolean;
  captchaThreshold: number;
}) => {
  return rateLimit({
    windowMs: options.windowMs,
    max: (req: Request) => {
      const ip = getClientIP(req);
      const reputation = ipReputationCache.get(ip);
      
      if (!reputation) return options.maxRequests;
      
      // Reduce limits for suspicious IPs
      const reputationMultiplier = Math.max(0.1, (100 - reputation.score) / 100);
      return Math.floor(options.maxRequests * reputationMultiplier);
    },
    keyGenerator: (req: Request) => getClientIP(req),
    handler: async (req: Request, res: Response) => {
      const ip = getClientIP(req);
      const reputation = ipReputationCache.get(ip) || {} as IPReputation;
      
      // Log rate limit hit
      await logSecurityEvent('RATE_LIMIT_HIT', {
        ip,
        path: req.path,
        userAgent: req.get('user-agent'),
        reputation: reputation.score || 0,
        timestamp: new Date().toISOString()
      });

      // Determine if captcha is required
      const requiresCaptcha = (reputation.score || 0) > options.captchaThreshold;
      
      res.status(429).json({
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'تم تجاوز الحد المسموح من الطلبات',
        retryAfter: Math.ceil(options.windowMs / 1000),
        requiresCaptcha,
        captchaLevel: getCaptchaLevel(ip),
        reputation: {
          score: reputation.score || 0,
          level: reputation.score > 70 ? 'HIGH_RISK' : reputation.score > 40 ? 'MEDIUM_RISK' : 'LOW_RISK'
        }
      });
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  });
};

/**
 * Intelligent bot detection middleware
 */
export const intelligentBotDetection = async (req: Request, res: Response, next: NextFunction) => {
  const ip = getClientIP(req);
  const suspicionScore = analyzeBehavior(req, ip);
  const reputation = ipReputationCache.get(ip);

  // Block highly suspicious requests immediately
  if (suspicionScore >= 100 || (reputation && reputation.score >= 90)) {
    await logSecurityEvent('BOT_BLOCKED', {
      ip,
      path: req.path,
      userAgent: req.get('user-agent'),
      suspicionScore,
      reputationScore: reputation?.score || 0,
      behaviorFlags: reputation?.behaviorFlags || [],
      timestamp: new Date().toISOString()
    });

    return res.status(403).json({
      error: 'ACCESS_DENIED',
      message: 'تم حظر الوصول - تم اكتشاف سلوك مشبوه',
      code: 'BOT_DETECTED',
      timestamp: new Date().toISOString()
    });
  }

  // Add security headers for monitoring
  res.set('X-Risk-Score', reputation?.score?.toString() || '0');
  res.set('X-Captcha-Level', getCaptchaLevel(ip).toString());

  next();
};

/**
 * Progressive captcha validation based on reputation
 */
export const validateProgressiveCaptcha = (req: Request, captchaAnswer: string): boolean => {
  const ip = getClientIP(req);
  const captchaLevel = getCaptchaLevel(ip);
  
  // Different validation logic based on captcha level
  switch (captchaLevel) {
    case 1:
      // Simple validation
      return captchaAnswer === 'verified' || /^\d+$/.test(captchaAnswer);
    
    case 2:
    case 3:
      // Medium validation - requires specific answer
      return captchaAnswer === 'verified';
    
    case 4:
    case 5:
      // High security - additional verification required
      return captchaAnswer === 'verified' && (req.get('user-agent')?.includes('Mozilla') || false);
    
    default:
      return false;
  }
};

/**
 * Security event logging
 */
export async function logSecurityEvent(eventType: string, data: any): Promise<void> {
  try {
    // Ensure logs directory exists
    await fs.mkdir(LOGS_DIR, { recursive: true });
    
    const logEntry = {
      timestamp: new Date().toISOString(),
      eventType,
      data,
      id: crypto.randomUUID()
    };

    const logFile = path.join(LOGS_DIR, 'ddos-protection.log');
    await fs.appendFile(logFile, JSON.stringify(logEntry) + '\n', 'utf8');
    
    // Console output for real-time monitoring
    console.log(`🛡️ DDoS Protection: ${eventType} - IP: ${data.ip} - Score: ${data.reputationScore || data.suspicionScore || 0}`);
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
}

/**
 * IP reputation cleanup (removes old entries)
 */
export function cleanupReputationCache(): void {
  const now = new Date();
  const CLEANUP_THRESHOLD = 24 * 60 * 60 * 1000; // 24 hours

  for (const [ip, reputation] of Array.from(ipReputationCache.entries())) {
    if (now.getTime() - reputation.lastActivity.getTime() > CLEANUP_THRESHOLD) {
      ipReputationCache.delete(ip);
      requestHistory.delete(ip);
    }
  }
}

/**
 * Get IP reputation statistics for monitoring
 */
export function getReputationStats(): {
  totalIPs: number;
  highRiskIPs: number;
  mediumRiskIPs: number;
  lowRiskIPs: number;
  topThreats: { ip: string; score: number; flags: string[] }[];
} {
  const stats = {
    totalIPs: ipReputationCache.size,
    highRiskIPs: 0,
    mediumRiskIPs: 0,
    lowRiskIPs: 0,
    topThreats: [] as { ip: string; score: number; flags: string[] }[]
  };

  const threats: { ip: string; score: number; flags: string[] }[] = [];

  for (const [ip, reputation] of Array.from(ipReputationCache.entries())) {
    if (reputation.score >= 70) {
      stats.highRiskIPs++;
      threats.push({ ip, score: reputation.score, flags: reputation.behaviorFlags });
    } else if (reputation.score >= 40) {
      stats.mediumRiskIPs++;
    } else {
      stats.lowRiskIPs++;
    }
  }

  stats.topThreats = threats
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  return stats;
}

// Run cleanup every hour
setInterval(cleanupReputationCache, 60 * 60 * 1000);

export default {
  getClientIP,
  analyzeBehavior,
  getCaptchaLevel,
  createAdaptiveRateLimit,
  intelligentBotDetection,
  validateProgressiveCaptcha,
  logSecurityEvent,
  getReputationStats
}; 
 