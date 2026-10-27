"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { 
  History, Search, Filter, Download, ShieldCheck, AlertCircle, 
  Eye, RefreshCw, X, ChevronRight, FileSpreadsheet, User, Terminal,
  Lock, CheckCircle2, Clock, Calendar
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface AuditLogItem {
  id: string;
  createdAt: string;
  action: string;
  entity: string;
  entityId: string;
  actorId: string;
  actorName?: string;
  actorRole?: string;
  ipAddress: string;
  userAgent?: string;
  details?: any;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [entityFilter, setEntityFilter] = useState("ALL");
  const [total, setTotal] = useState(0);
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (entityFilter !== "ALL") params.entity = entityFilter;
      if (search) params.search = search;

      const res = await axios.get(`${API}/api/tenant/audit-logs`, { params, withCredentials: true });
      setLogs(res.data.logs || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error("Error fetching audit logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [entityFilter]);

  const handleExportCsv = () => {
    window.open(`${API}/api/tenant/audit-logs/export`, "_blank");
  };

  const getActionBadge = (action: string) => {
    if (action.includes("CREATE")) {
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    } else if (action.includes("UPDATE") || action.includes("EDIT")) {
      return "bg-blue-50 text-blue-700 border-blue-200";
    } else if (action.includes("DELETE") || action.includes("CANCEL")) {
      return "bg-rose-50 text-rose-700 border-rose-200";
    } else if (action.includes("DISPATCH") || action.includes("GENERATE")) {
      return "bg-purple-50 text-purple-700 border-purple-200";
    }
    return "bg-slate-50 text-slate-700 border-slate-200";
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Security & Audit Logs</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
              {total} total records
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">Immutable statutory audit trail of all invoices, dispatches, document prints & logins.</p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={fetchLogs} 
            className="p-2.5 text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            title="Refresh"
          >
            <RefreshCw size={16} />
          </button>
          <button 
            onClick={handleExportCsv}
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 py-2.5 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      {/* FILTER TABS & SEARCH */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
            {["ALL", "Invoice", "Project", "Inventory", "Document", "Finance", "PurchaseOrder", "User"].map((ent) => (
              <button
                key={ent}
                onClick={() => setEntityFilter(ent)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  entityFilter === ent 
                    ? "bg-emerald-600 text-white shadow-sm" 
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                {ent}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-80">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search action, entity or IP..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === "Enter" && fetchLogs()}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-emerald-500 transition-colors" 
            />
          </div>
        </div>

        {/* LOGS TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-xs font-bold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Entity</th>
                <th className="px-6 py-4">Operator / Role</th>
                <th className="px-6 py-4">IP Address</th>
                <th className="px-6 py-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 font-medium">
                    No audit records found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 text-slate-600">
                      <div className="flex items-center gap-1.5 font-medium text-xs">
                        <Calendar size={13} className="text-slate-400" />
                        {new Date(log.createdAt).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "medium" })}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getActionBadge(log.action)}`}>
                        {log.action}
                      </span>
                    </td>

                    <td className="px-6 py-4 font-semibold text-slate-800">
                      <span>{log.entity}</span>
                      {log.entityId && (
                        <span className="text-xs text-slate-400 block font-mono">#{log.entityId}</span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
                        <User size={13} className="text-slate-400" /> {log.actorName || "Staff Operator"}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">{log.actorRole || "Role"}</div>
                    </td>

                    <td className="px-6 py-4 text-xs font-mono text-slate-500">
                      {log.ipAddress || "127.0.0.1"}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="px-2.5 py-1 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg inline-flex items-center gap-1 shadow-sm transition-colors"
                      >
                        <Eye size={12} /> Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* INSPECT AUDIT ENTRY MODAL */}
      {selectedLog && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Audit Log Details</h2>
                <p className="text-xs text-slate-500 mt-0.5 font-mono">Log ID: {selectedLog.id}</p>
              </div>
              <button onClick={() => setSelectedLog(null)} className="text-slate-400 hover:text-slate-700 p-2">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-slate-400 font-bold uppercase">Action</span>
                  <p className="font-bold text-slate-900 mt-0.5">{selectedLog.action}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase">Target Entity</span>
                  <p className="font-bold text-slate-900 mt-0.5">{selectedLog.entity} ({selectedLog.entityId || "N/A"})</p>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase">Operator</span>
                  <p className="font-bold text-slate-900 mt-0.5">{selectedLog.actorName} ({selectedLog.actorRole})</p>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase">IP Address</span>
                  <p className="font-bold text-slate-900 mt-0.5 font-mono">{selectedLog.ipAddress || "127.0.0.1"}</p>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                  <Terminal size={14} /> Payload / Audit Metadata
                </label>
                <pre className="bg-slate-900 text-emerald-400 p-4 rounded-2xl text-xs font-mono overflow-x-auto max-h-60 leading-relaxed">
                  {JSON.stringify(selectedLog.details || { note: "No additional metadata attached" }, null, 2)}
                </pre>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setSelectedLog(null)}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-sm transition-colors"
                >
                  Close Inspection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
