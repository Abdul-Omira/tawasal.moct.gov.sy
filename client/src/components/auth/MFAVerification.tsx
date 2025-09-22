/**
 * MFA Verification Component
 * Handles MFA token verification during login
 * 
 * @author Syrian Ministry of Communications
 * @version 1.0.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Smartphone, RefreshCw, AlertCircle, Key } from 'lucide-react';
import { toast } from 'sonner';

interface MFAVerificationProps {
  userId: string;
  onSuccess: () => void;
  onCancel: () => void;
  onUseBackupCode?: () => void;
}

const MFAVerification: React.FC<MFAVerificationProps> = ({
  userId,
  onSuccess,
  onCancel,
  onUseBackupCode
}) => {
  const [token, setToken] = useState('');
  const [backupCode, setBackupCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showBackupCode, setShowBackupCode] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isVerifying, setIsVerifying] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const backupInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus on input when component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Timer for token refresh
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  // Reset timer every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(30);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Handle token input
  const handleTokenChange = (value: string) => {
    const cleanValue = value.replace(/\D/g, '').slice(0, 6);
    setToken(cleanValue);
    setError(null);

    // Auto-submit when 6 digits are entered
    if (cleanValue.length === 6) {
      handleVerifyToken();
    }
  };

  // Handle backup code input
  const handleBackupCodeChange = (value: string) => {
    const cleanValue = value.replace(/\D/g, '').slice(0, 8);
    setBackupCode(cleanValue);
    setError(null);

    // Auto-submit when 8 characters are entered
    if (cleanValue.length === 8) {
      handleVerifyBackupCode();
    }
  };

  // Verify MFA token
  const handleVerifyToken = async () => {
    if (token.length !== 6) {
      setError('رمز التحقق يجب أن يكون 6 أرقام');
      return;
    }

    setLoading(true);
    setError(null);
    setIsVerifying(true);

    try {
      const response = await fetch('/api/auth/mfa/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, token }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('تم التحقق من المصادقة الثنائية بنجاح');
        onSuccess();
      } else {
        setError(result.message || 'رمز التحقق غير صحيح');
        setToken('');
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }
    } catch (error) {
      console.error('Error verifying MFA token:', error);
      setError('حدث خطأ في الاتصال');
      setToken('');
    } finally {
      setLoading(false);
      setIsVerifying(false);
    }
  };

  // Verify backup code
  const handleVerifyBackupCode = async () => {
    if (backupCode.length !== 8) {
      setError('رمز النسخ الاحتياطي يجب أن يكون 8 أحرف');
      return;
    }

    setLoading(true);
    setError(null);
    setIsVerifying(true);

    try {
      const response = await fetch('/api/auth/mfa/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, token: backupCode, isBackupCode: true }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('تم التحقق من رمز النسخ الاحتياطي بنجاح');
        onSuccess();
      } else {
        setError(result.message || 'رمز النسخ الاحتياطي غير صحيح');
        setBackupCode('');
        if (backupInputRef.current) {
          backupInputRef.current.focus();
        }
      }
    } catch (error) {
      console.error('Error verifying backup code:', error);
      setError('حدث خطأ في الاتصال');
      setBackupCode('');
    } finally {
      setLoading(false);
      setIsVerifying(false);
    }
  };

  // Toggle between token and backup code input
  const toggleInputMode = () => {
    setShowBackupCode(!showBackupCode);
    setToken('');
    setBackupCode('');
    setError(null);
    
    // Focus on the appropriate input
    setTimeout(() => {
      if (showBackupCode && inputRef.current) {
        inputRef.current.focus();
      } else if (!showBackupCode && backupInputRef.current) {
        backupInputRef.current.focus();
      }
    }, 100);
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-6 h-6 text-blue-600" />
          </div>
          <CardTitle className="text-xl">المصادقة الثنائية</CardTitle>
          <CardDescription>
            أدخل رمز التحقق من تطبيق المصادقة على هاتفك
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!showBackupCode ? (
            <div className="space-y-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Smartphone className="w-5 h-5 text-gray-600" />
                  <span className="text-sm font-medium">رمز التحقق</span>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  أدخل الرمز المكون من 6 أرقام من تطبيق المصادقة
                </p>
                
                <div className="relative">
                  <Input
                    ref={inputRef}
                    type="text"
                    value={token}
                    onChange={(e) => handleTokenChange(e.target.value)}
                    placeholder="000000"
                    className="text-center text-2xl tracking-widest font-mono"
                    maxLength={6}
                    disabled={loading}
                  />
                  {isVerifying && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
                      <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-center gap-2 mt-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                  <span className="text-xs text-gray-500">
                    يتجدد كل {timeLeft} ثانية
                  </span>
                </div>
              </div>

              <div className="text-center">
                <Button
                  variant="link"
                  onClick={toggleInputMode}
                  className="text-sm"
                >
                  <Key className="w-4 h-4 mr-1" />
                  استخدام رمز النسخ الاحتياطي
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Key className="w-5 h-5 text-gray-600" />
                  <span className="text-sm font-medium">رمز النسخ الاحتياطي</span>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  أدخل رمز النسخ الاحتياطي المكون من 8 أحرف
                </p>
                
                <div className="relative">
                  <Input
                    ref={backupInputRef}
                    type="text"
                    value={backupCode}
                    onChange={(e) => handleBackupCodeChange(e.target.value)}
                    placeholder="12345678"
                    className="text-center text-lg tracking-wider font-mono"
                    maxLength={8}
                    disabled={loading}
                  />
                  {isVerifying && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
                      <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
                    </div>
                  )}
                </div>
              </div>

              <div className="text-center">
                <Button
                  variant="link"
                  onClick={toggleInputMode}
                  className="text-sm"
                >
                  <Smartphone className="w-4 h-4 mr-1" />
                  استخدام رمز التحقق
                </Button>
              </div>
            </div>
          )}

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-start">
              <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 mr-2" />
              <div className="text-xs text-yellow-800">
                <p className="font-medium mb-1">ملاحظة:</p>
                <p>
                  إذا لم تستطع الوصول إلى تطبيق المصادقة، استخدم رمز النسخ الاحتياطي.
                  يمكنك العثور على رموز النسخ الاحتياطي في إعدادات الحساب.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={showBackupCode ? handleVerifyBackupCode : handleVerifyToken}
              disabled={loading || (showBackupCode ? backupCode.length !== 8 : token.length !== 6)}
              className="flex-1"
            >
              {loading ? 'جاري التحقق...' : 'تحقق'}
            </Button>
            <Button variant="outline" onClick={onCancel}>
              إلغاء
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MFAVerification;
