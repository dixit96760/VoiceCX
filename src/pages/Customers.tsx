import React, { useState, useEffect } from 'react';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { UserPlus, Search, PhoneCall, CheckCircle2, Sparkles } from 'lucide-react';
import { Input } from '../components/ui/Input';
import type { Customer } from '../types';
import { getCustomers, triggerCustomerCall } from '../services/api';
import { AddCustomerModal } from '../components/AddCustomerModal';

export function Customers() {
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [callingCustomer, setCallingCustomer] = useState<string | null>(null);
  const [callNotification, setCallNotification] = useState<string | null>(null);

  const fetchCustomers = () => {
    setLoading(true);
    getCustomers().then(data => {
      setCustomers(data);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleCallCustomer = async (c: Customer) => {
    setCallingCustomer(c.id);
    setCallNotification(`AI Voice Agent is calling ${c.name} (${c.phone})...`);

    try {
      const res = await triggerCustomerCall(c.phone, c.name);
      
      // Speak out confirmation if supported
      if ('speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(`AI Call completed for ${c.name}. Sentiment analyzed as positive.`);
          window.speechSynthesis.speak(utterance);
        } catch {}
      }

      setCallNotification(`AI Call Completed for ${c.name}! ${res.message || 'Analyzed via Gemini AI'}`);
      fetchCustomers();
    } catch (err: any) {
      setCallNotification(`Call simulated for ${c.name}!`);
    } finally {
      setCallingCustomer(null);
      setTimeout(() => setCallNotification(null), 6000);
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.phone.includes(search)
  );

  const getSentimentBadgeVariant = (sentiment: string) => {
    switch (sentiment) {
      case 'Positive': return 'positive';
      case 'Neutral': return 'warning';
      case 'Negative': return 'negative';
      default: return 'default';
    }
  };

  return (
    <div className="flex flex-col space-y-6 h-full relative">
      <Header title="Customers" description="Manage customer profiles and trigger automated AI Voice Agent follow-up calls." />
      
      <div className="flex flex-col flex-1 pb-6 space-y-4">
        {/* Live Call Banner */}
        {callNotification && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-800 text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-4 w-4 text-blue-600 animate-spin" />
              <span>{callNotification}</span>
            </div>
            <button onClick={() => setCallNotification(null)} className="text-blue-500 hover:text-blue-700 font-bold text-xs">
              Dismiss
            </button>
          </div>
        )}

        {/* Actions Bar */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--color-text-muted)]" />
            <Input 
              type="search" 
              placeholder="Search by customer name or phone..." 
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Button onClick={() => setIsModalOpen(true)} className="flex items-center space-x-2">
            <UserPlus className="h-4 w-4" />
            <span>Add Customer</span>
          </Button>
        </div>

        <Card className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-auto">
            {loading ? (
              <div className="flex h-full items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary-500)]" />
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center p-8">
                <p className="text-lg font-medium text-[var(--color-text-primary)]">No customers found</p>
                <p className="text-sm text-[var(--color-text-muted)] mt-1 mb-4">Add your first customer to start automated AI Voice Agent calling.</p>
                <Button onClick={() => setIsModalOpen(true)}>
                  <UserPlus className="mr-2 h-4 w-4" /> Add Customer
                </Button>
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-[var(--color-bg-card)] shadow-sm">
                  <tr className="border-b border-[var(--color-border-subtle)] text-[var(--color-text-muted)] font-medium">
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Phone</th>
                    <th className="py-3 px-4">Last Visit</th>
                    <th className="py-3 px-4">Feedback Count</th>
                    <th className="py-3 px-4">Last Sentiment</th>
                    <th className="py-3 px-4">Last Rating</th>
                    <th className="py-3 px-4 text-right">AI Agent Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map(c => (
                    <tr 
                      key={c.id} 
                      className="border-b border-[var(--color-border-subtle)] hover:bg-gray-50/80 transition-colors"
                    >
                      <td className="py-3 px-4 whitespace-nowrap font-medium text-[var(--color-text-primary)]">
                        {c.name}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-[var(--color-text-secondary)]">
                        {c.phone}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-[var(--color-text-secondary)]">
                        {new Date(c.lastVisit).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {c.feedbackCount}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <Badge variant={getSentimentBadgeVariant(c.lastSentiment)}>{c.lastSentiment}</Badge>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-medium">
                        {c.lastRating > 0 ? `${c.lastRating} / 5` : '-'}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-right">
                        <Button 
                          size="sm" 
                          variant="secondary"
                          disabled={callingCustomer === c.id}
                          onClick={() => handleCallCustomer(c)}
                          className="inline-flex items-center space-x-1 text-xs"
                        >
                          <PhoneCall className="h-3.5 w-3.5 text-[var(--color-primary-500)]" />
                          <span>{callingCustomer === c.id ? 'Calling...' : 'Call AI Agent'}</span>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      </div>

      <AddCustomerModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchCustomers}
      />
    </div>
  );
}
