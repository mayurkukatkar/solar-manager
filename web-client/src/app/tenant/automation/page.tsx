"use client";
import { useState } from "react";
import { 
  Zap, Plus, Play, Pause, CheckCircle2, Clock, AlertTriangle, 
  Settings, ArrowRight, RefreshCw, Trash2, Edit3, ShieldAlert,
  Sparkles, Check, X, FileText, ChevronRight, Sliders, Layers
} from "lucide-react";

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

const INITIAL_RULES: AutomationRule[] = [
  {
    id: "AUTO-101",
    name: "Auto-Schedule Survey on Lead Qualification",
    description: "When a lead status changes to 'QUALIFIED', instantly create a Site Survey task and notify regional engineer.",
    category: "CRM",
    trigger: "Lead Status == 'QUALIFIED'",
    condition: "Rooftop area > 200 sq.ft & Sanctioned Load >= 3kW",
    action: "Create Site Survey Task + Send WhatsApp to Customer",
    isActive: true,
    lastExecuted: "22 mins ago",
    runCount: 142
  },
  {
    id: "AUTO-102",
    name: "Instant GST Invoice & Receipt on Payment",
    description: "When advance or milestone payment is marked PAID, generate tax invoice and WhatsApp receipt to customer.",
    category: "FINANCE",
    trigger: "Payment Recorded == 'PAID'",
    condition: "Amount > ₹0 & Valid GSTIN/PAN",
    action: "Generate Invoice PDF + Dispatch Receipt via WhatsApp",
    isActive: true,
    lastExecuted: "1 hour ago",
    runCount: 89
  },
  {
    id: "AUTO-103",
    name: "Auto BOM & Warehouse Material Reservation",
    description: "When quotation is approved and advance received, convert to Project and lock BOM stock in primary warehouse.",
    category: "PROJECTS",
    trigger: "Quotation Accepted + Advance Received",
    condition: "Project System Type == 'ON_GRID'",
    action: "Create Project + Reserve Solar Panels & Inverters in BOM",
    isActive: true,
    lastExecuted: "3 hours ago",
    runCount: 64
  },
  {
    id: "AUTO-104",
    name: "Net-Metering Discom Filing Alarm",
    description: "When physical installation reaches 100%, trigger net-metering synchronization with Discom portal.",
    category: "DISCOM",
    trigger: "Installation Progress == 100%",
    condition: "CEIG / Electrical Safety Certificate verified",
    action: "Create Discom Filing Task + Alert Liaison Officer",
    isActive: true,
    lastExecuted: "Yesterday",
    runCount: 38
  },
  {
    id: "AUTO-105",
    name: "PM Surya Ghar Subsidy Claim Trigger",
    description: "When Discom bi-directional meter is installed, notify customer and submit subsidy claim on National Portal.",
    category: "DISCOM",
    trigger: "Discom Net-Meter Synchronized",
    condition: "Project Capacity <= 10kW & Residential",
    action: "Send PM Surya Ghar Doc Checklist + Email Liaison Dept",
    isActive: true,
    lastExecuted: "2 days ago",
    runCount: 51
  },
  {
    id: "AUTO-106",
    name: "AMC Annual Renewal Warning (30-Day Alert)",
    description: "Send automated maintenance health-check summary and AMC contract renewal quote 30 days before contract expiry.",
    category: "AMC",
    trigger: "AMC Contract Expiry in 30 Days",
    condition: "Active AMC Status == 'ACTIVE'",
    action: "Dispatch WhatsApp Renewal Offer + Create Sales Follow-up",
    isActive: false,
    lastExecuted: "5 days ago",
    runCount: 27
  }
];

const INITIAL_LOGS = [
  { id: "LOG-902", ruleName: "Auto-Schedule Survey", target: "Lead #LD-1042 (Rajesh Sharma)", status: "SUCCESS", timestamp: "10 mins ago" },
  { id: "LOG-901", ruleName: "Instant GST Invoice", target: "Invoice #INV-0042 (Sunita Verma)", status: "SUCCESS", timestamp: "45 mins ago" },
  { id: "LOG-900", ruleName: "Auto BOM Material Reservation", target: "Project #PRJ-881 (Kunal Mehra)", status: "SUCCESS", timestamp: "2 hours ago" },
  { id: "LOG-899", ruleName: "Net-Metering Discom Filing", target: "Project #PRJ-874 (Green Valley)", status: "SUCCESS", timestamp: "Yesterday" },
  { id: "LOG-898", ruleName: "PM Surya Ghar Subsidy Trigger", target: "Customer #CUST-412 (Prakash K.)", status: "SUCCESS", timestamp: "Yesterday" }
];

export default function AutomationPage() {
  const [rules, setRules] = useState<AutomationRule[]>(INITIAL_RULES);
  const [logs, setLogs] = useState(INITIAL_LOGS);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [toast, setToast] = useState("");

  // Create form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "CRM" as any,
    trigger: "Lead Status == 'QUALIFIED'",
    condition: "Capacity >= 3kW",
    action: "Send WhatsApp Notification + Assign Staff"
  });

  const toggleRule = (id: string) => {
    setRules(rules.map(r => {
      if (r.id === id) {
        const nextState = !r.isActive;
        setToast(`Automation "${r.name}" is now ${nextState ? "ACTIVE" : "PAUSED"}.`);
        setTimeout(() => setToast(""), 3500);
        return { ...r, isActive: nextState };
      }
      return r;
    }));
  };

  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    const newRule: AutomationRule = {
      id: `AUTO-${Math.floor(107 + Math.random() * 50)}`,
      name: formData.name,
      description: formData.description,
      category: formData.category,
      trigger: formData.trigger,
      condition: formData.condition,
      action: formData.action,
      isActive: true,
      lastExecuted: "Never",
      runCount: 0
    };
    setRules([newRule, ...rules]);
    setShowCreateModal(false);
    setToast(`New automation rule "${formData.name}" created successfully!`);
    setTimeout(() => setToast(""), 3500);
    setFormData({
      name: "",
      description: "",
      category: "CRM",
      trigger: "Lead Status == 'QUALIFIED'",
      condition: "Capacity >= 3kW",
      action: "Send WhatsApp Notification + Assign Staff"
    });
  };

  const filteredRules = selectedCategory === "ALL" 
    ? rules 
    : rules.filter(r => r.category === selectedCategory);

  const activeCount = rules.filter(r => r.isActive).length;
  const totalExecutions = rules.reduce((sum, r) => sum + r.runCount, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-7xl mx-auto pb-12">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-800">
              Workflow Engine
            </span>
            <span className="flex items-center gap-1 text-xs text-emerald-600 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              {activeCount} Active Triggers Running
            </span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Workflow Automation</h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure event-driven triggers to automate CRM follow-ups, project handoffs, BOM reservations, and subsidy workflows.
          </p>
        </div>

        <button 
          onClick={() => setShowCreateModal(true)}
          className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 rounded-2xl font-bold text-sm transition-all flex items-center gap-2 shadow-lg shadow-amber-600/20 active:scale-95"
        >
          <Plus size={18} /> Create Custom Automation
        </button>
      </div>

      {toast && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-600" />
            <span className="text-sm font-semibold">{toast}</span>
          </div>
          <button onClick={() => setToast("")} className="text-emerald-600 hover:text-emerald-800">
            <X size={16} />
          </button>
        </div>
      )}

      {/* KPI METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Automations</p>
            <h3 className="text-2xl font-black text-slate-900">{rules.length}</h3>
            <p className="text-[11px] font-semibold text-emerald-600 mt-1">
              {activeCount} Enabled / {rules.length - activeCount} Paused
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Zap size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Executions</p>
            <h3 className="text-2xl font-black text-slate-900">{totalExecutions}</h3>
            <p className="text-[11px] font-semibold text-blue-600 mt-1">This Month</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Layers size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Manual Hours Saved</p>
            <h3 className="text-2xl font-black text-emerald-700">~148 hrs</h3>
            <p className="text-[11px] font-semibold text-slate-500 mt-1">Estimated team savings</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Clock size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Execution Accuracy</p>
            <h3 className="text-2xl font-black text-slate-900">99.8%</h3>
            <p className="text-[11px] font-semibold text-emerald-600 mt-1">Zero failed handoffs</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Sparkles size={22} />
          </div>
        </div>
      </div>

      {/* CATEGORY FILTER TABS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: "ALL", label: "All Rules" },
          { id: "CRM", label: "CRM & Surveys" },
          { id: "PROJECTS", label: "Project Execution & BOM" },
          { id: "FINANCE", label: "Billing & Invoicing" },
          { id: "DISCOM", label: "Discom & Subsidy" },
          { id: "AMC", label: "AMC Maintenance" },
        ].map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategory === cat.id
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* AUTOMATION RULES CARDS */}
      <div className="space-y-4">
        {filteredRules.map((rule) => (
          <div 
            key={rule.id}
            className={`bg-white rounded-3xl border p-6 transition-all shadow-sm ${
              rule.isActive ? "border-slate-200/80 hover:border-amber-300" : "border-slate-200/40 bg-slate-50/50 opacity-75"
            }`}
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                    rule.category === "CRM" ? "bg-blue-100 text-blue-700" :
                    rule.category === "FINANCE" ? "bg-emerald-100 text-emerald-700" :
                    rule.category === "PROJECTS" ? "bg-purple-100 text-purple-700" :
                    rule.category === "DISCOM" ? "bg-indigo-100 text-indigo-700" :
                    "bg-amber-100 text-amber-700"
                  }`}>
                    {rule.category}
                  </span>
                  <span className="text-xs font-bold text-slate-400">{rule.id}</span>
                  <h3 className="font-bold text-base text-slate-900">{rule.name}</h3>
                </div>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">{rule.description}</p>
                
                {/* PIPELINE VISUALIZATION */}
                <div className="flex flex-wrap items-center gap-2 pt-2 text-xs">
                  <div className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 border border-slate-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    Trigger: {rule.trigger}
                  </div>
                  <ArrowRight size={14} className="text-slate-400" />
                  <div className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 border border-slate-200">
                    <Sliders size={12} className="text-slate-500" />
                    Condition: {rule.condition}
                  </div>
                  <ArrowRight size={14} className="text-slate-400" />
                  <div className="bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 border border-emerald-200">
                    <CheckCircle2 size={12} className="text-emerald-600" />
                    Action: {rule.action}
                  </div>
                </div>
              </div>

              {/* ACTION TOGGLE */}
              <div className="flex items-center gap-4 shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0">
                <div className="text-right">
                  <p className="text-[11px] font-bold text-slate-400 uppercase">Executions</p>
                  <p className="text-sm font-black text-slate-800">{rule.runCount} runs</p>
                  <p className="text-[10px] text-slate-400">Last: {rule.lastExecuted}</p>
                </div>

                <button
                  onClick={() => toggleRule(rule.id)}
                  className={`px-4 py-2 rounded-2xl text-xs font-extrabold flex items-center gap-2 transition-all shadow-sm ${
                    rule.isActive
                      ? "bg-emerald-600 text-white hover:bg-emerald-700"
                      : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                  }`}
                >
                  {rule.isActive ? <Play size={14} /> : <Pause size={14} />}
                  {rule.isActive ? "ACTIVE" : "PAUSED"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* RECENT AUTOMATION EXECUTION LOG */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="font-bold text-slate-800 text-base">Execution Audit Stream</h3>
            <p className="text-xs text-slate-400 mt-0.5">Live real-time feed of automated tasks executed</p>
          </div>
          <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-xl">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Listening for triggers
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {logs.map((log) => (
            <div key={log.id} className="p-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={16} />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-800">{log.ruleName}</h4>
                  <p className="text-[11px] text-slate-500">{log.target}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {log.status}
                </span>
                <span className="text-xs text-slate-400 font-medium">{log.timestamp}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-xl font-black text-slate-900">Create Workflow Trigger</h3>
                <p className="text-xs text-slate-500 mt-0.5">Automate operational solar events without writing code</p>
              </div>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateRule} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-extrabold uppercase text-slate-500 tracking-wider mb-1 block">
                  Rule Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Notify Site Engineer on Dispatch"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-extrabold uppercase text-slate-500 tracking-wider mb-1 block">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:bg-white"
                >
                  <option value="CRM">CRM & Surveys</option>
                  <option value="PROJECTS">Project Execution & BOM</option>
                  <option value="FINANCE">Billing & Invoicing</option>
                  <option value="DISCOM">Discom & Subsidy</option>
                  <option value="AMC">AMC Maintenance</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-extrabold uppercase text-slate-500 tracking-wider mb-1 block">
                  Event Trigger *
                </label>
                <select
                  value={formData.trigger}
                  onChange={(e) => setFormData({ ...formData, trigger: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:bg-white"
                >
                  <option value="Lead Status == 'QUALIFIED'">When Lead is marked QUALIFIED</option>
                  <option value="Survey Submitted">When Site Survey is submitted by technician</option>
                  <option value="Quotation Approved">When Customer approves quotation</option>
                  <option value="Payment Recorded == 'PAID'">When Milestone Payment is marked PAID</option>
                  <option value="Installation Progress == 100%">When Physical Installation is 100%</option>
                  <option value="Discom Net-Meter Synchronized">When Net-Meter is synchronised</option>
                  <option value="AMC Contract Expiry in 30 Days">When AMC contract is due in 30 days</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-extrabold uppercase text-slate-500 tracking-wider mb-1 block">
                  Condition Filter
                </label>
                <input
                  type="text"
                  placeholder="e.g. System Capacity >= 5kW"
                  value={formData.condition}
                  onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-extrabold uppercase text-slate-500 tracking-wider mb-1 block">
                  Automated Action *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Create Installation Job + Reserve Inventory BOM"
                  value={formData.action}
                  onChange={(e) => setFormData({ ...formData, action: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-amber-600/20 transition-all active:scale-95"
                >
                  <Zap size={14} />
                  Deploy Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
