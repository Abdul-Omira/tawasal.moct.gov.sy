/**
 * Form Builder Platform - Admin Dashboard
 * Main dashboard for form management and analytics
 */

import React, { useState, useEffect } from 'react';
import { Form, FormAnalyticsData } from '../../types/form';
import { cn } from '../../lib/utils';
import { 
  PlusIcon, 
  DocumentTextIcon, 
  ChartBarIcon, 
  UsersIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ShareIcon,
  ArchiveBoxIcon
} from '@heroicons/react/24/outline';

interface DashboardProps {
  forms: Form[];
  analytics: FormAnalyticsData[];
  onCreateForm: () => void;
  onEditForm: (formId: string) => void;
  onDeleteForm: (formId: string) => void;
  onViewForm: (formId: string) => void;
  onShareForm: (formId: string) => void;
  onArchiveForm: (formId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  forms,
  analytics,
  onCreateForm,
  onEditForm,
  onDeleteForm,
  onViewForm,
  onShareForm,
  onArchiveForm,
}) => {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'forms' | 'analytics'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published' | 'archived'>('all');

  // Filter forms based on search and status
  const filteredForms = forms.filter(form => {
    const matchesSearch = form.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         form.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || form.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate overview metrics
  const totalForms = forms.length;
  const publishedForms = forms.filter(f => f.status === 'published').length;
  const draftForms = forms.filter(f => f.status === 'draft').length;
  const archivedForms = forms.filter(f => f.status === 'archived').length;
  const totalViews = analytics.reduce((sum, a) => sum + a.totalViews, 0);
  const totalSubmissions = analytics.reduce((sum, a) => sum + a.totalSubmissions, 0);
  const avgCompletionRate = analytics.length > 0 
    ? analytics.reduce((sum, a) => sum + a.completionRate, 0) / analytics.length 
    : 0;

  const tabs = [
    { id: 'overview', name: 'نظرة عامة', icon: ChartBarIcon },
    { id: 'forms', name: 'النماذج', icon: DocumentTextIcon },
    { id: 'analytics', name: 'التحليلات', icon: ChartBarIcon },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                لوحة التحكم
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                إدارة النماذج والتحليلات
              </p>
            </div>
            <button
              onClick={onCreateForm}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusIcon className="h-5 w-5 ml-2" />
              إنشاء نموذج جديد
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8 space-x-reverse" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id as any)}
                  className={cn(
                    "flex items-center py-4 px-1 border-b-2 font-medium text-sm",
                    selectedTab === tab.id
                      ? "border-blue-500 text-blue-600 dark:text-blue-400"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                  )}
                >
                  <Icon className="h-5 w-5 ml-2" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {selectedTab === 'overview' && (
          <OverviewTab
            totalForms={totalForms}
            publishedForms={publishedForms}
            draftForms={draftForms}
            archivedForms={archivedForms}
            totalViews={totalViews}
            totalSubmissions={totalSubmissions}
            avgCompletionRate={avgCompletionRate}
            recentForms={forms.slice(0, 5)}
            onEditForm={onEditForm}
            onViewForm={onViewForm}
          />
        )}

        {selectedTab === 'forms' && (
          <FormsTab
            forms={filteredForms}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            onEditForm={onEditForm}
            onDeleteForm={onDeleteForm}
            onViewForm={onViewForm}
            onShareForm={onShareForm}
            onArchiveForm={onArchiveForm}
          />
        )}

        {selectedTab === 'analytics' && (
          <AnalyticsTab
            analytics={analytics}
            forms={forms}
          />
        )}
      </div>
    </div>
  );
};

// Overview Tab Component
interface OverviewTabProps {
  totalForms: number;
  publishedForms: number;
  draftForms: number;
  archivedForms: number;
  totalViews: number;
  totalSubmissions: number;
  avgCompletionRate: number;
  recentForms: Form[];
  onEditForm: (formId: string) => void;
  onViewForm: (formId: string) => void;
}

const OverviewTab: React.FC<OverviewTabProps> = ({
  totalForms,
  publishedForms,
  draftForms,
  archivedForms,
  totalViews,
  totalSubmissions,
  avgCompletionRate,
  recentForms,
  onEditForm,
  onViewForm,
}) => {
  const stats = [
    {
      name: 'إجمالي النماذج',
      value: totalForms,
      icon: DocumentTextIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      name: 'النماذج المنشورة',
      value: publishedForms,
      icon: ShareIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      name: 'المسودات',
      value: draftForms,
      icon: PencilIcon,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    {
      name: 'إجمالي المشاهدات',
      value: totalViews.toLocaleString(),
      icon: EyeIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      name: 'إجمالي الإجابات',
      value: totalSubmissions.toLocaleString(),
      icon: UsersIcon,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
    },
    {
      name: 'معدل الإكمال',
      value: `${(avgCompletionRate * 100).toFixed(1)}%`,
      icon: ChartBarIcon,
      color: 'text-pink-600',
      bgColor: 'bg-pink-100',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.name}
              className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg"
            >
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={cn("p-3 rounded-md", stat.bgColor)}>
                      <Icon className={cn("h-6 w-6", stat.color)} />
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                        {stat.name}
                      </dt>
                      <dd className="text-lg font-medium text-gray-900 dark:text-white">
                        {stat.value}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Forms */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
            النماذج الأخيرة
          </h3>
          <div className="mt-5">
            {recentForms.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                لا توجد نماذج بعد
              </p>
            ) : (
              <div className="space-y-3">
                {recentForms.map((form) => (
                  <div
                    key={form.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-md"
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {form.title}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {form.description || 'لا يوجد وصف'}
                      </p>
                      <div className="flex items-center mt-1 space-x-4 space-x-reverse">
                        <span className={cn(
                          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                          form.status === 'published' && "bg-green-100 text-green-800",
                          form.status === 'draft' && "bg-yellow-100 text-yellow-800",
                          form.status === 'archived' && "bg-gray-100 text-gray-800"
                        )}>
                          {form.status === 'published' && 'منشور'}
                          {form.status === 'draft' && 'مسودة'}
                          {form.status === 'archived' && 'مؤرشف'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(form.updatedAt).toLocaleDateString('ar-SA')}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <button
                        onClick={() => onViewForm(form.id)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onEditForm(form.id)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Forms Tab Component
interface FormsTabProps {
  forms: Form[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  onEditForm: (formId: string) => void;
  onDeleteForm: (formId: string) => void;
  onViewForm: (formId: string) => void;
  onShareForm: (formId: string) => void;
  onArchiveForm: (formId: string) => void;
}

const FormsTab: React.FC<FormsTabProps> = ({
  forms,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onEditForm,
  onDeleteForm,
  onViewForm,
  onShareForm,
  onArchiveForm,
}) => {
  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              البحث
            </label>
            <input
              type="text"
              id="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="ابحث في النماذج..."
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              الحالة
            </label>
            <select
              id="status"
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="all">جميع الحالات</option>
              <option value="draft">مسودة</option>
              <option value="published">منشور</option>
              <option value="archived">مؤرشف</option>
            </select>
          </div>
        </div>
      </div>

      {/* Forms List */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
            النماذج ({forms.length})
          </h3>
          <div className="mt-5">
            {forms.length === 0 ? (
              <div className="text-center py-12">
                <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                  لا توجد نماذج
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  ابدأ بإنشاء نموذج جديد
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {forms.map((form) => (
                  <div
                    key={form.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {form.title}
                        </h4>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                          {form.description || 'لا يوجد وصف'}
                        </p>
                        <div className="mt-2 flex items-center space-x-2 space-x-reverse">
                          <span className={cn(
                            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                            form.status === 'published' && "bg-green-100 text-green-800",
                            form.status === 'draft' && "bg-yellow-100 text-yellow-800",
                            form.status === 'archived' && "bg-gray-100 text-gray-800"
                          )}>
                            {form.status === 'published' && 'منشور'}
                            {form.status === 'draft' && 'مسودة'}
                            {form.status === 'archived' && 'مؤرشف'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {new Date(form.updatedAt).toLocaleDateString('ar-SA')}
                      </span>
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <button
                          onClick={() => onViewForm(form.id)}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          title="عرض"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onEditForm(form.id)}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          title="تعديل"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onShareForm(form.id)}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          title="مشاركة"
                        >
                          <ShareIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onArchiveForm(form.id)}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          title="أرشفة"
                        >
                          <ArchiveBoxIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onDeleteForm(form.id)}
                          className="text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                          title="حذف"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Analytics Tab Component
interface AnalyticsTabProps {
  analytics: FormAnalyticsData[];
  forms: Form[];
}

const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ analytics, forms }) => {
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
          التحليلات
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          تحليلات مفصلة للنماذج والأداء
        </p>
        {/* Analytics content will be implemented later */}
        <div className="mt-4 text-center py-12">
          <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            التحليلات قيد التطوير
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            ستكون متاحة قريباً
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
