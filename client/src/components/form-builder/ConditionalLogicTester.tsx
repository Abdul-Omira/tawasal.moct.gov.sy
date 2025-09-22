/**
 * Form Builder Platform - Conditional Logic Tester
 * Testing interface for conditional logic rules
 */

import React, { useState, useCallback, useEffect } from 'react';
import { BaseComponent } from '../../types/component';
import { ConditionalLogic, ConditionalRule } from '../../types/form';
import { cn } from '../../lib/utils';
import { 
  PlayIcon,
  CheckCircleIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline';

interface ConditionalLogicTesterProps {
  components: BaseComponent[];
  conditionalLogic: ConditionalLogic | null;
  onTestResults: (results: TestResult[]) => void;
  className?: string;
}

interface TestResult {
  ruleId: string;
  ruleName: string;
  condition: string;
  action: string;
  result: boolean;
  error?: string;
}

interface TestData {
  [componentId: string]: any;
}

export const ConditionalLogicTester: React.FC<ConditionalLogicTesterProps> = ({
  components,
  conditionalLogic,
  onTestResults,
  className,
}) => {
  const [testData, setTestData] = useState<TestData>({});
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Initialize test data with default values
  useEffect(() => {
    const initialData: TestData = {};
    components.forEach(component => {
      initialData[component.id] = component.config.value || '';
    });
    setTestData(initialData);
  }, [components]);

  const handleTestDataChange = useCallback((componentId: string, value: any) => {
    setTestData(prev => ({
      ...prev,
      [componentId]: value
    }));
  }, []);

  const evaluateCondition = useCallback((rule: ConditionalRule, data: TestData): boolean => {
    const { condition } = rule;
    const component = components.find(c => c.id === condition.componentId);
    if (!component) return false;

    const testValue = data[condition.componentId];
    
    switch (condition.operator) {
      case 'equals':
        return testValue === condition.value;
      case 'not_equals':
        return testValue !== condition.value;
      case 'contains':
        return String(testValue).includes(String(condition.value));
      case 'not_contains':
        return !String(testValue).includes(String(condition.value));
      case 'greater_than':
        return Number(testValue) > Number(condition.value);
      case 'less_than':
        return Number(testValue) < Number(condition.value);
      case 'is_empty':
        return !testValue || testValue === '';
      case 'is_not_empty':
        return testValue && testValue !== '';
      default:
        return false;
    }
  }, [components]);

  const runTests = useCallback(async () => {
    if (!conditionalLogic?.rules) return;

    setIsRunning(true);
    const results: TestResult[] = [];

    try {
      for (const group of conditionalLogic.rules) {
        let groupResult = group.operator === 'AND';
        const groupName = `مجموعة ${group.id}`;

        for (const rule of group.rules) {
          const component = components.find(c => c.id === rule.condition.componentId);
          const targetComponent = components.find(c => c.id === rule.action.targetComponentId);
          
          if (!component || !targetComponent) {
            results.push({
              ruleId: rule.id,
              ruleName: `${groupName} - قاعدة ${rule.id}`,
              condition: `مكون غير موجود: ${rule.condition.componentId}`,
              action: `إجراء غير موجود: ${rule.action.targetComponentId}`,
              result: false,
              error: 'مكون غير موجود'
            });
            continue;
          }

          const conditionResult = evaluateCondition(rule, testData);
          const conditionText = `${component.config.label || component.type} ${getOperatorText(rule.condition.operator)} ${rule.condition.value}`;
          const actionText = `${getActionText(rule.action.type)} ${targetComponent.config.label || targetComponent.type}`;

          results.push({
            ruleId: rule.id,
            ruleName: `${groupName} - قاعدة ${rule.id}`,
            condition: conditionText,
            action: actionText,
            result: conditionResult
          });

          if (group.operator === 'AND') {
            groupResult = groupResult && conditionResult;
          } else {
            groupResult = groupResult || conditionResult;
          }
        }
      }

      setTestResults(results);
      onTestResults(results);
    } catch (error) {
      console.error('Error running tests:', error);
    } finally {
      setIsRunning(false);
    }
  }, [conditionalLogic, components, testData, evaluateCondition, onTestResults]);

  const getOperatorText = (operator: string): string => {
    const operators: Record<string, string> = {
      'equals': 'يساوي',
      'not_equals': 'لا يساوي',
      'contains': 'يحتوي على',
      'not_contains': 'لا يحتوي على',
      'greater_than': 'أكبر من',
      'less_than': 'أصغر من',
      'is_empty': 'فارغ',
      'is_not_empty': 'غير فارغ'
    };
    return operators[operator] || operator;
  };

  const getActionText = (action: string): string => {
    const actions: Record<string, string> = {
      'show': 'إظهار',
      'hide': 'إخفاء',
      'require': 'جعل مطلوب',
      'not_require': 'جعل غير مطلوب',
      'enable': 'تفعيل',
      'disable': 'تعطيل',
      'set_value': 'تعيين قيمة'
    };
    return actions[action] || action;
  };

  const getComponentType = (component: BaseComponent) => {
    switch (component.type) {
      case 'text':
      case 'textarea':
        return 'text';
      case 'number':
        return 'number';
      case 'email':
        return 'email';
      case 'checkbox':
        return 'checkbox';
      case 'radio':
        return 'radio';
      case 'select':
        return 'select';
      default:
        return 'text';
    }
  };

  const renderTestInput = (component: BaseComponent) => {
    const inputType = getComponentType(component);
    
    switch (inputType) {
      case 'checkbox':
        return (
          <input
            type="checkbox"
            checked={testData[component.id] || false}
            onChange={(e) => handleTestDataChange(component.id, e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
        );
      case 'number':
        return (
          <input
            type="number"
            value={testData[component.id] || ''}
            onChange={(e) => handleTestDataChange(component.id, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="أدخل رقم"
          />
        );
      case 'email':
        return (
          <input
            type="email"
            value={testData[component.id] || ''}
            onChange={(e) => handleTestDataChange(component.id, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="أدخل بريد إلكتروني"
          />
        );
      default:
        return (
          <input
            type="text"
            value={testData[component.id] || ''}
            onChange={(e) => handleTestDataChange(component.id, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="أدخل قيمة"
          />
        );
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-medium text-gray-900 dark:text-white">
          اختبار المنطق الشرطي
        </h4>
        <div className="flex items-center space-x-2 space-x-reverse">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          >
            {showDetails ? <EyeSlashIcon className="h-4 w-4 ml-2" /> : <EyeIcon className="h-4 w-4 ml-2" />}
            {showDetails ? 'إخفاء التفاصيل' : 'إظهار التفاصيل'}
          </button>
          <button
            onClick={runTests}
            disabled={isRunning}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            <PlayIcon className="h-4 w-4 ml-2" />
            {isRunning ? 'جاري الاختبار...' : 'تشغيل الاختبار'}
          </button>
        </div>
      </div>

      {/* Test Data Input */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
          بيانات الاختبار
        </h5>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {components.map(component => (
            <div key={component.id}>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                {component.config.label || component.type}
                {component.isRequired && (
                  <span className="text-red-500 mr-1">*</span>
                )}
              </label>
              {renderTestInput(component)}
            </div>
          ))}
        </div>
      </div>

      {/* Test Results */}
      {testResults.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              نتائج الاختبار
            </h5>
          </div>
          <div className="p-4">
            <div className="space-y-3">
              {testResults.map((result, index) => (
                <div key={index} className="flex items-start space-x-3 space-x-reverse">
                  <div className="flex-shrink-0 mt-1">
                    {result.result ? (
                      <CheckCircleIcon className="h-5 w-5 text-green-500" />
                    ) : (
                      <XMarkIcon className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {result.ruleName}
                      </p>
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                        result.result
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                          : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                      )}>
                        {result.result ? 'صحيح' : 'خطأ'}
                      </span>
                    </div>
                    {showDetails && (
                      <div className="mt-2 space-y-1">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          <span className="font-medium">الشرط:</span> {result.condition}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          <span className="font-medium">الإجراء:</span> {result.action}
                        </p>
                        {result.error && (
                          <p className="text-sm text-red-600 dark:text-red-400">
                            <span className="font-medium">خطأ:</span> {result.error}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Summary */}
      {testResults.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-4">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-blue-400 ml-2" />
            <div>
              <h6 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                ملخص الاختبار
              </h6>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                تم اختبار {testResults.length} قاعدة، 
                {testResults.filter(r => r.result).length} صحيحة، 
                {testResults.filter(r => !r.result).length} خاطئة
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConditionalLogicTester;
