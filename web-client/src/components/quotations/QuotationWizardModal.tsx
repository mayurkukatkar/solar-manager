"use client";

import React, { useState, useMemo, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  X, Check, ChevronRight, ChevronLeft, User, Sun, 
  Zap, IndianRupee, Shield, FileText, CheckCircle2, 
  Sparkles, Layers, Sliders, AlertCircle, Building2,
  Calendar, Phone, Mail, MapPin, Percent, HelpCircle,
  Package, Compass, ArrowRight, RefreshCw, CheckCheck,
  Trash2, Plus, Search, CheckCircle, Home, CheckSquare,
  Award, Clock, ArrowDownRight, Layers2, Maximize2,
  Minimize2, FileCheck, Upload, Scan, Battery, Download,
  Eye, Share2, Printer, MessageSquare, ZoomIn, ZoomOut,
  RotateCcw, ShieldCheck, Cpu, Cable, Wrench, Info, Activity
} from 'lucide-react';
import { 
  QuotationPDF, 
  QuotationData, 
  mapQuotationToPdfData, 
  generatePDF 
} from '@/components/pdf/QuotationPDF';
import { StandardQuotationPDF, printHtmlElement } from '@/components/pdf/MsedclFormsPDF';
import { 
  calculateSystemCapacity,
  calculateSolarGeneration,
  calculateIndicativeSubsidy,
  calculateFinancialROI,
  calculateCommercialPricing,
  calculateLoanEMI,
  generateMilestones,
  formatINR,
  toIndianWords,
  LineItemInput
} from '@/services/solarCalculator';

export interface WizardLineItem {
  id: string;
  productId?: string;
  category: 'MODULE' | 'INVERTER' | 'BATTERY' | 'STRUCTURE' | 'BOS' | 'SERVICES' | 'CUSTOM';
  description: string;
  quantity: number;
  unit?: string;
  purchaseCost?: number;
  unitPrice: number;
  discount?: number;
  taxRate: number;
  total: number;
}

export const generateDefaultLineItems = (
  capacity: number,
  panelBrand: string,
  panelWattage: number,
  panelQty: number,
  inverterBrand: string,
  structureBrand: string,
  systemType: string = 'On-grid',
  batteryBrand?: string
): WizardLineItem[] => {
  const cap = Number(capacity) || 5;
  const isHybrid = systemType === 'Hybrid';
  const isOffGrid = systemType === 'Off-grid';

  const equipBudget = Math.round(cap * 43000);
  const labourBudget = Math.round(cap * 12000);

  const moduleTotal = Math.round(equipBudget * 0.58);
  const invTotal = Math.round(equipBudget * 0.24);
  const structTotal = Math.round(equipBudget * 0.10);
  const bosTotal = Math.max(5000, equipBudget - moduleTotal - invTotal - structTotal);

  const items: WizardLineItem[] = [
    {
      id: 'item-1',
      category: 'MODULE',
      description: `${panelBrand || 'Waaree'} ${panelWattage || 550}Wp Mono PERC Bifacial Solar PV Modules (ALMM Approved, Tier-1)`,
      quantity: panelQty || 9,
      unit: 'Nos',
      purchaseCost: Math.round(moduleTotal * 0.85 / (panelQty || 9)),
      unitPrice: Math.round(moduleTotal / (panelQty || 9)),
      discount: 0,
      taxRate: 12,
      total: moduleTotal
    },
    {
      id: 'item-2',
      category: 'INVERTER',
      description: `${inverterBrand || 'Growatt'} ${cap}kW High-Efficiency ${isHybrid ? 'Hybrid Solar Inverter' : isOffGrid ? 'Off-Grid Inverter' : 'On-Grid String Inverter'} (IP65, Dual MPPT)`,
      quantity: 1,
      unit: 'Nos',
      purchaseCost: Math.round(invTotal * 0.85),
      unitPrice: invTotal,
      discount: 0,
      taxRate: 12,
      total: invTotal
    }
  ];

  if (isHybrid || isOffGrid) {
    const battTotal = Math.round(cap * 18000);
    items.push({
      id: 'item-batt',
      category: 'BATTERY',
      description: `${batteryBrand || 'Tata Power Solar'} 48V 100Ah (4.8 kWh) LiFePO4 Lithium Energy Storage Battery with Smart BMS`,
      quantity: 1,
      unit: 'Nos',
      purchaseCost: Math.round(battTotal * 0.86),
      unitPrice: battTotal,
      discount: 0,
      taxRate: 18,
      total: battTotal
    });
  }

  items.push(
    {
      id: 'item-3',
      category: 'STRUCTURE',
      description: `${structureBrand || 'Galvanized HDG High Rise'} Solar Module Mounting Structure (80+ Micron, 150 km/h Wind Rated)`,
      quantity: 1,
      unit: 'Set',
      purchaseCost: Math.round(structTotal * 0.82),
      unitPrice: structTotal,
      discount: 0,
      taxRate: 18,
      total: structTotal
    },
    {
      id: 'item-4',
      category: 'BOS',
      description: `Balance of System: 4 sq.mm DC Solar Cables, ACDB/DCDB with Type-II SPDs, Dual Chemical Earthing & LA`,
      quantity: 1,
      unit: 'Lot',
      purchaseCost: Math.round(bosTotal * 0.80),
      unitPrice: bosTotal,
      discount: 0,
      taxRate: 18,
      total: bosTotal
    },
    {
      id: 'item-5',
      category: 'SERVICES',
      description: `Turnkey Installation, Testing, State DISCOM Net Metering Liasoning & Commissioning`,
      quantity: 1,
      unit: 'Job',
      purchaseCost: Math.round(labourBudget * 0.75),
      unitPrice: labourBudget,
      discount: 0,
      taxRate: 18,
      total: labourBudget
    }
  );

  return items;
};

const DEFAULT_SECTIONS = [
  { id: 'cover', title: 'Cover Page', isEnabled: true, order: 1, isRequired: true },
  { id: 'requirements', title: 'Customer & Energy Profile', isEnabled: true, order: 2 },
  { id: 'solution', title: 'Recommended Solar Solution', isEnabled: true, order: 3, isRequired: true },
  { id: 'savings', title: 'Savings & Financial Analysis', isEnabled: true, order: 4 },
  { id: 'pricing', title: 'Detailed Commercial Quotation', isEnabled: true, order: 5, isRequired: true },
  { id: 'scope', title: 'Scope of Work & Deliverables', isEnabled: true, order: 6 },
  { id: 'warranty', title: 'Warranty & Equipment Guarantees', isEnabled: true, order: 7 },
  { id: 'terms', title: 'Commercial Terms & Milestones', isEnabled: true, order: 8 },
  { id: 'acceptance', title: 'Project Acceptance & Sign-off', isEnabled: true, order: 9, isRequired: true }
];

const PROPOSAL_TEMPLATES = [
  {
    code: 'quick_quote',
    name: 'Quick Quote',
    pages: '~2 Pages',
    tag: 'Fast Track',
    description: 'Compact 2-page document focusing strictly on hardware capacity, pricing BOM, and acceptance terms. Ideal for spot proposals.',
    activeSections: ['cover', 'solution', 'pricing', 'terms', 'acceptance']
  },
  {
    code: 'residential_proposal',
    name: 'Professional Residential Proposal',
    pages: '~5–7 Pages',
    tag: 'PM Surya Ghar',
    description: 'Comprehensive homeowner proposal featuring rooftop generation, PM Surya Ghar DBT subsidy analysis, 25-yr financial projections, and warranty specs.',
    activeSections: ['cover', 'requirements', 'solution', 'savings', 'pricing', 'scope', 'warranty', 'terms', 'acceptance']
  },
  {
    code: 'commercial_epc',
    name: 'Commercial EPC Proposal',
    pages: '~7–9 Pages',
    tag: 'C&I Tax Shield',
    description: 'Industrial and commercial proposal tailored for high-tension LT/HT meters, 40% accelerated depreciation tax analysis, IRR, and milestone payment schedules.',
    activeSections: ['cover', 'requirements', 'solution', 'savings', 'pricing', 'scope', 'warranty', 'terms', 'acceptance']
  },
  {
    code: 'hybrid_offgrid',
    name: 'Hybrid / Off-Grid Proposal',
    pages: '~6–8 Pages',
    tag: 'Battery Backup',
    description: 'Specialized proposal featuring battery storage capacity (LiFePO4), backup load runtime assumptions, and off-grid generator sync diagrams.',
    activeSections: ['cover', 'requirements', 'solution', 'savings', 'pricing', 'scope', 'warranty', 'terms', 'acceptance']
  },
  {
    code: 'custom_1',
    name: 'Custom Tenant Template',
    pages: 'Configurable',
    tag: 'Custom Brand',
    description: 'Fully tailored company proposal with customized section order, brand colors, custom payment terms, and authorized signatory seal.',
    activeSections: ['cover', 'requirements', 'solution', 'savings', 'pricing', 'scope', 'warranty', 'terms', 'acceptance']
  }
];

const DISCOM_OPTIONS = [
  { code: 'MSEDCL', name: 'MSEDCL (Mahavitaran - Maharashtra)' },
  { code: 'TATA_MUMBAI', name: 'Tata Power (Mumbai Distribution)' },
  { code: 'ADANI_MUMBAI', name: 'Adani Electricity Mumbai Ltd (AEML)' },
  { code: 'TORRENT_PUNE', name: 'Torrent Power (Bhiwandi / Shil / Pune)' },
  { code: 'BESCOM', name: 'BESCOM (Bangalore Electricity Supply)' },
  { code: 'DHBVN', name: 'DHBVN (Haryana Discom)' },
  { code: 'UPPCL', name: 'UPPCL (Uttar Pradesh)' },
  { code: 'OTHER', name: 'Other State DISCOM / Utility' }
];

interface WizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  leads?: any[];
  customers?: any[];
  products?: any[];
  surveys?: any[];
  tenantInfo?: any;
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
  tenantInfo,
  preselectedLeadId,
  preselectedCustomerId
}: WizardProps) {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [customerMode, setCustomerMode] = useState<'leads' | 'customers' | 'new'>('leads');
  const [customerSearch, setCustomerSearch] = useState('');
  const [showInternalPurchaseCosts, setShowInternalPurchaseCosts] = useState(false);
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [previewZoom, setPreviewZoom] = useState<number>(100);
  const [isOcrScanning, setIsOcrScanning] = useState(false);
  const [isFetchingConsumer, setIsFetchingConsumer] = useState(false);

  // LIVE VISUAL DOCUMENT STUDIO CONTROLS
  const [editorTheme, setEditorTheme] = useState<'forest_gold' | 'obsidian_emerald' | 'navy_champagne'>('forest_gold');
  const [editorCoverImage, setEditorCoverImage] = useState<string>('/assets/solar-quotation/luxury-villa-cover.jpg');
  const [editorFont, setEditorFont] = useState<string>('Manrope');
  const [activeEditorPage, setActiveEditorPage] = useState<number>(1);
  const [showLiveTweakDrawer, setShowLiveTweakDrawer] = useState<boolean>(false);

  // FORM STATE
  const [formData, setFormData] = useState({
    // Step 1: Customer & Site
    selectedType: 'lead' as 'lead' | 'customer',
    customerId: preselectedCustomerId || '',
    leadId: preselectedLeadId || '',
    customerType: 'Individual Residential' as 'Individual Residential' | 'Commercial Entity' | 'Industrial' | 'Institutional',
    newCustomer: {
      name: '',
      mobile: '',
      email: '',
      address: '',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: ''
    },
    // Electricity bill & utility details
    consumerNumber: '',
    discom: 'MSEDCL',
    billingUnit: '4134 Pune City Urban',
    sanctionedLoad: 5.0,
    tariffRate: 8.5,
    monthlyBill: 4500,
    monthlyUnits: 420,
    billDocumentUrl: '',
    roofAreaSqFt: 650,

    // Step 2: Solar System Configuration
    projectType: 'Residential',
    systemType: 'On-grid',
    connectionType: 'Residential',
    phase: 'Single Phase',
    roofType: 'RCC Flat Roof',
    systemCapacity: 5.0,
    inverterCapacity: 5.0,

    // Panel
    panelBrand: 'Waaree',
    panelModel: '550Wp Mono PERC Bifacial',
    panelWattage: 550,
    panelQuantity: 9,
    panelWarranty: '25 Years OEM Performance Guarantee',

    // Inverter
    inverterBrand: 'Growatt',
    inverterModel: '5kW Single Phase Dual MPPT On-Grid Inverter',
    inverterQuantity: 1,
    inverterWarranty: '10 Years Replacement Guarantee',

    // Battery (for Hybrid / Off-Grid)
    batteryBrand: 'Tata Power Solar',
    batteryModel: '48V 100Ah LiFePO4 Smart Battery',
    batteryCapacity: 4.8,
    batteryQuantity: 1,
    batteryWarranty: '5 Years Comprehensive OEM Guarantee',
    backupLoadWatts: 1500,

    // Structure & BOS
    structureBrand: 'Galvanized HDG High Rise',
    structureWarranty: '10 Years Structural Integrity Guarantee',

    // Step 3: Commercial Pricing & BOM
    items: generateDefaultLineItems(5.0, 'Waaree', 550, 9, 'Growatt', 'Galvanized HDG High Rise', 'On-grid'),
    headerDiscount: 0,
    validityDays: 15,
    deliveryTimeline: '15 to 20 working days from advance receipt',
    paymentMilestones: [
      { percentage: 20, description: 'Advance booking amount along with signed work order' },
      { percentage: 60, description: 'Upon dispatch & delivery of modules, inverter and mounting structure at site' },
      { percentage: 15, description: 'Upon completion of mechanical & electrical rooftop installation' },
      { percentage: 5, description: 'Upon MSEDCL Net Metering synchronization & final handover' }
    ],

    // Step 4: Savings & Financing Analysis assumptions
    selfConsumptionPercent: 75,
    gridExportPercent: 25,
    tariffEscalationPercent: 3.5,
    annualDegradationPercent: 0.5,
    includeLoanFinancing: false,
    loanDownPaymentPercent: 20,
    loanInterestRate: 9.5,
    loanTenureYears: 5,
    includeAcceleratedDepreciation: false,

    // Step 5: Template & Design
    templateType: 'residential_proposal',
    primaryColor: '#0284c7',
    accentColor: '#059669',
    coverLayout: 'modern',
    fontFamily: 'Inter',
    sections: DEFAULT_SECTIONS
  });

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
      'Galvanized HDG High Rise',
      preset.systemType
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
      items: updatedItems,
      tariffRate: preset.connectionType === 'Commercial' ? 10.5 : 8.5
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
          phase: (lead.sanctionedLoad && lead.sanctionedLoad > 5) ? 'Three Phase' : prev.phase,
          consumerNumber: lead.consumerNumber || prev.consumerNumber,
          monthlyBill: lead.monthlyBill ? Number(lead.monthlyBill) : prev.monthlyBill
        }));
      }
    } else if (formData.selectedType === 'customer' && formData.customerId) {
      const customer = customers.find(c => c.id === formData.customerId);
      if (customer) {
        setFormData(prev => ({
          ...prev,
          consumerNumber: customer.consumerNumber || prev.consumerNumber,
          monthlyBill: customer.monthlyBill ? Number(customer.monthlyBill) : prev.monthlyBill
        }));
      }
    }
  }, [formData.leadId, formData.customerId, formData.selectedType, leads, customers]);

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
      formData.structureBrand,
      formData.systemType,
      formData.batteryBrand
    );
    setFormData(prev => ({
      ...prev,
      systemCapacity: propCap,
      roofType: linkedSurvey.roofType || prev.roofType,
      inverterCapacity: propCap,
      panelQuantity: qty,
      roofAreaSqFt: linkedSurvey.roofArea ? Number(linkedSurvey.roofArea) : prev.roofAreaSqFt,
      items: updatedItems
    }));
  };

  // OCR BILL SCAN SIMULATION / HELPER
  const handleSimulateOcrBill = async () => {
    setIsOcrScanning(true);
    try {
      // Simulate reading MSEDCL bill OCR in 600ms
      await new Promise(r => setTimeout(r, 650));
      const simulatedConsumer = '08129' + Math.floor(1000000 + Math.random() * 9000000);
      const simulatedUnits = 485;
      const simulatedBill = Math.round(simulatedUnits * 8.65);
      setFormData(prev => ({
        ...prev,
        consumerNumber: simulatedConsumer,
        discom: 'MSEDCL',
        billingUnit: '4134 Pune City Urban',
        monthlyUnits: simulatedUnits,
        monthlyBill: simulatedBill,
        sanctionedLoad: 6.0,
        tariffRate: 8.65
      }));
    } finally {
      setIsOcrScanning(false);
    }
  };

  // DISCOM CONSUMER DETAILS FETCH SIMULATION
  const handleFetchConsumerDetails = async () => {
    if (!formData.consumerNumber) {
      alert('Please enter a consumer number first.');
      return;
    }
    setIsFetchingConsumer(true);
    try {
      await new Promise(r => setTimeout(r, 700));
      setFormData(prev => ({
        ...prev,
        billingUnit: prev.billingUnit || '4134 Pune City Urban',
        sanctionedLoad: prev.sanctionedLoad || 5.0,
        monthlyUnits: prev.monthlyUnits || 450,
        monthlyBill: prev.monthlyBill || 4100
      }));
    } finally {
      setIsFetchingConsumer(false);
    }
  };

  // LINE ITEM HANDLERS
  const handleUpdateItem = (index: number, field: keyof WizardLineItem, value: any) => {
    setFormData(prev => {
      const updated = [...prev.items];
      const item = { ...updated[index], [field]: value };
      const q = Number(item.quantity) || 0;
      const u = Number(item.unitPrice) || 0;
      const d = Number(item.discount) || 0;
      const taxable = Math.max(0, (q * u) - d);
      const t = Number(item.taxRate) || 0;
      item.total = Math.round(taxable * (1 + t / 100));
      updated[index] = item;
      return { ...prev, items: updated };
    });
  };

  const handleAddItem = () => {
    const newItem: WizardLineItem = {
      id: `custom-${Date.now()}`,
      category: 'CUSTOM',
      description: 'Custom Balance of System / Electrical Protection / Liaisoning Scope',
      quantity: 1,
      unit: 'Lot',
      purchaseCost: 7500,
      unitPrice: 10000,
      discount: 0,
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
      alert('At least one equipment line item is required.');
      return;
    }
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, idx) => idx !== index)
    }));
  };

  const handleSelectProduct = (product: any) => {
    const unitPrice = Number(product.sellingPrice) || 5000;
    const purchaseCost = Number(product.purchasePrice) || Math.round(unitPrice * 0.82);
    const newItem: WizardLineItem = {
      id: `prod-${product.id}-${Date.now()}`,
      productId: product.id,
      category: (product.category?.toUpperCase() || 'CUSTOM') as any,
      description: `${product.name} ${product.brand ? `(${product.brand})` : ''}`,
      quantity: 1,
      unit: 'Nos',
      purchaseCost,
      unitPrice,
      discount: 0,
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
      formData.structureBrand,
      formData.systemType,
      formData.batteryBrand
    );
    setFormData(prev => ({ ...prev, items: defaultItems }));
  };

  // RECALCULATE PANEL QUANTITY WHEN WATTAGE OR CAPACITY CHANGES
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
    const updatedItems = generateDefaultLineItems(
      cap,
      formData.panelBrand,
      formData.panelWattage,
      qty,
      formData.inverterBrand,
      formData.structureBrand,
      formData.systemType,
      formData.batteryBrand
    );
    setFormData(prev => ({
      ...prev,
      systemCapacity: cap,
      inverterCapacity: cap,
      panelQuantity: qty,
      items: updatedItems
    }));
  };

  // SYSTEM TYPE CHANGE HANDLER
  const handleSystemTypeChange = (newType: string) => {
    const updatedItems = generateDefaultLineItems(
      formData.systemCapacity,
      formData.panelBrand,
      formData.panelWattage,
      formData.panelQuantity,
      formData.inverterBrand,
      formData.structureBrand,
      newType,
      formData.batteryBrand
    );
    setFormData(prev => ({
      ...prev,
      systemType: newType,
      items: updatedItems
    }));
  };

  // CENTRALIZED CALCULATION ENGINE
  const lineItemCalculations = useMemo(() => {
    return calculateCommercialPricing({
      items: formData.items.map(it => ({
        id: it.id,
        productId: it.productId,
        category: it.category,
        description: it.description,
        quantity: it.quantity,
        unit: it.unit,
        purchaseCost: it.purchaseCost,
        unitPrice: it.unitPrice,
        discount: it.discount,
        taxRate: it.taxRate
      })),
      overallDiscount: formData.headerDiscount
    });
  }, [formData.items, formData.headerDiscount]);

  const financialCalculations = useMemo(() => {
    const cap = Number(formData.systemCapacity) || 5;
    const totalCost = lineItemCalculations.grandTotal;

    const roi = calculateFinancialROI({
      capacityKw: cap,
      totalInvestment: totalCost,
      connectionType: formData.connectionType as any,
      currentMonthlyBill: formData.monthlyBill,
      gridTariff: formData.tariffRate,
      tariffEscalationRate: formData.tariffEscalationPercent / 100,
      annualDegradationRate: formData.annualDegradationPercent / 100
    });

    const subsidy = calculateIndicativeSubsidy({
      capacityKw: cap,
      connectionType: formData.connectionType
    });

    // Financing EMI
    const loanPct = formData.loanDownPaymentPercent;
    const emi = calculateLoanEMI({
      totalAmount: totalCost,
      downPaymentPercent: loanPct,
      annualInterestRate: formData.loanInterestRate,
      tenureYears: formData.loanTenureYears
    });

    // Estimated roof space (standard 85 sq ft / kWp)
    const requiredRoofSpace = Math.round(cap * 85);

    return {
      ...roi,
      indicativeSubsidy: subsidy.indicativeSubsidy,
      subsidyDisclaimer: subsidy.disclaimer,
      netCustomerCost: Math.max(0, totalCost - subsidy.indicativeSubsidy),
      commercialTaxBenefit: roi.commercialTaxBenefit,
      financing: {
        loanAmount: emi.loanPrincipal,
        monthlyEmi: emi.monthlyEmi,
        totalPayable: emi.totalRepayment,
        totalInterest: emi.totalInterest
      },
      requiredRoofSpace
    };
  }, [
    formData.systemCapacity,
    lineItemCalculations.grandTotal,
    formData.connectionType,
    formData.monthlyBill,
    formData.tariffRate,
    formData.tariffEscalationPercent,
    formData.annualDegradationPercent,
    formData.loanDownPaymentPercent,
    formData.loanInterestRate,
    formData.loanTenureYears
  ]);

  // TEMPLATE CHANGE HANDLER
  const handleSelectTemplate = (templateCode: string) => {
    const tmpl = PROPOSAL_TEMPLATES.find(t => t.code === templateCode);
    if (!tmpl) return;

    const updatedSections = formData.sections.map(sec => ({
      ...sec,
      isEnabled: tmpl.activeSections.includes(sec.id)
    }));

    setFormData(prev => ({
      ...prev,
      templateType: templateCode,
      sections: updatedSections
    }));
  };

  // SECTION REORDER / TOGGLE HANDLERS
  const handleToggleSection = (sectionId: string) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.map(s => 
        s.id === sectionId ? { ...s, isEnabled: !s.isEnabled } : s
      )
    }));
  };

  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    const newSections = [...formData.sections];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newSections.length) return;

    const temp = newSections[index];
    newSections[index] = newSections[targetIdx];
    newSections[targetIdx] = temp;

    // Re-index order
    newSections.forEach((s, idx) => { s.order = idx + 1; });
    setFormData(prev => ({ ...prev, sections: newSections }));
  };

  // COMPOSE PDF DATA OBJECT FOR LIVE REAL-TIME PREVIEW
  const clientName = customerMode === 'new'
    ? (formData.newCustomer.name || 'Valued Customer')
    : formData.selectedType === 'customer'
      ? (customers.find(c => c.id === formData.customerId)?.name || 'Valued Customer')
      : (leads.find(l => l.id === formData.leadId)?.name || 'Valued Customer');

  const clientPhone = customerMode === 'new'
    ? formData.newCustomer.mobile
    : formData.selectedType === 'customer'
      ? (customers.find(c => c.id === formData.customerId)?.mobile || customers.find(c => c.id === formData.customerId)?.phone)
      : (leads.find(l => l.id === formData.leadId)?.mobile || leads.find(l => l.id === formData.leadId)?.phone);

  const clientEmail = customerMode === 'new'
    ? formData.newCustomer.email
    : formData.selectedType === 'customer'
      ? (customers.find(c => c.id === formData.customerId)?.email)
      : (leads.find(l => l.id === formData.leadId)?.email);

  const clientAddress = customerMode === 'new'
    ? `${formData.newCustomer.address || ''}, ${formData.newCustomer.city || ''} ${formData.newCustomer.state || ''}`.trim()
    : formData.selectedType === 'customer'
      ? (customers.find(c => c.id === formData.customerId)?.address || 'Maharashtra, India')
      : (leads.find(l => l.id === formData.leadId)?.address || 'Maharashtra, India');

  const livePdfData: QuotationData = useMemo(() => {
    const cap = Number(formData.systemCapacity) || 5;
    const invCap = Number(formData.inverterCapacity) || cap;
    const grandTotal = lineItemCalculations.grandTotal;
    const subtotal = lineItemCalculations.subtotal;
    const tax = lineItemCalculations.tax;
    const discount = lineItemCalculations.discount;
    const subsidy = financialCalculations.indicativeSubsidy;

    return {
      quotation_number: 'DRAFT-' + Math.floor(1000 + Math.random() * 9000),
      quotation_date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      valid_until: new Date(Date.now() + (formData.validityDays || 15) * 86400000).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: 'DRAFT',
      template_type: formData.templateType,
      primary_color: formData.primaryColor,
      accent_color: formData.accentColor,
      cover_layout: formData.coverLayout,
      font_family: editorFont,
      cover_image: editorCoverImage,
      palette_theme: editorTheme,
      sections_config: formData.sections.map(s => ({
        id: s.id,
        title: s.title,
        isEnabled: s.isEnabled,
        order: s.order
      })),

      company_name: tenantInfo?.legalName || tenantInfo?.name || "WhereReady Solar OS",
      company_legal_name: tenantInfo?.legalName || tenantInfo?.name,
      company_logo: tenantInfo?.logoUrl || "",
      company_address: [tenantInfo?.address, tenantInfo?.city, tenantInfo?.state, tenantInfo?.pincode].filter(Boolean).join(", ") || "MIDC Technology Park, Pune, Maharashtra 411019",
      company_phone: tenantInfo?.phone || "+91 98220 12345",
      company_email: tenantInfo?.email || "contact@wherereadysolar.com",
      company_website: tenantInfo?.website || "https://wherereadysolar.com",
      company_gstin: tenantInfo?.gstin || "27ABCDE1234F1Z5",
      signatory_name: tenantInfo?.signatoryName || "Authorized Signatory",
      signatory_title: tenantInfo?.signatoryTitle || "Head of EPC Engineering",
      signature_url: tenantInfo?.signatureUrl || "",
      company_stamp_url: tenantInfo?.companyStampUrl || "",

      customer_name: clientName,
      customer_phone: clientPhone || "+91 98220 12345",
      customer_email: clientEmail || "customer@example.com",
      project_address: clientAddress || "Pune, Maharashtra",
      consumer_number: formData.consumerNumber,
      discom: formData.discom,
      billing_unit: formData.billingUnit,
      sanctioned_load: formData.sanctionedLoad,
      tariff_rate: formData.tariffRate,
      current_monthly_bill: formData.monthlyBill,
      monthly_units: formData.monthlyUnits,
      roof_area_sqft: formData.roofAreaSqFt,

      system_capacity: cap,
      inverter_capacity: invCap,
      annual_generation: Math.round(cap * 1460),
      system_type: formData.systemType,
      connection_type: formData.connectionType,
      phase: formData.phase,
      roof_type: formData.roofType,
      expected_timeline: formData.deliveryTimeline,

      panel_brand: formData.panelBrand,
      panel_model: formData.panelModel,
      panel_wattage: formData.panelWattage,
      panel_quantity: formData.panelQuantity,
      panel_warranty: formData.panelWarranty,

      inverter_brand: formData.inverterBrand,
      inverter_model: formData.inverterModel,
      inverter_quantity: formData.inverterQuantity,
      inverter_warranty: formData.inverterWarranty,

      battery_brand: formData.batteryBrand,
      battery_model: formData.batteryModel,
      battery_capacity: formData.batteryCapacity,
      battery_quantity: formData.batteryQuantity,
      battery_warranty: formData.batteryWarranty,
      backup_load_watts: formData.backupLoadWatts,

      structure_brand: formData.structureBrand,
      structure_warranty: formData.structureWarranty,

      components: formData.items.map(it => ({
        category: it.category,
        brand: it.category === 'MODULE' ? formData.panelBrand : it.category === 'INVERTER' ? formData.inverterBrand : formData.structureBrand,
        model: it.description,
        specification: `${it.quantity} ${it.unit || 'Nos'}`,
        quantity: it.quantity,
        warranty: it.category === 'MODULE' ? formData.panelWarranty : it.category === 'INVERTER' ? formData.inverterWarranty : '10 Years Structural'
      })),

      scope_of_supply: [
        { item: "Detailed Technical Site Feasibility & Shadow Analysis Survey", status: "INCLUDED" },
        { item: `Supply of ${cap} kWp Tier-1 Solar PV Modules (${formData.panelBrand})`, status: "INCLUDED" },
        { item: `Supply of ${invCap} kW High-Efficiency Inverter (${formData.inverterBrand})`, status: "INCLUDED" },
        { item: "Hot-Dip Galvanized (HDG) / Aluminum Module Mounting Structure", status: "INCLUDED" },
        { item: "UV-Protected 4 sq.mm DC Solar Cables & Conduits", status: "INCLUDED" },
        { item: "ACDB & DCDB Distribution Boxes with Type-II SPDs", status: "INCLUDED" },
        { item: "Maintenance-Free Dual Chemical Earthing Kit & LA", status: "INCLUDED" },
        { item: "Turnkey Mechanical & Electrical Installation & Termination", status: "INCLUDED" },
        { item: "State DISCOM Net Metering Liasoning & Commissioning Coordination", status: "INCLUDED" },
        { item: "Civil Masonry Structural Alteration or Roof Waterproofing", status: "EXCLUDED" },
        { item: "Statutory DISCOM Net Meter Testing & Registration Fees (Actuals)", status: "EXCLUDED" },
        { item: "Additional AC Cabling Exceeding 25 Meters from Inverter to LT Panel", status: "CHARGEABLE" }
      ],

      pricing: formData.items.map(it => ({
        description: it.description,
        qty: it.quantity,
        unit: it.unit || 'Nos',
        unit_price: it.unitPrice,
        tax_rate: it.taxRate,
        amount: Math.round(Number(it.quantity) * Number(it.unitPrice))
      })),

      subtotal,
      discount,
      tax,
      taxable_amount: Math.max(0, subtotal - discount),
      cgst: Math.round(tax / 2),
      sgst: tax - Math.round(tax / 2),
      grand_total: grandTotal,
      indicative_subsidy: subsidy,
      net_customer_cost: Math.max(0, grandTotal - subsidy),
      commercial_tax_benefit: (formData.connectionType === 'Commercial' || formData.connectionType === 'Industrial') ? financialCalculations.commercialTaxBenefit : 0,
      amount_in_words: toIndianWords(grandTotal),

      estimated_monthly_bill: Math.max(450, Math.round(formData.monthlyBill - financialCalculations.monthlySavings)),
      annual_savings: financialCalculations.annualSavings,
      monthly_savings: financialCalculations.monthlySavings,
      payback_period: financialCalculations.paybackYears,
      lifetime_savings: financialCalculations.lifetimeSavings,
      lifetime_generation: Math.round(cap * 1460 * 25 * 0.92),

      co2_reduction: Math.round(cap * 1460 * 0.82),
      tree_equivalent: Math.round((cap * 1460 * 0.82) / 20),
      peak_month: "May",
      financial_projections: financialCalculations.financialProjections,

      payment_terms: formData.paymentMilestones.map(m => ({
        percentage: m.percentage,
        amount: Math.round(grandTotal * (m.percentage / 100)),
        description: m.description
      })),

      warranties: {
        modules: formData.panelWarranty,
        inverter: formData.inverterWarranty,
        structure: formData.structureWarranty,
        installation: "5 Years Turnkey Workmanship Guarantee",
        battery: formData.batteryWarranty,
        other: "1 Year Free Comprehensive O&M"
      },

      exclusions: [
        "Major structural modification or civil masonry alterations of the existing roof slab.",
        "Internal building electrical wiring alterations beyond the LT inverter interface panel.",
        "Statutory DISCOM application and inspection fees (payable directly to utility by consumer)."
      ],

      terms_and_conditions: [
        `Proposal Validity: This commercial proposal is valid for ${formData.validityDays || 15} days from date of issue.`,
        "Government Subsidies: Central financial assistance under PM Surya Ghar Muft Bijli Yojana is credited directly to the customer's Aadhaar-linked bank account via DBT post-commissioning and is subject to MNRE portal verification.",
        "Net Metering: Net metering feasibility and transformer capacity allocation are governed by State Electricity Regulatory Commission (MERC/SERC) norms.",
        "Customer Responsibilities: Providing unobstructed rooftop access, shadow-free roof area, water supply for cleaning, and single/three-phase auxiliary power during installation."
      ],

      financing_details: formData.includeLoanFinancing ? {
        down_payment: Math.round(grandTotal * (formData.loanDownPaymentPercent / 100)),
        loan_amount: financialCalculations.financing.loanAmount,
        interest_rate: formData.loanInterestRate,
        tenure_years: formData.loanTenureYears,
        monthly_emi: financialCalculations.financing.monthlyEmi
      } : undefined
    };
  }, [
    formData,
    clientName,
    clientPhone,
    clientEmail,
    clientAddress,
    tenantInfo,
    lineItemCalculations,
    financialCalculations
  ]);

  // VALIDATION CHECKLIST
  const validationIssues = useMemo(() => {
    const issues: string[] = [];
    if (customerMode === 'new') {
      if (!formData.newCustomer.name) issues.push('Customer full name is required');
      if (!formData.newCustomer.mobile) issues.push('Customer mobile phone is required');
    } else if (formData.selectedType === 'customer' && !formData.customerId) {
      issues.push('Please select a customer from the directory');
    } else if (formData.selectedType === 'lead' && !formData.leadId) {
      issues.push('Please select a CRM lead opportunity');
    }

    if (formData.systemCapacity <= 0) issues.push('System capacity must be greater than 0 kWp');
    if (lineItemCalculations.grandTotal <= 0) issues.push('Grand quotation total must be greater than ₹0');

    // Milestones sum check
    const milestoneSum = formData.paymentMilestones.reduce((acc, m) => acc + (Number(m.percentage) || 0), 0);
    if (Math.round(milestoneSum) !== 100) {
      issues.push(`Payment milestones must sum exactly to 100% (currently ${milestoneSum}%)`);
    }

    return issues;
  }, [formData, customerMode, lineItemCalculations.grandTotal]);

  // SUBMIT QUOTATION HANDLER
  const handleSaveQuotation = async (status: 'DRAFT' | 'SENT' = 'DRAFT') => {
    if (validationIssues.length > 0) {
      alert('Please resolve the following required fields before proceeding:\n• ' + validationIssues.join('\n• '));
      return;
    }

    setLoading(true);
    try {
      const payload = {
        customerId: customerMode !== 'new' && formData.selectedType === 'customer' ? formData.customerId : null,
        leadId: customerMode !== 'new' && formData.selectedType === 'lead' ? formData.leadId : null,
        newCustomer: customerMode === 'new' ? formData.newCustomer : null,
        status,

        templateType: formData.templateType,
        sectionsConfig: formData.sections,
        designConfig: {
          primaryColor: formData.primaryColor,
          accentColor: formData.accentColor,
          coverLayout: formData.coverLayout,
          fontFamily: formData.fontFamily
        },

        systemCapacity: formData.systemCapacity,
        systemType: formData.systemType,
        connectionType: formData.connectionType,
        phase: formData.phase,
        roofType: formData.roofType,
        roofAreaSqFt: formData.roofAreaSqFt,

        consumerNumber: formData.consumerNumber,
        discom: formData.discom,
        billingUnit: formData.billingUnit,
        sanctionedLoad: formData.sanctionedLoad,
        tariffRate: formData.tariffRate,
        monthlyBill: formData.monthlyBill,
        monthlyUnits: formData.monthlyUnits,
        billDocumentUrl: formData.billDocumentUrl,

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

        batteryBrand: formData.systemType !== 'On-grid' ? formData.batteryBrand : null,
        batteryModel: formData.systemType !== 'On-grid' ? formData.batteryModel : null,
        batteryCapacity: formData.systemType !== 'On-grid' ? formData.batteryCapacity : null,
        batteryQuantity: formData.systemType !== 'On-grid' ? formData.batteryQuantity : null,
        batteryWarranty: formData.systemType !== 'On-grid' ? formData.batteryWarranty : null,
        backupLoadWatts: formData.systemType !== 'On-grid' ? formData.backupLoadWatts : null,

        structureBrand: formData.structureBrand,
        structureWarranty: formData.structureWarranty,

        total: lineItemCalculations.grandTotal,
        subtotal: lineItemCalculations.subtotal,
        tax: lineItemCalculations.tax,
        discount: lineItemCalculations.discount,
        validityDays: formData.validityDays,

        items: formData.items.map(it => ({
          productId: it.productId || null,
          category: it.category,
          description: it.description,
          quantity: Number(it.quantity) || 1,
          unit: it.unit || 'Nos',
          purchaseCost: Number(it.purchaseCost) || 0,
          unitPrice: Number(it.unitPrice) || 0,
          discount: Number(it.discount) || 0,
          taxRate: Number(it.taxRate) || 0,
          total: Math.round(Number(it.quantity) * Number(it.unitPrice))
        })),

        paymentMilestones: formData.paymentMilestones.map(m => ({
          percentage: m.percentage,
          amount: Math.round(lineItemCalculations.grandTotal * (m.percentage / 100)),
          description: m.description
        })),

        financingDetails: formData.includeLoanFinancing ? {
          down_payment: Math.round(lineItemCalculations.grandTotal * (formData.loanDownPaymentPercent / 100)),
          loan_amount: financialCalculations.financing.loanAmount,
          interest_rate: formData.loanInterestRate,
          tenure_years: formData.loanTenureYears,
          monthly_emi: financialCalculations.financing.monthlyEmi
        } : null,

        commercialAnalysis: (formData.connectionType === 'Commercial' || formData.connectionType === 'Industrial') ? {
          acceleratedDepreciation: 40,
          corporateTaxRate: 25.17,
          taxBenefitAmount: financialCalculations.commercialTaxBenefit
        } : null
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

  // DIRECT DOWNLOAD A4 PROPOSAL PDF
  const handleDownloadA4Pdf = async () => {
    try {
      setLoading(true);
      await generatePDF('wizard-live-pdf-preview', `Proposal_${livePdfData.quotation_number}.pdf`);
    } catch (err) {
      console.error('PDF download error:', err);
      alert('Could not download PDF. Printing preview instead.');
      printHtmlElement('wizard-live-pdf-preview');
    } finally {
      setLoading(false);
    }
  };

  // WHATSAPP SHARE PITCH
  const handleShareWhatsApp = () => {
    const rawDigits = (clientPhone || '').replace(/[^0-9]/g, '');
    const cleanDigits = rawDigits.startsWith('91') ? rawDigits : rawDigits.replace(/^0+/, '');
    const finalPhone = cleanDigits.startsWith('91') ? cleanDigits : (cleanDigits ? '91' + cleanDigits : '');

    const tenantName = tenantInfo?.legalName || tenantInfo?.name || 'WhereReady Solar';
    const cap = formData.systemCapacity;
    const total = formatINR(lineItemCalculations.grandTotal);
    const sub = financialCalculations.indicativeSubsidy;
    const net = formatINR(financialCalculations.netCustomerCost);
    const annualSavings = formatINR(financialCalculations.annualSavings);

    const msg = `Dear ${clientName},\n\nGreetings from *${tenantName}*!\n\nWe have prepared your customized Solar Rooftop Proposal for *${cap} kWp (${formData.systemType})*.\n\n*Proposal Highlights:*\n• Total Investment: ${total}\n${sub > 0 ? `• PM Surya Ghar Central Subsidy: ${formatINR(sub)}\n• Net Investment Outflow: ${net}\n` : ''}• Est. Annual Electricity Savings: ${annualSavings}/year\n• Estimated Payback: ${financialCalculations.paybackYears} Years\n• Proposal Validity: ${formData.validityDays} Days\n\nPlease let us know if you would like to schedule a site engineering inspection!\n\nBest Regards,\n*${tenantName}*\nPhone: ${tenantInfo?.phone || '+91 98220 12345'}`;

    const url = `https://wa.me/${finalPhone}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  const steps = [
    { id: 1, name: 'Customer & Site', short: 'Customer' },
    { id: 2, name: 'System Hardware', short: 'System' },
    { id: 3, name: 'Pricing & BOM', short: 'Pricing' },
    { id: 4, name: 'Savings & ROI', short: 'Financials' },
    { id: 5, name: 'Template & Layout', short: 'Template' },
    { id: 6, name: 'Document Preview', short: 'Preview' }
  ];

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-50 bg-[#071A2B]/85 backdrop-blur-md flex items-center justify-center ${isFullscreen ? 'p-0' : 'p-1 sm:p-2 lg:p-3'} overflow-hidden`}>
      <div className={`bg-slate-50 w-full h-full ${isFullscreen ? 'max-w-none max-h-none rounded-none border-0' : 'max-w-[99vw] 2xl:max-w-[1680px] max-h-[98vh] rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200'} flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200`}>
        
        {/* UNIFIED EXPANSIVE TOP BAR */}
        <div className="bg-white border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4 flex-shrink-0">
          
          {/* LEFT: TITLE & ACTIVE CONTEXT */}
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-sm border border-emerald-500/20 flex-shrink-0">
              <Sun size={20} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900 tracking-tight">Solar Proposal Studio</h2>
                <span className="hidden sm:inline-block text-[11px] font-extrabold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                  {formData.systemCapacity} kWp · {formData.systemType} · {formData.connectionType}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium truncate max-w-xs sm:max-w-md">
                Client: <strong className="text-slate-800">{clientName}</strong> · Consumer: <span className="font-mono">{formData.consumerNumber || 'Not set'}</span>
              </p>
            </div>
          </div>

          {/* CENTER: CLEAN MINIMAL 6-STEP STEPPER */}
          <div className="hidden lg:flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-2xl border border-slate-200/60">
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
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Quotation Total</span>
              <span className="text-sm font-black text-[#071A2B]">{formatINR(lineItemCalculations.grandTotal)}</span>
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
        <div className="lg:hidden bg-slate-100 px-4 py-2 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-700">
          <span>Step {currentStep} of 6: {steps[currentStep - 1].name}</span>
          <span className="font-black text-[#071A2B]">{formatINR(lineItemCalculations.grandTotal)}</span>
        </div>

        {/* MAIN FULL-WIDTH SCROLLABLE WORKSPACE */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
          <div className="w-full max-w-7xl mx-auto space-y-5">

            {/* ======================================================== */}
            {/* STEP 1: CUSTOMER & SITE SELECTION WITH BILL OCR */}
            {/* ======================================================== */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                  
                  {/* TOP CRM SELECTOR */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div>
                      <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                        <User size={20} className="text-emerald-600" /> Select Customer or CRM Lead
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Choose an active opportunity or register a new client for this quotation.
                      </p>
                    </div>

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

                  {/* SEARCH & CARDS GRID */}
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

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 max-h-[280px] overflow-y-auto pr-1">
                        {leads
                          .filter(l => !customerSearch || l.name?.toLowerCase().includes(customerSearch.toLowerCase()) || l.mobile?.includes(customerSearch) || l.city?.toLowerCase().includes(customerSearch.toLowerCase()))
                          .map(l => {
                            const isSelected = formData.selectedType === 'lead' && formData.leadId === l.id;
                            return (
                              <div
                                key={l.id}
                                onClick={() => setFormData(prev => ({ ...prev, selectedType: 'lead', leadId: l.id }))}
                                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                                  isSelected 
                                    ? 'bg-emerald-50/70 border-emerald-500 shadow-sm ring-2 ring-emerald-500/20' 
                                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                                }`}
                              >
                                <div>
                                  <div className="flex items-center justify-between">
                                    <span className="font-extrabold text-xs text-slate-900 truncate">{l.name}</span>
                                    {isSelected && <CheckCircle size={15} className="text-emerald-600 flex-shrink-0" />}
                                  </div>
                                  <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-1">
                                    <Phone size={11} className="text-slate-400" /> {l.mobile || 'No Phone'}
                                  </p>
                                  <p className="text-[11px] text-slate-500 flex items-center gap-1">
                                    <MapPin size={11} className="text-slate-400" /> {l.city || 'Maharashtra'}
                                  </p>
                                </div>
                                <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px]">
                                  <span className="font-bold text-slate-700 bg-slate-100 px-1.5 py-0.2 rounded">
                                    {l.estimatedCap ? `${l.estimatedCap} kWp` : '5 kWp'}
                                  </span>
                                  <span className="text-emerald-700 font-bold">{l.status || 'ACTIVE'}</span>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}

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

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 max-h-[280px] overflow-y-auto pr-1">
                        {customers
                          .filter(c => !customerSearch || c.name?.toLowerCase().includes(customerSearch.toLowerCase()) || c.mobile?.includes(customerSearch))
                          .map(c => {
                            const isSelected = formData.selectedType === 'customer' && formData.customerId === c.id;
                            return (
                              <div
                                key={c.id}
                                onClick={() => setFormData(prev => ({ ...prev, selectedType: 'customer', customerId: c.id }))}
                                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                                  isSelected 
                                    ? 'bg-emerald-50/70 border-emerald-500 shadow-sm ring-2 ring-emerald-500/20' 
                                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                                }`}
                              >
                                <div>
                                  <div className="flex items-center justify-between">
                                    <span className="font-extrabold text-xs text-slate-900 truncate">{c.name}</span>
                                    {isSelected && <CheckCircle size={15} className="text-emerald-600 flex-shrink-0" />}
                                  </div>
                                  <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-1">
                                    <Phone size={11} className="text-slate-400" /> {c.mobile || 'No Phone'}
                                  </p>
                                </div>
                                <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px]">
                                  <span className="font-bold text-slate-700 bg-slate-100 px-1.5 py-0.2 rounded">Customer</span>
                                  <span className="text-emerald-700 font-bold">Active</span>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}

                  {customerMode === 'new' && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700 uppercase">Customer Full Name *</label>
                        <input
                          type="text"
                          placeholder="e.g. Ramesh Patil"
                          value={formData.newCustomer.name}
                          onChange={e => setFormData({ ...formData, newCustomer: { ...formData.newCustomer, name: e.target.value } })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700 uppercase">Mobile Number (WhatsApp) *</label>
                        <input
                          type="tel"
                          placeholder="+91 98220 12345"
                          value={formData.newCustomer.mobile}
                          onChange={e => setFormData({ ...formData, newCustomer: { ...formData.newCustomer, mobile: e.target.value } })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700 uppercase">Email Address</label>
                        <input
                          type="email"
                          placeholder="ramesh@example.com"
                          value={formData.newCustomer.email}
                          onChange={e => setFormData({ ...formData, newCustomer: { ...formData.newCustomer, email: e.target.value } })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700 uppercase">City / District</label>
                        <input
                          type="text"
                          placeholder="Pune"
                          value={formData.newCustomer.city}
                          onChange={e => setFormData({ ...formData, newCustomer: { ...formData.newCustomer, city: e.target.value } })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                        />
                      </div>
                      <div className="col-span-1 sm:col-span-2 space-y-1">
                        <label className="text-[11px] font-bold text-slate-700 uppercase">Rooftop Installation Address</label>
                        <input
                          type="text"
                          placeholder="Plot 14, Shubham Park, Baner Road, Pune - 411045"
                          value={formData.newCustomer.address}
                          onChange={e => setFormData({ ...formData, newCustomer: { ...formData.newCustomer, address: e.target.value } })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                        />
                      </div>
                    </div>
                  )}

                  {/* ELECTRICITY BILL & UTILITY DISCOM INTEGRATION */}
                  <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-50/70 to-emerald-50/50 border border-blue-200/80 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                          <Zap size={16} className="text-blue-600" /> Electricity Bill & State DISCOM Integration
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Enables precise solar generation sizing and automatic DISCOM net-metering synchronization.
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleSimulateOcrBill}
                          disabled={isOcrScanning}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                        >
                          <Scan size={14} className={isOcrScanning ? "animate-spin" : ""} />
                          {isOcrScanning ? 'Scanning...' : 'OCR Bill Scan'}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs">
                      <div className="space-y-1">
                        <label className="font-bold text-slate-700 uppercase text-[10px]">State DISCOM / Utility</label>
                        <select
                          value={formData.discom}
                          onChange={e => setFormData({ ...formData, discom: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {DISCOM_OPTIONS.map(d => (
                            <option key={d.code} value={d.code}>{d.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <label className="font-bold text-slate-700 uppercase text-[10px]">Consumer Number</label>
                          <button
                            type="button"
                            onClick={handleFetchConsumerDetails}
                            disabled={isFetchingConsumer}
                            className="text-[10px] text-blue-600 font-extrabold hover:underline"
                          >
                            {isFetchingConsumer ? 'Fetching...' : 'Verify'}
                          </button>
                        </div>
                        <input
                          type="text"
                          placeholder="e.g. 081290384721"
                          value={formData.consumerNumber}
                          onChange={e => setFormData({ ...formData, consumerNumber: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-700 uppercase text-[10px]">Average Monthly Bill (₹)</label>
                        <input
                          type="number"
                          placeholder="4500"
                          value={formData.monthlyBill}
                          onChange={e => setFormData({ ...formData, monthlyBill: Number(e.target.value) })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-black text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-700 uppercase text-[10px]">Monthly Consumption (Units/kWh)</label>
                        <input
                          type="number"
                          placeholder="420"
                          value={formData.monthlyUnits}
                          onChange={e => setFormData({ ...formData, monthlyUnits: Number(e.target.value) })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-black text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs pt-1">
                      <div className="space-y-1">
                        <label className="font-bold text-slate-700 uppercase text-[10px]">Sanctioned Load (kW)</label>
                        <input
                          type="number"
                          step="0.5"
                          value={formData.sanctionedLoad}
                          onChange={e => setFormData({ ...formData, sanctionedLoad: Number(e.target.value) })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold text-slate-800 outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-700 uppercase text-[10px]">Grid Tariff Rate (₹ / Unit)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={formData.tariffRate}
                          onChange={e => setFormData({ ...formData, tariffRate: Number(e.target.value) })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold text-slate-800 outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-700 uppercase text-[10px]">Usable Roof Area (Sq. Ft.)</label>
                        <input
                          type="number"
                          placeholder="650"
                          value={formData.roofAreaSqFt}
                          onChange={e => setFormData({ ...formData, roofAreaSqFt: Number(e.target.value) })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold text-slate-800 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* SITE SURVEY BANNER IF DETECTED */}
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
                        <CheckCheck size={14} /> Auto-Apply Survey Findings
                      </button>
                    </div>
                  )}

                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* STEP 2: SOLAR SYSTEM CONFIGURATION */}
            {/* ======================================================== */}
            {currentStep === 2 && (
              <div className="space-y-5 animate-in fade-in duration-200">
                
                {/* 1. QUICK SOLAR PACKAGES */}
                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                        <Sparkles size={18} className="text-amber-500" /> Pre-Engineered Solar Packages (Maharashtra)
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">Select a standardized EPC package to auto-fill capacity, modules, inverter, and costs.</p>
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
                              <span className="font-extrabold text-slate-900">{formatINR(p.indicativePrice)}</span>
                            </div>
                            {p.subsidy > 0 && (
                              <div className="flex justify-between items-center text-[11px] text-emerald-700 font-bold">
                                <span>Net Outflow:</span>
                                <span>{formatINR(p.netCost)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. DUAL COLUMN STUDIO GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  
                  {/* LEFT: CAPACITY SLIDER & ELECTRICAL SPECS */}
                  <div className="lg:col-span-6 space-y-5">
                    
                    {/* CAPACITY SLIDER CARD */}
                    <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                            <Sliders size={16} className="text-emerald-600" /> Fine-Tune System DC Capacity
                          </h3>
                          <p className="text-[11px] text-slate-500 mt-0.5">Auto-calculates panel count, required roof space, and annual generation.</p>
                        </div>

                        <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                          <input
                            type="number"
                            step="0.5"
                            min="1"
                            max="250"
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

                      {/* QUICK CAPACITY CHIPS */}
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

                      {/* METRICS SUMMARY CHIPS */}
                      <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                          <span className="text-[10px] text-slate-400 font-bold block uppercase">Est. Annual Generation</span>
                          <strong className="text-slate-900">~{Math.round(formData.systemCapacity * 1460).toLocaleString()} kWh / yr</strong>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                          <span className="text-[10px] text-slate-400 font-bold block uppercase">Est. Roof Space Req.</span>
                          <strong className="text-slate-900">~{financialCalculations.requiredRoofSpace} Sq. Ft.</strong>
                        </div>
                      </div>
                    </div>

                    {/* SITE & ELECTRICAL SPECS CARD */}
                    <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3.5">
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Site & Electrical Topology</h3>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                        <div className="space-y-1">
                          <label className="font-bold text-slate-700 uppercase text-[11px]">System Configuration</label>
                          <select
                            value={formData.systemType}
                            onChange={e => handleSystemTypeChange(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                          >
                            <option value="On-grid">On-grid (Grid Tied Net Metering)</option>
                            <option value="Hybrid">Hybrid (Solar + Grid + Battery)</option>
                            <option value="Off-grid">Off-grid (Battery Standalone)</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="font-bold text-slate-700 uppercase text-[11px]">Tariff Category</label>
                          <select
                            value={formData.connectionType}
                            onChange={e => setFormData({ ...formData, connectionType: e.target.value, tariffRate: e.target.value === 'Commercial' ? 10.5 : 8.5 })}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                          >
                            <option value="Residential">Residential (LT-1)</option>
                            <option value="Commercial">Commercial (LT-2)</option>
                            <option value="Industrial">Industrial (HT/LT)</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="font-bold text-slate-700 uppercase text-[11px]">Grid Connection Phase</label>
                          <select
                            value={formData.phase}
                            onChange={e => setFormData({ ...formData, phase: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                          >
                            <option value="Single Phase">Single Phase (230V AC)</option>
                            <option value="Three Phase">Three Phase (415V AC)</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="font-bold text-slate-700 uppercase text-[11px]">Rooftop Architecture</label>
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
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Equipment Catalogue & Warranties</h3>
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          Tier-1 Hardware Sourced
                        </span>
                      </div>

                      <div className="space-y-3.5 text-xs">
                        {/* MODULE CARD */}
                        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-500 uppercase text-[10px]">Solar PV Modules</span>
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-black rounded text-[11px]">
                              {formData.panelQuantity} Panels ({Math.round(formData.panelQuantity * formData.panelWattage / 1000 * 10) / 10} kWp)
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={formData.panelBrand}
                              onChange={e => setFormData({ ...formData, panelBrand: e.target.value })}
                              placeholder="Make (Waaree / Adani / Tata)"
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
                          <input
                            type="text"
                            value={formData.panelWarranty}
                            onChange={e => setFormData({ ...formData, panelWarranty: e.target.value })}
                            className="w-full px-3 py-1.5 bg-white rounded-xl border border-slate-200 font-semibold text-slate-600 outline-none text-[11px]"
                          />
                        </div>

                        {/* INVERTER CARD */}
                        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-500 uppercase text-[10px]">Solar Inverter</span>
                            <span className="px-2 py-0.5 bg-slate-200 text-slate-800 font-black rounded text-[11px]">
                              {formData.inverterCapacity} kW AC Rating
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={formData.inverterBrand}
                              onChange={e => setFormData({ ...formData, inverterBrand: e.target.value })}
                              placeholder="Make (Growatt / Sungrow / Solis)"
                              className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                            <input
                              type="number"
                              step="0.5"
                              value={formData.inverterCapacity}
                              onChange={e => setFormData({ ...formData, inverterCapacity: Number(e.target.value) })}
                              placeholder="Rating kW"
                              className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 font-bold outline-none"
                            />
                          </div>
                          <input
                            type="text"
                            value={formData.inverterWarranty}
                            onChange={e => setFormData({ ...formData, inverterWarranty: e.target.value })}
                            className="w-full px-3 py-1.5 bg-white rounded-xl border border-slate-200 font-semibold text-slate-600 outline-none text-[11px]"
                          />
                        </div>

                        {/* CONDITIONAL BATTERY CARD FOR HYBRID / OFF-GRID */}
                        {formData.systemType !== 'On-grid' && (
                          <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2 animate-in fade-in">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-amber-900 uppercase text-[10px] flex items-center gap-1.5">
                                <Battery size={13} className="text-amber-600" /> Battery Storage (Hybrid / Off-Grid)
                              </span>
                              <span className="px-2 py-0.5 bg-amber-200 text-amber-900 font-black rounded text-[11px]">
                                {formData.batteryCapacity} kWh ({formData.backupLoadWatts}W Backup)
                              </span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <input
                                type="text"
                                value={formData.batteryBrand}
                                onChange={e => setFormData({ ...formData, batteryBrand: e.target.value })}
                                placeholder="Battery Brand (Tata Power / Luminous)"
                                className="w-full px-3 py-2 bg-white rounded-xl border border-amber-200 font-bold outline-none"
                              />
                              <input
                                type="number"
                                step="0.5"
                                value={formData.batteryCapacity}
                                onChange={e => setFormData({ ...formData, batteryCapacity: Number(e.target.value) })}
                                placeholder="Capacity in kWh"
                                className="w-full px-3 py-2 bg-white rounded-xl border border-amber-200 font-bold outline-none"
                              />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <input
                                type="number"
                                value={formData.backupLoadWatts}
                                onChange={e => setFormData({ ...formData, backupLoadWatts: Number(e.target.value) })}
                                placeholder="Backup Load in Watts"
                                className="w-full px-3 py-1.5 bg-white rounded-xl border border-amber-200 font-semibold text-slate-700 outline-none text-[11px]"
                              />
                              <input
                                type="text"
                                value={formData.batteryWarranty}
                                onChange={e => setFormData({ ...formData, batteryWarranty: e.target.value })}
                                className="w-full px-3 py-1.5 bg-white rounded-xl border border-amber-200 font-semibold text-slate-700 outline-none text-[11px]"
                              />
                            </div>
                          </div>
                        )}

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
            {/* STEP 3: COMMERCIAL PRICING & BOM */}
            {/* ======================================================== */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                  
                  {/* HEADER */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                          <IndianRupee size={22} className="text-emerald-600" /> Commercial Line-Item Pricing & BOM
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                          Automated Calculation
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        Adjust line-item quantities, unit selling prices, and taxes. Internal procurement costs remain confidential and are hidden from customer-facing PDF proposals.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowInternalPurchaseCosts(prev => !prev)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                          showInternalPurchaseCosts
                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                        }`}
                      >
                        {showInternalPurchaseCosts ? 'Hide Purchase Margin' : 'Show Purchase Margin'}
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowProductPicker(prev => !prev)}
                        className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                      >
                        <Package size={14} /> Add from Catalogue
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
                        title="Reset BOM to package defaults"
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                      >
                        <RefreshCw size={14} />
                      </button>
                    </div>
                  </div>

                  {/* INVENTORY CATALOGUE DRAWER */}
                  {showProductPicker && (
                    <div className="p-4 bg-slate-50 border border-emerald-200 rounded-2xl space-y-3 animate-in fade-in">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold uppercase text-slate-700 flex items-center gap-1.5">
                          <Search size={14} className="text-emerald-600" /> Sourced Equipment Catalogue
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
                                <p className="text-[11px] text-slate-400">{p.brand || 'Generic'} · Category: {p.category}</p>
                              </div>
                              <div className="text-right">
                                <span className="font-black text-[#071A2B]">{formatINR(p.sellingPrice || 0)}</span>
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
                          <th className="py-3 px-3">Description & Specifications</th>
                          <th className="py-3 px-2 w-20 text-center">Qty</th>
                          <th className="py-3 px-2 w-20 text-center">Unit</th>
                          {showInternalPurchaseCosts && (
                            <th className="py-3 px-3 w-28 text-amber-800 bg-amber-50/50">Buy Cost (₹)</th>
                          )}
                          <th className="py-3 px-3 w-32">Selling Rate (₹)</th>
                          <th className="py-3 px-2 w-20 text-center">Discount</th>
                          <th className="py-3 px-2 w-20 text-center">GST %</th>
                          <th className="py-3 px-3 text-right w-32">Total (₹)</th>
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
                                type="text"
                                value={item.unit || 'Nos'}
                                onChange={e => handleUpdateItem(idx, 'unit', e.target.value)}
                                className="w-full px-2 py-1.5 bg-slate-50/80 hover:bg-white focus:bg-white rounded-lg border border-transparent hover:border-slate-300 focus:border-emerald-500 font-semibold text-slate-700 text-xs text-center outline-none"
                              />
                            </td>
                            {showInternalPurchaseCosts && (
                              <td className="p-2 bg-amber-50/20">
                                <input
                                  type="number"
                                  min="0"
                                  value={item.purchaseCost || 0}
                                  onChange={e => handleUpdateItem(idx, 'purchaseCost', Number(e.target.value))}
                                  className="w-full px-2 py-1.5 bg-white rounded-lg border border-amber-200 font-mono font-bold text-amber-900 text-xs outline-none"
                                />
                              </td>
                            )}
                            <td className="p-2">
                              <input
                                type="number"
                                min="0"
                                value={item.unitPrice}
                                onChange={e => handleUpdateItem(idx, 'unitPrice', Number(e.target.value))}
                                className="w-full px-2 py-1.5 bg-slate-50/80 hover:bg-white focus:bg-white rounded-lg border border-transparent hover:border-slate-300 focus:border-emerald-500 font-bold text-slate-900 text-xs outline-none"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                min="0"
                                value={item.discount || 0}
                                onChange={e => handleUpdateItem(idx, 'discount', Number(e.target.value))}
                                className="w-full px-2 py-1.5 bg-slate-50/80 hover:bg-white focus:bg-white rounded-lg border border-transparent hover:border-slate-300 focus:border-emerald-500 font-bold text-slate-900 text-xs text-center outline-none"
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
                              {formatINR(item.total)}
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

                  {/* 3-COLUMN COMMERCIAL TOTALS MATRIX */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2">
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Subtotal</span>
                      <p className="text-xl font-black text-slate-900">{formatINR(lineItemCalculations.subtotal)}</p>
                      <p className="text-[10px] text-slate-500 font-medium">Sum of equipment & labour</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">GST Tax Breakdown</span>
                      <p className="text-xl font-black text-slate-800">{formatINR(lineItemCalculations.tax)}</p>
                      <p className="text-[10px] text-slate-500 font-medium">CGST: {formatINR(lineItemCalculations.cgst)} + SGST: {formatINR(lineItemCalculations.sgst)}</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-1">
                      <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider block">Central Subsidy (Surya Ghar)</span>
                      <p className="text-xl font-black text-emerald-700">- {formatINR(financialCalculations.indicativeSubsidy)}</p>
                      <p className="text-[10px] text-emerald-600 font-medium">DBT credit to customer bank</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#071A2B] text-white space-y-1 shadow-md">
                      <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider block">Grand Quotation Total</span>
                      <p className="text-2xl font-black text-white">{formatINR(lineItemCalculations.grandTotal)}</p>
                      <p className="text-[10px] text-slate-400 font-medium">Invoice payable amount</p>
                    </div>
                  </div>

                  {/* PAYMENT MILESTONES REBALANCER */}
                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider">Payment Milestone Schedule (100% Release Stages)</h4>
                      <span className="text-[11px] font-bold text-slate-500">
                        Total: {formData.paymentMilestones.reduce((acc, m) => acc + (Number(m.percentage) || 0), 0)}%
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {formData.paymentMilestones.map((m, idx) => (
                        <div key={idx} className="flex items-center gap-2.5 p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={m.percentage}
                            onChange={e => {
                              const updated = [...formData.paymentMilestones];
                              updated[idx].percentage = Number(e.target.value);
                              setFormData({ ...formData, paymentMilestones: updated });
                            }}
                            className="w-14 py-1 bg-[#071A2B] text-white rounded-lg text-center font-black text-xs outline-none"
                          />
                          <span className="text-slate-400 font-bold">%</span>
                          <input
                            type="text"
                            value={m.description}
                            onChange={e => {
                              const updated = [...formData.paymentMilestones];
                              updated[idx].description = e.target.value;
                              setFormData({ ...formData, paymentMilestones: updated });
                            }}
                            className="flex-1 bg-transparent font-semibold text-slate-800 outline-none text-xs"
                          />
                          <span className="font-black text-slate-900 text-xs whitespace-nowrap">
                            {formatINR(Math.round(lineItemCalculations.grandTotal * (m.percentage / 100)))}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* STEP 4: SAVINGS & FINANCIAL ANALYSIS */}
            {/* ======================================================== */}
            {currentStep === 4 && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                  
                  <div>
                    <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                      <Sparkles size={20} className="text-emerald-600" /> Solar Savings, ROI & Lifetime Cashflow Analysis
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Dynamic financial projections accounting for compounding 3.5% grid tariff escalation, 0.5% PV module degradation, and PM Surya Ghar subsidies.
                    </p>
                  </div>

                  {/* 4 HIGHLIGHT METRICS */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Annual Electricity Savings</span>
                      <p className="text-2xl font-black text-emerald-600">{formatINR(financialCalculations.annualSavings)}</p>
                      <p className="text-[11px] text-slate-500 font-medium">~{formatINR(financialCalculations.monthlySavings)} / month saved</p>
                    </div>

                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Estimated Payback Period</span>
                      <p className="text-2xl font-black text-[#071A2B]">{financialCalculations.paybackYears} Years</p>
                      <p className="text-[11px] text-slate-500 font-medium">Post-subsidy capital recovery</p>
                    </div>

                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">25-Year Cumulative Savings</span>
                      <p className="text-2xl font-black text-emerald-700">{formatINR(financialCalculations.lifetimeSavings)}</p>
                      <p className="text-[11px] text-slate-500 font-medium">Compounded 25-yr solar returns</p>
                    </div>

                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">CO2 Emissions Offset</span>
                      <p className="text-2xl font-black text-slate-800">~{Math.round(formData.systemCapacity * 1460 * 0.82 / 1000)} Tons</p>
                      <p className="text-[11px] text-slate-500 font-medium">Equivalent to ~{Math.round((formData.systemCapacity * 1460 * 0.82) / 20)} mature trees</p>
                    </div>
                  </div>

                  {/* 25-YEAR PROJECTION PREVIEW TABLE */}
                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider">25-Year Financial Cashflow Forecast</h4>
                    <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200">
                          <tr>
                            <th className="py-2.5 px-3">Year</th>
                            <th className="py-2.5 px-3">Generation (kWh)</th>
                            <th className="py-2.5 px-3">Grid Tariff (₹)</th>
                            <th className="py-2.5 px-3">Gross Savings (₹)</th>
                            <th className="py-2.5 px-3 text-right">Cumulative Savings (₹)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {financialCalculations.financialProjections.slice(0, 5).map(fp => (
                            <tr key={fp.year} className="hover:bg-slate-50/50">
                              <td className="py-2.5 px-3 font-bold text-slate-900">Year {fp.year}</td>
                              <td className="py-2.5 px-3 text-slate-600">{fp.generationKwh.toLocaleString()}</td>
                              <td className="py-2.5 px-3 text-slate-600">₹{fp.gridTariffPerUnit.toFixed(2)}</td>
                              <td className="py-2.5 px-3 font-semibold text-emerald-700">{formatINR(fp.grossSavings)}</td>
                              <td className="py-2.5 px-3 text-right font-black text-slate-900">{formatINR(fp.cumulativeSavings)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* SOLAR FINANCING & LOAN EMI CALCULATOR */}
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
                          <IndianRupee size={15} className="text-emerald-600" /> Solar Loan & EMI Options (Optional)
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">Show monthly loan EMI vs solar grid savings to demonstrate immediate positive cash flow.</p>
                      </div>

                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.includeLoanFinancing}
                          onChange={e => setFormData({ ...formData, includeLoanFinancing: e.target.checked })}
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="text-xs font-bold text-slate-800">Include Financing in Proposal</span>
                      </label>
                    </div>

                    {formData.includeLoanFinancing && (
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs pt-2 animate-in fade-in">
                        <div className="space-y-1">
                          <label className="font-bold text-slate-600 uppercase text-[10px]">Down Payment (%)</label>
                          <input
                            type="number"
                            value={formData.loanDownPaymentPercent}
                            onChange={e => setFormData({ ...formData, loanDownPaymentPercent: Number(e.target.value) })}
                            className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 font-bold outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="font-bold text-slate-600 uppercase text-[10px]">Interest Rate (% p.a.)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={formData.loanInterestRate}
                            onChange={e => setFormData({ ...formData, loanInterestRate: Number(e.target.value) })}
                            className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 font-bold outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="font-bold text-slate-600 uppercase text-[10px]">Tenure (Years)</label>
                          <input
                            type="number"
                            value={formData.loanTenureYears}
                            onChange={e => setFormData({ ...formData, loanTenureYears: Number(e.target.value) })}
                            className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 font-bold outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="font-bold text-emerald-800 uppercase text-[10px]">Monthly EMI</label>
                          <div className="px-3 py-2 bg-emerald-100/70 rounded-xl border border-emerald-300 font-black text-emerald-950 text-sm">
                            {formatINR(financialCalculations.financing.monthlyEmi)} / mo
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* STATUTORY DISCLAIMER */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 flex items-start gap-2">
                    <Info size={16} className="text-slate-400 flex-shrink-0 mt-0.5" />
                    <span>
                      <strong>Important Notice:</strong> Generation estimates and savings calculations are indicative, derived from standard Maharashtra solar insolation (approx. 4.0 kWh/kWp/day). Actual energy yield depends on local weather conditions, rooftop orientation, tilt angle, soiling, and DISCOM grid availability.
                    </span>
                  </div>

                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* STEP 5: PROPOSAL TEMPLATE SELECTION & REORDERING */}
            {/* ======================================================== */}
            {currentStep === 5 && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                  
                  <div>
                    <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                      <Layers size={20} className="text-emerald-600" /> Select Proposal Template & Configure Sections
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Choose from 5 pre-configured proposal templates or dynamically customize section visibility and display order.
                    </p>
                  </div>

                  {/* 5 TEMPLATE PREVIEWS GRID */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {PROPOSAL_TEMPLATES.map(tmpl => {
                      const isSelected = formData.templateType === tmpl.code;
                      return (
                        <div
                          key={tmpl.code}
                          onClick={() => handleSelectTemplate(tmpl.code)}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? 'bg-emerald-50/70 border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                              : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-slate-100 rounded-md text-slate-700">
                                {tmpl.tag}
                              </span>
                              <span className="text-[10px] font-bold text-slate-500">{tmpl.pages}</span>
                            </div>
                            <h4 className="font-black text-slate-900 text-sm">{tmpl.name}</h4>
                            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{tmpl.description}</p>
                          </div>

                          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                            <span className="text-emerald-700 font-bold">{isSelected ? 'Active Template' : 'Click to Apply'}</span>
                            {isSelected && <CheckCircle size={16} className="text-emerald-600" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* DYNAMIC SECTION REORDER & TOGGLE */}
                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider">Document Sections & Order</h4>
                    <div className="space-y-2">
                      {formData.sections.map((section, idx) => (
                        <div
                          key={section.id}
                          className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center font-black text-[11px]">
                              {idx + 1}
                            </span>
                            <div>
                              <p className="font-bold text-slate-900">{section.title}</p>
                              {section.isRequired && (
                                <span className="text-[10px] text-amber-700 font-bold">Required core section</span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleMoveSection(idx, 'up')}
                              disabled={idx === 0}
                              className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveSection(idx, 'down')}
                              disabled={idx === formData.sections.length - 1}
                              className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                            >
                              ↓
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleSection(section.id)}
                              disabled={section.isRequired}
                              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                                section.isEnabled
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-slate-200 text-slate-600'
                              } disabled:opacity-50`}
                            >
                              {section.isEnabled ? 'Enabled' : 'Disabled'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* STEP 6: REAL-TIME LIVE DOCUMENT PREVIEW & STUDIO EDITOR */}
            {/* ======================================================== */}
            {currentStep === 6 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                  
                  {/* STUDIO PREVIEW TOOLBAR */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#C5A059]">
                          WhereReady Solar OS • Live Document Studio
                        </span>
                      </div>
                      <h3 className="text-xl font-black text-slate-900 tracking-tight font-['Manrope'] mt-0.5">
                        Interactive Proposal Art-Direction & Export
                      </h3>
                    </div>

                    {/* STUDIO CONTROLS */}
                    <div className="flex flex-wrap items-center gap-2">
                      {/* COVER IMAGE SWITCHER */}
                      <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-xl text-xs">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Cover:</span>
                        <select
                          value={editorCoverImage}
                          onChange={e => setEditorCoverImage(e.target.value)}
                          className="bg-transparent font-bold text-slate-800 outline-none text-xs cursor-pointer"
                        >
                          <option value="/assets/solar-quotation/luxury-villa-cover.jpg">Modern Indian Villa (Sunset)</option>
                          <option value="/assets/solar-quotation/cover.jpg">Contemporary Rooftop Villa</option>
                          <option value="/assets/solar-quotation/rooftop.jpg">Industrial Solar Array</option>
                        </select>
                      </div>

                      {/* THEME PALETTE SWITCHER */}
                      <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-xl text-xs">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Theme:</span>
                        <select
                          value={editorTheme}
                          onChange={e => setEditorTheme(e.target.value as any)}
                          className="bg-transparent font-bold text-slate-800 outline-none text-xs cursor-pointer"
                        >
                          <option value="forest_gold">Deep Forest Green & Gold</option>
                          <option value="obsidian_emerald">Obsidian & Emerald</option>
                          <option value="navy_champagne">Royal Navy & Bronze</option>
                        </select>
                      </div>

                      {/* ZOOM CONTROLS */}
                      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                        <button
                          type="button"
                          onClick={() => setPreviewZoom(prev => Math.max(55, prev - 15))}
                          className="p-1.5 hover:bg-white rounded-lg text-slate-600 transition-colors"
                          title="Zoom Out"
                        >
                          <ZoomOut size={14} />
                        </button>
                        <span className="text-[11px] font-mono font-bold px-1.5 text-slate-700">{previewZoom}%</span>
                        <button
                          type="button"
                          onClick={() => setPreviewZoom(prev => Math.min(130, prev + 15))}
                          className="p-1.5 hover:bg-white rounded-lg text-slate-600 transition-colors"
                          title="Zoom In"
                        >
                          <ZoomIn size={14} />
                        </button>
                      </div>

                      {/* QUICK TWEAK DRAWER TOGGLE */}
                      <button
                        type="button"
                        onClick={() => setShowLiveTweakDrawer(prev => !prev)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
                          showLiveTweakDrawer
                            ? 'bg-[#071C11] text-[#DFBF78] border-[#071C11]'
                            : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        <Sliders size={13} /> Live Tweak
                      </button>

                      {/* ACTION BUTTONS */}
                      <button
                        type="button"
                        onClick={handleDownloadA4Pdf}
                        className="px-4 py-2 bg-[#071C11] hover:bg-[#0B2014] text-[#DFBF78] border border-[#C5A059]/40 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                      >
                        <Download size={14} /> Export A4 PDF
                      </button>

                      <button
                        type="button"
                        onClick={handleShareWhatsApp}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                      >
                        <MessageSquare size={14} /> WhatsApp
                      </button>
                    </div>
                  </div>

                  {/* VALIDATION CALLOUT IF ISSUES EXIST */}
                  {validationIssues.length > 0 && (
                    <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs space-y-1.5">
                      <p className="font-extrabold text-amber-900 flex items-center gap-1.5">
                        <AlertCircle size={16} className="text-amber-600" /> Required Information Incomplete
                      </p>
                      <ul className="list-disc list-inside space-y-0.5 text-amber-800 text-[11px]">
                        {validationIssues.map((iss, idx) => (
                          <li key={idx}>{iss}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* 2-COLUMN STUDIO WORKSPACE: THUMBNAILS NAVIGATOR (LEFT) + REALISTIC A4 CANVAS (RIGHT) */}
                  <div className="grid grid-cols-12 gap-5 items-start">
                    
                    {/* LEFT SIDEBAR: PAGE THUMBNAILS NAVIGATOR */}
                    <div className="col-span-12 lg:col-span-3 space-y-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-1">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                          Document Pages (06)
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">Jump to Page</span>
                      </div>

                      {[
                        { num: 1, title: 'Cinematic Cover', subtitle: 'Power Your Future', icon: Sparkles },
                        { num: 2, title: 'Energy Profile', subtitle: 'Audit & Power Flow', icon: Activity },
                        { num: 3, title: 'Your Solar System', subtitle: 'Apple-Style Hardware', icon: Cpu },
                        { num: 4, title: 'Energy & Savings', subtitle: '25-Yr Wealth & Yield', icon: IndianRupee },
                        { num: 5, title: 'Your Investment', subtitle: 'Commercial BOQ & Terms', icon: FileText },
                        { num: 6, title: 'Roadmap & Signatures', subtitle: '21-Day Erection & Seal', icon: ShieldCheck }
                      ].map(pg => {
                        const Icon = pg.icon;
                        const isActive = activeEditorPage === pg.num;
                        return (
                          <button
                            key={pg.num}
                            type="button"
                            onClick={() => {
                              setActiveEditorPage(pg.num);
                              const target = document.getElementById(`proposal-page-${pg.num}`);
                              if (target) {
                                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                              }
                            }}
                            className={`w-full p-2.5 rounded-xl text-left transition-all border flex items-center gap-3 ${
                              isActive
                                ? 'bg-[#071C11] text-white border-[#071C11] shadow-md ring-2 ring-[#C5A059]/30'
                                : 'bg-white hover:bg-slate-100/70 text-slate-800 border-slate-200'
                            }`}
                          >
                            <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono font-black text-xs shrink-0 ${
                              isActive ? 'bg-[#C5A059] text-[#071C11]' : 'bg-slate-100 text-slate-700'
                            }`}>
                              {String(pg.num).padStart(2, '0')}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className={`font-bold text-xs truncate ${isActive ? 'text-white' : 'text-slate-900'}`}>
                                {pg.title}
                              </p>
                              <p className={`text-[10px] truncate ${isActive ? 'text-[#DFBF78]' : 'text-slate-400'}`}>
                                {pg.subtitle}
                              </p>
                            </div>
                            <Icon size={14} className={isActive ? 'text-[#DFBF78]' : 'text-slate-400'} />
                          </button>
                        );
                      })}

                      {/* CONTEXT TWEAK DRAWER IN SIDEBAR */}
                      {showLiveTweakDrawer && (
                        <div className="mt-4 pt-4 border-t border-slate-200 space-y-3 animate-in fade-in">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
                            Quick Live Overrides
                          </span>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Customer Name</label>
                            <input
                              type="text"
                              value={customerMode === 'new' ? formData.newCustomer.name : clientName}
                              onChange={e => {
                                if (customerMode === 'new') {
                                  setFormData(prev => ({ ...prev, newCustomer: { ...prev.newCustomer, name: e.target.value } }));
                                }
                              }}
                              className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-slate-200 text-xs font-bold text-slate-800"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Capacity (kWp)</label>
                            <input
                              type="number"
                              step="0.5"
                              value={formData.systemCapacity}
                              onChange={e => handleCapacityChange(Number(e.target.value))}
                              className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-slate-200 text-xs font-bold text-slate-800"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Commercial Discount (₹)</label>
                            <input
                              type="number"
                              value={formData.headerDiscount}
                              onChange={e => setFormData(prev => ({ ...prev, headerDiscount: Number(e.target.value) }))}
                              className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-slate-200 text-xs font-bold text-slate-800"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* CENTER CANVAS: REALISTIC LUXURY A4 MAGAZINE WORKSPACE */}
                    <div 
                      id="wizard-studio-canvas-scroll"
                      className="col-span-12 lg:col-span-9 bg-[#121513] p-4 sm:p-8 rounded-3xl border border-stone-800/80 shadow-2xl flex justify-center max-h-[760px] overflow-y-auto custom-scrollbar"
                    >
                      <div 
                        style={{ 
                          transform: `scale(${previewZoom / 100})`, 
                          transformOrigin: 'top center',
                          transition: 'transform 0.15s ease-out'
                        }}
                      >
                        <div id="wizard-live-pdf-preview" className="shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] rounded-sm">
                          <QuotationPDF data={livePdfData} livePreview={true} />
                        </div>
                      </div>
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
            <span className="font-extrabold text-[#071A2B]">{formatINR(lineItemCalculations.grandTotal)}</span>
            {financialCalculations.indicativeSubsidy > 0 && (
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                Net: {formatINR(financialCalculations.netCustomerCost)}
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

            {currentStep < 6 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(prev => prev + 1)}
                className="px-5 py-2.5 bg-[#071A2B] hover:bg-[#0B2942] text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
              >
                Continue to {steps[currentStep].name} <ChevronRight size={16} />
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleSaveQuotation('DRAFT')}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                >
                  Save Draft
                </button>
                <button
                  type="button"
                  disabled={loading || validationIssues.length > 0}
                  onClick={() => handleSaveQuotation('SENT')}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all disabled:opacity-50"
                >
                  {loading ? 'Creating Proposal...' : 'Create & Issue Proposal'} <Check size={16} />
                </button>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
