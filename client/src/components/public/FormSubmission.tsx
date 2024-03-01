/**
 * Form Builder Platform - Form Submission Component
 * Handles form submission and response collection
 */

import React, { useState, useEffect } from 'react';
import { Form, FormResponse, UserInfo } from '../../types/form';
import { cn } from '../../lib/utils';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  UserIcon,
  DevicePhoneMobileIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';

interface FormSubmissionProps {
  form: Form;
  response: FormResponse;
  onEditResponse?: () => void;
  onNewResponse?: () => void;
  showUserInfo?: boolean;
}

export const FormSubmission: React.FC<FormSubmissionProps> = ({
  form,
  response,
  onEditResponse,
  onNewResponse,
  showUserInfo = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<Record<string, any>>(response.responseData);

  // Format submission date
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  // Get device type from user agent
  const getDeviceType = (userAgent: string) => {
    if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
      return 'جوال';
    } else if (/Tablet|iPad/.test(userAgent)) {
      return 'تابلت';
    } else {
      return 'كمبيوتر';
    }
  };

  // Get browser info
  const getBrowserInfo = (userAgent: string) => {
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'متصفح آخر';
  };

  // Handle edit toggle
  const handleEditToggle = () => {
    if (isEditing) {
      // Save changes
      // This would typically call an API to update the response
      console.log('Saving edited response:', editedData);
    }
    setIsEditing(!isEditing);
  };

  // Handle field change
  const handleFieldChange = (fieldId: string, value: any) => {
    setEditedData(prev => ({
      ...prev,
      [fieldId]: value,
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {form.title}
              </h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                إجابة النموذج
              </p>
            </div>
            <div className="flex items-center space-x-3 space-x-reverse">
              {onEditResponse && (
                <button
                  onClick={handleEditToggle}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                  {isEditing ? 'حفظ التعديلات' : 'تعديل الإجابة'}
                </button>
              )}
              {onNewResponse && (
                <button
                  onClick={onNewResponse}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  إجابة جديدة
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Submission Info */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg mb-6">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
              معلومات الإرسال
            </h2>
          </div>
          <div className="px-6 py-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex items-center">
                <ClockIcon className="h-5 w-5 text-gray-400 ml-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    تاريخ الإرسال
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(response.submittedAt)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center">
                <CheckCircleIcon className="h-5 w-5 text-green-400 ml-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    الحالة
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {response.status === 'completed' ? 'مكتمل' : 'جزئي'}
                  </p>
                </div>
              </div>

              <div className="flex items-center">
                <ExclamationTriangleIcon className="h-5 w-5 text-blue-400 ml-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    معرف الإجابة
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                    {response.id}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* User Info */}
        {showUserInfo && response.userInfo && (
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg mb-6">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                معلومات المستخدم
              </h2>
            </div>
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {response.userInfo.language && (
                  <div className="flex items-center">
                    <GlobeAltIcon className="h-5 w-5 text-gray-400 ml-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        اللغة
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {response.userInfo.language}
                      </p>
                    </div>
                  </div>
                )}

                {response.userInfo.timezone && (
                  <div className="flex items-center">
                    <ClockIcon className="h-5 w-5 text-gray-400 ml-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        المنطقة الزمنية
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {response.userInfo.timezone}
                      </p>
                    </div>
                  </div>
                )}

                {response.userInfo.userAgent && (
                  <div className="flex items-center">
                    <DevicePhoneMobileIcon className="h-5 w-5 text-gray-400 ml-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        نوع الجهاز
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {getDeviceType(response.userInfo.userAgent)}
                      </p>
                    </div>
                  </div>
                )}

                {response.userInfo.userAgent && (
                  <div className="flex items-center">
                    <UserIcon className="h-5 w-5 text-gray-400 ml-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        المتصفح
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {getBrowserInfo(response.userInfo.userAgent)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Response Data */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
              بيانات الإجابة
            </h2>
          </div>
          <div className="px-6 py-4">
            <div className="space-y-6">
              {Object.entries(response.responseData).map(([fieldId, value]) => (
                <div key={fieldId} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-b-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                        {fieldId}
                      </h3>
                      {isEditing ? (
                        <input
                          type="text"
                          value={value || ''}
                          onChange={(e) => handleFieldChange(fieldId, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      ) : (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {Array.isArray(value) ? value.join(', ') : String(value || 'لا توجد إجابة')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            آخر تحديث: {formatDate(response.submittedAt)}
          </div>
          <div className="flex items-center space-x-3 space-x-reverse">
            {isEditing && (
              <button
                onClick={() => setIsEditing(false)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                إلغاء
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormSubmission;
