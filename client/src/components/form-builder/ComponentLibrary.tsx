/**
 * Form Builder Platform - Component Library
 * Drag & drop component library for form building
 */

import React, { useState, useCallback } from 'react';
import { useDrag } from 'react-dnd';
import { ComponentType, ComponentCategory } from '../../types/component';
import { componentRegistry, getComponentsByCategory, getComponentCategories } from '../form-components/ComponentRegistry';
import { cn } from '../../lib/utils';
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  PhotoIcon,
  CalendarIcon,
  StarIcon,
  DocumentIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';

interface ComponentLibraryProps {
  onComponentDrag: (componentType: ComponentType) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: ComponentCategory | 'all';
  onCategoryChange: (category: ComponentCategory | 'all') => void;
}

export const ComponentLibrary: React.FC<ComponentLibraryProps> = ({
  onComponentDrag,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  // Get filtered components
  const categories = getComponentCategories();
  const filteredComponents = selectedCategory === 'all' 
    ? Object.values(componentRegistry)
    : getComponentsByCategory(selectedCategory);

  const searchFilteredComponents = filteredComponents.filter(component =>
    component.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    component.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            مكتبة المكونات
          </h3>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <FunnelIcon className={cn("h-5 w-5 transition-transform", isExpanded && "rotate-180")} />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="البحث في المكونات..."
            className="w-full pr-10 pl-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>
      </div>

      {/* Categories */}
      {isExpanded && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            الفئات
          </h4>
          <div className="space-y-1">
            <button
              onClick={() => onCategoryChange('all')}
              className={cn(
                "w-full text-right px-3 py-2 text-sm rounded-md transition-colors",
                selectedCategory === 'all'
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                  : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              )}
            >
              جميع المكونات
            </button>
            {categories.map(category => (
              <button
                key={category}
                onClick={() => onCategoryChange(category)}
                className={cn(
                  "w-full text-right px-3 py-2 text-sm rounded-md transition-colors flex items-center",
                  selectedCategory === category
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                    : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                )}
              >
                <CategoryIcon category={category} className="h-4 w-4 ml-2" />
                {getCategoryLabel(category)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Components List */}
      <div className="flex-1 overflow-auto p-4">
        <div className="space-y-2">
          {searchFilteredComponents.length === 0 ? (
            <div className="text-center py-8">
              <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                لا توجد مكونات
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                جرب البحث بكلمات مختلفة
              </p>
            </div>
          ) : (
            searchFilteredComponents.map(component => (
              <DraggableComponent
                key={component.type}
                component={component}
                onDrag={onComponentDrag}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// Draggable Component Item
interface DraggableComponentProps {
  component: any;
  onDrag: (componentType: ComponentType) => void;
}

const DraggableComponent: React.FC<DraggableComponentProps> = ({ component, onDrag }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'component',
    item: { type: component.type },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <div
      ref={drag}
      className={cn(
        "p-3 border border-gray-200 dark:border-gray-600 rounded-lg cursor-move hover:shadow-md transition-all",
        isDragging && "opacity-50"
      )}
    >
      <div className="flex items-center space-x-3 space-x-reverse">
        <div className="text-2xl">{component.icon}</div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
            {component.name}
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
            {component.description}
          </p>
        </div>
      </div>
    </div>
  );
};

// Category Icon Component
interface CategoryIconProps {
  category: ComponentCategory;
  className?: string;
}

const CategoryIcon: React.FC<CategoryIconProps> = ({ category, className }) => {
  const iconMap = {
    input: DocumentTextIcon,
    selection: CheckCircleIcon,
    file: PhotoIcon,
    date: CalendarIcon,
    rating: StarIcon,
    layout: DocumentIcon,
    logic: Cog6ToothIcon,
  };

  const Icon = iconMap[category] || DocumentTextIcon;
  return <Icon className={className} />;
};

// Get category label in Arabic
const getCategoryLabel = (category: ComponentCategory): string => {
  const labels = {
    input: 'الإدخال',
    selection: 'الاختيار',
    file: 'الملفات',
    date: 'التاريخ والوقت',
    rating: 'التقييم',
    layout: 'التخطيط',
    logic: 'المنطق',
  };
  return labels[category] || category;
};

export default ComponentLibrary;
