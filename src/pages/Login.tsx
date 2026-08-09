import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Lock, Mail, ArrowRight, Zap, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export function Login() {
  const [email, setEmail] = useState('owner@y6bistro.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const res = await login(email, password);
      if (res.success) {
        navigate('/');
      } else {
        setError(res.message || 'Invalid email or password.');
      }
    } catch (err: any) {
      setError('Connection error during login.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoLogin = async () => {
    setEmail('owner@y6bistro.com');
    setPassword('password123');
    setError('');
    setSubmitting(true);

    try {
      const res = await login('owner@y6bistro.com', 'password123');
      if (res.success) {
        navigate('/');
      } else {
        setError(res.message || 'Demo login failed.');
      }
    } catch {
      setError('Connection error.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[var(--color-bg-page)] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border-subtle)] shadow-xl overflow-hidden p-8 space-y-6">
        
        {/* Logo & Heading */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-primary-500)] text-white shadow-md mb-2">
            <MessageSquare className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] tracking-tight">VoiceCX</h1>
          <p className="text-sm text-[var(--color-text-muted)]">Sign in to your customer feedback dashboard</p>
        </div>

        {/* Demo Preset Card */}
        <div className="bg-[var(--color-secondary-bg)] border border-purple-100 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Zap className="h-5 w-5 text-[var(--color-secondary-500)] shrink-0" />
            <div className="text-xs text-[var(--color-text-primary)]">
              <span className="font-semibold block">Chef Sarah Jenkins Demo</span>
              <span className="text-[var(--color-text-muted)]">owner@y6bistro.com • password123</span>
            </div>
          </div>
          <Button size="sm" variant="secondary" type="button" onClick={handleDemoLogin} disabled={submitting}>
            One-Click Login
          </Button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-[var(--color-negative-bg)] text-[var(--color-negative-500)] text-xs font-medium border border-red-200">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] flex items-center">
              <Mail className="h-3.5 w-3.5 mr-1 text-[var(--color-primary-500)]" /> Email Address
            </label>
            <Input 
              type="email"
              placeholder="owner@y6bistro.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] flex items-center">
              <Lock className="h-3.5 w-3.5 mr-1 text-[var(--color-primary-500)]" /> Password
            </label>
            <Input 
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <Button type="submit" disabled={submitting} className="w-full flex items-center justify-center space-x-2">
            <span>{submitting ? 'Signing in...' : 'Sign In to Dashboard'}</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </form>

        <div className="text-center pt-2 border-t border-[var(--color-border-subtle)]">
          <p className="text-xs text-[var(--color-text-verymuted)] flex items-center justify-center">
            <ShieldCheck className="h-3.5 w-3.5 mr-1 text-[var(--color-positive-500)]" />
            Protected by Y6 Voice CX Authentication
          </p>
        </div>

      </div>
    </div>
  );
}
