import React, { useState, useEffect } from 'react';
import { X, Play, Pause, AlertCircle, MessageCircle } from 'lucide-react';
import type { Feedback } from '../types';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { cn } from '../lib/utils';
import { saveOwnerNote } from '../services/api';

interface FeedbackDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  feedback: Feedback | null;
}

export function FeedbackDrawer({ isOpen, onClose, feedback }: FeedbackDrawerProps) {
  const [note, setNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (feedback) {
      setNote(feedback.ownerNotes || '');
      setIsPlaying(false);
    }
  }, [feedback]);

  if (!feedback) return null;

  const handleSaveNote = async () => {
    setSavingNote(true);
    await saveOwnerNote(feedback.id, note);
    setSavingNote(false);
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
    <>
      {/* Backdrop overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 transition-opacity" 
          onClick={onClose}
        />
      )}
      
      {/* Drawer */}
      <div 
        className={cn(
          "fixed top-0 right-0 h-full w-full md:w-[450px] bg-[var(--color-bg-card)] shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex items-center justify-between p-5 border-b border-[var(--color-border-subtle)]">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Call Details</h2>
          <button onClick={onClose} className="p-1 rounded-md text-[var(--color-text-muted)] hover:bg-gray-100 hover:text-[var(--color-text-primary)] transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* Header Info */}
          <div>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold">{feedback.customerPhone}</h3>
                <p className="text-sm text-[var(--color-text-muted)] mt-1">
                  {new Date(feedback.dateTime).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                </p>
              </div>
              <Badge variant={getSentimentBadgeVariant(feedback.sentiment)} className="text-sm py-1 px-3">
                {feedback.sentiment}
              </Badge>
            </div>
          </div>

          {/* AI Summary */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-2 flex items-center">
              <SparklesIcon className="w-3 h-3 mr-1" /> AI Feedback Summary
            </h4>
            <div className="bg-[var(--color-secondary-bg)] border border-purple-100 p-4 rounded-xl text-sm leading-relaxed text-[var(--color-text-primary)]">
              {feedback.summary}
            </div>
          </div>

          {/* Ratings */}
          {feedback.overallRating > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-3">Category Ratings</h4>
              <div className="space-y-3">
                <RatingBar label="Overall" rating={feedback.overallRating} />
                <RatingBar label="Food" rating={feedback.ratings.food} />
                <RatingBar label="Service" rating={feedback.ratings.service} />
                <RatingBar label="Ambiance" rating={feedback.ratings.ambiance} />
              </div>
            </div>
          )}

          {/* Audio Player (Mock) */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-3">Call Audio</h4>
            {feedback.audioUrl ? (
              <div className="flex items-center space-x-3 bg-gray-50 border border-[var(--color-border-subtle)] p-3 rounded-lg">
                <button 
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="h-10 w-10 flex items-center justify-center rounded-full bg-[var(--color-primary-500)] text-white hover:bg-[var(--color-primary-600)] transition-colors"
                >
                  {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-1" />}
                </button>
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className={cn("h-full bg-[var(--color-primary-500)] transition-all", isPlaying ? "w-[45%]" : "w-[0%]")} />
                </div>
                <span className="text-xs font-medium text-[var(--color-text-muted)]">0:45</span>
              </div>
            ) : (
              <div className="flex items-center text-sm text-[var(--color-text-muted)] bg-gray-50 p-3 rounded-lg border border-[var(--color-border-subtle)]">
                <AlertCircle className="h-4 w-4 mr-2" /> Audio unavailable
              </div>
            )}
          </div>

          {/* Transcript */}
          {feedback.transcript && feedback.transcript.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-3 flex items-center">
                <MessageCircle className="w-3 h-3 mr-1" /> Full Conversation
              </h4>
              <div className="space-y-4">
                {feedback.transcript.map((msg, i) => (
                  <div key={i} className={cn("flex flex-col", msg.speaker === 'Agent' ? "items-start" : "items-end")}>
                    <span className="text-[10px] text-[var(--color-text-verymuted)] mb-1">{msg.speaker} • {msg.timestamp}</span>
                    <div className={cn(
                      "max-w-[85%] rounded-xl px-4 py-2 text-sm",
                      msg.speaker === 'Agent' 
                        ? "bg-gray-100 text-[var(--color-text-primary)] rounded-tl-none" 
                        : "bg-[var(--color-primary-500)] text-white rounded-tr-none"
                    )}>
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Owner Notes */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-3">Owner Notes</h4>
            <textarea
              className="w-full h-24 rounded-md border border-[var(--color-border-subtle)] p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] mb-2"
              placeholder="Type comments or notes here..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <Button onClick={handleSaveNote} disabled={savingNote} size="sm">
              {savingNote ? 'Saving...' : 'Save Note'}
            </Button>
          </div>

        </div>
      </div>
    </>
  );
}

function RatingBar({ label, rating }: { label: string, rating: number }) {
  return (
    <div className="flex items-center text-sm">
      <div className="w-24 text-[var(--color-text-secondary)] font-medium">{label}</div>
      <div className="flex-1 flex space-x-1">
        {[1, 2, 3, 4, 5].map(star => (
          <div 
            key={star} 
            className={cn(
              "h-2 flex-1 rounded-full",
              star <= rating ? "bg-[var(--color-primary-500)]" : "bg-gray-200"
            )}
          />
        ))}
      </div>
      <div className="w-8 text-right font-medium text-[var(--color-text-primary)]">{rating}/5</div>
    </div>
  );
}

function SparklesIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
      <path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/>
    </svg>
  );
}
