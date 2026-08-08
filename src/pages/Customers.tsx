import React, { useState, useEffect } from 'react';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import type { Customer } from '../types';
import { getCustomers } from '../services/api';

export function Customers() {
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    getCustomers().then(data => {
      setCustomers(data);
      setLoading(false);
    });
  }, []);

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
      
      <div className="flex flex-col flex-1 pb-6">
        <Card className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-auto">
            {loading ? (
              <div className="flex h-full items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary-500)]" />
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
                  {customers.map(c => (
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
    </div>
  );
}
