import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { User, MessageSquare, Clock, CheckCircle, XCircle } from 'lucide-react';

interface User {
  id: number;
  username: string;
  name: string;
  isAdmin: boolean;
}

interface Comment {
  id: number;
  comment: string;
  createdAt: string;
  userName: string;
  username: string;
}

interface StatusHistory {
  id: number;
  oldStatus: string;
  newStatus: string;
  comment?: string;
  changedAt: string;
  userName: string;
  username: string;
}

interface AssignmentCommentsProps {
  communicationId: number;
  assignedTo?: number;
  assignedAt?: string;
  assignedBy?: number;
  assignedToName?: string;
  assignedByName?: string;
  status: string;
  onAssignmentChange?: () => void;
}

export function AssignmentComments({
  communicationId,
  assignedTo,
  assignedAt,
  assignedBy,
  assignedToName,
  assignedByName,
  status,
  onAssignmentChange
}: AssignmentCommentsProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [statusHistory, setStatusHistory] = useState<StatusHistory[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [customUserName, setCustomUserName] = useState<string>('');
  const [newComment, setNewComment] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [statusComment, setStatusComment] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
    fetchComments();
    fetchStatusHistory();
  }, [communicationId]);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      const data = await response.json();
      if (data.success) {
        setUsers(data.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/admin/communication-comments/${communicationId}`);
      const data = await response.json();
      if (data.success) {
        setComments(data.data);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const fetchStatusHistory = async () => {
    try {
      const response = await fetch(`/api/admin/communication-status-history/${communicationId}`);
      const data = await response.json();
      if (data.success) {
        setStatusHistory(data.data);
      }
    } catch (error) {
      console.error('Error fetching status history:', error);
    }
  };

  const handleAssign = async () => {
    if (!selectedUser) return;

    setLoading(true);
    try {
      let assignedToId = selectedUser;
      
      // If custom user is selected, we'll need to create a temporary user or handle it differently
      if (selectedUser === 'custom') {
        if (!customUserName.trim()) return;
        // For now, we'll use a placeholder ID for custom users
        // In a real implementation, you might want to create a temporary user or handle this differently
        assignedToId = 'custom';
      }

      const response = await fetch('/api/admin/assign-communication', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          communicationId,
          assignedTo: selectedUser === 'custom' ? null : parseInt(selectedUser),
          customUserName: selectedUser === 'custom' ? customUserName : null
        })
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: "تم التعيين بنجاح",
          description: data.message
        });
        onAssignmentChange?.();
        fetchComments();
      } else {
        toast({
          title: "خطأ في التعيين",
          description: data.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "خطأ في التعيين",
        description: "حدث خطأ غير متوقع",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUnassign = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/unassign-communication', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ communicationId })
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: "تم إلغاء التعيين بنجاح",
          description: data.message
        });
        onAssignmentChange?.();
        fetchComments();
      } else {
        toast({
          title: "خطأ في إلغاء التعيين",
          description: data.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "خطأ في إلغاء التعيين",
        description: "حدث خطأ غير متوقع",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/admin/add-comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          communicationId,
          comment: newComment
        })
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: "تم إضافة التعليق بنجاح",
          description: data.message
        });
        setNewComment('');
        fetchComments();
      } else {
        toast({
          title: "خطأ في إضافة التعليق",
          description: data.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "خطأ في إضافة التعليق",
        description: "حدث خطأ غير متوقع",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async () => {
    if (!newStatus) return;

    setLoading(true);
    try {
      const response = await fetch('/api/admin/change-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          communicationId,
          newStatus,
          comment: statusComment
        })
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: "تم تغيير الحالة بنجاح",
          description: data.message
        });
        setNewStatus('');
        setStatusComment('');
        onAssignmentChange?.();
        fetchStatusHistory();
      } else {
        toast({
          title: "خطأ في تغيير الحالة",
          description: data.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "خطأ في تغيير الحالة",
        description: "حدث خطأ غير متوقع",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  return (
    <div className="space-y-6">
      {/* Assignment Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            تعيين الطلب
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {assignedTo ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div>
                  <p className="font-medium">معين إلى: {assignedToName}</p>
                  <p className="text-sm text-gray-600">
                    تم التعيين في: {formatDate(assignedAt || '')}
                  </p>
                  {assignedByName && (
                    <p className="text-sm text-gray-600">بواسطة: {assignedByName}</p>
                  )}
                </div>
                <Button
                  onClick={handleUnassign}
                  disabled={loading}
                  variant="outline"
                  size="sm"
                >
                  إلغاء التعيين
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label htmlFor="user-select">اختر المستخدم</Label>
                <Select value={selectedUser} onValueChange={(value) => {
                  setSelectedUser(value);
                  if (value === 'custom') {
                    setCustomUserName('');
                  }
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر مستخدم..." />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.name} ({user.username})
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">كتابة اسم مخصص</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {selectedUser === 'custom' && (
                <div>
                  <Label htmlFor="custom-user">اسم المستخدم المخصص</Label>
                  <Input
                    id="custom-user"
                    value={customUserName}
                    onChange={(e) => setCustomUserName(e.target.value)}
                    placeholder="اكتب اسم المستخدم..."
                  />
                </div>
              )}
              <Button
                onClick={handleAssign}
                disabled={(!selectedUser || (selectedUser === 'custom' && !customUserName.trim())) || loading}
                className="w-full"
              >
                تعيين الطلب
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Change Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon(status)}
            تغيير الحالة
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(status)}>
              {status === 'pending' ? 'قيد المراجعة' : 
               status === 'approved' ? 'تمت الموافقة' : 
               status === 'rejected' ? 'مرفوض' : status}
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status-select">الحالة الجديدة</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الحالة..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">قيد المراجعة</SelectItem>
                  <SelectItem value="approved">تمت الموافقة</SelectItem>
                  <SelectItem value="rejected">مرفوض</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status-comment">تعليق (اختياري)</Label>
              <Input
                id="status-comment"
                value={statusComment}
                onChange={(e) => setStatusComment(e.target.value)}
                placeholder="أضف تعليق على تغيير الحالة..."
              />
            </div>
          </div>
          <Button
            onClick={handleStatusChange}
            disabled={!newStatus || loading}
            className="w-full"
          >
            تغيير الحالة
          </Button>
        </CardContent>
      </Card>

      {/* Comments Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            التعليقات
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-comment">إضافة تعليق جديد</Label>
            <Textarea
              id="new-comment"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="اكتب تعليقك هنا..."
              rows={3}
            />
            <Button
              onClick={handleAddComment}
              disabled={!newComment.trim() || loading}
              className="w-full"
            >
              إضافة التعليق
            </Button>
          </div>

          <div className="space-y-3">
            {comments.map((comment) => (
              <div key={comment.id} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{comment.userName}</span>
                  <span className="text-sm text-gray-500">
                    {formatDate(comment.createdAt)}
                  </span>
                </div>
                <p className="text-gray-700">{comment.comment}</p>
              </div>
            ))}
            {comments.length === 0 && (
              <p className="text-gray-500 text-center py-4">لا توجد تعليقات بعد</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Status History Section */}
      {statusHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              تاريخ تغيير الحالة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {statusHistory.map((history) => (
                <div key={history.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(history.newStatus)}>
                        {history.newStatus === 'pending' ? 'قيد المراجعة' : 
                         history.newStatus === 'approved' ? 'تمت الموافقة' : 
                         history.newStatus === 'rejected' ? 'مرفوض' : history.newStatus}
                      </Badge>
                      {history.oldStatus && (
                        <>
                          <span className="text-gray-400">←</span>
                          <Badge variant="outline">
                            {history.oldStatus === 'pending' ? 'قيد المراجعة' : 
                             history.oldStatus === 'approved' ? 'تمت الموافقة' : 
                             history.oldStatus === 'rejected' ? 'مرفوض' : history.oldStatus}
                          </Badge>
                        </>
                      )}
                    </div>
                    <span className="text-sm text-gray-500">
                      {formatDate(history.changedAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      بواسطة: {history.userName}
                    </span>
                    {history.comment && (
                      <p className="text-sm text-gray-700 mt-1">{history.comment}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
