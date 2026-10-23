"use client";
import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Building2, Users, CreditCard, Ticket, AlertCircle, 
  TrendingUp, ArrowUpRight, ArrowDownRight, MoreHorizontal, BarChart3,
  Sparkles, Phone, Mail, ArrowRight
} from 'lucide-react';
import Link from 'next/link';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface KPI {
  totalTenants: number;
  activeTenants: number;
  totalUsers: number;
  totalRevenue: number;
  tenantGrowth: { month: string, tenants: number }[];
  recentActivity: { action: string, entity: string, createdAt: string }[];
}

export default function Dashboard() {
  const [stats, setStats] = useState<KPI | null>(null);
  const [leadsData, setLeadsData] = useState<{ total: number; newCount: number; recent: any[] }>({
    total: 0,
    newCount: 0,
    recent: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Fetch Super Admin KPIs
    axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/super-admin/kpis`, { withCredentials: true })
      .then(res => {
        setStats({
          totalTenants: res.data.totalTenants,
          activeTenants: res.data.activeTenants,
          totalUsers: res.data.totalUsers,
          totalRevenue: res.data.totalRevenue,
          tenantGrowth: res.data.tenantGrowth || [],
          recentActivity: res.data.recentActivity || []
        });
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));

    // 2. Fetch Inbound Demo Leads
    fetch('/api/super-admin/leads')
      .then(r => r.json())
      .then(data => {
        if (data.leads) {
          setLeadsData({
            total: data.metrics?.total || data.leads.length,
            newCount: data.metrics?.newCount || 0,
            recent: data.leads.slice(0, 4)
          });
        }
      })
      .catch(err => console.error(err));
  }, []);

  const kpis = [
    { title: 'Total Tenants', value: stats?.totalTenants ?? '-', trend: 'Live Tenants', icon: Building2, positive: true, href: '/super-admin/tenants' },
    { title: 'Inbound Demo Leads', value: leadsData.total, trend: `${leadsData.newCount} New / Needs Call`, icon: Sparkles, positive: true, href: '/super-admin/leads', highlight: leadsData.newCount > 0 },
    { title: 'Active Tenants', value: stats?.activeTenants ?? '-', trend: 'Live', icon: TrendingUp, positive: true, href: '/super-admin/tenants' },
    { title: 'Monthly Revenue', value: stats ? `₹${stats.totalRevenue.toLocaleString('en-IN')}` : '-', trend: 'From Active Subs', icon: CreditCard, positive: true, href: '/super-admin/subscriptions' },
    { title: 'Platform Users', value: stats?.totalUsers ?? '-', trend: 'Across all tenants', icon: Users, positive: true, href: '/super-admin/tenants' },
  ];

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      
      {/* HEADER */}
      <div className="flex justify-between items-end mb-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">SaaS Dashboard</h1>
          <p className="text-slate-500 mt-1">Platform overview, growth leads, and performance metrics.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/super-admin/leads" className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-lg font-semibold shadow-sm transition-all text-sm flex items-center gap-2">
            <Sparkles size={16} className="text-blue-600" />
            <span>View Leads ({leadsData.total})</span>
          </Link>
          <Link href="/super-admin/tenants/create" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-semibold shadow-sm transition-all text-sm">
            + Provision Tenant
          </Link>
        </div>
      </div>

      {/* ALERTS SECTION */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-4 items-start shadow-sm">
        <div className="text-amber-500 mt-0.5"><AlertCircle size={20} /></div>
        <div>
          <h3 className="text-sm font-bold text-amber-800">Action Required</h3>
          <p className="text-sm text-amber-700 mt-1">
            {leadsData.newCount > 0 
              ? `${leadsData.newCount} new solar vendor demo request(s) waiting for contact.`
              : '2 subscriptions are expiring within 7 days. 1 system integration (WhatsApp) requires re-authentication.'}
          </p>
        </div>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpis.map((kpi, i) => (
          <Link 
            key={i} 
            href={kpi.href || '#'}
            className={`rounded-2xl p-5 shadow-sm border transition-all relative overflow-hidden block ${
              kpi.highlight 
                ? 'bg-blue-50/50 border-blue-200 hover:border-blue-400 hover:shadow-md' 
                : 'bg-white border-slate-200 hover:shadow-md hover:border-slate-300'
            }`}
          >
            <div className="flex justify-between items-start mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                kpi.highlight ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 border-slate-100 text-slate-600'
              }`}>
                <kpi.icon size={20} />
              </div>
              <ArrowUpRight size={16} className="text-slate-400" />
            </div>
            
            <div className="space-y-1">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{kpi.title}</h3>
              <div className="text-2xl font-extrabold text-slate-900">
                {loading ? <div className="h-7 w-16 bg-slate-100 animate-pulse rounded"></div> : kpi.value}
              </div>
            </div>

            <div className={`mt-3 flex items-center gap-1 text-xs font-medium ${kpi.highlight ? 'text-blue-700 font-bold' : kpi.positive ? 'text-emerald-600' : 'text-slate-500'}`}>
              {kpi.trend}
            </div>
          </Link>
        ))}
      </div>
      {/* CHARTS & RECENT ACTIVITY */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* CHART MOCKUP */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-900">Tenant Growth</h3>
            <select className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-medium outline-none">
              <option>Last 30 Days</option>
              <option>This Year</option>
            </select>
          </div>
          <div className="flex-1 bg-white min-h-[300px]">
            {loading ? (
              <div className="w-full h-full flex items-center justify-center text-slate-400">Loading...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.tenantGrowth || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="tenants" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* ACTIVITY FEED */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col">
           <h3 className="text-lg font-bold text-slate-900 mb-6">Recent Platform Activity</h3>
           <div className="flex-1 space-y-6">
              {stats?.recentActivity?.length === 0 && <p className="text-sm text-slate-500">No recent activity found.</p>}
              {stats?.recentActivity?.map((activity, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-blue-500 bg-blue-50">
                    <AlertCircle size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{activity.action}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{activity.entity} • {new Date(activity.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              ))}
           </div>
           <button className="mt-6 w-full py-2 bg-slate-50 hover:bg-slate-100 rounded-lg text-sm font-semibold text-slate-600 transition-colors">
             View All Activity
           </button>
        </div>

      </div>

      {/* RECENT DEMO LEADS WIDGET */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-200">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Latest Inbound Demo Requests</h3>
              <p className="text-xs text-slate-500">Solar installers &amp; EPCs that requested a walkthrough on the website.</p>
            </div>
          </div>
          <Link 
            href="/super-admin/leads" 
            className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
          >
            <span>View All ({leadsData.total})</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {leadsData.recent.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            No demo requests received yet. Submissions on the marketing website will appear here instantly.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {leadsData.recent.map((lead: any) => {
              const whatsappUrl = `https://wa.me/91${lead.phone?.replace(/\\D/g, '')}?text=${encodeURIComponent(
                `Hi ${lead.name}, thank you for requesting a demo of WhereReady Solar OS for ${lead.company}!`
              )}`;
              return (
                <div key={lead.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                        {lead.status || 'NEW'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(lead.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-slate-900 mt-2">{lead.company}</h4>
                    <p className="text-xs text-slate-600 font-medium">{lead.name}</p>
                    <p className="text-[11px] text-slate-400 mt-1">{lead.cityState || 'India'} • {lead.monthlyVolume}</p>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs flex items-center justify-center gap-1 transition-colors shadow-2xs"
                    >
                      <Phone size={12} />
                      <span>WhatsApp</span>
                    </a>
                    <Link
                      href={`/super-admin/tenants/create?company=${encodeURIComponent(lead.company)}&name=${encodeURIComponent(lead.name)}&email=${encodeURIComponent(lead.email)}&phone=${encodeURIComponent(lead.phone)}&city=${encodeURIComponent(lead.cityState || '')}`}
                      className="py-1.5 px-2 bg-slate-900 hover:bg-blue-600 text-white font-semibold rounded-lg text-xs flex items-center justify-center gap-1 transition-colors"
                      title="Provision Tenant"
                    >
                      <ArrowUpRight size={13} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}

