"use client";
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Wrench, Plus, Search, Calendar, User, Clock, AlertCircle } from 'lucide-react';

export default function Service() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    customerId: '', projectId: '', subject: '', priority: 'MEDIUM', status: 'OPEN'
  });

  const fetchData = async () => {
    try {
      const [svcRes, custRes, projRes] = await Promise.all([
        axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/service`, { withCredentials: true }),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/customers`, { withCredentials: true }),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/projects`, { withCredentials: true })
      ]);
      setTickets(svcRes.data.service);
      setCustomers(custRes.data.customers);
      setProjects(projRes.data.projects);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/service`, formData, { withCredentials: true });
      setShowModal(false);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to log service request');
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'OPEN': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'IN_PROGRESS': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'RESOLVED': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch(priority) {
      case 'HIGH': return <AlertCircle size={14} className="text-red-500" />;
      case 'MEDIUM': return <AlertCircle size={14} className="text-amber-500" />;
      case 'LOW': return <AlertCircle size={14} className="text-blue-500" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Service & AMC</h1>
          <p className="text-sm text-slate-500 mt-1">Manage post-installation service requests and maintenance.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-full font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-sm"
        >
          <Plus size={18} /> Log Request
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
           <div className="col-span-full py-20 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
           </div>
        ) : tickets.length === 0 ? (
           <div className="col-span-full bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden text-center py-20">
             <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                <Wrench size={32} />
             </div>
             <h2 className="text-xl font-bold text-slate-900">No Service Requests</h2>
             <p className="text-slate-500 mt-2 max-w-md mx-auto">All clear! No active maintenance requests.</p>
           </div>
        ) : (
          tickets.map((ticket) => (
             <div key={ticket.id} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                   <div className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${getStatusColor(ticket.status)}`}>
                     {ticket.status.replace('_', ' ')}
                   </div>
                   <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-md text-[10px] font-bold text-slate-600 uppercase">
                     {getPriorityIcon(ticket.priority)} {ticket.priority}
                   </div>
                </div>
                
                <h3 className="text-lg font-bold text-slate-900 mb-2">{ticket.subject}</h3>
                
                <div className="pt-4 border-t border-slate-100 flex-1 space-y-3">
                   <div className="flex items-center gap-2">
                     <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                       <User size={12} />
                     </div>
                     <span className="text-sm font-semibold text-slate-700">{ticket.customer?.name || 'Unknown'}</span>
                   </div>
                   <div className="flex items-center gap-2 text-xs text-slate-500 font-medium ml-1">
                     <Clock size={14} className="text-slate-400" /> Logged: {new Date(ticket.createdAt).toLocaleDateString()}
                   </div>
                </div>

                <div className="pt-6 mt-2 flex gap-2">
                   <button className="flex-1 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl text-xs font-bold transition-colors">
                     Update Status
                   </button>
                   <button className="flex-1 py-2 bg-slate-50 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-bold transition-colors">
                     View Details
                   </button>
                </div>
             </div>
          ))
        )}
      </div>

      {/* NEW TICKET MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Log Service Request</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700 p-2">✕</button>
            </div>
            
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-extrabold text-slate-600 uppercase tracking-wider">Customer *</label>
                <select required value={formData.customerId} onChange={e => setFormData({...formData, customerId: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all bg-white font-medium text-slate-700">
                  <option value="">Select a Customer</option>
                  {customers.map(c => (
                     <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-extrabold text-slate-600 uppercase tracking-wider">Project (Optional)</label>
                <select value={formData.projectId} onChange={e => setFormData({...formData, projectId: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all bg-white font-medium text-slate-700">
                  <option value="">Select a Project</option>
                  {projects.filter(p => !formData.customerId || p.customerId === formData.customerId).map(p => (
                     <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-extrabold text-slate-600 uppercase tracking-wider">Issue Description *</label>
                <textarea required rows={3} value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium text-slate-700" placeholder="Describe the problem..."></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-600 uppercase tracking-wider">Priority</label>
                  <select value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all bg-white font-medium text-slate-700">
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High (Urgent)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-600 uppercase tracking-wider">Status</label>
                  <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all bg-white font-medium text-slate-700">
                    <option value="OPEN">Open</option>
                    <option value="IN_PROGRESS">In Progress</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold transition-colors">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md transition-colors">
                  Log Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
