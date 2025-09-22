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
  ResponsiveContainer 
} from 'recharts';
import { 
  ChartBarIcon, 
  EyeIcon, 
  DocumentTextIcon,
  ClockIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  RefreshIcon,
  DownloadIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface FormAnalyticsProps {
  formId: string;
  formTitle: string;
  className?: string;
}

interface FormAnalyticsData {
  formId: string;
  totalViews: number;
  totalSubmissions: number;
  completionRate: number;
  averageTimeToComplete: number;
  bounceRate: number;
  deviceBreakdown: {
    desktop: number;
    mobile: number;
    tablet: number;
  };
  browserBreakdown: Record<string, number>;
  osBreakdown: Record<string, number>;
  timeSeries: Array<{
    date: string;
    views: number;
    submissions: number;
  }>;
  topPages: Array<{
    page: number;
    views: number;
    dropOffRate: number;
  }>;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16'];

export const FormAnalytics: React.FC<FormAnalyticsProps> = ({
  formId,
  formTitle,
  className = ''
}) => {
  const [data, setData] = useState<FormAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'1d' | '7d' | '30d' | '90d'>('7d');
  const [selectedMetric, setSelectedMetric] = useState<'views' | 'submissions' | 'completion'>('views');

  useEffect(() => {
    loadFormAnalytics();
  }, [formId, selectedPeriod]);

  const loadFormAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/analytics/forms/${formId}?period=${selectedPeriod}`);
      if (!response.ok) {
        throw new Error('Failed to load form analytics');
      }

      const analyticsData = await response.json();
      setData(analyticsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadFormAnalytics();
  };

  const handleExport = async () => {
    try {
      const response = await fetch('/api/analytics/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'form_analytics',
          formId,
          period: selectedPeriod,
          format: 'csv'
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `form_analytics_${formId}_${selectedPeriod}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error exporting analytics:', error);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatPercentage = (num: number): string => {
    return num.toFixed(1) + '%';
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-6 ${className}`}>
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={`p-6 ${className}`}>
        <Alert>
          <AlertDescription>No analytics data available for this form</AlertDescription>
        </Alert>
      </div>
    );
  }

  // Prepare data for charts
  const deviceData = Object.entries(data.deviceBreakdown).map(([name, value]) => ({
    name: name === 'desktop' ? 'سطح المكتب' : name === 'mobile' ? 'الهاتف المحمول' : 'التابلت',
    value,
    color: COLORS[Object.keys(data.deviceBreakdown).indexOf(name)]
  }));

  const browserData = Object.entries(data.browserBreakdown).map(([name, value], index) => ({
    name,
    value,
    color: COLORS[index % COLORS.length]
  }));

  const osData = Object.entries(data.osBreakdown).map(([name, value], index) => ({
    name,
    value,
    color: COLORS[index % COLORS.length]
  }));

  const timeSeriesData = data.timeSeries.map(item => ({
    ...item,
    completionRate: item.views > 0 ? (item.submissions / item.views) * 100 : 0
  }));

  return (
    <div className={`p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            تحليلات النموذج
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {formTitle}
          </p>
        </div>
        <div className="flex items-center space-x-3 space-x-reverse">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="1d">آخر 24 ساعة</option>
            <option value="7d">آخر 7 أيام</option>
            <option value="30d">آخر 30 يوم</option>
            <option value="90d">آخر 90 يوم</option>
          </select>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshIcon className="h-4 w-4 mr-2" />
            تحديث
          </Button>
          <Button onClick={handleExport} variant="outline">
            <DownloadIcon className="h-4 w-4 mr-2" />
            تصدير
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المشاهدات</CardTitle>
            <EyeIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(data.totalViews)}</div>
            <p className="text-xs text-muted-foreground">
              مشاهدات النموذج
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الإرسالات</CardTitle>
            <DocumentTextIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(data.totalSubmissions)}</div>
            <p className="text-xs text-muted-foreground">
              إرسالات مكتملة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">معدل الإكمال</CardTitle>
            <ChartBarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(data.completionRate)}</div>
            <p className="text-xs text-muted-foreground">
              نسبة إكمال النموذج
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">متوسط وقت الإكمال</CardTitle>
            <ClockIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatTime(data.averageTimeToComplete)}</div>
            <p className="text-xs text-muted-foreground">
              دقائق
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>معدل الارتداد</CardTitle>
            <CardDescription>
              نسبة المستخدمين الذين غادروا النموذج دون إكماله
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {formatPercentage(data.bounceRate)}
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {data.bounceRate > 50 ? 'معدل مرتفع' : data.bounceRate > 30 ? 'معدل متوسط' : 'معدل منخفض'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>أداء الصفحات</CardTitle>
            <CardDescription>
              أفضل الصفحات أداءً في النموذج
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.topPages.slice(0, 3).map((page, index) => (
                <div key={page.page} className="flex items-center justify-between">
                  <span className="text-sm">الصفحة {page.page}</span>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <span className="text-sm font-medium">{formatNumber(page.views)}</span>
                    <span className="text-xs text-gray-500">مشاهدة</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Time Series Chart */}
        <Card>
          <CardHeader>
            <CardTitle>الإحصائيات عبر الوقت</CardTitle>
            <CardDescription>
              تطور المشاهدات والإرسالات
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="flex space-x-2 space-x-reverse">
                <Button
                  variant={selectedMetric === 'views' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedMetric('views')}
                >
                  المشاهدات
                </Button>
                <Button
                  variant={selectedMetric === 'submissions' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedMetric('submissions')}
                >
                  الإرسالات
                </Button>
                <Button
                  variant={selectedMetric === 'completion' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedMetric('completion')}
                >
                  معدل الإكمال
                </Button>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                {selectedMetric === 'views' && (
                  <Line 
                    type="monotone" 
                    dataKey="views" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    name="المشاهدات"
                  />
                )}
                {selectedMetric === 'submissions' && (
                  <Line 
                    type="monotone" 
                    dataKey="submissions" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    name="الإرسالات"
                  />
                )}
                {selectedMetric === 'completion' && (
                  <Line 
                    type="monotone" 
                    dataKey="completionRate" 
                    stroke="#F59E0B" 
                    strokeWidth={2}
                    name="معدل الإكمال %"
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Device Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>توزيع الأجهزة</CardTitle>
            <CardDescription>
              نسبة الاستخدام حسب نوع الجهاز
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={deviceData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {deviceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Browser and OS Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>توزيع المتصفحات</CardTitle>
            <CardDescription>
              نسبة الاستخدام حسب نوع المتصفح
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={browserData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>توزيع أنظمة التشغيل</CardTitle>
            <CardDescription>
              نسبة الاستخدام حسب نظام التشغيل
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={osData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
