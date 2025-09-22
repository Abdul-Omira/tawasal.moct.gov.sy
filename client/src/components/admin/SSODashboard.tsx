/**
 * Syrian Ministry of Communication - Citizen Engagement Platform
 * SSO Dashboard Component
 * 
 * @author Abdulwahab Omira <abdul@omiratech.com>
 * @version 1.0.0
 * @license MIT
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Play, 
  Pause, 
  TestTube, 
  Activity, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  RefreshCw,
  Settings,
  Eye,
  Copy,
  ExternalLink,
  Users,
  Shield,
  Key,
  Globe,
  Building,
  UserCheck,
  LogOut,
  LogIn
} from 'lucide-react';
import { ssoService, type SSOProvider, type SSOSession, type SSOUser, type SSOStats, type SSOConfig } from '@/lib/ssoService';

interface SSODashboardProps {
  tenantId?: string;
}

export const SSODashboard: React.FC<SSODashboardProps> = ({ tenantId }) => {
  const [providers, setProviders] = useState<SSOProvider[]>([]);
  const [sessions, setSessions] = useState<SSOSession[]>([]);
  const [users, setUsers] = useState<SSOUser[]>([]);
  const [stats, setStats] = useState<SSOStats | null>(null);
  const [config, setConfig] = useState<SSOConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<SSOProvider | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [testLoading, setTestLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: 'oauth2' as 'saml' | 'oauth2' | 'oidc' | 'government',
    isActive: true,
    config: {
      clientId: '',
      clientSecret: '',
      redirectUri: '',
      authorizationUrl: '',
      tokenUrl: '',
      userInfoUrl: '',
      issuer: '',
      entryPoint: '',
      cert: '',
      logoutUrl: '',
      scopes: [] as string[],
      responseType: 'code',
      responseMode: 'query',
      customParameters: {} as Record<string, any>,
    },
    attributes: {
      id: 'sub',
      name: 'name',
      email: 'email',
      firstName: 'given_name',
      lastName: 'family_name',
      department: 'department',
      position: 'position',
      phone: 'phone_number',
      address: 'address',
      governmentId: 'government_id',
      ministryId: 'ministry_id',
      role: 'role',
      permissions: 'permissions',
    },
  });

  useEffect(() => {
    loadData();
  }, [tenantId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [providersData, sessionsData, usersData, statsData, configData] = await Promise.all([
        ssoService.getProviders(tenantId),
        ssoService.getSessions(tenantId),
        ssoService.getUsers(tenantId),
        ssoService.getStats(tenantId),
        ssoService.getConfig(tenantId),
      ]);

      setProviders(providersData);
      setSessions(sessionsData);
      setUsers(usersData);
      setStats(statsData);
      setConfig(configData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load SSO data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProvider = async () => {
    try {
      const newProvider = await ssoService.createProvider({
        ...formData,
        tenantId,
      });
      setProviders([...providers, newProvider]);
      setShowCreateForm(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create SSO provider');
    }
  };

  const handleUpdateProvider = async (id: string, updates: Partial<SSOProvider>) => {
    try {
      const updatedProvider = await ssoService.updateProvider(id, updates, tenantId);
      if (updatedProvider) {
        setProviders(providers.map(p => p.id === id ? updatedProvider : p));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update SSO provider');
    }
  };

  const handleDeleteProvider = async (id: string) => {
    try {
      await ssoService.deleteProvider(id, tenantId);
      setProviders(providers.filter(p => p.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete SSO provider');
    }
  };

  const handleToggleProvider = async (id: string, isActive: boolean) => {
    await handleUpdateProvider(id, { isActive });
  };

  const handleTestProvider = async (provider: SSOProvider) => {
    try {
      setTestLoading(true);
      const result = await ssoService.testProvider(provider.id);
      setTestResult(result);
      setShowTestModal(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to test SSO provider');
    } finally {
      setTestLoading(false);
    }
  };

  const handleTestConnection = async (provider: SSOProvider) => {
    try {
      setTestLoading(true);
      const result = await ssoService.testConnection(provider.id);
      setTestResult(result);
      setShowTestModal(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to test SSO connection');
    } finally {
      setTestLoading(false);
    }
  };

  const handleTerminateSession = async (sessionId: string) => {
    try {
      await ssoService.terminateSession(sessionId);
      loadData(); // Reload to get updated sessions
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to terminate session');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'oauth2',
      isActive: true,
      config: {
        clientId: '',
        clientSecret: '',
        redirectUri: '',
        authorizationUrl: '',
        tokenUrl: '',
        userInfoUrl: '',
        issuer: '',
        entryPoint: '',
        cert: '',
        logoutUrl: '',
        scopes: [],
        responseType: 'code',
        responseMode: 'query',
        customParameters: {},
      },
      attributes: {
        id: 'sub',
        name: 'name',
        email: 'email',
        firstName: 'given_name',
        lastName: 'family_name',
        department: 'department',
        position: 'position',
        phone: 'phone_number',
        address: 'address',
        governmentId: 'government_id',
        ministryId: 'ministry_id',
        role: 'role',
        permissions: 'permissions',
      },
    });
  };

  const getProviderIcon = (type: string) => {
    switch (type) {
      case 'saml':
        return <Shield className="w-4 h-4" />;
      case 'oauth2':
        return <Key className="w-4 h-4" />;
      case 'oidc':
        return <Globe className="w-4 h-4" />;
      case 'government':
        return <Building className="w-4 h-4" />;
      default:
        return <Settings className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge className="bg-green-100 text-green-800">
        <CheckCircle className="w-3 h-3 mr-1" />
        Active
      </Badge>
    ) : (
      <Badge className="bg-gray-100 text-gray-800">
        <XCircle className="w-3 h-3 mr-1" />
        Inactive
      </Badge>
    );
  };

  const getSessionStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge className="bg-green-100 text-green-800">
        <LogIn className="w-3 h-3 mr-1" />
        Active
      </Badge>
    ) : (
      <Badge className="bg-gray-100 text-gray-800">
        <LogOut className="w-3 h-3 mr-1" />
        Inactive
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading SSO data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">SSO Management</h1>
          <p className="text-muted-foreground">
            Manage Single Sign-On providers and user authentication
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Provider
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Providers</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProviders}</div>
              <p className="text-xs text-muted-foreground">
                {stats.activeProviders} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeSessions}</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalSessions} total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.loginAttempts > 0 
                  ? Math.round((stats.successfulLogins / stats.loginAttempts) * 100)
                  : 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.failedLogins} failed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Session Duration</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(stats.averageSessionDuration / 60)}m</div>
              <p className="text-xs text-muted-foreground">
                Last 24 hours
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="providers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="providers">Providers</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="providers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>SSO Providers</CardTitle>
              <CardDescription>
                Manage your Single Sign-On provider configurations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Last Used</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {providers.map((provider) => (
                    <TableRow key={provider.id}>
                      <TableCell className="font-medium">{provider.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getProviderIcon(provider.type)}
                          <span className="capitalize">{provider.type}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(provider.isActive)}</TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {provider.usageCount} uses
                        </div>
                      </TableCell>
                      <TableCell>
                        {provider.lastUsed 
                          ? new Date(provider.lastUsed).toLocaleString()
                          : 'Never'
                        }
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleTestProvider(provider)}
                            disabled={testLoading}
                          >
                            <TestTube className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleTestConnection(provider)}
                            disabled={testLoading}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleProvider(provider.id, !provider.isActive)}
                          >
                            {provider.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedProvider(provider)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteProvider(provider.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Sessions</CardTitle>
              <CardDescription>
                Monitor and manage user SSO sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Last Activity</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.slice(0, 20).map((session) => (
                    <TableRow key={session.id}>
                      <TableCell className="font-medium">
                        {users.find(u => u.id === session.userId)?.email || 'Unknown'}
                      </TableCell>
                      <TableCell>
                        {providers.find(p => p.id === session.providerId)?.name || 'Unknown'}
                      </TableCell>
                      <TableCell>{getSessionStatusBadge(session.isActive)}</TableCell>
                      <TableCell>{session.ipAddress}</TableCell>
                      <TableCell>
                        {new Date(session.lastActivity).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedProvider(providers.find(p => p.id === session.providerId) || null)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleTerminateSession(session.id)}
                          >
                            <LogOut className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>SSO Users</CardTitle>
              <CardDescription>
                Manage users authenticated through SSO providers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.slice(0, 20).map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.firstName} {user.lastName}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        {providers.find(p => p.id === user.providerId)?.name || 'Unknown'}
                      </TableCell>
                      <TableCell>{user.department || '-'}</TableCell>
                      <TableCell>
                        {user.lastLogin 
                          ? new Date(user.lastLogin).toLocaleString()
                          : 'Never'
                        }
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(user.isActive)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Top Providers</CardTitle>
                <CardDescription>
                  Most frequently used SSO providers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stats?.topProviders.map((provider, index) => (
                    <div key={provider.providerId} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{provider.name}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{provider.usageCount}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {Math.round(provider.successRate)}% success
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Logins</CardTitle>
                <CardDescription>
                  Latest SSO authentication attempts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stats?.recentLogins.slice(0, 5).map((login, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {login.success ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                        <span className="text-sm">{login.userId}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(login.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Provider Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Create SSO Provider</CardTitle>
              <CardDescription>
                Configure a new Single Sign-On provider
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="My SSO Provider"
                  />
                </div>
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: 'saml' | 'oauth2' | 'oidc' | 'government') => 
                      setFormData({ ...formData, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="oauth2">OAuth 2.0</SelectItem>
                      <SelectItem value="oidc">OpenID Connect</SelectItem>
                      <SelectItem value="saml">SAML 2.0</SelectItem>
                      <SelectItem value="government">Government ID</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="clientId">Client ID</Label>
                  <Input
                    id="clientId"
                    value={formData.config.clientId}
                    onChange={(e) => setFormData({
                      ...formData,
                      config: { ...formData.config, clientId: e.target.value }
                    })}
                    placeholder="your-client-id"
                  />
                </div>
                <div>
                  <Label htmlFor="clientSecret">Client Secret</Label>
                  <Input
                    id="clientSecret"
                    type="password"
                    value={formData.config.clientSecret}
                    onChange={(e) => setFormData({
                      ...formData,
                      config: { ...formData.config, clientSecret: e.target.value }
                    })}
                    placeholder="your-client-secret"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="redirectUri">Redirect URI</Label>
                  <Input
                    id="redirectUri"
                    value={formData.config.redirectUri}
                    onChange={(e) => setFormData({
                      ...formData,
                      config: { ...formData.config, redirectUri: e.target.value }
                    })}
                    placeholder="https://example.com/auth/callback"
                  />
                </div>
                <div>
                  <Label htmlFor="authorizationUrl">Authorization URL</Label>
                  <Input
                    id="authorizationUrl"
                    value={formData.config.authorizationUrl}
                    onChange={(e) => setFormData({
                      ...formData,
                      config: { ...formData.config, authorizationUrl: e.target.value }
                    })}
                    placeholder="https://example.com/oauth/authorize"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tokenUrl">Token URL</Label>
                  <Input
                    id="tokenUrl"
                    value={formData.config.tokenUrl}
                    onChange={(e) => setFormData({
                      ...formData,
                      config: { ...formData.config, tokenUrl: e.target.value }
                    })}
                    placeholder="https://example.com/oauth/token"
                  />
                </div>
                <div>
                  <Label htmlFor="userInfoUrl">User Info URL</Label>
                  <Input
                    id="userInfoUrl"
                    value={formData.config.userInfoUrl}
                    onChange={(e) => setFormData({
                      ...formData,
                      config: { ...formData.config, userInfoUrl: e.target.value }
                    })}
                    placeholder="https://example.com/oauth/userinfo"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <Label htmlFor="isActive">Active</Label>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateProvider}>
                  Create Provider
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Test Result Modal */}
      {showTestModal && testResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Test Result</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                {testResult.success ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
                <span className="font-medium">
                  {testResult.success ? 'Test Successful' : 'Test Failed'}
                </span>
              </div>
              
              <div>
                <Label>Response Time</Label>
                <p className="text-sm text-muted-foreground">{testResult.responseTime}ms</p>
              </div>
              
              {testResult.error && (
                <div>
                  <Label>Error</Label>
                  <p className="text-sm text-red-600">{testResult.error}</p>
                </div>
              )}
              
              {testResult.details && (
                <div>
                  <Label>Details</Label>
                  <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                    {JSON.stringify(testResult.details, null, 2)}
                  </pre>
                </div>
              )}

              <div className="flex justify-end">
                <Button onClick={() => setShowTestModal(false)}>
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default SSODashboard;
