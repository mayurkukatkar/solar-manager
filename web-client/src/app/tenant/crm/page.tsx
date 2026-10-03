"use client";
import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { Search, Filter, Phone, Mail, MapPin, CheckCircle, ChevronRight, Users } from 'lucide-react';

export default function CustomerList() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await axios.get(`\${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/customers`, { withCredentials: true });
        setCustomers(res.data.customers);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCustomers();
  }, []);

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.mobile.includes(search) || 
    (c.email && c.email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-800">CRM Pipeline</h1>
          <p className="text-slate-500 mt-1 font-medium">Manage your converted customers and view their 360° lifecycle.</p>
        </div>
        <button className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-emerald-600/20 hover:bg-emerald-700 transition-colors flex items-center gap-2">
          <Users size={16} /> Convert New Lead
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Toolbar */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between gap-4 bg-slate-50/50">
           <div className="relative flex-1 max-w-md">
             <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
             <input 
               type="text" 
               placeholder="Search customers by name, phone..." 
               value={search}
               onChange={(e) => setSearch(e.target.value)}
               className="w-full pl-11 pr-4 py-2.5 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-emerald-50 focus:border-emerald-500 outline-none text-sm transition-all font-medium text-slate-700"
             />
           </div>
           <button className="flex items-center gap-2 px-5 py-2.5 rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors text-sm font-bold">
             <Filter size={16} /> Filters
           </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-400 uppercase tracking-widest text-[10px] font-bold border-b border-slate-100">
              <tr>
                <th className="px-6 py-5">Customer Profile</th>
                <th className="px-6 py-5">Contact Info</th>
                <th className="px-6 py-5">Location</th>
                <th className="px-6 py-5">Pipeline Stage</th>
                <th className="px-6 py-5">Source</th>
                <th className="px-6 py-5 text-right">360° View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-slate-500 font-medium">
                    No customers found in pipeline.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center text-emerald-700 font-black text-lg shadow-inner">
                          {c.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-base">{c.name}</p>
                          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-0.5">{c.customerType}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-1.5 text-slate-600 text-[13px] font-medium">
                        <span className="flex items-center gap-2"><Phone size={14} className="text-slate-400" /> {c.mobile}</span>
                        {c.email && <span className="flex items-center gap-2"><Mail size={14} className="text-slate-400" /> {c.email}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-slate-600 text-[13px] font-medium">
                      {c.city ? (
                         <span className="flex items-center gap-2"><MapPin size={14} className="text-slate-400" /> {c.city}</span>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-5">
                      <span className="px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center gap-1.5 w-max shadow-sm">
                        <CheckCircle size={14} /> Active
                      </span>
                    </td>
                    <td className="px-6 py-5 text-slate-500 text-xs font-bold uppercase tracking-wider">
                      {c.lead ? `Lead: ${c.lead.source || 'Direct'}` : 'Direct Creation'}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <Link href={`/tenant/crm/${c.id}`} className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition-colors border border-transparent hover:border-emerald-200 shadow-sm">
                        <ChevronRight size={20} strokeWidth={2.5} />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
