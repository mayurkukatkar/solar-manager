"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import axios from 'axios';
import { 
  LayoutDashboard, Users, Briefcase, Settings, LogOut, ChevronLeft, 
  ChevronDown, ChevronRight, Search, Users2, MapPin, FileText, HardHat, 
  Package, Truck, Receipt, Banknote, Landmark, FileBox, Wrench, ShieldCheck, 
  MessageSquare, UserPlus, Shield, BarChart2, Zap, Bell, History, Menu, 
  X, CheckSquare, Layers, Sparkles
} from 'lucide-react';

interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
  badge?: string;
  badgeColor?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

// ========================================================
// ALL 25 COMPLETE SOLAR ERP MODULES (ORGANIZED & ZERO CLUTTER)
// ========================================================
const NAV_SECTIONS: NavSection[] = [
  {
    title: 'SALES & CRM',
    items: [
      { name: 'Dashboard', path: '/tenant/dashboard', icon: LayoutDashboard },
      { name: 'Leads & Funnel', path: '/tenant/leads', icon: Users },
      { name: 'CRM Pipeline', path: '/tenant/crm', icon: Users2 },
      { name: 'Site Surveys', path: '/tenant/surveys', icon: MapPin },
      { name: 'Quotations & BOM', path: '/tenant/quotations', icon: FileText },
      { name: 'Solar Loans', path: '/tenant/loans', icon: Banknote },
    ]
  },
  {
    title: 'OPERATIONS & SUPPLY',
    items: [
      { name: 'Solar Projects', path: '/tenant/projects', icon: Briefcase },
      { name: 'Tasks & Milestones', path: '/tenant/tasks', icon: CheckSquare },
      { name: 'Field Installation', path: '/tenant/installation', icon: HardHat },
      { name: 'Inventory & Stock', path: '/tenant/inventory', icon: Package },
      { name: 'Product Catalogue', path: '/tenant/products', icon: Layers },
      { name: 'Procurement & Vendors', path: '/tenant/procurement', icon: Truck },
    ]
  },
  {
    title: 'FINANCE & SCHEMES',
    items: [
      { name: 'Billing & Invoices', path: '/tenant/finance', icon: Receipt },
      { 
        name: 'PM Surya Ghar Portal', 
        path: '/tenant/subsidy', 
        icon: Landmark,
        badge: 'MNRE',
        badgeColor: 'bg-amber-400/20 text-amber-300 border-amber-400/30'
      },
    ]
  },
  {
    title: 'CUSTOMER CARE & AMC',
    items: [
      { name: 'Documents & KYC', path: '/tenant/documents', icon: FileBox },
      { name: 'Service & Tickets', path: '/tenant/service', icon: Wrench },
      { name: 'AMC & Warranty', path: '/tenant/amc', icon: ShieldCheck },
      { name: 'WhatsApp & Messages', path: '/tenant/communication', icon: MessageSquare },
    ]
  },
  {
    title: 'MANAGEMENT & SYSTEM',
    items: [
      { name: 'Staff & Technicians', path: '/tenant/staff', icon: UserPlus },
      { name: 'Users & Permissions', path: '/tenant/users', icon: Shield },
      { name: 'Reports & Analytics', path: '/tenant/reports', icon: BarChart2 },
      { name: 'Automation', path: '/tenant/automation', icon: Zap },
      { name: 'Notifications', path: '/tenant/notifications', icon: Bell },
      { name: 'Company Settings', path: '/tenant/settings', icon: Settings },
      { name: 'Audit Trail Logs', path: '/tenant/audit-logs', icon: History },
    ]
  }
];

export default function TenantLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  
  const [loggingOut, setLoggingOut] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  
  const [currentUser, setCurrentUser] = useState<{
    name: string;
    email: string;
    role: string;
    tenantName: string;
  } | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load saved sidebar state
  useEffect(() => {
    try {
      const saved = localStorage.getItem('solar_sidebar_collapsed');
      if (saved !== null) {
        setSidebarCollapsed(saved === 'true');
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

  const toggleSection = (title: string) => {
    setCollapsedSections(prev => ({ ...prev, [title]: !prev[title] }));
  };

  // Keyboard shortcut listener: Ctrl+K / Cmd+K / Slash focuses search input
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
      } else if (e.key === 'Escape' && searchQuery) {
        setSearchQuery('');
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
              name: res.data.user.name || 'Solar Partner',
              email: res.data.user.email || '',
              role: res.data.user.role || 'Admin',
              tenantName: res.data.user.tenant?.name || 'Workspace',
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

  // Close mobile drawer on route change
  useEffect(() => {
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

  const getInitials = (name?: string) => {
    if (!name) return 'SP';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Render Sidebar
  const renderSidebarContent = (isMobile = false) => {
    const isCollapsed = !isMobile && sidebarCollapsed;

    return (
      <div className="flex flex-col h-full bg-[#071A2B] text-slate-300 select-none border-r border-[#0D2847] relative">
        
        {/* ======================================================== */}
        {/* 1. BRAND HEADER                                          */}
        {/* ======================================================== */}
        <div className={`h-16 flex items-center border-b border-white/10 shrink-0 px-4 transition-all ${
          isCollapsed ? 'justify-center' : 'justify-between'
        }`}>
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={isCollapsed ? toggleSidebarCollapse : undefined}
              title={isCollapsed ? "Click to expand" : "WhereReady Solar OS"}
              className={`w-9 h-9 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0 p-1.5 shadow-sm transition-all ${
                isCollapsed ? 'cursor-pointer hover:bg-white/20 hover:scale-105' : ''
              }`}
            >
              <Image
                src="/images/whereready_logo.png"
                alt="WhereReady Logo"
                width={24}
                height={24}
                className="object-contain"
                priority
              />
            </button>

            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h1 className="text-sm font-extrabold text-white tracking-tight leading-none truncate font-['Plus_Jakarta_Sans',sans-serif]">
                    WhereReady
                  </h1>
                  <span className="text-[9px] font-black px-1.5 py-0.2 bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 rounded tracking-wider uppercase">
                    Solar OS
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium tracking-tight mt-1 truncate">
                  {currentUser?.tenantName ? currentUser.tenantName : 'Enterprise Workspace'}
                </p>
              </div>
            )}
          </div>

          {/* TOGGLE / COLLAPSE BUTTON */}
          {isMobile ? (
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition cursor-pointer"
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
          ) : !isCollapsed ? (
            <button
              type="button"
              onClick={toggleSidebarCollapse}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition cursor-pointer"
              title="Collapse sidebar (Ctrl+K)"
            >
              <ChevronLeft size={16} />
            </button>
          ) : null}
        </div>

        {/* ======================================================== */}
        {/* 2. REAL-TIME SEARCH FOR ALL 25 MODULES                   */}
        {/* ======================================================== */}
        {!isCollapsed ? (
          <div className="px-3 pt-3 pb-2 shrink-0">
            <div className="relative group">
              <Search 
                size={14} 
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-cyan-400 transition-colors pointer-events-none" 
              />
              <input 
                ref={searchInputRef}
                type="text" 
                placeholder="Quick jump (25 modules)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#0D243A]/90 border border-white/10 text-xs text-white rounded-xl py-2 pl-8 pr-12 focus:outline-none focus:ring-1 focus:ring-cyan-400/50 focus:border-cyan-400 transition-all font-medium placeholder:text-slate-400"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5 rounded cursor-pointer"
                  title="Clear search"
                >
                  <X size={13} />
                </button>
              ) : (
                <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] font-mono font-bold text-slate-400 bg-white/10 border border-white/10 rounded px-1.5 py-0.5 pointer-events-none">
                  ⌘K
                </kbd>
              )}
            </div>
          </div>
        ) : (
          <div className="py-2 flex justify-center shrink-0">
            <button
              type="button"
              onClick={toggleSidebarCollapse}
              title="Search modules (Click to expand)"
              className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
            >
              <Search size={16} />
            </button>
          </div>
        )}

        {/* ======================================================== */}
        {/* 3. SCROLLABLE NAVIGATION LIST (CLEAN, SPACIOUS, BEAUTIFUL) */}
        {/* ======================================================== */}
        <div className={`flex-1 overflow-y-auto custom-scrollbar py-2 space-y-4 ${
          isCollapsed ? 'px-2 space-y-2' : 'px-3'
        }`}>
          {NAV_SECTIONS.map((section, sIdx) => {
            const filteredItems = searchQuery
              ? section.items.filter(item => 
                  item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  section.title.toLowerCase().includes(searchQuery.toLowerCase())
                )
              : section.items;

            if (filteredItems.length === 0) return null;

            const isSectionCollapsed = !searchQuery && collapsedSections[section.title];

            return (
              <div key={sIdx} className="space-y-1">
                {/* Section Header */}
                {!isCollapsed ? (
                  <button
                    type="button"
                    onClick={() => toggleSection(section.title)}
                    className="w-full flex items-center justify-between px-2.5 py-1 text-left group cursor-pointer"
                  >
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-slate-200 transition-colors">
                      {section.title}
                    </span>
                    {!searchQuery && (
                      <div className="flex items-center gap-1.5 text-slate-500 group-hover:text-slate-300 transition-colors">
                        <span className="text-[9px] font-mono">{filteredItems.length}</span>
                        <ChevronDown 
                          size={12} 
                          className={`transition-transform duration-200 ${isSectionCollapsed ? '-rotate-90' : ''}`} 
                        />
                      </div>
                    )}
                  </button>
                ) : (
                  <div className="w-6 h-px bg-white/10 mx-auto my-2" />
                )}

                {/* Section Items */}
                <div className={`space-y-0.5 overflow-hidden transition-all duration-200 ${
                  isSectionCollapsed ? 'max-h-0 opacity-0' : 'max-h-screen opacity-100'
                }`}>
                  {filteredItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`);

                    if (isCollapsed) {
                      return (
                        <div key={item.name} className="relative group flex justify-center">
                          <Link
                            href={item.path}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                              isActive
                                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20'
                                : 'text-slate-400 hover:bg-white/10 hover:text-white'
                            }`}
                          >
                            <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                          </Link>

                          {/* Floating Tooltip */}
                          <div className="fixed left-20 ml-2 px-3 py-1.5 bg-[#0F2D4A] text-white text-xs font-semibold rounded-lg shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-150 z-50 whitespace-nowrap border border-white/10">
                            {item.name}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <Link
                        key={item.name}
                        href={item.path}
                        onClick={() => { if (isMobile) setMobileMenuOpen(false); }}
                        className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all group ${
                          isActive
                            ? 'bg-gradient-to-r from-cyan-500/20 via-blue-600/20 to-transparent text-white font-semibold border-l-2 border-cyan-400 shadow-2xs'
                            : 'text-slate-300 hover:bg-white/8 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon 
                            size={16} 
                            className={`shrink-0 transition-colors ${
                              isActive 
                                ? 'text-cyan-400' 
                                : 'text-slate-400 group-hover:text-slate-200'
                            }`}
                            strokeWidth={isActive ? 2.25 : 2}
                          />
                          <span className="truncate">{item.name}</span>
                        </div>

                        {item.badge && (
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border uppercase tracking-wider shrink-0 ${
                            item.badgeColor || 'bg-white/10 text-slate-300 border-white/15'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Empty search state */}
          {searchQuery && NAV_SECTIONS.every(s => !s.items.some(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()))) && (
            <div className="py-8 px-4 text-center">
              <Search size={22} className="mx-auto text-slate-500 mb-2" />
              <p className="text-xs font-semibold text-slate-300">No matching module</p>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="mt-2 text-xs font-bold text-cyan-400 hover:underline cursor-pointer"
              >
                Clear filter
              </button>
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* 4. USER PROFILE & LOGOUT                                 */}
        {/* ======================================================== */}
        <div className={`border-t border-white/10 bg-[#051422] shrink-0 ${
          isCollapsed ? 'p-2 flex flex-col items-center gap-2' : 'p-3'
        }`}>
          {isCollapsed ? (
            <>
              <button
                type="button"
                onClick={toggleSidebarCollapse}
                title="Expand sidebar"
                className="w-10 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-white/10 hover:text-white transition cursor-pointer"
              >
                <ChevronRight size={14} />
              </button>

              <div 
                title={currentUser?.name || "User Profile"}
                className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white text-xs font-bold flex items-center justify-center shadow-xs ring-1 ring-white/20"
              >
                {getInitials(currentUser?.name)}
              </div>

              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                title="Sign Out"
                className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:bg-red-500/20 hover:text-red-400 transition cursor-pointer"
              >
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <div className="flex items-center justify-between gap-2.5 p-1.5 rounded-xl hover:bg-white/5 transition border border-transparent hover:border-white/10">
              <Link
                href="/tenant/settings"
                onClick={() => { if (isMobile) setMobileMenuOpen(false); }}
                className="flex items-center gap-2.5 min-w-0 flex-1 group"
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0 shadow-xs ring-1 ring-white/20 group-hover:scale-105 transition-transform">
                  {getInitials(currentUser?.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-white truncate leading-tight group-hover:text-cyan-400 transition-colors">
                    {currentUser?.name || 'Solar Partner'}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate font-medium mt-0.5">
                    {currentUser?.role || 'Admin'} • {currentUser?.tenantName ? currentUser.tenantName.split(' ')[0] : 'Workspace'}
                  </p>
                </div>
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                title="Sign Out"
                className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition cursor-pointer"
              >
                <LogOut size={15} />
              </button>
            </div>
          )}
        </div>

      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row font-sans selection:bg-blue-100 selection:text-blue-900 w-full overflow-x-hidden">
      
      {/* MOBILE TOPBAR (< lg) */}
      <header className="lg:hidden sticky top-0 z-40 bg-[#071A2B] text-white border-b border-[#0D2847] px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/20 p-1 flex items-center justify-center shadow-2xs">
            <Image 
              src="/images/whereready_logo.png" 
              alt="WhereReady Solar OS" 
              width={22} 
              height={22} 
              className="object-contain" 
            />
          </div>
          <div>
            <h1 className="font-extrabold text-white text-sm tracking-tight leading-none">
              WhereReady
            </h1>
            <p className="text-[9px] font-bold text-cyan-400 uppercase tracking-widest mt-0.5">
              SOLAR OS • Workspace
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setMobileMenuOpen(prev => !prev)}
          className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* MOBILE DRAWER BACKDROP */}
      {mobileMenuOpen && (
        <div 
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* MOBILE DRAWER */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#071A2B] border-r border-[#0D2847] flex flex-col shadow-2xl transition-transform duration-300 lg:hidden ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {renderSidebarContent(true)}
      </aside>

      {/* DESKTOP SIDEBAR (lg+) */}
      <aside className={`h-screen sticky top-0 bg-[#071A2B] border-r border-[#0D2847] hidden lg:flex flex-col shrink-0 z-30 shadow-lg transition-all duration-300 ease-in-out ${
        sidebarCollapsed ? 'w-[70px]' : 'w-72'
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
