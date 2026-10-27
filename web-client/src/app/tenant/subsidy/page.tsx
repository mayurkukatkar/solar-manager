"use client";
import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import Link from "next/link";
import { 
  Landmark, Plus, X, TrendingUp, Clock, CheckCircle2, AlertCircle, Filter, 
  ExternalLink, Copy, Check, ShieldCheck, Sun, Zap, FileText, ChevronRight, 
  Search, Smartphone, MapPin, Building2, Home, Download, Printer, ArrowRight,
  Kanban, List, SlidersHorizontal, Eye, Trash2, Sparkles, AlertTriangle, RefreshCw, Upload
} from "lucide-react";
import { printHtmlElement } from "@/components/pdf/MsedclFormsPDF";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// PM Surya Ghar Official Portal Workflow Stages
const PORTAL_STAGES = [
  { id: "CONSUMER_SELECTION", label: "Consumer Selection", desc: "Vendor selected on portal", badge: "bg-blue-100 text-blue-700", border: "border-blue-400" },
  { id: "FEASIBILITY_PENDING", label: "Feasibility Pending", desc: "DISCOM review in progress", badge: "bg-amber-100 text-amber-700", border: "border-amber-400" },
  { id: "FEASIBILITY_APPROVED", label: "Feasibility Approved", desc: "Technical approval cleared", badge: "bg-indigo-100 text-indigo-700", border: "border-indigo-400" },
  { id: "WORK_COMPLETED", label: "Work Completed", desc: "Geo-photos & specs submitted", badge: "bg-purple-100 text-purple-700", border: "border-purple-400" },
  { id: "METER_INSPECTED", label: "Net Meter Inspected", desc: "DISCOM commissioning done", badge: "bg-teal-100 text-teal-700", border: "border-teal-400" },
  { id: "CLAIM_GENERATED", label: "Claim Sanctioned", desc: "Subsidy voucher generated", badge: "bg-emerald-100 text-emerald-700", border: "border-emerald-400" },
  { id: "DBT_DISBURSED", label: "DBT Disbursed", desc: "Subsidy credited to bank", badge: "bg-emerald-200 text-emerald-900", border: "border-emerald-600" }
];

export default function PMSuryaGharStudio() {
  const [subsidies, setSubsidies] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);

  // View mode: 'kanban' | 'table'
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');

  // Filters & Search
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("");

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeAssistantSub, setActiveAssistantSub] = useState<any>(null); // 1-Click Copy Assistant Drawer
  const [dcrFormatterSub, setDcrFormatterSub] = useState<any>(null); // Bulk DCR Formatter Modal
  const [bankCheckerSub, setBankCheckerSub] = useState<any>(null); // Bank Verification Modal
  const [printDossierSub, setPrintDossierSub] = useState<any>(null); // Offline Inspection Dossier
  const [checkingBank, setCheckingBank] = useState(false);
  const [bankCheckResult, setBankCheckResult] = useState<any>(null);
  const [rawDcrText, setRawDcrText] = useState("");
  const setViewModeWithStorage = (mode: 'kanban' | 'table') => setViewMode(mode);

  // Toast notification for clipboard copy
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  // New Application Form State
  // Register / Import Modal Mode: 'SMART_PASTE' | 'PROJECT' | 'BULK_IMPORT' | 'CUSTOM'
  const [modalMode, setModalMode] = useState<'SMART_PASTE' | 'PROJECT' | 'BULK_IMPORT' | 'CUSTOM'>('SMART_PASTE');

  // Smart Paste State (Extract from pmsuryaghar.gov.in screen / SMS / receipt)
  const [smartPasteText, setSmartPasteText] = useState("");
  const [parsingSmartText, setParsingSmartText] = useState(false);
  const [smartParsedData, setSmartParsedData] = useState<any>(null);

  // Bulk Import State (From Vendor Login Table)
  const [bulkText, setBulkText] = useState("");
  const [bulkParsedApps, setBulkParsedApps] = useState<any[]>([]);
  const [importingBulk, setImportingBulk] = useState(false);

  // New Application Form State
  const [formData, setFormData] = useState({
    projectId: "",
    customerId: "",
    customerName: "",
    customerMobile: "",
    customerAddress: "",
    customerCity: "Pune",
    consumerNumber: "",
    nationalPortalAppNo: "",
    discomName: "MSEDCL",
    division: "Pune Urban",
    subDivision: "Shivajinagar",
    proposedCapacity: "3.0",
    stateSubsidyAmount: "0",
    inverterMakeModel: "",
    inverterSerial: "",
    dcrModuleSerials: "",
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    accountHolderName: "",
    latitude: "18.5204",
    longitude: "73.8567"
  });

  // Sample Portal Text for instant 1-click test
  const SAMPLE_PORTAL_TEXT = `PM Surya Ghar: Muft Bijli Yojana
Application Acknowledgement Slip
National Portal App No: PMSG-MH-2024-88492
Consumer Number (CA): 028510293812
Consumer Name: Ramesh Shinde
Mobile: 9822012345
DISCOM: MSEDCL
Division: Pune Urban
Sub-Division: Kothrud
Applied Solar Capacity: 3.0 kW
Current Status: Feasibility Approved
Bank Name: State Bank of India
Account Number: 38491029481
IFSC Code: SBIN0001234`;

  // Client-side parser for instant 0.01s extraction
  const parsePortalTextClient = (rawText: string) => {
    if (!rawText) return {};
    const text = rawText.trim();
    const extracted: any = {};

    const appMatch = text.match(/(?:Application\s*(?:No|Number|ID)?|App\s*#?)\s*[:#-]?\s*([A-Za-z0-9\-_]{6,30})/i) ||
                     text.match(/\b(PMSG[A-Za-z0-9\-_]{5,25})\b/i);
    if (appMatch) extracted.nationalPortalAppNo = appMatch[1].trim();

    const consumerMatch = text.match(/(?:Consumer\s*(?:No|Number|ID)?|CA\s*(?:No|Number)?|K\s*No|Account\s*No)\s*[:#-]?\s*([0-9]{8,16})/i) ||
                          text.match(/\b([0-9]{10,12})\b/);
    if (consumerMatch) extracted.consumerNumber = consumerMatch[1].trim();

    const nameMatch = text.match(/(?:Consumer\s*Name|Applicant\s*Name|Customer\s*Name|Name)\s*[:#-]?\s*([A-Za-z\s.]{3,40})(?:\r|\n|$|,|;)/i);
    if (nameMatch) {
      const n = nameMatch[1].trim().replace(/\s+/g, ' ');
      if (!/^(pmsuryaghar|national|solar|subsidy|portal)$/i.test(n)) {
        extracted.customerName = n;
        extracted.accountHolderName = n;
      }
    }

    const mobileMatch = text.match(/(?:Mobile|Phone|Contact)\s*[:#-]?\s*([6-9][0-9]{9})\b/i) ||
                        text.match(/\b([6-9][0-9]{9})\b/);
    if (mobileMatch) extracted.customerMobile = mobileMatch[1].trim();

    const capMatch = text.match(/(?:Capacity|Sanctioned\s*Load|Plant\s*Capacity|Applied\s*Capacity|System\s*Size)\s*[:#-]?\s*([0-9]+(?:\.[0-9]+)?)\s*(?:kw|kwp)?/i) ||
                     text.match(/([0-9]+(?:\.[0-9]+)?)\s*(?:kwp|kw)\b/i);
    if (capMatch) {
      const val = parseFloat(capMatch[1]);
      if (val > 0 && val <= 100) extracted.proposedCapacity = val.toString();
    }

    const discomList = ['MSEDCL', 'Tata Power', 'BESCOM', 'UPPCL', 'Torrent Power', 'Adani Electricity', 'DHBVN', 'PSPCL', 'WBSEDCL', 'TANGEDCO', 'BSES'];
    for (const d of discomList) {
      if (new RegExp(d, 'i').test(text)) {
        extracted.discomName = d;
        break;
      }
    }

    const divMatch = text.match(/(?:Division|Circle)\s*[:#-]?\s*([A-Za-z\s]{3,30})(?:\r|\n|$|,)/i);
    if (divMatch) extracted.division = divMatch[1].trim();

    const subDivMatch = text.match(/(?:Sub-?Division|Sub\s*Div)\s*[:#-]?\s*([A-Za-z\s]{3,30})(?:\r|\n|$|,)/i);
    if (subDivMatch) extracted.subDivision = subDivMatch[1].trim();

    const ifscMatch = text.match(/\b([A-Z]{4}0[A-Z0-9]{6})\b/i);
    if (ifscMatch) extracted.ifscCode = ifscMatch[1].toUpperCase();

    const accMatch = text.match(/(?:Account\s*(?:No|Number)|A\/C\s*No|Bank\s*A\/C)\s*[:#-]?\s*([0-9]{9,18})\b/i);
    if (accMatch) extracted.accountNumber = accMatch[1].trim();

    const bankNameMatch = text.match(/(?:Bank\s*Name|Bank)\s*[:#-]?\s*([A-Za-z\s]{3,35})(?:\r|\n|$|,)/i);
    if (bankNameMatch) extracted.bankName = bankNameMatch[1].trim();

    if (/DBT|Disbursed|Credited|Subsidy\s*Paid/i.test(text)) extracted.portalStage = 'DBT_DISBURSED';
    else if (/Claim|Sanctioned|Voucher/i.test(text)) extracted.portalStage = 'CLAIM_GENERATED';
    else if (/Meter|Commissioned|Commissioning|Bi-directional/i.test(text)) extracted.portalStage = 'METER_INSPECTED';
    else if (/Work\s*Completed|Installation\s*Done|Geo/i.test(text)) extracted.portalStage = 'WORK_COMPLETED';
    else if (/Feasibility\s*Approved|Feasibility\s*Cleared/i.test(text)) extracted.portalStage = 'FEASIBILITY_APPROVED';
    else if (/Feasibility|Review|DISCOM\s*Pending/i.test(text)) extracted.portalStage = 'FEASIBILITY_PENDING';
    else extracted.portalStage = 'CONSUMER_SELECTION';

    return extracted;
  };

  // Run Smart Parse from pmsuryaghar.gov.in text
  const handleSmartExtract = async (textToParse?: string) => {
    const raw = textToParse || smartPasteText;
    if (!raw.trim()) {
      alert("Please paste text from pmsuryaghar.gov.in screen, acknowledgment slip, or SMS first.");
      return;
    }

    setParsingSmartText(true);
    try {
      // Fast client extract
      const clientExtracted = parsePortalTextClient(raw);
      
      // Also try API parser
      let finalExtracted = clientExtracted;
      try {
        const res = await axios.post(`${API}/api/tenant/pmsuryaghar/smart-parse`, { rawText: raw }, { withCredentials: true });
        if (res.data?.extracted) {
          finalExtracted = { ...clientExtracted, ...res.data.extracted };
        }
      } catch (e) {}

      setSmartParsedData(finalExtracted);
      setFormData(prev => ({
        ...prev,
        ...finalExtracted,
        proposedCapacity: finalExtracted.proposedCapacity || prev.proposedCapacity,
        discomName: finalExtracted.discomName || prev.discomName
      }));
    } finally {
      setParsingSmartText(false);
    }
  };

  // Parse bulk portal table rows
  const handleBulkTextChange = (text: string) => {
    setBulkText(text);
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const parsed: any[] = [];
    for (const line of lines) {
      const parts = line.split(/[\t,;]+/);
      if (parts.length >= 2) {
        parsed.push({
          nationalPortalAppNo: parts[0]?.trim() || `PMSG-${Date.now().toString().slice(-6)}`,
          consumerNumber: parts[1]?.trim() || '',
          customerName: parts[2]?.trim() || `Consumer ${parts[1] || ''}`,
          customerMobile: parts[3]?.trim() || `98${Math.floor(10000000 + Math.random() * 90000000)}`,
          proposedCapacity: parts[4]?.replace(/[^0-9.]/g, '') || '3.0',
          discomName: parts[5]?.trim() || 'MSEDCL',
          portalStage: 'CONSUMER_SELECTION'
        });
      }
    }
    setBulkParsedApps(parsed);
  };

  // Submit Bulk Import
  const handleBulkImportSubmit = async () => {
    if (bulkParsedApps.length === 0) {
      alert("No valid application rows detected. Please paste table rows separated by tabs or commas.");
      return;
    }
    setImportingBulk(true);
    try {
      const res = await axios.post(`${API}/api/tenant/pmsuryaghar/bulk-import`, { applications: bulkParsedApps }, { withCredentials: true });
      alert(`Successfully imported ${res.data.count || bulkParsedApps.length} applications from pmsuryaghar.gov.in!`);
      setShowAddModal(false);
      setBulkText("");
      setBulkParsedApps([]);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to bulk import applications");
    } finally {
      setImportingBulk(false);
    }
  };

  // Generate 1-Click Browser Auto-Fill Bookmarklet code for pmsuryaghar.gov.in
  const getBookmarkletCode = (sub: any) => {
    if (!sub) return "";
    const consumer = sub.consumerNumber || "";
    const cap = sub.proposedCapacity || 3;
    const inv = sub.inverterMakeModel || "";
    const invSerial = sub.inverterSerial || "";
    const dcr = sub.dcrModuleSerials || "";
    const acc = sub.accountNumber || "";
    const ifsc = sub.ifscCode || "";
    const custName = sub.customer?.name || "Consumer";

    return `javascript:(function(){function f(q,v){if(!v)return;let e=document.querySelector(q);if(e){e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));}}f('input[name*="consumer" i],input[id*="consumer" i],#consumerNo',${JSON.stringify(consumer)});f('input[name*="capacity" i],input[id*="capacity" i],#capacity',${JSON.stringify(cap.toString())});f('input[name*="inverter" i],#inverterMake',${JSON.stringify(inv)});f('input[name*="serial" i],#inverterSerial',${JSON.stringify(invSerial)});f('textarea[name*="dcr" i],textarea[id*="dcr" i]',${JSON.stringify(dcr)});f('input[name*="account" i],#accountNo',${JSON.stringify(acc)});f('input[name*="ifsc" i],#ifsc',${JSON.stringify(ifsc)});alert('PM Surya Ghar Assistant: Form auto-filled for ${custName} on pmsuryaghar.gov.in!');})();`;
  };

  // Generate structured packet for clipboard
  const getFullPacketText = (sub: any) => {
    return [
      `--- PM SURYA GHAR NATIONAL PORTAL DATA PACKET ---`,
      `National App ID: ${sub.nationalPortalAppNo || sub.applicationNo}`,
      `Consumer No: ${sub.consumerNumber || 'Pending'}`,
      `Consumer Name: ${sub.customer?.name || ''}`,
      `Mobile: ${sub.customer?.mobile || ''}`,
      `DISCOM: ${sub.discomName || 'MSEDCL'} (${sub.division || ''} / ${sub.subDivision || ''})`,
      `Applied Capacity: ${sub.proposedCapacity || 3} kWp`,
      `Central Subsidy: ₹${sub.centralSubsidyAmount || calculateSubsidyPreview(sub.proposedCapacity || 3)}`,
      `Inverter Make/Model: ${sub.inverterMakeModel || ''} (S/N: ${sub.inverterSerial || ''})`,
      `DCR Module Serials: ${sub.dcrModuleSerials || ''}`,
      `Bank: ${sub.bankName || ''} | A/C: ${sub.accountNumber || ''} | IFSC: ${sub.ifscCode || ''}`,
      `GPS: Lat ${sub.latitude || 18.5204}, Long ${sub.longitude || 73.8567}`,
      `Portal Stage: ${sub.portalStage}`
    ].join('\n');
  };

  const copyToClipboard = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopySuccess(label);
    setTimeout(() => setCopySuccess(null), 2500);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [subRes, custRes, projRes] = await Promise.all([
        axios.get(`${API}/api/tenant/subsidies?search=${encodeURIComponent(search)}${stageFilter ? `&portalStage=${stageFilter}` : ""}`, { withCredentials: true }),
        axios.get(`${API}/api/tenant/customers`, { withCredentials: true }).catch(() => ({ data: { customers: [] } })),
        axios.get(`${API}/api/tenant/projects`, { withCredentials: true }).catch(() => ({ data: { projects: [] } }))
      ]);

      setSubsidies(subRes.data.subsidies || []);
      setMetrics(subRes.data.metrics || {});
      setCustomers(custRes.data.customers || []);
      setProjects(projRes.data.projects || []);
    } catch (err) {
      console.error("Failed to load PM Surya Ghar data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => { fetchData(); }, 250);
    return () => clearTimeout(t);
  }, [search, stageFilter]);

  // Handle Project Selection in New Application Modal
  const handleSelectProject = (projId: string) => {
    const proj = projects.find(p => p.id === projId);
    if (!proj) return;
    
    const cap = proj.capacity || 3.0;
    const inv = proj.quotation ? `${proj.quotation.inverterBrand || 'Solar Inverter'} ${proj.quotation.inverterCapacity || cap}kW` : '5kW On-grid Inverter';

    setFormData(prev => ({
      ...prev,
      projectId: projId,
      customerId: proj.customerId || prev.customerId,
      proposedCapacity: cap.toString(),
      inverterMakeModel: inv
    }));
  };

  const handleCreateApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/api/tenant/subsidies`, formData, { withCredentials: true });
      setShowAddModal(false);
      fetchData();
      alert("Application registered in PM Surya Ghar Studio!");
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to register application");
    }
  };

  const handleAdvanceStage = async (subId: string, nextStage: string) => {
    try {
      await axios.patch(`${API}/api/tenant/subsidies/${subId}`, { portalStage: nextStage }, { withCredentials: true });
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Failed to update stage");
    }
  };

  const handleDeleteApplication = async (subId: string) => {
    if (!confirm("Remove this PM Surya Ghar application from tracking?")) return;
    try {
      await axios.delete(`${API}/api/tenant/subsidies/${subId}`, { withCredentials: true });
      fetchData();
    } catch (err) {
      alert("Failed to delete application");
    }
  };

  // Run Bank Verification
  const runBankVerification = async (sub: any) => {
    setBankCheckerSub(sub);
    setCheckingBank(true);
    setBankCheckResult(null);
    try {
      const res = await axios.post(`${API}/api/tenant/pmsuryaghar/${sub.id}/verify-bank`, {
        accountHolderName: sub.accountHolderName || sub.customer?.name
      }, { withCredentials: true });
      setBankCheckResult(res.data);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || "Verification check failed");
    } finally {
      setCheckingBank(false);
    }
  };

  // Apply Formatted DCR Serials
  const handleApplyDcrSerials = async () => {
    if (!dcrFormatterSub) return;
    const cleaned = rawDcrText
      .split(/[\n,;\t]+/)
      .map((s: string) => s.trim().toUpperCase())
      .filter(Boolean);

    const formatted = cleaned.join(", ");
    try {
      await axios.patch(`${API}/api/tenant/subsidies/${dcrFormatterSub.id}`, {
        dcrModuleSerials: formatted
      }, { withCredentials: true });
      setDcrFormatterSub(null);
      fetchData();
      alert(`Applied ${cleaned.length} formatted module serials!`);
    } catch (err) {
      alert("Failed to save DCR serials");
    }
  };

  // Calculate Subsidy Slab on the fly
  const calculateSubsidyPreview = (cap: number) => {
    if (cap <= 1) return 30000;
    if (cap <= 2) return 60000;
    return 78000;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      
      {/* TOAST CLIPBOARD NOTIFICATION */}
      {copySuccess && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-bold border border-slate-700 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-black">✓</div>
          <span>Copied <strong className="text-emerald-400">{copySuccess}</strong> to clipboard! Ready to paste on pmsuryaghar.gov.in</span>
        </div>
      )}

      {/* 1. NATIONAL PORTAL HERO COMMAND BANNER */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl border border-slate-800">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-extrabold backdrop-blur-md border border-amber-500/30">
              <Sun size={13} className="text-amber-400 animate-spin" style={{ animationDuration: '10s' }} />
              <span>National Rooftop Solar Portal · Certified Vendor Hub</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            </div>
            
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              PM Surya Ghar: Muft Bijli Yojana Studio
            </h1>
            
            <p className="text-slate-300 text-xs md:text-sm max-w-3xl font-normal leading-relaxed">
              Accelerate DISCOM net-metering approvals, zero-typing portal submissions, DCR module serial formatting, and customer Direct Benefit Transfer (DBT) subsidy releases.
            </p>

            {/* Official Central Subsidy Slab Indicator Bar */}
            <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-400 font-semibold">Central Subsidy Slabs:</span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-800/90 text-emerald-400 font-bold border border-slate-700">
                1 kWp: ₹30,000
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-800/90 text-emerald-400 font-bold border border-slate-700">
                2 kWp: ₹60,000
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-950/80 text-emerald-300 font-black border border-emerald-500/40">
                ≥3 kWp: ₹78,000 Max
              </span>
            </div>
          </div>

          {/* Action & View Mode Toolbar */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-slate-900/90 p-1 rounded-xl border border-slate-700 flex items-center shadow-inner">
              <button 
                onClick={() => setViewModeWithStorage('kanban')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'kanban' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
                title="6-Stage Portal Pipeline"
              >
                <Kanban size={14} />
                <span>Portal Pipeline</span>
              </button>
              <button 
                onClick={() => setViewModeWithStorage('table')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'table' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
                title="Application Table"
              >
                <List size={14} />
                <span>Table</span>
              </button>
            </div>

            <button 
              onClick={() => {
                setShowAddModal(true);
                setModalMode('SMART_PASTE');
              }}
              className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs md:text-sm transition-all flex items-center gap-2 shadow-lg shadow-amber-400/20 hover:-translate-y-0.5"
              title="Never type twice! Paste copied screen or SMS from pmsuryaghar.gov.in"
            >
              <Sparkles size={16} />
              <span>⚡ Smart Paste from Portal</span>
            </button>

            <button 
              onClick={() => {
                setShowAddModal(true);
                setModalMode('PROJECT');
              }}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs md:text-sm transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20 hover:-translate-y-0.5"
            >
              <Plus size={18} strokeWidth={2.5} />
              <span>Register / Link App</span>
            </button>
          </div>
        </div>

        {/* Ambient lighting */}
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute left-1/3 -bottom-24 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* 2. DIRECT NATIONAL PORTAL SHORTCUT DOCK */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          <span>Official Portal Shortcuts:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a 
            href="https://pmsuryaghar.gov.in/vendorLogin" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 hover:border-emerald-200 text-xs font-bold transition-all"
          >
            <span>pmsuryaghar.gov.in Vendor Login</span>
            <ExternalLink size={12} />
          </a>

          <a 
            href="https://solarrooftop.gov.in" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-200 text-xs font-bold transition-all"
          >
            <span>MNRE DCR Module Portal</span>
            <ExternalLink size={12} />
          </a>

          <a 
            href="https://www.mahadiscom.in/solar/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-amber-50 text-slate-700 hover:text-amber-700 border border-slate-200 hover:border-amber-200 text-xs font-bold transition-all"
          >
            <span>MSEDCL Net-Metering Login</span>
            <ExternalLink size={12} />
          </a>
        </div>
      </div>

      {/* 3. PORTFOLIO METRIC KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Registered Apps</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{metrics.total || 0}</span>
            <span className="text-xs font-medium text-slate-500">consumers</span>
          </div>
          <p className="mt-1 text-[11px] text-blue-600 font-bold">⚡ {metrics.totalCapacityKw || '0.0'} kWp total</p>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Feasibility Cleared</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-indigo-700">{metrics.feasibilityApproved || 0}</span>
            <span className="text-xs font-medium text-slate-500">sites</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Ready for installation</p>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Work Completed</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-purple-700">{metrics.workCompleted || 0}</span>
            <span className="text-xs font-medium text-slate-500">uploaded</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Geo-photos submitted</p>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Claims Sanctioned</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-700">{metrics.claimGenerated || 0}</span>
            <span className="text-xs font-medium text-slate-500">vouchers</span>
          </div>
          <p className="mt-1 text-[11px] text-emerald-600 font-bold">Awaiting DBT transfer</p>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Subsidies Claimed</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-600">
              ₹{((metrics.totalSubsidySanctioned || 0) / 100000).toFixed(2)}L
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Direct benefit to consumers</p>
        </div>
      </div>

      {/* 4. SEARCH & STAGE FILTER TOOLBAR */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[260px] max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text"
            placeholder="Search consumer number, national app #, name, mobile, city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-9 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-xs font-semibold"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <select 
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">All Portal Stages</option>
            {PORTAL_STAGES.map(s => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 5. VIEW MODE A: OFFICIAL 6-STAGE KANBAN FUNNEL */}
      {viewMode === 'kanban' && (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-[1550px]">
            {PORTAL_STAGES.map((col) => {
              const colSubs = subsidies.filter(s => s.portalStage === col.id);
              const colCapacity = colSubs.reduce((acc, s) => acc + (s.proposedCapacity || 0), 0);

              return (
                <div key={col.id} className="flex-1 min-w-[280px] max-w-[320px] bg-slate-50/70 rounded-2xl border border-slate-200 p-3.5 flex flex-col max-h-[820px]">
                  
                  {/* Column Header */}
                  <div className="pb-3 border-b border-slate-200/80 mb-3">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs uppercase tracking-wider text-slate-800">
                        {col.label}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-white text-slate-800 text-xs font-black shadow-xs border border-slate-200">
                        {colSubs.length}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                      <span>{col.desc}</span>
                      {colCapacity > 0 && <span className="font-bold text-emerald-700">{colCapacity.toFixed(1)} kW</span>}
                    </div>
                  </div>

                  {/* Cards Scrollable Container */}
                  <div className="space-y-3 overflow-y-auto pr-1 flex-1 custom-scrollbar">
                    {loading ? (
                      <div className="py-8 text-center text-xs text-slate-400 animate-pulse">Loading portal apps...</div>
                    ) : colSubs.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl bg-white/40">
                        No applications in this stage
                      </div>
                    ) : (
                      colSubs.map((sub) => (
                        <div 
                          key={sub.id}
                          className="bg-white rounded-xl p-3.5 shadow-xs border border-slate-200 hover:shadow-md hover:border-emerald-300 transition-all flex flex-col justify-between group"
                        >
                          <div>
                            {/* Card Top: Consumer Name & Capacity */}
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h4 className="font-black text-sm text-slate-900 line-clamp-1">
                                  {sub.customer?.name || "Consumer"}
                                </h4>
                                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                                  <span className="font-mono text-slate-600">{sub.consumerNumber || "CA Pending"}</span>
                                  <span>• {sub.discomName || "MSEDCL"}</span>
                                </div>
                              </div>

                              <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 text-[11px] font-black border border-amber-200 shrink-0">
                                {sub.proposedCapacity || 3} kWp
                              </span>
                            </div>

                            {/* National Portal Application Number Pill */}
                            <div className="mt-2.5 flex items-center justify-between text-xs bg-slate-50 p-2 rounded-lg border border-slate-100">
                              <span className="font-mono text-[11px] font-bold text-slate-700 truncate max-w-[150px]">
                                {sub.nationalPortalAppNo || sub.applicationNo}
                              </span>
                              <button 
                                onClick={() => copyToClipboard(sub.nationalPortalAppNo || sub.applicationNo, "Application No")}
                                title="Copy App No"
                                className="text-slate-400 hover:text-emerald-600 p-1 rounded"
                              >
                                <Copy size={12} />
                              </button>
                            </div>

                            {/* Subsidy Amount Sanctioned */}
                            <div className="mt-2 flex items-center justify-between text-xs pt-1.5 border-t border-slate-100">
                              <span className="text-slate-400 text-[11px]">Central Subsidy:</span>
                              <span className="font-black text-emerald-700">₹{(sub.centralSubsidyAmount || calculateSubsidyPreview(sub.proposedCapacity || 3)).toLocaleString()}</span>
                            </div>

                            {/* Bank Account Verification Tag */}
                            <div className="mt-1 flex items-center justify-between text-[11px]">
                              <span className="text-slate-400">DBT Bank Match:</span>
                              {sub.nameMatchVerified ? (
                                <span className="text-emerald-600 font-bold flex items-center gap-0.5">✓ Verified</span>
                              ) : (
                                <span className="text-amber-600 font-bold flex items-center gap-0.5">⚠ Needs Check</span>
                              )}
                            </div>
                          </div>

                          {/* Card Action Dock */}
                          <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-2">
                            {/* Fast Convenience Buttons */}
                            <div className="grid grid-cols-2 gap-1.5">
                              {/* 1-Click Copy Assistant Button */}
                              <button 
                                onClick={() => setActiveAssistantSub(sub)}
                                className="py-1.5 px-2 bg-slate-900 hover:bg-emerald-600 text-white rounded-lg text-[11px] font-bold transition-colors flex items-center justify-center gap-1 shadow-xs"
                                title="1-Click Copy Assistant for pmsuryaghar.gov.in"
                              >
                                <Copy size={12} />
                                <span>Copy Kit</span>
                              </button>

                              {/* DCR Serial Formatter Button */}
                              <button 
                                onClick={() => {
                                  setDcrFormatterSub(sub);
                                  setRawDcrText(sub.dcrModuleSerials || "");
                                }}
                                className="py-1.5 px-2 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 rounded-lg text-[11px] font-bold transition-colors flex items-center justify-center gap-1 border border-slate-200"
                                title="Format DCR module serials"
                              >
                                <Zap size={12} />
                                <span>DCR Serials</span>
                              </button>
                            </div>

                            {/* Advance Stage Dropdown */}
                            <div className="flex items-center justify-between gap-1 pt-1">
                              <select 
                                value={sub.portalStage}
                                onChange={(e) => handleAdvanceStage(sub.id, e.target.value)}
                                className="text-[11px] font-bold rounded-lg border border-slate-200 bg-white px-2 py-1 outline-none text-slate-700 hover:border-emerald-400 cursor-pointer flex-1"
                              >
                                {PORTAL_STAGES.map(s => (
                                  <option key={s.id} value={s.id}>{s.label}</option>
                                ))}
                              </select>

                              <button 
                                onClick={() => runBankVerification(sub)}
                                title="Verify Bank Match"
                                className="p-1 rounded-lg border border-slate-200 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                              >
                                <ShieldCheck size={14} />
                              </button>

                              <button 
                                onClick={() => setPrintDossierSub(sub)}
                                title="Print Field Dossier"
                                className="p-1 rounded-lg border border-slate-200 text-slate-400 hover:text-purple-600 hover:bg-purple-50"
                              >
                                <Printer size={14} />
                              </button>

                              <button 
                                onClick={() => handleDeleteApplication(sub.id)}
                                title="Delete"
                                className="p-1 rounded-lg border border-slate-200 text-slate-400 hover:text-red-600 hover:bg-red-50"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>

                        </div>
                      ))
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. VIEW MODE B: SMART HIGH-DENSITY TABLE */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto min-h-[420px]">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider text-xs font-bold border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Consumer & Location</th>
                  <th className="px-5 py-3.5">Portal Identifiers</th>
                  <th className="px-5 py-3.5">Capacity & Subsidy</th>
                  <th className="px-5 py-3.5">Portal Stage</th>
                  <th className="px-5 py-3.5 text-right sticky right-0 bg-slate-50 border-l border-slate-200 z-10 shadow-[-6px_0_12px_rgba(0,0,0,0.02)]">
                    Vendor Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {subsidies.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                    
                    {/* Col 1: Consumer & Location */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-indigo-700 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                          {sub.customer?.name?.charAt(0) || "P"}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{sub.customer?.name || "Consumer"}</p>
                          <p className="text-xs text-slate-500">{sub.discomName || "MSEDCL"} • {sub.division || "Pune"}</p>
                        </div>
                      </div>
                    </td>

                    {/* Col 2: Portal Identifiers */}
                    <td className="px-5 py-3.5">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-slate-800">
                          <span>App: {sub.nationalPortalAppNo || sub.applicationNo}</span>
                          <button onClick={() => copyToClipboard(sub.nationalPortalAppNo || sub.applicationNo, "App No")} className="text-slate-400 hover:text-emerald-600">
                            <Copy size={11} />
                          </button>
                        </div>
                        <p className="text-[11px] text-slate-500 font-mono">
                          Consumer #: {sub.consumerNumber || "Pending"}
                        </p>
                      </div>
                    </td>

                    {/* Col 3: Capacity & Subsidy Amount */}
                    <td className="px-5 py-3.5">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.2 rounded-md bg-amber-50 text-amber-800 text-[11px] font-black border border-amber-200">
                            {sub.proposedCapacity || 3} kWp
                          </span>
                          <span className="font-extrabold text-xs text-emerald-700">
                            ₹{(sub.centralSubsidyAmount || calculateSubsidyPreview(sub.proposedCapacity || 3)).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">Direct Benefit Transfer</p>
                      </div>
                    </td>

                    {/* Col 4: Stage Selector */}
                    <td className="px-5 py-3.5">
                      <select 
                        value={sub.portalStage}
                        onChange={(e) => handleAdvanceStage(sub.id, e.target.value)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 bg-white outline-none cursor-pointer text-slate-700"
                      >
                        {PORTAL_STAGES.map(s => (
                          <option key={s.id} value={s.id}>{s.label}</option>
                        ))}
                      </select>
                    </td>

                    {/* Col 5: Sticky Right Vendor Actions */}
                    <td className="px-5 py-3.5 text-right sticky right-0 bg-white group-hover:bg-slate-50 border-l border-slate-100 z-10 shadow-[-6px_0_12px_rgba(0,0,0,0.02)]">
                      <div className="flex items-center justify-end gap-1.5">
                        <button 
                          onClick={() => setActiveAssistantSub(sub)}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shadow-xs"
                          title="Copy details to portal"
                        >
                          <Copy size={12} />
                          <span>Copy Kit</span>
                        </button>

                        <button 
                          onClick={() => {
                            setDcrFormatterSub(sub);
                            setRawDcrText(sub.dcrModuleSerials || "");
                          }}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700"
                          title="Format DCR Serials"
                        >
                          <Zap size={14} />
                        </button>

                        <button 
                          onClick={() => setPrintDossierSub(sub)}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-purple-50 hover:text-purple-700"
                          title="Field Inspection Dossier"
                        >
                          <Printer size={14} />
                        </button>

                        <button 
                          onClick={() => handleDeleteApplication(sub.id)}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-red-600"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. MODAL: 1-CLICK "PORTAL COPY ASSISTANT" DRAWER */}
      {activeAssistantSub && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-100">
            <div className="p-6 bg-gradient-to-r from-slate-950 to-indigo-950 text-white flex items-center justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30 mb-1">
                  <Sparkles size={11} /> 1-Click Clipboard Assistant
                </div>
                <h3 className="text-lg font-black">{activeAssistantSub.customer?.name}</h3>
                <p className="text-xs text-slate-300">Fast zero-typing copy for pmsuryaghar.gov.in form submission</p>
              </div>
              <button onClick={() => setActiveAssistantSub(null)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-3.5 max-h-[75vh] overflow-y-auto">
              {/* ⚡ ZERO DOUBLE-ENTRY: 1-CLICK BROWSER AUTO-FILL BOOKMARKLET */}
              <div className="p-4 bg-gradient-to-br from-amber-50 to-emerald-50 rounded-2xl border border-emerald-200/80 shadow-xs space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-black text-emerald-900">
                      <Zap size={14} className="text-amber-500 fill-amber-500" />
                      <span>⚡ 1-Click Official Portal Auto-Fill Assistant</span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                      Never retype on <strong>pmsuryaghar.gov.in</strong>! Drag this button to your bookmarks bar. Next time you're on the official portal, click it to auto-populate this customer's form fields in 0.1s.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <a 
                    href={getBookmarkletCode(activeAssistantSub)}
                    onClick={(e) => {
                      // Prevent navigation if clicked directly inside ERP
                      if (e.currentTarget.getAttribute('href')?.startsWith('javascript')) {
                        copyToClipboard(getBookmarkletCode(activeAssistantSub), "AutoFill Bookmarklet Script");
                      }
                    }}
                    className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-emerald-600 hover:from-amber-400 hover:to-emerald-500 text-slate-950 font-black rounded-xl text-xs shadow-xs flex items-center gap-1.5 cursor-grab active:cursor-grabbing transition-transform active:scale-95"
                    title="Drag this button to your browser bookmarks bar!"
                  >
                    <span>⚡ Drag to Bookmarks: AutoFill {activeAssistantSub.customer?.name?.split(' ')[0]}</span>
                  </a>

                  <button 
                    type="button"
                    onClick={() => copyToClipboard(getBookmarkletCode(activeAssistantSub), "AutoFill Script")}
                    className="px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all shadow-xs"
                    title="Copy JavaScript code to run in browser console on pmsuryaghar.gov.in"
                  >
                    Copy Script
                  </button>

                  <button 
                    type="button"
                    onClick={() => copyToClipboard(getFullPacketText(activeAssistantSub), "Complete Portal Packet")}
                    className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1"
                  >
                    <Copy size={11} />
                    <span>Copy Full Packet</span>
                  </button>
                </div>
              </div>

              {/* Field 1: Consumer Number */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">DISCOM Consumer Number</span>
                  <span className="text-sm font-mono font-bold text-slate-900">{activeAssistantSub.consumerNumber || "Not filled"}</span>
                </div>
                <button 
                  onClick={() => copyToClipboard(activeAssistantSub.consumerNumber, "Consumer Number")}
                  className="px-3 py-1.5 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 hover:border-emerald-300 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-xs"
                >
                  <Copy size={12} /> Copy
                </button>
              </div>

              {/* Field 2: National Portal Application Number */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">National Portal Application No</span>
                  <span className="text-sm font-mono font-bold text-slate-900">{activeAssistantSub.nationalPortalAppNo || activeAssistantSub.applicationNo}</span>
                </div>
                <button 
                  onClick={() => copyToClipboard(activeAssistantSub.nationalPortalAppNo || activeAssistantSub.applicationNo, "Application No")}
                  className="px-3 py-1.5 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 hover:border-emerald-300 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-xs"
                >
                  <Copy size={12} /> Copy
                </button>
              </div>

              {/* Field 3: Proposed Capacity */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Plant Capacity (kW)</span>
                  <span className="text-sm font-bold text-slate-900">{activeAssistantSub.proposedCapacity || 3} kWp</span>
                </div>
                <button 
                  onClick={() => copyToClipboard((activeAssistantSub.proposedCapacity || 3).toString(), "Capacity")}
                  className="px-3 py-1.5 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 hover:border-emerald-300 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-xs"
                >
                  <Copy size={12} /> Copy
                </button>
              </div>

              {/* Field 4: Inverter Make / Model */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Inverter Make & Serial</span>
                  <span className="text-sm font-bold text-slate-900 line-clamp-1">{activeAssistantSub.inverterMakeModel || "Solar Grid-tied Inverter"}</span>
                  <span className="text-xs font-mono text-slate-500 block">S/N: {activeAssistantSub.inverterSerial || "INV-2026-9921"}</span>
                </div>
                <button 
                  onClick={() => copyToClipboard(`${activeAssistantSub.inverterMakeModel || 'Solar Inverter'} (S/N: ${activeAssistantSub.inverterSerial || ''})`, "Inverter Info")}
                  className="px-3 py-1.5 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 hover:border-emerald-300 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-xs"
                >
                  <Copy size={12} /> Copy
                </button>
              </div>

              {/* Field 5: DCR Module Serials */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start justify-between gap-3">
                <div className="flex-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">DCR Module Serials (Batch)</span>
                  <p className="text-xs font-mono text-slate-800 line-clamp-2 mt-0.5">
                    {activeAssistantSub.dcrModuleSerials || "DCR-MH-2026-001, DCR-MH-2026-002, DCR-MH-2026-003"}
                  </p>
                </div>
                <button 
                  onClick={() => copyToClipboard(activeAssistantSub.dcrModuleSerials || "DCR-MH-2026-001, DCR-MH-2026-002, DCR-MH-2026-003", "DCR Module Serials")}
                  className="px-3 py-1.5 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 hover:border-emerald-300 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-xs shrink-0"
                >
                  <Copy size={12} /> Copy All
                </button>
              </div>

              {/* Field 6: GPS Coordinates */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">GPS Coordinates</span>
                  <span className="text-xs font-mono font-bold text-slate-900">{activeAssistantSub.latitude || 18.5204}, {activeAssistantSub.longitude || 73.8567}</span>
                </div>
                <button 
                  onClick={() => copyToClipboard(`${activeAssistantSub.latitude || 18.5204}, ${activeAssistantSub.longitude || 73.8567}`, "GPS Coordinates")}
                  className="px-3 py-1.5 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 hover:border-emerald-300 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-xs"
                >
                  <Copy size={12} /> Copy
                </button>
              </div>

              {/* Field 7: Bank Details */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Bank IFSC & Account</span>
                  <span className="text-xs font-bold text-slate-900 block">{activeAssistantSub.bankName || "State Bank of India"}</span>
                  <span className="text-xs font-mono text-slate-600">A/C: {activeAssistantSub.accountNumber || "38291029381"} • IFSC: {activeAssistantSub.ifscCode || "SBIN0001234"}</span>
                </div>
                <button 
                  onClick={() => copyToClipboard(`A/C: ${activeAssistantSub.accountNumber || ''} IFSC: ${activeAssistantSub.ifscCode || ''}`, "Bank Details")}
                  className="px-3 py-1.5 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 hover:border-emerald-300 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-xs"
                >
                  <Copy size={12} /> Copy
                </button>
              </div>

              <div className="pt-2">
                <a 
                  href="https://pmsuryaghar.gov.in/vendorLogin"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all"
                >
                  <span>Open pmsuryaghar.gov.in in New Tab</span>
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. MODAL: BULK DCR MODULE SERIAL NUMBER FORMATTER */}
      {dcrFormatterSub && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-100">
            <div className="p-6 bg-gradient-to-r from-slate-950 to-indigo-950 text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black">Bulk DCR Serial Formatter</h3>
                <p className="text-xs text-indigo-300">Format barcode scanner batches into National Portal comma-separated text</p>
              </div>
              <button onClick={() => setDcrFormatterSub(null)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Paste Raw Barcode Scans (1 serial per line or space-separated):</label>
                <textarea 
                  rows={6}
                  placeholder={`DCR-2026-001\nDCR-2026-002\nDCR-2026-003`}
                  value={rawDcrText}
                  onChange={(e) => setRawDcrText(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs font-mono outline-none focus:ring-2 focus:ring-indigo-500"
                ></textarea>
              </div>

              {/* Counter Pill */}
              <div className="p-3 bg-indigo-50 rounded-xl text-xs text-indigo-900 flex items-center justify-between font-bold">
                <span>Detected Modules:</span>
                <span className="text-sm font-black">
                  {rawDcrText.split(/[\n,;\t]+/).map((s: string) => s.trim()).filter(Boolean).length} Panels
                </span>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setDcrFormatterSub(null)}
                  className="flex-1 py-2.5 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-xs"
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  onClick={handleApplyDcrSerials}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs shadow-md"
                >
                  Format & Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. MODAL: BANK ACCOUNT & DBT NAME MATCH CHECKER */}
      {bankCheckerSub && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-100">
            <div className="p-6 bg-gradient-to-r from-slate-950 to-emerald-950 text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black">DBT Name Match Pre-Check</h3>
                <p className="text-xs text-emerald-300">Prevent PM Surya Ghar subsidy claim rejections</p>
              </div>
              <button onClick={() => setBankCheckerSub(null)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {checkingBank ? (
                <div className="py-8 text-center text-xs text-slate-500 animate-pulse">
                  Comparing consumer name across electricity bill and bank passbook...
                </div>
              ) : bankCheckResult ? (
                <div className="space-y-3">
                  <div className={`p-4 rounded-2xl border flex items-center gap-3 ${bankCheckResult.verified ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-amber-50 border-amber-200 text-amber-900'}`}>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shrink-0">
                      {bankCheckResult.verified ? '✓' : '⚠'}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">
                        {bankCheckResult.verified ? "High Confidence Name Match" : "Name Discrepancy Detected"}
                      </h4>
                      <p className="text-xs mt-0.5">{bankCheckResult.recommendation}</p>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Electricity Bill Name:</span>
                      <span className="font-bold text-slate-800">{bankCheckResult.customerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Bank Account Name:</span>
                      <span className="font-bold text-slate-800">{bankCheckResult.bankAccountName}</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-slate-200">
                      <span className="text-slate-400">Similarity Score:</span>
                      <span className="font-black text-indigo-700">{bankCheckResult.similarityScore}%</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-500">Checking readiness...</div>
              )}

              <button 
                onClick={() => setBankCheckerSub(null)}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-md"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. MODAL: REGISTER / IMPORT PM SURYA GHAR APPLICATION (ZERO DOUBLE-ENTRY HUB) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-100 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-extrabold border border-amber-500/30 mb-1">
                  <Sparkles size={11} className="text-amber-400" />
                  <span>Zero Double-Entry Hub</span>
                </div>
                <h3 className="text-xl font-black">Register or Import PM Surya Ghar Application</h3>
                <p className="text-xs text-indigo-300">Import directly from pmsuryaghar.gov.in or auto-fill from WhereReady Solar OS — never type twice</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            {/* 4-Mode Tabs Navigation */}
            <div className="p-3 bg-slate-50 border-b border-slate-200 grid grid-cols-4 gap-1.5 shrink-0">
              <button 
                type="button"
                onClick={() => setModalMode('SMART_PASTE')}
                className={`py-2 px-1 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 ${modalMode === 'SMART_PASTE' ? 'bg-amber-400 text-slate-950 shadow-sm font-black' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
              >
                <div className="flex items-center gap-1">
                  <Sparkles size={13} />
                  <span>Smart Paste</span>
                </div>
                <span className="text-[9px] opacity-80">From Portal / SMS</span>
              </button>

              <button 
                type="button"
                onClick={() => setModalMode('PROJECT')}
                className={`py-2 px-1 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 ${modalMode === 'PROJECT' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
              >
                <div className="flex items-center gap-1">
                  <Building2 size={13} />
                  <span>Link Project</span>
                </div>
                <span className="text-[9px] opacity-80">Pull from ERP</span>
              </button>

              <button 
                type="button"
                onClick={() => setModalMode('BULK_IMPORT')}
                className={`py-2 px-1 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 ${modalMode === 'BULK_IMPORT' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
              >
                <div className="flex items-center gap-1">
                  <List size={13} />
                  <span>Bulk Table</span>
                </div>
                <span className="text-[9px] opacity-80">From Vendor Login</span>
              </button>

              <button 
                type="button"
                onClick={() => setModalMode('CUSTOM')}
                className={`py-2 px-1 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 ${modalMode === 'CUSTOM' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
              >
                <div className="flex items-center gap-1">
                  <FileText size={13} />
                  <span>Manual Form</span>
                </div>
                <span className="text-[9px] opacity-80">Custom Fields</span>
              </button>
            </div>

            {/* Modal Body Container */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">

              {/* ----------------- MODE 1: SMART PASTE (DEFAULT) ----------------- */}
              {modalMode === 'SMART_PASTE' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200/80 text-xs text-amber-950 flex items-start gap-2.5">
                    <Sparkles size={16} className="text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-amber-900">Why retype what already exists on pmsuryaghar.gov.in?</h4>
                      <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                        Copy any text block from the official portal (Application view screen, acknowledgment receipt, electricity bill, or confirmation SMS) and paste it below. Our parser automatically detects and extracts all 10+ parameters in 0.1s!
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700">Paste Text from pmsuryaghar.gov.in:</label>
                      <button 
                        type="button"
                        onClick={() => {
                          setSmartPasteText(SAMPLE_PORTAL_TEXT);
                          handleSmartExtract(SAMPLE_PORTAL_TEXT);
                        }}
                        className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1"
                      >
                        <span>Try Sample Portal Slip</span>
                        <ArrowRight size={11} />
                      </button>
                    </div>

                    <textarea 
                      rows={5}
                      placeholder={`Example paste:\nNational Portal App No: PMSG-MH-2024-88492\nConsumer CA No: 028510293812\nConsumer Name: Ramesh Shinde\nMobile: 9822012345\nDISCOM: MSEDCL\nApplied Capacity: 3.0 kW\nBank: SBI A/C 38491029481 IFSC SBIN0001234`}
                      value={smartPasteText}
                      onChange={(e) => setSmartPasteText(e.target.value)}
                      className="w-full p-3.5 rounded-xl border border-slate-200 text-xs font-mono outline-none focus:ring-2 focus:ring-amber-500 bg-slate-50/50"
                    ></textarea>
                  </div>

                  <div className="flex gap-2">
                    <button 
                      type="button"
                      disabled={parsingSmartText}
                      onClick={() => handleSmartExtract()}
                      className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-2"
                    >
                      <Sparkles size={14} />
                      <span>{parsingSmartText ? "Extracting..." : "⚡ Auto-Extract & Fill Form in 0.1s"}</span>
                    </button>
                  </div>

                  {/* Extracted Details Visual Breakdown */}
                  {smartParsedData && (
                    <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 space-y-3 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-emerald-900 flex items-center gap-1.5">
                          <CheckCircle2 size={14} className="text-emerald-600" />
                          <span>Extracted Parameters (Ready to Save & Track)</span>
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900">
                          High Confidence
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                        <div className="p-2.5 bg-white rounded-xl border border-emerald-100">
                          <span className="text-[10px] text-slate-400 block font-bold">National App No:</span>
                          <span className="font-mono font-bold text-slate-900">{formData.nationalPortalAppNo || "Auto-gen"}</span>
                        </div>
                        <div className="p-2.5 bg-white rounded-xl border border-emerald-100">
                          <span className="text-[10px] text-slate-400 block font-bold">Consumer CA #:</span>
                          <span className="font-mono font-bold text-slate-900">{formData.consumerNumber || "Pending"}</span>
                        </div>
                        <div className="p-2.5 bg-white rounded-xl border border-emerald-100">
                          <span className="text-[10px] text-slate-400 block font-bold">Consumer Name:</span>
                          <span className="font-bold text-slate-900">{formData.customerName || "Consumer"}</span>
                        </div>
                        <div className="p-2.5 bg-white rounded-xl border border-emerald-100">
                          <span className="text-[10px] text-slate-400 block font-bold">Mobile:</span>
                          <span className="font-bold text-slate-900">{formData.customerMobile || "N/A"}</span>
                        </div>
                        <div className="p-2.5 bg-white rounded-xl border border-emerald-100">
                          <span className="text-[10px] text-slate-400 block font-bold">Proposed Capacity:</span>
                          <span className="font-bold text-emerald-700">{formData.proposedCapacity} kWp (₹{calculateSubsidyPreview(parseFloat(formData.proposedCapacity || "3")).toLocaleString()})</span>
                        </div>
                        <div className="p-2.5 bg-white rounded-xl border border-emerald-100">
                          <span className="text-[10px] text-slate-400 block font-bold">DISCOM & City:</span>
                          <span className="font-bold text-slate-900">{formData.discomName} • {formData.division || "Pune"}</span>
                        </div>
                        {formData.bankName && (
                          <div className="p-2.5 bg-white rounded-xl border border-emerald-100 col-span-2 sm:col-span-3">
                            <span className="text-[10px] text-slate-400 block font-bold">DBT Bank Account:</span>
                            <span className="font-bold text-slate-900">{formData.bankName} • A/C: {formData.accountNumber} • IFSC: {formData.ifscCode}</span>
                          </div>
                        )}
                      </div>

                      <button 
                        type="button"
                        onClick={handleCreateApplication}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-2 mt-2"
                      >
                        <Check size={16} />
                        <span>Confirm & Save Application to Studio (0 Repeated Typing)</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ----------------- MODE 2: LINK PROJECT (ERP PULL) ----------------- */}
              {modalMode === 'PROJECT' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="p-3.5 bg-indigo-50 rounded-2xl border border-indigo-200 text-xs text-indigo-950 flex items-start gap-2.5">
                    <Building2 size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-indigo-900">Auto-Pull from WhereReady Solar OS</h4>
                      <p className="text-[11px] text-indigo-800 mt-0.5">
                        Selecting an active project pulls the consumer profile, inverter model, panel specs, and system capacity automatically.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Select WhereReady Project *</label>
                    <select 
                      required 
                      value={formData.projectId}
                      onChange={(e) => handleSelectProject(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
                    >
                      <option value="">-- Choose Active Project --</option>
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.projectNumber || 'PRJ'} — {p.name} ({p.capacity || 3} kWp)
                        </option>
                      ))}
                    </select>
                  </div>

                  {formData.projectId && (
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-xs">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block">Proposed Capacity:</span>
                          <span className="font-bold text-emerald-700">{formData.proposedCapacity} kWp</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block">Central Subsidy Eligible:</span>
                          <span className="font-black text-emerald-700">₹{calculateSubsidyPreview(parseFloat(formData.proposedCapacity || "3")).toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block">Inverter Specs:</span>
                          <span className="font-semibold text-slate-800">{formData.inverterMakeModel || "Auto-detected"}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block">DISCOM:</span>
                          <span className="font-semibold text-slate-800">{formData.discomName}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                        <div>
                          <label className="text-[11px] font-bold text-slate-600">Consumer CA Number (from bill):</label>
                          <input 
                            type="text" 
                            placeholder="e.g. 028510293812" 
                            value={formData.consumerNumber}
                            onChange={e => setFormData({...formData, consumerNumber: e.target.value})}
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs mt-0.5 font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-slate-600">National App No (if assigned):</label>
                          <input 
                            type="text" 
                            placeholder="Auto-generated if blank" 
                            value={formData.nationalPortalAppNo}
                            onChange={e => setFormData({...formData, nationalPortalAppNo: e.target.value})}
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs mt-0.5 font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <button 
                    type="button"
                    disabled={!formData.projectId}
                    onClick={handleCreateApplication}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    <Check size={16} />
                    <span>Confirm & Link to Studio</span>
                  </button>
                </div>
              )}

              {/* ----------------- MODE 3: BULK IMPORT FROM PORTAL TABLE ----------------- */}
              {modalMode === 'BULK_IMPORT' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="p-3.5 bg-blue-50 rounded-2xl border border-blue-200 text-xs text-blue-950 flex items-start gap-2.5">
                    <List size={16} className="text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-blue-900">Bulk Import from pmsuryaghar.gov.in Vendor Dashboard</h4>
                      <p className="text-[11px] text-blue-800 mt-0.5">
                        Log into the official portal, copy all rows from your assigned consumer table, and paste them here to import 20–100 applications at once.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Paste Table Rows (Tab-separated or Comma-separated):</label>
                    <textarea 
                      rows={5}
                      placeholder={`PMSG-MH-2024-001\t02851029381\tRamesh Shinde\t9822012345\t3.0\tMSEDCL\nPMSG-MH-2024-002\t02851029382\tPooja Patil\t9822012346\t2.0\tMSEDCL`}
                      value={bulkText}
                      onChange={(e) => handleBulkTextChange(e.target.value)}
                      className="w-full p-3.5 rounded-xl border border-slate-200 text-xs font-mono outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
                    ></textarea>
                  </div>

                  {bulkParsedApps.length > 0 && (
                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                      <div className="flex items-center justify-between font-bold text-slate-800">
                        <span>Detected Applications:</span>
                        <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-black">
                          {bulkParsedApps.length} Consumers Ready
                        </span>
                      </div>

                      <div className="max-h-36 overflow-y-auto divide-y divide-slate-200 text-[11px]">
                        {bulkParsedApps.slice(0, 5).map((app, idx) => (
                          <div key={idx} className="py-1.5 flex items-center justify-between font-mono">
                            <span>{app.nationalPortalAppNo} • {app.customerName}</span>
                            <span className="font-bold text-emerald-700">{app.proposedCapacity} kWp</span>
                          </div>
                        ))}
                        {bulkParsedApps.length > 5 && (
                          <div className="py-1 text-slate-400 italic">...and {bulkParsedApps.length - 5} more rows</div>
                        )}
                      </div>
                    </div>
                  )}

                  <button 
                    type="button"
                    disabled={importingBulk || bulkParsedApps.length === 0}
                    onClick={handleBulkImportSubmit}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    <Upload size={16} />
                    <span>{importingBulk ? "Importing..." : `Import ${bulkParsedApps.length} Applications into Studio`}</span>
                  </button>
                </div>
              )}

              {/* ----------------- MODE 4: CUSTOM / MANUAL FORM ----------------- */}
              {modalMode === 'CUSTOM' && (
                <form onSubmit={handleCreateApplication} className="space-y-4 animate-in fade-in duration-200">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Consumer Name *</label>
                      <input 
                        required 
                        type="text" 
                        placeholder="e.g. Ramesh Shinde" 
                        value={formData.customerName} 
                        onChange={e => setFormData({...formData, customerName: e.target.value})}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Mobile Number *</label>
                      <input 
                        required 
                        type="text" 
                        placeholder="10-digit mobile" 
                        value={formData.customerMobile} 
                        onChange={e => setFormData({...formData, customerMobile: e.target.value})}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Consumer CA Number *</label>
                      <input 
                        required 
                        type="text" 
                        placeholder="e.g. 028510293812" 
                        value={formData.consumerNumber} 
                        onChange={e => setFormData({...formData, consumerNumber: e.target.value})}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">National Portal App No</label>
                      <input 
                        type="text" 
                        placeholder="Auto-generated if empty" 
                        value={formData.nationalPortalAppNo} 
                        onChange={e => setFormData({...formData, nationalPortalAppNo: e.target.value})}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Proposed Capacity (kWp) *</label>
                      <input 
                        required 
                        type="number" 
                        step="0.5" 
                        value={formData.proposedCapacity} 
                        onChange={e => setFormData({...formData, proposedCapacity: e.target.value})}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">State DISCOM</label>
                      <select 
                        value={formData.discomName} 
                        onChange={e => setFormData({...formData, discomName: e.target.value})}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
                      >
                        <option value="MSEDCL">MSEDCL (Maharashtra)</option>
                        <option value="Tata Power">Tata Power (TPDDL)</option>
                        <option value="BESCOM">BESCOM (Karnataka)</option>
                        <option value="UPPCL">UPPCL (Uttar Pradesh)</option>
                        <option value="Torrent Power">Torrent Power</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                    <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider block">
                      ⚡ Technical Hardware for Portal
                    </span>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-600">Inverter Make & Model</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Havells 5kW On-grid" 
                          value={formData.inverterMakeModel} 
                          onChange={e => setFormData({...formData, inverterMakeModel: e.target.value})}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-600">Inverter Serial Number</label>
                        <input 
                          type="text" 
                          placeholder="e.g. HAV-2026-9921" 
                          value={formData.inverterSerial} 
                          onChange={e => setFormData({...formData, inverterSerial: e.target.value})}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 bg-emerald-50/50 rounded-2xl border border-emerald-100 space-y-3">
                    <span className="text-[11px] font-black text-emerald-800 uppercase tracking-wider block">
                      🏦 Customer Bank Account for DBT Subsidy
                    </span>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-600">Bank Name</label>
                        <input 
                          type="text" 
                          placeholder="e.g. State Bank of India" 
                          value={formData.bankName} 
                          onChange={e => setFormData({...formData, bankName: e.target.value})}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-600">Account Number</label>
                        <input 
                          type="text" 
                          placeholder="e.g. 38291029381" 
                          value={formData.accountNumber} 
                          onChange={e => setFormData({...formData, accountNumber: e.target.value})}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white font-mono"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-600">IFSC Code</label>
                        <input 
                          type="text" 
                          placeholder="e.g. SBIN0001234" 
                          value={formData.ifscCode} 
                          onChange={e => setFormData({...formData, ifscCode: e.target.value.toUpperCase()})}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white font-mono font-bold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-600">Account Holder Name</label>
                        <input 
                          type="text" 
                          placeholder="Exact name on passbook" 
                          value={formData.accountHolderName} 
                          onChange={e => setFormData({...formData, accountHolderName: e.target.value})}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex gap-3">
                    <button 
                      type="button" 
                      onClick={() => setShowAddModal(false)}
                      className="flex-1 py-2.5 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-xs"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-md"
                    >
                      Confirm & Register
                    </button>
                  </div>
                </form>
              )}

            </div>
          </div>
        </div>
      )}

      {/* 10. PRINTABLE FIELD INSPECTION DOSSIER */}
      {printDossierSub && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div id="subsidy-printable-dossier" className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-100 p-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <h3 className="text-xl font-black text-slate-900">Field Inspection Dossier</h3>
                <p className="text-xs text-slate-500">PM Surya Ghar Pre-Portal Submission Verification Kit</p>
              </div>
              <button onClick={() => setPrintDossierSub(null)} className="text-slate-400 hover:text-slate-800">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-800">
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Consumer Name:</span>
                  <span className="text-sm font-bold text-slate-900">{printDossierSub.customer?.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Consumer CA Number:</span>
                  <span className="text-sm font-mono font-bold text-slate-900">{printDossierSub.consumerNumber || "Pending"}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">National Portal App No:</span>
                  <span className="text-sm font-mono font-bold text-slate-900">{printDossierSub.nationalPortalAppNo || printDossierSub.applicationNo}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Approved Capacity:</span>
                  <span className="text-sm font-bold text-emerald-700">{printDossierSub.proposedCapacity || 3} kWp</span>
                </div>
              </div>

              {/* 5 Mandatory Geo-Photo Checkboxes */}
              <div className="space-y-2 p-4 border border-slate-200 rounded-2xl">
                <span className="font-extrabold text-xs uppercase tracking-wider block text-slate-900">
                  Mandatory National Portal Geo-Tagged Photos Checklist:
                </span>
                <div className="space-y-1.5 pt-1">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="rounded text-emerald-600" />
                    <span>Photo 1: Solar PV Array from South-facing angle with clear view</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="rounded text-emerald-600" />
                    <span>Photo 2: Grid-tied Inverter with LCD display & Serial label clearly legible</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="rounded text-emerald-600" />
                    <span>Photo 3: Dual Bi-directional Net-Meter display & test seal</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="rounded text-emerald-600" />
                    <span>Photo 4: Dedicated Chemical Earthing Pit with chamber cover open</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="rounded text-emerald-600" />
                    <span>Photo 5: Customer cancelled cheque with matching bank name</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => setPrintDossierSub(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs"
              >
                Close
              </button>
              <button 
                type="button"
                onClick={() => printHtmlElement('subsidy-printable-dossier')}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs shadow-md flex items-center justify-center gap-2"
              >
                <Printer size={15} />
                <span>Print Dossier Kit</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
