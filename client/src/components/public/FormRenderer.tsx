/**
 * Form Builder Platform - Public Form Renderer
 * Renders forms for public access and submission
 */

import React, { useState, useEffect } from 'react';
import { Form, FormComponent, FormResponse } from '../../types/form';
import { BaseComponent } from '../../types/component';
import { componentRegistry } from '../form-components/ComponentRegistry';
import { cn } from '../../lib/utils';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  PaperAirplaneIcon,
} from '@heroicons/react/24/outline';

interface FormRendererProps {
  form: Form;
  components: BaseComponent[];
  onSubmit: (response: FormResponse) => Promise<void>;
  onSaveProgress?: (response: Partial<FormResponse>) => Promise<void>;
  showProgress?: boolean;
  allowSaveProgress?: boolean;
  isPreview?: boolean;
}

export const FormRenderer: React.FC<FormRendererProps> = ({
  form,
  components,
  onSubmit,
  onSaveProgress,
  showProgress = true,
  allowSaveProgress = false,
  isPreview = false,
}) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Group components by pages
  const pages = groupComponentsByPages(components);
  const currentPageComponents = pages[currentPage] || [];
  const totalPages = pages.length;

  // Calculate progress
  const progress = totalPages > 1 ? ((currentPage + 1) / totalPages) * 100 : 100;

  // Handle form data changes
  const handleFieldChange = (componentId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [componentId]: value,
    }));
    
    // Clear error when user starts typing
    if (errors[componentId]) {
      setErrors(prev => ({
        ...prev,
        [componentId]: '',
      }));
    }
  };

  // Validate current page
  const validateCurrentPage = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    currentPageComponents.forEach(component => {
      const value = formData[component.id];
      const error = validateComponent(component, value);
      if (error) {
        newErrors[component.id] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validate individual component
  const validateComponent = (component: BaseComponent, value: any): string | null => {
    const { validation } = component;
    
    // Required validation
    if (validation.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      return `${component.config.label} مطلوب`;
    }

    // Skip other validations if value is empty and not required
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return null;
    }

    // Min length validation
    if (validation.minLength && typeof value === 'string' && value.length < validation.minLength) {
      return `يجب أن يكون ${component.config.label} على الأقل ${validation.minLength} حرف`;
    }

    // Max length validation
    if (validation.maxLength && typeof value === 'string' && value.length > validation.maxLength) {
      return `يجب أن يكون ${component.config.label} أقل من ${validation.maxLength} حرف`;
    }

    // Pattern validation
    if (validation.pattern && typeof value === 'string') {
      const regex = new RegExp(validation.pattern);
      if (!regex.test(value)) {
        return `تنسيق ${component.config.label} غير صحيح`;
      }
    }

    // Min value validation
    if (validation.min !== undefined && typeof value === 'number' && value < validation.min) {
      return `يجب أن تكون قيمة ${component.config.label} على الأقل ${validation.min}`;
    }

    // Max value validation
    if (validation.max !== undefined && typeof value === 'number' && value > validation.max) {
      return `يجب أن تكون قيمة ${component.config.label} أقل من ${validation.max}`;
    }

    return null;
  };

  // Handle next page
  const handleNext = () => {
    if (validateCurrentPage()) {
      if (currentPage < totalPages - 1) {
        setCurrentPage(prev => prev + 1);
      } else {
        handleSubmit();
      }
    }
  };

  // Handle previous page
  const handlePrevious = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (isSubmitting) return;

    // Validate all pages
    const allComponents = components.sort((a, b) => a.orderIndex - b.orderIndex);
    const allErrors: Record<string, string> = {};
    
    allComponents.forEach(component => {
      const value = formData[component.id];
      const error = validateComponent(component, value);
      if (error) {
        allErrors[component.id] = error;
      }
    });

    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      // Go to first page with errors
      const firstErrorComponent = allComponents.find(c => allErrors[c.id]);
      if (firstErrorComponent) {
        const errorPage = pages.findIndex(page => 
          page.some(c => c.id === firstErrorComponent.id)
        );
        if (errorPage !== -1) {
          setCurrentPage(errorPage);
        }
      }
      return;
    }

    setIsSubmitting(true);
    try {
      const response: FormResponse = {
        id: Math.random().toString(36).substr(2, 9),
        formId: form.id,
        responseData: formData,
        submittedAt: new Date(),
        userInfo: {
          userAgent: navigator.userAgent,
          language: navigator.language,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        status: 'completed',
      };

      await onSubmit(response);
      setSubmitted(true);
    } catch (error) {
      console.error('Form submission error:', error);
      // Handle error (show error message, etc.)
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle save progress
  const handleSaveProgress = async () => {
    if (isSaving || !onSaveProgress) return;

    setIsSaving(true);
    try {
      const partialResponse: Partial<FormResponse> = {
        formId: form.id,
        responseData: formData,
        status: 'partial',
      };

      await onSaveProgress(partialResponse);
    } catch (error) {
      console.error('Save progress error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Auto-save progress
  useEffect(() => {
    if (allowSaveProgress && onSaveProgress) {
      const timer = setTimeout(() => {
        handleSaveProgress();
      }, 30000); // Auto-save every 30 seconds

      return () => clearTimeout(timer);
    }
  }, [formData, allowSaveProgress, onSaveProgress]);

  // Success screen
  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8 text-center">
          <CheckCircleIcon className="mx-auto h-16 w-16 text-green-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            تم إرسال النموذج بنجاح
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            شكراً لك على وقتك. تم حفظ إجابتك بنجاح.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            إرسال نموذج آخر
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {form.title}
            </h1>
            {form.description && (
              <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
                {form.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      {showProgress && totalPages > 1 && (
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                الصفحة {currentPage + 1} من {totalPages}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {Math.round(progress)}% مكتمل
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Form Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="p-6">
            <form onSubmit={(e) => { e.preventDefault(); handleNext(); }}>
              <div className="space-y-6">
                {currentPageComponents.map(component => {
                  const componentDef = componentRegistry[component.type];
                  if (!componentDef) return null;

                  return (
                    <div key={component.id}>
                      {React.createElement(componentDef.render, {
                        component,
                        value: formData[component.id] || '',
                        onChange: (value: any) => handleFieldChange(component.id, value),
                        onBlur: () => {},
                        onFocus: () => {},
                        error: errors[component.id],
                        disabled: isSubmitting,
                        readOnly: false,
                        className: "w-full",
                      })}
                    </div>
                  );
                })}
              </div>

              {/* Navigation */}
              <div className="mt-8 flex items-center justify-between">
                <div className="flex items-center space-x-4 space-x-reverse">
                  {currentPage > 0 && (
                    <button
                      type="button"
                      onClick={handlePrevious}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                    >
                      <ArrowRightIcon className="h-4 w-4 ml-2" />
                      السابق
                    </button>
                  )}
                </div>

                <div className="flex items-center space-x-4 space-x-reverse">
                  {allowSaveProgress && onSaveProgress && (
                    <button
                      type="button"
                      onClick={handleSaveProgress}
                      disabled={isSaving}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                    >
                      {isSaving ? 'جاري الحفظ...' : 'حفظ المسودة'}
                    </button>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      'جاري الإرسال...'
                    ) : currentPage < totalPages - 1 ? (
                      <>
                        التالي
                        <ArrowLeftIcon className="h-4 w-4 mr-2" />
                      </>
                    ) : (
                      <>
                        إرسال النموذج
                        <PaperAirplaneIcon className="h-4 w-4 mr-2" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to group components by pages
const groupComponentsByPages = (components: BaseComponent[]): BaseComponent[][] => {
  const pages: BaseComponent[][] = [];
  let currentPage: BaseComponent[] = [];

  components
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .forEach(component => {
      if (component.type === 'page-break') {
        if (currentPage.length > 0) {
          pages.push(currentPage);
          currentPage = [];
        }
      } else {
        currentPage.push(component);
      }
    });

  if (currentPage.length > 0) {
    pages.push(currentPage);
  }

  return pages.length > 0 ? pages : [components];
};

export default FormRenderer;
