"use client";
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Filter, ShieldAlert, FileText, ArrowUpRight } from 'lucide-react';

interface AuditLog {
  id: string;
  actorId: string;
  tenantId: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  createdAt: string;
  ipAddress: string | null;
}

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`\${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/super-admin/audit-logs`, { withCredentials: true })
      .then(res => setLogs(res.data.logs || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="animate-in fade-in duration-500">
      
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Security Audit Logs</h1>
          <p className="text-slate-500 mt-1">Immutable record of high-impact platform operations.</p>
        </div>
      </div>

      <div className="bg-white rounded-t-xl border border-slate-200 p-4 flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search events, IP, or Actor ID..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg text-sm transition-all outline-none"
          />
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 border border-slate-200 px-4 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50">
            <Filter size={16} /> Filter Event Type
          </button>
        </div>
      </div>

      <div className="bg-white shadow-sm border-x border-b border-slate-200 overflow-x-auto rounded-b-xl">
        <table className="w-full text-left min-w-[1000px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Timestamp</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Action</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Entity</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Actor ID</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">IP / Location</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={6} className="px-6 py-4"><div className="h-6 bg-slate-100 rounded w-full"></div></td>
                </tr>
              ))
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-20 text-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                    <ShieldAlert className="text-slate-300" size={32} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">No audit events found</h3>
                  <p className="text-slate-500 mt-1">Platform events will be recorded here.</p>
                </td>
              </tr>
            ) : (
              logs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors font-mono text-xs">
                  <td className="px-6 py-4 text-slate-600">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded">{log.action}</span>
                  </td>
                  <td className="px-6 py-4 text-slate-700">
                    {log.entity} <span className="text-slate-400">({log.entityId})</span>
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {log.actorId.split('-')[0]}...
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {log.ipAddress || '127.0.0.1'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-blue-600 hover:text-blue-800 font-sans font-semibold flex items-center gap-1 justify-end w-full">
                      <FileText size={14}/> View
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
