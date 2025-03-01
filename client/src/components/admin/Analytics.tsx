/**
 * Form Builder Platform - Analytics Component
 * Comprehensive analytics and reporting dashboard
 */

import React, { useState, useEffect } from 'react';
import { Form, FormAnalyticsData, DailyStats, ComponentAnalytics } from '../../types/form';
import { cn } from '../../lib/utils';
import {
  ChartBarIcon,
  EyeIcon,
  UsersIcon,
  ClockIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  CalendarIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';

interface AnalyticsProps {
  forms: Form[];
  analytics: FormAnalyticsData[];
  onExportData: (format: 'csv' | 'pdf' | 'excel') => void;
}

export const Analytics: React.FC<AnalyticsProps> = ({
  forms,
  analytics,
  onExportData,
}) => {
  const [selectedForm, setSelectedForm] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | '1y' | 'custom'>('30d');
  const [customDateRange, setCustomDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    end: new Date(),
  });

  // Filter analytics based on selected form and date range
  const filteredAnalytics = analytics.filter(analytics => {
    if (selectedForm !== 'all' && analytics.formId !== selectedForm) {
      return false;
    }
    // Add date range filtering logic here
    return true;
  });

  // Calculate aggregate metrics
  const totalViews = filteredAnalytics.reduce((sum, a) => sum + a.totalViews, 0);
  const totalSubmissions = filteredAnalytics.reduce((sum, a) => sum + a.totalSubmissions, 0);
  const avgCompletionRate = filteredAnalytics.length > 0 
    ? filteredAnalytics.reduce((sum, a) => sum + a.completionRate, 0) / filteredAnalytics.length 
    : 0;
  const avgCompletionTime = filteredAnalytics.length > 0
    ? filteredAnalytics.reduce((sum, a) => sum + a.avgCompletionTime, 0) / filteredAnalytics.length
    : 0;

  // Get form name by ID
  const getFormName = (formId: string) => {
    const form = forms.find(f => f.id === formId);
    return form ? form.title : 'نموذج غير معروف';
  };

  const dateRangeOptions = [
    { value: '7d', label: 'آخر 7 أيام' },
    { value: '30d', label: 'آخر 30 يوم' },
    { value: '90d', label: 'آخر 90 يوم' },
    { value: '1y', label: 'آخر سنة' },
    { value: 'custom', label: 'مخصص' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            التحليلات والتقارير
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            تحليل أداء النماذج والمشاركة
          </p>
        </div>
        <div className="flex items-center space-x-3 space-x-reverse">
          <button
            onClick={() => onExportData('csv')}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          >
            <ArrowDownTrayIcon className="h-4 w-4 ml-2" />
            تصدير CSV
          </button>
          <button
            onClick={() => onExportData('pdf')}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          >
            <ArrowDownTrayIcon className="h-4 w-4 ml-2" />
            تصدير PDF
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Form Filter */}
          <div>
            <label htmlFor="form" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              النموذج
            </label>
            <select
              id="form"
              value={selectedForm}
              onChange={(e) => setSelectedForm(e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="all">جميع النماذج</option>
              {forms.map(form => (
                <option key={form.id} value={form.id}>
                  {form.title}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Filter */}
          <div>
            <label htmlFor="dateRange" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              الفترة الزمنية
            </label>
            <select
              id="dateRange"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              {dateRangeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Custom Date Range */}
          {dateRange === 'custom' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                نطاق مخصص
              </label>
              <div className="mt-1 flex space-x-2 space-x-reverse">
                <input
                  type="date"
                  value={customDateRange.start.toISOString().split('T')[0]}
                  onChange={(e) => setCustomDateRange(prev => ({
                    ...prev,
                    start: new Date(e.target.value)
                  }))}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                <input
                  type="date"
                  value={customDateRange.end.toISOString().split('T')[0]}
                  onChange={(e) => setCustomDateRange(prev => ({
                    ...prev,
                    end: new Date(e.target.value)
                  }))}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="إجمالي المشاهدات"
          value={totalViews.toLocaleString()}
          icon={EyeIcon}
          color="text-blue-600"
          bgColor="bg-blue-100"
          trend={{ value: 12.5, isPositive: true }}
        />
        <MetricCard
          title="إجمالي الإجابات"
          value={totalSubmissions.toLocaleString()}
          icon={UsersIcon}
          color="text-green-600"
          bgColor="bg-green-100"
          trend={{ value: 8.2, isPositive: true }}
        />
        <MetricCard
          title="معدل الإكمال"
          value={`${(avgCompletionRate * 100).toFixed(1)}%`}
          icon={ChartBarIcon}
          color="text-purple-600"
          bgColor="bg-purple-100"
          trend={{ value: 2.1, isPositive: true }}
        />
        <MetricCard
          title="متوسط وقت الإكمال"
          value={`${Math.round(avgCompletionTime / 60)} دقيقة`}
          icon={ClockIcon}
          color="text-orange-600"
          bgColor="bg-orange-100"
          trend={{ value: 5.3, isPositive: false }}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Views Over Time */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            المشاهدات عبر الوقت
          </h3>
          <div className="h-64 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm">الرسوم البيانية قيد التطوير</p>
            </div>
          </div>
        </div>

        {/* Completion Rate by Form */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            معدل الإكمال حسب النموذج
          </h3>
          <div className="h-64 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm">الرسوم البيانية قيد التطوير</p>
            </div>
          </div>
        </div>
      </div>

      {/* Forms Performance Table */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            أداء النماذج
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  النموذج
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  المشاهدات
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  الإجابات
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  معدل الإكمال
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  متوسط وقت الإكمال
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  الاتجاه
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredAnalytics.map((analytics) => (
                <tr key={analytics.formId} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {getFormName(analytics.formId)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {analytics.totalViews.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {analytics.totalSubmissions.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {(analytics.completionRate * 100).toFixed(1)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {Math.round(analytics.avgCompletionTime / 60)} دقيقة
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <TrendingUpIcon className="h-4 w-4 text-green-500 ml-1" />
                      <span className="text-sm text-green-600">+12.5%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Component Analytics */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            تحليل المكونات
          </h3>
        </div>
        <div className="p-6">
          <div className="text-center py-12">
            <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              تحليل المكونات قيد التطوير
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              ستكون متاحة قريباً
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Metric Card Component
interface MetricCardProps {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon: Icon,
  color,
  bgColor,
  trend,
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className={cn("p-3 rounded-md", bgColor)}>
              <Icon className={cn("h-6 w-6", color)} />
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                {title}
              </dt>
              <dd className="text-lg font-medium text-gray-900 dark:text-white">
                {value}
              </dd>
            </dl>
          </div>
        </div>
        {trend && (
          <div className="mt-2 flex items-center">
            {trend.isPositive ? (
              <TrendingUpIcon className="h-4 w-4 text-green-500 ml-1" />
            ) : (
              <TrendingDownIcon className="h-4 w-4 text-red-500 ml-1" />
            )}
            <span className={cn(
              "text-sm font-medium",
              trend.isPositive ? "text-green-600" : "text-red-600"
            )}>
              {trend.isPositive ? '+' : ''}{trend.value}%
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400 mr-2">
              من الفترة السابقة
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;
