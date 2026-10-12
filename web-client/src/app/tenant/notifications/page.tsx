"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { 
  Bell, Info, AlertTriangle, Megaphone, CheckCheck, Trash2, 
  Search, Filter, Plus, Clock, ExternalLink, ShieldAlert, Sparkles, X, Check
} from "lucide-react";
import Link from "next/link";

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

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "NOTIF-101",
    type: "CRITICAL",
    title: "Net-Metering Application SLA Due in 24 Hours",
    content: "Project #PRJ-881 (Green Valley 50kW) requires Discom meter synchronization inspection submission before deadline.",
    isRead: false,
    createdAt: "15 mins ago",
    actionUrl: "/tenant/projects",
    actionLabel: "View Project"
  },
  {
    id: "NOTIF-102",
    type: "ANNOUNCEMENT",
    title: "Central PM Surya Ghar Muft Bijli Subsidy Scheme Portal Update",
    content: "MNRE has released new guidelines for residential rooftop subsidies. Claims above 3kW qualify for the enhanced ₹78,000 direct benefit transfer.",
    isRead: false,
    createdAt: "1 hour ago",
    actionUrl: "/tenant/subsidy",
    actionLabel: "Subsidy Desk"
  },
  {
    id: "NOTIF-103",
    type: "WARNING",
    title: "Low Inventory Warning: 5kW Hybrid Inverters",
    content: "Primary Warehouse stock for 5kW Dual MPPT Inverter dropped below minimum buffer (Remaining: 2 units). Replenish via Purchase Order.",
    isRead: false,
    createdAt: "3 hours ago",
    actionUrl: "/tenant/inventory",
    actionLabel: "Check Stock"
  },
  {
    id: "NOTIF-104",
    type: "INFO",
    title: "Payment Received: Invoice #INV-0042",
    content: "Sunita Verma has paid ₹1,45,000 via NEFT. Project milestone #2 'Structure & Inverter Mounting' now marked ready for dispatch.",
    isRead: true,
    createdAt: "Yesterday",
    actionUrl: "/tenant/finance",
    actionLabel: "View Receipt"
  },
  {
    id: "NOTIF-105",
    type: "ANNOUNCEMENT",
    title: "Scheduled Maintenance: Server Cloud Sync",
    content: "Platform maintenance scheduled for Sunday 02:00 AM to 03:30 AM IST. Offline survey photo sync will queue locally on mobile app.",
    isRead: true,
    createdAt: "3 days ago"
  }
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [activeTab, setActiveTab] = useState<"ALL" | "UNREAD" | "CRITICAL" | "ANNOUNCEMENTS">("ALL");
  const [search, setSearch] = useState("");
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [toast, setToast] = useState("");

  // Broadcast modal form
  const [broadcastForm, setBroadcastForm] = useState({
    title: "",
    type: "ANNOUNCEMENT" as any,
    content: ""
  });

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    setToast("All notifications marked as read!");
    setTimeout(() => setToast(""), 3000);
  };

  const clearRead = () => {
    setNotifications(notifications.filter(n => !n.isRead));
    setToast("Read notifications cleared from view.");
    setTimeout(() => setToast(""), 3000);
  };

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    const newNotif: NotificationItem = {
      id: `NOTIF-${Math.floor(106 + Math.random() * 50)}`,
      type: broadcastForm.type,
      title: broadcastForm.title,
      content: broadcastForm.content,
      isRead: false,
      createdAt: "Just now"
    };
    setNotifications([newNotif, ...notifications]);
    setShowBroadcastModal(false);
    setToast(`Broadcast alert "${broadcastForm.title}" published to all tenant staff!`);
    setTimeout(() => setToast(""), 3500);
    setBroadcastForm({ title: "", type: "ANNOUNCEMENT", content: "" });
  };

  const filteredNotifs = notifications.filter(n => {
    const matchesTab = 
      activeTab === "ALL" ? true :
      activeTab === "UNREAD" ? !n.isRead :
      activeTab === "CRITICAL" ? (n.type === "CRITICAL" || n.type === "WARNING") :
      n.type === "ANNOUNCEMENT";

    const matchesSearch = 
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.content.toLowerCase().includes(search.toLowerCase());

    return matchesTab && matchesSearch;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-5xl mx-auto pb-12">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-800">
              Alert Command Center
            </span>
            {unreadCount > 0 && (
              <span className="flex items-center gap-1 text-xs text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                {unreadCount} Unread Alerts
              </span>
            )}
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">System Notifications</h1>
          <p className="text-sm text-slate-500 mt-1">
            Operational milestone alarms, Discom filing reminders, stock alerts, and platform announcements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 flex items-center gap-1.5 shadow-sm transition-all"
            >
              <CheckCheck size={14} className="text-emerald-600" /> Mark All Read
            </button>
          )}

          <button
            onClick={clearRead}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Trash2 size={14} /> Clear Read
          </button>

          <button 
            onClick={() => setShowBroadcastModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 shadow-lg shadow-blue-600/20 active:scale-95"
          >
            <Plus size={16} /> Broadcast Alert
          </button>
        </div>
      </div>

      {toast && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCheck size={18} className="text-emerald-600" />
            <span className="text-sm font-semibold">{toast}</span>
          </div>
          <button onClick={() => setToast("")} className="text-emerald-600 hover:text-emerald-800">
            <X size={16} />
          </button>
        </div>
      )}

      {/* FILTER TABS & SEARCH */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl">
          {[
            { id: "ALL", label: "All Alerts" },
            { id: "UNREAD", label: `Unread (${unreadCount})` },
            { id: "CRITICAL", label: "Critical & Warnings" },
            { id: "ANNOUNCEMENTS", label: "Announcements" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all ${
                activeTab === tab.id
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
            placeholder="Search notification..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs font-semibold focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </div>

      {/* NOTIFICATIONS LIST */}
      <div className="space-y-3">
        {filteredNotifs.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-16 text-center shadow-sm">
            <Bell size={40} className="mx-auto text-slate-200 mb-3" />
            <h3 className="font-bold text-slate-700 text-sm">No notifications found</h3>
            <p className="text-xs text-slate-400 mt-1">You are all caught up on system updates and alarms.</p>
          </div>
        ) : (
          filteredNotifs.map((n) => {
            let Icon = Info;
            let iconClass = "bg-blue-50 text-blue-600";
            let borderClass = "border-slate-200/80";

            if (n.type === "CRITICAL") {
              Icon = ShieldAlert;
              iconClass = "bg-red-50 text-red-600";
              borderClass = "border-red-200 bg-red-50/20";
            } else if (n.type === "WARNING") {
              Icon = AlertTriangle;
              iconClass = "bg-amber-50 text-amber-600";
              borderClass = "border-amber-200";
            } else if (n.type === "ANNOUNCEMENT") {
              Icon = Megaphone;
              iconClass = "bg-emerald-50 text-emerald-600";
            }

            return (
              <div 
                key={n.id}
                onClick={() => !n.isRead && markAsRead(n.id)}
                className={`bg-white rounded-3xl border p-5 shadow-sm transition-all hover:shadow-md flex items-start gap-4 ${borderClass} ${
                  !n.isRead ? "ring-2 ring-blue-500/10 shadow-blue-500/5" : ""
                }`}
              >
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${iconClass}`}>
                  <Icon size={20} />
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-sm">{n.title}</h4>
                      {!n.isRead && (
                        <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping"></span>
                      )}
                    </div>
                    <span className="text-[11px] font-semibold text-slate-400">{n.createdAt}</span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed font-normal">{n.content}</p>

                  {n.actionUrl && (
                    <div className="pt-2">
                      <Link
                        href={n.actionUrl}
                        className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-xl transition-colors"
                      >
                        {n.actionLabel || "View Details"} <ExternalLink size={12} />
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* BROADCAST MODAL */}
      {showBroadcastModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-xl font-black text-slate-900">Broadcast Team Alert</h3>
                <p className="text-xs text-slate-500 mt-0.5">Send high-visibility announcement to all employees</p>
              </div>
              <button 
                onClick={() => setShowBroadcastModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleBroadcast} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-extrabold uppercase text-slate-500 tracking-wider mb-1 block">
                  Alert Severity
                </label>
                <select
                  value={broadcastForm.type}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, type: e.target.value as any })}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:bg-white"
                >
                  <option value="ANNOUNCEMENT">General Announcement</option>
                  <option value="WARNING">Operational Warning</option>
                  <option value="CRITICAL">Critical Compliance Alert</option>
                  <option value="INFO">General Information</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-extrabold uppercase text-slate-500 tracking-wider mb-1 block">
                  Alert Headline *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Monthly Billing Cycle Deadline"
                  value={broadcastForm.title}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, title: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-extrabold uppercase text-slate-500 tracking-wider mb-1 block">
                  Message Body *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Type broadcast description..."
                  value={broadcastForm.content}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, content: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowBroadcastModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-blue-600/20 transition-all active:scale-95"
                >
                  Broadcast to Team
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
