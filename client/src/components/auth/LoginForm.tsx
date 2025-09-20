import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useLocation } from 'wouter';

// Login form validation schema
const loginSchema = z.object({
  username: z.string().min(1, { message: 'اسم المستخدم مطلوب' }),
  password: z.string().min(1, { message: 'كلمة المرور مطلوبة' }),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSuccess?: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const login = useMutation({
    mutationFn: async (data: LoginFormData) => {
      setIsLoading(true);
      try {
        // Simple, safe metadata collection
        const basicFingerprint = navigator.userAgent + '|' + navigator.language + '|' + screen.width + 'x' + screen.height;
        const hash = Array.from(basicFingerprint).reduce((hash, char) => {
          const charCode = char.charCodeAt(0);
          hash = ((hash << 5) - hash) + charCode;
          return hash & hash; // Convert to 32-bit integer
        }, 0);
        
        const loginData = {
          ...data,
          fingerprint: Math.abs(hash).toString(36),
          deviceInfo: JSON.stringify({
            userAgent: navigator.userAgent,
            language: navigator.language,
            screen: `${screen.width}x${screen.height}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            timestamp: new Date().toISOString()
          })
        };
        
        // Use the apiRequest function for API calls
        const res = await apiRequest('POST', '/api/login', loginData);
        
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || 'Login failed');
        }
        
        const userData = await res.json();
        return userData;
      } catch (error) {
        console.error('Login error:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      // Store JWT token if provided
      if (data.token) {
        import('@/lib/jwtUtils').then(({ saveToken }) => {
          saveToken(data.token);
          console.log('JWT token saved successfully');
        });
      }
      
      // Ensure we have user data before setting cache
      if (data.user && typeof data.user === 'object') {
      // Update user data in React Query cache
        queryClient.setQueryData(['/api/user'], data.user);
      }
      
      toast({
        title: 'تم تسجيل الدخول بنجاح',
        description: `مرحباً بعودتك ${data.user?.username}`,
      });
      
      // Redirect all authenticated users to the dashboard
      setLocation('/mgt-system-2024');
      
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'خطأ في تسجيل الدخول',
        description: error.message,
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setIsLoading(false);
    },
  });

  const onSubmit = (data: LoginFormData) => {
    login.mutate(data);
  };

  return (
    <div className="w-full">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>اسم المستخدم</FormLabel>
                <FormControl>
                  <Input
                    placeholder="ادخل اسم المستخدم"
                    autoComplete="username"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>كلمة المرور</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="ادخل كلمة المرور"
                    autoComplete="current-password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            className="w-full mt-6 bg-primary hover:bg-primary/90"
            disabled={isLoading}
          >
            {isLoading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default LoginForm;