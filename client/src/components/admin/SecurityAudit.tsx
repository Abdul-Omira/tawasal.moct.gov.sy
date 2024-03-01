/**
 * Form Builder Platform - Security Audit Component
 * Comprehensive security audit and compliance checking
 */

import React, { useState, useEffect } from 'react';
import { Form } from '../../types/form';
import { cn } from '../../lib/utils';
import {
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  LockClosedIcon,
  EyeIcon,
  KeyIcon,
  DocumentTextIcon,
  ClockIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

interface SecurityAuditProps {
  forms: Form[];
  onFixIssue: (issueId: string) => void;
  onRunFullAudit: () => void;
}

interface SecurityIssue {
  id: string;
  type: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  formId?: string;
  componentId?: string;
  fixable: boolean;
  fixed: boolean;
  lastChecked: Date;
}

interface SecurityReport {
  overallScore: number;
  totalIssues: number;
  criticalIssues: number;
  highIssues: number;
  mediumIssues: number;
  lowIssues: number;
  lastAudit: Date;
  compliance: {
    gdpr: boolean;
    ccpa: boolean;
    sox: boolean;
    hipaa: boolean;
  };
}

export const SecurityAudit: React.FC<SecurityAuditProps> = ({
  forms,
  onFixIssue,
  onRunFullAudit,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [issues, setIssues] = useState<SecurityIssue[]>([]);
  const [report, setReport] = useState<SecurityReport | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all');

  // Mock security issues for demonstration
  const mockIssues: SecurityIssue[] = [
    {
      id: '1',
      type: 'critical',
      title: 'نموذج بدون تشفير HTTPS',
      description: 'النموذج "استطلاع المواطنين" لا يستخدم HTTPS مما يعرض البيانات للخطر',
      formId: 'form-1',
      fixable: true,
      fixed: false,
      lastChecked: new Date(),
    },
    {
      id: '2',
      type: 'high',
      title: 'عدم وجود تحقق من صحة البيانات',
      description: 'حقل البريد الإلكتروني في النموذج "تسجيل الأعمال" لا يتحقق من صحة التنسيق',
      formId: 'form-2',
      componentId: 'email-field',
      fixable: true,
      fixed: false,
      lastChecked: new Date(),
    },
    {
      id: '3',
      type: 'medium',
      title: 'عدم وجود حد أقصى لمحاولات الإرسال',
      description: 'النماذج لا تحتوي على حماية من هجمات القوة الغاشمة',
      fixable: true,
      fixed: false,
      lastChecked: new Date(),
    },
    {
      id: '4',
      type: 'low',
      title: 'عدم وجود سياسة الخصوصية',
      description: 'النماذج لا تحتوي على رابط لسياسة الخصوصية',
      fixable: true,
      fixed: false,
      lastChecked: new Date(),
    },
  ];

  // Mock security report
  const mockReport: SecurityReport = {
    overallScore: 75,
    totalIssues: 4,
    criticalIssues: 1,
    highIssues: 1,
    mediumIssues: 1,
    lowIssues: 1,
    lastAudit: new Date(),
    compliance: {
      gdpr: true,
      ccpa: false,
      sox: true,
      hipaa: false,
    },
  };

  useEffect(() => {
    setIssues(mockIssues);
    setReport(mockReport);
  }, []);

  const runSecurityAudit = async () => {
    setIsRunning(true);
    // Simulate audit process
    await new Promise(resolve => setTimeout(resolve, 3000));
    setIsRunning(false);
    onRunFullAudit();
  };

  const fixIssue = (issueId: string) => {
    setIssues(prev => 
      prev.map(issue => 
        issue.id === issueId ? { ...issue, fixed: true } : issue
      )
    );
    onFixIssue(issueId);
  };

  const filteredIssues = issues.filter(issue => 
    selectedFilter === 'all' || issue.type === selectedFilter
  );

  const getIssueIcon = (type: SecurityIssue['type']) => {
    switch (type) {
      case 'critical':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'high':
        return <ExclamationTriangleIcon className="h-5 w-5 text-orange-500" />;
      case 'medium':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'low':
        return <ExclamationTriangleIcon className="h-5 w-5 text-blue-500" />;
    }
  };

  const getIssueColor = (type: SecurityIssue['type']) => {
    switch (type) {
      case 'critical':
        return 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800';
      case 'high':
        return 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800';
      case 'medium':
        return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800';
      case 'low':
        return 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800';
    }
  };

  const getComplianceIcon = (compliant: boolean) => {
    return compliant ? (
      <CheckCircleIcon className="h-5 w-5 text-green-500" />
    ) : (
      <XCircleIcon className="h-5 w-5 text-red-500" />
    );
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            تدقيق الأمان
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            فحص شامل للأمان والامتثال للوائح
          </p>
        </div>
        <button
          onClick={runSecurityAudit}
          disabled={isRunning}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRunning ? (
            <ArrowPathIcon className="h-4 w-4 ml-2 animate-spin" />
          ) : (
            <ShieldCheckIcon className="h-4 w-4 ml-2" />
          )}
          {isRunning ? 'جاري التدقيق...' : 'تشغيل تدقيق شامل'}
        </button>
      </div>

      {/* Security Score Overview */}
      {report && (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              تقرير الأمان العام
            </h3>
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
              <ClockIcon className="h-4 w-4 ml-1" />
              آخر تدقيق: {report.lastAudit.toLocaleDateString('ar-SA')}
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Overall Score */}
            <div className="text-center">
              <div className={cn("text-3xl font-bold", getScoreColor(report.overallScore))}>
                {report.overallScore}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">النقاط الإجمالية</div>
            </div>

            {/* Critical Issues */}
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {report.criticalIssues}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">مشاكل حرجة</div>
            </div>

            {/* High Issues */}
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {report.highIssues}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">مشاكل عالية</div>
            </div>

            {/* Total Issues */}
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {report.totalIssues}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">إجمالي المشاكل</div>
            </div>
          </div>
        </div>
      )}

      {/* Compliance Status */}
      {report && (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            حالة الامتثال للوائح
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">GDPR</span>
              {getComplianceIcon(report.compliance.gdpr)}
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">CCPA</span>
              {getComplianceIcon(report.compliance.ccpa)}
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">SOX</span>
              {getComplianceIcon(report.compliance.sox)}
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">HIPAA</span>
              {getComplianceIcon(report.compliance.hipaa)}
            </div>
          </div>
        </div>
      )}

      {/* Security Issues */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              مشاكل الأمان المكتشفة
            </h3>
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value as any)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="all">جميع المشاكل</option>
              <option value="critical">حرجة</option>
              <option value="high">عالية</option>
              <option value="medium">متوسطة</option>
              <option value="low">منخفضة</option>
            </select>
          </div>
        </div>
        
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {filteredIssues.map((issue) => (
            <div
              key={issue.id}
              className={cn(
                "p-6 hover:bg-gray-50 dark:hover:bg-gray-700",
                issue.fixed && "opacity-50"
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 space-x-reverse">
                  {getIssueIcon(issue.type)}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                        {issue.title}
                      </h4>
                      {issue.fixed && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          تم الإصلاح
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {issue.description}
                    </p>
                    {issue.formId && (
                      <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                        النموذج: {forms.find(f => f.id === issue.formId)?.title || 'غير معروف'}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  {issue.fixable && !issue.fixed && (
                    <button
                      onClick={() => fixIssue(issue.id)}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      إصلاح
                    </button>
                  )}
                  <span className={cn(
                    "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                    getIssueColor(issue.type)
                  )}>
                    {issue.type === 'critical' && 'حرجة'}
                    {issue.type === 'high' && 'عالية'}
                    {issue.type === 'medium' && 'متوسطة'}
                    {issue.type === 'low' && 'منخفضة'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Security Recommendations */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          توصيات الأمان
        </h3>
        <div className="space-y-4">
          <div className="flex items-start space-x-3 space-x-reverse">
            <LockClosedIcon className="h-5 w-5 text-blue-500 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                تفعيل HTTPS لجميع النماذج
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                تأكد من أن جميع النماذج تستخدم HTTPS لحماية البيانات المنقولة
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3 space-x-reverse">
            <KeyIcon className="h-5 w-5 text-blue-500 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                تطبيق تحقق قوي من صحة البيانات
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                استخدم مكتبات التحقق من صحة البيانات على جانب الخادم والعميل
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3 space-x-reverse">
            <EyeIcon className="h-5 w-5 text-blue-500 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                إضافة مراقبة الأمان
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                راقب محاولات الوصول المشبوهة والأنشطة غير العادية
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3 space-x-reverse">
            <DocumentTextIcon className="h-5 w-5 text-blue-500 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                تحديث سياسة الخصوصية
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                تأكد من أن سياسة الخصوصية محدثة وتتوافق مع اللوائح المحلية
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityAudit;
