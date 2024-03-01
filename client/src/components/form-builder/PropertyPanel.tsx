/**
 * Form Builder Platform - Property Panel
 * Component configuration and property editing panel
 */

import React, { useState } from 'react';
import { BaseComponent, ComponentType } from '../../types/component';
import { cn } from '../../lib/utils';
import {
  PencilIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface PropertyPanelProps {
  selectedComponent: BaseComponent | null;
  onConfigChange: (config: any) => void;
  onValidationChange: (validation: any) => void;
  onConditionalLogicChange: (logic: any) => void;
  onComponentDelete: (componentId: string) => void;
  onComponentToggleVisibility: (componentId: string) => void;
}

export const PropertyPanel: React.FC<PropertyPanelProps> = ({
  selectedComponent,
  onConfigChange,
  onValidationChange,
  onConditionalLogicChange,
  onComponentDelete,
  onComponentToggleVisibility,
}) => {
  const [activeTab, setActiveTab] = useState<'config' | 'validation' | 'logic'>('config');

  if (!selectedComponent) {
    return (
      <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col h-full">
        <div className="p-6 text-center">
          <PencilIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            اختر مكوناً للتعديل
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            اختر مكوناً من النموذج لرؤية خصائصه وتعديلها
          </p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'config', name: 'الخصائص', icon: PencilIcon },
    { id: 'validation', name: 'التحقق', icon: CheckCircleIcon },
    { id: 'logic', name: 'المنطق', icon: ExclamationTriangleIcon },
  ];

  return (
    <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              خصائص المكون
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {selectedComponent.type}
            </p>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <button
              onClick={() => onComponentToggleVisibility(selectedComponent.id)}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              title={selectedComponent.isVisible ? "إخفاء" : "إظهار"}
            >
              {selectedComponent.isVisible ? (
                <EyeIcon className="h-4 w-4" />
              ) : (
                <EyeSlashIcon className="h-4 w-4" />
              )}
            </button>
            <button
              onClick={() => onComponentDelete(selectedComponent.id)}
              className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
              title="حذف"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8 space-x-reverse px-4" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex items-center py-4 px-1 border-b-2 font-medium text-sm",
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                )}
              >
                <Icon className="h-4 w-4 ml-2" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {activeTab === 'config' && (
          <ConfigTab
            component={selectedComponent}
            onConfigChange={onConfigChange}
          />
        )}
        {activeTab === 'validation' && (
          <ValidationTab
            component={selectedComponent}
            onValidationChange={onValidationChange}
          />
        )}
        {activeTab === 'logic' && (
          <LogicTab
            component={selectedComponent}
            onConditionalLogicChange={onConditionalLogicChange}
          />
        )}
      </div>
    </div>
  );
};

// Configuration Tab
interface ConfigTabProps {
  component: BaseComponent;
  onConfigChange: (config: any) => void;
}

const ConfigTab: React.FC<ConfigTabProps> = ({ component, onConfigChange }) => {
  const handleConfigChange = (field: string, value: any) => {
    onConfigChange({
      ...component.config,
      [field]: value,
    });
  };

  return (
    <div className="space-y-4">
      {/* Basic Properties */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          التسمية
        </label>
        <input
          type="text"
          value={component.config.label || ''}
          onChange={(e) => handleConfigChange('label', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          placeholder="أدخل التسمية..."
        />
      </div>

      {/* Placeholder */}
      {component.type.includes('text') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            النص التوضيحي
          </label>
          <input
            type="text"
            value={component.config.placeholder || ''}
            onChange={(e) => handleConfigChange('placeholder', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="أدخل النص التوضيحي..."
          />
        </div>
      )}

      {/* Help Text */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          نص المساعدة
        </label>
        <textarea
          value={component.config.helpText || ''}
          onChange={(e) => handleConfigChange('helpText', e.target.value)}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          placeholder="أدخل نص المساعدة..."
        />
      </div>

      {/* Required */}
      <div className="flex items-center">
        <input
          type="checkbox"
          id="required"
          checked={component.isRequired}
          onChange={(e) => onConfigChange({ ...component, isRequired: e.target.checked })}
          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <label htmlFor="required" className="mr-2 text-sm text-gray-700 dark:text-gray-300">
          مطلوب
        </label>
      </div>

      {/* Component-specific properties */}
      {component.type === 'text' && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              الحد الأقصى للأحرف
            </label>
            <input
              type="number"
              value={component.config.maxLength || ''}
              onChange={(e) => handleConfigChange('maxLength', parseInt(e.target.value) || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="مثال: 255"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              الحد الأدنى للأحرف
            </label>
            <input
              type="number"
              value={component.config.minLength || ''}
              onChange={(e) => handleConfigChange('minLength', parseInt(e.target.value) || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="مثال: 3"
            />
          </div>
        </>
      )}

      {component.type === 'dropdown' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            الخيارات
          </label>
          <div className="space-y-2">
            {(component.config.options || []).map((option: any, index: number) => (
              <div key={index} className="flex items-center space-x-2 space-x-reverse">
                <input
                  type="text"
                  value={option.label}
                  onChange={(e) => {
                    const newOptions = [...(component.config.options || [])];
                    newOptions[index] = { ...option, label: e.target.value };
                    handleConfigChange('options', newOptions);
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="نص الخيار"
                />
                <input
                  type="text"
                  value={option.value}
                  onChange={(e) => {
                    const newOptions = [...(component.config.options || [])];
                    newOptions[index] = { ...option, value: e.target.value };
                    handleConfigChange('options', newOptions);
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="قيمة الخيار"
                />
                <button
                  onClick={() => {
                    const newOptions = (component.config.options || []).filter((_: any, i: number) => i !== index);
                    handleConfigChange('options', newOptions);
                  }}
                  className="p-1 text-red-600 hover:text-red-800"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
            <button
              onClick={() => {
                const newOptions = [...(component.config.options || []), { label: '', value: '' }];
                handleConfigChange('options', newOptions);
              }}
              className="w-full px-3 py-2 border border-dashed border-gray-300 rounded-md text-gray-500 hover:text-gray-700 hover:border-gray-400 dark:text-gray-400 dark:hover:text-gray-300"
            >
              إضافة خيار
            </button>
          </div>
        </div>
      )}

      {/* Styling */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          العرض
        </label>
        <select
          value={component.config.styling?.width || 'full'}
          onChange={(e) => handleConfigChange('styling', {
            ...component.config.styling,
            width: e.target.value
          })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        >
          <option value="full">كامل</option>
          <option value="1/2">نصف</option>
          <option value="1/3">ثلث</option>
          <option value="2/3">ثلثين</option>
        </select>
      </div>
    </div>
  );
};

// Validation Tab
interface ValidationTabProps {
  component: BaseComponent;
  onValidationChange: (validation: any) => void;
}

const ValidationTab: React.FC<ValidationTabProps> = ({ component, onValidationChange }) => {
  const handleValidationChange = (field: string, value: any) => {
    onValidationChange({
      ...component.validation,
      [field]: value,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center">
        <input
          type="checkbox"
          id="validation-required"
          checked={component.validation.required || false}
          onChange={(e) => handleValidationChange('required', e.target.checked)}
          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <label htmlFor="validation-required" className="mr-2 text-sm text-gray-700 dark:text-gray-300">
          مطلوب
        </label>
      </div>

      {component.type.includes('text') && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              الحد الأقصى للأحرف
            </label>
            <input
              type="number"
              value={component.validation.maxLength || ''}
              onChange={(e) => handleValidationChange('maxLength', parseInt(e.target.value) || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              الحد الأدنى للأحرف
            </label>
            <input
              type="number"
              value={component.validation.minLength || ''}
              onChange={(e) => handleValidationChange('minLength', parseInt(e.target.value) || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              نمط التحقق (Regex)
            </label>
            <input
              type="text"
              value={component.validation.pattern || ''}
              onChange={(e) => handleValidationChange('pattern', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="مثال: ^[0-9]+$"
            />
          </div>
        </>
      )}

      {component.type === 'number' && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              القيمة الدنيا
            </label>
            <input
              type="number"
              value={component.validation.min || ''}
              onChange={(e) => handleValidationChange('min', parseFloat(e.target.value) || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              القيمة العليا
            </label>
            <input
              type="number"
              value={component.validation.max || ''}
              onChange={(e) => handleValidationChange('max', parseFloat(e.target.value) || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
        </>
      )}
    </div>
  );
};

// Logic Tab
interface LogicTabProps {
  component: BaseComponent;
  onConditionalLogicChange: (logic: any) => void;
}

const LogicTab: React.FC<LogicTabProps> = ({ component, onConditionalLogicChange }) => {
  return (
    <div className="space-y-4">
      <div className="text-center py-8">
        <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
          المنطق الشرطي
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          هذه الميزة قيد التطوير
        </p>
      </div>
    </div>
  );
};

export default PropertyPanel;
