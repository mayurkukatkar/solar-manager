"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { BarChart2, TrendingUp, Users, Briefcase, Receipt, ArrowUpRight, ArrowDownRight } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function ReportsPage() {
  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    (async () => {
      try {
        const [dashRes, finRes, projRes, leadRes] = await Promise.all([
          axios.get(`${API}/api/tenant/dashboard`, { withCredentials: true }),
          axios.get(`${API}/api/tenant/finance`, { withCredentials: true }),
          axios.get(`${API}/api/tenant/projects`, { withCredentials: true }),
          axios.get(`${API}/api/tenant/leads`, { withCredentials: true })
        ]);
        setData({
          dashboard: dashRes.data,
          finance: finRes.data.finance || [],
          projects: projRes.data.projects || [],
          leads: leadRes.data.leads || []
        });
      } catch (err) { console.error(err); }
    })();
  }, []);

  if (!data) return <div className="flex items-center justify-center h-64 text-slate-400">Loading reports...</div>;

  const d = data.dashboard;
  const statusBreakdown: Record<string, number> = {};
  data.projects.forEach((p: any) => { statusBreakdown[p.status] = (statusBreakdown[p.status] || 0) + 1; });

  const leadsBySource: Record<string, number> = {};
  data.leads.forEach((l: any) => { leadsBySource[l.source || "Unknown"] = (leadsBySource[l.source || "Unknown"] || 0) + 1; });

  const paidInvoices = data.finance.filter((f: any) => f.status === "PAID");
  const unpaidInvoices = data.finance.filter((f: any) => f.status !== "PAID");
  const totalRevenue = paidInvoices.reduce((sum: number, i: any) => sum + (i.amount || 0), 0);
  const totalPending = unpaidInvoices.reduce((sum: number, i: any) => sum + (i.amount || 0), 0);

  const monthlyRev: Record<string, number> = {};
  paidInvoices.forEach((inv: any) => {
    const month = new Date(inv.createdAt).toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
    monthlyRev[month] = (monthlyRev[month] || 0) + (inv.amount || 0);
  });

  const tabs = ["overview", "leads", "projects", "finance"];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Reports & Analytics</h1>
        <p className="text-sm text-slate-500 mt-1">Business insights and performance metrics</p>
      </div>

      <div className="flex gap-2 mb-6">
        {tabs.map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${activeTab === t ? "bg-emerald-600 text-white shadow-sm" : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"}`}>
            {t}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <span className="text-xs font-semibold text-slate-400 uppercase">Total Revenue</span>
              <p className="text-2xl font-bold text-slate-800 mt-1">₹{totalRevenue.toLocaleString()}</p>
              <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1 mt-1"><ArrowUpRight size={14} /> Collected</span>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <span className="text-xs font-semibold text-slate-400 uppercase">Pending Invoices</span>
              <p className="text-2xl font-bold text-slate-800 mt-1">₹{totalPending.toLocaleString()}</p>
              <span className="text-xs text-amber-600 font-semibold flex items-center gap-1 mt-1">{unpaidInvoices.length} unpaid</span>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <span className="text-xs font-semibold text-slate-400 uppercase">Active Projects</span>
              <p className="text-2xl font-bold text-slate-800 mt-1">{data.projects.length}</p>
              <span className="text-xs text-slate-500 font-semibold mt-1 block">In pipeline</span>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <span className="text-xs font-semibold text-slate-400 uppercase">Total Leads</span>
              <p className="text-2xl font-bold text-slate-800 mt-1">{data.leads.length}</p>
              <span className="text-xs text-blue-600 font-semibold mt-1 block">{leadsBySource["Referral"] || 0} via referral</span>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="text-sm font-bold text-slate-800 mb-4">Monthly Revenue Trend</h3>
              {Object.entries(monthlyRev).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(monthlyRev).map(([month, val]: [string, number]) => (
                    <div key={month} className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-slate-500 w-20">{month}</span>
                      <div className="flex-1 bg-slate-100 rounded-full h-6 overflow-hidden">
                        <div className="bg-emerald-500 h-6 rounded-full flex items-center justify-end pr-2 transition-all" style={{ width: `${Math.min((val / (totalRevenue || 1)) * 100, 100)}%` }}>
                          <span className="text-[10px] font-bold text-white">₹{val.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : <p className="text-slate-400 text-sm py-8 text-center">No revenue data yet</p>}
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="text-sm font-bold text-slate-800 mb-4">Project Status Breakdown</h3>
              <div className="space-y-3">
                {Object.entries(statusBreakdown).map(([status, count]: [string, number]) => (
                  <div key={status} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                    <span className="text-sm text-slate-600">{status}</span>
                    <span className="text-sm font-bold text-slate-800">{count}</span>
                  </div>
                ))}
                {Object.keys(statusBreakdown).length === 0 && <p className="text-slate-400 text-sm py-8 text-center">No projects yet</p>}
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === "leads" && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-sm font-bold text-slate-800 mb-4">Leads by Source</h3>
            <div className="space-y-3">
              {Object.entries(leadsBySource).sort((a: any, b: any) => b[1] - a[1]).map(([source, count]: [string, number]) => (
                <div key={source} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <span className="text-sm text-slate-600">{source}</span>
                  <span className="text-sm font-bold text-slate-800">{count}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-sm font-bold text-slate-800 mb-4">Lead Status Summary</h3>
            <div className="space-y-3">
              {Object.entries(data.leads.reduce((acc: any, l: any) => { acc[l.status] = (acc[l.status] || 0) + 1; return acc; }, {})).map(([status, count]: any) => (
                <div key={status} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <span className="text-sm text-slate-600">{status}</span>
                  <span className="text-sm font-bold text-slate-800">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "projects" && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-sm font-bold text-slate-800 mb-4">All Projects</h3>
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-200">
              {["Project", "Customer", "Capacity", "Status", "Value", "Progress"].map(h => (
                <th key={h} className="text-left px-3 py-2 text-xs font-semibold text-slate-500">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {data.projects.map((p: any) => (
                <tr key={p.id} className="border-b border-slate-100">
                  <td className="px-3 py-2.5 font-semibold text-slate-800">{p.name || p.projectNumber}</td>
                  <td className="px-3 py-2.5 text-slate-600">{p.customer?.name || "-"}</td>
                  <td className="px-3 py-2.5 text-slate-600">{p.capacity ? `${p.capacity} kW` : "-"}</td>
                  <td className="px-3 py-2.5"><span className="px-2 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">{p.status}</span></td>
                  <td className="px-3 py-2.5 text-slate-800 font-semibold">₹{(p.estimatedValue || 0).toLocaleString()}</td>
                  <td className="px-3 py-2.5"><div className="w-24 bg-slate-100 rounded-full h-2"><div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${p.progressPercent || 0}%` }} /></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "finance" && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-sm font-bold text-slate-800 mb-4">Invoice Summary</h3>
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-200">
              {["Invoice", "Customer", "Amount", "Status", "Date"].map(h => (
                <th key={h} className="text-left px-3 py-2 text-xs font-semibold text-slate-500">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {data.finance.map((inv: any) => (
                <tr key={inv.id} className="border-b border-slate-100">
                  <td className="px-3 py-2.5 font-semibold text-slate-800">{inv.invoiceNumber}</td>
                  <td className="px-3 py-2.5 text-slate-600">{inv.customer?.name || "-"}</td>
                  <td className="px-3 py-2.5 font-semibold text-slate-800">₹{(inv.amount || 0).toLocaleString()}</td>
                  <td className="px-3 py-2.5"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${inv.status === "PAID" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{inv.status}</span></td>
                  <td className="px-3 py-2.5 text-slate-500">{new Date(inv.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
