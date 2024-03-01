import fs from 'fs';
import path from 'path';
import { Request, Response } from 'express';
import { 
  storeFileSecurely, 
  generateFileAccessToken, 
  serveSecureFile as originalServeSecureFile 
} from './secure-file-handler';

// Safe wrapper for secure file storage
export function safeStoreFileSecurely(fileBuffer: Buffer, originalName: string, mimeType: string, clientIP: string): { 
  success: boolean; 
  secureFileId?: string; 
  accessToken?: string; 
  error?: string 
} {
  try {
    // Store file securely
    const secureFileId = storeFileSecurely(fileBuffer, originalName, mimeType);
    
    // Generate access token
    const accessToken = generateFileAccessToken(secureFileId, originalName, clientIP);
    
    return {
      success: true,
      secureFileId,
      accessToken
    };
  } catch (error) {
    console.error('Secure file storage failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Safe wrapper for secure file serving
export function safeServeSecureFile(req: Request, res: Response): void {
  try {
    originalServeSecureFile(req, res);
  } catch (error) {
    console.error('Secure file serving failed:', error);
    res.status(500).json({ 
      error: 'File serving temporarily unavailable',
      message: 'يرجى المحاولة مرة أخرى لاحقاً'
    });
  }
}

// Check if secure file system is available
export function isSecureFileSystemAvailable(): boolean {
  try {
    const testDir = '/var/secure-uploads';
    return fs.existsSync(testDir) && fs.statSync(testDir).isDirectory();
  } catch (error) {
    return false;
  }
} 