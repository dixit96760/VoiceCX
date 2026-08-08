import React, { useEffect, useState } from 'react';
import { Header } from '../components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { MessageSquare, Star, ThumbsUp, ThumbsDown, PhoneCall, ArrowUpRight, ArrowDownRight, Sparkles } from 'lucide-react';
import { getDashboardData } from '../services/api';
import type { DashboardMetrics, ChartDataPoint, RankedIssue, Feedback } from '../types';
import { cn } from '../lib/utils';

function MetricCard({ title, value, icon: Icon, trend, trendLabel }: { title: string, value: string | number, icon: any, trend?: number, trendLabel?: string }) {
  const isPositive = trend && trend > 0;
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <p className="text-sm font-medium text-[var(--color-text-secondary)]">{title}</p>
          <div className="rounded-full bg-[var(--color-bg-page)] p-2">
            <Icon className="h-4 w-4 text-[var(--color-primary-500)]" />
          </div>
        </div>
        <div className="flex flex-col">
          <div className="text-3xl font-bold text-[var(--color-text-primary)]">{value}</div>
          {trend !== undefined && (
            <p className={cn("flex items-center text-xs mt-1", isPositive ? "text-[var(--color-positive-500)]" : "text-[var(--color-negative-500)]")}>
              {isPositive ? <ArrowUpRight className="mr-1 h-3 w-3" /> : <ArrowDownRight className="mr-1 h-3 w-3" />}
              {Math.abs(trend)}% {trendLabel || "from last period"}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

const COLORS = {
  Positive: 'var(--color-positive-500)',
  Neutral: 'var(--color-warning-500)',
  Negative: 'var(--color-negative-500)'
};

export function Home() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    metrics: DashboardMetrics;
    chartData: ChartDataPoint[];
    topIssues: RankedIssue[];
    recentFeedback: Feedback[];
  } | null>(null);

  useEffect(() => {
    getDashboardData().then(res => {
      setData(res);
      setLoading(false);
    });
  }, []);

  if (loading || !data) {
    return (
      <div className="flex-1 flex flex-col">
        <Header title="Home" showDateRange />
        <div className="flex-1 p-6 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary-500)]" />
        </div>
      </div>
    );
  }

  const sentimentData = [
    { name: 'Positive', value: data.metrics.positiveFeedbackPercent },
    { name: 'Neutral', value: 100 - data.metrics.positiveFeedbackPercent - data.metrics.negativeFeedbackPercent },
    { name: 'Negative', value: data.metrics.negativeFeedbackPercent },
  ];

  return (
    <div className="flex flex-col space-y-6">
      <Header title="Good morning, Business Owner" description="Here's what's happening with your customer feedback today." showDateRange />
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <MetricCard title="Total Feedback" value={data.metrics.totalFeedback} icon={MessageSquare} trend={data.metrics.trends.totalFeedback} />
        <MetricCard title="Average Rating" value={`${data.metrics.averageRating} / 5`} icon={Star} trend={data.metrics.trends.averageRating} />
        <MetricCard title="Positive Feedback" value={`${data.metrics.positiveFeedbackPercent}%`} icon={ThumbsUp} trend={data.metrics.trends.positiveFeedbackPercent} />
        <MetricCard title="Negative Feedback" value={`${data.metrics.negativeFeedbackPercent}%`} icon={ThumbsDown} trend={data.metrics.trends.negativeFeedbackPercent} />
        <MetricCard title="Response Rate" value={`${data.metrics.responseRatePercent}%`} icon={PhoneCall} trend={data.metrics.trends.responseRatePercent} />
      </div>

      <div className="grid gap-4 md:grid-cols-7 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Feedback Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-subtle)" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: 'var(--color-text-muted)', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--color-text-muted)', fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid var(--color-border-subtle)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Line type="monotone" dataKey="total" name="Total" stroke="var(--color-primary-500)" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="positive" name="Positive" stroke="var(--color-positive-500)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="negative" name="Negative" stroke="var(--color-negative-500)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Feedback by Sentiment</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center">
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sentimentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {sentimentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex w-full justify-center space-x-6 mt-2 text-sm">
              <div className="flex items-center"><span className="h-3 w-3 rounded-full bg-[var(--color-positive-500)] mr-2"></span>Positive</div>
              <div className="flex items-center"><span className="h-3 w-3 rounded-full bg-[var(--color-warning-500)] mr-2"></span>Neutral</div>
              <div className="flex items-center"><span className="h-3 w-3 rounded-full bg-[var(--color-negative-500)] mr-2"></span>Negative</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="text-base flex items-center">
              <Sparkles className="mr-2 h-4 w-4 text-[var(--color-secondary-500)]" />
              AI Insight
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg bg-[var(--color-secondary-bg)] p-4 border border-purple-100">
              <p className="text-sm text-[var(--color-text-primary)] leading-relaxed">
                "Delivery-related complaints have increased by 15% recently. Consider reviewing delivery operations during peak hours, particularly on weekends."
              </p>
              <button className="mt-4 text-xs font-semibold text-[var(--color-secondary-500)] hover:text-purple-700">
                View Detailed Insights →
              </button>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Top Issues</CardTitle>
            <button className="text-sm text-[var(--color-primary-500)] hover:underline">View All</button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.topIssues.slice(0, 3).map((issue) => (
                <div key={issue.issue} className="flex items-center justify-between">
                  <div className="w-[120px] text-sm font-medium">{issue.issue}</div>
                  <div className="flex-1 mx-4 h-2 rounded-full bg-[var(--color-bg-page)] overflow-hidden">
                    <div className="h-full bg-[var(--color-primary-500)] rounded-full" style={{ width: `${issue.percentage}%` }} />
                  </div>
                  <div className="w-[60px] text-right text-sm text-[var(--color-text-muted)]">
                    {issue.percentage}% <span className="text-xs">({issue.count})</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
