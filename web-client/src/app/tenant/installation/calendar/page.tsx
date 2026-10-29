"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, 
  Clock, MapPin, User, ArrowLeft, CheckCircle2, Wrench, AlertCircle
} from 'lucide-react';
import { Button, Badge, Card, CardHeader, CardTitle, CardDescription, CardContent, EmptyState } from '@/components/ui';

export default function InstallationCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [installations, setInstallations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDateStr, setSelectedDateStr] = useState<string>(new Date().toISOString().split('T')[0]);

  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  useEffect(() => {
    async function fetchInstallations() {
      try {
        const res = await axios.get(`${apiBase}/api/tenant/installations`, { withCredentials: true });
        if (res.data?.installations) {
          setInstallations(res.data.installations);
        }
      } catch (err) {
        console.error('Error fetching installations for calendar:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchInstallations();
  }, [apiBase]);

  // Calendar calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDateStr(today.toISOString().split('T')[0]);
  };

  // Group installations by YYYY-MM-DD
  const installationsByDate: Record<string, any[]> = {};
  installations.forEach(inst => {
    if (!inst.scheduledDate) return;
    const dateKey = new Date(inst.scheduledDate).toISOString().split('T')[0];
    if (!installationsByDate[dateKey]) {
      installationsByDate[dateKey] = [];
    }
    installationsByDate[dateKey].push(inst);
  });

  const selectedDateJobs = installationsByDate[selectedDateStr] || [];

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/tenant/installation"
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition"
            aria-label="Back to Installation"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Installation Calendar</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Visual monthly dispatch schedule and site team deployment
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/tenant/installation/schedule">
            <Button variant="primary" size="md" leftIcon={<Plus size={16} />}>
              Schedule Job
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid (2 Cols) */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle>
                  {monthNames[month]} {year}
                </CardTitle>
                <CardDescription>Click a date to inspect scheduled engineering crews</CardDescription>
              </div>
              <div className="flex items-center gap-1.5">
                <Button variant="outline" size="sm" onClick={handleToday}>
                  Today
                </Button>
                <Button variant="ghost" size="sm" onClick={handlePrevMonth} aria-label="Previous month">
                  <ChevronLeft size={16} />
                </Button>
                <Button variant="ghost" size="sm" onClick={handleNextMonth} aria-label="Next month">
                  <ChevronRight size={16} />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Weekday Header */}
              <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                  <div key={d} className="text-[11px] font-bold text-slate-400 uppercase py-1">
                    {d}
                  </div>
                ))}
              </div>

              {/* Day Cells */}
              <div className="grid grid-cols-7 gap-1">
                {/* Empty cells before first day */}
                {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                  <div key={`empty-${i}`} className="min-h-[72px] sm:min-h-[88px] p-1 bg-slate-50/50 rounded-lg" />
                ))}

                {/* Days of month */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const isSelected = dateStr === selectedDateStr;
                  const dayJobs = installationsByDate[dateStr] || [];
                  const isToday = new Date().toISOString().split('T')[0] === dateStr;

                  return (
                    <button
                      key={dateStr}
                      type="button"
                      onClick={() => setSelectedDateStr(dateStr)}
                      className={`min-h-[72px] sm:min-h-[88px] p-1.5 sm:p-2 rounded-xl text-left border flex flex-col justify-between transition cursor-pointer ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50/30 ring-2 ring-emerald-500/20'
                          : isToday
                          ? 'border-blue-400 bg-blue-50/20'
                          : 'border-slate-100 hover:border-slate-300 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-bold ${
                            isToday
                              ? 'w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center'
                              : isSelected
                              ? 'text-emerald-700'
                              : 'text-slate-700'
                          }`}
                        >
                          {day}
                        </span>
                        {dayJobs.length > 0 && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-indigo-100 text-indigo-700">
                            {dayJobs.length}
                          </span>
                        )}
                      </div>

                      <div className="space-y-1 mt-1 overflow-hidden">
                        {dayJobs.slice(0, 2).map(job => (
                          <div
                            key={job.id}
                            className="text-[10px] font-semibold truncate px-1 rounded bg-slate-100 text-slate-700"
                            title={`${job.jobId} - ${job.customer?.name || 'Project'}`}
                          >
                            {job.customer?.name || job.jobId}
                          </div>
                        ))}
                        {dayJobs.length > 2 && (
                          <div className="text-[9px] text-slate-400 font-bold px-1">
                            +{dayJobs.length - 2} more
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Selected Date Detail Drawer (1 Col) */}
        <div>
          <Card>
            <CardHeader>
              <div>
                <CardTitle className="text-sm sm:text-base">
                  Jobs on {selectedDateStr}
                </CardTitle>
                <CardDescription>
                  {selectedDateJobs.length} installation{selectedDateJobs.length === 1 ? '' : 's'} scheduled
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {selectedDateJobs.length === 0 ? (
                <EmptyState
                  icon={CalendarIcon}
                  title="No Jobs Scheduled"
                  description="No installation jobs are currently scheduled for this date."
                  action={{
                    label: 'Schedule a Job',
                    href: '/tenant/installation/schedule',
                    icon: Plus,
                  }}
                />
              ) : (
                <div className="space-y-3">
                  {selectedDateJobs.map(job => {
                    const statusVariant: Record<string, any> = {
                      SCHEDULED: 'info',
                      IN_PROGRESS: 'warning',
                      COMPLETED: 'success',
                      PENDING_REVIEW: 'primary',
                      DELAYED: 'danger',
                    };

                    return (
                      <Link
                        key={job.id}
                        href={`/tenant/installation/${job.id}`}
                        className="block p-3.5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:shadow-xs transition bg-white"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-mono text-xs font-bold text-slate-900">{job.jobId}</span>
                          <Badge variant={statusVariant[job.status] || 'neutral'} size="sm">
                            {job.status}
                          </Badge>
                        </div>
                        <p className="text-xs font-bold text-slate-800 truncate mb-1">
                          {job.customer?.name || 'Solar Customer'}
                        </p>
                        <div className="text-[11px] text-slate-500 space-y-1">
                          <div className="flex items-center gap-1.5">
                            <Clock size={12} className="text-slate-400 shrink-0" />
                            <span>{job.scheduledStartTime || '09:00'} ({job.estimatedDuration || 8} hrs)</span>
                          </div>
                          <div className="flex items-center gap-1.5 truncate">
                            <MapPin size={12} className="text-slate-400 shrink-0" />
                            <span className="truncate">{job.installationAddress || job.city || 'Site address'}</span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
