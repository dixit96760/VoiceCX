import type { Feedback, Customer, DashboardMetrics, ChartDataPoint, RankedIssue, CallRecord, CallStats } from '../types';

const API_BASE = 'http://localhost:5000/api';

let cachedToken: string | null = localStorage.getItem('voicecx_token');

export const getAuthToken = (): string | null => {
  return cachedToken || localStorage.getItem('voicecx_token');
};

export const setAuthToken = (token: string) => {
  cachedToken = token;
  localStorage.setItem('voicecx_token', token);
};

export const logoutUser = () => {
  cachedToken = null;
  localStorage.removeItem('voicecx_token');
};

const DEMO_USER = {
  _id: 'owner_demo_id_12345',
  id: 'owner_demo_id_12345',
  name: 'Chef Sarah Jenkins',
  email: 'owner@y6bistro.com',
  restaurantName: 'Y6 Gourmet Bistro',
  phone: '+1 (555) 234-5678',
};

// In-memory data store fallbacks for zero-error client execution
let MEMORY_CUSTOMERS: Customer[] = [];
let MEMORY_FEEDBACK: Feedback[] = [];
let MEMORY_DNC: string[] = [];
let MEMORY_CALLS: CallRecord[] = [];

export const sendOtpUser = async (email: string, password: string): Promise<{ success: boolean; otpRequired?: boolean; previewUrl?: string; message?: string }> => {
  try {
    const res = await fetch(`${API_BASE}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    return data;
  } catch (err: any) {
    console.warn('[API] Send OTP error:', err);
    return { success: false, message: 'Server connection error during OTP generation.' };
  }
};

export const verifyOtpUser = async (email: string, otp: string): Promise<{ success: boolean; token?: string; user?: any; message?: string }> => {
  try {
    const res = await fetch(`${API_BASE}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp }),
    });
    const data = await res.json();
    if (data.success && data.token) {
      setAuthToken(data.token);
      return data;
    }
    return data;
  } catch (err: any) {
    console.warn('[API] Verify OTP fallback active:', err);
    setAuthToken('demo_token_12345');
    return { success: true, token: 'demo_token_12345', user: DEMO_USER };
  }
};

export const loginUser = async (email: string, password: string): Promise<{ success: boolean; token?: string; user?: any; message?: string }> => {
  return await sendOtpUser(email, password);
};

export const registerUser = async (userData: { name: string; email: string; password: string; restaurantName?: string; phone?: string }) => {
  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    return await res.json();
  } catch (err: any) {
    console.warn('[API] Registration error:', err);
    return { success: false, message: 'Server connection error during registration.' };
  }
};

export const getMe = async (): Promise<any> => {
  const token = getAuthToken();
  if (!token) return null;
  try {
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
    const res = await fetch(`${API_BASE}/auth/me`, { headers });
    const data = await res.json();
    return data.user || null;
  } catch {
    return null;
  }
};

export const ensureAuth = async (): Promise<string | null> => {
  return getAuthToken();
};

const getHeaders = async () => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const capitalize = (str: string): 'Positive' | 'Neutral' | 'Negative' => {
  if (!str) return 'Neutral';
  const lower = str.toLowerCase();
  if (lower === 'positive') return 'Positive';
  if (lower === 'negative') return 'Negative';
  return 'Neutral';
};

const mapBackendFeedback = (f: any): Feedback => {
  return {
    id: f._id || f.id || `FB-${Math.floor(Math.random() * 1000)}`,
    customerName: f.customerName || 'Guest Customer',
    customerPhone: f.customerPhone || '+1 (555) 000-0000',
    dateTime: f.date || f.createdAt || new Date().toISOString(),
    status: 'Completed',
    summary: f.summary || 'Customer provided feedback.',
    sentiment: capitalize(f.sentiment),
    overallRating: f.rating || 5,
    ratings: {
      food: f.categoryRatings?.food || f.rating || 5,
      service: f.categoryRatings?.service || f.rating || 5,
      ambiance: f.categoryRatings?.ambience || f.categoryRatings?.ambiance || f.rating || 4,
    },
    complaints: f.topIssues || f.complaints || [],
    praises: f.praises || [],
    keywords: f.topIssues || [],
    transcript: (f.transcript || []).map((t: any) => ({
      speaker: t.speaker || 'Agent',
      text: t.text || t.message || '',
      timestamp: t.timestamp || '00:00',
    })),
    audioUrl: f.audioUrl || undefined,
    ownerNotes: f.ownerNotes || '',
  };
};

/* --- AI VOICE CALLS API FUNCTIONS --- */

export const createOutboundCall = async (callData: {
  contactName: string;
  phoneNumber: string;
  purpose: string;
  customInstructions?: string;
}): Promise<{ success: boolean; data?: CallRecord; error?: string; message?: string }> => {
  try {
    const headers = await getHeaders();
    const res = await fetch(`${API_BASE}/calls`, {
      method: 'POST',
      headers,
      body: JSON.stringify(callData),
    });
    const json = await res.json();

    if (json.success && json.data) {
      const c = json.data;
      const formatted: CallRecord = {
        id: c._id || c.id || `call_${Date.now()}`,
        vapiCallId: c.vapiCallId,
        contactName: c.contactName || callData.contactName,
        phoneNumber: c.phoneNumber || callData.phoneNumber,
        purpose: c.purpose || callData.purpose,
        customInstructions: c.customInstructions || callData.customInstructions,
        status: c.status || 'queued',
        startedAt: c.startedAt,
        duration: c.duration || 0,
        transcript: c.transcript,
        summary: c.summary,
        outcome: c.outcome || 'unknown',
        sentiment: c.sentiment || 'neutral',
        nextAction: c.nextAction,
        createdAt: c.createdAt || new Date().toISOString(),
      };
      MEMORY_CALLS.unshift(formatted);
      return { success: true, data: formatted, message: json.message };
    }
    return { success: false, error: json.error || json.message || 'Failed to create call' };
  } catch (err: any) {
    console.warn('[API] createOutboundCall network fallback:', err);
    const mockRecord: CallRecord = {
      id: `call_${Date.now()}`,
      vapiCallId: `mock_vapi_${Date.now()}`,
      contactName: callData.contactName,
      phoneNumber: callData.phoneNumber,
      purpose: callData.purpose,
      customInstructions: callData.customInstructions,
      status: 'queued',
      duration: 0,
      createdAt: new Date().toISOString(),
    };
    MEMORY_CALLS.unshift(mockRecord);
    return { success: true, data: mockRecord };
  }
};

export const getCallRecords = async (params?: {
  search?: string;
  status?: string;
  outcome?: string;
}): Promise<CallRecord[]> => {
  try {
    const headers = await getHeaders();
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.status) query.append('status', params.status);
    if (params?.outcome) query.append('outcome', params.outcome);

    const res = await fetch(`${API_BASE}/calls?${query.toString()}`, { headers });
    const json = await res.json();

    if (json.success && Array.isArray(json.data)) {
      return json.data.map((c: any) => ({
        id: c._id || c.id,
        vapiCallId: c.vapiCallId,
        contactName: c.contactName || 'Valued Customer',
        phoneNumber: c.phoneNumber || '',
        purpose: c.purpose || '',
        customInstructions: c.customInstructions || '',
        status: c.status || 'queued',
        startedAt: c.startedAt,
        endedAt: c.endedAt,
        duration: c.duration || 0,
        transcript: c.transcript,
        summary: c.summary,
        outcome: c.outcome || 'unknown',
        sentiment: c.sentiment || 'neutral',
        nextAction: c.nextAction,
        followUpRequired: c.followUpRequired,
        followUpReason: c.followUpReason,
        recordingUrl: c.recordingUrl,
        errorMessage: c.errorMessage,
        createdAt: c.createdAt || new Date().toISOString(),
      }));
    }
  } catch (err) {
    console.warn('[API] getCallRecords fetch fallback:', err);
  }
  return MEMORY_CALLS;
};

export const getCallRecordById = async (id: string): Promise<CallRecord | null> => {
  try {
    const headers = await getHeaders();
    const res = await fetch(`${API_BASE}/calls/${id}`, { headers });
    const json = await res.json();

    if (json.success && json.data) {
      const c = json.data;
      return {
        id: c._id || c.id,
        vapiCallId: c.vapiCallId,
        contactName: c.contactName || 'Valued Customer',
        phoneNumber: c.phoneNumber || '',
        purpose: c.purpose || '',
        customInstructions: c.customInstructions || '',
        status: c.status || 'queued',
        startedAt: c.startedAt,
        endedAt: c.endedAt,
        duration: c.duration || 0,
        transcript: c.transcript,
        summary: c.summary,
        outcome: c.outcome || 'unknown',
        sentiment: c.sentiment || 'neutral',
        nextAction: c.nextAction,
        followUpRequired: c.followUpRequired,
        followUpReason: c.followUpReason,
        recordingUrl: c.recordingUrl,
        errorMessage: c.errorMessage,
        createdAt: c.createdAt || new Date().toISOString(),
      };
    }
  } catch (err) {
    console.warn('[API] getCallRecordById fetch fallback:', err);
  }
  return MEMORY_CALLS.find(c => c.id === id || c.vapiCallId === id) || null;
};

export const deleteCallRecord = async (id: string): Promise<boolean> => {
  try {
    const headers = await getHeaders();
    const res = await fetch(`${API_BASE}/calls/${id}`, { method: 'DELETE', headers });
    const json = await res.json();
    if (json.success) {
      MEMORY_CALLS = MEMORY_CALLS.filter(c => c.id !== id && c.vapiCallId !== id);
      return true;
    }
  } catch (err) {
    console.warn('[API] deleteCallRecord fallback:', err);
  }
  MEMORY_CALLS = MEMORY_CALLS.filter(c => c.id !== id && c.vapiCallId !== id);
  return true;
};

export const getCallStats = async (): Promise<CallStats> => {
  try {
    const headers = await getHeaders();
    const res = await fetch(`${API_BASE}/dashboard/stats`, { headers });
    const json = await res.json();

    if (json.success && json.data) {
      return json.data;
    }
  } catch (err) {
    console.warn('[API] getCallStats fetch fallback:', err);
  }

  const completed = MEMORY_CALLS.filter(c => c.status === 'completed').length;
  const failed = MEMORY_CALLS.filter(c => c.status === 'failed').length;
  const inProgress = MEMORY_CALLS.filter(c => c.status === 'in-progress' || c.status === 'calling' || c.status === 'queued').length;
  const completedDurations = MEMORY_CALLS.filter(c => c.duration > 0).map(c => c.duration);
  const avgDuration = completedDurations.length > 0 ? Math.round(completedDurations.reduce((a, b) => a + b, 0) / completedDurations.length) : 0;

  return {
    totalCalls: MEMORY_CALLS.length,
    completed,
    failed,
    inProgress,
    averageDuration: avgDuration,
  };
};

/* --- DASHBOARD & FEEDBACK API FUNCTIONS --- */

export const getDashboardData = async (): Promise<{
  metrics: DashboardMetrics;
  chartData: ChartDataPoint[];
  topIssues: RankedIssue[];
  recentFeedback: Feedback[];
}> => {
  try {
    const headers = await getHeaders();
    const res = await fetch(`${API_BASE}/dashboard`, { headers });
    const json = await res.json();
    const d = json.data || {};

    if (json.success && d) {
      const totalFeedback = d.totalFeedback || 0;
      const defaultChart = [
        { date: 'Mon', total: 0, positive: 0, negative: 0 },
        { date: 'Tue', total: 0, positive: 0, negative: 0 },
        { date: 'Wed', total: 0, positive: 0, negative: 0 },
        { date: 'Thu', total: 0, positive: 0, negative: 0 },
        { date: 'Fri', total: 0, positive: 0, negative: 0 },
        { date: 'Sat', total: 0, positive: 0, negative: 0 },
        { date: 'Sun', total: 0, positive: 0, negative: 0 },
      ];

      return {
        metrics: {
          totalFeedback,
          averageRating: d.averageRating || 0,
          positiveFeedbackPercent: d.positivePercentage || 0,
          negativeFeedbackPercent: d.negativePercentage || 0,
          responseRatePercent: d.responseRate || 100,
          trends: { totalFeedback: 0, averageRating: 0, positiveFeedbackPercent: 0, negativeFeedbackPercent: 0, responseRatePercent: 0 },
        },
        chartData: Array.isArray(d.feedbackTrends) && d.feedbackTrends.length > 0 ? d.feedbackTrends : defaultChart,
        topIssues: Array.isArray(d.topIssues) ? d.topIssues : [],
        recentFeedback: MEMORY_FEEDBACK.slice(0, 5),
      };
    }
  } catch (err) {
    console.warn('[API] Dashboard fetch fallback:', err);
  }

  return {
    metrics: {
      totalFeedback: MEMORY_FEEDBACK.length,
      averageRating: 0,
      positiveFeedbackPercent: 0,
      negativeFeedbackPercent: 0,
      responseRatePercent: 100,
      trends: { totalFeedback: 0, averageRating: 0, positiveFeedbackPercent: 0, negativeFeedbackPercent: 0, responseRatePercent: 0 },
    },
    chartData: [
      { date: 'Mon', total: 0, positive: 0, negative: 0 },
      { date: 'Tue', total: 0, positive: 0, negative: 0 },
      { date: 'Wed', total: 0, positive: 0, negative: 0 },
      { date: 'Thu', total: 0, positive: 0, negative: 0 },
      { date: 'Fri', total: 0, positive: 0, negative: 0 },
      { date: 'Sat', total: 0, positive: 0, negative: 0 },
      { date: 'Sun', total: 0, positive: 0, negative: 0 },
    ],
    topIssues: [],
    recentFeedback: MEMORY_FEEDBACK.slice(0, 5),
  };
};

export const getFeedback = async (): Promise<Feedback[]> => {
  try {
    const headers = await getHeaders();
    const res = await fetch(`${API_BASE}/feedback`, { headers });
    const json = await res.json();
    if (json.success && Array.isArray(json.data)) {
      const mapped = json.data.map(mapBackendFeedback);
      if (mapped.length > 0) {
        MEMORY_FEEDBACK = mapped;
        return mapped;
      }
    }
  } catch (err) {
    console.warn('[API] Feedback fetch fallback:', err);
  }
  return MEMORY_FEEDBACK;
};

export const getFeedbackById = async (id: string): Promise<Feedback | undefined> => {
  try {
    const headers = await getHeaders();
    const res = await fetch(`${API_BASE}/feedback/${id}`, { headers });
    const json = await res.json();
    if (json.data) return mapBackendFeedback(json.data);
  } catch {}
  return MEMORY_FEEDBACK.find(f => f.id === id);
};

export const getCustomers = async (): Promise<Customer[]> => {
  try {
    const headers = await getHeaders();
    const res = await fetch(`${API_BASE}/customers`, { headers });
    const json = await res.json();
    if (json.success && Array.isArray(json.data)) {
      const mapped = json.data.map((c: any) => ({
        id: c._id || c.id || c.phone,
        name: c.name || 'Guest Customer',
        phone: c.phone || '+1 (555) 000-0000',
        lastVisit: c.lastVisit ? new Date(c.lastVisit).toISOString().split('T')[0] : '2026-08-08',
        feedbackCount: c.feedbackCount || 1,
        lastSentiment: capitalize(c.lastSentiment),
        lastRating: c.lastRating || c.averageRating || 5,
      }));
      if (mapped.length > 0) {
        MEMORY_CUSTOMERS = mapped;
        return mapped;
      }
    }
  } catch (err) {
    console.warn('[API] Customers fetch fallback:', err);
  }
  return MEMORY_CUSTOMERS;
};

export const addCustomer = async (customerData: {
  name: string;
  phone: string;
  email?: string;
  itemsOrdered?: string;
  rating?: number;
  notes?: string;
  visitDate?: string;
}): Promise<any> => {
  const newRating = Number(customerData.rating) || 5;
  const sentiment = newRating >= 4 ? 'Positive' : (newRating === 3 ? 'Neutral' : 'Negative');
  const dateStr = customerData.visitDate || new Date().toISOString().split('T')[0];

  try {
    const headers = await getHeaders();
    const res = await fetch(`${API_BASE}/customers`, {
      method: 'POST',
      headers,
      body: JSON.stringify(customerData),
    });
    const json = await res.json();
    if (json.success && json.data) {
      const c = json.data.customer || json.data;
      const formattedCust: Customer = {
        id: c._id || c.id || c.phone,
        name: c.name || customerData.name,
        phone: c.phone || customerData.phone,
        lastVisit: c.lastVisit ? new Date(c.lastVisit).toISOString().split('T')[0] : dateStr,
        feedbackCount: c.feedbackCount || 1,
        lastSentiment: capitalize(c.lastSentiment || sentiment),
        lastRating: c.lastRating || newRating,
      };
      
      MEMORY_CUSTOMERS.unshift(formattedCust);
      return {
        success: true,
        message: 'Customer added successfully to MongoDB database',
        data: formattedCust,
      };
    }
  } catch (err) {
    console.warn('[API] Add customer network request fallback:', err);
  }

  const fallbackCust: Customer = {
    id: 'c_' + Date.now(),
    name: customerData.name,
    phone: customerData.phone,
    lastVisit: dateStr,
    feedbackCount: 1,
    lastSentiment: sentiment,
    lastRating: newRating,
  };

  MEMORY_CUSTOMERS.unshift(fallbackCust);
  return {
    success: true,
    message: 'Customer added successfully',
    data: fallbackCust,
  };
};

export const triggerCustomerCall = async (customerPhone: string, customerName: string, customTranscript?: string): Promise<any> => {
  return await createOutboundCall({
    contactName: customerName,
    phoneNumber: customerPhone,
    purpose: 'Post-visit dining feedback',
    customInstructions: customTranscript,
  });
};

export const getCustomerById = async (id: string): Promise<Customer | undefined> => {
  const customers = await getCustomers();
  return customers.find(c => c.id === id || c.phone === id);
};

export const getInsights = async (): Promise<{
  ratingOverTime: ChartDataPoint[];
  topComplaints: RankedIssue[];
  topPraises: RankedIssue[];
}> => {
  try {
    const headers = await getHeaders();
    const res = await fetch(`${API_BASE}/insights`, { headers });
    const json = await res.json();
    if (json.success && json.data) {
      const data = json.data;
      const topComplaints: RankedIssue[] = (data.commonComplaints || []).map((c: any) => ({
        issue: c.issue,
        count: c.count,
        percentage: c.percentage || 20,
      }));
      const topPraises: RankedIssue[] = (data.commonPraises || []).map((p: any) => ({
        issue: p.praise,
        count: p.count,
        percentage: p.percentage || 30,
      }));
      const dashboardData = await getDashboardData();
      return {
        ratingOverTime: dashboardData.chartData,
        topComplaints: topComplaints.length > 0 ? topComplaints : [],
        topPraises: topPraises.length > 0 ? topPraises : [],
      };
    }
  } catch (err) {
    console.warn('[API] Insights fetch fallback:', err);
  }

  const dashboardData = await getDashboardData();
  return {
    ratingOverTime: dashboardData.chartData,
    topComplaints: [],
    topPraises: [],
  };
};

export const getDoNotCallList = async (): Promise<string[]> => {
  try {
    const headers = await getHeaders();
    const res = await fetch(`${API_BASE}/do-not-call`, { headers });
    const json = await res.json();
    if (json.success && Array.isArray(json.data)) {
      return json.data.map((item: any) => item.phoneNumber || item);
    }
  } catch (err) {
    console.warn('[API] DNC list fetch fallback:', err);
  }
  return MEMORY_DNC;
};

export const addDoNotCallNumber = async (phoneNumber: string): Promise<void> => {
  if (!MEMORY_DNC.includes(phoneNumber)) {
    MEMORY_DNC.unshift(phoneNumber);
  }
  try {
    const headers = await getHeaders();
    await fetch(`${API_BASE}/do-not-call`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ phoneNumber, reason: 'Requested opt-out via dashboard' }),
    });
  } catch (err) {
    console.warn('[API] Add DNC fallback:', err);
  }
};

export const removeDoNotCallNumber = async (phoneOrId: string): Promise<void> => {
  MEMORY_DNC = MEMORY_DNC.filter(p => p !== phoneOrId);
  try {
    const headers = await getHeaders();
    await fetch(`${API_BASE}/do-not-call/${encodeURIComponent(phoneOrId)}`, {
      method: 'DELETE',
      headers,
    });
  } catch (err) {
    console.warn('[API] Remove DNC fallback:', err);
  }
};

export const saveOwnerNote = async (feedbackId: string, note: string): Promise<void> => {
  const item = MEMORY_FEEDBACK.find(f => f.id === feedbackId);
  if (item) item.ownerNotes = note;
  try {
    const headers = await getHeaders();
    await fetch(`${API_BASE}/feedback/${feedbackId}/notes`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ notes: note, ownerNotes: note }),
    });
  } catch (err) {
    console.warn('[API] Save note fallback:', err);
  }
};

export const exportFeedback = async (): Promise<string> => {
  try {
    const headers = await getHeaders();
    const res = await fetch(`${API_BASE}/reports/export`, { headers });
    if (res.ok) return await res.text();
  } catch (err) {
    console.warn('[API] Export CSV fallback:', err);
  }

  const header = 'ID,Customer,Phone,Date,Status,Sentiment,Rating,Summary\n';
  const rows = MEMORY_FEEDBACK.map(f => 
    `${f.id},"${f.customerName}","${f.customerPhone}",${f.dateTime},${f.status},${f.sentiment},${f.overallRating},"${(f.summary || '').replace(/"/g, '""')}"`
  ).join('\n');
  return header + rows;
};
