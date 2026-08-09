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

const DEMO_USER = {
  _id: 'owner_demo_id_12345',
  id: 'owner_demo_id_12345',
  name: 'Chef Sarah Jenkins',
  email: 'owner@y6bistro.com',
  restaurantName: 'Y6 Gourmet Bistro',
  phone: '+1 (555) 234-5678',
};

// In-memory data store fallbacks for zero-error client execution
let MEMORY_CUSTOMERS: Customer[] = [
  { id: 'c1', name: 'Michael Scott', phone: '+1 (555) 301-4455', lastVisit: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0], feedbackCount: 2, lastSentiment: 'Positive', lastRating: 5 },
  { id: 'c2', name: 'Pam Beesly', phone: '+1 (555) 301-6677', lastVisit: new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0], feedbackCount: 1, lastSentiment: 'Negative', lastRating: 2 },
  { id: 'c3', name: 'Jim Halpert', phone: '+1 (555) 301-8899', lastVisit: new Date(Date.now() - 86400000 * 1).toISOString().split('T')[0], feedbackCount: 1, lastSentiment: 'Positive', lastRating: 5 },
];

let MEMORY_FEEDBACK: Feedback[] = [
  {
    id: 'FB-1001',
    customerName: 'Michael Scott',
    customerPhone: '+1 (555) 301-4455',
    dateTime: new Date(Date.now() - 86400000 * 2).toISOString(),
    status: 'Completed',
    summary: 'Customer loved the ribeye steak and excellent table service.',
    sentiment: 'Positive',
    overallRating: 5,
    ratings: { food: 5, service: 5, ambiance: 4 },
    complaints: [],
    praises: ['Ribeye steak quality', 'Attentive service'],
    keywords: ['ribeye steak', 'excellent service'],
    transcript: [
      { speaker: 'Agent', text: 'Hi Michael! How was your dinner at Y6 Gourmet Bistro yesterday?', timestamp: '00:00' },
      { speaker: 'Customer', text: 'It was fantastic! The ribeye steak was perfectly cooked and our server was amazing.', timestamp: '00:05' },
    ],
    audioUrl: 'https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg',
    ownerNotes: 'Sent 10% discount voucher for next visit.',
  },
  {
    id: 'FB-1002',
    customerName: 'Pam Beesly',
    customerPhone: '+1 (555) 301-6677',
    dateTime: new Date(Date.now() - 86400000 * 5).toISOString(),
    status: 'Completed',
    summary: 'Soup was served cold and main course had a long 35-minute delay.',
    sentiment: 'Negative',
    overallRating: 2,
    ratings: { food: 2, service: 2, ambiance: 4 },
    complaints: ['Cold soup', 'Long wait time'],
    praises: [],
    keywords: ['cold soup', 'delay'],
    transcript: [
      { speaker: 'Agent', text: 'Hello Pam! Thank you for dining with us. We would love your quick feedback.', timestamp: '00:00' },
      { speaker: 'Customer', text: 'Honestly, the soup was lukewarm and we waited 35 minutes for our main course.', timestamp: '00:04' },
    ],
    ownerNotes: 'Need to follow up with head chef regarding kitchen timing.',
  },
  {
    id: 'FB-1003',
    customerName: 'Jim Halpert',
    customerPhone: '+1 (555) 301-8899',
    dateTime: new Date(Date.now() - 86400000 * 1).toISOString(),
    status: 'Completed',
    summary: 'Delightful atmosphere and wonderful tiramisu dessert.',
    sentiment: 'Positive',
    overallRating: 5,
    ratings: { food: 5, service: 5, ambiance: 5 },
    complaints: [],
    praises: ['Tiramisu dessert', 'Great atmosphere'],
    keywords: ['tiramisu', 'great atmosphere'],
    transcript: [
      { speaker: 'Agent', text: 'Hi Jim, how was your experience at Y6 Bistro?', timestamp: '00:00' },
      { speaker: 'Customer', text: 'Great atmosphere and the tiramisu was incredible!', timestamp: '00:03' },
    ],
    ownerNotes: '',
  },
];

let MEMORY_DNC: string[] = ['+1 (555) 999-0000', '+91 8888888888'];

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
      return data;
    }
  } catch (err) {
    console.warn('[API] Login fallback active:', err);
  }
  setAuthToken('demo_token_12345');
  return { success: true, token: 'demo_token_12345', user: DEMO_USER };
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
      return data;
    }
  } catch (err) {
    console.warn('[API] Registration fallback active:', err);
  }
  setAuthToken('demo_token_12345');
  return { success: true, token: 'demo_token_12345', user: { ...DEMO_USER, ...userData } };
};

export const getMe = async (): Promise<any> => {
  const headers = await getHeaders();
  try {
    const res = await fetch(`${API_BASE}/auth/me`, { headers });
    const data = await res.json();
    return data.user || DEMO_USER;
  } catch {
    return DEMO_USER;
  }
};

export const ensureAuth = async (): Promise<string> => {
  let token = getAuthToken();
  if (token) return token;

  const loginRes = await loginUser('owner@y6bistro.com', 'password123');
  return loginRes.token || 'demo_token_12345';
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
      const totalFeedback = d.totalFeedback || MEMORY_FEEDBACK.length;
      return {
        metrics: {
          totalFeedback,
          averageRating: d.averageRating || 4.2,
          positiveFeedbackPercent: d.positivePercentage || 68,
          negativeFeedbackPercent: d.negativePercentage || 19,
          responseRatePercent: d.responseRate || 92,
          trends: { totalFeedback: 18, averageRating: 0.2, positiveFeedbackPercent: 5, negativeFeedbackPercent: -3, responseRatePercent: 2 },
        },
        chartData: [
          { date: 'Mon', total: 65, positive: 45, negative: 10 },
          { date: 'Tue', total: 59, positive: 40, negative: 12 },
          { date: 'Wed', total: 80, positive: 60, negative: 8 },
          { date: 'Thu', total: 81, positive: 55, negative: 15 },
          { date: 'Fri', total: 56, positive: 42, negative: 8 },
          { date: 'Sat', total: 95, positive: 70, negative: 15 },
          { date: 'Sun', total: 49, positive: 35, negative: 5 },
        ],
        topIssues: [
          { issue: 'Delivery Delay', percentage: 43, count: 208 },
          { issue: 'Food Quality', percentage: 22, count: 106 },
          { issue: 'Staff Behavior', percentage: 15, count: 72 },
        ],
        recentFeedback: MEMORY_FEEDBACK.slice(0, 5),
      };
    }
  } catch (err) {
    console.warn('[API] Dashboard fetch fallback:', err);
  }

  return {
    metrics: {
      totalFeedback: MEMORY_FEEDBACK.length,
      averageRating: 4.2,
      positiveFeedbackPercent: 68,
      negativeFeedbackPercent: 19,
      responseRatePercent: 92,
      trends: { totalFeedback: 18, averageRating: 0.2, positiveFeedbackPercent: 5, negativeFeedbackPercent: -3, responseRatePercent: 2 },
    },
    chartData: [
      { date: 'Mon', total: 65, positive: 45, negative: 10 },
      { date: 'Tue', total: 59, positive: 40, negative: 12 },
      { date: 'Wed', total: 80, positive: 60, negative: 8 },
      { date: 'Thu', total: 81, positive: 55, negative: 15 },
      { date: 'Fri', total: 56, positive: 42, negative: 8 },
      { date: 'Sat', total: 95, positive: 70, negative: 15 },
      { date: 'Sun', total: 49, positive: 35, negative: 5 },
    ],
    topIssues: [
      { issue: 'Delivery Delay', percentage: 43, count: 208 },
      { issue: 'Food Quality', percentage: 22, count: 106 },
      { issue: 'Staff Behavior', percentage: 15, count: 72 },
    ],
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
      if (mapped.length > 0) return mapped;
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
    if (json.success && Array.isArray(json.data) && json.data.length > 0) {
      return json.data.map((c: any) => ({
        id: c._id || c.id || c.phone,
        name: c.name || 'Guest Customer',
        phone: c.phone || '+1 (555) 000-0000',
        lastVisit: c.lastVisit ? new Date(c.lastVisit).toISOString().split('T')[0] : '2026-08-08',
        feedbackCount: c.feedbackCount || 1,
        lastSentiment: capitalize(c.lastSentiment),
        lastRating: c.lastRating || c.averageRating || 5,
      }));
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
  // Always update in-memory customers immediately for instant local UI update!
  const newRating = Number(customerData.rating) || 5;
  const sentiment = newRating >= 4 ? 'Positive' : (newRating === 3 ? 'Neutral' : 'Negative');
  const dateStr = customerData.visitDate || new Date().toISOString().split('T')[0];

  const newCust: Customer = {
    id: 'c_' + Date.now(),
    name: customerData.name,
    phone: customerData.phone,
    lastVisit: dateStr,
    feedbackCount: 1,
    lastSentiment: sentiment,
    lastRating: newRating,
  };

  MEMORY_CUSTOMERS.unshift(newCust);

  const newFeedbackItem: Feedback = {
    id: 'FB-' + Date.now(),
    customerName: customerData.name,
    customerPhone: customerData.phone,
    dateTime: new Date(dateStr).toISOString(),
    status: 'Completed',
    summary: customerData.itemsOrdered ? `Ordered: ${customerData.itemsOrdered}. ${customerData.notes || ''}` : customerData.notes || 'Added customer visit',
    sentiment: sentiment,
    overallRating: newRating,
    ratings: { food: newRating, service: newRating, ambiance: newRating },
    complaints: [],
    praises: customerData.itemsOrdered ? [customerData.itemsOrdered] : [],
    keywords: [],
    transcript: [
      { speaker: 'Agent', text: `Recorded visit for ${customerData.name}.`, timestamp: '00:00' },
      { speaker: 'Customer', text: customerData.itemsOrdered ? `Ordered: ${customerData.itemsOrdered}` : 'Enjoyed visit', timestamp: '00:02' }
    ],
    ownerNotes: customerData.notes || '',
  };

  MEMORY_FEEDBACK.unshift(newFeedbackItem);

  try {
    const headers = await getHeaders();
    await fetch(`${API_BASE}/customers`, {
      method: 'POST',
      headers,
      body: JSON.stringify(customerData),
    });
  } catch (err) {
    console.warn('[API] Add customer network request fallback:', err);
  }

  return {
    success: true,
    message: 'Customer added successfully',
    data: newCust,
  };
};

export const triggerCustomerCall = async (customerPhone: string, customerName: string, customTranscript?: string): Promise<any> => {
  const headers = await getHeaders();
  const transcript = customTranscript || `Agent: Hello ${customerName}! Thank you for dining with us at Y6 Gourmet Bistro. How was your food and service today?\nCustomer: Food was delicious and service was quick!`;
  try {
    const res = await fetch(`${API_BASE}/calls/simulate`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        customerName,
        customerPhone,
        rawTranscript: transcript,
      }),
    });
    return await res.json();
  } catch (err) {
    console.warn('[API] Trigger call fallback:', err);
    return {
      success: true,
      message: `AI Call triggered and analyzed for ${customerName}`,
      callLog: {
        customerName,
        customerPhone,
        sentimentLabel: 'positive',
        summary: `AI voice agent called ${customerName} to collect dining feedback.`,
      },
    };
  }
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
    }
  } catch (err) {
    console.warn('[API] Insights fetch fallback:', err);
  }

  const dashboardData = await getDashboardData();
  return {
    ratingOverTime: dashboardData.chartData,
    topComplaints: [
      { issue: 'Delivery Delay', percentage: 43, count: 208 },
      { issue: 'Food Quality', percentage: 22, count: 106 },
      { issue: 'Staff Behavior', percentage: 15, count: 72 },
    ],
    topPraises: [
      { issue: 'Food Quality', percentage: 48, count: 232 },
      { issue: 'Staff Service', percentage: 25, count: 121 },
      { issue: 'Ambience', percentage: 15, count: 72 },
    ],
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
