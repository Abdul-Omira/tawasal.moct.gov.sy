/**
 * Syrian Ministry of Communication - Citizen Engagement Platform
 * Webhook Dashboard Component
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
import { Progress } from '@/components/ui/progress';
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
  ExternalLink
} from 'lucide-react';
import { webhookService, type Webhook, type WebhookDelivery, type WebhookStats, type WebhookTestResult } from '@/lib/webhookService';

interface WebhookDashboardProps {
  tenantId?: string;
}

export const WebhookDashboard: React.FC<WebhookDashboardProps> = ({ tenantId }) => {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [stats, setStats] = useState<WebhookStats | null>(null);
  const [availableEvents, setAvailableEvents] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedWebhook, setSelectedWebhook] = useState<Webhook | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [testResult, setTestResult] = useState<WebhookTestResult | null>(null);
  const [testLoading, setTestLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    events: [] as string[],
    secret: '',
    isActive: true,
    retryPolicy: {
      maxRetries: 3,
      retryDelay: 1000,
      backoffMultiplier: 2,
    },
    headers: {} as Record<string, string>,
    filters: {
      formIds: [] as string[],
      eventTypes: [] as string[],
      conditions: {} as Record<string, any>,
    },
  });

  useEffect(() => {
    loadData();
  }, [tenantId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [webhooksData, deliveriesData, statsData, eventsData] = await Promise.all([
        webhookService.getWebhooks(tenantId),
        webhookService.getWebhookDeliveries(),
        webhookService.getWebhookStats(tenantId),
        webhookService.getAvailableEvents(),
      ]);

      setWebhooks(webhooksData);
      setDeliveries(deliveriesData);
      setStats(statsData);
      setAvailableEvents(eventsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load webhook data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWebhook = async () => {
    try {
      const newWebhook = await webhookService.createWebhook({
        ...formData,
        tenantId,
      });
      setWebhooks([...webhooks, newWebhook]);
      setShowCreateForm(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create webhook');
    }
  };

  const handleUpdateWebhook = async (id: string, updates: Partial<Webhook>) => {
    try {
      const updatedWebhook = await webhookService.updateWebhook(id, updates, tenantId);
      if (updatedWebhook) {
        setWebhooks(webhooks.map(w => w.id === id ? updatedWebhook : w));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update webhook');
    }
  };

  const handleDeleteWebhook = async (id: string) => {
    try {
      await webhookService.deleteWebhook(id, tenantId);
      setWebhooks(webhooks.filter(w => w.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete webhook');
    }
  };

  const handleToggleWebhook = async (id: string, isActive: boolean) => {
    await handleUpdateWebhook(id, { isActive });
  };

  const handleTestWebhook = async (webhook: Webhook) => {
    try {
      setTestLoading(true);
      const result = await webhookService.testWebhook(webhook.id);
      setTestResult(result);
      setShowTestModal(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to test webhook');
    } finally {
      setTestLoading(false);
    }
  };

  const handleRetryDelivery = async (deliveryId: string) => {
    try {
      await webhookService.retryWebhookDelivery(deliveryId);
      loadData(); // Reload to get updated delivery status
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to retry delivery');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      url: '',
      events: [],
      secret: '',
      isActive: true,
      retryPolicy: {
        maxRetries: 3,
        retryDelay: 1000,
        backoffMultiplier: 2,
      },
      headers: {},
      filters: {
        formIds: [],
        eventTypes: [],
        conditions: {},
      },
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      delivered: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      failed: { color: 'bg-red-100 text-red-800', icon: XCircle },
      retrying: { color: 'bg-blue-100 text-blue-800', icon: RefreshCw },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading webhook data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Webhook Management</h1>
          <p className="text-muted-foreground">
            Manage webhooks for real-time event notifications
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Webhook
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
              <CardTitle className="text-sm font-medium">Total Webhooks</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalWebhooks}</div>
              <p className="text-xs text-muted-foreground">
                {stats.activeWebhooks} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Deliveries</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalDeliveries}</div>
              <p className="text-xs text-muted-foreground">
                {stats.successfulDeliveries} successful
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
                {stats.totalDeliveries > 0 
                  ? Math.round((stats.successfulDeliveries / stats.totalDeliveries) * 100)
                  : 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.failedDeliveries} failed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageResponseTime}ms</div>
              <p className="text-xs text-muted-foreground">
                Last 24 hours
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="webhooks" className="space-y-4">
        <TabsList>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="deliveries">Deliveries</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="webhooks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Webhooks</CardTitle>
              <CardDescription>
                Manage your webhook endpoints and configurations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead>Events</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Success Rate</TableHead>
                    <TableHead>Last Triggered</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {webhooks.map((webhook) => (
                    <TableRow key={webhook.id}>
                      <TableCell className="font-medium">{webhook.name}</TableCell>
                      <TableCell className="max-w-xs truncate">{webhook.url}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {webhook.events.slice(0, 2).map((event) => (
                            <Badge key={event} variant="secondary" className="text-xs">
                              {event}
                            </Badge>
                          ))}
                          {webhook.events.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{webhook.events.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(webhook.isActive ? 'active' : 'inactive')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress 
                            value={webhook.successCount + webhook.failureCount > 0 
                              ? (webhook.successCount / (webhook.successCount + webhook.failureCount)) * 100 
                              : 0
                            } 
                            className="w-16" 
                          />
                          <span className="text-sm text-muted-foreground">
                            {webhook.successCount + webhook.failureCount > 0 
                              ? Math.round((webhook.successCount / (webhook.successCount + webhook.failureCount)) * 100)
                              : 0}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {webhook.lastTriggered 
                          ? new Date(webhook.lastTriggered).toLocaleString()
                          : 'Never'
                        }
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleTestWebhook(webhook)}
                            disabled={testLoading}
                          >
                            <TestTube className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleWebhook(webhook.id, !webhook.isActive)}
                          >
                            {webhook.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedWebhook(webhook)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteWebhook(webhook.id)}
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

        <TabsContent value="deliveries" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Deliveries</CardTitle>
              <CardDescription>
                Monitor webhook delivery attempts and responses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Webhook</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Attempts</TableHead>
                    <TableHead>Response Time</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deliveries.slice(0, 20).map((delivery) => (
                    <TableRow key={delivery.id}>
                      <TableCell className="font-medium">
                        {webhooks.find(w => w.id === delivery.webhookId)?.name || 'Unknown'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{delivery.eventType}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(delivery.status)}</TableCell>
                      <TableCell>
                        {delivery.attempts}/{delivery.maxAttempts}
                      </TableCell>
                      <TableCell>
                        {delivery.response?.statusCode ? `${delivery.responseTime}ms` : '-'}
                      </TableCell>
                      <TableCell>
                        {new Date(delivery.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedWebhook(webhooks.find(w => w.id === delivery.webhookId) || null)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {delivery.status === 'failed' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRetryDelivery(delivery.id)}
                            >
                              <RefreshCw className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
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
                <CardTitle>Top Events</CardTitle>
                <CardDescription>
                  Most frequently triggered webhook events
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stats?.topEvents.map((event, index) => (
                    <div key={event.eventType} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{event.eventType}</span>
                      <Badge variant="secondary">{event.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Latest webhook delivery attempts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stats?.recentDeliveries.slice(0, 5).map((delivery) => (
                    <div key={delivery.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(delivery.status)}
                        <span className="text-sm">{delivery.eventType}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(delivery.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Webhook Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Create Webhook</CardTitle>
              <CardDescription>
                Configure a new webhook endpoint for event notifications
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
                    placeholder="My Webhook"
                  />
                </div>
                <div>
                  <Label htmlFor="url">URL</Label>
                  <Input
                    id="url"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    placeholder="https://example.com/webhook"
                  />
                </div>
              </div>

              <div>
                <Label>Events</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {availableEvents.map((event) => (
                    <div key={event} className="flex items-center space-x-2">
                      <Checkbox
                        id={event}
                        checked={formData.events.includes(event)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFormData({
                              ...formData,
                              events: [...formData.events, event],
                            });
                          } else {
                            setFormData({
                              ...formData,
                              events: formData.events.filter(e => e !== event),
                            });
                          }
                        }}
                      />
                      <Label htmlFor={event} className="text-sm">{event}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="secret">Secret</Label>
                <Input
                  id="secret"
                  value={formData.secret}
                  onChange={(e) => setFormData({ ...formData, secret: e.target.value })}
                  placeholder="Webhook secret for verification"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="maxRetries">Max Retries</Label>
                  <Input
                    id="maxRetries"
                    type="number"
                    value={formData.retryPolicy.maxRetries}
                    onChange={(e) => setFormData({
                      ...formData,
                      retryPolicy: {
                        ...formData.retryPolicy,
                        maxRetries: parseInt(e.target.value) || 0,
                      },
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="retryDelay">Retry Delay (ms)</Label>
                  <Input
                    id="retryDelay"
                    type="number"
                    value={formData.retryPolicy.retryDelay}
                    onChange={(e) => setFormData({
                      ...formData,
                      retryPolicy: {
                        ...formData.retryPolicy,
                        retryDelay: parseInt(e.target.value) || 0,
                      },
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="backoffMultiplier">Backoff Multiplier</Label>
                  <Input
                    id="backoffMultiplier"
                    type="number"
                    step="0.1"
                    value={formData.retryPolicy.backoffMultiplier}
                    onChange={(e) => setFormData({
                      ...formData,
                      retryPolicy: {
                        ...formData.retryPolicy,
                        backoffMultiplier: parseFloat(e.target.value) || 1,
                      },
                    })}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: !!checked })}
                />
                <Label htmlFor="isActive">Active</Label>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateWebhook}>
                  Create Webhook
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
              
              {testResult.statusCode && (
                <div>
                  <Label>Status Code</Label>
                  <Badge variant="outline">{testResult.statusCode}</Badge>
                </div>
              )}
              
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
              
              {testResult.response && (
                <div>
                  <Label>Response</Label>
                  <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                    {JSON.stringify(testResult.response, null, 2)}
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

export default WebhookDashboard;
