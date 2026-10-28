"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import axios from 'axios';
import { 
  LayoutDashboard, Users, Briefcase, Settings, LogOut, Sun, ChevronLeft, 
  ChevronDown, ChevronRight, Search, Users2, MapPin, FileText, HardHat, 
  Package, Truck, Receipt, Banknote, Landmark, FileBox, Wrench, ShieldCheck, 
  MessageSquare, UserPlus, Shield, BarChart2, Zap, Bell, History, Menu, 
  X, Sparkles, Plus, Compass, CheckCircle2, ArrowRight, ExternalLink,
  Flame, Radio, SlidersHorizontal, Activity
} from 'lucide-react';

// ==========================================
// 1. PIPELINE VIEW: GOLDEN PATH FOR SOLAR EPCS
// ==========================================
const SOLAR_PIPELINE_STAGES = [
  { 
    stage: '01',
    name: 'Inbound Leads', 
    icon: Users, 
    path: '/tenant/leads', 
    category: 'Acquisition',
    badge: 'Funnel',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    description: 'Lead qualification, CRM & customer requests'
  },
  { 
    stage: '02',
    name: 'Site Feasibility', 
    icon: MapPin, 
    path: '/tenant/surveys', 
    category: 'Engineering',
    badge: 'Feasibility',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    description: 'Technical survey, shadow study & structure audit'
  },
  { 
    stage: '03',
    name: 'Solar Quotations', 
    icon: FileText, 
    path: '/tenant/quotations', 
    category: 'Commercial',
    badge: 'Proposals',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    description: 'Statutory DISCOM quotes, BOM & financial ROI'
  },
  { 
    stage: '04',
    name: 'Active Projects', 
    icon: Briefcase, 
    path: '/tenant/projects', 
    category: 'Execution',
    badge: 'EPC Ops',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    description: 'Milestones, Gantt schedules & site tracker'
  },
  { 
    stage: '05',
    name: 'PM Surya Ghar', 
    icon: Landmark, 
    path: '/tenant/subsidy', 
    category: 'National Portal',
    badge: 'MNRE Scheme',
    badgeColor: 'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-900 border-amber-300 font-extrabold',
    pulse: true,
    description: 'Central rooftop solar subsidy claims & meter audit'
  },
  { 
    stage: '06',
    name: 'Field Installation', 
    icon: HardHat, 
    path: '/tenant/installation', 
    category: 'Delivery',
    badge: 'Commissioning',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    description: 'Crew dispatch, safety checklist & grid synchronization'
  },
];

// ==========================================
// 2. COMPLETE TAXONOMY: ALL SOLAR MODULES
// ==========================================
interface MenuItem {
  name: string;
  icon: React.ElementType;
  path: string;
  badge?: string;
  badgeStyle?: string;
}

interface MenuGroup {
  title: string;
  accent: string;
  items: MenuItem[];
}

const MENU_GROUPS: MenuGroup[] = [
  {
    title: 'CORE PIPELINE',
    accent: 'text-blue-600 bg-blue-50 border-blue-200',
    items: [
      { name: 'Dashboard', icon: LayoutDashboard, path: '/tenant/dashboard' },
      { name: 'Leads & Funnel', icon: Users, path: '/tenant/leads' },
      { name: 'CRM Pipeline', icon: Users2, path: '/tenant/crm' },
      { name: 'Site Surveys', icon: MapPin, path: '/tenant/surveys' },
      { name: 'Quotations & Proposals', icon: FileText, path: '/tenant/quotations' },
      { name: 'Solar Projects', icon: Briefcase, path: '/tenant/projects' },
    ]
  },
  {
    title: 'OPERATIONS & SITE',
    accent: 'text-amber-600 bg-amber-50 border-amber-200',
    items: [
      { name: 'Installation & Crew', icon: HardHat, path: '/tenant/installation' },
      { name: 'Inventory & BOM', icon: Package, path: '/tenant/inventory' },
      { name: 'Procurement & Vendors', icon: Truck, path: '/tenant/procurement' },
    ]
  },
  {
    title: 'FINANCE & SCHEMES',
    accent: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    items: [
      { name: 'Billing & Invoices', icon: Receipt, path: '/tenant/finance' },
      { 
        name: 'PM Surya Ghar Portal', 
        icon: Landmark, 
        path: '/tenant/subsidy', 
        badge: 'National', 
        badgeStyle: 'bg-amber-100 text-amber-900 border-amber-300 font-bold' 
      },
      { name: 'Solar Loans & Financing', icon: Banknote, path: '/tenant/loans' },
    ]
  },
  {
    title: 'CUSTOMER CARE & AMC',
    accent: 'text-purple-600 bg-purple-50 border-purple-200',
    items: [
      { name: 'Documents & KYC', icon: FileBox, path: '/tenant/documents' },
      { name: 'Service & Tickets', icon: Wrench, path: '/tenant/service' },
      { name: 'AMC & Warranty', icon: ShieldCheck, path: '/tenant/amc' },
      { name: 'WhatsApp & Messages', icon: MessageSquare, path: '/tenant/communication' },
    ]
  },
  {
    title: 'TEAM & AUTOMATION',
    accent: 'text-teal-600 bg-teal-50 border-teal-200',
    items: [
      { name: 'Staff & Technicians', icon: UserPlus, path: '/tenant/staff' },
      { name: 'Users & Permissions', icon: Shield, path: '/tenant/users' },
      { name: 'Reports & Analytics', icon: BarChart2, path: '/tenant/reports' },
      { name: 'Workflow Automation', icon: Zap, path: '/tenant/automation' },
    ]
  },
  {
    title: 'SYSTEM & SECURITY',
    accent: 'text-slate-600 bg-slate-100 border-slate-300',
    items: [
      { name: 'Notifications', icon: Bell, path: '/tenant/notifications' },
      { name: 'Company Settings', icon: Settings, path: '/tenant/settings' },
      { name: 'Audit Trail Logs', icon: History, path: '/tenant/audit-logs' },
    ]
  }
];

// ==========================================
// 3. QUICK ACTIONS POPUP CATALOG
// ==========================================
const QUICK_ACTIONS = [
  {
    title: 'New Solar Project',
    desc: 'Configure capacity, single-line diagrams, consumer billing & start milestone plan',
    path: '/tenant/projects/new',
    icon: Briefcase,
    color: 'from-blue-600 to-indigo-600',
    tag: 'Execution'
  },
  {
    title: 'Capture Lead',
    desc: 'Register prospective consumer with rooftop size, tariff & DISCOM provider',
    path: '/tenant/leads',
    icon: Users,
    color: 'from-blue-500 to-cyan-500',
    tag: 'Sales Funnel'
  },
  {
    title: 'Schedule Site Survey',
    desc: 'Dispatch field technician for GPS azimuth, shade report & structure feasibility',
    path: '/tenant/surveys',
    icon: MapPin,
    color: 'from-purple-500 to-indigo-500',
    tag: 'Technical'
  },
  {
    title: 'Draft Quotation',
    desc: 'Generate branded solar proposal with bill of materials & payback ROI',
    path: '/tenant/quotations',
    icon: FileText,
    color: 'from-emerald-500 to-teal-600',
    tag: 'Commercial'
  },
  {
    title: 'PM Surya Ghar Claim',
    desc: 'Track consumer subsidy registration on National Rooftop Portal',
    path: '/tenant/subsidy',
    icon: Landmark,
    color: 'from-amber-500 to-orange-500',
    tag: 'Govt Subsidy'
  },
  {
    title: 'Log Material / Stock',
    desc: 'Receive Tier-1 solar panels, inverters, cables & mounting structures',
    path: '/tenant/inventory',
    icon: Package,
    color: 'from-slate-700 to-slate-900',
    tag: 'Warehouse'
  }
];

export default function TenantLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  
  // State
  const [loggingOut, setLoggingOut] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarMode, setSidebarMode] = useState<'pipeline' | 'all'>('pipeline');
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [quickActionOpen, setQuickActionOpen] = useState(false);
  const [userProfileMenuOpen, setUserProfileMenuOpen] = useState(false);
  
  // User Profile
  const [currentUser, setCurrentUser] = useState<{
    name: string;
    email: string;
    role: string;
    tenantName: string;
  } | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load saved preferences
  useEffect(() => {
    try {
      const savedCollapsed = localStorage.getItem('solar_sidebar_collapsed');
      if (savedCollapsed !== null) {
        setSidebarCollapsed(savedCollapsed === 'true');
      }
      const savedMode = localStorage.getItem('solar_sidebar_mode');
      if (savedMode === 'all' || savedMode === 'pipeline') {
        setSidebarMode(savedMode);
      }
    } catch (e) {}
  }, []);

  const toggleSidebarCollapse = () => {
    setSidebarCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('solar_sidebar_collapsed', String(next));
      } catch (e) {}
      return next;
    });
  };

  const handleModeChange = (mode: 'pipeline' | 'all') => {
    setSidebarMode(mode);
    try {
      localStorage.setItem('solar_sidebar_mode', mode);
    } catch (e) {}
  };

  // Keyboard shortcut listener: Ctrl+K / Cmd+K / Slash focuses search; Esc closes popovers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === 'k' && (e.ctrlKey || e.metaKey)) || 
        (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA')
      ) {
        e.preventDefault();
        if (sidebarCollapsed) {
          setSidebarCollapsed(false);
        }
        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 50);
      } else if (e.key === 'Escape') {
        setQuickActionOpen(false);
        setUserProfileMenuOpen(false);
        if (searchQuery) setSearchQuery('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sidebarCollapsed, searchQuery]);

  // Verify active tenant status & fetch profile
  useEffect(() => {
    let isMounted = true;
    const verifyTenantStatus = async () => {
      try {
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/me`,
          { withCredentials: true }
        );
        if (isMounted) {
          if (res.data?.user) {
            setCurrentUser({
              name: res.data.user.name || 'Solar EPC Partner',
              email: res.data.user.email || '',
              role: res.data.user.role || 'ADMIN',
              tenantName: res.data.user.tenant?.name || 'WhereReady Solar Workspace',
            });
          }
          if (res.data?.user?.tenant?.status === 'SUSPENDED') {
            localStorage.removeItem('token');
            localStorage.removeItem('auth_token');
            router.replace('/suspended');
          }
        }
      } catch (err: any) {
        if (isMounted) {
          if (
            err.response?.status === 403 &&
            (err.response?.data?.code === 'TENANT_SUSPENDED' ||
             err.response?.data?.isSuspended ||
             String(err.response?.data?.error || '').toLowerCase().includes('suspended'))
          ) {
            localStorage.removeItem('token');
            localStorage.removeItem('auth_token');
            router.replace('/suspended');
          } else if (err.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('auth_token');
            router.replace('/login');
          }
        }
      }
    };

    verifyTenantStatus();
    return () => {
      isMounted = false;
    };
  }, [pathname, router]);

  // Auto-expand active group & close mobile menu on route navigation
  useEffect(() => {
    const activeGroup = MENU_GROUPS.find(g => 
      g.items.some(item => pathname === item.path || pathname.startsWith(`${item.path}/`))
    );
    if (activeGroup) {
      setOpenGroups(prev => ({ ...prev, [activeGroup.title]: true }));
    }
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      localStorage.removeItem('token');
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/logout`, 
        {}, 
        { withCredentials: true }
      );
      localStorage.removeItem('auth_token');
      router.push('/login');
    } catch (error) {
      console.error(error);
      setLoggingOut(false);
    }
  };

  const toggleGroup = (title: string) => {
    setOpenGroups(prev => ({ ...prev, [title]: !prev[title] }));
  };

  // User Initials generator
  const getInitials = (name?: string) => {
    if (!name) return 'SP';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Render Sidebar Content (shared between Desktop & Mobile)
  const renderSidebarContent = (isMobile = false) => {
    const isCollapsed = !isMobile && sidebarCollapsed;

    return (
      <div className="flex flex-col h-full bg-white select-none border-r border-slate-200/80 relative">
        
        {/* ========================================================= */}
        {/* 1. BRAND & WORKSPACE HEADER                               */}
        {/* ========================================================= */}
        <div className={`h-16 lg:h-20 flex items-center border-b border-slate-100 shrink-0 px-4 transition-all ${
          isCollapsed ? 'justify-center' : 'justify-between'
        }`}>
          <div className={`flex items-center min-w-0 ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
            <button 
              type="button"
              onClick={isCollapsed ? toggleSidebarCollapse : undefined}
              title={isCollapsed ? "Click to expand sidebar" : "WhereReady Solar OS"}
              className={`relative w-10 h-10 rounded-2xl overflow-hidden border border-slate-200/80 bg-white shadow-xs shrink-0 flex items-center justify-center transition-all ${
                isCollapsed ? 'hover:scale-105 hover:border-blue-400 cursor-pointer ring-2 ring-transparent hover:ring-blue-100' : ''
              }`}
            >
              <Image
                src="/images/whereready_logo.png"
                alt="WhereReady Logo"
                width={32}
                height={32}
                className="object-contain p-0.5"
                priority
              />
            </button>

            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h1 className="font-extrabold text-slate-900 text-sm tracking-tight leading-none truncate font-['Plus_Jakarta_Sans',sans-serif]">
                    WhereReady
                  </h1>
                  <span className="text-[10px] font-extrabold px-1.5 py-0.2 bg-blue-600 text-white rounded-md tracking-wider">
                    OS
                  </span>
                </div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1 truncate flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                  {currentUser?.tenantName ? currentUser.tenantName : 'Solar Workspace'}
                </p>
              </div>
            )}
          </div>

          {/* TOGGLE / COLLAPSE BUTTON */}
          {isMobile ? (
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
          ) : !isCollapsed ? (
            <button
              type="button"
              onClick={toggleSidebarCollapse}
              className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all cursor-pointer border border-transparent hover:border-slate-200"
              title="Collapse sidebar (Ctrl+[)"
            >
              <ChevronLeft size={16} />
            </button>
          ) : null}
        </div>

        {/* ========================================================= */}
        {/* 2. QUICK ACTIONS HUB (HIGH IMPACT PRODUCTIVITY BUTTON)    */}
        {/* ========================================================= */}
        <div className={`p-3 shrink-0 ${isCollapsed ? 'flex justify-center' : ''}`}>
          {!isCollapsed ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setQuickActionOpen(prev => !prev)}
                className="w-full py-2.5 px-3.5 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white rounded-xl font-bold text-xs shadow-sm hover:shadow-md transition-all flex items-center justify-between group cursor-pointer border border-blue-500/30"
              >
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                    <Sparkles size={12} className="text-blue-100 group-hover:rotate-12 transition-transform" />
                  </div>
                  <span>Quick Action</span>
                </div>
                <div className="flex items-center gap-1 text-white/80">
                  <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-mono">+ New</span>
                  <ChevronDown size={14} className={`transition-transform duration-200 ${quickActionOpen ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {/* QUICK ACTION FLYOUT / POPOVER */}
              {quickActionOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setQuickActionOpen(false)} 
                  />
                  <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200/90 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 divide-y divide-slate-100">
                    <div className="pb-1.5 px-2 pt-1 flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                        Create New Record
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">Instant Dispatch</span>
                    </div>

                    <div className="space-y-1 pt-1.5">
                      {QUICK_ACTIONS.map((action, i) => (
                        <Link
                          key={i}
                          href={action.path}
                          onClick={() => {
                            setQuickActionOpen(false);
                            if (isMobile) setMobileMenuOpen(false);
                          }}
                          className="flex items-start gap-3 p-2 rounded-xl hover:bg-slate-50 transition-all group"
                        >
                          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${action.color} text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs group-hover:scale-105 transition-transform`}>
                            <action.icon size={15} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                                {action.title}
                              </p>
                              <span className="text-[9px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                                {action.tag}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500 truncate leading-tight mt-0.5">
                              {action.desc}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="relative group">
              <button
                type="button"
                onClick={() => setQuickActionOpen(prev => !prev)}
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-sm hover:shadow-md transition-all cursor-pointer hover:scale-105"
                title="Quick Actions Menu"
              >
                <Plus size={18} strokeWidth={2.5} />
              </button>

              {/* Collapsed flyout */}
              {quickActionOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setQuickActionOpen(false)} />
                  <div className="fixed left-20 top-20 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200/90 p-3 z-50 animate-in fade-in zoom-in-95">
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2 px-1">
                      Quick Action Dispatch
                    </p>
                    <div className="space-y-1">
                      {QUICK_ACTIONS.map((action, i) => (
                        <Link
                          key={i}
                          href={action.path}
                          onClick={() => setQuickActionOpen(false)}
                          className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-50 text-xs font-semibold text-slate-800 transition-colors"
                        >
                          <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${action.color} text-white flex items-center justify-center shrink-0`}>
                            <action.icon size={13} />
                          </div>
                          <span className="truncate">{action.title}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* 3. DUAL-MODE VIEW TOGGLE: PIPELINE VS ALL MODULES        */}
        {/* ========================================================= */}
        {!isCollapsed && !searchQuery && (
          <div className="px-3 pb-2 shrink-0">
            <div className="bg-slate-100 p-0.5 rounded-xl flex items-center border border-slate-200/60">
              <button
                type="button"
                onClick={() => handleModeChange('pipeline')}
                className={`flex-1 py-1 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  sidebarMode === 'pipeline'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Compass size={13} className={sidebarMode === 'pipeline' ? 'text-blue-600' : 'text-slate-400'} />
                <span>Pipeline Flow</span>
              </button>
              <button
                type="button"
                onClick={() => handleModeChange('all')}
                className={`flex-1 py-1 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  sidebarMode === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <SlidersHorizontal size={13} className={sidebarMode === 'all' ? 'text-blue-600' : 'text-slate-400'} />
                <span>All Modules</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 4. KEYBOARD-ENABLED SMART MODULE SEARCH                  */}
        {/* ========================================================= */}
        {!isCollapsed ? (
          <div className="px-3 pb-2 shrink-0">
            <div className="relative group">
              <Search 
                size={14} 
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors pointer-events-none" 
              />
              <input 
                ref={searchInputRef}
                type="text" 
                placeholder="Search modules..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50/80 border border-slate-200 text-xs rounded-xl py-2 pl-8 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all font-medium text-slate-700 placeholder:text-slate-400"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                  title="Clear search"
                >
                  <X size={13} />
                </button>
              ) : (
                <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] font-mono font-bold text-slate-400 bg-white border border-slate-200 rounded px-1.5 py-0.5 shadow-2xs pointer-events-none">
                  ⌘K
                </kbd>
              )}
            </div>
          </div>
        ) : (
          <div className="py-1 flex justify-center shrink-0">
            <button
              type="button"
              onClick={toggleSidebarCollapse}
              title="Search modules (Click to expand)"
              className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              <Search size={16} />
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* 5. NAVIGATION MAIN SCROLLER                               */}
        {/* ========================================================= */}
        <div className={`flex-1 pb-4 overflow-y-auto custom-scrollbar ${
          isCollapsed ? 'px-2 py-1 space-y-1' : 'px-3 space-y-1'
        }`}>

          {/* ------------------------------------------------------- */}
          {/* A) COLLAPSED MINI-VIEW (Rich Hover Card Popovers)       */}
          {/* ------------------------------------------------------- */}
          {isCollapsed ? (
            <div className="space-y-1.5">
              {/* Expand helper button */}
              <button
                type="button"
                onClick={toggleSidebarCollapse}
                title="Expand Navigation (Ctrl+[)"
                className="w-10 h-7 mx-auto rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <ChevronRight size={14} />
              </button>

              <div className="w-6 h-px bg-slate-200 mx-auto my-1" />

              {/* Render Pipeline items when collapsed */}
              {SOLAR_PIPELINE_STAGES.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`);

                return (
                  <div key={item.name} className="relative group/mini flex justify-center">
                    <Link
                      href={item.path}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 relative ${
                        isActive 
                          ? 'bg-slate-900 text-white shadow-sm ring-1 ring-slate-900 font-bold' 
                          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                      {item.pulse && (
                        <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white animate-pulse" />
                      )}
                    </Link>

                    {/* Rich Floating Popover Card */}
                    <div className="fixed left-20 ml-2 px-3.5 py-2.5 bg-slate-900 text-white rounded-xl shadow-2xl opacity-0 group-hover/mini:opacity-100 pointer-events-none transition-all duration-150 z-50 whitespace-nowrap min-w-[190px] border border-slate-700">
                      <div className="flex items-center justify-between gap-3 mb-0.5">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          <Icon size={13} className="text-blue-400" />
                          {item.name}
                        </span>
                        <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 bg-white/20 rounded text-slate-200">
                          {item.badge}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-300 font-medium">
                        {item.description}
                      </p>
                    </div>
                  </div>
                );
              })}

              <div className="w-6 h-px bg-slate-200 mx-auto my-1.5" />

              {/* Key Management shortcut icons */}
              {[
                { name: 'Inventory', icon: Package, path: '/tenant/inventory' },
                { name: 'Finance & Invoices', icon: Receipt, path: '/tenant/finance' },
                { name: 'Documents & KYC', icon: FileBox, path: '/tenant/documents' },
                { name: 'Staff & Team', icon: UserPlus, path: '/tenant/staff' },
                { name: 'Analytics', icon: BarChart2, path: '/tenant/reports' },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`);

                return (
                  <div key={item.name} className="relative group/mini flex justify-center">
                    <Link
                      href={item.path}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 relative ${
                        isActive 
                          ? 'bg-slate-900 text-white shadow-sm ring-1 ring-slate-900' 
                          : 'text-slate-400 hover:bg-slate-100 hover:text-slate-800'
                      }`}
                    >
                      <Icon size={17} strokeWidth={2} />
                    </Link>

                    <div className="fixed left-20 ml-2 px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-xl shadow-2xl opacity-0 group-hover/mini:opacity-100 pointer-events-none transition-all duration-150 z-50 whitespace-nowrap border border-slate-700">
                      {item.name}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}

          {/* ------------------------------------------------------- */}
          {/* B) PIPELINE FLOW VIEW (RECOMMENDED ACTIVE EPC WORKFLOW)  */}
          {/* ------------------------------------------------------- */}
          {!isCollapsed && !searchQuery && sidebarMode === 'pipeline' && (
            <div className="space-y-1.5 pt-1">
              {/* Dashboard anchor */}
              <Link
                href="/tenant/dashboard"
                onClick={() => { if (isMobile) setMobileMenuOpen(false); }}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all group ${
                  pathname === '/tenant/dashboard'
                    ? 'bg-slate-900 text-white shadow-sm ring-1 ring-slate-900'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <LayoutDashboard 
                    size={17} 
                    className={pathname === '/tenant/dashboard' ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-700'} 
                  />
                  <span>Executive Dashboard</span>
                </div>
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                  pathname === '/tenant/dashboard' ? 'bg-white/20 text-white' : 'text-slate-400 bg-slate-100'
                }`}>
                  Live
                </span>
              </Link>

              <div className="pt-2 pb-1 px-2 flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                  <Flame size={12} className="text-amber-500" />
                  EPC Golden Lifecycle
                </span>
                <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded-full border border-blue-200">
                  6 Stages
                </span>
              </div>

              {/* Chronological Pipeline Stages */}
              <div className="space-y-1 relative pl-2 before:absolute before:left-5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200/80">
                {SOLAR_PIPELINE_STAGES.map((stage) => {
                  const Icon = stage.icon;
                  const isActive = pathname === stage.path || pathname.startsWith(`${stage.path}/`);

                  return (
                    <Link
                      key={stage.path}
                      href={stage.path}
                      onClick={() => { if (isMobile) setMobileMenuOpen(false); }}
                      className={`relative flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all duration-150 group cursor-pointer ${
                        isActive
                          ? 'bg-blue-50/90 text-blue-900 font-bold shadow-xs border-l-4 border-blue-600 -translate-x-1'
                          : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-mono font-bold transition-colors ${
                          isActive 
                            ? 'bg-blue-600 text-white shadow-xs' 
                            : 'bg-white text-slate-500 border border-slate-200 group-hover:border-slate-300'
                        }`}>
                          {stage.stage}
                        </div>
                        <div className="truncate">
                          <p className="truncate leading-tight">{stage.name}</p>
                          <span className="text-[10px] text-slate-400 font-normal truncate block">
                            {stage.category}
                          </span>
                        </div>
                      </div>

                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border shrink-0 uppercase tracking-wider ${stage.badgeColor}`}>
                        {stage.badge}
                      </span>
                    </Link>
                  );
                })}
              </div>

              {/* Essential Operations Shortcuts */}
              <div className="pt-3 pb-1 px-2 flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                  Execution Hub
                </span>
                <button
                  type="button"
                  onClick={() => handleModeChange('all')}
                  className="text-[10px] font-bold text-blue-600 hover:text-blue-800 transition-colors"
                >
                  View All (23) →
                </button>
              </div>

              <div className="space-y-0.5">
                {[
                  { name: 'Finance & Invoices', icon: Receipt, path: '/tenant/finance' },
                  { name: 'Inventory & Materials', icon: Package, path: '/tenant/inventory' },
                  { name: 'Documents & KYC Vault', icon: FileBox, path: '/tenant/documents' },
                  { name: 'Service Tickets & AMC', icon: ShieldCheck, path: '/tenant/service' },
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`);

                  return (
                    <Link
                      key={item.path}
                      href={item.path}
                      onClick={() => { if (isMobile) setMobileMenuOpen(false); }}
                      className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-slate-100 text-slate-900 font-bold'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <Icon size={15} className={isActive ? 'text-blue-600' : 'text-slate-400'} />
                      <span className="truncate">{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* ------------------------------------------------------- */}
          {/* C) ALL MODULES VIEW (OR FILTERED SEARCH RESULTS)        */}
          {/* ------------------------------------------------------- */}
          {!isCollapsed && (searchQuery || sidebarMode === 'all') && (
            <div className="space-y-3 pt-1">
              {MENU_GROUPS.map((group, groupIdx) => {
                const filteredItems = searchQuery
                  ? group.items.filter(item => 
                      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      group.title.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                  : group.items;

                if (filteredItems.length === 0) return null;

                const isOpen = searchQuery ? true : openGroups[group.title];

                return (
                  <div key={groupIdx} className="space-y-1">
                    {/* Category Accordion Header */}
                    <button
                      type="button"
                      onClick={() => toggleGroup(group.title)}
                      className="w-full flex items-center justify-between px-2.5 py-1 text-left rounded-lg hover:bg-slate-50 transition-colors group cursor-pointer"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          group.title.includes('CORE') ? 'bg-blue-500' :
                          group.title.includes('OPERATIONS') ? 'bg-amber-500' :
                          group.title.includes('FINANCE') ? 'bg-emerald-500' :
                          group.title.includes('CUSTOMER') ? 'bg-purple-500' :
                          group.title.includes('TEAM') ? 'bg-teal-500' : 'bg-slate-400'
                        }`} />
                        <span className="text-[10px] font-extrabold text-slate-400 group-hover:text-slate-700 uppercase tracking-widest transition-colors truncate">
                          {group.title}
                        </span>
                      </div>

                      {!searchQuery && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] text-slate-400 font-mono">
                            {filteredItems.length}
                          </span>
                          <ChevronDown 
                            size={12} 
                            className={`text-slate-400 group-hover:text-slate-600 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
                          />
                        </div>
                      )}
                    </button>

                    {/* Group Items */}
                    <div className={`overflow-hidden transition-all duration-200 ${
                      isOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
                    }`}>
                      <div className="space-y-0.5 px-0.5">
                        {filteredItems.map((item) => {
                          const Icon = item.icon;
                          const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`);

                          return (
                            <Link
                              key={item.name}
                              href={item.path}
                              onClick={() => { if (isMobile) setMobileMenuOpen(false); }}
                              className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 group relative ${
                                isActive 
                                  ? 'text-blue-900 bg-blue-50/90 shadow-xs border-l-4 border-blue-600 font-bold' 
                                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <Icon 
                                  size={16} 
                                  className={isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600 transition-colors'} 
                                  strokeWidth={isActive ? 2.5 : 2} 
                                />
                                <span className="truncate">{item.name}</span>
                              </div>

                              {item.badge && (
                                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border uppercase tracking-wider shrink-0 ${item.badgeStyle}`}>
                                  {item.badge}
                                </span>
                              )}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* No results message */}
              {searchQuery && MENU_GROUPS.every(g => !g.items.some(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()))) && (
                <div className="py-8 px-4 text-center">
                  <Search size={24} className="mx-auto text-slate-300 mb-2" />
                  <p className="text-xs font-bold text-slate-700">No matching module</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Try searching for "Leads", "Subsidy", or "Projects"</p>
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="mt-3 text-xs font-bold text-blue-600 hover:underline"
                  >
                    Clear Filter
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* 6. PM SURYA GHAR LIVE NODE CHIP                          */}
        {/* ========================================================= */}
        {!isCollapsed && (
          <div className="px-3 pb-2 shrink-0">
            <Link
              href="/tenant/subsidy"
              onClick={() => { if (isMobile) setMobileMenuOpen(false); }}
              className="block p-2 rounded-xl bg-gradient-to-r from-amber-50/80 to-emerald-50/80 border border-amber-200/70 hover:border-amber-300 transition-all shadow-2xs group cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-extrabold text-slate-900 tracking-tight">
                    PM Surya Ghar Portal
                  </span>
                </div>
                <span className="text-[9px] font-bold text-emerald-800 bg-white px-1.5 py-0.2 rounded border border-emerald-200 shadow-2xs">
                  MNRE Live
                </span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1 truncate group-hover:text-slate-800 transition-colors">
                Instant DISCOM &amp; subsidy claims workflow
              </p>
            </Link>
          </div>
        )}

        {/* ========================================================= */}
        {/* 7. BOTTOM USER IDENTITY & QUICK ACCOUNT SWITCHER         */}
        {/* ========================================================= */}
        <div className={`border-t border-slate-100 bg-slate-50/60 shrink-0 relative ${
          isCollapsed ? 'p-2 flex flex-col items-center gap-1.5' : 'p-3'
        }`}>
          {isCollapsed ? (
            <>
              {/* Collapsed profile trigger */}
              <button
                type="button"
                onClick={() => setUserProfileMenuOpen(prev => !prev)}
                title="Account Settings"
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-bold text-xs flex items-center justify-center shadow-xs hover:scale-105 transition-transform cursor-pointer relative"
              >
                {getInitials(currentUser?.name)}
              </button>

              <button 
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                title="Sign Out"
                className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
              >
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <div className="relative">
              {/* Expanded User Profile Card */}
              <div className="flex items-center justify-between gap-2 p-1.5 rounded-xl hover:bg-white transition-all border border-transparent hover:border-slate-200/80 group">
                <Link
                  href="/tenant/settings"
                  onClick={() => { if (isMobile) setMobileMenuOpen(false); }}
                  className="flex items-center gap-2.5 min-w-0 flex-1"
                >
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0 ring-2 ring-white">
                    {getInitials(currentUser?.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 truncate tracking-tight group-hover:text-blue-600 transition-colors">
                      {currentUser?.name || 'Solar Partner'}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate font-medium">
                      {currentUser?.role || 'Admin'} • {currentUser?.tenantName ? currentUser.tenantName.split(' ')[0] : 'Workspace'}
                    </p>
                  </div>
                </Link>

                <div className="flex items-center gap-1">
                  <Link
                    href="/tenant/settings"
                    title="Settings"
                    onClick={() => { if (isMobile) setMobileMenuOpen(false); }}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <Settings size={15} />
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={loggingOut}
                    title="Sign Out"
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <LogOut size={15} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row font-sans selection:bg-blue-100 selection:text-blue-900 w-full overflow-x-hidden">
      
      {/* MOBILE TOPBAR (< lg) */}
      <header className="lg:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center shadow-2xs">
            <Image 
              src="/images/whereready_logo.png" 
              alt="WhereReady Solar OS" 
              width={24} 
              height={24} 
              className="object-contain" 
            />
          </div>
          <div>
            <h1 className="font-extrabold text-slate-900 text-sm tracking-tight leading-none">
              WhereReady
            </h1>
            <p className="text-[9px] font-bold text-blue-600 uppercase tracking-widest mt-0.5">
              SOLAR OS • Workspace
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setMobileMenuOpen(prev => !prev)}
          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* MOBILE DRAWER BACKDROP */}
      {mobileMenuOpen && (
        <div 
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* MOBILE DRAWER */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-[290px] bg-white border-r border-slate-200 flex flex-col shadow-2xl transition-transform duration-300 lg:hidden ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {renderSidebarContent(true)}
      </aside>

      {/* DESKTOP SIDEBAR (lg+) */}
      <aside className={`h-screen sticky top-0 bg-white border-r border-slate-200/80 hidden lg:flex flex-col shrink-0 z-30 shadow-xs transition-all duration-300 ease-in-out ${
        sidebarCollapsed ? 'w-[76px]' : 'w-[280px]'
      }`}>
        {renderSidebarContent(false)}
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-h-screen min-w-0 w-full relative bg-white overflow-x-hidden">
        {/* Engineering 32px Square Grid Background */}
        <div 
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(15, 23, 42, 0.035) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(15, 23, 42, 0.035) 1px, transparent 1px)
            `,
            backgroundSize: '32px 32px',
          }}
        />
        <div className="relative p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full min-w-0">
          {children}
        </div>
      </main>
    </div>
  );
}
