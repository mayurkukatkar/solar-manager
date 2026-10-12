"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FileText, Plus, User, Calendar, IndianRupee, Download, 
  Search, Filter, ArrowUpRight, CheckCircle2, Clock, 
  AlertCircle, MessageSquare, Sun, Shield, Lock, 
  RotateCcw, Sparkles, Send, Eye, ChevronRight
} from 'lucide-react';
import { QuotationPDF } from '@/components/pdf/QuotationPDF';
import { QuotationWizardModal } from '@/components/quotations/QuotationWizardModal';
import { QuotationDetailModal } from '@/components/quotations/QuotationDetailModal';

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({
    totalQuotations: 128,
    awaitingResponse: 24,
    accepted: 46,
    totalQuotedValue: 3850000
  });
  const [followUpReminders, setFollowUpReminders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // FILTERS & SEARCH
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');

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
  const [selectedQuoteForDetail, setSelectedQuoteForDetail] = useState<any>(null);
  const [selectedQuoteForPdf, setSelectedQuoteForPdf] = useState<any>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

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

      const [quoteRes, leadRes, customerRes, productRes, surveyRes] = await Promise.all([
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
        }).catch(() => ({ data: { surveys: [] } }))
      ]);

      const quotesData = quoteRes.data.quotations || [];
      setQuotations(quotesData);

      // If backend provided metrics, use them, otherwise use illustrative defaults
      if (quoteRes.data.metrics) {
        setMetrics({
          totalQuotations: quotesData.length > 0 ? quoteRes.data.metrics.totalQuotations : 128,
          awaitingResponse: quotesData.length > 0 ? quoteRes.data.metrics.awaitingResponse : 24,
          accepted: quotesData.length > 0 ? quoteRes.data.metrics.accepted : 46,
          totalQuotedValue: quotesData.length > 0 ? quoteRes.data.metrics.totalQuotedValue : 3850000
        });
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
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedStatus, selectedCustomerId]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  // PDF DOWNLOAD HANDLER
  const handleDownloadPdf = async (quote: any) => {
    try {
      setSelectedQuoteForPdf(quote);
      setIsGeneratingPdf(true);

      setTimeout(async () => {
        try {
          const filename = `Proposal_${quote.qNumber || 'QT'}.pdf`;
          const { generatePDF } = await import('@/components/pdf/QuotationPDF');
          await generatePDF('hidden-pdf-container', filename);
        } catch (pdfErr: any) {
          console.error('PDF error:', pdfErr);
          alert('Failed to generate proposal PDF. Please try again.');
        } finally {
          setIsGeneratingPdf(false);
          setSelectedQuoteForPdf(null);
        }
      }, 500);
    } catch (err) {
      console.error(err);
      alert('Error initiating PDF download');
    }
  };

  // QUICK WHATSAPP SHARE
  const handleQuickWhatsApp = (quote: any) => {
    const client = quote.customer || quote.lead;
    const phone = client?.mobile || client?.phone || '';
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const message = `Hello ${client?.name || 'Customer'},\n\nHere is your Solar Proposal for ${quote.systemCapacity || 5} kWp Rooftop System (${quote.qNumber}).\nTotal: ₹${(quote.total || 0).toLocaleString()}\nEst. Annual Savings: ₹${(quote.annualSavings || 62000).toLocaleString()}.\n\nBest Regards,\nWhereReady Solar OS`;
    const url = `https://wa.me/${cleanPhone.startsWith('91') ? cleanPhone : '91' + cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
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

  const statusTabs = [
    { id: 'ALL', label: 'All Quotations' },
    { id: 'DRAFT', label: 'Draft' },
    { id: 'SENT', label: 'Sent' },
    { id: 'VIEWED', label: 'Viewed' },
    { id: 'NEGOTIATION', label: 'Negotiation' },
    { id: 'ACCEPTED', label: 'Accepted' },
    { id: 'REJECTED', label: 'Rejected' },
    { id: 'EXPIRED', label: 'Expired' }
  ];

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
            WhereReady Solar OS quotation engine for rooftop EPC vendors in Maharashtra. Configure systems, build pricing, and convert into projects.
          </p>
        </div>

        <button 
          onClick={() => setShowWizard(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
        >
          <Plus size={16} /> New Quotation
        </button>
      </div>

      {/* DASHBOARD METRICS CARDS (ACCORDING TO USER SPEC) */}
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
          <p className="text-3xl font-black text-[#071A2B]">₹{(metrics.totalQuotedValue / 100000).toFixed(1)}L</p>
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
              <div key={rem.id} className="p-3 bg-white rounded-2xl border border-amber-200 shadow-2xl flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-800">{rem.customerName} ({rem.qNumber})</p>
                  <p className="text-[11px] text-amber-700 mt-0.5">{rem.reason}</p>
                </div>
                <button
                  onClick={() => handleQuickWhatsApp({ customer: { name: rem.customerName }, qNumber: rem.qNumber, total: rem.total })}
                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1"
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
        
        {/* TOP CONTROLS: SEARCH & CUSTOMER PICKER */}
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
            className="w-full sm:w-64 px-4 py-2.5 rounded-2xl border border-slate-200 text-xs font-semibold bg-white outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">All Customers</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <button
            onClick={() => fetchData()}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition-colors"
          >
            Refresh
          </button>
        </div>

        {/* STATUS WORKFLOW TABS */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-t border-slate-100 pt-3">
          {statusTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedStatus(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedStatus === tab.id
                  ? 'bg-[#071A2B] text-white shadow-sm'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
              }`}
            >
              {tab.label}
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
                    <p className="text-xs text-slate-400 mt-1">Get started by creating your first rooftop proposal.</p>
                    <button
                      onClick={() => setShowWizard(true)}
                      className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors"
                    >
                      + Create Quotation
                    </button>
                  </td>
                </tr>
              ) : (
                quotations.map(quote => {
                  const client = quote.customer || quote.lead;
                  return (
                    <tr 
                      key={quote.id} 
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => setSelectedQuoteForDetail(quote)}
                    >
                      {/* QUOTE NO */}
                      <td className="px-6 py-4 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <FileText size={16} className="text-slate-400 group-hover:text-emerald-600 transition-colors" />
                          <span>{quote.qNumber}</span>
                          {quote.version > 1 && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded">
                              v{quote.version}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* CUSTOMER */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-[10px]">
                            {client?.name ? client.name.charAt(0).toUpperCase() : 'C'}
                          </div>
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
                          <button
                            title="Download A4 Proposal PDF"
                            onClick={() => handleDownloadPdf(quote)}
                            className="p-2 text-slate-400 hover:text-emerald-600 rounded-xl hover:bg-emerald-50 transition-colors"
                          >
                            <Download size={16} />
                          </button>
                          <button
                            title="Share on WhatsApp"
                            onClick={() => handleQuickWhatsApp(quote)}
                            className="p-2 text-slate-400 hover:text-emerald-600 rounded-xl hover:bg-emerald-50 transition-colors"
                          >
                            <MessageSquare size={16} />
                          </button>
                          <button
                            title="View Proposal Details"
                            onClick={() => setSelectedQuoteForDetail(quote)}
                            className="p-2 text-slate-400 hover:text-[#071A2B] rounded-xl hover:bg-slate-100 transition-colors"
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

      {/* 5-STEP GUIDED CREATION WIZARD */}
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
        preselectedLeadId={preselectedLeadId}
        preselectedCustomerId={preselectedCustomerId}
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
        onDownloadPdf={quote => handleDownloadPdf(quote)}
      />

      {/* HIDDEN PROPOSAL PDF CONTAINER (FOR CLIENT-SIDE MULTI-PAGE RENDER) */}
      {selectedQuoteForPdf && (
        <div style={{ position: 'absolute', top: 0, left: 0, opacity: 0, pointerEvents: 'none', zIndex: -50 }}>
          <div id="hidden-pdf-container">
            <QuotationPDF
              data={{
                quotation_number: selectedQuoteForPdf.qNumber || "QT-2026",
                quotation_date: new Date(selectedQuoteForPdf.date).toLocaleDateString(),
                valid_until: `${selectedQuoteForPdf.validityDays || 15} Days`,
                company_name: "Apex Solar Energy Solutions",
                company_logo: "",
                company_address: "Tech Centre, MIDC, Pune, Maharashtra 411019",
                company_phone: "+91 98220 12345",
                company_email: "contact@apexsolar.in",
                company_website: "www.apexsolar.in",
                customer_name: selectedQuoteForPdf.customer?.name || selectedQuoteForPdf.lead?.name || "Customer",
                customer_phone: selectedQuoteForPdf.customer?.mobile || selectedQuoteForPdf.lead?.mobile || "+91 98XXX XXXXX",
                customer_email: selectedQuoteForPdf.customer?.email || selectedQuoteForPdf.lead?.email || "customer@example.com",
                project_address: selectedQuoteForPdf.customer?.address || selectedQuoteForPdf.lead?.address || "Site Roof, Maharashtra",
                system_capacity: selectedQuoteForPdf.systemCapacity || 5,
                annual_generation: selectedQuoteForPdf.annualGeneration || Math.round((selectedQuoteForPdf.systemCapacity || 5) * 1460),
                system_type: selectedQuoteForPdf.systemType || "On-grid Rooftop PV",
                connection_type: selectedQuoteForPdf.connectionType || "Residential Net Metering",
                phase: selectedQuoteForPdf.phase || "Single Phase",
                roof_type: selectedQuoteForPdf.roofType || "RCC Flat Roof",
                installation_type: "Galvanized High Rise Structure",
                expected_timeline: "15 to 20 Working Days",
                panel_brand: selectedQuoteForPdf.panelBrand || "Waaree",
                panel_model: selectedQuoteForPdf.panelModel || "550Wp Mono PERC Bifacial",
                panel_wattage: selectedQuoteForPdf.panelWattage || 550,
                panel_quantity: selectedQuoteForPdf.panelQuantity || 9,
                panel_warranty: selectedQuoteForPdf.panelWarranty || "25 Years OEM Performance",
                inverter_brand: selectedQuoteForPdf.inverterBrand || "Growatt",
                inverter_model: selectedQuoteForPdf.inverterModel || "5kW On-Grid Inverter",
                inverter_capacity: selectedQuoteForPdf.inverterCapacity || selectedQuoteForPdf.systemCapacity || 5,
                inverter_quantity: selectedQuoteForPdf.inverterQuantity || 1,
                inverter_warranty: selectedQuoteForPdf.inverterWarranty || "10 Years Replacement",
                structure_brand: selectedQuoteForPdf.structureBrand || "Galvanized HDG High Rise",
                structure_warranty: selectedQuoteForPdf.structureWarranty || "10 Years Structural",
                components: [
                  { category: "Solar PV Modules", brand: selectedQuoteForPdf.panelBrand || "Waaree", model: "550Wp Bifacial", specification: "ALMM Approved Tier-1", quantity: selectedQuoteForPdf.panelQuantity || 9, warranty: "25 Yrs" },
                  { category: "Solar Inverter", brand: selectedQuoteForPdf.inverterBrand || "Growatt", model: "Grid-Tied IP65", specification: "Dual MPPT High Efficiency", quantity: 1, warranty: "10 Yrs" },
                  { category: "Mounting Structure", brand: selectedQuoteForPdf.structureBrand || "Galvanized HDG", model: "High Rise", specification: "80+ Micron Galvanized", quantity: "1 Set", warranty: "10 Yrs" },
                  { category: "Electrical Balance", brand: "Polycab / LAPP", model: "Solar DC 4sq.mm", specification: "ACDB/DCDB with Type-II SPD", quantity: "Complete", warranty: "5 Yrs" }
                ],
                scope_of_supply: selectedQuoteForPdf.scopeOfSupply || [
                  "Tier-1 Solar PV Modules with ALMM Approval",
                  "Grid-Tied String Inverter with Wi-Fi Remote Monitoring",
                  "Hot-Dip Galvanized Module Mounting Structure",
                  "AC Distribution Box & DC Distribution Box with SPDs",
                  "Dual Dedicated Chemical Earthing & Lightning Protection",
                  "MSEDCL Net Metering Liasoning, Inspection & Activation"
                ],
                pricing: [
                  { description: `${selectedQuoteForPdf.systemCapacity || 5} kWp Solar Power Plant Equipment`, qty: 1, unit_price: Math.round((selectedQuoteForPdf.subtotal || selectedQuoteForPdf.total) * 0.8), amount: Math.round((selectedQuoteForPdf.subtotal || selectedQuoteForPdf.total) * 0.8) },
                  { description: "Installation, Engineering, Liasoning & Commissioning", qty: 1, unit_price: Math.round((selectedQuoteForPdf.subtotal || selectedQuoteForPdf.total) * 0.2), amount: Math.round((selectedQuoteForPdf.subtotal || selectedQuoteForPdf.total) * 0.2) }
                ],
                subtotal: selectedQuoteForPdf.subtotal || selectedQuoteForPdf.total,
                discount: selectedQuoteForPdf.discount || 0,
                tax: selectedQuoteForPdf.tax || 0,
                other_charges: 0,
                grand_total: selectedQuoteForPdf.total,
                indicative_subsidy: selectedQuoteForPdf.indicativeSubsidy || 0,
                net_customer_cost: Math.max(0, (selectedQuoteForPdf.total || 0) - (selectedQuoteForPdf.indicativeSubsidy || 0)),
                amount_in_words: "Total project payable amount",
                current_monthly_bill: 8000,
                estimated_monthly_bill: 1200,
                annual_savings: selectedQuoteForPdf.annualSavings || 62050,
                monthly_savings: selectedQuoteForPdf.monthlySavings || 5170,
                payback_period: selectedQuoteForPdf.paybackYears || 4.4,
                lifetime_savings: (selectedQuoteForPdf.annualSavings || 62050) * 25,
                lifetime_generation: (selectedQuoteForPdf.annualGeneration || 7300) * 25 * 0.92,
                co2_reduction: Math.round((selectedQuoteForPdf.annualGeneration || 7300) * 0.82),
                treeEquivalent: Math.round(((selectedQuoteForPdf.annualGeneration || 7300) * 0.82) / 20),
                peak_month: "May",
                payment_terms: selectedQuoteForPdf.paymentMilestones || [
                  { percentage: 20, amount: Math.round(selectedQuoteForPdf.total * 0.2), description: "Advance along with work order confirmation" },
                  { percentage: 60, amount: Math.round(selectedQuoteForPdf.total * 0.6), description: "Upon delivery of panels, inverter & structure at site" },
                  { percentage: 15, amount: Math.round(selectedQuoteForPdf.total * 0.15), description: "Upon installation & testing completion" },
                  { percentage: 5, amount: Math.round(selectedQuoteForPdf.total * 0.05), description: "Upon MSEDCL Net Metering activation" }
                ],
                warranties: {
                  modules: "25 Years OEM Performance",
                  inverter: "10 Years Replacement Warranty",
                  structure: "10 Years Structural Integrity",
                  installation: "5 Years Workmanship Guarantee",
                  other: "OEM Standard Terms"
                },
                included_terms: [
                  "Complete installation and turnkey commissioning",
                  "Net metering application filing with MSEDCL",
                  "Site shadow assessment and engineering drawings"
                ],
                exclusions: [
                  "Statutory MSEDCL processing and meter testing fees",
                  "Major civil foundation or structural roof repairs",
                  "AC cabling exceeding standard 25 meters"
                ],
                terms_and_conditions: [
                  `Proposal valid for ${selectedQuoteForPdf.validityDays || 15} days from issue date.`,
                  "Central government subsidy is credited directly by MNRE/DISCOM to the consumer account upon approval.",
                  "Single/Three-phase power and roof access to be provided by the customer during execution."
                ],
                bankDetails: {
                  account_name: "Apex Solar Energy Solutions Pvt Ltd",
                  bank_name: "HDFC Bank Ltd",
                  account_number: "50200088991234",
                  ifsc: "HDFC0001234",
                  upi_id: "apexsolar@hdfcbank"
                }
              }}
            />
          </div>
        </div>
      )}

    </div>
  );
}
