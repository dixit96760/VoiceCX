import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Phone, BarChart2, Users, FileText, Settings, LogOut, MessageSquare } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';

export function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Calls / Feedback', path: '/feedback', icon: Phone },
    { name: 'Insights', path: '/insights', icon: BarChart2 },
    { name: 'Customers', path: '/customers', icon: Users },
    { name: 'Reports', path: '/reports', icon: FileText },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (name?: string) => {
    if (!name) return 'SJ';
    const parts = name.split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="flex h-full w-[230px] flex-col border-r border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] shrink-0">
      {/* Logo Area */}
      <div className="flex h-16 items-center px-6">
        <MessageSquare className="mr-2 h-6 w-6 text-[var(--color-primary-500)]" />
        <span className="text-lg font-bold text-[var(--color-text-primary)] tracking-tight">VoiceCX</span>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-[var(--color-primary-500)] text-white"
                  : "text-[var(--color-text-secondary)] hover:bg-gray-100 hover:text-[var(--color-text-primary)]"
              )
            }
          >
            <item.icon className="mr-3 h-5 w-5" />
            {item.name}
          </NavLink>
        ))}
      </div>

      {/* User Profile */}
      <div className="border-t border-[var(--color-border-subtle)] p-4">
        <div className="flex items-center space-x-3 mb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-secondary-bg)] text-[var(--color-secondary-500)] font-bold text-xs">
            {getInitials(user?.name)}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-medium text-[var(--color-text-primary)] truncate">
              {user?.name || 'Chef Sarah Jenkins'}
            </span>
            <span className="text-xs text-[var(--color-text-muted)] truncate">
              {user?.restaurantName || 'Y6 Gourmet Bistro'}
            </span>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-[var(--color-text-secondary)] hover:bg-red-50 hover:text-[var(--color-negative-500)] transition-colors"
        >
          <LogOut className="mr-3 h-4 w-4" />
          Logout
        </button>
      </div>
    </div>
  );
}
