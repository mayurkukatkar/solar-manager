"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import axios from "axios";
import {
  Users,
  Search,
  Filter,
  RefreshCw,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Building2,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowUpRight,
  Trash2,
  MessageSquare,
  ChevronDown,
  Layers,
  FileSpreadsheet
} from "lucide-react";

interface PlatformLead {
  id: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  cityState: string | null;
  businessType: string;
  monthlyVolume: string;
  preferredTime: string | null;
  notes: string | null;
  status: "NEW" | "CONTACTED" | "DEMO_SCHEDULED" | "TRIAL_PROVISIONED" | "CONVERTED" | "LOST" | string;
  source: string;
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  NEW: { label: "New Lead", bg: "bg-amber-50 border-amber-200", text: "text-amber-700", dot: "bg-amber-500 animate-pulse" },
  CONTACTED: { label: "Contacted", bg: "bg-blue-50 border-blue-200", text: "text-blue-700", dot: "bg-blue-500" },
  DEMO_SCHEDULED: { label: "Demo Scheduled", bg: "bg-purple-50 border-purple-200", text: "text-purple-700", dot: "bg-purple-500" },
  TRIAL_PROVISIONED: { label: "Trial Provisioned", bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500" },
  CONVERTED: { label: "Converted", bg: "bg-green-50 border-green-200", text: "text-green-800", dot: "bg-green-600" },
  LOST: { label: "Closed / Lost", bg: "bg-slate-100 border-slate-200", text: "text-slate-600", dot: "bg-slate-400" }
};

export default function PlatformLeadsPage() {
  const [leads, setLeads] = useState<PlatformLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchLeads = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      // 1. Try local Next.js proxy route
      const res = await fetch("/api/super-admin/leads");
      if (res.ok) {
        const data = await res.json();
        setLeads(data.leads || []);
      } else {
        // Fallback to Express backend if available
        const fallbackRes = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/super-admin/platform-leads`,
          { withCredentials: true }
        );
        setLeads(fallbackRes.data.leads || []);
      }
    } catch (err) {
      console.error("[Super Admin] Failed to fetch leads:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    setUpdatingId(leadId);
    // Optimistic UI update
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l))
    );

    try {
      await fetch("/api/super-admin/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: leadId, status: newStatus })
      });
    } catch (err) {
      console.error("Failed to update status on server:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (leadId: string, leadName: string) => {
    if (!confirm(`Are you sure you want to remove the demo request from "${leadName}"?`)) {
      return;
    }

    setLeads((prev) => prev.filter((l) => l.id !== leadId));

    try {
      await fetch(`/api/super-admin/leads?id=${encodeURIComponent(leadId)}`, {
        method: "DELETE"
      });
    } catch (err) {
      console.error("Failed to delete lead:", err);
    }
  };

  const exportCSV = () => {
    if (!leads.length) return;
    const headers = ["Name", "Company", "Phone", "Email", "Location", "Business Type", "Volume", "Preferred Time", "Status", "Date"];
    const rows = filteredLeads.map((l) => [
      `"${l.name}"`,
      `"${l.company}"`,
      `"${l.phone}"`,
      `"${l.email}"`,
      `"${l.cityState || ""}"`,
      `"${l.businessType}"`,
      `"${l.monthlyVolume}"`,
      `"${l.preferredTime || ""}"`,
      `"${l.status}"`,
      `"${new Date(l.createdAt).toLocaleDateString()}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `solar-os-demo-leads-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Metrics calculation
  const totalLeads = leads.length;
  const newLeadsCount = leads.filter((l) => l.status === "NEW").length;
  const contactedCount = leads.filter((l) => l.status === "CONTACTED").length;
  const scheduledCount = leads.filter((l) => l.status === "DEMO_SCHEDULED").length;
  const convertedCount = leads.filter((l) => l.status === "CONVERTED" || l.status === "TRIAL_PROVISIONED").length;

  // Filtering
  const filteredLeads = leads.filter((l) => {
    const matchesSearch =
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.company.toLowerCase().includes(search.toLowerCase()) ||
      l.phone.includes(search) ||
      l.email.toLowerCase().includes(search.toLowerCase()) ||
      (l.cityState && l.cityState.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === "ALL" || l.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="animate-in fade-in duration-300 space-y-6">
      
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
              <Sparkles size={16} />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
              Inbound Growth Funnel
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Demo Leads &amp; Walkthrough Requests
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Real-time enquiries submitted by Indian solar EPCs and installers on WhereReady Solar OS.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchLeads(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-all shadow-xs cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>

          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-all shadow-xs cursor-pointer"
          >
            <FileSpreadsheet size={14} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Leads</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{totalLeads}</p>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Lifetime received</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-200 bg-amber-50/30 shadow-xs">
          <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Needs Contact</p>
          <p className="text-2xl font-extrabold text-amber-900 mt-1">{newLeadsCount}</p>
          <span className="text-[11px] text-amber-700 font-medium mt-0.5 block">Awaiting response</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-blue-200 bg-blue-50/20 shadow-xs">
          <p className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">In Discussion</p>
          <p className="text-2xl font-extrabold text-blue-900 mt-1">{contactedCount}</p>
          <span className="text-[11px] text-blue-600 mt-0.5 block">Initial call done</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-purple-200 bg-purple-50/20 shadow-xs">
          <p className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">Demo Scheduled</p>
          <p className="text-2xl font-extrabold text-purple-900 mt-1">{scheduledCount}</p>
          <span className="text-[11px] text-purple-600 mt-0.5 block">Screen-share booked</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-200 bg-emerald-50/30 shadow-xs col-span-2 sm:col-span-1">
          <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Converted</p>
          <p className="text-2xl font-extrabold text-emerald-900 mt-1">{convertedCount}</p>
          <span className="text-[11px] text-emerald-700 font-medium mt-0.5 block">Active Tenants</span>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by vendor, company, phone, city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white transition-all text-slate-800"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {[
            { id: "ALL", label: "All" },
            { id: "NEW", label: "New" },
            { id: "CONTACTED", label: "Contacted" },
            { id: "DEMO_SCHEDULED", label: "Scheduled" },
            { id: "TRIAL_PROVISIONED", label: "Trial" },
            { id: "CONVERTED", label: "Converted" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                statusFilter === tab.id
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* DATA TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[950px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-5">Vendor &amp; Company</th>
                <th className="py-3 px-5">Contact Details</th>
                <th className="py-3 px-5">Business Profile</th>
                <th className="py-3 px-5">Requested Slot</th>
                <th className="py-3 px-5">Status</th>
                <th className="py-3 px-5 text-right">Quick Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw size={16} className="animate-spin text-blue-600" />
                      <span>Loading inbound leads...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400 space-y-2">
                    <Users size={32} className="mx-auto text-slate-300" />
                    <p className="font-semibold text-slate-700 text-sm">No demo requests found</p>
                    <p className="text-xs text-slate-400">
                      {search || statusFilter !== "ALL"
                        ? "Try clearing your search filters."
                        : "New inquiries from the website form will appear here automatically."}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => {
                  const cfg = STATUS_CONFIG[lead.status] || STATUS_CONFIG.NEW;
                  const whatsappUrl = `https://wa.me/91${lead.phone.replace(/\D/g, "")}?text=${encodeURIComponent(
                    `Hi ${lead.name}, thank you for requesting a demo of WhereReady Solar OS for ${lead.company}! When would be a good time for a 15-minute screen share walkthrough?`
                  )}`;

                  const provisionUrl = `/super-admin/tenants/create?company=${encodeURIComponent(
                    lead.company
                  )}&name=${encodeURIComponent(lead.name)}&email=${encodeURIComponent(
                    lead.email
                  )}&phone=${encodeURIComponent(lead.phone)}&city=${encodeURIComponent(lead.cityState || "")}`;

                  return (
                    <tr key={lead.id} className="hover:bg-slate-50/80 transition-colors">
                      
                      {/* VENDOR & COMPANY */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                            {lead.company.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm">{lead.company}</p>
                            <p className="text-slate-600 font-medium">{lead.name}</p>
                            <span className="text-[10px] text-slate-400 mt-0.5 block">
                              {new Date(lead.createdAt).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit"
                              })}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* CONTACT */}
                      <td className="py-3.5 px-5 space-y-1">
                        <div className="flex items-center gap-2">
                          <a
                            href={whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-slate-900 hover:text-emerald-600 flex items-center gap-1.5 transition-colors"
                          >
                            <Phone size={12} className="text-emerald-600 shrink-0" />
                            <span>{lead.phone}</span>
                          </a>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <Mail size={12} className="shrink-0 text-slate-400" />
                          <span className="truncate max-w-[180px]">{lead.email}</span>
                        </div>
                        {lead.cityState && (
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                            <MapPin size={11} className="shrink-0 text-slate-400" />
                            <span>{lead.cityState}</span>
                          </div>
                        )}
                      </td>

                      {/* BUSINESS PROFILE */}
                      <td className="py-3.5 px-5 space-y-1">
                        <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold border border-slate-200">
                          {lead.businessType}
                        </span>
                        <p className="text-[11px] text-slate-500">
                          Volume: <strong className="text-slate-700">{lead.monthlyVolume}</strong>
                        </p>
                      </td>

                      {/* PREFERRED SLOT & NOTES */}
                      <td className="py-3.5 px-5">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                            <Clock size={12} className="text-slate-400 shrink-0" />
                            <span>{lead.preferredTime || "Flexible"}</span>
                          </div>
                          {lead.notes && (
                            <p className="text-[11px] text-slate-500 italic max-w-xs truncate" title={lead.notes}>
                              "{lead.notes}"
                            </p>
                          )}
                        </div>
                      </td>

                      {/* STATUS DROPDOWN */}
                      <td className="py-3.5 px-5">
                        <div className="relative inline-block">
                          <select
                            value={lead.status}
                            disabled={updatingId === lead.id}
                            onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                            className={`text-xs font-bold pl-2.5 pr-6 py-1 rounded-full border appearance-none outline-none cursor-pointer transition-all ${cfg.bg} ${cfg.text}`}
                          >
                            <option value="NEW">New Lead</option>
                            <option value="CONTACTED">Contacted</option>
                            <option value="DEMO_SCHEDULED">Demo Scheduled</option>
                            <option value="TRIAL_PROVISIONED">Trial Provisioned</option>
                            <option value="CONVERTED">Converted</option>
                            <option value="LOST">Closed / Lost</option>
                          </select>
                          <ChevronDown size={11} className={`absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none ${cfg.text}`} />
                        </div>
                      </td>

                      {/* QUICK ACTIONS */}
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          
                          {/* Direct WhatsApp */}
                          <a
                            href={whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Chat on WhatsApp"
                            className="p-1.5 rounded-lg text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                          >
                            <Phone size={13} />
                          </a>

                          {/* Direct Email */}
                          <a
                            href={`mailto:${lead.email}?subject=WhereReady%20Solar%20OS%20Demo%20for%20${encodeURIComponent(lead.company)}`}
                            title="Send Work Email"
                            className="p-1.5 rounded-lg text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors"
                          >
                            <Mail size={13} />
                          </a>

                          {/* Provision Tenant 1-Click Button */}
                          <Link
                            href={provisionUrl}
                            title="Convert to Tenant"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-white bg-slate-900 hover:bg-blue-600 transition-colors shadow-2xs"
                          >
                            <span>+ Tenant</span>
                            <ArrowUpRight size={12} />
                          </Link>

                          {/* Delete Spam */}
                          <button
                            onClick={() => handleDelete(lead.id, lead.name)}
                            title="Delete Lead"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>

                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
