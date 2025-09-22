import React, { useState, useEffect } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, CheckIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert } from '@/components/ui/alert';
import { BaseComponent, Form } from '@/types/form';

interface MultiStepFormProps {
  form: Form;
  components: BaseComponent[];
  onSubmit: (data: any) => void;
  onStepChange?: (step: number) => void;
  onValidationChange?: (isValid: boolean) => void;
  className?: string;
}

interface Step {
  id: string;
  title: string;
  description?: string;
  components: BaseComponent[];
  isRequired: boolean;
  validationRules?: any;
}

export const MultiStepForm: React.FC<MultiStepFormProps> = ({
  form,
  components,
  onSubmit,
  onStepChange,
  onValidationChange,
  className = ''
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [stepData, setStepData] = useState<Record<string, any>>({});
  const [stepErrors, setStepErrors] = useState<Record<string, string[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  // Generate steps from components
  const steps: Step[] = React.useMemo(() => {
    const stepComponents = components.filter(comp => comp.type === 'step');
    if (stepComponents.length === 0) {
      // If no step components, create a single step with all components
      return [{
        id: 'default',
        title: form.title || 'Form',
        description: form.description,
        components: components.filter(comp => comp.type !== 'step'),
        isRequired: true,
        validationRules: {}
      }];
    }

    return stepComponents.map((stepComp, index) => {
      const stepComponents = components.filter(comp => 
        comp.orderIndex > stepComp.orderIndex && 
        (index === stepComponents.length - 1 || 
         components.find(c => c.type === 'step' && c.orderIndex > stepComp.orderIndex)?.orderIndex > comp.orderIndex)
      );

      return {
        id: stepComp.id,
        title: stepComp.config.title || `Step ${index + 1}`,
        description: stepComp.config.description,
        components: stepComponents,
        isRequired: stepComp.config.isRequired !== false,
        validationRules: stepComp.validation || {}
      };
    });
  }, [components, form]);

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  // Validate current step
  const validateStep = (stepIndex: number): boolean => {
    const step = steps[stepIndex];
    if (!step) return false;

    const errors: string[] = [];
    
    step.components.forEach(component => {
      if (component.isRequired && !stepData[component.id]) {
        errors.push(`${component.config.label || component.type} is required`);
      }
      
      // Add custom validation rules
      if (component.validation?.rules) {
        const value = stepData[component.id];
        component.validation.rules.forEach((rule: any) => {
          if (rule.type === 'minLength' && value && value.length < rule.value) {
            errors.push(`${component.config.label || component.type} must be at least ${rule.value} characters`);
          }
          if (rule.type === 'maxLength' && value && value.length > rule.value) {
            errors.push(`${component.config.label || component.type} must be no more than ${rule.value} characters`);
          }
          if (rule.type === 'pattern' && value && !new RegExp(rule.value).test(value)) {
            errors.push(`${component.config.label || component.type} format is invalid`);
          }
        });
      }
    });

    setStepErrors(prev => ({ ...prev, [stepIndex]: errors }));
    return errors.length === 0;
  };

  // Handle step navigation
  const goToStep = (stepIndex: number) => {
    if (stepIndex < 0 || stepIndex >= steps.length) return;
    
    // Validate current step before moving
    if (stepIndex > currentStep && !validateStep(currentStep)) {
      return;
    }

    setCurrentStep(stepIndex);
    onStepChange?.(stepIndex);
  };

  // Handle next step
  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCompletedSteps(prev => new Set([...prev, currentStep]));
      goToStep(currentStep + 1);
    }
  };

  // Handle previous step
  const handlePrevious = () => {
    goToStep(currentStep - 1);
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setIsSubmitting(true);
    try {
      await onSubmit({ ...formData, ...stepData });
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle component value changes
  const handleValueChange = (componentId: string, value: any) => {
    setStepData(prev => ({ ...prev, [componentId]: value }));
    setFormData(prev => ({ ...prev, [componentId]: value }));
  };

  // Update validation status
  useEffect(() => {
    const isValid = validateStep(currentStep);
    onValidationChange?.(isValid);
  }, [currentStep, stepData, onValidationChange]);

  // Render component based on type
  const renderComponent = (component: BaseComponent) => {
    const value = stepData[component.id] || '';
    const error = stepErrors[currentStep]?.find(err => err.includes(component.config.label || component.type));

    switch (component.type) {
      case 'text':
        return (
          <div key={component.id} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {component.config.label}
              {component.isRequired && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="text"
              value={value}
              onChange={(e) => handleValueChange(component.id, e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder={component.config.placeholder}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        );

      case 'email':
        return (
          <div key={component.id} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {component.config.label}
              {component.isRequired && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="email"
              value={value}
              onChange={(e) => handleValueChange(component.id, e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder={component.config.placeholder}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        );

      case 'textarea':
        return (
          <div key={component.id} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {component.config.label}
              {component.isRequired && <span className="text-red-500 ml-1">*</span>}
            </label>
            <textarea
              value={value}
              onChange={(e) => handleValueChange(component.id, e.target.value)}
              rows={component.config.rows || 4}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder={component.config.placeholder}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        );

      case 'select':
        return (
          <div key={component.id} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {component.config.label}
              {component.isRequired && <span className="text-red-500 ml-1">*</span>}
            </label>
            <select
              value={value}
              onChange={(e) => handleValueChange(component.id, e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
            >
              <option value="">Select an option</option>
              {component.config.options?.map((option: any, index: number) => (
                <option key={index} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        );

      case 'checkbox':
        return (
          <div key={component.id} className="space-y-2">
            <label className="flex items-center space-x-2 space-x-reverse">
              <input
                type="checkbox"
                checked={value || false}
                onChange={(e) => handleValueChange(component.id, e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {component.config.label}
                {component.isRequired && <span className="text-red-500 ml-1">*</span>}
              </span>
            </label>
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        );

      case 'radio':
        return (
          <div key={component.id} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {component.config.label}
              {component.isRequired && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="space-y-2">
              {component.config.options?.map((option: any, index: number) => (
                <label key={index} className="flex items-center space-x-2 space-x-reverse">
                  <input
                    type="radio"
                    name={component.id}
                    value={option.value}
                    checked={value === option.value}
                    onChange={(e) => handleValueChange(component.id, e.target.value)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{option.label}</span>
                </label>
              ))}
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`max-w-4xl mx-auto p-6 ${className}`}>
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Step {currentStep + 1} of {steps.length}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {Math.round(progress)}% Complete
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step Navigation */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4 space-x-reverse">
          {steps.map((step, index) => (
            <button
              key={step.id}
              onClick={() => goToStep(index)}
              className={`flex items-center space-x-2 space-x-reverse px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                index === currentStep
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : index < currentStep
                  ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                  : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
              }`}
            >
              {index < currentStep && <CheckIcon className="h-4 w-4" />}
              <span>{step.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Current Step Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {currentStepData.title}
          </h2>
          {currentStepData.description && (
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              {currentStepData.description}
            </p>
          )}
        </div>

        {/* Step Errors */}
        {stepErrors[currentStep] && stepErrors[currentStep].length > 0 && (
          <Alert variant="destructive" className="mb-6">
            <ul className="list-disc list-inside space-y-1">
              {stepErrors[currentStep].map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </Alert>
        )}

        {/* Form Components */}
        <div className="space-y-6">
          {currentStepData.components.map(renderComponent)}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="flex items-center space-x-2 space-x-reverse"
          >
            <ChevronLeftIcon className="h-4 w-4" />
            <span>Previous</span>
          </Button>

          <div className="flex items-center space-x-3 space-x-reverse">
            {currentStep === steps.length - 1 ? (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !validateStep(currentStep)}
                className="flex items-center space-x-2 space-x-reverse"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <CheckIcon className="h-4 w-4" />
                    <span>Submit</span>
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={!validateStep(currentStep)}
                className="flex items-center space-x-2 space-x-reverse"
              >
                <span>Next</span>
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};