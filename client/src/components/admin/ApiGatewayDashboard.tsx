import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { apiGatewayService, ApiKey, ApiUsage, RateLimit, ApiDocumentation } from '@/lib/apiGatewayService';
import { 
  Key, 
  Activity, 
  Shield, 
  BookOpen, 
  Settings, 
  BarChart3, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  Eye,
  Copy,
  Download,
  Upload,
  Zap,
  Clock,
  Globe,
  Server,
  Database,
  Lock,
  Unlock
} from 'lucide-react';

interface ApiGatewayDashboardProps {
  tenantId?: string;
}

export const ApiGatewayDashboard: React.FC<ApiGatewayDashboardProps> = ({ tenantId }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [apiUsage, setApiUsage] = useState<ApiUsage[]>([]);
  const [rateLimits, setRateLimits] = useState<RateLimit[]>([]);
  const [apiDocumentation, setApiDocumentation] = useState<ApiDocumentation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateApiKey, setShowCreateApiKey] = useState(false);
  const [showCreateRateLimit, setShowCreateRateLimit] = useState(false);
  const [showCreateDocumentation, setShowCreateDocumentation] = useState(false);

  useEffect(() => {
    loadApiGatewayData();
  }, [tenantId]);

  const loadApiGatewayData = async () => {
    setLoading(true);
    try {
      const [keys, usage, limits, docs] = await Promise.all([
        apiGatewayService.getApiKeys(tenantId),
        apiGatewayService.getApiUsage({ tenantId }),
        apiGatewayService.getRateLimits(tenantId),
        apiGatewayService.getApiDocumentation(tenantId),
      ]);
      
      setApiKeys(keys);
      setApiUsage(usage);
      setRateLimits(limits);
      setApiDocumentation(docs);
    } catch (error) {
      console.error('Failed to load API gateway data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateApiKey = async (keyData: any) => {
    try {
      const newKey = await apiGatewayService.createApiKey(keyData);
      setApiKeys(prev => [newKey, ...prev]);
      setShowCreateApiKey(false);
    } catch (error) {
      console.error('Failed to create API key:', error);
    }
  };

  const handleDeleteApiKey = async (id: string) => {
    try {
      const success = await apiGatewayService.deleteApiKey(id);
      if (success) {
        setApiKeys(prev => prev.filter(key => key.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete API key:', error);
    }
  };

  const handleRegenerateApiKey = async (id: string) => {
    try {
      const updatedKey = await apiGatewayService.regenerateApiKey(id);
      setApiKeys(prev => prev.map(key => key.id === id ? updatedKey : key));
    } catch (error) {
      console.error('Failed to regenerate API key:', error);
    }
  };

  const handleCreateRateLimit = async (limitData: any) => {
    try {
      const newLimit = await apiGatewayService.createRateLimit(limitData);
      setRateLimits(prev => [newLimit, ...prev]);
      setShowCreateRateLimit(false);
    } catch (error) {
      console.error('Failed to create rate limit:', error);
    }
  };

  const handleDeleteRateLimit = async (id: string) => {
    try {
      const success = await apiGatewayService.deleteRateLimit(id);
      if (success) {
        setRateLimits(prev => prev.filter(limit => limit.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete rate limit:', error);
    }
  };

  const handleCreateDocumentation = async (docData: any) => {
    try {
      const newDoc = await apiGatewayService.createApiDocumentation(docData);
      setApiDocumentation(prev => [newDoc, ...prev]);
      setShowCreateDocumentation(false);
    } catch (error) {
      console.error('Failed to create documentation:', error);
    }
  };

  const handleDeleteDocumentation = async (id: string) => {
    try {
      const success = await apiGatewayService.deleteApiDocumentation(id);
      if (success) {
        setApiDocumentation(prev => prev.filter(doc => doc.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete documentation:', error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600';
      case 'inactive': return 'text-red-600';
      case 'expired': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'inactive': return <Badge className="bg-red-100 text-red-800">Inactive</Badge>;
      case 'expired': return <Badge className="bg-orange-100 text-orange-800">Expired</Badge>;
      default: return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const OverviewTab = () => (
    <div className="space-y-6">
      {/* API Gateway Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total API Keys</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{apiKeys.length}</div>
            <p className="text-xs text-muted-foreground">
              {apiKeys.filter(key => key.isActive).length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Requests</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{apiUsage.length}</div>
            <p className="text-xs text-muted-foreground">
              Last 24 hours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rate Limits</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rateLimits.length}</div>
            <p className="text-xs text-muted-foreground">
              {rateLimits.filter(limit => limit.isActive).length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documentation</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{apiDocumentation.length}</div>
            <p className="text-xs text-muted-foreground">
              API docs available
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent API Usage */}
      <Card>
        <CardHeader>
          <CardTitle>Recent API Usage</CardTitle>
          <CardDescription>Latest API requests and responses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {apiUsage.slice(0, 5).map((usage) => (
              <div key={usage.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className={`w-3 h-3 rounded-full ${
                    usage.statusCode >= 200 && usage.statusCode < 300 ? 'bg-green-500' : 
                    usage.statusCode >= 400 ? 'bg-red-500' : 'bg-yellow-500'
                  }`} />
                  <div>
                    <p className="font-medium">{usage.method} {usage.endpoint}</p>
                    <p className="text-sm text-muted-foreground">
                      {usage.statusCode} • {usage.responseTime}ms • {usage.timestamp.toLocaleString()}
                    </p>
                  </div>
                </div>
                <Badge variant={usage.statusCode >= 200 && usage.statusCode < 300 ? 'default' : 'destructive'}>
                  {usage.statusCode}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* API Health Status */}
      <Card>
        <CardHeader>
          <CardTitle>API Health Status</CardTitle>
          <CardDescription>Current status of API endpoints</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span>API Gateway: Healthy</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span>Rate Limiting: Active</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span>Authentication: Working</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const ApiKeysTab = () => (
    <div className="space-y-6">
      {/* Create API Key Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">API Keys</h2>
          <p className="text-muted-foreground">Manage API keys and access tokens</p>
        </div>
        <Button onClick={() => setShowCreateApiKey(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create API Key
        </Button>
      </div>

      {/* API Keys Table */}
      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Key</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead>Rate Limit</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Used</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apiKeys.map((key) => (
                <TableRow key={key.id}>
                  <TableCell className="font-medium">{key.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                        {key.key.substring(0, 8)}...
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(key.key)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {key.permissions.length} permissions
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {key.rateLimit.requests}/{key.rateLimit.window}s
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(key.isActive ? 'active' : 'inactive')}
                  </TableCell>
                  <TableCell>
                    {key.lastUsed ? key.lastUsed.toLocaleString() : 'Never'}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleRegenerateApiKey(key.id)}
                      >
                        <RefreshCw className="h-3 w-3" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleDeleteApiKey(key.id)}
                      >
                        <Trash2 className="h-3 w-3" />
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

  const RateLimitsTab = () => (
    <div className="space-y-6">
      {/* Create Rate Limit Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Rate Limits</h2>
          <p className="text-muted-foreground">Configure API rate limiting rules</p>
        </div>
        <Button onClick={() => setShowCreateRateLimit(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Rate Limit
        </Button>
      </div>

      {/* Rate Limits Table */}
      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Scope</TableHead>
                <TableHead>Endpoint</TableHead>
                <TableHead>Rate Limit</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rateLimits.map((limit) => (
                <TableRow key={limit.id}>
                  <TableCell>
                    {limit.tenantId ? 'Tenant' : limit.apiKeyId ? 'API Key' : 'Global'}
                  </TableCell>
                  <TableCell>
                    {limit.endpoint || 'All endpoints'}
                  </TableCell>
                  <TableCell>
                    {limit.requests} requests per {limit.window} seconds
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(limit.isActive ? 'active' : 'inactive')}
                  </TableCell>
                  <TableCell>
                    {limit.createdAt.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleDeleteRateLimit(limit.id)}
                      >
                        <Trash2 className="h-3 w-3" />
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

  const DocumentationTab = () => (
    <div className="space-y-6">
      {/* Create Documentation Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">API Documentation</h2>
          <p className="text-muted-foreground">Manage API documentation and specifications</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => apiGatewayService.generateApiDocumentation(tenantId)}>
            <Zap className="h-4 w-4 mr-2" />
            Auto-generate
          </Button>
          <Button onClick={() => setShowCreateDocumentation(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Documentation
          </Button>
        </div>
      </div>

      {/* Documentation Table */}
      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Base URL</TableHead>
                <TableHead>Endpoints</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apiDocumentation.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium">{doc.title}</TableCell>
                  <TableCell>{doc.version}</TableCell>
                  <TableCell>
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                      {doc.baseUrl}
                    </code>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {doc.endpoints.length} endpoints
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(doc.isPublic ? 'public' : 'private')}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Download className="h-3 w-3" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleDeleteDocumentation(doc.id)}
                      >
                        <Trash2 className="h-3 w-3" />
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

  const AnalyticsTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>API Analytics</CardTitle>
          <CardDescription>Usage statistics and performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Analytics dashboard</p>
              <p className="text-sm text-gray-400">Interactive charts and metrics</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Top Endpoints</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>/api/forms</span>
                <span className="font-medium">1,234 requests</span>
              </div>
              <div className="flex justify-between">
                <span>/api/submissions</span>
                <span className="font-medium">856 requests</span>
              </div>
              <div className="flex justify-between">
                <span>/api/analytics</span>
                <span className="font-medium">432 requests</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Error Rates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>4xx Errors</span>
                <span className="font-medium text-yellow-600">2.3%</span>
              </div>
              <div className="flex justify-between">
                <span>5xx Errors</span>
                <span className="font-medium text-red-600">0.1%</span>
              </div>
              <div className="flex justify-between">
                <span>Success Rate</span>
                <span className="font-medium text-green-600">97.6%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
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
          <h1 className="text-3xl font-bold">API Gateway</h1>
          <p className="text-muted-foreground">
            Manage API keys, rate limiting, and documentation
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={loadApiGatewayData}>
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
          <TabsTrigger value="keys">API Keys</TabsTrigger>
          <TabsTrigger value="limits">Rate Limits</TabsTrigger>
          <TabsTrigger value="docs">Documentation</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab />
        </TabsContent>

        <TabsContent value="keys">
          <ApiKeysTab />
        </TabsContent>

        <TabsContent value="limits">
          <RateLimitsTab />
        </TabsContent>

        <TabsContent value="docs">
          <DocumentationTab />
        </TabsContent>

        <TabsContent value="analytics">
          <AnalyticsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ApiGatewayDashboard;
