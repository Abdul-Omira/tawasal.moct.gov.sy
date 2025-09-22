import React, { useState, useEffect } from 'react';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon, 
  DocumentTextIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  UserIcon,
  CalendarIcon,
  EyeIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  PublishingWorkflow, 
  ApprovalRequest, 
  PublishingStats 
} from '@/lib/publishingService';

interface PublishingDashboardProps {
  className?: string;
}

export const PublishingDashboard: React.FC<PublishingDashboardProps> = ({
  className = ''
}) => {
  const [stats, setStats] = useState<PublishingStats | null>(null);
  const [approvalRequests, setApprovalRequests] = useState<ApprovalRequest[]>([]);
  const [workflows, setWorkflows] = useState<PublishingWorkflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'pending' | 'history'>('overview');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // This would typically fetch from the API
      // For now, we'll simulate the data
      const mockStats: PublishingStats = {
        totalForms: 25,
        publishedForms: 18,
        pendingApproval: 4,
        draftForms: 2,
        rejectedForms: 1,
        averageApprovalTime: 24.5,
        approvalRate: 85.7
      };
      setStats(mockStats);

      const mockRequests: ApprovalRequest[] = [
        {
          id: 'req_1',
          formId: 'form_1',
          formTitle: 'استطلاع رضا العملاء',
          submittedBy: 'user_1',
          submittedAt: new Date('2024-01-15'),
          status: 'pending',
          priority: 'high',
          changes: ['إضافة حقل جديد', 'تعديل التصميم']
        },
        {
          id: 'req_2',
          formId: 'form_2',
          formTitle: 'طلب توظيف',
          submittedBy: 'user_2',
          submittedAt: new Date('2024-01-14'),
          status: 'pending',
          priority: 'medium',
          changes: ['تحديث قائمة الخيارات']
        }
      ];
      setApprovalRequests(mockRequests);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    try {
      // This would typically call the API
      setApprovalRequests(prev => 
        prev.map(req => 
          req.id === requestId 
            ? { ...req, status: 'approved' as const, reviewedAt: new Date() }
            : req
        )
      );
    } catch (error) {
      console.error('Failed to approve request:', error);
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      // This would typically call the API
      setApprovalRequests(prev => 
        prev.map(req => 
          req.id === requestId 
            ? { ...req, status: 'rejected' as const, reviewedAt: new Date() }
            : req
        )
      );
    } catch (error) {
      console.error('Failed to reject request:', error);
    }
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityText = (priority: string): string => {
    switch (priority) {
      case 'urgent':
        return 'عاجل';
      case 'high':
        return 'عالي';
      case 'medium':
        return 'متوسط';
      case 'low':
        return 'منخفض';
      default:
        return 'غير محدد';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'pending':
        return 'في الانتظار';
      case 'approved':
        return 'موافق عليه';
      case 'rejected':
        return 'مرفوض';
      default:
        return 'غير محدد';
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
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          لوحة تحكم النشر
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          إدارة سير عمل نشر النماذج والموافقات
        </p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 space-x-reverse mb-6">
        <Button
          variant={selectedTab === 'overview' ? 'default' : 'outline'}
          onClick={() => setSelectedTab('overview')}
        >
          <ChartBarIcon className="h-4 w-4 mr-2" />
          نظرة عامة
        </Button>
        <Button
          variant={selectedTab === 'pending' ? 'default' : 'outline'}
          onClick={() => setSelectedTab('pending')}
        >
          <ClockIcon className="h-4 w-4 mr-2" />
          في الانتظار ({approvalRequests.filter(r => r.status === 'pending').length})
        </Button>
        <Button
          variant={selectedTab === 'history' ? 'default' : 'outline'}
          onClick={() => setSelectedTab('history')}
        >
          <DocumentTextIcon className="h-4 w-4 mr-2" />
          التاريخ
        </Button>
      </div>

      {/* Overview Tab */}
      {selectedTab === 'overview' && stats && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">إجمالي النماذج</CardTitle>
                <DocumentTextIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalForms}</div>
                <p className="text-xs text-muted-foreground">
                  جميع النماذج
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">منشورة</CardTitle>
                <CheckCircleIcon className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.publishedForms}</div>
                <p className="text-xs text-muted-foreground">
                  {((stats.publishedForms / stats.totalForms) * 100).toFixed(1)}% من الإجمالي
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">في الانتظار</CardTitle>
                <ClockIcon className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{stats.pendingApproval}</div>
                <p className="text-xs text-muted-foreground">
                  تحتاج مراجعة
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">معدل الموافقة</CardTitle>
                <ChartBarIcon className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.approvalRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  متوسط الموافقة
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Additional Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>إحصائيات النشر</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">مسودات</span>
                    <span className="text-sm font-medium">{stats.draftForms}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">مرفوضة</span>
                    <span className="text-sm font-medium">{stats.rejectedForms}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">متوسط وقت الموافقة</span>
                    <span className="text-sm font-medium">{stats.averageApprovalTime.toFixed(1)} ساعة</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>إجراءات سريعة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button className="w-full justify-start">
                    <ClockIcon className="h-4 w-4 mr-2" />
                    مراجعة الطلبات المعلقة
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <DocumentTextIcon className="h-4 w-4 mr-2" />
                    عرض جميع النماذج
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <ChartBarIcon className="h-4 w-4 mr-2" />
                    تقرير مفصل
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Pending Tab */}
      {selectedTab === 'pending' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>طلبات الموافقة المعلقة</CardTitle>
              <CardDescription>
                {approvalRequests.filter(r => r.status === 'pending').length} طلب في انتظار المراجعة
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>النموذج</TableHead>
                    <TableHead>المقدم</TableHead>
                    <TableHead>الأولوية</TableHead>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {approvalRequests
                    .filter(r => r.status === 'pending')
                    .map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{request.formTitle}</p>
                            <p className="text-sm text-gray-500">ID: {request.formId}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <UserIcon className="h-4 w-4 text-gray-500" />
                            <span className="text-sm">{request.submittedBy}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getPriorityColor(request.priority)}>
                            {getPriorityText(request.priority)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <CalendarIcon className="h-4 w-4 text-gray-500" />
                            <span className="text-sm">
                              {request.submittedAt.toLocaleDateString('ar-SA')}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(request.status)}>
                            {getStatusText(request.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <Button
                              size="sm"
                              onClick={() => handleApprove(request.id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircleIcon className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleReject(request.id)}
                            >
                              <XCircleIcon className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <EyeIcon className="h-4 w-4" />
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
      )}

      {/* History Tab */}
      {selectedTab === 'history' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>تاريخ النشر</CardTitle>
              <CardDescription>جميع طلبات النشر والموافقات</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>النموذج</TableHead>
                    <TableHead>المقدم</TableHead>
                    <TableHead>المراجع</TableHead>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {approvalRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{request.formTitle}</p>
                          <p className="text-sm text-gray-500">ID: {request.formId}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <UserIcon className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">{request.submittedBy}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <UserIcon className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">{request.reviewer || 'لم يتم التحديد'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <CalendarIcon className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">
                            {request.reviewedAt 
                              ? request.reviewedAt.toLocaleDateString('ar-SA')
                              : request.submittedAt.toLocaleDateString('ar-SA')
                            }
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(request.status)}>
                          {getStatusText(request.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <Button size="sm" variant="outline">
                            <EyeIcon className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <ArrowPathIcon className="h-4 w-4" />
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
      )}
    </div>
  );
};
