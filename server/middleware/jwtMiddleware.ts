import { Request, Response, NextFunction } from 'express';
import { verifyToken, extractTokenFromHeader, extractTokenFromRequest, refreshTokenIfNeeded } from './jwt';

/**
 * Middleware to verify JWT token from Authorization header
 * This provides extra security on top of session-based authentication
 */
export const verifyJwtToken = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from request headers
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);
    
    // If no token provided, continue to session-based auth
    if (!token) {
      return next();
    }
    
    // Verify token
    const decoded = verifyToken(token);
    if (!decoded) {
      // Invalid token, but allow session auth to handle it
      return next();
    }
    
    // Check if token needs to be refreshed
    const refreshedToken = refreshTokenIfNeeded(token);
    if (refreshedToken && refreshedToken !== token) {
      // Set new token in response header
      res.setHeader('X-Refresh-Token', refreshedToken);
    }
    
    // Set user info from token for routes to use
    // This will provide JWT-based authentication even if session authentication fails
    if (!req.user) {
      req.user = {
        id: decoded.userId,
        username: decoded.username,
        name: decoded.name,
        isAdmin: decoded.isAdmin
      };
    }
    
    next();
  } catch (error) {
    console.error('JWT verification error:', error);
    // Continue to next middleware even on error
    // to allow session-based auth as fallback
    next();
  }
};

/**
 * Middleware that requires a valid JWT token
 * Unlike verifyJwtToken, this will reject requests without valid tokens
 */
export const requireJwtToken = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from request (headers, cookies, body, or query)
    const token = extractTokenFromRequest(req);
    
    // Check if token exists
    if (!token) {
      return res.status(401).json({ message: 'لم يتم توفير رمز المصادقة' });
    }
    
    // Verify token
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ message: 'رمز المصادقة غير صالح' });
    }
    
    // Check if token needs to be refreshed
    const refreshedToken = refreshTokenIfNeeded(token);
    if (refreshedToken && refreshedToken !== token) {
      // Set new token in response header
      res.setHeader('X-Refresh-Token', refreshedToken);
    }
    
    // Set user info from token for routes to use
    req.user = {
      id: decoded.userId,
      username: decoded.username,
      name: decoded.name,
      isAdmin: decoded.isAdmin
    };
    
    next();
  } catch (error) {
    console.error('JWT verification error:', error);
    return res.status(401).json({ message: 'خطأ في التحقق من رمز المصادقة' });
  }
};

/**
 * Middleware that restricts access to admins only using JWT
 */
export const requireJwtAdmin = (req: Request, res: Response, next: NextFunction) => {
  requireJwtToken(req, res, (err) => {
    if (err) {
      return next(err);
    }
    
    // Check if user is admin
    if (!req.user?.isAdmin) {
      return res.status(403).json({ message: 'ليس لديك صلاحيات كافية' });
    }
    
    next();
  });
};