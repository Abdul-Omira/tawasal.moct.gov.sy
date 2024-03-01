/**
 * Syrian Ministry of Communication - Citizen Engagement Platform
 * JWT Authentication and Authorization Layer
 * 
 * @author Abdulwahab Omira <abdul@omiratech.com>
 * @version 1.0.0
 * @license MIT
 */

import { Express, Request, Response, NextFunction } from "express";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User, loginAttempts } from "@shared/schema";
import { db } from "./db";
import { generateToken, verifyToken, extractTokenFromHeader } from "./jwt";
import { requireJwtToken, requireJwtAdmin } from "./jwtMiddleware";
import { 
  enhancedLoginSecurity, 
  recordFailedAttempt, 
  clearFailedAttempts,
  startPasswordSecurityMonitoring,
  securePasswordChange 
} from "./additional-password-security";

// JWT User interface for requests
interface JwtUser {
  id: number;
  username: string;
  name?: string | null;
  isAdmin: boolean;
}

// Extend Express Request to include JWT user
declare global {
  namespace Express {
    interface User extends JwtUser {}
    interface Request {
      user?: User;
    }
  }
}

const scryptAsync = promisify(scrypt);

// Function to hash passwords
export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// Function to compare passwords
export async function comparePasswords(supplied: string, stored: string) {
  try {
    // Log for debugging with partial masking of passwords for security
    // Password comparison - removed logging for security
    
    // Handle different password formats
    if (!stored.includes('.')) {
      console.error('Password format is invalid, no salt separator found');
      return false;
    }

    const [hashed, salt] = stored.split(".");
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    
    // Use timing-safe comparison to prevent timing attacks
    return timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (error) {
    console.error('Password comparison error:', error);
    return false;
  }
}

export async function setupAuth(app: Express) {
  // Start password security monitoring
  startPasswordSecurityMonitoring();
  
  // Add JWT verification middleware 
  try {
    const { verifyJwtToken } = await import('./jwtMiddleware');
    app.use(verifyJwtToken);
  } catch (error) {
    console.error('Error importing JWT middleware:', error);
  }

  // 🚨 REGISTRATION ROUTE DISABLED FOR SECURITY 🚨
  // Original registration route removed to prevent unauthorized user creation
  // Only admin users can create new accounts through secure endpoint
  
  // SECURE ADMIN-ONLY USER CREATION ENDPOINT
  app.post("/api/admin/create-user", requireJwtAdmin, async (req, res) => {
    try {
      // Only admins can create users
      if (!req.user?.isAdmin) {
        return res.status(403).json({ 
          success: false,
          message: "غير مصرح لك بإنشاء مستخدمين جدد - مطلوب صلاحيات إدارية" 
        });
      }

      // Validate required fields
      if (!req.body.username || !req.body.password) {
        return res.status(400).json({ 
          success: false,
          message: "اسم المستخدم وكلمة المرور مطلوبان" 
        });
      }

      // Strong password validation
      const password = req.body.password;
      if (password.length < 12 || 
          !/[a-z]/.test(password) || 
          !/[A-Z]/.test(password) || 
          !/\d/.test(password) || 
          !/[!@#$%^&*]/.test(password)) {
        return res.status(400).json({ 
          success: false,
          message: "كلمة المرور يجب أن تحتوي على 12 حرف على الأقل مع أحرف كبيرة وصغيرة وأرقام ورموز خاصة" 
        });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ 
          success: false,
          message: "اسم المستخدم موجود بالفعل" 
        });
      }

      // Hash the password
      const hashedPassword = await hashPassword(req.body.password);
      
      // Create the user (admin can specify if new user is admin)
      const user = await storage.createUser({
        username: req.body.username,
        password: hashedPassword,
        name: req.body.name || null,
        isAdmin: req.body.isAdmin || false
      });

      // Log admin action
      console.log(`🔐 Admin ${req.user.username} created new user: ${req.body.username} (isAdmin: ${req.body.isAdmin || false})`);

      // Remove password from response
      const { password: _, ...userResponse } = user;
      
      return res.status(201).json({
        success: true,
        message: "تم إنشاء المستخدم بنجاح",
        user: userResponse
      });
    } catch (error) {
      console.error('Admin user creation error:', error);
      res.status(500).json({ 
        success: false,
        message: "خطأ في إنشاء الحساب" 
      });
    }
  });

  // 🚨 BLOCK ALL REGISTRATION ATTEMPTS 🚨
  app.post("/api/register", (req, res) => {
    // Log suspicious registration attempt
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    
    console.log(`🚨 BLOCKED REGISTRATION ATTEMPT - IP: ${ipAddress}, User-Agent: ${userAgent}, Username: ${req.body?.username}`);
    
    return res.status(403).json({ 
      success: false,
      message: "التسجيل مغلق لأسباب أمنية - يرجى التواصل مع الإدارة",
      error: "REGISTRATION_DISABLED"
    });
  });

  // 🚨 BLOCK SIGNUP ATTEMPTS 🚨
  app.post("/api/signup", (req, res) => {
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    console.log(`🚨 BLOCKED SIGNUP ATTEMPT - IP: ${ipAddress}`);
    
    return res.status(403).json({ 
      success: false,
      message: "إنشاء الحسابات مغلق لأسباب أمنية",
      error: "SIGNUP_DISABLED"
    });
  });

  // Rate limiter for login protection (to avoid circular dependency)
  const rateLimit = (await import('express-rate-limit')).default;
  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    message: "Too many login attempts from this IP, please try again later.",
    skipSuccessfulRequests: true
  });
  
  // Login endpoint with JWT and rate limiting
  app.post("/api/login", loginLimiter, enhancedLoginSecurity, async (req, res) => {
    try {
    // Track login attempt
    const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] as string || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    const deviceFingerprint = req.body.fingerprint || req.headers['x-device-fingerprint'] as string || 'unknown';
    const deviceInfo = req.body.deviceInfo || null;
    
    // Log the attempt to database with enhanced tracking
    try {
      await db.insert(loginAttempts).values({
        username: req.body.username,
        ipAddress,
        userAgent,
        deviceFingerprint,
        success: false,
        attemptTime: new Date()
      });
      
      // Log device info for security monitoring
      console.log(`🔐 Login attempt - User: ${req.body.username}, IP: ${ipAddress}, Fingerprint: ${deviceFingerprint}`);
      if (deviceInfo) {
        console.log(`📱 Device info collected for ${req.body.username}`);
      }
    } catch (error) {
      console.error('Error logging login attempt:', error);
    }
    
      console.log(`Login attempt for username: ${req.body.username}`);
      
      // Look up user by username
      const user = await storage.getUserByUsername(req.body.username);
      if (!user) {
        console.log(`User not found: ${req.body.username}`);
        return res.status(401).json({ message: "اسم المستخدم غير موجود" });
      }
      
      console.log(`User found: ${req.body.username}, validating password...`);
      
      // Use secure password comparison
      const passwordValid = await comparePasswords(req.body.password, user.password);
      if (!passwordValid) {
        console.log(`Invalid password for user: ${req.body.username}`);
        recordFailedAttempt(req.body.username, ipAddress, 'invalid_password');
        return res.status(401).json({ message: "كلمة المرور غير صحيحة" });
      }
      
      console.log(`Login successful for user: ${req.body.username}`);
      
      // Clear any failed attempts on successful login
      clearFailedAttempts(req.body.username);
      
      // Update successful login
      try {
        await db.insert(loginAttempts).values({
          username: req.body.username,
          ipAddress,
          userAgent,
          deviceFingerprint,
          success: true,
          attemptTime: new Date()
        });
      } catch (error) {
        console.error('Error logging successful login:', error);
      }
      
      // Don't return the password
      const { password: _, ...userWithoutPassword } = user;
      
      // Generate JWT token
      const token = generateToken(userWithoutPassword);
      
      // Set token in HTTP-only cookie for secure access
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Only use HTTPS in production
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });
      
      return res.status(200).json({
        user: userWithoutPassword,
        token
      });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({ message: "خطأ في تسجيل الدخول" });
    }
  });

  // Logout endpoint (JWT doesn't require server-side logout, just client removes token)
  app.post("/api/logout", (req, res) => {
    // Clear the token cookie
    res.clearCookie('token');
    res.json({ message: "تم تسجيل الخروج بنجاح" });
  });

  // Get current user endpoint
  app.get("/api/user", requireJwtToken, (req, res) => {
    res.json(req.user);
  });

  // For admin-only routes
  app.get("/api/admin/user", requireJwtAdmin, (req, res) => {
    res.json({
      id: req.user?.id,
      username: req.user?.username,
      name: req.user?.name,
      isAdmin: req.user?.isAdmin,
    });
  });
}

// Middleware to check if user is authenticated (using JWT)
export const isAuthenticated = requireJwtToken;

// Middleware to check if user is an admin (using JWT)
export const isAdmin = requireJwtAdmin;