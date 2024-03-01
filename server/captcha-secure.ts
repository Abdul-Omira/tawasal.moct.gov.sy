/**
 * Syrian Ministry of Communication - Military-Grade CAPTCHA System
 * Cryptographically Secure CAPTCHA with Server-Side Validation
 * 
 * @author Security Team - Emergency Response
 * @version 3.0.0 - Maximum Security Implementation
 */

import crypto from 'crypto';
import { Request } from 'express';

// Secret key for CAPTCHA token generation (should be in environment variable)
const CAPTCHA_SECRET = process.env.CAPTCHA_SECRET || 'syrian-ministry-captcha-secret-2025-ultra-secure';

interface SecureCaptchaChallenge {
  id: string;
  question: string;
  answer: string;
  token: string; // Cryptographic token to prevent forgery
  createdAt: Date;
  difficulty: 1 | 2 | 3 | 4 | 5;
  attempts: number;
  clientFingerprint: string;
  ipAddress: string;
}

// Secure in-memory store for CAPTCHA challenges (use Redis in production)
const secureCaptchaChallenges = new Map<string, SecureCaptchaChallenge>();

// Clean up expired challenges every 2 minutes
setInterval(() => {
  const now = new Date();
  secureCaptchaChallenges.forEach((challenge, id) => {
    // Expire after 5 minutes or 3 failed attempts
    if (now.getTime() - challenge.createdAt.getTime() > 300000 || challenge.attempts >= 3) {
      secureCaptchaChallenges.delete(id);
    }
  });
}, 120000);

/**
 * Generate cryptographic token for CAPTCHA validation
 */
function generateCaptchaToken(captchaId: string, answer: string, clientFingerprint: string): string {
  const payload = `${captchaId}:${answer}:${clientFingerprint}:${Date.now()}`;
  return crypto.createHmac('sha256', CAPTCHA_SECRET).update(payload).digest('hex');
}

/**
 * Verify cryptographic token for CAPTCHA validation
 */
function verifyCaptchaToken(captchaId: string, answer: string, clientFingerprint: string, token: string): boolean {
  const expectedToken = generateCaptchaToken(captchaId, answer, clientFingerprint);
  return crypto.timingSafeEqual(Buffer.from(token, 'hex'), Buffer.from(expectedToken, 'hex'));
}

/**
 * Generate client fingerprint from request
 */
function generateClientFingerprint(req: Request): string {
  const components = [
    req.ip || 'unknown',
    req.get('user-agent') || 'unknown',
    req.get('accept-language') || 'unknown',
    req.get('accept-encoding') || 'unknown'
  ];
  return crypto.createHash('sha256').update(components.join('|')).digest('hex');
}

/**
 * Advanced mathematical challenges for different difficulty levels
 */
const SECURE_CAPTCHA_CHALLENGES = {
  1: [
    // Basic arithmetic
    () => {
      const a = Math.floor(Math.random() * 10) + 1;
      const b = Math.floor(Math.random() * 10) + 1;
      return { question: `${a} + ${b} = ?`, answer: (a + b).toString() };
    },
    () => {
      const a = Math.floor(Math.random() * 20) + 10;
      const b = Math.floor(Math.random() * 10) + 1;
      return { question: `${a} - ${b} = ?`, answer: (a - b).toString() };
    }
  ],
  2: [
    // Multiplication and division
    () => {
      const a = Math.floor(Math.random() * 12) + 1;
      const b = Math.floor(Math.random() * 9) + 1;
      return { question: `${a} × ${b} = ?`, answer: (a * b).toString() };
    },
    () => {
      const b = Math.floor(Math.random() * 9) + 1;
      const result = Math.floor(Math.random() * 12) + 1;
      const a = b * result;
      return { question: `${a} ÷ ${b} = ?`, answer: result.toString() };
    }
  ],
  3: [
    // Two-step operations
    () => {
      const a = Math.floor(Math.random() * 10) + 1;
      const b = Math.floor(Math.random() * 10) + 1;
      const c = Math.floor(Math.random() * 5) + 1;
      return { question: `(${a} + ${b}) × ${c} = ?`, answer: ((a + b) * c).toString() };
    },
    () => {
      const a = Math.floor(Math.random() * 20) + 10;
      const b = Math.floor(Math.random() * 5) + 1;
      const c = Math.floor(Math.random() * 5) + 1;
      return { question: `${a} - ${b} + ${c} = ?`, answer: (a - b + c).toString() };
    }
  ],
  4: [
    // Complex operations
    () => {
      const a = Math.floor(Math.random() * 15) + 5;
      const b = Math.floor(Math.random() * 8) + 2;
      const c = Math.floor(Math.random() * 6) + 2;
      return { question: `${a} × ${b} - ${c * 5} = ?`, answer: (a * b - c * 5).toString() };
    },
    () => {
      const a = Math.floor(Math.random() * 12) + 4;
      const b = 2;
      const c = Math.floor(Math.random() * 8) + 1;
      return { question: `${a}² ÷ ${b} + ${c} = ?`, answer: ((a * a) / b + c).toString() };
    }
  ],
  5: [
    // Maximum difficulty
    () => {
      const a = Math.floor(Math.random() * 10) + 5;
      const b = Math.floor(Math.random() * 4) + 2;
      const c = Math.floor(Math.random() * 6) + 3;
      const d = Math.floor(Math.random() * 3) + 1;
      return { question: `(${a} + ${b}) × ${c} - ${d * 7} = ?`, answer: ((a + b) * c - d * 7).toString() };
    }
  ]
};

/**
 * Generate secure CAPTCHA challenge
 */
export function generateSecureCaptcha(difficulty: 1 | 2 | 3 | 4 | 5, req: Request): { id: string; question: string; token: string } {
  const challenges = SECURE_CAPTCHA_CHALLENGES[difficulty];
  const challengeFunc = challenges[Math.floor(Math.random() * challenges.length)];
  const { question, answer } = challengeFunc();
  
  const id = crypto.randomUUID();
  const clientFingerprint = generateClientFingerprint(req);
  const token = generateCaptchaToken(id, answer, clientFingerprint);
  
  const challenge: SecureCaptchaChallenge = {
    id,
    question,
    answer,
    token,
    createdAt: new Date(),
    difficulty,
    attempts: 0,
    clientFingerprint,
    ipAddress: req.ip || 'unknown'
  };
  
  secureCaptchaChallenges.set(id, challenge);
  
  console.log(`🔒 [SECURE-CAPTCHA] Generated challenge (difficulty ${difficulty}): ${question}`);
  
  return { id, question, token };
}

/**
 * Validate secure CAPTCHA with multiple security checks
 */
export function validateSecureCaptcha(captchaId: string, userAnswer: string, providedToken: string, req: Request): boolean {
  // Input validation
  if (!captchaId || !userAnswer || !providedToken) {
    console.log('🚨 [SECURE-CAPTCHA] Missing required CAPTCHA data');
    return false;
  }
  
  // Check if CAPTCHA exists
  const challenge = secureCaptchaChallenges.get(captchaId);
  if (!challenge) {
    console.log('🚨 [SECURE-CAPTCHA] Invalid or expired CAPTCHA ID');
    return false;
  }
  
  // Check IP address consistency
  const currentIP = req.ip || 'unknown';
  if (challenge.ipAddress !== currentIP) {
    console.log('🚨 [SECURE-CAPTCHA] IP address mismatch - potential attack');
    secureCaptchaChallenges.delete(captchaId);
    return false;
  }
  
  // Check client fingerprint consistency
  const currentFingerprint = generateClientFingerprint(req);
  if (challenge.clientFingerprint !== currentFingerprint) {
    console.log('🚨 [SECURE-CAPTCHA] Client fingerprint mismatch - potential hijacking');
    secureCaptchaChallenges.delete(captchaId);
    return false;
  }
  
  // Verify cryptographic token
  if (!verifyCaptchaToken(captchaId, challenge.answer, currentFingerprint, providedToken)) {
    console.log('🚨 [SECURE-CAPTCHA] Invalid cryptographic token - potential forgery');
    secureCaptchaChallenges.delete(captchaId);
    return false;
  }
  
  // Increment attempt counter
  challenge.attempts++;
  
  // Check if too many attempts
  if (challenge.attempts > 3) {
    console.log('🚨 [SECURE-CAPTCHA] Too many failed attempts');
    secureCaptchaChallenges.delete(captchaId);
    return false;
  }
  
  // Check if expired (5 minutes)
  const now = new Date();
  if (now.getTime() - challenge.createdAt.getTime() > 300000) {
    console.log('🚨 [SECURE-CAPTCHA] Expired CAPTCHA');
    secureCaptchaChallenges.delete(captchaId);
    return false;
  }
  
  // Validate answer with timing-safe comparison
  const normalizedUserAnswer = userAnswer.trim().toLowerCase();
  const normalizedCorrectAnswer = challenge.answer.trim().toLowerCase();
  
  const isValid = crypto.timingSafeEqual(
    Buffer.from(normalizedUserAnswer, 'utf8'),
    Buffer.from(normalizedCorrectAnswer, 'utf8')
  );
  
  if (isValid) {
    console.log('✅ [SECURE-CAPTCHA] Valid CAPTCHA answer with verified token');
    secureCaptchaChallenges.delete(captchaId); // Remove after successful validation
    return true;
  } else {
    console.log('🚨 [SECURE-CAPTCHA] Invalid CAPTCHA answer');
    return false;
  }
}

/**
 * Get CAPTCHA difficulty based on security assessment
 */
export function getSecureCaptchaDifficulty(req: Request): 1 | 2 | 3 | 4 | 5 {
  const userAgent = req.get('user-agent') || '';
  const ip = req.ip || req.connection.remoteAddress;
  
  // Maximum difficulty for suspicious patterns
  const highRiskPatterns = [
    'curl', 'wget', 'python', 'bot', 'crawler', 'scanner',
    'postman', 'insomnia', 'httpie', 'requests', 'selenium',
    'phantomjs', 'headless', 'automation'
  ];
  
  for (const pattern of highRiskPatterns) {
    if (userAgent.toLowerCase().includes(pattern)) {
      console.log(`🔒 [SECURE-CAPTCHA] Maximum difficulty for high-risk user agent: ${pattern}`);
      return 5;
    }
  }
  
  // High difficulty for suspicious characteristics
  if (!userAgent || userAgent.length < 20) {
    console.log('🔒 [SECURE-CAPTCHA] High difficulty for suspicious/missing user agent');
    return 4;
  }
  
  // Medium difficulty for rapid requests
  const requestCount = getRecentRequestCount(ip || 'unknown');
  if (requestCount > 5) {
    console.log('🔒 [SECURE-CAPTCHA] Medium difficulty for rapid requests');
    return 3;
  }
  
  // Check for common browser patterns
  const browserPatterns = ['Mozilla', 'Chrome', 'Firefox', 'Safari', 'Edge'];
  const hasBrowserPattern = browserPatterns.some(pattern => userAgent.includes(pattern));
  
  if (!hasBrowserPattern) {
    return 4;
  }
  
  return 2; // Standard difficulty for normal browsers
}

/**
 * Simple request tracking for difficulty assessment
 */
const requestCounts = new Map<string, { count: number; resetTime: number }>();

function getRecentRequestCount(ip: string): number {
  const now = Date.now();
  const entry = requestCounts.get(ip);
  
  if (!entry || now > entry.resetTime) {
    requestCounts.set(ip, { count: 1, resetTime: now + 900000 }); // 15 minutes
    return 1;
  }
  
  entry.count++;
  return entry.count;
}

/**
 * Generate secure CAPTCHA API endpoint response
 */
export function generateSecureCaptchaResponse(req: Request): { captchaId: string; question: string; token: string; difficulty: number } {
  const difficulty = getSecureCaptchaDifficulty(req);
  const { id, question, token } = generateSecureCaptcha(difficulty, req);
  
  console.log(`🔒 [SECURE-CAPTCHA] Generated secure challenge (difficulty ${difficulty}): ${question}`);
  
  return {
    captchaId: id,
    question,
    token,
    difficulty
  };
}

/**
 * Clean expired challenges manually
 */
export function cleanExpiredSecureCaptchas(): number {
  const now = new Date();
  let cleaned = 0;
  
  secureCaptchaChallenges.forEach((challenge, id) => {
    if (now.getTime() - challenge.createdAt.getTime() > 300000 || challenge.attempts >= 3) {
      secureCaptchaChallenges.delete(id);
      cleaned++;
    }
  });
  
  console.log(`🧹 [SECURE-CAPTCHA] Cleaned ${cleaned} expired challenges`);
  return cleaned;
}

export default {
  generateSecureCaptcha,
  validateSecureCaptcha,
  getSecureCaptchaDifficulty,
  generateSecureCaptchaResponse,
  cleanExpiredSecureCaptchas
}; 