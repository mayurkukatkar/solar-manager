"use client";

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
  FileText, Plus, User, Calendar, IndianRupee, Download, 
  Search, Filter, ArrowUpRight, CheckCircle2, Clock, 
  AlertCircle, MessageSquare, Sun, Shield, Lock, 
  RotateCcw, Sparkles, Send, Eye, ChevronRight, Trash2,
  ExternalLink, Copy, Check, CheckCheck, Loader2, RefreshCw, 
  Phone, X, Printer
} from 'lucide-react';
import Link from 'next/link';
import { QuotationWizardModal } from '@/components/quotations/QuotationWizardModal';
import { QuotationDetailModal } from '@/components/quotations/QuotationDetailModal';
import { TemplateDesignerModal } from '@/components/quotations/TemplateDesignerModal';
import { QuotationPDF, QuotationData, mapQuotationToPdfData, generatePDF } from '@/components/pdf/QuotationPDF';
import { StandardQuotationPDF } from '@/components/pdf/MsedclFormsPDF';

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({
    totalQuotations: 0,
    awaitingResponse: 0,
    accepted: 0,
    totalQuotedValue: 0
  });
  const [followUpReminders, setFollowUpReminders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [deletingQuoteId, setDeletingQuoteId] = useState<string | null>(null);

  // DIRECT PDF DOWNLOAD STATE
  const [downloadingQuoteId, setDownloadingQuoteId] = useState<string | null>(null);
  const [downloadingQuoteData, setDownloadingQuoteData] = useState<QuotationData | null>(null);
  const [downloadingStandardQuoteData, setDownloadingStandardQuoteData] = useState<any | null>(null);

  // FILTERS & SEARCH
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedCapacityFilter, setSelectedCapacityFilter] = useState('ALL');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('ALL');

  // DATA LISTS FOR CREATION & INTERCONNECTIVITY
  const [leads, setLeads] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [surveys, setSurveys] = useState<any[]>([]);
  const [tenantInfo, setTenantInfo] = useState<any>(null);
  const [preselectedLeadId, setPreselectedLeadId] = useState<string>('');
  const [preselectedCustomerId, setPreselectedCustomerId] = useState<string>('');

  // MODALS
  const [showWizard, setShowWizard] = useState(false);
  const [showTemplateDesigner, setShowTemplateDesigner] = useState(false);
  const [selectedQuoteForDetail, setSelectedQuoteForDetail] = useState<any>(null);
  const [detailModalInitialTab, setDetailModalInitialTab] = useState<'overview' | 'preview' | 'milestones' | 'revisions'>('overview');

  // WHATSAPP SHARE MODAL STATE
  const [selectedQuoteForWhatsApp, setSelectedQuoteForWhatsApp] = useState<any>(null);
  const [whatsAppPhone, setWhatsAppPhone] = useState('');
  const [whatsAppText, setWhatsAppText] = useState('');
  const [copiedPitch, setCopiedPitch] = useState(false);
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);
  const [isDownloadingWhatsAppPdf, setIsDownloadingWhatsAppPdf] = useState(false);

  // Parse URL parameters for cross-module interconnectivity (CRM/Surveys -> Quotations)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const leadId = urlParams.get('leadId');
      const customerId = urlParams.get('customerId');
      const isNew = urlParams.get('new');
      if (leadId) setPreselectedLeadId(leadId);
      if (customerId) setPreselectedCustomerId(customerId);
      if (isNew === 'true' || leadId || customerId) {
        setShowWizard(true);
      }
    }
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (selectedStatus !== 'ALL') params.status = selectedStatus;
      if (searchTerm) params.search = searchTerm;
      if (selectedCustomerId) params.customerId = selectedCustomerId;

      const [quoteRes, leadRes, customerRes, productRes, surveyRes, settingsRes] = await Promise.all([
        axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/quotations`, { 
          params, 
          withCredentials: true 
        }).catch(err => {
          console.warn('API fetch fallback:', err);
          return { data: { quotations: [], metrics: null, followUpReminders: [] } };
        }),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/leads`, { 
          withCredentials: true 
        }).catch(() => ({ data: { leads: [] } })),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/customers`, { 
          withCredentials: true 
        }).catch(() => ({ data: { customers: [] } })),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/products`, { 
          withCredentials: true 
        }).catch(() => ({ data: { products: [] } })),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/surveys`, { 
          withCredentials: true 
        }).catch(() => ({ data: { surveys: [] } })),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/settings`, { 
          withCredentials: true 
        }).catch(() => ({ data: { tenant: null } }))
      ]);

      const quotesData = quoteRes.data.quotations || [];
      setQuotations(quotesData);

      if (quoteRes.data.metrics) {
        setMetrics({
          totalQuotations: quoteRes.data.metrics.totalQuotations,
          awaitingResponse: quoteRes.data.metrics.awaitingResponse,
          accepted: quoteRes.data.metrics.accepted,
          totalQuotedValue: quoteRes.data.metrics.totalQuotedValue
        });
      } else {
        // Compute dynamically from loaded quotes
        setMetrics({
          totalQuotations: quotesData.length,
          awaitingResponse: quotesData.filter((q: any) => ['SENT', 'VIEWED', 'NEGOTIATION'].includes(q.status)).length,
          accepted: quotesData.filter((q: any) => q.status === 'ACCEPTED').length,
          totalQuotedValue: quotesData.reduce((acc: number, q: any) => acc + (q.total || 0), 0)
        });
      }

      if (settingsRes?.data?.tenant) {
        setTenantInfo(settingsRes.data.tenant);
      }

      setFollowUpReminders(quoteRes.data.followUpReminders || []);
      setLeads(leadRes.data.leads || leadRes.data || []);
      setCustomers(customerRes.data.customers || customerRes.data || []);
      setProducts(productRes.data.products || productRes.data || []);
      setSurveys(surveyRes.data.surveys || surveyRes.data || []);
    } catch (err) {
      console.error('Failed to fetch quotations data:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedStatus, selectedCustomerId]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchData();
  };

  // OPEN WHATSAPP SHARE MODAL
  const openWhatsAppModal = (quote: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const client = quote.customer || quote.lead;
    const raw = client?.mobile || client?.phone || '';
    const digits = raw.replace(/[^0-9]/g, '');
    const clean = digits.startsWith('91') ? digits.slice(2) : digits.replace(/^0+/, '');
    setWhatsAppPhone(clean || '');

    const tenantName = tenantInfo?.legalName || tenantInfo?.name || 'WhereReady Solar';
    const cap = quote.systemCapacity || 5;
    const total = (quote.total || 0).toLocaleString();
    const sub = quote.indicativeSubsidy || 0;
    const net = Math.max(0, (quote.total || 0) - sub).toLocaleString();
    const annualSavings = (quote.annualSavings || Math.round(cap * 1460 * 8.5)).toLocaleString();
    const webProposalUrl = typeof window !== 'undefined' ? `${window.location.origin}/tenant/quotations/pdf-demo` : '';

    const msg = `Dear ${client?.name || 'Valued Customer'},\n\nGreetings from *${tenantName}*!\n\nWe have prepared your personalized Solar Rooftop Proposal for *${cap} kWp (${quote.systemType || 'On-grid'})*.\n\n*Proposal Highlights:*\n• Total Investment: ₹${total}\n${sub > 0 ? `• PM Surya Ghar Central Subsidy: ₹${sub.toLocaleString()}\n• Net Investment Outflow: ₹${net}\n` : ''}• Est. Annual Electricity Savings: ₹${annualSavings}/yr\n• Proposal No: ${quote.qNumber}\n• Proposal Validity: ${quote.validityDays || 15} Days\n• 📄 Attached PDF: Proposal_${quote.qNumber}.pdf\n• 🌐 View Live Proposal: ${webProposalUrl}\n\nPlease let us know if you have any questions or wish to schedule a roof technical inspection.\n\nBest Regards,\n*${tenantName}*\nPhone: ${tenantInfo?.phone || '+91 98220 12345'}`;
    
    setWhatsAppText(msg);
    setSelectedQuoteForWhatsApp(quote);
    setCopiedPitch(false);
  };

  // DIRECT 1-CLICK PDF DOWNLOAD FROM ACTION BAR
  const handleDirectDownloadPdf = async (quote: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      setDownloadingQuoteId(quote.id);
      const pdfData = mapQuotationToPdfData(quote, tenantInfo);
      setDownloadingQuoteData(pdfData);

      // Wait 350ms for offscreen element rendering
      await new Promise(r => setTimeout(r, 350));

      const filename = `Proposal_${quote.qNumber || 'QT'}.pdf`;
      await generatePDF('page-direct-pdf-generator', filename);
    } catch (err) {
      console.error('Direct PDF generation error:', err);
      // Fallback: open in preview modal tab
      handleOpenPreviewPdf(quote);
    } finally {
      setDownloadingQuoteId(null);
      setDownloadingQuoteData(null);
    }
  };

  // DIRECT 1-PAGE OFFICIAL QUOTATION DOWNLOAD (DISCOM FORMAT)
  const handleDirectDownloadStandardQuote = async (quote: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      setDownloadingQuoteId(quote.id + '_standard');
      const standardData = {
        company_name: tenantInfo?.legalName || tenantInfo?.name || "Ekvarta Energy Solutions",
        gstin: tenantInfo?.gstin || "27DTXPM6427E1Z3",
        quotation_date: quote.date ? new Date(quote.date).toLocaleDateString() : new Date().toLocaleDateString(),
        quotation_number: quote.qNumber || "EES/2026/031",
        customer_name: (quote.customer?.name || quote.lead?.name || "RAVI DODKUJI KAWALE").toUpperCase(),
        consumer_number: quote.consumerNumber || quote.customer?.consumerNumber || "413472965142",
        panel_brand: quote.panelBrand || "Adani",
        panel_wattage: quote.panelWattage || 550,
        panel_quantity: quote.panelQuantity || 8,
        inverter_brand: quote.inverterBrand || "Polycab",
        inverter_capacity: quote.inverterCapacity || quote.systemCapacity || 4.3,
        inverter_quantity: quote.inverterQuantity || 1,
        structure_brand: quote.structureBrand || "GI Structure",
        grand_total: quote.total || 245000,
        signatureUrl: tenantInfo?.signatureUrl
      };
      setDownloadingStandardQuoteData(standardData);

      await new Promise(r => setTimeout(r, 350));
      const filename = `Quotation_${quote.qNumber || 'QT'}.pdf`;
      const { generateDiscomPDF } = await import('@/components/pdf/MsedclFormsPDF');
      await generateDiscomPDF('page-direct-standard-quote-generator', filename);
    } catch (err) {
      console.error('Direct Standard Quotation generation error:', err);
      handleOpenPreviewPdf(quote);
    } finally {
      setDownloadingQuoteId(null);
      setDownloadingStandardQuoteData(null);
    }
  };

  // DOWNLOAD PDF DIRECTLY FROM WHATSAPP SHARE MODAL
  const handleDownloadPdfFromWhatsApp = async () => {
    if (!selectedQuoteForWhatsApp) return;
    try {
      setIsDownloadingWhatsAppPdf(true);
      const pdfData = mapQuotationToPdfData(selectedQuoteForWhatsApp, tenantInfo);
      setDownloadingQuoteData(pdfData);

      await new Promise(r => setTimeout(r, 350));

      const filename = `Proposal_${selectedQuoteForWhatsApp.qNumber || 'QT'}.pdf`;
      await generatePDF('page-direct-pdf-generator', filename);
    } catch (err) {
      console.error('WhatsApp PDF generation error:', err);
      handleOpenPreviewPdf(selectedQuoteForWhatsApp);
    } finally {
      setIsDownloadingWhatsAppPdf(false);
      setDownloadingQuoteData(null);
    }
  };

  // SEND ON WHATSAPP & UPDATE DRAFT STATUS
  const handleSendWhatsApp = async () => {
    const rawDigits = whatsAppPhone.replace(/[^0-9]/g, '');
    const cleanDigits = rawDigits.startsWith('91') ? rawDigits : rawDigits.replace(/^0+/, '');
    const finalPhone = cleanDigits.startsWith('91') ? cleanDigits : (cleanDigits ? '91' + cleanDigits : '');

    if (!finalPhone) {
      alert('Please enter a valid 10-digit mobile number.');
      return;
    }

    const url = `https://wa.me/${finalPhone}?text=${encodeURIComponent(whatsAppText)}`;
    window.open(url, '_blank');

    // Auto-update status to SENT if current status is DRAFT
    if (selectedQuoteForWhatsApp?.status === 'DRAFT') {
      try {
        await axios.patch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/quotations/${selectedQuoteForWhatsApp.id}`,
          { status: 'SENT' },
          { withCredentials: true }
        );
        fetchData();
      } catch (err) {
        console.warn('Auto status update to SENT failed:', err);
      }
    }

    setSelectedQuoteForWhatsApp(null);
  };

  // COPY PITCH TO CLIPBOARD
  const handleCopyPitch = () => {
    navigator.clipboard.writeText(whatsAppText);
    setCopiedPitch(true);
    setTimeout(() => setCopiedPitch(false), 2000);
  };

  // DELETE QUOTATION HANDLER
  const handleDeleteQuotation = async (quote: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to permanently delete quotation ${quote.qNumber}? This cannot be undone.`)) {
      return;
    }

    setDeletingQuoteId(quote.id);
    try {
      // Optimistic delete
      setQuotations(prev => prev.filter(q => q.id !== quote.id));
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/quotations/${quote.id}`,
        { withCredentials: true }
      );
      fetchData();
    } catch (err: any) {
      alert('Failed to delete quotation: ' + (err.response?.data?.error || err.message));
      fetchData(); // Restore on failure
    } finally {
      setDeletingQuoteId(null);
    }
  };

  // DUPLICATE QUOTATION HANDLER
  const handleDuplicateQuotation = async (quote: any, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setLoading(true);
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/quotations/${quote.id}/duplicate`,
        {},
        { withCredentials: true }
      );
      fetchData();
    } catch (err: any) {
      alert('Failed to duplicate quotation: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  // VIEW A4 PROPOSAL DOCUMENT / DOWNLOAD
  const handleOpenPreviewPdf = (quote: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDetailModalInitialTab('preview');
    setSelectedQuoteForDetail(quote);
  };

  // VIEW PROPOSAL 360° OVERVIEW
  const handleOpenOverview = (quote: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDetailModalInitialTab('overview');
    setSelectedQuoteForDetail(quote);
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'DRAFT': 
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-700 uppercase">Draft</span>;
      case 'SENT': 
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 uppercase border border-blue-200">Sent</span>;
      case 'VIEWED': 
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-purple-50 text-purple-700 uppercase border border-purple-200">Viewed</span>;
      case 'NEGOTIATION': 
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-800 uppercase border border-amber-200">Negotiation</span>;
      case 'ACCEPTED': 
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 uppercase border border-emerald-200 flex items-center gap-1 w-fit"><Lock size={10} /> Accepted</span>;
      case 'REJECTED': 
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-red-50 text-red-700 uppercase border border-red-200">Rejected</span>;
      case 'EXPIRED': 
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-slate-200 text-slate-600 uppercase">Expired</span>;
      default: 
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-slate-50 text-slate-600 uppercase">{status}</span>;
    }
  };

  // STATUS TABS WITH DYNAMIC COUNTS
  const statusTabs = useMemo(() => [
    { id: 'ALL', label: 'All Quotations', count: quotations.length },
    { id: 'DRAFT', label: 'Draft', count: quotations.filter(q => q.status === 'DRAFT').length },
    { id: 'SENT', label: 'Sent', count: quotations.filter(q => q.status === 'SENT').length },
    { id: 'VIEWED', label: 'Viewed', count: quotations.filter(q => q.status === 'VIEWED').length },
    { id: 'NEGOTIATION', label: 'Negotiation', count: quotations.filter(q => q.status === 'NEGOTIATION').length },
    { id: 'ACCEPTED', label: 'Accepted', count: quotations.filter(q => q.status === 'ACCEPTED').length },
    { id: 'REJECTED', label: 'Rejected', count: quotations.filter(q => q.status === 'REJECTED').length },
    { id: 'EXPIRED', label: 'Expired', count: quotations.filter(q => q.status === 'EXPIRED').length }
  ], [quotations]);

  // FILTERED QUOTATIONS
  const filteredQuotations = useMemo(() => {
    return quotations.filter(q => {
      const cap = q.systemCapacity || 5;
      if (selectedCapacityFilter === 'LT3' && cap > 3) return false;
      if (selectedCapacityFilter === '3TO5' && (cap < 3 || cap > 5)) return false;
      if (selectedCapacityFilter === '5TO10' && (cap < 5 || cap > 10)) return false;
      if (selectedCapacityFilter === 'GT10' && cap <= 10) return false;

      if (selectedTypeFilter !== 'ALL' && (q.systemType || 'On-grid') !== selectedTypeFilter) return false;

      return true;
    });
  }, [quotations, selectedCapacityFilter, selectedTypeFilter]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
              <Sun size={20} />
            </span>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">Quotations & Proposals</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            WhereReady Solar OS dynamic proposal & quotation builder for rooftop EPC vendors in India.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button 
            type="button"
            onClick={() => setShowTemplateDesigner(true)}
            className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 px-4 py-2.5 rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
          >
            <Sparkles size={15} className="text-amber-500" /> Template Designer
          </button>
          <button 
            type="button"
            onClick={() => setShowWizard(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md cursor-pointer"
          >
            <Plus size={16} /> New Quotation
          </button>
        </div>
      </div>

      {/* DASHBOARD METRICS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-1">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total quotations</p>
          <p className="text-3xl font-black text-[#071A2B]"># {metrics.totalQuotations}</p>
          <p className="text-[11px] text-slate-400 font-medium">All-time count</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-1">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Awaiting response</p>
          <p className="text-3xl font-black text-amber-600"># {metrics.awaitingResponse}</p>
          <p className="text-[11px] text-slate-400 font-medium">Drafts excluded</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-1">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Accepted</p>
          <p className="text-3xl font-black text-emerald-600"># {metrics.accepted}</p>
          <p className="text-[11px] text-slate-400 font-medium">Locked & ready for project</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-1">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Quoted value</p>
          <p className="text-3xl font-black text-[#071A2B]">₹{((metrics.totalQuotedValue || 0) / 100000).toFixed(1)}L</p>
          <p className="text-[11px] text-slate-400 font-medium">Pipeline commercial volume</p>
        </div>
      </div>

      {/* FOLLOW-UP REMINDERS BANNER */}
      {followUpReminders && followUpReminders.length > 0 && (
        <div className="p-4 rounded-3xl bg-amber-50/80 border border-amber-200/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-amber-900 uppercase tracking-wider flex items-center gap-2">
              <Clock size={15} className="text-amber-600" /> Proactive Follow-up Reminders ({followUpReminders.length})
            </span>
            <span className="text-[11px] font-bold text-amber-800">Close deals faster with timely outreach</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
            {followUpReminders.map(rem => (
              <div key={rem.id} className="p-3 bg-white rounded-2xl border border-amber-200 shadow-sm flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-800">{rem.customerName} ({rem.qNumber})</p>
                  <p className="text-[11px] text-amber-700 mt-0.5">{rem.reason}</p>
                </div>
                <button
                  type="button"
                  onClick={() => openWhatsAppModal({ customer: { name: rem.customerName, mobile: rem.customerMobile }, qNumber: rem.qNumber, total: rem.total, systemCapacity: rem.systemCapacity || 5 })}
                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <MessageSquare size={12} /> Ping
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SEARCH & FILTERS BAR */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        
        {/* TOP CONTROLS: SEARCH, CUSTOMER FILTER & REFRESH */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by quote number, customer name, or location..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </form>

          <select
            value={selectedCustomerId}
            onChange={e => setSelectedCustomerId(e.target.value)}
            className="w-full sm:w-56 px-4 py-2.5 rounded-2xl border border-slate-200 text-xs font-semibold bg-white outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="">All Customers</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select
            value={selectedCapacityFilter}
            onChange={e => setSelectedCapacityFilter(e.target.value)}
            className="w-full sm:w-44 px-3 py-2.5 rounded-2xl border border-slate-200 text-xs font-semibold bg-white outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="ALL">All Capacities</option>
            <option value="LT3">&lt;= 3 kWp (Surya Ghar)</option>
            <option value="3TO5">3 to 5 kWp</option>
            <option value="5TO10">5 to 10 kWp</option>
            <option value="GT10">&gt; 10 kWp (C&amp;I)</option>
          </select>

          <select
            value={selectedTypeFilter}
            onChange={e => setSelectedTypeFilter(e.target.value)}
            className="w-full sm:w-44 px-3 py-2.5 rounded-2xl border border-slate-200 text-xs font-semibold bg-white outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="ALL">All Configurations</option>
            <option value="On-grid">On-grid</option>
            <option value="Hybrid">Hybrid</option>
            <option value="Off-grid">Off-grid</option>
          </select>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>

        {/* STATUS WORKFLOW TABS */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-t border-slate-100 pt-3">
          {statusTabs.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedStatus(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedStatus === tab.id
                  ? 'bg-[#071A2B] text-white shadow-sm'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                selectedStatus === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* QUOTATIONS TABLE */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] font-extrabold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Quotation No.</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">System Capacity</th>
                <th className="px-6 py-4">Total Amount</th>
                <th className="px-6 py-4">Date & Validity</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                    <p className="text-xs text-slate-400 mt-2 font-medium">Loading quotations...</p>
                  </td>
                </tr>
              ) : quotations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <Sun size={36} className="text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-bold text-slate-700">No quotations found</p>
                    <p className="text-xs text-slate-400 mt-1">Create a new solar proposal to begin or reset your search filters.</p>
                    <button
                      type="button"
                      onClick={() => setShowWizard(true)}
                      className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus size={14} /> Create Quotation
                    </button>
                  </td>
                </tr>
              ) : (
                filteredQuotations.map(quote => {
                  const client = quote.customer || quote.lead;
                  const isDeleting = deletingQuoteId === quote.id;

                  return (
                    <tr 
                      key={quote.id} 
                      onClick={() => handleOpenOverview(quote)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      {/* QUOTATION NUMBER */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-[11px] group-hover:bg-emerald-50 group-hover:text-emerald-700 transition-colors">
                            <FileText size={14} />
                          </span>
                          <div>
                            <span className="font-extrabold text-slate-900 block group-hover:text-emerald-700 transition-colors">
                              {quote.qNumber}
                            </span>
                            {quote.version > 1 && (
                              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                                Rev v{quote.version}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* CUSTOMER */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px] font-bold uppercase">
                            {(client?.name || 'C')[0]}
                          </span>
                          <div>
                            <p className="font-bold text-slate-800">{client?.name || 'Customer'}</p>
                            <p className="text-[10px] text-slate-400">{client?.mobile || client?.phone || client?.city || 'Maharashtra'}</p>
                          </div>
                        </div>
                      </td>

                      {/* CAPACITY */}
                      <td className="px-6 py-4">
                        <div className="space-y-0.5">
                          <span className="font-extrabold text-slate-900">{quote.systemCapacity || 5} kWp</span>
                          <span className="text-[11px] text-slate-400 block">{quote.systemType || 'On-grid'} · {quote.panelQuantity || 9} Panels</span>
                        </div>
                      </td>

                      {/* TOTAL AMOUNT */}
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-black text-slate-900 text-sm">
                            ₹{(quote.total || 0).toLocaleString()}
                          </p>
                          {quote.indicativeSubsidy > 0 && (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                              Subsidy: ₹{quote.indicativeSubsidy.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* DATE & VALIDITY */}
                      <td className="px-6 py-4">
                        <div className="space-y-0.5 text-slate-600">
                          <span className="flex items-center gap-1 font-medium">
                            <Calendar size={13} className="text-slate-400" />
                            {new Date(quote.date).toLocaleDateString()}
                          </span>
                          <span className="text-[10px] text-slate-400 block">Valid {quote.validityDays || 15} days</span>
                        </div>
                      </td>

                      {/* STATUS */}
                      <td className="px-6 py-4">
                        {getStatusBadge(quote.status)}
                      </td>

                      {/* ACTIONS */}
                      <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {quote.projects && quote.projects.length > 0 ? (
                            <Link
                              href={`/tenant/projects/${quote.projects[0].id}`}
                              title={`View linked active project: ${quote.projects[0].name}`}
                              className="p-2 text-emerald-600 hover:text-emerald-700 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition-colors"
                            >
                              <ExternalLink size={15} />
                            </Link>
                          ) : null}

                          {/* ACTION 0: DIRECT DOWNLOAD OFFICIAL 1-PAGE QUOTATION */}
                          <button
                            type="button"
                            title="Download Official 1-Page Quotation (DISCOM & Submission Format)"
                            disabled={downloadingQuoteId === quote.id + '_standard'}
                            onClick={(e) => handleDirectDownloadStandardQuote(quote, e)}
                            className="p-2 text-slate-400 hover:text-emerald-600 rounded-xl hover:bg-emerald-50 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            {downloadingQuoteId === quote.id + '_standard' ? (
                              <Loader2 size={16} className="animate-spin text-emerald-600" />
                            ) : (
                              <FileText size={16} />
                            )}
                          </button>

                          {/* ACTION 1: DIRECT DOWNLOAD A4 PROPOSAL PDF */}
                          <button
                            type="button"
                            title="Download Full Proposal PDF"
                            disabled={downloadingQuoteId === quote.id}
                            onClick={(e) => handleDirectDownloadPdf(quote, e)}
                            className="p-2 text-slate-400 hover:text-emerald-600 rounded-xl hover:bg-emerald-50 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            {downloadingQuoteId === quote.id ? (
                              <Loader2 size={16} className="animate-spin text-emerald-600" />
                            ) : (
                              <Download size={16} />
                            )}
                          </button>

                          {/* ACTION 2: DUPLICATE QUOTATION */}
                          <button
                            type="button"
                            title="Duplicate Quotation as New Draft"
                            onClick={(e) => handleDuplicateQuotation(quote, e)}
                            className="p-2 text-slate-400 hover:text-blue-600 rounded-xl hover:bg-blue-50 transition-colors cursor-pointer"
                          >
                            <Copy size={16} />
                          </button>

                          {/* ACTION 3: WHATSAPP SHARE MODAL */}
                          <button
                            type="button"
                            title="Share Proposal on WhatsApp"
                            onClick={(e) => openWhatsAppModal(quote, e)}
                            className="p-2 text-slate-400 hover:text-emerald-600 rounded-xl hover:bg-emerald-50 transition-colors cursor-pointer"
                          >
                            <MessageSquare size={16} />
                          </button>

                          {/* ACTION 4: DELETE QUOTATION */}
                          {(!quote.projects || quote.projects.length === 0) && (
                            <button
                              type="button"
                              title="Delete Quotation"
                              disabled={isDeleting}
                              onClick={(e) => handleDeleteQuotation(quote, e)}
                              className="p-2 text-slate-400 hover:text-red-600 rounded-xl hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50"
                            >
                              {isDeleting ? <Loader2 size={15} className="animate-spin text-red-500" /> : <Trash2 size={15} />}
                            </button>
                          )}

                          {/* ACTION 5: VIEW DETAILS */}
                          <button
                            type="button"
                            title="View Proposal 360° Details"
                            onClick={(e) => handleOpenOverview(quote, e)}
                            className="p-2 text-slate-400 hover:text-[#071A2B] rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            <ChevronRight size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6-STEP GUIDED PROPOSAL BUILDER WIZARD */}
      <QuotationWizardModal
        isOpen={showWizard}
        onClose={() => {
          setShowWizard(false);
          setPreselectedLeadId('');
          setPreselectedCustomerId('');
        }}
        onSuccess={() => {
          fetchData();
        }}
        leads={leads}
        customers={customers}
        products={products}
        surveys={surveys}
        tenantInfo={tenantInfo}
        preselectedLeadId={preselectedLeadId}
        preselectedCustomerId={preselectedCustomerId}
      />

      {/* TEMPLATE DESIGNER & BRANDING MODAL */}
      <TemplateDesignerModal
        isOpen={showTemplateDesigner}
        onClose={() => setShowTemplateDesigner(false)}
        tenantInfo={tenantInfo}
        onTemplateSaved={fetchData}
      />

      {/* QUOTATION DETAIL & ACTION MODAL */}
      <QuotationDetailModal
        isOpen={!!selectedQuoteForDetail}
        onClose={() => setSelectedQuoteForDetail(null)}
        quotation={selectedQuoteForDetail}
        onUpdate={() => {
          fetchData();
          setSelectedQuoteForDetail(null);
        }}
        tenantInfo={tenantInfo}
        initialTab={detailModalInitialTab}
      />

      {/* DEDICATED WHATSAPP SHARE MODAL */}
      {selectedQuoteForWhatsApp && (
        <div className="fixed inset-0 z-50 bg-[#071A2B]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 sm:p-7 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <span className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                  <MessageSquare size={20} />
                </span>
                <div>
                  <h3 className="font-black text-slate-900 text-base">Share Proposal via WhatsApp</h3>
                  <p className="text-xs text-slate-500">Proposal No: <strong className="text-slate-800">{selectedQuoteForWhatsApp.qNumber}</strong></p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setSelectedQuoteForWhatsApp(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* RECIPIENT PHONE */}
              <div className="space-y-1.5">
                <label className="font-extrabold text-slate-700 uppercase text-[11px] flex items-center justify-between">
                  <span>Customer Mobile / WhatsApp *</span>
                  <span className="text-[10px] text-slate-400 font-medium">Auto-prefixed +91</span>
                </label>
                <div className="flex items-center bg-slate-50 rounded-2xl border border-slate-200 px-3 py-2.5 focus-within:ring-2 focus-within:ring-emerald-500">
                  <span className="font-bold text-slate-500 mr-2 text-xs">+91</span>
                  <input
                    type="tel"
                    value={whatsAppPhone}
                    onChange={e => setWhatsAppPhone(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="98220 12345"
                    className="bg-transparent flex-1 font-bold text-slate-800 outline-none text-xs"
                  />
                </div>
              </div>

              {/* PITCH MESSAGE */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-extrabold text-slate-700 uppercase text-[11px]">Personalized Pitch Copy</label>
                  <button
                    type="button"
                    onClick={handleCopyPitch}
                    className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedPitch ? <CheckCheck size={13} className="text-emerald-600" /> : <Copy size={13} />}
                    {copiedPitch ? 'Copied to Clipboard!' : 'Copy Text'}
                  </button>
                </div>
                <textarea
                  rows={6}
                  value={whatsAppText}
                  onChange={e => setWhatsAppText(e.target.value)}
                  className="w-full p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500 resize-none font-sans leading-relaxed"
                />
              </div>

              {/* 1-CLICK PDF ATTACHMENT CARD */}
              <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-emerald-950 flex items-center gap-1.5">
                    <FileText size={15} className="text-emerald-700" />
                    Quotation PDF Document
                  </span>
                  <span className="text-[11px] font-mono font-bold text-emerald-800 bg-white px-2 py-0.5 rounded-full border border-emerald-200">
                    Proposal_{selectedQuoteForWhatsApp.qNumber}.pdf
                  </span>
                </div>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  WhatsApp links cannot automatically attach local files. Click below to download the PDF, then attach it directly in your opened WhatsApp chat!
                </p>
                <button
                  type="button"
                  onClick={handleDownloadPdfFromWhatsApp}
                  disabled={isDownloadingWhatsAppPdf}
                  className="w-full py-2.5 px-3 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {isDownloadingWhatsAppPdf ? (
                    <Loader2 size={15} className="animate-spin text-emerald-700" />
                  ) : (
                    <Download size={15} className="text-emerald-700" />
                  )}
                  {isDownloadingWhatsAppPdf ? 'Generating PDF Proposal...' : 'Download PDF to Attach (1-Click)'}
                </button>
              </div>

              {/* QUICK STATS CHIPS */}
              <div className="grid grid-cols-3 gap-2 py-1">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                  <span className="text-[10px] text-slate-400 block font-semibold">Capacity</span>
                  <strong className="text-slate-800 text-xs font-black">{selectedQuoteForWhatsApp.systemCapacity || 5} kWp</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                  <span className="text-[10px] text-slate-400 block font-semibold">Investment</span>
                  <strong className="text-slate-800 text-xs font-black">₹{(selectedQuoteForWhatsApp.total || 0).toLocaleString()}</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                  <span className="text-[10px] text-emerald-800 block font-semibold">Net Outflow</span>
                  <strong className="text-emerald-700 text-xs font-black">₹{Math.max(0, (selectedQuoteForWhatsApp.total || 0) - (selectedQuoteForWhatsApp.indicativeSubsidy || 0)).toLocaleString()}</strong>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSelectedQuoteForWhatsApp(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendWhatsApp}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <Send size={14} /> Open in WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HIDDEN OFFSCREEN PDF RENDERER FOR DIRECT DOWNLOAD */}
      {downloadingQuoteData && (
        <div
          style={{
            position: 'absolute',
            left: '-9999px',
            top: 0,
            width: '794px',
            background: '#ffffff',
            zIndex: -9999
          }}
        >
          <div id="page-direct-pdf-generator" className="bg-white">
            <QuotationPDF data={downloadingQuoteData} />
          </div>
        </div>
      )}

      {downloadingStandardQuoteData && (
        <div
          style={{
            position: 'absolute',
            left: '-9999px',
            top: 0,
            width: '794px',
            background: '#ffffff',
            zIndex: -9999
          }}
        >
          <div id="page-direct-standard-quote-generator" className="bg-white">
            <StandardQuotationPDF data={downloadingStandardQuoteData} />
          </div>
        </div>
      )}

    </div>
  );
}
