/**
 * Form Builder Platform - Responsive Controls Component
 * Responsive design controls for form components
 */

import React, { useState, useCallback } from 'react';
import { BaseComponent } from '../../types/component';
import { cn } from '../../lib/utils';
import { 
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  DeviceTabletIcon,
  EyeIcon,
  CodeBracketIcon,
} from '@heroicons/react/24/outline';

interface ResponsiveControlsProps {
  component: BaseComponent;
  onStyleUpdate: (updates: Partial<BaseComponent['style']>) => void;
  className?: string;
}

type ResponsiveBreakpoint = 'mobile' | 'tablet' | 'desktop';

export const ResponsiveControls: React.FC<ResponsiveControlsProps> = ({
  component,
  onStyleUpdate,
  className,
}) => {
  const [activeBreakpoint, setActiveBreakpoint] = useState<ResponsiveBreakpoint>('desktop');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const breakpoints = [
    { id: 'mobile', label: 'هاتف', icon: DevicePhoneMobileIcon, width: '375px' },
    { id: 'tablet', label: 'جهاز لوحي', icon: DeviceTabletIcon, width: '768px' },
    { id: 'desktop', label: 'سطح المكتب', icon: ComputerDesktopIcon, width: '1200px' },
  ];

  const handleStyleChange = useCallback((path: string, value: any) => {
    const updates = { ...component.style };
    const keys = path.split('.');
    let current = updates;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
    onStyleUpdate(updates);
  }, [component.style, onStyleUpdate]);

  const getResponsiveValue = (path: string) => {
    const keys = path.split('.');
    let current = component.style;
    
    for (const key of keys) {
      if (!current || !current[key]) return '';
      current = current[key];
    }
    
    if (typeof current === 'object' && current[activeBreakpoint]) {
      return current[activeBreakpoint];
    }
    
    return typeof current === 'string' ? current : '';
  };

  const setResponsiveValue = (path: string, value: any) => {
    const keys = path.split('.');
    const updates = { ...component.style };
    let current = updates;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }
    
    const lastKey = keys[keys.length - 1];
    if (!current[lastKey]) current[lastKey] = {};
    current[lastKey][activeBreakpoint] = value;
    
    onStyleUpdate(updates);
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Breakpoint Selector */}
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

      {/* Layout Controls */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">التخطيط</h4>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              العرض
            </label>
            <input
              type="text"
              value={getResponsiveValue('layout.width')}
              onChange={(e) => setResponsiveValue('layout.width', e.target.value)}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
              placeholder="100%"
            />
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              الارتفاع
            </label>
            <input
              type="text"
              value={getResponsiveValue('layout.height')}
              onChange={(e) => setResponsiveValue('layout.height', e.target.value)}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
              placeholder="auto"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              الحشو
            </label>
            <input
              type="text"
              value={getResponsiveValue('layout.padding')}
              onChange={(e) => setResponsiveValue('layout.padding', e.target.value)}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
              placeholder="8px"
            />
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              الهوامش
            </label>
            <input
              type="text"
              value={getResponsiveValue('layout.margin')}
              onChange={(e) => setResponsiveValue('layout.margin', e.target.value)}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
              placeholder="0"
            />
          </div>
        </div>
      </div>

      {/* Typography Controls */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">الخط</h4>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              حجم الخط
            </label>
            <input
              type="text"
              value={getResponsiveValue('typography.fontSize')}
              onChange={(e) => setResponsiveValue('typography.fontSize', e.target.value)}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
              placeholder="14px"
            />
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              وزن الخط
            </label>
            <select
              value={getResponsiveValue('typography.fontWeight')}
              onChange={(e) => setResponsiveValue('typography.fontWeight', e.target.value)}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="300">خفيف</option>
              <option value="400">عادي</option>
              <option value="500">متوسط</option>
              <option value="600">نصفي غامق</option>
              <option value="700">غامق</option>
            </select>
          </div>
        </div>
      </div>

      {/* Advanced Controls Toggle */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center space-x-2 space-x-reverse text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <CodeBracketIcon className="h-4 w-4" />
          <span>إعدادات متقدمة</span>
        </button>
      </div>

      {/* Advanced Controls */}
      {showAdvanced && (
        <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                الحدود
              </label>
              <input
                type="text"
                value={getResponsiveValue('layout.border')}
                onChange={(e) => setResponsiveValue('layout.border', e.target.value)}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                placeholder="1px solid #ccc"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                نصف القطر
              </label>
              <input
                type="text"
                value={getResponsiveValue('layout.borderRadius')}
                onChange={(e) => setResponsiveValue('layout.borderRadius', e.target.value)}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                placeholder="4px"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                الظل
              </label>
              <input
                type="text"
                value={getResponsiveValue('layout.boxShadow')}
                onChange={(e) => setResponsiveValue('layout.boxShadow', e.target.value)}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                placeholder="0 2px 4px rgba(0,0,0,0.1)"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                الموضع
              </label>
              <select
                value={getResponsiveValue('layout.position')}
                onChange={(e) => setResponsiveValue('layout.position', e.target.value)}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="static">عادي</option>
                <option value="relative">نسبي</option>
                <option value="absolute">مطلق</option>
                <option value="fixed">ثابت</option>
                <option value="sticky">لاصق</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResponsiveControls;
