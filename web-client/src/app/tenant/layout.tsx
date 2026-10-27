"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import axios from 'axios';
import { 
  LayoutDashboard, Users, Briefcase, 
  Settings, LogOut, Sun, ChevronLeft, ChevronDown, ChevronRight, Search,
  CircleDollarSign,
  ActivitySquare,
  Users2, MapPin, FileText, HardHat, Package, Truck, Receipt, Banknote, Landmark,
    FileBox, Wrench, ShieldCheck, MessageSquare, UserPlus, Shield, BarChart2, Zap,
    Bell, History, Menu, X, Sparkles
  } from 'lucide-react';

  const MENU_GROUPS = [
    {
      title: 'CORE',
      items: [
        { name: 'Dashboard', icon: LayoutDashboard, path: '/tenant/dashboard' },
        { name: 'Leads', icon: Users, path: '/tenant/leads' },
        { name: 'CRM', icon: Users2, path: '/tenant/crm' },
        { name: 'Site Surveys', icon: MapPin, path: '/tenant/surveys' },
        { name: 'Quotations', icon: FileText, path: '/tenant/quotations' },
        { name: 'Projects', icon: Briefcase, path: '/tenant/projects' },
      ]
    },
    {
      title: 'OPERATIONS',
      items: [
        { name: 'Installation', icon: HardHat, path: '/tenant/installation' },
        { name: 'Inventory', icon: Package, path: '/tenant/inventory' },
        { name: 'Procurement & Vendors', icon: Truck, path: '/tenant/procurement' },
      ]
    },
    {
      title: 'FINANCE',
      items: [
        { name: 'Finance & Billing', icon: Receipt, path: '/tenant/finance' },
        { name: 'PM Surya Ghar Portal', icon: Landmark, path: '/tenant/subsidy' },
        { name: 'Loans', icon: Banknote, path: '/tenant/loans' },
      ]
    },
    {
      title: 'CUSTOMER',
      items: [
        { name: 'Documents', icon: FileBox, path: '/tenant/documents' },
        { name: 'Service & Tickets', icon: Wrench, path: '/tenant/service' },
        { name: 'AMC', icon: ShieldCheck, path: '/tenant/amc' },
        { name: 'Communication', icon: MessageSquare, path: '/tenant/communication' },
      ]
    },
    {
      title: 'MANAGEMENT',
      items: [
        { name: 'Staff', icon: UserPlus, path: '/tenant/staff' },
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

  // Verify active tenant status on mount & route change
  useEffect(() => {
    let isMounted = true;
    const verifyTenantStatus = async () => {
      try {
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/me`,
          { withCredentials: true }
        );
        if (isMounted && res.data?.user?.tenant?.status === 'SUSPENDED') {
          localStorage.removeItem('token');
          localStorage.removeItem('auth_token');
          router.replace('/suspended');
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

  // Initialize auto-expansion based on active path & close mobile drawer
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
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/logout`, {}, { withCredentials: true });
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

  const renderSidebarContent = (isMobile = false) => {
    const isCollapsed = !isMobile && sidebarCollapsed;

    return (
      <div className="flex flex-col h-full bg-white select-none">
        {/* LOGO AREA */}
        <div className={`h-16 lg:h-20 flex items-center border-b border-slate-100 shrink-0 ${
          isCollapsed ? 'justify-center flex-col py-3 gap-1 px-2' : 'justify-between px-5'
        }`}>
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
            <button 
              type="button"
              onClick={isCollapsed ? toggleSidebarCollapse : undefined}
              title={isCollapsed ? "Click to expand sidebar" : "WhereReady Solar OS"}
              className={`relative w-9 h-9 lg:w-10 lg:h-10 rounded-xl overflow-hidden border border-slate-200 bg-white shadow-2xs shrink-0 flex items-center justify-center ${
                isCollapsed ? 'hover:scale-105 transition-transform cursor-pointer' : ''
              }`}
            >
              <Image
                src="/images/whereready_logo.png"
                alt="WhereReady Logo"
                width={36}
                height={36}
                className="object-contain p-0.5"
                priority
              />
            </button>
            {!isCollapsed && (
              <div>
                <h1 className="font-extrabold text-slate-900 text-sm lg:text-base tracking-tight leading-none">
                  WhereReady
                </h1>
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mt-1">
                  SOLAR OS • Workspace
                </p>
              </div>
            )}
          </div>

          {/* TOGGLE / CLOSE BUTTON */}
          {isMobile ? (
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          ) : !isCollapsed ? (
            <button
              type="button"
              onClick={toggleSidebarCollapse}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
              title="Collapse sidebar for more screen space"
            >
              <ChevronLeft size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={toggleSidebarCollapse}
              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition cursor-pointer"
              title="Expand sidebar"
            >
              <ChevronRight size={14} />
            </button>
          )}
        </div>

        {/* QUICK SEARCH (ONLY WHEN EXPANDED) */}
        {!isCollapsed ? (
          <div className="px-4 py-3 shrink-0">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search modules..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl py-2 pl-8 pr-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-slate-700 placeholder:text-slate-400"
              />
            </div>
          </div>
        ) : (
          <div className="py-2 flex justify-center shrink-0">
            <button
              type="button"
              onClick={toggleSidebarCollapse}
              title="Search modules (Expand)"
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              <Search size={16} />
            </button>
          </div>
        )}

        {/* NAVIGATION ITEMS */}
        <div className={`flex-1 pb-6 overflow-y-auto custom-scrollbar space-y-1 ${
          isCollapsed ? 'px-2 py-1' : 'px-3'
        }`}>
          {MENU_GROUPS.map((group, index) => {
            const filteredItems = searchQuery
              ? group.items.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
              : group.items;

            if (filteredItems.length === 0) return null;

            if (isCollapsed) {
              return (
                <div key={index} className="space-y-1 mb-2">
                  <div className="w-6 h-px bg-slate-100 mx-auto my-1.5" />
                  {filteredItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`);

                    return (
                      <Link
                        key={item.name}
                        href={item.path}
                        className={`w-10 h-10 mx-auto rounded-xl flex items-center justify-center transition-all duration-200 relative group ${
                          isActive 
                            ? 'text-blue-700 bg-blue-50 shadow-xs ring-1 ring-blue-300' 
                            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                      >
                        <Icon size={18} className={isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-700'} strokeWidth={isActive ? 2.5 : 2} />
                        
                        {/* Interactive Floating Tooltip */}
                        <div className="absolute left-full ml-3 px-2.5 py-1 bg-slate-900 text-white text-[11px] font-bold rounded-lg shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-150 z-50 whitespace-nowrap">
                          {item.name}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              );
            }

            const isOpen = searchQuery ? true : openGroups[group.title];

            return (
              <div key={index} className="mb-2">
                <button 
                  type="button"
                  onClick={() => toggleGroup(group.title)}
                  className="w-full flex items-center justify-between px-3 py-1.5 text-left rounded-xl hover:bg-slate-50 transition-colors group cursor-pointer"
                >
                  <span className="text-[10px] font-extrabold text-slate-400 group-hover:text-slate-600 uppercase tracking-widest transition-colors">
                    {group.title}
                  </span>
                  {!searchQuery && (
                    <ChevronDown size={13} className={`text-slate-400 group-hover:text-slate-600 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                  )}
                </button>
                
                <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-screen opacity-100 mt-0.5' : 'max-h-0 opacity-0'}`}>
                  <div className="space-y-0.5 px-1">
                    {filteredItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`);
                      
                      return (
                        <Link
                          key={item.name}
                          href={item.path}
                          onClick={() => { if (isMobile) setMobileMenuOpen(false); }}
                          className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 group relative overflow-hidden ${
                            isActive 
                              ? 'text-blue-700 bg-blue-50/90 shadow-xs shadow-blue-100/50' 
                              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                          }`}
                        >
                          {isActive && (
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-r-full" />
                          )}
                          <Icon size={16} className={isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-500 transition-colors'} strokeWidth={isActive ? 2.5 : 2} />
                          {item.name}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* BOTTOM SECTION */}
        <div className={`border-t border-slate-100/80 bg-slate-50/50 shrink-0 ${
          isCollapsed ? 'p-2 flex flex-col items-center gap-1.5' : 'p-3'
        }`}>
          {isCollapsed ? (
            <>
              <Link 
                href="/tenant/settings" 
                title="Settings"
                className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 hover:bg-white hover:text-slate-800 transition-colors relative group"
              >
                <Settings size={18} className="text-slate-400 group-hover:text-slate-600" />
                <div className="absolute left-full ml-3 px-2.5 py-1 bg-slate-900 text-white text-[11px] font-bold rounded-lg shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-50 whitespace-nowrap">
                  Settings
                </div>
              </Link>
              <button 
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                title="Sign Out"
                className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer relative group"
              >
                <LogOut size={18} className="text-slate-400 group-hover:text-red-600" />
                <div className="absolute left-full ml-3 px-2.5 py-1 bg-slate-900 text-white text-[11px] font-bold rounded-lg shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-50 whitespace-nowrap">
                  Sign Out
                </div>
              </button>
            </>
          ) : (
            <>
              <Link 
                href="/tenant/settings" 
                onClick={() => { if (isMobile) setMobileMenuOpen(false); }}
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-white hover:text-slate-800 transition-colors mb-1 hover:shadow-xs"
              >
                <Settings size={15} className="text-slate-400" /> Settings
              </Link>
              <button 
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors text-left cursor-pointer"
              >
                <LogOut size={15} className="text-slate-400" /> {loggingOut ? 'Signing out...' : 'Sign Out'}
              </button>
            </>
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
      <aside className={`fixed inset-y-0 left-0 z-50 w-[260px] bg-white border-r border-slate-200 flex flex-col shadow-2xl transition-transform duration-300 lg:hidden ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {renderSidebarContent(true)}
      </aside>

      {/* DESKTOP SIDEBAR (lg+) */}
      <aside className={`h-screen sticky top-0 bg-white border-r border-slate-200/60 hidden lg:flex flex-col shrink-0 z-30 shadow-xs transition-all duration-300 ease-in-out ${
        sidebarCollapsed ? 'w-[76px]' : 'w-[260px]'
      }`}>
        {renderSidebarContent(false)}
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-h-screen min-w-0 w-full relative bg-white overflow-x-hidden">
        {/* Engineering 32px Square Grid Background */}
        <div 
          className="pointer-events-none absolute inset-0 z-0 opacity-70"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(15, 23, 42, 0.035) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(15, 23, 42, 0.035) 1px, transparent 1px)
            `,
            backgroundSize: '32px 32px',
          }}
        />
        <div className="relative z-10 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full min-w-0">
          {children}
        </div>
      </main>
    </div>
  );
}
