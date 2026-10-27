"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { 
  Zap, Plus, Play, Pause, CheckCircle2, Clock, AlertTriangle, 
  Settings, ArrowRight, RefreshCw, Trash2, Edit3, ShieldAlert,
  Sparkles, Check, X, FileText, ChevronRight, Sliders, Layers, Search
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface AutomationRule {
  id: string;
  name: string;
  description: string;
  category: "CRM" | "PROJECTS" | "FINANCE" | "DISCOM" | "AMC";
  trigger: string;
  condition: string;
  action: string;
  isActive: boolean;
  lastExecuted: string;
  runCount: number;
}

export default function AutomationPage() {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [metrics, setMetrics] = useState({ totalRules: 0, activeRules: 0, totalExecutions: 0 });
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [search, setSearch] = useState("");

  // Modals & States
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [simulatingId, setSimulatingId] = useState<string | null>(null);
  const [simFeedback, setSimFeedback] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "CRM",
    trigger: "",
    condition: "",
    action: "",
    isActive: true
  });

  const fetchRules = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (activeCategory !== "ALL") params.category = activeCategory;
      if (search) params.search = search;

      const res = await axios.get(`${API}/api/tenant/automation/rules`, { params, withCredentials: true });
      setRules(res.data.rules || []);
      if (res.data.metrics) setMetrics(res.data.metrics);
    } catch (err) {
      console.error("Error fetching automation rules:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, [activeCategory]);

  const handleToggle = async (ruleId: string) => {
    try {
      await axios.patch(`${API}/api/tenant/automation/rules/${ruleId}/toggle`, {}, { withCredentials: true });
      fetchRules();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to toggle rule state");
    }
  };

  const handleTestRun = async (ruleId: string) => {
    try {
      setSimulatingId(ruleId);
      const res = await axios.post(`${API}/api/tenant/automation/rules/${ruleId}/test`, {}, { withCredentials: true });
      setSimFeedback(res.data.message);
      setTimeout(() => setSimFeedback(null), 5000);
      fetchRules();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || "Simulation error");
    } finally {
      setSimulatingId(null);
    }
  };

  const handleDelete = async (ruleId: string) => {
    if (!confirm("Are you sure you want to delete this automation rule?")) return;
    try {
      await axios.delete(`${API}/api/tenant/automation/rules/${ruleId}`, { withCredentials: true });
      fetchRules();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to delete rule");
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.trigger.trim() || !formData.action.trim()) {
      alert("Please fill in Rule Name, Trigger, and Action");
      return;
    }

    try {
      setSubmitting(true);
      await axios.post(`${API}/api/tenant/automation/rules`, formData, { withCredentials: true });
      setShowModal(false);
      setFormData({
        name: "",
        description: "",
        category: "CRM",
        trigger: "",
        condition: "",
        action: "",
        isActive: true
      });
      fetchRules();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to create rule");
    } finally {
      setSubmitting(false);
    }
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case "CRM": return "bg-blue-50 text-blue-700 border-blue-200";
      case "PROJECTS": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "FINANCE": return "bg-purple-50 text-purple-700 border-purple-200";
      case "DISCOM": return "bg-amber-50 text-amber-700 border-amber-200";
      case "AMC": return "bg-rose-50 text-rose-700 border-rose-200";
      default: return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Automation & Workflows</h1>
          <p className="text-sm text-slate-500 mt-1">Smart triggers for auto-surveying, payment receipts, BOM reservations & DISCOM SLAs.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchRules} 
            className="p-2.5 text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            title="Refresh"
          >
            <RefreshCw size={16} />
          </button>
          <button 
            onClick={() => setShowModal(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <Plus size={18} /> New Automation Rule
          </button>
        </div>
      </div>

      {/* SIMULATION FEEDBACK ALERT */}
      {simFeedback && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-3 rounded-2xl flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-600" />
            <span className="text-sm font-semibold">{simFeedback}</span>
          </div>
          <button onClick={() => setSimFeedback(null)} className="text-emerald-700 hover:text-emerald-900">
            <X size={16} />
          </button>
        </div>
      )}

      {/* METRICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Configured Rules</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Sliders size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">{metrics.totalRules}</p>
          <p className="text-xs text-slate-400 mt-1">Total operational workflows</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Triggers</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Zap size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-600">{metrics.activeRules}</p>
          <p className="text-xs text-slate-400 mt-1">Listening in real-time</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Auto Executions</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Sparkles size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold text-purple-600">{metrics.totalExecutions.toLocaleString()}</p>
          <p className="text-xs text-slate-400 mt-1">Automated actions triggered</p>
        </div>
      </div>

      {/* FILTER TABS & SEARCH */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
            {["ALL", "CRM", "PROJECTS", "FINANCE", "DISCOM", "AMC"].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeCategory === cat 
                    ? "bg-emerald-600 text-white shadow-sm" 
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-80">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search triggers or actions..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === "Enter" && fetchRules()}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-emerald-500 transition-colors" 
            />
          </div>
        </div>

        {/* RULES LIST */}
        <div className="divide-y divide-slate-100">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
            </div>
          ) : rules.length === 0 ? (
            <div className="p-12 text-center text-slate-500 font-medium">
              No automation rules found.
            </div>
          ) : (
            rules.map((rule) => (
              <div key={rule.id} className="p-6 hover:bg-slate-50/80 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-bold text-slate-900 text-base">{rule.name}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getCategoryColor(rule.category)}`}>
                      {rule.category}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${rule.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                      {rule.isActive ? 'ACTIVE' : 'PAUSED'}
                    </span>
                  </div>

                  <p className="text-sm text-slate-600">{rule.description}</p>

                  {/* VISUAL FLOW DIAGRAM */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center gap-2 text-xs">
                    <div className="flex items-center gap-1.5 font-semibold text-slate-700 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200">
                      <Zap size={14} className="text-amber-500" />
                      <span className="text-slate-400">Trigger:</span> {rule.trigger}
                    </div>

                    <ArrowRight size={14} className="text-slate-400 hidden sm:block shrink-0" />

                    <div className="flex items-center gap-1.5 font-semibold text-slate-700 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200">
                      <Sliders size={14} className="text-blue-500" />
                      <span className="text-slate-400">Condition:</span> {rule.condition || "All"}
                    </div>

                    <ArrowRight size={14} className="text-slate-400 hidden sm:block shrink-0" />

                    <div className="flex items-center gap-1.5 font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200">
                      <Sparkles size={14} className="text-emerald-600" />
                      <span className="text-emerald-700">Action:</span> {rule.action}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span>Executed: {rule.runCount || 0} times</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} /> Last run: {rule.lastExecuted ? new Date(rule.lastExecuted).toLocaleDateString("en-IN") : "Ready"}
                    </span>
                  </div>
                </div>

                {/* CONTROLS */}
                <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
                  <button
                    onClick={() => handleTestRun(rule.id)}
                    disabled={simulatingId === rule.id}
                    className="px-3 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl flex items-center gap-1.5 shadow-sm transition-colors disabled:opacity-50"
                  >
                    <Play size={14} className="text-emerald-600 fill-emerald-600" />
                    {simulatingId === rule.id ? "Simulating..." : "Test Run"}
                  </button>

                  <button
                    onClick={() => handleToggle(rule.id)}
                    className={`px-3 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors border ${
                      rule.isActive
                        ? "bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200"
                        : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200"
                    }`}
                  >
                    {rule.isActive ? <Pause size={14} /> : <Play size={14} />}
                    {rule.isActive ? "Pause" : "Activate"}
                  </button>

                  <button
                    onClick={() => handleDelete(rule.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors"
                    title="Delete Rule"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* CREATE AUTOMATION RULE MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Create Automation Rule</h2>
                <p className="text-xs text-slate-500 mt-0.5">Define event triggers, conditions, and automated actions</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700 p-2">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Rule Name *</label>
                  <input 
                    required 
                    type="text" 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                    placeholder="e.g. Auto Reserve BOM on Quote Approval" 
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium text-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Category</label>
                  <select 
                    value={formData.category} 
                    onChange={e => setFormData({...formData, category: e.target.value as any})} 
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all bg-white font-medium text-slate-800"
                  >
                    <option value="CRM">CRM</option>
                    <option value="PROJECTS">PROJECTS</option>
                    <option value="FINANCE">FINANCE</option>
                    <option value="DISCOM">DISCOM</option>
                    <option value="AMC">AMC</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Description</label>
                <input 
                  type="text" 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                  placeholder="Explain what this automation accomplishes" 
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Event Trigger *</label>
                <input 
                  required 
                  type="text" 
                  value={formData.trigger} 
                  onChange={e => setFormData({...formData, trigger: e.target.value})} 
                  placeholder="e.g. Lead Status == 'QUALIFIED' or Milestone Paid" 
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Criteria Condition (Optional)</label>
                <input 
                  type="text" 
                  value={formData.condition} 
                  onChange={e => setFormData({...formData, condition: e.target.value})} 
                  placeholder="e.g. Proposed Capacity >= 3kW & Roof Area > 200 sq.ft" 
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Automated Action Execution *</label>
                <input 
                  required 
                  type="text" 
                  value={formData.action} 
                  onChange={e => setFormData({...formData, action: e.target.value})} 
                  placeholder="e.g. Create Site Survey Task + Dispatch WhatsApp to Client" 
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium text-slate-800"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="flex-1 py-3 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Zap size={16} />
                  {submitting ? "Saving..." : "Deploy Rule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
