/**
 * Template Selector Component
 * Allows users to select from pre-built form templates
 */

import React, { useState } from 'react';
import { FormTemplate, getTemplatesByCategory, searchTemplates } from '../../lib/formTemplates';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  DocumentTextIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { cn } from '../../lib/utils';

interface TemplateSelectorProps {
  onTemplateSelect: (template: FormTemplate) => void;
  onClose: () => void;
  className?: string;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  onTemplateSelect,
  onClose,
  className,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<FormTemplate | null>(null);

  const categories = [
    { id: 'all', name: 'جميع القوالب', icon: '📋' },
    { id: 'citizen', name: 'المواطن', icon: '👤' },
    { id: 'business', name: 'الأعمال', icon: '🏢' },
    { id: 'complaint', name: 'الشكاوى', icon: '📝' },
    { id: 'application', name: 'الطلبات', icon: '🔧' },
    { id: 'survey', name: 'الاستطلاعات', icon: '📊' },
  ];

  // Get filtered templates
  const getFilteredTemplates = (): FormTemplate[] => {
    let templates = selectedCategory === 'all' 
      ? searchTemplates(searchQuery)
      : getTemplatesByCategory(selectedCategory);

    if (searchQuery) {
      templates = templates.filter(template =>
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    return templates;
  };

  const handleTemplateSelect = (template: FormTemplate) => {
    setSelectedTemplate(template);
  };

  const handleConfirmSelection = () => {
    if (selectedTemplate) {
      onTemplateSelect(selectedTemplate);
      onClose();
    }
  };

  const filteredTemplates = getFilteredTemplates();

  return (
    <div className={cn("fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50", className)}>
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">اختر قالب النموذج</h2>
              <p className="text-gray-600">اختر من القوالب الجاهزة أو ابدأ من الصفر</p>
            </div>
            <Button variant="outline" onClick={onClose}>
              إغلاق
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex space-x-4 space-x-reverse">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="البحث في القوالب..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
            <div className="flex space-x-2 space-x-reverse">
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                  className="flex items-center space-x-2 space-x-reverse"
                >
                  <span>{category.icon}</span>
                  <span>{category.name}</span>
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Templates Grid */}
        <div className="p-6 overflow-y-auto max-h-96">
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-12">
              <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد قوالب</h3>
              <p className="text-gray-600">لم يتم العثور على قوالب تطابق البحث</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map((template) => (
                <Card
                  key={template.id}
                  className={cn(
                    "cursor-pointer transition-all duration-200 hover:shadow-lg",
                    selectedTemplate?.id === template.id 
                      ? "ring-2 ring-blue-500 bg-blue-50" 
                      : "hover:shadow-md"
                  )}
                  onClick={() => handleTemplateSelect(template)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <span className="text-2xl">{template.icon}</span>
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                      </div>
                      {selectedTemplate?.id === template.id && (
                        <CheckCircleIcon className="h-5 w-5 text-blue-600" />
                      )}
                    </div>
                    <CardDescription className="text-sm text-gray-600">
                      {template.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div>
                        <Badge variant="outline" className="text-xs">
                          {template.category}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {template.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {template.tags.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{template.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        {template.components.length} مكون
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {selectedTemplate ? (
                <span>تم اختيار: <strong>{selectedTemplate.name}</strong></span>
              ) : (
                <span>اختر قالباً للبدء</span>
              )}
            </div>
            <div className="flex space-x-2 space-x-reverse">
              <Button variant="outline" onClick={onClose}>
                إلغاء
              </Button>
              <Button
                onClick={handleConfirmSelection}
                disabled={!selectedTemplate}
                className="bg-blue-600 hover:bg-blue-700"
              >
                استخدام القالب
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};