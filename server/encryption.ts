/**
 * Syrian Ministry of Communication - Citizen Engagement Platform
 * Data Encryption and Security Utilities
 * 
 * @author Abdulwahab Omira <abdul@omiratech.com>
 * @version 1.0.0
 * @license MIT
 */

import CryptoJS from 'crypto-js';

// ENCRYPTION_KEY must be set in environment variables for all environments
// No fallback values are used for security reasons
if (!process.env.SESSION_SECRET) {
  console.error('ERROR: SESSION_SECRET environment variable is required for encryption');
  console.error('Please set this environment variable with a secure random value');
  process.exit(1);
}

const ENCRYPTION_KEY = process.env.SESSION_SECRET;

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
    
    // If decryption returns empty, it might not have been encrypted properly
    if (!decrypted || decrypted.length === 0) {
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