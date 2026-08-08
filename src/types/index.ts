export interface Feedback {
  id: string;
  customerName: string;
  customerPhone: string;
  dateTime: string; // ISO format
  status: 'Completed' | 'No Answer' | 'Rejected';
  summary: string;
  sentiment: 'Positive' | 'Neutral' | 'Negative';
  overallRating: number;
  ratings: {
    food: number;
    service: number;
    ambiance: number;
  };
  complaints: string[];
  praises: string[];
  keywords: string[];
  transcript: TranscriptMessage[];
  audioUrl?: string; // Optional for when there's no audio
  ownerNotes?: string;
}

export interface TranscriptMessage {
  speaker: 'Agent' | 'Customer';
  text: string;
  timestamp: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  lastVisit: string;
  feedbackCount: number;
  lastSentiment: 'Positive' | 'Neutral' | 'Negative';
  lastRating: number;
}

export interface DashboardMetrics {
  totalFeedback: number;
  averageRating: number;
  positiveFeedbackPercent: number;
  negativeFeedbackPercent: number;
  responseRatePercent: number;
  trends: {
    totalFeedback: number;
    averageRating: number;
    positiveFeedbackPercent: number;
    negativeFeedbackPercent: number;
    responseRatePercent: number;
  };
}

export interface ChartDataPoint {
  date: string;
  total: number;
  positive: number;
  negative: number;
}

export interface RankedIssue {
  issue: string;
  percentage: number;
  count: number;
}
