/**
 * Form Builder Platform - Conditional Logic Engine
 * Handles conditional logic for form components
 */

import { BaseComponent } from '../types/component';

export interface ConditionalRule {
  id: string;
  fieldId: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'is_empty' | 'is_not_empty';
  value: any;
  action: 'show' | 'hide' | 'require' | 'optional' | 'enable' | 'disable';
}

export interface ConditionalLogic {
  rules: ConditionalRule[];
  operator: 'AND' | 'OR';
}

export class ConditionalLogicEngine {
  private formData: Record<string, any> = {};
  private components: BaseComponent[] = [];

  constructor(components: BaseComponent[], formData: Record<string, any> = {}) {
    this.components = components;
    this.formData = formData;
  }

  // Update form data
  updateFormData(fieldId: string, value: any) {
    this.formData[fieldId] = value;
  }

  // Evaluate a single rule
  private evaluateRule(rule: ConditionalRule): boolean {
    const fieldValue = this.formData[rule.fieldId];
    
    switch (rule.operator) {
      case 'equals':
        return fieldValue === rule.value;
      case 'not_equals':
        return fieldValue !== rule.value;
      case 'contains':
        return String(fieldValue).includes(String(rule.value));
      case 'not_contains':
        return !String(fieldValue).includes(String(rule.value));
      case 'greater_than':
        return Number(fieldValue) > Number(rule.value);
      case 'less_than':
        return Number(fieldValue) < Number(rule.value);
      case 'is_empty':
        return !fieldValue || String(fieldValue).trim() === '';
      case 'is_not_empty':
        return fieldValue && String(fieldValue).trim() !== '';
      default:
        return false;
    }
  }

  // Evaluate conditional logic
  evaluateConditionalLogic(logic: ConditionalLogic): boolean {
    if (!logic.rules || logic.rules.length === 0) {
      return true;
    }

    const results = logic.rules.map(rule => this.evaluateRule(rule));
    
    if (logic.operator === 'AND') {
      return results.every(result => result);
    } else {
      return results.some(result => result);
    }
  }

  // Get component visibility based on conditional logic
  getComponentVisibility(component: BaseComponent): boolean {
    if (!component.conditionalLogic || !component.conditionalLogic.rules) {
      return component.isVisible !== false;
    }

    const shouldShow = this.evaluateConditionalLogic(component.conditionalLogic);
    
    // If the logic evaluates to true, show the component
    // If false, hide it
    return shouldShow && component.isVisible !== false;
  }

  // Get component requirement based on conditional logic
  getComponentRequirement(component: BaseComponent): boolean {
    if (!component.conditionalLogic || !component.conditionalLogic.rules) {
      return component.isRequired || false;
    }

    const shouldRequire = this.evaluateConditionalLogic(component.conditionalLogic);
    
    // If the logic evaluates to true, make the component required
    // If false, make it optional
    return shouldRequire || component.isRequired || false;
  }

  // Get component enabled state based on conditional logic
  getComponentEnabled(component: BaseComponent): boolean {
    if (!component.conditionalLogic || !component.conditionalLogic.rules) {
      return true;
    }

    const shouldEnable = this.evaluateConditionalLogic(component.conditionalLogic);
    
    // If the logic evaluates to true, enable the component
    // If false, disable it
    return shouldEnable;
  }

  // Get all components that should be visible
  getVisibleComponents(): BaseComponent[] {
    return this.components.filter(component => this.getComponentVisibility(component));
  }

  // Get all components that should be required
  getRequiredComponents(): BaseComponent[] {
    return this.components.filter(component => this.getComponentRequirement(component));
  }

  // Get all components that should be enabled
  getEnabledComponents(): BaseComponent[] {
    return this.components.filter(component => this.getComponentEnabled(component));
  }

  // Validate conditional logic rules
  static validateRule(rule: ConditionalRule): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!rule.id) {
      errors.push('Rule ID is required');
    }

    if (!rule.fieldId) {
      errors.push('Field ID is required');
    }

    if (!rule.operator) {
      errors.push('Operator is required');
    }

    if (!rule.action) {
      errors.push('Action is required');
    }

    // Validate operator and value combination
    if (rule.operator && ['is_empty', 'is_not_empty'].includes(rule.operator)) {
      if (rule.value !== null && rule.value !== undefined) {
        errors.push('Value should be empty for is_empty/is_not_empty operators');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Validate conditional logic
  static validateConditionalLogic(logic: ConditionalLogic): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!logic.rules || logic.rules.length === 0) {
      errors.push('At least one rule is required');
    }

    if (!logic.operator || !['AND', 'OR'].includes(logic.operator)) {
      errors.push('Operator must be AND or OR');
    }

    // Validate each rule
    if (logic.rules) {
      logic.rules.forEach((rule, index) => {
        const ruleValidation = this.validateRule(rule);
        if (!ruleValidation.isValid) {
          errors.push(`Rule ${index + 1}: ${ruleValidation.errors.join(', ')}`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Get available operators for a field type
  static getAvailableOperators(fieldType: string): string[] {
    switch (fieldType) {
      case 'text':
      case 'textarea':
      case 'email':
      case 'phone':
        return ['equals', 'not_equals', 'contains', 'not_contains', 'is_empty', 'is_not_empty'];
      case 'number':
        return ['equals', 'not_equals', 'greater_than', 'less_than', 'is_empty', 'is_not_empty'];
      case 'dropdown':
      case 'radio':
        return ['equals', 'not_equals', 'is_empty', 'is_not_empty'];
      case 'checkbox':
      case 'multi-select':
        return ['contains', 'not_contains', 'is_empty', 'is_not_empty'];
      case 'date':
        return ['equals', 'not_equals', 'greater_than', 'less_than', 'is_empty', 'is_not_empty'];
      default:
        return ['equals', 'not_equals', 'is_empty', 'is_not_empty'];
    }
  }

  // Get available actions
  static getAvailableActions(): string[] {
    return ['show', 'hide', 'require', 'optional', 'enable', 'disable'];
  }

  // Create a new conditional rule
  static createRule(
    fieldId: string,
    operator: ConditionalRule['operator'],
    value: any,
    action: ConditionalRule['action']
  ): ConditionalRule {
    return {
      id: Math.random().toString(36).substr(2, 9),
      fieldId,
      operator,
      value,
      action,
    };
  }

  // Create conditional logic
  static createConditionalLogic(
    rules: ConditionalRule[],
    operator: 'AND' | 'OR' = 'AND'
  ): ConditionalLogic {
    return {
      rules,
      operator,
    };
  }
}

// Helper function to get field options for conditional logic
export const getFieldOptions = (components: BaseComponent[]) => {
  return components
    .filter(component => component.type !== 'page-break')
    .map(component => ({
      id: component.id,
      label: component.config.label || component.type,
      type: component.type,
    }));
};

// Helper function to get operator labels
export const getOperatorLabels = () => ({
  equals: 'يساوي',
  not_equals: 'لا يساوي',
  contains: 'يحتوي على',
  not_contains: 'لا يحتوي على',
  greater_than: 'أكبر من',
  less_than: 'أصغر من',
  is_empty: 'فارغ',
  is_not_empty: 'غير فارغ',
});

// Helper function to get action labels
export const getActionLabels = () => ({
  show: 'إظهار',
  hide: 'إخفاء',
  require: 'مطلوب',
  optional: 'اختياري',
  enable: 'تفعيل',
  disable: 'تعطيل',
});

export default ConditionalLogicEngine;
