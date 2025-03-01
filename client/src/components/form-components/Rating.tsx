/**
 * Form Builder Platform - Rating Component
 * Reusable rating component for forms (stars, scale, NPS)
 */

import React from 'react';
import { RatingConfig } from '../../types/form';
import { ComponentRenderProps } from '../../types/component';
import { cn } from '../../lib/utils';
import { StarIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarIconOutline } from '@heroicons/react/24/outline';

interface RatingProps extends ComponentRenderProps {
  config: RatingConfig;
}

export const Rating: React.FC<RatingProps> = ({
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
    type,
    maxValue,
    minValue,
    labels,
    styling,
  } = config;

  // Handle rating change
  const handleRatingChange = (rating: number) => {
    if (disabled || readOnly) return;
    onChange(rating);
  };

  // Handle mouse events for hover effects
  const [hoveredRating, setHoveredRating] = React.useState<number | null>(null);

  // Render star rating
  const renderStarRating = () => {
    const stars = [];
    const currentRating = hoveredRating || value || 0;

    for (let i = minValue; i <= maxValue; i++) {
      stars.push(
        <button
          key={i}
          type="button"
          onClick={() => handleRatingChange(i)}
          onMouseEnter={() => setHoveredRating(i)}
          onMouseLeave={() => setHoveredRating(null)}
          onBlur={onBlur}
          onFocus={onFocus}
          disabled={disabled}
          className={cn(
            "transition-colors duration-200",
            disabled && "cursor-not-allowed",
            readOnly && "cursor-default",
            !disabled && !readOnly && "hover:scale-110"
          )}
          style={{
            fontSize: styling?.size || '1.5rem',
            color: styling?.color || '#fbbf24',
          }}
        >
          {i <= currentRating ? (
            <StarIcon className="h-8 w-8" />
          ) : (
            <StarIconOutline className="h-8 w-8" />
          )}
        </button>
      );
    }

    return (
      <div className="flex items-center space-x-1 space-x-reverse">
        {stars}
      </div>
    );
  };

  // Render scale rating
  const renderScaleRating = () => {
    const scaleItems = [];
    const currentRating = hoveredRating || value || 0;

    for (let i = minValue; i <= maxValue; i++) {
      scaleItems.push(
        <button
          key={i}
          type="button"
          onClick={() => handleRatingChange(i)}
          onMouseEnter={() => setHoveredRating(i)}
          onMouseLeave={() => setHoveredRating(null)}
          onBlur={onBlur}
          onFocus={onFocus}
          disabled={disabled}
          className={cn(
            "w-10 h-10 rounded-full border-2 transition-all duration-200 flex items-center justify-center text-sm font-medium",
            i <= currentRating
              ? "bg-blue-500 border-blue-500 text-white"
              : "bg-white border-gray-300 text-gray-700 hover:border-blue-300",
            disabled && "cursor-not-allowed",
            readOnly && "cursor-default",
            !disabled && !readOnly && "hover:scale-105"
          )}
          style={{
            color: i <= currentRating ? 'white' : styling?.color || '#374151',
            backgroundColor: i <= currentRating ? (styling?.color || '#3b82f6') : 'white',
            borderColor: i <= currentRating ? (styling?.color || '#3b82f6') : '#d1d5db',
          }}
        >
          {i}
        </button>
      );
    }

    return (
      <div className="flex items-center space-x-2 space-x-reverse">
        {scaleItems}
      </div>
    );
  };

  // Render NPS rating
  const renderNPSRating = () => {
    const npsItems = [];
    const currentRating = hoveredRating || value || 0;

    for (let i = 0; i <= 10; i++) {
      npsItems.push(
        <button
          key={i}
          type="button"
          onClick={() => handleRatingChange(i)}
          onMouseEnter={() => setHoveredRating(i)}
          onMouseLeave={() => setHoveredRating(null)}
          onBlur={onBlur}
          onFocus={onFocus}
          disabled={disabled}
          className={cn(
            "w-12 h-12 rounded-full border-2 transition-all duration-200 flex items-center justify-center text-sm font-medium",
            i <= currentRating
              ? "bg-blue-500 border-blue-500 text-white"
              : "bg-white border-gray-300 text-gray-700 hover:border-blue-300",
            disabled && "cursor-not-allowed",
            readOnly && "cursor-default",
            !disabled && !readOnly && "hover:scale-105"
          )}
          style={{
            color: i <= currentRating ? 'white' : styling?.color || '#374151',
            backgroundColor: i <= currentRating ? (styling?.color || '#3b82f6') : 'white',
            borderColor: i <= currentRating ? (styling?.color || '#3b82f6') : '#d1d5db',
          }}
        >
          {i}
        </button>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">{labels?.min || 'غير محتمل على الإطلاق'}</span>
          <span className="text-sm text-gray-600">{labels?.max || 'محتمل جداً'}</span>
        </div>
        <div className="flex items-center space-x-1 space-x-reverse">
          {npsItems}
        </div>
      </div>
    );
  };

  // Render rating based on type
  const renderRating = () => {
    switch (type) {
      case 'stars':
        return renderStarRating();
      case 'scale':
        return renderScaleRating();
      case 'nps':
        return renderNPSRating();
      default:
        return renderStarRating();
    }
  };

  return (
    <div className={cn("space-y-2", className)} style={style}>
      {/* Label */}
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* Rating */}
      <div
        className="flex flex-col items-center space-y-2"
        onMouseLeave={() => setHoveredRating(null)}
      >
        {renderRating()}
        
        {/* Current rating display */}
        {value && (
          <div className="text-sm text-gray-600">
            التقييم: {value} من {maxValue}
          </div>
        )}
      </div>

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

export default Rating;
