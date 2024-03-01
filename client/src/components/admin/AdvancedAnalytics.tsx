/**
 * Form Builder Platform - Advanced Analytics Component
 * Comprehensive analytics with charts and visualizations
 */

import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Form, FormAnalyticsData, DailyStats } from '../../types/form';
import { cn } from '../../lib/utils';
import {
  ChartBarIcon,
  ArrowTrendingUpIcon as TrendingUpIcon,
  ArrowTrendingDownIcon as TrendingDownIcon,
  EyeIcon,
  UsersIcon,
  ClockIcon,
  ArrowDownTrayIcon,
  CalendarIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';

interface AdvancedAnalyticsProps {
  forms: Form[];
  analytics: FormAnalyticsData[];
  onExportData: (format: 'csv' | 'pdf' | 'excel') => void;
}

export const AdvancedAnalytics: React.FC<AdvancedAnalyticsProps> = ({
  forms,
  analytics,
  onExportData,
}) => {
  const [selectedForm, setSelectedForm] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | '1y' | 'custom'>('30d');
  const [chartType, setChartType] = useState<'line' | 'bar' | 'area'>('line');
  const [timeGrouping, setTimeGrouping] = useState<'day' | 'week' | 'month'>('day');

  // Filter analytics based on selected form and date range
  const filteredAnalytics = analytics.filter(analytics => {
    if (selectedForm !== 'all' && analytics.formId !== selectedForm) {
      return false;
    }
    return true;
  });

  // Generate mock data for charts
  const generateChartData = () => {
    const data = [];
    const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : dateRange === '90d' ? 90 : 365;
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      data.push({
        date: date.toISOString().split('T')[0],
        views: Math.floor(Math.random() * 100) + 50,
        submissions: Math.floor(Math.random() * 30) + 10,
        completionRate: Math.random() * 0.4 + 0.6, // 60-100%
        avgCompletionTime: Math.floor(Math.random() * 300) + 120, // 2-7 minutes
      });
    }
    
    return data;
  };

  const chartData = generateChartData();

  // Calculate aggregate metrics
  const totalViews = filteredAnalytics.reduce((sum, a) => sum + a.totalViews, 0);
  const totalSubmissions = filteredAnalytics.reduce((sum, a) => sum + a.totalSubmissions, 0);
  const avgCompletionRate = filteredAnalytics.length > 0 
    ? filteredAnalytics.reduce((sum, a) => sum + a.completionRate, 0) / filteredAnalytics.length 
    : 0;

  // Get form name by ID
  const getFormName = (formId: string) => {
    const form = forms.find(f => f.id === formId);
    return form ? form.title : 'نموذج غير معروف';
  };

  // Chart colors
  const colors = {
    primary: '#3B82F6',
    secondary: '#10B981',
    accent: '#F59E0B',
    danger: '#EF4444',
    purple: '#8B5CF6',
    pink: '#EC4899',
  };

  // Pie chart data for form performance
  const pieData = forms.map(form => {
    const formAnalytics = analytics.find(a => a.formId === form.id);
    return {
      name: form.title,
      value: formAnalytics ? formAnalytics.totalSubmissions : 0,
      color: Object.values(colors)[forms.indexOf(form) % Object.values(colors).length],
    };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            التحليلات المتقدمة
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            تحليل مفصل لأداء النماذج مع الرسوم البيانية
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          {/* Form Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              النموذج
            </label>
            <select
              value={selectedForm}
              onChange={(e) => setSelectedForm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              الفترة الزمنية
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="7d">آخر 7 أيام</option>
              <option value="30d">آخر 30 يوم</option>
              <option value="90d">آخر 90 يوم</option>
              <option value="1y">آخر سنة</option>
            </select>
          </div>

          {/* Chart Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              نوع الرسم البياني
            </label>
            <select
              value={chartType}
              onChange={(e) => setChartType(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="line">خطي</option>
              <option value="bar">أعمدة</option>
              <option value="area">منطقة</option>
            </select>
          </div>

          {/* Time Grouping Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              تجميع الوقت
            </label>
            <select
              value={timeGrouping}
              onChange={(e) => setTimeGrouping(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="day">يومي</option>
              <option value="week">أسبوعي</option>
              <option value="month">شهري</option>
            </select>
          </div>
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
          value={`${Math.round(avgCompletionRate * 5)} دقيقة`}
          icon={ClockIcon}
          color="text-orange-600"
          bgColor="bg-orange-100"
          trend={{ value: 5.3, isPositive: false }}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Views and Submissions Over Time */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            المشاهدات والإجابات عبر الوقت
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'line' ? (
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="views"
                    stroke={colors.primary}
                    strokeWidth={2}
                    name="المشاهدات"
                  />
                  <Line
                    type="monotone"
                    dataKey="submissions"
                    stroke={colors.secondary}
                    strokeWidth={2}
                    name="الإجابات"
                  />
                </LineChart>
              ) : chartType === 'bar' ? (
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="views" fill={colors.primary} name="المشاهدات" />
                  <Bar dataKey="submissions" fill={colors.secondary} name="الإجابات" />
                </BarChart>
              ) : (
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="views"
                    stackId="1"
                    stroke={colors.primary}
                    fill={colors.primary}
                    name="المشاهدات"
                  />
                  <Area
                    type="monotone"
                    dataKey="submissions"
                    stackId="2"
                    stroke={colors.secondary}
                    fill={colors.secondary}
                    name="الإجابات"
                  />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Completion Rate Over Time */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            معدل الإكمال عبر الوقت
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 1]} />
                <Tooltip formatter={(value) => [`${(value * 100).toFixed(1)}%`, 'معدل الإكمال']} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="completionRate"
                  stroke={colors.purple}
                  strokeWidth={2}
                  name="معدل الإكمال"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Form Performance Comparison */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Form Performance Pie Chart */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            أداء النماذج
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Average Completion Time */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            متوسط وقت الإكمال
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value} دقيقة`, 'متوسط وقت الإكمال']} />
                <Legend />
                <Bar dataKey="avgCompletionTime" fill={colors.accent} name="متوسط وقت الإكمال" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed Analytics Table */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            تحليل مفصل للنماذج
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

export default AdvancedAnalytics;
