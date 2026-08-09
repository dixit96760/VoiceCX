import React, { useState, useEffect } from 'react';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { UserPlus, Search } from 'lucide-react';
import { Input } from '../components/ui/Input';
import type { Customer } from '../types';
import { getCustomers } from '../services/api';
import { AddCustomerModal } from '../components/AddCustomerModal';

export function Customers() {
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

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
      <Header title="Customers" description="Manage your customer base and view their feedback history." />
      
      <div className="flex flex-col flex-1 pb-6 space-y-4">
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
                <p className="text-sm text-[var(--color-text-muted)] mt-1 mb-4">Add your first customer to start tracking visits and dishes ordered.</p>
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
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map(c => (
                    <tr 
                      key={c.id} 
                      className="border-b border-[var(--color-border-subtle)] hover:bg-gray-50/80 cursor-pointer transition-colors"
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
