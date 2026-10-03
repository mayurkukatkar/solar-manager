"use client";
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { 
  ArrowLeft, Calendar, User, MapPin, CheckCircle, Package, Camera, Activity, FileText, Wrench, AlertTriangle
} from 'lucide-react';

export default function InstallationDetails() {
  const { id } = useParams();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('OVERVIEW');

  useEffect(() => {
    fetchJob();
  }, [id]);

  const fetchJob = async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/installations/` + id, { withCredentials: true });
      setJob(res.data.installation);
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

  if (loading) return <div className="flex justify-center items-center h-64 text-slate-400">Loading job details...</div>;
  if (!job) return <div className="flex justify-center items-center h-64 text-slate-400">Job not found</div>;

  const tabs = [
    { id: 'OVERVIEW', label: 'Overview', icon: Activity },
    { id: 'TEAM', label: 'Team', icon: User },
    { id: 'CHECKLIST', label: 'Checklist', icon: CheckCircle },
    { id: 'MATERIALS', label: 'Materials', icon: Package },
    { id: 'PHOTOS', label: 'Photos', icon: Camera },
    { id: 'ISSUES', label: 'Issues', icon: AlertTriangle },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* HEADER */}
      <div className="flex items-center gap-3">
        <Link href="/tenant/installation/jobs" className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-500">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{job.jobId}</h1>
            <span className={"px-2.5 py-1 rounded-lg text-xs font-bold " + getStatusColor(job.status)}>
              {job.status.replace('_', ' ')}
            </span>
          </div>
          <p className="text-sm text-slate-500">{job.customer?.name} - {job.project?.name}</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors text-sm">
            Update Status
          </button>
          <button className="px-4 py-2 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors text-sm">
            Mark Complete
          </button>
        </div>
      </div>

      {/* PROGRESS BAR */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex justify-between items-end mb-2">
          <div>
            <h3 className="font-bold text-slate-800">Installation Progress</h3>
            <p className="text-xs text-slate-500">Based on checklist completion</p>
          </div>
          <span className="text-2xl font-black text-indigo-600">{job.progressPercent}%</span>
        </div>
        <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-indigo-600 rounded-full transition-all duration-500" style={{ width: job.progressPercent + '%' }}></div>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex space-x-2 border-b border-slate-200 overflow-x-auto pb-px">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={"flex items-center gap-2 px-4 py-3 font-semibold text-sm transition-colors border-b-2 whitespace-nowrap " + (activeTab === tab.id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300')}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB CONTENT */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 min-h-[400px] p-6">
        
        {activeTab === 'OVERVIEW' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4">Job Details</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-500 text-sm">Customer</span>
                    <span className="font-medium text-slate-900 text-sm">{job.customer?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 text-sm">Project</span>
                    <span className="font-medium text-indigo-600 text-sm hover:underline cursor-pointer">{job.project?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 text-sm">Location</span>
                    <span className="font-medium text-slate-900 text-sm">{job.city}, {job.state}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 text-sm">System Capacity</span>
                    <span className="font-medium text-slate-900 text-sm">{job.project?.systemCapacity}kW</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4">Schedule Details</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-500 text-sm">Scheduled Date</span>
                    <span className="font-medium text-slate-900 text-sm">
                      {job.scheduledDate ? new Date(job.scheduledDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 text-sm">Start Time</span>
                    <span className="font-medium text-slate-900 text-sm">{job.scheduledStartTime || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 text-sm">Est. Duration</span>
                    <span className="font-medium text-slate-900 text-sm">{job.estimatedDuration ? job.estimatedDuration + ' hours' : 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'CHECKLIST' && (
          <div className="text-center py-12">
            <CheckCircle size={48} className="mx-auto text-slate-200 mb-4" />
            <h3 className="text-lg font-bold text-slate-700">No Checklist Assigned</h3>
            <p className="text-slate-500 max-w-sm mx-auto mt-2 text-sm">Assign a checklist template (e.g., Residential 5kW) to track installation steps.</p>
            <button className="mt-6 px-4 py-2 bg-indigo-50 text-indigo-600 font-semibold rounded-xl hover:bg-indigo-100 transition-colors text-sm">
              Assign Template
            </button>
          </div>
        )}

        {/* Placeholder for other tabs */}
        {['TEAM', 'MATERIALS', 'PHOTOS', 'ISSUES'].includes(activeTab) && (
          <div className="text-center py-12">
            <Wrench size={48} className="mx-auto text-slate-200 mb-4" />
            <h3 className="text-lg font-bold text-slate-700">Module Component Required</h3>
            <p className="text-slate-500 max-w-sm mx-auto mt-2 text-sm">The {activeTab.toLowerCase()} component will be injected dynamically.</p>
          </div>
        )}

      </div>
    </div>
  );
}
