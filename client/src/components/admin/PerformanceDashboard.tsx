import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Cpu, 
  Database, 
  Globe, 
  HardDrive, 
  MemoryStick,
  Network,
  TrendingUp,
  TrendingDown,
  Zap,
  BarChart3,
  Settings,
  Bell,
  RefreshCw
} from 'lucide-react';
import { performanceService, PerformanceMetric, PerformanceAlert, PerformanceDashboard as PerformanceDashboardType } from '@/lib/performanceService';

export const PerformanceDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [dashboards, setDashboards] = useState<PerformanceDashboardType[]>([]);
  const [realTimeMetrics, setRealTimeMetrics] = useState<any>(null);
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [metricsData, alertsData, dashboardsData, realTimeData, healthData] = await Promise.all([
        performanceService.getMetrics({}),
        performanceService.getAlerts(),
        performanceService.getDashboards(),
        performanceService.getRealTimeMetrics(),
        performanceService.getHealthStatus()
      ]);
      
      setMetrics(metricsData);
      setAlerts(alertsData);
      setDashboards(dashboardsData);
      setRealTimeMetrics(realTimeData);
      setHealthStatus(healthData);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to load performance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'degraded': return 'text-yellow-600';
      case 'unhealthy': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getHealthStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'degraded': return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'unhealthy': return <AlertTriangle className="w-5 h-5 text-red-600" />;
      default: return <Activity className="w-5 h-5 text-gray-600" />;
    }
  };

  const getAlertSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-blue-100 text-blue-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatMetricValue = (value: number, unit: string) => {
    if (unit === 'ms') {
      return `${value.toFixed(2)}ms`;
    } else if (unit === '%') {
      return `${value.toFixed(1)}%`;
    } else if (unit === 'req/s') {
      return `${value.toFixed(1)} req/s`;
    } else if (unit === 'MB') {
      return `${(value / 1024 / 1024).toFixed(2)} MB`;
    }
    return `${value.toFixed(2)} ${unit}`;
  };

  if (loading && !realTimeMetrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading performance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Performance Monitoring</h1>
          <p className="text-gray-600">Monitor system performance, alerts, and optimization</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button>
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Health Status Alert */}
      {healthStatus && (
        <Alert className={healthStatus.status === 'unhealthy' ? 'border-red-200 bg-red-50' : 
                          healthStatus.status === 'degraded' ? 'border-yellow-200 bg-yellow-50' : 
                          'border-green-200 bg-green-50'}>
          <div className="flex items-center">
            {getHealthStatusIcon(healthStatus.status)}
            <div className="ml-2">
              <AlertDescription>
                System Status: <span className={getHealthStatusColor(healthStatus.status)}>
                  {healthStatus.status.toUpperCase()}
                </span>
                {healthStatus.overallScore && (
                  <span className="ml-2">(Score: {healthStatus.overallScore}/100)</span>
                )}
              </AlertDescription>
            </div>
          </div>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="dashboards">Dashboards</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Real-time Metrics */}
          {realTimeMetrics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Response Time</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatMetricValue(realTimeMetrics.responseTime, 'ms')}</div>
                  <p className="text-xs text-muted-foreground">
                    <TrendingDown className="w-3 h-3 inline mr-1" />
                    -2.5% from last hour
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Requests/sec</CardTitle>
                  <Globe className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatMetricValue(realTimeMetrics.requestsPerSecond, 'req/s')}</div>
                  <p className="text-xs text-muted-foreground">
                    <TrendingUp className="w-3 h-3 inline mr-1" />
                    +12.3% from last hour
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatMetricValue(realTimeMetrics.errorRate, '%')}</div>
                  <p className="text-xs text-muted-foreground">
                    <TrendingDown className="w-3 h-3 inline mr-1" />
                    -0.8% from last hour
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{realTimeMetrics.activeUsers}</div>
                  <p className="text-xs text-muted-foreground">
                    <TrendingUp className="w-3 h-3 inline mr-1" />
                    +5.2% from last hour
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* System Load */}
          {realTimeMetrics?.systemLoad && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
                  <Cpu className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{realTimeMetrics.systemLoad.cpu.toFixed(1)}%</div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${realTimeMetrics.systemLoad.cpu}%` }}
                    ></div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
                  <MemoryStick className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{realTimeMetrics.systemLoad.memory.toFixed(1)}%</div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${realTimeMetrics.systemLoad.memory}%` }}
                    ></div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Disk Usage</CardTitle>
                  <HardDrive className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{realTimeMetrics.systemLoad.disk.toFixed(1)}%</div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-yellow-600 h-2 rounded-full" 
                      style={{ width: `${realTimeMetrics.systemLoad.disk}%` }}
                    ></div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Recent Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Recent Alerts
              </CardTitle>
              <CardDescription>Latest performance alerts and notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alerts.slice(0, 5).map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge className={getAlertSeverityColor(alert.severity)}>
                        {alert.severity}
                      </Badge>
                      <div>
                        <p className="font-medium">{alert.name}</p>
                        <p className="text-sm text-gray-600">{alert.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">
                        {alert.lastTriggered ? 
                          new Date(alert.lastTriggered).toLocaleString() : 
                          'Never triggered'
                        }
                      </p>
                      <p className="text-xs text-gray-400">
                        {alert.triggerCount} times
                      </p>
                    </div>
                  </div>
                ))}
                {alerts.length === 0 && (
                  <p className="text-center text-gray-500 py-4">No recent alerts</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>Detailed performance metrics and trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics.map((metric) => (
                  <div key={metric.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <BarChart3 className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">{metric.name}</p>
                        <p className="text-sm text-gray-600 capitalize">{metric.category.replace('_', ' ')}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{formatMetricValue(metric.value, metric.unit)}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(metric.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
                {metrics.length === 0 && (
                  <p className="text-center text-gray-500 py-8">No metrics available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Performance Alerts</h2>
            <Button>
              <Bell className="w-4 h-4 mr-2" />
              Create Alert
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {alerts.map((alert) => (
              <Card key={alert.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{alert.name}</CardTitle>
                    <Badge className={getAlertSeverityColor(alert.severity)}>
                      {alert.severity}
                    </Badge>
                  </div>
                  <CardDescription>{alert.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Status:</span>
                      <Badge variant={alert.status === 'active' ? 'default' : 'secondary'}>
                        {alert.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Triggered:</span>
                      <span>{alert.triggerCount} times</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Last Triggered:</span>
                      <span>
                        {alert.lastTriggered ? 
                          new Date(alert.lastTriggered).toLocaleDateString() : 
                          'Never'
                        }
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="dashboards" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Performance Dashboards</h2>
            <Button>
              <BarChart3 className="w-4 h-4 mr-2" />
              Create Dashboard
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dashboards.map((dashboard) => (
              <Card key={dashboard.id}>
                <CardHeader>
                  <CardTitle>{dashboard.name}</CardTitle>
                  <CardDescription>{dashboard.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Widgets:</span>
                      <span>{dashboard.widgets.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Public:</span>
                      <Badge variant={dashboard.isPublic ? 'default' : 'secondary'}>
                        {dashboard.isPublic ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Created:</span>
                      <span>{new Date(dashboard.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="optimization" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Performance Optimization</h2>
            <Button>
              <Zap className="w-4 h-4 mr-2" />
              Run Analysis
            </Button>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Optimization Suggestions</CardTitle>
              <CardDescription>AI-powered recommendations to improve performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">Enable Database Query Caching</h3>
                    <Badge className="bg-green-100 text-green-800">High Impact</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Enable Redis caching for frequently accessed database queries to reduce response time by 40-60%.
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Effort: Low | Current: Disabled</span>
                    <Button size="sm">Apply</Button>
                  </div>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">Optimize Image Compression</h3>
                    <Badge className="bg-yellow-100 text-yellow-800">Medium Impact</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Implement WebP format and lazy loading for images to reduce page load time by 25-35%.
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Effort: Medium | Current: Basic</span>
                    <Button size="sm">Apply</Button>
                  </div>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">Enable CDN for Static Assets</h3>
                    <Badge className="bg-blue-100 text-blue-800">Low Impact</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Use a Content Delivery Network to serve static assets from edge locations closer to users.
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Effort: High | Current: Not configured</span>
                    <Button size="sm">Apply</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Last Updated */}
      <div className="text-center text-sm text-gray-500">
        Last updated: {lastUpdated.toLocaleString()}
      </div>
    </div>
  );
};

export default PerformanceDashboard;
