"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { 
  MessageSquare, Send, Mail, Phone, MessageCircle, CheckCheck, 
  Clock, AlertCircle, Plus, Search, Filter, RefreshCw, User, 
  Paperclip, ChevronRight, Check, Sparkles, Smartphone, ShieldCheck,
  Zap, Calendar, ArrowUpRight, Copy, Eye, X, ExternalLink
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface MessageRecord {
  id: string;
  recipientName: string;
  recipientContact: string;
  channel: "WHATSAPP" | "SMS" | "EMAIL";
  template: string;
  content: string;
  status: "DELIVERED" | "READ" | "SENT" | "FAILED";
  category: string;
  createdAt: string;
}

interface TemplateItem {
  id: string;
  name: string;
  channel: string;
  category: string;
  content: string;
}

export default function CommunicationPage() {
  const [messages, setMessages] = useState<MessageRecord[]>([]);
  const [metrics, setMetrics] = useState({ totalSent: 0, whatsappCount: 0, smsCount: 0, emailCount: 0, deliveredRate: 100 });
  const [loading, setLoading] = useState(true);
  const [channelFilter, setChannelFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  // Modals & Forms
  const [showCompose, setShowCompose] = useState(false);
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<MessageRecord | null>(null);

  const [form, setForm] = useState({
    customerId: "",
    recipientName: "",
    recipientContact: "",
    channel: "WHATSAPP",
    template: "",
    category: "GENERAL",
    content: ""
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (channelFilter !== "ALL") params.channel = channelFilter;
      if (search) params.search = search;

      const [msgRes, tplRes, custRes] = await Promise.all([
        axios.get(`${API}/api/tenant/communication/messages`, { params, withCredentials: true }),
        axios.get(`${API}/api/tenant/communication/templates`, { withCredentials: true }).catch(() => ({ data: { templates: [] } })),
        axios.get(`${API}/api/tenant/customers`, { withCredentials: true }).catch(() => ({ data: { customers: [] } }))
      ]);

      setMessages(msgRes.data.messages || []);
      if (msgRes.data.metrics) setMetrics(msgRes.data.metrics);
      setTemplates(tplRes.data.templates || []);
      setCustomers(custRes.data.customers || []);
    } catch (err) {
      console.error("Error fetching communication data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [channelFilter]);

  const handleCustomerSelect = (customerId: string) => {
    const cust = customers.find(c => c.id === customerId);
    if (!cust) return;

    setForm(prev => ({
      ...prev,
      customerId,
      recipientName: cust.name,
      recipientContact: cust.mobile || cust.phone || ""
    }));
  };

  const handleTemplateSelect = (templateId: string) => {
    const tpl = templates.find(t => t.id === templateId);
    if (!tpl) return;

    let parsedContent = tpl.content
      .replace(/{{customerName}}/g, form.recipientName || "Valued Client")
      .replace(/{{capacity}}/g, "3.3")
      .replace(/{{savings}}/g, "48,500")
      .replace(/{{proposalUrl}}/g, "https://solarerp.app/portal")
      .replace(/{{date}}/g, new Date().toLocaleDateString("en-IN"))
      .replace(/{{time}}/g, "11:30 AM")
      .replace(/{{phone}}/g, "+91 98201 44521")
      .replace(/{{amount}}/g, "1,45,000")
      .replace(/{{invoiceNo}}/g, "INV-0042")
      .replace(/{{appRef}}/g, "PM-SG-2024-9021")
      .replace(/{{supervisorName}}/g, "Senior Eng. Patil");

    setForm(prev => ({
      ...prev,
      template: tpl.name,
      category: tpl.category,
      channel: tpl.channel,
      content: parsedContent
    }));
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.recipientContact.trim() || !form.content.trim()) {
      alert("Please enter recipient contact number and message text");
      return;
    }

    try {
      setSubmitting(true);
      const res = await axios.post(`${API}/api/tenant/communication/send`, form, { withCredentials: true });

      // If WhatsApp, directly launch web or native app
      if (res.data?.directUrl) {
        window.open(res.data.directUrl, "_blank");
      }

      setShowCompose(false);
      setForm({
        customerId: "",
        recipientName: "",
        recipientContact: "",
        channel: "WHATSAPP",
        template: "",
        category: "GENERAL",
        content: ""
      });
      fetchData();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to dispatch message");
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickWhatsApp = (contact: string, content: string) => {
    const cleanPhone = contact.replace(/[^0-9]/g, "");
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(content)}`;
    window.open(url, "_blank");
  };

  const getChannelBadge = (ch: string) => {
    switch (ch) {
      case "WHATSAPP":
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <MessageCircle size={12} /> WhatsApp
          </span>
        );
      case "SMS":
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Phone size={12} /> SMS
          </span>
        );
      case "EMAIL":
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <Mail size={12} /> Email
          </span>
        );
      default:
        return <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100">{ch}</span>;
    }
  };

  const getStatusBadge = (st: string) => {
    switch (st) {
      case "READ":
        return (
          <span className="flex items-center gap-1 text-xs font-bold text-sky-600">
            <CheckCheck size={14} /> Read
          </span>
        );
      case "DELIVERED":
        return (
          <span className="flex items-center gap-1 text-xs font-bold text-emerald-600">
            <CheckCheck size={14} /> Delivered
          </span>
        );
      case "SENT":
        return (
          <span className="flex items-center gap-1 text-xs font-bold text-slate-500">
            <Check size={14} /> Sent
          </span>
        );
      default:
        return <span className="text-xs text-rose-500 font-bold">{st}</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Communication Hub</h1>
          <p className="text-sm text-slate-500 mt-1">Automated WhatsApp updates, proposal sharing & client notifications.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchData} 
            className="p-2.5 text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            title="Refresh"
          >
            <RefreshCw size={16} />
          </button>
          <button 
            onClick={() => setShowCompose(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <Send size={16} /> New Message / Broadcast
          </button>
        </div>
      </div>

      {/* METRICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Dispatches</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <MessageSquare size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">{metrics.totalSent}</p>
          <p className="text-xs text-slate-400 mt-1">All outbound customer messages</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">WhatsApp Dispatches</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <MessageCircle size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-600">{metrics.whatsappCount}</p>
          <p className="text-xs text-slate-400 mt-1">Direct proposals & receipts sent</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">SMS Alerts</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Phone size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold text-blue-600">{metrics.smsCount}</p>
          <p className="text-xs text-slate-400 mt-1">Technician & survey dispatch alerts</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Delivery Rate</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <CheckCheck size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold text-purple-600">{metrics.deliveredRate}%</p>
          <p className="text-xs text-slate-400 mt-1">Successfully read or delivered</p>
        </div>
      </div>

      {/* FILTER TABS & SEARCH */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
            {["ALL", "WHATSAPP", "SMS", "EMAIL"].map((ch) => (
              <button
                key={ch}
                onClick={() => setChannelFilter(ch)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  channelFilter === ch 
                    ? "bg-emerald-600 text-white shadow-sm" 
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                {ch}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-80">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search recipient, phone or text..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === "Enter" && fetchData()}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-emerald-500 transition-colors" 
            />
          </div>
        </div>

        {/* MESSAGES FEED */}
        <div className="divide-y divide-slate-100">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="p-12 text-center text-slate-500 font-medium">
              No messages found. Dispatch a message to see communication history.
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className="p-5 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900 text-sm">{msg.recipientName}</span>
                    <span className="text-xs text-slate-500">({msg.recipientContact})</span>
                    {getChannelBadge(msg.channel)}
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      {msg.category}
                    </span>
                  </div>

                  <p className="text-sm text-slate-700 font-medium leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100 max-w-3xl">
                    {msg.content}
                  </p>

                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span>Template: {msg.template || "Direct"}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} /> {new Date(msg.createdAt).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}
                    </span>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3">
                  {getStatusBadge(msg.status)}
                  {msg.channel === "WHATSAPP" && (
                    <button
                      onClick={() => handleQuickWhatsApp(msg.recipientContact, msg.content)}
                      className="px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg flex items-center gap-1.5 transition-colors"
                    >
                      <ExternalLink size={12} /> Open WhatsApp
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* COMPOSE MESSAGE MODAL */}
      {showCompose && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Send Customer Notification</h2>
                <p className="text-xs text-slate-500 mt-0.5">Dispatches via WhatsApp, SMS, or Email and records audit trail</p>
              </div>
              <button onClick={() => setShowCompose(false)} className="text-slate-400 hover:text-slate-700 p-2">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSendMessage} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Customer Link</label>
                  <select 
                    value={form.customerId} 
                    onChange={e => handleCustomerSelect(e.target.value)} 
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all bg-white font-medium text-slate-800"
                  >
                    <option value="">Select Existing Customer</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.mobile || c.phone || 'No phone'})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Channel</label>
                  <select 
                    value={form.channel} 
                    onChange={e => setForm({...form, channel: e.target.value})} 
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all bg-white font-medium text-slate-800"
                  >
                    <option value="WHATSAPP">WhatsApp (Direct link)</option>
                    <option value="SMS">SMS Text Alert</option>
                    <option value="EMAIL">Email</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Recipient Name *</label>
                  <input 
                    required 
                    type="text" 
                    value={form.recipientName} 
                    onChange={e => setForm({...form, recipientName: e.target.value})} 
                    placeholder="e.g. Rajesh Sharma" 
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium text-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Mobile Number / Email *</label>
                  <input 
                    required 
                    type="text" 
                    value={form.recipientContact} 
                    onChange={e => setForm({...form, recipientContact: e.target.value})} 
                    placeholder="e.g. +91 98201 44521" 
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium text-slate-800"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Solar Proposal Template</label>
                <select 
                  onChange={e => handleTemplateSelect(e.target.value)} 
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all bg-white font-medium text-slate-800"
                >
                  <option value="">Choose a Template (Optional)</option>
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>[{t.channel}] {t.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Message Content *</label>
                <textarea 
                  required 
                  rows={4}
                  value={form.content} 
                  onChange={e => setForm({...form, content: e.target.value})} 
                  placeholder="Type message content or customize template..." 
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium text-slate-800 resize-none"
                />
                <div className="text-right text-xs text-slate-400">
                  {form.content.length} characters
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowCompose(false)} 
                  className="flex-1 py-3 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Send size={16} />
                  {submitting ? "Sending..." : form.channel === "WHATSAPP" ? "Dispatch & Open WhatsApp" : "Dispatch Alert"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
