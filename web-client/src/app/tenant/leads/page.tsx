"use client";
import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { 
  Plus, Search, Filter, Phone, Mail, User, TrendingUp, Users, AlertCircle, 
  CheckCircle2, Flame, Zap, ArrowRight, Kanban, List, Clock, 
  Calendar, Trash2, ChevronRight, Send, MessageCircle, Sparkles, Building2, Home, MapPin, X
} from 'lucide-react';

const STAGES = [
  { id: 'NEW', label: 'New', color: 'border-blue-500 text-blue-700 bg-blue-50/70', badge: 'bg-blue-100 text-blue-700', icon: Sparkles },
  { id: 'CONTACTED', label: 'Contacted', color: 'border-indigo-500 text-indigo-700 bg-indigo-50/70', badge: 'bg-indigo-100 text-indigo-700', icon: Phone },
  { id: 'QUALIFIED', label: 'Qualified', color: 'border-purple-500 text-purple-700 bg-purple-50/70', badge: 'bg-purple-100 text-purple-700', icon: Zap },
  { id: 'SITE_SURVEY', label: 'Site Survey', color: 'border-amber-500 text-amber-700 bg-amber-50/70', badge: 'bg-amber-100 text-amber-700', icon: Calendar },
  { id: 'PROPOSAL_SENT', label: 'Proposal Sent', color: 'border-orange-500 text-orange-700 bg-orange-50/70', badge: 'bg-orange-100 text-orange-700', icon: Send },
  { id: 'NEGOTIATION', label: 'Negotiation', color: 'border-pink-500 text-pink-700 bg-pink-50/70', badge: 'bg-pink-100 text-pink-700', icon: Flame },
  { id: 'WON', label: 'Won / Customer', color: 'border-emerald-500 text-emerald-700 bg-emerald-50/70', badge: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  { id: 'LOST', label: 'Lost', color: 'border-slate-400 text-slate-600 bg-slate-50/70', badge: 'bg-slate-100 text-slate-600', icon: X }
];

export default function LeadsList() {
  const [leads, setLeads] = useState<any[]>([]);
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Dual view mode: 'kanban' | 'table'
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  
  // New Lead Modal State
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    company: '',
    customerType: 'RESIDENTIAL',
    source: 'Website',
    estimatedCap: '',
    monthlyBill: '',
    roofType: 'Concrete Flat',
    city: 'Pune',
    state: 'Maharashtra',
    notes: ''
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Quick Action Modals
  const [followupLead, setFollowupLead] = useState<any>(null);
  const [followupData, setFollowupData] = useState({ type: 'CALL', scheduledAt: '', notes: '' });
  
  const [convertLead, setConvertLead] = useState<any>(null);
  const [convertProjectName, setConvertProjectName] = useState('');
  const [converting, setConverting] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Load view mode preference
  useEffect(() => {
    try {
      const saved = localStorage.getItem('solar_leads_view_mode');
      if (saved === 'table' || saved === 'kanban') {
        setViewMode(saved);
      }
    } catch (e) {}
  }, []);

  const setViewModeWithStorage = (mode: 'kanban' | 'table') => {
    setViewMode(mode);
    try {
      localStorage.setItem('solar_leads_view_mode', mode);
    } catch (e) {}
  };

  const fetchDashboard = async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/leads/dashboard`, { withCredentials: true });
      setDashboard(res.data.dashboard);
    } catch (err) {
      console.error('Failed to load leads dashboard:', err);
    }
  };

  const fetchLeads = async () => {
    try {
      setLoading(true);
      let url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/leads?all=true&`;
      if (search) url += `search=${encodeURIComponent(search)}&`;
      if (statusFilter && statusFilter !== 'ALL') url += `status=${statusFilter}&`;
      if (sourceFilter) url += `source=${encodeURIComponent(sourceFilter)}`;
      
      const res = await axios.get(url, { withCredentials: true });
      setLeads(res.data.leads || []);
    } catch (err) {
      console.error('Failed to fetch leads:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchLeads();
    }, 250);
    return () => clearTimeout(timeoutId);
  }, [search, statusFilter, sourceFilter]);

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/leads`, {
        ...formData,
        estimatedCap: formData.estimatedCap ? parseFloat(formData.estimatedCap) : null,
        monthlyBill: formData.monthlyBill ? parseFloat(formData.monthlyBill) : null
      }, { withCredentials: true });
      
      setShowModal(false);
      setFormData({ 
        name: '', mobile: '', email: '', company: '', customerType: 'RESIDENTIAL',
        source: 'Website', estimatedCap: '', monthlyBill: '', roofType: 'Concrete Flat',
        city: 'Pune', state: 'Maharashtra', notes: '' 
      });
      fetchLeads();
      fetchDashboard();
    } catch (err: any) {
      if (err.response?.status === 409) {
        setErrorMsg('Possible duplicate lead found with this phone number or email.');
      } else {
        setErrorMsg('Failed to create lead. Please check all fields.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStage = async (leadId: string, newStage: string) => {
    if (newStage === 'WON') {
      const target = leads.find(l => l.id === leadId);
      setConvertLead(target);
      setConvertProjectName(`${target?.name || 'Customer'} Solar Plant`);
      return;
    }

    try {
      await axios.patch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/leads/${leadId}`, {
        status: newStage
      }, { withCredentials: true });
      fetchLeads();
      fetchDashboard();
    } catch (err) {
      console.error('Failed to update stage:', err);
    }
  };

  const handleConfirmConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!convertLead) return;
    setConverting(true);
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/leads/${convertLead.id}/convert`, {
        projectName: convertProjectName
      }, { withCredentials: true });
      setConvertLead(null);
      fetchLeads();
      fetchDashboard();
    } catch (err) {
      console.error('Failed to convert lead:', err);
    } finally {
      setConverting(false);
    }
  };

  const handleScheduleFollowup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!followupLead) return;
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/leads/${followupLead.id}/followups`, followupData, { withCredentials: true });
      setFollowupLead(null);
      setFollowupData({ type: 'CALL', scheduledAt: '', notes: '' });
      fetchLeads();
    } catch (err) {
      console.error('Failed to schedule followup:', err);
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    if (!confirm('Are you sure you want to delete this lead? All associated records will be removed.')) return;
    setDeletingId(leadId);
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/leads/${leadId}`, { withCredentials: true });
      fetchLeads();
      fetchDashboard();
    } catch (err) {
      console.error('Failed to delete lead:', err);
      alert('Could not delete lead. It may already be converted to a Project.');
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const s = STAGES.find(item => item.id === status);
    return s ? s.badge : 'bg-slate-100 text-slate-700';
  };

  // Pipeline Metrics Computed Locally
  const pipelineStats = useMemo(() => {
    const totalCap = leads.reduce((acc, l) => acc + (l.estimatedCap || 0), 0);
    const activeLeads = leads.filter(l => l.status !== 'WON' && l.status !== 'LOST');
    const qualifiedLeads = leads.filter(l => ['QUALIFIED', 'SITE_SURVEY', 'PROPOSAL_SENT', 'NEGOTIATION'].includes(l.status));
    const wonCount = leads.filter(l => l.status === 'WON').length;
    return {
      totalCap: totalCap.toFixed(1),
      activeCount: activeLeads.length,
      qualifiedCount: qualifiedLeads.length,
      wonCount
    };
  }, [leads]);

  const filteredLeads = useMemo(() => {
    return leads.filter(l => {
      if (typeFilter && l.customerType !== typeFilter) return false;
      return true;
    });
  }, [leads, typeFilter]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      
      {/* CREATIVE HERO HEADER */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 rounded-3xl p-6 md:p-8 text-white shadow-xl shadow-slate-950/10 border border-slate-700/50">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold backdrop-blur-md border border-emerald-500/30">
              <Sparkles size={13} className="text-emerald-400" />
              <span>Solar Sales CRM Engine</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              Lead Management Studio
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl font-normal leading-relaxed">
              Capture enquiries, track Rooftop PV potential, automate follow-ups, and convert prospects into high-yield turnkey solar installations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* View Mode Toggle */}
            <div className="bg-slate-800/80 p-1 rounded-xl border border-slate-700 flex items-center shadow-inner">
              <button 
                onClick={() => setViewModeWithStorage('kanban')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'kanban' 
                    ? 'bg-emerald-600 text-white shadow-md' 
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Kanban Deal Pipeline"
              >
                <Kanban size={15} />
                <span>Kanban Pipeline</span>
              </button>
              <button 
                onClick={() => setViewModeWithStorage('table')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'table' 
                    ? 'bg-emerald-600 text-white shadow-md' 
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Smart High-Density Table"
              >
                <List size={15} />
                <span>Table</span>
              </button>
            </div>

            <button 
              onClick={() => setShowModal(true)}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-sm transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5 active:translate-y-0"
            >
              <Plus size={18} strokeWidth={2.5} />
              <span>Add New Lead</span>
            </button>
          </div>
        </div>

        {/* Ambient solar rays background */}
        <div className="absolute -right-16 -top-16 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute right-1/3 -bottom-20 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* METRIC KPI TILES */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80 hover:border-emerald-200 transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Pipeline</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{pipelineStats.activeCount}</span>
            <span className="text-xs font-medium text-slate-500">leads active</span>
          </div>
          <div className="mt-1 text-xs text-blue-600 font-semibold flex items-center gap-1">
            <span>⚡ {pipelineStats.totalCap} kWp total capacity</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80 hover:border-purple-200 transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">High Intent</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Flame size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{pipelineStats.qualifiedCount}</span>
            <span className="text-xs font-medium text-purple-600">hot deals</span>
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Survey scheduled or quote sent
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80 hover:border-emerald-200 transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Won & Converted</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-600">{pipelineStats.wonCount}</span>
            <span className="text-xs font-medium text-slate-500">customers</span>
          </div>
          <div className="mt-1 text-xs text-emerald-600 font-semibold flex items-center gap-1">
            <span>Converted to live EPC projects</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80 hover:border-amber-200 transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Conversion Rate</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{dashboard?.conversionRate || 0}%</span>
            <span className="text-xs font-medium text-amber-600 font-semibold">win ratio</span>
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Across all acquisition channels
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH TOOLBAR */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[260px] max-w-md">
          <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by customer name, mobile, city, company..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-9 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm transition-all placeholder:text-slate-400 font-medium"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X size={15} />
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Customer Type Quick Filter */}
          <div className="inline-flex rounded-xl border border-slate-200 p-0.5 bg-slate-50">
            <button 
              onClick={() => setTypeFilter('')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                typeFilter === '' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              All Types
            </button>
            <button 
              onClick={() => setTypeFilter('RESIDENTIAL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                typeFilter === 'RESIDENTIAL' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Residential
            </button>
            <button 
              onClick={() => setTypeFilter('COMMERCIAL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                typeFilter === 'COMMERCIAL' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Commercial
            </button>
          </div>

          {/* Stage Dropdown (Used in Table mode) */}
          <select 
            value={statusFilter} 
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-xs font-semibold bg-white text-slate-700"
          >
            <option value="">All Stages</option>
            {STAGES.map(s => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>

          {/* Source Dropdown */}
          <select 
            value={sourceFilter} 
            onChange={e => setSourceFilter(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-xs font-semibold bg-white text-slate-700"
          >
            <option value="">All Sources</option>
            <option value="Website">Website Form</option>
            <option value="Facebook">Meta / Facebook</option>
            <option value="Instagram">Instagram</option>
            <option value="Referral">Customer Referral</option>
            <option value="Walk-in">Walk-in / Direct</option>
            <option value="Partner">EPC Partner</option>
          </select>
        </div>
      </div>

      {/* VIEW MODE 1: KANBAN DEAL PIPELINE */}
      {viewMode === 'kanban' && (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-[1300px]">
            {STAGES.map((col) => {
              const colLeads = filteredLeads.filter(l => l.status === col.id);
              const colCap = colLeads.reduce((sum, l) => sum + (l.estimatedCap || 0), 0);
              const ColIcon = col.icon;

              return (
                <div key={col.id} className="flex-1 min-w-[270px] max-w-[320px] bg-slate-50/70 rounded-2xl border border-slate-200/80 p-3 flex flex-col max-h-[800px]">
                  {/* Column Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200/70 mb-3 px-1">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${col.badge}`}>
                        <ColIcon size={14} />
                      </div>
                      <span className="font-bold text-xs uppercase tracking-wider text-slate-800">{col.label}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-full bg-white text-slate-700 text-xs font-black shadow-xs border border-slate-200">
                        {colLeads.length}
                      </span>
                    </div>
                  </div>

                  {/* Cumulative kWp Header Subtitle */}
                  {colCap > 0 && (
                    <div className="text-[11px] font-semibold text-emerald-700 bg-emerald-50/60 px-2.5 py-1 rounded-lg mb-2.5 flex items-center justify-between">
                      <span>Total Capacity</span>
                      <span className="font-bold">{colCap.toFixed(1)} kWp</span>
                    </div>
                  )}

                  {/* Cards Scrollable Container */}
                  <div className="space-y-3 overflow-y-auto pr-1 flex-1 custom-scrollbar">
                    {loading ? (
                      <div className="py-8 text-center text-xs text-slate-400 animate-pulse">Loading leads...</div>
                    ) : colLeads.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl bg-white/40">
                        No leads in {col.label.toLowerCase()}
                      </div>
                    ) : (
                      colLeads.map((lead) => {
                        const cleanPhone = lead.mobile?.replace(/[^0-9]/g, '') || '';
                        const waText = encodeURIComponent(`Hello ${lead.name}, thank you for reaching out to us regarding your ${lead.estimatedCap ? `${lead.estimatedCap} kWp ` : ''}solar rooftop installation. How can we assist you today?`);

                        return (
                          <div 
                            key={lead.id} 
                            className="bg-white rounded-xl p-3.5 shadow-xs border border-slate-200/90 hover:shadow-md hover:border-emerald-300 transition-all group relative"
                          >
                            {/* Card Top: Name & Customer Type */}
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <Link 
                                  href={`/tenant/leads/${lead.id}`}
                                  className="font-bold text-sm text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1"
                                >
                                  {lead.name}
                                </Link>
                                <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                                  {lead.customerType === 'COMMERCIAL' ? (
                                    <span className="inline-flex items-center gap-0.5 text-blue-600 font-semibold"><Building2 size={11} /> Commercial</span>
                                  ) : (
                                    <span className="inline-flex items-center gap-0.5 text-emerald-700 font-semibold"><Home size={11} /> Residential</span>
                                  )}
                                  {lead.city && <span>• {lead.city}</span>}
                                </div>
                              </div>

                              {lead.estimatedCap && (
                                <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 text-[11px] font-bold border border-amber-200/60 shrink-0">
                                  {lead.estimatedCap} kWp
                                </span>
                              )}
                            </div>

                            {/* Contact & Source Pill */}
                            <div className="mt-2.5 flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-100">
                              <span className="font-medium text-[11px] text-slate-500">
                                {lead.source || 'Direct'}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {new Date(lead.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                              </span>
                            </div>

                            {/* Action Bar */}
                            <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                              {/* Quick Direct Connect Buttons */}
                              <div className="flex items-center gap-1">
                                {cleanPhone && (
                                  <>
                                    <a 
                                      href={`tel:${cleanPhone}`} 
                                      title={`Call ${lead.name}`}
                                      className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 flex items-center justify-center transition-colors"
                                    >
                                      <Phone size={13} />
                                    </a>
                                    <a 
                                      href={`https://wa.me/${cleanPhone}?text=${waText}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      title="WhatsApp Message"
                                      className="w-7 h-7 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 flex items-center justify-center transition-colors"
                                    >
                                      <MessageCircle size={13} />
                                    </a>
                                  </>
                                )}
                                <button 
                                  onClick={() => setFollowupLead(lead)}
                                  title="Schedule Follow-up"
                                  className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-purple-50 text-slate-600 hover:text-purple-700 flex items-center justify-center transition-colors"
                                >
                                  <Clock size={13} />
                                </button>
                              </div>

                              {/* Stage Mover Selector */}
                              <div className="flex items-center gap-1">
                                <select 
                                  value={lead.status}
                                  onChange={(e) => handleUpdateStage(lead.id, e.target.value)}
                                  className="text-[11px] font-bold rounded-lg border border-slate-200 bg-white px-2 py-1 outline-none text-slate-700 hover:border-emerald-400 cursor-pointer"
                                  title="Move Stage"
                                >
                                  {STAGES.map(s => (
                                    <option key={s.id} value={s.id}>{s.label}</option>
                                  ))}
                                </select>
                                
                                <button
                                  onClick={() => handleDeleteLead(lead.id)}
                                  disabled={deletingId === lead.id}
                                  title="Delete Lead"
                                  className="w-6 h-6 rounded-md hover:bg-red-50 text-slate-400 hover:text-red-600 flex items-center justify-center transition-colors"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW MODE 2: SMART HIGH-DENSITY TABLE */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto min-h-[420px]">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider text-xs font-bold border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Lead Profile & Specs</th>
                  <th className="px-5 py-3.5">Contact & Reach</th>
                  <th className="px-5 py-3.5">Commercial & Source</th>
                  <th className="px-5 py-3.5">Pipeline Stage</th>
                  <th className="px-5 py-3.5 text-right sticky right-0 bg-slate-50 border-l border-slate-200 z-10 shadow-[-6px_0_12px_rgba(0,0,0,0.02)]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                      <p className="mt-2 text-xs text-slate-500 font-semibold">Loading lead records...</p>
                    </td>
                  </tr>
                ) : filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center text-slate-500">
                      No leads found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead) => {
                    const cleanPhone = lead.mobile?.replace(/[^0-9]/g, '') || '';
                    const waText = encodeURIComponent(`Hello ${lead.name}, thank you for reaching out to us regarding your ${lead.estimatedCap ? `${lead.estimatedCap} kWp ` : ''}solar rooftop installation.`);

                    return (
                      <tr key={lead.id} className="hover:bg-slate-50/80 transition-colors group">
                        
                        {/* Col 1: Lead Profile & Solar Specs */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                              {lead.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <Link 
                                href={`/tenant/leads/${lead.id}`} 
                                className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors"
                              >
                                {lead.name}
                              </Link>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[11px] font-semibold text-slate-500">
                                  {lead.company || lead.customerType}
                                </span>
                                {lead.estimatedCap && (
                                  <span className="px-2 py-0.2 rounded-md bg-amber-50 text-amber-800 text-[10px] font-extrabold border border-amber-200">
                                    ⚡ {lead.estimatedCap} kWp
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Col 2: Contact & Direct Connect */}
                        <td className="px-5 py-3.5">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                              <span className="font-mono">{lead.mobile}</span>
                              {cleanPhone && (
                                <div className="inline-flex items-center gap-1 ml-1">
                                  <a 
                                    href={`tel:${cleanPhone}`} 
                                    title="Call" 
                                    className="p-1 rounded-md bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 transition-colors"
                                  >
                                    <Phone size={12} />
                                  </a>
                                  <a 
                                    href={`https://wa.me/${cleanPhone}?text=${waText}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    title="WhatsApp" 
                                    className="p-1 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors"
                                  >
                                    <MessageCircle size={12} />
                                  </a>
                                </div>
                              )}
                            </div>
                            {lead.email && (
                              <p className="text-[11px] text-slate-500 flex items-center gap-1">
                                <Mail size={11} className="text-slate-400" /> {lead.email}
                              </p>
                            )}
                          </div>
                        </td>

                        {/* Col 3: Commercial & Source */}
                        <td className="px-5 py-3.5">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                                {lead.source || 'Direct'}
                              </span>
                              {lead.city && (
                                <span className="text-[11px] text-slate-500 flex items-center gap-0.5">
                                  <MapPin size={10} /> {lead.city}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400">
                              Created {new Date(lead.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                          </div>
                        </td>

                        {/* Col 4: Stage Selector */}
                        <td className="px-5 py-3.5">
                          <select 
                            value={lead.status}
                            onChange={(e) => handleUpdateStage(lead.id, e.target.value)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border outline-none cursor-pointer ${getStatusBadge(lead.status)}`}
                          >
                            {STAGES.map(s => (
                              <option key={s.id} value={s.id}>{s.label}</option>
                            ))}
                          </select>
                        </td>

                        {/* Col 5: Sticky Right Actions */}
                        <td className="px-5 py-3.5 text-right sticky right-0 bg-white group-hover:bg-slate-50/95 border-l border-slate-100 z-10 shadow-[-6px_0_12px_rgba(0,0,0,0.03)]">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link 
                              href={`/tenant/leads/${lead.id}`}
                              className="px-3 py-1.5 bg-slate-900 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 shadow-xs"
                            >
                              <span>Workspace</span>
                              <ChevronRight size={13} />
                            </Link>
                            
                            <button 
                              onClick={() => setFollowupLead(lead)}
                              title="Schedule Follow-up"
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-purple-50 hover:text-purple-700 transition-colors"
                            >
                              <Clock size={14} />
                            </button>

                            <button
                              onClick={() => handleDeleteLead(lead.id)}
                              disabled={deletingId === lead.id}
                              title="Delete Lead"
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 size={14} />
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

      {/* MODAL 1: ADD NEW LEAD (RICH SOLAR PROSPECT FORM) */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-100">
            <div className="p-6 bg-gradient-to-r from-slate-900 to-emerald-950 text-white flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black">Add Solar Lead Enquiry</h2>
                <p className="text-xs text-emerald-300 mt-0.5">Capture client requirements & solar rooftop details</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateLead} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-semibold border border-red-200 flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Full Name *</label>
                  <input 
                    required 
                    type="text" 
                    placeholder="e.g. Ramesh Patel" 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm transition-all" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Mobile Phone *</label>
                  <input 
                    required 
                    type="tel" 
                    placeholder="e.g. 9876543210" 
                    value={formData.mobile} 
                    onChange={e => setFormData({...formData, mobile: e.target.value})} 
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm transition-all" 
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Email Address</label>
                  <input 
                    type="email" 
                    placeholder="client@gmail.com" 
                    value={formData.email} 
                    onChange={e => setFormData({...formData, email: e.target.value})} 
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm transition-all" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Customer Type</label>
                  <select 
                    value={formData.customerType} 
                    onChange={e => setFormData({...formData, customerType: e.target.value})} 
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm transition-all bg-white font-medium"
                  >
                    <option value="RESIDENTIAL">Residential Rooftop</option>
                    <option value="COMMERCIAL">Commercial / Office</option>
                    <option value="INDUSTRIAL">Industrial / Factory</option>
                    <option value="HOUSING_SOCIETY">Housing Society (CHS)</option>
                  </select>
                </div>
              </div>

              {/* Solar Specific Parameters */}
              <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100 space-y-3">
                <span className="text-xs font-black text-emerald-800 uppercase tracking-wider block">
                  ⚡ Solar Plant Sizing & Roof Specs
                </span>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Est. System Capacity (kWp)</label>
                    <input 
                      type="number" 
                      step="0.5" 
                      placeholder="e.g. 5" 
                      value={formData.estimatedCap} 
                      onChange={e => setFormData({...formData, estimatedCap: e.target.value})} 
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm bg-white" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Monthly Power Bill (₹)</label>
                    <input 
                      type="number" 
                      step="100" 
                      placeholder="e.g. 4500" 
                      value={formData.monthlyBill} 
                      onChange={e => setFormData({...formData, monthlyBill: e.target.value})} 
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm bg-white" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Roof Structure</label>
                    <select 
                      value={formData.roofType} 
                      onChange={e => setFormData({...formData, roofType: e.target.value})} 
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm bg-white font-medium"
                    >
                      <option value="Concrete Flat">Concrete Flat RCC</option>
                      <option value="Tin Metal Shed">Tin / Metal Shed</option>
                      <option value="Tiled Sloped">Tiled Sloped</option>
                      <option value="Elevated Gazebo">Elevated Superstructure</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Lead Source</label>
                    <select 
                      value={formData.source} 
                      onChange={e => setFormData({...formData, source: e.target.value})} 
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm bg-white font-medium"
                    >
                      <option value="Website">Website Form</option>
                      <option value="Facebook">Facebook Ads</option>
                      <option value="Instagram">Instagram</option>
                      <option value="Referral">Referral</option>
                      <option value="Walk-in">Walk-in</option>
                      <option value="Cold Outreach">Cold Outreach</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">City</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Pune" 
                    value={formData.city} 
                    onChange={e => setFormData({...formData, city: e.target.value})} 
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm transition-all" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Company (Optional)</label>
                  <input 
                    type="text" 
                    placeholder="Patel Enterprises" 
                    value={formData.company} 
                    onChange={e => setFormData({...formData, company: e.target.value})} 
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm transition-all" 
                  />
                </div>
              </div>

              <div className="pt-3 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="flex-1 py-2.5 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-sm transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
                >
                  {submitting ? 'Creating...' : 'Create Solar Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CELEBRATORY LEAD CONVERSION TO PROJECT */}
      {convertLead && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-100">
            <div className="p-6 bg-gradient-to-br from-emerald-600 to-teal-800 text-white text-center">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md mx-auto flex items-center justify-center text-white mb-3 shadow-inner">
                <CheckCircle2 size={32} />
              </div>
              <h2 className="text-xl font-black">Convert Lead to Customer!</h2>
              <p className="text-xs text-emerald-100 mt-1">
                Congratulations! Marking as WON automatically initializes Customer Account, Project, and Site Survey.
              </p>
            </div>

            <form onSubmit={handleConfirmConvert} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Project Name</label>
                <input 
                  required
                  type="text"
                  value={convertProjectName}
                  onChange={e => setConvertProjectName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-semibold text-slate-800"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 space-y-1">
                <p className="font-semibold text-slate-800">Automated Pipeline Handover:</p>
                <p>✓ Customer Record Created in CRM</p>
                <p>✓ Turnkey Project created in Planning stage</p>
                <p>✓ Site Survey scheduled in 3-day SLA</p>
              </div>

              <div className="pt-2 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setConvertLead(null)} 
                  className="flex-1 py-2.5 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-sm"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={converting}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm shadow-md flex items-center justify-center gap-2"
                >
                  {converting ? 'Converting...' : 'Confirm & Convert'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: SCHEDULE FOLLOW-UP */}
      {followupLead && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-100">
            <div className="p-5 bg-gradient-to-r from-slate-900 to-purple-950 text-white flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold">Schedule Solar Follow-up</h2>
                <p className="text-xs text-purple-300 mt-0.5">For {followupLead.name} ({followupLead.mobile})</p>
              </div>
              <button onClick={() => setFollowupLead(null)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleScheduleFollowup} className="p-5 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Follow-up Type</label>
                  <select 
                    value={followupData.type} 
                    onChange={e => setFollowupData({...followupData, type: e.target.value})} 
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
                  >
                    <option value="CALL">Phone Call</option>
                    <option value="WHATSAPP">WhatsApp</option>
                    <option value="MEETING">Site Visit</option>
                    <option value="EMAIL">Email</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Scheduled Date & Time *</label>
                  <input 
                    required 
                    type="datetime-local" 
                    value={followupData.scheduledAt} 
                    onChange={e => setFollowupData({...followupData, scheduledAt: e.target.value})} 
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs" 
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Discussion Notes</label>
                <textarea 
                  rows={3} 
                  placeholder="e.g. Discuss 5kW on-grid quotation and subsidy feasibility"
                  value={followupData.notes} 
                  onChange={e => setFollowupData({...followupData, notes: e.target.value})} 
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-purple-500"
                ></textarea>
              </div>

              <div className="pt-2 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setFollowupLead(null)} 
                  className="flex-1 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-xs"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold text-xs shadow-md"
                >
                  Schedule Reminder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
