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
  UsersIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  RefreshIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AnalyticsDashboardProps {
  className?: string;
}

interface DashboardData {
  overview: {
    totalForms: number;
    totalSubmissions: number;
    totalViews: number;
    completionRate: number;
    averageTimeToComplete: number;
  };
  charts: {
    submissionsOverTime: Array<{ date: string; count: number }>;
    topForms: Array<{ formId: string; title: string; submissions: number }>;
    deviceBreakdown: { desktop: number; mobile: number; tablet: number };
  };
  realTime: {
    activeUsers: number;
    currentSubmissions: number;
    systemLoad: number;
  };
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  className = ''
}) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'1d' | '7d' | '30d' | '90d'>('7d');
  const [realTimeData, setRealTimeData] = useState(data?.realTime || null);

  useEffect(() => {
    loadDashboardData();
  }, [selectedPeriod]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/analytics/dashboard?period=${selectedPeriod}`);
      if (!response.ok) {
        throw new Error('Failed to load dashboard data');
      }

      const dashboardData = await response.json();
      setData(dashboardData);
      setRealTimeData(dashboardData.realTime);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadDashboardData();
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
          <ExclamationTriangleIcon className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={`p-6 ${className}`}>
        <Alert>
          <ExclamationTriangleIcon className="h-4 w-4" />
          <AlertDescription>No data available</AlertDescription>
        </Alert>
      </div>
    );
  }

  // Prepare data for charts
  const deviceData = Object.entries(data.charts.deviceBreakdown).map(([name, value]) => ({
    name: name === 'desktop' ? 'سطح المكتب' : name === 'mobile' ? 'الهاتف المحمول' : 'التابلت',
    value,
    color: COLORS[Object.keys(data.charts.deviceBreakdown).indexOf(name)]
  }));

  const topFormsData = data.charts.topForms.slice(0, 5);

  return (
    <div className={`p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            لوحة تحكم التحليلات
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            نظرة شاملة على أداء النماذج والاستخدام
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
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي النماذج</CardTitle>
            <DocumentTextIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(data.overview.totalForms)}</div>
            <p className="text-xs text-muted-foreground">
              نماذج منشورة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الإرسالات</CardTitle>
            <ChartBarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(data.overview.totalSubmissions)}</div>
            <p className="text-xs text-muted-foreground">
              إرسالات مكتملة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المشاهدات</CardTitle>
            <EyeIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(data.overview.totalViews)}</div>
            <p className="text-xs text-muted-foreground">
              مشاهدات النماذج
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">معدل الإكمال</CardTitle>
            <ClockIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(data.overview.completionRate)}</div>
            <p className="text-xs text-muted-foreground">
              نسبة إكمال النماذج
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">متوسط وقت الإكمال</CardTitle>
            <ClockIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatTime(data.overview.averageTimeToComplete)}</div>
            <p className="text-xs text-muted-foreground">
              دقائق
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Real-time Metrics */}
      {realTimeData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">المستخدمون النشطون</CardTitle>
              <UsersIcon className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{realTimeData.activeUsers}</div>
              <p className="text-xs text-muted-foreground">
                حالياً
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">الإرسالات الحالية</CardTitle>
              <DocumentTextIcon className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{realTimeData.currentSubmissions}</div>
              <p className="text-xs text-muted-foreground">
                في التقدم
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">حمل النظام</CardTitle>
              <ChartBarIcon className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{realTimeData.systemLoad}%</div>
              <p className="text-xs text-muted-foreground">
                حالياً
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Submissions Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>الإرسالات عبر الوقت</CardTitle>
            <CardDescription>
              عدد الإرسالات المكتملة خلال الفترة المحددة
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.charts.submissionsOverTime}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  name="الإرسالات"
                />
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

      {/* Top Forms */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>أفضل النماذج</CardTitle>
            <CardDescription>
              النماذج الأكثر استخداماً حسب عدد الإرسالات
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topFormsData.map((form, index) => (
                <div key={form.formId} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <Badge variant="outline">{index + 1}</Badge>
                    <div>
                      <p className="font-medium">{form.title}</p>
                      <p className="text-sm text-gray-500">ID: {form.formId}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatNumber(form.submissions)}</p>
                    <p className="text-xs text-gray-500">إرسال</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>مقاييس الأداء</CardTitle>
            <CardDescription>
              مؤشرات الأداء الرئيسية للنظام
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">متوسط وقت الاستجابة</span>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <ArrowDownIcon className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-bold text-green-600">150ms</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">معدل الأخطاء</span>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <ArrowDownIcon className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-bold text-green-600">0.5%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">الإنتاجية</span>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <ArrowUpIcon className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-bold text-green-600">1000 req/s</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">وقت التشغيل</span>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <ArrowUpIcon className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-bold text-green-600">99.9%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};