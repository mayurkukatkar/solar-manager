"use client";
import { useState } from 'react';
import { Layers, Settings2, Plus, ShieldCheck, ShieldAlert } from 'lucide-react';

export default function FeatureCatalogue() {
  const [features, setFeatures] = useState([
    { id: 'crm', name: 'CRM & Lead Management', key: 'feature_crm', status: 'ACTIVE', level: 'PLATFORM' },
    { id: 'quotations', name: 'Smart Quotations', key: 'feature_quotes', status: 'ACTIVE', level: 'PLATFORM' },
    { id: 'projects', name: 'Project Management', key: 'feature_projects', status: 'ACTIVE', level: 'PLATFORM' },
    { id: 'inventory', name: 'Inventory & Procurement', key: 'feature_inventory', status: 'ACTIVE', level: 'PLATFORM' },
    { id: 'finance', name: 'Finance & Invoicing', key: 'feature_finance', status: 'ACTIVE', level: 'PLATFORM' },
    { id: 'whatsapp', name: 'WhatsApp Automation', key: 'feature_whatsapp', status: 'BETA', level: 'PLAN_OVERRIDE' },
    { id: 'ecommerce', name: 'B2B E-commerce', key: 'feature_ecommerce', status: 'COMING_SOON', level: 'DISABLED' },
  ]);

  return (
    <div className="animate-in fade-in duration-500 pb-20">
      
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Feature Catalogue</h1>
          <p className="text-slate-500 mt-1">Manage global platform modules and tenant entitlements.</p>
        </div>
        <button className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-lg font-semibold shadow-sm transition-all text-sm">
          <Plus size={18} /> Register Feature
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8 flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
          <Settings2 size={24} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900">Feature Flag Engine</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-3xl">
            Features are resolved hierarchically. A feature must be enabled at the <strong>Platform</strong> level to be available. 
            <strong> Plan</strong> limits override tenant access, and <strong>Tenant</strong> overrides can grant specific exceptions.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map(feature => (
          <div key={feature.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow relative">
            
            <div className="flex justify-between items-start mb-4">
               <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                 feature.status === 'ACTIVE' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' :
                 feature.status === 'BETA' ? 'bg-amber-50 border-amber-100 text-amber-600' :
                 'bg-slate-50 border-slate-200 text-slate-400'
               }`}>
                 <Layers size={20} />
               </div>
               
               <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  feature.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' :
                  feature.status === 'BETA' ? 'bg-amber-100 text-amber-800' :
                  'bg-slate-100 text-slate-600'
               }`}>
                 {feature.status.replace('_', ' ')}
               </span>
            </div>

            <h3 className="text-lg font-bold text-slate-900">{feature.name}</h3>
            <div className="text-xs font-mono text-slate-400 mt-1 mb-6 bg-slate-50 px-2 py-1 rounded w-fit">Key: {feature.key}</div>
            
            <div className="space-y-3 pt-6 border-t border-slate-100">
               <div className="flex justify-between items-center">
                 <span className="text-sm font-semibold text-slate-500">Platform Flag</span>
                 {feature.status !== 'COMING_SOON' ? <ShieldCheck size={18} className="text-emerald-500" /> : <ShieldAlert size={18} className="text-slate-300" />}
               </div>
               <div className="flex justify-between items-center">
                 <span className="text-sm font-semibold text-slate-500">Resolution</span>
                 <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded">
                   {feature.level}
                 </span>
               </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
