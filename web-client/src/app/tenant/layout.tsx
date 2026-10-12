"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import axios from 'axios';
import { 
  LayoutDashboard, Users, Briefcase, 
  Settings, LogOut, Sun, ChevronLeft, ChevronDown, ChevronRight, Search,
  CircleDollarSign,
  ActivitySquare,
  Users2, MapPin, FileText, HardHat, Package, Truck, Receipt, Banknote, Landmark,
  FileBox, Wrench, ShieldCheck, MessageSquare, UserPlus, Shield, BarChart2, Zap,
  Globe, ShoppingCart, Bell, History, Menu, X
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
      { name: 'Subsidy', icon: Landmark, path: '/tenant/subsidy' },
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
    title: 'GROWTH',
    items: [
      { name: 'Website / CMS', icon: Globe, path: '/tenant/website' },
      { name: 'E-commerce', icon: ShoppingCart, path: '/tenant/ecommerce' },
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

  const renderSidebarContent = (isMobile = false) => (
    <div className="flex flex-col h-full bg-white">
      {/* LOGO AREA */}
      <div className="h-16 lg:h-20 flex items-center justify-between px-6 border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 lg:w-10 lg:h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center text-white shadow-sm shadow-emerald-200">
            <Sun size={20} className="lg:hidden" strokeWidth={2.5} />
            <Sun size={22} className="hidden lg:block" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="font-bold text-slate-800 text-base lg:text-lg tracking-tight leading-none">
              Solar <span className="font-light">ERP</span>
            </h1>
            <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-widest mt-1">
              Tenant Admin
            </p>
          </div>
        </div>

        {isMobile && (
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* QUICK SEARCH */}
      <div className="px-5 py-3.5 shrink-0">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search modules..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-sm rounded-xl py-2 pl-9 pr-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-slate-700 placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* NAVIGATION ACCORDIONS */}
      <div className="flex-1 pb-8 px-3 overflow-y-auto custom-scrollbar space-y-1">
        {MENU_GROUPS.map((group, index) => {
          const filteredItems = searchQuery
            ? group.items.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
            : group.items;

          if (filteredItems.length === 0) return null;

          const isOpen = searchQuery ? true : openGroups[group.title];

          return (
            <div key={index} className="mb-2">
              <button 
                type="button"
                onClick={() => toggleGroup(group.title)}
                className="w-full flex items-center justify-between px-3 py-2 text-left rounded-xl hover:bg-slate-50 transition-colors group cursor-pointer"
              >
                <span className="text-[11px] font-extrabold text-slate-500 group-hover:text-slate-700 uppercase tracking-widest transition-colors">
                  {group.title}
                </span>
                {!searchQuery && (
                  <ChevronDown size={14} className={`text-slate-400 group-hover:text-slate-600 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                )}
              </button>
              
              <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-screen opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
                <div className="space-y-0.5 px-2">
                  {filteredItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`);
                    
                    return (
                      <Link
                        key={item.name}
                        href={item.path}
                        onClick={() => { if (isMobile) setMobileMenuOpen(false); }}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200 group relative overflow-hidden ${
                          isActive 
                            ? 'text-emerald-700 bg-emerald-50 shadow-sm shadow-emerald-100/50' 
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        {isActive && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 rounded-r-full" />
                        )}
                        <Icon size={16} className={isActive ? 'text-emerald-600' : 'text-slate-400 group-hover:text-slate-500 transition-colors'} strokeWidth={isActive ? 2.5 : 2} />
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
      <div className="p-4 border-t border-slate-100/60 bg-slate-50/50 shrink-0">
         <Link 
           href="/tenant/settings" 
           onClick={() => { if (isMobile) setMobileMenuOpen(false); }}
           className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13px] font-bold text-slate-500 hover:bg-white hover:text-slate-800 transition-colors mb-1 hover:shadow-sm"
         >
           <Settings size={16} className="text-slate-400" /> Settings
         </Link>
         <button 
           type="button"
           onClick={handleLogout}
           disabled={loggingOut}
           className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13px] font-bold text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors text-left cursor-pointer"
         >
           <LogOut size={16} className="text-slate-400" /> {loggingOut ? 'Signing out...' : 'Sign Out'}
         </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row font-sans selection:bg-emerald-100 selection:text-emerald-900 w-full overflow-x-hidden">
      
      {/* MOBILE TOPBAR (< lg) */}
      <header className="lg:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center text-white shadow-xs shadow-emerald-200">
            <Sun size={18} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="font-bold text-slate-800 text-base tracking-tight leading-none">
              Solar <span className="font-light">ERP</span>
            </h1>
            <p className="text-[9px] font-semibold text-emerald-600 uppercase tracking-widest mt-0.5">
              Tenant Admin
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
      <aside className={`fixed inset-y-0 left-0 z-50 w-[280px] bg-white border-r border-slate-200 flex flex-col shadow-2xl transition-transform duration-300 lg:hidden ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {renderSidebarContent(true)}
      </aside>

      {/* DESKTOP SIDEBAR (lg+) */}
      <aside className="w-[280px] h-screen sticky top-0 bg-white border-r border-slate-200/60 hidden lg:flex flex-col shrink-0 z-30 shadow-sm shadow-slate-200/30">
        {renderSidebarContent(false)}
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-h-screen min-w-0 w-full relative bg-slate-50/50 overflow-x-hidden">
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full min-w-0">
          {children}
        </div>
      </main>
    </div>
  );
}
