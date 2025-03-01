import { Separator } from "@/components/ui/separator";
import SimpleHeader from "@/components/layout/SimpleHeader";
import PageSEO from "@/components/seo/PageSEO";

const PrivacyPolicy: React.FC = () => {
  return (
    <>
      <PageSEO pageName="privacyPolicy" />
      <SimpleHeader />
      
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-10 min-h-screen">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold text-center mb-4 sm:mb-8">سياسة الخصوصية</h1>
          <Separator className="mb-6 sm:mb-8" />

          <div className="prose prose-sm sm:prose-base md:prose-lg max-w-none rtl" dir="rtl">
            <section className="mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 text-primary">مقدمة</h2>
              <p className="text-sm sm:text-base">ترحب وزارة الاتصالات وتقانة المعلومات السورية بكم في منصة التواصل المباشر مع الوزير. نحن نلتزم بحماية خصوصيتكم وأمان بياناتكم الشخصية وفقاً لأعلى المعايير الأمنية. تحدد هذه السياسة كيفية جمع واستخدام وحماية المعلومات التي تقدمونها عبر منصة التواصل مع وزير الاتصالات وتقانة المعلومات.</p>
            </section>

            <section className="mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 text-primary">المعلومات التي نجمعها</h2>
              <p className="text-sm sm:text-base mb-2 sm:mb-3">عند استخدام منصة التواصل مع الوزير، نقوم بجمع المعلومات التالية:</p>
              <ul className="text-sm sm:text-base list-disc mr-4 sm:mr-6 space-y-1 sm:space-y-2">
                <li>الاسم الكامل</li>
                <li>عنوان البريد الإلكتروني</li>
                <li>رقم الهاتف (اختياري)</li>
                <li>نوع التواصل (اقتراح، استفسار، رأي، شكوى، تعاون، طلب)</li>
                <li>موضوع الرسالة ومحتواها</li>
                <li>المرفقات (إن وجدت) بصيغ PDF أو PowerPoint</li>
                <li>معلومات تقنية أساسية مثل عنوان IP وتاريخ ووقت الإرسال</li>
              </ul>
            </section>

            <section className="mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 text-primary">كيفية استخدام المعلومات</h2>
              <p className="text-sm sm:text-base mb-2 sm:mb-3">نستخدم المعلومات المجمعة للأغراض التالية:</p>
              <ul className="text-sm sm:text-base list-disc mr-4 sm:mr-6 space-y-1 sm:space-y-2">
                <li>مراجعة وتقييم الرسائل والمقترحات المرسلة</li>
                <li>الرد على الاستفسارات والطلبات عند الإمكان</li>
                <li>تحسين خدمات الوزارة وسياساتها</li>
                <li>إعداد التقارير الإحصائية الداخلية</li>
                <li>الامتثال للمتطلبات القانونية والتنظيمية</li>
              </ul>
            </section>

            <section className="mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 text-primary">حماية البيانات</h2>
              <p className="text-sm sm:text-base mb-2 sm:mb-3">نتخذ إجراءات أمنية صارمة لحماية بياناتكم:</p>
              <ul className="text-sm sm:text-base list-disc mr-4 sm:mr-6 space-y-1 sm:space-y-2">
                <li>تشفير جميع البيانات الحساسة باستخدام خوارزميات متقدمة</li>
                <li>تأمين الخوادم والأنظمة بأحدث التقنيات الأمنية</li>
                <li>محدودية الوصول للبيانات على الموظفين المخولين فقط</li>
                <li>نسخ احتياطية منتظمة وآمنة للبيانات</li>
                <li>مراقبة أمنية مستمرة للأنظمة</li>
              </ul>
            </section>

            <section className="mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 text-primary">مشاركة المعلومات</h2>
              <p className="text-sm sm:text-base">لا نقوم بمشاركة معلوماتكم الشخصية مع أطراف خارجية إلا في الحالات التالية:</p>
              <ul className="text-sm sm:text-base list-disc mr-4 sm:mr-6 space-y-1 sm:space-y-2 mt-2 sm:mt-3">
                <li>عند الحصول على موافقتكم الصريحة</li>
                <li>عند وجود التزام قانوني بالكشف عن المعلومات</li>
                <li>لحماية حقوق وسلامة الوزارة والمواطنين</li>
                <li>في حالات الطوارئ الوطنية</li>
              </ul>
            </section>

            <section className="mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 text-primary">حقوقكم</h2>
              <p className="text-sm sm:text-base mb-2 sm:mb-3">لديكم الحقوق التالية فيما يتعلق ببياناتكم:</p>
              <ul className="text-sm sm:text-base list-disc mr-4 sm:mr-6 space-y-1 sm:space-y-2">
                <li>طلب الاطلاع على البيانات المحفوظة عنكم</li>
                <li>طلب تصحيح أي معلومات غير دقيقة</li>
                <li>طلب حذف بياناتكم (وفقاً للقوانين السارية)</li>
                <li>الاعتراض على معالجة بياناتكم في ظروف معينة</li>
              </ul>
            </section>

            <section className="mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 text-primary">الاتصال بنا</h2>
              <p className="text-sm sm:text-base">إذا كان لديكم أي أسئلة أو مخاوف حول سياسة الخصوصية هذه أو ممارساتنا في حماية البيانات، يمكنكم التواصل معنا عبر:</p>
              <div className="mt-3 sm:mt-4 text-sm sm:text-base">
                <p><strong>وزارة الاتصالات وتقانة المعلومات</strong></p>
                <p>الجمهورية العربية السورية</p>
                <p>دمشق - المالكي</p>
              </div>
            </section>

            <section className="mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 text-primary">تحديث السياسة</h2>
              <p className="text-sm sm:text-base">قد نقوم بتحديث سياسة الخصوصية هذه من وقت لآخر. سيتم نشر أي تغييرات على هذه الصفحة مع تاريخ التحديث. ننصحكم بمراجعة هذه السياسة بشكل دوري للبقاء على اطلاع بكيفية حماية معلوماتكم.</p>
              <p className="text-sm sm:text-base mt-3 sm:mt-4"><strong>تاريخ آخر تحديث:</strong> يناير 2025</p>
            </section>
          </div>
        </div>
      </div>
    </>
  );
};

export default PrivacyPolicy;