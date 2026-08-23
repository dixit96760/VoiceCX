import React from 'react';
import { cn } from '../../lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-[var(--color-bg-page)]",
          {
            'bg-[var(--color-primary-500)] text-white hover:bg-[var(--color-primary-600)]': variant === 'primary',
            'bg-[var(--color-secondary-bg)] text-[var(--color-secondary-500)] hover:bg-[#eedeff]': variant === 'secondary',
            'border border-[var(--color-border-subtle)] hover:bg-gray-50 text-[var(--color-text-primary)]': variant === 'outline',
            'hover:bg-gray-100 hover:text-[var(--color-text-primary)] text-[var(--color-text-secondary)]': variant === 'ghost',
            'h-9 px-3 text-sm': size === 'sm',
            'h-10 py-2 px-4 text-sm': size === 'md',
            'h-11 px-8 text-base': size === 'lg',
          },
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
