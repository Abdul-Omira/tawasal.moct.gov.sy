/**
 * Tenant Management Component
 * Handles ministry/tenant management and configuration
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
  Building2, 
  Plus, 
  Edit, 
  Trash2, 
  Settings, 
  Users, 
  FileText, 
  Globe, 
  MoreHorizontal,
  Search,
  Filter,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

interface Tenant {
  id: string;
  name: string;
  domain?: string;
  branding?: {
    logo?: string;
    primaryColor?: string;
    secondaryColor?: string;
    fontFamily?: string;
  };
  settings?: {
    allowPublicForms?: boolean;
    requireApproval?: boolean;
    maxFormsPerUser?: number;
    allowedFileTypes?: string[];
    maxFileSize?: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface TenantStats {
  userCount: number;
  formCount: number;
}

const TenantManagement: React.FC = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [tenantStats, setTenantStats] = useState<Record<string, TenantStats>>({});
  const [error, setError] = useState<string | null>(null);

  // Load tenants on component mount
  useEffect(() => {
    loadTenants();
  }, []);

  // Load tenants from API
  const loadTenants = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/ministries');
      const result = await response.json();

      if (result.success) {
        setTenants(result.data);
        
        // Load stats for each tenant
        const statsPromises = result.data.map((tenant: Tenant) => 
          fetch(`/api/ministries/${tenant.id}/stats`).then(res => res.json())
        );
        const statsResults = await Promise.all(statsPromises);
        
        const statsMap: Record<string, TenantStats> = {};
        statsResults.forEach((result, index) => {
          if (result.success) {
            statsMap[result.data.ministry.id] = {
              userCount: result.data.userCount,
              formCount: result.data.formCount,
            };
          }
        });
        setTenantStats(statsMap);
      } else {
        setError(result.message || 'فشل في جلب الوزارات');
      }
    } catch (error) {
      console.error('Error loading tenants:', error);
      setError('حدث خطأ في الاتصال');
    } finally {
      setLoading(false);
    }
  };

  // Delete tenant
  const handleDeleteTenant = async (tenantId: string, tenantName: string) => {
    if (!confirm(`هل أنت متأكد من حذف الوزارة "${tenantName}"؟`)) {
      return;
    }

    try {
      const response = await fetch(`/api/ministries/${tenantId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        toast.success('تم حذف الوزارة بنجاح');
        loadTenants();
      } else {
        toast.error(result.message || 'فشل في حذف الوزارة');
      }
    } catch (error) {
      console.error('Error deleting tenant:', error);
      toast.error('حدث خطأ في الاتصال');
    }
  };

  // Filter tenants based on search term
  const filteredTenants = tenants.filter(tenant =>
    tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.domain?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <h1 className="text-2xl font-bold">إدارة الوزارات</h1>
          <p className="text-gray-600">إدارة الوزارات والإعدادات المتعددة</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          إضافة وزارة
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="البحث في الوزارات..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
          />
        </div>
        <Button variant="outline" onClick={loadTenants}>
          <RefreshCw className="w-4 h-4 mr-2" />
          تحديث
        </Button>
      </div>

      {/* Tenants Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة الوزارات</CardTitle>
          <CardDescription>
            {filteredTenants.length} من أصل {tenants.length} وزارة
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الوزارة</TableHead>
                <TableHead>النطاق</TableHead>
                <TableHead>المستخدمين</TableHead>
                <TableHead>النماذج</TableHead>
                <TableHead>تاريخ الإنشاء</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTenants.map((tenant) => (
                <TableRow key={tenant.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium">{tenant.name}</div>
                        {tenant.branding?.primaryColor && (
                          <div 
                            className="w-4 h-4 rounded-full mt-1"
                            style={{ backgroundColor: tenant.branding.primaryColor }}
                          />
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {tenant.domain ? (
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">{tenant.domain}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">غير محدد</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-500" />
                      <span>{tenantStats[tenant.id]?.userCount || 0}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-500" />
                      <span>{tenantStats[tenant.id]?.formCount || 0}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-600">
                      {new Date(tenant.createdAt).toLocaleDateString('ar-SY')}
                    </span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingTenant(tenant)}>
                          <Edit className="w-4 h-4 mr-2" />
                          تعديل
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => window.open(`/api/ministries/${tenant.id}/users`, '_blank')}
                        >
                          <Users className="w-4 h-4 mr-2" />
                          المستخدمين
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => window.open(`/api/ministries/${tenant.id}/stats`, '_blank')}
                        >
                          <Settings className="w-4 h-4 mr-2" />
                          الإحصائيات
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteTenant(tenant.id, tenant.name)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          حذف
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredTenants.length === 0 && (
            <div className="text-center py-12">
              <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد وزارات</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm ? 'لم يتم العثور على وزارات تطابق البحث' : 'لم يتم إنشاء أي وزارات بعد'}
              </p>
              {!searchTerm && (
                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  إضافة أول وزارة
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Modal would go here */}
      {/* For now, we'll just show a placeholder */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl mx-4">
            <CardHeader>
              <CardTitle>إضافة وزارة جديدة</CardTitle>
              <CardDescription>
                قم بملء البيانات المطلوبة لإنشاء وزارة جديدة
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">اسم الوزارة</label>
                  <Input placeholder="أدخل اسم الوزارة" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">النطاق (اختياري)</label>
                  <Input placeholder="example.gov.sy" />
                </div>
                <div className="flex gap-3">
                  <Button className="flex-1">إنشاء</Button>
                  <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                    إلغاء
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default TenantManagement;