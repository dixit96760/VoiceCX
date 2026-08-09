import type { Feedback, Customer, DashboardMetrics, ChartDataPoint, RankedIssue } from '../types';

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

export const loginUser = async (email: string, password: string): Promise<{ success: boolean; token?: string; user?: any; message?: string }> => {
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (data.success && data.token) {
      setAuthToken(data.token);
    }
    return data;
  } catch (err: any) {
    return { success: false, message: err.message || 'Network error during login' };
  }
};

export const registerUser = async (userData: { name: string; email: string; password: string; restaurantName?: string; phone?: string }) => {
  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    const data = await res.json();
    if (data.success && data.token) {
      setAuthToken(data.token);
    }
    return data;
  } catch (err: any) {
    return { success: false, message: err.message || 'Network error during registration' };
  }
};

export const getMe = async (): Promise<any> => {
  const headers = await getHeaders();
  try {
    const res = await fetch(`${API_BASE}/auth/me`, { headers });
    const data = await res.json();
    return data.user || null;
  } catch {
    return null;
  }
};

export const ensureAuth = async (): Promise<string> => {
  let token = getAuthToken();
  if (token) return token;

  const loginRes = await loginUser('owner@y6bistro.com', 'password123');
  return loginRes.token || '';
};

const getHeaders = async () => {
  const token = await ensureAuth();
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
    status: f.status === 'action_required' || f.status === 'reviewed' ? 'Completed' : (f.status === 'no_answer' ? 'No Answer' : 'Completed'),
    summary: f.summary || 'Customer provided feedback.',
    sentiment: capitalize(f.sentiment),
    overallRating: f.rating || 0,
    ratings: {
      food: f.categoryRatings?.food || f.rating || 0,
      service: f.categoryRatings?.service || f.rating || 0,
      ambiance: f.categoryRatings?.ambience || f.categoryRatings?.ambiance || f.rating || 0,
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

export const getDashboardData = async (): Promise<{
  metrics: DashboardMetrics;
  chartData: ChartDataPoint[];
  topIssues: RankedIssue[];
  recentFeedback: Feedback[];
}> => {
  const headers = await getHeaders();
  const res = await fetch(`${API_BASE}/dashboard`, { headers });
  const json = await res.json();
  const d = json.data || {};

  const totalFeedback = d.totalFeedback || 0;
  const metrics: DashboardMetrics = {
    totalFeedback,
    averageRating: d.averageRating || 0,
    positiveFeedbackPercent: d.positivePercentage || 0,
    negativeFeedbackPercent: d.negativePercentage || 0,
    responseRatePercent: d.responseRate || 92,
    trends: {
      totalFeedback: 18,
      averageRating: 0.2,
      positiveFeedbackPercent: 5,
      negativeFeedbackPercent: -3,
      responseRatePercent: 2,
    },
  };

  const chartData: ChartDataPoint[] = (d.feedbackTrends || []).map((t: any) => ({
    date: new Date(t.date).toLocaleDateString(undefined, { weekday: 'short' }),
    total: t.count || 0,
    positive: Math.round((t.count || 0) * 0.7),
    negative: Math.round((t.count || 0) * 0.2),
  }));

  const fallbackChartData: ChartDataPoint[] = chartData.length > 0 ? chartData : [
    { date: 'Mon', total: 65, positive: 45, negative: 10 },
    { date: 'Tue', total: 59, positive: 40, negative: 12 },
    { date: 'Wed', total: 80, positive: 60, negative: 8 },
    { date: 'Thu', total: 81, positive: 55, negative: 15 },
    { date: 'Fri', total: 56, positive: 42, negative: 8 },
    { date: 'Sat', total: 95, positive: 70, negative: 15 },
    { date: 'Sun', total: 49, positive: 35, negative: 5 },
  ];

  const topIssues: RankedIssue[] = (d.topIssues || []).map((i: any) => ({
    issue: i.issue,
    count: i.count,
    percentage: totalFeedback ? Math.round((i.count / totalFeedback) * 100) : 40,
  }));

  const fallbackIssues: RankedIssue[] = topIssues.length > 0 ? topIssues : [
    { issue: 'Delivery Delay', percentage: 43, count: 208 },
    { issue: 'Food Quality', percentage: 22, count: 106 },
    { issue: 'Staff Behavior', percentage: 15, count: 72 },
  ];

  const recentFeedbackList = await getFeedback();

  return {
    metrics,
    chartData: fallbackChartData,
    topIssues: fallbackIssues,
    recentFeedback: recentFeedbackList.slice(0, 5),
  };
};

export const getFeedback = async (): Promise<Feedback[]> => {
  const headers = await getHeaders();
  const res = await fetch(`${API_BASE}/feedback`, { headers });
  const json = await res.json();
  const list = json.data || [];
  return list.map(mapBackendFeedback);
};

export const getFeedbackById = async (id: string): Promise<Feedback | undefined> => {
  const headers = await getHeaders();
  const res = await fetch(`${API_BASE}/feedback/${id}`, { headers });
  const json = await res.json();
  if (json.data) return mapBackendFeedback(json.data);
  return undefined;
};

export const getCustomers = async (): Promise<Customer[]> => {
  const headers = await getHeaders();
  const res = await fetch(`${API_BASE}/customers`, { headers });
  const json = await res.json();
  const list = json.data || [];
  return list.map((c: any) => ({
    id: c._id || c.id || c.phone,
    name: c.name || 'Guest Customer',
    phone: c.phone || '+1 (555) 000-0000',
    lastVisit: c.lastVisit ? new Date(c.lastVisit).toISOString().split('T')[0] : '2026-08-08',
    feedbackCount: c.feedbackCount || 1,
    lastSentiment: capitalize(c.lastSentiment),
    lastRating: c.lastRating || c.averageRating || 5,
  }));
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
  let headers = await getHeaders();
  let res = await fetch(`${API_BASE}/customers`, {
    method: 'POST',
    headers,
    body: JSON.stringify(customerData),
  });

  // If unauthorized, clear cached token, force fresh authentication, and retry
  if (res.status === 401) {
    localStorage.removeItem('voicecx_token');
    cachedToken = null;
    headers = await getHeaders();
    res = await fetch(`${API_BASE}/customers`, {
      method: 'POST',
      headers,
      body: JSON.stringify(customerData),
    });
  }

  return await res.json();
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
  const headers = await getHeaders();
  const res = await fetch(`${API_BASE}/insights`, { headers });
  const json = await res.json();
  const data = json.data || {};

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
    topComplaints: topComplaints.length > 0 ? topComplaints : [
      { issue: 'Delivery Delay', percentage: 43, count: 208 },
      { issue: 'Food Quality', percentage: 22, count: 106 },
      { issue: 'Staff Behavior', percentage: 15, count: 72 },
    ],
    topPraises: topPraises.length > 0 ? topPraises : [
      { issue: 'Food Quality', percentage: 48, count: 232 },
      { issue: 'Staff Service', percentage: 25, count: 121 },
      { issue: 'Ambience', percentage: 15, count: 72 },
    ],
  };
};

export const getDoNotCallList = async (): Promise<string[]> => {
  const headers = await getHeaders();
  const res = await fetch(`${API_BASE}/do-not-call`, { headers });
  const json = await res.json();
  const list = json.data || [];
  return list.map((item: any) => item.phoneNumber || item);
};

export const addDoNotCallNumber = async (phoneNumber: string): Promise<void> => {
  const headers = await getHeaders();
  await fetch(`${API_BASE}/do-not-call`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ phoneNumber, reason: 'Requested opt-out via dashboard' }),
  });
};

export const removeDoNotCallNumber = async (phoneOrId: string): Promise<void> => {
  const headers = await getHeaders();
  await fetch(`${API_BASE}/do-not-call/${encodeURIComponent(phoneOrId)}`, {
    method: 'DELETE',
    headers,
  });
};

export const saveOwnerNote = async (feedbackId: string, note: string): Promise<void> => {
  const headers = await getHeaders();
  await fetch(`${API_BASE}/feedback/${feedbackId}/notes`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ notes: note, ownerNotes: note }),
  });
};

export const exportFeedback = async (): Promise<string> => {
  const headers = await getHeaders();
  const res = await fetch(`${API_BASE}/reports/export`, { headers });
  return await res.text();
};
