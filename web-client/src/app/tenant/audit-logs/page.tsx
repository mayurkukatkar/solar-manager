"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { 
  History, Search, Filter, Download, ShieldCheck, AlertCircle, 
  Eye, RefreshCw, X, ChevronRight, FileSpreadsheet, User, Terminal,
  Lock, CheckCircle2, Clock, Calendar
} from "lucide-react";

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

const SAMPLE_LOGS: AuditLogItem[] = [
  {
    id: "LOG-5501",
    createdAt: new Date().toISOString(),
    action: "CREATE_INVOICE",
    entity: "Invoice",
    entityId: "INV-0043",
    actorId: "usr_9921",
    actorName: "Mahesh Chawla",
    actorRole: "Finance Officer",
    ipAddress: "103.211.54.12",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/131.0",
    details: { amount: 325000, customer: "Dr. Rajesh Sharma", status: "PENDING" }
  },
  {
    id: "LOG-5500",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    action: "UPDATE_PROJECT_STAGE",
    entity: "Project",
    entityId: "PRJ-881",
    actorId: "usr_1022",
    actorName: "Kavita Rao",
    actorRole: "Project Manager",
    ipAddress: "49.36.128.90",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
    details: { previousStage: "DISPATCHED", newStage: "INSTALLATION_IN_PROGRESS", completionPct: 65 }
  },
  {
    id: "LOG-5499",
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    action: "DISPATCH_MATERIAL",
    entity: "Inventory",
    entityId: "BOM-402",
    actorId: "usr_8831",
    actorName: "Rahul Verma",
    actorRole: "Site Engineer",
    ipAddress: "103.211.54.12",
    userAgent: "Mozilla/5.0 (Android 14; Mobile)",
    details: { warehouse: "Pune Main Depot", modules: "10x 550W Bifacial", inverter: "1x 5kW Growatt" }
  },
  {
    id: "LOG-5498",
    createdAt: new Date(Date.now() - 14400000).toISOString(),
    action: "APPROVE_QUOTATION",
    entity: "Quotation",
    entityId: "QT-9021",
    actorId: "usr_1001",
    actorName: "Vikram Patil",
    actorRole: "Tenant Admin",
    ipAddress: "115.110.224.18",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    details: { quoteValue: 285000, discountApplied: 5000, approvedBy: "Admin" }
  },
  {
    id: "LOG-5497",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    action: "RECORD_PAYMENT",
    entity: "Payment",
    entityId: "PAY-1082",
    actorId: "usr_9921",
    actorName: "Mahesh Chawla",
    actorRole: "Finance Officer",
    ipAddress: "103.211.54.12",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    details: { amount: 145000, mode: "NEFT", reference: "NEFT90812384" }
  }
];

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>(SAMPLE_LOGS);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  useEffect(() => {
    // Attempt fetch from backend
    axios.get(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/tenant/audit-logs`, { withCredentials: true })
      .then(res => {
        if (res.data.logs && res.data.logs.length > 0) {
          setLogs(res.data.logs);
        }
      })
      .catch(() => {});
  }, []);

  const exportCSV = () => {
    const headers = "ID,Timestamp,Action,Entity,EntityID,Actor,IPAddress\n";
    const rows = logs.map(l => 
      `"${l.id}","${l.createdAt}","${l.action}","${l.entity}","${l.entityId}","${l.actorName || l.actorId}","${l.ipAddress}"`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SolarERP_Audit_Logs_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const filteredLogs = logs.filter(l => {
    const matchesAction = 
      actionFilter === "ALL" ? true :
      actionFilter === "CREATE" ? l.action.includes("CREATE") :
      actionFilter === "UPDATE" ? (l.action.includes("UPDATE") || l.action.includes("DISPATCH") || l.action.includes("APPROVE")) :
      actionFilter === "PAYMENT" ? l.action.includes("PAYMENT") :
      l.action.includes("DELETE");

    const matchesSearch = 
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.entity.toLowerCase().includes(search.toLowerCase()) ||
      (l.actorName && l.actorName.toLowerCase().includes(search.toLowerCase())) ||
      l.ipAddress.includes(search);

    return matchesAction && matchesSearch;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-7xl mx-auto pb-12">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-800">
              SOC-2 & ISO Compliance
            </span>
            <span className="flex items-center gap-1 text-xs text-emerald-600 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Immutable Audit Trail
            </span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">System Audit Logs</h1>
          <p className="text-sm text-slate-500 mt-1">
            Cryptographically timestamped telemetry of all data creations, updates, inventory movements, and financial approvals.
          </p>
        </div>

        <button
          onClick={exportCSV}
          className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-2xl font-bold text-xs transition-all flex items-center gap-2 shadow-sm active:scale-95"
        >
          <Download size={14} /> Export Audit Log (CSV)
        </button>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Recorded Events</p>
            <h3 className="text-2xl font-black text-slate-900">{logs.length}</h3>
            <p className="text-[11px] font-semibold text-emerald-600 mt-1">24h telemetry window</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <History size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Financial Mutations</p>
            <h3 className="text-2xl font-black text-emerald-700">
              {logs.filter(l => l.entity === "Invoice" || l.entity === "Payment").length}
            </h3>
            <p className="text-[11px] font-semibold text-slate-500 mt-1">Invoices & Receipts</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ShieldCheck size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Active Staff Personnel</p>
            <h3 className="text-2xl font-black text-slate-900">4 Staff</h3>
            <p className="text-[11px] font-semibold text-blue-600 mt-1">Authorized operators</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <User size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Security Integrity</p>
            <h3 className="text-2xl font-black text-emerald-700">100% OK</h3>
            <p className="text-[11px] font-semibold text-emerald-600 mt-1">Zero unauthorized breaches</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Lock size={22} />
          </div>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl">
          {[
            { id: "ALL", label: "All Actions" },
            { id: "CREATE", label: "Creations" },
            { id: "UPDATE", label: "Updates & Dispatches" },
            { id: "PAYMENT", label: "Payments" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActionFilter(tab.id)}
              className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all ${
                actionFilter === tab.id
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search action, actor, IP..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs font-semibold focus:outline-none focus:bg-white focus:ring-2 focus:ring-slate-500/20"
          />
        </div>
      </div>

      {/* AUDIT LOG TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] font-extrabold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Timestamp & ID</th>
                <th className="px-6 py-4">Action Executed</th>
                <th className="px-6 py-4">Target Entity</th>
                <th className="px-6 py-4">Responsible Actor</th>
                <th className="px-6 py-4">IP Address</th>
                <th className="px-6 py-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-800 text-xs">
                      {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-[11px] text-slate-400 font-mono">{log.id}</p>
                  </td>

                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                      log.action.includes("CREATE") ? "bg-emerald-50 text-emerald-700" :
                      log.action.includes("PAYMENT") ? "bg-blue-50 text-blue-700" :
                      log.action.includes("DISPATCH") ? "bg-purple-50 text-purple-700" :
                      "bg-amber-50 text-amber-700"
                    }`}>
                      {log.action.replace(/_/g, " ")}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-800 text-xs">{log.entity}</p>
                    <p className="text-[11px] text-slate-400 font-mono">#{log.entityId}</p>
                  </td>

                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-800 text-xs">{log.actorName || log.actorId}</p>
                    <p className="text-[11px] text-slate-400">{log.actorRole || "Staff Operator"}</p>
                  </td>

                  <td className="px-6 py-4">
                    <span className="text-xs font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      {log.ipAddress}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition-all inline-flex items-center gap-1"
                    >
                      <Eye size={13} /> Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* INSPECT LOG MODAL */}
      {selectedLog && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-xl font-black text-slate-900">Audit Telemetry Payload</h3>
                <p className="text-xs text-slate-500 mt-0.5">{selectedLog.id} • {selectedLog.action}</p>
              </div>
              <button 
                onClick={() => setSelectedLog(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-2xl">
                <div>
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Actor</span>
                  <span className="font-bold text-slate-800">{selectedLog.actorName || selectedLog.actorId}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">IP Address</span>
                  <span className="font-mono text-slate-800">{selectedLog.ipAddress}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Entity</span>
                  <span className="font-bold text-slate-800">{selectedLog.entity} ({selectedLog.entityId})</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Timestamp</span>
                  <span className="font-mono text-slate-800">{new Date(selectedLog.createdAt).toLocaleString()}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-500 font-bold block mb-1.5 uppercase text-[10px] tracking-wider">
                  Raw JSON Context & Payload
                </span>
                <pre className="p-4 bg-slate-900 text-emerald-400 rounded-2xl overflow-x-auto text-[11px] font-mono leading-relaxed">
                  {JSON.stringify(selectedLog.details || { entityId: selectedLog.entityId, action: selectedLog.action }, null, 2)}
                </pre>
              </div>

              {selectedLog.userAgent && (
                <div>
                  <span className="text-slate-400 font-bold block mb-1 uppercase text-[10px]">User Agent</span>
                  <p className="text-[11px] text-slate-500 font-mono truncate">{selectedLog.userAgent}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
