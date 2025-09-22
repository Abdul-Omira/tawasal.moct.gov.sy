/**
 * MFA Management Component
 * Handles MFA settings and management for authenticated users
 * 
 * @author Syrian Ministry of Communications
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Shield, Smartphone, Settings, AlertCircle, Check, X, RefreshCw, Download, Copy } from 'lucide-react';
import { toast } from 'sonner';
import MFASetup from './MFASetup';

interface MFAManagementProps {
  onClose?: () => void;
}

interface MFAStatus {
  enabled: boolean;
  setupDate?: string;
  lastUsed?: string;
  backupCodesCount?: number;
}

const MFAManagement: React.FC<MFAManagementProps> = ({ onClose }) => {
  const [mfaStatus, setMfaStatus] = useState<MFAStatus>({ enabled: false });
  const [loading, setLoading] = useState(true);
  const [showSetup, setShowSetup] = useState(false);
  const [showDisable, setShowDisable] = useState(false);
  const [password, setPassword] = useState('');
  const [disabling, setDisabling] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showBackupCodes, setShowBackupCodes] = useState(false);

  // Load MFA status on component mount
  useEffect(() => {
    loadMFAStatus();
  }, []);

  // Load MFA status
  const loadMFAStatus = async () => {
    try {
      const response = await fetch('/api/auth/mfa/status');
      const result = await response.json();

      if (result.success) {
        setMfaStatus(result.data);
      } else {
        console.error('Error loading MFA status:', result.message);
      }
    } catch (error) {
      console.error('Error loading MFA status:', error);
    } finally {
      setLoading(false);
    }
  };

  // Disable MFA
  const handleDisableMFA = async () => {
    if (!password.trim()) {
      setError('كلمة المرور مطلوبة');
      return;
    }

    setDisabling(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/mfa/disable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('تم إلغاء تفعيل المصادقة الثنائية بنجاح');
        setMfaStatus({ enabled: false });
        setShowDisable(false);
        setPassword('');
        loadMFAStatus();
      } else {
        setError(result.message || 'فشل في إلغاء تفعيل المصادقة الثنائية');
      }
    } catch (error) {
      console.error('Error disabling MFA:', error);
      setError('حدث خطأ في الاتصال');
    } finally {
      setDisabling(false);
    }
  };

  // Generate new backup codes
  const handleGenerateBackupCodes = async () => {
    setRegenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/mfa/backup-codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.success) {
        setBackupCodes(result.data.backupCodes);
        setShowBackupCodes(true);
        toast.success('تم إنشاء رموز النسخ الاحتياطي الجديدة');
      } else {
        setError(result.message || 'فشل في إنشاء رموز النسخ الاحتياطي');
      }
    } catch (error) {
      console.error('Error generating backup codes:', error);
      setError('حدث خطأ في الاتصال');
    } finally {
      setRegenerating(false);
    }
  };

  // Copy backup codes to clipboard
  const copyBackupCodes = async () => {
    if (backupCodes.length > 0) {
      try {
        await navigator.clipboard.writeText(backupCodes.join('\n'));
        toast.success('تم نسخ رموز النسخ الاحتياطي');
      } catch (error) {
        console.error('Error copying backup codes:', error);
        toast.error('فشل في نسخ رموز النسخ الاحتياطي');
      }
    }
  };

  // Download backup codes
  const downloadBackupCodes = () => {
    if (backupCodes.length > 0) {
      const content = `رموز النسخ الاحتياطي للمصادقة الثنائية\n\n${backupCodes.join('\n')}\n\nتاريخ الإنشاء: ${new Date().toLocaleDateString('ar-SY')}\n\nاحتفظ بهذه الرموز في مكان آمن. يمكنك استخدامها للوصول إلى حسابك في حالة فقدان جهازك.`;
      
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'mfa-backup-codes.txt';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  // Handle MFA setup completion
  const handleMFASetupComplete = () => {
    setShowSetup(false);
    loadMFAStatus();
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
            <span className="mr-2">جاري التحميل...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showSetup) {
    return (
      <MFASetup
        onComplete={handleMFASetupComplete}
        onCancel={() => setShowSetup(false)}
      />
    );
  }

  if (showBackupCodes && backupCodes.length > 0) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              رموز النسخ الاحتياطي الجديدة
            </CardTitle>
            <CardDescription>
              احتفظ بهذه الرموز في مكان آمن. يمكنك استخدامها للوصول إلى حسابك في حالة فقدان جهازك.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-2" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">تحذير مهم:</p>
                  <p>هذه هي المرة الوحيدة التي ستظهر فيها هذه الرموز. احتفظ بها في مكان آمن ولا تشاركها مع أي شخص.</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {backupCodes.map((code, index) => (
                <code key={index} className="bg-gray-100 px-3 py-2 rounded text-sm font-mono text-center">
                  {code}
                </code>
              ))}
            </div>

            <div className="flex gap-2">
              <Button onClick={copyBackupCodes} className="flex-1">
                <Copy className="w-4 h-4 mr-1" />
                نسخ الرموز
              </Button>
              <Button onClick={downloadBackupCodes} variant="outline" className="flex-1">
                <Download className="w-4 h-4 mr-1" />
                تحميل
              </Button>
            </div>

            <div className="flex gap-3">
              <Button onClick={() => setShowBackupCodes(false)} className="flex-1">
                تم الحفظ
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            إدارة المصادقة الثنائية
          </CardTitle>
          <CardDescription>
            قم بإدارة إعدادات المصادقة الثنائية لحسابك
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* MFA Status */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                mfaStatus.enabled ? 'bg-green-100' : 'bg-gray-100'
              }`}>
                {mfaStatus.enabled ? (
                  <Check className="w-5 h-5 text-green-600" />
                ) : (
                  <X className="w-5 h-5 text-gray-600" />
                )}
              </div>
              <div>
                <h3 className="font-medium">المصادقة الثنائية</h3>
                <p className="text-sm text-gray-600">
                  {mfaStatus.enabled ? 'مفعلة' : 'غير مفعلة'}
                </p>
              </div>
            </div>
            <Badge variant={mfaStatus.enabled ? 'default' : 'secondary'}>
              {mfaStatus.enabled ? 'مفعلة' : 'غير مفعلة'}
            </Badge>
          </div>

          {/* MFA Details */}
          {mfaStatus.enabled && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-900">تاريخ التفعيل</p>
                  <p className="text-sm text-blue-700">
                    {mfaStatus.setupDate ? new Date(mfaStatus.setupDate).toLocaleDateString('ar-SY') : 'غير محدد'}
                  </p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-sm font-medium text-green-900">آخر استخدام</p>
                  <p className="text-sm text-green-700">
                    {mfaStatus.lastUsed ? new Date(mfaStatus.lastUsed).toLocaleDateString('ar-SY') : 'لم يتم الاستخدام'}
                  </p>
                </div>
              </div>

              <div className="p-3 bg-yellow-50 rounded-lg">
                <p className="text-sm font-medium text-yellow-900">رموز النسخ الاحتياطي</p>
                <p className="text-sm text-yellow-700">
                  {mfaStatus.backupCodesCount || 0} رمز متاح
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            {!mfaStatus.enabled ? (
              <Button
                onClick={() => setShowSetup(true)}
                className="w-full"
                size="lg"
              >
                <Shield className="w-4 h-4 mr-2" />
                تفعيل المصادقة الثنائية
              </Button>
            ) : (
              <div className="space-y-2">
                <Button
                  onClick={handleGenerateBackupCodes}
                  disabled={regenerating}
                  variant="outline"
                  className="w-full"
                >
                  {regenerating ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  إنشاء رموز نسخ احتياطي جديدة
                </Button>

                <Button
                  onClick={() => setShowDisable(true)}
                  variant="destructive"
                  className="w-full"
                >
                  <X className="w-4 h-4 mr-2" />
                  إلغاء تفعيل المصادقة الثنائية
                </Button>
              </div>
            )}
          </div>

          {/* Disable MFA Confirmation */}
          {showDisable && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="font-medium text-red-900 mb-2">تأكيد إلغاء التفعيل</h4>
              <p className="text-sm text-red-800 mb-4">
                إلغاء تفعيل المصادقة الثنائية سيقلل من أمان حسابك. تأكد من أنك تريد المتابعة.
              </p>
              <div className="space-y-3">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="أدخل كلمة المرور للتأكيد"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleDisableMFA}
                    disabled={disabling || !password.trim()}
                    variant="destructive"
                    className="flex-1"
                  >
                    {disabling ? 'جاري الإلغاء...' : 'تأكيد الإلغاء'}
                  </Button>
                  <Button
                    onClick={() => {
                      setShowDisable(false);
                      setPassword('');
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    إلغاء
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Close Button */}
          {onClose && (
            <div className="flex justify-end">
              <Button variant="outline" onClick={onClose}>
                إغلاق
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MFAManagement;
