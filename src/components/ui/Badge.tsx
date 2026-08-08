import React from 'react';
import { cn } from '../../lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'positive' | 'negative' | 'warning' | 'secondary';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2",
        {
          'bg-gray-100 text-gray-800 hover:bg-gray-200': variant === 'default',
          'bg-[var(--color-positive-bg)] text-[var(--color-positive-500)]': variant === 'positive',
          'bg-[var(--color-negative-bg)] text-[var(--color-negative-500)]': variant === 'negative',
          'bg-[var(--color-warning-bg)] text-[var(--color-warning-500)]': variant === 'warning',
          'bg-[var(--color-secondary-bg)] text-[var(--color-secondary-500)]': variant === 'secondary',
        },
        className
      )}
      {...props}
    />
  );
}
