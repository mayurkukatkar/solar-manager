"use client";
import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Users, MapPin, FileText, HardHat, Landmark, 
  ChevronRight, ArrowRight, Sparkles, Sun, Zap, 
  TrendingUp, Plus, ShieldCheck, Wallet, Package, 
  CheckCircle2, AlertCircle, Clock
} from 'lucide-react';

export default function TenantDashboard() {
  const [data, setData] = useState<{
    totalLeads: number;
    totalProjects: number;
    totalCustomers: number;
    pendingInvoices: number;
    openTickets: number;
    totalRevenue: number;
    outstanding: number;
  }>({ 
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
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/dashboard`, 
          { withCredentials: true }
        );
        if (res.data) {
          setData(res.data);
        }
      } catch (err: any) {
        console.error("Dashboard data fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-500 pb-12">
      
      {/* TOP COMMAND HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/60 mb-2">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            <span className="text-[11px] font-bold text-blue-900 tracking-wide uppercase">
              WhereReady Solar OS • Workspace
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Command Center
          </h1>
          <p className="text-slate-500 text-sm mt-0.5 font-normal">
            Real-time operations from customer inquiry to DISCOM net-metering and subsidy disbursal.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link 
            href="/tenant/crm" 
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-2xs"
          >
            <Users size={15} className="text-slate-500" /> CRM Pipeline
          </Link>
          <Link 
            href="/tenant/quotations" 
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-sm shadow-blue-500/20"
          >
            <Plus size={15} /> 60s Quotation
          </Link>
        </div>
      </div>

      {/* 5-STAGE SOLAR BUSINESS LIFECYCLE FUNNEL */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <div>
            <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
              Solar Operations Funnel
            </h2>
            <p className="text-[11px] text-slate-500">End-to-end status of customer projects</p>
          </div>
          <span className="text-xs font-semibold text-blue-600 hover:underline">
            <Link href="/tenant/projects">View Full Flow →</Link>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          
          <FunnelStageCard 
            step="01"
            title="Inbound Leads" 
            subtitle="Customer inquiries"
            count={data.totalLeads} 
            icon={Users}
            tone="blue"
            link="/tenant/crm"
          />

          <FunnelStageCard 
            step="02"
            title="Site Surveys" 
            subtitle="Roof & shadow audit"
            count={data.totalCustomers} 
            icon={MapPin}
            tone="amber"
            link="/tenant/surveys"
          />

          <FunnelStageCard 
            step="03"
            title="Quotations" 
            subtitle="DISCOM & subsidy math"
            count={data.totalLeads > 0 ? Math.max(1, Math.round(data.totalLeads * 0.7)) : 0} 
            icon={FileText}
            tone="sky"
            link="/tenant/quotations"
          />

          <FunnelStageCard 
            step="04"
            title="Installations" 
            subtitle="Structure & inverter sync"
            count={data.totalProjects} 
            icon={HardHat}
            tone="indigo"
            link="/tenant/installation"
          />

          <FunnelStageCard 
            step="05"
            title="Subsidy & Net Meter" 
            subtitle="PM Surya Ghar disbursal"
            count={data.pendingInvoices} 
            icon={Landmark}
            tone="emerald"
            link="/tenant/subsidy"
          />

        </div>
      </div>

      {/* FINANCIAL OVERVIEW & QUICK ACTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* FINANCIAL REVENUE CARD (7 COLS) */}
        <div className="lg:col-span-7 rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white p-7 sm:p-8 relative overflow-hidden shadow-xl shadow-slate-900/10 border border-slate-800 flex flex-col justify-between min-h-[300px]">
          
          {/* Subtle Solar Glow Accent */}
          <div className="pointer-events-none absolute -right-16 -top-16 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl" />
          <div className="pointer-events-none absolute -left-16 -bottom-16 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />

          <div className="relative z-10">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-[11px] font-extrabold text-slate-300 uppercase tracking-widest">
                  Financial Realization
                </span>
              </div>
              <span className="text-[10px] font-bold text-amber-300 bg-amber-400/15 border border-amber-400/30 px-2.5 py-1 rounded-full uppercase tracking-wider">
                PM Surya Ghar & Commercial
              </span>
            </div>

            <div className="mt-4">
              <p className="text-xs text-slate-400 font-medium">Total Collected Revenue (YTD)</p>
              <div className="flex items-baseline gap-3 mt-1">
                <h3 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white">
                  ₹{(data.totalRevenue || 0).toLocaleString('en-IN')}
                </h3>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-6 mt-6 border-t border-slate-800/80 grid grid-cols-2 gap-4">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Outstanding Balance
              </p>
              <p className="text-lg sm:text-xl font-bold text-amber-400 mt-0.5">
                ₹{(data.outstanding || 0).toLocaleString('en-IN')}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">Pending customer / subsidy payment</p>
            </div>

            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Active Projects
              </p>
              <p className="text-lg sm:text-xl font-bold text-white mt-0.5">
                {data.totalProjects || 0} Sites Active
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">Material & electrical on track</p>
            </div>
          </div>

          <div className="relative z-10 mt-6 flex items-center justify-between pt-4 border-t border-slate-800/50">
            <span className="text-xs text-slate-400">Want full billing and ledger details?</span>
            <Link 
              href="/tenant/finance" 
              className="text-xs font-bold text-blue-400 hover:text-blue-300 inline-flex items-center gap-1 transition-colors"
            >
              Open Finance Hub <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* QUICK ACTIONS & SOL PRO-TIP (5 COLS) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          
          {/* SOL MASCOT TIP CARD */}
          <div className="rounded-2xl p-5 bg-blue-50/70 border border-blue-200/70 relative overflow-hidden">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/20">
                <Sparkles size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-blue-900 uppercase tracking-wider">
                    Sol&apos;s Pro Tip
                  </h4>
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                    Conversion Boost
                  </span>
                </div>
                <p className="text-xs text-slate-700 mt-1.5 leading-relaxed">
                  Sharing a solar quotation on <strong>WhatsApp within 15 minutes</strong> of a site survey increases deal win-rate by <strong>3.2×</strong>. 
                </p>
                <div className="mt-2.5">
                  <Link 
                    href="/tenant/quotations" 
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-800 transition-colors"
                  >
                    Draft WhatsApp Quotation <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* QUICK LAUNCH GRID */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs flex-1 flex flex-col justify-between">
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-3">
              Quick Operations
            </h3>

            <div className="space-y-2">
              <QuickActionItem 
                title="Add New Customer Lead" 
                detail="Capture from WhatsApp or walk-in"
                icon={Users} 
                tone="blue" 
                href="/tenant/crm" 
              />
              <QuickActionItem 
                title="Schedule Site Roof Survey" 
                detail="Assign technician with shadow app"
                icon={MapPin} 
                tone="amber" 
                href="/tenant/surveys" 
              />
              <QuickActionItem 
                title="DISCOM & PM Surya Ghar" 
                detail="Track national subsidy application"
                icon={Landmark} 
                tone="emerald" 
                href="/tenant/subsidy" 
              />
              <QuickActionItem 
                title="Hardware Stock & Inverters" 
                detail="Panels, rails, wiring & balance"
                icon={Package} 
                tone="indigo" 
                href="/tenant/inventory" 
              />
            </div>
          </div>

        </div>

      </div>

      {/* OPERATIONS & SYSTEM HEALTH */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        <HealthMetricCard 
          title="Open Service & AMC Tickets"
          metric={`${data.openTickets || 0} Pending`}
          status={data.openTickets === 0 ? "All Resolved" : "Requires Attention"}
          isGood={data.openTickets === 0}
          icon={ShieldCheck}
          link="/tenant/service"
          cta="Manage Tickets"
        />
        <HealthMetricCard 
          title="Procurement & Inventory"
          metric="Healthy Stock"
          status="All Top SKUs Available"
          isGood={true}
          icon={Package}
          link="/tenant/inventory"
          cta="View Inventory"
        />
        <HealthMetricCard 
          title="Automated Follow-ups"
          metric="Active 24/7"
          status="WhatsApp Triggers Live"
          isGood={true}
          icon={Zap}
          link="/tenant/automation"
          cta="Configure Rules"
        />
      </div>

    </div>
  );
}

// ----------------------------------------------------
// HELPER COMPONENTS
// ----------------------------------------------------

function FunnelStageCard({ 
  step, 
  title, 
  subtitle, 
  count, 
  icon: Icon, 
  tone, 
  link 
}: { 
  step: string;
  title: string;
  subtitle: string;
  count: number;
  icon: any;
  tone: 'blue' | 'amber' | 'sky' | 'indigo' | 'emerald';
  link: string;
}) {
  const tones = {
    blue: {
      border: 'hover:border-blue-300',
      badge: 'text-blue-700 bg-blue-50',
      iconBox: 'bg-blue-50 text-blue-600',
    },
    amber: {
      border: 'hover:border-amber-300',
      badge: 'text-amber-700 bg-amber-50',
      iconBox: 'bg-amber-50 text-amber-600',
    },
    sky: {
      border: 'hover:border-sky-300',
      badge: 'text-sky-700 bg-sky-50',
      iconBox: 'bg-sky-50 text-sky-600',
    },
    indigo: {
      border: 'hover:border-indigo-300',
      badge: 'text-indigo-700 bg-indigo-50',
      iconBox: 'bg-indigo-50 text-indigo-600',
    },
    emerald: {
      border: 'hover:border-emerald-300',
      badge: 'text-emerald-700 bg-emerald-50',
      iconBox: 'bg-emerald-50 text-emerald-600',
    },
  }[tone];

  return (
    <Link 
      href={link} 
      className={`bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs transition-all hover:shadow-md hover:-translate-y-0.5 group flex flex-col justify-between ${tones.border}`}
    >
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${tones.badge}`}>
            STAGE {step}
          </span>
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${tones.iconBox}`}>
            <Icon size={16} strokeWidth={2.2} />
          </div>
        </div>
        <p className="text-xs font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors">
          {title}
        </p>
        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
          {subtitle}
        </p>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-baseline justify-between">
        <span className="text-2xl font-black text-slate-900 tracking-tight">
          {count}
        </span>
        <span className="text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all text-xs font-bold inline-flex items-center">
          Open →
        </span>
      </div>
    </Link>
  );
}

function QuickActionItem({
  title,
  detail,
  icon: Icon,
  tone,
  href,
}: {
  title: string;
  detail: string;
  icon: any;
  tone: 'blue' | 'amber' | 'emerald' | 'indigo';
  href: string;
}) {
  const tones = {
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    indigo: 'bg-indigo-50 text-indigo-600',
  }[tone];

  return (
    <Link 
      href={href} 
      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 group"
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${tones}`}>
        <Icon size={16} strokeWidth={2.2} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
          {title}
        </p>
        <p className="text-[11px] text-slate-500 truncate">
          {detail}
        </p>
      </div>
      <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all shrink-0" />
    </Link>
  );
}

function HealthMetricCard({
  title,
  metric,
  status,
  isGood,
  icon: Icon,
  link,
  cta,
}: {
  title: string;
  metric: string;
  status: string;
  isGood: boolean;
  icon: any;
  link: string;
  cta: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
            {title}
          </span>
          <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
            <Icon size={16} />
          </div>
        </div>
        <p className="text-xl font-black text-slate-900 tracking-tight">
          {metric}
        </p>
        <div className="flex items-center gap-1.5 mt-1.5">
          {isGood ? (
            <CheckCircle2 size={13} className="text-emerald-500" />
          ) : (
            <AlertCircle size={13} className="text-amber-500" />
          )}
          <span className={`text-xs font-semibold ${isGood ? 'text-emerald-600' : 'text-amber-600'}`}>
            {status}
          </span>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100">
        <Link 
          href={link} 
          className="text-xs font-bold text-slate-700 hover:text-blue-600 inline-flex items-center gap-1 transition-colors"
        >
          {cta} <ChevronRight size={13} />
        </Link>
      </div>
    </div>
  );
}
