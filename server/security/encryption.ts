/**
 * Syrian Ministry of Communication - Citizen Engagement Platform
 * Data Encryption and Security Utilities
 * 
 * @author Abdulwahab Omira <abdul@omiratech.com>
 * @version 1.0.0
 * @license MIT
 */

import CryptoJS from 'crypto-js';
import { randomBytes, createHash, scrypt } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

// ENCRYPTION_KEY must be set in environment variables for all environments
// No fallback values are used for security reasons
if (!process.env.SESSION_SECRET) {
  console.error('ERROR: SESSION_SECRET environment variable is required for encryption');
  console.error('Please set this environment variable with a secure random value');
  process.exit(1);
}

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || process.env.SESSION_SECRET;

/**
 * Encrypts a string or object using AES encryption
 * @param data The data to encrypt (string or object)
 * @returns Encrypted string (Base64 encoded)
 */
export function encrypt(data: any): string {
  try {
    // Handle null or undefined
    if (data === null || data === undefined) {
      return '';
    }
    
    // Convert objects to JSON strings before encryption
    const dataStr = typeof data === 'string' ? data : JSON.stringify(data);
    
    // Encrypt the data
    const encrypted = CryptoJS.AES.encrypt(dataStr, ENCRYPTION_KEY).toString();
    
    return encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    // Return the original data as a string if encryption fails
    return String(data);
  }
}

/**
 * Decrypts an encrypted string
 * @param encryptedData The encrypted data (Base64 encoded string)
 * @param asObject Whether to parse the decrypted result as JSON
 * @returns Decrypted data as string or object
 */
export function decrypt(encryptedData: string, asObject: boolean = false): any {
  // If the data is not a string or is empty, return it as is
  if (!encryptedData || typeof encryptedData !== 'string') {
    return encryptedData;
  }
  
  try {
    // Decrypt the data
    const decrypted = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY).toString(CryptoJS.enc.Utf8);
    
    // If decryption returns empty, try with SESSION_SECRET as fallback
    if (!decrypted || decrypted.length === 0) {
      if (process.env.SESSION_SECRET && process.env.SESSION_SECRET !== ENCRYPTION_KEY) {
        try {
          const fallbackDecrypted = CryptoJS.AES.decrypt(encryptedData, process.env.SESSION_SECRET).toString(CryptoJS.enc.Utf8);
          if (fallbackDecrypted && fallbackDecrypted.length > 0) {
            if (asObject) {
              try {
                return JSON.parse(fallbackDecrypted);
              } catch (e) {
                return fallbackDecrypted;
              }
            }
            return fallbackDecrypted;
          }
        } catch (fallbackError) {
          // Fallback also failed, continue with original logic
        }
      }
      return encryptedData; // Return original if decryption resulted in empty string
    }
    
    // Return as object if requested and possible
    if (asObject) {
      try {
        return JSON.parse(decrypted);
      } catch (e) {
        // If parsing fails, return as string
        return decrypted;
      }
    }
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    return encryptedData; // Return original data instead of null
  }
}

/**
 * Hash a string using SHA-256 (one-way hash, not reversible)
 * Use this for values that don't need to be decrypted but should be protected
 * @param data The data to hash
 * @returns Hashed string
 */
export function hash(data: string): string {
  return CryptoJS.SHA256(data).toString();
}

/**
 * Encrypts sensitive fields in an object
 * @param data The object with fields to encrypt
 * @param sensitiveFields Array of field names to encrypt
 * @returns Object with encrypted fields
 */
export function encryptSensitiveFields<T>(data: T, sensitiveFields: (keyof T)[]): T {
  const result = { ...data } as any;
  
  for (const field of sensitiveFields) {
    if (result[field] !== undefined && result[field] !== null) {
      result[field] = encrypt(result[field]);
    }
  }
  
  return result;
}

/**
 * Decrypts sensitive fields in an object
 * @param data The object with encrypted fields
 * @param sensitiveFields Array of field names to decrypt
 * @returns Object with decrypted fields
 */
export function decryptSensitiveFields<T>(data: T, sensitiveFields: (keyof T)[]): T {
  const result = { ...data } as any;
  
  for (const field of sensitiveFields) {
    if (result[field] !== undefined && result[field] !== null) {
      result[field] = decrypt(result[field]);
    }
  }
  
  return result;
}

// List of sensitive fields that should be encrypted in the database
export const SENSITIVE_BUSINESS_FIELDS = [
  'email',
  'phone',
  'contactName',
  'businessName',
  'address',
  'sanctionedCompanyName',
  'sanctionedCompanyLink',
  'challengeDetails'
] as const;

// List of sensitive fields in citizen communications that should be encrypted
export const SENSITIVE_COMMUNICATION_FIELDS = [
  'fullName',
  'email',
  'phone',
  'message',
  'subject'
] as const;

// Type for sensitive business fields
export type SensitiveBusinessField = typeof SENSITIVE_BUSINESS_FIELDS[number];

// Type for sensitive communication fields
export type SensitiveCommunicationField = typeof SENSITIVE_COMMUNICATION_FIELDS[number];

// Field-level encryption key management
interface EncryptionKey {
  id: string;
  key: string;
  version: number;
  createdAt: Date;
  isActive: boolean;
}

class FieldEncryptionManager {
  private keys: Map<string, EncryptionKey> = new Map();
  private currentKeyId: string | null = null;

  constructor() {
    this.initializeKeys();
  }

  private async initializeKeys() {
    // Generate initial encryption key
    const keyId = await this.generateNewKey();
    this.currentKeyId = keyId;
  }

  private async generateNewKey(): Promise<string> {
    const keyId = randomBytes(16).toString('hex');
    const salt = randomBytes(16);
    const key = await scryptAsync(ENCRYPTION_KEY, salt, 32) as Buffer;
    
    const encryptionKey: EncryptionKey = {
      id: keyId,
      key: key.toString('hex'),
      version: this.keys.size + 1,
      createdAt: new Date(),
      isActive: true,
    };

    this.keys.set(keyId, encryptionKey);
    return keyId;
  }

  async getCurrentKey(): Promise<EncryptionKey> {
    if (!this.currentKeyId) {
      this.currentKeyId = await this.generateNewKey();
    }
    return this.keys.get(this.currentKeyId)!;
  }

  async rotateKeys(): Promise<string> {
    // Deactivate current key
    if (this.currentKeyId) {
      const currentKey = this.keys.get(this.currentKeyId);
      if (currentKey) {
        currentKey.isActive = false;
      }
    }

    // Generate new key
    const newKeyId = await this.generateNewKey();
    this.currentKeyId = newKeyId;
    
    return newKeyId;
  }

  async getKeyById(keyId: string): Promise<EncryptionKey | null> {
    return this.keys.get(keyId) || null;
  }

  async getAllKeys(): Promise<EncryptionKey[]> {
    return Array.from(this.keys.values());
  }
}

// Global field encryption manager instance
export const fieldEncryptionManager = new FieldEncryptionManager();

/**
 * Encrypts a field with field-level encryption
 * @param fieldName The name of the field being encrypted
 * @param value The value to encrypt
 * @param keyId Optional key ID to use for encryption
 * @returns Encrypted field data with metadata
 */
export async function encryptField(fieldName: string, value: any, keyId?: string): Promise<string> {
  try {
    if (value === null || value === undefined) {
      return '';
    }

    const key = keyId ? await fieldEncryptionManager.getKeyById(keyId) : await fieldEncryptionManager.getCurrentKey();
    if (!key) {
      throw new Error('Encryption key not found');
    }

    const dataStr = typeof value === 'string' ? value : JSON.stringify(value);
    const encrypted = CryptoJS.AES.encrypt(dataStr, key.key).toString();
    
    // Include metadata for decryption
    const encryptedData = {
      keyId: key.id,
      version: key.version,
      data: encrypted,
      field: fieldName,
      timestamp: new Date().toISOString(),
    };

    return JSON.stringify(encryptedData);
  } catch (error) {
    console.error('Field encryption error:', error);
    throw new Error('Failed to encrypt field');
  }
}

/**
 * Decrypts a field with field-level encryption
 * @param encryptedFieldData The encrypted field data
 * @returns Decrypted field value
 */
export async function decryptField(encryptedFieldData: string): Promise<any> {
  try {
    if (!encryptedFieldData) {
      return null;
    }

    const fieldData = JSON.parse(encryptedFieldData);
    const key = await fieldEncryptionManager.getKeyById(fieldData.keyId);
    
    if (!key) {
      throw new Error(`Encryption key not found: ${fieldData.keyId}`);
    }

    const decrypted = CryptoJS.AES.decrypt(fieldData.data, key.key).toString(CryptoJS.enc.Utf8);
    
    // Try to parse as JSON, fallback to string
    try {
      return JSON.parse(decrypted);
    } catch {
      return decrypted;
    }
  } catch (error) {
    console.error('Field decryption error:', error);
    throw new Error('Failed to decrypt field');
  }
}

/**
 * Encrypts multiple fields in an object
 * @param data The object containing fields to encrypt
 * @param fieldsToEncrypt Array of field names to encrypt
 * @param keyId Optional key ID to use for encryption
 * @returns Object with encrypted fields
 */
export async function encryptFields(data: any, fieldsToEncrypt: string[], keyId?: string): Promise<any> {
  const result = { ...data };
  
  for (const field of fieldsToEncrypt) {
    if (data[field] !== undefined && data[field] !== null) {
      try {
        result[field] = await encryptField(field, data[field], keyId);
      } catch (error) {
        console.error(`Failed to encrypt field ${field}:`, error);
        // Keep original value if encryption fails
      }
    }
  }
  
  return result;
}

/**
 * Decrypts multiple fields in an object
 * @param data The object containing encrypted fields
 * @param fieldsToDecrypt Array of field names to decrypt
 * @returns Object with decrypted fields
 */
export async function decryptFields(data: any, fieldsToDecrypt: string[]): Promise<any> {
  const result = { ...data };
  
  for (const field of fieldsToDecrypt) {
    if (data[field] && typeof data[field] === 'string') {
      try {
        // Check if it's encrypted field data (contains keyId)
        if (data[field].includes('"keyId"')) {
          result[field] = await decryptField(data[field]);
        }
      } catch (error) {
        console.error(`Failed to decrypt field ${field}:`, error);
        // Keep original value if decryption fails
      }
    }
  }
  
  return result;
}

/**
 * Creates a hash of sensitive data for indexing/searching
 * @param data The data to hash
 * @returns SHA-256 hash of the data
 */
export function createDataHash(data: any): string {
  const dataStr = typeof data === 'string' ? data : JSON.stringify(data);
  return createHash('sha256').update(dataStr).digest('hex');
}

/**
 * Validates encryption key integrity
 * @param keyId The key ID to validate
 * @returns True if key is valid and active
 */
export async function validateEncryptionKey(keyId: string): Promise<boolean> {
  const key = await fieldEncryptionManager.getKeyById(keyId);
  return key ? key.isActive : false;
}

/**
 * Gets encryption key statistics
 * @returns Key statistics and metadata
 */
export async function getEncryptionKeyStats(): Promise<any> {
  const keys = await fieldEncryptionManager.getAllKeys();
  const activeKeys = keys.filter(key => key.isActive);
  const inactiveKeys = keys.filter(key => !key.isActive);
  
  return {
    totalKeys: keys.length,
    activeKeys: activeKeys.length,
    inactiveKeys: inactiveKeys.length,
    currentKeyId: fieldEncryptionManager['currentKeyId'],
    oldestKey: keys.length > 0 ? Math.min(...keys.map(k => k.createdAt.getTime())) : null,
    newestKey: keys.length > 0 ? Math.max(...keys.map(k => k.createdAt.getTime())) : null,
  };
}