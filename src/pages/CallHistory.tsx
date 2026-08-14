import React, { useState, useEffect } from 'react';
import { Header } from '../components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { CallDetailsModal } from '../components/CallDetailsModal';
import { PhoneCall, Play, Clock, CheckCircle2, XCircle, Loader2, Search, Filter, RefreshCw, Eye, AlertCircle, Plus, ShieldCheck } from 'lucide-react';
import { createOutboundCall, getCallRecords, getCallStats } from '../services/api';
import type { CallRecord, CallStats } from '../types';

export function CallHistory() {
  // Call Creation Form State
  const [contactName, setContactName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [purpose, setPurpose] = useState('Follow up regarding customer dining feedback');
  const [customInstructions, setCustomInstructions] = useState('');
  const [creatingCall, setCreatingCall] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Call History State
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [stats, setStats] = useState<CallStats>({
    totalCalls: 0,
    completed: 0,
    failed: 0,
    inProgress: 0,
    averageDuration: 0,
  });

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [outcomeFilter, setOutcomeFilter] = useState('all');
  const [selectedCall, setSelectedCall] = useState<CallRecord | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Load call records and stats
  const fetchData = async () => {
    try {
      const [records, statsData] = await Promise.all([
        getCallRecords({ search, status: statusFilter, outcome: outcomeFilter }),
        getCallStats(),
      ]);
      setCalls(records);
      setStats(statsData);
    } catch (err) {
      console.warn('[CallHistory] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, statusFilter, outcomeFilter]);

  // Real-time polling every 4 seconds if any call is active/queued
  useEffect(() => {
    const hasActiveCalls = calls.some(c => c.status === 'queued' || c.status === 'calling' || c.status === 'in-progress');
    let interval: any = null;
    if (hasActiveCalls || calls.length === 0) {
      interval = setInterval(() => {
        fetchData();
      }, 4000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [calls]);

  const handleStartCall = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!phoneNumber.trim()) {
      setFormError('Please enter a valid phone number.');
      return;
    }

    setCreatingCall(true);

    try {
      const res = await createOutboundCall({
        contactName: contactName.trim() || 'Valued Customer',
        phoneNumber: phoneNumber.trim(),
        purpose: purpose.trim() || 'Follow up inquiry',
        customInstructions: customInstructions.trim(),
      });

      if (res.success && res.data) {
        setFormSuccess(res.message || `AI Call initiated successfully to ${res.data.contactName}!`);
        setContactName('');
        setPhoneNumber('');
        setCustomInstructions('');
        fetchData();
      } else {
        setFormError(res.error || 'Failed to start AI call.');
      }
    } catch (err: any) {
      setFormError(err.message || 'Error starting call.');
    } finally {
      setCreatingCall(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">Completed</span>;
      case 'in-progress':
      case 'calling':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200 animate-pulse flex items-center inline-flex"><Loader2 className="h-3 w-3 mr-1 animate-spin" /> In Progress</span>;
      case 'queued':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">Queued</span>;
      case 'failed':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">Failed</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  const getOutcomeBadge = (outcome?: string) => {
    switch (outcome) {
      case 'positive':
      case 'interested':
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">Interested</span>;
      case 'negative':
      case 'not_interested':
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200">Not Interested</span>;
      case 'callback_requested':
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-200">Callback</span>;
      default:
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-gray-100 text-gray-600">Completed</span>;
    }
  };

  return (
    <div className="flex flex-col space-y-6">
      <Header
        title="AI Voice Calling Dashboard"
        description="Initiate Vapi AI outbound phone calls, track live status, and inspect AI summaries."
      />

      {/* KPI Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Total Calls</p>
              <h3 className="text-2xl font-bold text-[var(--color-text-primary)] mt-1">{stats.totalCalls}</h3>
            </div>
            <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600">
              <PhoneCall className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Completed</p>
              <h3 className="text-2xl font-bold text-emerald-600 mt-1">{stats.completed}</h3>
            </div>
            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">In Progress</p>
              <h3 className="text-2xl font-bold text-amber-600 mt-1">{stats.inProgress}</h3>
            </div>
            <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-amber-600">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Failed</p>
              <h3 className="text-2xl font-bold text-rose-600 mt-1">{stats.failed}</h3>
            </div>
            <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600">
              <XCircle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Avg Duration</p>
              <h3 className="text-2xl font-bold text-[var(--color-text-primary)] mt-1">{stats.averageDuration}s</h3>
            </div>
            <div className="p-3 bg-purple-50 border border-purple-100 rounded-xl text-purple-600">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Start Call Panel & History Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        
        {/* Start Call Panel */}
        <Card className="lg:col-span-1 border-t-4 border-t-[var(--color-primary-500)] shadow-md">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center">
              <Plus className="h-4 w-4 mr-2 text-[var(--color-primary-500)]" /> Start Outbound AI Call
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleStartCall} className="space-y-4">
              {formError && (
                <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-xs font-medium border border-rose-200 flex items-start">
                  <AlertCircle className="h-4 w-4 mr-1.5 shrink-0 mt-0.5 text-rose-600" />
                  <span>{formError}</span>
                </div>
              )}

              {formSuccess && (
                <div className="p-3 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-medium border border-emerald-200 flex items-start">
                  <CheckCircle2 className="h-4 w-4 mr-1.5 shrink-0 mt-0.5 text-emerald-600" />
                  <span>{formSuccess}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
                  Contact Name
                </label>
                <Input
                  placeholder="e.g. Gordon Ramsay"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
                  Phone Number <span className="text-rose-500">*</span>
                </label>
                <Input
                  placeholder="e.g. +919876543210 or +14155552671"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                />
                <span className="text-[10px] text-[var(--color-text-muted)] block">E.164 format with country code</span>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
                  Call Purpose
                </label>
                <Input
                  placeholder="e.g. Follow up on dinner experience"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
                  Custom Instructions (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Ask if they would like to book a table for this weekend"
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-page)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]/20"
                />
              </div>

              <Button
                type="submit"
                disabled={creatingCall}
                className="w-full bg-[var(--color-primary-500)] hover:bg-indigo-700 flex items-center justify-center space-x-2"
              >
                {creatingCall ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Queuing AI Call...</span>
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    <span>START AI CALL</span>
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Call History Table */}
        <Card className="lg:col-span-2 shadow-md">
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 gap-4">
            <CardTitle className="text-base font-bold flex items-center">
              <Clock className="h-4 w-4 mr-2 text-[var(--color-primary-500)]" /> Call History & Live Tracking
            </CardTitle>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <Button size="sm" variant="secondary" onClick={fetchData} className="shrink-0">
                <RefreshCw className="h-3.5 w-3.5 mr-1" /> Refresh
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            
            {/* Search & Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-2.5 text-[var(--color-text-muted)]" />
                <input
                  type="text"
                  placeholder="Search contact, phone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-page)] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary-500)]"
                />
              </div>

              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full py-1.5 px-2.5 text-xs rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-page)] text-[var(--color-text-primary)]"
                >
                  <option value="all">All Statuses</option>
                  <option value="queued">Queued</option>
                  <option value="calling">Calling / Ringing</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                </select>
              </div>

              <div>
                <select
                  value={outcomeFilter}
                  onChange={(e) => setOutcomeFilter(e.target.value)}
                  className="w-full py-1.5 px-2.5 text-xs rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-page)] text-[var(--color-text-primary)]"
                >
                  <option value="all">All Outcomes</option>
                  <option value="positive">Interested / Positive</option>
                  <option value="negative">Not Interested</option>
                  <option value="callback_requested">Callback Requested</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-[var(--color-border-subtle)]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--color-bg-page)] text-[var(--color-text-secondary)] font-semibold border-b border-[var(--color-border-subtle)]">
                  <tr>
                    <th className="p-3">Contact</th>
                    <th className="p-3">Phone</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Duration</th>
                    <th className="p-3">Outcome</th>
                    <th className="p-3">Date</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border-subtle)]">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-[var(--color-text-muted)]">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-[var(--color-primary-500)]" />
                        Loading call logs...
                      </td>
                    </tr>
                  ) : calls.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-[var(--color-text-muted)]">
                        <PhoneCall className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                        <p className="font-semibold text-sm">No calls found</p>
                        <p className="text-xs">Use the panel on the left to start your first AI outbound call.</p>
                      </td>
                    </tr>
                  ) : (
                    calls.map((c) => (
                      <tr
                        key={c.id || c.vapiCallId}
                        onClick={() => { setSelectedCall(c); setModalOpen(true); }}
                        className="hover:bg-[var(--color-bg-page)]/80 cursor-pointer transition-colors"
                      >
                        <td className="p-3 font-semibold text-[var(--color-text-primary)]">
                          {c.contactName}
                        </td>
                        <td className="p-3 font-mono text-[var(--color-text-muted)]">
                          {c.phoneNumber}
                        </td>
                        <td className="p-3">
                          {getStatusBadge(c.status)}
                        </td>
                        <td className="p-3 text-[var(--color-text-secondary)]">
                          {c.duration ? `${c.duration}s` : '0s'}
                        </td>
                        <td className="p-3">
                          {getOutcomeBadge(c.outcome)}
                        </td>
                        <td className="p-3 text-[var(--color-text-muted)]">
                          {new Date(c.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCall(c);
                              setModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-[var(--color-primary-500)] hover:bg-indigo-50 transition-colors inline-flex items-center font-medium"
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" /> View
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

          </CardContent>
        </Card>
      </div>

      {/* Call Details Modal */}
      <CallDetailsModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        call={selectedCall}
      />
    </div>
  );
}
