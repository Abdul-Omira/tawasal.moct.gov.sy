/**
 * Template Service - Form Template Management
 * Handles template creation, retrieval, and management
 */

import { FormTemplate, TemplateCategory } from '../types/form';

export interface TemplateSearchFilters {
  category?: TemplateCategory;
  ministryId?: string;
  isPublic?: boolean;
  searchQuery?: string;
}

export interface TemplateStats {
  totalTemplates: number;
  publicTemplates: number;
  ministryTemplates: number;
  mostUsedTemplates: Array<{
    templateId: string;
    name: string;
    usageCount: number;
  }>;
}

export class TemplateService {
  private static instance: TemplateService;
  private templates: Map<string, FormTemplate> = new Map();
  private templateUsage: Map<string, number> = new Map();

  private constructor() {
    this.initializeDefaultTemplates();
  }

  public static getInstance(): TemplateService {
    if (!TemplateService.instance) {
      TemplateService.instance = new TemplateService();
    }
    return TemplateService.instance;
  }

  // Initialize default templates
  private initializeDefaultTemplates(): void {
    const defaultTemplates: FormTemplate[] = [
      {
        id: 'survey-customer-satisfaction',
        name: 'استطلاع رضا العملاء',
        description: 'نموذج لقياس رضا العملاء عن الخدمات المقدمة',
        category: 'survey',
        isPublic: true,
        createdBy: 'system',
        createdAt: new Date(),
        templateData: {
          form: {
            title: 'استطلاع رضا العملاء',
            description: 'نشكركم على وقتكم في ملء هذا الاستطلاع',
            settings: {
              theme: {
                primaryColor: '#2563eb',
                secondaryColor: '#64748b',
                backgroundColor: '#ffffff',
                textColor: '#1e293b',
                fontFamily: 'Arial, sans-serif'
              },
              behavior: {
                showProgress: true,
                allowSaveProgress: true,
                requireLogin: false,
                allowAnonymous: true
              }
            }
          },
          components: [
            {
              id: 'customer-name',
              type: 'text',
              config: {
                label: 'الاسم',
                placeholder: 'أدخل اسمك',
                required: true
              },
              validation: { required: true },
              orderIndex: 0,
              isVisible: true,
              isRequired: true
            },
            {
              id: 'customer-email',
              type: 'email',
              config: {
                label: 'البريد الإلكتروني',
                placeholder: 'example@email.com',
                required: true
              },
              validation: { required: true },
              orderIndex: 1,
              isVisible: true,
              isRequired: true
            },
            {
              id: 'service-rating',
              type: 'rating',
              config: {
                label: 'كيف تقيم جودة الخدمة المقدمة؟',
                required: true,
                type: 'stars',
                maxValue: 5,
                minValue: 1
              },
              validation: { required: true },
              orderIndex: 2,
              isVisible: true,
              isRequired: true
            },
            {
              id: 'satisfaction-level',
              type: 'radio',
              config: {
                label: 'ما هو مستوى رضاك عن الخدمة؟',
                required: true,
                options: [
                  { value: 'very-satisfied', label: 'راضي جداً' },
                  { value: 'satisfied', label: 'راضي' },
                  { value: 'neutral', label: 'محايد' },
                  { value: 'dissatisfied', label: 'غير راضي' },
                  { value: 'very-dissatisfied', label: 'غير راضي جداً' }
                ],
                layout: 'vertical'
              },
              validation: { required: true },
              orderIndex: 3,
              isVisible: true,
              isRequired: true
            },
            {
              id: 'improvement-suggestions',
              type: 'textarea',
              config: {
                label: 'اقتراحات للتحسين',
                placeholder: 'شاركنا اقتراحاتك لتحسين الخدمة',
                required: false,
                rows: 4
              },
              validation: { required: false },
              orderIndex: 4,
              isVisible: true,
              isRequired: false
            }
          ]
        }
      },
      {
        id: 'application-job-application',
        name: 'طلب توظيف',
        description: 'نموذج طلب توظيف شامل',
        category: 'application',
        isPublic: true,
        createdBy: 'system',
        createdAt: new Date(),
        templateData: {
          form: {
            title: 'طلب توظيف',
            description: 'يرجى ملء جميع الحقول المطلوبة بدقة',
            settings: {
              theme: {
                primaryColor: '#059669',
                secondaryColor: '#6b7280',
                backgroundColor: '#ffffff',
                textColor: '#111827',
                fontFamily: 'Arial, sans-serif'
              },
              behavior: {
                showProgress: true,
                allowSaveProgress: true,
                requireLogin: true,
                allowAnonymous: false
              }
            }
          },
          components: [
            {
              id: 'personal-info-step',
              type: 'step',
              config: {
                title: 'المعلومات الشخصية',
                description: 'يرجى إدخال معلوماتك الشخصية',
                isRequired: true
              },
              validation: {},
              orderIndex: 0,
              isVisible: true,
              isRequired: true
            },
            {
              id: 'full-name',
              type: 'text',
              config: {
                label: 'الاسم الكامل',
                placeholder: 'الاسم الأول والاسم الأخير',
                required: true
              },
              validation: { required: true },
              orderIndex: 1,
              isVisible: true,
              isRequired: true
            },
            {
              id: 'national-id',
              type: 'text',
              config: {
                label: 'رقم الهوية الوطنية',
                placeholder: '1234567890',
                required: true
              },
              validation: { required: true, pattern: '^[0-9]{10}$' },
              orderIndex: 2,
              isVisible: true,
              isRequired: true
            },
            {
              id: 'phone-number',
              type: 'phone',
              config: {
                label: 'رقم الهاتف',
                placeholder: '+963 11 123 4567',
                required: true
              },
              validation: { required: true },
              orderIndex: 3,
              isVisible: true,
              isRequired: true
            },
            {
              id: 'email-address',
              type: 'email',
              config: {
                label: 'البريد الإلكتروني',
                placeholder: 'example@email.com',
                required: true
              },
              validation: { required: true },
              orderIndex: 4,
              isVisible: true,
              isRequired: true
            },
            {
              id: 'education-step',
              type: 'step',
              config: {
                title: 'المؤهلات التعليمية',
                description: 'يرجى إدخال مؤهلاتك التعليمية',
                isRequired: true
              },
              validation: {},
              orderIndex: 5,
              isVisible: true,
              isRequired: true
            },
            {
              id: 'education-level',
              type: 'dropdown',
              config: {
                label: 'المستوى التعليمي',
                required: true,
                options: [
                  { value: 'high-school', label: 'ثانوية عامة' },
                  { value: 'diploma', label: 'دبلوم' },
                  { value: 'bachelor', label: 'بكالوريوس' },
                  { value: 'master', label: 'ماجستير' },
                  { value: 'phd', label: 'دكتوراه' }
                ]
              },
              validation: { required: true },
              orderIndex: 6,
              isVisible: true,
              isRequired: true
            },
            {
              id: 'university',
              type: 'text',
              config: {
                label: 'الجامعة أو المؤسسة التعليمية',
                placeholder: 'اسم الجامعة',
                required: true
              },
              validation: { required: true },
              orderIndex: 7,
              isVisible: true,
              isRequired: true
            },
            {
              id: 'graduation-year',
              type: 'number',
              config: {
                label: 'سنة التخرج',
                placeholder: '2020',
                required: true
              },
              validation: { required: true, min: 1950, max: new Date().getFullYear() },
              orderIndex: 8,
              isVisible: true,
              isRequired: true
            },
            {
              id: 'experience-step',
              type: 'step',
              config: {
                title: 'الخبرة العملية',
                description: 'يرجى إدخال خبرتك العملية',
                isRequired: true
              },
              validation: {},
              orderIndex: 9,
              isVisible: true,
              isRequired: true
            },
            {
              id: 'years-experience',
              type: 'number',
              config: {
                label: 'عدد سنوات الخبرة',
                placeholder: '5',
                required: true
              },
              validation: { required: true, min: 0, max: 50 },
              orderIndex: 10,
              isVisible: true,
              isRequired: true
            },
            {
              id: 'previous-positions',
              type: 'textarea',
              config: {
                label: 'المناصب السابقة',
                placeholder: 'اذكر المناصب التي شغلتها سابقاً',
                required: false,
                rows: 3
              },
              validation: { required: false },
              orderIndex: 11,
              isVisible: true,
              isRequired: false
            },
            {
              id: 'skills',
              type: 'textarea',
              config: {
                label: 'المهارات',
                placeholder: 'اذكر مهاراتك المهنية',
                required: false,
                rows: 3
              },
              validation: { required: false },
              orderIndex: 12,
              isVisible: true,
              isRequired: false
            },
            {
              id: 'cv-upload',
              type: 'file-upload',
              config: {
                label: 'رفع السيرة الذاتية',
                required: true,
                allowedTypes: ['application/pdf', 'application/msword'],
                maxFileSize: 5242880, // 5MB
                maxFiles: 1
              },
              validation: { required: true },
              orderIndex: 13,
              isVisible: true,
              isRequired: true
            }
          ]
        }
      },
      {
        id: 'feedback-service-feedback',
        name: 'تقييم الخدمة',
        description: 'نموذج لتقييم جودة الخدمات الحكومية',
        category: 'feedback',
        isPublic: true,
        createdBy: 'system',
        createdAt: new Date(),
        templateData: {
          form: {
            title: 'تقييم الخدمة',
            description: 'نقدر آراءكم في تحسين خدماتنا',
            settings: {
              theme: {
                primaryColor: '#dc2626',
                secondaryColor: '#6b7280',
                backgroundColor: '#ffffff',
                textColor: '#111827',
                fontFamily: 'Arial, sans-serif'
              },
              behavior: {
                showProgress: true,
                allowSaveProgress: false,
                requireLogin: false,
                allowAnonymous: true
              }
            }
          },
          components: [
            {
              id: 'service-type',
              type: 'dropdown',
              config: {
                label: 'نوع الخدمة',
                required: true,
                options: [
                  { value: 'citizen-services', label: 'خدمات المواطنين' },
                  { value: 'business-services', label: 'خدمات الأعمال' },
                  { value: 'document-services', label: 'خدمات الوثائق' },
                  { value: 'online-services', label: 'الخدمات الإلكترونية' },
                  { value: 'other', label: 'أخرى' }
                ]
              },
              validation: { required: true },
              orderIndex: 0,
              isVisible: true,
              isRequired: true
            },
            {
              id: 'service-rating',
              type: 'rating',
              config: {
                label: 'تقييم جودة الخدمة',
                required: true,
                type: 'stars',
                maxValue: 5,
                minValue: 1
              },
              validation: { required: true },
              orderIndex: 1,
              isVisible: true,
              isRequired: true
            },
            {
              id: 'waiting-time',
              type: 'radio',
              config: {
                label: 'وقت الانتظار',
                required: true,
                options: [
                  { value: 'excellent', label: 'ممتاز (أقل من 15 دقيقة)' },
                  { value: 'good', label: 'جيد (15-30 دقيقة)' },
                  { value: 'average', label: 'متوسط (30-60 دقيقة)' },
                  { value: 'poor', label: 'ضعيف (أكثر من ساعة)' }
                ],
                layout: 'vertical'
              },
              validation: { required: true },
              orderIndex: 2,
              isVisible: true,
              isRequired: true
            },
            {
              id: 'staff-courtesy',
              type: 'radio',
              config: {
                label: 'أدب الموظفين',
                required: true,
                options: [
                  { value: 'excellent', label: 'ممتاز' },
                  { value: 'good', label: 'جيد' },
                  { value: 'average', label: 'متوسط' },
                  { value: 'poor', label: 'ضعيف' }
                ],
                layout: 'vertical'
              },
              validation: { required: true },
              orderIndex: 3,
              isVisible: true,
              isRequired: true
            },
            {
              id: 'facility-cleanliness',
              type: 'radio',
              config: {
                label: 'نظافة المرفق',
                required: true,
                options: [
                  { value: 'excellent', label: 'ممتاز' },
                  { value: 'good', label: 'جيد' },
                  { value: 'average', label: 'متوسط' },
                  { value: 'poor', label: 'ضعيف' }
                ],
                layout: 'vertical'
              },
              validation: { required: true },
              orderIndex: 4,
              isVisible: true,
              isRequired: true
            },
            {
              id: 'overall-satisfaction',
              type: 'nps',
              config: {
                label: 'ما مدى احتمالية أن توصي بهذه الخدمة لآخرين؟',
                required: true,
                type: 'nps',
                maxValue: 10,
                minValue: 0,
                labels: {
                  min: 'غير محتمل على الإطلاق',
                  max: 'محتمل جداً'
                }
              },
              validation: { required: true },
              orderIndex: 5,
              isVisible: true,
              isRequired: true
            },
            {
              id: 'improvement-suggestions',
              type: 'textarea',
              config: {
                label: 'اقتراحات للتحسين',
                placeholder: 'شاركنا اقتراحاتك لتحسين الخدمة',
                required: false,
                rows: 4
              },
              validation: { required: false },
              orderIndex: 6,
              isVisible: true,
              isRequired: false
            }
          ]
        }
      }
    ];

    defaultTemplates.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  // Get all templates
  public async getTemplates(filters?: TemplateSearchFilters): Promise<FormTemplate[]> {
    let templates = Array.from(this.templates.values());

    if (filters) {
      if (filters.category) {
        templates = templates.filter(t => t.category === filters.category);
      }
      if (filters.ministryId) {
        templates = templates.filter(t => t.createdBy === filters.ministryId);
      }
      if (filters.isPublic !== undefined) {
        templates = templates.filter(t => t.isPublic === filters.isPublic);
      }
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        templates = templates.filter(t => 
          t.name.toLowerCase().includes(query) ||
          t.description?.toLowerCase().includes(query)
        );
      }
    }

    return templates.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Get template by ID
  public async getTemplateById(templateId: string): Promise<FormTemplate | null> {
    return this.templates.get(templateId) || null;
  }

  // Create new template
  public async createTemplate(template: Omit<FormTemplate, 'id' | 'createdAt'>): Promise<FormTemplate> {
    const newTemplate: FormTemplate = {
      ...template,
      id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date()
    };

    this.templates.set(newTemplate.id, newTemplate);
    return newTemplate;
  }

  // Update template
  public async updateTemplate(templateId: string, updates: Partial<FormTemplate>): Promise<FormTemplate | null> {
    const template = this.templates.get(templateId);
    if (!template) return null;

    const updatedTemplate = { ...template, ...updates };
    this.templates.set(templateId, updatedTemplate);
    return updatedTemplate;
  }

  // Delete template
  public async deleteTemplate(templateId: string): Promise<boolean> {
    return this.templates.delete(templateId);
  }

  // Duplicate template
  public async duplicateTemplate(templateId: string, newName: string, createdBy: string): Promise<FormTemplate | null> {
    const originalTemplate = this.templates.get(templateId);
    if (!originalTemplate) return null;

    const duplicatedTemplate: FormTemplate = {
      ...originalTemplate,
      id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: newName,
      createdBy,
      createdAt: new Date(),
      isPublic: false // Duplicated templates are private by default
    };

    this.templates.set(duplicatedTemplate.id, duplicatedTemplate);
    return duplicatedTemplate;
  }

  // Track template usage
  public async trackTemplateUsage(templateId: string): Promise<void> {
    const currentUsage = this.templateUsage.get(templateId) || 0;
    this.templateUsage.set(templateId, currentUsage + 1);
  }

  // Get template statistics
  public async getTemplateStats(): Promise<TemplateStats> {
    const allTemplates = Array.from(this.templates.values());
    const publicTemplates = allTemplates.filter(t => t.isPublic);
    const ministryTemplates = allTemplates.filter(t => !t.isPublic);

    const mostUsedTemplates = Array.from(this.templateUsage.entries())
      .map(([templateId, usageCount]) => {
        const template = this.templates.get(templateId);
        return {
          templateId,
          name: template?.name || 'Unknown',
          usageCount
        };
      })
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 10);

    return {
      totalTemplates: allTemplates.length,
      publicTemplates: publicTemplates.length,
      ministryTemplates: ministryTemplates.length,
      mostUsedTemplates
    };
  }

  // Export template
  public async exportTemplate(templateId: string): Promise<string> {
    const template = this.templates.get(templateId);
    if (!template) throw new Error('Template not found');

    return JSON.stringify(template, null, 2);
  }

  // Import template
  public async importTemplate(templateData: string, createdBy: string): Promise<FormTemplate> {
    try {
      const parsedTemplate = JSON.parse(templateData) as FormTemplate;
      
      // Validate template structure
      if (!parsedTemplate.name || !parsedTemplate.category) {
        throw new Error('Invalid template structure');
      }

      const importedTemplate: FormTemplate = {
        ...parsedTemplate,
        id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdBy,
        createdAt: new Date(),
        isPublic: false // Imported templates are private by default
      };

      this.templates.set(importedTemplate.id, importedTemplate);
      return importedTemplate;
    } catch (error) {
      throw new Error('Failed to import template: ' + (error as Error).message);
    }
  }

  // Get templates by ministry
  public async getTemplatesByMinistry(ministryId: string): Promise<FormTemplate[]> {
    return Array.from(this.templates.values())
      .filter(t => t.createdBy === ministryId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Get public templates
  public async getPublicTemplates(): Promise<FormTemplate[]> {
    return Array.from(this.templates.values())
      .filter(t => t.isPublic)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}

// Export singleton instance
export const templateService = TemplateService.getInstance();
