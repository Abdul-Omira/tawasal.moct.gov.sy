/**
 * Form Export/Import Component
 * Provides UI for exporting and importing forms
 */

import React, { useState, useRef } from 'react';
import { Form } from '../../types/form';
import { BaseComponent } from '../../types/component';
import { useFormExportImport } from '../../lib/formExportImport';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  DocumentDuplicateIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { cn } from '../../lib/utils';

interface FormExportImportProps {
  form: Form;
  components: BaseComponent[];
  onImport: (form: Form, components: BaseComponent[]) => void;
  onClose: () => void;
  className?: string;
}

export const FormExportImport: React.FC<FormExportImportProps> = ({
  form,
  components,
  onImport,
  onClose,
  className,
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    exportFormToFile,
    importFormFromFile,
    exportAsTemplate,
    validateFile,
    getSupportedFileTypes,
  } = useFormExportImport();

  // Handle export form
  const handleExportForm = async () => {
    setIsExporting(true);
    try {
      await exportFormToFile(form, components, 'admin', `${form.title}_form.json`);
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  // Handle export as template
  const handleExportAsTemplate = async () => {
    setIsExporting(true);
    try {
      const templateData = exportAsTemplate(form, components, 'admin');
      const blob = new Blob([templateData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${form.title}_template.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Template export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  // Handle file selection
  const handleFileSelect = async (file: File) => {
    setIsImporting(true);
    setImportResult(null);

    try {
      // Validate file
      const validation = validateFile(file);
      if (!validation.typeValid) {
        setImportResult({
          success: false,
          errors: [`نوع الملف غير مدعوم. الأنواع المدعومة: ${getSupportedFileTypes().join(', ')}`],
        });
        return;
      }

      if (!validation.sizeValid) {
        setImportResult({
          success: false,
          errors: ['حجم الملف كبير جداً. الحد الأقصى 10 ميجابايت'],
        });
        return;
      }

      // Import form
      const result = await importFormFromFile(file, 'admin');
      setImportResult(result);

      if (result.success && result.form && result.components) {
        // Auto-import after a short delay to show success message
        setTimeout(() => {
          onImport(result.form!, result.components!);
          onClose();
        }, 2000);
      }
    } catch (error) {
      setImportResult({
        success: false,
        errors: [`خطأ في استيراد الملف: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`],
      });
    } finally {
      setIsImporting(false);
    }
  };

  // Handle drag and drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  // Handle browse files
  const handleBrowseFiles = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={cn("fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50", className)}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                تصدير/استيراد النموذج
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                تصدير النموذج الحالي أو استيراد نموذج من ملف
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

        {/* Tabs */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex space-x-1 space-x-reverse">
            <button
              onClick={() => setActiveTab('export')}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-md transition-colors",
                activeTab === 'export'
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              )}
            >
              تصدير
            </button>
            <button
              onClick={() => setActiveTab('import')}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-md transition-colors",
                activeTab === 'import'
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              )}
            >
              استيراد
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4 overflow-y-auto max-h-[calc(90vh-200px)]">
          {activeTab === 'export' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 space-x-reverse">
                    <ArrowDownTrayIcon className="h-5 w-5" />
                    <span>تصدير النموذج</span>
                  </CardTitle>
                  <CardDescription>
                    تصدير النموذج الحالي مع جميع مكوناته إلى ملف JSON
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Button
                      onClick={handleExportForm}
                      disabled={isExporting}
                      className="flex items-center space-x-2 space-x-reverse"
                    >
                      <ArrowDownTrayIcon className="h-4 w-4" />
                      <span>{isExporting ? 'جاري التصدير...' : 'تصدير النموذج'}</span>
                    </Button>
                    <Button
                      onClick={handleExportAsTemplate}
                      disabled={isExporting}
                      variant="outline"
                      className="flex items-center space-x-2 space-x-reverse"
                    >
                      <DocumentDuplicateIcon className="h-4 w-4" />
                      <span>{isExporting ? 'جاري التصدير...' : 'تصدير كقالب'}</span>
                    </Button>
                  </div>
                  <div className="text-sm text-gray-500">
                    <p>• تصدير النموذج: يحفظ النموذج مع جميع البيانات</p>
                    <p>• تصدير كقالب: يحفظ النموذج كقالب قابل للاستخدام</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'import' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 space-x-reverse">
                    <ArrowUpTrayIcon className="h-5 w-5" />
                    <span>استيراد النموذج</span>
                  </CardTitle>
                  <CardDescription>
                    استيراد نموذج من ملف JSON
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div
                    className={cn(
                      "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                      dragActive
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "border-gray-300 dark:border-gray-600"
                    )}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <ArrowUpTrayIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="mt-4">
                      <p className="text-lg font-medium text-gray-900 dark:text-white">
                        اسحب الملف هنا أو اضغط للتصفح
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        الأنواع المدعومة: {getSupportedFileTypes().join(', ')}
                      </p>
                    </div>
                    <Button
                      onClick={handleBrowseFiles}
                      disabled={isImporting}
                      className="mt-4"
                    >
                      {isImporting ? 'جاري الاستيراد...' : 'تصفح الملفات'}
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json"
                      onChange={handleFileInputChange}
                      className="hidden"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Import Result */}
              {importResult && (
                <Alert className={importResult.success ? "border-green-200 bg-green-50 dark:bg-green-900/20" : "border-red-200 bg-red-50 dark:bg-red-900/20"}>
                  <div className="flex items-start">
                    {importResult.success ? (
                      <CheckCircleIcon className="h-5 w-5 text-green-400 ml-2" />
                    ) : (
                      <ExclamationTriangleIcon className="h-5 w-5 text-red-400 ml-2" />
                    )}
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                        {importResult.success ? 'تم الاستيراد بنجاح' : 'فشل في الاستيراد'}
                      </h3>
                      {importResult.errors && importResult.errors.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm text-red-700 dark:text-red-300">الأخطاء:</p>
                          <ul className="list-disc list-inside text-sm text-red-700 dark:text-red-300">
                            {importResult.errors.map((error: string, index: number) => (
                              <li key={index}>{error}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {importResult.warnings && importResult.warnings.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm text-yellow-700 dark:text-yellow-300">تحذيرات:</p>
                          <ul className="list-disc list-inside text-sm text-yellow-700 dark:text-yellow-300">
                            {importResult.warnings.map((warning: string, index: number) => (
                              <li key={index}>{warning}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {importResult.success && (
                        <p className="text-sm text-green-700 dark:text-green-300 mt-2">
                          سيتم استيراد النموذج تلقائياً...
                        </p>
                      )}
                    </div>
                  </div>
                </Alert>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FormExportImport;
