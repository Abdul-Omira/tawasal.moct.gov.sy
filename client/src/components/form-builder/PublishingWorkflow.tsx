import React, { useState, useEffect } from 'react';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon, 
  EyeIcon, 
  ArrowPathIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  UserIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  PublishingWorkflow as PublishingWorkflowService, 
  ApprovalRequest, 
  PublishingStats 
} from '@/lib/publishingService';

interface PublishingWorkflowProps {
  formId: string;
  formTitle: string;
  currentStatus: string;
  onStatusChange: (status: string) => void;
  onPublish: () => void;
  onReject: (reason: string) => void;
  onApprove: (comments?: string) => void;
  className?: string;
}

export const PublishingWorkflow: React.FC<PublishingWorkflowProps> = ({
  formId,
  formTitle,
  currentStatus,
  onStatusChange,
  onPublish,
  onReject,
  onApprove,
  className = ''
}) => {
  const [workflow, setWorkflow] = useState<PublishingWorkflow | null>(null);
  const [approvalRequest, setApprovalRequest] = useState<ApprovalRequest | null>(null);
  const [stats, setStats] = useState<PublishingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState('');
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    loadWorkflowData();
  }, [formId]);

  const loadWorkflowData = async () => {
    try {
      setLoading(true);
      // This would typically fetch from the API
      // For now, we'll simulate the data
      const mockWorkflow: PublishingWorkflow = {
        id: `workflow_${formId}`,
        formId,
        status: currentStatus as any,
        submittedBy: 'current_user',
        submittedAt: new Date(),
        version: 1
      };
      setWorkflow(mockWorkflow);
    } catch (error) {
      console.error('Failed to load workflow data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitForApproval = async () => {
    try {
      // This would typically call the API
      onStatusChange('pending_approval');
    } catch (error) {
      console.error('Failed to submit for approval:', error);
    }
  };

  const handleApprove = async () => {
    try {
      await onApprove(comments);
      setShowComments(false);
      setComments('');
    } catch (error) {
      console.error('Failed to approve:', error);
    }
  };

  const handleReject = async () => {
    try {
      await onReject(rejectReason);
      setShowComments(false);
      setRejectReason('');
    } catch (error) {
      console.error('Failed to reject:', error);
    }
  };

  const handlePublish = async () => {
    try {
      await onPublish();
    } catch (error) {
      console.error('Failed to publish:', error);
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'pending_approval':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'published':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <DocumentTextIcon className="h-4 w-4" />;
      case 'pending_approval':
        return <ClockIcon className="h-4 w-4" />;
      case 'approved':
        return <CheckCircleIcon className="h-4 w-4" />;
      case 'rejected':
        return <XCircleIcon className="h-4 w-4" />;
      case 'published':
        return <CheckCircleIcon className="h-4 w-4" />;
      default:
        return <DocumentTextIcon className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'draft':
        return 'مسودة';
      case 'pending_approval':
        return 'في انتظار الموافقة';
      case 'approved':
        return 'موافق عليه';
      case 'rejected':
        return 'مرفوض';
      case 'published':
        return 'منشور';
      default:
        return 'غير محدد';
    }
  };

  if (loading) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Form Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">{formTitle}</CardTitle>
              <CardDescription>حالة النموذج في سير العمل</CardDescription>
            </div>
            <Badge className={getStatusColor(currentStatus)}>
              <div className="flex items-center space-x-1 space-x-reverse">
                {getStatusIcon(currentStatus)}
                <span>{getStatusText(currentStatus)}</span>
              </div>
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Status Actions */}
            {currentStatus === 'draft' && (
              <div className="flex items-center space-x-3 space-x-reverse">
                <Button onClick={handleSubmitForApproval}>
                  <ClockIcon className="h-4 w-4 mr-2" />
                  إرسال للموافقة
                </Button>
                <Button variant="outline">
                  <EyeIcon className="h-4 w-4 mr-2" />
                  معاينة
                </Button>
              </div>
            )}

            {currentStatus === 'pending_approval' && (
              <Alert>
                <ClockIcon className="h-4 w-4" />
                <AlertDescription>
                  النموذج في انتظار المراجعة والموافقة. سيتم إشعارك عند اتخاذ قرار.
                </AlertDescription>
              </Alert>
            )}

            {currentStatus === 'approved' && (
              <div className="space-y-3">
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircleIcon className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    تمت الموافقة على النموذج. يمكنك الآن نشره.
                  </AlertDescription>
                </Alert>
                <Button onClick={handlePublish} className="bg-green-600 hover:bg-green-700">
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                  نشر النموذج
                </Button>
              </div>
            )}

            {currentStatus === 'rejected' && (
              <Alert variant="destructive">
                <XCircleIcon className="h-4 w-4" />
                <AlertDescription>
                  تم رفض النموذج. يرجى مراجعة التعليقات وإجراء التعديلات المطلوبة.
                </AlertDescription>
              </Alert>
            )}

            {currentStatus === 'published' && (
              <Alert className="border-blue-200 bg-blue-50">
                <CheckCircleIcon className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  النموذج منشور ومتاح للاستخدام.
                </AlertDescription>
              </Alert>
            )}

            {/* Workflow History */}
            {workflow && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  تاريخ سير العمل
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      {getStatusIcon(workflow.status)}
                      <div>
                        <p className="text-sm font-medium">{getStatusText(workflow.status)}</p>
                        <p className="text-xs text-gray-500">
                          {workflow.submittedAt.toLocaleDateString('ar-SA')}
                        </p>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      الإصدار {workflow.version}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Approval Actions (for reviewers) */}
      {(currentStatus === 'pending_approval') && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">إجراءات المراجعة</CardTitle>
            <CardDescription>مراجعة النموذج واتخاذ قرار</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-3 space-x-reverse">
                <Button 
                  onClick={() => setShowComments(true)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                  موافقة
                </Button>
                <Button 
                  variant="destructive"
                  onClick={() => setShowComments(true)}
                >
                  <XCircleIcon className="h-4 w-4 mr-2" />
                  رفض
                </Button>
                <Button variant="outline">
                  <EyeIcon className="h-4 w-4 mr-2" />
                  معاينة
                </Button>
              </div>

              {showComments && (
                <div className="space-y-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      التعليقات (اختياري)
                    </label>
                    <Textarea
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      placeholder="أضف تعليقاتك هنا..."
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      سبب الرفض (في حالة الرفض)
                    </label>
                    <Textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="اذكر سبب الرفض..."
                      rows={3}
                    />
                  </div>
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <Button onClick={handleApprove} className="bg-green-600 hover:bg-green-700">
                      <CheckCircleIcon className="h-4 w-4 mr-2" />
                      موافقة
                    </Button>
                    <Button onClick={handleReject} variant="destructive">
                      <XCircleIcon className="h-4 w-4 mr-2" />
                      رفض
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowComments(false)}
                    >
                      إلغاء
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Version History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">تاريخ الإصدارات</CardTitle>
          <CardDescription>عرض جميع إصدارات النموذج</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center space-x-3 space-x-reverse">
                <DocumentTextIcon className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">الإصدار الحالي</p>
                  <p className="text-xs text-gray-500">
                    {new Date().toLocaleDateString('ar-SA')}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <Badge className="bg-blue-100 text-blue-800">الحالي</Badge>
                <Button variant="outline" size="sm">
                  <ArrowPathIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PublishingWorkflow;
