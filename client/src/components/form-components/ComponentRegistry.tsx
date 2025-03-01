/**
 * Form Builder Platform - Component Registry
 * Central registry for all form components
 */

import React from 'react';
import { ComponentDefinition, ComponentType, ComponentCategory } from '../../types/component';
import { TextInput } from './TextInput';
import { Dropdown } from './Dropdown';
import { MultiChoice } from './MultiChoice';
import { FileUpload } from './FileUpload';
import { Rating } from './Rating';

// Component registry
export const componentRegistry: Record<ComponentType, ComponentDefinition> = {
  'text': {
    type: 'text',
    name: 'نص',
    description: 'حقل إدخال نص بسيط',
    icon: '📝',
    category: 'input',
    defaultConfig: {
      label: 'النص',
      placeholder: 'أدخل النص هنا...',
      required: false,
      maxLength: 255,
    },
    defaultValidation: {
      required: false,
      maxLength: 255,
    },
    render: (props) => <TextInput {...props} config={props.component.config as any} />,
    configPanel: () => <div>Text Input Config Panel</div>,
    preview: (props) => <TextInput {...props} config={props.component.config as any} />,
  },
  'textarea': {
    type: 'textarea',
    name: 'نص طويل',
    description: 'حقل إدخال نص متعدد الأسطر',
    icon: '📄',
    category: 'input',
    defaultConfig: {
      label: 'النص الطويل',
      placeholder: 'أدخل النص الطويل هنا...',
      required: false,
      rows: 4,
    },
    defaultValidation: {
      required: false,
      maxLength: 1000,
    },
    render: (props) => <TextInput {...props} config={props.component.config as any} />,
    configPanel: () => <div>Textarea Config Panel</div>,
    preview: (props) => <TextInput {...props} config={props.component.config as any} />,
  },
  'email': {
    type: 'email',
    name: 'بريد إلكتروني',
    description: 'حقل إدخال البريد الإلكتروني',
    icon: '📧',
    category: 'input',
    defaultConfig: {
      label: 'البريد الإلكتروني',
      placeholder: 'example@email.com',
      required: false,
    },
    defaultValidation: {
      required: false,
      pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
    },
    render: (props) => <TextInput {...props} config={props.component.config as any} />,
    configPanel: () => <div>Email Config Panel</div>,
    preview: (props) => <TextInput {...props} config={props.component.config as any} />,
  },
  'phone': {
    type: 'phone',
    name: 'هاتف',
    description: 'حقل إدخال رقم الهاتف',
    icon: '📞',
    category: 'input',
    defaultConfig: {
      label: 'رقم الهاتف',
      placeholder: '+963 11 123 4567',
      required: false,
    },
    defaultValidation: {
      required: false,
      pattern: '^[\\+]?[1-9][\\d]{0,15}$',
    },
    render: (props) => <TextInput {...props} config={props.component.config as any} />,
    configPanel: () => <div>Phone Config Panel</div>,
    preview: (props) => <TextInput {...props} config={props.component.config as any} />,
  },
  'number': {
    type: 'number',
    name: 'رقم',
    description: 'حقل إدخال رقم',
    icon: '🔢',
    category: 'input',
    defaultConfig: {
      label: 'الرقم',
      placeholder: 'أدخل الرقم هنا...',
      required: false,
    },
    defaultValidation: {
      required: false,
    },
    render: (props) => <TextInput {...props} config={props.component.config as any} />,
    configPanel: () => <div>Number Config Panel</div>,
    preview: (props) => <TextInput {...props} config={props.component.config as any} />,
  },
  'dropdown': {
    type: 'dropdown',
    name: 'قائمة منسدلة',
    description: 'قائمة منسدلة للاختيار من خيارات متعددة',
    icon: '📋',
    category: 'selection',
    defaultConfig: {
      label: 'اختر من القائمة',
      required: false,
      options: [
        { value: 'option1', label: 'الخيار الأول' },
        { value: 'option2', label: 'الخيار الثاني' },
      ],
      allowMultiple: false,
    },
    defaultValidation: {
      required: false,
    },
    render: (props) => <Dropdown {...props} config={props.component.config as any} />,
    configPanel: () => <div>Dropdown Config Panel</div>,
    preview: (props) => <Dropdown {...props} config={props.component.config as any} />,
  },
  'radio': {
    type: 'radio',
    name: 'اختيار واحد',
    description: 'أزرار اختيار للاختيار من خيار واحد',
    icon: '🔘',
    category: 'selection',
    defaultConfig: {
      label: 'اختر خيار واحد',
      required: false,
      options: [
        { value: 'option1', label: 'الخيار الأول' },
        { value: 'option2', label: 'الخيار الثاني' },
      ],
      allowMultiple: false,
      layout: 'vertical',
    },
    defaultValidation: {
      required: false,
    },
    render: (props) => <MultiChoice {...props} config={props.component.config as any} />,
    configPanel: () => <div>Radio Config Panel</div>,
    preview: (props) => <MultiChoice {...props} config={props.component.config as any} />,
  },
  'checkbox': {
    type: 'checkbox',
    name: 'اختيار متعدد',
    description: 'مربعات اختيار للاختيار من خيارات متعددة',
    icon: '☑️',
    category: 'selection',
    defaultConfig: {
      label: 'اختر الخيارات',
      required: false,
      options: [
        { value: 'option1', label: 'الخيار الأول' },
        { value: 'option2', label: 'الخيار الثاني' },
      ],
      allowMultiple: true,
      layout: 'vertical',
    },
    defaultValidation: {
      required: false,
    },
    render: (props) => <MultiChoice {...props} config={props.component.config as any} />,
    configPanel: () => <div>Checkbox Config Panel</div>,
    preview: (props) => <MultiChoice {...props} config={props.component.config as any} />,
  },
  'multi-select': {
    type: 'multi-select',
    name: 'اختيار متعدد منسدل',
    description: 'قائمة منسدلة للاختيار من خيارات متعددة',
    icon: '📝',
    category: 'selection',
    defaultConfig: {
      label: 'اختر الخيارات',
      required: false,
      options: [
        { value: 'option1', label: 'الخيار الأول' },
        { value: 'option2', label: 'الخيار الثاني' },
      ],
      allowMultiple: true,
    },
    defaultValidation: {
      required: false,
    },
    render: (props) => <Dropdown {...props} config={props.component.config as any} />,
    configPanel: () => <div>Multi-select Config Panel</div>,
    preview: (props) => <Dropdown {...props} config={props.component.config as any} />,
  },
  'file-upload': {
    type: 'file-upload',
    name: 'رفع ملف',
    description: 'رفع ملف واحد أو عدة ملفات',
    icon: '📁',
    category: 'file',
    defaultConfig: {
      label: 'رفع الملف',
      required: false,
      allowedTypes: ['image/*', 'application/pdf'],
      maxFileSize: 10485760, // 10MB
      maxFiles: 1,
    },
    defaultValidation: {
      required: false,
    },
    render: (props) => <FileUpload {...props} config={props.component.config as any} />,
    configPanel: () => <div>File Upload Config Panel</div>,
    preview: (props) => <FileUpload {...props} config={props.component.config as any} />,
  },
  'date': {
    type: 'date',
    name: 'تاريخ',
    description: 'حقل اختيار التاريخ',
    icon: '📅',
    category: 'date',
    defaultConfig: {
      label: 'التاريخ',
      required: false,
      type: 'date',
    },
    defaultValidation: {
      required: false,
    },
    render: (props) => <TextInput {...props} config={props.component.config as any} />,
    configPanel: () => <div>Date Config Panel</div>,
    preview: (props) => <TextInput {...props} config={props.component.config as any} />,
  },
  'time': {
    type: 'time',
    name: 'وقت',
    description: 'حقل اختيار الوقت',
    icon: '🕐',
    category: 'date',
    defaultConfig: {
      label: 'الوقت',
      required: false,
      type: 'time',
    },
    defaultValidation: {
      required: false,
    },
    render: (props) => <TextInput {...props} config={props.component.config as any} />,
    configPanel: () => <div>Time Config Panel</div>,
    preview: (props) => <TextInput {...props} config={props.component.config as any} />,
  },
  'date-range': {
    type: 'date-range',
    name: 'نطاق تاريخ',
    description: 'حقل اختيار نطاق التاريخ',
    icon: '📆',
    category: 'date',
    defaultConfig: {
      label: 'نطاق التاريخ',
      required: false,
      type: 'range',
    },
    defaultValidation: {
      required: false,
    },
    render: (props) => <TextInput {...props} config={props.component.config as any} />,
    configPanel: () => <div>Date Range Config Panel</div>,
    preview: (props) => <TextInput {...props} config={props.component.config as any} />,
  },
  'rating': {
    type: 'rating',
    name: 'تقييم بالنجوم',
    description: 'تقييم باستخدام النجوم',
    icon: '⭐',
    category: 'rating',
    defaultConfig: {
      label: 'التقييم',
      required: false,
      type: 'stars',
      maxValue: 5,
      minValue: 1,
    },
    defaultValidation: {
      required: false,
    },
    render: (props) => <Rating {...props} config={props.component.config as any} />,
    configPanel: () => <div>Rating Config Panel</div>,
    preview: (props) => <Rating {...props} config={props.component.config as any} />,
  },
  'scale': {
    type: 'scale',
    name: 'مقياس تقييم',
    description: 'تقييم باستخدام مقياس رقمي',
    icon: '📊',
    category: 'rating',
    defaultConfig: {
      label: 'التقييم',
      required: false,
      type: 'scale',
      maxValue: 10,
      minValue: 1,
    },
    defaultValidation: {
      required: false,
    },
    render: (props) => <Rating {...props} config={props.component.config as any} />,
    configPanel: () => <div>Scale Config Panel</div>,
    preview: (props) => <Rating {...props} config={props.component.config as any} />,
  },
  'nps': {
    type: 'nps',
    name: 'مقياس NPS',
    description: 'مقياس Net Promoter Score',
    icon: '📈',
    category: 'rating',
    defaultConfig: {
      label: 'ما مدى احتمالية أن توصي بنا؟',
      required: false,
      type: 'nps',
      maxValue: 10,
      minValue: 0,
      labels: {
        min: 'غير محتمل على الإطلاق',
        max: 'محتمل جداً',
      },
    },
    defaultValidation: {
      required: false,
    },
    render: (props) => <Rating {...props} config={props.component.config as any} />,
    configPanel: () => <div>NPS Config Panel</div>,
    preview: (props) => <Rating {...props} config={props.component.config as any} />,
  },
  'page-break': {
    type: 'page-break',
    name: 'فاصل صفحة',
    description: 'فاصل بين صفحات النموذج',
    icon: '📄',
    category: 'layout',
    defaultConfig: {
      title: 'الصفحة التالية',
      description: 'انتقل إلى الصفحة التالية',
      showProgress: true,
    },
    defaultValidation: {},
    render: () => <div>Page Break</div>,
    configPanel: () => <div>Page Break Config Panel</div>,
    preview: () => <div>Page Break Preview</div>,
  },
  'section-header': {
    type: 'section-header',
    name: 'عنوان قسم',
    description: 'عنوان أو وصف للقسم',
    icon: '📝',
    category: 'layout',
    defaultConfig: {
      title: 'عنوان القسم',
      description: 'وصف القسم',
      level: 2,
    },
    defaultValidation: {},
    render: () => <div>Section Header</div>,
    configPanel: () => <div>Section Header Config Panel</div>,
    preview: () => <div>Section Header Preview</div>,
  },
  'conditional-logic': {
    type: 'conditional-logic',
    name: 'منطق شرطي',
    description: 'إظهار أو إخفاء الحقول بناءً على الشروط',
    icon: '🔗',
    category: 'logic',
    defaultConfig: {
      label: 'منطق شرطي',
      required: false,
    },
    defaultValidation: {
      required: false,
    },
    render: () => <div>Conditional Logic</div>,
    configPanel: () => <div>Conditional Logic Config Panel</div>,
    preview: () => <div>Conditional Logic Preview</div>,
  },
};

// Get component by type
export const getComponent = (type: ComponentType): ComponentDefinition | undefined => {
  return componentRegistry[type];
};

// Get components by category
export const getComponentsByCategory = (category: ComponentCategory): ComponentDefinition[] => {
  return Object.values(componentRegistry).filter(component => component.category === category);
};

// Get all components
export const getAllComponents = (): ComponentDefinition[] => {
  return Object.values(componentRegistry);
};

// Get component categories
export const getComponentCategories = (): ComponentCategory[] => {
  return ['input', 'selection', 'file', 'date', 'rating', 'layout', 'logic'];
};
