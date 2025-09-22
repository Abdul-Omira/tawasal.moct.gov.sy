import React, { useState, useEffect } from 'react';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { 
  ChartBarIcon, 
  UsersIcon,
  DocumentTextIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface RealTimeMetricsProps {
  className?: string;
}

interface MetricData {
  timestamp: string;
  activeUsers: number;
  currentSubmissions: number;
  systemLoad: number;
  responseTime: number;
  errorRate: number;
  throughput: number;
}

interface AlertData {
  id: string;
  type: 'warning' | 'error' | 'info' | 'success';
  message: string;
  timestamp: Date;
}

export const RealTimeMetrics: React.FC<RealTimeMetricsProps> = ({
  className = ''
}) => {
  const [metrics, setMetrics] = useState<MetricData[]>([]);
  const [currentMetrics, setCurrentMetrics] = useState<MetricData | null>(null);
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize WebSocket connection
    const ws = new WebSocket('ws://localhost:3001/api/analytics/realtime/ws');
    
    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      setLoading(false);
      
      // Authenticate with tenant and user info
      ws.send(JSON.stringify({
        type: 'authenticate',
        tenantId: 'current-tenant', // This would come from context
        userId: 'current-user' // This would come from context
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'system_metrics') {
          const newMetric: MetricData = {
            timestamp: new Date().toISOString(),
            activeUsers: data.activeUsers,
            currentSubmissions: data.currentSubmissions,
            systemLoad: data.systemLoad,
            responseTime: data.responseTime,
            errorRate: data.errorRate,
            throughput: data.throughput
          };
          
          setCurrentMetrics(newMetric);
          setMetrics(prev => [...prev.slice(-29), newMetric]); // Keep last 30 data points
        }
        
        if (data.type === 'alert') {
          const newAlert: AlertData = {
            id: `alert_${Date.now()}`,
            type: data.severity === 'high' ? 'error' : data.severity === 'medium' ? 'warning' : 'info',
            message: data.message,
            timestamp: new Date()
          };
          
          setAlerts(prev => [newAlert, ...prev.slice(0, 9)]); // Keep last 10 alerts
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, []);

  const getStatusColor = (value: number, thresholds: { low: number; high: number }) => {
    if (value <= thresholds.low) return 'text-green-600';
    if (value <= thresholds.high) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusIcon = (value: number, thresholds: { low: number; high: number }) => {
    if (value <= thresholds.low) return <CheckCircleIcon className="h-4 w-4 text-green-600" />;
    if (value <= thresholds.high) return <ExclamationTriangleIcon className="h-4 w-4 text-yellow-600" />;
    return <ExclamationTriangleIcon className="h-4 w-4 text-red-600" />;
  };

  const getAlertVariant = (type: string) => {
    switch (type) {
      case 'error': return 'destructive';
      case 'warning': return 'default';
      case 'success': return 'default';
      default: return 'default';
    }
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

  return (
    <div className={`p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            المقاييس في الوقت الفعلي
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            مراقبة الأداء والاستخدام المباشر
          </p>
        </div>
        <div className="flex items-center space-x-2 space-x-reverse">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm text-gray-600">
            {isConnected ? 'متصل' : 'غير متصل'}
          </span>
        </div>
      </div>

      {/* Current Metrics */}
      {currentMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">المستخدمون النشطون</CardTitle>
              <UsersIcon className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentMetrics.activeUsers}</div>
              <p className="text-xs text-muted-foreground">
                حالياً
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">الإرسالات الحالية</CardTitle>
              <DocumentTextIcon className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentMetrics.currentSubmissions}</div>
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
              <div className={`text-2xl font-bold ${getStatusColor(currentMetrics.systemLoad, { low: 50, high: 80 })}`}>
                {currentMetrics.systemLoad}%
              </div>
              <p className="text-xs text-muted-foreground">
                حالياً
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">وقت الاستجابة</CardTitle>
              <ClockIcon className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getStatusColor(currentMetrics.responseTime, { low: 100, high: 300 })}`}>
                {currentMetrics.responseTime}ms
              </div>
              <p className="text-xs text-muted-foreground">
                متوسط
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* System Load Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>حمل النظام عبر الوقت</CardTitle>
            <CardDescription>
              مراقبة استخدام موارد النظام
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={metrics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={(value) => new Date(value).toLocaleTimeString('ar-SA', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                />
                <YAxis domain={[0, 100]} />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleString('ar-SA')}
                  formatter={(value) => [`${value}%`, 'حمل النظام']}
                />
                <Area 
                  type="monotone" 
                  dataKey="systemLoad" 
                  stroke="#F59E0B" 
                  fill="#F59E0B"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Response Time Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>وقت الاستجابة عبر الوقت</CardTitle>
            <CardDescription>
              مراقبة أداء النظام
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metrics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={(value) => new Date(value).toLocaleTimeString('ar-SA', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleString('ar-SA')}
                  formatter={(value) => [`${value}ms`, 'وقت الاستجابة']}
                />
                <Line 
                  type="monotone" 
                  dataKey="responseTime" 
                  stroke="#8B5CF6" 
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>التنبيهات</CardTitle>
            <CardDescription>
              التنبيهات والتحذيرات الأخيرة
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.map((alert) => (
                <Alert key={alert.id} variant={getAlertVariant(alert.type)}>
                  {getStatusIcon(0, { low: 0, high: 0 })}
                  <AlertDescription>
                    <div className="flex items-center justify-between">
                      <span>{alert.message}</span>
                      <span className="text-xs text-gray-500">
                        {alert.timestamp.toLocaleTimeString('ar-SA')}
                      </span>
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">معدل الأخطاء</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className={`text-2xl font-bold ${getStatusColor(currentMetrics?.errorRate || 0, { low: 1, high: 5 })}`}>
                {currentMetrics?.errorRate.toFixed(2) || 0}%
              </span>
              {getStatusIcon(currentMetrics?.errorRate || 0, { low: 1, high: 5 })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">الإنتاجية</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-blue-600">
                {currentMetrics?.throughput || 0}
              </span>
              <span className="text-sm text-gray-500">req/s</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">حالة النظام</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Badge variant={isConnected ? 'default' : 'destructive'}>
                {isConnected ? 'يعمل بشكل طبيعي' : 'غير متصل'}
              </Badge>
              {getStatusIcon(isConnected ? 0 : 100, { low: 0, high: 50 })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
