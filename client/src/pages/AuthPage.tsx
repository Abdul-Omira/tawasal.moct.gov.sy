import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import SimpleHeader from '@/components/layout/SimpleHeader';
import SimpleFooter from '@/components/layout/SimpleFooter';
import LoginForm from '@/components/auth/LoginForm';
import { motion } from 'framer-motion';
import syrianLogoSvg from '../assets/syrian-logo-gold.svg';
import { useAuth } from '@/hooks/useAuth';
import PageSEO from '@/components/seo/PageSEO';

const AuthPage: React.FC = () => {
  const [location, setLocation] = useLocation();
  const { user, isLoading, isAuthenticated, isAdmin } = useAuth();
  
  // If user is already logged in, redirect to dashboard
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      setLocation('/mgt-system-2024');
    }
  }, [isAuthenticated, isLoading, setLocation]);

  // Removed infinite loading check to prevent getting stuck
  // We'll only render the auth form for unauthenticated users

  return (
    <div className="flex flex-col min-h-screen">
      <PageSEO 
        pageName="auth"
        customTitle="تسجيل الدخول - منصة التواصل مع وزير الاتصالات وتقانة المعلومات"
        customDescription="صفحة تسجيل الدخول إلى منصة التواصل المباشر مع وزير الاتصالات وتقانة المعلومات لإدارة رسائل المواطنين"
      />
      <SimpleHeader />
      
      <main className="flex-grow bg-muted/20">
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Login Form */}
            <motion.div 
              className="w-full md:w-1/2 p-8 md:p-12"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-2xl font-bold mb-8 text-center text-primary">تسجيل الدخول للموظفين</h2>
              <LoginForm />
            </motion.div>
            
            {/* Hero Section */}
            <motion.div 
              className="w-full md:w-1/2 bg-primary/90 p-8 md:p-12 flex flex-col justify-center items-center text-white"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="flex flex-col items-center">
                <img 
                  src={syrianLogoSvg} 
                  alt="وزارة الاتصالات وتقانة المعلومات - الجمهورية العربية السورية" 
                  className="h-64 w-auto mb-6"
                />
                <h1 className="text-3xl font-bold text-center mb-4">وزارة الاتصالات وتقانة المعلومات</h1>
                <p className="text-lg text-center mb-6">
                  الجمهورية العربية السورية
                </p>
                <div className="bg-white/10 rounded-lg p-6 backdrop-blur-sm">
                  <h3 className="text-xl font-bold mb-4">منصة التواصل المباشر مع الوزير</h3>
                  <p className="text-sm">
                    منصة رسمية للتواصل المباشر مع وزير الاتصالات وتقانة المعلومات، تتيح للمواطنين إرسال 
                    الاقتراحات والاستفسارات والآراء والشكاوى والطلبات المتعلقة بمجال الاتصالات والتقانة.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
      
      <SimpleFooter />
    </div>
  );
};

export default AuthPage;