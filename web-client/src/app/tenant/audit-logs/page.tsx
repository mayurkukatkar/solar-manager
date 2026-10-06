"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { History, Search, Filter } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    axios.get(`${API}/api/tenant/audit-logs`, { withCredentials: true })
      .then(res => setLogs(res.data.logs || []))
      .catch(console.error);
  }, []);

  const filteredLogs = logs.filter(l => 
    l.action.toLowerCase().includes(search.toLowerCase()) || 
    l.entity.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Audit Logs</h1>
          <p className="text-sm text-slate-500 mt-1">Track all system activities and changes</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6 flex gap-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search logs..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100">
          <Filter size={16} /> Filter
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Timestamp</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Action</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Entity</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Actor</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">IP Address</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map(log => (
              <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                <td className="px-4 py-3 text-slate-500">{new Date(log.createdAt).toLocaleString()}</td>
                <td className="px-4 py-3 font-semibold text-slate-800">
                  <span className={`px-2 py-1 rounded text-xs ${
                    log.action.includes('CREATE') ? 'bg-emerald-50 text-emerald-700' :
                    log.action.includes('UPDATE') ? 'bg-blue-50 text-blue-700' :
                    log.action.includes('DELETE') ? 'bg-red-50 text-red-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {log.action}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600">{log.entity} {log.entityId ? `(#${log.entityId.slice(-6)})` : ''}</td>
                <td className="px-4 py-3 text-slate-600">{log.actorId || 'System'}</td>
                <td className="px-4 py-3 text-slate-500 text-xs">{log.ipAddress || '-'}</td>
              </tr>
            ))}
            {filteredLogs.length === 0 && (
              <tr><td colSpan={5} className="text-center py-12 text-slate-400">No logs found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
