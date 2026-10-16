"use client";
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, Briefcase, Calendar, MapPin, Zap, User, Users,
  CheckSquare, Flag, Box, History, DollarSign, Activity, Settings, Plus,
  CheckCircle2, Clock, AlertTriangle, MessageSquare, Trash2, FileText, Download, Wrench, ShieldCheck,
  ChevronRight, ExternalLink, Phone, MessageCircle, Sun, Award, TrendingUp, Sparkles, Check, ArrowRight,
  RefreshCw, Layers, Eye, Printer, Edit3, X
} from 'lucide-react';
import { 
  WorkCompletionReport, 
  CommissioningCertificate, 
  DcrUndertaking, 
  WcrFullPack, 
  NetMeteringAgreement2019, 
  Annexure2ConsumerVendorAgreement, 
  StandardQuotationPDF, 
  GuaranteeCertificate,
  toIndianWords
} from '@/components/pdf/MsedclFormsPDF';

export default function ProjectDetails() {
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('OVERVIEW');
  const [products, setProducts] = useState<any[]>([]);
  
  const [discom, setDiscom] = useState<any>(null);
  const [subsidy, setSubsidy] = useState<any>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [advancingStage, setAdvancingStage] = useState(false);
  
  const [warrantyData, setWarrantyData] = useState<{ installations: any[], amcs: any[] } | null>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [newTicket, setNewTicket] = useState({ subject: '', description: '', priority: 'MEDIUM' });

  // DISCOM GENERATION & PREVIEW MODAL STATE
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [selectedForm, setSelectedForm] = useState<string | null>(null);
  const [showDiscomModal, setShowDiscomModal] = useState(false);
  const [previewDocId, setPreviewDocId] = useState<string>('WCR_FULL');
  const [includeStampGraphic, setIncludeStampGraphic] = useState(true);
  const [discomCustomOverrides, setDiscomCustomOverrides] = useState<any>({});

  const STAGES = [
    { id: 'Planning', label: 'Planning', percent: 15, desc: 'Roof survey & permits' },
    { id: 'Design', label: 'Design', percent: 30, desc: 'SLD & 3D layout' },
    { id: 'Procurement', label: 'Procurement', percent: 50, desc: 'BOM & Purchase Orders' },
    { id: 'Installation', label: 'Installation', percent: 75, desc: 'Mounting & DC/AC wiring' },
    { id: 'Testing', label: 'Testing & QA', percent: 90, desc: 'Inverter check & test report' },
    { id: 'Handover', label: 'Handover', percent: 95, desc: 'MSEDCL synchronization' },
    { id: 'Completed', label: 'Completed', percent: 100, desc: 'Commissioned & AMC active' }
  ];

  const getDiscomFormData = (overrides: any = {}) => {
    const cust = project?.customer || project?.lead;
    const quote = project?.quotation;
    const tenant = project?.tenant;
    const cap = project?.capacity || quote?.systemCapacity || 3.3;
    const appliedCap = Number(cap).toFixed(3);
    const moduleWatt = quote?.panelWattage || 535;
    const moduleQty = quote?.panelQuantity || Math.ceil((Number(cap) * 1000) / moduleWatt);
    const installedCap = ((moduleQty * moduleWatt) / 1000).toFixed(3);
    const totalAmount = quote?.total || project?.estimatedValue || 245000;

    return {
      beneficiaryName: cust?.name || "SHRI. SURENDRA RAMBHAU THAKRE",
      customerName: cust?.name || "SHRI. SURENDRA RAMBHAU THAKRE",
      consumerNumber: cust?.consumerNumber || cust?.caNumber || project?.consumerNumber || "410022120526",
      consumerAccountNo: cust?.consumerNumber || cust?.caNumber || project?.consumerNumber || "410022120526",
      applicationRefNo: project?.subsidies?.[0]?.nationalPortalAppNo || project?.discomApplication?.applicationNo || "NP-MHSED26-11317031",
      nationalPortalAppNo: project?.subsidies?.[0]?.nationalPortalAppNo || "NP-MHSED26-11317031",
      applicationDate: project?.startDate ? new Date(project.startDate).toLocaleDateString() : "08-04-2026",
      commissioningDate: project?.actualCompletionDate ? new Date(project.actualCompletionDate).toLocaleDateString() : "09-10-2026",
      agreementDay: String(new Date().getDate()).padStart(2, '0'),
      agreementMonth: new Date().toLocaleString('default', { month: 'short' }).toUpperCase(),
      agreementYear: String(new Date().getFullYear()),
      agreementCity: project?.city || "NAGPUR",
      mobileNo: cust?.mobile || cust?.phone || "8605849639",
      customerMobile: cust?.mobile || cust?.phone || "8605849639",
      email: cust?.email || "thakresurendra933@gmail.com",
      category: cust?.customerType || "Residential",
      address: project?.installationAddress || cust?.address || "PLOT NO 87 NAVIN NAGAR LIKKLYAN HOUS. SOC. NAGPUR",
      city: project?.city || "Nagpur",
      district: project?.city || "Nagpur",
      state: project?.state || "MAHARASHTRA",
      pincode: project?.pincode || "440008",
      sanctionedLoad: "1.000",
      appliedCapacity: appliedCap,
      capacity: cap,
      installedCapacity: installedCap,
      systemType: quote?.systemType || "Grid-Tied Rooftop Solar PV System",
      moduleMake: quote?.panelBrand || "ADANI SOLAR",
      moduleManufacturer: "MUNDRA SOLAR PV LIMITED (ADANI SOLAR)",
      cellManufacturer: "MUNDRA SOLAR PV LIMITED (ADANI SOLAR)",
      moduleWattage: moduleWatt,
      moduleQuantity: moduleQty,
      inverterMake: quote?.inverterBrand || "Grid-Tied",
      inverterCapacity: quote?.inverterCapacity || appliedCap,
      inverterBrand: quote?.inverterBrand || "Polycab",
      inverterQuantity: quote?.inverterQuantity || 1,
      phase: quote?.phase || "Single Phase",
      structureBrand: quote?.structureBrand || "GI Structure",
      earthingProtection: "Separate AC, DC & LA Earthing provided as per MNRE standards",
      vendorName: tenant?.legalName || tenant?.name || "EKVARTA ENERGY SOLUTIONS",
      vendorAddress: tenant?.address || "PLOT NO 4 HOUSE NO 85, TAJ HOUSING SOCIETY, HUDKESHWAR ROAD, PIPLA FATA",
      vendorCity: tenant?.city || "Nagpur",
      vendorState: tenant?.state || "Maharashtra",
      vendorPincode: tenant?.pincode || "440034",
      gstin: tenant?.gstin || "27DTXPM6427E1Z3",
      quotationNumber: quote?.qNumber || `EES/${new Date().getFullYear()}/${project?.projectNumber || '031'}`,
      quotationDate: quote?.date ? new Date(quote.date).toLocaleDateString() : new Date().toLocaleDateString(),
      total: totalAmount,
      grand_total: totalAmount,
      amount_in_words_custom: toIndianWords(totalAmount),
      signatureUrl: tenant?.signatureUrl,
      customerSignature: project?.customerSignatureUrl,
      subDivision: `${project?.city || 'NAGPUR'} S/DN`,
      witness1: cust?.name || "SURENDRA RAMBHAU THAKRE",
      witness2: "RAMBHAU THAKRE",
      moduleSerialNumbers: [
        "MS2608211A3882", "MS2608211A3908", "MS2608211A4160",
        "MS2608211A4181", "MS2608211A4247", "MS2608211A4462"
      ],
      ...overrides
    };
  };

  const handleDownloadForm = (formType: string, customData?: any) => {
    setSelectedForm(formType);
    if (customData) {
      setDiscomCustomOverrides((prev: any) => ({ ...prev, ...customData }));
    }
    setIsGeneratingPDF(true);
    setTimeout(async () => {
      try {
        const { generateDiscomPDF } = await import('@/components/pdf/MsedclFormsPDF');
        await generateDiscomPDF(`discom-${formType}`, `${project?.projectNumber || 'Project'}_${formType}.pdf`);
      } catch (err) {
        console.error(err);
        alert('Failed to generate PDF');
      } finally {
        setIsGeneratingPDF(false);
        setSelectedForm(null);
      }
    }, 500);
  };

  // Modals state
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [newTask, setNewTask] = useState({ name: '', description: '', priority: 'Medium', dueDate: '' });
  
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [newMilestone, setNewMilestone] = useState({ name: '', description: '', targetDate: '' });
  
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [newMaterial, setNewMaterial] = useState({ productId: '', description: '', quantity: 1 });

  const fetchProject = async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/projects/${params.id}`, { withCredentials: true });
      setProject(res.data.project);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/products`, { withCredentials: true });
      setProducts(res.data.products);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProject();
    fetchProducts();
    fetchRegulatoryData();
    fetchWarrantyData();
    fetchTickets();
  }, [params.id]);

  const fetchTickets = async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/tickets?projectId=${params.id}`, { withCredentials: true });
      setTickets(res.data.tickets);
    } catch (err) {}
  };

  const fetchWarrantyData = async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/projects/${params.id}/warranty`, { withCredentials: true });
      setWarrantyData(res.data);
    } catch (err) {}
  };

  const fetchRegulatoryData = async () => {
    try {
      const dRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/projects/${params.id}/discom`, { withCredentials: true });
      setDiscom(dRes.data.discom);
    } catch(err) {}
    try {
      const sRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/subsidies`, { withCredentials: true });
      const projSubsidy = sRes.data.subsidies.find((s:any) => s.projectId === params.id);
      setSubsidy(projSubsidy);
    } catch(err) {}
  };

  const handleCreateDiscom = async () => {
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/projects/${params.id}/discom`, {}, { withCredentials: true });
      fetchRegulatoryData();
    } catch (err) { alert('Failed to initialize DISCOM tracking'); }
  };

  const handleUpdateDiscomStage = async (status: string, documentType?: string, file?: File) => {
    try {
      setUploadingDoc(true);
      let documentUrl = null;
      if (file) {
        const formData = new FormData();
        formData.append('document', file);
        const upRes = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/projects/${params.id}/discom/upload`, formData, { withCredentials: true });
        documentUrl = upRes.data.documentUrl;
      }
      await axios.patch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/projects/${params.id}/discom/stage`, { status, documentType, documentUrl }, { withCredentials: true });
      fetchRegulatoryData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update DISCOM stage');
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleCreateSubsidy = async () => {
    try {
      if(!project.customerId) return alert("Customer must be assigned to create a subsidy.");
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/subsidies`, { projectId: params.id, customerId: project.customerId }, { withCredentials: true });
      fetchRegulatoryData();
    } catch (err) { alert('Failed to initialize Subsidy tracking'); }
  };

  const handleUpdateSubsidyStage = async (status: string, documentType?: string, file?: File) => {
    try {
      setUploadingDoc(true);
      let documentUrl = null;
      if (file) {
        const formData = new FormData();
        formData.append('document', file);
        const upRes = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/projects/${params.id}/discom/upload`, formData, { withCredentials: true });
        documentUrl = upRes.data.documentUrl;
      }
      await axios.patch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/subsidies/${subsidy.id}`, { status, documentType, documentUrl }, { withCredentials: true });
      fetchRegulatoryData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update Subsidy stage');
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleStageChange = async (e: any) => {
    const newStage = e.target.value;
    try {
      await axios.patch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/projects/${params.id}/stage`, { newStage, comment: `Stage updated to ${newStage}` }, { withCredentials: true });
      fetchProject();
    } catch (err) {
      console.error(err);
    }
  };

  const handleStageClick = async (targetStage: string) => {
    if (!project || project.currentStage === targetStage) return;
    try {
      setAdvancingStage(true);
      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/projects/${params.id}/stage`,
        { newStage: targetStage, comment: `Transitioned stage from ${project.currentStage} to ${targetStage}` },
        { withCredentials: true }
      );
      await fetchProject();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update project stage');
    } finally {
      setAdvancingStage(false);
    }
  };

  const handleStatusChange = async (e: any) => {
    const status = e.target.value;
    try {
      await axios.patch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/projects/${params.id}/status`, { status, updateText: `Status changed to ${status}` }, { withCredentials: true });
      fetchProject();
    } catch (err) {
      console.error(err);
    }
  };

  // Task Actions
  const handleCreateTask = async (e: any) => {
    e.preventDefault();
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/projects/${params.id}/tasks`, newTask, { withCredentials: true });
      setShowTaskModal(false);
      setNewTask({ name: '', description: '', priority: 'Medium', dueDate: '' });
      fetchProject();
    } catch (err) {}
  };
  
  const handleTaskStatusChange = async (taskId: string, status: string) => {
    try {
      await axios.patch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/tasks/${taskId}`, { status, progress: status === 'Completed' ? 100 : undefined }, { withCredentials: true });
      fetchProject();
    } catch (err) {}
  };

  // Milestone Actions
  const handleCreateMilestone = async (e: any) => {
    e.preventDefault();
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/projects/${params.id}/milestones`, newMilestone, { withCredentials: true });
      setShowMilestoneModal(false);
      setNewMilestone({ name: '', description: '', targetDate: '' });
      fetchProject();
    } catch (err) {}
  };

  const handleMilestoneStatusChange = async (id: string, status: string) => {
    try {
      await axios.patch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/milestones/${id}`, { status, actualDate: status === 'Completed' ? new Date().toISOString() : null }, { withCredentials: true });
      fetchProject();
    } catch (err) {}
  };

  // Material Actions
  const handleCreateMaterial = async (e: any) => {
    e.preventDefault();
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/projects/${params.id}/materials`, newMaterial, { withCredentials: true });
      setShowMaterialModal(false);
      setNewMaterial({ productId: '', description: '', quantity: 1 });
      fetchProject();
    } catch (err) {}
  };

  const handleMaterialStatusChange = async (id: string, status: string) => {
    try {
      await axios.patch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/materials/${id}`, { status }, { withCredentials: true });
      fetchProject();
    } catch (err) {}
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'In Progress': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'On Hold': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Delayed': return 'bg-red-100 text-red-700 border-red-200';
      case 'Completed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const handleCreateTicket = async (e: any) => {
    e.preventDefault();
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/tickets`, {
        ...newTicket,
        projectId: params.id,
        customerId: project.customerId
      }, { withCredentials: true });
      setShowTicketModal(false);
      setNewTicket({ subject: '', description: '', priority: 'MEDIUM' });
      fetchTickets();
    } catch (err) {
      alert("Failed to create ticket.");
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-emerald-600"></div>
      <p className="text-slate-500 font-medium text-sm">Loading Project 360° Studio...</p>
    </div>
  );
  if (!project) return (
    <div className="text-center py-24 bg-white rounded-2xl border border-slate-200 max-w-xl mx-auto my-12 p-8 shadow-sm">
      <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-4" />
      <h2 className="text-xl font-bold text-slate-800 mb-2">Project Not Found</h2>
      <p className="text-slate-500 text-sm mb-6">The requested solar installation project does not exist or has been removed.</p>
      <Link href="/tenant/projects" className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white font-semibold text-sm rounded-xl hover:bg-emerald-700 transition">
        <ArrowLeft size={16} /> Return to Projects Directory
      </Link>
    </div>
  );

  const currentStageIndex = STAGES.findIndex(s => s.id === project.currentStage);
  const activeIndex = currentStageIndex === -1 ? 0 : currentStageIndex;
  const nextStage = activeIndex < STAGES.length - 1 ? STAGES[activeIndex + 1] : null;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16 w-full min-w-0">
      {/* Top Breadcrumb & Quick Actions */}
      <div className="flex items-center justify-between gap-4">
        <Link 
          href="/tenant/projects" 
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-emerald-700 transition-colors"
        >
          <ArrowLeft size={16} /> Back to Projects Directory
        </Link>
        <div className="flex items-center gap-2">
          {project.quotation && (
            <Link 
              href={`/tenant/quotations/${project.quotation.id}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold border border-emerald-200 transition"
              title="Open originating Solar Proposal Studio"
            >
              <FileText size={14} /> Proposal #{project.quotation.qNumber} <ExternalLink size={12} />
            </Link>
          )}
          <button 
            onClick={() => setActiveTab('DISCOM')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold border border-slate-200 transition"
          >
            <Download size={14} /> MSEDCL Forms
          </button>
        </div>
      </div>

      {/* Hero Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 p-6 md:p-8 rounded-2xl shadow-xl text-white relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="flex items-start gap-4 md:gap-5">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
              <Sun size={36} className="text-yellow-400" />
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {project.projectNumber}
                </span>
                <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${getStatusColor(project.status)}`}>
                  {project.status}
                </span>
                {project.quotation && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-300 bg-emerald-950/60 border border-emerald-700/50 px-2.5 py-0.5 rounded-full">
                    <Sparkles size={11} className="text-yellow-400" /> Accepted Proposal Linked
                  </span>
                )}
              </div>
              
              <h1 className="text-2xl md:text-3xl font-extrabold text-white mt-2 tracking-tight">
                {project.name}
              </h1>

              {/* Quick Metadata Bar */}
              <div className="text-slate-300 mt-3 flex flex-wrap items-center gap-4 text-xs md:text-sm font-medium">
                {project.customer && (
                  <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-lg backdrop-blur-sm">
                    <User size={14} className="text-emerald-400" />
                    <span className="text-white font-semibold">{project.customer.name}</span>
                    {project.customer.mobile && (
                      <span className="flex items-center gap-1.5 pl-1.5 border-l border-white/20">
                        <a 
                          href={`tel:${project.customer.mobile}`} 
                          title="Call customer"
                          className="text-slate-300 hover:text-white transition"
                        >
                          <Phone size={12} />
                        </a>
                        <a 
                          href={`https://wa.me/91${project.customer.mobile.replace(/\D/g, '').slice(-10)}`} 
                          target="_blank" 
                          rel="noreferrer"
                          title="WhatsApp customer"
                          className="text-emerald-400 hover:text-emerald-300 transition"
                        >
                          <MessageCircle size={12} />
                        </a>
                      </span>
                    )}
                  </div>
                )}
                
                <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-lg backdrop-blur-sm">
                  <Zap size={14} className="text-yellow-400" />
                  <span className="font-bold text-white">{project.capacity} {project.capacityUnit || 'kWp'}</span>
                  <span className="text-slate-400">•</span>
                  <span>{project.systemType}</span>
                </span>

                <span className="flex items-center gap-1.5 text-slate-300">
                  <Users size={14} className="text-slate-400" /> Owner: <span className="text-white">{project.projectOwner?.name || 'Unassigned'}</span>
                </span>
                
                {project.city && (
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <MapPin size={14} className="text-slate-400" /> {project.city}, {project.state || 'MH'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Stage Controls */}
          <div className="flex flex-col gap-3 min-w-[260px] bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">Current Stage</label>
                <select 
                  value={project.currentStage}
                  onChange={handleStageChange}
                  disabled={advancingStage}
                  className="w-full px-3 py-1.5 rounded-lg border border-white/20 focus:ring-2 focus:ring-emerald-400 outline-none text-xs font-bold bg-slate-900/80 text-white"
                >
                  {STAGES.map(s => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">Status</label>
                <select 
                  value={project.status}
                  onChange={handleStatusChange}
                  className="w-full px-3 py-1.5 rounded-lg border border-white/20 focus:ring-2 focus:ring-emerald-400 outline-none text-xs font-bold bg-slate-900/80 text-white"
                >
                  <option value="Not Started">Not Started</option>
                  <option value="In Progress">In Progress</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Delayed">Delayed</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Quick Next Stage Action Button */}
            {nextStage && project.status !== 'Completed' && (
              <button
                onClick={() => handleStageClick(nextStage.id)}
                disabled={advancingStage}
                className="w-full py-2 px-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-lg transition flex items-center justify-center gap-1.5 shadow-md"
              >
                {advancingStage ? (
                  <RefreshCw size={13} className="animate-spin" />
                ) : (
                  <>Advance to {nextStage.label} <ArrowRight size={13} /></>
                )}
              </button>
            )}

            <div>
              <div className="flex justify-between items-center text-[11px] font-semibold text-slate-300 mb-1">
                <span>Execution Completion</span>
                <span className="text-emerald-400 font-bold">{project.progressPercent || 0}%</span>
              </div>
              <div className="w-full bg-slate-950/60 rounded-full h-2 overflow-hidden border border-white/10">
                <div 
                  className="bg-gradient-to-r from-emerald-500 to-yellow-400 h-2 rounded-full transition-all duration-500" 
                  style={{ width: `${project.progressPercent || 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive 7-Stage Visual Pipeline Stepper */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Layers size={18} className="text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Project Execution Lifecycle (7 Stages)
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            Click any stage node to jump or record progression
          </span>
        </div>

        {/* Desktop Pipeline Stepper */}
        <div className="hidden md:block relative pt-4 pb-2 px-6">
          {/* Progress bar background line */}
          <div className="absolute top-[32px] left-10 right-10 h-1.5 bg-slate-100 rounded-full -translate-y-1/2 z-0" />
          <div 
            className="absolute top-[32px] left-10 h-1.5 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full -translate-y-1/2 z-0 transition-all duration-500"
            style={{ width: `${(activeIndex / (STAGES.length - 1)) * 92}%` }}
          />

          <div className="relative z-10 flex items-start justify-between">
            {STAGES.map((s, idx) => {
              const isDone = idx < activeIndex;
              const isCurrent = idx === activeIndex;
              const isUpcoming = idx > activeIndex;

              return (
                <button
                  key={s.id}
                  onClick={() => handleStageClick(s.id)}
                  disabled={advancingStage}
                  className="flex flex-col items-center group text-center focus:outline-none max-w-[120px]"
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 shadow-sm ${
                    isDone 
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                      : isCurrent 
                        ? 'bg-emerald-500 text-white ring-4 ring-emerald-100 shadow-md scale-110' 
                        : 'bg-white border-2 border-slate-200 text-slate-400 hover:border-slate-400 hover:text-slate-600'
                  }`}>
                    {isDone ? (
                      <Check size={16} strokeWidth={3} />
                    ) : isCurrent ? (
                      <Activity size={16} className="animate-pulse" />
                    ) : (
                      <span>{idx + 1}</span>
                    )}
                  </div>

                  <span className={`mt-2.5 text-xs font-bold transition-colors ${
                    isCurrent 
                      ? 'text-emerald-700' 
                      : isDone 
                        ? 'text-slate-800' 
                        : 'text-slate-400 group-hover:text-slate-600'
                  }`}>
                    {s.label}
                  </span>

                  <span className="text-[10px] text-slate-400 leading-tight mt-0.5 line-clamp-1">
                    {s.percent}% • {s.desc.split('&')[0]}
                  </span>

                  {isCurrent && (
                    <span className="mt-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800 animate-pulse">
                      Active
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Mobile Horizontal Scrollable Pipeline */}
        <div className="md:hidden flex items-center gap-2 overflow-x-auto pb-2 pt-1 no-scrollbar">
          {STAGES.map((s, idx) => {
            const isDone = idx < activeIndex;
            const isCurrent = idx === activeIndex;

            return (
              <button
                key={s.id}
                onClick={() => handleStageClick(s.id)}
                disabled={advancingStage}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold shrink-0 transition border ${
                  isCurrent 
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' 
                    : isDone 
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                      : 'bg-slate-50 text-slate-600 border-slate-200'
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px]">
                  {isDone ? <Check size={12} /> : idx + 1}
                </span>
                <span>{s.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Tabbed Studio Navigation */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Navigation Tabs */}
        <div className="lg:w-64 shrink-0">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden sticky top-6">
            <div className="p-4 bg-slate-50 border-b border-slate-100">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Workspace Modules</span>
              <span className="text-xs font-semibold text-slate-700">{project.projectNumber} Studio</span>
            </div>
            
            <button 
              onClick={() => setActiveTab('OVERVIEW')} 
              className={`w-full flex items-center gap-3 px-5 py-3.5 text-sm font-semibold transition-colors border-b border-slate-100 ${
                activeTab === 'OVERVIEW' 
                  ? 'bg-emerald-50 text-emerald-700 border-l-4 border-l-emerald-600' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Activity size={18} /> Overview & Specs
            </button>
            
            <button 
              onClick={() => setActiveTab('TASKS')} 
              className={`w-full flex items-center justify-between px-5 py-3.5 text-sm font-semibold transition-colors border-b border-slate-100 ${
                activeTab === 'TASKS' 
                  ? 'bg-emerald-50 text-emerald-700 border-l-4 border-l-emerald-600' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3"><CheckSquare size={18} /> Tasks</div>
              <span className="bg-slate-100 text-slate-600 py-0.5 px-2 rounded-full text-xs font-bold">{project.tasks?.length || 0}</span>
            </button>
            
            <button 
              onClick={() => setActiveTab('MILESTONES')} 
              className={`w-full flex items-center justify-between px-5 py-3.5 text-sm font-semibold transition-colors border-b border-slate-100 ${
                activeTab === 'MILESTONES' 
                  ? 'bg-emerald-50 text-emerald-700 border-l-4 border-l-emerald-600' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3"><Flag size={18} /> Milestones</div>
              <span className="bg-slate-100 text-slate-600 py-0.5 px-2 rounded-full text-xs font-bold">{project.milestones?.length || 0}</span>
            </button>
            
            <button 
              onClick={() => setActiveTab('MATERIALS')} 
              className={`w-full flex items-center justify-between px-5 py-3.5 text-sm font-semibold transition-colors border-b border-slate-100 ${
                activeTab === 'MATERIALS' 
                  ? 'bg-emerald-50 text-emerald-700 border-l-4 border-l-emerald-600' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3"><Box size={18} /> Material Requirements</div>
              <span className="bg-slate-100 text-slate-600 py-0.5 px-2 rounded-full text-xs font-bold">{project.materialReqs?.length || 0}</span>
            </button>
            
            <button 
              onClick={() => setActiveTab('TIMELINE')} 
              className={`w-full flex items-center gap-3 px-5 py-3.5 text-sm font-semibold transition-colors border-b border-slate-100 ${
                activeTab === 'TIMELINE' 
                  ? 'bg-emerald-50 text-emerald-700 border-l-4 border-l-emerald-600' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <History size={18} /> Activity & Audit Log
            </button>
            
            <button 
              onClick={() => setActiveTab('REGULATORY')} 
              className={`w-full flex items-center gap-3 px-5 py-3.5 text-sm font-semibold transition-colors border-b border-slate-100 ${
                activeTab === 'REGULATORY' 
                  ? 'bg-emerald-50 text-emerald-700 border-l-4 border-l-emerald-600' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <CheckCircle2 size={18} /> DISCOM & Subsidies
            </button>
            
            <button 
              onClick={() => setActiveTab('DISCOM')} 
              className={`w-full flex items-center gap-3 px-5 py-3.5 text-sm font-semibold transition-colors border-b border-slate-100 ${
                activeTab === 'DISCOM' 
                  ? 'bg-emerald-50 text-emerald-700 border-l-4 border-l-emerald-600' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <FileText size={18} /> Generate MSEDCL Forms
            </button>
            
            <button 
              onClick={() => setActiveTab('SERVICE')} 
              className={`w-full flex items-center gap-3 px-5 py-3.5 text-sm font-semibold transition-colors ${
                activeTab === 'SERVICE' 
                  ? 'bg-emerald-50 text-emerald-700 border-l-4 border-l-emerald-600' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Wrench size={18} /> Warranty & Support
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[500px]">
          
          {/* OVERVIEW TAB */}
          {activeTab === 'OVERVIEW' && (
            <div className="p-6 md:p-8 space-y-8 animate-in fade-in duration-300">
              
              {/* Originating Quotation & Agreed Technical Specifications Hero Widget */}
              {project.quotation ? (
                <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/50 via-white to-slate-50 p-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-emerald-100 gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                        <Award size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-slate-900 text-base">Agreed Solar Proposal Specifications</h3>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase">
                            Locked & Accepted
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Originating Proposal <span className="font-bold text-slate-700">#{project.quotation.qNumber}</span> • Customer agreed configuration
                        </p>
                      </div>
                    </div>

                    <Link 
                      href={`/tenant/quotations/${project.quotation.id}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-sm self-start sm:self-auto"
                    >
                      Open Quotation Studio <ExternalLink size={13} />
                    </Link>
                  </div>

                  {/* 4-Column Technical Hardware Spec Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-5">
                    {/* Solar PV Modules */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                        <Sun size={14} className="text-yellow-500" /> PV Solar Modules
                      </div>
                      <div className="text-sm font-bold text-slate-900">
                        {project.quotation.panelBrand || 'Tier-1 Mono PERC'}
                      </div>
                      <div className="text-xs text-slate-600 mt-1">
                        Model: <span className="font-medium text-slate-800">{project.quotation.panelModel || 'DCR Compliant Bi-facial'}</span>
                      </div>
                      <div className="text-xs text-slate-600 mt-0.5">
                        Rating: <span className="font-bold text-emerald-700">{project.quotation.panelWattage || 540} Wp</span>
                      </div>
                      <div className="text-xs text-slate-600 mt-0.5">
                        Quantity: <span className="font-bold text-slate-900">{project.quotation.panelQuantity || Math.ceil((project.capacity * 1000) / (project.quotation.panelWattage || 540))} Panels</span>
                      </div>
                      <div className="text-[11px] text-emerald-600 font-semibold mt-2 pt-2 border-t border-slate-100 flex items-center gap-1">
                        <ShieldCheck size={12} /> {project.quotation.panelWarranty || '25-Year Performance'}
                      </div>
                    </div>

                    {/* Solar Inverter */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                        <Zap size={14} className="text-blue-500" /> Grid-Tie Inverter
                      </div>
                      <div className="text-sm font-bold text-slate-900">
                        {project.quotation.inverterBrand || 'Growatt / Solis'}
                      </div>
                      <div className="text-xs text-slate-600 mt-1">
                        Capacity: <span className="font-bold text-slate-900">{project.quotation.inverterCapacity || project.capacity} kW</span>
                      </div>
                      <div className="text-xs text-slate-600 mt-0.5">
                        Phase: <span className="font-medium text-slate-800">{project.quotation.phase || 'Three Phase'}</span>
                      </div>
                      <div className="text-xs text-slate-600 mt-0.5">
                        Quantity: <span className="font-bold text-slate-900">{project.quotation.inverterQuantity || 1} Units</span>
                      </div>
                      <div className="text-[11px] text-emerald-600 font-semibold mt-2 pt-2 border-t border-slate-100 flex items-center gap-1">
                        <ShieldCheck size={12} /> {project.quotation.inverterWarranty || '5-Year Replacement'}
                      </div>
                    </div>

                    {/* Structure & Mounting */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                        <Settings size={14} className="text-indigo-500" /> Structure & Civil
                      </div>
                      <div className="text-sm font-bold text-slate-900">
                        {project.quotation.structureBrand || 'Hot-Dip Galvanized (GI)'}
                      </div>
                      <div className="text-xs text-slate-600 mt-1">
                        Roof Type: <span className="font-medium text-slate-800">{project.quotation.roofType || project.roofType || 'RCC Flat Roof'}</span>
                      </div>
                      <div className="text-xs text-slate-600 mt-0.5">
                        Elevation: <span className="font-medium text-slate-800">High-Rise (Wind 150 km/h)</span>
                      </div>
                      <div className="text-xs text-slate-600 mt-0.5">
                        Net Metering: <span className="font-semibold text-emerald-700">Bi-directional MSEDCL</span>
                      </div>
                      <div className="text-[11px] text-emerald-600 font-semibold mt-2 pt-2 border-t border-slate-100 flex items-center gap-1">
                        <ShieldCheck size={12} /> {project.quotation.structureWarranty || '10-Year Anti-Corrosion'}
                      </div>
                    </div>

                    {/* Solar Yield & Economics */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                        <TrendingUp size={14} className="text-emerald-500" /> Yield & ROI
                      </div>
                      <div className="text-xs text-slate-600">
                        Annual Generation: <span className="font-bold text-slate-900">{project.quotation.annualGeneration ? `${project.quotation.annualGeneration.toLocaleString()} kWh` : `${Math.round(project.capacity * 1450).toLocaleString()} kWh/yr`}</span>
                      </div>
                      <div className="text-xs text-slate-600 mt-1">
                        Annual Savings: <span className="font-bold text-emerald-700">{project.quotation.annualSavings ? `₹${project.quotation.annualSavings.toLocaleString()}/yr` : `₹${Math.round(project.capacity * 1450 * 7).toLocaleString()}/yr`}</span>
                      </div>
                      <div className="text-xs text-slate-600 mt-1">
                        Payback Period: <span className="font-bold text-slate-900">{project.quotation.paybackYears ? `${project.quotation.paybackYears} Years` : '3.8 - 4.2 Years'}</span>
                      </div>
                      <div className="text-xs text-slate-600 mt-1">
                        Lifetime CO₂ Offset: <span className="font-bold text-emerald-600">{project.quotation.co2ReductionKg ? `${(project.quotation.co2ReductionKg / 1000).toFixed(1)} Tons` : `${(project.capacity * 29).toFixed(1)} Tons`}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-semibold mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                        <span>Central Subsidy:</span>
                        <span className="font-bold text-emerald-700">₹{(project.quotation.subsidyAmount || 78000).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 border border-dashed border-slate-300 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Briefcase className="w-8 h-8 text-slate-400" />
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">Direct Custom Project (No Quotation Linked)</h4>
                      <p className="text-xs text-slate-500">This project was initiated directly without linking to an approved solar proposal.</p>
                    </div>
                  </div>
                  <Link 
                    href="/tenant/quotations/new" 
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition shrink-0"
                  >
                    Create Quotation for Customer
                  </Link>
                </div>
              )}

              {/* Standard Configuration, Location, Schedule & Financial Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <Settings size={16} className="text-slate-400" /> System Specifications
                    </h3>
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">System Capacity</span>
                        <span className="font-bold text-emerald-700">{project.capacity} {project.capacityUnit || 'kWp'}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">System Type</span>
                        <span className="font-semibold text-slate-800">{project.systemType}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">Project Type</span>
                        <span className="font-semibold text-slate-800">{project.projectType}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">Assigned Project Manager</span>
                        <span className="font-semibold text-slate-800">{project.projectOwner?.name || 'Unassigned'}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <MapPin size={16} className="text-slate-400" /> Installation Site & Address
                    </h3>
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-2">
                      <p className="text-sm text-slate-700 leading-relaxed font-medium">
                        {project.installationAddress || 'Site address not provided'}<br/>
                        {project.city || ''} {project.state ? `, ${project.state}` : ''} {project.pincode ? `— ${project.pincode}` : ''}
                      </p>
                      {project.city && (
                        <a 
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${project.installationAddress || ''} ${project.city || ''} ${project.pincode || ''}`)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 pt-2"
                        >
                          <MapPin size={12} /> View on Google Maps <ExternalLink size={11} />
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <Calendar size={16} className="text-slate-400" /> Execution Milestones & Dates
                    </h3>
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">Start Date</span>
                        <span className="font-semibold text-slate-800">{project.startDate ? new Date(project.startDate).toLocaleDateString() : 'TBD'}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">Expected Commissioning</span>
                        <span className="font-semibold text-slate-800">{project.expectedCompletionDate ? new Date(project.expectedCompletionDate).toLocaleDateString() : 'TBD'}</span>
                      </div>
                      {project.actualCompletionDate && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-500">Actual Handover</span>
                          <span className="font-bold text-emerald-600">{new Date(project.actualCompletionDate).toLocaleDateString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-200">
                        <span className="text-slate-500">Created At</span>
                        <span className="text-slate-600 font-medium">{new Date(project.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <DollarSign size={16} className="text-slate-400" /> Contract Value & Economics
                    </h3>
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">Contract Revenue</span>
                        <span className="font-extrabold text-slate-900">₹{(project.estimatedValue || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">Budgeted Cost</span>
                        <span className="font-bold text-slate-900">₹{(project.estimatedCost || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-200">
                        <span className="text-slate-600 font-semibold">Expected Gross Margin</span>
                        <span className="font-extrabold text-emerald-600 text-base">
                          ₹{((project.estimatedValue || 0) - (project.estimatedCost || 0)).toLocaleString()}
                          {project.estimatedValue > 0 && (
                            <span className="text-xs text-emerald-600/80 font-bold ml-1.5">
                              ({(((project.estimatedValue - (project.estimatedCost || 0)) / project.estimatedValue) * 100).toFixed(1)}%)
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TASKS TAB */}
          {activeTab === 'TASKS' && (
            <div className="animate-in fade-in duration-300 h-full flex flex-col">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h2 className="font-bold text-slate-800">Project Tasks</h2>
                <button onClick={() => setShowTaskModal(true)} className="text-sm font-medium bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg hover:bg-emerald-200 transition-colors flex items-center gap-1.5">
                  <Plus size={14} /> Add Task
                </button>
              </div>
              <div className="p-5 flex-1 overflow-y-auto">
                <div className="space-y-3">
                  {(!project.tasks || project.tasks.length === 0) ? (
                    <div className="text-center py-10 text-slate-400 text-sm">No tasks created yet.</div>
                  ) : (
                    project.tasks.map((task: any) => (
                      <div key={task.id} className="border border-slate-200 rounded-xl p-4 hover:border-slate-300 transition-colors flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <button 
                            onClick={() => handleTaskStatusChange(task.id, task.status === 'Completed' ? 'To Do' : 'Completed')}
                            className={`mt-0.5 shrink-0 w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${task.status === 'Completed' ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 text-transparent hover:border-emerald-400'}`}
                          >
                            <CheckCircle2 size={14} />
                          </button>
                          <div>
                            <h4 className={`font-semibold text-sm ${task.status === 'Completed' ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{task.name}</h4>
                            {task.description && <p className="text-xs text-slate-500 mt-1">{task.description}</p>}
                            <div className="flex items-center gap-3 mt-2 text-[11px] font-medium text-slate-400">
                              <span className="flex items-center gap-1"><Clock size={12} /> Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date'}</span>
                              <span className={`px-1.5 py-0.5 rounded ${task.priority === 'High' ? 'bg-red-50 text-red-600' : task.priority === 'Medium' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100'}`}>{task.priority}</span>
                            </div>
                          </div>
                        </div>
                        <select 
                          value={task.status}
                          onChange={(e) => handleTaskStatusChange(task.id, e.target.value)}
                          className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:border-emerald-500 bg-slate-50 text-slate-600"
                        >
                          <option value="To Do">To Do</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Blocked">Blocked</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* MILESTONES TAB */}
          {activeTab === 'MILESTONES' && (
            <div className="animate-in fade-in duration-300 h-full flex flex-col">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h2 className="font-bold text-slate-800">Project Milestones</h2>
                <button onClick={() => setShowMilestoneModal(true)} className="text-sm font-medium bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg hover:bg-emerald-200 transition-colors flex items-center gap-1.5">
                  <Plus size={14} /> Add Milestone
                </button>
              </div>
              <div className="p-5 flex-1 overflow-y-auto">
                <div className="space-y-4">
                  {(!project.milestones || project.milestones.length === 0) ? (
                    <div className="text-center py-10 text-slate-400 text-sm">No milestones defined yet.</div>
                  ) : (
                    project.milestones.map((ms: any) => (
                      <div key={ms.id} className="border border-slate-200 rounded-xl p-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${ms.status === 'Completed' ? 'bg-emerald-100 text-emerald-600' : ms.status === 'Delayed' ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-400'}`}>
                            <Flag size={20} />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 text-sm">{ms.name}</h4>
                            <div className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                              <span>Target: {ms.targetDate ? new Date(ms.targetDate).toLocaleDateString() : 'TBD'}</span>
                              {ms.actualDate && <span className="text-emerald-600 font-medium">Achieved: {new Date(ms.actualDate).toLocaleDateString()}</span>}
                            </div>
                          </div>
                        </div>
                        <select 
                          value={ms.status}
                          onChange={(e) => handleMilestoneStatusChange(ms.id, e.target.value)}
                          className="text-xs font-semibold uppercase tracking-wider border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:border-emerald-500 bg-slate-50"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Completed">Completed</option>
                          <option value="Delayed">Delayed</option>
                        </select>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* MATERIALS TAB */}
          {activeTab === 'MATERIALS' && (
            <div className="animate-in fade-in duration-300 h-full flex flex-col">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h2 className="font-bold text-slate-800">Material Requirements</h2>
                <button onClick={() => setShowMaterialModal(true)} className="text-sm font-medium bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg hover:bg-emerald-200 transition-colors flex items-center gap-1.5">
                  <Plus size={14} /> Add Requirement
                </button>
              </div>
              <div className="p-5">
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500">
                      <tr>
                        <th className="p-3 font-semibold">Material / Product</th>
                        <th className="p-3 font-semibold text-center">Qty</th>
                        <th className="p-3 font-semibold">Status</th>
                        <th className="p-3 font-semibold text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(!project.materialReqs || project.materialReqs.length === 0) ? (
                        <tr><td colSpan={4} className="p-8 text-center text-slate-400">No material requirements listed.</td></tr>
                      ) : (
                        project.materialReqs.map((mat: any) => (
                          <tr key={mat.id} className="hover:bg-slate-50/50">
                            <td className="p-3">
                              <div className="font-medium text-slate-900">{mat.description}</div>
                              {mat.product && <div className="text-xs text-slate-500">SKU: {mat.product.sku}</div>}
                            </td>
                            <td className="p-3 text-center font-semibold">{mat.quantity}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${mat.status === 'Required' ? 'bg-amber-100 text-amber-700' : mat.status === 'Procured' ? 'bg-blue-100 text-blue-700' : mat.status === 'Dispatched' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                {mat.status}
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              <select 
                                value={mat.status}
                                onChange={(e) => handleMaterialStatusChange(mat.id, e.target.value)}
                                className="text-xs border border-slate-200 rounded-lg px-2 py-1 outline-none bg-white"
                              >
                                <option value="Required">Required</option>
                                <option value="Procured">Procured</option>
                                <option value="Dispatched">Dispatched</option>
                                <option value="Consumed">Consumed</option>
                              </select>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TIMELINE TAB */}
          {activeTab === 'TIMELINE' && (
            <div className="animate-in fade-in duration-300 h-full flex flex-col">
              <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                <h2 className="font-bold text-slate-800">Activity & Timeline</h2>
              </div>
              <div className="p-6 flex-1 overflow-y-auto">
                <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-emerald-200 before:via-slate-200 before:to-transparent">
                  {project.timelineEvents?.map((evt: any) => (
                    <div key={evt.id} className="relative flex items-start gap-4 z-10">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-slate-100 text-slate-500 shadow-sm shrink-0">
                        {evt.eventType === 'STAGE_CHANGE' ? <Activity size={16} className="text-blue-500" /> : 
                         evt.eventType === 'STATUS_UPDATE' ? <AlertTriangle size={16} className="text-amber-500" /> : 
                         <History size={16} />}
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 w-full">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-sm font-bold text-slate-900">{evt.title}</h4>
                          <time className="text-xs text-slate-400">{new Date(evt.createdAt).toLocaleString()}</time>
                        </div>
                        {evt.description && <p className="text-sm text-slate-600 mt-1">{evt.description}</p>}
                      </div>
                    </div>
                  ))}
                  {(!project.timelineEvents || project.timelineEvents.length === 0) && (
                    <div className="text-center py-10 text-slate-400 text-sm pl-12">No activity recorded yet.</div>
                  )}
                </div>
              </div>
            </div>
          )}
          {/* REGULATORY TAB */}
          {activeTab === 'REGULATORY' && (
            <div className="animate-in fade-in duration-300 h-full flex flex-col">
              <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                <h2 className="font-bold text-slate-800">Regulatory & Subsidies Tracking</h2>
                <p className="text-xs text-slate-500 mt-0.5">Track DISCOM approvals and National Portal Subsidies.</p>
              </div>
              <div className="p-6 flex-1 overflow-y-auto space-y-8">
                
                {/* DISCOM TRACKING */}
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><Zap size={18} className="text-blue-500"/> DISCOM / Net-Metering</h3>
                  {!discom ? (
                    <button onClick={handleCreateDiscom} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-md hover:bg-blue-700">
                      Initialize DISCOM Tracking
                    </button>
                  ) : (
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                        <span className="font-semibold text-slate-700 text-sm">Current Stage:</span>
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">{discom.status}</span>
                      </div>
                      <div className="p-4 space-y-4">
                         <div className="flex flex-col md:flex-row gap-4 items-center justify-between border-b border-slate-100 pb-4">
                           <div className="flex-1">
                             <h4 className="font-bold text-slate-800 text-sm">1. Feasibility Approval</h4>
                             <p className="text-xs text-slate-500">Wait for DISCOM to approve feasibility.</p>
                             {discom.status === 'FEASIBILITY_PENDING' && (
                               <div className="mt-2 flex items-center gap-2">
                                 <input type="file" id="feasibilityFile" className="text-xs text-slate-500" />
                                 <button onClick={() => {
                                   const f = (document.getElementById('feasibilityFile') as HTMLInputElement).files?.[0];
                                   handleUpdateDiscomStage('CEIG_INSPECTION', 'FEASIBILITY_LETTER', f);
                                 }} disabled={uploadingDoc} className="px-3 py-1.5 bg-emerald-600 text-white rounded text-xs font-bold hover:bg-emerald-700 disabled:opacity-50">Upload & Move Next</button>
                               </div>
                             )}
                           </div>
                           <div className="text-right">
                             {discom.feasibilityDocumentUrl ? <span className="text-xs font-bold text-emerald-600 flex items-center gap-1"><CheckCircle2 size={14}/> Uploaded</span> : <span className="text-xs text-slate-400">Pending</span>}
                           </div>
                         </div>

                         <div className="flex flex-col md:flex-row gap-4 items-center justify-between border-b border-slate-100 pb-4">
                           <div className="flex-1">
                             <h4 className="font-bold text-slate-800 text-sm">2. CEIG Inspection</h4>
                             <p className="text-xs text-slate-500">Get Electrical Inspectorate approval.</p>
                             {discom.status === 'CEIG_INSPECTION' && (
                               <div className="mt-2 flex items-center gap-2">
                                 <input type="file" id="ceigFile" className="text-xs text-slate-500" />
                                 <button onClick={() => {
                                   const f = (document.getElementById('ceigFile') as HTMLInputElement).files?.[0];
                                   handleUpdateDiscomStage('METER_TESTING', 'CEIG_APPROVAL', f);
                                 }} disabled={uploadingDoc} className="px-3 py-1.5 bg-emerald-600 text-white rounded text-xs font-bold hover:bg-emerald-700 disabled:opacity-50">Upload & Move Next</button>
                               </div>
                             )}
                           </div>
                           <div className="text-right">
                             {discom.ceigDocumentUrl ? <span className="text-xs font-bold text-emerald-600 flex items-center gap-1"><CheckCircle2 size={14}/> Uploaded</span> : <span className="text-xs text-slate-400">Pending</span>}
                           </div>
                         </div>

                         <div className="flex flex-col md:flex-row gap-4 items-center justify-between border-b border-slate-100 pb-4">
                           <div className="flex-1">
                             <h4 className="font-bold text-slate-800 text-sm">3. Meter Testing & Installation</h4>
                             <p className="text-xs text-slate-500">Submit meter test report to DISCOM.</p>
                             {discom.status === 'METER_TESTING' && (
                               <div className="mt-2 flex items-center gap-2">
                                 <input type="file" id="meterFile" className="text-xs text-slate-500" />
                                 <button onClick={() => {
                                   const f = (document.getElementById('meterFile') as HTMLInputElement).files?.[0];
                                   handleUpdateDiscomStage('NET_METER_INSTALLED', 'METER_TEST_REPORT', f);
                                 }} disabled={uploadingDoc} className="px-3 py-1.5 bg-emerald-600 text-white rounded text-xs font-bold hover:bg-emerald-700 disabled:opacity-50">Upload & Move Next</button>
                               </div>
                             )}
                           </div>
                           <div className="text-right">
                             {discom.meterTestReportUrl ? <span className="text-xs font-bold text-emerald-600 flex items-center gap-1"><CheckCircle2 size={14}/> Uploaded</span> : <span className="text-xs text-slate-400">Pending</span>}
                           </div>
                         </div>

                         <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                           <div className="flex-1">
                             <h4 className="font-bold text-slate-800 text-sm">4. Grid Synchronized</h4>
                             <p className="text-xs text-slate-500">System is active. Upload Net Meter Certificate.</p>
                             {discom.status === 'NET_METER_INSTALLED' && (
                               <div className="mt-2 flex items-center gap-2">
                                 <input type="file" id="certFile" className="text-xs text-slate-500" />
                                 <button onClick={() => {
                                   const f = (document.getElementById('certFile') as HTMLInputElement).files?.[0];
                                   handleUpdateDiscomStage('GRID_SYNCHRONIZED', 'NET_METER_CERTIFICATE', f);
                                 }} disabled={uploadingDoc} className="px-3 py-1.5 bg-emerald-600 text-white rounded text-xs font-bold hover:bg-emerald-700 disabled:opacity-50">Complete Synchronization</button>
                               </div>
                             )}
                           </div>
                           <div className="text-right">
                             {discom.netMeterCertificateUrl ? <span className="text-xs font-bold text-emerald-600 flex items-center gap-1"><CheckCircle2 size={14}/> Uploaded</span> : <span className="text-xs text-slate-400">Pending</span>}
                           </div>
                         </div>

                      </div>
                    </div>
                  )}
                </div>

                {/* SUBSIDY TRACKING */}
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><DollarSign size={18} className="text-emerald-500"/> National Portal Subsidy</h3>
                  {!subsidy ? (
                    <button onClick={handleCreateSubsidy} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold shadow-md hover:bg-emerald-700">
                      Initialize Subsidy Tracking
                    </button>
                  ) : (
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                        <span className="font-semibold text-slate-700 text-sm">Current Stage:</span>
                        <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">{subsidy.status}</span>
                      </div>
                      <div className="p-4 space-y-4">
                         
                         <div className="flex flex-col md:flex-row gap-4 items-center justify-between border-b border-slate-100 pb-4">
                           <div className="flex-1">
                             <h4 className="font-bold text-slate-800 text-sm">1. Claim Approved</h4>
                             <p className="text-xs text-slate-500">Wait for National Portal to approve the claim.</p>
                             {subsidy.status === 'APPLICATION_SUBMITTED' && (
                               <div className="mt-2 flex items-center gap-2">
                                 <input type="file" id="claimFile" className="text-xs text-slate-500" />
                                 <button onClick={() => {
                                   const f = (document.getElementById('claimFile') as HTMLInputElement).files?.[0];
                                   handleUpdateSubsidyStage('CLAIM_APPROVED', 'CLAIM_DOCUMENT', f);
                                 }} disabled={uploadingDoc} className="px-3 py-1.5 bg-emerald-600 text-white rounded text-xs font-bold hover:bg-emerald-700 disabled:opacity-50">Upload & Move Next</button>
                               </div>
                             )}
                           </div>
                           <div className="text-right">
                             {subsidy.claimDocumentUrl ? <span className="text-xs font-bold text-emerald-600 flex items-center gap-1"><CheckCircle2 size={14}/> Uploaded</span> : <span className="text-xs text-slate-400">Pending</span>}
                           </div>
                         </div>

                         <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                           <div className="flex-1">
                             <h4 className="font-bold text-slate-800 text-sm">2. Subsidy Disbursed</h4>
                             <p className="text-xs text-slate-500">Upload proof of disbursement to customer bank account.</p>
                             {subsidy.status === 'CLAIM_APPROVED' && (
                               <div className="mt-2 flex items-center gap-2">
                                 <input type="file" id="proofFile" className="text-xs text-slate-500" />
                                 <button onClick={() => {
                                   const f = (document.getElementById('proofFile') as HTMLInputElement).files?.[0];
                                   handleUpdateSubsidyStage('DISBURSED', 'DISBURSEMENT_PROOF', f);
                                 }} disabled={uploadingDoc} className="px-3 py-1.5 bg-emerald-600 text-white rounded text-xs font-bold hover:bg-emerald-700 disabled:opacity-50">Upload & Complete</button>
                               </div>
                             )}
                           </div>
                           <div className="text-right">
                             {subsidy.disbursementProofUrl ? <span className="text-xs font-bold text-emerald-600 flex items-center gap-1"><CheckCircle2 size={14}/> Uploaded</span> : <span className="text-xs text-slate-400">Pending</span>}
                           </div>
                         </div>

                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* DISCOM FORMS TAB */}
          {activeTab === 'DISCOM' && (
            <div className="animate-in fade-in duration-300 h-full flex flex-col">
              <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-emerald-50/60 via-slate-50 to-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white">
                      MSEDCL &amp; PM Surya Ghar
                    </span>
                    <span className="text-xs text-slate-500 font-medium">Official DISCOM Compliance Suite</span>
                  </div>
                  <h2 className="font-extrabold text-xl text-slate-900 mt-1">Official Statutory Documents &amp; Agreements</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Pre-filled with consumer, technical and vendor credentials. Click Preview &amp; Edit to adjust serial numbers or stamp paper settings.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setPreviewDocId('WCR_FULL');
                      setShowDiscomModal(true);
                    }}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-2 transition-all hover:scale-105"
                  >
                    <Eye size={15} />
                    <span>Open Document Studio</span>
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {[
                    { 
                      id: 'WCR_FULL', 
                      name: 'Work Completion Report Pack', 
                      pages: '3 Pages Dossier',
                      tag: 'MSEDCL Mandatory',
                      tagColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
                      desc: 'Full 3-page pack: WCR + Annexure I (Commissioning) + Annexure A (DCR with Serial Numbers).' 
                    },
                    { 
                      id: 'NetMetering', 
                      name: 'Net Metering Agreement (Annexure 3)', 
                      pages: '6 Pages',
                      tag: 'MERC 2019 / ₹100 Stamp',
                      tagColor: 'bg-purple-100 text-purple-800 border-purple-300',
                      desc: 'Official 20-year grid connectivity agreement between Eligible Consumer and MSEDCL with stamp header.' 
                    },
                    { 
                      id: 'ConsumerVendor', 
                      name: 'Consumer & Vendor Agreement (Annexure 2)', 
                      pages: '3 Pages',
                      tag: 'PM Surya Ghar / ₹100 Stamp',
                      tagColor: 'bg-indigo-100 text-indigo-800 border-indigo-300',
                      desc: 'Model Draft Agreement covering design, supply, commissioning and 5-year maintenance warranty.' 
                    },
                    { 
                      id: 'StandardQuotation', 
                      name: 'Official Standard Quotation', 
                      pages: '1 Page',
                      tag: 'DISCOM / Consumer Format',
                      tagColor: 'bg-amber-100 text-amber-800 border-amber-300',
                      desc: 'Itemized quotation with consumer number, inverter/panel specs, and amount in words.' 
                    },
                    { 
                      id: 'AnnexureI', 
                      name: 'Commissioning Certificate (Annexure I)', 
                      pages: '1 Page Standalone',
                      tag: 'Grid Connection',
                      tagColor: 'bg-blue-100 text-blue-800 border-blue-300',
                      desc: 'Provisional Commissioning Report with technical details of solar PV array and inverter.' 
                    },
                    { 
                      id: 'DCR', 
                      name: 'DCR Self-Declaration (Annexure A)', 
                      pages: '1 Page Standalone',
                      tag: 'Domestic Content Req.',
                      tagColor: 'bg-teal-100 text-teal-800 border-teal-300',
                      desc: 'Domestic Content Requirement undertaking with dynamic module serial numbers list.' 
                    },
                  ].map(form => (
                    <div 
                      key={form.id} 
                      className="border border-slate-200/90 rounded-2xl p-5 hover:shadow-lg transition-all bg-white flex flex-col justify-between group hover:border-emerald-300"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors shadow-sm">
                            <FileText size={20} />
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${form.tagColor}`}>
                            {form.tag}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm mb-1 group-hover:text-emerald-700 transition-colors">
                          {form.name}
                        </h4>
                        <p className="text-[11px] font-semibold text-slate-400 mb-2">{form.pages}</p>
                        <p className="text-xs text-slate-500 leading-relaxed mb-6">{form.desc}</p>
                      </div>

                      <div className="flex gap-2 pt-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => {
                            setPreviewDocId(form.id);
                            setShowDiscomModal(true);
                          }}
                          className="flex-1 py-2 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors border border-slate-200"
                        >
                          <Eye size={14} />
                          <span>Preview &amp; Edit</span>
                        </button>
                        
                        <button 
                          type="button"
                          onClick={() => handleDownloadForm(form.id)}
                          disabled={isGeneratingPDF && selectedForm === form.id}
                          className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 shadow-sm"
                        >
                          {isGeneratingPDF && selectedForm === form.id ? (
                            <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></div>
                          ) : (
                            <><Download size={14} /> PDF</>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SERVICE & WARRANTY TAB */}
          {activeTab === 'SERVICE' && (
            <div className="p-6 space-y-8 animate-in fade-in duration-300">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <ShieldCheck size={24} className="text-emerald-600" />
                <h2 className="text-lg font-bold text-slate-800">Warranty & AMC Details</h2>
              </div>

              {!warrantyData ? (
                <div className="text-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto"></div></div>
              ) : (
                <div className="space-y-8">
                  {/* AMC Contracts */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2"><FileText size={16} className="text-slate-400" /> Active AMCs</h3>
                    {warrantyData.amcs.length === 0 ? (
                      <div className="text-center py-6 text-sm text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">No AMC contracts generated yet. AMCs are auto-generated when Project Stage is marked as Completed.</div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {warrantyData.amcs.map((amc: any) => (
                          <div key={amc.id} className="border border-slate-200 rounded-xl p-4 flex items-start gap-4 hover:border-emerald-200 transition-colors bg-white shadow-sm">
                            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0"><ShieldCheck size={18} /></div>
                            <div className="flex-1">
                              <div className="flex justify-between items-start">
                                <h4 className="font-bold text-slate-800 text-sm">{amc.contractNumber}</h4>
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700">{amc.status}</span>
                              </div>
                              <p className="text-xs text-slate-500 mt-1">Validity: {new Date(amc.startDate).toLocaleDateString()} - {new Date(amc.endDate).toLocaleDateString()}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Consumed Materials & Serial Numbers */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2"><Box size={16} className="text-slate-400" /> Warranty Serial Tracking</h3>
                    {warrantyData.installations.length === 0 || warrantyData.installations.every((i:any) => i.materials.length === 0) ? (
                      <div className="text-center py-6 text-sm text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">No materials consumed from installations yet.</div>
                    ) : (
                      <div className="space-y-4">
                        {warrantyData.installations.map((inst: any) => (
                          inst.materials.map((mat: any) => (
                            <div key={mat.id} className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                              <div className="flex justify-between items-center mb-3 pb-3 border-b border-slate-200">
                                <div>
                                  <h4 className="font-bold text-slate-800 text-sm">{mat.product?.name || 'Unknown Product'}</h4>
                                  <p className="text-xs text-slate-500">Consumed Qty: {mat.consumedQty}</p>
                                </div>
                                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">Warranty Active</span>
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-slate-700 mb-2">Logged Serial Numbers:</p>
                                {mat.serialNumbers && mat.serialNumbers.length > 0 ? (
                                  <div className="flex flex-wrap gap-2">
                                    {mat.serialNumbers.map((sn: string, idx: number) => (
                                      <span key={idx} className="bg-white border border-slate-200 px-2.5 py-1 rounded-md text-xs font-mono text-slate-600 shadow-sm">{sn}</span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-xs text-slate-400 italic">No serial numbers logged for this material.</span>
                                )}
                              </div>
                            </div>
                          ))
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Support Tickets */}
                  <div className="pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2"><MessageSquare size={16} className="text-slate-400" /> Support Tickets</h3>
                      <button onClick={() => setShowTicketModal(true)} className="text-sm font-medium bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg hover:bg-emerald-200 transition-colors flex items-center gap-1.5">
                        <Plus size={14} /> New Ticket
                      </button>
                    </div>
                    
                    {tickets.length === 0 ? (
                      <div className="text-center py-6 text-sm text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">No support tickets have been created for this project.</div>
                    ) : (
                      <div className="space-y-3">
                        {tickets.map((t: any) => (
                          <div key={t.id} className="border border-slate-200 rounded-xl p-4 flex items-start justify-between gap-4 bg-white">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-bold text-slate-800 text-sm">{t.subject}</h4>
                                {t.subject.includes('[WARRANTY]') && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700">WARRANTY</span>}
                              </div>
                              <p className="text-xs text-slate-500 whitespace-pre-wrap">{t.description}</p>
                              <div className="flex items-center gap-3 mt-3 text-xs">
                                <span className="px-2 py-1 rounded-md font-semibold bg-slate-100 text-slate-600">{t.status}</span>
                                <span className="text-slate-400">{new Date(t.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <span className={`px-2 py-1 rounded text-xs font-bold ${t.priority === 'HIGH' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>{t.priority}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* MODALS */}
      {showTicketModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-slate-900">Create Support Ticket</h2>
              <button onClick={() => setShowTicketModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>
            <form onSubmit={handleCreateTicket} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Subject *</label>
                <input required type="text" value={newTicket.subject} onChange={e => setNewTicket({...newTicket, subject: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm" placeholder="e.g. Inverter not connecting to WiFi" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Description *</label>
                <textarea required rows={3} value={newTicket.description} onChange={e => setNewTicket({...newTicket, description: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm resize-none" placeholder="Describe the issue..." />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Priority</label>
                <select value={newTicket.priority} onChange={e => setNewTicket({...newTicket, priority: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm bg-white">
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setShowTicketModal(false)} className="flex-1 py-2.5 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl font-medium transition-colors text-sm">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium shadow-sm transition-colors text-sm">Submit Ticket</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showTaskModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-slate-900">Add Task</h2>
              <button onClick={() => setShowTaskModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>
            <form onSubmit={handleCreateTask} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Task Name *</label>
                <input required type="text" value={newTask.name} onChange={e => setNewTask({...newTask, name: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Description</label>
                <textarea rows={2} value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Priority</label>
                  <select value={newTask.priority} onChange={e => setNewTask({...newTask, priority: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm bg-white">
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Due Date</label>
                  <input type="date" value={newTask.dueDate} onChange={e => setNewTask({...newTask, dueDate: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm" />
                </div>
              </div>
              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setShowTaskModal(false)} className="flex-1 py-2.5 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl font-medium transition-colors text-sm">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium shadow-sm transition-colors text-sm">Create Task</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showMilestoneModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-slate-900">Add Milestone</h2>
              <button onClick={() => setShowMilestoneModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>
            <form onSubmit={handleCreateMilestone} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Milestone Name *</label>
                <input required type="text" value={newMilestone.name} onChange={e => setNewMilestone({...newMilestone, name: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm" placeholder="e.g. Design Approved" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Target Date</label>
                <input type="date" value={newMilestone.targetDate} onChange={e => setNewMilestone({...newMilestone, targetDate: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm" />
              </div>
              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setShowMilestoneModal(false)} className="flex-1 py-2.5 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl font-medium transition-colors text-sm">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium shadow-sm transition-colors text-sm">Create Milestone</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showMaterialModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-slate-900">Add Material Requirement</h2>
              <button onClick={() => setShowMaterialModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>
            <form onSubmit={handleCreateMaterial} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Select Product (Catalog)</label>
                <select 
                  value={newMaterial.productId}
                  onChange={e => {
                    const p = products.find(x => x.id === e.target.value);
                    setNewMaterial({...newMaterial, productId: e.target.value, description: p ? p.name : newMaterial.description});
                  }}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm bg-white"
                >
                  <option value="">-- Custom Item --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Description / Name *</label>
                <input required type="text" value={newMaterial.description} onChange={e => setNewMaterial({...newMaterial, description: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm" placeholder="e.g. 5kW Inverter" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Quantity *</label>
                <input required type="number" min="0.1" step="0.1" value={newMaterial.quantity} onChange={e => setNewMaterial({...newMaterial, quantity: parseFloat(e.target.value)})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm" />
              </div>
              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setShowMaterialModal(false)} className="flex-1 py-2.5 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl font-medium transition-colors text-sm">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium shadow-sm transition-colors text-sm">Add Material</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INTERACTIVE DISCOM DOCUMENT STUDIO / CUSTOMIZER MODAL */}
      {showDiscomModal && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-3 sm:p-6 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-7xl max-h-[94vh] shadow-2xl flex flex-col overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
                  <FileText size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white flex items-center gap-2">
                    DISCOM Document Studio &amp; PDF Generator
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/30 text-emerald-300 font-bold uppercase">
                      Live Dynamic
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Project #{project?.projectNumber || 'PROJ'} · {project?.customer?.name || 'Customer'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const printContents = document.getElementById('discom-live-preview-content');
                    if (!printContents) return;
                    window.print();
                  }}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-700"
                >
                  <Printer size={14} /> Print
                </button>
                <button
                  type="button"
                  disabled={isGeneratingPDF}
                  onClick={() => handleDownloadForm(previewDocId, discomCustomOverrides)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors disabled:opacity-50"
                >
                  {isGeneratingPDF ? (
                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></div>
                  ) : (
                    <><Download size={14} /> Download PDF</>
                  )}
                </button>
                <button 
                  onClick={() => setShowDiscomModal(false)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors ml-2"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body: Left Controls + Right Live Preview */}
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-slate-100">
              {/* Left Controls Column */}
              <div className="w-full lg:w-96 bg-white border-r border-slate-200 p-5 overflow-y-auto space-y-5 shrink-0">
                {/* Document Type Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Select Document Template
                  </label>
                  <select
                    value={previewDocId}
                    onChange={(e) => setPreviewDocId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 bg-white focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm"
                  >
                    <option value="WCR_FULL">Work Completion Report Pack (3-Page Dossier)</option>
                    <option value="WCR">WCR Page 1 (Work Completion Report)</option>
                    <option value="AnnexureI">Annexure - I (Commissioning Certificate)</option>
                    <option value="DCR">Annexure - A (DCR &amp; Module Serials)</option>
                    <option value="NetMetering">Annexure – 3 (Net Metering Agreement - 6 Pages)</option>
                    <option value="ConsumerVendor">Annexure 2 (PM Surya Ghar Agreement - 3 Pages)</option>
                    <option value="StandardQuotation">Official Standard 1-Page Quotation</option>
                  </select>
                </div>

                {/* Stamp Paper Graphic Toggle (For Agreements) */}
                {(previewDocId === 'NetMetering' || previewDocId === 'ConsumerVendor') && (
                  <div className="p-3.5 bg-purple-50 rounded-2xl border border-purple-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-purple-900">₹100 Stamp Paper Header</span>
                      <input
                        type="checkbox"
                        checked={includeStampGraphic}
                        onChange={(e) => setIncludeStampGraphic(e.target.checked)}
                        className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                      />
                    </div>
                    <p className="text-[11px] text-purple-700 leading-snug">
                      {includeStampGraphic 
                        ? 'Includes digital ₹100 Maharashtra Non-Judicial Stamp graphic.' 
                        : 'Leaves blank ~115mm margin on Page 1 for printing on physical stamp paper.'}
                    </p>
                  </div>
                )}

                {/* Dynamic Parameter Overrides */}
                <div className="space-y-3.5 border-t border-slate-200 pt-4">
                  <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Edit3 size={13} className="text-emerald-600" />
                    <span>Dynamic Data Fields</span>
                  </h4>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600">Beneficiary / Consumer Name</label>
                    <input
                      type="text"
                      value={discomCustomOverrides.beneficiaryName || getDiscomFormData().beneficiaryName}
                      onChange={(e) => setDiscomCustomOverrides({ ...discomCustomOverrides, beneficiaryName: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-600">Consumer Account No.</label>
                      <input
                        type="text"
                        value={discomCustomOverrides.consumerNumber || getDiscomFormData().consumerNumber}
                        onChange={(e) => setDiscomCustomOverrides({ ...discomCustomOverrides, consumerNumber: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-mono font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-600">Sanctioned Load (kW)</label>
                      <input
                        type="text"
                        value={discomCustomOverrides.sanctionedLoad || getDiscomFormData().sanctionedLoad}
                        onChange={(e) => setDiscomCustomOverrides({ ...discomCustomOverrides, sanctionedLoad: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600">Application Ref. No.</label>
                    <input
                      type="text"
                      value={discomCustomOverrides.applicationRefNo || getDiscomFormData().applicationRefNo}
                      onChange={(e) => setDiscomCustomOverrides({ ...discomCustomOverrides, applicationRefNo: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-mono font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-600">Capacity (kWp)</label>
                      <input
                        type="text"
                        value={discomCustomOverrides.appliedCapacity || getDiscomFormData().appliedCapacity}
                        onChange={(e) => setDiscomCustomOverrides({ ...discomCustomOverrides, appliedCapacity: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-600">Sub-Division</label>
                      <input
                        type="text"
                        value={discomCustomOverrides.subDivision || getDiscomFormData().subDivision}
                        onChange={(e) => setDiscomCustomOverrides({ ...discomCustomOverrides, subDivision: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-600">Module Wattage (Wp)</label>
                      <input
                        type="number"
                        value={discomCustomOverrides.moduleWattage || getDiscomFormData().moduleWattage}
                        onChange={(e) => setDiscomCustomOverrides({ ...discomCustomOverrides, moduleWattage: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-600">Module Qty (NOS)</label>
                      <input
                        type="number"
                        value={discomCustomOverrides.moduleQuantity || getDiscomFormData().moduleQuantity}
                        onChange={(e) => setDiscomCustomOverrides({ ...discomCustomOverrides, moduleQuantity: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* Module Serial Numbers Section */}
                  <div className="space-y-1 pt-2 border-t border-slate-100">
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[11px] font-bold text-slate-700">PV Module Serial Numbers</label>
                      <button
                        type="button"
                        onClick={() => {
                          const count = discomCustomOverrides.moduleQuantity || getDiscomFormData().moduleQuantity || 6;
                          const generated = Array.from({ length: count }).map((_, i) => `MS2608211A${3882 + i * 26}`);
                          setDiscomCustomOverrides({ ...discomCustomOverrides, moduleSerialNumbers: generated });
                        }}
                        className="text-[10px] text-emerald-600 hover:text-emerald-700 font-bold underline"
                      >
                        Auto-Generate
                      </button>
                    </div>
                    <textarea
                      rows={4}
                      value={(discomCustomOverrides.moduleSerialNumbers || getDiscomFormData().moduleSerialNumbers).join('\n')}
                      onChange={(e) => {
                        const arr = e.target.value.split('\n').map(s => s.trim()).filter(Boolean);
                        setDiscomCustomOverrides({ ...discomCustomOverrides, moduleSerialNumbers: arr });
                      }}
                      className="w-full p-2.5 rounded-lg border border-slate-200 text-[11px] font-mono leading-relaxed focus:ring-2 focus:ring-emerald-500 outline-none bg-slate-50"
                      placeholder="One serial number per line"
                    />
                    <p className="text-[10px] text-slate-400">Used dynamically in Annexure - A DCR serial numbers table.</p>
                  </div>
                </div>
              </div>

              {/* Right Live Preview Column */}
              <div className="flex-1 p-6 overflow-y-auto flex justify-center bg-slate-200/70">
                <div 
                  id="discom-live-preview-content" 
                  className="bg-white shadow-2xl rounded-sm max-w-[210mm] w-full origin-top text-black"
                >
                  {previewDocId === 'WCR_FULL' && (
                    <WcrFullPack data={getDiscomFormData(discomCustomOverrides)} />
                  )}
                  {previewDocId === 'WCR' && (
                    <WorkCompletionReport data={getDiscomFormData(discomCustomOverrides)} />
                  )}
                  {previewDocId === 'AnnexureI' && (
                    <CommissioningCertificate data={getDiscomFormData(discomCustomOverrides)} />
                  )}
                  {previewDocId === 'DCR' && (
                    <DcrUndertaking data={getDiscomFormData(discomCustomOverrides)} />
                  )}
                  {previewDocId === 'NetMetering' && (
                    <NetMeteringAgreement2019 
                      data={getDiscomFormData(discomCustomOverrides)} 
                      includeStamp={includeStampGraphic} 
                    />
                  )}
                  {previewDocId === 'ConsumerVendor' && (
                    <Annexure2ConsumerVendorAgreement 
                      data={getDiscomFormData(discomCustomOverrides)} 
                      includeStamp={includeStampGraphic} 
                    />
                  )}
                  {previewDocId === 'StandardQuotation' && (
                    <StandardQuotationPDF data={getDiscomFormData(discomCustomOverrides)} />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HIDDEN PDF CONTAINERS FOR DISCOM FORMS EXPORT */}
      {selectedForm && (
        <div style={{ position: 'absolute', top: 0, left: 0, opacity: 0, pointerEvents: 'none', zIndex: -50 }}>
          <div id={`discom-${selectedForm}`}>
            {selectedForm === 'WCR_FULL' && (
              <WcrFullPack data={getDiscomFormData(discomCustomOverrides)} />
            )}
            {selectedForm === 'WCR' && (
              <WorkCompletionReport data={getDiscomFormData(discomCustomOverrides)} />
            )}
            {selectedForm === 'AnnexureI' && (
              <CommissioningCertificate data={getDiscomFormData(discomCustomOverrides)} />
            )}
            {selectedForm === 'DCR' && (
              <DcrUndertaking data={getDiscomFormData(discomCustomOverrides)} />
            )}
            {selectedForm === 'NetMetering' && (
              <NetMeteringAgreement2019 
                data={getDiscomFormData(discomCustomOverrides)} 
                includeStamp={includeStampGraphic} 
              />
            )}
            {selectedForm === 'ConsumerVendor' && (
              <Annexure2ConsumerVendorAgreement 
                data={getDiscomFormData(discomCustomOverrides)} 
                includeStamp={includeStampGraphic} 
              />
            )}
            {selectedForm === 'StandardQuotation' && (
              <StandardQuotationPDF data={getDiscomFormData(discomCustomOverrides)} />
            )}
            {selectedForm === 'Guarantee' && (
              <GuaranteeCertificate data={getDiscomFormData(discomCustomOverrides)} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
