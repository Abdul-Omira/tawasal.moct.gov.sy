/**
 * Form Builder Platform - Type Definitions
 * TypeScript interfaces and types for the form builder platform
 */

export interface Form {
  id: string;
  title: string;
  description?: string;
  settings: FormSettings;
  status: FormStatus;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
}

export interface FormComponent {
  id: string;
  formId: string;
  type: ComponentType;
  config: ComponentConfig;
  orderIndex: number;
  conditionalLogic?: ConditionalLogic;
  validationRules?: ValidationRules;
  createdAt: Date;
}

export interface FormResponse {
  id: string;
  formId: string;
  responseData: Record<string, any>;
  submittedAt: Date;
  userInfo?: UserInfo;
  status: 'completed' | 'partial';
}

export interface FormAnalytics {
  id: string;
  formId: string;
  date: string; // YYYY-MM-DD
  views: number;
  submissions: number;
  completionRate: number;
  avgCompletionTime: number; // seconds
  createdAt: Date;
}

export interface FormTemplate {
  id: string;
  name: string;
  description?: string;
  templateData: Record<string, any>;
  category: TemplateCategory;
  isPublic: boolean;
  createdBy: string;
  createdAt: Date;
}

// Enums
export type ComponentType = 
  | 'text'
  | 'textarea'
  | 'email'
  | 'phone'
  | 'number'
  | 'dropdown'
  | 'radio'
  | 'checkbox'
  | 'multi-select'
  | 'file-upload'
  | 'date'
  | 'time'
  | 'date-range'
  | 'rating'
  | 'scale'
  | 'nps'
  | 'page-break'
  | 'section-header'
  | 'conditional-logic';

export type FormStatus = 'draft' | 'published' | 'archived';

export type TemplateCategory = 'survey' | 'application' | 'feedback' | 'registration' | 'contact';

// Component Configurations
export interface TextInputConfig {
  label: string;
  placeholder?: string;
  required: boolean;
  helpText?: string;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  styling?: ComponentStyling;
}

export interface TextareaConfig extends TextInputConfig {
  rows?: number;
  cols?: number;
}

export interface EmailConfig extends TextInputConfig {
  validation?: {
    pattern?: string;
    message?: string;
  };
}

export interface PhoneConfig extends TextInputConfig {
  countryCode?: string;
  format?: string;
}

export interface NumberConfig extends TextInputConfig {
  min?: number;
  max?: number;
  step?: number;
  decimal?: boolean;
}

export interface DropdownConfig {
  label: string;
  required: boolean;
  helpText?: string;
  options: Option[];
  allowMultiple: boolean;
  placeholder?: string;
  styling?: ComponentStyling;
}

export interface MultiChoiceConfig {
  label: string;
  required: boolean;
  helpText?: string;
  options: Option[];
  allowMultiple: boolean;
  layout: 'vertical' | 'horizontal' | 'grid';
  styling?: ComponentStyling;
}

export interface FileUploadConfig {
  label: string;
  required: boolean;
  helpText?: string;
  allowedTypes: string[];
  maxFileSize: number; // bytes
  maxFiles: number;
  styling?: ComponentStyling;
}

export interface DatePickerConfig {
  label: string;
  required: boolean;
  helpText?: string;
  type: 'date' | 'time' | 'datetime' | 'range';
  minDate?: string;
  maxDate?: string;
  styling?: ComponentStyling;
}

export interface RatingConfig {
  label: string;
  required: boolean;
  helpText?: string;
  type: 'stars' | 'scale' | 'nps';
  maxValue: number;
  minValue: number;
  labels?: {
    min?: string;
    max?: string;
  };
  styling?: ComponentStyling;
}

export interface PageBreakConfig {
  title?: string;
  description?: string;
  showProgress: boolean;
  styling?: ComponentStyling;
}

export interface SectionHeaderConfig {
  title: string;
  description?: string;
  level: 1 | 2 | 3 | 4 | 5 | 6;
  styling?: ComponentStyling;
}

// Union type for all component configs
export type ComponentConfig = 
  | TextInputConfig
  | TextareaConfig
  | EmailConfig
  | PhoneConfig
  | NumberConfig
  | DropdownConfig
  | MultiChoiceConfig
  | FileUploadConfig
  | DatePickerConfig
  | RatingConfig
  | PageBreakConfig
  | SectionHeaderConfig;

// Supporting interfaces
export interface Option {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface ComponentStyling {
  width?: string;
  height?: string;
  fontSize?: string;
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderRadius?: string;
  padding?: string;
  margin?: string;
  gap?: string;
  size?: string;
}

export interface ConditionalLogic {
  conditions: Condition[];
  action: 'show' | 'hide' | 'require' | 'optional';
}

export interface Condition {
  fieldId: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'is_empty' | 'is_not_empty';
  value: any;
}

export interface ValidationRules {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  min?: number;
  max?: number;
  customRules?: CustomValidationRule[];
}

export interface CustomValidationRule {
  name: string;
  message: string;
  validator: string; // JavaScript function as string
}

export interface FormSettings {
  theme?: {
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
    textColor: string;
    fontFamily: string;
  };
  branding?: {
    logo?: string;
    title?: string;
    description?: string;
  };
  behavior?: {
    showProgress: boolean;
    allowSaveProgress: boolean;
    requireLogin: boolean;
    allowAnonymous: boolean;
  };
  notifications?: {
    emailOnSubmit: boolean;
    emailTemplate?: string;
    webhookUrl?: string;
  };
}

export interface UserInfo {
  ipAddress?: string;
  userAgent?: string;
  referrer?: string;
  language?: string;
  timezone?: string;
  deviceType?: string;
  browserInfo?: {
    name?: string;
    version?: string;
    os?: string;
  };
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Form Builder specific types
export interface FormBuilderState {
  forms: Form[];
  currentForm: Form | null;
  components: FormComponent[];
  selectedComponent: FormComponent | null;
  isPreviewMode: boolean;
  isDirty: boolean;
}

export interface FormBuilderAction {
  type: string;
  payload?: any;
}

// Analytics types
export interface FormAnalyticsData {
  formId: string;
  totalViews: number;
  totalSubmissions: number;
  completionRate: number;
  avgCompletionTime: number;
  dailyStats: DailyStats[];
  componentStats: ComponentStats[];
}

export interface DailyStats {
  date: string;
  views: number;
  submissions: number;
  completionRate: number;
}

export interface ComponentStats {
  componentId: string;
  componentType: ComponentType;
  label: string;
  responseCount: number;
  completionRate: number;
  avgTime: number;
}

// Export types
export interface ExportOptions {
  format: 'csv' | 'pdf' | 'excel';
  dateRange?: {
    start: Date;
    end: Date;
  };
  includeMetadata: boolean;
  includeUserInfo: boolean;
}
