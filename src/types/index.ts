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
  speaker: 'Agent' | 'Customer' | 'AI';
  text: string;
  timestamp?: string;
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

export interface CallRecord {
  id: string;
  _id?: string;
  vapiCallId?: string;
  contactName: string;
  phoneNumber: string;
  purpose: string;
  customInstructions?: string;
  status: 'queued' | 'calling' | 'in-progress' | 'completed' | 'failed';
  startedAt?: string;
  endedAt?: string;
  duration: number;
  transcript?: any;
  summary?: string;
  outcome?: 'positive' | 'negative' | 'interested' | 'not_interested' | 'callback_requested' | 'completed' | 'unknown';
  sentiment?: 'positive' | 'neutral' | 'negative';
  nextAction?: string;
  followUpRequired?: boolean;
  followUpReason?: string;
  recordingUrl?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CallStats {
  totalCalls: number;
  completed: number;
  failed: number;
  inProgress: number;
  averageDuration: number;
}

export interface DoNotCall {
  _id: string;
  phoneNumber: string;
  reason?: string;
  addedAt?: string;
}

export interface AppNotification {
  _id: string;
  title: string;
  message: string;
  type: 'insight' | 'anomaly' | 'action';
  read: boolean;
  createdAt: string;
}
