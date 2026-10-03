"use client";
import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Building2, Users, CreditCard, Ticket, AlertCircle, 
  TrendingUp, ArrowUpRight, ArrowDownRight, MoreHorizontal, BarChart3
} from 'lucide-react';
import Link from 'next/link';

interface KPI {
  totalTenants: number;
  activeTenants: number;
  totalUsers: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<KPI | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/super-admin/kpis`, { withCredentials: true })
      .then(res => {
        setStats({
          totalTenants: res.data.totalTenants,
          activeTenants: res.data.activeTenants,
          totalUsers: res.data.totalUsers
        });
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const kpis = [
    { title: 'Total Tenants', value: stats?.totalTenants ?? '-', trend: '+12% this month', icon: Building2, positive: true },
    { title: 'Active Tenants', value: stats?.activeTenants ?? '-', trend: '+5% this month', icon: TrendingUp, positive: true },
    { title: 'Monthly Revenue', value: '₹2,45,000', trend: 'Data pending Phase 3', icon: CreditCard, positive: true },
    { title: 'Platform Users', value: stats?.totalUsers ?? '-', trend: 'Across all tenants', icon: Users, positive: true },
  ];

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      
      {/* HEADER */}
      <div className="flex justify-between items-end mb-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">SaaS Dashboard</h1>
          <p className="text-slate-500 mt-1">Platform overview and performance metrics.</p>
        </div>
        <div className="flex gap-3">
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
          <p className="text-sm text-amber-700 mt-1">2 subscriptions are expiring within 7 days. 1 system integration (WhatsApp) requires re-authentication.</p>
        </div>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, i) => (
          <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-600">
                <kpi.icon size={24} />
              </div>
              <button className="text-slate-400 hover:text-slate-600"><MoreHorizontal size={20}/></button>
            </div>
            
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{kpi.title}</h3>
              <div className="text-3xl font-bold text-slate-900">
                {loading ? <div className="h-8 w-16 bg-slate-100 animate-pulse rounded"></div> : kpi.value}
              </div>
            </div>

            <div className={`mt-4 flex items-center gap-1 text-sm font-medium ${kpi.positive ? 'text-emerald-600' : 'text-slate-500'}`}>
              {kpi.positive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
              {kpi.trend}
            </div>
          </div>
        ))}
      </div>

      {/* CHARTS & RECENT ACTIVITY (Mockups until Phase 5) */}
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
          <div className="flex-1 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center text-slate-400 min-h-[300px]">
            <div className="text-center">
              <BarChart3 size={32} className="mx-auto mb-2 text-slate-300" />
              <p className="font-medium">Analytics Engine Pending (Phase 5)</p>
            </div>
          </div>
        </div>

        {/* ACTIVITY FEED */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col">
           <h3 className="text-lg font-bold text-slate-900 mb-6">Recent Platform Activity</h3>
           <div className="flex-1 space-y-6">
              {[
                { action: 'New tenant provisioned', entity: 'SolarTech Pro', time: '10 mins ago', icon: Building2, color: 'text-blue-500 bg-blue-50' },
                { action: 'Subscription upgraded', entity: 'SunPower Energy', time: '2 hours ago', icon: CreditCard, color: 'text-emerald-500 bg-emerald-50' },
                { action: 'Support ticket created', entity: 'EcoSolar Inc', time: '5 hours ago', icon: Ticket, color: 'text-amber-500 bg-amber-50' },
                { action: 'Tenant admin registered', entity: 'SolarTech Pro', time: '1 day ago', icon: Users, color: 'text-purple-500 bg-purple-50' },
              ].map((activity, i) => (
                <div key={i} className="flex gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${activity.color}`}>
                    <activity.icon size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{activity.action}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{activity.entity} • {activity.time}</p>
                  </div>
                </div>
              ))}
           </div>
           <button className="mt-6 w-full py-2 bg-slate-50 hover:bg-slate-100 rounded-lg text-sm font-semibold text-slate-600 transition-colors">
             View All Activity
           </button>
        </div>

      </div>
    </div>
  );
}
