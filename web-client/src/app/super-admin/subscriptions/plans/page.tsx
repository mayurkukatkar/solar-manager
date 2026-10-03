"use client";
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, MoreHorizontal, Check, Edit2 } from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  code: string;
  price: number;
  billingCycle: string;
  userLimit: number;
  storageLimit: number;
  isActive: boolean;
  features: Record<string, boolean>;
}

export default function PlansList() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`\${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/super-admin/plans`, { withCredentials: true })
      .then(res => setPlans(res.data.plans || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">SaaS Plans</h1>
          <p className="text-slate-500 mt-1">Manage subscription tiers and feature entitlements.</p>
        </div>
        <button className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-lg font-semibold shadow-sm transition-all text-sm">
          <Plus size={18} /> Create Plan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-slate-200 animate-pulse h-96"></div>
          ))
        ) : plans.length === 0 ? (
          <div className="col-span-3 text-center py-20 bg-white border border-slate-200 rounded-2xl shadow-sm">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
              <Plus className="text-slate-300" size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No plans configured</h3>
            <p className="text-slate-500 mt-1">Create your first SaaS pricing tier.</p>
          </div>
        ) : (
          plans.map(plan => (
            <div key={plan.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow relative">
              <div className="absolute top-6 right-6">
                 <button className="text-slate-400 hover:text-slate-600"><MoreHorizontal size={20}/></button>
              </div>
              <span className={`inline-block px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md mb-4 ${plan.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                {plan.isActive ? 'Active' : 'Inactive'}
              </span>
              <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
              <div className="text-sm text-slate-500 mb-4">{plan.code}</div>
              
              <div className="text-4xl font-black text-slate-900 mb-1">
                ₹{plan.price.toLocaleString('en-IN')}
              </div>
              <p className="text-xs text-slate-500 font-medium pb-6 border-b border-slate-100">
                per month / billed {plan.billingCycle.toLowerCase()}
              </p>
              
              <div className="mt-6 space-y-3">
                 <div className="flex items-center gap-3 text-sm text-slate-700">
                   <Check size={16} className="text-blue-600" />
                   Up to {plan.userLimit} Users
                 </div>
                 <div className="flex items-center gap-3 text-sm text-slate-700">
                   <Check size={16} className="text-blue-600" />
                   {plan.storageLimit}GB Storage
                 </div>
                 {plan.features && typeof plan.features === 'object' && Object.keys(plan.features).map(f => (
                   <div key={f} className="flex items-center gap-3 text-sm text-slate-700 capitalize">
                     <Check size={16} className="text-blue-600" />
                     {f.replace('_', ' ')}
                   </div>
                 ))}
              </div>
              
              <button className="w-full mt-8 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold rounded-lg transition-colors border border-slate-200 flex items-center justify-center gap-2 text-sm">
                <Edit2 size={16} /> Edit Plan
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
