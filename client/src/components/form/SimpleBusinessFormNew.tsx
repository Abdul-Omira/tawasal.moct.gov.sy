/**
 * Syrian Ministry of Communication - Citizen Engagement Platform
 * Business Submission Form Component
 * 
 * @author Abdulwahab Omira <abdul@omiratech.com>
 * @version 1.0.0
 * @license MIT
 */

import React, { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Printer, PlusCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CountryCodeInput } from '@/components/ui/country-code-input';
import { AdaptiveCaptcha } from '@/components/ui/adaptive-captcha';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { isValidEmail, isValidPhone } from '@/lib/utils';

// Create a simplified schema for the form
const SimpleFormSchema = z.object({
  contactName: z.string().min(1, { message: "الاسم مطلوب" }),
  phone: z.string().min(1, { message: "رقم الهاتف مطلوب" }).refine(isValidPhone, { message: "رقم الهاتف غير صالح" }),
  email: z.string().email({ message: "البريد الإلكتروني غير صالح" }),
  businessName: z.string().optional(),
  businessType: z.string().optional(),
  challengeDetails: z.string().min(1, { message: "يرجى تحديد التحدي الرئيسي للشركات المذكورة" }),
  sanctionedCompanyName: z.string().optional(),
  sanctionedCompanyLink: z.string().optional(),
  captchaAnswer: z.string().min(1, { message: "يرجى التحقق من أنك لست روبوت" }),
  consentToDataUse: z.boolean().refine(val => val === true, { message: "يجب الموافقة على استخدام البيانات" }),
});

const SimpleBusinessFormNew: React.FC = () => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [captchaError, setCaptchaError] = useState('');
  
  // State to track submission success
  const [submissionSuccessful, setSubmissionSuccessful] = useState(false);
  const [submissionId, setSubmissionId] = useState<number | null>(null);
  
  // Form handling
  const form = useForm({
    resolver: zodResolver(SimpleFormSchema),
    defaultValues: {
      businessName: '',
      businessType: '',
      contactName: '',
      phone: '',
      email: '',
      challengeDetails: '',
      sanctionedCompanyName: '',
      sanctionedCompanyLink: '',
      captchaAnswer: '',
      consentToDataUse: false,
    }
  });
  
  // Form mutation
  const { mutate, isPending } = useMutation({
    mutationFn: async (data: any) => {
      // Capture metadata for submission tracking
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
        timestamp: new Date().toISOString()
      };
      
      // Format data to comply with backend schema
      const formattedData = {
        ...data,
        employeesCount: "1-10",
        address: "سوريا",
        governorate: "دمشق",
        position: "مدير",
        establishmentDate: new Date().toISOString().split('T')[0],
        registrationNumber: Math.floor(Math.random() * 1000000).toString(),
        alternativeContact: "",
        website: "",
        challenges: ["sanctions"],
        techNeeds: ["internet_access"],
        techDetails: "",
        additionalComments: "",
        wantsUpdates: true,
        clientMetadata
      };
      
      const response = await apiRequest('/api/business-submissions', 'POST', formattedData);
      return response.json();
    },
    onSuccess: (data) => {
      // Update UI state to show success
      setSubmissionSuccessful(true);
      setSubmissionId(data.id);
      
      // Reset form after successful submission
      form.reset();
      
      toast({
        title: "تم إرسال البيانات بنجاح",
        description: "شكراً لتقديم معلومات شركتك. سيتم التواصل معك قريباً.",
        duration: 5000,
      });
      
      // Try to redirect to confirmation page
      try {
        setLocation(`/confirmation?id=${data.id}`);
      } catch (error) {
        console.error("Error redirecting to confirmation page:", error);
        // We'll show success message in-place if redirect fails
      }
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
        duration: 5000,
      });
    }
  });

  // Handle form submission
  const onSubmit = async (data: any) => {
    console.log("Form data:", data);
    
    // Capture client-side metadata
    console.log("Starting metadata capture process...");
    
    try {
      // Simple metadata capture for testing
      const clientMetadata = {
        pageUrl: window.location.href,
        referrerUrl: document.referrer,
        userAgent: navigator.userAgent,
        language: navigator.language,
        screenResolution: `${screen.width}x${screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        javascriptEnabled: true,
        cookiesEnabled: navigator.cookieEnabled,
        touchSupport: 'ontouchstart' in window,
        pageLoadTime: Math.round(performance.now()),
      };
      
      console.log("Captured client metadata:", clientMetadata);
      
      // Combine form data with metadata
      const submissionData = {
        ...data,
        clientMetadata
      };
      
      console.log("Submitting business submission:", submissionData);
      
      // Submit form with metadata
      mutate(submissionData);
    } catch (error) {
      console.error("Failed to capture metadata:", error);
      // Submit form without metadata if capture fails
      mutate(data);
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.2
      }
    }
  };

  const formItemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  const buttonVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.4, delay: 0.6 } }
  };

  // If submission was successful, show success UI
  if (submissionSuccessful) {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="font-ibm"
      >
        <Card className="bg-white rounded-lg shadow-md max-w-3xl mx-auto animate-smooth">
          <CardContent className="p-6 md:p-8">
            <div className="my-6 p-6 text-center">
              <div className="bg-green-50 text-green-700 p-6 rounded-md mb-6 inline-flex items-center justify-center">
                <CheckCircle className="h-12 w-12" />
              </div>
              <h2 className="text-xl md:text-2xl font-bold mb-3 text-primary font-ibm">
                تم إرسال طلبك بنجاح
              </h2>
              <p className="text-muted-foreground mb-4">
                شكراً لتقديم معلومات شركتك. سيتم مراجعة الطلب والتواصل معك قريباً.
              </p>
              {submissionId && (
                <p className="font-medium mb-6">
                  رقم الطلب: <span className="font-bold text-primary">SYR-2023-{submissionId}</span>
                </p>
              )}
              <div className="flex gap-4 flex-wrap justify-center">
                <Button 
                  className="bg-primary text-white hover:bg-primary/90"
                  onClick={() => {
                    setSubmissionSuccessful(false);
                    setSubmissionId(null);
                  }}
                >
                  <PlusCircle className="ml-2 h-4 w-4" />
                  تقديم طلب جديد
                </Button>
                <Link href={`/confirmation?id=${submissionId}`}>
                  <Button variant="outline">
                    <Printer className="ml-2 h-4 w-4" />
                    طباعة التأكيد
                  </Button>
                </Link>
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
            استمارة تقديم المعلومات
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
                    name="contactName"
                    render={({ field }) => (
                      <FormItem className="animate-smooth">
                        <FormLabel className="font-medium">
                          الاسم <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="أدخل الاسم" 
                            className="focus:border-primary focus:ring-1 focus:ring-primary animate-smooth font-ibm"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="businessName"
                    render={({ field }) => (
                      <FormItem className="animate-smooth">
                        <FormLabel className="font-medium">
                          اسم الشركة
                        </FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="أدخل اسم الشركة (اختياري)" 
                            className="focus:border-primary focus:ring-1 focus:ring-primary animate-smooth font-ibm"
                          />
                        </FormControl>
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
                    name="businessType"
                    render={({ field }) => (
                      <FormItem className="animate-smooth">
                        <FormLabel className="font-medium">
                          نوع النشاط
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="focus:border-primary focus:ring-1 focus:ring-primary animate-smooth font-ibm">
                              <SelectValue placeholder="اختر نوع النشاط (اختياري)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="font-ibm">
                            <SelectItem value="technology">تكنولوجيا المعلومات والاتصالات</SelectItem>
                            <SelectItem value="software">تطوير البرمجيات</SelectItem>
                            <SelectItem value="ecommerce">التجارة الإلكترونية</SelectItem>
                            <SelectItem value="manufacturing">الصناعات التحويلية</SelectItem>
                            <SelectItem value="agriculture">الزراعة والإنتاج الغذائي</SelectItem>
                            <SelectItem value="textile">صناعة النسيج والألبسة</SelectItem>
                            <SelectItem value="retail">تجارة التجزئة</SelectItem>
                            <SelectItem value="wholesale">تجارة الجملة</SelectItem>
                            <SelectItem value="healthcare">الرعاية الصحية والطبية</SelectItem>
                            <SelectItem value="education">التعليم والتدريب</SelectItem>
                            <SelectItem value="tourism">السياحة والضيافة</SelectItem>
                            <SelectItem value="transport">النقل واللوجستيات</SelectItem>
                            <SelectItem value="pharmacy">صناعة الأدوية</SelectItem>
                            <SelectItem value="construction">البناء والمقاولات</SelectItem>
                            <SelectItem value="energy">الطاقة والكهرباء</SelectItem>
                            <SelectItem value="professional_services">خدمات مهنية</SelectItem>
                            <SelectItem value="financial">الخدمات المالية</SelectItem>
                            <SelectItem value="other">أخرى</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem className="animate-smooth">
                        <FormLabel className="font-medium">
                          رقم الهاتف <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <CountryCodeInput 
                            value={field.value} 
                            onChange={field.onChange}
                            placeholder="أدخل رقم الهاتف" 
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
                    name="email"
                    render={({ field }) => (
                      <FormItem className="animate-smooth">
                        <FormLabel className="font-medium">
                          البريد الإلكتروني <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="email" 
                            {...field} 
                            placeholder="example@domain.com" 
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
                    name="challengeDetails"
                    render={({ field }) => (
                      <FormItem className="animate-smooth">
                        <FormLabel className="font-medium">
                          اذكر اسم الشركات التي ترغب بتسريع إتاحتها للخدمات في سورية بعد إيقاف الاجراءات الأميركية <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Textarea 
                            rows={3} 
                            {...field} 
                            placeholder="أدخل أسماء الشركات الأميركية والعالمية التي تود استعادة خدماتها في سورية..." 
                            className="focus:border-primary focus:ring-1 focus:ring-primary animate-smooth resize-none md:resize-y font-ibm"
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
                    name="sanctionedCompanyName"
                    render={({ field }) => (
                      <FormItem className="animate-smooth">
                        <FormLabel className="font-medium">
                          حدد التحدي الرئيسي الذي ترغب في حله في كل شركة ذكرتها
                        </FormLabel>
                        <FormControl>
                          <Textarea 
                            rows={3}
                            {...field} 
                            placeholder="اذكر التحديات المرتبطة بكل شركة من الشركات المذكورة أعلاه..." 
                            className="focus:border-primary focus:ring-1 focus:ring-primary animate-smooth resize-none md:resize-y font-ibm"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </motion.div>
                
                <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6" variants={formItemVariants}>
                  <FormField
                    control={form.control}
                    name="sanctionedCompanyLink"
                    render={({ field }) => (
                      <FormItem className="animate-smooth">
                        <FormLabel className="font-medium">
                          روابط الشركات (اختياري)
                        </FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="مثال: https://google.com, https://microsoft.com" 
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
                    name="captchaAnswer"
                    render={({ field }) => (
                      <FormItem className="animate-smooth">
                        <FormLabel className="font-medium">
                          التحقق الأمني <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <AdaptiveCaptcha
                            value={field.value}
                            onChange={field.onChange}
                            error={captchaError}
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
                    name="consentToDataUse"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-2 space-x-reverse rtl:space-x-reverse">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="animate-smooth mt-1"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-tight">
                          <FormLabel className="text-sm font-medium">
                            أوافق على معالجة بياناتي لغرض التواصل والدعم وفقاً لسياسة الخصوصية <span className="text-destructive">*</span>
                          </FormLabel>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </motion.div>
              </motion.div>
              
              <motion.div 
                className="flex justify-center pt-6"
                variants={buttonVariants}
              >
                <Button 
                  type="submit" 
                  className="bg-primary text-white w-full sm:w-auto px-8 py-6 text-base shadow-md animate-smooth font-ibm"
                  disabled={isPending}
                >
                  {isPending ? "جاري الإرسال..." : "إرسال الطلب"}
                </Button>
              </motion.div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default SimpleBusinessFormNew;