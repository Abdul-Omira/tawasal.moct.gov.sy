import React, { useState } from 'react';
import { XMarkIcon, EyeIcon, CheckIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FormTemplate } from '@/types/form';
import { FormRenderer } from '../form-renderer/FormRenderer';

interface TemplatePreviewProps {
  template: FormTemplate | null;
  onClose: () => void;
  onUseTemplate: (template: FormTemplate) => void;
  onExportTemplate: (template: FormTemplate) => void;
}

export const TemplatePreview: React.FC<TemplatePreviewProps> = ({
  template,
  onClose,
  onUseTemplate,
  onExportTemplate
}) => {
  const [previewMode, setPreviewMode] = useState<'info' | 'preview'>('info');

  if (!template) return null;

  const { form, components } = template.templateData;

  const handleUseTemplate = () => {
    onUseTemplate(template);
    onClose();
  };

  const handleExportTemplate = () => {
    onExportTemplate(template);
  };

  const getCategoryColor = (category: string): string => {
    const colors = {
      survey: 'bg-blue-100 text-blue-800',
      application: 'bg-green-100 text-green-800',
      feedback: 'bg-yellow-100 text-yellow-800',
      registration: 'bg-purple-100 text-purple-800',
      contact: 'bg-gray-100 text-gray-800'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getCategoryIcon = (category: string): string => {
    const icons = {
      survey: '📊',
      application: '📝',
      feedback: '💬',
      registration: '📋',
      contact: '📞'
    };
    return icons[category as keyof typeof icons] || '📄';
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      <div className="absolute right-0 top-0 h-full w-full max-w-6xl bg-white dark:bg-gray-900 shadow-xl">
        <div className="flex h-full">
          {/* Sidebar */}
          <div className="w-80 bg-gray-50 dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  معلومات القالب
                </h3>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              <Card className="mb-6">
                <CardHeader>
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <span className="text-3xl">{getCategoryIcon(template.category)}</span>
                    <div>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <CardDescription>{template.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">التصنيف:</span>
                      <Badge className={getCategoryColor(template.category)}>
                        {template.category}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">النوع:</span>
                      <span className="text-sm font-medium">
                        {template.isPublic ? 'عام' : 'خاص'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">أنشئ في:</span>
                      <span className="text-sm font-medium">
                        {template.createdAt.toLocaleDateString('ar-SA')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">المكونات:</span>
                      <span className="text-sm font-medium">{components.length}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-3">
                <Button
                  onClick={() => setPreviewMode('preview')}
                  className="w-full flex items-center space-x-2 space-x-reverse"
                >
                  <EyeIcon className="h-4 w-4" />
                  <span>معاينة النموذج</span>
                </Button>
                
                <Button
                  onClick={handleUseTemplate}
                  className="w-full flex items-center space-x-2 space-x-reverse"
                >
                  <CheckIcon className="h-4 w-4" />
                  <span>استخدام القالب</span>
                </Button>
                
                <Button
                  variant="outline"
                  onClick={handleExportTemplate}
                  className="w-full"
                >
                  تصدير القالب
                </Button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 space-x-reverse">
                  {previewMode === 'preview' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPreviewMode('info')}
                      className="flex items-center space-x-2 space-x-reverse"
                    >
                      <ArrowLeftIcon className="h-4 w-4" />
                      <span>العودة</span>
                    </Button>
                  )}
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {previewMode === 'info' ? 'تفاصيل القالب' : 'معاينة النموذج'}
                  </h2>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Button
                    variant="outline"
                    onClick={handleExportTemplate}
                  >
                    تصدير
                  </Button>
                  <Button onClick={handleUseTemplate}>
                    استخدام القالب
                  </Button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto">
              {previewMode === 'info' ? (
                <div className="p-6">
                  <div className="space-y-6">
                    {/* Form Settings */}
                    <Card>
                      <CardHeader>
                        <CardTitle>إعدادات النموذج</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              عنوان النموذج
                            </label>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {form.title}
                            </p>
                          </div>
                          {form.description && (
                            <div>
                              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                وصف النموذج
                              </label>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {form.description}
                              </p>
                            </div>
                          )}
                          <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              حالة النموذج
                            </label>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {form.status}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Components List */}
                    <Card>
                      <CardHeader>
                        <CardTitle>مكونات النموذج ({components.length})</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {components.map((component, index) => (
                            <div
                              key={component.id}
                              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                            >
                              <div className="flex items-center space-x-3 space-x-reverse">
                                <span className="text-sm font-medium text-gray-500">
                                  {index + 1}
                                </span>
                                <div>
                                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    {component.config.label || component.type}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {component.type}
                                    {component.isRequired && (
                                      <span className="text-red-500 mr-1">*</span>
                                    )}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2 space-x-reverse">
                                {component.isRequired && (
                                  <Badge variant="destructive" className="text-xs">
                                    مطلوب
                                  </Badge>
                                )}
                                <Badge variant="outline" className="text-xs">
                                  {component.type}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Theme Settings */}
                    {form.settings.theme && (
                      <Card>
                        <CardHeader>
                          <CardTitle>إعدادات التصميم</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                  اللون الأساسي
                                </label>
                                <div className="flex items-center space-x-2 space-x-reverse mt-1">
                                  <div
                                    className="w-6 h-6 rounded border"
                                    style={{ backgroundColor: form.settings.theme.primaryColor }}
                                  />
                                  <span className="text-sm text-gray-600 dark:text-gray-400">
                                    {form.settings.theme.primaryColor}
                                  </span>
                                </div>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                  اللون الثانوي
                                </label>
                                <div className="flex items-center space-x-2 space-x-reverse mt-1">
                                  <div
                                    className="w-6 h-6 rounded border"
                                    style={{ backgroundColor: form.settings.theme.secondaryColor }}
                                  />
                                  <span className="text-sm text-gray-600 dark:text-gray-400">
                                    {form.settings.theme.secondaryColor}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                خط النص
                              </label>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {form.settings.theme.fontFamily}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-6">
                  <FormRenderer
                    form={form}
                    components={components}
                    onSubmit={async () => {
                      // Preview mode - no actual submission
                      console.log('Preview mode - form submitted');
                    }}
                    isPreview={true}
                    showProgress={true}
                    multiStep={components.some(c => c.type === 'step')}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
