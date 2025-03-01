/**
 * Form Builder Platform - Text Input Component
 * Reusable text input component for forms
 */

import React from 'react';
import { TextInputConfig } from '../../types/form';
import { ComponentRenderProps } from '../../types/component';
import { cn } from '../../lib/utils';

interface TextInputProps extends ComponentRenderProps {
  config: TextInputConfig;
}

export const TextInput: React.FC<TextInputProps> = ({
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
    placeholder,
    required,
    helpText,
    maxLength,
    minLength,
    pattern,
    styling,
  } = config;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    // Apply maxLength validation
    if (maxLength && newValue.length > maxLength) {
      return;
    }
    
    onChange(newValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Prevent input if maxLength is reached
    if (maxLength && value && value.length >= maxLength && e.key !== 'Backspace' && e.key !== 'Delete') {
      e.preventDefault();
    }
  };

  return (
    <div className={cn("space-y-2", className)} style={style}>
      {/* Label */}
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* Input */}
      <input
        type="text"
        value={value || ''}
        onChange={handleChange}
        onBlur={onBlur}
        onFocus={onFocus}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
        maxLength={maxLength}
        minLength={minLength}
        pattern={pattern}
        className={cn(
          "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm",
          "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
          "disabled:bg-gray-100 disabled:cursor-not-allowed",
          "read-only:bg-gray-50 read-only:cursor-default",
          error && "border-red-500 focus:ring-red-500 focus:border-red-500",
          styling?.width,
          styling?.height,
          styling?.fontSize,
          styling?.color,
          styling?.backgroundColor,
          styling?.borderColor,
          styling?.borderRadius,
          styling?.padding,
          styling?.margin
        )}
        style={{
          ...styling,
          color: styling?.color,
          backgroundColor: styling?.backgroundColor,
          borderColor: styling?.borderColor,
          borderRadius: styling?.borderRadius,
          padding: styling?.padding,
          margin: styling?.margin,
        }}
      />

      {/* Character count */}
      {maxLength && (
        <div className="text-xs text-gray-500 text-right">
          {(value || '').length} / {maxLength}
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

export default TextInput;
