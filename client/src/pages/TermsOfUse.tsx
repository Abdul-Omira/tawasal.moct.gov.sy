import { Separator } from "@/components/ui/separator";
import SimpleHeader from "@/components/layout/SimpleHeader";
import PageSEO from "@/components/seo/PageSEO";

const TermsOfUse: React.FC = () => {
  return (
    <>
      <PageSEO pageName="termsOfUse" />
      <SimpleHeader />
      
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-10 min-h-screen">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold text-center mb-4 sm:mb-8">شروط الاستخدام</h1>
          <Separator className="mb-6 sm:mb-8" />

          <div className="prose prose-sm sm:prose-base md:prose-lg max-w-none rtl" dir="rtl">
            <section className="mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 text-primary">مقدمة</h2>
              <p className="text-sm sm:text-base mb-2 sm:mb-3">مرحباً بكم في منصة التواصل المباشر مع وزير الاتصالات وتقانة المعلومات في الجمهورية العربية السورية. تُنظم شروط الاستخدام هذه العلاقة بينكم وبين وزارة الاتصالات وتقانة المعلومات ("الوزارة") فيما يتعلق باستخدام منصة التواصل المباشر مع الوزير.</p>
              <p className="text-sm sm:text-base">باستخدام هذه المنصة، فإنكم توافقون على الالتزام بهذه الشروط والأحكام. إذا كنتم لا توافقون على أي جزء من هذه الشروط، يُرجى عدم استخدام المنصة.</p>
            </section>

            <section className="mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 text-primary">الغرض من المنصة</h2>
              <p className="text-sm sm:text-base mb-2 sm:mb-3">تهدف منصة التواصل المباشر مع الوزير إلى:</p>
              <ul className="text-sm sm:text-base list-disc mr-4 sm:mr-6 space-y-1 sm:space-y-2">
                <li>توفير قناة تواصل مباشرة بين المواطنين ووزير الاتصالات وتقانة المعلومات</li>
                <li>استقبال الاقتراحات والمشاريع والآراء والشكاوى والطلبات المتعلقة بمجال الاتصالات والتقانة</li>
                <li>تحسين خدمات الوزارة وسياساتها بناءً على ملاحظات المواطنين</li>
                <li>تعزيز الشفافية والتواصل الفعال مع الجمهور</li>
              </ul>
            </section>

            <section className="mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 text-primary">قواعد الاستخدام</h2>
              <p className="text-sm sm:text-base mb-2 sm:mb-3">يجب عليكم الالتزام بالقواعد التالية عند استخدام المنصة:</p>
              <ul className="text-sm sm:text-base list-disc mr-4 sm:mr-6 space-y-1 sm:space-y-2">
                <li>تقديم معلومات صحيحة ودقيقة عند التسجيل</li>
                <li>استخدام لغة مهذبة ومحترمة في جميع التواصلات</li>
                <li>عدم نشر أو إرسال محتوى مسيء أو تشهيري أو غير قانوني</li>
                <li>عدم استخدام المنصة لأغراض تجارية أو إعلانية غير مصرح بها</li>
                <li>احترام حقوق الملكية الفكرية للآخرين</li>
                <li>عدم محاولة الوصول غير المصرح به إلى أنظمة المنصة</li>
                <li>عدم إرسال فيروسات أو برمجيات ضارة</li>
              </ul>
            </section>

            <section className="mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 text-primary">أنواع التواصل المقبولة</h2>
              <p className="text-sm sm:text-base mb-2 sm:mb-3">المنصة تستقبل الأنواع التالية من التواصل:</p>
              <ul className="text-sm sm:text-base list-disc mr-4 sm:mr-6 space-y-1 sm:space-y-2">
                <li><strong>الاقتراحات:</strong> أفكار لتطوير خدمات الاتصالات والتقانة</li>
                <li><strong>الاستفسارات:</strong> أسئلة حول سياسات وخدمات الوزارة</li>
                <li><strong>الآراء:</strong> وجهات نظر حول قضايا الاتصالات والتقانة</li>
                <li><strong>الشكاوى:</strong> تقارير عن مشاكل أو قضايا تحتاج إلى معالجة</li>
                <li><strong>التعاون:</strong> عروض للشراكة أو التعاون مع الوزارة</li>
                <li><strong>الطلبات:</strong> طلبات محددة متعلقة بخدمات الوزارة</li>
              </ul>
            </section>

            <section className="mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 text-primary">المرفقات والملفات</h2>
              <p className="text-sm sm:text-base mb-2 sm:mb-3">يمكنكم إرفاق ملفات مع رسائلكم وفقاً للشروط التالية:</p>
              <ul className="text-sm sm:text-base list-disc mr-4 sm:mr-6 space-y-1 sm:space-y-2">
                <li>الملفات المقبولة: PDF و PowerPoint فقط</li>
                <li>الحد الأقصى لحجم الملف: 10 ميجابايت</li>
                <li>يجب أن تكون الملفات خالية من الفيروسات والبرمجيات الضارة</li>
                <li>يجب أن تكون الملفات ذات صلة بموضوع الرسالة</li>
                <li>لا يُسمح برفع ملفات تحتوي على محتوى غير قانوني أو مسيء</li>
              </ul>
            </section>

            <section className="mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 text-primary">الخصوصية والسرية</h2>
              <p className="text-sm sm:text-base mb-2 sm:mb-3">نلتزم بحماية خصوصيتكم وفقاً لسياسة الخصوصية المنشورة. كما نؤكد على:</p>
              <ul className="text-sm sm:text-base list-disc mr-4 sm:mr-6 space-y-1 sm:space-y-2">
                <li>جميع المراسلات تُعامل بسرية تامة</li>
                <li>لا نشارك معلوماتكم مع أطراف ثالثة دون موافقتكم</li>
                <li>البيانات محمية بأنظمة أمان متقدمة</li>
                <li>يمكنكم طلب حذف بياناتكم وفقاً للقوانين السارية</li>
              </ul>
            </section>

            <section className="mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 text-primary">الاستجابة والمتابعة</h2>
              <p className="text-sm sm:text-base">نسعى لمراجعة جميع الرسائل الواردة، ولكن:</p>
              <ul className="text-sm sm:text-base list-disc mr-4 sm:mr-6 space-y-1 sm:space-y-2 mt-2 sm:mt-3">
                <li>لا نضمن الرد على جميع الرسائل بسبب الكم الكبير المتوقع</li>
                <li>نعطي الأولوية للرسائل ذات الأهمية العالية والمصلحة العامة</li>
                <li>قد نتواصل معكم للحصول على معلومات إضافية إذا لزم الأمر</li>
                <li>الرسائل التي تتطلب إجراءات رسمية ستُحال إلى الجهات المختصة</li>
              </ul>
            </section>

            <section className="mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 text-primary">المحتوى المحظور</h2>
              <p className="text-sm sm:text-base mb-2 sm:mb-3">يُمنع منعاً باتاً إرسال أو نشر:</p>
              <ul className="text-sm sm:text-base list-disc mr-4 sm:mr-6 space-y-1 sm:space-y-2">
                <li>محتوى يحرض على العنف أو الكراهية</li>
                <li>معلومات كاذبة أو مضللة</li>
                <li>محتوى ينتهك القوانين السورية</li>
                <li>رسائل تحتوي على تهديدات أو ابتزاز</li>
                <li>محتوى إباحي أو غير لائق</li>
                <li>معلومات شخصية عن أطراف ثالثة دون موافقتهم</li>
                <li>محتوى ينتهك حقوق الملكية الفكرية</li>
              </ul>
            </section>

            <section className="mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 text-primary">المسؤوليات والضمانات</h2>
              <p className="text-sm sm:text-base mb-2 sm:mb-3">بشأن المسؤوليات:</p>
              <ul className="text-sm sm:text-base list-disc mr-4 sm:mr-6 space-y-1 sm:space-y-2">
                <li>الوزارة غير مسؤولة عن أي أضرار ناتجة عن سوء استخدام المنصة</li>
                <li>المستخدمون مسؤولون عن صحة ودقة المعلومات المقدمة</li>
                <li>نحتفظ بالحق في حذف أي محتوى يخالف هذه الشروط</li>
                <li>نحتفظ بالحق في منع المستخدمين المخالفين من الوصول للمنصة</li>
              </ul>
            </section>

            <section className="mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 text-primary">تعديل الشروط</h2>
              <p className="text-sm sm:text-base">نحتفظ بالحق في تعديل هذه الشروط في أي وقت. سيتم إشعاركم بأي تغييرات جوهرية عبر المنصة. استمراركم في استخدام المنصة بعد التعديلات يُعتبر موافقة على الشروط الجديدة.</p>
            </section>

            <section className="mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 text-primary">القانون الحاكم</h2>
              <p className="text-sm sm:text-base">تخضع هذه الشروط وأي نزاعات ناشئة عنها للقوانين السارية في الجمهورية العربية السورية، وتختص المحاكم السورية بالنظر في أي نزاعات.</p>
            </section>

            <section className="mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 text-primary">التواصل</h2>
              <p className="text-sm sm:text-base">للاستفسارات حول هذه الشروط، يمكنكم التواصل مع:</p>
              <div className="mt-3 sm:mt-4 text-sm sm:text-base">
                <p><strong>وزارة الاتصالات وتقانة المعلومات</strong></p>
                <p>الجمهورية العربية السورية</p>
                <p>دمشق - المالكي</p>
              </div>
              <p className="text-sm sm:text-base mt-3 sm:mt-4"><strong>تاريخ آخر تحديث:</strong> يناير 2025</p>
            </section>
          </div>
        </div>
      </div>
    </>
  );
};

export default TermsOfUse;