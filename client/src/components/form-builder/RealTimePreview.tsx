/**
 * Form Builder Platform - Real-time Preview Component
 * Shows live preview of the form as it's being built
 */

import React, { useState, useCallback } from 'react';
import { Form, BaseComponent } from '../../types/form';
import { componentRegistry } from '../form-components/ComponentRegistry';
import { cn } from '../../lib/lib/utils';
import { 
  EyeIcon,
  XMarkIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  DeviceTabletIcon,
} from '@heroicons/react/24/outline';

interface RealTimePreviewProps {
  form: Form | null;
  components: BaseComponent[];
  isOpen: boolean;
  onClose: () => void;
}

type PreviewDevice = 'desktop' | 'tablet' | 'mobile';

export const RealTimePreview: React.FC<RealTimePreviewProps> = ({
  form,
  components,
  isOpen,
  onClose,
}) => {
  const [previewDevice, setPreviewDevice] = useState<PreviewDevice>('desktop');

  const getDeviceStyles = (device: PreviewDevice) => {
    switch (device) {
      case 'mobile':
        return 'max-w-sm mx-auto';
      case 'tablet':
        return 'max-w-2xl mx-auto';
      case 'desktop':
      default:
        return 'max-w-4xl mx-auto';
    }
  };

  const renderComponent = useCallback((component: BaseComponent) => {
    const componentDef = componentRegistry[component.type];
    if (!componentDef) return null;

    return (
      <div key={component.id} className="mb-4">
        {React.createElement(componentDef.render, {
          component,
          value: component.config.value || '',
          onChange: () => {}, // Preview mode - no changes
          onBlur: () => {},
          onFocus: () => {},
          error: undefined,
          disabled: false,
          readOnly: true,
          className: "w-full",
        })}
      </div>
    );
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Preview Panel */}
      <div className="absolute right-0 top-0 h-full w-3/4 bg-white dark:bg-gray-900 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-4 space-x-reverse">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              معاينة مباشرة
            </h3>
            <div className="flex items-center space-x-1 space-x-reverse">
              <button
                onClick={() => setPreviewDevice('desktop')}
                className={cn(
                  "p-2 rounded-md transition-colors",
                  previewDevice === 'desktop'
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                )}
                title="سطح المكتب"
              >
                <ComputerDesktopIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => setPreviewDevice('tablet')}
                className={cn(
                  "p-2 rounded-md transition-colors",
                  previewDevice === 'tablet'
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                )}
                title="جهاز لوحي"
              >
                <DeviceTabletIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => setPreviewDevice('mobile')}
                className={cn(
                  "p-2 rounded-md transition-colors",
                  previewDevice === 'mobile'
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                )}
                title="هاتف محمول"
              >
                <DevicePhoneMobileIcon className="h-5 w-5" />
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

        {/* Preview Content */}
        <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-800">
          <div className="p-6">
            <div className={cn(
              "bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6",
              getDeviceStyles(previewDevice)
            )}>
              {/* Form Header */}
              {form && (
                <div className="mb-6 text-center">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {form.title}
                  </h1>
                  {form.description && (
                    <p className="text-gray-600 dark:text-gray-400">
                      {form.description}
                    </p>
                  )}
                </div>
              )}

              {/* Form Components */}
              <div className="space-y-4">
                {components.length === 0 ? (
                  <div className="text-center py-12">
                    <EyeIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                      لا توجد مكونات
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      ابدأ بإضافة مكونات لرؤية المعاينة
                    </p>
                  </div>
                ) : (
                  components
                    .sort((a, b) => a.orderIndex - b.orderIndex)
                    .map(renderComponent)
                )}
              </div>

              {/* Form Actions */}
              {components.length > 0 && (
                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-end space-x-3 space-x-reverse">
                    <button
                      type="button"
                      className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                    >
                      إرسال
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealTimePreview;
