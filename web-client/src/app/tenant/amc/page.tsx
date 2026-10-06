"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { ShieldCheck, Plus, X, AlertTriangle, CheckCircle, Clock } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function AMCPage() {
  const [amcs, setAmcs] = useState([]);
  const [metrics, setMetrics] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [filter, setFilter] = useState("");
  const [form, setForm] = useState({ customerId: "", projectId: "", contractNumber: "", startDate: "", endDate: "", value: "" });

  const fetchData = async () => {
    try {
      const [amcRes, custRes, projRes] = await Promise.all([
        axios.get(`${API}/api/tenant/amcs${filter ? `?status=${filter}` : ""}`, { withCredentials: true }),
        axios.get(`${API}/api/tenant/customers`, { withCredentials: true }),
        axios.get(`${API}/api/tenant/projects`, { withCredentials: true })
      ]);
      setAmcs(amcRes.data.amcs || []);
      setMetrics(amcRes.data.metrics || {});
      setCustomers(custRes.data.customers || []);
      setProjects(projRes.data.projects || []);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchData(); }, [filter]);

  const handleCreate = async () => {
    try {
      await axios.post(`${API}/api/tenant/amcs`, { ...form, value: parseFloat(form.value) || 0 }, { withCredentials: true });
      setShowModal(false);
      setForm({ customerId: "", projectId: "", contractNumber: "", startDate: "", endDate: "", value: "" });
      fetchData();
    } catch (err) { alert(err.response?.data?.error || "Failed"); }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await axios.patch(`${API}/api/tenant/amcs/${id}`, { status }, { withCredentials: true });
      fetchData();
    } catch (err) { console.error(err); }
  };

  const getDaysLeft = (endDate) => {
    const days = Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">AMC Contracts</h1>
          <p className="text-sm text-slate-500 mt-1">Annual Maintenance Contract management</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors shadow-sm">
          <Plus size={16} /> New AMC
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Contracts", value: metrics.total || 0, icon: ShieldCheck, color: "text-slate-600" },
          { label: "Active", value: metrics.active || 0, icon: CheckCircle, color: "text-emerald-600" },
          { label: "Expiring Soon", value: metrics.expiringSoon || 0, icon: AlertTriangle, color: "text-amber-600" },
          { label: "Total Value", value: `₹${(metrics.totalValue || 0).toLocaleString()}`, icon: ShieldCheck, color: "text-emerald-600" }
        ].map((m, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-1"><m.icon size={14} className={m.color} /><span className="text-xs font-semibold text-slate-500">{m.label}</span></div>
            <p className={`text-xl font-bold ${m.color}`}>{m.value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mb-4">
        {["", "ACTIVE", "EXPIRED"].map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${filter === s ? "bg-emerald-600 text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"}`}>
            {s || "All"}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-slate-50 border-b border-slate-200">
            {["Contract No", "Customer", "Project", "Start", "End", "Days Left", "Value", "Status", "Actions"].map(h => (
              <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {amcs.map(a => {
              const daysLeft = getDaysLeft(a.endDate);
              return (
                <tr key={a.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-semibold text-slate-800">{a.contractNumber}</td>
                  <td className="px-4 py-3 text-slate-600">{a.customer?.name || "-"}</td>
                  <td className="px-4 py-3 text-slate-600">{a.project?.name || "-"}</td>
                  <td className="px-4 py-3 text-slate-500">{new Date(a.startDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-slate-500">{new Date(a.endDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold ${daysLeft <= 0 ? "text-red-600" : daysLeft <= 30 ? "text-amber-600" : "text-emerald-600"}`}>
                      {daysLeft <= 0 ? "Expired" : `${daysLeft}d`}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-800">₹{(a.value || 0).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${a.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{a.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <select value={a.status} onChange={e => handleStatusChange(a.id, e.target.value)} className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white">
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="EXPIRED">EXPIRED</option>
                    </select>
                  </td>
                </tr>
              );
            })}
            {amcs.length === 0 && <tr><td colSpan={9} className="text-center py-12 text-slate-400">No AMC contracts found</td></tr>}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-800">New AMC Contract</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Customer *</label>
                <select value={form.customerId} onChange={e => setForm({...form, customerId: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm">
                  <option value="">Select Customer</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Project</label>
                <select value={form.projectId} onChange={e => setForm({...form, projectId: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm">
                  <option value="">Select Project</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Start Date *</label>
                  <input type="date" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">End Date *</label>
                  <input type="date" value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Contract Value (₹)</label>
                <input type="number" value={form.value} onChange={e => setForm({...form, value: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm" placeholder="0" />
              </div>
              <button onClick={handleCreate} disabled={!form.customerId || !form.startDate || !form.endDate} className="w-full bg-emerald-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors">Create AMC</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
