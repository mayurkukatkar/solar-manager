"use client";
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Filter, MoreHorizontal, MessageSquare, AlertCircle } from 'lucide-react';

interface Ticket {
  id: string;
  tenant: { name: string };
  subject: string;
  priority: string;
  status: string;
  createdAt: string;
}

export default function SupportTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`\${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/super-admin/tickets`, { withCredentials: true })
      .then(res => setTickets(res.data.tickets || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="animate-in fade-in duration-500">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Support Tickets</h1>
          <p className="text-slate-500 mt-1">Manage cross-tenant support requests and escalations.</p>
        </div>
      </div>

      <div className="bg-white rounded-t-xl border border-slate-200 p-4 flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by ticket ID or subject..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg text-sm transition-all outline-none"
          />
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 border border-slate-200 px-4 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50">
            <Filter size={16} /> Filter Status
          </button>
        </div>
      </div>

      <div className="bg-white shadow-sm border-x border-b border-slate-200 overflow-x-auto rounded-b-xl">
        <table className="w-full text-left min-w-[1000px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Ticket</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tenant</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Priority</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Created At</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={6} className="px-6 py-4"><div className="h-6 bg-slate-100 rounded w-full"></div></td>
                </tr>
              ))
            ) : tickets.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-20 text-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                    <MessageSquare className="text-slate-300" size={32} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">No support tickets</h3>
                  <p className="text-slate-500 mt-1">Tenant escalations will appear here.</p>
                </td>
              </tr>
            ) : (
              tickets.map(ticket => (
                <tr key={ticket.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900">{ticket.subject}</div>
                    <div className="text-xs font-mono text-slate-400 mt-1 uppercase">ID: {ticket.id.split('-')[0]}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-700">{ticket.tenant.name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider ${
                      ticket.priority === 'CRITICAL' ? 'text-red-600' : 
                      ticket.priority === 'HIGH' ? 'text-orange-600' : 'text-blue-600'
                    }`}>
                      {ticket.priority === 'CRITICAL' && <AlertCircle size={14} />}
                      {ticket.priority}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      ticket.status === 'OPEN' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                      ticket.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                      'bg-slate-100 text-slate-800 border border-slate-200'
                    }`}>
                      {ticket.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-slate-700">{new Date(ticket.createdAt).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
                      <MoreHorizontal size={20} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
