"use client";
import { useState } from 'react';
import { Mail, MessageCircle, CreditCard, HardDrive, Code2, CheckCircle2, XCircle } from 'lucide-react';

export default function Integrations() {
  const integrations = [
    { id: 'aws_ses', name: 'AWS SES', category: 'Email', status: 'CONNECTED', icon: Mail },
    { id: 'whatsapp_meta', name: 'Meta Cloud API', category: 'WhatsApp', status: 'DISCONNECTED', icon: MessageCircle },
    { id: 'stripe', name: 'Stripe', category: 'Payment Gateway', status: 'CONNECTED', icon: CreditCard },
    { id: 'razorpay', name: 'Razorpay', category: 'Payment Gateway', status: 'CONNECTED', icon: CreditCard },
    { id: 's3', name: 'Amazon S3', category: 'Storage', status: 'CONNECTED', icon: HardDrive },
    { id: 'twilio', name: 'Twilio SMS', category: 'SMS', status: 'DISCONNECTED', icon: Code2 },
  ];

  return (
    <div className="animate-in fade-in duration-500 pb-20">
      
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">System Integrations</h1>
          <p className="text-slate-500 mt-1">Manage global platform connections and third-party services.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {integrations.map(integration => (
          <div key={integration.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow relative group">
            
            <div className="flex justify-between items-start mb-6">
               <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600">
                 <integration.icon size={24} />
               </div>
               
               {integration.status === 'CONNECTED' ? (
                 <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                   <CheckCircle2 size={14} /> Connected
                 </span>
               ) : (
                 <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                   <XCircle size={14} /> Disconnected
                 </span>
               )}
            </div>

            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{integration.category}</div>
            <h3 className="text-xl font-bold text-slate-900">{integration.name}</h3>
            
            <div className="mt-8 flex gap-3">
              <button className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-lg transition-colors">
                Configure
              </button>
              {integration.status === 'CONNECTED' && (
                <button className="px-4 py-2 bg-white border border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-slate-600 text-sm font-bold rounded-lg transition-colors">
                  Revoke
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
