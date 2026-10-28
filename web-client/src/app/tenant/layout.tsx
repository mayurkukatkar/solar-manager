"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import axios from 'axios';
import { 
  LayoutDashboard, Users, Briefcase, Settings, LogOut, ChevronLeft, 
  ChevronRight, MapPin, FileText, HardHat, Package, Truck, Receipt, 
  Landmark, FileBox, Wrench, UserPlus, BarChart2, Menu, X
} from 'lucide-react';

interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
  badge?: string;
  badgeStyle?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'SOLAR WORKFLOW',
    items: [
      { name: 'Dashboard', path: '/tenant/dashboard', icon: LayoutDashboard },
      { name: 'Leads', path: '/tenant/leads', icon: Users },
      { name: 'Site Surveys', path: '/tenant/surveys', icon: MapPin },
      { name: 'Quotations', path: '/tenant/quotations', icon: FileText },
      { name: 'Projects', path: '/tenant/projects', icon: Briefcase },
    ]
  },
  {
    title: 'OPERATIONS & FINANCE',
    items: [
      { name: 'Installation', path: '/tenant/installation', icon: HardHat },
      { name: 'Inventory', path: '/tenant/inventory', icon: Package },
      { name: 'Procurement', path: '/tenant/procurement', icon: Truck },
      { name: 'Billing & Invoices', path: '/tenant/finance', icon: Receipt },
      { 
        name: 'PM Surya Ghar', 
        path: '/tenant/subsidy', 
        icon: Landmark,
        badge: 'Scheme',
        badgeStyle: 'bg-amber-50 text-amber-800 border border-amber-200'
      },
    ]
  },
  {
    title: 'ORGANIZATION',
    items: [
      { name: 'Documents & KYC', path: '/tenant/documents', icon: FileBox },
      { name: 'Service & AMC', path: '/tenant/service', icon: Wrench },
      { name: 'Staff & Crew', path: '/tenant/staff', icon: UserPlus },
      { name: 'Reports & BI', path: '/tenant/reports', icon: BarChart2 },
      { name: 'Settings', path: '/tenant/settings', icon: Settings },
    ]
  }
];

export default function TenantLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  
  const [loggingOut, setLoggingOut] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  const [currentUser, setCurrentUser] = useState<{
    name: string;
    email: string;
    role: string;
    tenantName: string;
  } | null>(null);

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

  // Verify active tenant status & fetch user profile
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
              name: res.data.user.name || 'Solar EPC User',
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

  // Render Clean Sidebar
  const renderSidebarContent = (isMobile = false) => {
    const isCollapsed = !isMobile && sidebarCollapsed;

    return (
      <div className="flex flex-col h-full bg-white select-none border-r border-slate-200">
        
        {/* LOGO & BRAND */}
        <div className={`h-16 flex items-center border-b border-slate-100 shrink-0 ${
          isCollapsed ? 'justify-center px-2' : 'justify-between px-5'
        }`}>
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={isCollapsed ? toggleSidebarCollapse : undefined}
              title={isCollapsed ? "Click to expand sidebar" : "WhereReady Solar"}
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
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mt-1 truncate">
                  {currentUser?.tenantName ? currentUser.tenantName : 'Solar OS'}
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

        {/* NAVIGATION LIST (CLEAN, SPACIOUS & UNCONGESTED) */}
        <div className={`flex-1 overflow-y-auto custom-scrollbar py-4 space-y-6 ${
          isCollapsed ? 'px-2' : 'px-3'
        }`}>
          {NAV_SECTIONS.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              {/* Section Header */}
              {!isCollapsed ? (
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2">
                  {section.title}
                </div>
              ) : (
                <div className="w-6 h-px bg-slate-200 mx-auto my-2" />
              )}

              {/* Items */}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`);

                  if (isCollapsed) {
                    return (
                      <div key={item.name} className="relative group flex justify-center">
                        <Link
                          href={item.path}
                          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                            isActive
                              ? 'bg-slate-900 text-white shadow-sm'
                              : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                          }`}
                        >
                          <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                        </Link>

                        {/* Floating Tooltip */}
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
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all font-medium group ${
                        isActive
                          ? 'bg-slate-900 text-white font-semibold shadow-xs'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon 
                          size={17} 
                          className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600 transition-colors'} 
                          strokeWidth={isActive ? 2.25 : 2}
                        />
                        <span className="truncate">{item.name}</span>
                      </div>

                      {item.badge && (
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 ${
                          isActive 
                            ? 'bg-blue-500 text-white' 
                            : item.badgeStyle || 'bg-slate-100 text-slate-600'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* BOTTOM USER PROFILE & LOGOUT */}
        <div className={`border-t border-slate-100 bg-slate-50/50 shrink-0 ${
          isCollapsed ? 'p-2 flex flex-col items-center gap-2' : 'p-3'
        }`}>
          {isCollapsed ? (
            <>
              <button
                type="button"
                onClick={toggleSidebarCollapse}
                title="Expand sidebar"
                className="w-10 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition cursor-pointer"
              >
                <ChevronRight size={15} />
              </button>

              <div 
                title={currentUser?.name || "User Profile"}
                className="w-9 h-9 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center shadow-xs"
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
            <div className="flex items-center justify-between gap-3 p-1.5 rounded-xl hover:bg-white transition border border-transparent hover:border-slate-200/60">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="w-9 h-9 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center shrink-0 shadow-xs">
                  {getInitials(currentUser?.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900 truncate leading-tight">
                    {currentUser?.name || 'Solar Partner'}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate font-medium">
                    {currentUser?.role || 'Admin'}
                  </p>
                </div>
              </div>

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
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col shadow-2xl transition-transform duration-300 lg:hidden ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {renderSidebarContent(true)}
      </aside>

      {/* DESKTOP SIDEBAR (lg+) */}
      <aside className={`h-screen sticky top-0 bg-white border-r border-slate-200 hidden lg:flex flex-col shrink-0 z-30 shadow-xs transition-all duration-300 ease-in-out ${
        sidebarCollapsed ? 'w-16' : 'w-64'
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
