/**
 * Syrian Ministry of Communication - Citizen Engagement Platform
 * Database Schema and Validation Types
 * 
 * @author Abdulwahab Omira <abdul@omiratech.com>
 * @version 1.0.0
 * @license MIT
 */

import { pgTable, text, serial, integer, boolean, timestamp, varchar, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Citizen communications schema
export const citizenCommunications = pgTable("citizen_communications", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  governorate: text("governorate"), // Added governorate field
  communicationType: text("communication_type").notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  attachmentUrl: text("attachment_url"),
  attachmentType: text("attachment_type"),
  attachmentName: text("attachment_name"),
  attachmentSize: integer("attachment_size"),
  captchaAnswer: text("captcha_answer").notNull(),
  consentToDataUse: boolean("consent_to_data_use").notNull(),
  wantsUpdates: boolean("wants_updates").default(false), // Added wantsUpdates field
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  // Network & Location Metadata
  ipAddress: text("ip_address"),
  geolocation: jsonb("geolocation"), // city, region, country, timezone
  ispInfo: jsonb("isp_info"), // ISP name, ASN
  vpnDetection: jsonb("vpn_detection"), // VPN/proxy detection results
  hostingProvider: text("hosting_provider"),
  // Device & Browser Metadata
  userAgent: text("user_agent"),
  browserInfo: jsonb("browser_info"), // type, version, OS
  deviceType: text("device_type"), // mobile, desktop, tablet
  language: text("language"),
  screenResolution: text("screen_resolution"),
  timezone: text("timezone"),
  touchSupport: boolean("touch_support"),
  batteryStatus: jsonb("battery_status"),
  installedFonts: text("installed_fonts").array(),
  // Browser Environment Metadata
  referrerUrl: text("referrer_url"),
  pageUrl: text("page_url"),
  pageLoadTime: integer("page_load_time"), // in milliseconds
  javascriptEnabled: boolean("javascript_enabled"),
  cookiesEnabled: boolean("cookies_enabled"),
  doNotTrack: boolean("do_not_track"),
  browserPlugins: text("browser_plugins").array(),
  webglFingerprint: text("webgl_fingerprint"),
});

// Business submissions schema
export const businessSubmissions = pgTable("business_submissions", {
  id: serial("id").primaryKey(),
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
  challenges: text("challenges").array().notNull(),
  challengeDetails: text("challenge_details").notNull(),
  techNeeds: text("tech_needs").array().notNull(),
  techDetails: text("tech_details"),
  consentToDataUse: boolean("consent_to_data_use").notNull(),
  wantsUpdates: boolean("wants_updates").notNull().default(false),
  additionalComments: text("additional_comments"),
  sanctionedCompanyName: text("sanctioned_company_name"),
  sanctionedCompanyLink: text("sanctioned_company_link"),
  captchaAnswer: text("captcha_answer"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  // Network & Location Metadata
  ipAddress: text("ip_address"),
  geolocation: jsonb("geolocation"), // city, region, country, timezone
  ispInfo: jsonb("isp_info"), // ISP name, ASN
  vpnDetection: jsonb("vpn_detection"), // VPN/proxy detection results
  hostingProvider: text("hosting_provider"),
  // Device & Browser Metadata
  userAgent: text("user_agent"),
  browserInfo: jsonb("browser_info"), // type, version, OS
  deviceType: text("device_type"), // mobile, desktop, tablet
  language: text("language"),
  screenResolution: text("screen_resolution"),
  timezone: text("timezone"),
  touchSupport: boolean("touch_support"),
  batteryStatus: jsonb("battery_status"),
  installedFonts: text("installed_fonts").array(),
  // Browser Environment Metadata
  referrerUrl: text("referrer_url"),
  pageUrl: text("page_url"),
  pageLoadTime: integer("page_load_time"), // in milliseconds
  javascriptEnabled: boolean("javascript_enabled"),
  cookiesEnabled: boolean("cookies_enabled"),
  doNotTrack: boolean("do_not_track"),
  browserPlugins: text("browser_plugins").array(),
  webglFingerprint: text("webgl_fingerprint"),
});

// Session storage table for authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for local authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username").notNull().unique(),
  password: varchar("password").notNull(),
  name: varchar("name"),
  isAdmin: boolean("is_admin").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Login attempts tracking table
export const loginAttempts = pgTable("login_attempts", {
  id: serial("id").primaryKey(),
  username: varchar("username"),
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  deviceFingerprint: text("device_fingerprint"),
  success: boolean("success").notNull().default(false),
  attemptTime: timestamp("attempt_time").notNull().defaultNow(),
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

// Insert schemas
export const insertBusinessSubmissionSchema = createInsertSchema(businessSubmissions).omit({
  id: true,
  createdAt: true,
  status: true
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
  governorate: z.string().optional(), // Added governorate field
  communicationType: z.string().min(1, { message: "نوع التواصل مطلوب" }),
  subject: z.string().min(1, { message: "الموضوع مطلوب" }),
  message: z.string().min(10, { message: "الرسالة يجب أن تكون 10 أحرف على الأقل" }),
  attachmentUrl: z.string().optional(),
  attachmentType: z.string().optional(),
  attachmentName: z.string().optional(),
  attachmentSize: z.number().optional(),
  captchaAnswer: z.string().min(1, { message: "الإجابة على سؤال التحقق مطلوبة" }),
  consentToDataUse: z.boolean().refine(val => val === true, { message: "يجب الموافقة على استخدام البيانات" }),
  wantsUpdates: z.boolean().default(false), // Added wantsUpdates field
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

// Types
export type BusinessSubmission = typeof businessSubmissions.$inferSelect;
export type InsertBusinessSubmission = z.infer<typeof insertBusinessSubmissionSchema>;
export type CitizenCommunication = typeof citizenCommunications.$inferSelect;
export type InsertCitizenCommunication = z.infer<typeof insertCitizenCommunicationSchema>;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginCredentials = z.infer<typeof LoginSchema>;
