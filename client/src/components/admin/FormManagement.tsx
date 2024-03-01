/**
 * Form Builder Platform - Form Management Component
 * Advanced form management with CRUD operations
 */

import React, { useState } from 'react';
import { Form, FormStatus } from '../../types/form';
import { cn } from '../../lib/utils';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ShareIcon,
  ArchiveBoxIcon,
  DocumentDuplicateIcon,
  CalendarIcon,
  UserIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

interface FormManagementProps {
  forms: Form[];
  onEditForm: (formId: string) => void;
  onDeleteForm: (formId: string) => void;
  onViewForm: (formId: string) => void;
  onShareForm: (formId: string) => void;
  onArchiveForm: (formId: string) => void;
  onDuplicateForm: (formId: string) => void;
  onViewAnalytics: (formId: string) => void;
  onCreateForm: () => void;
}

export const FormManagement: React.FC<FormManagementProps> = ({
  forms,
  onEditForm,
  onDeleteForm,
  onViewForm,
  onShareForm,
  onArchiveForm,
  onDuplicateForm,
  onViewAnalytics,
  onCreateForm,
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'title' | 'createdAt' | 'updatedAt' | 'status'>('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FormStatus | 'all'>('all');
  const [selectedForms, setSelectedForms] = useState<string[]>([]);

  // Filter and sort forms
  const filteredAndSortedForms = forms
    .filter(form => {
      const matchesSearch = form.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           form.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || form.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'title':
          aValue = a.title;
          bValue = b.title;
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'updatedAt':
          aValue = new Date(a.updatedAt).getTime();
          bValue = new Date(b.updatedAt).getTime();
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  // Handle form selection
  const handleFormSelect = (formId: string) => {
    setSelectedForms(prev => 
      prev.includes(formId) 
        ? prev.filter(id => id !== formId)
        : [...prev, formId]
    );
  };

  const handleSelectAll = () => {
    if (selectedForms.length === filteredAndSortedForms.length) {
      setSelectedForms([]);
    } else {
      setSelectedForms(filteredAndSortedForms.map(f => f.id));
    }
  };

  // Bulk actions
  const handleBulkAction = (action: string) => {
    // Implementation for bulk actions
    console.log(`Bulk action: ${action} on forms:`, selectedForms);
    setSelectedForms([]);
  };

  // Get status badge styling
  const getStatusBadge = (status: FormStatus) => {
    const styles = {
      published: "bg-green-100 text-green-800",
      draft: "bg-yellow-100 text-yellow-800",
      archived: "bg-gray-100 text-gray-800",
    };
    
    const labels = {
      published: "منشور",
      draft: "مسودة",
      archived: "مؤرشف",
    };

    return {
      className: styles[status],
      label: labels[status],
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            إدارة النماذج
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            إدارة وإنشاء النماذج والاستطلاعات
          </p>
        </div>
        <button
          onClick={onCreateForm}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="h-5 w-5 ml-2" />
          إنشاء نموذج جديد
        </button>
      </div>

      {/* Filters and Controls */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Search */}
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              البحث
            </label>
            <input
              type="text"
              id="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث في النماذج..."
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              الحالة
            </label>
            <select
              id="status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as FormStatus | 'all')}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="all">جميع الحالات</option>
              <option value="draft">مسودة</option>
              <option value="published">منشور</option>
              <option value="archived">مؤرشف</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              ترتيب حسب
            </label>
            <select
              id="sortBy"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="updatedAt">تاريخ التحديث</option>
              <option value="createdAt">تاريخ الإنشاء</option>
              <option value="title">العنوان</option>
              <option value="status">الحالة</option>
            </select>
          </div>

          {/* Sort Order */}
          <div>
            <label htmlFor="sortOrder" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              الترتيب
            </label>
            <select
              id="sortOrder"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="desc">تنازلي</option>
              <option value="asc">تصاعدي</option>
            </select>
          </div>
        </div>

        {/* View Mode and Bulk Actions */}
        <div className="mt-4 flex justify-between items-center">
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="flex rounded-md shadow-sm">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  "px-3 py-2 text-sm font-medium border border-gray-300 rounded-r-md",
                  viewMode === 'grid'
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                )}
              >
                شبكة
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  "px-3 py-2 text-sm font-medium border border-gray-300 rounded-l-md",
                  viewMode === 'list'
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                )}
              >
                قائمة
              </button>
            </div>
          </div>

          {selectedForms.length > 0 && (
            <div className="flex items-center space-x-2 space-x-reverse">
              <span className="text-sm text-gray-500">
                {selectedForms.length} محدد
              </span>
              <button
                onClick={() => handleBulkAction('archive')}
                className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
              >
                أرشفة
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                className="text-sm text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-100"
              >
                حذف
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Forms Display */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        {filteredAndSortedForms.length === 0 ? (
          <div className="text-center py-12">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              لا توجد نماذج
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              ابدأ بإنشاء نموذج جديد
            </p>
            <div className="mt-6">
              <button
                onClick={onCreateForm}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <PlusIcon className="h-5 w-5 ml-2" />
                إنشاء نموذج جديد
              </button>
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredAndSortedForms.map((form) => {
                const statusBadge = getStatusBadge(form.status);
                return (
                  <div
                    key={form.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 space-x-reverse">
                        <input
                          type="checkbox"
                          checked={selectedForms.includes(form.id)}
                          onChange={() => handleFormSelect(form.id)}
                          className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {form.title}
                          </h4>
                          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                            {form.description || 'لا يوجد وصف'}
                          </p>
                          <div className="mt-2 flex items-center space-x-2 space-x-reverse">
                            <span className={cn(
                              "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                              statusBadge.className
                            )}>
                              {statusBadge.label}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center text-xs text-gray-500 space-x-4 space-x-reverse">
                        <span className="flex items-center">
                          <CalendarIcon className="h-4 w-4 ml-1" />
                          {new Date(form.updatedAt).toLocaleDateString('ar-SA')}
                        </span>
                        <span className="flex items-center">
                          <UserIcon className="h-4 w-4 ml-1" />
                          {form.createdBy}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1 space-x-reverse">
                        <button
                          onClick={() => onViewForm(form.id)}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
                          title="عرض"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onEditForm(form.id)}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
                          title="تعديل"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onViewAnalytics(form.id)}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
                          title="التحليلات"
                        >
                          <ChartBarIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onShareForm(form.id)}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
                          title="مشاركة"
                        >
                          <ShareIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onDuplicateForm(form.id)}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
                          title="نسخ"
                        >
                          <DocumentDuplicateIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onArchiveForm(form.id)}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
                          title="أرشفة"
                        >
                          <ArchiveBoxIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onDeleteForm(form.id)}
                          className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 p-1"
                          title="حذف"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedForms.length === filteredAndSortedForms.length && filteredAndSortedForms.length > 0}
                      onChange={handleSelectAll}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    النموذج
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    الحالة
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    تاريخ الإنشاء
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    آخر تحديث
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredAndSortedForms.map((form) => {
                  const statusBadge = getStatusBadge(form.status);
                  return (
                    <tr key={form.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedForms.includes(form.id)}
                          onChange={() => handleFormSelect(form.id)}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <DocumentTextIcon className="h-10 w-10 text-gray-400" />
                          </div>
                          <div className="mr-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {form.title}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {form.description || 'لا يوجد وصف'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={cn(
                          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                          statusBadge.className
                        )}>
                          {statusBadge.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(form.createdAt).toLocaleDateString('ar-SA')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(form.updatedAt).toLocaleDateString('ar-SA')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <button
                            onClick={() => onViewForm(form.id)}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            title="عرض"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => onEditForm(form.id)}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            title="تعديل"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => onViewAnalytics(form.id)}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            title="التحليلات"
                          >
                            <ChartBarIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => onShareForm(form.id)}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            title="مشاركة"
                          >
                            <ShareIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => onDuplicateForm(form.id)}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            title="نسخ"
                          >
                            <DocumentDuplicateIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => onArchiveForm(form.id)}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            title="أرشفة"
                          >
                            <ArchiveBoxIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => onDeleteForm(form.id)}
                            className="text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                            title="حذف"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default FormManagement;
