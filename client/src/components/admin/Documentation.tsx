/**
 * Form Builder Platform - Documentation Component
 * Comprehensive documentation for developers and API
 */

import React, { useState } from 'react';
import { cn } from '../../lib/utils';
import {
  BookOpenIcon,
  CodeBracketIcon,
  CommandLineIcon,
  DocumentTextIcon,
  LinkIcon,
  ClipboardDocumentIcon,
  ChevronRightIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';

interface DocumentationProps {
  onCopyCode: (code: string) => void;
}

export const Documentation: React.FC<DocumentationProps> = ({ onCopyCode }) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['getting-started']));

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const copyToClipboard = (code: string) => {
    onCopyCode(code);
  };

  const sections = [
    {
      id: 'getting-started',
      title: 'البدء السريع',
      icon: BookOpenIcon,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
              نظرة عامة على النظام
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              منصة بناء النماذج الديناميكية هي نظام شامل لإنشاء وإدارة النماذج الرقمية 
              للحكومة والمواطنين والشركات. يدعم النظام أنواع مختلفة من المكونات 
              والتحقق من صحة البيانات والتحليلات المتقدمة.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
              الميزات الرئيسية
            </h3>
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
              <li>بناء النماذج بالـ Drag & Drop</li>
              <li>مكتبة مكونات قابلة للتخصيص</li>
              <li>التحقق من صحة البيانات المتقدم</li>
              <li>المنطق الشرطي للمكونات</li>
              <li>التحليلات والتقارير</li>
              <li>دعم RTL واللغة العربية</li>
              <li>واجهة إدارة شاملة</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
              متطلبات النظام
            </h3>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <ul className="space-y-2 text-sm">
                <li><strong>Node.js:</strong> 18.0.0 أو أحدث</li>
                <li><strong>npm:</strong> 8.0.0 أو أحدث</li>
                <li><strong>TypeScript:</strong> 5.0.0 أو أحدث</li>
                <li><strong>React:</strong> 18.0.0 أو أحدث</li>
                <li><strong>SQLite:</strong> 3.0.0 أو أحدث</li>
              </ul>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'installation',
      title: 'التثبيت والإعداد',
      icon: CommandLineIcon,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
              تثبيت التبعيات
            </h3>
            <div className="bg-gray-900 rounded-lg p-4 text-white font-mono text-sm">
              <div className="flex justify-between items-center mb-2">
                <span>npm install</span>
                <button
                  onClick={() => copyToClipboard('npm install')}
                  className="text-gray-400 hover:text-white"
                >
                  <ClipboardDocumentIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
              إعداد قاعدة البيانات
            </h3>
            <div className="bg-gray-900 rounded-lg p-4 text-white font-mono text-sm">
              <div className="flex justify-between items-center mb-2">
                <span>npm run setup:db</span>
                <button
                  onClick={() => copyToClipboard('npm run setup:db')}
                  className="text-gray-400 hover:text-white"
                >
                  <ClipboardDocumentIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
              تشغيل الخادم
            </h3>
            <div className="bg-gray-900 rounded-lg p-4 text-white font-mono text-sm">
              <div className="flex justify-between items-center mb-2">
                <span>npm run dev:local</span>
                <button
                  onClick={() => copyToClipboard('npm run dev:local')}
                  className="text-gray-400 hover:text-white"
                >
                  <ClipboardDocumentIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'api-documentation',
      title: 'وثائق API',
      icon: CodeBracketIcon,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
              إنشاء نموذج جديد
            </h3>
            <div className="bg-gray-900 rounded-lg p-4 text-white font-mono text-sm">
              <div className="flex justify-between items-center mb-2">
                <span>POST /api/forms</span>
                <button
                  onClick={() => copyToClipboard('POST /api/forms')}
                  className="text-gray-400 hover:text-white"
                >
                  <ClipboardDocumentIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="mt-2 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <pre className="text-sm text-gray-800 dark:text-gray-200">
{`{
  "title": "نموذج جديد",
  "description": "وصف النموذج",
  "status": "draft",
  "components": [
    {
      "type": "TextInput",
      "label": "الاسم",
      "isRequired": true,
      "validation": {
        "minLength": 2,
        "maxLength": 50
      }
    }
  ]
}`}
              </pre>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
              الحصول على النماذج
            </h3>
            <div className="bg-gray-900 rounded-lg p-4 text-white font-mono text-sm">
              <div className="flex justify-between items-center mb-2">
                <span>GET /api/forms</span>
                <button
                  onClick={() => copyToClipboard('GET /api/forms')}
                  className="text-gray-400 hover:text-white"
                >
                  <ClipboardDocumentIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
              إرسال إجابة
            </h3>
            <div className="bg-gray-900 rounded-lg p-4 text-white font-mono text-sm">
              <div className="flex justify-between items-center mb-2">
                <span>POST /api/responses</span>
                <button
                  onClick={() => copyToClipboard('POST /api/responses')}
                  className="text-gray-400 hover:text-white"
                >
                  <ClipboardDocumentIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="mt-2 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <pre className="text-sm text-gray-800 dark:text-gray-200">
{`{
  "formId": "form-123",
  "responses": [
    {
      "componentId": "name-field",
      "value": "أحمد محمد"
    }
  ]
}`}
              </pre>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'component-library',
      title: 'مكتبة المكونات',
      icon: DocumentTextIcon,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
              مكونات النص
            </h3>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">TextInput</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                حقل إدخال النص مع دعم أنواع مختلفة من التحقق
              </p>
              <div className="bg-gray-900 rounded-lg p-3 text-white font-mono text-sm">
                <pre>{`<TextInput
  label="الاسم"
  placeholder="أدخل اسمك"
  isRequired={true}
  validation={{
    minLength: 2,
    maxLength: 50,
    pattern: "^[a-zA-Z\\s]+$"
  }}
/>`}</pre>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
              مكونات الاختيار
            </h3>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Dropdown</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                قائمة منسدلة مع دعم البحث والاختيار المتعدد
              </p>
              <div className="bg-gray-900 rounded-lg p-3 text-white font-mono text-sm">
                <pre>{`<Dropdown
  label="المدينة"
  options={[
    { id: "1", label: "دمشق", value: "damascus" },
    { id: "2", label: "حلب", value: "aleppo" }
  ]}
  multiSelect={false}
  searchable={true}
/>`}</pre>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
              مكونات الملفات
            </h3>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">FileUpload</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                رفع الملفات مع دعم السحب والإفلات والمعاينة
              </p>
              <div className="bg-gray-900 rounded-lg p-3 text-white font-mono text-sm">
                <pre>{`<FileUpload
  label="رفع المستندات"
  acceptedTypes={['image/*', '.pdf']}
  maxFileSize={5 * 1024 * 1024}
  maxFiles={3}
  dragAndDrop={true}
/>`}</pre>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'styling',
      title: 'التنسيق والتصميم',
      icon: LinkIcon,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
              استخدام Tailwind CSS
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              النظام يستخدم Tailwind CSS للتنسيق مع دعم كامل للوضع المظلم والـ RTL
            </p>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">أمثلة على التنسيق</h4>
              <div className="bg-gray-900 rounded-lg p-3 text-white font-mono text-sm">
                <pre>{`// تنسيق أساسي
<div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">

// تنسيق النص
<h1 className="text-2xl font-bold text-gray-900 dark:text-white">

// تنسيق الأزرار
<button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md">

// تنسيق RTL
<div className="flex items-center space-x-3 space-x-reverse">`}</pre>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
              دعم الوضع المظلم
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              جميع المكونات تدعم الوضع المظلم تلقائياً باستخدام فئات Tailwind
            </p>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="bg-gray-900 rounded-lg p-3 text-white font-mono text-sm">
                <pre>{`// مثال على دعم الوضع المظلم
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
  <p className="text-gray-600 dark:text-gray-400">
    نص يدعم الوضع المظلم
  </p>
</div>`}</pre>
              </div>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          الوثائق والتوثيق
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          دليل شامل للمطورين ووثائق API
        </p>
      </div>

      {/* Documentation Sections */}
      <div className="space-y-4">
        {sections.map((section) => {
          const isExpanded = expandedSections.has(section.id);
          const Icon = section.icon;

          return (
            <div
              key={section.id}
              className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden"
            >
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full px-6 py-4 text-right flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <div className="flex items-center space-x-3 space-x-reverse">
                  <Icon className="h-5 w-5 text-gray-500" />
                  <span className="text-lg font-medium text-gray-900 dark:text-white">
                    {section.title}
                  </span>
                </div>
                {isExpanded ? (
                  <ChevronDownIcon className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronRightIcon className="h-5 w-5 text-gray-500" />
                )}
              </button>
              
              {isExpanded && (
                <div className="px-6 pb-6 border-t border-gray-200 dark:border-gray-700">
                  {section.content}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Quick Links */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-3">
          روابط سريعة
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <a
            href="#"
            className="flex items-center space-x-2 space-x-reverse text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100"
          >
            <DocumentTextIcon className="h-4 w-4" />
            <span>دليل المطور</span>
          </a>
          <a
            href="#"
            className="flex items-center space-x-2 space-x-reverse text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100"
          >
            <CodeBracketIcon className="h-4 w-4" />
            <span>مرجع API</span>
          </a>
          <a
            href="#"
            className="flex items-center space-x-2 space-x-reverse text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100"
          >
            <CommandLineIcon className="h-4 w-4" />
            <span>أمثلة الكود</span>
          </a>
          <a
            href="#"
            className="flex items-center space-x-2 space-x-reverse text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100"
          >
            <LinkIcon className="h-4 w-4" />
            <span>أفضل الممارسات</span>
          </a>
          <a
            href="#"
            className="flex items-center space-x-2 space-x-reverse text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100"
          >
            <BookOpenIcon className="h-4 w-4" />
            <span>الأسئلة الشائعة</span>
          </a>
          <a
            href="#"
            className="flex items-center space-x-2 space-x-reverse text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100"
          >
            <DocumentTextIcon className="h-4 w-4" />
            <span>تقرير الأخطاء</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default Documentation;
