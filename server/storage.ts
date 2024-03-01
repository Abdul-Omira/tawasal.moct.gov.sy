/**
 * Syrian Ministry of Communication - Citizen Engagement Platform
 * Data Storage Layer with Encryption and User Management
 * 
 * @author Abdulwahab Omira <abdul@omiratech.com>
 * @version 1.0.0
 * @license MIT
 */

import { 
  BusinessSubmission, 
  InsertBusinessSubmission, 
  User,
  InsertUser,
  LoginCredentials,
  CitizenCommunication,
  InsertCitizenCommunication,
  businessSubmissions,
  citizenCommunications,
  users
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and, like, or, asc, gte } from "drizzle-orm";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { 
  encrypt, 
  decrypt, 
  encryptSensitiveFields, 
  decryptSensitiveFields,
  SENSITIVE_BUSINESS_FIELDS,
  SENSITIVE_COMMUNICATION_FIELDS
} from "./encryption";

const scryptAsync = promisify(scrypt);

/**
 * Helper function to safely decrypt business submission data
 * Uses a more resilient approach with detailed error handling
 */
function safelyDecryptBusinessSubmission(submission: any): any {
  if (!submission) return submission;
  
  // Create a copy to avoid mutating the original
  const decryptedSubmission = { ...submission };
  
  // Attempt to decrypt each sensitive field
  for (const field of SENSITIVE_BUSINESS_FIELDS) {
    try {
      // Only process string fields that are likely encrypted
      if (decryptedSubmission[field] && 
          typeof decryptedSubmission[field] === 'string' && 
          decryptedSubmission[field].length > 0) {
        
        const originalValue = decryptedSubmission[field];
        
        // Try to decrypt all values that might be encrypted
        // even if they don't have the typical encryption pattern
        try {
          const decryptedValue = decrypt(originalValue);
          
          // If decryption was successful and returned a meaningful value
          if (decryptedValue && 
              decryptedValue !== originalValue && 
              (typeof decryptedValue !== 'string' || decryptedValue.trim() !== '')) {
            decryptedSubmission[field] = decryptedValue;
          }
        } catch (decryptError) {
          // If decryption fails, it might not be encrypted
          // Keep the original value and continue
          console.log(`Field ${field} might not be encrypted or uses different format`);
        }
      }
    } catch (error) {
      console.error(`Error processing field ${field}:`, error);
      // Keep the original value if any error occurs
    }
  }
  
  return decryptedSubmission;
}

/**
 * Helper function to safely decrypt citizen communication data
 * Uses a more resilient approach with detailed error handling
 */
function safelyDecryptCitizenCommunication(communication: any): any {
  if (!communication) return communication;
  
  // Create a copy to avoid mutating the original
  const decryptedCommunication = { ...communication };
  
  // Attempt to decrypt each sensitive field
  for (const field of SENSITIVE_COMMUNICATION_FIELDS) {
    try {
      // Only process string fields that are likely encrypted
      if (decryptedCommunication[field] && 
          typeof decryptedCommunication[field] === 'string' && 
          decryptedCommunication[field].length > 0) {
        
        const originalValue = decryptedCommunication[field];
        
        // Try to decrypt all values that might be encrypted
        try {
          const decryptedValue = decrypt(originalValue);
          
          // If decryption was successful and returned a meaningful value
          if (decryptedValue && 
              decryptedValue !== originalValue && 
              (typeof decryptedValue !== 'string' || decryptedValue.trim() !== '')) {
            decryptedCommunication[field] = decryptedValue;
          }
        } catch (decryptError) {
          // If decryption fails, it might not be encrypted
          // Keep the original value and continue
          console.log(`Field ${field} might not be encrypted or uses different format`);
        }
      }
    } catch (error) {
      console.error(`Error processing field ${field}:`, error);
      // Keep the original value if any error occurs
    }
  }
  
  return decryptedCommunication;
}

// Export functionality removed as requested

// Interface for storage operations
export interface IStorage {
  // User operations for local authentication
  getUserById(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserPassword(username: string, password: string): Promise<User | undefined>;
  validateUser(credentials: LoginCredentials): Promise<User | null>;
  isUserAdmin(id: number): Promise<boolean>;
  setUserAsAdmin(id: number): Promise<User>;
  
  // Business submission operations
  getAllBusinessSubmissions(): Promise<BusinessSubmission[]>;
  getBusinessSubmissionById(id: number): Promise<BusinessSubmission | undefined>;
  createBusinessSubmission(submission: InsertBusinessSubmission): Promise<BusinessSubmission>;
  updateBusinessSubmissionStatus(id: number, status: string): Promise<BusinessSubmission | undefined>;
  
  // Advanced business submission operations for admin panel
  getBusinessSubmissionsWithFilters(options: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ data: BusinessSubmission[]; total: number }>;
  getBusinessSubmissionStats(): Promise<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    byBusinessType: Record<string, number>;
  }>;
  
  // Citizen communication operations
  getAllCitizenCommunications(): Promise<CitizenCommunication[]>;
  getCitizenCommunicationById(id: number): Promise<CitizenCommunication | undefined>;
  createCitizenCommunication(communication: InsertCitizenCommunication): Promise<CitizenCommunication>;
  updateCitizenCommunicationStatus(id: number, status: string): Promise<CitizenCommunication | undefined>;
  
  // Advanced citizen communication operations for admin panel
  getCitizenCommunicationsWithFilters(options: {
    status?: string;
    communicationType?: string;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ data: CitizenCommunication[]; total: number }>;
  getCitizenCommunicationStats(): Promise<{
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    approved: number;
    rejected: number;
    byType: Record<string, number>;
    trends: {
      daily: Array<{ date: string; count: number }>;
      weekly: Array<{ week: string; count: number }>;
      monthly: Array<{ month: string; count: number }>;
    };
    deviceAnalytics: {
      byDeviceType: Record<string, number>;
      byBrowser: Record<string, number>;
      byOperatingSystem: Record<string, number>;
    };
    attachments: {
      withAttachments: number;
      withoutAttachments: number;
      byFileType: Record<string, number>;
      totalSize: number;
    };
    responseMetrics: {
      averageResponseTime: number;
      pendingOlderThan24h: number;
      pendingOlderThan7days: number;
    };
    geographicData: {
      byCountry: Record<string, number>;
      byRegion: Record<string, number>;
    };
  }>;
  

}

// Helper functions for password hashing
async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// Storage class for database operations
export class DatabaseStorage implements IStorage {
  // Citizen communication operations
  async getAllCitizenCommunications(): Promise<CitizenCommunication[]> {
    const communications = await db
      .select()
      .from(citizenCommunications)
      .orderBy(desc(citizenCommunications.createdAt));
    
    // Use our helper function to safely decrypt all communications
    return communications.map(communication => safelyDecryptCitizenCommunication(communication));
  }
  
  async getCitizenCommunicationById(id: number): Promise<CitizenCommunication | undefined> {
    const results = await db.select().from(citizenCommunications).where(eq(citizenCommunications.id, id));
    
    if (results.length === 0) {
      return undefined;
    }
    
    // Use our helper function to safely decrypt the communication
    return safelyDecryptCitizenCommunication(results[0]);
  }
  
  async createCitizenCommunication(communication: InsertCitizenCommunication): Promise<CitizenCommunication> {
    try {
      console.log("Creating citizen communication (sensitive info redacted)");
      console.log("Input data keys:", Object.keys(communication));
      
      // Only include fields that exist in the database schema
      const sanitizedData = {
        fullName: communication.fullName,
        email: communication.email,
        phone: communication.phone,
        communicationType: communication.communicationType,
        subject: communication.subject,
        message: communication.message,
        attachmentUrl: communication.attachmentUrl,
        attachmentName: communication.attachmentName,
        attachmentType: communication.attachmentType,
        attachmentSize: communication.attachmentSize,
        captchaAnswer: communication.captchaAnswer,
        consentToDataUse: communication.consentToDataUse,
        status: "pending",
        createdAt: new Date()
      };
      
      console.log("Sanitized data keys:", Object.keys(sanitizedData));
      console.log("Attempting database insert...");
      
      // Temporarily disable encryption to fix 500 error
      const results = await db.insert(citizenCommunications).values(sanitizedData).returning();
      
      console.log("Database insert successful, returned:", results[0]?.id);
      
      // Return the data directly since we're not encrypting
      return results[0];
    } catch (error) {
      console.error("Error creating citizen communication:", error);
      console.error("Error details:", {
        message: (error as any).message,
        stack: (error as any).stack,
        code: (error as any).code
      });
      throw error;
    }
  }
  
  async updateCitizenCommunicationStatus(id: number, status: string): Promise<CitizenCommunication | undefined> {
    const results = await db
      .update(citizenCommunications)
      .set({ status })
      .where(eq(citizenCommunications.id, id))
      .returning();
    
    if (results.length === 0) {
      return undefined;
    }
    
    return safelyDecryptCitizenCommunication(results[0]);
  }
  
  async getCitizenCommunicationsWithFilters(options: {
    status?: string;
    communicationType?: string;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ data: CitizenCommunication[]; total: number }> {
    const {
      status,
      communicationType,
      search = '',
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = options;
    
    console.log('🔍 [STORAGE] getCitizenCommunicationsWithFilters called with:', { status, communicationType, search, page, limit, sortBy, sortOrder });
    
    // Build where conditions
    const conditions = [];
    
    if (status) {
      conditions.push(eq(citizenCommunications.status, status));
    }
    
    if (communicationType) {
      conditions.push(eq(citizenCommunications.communicationType, communicationType));
    }
    
    if (search) {
      const searchTerm = `%${search}%`;
      conditions.push(
        or(
          like(citizenCommunications.subject, searchTerm),
          like(citizenCommunications.fullName, searchTerm)
        )
      );
    }
    
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    console.log('🔍 [STORAGE] Where conditions count:', conditions.length);
    
    // Count total results
    const totalResults = await db
      .select({ count: sql<number>`count(*)` })
      .from(citizenCommunications)
      .where(whereClause);
    
    const total = Number(totalResults[0].count);
    console.log('🔍 [STORAGE] Total count from DB:', total);
    
    // Get paginated results
    const offset = (page - 1) * limit;
    console.log('🔍 [STORAGE] Pagination: offset=', offset, 'limit=', limit);
    
    // Determine sort column and execute query
    let data;
    const query = db
      .select()
      .from(citizenCommunications)
      .where(whereClause)
      .limit(limit)
      .offset(offset);
    
    console.log('🔍 [STORAGE] About to execute query with sortBy:', sortBy, 'sortOrder:', sortOrder);
    
    // Apply sort based on column and order
    if (sortBy === 'fullName') {
      data = sortOrder === 'asc' 
        ? await query.orderBy(asc(citizenCommunications.fullName)) 
        : await query.orderBy(desc(citizenCommunications.fullName));
    } else if (sortBy === 'communicationType') {
      data = sortOrder === 'asc' 
        ? await query.orderBy(asc(citizenCommunications.communicationType)) 
        : await query.orderBy(desc(citizenCommunications.communicationType));
    } else if (sortBy === 'status') {
      data = sortOrder === 'asc' 
        ? await query.orderBy(asc(citizenCommunications.status)) 
        : await query.orderBy(desc(citizenCommunications.status));
    } else if (sortBy === 'phone') {
      data = sortOrder === 'asc' 
        ? await query.orderBy(asc(citizenCommunications.phone)) 
        : await query.orderBy(desc(citizenCommunications.phone));
    } else {
      // Default to createdAt
      data = sortOrder === 'asc' 
        ? await query.orderBy(asc(citizenCommunications.createdAt)) 
        : await query.orderBy(desc(citizenCommunications.createdAt));
    }
    
    console.log('🔍 [STORAGE] Raw data from DB count:', data?.length);
    
    // Decrypt sensitive fields
    const decryptedData = data.map(item => safelyDecryptCitizenCommunication(item));
    console.log('🔍 [STORAGE] Decrypted data count:', decryptedData?.length);
    
    return { data: decryptedData, total };
  }
  
  async getCitizenCommunicationStats(): Promise<{
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    approved: number;
    rejected: number;
    byType: Record<string, number>;
    trends: {
      daily: Array<{ date: string; count: number }>;
      weekly: Array<{ week: string; count: number }>;
      monthly: Array<{ month: string; count: number }>;
    };
    deviceAnalytics: {
      byDeviceType: Record<string, number>;
      byBrowser: Record<string, number>;
      byOperatingSystem: Record<string, number>;
    };
    attachments: {
      withAttachments: number;
      withoutAttachments: number;
      byFileType: Record<string, number>;
      totalSize: number;
    };
    responseMetrics: {
      averageResponseTime: number;
      pendingOlderThan24h: number;
      pendingOlderThan7days: number;
    };
    geographicData: {
      byCountry: Record<string, number>;
      byRegion: Record<string, number>;
    };
  }> {
    // Get counts by status
    const totalResults = await db
      .select({ count: sql<number>`count(*)` })
      .from(citizenCommunications);
    
    const pendingResults = await db
      .select({ count: sql<number>`count(*)` })
      .from(citizenCommunications)
      .where(eq(citizenCommunications.status, 'pending'));
    
    const inProgressResults = await db
      .select({ count: sql<number>`count(*)` })
      .from(citizenCommunications)
      .where(eq(citizenCommunications.status, 'in-progress'));
    
    const completedResults = await db
      .select({ count: sql<number>`count(*)` })
      .from(citizenCommunications)
      .where(eq(citizenCommunications.status, 'completed'));

    const approvedResults = await db
      .select({ count: sql<number>`count(*)` })
      .from(citizenCommunications)
      .where(eq(citizenCommunications.status, 'approved'));
    
    const rejectedResults = await db
      .select({ count: sql<number>`count(*)` })
      .from(citizenCommunications)
      .where(eq(citizenCommunications.status, 'rejected'));
    
    // Get counts by communication type
    const communicationTypeResults = await db
      .select({
        type: citizenCommunications.communicationType,
        count: sql<number>`count(*)`
      })
      .from(citizenCommunications)
      .groupBy(citizenCommunications.communicationType);
    
    const byType: Record<string, number> = {};
    communicationTypeResults.forEach(item => {
      byType[item.type] = Number(item.count);
    });

    // Trends Analysis
    // Daily trends (last 30 days) - handle empty results
    let dailyTrends: Array<{ date: string; count: number }> = [];
    try {
      dailyTrends = await db
        .select({
          date: sql<string>`DATE(${citizenCommunications.createdAt})`,
          count: sql<number>`count(*)`
        })
        .from(citizenCommunications)
        .where(sql`${citizenCommunications.createdAt} >= NOW() - INTERVAL '30 days'`)
        .groupBy(sql`DATE(${citizenCommunications.createdAt})`)
        .orderBy(sql`DATE(${citizenCommunications.createdAt})`);
    } catch (error) {
      console.error('Error fetching daily trends:', error);
      dailyTrends = [];
    }

    // Weekly trends (last 12 weeks) - handle empty results
    let weeklyTrends: Array<{ week: string; count: number }> = [];
    try {
      weeklyTrends = await db
        .select({
          week: sql<string>`DATE_TRUNC('week', ${citizenCommunications.createdAt})`,
          count: sql<number>`count(*)`
        })
        .from(citizenCommunications)
        .where(sql`${citizenCommunications.createdAt} >= NOW() - INTERVAL '12 weeks'`)
        .groupBy(sql`DATE_TRUNC('week', ${citizenCommunications.createdAt})`)
        .orderBy(sql`DATE_TRUNC('week', ${citizenCommunications.createdAt})`);
    } catch (error) {
      console.error('Error fetching weekly trends:', error);
      weeklyTrends = [];
    }

    // Monthly trends (last 12 months) - handle empty results
    let monthlyTrends: Array<{ month: string; count: number }> = [];
    try {
      monthlyTrends = await db
        .select({
          month: sql<string>`DATE_TRUNC('month', ${citizenCommunications.createdAt})`,
          count: sql<number>`count(*)`
        })
        .from(citizenCommunications)
        .where(sql`${citizenCommunications.createdAt} >= NOW() - INTERVAL '12 months'`)
        .groupBy(sql`DATE_TRUNC('month', ${citizenCommunications.createdAt})`)
        .orderBy(sql`DATE_TRUNC('month', ${citizenCommunications.createdAt})`);
    } catch (error) {
      console.error('Error fetching monthly trends:', error);
      monthlyTrends = [];
    }

    // Device Analytics
    const deviceTypeResults = await db
      .select({
        deviceType: citizenCommunications.deviceType,
        count: sql<number>`count(*)`
      })
      .from(citizenCommunications)
      .where(sql`${citizenCommunications.deviceType} IS NOT NULL`)
      .groupBy(citizenCommunications.deviceType);

    const byDeviceType: Record<string, number> = {};
    deviceTypeResults.forEach(item => {
      if (item.deviceType) {
        byDeviceType[item.deviceType] = Number(item.count);
      }
    });

    // Browser analytics from browserInfo JSON
    const browserResults = await db
      .select({
        browserInfo: citizenCommunications.browserInfo,
        count: sql<number>`count(*)`
      })
      .from(citizenCommunications)
      .where(sql`${citizenCommunications.browserInfo} IS NOT NULL`)
      .groupBy(citizenCommunications.browserInfo);

    const byBrowser: Record<string, number> = {};
    const byOperatingSystem: Record<string, number> = {};
    
    browserResults.forEach(item => {
      if (item.browserInfo && typeof item.browserInfo === 'object') {
        const info = item.browserInfo as any;
        if (info.name) {
          byBrowser[info.name] = (byBrowser[info.name] || 0) + Number(item.count);
        }
        if (info.os) {
          byOperatingSystem[info.os] = (byOperatingSystem[info.os] || 0) + Number(item.count);
        }
      }
    });

    // Attachment Analysis
    const withAttachmentsResults = await db
      .select({ count: sql<number>`count(*)` })
      .from(citizenCommunications)
      .where(sql`${citizenCommunications.attachmentUrl} IS NOT NULL`);

    const withoutAttachmentsResults = await db
      .select({ count: sql<number>`count(*)` })
      .from(citizenCommunications)
      .where(sql`${citizenCommunications.attachmentUrl} IS NULL`);

    const attachmentTypeResults = await db
      .select({
        type: citizenCommunications.attachmentType,
        count: sql<number>`count(*)`      })
      .from(citizenCommunications)
      .where(sql`${citizenCommunications.attachmentType} IS NOT NULL`)
      .groupBy(citizenCommunications.attachmentType);

    const byFileType: Record<string, number> = {};
    attachmentTypeResults.forEach(item => {
      if (item.type) {
        byFileType[item.type] = Number(item.count);
      }
    });

    const totalSizeResults = await db
      .select({
        totalSize: sql<number>`SUM(COALESCE(${citizenCommunications.attachmentSize}, 0))`
      })
      .from(citizenCommunications);

    // Response Time Metrics
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const pendingOlderThan24hResults = await db
      .select({ count: sql<number>`count(*)` })
      .from(citizenCommunications)
      .where(sql`${citizenCommunications.status} = 'pending' AND ${citizenCommunications.createdAt} < ${yesterday}`);

    const pendingOlderThan7daysResults = await db
      .select({ count: sql<number>`count(*)` })
      .from(citizenCommunications)
      .where(sql`${citizenCommunications.status} = 'pending' AND ${citizenCommunications.createdAt} < ${weekAgo}`);

    // Geographic Data Analysis
    const geolocationResults = await db
      .select({
        geolocation: citizenCommunications.geolocation,
        count: sql<number>`count(*)`
      })
      .from(citizenCommunications)
      .where(sql`${citizenCommunications.geolocation} IS NOT NULL`)
      .groupBy(citizenCommunications.geolocation);

    const byCountry: Record<string, number> = {};
    const byRegion: Record<string, number> = {};

    geolocationResults.forEach(item => {
      if (item.geolocation && typeof item.geolocation === 'object') {
        const geo = item.geolocation as any;
        if (geo.country) {
          byCountry[geo.country] = (byCountry[geo.country] || 0) + Number(item.count);
        }
        if (geo.region) {
          byRegion[geo.region] = (byRegion[geo.region] || 0) + Number(item.count);
        }
      }
    });
    
    return {
      total: Number(totalResults[0].count),
      pending: Number(pendingResults[0].count),
      inProgress: Number(inProgressResults[0].count),
      completed: Number(completedResults[0].count),
      approved: Number(approvedResults[0].count),
      rejected: Number(rejectedResults[0].count),
      byType,
      trends: {
        daily: dailyTrends.map(item => ({
          date: item.date,
          count: Number(item.count)
        })),
        weekly: weeklyTrends.map(item => ({
          week: item.week,
          count: Number(item.count)
        })),
        monthly: monthlyTrends.map(item => ({
          month: item.month,
          count: Number(item.count)
        }))
      },
      deviceAnalytics: {
        byDeviceType,
        byBrowser,
        byOperatingSystem
      },
      attachments: {
        withAttachments: Number(withAttachmentsResults[0].count),
        withoutAttachments: Number(withoutAttachmentsResults[0].count),
        byFileType,
        totalSize: Number(totalSizeResults[0].totalSize || 0)
      },
      responseMetrics: {
        averageResponseTime: 0, // Could be calculated if we track response times
        pendingOlderThan24h: Number(pendingOlderThan24hResults[0].count),
        pendingOlderThan7days: Number(pendingOlderThan7daysResults[0].count)
      },
      geographicData: {
        byCountry,
        byRegion
      }
    };
  }
  
  // User operations for local authentication
  async getUserById(id: number): Promise<User | undefined> {
    const results = await db.select().from(users).where(eq(users.id, id));
    return results.length > 0 ? results[0] : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const results = await db.select().from(users).where(eq(users.username, username));
    return results.length > 0 ? results[0] : undefined;
  }

  async updateUserPassword(username: string, password: string): Promise<User | undefined> {
    // Hash the password
    const hashedPassword = await hashPassword(password);
    
    // Update the user's password
    const results = await db
      .update(users)
      .set({ 
        password: hashedPassword
      })
      .where(eq(users.username, username))
      .returning();
    
    return results.length > 0 ? results[0] : undefined;
  }
  
  async createUser(userData: InsertUser): Promise<User> {
    // Hash the password before storing if it's not already hashed
    let password = userData.password;
    if (!password.includes('.')) { // Simple check to see if already hashed
      password = await hashPassword(userData.password);
    }
    
    const results = await db
      .insert(users)
      .values({
        ...userData,
        password,
      })
      .returning();
    
    return results[0];
  }

  async validateUser(credentials: LoginCredentials): Promise<User | null> {
    const user = await this.getUserByUsername(credentials.username);
    
    if (!user) {
      return null;
    }
    
    const isValid = await comparePasswords(credentials.password, user.password);
    
    return isValid ? user : null;
  }

  async isUserAdmin(id: number): Promise<boolean> {
    const user = await this.getUserById(id);
    return user?.isAdmin || false;
  }

  async setUserAsAdmin(id: number): Promise<User> {
    const results = await db
      .update(users)
      .set({ 
        isAdmin: true
      })
      .where(eq(users.id, id))
      .returning();
    
    return results[0];
  }

  // Business submission operations
  async getAllBusinessSubmissions(): Promise<BusinessSubmission[]> {
    const submissions = await db
      .select()
      .from(businessSubmissions)
      .orderBy(desc(businessSubmissions.createdAt));
    
    // Use our helper function to safely decrypt all submissions
    return submissions.map(submission => safelyDecryptBusinessSubmission(submission));
  }
  
  async getBusinessSubmissionById(id: number): Promise<BusinessSubmission | undefined> {
    const results = await db.select().from(businessSubmissions).where(eq(businessSubmissions.id, id));
    
    if (results.length === 0) {
      return undefined;
    }
    
    // Use our helper function to safely decrypt the submission
    return safelyDecryptBusinessSubmission(results[0]);
  }
  
  async createBusinessSubmission(insertSubmission: InsertBusinessSubmission): Promise<BusinessSubmission> {
    try {
      console.log("Creating business submission with data (sensitive info redacted)");
      
      // Only include fields that exist in the database schema
      const sanitizedData = {
        businessName: insertSubmission.businessName,
        businessType: insertSubmission.businessType,
        establishmentDate: insertSubmission.establishmentDate,
        employeesCount: insertSubmission.employeesCount,
        address: insertSubmission.address,
        governorate: insertSubmission.governorate,
        registrationNumber: insertSubmission.registrationNumber,
        contactName: insertSubmission.contactName,
        position: insertSubmission.position,
        email: insertSubmission.email,
        phone: insertSubmission.phone,
        alternativeContact: insertSubmission.alternativeContact,
        website: insertSubmission.website,
        challenges: insertSubmission.challenges,
        challengeDetails: insertSubmission.challengeDetails,
        techNeeds: insertSubmission.techNeeds,
        techDetails: insertSubmission.techDetails,
        consentToDataUse: insertSubmission.consentToDataUse,
        wantsUpdates: insertSubmission.wantsUpdates,
        additionalComments: insertSubmission.additionalComments,
        sanctionedCompanyName: insertSubmission.sanctionedCompanyName,
        sanctionedCompanyLink: insertSubmission.sanctionedCompanyLink,
        captchaAnswer: insertSubmission.captchaAnswer,
        status: "pending",
        createdAt: new Date()
      };
      
      // Encrypt sensitive fields before storing in database
      const encryptedData = { ...sanitizedData };
      
      // Encrypt each sensitive field
      for (const field of SENSITIVE_BUSINESS_FIELDS) {
        if (encryptedData[field] && typeof encryptedData[field] === 'string') {
          encryptedData[field] = encrypt(encryptedData[field]);
        }
      }
      
      const results = await db.insert(businessSubmissions).values(encryptedData).returning();
      
      // Decrypt the data before returning to client
      const decryptedSubmission = { ...results[0] };
      
      // Decrypt each sensitive field with improved error handling
      for (const field of SENSITIVE_BUSINESS_FIELDS) {
        try {
          // Only attempt to decrypt if the field exists and is a non-empty string
          if (decryptedSubmission[field] && 
              typeof decryptedSubmission[field] === 'string' && 
              decryptedSubmission[field].trim() !== '') {
            
            const encryptedValue = decryptedSubmission[field];
            const decryptedValue = decrypt(encryptedValue);
            
            // Only use decrypted value if it's not null and not empty
            if (decryptedValue !== null && 
                decryptedValue !== undefined && 
                (typeof decryptedValue !== 'string' || decryptedValue.trim() !== '')) {
              decryptedSubmission[field] = decryptedValue;
            }
          }
        } catch (error) {
          console.error(`Error handling decryption for field ${field}:`, error);
          // Keep the original value if anything goes wrong
        }
      }
      
      console.log("Business submission created successfully with encrypted sensitive data");
      return decryptedSubmission;
    } catch (error) {
      console.error("Database error creating submission:", error);
      throw error;
    }
  }
  
  async updateBusinessSubmissionStatus(id: number, status: string): Promise<BusinessSubmission | undefined> {
    const results = await db
      .update(businessSubmissions)
      .set({ 
        status
      })
      .where(eq(businessSubmissions.id, id))
      .returning();
    
    if (results.length === 0) {
      return undefined;
    }
    
    // Decrypt sensitive fields before returning
    const submission = results[0];
    const decryptedSubmission = { ...submission };
    
    // Decrypt each sensitive field
    for (const field of SENSITIVE_BUSINESS_FIELDS) {
      if (decryptedSubmission[field] && typeof decryptedSubmission[field] === 'string') {
        try {
          decryptedSubmission[field] = decrypt(decryptedSubmission[field]);
        } catch (error) {
          console.error(`Error decrypting field ${field}:`, error);
          // Keep the encrypted value if decryption fails
        }
      }
    }
    
    return decryptedSubmission;
  }

  // Advanced business submission operations for admin panel
  async getBusinessSubmissionsWithFilters(options: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ data: BusinessSubmission[]; total: number }> {
    const { 
      status, 
      search, 
      page = 1, 
      limit = 10, 
      sortBy = 'createdAt', 
      sortOrder = 'desc' 
    } = options;
    
    // Build the query conditions
    let conditions = [];
    
    if (status) {
      conditions.push(eq(businessSubmissions.status, status));
    }
    
    if (search) {
      const searchTerm = `%${search}%`;
      conditions.push(
        or(
          like(businessSubmissions.businessName, searchTerm),
          like(businessSubmissions.contactName, searchTerm),
          like(businessSubmissions.email, searchTerm),
          like(businessSubmissions.phone, searchTerm)
        )
      );
    }
    
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    
    // Count total results
    const totalResults = await db
      .select({ count: sql<number>`count(*)` })
      .from(businessSubmissions)
      .where(whereClause);
    
    const total = Number(totalResults[0].count);
    
    // Get paginated data
    const offset = (page - 1) * limit;
    
    // Build the query with sorting
    let orderByField;
    switch (sortBy) {
      case 'businessName':
        orderByField = businessSubmissions.businessName;
        break;
      case 'businessType':
        orderByField = businessSubmissions.businessType;
        break;
      case 'status':
        orderByField = businessSubmissions.status;
        break;
      case 'date':
        orderByField = businessSubmissions.createdAt;
        break;
      default:
        orderByField = businessSubmissions.createdAt;
    }
    
    // Get the data with proper ordering
    const encryptedData = await db
      .select()
      .from(businessSubmissions)
      .where(whereClause)
      .orderBy(sortOrder === 'asc' ? orderByField : desc(orderByField))
      .limit(limit)
      .offset(offset);
    
    // Use our helper function to safely decrypt all submissions
    const data = encryptedData.map(submission => safelyDecryptBusinessSubmission(submission));
    
    return { data, total };
  }

  async getBusinessSubmissionStats(): Promise<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    byBusinessType: Record<string, number>;
  }> {
    // Get counts by status
    const totalResults = await db
      .select({ count: sql<number>`count(*)` })
      .from(businessSubmissions);
    
    const pendingResults = await db
      .select({ count: sql<number>`count(*)` })
      .from(businessSubmissions)
      .where(eq(businessSubmissions.status, 'pending'));
    
    const approvedResults = await db
      .select({ count: sql<number>`count(*)` })
      .from(businessSubmissions)
      .where(eq(businessSubmissions.status, 'approved'));
    
    const rejectedResults = await db
      .select({ count: sql<number>`count(*)` })
      .from(businessSubmissions)
      .where(eq(businessSubmissions.status, 'rejected'));
    
    // Get counts by business type
    const businessTypeResults = await db
      .select({
        type: businessSubmissions.businessType,
        count: sql<number>`count(*)`
      })
      .from(businessSubmissions)
      .groupBy(businessSubmissions.businessType);
    
    const byBusinessType: Record<string, number> = {};
    
    businessTypeResults.forEach(item => {
      if (item.type) {
        byBusinessType[item.type] = Number(item.count);
      }
    });
    
    return {
      total: Number(totalResults[0].count),
      pending: Number(pendingResults[0].count),
      approved: Number(approvedResults[0].count),
      rejected: Number(rejectedResults[0].count),
      byBusinessType
    };
  }


}

export const storage = new DatabaseStorage();

