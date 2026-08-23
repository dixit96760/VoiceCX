import React, { useState, useEffect, useRef } from 'react';
import { Bell, Search, UserPlus, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getNotifications, markNotificationRead } from '../../services/api';
import type { AppNotification } from '../../types';

interface HeaderProps {
  title: string;
  description?: string;
}

export function Header({ title, description }: HeaderProps) {
  const { user } = useAuth();
  
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('voicecx_theme') === 'dark' || 
      (!localStorage.getItem('voicecx_theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('voicecx_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('voicecx_theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const fetchNotifs = async () => {
      const data = await getNotifications();
      setNotifications(data);
    };
    fetchNotifs();
    // Poll every 30 seconds for new notifications
    const interval = setInterval(fetchNotifs, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown if clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAsRead = async (id: string) => {
    await markNotificationRead(id);
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
  };

  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--color-border-subtle)]">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">{title}</h1>
        {description && (
          <p className="text-sm text-[var(--color-text-muted)] mt-1">{description}</p>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-muted)]" />
          <input
            type="text"
            placeholder="Search..."
            className="h-10 w-64 rounded-full border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] pl-10 pr-4 text-sm outline-none focus:border-[var(--color-primary-500)] focus:ring-1 focus:ring-[var(--color-primary-500)]"
          />
        </div>

        {/* Theme Toggle */}
        <button 
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="p-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-page)] rounded-full transition-colors"
          title="Toggle Theme"
        >
          {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>

        {/* Notifications */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setShowDropdown(!showDropdown)}
            className="relative p-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-page)] rounded-full transition-colors"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[var(--color-negative-500)] ring-2 ring-[var(--color-bg-page)]" />
            )}
          </button>
          
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-[var(--color-bg-card)] rounded-lg shadow-lg border border-[var(--color-border-subtle)] z-50 overflow-hidden">
              <div className="p-3 border-b border-[var(--color-border-subtle)] flex justify-between items-center">
                <h3 className="font-semibold text-sm">Notifications</h3>
                <span className="text-xs bg-[var(--color-primary-100)] text-[var(--color-primary-700)] px-2 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-sm text-[var(--color-text-muted)]">
                    No new notifications.
                  </div>
                ) : (
                  <ul className="divide-y divide-[var(--color-border-subtle)]">
                    {notifications.map(n => (
                      <li key={n._id} className={`p-3 text-sm hover:bg-[var(--color-bg-hover)] transition-colors cursor-pointer ${!n.read ? 'bg-blue-50 dark:bg-blue-900/10' : ''}`} onClick={() => handleMarkAsRead(n._id)}>
                        <div className="flex justify-between items-start mb-1">
                          <span className={`font-medium ${n.type === 'anomaly' ? 'text-red-600' : n.type === 'insight' ? 'text-green-600' : 'text-blue-600'}`}>
                            {n.title}
                          </span>
                          {!n.read && <span className="h-2 w-2 rounded-full bg-[var(--color-primary-500)] mt-1.5" />}
                        </div>
                        <p className="text-[var(--color-text-secondary)] text-xs">{n.message}</p>
                        <span className="text-[10px] text-[var(--color-text-muted)] mt-2 block">
                          {new Date(n.createdAt).toLocaleDateString()}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile / Actions */}
        <div className="flex items-center gap-3 pl-4 border-l border-[var(--color-border-subtle)]">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-[var(--color-text-primary)]">{user?.name}</p>
            <p className="text-xs text-[var(--color-text-muted)]">{user?.restaurantName}</p>
          </div>
          <div className="h-9 w-9 rounded-full bg-[var(--color-primary-100)] flex items-center justify-center text-[var(--color-primary-700)] font-semibold">
            {user?.name?.charAt(0) || 'U'}
          </div>
        </div>
      </div>
    </header>
  );
}
