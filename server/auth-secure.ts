import { Express } from "express";
import { storage } from "./storage";
import { generateToken } from "./jwt";
import { requireJwtToken, requireJwtAdmin } from "./jwtMiddleware";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function comparePasswords(supplied: string, stored: string) {
  try {
    if (!stored.includes('.')) {
      return false;
    }
    const [hashed, salt] = stored.split(".");
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    return timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (error) {
    return false;
  }
}

export async function setupAuth(app: Express) {
  // SECURITY: Registration completely disabled
  app.post("/api/register", (req, res) => {
    console.log(`🚨 BLOCKED REGISTRATION ATTEMPT - IP: ${req.ip}`);
    res.status(403).json({ error: "REGISTRATION_DISABLED" });
  });
  
  app.post("/api/signup", (req, res) => {
    console.log(`🚨 BLOCKED SIGNUP ATTEMPT - IP: ${req.ip}`);
    res.status(403).json({ error: "SIGNUP_DISABLED" });
  });

  // Login endpoint
  app.post("/api/login", async (req, res) => {
    try {
      const user = await storage.getUserByUsername(req.body.username);
      if (!user) {
        return res.status(401).json({ message: "اسم المستخدم غير موجود" });
      }
      
      const passwordValid = await comparePasswords(req.body.password, user.password);
      if (!passwordValid) {
        return res.status(401).json({ message: "كلمة المرور غير صحيحة" });
      }
      
      const { password: _, ...userWithoutPassword } = user;
      const token = generateToken(userWithoutPassword);
      
      return res.status(200).json({
        user: userWithoutPassword,
        token
      });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({ message: "خطأ في تسجيل الدخول" });
    }
  });

  app.post("/api/logout", (req, res) => {
    res.json({ message: "تم تسجيل الخروج بنجاح" });
  });

  app.get("/api/user", requireJwtToken, (req, res) => {
    res.json(req.user);
  });
}

export const isAuthenticated = requireJwtToken;
export const isAdmin = requireJwtAdmin; 