import React, { useState, useEffect } from 'react';
import { Header } from '../components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { getInsights } from '../services/api';
import type { ChartDataPoint, RankedIssue } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';

const COLORS = {
  Positive: 'var(--color-positive-500)',
  Neutral: 'var(--color-warning-500)',
  Negative: 'var(--color-negative-500)'
};

export function Insights() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    ratingOverTime: ChartDataPoint[];
    topComplaints: RankedIssue[];
    topPraises: RankedIssue[];
  } | null>(null);

  useEffect(() => {
    getInsights().then(res => {
      setData(res);
      setLoading(false);
    });
  }, []);

  if (loading || !data) {
    return (
      <div className="flex flex-col h-full">
        <Header title="Insights" />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary-500)]" />
        </div>
      </div>
    );
  }

  const sentimentData = [
    { name: 'Positive', value: 68 },
    { name: 'Neutral', value: 13 },
    { name: 'Negative', value: 19 },
  ];

  return (
    <div className="flex flex-col space-y-6">
      <Header title="Insights" description="Deep dive into customer feedback trends and analytics." />
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Average Rating Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.ratingOverTime}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-subtle)" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: 'var(--color-text-muted)'}} />
                  <YAxis domain={[0, 5]} axisLine={false} tickLine={false} tick={{fill: 'var(--color-text-muted)'}} />
                  <Tooltip />
                  <Line type="monotone" dataKey="total" name="Avg Rating" stroke="var(--color-positive-500)" strokeWidth={2} dot={{r: 4}} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sentiment Distribution</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center">
            <div className="h-[250px] w-full">
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Most Common Complaints</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.topComplaints} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="var(--color-border-subtle)" />
                  <XAxis type="number" axisLine={false} tickLine={false} />
                  <YAxis dataKey="issue" type="category" axisLine={false} tickLine={false} width={100} tick={{fill: 'var(--color-text-primary)', fontSize: 12}} />
                  <Tooltip cursor={{fill: 'transparent'}} />
                  <Bar dataKey="count" fill="var(--color-negative-500)" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Most Common Praises</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.topPraises} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="var(--color-border-subtle)" />
                  <XAxis type="number" axisLine={false} tickLine={false} />
                  <YAxis dataKey="issue" type="category" axisLine={false} tickLine={false} width={100} tick={{fill: 'var(--color-text-primary)', fontSize: 12}} />
                  <Tooltip cursor={{fill: 'transparent'}} />
                  <Bar dataKey="count" fill="var(--color-positive-500)" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
