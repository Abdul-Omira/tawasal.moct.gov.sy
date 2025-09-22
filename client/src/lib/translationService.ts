import { i18n } from './i18n';

export interface TranslationKey {
  key: string;
  value: string;
  namespace: string;
  language: string;
}

export interface TranslationNamespace {
  name: string;
  keys: TranslationKey[];
}

export interface TranslationLanguage {
  code: string;
  name: string;
  isRTL: boolean;
  namespaces: TranslationNamespace[];
}

class TranslationService {
  private translations: Map<string, Map<string, Map<string, string>>> = new Map();

  constructor() {
    this.initializeTranslations();
  }

  private initializeTranslations() {
    // Initialize with default translations
    this.translations.set('en', new Map());
    this.translations.set('ar', new Map());
  }

  // Get all available languages
  getLanguages(): TranslationLanguage[] {
    return [
      {
        code: 'en',
        name: 'English',
        isRTL: false,
        namespaces: this.getNamespaces('en'),
      },
      {
        code: 'ar',
        name: 'العربية',
        isRTL: true,
        namespaces: this.getNamespaces('ar'),
      },
    ];
  }

  // Get namespaces for a language
  getNamespaces(language: string): TranslationNamespace[] {
    const languageTranslations = this.translations.get(language);
    if (!languageTranslations) return [];

    const namespaces: TranslationNamespace[] = [];
    
    for (const [namespace, keys] of languageTranslations) {
      const translationKeys: TranslationKey[] = [];
      
      for (const [key, value] of keys) {
        translationKeys.push({
          key,
          value,
          namespace,
          language,
        });
      }
      
      namespaces.push({
        name: namespace,
        keys: translationKeys,
      });
    }
    
    return namespaces;
  }

  // Get translation value
  getTranslation(language: string, namespace: string, key: string): string {
    const languageTranslations = this.translations.get(language);
    if (!languageTranslations) return key;

    const namespaceTranslations = languageTranslations.get(namespace);
    if (!namespaceTranslations) return key;

    return namespaceTranslations.get(key) || key;
  }

  // Set translation value
  setTranslation(language: string, namespace: string, key: string, value: string): void {
    if (!this.translations.has(language)) {
      this.translations.set(language, new Map());
    }

    const languageTranslations = this.translations.get(language)!;
    
    if (!languageTranslations.has(namespace)) {
      languageTranslations.set(namespace, new Map());
    }

    const namespaceTranslations = languageTranslations.get(namespace)!;
    namespaceTranslations.set(key, value);

    // Update i18n resources
    this.updateI18nResources();
  }

  // Delete translation
  deleteTranslation(language: string, namespace: string, key: string): void {
    const languageTranslations = this.translations.get(language);
    if (!languageTranslations) return;

    const namespaceTranslations = languageTranslations.get(namespace);
    if (!namespaceTranslations) return;

    namespaceTranslations.delete(key);
    this.updateI18nResources();
  }

  // Update i18n resources
  private updateI18nResources(): void {
    const resources: any = {};
    
    for (const [language, languageTranslations] of this.translations) {
      resources[language] = {};
      
      for (const [namespace, namespaceTranslations] of languageTranslations) {
        resources[language][namespace] = Object.fromEntries(namespaceTranslations);
      }
    }
    
    i18n.addResourceBundle('en', 'translation', resources.en?.translation || {}, true, true);
    i18n.addResourceBundle('ar', 'translation', resources.ar?.translation || {}, true, true);
  }

  // Export translations
  exportTranslations(language?: string): any {
    if (language) {
      const languageTranslations = this.translations.get(language);
      if (!languageTranslations) return {};

      const result: any = {};
      for (const [namespace, keys] of languageTranslations) {
        result[namespace] = Object.fromEntries(keys);
      }
      return result;
    }

    const result: any = {};
    for (const [lang, languageTranslations] of this.translations) {
      result[lang] = {};
      for (const [namespace, keys] of languageTranslations) {
        result[lang][namespace] = Object.fromEntries(keys);
      }
    }
    return result;
  }

  // Import translations
  importTranslations(translations: any): void {
    for (const [language, languageTranslations] of Object.entries(translations)) {
      if (!this.translations.has(language)) {
        this.translations.set(language, new Map());
      }

      const languageMap = this.translations.get(language)!;
      
      for (const [namespace, namespaceTranslations] of Object.entries(languageTranslations as any)) {
        if (!languageMap.has(namespace)) {
          languageMap.set(namespace, new Map());
        }

        const namespaceMap = languageMap.get(namespace)!;
        
        for (const [key, value] of Object.entries(namespaceTranslations as any)) {
          namespaceMap.set(key, value as string);
        }
      }
    }
    
    this.updateI18nResources();
  }

  // Get missing translations
  getMissingTranslations(): { language: string; namespace: string; key: string }[] {
    const missing: { language: string; namespace: string; key: string }[] = [];
    const languages = this.getLanguages();
    
    if (languages.length < 2) return missing;
    
    const referenceLanguage = languages[0];
    const referenceTranslations = this.translations.get(referenceLanguage.code);
    if (!referenceTranslations) return missing;
    
    for (const language of languages.slice(1)) {
      const languageTranslations = this.translations.get(language.code);
      if (!languageTranslations) continue;
      
      for (const [namespace, keys] of referenceTranslations) {
        const languageNamespace = languageTranslations.get(namespace);
        if (!languageNamespace) continue;
        
        for (const [key] of keys) {
          if (!languageNamespace.has(key)) {
            missing.push({
              language: language.code,
              namespace,
              key,
            });
          }
        }
      }
    }
    
    return missing;
  }

  // Get translation statistics
  getTranslationStats(): {
    totalLanguages: number;
    totalNamespaces: number;
    totalKeys: number;
    missingTranslations: number;
    completionRate: number;
  } {
    const languages = this.getLanguages();
    const missingTranslations = this.getMissingTranslations();
    
    let totalKeys = 0;
    let totalNamespaces = 0;
    
    for (const language of languages) {
      totalNamespaces += language.namespaces.length;
      for (const namespace of language.namespaces) {
        totalKeys += namespace.keys.length;
      }
    }
    
    const averageKeysPerLanguage = totalKeys / languages.length;
    const missingCount = missingTranslations.length;
    const completionRate = averageKeysPerLanguage > 0 
      ? ((averageKeysPerLanguage - missingCount) / averageKeysPerLanguage) * 100 
      : 100;
    
    return {
      totalLanguages: languages.length,
      totalNamespaces: totalNamespaces,
      totalKeys: totalKeys,
      missingTranslations: missingCount,
      completionRate: Math.round(completionRate),
    };
  }
}

export const translationService = new TranslationService();
