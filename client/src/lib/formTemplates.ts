/**
 * Form Templates System
 * Pre-built form templates for common government forms
 */

import { Form, BaseComponent, ComponentType } from '../types/form';

export interface FormTemplate {
  id: string;
  name: string;
  description: string;
  category: 'citizen' | 'business' | 'complaint' | 'application' | 'survey';
  icon: string;
  form: Partial<Form>;
  components: BaseComponent[];
  tags: string[];
}

// Citizen Communication Template
export const citizenCommunicationTemplate: FormTemplate = {
  id: 'citizen-communication',
  name: 'تواصل المواطن',
  description: 'نموذج للتواصل مع الوزارة وإرسال الشكاوى والاقتراحات',
  category: 'citizen',
  icon: '📝',
  tags: ['شكوى', 'اقتراح', 'استفسار', 'تواصل'],
  form: {
    title: 'نموذج التواصل مع الوزارة',
    description: 'نموذج للتواصل مع وزارة الاتصالات وتقانة المعلومات',
    settings: {
      theme: {
        primaryColor: '#1e40af',
        secondaryColor: '#3b82f6',
        backgroundColor: '#ffffff',
        textColor: '#1f2937',
        fontFamily: 'Cairo, Arial, sans-serif',
      },
      behavior: {
        showProgress: true,
        allowSaveProgress: false,
        requireLogin: false,
        allowAnonymous: true,
      },
      notifications: {
        emailOnSubmit: true,
        emailTemplate: 'citizen-communication',
      },
    },
    status: 'draft',
  },
  components: [
    {
      id: 'name',
      type: 'text' as ComponentType,
      config: {
        label: 'الاسم الكامل',
        placeholder: 'أدخل اسمك الكامل',
        required: true,
        maxLength: 100,
      },
      validation: {
        required: true,
        maxLength: 100,
      },
      orderIndex: 0,
      isVisible: true,
      isRequired: true,
    },
    {
      id: 'email',
      type: 'email' as ComponentType,
      config: {
        label: 'البريد الإلكتروني',
        placeholder: 'example@email.com',
        required: true,
      },
      validation: {
        required: true,
        pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
      },
      orderIndex: 1,
      isVisible: true,
      isRequired: true,
    },
    {
      id: 'phone',
      type: 'phone' as ComponentType,
      config: {
        label: 'رقم الهاتف',
        placeholder: '+963 11 123 4567',
        required: false,
      },
      validation: {
        required: false,
        pattern: '^[\\+]?[1-9][\\d]{0,15}$',
      },
      orderIndex: 2,
      isVisible: true,
      isRequired: false,
    },
    {
      id: 'governorate',
      type: 'dropdown' as ComponentType,
      config: {
        label: 'المحافظة',
        required: true,
        options: [
          { value: 'damascus', label: 'دمشق' },
          { value: 'aleppo', label: 'حلب' },
          { value: 'homs', label: 'حمص' },
          { value: 'hama', label: 'حماة' },
          { value: 'latakia', label: 'اللاذقية' },
          { value: 'deir-ez-zor', label: 'دير الزور' },
          { value: 'raqqa', label: 'الرقة' },
          { value: 'hasaka', label: 'الحسكة' },
          { value: 'tartus', label: 'طرطوس' },
          { value: 'idlib', label: 'إدلب' },
          { value: 'daraa', label: 'درعا' },
          { value: 'quneitra', label: 'القنيطرة' },
          { value: 'sweida', label: 'السويداء' },
        ],
        allowMultiple: false,
      },
      validation: {
        required: true,
      },
      orderIndex: 3,
      isVisible: true,
      isRequired: true,
    },
    {
      id: 'communication_type',
      type: 'radio' as ComponentType,
      config: {
        label: 'نوع التواصل',
        required: true,
        options: [
          { value: 'complaint', label: 'شكوى' },
          { value: 'suggestion', label: 'اقتراح' },
          { value: 'inquiry', label: 'استفسار' },
          { value: 'other', label: 'أخرى' },
        ],
        allowMultiple: false,
        layout: 'vertical',
      },
      validation: {
        required: true,
      },
      orderIndex: 4,
      isVisible: true,
      isRequired: true,
    },
    {
      id: 'subject',
      type: 'text' as ComponentType,
      config: {
        label: 'الموضوع',
        placeholder: 'أدخل موضوع التواصل',
        required: true,
        maxLength: 200,
      },
      validation: {
        required: true,
        maxLength: 200,
      },
      orderIndex: 5,
      isVisible: true,
      isRequired: true,
    },
    {
      id: 'message',
      type: 'textarea' as ComponentType,
      config: {
        label: 'الرسالة',
        placeholder: 'اكتب رسالتك هنا...',
        required: true,
        rows: 6,
        maxLength: 2000,
      },
      validation: {
        required: true,
        maxLength: 2000,
      },
      orderIndex: 6,
      isVisible: true,
      isRequired: true,
    },
    {
      id: 'attachment',
      type: 'file-upload' as ComponentType,
      config: {
        label: 'مرفق (اختياري)',
        required: false,
        allowedTypes: ['image/*', 'application/pdf', 'application/msword'],
        maxFileSize: 10485760, // 10MB
        maxFiles: 3,
      },
      validation: {
        required: false,
      },
      orderIndex: 7,
      isVisible: true,
      isRequired: false,
    },
  ],
};

// Business Registration Template
export const businessRegistrationTemplate: FormTemplate = {
  id: 'business-registration',
  name: 'تسجيل الأعمال',
  description: 'نموذج لتسجيل الشركات والمؤسسات في قطاع الاتصالات',
  category: 'business',
  icon: '🏢',
  tags: ['تسجيل', 'شركة', 'مؤسسة', 'اتصالات'],
  form: {
    title: 'نموذج تسجيل الأعمال',
    description: 'نموذج لتسجيل الشركات والمؤسسات في قطاع الاتصالات وتقانة المعلومات',
    settings: {
      theme: {
        primaryColor: '#059669',
        secondaryColor: '#10b981',
        backgroundColor: '#ffffff',
        textColor: '#1f2937',
        fontFamily: 'Cairo, Arial, sans-serif',
      },
      behavior: {
        showProgress: true,
        allowSaveProgress: true,
        requireLogin: false,
        allowAnonymous: true,
      },
      notifications: {
        emailOnSubmit: true,
        emailTemplate: 'business-registration',
      },
    },
    status: 'draft',
  },
  components: [
    {
      id: 'business_name',
      type: 'text' as ComponentType,
      config: {
        label: 'اسم الشركة/المؤسسة',
        placeholder: 'أدخل اسم الشركة أو المؤسسة',
        required: true,
        maxLength: 200,
      },
      validation: {
        required: true,
        maxLength: 200,
      },
      orderIndex: 0,
      isVisible: true,
      isRequired: true,
    },
    {
      id: 'business_type',
      type: 'dropdown' as ComponentType,
      config: {
        label: 'نوع النشاط',
        required: true,
        options: [
          { value: 'telecom', label: 'اتصالات' },
          { value: 'it', label: 'تقانة المعلومات' },
          { value: 'software', label: 'تطوير البرمجيات' },
          { value: 'hardware', label: 'الأجهزة والتجهيزات' },
          { value: 'services', label: 'الخدمات التقنية' },
          { value: 'other', label: 'أخرى' },
        ],
        allowMultiple: false,
      },
      validation: {
        required: true,
      },
      orderIndex: 1,
      isVisible: true,
      isRequired: true,
    },
    {
      id: 'establishment_date',
      type: 'date' as ComponentType,
      config: {
        label: 'تاريخ التأسيس',
        required: true,
        type: 'date',
      },
      validation: {
        required: true,
      },
      orderIndex: 2,
      isVisible: true,
      isRequired: true,
    },
    {
      id: 'employees_count',
      type: 'dropdown' as ComponentType,
      config: {
        label: 'عدد الموظفين',
        required: true,
        options: [
          { value: '1-5', label: '1-5 موظف' },
          { value: '6-20', label: '6-20 موظف' },
          { value: '21-50', label: '21-50 موظف' },
          { value: '51-100', label: '51-100 موظف' },
          { value: '100+', label: 'أكثر من 100 موظف' },
        ],
        allowMultiple: false,
      },
      validation: {
        required: true,
      },
      orderIndex: 3,
      isVisible: true,
      isRequired: true,
    },
    {
      id: 'address',
      type: 'textarea' as ComponentType,
      config: {
        label: 'العنوان',
        placeholder: 'أدخل العنوان الكامل',
        required: true,
        rows: 3,
      },
      validation: {
        required: true,
      },
      orderIndex: 4,
      isVisible: true,
      isRequired: true,
    },
    {
      id: 'governorate',
      type: 'dropdown' as ComponentType,
      config: {
        label: 'المحافظة',
        required: true,
        options: [
          { value: 'damascus', label: 'دمشق' },
          { value: 'aleppo', label: 'حلب' },
          { value: 'homs', label: 'حمص' },
          { value: 'hama', label: 'حماة' },
          { value: 'latakia', label: 'اللاذقية' },
          { value: 'deir-ez-zor', label: 'دير الزور' },
          { value: 'raqqa', label: 'الرقة' },
          { value: 'hasaka', label: 'الحسكة' },
          { value: 'tartus', label: 'طرطوس' },
          { value: 'idlib', label: 'إدلب' },
          { value: 'daraa', label: 'درعا' },
          { value: 'quneitra', label: 'القنيطرة' },
          { value: 'sweida', label: 'السويداء' },
        ],
        allowMultiple: false,
      },
      validation: {
        required: true,
      },
      orderIndex: 5,
      isVisible: true,
      isRequired: true,
    },
    {
      id: 'registration_number',
      type: 'text' as ComponentType,
      config: {
        label: 'رقم السجل التجاري',
        placeholder: 'أدخل رقم السجل التجاري',
        required: false,
        maxLength: 50,
      },
      validation: {
        required: false,
        maxLength: 50,
      },
      orderIndex: 6,
      isVisible: true,
      isRequired: false,
    },
    {
      id: 'contact_name',
      type: 'text' as ComponentType,
      config: {
        label: 'اسم الشخص المسؤول',
        placeholder: 'أدخل اسم الشخص المسؤول',
        required: true,
        maxLength: 100,
      },
      validation: {
        required: true,
        maxLength: 100,
      },
      orderIndex: 7,
      isVisible: true,
      isRequired: true,
    },
    {
      id: 'position',
      type: 'text' as ComponentType,
      config: {
        label: 'المنصب',
        placeholder: 'أدخل المنصب',
        required: true,
        maxLength: 100,
      },
      validation: {
        required: true,
        maxLength: 100,
      },
      orderIndex: 8,
      isVisible: true,
      isRequired: true,
    },
    {
      id: 'email',
      type: 'email' as ComponentType,
      config: {
        label: 'البريد الإلكتروني',
        placeholder: 'example@company.com',
        required: true,
      },
      validation: {
        required: true,
        pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
      },
      orderIndex: 9,
      isVisible: true,
      isRequired: true,
    },
    {
      id: 'phone',
      type: 'phone' as ComponentType,
      config: {
        label: 'رقم الهاتف',
        placeholder: '+963 11 123 4567',
        required: true,
      },
      validation: {
        required: true,
        pattern: '^[\\+]?[1-9][\\d]{0,15}$',
      },
      orderIndex: 10,
      isVisible: true,
      isRequired: true,
    },
    {
      id: 'website',
      type: 'text' as ComponentType,
      config: {
        label: 'الموقع الإلكتروني (اختياري)',
        placeholder: 'https://www.company.com',
        required: false,
        maxLength: 200,
      },
      validation: {
        required: false,
        maxLength: 200,
        pattern: '^https?://.+',
      },
      orderIndex: 11,
      isVisible: true,
      isRequired: false,
    },
    {
      id: 'challenges',
      type: 'checkbox' as ComponentType,
      config: {
        label: 'التحديات التي تواجهها',
        required: true,
        options: [
          { value: 'funding', label: 'التمويل' },
          { value: 'technology', label: 'التقانة' },
          { value: 'talent', label: 'المواهب البشرية' },
          { value: 'market', label: 'السوق' },
          { value: 'regulations', label: 'اللوائح التنظيمية' },
          { value: 'infrastructure', label: 'البنية التحتية' },
          { value: 'other', label: 'أخرى' },
        ],
        allowMultiple: true,
        layout: 'vertical',
      },
      validation: {
        required: true,
      },
      orderIndex: 12,
      isVisible: true,
      isRequired: true,
    },
    {
      id: 'challenge_details',
      type: 'textarea' as ComponentType,
      config: {
        label: 'تفاصيل التحديات',
        placeholder: 'اكتب تفاصيل التحديات التي تواجهها...',
        required: true,
        rows: 4,
      },
      validation: {
        required: true,
      },
      orderIndex: 13,
      isVisible: true,
      isRequired: true,
    },
    {
      id: 'tech_needs',
      type: 'checkbox' as ComponentType,
      config: {
        label: 'الاحتياجات التقنية',
        required: true,
        options: [
          { value: 'internet', label: 'خدمات الإنترنت' },
          { value: 'software', label: 'البرمجيات' },
          { value: 'hardware', label: 'الأجهزة' },
          { value: 'training', label: 'التدريب' },
          { value: 'consulting', label: 'الاستشارات' },
          { value: 'support', label: 'الدعم التقني' },
          { value: 'other', label: 'أخرى' },
        ],
        allowMultiple: true,
        layout: 'vertical',
      },
      validation: {
        required: true,
      },
      orderIndex: 14,
      isVisible: true,
      isRequired: true,
    },
    {
      id: 'tech_details',
      type: 'textarea' as ComponentType,
      config: {
        label: 'تفاصيل الاحتياجات التقنية',
        placeholder: 'اكتب تفاصيل احتياجاتك التقنية...',
        required: false,
        rows: 4,
      },
      validation: {
        required: false,
      },
      orderIndex: 15,
      isVisible: true,
      isRequired: false,
    },
    {
      id: 'additional_comments',
      type: 'textarea' as ComponentType,
      config: {
        label: 'تعليقات إضافية',
        placeholder: 'أي تعليقات إضافية...',
        required: false,
        rows: 3,
      },
      validation: {
        required: false,
      },
      orderIndex: 16,
      isVisible: true,
      isRequired: false,
    },
  ],
};

// Service Request Template
export const serviceRequestTemplate: FormTemplate = {
  id: 'service-request',
  name: 'طلب خدمة',
  description: 'نموذج لطلب الخدمات التقنية من الوزارة',
  category: 'application',
  icon: '🔧',
  tags: ['طلب', 'خدمة', 'تقنية', 'دعم'],
  form: {
    title: 'نموذج طلب الخدمة',
    description: 'نموذج لطلب الخدمات التقنية من وزارة الاتصالات وتقانة المعلومات',
    settings: {
      theme: {
        primaryColor: '#7c3aed',
        secondaryColor: '#8b5cf6',
        backgroundColor: '#ffffff',
        textColor: '#1f2937',
        fontFamily: 'Cairo, Arial, sans-serif',
      },
      behavior: {
        showProgress: true,
        allowSaveProgress: true,
        requireLogin: false,
        allowAnonymous: true,
      },
      notifications: {
        emailOnSubmit: true,
        emailTemplate: 'service-request',
      },
    },
    status: 'draft',
  },
  components: [
    {
      id: 'requester_name',
      type: 'text' as ComponentType,
      config: {
        label: 'اسم مقدم الطلب',
        placeholder: 'أدخل اسمك الكامل',
        required: true,
        maxLength: 100,
      },
      validation: {
        required: true,
        maxLength: 100,
      },
      orderIndex: 0,
      isVisible: true,
      isRequired: true,
    },
    {
      id: 'organization',
      type: 'text' as ComponentType,
      config: {
        label: 'الجهة/المؤسسة',
        placeholder: 'أدخل اسم الجهة أو المؤسسة',
        required: true,
        maxLength: 200,
      },
      validation: {
        required: true,
        maxLength: 200,
      },
      orderIndex: 1,
      isVisible: true,
      isRequired: true,
    },
    {
      id: 'email',
      type: 'email' as ComponentType,
      config: {
        label: 'البريد الإلكتروني',
        placeholder: 'example@email.com',
        required: true,
      },
      validation: {
        required: true,
        pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
      },
      orderIndex: 2,
      isVisible: true,
      isRequired: true,
    },
    {
      id: 'phone',
      type: 'phone' as ComponentType,
      config: {
        label: 'رقم الهاتف',
        placeholder: '+963 11 123 4567',
        required: true,
      },
      validation: {
        required: true,
        pattern: '^[\\+]?[1-9][\\d]{0,15}$',
      },
      orderIndex: 3,
      isVisible: true,
      isRequired: true,
    },
    {
      id: 'service_type',
      type: 'dropdown' as ComponentType,
      config: {
        label: 'نوع الخدمة المطلوبة',
        required: true,
        options: [
          { value: 'internet', label: 'خدمات الإنترنت' },
          { value: 'domain', label: 'تسجيل النطاقات' },
          { value: 'hosting', label: 'خدمات الاستضافة' },
          { value: 'email', label: 'خدمات البريد الإلكتروني' },
          { value: 'security', label: 'الأمن السيبراني' },
          { value: 'consulting', label: 'الاستشارات التقنية' },
          { value: 'training', label: 'التدريب' },
          { value: 'other', label: 'أخرى' },
        ],
        allowMultiple: false,
      },
      validation: {
        required: true,
      },
      orderIndex: 4,
      isVisible: true,
      isRequired: true,
    },
    {
      id: 'priority',
      type: 'radio' as ComponentType,
      config: {
        label: 'أولوية الطلب',
        required: true,
        options: [
          { value: 'low', label: 'منخفضة' },
          { value: 'medium', label: 'متوسطة' },
          { value: 'high', label: 'عالية' },
          { value: 'urgent', label: 'عاجل' },
        ],
        allowMultiple: false,
        layout: 'vertical',
      },
      validation: {
        required: true,
      },
      orderIndex: 5,
      isVisible: true,
      isRequired: true,
    },
    {
      id: 'description',
      type: 'textarea' as ComponentType,
      config: {
        label: 'وصف الخدمة المطلوبة',
        placeholder: 'اكتب وصفاً مفصلاً للخدمة المطلوبة...',
        required: true,
        rows: 6,
      },
      validation: {
        required: true,
      },
      orderIndex: 6,
      isVisible: true,
      isRequired: true,
    },
    {
      id: 'expected_timeline',
      type: 'text' as ComponentType,
      config: {
        label: 'الجدول الزمني المتوقع',
        placeholder: 'مثال: خلال أسبوعين',
        required: false,
        maxLength: 100,
      },
      validation: {
        required: false,
        maxLength: 100,
      },
      orderIndex: 7,
      isVisible: true,
      isRequired: false,
    },
    {
      id: 'budget',
      type: 'number' as ComponentType,
      config: {
        label: 'الميزانية المتوقعة (ليرة سورية)',
        placeholder: 'أدخل الميزانية المتوقعة',
        required: false,
        min: 0,
      },
      validation: {
        required: false,
        min: 0,
      },
      orderIndex: 8,
      isVisible: true,
      isRequired: false,
    },
    {
      id: 'attachments',
      type: 'file-upload' as ComponentType,
      config: {
        label: 'مرفقات (اختياري)',
        required: false,
        allowedTypes: ['image/*', 'application/pdf', 'application/msword', 'text/plain'],
        maxFileSize: 10485760, // 10MB
        maxFiles: 5,
      },
      validation: {
        required: false,
      },
      orderIndex: 9,
      isVisible: true,
      isRequired: false,
    },
  ],
};

// Customer Satisfaction Survey Template
export const satisfactionSurveyTemplate: FormTemplate = {
  id: 'satisfaction-survey',
  name: 'استطلاع رضا العملاء',
  description: 'نموذج لقياس رضا العملاء عن الخدمات المقدمة',
  category: 'survey',
  icon: '📊',
  tags: ['استطلاع', 'رضا', 'عملاء', 'تقييم'],
  form: {
    title: 'استطلاع رضا العملاء',
    description: 'نموذج لقياس رضا العملاء عن الخدمات المقدمة من الوزارة',
    settings: {
      theme: {
        primaryColor: '#f59e0b',
        secondaryColor: '#fbbf24',
        backgroundColor: '#ffffff',
        textColor: '#1f2937',
        fontFamily: 'Cairo, Arial, sans-serif',
      },
      behavior: {
        showProgress: true,
        allowSaveProgress: false,
        requireLogin: false,
        allowAnonymous: true,
      },
      notifications: {
        emailOnSubmit: false,
      },
    },
    status: 'draft',
  },
  components: [
    {
      id: 'service_used',
      type: 'dropdown' as ComponentType,
      config: {
        label: 'الخدمة المستخدمة',
        required: true,
        options: [
          { value: 'website', label: 'الموقع الإلكتروني' },
          { value: 'mobile_app', label: 'التطبيق المحمول' },
          { value: 'phone', label: 'الهاتف' },
          { value: 'email', label: 'البريد الإلكتروني' },
          { value: 'office', label: 'المكتب' },
          { value: 'other', label: 'أخرى' },
        ],
        allowMultiple: false,
      },
      validation: {
        required: true,
      },
      orderIndex: 0,
      isVisible: true,
      isRequired: true,
    },
    {
      id: 'overall_satisfaction',
      type: 'rating' as ComponentType,
      config: {
        label: 'ما هو تقييمك العام للخدمة؟',
        required: true,
        type: 'stars',
        maxValue: 5,
        minValue: 1,
        labels: {
          min: 'غير راضٍ تماماً',
          max: 'راضٍ تماماً',
        },
      },
      validation: {
        required: true,
      },
      orderIndex: 1,
      isVisible: true,
      isRequired: true,
    },
    {
      id: 'ease_of_use',
      type: 'rating' as ComponentType,
      config: {
        label: 'ما هو تقييمك لسهولة الاستخدام؟',
        required: true,
        type: 'stars',
        maxValue: 5,
        minValue: 1,
        labels: {
          min: 'صعب جداً',
          max: 'سهل جداً',
        },
      },
      validation: {
        required: true,
      },
      orderIndex: 2,
      isVisible: true,
      isRequired: true,
    },
    {
      id: 'response_time',
      type: 'rating' as ComponentType,
      config: {
        label: 'ما هو تقييمك لسرعة الاستجابة؟',
        required: true,
        type: 'stars',
        maxValue: 5,
        minValue: 1,
        labels: {
          min: 'بطيء جداً',
          max: 'سريع جداً',
        },
      },
      validation: {
        required: true,
      },
      orderIndex: 3,
      isVisible: true,
      isRequired: true,
    },
    {
      id: 'staff_helpfulness',
      type: 'rating' as ComponentType,
      config: {
        label: 'ما هو تقييمك لمساعدة الموظفين؟',
        required: true,
        type: 'stars',
        maxValue: 5,
        minValue: 1,
        labels: {
          min: 'غير مفيد',
          max: 'مفيد جداً',
        },
      },
      validation: {
        required: true,
      },
      orderIndex: 4,
      isVisible: true,
      isRequired: true,
    },
    {
      id: 'recommendation',
      type: 'nps' as ComponentType,
      config: {
        label: 'ما مدى احتمالية أن توصي بخدماتنا لآخرين؟',
        required: true,
        type: 'nps',
        maxValue: 10,
        minValue: 0,
        labels: {
          min: 'غير محتمل على الإطلاق',
          max: 'محتمل جداً',
        },
      },
      validation: {
        required: true,
      },
      orderIndex: 5,
      isVisible: true,
      isRequired: true,
    },
    {
      id: 'improvements',
      type: 'textarea' as ComponentType,
      config: {
        label: 'ما هي التحسينات التي تقترحها؟',
        placeholder: 'اكتب اقتراحاتك للتحسين...',
        required: false,
        rows: 4,
      },
      validation: {
        required: false,
      },
      orderIndex: 6,
      isVisible: true,
      isRequired: false,
    },
    {
      id: 'additional_comments',
      type: 'textarea' as ComponentType,
      config: {
        label: 'تعليقات إضافية',
        placeholder: 'أي تعليقات إضافية...',
        required: false,
        rows: 3,
      },
      validation: {
        required: false,
      },
      orderIndex: 7,
      isVisible: true,
      isRequired: false,
    },
  ],
};

// All templates
export const formTemplates: FormTemplate[] = [
  citizenCommunicationTemplate,
  businessRegistrationTemplate,
  serviceRequestTemplate,
  satisfactionSurveyTemplate,
];

// Get templates by category
export const getTemplatesByCategory = (category: string): FormTemplate[] => {
  return formTemplates.filter(template => template.category === category);
};

// Get template by ID
export const getTemplateById = (id: string): FormTemplate | undefined => {
  return formTemplates.find(template => template.id === id);
};

// Search templates
export const searchTemplates = (query: string): FormTemplate[] => {
  const lowercaseQuery = query.toLowerCase();
  return formTemplates.filter(template => 
    template.name.toLowerCase().includes(lowercaseQuery) ||
    template.description.toLowerCase().includes(lowercaseQuery) ||
    template.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
  );
};
