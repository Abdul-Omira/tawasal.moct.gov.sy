/**
 * Form Builder Platform - Authentication Middleware
 * Handles JWT authentication and user authorization
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db-form-builder';
import { users, forms } from '../../shared/schema-form-builder';
import { eq } from 'drizzle-orm';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        name: string;
      };
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Authenticate JWT token
export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access token required',
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Get user from database
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, decoded.userId))
      .limit(1);

    if (user.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'User not found',
      });
    }

    // Add user to request
    req.user = {
      id: user[0].id,
      email: user[0].email || '',
      role: user[0].is_admin ? 'admin' : 'user',
      name: user[0].name || '',
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(403).json({
      success: false,
      error: 'Invalid or expired token',
    });
  }
};

// Check if user has admin role
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Admin access required',
    });
  }

  next();
};

// Check if user has employee role or higher
export const requireEmployee = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
  }

  if (!['admin', 'employee'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      error: 'Employee access required',
    });
  }

  next();
};

// Optional authentication (doesn't fail if no token)
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, decoded.userId))
        .limit(1);

      if (user.length > 0) {
        req.user = {
          id: user[0].id,
          email: user[0].email,
          role: user[0].role,
          name: user[0].name,
        };
      }
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

// Rate limiting for form submissions
export const formSubmissionRateLimit = (req: Request, res: Response, next: NextFunction) => {
  // This would typically use a rate limiting library like express-rate-limit
  // For now, we'll implement a simple check
  const clientIp = req.ip || req.connection.remoteAddress;
  
  // In a real implementation, you'd check against a rate limiting store
  // For now, we'll just pass through
  next();
};

// Validate form access permissions
export const validateFormAccess = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const formId = req.params.id || req.params.formId;
    
    if (!formId) {
      return next();
    }

    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    // Check if user has access to this form
    const form = await db
      .select()
      .from(forms)
      .where(eq(forms.id, formId))
      .limit(1);

    if (form.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Form not found',
      });
    }

    // Admin can access all forms
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if user created the form
    if (form[0].createdBy !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to this form',
      });
    }

    next();
  } catch (error) {
    console.error('Form access validation error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to validate form access',
    });
  }
};
