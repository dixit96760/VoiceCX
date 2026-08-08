import React, { useState, useEffect } from 'react';
import { Header } from '../components/layout/Header';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { getDoNotCallList, addDoNotCallNumber, removeDoNotCallNumber } from '../services/api';
import { Trash2 } from 'lucide-react';

export function Settings() {
  const [dncList, setDncList] = useState<string[]>([]);
  const [newNumber, setNewNumber] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  
  // Calling Schedule State
  const [enabled, setEnabled] = useState(true);
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('20:00');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [savingSchedule, setSavingSchedule] = useState(false);

  useEffect(() => {
    getDoNotCallList().then(setDncList);
  }, []);

  const handleAddDnc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNumber.trim()) return;
    setIsAdding(true);
    await addDoNotCallNumber(newNumber);
    const updated = await getDoNotCallList();
    setDncList(updated);
    setNewNumber('');
    setIsAdding(false);
  };

  const handleRemoveDnc = async (phone: string) => {
    await removeDoNotCallNumber(phone);
    const updated = await getDoNotCallList();
    setDncList(updated);
  };

  const handleSaveSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSchedule(true);
    setTimeout(() => {
      setSavingSchedule(false);
    }, 600);
  };

  return (
    <div className="flex flex-col space-y-6 max-w-4xl">
      <Header title="Settings" description="Configure your calling rules and preferences." />
      
      <div className="grid gap-6">
        
        {/* Calling Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Calling Schedule</CardTitle>
            <CardDescription>Configure when the automated system is allowed to contact customers.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveSchedule} className="space-y-4">
              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  id="enabled" 
                  checked={enabled} 
                  onChange={(e) => setEnabled(e.target.checked)} 
                  className="rounded border-[var(--color-border-subtle)] text-[var(--color-primary-500)] focus:ring-[var(--color-primary-500)]"
                />
                <label htmlFor="enabled" className="text-sm font-medium">Enable Automated Calling</label>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-sm text-[var(--color-text-secondary)]">Start Time</label>
                  <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} disabled={!enabled} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-[var(--color-text-secondary)]">End Time</label>
                  <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} disabled={!enabled} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-[var(--color-text-secondary)]">Timezone</label>
                  <select 
                    value={timezone} 
                    onChange={e => setTimezone(e.target.value)} 
                    disabled={!enabled}
                    className="flex h-10 w-full rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] disabled:opacity-50"
                  >
                    <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                    <option value="America/New_York">America/New_York (EST)</option>
                    <option value="Europe/London">Europe/London (GMT)</option>
                  </select>
                </div>
              </div>
              <Button type="submit" disabled={savingSchedule}>
                {savingSchedule ? 'Saving...' : 'Save Schedule'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Do Not Call List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Do Not Call List</CardTitle>
            <CardDescription>Numbers on this list will never be contacted by the automated system.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddDnc} className="flex space-x-2 mb-4">
              <Input 
                type="text" 
                placeholder="Enter phone number..." 
                value={newNumber} 
                onChange={(e) => setNewNumber(e.target.value)} 
                className="max-w-xs"
              />
              <Button type="submit" disabled={isAdding || !newNumber.trim()} variant="secondary">
                {isAdding ? 'Adding...' : 'Add Number'}
              </Button>
            </form>

            <div className="border border-[var(--color-border-subtle)] rounded-lg overflow-hidden max-w-lg">
              {dncList.length === 0 ? (
                <div className="p-4 text-sm text-[var(--color-text-muted)] text-center bg-gray-50">
                  No numbers in the Do Not Call list.
                </div>
              ) : (
                <ul className="divide-y divide-[var(--color-border-subtle)]">
                  {dncList.map(phone => (
                    <li key={phone} className="flex items-center justify-between p-3 text-sm">
                      <span className="font-medium text-[var(--color-text-primary)]">{phone}</span>
                      <button 
                        onClick={() => handleRemoveDnc(phone)}
                        className="text-[var(--color-text-muted)] hover:text-[var(--color-negative-500)] p-1 rounded transition-colors"
                        title="Remove"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
