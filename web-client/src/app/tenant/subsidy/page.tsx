"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { Landmark, Plus, X, TrendingUp, Clock, CheckCircle, XCircle, Filter } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function SubsidyPage() {
  const [subsidies, setSubsidies] = useState([]);
  const [metrics, setMetrics] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [filter, setFilter] = useState("");
  const [form, setForm] = useState({ customerId: "", projectId: "", applicationNo: "", amount: "" });

  const fetchData = async () => {
    try {
      const [subRes, custRes, projRes] = await Promise.all([
        axios.get(`${API}/api/tenant/subsidies${filter ? `?status=${filter}` : ""}`, { withCredentials: true }),
        axios.get(`${API}/api/tenant/customers`, { withCredentials: true }),
        axios.get(`${API}/api/tenant/projects`, { withCredentials: true })
      ]);
      setSubsidies(subRes.data.subsidies || []);
      setMetrics(subRes.data.metrics || {});
      setCustomers(custRes.data.customers || []);
      setProjects(projRes.data.projects || []);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchData(); }, [filter]);

  const handleCreate = async () => {
    try {
      await axios.post(`${API}/api/tenant/subsidies`, { ...form, amount: parseFloat(form.amount) || 0 }, { withCredentials: true });
      setShowModal(false);
      setForm({ customerId: "", projectId: "", applicationNo: "", amount: "" });
      fetchData();
    } catch (err) { alert(err.response?.data?.error || "Failed"); }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await axios.patch(`${API}/api/tenant/subsidies/${id}`, { status }, { withCredentials: true });
      fetchData();
    } catch (err) { console.error(err); }
  };

  const statusColors = {
    SUBMITTED: "bg-blue-50 text-blue-700", PROCESSING: "bg-yellow-50 text-yellow-700",
    APPROVED: "bg-emerald-50 text-emerald-700", REJECTED: "bg-red-50 text-red-700"
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Subsidy Applications</h1>
          <p className="text-sm text-slate-500 mt-1">Track government subsidy applications for solar installations</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors shadow-sm">
          <Plus size={16} /> New Application
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {[
          { label: "Total", value: metrics.total || 0, icon: Landmark, color: "text-slate-600" },
          { label: "Submitted", value: metrics.submitted || 0, icon: Clock, color: "text-blue-600" },
          { label: "Processing", value: metrics.processing || 0, icon: TrendingUp, color: "text-yellow-600" },
          { label: "Approved", value: metrics.approved || 0, icon: CheckCircle, color: "text-emerald-600" },
          { label: "Total Approved", value: `₹${(metrics.totalAmount || 0).toLocaleString()}`, icon: Landmark, color: "text-emerald-600" }
        ].map((m, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-1"><m.icon size={14} className={m.color} /><span className="text-xs font-semibold text-slate-500">{m.label}</span></div>
            <p className={`text-xl font-bold ${m.color}`}>{m.value}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        {["", "SUBMITTED", "PROCESSING", "APPROVED", "REJECTED"].map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${filter === s ? "bg-emerald-600 text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"}`}>
            {s || "All"}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-slate-50 border-b border-slate-200">
            {["Application No", "Customer", "Project", "Amount", "Status", "Date", "Actions"].map(h => (
              <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {subsidies.map(s => (
              <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                <td className="px-4 py-3 font-semibold text-slate-800">{s.applicationNo || "-"}</td>
                <td className="px-4 py-3 text-slate-600">{s.customer?.name || "-"}</td>
                <td className="px-4 py-3 text-slate-600">{s.project?.name || "-"}</td>
                <td className="px-4 py-3 font-semibold text-slate-800">₹{(s.amount || 0).toLocaleString()}</td>
                <td className="px-4 py-3"><span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusColors[s.status] || "bg-slate-100 text-slate-600"}`}>{s.status}</span></td>
                <td className="px-4 py-3 text-slate-500">{new Date(s.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <select value={s.status} onChange={e => handleStatusChange(s.id, e.target.value)} className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white">
                    {["SUBMITTED", "PROCESSING", "APPROVED", "REJECTED"].map(st => <option key={st} value={st}>{st}</option>)}
                  </select>
                </td>
              </tr>
            ))}
            {subsidies.length === 0 && <tr><td colSpan={7} className="text-center py-12 text-slate-400">No subsidy applications found</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-800">New Subsidy Application</h2>
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
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Application Number</label>
                <input value={form.applicationNo} onChange={e => setForm({...form, applicationNo: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm" placeholder="e.g. PM-KUSUM-2024-001" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Amount (₹)</label>
                <input type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm" placeholder="0" />
              </div>
              <button onClick={handleCreate} disabled={!form.customerId} className="w-full bg-emerald-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors">Submit Application</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
