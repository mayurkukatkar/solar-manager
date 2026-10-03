"use client";
import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { Plus, Search, Filter, MoreHorizontal, FileDown, ShieldCheck, ShieldAlert } from 'lucide-react';

interface Tenant {
  id: string;
  name: string;
  email: string | null;
  status: string;
  createdAt: string;
  _count: { users: number, projects: number };
}

export default function TenantList() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  useEffect(() => {
    axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/super-admin/tenants`, { withCredentials: true })
      .then(res => setTenants(res.data.tenants || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleStatusToggle = async (tenantId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
      await axios.put(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/super-admin/tenants/${tenantId}/status`, { status: newStatus }, { withCredentials: true });
      setTenants(tenants.map(t => t.id === tenantId ? { ...t, status: newStatus } : t));
      setOpenDropdown(null);
    } catch (err) {
      console.error(err);
      alert('Failed to update tenant status');
    }
  };

  const filteredTenants = tenants.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Tenants</h1>
          <p className="text-slate-500 mt-1">Manage solar companies and their subscriptions.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2.5 rounded-lg font-semibold shadow-sm transition-all text-sm">
            <FileDown size={18} /> Export
          </button>
          <Link 
            href="/super-admin/tenants/create" 
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-lg font-semibold shadow-sm transition-all text-sm"
          >
            <Plus size={18} />
            Provision Tenant
          </Link>
        </div>
      </div>

      {/* FILTERS & SEARCH */}
      <div className="bg-white rounded-t-xl border border-slate-200 p-4 flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by company name or ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg text-sm transition-all outline-none"
          />
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 border border-slate-200 px-4 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50">
            <Filter size={16} /> Filters
          </button>
        </div>
      </div>

      {/* DATA TABLE */}
      <div className="bg-white shadow-sm border-x border-b border-slate-200 overflow-x-auto rounded-b-xl min-h-[350px]">
        <table className="w-full text-left min-w-[1000px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Company & ID</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Contact</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Plan (Phase 3)</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Metrics</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-3/4 mb-2"></div><div className="h-3 bg-slate-50 rounded w-1/2"></div></td>
                  <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-full"></div></td>
                  <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-1/2"></div></td>
                  <td className="px-6 py-4"><div className="h-6 bg-slate-100 rounded-full w-20"></div></td>
                  <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-1/4 ml-auto"></div></td>
                  <td className="px-6 py-4"><div className="h-6 bg-slate-100 rounded w-8 ml-auto"></div></td>
                </tr>
              ))
            ) : filteredTenants.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-20 text-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                    <Search className="text-slate-300" size={32} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">No tenants found</h3>
                  <p className="text-slate-500 mt-1">Try adjusting your filters or provision a new tenant.</p>
                </td>
              </tr>
            ) : (
              filteredTenants.map(t => (
                <tr key={t.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900 flex items-center gap-2">
                      {t.name}
                      {t.status === 'ACTIVE' ? <ShieldCheck size={14} className="text-emerald-500" /> : <ShieldAlert size={14} className="text-red-500" />}
                    </div>
                    <div className="text-xs font-mono text-slate-400 mt-1 uppercase">ID: {t.id.split('-')[0]}...</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-semibold text-slate-700">{t.email || 'No email provided'}</div>
                    <div className="text-xs text-slate-500 mt-0.5">Admin Profile</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded">
                      Enterprise
                    </span>
                    <div className="text-xs text-slate-500 mt-1">Exp: Dec 31, 2026</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      t.status === 'ACTIVE' 
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                        : 'bg-red-100 text-red-800 border border-red-200'
                    }`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="text-sm font-bold text-slate-900">{t._count.users} Users</div>
                    <div className="text-xs font-medium text-slate-500 mt-0.5">{t._count.projects || 0} Projects</div>
                  </td>
                  <td className="px-6 py-4 text-right relative">
                    <button 
                      onClick={() => setOpenDropdown(openDropdown === t.id ? null : t.id)}
                      className={`p-2 rounded-lg transition-colors focus:outline-none ${openDropdown === t.id ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'}`}
                    >
                      <MoreHorizontal size={20} />
                    </button>
                    
                    {openDropdown === t.id && (
                      <>
                        {/* Invisible overlay to close dropdown when clicking outside */}
                        <div className="fixed inset-0 z-40" onClick={() => setOpenDropdown(null)}></div>
                        
                        <div className="absolute right-10 top-10 w-48 bg-white border border-slate-100 rounded-xl shadow-xl z-50 overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                          <Link href={`/super-admin/tenants/${t.id}`} className="w-full text-left px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors flex items-center gap-2">
                            View Details
                          </Link>
                          <Link href="/super-admin/subscriptions" className="w-full text-left px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors flex items-center gap-2">
                            Manage Plan
                          </Link>
                          <div className="h-px bg-slate-100 my-1"></div>
                          {t.status === 'SUSPENDED' ? (
                            <button onClick={() => handleStatusToggle(t.id, t.status)} className="w-full text-left px-4 py-2 text-sm font-bold text-emerald-600 hover:bg-emerald-50 transition-colors flex items-center gap-2">
                              Reactivate Tenant
                            </button>
                          ) : (
                            <button onClick={() => handleStatusToggle(t.id, t.status)} className="w-full text-left px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2">
                              Suspend Tenant
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* PAGINATION */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-x border-b border-slate-200 rounded-b-xl shadow-sm mt-0 -translate-y-px">
         <div className="text-sm text-slate-500 font-medium">
           Showing <span className="font-bold text-slate-900">{filteredTenants.length}</span> results
         </div>
         <div className="flex gap-2">
           <button className="px-3 py-1 border border-slate-200 rounded text-sm font-medium text-slate-400 cursor-not-allowed">Previous</button>
           <button className="px-3 py-1 border border-slate-200 rounded text-sm font-medium text-slate-700 hover:bg-slate-50">Next</button>
         </div>
      </div>
    </div>
  );
}
