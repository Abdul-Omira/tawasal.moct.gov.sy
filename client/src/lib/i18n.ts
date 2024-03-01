import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Arabic translations
const arabicResources = {
  common: {
    // Header
    ministry: "وزارة الاتصالات السورية",
    systemName: "نظام التواصل الإلكتروني للشركات الناشئة",
    home: "الرئيسية",
    about: "عن النظام",
    contact: "اتصل بنا",
    help: "المساعدة",
    login: "تسجيل الدخول",
    
    // Banner
    bannerTitle: "نظام التواصل للشركات المتأثرة بالعقوبات",
    bannerText: "منصة وزارة الاتصالات السورية لجمع معلومات حول الشركات الناشئة والأعمال المتأثرة بالعقوبات ومساعدتها في التغلب على التحديات",
    startNow: "ابدأ الآن",
    learnMore: "معرفة المزيد",
    
    // About section
    aboutSystem: "عن نظام التواصل",
    dataCollection: "جمع المعلومات",
    dataCollectionText: "نجمع معلومات عن احتياجات الشركات والتحديات التي تواجهها بسبب العقوبات لتقديم الدعم المناسب",
    needsAnalysis: "تحليل الاحتياجات",
    needsAnalysisText: "تحليل متطلبات التكامل التقني والتحديات المتعلقة بالعقوبات لوضع خطط مساعدة فعالة",
    support: "تقديم الدعم",
    supportText: "العمل مع الشركات لتوفير الحلول والموارد اللازمة للتغلب على العقبات ومواصلة النمو",
    whoWeAre: "من نحن؟",
    whoWeAreText1: "نحن فريق متخصص في وزارة الاتصالات السورية نعمل على دعم الشركات الناشئة والأعمال المتأثرة بالعقوبات الاقتصادية.",
    whoWeAreText2: "هدفنا هو فهم التحديات التي تواجهها وتوفير الموارد والدعم اللازمين لمساعدتك على النمو والازدهار رغم هذه التحديات.",
    technicalSupport: "دعم تقني",
    legalResources: "موارد قانونية",
    businessConsulting: "استشارات أعمال",
    financialSolutions: "حلول تمويلية",
    
    // Form
    formTitle: "استمارة تقديم المعلومات",
    step: "الخطوة",
    of: "من",
    step1Title: "معلومات الشركة",
    step2Title: "معلومات الاتصال",
    step3Title: "التحديات واحتياجات التكنولوجيا",
    step4Title: "الموافقة وتقديم الطلب",
    next: "التالي",
    previous: "السابق",
    submit: "تقديم الطلب",
    
    // Form fields - Step 1
    businessName: "اسم الشركة",
    businessType: "نوع النشاط",
    establishmentDate: "تاريخ التأسيس",
    employeesCount: "عدد الموظفين",
    address: "العنوان",
    governorate: "المحافظة",
    registrationNumber: "رقم السجل التجاري",
    
    // Business types
    selectBusinessType: "اختر نوع النشاط",
    technology: "تكنولوجيا المعلومات",
    manufacturing: "تصنيع",
    retail: "تجارة تجزئة",
    services: "خدمات",
    other: "أخرى",
    
    // Employees count
    selectEmployeesCount: "اختر عدد الموظفين",
    employees1_10: "1-10",
    employees11_50: "11-50",
    employees51_200: "51-200",
    employeesMore: "أكثر من 200",
    
    // Governorates
    selectGovernorate: "اختر المحافظة",
    damascus: "دمشق",
    aleppo: "حلب",
    homs: "حمص",
    hama: "حماة",
    lattakia: "اللاذقية",
    
    // Form fields - Step 2
    contactName: "اسم المسؤول",
    position: "المنصب",
    email: "البريد الإلكتروني",
    phone: "رقم الهاتف",
    alternativeContact: "معلومات اتصال بديلة",
    website: "الموقع الإلكتروني",
    
    // Form fields - Step 3
    challenges: "ما هي التحديات الرئيسية التي تواجهها شركتك بسبب العقوبات؟",
    challenge1: "صعوبات في الحصول على التكنولوجيا أو البرمجيات",
    challenge2: "قيود على المعاملات المالية الدولية",
    challenge3: "صعوبات في الوصول إلى الأسواق الخارجية",
    challenge4: "تحديات في استيراد المعدات أو المواد الخام",
    challenge5: "قيود على خدمات الاستضافة السحابية والخدمات الرقمية",
    challengeOther: "أخرى",
    challengeDetails: "اشرح بالتفصيل كيف أثرت العقوبات على أعمالك",
    techNeeds: "ما هي احتياجاتك التقنية الحالية؟",
    techNeed1: "برمجيات وتطبيقات",
    techNeed2: "خدمات استضافة وبنية تحتية سحابية",
    techNeed3: "أنظمة دفع إلكتروني وحلول مالية",
    techNeed4: "معدات وأجهزة تقنية",
    techNeed5: "خدمات تدريب وتطوير للموظفين",
    techNeedOther: "أخرى",
    techDetails: "اشرح احتياجاتك التقنية بالتفصيل",
    
    // Form fields - Step 4
    consentTitle: "الموافقة على استخدام البيانات",
    consentDescription: "بتقديم هذا النموذج، فإنك توافق على أن وزارة الاتصالات السورية قد تستخدم المعلومات المقدمة للأغراض التالية:",
    consentItem1: "تحليل احتياجات الشركات المتأثرة بالعقوبات",
    consentItem2: "تطوير برامج وحلول مخصصة للمساعدة",
    consentItem3: "التواصل معك بخصوص احتياجات شركتك والحلول المحتملة",
    consentItem4: "مشاركة معلومات مجمعة (غير شخصية) مع الجهات المعنية للمساعدة في تطوير السياسات",
    consentNote: "لن يتم مشاركة معلوماتك الشخصية مع أي طرف ثالث دون موافقتك المسبقة.",
    consentCheckbox: "أوافق على استخدام المعلومات المقدمة وفقًا للشروط المذكورة أعلاه",
    communicationCheckbox: "أرغب في تلقي تحديثات وإشعارات من وزارة الاتصالات حول البرامج والموارد المتاحة",
    additionalComments: "ملاحظات إضافية",
    
    // Validation
    required: "هذا الحقل مطلوب",
    invalidEmail: "البريد الإلكتروني غير صالح",
    invalidPhone: "رقم الهاتف غير صالح",
    consentRequired: "يجب الموافقة على شروط استخدام البيانات للمتابعة",
    loading: "جاري الإرسال...",
    
    // Confirmation
    confirmationTitle: "تم تقديم المعلومات بنجاح",
    confirmationMessage: "شكراً لك على تقديم معلومات شركتك. سيقوم فريقنا بمراجعة المعلومات والتواصل معك قريباً.",
    requestNumber: "رقم الطلب",
    returnHome: "العودة للرئيسية",
    printConfirmation: "طباعة التأكيد",
    
    // Admin
    
    businessRequests: "طلبات الشركات",
    search: "بحث...",
    allRequests: "جميع الطلبات",
    pending: "قيد المراجعة",
    processed: "تمت المعالجة",
    requestID: "رقم الطلب",
    businessNameHeader: "اسم الشركة",
    businessTypeHeader: "نوع النشاط",
    governorateHeader: "المحافظة",
    submissionDate: "تاريخ التقديم",
    status: "الحالة",
    actions: "الإجراءات",
    view: "عرض",
    process: "معالجة",
    edit: "تعديل",
    contactAction: "تواصل",
    
    // Status
    statusPending: "قيد المراجعة",
    statusProcessed: "تمت المعالجة",
    statusNeedsInfo: "بحاجة لمعلومات إضافية",
    
    // Pagination
    showing: "عرض",
    to: "إلى",
    from: "من أصل",
    records: "سجل",
    
    // Footer
    ministry_footer: "وزارة الاتصالات السورية",
    ministry_description: "نعمل على دعم الشركات الناشئة والأعمال السورية في مواجهة التحديات وتحقيق النمو المستدام.",
    quickLinks: "روابط سريعة",
    ministryServices: "خدمات الوزارة",
    startupSupport: "دعم الشركات الناشئة",
    technicalConsulting: "الاستشارات التقنية",
    trainingPrograms: "برامج التدريب والتطوير",
    legalFacilitation: "التسهيلات القانونية",
    fundingInitiatives: "مبادرات التمويل",
    newsletter: "النشرة الإخبارية",
    newsletterDescription: "اشترك للحصول على آخر الأخبار والتحديثات من وزارة الاتصالات.",
    emailPlaceholder: "البريد الإلكتروني",
    subscribe: "اشتراك",
    copyright: "© 2023 وزارة الاتصالات والتقانة. جميع الحقوق محفوظة.",
    privacyPolicy: "سياسة الخصوصية",
    termsOfUse: "شروط الاستخدام",
    siteMap: "خريطة الموقع",
    
    // Support
    supportTitle: "الدعم والمساعدة",
    contactUs: "اتصل بنا",
    addressLabel: "العنوان",
    addressValue: "وزارة الاتصالات والتقانة، شارع الثورة، دمشق، سوريا",
    phoneLabel: "الهاتف",
    phoneValue: "+963 11 123 4567",
    emailLabel: "البريد الإلكتروني",
    emailValue: "support@moct.gov.sy",
    workHoursLabel: "ساعات العمل",
    workHoursValue: "الأحد - الخميس: 8:00 صباحًا - 3:30 مساءً",
    faq: "الأسئلة الشائعة",
    faqQuestion1: "من يمكنه التقديم في هذا النظام؟",
    faqAnswer1: "يمكن لجميع الشركات السورية المتأثرة بالعقوبات الاقتصادية التقديم، بما في ذلك الشركات الناشئة والشركات الصغيرة والمتوسطة والكبيرة.",
    faqQuestion2: "كيف سيتم استخدام معلوماتي؟",
    faqAnswer2: "ستستخدم المعلومات المقدمة لفهم احتياجات الشركات وتصميم برامج دعم مناسبة. ستعامل جميع المعلومات بسرية تامة ولن تشارك مع أطراف ثالثة دون موافقتك.",
    faqQuestion3: "ما هي الخطوات بعد تقديم الطلب؟",
    faqAnswer3: "بعد تقديم الطلب، ستتلقى تأكيدًا بالاستلام. سيقوم فريقنا بمراجعة المعلومات والتواصل معك خلال 5-7 أيام عمل لمتابعة طلبك.",
    faqQuestion4: "هل يمكنني تعديل معلوماتي بعد التقديم؟",
    faqAnswer4: "نعم، يمكنك التواصل مع فريق الدعم لتعديل أي معلومات بعد التقديم. سيتم توفير رابط لتحديث المعلومات في رسالة التأكيد."
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources: {
      ar: arabicResources
    },
    lng: 'ar',
    fallbackLng: 'ar',
    interpolation: {
      escapeValue: false // React already safes from XSS
    },
    defaultNS: 'common'
  });

export default i18n;
