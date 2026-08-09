import React, { useState } from 'react';
import { X, Star, UserPlus, Utensils, PhoneCall, Sparkles, CheckCircle2 } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { addCustomer } from '../services/api';

interface AddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AddCustomerModal({ isOpen, onClose, onSuccess }: AddCustomerModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [itemsOrdered, setItemsOrdered] = useState('');
  const [rating, setRating] = useState(5);
  const [notes, setNotes] = useState('');
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split('T')[0]);
  const [autoCall, setAutoCall] = useState(true);
  const [loading, setLoading] = useState(false);
  const [callMessage, setCallMessage] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      setError('Please fill in both name and phone number.');
      return;
    }

    setError('');
    setCallMessage('');
    setLoading(true);

    try {
      if (autoCall) {
        setCallMessage(`Initiating Automated AI Voice Agent call to ${phone.trim()}...`);
      }

      const res = await addCustomer({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        itemsOrdered: itemsOrdered.trim() || undefined,
        rating,
        notes: notes.trim() || undefined,
        visitDate,
      });

      if (res.success) {
        // Speak confirmation if SpeechSynthesis supported
        if (autoCall && 'speechSynthesis' in window) {
          try {
            window.speechSynthesis.cancel();
            const text = `Automated AI call completed for ${name.trim()}. Recorded feedback and analyzed sentiment.`;
            const utterance = new SpeechSynthesisUtterance(text);
            window.speechSynthesis.speak(utterance);
          } catch {}
        }

        setName('');
        setPhone('');
        setEmail('');
        setItemsOrdered('');
        setRating(5);
        setNotes('');
        setCallMessage('');

        if (onSuccess) onSuccess();
        onClose();
      } else {
        setError(res.message || 'Failed to add customer');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while adding the customer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 z-50 transition-opacity backdrop-blur-xs"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div 
          className="w-full max-w-lg rounded-2xl bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-[var(--color-border-subtle)] bg-gray-50/50">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-lg bg-[var(--color-primary-500)] text-white">
                <UserPlus className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-[var(--color-text-primary)]">Add Customer & AI Voice Call</h3>
                <p className="text-xs text-[var(--color-text-muted)]">Record visit and automatically trigger AI Voice Agent follow-up call</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-1 rounded-md text-[var(--color-text-muted)] hover:bg-gray-200 hover:text-[var(--color-text-primary)] transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            {error && (
              <div className="p-3 rounded-md bg-[var(--color-negative-bg)] text-[var(--color-negative-500)] text-sm font-medium border border-red-200">
                {error}
              </div>
            )}

            {callMessage && (
              <div className="p-3 rounded-md bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200 flex items-center space-x-2 animate-pulse">
                <PhoneCall className="h-4 w-4 text-blue-600" />
                <span>{callMessage}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider flex items-center">
                  Customer Name <span className="text-red-500 ml-0.5">*</span>
                </label>
                <Input 
                  placeholder="e.g. Gordon Ramsay" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  required
                />
              </div>

              {/* Phone Number */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider flex items-center">
                  Phone Number <span className="text-red-500 ml-0.5">*</span>
                </label>
                <Input 
                  placeholder="e.g. +1 (555) 234-5678" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)} 
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Email */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
                  Email Address
                </label>
                <Input 
                  type="email"
                  placeholder="customer@example.com" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                />
              </div>

              {/* Visit Date */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
                  Visit Date
                </label>
                <Input 
                  type="date"
                  value={visitDate} 
                  onChange={(e) => setVisitDate(e.target.value)} 
                />
              </div>
            </div>

            {/* Dishes / Items Ordered */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider flex items-center">
                <Utensils className="h-3.5 w-3.5 mr-1 text-[var(--color-primary-500)]" />
                Items / Dishes Ordered
              </label>
              <Input 
                placeholder="e.g. Ribeye Steak, Truffle Risotto, Artisanal Tiramisu" 
                value={itemsOrdered} 
                onChange={(e) => setItemsOrdered(e.target.value)} 
              />
            </div>

            {/* Rating Selector */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
                Overall Experience Rating
              </label>
              <div className="flex items-center space-x-2 pt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 focus:outline-none transition-transform hover:scale-110"
                  >
                    <Star 
                      className={`h-7 w-7 ${
                        star <= rating 
                          ? 'fill-amber-400 text-amber-400' 
                          : 'text-gray-300 hover:text-amber-200'
                      }`}
                    />
                  </button>
                ))}
                <span className="text-sm font-semibold text-[var(--color-text-primary)] ml-2">
                  {rating} / 5 Stars
                </span>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
                Notes & Feedback Details
              </label>
              <textarea
                className="w-full h-20 rounded-md border border-[var(--color-border-subtle)] p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                placeholder="Add comments about their dining experience..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {/* Auto Call Checkbox */}
            <div className="p-3 bg-[var(--color-secondary-bg)] rounded-xl border border-purple-100 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-4 w-4 text-[var(--color-secondary-500)]" />
                <span className="text-xs font-semibold text-[var(--color-text-primary)]">
                  Automatically Trigger AI Voice Agent Call
                </span>
              </div>
              <input 
                type="checkbox"
                checked={autoCall}
                onChange={(e) => setAutoCall(e.target.checked)}
                className="h-4 w-4 rounded text-[var(--color-primary-500)] focus:ring-[var(--color-primary-500)] cursor-pointer"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-[var(--color-border-subtle)]">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="flex items-center space-x-2">
                <PhoneCall className="h-4 w-4" />
                <span>{loading ? (autoCall ? 'Calling Customer...' : 'Saving...') : 'Save & Trigger AI Call'}</span>
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
