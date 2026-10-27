"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { 
  Bell, Info, AlertTriangle, Megaphone, CheckCheck, Trash2, 
  Search, Filter, Plus, Clock, ExternalLink, ShieldAlert, Sparkles, X, Check, RefreshCw
} from "lucide-react";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface NotificationItem {
  id: string;
  type: "INFO" | "WARNING" | "ANNOUNCEMENT" | "CRITICAL";
  title: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
  actionLabel?: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  // Create Announcement Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    type: "ANNOUNCEMENT",
    actionUrl: "",
    actionLabel: ""
  });

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (activeFilter !== "ALL") params.type = activeFilter;

      const res = await axios.get(`${API}/api/tenant/notifications`, { params, withCredentials: true });
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [activeFilter]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await axios.patch(`${API}/api/tenant/notifications/${id}/read`, {}, { withCredentials: true });
      fetchNotifications();
    } catch (err) {
      console.error("Error marking read:", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await axios.post(`${API}/api/tenant/notifications/read-all`, {}, { withCredentials: true });
      fetchNotifications();
    } catch (err) {
      console.error("Error marking all read:", err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`${API}/api/tenant/notifications/${id}`, { withCredentials: true });
      fetchNotifications();
    } catch (err) {
      console.error("Error deleting notification:", err);
    }
  };

  const handleCreateNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      alert("Please enter title and message content");
      return;
    }

    try {
      setSubmitting(true);
      await axios.post(`${API}/api/tenant/notifications`, formData, { withCredentials: true });
      setShowCreateModal(false);
      setFormData({ title: "", content: "", type: "ANNOUNCEMENT", actionUrl: "", actionLabel: "" });
      fetchNotifications();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to broadcast notification");
    } finally {
      setSubmitting(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "CRITICAL":
        return <ShieldAlert size={18} className="text-rose-600" />;
      case "WARNING":
        return <AlertTriangle size={18} className="text-amber-600" />;
      case "ANNOUNCEMENT":
        return <Megaphone size={18} className="text-blue-600" />;
      default:
        return <Info size={18} className="text-emerald-600" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "CRITICAL":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "WARNING":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "ANNOUNCEMENT":
        return "bg-blue-50 text-blue-700 border-blue-200";
      default:
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
    }
  };

  const filtered = notifications.filter(n => {
    if (!search) return true;
    return n.title.toLowerCase().includes(search.toLowerCase()) || n.content.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Notifications & Alerts</h1>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500 text-white animate-pulse">
                {unreadCount} unread
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-1">Real-time statutory DISCOM notices, milestone alerts & operational updates.</p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={fetchNotifications} 
            className="p-2.5 text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            title="Refresh"
          >
            <RefreshCw size={16} />
          </button>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="px-4 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <CheckCheck size={14} className="text-emerald-600" /> Mark All as Read
            </button>
          )}
          <button 
            onClick={() => setShowCreateModal(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <Plus size={18} /> New Broadcast
          </button>
        </div>
      </div>

      {/* FILTER TABS & SEARCH */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
            {["ALL", "CRITICAL", "WARNING", "ANNOUNCEMENT", "INFO"].map((t) => (
              <button
                key={t}
                onClick={() => setActiveFilter(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeFilter === t 
                    ? "bg-emerald-600 text-white shadow-sm" 
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-80">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search alerts..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-emerald-500 transition-colors" 
            />
          </div>
        </div>

        {/* NOTIFICATIONS LIST */}
        <div className="divide-y divide-slate-100">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-slate-500 font-medium">
              No notifications found.
            </div>
          ) : (
            filtered.map((item) => (
              <div 
                key={item.id} 
                className={`p-5 transition-colors flex items-start gap-4 ${item.isRead ? 'bg-white hover:bg-slate-50/70' : 'bg-emerald-50/20 hover:bg-emerald-50/40'}`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${getTypeBadge(item.type)}`}>
                  {getTypeIcon(item.type)}
                </div>

                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900 text-sm">{item.title}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getTypeBadge(item.type)}`}>
                      {item.type}
                    </span>
                    {!item.isRead && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    )}
                  </div>

                  <p className="text-sm text-slate-600 leading-relaxed">{item.content}</p>

                  <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
                    <span className="flex items-center gap-1">
                      <Clock size={12} /> {new Date(item.createdAt).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}
                    </span>

                    {item.actionUrl && (
                      <Link 
                        href={item.actionUrl}
                        className="font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 hover:underline"
                      >
                        {item.actionLabel || "View Action"} <ExternalLink size={12} />
                      </Link>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {!item.isRead && (
                    <button
                      onClick={() => handleMarkAsRead(item.id)}
                      className="p-2 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors"
                      title="Mark as Read"
                    >
                      <Check size={16} />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                    title="Dismiss"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* CREATE BROADCAST MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Broadcast Alert / Notice</h2>
                <p className="text-xs text-slate-500 mt-0.5">Post an operational alert visible to all team members</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-700 p-2">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateNotification} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Title *</label>
                  <input 
                    required 
                    type="text" 
                    value={formData.title} 
                    onChange={e => setFormData({...formData, title: e.target.value})} 
                    placeholder="e.g. DISCOM Portal Maintenance Window" 
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium text-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Severity</label>
                  <select 
                    value={formData.type} 
                    onChange={e => setFormData({...formData, type: e.target.value as any})} 
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all bg-white font-medium text-slate-800"
                  >
                    <option value="ANNOUNCEMENT">Announcement</option>
                    <option value="WARNING">Warning</option>
                    <option value="CRITICAL">Critical SLA</option>
                    <option value="INFO">Information</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Notice Message *</label>
                <textarea 
                  required 
                  rows={4}
                  value={formData.content} 
                  onChange={e => setFormData({...formData, content: e.target.value})} 
                  placeholder="Detail the instructions or deadline..." 
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium text-slate-800 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Action URL (Optional)</label>
                  <input 
                    type="text" 
                    value={formData.actionUrl} 
                    onChange={e => setFormData({...formData, actionUrl: e.target.value})} 
                    placeholder="/tenant/projects" 
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium text-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Action Button Label</label>
                  <input 
                    type="text" 
                    value={formData.actionLabel} 
                    onChange={e => setFormData({...formData, actionLabel: e.target.value})} 
                    placeholder="e.g. Inspect Project" 
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium text-slate-800"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowCreateModal(false)} 
                  className="flex-1 py-3 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Megaphone size={16} />
                  {submitting ? "Posting..." : "Broadcast Alert"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
