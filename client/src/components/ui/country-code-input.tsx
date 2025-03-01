import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Input } from './input';
import { Button } from './button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export type CountryCode = {
  code: string;
  name: string;
  flag: string;
};

const commonCountryCodes: CountryCode[] = [
  { code: '+963', name: 'سوريا', flag: '🇸🇾' },
  { code: '+971', name: 'الإمارات', flag: '🇦🇪' },
  { code: '+966', name: 'السعودية', flag: '🇸🇦' },
  { code: '+962', name: 'الأردن', flag: '🇯🇴' },
  { code: '+961', name: 'لبنان', flag: '🇱🇧' },
  { code: '+20', name: 'مصر', flag: '🇪🇬' },
  { code: '+964', name: 'العراق', flag: '🇮🇶' },
  { code: '+968', name: 'عمان', flag: '🇴🇲' },
  { code: '+974', name: 'قطر', flag: '🇶🇦' },
  { code: '+965', name: 'الكويت', flag: '🇰🇼' },
  { code: '+973', name: 'البحرين', flag: '🇧🇭' },
  { code: '+970', name: 'فلسطين', flag: '🇵🇸' },
  { code: '+90', name: 'تركيا', flag: '🇹🇷' },
  { code: '+98', name: 'إيران', flag: '🇮🇷' },
  { code: '+1', name: 'الولايات المتحدة', flag: '🇺🇸' },
  { code: '+44', name: 'المملكة المتحدة', flag: '🇬🇧' },
  { code: '+49', name: 'ألمانيا', flag: '🇩🇪' },
  { code: '+33', name: 'فرنسا', flag: '🇫🇷' },
  { code: '+7', name: 'روسيا', flag: '🇷🇺' },
  { code: '+86', name: 'الصين', flag: '🇨🇳' },
];

interface CountryCodeInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const CountryCodeInput: React.FC<CountryCodeInputProps> = ({
  value,
  onChange,
  placeholder = 'أدخل رقم الهاتف',
  className = '',
}) => {
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(commonCountryCodes[0]);
  const [phoneNumber, setPhoneNumber] = useState('');

  // Split the value into country code and phone number when the component loads
  React.useEffect(() => {
    if (value) {
      // Try to match the beginning of the value with any of the country codes
      const matchedCountry = commonCountryCodes.find(country => 
        value.startsWith(country.code)
      );
      
      if (matchedCountry) {
        setSelectedCountry(matchedCountry);
        setPhoneNumber(value.substring(matchedCountry.code.length).trim());
      } else {
        setPhoneNumber(value);
      }
    }
  }, []);

  // When either the country code or phone number changes, update the parent component
  React.useEffect(() => {
    const fullNumber = `${selectedCountry.code} ${phoneNumber}`;
    onChange(fullNumber.trim());
  }, [selectedCountry, phoneNumber, onChange]);

  return (
    <div className={`flex ${className}`}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="flex items-center gap-1 px-3 rounded-r-none border-l-0 focus:ring-1 focus:ring-primary"
            type="button"
          >
            <span className="ml-1">{selectedCountry.flag}</span>
            <span className="hidden sm:inline">{selectedCountry.code}</span>
            <ChevronDown size={16} />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0 max-h-[300px] overflow-auto">
          <div className="overflow-y-auto" style={{ maxHeight: '300px' }}>
            {commonCountryCodes.map((country) => (
              <div
                key={country.code}
                className="flex items-center gap-2 p-2 hover:bg-muted cursor-pointer"
                onClick={() => {
                  setSelectedCountry(country);
                }}
              >
                <span className="text-lg">{country.flag}</span>
                <span>{country.name}</span>
                <span className="text-sm text-muted-foreground ml-auto">
                  {country.code}
                </span>
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>
      <Input
        type="tel"
        value={phoneNumber}
        onChange={(e) => setPhoneNumber(e.target.value)}
        placeholder={placeholder}
        className="rounded-l-none focus:ring-1 focus:ring-primary"
      />
    </div>
  );
};

export { CountryCodeInput };