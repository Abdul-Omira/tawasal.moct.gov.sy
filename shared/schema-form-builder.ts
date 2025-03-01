/**
 * TAWASAL Form Builder Platform - Database Schema
 * Syrian Ministry of Communication Platform
 * Form Builder Database Schema (SQLite Compatible)
 * 
 * @author Abdulwahab Omira <abdulwahab.omira@moct.gov.sy>
 * @version 1.0.0
 * @license Government of Syria - Ministry of Communications
 * @copyright 2025 Syrian Ministry of Communications and Information Technology
 */

import { sqliteTable, text, integer, real, blob } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email"),
  name: text("name"),
  password: text("password").notNull(),
  is_admin: integer("is_admin", { mode: 'boolean' }).notNull().default(false),
  created_at: integer("created_at", { mode: 'timestamp' }).notNull().default(Date.now()),
});

// Forms table
export const forms = sqliteTable("forms", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  settings: text("settings", { mode: 'json' }).notNull().default('{}'),
  status: text("status").notNull().default("draft"), // draft, published, archived
  createdBy: text("created_by").notNull(),
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().default(Date.now()),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).notNull().default(Date.now()),
  publishedAt: integer("published_at", { mode: 'timestamp' }),
});

// Form components table
export const formComponents = sqliteTable("form_components", {
  id: text("id").primaryKey(),
  formId: text("form_id").notNull(),
  type: text("type").notNull(), // text, dropdown, multi-choice, file-upload, date, rating, page-break
  config: text("config", { mode: 'json' }).notNull().default('{}'),
  orderIndex: integer("order_index").notNull(),
  conditionalLogic: text("conditional_logic", { mode: 'json' }).default('{}'),
  validationRules: text("validation_rules", { mode: 'json' }).default('{}'),
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().default(Date.now()),
});

// Form responses table
export const formResponses = sqliteTable("form_responses", {
  id: text("id").primaryKey(),
  formId: text("form_id").notNull(),
  responseData: text("response_data", { mode: 'json' }).notNull(),
  submittedAt: integer("submitted_at", { mode: 'timestamp' }).notNull().default(Date.now()),
  userInfo: text("user_info", { mode: 'json' }).default('{}'), // IP, user agent, etc.
  status: text("status").notNull().default("completed"), // completed, partial
});

// Form analytics table
export const formAnalytics = sqliteTable("form_analytics", {
  id: text("id").primaryKey(),
  formId: text("form_id").notNull(),
  date: text("date").notNull(), // YYYY-MM-DD
  views: integer("views").default(0),
  submissions: integer("submissions").default(0),
  completionRate: real("completion_rate").default(0.0),
  avgCompletionTime: integer("avg_completion_time").default(0), // seconds
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().default(Date.now()),
});

// Form templates table
export const formTemplates = sqliteTable("form_templates", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  templateData: text("template_data", { mode: 'json' }).notNull(),
  category: text("category").notNull(), // survey, application, feedback
  isPublic: integer("is_public", { mode: 'boolean' }).default(false),
  createdBy: text("created_by").notNull(),
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().default(Date.now()),
});

// Component types enum
export const ComponentType = z.enum([
  'text',
  'textarea',
  'email',
  'phone',
  'number',
  'dropdown',
  'radio',
  'checkbox',
  'multi-select',
  'file-upload',
  'date',
  'time',
  'date-range',
  'rating',
  'scale',
  'nps',
  'page-break',
  'section-header',
  'conditional-logic'
]);

// Form status enum
export const FormStatus = z.enum(['draft', 'published', 'archived']);

// Template category enum
export const TemplateCategory = z.enum(['survey', 'application', 'feedback', 'registration', 'contact']);

// Component configuration schemas
export const TextInputConfig = z.object({
  label: z.string().min(1),
  placeholder: z.string().optional(),
  required: z.boolean().default(false),
  helpText: z.string().optional(),
  maxLength: z.number().optional(),
  minLength: z.number().optional(),
  pattern: z.string().optional(),
  styling: z.object({
    width: z.string().optional(),
    height: z.string().optional(),
    fontSize: z.string().optional(),
    color: z.string().optional(),
  }).optional(),
});

export const DropdownConfig = z.object({
  label: z.string().min(1),
  required: z.boolean().default(false),
  helpText: z.string().optional(),
  options: z.array(z.object({
    value: z.string(),
    label: z.string(),
  })).min(1),
  allowMultiple: z.boolean().default(false),
  styling: z.object({
    width: z.string().optional(),
    height: z.string().optional(),
  }).optional(),
});

export const MultiChoiceConfig = z.object({
  label: z.string().min(1),
  required: z.boolean().default(false),
  helpText: z.string().optional(),
  options: z.array(z.object({
    value: z.string(),
    label: z.string(),
  })).min(1),
  allowMultiple: z.boolean().default(false),
  layout: z.enum(['vertical', 'horizontal', 'grid']).default('vertical'),
  styling: z.object({
    width: z.string().optional(),
    gap: z.string().optional(),
  }).optional(),
});

export const FileUploadConfig = z.object({
  label: z.string().min(1),
  required: z.boolean().default(false),
  helpText: z.string().optional(),
  allowedTypes: z.array(z.string()).default(['image/*', 'application/pdf']),
  maxFileSize: z.number().default(10485760), // 10MB
  maxFiles: z.number().default(1),
  styling: z.object({
    width: z.string().optional(),
    height: z.string().optional(),
  }).optional(),
});

export const DatePickerConfig = z.object({
  label: z.string().min(1),
  required: z.boolean().default(false),
  helpText: z.string().optional(),
  type: z.enum(['date', 'time', 'datetime', 'range']).default('date'),
  minDate: z.string().optional(),
  maxDate: z.string().optional(),
  styling: z.object({
    width: z.string().optional(),
  }).optional(),
});

export const RatingConfig = z.object({
  label: z.string().min(1),
  required: z.boolean().default(false),
  helpText: z.string().optional(),
  type: z.enum(['stars', 'scale', 'nps']).default('stars'),
  maxValue: z.number().default(5),
  minValue: z.number().default(1),
  labels: z.object({
    min: z.string().optional(),
    max: z.string().optional(),
  }).optional(),
  styling: z.object({
    size: z.string().optional(),
    color: z.string().optional(),
  }).optional(),
});

// Conditional logic schema
export const ConditionalLogic = z.object({
  conditions: z.array(z.object({
    fieldId: z.string(),
    operator: z.enum(['equals', 'not_equals', 'contains', 'not_contains', 'greater_than', 'less_than']),
    value: z.any(),
  })),
  action: z.enum(['show', 'hide', 'require', 'optional']),
});

// Validation rules schema
export const ValidationRules = z.object({
  required: z.boolean().optional(),
  minLength: z.number().optional(),
  maxLength: z.number().optional(),
  pattern: z.string().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  customRules: z.array(z.object({
    name: z.string(),
    message: z.string(),
    validator: z.string(), // JavaScript function as string
  })).optional(),
});

// Form settings schema
export const FormSettings = z.object({
  theme: z.object({
    primaryColor: z.string().default('#3b82f6'),
    secondaryColor: z.string().default('#6b7280'),
    backgroundColor: z.string().default('#ffffff'),
    textColor: z.string().default('#1f2937'),
    fontFamily: z.string().default('system-ui'),
  }).optional(),
  branding: z.object({
    logo: z.string().optional(),
    title: z.string().optional(),
    description: z.string().optional(),
  }).optional(),
  behavior: z.object({
    showProgress: z.boolean().default(true),
    allowSaveProgress: z.boolean().default(false),
    requireLogin: z.boolean().default(false),
    allowAnonymous: z.boolean().default(true),
  }).optional(),
  notifications: z.object({
    emailOnSubmit: z.boolean().default(false),
    emailTemplate: z.string().optional(),
    webhookUrl: z.string().optional(),
  }).optional(),
});

// User info schema for responses
export const UserInfo = z.object({
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  referrer: z.string().optional(),
  language: z.string().optional(),
  timezone: z.string().optional(),
  deviceType: z.string().optional(),
  browserInfo: z.object({
    name: z.string().optional(),
    version: z.string().optional(),
    os: z.string().optional(),
  }).optional(),
});

// Main schemas
export const FormSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  settings: FormSettings.default({}),
  status: FormStatus.default('draft'),
  createdBy: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
  publishedAt: z.date().optional(),
});

export const FormComponentSchema = z.object({
  id: z.string().uuid(),
  formId: z.string().uuid(),
  type: ComponentType,
  config: z.union([
    TextInputConfig,
    DropdownConfig,
    MultiChoiceConfig,
    FileUploadConfig,
    DatePickerConfig,
    RatingConfig,
  ]),
  orderIndex: z.number().int().min(0),
  conditionalLogic: ConditionalLogic.optional(),
  validationRules: ValidationRules.optional(),
  createdAt: z.date(),
});

export const FormResponseSchema = z.object({
  id: z.string().uuid(),
  formId: z.string().uuid(),
  responseData: z.record(z.any()),
  submittedAt: z.date(),
  userInfo: UserInfo.optional(),
  status: z.enum(['completed', 'partial']).default('completed'),
});

export const FormAnalyticsSchema = z.object({
  id: z.string().uuid(),
  formId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  views: z.number().int().min(0).default(0),
  submissions: z.number().int().min(0).default(0),
  completionRate: z.number().min(0).max(1).default(0),
  avgCompletionTime: z.number().int().min(0).default(0),
  createdAt: z.date(),
});

export const FormTemplateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  templateData: z.record(z.any()),
  category: TemplateCategory,
  isPublic: z.boolean().default(false),
  createdBy: z.string().uuid(),
  createdAt: z.date(),
});

// Insert schemas
export const insertFormSchema = createInsertSchema(forms);
export const insertFormComponentSchema = createInsertSchema(formComponents);
export const insertFormResponseSchema = createInsertSchema(formResponses);
export const insertFormAnalyticsSchema = createInsertSchema(formAnalytics);
export const insertFormTemplateSchema = createInsertSchema(formTemplates);

// Select schemas
export const selectFormSchema = createSelectSchema(forms);
export const selectFormComponentSchema = createSelectSchema(formComponents);
export const selectFormResponseSchema = createSelectSchema(formResponses);
export const selectFormAnalyticsSchema = createSelectSchema(formAnalytics);
export const selectFormTemplateSchema = createSelectSchema(formTemplates);

// Types
// User schemas
export const UserSchema = createSelectSchema(users);
export const insertUserSchema = createInsertSchema(users);

export type User = z.infer<typeof UserSchema>;
export type Form = z.infer<typeof FormSchema>;
export type FormComponent = z.infer<typeof FormComponentSchema>;
export type FormResponse = z.infer<typeof FormResponseSchema>;
export type FormAnalytics = z.infer<typeof FormAnalyticsSchema>;
export type FormTemplate = z.infer<typeof FormTemplateSchema>;

export type ComponentType = z.infer<typeof ComponentType>;
export type FormStatus = z.infer<typeof FormStatus>;
export type TemplateCategory = z.infer<typeof TemplateCategory>;

export type TextInputConfig = z.infer<typeof TextInputConfig>;
export type DropdownConfig = z.infer<typeof DropdownConfig>;
export type MultiChoiceConfig = z.infer<typeof MultiChoiceConfig>;
export type FileUploadConfig = z.infer<typeof FileUploadConfig>;
export type DatePickerConfig = z.infer<typeof DatePickerConfig>;
export type RatingConfig = z.infer<typeof RatingConfig>;

export type ConditionalLogic = z.infer<typeof ConditionalLogic>;
export type ValidationRules = z.infer<typeof ValidationRules>;
export type FormSettings = z.infer<typeof FormSettings>;
export type UserInfo = z.infer<typeof UserInfo>;

// Insert types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertForm = z.infer<typeof insertFormSchema>;
export type InsertFormComponent = z.infer<typeof insertFormComponentSchema>;
export type InsertFormResponse = z.infer<typeof insertFormResponseSchema>;
export type InsertFormAnalytics = z.infer<typeof insertFormAnalyticsSchema>;
export type InsertFormTemplate = z.infer<typeof insertFormTemplateSchema>;
