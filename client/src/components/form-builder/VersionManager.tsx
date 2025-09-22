/**
 * Version Manager Component
 * Provides UI for managing form versions and rollbacks
 */

import React, { useState, useEffect } from 'react';
import { Form } from '../../types/form';
import { BaseComponent } from '../../types/component';
import { FormVersion, VersionComparison } from '../../lib/formVersioning';
import { useFormVersioning } from '../../lib/formVersioning';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  ClockIcon,
  DocumentTextIcon,
  EyeIcon,
  ArrowPathIcon,
  TrashIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  PlusIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import { cn } from '../../lib/utils';

interface VersionManagerProps {
  form: Form;
  components: BaseComponent[];
  onVersionSelect: (version: FormVersion) => void;
  onClose: () => void;
  className?: string;
}

export const VersionManager: React.FC<VersionManagerProps> = ({
  form,
  components,
  onVersionSelect,
  onClose,
  className,
}) => {
  const [versions, setVersions] = useState<FormVersion[]>([]);
  const [currentVersion, setCurrentVersion] = useState<FormVersion | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<FormVersion | null>(null);
  const [comparison, setComparison] = useState<VersionComparison | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    createVersion,
    getFormVersions,
    getCurrentVersion,
    setCurrentVersion,
    publishVersion,
    unpublishVersion,
    deleteVersion,
    compareVersions,
    getVersionStatistics,
  } = useFormVersioning();

  useEffect(() => {
    loadVersions();
  }, [form.id]);

  const loadVersions = async () => {
    setLoading(true);
    try {
      const formVersions = getFormVersions(form.id);
      const current = getCurrentVersion(form.id);
      
      setVersions(formVersions);
      setCurrentVersion(current);
    } catch (err) {
      setError('فشل في تحميل إصدارات النموذج');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVersion = async (description: string, versionType: 'major' | 'minor' | 'patch') => {
    try {
      const newVersion = createVersion(form.id, form, components, 'admin', description, versionType);
      setVersions(prev => [...prev, newVersion]);
      setCurrentVersion(newVersion);
      setShowCreateForm(false);
    } catch (err) {
      setError('فشل في إنشاء الإصدار');
    }
  };

  const handlePublishVersion = async (version: string) => {
    try {
      const success = publishVersion(form.id, version);
      if (success) {
        await loadVersions();
      }
    } catch (err) {
      setError('فشل في نشر الإصدار');
    }
  };

  const handleUnpublishVersion = async (version: string) => {
    try {
      const success = unpublishVersion(form.id, version);
      if (success) {
        await loadVersions();
      }
    } catch (err) {
      setError('فشل في إلغاء نشر الإصدار');
    }
  };

  const handleDeleteVersion = async (version: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الإصدار؟')) return;

    try {
      const success = deleteVersion(form.id, version);
      if (success) {
        await loadVersions();
      }
    } catch (err) {
      setError('فشل في حذف الإصدار');
    }
  };

  const handleCompareVersions = (version1: string, version2: string) => {
    const comparison = compareVersions(form.id, version1, version2);
    setComparison(comparison);
  };

  const handleSelectVersion = (version: FormVersion) => {
    setSelectedVersion(version);
    onVersionSelect(version);
  };

  const getVersionTypeColor = (version: string) => {
    const [major, minor, patch] = version.split('.').map(Number);
    if (major > 0) return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    if (minor > 0) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
  };

  const getVersionTypeLabel = (version: string) => {
    const [major, minor, patch] = version.split('.').map(Number);
    if (major > 0) return 'Major';
    if (minor > 0) return 'Minor';
    return 'Patch';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="mr-2 text-gray-500">جاري التحميل...</span>
      </div>
    );
  }

  return (
    <div className={cn("fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50", className)}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                إدارة الإصدارات - {form.title}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                إدارة إصدارات النموذج والرجوع إلى إصدارات سابقة
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Error Alert */}
          {error && (
            <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20 mb-4">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
              <AlertDescription className="text-red-700 dark:text-red-300">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Version Statistics */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>إحصائيات الإصدارات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{versions.length}</div>
                  <div className="text-sm text-gray-500">إجمالي الإصدارات</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {versions.filter(v => v.isPublished).length}
                  </div>
                  <div className="text-sm text-gray-500">الإصدارات المنشورة</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {currentVersion?.version || 'N/A'}
                  </div>
                  <div className="text-sm text-gray-500">الإصدار الحالي</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {versions.length > 0 ? new Date(versions[versions.length - 1].createdAt).toLocaleDateString('ar-SA') : 'N/A'}
                  </div>
                  <div className="text-sm text-gray-500">آخر تعديل</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Versions List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>قائمة الإصدارات</CardTitle>
                <Button
                  onClick={() => setShowCreateForm(true)}
                  className="flex items-center space-x-2 space-x-reverse"
                >
                  <PlusIcon className="h-4 w-4" />
                  <span>إنشاء إصدار</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الإصدار</TableHead>
                    <TableHead>النوع</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>الوصف</TableHead>
                    <TableHead>تاريخ الإنشاء</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {versions.map((version) => (
                    <TableRow key={version.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <DocumentTextIcon className="h-5 w-5 text-gray-400" />
                          <span>{version.version}</span>
                          {currentVersion?.id === version.id && (
                            <Badge variant="secondary" className="text-xs">الحالي</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getVersionTypeColor(version.version)}>
                          {getVersionTypeLabel(version.version)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={version.isPublished ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'}>
                          {version.isPublished ? 'منشور' : 'مسودة'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {version.description || 'لا يوجد وصف'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2 space-x-reverse text-sm text-gray-500">
                          <ClockIcon className="h-4 w-4" />
                          <span>{new Date(version.createdAt).toLocaleDateString('ar-SA')}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSelectVersion(version)}
                          >
                            <EyeIcon className="h-4 w-4" />
                          </Button>
                          {version.isPublished ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUnpublishVersion(version.version)}
                            >
                              <ArrowDownTrayIcon className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePublishVersion(version.version)}
                            >
                              <CheckCircleIcon className="h-4 w-4" />
                            </Button>
                          )}
                          {currentVersion?.id !== version.id && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteVersion(version.version)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <TrashIcon className="h-4 w-4" />
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

          {/* Version Comparison */}
          {comparison && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>مقارنة الإصدارات</CardTitle>
                <CardDescription>
                  مقارنة بين الإصدار {comparison.version1.version} والإصدار {comparison.version2.version}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{comparison.summary.added}</div>
                      <div className="text-sm text-gray-500">مضاف</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{comparison.summary.removed}</div>
                      <div className="text-sm text-gray-500">محذوف</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{comparison.summary.modified}</div>
                      <div className="text-sm text-gray-500">معدل</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">التغييرات:</h4>
                    {comparison.changes.map((change, index) => (
                      <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <p className="text-sm">{change.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Create Version Form */}
        {showCreateForm && (
          <CreateVersionForm
            onSubmit={handleCreateVersion}
            onCancel={() => setShowCreateForm(false)}
          />
        )}
      </div>
    </div>
  );
};

// Create Version Form Component
interface CreateVersionFormProps {
  onSubmit: (description: string, versionType: 'major' | 'minor' | 'patch') => void;
  onCancel: () => void;
}

const CreateVersionForm: React.FC<CreateVersionFormProps> = ({ onSubmit, onCancel }) => {
  const [description, setDescription] = useState('');
  const [versionType, setVersionType] = useState<'major' | 'minor' | 'patch'>('minor');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(description, versionType);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="max-w-md w-full mx-4">
        <CardHeader>
          <CardTitle>إنشاء إصدار جديد</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                وصف الإصدار
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                rows={3}
                placeholder="وصف التغييرات في هذا الإصدار..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                نوع الإصدار
              </label>
              <select
                value={versionType}
                onChange={(e) => setVersionType(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="patch">Patch - إصلاحات صغيرة</option>
                <option value="minor">Minor - ميزات جديدة</option>
                <option value="major">Major - تغييرات كبيرة</option>
              </select>
            </div>

            <div className="flex items-center justify-end space-x-3 space-x-reverse">
              <Button type="button" variant="outline" onClick={onCancel}>
                إلغاء
              </Button>
              <Button type="submit">
                إنشاء الإصدار
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default VersionManager;
