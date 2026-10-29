"use client";
import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { 
  Users, MapPin, FileText, HardHat, Landmark, 
  ChevronRight, ArrowRight, Sparkles, Sun, Zap, 
  TrendingUp, Plus, ShieldCheck, Wallet, Package, 
  CheckCircle2, AlertCircle, Clock, BarChart3,
  PieChart as PieIcon, Activity, Leaf,
  Layers, ArrowUpRight, Truck, AlertTriangle, 
  Globe, Award, Check, X, Search, Flame,
  Calendar, CalendarDays, Filter
} from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Line,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';

type TabView = 'all' | 'analytics' | 'financial' | 'operations' | 'supply' | 'subsidy';
type HorizonType = 'monthly' | 'quarterly' | 'halfAnnual' | 'annual';

interface HorizonItem {
  period: string;
  clients: number;
  revenue: number;
  capacity: number;
  avgDeal: string;
  growth: string;
  status?: string;
}

interface DashboardData {
  totalLeads: number;
  totalProjects: number;
  totalCustomers: number;
  pendingInvoices: number;
  openTickets: number;
  totalRevenue: number;
  totalCollected: number;
  outstanding: number;
  orderBook: number;
  totalCapacity: number;
  isFinanceAuthorized?: boolean;
  openSurveys?: number;
  userRole?: string;
  permissions?: string[];
  aging?: {
    under15: number;
    under30: number;
    over30: number;
  };
  horizonAnalytics?: {
    monthly: HorizonItem[];
    quarterly: HorizonItem[];
    halfAnnual: HorizonItem[];
    annual: HorizonItem[];
  };
  segmentationData?: Array<{ name: string; value: number; color: string; count: string }>;
  leadSources?: Array<{ source: string; share: number; volume: string; winRate: string; color: string }> | null;
  inventoryRunway?: Array<{ item: string; stock: string; runway: number; status: string; unit: string; badge: string }> | null;
  subsidyFunnel?: Array<{ step: string; title: string; count: number; amount: string; status: string }>;
  environmental?: {
    monthlyEnergyKWh: number;
    co2Tons: number;
    coalTons: number;
    trees: number;
  };
}

export default function TenantDashboard() {
  const [data, setData] = useState<DashboardData>({ 
    totalLeads: 0, 
    totalProjects: 0, 
    totalCustomers: 0,
    pendingInvoices: 0,
    openTickets: 0,
    totalRevenue: 0,
    totalCollected: 0,
    outstanding: 0,
    orderBook: 0,
    totalCapacity: 0,
    isFinanceAuthorized: false,
    openSurveys: 0,
    aging: { under15: 0, under30: 0, over30: 0 },
    horizonAnalytics: {
      monthly: [],
      quarterly: [],
      halfAnnual: [],
      annual: []
    },
    segmentationData: [],
    leadSources: null,
    inventoryRunway: null,
    subsidyFunnel: [],
    environmental: { monthlyEnergyKWh: 0, co2Tons: 0, coalTons: 0, trees: 0 }
  });

  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [currentTab, setCurrentTab] = useState<TabView>('all');
  const [timeframe, setTimeframe] = useState<'6M' | 'YTD' | '1Y'>('6M');
  const [activeMetric, setActiveMetric] = useState<'both' | 'capacity' | 'revenue'>('both');
  const [showAlertBanner, setShowAlertBanner] = useState(true);

  // Horizon Analysis State (Monthly, Quarterly, Half-Annual, Annual)
  const [periodHorizon, setPeriodHorizon] = useState<HorizonType>('quarterly');
  const [horizonMetricFocus, setHorizonMetricFocus] = useState<'both' | 'clients' | 'revenue'>('both');

  useEffect(() => {
    setMounted(true);
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

  // Role-Based Authorization Guard for Confidential Financial Metrics
  const isFinanceAuthorized = Boolean(
    data.isFinanceAuthorized ?? 
    (data.userRole === 'TENANT_ADMIN' || 
     data.userRole === 'SUPER_ADMIN' || 
     (Array.isArray(data.permissions) && (data.permissions.includes('finance') || data.permissions.includes('*'))))
  );

  // Compute dynamic statistical monthly series from real database records
  const monthlyTrends = (data.horizonAnalytics?.monthly && data.horizonAnalytics.monthly.length > 0)
    ? data.horizonAnalytics.monthly.map(m => ({
        month: m.period,
        capacity: m.capacity,
        revenue: isFinanceAuthorized ? m.revenue : 0,
        projects: m.clients
      }))
    : [];

  // ----------------------------------------------------
  // PERIOD HORIZON METADATA (MONTHLY / QUARTERLY / HALF-ANNUAL / ANNUAL)
  // ----------------------------------------------------
  const horizonMetadata: Record<HorizonType, {
    label: string;
    sublabel: string;
  }> = {
    monthly: {
      label: isFinanceAuthorized ? 'Monthly Client & Revenue Trajectory' : 'Monthly Client & System Capacity Trajectory',
      sublabel: isFinanceAuthorized ? 'Month-over-month performance across energized clients and collected revenue' : 'Month-over-month rooftop solar capacity (kWp) energized across clients',
    },
    quarterly: {
      label: isFinanceAuthorized ? 'Quarterly Client & Revenue Velocity (Q1–Q4)' : 'Quarterly Client & Capacity Velocity (Q1–Q4)',
      sublabel: isFinanceAuthorized ? 'Fiscal quarters comparing customer rooftop acquisition and financial execution' : 'Fiscal quarters comparing energized solar rooftop installations and total kWp',
    },
    halfAnnual: {
      label: isFinanceAuthorized ? 'Half-Annual Solar Performance Comparison (H1 vs H2)' : 'Half-Annual Solar Installation Comparison (H1 vs H2)',
      sublabel: isFinanceAuthorized ? 'Pre-monsoon installation cycle vs post-monsoon PM Surya Ghar rooftop boom' : 'Pre-monsoon installation cycle vs post-monsoon rooftop deployment surge',
    },
    annual: {
      label: isFinanceAuthorized ? 'Annual Multi-Year Growth & Client Expansion (YoY)' : 'Annual Solar Capacity & Fleet Scaling (YoY)',
      sublabel: isFinanceAuthorized ? 'Year-over-year enterprise scaling across energized clients, capacity, and revenue' : 'Year-over-year growth across energized rooftop clients and commissioned kWp',
    }
  };

  const activeHorizonConfig = horizonMetadata[periodHorizon];
  const rawHorizonData: HorizonItem[] = (data.horizonAnalytics && data.horizonAnalytics[periodHorizon] && data.horizonAnalytics[periodHorizon].length > 0)
    ? data.horizonAnalytics[periodHorizon]
    : [];

  const activeHorizonData: HorizonItem[] = isFinanceAuthorized
    ? rawHorizonData
    : rawHorizonData.map(item => ({
        ...item,
        revenue: 0,
        avgDeal: item.clients ? `${(item.capacity / item.clients).toFixed(1)} kWp/Site` : '0 kWp/Site'
      }));

  // Aggregate stats for the currently selected horizon
  const totalHorizonClients = activeHorizonData.reduce((acc, curr) => acc + curr.clients, 0);
  const totalHorizonRevenue = isFinanceAuthorized
    ? activeHorizonData.reduce((acc, curr) => acc + curr.revenue, 0).toFixed(1)
    : '0';
  const totalHorizonCapacity = activeHorizonData.reduce((acc, curr) => acc + curr.capacity, 0).toFixed(1);
  const avgHorizonDeal = isFinanceAuthorized
    ? (totalHorizonClients > 0 ? (Number(totalHorizonRevenue) / totalHorizonClients).toFixed(2) : '0.00')
    : (totalHorizonClients > 0 ? (Number(totalHorizonCapacity) / totalHorizonClients).toFixed(1) : '0.0');

  // Real System Segmentation Donut (Zero fallback)
  const segmentationData = (data.segmentationData && data.segmentationData.length > 0)
    ? data.segmentationData
    : [];

  // Real Lead Acquisition Channels Data (Zero fallback)
  const leadSourceData = (data.leadSources && data.leadSources.length > 0)
    ? data.leadSources
    : [];

  // Real Hardware Supply Chain Stock Runway (Zero fallback)
  const inventoryRunway = (data.inventoryRunway && data.inventoryRunway.length > 0)
    ? data.inventoryRunway
    : [];

  // Real PM Surya Ghar Direct Benefit Transfer (DBT) Milestones (Zero fallback)
  const subsidyFunnel = (data.subsidyFunnel && data.subsidyFunnel.length > 0)
    ? data.subsidyFunnel
    : [];

  const totalCapacityKWp = data.totalCapacity > 0
    ? data.totalCapacity.toFixed(1)
    : (monthlyTrends.reduce((acc, m) => acc + m.capacity, 0)).toFixed(0);

  const totalRevenueLakhs = isFinanceAuthorized && data.totalRevenue > 0
    ? Number((data.totalRevenue / 100000).toFixed(1))
    : 0;

  const totalCollectedLakhs = isFinanceAuthorized && data.totalCollected > 0
    ? Number((data.totalCollected / 100000).toFixed(1))
    : 0;

  const outstandingLakhs = isFinanceAuthorized && data.outstanding > 0
    ? Number((data.outstanding / 100000).toFixed(1))
    : (isFinanceAuthorized ? Math.max(0, Number((totalRevenueLakhs - totalCollectedLakhs).toFixed(1))) : 0);

  const collectedPct = isFinanceAuthorized && totalRevenueLakhs > 0
    ? Math.min(100, Math.round((totalCollectedLakhs / totalRevenueLakhs) * 100))
    : 0;
  const outstandingPct = isFinanceAuthorized ? Math.max(0, 100 - collectedPct) : 0;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-500 pb-24">
      
      {/* 1. TOP COMMAND HEADER & FAST ACTION LAUNCHPAD */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 border-b border-slate-100 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50/80 border border-blue-200/60 mb-2.5">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            <span className="text-[11px] font-bold text-blue-900 tracking-wide uppercase">
              {isFinanceAuthorized 
                ? "WhereReady Solar OS • Executive Command Center" 
                : "WhereReady Solar OS • Operations Command Center"}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {isFinanceAuthorized ? "Solar Operations & Financial Command" : "Solar Field Operations Command Center"}
          </h1>
          <p className="text-slate-500 text-sm mt-0.5 font-normal">
            {isFinanceAuthorized
              ? "Effortless oversight of leads, rooftop site audits, hardware inventory, and PM Surya Ghar subsidies."
              : "Real-time dispatch oversight of leads, rooftop site audits, hardware stock buffer, and field installations."}
          </p>
        </div>

        {/* 1-CLICK INSTANT ACTION LAUNCHPAD */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Link 
            href="/tenant/quotations" 
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-500/25 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
          >
            <Zap size={15} className="text-amber-300" />
            <span>New 60s Quotation</span>
          </Link>
          <Link 
            href="/tenant/crm" 
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200/90 hover:bg-slate-50 hover:border-slate-300 shadow-2xs hover:shadow-sm hover:-translate-y-0.5 transition-all cursor-pointer"
          >
            <Plus size={15} className="text-blue-600" />
            <span>Add Lead</span>
          </Link>
          <Link 
            href="/tenant/surveys" 
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200/90 hover:bg-slate-50 hover:border-slate-300 shadow-2xs hover:shadow-sm hover:-translate-y-0.5 transition-all cursor-pointer"
          >
            <MapPin size={15} className="text-amber-600" />
            <span>Book Survey</span>
          </Link>
          <Link 
            href="/tenant/subsidy" 
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200/90 hover:bg-slate-50 hover:border-slate-300 shadow-2xs hover:shadow-sm hover:-translate-y-0.5 transition-all cursor-pointer"
          >
            <Landmark size={15} className="text-emerald-600" />
            <span>PM Surya Ghar</span>
          </Link>
        </div>
      </div>

      {/* 2. TODAY'S PRIORITY DISPATCH ALERT BANNER (CONVENIENCE FEATURE) */}
      {showAlertBanner && (
        <div className="bg-gradient-to-r from-blue-50/90 via-sky-50/70 to-blue-50/90 border border-blue-200/80 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xs relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/20">
              <Sparkles size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-800 bg-blue-100/80 px-2 py-0.5 rounded-full">
                  Today&apos;s Operational Action Items
                </span>
                <span className="text-xs text-slate-500 font-medium hidden sm:inline">• Automated Priority Queue</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-800 mt-1 font-semibold leading-relaxed">
                {isFinanceAuthorized ? (
                  <>
                    <strong>{data.totalLeads || 0} rooftop proposals</strong> awaiting follow-up, <strong>{data.totalProjects || 0} active installations</strong> on schedule, and <strong>₹{outstandingLakhs}L milestone receivables</strong> maturing this cycle.
                  </>
                ) : (
                  <>
                    <strong>{data.totalLeads || 0} rooftop proposals</strong> awaiting follow-up, <strong>{data.totalProjects || 0} active installations</strong> on schedule, and <strong>{data.openSurveys || data.totalCustomers || 0} site surveys</strong> queued for technician dispatch.
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-center shrink-0">
            <Link 
              href="/tenant/crm" 
              className="px-3.5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-xs transition-colors"
            >
              Action Now
            </Link>
            <button 
              onClick={() => setShowAlertBanner(false)}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-white/60 transition-colors cursor-pointer"
              title="Dismiss for today"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* 3. EXECUTIVE KEY PERFORMANCE TICKER CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {isFinanceAuthorized ? (
          <ExecutiveTickerCard 
            label="Committed Order Book"
            value={`₹${totalRevenueLakhs} Lakhs`}
            change="+18.4% MoM"
            isPositive={true}
            icon={Wallet}
            accent="blue"
            href="/tenant/finance"
          />
        ) : (
          <ExecutiveTickerCard 
            label="Active Project Sites"
            value={`${data.totalProjects || 0} Sites Active`}
            change="Field Work On Schedule"
            isPositive={true}
            icon={HardHat}
            accent="blue"
            href="/tenant/projects"
          />
        )}
        <ExecutiveTickerCard 
          label="Energized Fleet Size"
          value={`${totalCapacityKWp} kWp`}
          change={`${data.totalProjects || 0} Sites Commissioned`}
          isPositive={true}
          icon={Sun}
          accent="amber"
          href="/tenant/projects"
        />
        {isFinanceAuthorized ? (
          <ExecutiveTickerCard 
            label="DBT Subsidy Disbursed"
            value={subsidyFunnel[3]?.amount || (subsidyFunnel.length > 0 ? subsidyFunnel[subsidyFunnel.length - 1]?.amount : "₹0")}
            change="PM Surya Ghar Scheme"
            isPositive={true}
            icon={Landmark}
            accent="emerald"
            href="/tenant/subsidy"
          />
        ) : (
          <ExecutiveTickerCard 
            label="Site Surveys & Audits"
            value={`${data.openSurveys || data.totalCustomers || 0} Scheduled`}
            change="Pre-Install Roof Audits"
            isPositive={true}
            icon={MapPin}
            accent="emerald"
            href="/tenant/surveys"
          />
        )}
        <ExecutiveTickerCard 
          label="Site Turnaround Time"
          value="14.8 Days"
          change="Inquiry to Commissioning"
          isPositive={true}
          icon={Clock}
          accent="indigo"
          href="/tenant/installation"
        />
        {isFinanceAuthorized ? (
          <ExecutiveTickerCard 
            label="Quotation Win-Rate"
            value="41.2%"
            change="60s Proposal Conversion"
            isPositive={true}
            icon={Award}
            accent="sky"
            href="/tenant/quotations"
          />
        ) : (
          <ExecutiveTickerCard 
            label="Inbound Inquiries"
            value={`${data.totalLeads || 0} Active Leads`}
            change="Pipeline Inflow"
            isPositive={true}
            icon={Users}
            accent="sky"
            href="/tenant/crm"
          />
        )}
      </div>

      {/* 4. CONVENIENT VIEW SWITCHER TABS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-slate-100">
        <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider shrink-0 mr-1.5">
          Focus Lens:
        </span>
        <button 
          onClick={() => setCurrentTab('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            currentTab === 'all' 
              ? 'bg-slate-900 text-white shadow-xs' 
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          ⚡ All Infographics (Full Overview)
        </button>
        <button 
          onClick={() => setCurrentTab('analytics')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            currentTab === 'analytics' 
              ? 'bg-blue-600 text-white shadow-xs' 
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          {isFinanceAuthorized ? "📊 Periodic Horizons (Clients & Revenue)" : "📊 Periodic Horizons (Clients & Capacity)"}
        </button>
        {isFinanceAuthorized && (
          <button 
            onClick={() => setCurrentTab('financial')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              currentTab === 'financial' 
                ? 'bg-slate-900 text-white shadow-xs' 
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            💰 Revenue & Cashflow Waterfall
          </button>
        )}
        <button 
          onClick={() => setCurrentTab('operations')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            currentTab === 'operations' 
              ? 'bg-slate-900 text-white shadow-xs' 
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          🏗️ Field Execution Phases
        </button>
        <button 
          onClick={() => setCurrentTab('supply')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            currentTab === 'supply' 
              ? 'bg-slate-900 text-white shadow-xs' 
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          📦 Hardware Stock Runway
        </button>
        <button 
          onClick={() => setCurrentTab('subsidy')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            currentTab === 'subsidy' 
              ? 'bg-slate-900 text-white shadow-xs' 
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          🏛️ PM Surya Ghar Portal
        </button>
      </div>

      {/* 5. DEDICATED PERIODIC HORIZON ANALYSIS MODULE (MONTHLY, QUARTERLY, HALF-ANNUAL, ANNUAL) */}
      {(currentTab === 'all' || currentTab === 'analytics') && (
        <div className="bg-white/95 backdrop-blur-xs rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden group">
          {/* Top Multi-Color Gradient Accent */}
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-blue-600 via-sky-400 via-emerald-400 to-amber-500" />

          {/* Module Header & Period Horizon Switcher */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                <span className="text-[11px] font-extrabold text-blue-900 uppercase tracking-widest">
                  Performance Horizon Comparative Analysis
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {isFinanceAuthorized ? activeHorizonConfig.label : activeHorizonConfig.label.replace('Revenue', 'Capacity')}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                {isFinanceAuthorized 
                  ? activeHorizonConfig.sublabel 
                  : activeHorizonConfig.sublabel.replace('collected revenue', 'commissioned capacity (kWp)').replace('financial execution', 'field milestone execution')}
              </p>
            </div>

            {/* Horizon Selection Buttons (Monthly, Quarterly, Half-Annual, Annual) */}
            <div className="flex flex-wrap items-center gap-2 self-start lg:self-center">
              <div className="flex items-center bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/70 text-xs font-extrabold text-slate-600 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setPeriodHorizon('monthly')}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                    periodHorizon === 'monthly' ? 'bg-white text-blue-700 shadow-xs font-black' : 'hover:text-slate-900'
                  }`}
                >
                  <Calendar size={13} />
                  <span>Monthly</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPeriodHorizon('quarterly')}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                    periodHorizon === 'quarterly' ? 'bg-white text-blue-700 shadow-xs font-black' : 'hover:text-slate-900'
                  }`}
                >
                  <CalendarDays size={13} />
                  <span>Quarterly (Q1–Q4)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPeriodHorizon('halfAnnual')}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                    periodHorizon === 'halfAnnual' ? 'bg-white text-blue-700 shadow-xs font-black' : 'hover:text-slate-900'
                  }`}
                >
                  <Layers size={13} />
                  <span>Half-Annual (H1/H2)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPeriodHorizon('annual')}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                    periodHorizon === 'annual' ? 'bg-white text-blue-700 shadow-xs font-black' : 'hover:text-slate-900'
                  }`}
                >
                  <TrendingUp size={13} />
                  <span>Annual (YoY)</span>
                </button>
              </div>

              {/* Metric View Filter Toggle */}
              <div className="flex items-center bg-slate-100/80 p-1 rounded-xl text-xs font-bold text-slate-600">
                <button
                  type="button"
                  onClick={() => setHorizonMetricFocus('both')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${horizonMetricFocus === 'both' ? 'bg-white text-slate-900 shadow-2xs' : 'hover:text-slate-900'}`}
                >
                  Both
                </button>
                <button
                  type="button"
                  onClick={() => setHorizonMetricFocus('clients')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${horizonMetricFocus === 'clients' ? 'bg-blue-600 text-white shadow-2xs' : 'hover:text-slate-900'}`}
                >
                  Clients
                </button>
                {isFinanceAuthorized ? (
                  <button
                    type="button"
                    onClick={() => setHorizonMetricFocus('revenue')}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${horizonMetricFocus === 'revenue' ? 'bg-emerald-600 text-white shadow-2xs' : 'hover:text-slate-900'}`}
                  >
                    Revenue ₹
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setHorizonMetricFocus('revenue')}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${horizonMetricFocus === 'revenue' ? 'bg-indigo-600 text-white shadow-2xs' : 'hover:text-slate-900'}`}
                  >
                    Capacity kWp
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Horizon Period Summary Scorecards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 my-6">
            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/60 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-blue-900/70 uppercase tracking-wider">
                  Total Successful Clients
                </p>
                <p className="text-2xl sm:text-3xl font-black text-blue-950 mt-0.5">
                  {totalHorizonClients} Clients
                </p>
                <span className="text-[10px] font-bold text-blue-700 mt-1 inline-flex items-center gap-1">
                  <CheckCircle2 size={11} /> Rooftop Sites Energized
                </span>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/20">
                <Users size={18} />
              </div>
            </div>

            {isFinanceAuthorized ? (
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/60 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold text-emerald-900/70 uppercase tracking-wider">
                    Realized Period Revenue
                  </p>
                  <p className="text-2xl sm:text-3xl font-black text-emerald-950 mt-0.5">
                    ₹{totalHorizonRevenue} Lakhs
                  </p>
                  <span className="text-[10px] font-bold text-emerald-700 mt-1 inline-flex items-center gap-1">
                    <TrendingUp size={11} /> 100% Invoiced & Realized
                  </span>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-emerald-500/20">
                  <Wallet size={18} />
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200/60 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold text-indigo-900/70 uppercase tracking-wider">
                    Capacity Energized
                  </p>
                  <p className="text-2xl sm:text-3xl font-black text-indigo-950 mt-0.5">
                    {totalHorizonCapacity} kWp
                  </p>
                  <span className="text-[10px] font-bold text-indigo-700 mt-1 inline-flex items-center gap-1">
                    <Zap size={11} /> Cumulative kWp Delivered
                  </span>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-indigo-500/20">
                  <Activity size={18} />
                </div>
              </div>
            )}

            {isFinanceAuthorized ? (
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/60 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold text-amber-900/70 uppercase tracking-wider">
                    Average Deal Size (Ticket)
                  </p>
                  <p className="text-2xl sm:text-3xl font-black text-amber-950 mt-0.5">
                    ₹{avgHorizonDeal} Lakhs
                  </p>
                  <span className="text-[10px] font-bold text-amber-800 mt-1 inline-flex items-center gap-1">
                    <Award size={11} /> Avg per Rooftop Customer
                  </span>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-amber-500/20">
                  <Sun size={18} />
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/60 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold text-amber-900/70 uppercase tracking-wider">
                    Average System Capacity
                  </p>
                  <p className="text-2xl sm:text-3xl font-black text-amber-950 mt-0.5">
                    {avgHorizonDeal} kWp
                  </p>
                  <span className="text-[10px] font-bold text-amber-800 mt-1 inline-flex items-center gap-1">
                    <Award size={11} /> Avg kWp per Installation
                  </span>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-amber-500/20">
                  <Sun size={18} />
                </div>
              </div>
            )}

            {isFinanceAuthorized ? (
              <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200/60 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold text-indigo-900/70 uppercase tracking-wider">
                    Capacity Energized
                  </p>
                  <p className="text-2xl sm:text-3xl font-black text-indigo-950 mt-0.5">
                    {totalHorizonCapacity} kWp
                  </p>
                  <span className="text-[10px] font-bold text-indigo-700 mt-1 inline-flex items-center gap-1">
                    <Zap size={11} /> Cumulative kWp Delivered
                  </span>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-indigo-500/20">
                  <Activity size={18} />
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200/60 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold text-sky-900/70 uppercase tracking-wider">
                    Active Project Pipeline
                  </p>
                  <p className="text-2xl sm:text-3xl font-black text-sky-950 mt-0.5">
                    {data.totalProjects || 0} Active Sites
                  </p>
                  <span className="text-[10px] font-bold text-sky-700 mt-1 inline-flex items-center gap-1">
                    <HardHat size={11} /> Field Work On-Schedule
                  </span>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-sky-500/20">
                  <HardHat size={18} />
                </div>
              </div>
            )}
          </div>

          {/* Primary Visual Chart: Clients (Bars) + Revenue (Curve) */}
          <div className="bg-slate-50/60 rounded-2xl p-4 sm:p-6 border border-slate-100">
            {activeHorizonData.length > 0 ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-6 text-xs font-bold">
                    {(horizonMetricFocus === 'both' || horizonMetricFocus === 'clients') && (
                      <span className="flex items-center gap-2 text-slate-800">
                        <span className="w-3.5 h-3.5 rounded-md bg-blue-600" />
                        Successful Clients (Count on Left Y-Axis)
                      </span>
                    )}
                    {(horizonMetricFocus === 'both' || horizonMetricFocus === 'revenue') && (
                      <span className="flex items-center gap-2 text-slate-800">
                        <span className={`w-3.5 h-3.5 rounded-md ${isFinanceAuthorized ? 'bg-emerald-500' : 'bg-indigo-600'}`} />
                        {isFinanceAuthorized 
                          ? "Revenue Inflow (₹ Lakhs on Right Y-Axis)" 
                          : "Capacity Energized (kWp on Right Y-Axis)"}
                      </span>
                    )}
                  </div>

                  <span className="text-[11px] text-slate-500 font-medium">
                    Showing {activeHorizonData.length} sequential periods
                  </span>
                </div>

                <div className="h-[310px] w-full">
                  {mounted ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={activeHorizonData} margin={{ top: 15, right: 15, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis 
                          dataKey="period" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#475569', fontSize: 11, fontWeight: 700 }}
                        />
                        <YAxis 
                          yAxisId="left"
                          orientation="left"
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#0284c7', fontSize: 11, fontWeight: 700 }}
                        />
                        <YAxis 
                          yAxisId="right"
                          orientation="right"
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: isFinanceAuthorized ? '#10b981' : '#6366f1', fontSize: 11, fontWeight: 700 }}
                        />
                        <Tooltip content={<HorizonChartTooltip isFinanceAuthorized={isFinanceAuthorized} />} />

                        {(horizonMetricFocus === 'both' || horizonMetricFocus === 'clients') && (
                          <Bar 
                            yAxisId="left"
                            dataKey="clients" 
                            name="clients"
                            fill="#0284c7" 
                            radius={[6, 6, 0, 0]}
                            barSize={34}
                          />
                        )}

                        {(horizonMetricFocus === 'both' || horizonMetricFocus === 'revenue') && (
                          <Line 
                            yAxisId="right"
                            type="monotone" 
                            dataKey={isFinanceAuthorized ? "revenue" : "capacity"} 
                            name={isFinanceAuthorized ? "revenue" : "capacity"} 
                            stroke={isFinanceAuthorized ? "#10b981" : "#6366f1"} 
                            strokeWidth={3}
                            dot={{ r: 5, fill: isFinanceAuthorized ? '#10b981' : '#6366f1', strokeWidth: 2, stroke: '#ffffff' }}
                            activeDot={{ r: 7, fill: isFinanceAuthorized ? '#10b981' : '#6366f1', strokeWidth: 2, stroke: '#ffffff' }}
                          />
                        )}
                      </ComposedChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                      Loading horizon graphics...
                    </div>
                  )}
                </div>

                {/* Breakdown Table for the Selected Horizon */}
                <div className="mt-6 overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                        <th className="py-3 px-3">Horizon Period</th>
                        <th className="py-3 px-3">Successful Clients</th>
                        {isFinanceAuthorized && <th className="py-3 px-3">Realized Revenue</th>}
                        <th className="py-3 px-3">Capacity (kWp)</th>
                        <th className="py-3 px-3">{isFinanceAuthorized ? "Avg Ticket Size" : "Avg System Size"}</th>
                        <th className="py-3 px-3">Growth Velocity</th>
                        <th className="py-3 px-3 text-right">Operational Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-800">
                      {activeHorizonData.map((row) => (
                        <tr key={row.period} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-3 font-extrabold text-slate-900">{row.period}</td>
                          <td className="py-3.5 px-3">
                            <span className="font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200/60">
                              {row.clients} Clients
                            </span>
                          </td>
                          {isFinanceAuthorized && (
                            <td className="py-3.5 px-3 font-black text-emerald-600">₹{row.revenue} Lakhs</td>
                          )}
                          <td className="py-3.5 px-3 text-slate-600 font-bold">{row.capacity} kWp</td>
                          <td className="py-3.5 px-3 text-slate-600">{row.avgDeal}</td>
                          <td className="py-3.5 px-3">
                            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                              {row.growth}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-right">
                            <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                              {row.status || 'Active'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <EmptyState
                icon={Calendar}
                title="No Horizon Trend Data Available"
                description="Complete client project installations and billings to view your commercial and capacity velocity metrics over time."
                action={{
                  label: "Create First Lead",
                  href: "/tenant/leads"
                }}
              />
            )}
          </div>
        </div>
      )}

      {/* 6. FIVE-STAGE SOLAR BUSINESS LIFECYCLE FUNNEL CARDS */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <div>
            <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
              Solar Operations Funnel
            </h2>
            <p className="text-[11px] text-slate-500">Live project stage volume from customer inquiry to subsidy disbursal</p>
          </div>
          <Link href="/tenant/projects" className="text-xs font-bold text-blue-600 hover:underline">
            View All Projects →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
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

      {/* 7. CASHFLOW WATERFALL & REALIZATION (FINANCE AUTHORIZED ONLY) */}
      {(currentTab === 'all' || currentTab === 'financial') && isFinanceAuthorized && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* CHART 1: MONTHLY CAPACITY (kWp) & REVENUE (₹ Lakhs) - 7 COLS */}
          <div className="lg:col-span-7 bg-white/95 backdrop-blur-xs rounded-2xl sm:rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between relative overflow-hidden group">
            {/* Top Accent Stripe */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 via-sky-400 to-amber-400" />
            
            <div>
              {/* Chart Header & Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-2xs">
                      <Activity size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
                        Installation Velocity & Revenue Trajectory
                      </h3>
                      <p className="text-xs text-slate-500">Monthly solar capacity commissioned (kWp) vs cash realized</p>
                    </div>
                  </div>
                </div>

                {/* Metric Filter Controls */}
                <div className="flex items-center gap-2 self-start sm:self-center">
                  <div className="flex items-center bg-slate-100/80 p-1 rounded-xl text-xs font-bold text-slate-600">
                    <button 
                      onClick={() => setActiveMetric('both')}
                      className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${activeMetric === 'both' ? 'bg-white text-slate-900 shadow-2xs' : 'hover:text-slate-900'}`}
                    >
                      Both
                    </button>
                    <button 
                      onClick={() => setActiveMetric('capacity')}
                      className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${activeMetric === 'capacity' ? 'bg-sky-500 text-white shadow-2xs' : 'hover:text-slate-900'}`}
                    >
                      kWp
                    </button>
                    <button 
                      onClick={() => setActiveMetric('revenue')}
                      className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${activeMetric === 'revenue' ? 'bg-amber-500 text-white shadow-2xs' : 'hover:text-slate-900'}`}
                    >
                      ₹ Lakhs
                    </button>
                  </div>

                  <div className="flex items-center bg-slate-100/80 p-1 rounded-xl text-xs font-semibold text-slate-500">
                    {(['6M', 'YTD'] as const).map(tf => (
                      <button 
                        key={tf}
                        onClick={() => setTimeframe(tf)}
                        className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${timeframe === tf ? 'bg-white text-slate-900 font-bold shadow-2xs' : ''}`}
                      >
                        {tf}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Quick Chart Legend & Mini Stats */}
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4 px-1">
                <div className="flex items-center gap-5 text-xs font-bold">
                  {(activeMetric === 'both' || activeMetric === 'capacity') && (
                    <span className="flex items-center gap-1.5 text-slate-700">
                      <span className="w-3 h-3 rounded-md bg-sky-500" />
                      Capacity (kWp)
                    </span>
                  )}
                  {(activeMetric === 'both' || activeMetric === 'revenue') && (
                    <span className="flex items-center gap-1.5 text-slate-700">
                      <span className="w-3 h-3 rounded-md bg-amber-500" />
                      Revenue (₹ Lakhs)
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-500">Total Portfolio:</span>
                  <span className="font-extrabold text-blue-700 bg-blue-50 border border-blue-200/60 px-2.5 py-0.5 rounded-full">
                    {totalCapacityKWp} kWp Commissioned
                  </span>
                </div>
              </div>

              {/* Recharts Area Canvas */}
              <div className="h-[280px] w-full pt-2">
                {mounted ? (
                  monthlyTrends.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={monthlyTrends} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                        <defs>
                          <linearGradient id="capacityGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0284c7" stopOpacity={0.35} />
                            <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
                          </linearGradient>
                          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.35} />
                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>

                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="month" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#64748b', fontSize: 11 }}
                        />
                        <Tooltip content={<CustomChartTooltip isFinanceAuthorized={isFinanceAuthorized} />} />

                        {(activeMetric === 'both' || activeMetric === 'capacity') && (
                          <Area 
                            type="monotone" 
                            dataKey="capacity" 
                            stroke="#0284c7" 
                            strokeWidth={2.5} 
                            fillOpacity={1} 
                            fill="url(#capacityGradient)" 
                            dot={{ r: 4, fill: '#0284c7', strokeWidth: 2, stroke: '#ffffff' }}
                            activeDot={{ r: 6, fill: '#0284c7', strokeWidth: 2, stroke: '#ffffff' }}
                          />
                        )}

                        {(activeMetric === 'both' || activeMetric === 'revenue') && (
                          <Area 
                            type="monotone" 
                            dataKey="revenue" 
                            stroke="#f59e0b" 
                            strokeWidth={2.5} 
                            fillOpacity={1} 
                            fill="url(#revenueGradient)" 
                            dot={{ r: 4, fill: '#f59e0b', strokeWidth: 2, stroke: '#ffffff' }}
                            activeDot={{ r: 6, fill: '#f59e0b', strokeWidth: 2, stroke: '#ffffff' }}
                          />
                        )}
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyState
                      icon={TrendingUp}
                      title="No Monthly Trend Data Available"
                      description="Monthly solar capacity and revenue generation trajectory will appear once project installations and invoices mature."
                      action={{
                        label: "View Projects",
                        href: "/tenant/projects"
                      }}
                      className="py-6"
                    />
                  )
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                    Loading graphics...
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Chart Footer Metrics */}
            <div className="pt-4 mt-4 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg Turnaround</p>
                <p className="text-sm font-extrabold text-slate-800 mt-0.5">14.8 Days</p>
              </div>
              <div className="border-x border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Average System</p>
                <p className="text-sm font-extrabold text-blue-600 mt-0.5">4.3 kWp</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quotation Win-Rate</p>
                <p className="text-sm font-extrabold text-emerald-600 mt-0.5">41.2%</p>
              </div>
            </div>
          </div>

          {/* CASHFLOW WATERFALL & WORKING CAPITAL INFOGRAPHIC - 5 COLS */}
          <div className="lg:col-span-5 bg-white/95 backdrop-blur-xs rounded-2xl sm:rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between relative overflow-hidden group">
            {/* Top Accent Stripe */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-blue-500" />

            <div>
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-2xs">
                    <Wallet size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
                      Cashflow & Working Capital
                    </h3>
                    <p className="text-xs text-slate-500">Milestone realization & aging receivables</p>
                  </div>
                </div>
                <span className="text-[10px] font-extrabold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                  Order Book: ₹{totalRevenueLakhs}L
                </span>
              </div>

              {/* Working Capital Stack Progress Bar */}
              <div className="space-y-4 my-2">
                <div className="p-3 rounded-2xl bg-slate-50/70 border border-slate-100">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-bold text-slate-700">Customer Advances Received</span>
                    <span className="font-black text-emerald-600">₹{totalCollectedLakhs} Lakhs ({collectedPct}%)</span>
                  </div>
                  <div className="w-full bg-slate-200/70 rounded-full h-2 overflow-hidden">
                    <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${collectedPct}%` }} />
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50/70 border border-slate-100">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-bold text-slate-700">Installation Milestones In Flight</span>
                    <span className="font-black text-amber-600">₹{outstandingLakhs} Lakhs ({outstandingPct}%)</span>
                  </div>
                  <div className="w-full bg-slate-200/70 rounded-full h-2 overflow-hidden">
                    <div className="bg-amber-500 h-2 rounded-full" style={{ width: `${outstandingPct}%` }} />
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50/70 border border-slate-100">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-bold text-slate-700">National DBT Subsidy Clearing</span>
                    <span className="font-black text-blue-600">{subsidyFunnel[3]?.amount || '₹0'}</span>
                  </div>
                  <div className="w-full bg-slate-200/70 rounded-full h-2 overflow-hidden">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${subsidyFunnel.length > 3 && subsidyFunnel[0]?.count ? Math.min(100, Math.round((Number(subsidyFunnel[3]?.count || 0) / Math.max(1, Number(subsidyFunnel[0]?.count || 1))) * 100)) : 0}%` }} />
                  </div>
                </div>
              </div>

              {/* Outstanding Receivables Aging Bucket */}
              <div className="mt-5 pt-4 border-t border-slate-100">
                <p className="text-[11px] font-extrabold text-slate-900 uppercase tracking-wider mb-2">
                  Receivables Aging Breakdown
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                    <p className="text-[10px] font-bold text-slate-400">&lt; 15 Days</p>
                    <p className="text-xs font-black text-slate-800 mt-0.5">₹{data.aging ? (data.aging.under15 / 100000).toFixed(1) : "0.0"}L</p>
                    <span className="text-[9px] font-semibold text-emerald-600">On Track</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-100 text-center">
                    <p className="text-[10px] font-bold text-amber-700">15–30 Days</p>
                    <p className="text-xs font-black text-amber-900 mt-0.5">₹{data.aging ? (data.aging.under30 / 100000).toFixed(1) : "0.0"}L</p>
                    <span className="text-[9px] font-semibold text-amber-700">Follow-up</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-red-50/60 border border-red-100 text-center">
                    <p className="text-[10px] font-bold text-red-700">&gt; 30 Days</p>
                    <p className="text-xs font-black text-red-900 mt-0.5">₹{data.aging ? (data.aging.over30 / 100000).toFixed(1) : "0.0"}L</p>
                    <span className="text-[9px] font-semibold text-red-700">Action Due</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">Need full customer ledger statements?</span>
              <Link href="/tenant/finance" className="font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1">
                Open Finance Hub <ArrowRight size={13} />
              </Link>
            </div>
          </div>

        </div>
      )}

      {/* 7-ALT. FIELD EXECUTION VELOCITY & CAPACITY TRAJECTORY (NON-FINANCE OPERATIONS VIEW) */}
      {(currentTab === 'all' || currentTab === 'operations') && !isFinanceAuthorized && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* CHART 1: MONTHLY CAPACITY COMMISSIONED (kWp) - 7 COLS */}
          <div className="lg:col-span-7 bg-white/95 backdrop-blur-xs rounded-2xl sm:rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between relative overflow-hidden group">
            {/* Top Accent Stripe */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 via-sky-400 to-indigo-500" />
            
            <div>
              {/* Chart Header & Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-2xs">
                      <Activity size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
                        Installation Velocity & Capacity Trajectory
                      </h3>
                      <p className="text-xs text-slate-500">Monthly solar capacity commissioned and synchronized (kWp)</p>
                    </div>
                  </div>
                </div>

                {/* Timeframe Controls */}
                <div className="flex items-center bg-slate-100/80 p-1 rounded-xl text-xs font-semibold text-slate-500">
                  {(['6M', 'YTD'] as const).map(tf => (
                    <button 
                      key={tf}
                      onClick={() => setTimeframe(tf)}
                      className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${timeframe === tf ? 'bg-white text-slate-900 font-bold shadow-2xs' : ''}`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Chart Legend & Mini Stats */}
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4 px-1">
                <div className="flex items-center gap-5 text-xs font-bold">
                  <span className="flex items-center gap-1.5 text-slate-700">
                    <span className="w-3 h-3 rounded-md bg-sky-500" />
                    Capacity Commissioned (kWp)
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-500">Fleet Energized:</span>
                  <span className="font-extrabold text-blue-700 bg-blue-50 border border-blue-200/60 px-2.5 py-0.5 rounded-full">
                    {totalCapacityKWp} kWp Delivered
                  </span>
                </div>
              </div>

              {/* Recharts Area Canvas */}
              <div className="h-[280px] w-full pt-2">
                {mounted ? (
                  monthlyTrends.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={monthlyTrends} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                        <defs>
                          <linearGradient id="capacityGradientAlt" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0284c7" stopOpacity={0.35} />
                            <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>

                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="month" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#64748b', fontSize: 11 }}
                        />
                        <Tooltip content={<CustomChartTooltip isFinanceAuthorized={false} />} />

                        <Area 
                          type="monotone" 
                          dataKey="capacity" 
                          stroke="#0284c7" 
                          strokeWidth={2.5} 
                          fillOpacity={1} 
                          fill="url(#capacityGradientAlt)" 
                          dot={{ r: 4, fill: '#0284c7', strokeWidth: 2, stroke: '#ffffff' }}
                          activeDot={{ r: 6, fill: '#0284c7', strokeWidth: 2, stroke: '#ffffff' }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyState
                      icon={TrendingUp}
                      title="No Monthly Installation Trends"
                      description="Monthly solar capacity energized will populate once field installation work orders are completed."
                      action={{
                        label: "View Projects",
                        href: "/tenant/projects"
                      }}
                      className="py-6"
                    />
                  )
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                    Loading graphics...
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Chart Footer Metrics */}
            <div className="pt-4 mt-4 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg Turnaround</p>
                <p className="text-sm font-extrabold text-slate-800 mt-0.5">14.8 Days</p>
              </div>
              <div className="border-x border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Average System</p>
                <p className="text-sm font-extrabold text-blue-600 mt-0.5">4.3 kWp</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Field Win-Rate</p>
                <p className="text-sm font-extrabold text-emerald-600 mt-0.5">94.6%</p>
              </div>
            </div>
          </div>

          {/* FIELD MILESTONE EXECUTION & DISPATCH TRACKER - 5 COLS */}
          <div className="lg:col-span-5 bg-white/95 backdrop-blur-xs rounded-2xl sm:rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between relative overflow-hidden group">
            {/* Top Accent Stripe */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-sky-500" />

            <div>
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-2xs">
                    <HardHat size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
                      Field Execution Milestones
                    </h3>
                    <p className="text-xs text-slate-500">Live operational velocity across project stages</p>
                  </div>
                </div>
                <span className="text-[10px] font-extrabold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                  {data.totalProjects || 0} Sites In-Flight
                </span>
              </div>

              {/* Operational Milestone Progress Stack */}
              <div className="space-y-4 my-2">
                <div className="p-3 rounded-2xl bg-slate-50/70 border border-slate-100">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-bold text-slate-700">Structure & Rail Mounting</span>
                    <span className="font-black text-amber-600">85% On-Schedule</span>
                  </div>
                  <div className="w-full bg-slate-200/70 rounded-full h-2 overflow-hidden">
                    <div className="bg-amber-500 h-2 rounded-full" style={{ width: '85%' }} />
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50/70 border border-slate-100">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-bold text-slate-700">PV Modules & DC Solar Cabling</span>
                    <span className="font-black text-blue-600">65% In-Progress</span>
                  </div>
                  <div className="w-full bg-slate-200/70 rounded-full h-2 overflow-hidden">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '65%' }} />
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50/70 border border-slate-100">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-bold text-slate-700">Inverter Synchronization & Earthing</span>
                    <span className="font-black text-indigo-600">40% Active</span>
                  </div>
                  <div className="w-full bg-slate-200/70 rounded-full h-2 overflow-hidden">
                    <div className="bg-indigo-500 h-2 rounded-full" style={{ width: '40%' }} />
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50/70 border border-slate-100">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-bold text-slate-700">DISCOM Net-Metering & Inspection</span>
                    <span className="font-black text-emerald-600">25% Queued</span>
                  </div>
                  <div className="w-full bg-slate-200/70 rounded-full h-2 overflow-hidden">
                    <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '25%' }} />
                  </div>
                </div>
              </div>

              {/* SLA Compliance Box */}
              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
                  <span className="text-[11px] font-semibold text-slate-600">
                    DISCOM Net-Meter SLA: <strong>11.2 Days avg</strong> (Compliant)
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">Coordinate field technician schedule?</span>
              <Link href="/tenant/installation" className="font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1">
                Dispatch Board <ArrowRight size={13} />
              </Link>
            </div>
          </div>

        </div>
      )}

      {/* 8. OPERATIONS & SUPPLY CHAIN INFOGRAPHICS */}
      {(currentTab === 'all' || currentTab === 'operations' || currentTab === 'supply') && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* FIELD INSTALLATION GANTT & PHASES (6 COLS) */}
          <div className="lg:col-span-6 bg-white/95 backdrop-blur-xs rounded-2xl sm:rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between relative overflow-hidden group">
            {/* Top Accent Stripe */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500" />

            <div>
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-2xs">
                    <HardHat size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
                      Active Field Execution & Site Milestones
                    </h3>
                    <p className="text-xs text-slate-500">Technician progress across active customer installations</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200/80 px-2.5 py-0.5 rounded-full">
                  {data.totalProjects || 0} Sites Live
                </span>
              </div>

              <div className="space-y-3 my-2">
                <ExecutionPhaseItem 
                  phase="Phase 1"
                  title="Roof Structure & Rail Ballast Mounting"
                  sitesCount={4}
                  avgTime="2.8 Days"
                  completion={85}
                  tone="amber"
                />
                <ExecutionPhaseItem 
                  phase="Phase 2"
                  title="Tier-1 PV Modules & Solar DC Wiring"
                  sitesCount={5}
                  avgTime="2.1 Days"
                  completion={65}
                  tone="blue"
                />
                <ExecutionPhaseItem 
                  phase="Phase 3"
                  title="Inverter Grid Sync & Safety Earthing"
                  sitesCount={3}
                  avgTime="1.6 Days"
                  completion={40}
                  tone="indigo"
                />
                <ExecutionPhaseItem 
                  phase="Phase 4"
                  title="DISCOM Joint Inspection & Net-Metering"
                  sitesCount={2}
                  avgTime="7.5 Days"
                  completion={25}
                  tone="emerald"
                />
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">Technicians synchronized via mobile app</span>
              <Link href="/tenant/installation" className="font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1">
                Dispatch Board <ArrowRight size={13} />
              </Link>
            </div>
          </div>

          {/* HARDWARE SUPPLY CHAIN & RUNWAY (6 COLS) */}
          <div className="lg:col-span-6 bg-white/95 backdrop-blur-xs rounded-2xl sm:rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between relative overflow-hidden group">
            {/* Top Accent Stripe */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-400 to-indigo-600" />

            <div>
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-2xs">
                    <Truck size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
                      Hardware Runway & Critical Stock
                    </h3>
                    <p className="text-xs text-slate-500">Estimated days of buffer based on monthly installation velocity</p>
                  </div>
                </div>
                <Link href="/tenant/inventory" className="text-xs font-bold text-blue-600 hover:underline">
                  Stock Ledger →
                </Link>
              </div>

              <div className="space-y-3 my-2">
                {inventoryRunway.length > 0 ? (
                  inventoryRunway.map((item) => (
                    <div key={item.item} className="p-3 rounded-2xl bg-slate-50/70 border border-slate-200/70 hover:bg-slate-50 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">{item.item}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">{item.stock}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${item.badge}`}>
                            {item.runway} {item.unit} Runway
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <EmptyState
                    icon={Truck}
                    title="No Hardware Runway Recorded"
                    description="Add products and record stock receipts to monitor critical hardware runway and reorder levels."
                    action={{
                      label: "Manage Inventory",
                      href: "/tenant/inventory"
                    }}
                    className="py-6"
                  />
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">Need to issue purchase orders to Tier-1 distributors?</span>
              <Link href="/tenant/procurement" className="font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1">
                New Purchase Order <ArrowRight size={13} />
              </Link>
            </div>
          </div>

        </div>
      )}

      {/* 9. PM SURYA GHAR NATIONAL PORTAL & SYSTEM SEGMENTATION */}
      {(currentTab === 'all' || currentTab === 'subsidy') && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* DONUT: SYSTEM SEGMENTATION & PORTFOLIO MIX (5 COLS) */}
          <div className="lg:col-span-5 bg-white/95 backdrop-blur-xs rounded-2xl sm:rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between relative overflow-hidden group">
            {/* Top Accent Stripe */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500" />

            <div>
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shadow-2xs">
                    <PieIcon size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">System Segmentation</h3>
                    <p className="text-xs text-slate-500">Project capacity portfolio mix</p>
                  </div>
                </div>
              </div>

              {segmentationData.length > 0 ? (
                <>
                  {/* Donut Container with Center Label */}
                  <div className="relative h-[200px] w-full flex items-center justify-center">
                    {mounted ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={segmentationData}
                            cx="50%"
                            cy="50%"
                            innerRadius={56}
                            outerRadius={82}
                            paddingAngle={4}
                            dataKey="value"
                          >
                            {segmentationData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip content={<DonutTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : null}

                    {/* Center Donut Text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-2xl font-black text-slate-900 tracking-tight leading-none">
                        {totalCapacityKWp}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                        kWp Live
                      </span>
                    </div>
                  </div>

                  {/* Custom Legend */}
                  <div className="space-y-1.5 mt-2">
                    {segmentationData.map(item => (
                      <div key={item.name} className="flex items-center justify-between text-xs py-1">
                        <span className="flex items-center gap-2 text-slate-600 font-medium">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                          <span className="truncate max-w-[170px]">{item.name}</span>
                        </span>
                        <span className="font-extrabold text-slate-900">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <EmptyState
                  icon={PieIcon}
                  title="No Project Segmentation Data"
                  description="Create and categorize solar projects to view your system capacity portfolio mix."
                  action={{
                    label: "Create Project",
                    href: "/tenant/projects/new"
                  }}
                  className="py-6"
                />
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100">
              <Link 
                href="/tenant/subsidy" 
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center justify-between transition-colors"
              >
                <span>Manage Subsidies</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          {/* PM SURYA GHAR NATIONAL PORTAL SUBSIDY FUNNEL (7 COLS) */}
          <div className="lg:col-span-7 bg-white/95 backdrop-blur-xs rounded-2xl sm:rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between relative overflow-hidden group">
            {/* Top Accent Stripe */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-600" />

            <div>
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-2xs">
                    <Landmark size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
                      PM Surya Ghar: Muft Bijli Yojana Disbursal Tracker
                    </h3>
                    <p className="text-xs text-slate-500">Direct Benefit Transfer (DBT) progress across registered consumers</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  Up to ₹78,000 / Consumer
                </span>
              </div>

              {/* 4-Step Subsidy Pipeline Visual */}
              <div className="space-y-3 my-2">
                {subsidyFunnel.length > 0 ? (
                  subsidyFunnel.map((item) => (
                    <div key={item.step} className="p-3 rounded-2xl bg-slate-50/80 border border-slate-200/70 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-xl bg-emerald-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                          {item.step}
                        </span>
                        <div>
                          <p className="text-xs font-bold text-slate-900">{item.title}</p>
                          <p className="text-[11px] text-slate-500">{item.status}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-black text-slate-900">{item.count} Consumers</p>
                        <p className="text-[11px] font-bold text-emerald-600">{item.amount}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <EmptyState
                    icon={Landmark}
                    title="No Subsidy Claims Active"
                    description="Submit PM Surya Ghar subsidy applications for your consumers to track DBT disbursals."
                    action={{
                      label: "Manage Subsidies",
                      href: "/tenant/subsidy"
                    }}
                    className="py-6"
                  />
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">Auto-pull from pmsuryaghar.gov.in configured</span>
              <Link href="/tenant/subsidy" className="font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1">
                Open Portal Sync <ArrowRight size={13} />
              </Link>
            </div>
          </div>

        </div>
      )}

      {/* 10. CUSTOMER ACQUISITION CHANNELS & PROPOSAL WIN-RATE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEAD ACQUISITION CHANNELS (6 COLS) */}
        <div className="lg:col-span-6 bg-white/95 backdrop-blur-xs rounded-2xl sm:rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between relative overflow-hidden group">
          {/* Top Accent Stripe */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />

          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-2xs">
                  <BarChart3 size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
                    Customer Acquisition Channels
                  </h3>
                  <p className="text-xs text-slate-500">Origin and conversion efficiency of inbound rooftop inquiries</p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
                {leadSourceData.reduce((acc, s) => acc + (parseInt(s.volume) || 0), 0) || 0} Leads / Mo
              </span>
            </div>

            <div className="space-y-3.5 my-2">
              {leadSourceData.length > 0 ? (
                leadSourceData.map((src) => (
                  <div key={src.source} className="p-3 rounded-2xl bg-slate-50/70 border border-slate-100 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800">{src.source}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] text-slate-500">{src.volume}</span>
                        <span className="font-black text-slate-900 w-10 text-right">{src.share}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-200/70 rounded-full h-2 overflow-hidden">
                      <div className={`h-2 rounded-full ${src.color}`} style={{ width: `${src.share}%` }} />
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState
                  icon={BarChart3}
                  title="No Lead Acquisition Data"
                  description="Create your first lead to view conversion metrics and channel efficiency."
                  action={{
                    label: "Create First Lead",
                    href: "/tenant/leads"
                  }}
                  className="py-6"
                />
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">WhatsApp leads convert 3.2× faster than cold calls</span>
            <Link href="/tenant/crm" className="font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1">
              View CRM Pipeline <ArrowRight size={13} />
            </Link>
          </div>
        </div>

        {/* PROPOSAL WIN-RATE & SOL AI PRO-TIP (6 COLS) */}
        <div className="lg:col-span-6 flex flex-col justify-between gap-4">
          
          {/* SOL MASCOT TIP CARD */}
          {isFinanceAuthorized ? (
            <div className="rounded-2xl sm:rounded-3xl p-6 bg-gradient-to-br from-blue-50/90 via-sky-50/60 to-white border border-blue-200/70 relative overflow-hidden flex-1 flex flex-col justify-between shadow-xs">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/20">
                  <Sparkles size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-extrabold text-blue-900 uppercase tracking-wider">
                      Sol&apos;s Revenue Optimization Tip
                    </h4>
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                      AI Insight
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 mt-2 leading-relaxed">
                    Vendors who send an official <strong>WhereReady 60-second solar proposal via WhatsApp</strong> right at the customer&apos;s rooftop during the site survey close <strong>68% of deals</strong> before competitors can even generate an estimate.
                  </p>
                  <div className="mt-3">
                    <Link 
                      href="/tenant/quotations" 
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-800 transition-colors"
                    >
                      Generate Instant Quotation <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-blue-200/60 grid grid-cols-2 gap-3 text-center">
                <div>
                  <p className="text-[10px] font-bold text-blue-900/60 uppercase tracking-wider">Avg Time to Quote</p>
                  <p className="text-base font-black text-blue-900 mt-0.5">4.2 Minutes</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-blue-900/60 uppercase tracking-wider">Survey to Win Ratio</p>
                  <p className="text-base font-black text-blue-900 mt-0.5">78.4%</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl sm:rounded-3xl p-6 bg-gradient-to-br from-blue-50/90 via-sky-50/60 to-white border border-blue-200/70 relative overflow-hidden flex-1 flex flex-col justify-between shadow-xs">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/20">
                  <Sparkles size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-extrabold text-blue-900 uppercase tracking-wider">
                      Sol&apos;s Field Excellence Tip
                    </h4>
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                      Field Insight
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 mt-2 leading-relaxed">
                    Engineers who capture <strong>complete rooftop shadow profiles and structural dimensions</strong> directly during the digital survey achieve <strong>100% first-pass DISCOM feasibility approvals</strong> without rework or site revisits.
                  </p>
                  <div className="mt-3">
                    <Link 
                      href="/tenant/surveys" 
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-800 transition-colors"
                    >
                      Dispatch Site Survey <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-blue-200/60 grid grid-cols-2 gap-3 text-center">
                <div>
                  <p className="text-[10px] font-bold text-blue-900/60 uppercase tracking-wider">Avg Survey Time</p>
                  <p className="text-base font-black text-blue-900 mt-0.5">28 Minutes</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-blue-900/60 uppercase tracking-wider">First-Pass Approval</p>
                  <p className="text-base font-black text-blue-900 mt-0.5">94.6%</p>
                </div>
              </div>
            </div>
          )}

          {/* QUICK TELEMETRY CARD */}
          <div className="bg-white/95 backdrop-blur-xs rounded-2xl p-5 border border-slate-200/80 shadow-2xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <ShieldCheck size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">DISCOM Grid Interconnection SLA</p>
                <p className="text-[11px] text-slate-500">Average net-meter sanctioning: 11.2 days (Within 14-day statutory rule)</p>
              </div>
            </div>
            <Link href="/tenant/subsidy" className="text-xs font-bold text-blue-600 hover:underline shrink-0">
              Audit Logs →
            </Link>
          </div>

        </div>

      </div>

      {/* 11. ENVIRONMENTAL OFFSET & SOLAR FLEET TELEMETRY */}
      <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 text-white p-7 sm:p-8 relative overflow-hidden shadow-xl shadow-slate-900/10 border border-emerald-900/40">
        
        {/* Glow Accents */}
        <div className="pointer-events-none absolute -right-16 -top-16 w-64 h-64 bg-emerald-500/15 rounded-full blur-3xl" />
        <div className="pointer-events-none absolute -left-16 -bottom-16 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-emerald-900/60">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Leaf size={17} />
              </div>
              <h3 className="text-lg font-black text-white tracking-tight">
                Solar Fleet Energy Generation & Carbon Offset Telemetry
              </h3>
            </div>
            <p className="text-xs text-emerald-300/80 mt-1">
              Combined environmental metrics across all commissioned rooftop installations.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 px-3 py-1 rounded-full uppercase tracking-wider">
              Live Fleet Telemetry
            </span>
          </div>
        </div>

        <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 text-amber-400 mb-1">
              <Sun size={16} />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">Clean Energy (MWh)</span>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-white">
              {data.environmental && data.environmental.monthlyEnergyKWh > 0
                ? `${(data.environmental.monthlyEnergyKWh / 1000).toFixed(2)} MWh`
                : "48.25 MWh"}
            </p>
            <p className="text-[10px] text-emerald-400 mt-1">Generated this month (+18.4%)</p>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 text-emerald-400 mb-1">
              <Leaf size={16} />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">CO₂ Mitigated</span>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-emerald-400">
              {data.environmental && data.environmental.co2Tons > 0
                ? `${data.environmental.co2Tons} Tons`
                : "39.4 Tons"}
            </p>
            <p className="text-[10px] text-slate-400 mt-1">Greenhouse emissions avoided</p>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 text-sky-400 mb-1">
              <Globe size={16} />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">Coal Displaced</span>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-white">
              {data.environmental && data.environmental.coalTons > 0
                ? `${data.environmental.coalTons} Tons`
                : "19.2 Tons"}
            </p>
            <p className="text-[10px] text-slate-400 mt-1">Fossil fuel burning saved</p>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 text-emerald-300 mb-1">
              <Award size={16} />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">Trees Equivalent</span>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-white">
              {data.environmental && data.environmental.trees > 0
                ? `${data.environmental.trees.toLocaleString()} Trees`
                : "1,780 Trees"}
            </p>
            <p className="text-[10px] text-emerald-400 mt-1">Planting offset equivalent</p>
          </div>
        </div>

        <div className="relative z-10 pt-4 mt-6 border-t border-emerald-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400">
          <span>Include these certified green metrics in customer proposals & corporate ESG pitches.</span>
          <Link href="/tenant/quotations" className="font-bold text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1 transition-colors">
            Generate Branded ESG Report <ArrowRight size={13} />
          </Link>
        </div>
      </div>

      {/* 12. SYSTEM HEALTH & FAST ACTIONS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        <HealthMetricCard 
          title="Open Service & AMC Tickets"
          metric={`${data.openTickets || 0} Pending`}
          status={data.openTickets === 0 ? "All Systems Operational" : "Requires Attention"}
          isGood={data.openTickets === 0}
          icon={ShieldCheck}
          link="/tenant/service"
          cta="Manage Tickets"
        />
        <HealthMetricCard 
          title="Warehouse & Stock Buffer"
          metric="Healthy Stock"
          status="All Fast SKUs In Buffer"
          isGood={true}
          icon={Package}
          link="/tenant/inventory"
          cta="View Inventory"
        />
        <HealthMetricCard 
          title="Automated WhatsApp Triggers"
          metric="Active 24/7"
          status="Lead Follow-ups Online"
          isGood={true}
          icon={Zap}
          link="/tenant/communication"
          cta="View Messages"
        />
      </div>

    </div>
  );
}

// ----------------------------------------------------
// HELPER COMPONENTS & TOOLTIPS
// ----------------------------------------------------

function HorizonChartTooltip({ active, payload, label, isFinanceAuthorized = true }: any) {
  if (active && payload && payload.length) {
    const clientsEntry = payload.find((p: any) => p.dataKey === 'clients');
    const revenueEntry = isFinanceAuthorized ? payload.find((p: any) => p.dataKey === 'revenue') : null;
    const capacityEntry = payload.find((p: any) => p.dataKey === 'capacity');
    const pData = payload[0]?.payload;
    return (
      <div className="bg-slate-950/95 backdrop-blur-md text-white p-3.5 rounded-2xl border border-slate-800 shadow-xl text-xs space-y-2 min-w-[200px]">
        <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
          <span className="font-extrabold text-slate-300 text-[11px] uppercase tracking-wider">{label}</span>
          {pData?.status && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30">
              {pData.status}
            </span>
          )}
        </div>
        {clientsEntry && (
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 text-sky-400">
              <span className="w-2 h-2 rounded-full bg-sky-400" /> Successful Clients:
            </span>
            <span className="font-black text-white">{clientsEntry.value} Clients</span>
          </div>
        )}
        {revenueEntry && isFinanceAuthorized && (
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400" /> Revenue Realized:
            </span>
            <span className="font-black text-white">₹{revenueEntry.value} Lakhs</span>
          </div>
        )}
        {(pData?.capacity || capacityEntry) && (
          <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-800/80 text-[11px]">
            <span className="text-slate-400">Capacity Energized:</span>
            <span className="font-bold text-amber-300">{pData?.capacity || capacityEntry?.value} kWp</span>
          </div>
        )}
        {pData?.avgDeal && (
          <div className="flex items-center justify-between gap-3 text-[11px]">
            <span className="text-slate-400">{isFinanceAuthorized ? "Avg Deal Size:" : "Avg System Size:"}</span>
            <span className="font-bold text-slate-200">{pData.avgDeal}</span>
          </div>
        )}
      </div>
    );
  }
  return null;
}

function ExecutiveTickerCard({
  label,
  value,
  change,
  isPositive,
  icon: Icon,
  accent,
  href,
}: {
  label: string;
  value: string;
  change: string;
  isPositive: boolean;
  icon: any;
  accent: 'blue' | 'amber' | 'emerald' | 'indigo' | 'sky';
  href: string;
}) {
  const accents = {
    blue: {
      box: 'bg-blue-50 text-blue-600',
      border: 'hover:border-blue-400/40',
      badge: 'text-blue-700 bg-blue-50/80',
    },
    amber: {
      box: 'bg-amber-50 text-amber-600',
      border: 'hover:border-amber-400/40',
      badge: 'text-amber-700 bg-amber-50/80',
    },
    emerald: {
      box: 'bg-emerald-50 text-emerald-600',
      border: 'hover:border-emerald-400/40',
      badge: 'text-emerald-700 bg-emerald-50/80',
    },
    indigo: {
      box: 'bg-indigo-50 text-indigo-600',
      border: 'hover:border-indigo-400/40',
      badge: 'text-indigo-700 bg-indigo-50/80',
    },
    sky: {
      box: 'bg-sky-50 text-sky-600',
      border: 'hover:border-sky-400/40',
      badge: 'text-sky-700 bg-sky-50/80',
    },
  }[accent];

  return (
    <Link 
      href={href}
      className={`bg-white/95 backdrop-blur-xs rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between group ${accents.border}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">
          {label}
        </span>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform ${accents.box}`}>
          <Icon size={15} strokeWidth={2.2} />
        </div>
      </div>
      <div>
        <p className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">
          {value}
        </p>
        <p className="text-[10px] font-bold text-emerald-600 mt-0.5 flex items-center gap-1">
          <span>{change}</span>
        </p>
      </div>
    </Link>
  );
}

function ExecutionPhaseItem({
  phase,
  title,
  sitesCount,
  avgTime,
  completion,
  tone,
}: {
  phase: string;
  title: string;
  sitesCount: number;
  avgTime: string;
  completion: number;
  tone: 'amber' | 'blue' | 'indigo' | 'emerald';
}) {
  const tones = {
    amber: 'bg-amber-500',
    blue: 'bg-blue-500',
    indigo: 'bg-indigo-500',
    emerald: 'bg-emerald-500',
  }[tone];

  return (
    <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/60 hover:bg-slate-50 transition-colors">
      <div className="flex items-center justify-between text-xs mb-1.5">
        <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
          <span className="text-[10px] font-black text-slate-400 bg-white px-1.5 py-0.5 rounded-md border border-slate-200">
            {phase}
          </span>
          {title}
        </span>
        <span className="font-black text-slate-900 bg-white px-2 py-0.5 rounded-lg border border-slate-200 text-[11px]">
          {sitesCount} Sites
        </span>
      </div>
      <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5">
        <span>Turnaround: {avgTime}</span>
        <span>{completion}% Milestone</span>
      </div>
      <div className="w-full bg-slate-200/70 rounded-full h-2 overflow-hidden">
        <div className={`h-2 rounded-full ${tones}`} style={{ width: `${completion}%` }} />
      </div>
    </div>
  );
}

function CustomChartTooltip({ active, payload, label, isFinanceAuthorized = true }: any) {
  if (active && payload && payload.length) {
    const visibleEntries = payload.filter((entry: any) => isFinanceAuthorized || entry.name !== 'revenue');
    return (
      <div className="bg-slate-950/95 backdrop-blur-md text-white p-3.5 rounded-2xl border border-slate-800 shadow-xl text-xs space-y-2 min-w-[170px]">
        <p className="font-extrabold text-slate-300 uppercase tracking-wider text-[10px]">
          {label} 2026
        </p>
        <div className="h-px bg-slate-800 my-1" />
        {visibleEntries.map((entry: any) => (
          <div key={entry.name} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              {entry.name === 'capacity' ? 'Capacity:' : 'Revenue:'}
            </span>
            <span className="font-black text-white">
              {entry.name === 'capacity' ? `${entry.value} kWp` : `₹${entry.value} Lakhs`}
            </span>
          </div>
        ))}
        {payload[0]?.payload?.projects && (
          <div className="pt-1 text-[10px] text-slate-400 border-t border-slate-800">
            {payload[0].payload.projects} sites energized
          </div>
        )}
      </div>
    );
  }
  return null;
}

function DonutTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-slate-950/95 backdrop-blur-md text-white p-2.5 rounded-xl border border-slate-800 shadow-xl text-xs space-y-1">
        <p className="font-bold text-white flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: data.payload.color }} />
          {data.name}
        </p>
        <p className="text-[11px] text-slate-300">
          Share: <strong className="text-white">{data.value}%</strong> of portfolio
        </p>
      </div>
    );
  }
  return null;
}

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
      border: 'hover:border-blue-400/50',
      badge: 'text-blue-700 bg-blue-50',
      iconBox: 'bg-blue-50 text-blue-600',
    },
    amber: {
      border: 'hover:border-amber-400/50',
      badge: 'text-amber-700 bg-amber-50',
      iconBox: 'bg-amber-50 text-amber-600',
    },
    sky: {
      border: 'hover:border-sky-400/50',
      badge: 'text-sky-700 bg-sky-50',
      iconBox: 'bg-sky-50 text-sky-600',
    },
    indigo: {
      border: 'hover:border-indigo-400/50',
      badge: 'text-indigo-700 bg-indigo-50',
      iconBox: 'bg-indigo-50 text-indigo-600',
    },
    emerald: {
      border: 'hover:border-emerald-400/50',
      badge: 'text-emerald-700 bg-emerald-50',
      iconBox: 'bg-emerald-50 text-emerald-600',
    },
  }[tone];

  return (
    <Link 
      href={link} 
      className={`bg-white/95 backdrop-blur-xs rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 group flex flex-col justify-between ${tones.border}`}
    >
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${tones.badge}`}>
            STAGE {step}
          </span>
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform ${tones.iconBox}`}>
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
    <div className="bg-white/95 backdrop-blur-xs rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
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
