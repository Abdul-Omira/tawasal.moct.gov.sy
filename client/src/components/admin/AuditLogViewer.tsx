/**
 * Audit Log Viewer Component
 * Displays and manages audit logs with filtering and search capabilities
 * 
 * @author Syrian Ministry of Communications
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  Shield, 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  Eye, 
  Calendar,
  User,
  Activity,
  MoreHorizontal,
  AlertTriangle,
  CheckCircle,
  Info,
  XCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface AuditLog {
  id: string;
  userId?: number;
  action: string;
  resourceType?: string;
  resourceId?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  user?: {
    username: string;
    name?: string;
  };
}

interface AuditLogFilters {
  userId?: number;
  action?: string;
  resourceType?: string;
  resourceId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

const AuditLogViewer: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<AuditLogFilters>({
    page: 1,
    limit: 20,
  });
  const [totalLogs, setTotalLogs] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Load audit logs on component mount
  useEffect(() => {
    loadAuditLogs();
  }, [filters]);

  // Load audit logs from API
  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      
      if (filters.userId) queryParams.append('userId', filters.userId.toString());
      if (filters.action) queryParams.append('action', filters.action);
      if (filters.resourceType) queryParams.append('resourceType', filters.resourceType);
      if (filters.resourceId) queryParams.append('resourceId', filters.resourceId);
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);
      if (filters.page) queryParams.append('page', filters.page.toString());
      if (filters.limit) queryParams.append('limit', filters.limit.toString());

      const response = await fetch(`/api/audit-logs?${queryParams.toString()}`);
      const result = await response.json();

      if (result.success) {
        setLogs(result.data);
        setTotalLogs(result.total);
        setTotalPages(result.totalPages);
      } else {
        setError(result.message || 'فشل في جلب سجلات التدقيق');
      }
    } catch (error) {
      console.error('Error loading audit logs:', error);
      setError('حدث خطأ في الاتصال');
    } finally {
      setLoading(false);
    }
  };

  // Export audit logs
  const handleExport = async () => {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value.toString());
      });

      const response = await fetch(`/api/audit-logs/export?${queryParams.toString()}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        toast.success('تم تصدير سجلات التدقيق بنجاح');
      } else {
        toast.error('فشل في تصدير سجلات التدقيق');
      }
    } catch (error) {
      console.error('Error exporting audit logs:', error);
      toast.error('حدث خطأ في التصدير');
    }
  };

  // Get action icon based on action type
  const getActionIcon = (action: string) => {
    if (action.includes('login') || action.includes('auth')) {
      return <Shield className="w-4 h-4 text-blue-600" />;
    } else if (action.includes('create') || action.includes('add')) {
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    } else if (action.includes('update') || action.includes('edit')) {
      return <Activity className="w-4 h-4 text-yellow-600" />;
    } else if (action.includes('delete') || action.includes('remove')) {
      return <XCircle className="w-4 h-4 text-red-600" />;
    } else if (action.includes('security') || action.includes('encryption')) {
      return <AlertTriangle className="w-4 h-4 text-orange-600" />;
    } else {
      return <Info className="w-4 h-4 text-gray-600" />;
    }
  };

  // Get action badge variant
  const getActionBadgeVariant = (action: string) => {
    if (action.includes('login') || action.includes('auth')) {
      return 'default';
    } else if (action.includes('create') || action.includes('add')) {
      return 'default';
    } else if (action.includes('update') || action.includes('edit')) {
      return 'secondary';
    } else if (action.includes('delete') || action.includes('remove')) {
      return 'destructive';
    } else if (action.includes('security') || action.includes('encryption')) {
      return 'destructive';
    } else {
      return 'outline';
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ar-SY', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Handle filter changes
  const handleFilterChange = (key: keyof AuditLogFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1, // Reset to first page when filters change
    }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: 20,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
        <span className="mr-2">جاري التحميل...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">سجلات التدقيق</h1>
          <p className="text-gray-600">مراقبة وإدارة سجلات التدقيق الأمنية</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadAuditLogs}>
            <RefreshCw className="w-4 h-4 mr-2" />
            تحديث
          </Button>
          <Button onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            تصدير
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            الفلاتر
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">البحث في الإجراء</label>
              <Input
                placeholder="البحث في الإجراء..."
                value={filters.action || ''}
                onChange={(e) => handleFilterChange('action', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">نوع المورد</label>
              <Input
                placeholder="نوع المورد..."
                value={filters.resourceType || ''}
                onChange={(e) => handleFilterChange('resourceType', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">من تاريخ</label>
              <Input
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">إلى تاريخ</label>
              <Input
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={clearFilters} variant="outline">
              مسح الفلاتر
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>سجلات التدقيق</CardTitle>
          <CardDescription>
            {totalLogs} سجل من أصل {totalLogs} سجل
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الإجراء</TableHead>
                <TableHead>المستخدم</TableHead>
                <TableHead>نوع المورد</TableHead>
                <TableHead>معرف المورد</TableHead>
                <TableHead>عنوان IP</TableHead>
                <TableHead>التاريخ</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getActionIcon(log.action)}
                      <Badge variant={getActionBadgeVariant(log.action)}>
                        {log.action}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    {log.user ? (
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <div>
                          <div className="font-medium">{log.user.username}</div>
                          {log.user.name && (
                            <div className="text-sm text-gray-600">{log.user.name}</div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">غير محدد</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {log.resourceType ? (
                      <Badge variant="outline">{log.resourceType}</Badge>
                    ) : (
                      <span className="text-sm text-gray-400">غير محدد</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {log.resourceId ? (
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                        {log.resourceId}
                      </code>
                    ) : (
                      <span className="text-sm text-gray-400">غير محدد</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {log.ipAddress ? (
                      <code className="text-sm">{log.ipAddress}</code>
                    ) : (
                      <span className="text-sm text-gray-400">غير محدد</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">{formatDate(log.createdAt)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                          setSelectedLog(log);
                          setShowDetails(true);
                        }}>
                          <Eye className="w-4 h-4 mr-2" />
                          عرض التفاصيل
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {logs.length === 0 && (
            <div className="text-center py-12">
              <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد سجلات تدقيق</h3>
              <p className="text-gray-600">
                لم يتم العثور على سجلات تدقيق تطابق الفلاتر المحددة
              </p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-600">
                صفحة {filters.page} من {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFilterChange('page', (filters.page || 1) - 1)}
                  disabled={filters.page === 1}
                >
                  السابق
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFilterChange('page', (filters.page || 1) + 1)}
                  disabled={filters.page === totalPages}
                >
                  التالي
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Log Details Modal */}
      {showDetails && selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>تفاصيل سجل التدقيق</CardTitle>
              <CardDescription>
                معرّف السجل: {selectedLog.id}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">الإجراء</label>
                  <Badge variant={getActionBadgeVariant(selectedLog.action)}>
                    {selectedLog.action}
                  </Badge>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">التاريخ</label>
                  <span className="text-sm">{formatDate(selectedLog.createdAt)}</span>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">المستخدم</label>
                  <span className="text-sm">
                    {selectedLog.user ? selectedLog.user.username : 'غير محدد'}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">عنوان IP</label>
                  <span className="text-sm">{selectedLog.ipAddress || 'غير محدد'}</span>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">نوع المورد</label>
                  <span className="text-sm">{selectedLog.resourceType || 'غير محدد'}</span>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">معرف المورد</label>
                  <span className="text-sm">{selectedLog.resourceId || 'غير محدد'}</span>
                </div>
              </div>
              
              {selectedLog.details && (
                <div>
                  <label className="block text-sm font-medium mb-2">التفاصيل</label>
                  <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.userAgent && (
                <div>
                  <label className="block text-sm font-medium mb-1">معلومات المتصفح</label>
                  <span className="text-sm text-gray-600">{selectedLog.userAgent}</span>
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={() => setShowDetails(false)}>
                  إغلاق
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AuditLogViewer;
