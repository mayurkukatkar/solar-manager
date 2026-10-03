"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { 
  Calendar, Wrench, AlertTriangle, CheckCircle, Clock, Plus, Activity, Truck
} from 'lucide-react';

export default function InstallationDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/installations/dashboard`, { withCredentials: true });
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64 text-slate-400">Loading dashboard...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Installation Management</h1>
          <p className="text-slate-500 mt-1">Track on-site execution, checklists, and QA.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/tenant/installation/schedule" className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm shadow-indigo-200">
            <Plus size={16} /> Schedule Job
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Scheduled Today</p>
            <h3 className="text-3xl font-bold text-slate-900">{data?.scheduledToday || 0}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Calendar size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">In Progress</p>
            <h3 className="text-3xl font-bold text-slate-900">{data?.inProgress || 0}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Wrench size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Pending Review</p>
            <h3 className="text-3xl font-bold text-slate-900">{data?.pendingReview || 0}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Activity size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Delayed</p>
            <h3 className="text-3xl font-bold text-slate-900">{data?.delayed || 0}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
            <AlertTriangle size={24} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link href="/tenant/installation/jobs" className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-indigo-500 hover:shadow-md transition-all group">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Wrench size={20} />
          </div>
          <h3 className="font-bold text-slate-800 text-lg">All Jobs</h3>
          <p className="text-sm text-slate-500 mt-1">View the master list of installation jobs.</p>
        </Link>
        
        <Link href="/tenant/installation/calendar" className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-indigo-500 hover:shadow-md transition-all group">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Calendar size={20} />
          </div>
          <h3 className="font-bold text-slate-800 text-lg">Calendar</h3>
          <p className="text-sm text-slate-500 mt-1">View team assignments and schedules visually.</p>
        </Link>

        <Link href="/tenant/installation/checklists" className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-indigo-500 hover:shadow-md transition-all group">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <CheckCircle size={20} />
          </div>
          <h3 className="font-bold text-slate-800 text-lg">Checklist Templates</h3>
          <p className="text-sm text-slate-500 mt-1">Manage standard QA checklists for field engineers.</p>
        </Link>
      </div>
    </div>
  );
}
