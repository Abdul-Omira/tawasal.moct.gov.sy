/**
 * MFA Setup Component
 * Handles the setup and configuration of Multi-Factor Authentication
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
import { Shield, Smartphone, Copy, Check, AlertCircle, Download } from 'lucide-react';
import { toast } from 'sonner';

interface MFASetupProps {
  onComplete?: () => void;
  onCancel?: () => void;
}

interface MFASetupData {
  qrCode: string;
  secret: string;
  backupCodes: string[];
}

const MFASetup: React.FC<MFASetupProps> = ({ onComplete, onCancel }) => {
  const [step, setStep] = useState<'setup' | 'verify' | 'complete'>('setup');
  const [loading, setLoading] = useState(false);
  const [mfaData, setMfaData] = useState<MFASetupData | null>(null);
  const [verificationToken, setVerificationToken] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);

  // Setup MFA
  const handleSetupMFA = async () => {
    if (!userEmail.trim()) {
      setError('البريد الإلكتروني مطلوب');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/mfa/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userEmail }),
      });

      const result = await response.json();

      if (result.success) {
        setMfaData(result.data);
        setStep('verify');
        toast.success('تم إعداد المصادقة الثنائية بنجاح');
      } else {
        setError(result.message || 'حدث خطأ أثناء إعداد المصادقة الثنائية');
      }
    } catch (error) {
      console.error('Error setting up MFA:', error);
      setError('حدث خطأ في الاتصال');
    } finally {
      setLoading(false);
    }
  };

  // Verify MFA token
  const handleVerifyMFA = async () => {
    if (!verificationToken.trim()) {
      setError('رمز التحقق مطلوب');
      return;
    }

    if (verificationToken.length !== 6) {
      setError('رمز التحقق يجب أن يكون 6 أرقام');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/mfa/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: verificationToken }),
      });

      const result = await response.json();

      if (result.success) {
        setStep('complete');
        toast.success('تم تفعيل المصادقة الثنائية بنجاح');
        onComplete?.();
      } else {
        setError(result.message || 'رمز التحقق غير صحيح');
      }
    } catch (error) {
      console.error('Error verifying MFA:', error);
      setError('حدث خطأ في الاتصال');
    } finally {
      setLoading(false);
    }
  };

  // Copy secret to clipboard
  const copySecret = async () => {
    if (mfaData?.secret) {
      try {
        await navigator.clipboard.writeText(mfaData.secret);
        setCopiedSecret(true);
        toast.success('تم نسخ المفتاح السري');
        setTimeout(() => setCopiedSecret(false), 2000);
      } catch (error) {
        console.error('Error copying secret:', error);
        toast.error('فشل في نسخ المفتاح السري');
      }
    }
  };

  // Copy backup codes to clipboard
  const copyBackupCodes = async () => {
    if (mfaData?.backupCodes) {
      try {
        await navigator.clipboard.writeText(mfaData.backupCodes.join('\n'));
        setCopiedCodes(true);
        toast.success('تم نسخ رموز النسخ الاحتياطي');
        setTimeout(() => setCopiedCodes(false), 2000);
      } catch (error) {
        console.error('Error copying backup codes:', error);
        toast.error('فشل في نسخ رموز النسخ الاحتياطي');
      }
    }
  };

  // Download backup codes
  const downloadBackupCodes = () => {
    if (mfaData?.backupCodes) {
      const content = `رموز النسخ الاحتياطي للمصادقة الثنائية\n\n${mfaData.backupCodes.join('\n')}\n\nتاريخ الإنشاء: ${new Date().toLocaleDateString('ar-SY')}\n\nاحتفظ بهذه الرموز في مكان آمن. يمكنك استخدامها للوصول إلى حسابك في حالة فقدان جهازك.`;
      
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

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-6 h-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">إعداد المصادقة الثنائية</CardTitle>
          <CardDescription>
            قم بإعداد المصادقة الثنائية لحماية حسابك بشكل إضافي
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {step === 'setup' && (
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  البريد الإلكتروني
                </label>
                <Input
                  id="email"
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="أدخل بريدك الإلكتروني"
                  className="w-full"
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-2" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium mb-1">قبل البدء:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>تأكد من تثبيت تطبيق المصادقة على هاتفك (Google Authenticator, Authy, إلخ)</li>
                      <li>ستحتاج إلى مسح رمز QR أو إدخال المفتاح السري يدوياً</li>
                      <li>احتفظ برموز النسخ الاحتياطي في مكان آمن</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleSetupMFA}
                  disabled={loading || !userEmail.trim()}
                  className="flex-1"
                >
                  {loading ? 'جاري الإعداد...' : 'بدء الإعداد'}
                </Button>
                {onCancel && (
                  <Button variant="outline" onClick={onCancel}>
                    إلغاء
                  </Button>
                )}
              </div>
            </div>
          )}

          {step === 'verify' && mfaData && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">الخطوة 1: إضافة الحساب إلى تطبيق المصادقة</h3>
                <p className="text-sm text-gray-600 mb-4">
                  امسح رمز QR أدناه باستخدام تطبيق المصادقة على هاتفك
                </p>
                
                <div className="bg-white p-4 rounded-lg border-2 border-dashed border-gray-300 inline-block">
                  <img 
                    src={mfaData.qrCode} 
                    alt="QR Code for MFA setup" 
                    className="w-48 h-48"
                  />
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium mb-2">أو أدخل المفتاح السري يدوياً:</h4>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-white px-3 py-2 rounded border text-sm font-mono">
                    {mfaData.secret}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={copySecret}
                    className="shrink-0"
                  >
                    {copiedSecret ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">رموز النسخ الاحتياطي:</h4>
                <p className="text-sm text-blue-800 mb-3">
                  احتفظ بهذه الرموز في مكان آمن. يمكنك استخدامها للوصول إلى حسابك في حالة فقدان جهازك.
                </p>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {mfaData.backupCodes.map((code, index) => (
                    <code key={index} className="bg-white px-2 py-1 rounded text-sm font-mono text-center">
                      {code}
                    </code>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={copyBackupCodes}
                    className="flex-1"
                  >
                    {copiedCodes ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                    نسخ الرموز
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={downloadBackupCodes}
                    className="flex-1"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    تحميل
                  </Button>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">الخطوة 2: تأكيد الإعداد</h3>
                <p className="text-sm text-gray-600 mb-4">
                  أدخل رمز التحقق المكون من 6 أرقام من تطبيق المصادقة
                </p>
                <div className="flex gap-3">
                  <Input
                    type="text"
                    value={verificationToken}
                    onChange={(e) => setVerificationToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    className="flex-1 text-center text-2xl tracking-widest"
                    maxLength={6}
                  />
                  <Button
                    onClick={handleVerifyMFA}
                    disabled={loading || verificationToken.length !== 6}
                    className="px-8"
                  >
                    {loading ? 'جاري التحقق...' : 'تحقق'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {step === 'complete' && (
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-green-900">تم تفعيل المصادقة الثنائية بنجاح!</h3>
              <p className="text-gray-600">
                حسابك محمي الآن بالمصادقة الثنائية. ستحتاج إلى رمز التحقق في كل مرة تسجل فيها الدخول.
              </p>
              <div className="flex gap-3 justify-center">
                <Button onClick={onComplete}>
                  متابعة
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MFASetup;
