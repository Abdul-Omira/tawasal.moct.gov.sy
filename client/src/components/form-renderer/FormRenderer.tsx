/**
 * Form Renderer - Dynamic Form Display Component
 * Renders forms built with the form builder for public use
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Form, BaseComponent, FormSubmissionData, ComponentResponse } from '../../types/form';
import { componentRegistry } from '../form-components/ComponentRegistry';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Alert, AlertDescription } from '../ui/alert';
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { ConditionalLogicEngine } from '../../lib/conditionalLogic';
import { useAnalytics } from '../../lib/analytics';
import { useTenant } from '../../lib/tenantService';
import { MultiStepForm } from '../form-builder/MultiStepForm';

interface FormRendererProps {
  form: Form;
  components: BaseComponent[];
  onSubmit: (data: FormSubmissionData) => Promise<void>;
  onSaveProgress?: (data: Partial<FormSubmissionData>) => Promise<void>;
  isPreview?: boolean;
  showProgress?: boolean;
  allowSaveProgress?: boolean;
  className?: string;
  multiStep?: boolean;
  onStepChange?: (step: number) => void;
  onValidationChange?: (isValid: boolean) => void;
}

export const FormRenderer: React.FC<FormRendererProps> = ({
  form,
  components,
  onSubmit,
  onSaveProgress,
  isPreview = false,
  showProgress = true,
  allowSaveProgress = false,
  className,
  multiStep = false,
  onStepChange,
  onValidationChange,
}) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [conditionalEngine, setConditionalEngine] = useState<ConditionalLogicEngine | null>(null);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [startTime] = useState(() => Date.now());
  const [componentInteractions, setComponentInteractions] = useState<any[]>([]);

  // Analytics tracking
  const { trackView, trackSubmission, trackInteraction } = useAnalytics(form.id);

  // Tenant management
  const { getCurrentTenant } = useTenant();
  const currentTenant = getCurrentTenant();

  // Calculate progress
  const totalPages = components.filter(c => c.type === 'page-break').length + 1;
  const progress = showProgress ? ((currentPage + 1) / totalPages) * 100 : 0;

  // Initialize conditional logic engine
  useEffect(() => {
    const engine = new ConditionalLogicEngine(components, formData);
    setConditionalEngine(engine);
  }, [components]);

  // Update conditional logic engine when form data changes
  useEffect(() => {
    if (conditionalEngine) {
      Object.entries(formData).forEach(([fieldId, value]) => {
        conditionalEngine.updateFormData(fieldId, value);
      });
    }
  }, [formData, conditionalEngine]);

  // Track form view on mount
  useEffect(() => {
    trackView(sessionId, {
      userAgent: navigator.userAgent,
      referrer: document.referrer,
    });
  }, [trackView, sessionId]);

  // Check tenant access
  const hasTenantAccess = () => {
    if (!currentTenant) return true; // Allow access if no tenant system
    if (currentTenant.status !== 'active') return false;
    return true;
  };

  // Check if form requires authentication
  const requiresAuth = () => {
    if (!currentTenant) return false;
    return currentTenant.settings.security.requireAuth;
  };

  // Get current page components
  const getCurrentPageComponents = useCallback(() => {
    const pageBreaks = components
      .map((comp, index) => ({ comp, index }))
      .filter(({ comp }) => comp.type === 'page-break');
    
    const startIndex = currentPage === 0 ? 0 : (pageBreaks[currentPage - 1]?.index || 0) + 1;
    const endIndex = currentPage === totalPages - 1 
      ? components.length 
      : (pageBreaks[currentPage]?.index || components.length);
    
    const pageComponents = components.slice(startIndex, endIndex);
    
    // Filter out components that should be hidden based on conditional logic
    if (conditionalEngine) {
      return pageComponents.filter(component => 
        conditionalEngine.getComponentVisibility(component)
      );
    }
    
    return pageComponents;
  }, [components, currentPage, totalPages, conditionalEngine]);

  // Handle component value change
  const handleValueChange = useCallback((componentId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [componentId]: value
    }));
    
    // Track component interaction
    const component = components.find(c => c.id === componentId);
    if (component) {
      trackInteraction(componentId, component.type, 'change', value);
      
      // Add to component interactions for submission tracking
      setComponentInteractions(prev => [...prev, {
        componentId,
        componentType: component.type,
        interactionType: 'change',
        timestamp: new Date(),
        value,
      }]);
    }
    
    // Clear error when user starts typing
    if (errors[componentId]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[componentId];
        return newErrors;
      });
    }
  }, [errors, components, trackInteraction]);

  // Validate current page
  const validateCurrentPage = useCallback(() => {
    const currentComponents = getCurrentPageComponents();
    const newErrors: Record<string, string> = {};

    currentComponents.forEach(component => {
      const value = formData[component.id];
      
      // Required validation - use conditional logic if available
      const isRequired = conditionalEngine ? 
        conditionalEngine.getComponentRequirement(component) : 
        component.isRequired || false;
      
      if (isRequired && (!value || (Array.isArray(value) && value.length === 0))) {
        newErrors[component.id] = `${component.config.label} مطلوب`;
        return;
      }

      // Custom validation rules
      if (component.validation) {
        const { minLength, maxLength, pattern, min, max } = component.validation;
        
        if (value && typeof value === 'string') {
          if (minLength && value.length < minLength) {
            newErrors[component.id] = `يجب أن يكون ${component.config.label} ${minLength} أحرف على الأقل`;
          }
          if (maxLength && value.length > maxLength) {
            newErrors[component.id] = `يجب أن يكون ${component.config.label} ${maxLength} أحرف على الأكثر`;
          }
          if (pattern && !new RegExp(pattern).test(value)) {
            newErrors[component.id] = `تنسيق ${component.config.label} غير صحيح`;
          }
        }
        
        if (value && typeof value === 'number') {
          if (min !== undefined && value < min) {
            newErrors[component.id] = `يجب أن يكون ${component.config.label} ${min} على الأقل`;
          }
          if (max !== undefined && value > max) {
            newErrors[component.id] = `يجب أن يكون ${component.config.label} ${max} على الأكثر`;
          }
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, getCurrentPageComponents, conditionalEngine]);

  // Handle next page
  const handleNext = useCallback(() => {
    if (validateCurrentPage()) {
      if (currentPage < totalPages - 1) {
        setCurrentPage(prev => prev + 1);
      }
    }
  }, [currentPage, totalPages, validateCurrentPage]);

  // Handle previous page
  const handlePrevious = useCallback(() => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  }, [currentPage]);

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    if (!validateCurrentPage()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const responses: ComponentResponse[] = Object.entries(formData).map(([componentId, value]) => ({
        componentId,
        value,
        submittedAt: new Date(),
      }));

      const submissionData: FormSubmissionData = {
        formId: form.id,
        responses,
        submittedAt: new Date(),
      };

      await onSubmit(submissionData);
      
      // Track form submission
      const completionTime = (Date.now() - startTime) / 1000; // Convert to seconds
      trackSubmission(sessionId, completionTime, componentInteractions);
      
      setSubmitStatus('success');
    } catch (error) {
      console.error('Form submission error:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  }, [form.id, formData, validateCurrentPage, onSubmit, trackSubmission, sessionId, startTime, componentInteractions]);

  // Handle save progress
  const handleSaveProgress = useCallback(async () => {
    if (!onSaveProgress) return;

    setIsSaving(true);
    try {
      const responses: ComponentResponse[] = Object.entries(formData).map(([componentId, value]) => ({
        componentId,
        value,
        submittedAt: new Date(),
      }));

      await onSaveProgress({
        formId: form.id,
        responses,
        submittedAt: new Date(),
      });
    } catch (error) {
      console.error('Save progress error:', error);
    } finally {
      setIsSaving(false);
    }
  }, [form.id, formData, onSaveProgress]);

  // Render component
  const renderComponent = useCallback((component: BaseComponent) => {
    const ComponentDefinition = componentRegistry[component.type];
    if (!ComponentDefinition) {
      return (
        <div key={component.id} className="p-4 border border-red-200 rounded-lg bg-red-50">
          <p className="text-red-600">نوع المكون غير مدعوم: {component.type}</p>
        </div>
      );
    }

    const value = formData[component.id];
    const error = errors[component.id];
    
    // Apply conditional logic for required and enabled states
    const isRequired = conditionalEngine ? 
      conditionalEngine.getComponentRequirement(component) : 
      component.isRequired || false;
    
    const isEnabled = conditionalEngine ? 
      conditionalEngine.getComponentEnabled(component) : 
      true;

    // Create component with conditional logic applied
    const componentWithLogic = {
      ...component,
      isRequired,
      isEnabled,
    };

    return (
      <div key={component.id} className="space-y-2">
        <ComponentDefinition.render
          component={componentWithLogic}
          value={value}
          onChange={(newValue) => handleValueChange(component.id, newValue)}
          error={error}
          disabled={!isEnabled}
          className={cn(
            error && "border-red-500 focus:border-red-500 focus:ring-red-500",
            !isEnabled && "opacity-50 cursor-not-allowed"
          )}
        />
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  }, [formData, errors, handleValueChange, conditionalEngine]);

  // Success state
  if (submitStatus === 'success') {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="text-center space-y-4">
          <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto" />
          <h2 className="text-2xl font-bold text-green-800">تم إرسال النموذج بنجاح</h2>
          <p className="text-gray-600">
            شكراً لك على إرسال النموذج. سنقوم بالرد عليك في أقرب وقت ممكن.
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (submitStatus === 'error') {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Alert variant="destructive">
          <ExclamationTriangleIcon className="h-4 w-4" />
          <AlertDescription>
            حدث خطأ أثناء إرسال النموذج. يرجى المحاولة مرة أخرى.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Check access permissions
  if (!hasTenantAccess()) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
          <AlertDescription className="text-red-700 dark:text-red-300">
            لا يمكنك الوصول إلى هذا النموذج. المؤسسة غير نشطة أو غير متاحة.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (requiresAuth()) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20">
          <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
          <AlertDescription className="text-yellow-700 dark:text-yellow-300">
            يتطلب هذا النموذج تسجيل الدخول. يرجى تسجيل الدخول أولاً.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Multi-step form rendering
  if (multiStep) {
    return (
      <MultiStepForm
        form={form}
        components={components}
        onSubmit={async (data) => {
          const responses: ComponentResponse[] = Object.entries(data).map(([componentId, value]) => ({
            componentId,
            value,
            submittedAt: new Date(),
          }));

          const submissionData: FormSubmissionData = {
            formId: form.id,
            responses,
            submittedAt: new Date(),
          };

          await onSubmit(submissionData);
        }}
        onStepChange={onStepChange}
        onValidationChange={onValidationChange}
        className={className}
      />
    );
  }

  const currentComponents = getCurrentPageComponents();
  const isLastPage = currentPage === totalPages - 1;

  return (
    <div className={cn("max-w-2xl mx-auto p-6", className)}>
      {/* Form Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{form.title}</h1>
        {form.description && (
          <p className="text-gray-600">{form.description}</p>
        )}
      </div>

      {/* Progress Bar */}
      {showProgress && totalPages > 1 && (
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>الصفحة {currentPage + 1} من {totalPages}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {/* Form Content */}
      <div className="space-y-6">
        {currentComponents.map(renderComponent)}
      </div>

      {/* Form Actions */}
      <div className="mt-8 flex justify-between">
        <div>
          {currentPage > 0 && (
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevious}
              disabled={isSubmitting}
            >
              السابق
            </Button>
          )}
        </div>
        
        <div className="flex space-x-4 space-x-reverse">
          {allowSaveProgress && onSaveProgress && (
            <Button
              type="button"
              variant="outline"
              onClick={handleSaveProgress}
              disabled={isSaving || isSubmitting}
            >
              {isSaving ? 'جاري الحفظ...' : 'حفظ التقدم'}
            </Button>
          )}
          
          {isLastPage ? (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? 'جاري الإرسال...' : 'إرسال النموذج'}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleNext}
              disabled={isSubmitting}
            >
              التالي
            </Button>
          )}
        </div>
      </div>

      {/* Preview Notice */}
      {isPreview && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800 text-sm">
            هذا معاينة للنموذج. لن يتم حفظ البيانات عند الإرسال.
          </p>
        </div>
      )}
    </div>
  );
};
