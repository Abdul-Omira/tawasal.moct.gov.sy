/**
 * Alert Component
 * A flexible alert component for displaying messages
 */

import React from 'react';
import { cn } from '../../lib/utils';

interface AlertProps {
  children: React.ReactNode;
  variant?: 'default' | 'destructive' | 'warning' | 'success';
  className?: string;
}

interface AlertDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  children,
  variant = 'default',
  className,
}) => {
  const variantClasses = {
    default: 'bg-blue-50 border-blue-200 text-blue-800',
    destructive: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    success: 'bg-green-50 border-green-200 text-green-800',
  };

  return (
    <div
      className={cn(
        'p-4 border rounded-lg',
        variantClasses[variant],
        className
      )}
    >
      {children}
    </div>
  );
};

export const AlertDescription: React.FC<AlertDescriptionProps> = ({
  children,
  className,
}) => {
  return (
    <p className={cn('text-sm', className)}>
      {children}
    </p>
  );
};