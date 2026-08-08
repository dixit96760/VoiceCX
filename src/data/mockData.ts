import type { Feedback, Customer, DashboardMetrics, ChartDataPoint, RankedIssue } from '../types';

export const mockDashboardMetrics: DashboardMetrics = {
  totalFeedback: 485,
  averageRating: 4.2,
  positiveFeedbackPercent: 68,
  negativeFeedbackPercent: 19,
  responseRatePercent: 92,
  trends: {
    totalFeedback: 18,
    averageRating: 0.2,
    positiveFeedbackPercent: 5,
    negativeFeedbackPercent: -3,
    responseRatePercent: 2,
  }
};

export const mockChartData: ChartDataPoint[] = [
  { date: 'Mon', total: 65, positive: 45, negative: 10 },
  { date: 'Tue', total: 59, positive: 40, negative: 12 },
  { date: 'Wed', total: 80, positive: 60, negative: 8 },
  { date: 'Thu', total: 81, positive: 55, negative: 15 },
  { date: 'Fri', total: 56, positive: 42, negative: 8 },
  { date: 'Sat', total: 95, positive: 70, negative: 15 },
  { date: 'Sun', total: 49, positive: 35, negative: 5 },
];

export const mockTopIssues: RankedIssue[] = [
  { issue: 'Delivery Delay', percentage: 43, count: 208 },
  { issue: 'Food Quality', percentage: 22, count: 106 },
  { issue: 'Staff Behavior', percentage: 15, count: 72 },
  { issue: 'Ambience', percentage: 12, count: 58 },
  { issue: 'Pricing', percentage: 8, count: 38 },
];

export const mockTopPraises: RankedIssue[] = [
  { issue: 'Food Quality', percentage: 48, count: 232 },
  { issue: 'Staff Service', percentage: 25, count: 121 },
  { issue: 'Ambience', percentage: 15, count: 72 },
  { issue: 'Cleanliness', percentage: 8, count: 38 },
  { issue: 'Value', percentage: 4, count: 19 },
];

export const mockFeedback: Feedback[] = [
  {
    id: 'FB-1001',
    customerName: 'John Doe',
    customerPhone: '+91 ******3210',
    dateTime: '2026-08-08T10:30:00Z',
    status: 'Completed',
    summary: 'Great food and awesome service. Loved the experience!',
    sentiment: 'Positive',
    overallRating: 5,
    ratings: { food: 5, service: 5, ambiance: 4 },
    complaints: [],
    praises: ['Food Quality', 'Staff Service'],
    keywords: ['great food', 'awesome service'],
    transcript: [
      { speaker: 'Agent', text: 'Hi John, how was your experience today?', timestamp: '00:00' },
      { speaker: 'Customer', text: 'Oh, it was fantastic. The food was great and the service was awesome.', timestamp: '00:05' },
      { speaker: 'Agent', text: 'We are glad to hear that. Thank you for your feedback.', timestamp: '00:15' }
    ],
    audioUrl: 'https://example.com/audio1.mp3'
  },
  {
    id: 'FB-1002',
    customerName: 'Jane Smith',
    customerPhone: '+91 ******9988',
    dateTime: '2026-08-08T09:15:00Z',
    status: 'Completed',
    summary: 'The food was decent, but the waiting time was too long.',
    sentiment: 'Neutral',
    overallRating: 3,
    ratings: { food: 4, service: 2, ambiance: 3 },
    complaints: ['Waiting Time'],
    praises: ['Food Quality'],
    keywords: ['decent food', 'long wait'],
    transcript: [
      { speaker: 'Agent', text: 'Hi Jane, could you share your feedback regarding your visit?', timestamp: '00:00' },
      { speaker: 'Customer', text: 'The food was decent, but honestly the wait time was too long. It took 45 minutes.', timestamp: '00:04' },
      { speaker: 'Agent', text: 'I apologize for the delay. We will work on improving our service speed.', timestamp: '00:12' }
    ]
  },
  {
    id: 'FB-1003',
    customerName: 'Alice Johnson',
    customerPhone: '+91 ******4567',
    dateTime: '2026-08-07T18:45:00Z',
    status: 'Completed',
    summary: 'Terrible experience. The delivery was delayed and food was cold.',
    sentiment: 'Negative',
    overallRating: 1,
    ratings: { food: 1, service: 1, ambiance: 0 },
    complaints: ['Delivery Delay', 'Food Quality'],
    praises: [],
    keywords: ['terrible', 'delayed', 'cold food'],
    transcript: [
      { speaker: 'Agent', text: 'Hello Alice, how was your recent delivery order?', timestamp: '00:00' },
      { speaker: 'Customer', text: 'It was terrible. It took over an hour and the food was completely cold when it arrived.', timestamp: '00:03' },
      { speaker: 'Agent', text: 'I am so sorry to hear that. I will raise this with our team right away.', timestamp: '00:11' }
    ]
  },
  {
    id: 'FB-1004',
    customerName: 'Michael Brown',
    customerPhone: '+91 ******1122',
    dateTime: '2026-08-07T14:20:00Z',
    status: 'No Answer',
    summary: 'Customer did not answer the call.',
    sentiment: 'Neutral',
    overallRating: 0,
    ratings: { food: 0, service: 0, ambiance: 0 },
    complaints: [],
    praises: [],
    keywords: [],
    transcript: []
  },
  {
    id: 'FB-1005',
    customerName: 'Sarah Davis',
    customerPhone: '+91 ******8877',
    dateTime: '2026-08-06T12:10:00Z',
    status: 'Rejected',
    summary: 'Customer hung up immediately.',
    sentiment: 'Neutral',
    overallRating: 0,
    ratings: { food: 0, service: 0, ambiance: 0 },
    complaints: [],
    praises: [],
    keywords: [],
    transcript: []
  }
];

export const mockCustomers: Customer[] = [
  { id: 'C-1', name: 'John Doe', phone: '+91 9876543210', lastVisit: '2026-08-08', feedbackCount: 4, lastSentiment: 'Positive', lastRating: 5 },
  { id: 'C-2', name: 'Jane Smith', phone: '+91 8765439988', lastVisit: '2026-08-08', feedbackCount: 1, lastSentiment: 'Neutral', lastRating: 3 },
  { id: 'C-3', name: 'Alice Johnson', phone: '+91 7654324567', lastVisit: '2026-08-07', feedbackCount: 8, lastSentiment: 'Negative', lastRating: 1 },
  { id: 'C-4', name: 'Michael Brown', phone: '+91 6543211122', lastVisit: '2026-08-07', feedbackCount: 2, lastSentiment: 'Neutral', lastRating: 0 },
  { id: 'C-5', name: 'Sarah Davis', phone: '+91 5432108877', lastVisit: '2026-08-06', feedbackCount: 3, lastSentiment: 'Neutral', lastRating: 0 },
];
