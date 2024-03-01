import jwt from 'jsonwebtoken';
import { User } from '@shared/schema';
import crypto from 'crypto';

// Generate a strong random JWT secret if none is provided in environment
// In production, this will be generated once per deployment
// This approach allows secure deployment without requiring environment variables
let JWT_SECRET: string;

// JWT_SECRET must be set in environment variables for all environments
// No fallback values are used for security reasons
if (!process.env.JWT_SECRET) {
  console.error('ERROR: JWT_SECRET environment variable is required for secure token generation');
  console.error('Please set this environment variable with a secure random value');
  
  // In development mode only, we'll generate a temporary secret but log a warning
  if (process.env.NODE_ENV === 'development') {
    console.warn('SECURITY WARNING: Generating temporary JWT_SECRET for development only');
    console.warn('This is NOT secure for production use');
    const randomBytes = crypto.randomBytes(32);
    JWT_SECRET = randomBytes.toString('hex');
  } else {
    // In production, we'll exit the process to prevent insecure operation
    process.exit(1);
  }
} else {
  JWT_SECRET = process.env.JWT_SECRET;
}
// Set token expiration (default: 1 day if not specified)
// Using type compatible with jsonwebtoken library
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d' as const;

// Security settings
const JWT_ALGORITHM = 'HS256'; // HMAC with SHA-256
const JWT_ISSUER = 'syrian-ministry-comm';
const JWT_AUDIENCE = 'syrian-ministry-comm-clients';

interface JwtPayload {
  userId: number;
  username: string;
  name?: string | null;
  isAdmin: boolean;
  iat?: number; // issued at
  exp?: number; // expiration time
  iss?: string; // issuer
  aud?: string; // audience
  sub?: string; // subject (user id)
  jti?: string; // JWT ID (unique identifier for this token)
}

/**
 * Generate a JWT token for a user
 */
export function generateToken(user: any): string {
  const payload: JwtPayload = {
    userId: user.id,
    username: user.username,
    name: user.name,
    isAdmin: user.isAdmin
  };

  // Cast all to proper types to avoid TS errors
  const secretOrKey = JWT_SECRET as jwt.Secret;
  const options: jwt.SignOptions = {
    expiresIn: JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
    algorithm: JWT_ALGORITHM as jwt.Algorithm,
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
    subject: String(user.id), // Convert to string for proper JWT subject
    jwtid: crypto.randomBytes(16).toString('hex') // Unique token ID to prevent replay attacks
  };
  
  const token = jwt.sign(payload, secretOrKey, options);

  return token;
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: [JWT_ALGORITHM as jwt.Algorithm],
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE
    }) as JwtPayload;
    
    return decoded;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

/**
 * Refresh a token if it's valid but close to expiration
 * @param token The existing token
 * @param thresholdMinutes Minutes before expiration to consider refreshing
 */
export function refreshTokenIfNeeded(token: string, thresholdMinutes = 15): string | null {
  try {
    const decoded = jwt.decode(token) as JwtPayload;
    
    if (!decoded || !decoded.exp) {
      return null;
    }
    
    const expirationTime = decoded.exp * 1000; // Convert to milliseconds
    const currentTime = Date.now();
    const timeUntilExpiration = expirationTime - currentTime;
    const thresholdMs = thresholdMinutes * 60 * 1000;
    
    // If token is close to expiration, generate a new one
    if (timeUntilExpiration < thresholdMs) {
      const newToken = generateToken({
        id: decoded.userId,
        username: decoded.username,
        name: decoded.name,
        isAdmin: decoded.isAdmin
      });
      
      return newToken;
    }
    
    return token;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return null;
  }
}

/**
 * Extract auth token from Authorization header
 */
export function extractTokenFromHeader(authHeader?: string): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  return authHeader.substring(7); // Remove 'Bearer ' prefix
}

// Enhanced token extraction that checks multiple sources
export function extractTokenFromRequest(req: any): string | null {
  // 1. Check Authorization header first
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // 2. Check cookies
  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }
  
  // 3. Check request body (for form submissions)
  if (req.body && req.body.token) {
    return req.body.token;
  }
  
  // 4. Check query parameters
  if (req.query && req.query.token) {
    return req.query.token;
  }
  
  return null;
}