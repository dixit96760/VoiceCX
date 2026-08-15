import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Lock, Mail, ArrowRight, ShieldCheck, UserPlus, Building, Phone, KeyRound, CheckCircle2, RefreshCw, ExternalLink } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { registerUser, sendOtpUser, verifyOtpUser, setAuthToken, forgotPasswordUser, resetPasswordUser } from '../services/api';

export function Login() {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [step, setStep] = useState<'credentials' | 'otp' | 'forgot-password' | 'reset-password'>('credentials');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [phone, setPhone] = useState('');

  // 6-digit OTP state
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [sentOtpCode, setSentOtpCode] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [deliveryMethod, setDeliveryMethod] = useState<string>('email');
  const [timer, setTimer] = useState(60);

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    let interval: any = null;
    if (step === 'otp' && timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (isRegisterMode) {
        if (!name.trim() || !email.trim() || !password.trim()) {
          setError('Please fill in all required fields.');
          setSubmitting(false);
          return;
        }

        const res = await registerUser({
          name: name.trim(),
          email: email.trim(),
          password: password.trim(),
          restaurantName: restaurantName.trim() || undefined,
          phone: phone.trim() || undefined,
        });

        if (res.success) {
          if (res.previewUrl) setPreviewUrl(res.previewUrl);
          if (res.otpCode) setSentOtpCode(res.otpCode);
          if (res.deliveryMethod) setDeliveryMethod(res.deliveryMethod);
          setStep('otp');
          setTimer(60);
          setOtpDigits(['', '', '', '', '', '']);
        } else {
          setError(res.message || 'Registration failed.');
        }
      } else {
        if (!email.trim() || !password.trim()) {
          setError('Please enter your email and password.');
          setSubmitting(false);
          return;
        }

        const res = await sendOtpUser(email.trim(), password.trim());
        if (res.success) {
          if (res.previewUrl) setPreviewUrl(res.previewUrl);
          if (res.otpCode) setSentOtpCode(res.otpCode);
          if (res.deliveryMethod) setDeliveryMethod(res.deliveryMethod);
          setStep('otp');
          setTimer(60);
          setOtpDigits(['', '', '', '', '', '']);
        } else {
          setError(res.message || 'Failed to send OTP code. Please check your credentials.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Connection error during authentication.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const otpCode = otpDigits.join('');
    if (otpCode.length < 6) {
      setError('Please enter the complete 6-digit code sent to your email.');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      const res = await verifyOtpUser(email.trim(), otpCode);
      if (res.success && res.token) {
        setAuthToken(res.token);
        navigate('/');
      } else {
        setError(res.message || 'Incorrect or expired OTP code.');
      }
    } catch (err: any) {
      setError(err.message || 'OTP verification failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    setError('');
    setSubmitting(true);
    
    try {
      const res = await forgotPasswordUser(email.trim());
      if (res.success) {
        if (res.previewUrl) setPreviewUrl(res.previewUrl);
        if (res.deliveryMethod) setDeliveryMethod(res.deliveryMethod);
        setStep('reset-password');
        setTimer(60);
        setOtpDigits(['', '', '', '', '', '']);
      } else {
        setError(res.message || 'Failed to request password reset.');
      }
    } catch (err: any) {
      setError(err.message || 'Connection error.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otpDigits.join('');
    if (otpCode.length < 6) {
      setError('Please enter the complete 6-digit code.');
      return;
    }
    if (!password.trim()) {
      setError('Please enter a new password.');
      return;
    }
    setError('');
    setSubmitting(true);

    try {
      const res = await resetPasswordUser(email.trim(), otpCode, password.trim());
      if (res.success) {
        setStep('credentials');
        setError('');
        alert('Password reset successfully! You can now sign in.');
      } else {
        setError(res.message || 'Failed to reset password.');
      }
    } catch (err: any) {
      setError(err.message || 'Reset password failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    const updated = [...otpDigits];
    updated[index] = value;
    setOtpDigits(updated);

    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
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
          <p className="text-sm text-[var(--color-text-muted)]">
            {step === 'otp'
              ? 'Check your email inbox for your 6-digit OTP'
              : step === 'forgot-password'
              ? 'Enter your email to receive a reset code'
              : step === 'reset-password'
              ? 'Enter the 6-digit code and your new password'
              : isRegisterMode
              ? 'Create a new restaurant owner account'
              : 'Sign in to your restaurant dashboard'}
          </p>
        </div>

        {/* STEP 1: Email & Password Form */}
        {step === 'credentials' && (
          <>
            {/* Mode Switcher Tabs */}
            <div className="grid grid-cols-2 p-1 bg-gray-100/80 rounded-xl border border-gray-200">
              <button
                type="button"
                onClick={() => { setIsRegisterMode(false); setError(''); }}
                className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                  !isRegisterMode 
                    ? 'bg-white text-[var(--color-primary-500)] shadow-sm' 
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setIsRegisterMode(true); setError(''); }}
                className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                  isRegisterMode 
                    ? 'bg-white text-[var(--color-primary-500)] shadow-sm' 
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Register Account
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-[var(--color-negative-bg)] text-[var(--color-negative-500)] text-xs font-medium border border-red-200">
                {error}
              </div>
            )}

            {/* Auth Form */}
            <form onSubmit={handleSendOtp} className="space-y-4">
              {isRegisterMode && (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] flex items-center">
                      <UserPlus className="h-3.5 w-3.5 mr-1 text-[var(--color-primary-500)]" /> Full Name <span className="text-red-500 ml-0.5">*</span>
                    </label>
                    <Input 
                      placeholder="e.g. Sarah Jenkins"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] flex items-center">
                      <Building className="h-3.5 w-3.5 mr-1 text-[var(--color-primary-500)]" /> Restaurant Name
                    </label>
                    <Input 
                      placeholder="e.g. Gourmet Haven Bistro"
                      value={restaurantName}
                      onChange={(e) => setRestaurantName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] flex items-center">
                      <Phone className="h-3.5 w-3.5 mr-1 text-[var(--color-primary-500)]" /> Mobile Phone
                    </label>
                    <Input 
                      placeholder="e.g. +1 (555) 234-5678"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] flex items-center">
                  <Mail className="h-3.5 w-3.5 mr-1 text-[var(--color-primary-500)]" /> Email Address <span className="text-red-500 ml-0.5">*</span>
                </label>
                <Input 
                  type="email"
                  placeholder="yourname@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] flex items-center">
                  <Lock className="h-3.5 w-3.5 mr-1 text-[var(--color-primary-500)]" /> Password <span className="text-red-500 ml-0.5">*</span>
                </label>
                <Input 
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                {!isRegisterMode && (
                  <div className="text-right pt-1">
                    <button
                      type="button"
                      onClick={() => { setStep('forgot-password'); setError(''); }}
                      className="text-[11px] font-medium text-[var(--color-primary-500)] hover:underline"
                    >
                      Forgot Password?
                    </button>
                  </div>
                )}
              </div>

              <Button type="submit" disabled={submitting} className="w-full flex items-center justify-center space-x-2">
                <span>
                  {submitting 
                    ? 'Sending OTP Email...' 
                    : (isRegisterMode ? 'Register & Send Email OTP' : 'Send 6-Digit Email OTP')
                  }
                </span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          </>
        )}

        {/* STEP 2: 6-Digit Email OTP Verification Screen */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
            {/* Success Alert Banner */}
            <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-900 text-xs text-center space-y-2">
              <div className="flex items-center justify-center space-x-1.5 font-bold text-indigo-700">
                <CheckCircle2 className="h-4 w-4 text-indigo-600 shrink-0" />
                <span>Verification OTP Sent!</span>
              </div>
              <p className="text-[13px] leading-snug text-indigo-800">
                {deliveryMethod === 'whatsapp' ? (
                  <>We sent a 6-digit code via WhatsApp to the phone number associated with <span className="font-semibold">{email}</span>. Please check your WhatsApp app.</>
                ) : deliveryMethod === 'sms' ? (
                  <>We sent a 6-digit code via SMS to the phone number associated with <span className="font-semibold">{email}</span>. Please check your text messages.</>
                ) : (
                  <>We sent a 6-digit code to <span className="font-semibold underline">{email}</span>. Please check your email inbox.</>
                )}
              </p>

              {sentOtpCode && (
                <div className="pt-1.5 font-mono text-sm font-bold text-indigo-900">
                  <span>Your Verification Code: </span>
                  <span className="bg-indigo-100 border border-indigo-300 px-2.5 py-1 rounded-md tracking-widest text-indigo-950 select-all">
                    {sentOtpCode}
                  </span>
                </div>
              )}

              {/* Preview Ethereal Inbox Link for Test Mode */}
              {previewUrl && (
                <div className="pt-1">
                  <a
                    href={previewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-1 font-semibold text-indigo-600 bg-white border border-indigo-200 px-3 py-1.5 rounded-lg shadow-sm hover:bg-indigo-50 transition-all text-[11px]"
                  >
                    <span>📬 View Sent Email Message</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-[var(--color-negative-bg)] text-[var(--color-negative-500)] text-xs font-medium border border-red-200">
                {error}
              </div>
            )}

            {/* 6-Digit OTP Box Inputs */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] text-center block">
                Enter 6-Digit Code
              </label>
              <div className="flex justify-center gap-2">
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => { otpInputRefs.current[idx] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className="w-11 h-12 text-center text-lg font-bold font-mono border-2 border-gray-300 rounded-xl focus:outline-none focus:border-[var(--color-primary-500)] focus:ring-2 focus:ring-[var(--color-primary-500)]/20 transition-all"
                  />
                ))}
              </div>
            </div>

            <Button type="submit" disabled={submitting} className="w-full flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700">
              <KeyRound className="h-4 w-4" />
              <span>{submitting ? 'Verifying Code...' : 'Verify OTP & Log In'}</span>
            </Button>

            {/* Resend & Back */}
            <div className="flex items-center justify-between text-xs pt-2 text-[var(--color-text-muted)] border-t border-[var(--color-border-subtle)]">
              <button
                type="button"
                onClick={() => setStep('credentials')}
                className="hover:underline font-medium text-[var(--color-primary-500)]"
              >
                ← Back to Login
              </button>

              <button
                type="button"
                disabled={timer > 0}
                onClick={handleSendOtp}
                className={`flex items-center space-x-1 ${
                  timer > 0 ? 'opacity-50 cursor-not-allowed' : 'hover:underline font-semibold text-[var(--color-primary-500)]'
                }`}
              >
                <RefreshCw className={`h-3 w-3 ${timer > 0 ? 'animate-spin' : ''}`} />
                <span>{timer > 0 ? `Resend Email in ${timer}s` : 'Resend Email OTP'}</span>
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: Forgot Password Request Form */}
        {step === 'forgot-password' && (
          <form onSubmit={handleForgotPassword} className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
            {error && (
              <div className="p-3 rounded-lg bg-[var(--color-negative-bg)] text-[var(--color-negative-500)] text-xs font-medium border border-red-200">
                {error}
              </div>
            )}
            
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] flex items-center">
                <Mail className="h-3.5 w-3.5 mr-1 text-[var(--color-primary-500)]" /> Email Address
              </label>
              <Input 
                type="email"
                placeholder="yourname@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <Button type="submit" disabled={submitting} className="w-full flex items-center justify-center space-x-2">
              <span>{submitting ? 'Sending Request...' : 'Send Reset Code'}</span>
              <ArrowRight className="h-4 w-4" />
            </Button>

            <div className="text-center text-xs pt-2 text-[var(--color-text-muted)] border-t border-[var(--color-border-subtle)]">
              <button
                type="button"
                onClick={() => setStep('credentials')}
                className="hover:underline font-medium text-[var(--color-primary-500)]"
              >
                ← Back to Login
              </button>
            </div>
          </form>
        )}

        {/* STEP 4: Reset Password OTP Form */}
        {step === 'reset-password' && (
          <form onSubmit={handleResetPassword} className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
            {/* Success Alert Banner */}
            <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-900 text-xs text-center space-y-2">
              <div className="flex items-center justify-center space-x-1.5 font-bold text-indigo-700">
                <CheckCircle2 className="h-4 w-4 text-indigo-600 shrink-0" />
                <span>Reset Code Sent!</span>
              </div>
              <p className="text-[13px] leading-snug text-indigo-800">
                {deliveryMethod === 'whatsapp' ? (
                  <>We sent a 6-digit reset code via WhatsApp to the phone number associated with <span className="font-semibold">{email}</span>.</>
                ) : deliveryMethod === 'sms' ? (
                  <>We sent a 6-digit reset code via SMS to the phone number associated with <span className="font-semibold">{email}</span>.</>
                ) : (
                  <>We sent a 6-digit reset code to <span className="font-semibold underline">{email}</span>. Please check your email inbox.</>
                )}
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-[var(--color-negative-bg)] text-[var(--color-negative-500)] text-xs font-medium border border-red-200">
                {error}
              </div>
            )}

            {/* 6-Digit OTP Box Inputs */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] text-center block">
                Enter 6-Digit Code
              </label>
              <div className="flex justify-center gap-2">
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => { otpInputRefs.current[idx] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className="w-11 h-12 text-center text-lg font-bold font-mono border-2 border-gray-300 rounded-xl focus:outline-none focus:border-[var(--color-primary-500)] focus:ring-2 focus:ring-[var(--color-primary-500)]/20 transition-all"
                  />
                ))}
              </div>
            </div>

            <div className="space-y-1 mt-4">
              <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] flex items-center">
                <Lock className="h-3.5 w-3.5 mr-1 text-[var(--color-primary-500)]" /> New Password
              </label>
              <Input 
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" disabled={submitting} className="w-full flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700">
              <KeyRound className="h-4 w-4" />
              <span>{submitting ? 'Resetting Password...' : 'Reset Password'}</span>
            </Button>

            {/* Resend & Back */}
            <div className="flex items-center justify-between text-xs pt-2 text-[var(--color-text-muted)] border-t border-[var(--color-border-subtle)]">
              <button
                type="button"
                onClick={() => setStep('credentials')}
                className="hover:underline font-medium text-[var(--color-primary-500)]"
              >
                ← Back to Login
              </button>

              <button
                type="button"
                disabled={timer > 0}
                onClick={handleForgotPassword}
                className={`flex items-center space-x-1 ${
                  timer > 0 ? 'opacity-50 cursor-not-allowed' : 'hover:underline font-semibold text-[var(--color-primary-500)]'
                }`}
              >
                <RefreshCw className={`h-3 w-3 ${timer > 0 ? 'animate-spin' : ''}`} />
                <span>{timer > 0 ? `Resend Email in ${timer}s` : 'Resend Email OTP'}</span>
              </button>
            </div>
          </form>
        )}

        <div className="text-center pt-2 border-t border-[var(--color-border-subtle)]">
          <p className="text-xs text-[var(--color-text-verymuted)] flex items-center justify-center">
            <ShieldCheck className="h-3.5 w-3.5 mr-1 text-[var(--color-positive-500)]" />
            Protected by Real-Time SMS & Email OTP
          </p>
        </div>

      </div>
    </div>
  );
}
