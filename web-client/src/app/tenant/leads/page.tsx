"use client";
import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { Plus, Search, Filter, Phone, Mail, MoreHorizontal, User, TrendingUp, Users, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function LeadsList() {
  const [leads, setLeads] = useState<any[]>([]);
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  
  // New Lead Modal State
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '', mobile: '', email: '', company: '', source: '', estimatedCap: ''
  });
  const [errorMsg, setErrorMsg] = useState('');

  const fetchDashboard = async () => {
    try {
      const res = await axios.get(`\${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/leads/dashboard`, { withCredentials: true });
      setDashboard(res.data.dashboard);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLeads = async () => {
    try {
      setLoading(true);
      let url = `\${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/leads?`;
      if (search) url += `search=${search}&`;
      if (statusFilter) url += `status=${statusFilter}&`;
      if (sourceFilter) url += `source=${sourceFilter}`;
      
      const res = await axios.get(url, { withCredentials: true });
      setLeads(res.data.leads);
    } catch (err) {
      console.error(err);
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
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [search, statusFilter, sourceFilter]);

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      await axios.post(`\${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/leads`, {
        ...formData,
        estimatedCap: formData.estimatedCap ? parseFloat(formData.estimatedCap) : null
      }, { withCredentials: true });
      setShowModal(false);
      setFormData({ name: '', mobile: '', email: '', company: '', source: '', estimatedCap: '' });
      fetchLeads();
      fetchDashboard();
    } catch (err: any) {
      if (err.response?.status === 409) {
        setErrorMsg('Possible duplicate lead found with this phone/email. Check existing leads.');
      } else {
        setErrorMsg('Failed to create lead.');
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'NEW': return 'bg-blue-100 text-blue-700';
      case 'CONTACTED': return 'bg-indigo-100 text-indigo-700';
      case 'QUALIFIED': return 'bg-purple-100 text-purple-700';
      case 'SITE_SURVEY': return 'bg-amber-100 text-amber-700';
      case 'PROPOSAL_SENT': return 'bg-orange-100 text-orange-700';
      case 'NEGOTIATION': return 'bg-pink-100 text-pink-700';
      case 'WON': return 'bg-emerald-100 text-emerald-700';
      case 'LOST': return 'bg-red-100 text-red-700';
      case 'ON_HOLD': return 'bg-slate-100 text-slate-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Lead Management</h1>
          <p className="text-sm text-slate-500 mt-1">Track and nurture prospects from first contact to project handover.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2 shadow-sm"
        >
          <Plus size={18} /> Add New Lead
        </button>
      </div>

      {/* Dashboard KPI Cards */}
      {dashboard && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Leads</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{dashboard.totalLeads}</h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
              <Users size={24} />
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">New & Qualified</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{dashboard.newLeads + dashboard.qualifiedLeads}</h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
              <AlertCircle size={24} />
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Won Leads</p>
              <h3 className="text-2xl font-bold text-emerald-600 mt-1">{dashboard.wonLeads}</h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle2 size={24} />
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Conversion Rate</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{dashboard.conversionRate}%</h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
              <TrendingUp size={24} />
            </div>
          </div>
        </div>
      )}

      {/* Main List Workspace */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center gap-4 bg-slate-50/50">
           <div className="relative flex-1 min-w-[280px]">
             <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
             <input 
               type="text" 
               placeholder="Search by name, phone, or email..." 
               value={search}
               onChange={(e) => setSearch(e.target.value)}
               className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm transition-all bg-white"
             />
           </div>
           
           <div className="flex gap-2">
             <select 
               value={statusFilter} 
               onChange={e => setStatusFilter(e.target.value)}
               className="px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm bg-white text-slate-700"
             >
               <option value="">All Stages</option>
               <option value="NEW">New</option>
               <option value="CONTACTED">Contacted</option>
               <option value="QUALIFIED">Qualified</option>
               <option value="SITE_SURVEY">Site Survey</option>
               <option value="PROPOSAL_SENT">Proposal Sent</option>
               <option value="NEGOTIATION">Negotiation</option>
               <option value="WON">Won</option>
               <option value="LOST">Lost</option>
             </select>

             <select 
               value={sourceFilter} 
               onChange={e => setSourceFilter(e.target.value)}
               className="px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm bg-white text-slate-700"
             >
               <option value="">All Sources</option>
               <option value="Website">Website</option>
               <option value="Facebook">Facebook</option>
               <option value="Instagram">Instagram</option>
               <option value="Referral">Referral</option>
               <option value="Walk-in">Walk-in</option>
             </select>
           </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-xs font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Lead Name</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Source / Assignee</th>
                <th className="px-6 py-4">Stage</th>
                <th className="px-6 py-4">Created Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-slate-500">
                    No leads found matching your criteria.
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                          <User size={18} />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{lead.name}</p>
                          <p className="text-xs text-slate-500">{lead.company || lead.customerType || 'Individual'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 text-slate-600">
                        <span className="flex items-center gap-1.5"><Phone size={14} className="text-slate-400" /> {lead.mobile}</span>
                        {lead.email && <span className="flex items-center gap-1.5"><Mail size={14} className="text-slate-400" /> {lead.email}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-slate-900 font-medium text-xs">{lead.source || 'Unknown Source'}</span>
                        <span className="text-xs text-slate-500">{lead.assignee ? `Assigned: ${lead.assignee.name}` : 'Unassigned'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${getStatusColor(lead.status)}`}>
                        {lead.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(lead.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/tenant/leads/${lead.id}`} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:text-emerald-600 hover:border-emerald-200 rounded-lg font-medium transition-colors shadow-sm">
                          Open Workspace
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* NEW LEAD MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Add New Lead</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700 p-2">✕</button>
            </div>
            
            <form onSubmit={handleCreateLead} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-100 flex items-center gap-2">
                  <AlertCircle size={16} /> {errorMsg}
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Full Name *</label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Mobile *</label>
                  <input required type="tel" value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Email</label>
                  <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Company (Optional)</label>
                  <input type="text" value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Source</label>
                  <select value={formData.source} onChange={e => setFormData({...formData, source: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all bg-white">
                    <option value="">Select Source</option>
                    <option value="Website">Website</option>
                    <option value="Facebook">Facebook</option>
                    <option value="Instagram">Instagram</option>
                    <option value="Referral">Referral</option>
                    <option value="Walk-in">Walk-in</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Est. Capacity (kW)</label>
                  <input type="number" step="0.1" value={formData.estimatedCap} onChange={e => setFormData({...formData, estimatedCap: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all" />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl font-semibold transition-colors">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-md transition-colors">
                  Create Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
