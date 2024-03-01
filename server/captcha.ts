/**
 * Syrian Ministry of Communication - Secure CAPTCHA System
 * Military-grade CAPTCHA validation with mathematical challenges
 * 
 * @author Security Team
 * @version 2.0.0 - Enhanced Security
 */

import crypto from 'crypto';
import { Request } from 'express';

interface CaptchaChallenge {
  id: string;
  question: string;
  answer: string;
  createdAt: Date;
  difficulty: 1 | 2 | 3 | 4 | 5;
  attempts: number;
}

// In-memory store for CAPTCHA challenges (use Redis in production)
const captchaChallenges = new Map<string, CaptchaChallenge>();

// Clean up expired challenges every 5 minutes
setInterval(() => {
  const now = new Date();
  captchaChallenges.forEach((challenge, id) => {
    // Expire after 10 minutes or 3 failed attempts
    if (now.getTime() - challenge.createdAt.getTime() > 600000 || challenge.attempts >= 3) {
      captchaChallenges.delete(id);
    }
  });
}, 300000);

/**
 * Generate a mathematical CAPTCHA based on difficulty level
 */
export function generateCaptcha(difficulty: 1 | 2 | 3 | 4 | 5 = 1): { id: string; question: string } {
  const id = crypto.randomBytes(16).toString('hex');
  let question: string;
  let answer: string;
  
  switch (difficulty) {
    case 1:
      // Simple addition (5 + 3 = ?)
      const a1 = Math.floor(Math.random() * 20) + 1;
      const b1 = Math.floor(Math.random() * 20) + 1;
      question = `${a1} + ${b1} = ?`;
      answer = (a1 + b1).toString();
      break;
      
    case 2:
      // Addition and subtraction (15 - 7 = ?)
      const a2 = Math.floor(Math.random() * 50) + 10;
      const b2 = Math.floor(Math.random() * 9) + 1;
      const operation = Math.random() > 0.5 ? '+' : '-';
      if (operation === '+') {
        question = `${a2} + ${b2} = ?`;
        answer = (a2 + b2).toString();
      } else {
        question = `${a2} - ${b2} = ?`;
        answer = (a2 - b2).toString();
      }
      break;
      
    case 3:
      // Simple multiplication (6 × 4 = ?)
      const a3 = Math.floor(Math.random() * 12) + 2;
      const b3 = Math.floor(Math.random() * 12) + 2;
      question = `${a3} × ${b3} = ?`;
      answer = (a3 * b3).toString();
      break;
      
    case 4:
      // Mixed operations with parentheses ((5 + 3) × 2 = ?)
      const a4 = Math.floor(Math.random() * 10) + 1;
      const b4 = Math.floor(Math.random() * 10) + 1;
      const c4 = Math.floor(Math.random() * 5) + 2;
      question = `(${a4} + ${b4}) × ${c4} = ?`;
      answer = ((a4 + b4) * c4).toString();
      break;
      
    case 5:
      // Complex operations (25 ÷ 5 + 3 × 2 = ?)
      const a5 = [20, 25, 30, 35, 40, 45][Math.floor(Math.random() * 6)];
      const b5 = [4, 5][Math.floor(Math.random() * 2)];
      const c5 = Math.floor(Math.random() * 5) + 2;
      const d5 = Math.floor(Math.random() * 5) + 2;
      question = `${a5} ÷ ${b5} + ${c5} × ${d5} = ?`;
      answer = (Math.floor(a5 / b5) + (c5 * d5)).toString();
      break;
      
    default:
      const a = Math.floor(Math.random() * 10) + 1;
      const b = Math.floor(Math.random() * 10) + 1;
      question = `${a} + ${b} = ?`;
      answer = (a + b).toString();
  }
  
  const challenge: CaptchaChallenge = {
    id,
    question,
    answer,
    createdAt: new Date(),
    difficulty,
    attempts: 0
  };
  
  captchaChallenges.set(id, challenge);
  
  return { id, question };
}

/**
 * Validate CAPTCHA answer with enhanced security
 */
export function validateCaptcha(captchaId: string, userAnswer: string, req?: Request): boolean {
  if (!captchaId || !userAnswer) {
    console.log('🚨 [CAPTCHA] Missing CAPTCHA ID or answer');
    return false;
  }
  
  const challenge = captchaChallenges.get(captchaId);
  if (!challenge) {
    console.log('🚨 [CAPTCHA] Invalid or expired CAPTCHA ID');
    return false;
  }
  
  // Increment attempt counter
  challenge.attempts++;
  
  // Check if too many attempts
  if (challenge.attempts > 3) {
    console.log('🚨 [CAPTCHA] Too many failed attempts');
    captchaChallenges.delete(captchaId);
    return false;
  }
  
  // Check if expired (10 minutes)
  const now = new Date();
  if (now.getTime() - challenge.createdAt.getTime() > 600000) {
    console.log('🚨 [CAPTCHA] Expired CAPTCHA');
    captchaChallenges.delete(captchaId);
    return false;
  }
  
  // Validate answer
  const isValid = userAnswer.trim() === challenge.answer;
  
  if (isValid) {
    console.log('✅ [CAPTCHA] Valid CAPTCHA answer');
    captchaChallenges.delete(captchaId); // Remove after successful validation
  } else {
    console.log('🚨 [CAPTCHA] Invalid CAPTCHA answer');
  }
  
  return isValid;
}

/**
 * Get CAPTCHA difficulty based on IP reputation
 */
export function getCaptchaDifficulty(req: Request): 1 | 2 | 3 | 4 | 5 {
  const userAgent = req.get('user-agent') || '';
  const ip = req.ip || req.connection.remoteAddress;
  
  // High difficulty for suspicious patterns
  const suspiciousPatterns = [
    'curl', 'wget', 'python', 'bot', 'crawler', 'scanner',
    'postman', 'insomnia', 'httpie', 'requests'
  ];
  
  for (const pattern of suspiciousPatterns) {
    if (userAgent.toLowerCase().includes(pattern)) {
      console.log(`🔒 [CAPTCHA] High difficulty for suspicious user agent: ${pattern}`);
      return 5;
    }
  }
  
  // Medium difficulty for automation indicators
  if (!userAgent || userAgent.length < 10) {
    return 4;
  }
  
  // Check request patterns (simplified - use Redis in production)
  const requestCount = getRecentRequestCount(ip || 'unknown');
  if (requestCount > 10) {
    return 3;
  }
  
  return 1; // Normal difficulty
}

/**
 * Get recent request count for IP (simplified implementation)
 */
function getRecentRequestCount(ip: string): number {
  // This is a simplified implementation
  // In production, use Redis with sliding window
  return 0;
}

/**
 * Generate CAPTCHA API endpoint response
 */
export function generateCaptchaResponse(req: Request): { captchaId: string; question: string; difficulty: number } {
  const difficulty = getCaptchaDifficulty(req);
  const { id, question } = generateCaptcha(difficulty);
  
  console.log(`🔒 [CAPTCHA] Generated challenge (difficulty ${difficulty}): ${question}`);
  
  return {
    captchaId: id,
    question,
    difficulty
  };
}

/**
 * Clean expired challenges manually
 */
export function cleanExpiredCaptchas(): number {
  const now = new Date();
  let cleaned = 0;
  
  captchaChallenges.forEach((challenge, id) => {
    if (now.getTime() - challenge.createdAt.getTime() > 600000 || challenge.attempts >= 3) {
      captchaChallenges.delete(id);
      cleaned++;
    }
  });
  
  return cleaned;
}

export default {
  generateCaptcha,
  validateCaptcha,
  getCaptchaDifficulty,
  generateCaptchaResponse,
  cleanExpiredCaptchas
}; 