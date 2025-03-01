/**
 * Form Builder Platform - Conditional Logic Builder
 * Visual interface for creating conditional logic rules
 */

import React, { useState, useEffect } from 'react';
import { ConditionalRule, ConditionalLogic, ConditionalLogicEngine } from '../../lib/conditionalLogic';
import { BaseComponent } from '../../types/component';
import { cn } from '../../lib/utils';
import {
  PlusIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface ConditionalLogicBuilderProps {
  component: BaseComponent;
  allComponents: BaseComponent[];
  onLogicChange: (logic: ConditionalLogic) => void;
  onClose: () => void;
}

export const ConditionalLogicBuilder: React.FC<ConditionalLogicBuilderProps> = ({
  component,
  allComponents,
  onLogicChange,
  onClose,
}) => {
  const [logic, setLogic] = useState<ConditionalLogic>(
    component.conditionalLogic || { rules: [], operator: 'AND' }
  );
  const [errors, setErrors] = useState<string[]>([]);

  // Get field options (exclude current component and page breaks)
  const fieldOptions = allComponents
    .filter(comp => comp.id !== component.id && comp.type !== 'page-break')
    .map(comp => ({
      id: comp.id,
      label: comp.config.label || comp.type,
      type: comp.type,
    }));

  // Get operator labels
  const operatorLabels = {
    equals: 'يساوي',
    not_equals: 'لا يساوي',
    contains: 'يحتوي على',
    not_equals: 'لا يساوي',
    contains: 'يحتوي على',
    not_contains: 'لا يحتوي على',
    greater_than: 'أكبر من',
    less_than: 'أصغر من',
    is_empty: 'فارغ',
    is_not_empty: 'غير فارغ',
  };

  // Get action labels
  const actionLabels = {
    show: 'إظهار',
    hide: 'إخفاء',
    require: 'مطلوب',
    optional: 'اختياري',
    enable: 'تفعيل',
    disable: 'تعطيل',
  };

  // Validate logic
  useEffect(() => {
    const validation = ConditionalLogicEngine.validateConditionalLogic(logic);
    setErrors(validation.errors);
  }, [logic]);

  // Add new rule
  const addRule = () => {
    const newRule: ConditionalRule = {
      id: Math.random().toString(36).substr(2, 9),
      fieldId: fieldOptions[0]?.id || '',
      operator: 'equals',
      value: '',
      action: 'show',
    };

    setLogic(prev => ({
      ...prev,
      rules: [...prev.rules, newRule],
    }));
  };

  // Update rule
  const updateRule = (ruleId: string, updates: Partial<ConditionalRule>) => {
    setLogic(prev => ({
      ...prev,
      rules: prev.rules.map(rule =>
        rule.id === ruleId ? { ...rule, ...updates } : rule
      ),
    }));
  };

  // Delete rule
  const deleteRule = (ruleId: string) => {
    setLogic(prev => ({
      ...prev,
      rules: prev.rules.filter(rule => rule.id !== ruleId),
    }));
  };

  // Get available operators for a field type
  const getAvailableOperators = (fieldId: string) => {
    const field = allComponents.find(comp => comp.id === fieldId);
    if (!field) return [];

    return ConditionalLogicEngine.getAvailableOperators(field.type);
  };

  // Get available actions
  const getAvailableActions = () => {
    return ConditionalLogicEngine.getAvailableActions();
  };

  // Handle save
  const handleSave = () => {
    if (errors.length === 0) {
      onLogicChange(logic);
      onClose();
    }
  };

  // Handle cancel
  const handleCancel = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                المنطق الشرطي - {component.config.label}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                قم بإنشاء قواعد لإظهار أو إخفاء هذا المكون بناءً على إجابات أخرى
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Operator Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              نوع الربط بين القواعد
            </label>
            <div className="flex space-x-4 space-x-reverse">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="AND"
                  checked={logic.operator === 'AND'}
                  onChange={(e) => setLogic(prev => ({ ...prev, operator: e.target.value as 'AND' | 'OR' }))}
                  className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span className="mr-2 text-sm text-gray-700 dark:text-gray-300">
                  جميع الشروط (AND)
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="OR"
                  checked={logic.operator === 'OR'}
                  onChange={(e) => setLogic(prev => ({ ...prev, operator: e.target.value as 'AND' | 'OR' }))}
                  className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span className="mr-2 text-sm text-gray-700 dark:text-gray-300">
                  أي شرط (OR)
                </span>
              </label>
            </div>
          </div>

          {/* Rules */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                القواعد ({logic.rules.length})
              </h3>
              <button
                onClick={addRule}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                <PlusIcon className="h-4 w-4 ml-2" />
                إضافة قاعدة
              </button>
            </div>

            {logic.rules.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm">لا توجد قواعد بعد</p>
                <p className="text-xs">اضغط على "إضافة قاعدة" لبدء إنشاء المنطق الشرطي</p>
              </div>
            ) : (
              <div className="space-y-3">
                {logic.rules.map((rule, index) => (
                  <div
                    key={rule.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        القاعدة {index + 1}
                      </span>
                      <button
                        onClick={() => deleteRule(rule.id)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                      {/* Field Selection */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          الحقل
                        </label>
                        <select
                          value={rule.fieldId}
                          onChange={(e) => updateRule(rule.id, { fieldId: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                          <option value="">اختر الحقل</option>
                          {fieldOptions.map(option => (
                            <option key={option.id} value={option.id}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Operator Selection */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          المشغل
                        </label>
                        <select
                          value={rule.operator}
                          onChange={(e) => updateRule(rule.id, { operator: e.target.value as any })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                          {getAvailableOperators(rule.fieldId).map(operator => (
                            <option key={operator} value={operator}>
                              {operatorLabels[operator as keyof typeof operatorLabels]}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Value Input */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          القيمة
                        </label>
                        <input
                          type="text"
                          value={rule.value || ''}
                          onChange={(e) => updateRule(rule.id, { value: e.target.value })}
                          disabled={['is_empty', 'is_not_empty'].includes(rule.operator)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-600"
                          placeholder="أدخل القيمة"
                        />
                      </div>

                      {/* Action Selection */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          الإجراء
                        </label>
                        <select
                          value={rule.action}
                          onChange={(e) => updateRule(rule.id, { action: e.target.value as any })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                          {getAvailableActions().map(action => (
                            <option key={action} value={action}>
                              {actionLabels[action as keyof typeof actionLabels]}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Errors */}
          {errors.length > 0 && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-md">
              <div className="flex">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400 ml-2" />
                <div>
                  <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                    يوجد أخطاء في القواعد
                  </h3>
                  <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                    <ul className="list-disc list-inside space-y-1">
                      {errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end space-x-3 space-x-reverse">
          <button
            onClick={handleCancel}
            className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          >
            إلغاء
          </button>
          <button
            onClick={handleSave}
            disabled={errors.length > 0}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircleIcon className="h-4 w-4 ml-2" />
            حفظ القواعد
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConditionalLogicBuilder;
