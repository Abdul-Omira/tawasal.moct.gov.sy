/**
 * Syrian Ministry of Communication - Citizen Engagement Platform
 * Database Schema and Validation Types
 * 
 * @author Abdulwahab Omira <abdul@omiratech.com>
 * @version 1.0.0
 * @license MIT
 */

import { pgTable, text, serial, integer, boolean, timestamp, varchar, jsonb, index, decimal, bigint } from "drizzle-orm/pg-core";
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
  assignedTo: integer("assigned_to").references(() => users.id),
  assignedAt: timestamp("assigned_at"),
  assignedBy: integer("assigned_by").references(() => users.id),
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

// Communication assignments table
export const communicationAssignments = pgTable("communication_assignments", {
  id: serial("id").primaryKey(),
  communicationId: integer("communication_id").notNull().references(() => citizenCommunications.id),
  assignedTo: integer("assigned_to").references(() => users.id),
  assignedBy: integer("assigned_by").notNull().references(() => users.id),
  assignmentReason: text("assignment_reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  unassignedAt: timestamp("unassigned_at"),
  unassignedBy: integer("unassigned_by").references(() => users.id),
  unassignmentReason: text("unassignment_reason"),
});

// Communication comments table
export const communicationComments = pgTable("communication_comments", {
  id: serial("id").primaryKey(),
  communicationId: integer("communication_id").notNull().references(() => citizenCommunications.id),
  userId: integer("user_id").notNull().references(() => users.id),
  comment: text("comment").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Communication status history table
export const communicationStatusHistory = pgTable("communication_status_history", {
  id: serial("id").primaryKey(),
  communicationId: integer("communication_id").notNull().references(() => citizenCommunications.id),
  changedBy: integer("changed_by").notNull().references(() => users.id),
  oldStatus: text("old_status"),
  newStatus: text("new_status").notNull(),
  reason: text("reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
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

// Ministry management table
export const ministries = pgTable("ministries", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  domain: varchar("domain", { length: 255 }).unique(),
  branding: jsonb("branding").default({}),
  settings: jsonb("settings").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Role definitions table
export const roleDefinitions = pgTable("role_definitions", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).unique().notNull(),
  description: text("description"),
  permissions: jsonb("permissions").notNull(),
  ministrySpecific: boolean("ministry_specific").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Audit logs table
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  action: varchar("action", { length: 100 }).notNull(),
  resourceType: varchar("resource_type", { length: 50 }),
  resourceId: varchar("resource_id", { length: 100 }),
  details: jsonb("details"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Dynamic forms table
export const dynamicForms = pgTable("dynamic_forms", {
  id: serial("id").primaryKey(),
  ministryId: integer("ministry_id").references(() => ministries.id),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  formSchema: jsonb("form_schema").notNull(),
  styling: jsonb("styling").default({}),
  settings: jsonb("settings").default({}),
  status: varchar("status", { length: 50 }).default("draft"),
  createdBy: integer("created_by").references(() => users.id),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Form submissions table
export const formSubmissions = pgTable("form_submissions", {
  id: serial("id").primaryKey(),
  formId: integer("form_id").references(() => dynamicForms.id),
  data: jsonb("data").notNull(),
  encryptedData: text("encrypted_data"),
  status: varchar("status", { length: 50 }).default("submitted"),
  submittedBy: varchar("submitted_by", { length: 255 }),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Form analytics table (for TimescaleDB)
export const formAnalytics = pgTable("form_analytics", {
  time: timestamp("time").notNull(),
  formId: integer("form_id"),
  eventType: varchar("event_type", { length: 50 }),
  userId: integer("user_id"),
  sessionId: varchar("session_id", { length: 255 }),
  data: jsonb("data"),
});

// Form templates table
export const formTemplates = pgTable("form_templates", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  templateData: jsonb("template_data").notNull(),
  previewImage: text("preview_image"),
  isPublic: boolean("is_public").default(true),
  isMinistrySpecific: boolean("is_ministry_specific").default(false),
  ministryId: text("ministry_id").references(() => ministries.id, { onDelete: "set null" }),
  createdBy: integer("created_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  usageCount: integer("usage_count").default(0),
  rating: text("rating").default("0.0"), // Using text for decimal precision
  tags: text("tags").array().default([]),
  version: integer("version").default(1),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  categoryIdx: index("idx_form_templates_category").on(table.category),
  ministryIdIdx: index("idx_form_templates_ministry_id").on(table.ministryId),
  isPublicIdx: index("idx_form_templates_is_public").on(table.isPublic),
  createdByIdx: index("idx_form_templates_created_by").on(table.createdBy),
}));

// Form versions table for version control
export const formVersions = pgTable("form_versions", {
  id: text("id").primaryKey(),
  formId: text("form_id").notNull().references(() => dynamicForms.id, { onDelete: "cascade" }),
  versionNumber: integer("version_number").notNull(),
  formDefinition: jsonb("form_definition").notNull(),
  changeNotes: text("change_notes"),
  createdBy: integer("created_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  isCurrent: boolean("is_current").default(false),
}, (table) => ({
  formIdIdx: index("idx_form_versions_form_id").on(table.formId),
  versionNumberIdx: index("idx_form_versions_version_number").on(table.versionNumber),
  isCurrentIdx: index("idx_form_versions_is_current").on(table.isCurrent),
  uniqueFormVersion: index("unique_form_version").on(table.formId, table.versionNumber),
}));

// Form permissions table for granular access control
export const formPermissions = pgTable("form_permissions", {
  id: text("id").primaryKey(),
  formId: text("form_id").notNull().references(() => dynamicForms.id, { onDelete: "cascade" }),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  roleId: text("role_id").references(() => roleDefinitions.id, { onDelete: "cascade" }),
  permissionType: text("permission_type").notNull(),
  grantedBy: integer("granted_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  grantedAt: timestamp("granted_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at"),
  isActive: boolean("is_active").default(true),
}, (table) => ({
  formIdIdx: index("idx_form_permissions_form_id").on(table.formId),
  userIdIdx: index("idx_form_permissions_user_id").on(table.userId),
  roleIdIdx: index("idx_form_permissions_role_id").on(table.roleId),
  permissionTypeIdx: index("idx_form_permissions_permission_type").on(table.permissionType),
}));

// Form workflows table for approval workflows
export const formWorkflows = pgTable("form_workflows", {
  id: text("id").primaryKey(),
  formId: text("form_id").notNull().references(() => dynamicForms.id, { onDelete: "cascade" }),
  workflowName: text("workflow_name").notNull(),
  workflowDefinition: jsonb("workflow_definition").notNull(),
  isActive: boolean("is_active").default(true),
  createdBy: integer("created_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  formIdIdx: index("idx_form_workflows_form_id").on(table.formId),
  isActiveIdx: index("idx_form_workflows_is_active").on(table.isActive),
}));

// Form notifications table for submission notifications
export const formNotifications = pgTable("form_notifications", {
  id: text("id").primaryKey(),
  formId: text("form_id").notNull().references(() => dynamicForms.id, { onDelete: "cascade" }),
  notificationType: text("notification_type").notNull(),
  recipientType: text("recipient_type").notNull(),
  recipientId: integer("recipient_id").references(() => users.id, { onDelete: "cascade" }),
  recipientEmail: text("recipient_email"),
  templateId: text("template_id"),
  isEnabled: boolean("is_enabled").default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  formIdIdx: index("idx_form_notifications_form_id").on(table.formId),
  notificationTypeIdx: index("idx_form_notifications_notification_type").on(table.notificationType),
  recipientTypeIdx: index("idx_form_notifications_recipient_type").on(table.recipientType),
}));

// Analytics events table
export const analyticsEvents = pgTable("analytics_events", {
  id: text("id").primaryKey(),
  formId: text("form_id").notNull().references(() => dynamicForms.id, { onDelete: "cascade" }),
  tenantId: text("tenant_id"),
  userId: text("user_id"),
  sessionId: text("session_id"),
  eventType: text("event_type").notNull(),
  eventData: jsonb("event_data").notNull(),
  metadata: jsonb("metadata"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  formIdIdx: index("idx_analytics_events_form_id").on(table.formId),
  tenantIdIdx: index("idx_analytics_events_tenant_id").on(table.tenantId),
  eventTypeIdx: index("idx_analytics_events_event_type").on(table.eventType),
  timestampIdx: index("idx_analytics_events_timestamp").on(table.timestamp),
}));

// Form analytics summary table
export const formAnalyticsSummary = pgTable("form_analytics_summary", {
  id: text("id").primaryKey(),
  formId: text("form_id").notNull().references(() => dynamicForms.id, { onDelete: "cascade" }),
  tenantId: text("tenant_id"),
  totalViews: integer("total_views").notNull().default(0),
  totalSubmissions: integer("total_submissions").notNull().default(0),
  completionRate: decimal("completion_rate", { precision: 5, scale: 2 }).notNull().default("0"),
  averageTimeToComplete: integer("average_time_to_complete").notNull().default(0),
  bounceRate: decimal("bounce_rate", { precision: 5, scale: 2 }).notNull().default("0"),
  deviceBreakdown: jsonb("device_breakdown").notNull().default("{}"),
  browserBreakdown: jsonb("browser_breakdown").notNull().default("{}"),
  osBreakdown: jsonb("os_breakdown").notNull().default("{}"),
  timeSeries: jsonb("time_series").notNull().default("[]"),
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  formIdIdx: index("idx_form_analytics_summary_form_id").on(table.formId),
  tenantIdIdx: index("idx_form_analytics_summary_tenant_id").on(table.tenantId),
}));

// User analytics summary table
export const userAnalyticsSummary = pgTable("user_analytics_summary", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  tenantId: text("tenant_id"),
  totalFormsCreated: integer("total_forms_created").notNull().default(0),
  totalFormsPublished: integer("total_forms_published").notNull().default(0),
  totalSubmissionsReceived: integer("total_submissions_received").notNull().default(0),
  averageFormCompletionRate: decimal("average_form_completion_rate", { precision: 5, scale: 2 }).notNull().default("0"),
  mostUsedComponents: jsonb("most_used_components").notNull().default("[]"),
  activityTimeline: jsonb("activity_timeline").notNull().default("[]"),
  lastActive: timestamp("last_active").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("idx_user_analytics_summary_user_id").on(table.userId),
  tenantIdIdx: index("idx_user_analytics_summary_tenant_id").on(table.tenantId),
}));

// Tenant analytics summary table
export const tenantAnalyticsSummary = pgTable("tenant_analytics_summary", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull().unique(),
  totalForms: integer("total_forms").notNull().default(0),
  totalSubmissions: integer("total_submissions").notNull().default(0),
  totalUsers: integer("total_users").notNull().default(0),
  activeUsers: integer("active_users").notNull().default(0),
  storageUsed: bigint("storage_used", { mode: "number" }).notNull().default(0),
  apiCalls: integer("api_calls").notNull().default(0),
  averageResponseTime: decimal("average_response_time", { precision: 10, scale: 2 }).notNull().default("0"),
  errorRate: decimal("error_rate", { precision: 5, scale: 2 }).notNull().default("0"),
  timeSeries: jsonb("time_series").notNull().default("[]"),
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  tenantIdIdx: index("idx_tenant_analytics_summary_tenant_id").on(table.tenantId),
}));

// Performance metrics table
export const performanceMetrics = pgTable("performance_metrics", {
  id: text("id").primaryKey(),
  metricName: text("metric_name").notNull(),
  metricValue: decimal("metric_value", { precision: 15, scale: 4 }).notNull(),
  metricUnit: text("metric_unit").notNull(),
  tags: jsonb("tags").notNull().default("{}"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  metricNameIdx: index("idx_performance_metrics_name").on(table.metricName),
  timestampIdx: index("idx_performance_metrics_timestamp").on(table.timestamp),
}));

// Security events table
export const securityEvents = pgTable("security_events", {
  id: text("id").primaryKey(),
  eventType: text("event_type").notNull(),
  severity: text("severity").notNull(),
  description: text("description").notNull(),
  userId: text("user_id"),
  tenantId: text("tenant_id"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  requestData: jsonb("request_data"),
  responseData: jsonb("response_data"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  eventTypeIdx: index("idx_security_events_type").on(table.eventType),
  severityIdx: index("idx_security_events_severity").on(table.severity),
  timestampIdx: index("idx_security_events_timestamp").on(table.timestamp),
}));

// API usage logs table
export const apiUsageLogs = pgTable("api_usage_logs", {
  id: text("id").primaryKey(),
  endpoint: text("endpoint").notNull(),
  method: text("method").notNull(),
  userId: text("user_id"),
  tenantId: text("tenant_id"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  requestSize: integer("request_size").notNull().default(0),
  responseSize: integer("response_size").notNull().default(0),
  responseTime: integer("response_time").notNull().default(0),
  statusCode: integer("status_code").notNull(),
  errorMessage: text("error_message"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  endpointIdx: index("idx_api_usage_logs_endpoint").on(table.endpoint),
  methodIdx: index("idx_api_usage_logs_method").on(table.method),
  timestampIdx: index("idx_api_usage_logs_timestamp").on(table.timestamp),
}));

// Real-time metrics table
export const realTimeMetrics = pgTable("real_time_metrics", {
  id: text("id").primaryKey(),
  metricKey: text("metric_key").notNull(),
  metricValue: jsonb("metric_value").notNull(),
  tenantId: text("tenant_id"),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  metricKeyIdx: index("idx_real_time_metrics_key").on(table.metricKey),
  tenantIdIdx: index("idx_real_time_metrics_tenant_id").on(table.tenantId),
  expiresAtIdx: index("idx_real_time_metrics_expires_at").on(table.expiresAt),
}));

// Analytics reports table
export const analyticsReports = pgTable("analytics_reports", {
  id: text("id").primaryKey(),
  reportName: text("report_name").notNull(),
  reportType: text("report_type").notNull(),
  tenantId: text("tenant_id"),
  userId: text("user_id"),
  parameters: jsonb("parameters").notNull().default("{}"),
  data: jsonb("data").notNull().default("{}"),
  status: text("status").notNull().default("pending"),
  filePath: text("file_path"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  reportNameIdx: index("idx_analytics_reports_name").on(table.reportName),
  reportTypeIdx: index("idx_analytics_reports_type").on(table.reportType),
  statusIdx: index("idx_analytics_reports_status").on(table.status),
}));

// Analytics alerts table
export const analyticsAlerts = pgTable("analytics_alerts", {
  id: text("id").primaryKey(),
  alertName: text("alert_name").notNull(),
  alertType: text("alert_type").notNull(),
  condition: jsonb("condition").notNull(),
  threshold: decimal("threshold", { precision: 15, scale: 4 }).notNull(),
  tenantId: text("tenant_id"),
  userId: text("user_id"),
  isActive: boolean("is_active").notNull().default(true),
  lastTriggered: timestamp("last_triggered"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  alertNameIdx: index("idx_analytics_alerts_name").on(table.alertName),
  alertTypeIdx: index("idx_analytics_alerts_type").on(table.alertType),
  isActiveIdx: index("idx_analytics_alerts_is_active").on(table.isActive),
}));

// Update users table with RBAC fields
export const usersExtended = pgTable("users_extended", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }),
  isAdmin: boolean("is_admin").default(false).notNull(),
  ministryId: integer("ministry_id").references(() => ministries.id),
  role: varchar("role", { length: 50 }).notNull().default("viewer"),
  permissions: jsonb("permissions").default([]),
  mfaEnabled: boolean("mfa_enabled").default(false),
  mfaSecret: varchar("mfa_secret", { length: 255 }),
  lastLogin: timestamp("last_login"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Validation schemas for new tables
export const MinistrySchema = z.object({
  name: z.string().min(1, "اسم الوزارة مطلوب"),
  domain: z.string().url().optional(),
  branding: z.record(z.any()).optional(),
  settings: z.record(z.any()).optional(),
});

export const RoleDefinitionSchema = z.object({
  name: z.string().min(1, "اسم الدور مطلوب"),
  description: z.string().optional(),
  permissions: z.array(z.string()),
  ministrySpecific: z.boolean().default(false),
});

export const AuditLogSchema = z.object({
  userId: z.number().optional(),
  action: z.string().min(1, "الإجراء مطلوب"),
  resourceType: z.string().optional(),
  resourceId: z.string().optional(),
  details: z.record(z.any()).optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
});

export const DynamicFormSchema = z.object({
  ministryId: z.number().optional(),
  title: z.string().min(1, "عنوان النموذج مطلوب"),
  description: z.string().optional(),
  formSchema: z.record(z.any()),
  styling: z.record(z.any()).optional(),
  settings: z.record(z.any()).optional(),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  createdBy: z.number(),
});

export const FormSubmissionSchema = z.object({
  formId: z.number(),
  data: z.record(z.any()),
  encryptedData: z.string().optional(),
  status: z.enum(["submitted", "processing", "completed", "failed"]).default("submitted"),
  submittedBy: z.string().optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
});

export const FormAnalyticsSchema = z.object({
  time: z.date(),
  formId: z.number().optional(),
  eventType: z.string(),
  userId: z.number().optional(),
  sessionId: z.string().optional(),
  data: z.record(z.any()).optional(),
});

// Insert schemas for new tables
export const insertMinistrySchema = createInsertSchema(ministries).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertRoleDefinitionSchema = createInsertSchema(roleDefinitions).omit({
  id: true,
  createdAt: true
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  createdAt: true
});

export const insertDynamicFormSchema = createInsertSchema(dynamicForms).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertFormSubmissionSchema = createInsertSchema(formSubmissions).omit({
  id: true,
  createdAt: true
});

export const insertFormAnalyticsSchema = createInsertSchema(formAnalytics);

export const insertFormTemplateSchema = createInsertSchema(formTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertFormVersionSchema = createInsertSchema(formVersions).omit({
  id: true,
  createdAt: true
});

export const insertFormPermissionSchema = createInsertSchema(formPermissions).omit({
  id: true,
  grantedAt: true
});

export const insertFormWorkflowSchema = createInsertSchema(formWorkflows).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertFormNotificationSchema = createInsertSchema(formNotifications).omit({
  id: true,
  createdAt: true
});

// Analytics insert schemas
export const insertAnalyticsEventSchema = createInsertSchema(analyticsEvents).omit({
  id: true,
  timestamp: true,
  createdAt: true
});

export const insertFormAnalyticsSummarySchema = createInsertSchema(formAnalyticsSummary).omit({
  id: true,
  lastUpdated: true,
  createdAt: true
});

export const insertUserAnalyticsSummarySchema = createInsertSchema(userAnalyticsSummary).omit({
  id: true,
  lastActive: true,
  createdAt: true
});

export const insertTenantAnalyticsSummarySchema = createInsertSchema(tenantAnalyticsSummary).omit({
  id: true,
  lastUpdated: true,
  createdAt: true
});

export const insertPerformanceMetricSchema = createInsertSchema(performanceMetrics).omit({
  id: true,
  timestamp: true,
  createdAt: true
});

export const insertSecurityEventSchema = createInsertSchema(securityEvents).omit({
  id: true,
  timestamp: true,
  createdAt: true
});

export const insertApiUsageLogSchema = createInsertSchema(apiUsageLogs).omit({
  id: true,
  timestamp: true,
  createdAt: true
});

export const insertRealTimeMetricSchema = createInsertSchema(realTimeMetrics).omit({
  id: true,
  createdAt: true
});

export const insertAnalyticsReportSchema = createInsertSchema(analyticsReports).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertAnalyticsAlertSchema = createInsertSchema(analyticsAlerts).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// Types
export type BusinessSubmission = typeof businessSubmissions.$inferSelect;
export type InsertBusinessSubmission = z.infer<typeof insertBusinessSubmissionSchema>;
export type CitizenCommunication = typeof citizenCommunications.$inferSelect;
export type InsertCitizenCommunication = z.infer<typeof insertCitizenCommunicationSchema>;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginCredentials = z.infer<typeof LoginSchema>;

// New types
export type Ministry = typeof ministries.$inferSelect;
export type InsertMinistry = z.infer<typeof insertMinistrySchema>;
export type RoleDefinition = typeof roleDefinitions.$inferSelect;
export type InsertRoleDefinition = z.infer<typeof insertRoleDefinitionSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type DynamicForm = typeof dynamicForms.$inferSelect;
export type InsertDynamicForm = z.infer<typeof insertDynamicFormSchema>;
export type FormSubmission = typeof formSubmissions.$inferSelect;
export type InsertFormSubmission = z.infer<typeof insertFormSubmissionSchema>;
export type FormAnalytics = typeof formAnalytics.$inferSelect;
export type InsertFormAnalytics = z.infer<typeof insertFormAnalyticsSchema>;
export type FormTemplate = typeof formTemplates.$inferSelect;
export type InsertFormTemplate = z.infer<typeof insertFormTemplateSchema>;
export type FormVersion = typeof formVersions.$inferSelect;
export type InsertFormVersion = z.infer<typeof insertFormVersionSchema>;
export type FormPermission = typeof formPermissions.$inferSelect;
export type InsertFormPermission = z.infer<typeof insertFormPermissionSchema>;
export type FormWorkflow = typeof formWorkflows.$inferSelect;
export type InsertFormWorkflow = z.infer<typeof insertFormWorkflowSchema>;
export type FormNotification = typeof formNotifications.$inferSelect;
export type InsertFormNotification = z.infer<typeof insertFormNotificationSchema>;

// Analytics types
export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type InsertAnalyticsEvent = z.infer<typeof insertAnalyticsEventSchema>;
export type FormAnalyticsSummary = typeof formAnalyticsSummary.$inferSelect;
export type InsertFormAnalyticsSummary = z.infer<typeof insertFormAnalyticsSummarySchema>;
export type UserAnalyticsSummary = typeof userAnalyticsSummary.$inferSelect;
export type InsertUserAnalyticsSummary = z.infer<typeof insertUserAnalyticsSummarySchema>;
export type TenantAnalyticsSummary = typeof tenantAnalyticsSummary.$inferSelect;
export type InsertTenantAnalyticsSummary = z.infer<typeof insertTenantAnalyticsSummarySchema>;
export type PerformanceMetric = typeof performanceMetrics.$inferSelect;
export type InsertPerformanceMetric = z.infer<typeof insertPerformanceMetricSchema>;
export type SecurityEvent = typeof securityEvents.$inferSelect;
export type InsertSecurityEvent = z.infer<typeof insertSecurityEventSchema>;
export type ApiUsageLog = typeof apiUsageLogs.$inferSelect;
export type InsertApiUsageLog = z.infer<typeof insertApiUsageLogSchema>;
export type RealTimeMetric = typeof realTimeMetrics.$inferSelect;
export type InsertRealTimeMetric = z.infer<typeof insertRealTimeMetricSchema>;
export type AnalyticsReport = typeof analyticsReports.$inferSelect;
export type InsertAnalyticsReport = z.infer<typeof insertAnalyticsReportSchema>;
export type AnalyticsAlert = typeof analyticsAlerts.$inferSelect;
export type InsertAnalyticsAlert = z.infer<typeof insertAnalyticsAlertSchema>;

export type UserExtended = typeof usersExtended.$inferSelect;
export type InsertUserExtended = z.infer<typeof insertUserSchema>;
