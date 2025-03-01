/**
 * TAWASAL.MOCT.GOV.SY - Local Development Database Schema
 * Syrian Ministry of Communication Platform
 * Local Development Database Schema (SQLite Compatible)
 * 
 * @author Abdulwahab Omira <abdulwahab.omira@moct.gov.sy>
 * @version 1.0.0
 * @license Government of Syria - Ministry of Communications
 * @copyright 2025 Syrian Ministry of Communications and Information Technology
 */

import { sqliteTable, text, integer, real, blob } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Citizen communications schema
export const citizenCommunications = sqliteTable("citizen_communications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  governorate: text("governorate"),
  communicationType: text("communication_type").notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  attachmentUrl: text("attachment_url"),
  attachmentType: text("attachment_type"),
  attachmentName: text("attachment_name"),
  attachmentSize: integer("attachment_size"),
  captchaAnswer: text("captcha_answer").notNull(),
  consentToDataUse: integer("consent_to_data_use", { mode: 'boolean' }).notNull(),
  wantsUpdates: integer("wants_updates", { mode: 'boolean' }).default(false),
  status: text("status").notNull().default("pending"),
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().default(Date.now()),
  // Network & Location Metadata
  ipAddress: text("ip_address"),
  geolocation: text("geolocation"), // JSON string for SQLite
  ispInfo: text("isp_info"), // JSON string for SQLite
  vpnDetection: text("vpn_detection"), // JSON string for SQLite
  hostingProvider: text("hosting_provider"),
  // Device & Browser Metadata
  userAgent: text("user_agent"),
  browserInfo: text("browser_info"), // JSON string for SQLite
  deviceType: text("device_type"),
  language: text("language"),
  screenResolution: text("screen_resolution"),
  timezone: text("timezone"),
  touchSupport: integer("touch_support", { mode: 'boolean' }),
  batteryStatus: text("battery_status"), // JSON string for SQLite
  installedFonts: text("installed_fonts"), // Comma-separated string for SQLite
  // Browser Environment Metadata
  referrerUrl: text("referrer_url"),
  pageUrl: text("page_url"),
  pageLoadTime: integer("page_load_time"),
  javascriptEnabled: integer("javascript_enabled", { mode: 'boolean' }),
  cookiesEnabled: integer("cookies_enabled", { mode: 'boolean' }),
  doNotTrack: integer("do_not_track", { mode: 'boolean' }),
  browserPlugins: text("browser_plugins"), // Comma-separated string for SQLite
  webglFingerprint: text("webgl_fingerprint"),
});

// Business submissions schema
export const businessSubmissions = sqliteTable("business_submissions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  businessName: text("business_name"),
  businessType: text("business_type"),
  establishmentDate: text("establishment_date"),
  employeesCount: text("employees_count").notNull(),
  address: text("address").notNull(),
  governorate: text("governorate").notNull(),
  registrationNumber: text("registration_number"),
  contactName: text("contact_name").notNull(),
  position: text("position").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  alternativeContact: text("alternative_contact"),
  website: text("website"),
  challenges: text("challenges").notNull(), // Comma-separated string for SQLite
  challengeDetails: text("challenge_details").notNull(),
  techNeeds: text("tech_needs").notNull(), // Comma-separated string for SQLite
  techDetails: text("tech_details"),
  consentToDataUse: integer("consent_to_data_use", { mode: 'boolean' }).notNull(),
  wantsUpdates: integer("wants_updates", { mode: 'boolean' }).notNull().default(false),
  additionalComments: text("additional_comments"),
  sanctionedCompanyName: text("sanctioned_company_name"),
  sanctionedCompanyLink: text("sanctioned_company_link"),
  captchaAnswer: text("captcha_answer"),
  status: text("status").notNull().default("pending"),
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().default(Date.now()),
  // Network & Location Metadata
  ipAddress: text("ip_address"),
  geolocation: text("geolocation"), // JSON string for SQLite
  ispInfo: text("isp_info"), // JSON string for SQLite
  vpnDetection: text("vpn_detection"), // JSON string for SQLite
  hostingProvider: text("hosting_provider"),
  // Device & Browser Metadata
  userAgent: text("user_agent"),
  browserInfo: text("browser_info"), // JSON string for SQLite
  deviceType: text("device_type"),
  language: text("language"),
  screenResolution: text("screen_resolution"),
  timezone: text("timezone"),
  touchSupport: integer("touch_support", { mode: 'boolean' }),
  batteryStatus: text("battery_status"), // JSON string for SQLite
  installedFonts: text("installed_fonts"), // Comma-separated string for SQLite
  // Browser Environment Metadata
  referrerUrl: text("referrer_url"),
  pageUrl: text("page_url"),
  pageLoadTime: integer("page_load_time"),
  javascriptEnabled: integer("javascript_enabled", { mode: 'boolean' }),
  cookiesEnabled: integer("cookies_enabled", { mode: 'boolean' }),
  doNotTrack: integer("do_not_track", { mode: 'boolean' }),
  browserPlugins: text("browser_plugins"), // Comma-separated string for SQLite
  webglFingerprint: text("webgl_fingerprint"),
});

// Session storage table for authentication
export const sessions = sqliteTable("sessions", {
  sid: text("sid").primaryKey(),
  sess: text("sess").notNull(), // JSON string for SQLite
  expire: integer("expire", { mode: 'timestamp' }).notNull(),
});

// User storage table for local authentication
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name"),
  isAdmin: integer("is_admin", { mode: 'boolean' }).default(false).notNull(),
  createdAt: integer("created_at", { mode: 'timestamp' }).default(Date.now()),
});

// Login attempts tracking table
export const loginAttempts = sqliteTable("login_attempts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  deviceFingerprint: text("device_fingerprint"),
  success: integer("success", { mode: 'boolean' }).notNull().default(false),
  attemptTime: integer("attempt_time", { mode: 'timestamp' }).notNull().default(Date.now()),
});

// Business submission validation schema
export const BusinessSubmissionSchema = z.object({
  businessName: z.string().optional(),
  businessType: z.string().optional(),
  establishmentDate: z.string().optional(),
  employeesCount: z.string().min(1, { message: "عدد الموظفين مطلوب" }),
  address: z.string().min(1, { message: "العنوان مطلوب" }),
  governorate: z.string().min(1, { message: "المحافظة مطلوبة" }),
  registrationNumber: z.string().optional(),
  contactName: z.string().min(1, { message: "الاسم مطلوب" }),
  position: z.string().min(1, { message: "المنصب مطلوب" }),
  email: z.string().email({ message: "البريد الإلكتروني غير صالح" }),
  phone: z.string().min(1, { message: "رقم الهاتف مطلوب" }),
  alternativeContact: z.string().optional(),
  website: z.string().optional(),
  challenges: z.array(z.string()).min(1, { message: "يرجى اختيار تحدي واحد على الأقل" }),
  challengeDetails: z.string().min(1, { message: "تفاصيل التحديات مطلوبة" }),
  techNeeds: z.array(z.string()).min(1, { message: "يرجى اختيار احتياج تقني واحد على الأقل" }),
  techDetails: z.string().optional(),
  consentToDataUse: z.boolean().refine(val => val === true, { message: "يجب الموافقة على استخدام البيانات" }),
  wantsUpdates: z.boolean().default(false),
  additionalComments: z.string().optional(),
  sanctionedCompanyName: z.string().optional(),
  sanctionedCompanyLink: z.string().optional(),
  captchaAnswer: z.string().min(1, { message: "الإجابة على سؤال التحقق مطلوبة" }),
});

// User validation schema
export const UserSchema = z.object({
  username: z.string()
    .min(3, { message: "اسم المستخدم يجب أن يكون 3 أحرف على الأقل" })
    .max(50, { message: "اسم المستخدم يجب أن لا يتجاوز 50 حرف" }),
  password: z.string()
    .min(8, { message: "كلمة المرور يجب أن تكون 8 أحرف على الأقل" })
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/,
      { message: "كلمة المرور يجب أن تحتوي على حرف كبير وحرف صغير ورقم ورمز خاص على الأقل" }
    ),
  name: z.string().optional(),
  isAdmin: z.boolean().default(false),
});

export const LoginSchema = z.object({
  username: z.string().min(1, { message: "اسم المستخدم مطلوب" }),
  password: z.string().min(1, { message: "كلمة المرور مطلوبة" }),
});

// Citizen Communication validation schema
export const CitizenCommunicationSchema = z.object({
  fullName: z.string().min(1, { message: "الاسم الكامل مطلوب" }),
  email: z.string().email({ message: "البريد الإلكتروني غير صالح" }),
  phone: z.string().optional(),
  governorate: z.string().optional(),
  communicationType: z.string().min(1, { message: "نوع التواصل مطلوب" }),
  subject: z.string().min(1, { message: "الموضوع مطلوب" }),
  message: z.string().min(10, { message: "الرسالة يجب أن تكون 10 أحرف على الأقل" }),
  attachmentUrl: z.string().optional(),
  attachmentType: z.string().optional(),
  attachmentName: z.string().optional(),
  attachmentSize: z.number().optional(),
  captchaAnswer: z.string().min(1, { message: "الإجابة على سؤال التحقق مطلوبة" }),
  consentToDataUse: z.boolean().refine(val => val === true, { message: "يجب الموافقة على استخدام البيانات" }),
  wantsUpdates: z.boolean().default(false),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true
});

export const insertCitizenCommunicationSchema = createInsertSchema(citizenCommunications).omit({
  id: true,
  createdAt: true,
  status: true
});

export const insertBusinessSubmissionSchema = createInsertSchema(businessSubmissions).omit({
  id: true,
  createdAt: true,
  status: true
});

// Types
export type BusinessSubmission = typeof businessSubmissions.$inferSelect;
export type InsertBusinessSubmission = z.infer<typeof insertBusinessSubmissionSchema>;
export type CitizenCommunication = typeof citizenCommunications.$inferSelect;
export type InsertCitizenCommunication = z.infer<typeof insertCitizenCommunicationSchema>;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginCredentials = z.infer<typeof LoginSchema>;

