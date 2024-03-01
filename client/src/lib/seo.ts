/**
 * Utility functions for SEO optimization
 * Handles page titles, descriptions, and other metadata
 */

/**
 * Sets the page title with proper formatting
 * @param pageTitle The specific page title
 * @param includeSiteName Whether to include the site name in the title
 */
export function setPageTitle(pageTitle: string, includeSiteName = true) {
  const siteName = 'وزارة الاتصالات وتقانة المعلومات';
  document.title = includeSiteName
    ? `${pageTitle} - ${siteName}`
    : pageTitle;
}

/**
 * Page metadata configuration
 */
interface PageMetadata {
  title: string;
  description: string;
  path: string;
  image?: string;
}

// ❗ Make sure you expose this correctly in your build tool:
// – CRA: process.env.REACT_APP_DOMAIN
// – Vite: import.meta.env.VITE_APP_DOMAIN
const BASE_URL = 'https://tawasal.moct.gov.sy';

/**
 * Page-specific metadata for different routes
 */
export const pageMetadata: Record<string, PageMetadata> = {
  home: {
    title: 'منصة التواصل المباشر مع الوزير',
    description:
      'المنصة الرسمية للتواصل المباشر مع وزير الاتصالات وتقانة المعلومات في الجمهورية العربية السورية',
    path: '/',
    image: `${BASE_URL}/assets/syrian-logo-gold.svg`
  },
  admin: {
    title: 'لوحة تحكم المشرف',
    description:
      'إدارة رسائل المواطنين وعرض الإحصائيات والتقارير لمنصة التواصل مع الوزير',
    path: '/mgt-system-2025',
    image: `${BASE_URL}/assets/syrian-logo-gold.svg`
  },
  auth: {
    title: 'تسجيل الدخول',
    description:
      'تسجيل الدخول إلى منصة التواصل مع وزير الاتصالات وتقانة معلومات لإدارة الرسائل',
    path: '/auth',
    image: `${BASE_URL}/assets/syrian-logo-gold.svg`
  },
  confirmation: {
    title: 'تأكيد الإرسال',
    description:
      'تم إرسال رسالتكم بنجاح إلى وزير الاتصالات وتقانة المعلومات',
    path: '/confirmation',
    image: `${BASE_URL}/assets/syrian-logo-gold.svg`
  },
  privacyPolicy: {
    title: 'سياسة الخصوصية',
    description:
      'معلومات حول كيفية جمع واستخدام وحماية البيانات في منصة التواصل مع الوزير',
    path: '/privacy-policy',
    image: `${BASE_URL}/assets/syrian-logo-gold.svg`
  },
  termsOfUse: {
    title: 'شروط الاستخدام',
    description:
      'الشروط والأحكام المنظمة لاستخدام منصة التواصل مع وزير الاتصالات وتقانة المعلومات',
    path: '/terms-of-use',
    image: `${BASE_URL}/assets/syrian-logo-gold.svg`
  },
  notFound: {
    title: 'الصفحة غير موجودة',
    description:
      'الصفحة المطلوبة غير موجودة في منصة وزارة الاتصالات وتقانة المعلومات',
    path: '*',
    image: `${BASE_URL}/assets/syrian-logo-gold.svg`
  }
};

/**
 * Updates meta tags for OpenGraph and Twitter
 * @param metadata Page metadata for SEO
 */
export function updateMetaTags(metadata: PageMetadata) {
  const { title, description, path, image } = metadata;
  const fullUrl = `${BASE_URL}${path}`;
  const imageUrl = image || '';

  // Build a map of all tags we want to set or update:
  const metaTags: Record<string, string> = {
    'og:title': title,
    'og:description': description,
    'og:url': fullUrl,
    'twitter:title': title,
    'twitter:description': description,
    'twitter:url': fullUrl,
    'og:image:width': '1600',
    'og:image:height': '887'
  };

  // Only include image tags if imageUrl is non-empty:
  if (imageUrl) {
    metaTags['og:image'] = imageUrl;
    metaTags['twitter:image'] = imageUrl;
  }

  Object.entries(metaTags).forEach(([property, content]) => {
    // Note: we treat ALL of these as `meta[property="…"]`
    let selector = `meta[property="${property}"]`;
    let tag = document.head.querySelector(selector) as HTMLMetaElement | null;

    if (!tag) {
      tag = document.createElement('meta');
      tag.setAttribute('property', property);
      document.head.appendChild(tag);
    }
    tag.setAttribute('content', content);
  });

  // Canonical link (create if missing)
  let canonical = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    document.head.appendChild(canonical);
  }
  canonical.setAttribute('href', fullUrl);
}

