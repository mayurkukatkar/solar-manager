"use client";
import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { 
  Users, Briefcase, ChevronRight, 
  Wallet, ShieldCheck, Sun, Target,
  ArrowRight, FileCheck, CircleDollarSign
} from 'lucide-react';

export default function TenantDashboard() {
  const [data, setData] = useState<any>({ 
    totalLeads: 0, 
    totalProjects: 0, 
    totalCustomers: 0,
    pendingInvoices: 0,
    openTickets: 0,
    totalRevenue: 0,
    outstanding: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await axios.get(`\${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/dashboard`, { withCredentials: true });
        setData(res.data);
      } catch (err: any) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* HEADER */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Command Center</h1>
          <p className="text-slate-500 mt-1 font-medium">Your solar business pipeline at a glance.</p>
        </div>
        <Link 
          href="/tenant/crm" 
          className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-slate-900/20 hover:bg-slate-800 transition-colors flex items-center gap-2"
        >
          <Users size={16} /> Open CRM Pipeline
        </Link>
      </div>

      {/* THE PIPELINE FUNNEL (CORE UI) */}
      <div>
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Active Pipeline</h2>
        <div className="bg-white rounded-3xl p-3 shadow-sm border border-slate-100/60 overflow-hidden flex flex-col lg:flex-row gap-2">
          
          <PipelineCard 
            title="New Leads" 
            count={data.totalLeads || 0} 
            icon={Target}
            color="emerald"
            link="/tenant/crm"
          />
          <div className="hidden lg:flex items-center justify-center text-slate-300">
            <ArrowRight size={20} />
          </div>
          <PipelineCard 
            title="Qualified Customers" 
            count={data.totalCustomers || 0} 
            icon={Users}
            color="blue"
            link="/tenant/crm"
          />
          <div className="hidden lg:flex items-center justify-center text-slate-300">
            <ArrowRight size={20} />
          </div>
          <PipelineCard 
            title="Active Projects" 
            count={data.totalProjects || 0} 
            icon={Briefcase}
            color="amber"
            link="/tenant/projects"
          />
          <div className="hidden lg:flex items-center justify-center text-slate-300">
            <ArrowRight size={20} />
          </div>
          <PipelineCard 
            title="Pending Invoices" 
            count={data.pendingInvoices || 0} 
            icon={CircleDollarSign}
            color="indigo"
            link="/tenant/finance"
          />
          <div className="hidden lg:flex items-center justify-center text-slate-300">
            <ArrowRight size={20} />
          </div>
          <PipelineCard 
            title="Service / AMC" 
            count={data.openTickets || 0} 
            icon={ShieldCheck}
            color="slate"
            link="/tenant/service"
          />

        </div>
      </div>

      {/* FINANCIAL & QUICK ACTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Financial KPI */}
        <div className="col-span-1 lg:col-span-2 bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl shadow-slate-900/10">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Sun size={120} />
          </div>
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Total Revenue (YTD)</h2>
          <div className="flex items-end gap-4 mt-2">
            <h3 className="text-5xl font-black tracking-tight">₹{(data.totalRevenue || 0).toLocaleString()}</h3>
            <span className="text-emerald-400 text-sm font-bold bg-emerald-500/20 px-2 py-1 rounded-lg mb-1">Total Earned</span>
          </div>
          
          <div className="grid grid-cols-2 gap-6 mt-10">
             <div>
               <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Outstanding</p>
               <p className="text-xl font-bold text-amber-400">₹{(data.outstanding || 0).toLocaleString()}</p>
             </div>
             <div>
               <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Procurement Spend</p>
               <p className="text-xl font-bold opacity-50">TBD</p>
             </div>
          </div>
        </div>

        {/* Action Center */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Quick Actions</h2>
          
          <div className="space-y-3 flex-1">
            <QuickAction title="Add New Lead" icon={Users} color="emerald" link="/tenant/crm" />
            <QuickAction title="Create Purchase Order" icon={FileCheck} color="amber" link="/tenant/procurement" />
            <QuickAction title="Generate Invoice" icon={Wallet} color="blue" link="/tenant/finance" />
          </div>
        </div>

      </div>

    </div>
  );
}

function PipelineCard({ title, count, icon: Icon, color, link }: { title: string, count: number, icon: any, color: string, link: string }) {
  const colorStyles: any = {
    emerald: 'bg-emerald-50 text-emerald-600',
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    slate: 'bg-slate-100 text-slate-600',
  };

  return (
    <Link href={link} className="flex-1 bg-slate-50/50 hover:bg-slate-50 rounded-2xl p-5 transition-colors border border-transparent hover:border-slate-200 group">
      <div className="flex justify-between items-start mb-6">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorStyles[color]}`}>
          <Icon size={20} strokeWidth={2.5} />
        </div>
        <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-sm text-slate-300 group-hover:text-slate-800 transition-colors">
          <ChevronRight size={14} />
        </div>
      </div>
      <div>
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{title}</p>
        <p className="text-3xl font-black text-slate-800 mt-1">{count}</p>
      </div>
    </Link>
  );
}

function QuickAction({ title, icon: Icon, color, link }: { title: string, icon: any, color: string, link: string }) {
  const colorStyles: any = {
    emerald: 'text-emerald-600 bg-emerald-50',
    amber: 'text-amber-600 bg-amber-50',
    blue: 'text-blue-600 bg-blue-50',
  };

  return (
    <Link href={link} className="flex items-center p-3 rounded-xl hover:bg-slate-50 transition-colors group border border-transparent hover:border-slate-100">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-4 ${colorStyles[color]}`}>
        <Icon size={18} strokeWidth={2.5} />
      </div>
      <div className="flex-1 font-bold text-sm text-slate-700 group-hover:text-slate-900 transition-colors">
        {title}
      </div>
      <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
    </Link>
  );
}
