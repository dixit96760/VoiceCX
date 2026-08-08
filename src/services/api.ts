import type { Feedback, Customer, DashboardMetrics, ChartDataPoint, RankedIssue } from '../types';
import { mockDashboardMetrics, mockChartData, mockTopIssues, mockTopPraises, mockFeedback, mockCustomers } from '../data/mockData';

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const getDashboardData = async (): Promise<{
  metrics: DashboardMetrics;
  chartData: ChartDataPoint[];
  topIssues: RankedIssue[];
  recentFeedback: Feedback[];
}> => {
  await delay(500);
  return {
    metrics: mockDashboardMetrics,
    chartData: mockChartData,
    topIssues: mockTopIssues,
    recentFeedback: mockFeedback.slice(0, 5)
  };
};

export const getFeedback = async (): Promise<Feedback[]> => {
  await delay(600);
  return mockFeedback;
};

export const getFeedbackById = async (id: string): Promise<Feedback | undefined> => {
  await delay(400);
  return mockFeedback.find(f => f.id === id);
};

export const getCustomers = async (): Promise<Customer[]> => {
  await delay(500);
  return mockCustomers;
};

export const getCustomerById = async (id: string): Promise<Customer | undefined> => {
  await delay(400);
  return mockCustomers.find(c => c.id === id);
};

export const getInsights = async (): Promise<{
  ratingOverTime: ChartDataPoint[];
  topComplaints: RankedIssue[];
  topPraises: RankedIssue[];
}> => {
  await delay(600);
  return {
    ratingOverTime: mockChartData, // Reuse for now
    topComplaints: mockTopIssues,
    topPraises: mockTopPraises
  };
};

// Mock local state for settings
let doNotCallList: string[] = ['+91 9999999999', '+91 8888888888'];

export const getDoNotCallList = async (): Promise<string[]> => {
  await delay(300);
  return [...doNotCallList];
};

export const addDoNotCallNumber = async (phone: string): Promise<void> => {
  await delay(400);
  if (!doNotCallList.includes(phone)) {
    doNotCallList.push(phone);
  }
};

export const removeDoNotCallNumber = async (phone: string): Promise<void> => {
  await delay(400);
  doNotCallList = doNotCallList.filter(p => p !== phone);
};

export const saveOwnerNote = async (feedbackId: string, note: string): Promise<void> => {
  await delay(400);
  const fb = mockFeedback.find(f => f.id === feedbackId);
  if (fb) {
    fb.ownerNotes = note;
  }
};

export const exportFeedback = async (): Promise<string> => {
  await delay(800);
  // Generate a mock CSV string
  const header = 'ID,Customer,Phone,Date,Status,Sentiment,Rating,Summary\n';
  const rows = mockFeedback.map(f => 
    `${f.id},${f.customerName},${f.customerPhone},${f.dateTime},${f.status},${f.sentiment},${f.overallRating},"${f.summary.replace(/"/g, '""')}"`
  ).join('\n');
  return header + rows;
};
