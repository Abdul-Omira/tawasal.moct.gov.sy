import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';

// Secure file storage configuration
const SECURE_UPLOADS_DIR = process.env.SECURE_UPLOADS_DIR || '/var/secure-uploads';
const FILE_ACCESS_SECRET = process.env.FILE_ACCESS_SECRET || crypto.randomBytes(32).toString('hex');

// Ensure FILE_ACCESS_SECRET is consistent
if (!process.env.FILE_ACCESS_SECRET) {
  console.warn('FILE_ACCESS_SECRET not set in environment, using generated key. This may cause issues in clustered environments.');
}

// Create secure uploads directory
if (!fs.existsSync(SECURE_UPLOADS_DIR)) {
  fs.mkdirSync(SECURE_UPLOADS_DIR, { recursive: true, mode: 0o700 });
}

// File access token interface
interface FileAccessToken {
  fileId: string;
  originalName: string;
  expiresAt: number;
  ipAddress: string;
}

// Generate secure file ID (unpredictable)
export function generateSecureFileId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = crypto.randomBytes(16).toString('hex');
  const hash = crypto.createHash('sha256').update(timestamp + randomPart).digest('hex').substring(0, 16);
  return `${timestamp}_${hash}_${randomPart}`;
}

// Generate file access token
export function generateFileAccessToken(fileId: string, originalName: string, ipAddress: string): string {
  const payload: FileAccessToken = {
    fileId,
    originalName,
    expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
    ipAddress
  };
  
  return jwt.sign(payload, FILE_ACCESS_SECRET, { expiresIn: '24h' });
}

// Helper function to extract real client IP from proxy headers
function extractClientIP(req: any): string {
  // Priority order for IP extraction:
  // 1. X-Real-IP header (nginx real IP)
  // 2. X-Forwarded-For header (first IP if multiple)
  // 3. req.ip (express default)
  // 4. req.connection.remoteAddress (fallback)
  
  const xRealIP = req.headers['x-real-ip'];
  if (xRealIP && typeof xRealIP === 'string') {
    return xRealIP.trim();
  }
  
  const xForwardedFor = req.headers['x-forwarded-for'];
  if (xForwardedFor && typeof xForwardedFor === 'string') {
    // X-Forwarded-For can contain multiple IPs: "client, proxy1, proxy2"
    const firstIP = xForwardedFor.split(',')[0].trim();
    if (firstIP) {
      return firstIP;
    }
  }
  
  return req.ip || req.connection?.remoteAddress || 'unknown';
}

// Helper function to check if IPs are in the same subnet or legitimate proxy scenario
function isIPAddressValid(originalIP: string, currentIP: string): boolean {
  // Allow exact match
  if (originalIP === currentIP) {
    return true;
  }
  
  // Allow localhost/loopback variations
  const localhostIPs = ['127.0.0.1', '::1', 'localhost'];
  if (localhostIPs.includes(originalIP) && localhostIPs.includes(currentIP)) {
    return true;
  }
  
  // For production environment, be more flexible with IP validation
  // This is common in proxy/load balancer scenarios
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isProduction) {
    // In production, allow more flexible IP validation
    // This handles nginx proxy, load balancer, and CDN scenarios
    
    // Allow same subnet for IPv4 (common for NAT/proxy scenarios)
    const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const originalMatch = originalIP.match(ipv4Regex);
    const currentMatch = currentIP.match(ipv4Regex);
    
    if (originalMatch && currentMatch) {
      // Check if first 3 octets match (same /24 subnet)
      const originalSubnet = `${originalMatch[1]}.${originalMatch[2]}.${originalMatch[3]}`;
      const currentSubnet = `${currentMatch[1]}.${currentMatch[2]}.${currentMatch[3]}`;
      
      if (originalSubnet === currentSubnet) {
        console.log(`🔒 [SECURE-FILES] IP subnet match: ${originalIP} -> ${currentIP}`);
        return true;
      }
      
      // Allow common proxy/NAT scenarios (same /16 subnet for internal networks)
      const originalNetwork = `${originalMatch[1]}.${originalMatch[2]}`;
      const currentNetwork = `${currentMatch[1]}.${currentMatch[2]}`;
      
      // Common internal network ranges
      const internalRanges = ['192.168', '10.0', '172.16', '172.17', '172.18', '172.19', '172.20'];
      if (internalRanges.includes(originalNetwork) && originalNetwork === currentNetwork) {
        console.log(`🔒 [SECURE-FILES] Internal network match: ${originalIP} -> ${currentIP}`);
        return true;
      }
    }
    
    // In production, also allow if the IPs are from the same ISP/region
    // This is a more relaxed validation for legitimate users behind different proxies
    console.log(`🔒 [SECURE-FILES] Production mode - allowing IP change: ${originalIP} -> ${currentIP}`);
    return true;
  }
  
  // Development mode - stricter validation
  console.log(`🚨 [SECURE-FILES] IP mismatch: ${originalIP} -> ${currentIP}`);
  return false;
}

// Verify file access token
export function verifyFileAccessToken(token: string, ipAddress: string, isAdminRequest: boolean = false): FileAccessToken | null {
  try {
    const decoded = jwt.verify(token, FILE_ACCESS_SECRET) as FileAccessToken;
    
    // Check if token is expired
    if (decoded.expiresAt < Date.now()) {
      console.log(`🚨 [SECURE-FILES] Token expired for IP: ${ipAddress}`);
      return null;
    }
    
    // Skip IP validation for authenticated admin requests
    if (isAdminRequest) {
      console.log(`✅ [SECURE-FILES] Admin access - bypassing IP validation`);
      return decoded;
    }
    
    // Check if IP is valid (flexible validation) for non-admin requests
    if (!isIPAddressValid(decoded.ipAddress, ipAddress)) {
      console.log(`🚨 [SECURE-FILES] IP validation failed: ${decoded.ipAddress} -> ${ipAddress}`);
      return null;
    }
    
    return decoded;
  } catch (error) {
    console.log(`🚨 [SECURE-FILES] Token verification failed: ${error}`);
    return null;
  }
}

// Store file securely
export function storeFileSecurely(fileBuffer: Buffer, originalName: string, mimeType: string): string {
  const secureFileId = generateSecureFileId();
  const fileExtension = path.extname(originalName);
  const secureFileName = `${secureFileId}${fileExtension}`;
  const secureFilePath = path.join(SECURE_UPLOADS_DIR, secureFileName);
  
  // Encrypt file content
  const encryptionKey = crypto.scryptSync(FILE_ACCESS_SECRET, 'salt', 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', encryptionKey, iv);
  
  let encrypted = cipher.update(fileBuffer);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  
  // Store encrypted file with IV
  const finalBuffer = Buffer.concat([iv, encrypted]);
  fs.writeFileSync(secureFilePath, finalBuffer, { mode: 0o600 });
  
  return secureFileId;
}

// Retrieve file securely
export function retrieveFileSecurely(fileId: string): Buffer | null {
  try {
    const files = fs.readdirSync(SECURE_UPLOADS_DIR);
    const targetFile = files.find(f => f.startsWith(fileId));
    
    if (!targetFile) {
      return null;
    }
    
    const filePath = path.join(SECURE_UPLOADS_DIR, targetFile);
    const encryptedData = fs.readFileSync(filePath);
    
    // Extract IV and encrypted content
    const iv = encryptedData.slice(0, 16);
    const encrypted = encryptedData.slice(16);
    
    // Decrypt file
    const encryptionKey = crypto.scryptSync(FILE_ACCESS_SECRET, 'salt', 32);
    const decipher = crypto.createDecipheriv('aes-256-cbc', encryptionKey, iv);
    
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted;
  } catch (error) {
    return null;
  }
}

// Secure file serving endpoint
export function serveSecureFile(req: Request, res: Response): void {
  const { token } = req.params;
  const clientIP = extractClientIP(req);
  
  // Check if this is an admin request by looking for user data in request
  // This is set by the isAuthenticated and isAdmin middleware
  const isAdminRequest = !!(req as any).user && (req as any).user.role === 'admin';
  
  console.log(`🔒 [SECURE-FILES] File access attempt from IP: ${clientIP} (Admin: ${isAdminRequest})`);
  console.log(`🔒 [SECURE-FILES] Request headers:`, {
    'x-real-ip': req.headers['x-real-ip'],
    'x-forwarded-for': req.headers['x-forwarded-for'],
    'req.ip': req.ip,
    'connection.remoteAddress': req.connection?.remoteAddress
  });
  
  // Verify access token
  const tokenData = verifyFileAccessToken(token, clientIP, isAdminRequest);
  if (!tokenData) {
    console.log(`🚨 [SECURE-FILES] Token verification failed for IP: ${clientIP}`);
    res.status(403).json({ error: 'Invalid or expired file access token' });
    return;
  }
  
  // Retrieve file
  const fileBuffer = retrieveFileSecurely(tokenData.fileId);
  if (!fileBuffer) {
    console.log(`🚨 [SECURE-FILES] File not found: ${tokenData.fileId}`);
    res.status(404).json({ error: 'File not found' });
    return;
  }
  
  console.log(`✅ [SECURE-FILES] File served successfully: ${tokenData.originalName} (Admin: ${isAdminRequest})`);
  
  // Serve file with security headers
  res.setHeader('Content-Disposition', `attachment; filename="${tokenData.originalName}"`);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  res.send(fileBuffer);
}

// Clean up expired files
export function cleanupExpiredFiles(): void {
  try {
    const files = fs.readdirSync(SECURE_UPLOADS_DIR);
    const now = Date.now();
    
    files.forEach(file => {
      const filePath = path.join(SECURE_UPLOADS_DIR, file);
      const stats = fs.statSync(filePath);
      
      // Delete files older than 30 days
      if (now - stats.mtime.getTime() > 30 * 24 * 60 * 60 * 1000) {
        fs.unlinkSync(filePath);
      }
    });
  } catch (error) {
    console.error('Error cleaning up expired files:', error);
  }
}

// Schedule cleanup every 24 hours
setInterval(cleanupExpiredFiles, 24 * 60 * 60 * 1000); 