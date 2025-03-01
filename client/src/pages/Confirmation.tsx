import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'wouter';
import { CheckCircle, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import SimpleHeader from '@/components/layout/SimpleHeader';
import SimpleFooter from '@/components/layout/SimpleFooter';
import PageSEO from '@/components/seo/PageSEO';

const Confirmation: React.FC = () => {
  const { t } = useTranslation();
  const [location, setLocation] = useLocation();
  
  // Get request ID from URL parameters
  const params = new URLSearchParams(location.split('?')[1]);
  const requestId = params.get('id') || '';

  // If no request ID, redirect to home
  useEffect(() => {
    if (!requestId) {
      setLocation('/');
    }
  }, [requestId, setLocation]);

  // Print confirmation
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen flex flex-col">
      <PageSEO 
        pageName="confirmation"
        customTitle={`تأكيد التقديم - طلب رقم SYR-2023-${requestId}`}
        customDescription="تم تسجيل طلبك بنجاح في منصة وزارة الاتصالات وتقانة المعلومات. يمكنك طباعة هذه الصفحة كإثبات على تقديم الطلب."
      />
      <SimpleHeader />
      
      <main className="flex-grow py-12 bg-background">
        <div className="container mx-auto px-4">
          <Card className="mx-auto max-w-2xl">
            <CardContent className="py-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="text-green-500 h-8 w-8" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-foreground">{t('confirmationTitle')}</h3>
                <p className="text-muted-foreground mb-6">{t('confirmationMessage')}</p>
                <p className="text-muted-foreground mb-6">
                  {t('requestNumber')}: <span className="font-semibold">SYR-2023-{requestId}</span>
                </p>
                <div className="flex justify-center gap-3 flex-wrap">
                  <Link href="/">
                    <Button className="bg-primary text-white hover:bg-primary/90">
                      {t('returnHome')}
                    </Button>
                  </Link>
                  <Button 
                    variant="outline" 
                    className="print:hidden"
                    onClick={handlePrint}
                  >
                    <Printer className="h-4 w-4 ml-2" />
                    {t('printConfirmation')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <SimpleFooter />
    </div>
  );
};

export default Confirmation;
