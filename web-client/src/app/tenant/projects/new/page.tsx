"use client";

import React, { useState, useEffect, Suspense } from 'react';
import axios from 'axios';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, Save, Briefcase, Zap, MapPin, Calendar, 
  Users, DollarSign, FileText, CheckCircle2, Sun, Sparkles,
  User, ShieldCheck, AlertCircle, Loader2, ArrowRight, Plus
} from 'lucide-react';

function NewProjectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuotationId = searchParams.get('quotationId') || '';
  const initialLeadId = searchParams.get('leadId') || '';
  const initialCustomerId = searchParams.get('customerId') || '';

  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  // DATA LISTS
  const [quotations, setQuotations] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);

  // CREATION SOURCE MODE: 'QUOTATION' | 'LEAD' | 'CUSTOMER' | 'SCRATCH'
  const [creationMode, setCreationMode] = useState<'QUOTATION' | 'LEAD' | 'CUSTOMER' | 'SCRATCH'>('QUOTATION');

  // SELECTED QUOTATION OBJECT FOR SUMMARY BANNER
  const [selectedQuoteObj, setSelectedQuoteObj] = useState<any | null>(null);

  // FORM STATE
  const [formData, setFormData] = useState({
    name: '',
    customerId: '',
    leadId: '',
    quotationId: '',
    surveyId: '',
    capacity: '5.0',
    capacityUnit: 'kWp',
    systemType: 'On-Grid',
    projectType: 'Residential',
    projectOwnerId: '',
    installationAddress: '',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '411001',
    startDate: new Date().toISOString().split('T')[0],
    expectedCompletionDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +25 days default
    priority: 'Medium',
    estimatedValue: '275000',
    estimatedCost: '206250'
  });

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [quotesRes, leadsRes, custRes, staffRes] = await Promise.all([
          axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/quotations`, { withCredentials: true }).catch(() => ({ data: { quotations: [] } })),
          axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/leads`, { withCredentials: true }).catch(() => ({ data: { leads: [] } })),
          axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/customers`, { withCredentials: true }).catch(() => ({ data: { customers: [] } })),
          axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/staff`, { withCredentials: true }).catch(() => ({ data: { staff: [] } }))
        ]);

        const loadedQuotes = quotesRes.data?.quotations || [];
        setQuotations(loadedQuotes);
        setLeads(leadsRes.data?.leads || []);
        setCustomers(custRes.data?.customers || []);
        setStaff(staffRes.data?.staff || []);

        // Check if query params pre-selects quotation
        if (initialQuotationId) {
          const q = loadedQuotes.find((it: any) => it.id === initialQuotationId || it.qNumber === initialQuotationId);
          if (q) {
            applyQuotation(q);
            setCreationMode('QUOTATION');
          }
        } else if (initialLeadId) {
          setCreationMode('LEAD');
          const l = (leadsRes.data?.leads || []).find((it: any) => it.id === initialLeadId);
          if (l) applyLead(l);
        } else if (initialCustomerId) {
          setCreationMode('CUSTOMER');
          const c = (custRes.data?.customers || []).find((it: any) => it.id === initialCustomerId);
          if (c) applyCustomer(c);
        }
      } catch (err) {
        console.error('Failed to load project reference data:', err);
      } finally {
        setDataLoading(false);
      }
    };
    fetchData();
  }, [initialQuotationId, initialLeadId, initialCustomerId]);

  // Apply quotation to form data
  const applyQuotation = (quote: any) => {
    setSelectedQuoteObj(quote);
    const client = quote.customer || quote.lead;
    const clientName = client?.name || 'Customer';
    const cap = quote.systemCapacity || 5.0;
    const sysType = quote.systemType || 'On-Grid';
    const val = quote.total || 275000;
    const cost = Math.round(val * 0.75);

    setFormData(prev => ({
      ...prev,
      quotationId: quote.id,
      leadId: quote.leadId || '',
      customerId: quote.customerId || '',
      name: `${clientName} - ${cap} kWp ${sysType} Solar Plant`,
      capacity: cap.toString(),
      systemType: sysType,
      projectType: quote.connectionType || 'Residential',
      estimatedValue: val.toString(),
      estimatedCost: cost.toString(),
      installationAddress: client?.address || prev.installationAddress,
      city: client?.city || prev.city,
      state: client?.state || 'Maharashtra',
      pincode: client?.pincode || prev.pincode
    }));
  };

  // Apply lead to form data
  const applyLead = (lead: any) => {
    setSelectedQuoteObj(null);
    const cap = lead.estimatedCap || 5.0;
    const sysType = lead.systemType || 'On-Grid';

    setFormData(prev => ({
      ...prev,
      quotationId: '',
      customerId: '',
      leadId: lead.id,
      name: `${lead.name} - ${cap} kWp ${sysType} Solar Project`,
      capacity: cap.toString(),
      systemType: sysType,
      installationAddress: lead.address || '',
      city: lead.city || 'Pune',
      state: lead.state || 'Maharashtra',
      pincode: lead.pincode || '411001',
      estimatedValue: (cap * 55000).toString(),
      estimatedCost: (cap * 41000).toString()
    }));
  };

  // Apply customer to form data
  const applyCustomer = (cust: any) => {
    setSelectedQuoteObj(null);
    setFormData(prev => ({
      ...prev,
      quotationId: '',
      leadId: '',
      customerId: cust.id,
      name: `${cust.name} - 5 kWp On-Grid Solar Plant`,
      installationAddress: cust.address || '',
      city: cust.city || 'Pune',
      state: cust.state || 'Maharashtra',
      pincode: cust.pincode || '411001'
    }));
  };

  const handleModeChange = (mode: 'QUOTATION' | 'LEAD' | 'CUSTOMER' | 'SCRATCH') => {
    setCreationMode(mode);
    if (mode === 'SCRATCH') {
      setSelectedQuoteObj(null);
      setFormData(prev => ({
        ...prev,
        quotationId: '',
        customerId: '',
        leadId: '',
        name: 'Custom Solar Project'
      }));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/projects`,
        formData,
        { withCredentials: true }
      );
      router.push(`/tenant/projects/${res.data.project.id}`);
    } catch (err: any) {
      console.error(err);
      alert('Failed to create project: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Financial margin computation
  const estValNum = parseFloat(formData.estimatedValue) || 0;
  const estCostNum = parseFloat(formData.estimatedCost) || 0;
  const estProfit = Math.max(0, estValNum - estCostNum);
  const estMarginPercent = estValNum > 0 ? Math.round((estProfit / estValNum) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 w-full min-w-0">
      
      {/* TOP BREADCRUMB */}
      <button 
        onClick={() => router.push('/tenant/projects')} 
        className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
      >
        <ArrowLeft size={15} /> Back to Projects Dashboard
      </button>

      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-[#071A2B] to-[#0A3C36] p-6 sm:p-8 rounded-3xl text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Briefcase size={16} />
            </span>
            <h1 className="text-2xl font-black tracking-tight">Project Creation Studio</h1>
          </div>
          <p className="text-xs text-slate-300 mt-1.5 leading-relaxed max-w-xl">
            Convert an accepted quotation into an active solar EPC project with turnkey task scaffolding, BOM allocation, and MSEDCL DISCOM tracking.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white/10 px-3.5 py-2 rounded-2xl border border-white/10 text-xs">
          <Sun size={16} className="text-amber-400" />
          <div>
            <p className="text-[10px] text-slate-300 font-medium">Standard Setup</p>
            <p className="font-bold text-white">Turnkey Scaffolding</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* STEP 1: PROVISIONING SOURCE SELECTOR */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 uppercase tracking-wider text-[11px]">
              <Sparkles size={16} className="text-emerald-600" />
              Step 1: Choose Project Origin & Source
            </h2>
            <span className="text-[11px] font-bold text-slate-400">1-Click Auto-Fill</span>
          </div>

          {/* MODE TOGGLE TABS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => handleModeChange('QUOTATION')}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                creationMode === 'QUOTATION'
                  ? 'bg-emerald-50/80 border-emerald-500 shadow-sm ring-1 ring-emerald-500'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100/80'
              }`}
            >
              <FileText size={16} className={creationMode === 'QUOTATION' ? 'text-emerald-700' : 'text-slate-400'} />
              <div>
                <p className="text-xs font-black text-slate-900">From Quotation</p>
                <p className="text-[10px] text-slate-500">Accepted Proposal</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleModeChange('LEAD')}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                creationMode === 'LEAD'
                  ? 'bg-blue-50/80 border-blue-500 shadow-sm ring-1 ring-blue-500'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100/80'
              }`}
            >
              <Users size={16} className={creationMode === 'LEAD' ? 'text-blue-700' : 'text-slate-400'} />
              <div>
                <p className="text-xs font-black text-slate-900">From CRM Lead</p>
                <p className="text-[10px] text-slate-500">Won Sales Pipeline</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleModeChange('CUSTOMER')}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                creationMode === 'CUSTOMER'
                  ? 'bg-purple-50/80 border-purple-500 shadow-sm ring-1 ring-purple-500'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100/80'
              }`}
            >
              <User size={16} className={creationMode === 'CUSTOMER' ? 'text-purple-700' : 'text-slate-400'} />
              <div>
                <p className="text-xs font-black text-slate-900">From Customer</p>
                <p className="text-[10px] text-slate-500">Client Directory</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleModeChange('SCRATCH')}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                creationMode === 'SCRATCH'
                  ? 'bg-slate-100 border-slate-500 shadow-sm ring-1 ring-slate-500'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100/80'
              }`}
            >
              <Plus size={16} className={creationMode === 'SCRATCH' ? 'text-slate-800' : 'text-slate-400'} />
              <div>
                <p className="text-xs font-black text-slate-900">Custom / Scratch</p>
                <p className="text-[10px] text-slate-500">Direct Manual Entry</p>
              </div>
            </button>
          </div>

          {/* QUOTATION SELECTOR */}
          {creationMode === 'QUOTATION' && (
            <div className="space-y-3 pt-2">
              <label className="text-xs font-extrabold text-slate-700 block">Select Accepted or Verified Proposal *</label>
              <select
                value={formData.quotationId}
                onChange={e => {
                  const q = quotations.find(it => it.id === e.target.value);
                  if (q) applyQuotation(q);
                  else setFormData(prev => ({ ...prev, quotationId: '' }));
                }}
                className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">-- Choose a Quotation to Convert --</option>
                {quotations.map(q => {
                  const client = q.customer || q.lead;
                  return (
                    <option key={q.id} value={q.id}>
                      {q.qNumber} — {client?.name || 'Customer'} ({q.systemCapacity || 5} kWp, ₹{(q.total || 0).toLocaleString()}, Status: {q.status})
                    </option>
                  );
                })}
              </select>

              {/* SELECTED QUOTATION SUMMARY BANNER */}
              {selectedQuoteObj && (
                <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-emerald-950 flex items-center gap-1.5">
                      <CheckCircle2 size={15} className="text-emerald-600" />
                      Proposal Data Auto-Mapped
                    </span>
                    <span className="font-mono font-bold text-emerald-800 bg-white px-2 py-0.5 rounded-full border border-emerald-200">
                      {selectedQuoteObj.qNumber}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                    <div className="bg-white p-2 rounded-xl border border-emerald-100">
                      <span className="text-slate-400 block text-[10px]">Client</span>
                      <strong className="text-slate-800 font-bold">{selectedQuoteObj.customer?.name || selectedQuoteObj.lead?.name || 'Customer'}</strong>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-emerald-100">
                      <span className="text-slate-400 block text-[10px]">Capacity</span>
                      <strong className="text-slate-800 font-bold">{selectedQuoteObj.systemCapacity || 5} kWp</strong>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-emerald-100">
                      <span className="text-slate-400 block text-[10px]">Agreed Total</span>
                      <strong className="text-slate-800 font-bold">₹{(selectedQuoteObj.total || 0).toLocaleString()}</strong>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-emerald-100">
                      <span className="text-slate-400 block text-[10px]">Hardware</span>
                      <strong className="text-slate-800 font-bold">{selectedQuoteObj.panelBrand || 'Tier-1'} / {selectedQuoteObj.inverterBrand || 'Growatt'}</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* LEAD SELECTOR */}
          {creationMode === 'LEAD' && (
            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-extrabold text-slate-700 block">Select Won Lead from CRM</label>
              <select
                value={formData.leadId}
                onChange={e => {
                  const l = leads.find(it => it.id === e.target.value);
                  if (l) applyLead(l);
                  else setFormData(prev => ({ ...prev, leadId: '' }));
                }}
                className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">-- Choose a CRM Lead --</option>
                {leads.map(l => (
                  <option key={l.id} value={l.id}>
                    {l.name} — {l.city || 'Maharashtra'} ({l.estimatedCap || 5} kWp, Status: {l.status})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* CUSTOMER SELECTOR */}
          {creationMode === 'CUSTOMER' && (
            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-extrabold text-slate-700 block">Select Customer from Directory</label>
              <select
                value={formData.customerId}
                onChange={e => {
                  const c = customers.find(it => it.id === e.target.value);
                  if (c) applyCustomer(c);
                  else setFormData(prev => ({ ...prev, customerId: '' }));
                }}
                className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">-- Choose an Existing Customer --</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} — {c.mobile || c.phone || 'Phone'} ({c.city || 'Pune'})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* PROJECT TITLE */}
          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-extrabold text-slate-700 block">Project Title *</label>
            <input
              required
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Rajesh Sharma - 5kWp Residential Rooftop PV"
              className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* STEP 2: SOLAR PV SYSTEM SPECS */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 uppercase tracking-wider text-[11px]">
              <Zap size={16} className="text-amber-500" />
              Step 2: Solar Plant Engineering Specifications
            </h2>
            <span className="text-[11px] font-bold text-slate-400">Technical Scope</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-700">System Capacity (kWp) *</label>
              <div className="relative">
                <input
                  required
                  type="number"
                  step="0.1"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleChange}
                  className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-black text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 pr-12"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">kWp</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-700">System Architecture</label>
              <select
                name="systemType"
                value={formData.systemType}
                onChange={handleChange}
                className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="On-Grid">On-Grid (Net Metering)</option>
                <option value="Off-Grid">Off-Grid (Battery Energy Storage)</option>
                <option value="Hybrid">Hybrid (Grid + Battery ESS)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-700">Project Category</label>
              <select
                name="projectType"
                value={formData.projectType}
                onChange={handleChange}
                className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Residential">Residential Rooftop (PM Surya Ghar)</option>
                <option value="Commercial">Commercial & Industrial (C&I)</option>
                <option value="Agricultural">Agricultural Solar Pump / KUSUM</option>
                <option value="Housing Society">Residential Welfare Association (RWA)</option>
              </select>
            </div>
          </div>
        </div>

        {/* STEP 3: INSTALLATION SITE & LOCATION */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 uppercase tracking-wider text-[11px]">
              <MapPin size={16} className="text-blue-500" />
              Step 3: Site Installation Address & Liasoning District
            </h2>
            <span className="text-[11px] font-bold text-slate-400">Site Coordinates</span>
          </div>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-700">Installation Address Line</label>
              <input
                type="text"
                name="installationAddress"
                value={formData.installationAddress}
                onChange={handleChange}
                placeholder="e.g. Bungalow No. 12, Baner-Pashan Link Road"
                className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700">City / District</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700">State / Region</label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700">Postal Pincode</label>
                <input
                  type="text"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleChange}
                  className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* STEP 4: TIMELINE, TEAM & COMMERCIAL BUDGET */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 uppercase tracking-wider text-[11px]">
              <Calendar size={16} className="text-indigo-500" />
              Step 4: Milestones Schedule & Financial Margins
            </h2>
            <span className="text-[11px] font-bold text-slate-400">Budgeting</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-700">Project Kick-off Date</label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-700">Expected Commissioning Date</label>
              <input
                type="date"
                name="expectedCompletionDate"
                value={formData.expectedCompletionDate}
                onChange={handleChange}
                className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-700">Contract Value (Total Revenue ₹) *</label>
              <input
                required
                type="number"
                name="estimatedValue"
                value={formData.estimatedValue}
                onChange={handleChange}
                className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-black text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-700">Estimated Cost Budget (BOM & Labour ₹)</label>
              <input
                type="number"
                name="estimatedCost"
                value={formData.estimatedCost}
                onChange={handleChange}
                className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-black text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* PROJECT ENGINEER & MARGIN CHIP */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-700">Assign Lead Project Engineer</label>
              <select
                name="projectOwnerId"
                value={formData.projectOwnerId}
                onChange={handleChange}
                className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">-- Assign Solar Project Manager --</option>
                {staff.map(st => (
                  <option key={st.id} value={st.id}>
                    {st.name} ({st.role || 'Solar Operations'})
                  </option>
                ))}
              </select>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Expected Gross Margin</span>
                <strong className="text-sm font-black text-emerald-700">
                  ₹{estProfit.toLocaleString()} ({estMarginPercent}%)
                </strong>
              </div>
              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold rounded-lg">
                Target Margin
              </span>
            </div>
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.push('/tenant/projects')}
            className="px-5 py-3 rounded-xl border border-slate-200 font-bold text-xs text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs sm:text-sm transition-all shadow-lg shadow-emerald-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {loading ? 'Initializing Project...' : 'Launch Active Project'}
          </button>
        </div>

      </form>
    </div>
  );
}

export default function NewProject() {
  return (
    <Suspense fallback={
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    }>
      <NewProjectContent />
    </Suspense>
  );
}
