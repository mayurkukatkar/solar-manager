"use client";
import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { Search, Filter, Phone, Mail, MapPin, CheckCircle, ChevronRight, Users } from 'lucide-react';

export default function LeadList() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLead, setNewLead] = useState({ name: '', mobile: '', email: '', estimatedCap: '' });

  const fetchLeads = async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/leads`, { withCredentials: true });
      setLeads(res.data.leads);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleCreateLead = async (e: any) => {
    e.preventDefault();
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/leads`, newLead, { withCredentials: true });
      setShowAddModal(false);
      setNewLead({ name: '', mobile: '', email: '', estimatedCap: '' });
      fetchLeads();
    } catch (err) {
      alert('Failed to create lead');
    }
  };

  const filteredLeads = leads.filter(l => 
    l.name.toLowerCase().includes(search.toLowerCase()) || 
    l.mobile.includes(search) || 
    (l.email && l.email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-800">CRM Pipeline</h1>
          <p className="text-slate-500 mt-1 font-medium">Manage your leads, track conversions, and view their 360° lifecycle.</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-emerald-600/20 hover:bg-emerald-700 transition-colors flex items-center gap-2">
          <Users size={16} /> Add New Lead
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Toolbar */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between gap-4 bg-slate-50/50">
           <div className="relative flex-1 max-w-md">
             <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
             <input 
               type="text" 
               placeholder="Search leads by name, phone..." 
               value={search}
               onChange={(e) => setSearch(e.target.value)}
               className="w-full pl-11 pr-4 py-2.5 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-emerald-50 focus:border-emerald-500 outline-none text-sm transition-all font-medium text-slate-700"
             />
           </div>
           <button className="flex items-center gap-2 px-5 py-2.5 rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors text-sm font-bold">
             <Filter size={16} /> Filters
           </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-400 uppercase tracking-widest text-[10px] font-bold border-b border-slate-100">
              <tr>
                <th className="px-6 py-5">Lead Profile</th>
                <th className="px-6 py-5">Contact Info</th>
                <th className="px-6 py-5">Location</th>
                <th className="px-6 py-5">Pipeline Stage</th>
                <th className="px-6 py-5">Source</th>
                <th className="px-6 py-5 text-right">360° View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                  </td>
                </tr>
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-slate-500 font-medium">
                    No leads found in pipeline.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center text-emerald-700 font-black text-lg shadow-inner">
                          {l.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-base">{l.name}</p>
                          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-0.5">{l.customerType}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-1.5 text-slate-600 text-[13px] font-medium">
                        <span className="flex items-center gap-2"><Phone size={14} className="text-slate-400" /> {l.mobile}</span>
                        {l.email && <span className="flex items-center gap-2"><Mail size={14} className="text-slate-400" /> {l.email}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-slate-600 text-[13px] font-medium">
                      {l.city ? (
                         <span className="flex items-center gap-2"><MapPin size={14} className="text-slate-400" /> {l.city}</span>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 w-max shadow-sm ${l.status === 'WON' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : l.status === 'QUALIFIED' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                        <CheckCircle size={14} /> {l.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-slate-500 text-xs font-bold uppercase tracking-wider">
                      {l.source || 'Direct'}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <Link href={`/tenant/crm/${l.id}`} className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition-colors border border-transparent hover:border-emerald-200 shadow-sm">
                        <ChevronRight size={20} strokeWidth={2.5} />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Add New Lead</h2>
            <form onSubmit={handleCreateLead} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Full Name</label>
                <input required value={newLead.name} onChange={e => setNewLead({...newLead, name: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" placeholder="e.g. John Doe" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Mobile Number</label>
                <input required value={newLead.mobile} onChange={e => setNewLead({...newLead, mobile: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" placeholder="e.g. 9876543210" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Email Address</label>
                <input type="email" value={newLead.email} onChange={e => setNewLead({...newLead, email: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" placeholder="e.g. john@example.com" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Estimated Requirement (kW)</label>
                <input type="number" value={newLead.estimatedCap} onChange={e => setNewLead({...newLead, estimatedCap: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" placeholder="e.g. 5" />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-md hover:bg-emerald-700">Create Lead</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
