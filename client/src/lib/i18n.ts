import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

// Import translation files
import enTranslations from '../locales/en/translation.json';
import arTranslations from '../locales/ar/translation.json';

const resources = {
  en: {
    translation: enTranslations,
  },
  ar: {
    translation: arTranslations,
  },
};

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    
    interpolation: {
      escapeValue: false, // React already does escaping
    },
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
    
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    
    // RTL support
    lng: 'en',
    supportedLngs: ['en', 'ar'],
    
    // Namespace configuration
    defaultNS: 'translation',
    ns: ['translation', 'common', 'forms', 'admin', 'auth'],
    
    // React i18next options
    react: {
      useSuspense: false,
    },
  });

// Helper function to check if language is RTL
export const isRTL = (lng: string): boolean => {
  return ['ar'].includes(lng);
};

// Helper function to get text direction
export const getTextDirection = (lng: string): 'ltr' | 'rtl' => {
  return isRTL(lng) ? 'rtl' : 'ltr';
};

// Helper function to get opposite text direction
export const getOppositeTextDirection = (lng: string): 'ltr' | 'rtl' => {
  return isRTL(lng) ? 'ltr' : 'rtl';
};

// Helper function to format numbers based on locale
export const formatNumber = (number: number, lng: string): string => {
  const locale = lng === 'ar' ? 'ar-SY' : lng === 'ku' ? 'ku-Arab-IQ' : 'en-US';
  return new Intl.NumberFormat(locale).format(number);
};

// Helper function to format dates based on locale
export const formatDate = (date: Date, lng: string): string => {
  const locale = lng === 'ar' ? 'ar-SY' : lng === 'ku' ? 'ku-Arab-IQ' : 'en-US';
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
};

// Helper function to format currency based on locale
export const formatCurrency = (amount: number, lng: string, currency: string = 'SYP'): string => {
  const locale = lng === 'ar' ? 'ar-SY' : lng === 'ku' ? 'ku-Arab-IQ' : 'en-US';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

// Helper function to get language name in its native script
export const getLanguageName = (lng: string): string => {
  const names: Record<string, string> = {
    en: 'English',
    ar: 'العربية',
  };
  return names[lng] || lng;
};

// Helper function to get language flag emoji
export const getLanguageFlag = (lng: string): string => {
  const flags: Record<string, string> = {
    en: '🇺🇸',
    ar: '🇸🇾',
  };
  return flags[lng] || '🌐';
};

// Helper function to change language and update document direction
export const changeLanguage = async (lng: string): Promise<void> => {
  await i18n.changeLanguage(lng);
  
  // Update document direction
  const direction = getTextDirection(lng);
  document.documentElement.dir = direction;
  document.documentElement.lang = lng;
  
  // Update body class for RTL styling
  document.body.classList.remove('ltr', 'rtl');
  document.body.classList.add(direction);
  
  // Store language preference
  localStorage.setItem('i18nextLng', lng);
};

// Initialize document direction on load
const currentLng = i18n.language || 'en';
const direction = getTextDirection(currentLng);
document.documentElement.dir = direction;
document.documentElement.lang = currentLng;
document.body.classList.add(direction);

export default i18n;