"use client";

import React, { useState, useMemo, useEffect } from 'react';
import axios from 'axios';
import { 
  X, Check, ChevronRight, ChevronLeft, User, Sun, 
  Zap, IndianRupee, Shield, FileText, CheckCircle2, 
  Sparkles, Layers, Sliders, AlertCircle, Building2,
  Calendar, Phone, Mail, MapPin, Percent, HelpCircle,
  Package, Compass, ArrowRight, RefreshCw, CheckCheck
} from 'lucide-react';

interface WizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  leads?: any[];
  customers?: any[];
  products?: any[];
  surveys?: any[];
  preselectedLeadId?: string;
  preselectedCustomerId?: string;
}

export function QuotationWizardModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  leads = [], 
  customers = [],
  products = [],
  surveys = [],
  preselectedLeadId,
  preselectedCustomerId
}: WizardProps) {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [customerMode, setCustomerMode] = useState<'existing' | 'new'>('existing');

  // FORM STATE
  const [formData, setFormData] = useState({
    // Step 1: Customer
    selectedType: 'lead', // 'customer' or 'lead'
    customerId: preselectedCustomerId || '',
    leadId: preselectedLeadId || '',
    newCustomer: {
      name: '',
      mobile: '',
      email: '',
      address: '',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: ''
    },

    // Step 2: System Configuration
    systemCapacity: 5.0, // kWp
    systemType: 'On-grid',
    connectionType: 'Residential',
    phase: 'Single Phase',
    roofType: 'RCC Flat Roof',
    panelProductId: '',
    panelBrand: 'Waaree',
    panelModel: '550Wp Mono PERC Bifacial',
    panelWattage: 550,
    panelQuantity: 9,
    panelWarranty: '25 Years Performance',
    inverterProductId: '',
    inverterBrand: 'Growatt',
    inverterModel: '5kW Single Phase On-Grid Inverter',
    inverterCapacity: 5.0,
    inverterQuantity: 1,
    inverterWarranty: '10 Years Replacement',
    structureBrand: 'Galvanized HDG High Rise',
    structureWarranty: '10 Years Structural',

    // Step 3: Pricing
    equipmentSubtotal: 215000,
    labourServices: 65000,
    discount: 5000,
    taxRate: 0, // Composite GST
    validityDays: 15,

    // Step 4: Terms & Milestones
    deliveryTimeline: '15 to 20 working days',
    paymentMilestones: [
      { percentage: 20, description: 'Advance booking along with signed work order' },
      { percentage: 60, description: 'Upon dispatch & delivery of modules, inverter and structure at site' },
      { percentage: 15, description: 'Upon completion of mechanical & electrical installation' },
      { percentage: 5, description: 'Upon MSEDCL Net Metering commissioning & project handover' }
    ]
  });

  // PRESETS CONFIGURATIONS (Maharashtra standard packages)
  const presets = [
    {
      id: '3kw_resi',
      label: '3 kWp Surya Ghar Resi',
      badge: 'Most Popular Resi',
      capacity: 3.0,
      panelWattage: 550,
      panelQty: 6,
      panelBrand: 'Waaree Bifacial',
      inverterBrand: 'Growatt 3kW',
      systemType: 'On-grid',
      connectionType: 'Residential',
      phase: 'Single Phase',
      equipment: 145000,
      labour: 45000,
      discount: 5000,
      indicativePrice: 185000,
      subsidy: 78000,
      netCost: 107000
    },
    {
      id: '5kw_resi',
      label: '5 kWp Premium 3BHK',
      badge: 'High ROI Resi',
      capacity: 5.0,
      panelWattage: 550,
      panelQty: 9,
      panelBrand: 'Waaree Bifacial',
      inverterBrand: 'Growatt 5kW',
      systemType: 'On-grid',
      connectionType: 'Residential',
      phase: 'Single Phase',
      equipment: 215000,
      labour: 65000,
      discount: 5000,
      indicativePrice: 275000,
      subsidy: 78000,
      netCost: 197000
    },
    {
      id: '10kw_villa',
      label: '10 kWp 3-Phase Luxury Villa',
      badge: '3-Phase High Yield',
      capacity: 10.0,
      panelWattage: 550,
      panelQty: 18,
      panelBrand: 'Waaree TOPCon',
      inverterBrand: 'Growatt 10kW 3P',
      systemType: 'On-grid',
      connectionType: 'Residential',
      phase: 'Three Phase',
      equipment: 410000,
      labour: 110000,
      discount: 10000,
      indicativePrice: 510000,
      subsidy: 78000,
      netCost: 432000
    },
    {
      id: '25kw_comm',
      label: '25 kWp Commercial LT',
      badge: 'C&I Tax Benefit',
      capacity: 25.0,
      panelWattage: 580,
      panelQty: 44,
      panelBrand: 'Adani / Vikram TOPCon',
      inverterBrand: 'Sungrow 25kW',
      systemType: 'On-grid',
      connectionType: 'Commercial',
      phase: 'Three Phase',
      equipment: 920000,
      labour: 250000,
      discount: 20000,
      indicativePrice: 1150000,
      subsidy: 0,
      netCost: 1150000
    }
  ];

  // APPLY PRESET
  const applyPreset = (preset: typeof presets[0]) => {
    setFormData(prev => ({
      ...prev,
      systemCapacity: preset.capacity,
      systemType: preset.systemType,
      connectionType: preset.connectionType,
      phase: preset.phase,
      panelBrand: preset.panelBrand,
      panelWattage: preset.panelWattage,
      panelQuantity: preset.panelQty,
      inverterBrand: preset.inverterBrand,
      inverterCapacity: preset.capacity,
      equipmentSubtotal: preset.equipment,
      labourServices: preset.labour,
      discount: preset.discount
    }));
  };

  // CHECK FOR LINKED SITE SURVEY
  const linkedSurvey = useMemo(() => {
    if (formData.selectedType === 'lead' && formData.leadId) {
      return surveys.find(s => s.leadId === formData.leadId);
    }
    if (formData.selectedType === 'customer' && formData.customerId) {
      return surveys.find(s => s.customerId === formData.customerId);
    }
    return null;
  }, [formData.selectedType, formData.leadId, formData.customerId, surveys]);

  // AUTO FILL FROM CRM SELECTION
  useEffect(() => {
    if (formData.selectedType === 'lead' && formData.leadId) {
      const lead = leads.find(l => l.id === formData.leadId);
      if (lead) {
        setFormData(prev => ({
          ...prev,
          systemCapacity: lead.estimatedCap ? Number(lead.estimatedCap) : prev.systemCapacity,
          roofType: lead.roofType || prev.roofType,
          phase: (lead.sanctionedLoad && lead.sanctionedLoad > 5) ? 'Three Phase' : prev.phase
        }));
      }
    }
  }, [formData.leadId, formData.selectedType, leads]);

  // APPLY SURVEY FINDINGS
  const handleApplySurvey = () => {
    if (!linkedSurvey) return;
    setFormData(prev => ({
      ...prev,
      systemCapacity: linkedSurvey.proposedCap ? Number(linkedSurvey.proposedCap) : prev.systemCapacity,
      roofType: linkedSurvey.roofType || prev.roofType,
      inverterCapacity: linkedSurvey.proposedCap ? Number(linkedSurvey.proposedCap) : prev.inverterCapacity,
      panelQuantity: linkedSurvey.proposedCap ? Math.ceil((Number(linkedSurvey.proposedCap) * 1000) / prev.panelWattage) : prev.panelQuantity
    }));
  };

  // SOLAR CALCULATIONS & METRICS ENGINE
  const calculations = useMemo(() => {
    const cap = Number(formData.systemCapacity) || 5;
    const subtotal = Number(formData.equipmentSubtotal) + Number(formData.labourServices);
    const discount = Number(formData.discount) || 0;
    const taxableAmount = Math.max(0, subtotal - discount);
    const tax = Math.round(taxableAmount * (Number(formData.taxRate) / 100));
    const total = taxableAmount + tax;

    // Maharashtra Solar Generation (avg 4.0 - 4.1 kWh / kWp / day -> 1,460 kWh / kWp / yr)
    const annualGeneration = Math.round(cap * 1460);
    const unitTariff = formData.connectionType === 'Residential' ? 8.5 : 10.5;
    const annualSavings = Math.round(annualGeneration * unitTariff);
    const monthlySavings = Math.round(annualSavings / 12);
    const paybackYears = annualSavings > 0 ? Number((total / annualSavings).toFixed(1)) : 4.4;
    const co2Reduction = Math.round(annualGeneration * 0.82);

    // Indicative Central Subsidy (PM Surya Ghar - Residential only)
    let indicativeSubsidy = 0;
    if (formData.connectionType === 'Residential') {
      if (cap <= 1) indicativeSubsidy = 30000;
      else if (cap <= 2) indicativeSubsidy = 60000;
      else indicativeSubsidy = 78000; // Cap at 78,000 for 3kW+
    }

    return {
      subtotal,
      discount,
      tax,
      total,
      annualGeneration,
      annualSavings,
      monthlySavings,
      paybackYears,
      co2Reduction,
      indicativeSubsidy,
      netCustomerCost: Math.max(0, total - indicativeSubsidy)
    };
  }, [formData.systemCapacity, formData.equipmentSubtotal, formData.labourServices, formData.discount, formData.taxRate, formData.connectionType]);

  // AUTO RECALCULATE PANEL QUANTITY WHEN WATTAGE OR CAPACITY CHANGES
  const handleWattageChange = (wattage: number) => {
    const qty = Math.ceil((formData.systemCapacity * 1000) / wattage);
    setFormData(prev => ({
      ...prev,
      panelWattage: wattage,
      panelQuantity: qty
    }));
  };

  const handleCapacityChange = (cap: number) => {
    const qty = Math.ceil((cap * 1000) / formData.panelWattage);
    const estEquip = Math.round(cap * 43000);
    const estLabour = Math.round(cap * 13000);
    setFormData(prev => ({
      ...prev,
      systemCapacity: cap,
      inverterCapacity: cap,
      panelQuantity: qty,
      equipmentSubtotal: estEquip,
      labourServices: estLabour
    }));
  };

  const steps = [
    { id: 1, name: 'Customer', desc: 'CRM Link & Address' },
    { id: 2, name: 'System', desc: 'Capacity & Hardware' },
    { id: 3, name: 'Pricing', desc: 'Commercials & Taxes' },
    { id: 4, name: 'Terms', desc: 'Warranties & Milestones' },
    { id: 5, name: 'Review', desc: 'Live Proposal Summary' }
  ];

  // SUBMIT HANDLER
  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload = {
        customerId: customerMode === 'existing' && formData.selectedType === 'customer' ? formData.customerId : null,
        leadId: customerMode === 'existing' && formData.selectedType === 'lead' ? formData.leadId : null,
        newCustomer: customerMode === 'new' ? formData.newCustomer : null,
        systemCapacity: formData.systemCapacity,
        systemType: formData.systemType,
        connectionType: formData.connectionType,
        phase: formData.phase,
        roofType: formData.roofType,
        panelBrand: formData.panelBrand,
        panelModel: formData.panelModel,
        panelWattage: formData.panelWattage,
        panelQuantity: formData.panelQuantity,
        panelWarranty: formData.panelWarranty,
        inverterBrand: formData.inverterBrand,
        inverterModel: formData.inverterModel,
        inverterCapacity: formData.inverterCapacity,
        inverterQuantity: formData.inverterQuantity,
        inverterWarranty: formData.inverterWarranty,
        structureBrand: formData.structureBrand,
        structureWarranty: formData.structureWarranty,
        subtotal: calculations.subtotal,
        tax: calculations.tax,
        discount: calculations.discount,
        validityDays: formData.validityDays,
        paymentMilestones: formData.paymentMilestones.map(m => ({
          percentage: m.percentage,
          amount: Math.round(calculations.total * (m.percentage / 100)),
          description: m.description
        }))
      };

      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/quotations`,
        payload,
        { withCredentials: true }
      );

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to create quotation:', err);
      alert('Error creating quotation: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#071A2B]/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        
        {/* MODAL HEADER */}
        <div className="bg-[#071A2B] text-white px-6 sm:px-8 py-5 flex items-center justify-between border-b border-white/10 flex-shrink-0">
          <div>
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-emerald-500/20 text-[#19A974] flex items-center justify-center font-bold text-sm border border-emerald-500/30">
                <Sun size={18} />
              </span>
              <div>
                <h2 className="text-xl font-black tracking-tight">Create Solar Proposal & Quotation</h2>
                <p className="text-xs text-slate-300 mt-0.5">
                  WhereReady Solar OS Guided Configuration Engine · Aligned with CRM, Surveys & Inventory
                </p>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* 1-CLICK QUICK PRESET STRIP */}
        <div className="bg-slate-900 text-white px-6 sm:px-8 py-2.5 border-b border-white/5 flex items-center gap-3 overflow-x-auto flex-shrink-0">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1.5 whitespace-nowrap">
            <Sparkles size={13} /> Quick Presets:
          </span>
          <div className="flex items-center gap-2">
            {presets.map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => applyPreset(p)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 border ${
                  formData.systemCapacity === p.capacity && formData.connectionType === p.connectionType
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                    : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
                }`}
              >
                <span>{p.label}</span>
                <span className="text-[10px] opacity-80 font-normal">₹{(p.indicativePrice / 100000).toFixed(2)}L</span>
              </button>
            ))}
          </div>
        </div>

        {/* STEP PROGRESS NAVIGATION */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 sm:px-8 py-3 flex-shrink-0">
          <div className="flex items-center justify-between max-w-3xl mx-auto">
            {steps.map((s, idx) => {
              const isPassed = currentStep > s.id;
              const isCurrent = currentStep === s.id;
              return (
                <React.Fragment key={s.id}>
                  <button
                    onClick={() => setCurrentStep(s.id)}
                    className="flex items-center gap-2.5 focus:outline-none group text-left cursor-pointer"
                  >
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isPassed 
                        ? 'bg-emerald-600 text-white' 
                        : isCurrent 
                          ? 'bg-[#071A2B] text-white ring-4 ring-emerald-500/20' 
                          : 'bg-slate-200 text-slate-500 group-hover:bg-slate-300'
                    }`}>
                      {isPassed ? <Check size={13} /> : s.id}
                    </div>
                    <div className="hidden sm:block">
                      <p className={`text-xs font-bold leading-none ${isCurrent ? 'text-slate-900' : 'text-slate-500'}`}>{s.name}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{s.desc}</p>
                    </div>
                  </button>
                  {idx < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 sm:mx-3 ${currentStep > s.id ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* BODY: FORM INPUTS + LIVE STICKY PREVIEW */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-hidden">
          
          {/* STEP FORM INPUTS (8 COLS) */}
          <div className="lg:col-span-8 p-6 sm:p-8 overflow-y-auto">
            
            {/* STEP 1: CUSTOMER SELECTION */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <User size={18} className="text-emerald-600" /> 1. Customer & Pipeline Linkage
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Connect proposal to a CRM Lead or Customer to auto-populate site address and survey specifications.</p>
                </div>

                <div className="flex gap-3 p-1 bg-slate-100 rounded-2xl w-fit">
                  <button
                    type="button"
                    onClick={() => setCustomerMode('existing')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      customerMode === 'existing' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Existing CRM Pipeline
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomerMode('new')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      customerMode === 'new' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    + New Customer
                  </button>
                </div>

                {customerMode === 'existing' ? (
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                        <input
                          type="radio"
                          name="contactType"
                          checked={formData.selectedType === 'lead'}
                          onChange={() => setFormData({ ...formData, selectedType: 'lead' })}
                          className="text-emerald-600 focus:ring-emerald-500"
                        />
                        CRM Leads ({leads.length})
                      </label>
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                        <input
                          type="radio"
                          name="contactType"
                          checked={formData.selectedType === 'customer'}
                          onChange={() => setFormData({ ...formData, selectedType: 'customer' })}
                          className="text-emerald-600 focus:ring-emerald-500"
                        />
                        Customer Directory ({customers.length})
                      </label>
                    </div>

                    {formData.selectedType === 'lead' ? (
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Select CRM Lead</label>
                        <select
                          value={formData.leadId}
                          onChange={e => setFormData({ ...formData, leadId: e.target.value })}
                          className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-xs font-semibold bg-white"
                        >
                          <option value="">-- Choose Lead from CRM --</option>
                          {leads.map(l => (
                            <option key={l.id} value={l.id}>
                              {l.name} {l.mobile ? `(${l.mobile})` : ''} - {l.city || 'MH'} {l.estimatedCap ? `[${l.estimatedCap} kWp]` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Select Customer</label>
                        <select
                          value={formData.customerId}
                          onChange={e => setFormData({ ...formData, customerId: e.target.value })}
                          className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-xs font-semibold bg-white"
                        >
                          <option value="">-- Choose Customer --</option>
                          {customers.map(c => (
                            <option key={c.id} value={c.id}>
                              {c.name} {c.mobile ? `(${c.mobile})` : ''} - {c.city || 'MH'}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* SMART LINKED SITE SURVEY BANNER */}
                    {linkedSurvey && (
                      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs flex items-center justify-between animate-in fade-in">
                        <div className="space-y-1">
                          <p className="font-extrabold text-amber-900 flex items-center gap-1.5">
                            <Compass size={14} className="text-amber-600" />
                            Linked Site Survey Available
                          </p>
                          <p className="text-slate-600 text-[11px]">
                            Proposed Capacity: <strong>{linkedSurvey.proposedCap || 5} kWp</strong> · Roof: <strong>{linkedSurvey.roofType || 'RCC Flat'}</strong>
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={handleApplySurvey}
                          className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1 shadow-sm"
                        >
                          <CheckCheck size={14} /> Apply Survey Specs
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 sm:col-span-1 space-y-1">
                      <label className="text-xs font-bold text-slate-700 uppercase">Customer Full Name *</label>
                      <input
                        type="text"
                        placeholder="e.g. Ramesh Patil"
                        value={formData.newCustomer.name}
                        onChange={e => setFormData({ ...formData, newCustomer: { ...formData.newCustomer, name: e.target.value } })}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium"
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1 space-y-1">
                      <label className="text-xs font-bold text-slate-700 uppercase">Mobile Number *</label>
                      <input
                        type="tel"
                        placeholder="+91 98220 XXXXX"
                        value={formData.newCustomer.mobile}
                        onChange={e => setFormData({ ...formData, newCustomer: { ...formData.newCustomer, mobile: e.target.value } })}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium"
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1 space-y-1">
                      <label className="text-xs font-bold text-slate-700 uppercase">Email Address</label>
                      <input
                        type="email"
                        placeholder="ramesh@example.com"
                        value={formData.newCustomer.email}
                        onChange={e => setFormData({ ...formData, newCustomer: { ...formData.newCustomer, email: e.target.value } })}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium"
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1 space-y-1">
                      <label className="text-xs font-bold text-slate-700 uppercase">City / District (Maharashtra)</label>
                      <input
                        type="text"
                        placeholder="Pune / Mumbai / Nashik"
                        value={formData.newCustomer.city}
                        onChange={e => setFormData({ ...formData, newCustomer: { ...formData.newCustomer, city: e.target.value } })}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium"
                      />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <label className="text-xs font-bold text-slate-700 uppercase">Installation Site Roof Address</label>
                      <input
                        type="text"
                        placeholder="House No, Society, Landmark, Pune - 411038"
                        value={formData.newCustomer.address}
                        onChange={e => setFormData({ ...formData, newCustomer: { ...formData.newCustomer, address: e.target.value } })}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: SYSTEM CONFIGURATION & HARDWARE BOM */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Sun size={18} className="text-amber-500" /> 2. System Configuration & Hardware
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Specify capacity, module ratings, inverter technology, and mounting structure.</p>
                </div>

                {/* CAPACITY SLIDER & INPUT */}
                <div className="p-5 rounded-2xl bg-amber-50/60 border border-amber-200/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-black uppercase text-amber-900 tracking-wider">System Capacity (kWp)</label>
                      <p className="text-[11px] text-amber-700">Slide to auto-recalculate panel quantity & equipment costs</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.5"
                        min="1"
                        max="100"
                        value={formData.systemCapacity}
                        onChange={e => handleCapacityChange(Number(e.target.value))}
                        className="w-20 px-2 py-1 text-right bg-white rounded-xl border border-amber-300 font-black text-lg text-[#071A2B]"
                      />
                      <span className="font-bold text-slate-600 text-xs">kWp</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    step="0.5"
                    value={formData.systemCapacity}
                    onChange={e => handleCapacityChange(Number(e.target.value))}
                    className="w-full accent-emerald-600 cursor-pointer h-2 bg-amber-200 rounded-lg"
                  />
                  <div className="flex justify-between text-[11px] font-bold text-amber-800">
                    <span>1 kWp (Small)</span>
                    <span>3 kWp (Surya Ghar)</span>
                    <span>5 kWp (Standard 3BHK)</span>
                    <span>10 kWp (Villa)</span>
                    <span>50 kWp (C&I)</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 uppercase">System Type</label>
                    <select
                      value={formData.systemType}
                      onChange={e => setFormData({ ...formData, systemType: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-white"
                    >
                      <option value="On-grid">On-grid (Net Metering)</option>
                      <option value="Hybrid">Hybrid (Battery Backup)</option>
                      <option value="Off-grid">Off-grid (Independent)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 uppercase">Tariff Category</label>
                    <select
                      value={formData.connectionType}
                      onChange={e => setFormData({ ...formData, connectionType: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-white"
                    >
                      <option value="Residential">Residential (LT-1)</option>
                      <option value="Commercial">Commercial (LT-2)</option>
                      <option value="Industrial">Industrial (HT/LT)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 uppercase">Grid Phase</label>
                    <select
                      value={formData.phase}
                      onChange={e => setFormData({ ...formData, phase: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-white"
                    >
                      <option value="Single Phase">Single Phase (230V)</option>
                      <option value="Three Phase">Three Phase (415V)</option>
                    </select>
                  </div>

                  <div className="space-y-1 col-span-2 sm:col-span-3">
                    <label className="text-xs font-bold text-slate-700 uppercase">Rooftop Architecture</label>
                    <select
                      value={formData.roofType}
                      onChange={e => setFormData({ ...formData, roofType: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-white"
                    >
                      <option value="RCC Flat Roof">RCC Flat Roof (Standard South Facing)</option>
                      <option value="Tin Shed / Metal Sheet">Tin Shed / Industrial Metal Sheet</option>
                      <option value="Elevated Super Structure">Elevated Super Structure (Terrace Gazebo / High Rise)</option>
                      <option value="Mangalore Tile Sloped">Mangalore Tile Sloped Roof</option>
                    </select>
                  </div>
                </div>

                {/* HARDWARE BOM SELECTION */}
                <div className="border-t border-slate-100 pt-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Package size={15} className="text-emerald-600" />
                      Hardware BOM Specifications
                    </h4>
                    <span className="text-[11px] text-slate-400">Inventory Aligned</span>
                  </div>
                  
                  {/* SOLAR MODULES */}
                  <div className="grid grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 uppercase">Module Make</label>
                      <input
                        type="text"
                        value={formData.panelBrand}
                        onChange={e => setFormData({ ...formData, panelBrand: e.target.value })}
                        className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 text-xs font-bold"
                        placeholder="Waaree / Vikram"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 uppercase">Wattage</label>
                      <select
                        value={formData.panelWattage}
                        onChange={e => handleWattageChange(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 text-xs font-bold"
                      >
                        <option value="540">540 Wp Mono</option>
                        <option value="550">550 Wp Bifacial</option>
                        <option value="570">570 Wp TOPCon</option>
                        <option value="600">600 Wp TOPCon</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 uppercase">Module Count</label>
                      <input
                        type="number"
                        value={formData.panelQuantity}
                        onChange={e => setFormData({ ...formData, panelQuantity: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 text-xs font-bold"
                      />
                    </div>
                  </div>

                  {/* INVERTER */}
                  <div className="grid grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 uppercase">Inverter Brand</label>
                      <input
                        type="text"
                        value={formData.inverterBrand}
                        onChange={e => setFormData({ ...formData, inverterBrand: e.target.value })}
                        className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 text-xs font-bold"
                        placeholder="Growatt / Solis"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 uppercase">Capacity</label>
                      <input
                        type="text"
                        value={`${formData.inverterCapacity} kW`}
                        disabled
                        className="w-full px-3 py-2 bg-slate-100 rounded-lg border border-slate-200 text-xs font-bold text-slate-600"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 uppercase">Warranty</label>
                      <input
                        type="text"
                        value={formData.inverterWarranty}
                        onChange={e => setFormData({ ...formData, inverterWarranty: e.target.value })}
                        className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 text-xs font-bold"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: PRICING & COMMERCIALS */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <IndianRupee size={18} className="text-emerald-600" /> 3. Commercial Pricing & Tax Treatment
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Itemize equipment costs, installation/liasoning charges, discounts, and GST tax treatment.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 uppercase">Equipment Subtotal (₹)</label>
                    <input
                      type="number"
                      value={formData.equipmentSubtotal}
                      onChange={e => setFormData({ ...formData, equipmentSubtotal: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-900"
                    />
                    <p className="text-[10px] text-slate-400">Panels, inverter, structure, ACDB/DCDB, cables</p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 uppercase">Installation & Liasoning (₹)</label>
                    <input
                      type="number"
                      value={formData.labourServices}
                      onChange={e => setFormData({ ...formData, labourServices: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-900"
                    />
                    <p className="text-[10px] text-slate-400">Civil mounting, wiring, earthing, MSEDCL net meter</p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 uppercase">Special Discount (₹)</label>
                    <input
                      type="number"
                      value={formData.discount}
                      onChange={e => setFormData({ ...formData, discount: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-emerald-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 uppercase">GST Tax Treatment</label>
                    <select
                      value={formData.taxRate}
                      onChange={e => setFormData({ ...formData, taxRate: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-white"
                    >
                      <option value="0">0% (Inclusive in line items)</option>
                      <option value="13.8">13.8% (Composite Solar GST: 70% @ 12% + 30% @ 18%)</option>
                      <option value="18">18% (Standard Services GST)</option>
                      <option value="5">5% (Concessional)</option>
                    </select>
                  </div>
                </div>

                {/* CONDITIONAL SUBSIDY CALLOUT */}
                <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-xs space-y-1.5">
                  <div className="flex items-center justify-between text-emerald-900 font-bold">
                    <span className="flex items-center gap-1.5">
                      <Sparkles size={14} className="text-emerald-600" />
                      Indicative PM Surya Ghar Central Subsidy
                    </span>
                    <span className="text-sm font-black text-emerald-700">₹{calculations.indicativeSubsidy.toLocaleString()}</span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Conditional central subsidy credited directly by MNRE/DISCOM to the consumer bank account. <strong>This is not deducted from the vendor invoice payable.</strong>
                  </p>
                </div>
              </div>
            )}

            {/* STEP 4: TERMS & MILESTONES */}
            {currentStep === 4 && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Shield size={18} className="text-indigo-600" /> 4. Payment Schedule & Commitments
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Staged milestone payment terms and contractual warranty obligations.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 uppercase">Quotation Validity (Days)</label>
                    <input
                      type="number"
                      value={formData.validityDays}
                      onChange={e => setFormData({ ...formData, validityDays: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-900"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 uppercase">Expected Delivery & Commissioning</label>
                    <input
                      type="text"
                      value={formData.deliveryTimeline}
                      onChange={e => setFormData({ ...formData, deliveryTimeline: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-900"
                    />
                  </div>
                </div>

                {/* MILESTONE SCHEDULE */}
                <div className="space-y-3">
                  <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                    <span>Payment Milestone Schedule</span>
                    <span className="text-slate-400 font-medium lowercase">Total 100%</span>
                  </h4>

                  <div className="space-y-2">
                    {formData.paymentMilestones.map((m, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                        <span className="w-12 px-2 py-1 bg-[#071A2B] text-white rounded-lg text-center font-bold">
                          {m.percentage}%
                        </span>
                        <input
                          type="text"
                          value={m.description}
                          onChange={e => {
                            const updated = [...formData.paymentMilestones];
                            updated[idx].description = e.target.value;
                            setFormData({ ...formData, paymentMilestones: updated });
                          }}
                          className="flex-1 bg-transparent font-medium text-slate-700 outline-none"
                        />
                        <span className="font-bold text-slate-900">
                          ₹{Math.round(calculations.total * (m.percentage / 100)).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* WARRANTIES */}
                <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Contractual Warranty Obligations</h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-white rounded-xl border border-slate-200">
                      <p className="font-bold text-slate-800">Solar PV Modules</p>
                      <p className="text-slate-500 mt-0.5">25 Years OEM Performance (min 80% generation)</p>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-slate-200">
                      <p className="font-bold text-slate-800">Solar Inverter</p>
                      <p className="text-slate-500 mt-0.5">10 Years Replacement / Repair Warranty</p>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-slate-200">
                      <p className="font-bold text-slate-800">Mounting Structure</p>
                      <p className="text-slate-500 mt-0.5">10 Years Hot-Dip Galvanized Structural Integrity</p>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-slate-200">
                      <p className="font-bold text-slate-800">Workmanship</p>
                      <p className="text-slate-500 mt-0.5">5 Years Turnkey Installation & Liasoning</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 5: REVIEW & SUMMARY */}
            {currentStep === 5 && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <CheckCircle2 size={18} className="text-emerald-600" /> 5. Final Proposal Summary
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Review configuration before generating proposal PDF and linking to CRM pipeline.</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer Details</span>
                    <p className="font-bold text-sm text-slate-900">
                      {customerMode === 'new' 
                        ? (formData.newCustomer.name || 'New Customer')
                        : formData.selectedType === 'customer'
                          ? (customers.find(c => c.id === formData.customerId)?.name || 'Selected Customer')
                          : (leads.find(l => l.id === formData.leadId)?.name || 'Selected Lead')}
                    </p>
                    <p className="text-slate-600">{formData.systemCapacity} kWp · {formData.systemType} ({formData.connectionType})</p>
                    <p className="text-slate-500">{formData.roofType} · {formData.phase}</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hardware BOM Summary</span>
                    <p className="font-bold text-sm text-slate-900">{formData.panelBrand} ({formData.panelQuantity} Panels × {formData.panelWattage}W)</p>
                    <p className="text-slate-600">{formData.inverterBrand} {formData.inverterCapacity}kW Inverter</p>
                    <p className="text-slate-500">{formData.structureBrand}</p>
                  </div>
                </div>

                {/* FINANCIAL ROI BOX */}
                <div className="p-5 rounded-2xl bg-[#071A2B] text-white space-y-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">Solar Financial Projection (Maharashtra 25 Years)</p>
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Annual Output</p>
                      <p className="text-xl font-bold text-white mt-1">{calculations.annualGeneration.toLocaleString()} <span className="text-xs font-normal">kWh</span></p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Annual Savings</p>
                      <p className="text-xl font-bold text-emerald-400 mt-1">₹{calculations.annualSavings.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Payback Period</p>
                      <p className="text-xl font-bold text-amber-400 mt-1">{calculations.paybackYears} <span className="text-xs font-normal">Yrs</span></p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">CO₂ Offset</p>
                      <p className="text-xl font-bold text-white mt-1">{(calculations.co2Reduction / 1000).toFixed(1)} <span className="text-xs font-normal">T/Yr</span></p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* LIVE STICKY PREVIEW SIDEBAR (4 COLS) */}
          <div className="lg:col-span-4 bg-slate-50 border-t lg:border-t-0 lg:border-l border-slate-200 p-6 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Live Proposal Preview</span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                  {formData.systemType}
                </span>
              </div>

              {/* TOTAL AMOUNT CARD */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Quotation Total Payable</span>
                <div className="text-3xl font-black text-[#071A2B]">
                  ₹{calculations.total.toLocaleString()}
                </div>
                {calculations.discount > 0 && (
                  <p className="text-xs font-bold text-emerald-600">Includes −₹{calculations.discount.toLocaleString()} special discount</p>
                )}
              </div>

              {/* EFFECTIVE CUSTOMER COST */}
              {calculations.indicativeSubsidy > 0 && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs">
                  <div className="flex justify-between items-center text-emerald-900 font-bold mb-0.5">
                    <span>Central Subsidy (PM Surya Ghar)</span>
                    <span>₹{calculations.indicativeSubsidy.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-700 font-medium">
                    <span>Effective Net Customer Outflow</span>
                    <span className="font-bold text-[#071A2B]">₹{calculations.netCustomerCost.toLocaleString()}</span>
                  </div>
                </div>
              )}

              {/* SYSTEM HIGHLIGHTS */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2.5 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-500">System Capacity</span>
                  <span className="font-bold text-slate-800">{formData.systemCapacity} kWp</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-500">Solar Modules</span>
                  <span className="font-bold text-slate-800">{formData.panelQuantity} Panels ({formData.panelWattage}W)</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-500">Inverter</span>
                  <span className="font-bold text-slate-800">{formData.inverterBrand} {formData.inverterCapacity}kW</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-500">Est. Generation</span>
                  <span className="font-bold text-slate-800">{calculations.annualGeneration.toLocaleString()} kWh/yr</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500">Payback Period</span>
                  <span className="font-bold text-emerald-700">{calculations.paybackYears} Years</span>
                </div>
              </div>
            </div>

            {/* NAVIGATION BUTTONS */}
            <div className="pt-6 border-t border-slate-200 flex gap-2.5 mt-4">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={() => setCurrentStep(prev => prev - 1)}
                  className="px-4 py-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <ChevronLeft size={16} /> Prev
                </button>
              )}
              
              {currentStep < 5 ? (
                <button
                  type="button"
                  onClick={() => setCurrentStep(prev => prev + 1)}
                  className="flex-1 py-3 bg-[#071A2B] hover:bg-[#0B2942] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  Next Step <ChevronRight size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleSubmit}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50"
                >
                  {loading ? 'Creating Proposal...' : 'Create & Link Proposal'} <Check size={16} />
                </button>
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
