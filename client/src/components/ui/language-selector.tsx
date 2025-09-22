import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './dropdown-menu';
import { Globe } from 'lucide-react';
import { getLanguageName, getLanguageFlag, changeLanguage } from '@/lib/i18n';

const LanguageSelector: React.FC = () => {
  const { i18n } = useTranslation();

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'ar', name: 'العربية', flag: '🇸🇾' },
  ];

  const handleLanguageChange = async (languageCode: string) => {
    await changeLanguage(languageCode);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center space-x-2">
          <Globe className="h-4 w-4" />
          <span>{getLanguageFlag(i18n.language)}</span>
          <span>{getLanguageName(i18n.language)}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            className="flex items-center space-x-2"
          >
            <span>{language.flag}</span>
            <span>{language.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSelector;