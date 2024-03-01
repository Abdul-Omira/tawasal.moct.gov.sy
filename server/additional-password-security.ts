/**
 * Additional Password Security Features
 * @copyright 2025 Syrian Ministry of Communications and Information Technology
 */

import { Request, Response } from 'express';

// Track failed login attempts
const failedAttempts = new Map<string, { count: number; lastAttempt: Date }>();

// Clear failed attempts for a user
export const clearFailedAttempts = (identifier: string) => {
  failedAttempts.delete(identifier);
};

// Check if user is locked out
export const isUserLockedOut = (identifier: string): boolean => {
  const attempts = failedAttempts.get(identifier);
  if (!attempts) return false;
  
  const now = new Date();
  const timeDiff = now.getTime() - attempts.lastAttempt.getTime();
  const lockoutDuration = 15 * 60 * 1000; // 15 minutes
  
  if (timeDiff > lockoutDuration) {
    clearFailedAttempts(identifier);
    return false;
  }
  
  return attempts.count >= 5;
};

// Record failed attempt
export const recordFailedAttempt = (identifier: string) => {
  const attempts = failedAttempts.get(identifier) || { count: 0, lastAttempt: new Date() };
  attempts.count += 1;
  attempts.lastAttempt = new Date();
  failedAttempts.set(identifier, attempts);
};

// Start password security monitoring
export const startPasswordSecurityMonitoring = () => {
  // Clean up old failed attempts every hour
  setInterval(() => {
    const now = new Date();
    for (const [identifier, attempts] of failedAttempts.entries()) {
      const timeDiff = now.getTime() - attempts.lastAttempt.getTime();
      const lockoutDuration = 15 * 60 * 1000; // 15 minutes
      
      if (timeDiff > lockoutDuration) {
        failedAttempts.delete(identifier);
      }
    }
  }, 60 * 60 * 1000); // Every hour
};

// Enhanced login security middleware
export const enhancedLoginSecurity = (req: Request, res: Response, next: Function) => {
  const identifier = req.body.email || req.body.username || req.ip || 'unknown';
  
  if (isUserLockedOut(identifier)) {
    return res.status(429).json({
      error: 'Account temporarily locked due to too many failed attempts. Please try again later.',
      retryAfter: '15 minutes'
    });
  }
  
  next();
};

// Secure password change
export const securePasswordChange = async (req: Request, res: Response) => {
  // This would implement secure password change logic
  // For now, just return a placeholder
  res.json({ message: 'Password change functionality not yet implemented' });
};
