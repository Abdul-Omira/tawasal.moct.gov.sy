/**
 * Form Builder Platform - Dropdown Component
 * Reusable dropdown component for forms
 */

import React, { useState, useRef, useEffect } from 'react';
import { DropdownConfig } from '../../types/form';
import { ComponentRenderProps } from '../../types/component';
import { cn } from '../../lib/utils';
import { ChevronDownIcon, CheckIcon } from '@heroicons/react/24/outline';

interface DropdownProps extends ComponentRenderProps {
  config: DropdownConfig;
}

export const Dropdown: React.FC<DropdownProps> = ({
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
    placeholder,
    styling,
  } = config;

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Filter options based on search query
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle option selection
  const handleOptionSelect = (optionValue: string) => {
    if (allowMultiple) {
      const currentValues = Array.isArray(value) ? value : [];
      const newValues = currentValues.includes(optionValue)
        ? currentValues.filter(v => v !== optionValue)
        : [...currentValues, optionValue];
      onChange(newValues);
    } else {
      onChange(optionValue);
      setIsOpen(false);
      setSearchQuery('');
    }
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchRef.current) {
      searchRef.current.focus();
    }
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchQuery('');
    }
  };

  // Get display value
  const getDisplayValue = () => {
    if (allowMultiple) {
      const selectedValues = Array.isArray(value) ? value : [];
      if (selectedValues.length === 0) return placeholder || 'اختر الخيارات...';
      if (selectedValues.length === 1) {
        const option = options.find(opt => opt.value === selectedValues[0]);
        return option ? option.label : selectedValues[0];
      }
      return `${selectedValues.length} خيار محدد`;
    } else {
      if (!value) return placeholder || 'اختر خيار...';
      const option = options.find(opt => opt.value === value);
      return option ? option.label : value;
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

  return (
    <div className={cn("space-y-2", className)} style={style}>
      {/* Label */}
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => !disabled && !readOnly && setIsOpen(!isOpen)}
          onBlur={onBlur}
          onFocus={onFocus}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className={cn(
            "w-full px-3 py-2 text-right border border-gray-300 rounded-md shadow-sm",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
            "disabled:bg-gray-100 disabled:cursor-not-allowed",
            "read-only:bg-gray-50 read-only:cursor-default",
            error && "border-red-500 focus:ring-red-500 focus:border-red-500",
            isOpen && "ring-2 ring-blue-500 border-blue-500",
            styling?.width,
            styling?.height
          )}
          style={{
            ...styling,
            width: styling?.width,
            height: styling?.height,
          }}
        >
          <div className="flex items-center justify-between">
            <span className={cn(
              "block truncate",
              !value && "text-gray-500"
            )}>
              {getDisplayValue()}
            </span>
            <ChevronDownIcon
              className={cn(
                "h-5 w-5 text-gray-400 transition-transform duration-200",
                isOpen && "rotate-180"
              )}
            />
          </div>
        </button>

        {/* Dropdown menu */}
        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
            {/* Search input */}
            {options.length > 5 && (
              <div className="p-2 border-b border-gray-200">
                <input
                  ref={searchRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="البحث..."
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            )}

            {/* Options */}
            <div className="py-1">
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-500 text-center">
                  لا توجد خيارات
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleOptionSelect(option.value)}
                    disabled={option.disabled}
                    className={cn(
                      "w-full px-3 py-2 text-right text-sm hover:bg-gray-100 focus:outline-none focus:bg-gray-100",
                      "disabled:opacity-50 disabled:cursor-not-allowed",
                      isOptionSelected(option.value) && "bg-blue-50 text-blue-700"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate">{option.label}</span>
                      {isOptionSelected(option.value) && (
                        <CheckIcon className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Selected values for multiple selection */}
      {allowMultiple && Array.isArray(value) && value.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {value.map((val) => {
            const option = options.find(opt => opt.value === val);
            return (
              <span
                key={val}
                className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
              >
                {option ? option.label : val}
                <button
                  type="button"
                  onClick={() => handleOptionSelect(val)}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            );
          })}
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

export default Dropdown;
