"use client";

import React, { useState, useMemo } from 'react';
import axios from 'axios';
import { 
  X, Check, ChevronRight, ChevronLeft, User, Sun, 
  Zap, IndianRupee, Shield, FileText, CheckCircle2, 
  Sparkles, Layers, Sliders, AlertCircle, Building2,
  Calendar, Phone, Mail, MapPin, Percent, HelpCircle
} from 'lucide-react';

interface WizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  leads: any[];
  customers: any[];
}

export function QuotationWizardModal({ isOpen, onClose, onSuccess, leads = [], customers = [] }: WizardProps) {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [customerMode, setCustomerMode] = useState<'existing' | 'new'>('existing');

  // FORM STATE
  const [formData, setFormData] = useState({
    // Step 1: Customer
    selectedType: 'customer', // 'customer' or 'lead'
    customerId: '',
    leadId: '',
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
    panelBrand: 'Waaree',
    panelModel: '550Wp Mono PERC Bifacial',
    panelWattage: 550,
    panelQuantity: 9, // Math.ceil(5000 / 550) = 10 or 9
    panelWarranty: '25 Years Performance',
    inverterBrand: 'Growatt',
    inverterModel: '5kW Single Phase On-Grid Inverter',
    inverterCapacity: 5.0,
    inverterQuantity: 1,
    inverterWarranty: '10 Years Replacement',
    structureBrand: 'Galvanized HDG High Rise',
    structureWarranty: '10 Years Structural',

    // Step 3: Pricing
    equipmentSubtotal: 220000,
    labourServices: 60000,
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

  // SOLAR CALCULATIONS & METRICS ENGINE
  const calculations = useMemo(() => {
    const cap = Number(formData.systemCapacity) || 5;
    const subtotal = Number(formData.equipmentSubtotal) + Number(formData.labourServices);
    const discount = Number(formData.discount) || 0;
    const taxableAmount = Math.max(0, subtotal - discount);
    const tax = Math.round(taxableAmount * (Number(formData.taxRate) / 100));
    const total = taxableAmount + tax;

    // Maharashtra Solar Generation (avg 4.0 - 4.1 kWh / kWp / day)
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
      else indicativeSubsidy = 78000;
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

  // Handle panel wattage change -> auto calculate panel quantity
  const handleWattageChange = (wattage: number) => {
    const qty = Math.ceil((formData.systemCapacity * 1000) / wattage);
    setFormData(prev => ({
      ...prev,
      panelWattage: wattage,
      panelQuantity: qty
    }));
  };

  // Handle capacity change -> auto suggest equipment price & panel qty
  const handleCapacityChange = (cap: number) => {
    const qty = Math.ceil((cap * 1000) / formData.panelWattage);
    // Standard rule of thumb in MH: approx ₹44k-₹55k per kWp
    const estEquip = Math.round(cap * 44000);
    const estLabour = Math.round(cap * 12000);
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
    { id: 1, name: 'Customer', desc: 'Select or add customer' },
    { id: 2, name: 'System', desc: 'System specs & hardware' },
    { id: 3, name: 'Pricing', desc: 'Equipment, tax & milestones' },
    { id: 4, name: 'Terms', desc: 'Warranties & delivery' },
    { id: 5, name: 'Review', desc: 'Live preview & proposal' }
  ];

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
    <div className="fixed inset-0 z-50 bg-[#071A2B]/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* MODAL HEADER */}
        <div className="bg-[#071A2B] text-white px-8 py-6 flex items-center justify-between border-b border-white/10">
          <div>
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-emerald-500/20 text-[#19A974] flex items-center justify-center font-bold text-sm border border-emerald-500/30">
                <Sun size={18} />
              </span>
              <h2 className="text-xl font-bold tracking-tight">Create Solar Proposal & Quotation</h2>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Configure system specifications, calculate commercial ROI, and generate a branded proposal.
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* STEP PROGRESS BAR */}
        <div className="bg-slate-50 border-b border-slate-200 px-8 py-3">
          <div className="flex items-center justify-between max-w-3xl mx-auto">
            {steps.map((s, idx) => {
              const isPassed = currentStep > s.id;
              const isCurrent = currentStep === s.id;
              return (
                <React.Fragment key={s.id}>
                  <button
                    onClick={() => setCurrentStep(s.id)}
                    className="flex items-center gap-2.5 focus:outline-none group text-left"
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isPassed 
                        ? 'bg-emerald-600 text-white' 
                        : isCurrent 
                          ? 'bg-[#071A2B] text-white ring-4 ring-emerald-500/20' 
                          : 'bg-slate-200 text-slate-500 group-hover:bg-slate-300'
                    }`}>
                      {isPassed ? <Check size={14} /> : s.id}
                    </div>
                    <div className="hidden sm:block">
                      <p className={`text-xs font-bold leading-none ${isCurrent ? 'text-slate-900' : 'text-slate-500'}`}>{s.name}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{s.desc}</p>
                    </div>
                  </button>
                  {idx < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-3 ${currentStep > s.id ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* BODY: FORM CONTENT + LIVE PREVIEW SIDEBAR */}
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[520px]">
          
          {/* STEP FORM INPUTS (8 COLS) */}
          <div className="lg:col-span-8 p-8 max-h-[620px] overflow-y-auto">
            
            {/* STEP 1: CUSTOMER SELECTION */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <User size={18} className="text-emerald-600" /> 1. Select or Create Customer
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Attach this proposal to an existing CRM lead/customer or input fresh client details.</p>
                </div>

                <div className="flex gap-4 p-1 bg-slate-100 rounded-2xl w-fit">
                  <button
                    type="button"
                    onClick={() => setCustomerMode('existing')}
                    className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                      customerMode === 'existing' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Existing CRM Contact
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomerMode('new')}
                    className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
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
                          checked={formData.selectedType === 'customer'}
                          onChange={() => setFormData({ ...formData, selectedType: 'customer' })}
                          className="text-emerald-600 focus:ring-emerald-500"
                        />
                        Customer Directory ({customers.length})
                      </label>
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
                    </div>

                    {formData.selectedType === 'customer' ? (
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Select Customer</label>
                        <select
                          value={formData.customerId}
                          onChange={e => setFormData({ ...formData, customerId: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-medium bg-white"
                        >
                          <option value="">-- Choose an existing customer --</option>
                          {customers.map(c => (
                            <option key={c.id} value={c.id}>{c.name} {c.mobile ? `(${c.mobile})` : ''} - {c.city || 'MH'}</option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Select CRM Lead</label>
                        <select
                          value={formData.leadId}
                          onChange={e => setFormData({ ...formData, leadId: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-medium bg-white"
                        >
                          <option value="">-- Choose an existing lead --</option>
                          {leads.map(l => (
                            <option key={l.id} value={l.id}>{l.name} {l.phone || l.mobile ? `(${l.phone || l.mobile})` : ''} - {l.city || 'MH'}</option>
                          ))}
                        </select>
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
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1 space-y-1">
                      <label className="text-xs font-bold text-slate-700 uppercase">Mobile Number *</label>
                      <input
                        type="tel"
                        placeholder="+91 98220 XXXXX"
                        value={formData.newCustomer.mobile}
                        onChange={e => setFormData({ ...formData, newCustomer: { ...formData.newCustomer, mobile: e.target.value } })}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1 space-y-1">
                      <label className="text-xs font-bold text-slate-700 uppercase">Email Address</label>
                      <input
                        type="email"
                        placeholder="ramesh@example.com"
                        value={formData.newCustomer.email}
                        onChange={e => setFormData({ ...formData, newCustomer: { ...formData.newCustomer, email: e.target.value } })}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1 space-y-1">
                      <label className="text-xs font-bold text-slate-700 uppercase">City / District (Maharashtra)</label>
                      <input
                        type="text"
                        placeholder="Pune / Mumbai / Nashik"
                        value={formData.newCustomer.city}
                        onChange={e => setFormData({ ...formData, newCustomer: { ...formData.newCustomer, city: e.target.value } })}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                      />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <label className="text-xs font-bold text-slate-700 uppercase">Installation Site Roof Address</label>
                      <input
                        type="text"
                        placeholder="House No, Society, Landmark, Pune - 411038"
                        value={formData.newCustomer.address}
                        onChange={e => setFormData({ ...formData, newCustomer: { ...formData.newCustomer, address: e.target.value } })}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: SYSTEM CONFIGURATION */}
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
                    <label className="text-xs font-black uppercase text-amber-900 tracking-wider">System Capacity (kWp)</label>
                    <span className="text-2xl font-black text-[#071A2B]">{formData.systemCapacity} kWp</span>
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
                    <span>1 kWp (Small Resi)</span>
                    <span>3 kWp (Standard Resi)</span>
                    <span>5 kWp (Standard 3BHK)</span>
                    <span>10 kWp (Villa / Small C&I)</span>
                    <span>50 kWp</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 uppercase">System Type</label>
                    <select
                      value={formData.systemType}
                      onChange={e => setFormData({ ...formData, systemType: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold bg-white"
                    >
                      <option value="On-grid">On-grid (Grid-Tied)</option>
                      <option value="Hybrid">Hybrid (Battery Backup)</option>
                      <option value="Off-grid">Off-grid (Independent)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 uppercase">Tariff Category</label>
                    <select
                      value={formData.connectionType}
                      onChange={e => setFormData({ ...formData, connectionType: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold bg-white"
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
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold bg-white"
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
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold bg-white"
                    >
                      <option value="RCC Flat Roof">RCC Flat Roof (Standard South Facing)</option>
                      <option value="Tin Shed / Metal Sheet">Tin Shed / Industrial Metal Sheet</option>
                      <option value="Elevated Super Structure">Elevated Super Structure (Balcony/Terrace Gazebo)</option>
                      <option value="Mangalore Tile Sloped">Mangalore Tile Sloped Roof</option>
                    </select>
                  </div>
                </div>

                {/* HARDWARE DETAILS */}
                <div className="border-t border-slate-100 pt-4 space-y-4">
                  <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Hardware & BOM Components</h4>
                  
                  <div className="grid grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 uppercase">Panel Make</label>
                      <input
                        type="text"
                        value={formData.panelBrand}
                        onChange={e => setFormData({ ...formData, panelBrand: e.target.value })}
                        className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 text-xs font-bold"
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
                        <option value="580">580 Wp TOPCon</option>
                        <option value="600">600 Wp TOPCon</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 uppercase">Module Qty</label>
                      <input
                        type="number"
                        value={formData.panelQuantity}
                        onChange={e => setFormData({ ...formData, panelQuantity: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 text-xs font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 uppercase">Inverter Make</label>
                      <input
                        type="text"
                        value={formData.inverterBrand}
                        onChange={e => setFormData({ ...formData, inverterBrand: e.target.value })}
                        className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 text-xs font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 uppercase">Inverter Rating</label>
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
                    <IndianRupee size={18} className="text-emerald-600" /> 3. Commercial Pricing & Milestones
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Itemized equipment costs, labour charges, tax treatment, and staged payment schedules.</p>
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
                    <p className="text-[10px] text-slate-400">Modules, inverters, structure, ACDB/DCDB, cables</p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 uppercase">Installation & Labour (₹)</label>
                    <input
                      type="number"
                      value={formData.labourServices}
                      onChange={e => setFormData({ ...formData, labourServices: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-900"
                    />
                    <p className="text-[10px] text-slate-400">Civil mounting, wiring, earthing, DISCOM liasoning</p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 uppercase">Discount (₹)</label>
                    <input
                      type="number"
                      value={formData.discount}
                      onChange={e => setFormData({ ...formData, discount: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-emerald-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 uppercase">Applicable GST Rate</label>
                    <select
                      value={formData.taxRate}
                      onChange={e => setFormData({ ...formData, taxRate: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 bg-white"
                    >
                      <option value="0">0% (Inclusive in subtotal)</option>
                      <option value="13.8">13.8% (Solar Composite GST: 70% @ 12% + 30% @ 18%)</option>
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
                      PM Surya Ghar Central Subsidy (Indicative Estimate)
                    </span>
                    <span className="text-sm font-black text-emerald-700">₹{calculations.indicativeSubsidy.toLocaleString()}</span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Eligible for residential rooftop systems up to 3 kWp in Maharashtra. Subsidies are conditional estimates credited directly by MNRE/DISCOM to the consumer account. <strong>They are not guaranteed deductions from vendor price.</strong>
                  </p>
                </div>

                {/* PAYMENT MILESTONES */}
                <div className="space-y-3">
                  <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                    <span>Payment Milestones</span>
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
              </div>
            )}

            {/* STEP 4: TERMS & WARRANTIES */}
            {currentStep === 4 && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Shield size={18} className="text-indigo-600" /> 4. Warranties, Delivery & Terms
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Define proposal validity, installation timeframe, and contractual warranties.</p>
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
                    <label className="text-xs font-bold text-slate-700 uppercase">Delivery & Commissioning Timeline</label>
                    <input
                      type="text"
                      value={formData.deliveryTimeline}
                      onChange={e => setFormData({ ...formData, deliveryTimeline: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-900"
                    />
                  </div>
                </div>

                <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Standard Warranty Commitments</h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-white rounded-xl border border-slate-200">
                      <p className="font-bold text-slate-800">Solar PV Modules</p>
                      <p className="text-slate-500 mt-0.5">25 Years OEM Performance Warranty (min 80% output)</p>
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
                      <p className="font-bold text-slate-800">Workmanship & AMC</p>
                      <p className="text-slate-500 mt-0.5">5 Years Comprehensive Workmanship & Support</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 5: REVIEW & FINAL SUMMARY */}
            {currentStep === 5 && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <CheckCircle2 size={18} className="text-emerald-600" /> 5. Final Proposal Summary
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Confirm system configuration and commercial details before generating the proposal.</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Client & System</span>
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
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hardware BOM</span>
                    <p className="font-bold text-sm text-slate-900">{formData.panelBrand} ({formData.panelQuantity} Panels × {formData.panelWattage}W)</p>
                    <p className="text-slate-600">{formData.inverterBrand} {formData.inverterCapacity}kW Inverter</p>
                    <p className="text-slate-500">{formData.structureBrand}</p>
                  </div>
                </div>

                {/* FINANCIAL ROI BOX */}
                <div className="p-5 rounded-2xl bg-[#071A2B] text-white space-y-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">Solar Financial Projection (25 Years)</p>
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Annual Generation</p>
                      <p className="text-xl font-bold text-white mt-1">{calculations.annualGeneration.toLocaleString()} <span className="text-xs font-normal">kWh</span></p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Annual Bill Savings</p>
                      <p className="text-xl font-bold text-emerald-400 mt-1">₹{calculations.annualSavings.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Payback Period</p>
                      <p className="text-xl font-bold text-amber-400 mt-1">{calculations.paybackYears} <span className="text-xs font-normal">Years</span></p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">CO₂ Offset</p>
                      <p className="text-xl font-bold text-white mt-1">{(calculations.co2Reduction / 1000).toFixed(1)} <span className="text-xs font-normal">Tons/Yr</span></p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* LIVE PREVIEW SIDEBAR (4 COLS) */}
          <div className="lg:col-span-4 bg-slate-50 border-t lg:border-t-0 lg:border-l border-slate-200 p-6 flex flex-col justify-between">
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Live Preview</span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                  {formData.systemType}
                </span>
              </div>

              {/* TOTAL AMOUNT CARD */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Illustrative Quotation Total</span>
                <div className="text-3xl font-black text-[#071A2B]">
                  ₹{calculations.total.toLocaleString()}
                </div>
                {calculations.discount > 0 && (
                  <p className="text-xs font-bold text-emerald-600">Includes −₹{calculations.discount.toLocaleString()} special discount</p>
                )}
              </div>

              {/* SYSTEM HIGHLIGHTS */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-500">System Capacity</span>
                  <span className="font-bold text-slate-800">{formData.systemCapacity} kWp</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-500">Configuration</span>
                  <span className="font-bold text-slate-800">{formData.systemType}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-500">Panels</span>
                  <span className="font-bold text-slate-800">{formData.panelQuantity} Modules ({formData.panelWattage}W)</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-500">Discount</span>
                  <span className="font-bold text-emerald-600">−₹{calculations.discount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-500">Tax</span>
                  <span className="font-bold text-slate-800">₹{calculations.tax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500">Indicative Subsidy</span>
                  <span className="font-bold text-emerald-700">₹{calculations.indicativeSubsidy.toLocaleString()}</span>
                </div>
              </div>

              {/* ESTIMATED SAVINGS */}
              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-emerald-800 font-bold uppercase">Est. Monthly Savings</p>
                  <p className="text-lg font-black text-emerald-700">₹{calculations.monthlySavings.toLocaleString()}/mo</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-emerald-800 font-bold uppercase">Payback</p>
                  <p className="text-lg font-black text-emerald-700">{calculations.paybackYears} Yrs</p>
                </div>
              </div>
            </div>

            {/* NAVIGATION BUTTONS */}
            <div className="pt-6 border-t border-slate-200 flex gap-3">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={() => setCurrentStep(prev => prev - 1)}
                  className="px-4 py-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <ChevronLeft size={16} /> Previous
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
                  {loading ? 'Generating...' : 'Save & Review Proposal'} <Check size={16} />
                </button>
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
