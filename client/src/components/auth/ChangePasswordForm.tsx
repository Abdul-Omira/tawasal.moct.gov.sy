import React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

// Schema for password change
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "كلمة المرور الحالية مطلوبة"),
  newPassword: z.string().min(8, "يجب أن تكون كلمة المرور 8 أحرف على الأقل"),
  confirmPassword: z.string().min(1, "تأكيد كلمة المرور مطلوب"),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "كلمة المرور الجديدة وتأكيدها غير متطابقين",
  path: ["confirmPassword"]
});

type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

export function ChangePasswordForm() {
  const { toast } = useToast();
  
  // Form definition
  const form = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    }
  });
  
  // Password change mutation
  const { mutate, isPending, isSuccess, isError, error } = useMutation({
    mutationFn: async (data: { currentPassword: string, newPassword: string }) => {
      const response = await apiRequest('POST', '/api/user/change-password', data);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'حدث خطأ أثناء تغيير كلمة المرور');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "تم تغيير كلمة المرور",
        description: "تم تحديث كلمة المرور بنجاح",
        variant: "default",
      });
      
      // Reset the form
      form.reset({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
    },
    onError: (error: any) => {
      toast({
        title: "فشل في تغيير كلمة المرور",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const onSubmit = (data: ChangePasswordFormValues) => {
    mutate({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>تغيير كلمة المرور</CardTitle>
        <CardDescription>قم بتحديث كلمة المرور الخاصة بك بشكل دوري للحفاظ على أمان حسابك</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>كلمة المرور الحالية</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="أدخل كلمة المرور الحالية"
                      {...field}
                      autoComplete="current-password"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>كلمة المرور الجديدة</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="أدخل كلمة المرور الجديدة"
                      {...field}
                      autoComplete="new-password"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>تأكيد كلمة المرور</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="أعد إدخال كلمة المرور الجديدة"
                      {...field}
                      autoComplete="new-password"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {isSuccess && (
              <div className="bg-green-50 text-green-700 px-4 py-3 rounded-md flex items-center">
                <CheckCircle className="h-5 w-5 ml-2 flex-shrink-0" />
                <span>تم تغيير كلمة المرور بنجاح</span>
              </div>
            )}
            
            {isError && (
              <div className="bg-red-50 text-red-700 px-4 py-3 rounded-md flex items-center">
                <AlertCircle className="h-5 w-5 ml-2 flex-shrink-0" />
                <span>{(error as Error)?.message || "فشل في تغيير كلمة المرور"}</span>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري التحديث...
                </>
              ) : "تغيير كلمة المرور"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

export default ChangePasswordForm;