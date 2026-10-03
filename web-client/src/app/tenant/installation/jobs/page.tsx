"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { 
  Plus, Search, Filter, Calendar, MapPin, User, ChevronRight, Activity, Clock
} from 'lucide-react';

export default function InstallationJobsList() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    fetchJobs();
  }, [statusFilter]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/installations`, {
        params: { status: statusFilter },
        withCredentials: true
      });
      setJobs(res.data.installations || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'SCHEDULED': return 'bg-blue-50 text-blue-600';
      case 'IN_PROGRESS': return 'bg-amber-50 text-amber-600';
      case 'PENDING_REVIEW': return 'bg-purple-50 text-purple-600';
      case 'COMPLETED': return 'bg-emerald-50 text-emerald-600';
      case 'DELAYED': return 'bg-red-50 text-red-600';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/tenant/installation" className="text-slate-400 hover:text-indigo-600 transition-colors">Installations</Link>
          <span className="text-slate-300">/</span>
          <h1 className="text-2xl font-bold text-slate-900">All Jobs</h1>
        </div>
        <Link href="/tenant/installation/schedule" className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm shadow-indigo-200">
          <Plus size={16} /> Schedule Job
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex gap-4">
          <div className="flex bg-slate-100 p-1 rounded-lg">
            {['ALL', 'SCHEDULED', 'IN_PROGRESS', 'PENDING_REVIEW', 'COMPLETED', 'DELAYED'].map(s => (
              <button 
                key={s}
                onClick={() => setStatusFilter(s)}
                className={"px-4 py-1.5 text-sm font-semibold rounded-md transition-colors " + (statusFilter === s ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700')}
              >
                {s.replace('_', ' ')}
              </button>
            ))}
          </div>
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by job ID, project, or customer..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm"
            />
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {loading ? (
            <div className="p-12 text-center text-slate-400">Loading jobs...</div>
          ) : jobs.length === 0 ? (
            <div className="p-12 text-center text-slate-400">No installation jobs found matching this criteria.</div>
          ) : (
            jobs.map(job => (
              <div key={job.id} className="p-6 hover:bg-slate-50 transition-colors group flex items-center justify-between">
                <div className="flex gap-6 items-center flex-1">
                  <div className="w-12 h-12 bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center font-bold text-xs">
                    {job.progressPercent}%
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <Link href={"/tenant/installation/" + job.id} className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {job.jobId}
                      </Link>
                      <span className={"px-2.5 py-1 rounded-lg text-xs font-bold " + getStatusColor(job.status)}>
                        {job.status.replace('_', ' ')}
                      </span>
                      {job.priority === 'HIGH' && (
                        <span className="px-2.5 py-1 bg-red-50 text-red-600 rounded-lg text-xs font-bold">URGENT</span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-6 text-sm text-slate-500 font-medium">
                      <span className="flex items-center gap-1.5"><User size={14} className="text-slate-400" /> {job.customer?.name} ({job.project?.name})</span>
                      <span className="flex items-center gap-1.5"><Calendar size={14} className="text-slate-400" /> {job.scheduledDate ? new Date(job.scheduledDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Unscheduled'}</span>
                      <span className="flex items-center gap-1.5"><MapPin size={14} className="text-slate-400" /> {job.city || 'No Location'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex -space-x-2">
                    {job.assignments?.map((a: any, i: number) => (
                      <div key={i} className="w-8 h-8 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center text-indigo-700 font-bold text-xs" title={a.user?.name}>
                        {a.user?.name?.substring(0, 2).toUpperCase()}
                      </div>
                    ))}
                  </div>
                  <Link href={"/tenant/installation/" + job.id} className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                    <ChevronRight size={20} />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
