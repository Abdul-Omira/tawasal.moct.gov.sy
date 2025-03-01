/**
 * Syrian Ministry of Communication - Citizen Engagement Platform
 * Citizen Communication Form Component
 * 
 * @author Abdulwahab Omira <abdul@omiratech.com>
 * @version 1.0.0
 * @license MIT
 */

import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { getDeviceFingerprint, collectDeviceInfo, collectEnhancedDeviceInfo } from '@/lib/fingerprint';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Printer, Paperclip } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { FileUpload } from '@/components/ui/file-upload';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CountryCodeInput } from '@/components/ui/country-code-input';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { isValidEmail, isValidPhone } from '@/lib/utils';

// Import the proper schema from shared
import { CitizenCommunicationSchema } from '@shared/schema';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      delayChildren: 0.3,
      staggerChildren: 0.1
    }
  }
};

const formItemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.5
    }
  }
};

const CitizenCommunicationForm: React.FC = () => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [captchaError, setCaptchaError] = useState('');
  const [captchaData, setCaptchaData] = useState<{id: string, question: string, token: string} | null>(null);
  
  // State to track submission success
  const [submissionSuccessful, setSubmissionSuccessful] = useState(false);
  const [submissionId, setSubmissionId] = useState<number | null>(null);
  
  // State for file attachment
  const [fileAttachment, setFileAttachment] = useState<{
    url: string;
    name: string;
    type: string;
    size: number;
  } | null>(null);
  
  const [fileUploadError, setFileUploadError] = useState<string | null>(null);

  // Form handling
  const form = useForm<z.infer<typeof CitizenCommunicationSchema>>({
    resolver: zodResolver(CitizenCommunicationSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      governorate: '',
      communicationType: '',
      subject: '',
      message: '',
      attachmentUrl: '',
      attachmentName: '',
      attachmentType: '',
      attachmentSize: undefined,
      captchaAnswer: '',
      consentToDataUse: false,
      wantsUpdates: false,
    }
  });

  // Function to fetch CAPTCHA data
  const fetchCaptcha = async () => {
    try {
      setCaptchaError('');
      const response = await fetch('/api/captcha');
      const data = await response.json();
      setCaptchaData(data);
      // Clear the captcha answer when refreshing
      form.setValue('captchaAnswer', '');
    } catch (error) {
      console.error('Failed to fetch CAPTCHA:', error);
      setCaptchaError('فشل في تحميل CAPTCHA');
    }
  };

  // Fetch CAPTCHA data on component mount
  useEffect(() => {
    fetchCaptcha();
  }, []);
  
  // Form mutation
  const { mutate, isPending } = useMutation({
    mutationFn: async (data: any) => {
      // Capture enhanced metadata and fingerprint for submission tracking
      const [fingerprint, enhancedDeviceInfo] = await Promise.all([
        getDeviceFingerprint(),
        collectEnhancedDeviceInfo()
      ]);
      
      const clientMetadata = {
        pageUrl: window.location.href,
        referrerUrl: document.referrer || '',
        userAgent: navigator.userAgent,
        language: navigator.language,
        screenResolution: `${screen.width}x${screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        javascriptEnabled: true,
        cookiesEnabled: navigator.cookieEnabled,
        touchSupport: 'ontouchstart' in window,
        pageLoadTime: Math.round(performance.now()),
        timestamp: new Date().toISOString(),
        webglFingerprint: fingerprint,
        deviceInfo: JSON.stringify(enhancedDeviceInfo),
        // Include MAC-like hardware fingerprint
        hardwareMAC: enhancedDeviceInfo.hardwareMAC,
        // VPN detection data
        vpnDetection: JSON.stringify(enhancedDeviceInfo.vpnDetection),
        webRTCInfo: JSON.stringify(enhancedDeviceInfo.webRTCInfo)
      };
      
      const dataWithMetadata = {
        ...data,
        clientMetadata,
        captchaId: captchaData?.id,
        captchaToken: captchaData?.token
      };
      
      
      const response = await apiRequest('/api/citizen-communications', 'POST', dataWithMetadata);
      return response.json();
    },
    onSuccess: (data: any) => {
      // Set submission success state
      setSubmissionSuccessful(true);
      if (data && typeof data === 'object' && 'id' in data) {
        setSubmissionId(data.id);
      }
      
      // Show success toast
      toast({
        title: "تم إرسال الرسالة بنجاح",
        description: "سوف نقوم بمراجعة الرسالة والرد عليها في أقرب وقت ممكن",
        variant: "default",
      });
    },
    onError: (error: any) => {
      console.error('Form submission error:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response,
        status: error.status
      });
      
      // If it's a CAPTCHA error, refresh the CAPTCHA
      if (error.message && error.message.includes('CAPTCHA')) {
        fetchCaptcha();
        setCaptchaError('يرجى إعادة المحاولة مع سؤال CAPTCHA الجديد');
      }
      
      // Show error toast with more details
      toast({
        title: "خطأ في إرسال الرسالة",
        description: error.message || "حدث خطأ أثناء إرسال الرسالة، يرجى المحاولة مرة أخرى",
        variant: "destructive",
      });
    }
  });
  
  // Form submission handler
  const onSubmit = async (data: any) => {
    // Reset captcha error
    setCaptchaError('');
    
    // Submit form - metadata captured in mutation
    mutate(data);
  };
  
  // Render success view
  if (submissionSuccessful) {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="font-ibm"
      >
        <Card className="bg-white rounded-lg shadow-md max-w-3xl mx-auto animate-smooth">
          <CardContent className="p-6 md:p-8 text-center">
            <div className="text-center my-10">
              <CheckCircle className="w-16 h-16 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2 text-center text-foreground font-ibm">
                تم إرسال الرسالة بنجاح
              </h2>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                شكراً لك على التواصل مع وزارة الاتصالات. سنقوم بمراجعة رسالتك والعمل عليها في أقرب وقت ممكن.
              </p>
              
              <div className="flex flex-wrap justify-center gap-4">
                <Button onClick={() => setSubmissionSuccessful(false)} variant="default">
                  إرسال رسالة جديدة
                </Button>
                
                {submissionId && (
                  <Link href={`/confirmation/${submissionId}`}>
                    <Button variant="outline">
                      <Printer className="ml-2 h-4 w-4" />
                      طباعة التأكيد
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="font-ibm"
    >
      <Card className="bg-white rounded-lg shadow-md max-w-3xl mx-auto animate-smooth">
        <CardContent className="p-6 md:p-8">
          <motion.h2
            className="text-2xl font-bold mb-6 text-center text-foreground font-ibm"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            استمارة التواصل الرسمية مع وزارة الاتصالات
          </motion.h2>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <motion.div 
                className="space-y-6"
                variants={containerVariants}
              >
                <motion.div 
                  className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6"
                  variants={formItemVariants}
                >
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem className="animate-smooth">
                        <FormLabel className="font-medium">الاسم الكامل *</FormLabel>
                        <FormControl>
                          <Input {...field} className="focus:border-primary focus:ring-1 focus:ring-primary animate-smooth font-ibm" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="governorate"
                    render={({ field }) => (
                      <FormItem className="animate-smooth">
                        <FormLabel className="font-medium">المحافظة *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value || ""}
                        >
                          <FormControl>
                            <SelectTrigger className="focus:ring-1 focus:ring-primary animate-smooth font-ibm">
                              <SelectValue placeholder="اختر المحافظة" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="font-ibm">
                            <SelectItem value="دمشق">دمشق</SelectItem>
                            <SelectItem value="حلب">حلب</SelectItem>
                            <SelectItem value="حمص">حمص</SelectItem>
                            <SelectItem value="اللاذقية">اللاذقية</SelectItem>
                            <SelectItem value="حماة">حماة</SelectItem>
                            <SelectItem value="طرطوس">طرطوس</SelectItem>
                            <SelectItem value="دير الزور">دير الزور</SelectItem>
                            <SelectItem value="السويداء">السويداء</SelectItem>
                            <SelectItem value="الحسكة">الحسكة</SelectItem>
                            <SelectItem value="درعا">درعا</SelectItem>
                            <SelectItem value="إدلب">إدلب</SelectItem>
                            <SelectItem value="الرقة">الرقة</SelectItem>
                            <SelectItem value="القنيطرة">القنيطرة</SelectItem>
                            <SelectItem value="ريف دمشق">ريف دمشق</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </motion.div>

                <motion.div 
                  className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6"
                  variants={formItemVariants}
                >
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem className="animate-smooth">
                        <FormLabel className="font-medium">رقم الهاتف *</FormLabel>
                        <FormControl>
                          <CountryCodeInput 
                            value={field.value || ''} 
                            onChange={field.onChange}
                            className="focus:border-primary focus:ring-1 focus:ring-primary animate-smooth font-ibm"
                            placeholder="9xx xxx xxx"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem className="animate-smooth">
                        <FormLabel className="font-medium">البريد الإلكتروني *</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="email" 
                            className="focus:border-primary focus:ring-1 focus:ring-primary animate-smooth font-ibm" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </motion.div>
                
                <motion.div variants={formItemVariants}>
                  <FormField
                    control={form.control}
                    name="communicationType"
                    render={({ field }) => (
                      <FormItem className="animate-smooth">
                        <FormLabel className="font-medium">نوع التواصل *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value || ""}
                        >
                          <FormControl>
                            <SelectTrigger className="focus:ring-1 focus:ring-primary animate-smooth font-ibm">
                              <SelectValue placeholder="اختر نوع التواصل" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="font-ibm">
                            <SelectItem value="اقتراح">اقتراح</SelectItem>
                            <SelectItem value="شكوى">شكوى</SelectItem>
                            <SelectItem value="استفسار">استفسار</SelectItem>
                            <SelectItem value="مشروع">فكرة مشروع</SelectItem>
                            <SelectItem value="طلب">طلب</SelectItem>
                            <SelectItem value="أخرى">أخرى</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </motion.div>
                
                <motion.div variants={formItemVariants}>
                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem className="animate-smooth">
                        <FormLabel className="font-medium">موضوع الرسالة *</FormLabel>
                        <FormControl>
                          <Input 
                            {...field}
                            className="focus:border-primary focus:ring-1 focus:ring-primary animate-smooth font-ibm"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </motion.div>
                
                <motion.div variants={formItemVariants}>
                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem className="animate-smooth">
                        <FormLabel className="font-medium">نص الرسالة *</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            rows={5}
                            placeholder="يرجى كتابة رسالتك بالتفصيل..." 
                            className="focus:border-primary focus:ring-1 focus:ring-primary animate-smooth resize-none md:resize-y font-ibm"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </motion.div>
                
                <motion.div variants={formItemVariants}>
                  <div className="animate-smooth">
                    <label className="font-medium block mb-2">إرفاق ملف (اختياري)</label>
                    <FileUpload 
                      onFileUploaded={(fileData) => {
                        setFileAttachment(fileData);
                        form.setValue('attachmentUrl', fileData.url);
                        form.setValue('attachmentName', fileData.name);
                        form.setValue('attachmentType', fileData.type);
                        // Convert to number for form
                        form.setValue('attachmentSize', Number(fileData.size));
                      }}
                      onUploadError={(error) => {
                        setFileUploadError(error);
                      }}
                      maxSizeMB={5}
                      allowedTypes={[
                        'image/jpeg', 
                        'image/png', 
                        'image/gif', 
                        'application/pdf',
                        'application/msword',
                        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                        'text/plain'
                      ]}
                    />
                    {fileUploadError && <p className="text-red-500 text-sm mt-1">{fileUploadError}</p>}
                    {fileAttachment && fileAttachment.url && (
                      <div className="mt-2 p-2 border rounded flex items-center justify-between">
                        <div className="flex items-center">
                          <Paperclip className="h-4 w-4 ml-2 text-primary" />
                          <span className="text-sm">تم إرفاق ملف بنجاح ({(fileAttachment.size / 1024).toFixed(1)} KB)</span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => {
                            // Open file in new tab if it's an image or PDF
                            if (fileAttachment.type.startsWith('image/') || 
                                fileAttachment.type === 'application/pdf') {
                              window.open(fileAttachment.url, '_blank');
                            }
                          }}
                        >
                          عرض
                        </Button>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      يمكنك إرفاق صور أو ملفات PDF أو مستندات لتوضيح رسالتك. الحد الأقصى: 5 ميجابايت.
                    </p>
                  </div>
                </motion.div>
                
                <motion.div variants={formItemVariants}>
                  <FormField
                    control={form.control}
                    name="captchaAnswer"
                    render={({ field }) => (
                      <FormItem className="animate-smooth">
                        <FormLabel className="font-medium">التحقق الأمني *</FormLabel>
                        <FormControl>
                          <div className="space-y-2">
                            {captchaData ? (
                              <>
                                <div className="flex items-center justify-between bg-muted p-2 rounded">
                                  <p className="text-sm font-medium">
                                    {captchaData.question}
                                  </p>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={fetchCaptcha}
                                    className="text-xs"
                                  >
                                    تحديث
                                  </Button>
                                </div>
                                <Input
                                  {...field}
                                  placeholder="أدخل الإجابة"
                                  className="text-center"
                                />
                              </>
                            ) : (
                              <p className="text-sm text-muted-foreground">جاري تحميل السؤال...</p>
                            )}
                          </div>
                        </FormControl>
                        {captchaError && <p className="text-red-500 text-sm mt-1">{captchaError}</p>}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </motion.div>
                
                <motion.div variants={formItemVariants}>
                  <FormField
                    control={form.control}
                    name="consentToDataUse"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-x-reverse space-y-0 rounded-md p-4 shadow">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-sm font-medium leading-none">
                            أوافق على استخدام البيانات المقدمة لأغراض التحليل والتواصل معي *
                          </FormLabel>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </motion.div>
                
                <motion.div variants={formItemVariants}>
                  <FormField
                    control={form.control}
                    name="wantsUpdates"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-x-reverse space-y-0 rounded-md p-4 shadow">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-sm font-medium leading-none">
                            أرغب في الحصول على تحديثات حول خدمات وزارة الاتصالات عبر البريد الإلكتروني
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                </motion.div>
                
                <motion.div variants={formItemVariants} className="flex justify-center">
                  <Button 
                    type="submit" 
                    disabled={isPending}
                    className="w-full md:w-auto min-w-[200px] bg-primary hover:bg-primary/90 text-white font-ibm animate-smooth"
                  >
                    {isPending ? 'جارٍ الإرسال...' : 'إرسال الرسالة'}
                  </Button>
                </motion.div>
              </motion.div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default CitizenCommunicationForm;