"use client";
import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Building2, User, CreditCard, Layers, CheckCircle2, AlertCircle } from 'lucide-react';

const Input = ({ label, name, value, onChange, type = 'text', placeholder = '' }: any) => (
  <div className="space-y-1.5">
    <label className="text-sm font-semibold text-slate-700">{label}</label>
    <input 
      type={type} name={name} value={value} onChange={onChange} placeholder={placeholder} required
      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm font-medium text-slate-800 shadow-sm bg-white"
    />
  </div>
);

export default function CreateTenant() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', city: '', gst: '',
    adminName: '', adminEmail: '',
    plan: 'PRO', billingCycle: 'ANNUAL',
    modules: { crm: true, projects: true, inventory: true, finance: false }
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleModuleToggle = (key: string) => {
    setFormData({
      ...formData,
      modules: { ...formData.modules, [key]: !(formData.modules as any)[key] }
    });
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 5) {
      setStep(step + 1);
      return;
    }

    setLoading(true);
    setError('');
    try {
      // Create Tenant (Using existing Phase 1 API, ignoring extra wizard fields until backend upgrade)
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/super-admin/tenants`, formData, { withCredentials: true });
      router.push('/super-admin/tenants');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to provision tenant');
      setLoading(false);
    }
  };

  const steps = [
    { id: 1, title: 'Company', icon: Building2 },
    { id: 2, title: 'Admin', icon: User },
    { id: 3, title: 'Plan', icon: CreditCard },
    { id: 4, title: 'Features', icon: Layers },
    { id: 5, title: 'Review', icon: CheckCircle2 },
  ];



  return (
    <div className="max-w-4xl animate-in fade-in duration-500 pb-20">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/super-admin/tenants" className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors text-slate-500 shadow-sm font-bold">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Provision Tenant</h1>
          <p className="text-slate-500 mt-1">Multi-step SaaS tenant onboarding wizard.</p>
        </div>
      </div>

      {/* STEPPER */}
      <div className="mb-10 bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex justify-between items-center relative overflow-hidden">
        <div className="absolute top-1/2 left-8 right-8 h-1 bg-slate-100 -translate-y-1/2 z-0"></div>
        <div className="absolute top-1/2 left-8 h-1 bg-blue-600 -translate-y-1/2 z-0 transition-all duration-500" style={{ width: `${((step - 1) / 4) * 100}%` }}></div>
        
        {steps.map(s => (
          <div key={s.id} className="relative z-10 flex flex-col items-center gap-2">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold border-4 border-white shadow-sm transition-colors duration-300 ${
              step >= s.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'
            }`}>
              <s.icon size={20} />
            </div>
            <span className={`text-xs font-bold uppercase tracking-wider ${step >= s.id ? 'text-slate-900' : 'text-slate-400'}`}>
              {s.title}
            </span>
          </div>
        ))}
      </div>

      {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-8 border border-red-100 font-medium text-sm flex items-center gap-3 shadow-sm"><AlertCircle size={18}/> {error}</div>}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        
        {/* STEP 1: COMPANY */}
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Company Identity</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input label="Company Legal Name" name="name" value={formData.name} onChange={handleChange} placeholder="E.g. SolarTech Solutions Pvt Ltd" />
              <Input label="Company Email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="contact@solartech.com" />
              <Input label="Business Phone" name="phone" value={formData.phone} onChange={handleChange} placeholder="+91 98765 43210" />
              <Input label="City / Region" name="city" value={formData.city} onChange={handleChange} placeholder="E.g. Mumbai" />
              <Input label="GSTIN (Optional)" name="gst" value={formData.gst} onChange={handleChange} placeholder="27XXXXX..." />
            </div>
          </div>
        )}

        {/* STEP 2: ADMIN */}
        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Tenant Administrator</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input label="Admin Full Name" name="adminName" value={formData.adminName} onChange={handleChange} placeholder="E.g. John Doe" />
              <Input label="Admin Email (Login ID)" name="adminEmail" type="email" value={formData.adminEmail} onChange={handleChange} />
            </div>
            <div className="mt-6 bg-blue-50 border border-blue-100 p-4 rounded-xl text-sm text-blue-800 font-medium">
              This user will be granted the <strong>TENANT_ADMIN</strong> role and will receive an email with their temporary login credentials.
            </div>
          </div>
        )}

        {/* STEP 3: PLAN */}
        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Subscription Plan</h2>
            <p className="text-sm text-amber-600 font-bold bg-amber-50 p-3 rounded-lg border border-amber-100 mb-6">
              Full Subscription API logic will be implemented in Phase 3. This is a UI mockup.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {['STARTER', 'PRO', 'ENTERPRISE'].map(plan => (
                <div 
                  key={plan}
                  onClick={() => setFormData({...formData, plan})}
                  className={`cursor-pointer rounded-xl border-2 p-6 transition-all ${
                    formData.plan === plan ? 'border-blue-600 bg-blue-50 shadow-md' : 'border-slate-200 hover:border-blue-300 bg-white'
                  }`}
                >
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg text-slate-900">{plan}</h3>
                    {formData.plan === plan && <CheckCircle2 size={20} className="text-blue-600" />}
                  </div>
                  <div className="text-3xl font-black text-slate-900 mb-1">
                    {plan === 'STARTER' ? '₹4,999' : plan === 'PRO' ? '₹9,999' : 'Custom'}
                  </div>
                  <p className="text-xs text-slate-500 font-medium">per month / billed annually</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 4: FEATURES */}
        {step === 4 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Module Entitlements</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { id: 'crm', name: 'CRM & Lead Management', desc: 'Manage prospects and pipelines' },
                { id: 'projects', name: 'Project Management', desc: 'Track installations and milestones' },
                { id: 'inventory', name: 'Inventory & Procurement', desc: 'Manage stock and POs' },
                { id: 'finance', name: 'Finance & Invoicing', desc: 'Generate quotes and invoices' }
              ].map(mod => (
                <div 
                  key={mod.id}
                  onClick={() => handleModuleToggle(mod.id)}
                  className={`cursor-pointer flex items-start gap-4 p-4 rounded-xl border-2 transition-all ${
                    (formData.modules as any)[mod.id] ? 'border-blue-600 bg-blue-50/50' : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 ${
                    (formData.modules as any)[mod.id] ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-300'
                  }`}>
                    {(formData.modules as any)[mod.id] && <CheckCircle2 size={14} className="text-white" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{mod.name}</h4>
                    <p className="text-xs text-slate-500 mt-1">{mod.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 5: REVIEW */}
        {step === 5 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
             <h2 className="text-xl font-bold text-slate-900 mb-6">Review & Provision</h2>
             <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-slate-500 font-medium">Company Name:</span> <br/><span className="font-bold text-slate-900 text-base">{formData.name}</span></div>
                  <div><span className="text-slate-500 font-medium">Admin Login:</span> <br/><span className="font-bold text-slate-900 text-base">{formData.adminEmail}</span></div>
                  <div><span className="text-slate-500 font-medium">Selected Plan:</span> <br/><span className="font-bold text-slate-900 text-base">{formData.plan}</span></div>
                  <div>
                    <span className="text-slate-500 font-medium">Modules:</span> <br/>
                    <div className="flex gap-2 mt-1">
                      {Object.keys(formData.modules).filter(k => (formData.modules as any)[k]).map(k => (
                        <span key={k} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold uppercase rounded">{k}</span>
                      ))}
                    </div>
                  </div>
                </div>
             </div>
          </div>
        )}

        {/* NAVIGATION BUTTONS */}
        <div className="pt-8 mt-8 border-t border-slate-100 flex justify-between items-center">
          {step > 1 ? (
            <button 
              type="button" 
              onClick={() => setStep(step - 1)} 
              className="px-6 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Previous
            </button>
          ) : <div></div>}
          
          <button 
            type="submit" 
            disabled={loading} 
            className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-2.5 rounded-xl font-bold shadow-md transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              'Processing...'
            ) : step < 5 ? (
              'Continue'
            ) : (
              'Provision Tenant Now'
            )}
          </button>
        </div>

      </form>
    </div>
  );
}
