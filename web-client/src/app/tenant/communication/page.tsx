"use client";
import { useState } from "react";
import { 
  MessageSquare, Send, Mail, Phone, MessageCircle, CheckCheck, 
  Clock, AlertCircle, Plus, Search, Filter, RefreshCw, User, 
  Paperclip, ChevronRight, Check, Sparkles, Smartphone, ShieldCheck,
  Zap, Calendar, ArrowUpRight, Copy, Eye, X
} from "lucide-react";

interface MessageRecord {
  id: string;
  recipientName: string;
  recipientContact: string;
  channel: "WHATSAPP" | "SMS" | "EMAIL";
  template: string;
  content: string;
  status: "DELIVERED" | "READ" | "SENT" | "FAILED";
  timestamp: string;
  category: "QUOTATION" | "SURVEY" | "INSTALLATION" | "SUBSIDY" | "PAYMENT" | "GENERAL";
}

const INITIAL_MESSAGES: MessageRecord[] = [
  {
    id: "MSG-1081",
    recipientName: "Rajesh Sharma",
    recipientContact: "+91 98201 44521",
    channel: "WHATSAPP",
    template: "Quotation Generated",
    content: "Namaste Rajesh ji, your 5kW On-Grid Solar Proposal is ready! Estimated annual savings: ₹64,800. View & Approve your detailed proposal: https://solarerp.app/q/q-9021",
    status: "READ",
    timestamp: "10 mins ago",
    category: "QUOTATION"
  },
  {
    id: "MSG-1080",
    recipientName: "Anil Deshmukh",
    recipientContact: "+91 97654 32109",
    channel: "SMS",
    template: "Site Survey Scheduled",
    content: "SolarTech Alert: Site survey confirmed for tomorrow at 11:30 AM. Senior Engineer Vikram Patil will visit your premises. Helpdesk: 1800-209-4455.",
    status: "DELIVERED",
    timestamp: "45 mins ago",
    category: "SURVEY"
  },
  {
    id: "MSG-1079",
    recipientName: "Sunita Verma",
    recipientContact: "sunita.verma@gmail.com",
    channel: "EMAIL",
    template: "Payment Receipt & Tax Invoice",
    content: "Dear Sunita, payment of ₹1,45,000 against INV-0042 has been successfully received. GST invoice #INV-0042 attached. System dispatch initiated.",
    status: "DELIVERED",
    timestamp: "2 hours ago",
    category: "PAYMENT"
  },
  {
    id: "MSG-1078",
    recipientName: "Kunal Mehra",
    recipientContact: "+91 99887 76655",
    channel: "WHATSAPP",
    template: "Subsidy Sanctioned Alert",
    content: "Great news Kunal ji! Your Central Government PM Surya Ghar Subsidy of ₹78,000 has been sanctioned by MNRE. Expected account credit within 7 banking days.",
    status: "READ",
    timestamp: "Yesterday",
    category: "SUBSIDY"
  },
  {
    id: "MSG-1077",
    recipientName: "Green Valley Housing Society",
    recipientContact: "+91 91234 56780",
    channel: "WHATSAPP",
    template: "Installation Milestone",
    content: "Update on 50kW Society Solar: Structure fabrication & inverter mounting completed 100%. Net-metering inspection scheduled for Thursday.",
    status: "DELIVERED",
    timestamp: "Yesterday",
    category: "INSTALLATION"
  },
  {
    id: "MSG-1076",
    recipientName: "Prakash Kulkarni",
    recipientContact: "+91 98451 22334",
    channel: "SMS",
    template: "Annual Maintenance Due",
    content: "Solar Alert: Your 1st Quarter Solar AMC health checkup is due. Our technician will clean panels and test inverter efficiency this Saturday.",
    status: "SENT",
    timestamp: "2 days ago",
    category: "GENERAL"
  }
];

const TEMPLATES = [
  {
    id: "T1",
    title: "Quotation Generated & Shared",
    category: "QUOTATION",
    channel: "WHATSAPP",
    text: "Namaste {{customer_name}}, your {{capacity}}kW Solar System proposal is ready! Estimated monthly savings: ₹{{savings}}. Review your design & quotation here: {{link}}"
  },
  {
    id: "T2",
    title: "Site Survey Appointment",
    category: "SURVEY",
    channel: "SMS",
    text: "Solar Alert: Site survey for {{customer_name}} is confirmed for {{date}} at {{time}}. Engineer {{engineer_name}} (+91 {{phone}}) is assigned."
  },
  {
    id: "T3",
    title: "Material Dispatched to Site",
    category: "INSTALLATION",
    channel: "WHATSAPP",
    text: "Your solar material kit (Modules & Inverter) has been dispatched from Pune warehouse via vehicle {{vehicle_no}}. Expected delivery: {{expected_time}}."
  },
  {
    id: "T4",
    title: "PM Surya Ghar Subsidy Sanctioned",
    category: "SUBSIDY",
    channel: "WHATSAPP",
    text: "Congratulations {{customer_name}}! MNRE subsidy of ₹{{amount}} for Application #{{app_no}} has been sanctioned. Discom net-metering status: ACTIVE."
  },
  {
    id: "T5",
    title: "Payment Reminder (Friendly)",
    category: "PAYMENT",
    channel: "WHATSAPP",
    text: "Gentle reminder: Invoice #{{invoice_no}} of ₹{{amount}} for your rooftop solar project is due on {{due_date}}. Quick payment link: {{pay_link}}"
  },
  {
    id: "T6",
    title: "AMC Panel Cleaning Schedule",
    category: "GENERAL",
    channel: "SMS",
    text: "Solar Care: Your scheduled seasonal AMC panel cleaning is booked for {{date}}. Clean panels increase generation by up to 25%! Tollfree: 1800-209-4455."
  }
];

export default function CommunicationPage() {
  const [messages, setMessages] = useState<MessageRecord[]>(INITIAL_MESSAGES);
  const [activeTab, setActiveTab] = useState<"ALL" | "WHATSAPP" | "SMS" | "EMAIL">("ALL");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [sending, setSending] = useState(false);
  const [successToast, setSuccessToast] = useState("");

  // Compose form state
  const [composeForm, setComposeForm] = useState({
    recipientName: "",
    recipientContact: "",
    channel: "WHATSAPP" as "WHATSAPP" | "SMS" | "EMAIL",
    category: "QUOTATION" as any,
    templateTitle: "Custom Message",
    content: ""
  });

  const handleSelectTemplate = (tpl: any) => {
    setSelectedTemplate(tpl);
    setComposeForm({
      ...composeForm,
      channel: tpl.channel,
      category: tpl.category,
      templateTitle: tpl.title,
      content: tpl.text
    });
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setTimeout(() => {
      const newMsg: MessageRecord = {
        id: `MSG-${Math.floor(1082 + Math.random() * 500)}`,
        recipientName: composeForm.recipientName || "Valued Customer",
        recipientContact: composeForm.recipientContact,
        channel: composeForm.channel,
        template: composeForm.templateTitle,
        content: composeForm.content,
        status: "DELIVERED",
        timestamp: "Just now",
        category: composeForm.category
      };
      setMessages([newMsg, ...messages]);
      setSending(false);
      setShowComposeModal(false);
      setSuccessToast(`Message successfully queued and sent via ${composeForm.channel}!`);
      setTimeout(() => setSuccessToast(""), 4000);
      setComposeForm({
        recipientName: "",
        recipientContact: "",
        channel: "WHATSAPP",
        category: "QUOTATION",
        templateTitle: "Custom Message",
        content: ""
      });
    }, 600);
  };

  const filteredMessages = messages.filter(m => {
    const matchesTab = activeTab === "ALL" || m.channel === activeTab;
    const matchesCategory = categoryFilter === "ALL" || m.category === categoryFilter;
    const matchesSearch = 
      m.recipientName.toLowerCase().includes(search.toLowerCase()) ||
      m.recipientContact.includes(search) ||
      m.content.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesCategory && matchesSearch;
  });

  const whatsappCount = messages.filter(m => m.channel === "WHATSAPP").length;
  const smsCount = messages.filter(m => m.channel === "SMS").length;
  const emailCount = messages.filter(m => m.channel === "EMAIL").length;

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-7xl mx-auto pb-12">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
              Omnichannel Hub
            </span>
            <span className="flex items-center gap-1 text-xs text-emerald-600 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Gateway Active
            </span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Customer Communication</h1>
          <p className="text-sm text-slate-500 mt-1">
            Dispatch quotations, survey alerts, subsidy updates, and payment reminders via WhatsApp, SMS, and Email.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowComposeModal(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-2xl font-bold text-sm transition-all flex items-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-95"
          >
            <Plus size={18} /> New Broadcast / Message
          </button>
        </div>
      </div>

      {successToast && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCheck size={18} className="text-emerald-600" />
            <span className="text-sm font-semibold">{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast("")} className="text-emerald-600 hover:text-emerald-800">
            <X size={16} />
          </button>
        </div>
      )}

      {/* KPI METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Dispatches</p>
            <h3 className="text-2xl font-black text-slate-900">{messages.length}</h3>
            <p className="text-[11px] font-semibold text-emerald-600 mt-1 flex items-center gap-1">
              <CheckCheck size={12} /> 99.4% Delivery Rate
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600">
            <MessageSquare size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">WhatsApp Business</p>
            <h3 className="text-2xl font-black text-emerald-700">{whatsappCount}</h3>
            <p className="text-[11px] font-semibold text-slate-500 mt-1">Meta Cloud API Connected</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <MessageCircle size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Transactional SMS</p>
            <h3 className="text-2xl font-black text-blue-700">{smsCount}</h3>
            <p className="text-[11px] font-semibold text-slate-500 mt-1">DLT Approved Routes</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Smartphone size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Customer Emails</p>
            <h3 className="text-2xl font-black text-purple-700">{emailCount}</h3>
            <p className="text-[11px] font-semibold text-slate-500 mt-1">SMTP / Postmark Relay</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Mail size={22} />
          </div>
        </div>
      </div>

      {/* QUICK TEMPLATES PREVIEWS */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-emerald-400" />
            <h2 className="text-lg font-bold">1-Click Solar Customer Templates</h2>
          </div>
          <span className="text-xs text-slate-400">Pre-approved for WhatsApp & DLT SMS</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {TEMPLATES.slice(0, 3).map((tpl) => (
            <div 
              key={tpl.id}
              onClick={() => {
                handleSelectTemplate(tpl);
                setShowComposeModal(true);
              }}
              className="bg-white/5 hover:bg-white/10 border border-white/10 p-4 rounded-2xl cursor-pointer transition-all hover:scale-[1.01] group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                    tpl.channel === "WHATSAPP" ? "bg-emerald-500/20 text-emerald-300" : "bg-blue-500/20 text-blue-300"
                  }`}>
                    {tpl.channel}
                  </span>
                  <span className="text-[10px] font-medium text-slate-400">{tpl.category}</span>
                </div>
                <h4 className="font-bold text-sm text-white group-hover:text-emerald-300 transition-colors">{tpl.title}</h4>
                <p className="text-xs text-slate-300 line-clamp-2 mt-1.5 font-normal leading-relaxed">{tpl.text}</p>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 mt-3">
                Use Template <ChevronRight size={14} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FILTER & DISPATCH HISTORY */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* TAB CONTROLS */}
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
            {(["ALL", "WHATSAPP", "SMS", "EMAIL"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === tab 
                    ? "bg-slate-900 text-white shadow-sm" 
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                {tab === "ALL" ? "All Channels" : tab}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search recipient or content..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 focus:outline-none"
            >
              <option value="ALL">All Topics</option>
              <option value="QUOTATION">Quotations</option>
              <option value="SURVEY">Site Surveys</option>
              <option value="INSTALLATION">Installation</option>
              <option value="SUBSIDY">Govt Subsidy</option>
              <option value="PAYMENT">Payments</option>
              <option value="GENERAL">General</option>
            </select>
          </div>
        </div>

        {/* MESSAGES TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider text-[11px] font-extrabold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Channel & Recipient</th>
                <th className="px-6 py-4">Subject / Template</th>
                <th className="px-6 py-4">Message Snippet</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMessages.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium">
                    No dispatched messages match your search criteria.
                  </td>
                </tr>
              ) : (
                filteredMessages.map((msg) => (
                  <tr key={msg.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          msg.channel === "WHATSAPP" ? "bg-emerald-50 text-emerald-600" :
                          msg.channel === "SMS" ? "bg-blue-50 text-blue-600" :
                          "bg-purple-50 text-purple-600"
                        }`}>
                          {msg.channel === "WHATSAPP" && <MessageCircle size={18} />}
                          {msg.channel === "SMS" && <Smartphone size={18} />}
                          {msg.channel === "EMAIL" && <Mail size={18} />}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 leading-tight">{msg.recipientName}</p>
                          <p className="text-xs text-slate-400 font-medium">{msg.recipientContact}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                        {msg.template}
                      </span>
                    </td>

                    <td className="px-6 py-4 max-w-xs truncate text-xs text-slate-600">
                      {msg.content}
                    </td>

                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                        msg.status === "READ" ? "bg-blue-50 text-blue-700" :
                        msg.status === "DELIVERED" ? "bg-emerald-50 text-emerald-700" :
                        msg.status === "SENT" ? "bg-amber-50 text-amber-700" :
                        "bg-red-50 text-red-700"
                      }`}>
                        {msg.status === "READ" && <CheckCheck size={12} />}
                        {msg.status === "DELIVERED" && <Check size={12} />}
                        {msg.status === "SENT" && <Clock size={12} />}
                        {msg.status}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-xs text-slate-400 font-medium">
                      {msg.timestamp}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => {
                          setComposeForm({
                            recipientName: msg.recipientName,
                            recipientContact: msg.recipientContact,
                            channel: msg.channel,
                            category: msg.category,
                            templateTitle: `Re: ${msg.template}`,
                            content: ""
                          });
                          setShowComposeModal(true);
                        }}
                        className="text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl transition-colors inline-flex items-center gap-1"
                      >
                        Reply <ChevronRight size={12} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* COMPOSE MODAL */}
      {showComposeModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-xl font-black text-slate-900">Send Customer Communication</h3>
                <p className="text-xs text-slate-500 mt-0.5">Direct dispatch via WhatsApp Business, SMS, or Email</p>
              </div>
              <button 
                onClick={() => setShowComposeModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSendMessage} className="p-6 space-y-4">
              {/* Channel Selector */}
              <div>
                <label className="text-xs font-extrabold uppercase text-slate-500 tracking-wider mb-1 block">
                  Delivery Channel
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "WHATSAPP", label: "WhatsApp", icon: MessageCircle, color: "text-emerald-600" },
                    { id: "SMS", label: "Fast SMS", icon: Smartphone, color: "text-blue-600" },
                    { id: "EMAIL", label: "Email Relay", icon: Mail, color: "text-purple-600" },
                  ].map((ch) => {
                    const Icon = ch.icon;
                    const isSel = composeForm.channel === ch.id;
                    return (
                      <button
                        type="button"
                        key={ch.id}
                        onClick={() => setComposeForm({ ...composeForm, channel: ch.id as any })}
                        className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl border text-xs font-bold transition-all ${
                          isSel 
                            ? "bg-slate-900 text-white border-slate-900 shadow-sm" 
                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <Icon size={16} className={isSel ? "text-white" : ch.color} />
                        {ch.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Recipient details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-extrabold uppercase text-slate-500 tracking-wider mb-1 block">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Patel"
                    value={composeForm.recipientName}
                    onChange={(e) => setComposeForm({ ...composeForm, recipientName: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-extrabold uppercase text-slate-500 tracking-wider mb-1 block">
                    {composeForm.channel === "EMAIL" ? "Email Address *" : "Mobile Number (+91) *"}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={composeForm.channel === "EMAIL" ? "client@gmail.com" : "+91 98765 43210"}
                    value={composeForm.recipientContact}
                    onChange={(e) => setComposeForm({ ...composeForm, recipientContact: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Template Picker */}
              <div>
                <label className="text-xs font-extrabold uppercase text-slate-500 tracking-wider mb-1 block">
                  Select Quick Template
                </label>
                <select
                  onChange={(e) => {
                    const found = TEMPLATES.find(t => t.id === e.target.value);
                    if (found) handleSelectTemplate(found);
                  }}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:bg-white"
                >
                  <option value="">-- Choose or write custom message --</option>
                  {TEMPLATES.map(t => (
                    <option key={t.id} value={t.id}>[{t.channel}] {t.title}</option>
                  ))}
                </select>
              </div>

              {/* Message Body */}
              <div>
                <label className="text-xs font-extrabold uppercase text-slate-500 tracking-wider mb-1 block">
                  Message Content *
                </label>
                <textarea
                  required
                  rows={4}
                  value={composeForm.content}
                  onChange={(e) => setComposeForm({ ...composeForm, content: e.target.value })}
                  placeholder="Type your customer notification or update..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                  <span>Characters: {composeForm.content.length}</span>
                  <span>{composeForm.channel === "SMS" ? `${Math.ceil(composeForm.content.length / 160) || 1} SMS Credit` : "No limit"}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowComposeModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all active:scale-95 disabled:opacity-50"
                >
                  <Send size={14} />
                  {sending ? "Dispatching..." : "Send Now"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
