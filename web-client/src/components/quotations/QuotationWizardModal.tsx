"use client";

import React, { useState, useMemo, useEffect } from 'react';
import axios from 'axios';
import { 
  X, Check, ChevronRight, ChevronLeft, User, Sun, 
  Zap, IndianRupee, Shield, FileText, CheckCircle2, 
  Sparkles, Layers, Sliders, AlertCircle, Building2,
  Calendar, Phone, Mail, MapPin, Percent, HelpCircle,
  Package, Compass, ArrowRight, RefreshCw, CheckCheck,
  Trash2, Plus, Search, CheckCircle, Home, CheckSquare,
  Award, Clock, ArrowDownRight, Layers2, Maximize2,
  Minimize2, FileCheck
} from 'lucide-react';

export interface WizardLineItem {
  id: string;
  productId?: string;
  category: 'MODULE' | 'INVERTER' | 'STRUCTURE' | 'BOS' | 'SERVICES' | 'CUSTOM';
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  total: number;
}

export const generateDefaultLineItems = (
  capacity: number,
  panelBrand: string,
  panelWattage: number,
  panelQty: number,
  inverterBrand: string,
  structureBrand: string
): WizardLineItem[] => {
  const cap = Number(capacity) || 5;
  const equipBudget = Math.round(cap * 43000);
  const labourBudget = Math.round(cap * 13000);

  const moduleTotal = Math.round(equipBudget * 0.58);
  const invTotal = Math.round(equipBudget * 0.24);
  const structTotal = Math.round(equipBudget * 0.10);
  const bosTotal = Math.max(5000, equipBudget - moduleTotal - invTotal - structTotal);

  return [
    {
      id: 'item-1',
      category: 'MODULE',
      description: `${panelBrand || 'Waaree'} ${panelWattage || 550}Wp Mono PERC Bifacial Solar PV Modules (ALMM Approved)`,
      quantity: panelQty || 9,
      unitPrice: Math.round(moduleTotal / (panelQty || 9)),
      taxRate: 12,
      total: moduleTotal
    },
    {
      id: 'item-2',
      category: 'INVERTER',
      description: `${inverterBrand || 'Growatt'} ${cap}kW High-Efficiency On-Grid Solar String Inverter (IP65)`,
      quantity: 1,
      unitPrice: invTotal,
      taxRate: 12,
      total: invTotal
    },
    {
      id: 'item-3',
      category: 'STRUCTURE',
      description: `${structureBrand || 'Galvanized HDG High Rise'} Solar Module Mounting Structure`,
      quantity: 1,
      unitPrice: structTotal,
      taxRate: 18,
      total: structTotal
    },
    {
      id: 'item-4',
      category: 'BOS',
      description: `Balance of System: 4 sq.mm DC Solar Cables, ACDB/DCDB with Type-II SPDs, Dual Earthing & LA`,
      quantity: 1,
      unitPrice: bosTotal,
      taxRate: 18,
      total: bosTotal
    },
    {
      id: 'item-5',
      category: 'SERVICES',
      description: `Turnkey Installation, Testing, MSEDCL Net Metering Liasoning & Commissioning`,
      quantity: 1,
      unitPrice: labourBudget,
      taxRate: 18,
      total: labourBudget
    }
  ];
};

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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [customerMode, setCustomerMode] = useState<'leads' | 'customers' | 'new'>('leads');
  const [customerSearch, setCustomerSearch] = useState('');

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

    // Step 3: Single All-Inclusive Pricing (All GST Included)
    totalSystemCost: 275000,
    equipmentSubtotal: 215000,
    labourServices: 65000,
    discount: 0,
    taxRate: 0, // Composite GST
    validityDays: 15,
    items: generateDefaultLineItems(5.0, 'Waaree', 550, 9, 'Growatt', 'Galvanized HDG High Rise'),

    // Step 4: Terms & Milestones
    deliveryTimeline: '15 to 20 working days',
    paymentMilestones: [
      { percentage: 20, description: 'Advance booking along with signed work order' },
      { percentage: 60, description: 'Upon dispatch & delivery of modules, inverter and structure at site' },
      { percentage: 15, description: 'Upon completion of mechanical & electrical installation' },
      { percentage: 5, description: 'Upon MSEDCL Net Metering commissioning & project handover' }
    ]
  });

  // State for inventory product selection & BOM toggle in Step 3
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [showBOMDetails, setShowBOMDetails] = useState(false);
  const [productSearch, setProductSearch] = useState('');

  // PRESETS CONFIGURATIONS (Maharashtra standard packages)
  const presets = [
    {
      id: '3kw_resi',
      label: '3 kWp Surya Ghar',
      subtitle: 'Most Popular Resi',
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
      label: '5 kWp Standard 3BHK',
      subtitle: 'High Yield Resi',
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
      label: '10 kWp 3-Phase Villa',
      subtitle: 'Luxury High Yield',
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
      subtitle: 'C&I Tax Benefit',
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
    const updatedItems = generateDefaultLineItems(
      preset.capacity,
      preset.panelBrand,
      preset.panelWattage,
      preset.panelQty,
      preset.inverterBrand,
      'Galvanized HDG High Rise'
    );
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
      totalSystemCost: preset.indicativePrice,
      equipmentSubtotal: preset.equipment,
      labourServices: preset.labour,
      discount: 0,
      items: updatedItems
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
    const propCap = linkedSurvey.proposedCap ? Number(linkedSurvey.proposedCap) : formData.systemCapacity;
    const qty = Math.ceil((propCap * 1000) / formData.panelWattage);
    const updatedItems = generateDefaultLineItems(
      propCap,
      formData.panelBrand,
      formData.panelWattage,
      qty,
      formData.inverterBrand,
      formData.structureBrand
    );
    setFormData(prev => ({
      ...prev,
      systemCapacity: propCap,
      roofType: linkedSurvey.roofType || prev.roofType,
      inverterCapacity: propCap,
      panelQuantity: qty,
      items: updatedItems
    }));
  };

  // LINE ITEM HANDLERS
  const handleUpdateItem = (index: number, field: keyof WizardLineItem, value: any) => {
    setFormData(prev => {
      const updated = [...prev.items];
      const item = { ...updated[index], [field]: value };
      const q = Number(item.quantity) || 0;
      const u = Number(item.unitPrice) || 0;
      const t = Number(item.taxRate) || 0;
      item.total = Math.round(q * u * (1 + t / 100));
      updated[index] = item;
      return { ...prev, items: updated };
    });
  };

  const handleAddItem = () => {
    const newItem: WizardLineItem = {
      id: `custom-${Date.now()}`,
      category: 'CUSTOM',
      description: 'Custom Solar Equipment / Additional Scope',
      quantity: 1,
      unitPrice: 10000,
      taxRate: 18,
      total: 11800
    };
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
  };

  const handleDeleteItem = (index: number) => {
    if (formData.items.length <= 1) {
      alert('At least one line item is required.');
      return;
    }
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, idx) => idx !== index)
    }));
  };

  const handleSelectProduct = (product: any) => {
    const unitPrice = Number(product.sellingPrice) || 5000;
    const newItem: WizardLineItem = {
      id: `prod-${product.id}-${Date.now()}`,
      productId: product.id,
      category: (product.category?.toUpperCase() || 'CUSTOM') as any,
      description: `${product.name} ${product.brand ? `(${product.brand})` : ''}`,
      quantity: 1,
      unitPrice,
      taxRate: 18,
      total: Math.round(unitPrice * 1.18)
    };
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
    setShowProductPicker(false);
  };

  const handleResetBOM = () => {
    const defaultItems = generateDefaultLineItems(
      formData.systemCapacity,
      formData.panelBrand,
      formData.panelWattage,
      formData.panelQuantity,
      formData.inverterBrand,
      formData.structureBrand
    );
    setFormData(prev => ({ ...prev, items: defaultItems }));
  };

  // SOLAR CALCULATIONS & METRICS ENGINE (ALL GST INCLUDED SINGLE TURNKEY PRICING)
  const calculations = useMemo(() => {
    const cap = Number(formData.systemCapacity) || 5;
    
    // Single All-Inclusive Turnkey Price (GST included)
    const total = Number(formData.totalSystemCost) || (cap ? Math.round(cap * 55000) : 275000);
    const discount = Number(formData.discount) || 0;

    // Embedded GST (13.8% Composite Solar EPC Rate: 70% material @ 12% + 30% service @ 18%)
    const subtotal = Math.round(total / 1.138);
    const tax = total - subtotal;

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
  }, [formData.systemCapacity, formData.totalSystemCost, formData.discount, formData.connectionType]);

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
    const newTotalCost = Math.round(cap * 55000);
    const estEquip = Math.round(cap * 43000);
    const estLabour = Math.round(cap * 12000);
    const updatedItems = generateDefaultLineItems(
      cap,
      formData.panelBrand,
      formData.panelWattage,
      qty,
      formData.inverterBrand,
      formData.structureBrand
    );
    setFormData(prev => ({
      ...prev,
      systemCapacity: cap,
      inverterCapacity: cap,
      panelQuantity: qty,
      totalSystemCost: newTotalCost,
      equipmentSubtotal: estEquip,
      labourServices: estLabour,
      items: updatedItems
    }));
  };

  const steps = [
    { id: 1, name: 'Customer & Site', short: 'Customer' },
    { id: 2, name: 'System Hardware', short: 'System' },
    { id: 3, name: 'System Cost (Incl. GST)', short: 'Pricing' },
    { id: 4, name: 'Terms & Milestones', short: 'Terms' },
    { id: 5, name: 'Proposal Summary', short: 'Review' }
  ];

  // SUBMIT HANDLER
  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload = {
        customerId: customerMode !== 'new' && formData.selectedType === 'customer' ? formData.customerId : null,
        leadId: customerMode !== 'new' && formData.selectedType === 'lead' ? formData.leadId : null,
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
        totalSystemCost: calculations.total,
        total: calculations.total,
        subtotal: calculations.subtotal,
        tax: calculations.tax,
        discount: 0,
        validityDays: formData.validityDays,
        items: formData.items.map(it => ({
          productId: it.productId || null,
          description: it.description,
          quantity: Number(it.quantity) || 1,
          unitPrice: Number(it.unitPrice) || 0,
          taxRate: Number(it.taxRate) || 0,
          total: Math.round(Number(it.quantity) * Number(it.unitPrice))
        })),
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

  // Selected client preview name
  const currentClientName = customerMode === 'new'
    ? (formData.newCustomer.name || 'New Customer')
    : formData.selectedType === 'customer'
      ? (customers.find(c => c.id === formData.customerId)?.name || 'Select Customer')
      : (leads.find(l => l.id === formData.leadId)?.name || 'Select Lead');

  return (
    <div className={`fixed inset-0 z-50 bg-[#071A2B]/85 backdrop-blur-md flex items-center justify-center ${isFullscreen ? 'p-0' : 'p-1 sm:p-2 lg:p-3'} overflow-hidden`}>
      <div className={`bg-slate-50 w-full h-full ${isFullscreen ? 'max-w-none max-h-none rounded-none border-0' : 'max-w-[99vw] 2xl:max-w-[1600px] max-h-[98vh] rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200'} flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200`}>
        
        {/* UNIFIED EXPANSIVE TOP BAR */}
        <div className="bg-white border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4 flex-shrink-0">
          
          {/* LEFT: TITLE & ACTIVE CONTEXT */}
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-sm border border-emerald-500/20 flex-shrink-0">
              <Sun size={20} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900 tracking-tight">New Solar Proposal</h2>
                <span className="hidden sm:inline-block text-[11px] font-extrabold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                  {formData.systemCapacity} kWp · {formData.systemType}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium truncate max-w-xs sm:max-w-md">
                Client: <strong className="text-slate-800">{currentClientName}</strong>
              </p>
            </div>
          </div>

          {/* CENTER: CLEAN MINIMAL STEPPER */}
          <div className="hidden md:flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-2xl border border-slate-200/60">
            {steps.map((s) => {
              const isPassed = currentStep > s.id;
              const isCurrent = currentStep === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setCurrentStep(s.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    isCurrent
                      ? 'bg-[#071A2B] text-white shadow-sm'
                      : isPassed
                        ? 'text-emerald-700 bg-emerald-50/70 hover:bg-emerald-100'
                        : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-black ${
                    isCurrent
                      ? 'bg-emerald-400 text-[#071A2B]'
                      : isPassed
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-300 text-slate-600'
                  }`}>
                    {isPassed ? <Check size={10} strokeWidth={3} /> : s.id}
                  </span>
                  <span>{s.short}</span>
                </button>
              );
            })}
          </div>

          {/* RIGHT: LIVE PRICE PILL & CONTROLS */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <div className="hidden sm:block text-right pr-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Estimated Total</span>
              <span className="text-sm font-black text-[#071A2B]">₹{calculations.total.toLocaleString()}</span>
            </div>
            <button 
              type="button"
              onClick={() => setIsFullscreen(prev => !prev)} 
              title={isFullscreen ? "Restore window size" : "Maximize to full screen studio"}
              className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-colors"
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
            <button 
              type="button"
              onClick={onClose} 
              title="Close wizard"
              className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* STEPPER FOR MOBILE */}
        <div className="md:hidden bg-slate-100 px-4 py-2 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-700">
          <span>Step {currentStep} of 5: {steps[currentStep - 1].name}</span>
          <span className="font-black text-[#071A2B]">₹{calculations.total.toLocaleString()}</span>
        </div>

        {/* MAIN FULL-WIDTH SCROLLABLE WORKSPACE */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
          <div className="w-full max-w-7xl mx-auto space-y-5">

            {/* ======================================================== */}
            {/* STEP 1: CUSTOMER & SITE SELECTION */}
            {/* ======================================================== */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div>
                      <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                        <User size={20} className="text-emerald-600" /> Select Customer or CRM Lead
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Choose an existing opportunity from CRM or quickly register a new client for this quotation.
                      </p>
                    </div>

                    {/* SOURCE SELECTOR TABS */}
                    <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl w-fit">
                      <button
                        type="button"
                        onClick={() => {
                          setCustomerMode('leads');
                          setFormData(prev => ({ ...prev, selectedType: 'lead' }));
                        }}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          customerMode === 'leads' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        CRM Leads ({leads.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCustomerMode('customers');
                          setFormData(prev => ({ ...prev, selectedType: 'customer' }));
                        }}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          customerMode === 'customers' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        Customers ({customers.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setCustomerMode('new')}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          customerMode === 'new' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        + Create New
                      </button>
                    </div>
                  </div>

                  {/* MODE 1: CRM LEADS SELECTION */}
                  {customerMode === 'leads' && (
                    <div className="space-y-4">
                      <div className="relative">
                        <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search leads by customer name, phone, city or status..."
                          value={customerSearch}
                          onChange={e => setCustomerSearch(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>

                      {/* LEADS CARDS GRID */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 max-h-[440px] overflow-y-auto pr-1">
                        {leads
                          .filter(l => !customerSearch || l.name?.toLowerCase().includes(customerSearch.toLowerCase()) || l.mobile?.includes(customerSearch) || l.city?.toLowerCase().includes(customerSearch.toLowerCase()))
                          .map(l => {
                            const isSelected = formData.selectedType === 'lead' && formData.leadId === l.id;
                            return (
                              <div
                                key={l.id}
                                onClick={() => setFormData(prev => ({ ...prev, selectedType: 'lead', leadId: l.id }))}
                                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                                  isSelected 
                                    ? 'bg-emerald-50/70 border-emerald-500 shadow-sm ring-2 ring-emerald-500/20' 
                                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                                }`}
                              >
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between">
                                    <span className="font-extrabold text-sm text-slate-900 truncate">{l.name}</span>
                                    {isSelected && <CheckCircle size={16} className="text-emerald-600 flex-shrink-0" />}
                                  </div>
                                  <p className="text-xs text-slate-500 flex items-center gap-1.5">
                                    <Phone size={12} className="text-slate-400" /> {l.mobile || 'No Phone'}
                                  </p>
                                  <p className="text-xs text-slate-500 flex items-center gap-1.5">
                                    <MapPin size={12} className="text-slate-400" /> {l.city || 'Maharashtra'}
                                  </p>
                                </div>

                                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                                  <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                                    {l.estimatedCap ? `${l.estimatedCap} kWp` : '5 kWp est.'}
                                  </span>
                                  <span className="text-emerald-700 font-bold">{l.status || 'NEW'}</span>
                                </div>
                              </div>
                            );
                          })}

                        {leads.length === 0 && (
                          <div className="col-span-full py-8 text-center text-xs text-slate-400">
                            No CRM leads available. Click "+ Create New" above to enter client details.
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* MODE 2: EXISTING CUSTOMER DIRECTORY */}
                  {customerMode === 'customers' && (
                    <div className="space-y-4">
                      <div className="relative">
                        <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search customer directory by name or phone..."
                          value={customerSearch}
                          onChange={e => setCustomerSearch(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 max-h-[440px] overflow-y-auto pr-1">
                        {customers
                          .filter(c => !customerSearch || c.name?.toLowerCase().includes(customerSearch.toLowerCase()) || c.mobile?.includes(customerSearch))
                          .map(c => {
                            const isSelected = formData.selectedType === 'customer' && formData.customerId === c.id;
                            return (
                              <div
                                key={c.id}
                                onClick={() => setFormData(prev => ({ ...prev, selectedType: 'customer', customerId: c.id }))}
                                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                                  isSelected 
                                    ? 'bg-emerald-50/70 border-emerald-500 shadow-sm ring-2 ring-emerald-500/20' 
                                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                                }`}
                              >
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between">
                                    <span className="font-extrabold text-sm text-slate-900 truncate">{c.name}</span>
                                    {isSelected && <CheckCircle size={16} className="text-emerald-600 flex-shrink-0" />}
                                  </div>
                                  <p className="text-xs text-slate-500 flex items-center gap-1.5">
                                    <Phone size={12} className="text-slate-400" /> {c.mobile || 'No Phone'}
                                  </p>
                                  <p className="text-xs text-slate-500 flex items-center gap-1.5">
                                    <MapPin size={12} className="text-slate-400" /> {c.city || 'Maharashtra'}
                                  </p>
                                </div>

                                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                                  <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">Customer</span>
                                  <span className="text-emerald-700 font-bold">Active</span>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}

                  {/* MODE 3: CREATE NEW CUSTOMER FORM */}
                  {customerMode === 'new' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 uppercase">Customer Full Name *</label>
                        <input
                          type="text"
                          placeholder="e.g. Ramesh Patil"
                          value={formData.newCustomer.name}
                          onChange={e => setFormData({ ...formData, newCustomer: { ...formData.newCustomer, name: e.target.value } })}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 uppercase">Mobile Number (WhatsApp) *</label>
                        <input
                          type="tel"
                          placeholder="+91 98220 12345"
                          value={formData.newCustomer.mobile}
                          onChange={e => setFormData({ ...formData, newCustomer: { ...formData.newCustomer, mobile: e.target.value } })}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 uppercase">Email Address</label>
                        <input
                          type="email"
                          placeholder="ramesh@example.com"
                          value={formData.newCustomer.email}
                          onChange={e => setFormData({ ...formData, newCustomer: { ...formData.newCustomer, email: e.target.value } })}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 uppercase">City / District (Maharashtra)</label>
                        <input
                          type="text"
                          placeholder="Pune / Mumbai / Nashik"
                          value={formData.newCustomer.city}
                          onChange={e => setFormData({ ...formData, newCustomer: { ...formData.newCustomer, city: e.target.value } })}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      <div className="col-span-full space-y-1">
                        <label className="text-xs font-bold text-slate-700 uppercase">Rooftop Installation Site Address</label>
                        <input
                          type="text"
                          placeholder="Plot No, Society, Landmark, Pune - 411038"
                          value={formData.newCustomer.address}
                          onChange={e => setFormData({ ...formData, newCustomer: { ...formData.newCustomer, address: e.target.value } })}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* SMART LINKED SITE SURVEY BANNER */}
                  {linkedSurvey && (
                    <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
                      <div className="space-y-0.5">
                        <p className="font-extrabold text-amber-900 flex items-center gap-1.5">
                          <Compass size={15} className="text-amber-600" />
                          Site Feasibility Survey Linked
                        </p>
                        <p className="text-slate-600 text-[11px]">
                          Proposed Capacity: <strong>{linkedSurvey.proposedCap || 5} kWp</strong> · Roof Architecture: <strong>{linkedSurvey.roofType || 'RCC Flat Roof'}</strong>
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleApplySurvey}
                        className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm flex-shrink-0"
                      >
                        <CheckCheck size={14} /> Auto-Apply Survey Specs
                      </button>
                    </div>
                  )}

                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* STEP 2: SYSTEM CONFIGURATION & HARDWARE BOM */}
            {/* ======================================================== */}
            {currentStep === 2 && (
              <div className="space-y-5 animate-in fade-in duration-200">
                
                {/* 1. QUICK SOLAR PACKAGES (MAHARASHTRA) */}
                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                        <Sparkles size={18} className="text-amber-500" /> 1-Click Solar Packages (Maharashtra)
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">Select a pre-engineered package to auto-fill capacity, modules, inverter, and costs.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {presets.map(p => {
                      const isSelected = formData.systemCapacity === p.capacity && formData.connectionType === p.connectionType;
                      return (
                        <div
                          key={p.id}
                          onClick={() => applyPreset(p)}
                          className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? 'bg-emerald-50/70 border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                              : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-slate-100 rounded-md text-slate-700">
                                {p.subtitle}
                              </span>
                              {isSelected && <CheckCircle size={15} className="text-emerald-600" />}
                            </div>
                            <h4 className="font-black text-slate-900 text-sm mt-1">{p.label}</h4>
                            <p className="text-[11px] text-slate-500 mt-0.5">{p.panelBrand} · {p.inverterBrand}</p>
                          </div>

                          <div className="mt-2.5 pt-2 border-t border-slate-100 space-y-0.5">
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-slate-400">Total:</span>
                              <span className="font-extrabold text-slate-900">₹{(p.indicativePrice).toLocaleString()}</span>
                            </div>
                            {p.subsidy > 0 && (
                              <div className="flex justify-between items-center text-[11px] text-emerald-700 font-bold">
                                <span>Net Outflow:</span>
                                <span>₹{(p.netCost).toLocaleString()}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. SMART 2-COLUMN STUDIO GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  
                  {/* LEFT: SYSTEM CAPACITY & ELECTRICAL SPECS */}
                  <div className="lg:col-span-6 space-y-5">
                    
                    {/* CAPACITY SLIDER CARD */}
                    <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                            <Sliders size={16} className="text-emerald-600" /> Fine-Tune System Capacity
                          </h3>
                          <p className="text-[11px] text-slate-500 mt-0.5">Auto-calculates panel count and Maharashtra generation.</p>
                        </div>

                        <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                          <input
                            type="number"
                            step="0.5"
                            min="1"
                            max="100"
                            value={formData.systemCapacity}
                            onChange={e => handleCapacityChange(Number(e.target.value))}
                            className="w-16 text-right font-black text-lg text-[#071A2B] bg-transparent outline-none"
                          />
                          <span className="font-bold text-slate-500 text-xs">kWp</span>
                        </div>
                      </div>

                      <input
                        type="range"
                        min="1"
                        max="50"
                        step="0.5"
                        value={formData.systemCapacity}
                        onChange={e => handleCapacityChange(Number(e.target.value))}
                        className="w-full accent-emerald-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                      />

                      {/* QUICK CHIPS */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {[1, 2, 3, 4, 5, 6, 7.5, 10, 15, 20, 25].map(cap => (
                          <button
                            key={cap}
                            type="button"
                            onClick={() => handleCapacityChange(cap)}
                            className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                              formData.systemCapacity === cap
                                ? 'bg-[#071A2B] text-white shadow-sm'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}
                          >
                            {cap} kWp
                          </button>
                        ))}
                      </div>

                      {/* GENERATION SUMMARY CHIP */}
                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-medium">Est. Generation:</span>
                        <strong className="text-slate-900">~{Math.round(formData.systemCapacity * 1460).toLocaleString()} kWh / year</strong>
                      </div>
                    </div>

                    {/* SITE & ELECTRICAL SPECS CARD */}
                    <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3.5">
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Site & Electrical Specs</h3>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                        <div className="space-y-1">
                          <label className="font-bold text-slate-700 uppercase text-[11px]">System Type</label>
                          <select
                            value={formData.systemType}
                            onChange={e => setFormData({ ...formData, systemType: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                          >
                            <option value="On-grid">On-grid (Net Metering)</option>
                            <option value="Hybrid">Hybrid (Battery Backup)</option>
                            <option value="Off-grid">Off-grid (Independent)</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="font-bold text-slate-700 uppercase text-[11px]">Tariff Category</label>
                          <select
                            value={formData.connectionType}
                            onChange={e => setFormData({ ...formData, connectionType: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                          >
                            <option value="Residential">Residential (LT-1)</option>
                            <option value="Commercial">Commercial (LT-2)</option>
                            <option value="Industrial">Industrial (HT/LT)</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="font-bold text-slate-700 uppercase text-[11px]">Grid Phase</label>
                          <select
                            value={formData.phase}
                            onChange={e => setFormData({ ...formData, phase: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                          >
                            <option value="Single Phase">Single Phase (230V)</option>
                            <option value="Three Phase">Three Phase (415V)</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="font-bold text-slate-700 uppercase text-[11px]">Roof Architecture</label>
                          <select
                            value={formData.roofType}
                            onChange={e => setFormData({ ...formData, roofType: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                          >
                            <option value="RCC Flat Roof">RCC Flat Roof</option>
                            <option value="Tin Shed / Metal Sheet">Industrial Metal Sheet</option>
                            <option value="Elevated Super Structure">Elevated Terrace Structure</option>
                            <option value="Mangalore Tile Sloped">Tile Sloped Roof</option>
                          </select>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* RIGHT: MAJOR EQUIPMENT SELECTIONS */}
                  <div className="lg:col-span-6 space-y-5">
                    <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Major Equipment & BOM Specs</h3>
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          Tier-1 Hardware
                        </span>
                      </div>

                      <div className="space-y-3 text-xs">
                        {/* MODULE CARD */}
                        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-500 uppercase text-[10px]">Solar PV Modules</span>
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-black rounded text-[11px]">
                              {formData.panelQuantity} Panels
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={formData.panelBrand}
                              onChange={e => setFormData({ ...formData, panelBrand: e.target.value })}
                              placeholder="Make (Waaree / Vikram)"
                              className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                            <select
                              value={formData.panelWattage}
                              onChange={e => handleWattageChange(Number(e.target.value))}
                              className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                              <option value="540">540 Wp Monocrystalline</option>
                              <option value="550">550 Wp Bifacial TOPCon</option>
                              <option value="570">570 Wp Dual Glass</option>
                              <option value="600">600 Wp High Power</option>
                            </select>
                          </div>
                        </div>

                        {/* INVERTER CARD */}
                        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-500 uppercase text-[10px]">Solar Inverter</span>
                            <span className="px-2 py-0.5 bg-slate-200 text-slate-800 font-black rounded text-[11px]">
                              {formData.inverterCapacity} kW Rating
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={formData.inverterBrand}
                              onChange={e => setFormData({ ...formData, inverterBrand: e.target.value })}
                              placeholder="Make (Growatt / Solis / Deye)"
                              className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                            <input
                              type="text"
                              value={formData.inverterWarranty}
                              onChange={e => setFormData({ ...formData, inverterWarranty: e.target.value })}
                              placeholder="10 Years Replacement"
                              className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                          </div>
                        </div>

                        {/* STRUCTURE CARD */}
                        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                          <span className="font-bold text-slate-500 uppercase text-[10px]">Mounting Structure & Protection</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={formData.structureBrand}
                              onChange={e => setFormData({ ...formData, structureBrand: e.target.value })}
                              placeholder="Galvanized HDG High Rise"
                              className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                            <div className="p-2 bg-white rounded-xl border border-slate-200 text-[11px] text-slate-600 font-semibold text-center flex items-center justify-center">
                              HDG (80+ Micron) + Dual Chemical Earthing
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            )}

            {/* ======================================================== */}
            {/* ======================================================== */}
            {/* STEP 3: SOLAR SYSTEM COST (INCL. ALL GST) */}
            {/* ======================================================== */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                  
                  {/* HEADER */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                          <IndianRupee size={22} className="text-emerald-600" /> Solar System Cost (Including All GST)
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                          GST 100% Included
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        Enter the single turnkey price for this solar plant. The exact same figure appears on quotations, proposals, and customer invoices with no surprise taxes added on top.
                      </p>
                    </div>
                  </div>

                  {/* HERO SINGLE PRICING INPUT */}
                  <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border-2 border-emerald-500/40 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <label className="text-xs font-black uppercase tracking-wider text-emerald-950">
                        Total Solar System Cost (₹) *
                      </label>
                      <span className="text-xs text-emerald-700 font-semibold">
                        Includes Modules, Inverter, Structure, Installation, Liaisoning & all GST
                      </span>
                    </div>

                    <div className="flex items-center gap-3 bg-white p-4 rounded-2xl border-2 border-emerald-500 shadow-sm focus-within:ring-4 focus-within:ring-emerald-500/20 transition-all">
                      <span className="text-3xl font-black text-emerald-600 pl-1">₹</span>
                      <input
                        type="number"
                        min="10000"
                        step="1000"
                        value={formData.totalSystemCost}
                        onChange={e => setFormData({ ...formData, totalSystemCost: Number(e.target.value) })}
                        className="w-full text-2xl sm:text-4xl font-black text-slate-900 bg-transparent outline-none"
                        placeholder="e.g. 195000"
                      />
                      <span className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-extrabold rounded-xl uppercase tracking-wider whitespace-nowrap shadow-sm">
                        All GST Included
                      </span>
                    </div>

                    {/* QUICK PACKAGE PRESETS */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="text-xs font-bold text-slate-500">Common Packages:</span>
                      {[
                        { cap: 3, cost: 185000, label: '3 kWp (₹1.85 Lakh)' },
                        { cap: 3.3, cost: 215000, label: '3.3 kWp (₹2.15 Lakh)' },
                        { cap: 5, cost: 275000, label: '5 kWp (₹2.75 Lakh)' },
                        { cap: 10, cost: 510000, label: '10 kWp (₹5.10 Lakh)' },
                      ].map(item => (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, systemCapacity: item.cap, totalSystemCost: item.cost }))}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                            formData.totalSystemCost === item.cost
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                              : 'bg-white hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 text-slate-700 border-slate-200'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 3-COLUMN ECONOMICS MATRIX */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                      <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">Turnkey Solar Plant Cost</span>
                      <p className="text-2xl font-black text-slate-900">₹{calculations.total.toLocaleString()}</p>
                      <p className="text-[11px] text-slate-500 font-medium">All GST Included · Quoted on Invoice</p>
                    </div>

                    <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-1">
                      <span className="text-[11px] font-extrabold text-emerald-800 uppercase tracking-wider block">PM Surya Ghar Subsidy</span>
                      <p className="text-2xl font-black text-emerald-700">-₹{calculations.indicativeSubsidy.toLocaleString()}</p>
                      <p className="text-[11px] text-emerald-600 font-medium">Direct DBT Bank Credit to Customer</p>
                    </div>

                    <div className="p-5 rounded-2xl bg-[#071A2B] text-white space-y-1 shadow-md">
                      <span className="text-[11px] font-extrabold text-emerald-400 uppercase tracking-wider block">Net Customer Investment</span>
                      <p className="text-2xl font-black text-white">₹{calculations.netCustomerCost.toLocaleString()}</p>
                      <p className="text-[11px] text-slate-400 font-medium">Effective Outflow Post Subsidy</p>
                    </div>
                  </div>

                  {/* TAX COMPLIANCE BANNER & TOGGLE */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 text-slate-700">
                      <Shield className="text-emerald-600 flex-shrink-0" size={20} />
                      <div>
                        <p className="font-extrabold text-slate-900">
                          GST Compliance & Invoice Guarantee (No Extra Tax on Invoice)
                        </p>
                        <p className="text-slate-500 text-[11px] mt-0.5">
                          Taxable Base: <strong>₹{calculations.subtotal.toLocaleString()}</strong> + Embedded Solar GST (13.8% Composite): <strong>₹{calculations.tax.toLocaleString()}</strong> = Grand Invoice Total: <strong>₹{calculations.total.toLocaleString()}</strong>
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowBOMDetails(prev => !prev)}
                      className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-800 font-bold border border-slate-300 rounded-xl transition-colors text-xs whitespace-nowrap shadow-sm"
                    >
                      {showBOMDetails ? 'Hide Technical BOM' : 'View Itemized Technical BOM'}
                    </button>
                  </div>

                  {/* OPTIONAL COLLAPSIBLE ITEMIZED BOM TABLE (FOR DISCOM & CATALOG) */}
                  {showBOMDetails && (
                    <div className="space-y-4 pt-2 border-t border-slate-100 animate-in fade-in">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">Technical Hardware Line Items</h4>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setShowProductPicker(prev => !prev)}
                            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                          >
                            <Package size={14} /> {showProductPicker ? 'Close Catalog' : 'Add from Catalog'}
                          </button>
                          <button
                            type="button"
                            onClick={handleAddItem}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                          >
                            <Plus size={14} /> Custom Line
                          </button>
                          <button
                            type="button"
                            onClick={handleResetBOM}
                            title="Reset to default package BOM"
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                          >
                            <RefreshCw size={14} />
                          </button>
                        </div>
                      </div>

                      {/* INVENTORY CATALOG DRAWER */}
                      {showProductPicker && (
                        <div className="p-4 bg-slate-50 border border-emerald-200 rounded-2xl space-y-3 animate-in fade-in">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-extrabold uppercase text-slate-700 flex items-center gap-1.5">
                              <Search size={14} className="text-emerald-600" /> Live Inventory Products
                            </span>
                            <button type="button" onClick={() => setShowProductPicker(false)} className="text-xs text-slate-400 hover:text-slate-600">
                              Close
                            </button>
                          </div>

                          <input
                            type="text"
                            placeholder="Search product SKU, brand or name..."
                            value={productSearch}
                            onChange={e => setProductSearch(e.target.value)}
                            className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                          />

                          <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                            {products
                              .filter(p => !productSearch || p.name?.toLowerCase().includes(productSearch.toLowerCase()) || p.brand?.toLowerCase().includes(productSearch.toLowerCase()))
                              .slice(0, 8)
                              .map(p => (
                                <div
                                  key={p.id}
                                  onClick={() => handleSelectProduct(p)}
                                  className="p-2.5 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-xl flex items-center justify-between cursor-pointer transition-colors text-xs"
                                >
                                  <div>
                                    <p className="font-bold text-slate-900">{p.name}</p>
                                    <p className="text-[11px] text-slate-400">{p.brand || 'Generic'} · Stock: {p.currentStock ?? 'In Stock'}</p>
                                  </div>
                                  <div className="text-right">
                                    <span className="font-black text-[#071A2B]">₹{(p.sellingPrice || 0).toLocaleString()}</span>
                                    <span className="block text-[10px] text-emerald-600 font-bold">+ Add Item</span>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                      {/* ITEMIZED TABLE */}
                      <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200">
                            <tr>
                              <th className="py-3 px-4">Description</th>
                              <th className="py-3 px-2 w-20 text-center">Qty</th>
                              <th className="py-3 px-3 w-32">Unit Rate (₹)</th>
                              <th className="py-3 px-2 w-24 text-center">GST %</th>
                              <th className="py-3 px-4 text-right w-32">Line Total (₹)</th>
                              <th className="py-3 px-2 text-center w-10"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {formData.items.map((item, idx) => (
                              <tr key={item.id || idx} className="hover:bg-slate-50/60 transition-colors">
                                <td className="p-2.5">
                                  <input
                                    type="text"
                                    value={item.description}
                                    onChange={e => handleUpdateItem(idx, 'description', e.target.value)}
                                    className="w-full px-2.5 py-1.5 bg-slate-50/80 hover:bg-white focus:bg-white rounded-lg border border-transparent hover:border-slate-300 focus:border-emerald-500 font-bold text-slate-800 text-xs outline-none"
                                  />
                                </td>
                                <td className="p-2">
                                  <input
                                    type="number"
                                    min="1"
                                    value={item.quantity}
                                    onChange={e => handleUpdateItem(idx, 'quantity', Number(e.target.value))}
                                    className="w-full px-2 py-1.5 bg-slate-50/80 hover:bg-white focus:bg-white rounded-lg border border-transparent hover:border-slate-300 focus:border-emerald-500 font-bold text-slate-900 text-xs text-center outline-none"
                                  />
                                </td>
                                <td className="p-2">
                                  <input
                                    type="number"
                                    min="0"
                                    value={item.unitPrice}
                                    onChange={e => handleUpdateItem(idx, 'unitPrice', Number(e.target.value))}
                                    className="w-full px-2 py-1.5 bg-slate-50/80 hover:bg-white focus:bg-white rounded-lg border border-transparent hover:border-slate-300 focus:border-emerald-500 font-bold text-slate-900 text-xs outline-none"
                                  />
                                </td>
                                <td className="p-2 text-center">
                                  <select
                                    value={item.taxRate}
                                    onChange={e => handleUpdateItem(idx, 'taxRate', Number(e.target.value))}
                                    className="px-2 py-1.5 bg-slate-50/80 hover:bg-white focus:bg-white rounded-lg border border-transparent hover:border-slate-300 focus:border-emerald-500 font-bold text-slate-800 text-[11px] outline-none"
                                  >
                                    <option value="0">0%</option>
                                    <option value="5">5%</option>
                                    <option value="12">12%</option>
                                    <option value="18">18%</option>
                                  </select>
                                </td>
                                <td className="p-3 text-right font-black text-slate-900">
                                  ₹{(Math.round(item.quantity * item.unitPrice)).toLocaleString()}
                                </td>
                                <td className="p-2 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteItem(idx)}
                                    title="Delete line item"
                                    className="p-1 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* STEP 4: TERMS & MILESTONES */}
            {/* ======================================================== */}
            {currentStep === 4 && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                      <Shield size={20} className="text-emerald-600" /> Payment Milestones & Contract Terms
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Configure standard milestone release stages, execution delivery SLA, and warranty commitments.
                    </p>
                  </div>

                  {/* PAYMENT MILESTONES */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Payment Milestone Schedule (Total 100%)</h4>
                    <div className="space-y-2.5">
                      {formData.paymentMilestones.map((m, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                          <span className="w-14 py-1.5 bg-[#071A2B] text-white rounded-xl text-center font-black flex-shrink-0">
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
                            className="flex-1 bg-transparent font-semibold text-slate-800 outline-none"
                          />
                          <span className="font-black text-slate-900 text-sm whitespace-nowrap">
                            ₹{Math.round(calculations.total * (m.percentage / 100)).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* TIMELINE & VALIDITY */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 uppercase">Proposal Validity (Days)</label>
                      <input
                        type="number"
                        value={formData.validityDays}
                        onChange={e => setFormData({ ...formData, validityDays: Number(e.target.value) })}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 uppercase">Execution & Delivery Timeline</label>
                      <input
                        type="text"
                        value={formData.deliveryTimeline}
                        onChange={e => setFormData({ ...formData, deliveryTimeline: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                      />
                    </div>
                  </div>

                  {/* WARRANTIES GRID */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 block">PV Modules</span>
                      <span className="font-bold text-slate-800">25 Years</span>
                      <span className="text-[10px] text-slate-500 block">Performance</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 block">Inverter</span>
                      <span className="font-bold text-slate-800">10 Years</span>
                      <span className="text-[10px] text-slate-500 block">Replacement</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 block">Structure</span>
                      <span className="font-bold text-slate-800">10 Years</span>
                      <span className="text-[10px] text-slate-500 block">HDG Structural</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 block">Workmanship</span>
                      <span className="font-bold text-slate-800">5 Years</span>
                      <span className="text-[10px] text-slate-500 block">Turnkey EPC</span>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* STEP 5: PROPOSAL SUMMARY & REVIEW */}
            {/* ======================================================== */}
            {currentStep === 5 && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                      <CheckCircle2 size={20} className="text-emerald-600" /> Review Final Proposal Summary
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Verify customer information, system hardware, and financial ROI before creating and syncing with CRM.
                    </p>
                  </div>

                  {/* 2-COLUMN COMPARISON SUMMARY */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    {/* CLIENT & SYSTEM SPECS */}
                    <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">System Specifications</span>
                      <div className="space-y-1.5">
                        <div className="flex justify-between py-1 border-b border-slate-200/60">
                          <span className="text-slate-500">Client Name:</span>
                          <span className="font-bold text-slate-800">{currentClientName}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-200/60">
                          <span className="text-slate-500">Capacity & Type:</span>
                          <span className="font-bold text-slate-800">{formData.systemCapacity} kWp ({formData.systemType})</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-200/60">
                          <span className="text-slate-500">PV Modules:</span>
                          <span className="font-bold text-slate-800">{formData.panelBrand} ({formData.panelQuantity} Panels × {formData.panelWattage}W)</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-200/60">
                          <span className="text-slate-500">Inverter:</span>
                          <span className="font-bold text-slate-800">{formData.inverterBrand} {formData.inverterCapacity}kW</span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span className="text-slate-500">Mounting Structure:</span>
                          <span className="font-bold text-slate-800">{formData.structureBrand}</span>
                        </div>
                      </div>
                    </div>

                    {/* FINANCIAL & COMMERCIALS */}
                    <div className="p-5 bg-[#071A2B] text-white rounded-2xl space-y-3">
                      <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">Solar Financial Projections</span>
                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between py-1 border-b border-white/10">
                          <span className="text-slate-400">Total Investment:</span>
                          <span className="font-black text-lg text-white">₹{calculations.total.toLocaleString()}</span>
                        </div>
                        {calculations.indicativeSubsidy > 0 && (
                          <div className="flex justify-between py-1 border-b border-white/10 text-emerald-400 font-bold">
                            <span>Central Subsidy (Surya Ghar):</span>
                            <span>₹{calculations.indicativeSubsidy.toLocaleString()}</span>
                          </div>
                        )}
                        <div className="flex justify-between py-1 border-b border-white/10">
                          <span className="text-slate-400">Net Customer Outflow:</span>
                          <span className="font-black text-white">₹{calculations.netCustomerCost.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-white/10">
                          <span className="text-slate-400">Est. Annual Generation:</span>
                          <span className="font-bold text-white">{calculations.annualGeneration.toLocaleString()} kWh/yr</span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span className="text-slate-400">Estimated Payback:</span>
                          <span className="font-bold text-amber-300">{calculations.paybackYears} Years</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* CONFIRMATION CALLOUT */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-slate-700">
                      <FileCheck size={18} className="text-emerald-600 flex-shrink-0" />
                      <span>Ready to generate proposal? This will create an active quotation with immutable revision tracking and sync deal size in CRM.</span>
                    </div>
                  </div>

                </div>
              </div>
            )}

          </div>
        </div>

        {/* PERSISTENT SLEEK BOTTOM ACTION BAR */}
        <div className="bg-white border-t border-slate-200/80 px-6 sm:px-8 py-3.5 flex items-center justify-between gap-4 flex-shrink-0">
          
          {/* LIVE SUMMARY CHIPS (LEFT) */}
          <div className="hidden sm:flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-slate-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>{formData.systemCapacity} kWp {formData.systemType}</span>
            </div>
            <span className="text-slate-300">·</span>
            <span className="font-extrabold text-[#071A2B]">₹{calculations.total.toLocaleString()}</span>
            {calculations.indicativeSubsidy > 0 && (
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                Net: ₹{calculations.netCustomerCost.toLocaleString()}
              </span>
            )}
          </div>

          {/* PREV / NEXT NAVIGATION (RIGHT) */}
          <div className="flex items-center gap-2 ml-auto">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={() => setCurrentStep(prev => prev - 1)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <ChevronLeft size={16} /> Back
              </button>
            )}

            {currentStep < 5 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(prev => prev + 1)}
                className="px-5 py-2.5 bg-[#071A2B] hover:bg-[#0B2942] text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
              >
                Continue to {steps[currentStep].name} <ChevronRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                disabled={loading}
                onClick={handleSubmit}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all disabled:opacity-50"
              >
                {loading ? 'Creating Proposal...' : 'Create & Link Proposal'} <Check size={16} />
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
