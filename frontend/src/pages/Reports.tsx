import React, { useState } from 'react';
import { Header } from '../components/layout/Header';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { FileDown } from 'lucide-react';
import { exportFeedback } from '../services/api';

export function Reports() {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const csvData = await exportFeedback();
      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `feedback_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (e) {
      console.error('Failed to export', e);
    }
    setExporting(false);
  };

  return (
    <div className="flex flex-col space-y-6">
      <Header title="Reports" description="Export your data for external analysis." />
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Export Feedback Data</CardTitle>
            <CardDescription>Download a CSV file containing all customer feedback, ratings, and sentiments.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleExport} disabled={exporting}>
              <FileDown className="mr-2 h-4 w-4" />
              {exporting ? 'Exporting...' : 'Export CSV'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
