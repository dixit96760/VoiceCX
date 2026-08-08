import React, { useState, useEffect } from 'react';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import type { Feedback } from '../types';
import { getFeedback } from '../services/api';
import { Search, Filter } from 'lucide-react';
import { FeedbackDrawer } from './FeedbackDrawer';

export function FeedbackPage() {
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [search, setSearch] = useState('');
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);

  useEffect(() => {
    getFeedback().then(data => {
      setFeedback(data);
      setLoading(false);
    });
  }, []);

  const filteredFeedback = feedback.filter(item => 
    item.customerPhone.includes(search) || 
    item.summary.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Completed': return 'positive';
      case 'No Answer': return 'warning';
      case 'Rejected': return 'negative';
      default: return 'default';
    }
  };

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
      <Header title="Calls / Feedback" description="Manage and review all customer feedback calls." />
      
      <div className="flex flex-col flex-1 pb-6">
        <Card className="flex-1 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-[var(--color-border-subtle)] flex items-center justify-between bg-gray-50/50">
            <div className="relative w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--color-text-muted)]" />
              <Input 
                type="search" 
                placeholder="Search by phone or summary..." 
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex space-x-2">
              <select className="h-10 rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] px-3 text-sm text-[var(--color-text-primary)]">
                <option value="">All Ratings</option>
                <option value="5">5 Stars</option>
                <option value="4">4 Stars</option>
                <option value="1-3">1-3 Stars</option>
              </select>
              <button className="flex items-center px-3 h-10 border border-[var(--color-border-subtle)] rounded-md bg-[var(--color-bg-card)] text-sm font-medium hover:bg-gray-50">
                <Filter className="mr-2 h-4 w-4" /> Filter
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            {loading ? (
              <div className="flex h-full items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary-500)]" />
              </div>
            ) : filteredFeedback.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center p-8">
                <p className="text-lg font-medium text-[var(--color-text-primary)]">No feedback found</p>
                <p className="text-sm text-[var(--color-text-muted)] mt-1">Try adjusting your filters or search terms.</p>
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-[var(--color-bg-card)] shadow-sm">
                  <tr className="border-b border-[var(--color-border-subtle)] text-[var(--color-text-muted)] font-medium">
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Summary</th>
                    <th className="py-3 px-4">Sentiment</th>
                    <th className="py-3 px-4">Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFeedback.map(fb => (
                    <tr 
                      key={fb.id} 
                      className="border-b border-[var(--color-border-subtle)] hover:bg-gray-50/80 cursor-pointer transition-colors"
                      onClick={() => setSelectedFeedback(fb)}
                    >
                      <td className="py-3 px-4 whitespace-nowrap text-[var(--color-text-secondary)]">
                        {new Date(fb.dateTime).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-medium text-[var(--color-text-primary)]">
                        {fb.customerPhone}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <Badge variant={getStatusBadgeVariant(fb.status)}>{fb.status}</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <span className="line-clamp-1">{fb.summary}</span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <Badge variant={getSentimentBadgeVariant(fb.sentiment)}>{fb.sentiment}</Badge>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-medium">
                        {fb.overallRating > 0 ? `${fb.overallRating} / 5` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      </div>

      <FeedbackDrawer 
        isOpen={!!selectedFeedback} 
        onClose={() => setSelectedFeedback(null)} 
        feedback={selectedFeedback} 
      />
    </div>
  );
}
