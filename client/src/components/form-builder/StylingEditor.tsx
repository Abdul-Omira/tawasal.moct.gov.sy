/**
 * Form Builder Platform - Styling Editor Component
 * Advanced styling editor for form customization
 */

import React, { useState, useCallback } from 'react';
import { Form } from '../../types/form';
import { BaseComponent } from '../../types/component';
import { cn } from '../../lib/utils';
import { 
  PaintBrushIcon,
  EyeIcon,
  CodeBracketIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  DeviceTabletIcon,
  XMarkIcon,
  CheckIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

interface StylingEditorProps {
  form: Form | null;
  selectedComponent: BaseComponent | null;
  onFormStyleUpdate: (updates: Partial<Form['settings']>) => void;
  onComponentStyleUpdate: (componentId: string, updates: Partial<BaseComponent['style']>) => void;
  onClose: () => void;
}

type StyleTab = 'theme' | 'layout' | 'typography' | 'colors' | 'spacing' | 'custom';
type ResponsiveBreakpoint = 'mobile' | 'tablet' | 'desktop';

export const StylingEditor: React.FC<StylingEditorProps> = ({
  form,
  selectedComponent,
  onFormStyleUpdate,
  onComponentStyleUpdate,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<StyleTab>('theme');
  const [activeBreakpoint, setActiveBreakpoint] = useState<ResponsiveBreakpoint>('desktop');
  const [customCSS, setCustomCSS] = useState(form?.settings?.customCSS || '');
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const handleFormStyleChange = useCallback((path: string, value: any) => {
    if (!form) return;
    
    const updates = { ...form.settings };
    const keys = path.split('.');
    let current = updates;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
    onFormStyleUpdate(updates);
  }, [form, onFormStyleUpdate]);

  const handleComponentStyleChange = useCallback((path: string, value: any) => {
    if (!selectedComponent) return;
    
    const updates = { ...selectedComponent.style };
    const keys = path.split('.');
    let current = updates;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
    onComponentStyleUpdate(selectedComponent.id, updates);
  }, [selectedComponent, onComponentStyleUpdate]);

  const handleCustomCSSChange = useCallback((css: string) => {
    setCustomCSS(css);
    handleFormStyleChange('customCSS', css);
  }, [handleFormStyleChange]);

  const resetStyles = useCallback(() => {
    if (selectedComponent) {
      onComponentStyleUpdate(selectedComponent.id, {});
    } else if (form) {
      onFormStyleUpdate({
        theme: {
          primaryColor: '#3B82F6',
          secondaryColor: '#6B7280',
          backgroundColor: '#FFFFFF',
          textColor: '#111827',
          fontFamily: 'Inter'
        },
        behavior: {
          showProgress: true,
          allowSaveProgress: true,
          requireLogin: false,
          allowAnonymous: true,
          maxSubmissions: 0,
          submissionDeadline: null,
          timeLimit: null
        },
        layout: {
          width: '100%',
          maxWidth: '800px',
          padding: '24px',
          margin: '0 auto',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        },
        typography: {
          fontFamily: 'Inter',
          fontSize: '16px',
          lineHeight: '1.5',
          fontWeight: '400',
          letterSpacing: '0'
        },
        customCSS: ''
      });
    }
  }, [selectedComponent, form, onComponentStyleUpdate, onFormStyleUpdate]);

  const tabs = [
    { id: 'theme', label: 'المظهر', icon: PaintBrushIcon },
    { id: 'layout', label: 'التخطيط', icon: ComputerDesktopIcon },
    { id: 'typography', label: 'الخط', icon: CodeBracketIcon },
    { id: 'colors', label: 'الألوان', icon: PaintBrushIcon },
    { id: 'spacing', label: 'المسافات', icon: DeviceTabletIcon },
    { id: 'custom', label: 'CSS مخصص', icon: CodeBracketIcon },
  ];

  const breakpoints = [
    { id: 'mobile', label: 'هاتف', icon: DevicePhoneMobileIcon, width: '375px' },
    { id: 'tablet', label: 'جهاز لوحي', icon: DeviceTabletIcon, width: '768px' },
    { id: 'desktop', label: 'سطح المكتب', icon: ComputerDesktopIcon, width: '1200px' },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Editor Panel */}
      <div className="absolute right-0 top-0 h-full w-1/2 bg-white dark:bg-gray-900 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-4 space-x-reverse">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              محرر التصميم
            </h3>
            {selectedComponent && (
              <span className="text-sm text-gray-500">
                {selectedComponent.type}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <button
              onClick={resetStyles}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              title="إعادة تعيين"
            >
              <ArrowPathIcon className="h-5 w-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Responsive Controls */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              نقاط الاستجابة
            </span>
            <div className="flex items-center space-x-1 space-x-reverse">
              {breakpoints.map(breakpoint => (
                <button
                  key={breakpoint.id}
                  onClick={() => setActiveBreakpoint(breakpoint.id as ResponsiveBreakpoint)}
                  className={cn(
                    "p-2 rounded-md transition-colors flex items-center space-x-1 space-x-reverse",
                    activeBreakpoint === breakpoint.id
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                      : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  )}
                  title={`${breakpoint.label} (${breakpoint.width})`}
                >
                  <breakpoint.icon className="h-4 w-4" />
                  <span className="text-xs">{breakpoint.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 space-x-reverse px-4">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as StyleTab)}
                className={cn(
                  "flex items-center space-x-2 space-x-reverse py-4 px-1 border-b-2 font-medium text-sm transition-colors",
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                )}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {activeTab === 'theme' && (
            <ThemeEditor
              form={form}
              selectedComponent={selectedComponent}
              onFormStyleChange={handleFormStyleChange}
              onComponentStyleChange={handleComponentStyleChange}
              breakpoint={activeBreakpoint}
            />
          )}
          
          {activeTab === 'layout' && (
            <LayoutEditor
              form={form}
              selectedComponent={selectedComponent}
              onFormStyleChange={handleFormStyleChange}
              onComponentStyleChange={handleComponentStyleChange}
              breakpoint={activeBreakpoint}
            />
          )}
          
          {activeTab === 'typography' && (
            <TypographyEditor
              form={form}
              selectedComponent={selectedComponent}
              onFormStyleChange={handleFormStyleChange}
              onComponentStyleChange={handleComponentStyleChange}
              breakpoint={activeBreakpoint}
            />
          )}
          
          {activeTab === 'colors' && (
            <ColorsEditor
              form={form}
              selectedComponent={selectedComponent}
              onFormStyleChange={handleFormStyleChange}
              onComponentStyleChange={handleComponentStyleChange}
              breakpoint={activeBreakpoint}
            />
          )}
          
          {activeTab === 'spacing' && (
            <SpacingEditor
              form={form}
              selectedComponent={selectedComponent}
              onFormStyleChange={handleFormStyleChange}
              onComponentStyleChange={handleComponentStyleChange}
              breakpoint={activeBreakpoint}
            />
          )}
          
          {activeTab === 'custom' && (
            <CustomCSSEditor
              customCSS={customCSS}
              onCustomCSSChange={handleCustomCSSChange}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// Theme Editor Component
const ThemeEditor: React.FC<any> = ({ form, selectedComponent, onFormStyleChange, onComponentStyleChange, breakpoint }) => {
  const isForm = !selectedComponent;
  const theme = isForm ? form?.settings?.theme : selectedComponent?.style?.theme;

  return (
    <div className="space-y-6">
      <h4 className="text-lg font-medium text-gray-900 dark:text-white">إعدادات المظهر</h4>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            اللون الأساسي
          </label>
          <input
            type="color"
            value={theme?.primaryColor || '#3B82F6'}
            onChange={(e) => {
              if (isForm) {
                onFormStyleChange('theme.primaryColor', e.target.value);
              } else {
                onComponentStyleChange('theme.primaryColor', e.target.value);
              }
            }}
            className="w-full h-10 border border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            اللون الثانوي
          </label>
          <input
            type="color"
            value={theme?.secondaryColor || '#6B7280'}
            onChange={(e) => {
              if (isForm) {
                onFormStyleChange('theme.secondaryColor', e.target.value);
              } else {
                onComponentStyleChange('theme.secondaryColor', e.target.value);
              }
            }}
            className="w-full h-10 border border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            لون الخلفية
          </label>
          <input
            type="color"
            value={theme?.backgroundColor || '#FFFFFF'}
            onChange={(e) => {
              if (isForm) {
                onFormStyleChange('theme.backgroundColor', e.target.value);
              } else {
                onComponentStyleChange('theme.backgroundColor', e.target.value);
              }
            }}
            className="w-full h-10 border border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            لون النص
          </label>
          <input
            type="color"
            value={theme?.textColor || '#111827'}
            onChange={(e) => {
              if (isForm) {
                onFormStyleChange('theme.textColor', e.target.value);
              } else {
                onComponentStyleChange('theme.textColor', e.target.value);
              }
            }}
            className="w-full h-10 border border-gray-300 rounded-md"
          />
        </div>
      </div>
    </div>
  );
};

// Layout Editor Component
const LayoutEditor: React.FC<any> = ({ form, selectedComponent, onFormStyleChange, onComponentStyleChange, breakpoint }) => {
  const isForm = !selectedComponent;
  const layout = isForm ? form?.settings?.layout : selectedComponent?.style?.layout;

  return (
    <div className="space-y-6">
      <h4 className="text-lg font-medium text-gray-900 dark:text-white">إعدادات التخطيط</h4>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            العرض
          </label>
          <input
            type="text"
            value={layout?.width || '100%'}
            onChange={(e) => {
              if (isForm) {
                onFormStyleChange('layout.width', e.target.value);
              } else {
                onComponentStyleChange('layout.width', e.target.value);
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="100%"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            الحد الأقصى للعرض
          </label>
          <input
            type="text"
            value={layout?.maxWidth || '800px'}
            onChange={(e) => {
              if (isForm) {
                onFormStyleChange('layout.maxWidth', e.target.value);
              } else {
                onComponentStyleChange('layout.maxWidth', e.target.value);
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="800px"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            الحشو
          </label>
          <input
            type="text"
            value={layout?.padding || '24px'}
            onChange={(e) => {
              if (isForm) {
                onFormStyleChange('layout.padding', e.target.value);
              } else {
                onComponentStyleChange('layout.padding', e.target.value);
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="24px"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            الهوامش
          </label>
          <input
            type="text"
            value={layout?.margin || '0 auto'}
            onChange={(e) => {
              if (isForm) {
                onFormStyleChange('layout.margin', e.target.value);
              } else {
                onComponentStyleChange('layout.margin', e.target.value);
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="0 auto"
          />
        </div>
      </div>
    </div>
  );
};

// Typography Editor Component
const TypographyEditor: React.FC<any> = ({ form, selectedComponent, onFormStyleChange, onComponentStyleChange, breakpoint }) => {
  const isForm = !selectedComponent;
  const typography = isForm ? form?.settings?.typography : selectedComponent?.style?.typography;

  return (
    <div className="space-y-6">
      <h4 className="text-lg font-medium text-gray-900 dark:text-white">إعدادات الخط</h4>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            عائلة الخط
          </label>
          <select
            value={typography?.fontFamily || 'Inter'}
            onChange={(e) => {
              if (isForm) {
                onFormStyleChange('typography.fontFamily', e.target.value);
              } else {
                onComponentStyleChange('typography.fontFamily', e.target.value);
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="Inter">Inter</option>
            <option value="Arial">Arial</option>
            <option value="Helvetica">Helvetica</option>
            <option value="Times New Roman">Times New Roman</option>
            <option value="Georgia">Georgia</option>
            <option value="Cairo">Cairo</option>
            <option value="Tajawal">Tajawal</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            حجم الخط
          </label>
          <input
            type="text"
            value={typography?.fontSize || '16px'}
            onChange={(e) => {
              if (isForm) {
                onFormStyleChange('typography.fontSize', e.target.value);
              } else {
                onComponentStyleChange('typography.fontSize', e.target.value);
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="16px"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            ارتفاع السطر
          </label>
          <input
            type="text"
            value={typography?.lineHeight || '1.5'}
            onChange={(e) => {
              if (isForm) {
                onFormStyleChange('typography.lineHeight', e.target.value);
              } else {
                onComponentStyleChange('typography.lineHeight', e.target.value);
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="1.5"
          />
        </div>
      </div>
    </div>
  );
};

// Colors Editor Component
const ColorsEditor: React.FC<any> = ({ form, selectedComponent, onFormStyleChange, onComponentStyleChange, breakpoint }) => {
  return (
    <div className="space-y-6">
      <h4 className="text-lg font-medium text-gray-900 dark:text-white">إعدادات الألوان</h4>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        استخدم محرر المظهر لتخصيص الألوان
      </p>
    </div>
  );
};

// Spacing Editor Component
const SpacingEditor: React.FC<any> = ({ form, selectedComponent, onFormStyleChange, onComponentStyleChange, breakpoint }) => {
  return (
    <div className="space-y-6">
      <h4 className="text-lg font-medium text-gray-900 dark:text-white">إعدادات المسافات</h4>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        استخدم محرر التخطيط لتخصيص المسافات
      </p>
    </div>
  );
};

// Custom CSS Editor Component
const CustomCSSEditor: React.FC<{ customCSS: string; onCustomCSSChange: (css: string) => void }> = ({
  customCSS,
  onCustomCSSChange,
}) => {
  return (
    <div className="space-y-6">
      <h4 className="text-lg font-medium text-gray-900 dark:text-white">CSS مخصص</h4>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          أكواد CSS المخصصة
        </label>
        <textarea
          value={customCSS}
          onChange={(e) => onCustomCSSChange(e.target.value)}
          className="w-full h-64 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
          placeholder="/* أضف أكواد CSS المخصصة هنا */"
        />
      </div>
      
      <div className="text-sm text-gray-500 dark:text-gray-400">
        <p>يمكنك استخدام المتغيرات التالية:</p>
        <ul className="mt-2 space-y-1">
          <li><code className="bg-gray-100 px-1 rounded">--primary-color</code> - اللون الأساسي</li>
          <li><code className="bg-gray-100 px-1 rounded">--secondary-color</code> - اللون الثانوي</li>
          <li><code className="bg-gray-100 px-1 rounded">--background-color</code> - لون الخلفية</li>
          <li><code className="bg-gray-100 px-1 rounded">--text-color</code> - لون النص</li>
        </ul>
      </div>
    </div>
  );
};

export default StylingEditor;
