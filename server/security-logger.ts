/**
 * Syrian Ministry of Communication - Military-Grade Security Logging
 * Advanced Security Monitoring and Threat Detection System
 * 
 * @author Security Team - Emergency Response
 * @version 3.0.0 - Maximum Security Implementation
 */

import fs from 'fs';
import path from 'path';
import { Request, Response } from 'express';

// Security logging configuration
const SECURITY_CONFIG = {
  LOG_DIRECTORY: path.join(process.cwd(), 'logs'),
  MAX_LOG_SIZE: 50 * 1024 * 1024, // 50MB
  LOG_RETENTION_DAYS: 90,
  ALERT_THRESHOLDS: {
    failed_logins: 5,
    security_violations: 3,
    suspicious_requests: 10,
    rate_limit_hits: 20
  },
  HIGH_PRIORITY_EVENTS: [
    'SQL_INJECTION_ATTEMPT',
    'XSS_ATTEMPT',
    'DIRECTORY_TRAVERSAL',
    'AUTHENTICATION_BYPASS',
    'PRIVILEGE_ESCALATION',
    'CAPTCHA_BYPASS_ATTEMPT',
    'MALICIOUS_FILE_UPLOAD',
    'COMMAND_INJECTION'
  ]
};

// Security event types
enum SecurityEventType {
  LOGIN_ATTEMPT = 'LOGIN_ATTEMPT',
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILURE = 'LOGIN_FAILURE',
  LOGOUT = 'LOGOUT',
  FORM_SUBMISSION = 'FORM_SUBMISSION',
  FILE_UPLOAD = 'FILE_UPLOAD',
  API_ACCESS = 'API_ACCESS',
  ADMIN_ACCESS = 'ADMIN_ACCESS',
  RATE_LIMIT_HIT = 'RATE_LIMIT_HIT',
  CAPTCHA_ATTEMPT = 'CAPTCHA_ATTEMPT',
  CAPTCHA_FAILURE = 'CAPTCHA_FAILURE',
  XSS_ATTEMPT = 'XSS_ATTEMPT',
  SQL_INJECTION_ATTEMPT = 'SQL_INJECTION_ATTEMPT',
  DIRECTORY_TRAVERSAL = 'DIRECTORY_TRAVERSAL',
  MALICIOUS_USER_AGENT = 'MALICIOUS_USER_AGENT',
  SUSPICIOUS_REQUEST = 'SUSPICIOUS_REQUEST',
  IP_BLOCKED = 'IP_BLOCKED',
  SECURITY_VIOLATION = 'SECURITY_VIOLATION',
  ERROR_500 = 'ERROR_500',
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
  CSRF_ATTEMPT = 'CSRF_ATTEMPT',
  BRUTE_FORCE_ATTEMPT = 'BRUTE_FORCE_ATTEMPT'
}

// Security log entry interface
interface SecurityLogEntry {
  timestamp: string;
  eventType: SecurityEventType;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  ip: string;
  userAgent: string;
  method: string;
  url: string;
  statusCode?: number;
  userId?: string;
  details: {
    message: string;
    requestBody?: any;
    headers?: any;
    additionalInfo?: any;
    threatSignatures?: string[];
    riskScore?: number;
  };
  location: {
    country?: string;
    region?: string;
    city?: string;
  };
  deviceInfo: {
    type?: string;
    browser?: string;
    os?: string;
  };
}

// Security metrics tracking
interface SecurityMetrics {
  totalEvents: number;
  eventsLast24h: number;
  criticalEvents: number;
  blockedIPs: Set<string>;
  topThreats: Map<string, number>;
  ipEventCounts: Map<string, number>;
  lastUpdated: Date;
}

// In-memory security metrics
const securityMetrics: SecurityMetrics = {
  totalEvents: 0,
  eventsLast24h: 0,
  criticalEvents: 0,
  blockedIPs: new Set(),
  topThreats: new Map(),
  ipEventCounts: new Map(),
  lastUpdated: new Date()
};

// Ensure logs directory exists
function ensureLogDirectory(): void {
  if (!fs.existsSync(SECURITY_CONFIG.LOG_DIRECTORY)) {
    fs.mkdirSync(SECURITY_CONFIG.LOG_DIRECTORY, { recursive: true });
  }
}

/**
 * Get log file path based on date
 */
function getLogFilePath(date: Date = new Date()): string {
  const dateStr = date.toISOString().split('T')[0];
  return path.join(SECURITY_CONFIG.LOG_DIRECTORY, `security-${dateStr}.log`);
}

/**
 * Rotate log files if they exceed size limit
 */
function rotateLogFiles(): void {
  const logFile = getLogFilePath();
  
  if (fs.existsSync(logFile)) {
    const stats = fs.statSync(logFile);
    if (stats.size > SECURITY_CONFIG.MAX_LOG_SIZE) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const rotatedFile = logFile.replace('.log', `-${timestamp}.log`);
      fs.renameSync(logFile, rotatedFile);
      console.log(`📁 [SECURITY-LOG] Rotated log file: ${rotatedFile}`);
    }
  }
}

/**
 * Clean up old log files
 */
function cleanupOldLogs(): void {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - SECURITY_CONFIG.LOG_RETENTION_DAYS);
  
  try {
    const files = fs.readdirSync(SECURITY_CONFIG.LOG_DIRECTORY);
    
    files.forEach(file => {
      if (file.startsWith('security-') && file.endsWith('.log')) {
        const filePath = path.join(SECURITY_CONFIG.LOG_DIRECTORY, file);
        const stats = fs.statSync(filePath);
        
        if (stats.mtime < cutoffDate) {
          fs.unlinkSync(filePath);
          console.log(`🗑️ [SECURITY-LOG] Deleted old log file: ${file}`);
        }
      }
    });
  } catch (error) {
    console.error('Error cleaning up old logs:', error);
  }
}

/**
 * Extract device information from user agent
 */
function extractDeviceInfo(userAgent: string): { type?: string; browser?: string; os?: string } {
  const deviceInfo: { type?: string; browser?: string; os?: string } = {};
  
  // Device type detection
  if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
    deviceInfo.type = 'mobile';
  } else if (/Tablet|iPad/.test(userAgent)) {
    deviceInfo.type = 'tablet';
  } else {
    deviceInfo.type = 'desktop';
  }
  
  // Browser detection
  if (/Chrome/.test(userAgent)) {
    deviceInfo.browser = 'Chrome';
  } else if (/Firefox/.test(userAgent)) {
    deviceInfo.browser = 'Firefox';
  } else if (/Safari/.test(userAgent) && !/Chrome/.test(userAgent)) {
    deviceInfo.browser = 'Safari';
  } else if (/Edge/.test(userAgent)) {
    deviceInfo.browser = 'Edge';
  } else {
    deviceInfo.browser = 'Unknown';
  }
  
  // OS detection
  if (/Windows/.test(userAgent)) {
    deviceInfo.os = 'Windows';
  } else if (/Mac OS/.test(userAgent)) {
    deviceInfo.os = 'macOS';
  } else if (/Linux/.test(userAgent)) {
    deviceInfo.os = 'Linux';
  } else if (/Android/.test(userAgent)) {
    deviceInfo.os = 'Android';
  } else if (/iOS|iPhone|iPad/.test(userAgent)) {
    deviceInfo.os = 'iOS';
  } else {
    deviceInfo.os = 'Unknown';
  }
  
  return deviceInfo;
}

/**
 * Detect threat signatures in request
 */
function detectThreatSignatures(req: Request): string[] {
  const signatures: string[] = [];
  const url = req.originalUrl || req.url;
  const userAgent = req.get('user-agent') || '';
  const body = JSON.stringify(req.body || {});
  
  // SQL Injection patterns
  const sqlPatterns = [
    /union.*select/gi,
    /drop.*table/gi,
    /insert.*into/gi,
    /delete.*from/gi,
    /update.*set/gi,
    /or.*1.*=.*1/gi,
    /and.*1.*=.*1/gi,
    /';.*--/gi,
    /\/\*.*\*\//gi
  ];
  
  sqlPatterns.forEach(pattern => {
    if (pattern.test(url) || pattern.test(body)) {
      signatures.push('SQL_INJECTION');
    }
  });
  
  // XSS patterns
  const xssPatterns = [
    /<script[^>]*>/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /onload\s*=/gi,
    /onerror\s*=/gi,
    /onclick\s*=/gi,
    /eval\s*\(/gi,
    /document\.write/gi,
    /window\.location/gi
  ];
  
  xssPatterns.forEach(pattern => {
    if (pattern.test(url) || pattern.test(body)) {
      signatures.push('XSS_ATTEMPT');
    }
  });
  
  // Directory traversal
  if (/\.\.\//g.test(url) || /\.\.\\\\/g.test(url)) {
    signatures.push('DIRECTORY_TRAVERSAL');
  }
  
  // Command injection
  if (/[;&|`$\(\)]/g.test(url) || /[;&|`$\(\)]/g.test(body)) {
    signatures.push('COMMAND_INJECTION');
  }
  
  // Malicious user agents
  const maliciousAgents = [
    'sqlmap', 'nikto', 'nessus', 'openvas', 'vega', 'skipfish',
    'wpscan', 'dirbuster', 'hydra', 'nmap', 'masscan', 'zmap'
  ];
  
  maliciousAgents.forEach(agent => {
    if (userAgent.toLowerCase().includes(agent)) {
      signatures.push('MALICIOUS_USER_AGENT');
    }
  });
  
  return signatures;
}

/**
 * Calculate risk score based on various factors
 */
function calculateRiskScore(req: Request, eventType: SecurityEventType, threatSignatures: string[]): number {
  let score = 0;
  
  // Base score by event type
  const eventScores: Partial<Record<SecurityEventType, number>> = {
    [SecurityEventType.LOGIN_FAILURE]: 10,
    [SecurityEventType.CAPTCHA_FAILURE]: 15,
    [SecurityEventType.XSS_ATTEMPT]: 50,
    [SecurityEventType.SQL_INJECTION_ATTEMPT]: 70,
    [SecurityEventType.DIRECTORY_TRAVERSAL]: 40,
    [SecurityEventType.MALICIOUS_USER_AGENT]: 30,
    [SecurityEventType.BRUTE_FORCE_ATTEMPT]: 60,
    [SecurityEventType.RATE_LIMIT_HIT]: 20
  };
  
  score += eventScores[eventType] || 5;
  
  // Threat signature bonus
  score += threatSignatures.length * 20;
  
  // Suspicious user agent patterns
  const userAgent = req.get('user-agent') || '';
  if (!userAgent || userAgent.length < 10) {
    score += 15;
  }
  
  // Missing common headers
  if (!req.get('accept') || !req.get('accept-language')) {
    score += 10;
  }
  
  // High-risk request patterns
  const url = req.originalUrl || req.url;
  if (url.includes('admin') || url.includes('config') || url.includes('debug')) {
    score += 25;
  }
  
  return Math.min(score, 100); // Cap at 100
}

/**
 * Determine severity based on event type and risk score
 */
function determineSeverity(eventType: SecurityEventType, riskScore: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  if (SECURITY_CONFIG.HIGH_PRIORITY_EVENTS.includes(eventType) || riskScore >= 80) {
    return 'CRITICAL';
  } else if (riskScore >= 60) {
    return 'HIGH';
  } else if (riskScore >= 30) {
    return 'MEDIUM';
  } else {
    return 'LOW';
  }
}

/**
 * Write security log entry to file
 */
function writeLogEntry(entry: SecurityLogEntry): void {
  ensureLogDirectory();
  rotateLogFiles();
  
  const logFile = getLogFilePath();
  const logLine = JSON.stringify(entry) + '\n';
  
  try {
    fs.appendFileSync(logFile, logLine);
  } catch (error) {
    console.error('Error writing to security log:', error);
  }
}

/**
 * Update security metrics
 */
function updateMetrics(entry: SecurityLogEntry): void {
  securityMetrics.totalEvents++;
  securityMetrics.lastUpdated = new Date();
  
  // Count events in last 24 hours
  const yesterday = new Date();
  yesterday.setHours(yesterday.getHours() - 24);
  if (new Date(entry.timestamp) > yesterday) {
    securityMetrics.eventsLast24h++;
  }
  
  // Count critical events
  if (entry.severity === 'CRITICAL') {
    securityMetrics.criticalEvents++;
  }
  
  // Track IP event counts
  const currentCount = securityMetrics.ipEventCounts.get(entry.ip) || 0;
  securityMetrics.ipEventCounts.set(entry.ip, currentCount + 1);
  
  // Track top threats
  const currentThreatCount = securityMetrics.topThreats.get(entry.eventType) || 0;
  securityMetrics.topThreats.set(entry.eventType, currentThreatCount + 1);
  
  // Track blocked IPs if this is a blocking event
  if (entry.eventType === SecurityEventType.IP_BLOCKED) {
    securityMetrics.blockedIPs.add(entry.ip);
  }
}

/**
 * Send alert for high-priority security events
 */
function sendSecurityAlert(entry: SecurityLogEntry): void {
  if (entry.severity === 'CRITICAL' || SECURITY_CONFIG.HIGH_PRIORITY_EVENTS.includes(entry.eventType)) {
    console.log(`🚨 [SECURITY-ALERT] CRITICAL EVENT: ${entry.eventType} from ${entry.ip}`);
    console.log(`🚨 [SECURITY-ALERT] Details: ${entry.details.message}`);
    
    // TODO: Implement email/SMS alerts, external monitoring integration
    // This could include webhook calls to security monitoring services
  }
}

/**
 * Main security logging function
 */
export function logSecurityEvent(
  req: Request,
  eventType: SecurityEventType,
  message: string,
  additionalInfo?: any,
  statusCode?: number,
  userId?: string
): void {
  const threatSignatures = detectThreatSignatures(req);
  const riskScore = calculateRiskScore(req, eventType, threatSignatures);
  const severity = determineSeverity(eventType, riskScore);
  
  const entry: SecurityLogEntry = {
    timestamp: new Date().toISOString(),
    eventType,
    severity,
    ip: req.ip || req.connection.remoteAddress || 'unknown',
    userAgent: req.get('user-agent') || 'unknown',
    method: req.method,
    url: req.originalUrl || req.url,
    statusCode,
    userId,
    details: {
      message,
      requestBody: sanitizeRequestBody(req.body),
      headers: sanitizeHeaders(req.headers),
      additionalInfo,
      threatSignatures,
      riskScore
    },
    location: {
      // TODO: Implement GeoIP lookup
      country: 'Unknown',
      region: 'Unknown',
      city: 'Unknown'
    },
    deviceInfo: extractDeviceInfo(req.get('user-agent') || '')
  };
  
  // Write to log file
  writeLogEntry(entry);
  
  // Update metrics
  updateMetrics(entry);
  
  // Send alerts if necessary
  sendSecurityAlert(entry);
  
  // Console logging for immediate visibility
  const logLevel = severity === 'CRITICAL' ? '🚨' : 
                   severity === 'HIGH' ? '⚠️' : 
                   severity === 'MEDIUM' ? '🔍' : '📝';
  
  console.log(`${logLevel} [SECURITY] ${severity} ${eventType}: ${message} (IP: ${entry.ip}, Risk: ${riskScore})`);
}

/**
 * Sanitize request body for logging
 */
function sanitizeRequestBody(body: any): any {
  if (!body || typeof body !== 'object') return body;
  
  const sanitized = { ...body };
  const sensitiveFields = ['password', 'token', 'secret', 'key', 'captchaAnswer', 'captchaToken'];
  
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });
  
  return sanitized;
}

/**
 * Sanitize headers for logging
 */
function sanitizeHeaders(headers: any): any {
  if (!headers || typeof headers !== 'object') return headers;
  
  const sanitized = { ...headers };
  const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key', 'x-auth-token'];
  
  sensitiveHeaders.forEach(header => {
    if (sanitized[header]) {
      sanitized[header] = '[REDACTED]';
    }
  });
  
  return sanitized;
}

/**
 * Get security metrics for monitoring dashboard
 */
export function getSecurityMetrics(): SecurityMetrics {
  return { ...securityMetrics };
}

/**
 * Get recent security events
 */
export function getRecentSecurityEvents(limit: number = 100): SecurityLogEntry[] {
  const events: SecurityLogEntry[] = [];
  const logFile = getLogFilePath();
  
  try {
    if (fs.existsSync(logFile)) {
      const content = fs.readFileSync(logFile, 'utf8');
      const lines = content.trim().split('\n').slice(-limit);
      
      lines.forEach(line => {
        try {
          const entry = JSON.parse(line);
          events.push(entry);
        } catch (e) {
          // Skip invalid lines
        }
      });
    }
  } catch (error) {
    console.error('Error reading security log:', error);
  }
  
  return events.reverse(); // Most recent first
}

/**
 * Security logging middleware
 */
export function securityLoggingMiddleware(req: Request, res: Response, next: Function): void {
  const startTime = Date.now();
  
  // Log API access
  if (req.url.startsWith('/api/')) {
    logSecurityEvent(req, SecurityEventType.API_ACCESS, `API accessed: ${req.method} ${req.url}`);
  }
  
  // Override res.end to capture response details
  const originalEnd = res.end.bind(res);
  res.end = function(chunk?: any, encoding?: any, cb?: any) {
    const duration = Date.now() - startTime;
    
    // Log based on status code
    if (res.statusCode >= 500) {
      logSecurityEvent(req, SecurityEventType.ERROR_500, `Server error: ${res.statusCode}`, { duration }, res.statusCode);
    } else if (res.statusCode === 401 || res.statusCode === 403) {
      logSecurityEvent(req, SecurityEventType.UNAUTHORIZED_ACCESS, `Unauthorized access: ${res.statusCode}`, { duration }, res.statusCode);
    } else if (res.statusCode === 429) {
      logSecurityEvent(req, SecurityEventType.RATE_LIMIT_HIT, 'Rate limit exceeded', { duration }, res.statusCode);
    }
    
    return originalEnd(chunk, encoding, cb);
  };
  
  next();
}

// Clean up old logs daily
setInterval(() => {
  cleanupOldLogs();
}, 24 * 60 * 60 * 1000);

// Export security event types for use in other modules
export { SecurityEventType };

export default {
  logSecurityEvent,
  getSecurityMetrics,
  getRecentSecurityEvents,
  securityLoggingMiddleware,
  SecurityEventType
}; 