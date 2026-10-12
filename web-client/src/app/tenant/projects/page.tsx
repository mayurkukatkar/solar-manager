"use client";

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Briefcase, Plus, Search, Filter, ArrowRight, Activity, 
  DollarSign, Clock, AlertTriangle, CheckCircle2, TrendingUp,
  Sun, Zap, Trash2, ExternalLink, RefreshCw, X, ChevronRight,
  User, MapPin, FileText, Loader2, ArrowUpRight, ShieldCheck, 
  Layers, CheckCheck, Phone, CheckSquare, LayoutGrid, List
} from 'lucide-react';

export default function ProjectsDashboard() {
  const router = useRouter();
  const [projects, setProjects] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);

  // VIEW MODE: 'TABLE' | 'CARDS'
  const [viewMode, setViewMode] = useState<'TABLE' | 'CARDS'>('TABLE');

  // Load saved view mode
  useEffect(() => {
    try {
      const saved = localStorage.getItem('solar_projects_view_mode');
      if (saved === 'TABLE' || saved === 'CARDS') setViewMode(saved);
    } catch (e) {}
  }, []);

  const handleViewModeChange = (mode: 'TABLE' | 'CARDS') => {
    setViewMode(mode);
    try {
      localStorage.setItem('solar_projects_view_mode', mode);
    } catch (e) {}
  };

  // FILTERS & SEARCH
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL'); // ALL, IN_PROGRESS, DELAYED, COMPLETED
  const [selectedStage, setSelectedStage] = useState('ALL'); // ALL, Planning, Design, Procurement, Installation, Testing, Handover, Completed

  // QUICK STAGE ADVANCE MODAL
  const [stageModalProject, setStageModalProject] = useState<any | null>(null);
  const [advancingStage, setAdvancingStage] = useState(false);
  const [targetStage, setTargetStage] = useState('Planning');
  const [stageNote, setStageNote] = useState('');

  const fetchProjects = async () => {
    try {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/projects`, 
        { withCredentials: true }
      );
      setProjects(res.data.projects || []);
      setMetrics(res.data.metrics || {});
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchProjects();
  };

  // Filtered project list
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      // 1. Status Filter
      if (selectedStatus === 'IN_PROGRESS') {
        const inProgressStages = ['Design', 'Procurement', 'Installation', 'Testing'];
        if (!inProgressStages.includes(p.currentStage) || p.status === 'Delayed') return false;
      } else if (selectedStatus === 'DELAYED') {
        if (p.status !== 'Delayed') return false;
      } else if (selectedStatus === 'COMPLETED') {
        if (p.currentStage !== 'Completed') return false;
      }

      // 2. Stage Filter
      if (selectedStage !== 'ALL') {
        if (p.currentStage !== selectedStage) return false;
      }

      // 3. Search Query
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const client = p.customer || p.lead;
        const matchNumber = (p.projectNumber || '').toLowerCase().includes(q);
        const matchName = (p.name || '').toLowerCase().includes(q);
        const matchCustomer = (client?.name || '').toLowerCase().includes(q);
        const matchPhone = (client?.mobile || client?.phone || '').includes(q);
        const matchCity = (p.city || '').toLowerCase().includes(q);
        const matchQuote = (p.quotation?.qNumber || '').toLowerCase().includes(q);
        if (!matchNumber && !matchName && !matchCustomer && !matchPhone && !matchCity && !matchQuote) {
          return false;
        }
      }

      return true;
    });
  }, [projects, selectedStatus, selectedStage, searchTerm]);

  // Handle stage change from quick modal
  const handleQuickStageAdvance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stageModalProject) return;

    setAdvancingStage(true);
    try {
      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/projects/${stageModalProject.id}/stage`,
        { 
          newStage: targetStage, 
          comment: stageNote || `Stage advanced to ${targetStage} from project dashboard` 
        },
        { withCredentials: true }
      );
      setStageModalProject(null);
      setStageNote('');
      fetchProjects();
    } catch (err: any) {
      alert('Failed to update stage: ' + (err.response?.data?.error || err.message));
    } finally {
      setAdvancingStage(false);
    }
  };

  // Handle delete project
  const handleDeleteProject = async (project: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to permanently delete project ${project.projectNumber} (${project.name})? This will delete associated tasks and milestones.`)) {
      return;
    }

    setDeletingProjectId(project.id);
    try {
      setProjects(prev => prev.filter(p => p.id !== project.id));
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/projects/${project.id}`,
        { withCredentials: true }
      );
      fetchProjects();
    } catch (err: any) {
      alert('Failed to delete project: ' + (err.response?.data?.error || err.message));
      fetchProjects();
    } finally {
      setDeletingProjectId(null);
    }
  };

  const getStageBadge = (stage: string) => {
    switch (stage) {
      case 'Planning':
        return <span className="px-2.5 py-1 text-[11px] font-extrabold rounded-full bg-slate-100 text-slate-700 border border-slate-200">Planning</span>;
      case 'Design':
        return <span className="px-2.5 py-1 text-[11px] font-extrabold rounded-full bg-blue-50 text-blue-700 border border-blue-200">Engineering Design</span>;
      case 'Procurement':
        return <span className="px-2.5 py-1 text-[11px] font-extrabold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">Procurement & BOM</span>;
      case 'Installation':
        return <span className="px-2.5 py-1 text-[11px] font-extrabold rounded-full bg-amber-50 text-amber-800 border border-amber-200">Site Installation</span>;
      case 'Testing':
        return <span className="px-2.5 py-1 text-[11px] font-extrabold rounded-full bg-purple-50 text-purple-700 border border-purple-200">Testing & QA</span>;
      case 'Handover':
        return <span className="px-2.5 py-1 text-[11px] font-extrabold rounded-full bg-teal-50 text-teal-700 border border-teal-200">Client Handover</span>;
      case 'Completed':
        return <span className="px-2.5 py-1 text-[11px] font-extrabold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1"><CheckCircle2 size={12} /> Commissioned</span>;
      default:
        return <span className="px-2.5 py-1 text-[11px] font-extrabold rounded-full bg-slate-100 text-slate-700">{stage}</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'In Progress':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-50 text-blue-700 border border-blue-200">In Progress</span>;
      case 'Delayed':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-50 text-red-700 border border-red-200 flex items-center gap-0.5"><AlertTriangle size={10} /> Delayed</span>;
      case 'On Hold':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-50 text-amber-800 border border-amber-200">On Hold</span>;
      case 'Completed':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Completed</span>;
      default:
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-100 text-slate-600">{status}</span>;
    }
  };

  return (
    <div className="w-full space-y-6 pb-16 min-w-0">
      
      {/* HEADER SECTION */}
      <div className="bg-gradient-to-r from-[#071A2B] via-[#0D2847] to-[#0A3C36] p-6 sm:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shrink-0">
                <Briefcase size={18} />
              </span>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Projects Studio
              </h1>
              <span className="px-2.5 py-0.5 text-xs font-bold bg-white/10 rounded-full text-slate-300 border border-white/10 shrink-0">
                {projects.length} Total
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Orchestrate rooftop solar PV execution: engineering design, procurement BOMs, site installations, MSEDCL net metering liasoning, and completion handovers.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all border border-white/10 cursor-pointer disabled:opacity-50"
              title="Refresh project list"
            >
              <RefreshCw size={16} className={isRefreshing ? "animate-spin text-emerald-400" : ""} />
            </button>
            <Link
              href="/tenant/projects/new"
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-[#071A2B] font-black rounded-xl text-xs sm:text-sm transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2 cursor-pointer shrink-0 whitespace-nowrap"
            >
              <Plus size={16} className="stroke-[3]" /> Create New Project
            </Link>
          </div>
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3.5 sm:gap-4">
        {/* CARD 1: ACTIVE INSTALLATIONS */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between hover:border-blue-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Active Pipeline</span>
            <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
              <Activity size={15} />
            </span>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">{metrics?.inProgress || 0}</h3>
            <p className="text-[11px] text-blue-600 font-semibold mt-0.5">Execution in Flight</p>
          </div>
        </div>

        {/* CARD 2: TOTAL CAPACITY */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between hover:border-emerald-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Committed Capacity</span>
            <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
              <Sun size={15} />
            </span>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">{metrics?.totalCapacity || 0} <span className="text-xs font-bold text-slate-500">kWp</span></h3>
            <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">PV Plant Generation</p>
          </div>
        </div>

        {/* CARD 3: CONTRACT REVENUE */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between hover:border-indigo-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Contract Value</span>
            <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
              <DollarSign size={15} />
            </span>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">₹{((metrics?.totalValue || 0) / 100000).toFixed(2)}L</h3>
            <p className="text-[11px] text-indigo-600 font-semibold mt-0.5">Est. Profit: ₹{((metrics?.expectedProfit || 0) / 100000).toFixed(2)}L</p>
          </div>
        </div>

        {/* CARD 4: COMPLETED PROJECTS */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between hover:border-teal-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Commissioned</span>
            <span className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center font-bold text-xs">
              <CheckCircle2 size={15} />
            </span>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">{metrics?.completed || 0}</h3>
            <p className="text-[11px] text-teal-600 font-semibold mt-0.5">Handover & AMC Active</p>
          </div>
        </div>

        {/* CARD 5: DELAYED / REQUIRING ATTENTION */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between hover:border-amber-300 transition-colors col-span-2 sm:col-span-1 xl:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Attention Needed</span>
            <span className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs">
              <Clock size={15} />
            </span>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-amber-600 tracking-tight">{metrics?.delayed || 0}</h3>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">Delayed Milestones</p>
          </div>
        </div>
      </div>

      {/* TOOLBAR: SEARCH & FILTERS & VIEW MODE */}
      <div className="bg-white rounded-2xl p-3.5 sm:p-4 shadow-sm border border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sm:gap-4">
        
        {/* SEARCH BAR */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by project #, name, customer, city, or quotation..."
            className="w-full pl-10 pr-9 py-2 bg-slate-50 hover:bg-slate-100/80 focus:bg-white rounded-xl border border-slate-200 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* STATUS TABS, STAGE DROPDOWN & VIEW MODE */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* VIEW MODE TOGGLE */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
            <button
              type="button"
              onClick={() => handleViewModeChange('TABLE')}
              className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'TABLE' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
              }`}
              title="Compact Table View (Fits completely on screen)"
            >
              <List size={13} />
              <span>Table</span>
            </button>
            <button
              type="button"
              onClick={() => handleViewModeChange('CARDS')}
              className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'CARDS' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
              }`}
              title="Cards Studio View"
            >
              <LayoutGrid size={13} />
              <span>Cards</span>
            </button>
          </div>

          {/* STAGE SELECTOR */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs">
            <span className="text-slate-400 font-semibold text-[11px]">Stage:</span>
            <select
              value={selectedStage}
              onChange={e => setSelectedStage(e.target.value)}
              className="bg-transparent text-slate-800 font-bold outline-none cursor-pointer text-xs"
            >
              <option value="ALL">All Stages</option>
              <option value="Planning">Planning ({metrics?.planning || 0})</option>
              <option value="Design">Design ({metrics?.design || 0})</option>
              <option value="Procurement">Procurement ({metrics?.procurement || 0})</option>
              <option value="Installation">Installation ({metrics?.installation || 0})</option>
              <option value="Testing">Testing ({metrics?.testing || 0})</option>
              <option value="Handover">Handover ({metrics?.handover || 0})</option>
              <option value="Completed">Completed ({metrics?.completed || 0})</option>
            </select>
          </div>

          {/* STATUS PILLS */}
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600 flex-wrap">
            <button
              onClick={() => setSelectedStatus('ALL')}
              className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                selectedStatus === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'hover:text-slate-900'
              }`}
            >
              All ({projects.length})
            </button>
            <button
              onClick={() => setSelectedStatus('IN_PROGRESS')}
              className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                selectedStatus === 'IN_PROGRESS' ? 'bg-white text-slate-900 shadow-sm' : 'hover:text-slate-900'
              }`}
            >
              Active ({metrics?.inProgress || 0})
            </button>
            <button
              onClick={() => setSelectedStatus('DELAYED')}
              className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                selectedStatus === 'DELAYED' ? 'bg-white text-slate-900 shadow-sm' : 'hover:text-slate-900'
              }`}
            >
              Delayed ({metrics?.delayed || 0})
            </button>
            <button
              onClick={() => setSelectedStatus('COMPLETED')}
              className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                selectedStatus === 'COMPLETED' ? 'bg-white text-slate-900 shadow-sm' : 'hover:text-slate-900'
              }`}
            >
              Done ({metrics?.completed || 0})
            </button>
          </div>
        </div>
      </div>

      {/* VIEW RENDER: CARDS OR DENSE 5-COLUMN TABLE */}
      {viewMode === 'CARDS' ? (
        /* CARDS STUDIO VIEW - 100% RESPONSIVE, ZERO SLIDING */
        <div className="space-y-4">
          {loading ? (
            <div className="bg-white rounded-3xl p-16 text-center border border-slate-200">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
              <p className="text-xs text-slate-400 mt-2 font-medium">Loading solar installations...</p>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="bg-white rounded-3xl p-16 text-center border border-slate-200">
              <Briefcase size={36} className="text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">No projects found</p>
              <p className="text-xs text-slate-400 mt-1">Try adjusting your filters or create a new project.</p>
              <Link
                href="/tenant/projects/new"
                className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={14} /> Create Project
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredProjects.map((project) => {
                const client = project.customer || project.lead;
                const isDeleting = deletingProjectId === project.id;
                const discom = project.discomApplication;
                const subsidy = project.subsidies && project.subsidies.length > 0 ? project.subsidies[0] : null;

                return (
                  <div
                    key={project.id}
                    onClick={() => router.push(`/tenant/projects/${project.id}`)}
                    className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group space-y-4 relative"
                  >
                    {/* Top: Project ID & Stage */}
                    <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
                          <Briefcase size={15} />
                        </span>
                        <div>
                          <span className="font-extrabold text-slate-900 text-xs block group-hover:text-emerald-700 transition-colors">
                            {project.projectNumber || 'PRJ-NEW'}
                          </span>
                          <span className="text-[10px] text-slate-400 block">{new Date(project.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div>{getStageBadge(project.currentStage)}</div>
                    </div>

                    {/* Middle: Name, Client & Specs */}
                    <div className="space-y-2">
                      <h4 className="font-bold text-slate-800 text-sm line-clamp-1 group-hover:text-emerald-800 transition-colors">
                        {project.name}
                      </h4>

                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold uppercase text-slate-600 shrink-0">
                          {(client?.name || 'C')[0]}
                        </span>
                        <span className="font-semibold truncate">{client?.name || 'Solar Client'}</span>
                        <span className="text-slate-400 text-[11px] flex items-center gap-0.5 ml-auto shrink-0">
                          <MapPin size={11} /> {project.city || client?.city || 'Pune'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap pt-1">
                        <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {project.capacity || 5} kWp · {project.systemType || 'On-Grid'}
                        </span>
                        {project.quotation && (
                          <span className="text-[10px] font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            #{project.quotation.qNumber}
                          </span>
                        )}
                        {discom && (
                          <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 flex items-center gap-0.5">
                            <Zap size={10} /> {discom.status || 'MSEDCL'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Bottom: Financials, Progress Bar, Actions */}
                    <div className="border-t border-slate-100 pt-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Contract Value</span>
                          <strong className="text-base font-black text-slate-900">₹{(project.estimatedValue || 0).toLocaleString()}</strong>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 font-bold block">Stage Progress</span>
                          <span className="text-xs font-black text-emerald-700">{Math.round(project.progressPercent || 0)}%</span>
                        </div>
                      </div>

                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${project.progressPercent || 0}%` }} />
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            title="Quick Stage Advance"
                            onClick={(e) => {
                              e.stopPropagation();
                              setStageModalProject(project);
                              setTargetStage(project.currentStage);
                              setStageNote('');
                            }}
                            className="p-2 text-slate-500 hover:text-indigo-600 rounded-xl hover:bg-indigo-50 border border-slate-200 transition-colors cursor-pointer"
                          >
                            <Layers size={14} />
                          </button>
                          <button
                            type="button"
                            title="Delete Project"
                            disabled={isDeleting}
                            onClick={(e) => handleDeleteProject(project, e)}
                            className="p-2 text-slate-400 hover:text-red-600 rounded-xl hover:bg-red-50 border border-slate-200 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            {isDeleting ? <Loader2 size={14} className="animate-spin text-red-500" /> : <Trash2 size={14} />}
                          </button>
                        </div>

                        <Link
                          href={`/tenant/projects/${project.id}`}
                          className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                        >
                          <span>Open 360° Studio</span>
                          <ChevronRight size={14} />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* DENSE 5-COLUMN TABLE VIEW - ZERO HORIZONTAL SCROLL REQUIRED */
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200 overflow-hidden w-full">
          <div className="overflow-x-auto w-full custom-scrollbar">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] font-extrabold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3.5">Project ID & Plant Specs</th>
                  <th className="px-4 py-3.5">Customer & Location</th>
                  <th className="px-4 py-3.5">Contract & Proposal</th>
                  <th className="px-4 py-3.5">Stage & Grid Liasoning</th>
                  <th className="px-4 py-3.5 text-right sticky right-0 bg-slate-50 border-l border-slate-200 z-10 shadow-[-4px_0_8px_rgba(0,0,0,0.02)]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                      <p className="text-xs text-slate-400 mt-2 font-medium">Loading solar installations...</p>
                    </td>
                  </tr>
                ) : filteredProjects.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center">
                      <Briefcase size={36} className="text-slate-300 mx-auto mb-2" />
                      <p className="text-sm font-bold text-slate-700">No projects found</p>
                      <p className="text-xs text-slate-400 mt-1">
                        {searchTerm ? 'Try adjusting your search filters.' : 'Create your first project or convert an accepted quotation.'}
                      </p>
                      <Link
                        href="/tenant/projects/new"
                        className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus size={14} /> Create Project
                      </Link>
                    </td>
                  </tr>
                ) : (
                  filteredProjects.map((project) => {
                    const client = project.customer || project.lead;
                    const isDeleting = deletingProjectId === project.id;
                    const discom = project.discomApplication;
                    const subsidy = project.subsidies && project.subsidies.length > 0 ? project.subsidies[0] : null;

                    return (
                      <tr
                        key={project.id}
                        onClick={() => router.push(`/tenant/projects/${project.id}`)}
                        className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                      >
                        {/* 1. PROJECT & SPECS */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <span className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs group-hover:bg-emerald-50 group-hover:text-emerald-700 transition-colors shrink-0">
                              <Briefcase size={15} />
                            </span>
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-extrabold text-slate-900 group-hover:text-emerald-700 transition-colors text-xs">
                                  {project.projectNumber || 'PRJ-NEW'}
                                </span>
                                <span className="text-[10px] font-bold px-1.5 py-0.2 bg-emerald-50 text-emerald-700 rounded border border-emerald-200">
                                  {project.capacity || 5} kWp · {project.systemType || 'On-Grid'}
                                </span>
                              </div>
                              <span className="text-[11px] text-slate-600 font-semibold block truncate max-w-[210px] mt-0.5">
                                {project.name}
                              </span>
                              <span className="text-[10px] text-slate-400 block mt-0.5">
                                Created {new Date(project.createdAt).toLocaleDateString()} · {project.projectType || 'Residential'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* 2. CUSTOMER & SITE */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px] font-bold uppercase shrink-0">
                              {(client?.name || 'C')[0]}
                            </span>
                            <div>
                              <p className="font-bold text-slate-800 text-xs truncate max-w-[170px]">{client?.name || 'Solar Client'}</p>
                              <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                                <MapPin size={10} /> {project.city || client?.city || 'Pune'}, {project.state || 'Maharashtra'}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* 3. CONTRACT & PROPOSAL */}
                        <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                          <div>
                            <p className="font-black text-slate-900 text-xs">
                              ₹{(project.estimatedValue || 0).toLocaleString()}
                            </p>
                            {project.quotation ? (
                              <Link
                                href={`/tenant/quotations?search=${project.quotation.qNumber}`}
                                title={`View linked quotation: ${project.quotation.qNumber}`}
                                className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-700 hover:text-emerald-900 mt-0.5 bg-emerald-50 hover:bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-200 transition"
                              >
                                <FileText size={10} /> {project.quotation.qNumber}
                              </Link>
                            ) : (
                              <span className="text-[10px] text-slate-400 block mt-0.5">Direct Entry</span>
                            )}
                          </div>
                        </td>

                        {/* 4. STAGE & GRID LIASONING */}
                        <td className="px-4 py-3.5">
                          <div className="space-y-1.5 min-w-[150px]">
                            <div className="flex items-center justify-between gap-1">
                              {getStageBadge(project.currentStage)}
                              <span className="text-[10px] font-bold text-slate-500">
                                {Math.round(project.progressPercent || 0)}%
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div 
                                className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
                                style={{ width: `${project.progressPercent || 0}%` }}
                              />
                            </div>
                            <div className="flex items-center gap-1 flex-wrap pt-0.5">
                              {discom ? (
                                <span className="text-[9px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 flex items-center gap-0.5">
                                  <Zap size={9} /> {discom.status || 'MSEDCL'}
                                </span>
                              ) : (
                                <span className="text-[9px] text-slate-400">DISCOM: Pending</span>
                              )}
                              {subsidy && (
                                <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                  Subsidy
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* 5. ACTIONS - STICKY PINNED RIGHT */}
                        <td className="px-4 py-3.5 text-right sticky right-0 bg-white group-hover:bg-slate-50/95 transition-colors border-l border-slate-100 z-10 shadow-[-6px_0_12px_rgba(0,0,0,0.03)]" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            
                            {/* QUICK STAGE ADVANCEMENT MODAL */}
                            <button
                              type="button"
                              title="Quick Advance Project Stage"
                              onClick={(e) => {
                                e.stopPropagation();
                                setStageModalProject(project);
                                setTargetStage(project.currentStage);
                                setStageNote('');
                              }}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 transition-colors cursor-pointer"
                            >
                              <Layers size={14} />
                            </button>

                            {/* 360 HUB */}
                            <Link
                              href={`/tenant/projects/${project.id}`}
                              title="Open Project 360° Studio Hub"
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer whitespace-nowrap"
                            >
                              <span>360° Hub</span>
                              <ChevronRight size={13} />
                            </Link>

                            {/* DELETE PROJECT */}
                            <button
                              type="button"
                              title="Delete Project"
                              disabled={isDeleting}
                              onClick={(e) => handleDeleteProject(project, e)}
                              className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50"
                            >
                              {isDeleting ? <Loader2 size={14} className="animate-spin text-red-500" /> : <Trash2 size={14} />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* QUICK STAGE ADVANCEMENT MODAL */}
      {stageModalProject && (
        <div className="fixed inset-0 z-50 bg-[#071A2B]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <Layers size={16} />
                </span>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">Update Project Stage</h3>
                  <p className="text-[11px] text-slate-400">{stageModalProject.projectNumber} · {stageModalProject.name}</p>
                </div>
              </div>
              <button 
                onClick={() => setStageModalProject(null)} 
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleQuickStageAdvance} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-extrabold text-slate-700 uppercase">Current Stage</label>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>{stageModalProject.currentStage}</span>
                  <span className="text-slate-400 font-medium">Progress: {stageModalProject.progressPercent}%</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-extrabold text-slate-700 uppercase">Target Stage *</label>
                <select
                  value={targetStage}
                  onChange={e => setTargetStage(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="Planning">01. Planning (15% Progress)</option>
                  <option value="Design">02. Engineering Design (30% Progress)</option>
                  <option value="Procurement">03. Procurement & BOM Sync (50% Progress)</option>
                  <option value="Installation">04. Site Installation (75% Progress)</option>
                  <option value="Testing">05. Testing & QA (90% Progress)</option>
                  <option value="Handover">06. Client Handover (95% Progress)</option>
                  <option value="Completed">07. Commissioned & Completed (100% Progress)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-extrabold text-slate-700 uppercase">Transition Note / Activity Log</label>
                <textarea
                  rows={3}
                  value={stageNote}
                  onChange={e => setStageNote(e.target.value)}
                  placeholder="e.g. Structure erection finished, solar inverter delivery verified on site..."
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStageModalProject(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={advancingStage || targetStage === stageModalProject.currentStage}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {advancingStage ? <Loader2 size={14} className="animate-spin" /> : <CheckCheck size={14} />}
                  {advancingStage ? 'Advancing Stage...' : 'Confirm Stage Advance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
