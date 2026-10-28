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
  X, CheckSquare, Layers
} from 'lucide-react';

interface MenuItem {
  name: string;
  icon: React.ElementType;
  path: string;
  badge?: string;
}

interface MenuGroup {
  title: string;
  items: MenuItem[];
}

// ALL 25 COMPLETE SOLAR ERP MODULES ORGANIZED BY OPERATIONAL DOMAIN
const MENU_GROUPS: MenuGroup[] = [
  {
    title: 'CORE PIPELINE',
    items: [
      { name: 'Dashboard', icon: LayoutDashboard, path: '/tenant/dashboard' },
      { name: 'Leads', icon: Users, path: '/tenant/leads' },
      { name: 'CRM Pipeline', icon: Users2, path: '/tenant/crm' },
      { name: 'Site Surveys', icon: MapPin, path: '/tenant/surveys' },
      { name: 'Quotations', icon: FileText, path: '/tenant/quotations' },
      { name: 'Projects', icon: Briefcase, path: '/tenant/projects' },
    ]
  },
  {
    title: 'OPERATIONS',
    items: [
      { name: 'Tasks & Milestones', icon: CheckSquare, path: '/tenant/tasks' },
      { name: 'Installation', icon: HardHat, path: '/tenant/installation' },
      { name: 'Inventory', icon: Package, path: '/tenant/inventory' },
      { name: 'Product Catalogue', icon: Layers, path: '/tenant/products' },
      { name: 'Procurement & Vendors', icon: Truck, path: '/tenant/procurement' },
    ]
  },
  {
    title: 'FINANCE & SCHEMES',
    items: [
      { name: 'Finance & Billing', icon: Receipt, path: '/tenant/finance' },
      { 
        name: 'PM Surya Ghar Portal', 
        icon: Landmark, 
        path: '/tenant/subsidy',
        badge: 'National'
      },
      { name: 'Solar Loans', icon: Banknote, path: '/tenant/loans' },
    ]
  },
  {
    title: 'CUSTOMER CARE',
    items: [
      { name: 'Documents & KYC', icon: FileBox, path: '/tenant/documents' },
      { name: 'Service & Tickets', icon: Wrench, path: '/tenant/service' },
      { name: 'AMC & Warranty', icon: ShieldCheck, path: '/tenant/amc' },
      { name: 'Communication', icon: MessageSquare, path: '/tenant/communication' },
    ]
  },
  {
    title: 'MANAGEMENT',
    items: [
      { name: 'Staff & Technicians', icon: UserPlus, path: '/tenant/staff' },
      { name: 'Users & Permissions', icon: Shield, path: '/tenant/users' },
      { name: 'Reports & Analytics', icon: BarChart2, path: '/tenant/reports' },
      { name: 'Automation', icon: Zap, path: '/tenant/automation' },
    ]
  },
  {
    title: 'SYSTEM',
    items: [
      { name: 'Notifications', icon: Bell, path: '/tenant/notifications' },
      { name: 'Settings', icon: Settings, path: '/tenant/settings' },
      { name: 'Audit Logs', icon: History, path: '/tenant/audit-logs' },
    ]
  }
];

export default function TenantLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  
  const [loggingOut, setLoggingOut] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
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

  // Keyboard shortcut listener: Ctrl+K / Cmd+K / Slash focuses search; Esc clears
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

  // Auto-expand group containing current active path
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
      <div className="flex flex-col h-full bg-white text-slate-800 select-none border-r border-slate-200">
        
        {/* LOGO HEADER */}
        <div className={`h-16 flex items-center border-b border-slate-100 shrink-0 ${
          isCollapsed ? 'justify-center px-2' : 'justify-between px-5'
        }`}>
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={isCollapsed ? toggleSidebarCollapse : undefined}
              title={isCollapsed ? "Click to expand sidebar" : "WhereReady Solar OS"}
              className={`w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 p-1 shadow-2xs ${
                isCollapsed ? 'cursor-pointer hover:border-blue-400 hover:scale-105 transition-all' : ''
              }`}
            >
              <Image
                src="/images/whereready_logo.png"
                alt="WhereReady Logo"
                width={26}
                height={26}
                className="object-contain"
                priority
              />
            </button>

            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <h1 className="text-sm font-extrabold text-slate-900 tracking-tight leading-none truncate">
                  WhereReady
                </h1>
                <p className="text-[10px] text-blue-600 font-bold tracking-wider uppercase mt-1 truncate">
                  SOLAR OS • {currentUser?.tenantName ? currentUser.tenantName : 'Workspace'}
                </p>
              </div>
            )}
          </div>

          {/* COLLAPSE / CLOSE BUTTON */}
          {isMobile ? (
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
          ) : !isCollapsed ? (
            <button
              type="button"
              onClick={toggleSidebarCollapse}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
              title="Collapse sidebar"
            >
              <ChevronLeft size={16} />
            </button>
          ) : null}
        </div>

        {/* QUICK SEARCH WITH KEYBOARD SHORTCUT */}
        {!isCollapsed ? (
          <div className="px-4 pt-3 pb-2 shrink-0">
            <div className="relative group">
              <Search 
                size={14} 
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors pointer-events-none" 
              />
              <input 
                ref={searchInputRef}
                type="text" 
                placeholder="Search modules..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-xs text-slate-800 rounded-xl py-2 pl-8 pr-12 focus:bg-white focus:border-slate-300 focus:ring-4 focus:ring-slate-100 focus:outline-none transition-all font-medium placeholder:text-slate-400"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-0.5 rounded cursor-pointer"
                  title="Clear search"
                >
                  <X size={13} />
                </button>
              ) : (
                <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] font-mono font-bold text-slate-400 bg-white border border-slate-200 rounded px-1.5 py-0.5 pointer-events-none">
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
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              <Search size={16} />
            </button>
          </div>
        )}

        {/* MENU NAVIGATION (ALL 25 MODULES ORGANIZED IN GROUPS) */}
        <div className={`flex-1 overflow-y-auto custom-scrollbar py-2 space-y-4 ${
          isCollapsed ? 'px-2 space-y-2' : 'px-3'
        }`}>
          {MENU_GROUPS.map((group, groupIdx) => {
            const filteredItems = searchQuery
              ? group.items.filter(item => 
                  item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  group.title.toLowerCase().includes(searchQuery.toLowerCase())
                )
              : group.items;

            if (filteredItems.length === 0) return null;

            const isOpen = searchQuery ? true : (openGroups[group.title] ?? true);

            return (
              <div key={groupIdx} className="space-y-1">
                {/* Section Header */}
                {!isCollapsed ? (
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.title)}
                    className="w-full flex items-center justify-between px-2.5 py-1 text-left rounded-lg hover:text-slate-900 transition-colors group cursor-pointer"
                  >
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider group-hover:text-slate-600 transition-colors">
                      {group.title}
                    </span>
                    {!searchQuery && (
                      <div className="flex items-center gap-1.5 text-slate-300 group-hover:text-slate-500 transition-colors">
                        <span className="text-[10px] font-medium">{filteredItems.length}</span>
                        {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </div>
                    )}
                  </button>
                ) : (
                  <div className="w-6 h-px bg-slate-100 mx-auto my-2" />
                )}

                {/* Section Items */}
                <div className={`space-y-0.5 overflow-hidden transition-all duration-200 ${
                  isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
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
                                ? 'bg-slate-900 text-white font-semibold shadow-md'
                                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                            }`}
                          >
                            <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                          </Link>

                          {/* Tooltip */}
                          <div className="fixed left-16 ml-3 px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-150 z-50 whitespace-nowrap">
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
                        className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                          isActive
                            ? 'bg-slate-900 text-white font-semibold shadow-sm'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Icon 
                            size={16} 
                            className={isActive ? 'text-white' : 'text-slate-400 shrink-0'} 
                            strokeWidth={isActive ? 2.25 : 2}
                          />
                          <span className="truncate">{item.name}</span>
                        </div>

                        {item.badge && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
                            isActive 
                              ? 'bg-blue-500 text-white' 
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
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
          {searchQuery && MENU_GROUPS.every(g => !g.items.some(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()))) && (
            <div className="py-8 px-4 text-center">
              <Search size={22} className="mx-auto text-slate-300 mb-2" />
              <p className="text-xs font-semibold text-slate-700">No matching module</p>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="mt-2 text-xs font-bold text-blue-600 hover:underline cursor-pointer"
              >
                Clear filter
              </button>
            </div>
          )}
        </div>

        {/* BOTTOM USER PROFILE */}
        <div className={`p-4 border-t border-slate-100 bg-white shrink-0 ${
          isCollapsed ? 'flex flex-col items-center gap-2' : ''
        }`}>
          {isCollapsed ? (
            <>
              <button
                type="button"
                onClick={toggleSidebarCollapse}
                title="Expand sidebar"
                className="w-10 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
              >
                <ChevronRight size={14} />
              </button>

              <div 
                title={currentUser?.name || "User Profile"}
                className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700 border border-slate-200 text-xs"
              >
                {getInitials(currentUser?.name)}
              </div>

              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                title="Sign Out"
                className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-600 transition cursor-pointer"
              >
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700 border border-slate-200 text-xs shrink-0">
                  {getInitials(currentUser?.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-900 truncate tracking-tight leading-tight">
                    {currentUser?.name || 'Solar Partner'}
                  </p>
                  <p className="text-xs text-slate-500 truncate font-medium mt-0.5">
                    {currentUser?.role || 'Admin'} • {currentUser?.tenantName ? currentUser.tenantName : 'Workspace'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <Link
                  href="/tenant/settings"
                  title="Settings"
                  onClick={() => { if (isMobile) setMobileMenuOpen(false); }}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                >
                  <Settings size={16} />
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  title="Sign Out"
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                >
                  <LogOut size={16} />
                </button>
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
      <header className="lg:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-xs">
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
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 flex flex-col shadow-2xl transition-transform duration-300 lg:hidden ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {renderSidebarContent(true)}
      </aside>

      {/* DESKTOP SIDEBAR (lg+) */}
      <aside className={`h-screen sticky top-0 bg-white text-slate-800 border-r border-slate-200 shadow-sm hidden lg:flex flex-col shrink-0 z-30 transition-all duration-300 ease-in-out ${
        sidebarCollapsed ? 'w-16' : 'w-72'
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
