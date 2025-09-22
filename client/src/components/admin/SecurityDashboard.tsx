import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { securityService, SecurityEvent, SecurityAlert, ThreatIntelligence, SecurityReport } from '@/lib/securityService';
import { 
  Shield, 
  AlertTriangle, 
  Eye, 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  Plus,
  Settings,
  BarChart3,
  MapPin,
  Clock,
  User,
  Globe,
  FileText,
  Zap,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

interface SecurityDashboardProps {
  tenantId?: string;
}

export const SecurityDashboard: React.FC<SecurityDashboardProps> = ({ tenantId }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([]);
  const [threatIntelligence, setThreatIntelligence] = useState<ThreatIntelligence[]>([]);
  const [securityReports, setSecurityReports] = useState<SecurityReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    severity: '',
    status: '',
    type: '',
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    endDate: new Date(),
  });

  useEffect(() => {
    loadSecurityData();
  }, [tenantId, filters]);

  const loadSecurityData = async () => {
    setLoading(true);
    try {
      const [events, alerts, threats, reports] = await Promise.all([
        securityService.getSecurityEvents({ ...filters, tenantId }),
        securityService.getSecurityAlerts({ tenantId }),
        securityService.getThreatIntelligence({ tenantId }),
        securityService.getSecurityReports(tenantId),
      ]);
      
      setSecurityEvents(events);
      setSecurityAlerts(alerts);
      setThreatIntelligence(threats);
      setSecurityReports(reports);
    } catch (error) {
      console.error('Failed to load security data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-red-600';
      case 'investigating': return 'text-yellow-600';
      case 'resolved': return 'text-green-600';
      case 'false_positive': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      await securityService.acknowledgeAlert(alertId, 'current-user');
      await loadSecurityData();
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    }
  };

  const handleResolveAlert = async (alertId: string, resolution: string) => {
    try {
      await securityService.resolveAlert(alertId, resolution, 'current-user');
      await loadSecurityData();
    } catch (error) {
      console.error('Failed to resolve alert:', error);
    }
  };

  const generateSecurityReport = async () => {
    try {
      const report = await securityService.generateSecurityReport({
        name: `Security Report - ${new Date().toLocaleDateString()}`,
        type: 'incident',
        period: { start: filters.startDate, end: filters.endDate },
        generatedBy: 'current-user',
        tenantId,
      });
      setSecurityReports(prev => [report, ...prev]);
    } catch (error) {
      console.error('Failed to generate security report:', error);
    }
  };

  const OverviewTab = () => (
    <div className="space-y-6">
      {/* Security Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{securityEvents.length}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {securityAlerts.filter(a => a.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">
              {securityAlerts.filter(a => a.severity === 'critical').length} critical
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Threats Detected</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {threatIntelligence.filter(t => t.isActive).length}
            </div>
            <p className="text-xs text-muted-foreground">
              {threatIntelligence.filter(t => t.threatLevel === 'critical').length} critical
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">94%</div>
            <p className="text-xs text-muted-foreground">
              +2% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Security Events */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Security Events</CardTitle>
          <CardDescription>Latest security events and incidents</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {securityEvents.slice(0, 5).map((event) => (
              <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className={`w-3 h-3 rounded-full ${getSeverityColor(event.severity)}`} />
                  <div>
                    <p className="font-medium">{event.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {event.source} • {event.timestamp.toLocaleString()}
                    </p>
                  </div>
                </div>
                <Badge variant={event.status === 'active' ? 'destructive' : 'secondary'}>
                  {event.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Threat Map */}
      <Card>
        <CardHeader>
          <CardTitle>Threat Map</CardTitle>
          <CardDescription>Geographic distribution of security threats</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Threat map visualization</p>
              <p className="text-sm text-gray-400">Interactive map showing threat locations</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const EventsTab = () => (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select value={filters.severity} onValueChange={(value) => setFilters(prev => ({ ...prev, severity: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Severities</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="investigating">Investigating</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="false_positive">False Positive</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.type} onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Event Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                <SelectItem value="login_attempt">Login Attempt</SelectItem>
                <SelectItem value="failed_login">Failed Login</SelectItem>
                <SelectItem value="suspicious_activity">Suspicious Activity</SelectItem>
                <SelectItem value="data_breach">Data Breach</SelectItem>
                <SelectItem value="unauthorized_access">Unauthorized Access</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={loadSecurityData} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Events Table */}
      <Card>
        <CardHeader>
          <CardTitle>Security Events</CardTitle>
          <CardDescription>Detailed view of all security events</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Severity</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {securityEvents.map((event) => (
                <TableRow key={event.id}>
                  <TableCell>
                    <Badge className={getSeverityColor(event.severity)}>
                      {event.severity}
                    </Badge>
                  </TableCell>
                  <TableCell>{event.type}</TableCell>
                  <TableCell>{event.description}</TableCell>
                  <TableCell>{event.source}</TableCell>
                  <TableCell>{event.ipAddress || '-'}</TableCell>
                  <TableCell>{event.timestamp.toLocaleString()}</TableCell>
                  <TableCell>
                    <span className={getStatusColor(event.status)}>
                      {event.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline">
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  const AlertsTab = () => (
    <div className="space-y-6">
      {/* Active Alerts */}
      <Card>
        <CardHeader>
          <CardTitle>Active Alerts</CardTitle>
          <CardDescription>Security alerts requiring attention</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {securityAlerts.filter(alert => alert.status === 'active').map((alert) => (
              <Alert key={alert.id} className={alert.severity === 'critical' ? 'border-red-200 bg-red-50' : ''}>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{alert.title}</p>
                      <p className="text-sm text-muted-foreground">{alert.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {alert.category} • {alert.createdAt.toLocaleString()}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleAcknowledgeAlert(alert.id)}
                      >
                        Acknowledge
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleResolveAlert(alert.id, 'Resolved by admin')}
                      >
                        Resolve
                      </Button>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* All Alerts Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Alerts</CardTitle>
          <CardDescription>Complete list of security alerts</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Severity</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {securityAlerts.map((alert) => (
                <TableRow key={alert.id}>
                  <TableCell>
                    <Badge className={getSeverityColor(alert.severity)}>
                      {alert.severity}
                    </Badge>
                  </TableCell>
                  <TableCell>{alert.title}</TableCell>
                  <TableCell>{alert.category}</TableCell>
                  <TableCell>
                    <Badge variant={alert.status === 'active' ? 'destructive' : 'secondary'}>
                      {alert.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{alert.createdAt.toLocaleString()}</TableCell>
                  <TableCell>{alert.assignedTo || '-'}</TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline">
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  const ThreatIntelligenceTab = () => (
    <div className="space-y-6">
      {/* Threat Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Active Threats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {threatIntelligence.filter(t => t.isActive).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Critical Threats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {threatIntelligence.filter(t => t.threatLevel === 'critical').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Threat Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(threatIntelligence.map(t => t.category)).size}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Threat Intelligence Table */}
      <Card>
        <CardHeader>
          <CardTitle>Threat Intelligence</CardTitle>
          <CardDescription>Known threats and indicators of compromise</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Threat Level</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Confidence</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Seen</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {threatIntelligence.map((threat) => (
                <TableRow key={threat.id}>
                  <TableCell>{threat.type}</TableCell>
                  <TableCell className="font-mono text-sm">{threat.value}</TableCell>
                  <TableCell>
                    <Badge className={getSeverityColor(threat.threatLevel)}>
                      {threat.threatLevel}
                    </Badge>
                  </TableCell>
                  <TableCell>{threat.category}</TableCell>
                  <TableCell>{Math.round(threat.confidence * 100)}%</TableCell>
                  <TableCell>
                    <Badge variant={threat.isActive ? 'destructive' : 'secondary'}>
                      {threat.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>{threat.lastSeen.toLocaleString()}</TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline">
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  const ReportsTab = () => (
    <div className="space-y-6">
      {/* Generate Report */}
      <Card>
        <CardHeader>
          <CardTitle>Generate Security Report</CardTitle>
          <CardDescription>Create comprehensive security reports</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Report Name</label>
                <Input placeholder="Enter report name" />
              </div>
              <div>
                <label className="text-sm font-medium">Report Type</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="incident">Incident Report</SelectItem>
                    <SelectItem value="threat">Threat Analysis</SelectItem>
                    <SelectItem value="compliance">Compliance Report</SelectItem>
                    <SelectItem value="vulnerability">Vulnerability Assessment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={generateSecurityReport} className="w-full">
              <FileText className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Reports List */}
      <Card>
        <CardHeader>
          <CardTitle>Security Reports</CardTitle>
          <CardDescription>Generated security reports and assessments</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Generated</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {securityReports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell>{report.name}</TableCell>
                  <TableCell>{report.type}</TableCell>
                  <TableCell>
                    {report.period.start.toLocaleDateString()} - {report.period.end.toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant={report.status === 'completed' ? 'default' : 'secondary'}>
                      {report.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{report.generatedAt.toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                      <Button size="sm" variant="outline">
                        View
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Security Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor security events, threats, and compliance status
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={loadSecurityData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="threats">Threat Intelligence</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab />
        </TabsContent>

        <TabsContent value="events">
          <EventsTab />
        </TabsContent>

        <TabsContent value="alerts">
          <AlertsTab />
        </TabsContent>

        <TabsContent value="threats">
          <ThreatIntelligenceTab />
        </TabsContent>

        <TabsContent value="reports">
          <ReportsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SecurityDashboard;
