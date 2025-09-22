/**
 * Form Builder Platform - Enhanced Conditional Logic Builder
 * Advanced conditional logic builder with visual rule editor and testing interface
 */

import React, { useState, useCallback, useEffect } from 'react';
import { BaseComponent, ComponentType } from '../../types/component';
import { ConditionalLogic, ConditionalRule } from '../../types/form';
import { cn } from '../../lib/utils';
import { 
  PlusIcon,
  TrashIcon,
  PlayIcon,
  EyeIcon,
  CodeBracketIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon,
  ArrowRightIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';

interface ConditionalLogicBuilderProps {
  components: BaseComponent[];
  conditionalLogic: ConditionalLogic | null;
  onConditionalLogicChange: (logic: ConditionalLogic) => void;
  onClose: () => void;
}

type LogicOperator = 'AND' | 'OR';
type ComparisonOperator = 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'is_empty' | 'is_not_empty';
type ActionType = 'show' | 'hide' | 'require' | 'not_require' | 'enable' | 'disable' | 'set_value';

interface Rule {
  id: string;
  condition: {
    componentId: string;
    operator: ComparisonOperator;
    value: any;
  };
  action: {
    type: ActionType;
    targetComponentId: string;
    value?: any;
  };
}

interface RuleGroup {
  id: string;
  operator: LogicOperator;
  rules: Rule[];
}

export const ConditionalLogicBuilder: React.FC<ConditionalLogicBuilderProps> = ({
  components,
  conditionalLogic,
  onConditionalLogicChange,
  onClose,
}) => {
  const [ruleGroups, setRuleGroups] = useState<RuleGroup[]>([]);
  const [activeTab, setActiveTab] = useState<'builder' | 'test' | 'code'>('builder');
  const [testData, setTestData] = useState<Record<string, any>>({});
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});
  const [isTesting, setIsTesting] = useState(false);

  // Initialize rule groups from conditional logic
  useEffect(() => {
    if (conditionalLogic?.rules) {
      setRuleGroups(conditionalLogic.rules);
    }
  }, [conditionalLogic]);

  const addRuleGroup = useCallback(() => {
    const newGroup: RuleGroup = {
      id: Math.random().toString(36).substr(2, 9),
      operator: 'AND',
      rules: []
    };
    setRuleGroups(prev => [...prev, newGroup]);
  }, []);

  const addRule = useCallback((groupId: string) => {
    const newRule: Rule = {
      id: Math.random().toString(36).substr(2, 9),
      condition: {
        componentId: components[0]?.id || '',
        operator: 'equals',
        value: ''
      },
      action: {
        type: 'show',
        targetComponentId: components[0]?.id || '',
        value: ''
      }
    };
    
    setRuleGroups(prev => 
      prev.map(group => 
        group.id === groupId 
          ? { ...group, rules: [...group.rules, newRule] }
          : group
      )
    );
  }, [components]);

  const updateRule = useCallback((groupId: string, ruleId: string, updates: Partial<Rule>) => {
    setRuleGroups(prev => 
      prev.map(group => 
        group.id === groupId 
          ? {
              ...group,
              rules: group.rules.map(rule => 
                rule.id === ruleId ? { ...rule, ...updates } : rule
              )
            }
          : group
      )
    );
  }, []);

  const deleteRule = useCallback((groupId: string, ruleId: string) => {
    setRuleGroups(prev => 
      prev.map(group => 
        group.id === groupId 
          ? { ...group, rules: group.rules.filter(rule => rule.id !== ruleId) }
          : group
      )
    );
  }, []);

  const deleteRuleGroup = useCallback((groupId: string) => {
    setRuleGroups(prev => prev.filter(group => group.id !== groupId));
  }, []);

  const saveConditionalLogic = useCallback(() => {
    const logic: ConditionalLogic = {
      rules: ruleGroups,
      enabled: true
    };
    onConditionalLogicChange(logic);
  }, [ruleGroups, onConditionalLogicChange]);

  const testConditionalLogic = useCallback(async () => {
    setIsTesting(true);
    const results: Record<string, boolean> = {};
    
    // Simulate testing each rule group
    for (const group of ruleGroups) {
      let groupResult = group.operator === 'AND';
      
      for (const rule of group.rules) {
        const component = components.find(c => c.id === rule.condition.componentId);
        if (!component) continue;
        
        const testValue = testData[rule.condition.componentId];
        let ruleResult = false;
        
        switch (rule.condition.operator) {
          case 'equals':
            ruleResult = testValue === rule.condition.value;
            break;
          case 'not_equals':
            ruleResult = testValue !== rule.condition.value;
            break;
          case 'contains':
            ruleResult = String(testValue).includes(String(rule.condition.value));
            break;
          case 'not_contains':
            ruleResult = !String(testValue).includes(String(rule.condition.value));
            break;
          case 'greater_than':
            ruleResult = Number(testValue) > Number(rule.condition.value);
            break;
          case 'less_than':
            ruleResult = Number(testValue) < Number(rule.condition.value);
            break;
          case 'is_empty':
            ruleResult = !testValue || testValue === '';
            break;
          case 'is_not_empty':
            ruleResult = testValue && testValue !== '';
            break;
        }
        
        if (group.operator === 'AND') {
          groupResult = groupResult && ruleResult;
        } else {
          groupResult = groupResult || ruleResult;
        }
      }
      
      results[group.id] = groupResult;
    }
    
    setTestResults(results);
    setIsTesting(false);
  }, [ruleGroups, components, testData]);

  const getComponentOptions = useCallback(() => {
    return components.map(comp => ({
      value: comp.id,
      label: comp.config.label || comp.type,
      type: comp.type
    }));
  }, [components]);

  const getComparisonOperators = useCallback((componentType: ComponentType) => {
    const operators: { value: ComparisonOperator; label: string }[] = [
      { value: 'equals', label: 'يساوي' },
      { value: 'not_equals', label: 'لا يساوي' },
      { value: 'is_empty', label: 'فارغ' },
      { value: 'is_not_empty', label: 'غير فارغ' }
    ];

    if (componentType === 'text' || componentType === 'textarea') {
      operators.push(
        { value: 'contains', label: 'يحتوي على' },
        { value: 'not_contains', label: 'لا يحتوي على' }
      );
    }

    if (componentType === 'number' || componentType === 'rating') {
      operators.push(
        { value: 'greater_than', label: 'أكبر من' },
        { value: 'less_than', label: 'أصغر من' }
      );
    }

    return operators;
  }, []);

  const getActionTypes = useCallback(() => {
    return [
      { value: 'show', label: 'إظهار' },
      { value: 'hide', label: 'إخفاء' },
      { value: 'require', label: 'مطلوب' },
      { value: 'not_require', label: 'غير مطلوب' },
      { value: 'enable', label: 'تفعيل' },
      { value: 'disable', label: 'تعطيل' },
      { value: 'set_value', label: 'تعيين قيمة' }
    ];
  }, []);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Builder Panel */}
      <div className="absolute right-0 top-0 h-full w-3/4 bg-white dark:bg-gray-900 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-4 space-x-reverse">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              منشئ المنطق الشرطي
            </h3>
            <div className="flex items-center space-x-2 space-x-reverse">
              <button
                onClick={testConditionalLogic}
                disabled={isTesting}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                <PlayIcon className="h-4 w-4 ml-2" />
                {isTesting ? 'جاري الاختبار...' : 'اختبار'}
              </button>
              <button
                onClick={saveConditionalLogic}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                حفظ
              </button>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 space-x-reverse px-4">
            {[
              { id: 'builder', name: 'المنشئ', icon: Cog6ToothIcon },
              { id: 'test', name: 'الاختبار', icon: PlayIcon },
              { id: 'code', name: 'الكود', icon: CodeBracketIcon },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex items-center space-x-2 space-x-reverse py-4 px-1 border-b-2 font-medium text-sm transition-colors",
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                )}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {activeTab === 'builder' && (
            <RuleBuilder
              ruleGroups={ruleGroups}
              components={components}
              onAddRuleGroup={addRuleGroup}
              onAddRule={addRule}
              onUpdateRule={updateRule}
              onDeleteRule={deleteRule}
              onDeleteRuleGroup={deleteRuleGroup}
              getComponentOptions={getComponentOptions}
              getComparisonOperators={getComparisonOperators}
              getActionTypes={getActionTypes}
            />
          )}
          
          {activeTab === 'test' && (
            <TestInterface
              components={components}
              testData={testData}
              testResults={testResults}
              onTestDataChange={setTestData}
              onTest={testConditionalLogic}
              isTesting={isTesting}
            />
          )}
          
          {activeTab === 'code' && (
            <CodeViewer
              ruleGroups={ruleGroups}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// Rule Builder Component
interface RuleBuilderProps {
  ruleGroups: RuleGroup[];
  components: BaseComponent[];
  onAddRuleGroup: () => void;
  onAddRule: (groupId: string) => void;
  onUpdateRule: (groupId: string, ruleId: string, updates: Partial<Rule>) => void;
  onDeleteRule: (groupId: string, ruleId: string) => void;
  onDeleteRuleGroup: (groupId: string) => void;
  getComponentOptions: () => { value: string; label: string; type: ComponentType }[];
  getComparisonOperators: (type: ComponentType) => { value: ComparisonOperator; label: string }[];
  getActionTypes: () => { value: ActionType; label: string }[];
}

const RuleBuilder: React.FC<RuleBuilderProps> = ({
  ruleGroups,
  components,
  onAddRuleGroup,
  onAddRule,
  onUpdateRule,
  onDeleteRule,
  onDeleteRuleGroup,
  getComponentOptions,
  getComparisonOperators,
  getActionTypes,
}) => {
  const componentOptions = getComponentOptions();
  const actionTypes = getActionTypes();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-medium text-gray-900 dark:text-white">
          قواعد المنطق الشرطي
        </h4>
        <button
          onClick={onAddRuleGroup}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
        >
          <PlusIcon className="h-4 w-4 ml-2" />
          إضافة مجموعة قواعد
        </button>
      </div>

      {ruleGroups.length === 0 ? (
        <div className="text-center py-12">
          <Cog6ToothIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            لا توجد قواعد شرطية
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            ابدأ بإضافة مجموعة قواعد لإنشاء المنطق الشرطي
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {ruleGroups.map((group, groupIndex) => (
            <div key={group.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4 space-x-reverse">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    مجموعة {groupIndex + 1}
                  </span>
                  <select
                    value={group.operator}
                    onChange={(e) => onUpdateRule(group.id, '', { operator: e.target.value as LogicOperator })}
                    className="text-sm border border-gray-300 rounded px-2 py-1"
                  >
                    <option value="AND">و (AND)</option>
                    <option value="OR">أو (OR)</option>
                  </select>
                </div>
                <button
                  onClick={() => onDeleteRuleGroup(group.id)}
                  className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3">
                {group.rules.map((rule, ruleIndex) => (
                  <div key={rule.id} className="flex items-center space-x-4 space-x-reverse p-3 bg-gray-50 dark:bg-gray-800 rounded">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {ruleIndex > 0 && group.operator}
                    </span>
                    
                    <div className="flex-1 grid grid-cols-4 gap-4">
                      {/* Condition Component */}
                      <select
                        value={rule.condition.componentId}
                        onChange={(e) => onUpdateRule(group.id, rule.id, { 
                          condition: { ...rule.condition, componentId: e.target.value }
                        })}
                        className="text-sm border border-gray-300 rounded px-2 py-1"
                      >
                        {componentOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>

                      {/* Comparison Operator */}
                      <select
                        value={rule.condition.operator}
                        onChange={(e) => onUpdateRule(group.id, rule.id, { 
                          condition: { ...rule.condition, operator: e.target.value as ComparisonOperator }
                        })}
                        className="text-sm border border-gray-300 rounded px-2 py-1"
                      >
                        {getComparisonOperators(
                          components.find(c => c.id === rule.condition.componentId)?.type || 'text'
                        ).map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>

                      {/* Condition Value */}
                      <input
                        type="text"
                        value={rule.condition.value}
                        onChange={(e) => onUpdateRule(group.id, rule.id, { 
                          condition: { ...rule.condition, value: e.target.value }
                        })}
                        className="text-sm border border-gray-300 rounded px-2 py-1"
                        placeholder="القيمة"
                      />

                      {/* Action */}
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <select
                          value={rule.action.type}
                          onChange={(e) => onUpdateRule(group.id, rule.id, { 
                            action: { ...rule.action, type: e.target.value as ActionType }
                          })}
                          className="text-sm border border-gray-300 rounded px-2 py-1"
                        >
                          {actionTypes.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        
                        <select
                          value={rule.action.targetComponentId}
                          onChange={(e) => onUpdateRule(group.id, rule.id, { 
                            action: { ...rule.action, targetComponentId: e.target.value }
                          })}
                          className="text-sm border border-gray-300 rounded px-2 py-1"
                        >
                          {componentOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>

                        <button
                          onClick={() => onDeleteRule(group.id, rule.id)}
                          className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  onClick={() => onAddRule(group.id)}
                  className="w-full py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500"
                >
                  <PlusIcon className="h-4 w-4 mx-auto" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Test Interface Component
interface TestInterfaceProps {
  components: BaseComponent[];
  testData: Record<string, any>;
  testResults: Record<string, boolean>;
  onTestDataChange: (data: Record<string, any>) => void;
  onTest: () => void;
  isTesting: boolean;
}

const TestInterface: React.FC<TestInterfaceProps> = ({
  components,
  testData,
  testResults,
  onTestDataChange,
  onTest,
  isTesting,
}) => {
  const handleTestDataChange = (componentId: string, value: any) => {
    onTestDataChange({
      ...testData,
      [componentId]: value
    });
  };

  return (
    <div className="space-y-6">
      <h4 className="text-lg font-medium text-gray-900 dark:text-white">
        اختبار المنطق الشرطي
      </h4>
      
      <div className="grid grid-cols-2 gap-6">
        {/* Test Data Input */}
        <div>
          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
            بيانات الاختبار
          </h5>
          <div className="space-y-3">
            {components.map(component => (
              <div key={component.id}>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                  {component.config.label || component.type}
                </label>
                <input
                  type="text"
                  value={testData[component.id] || ''}
                  onChange={(e) => handleTestDataChange(component.id, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="أدخل قيمة للاختبار"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Test Results */}
        <div>
          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
            نتائج الاختبار
          </h5>
          <div className="space-y-2">
            {Object.entries(testResults).map(([groupId, result]) => (
              <div key={groupId} className="flex items-center space-x-2 space-x-reverse">
                {result ? (
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                ) : (
                  <XMarkIcon className="h-5 w-5 text-red-500" />
                )}
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  مجموعة {groupId}: {result ? 'صحيح' : 'خطأ'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Code Viewer Component
interface CodeViewerProps {
  ruleGroups: RuleGroup[];
}

const CodeViewer: React.FC<CodeViewerProps> = ({ ruleGroups }) => {
  const generateCode = () => {
    return JSON.stringify(ruleGroups, null, 2);
  };

  return (
    <div className="space-y-4">
      <h4 className="text-lg font-medium text-gray-900 dark:text-white">
        كود المنطق الشرطي
      </h4>
      <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-auto text-sm">
        <code>{generateCode()}</code>
      </pre>
    </div>
  );
};

export default ConditionalLogicBuilder;