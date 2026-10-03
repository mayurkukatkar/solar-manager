"use client";
import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Briefcase, Plus, Search, Filter, 
  ArrowRight, Activity, DollarSign, Clock, AlertTriangle, CheckCircle2, TrendingUp
} from 'lucide-react';

export default function ProjectsDashboard() {
  const router = useRouter();
  const [projects, setProjects] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL'); // ALL, IN_PROGRESS, DELAYED, COMPLETED

  const fetchProjects = async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/projects`, { withCredentials: true });
      setProjects(res.data.projects || []);
      setMetrics(res.data.metrics || {});
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const filteredProjects = projects.filter(p => {
    if (filter === 'ALL') return true;
    if (filter === 'IN_PROGRESS') return ['Planning', 'Design', 'Procurement', 'Installation', 'Testing'].includes(p.currentStage) && p.status !== 'Delayed';
    if (filter === 'DELAYED') return p.status === 'Delayed';
    if (filter === 'COMPLETED') return p.currentStage === 'Completed';
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Not Started': return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'In Progress': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'On Hold': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Delayed': return 'bg-red-50 text-red-700 border-red-200';
      case 'Completed': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Cancelled': return 'bg-slate-100 text-slate-500 border-slate-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div></div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Briefcase className="text-emerald-600" /> Projects Dashboard
          </h1>
          <p className="text-slate-500 mt-1 text-sm">Manage all solar installations and operational workflows</p>
        </div>
        <button 
          onClick={() => router.push('/tenant/projects/new')}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium text-sm transition-colors shadow-sm flex items-center gap-2"
        >
          <Plus size={16} /> Create Project
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-start justify-between group hover:border-emerald-200 transition-colors">
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Total Projects</p>
            <h3 className="text-3xl font-bold text-slate-900">{metrics?.total || 0}</h3>
            <p className="text-xs font-medium text-emerald-600 mt-2 flex items-center gap-1">
              <Activity size={12} /> {metrics?.inProgress || 0} In Progress
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
            <Briefcase size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-start justify-between group hover:border-blue-200 transition-colors">
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Project Value</p>
            <h3 className="text-3xl font-bold text-slate-900">₹{((metrics?.totalValue || 0) / 100000).toFixed(2)}L</h3>
            <p className="text-xs font-medium text-blue-600 mt-2 flex items-center gap-1">
              <DollarSign size={12} /> Estimated Revenue
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
            <TrendingUp size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-start justify-between group hover:border-red-200 transition-colors">
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Delayed</p>
            <h3 className="text-3xl font-bold text-slate-900">{metrics?.delayed || 0}</h3>
            <p className="text-xs font-medium text-red-600 mt-2 flex items-center gap-1">
              <AlertTriangle size={12} /> Requires Attention
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-red-50 group-hover:text-red-600 transition-colors">
            <Clock size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-start justify-between group hover:border-purple-200 transition-colors">
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Expected Profit</p>
            <h3 className="text-3xl font-bold text-slate-900">₹{((metrics?.expectedProfit || 0) / 100000).toFixed(2)}L</h3>
            <p className="text-xs font-medium text-purple-600 mt-2 flex items-center gap-1">
              <CheckCircle2 size={12} /> Based on estimates
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-purple-50 group-hover:text-purple-600 transition-colors">
            <DollarSign size={24} />
          </div>
        </div>
      </div>

      {/* Projects List */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input type="text" placeholder="Search projects..." className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none w-64" />
            </div>
            <button className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 transition-colors">
              <Filter size={16} />
            </button>
          </div>
          
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button onClick={() => setFilter('ALL')} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${filter === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>All</button>
            <button onClick={() => setFilter('IN_PROGRESS')} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${filter === 'IN_PROGRESS' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>In Progress</button>
            <button onClick={() => setFilter('DELAYED')} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${filter === 'DELAYED' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Delayed</button>
            <button onClick={() => setFilter('COMPLETED')} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${filter === 'COMPLETED' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Completed</button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                <th className="p-4 font-semibold">Project</th>
                <th className="p-4 font-semibold">Customer & Specs</th>
                <th className="p-4 font-semibold">Stage & Progress</th>
                <th className="p-4 font-semibold text-center">Status</th>
                <th className="p-4 font-semibold text-right">Value</th>
                <th className="p-4 font-semibold"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredProjects.map((project) => (
                <tr key={project.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="p-4">
                    <div className="font-bold text-slate-900">{project.projectNumber}</div>
                    <div className="text-slate-500 text-xs mt-0.5">{project.name}</div>
                    <div className="text-slate-400 text-xs mt-1 flex items-center gap-1">
                      <Briefcase size={10} /> Owner: {project.projectOwner?.name || 'Unassigned'}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="font-medium text-slate-800">{project.customer?.name || 'Unknown'}</div>
                    <div className="text-slate-500 text-xs mt-0.5">{project.capacity} {project.capacityUnit} • {project.systemType || 'Solar'}</div>
                    <div className="text-slate-400 text-xs mt-1">Due: {project.expectedCompletionDate ? new Date(project.expectedCompletionDate).toLocaleDateString() : 'N/A'}</div>
                  </td>
                  <td className="p-4">
                    <div className="font-medium text-slate-800 text-sm mb-1">{project.currentStage}</div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 max-w-[150px]">
                      <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${project.progressPercent || 0}%` }}></div>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">{project.progressPercent || 0}% Completed</div>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${getStatusColor(project.status)}`}>
                      {project.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="font-medium text-slate-900">₹{(project.estimatedValue || 0).toLocaleString()}</div>
                    <div className="text-xs text-slate-500 mt-0.5">Est. Cost: ₹{(project.estimatedCost || 0).toLocaleString()}</div>
                  </td>
                  <td className="p-4 text-right">
                    <Link href={`/tenant/projects/${project.id}`} className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 transition-all">
                      <ArrowRight size={16} />
                    </Link>
                  </td>
                </tr>
              ))}
              {filteredProjects.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <Briefcase size={32} className="text-slate-300 mb-2" />
                      <p>No projects found matching the selected filters.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
