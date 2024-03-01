/**
 * Form Builder Platform - Form Canvas Component
 * Main canvas for building forms with drag & drop functionality
 */

import React, { useState, useCallback } from 'react';
import { useDrop } from 'react-dnd';
import { Form, FormComponent, ComponentType } from '../../types/form';
import { BaseComponent } from '../../types/component';
import { cn } from '../../lib/utils';
import { 
  PlusIcon, 
  EyeIcon, 
  PlayIcon, 
  DocumentArrowDownIcon as SaveIcon,
  PencilIcon,
  TrashIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  DocumentDuplicateIcon as DuplicateIcon,
} from '@heroicons/react/24/outline';
import { componentRegistry } from '../form-components/ComponentRegistry';

interface FormCanvasProps {
  form: Form | null;
  components: BaseComponent[];
  selectedComponent: BaseComponent | null;
  onComponentAdd: (component: BaseComponent) => void;
  onComponentUpdate: (componentId: string, updates: Partial<BaseComponent>) => void;
  onComponentDelete: (componentId: string) => void;
  onComponentSelect: (component: BaseComponent | null) => void;
  onComponentMove: (fromIndex: number, toIndex: number) => void;
  onSaveForm: () => void;
  onPreviewForm: () => void;
  onPublishForm: () => void;
  isPreviewMode: boolean;
  isDirty: boolean;
}

export const FormCanvas: React.FC<FormCanvasProps> = ({
  form,
  components,
  selectedComponent,
  onComponentAdd,
  onComponentUpdate,
  onComponentDelete,
  onComponentSelect,
  onComponentMove,
  onSaveForm,
  onPreviewForm,
  onPublishForm,
  isPreviewMode,
  isDirty,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  // Handle component drop
  const handleDrop = useCallback((item: { type: ComponentType; id?: string }) => {
    if (item.type && !item.id) {
      // New component from library
      const componentDef = componentRegistry[item.type];
      if (componentDef) {
        const newComponent: BaseComponent = {
          id: Math.random().toString(36).substr(2, 9),
          type: item.type,
          config: componentDef.defaultConfig,
          validation: componentDef.defaultValidation,
          orderIndex: components.length,
          isVisible: true,
          isRequired: false,
        };
        onComponentAdd(newComponent);
      }
    }
  }, [components.length, onComponentAdd]);

  // Drop target
  const [{ isOver }, drop] = useDrop({
    accept: 'component',
    drop: handleDrop,
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  // Handle component actions
  const handleComponentAction = (action: string, componentId: string) => {
    switch (action) {
      case 'duplicate':
        const component = components.find(c => c.id === componentId);
        if (component) {
          const duplicatedComponent: BaseComponent = {
            ...component,
            id: Math.random().toString(36).substr(2, 9),
            orderIndex: component.orderIndex + 1,
          };
          onComponentAdd(duplicatedComponent);
        }
        break;
      case 'delete':
        onComponentDelete(componentId);
        break;
      case 'moveUp':
        const currentIndex = components.findIndex(c => c.id === componentId);
        if (currentIndex > 0) {
          onComponentMove(currentIndex, currentIndex - 1);
        }
        break;
      case 'moveDown':
        const currentIndexDown = components.findIndex(c => c.id === componentId);
        if (currentIndexDown < components.length - 1) {
          onComponentMove(currentIndexDown, currentIndexDown + 1);
        }
        break;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 space-x-reverse">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {form ? form.title : 'نموذج جديد'}
              </h2>
              {isDirty && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  غير محفوظ
                </span>
              )}
            </div>
            <div className="flex items-center space-x-3 space-x-reverse">
              <button
                onClick={onSaveForm}
                disabled={!isDirty}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                <SaveIcon className="h-4 w-4 ml-2" />
                حفظ
              </button>
              <button
                onClick={onPreviewForm}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                <EyeIcon className="h-4 w-4 ml-2" />
                معاينة
              </button>
              <button
                onClick={onPublishForm}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PlayIcon className="h-4 w-4 ml-2" />
                نشر
              </button>
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
          <div className="max-w-4xl mx-auto p-6">
            <div
              ref={drop}
              className={cn(
                "min-h-96 bg-white dark:bg-gray-800 rounded-lg shadow-sm border-2 border-dashed transition-colors",
                isOver ? "border-blue-400 bg-blue-50 dark:bg-blue-900" : "border-gray-300 dark:border-gray-600",
                isPreviewMode && "border-solid border-gray-200 dark:border-gray-700"
              )}
            >
              {components.length === 0 ? (
                <EmptyCanvas />
              ) : (
                <div className="p-6 space-y-4">
                  {components
                    .sort((a, b) => a.orderIndex - b.orderIndex)
                    .map((component, index) => (
                      <ComponentWrapper
                        key={component.id}
                        component={component}
                        isSelected={selectedComponent?.id === component.id}
                        isPreviewMode={isPreviewMode}
                        onSelect={() => onComponentSelect(component)}
                        onUpdate={(updates) => onComponentUpdate(component.id, updates)}
                        onAction={(action) => handleComponentAction(action, component.id)}
                        canMoveUp={index > 0}
                        canMoveDown={index < components.length - 1}
                      />
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
  );
};

// Empty Canvas Component
const EmptyCanvas: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-96 text-center">
      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
        <PlusIcon className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
        ابدأ ببناء نموذجك
      </h3>
      <p className="text-gray-500 dark:text-gray-400 mb-4">
        اسحب المكونات من المكتبة إلى هنا لبدء إنشاء النموذج
      </p>
      <div className="text-sm text-gray-400">
        أو اختر قالباً جاهزاً للبدء السريع
      </div>
    </div>
  );
};

// Component Wrapper
interface ComponentWrapperProps {
  component: BaseComponent;
  isSelected: boolean;
  isPreviewMode: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<BaseComponent>) => void;
  onAction: (action: string) => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

const ComponentWrapper: React.FC<ComponentWrapperProps> = ({
  component,
  isSelected,
  isPreviewMode,
  onSelect,
  onUpdate,
  onAction,
  canMoveUp,
  canMoveDown,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const componentDef = componentRegistry[component.type];
  if (!componentDef) return null;

  const handleValueChange = (value: any) => {
    onUpdate({ config: { ...component.config, value } });
  };

  return (
    <div
      className={cn(
        "relative group border-2 rounded-lg transition-all",
        isSelected 
          ? "border-blue-500 bg-blue-50 dark:bg-blue-900" 
          : "border-transparent hover:border-gray-300 dark:hover:border-gray-600",
        isPreviewMode && "border-transparent"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Component Actions (only in edit mode) */}
      {!isPreviewMode && (isSelected || isHovered) && (
        <div className="absolute -top-2 -right-2 z-10 flex items-center space-x-1 space-x-reverse">
          <button
            onClick={() => onAction('moveUp')}
            disabled={!canMoveUp}
            className="p-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            title="نقل لأعلى"
          >
            <ArrowUpIcon className="h-3 w-3 text-gray-600 dark:text-gray-400" />
          </button>
          <button
            onClick={() => onAction('moveDown')}
            disabled={!canMoveDown}
            className="p-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            title="نقل لأسفل"
          >
            <ArrowDownIcon className="h-3 w-3 text-gray-600 dark:text-gray-400" />
          </button>
          <button
            onClick={() => onAction('duplicate')}
            className="p-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700"
            title="نسخ"
          >
            <DuplicateIcon className="h-3 w-3 text-gray-600 dark:text-gray-400" />
          </button>
          <button
            onClick={() => onAction('delete')}
            className="p-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded shadow-sm hover:bg-red-50 dark:hover:bg-red-900"
            title="حذف"
          >
            <TrashIcon className="h-3 w-3 text-red-600 dark:text-red-400" />
          </button>
        </div>
      )}

      {/* Component Content */}
      <div
        onClick={!isPreviewMode ? onSelect : undefined}
        className={cn(
          "p-4 cursor-pointer",
          !isPreviewMode && "hover:bg-gray-50 dark:hover:bg-gray-700"
        )}
      >
        {React.createElement(componentDef.render, {
          component,
          value: component.config.value || '',
          onChange: handleValueChange,
          onBlur: () => {},
          onFocus: () => {},
          error: undefined,
          disabled: false,
          readOnly: isPreviewMode,
          className: "w-full",
        })}
      </div>

      {/* Component Label (in edit mode) */}
      {!isPreviewMode && (
        <div className="absolute -bottom-1 -right-1 px-2 py-1 bg-blue-600 text-white text-xs rounded">
          {componentDef.name}
        </div>
      )}
    </div>
  );
};

export default FormCanvas;
