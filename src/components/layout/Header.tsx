import React from 'react';
import { Bell, Search, UserPlus } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

interface HeaderProps {
  title: string;
  description?: string;
  showDateRange?: boolean;
  onAddCustomerClick?: () => void;
}

export function Header({ title, description, showDateRange, onAddCustomerClick }: HeaderProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] px-6">
      <div className="flex flex-col">
        <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">{title}</h1>
        {description && <p className="text-xs text-[var(--color-text-muted)]">{description}</p>}
      </div>

      <div className="flex items-center space-x-4">
        {onAddCustomerClick && (
          <Button size="sm" onClick={onAddCustomerClick} className="flex items-center space-x-1">
            <UserPlus className="h-4 w-4 mr-1" />
            <span>Add Customer</span>
          </Button>
        )}

        {showDateRange && (
          <select className="h-9 rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-bg-page)] px-3 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]">
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
            <option>Last 90 Days</option>
          </select>
        )}
        
        <div className="relative hidden md:block">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[var(--color-text-muted)]" />
          <Input type="search" placeholder="Search..." className="w-64 pl-9 h-9" />
        </div>

        <button className="relative rounded-full p-2 text-[var(--color-text-muted)] hover:bg-gray-100 hover:text-[var(--color-text-primary)] transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[var(--color-negative-500)]" />
        </button>
      </div>
    </header>
  );
}
