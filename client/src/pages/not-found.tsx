import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { Link } from "wouter";
import PageSEO from "@/components/seo/PageSEO";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 font-ibm">
      <PageSEO 
        pageName="notFound"
        customTitle="الصفحة غير موجودة - خطأ 404"
        customDescription="عذراً، الصفحة التي تبحث عنها غير موجودة في منصة وزارة الاتصالات وتقانة المعلومات"
      />
      <Card className="w-full max-w-md mx-4 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex flex-col mb-4 items-center text-center">
            <AlertCircle className="h-16 w-16 text-red-600 mb-4" />
            <h1 className="text-2xl font-bold text-foreground">خطأ 404 - الصفحة غير موجودة</h1>
          </div>

          <p className="my-4 text-muted-foreground text-center">
            عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها إلى عنوان آخر
          </p>
          
          <div className="flex justify-center mt-6">
            <Link href="/">
              <Button className="bg-primary hover:bg-primary/90">
                العودة إلى الصفحة الرئيسية
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
