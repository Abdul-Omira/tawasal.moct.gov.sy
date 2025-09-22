/**
 * Form Management Dashboard
 * Admin interface for managing forms and submissions
 */

import React, { useState, useEffect } from 'react';
import { Form } from '../../types/form';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  EyeIcon, 
  PencilIcon, 
  TrashIcon,
  DocumentArrowDownIcon,
  ChartBarIcon,
  PlayIcon,
  ArchiveBoxIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import { cn } from '../../lib/utils';

interface FormManagementProps {
  className?: string;
}

export const FormManagement: React.FC<FormManagementProps> = ({ className }) => {
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedForm, setSelectedForm] = useState<Form | null>(null);
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [formToDelete, setFormToDelete] = useState<Form | null>(null);

  // Load forms on component mount
  useEffect(() => {
    loadForms();
  }, []);

  const loadForms = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/forms');
      const data = await response.json();
      
      if (data.success) {
        setForms(data.data || []);
      }
    } catch (error) {
      console.error('Error loading forms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateForm = () => {
    setSelectedForm(null);
    setShowFormDialog(true);
  };

  const handleEditForm = (form: Form) => {
    setSelectedForm(form);
    setShowFormDialog(true);
  };

  const handleDeleteForm = (form: Form) => {
    setFormToDelete(form);
    setShowDeleteDialog(true);
  };

  const confirmDeleteForm = async () => {
    if (!formToDelete) return;

    try {
      const response = await fetch(`/api/forms/${formToDelete.id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        await loadForms();
        setShowDeleteDialog(false);
        setFormToDelete(null);
      }
    } catch (error) {
      console.error('Error deleting form:', error);
    }
  };

  const handlePublishForm = async (form: Form) => {
    try {
      const response = await fetch(`/api/forms/${form.id}/publish`, {
        method: 'POST',
      });
      
      if (response.ok) {
        await loadForms();
      }
    } catch (error) {
      console.error('Error publishing form:', error);
    }
  };

  const handleArchiveForm = async (form: Form) => {
    try {
      const response = await fetch(`/api/forms/${form.id}/archive`, {
        method: 'POST',
      });
      
      if (response.ok) {
        await loadForms();
      }
    } catch (error) {
      console.error('Error archiving form:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: 'مسودة', variant: 'secondary' as const },
      published: { label: 'منشور', variant: 'default' as const },
      archived: { label: 'مؤرشف', variant: 'outline' as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    
    return (
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    );
  };

  const filteredForms = forms.filter(form => {
    const matchesSearch = form.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         form.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || form.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">إدارة النماذج</h1>
          <p className="text-gray-600">إنشاء وإدارة النماذج الديناميكية</p>
        </div>
        <Button onClick={handleCreateForm} className="bg-blue-600 hover:bg-blue-700">
          <PlusIcon className="h-4 w-4 ml-2" />
          إنشاء نموذج جديد
        </Button>
      </div>

      {/* Filters */}
      <div className="flex space-x-4 space-x-reverse">
        <div className="flex-1">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="البحث في النماذج..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
        </div>
        <div className="flex space-x-2 space-x-reverse">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">جميع الحالات</option>
            <option value="draft">مسودة</option>
            <option value="published">منشور</option>
            <option value="archived">مؤرشف</option>
          </select>
        </div>
      </div>

      {/* Forms Table */}
      <Card>
        <CardHeader>
          <CardTitle>النماذج ({filteredForms.length})</CardTitle>
          <CardDescription>
            قائمة بجميع النماذج في النظام
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>العنوان</TableHead>
                <TableHead>الوصف</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>تاريخ الإنشاء</TableHead>
                <TableHead>آخر تحديث</TableHead>
                <TableHead className="text-center">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredForms.map((form) => (
                <TableRow key={form.id}>
                  <TableCell className="font-medium">{form.title}</TableCell>
                  <TableCell>{form.description || '-'}</TableCell>
                  <TableCell>{getStatusBadge(form.status)}</TableCell>
                  <TableCell>
                    {new Date(form.createdAt).toLocaleDateString('ar-SA')}
                  </TableCell>
                  <TableCell>
                    {new Date(form.updatedAt).toLocaleDateString('ar-SA')}
                  </TableCell>
                  <TableCell className="text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <FunnelIcon className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditForm(form)}>
                          <PencilIcon className="h-4 w-4 ml-2" />
                          تعديل
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => window.open(`/forms/${form.id}`, '_blank')}>
                          <EyeIcon className="h-4 w-4 ml-2" />
                          معاينة
                        </DropdownMenuItem>
                        {form.status === 'draft' && (
                          <DropdownMenuItem onClick={() => handlePublishForm(form)}>
                            <PlayIcon className="h-4 w-4 ml-2" />
                            نشر
                          </DropdownMenuItem>
                        )}
                        {form.status === 'published' && (
                          <DropdownMenuItem onClick={() => handleArchiveForm(form)}>
                            <ArchiveBoxIcon className="h-4 w-4 ml-2" />
                            أرشفة
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem 
                          onClick={() => handleDeleteForm(form)}
                          className="text-red-600"
                        >
                          <TrashIcon className="h-4 w-4 ml-2" />
                          حذف
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تأكيد الحذف</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من حذف النموذج "{formToDelete?.title}"؟ 
              لا يمكن التراجع عن هذا الإجراء.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 space-x-reverse">
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteDialog(false)}
            >
              إلغاء
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDeleteForm}
            >
              حذف
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Form Dialog */}
      <Dialog open={showFormDialog} onOpenChange={setShowFormDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedForm ? 'تعديل النموذج' : 'إنشاء نموذج جديد'}
            </DialogTitle>
            <DialogDescription>
              {selectedForm ? 'قم بتعديل بيانات النموذج' : 'أدخل بيانات النموذج الجديد'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                عنوان النموذج
              </label>
              <Input placeholder="أدخل عنوان النموذج" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                وصف النموذج
              </label>
              <textarea 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="أدخل وصف النموذج"
              />
            </div>
            <div className="flex justify-end space-x-2 space-x-reverse">
              <Button variant="outline" onClick={() => setShowFormDialog(false)}>
                إلغاء
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700">
                {selectedForm ? 'حفظ التغييرات' : 'إنشاء النموذج'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};