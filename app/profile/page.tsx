'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getUser, setUser, User } from '@/lib/auth';
import { toast } from 'sonner';
import { Area, AreaChart, CartesianGrid, XAxis, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

interface Note {
  id: string;
  text: string;
  color: string;
  timestamp: Date;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUserState] = useState<User | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState<Note[]>([]);

  useEffect(() => {
    const currentUser = getUser();
    if (currentUser) {
      setUserState(currentUser);
      setName(currentUser.name);
      setEmail(currentUser.email);
    }

    const savedNotes = localStorage.getItem('oneday-notes');
    if (savedNotes) {
      try {
        const parsedNotes = JSON.parse(savedNotes);
        const notesWithDates = parsedNotes.map((note: any) => ({
          ...note,
          timestamp: new Date(note.timestamp),
        }));
        setNotes(notesWithDates);
      } catch (error) {
        console.error('Failed to parse notes:', error);
      }
    }
  }, []);

  const handleSave = () => {
    if (!name.trim() || !email.trim()) {
      toast.error('Name and email are required');
      return;
    }
    const updatedUser = { name: name.trim(), email: email.trim() };
    setUser(updatedUser);
    setUserState(updatedUser);
    toast.success('Profile updated successfully');
  };

  const initials = user?.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'GU';

  const chartData = (() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split('T')[0];
    });

    const notesPerDay = last7Days.map(date => {
      const count = notes.filter(note => 
        note.timestamp.toISOString().split('T')[0] === date
      ).length;
      return {
        date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
        notes: count,
      };
    });

    return notesPerDay;
  })();

  const chartConfig = {
    notes: {
      label: 'Notes',
      color: 'hsl(var(--chart-1))',
    },
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-8">
      <div className="max-w-2xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => router.push('/')}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Notes
        </Button>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
            <div className="flex justify-center">
              <Avatar className="h-24 w-24">
                <AvatarFallback className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-2xl font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                />
              </div>

              <Button onClick={handleSave} className="w-full">
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Activity Overview
            </CardTitle>
            <CardDescription>Your note creation activity over the last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="fillNotes" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    className="text-xs"
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="notes"
                    stroke="hsl(var(--chart-1))"
                    fillOpacity={1}
                    fill="url(#fillNotes)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
            <div className="mt-4 grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">{notes.length}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">Total Notes</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                  {notes.filter(n => {
                    const today = new Date().toISOString().split('T')[0];
                    return n.timestamp.toISOString().split('T')[0] === today;
                  }).length}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">Today</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                  {notes.filter(n => {
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return n.timestamp >= weekAgo;
                  }).length}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">This Week</p>
              </div>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </main>
  );
}
