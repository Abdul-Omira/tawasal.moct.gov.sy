import React from 'react';
import { Checkbox } from './checkbox';
import { Label } from './label';
import { Shield } from 'lucide-react';

interface SimpleCaptchaProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export const SimpleCaptcha: React.FC<SimpleCaptchaProps> = ({ value, onChange, error }) => {
  const isChecked = value === 'verified';

  const handleChange = (checked: boolean) => {
    onChange(checked ? 'verified' : '');
  };

  return (
    <div className="flex items-center space-x-2 space-x-reverse p-3 border rounded-md bg-gray-50 dark:bg-gray-800">
      <Checkbox
        checked={isChecked}
        onCheckedChange={handleChange}
        id="captcha-checkbox"
      />
      <div className="flex items-center space-x-2 space-x-reverse">
        <Shield className="h-4 w-4 text-blue-600" />
        <Label 
          htmlFor="captcha-checkbox" 
          className="text-sm font-medium cursor-pointer"
        >
          لست روبوت
        </Label>
      </div>
      {error && (
        <div className="text-red-500 text-xs mt-1">{error}</div>
      )}
    </div>
  );
};

export default SimpleCaptcha;