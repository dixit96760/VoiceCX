import React from 'react';
import { X, PhoneCall, Clock, Calendar, CheckCircle2, AlertCircle, Bot, User, Play, FileText, ArrowRight, Shield } from 'lucide-react';
import type { CallRecord } from '../types';
import { Button } from './ui/Button';

interface CallDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  call: CallRecord | null;
}

export function CallDetailsModal({ isOpen, onClose, call }: CallDetailsModalProps) {
  if (!isOpen || !call) return null;

  const parseTranscript = (raw: any): { speaker: string; text: string; timestamp?: string }[] => {
    if (!raw) return [];
    if (Array.isArray(raw)) {
      return raw.map((item: any) => ({
        speaker: item.speaker || 'AI',
        text: item.text || item.message || '',
        timestamp: item.timestamp || '',
      }));
    }
    if (typeof raw === 'string') {
      const lines = raw.split('\n');
      return lines.map((line) => {
        if (line.toLowerCase().startsWith('ai:') || line.toLowerCase().startsWith('agent:')) {
          return { speaker: 'AI', text: line.replace(/^(ai:|agent:)/i, '').trim() };
        } else if (line.toLowerCase().startsWith('customer:') || line.toLowerCase().startsWith('user:')) {
          return { speaker: 'CUSTOMER', text: line.replace(/^(customer:|user:)/i, '').trim() };
        }
        return { speaker: 'AI', text: line.trim() };
      }).filter(l => l.text.length > 0);
    }
    return [];
  };

  const transcriptList = parseTranscript(call.transcript);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">Completed</span>;
      case 'in-progress':
      case 'calling':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">In Progress</span>;
      case 'queued':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">Queued</span>;
      case 'failed':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">Failed</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  const getOutcomeBadge = (outcome?: string) => {
    switch (outcome) {
      case 'positive':
      case 'interested':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Interested / Positive</span>;
      case 'negative':
      case 'not_interested':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">Not Interested</span>;
      case 'callback_requested':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">Callback Requested</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">Completed</span>;
    }
  };

  const getSentimentBadge = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive':
        return <span className="text-xs font-bold text-emerald-600 uppercase">Positive</span>;
      case 'negative':
        return <span className="text-xs font-bold text-rose-600 uppercase">Negative</span>;
      default:
        return <span className="text-xs font-bold text-amber-600 uppercase">Neutral</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-3xl bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border-subtle)] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-6 bg-gradient-to-r from-indigo-900 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-500/20 border border-indigo-400/30 rounded-xl">
              <PhoneCall className="h-6 w-6 text-indigo-300" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">{call.contactName}</h2>
              <p className="text-xs text-indigo-200 font-mono">{call.phoneNumber}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {getStatusBadge(call.status)}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-indigo-200 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-[var(--color-bg-page)] border border-[var(--color-border-subtle)]">
            <div>
              <span className="text-xs text-[var(--color-text-muted)] block">Call Purpose</span>
              <span className="text-xs font-semibold text-[var(--color-text-primary)]">{call.purpose || 'Feedback & Inquiry'}</span>
            </div>
            <div>
              <span className="text-xs text-[var(--color-text-muted)] block">Duration</span>
              <span className="text-xs font-semibold text-[var(--color-text-primary)] flex items-center">
                <Clock className="h-3 w-3 mr-1 text-[var(--color-primary-500)]" /> {call.duration || 0} seconds
              </span>
            </div>
            <div>
              <span className="text-xs text-[var(--color-text-muted)] block">Date & Time</span>
              <span className="text-xs font-semibold text-[var(--color-text-primary)] flex items-center">
                <Calendar className="h-3 w-3 mr-1 text-[var(--color-primary-500)]" /> {new Date(call.createdAt).toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-xs text-[var(--color-text-muted)] block">Vapi Call ID</span>
              <span className="text-xs font-mono text-[var(--color-text-muted)] truncate block">{call.vapiCallId || call.id}</span>
            </div>
          </div>

          {/* AI Structured Summary Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-[var(--color-text-primary)] uppercase tracking-wider flex items-center">
              <FileText className="h-4 w-4 mr-2 text-[var(--color-primary-500)]" /> AI Call Analysis & Structured Summary
            </h3>

            <div className="p-5 rounded-xl bg-indigo-50/50 border border-indigo-100 space-y-4">
              <div>
                <span className="text-xs font-semibold uppercase text-indigo-700 block mb-1">Factual Summary</span>
                <p className="text-sm text-indigo-950 leading-relaxed font-medium">
                  {call.summary || 'Summary processing complete. Review transcript details below.'}
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-2 border-t border-indigo-100">
                <div>
                  <span className="text-xs text-indigo-600 block font-medium">Call Outcome</span>
                  <div className="mt-1">{getOutcomeBadge(call.outcome)}</div>
                </div>

                <div>
                  <span className="text-xs text-indigo-600 block font-medium">Sentiment</span>
                  <div className="mt-1">{getSentimentBadge(call.sentiment)}</div>
                </div>

                <div>
                  <span className="text-xs text-indigo-600 block font-medium">Follow-Up Required</span>
                  <div className="mt-1 text-xs font-semibold text-indigo-900 flex items-center">
                    {call.followUpRequired ? (
                      <span className="text-amber-700 flex items-center"><AlertCircle className="h-3.5 w-3.5 mr-1" /> Yes ({call.followUpReason || 'Action required'})</span>
                    ) : (
                      <span className="text-emerald-700 flex items-center"><CheckCircle2 className="h-3.5 w-3.5 mr-1" /> No</span>
                    )}
                  </div>
                </div>
              </div>

              {call.nextAction && (
                <div className="pt-2 border-t border-indigo-100">
                  <span className="text-xs font-semibold uppercase text-indigo-700 block mb-1">Recommended Next Action</span>
                  <p className="text-xs text-indigo-900 bg-white p-2.5 rounded-lg border border-indigo-200 flex items-center">
                    <ArrowRight className="h-3.5 w-3.5 mr-2 text-indigo-600 shrink-0" /> {call.nextAction}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Optional Audio Playback */}
          {call.recordingUrl && (
            <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2">
              <span className="text-xs font-semibold text-slate-300 flex items-center">
                <Play className="h-3.5 w-3.5 mr-1.5 text-emerald-400" /> Call Audio Recording
              </span>
              <audio controls src={call.recordingUrl} className="w-full h-8 rounded-lg" />
            </div>
          )}

          {/* Transcript Conversation */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-[var(--color-text-primary)] uppercase tracking-wider flex items-center">
              <Bot className="h-4 w-4 mr-2 text-[var(--color-primary-500)]" /> Complete Conversation Transcript
            </h3>

            {transcriptList.length > 0 ? (
              <div className="space-y-3 p-4 rounded-xl bg-[var(--color-bg-page)] border border-[var(--color-border-subtle)] max-h-72 overflow-y-auto">
                {transcriptList.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex items-start space-x-3 text-xs ${
                      msg.speaker === 'AI' ? 'pl-0' : 'pl-4'
                    }`}
                  >
                    <div
                      className={`p-1.5 rounded-lg shrink-0 ${
                        msg.speaker === 'AI'
                          ? 'bg-indigo-500 text-white'
                          : 'bg-emerald-500 text-white'
                      }`}
                    >
                      {msg.speaker === 'AI' ? <Bot className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
                    </div>
                    <div className="flex-1 bg-[var(--color-bg-card)] p-3 rounded-xl border border-[var(--color-border-subtle)] space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[var(--color-text-primary)]">
                          {msg.speaker === 'AI' ? 'AI Voice Assistant' : call.contactName}
                        </span>
                        {msg.timestamp && (
                          <span className="text-[10px] text-[var(--color-text-muted)]">{msg.timestamp}</span>
                        )}
                      </div>
                      <p className="text-[var(--color-text-secondary)] leading-relaxed">{msg.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-[var(--color-text-muted)] bg-[var(--color-bg-page)] rounded-xl border border-dashed border-[var(--color-border-subtle)]">
                {call.status === 'in-progress' || call.status === 'calling'
                  ? 'Call is currently in progress. Transcript will appear as speech is processed...'
                  : 'No transcript recorded for this call.'}
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[var(--color-bg-page)] border-t border-[var(--color-border-subtle)] flex items-center justify-between">
          <span className="text-xs text-[var(--color-text-muted)] flex items-center">
            <Shield className="h-3.5 w-3.5 mr-1 text-emerald-600" />
            Verified VoiceCX AI Call Record
          </span>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>

      </div>
    </div>
  );
}
