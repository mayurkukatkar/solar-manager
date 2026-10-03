"use client";
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';
import { ArrowLeft, Building2, Mail, Phone, MapPin, CheckCircle2, XCircle, Users, Activity } from 'lucide-react';

export default function TenantDetails() {
  const { id } = useParams();
  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`\${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/super-admin/tenants/${id}`, { withCredentials: true })
      .then(res => setTenant(res.data.tenant))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="p-8 text-slate-500 font-medium">Loading tenant profile...</div>;
  }

  if (!tenant) {
    return (
      <div className="p-8">
        <Link href="/super-admin/tenants" className="text-blue-600 font-bold hover:underline mb-4 inline-block">&larr; Back to Tenants</Link>
        <h1 className="text-2xl font-bold text-slate-900">Tenant not found</h1>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in duration-500 pb-20">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/super-admin/tenants" className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors text-slate-500 shadow-sm font-bold">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{tenant.name}</h1>
          <p className="text-slate-500 font-mono text-xs mt-1 uppercase">ID: {tenant.id}</p>
        </div>
        <div className="ml-auto">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
            tenant.status === 'ACTIVE' 
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            {tenant.status === 'ACTIVE' ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
            {tenant.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2"><Building2 className="text-blue-600" size={20}/> Company Profile</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Legal Name</p>
                <p className="text-slate-900 font-medium">{tenant.legalName || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Contact Email</p>
                <p className="text-slate-900 font-medium flex items-center gap-2"><Mail size={14} className="text-slate-400"/> {tenant.email || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Contact Phone</p>
                <p className="text-slate-900 font-medium flex items-center gap-2"><Phone size={14} className="text-slate-400"/> {tenant.phone || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Location</p>
                <p className="text-slate-900 font-medium flex items-center gap-2"><MapPin size={14} className="text-slate-400"/> {tenant.city || 'N/A'}, {tenant.state || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">GSTIN</p>
                <p className="text-slate-900 font-mono text-sm">{tenant.gstin || 'N/A'}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2"><Users className="text-blue-600" size={20}/> Administrator Accounts</h2>
            {tenant.users && tenant.users.length > 0 ? (
               <div className="space-y-4">
                 {tenant.users.map((u: any, idx: number) => (
                   <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                     <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center">
                         {u.name.charAt(0).toUpperCase()}
                       </div>
                       <div>
                         <p className="font-bold text-slate-900 text-sm">{u.name}</p>
                         <p className="text-xs text-slate-500">{u.email}</p>
                       </div>
                     </div>
                     <span className="text-xs font-bold bg-slate-200 text-slate-700 px-2 py-1 rounded">TENANT_ADMIN</span>
                   </div>
                 ))}
               </div>
            ) : (
              <p className="text-slate-500 text-sm font-medium">No administrators found.</p>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          <div className="bg-slate-900 p-6 rounded-2xl shadow-sm text-white relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10"><Activity size={100} /></div>
             <h2 className="text-lg font-bold text-white mb-6 relative z-10">Platform Metrics</h2>
             
             <div className="grid grid-cols-2 gap-4 relative z-10">
               <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/5">
                 <p className="text-white/60 text-xs font-bold uppercase tracking-wider mb-1">Users</p>
                 <p className="text-2xl font-black">{tenant._count?.users || 0}</p>
               </div>
               <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/5">
                 <p className="text-white/60 text-xs font-bold uppercase tracking-wider mb-1">Projects</p>
                 <p className="text-2xl font-black">{tenant._count?.projects || 0}</p>
               </div>
               <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/5 col-span-2">
                 <p className="text-white/60 text-xs font-bold uppercase tracking-wider mb-1">Leads</p>
                 <p className="text-2xl font-black">{tenant._count?.leads || 0}</p>
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
