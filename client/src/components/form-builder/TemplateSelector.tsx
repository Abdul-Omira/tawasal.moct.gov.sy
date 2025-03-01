/**
 * Form Builder Platform - Template Selector
 * Interface for selecting and customizing form templates
 */

import React, { useState, useEffect } from 'react';
import { FormTemplate, allTemplates, templateCategories, searchTemplates } from '../../lib/templates';
import { cn } from '../../lib/utils';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  DocumentDuplicateIcon,
  CheckCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface TemplateSelectorProps {
  onTemplateSelect: (template: FormTemplate) => void;
  onClose: () => void;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  onTemplateSelect,
  onClose,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<FormTemplate | null>(null);
  const [filteredTemplates, setFilteredTemplates] = useState<FormTemplate[]>(allTemplates);

  // Filter templates based on category and search
  useEffect(() => {
    let templates = allTemplates;

    // Filter by category
    if (selectedCategory !== 'all') {
      templates = templates.filter(template => template.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      templates = searchTemplates(searchQuery);
    }

    setFilteredTemplates(templates);
  }, [selectedCategory, searchQuery]);

  // Handle template selection
  const handleTemplateSelect = (template: FormTemplate) => {
    setSelectedTemplate(template);
  };

  // Handle template confirmation
  const handleConfirmTemplate = () => {
    if (selectedTemplate) {
      onTemplateSelect(selectedTemplate);
    }
  };

  // Get category icon
  const getCategoryIcon = (categoryId: string) => {
    const category = templateCategories.find(cat => cat.id === categoryId);
    return category ? category.icon : '📄';
  };

  // Get category name
  const getCategoryName = (categoryId: string) => {
    const category = templateCategories.find(cat => cat.id === categoryId);
    return category ? category.name : categoryId;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                اختيار قالب النموذج
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                اختر من القوالب الجاهزة لبدء إنشاء نموذجك بسرعة
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

        {/* Search and Filters */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="البحث في القوالب..."
                  className="w-full pr-10 pl-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="sm:w-64">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="all">جميع الفئات</option>
                {templateCategories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.icon} {category.name} ({category.count})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex h-96">
          {/* Templates List */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredTemplates.map(template => (
                <div
                  key={template.id}
                  onClick={() => handleTemplateSelect(template)}
                  className={cn(
                    "border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md",
                    selectedTemplate?.id === template.id
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 space-x-reverse mb-2">
                        <span className="text-2xl">{template.icon}</span>
                        <div>
                          <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                            {template.name}
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {getCategoryName(template.category)}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                        {template.description}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {template.tags.slice(0, 3).map(tag => (
                          <span
                            key={tag}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                          >
                            {tag}
                          </span>
                        ))}
                        {template.tags.length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{template.tags.length - 3} أكثر
                          </span>
                        )}
                      </div>
                    </div>
                    {selectedTemplate?.id === template.id && (
                      <CheckCircleIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            {filteredTemplates.length === 0 && (
              <div className="text-center py-12">
                <FunnelIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                  لا توجد قوالب
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  جرب البحث بكلمات مختلفة أو اختر فئة أخرى
                </p>
              </div>
            )}
          </div>

          {/* Template Preview */}
          {selectedTemplate && (
            <div className="w-96 border-l border-gray-200 dark:border-gray-700 p-6 overflow-y-auto">
              <div className="sticky top-0">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  معاينة القالب
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {selectedTemplate.name}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedTemplate.description}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      المكونات ({selectedTemplate.components.length})
                    </h4>
                    <div className="space-y-2">
                      {selectedTemplate.components.map((component, index) => (
                        <div
                          key={component.id}
                          className="flex items-center space-x-2 space-x-reverse text-sm text-gray-600 dark:text-gray-400"
                        >
                          <span className="w-6 h-6 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center text-xs">
                            {index + 1}
                          </span>
                          <span>{component.config.label}</span>
                          {component.isRequired && (
                            <span className="text-red-500 text-xs">*</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      الإعدادات
                    </h4>
                    <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex justify-between">
                        <span>حفظ المسودة:</span>
                        <span>{selectedTemplate.settings.allowSaveProgress ? 'نعم' : 'لا'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>شريط التقدم:</span>
                        <span>{selectedTemplate.settings.showProgress ? 'نعم' : 'لا'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>يتطلب تسجيل دخول:</span>
                        <span>{selectedTemplate.settings.requireAuthentication ? 'نعم' : 'لا'}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      العلامات
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {selectedTemplate.tags.map(tag => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {filteredTemplates.length} قالب متاح
          </div>
          <div className="flex items-center space-x-3 space-x-reverse">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              إلغاء
            </button>
            <button
              onClick={handleConfirmTemplate}
              disabled={!selectedTemplate}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <DocumentDuplicateIcon className="h-4 w-4 ml-2" />
              استخدام القالب
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateSelector;
