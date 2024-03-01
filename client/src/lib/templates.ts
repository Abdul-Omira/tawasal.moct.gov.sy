/**
 * Form Builder Platform - Template System
 * Pre-built form templates for quick form creation
 */

import { Form, FormComponent } from '../types/form';
import { BaseComponent } from '../types/component';

export interface FormTemplate {
  id: string;
  name: string;
  description: string;
  category: 'survey' | 'application' | 'feedback' | 'registration' | 'contact' | 'event';
  icon: string;
  components: BaseComponent[];
  settings: Record<string, any>;
  tags: string[];
  isPublic: boolean;
  createdBy: string;
  createdAt: Date;
}

// Survey Templates
export const surveyTemplates: FormTemplate[] = [
  {
    id: 'citizen-satisfaction',
    name: 'استطلاع رضا المواطنين',
    description: 'استطلاع شامل لقياس رضا المواطنين عن الخدمات الحكومية',
    category: 'survey',
    icon: '📊',
    components: [
      {
        id: 'comp1',
        type: 'text',
        config: {
          label: 'الاسم الكامل',
          placeholder: 'أدخل اسمك الكامل',
          required: true,
          helpText: 'يرجى إدخال اسمك الكامل كما هو مكتوب في الهوية',
        },
        validation: { required: true, minLength: 2, maxLength: 100 },
        orderIndex: 0,
        isVisible: true,
        isRequired: true,
      },
      {
        id: 'comp2',
        type: 'email',
        config: {
          label: 'البريد الإلكتروني',
          placeholder: 'example@email.com',
          required: true,
          helpText: 'سيتم استخدام هذا البريد للتواصل معك',
        },
        validation: { required: true, pattern: '^[^@]+@[^@]+\\.[^@]+$' },
        orderIndex: 1,
        isVisible: true,
        isRequired: true,
      },
      {
        id: 'comp3',
        type: 'dropdown',
        config: {
          label: 'المحافظة',
          placeholder: 'اختر محافظتك',
          required: true,
          options: [
            { label: 'دمشق', value: 'damascus' },
            { label: 'حلب', value: 'aleppo' },
            { label: 'حمص', value: 'homs' },
            { label: 'حماة', value: 'hama' },
            { label: 'اللاذقية', value: 'latakia' },
            { label: 'طرطوس', value: 'tartus' },
            { label: 'إدلب', value: 'idlib' },
            { label: 'الرقة', value: 'raqqa' },
            { label: 'دير الزور', value: 'deir-ez-zor' },
            { label: 'الحسكة', value: 'hasaka' },
            { label: 'القنيطرة', value: 'quneitra' },
            { label: 'السويداء', value: 'sweida' },
            { label: 'درعا', value: 'daraa' },
          ],
        },
        validation: { required: true },
        orderIndex: 2,
        isVisible: true,
        isRequired: true,
      },
      {
        id: 'comp4',
        type: 'rating',
        config: {
          label: 'كيف تقيم جودة الخدمات الحكومية؟',
          required: true,
          ratingType: 'stars',
          maxRating: 5,
        },
        validation: { required: true },
        orderIndex: 3,
        isVisible: true,
        isRequired: true,
      },
      {
        id: 'comp5',
        type: 'multi-choice',
        config: {
          label: 'ما هي الخدمات التي استخدمتها مؤخراً؟',
          required: true,
          choiceType: 'checkbox',
          options: [
            { label: 'تجديد الهوية', value: 'id_renewal' },
            { label: 'تجديد رخصة القيادة', value: 'license_renewal' },
            { label: 'خدمات البلدية', value: 'municipal_services' },
            { label: 'الخدمات الصحية', value: 'health_services' },
            { label: 'الخدمات التعليمية', value: 'education_services' },
            { label: 'خدمات أخرى', value: 'other' },
          ],
        },
        validation: { required: true },
        orderIndex: 4,
        isVisible: true,
        isRequired: true,
      },
      {
        id: 'comp6',
        type: 'textarea',
        config: {
          label: 'اقتراحاتك لتحسين الخدمات',
          placeholder: 'شاركنا اقتراحاتك...',
          required: false,
          helpText: 'اقتراحاتك تساعدنا على تحسين الخدمات',
        },
        validation: { maxLength: 1000 },
        orderIndex: 5,
        isVisible: true,
        isRequired: false,
      },
    ],
    settings: {
      theme: 'government',
      allowSaveProgress: true,
      showProgress: true,
      requireAuthentication: false,
    },
    tags: ['مواطن', 'خدمات', 'رضا', 'حكومي'],
    isPublic: true,
    createdBy: 'system',
    createdAt: new Date(),
  },
];

// Application Templates
export const applicationTemplates: FormTemplate[] = [
  {
    id: 'business-registration',
    name: 'تسجيل الأعمال',
    description: 'نموذج تسجيل الشركات والمؤسسات التجارية',
    category: 'application',
    icon: '🏢',
    components: [
      {
        id: 'comp1',
        type: 'text',
        config: {
          label: 'اسم الشركة/المؤسسة',
          placeholder: 'أدخل اسم الشركة',
          required: true,
        },
        validation: { required: true, minLength: 2, maxLength: 200 },
        orderIndex: 0,
        isVisible: true,
        isRequired: true,
      },
      {
        id: 'comp2',
        type: 'dropdown',
        config: {
          label: 'نوع النشاط',
          placeholder: 'اختر نوع النشاط',
          required: true,
          options: [
            { label: 'تجاري', value: 'commercial' },
            { label: 'صناعي', value: 'industrial' },
            { label: 'خدمي', value: 'service' },
            { label: 'زراعي', value: 'agricultural' },
            { label: 'سياحي', value: 'tourism' },
            { label: 'تقني', value: 'technology' },
          ],
        },
        validation: { required: true },
        orderIndex: 1,
        isVisible: true,
        isRequired: true,
      },
      {
        id: 'comp3',
        type: 'text',
        config: {
          label: 'رقم السجل التجاري',
          placeholder: 'أدخل رقم السجل التجاري',
          required: true,
        },
        validation: { required: true, pattern: '^[0-9]+$' },
        orderIndex: 2,
        isVisible: true,
        isRequired: true,
      },
      {
        id: 'comp4',
        type: 'text',
        config: {
          label: 'اسم المدير المسؤول',
          placeholder: 'أدخل اسم المدير',
          required: true,
        },
        validation: { required: true, minLength: 2, maxLength: 100 },
        orderIndex: 3,
        isVisible: true,
        isRequired: true,
      },
      {
        id: 'comp5',
        type: 'email',
        config: {
          label: 'البريد الإلكتروني',
          placeholder: 'company@example.com',
          required: true,
        },
        validation: { required: true, pattern: '^[^@]+@[^@]+\\.[^@]+$' },
        orderIndex: 4,
        isVisible: true,
        isRequired: true,
      },
      {
        id: 'comp6',
        type: 'phone',
        config: {
          label: 'رقم الهاتف',
          placeholder: '09xxxxxxxx',
          required: true,
        },
        validation: { required: true, pattern: '^09[0-9]{8}$' },
        orderIndex: 5,
        isVisible: true,
        isRequired: true,
      },
      {
        id: 'comp7',
        type: 'textarea',
        config: {
          label: 'وصف النشاط',
          placeholder: 'وصف مفصل لنشاط الشركة...',
          required: true,
        },
        validation: { required: true, minLength: 50, maxLength: 1000 },
        orderIndex: 6,
        isVisible: true,
        isRequired: true,
      },
      {
        id: 'comp8',
        type: 'file-upload',
        config: {
          label: 'المستندات المطلوبة',
          required: true,
          acceptTypes: ['.pdf', '.jpg', '.png', '.doc', '.docx'],
          maxFileSize: 5 * 1024 * 1024, // 5MB
          multiple: true,
        },
        validation: { required: true },
        orderIndex: 7,
        isVisible: true,
        isRequired: true,
      },
    ],
    settings: {
      theme: 'business',
      allowSaveProgress: true,
      showProgress: true,
      requireAuthentication: true,
    },
    tags: ['أعمال', 'تسجيل', 'شركة', 'تجاري'],
    isPublic: true,
    createdBy: 'system',
    createdAt: new Date(),
  },
];

// Feedback Templates
export const feedbackTemplates: FormTemplate[] = [
  {
    id: 'website-feedback',
    name: 'تقييم الموقع الإلكتروني',
    description: 'نموذج لتقييم تجربة المستخدم على الموقع الإلكتروني',
    category: 'feedback',
    icon: '💻',
    components: [
      {
        id: 'comp1',
        type: 'rating',
        config: {
          label: 'كيف تقيم سهولة استخدام الموقع؟',
          required: true,
          ratingType: 'stars',
          maxRating: 5,
        },
        validation: { required: true },
        orderIndex: 0,
        isVisible: true,
        isRequired: true,
      },
      {
        id: 'comp2',
        type: 'rating',
        config: {
          label: 'كيف تقيم سرعة تحميل الموقع؟',
          required: true,
          ratingType: 'stars',
          maxRating: 5,
        },
        validation: { required: true },
        orderIndex: 1,
        isVisible: true,
        isRequired: true,
      },
      {
        id: 'comp3',
        type: 'multi-choice',
        config: {
          label: 'ما هي المشاكل التي واجهتها؟',
          required: false,
          choiceType: 'checkbox',
          options: [
            { label: 'بطء في التحميل', value: 'slow_loading' },
            { label: 'صعوبة في التنقل', value: 'navigation_issues' },
            { label: 'مشاكل في التصميم', value: 'design_issues' },
            { label: 'مشاكل في المحتوى', value: 'content_issues' },
            { label: 'مشاكل أخرى', value: 'other' },
          ],
        },
        validation: {},
        orderIndex: 2,
        isVisible: true,
        isRequired: false,
      },
      {
        id: 'comp4',
        type: 'textarea',
        config: {
          label: 'اقتراحاتك لتحسين الموقع',
          placeholder: 'شاركنا اقتراحاتك...',
          required: false,
        },
        validation: { maxLength: 500 },
        orderIndex: 3,
        isVisible: true,
        isRequired: false,
      },
    ],
    settings: {
      theme: 'modern',
      allowSaveProgress: false,
      showProgress: false,
      requireAuthentication: false,
    },
    tags: ['موقع', 'تقييم', 'تجربة', 'مستخدم'],
    isPublic: true,
    createdBy: 'system',
    createdAt: new Date(),
  },
];

// Contact Templates
export const contactTemplates: FormTemplate[] = [
  {
    id: 'general-contact',
    name: 'نموذج التواصل العام',
    description: 'نموذج للتواصل مع الوزارة أو المؤسسة',
    category: 'contact',
    icon: '📞',
    components: [
      {
        id: 'comp1',
        type: 'text',
        config: {
          label: 'الاسم الكامل',
          placeholder: 'أدخل اسمك الكامل',
          required: true,
        },
        validation: { required: true, minLength: 2, maxLength: 100 },
        orderIndex: 0,
        isVisible: true,
        isRequired: true,
      },
      {
        id: 'comp2',
        type: 'email',
        config: {
          label: 'البريد الإلكتروني',
          placeholder: 'example@email.com',
          required: true,
        },
        validation: { required: true, pattern: '^[^@]+@[^@]+\\.[^@]+$' },
        orderIndex: 1,
        isVisible: true,
        isRequired: true,
      },
      {
        id: 'comp3',
        type: 'phone',
        config: {
          label: 'رقم الهاتف',
          placeholder: '09xxxxxxxx',
          required: false,
        },
        validation: { pattern: '^09[0-9]{8}$' },
        orderIndex: 2,
        isVisible: true,
        isRequired: false,
      },
      {
        id: 'comp4',
        type: 'dropdown',
        config: {
          label: 'نوع الاستفسار',
          placeholder: 'اختر نوع الاستفسار',
          required: true,
          options: [
            { label: 'استفسار عام', value: 'general' },
            { label: 'شكوى', value: 'complaint' },
            { label: 'اقتراح', value: 'suggestion' },
            { label: 'طلب معلومات', value: 'information_request' },
            { label: 'أخرى', value: 'other' },
          ],
        },
        validation: { required: true },
        orderIndex: 3,
        isVisible: true,
        isRequired: true,
      },
      {
        id: 'comp5',
        type: 'textarea',
        config: {
          label: 'الرسالة',
          placeholder: 'اكتب رسالتك هنا...',
          required: true,
        },
        validation: { required: true, minLength: 10, maxLength: 1000 },
        orderIndex: 4,
        isVisible: true,
        isRequired: true,
      },
    ],
    settings: {
      theme: 'professional',
      allowSaveProgress: false,
      showProgress: false,
      requireAuthentication: false,
    },
    tags: ['تواصل', 'استفسار', 'شكوى', 'اقتراح'],
    isPublic: true,
    createdBy: 'system',
    createdAt: new Date(),
  },
];

// Event Templates
export const eventTemplates: FormTemplate[] = [
  {
    id: 'event-registration',
    name: 'تسجيل الفعاليات',
    description: 'نموذج لتسجيل المشاركة في الفعاليات والندوات',
    category: 'event',
    icon: '🎉',
    components: [
      {
        id: 'comp1',
        type: 'text',
        config: {
          label: 'الاسم الكامل',
          placeholder: 'أدخل اسمك الكامل',
          required: true,
        },
        validation: { required: true, minLength: 2, maxLength: 100 },
        orderIndex: 0,
        isVisible: true,
        isRequired: true,
      },
      {
        id: 'comp2',
        type: 'email',
        config: {
          label: 'البريد الإلكتروني',
          placeholder: 'example@email.com',
          required: true,
        },
        validation: { required: true, pattern: '^[^@]+@[^@]+\\.[^@]+$' },
        orderIndex: 1,
        isVisible: true,
        isRequired: true,
      },
      {
        id: 'comp3',
        type: 'phone',
        config: {
          label: 'رقم الهاتف',
          placeholder: '09xxxxxxxx',
          required: true,
        },
        validation: { required: true, pattern: '^09[0-9]{8}$' },
        orderIndex: 2,
        isVisible: true,
        isRequired: true,
      },
      {
        id: 'comp4',
        type: 'text',
        config: {
          label: 'المؤسسة/الشركة',
          placeholder: 'أدخل اسم المؤسسة',
          required: false,
        },
        validation: { maxLength: 200 },
        orderIndex: 3,
        isVisible: true,
        isRequired: false,
      },
      {
        id: 'comp5',
        type: 'text',
        config: {
          label: 'المنصب/الوظيفة',
          placeholder: 'أدخل منصبك',
          required: false,
        },
        validation: { maxLength: 100 },
        orderIndex: 4,
        isVisible: true,
        isRequired: false,
      },
      {
        id: 'comp6',
        type: 'multi-choice',
        config: {
          label: 'الاهتمامات',
          required: false,
          choiceType: 'checkbox',
          options: [
            { label: 'التكنولوجيا', value: 'technology' },
            { label: 'الابتكار', value: 'innovation' },
            { label: 'ريادة الأعمال', value: 'entrepreneurship' },
            { label: 'التنمية المستدامة', value: 'sustainability' },
            { label: 'التعليم', value: 'education' },
            { label: 'أخرى', value: 'other' },
          ],
        },
        validation: {},
        orderIndex: 5,
        isVisible: true,
        isRequired: false,
      },
      {
        id: 'comp7',
        type: 'textarea',
        config: {
          label: 'ملاحظات إضافية',
          placeholder: 'أي ملاحظات أو طلبات خاصة...',
          required: false,
        },
        validation: { maxLength: 500 },
        orderIndex: 6,
        isVisible: true,
        isRequired: false,
      },
    ],
    settings: {
      theme: 'event',
      allowSaveProgress: true,
      showProgress: true,
      requireAuthentication: false,
    },
    tags: ['فعالية', 'ندوة', 'تسجيل', 'مشاركة'],
    isPublic: true,
    createdBy: 'system',
    createdAt: new Date(),
  },
];

// All templates
export const allTemplates: FormTemplate[] = [
  ...surveyTemplates,
  ...applicationTemplates,
  ...feedbackTemplates,
  ...contactTemplates,
  ...eventTemplates,
];

// Template categories
export const templateCategories = [
  { id: 'survey', name: 'الاستطلاعات', icon: '📊', count: surveyTemplates.length },
  { id: 'application', name: 'الطلبات', icon: '🏢', count: applicationTemplates.length },
  { id: 'feedback', name: 'التقييمات', icon: '💻', count: feedbackTemplates.length },
  { id: 'contact', name: 'التواصل', icon: '📞', count: contactTemplates.length },
  { id: 'event', name: 'الفعاليات', icon: '🎉', count: eventTemplates.length },
];

// Helper functions
export const getTemplatesByCategory = (category: string): FormTemplate[] => {
  return allTemplates.filter(template => template.category === category);
};

export const getTemplateById = (id: string): FormTemplate | undefined => {
  return allTemplates.find(template => template.id === id);
};

export const searchTemplates = (query: string): FormTemplate[] => {
  const lowercaseQuery = query.toLowerCase();
  return allTemplates.filter(template =>
    template.name.toLowerCase().includes(lowercaseQuery) ||
    template.description.toLowerCase().includes(lowercaseQuery) ||
    template.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
  );
};

export const createFormFromTemplate = (template: FormTemplate, userId: string): Form => {
  return {
    id: Math.random().toString(36).substr(2, 9),
    title: template.name,
    description: template.description,
    status: 'draft',
    createdBy: userId,
    createdAt: new Date(),
    updatedAt: new Date(),
    settings: template.settings,
  };
};

export const createComponentsFromTemplate = (template: FormTemplate): BaseComponent[] => {
  return template.components.map(component => ({
    ...component,
    id: Math.random().toString(36).substr(2, 9),
  }));
};

export default {
  allTemplates,
  templateCategories,
  getTemplatesByCategory,
  getTemplateById,
  searchTemplates,
  createFormFromTemplate,
  createComponentsFromTemplate,
};
