import type { Feedback, Customer, DashboardMetrics, ChartDataPoint, RankedIssue } from '../types';

export const mockDashboardMetrics: DashboardMetrics = {
  totalFeedback: 0,
  averageRating: 0,
  positiveFeedbackPercent: 0,
  negativeFeedbackPercent: 0,
  responseRatePercent: 100,
  trends: {
    totalFeedback: 0,
    averageRating: 0,
    positiveFeedbackPercent: 0,
    negativeFeedbackPercent: 0,
    responseRatePercent: 0,
  }
};

export const mockChartData: ChartDataPoint[] = [
  { date: 'Mon', total: 0, positive: 0, negative: 0 },
  { date: 'Tue', total: 0, positive: 0, negative: 0 },
  { date: 'Wed', total: 0, positive: 0, negative: 0 },
  { date: 'Thu', total: 0, positive: 0, negative: 0 },
  { date: 'Fri', total: 0, positive: 0, negative: 0 },
  { date: 'Sat', total: 0, positive: 0, negative: 0 },
  { date: 'Sun', total: 0, positive: 0, negative: 0 },
];

export const mockTopIssues: RankedIssue[] = [];
export const mockTopPraises: RankedIssue[] = [];
export const mockFeedback: Feedback[] = [];
export const mockCustomers: Customer[] = [];
