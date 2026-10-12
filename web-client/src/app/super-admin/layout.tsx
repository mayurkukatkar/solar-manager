"use client";
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import axios from 'axios';
import { useState } from 'react';
import { 
  LayoutDashboard, Building2, CreditCard, Users, Layers, BarChart3, 
  LifeBuoy, MessageSquare, Webhook, ShieldAlert, Settings, Layout, 
  LogOut, Search, Bell, HelpCircle, ChevronDown, ChevronRight, Menu 
} from 'lucide-react';

const MENU_GROUPS: { title: string; icon?: React.ElementType; items: { name: string; path: string; icon?: React.ElementType }[] }[] = [
  {
    title: 'MAIN',
    items: [
      { name: 'Dashboard', path: '/super-admin/dashboard', icon: LayoutDashboard }
    ]
  },
  {
    title: 'TENANTS',
    icon: Building2,
    items: [
      { name: 'All Tenants', path: '/super-admin/tenants' },
      { name: 'Add Tenant', path: '/super-admin/tenants/create' },
    ]
  },
  {
    title: 'BILLING & PLANS',
    icon: CreditCard,
    items: [
      { name: 'Plans', path: '/super-admin/subscriptions/plans' },
      { name: 'Subscriptions', path: '/super-admin/subscriptions' },
    ]
  },
  {
    title: 'PLATFORM CORE',
    icon: Layers,
    items: [
      { name: 'Feature Catalogue', path: '/super-admin/features' },
      { name: 'Integrations', path: '/super-admin/integrations' },
    ]
  },
  {
    title: 'OVERSIGHT',
    icon: ShieldAlert,
    items: [
      { name: 'Audit Logs', path: '/super-admin/security/audit-logs' },
      { name: 'Support Tickets', path: '/super-admin/support/tickets' },
    ]
  },
  {
    title: 'PORTAL',
    icon: Layout,
    items: [
      { name: 'CMS Pages', path: '/super-admin/cms/pages' },
    ]
  }
];

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [expandedGroups, setExpandedGroups] = useState<string[]>(MENU_GROUPS.map(g => g.title));
  const [profileOpen, setProfileOpen] = useState(false);

  // Exclude auth layouts
  if (pathname === '/login') return <>{children}</>;

  const handleLogout = async () => {
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/logout`, {}, { withCredentials: true });
      localStorage.removeItem('auth_token');
      router.push('/login');
    } catch (e) {
      console.error(e);
    }
  };

  const toggleGroup = (title: string) => {
    setExpandedGroups(prev => 
      prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title]
    );
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      
      {/* SIDEBAR - CLEAN WHITE PREMIUM UI WITH UPGRADED TYPOGRAPHY */}
      <aside className="w-72 bg-white text-slate-800 flex flex-col z-20 flex-shrink-0 border-r border-slate-200 shadow-sm relative overflow-hidden">
        
        {/* LOGO HEADER */}
        <div className="h-16 flex items-center px-6 border-b border-slate-100 relative z-10">
          <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center mr-3 shadow-md">
            <LayoutDashboard size={16} className="text-white" />
          </div>
          <div>
            <h2 className="text-base font-extrabold tracking-tight text-slate-900">Solar ERP</h2>
            <div className="text-[10px] text-slate-500 font-bold tracking-widest uppercase mt-0.5">Super Admin</div>
          </div>
        </div>

        {/* MENU */}
        <div className="flex-1 overflow-y-auto custom-scrollbar py-6 px-4 relative z-10">
          {MENU_GROUPS.map((group, i) => (
            <div key={i} className="mb-6">
              
              {group.icon ? (
                <button 
                  onClick={() => toggleGroup(group.title)}
                  className="w-full flex items-center justify-between px-2 py-1.5 mb-1 group hover:text-slate-900 transition-colors focus:outline-none"
                >
                  <div className="flex items-center gap-2.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider group-hover:text-slate-600 transition-colors">
                    <group.icon size={14} className="opacity-70" />
                    {group.title}
                  </div>
                  <div className="text-slate-300 group-hover:text-slate-500 transition-colors">
                    {expandedGroups.includes(group.title) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </div>
                </button>
              ) : (
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">
                  {group.title}
                </div>
              )}

              {/* GROUP ITEMS */}
              <div 
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  !group.icon || expandedGroups.includes(group.title) ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="space-y-1 mt-1">
                  {group.items.map(item => {
                    const isActive = pathname === item.path || pathname.startsWith(item.path + '/');
                    return (
                      <Link 
                        key={item.name} 
                        href={item.path}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm border border-transparent ${
                          isActive 
                            ? 'bg-slate-900 text-white font-semibold shadow-md' 
                            : 'text-slate-500 font-medium hover:bg-slate-100 hover:text-slate-900'
                        }`}
                      >
                        {item.icon && (
                          <item.icon size={18} className={isActive ? 'text-white' : 'text-slate-400'} />
                        )}
                        {item.name}
                      </Link>
                    )
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* BOTTOM QUICK PROFILE PROFILE */}
        <div className="p-4 border-t border-slate-100 bg-white relative z-10">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700 border border-slate-200">
                PO
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate tracking-tight">Platform Owner</p>
                <p className="text-xs text-slate-500 truncate font-medium">platform@whereready...</p>
              </div>
           </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* HEADER */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm z-10 flex-shrink-0">
           
           <div className="flex items-center gap-4 flex-1">
              <button className="md:hidden text-slate-500"><Menu size={20} /></button>
              
              {/* GLOBAL SEARCH */}
              <div className="relative w-96 hidden md:block group">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Search tenants, subscriptions, audit logs..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-transparent focus:bg-white focus:border-slate-300 focus:ring-4 focus:ring-slate-100 rounded-xl text-sm transition-all outline-none font-medium text-slate-800 placeholder-slate-400"
                />
              </div>
           </div>

           <div className="flex items-center gap-6">
             <button className="text-slate-400 hover:text-slate-900 transition-colors relative">
               <Bell size={20} />
               <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
             </button>
             
             <div className="h-8 w-px bg-slate-200"></div>

             {/* PROFILE MENU */}
             <div className="relative">
               <button 
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 focus:outline-none"
               >
                 <div className="w-9 h-9 rounded-full bg-slate-900 border-2 border-white shadow-sm flex items-center justify-center text-xs font-bold text-white">
                   PO
                 </div>
                 <ChevronDown size={14} className="text-slate-400" />
               </button>

               {profileOpen && (
                 <div className="absolute right-0 mt-3 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                   <div className="px-4 py-3 border-b border-slate-50 mb-2">
                     <p className="text-sm font-semibold text-slate-900">platform@whereready.com</p>
                   </div>
                   <Link href="/super-admin/profile" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-medium transition-colors">My Profile</Link>
                   <Link href="/super-admin/security" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-medium transition-colors">Security & Login Activity</Link>
                   <div className="h-px bg-slate-100 my-2"></div>
                   <button 
                     onClick={handleLogout}
                     className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-bold flex items-center gap-2 transition-colors"
                   >
                     <LogOut size={16} /> Sign Out
                   </button>
                 </div>
               )}
             </div>
           </div>
        </header>
        
        {/* MAIN CANVAS */}
        <main className="flex-1 overflow-y-auto bg-[#F8FAFC] p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
