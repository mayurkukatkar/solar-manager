"use client";
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Filter, MoreHorizontal, FileDown, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

interface Subscription {
  id: string;
  tenant: { name: string, status: string };
  plan: { name: string, price: number };
  status: string;
  startDate: string;
  endDate: string;
  amount: number;
  paymentStatus: string;
}

export default function SubscriptionsList() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/super-admin/subscriptions`, { withCredentials: true })
      .then(res => setSubscriptions(res.data.subscriptions || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = subscriptions.filter(s => s.tenant.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="animate-in fade-in duration-500">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Active Subscriptions</h1>
          <p className="text-slate-500 mt-1">Monitor billing, renewals, and tenant plans.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2.5 rounded-lg font-semibold shadow-sm transition-all text-sm">
            <FileDown size={18} /> Export CSV
          </button>
        </div>
      </div>

      <div className="bg-white rounded-t-xl border border-slate-200 p-4 flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by tenant name..."
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

      <div className="bg-white shadow-sm border-x border-b border-slate-200 overflow-x-auto rounded-b-xl">
        <table className="w-full text-left min-w-[1000px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tenant</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Plan</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Billing Cycle</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={6} className="px-6 py-4"><div className="h-6 bg-slate-100 rounded w-full"></div></td>
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-20 text-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                    <ShieldAlert className="text-slate-300" size={32} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">No subscriptions found</h3>
                  <p className="text-slate-500 mt-1">Tenant subscriptions will appear here.</p>
                </td>
              </tr>
            ) : (
              filtered.map(sub => (
                <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900">{sub.tenant.name}</div>
                    <div className="text-xs text-slate-500 mt-1">Sub ID: {sub.id.split('-')[0]}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-700">{sub.plan.name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900">₹{sub.amount.toLocaleString('en-IN')}</div>
                    <div className={`text-xs font-bold mt-1 ${sub.paymentStatus === 'PAID' ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {sub.paymentStatus}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-slate-700">Ends: {new Date(sub.endDate).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      sub.status === 'ACTIVE' 
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                        : 'bg-red-100 text-red-800 border border-red-200'
                    }`}>
                      {sub.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
                      <MoreHorizontal size={20} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
