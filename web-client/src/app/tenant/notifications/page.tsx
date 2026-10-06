"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { Bell, Info, AlertTriangle, Megaphone } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    axios.get(`${API}/api/tenant/notifications`, { withCredentials: true })
      .then(res => setNotifications(res.data.notifications || []))
      .catch(console.error);
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">System Notifications</h1>
          <p className="text-sm text-slate-500 mt-1">Announcements and alerts from the platform</p>
        </div>
      </div>

      <div className="space-y-4">
        {notifications.map(n => {
          let Icon = Info;
          let color = "text-blue-600 bg-blue-100";
          if (n.type === "WARNING") { Icon = AlertTriangle; color = "text-amber-600 bg-amber-100"; }
          if (n.type === "ANNOUNCEMENT") { Icon = Megaphone; color = "text-emerald-600 bg-emerald-100"; }
          
          return (
            <div key={n.id} className="bg-white rounded-xl border border-slate-200 p-5 flex gap-4 shadow-sm">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${color}`}>
                <Icon size={20} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-slate-800">{n.title}</h3>
                  <span className="text-xs text-slate-500">{new Date(n.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-sm text-slate-600 whitespace-pre-wrap">{n.content}</p>
              </div>
            </div>
          );
        })}
        {notifications.length === 0 && (
          <div className="text-center py-16 text-slate-400 bg-white rounded-xl border border-slate-200">
            <Bell size={48} className="mx-auto text-slate-200 mb-4" />
            <p>No new notifications</p>
          </div>
        )}
      </div>
    </div>
  );
}
