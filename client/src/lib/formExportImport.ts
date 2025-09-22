/**
 * Form Export/Import Service
 * Handles form export and import functionality for form sharing
 */

import { Form } from '../types/form';
import { BaseComponent } from '../types/component';

export interface ExportableForm {
  form: Form;
  components: BaseComponent[];
  metadata: {
    exportedAt: Date;
    exportedBy: string;
    version: string;
    platform: string;
  };
}

export interface ImportResult {
  success: boolean;
  form?: Form;
  components?: BaseComponent[];
  errors?: string[];
  warnings?: string[];
}

export class FormExportImportService {
  private static instance: FormExportImportService;

  private constructor() {}

  static getInstance(): FormExportImportService {
    if (!FormExportImportService.instance) {
      FormExportImportService.instance = new FormExportImportService();
    }
    return FormExportImportService.instance;
  }

  // Export form to JSON
  exportForm(form: Form, components: BaseComponent[], exportedBy: string): string {
    const exportableForm: ExportableForm = {
      form: {
        ...form,
        id: `exported_${form.id}_${Date.now()}`, // Generate new ID for export
        createdAt: new Date(),
        updatedAt: new Date(),
        publishedAt: undefined,
      },
      components: components.map(component => ({
        ...component,
        id: `exported_${component.id}_${Date.now()}`, // Generate new ID for export
      })),
      metadata: {
        exportedAt: new Date(),
        exportedBy,
        version: '1.0.0',
        platform: 'Tawasal Form Builder',
      },
    };

    return JSON.stringify(exportableForm, null, 2);
  }

  // Export form to file
  async exportFormToFile(
    form: Form, 
    components: BaseComponent[], 
    exportedBy: string,
    filename?: string
  ): Promise<void> {
    const jsonData = this.exportForm(form, components, exportedBy);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `${form.title.replace(/[^a-zA-Z0-9]/g, '_')}_form.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // Import form from JSON
  importForm(jsonData: string, importedBy: string): ImportResult {
    try {
      const exportableForm: ExportableForm = JSON.parse(jsonData);
      
      // Validate the imported data
      const validation = this.validateImportData(exportableForm);
      if (!validation.isValid) {
        return {
          success: false,
          errors: validation.errors,
        };
      }

      // Generate new IDs for the imported form and components
      const newFormId = `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const importedForm: Form = {
        ...exportableForm.form,
        id: newFormId,
        title: `${exportableForm.form.title} (مستورد)`,
        createdBy: importedBy,
        createdAt: new Date(),
        updatedAt: new Date(),
        publishedAt: undefined,
        status: 'draft',
      };

      const importedComponents: BaseComponent[] = exportableForm.components.map(component => ({
        ...component,
        id: `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        formId: newFormId,
      }));

      return {
        success: true,
        form: importedForm,
        components: importedComponents,
        warnings: validation.warnings,
      };
    } catch (error) {
      return {
        success: false,
        errors: [`خطأ في تحليل الملف: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`],
      };
    }
  }

  // Import form from file
  async importFormFromFile(file: File, importedBy: string): Promise<ImportResult> {
    try {
      const text = await file.text();
      return this.importForm(text, importedBy);
    } catch (error) {
      return {
        success: false,
        errors: [`خطأ في قراءة الملف: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`],
      };
    }
  }

  // Validate import data
  private validateImportData(data: any): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if it's a valid exportable form structure
    if (!data || typeof data !== 'object') {
      errors.push('الملف غير صالح');
      return { isValid: false, errors, warnings };
    }

    if (!data.form || typeof data.form !== 'object') {
      errors.push('بيانات النموذج مفقودة');
      return { isValid: false, errors, warnings };
    }

    if (!data.components || !Array.isArray(data.components)) {
      errors.push('مكونات النموذج مفقودة');
      return { isValid: false, errors, warnings };
    }

    // Validate form structure
    const requiredFormFields = ['id', 'title', 'settings', 'status', 'createdBy'];
    for (const field of requiredFormFields) {
      if (!data.form[field]) {
        errors.push(`حقل النموذج المطلوب مفقود: ${field}`);
      }
    }

    // Validate components structure
    data.components.forEach((component: any, index: number) => {
      if (!component.id || !component.type) {
        errors.push(`مكون ${index + 1} لا يحتوي على معرف أو نوع صالح`);
      }
    });

    // Check version compatibility
    if (data.metadata?.version && data.metadata.version !== '1.0.0') {
      warnings.push(`إصدار الملف ${data.metadata.version} قد لا يكون متوافقاً مع الإصدار الحالي`);
    }

    // Check platform compatibility
    if (data.metadata?.platform && data.metadata.platform !== 'Tawasal Form Builder') {
      warnings.push(`الملف منصدر من ${data.metadata.platform} وقد لا يكون متوافقاً تماماً`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  // Export form as template
  exportAsTemplate(form: Form, components: BaseComponent[], exportedBy: string): string {
    const template = {
      name: form.title,
      description: form.description || '',
      category: 'مستورد',
      form: {
        ...form,
        id: `template_${Date.now()}`,
        title: form.title,
        description: form.description || '',
        status: 'draft',
        createdBy: exportedBy,
        createdAt: new Date(),
        updatedAt: new Date(),
        publishedAt: undefined,
      },
      components: components.map(component => ({
        ...component,
        id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      })),
      metadata: {
        exportedAt: new Date(),
        exportedBy,
        version: '1.0.0',
        platform: 'Tawasal Form Builder',
        type: 'template',
      },
    };

    return JSON.stringify(template, null, 2);
  }

  // Get supported file types
  getSupportedFileTypes(): string[] {
    return ['.json'];
  }

  // Get file type validation
  validateFileType(file: File): boolean {
    const supportedTypes = this.getSupportedFileTypes();
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    return supportedTypes.includes(fileExtension);
  }

  // Get file size validation
  validateFileSize(file: File, maxSizeMB: number = 10): boolean {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return file.size <= maxSizeBytes;
  }
}

// Export singleton instance
export const formExportImportService = FormExportImportService.getInstance();

// React hook for form export/import
export const useFormExportImport = () => {
  const service = formExportImportService;

  const exportForm = (form: Form, components: BaseComponent[], exportedBy: string) => {
    return service.exportForm(form, components, exportedBy);
  };

  const exportFormToFile = async (
    form: Form, 
    components: BaseComponent[], 
    exportedBy: string,
    filename?: string
  ) => {
    return service.exportFormToFile(form, components, exportedBy, filename);
  };

  const importForm = (jsonData: string, importedBy: string) => {
    return service.importForm(jsonData, importedBy);
  };

  const importFormFromFile = async (file: File, importedBy: string) => {
    return service.importFormFromFile(file, importedBy);
  };

  const exportAsTemplate = (form: Form, components: BaseComponent[], exportedBy: string) => {
    return service.exportAsTemplate(form, components, exportedBy);
  };

  const validateFile = (file: File) => {
    return {
      typeValid: service.validateFileType(file),
      sizeValid: service.validateFileSize(file),
    };
  };

  return {
    exportForm,
    exportFormToFile,
    importForm,
    importFormFromFile,
    exportAsTemplate,
    validateFile,
    getSupportedFileTypes: service.getSupportedFileTypes,
  };
};

export default formExportImportService;
