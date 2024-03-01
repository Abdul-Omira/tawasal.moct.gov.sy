/**
 * Form Builder Platform - Multi Choice Component
 * Reusable multi-choice component for forms (radio buttons, checkboxes, multi-select)
 */

import React from 'react';
import { MultiChoiceConfig } from '../../types/form';
import { ComponentRenderProps } from '../../types/component';
import { cn } from '../../lib/utils';

interface MultiChoiceProps extends ComponentRenderProps {
  config: MultiChoiceConfig;
}

export const MultiChoice: React.FC<MultiChoiceProps> = ({
  config,
  value,
  onChange,
  onBlur,
  onFocus,
  error,
  disabled,
  readOnly,
  className,
  style,
}) => {
  const {
    label,
    required,
    helpText,
    options,
    allowMultiple,
    layout,
    styling,
  } = config;

  // Handle option selection
  const handleOptionChange = (optionValue: string, checked: boolean) => {
    if (allowMultiple) {
      const currentValues = Array.isArray(value) ? value : [];
      const newValues = checked
        ? [...currentValues, optionValue]
        : currentValues.filter(v => v !== optionValue);
      onChange(newValues);
    } else {
      onChange(optionValue);
    }
  };

  // Check if option is selected
  const isOptionSelected = (optionValue: string) => {
    if (allowMultiple) {
      return Array.isArray(value) && value.includes(optionValue);
    } else {
      return value === optionValue;
    }
  };

  // Get layout classes
  const getLayoutClasses = () => {
    switch (layout) {
      case 'horizontal':
        return 'flex flex-wrap gap-4';
      case 'grid':
        return 'grid grid-cols-2 gap-4';
      default:
        return 'space-y-3';
    }
  };

  // Render option
  const renderOption = (option: { value: string; label: string; disabled?: boolean }) => {
    const isSelected = isOptionSelected(option.value);
    const inputType = allowMultiple ? 'checkbox' : 'radio';
    const inputName = allowMultiple ? undefined : `choice-${label}`;

    return (
      <label
        key={option.value}
        className={cn(
          "flex items-start space-x-3 space-x-reverse cursor-pointer",
          "hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md p-2 transition-colors",
          option.disabled && "opacity-50 cursor-not-allowed",
          disabled && "opacity-50 cursor-not-allowed",
          readOnly && "cursor-default"
        )}
      >
        <input
          type={inputType}
          name={inputName}
          value={option.value}
          checked={isSelected}
          onChange={(e) => handleOptionChange(option.value, e.target.checked)}
          onBlur={onBlur}
          onFocus={onFocus}
          disabled={disabled || option.disabled}
          readOnly={readOnly}
          className={cn(
            "mt-1 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500",
            allowMultiple ? "rounded" : "rounded-full"
          )}
        />
        <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">
          {option.label}
        </span>
      </label>
    );
  };

  return (
    <div className={cn("space-y-2", className)} style={style}>
      {/* Label */}
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* Options */}
      <div className={cn(getLayoutClasses(), styling?.gap)}>
        {options.map(renderOption)}
      </div>

      {/* Selected count for multiple selection */}
      {allowMultiple && Array.isArray(value) && value.length > 0 && (
        <div className="text-sm text-gray-500">
          {value.length} من {options.length} خيار محدد
        </div>
      )}

      {/* Help text */}
      {helpText && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {helpText}
        </p>
      )}

      {/* Error message */}
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
};

export default MultiChoice;
