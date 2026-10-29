"use client";
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Receipt, Plus, Search, Calendar, FileText, IndianRupee, ArrowUpRight, 
  Download, CheckCircle2, Clock, AlertCircle, X, CreditCard, ChevronRight,
  TrendingUp, ShieldCheck, Filter, MessageSquare, Share2, Printer, 
  Building2, Sparkles, Layers, Send, Eye, Check, AlertTriangle, ArrowRight
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function Finance() {
  const { showToast } = useToast();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal State - Generate Invoice
  const [showModal, setShowModal] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [tenant, setTenant] = useState<any>(null);
  const [generatingPdf, setGeneratingPdf] = useState<string | null>(null);

  // Form State - Milestone Invoice
  const [formData, setFormData] = useState({
    customerId: '',
    projectId: '',
    milestone: 'ADVANCE',
    milestoneTitle: 'Stage 1: Advance Booking & Work Order (20%)',
    systemPrice: 160000,
    percentage: 20,
    subtotal: 32000,
    taxRate: 13.8,
    taxAmount: 3888,
    amount: 32000,
    subsidyDeduction: 0,
    dueDate: new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10),
    status: 'UNPAID',
    notes: 'Payment terms: 100% advance against respective milestone delivery. Bank RTGS/NEFT/UPI accepted.'
  });

  // Modal State - Record Payment
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    mode: 'UPI',
    reference: '',
    notes: '',
    date: new Date().toISOString().slice(0, 10)
  });
  const [recordingPayment, setRecordingPayment] = useState(false);

  // Receipt Modal State
  const [receiptData, setReceiptData] = useState<any>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Notification Toast
  const [toast, setToast] = useState('');

  // Milestone Presets
  const MILESTONE_PRESETS = [
    { 
      key: 'ADVANCE', 
      pct: 20, 
      title: 'Stage 1: Advance Booking & Work Order (20%)',
      desc: 'Booking advance for engineering design, site layout and DISCOM net-meter filing',
      hsn: '9954'
    },
    { 
      key: 'MATERIAL_DELIVERY', 
      pct: 60, 
      title: 'Stage 2: PV Modules & Inverter Site Delivery (60%)',
      desc: 'Supply of Tier-1 DCR Solar Panels, Grid-Tied Inverter, HDG Structure & BOS',
      hsn: '8541'
    },
    { 
      key: 'INSTALLATION', 
      pct: 15, 
      title: 'Stage 3: Structure Erection & Electrical Testing (15%)',
      desc: 'Mounting of modules, inverter cabling, surge protection and earthing pit verification',
      hsn: '9954'
    },
    { 
      key: 'COMMISSIONING', 
      pct: 5, 
      title: 'Stage 4: DISCOM Net Metering & Grid Sync (5%)',
      desc: 'Final utility net meter synchronization, CEIG safety inspection and portal claim handover',
      hsn: '9954'
    },
    { 
      key: 'FULL_100', 
      pct: 100, 
      title: '100% Complete Solar Project Billing',
      desc: 'Full turnkey supply, installation, testing and commissioning contract',
      hsn: '8541'
    },
    { 
      key: 'CUSTOM', 
      pct: 0, 
      title: 'Custom Milestone / BOS Supply',
      desc: 'Custom billable milestone or specific equipment supply',
      hsn: '8541'
    }
  ];

  const fetchData = async () => {
    try {
      const [statsRes, finRes, custRes, projRes, tenantRes] = await Promise.all([
        axios.get(`${API_BASE}/api/tenant/finance/stats`, { withCredentials: true }).catch(() => null),
        axios.get(`${API_BASE}/api/tenant/finance`, { withCredentials: true }),
        axios.get(`${API_BASE}/api/tenant/customers`, { withCredentials: true }),
        axios.get(`${API_BASE}/api/tenant/projects`, { withCredentials: true }),
        axios.get(`${API_BASE}/api/tenant/settings`, { withCredentials: true }).catch(() => null)
      ]);

      if (statsRes?.data?.stats) setStats(statsRes.data.stats);
      setInvoices(finRes.data.finance || []);
      setCustomers(custRes.data.customers || []);
      setProjects(projRes.data.projects || []);
      if (tenantRes?.data?.tenant) setTenant(tenantRes.data.tenant);
    } catch (err) {
      console.error('Error loading finance data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Recalculate amount when milestone or system price changes
  const handleMilestoneChange = (presetKey: string) => {
    const preset = MILESTONE_PRESETS.find(p => p.key === presetKey);
    if (!preset) return;

    if (preset.key === 'CUSTOM') {
      setFormData(prev => ({
        ...prev,
        milestone: 'CUSTOM',
        milestoneTitle: 'Custom Milestone / Service',
        percentage: 0
      }));
      return;
    }

    const calculatedSubtotal = Math.round((formData.systemPrice * preset.pct) / 100);
    setFormData(prev => ({
      ...prev,
      milestone: preset.key,
      milestoneTitle: preset.title,
      percentage: preset.pct,
      subtotal: calculatedSubtotal,
      amount: calculatedSubtotal
    }));
  };

  const handleSystemPriceChange = (price: number) => {
    const calculatedSubtotal = formData.percentage > 0 
      ? Math.round((price * formData.percentage) / 100) 
      : formData.subtotal;
      
    setFormData(prev => ({
      ...prev,
      systemPrice: price,
      subtotal: calculatedSubtotal,
      amount: calculatedSubtotal
    }));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE}/api/tenant/finance`, {
        customerId: formData.customerId,
        projectId: formData.projectId || null,
        milestone: formData.milestone,
        milestoneTitle: formData.milestoneTitle,
        subtotal: Number(formData.subtotal),
        taxRate: Number(formData.taxRate),
        taxAmount: Number(formData.taxAmount),
        subsidyDeduction: Number(formData.subsidyDeduction),
        amount: Number(formData.amount),
        dueDate: formData.dueDate,
        notes: formData.notes
      }, { withCredentials: true });

      setShowModal(false);
      setToast('Milestone Tax Invoice generated successfully!');
      setTimeout(() => setToast(''), 4000);
      fetchData();
    } catch (err: any) {
      console.error(err);
      showToast({ type: 'error', message: err.response?.data?.error || 'Failed to generate tax invoice' });
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    setRecordingPayment(true);
    try {
      const res = await axios.post(`${API_BASE}/api/tenant/invoices/${selectedInvoice.id}/payments`, {
        amount: parseFloat(paymentForm.amount),
        mode: paymentForm.mode,
        reference: paymentForm.reference,
        notes: paymentForm.notes,
        date: paymentForm.date
      }, { withCredentials: true });

      setShowPaymentModal(false);
      setToast(`Payment of ₹${parseFloat(paymentForm.amount).toLocaleString('en-IN')} recorded! Receipt: ${res.data.receiptNumber}`);
      setTimeout(() => setToast(''), 5000);
      
      // Auto open receipt preview
      if (res.data.payment?.id) {
        openReceipt(selectedInvoice.id, res.data.payment.id);
      }
      
      fetchData();
    } catch (err: any) {
      console.error(err);
      showToast({ type: 'error', message: err.response?.data?.error || 'Failed to record payment' });
    } finally {
      setRecordingPayment(false);
    }
  };

  const openReceipt = async (invoiceId: string, paymentId: string) => {
    try {
      const res = await axios.get(`${API_BASE}/api/tenant/invoices/${invoiceId}/receipt/${paymentId}`, { withCredentials: true });
      if (res.data?.receipt) {
        setReceiptData(res.data.receipt);
        setShowReceiptModal(true);
      }
    } catch (err) {
      console.error('Failed to load receipt:', err);
    }
  };

  const handleWhatsAppShare = async (invoiceId: string) => {
    try {
      const res = await axios.get(`${API_BASE}/api/tenant/invoices/${invoiceId}/whatsapp-payload`, { withCredentials: true });
      if (res.data?.whatsappUrl) {
        window.open(res.data.whatsappUrl, '_blank');
      }
    } catch (err) {
      console.error('Failed to dispatch WhatsApp:', err);
      showToast({ type: 'error', message: 'Could not generate WhatsApp reminder.' });
    }
  };

  const generatePDF = async (invoice: any) => {
    setGeneratingPdf(invoice.id);
    try {
      const html2pdf: any = (await import('html2pdf.js')).default;
      const element = document.getElementById(`invoice-template-${invoice.id}`);
      if (!element) return;
      
      const opt: any = {
        margin: [0.3, 0.3, 0.3, 0.3],
        filename: `Invoice_${invoice.invoiceNumber || invoice.id}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
      };
      
      await html2pdf().set(opt).from(element).save();
    } catch (err: any) {
      console.error(err);
      showToast({ type: 'error', message: 'Failed to generate PDF: ' + (err.message || 'Unknown error') });
    }
    setGeneratingPdf(null);
  };

  const getStatusBadge = (inv: any) => {
    const status = inv.computedStatus || inv.status;
    switch(status) {
      case 'PAID':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1"><CheckCircle2 size={11} /> Paid</span>;
      case 'PARTIAL':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1"><Clock size={11} /> Partial</span>;
      case 'OVERDUE':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1 animate-pulse"><AlertTriangle size={11} /> Overdue</span>;
      case 'UNPAID':
      case 'PENDING':
      default:
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1"><Clock size={11} /> Unpaid</span>;
    }
  };

  // Metrics summary
  const totalInvoiced = stats?.totalInvoiced ?? invoices.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const totalCollected = stats?.totalCollected ?? invoices.reduce((acc, curr) => acc + (curr.totalPaid || 0), 0);
  const pendingAmount = stats?.outstanding ?? Math.max(0, totalInvoiced - totalCollected);
  const overdueAmount = stats?.overdueAmount ?? 0;
  const overdueCount = stats?.overdueCount ?? 0;
  const collectionRate = stats?.collectionRate ?? (totalInvoiced > 0 ? Math.round((totalCollected / totalInvoiced) * 100) : 0);
  const expectedSubsidies = stats?.expectedSubsidies ?? 234000;
  const effectiveGstCollected = stats?.effectiveGstCollected ?? Math.round(totalCollected - (totalCollected / 1.138));

  const filteredInvoices = invoices.filter(inv => {
    const currentStatus = inv.computedStatus || inv.status;
    const matchesStatus = 
      statusFilter === 'ALL' ? true :
      statusFilter === 'PAID' ? currentStatus === 'PAID' :
      statusFilter === 'PARTIAL' ? currentStatus === 'PARTIAL' :
      statusFilter === 'OVERDUE' ? inv.isOverdue || currentStatus === 'OVERDUE' :
      statusFilter === 'PENDING' ? ['UNPAID', 'PENDING'].includes(currentStatus) && !inv.isOverdue :
      currentStatus === statusFilter;

    const matchesSearch = 
      (inv.invoiceNumber && inv.invoiceNumber.toLowerCase().includes(search.toLowerCase())) ||
      (inv.customer?.name && inv.customer.name.toLowerCase().includes(search.toLowerCase())) ||
      (inv.customer?.mobile && inv.customer.mobile.toLowerCase().includes(search.toLowerCase())) ||
      (inv.project?.name && inv.project.name.toLowerCase().includes(search.toLowerCase())) ||
      (inv.milestoneTitle && inv.milestoneTitle.toLowerCase().includes(search.toLowerCase()));

    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 animate-in fade-in duration-300">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 flex items-center gap-1.5">
              <Sparkles size={12} className="text-emerald-600" /> Solar EPC Finance Suite
            </span>
            <span className="flex items-center gap-1 text-xs text-emerald-600 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Composite GST (13.8%)
            </span>
            <span className="text-xs text-blue-700 font-bold bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
              PM Surya Ghar DBT Ready
            </span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Finance & Billing</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage multi-stage milestone billing, track PM Surya Ghar DBT subsidies, generate GST tax invoices, and record payments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowModal(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-95"
          >
            <Plus size={18} /> Generate Milestone Invoice
          </button>
        </div>
      </div>

      {/* TOAST ALERT */}
      {toast && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-600" />
            <span className="text-sm font-semibold">{toast}</span>
          </div>
          <button onClick={() => setToast('')} className="text-emerald-600 hover:text-emerald-800">
            <X size={16} />
          </button>
        </div>
      )}

      {/* FINANCIAL KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Invoiced */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/80 flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Invoiced</p>
            <h3 className="text-2xl font-black text-slate-900">₹ {(totalInvoiced / 100000).toFixed(2)} L</h3>
            <p className="text-[11px] font-semibold text-slate-500 mt-1">{invoices.length} invoices generated</p>
          </div>
          <div className="w-12 h-12 bg-slate-100 text-slate-700 rounded-2xl flex items-center justify-center">
            <Receipt size={22} />
          </div>
        </div>

        {/* Realized Revenue */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/80 flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Collections Realized</p>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                {collectionRate}%
              </span>
            </div>
            <h3 className="text-2xl font-black text-emerald-700">₹ {(totalCollected / 100000).toFixed(2)} L</h3>
            <p className="text-[11px] font-semibold text-emerald-600 mt-1">₹ {(effectiveGstCollected / 1000).toFixed(1)}k GST realized</p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
            <IndianRupee size={22} />
          </div>
        </div>

        {/* Outstanding Receivables */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/80 flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Outstanding Receivables</p>
            <h3 className="text-2xl font-black text-amber-600">₹ {(pendingAmount / 100000).toFixed(2)} L</h3>
            <p className="text-[11px] font-semibold text-amber-600 mt-1">
              {overdueCount > 0 ? `${overdueCount} overdue` : 'Across active milestones'}
            </p>
          </div>
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
            <Clock size={22} />
          </div>
        </div>

        {/* PM Surya Ghar Subsidy Pipeline */}
        <div className="bg-gradient-to-br from-blue-900 to-indigo-950 rounded-3xl p-5 shadow-sm text-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-blue-200 text-xs font-bold uppercase tracking-wider mb-1">
              <Building2 size={13} /> PM Surya Ghar DBT
            </div>
            <h3 className="text-2xl font-black text-white">₹ {(expectedSubsidies / 100000).toFixed(2)} L</h3>
            <p className="text-[11px] text-blue-300 font-medium mt-1">Direct consumer subsidy credit</p>
          </div>
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-blue-300 backdrop-blur-sm">
            <ShieldCheck size={22} />
          </div>
        </div>

      </div>

      {/* OVERDUE ALERT BANNER (IF ANY) */}
      {overdueCount > 0 && (
        <div className="bg-rose-50 border border-rose-200/80 rounded-3xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-rose-900 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h4 className="text-sm font-bold">
                {overdueCount} Milestone Invoice{overdueCount > 1 ? 's' : ''} Past Due Date (Total: ₹{(overdueAmount / 100000).toFixed(2)} L)
              </h4>
              <p className="text-xs text-rose-700 mt-0.5">
                Send 1-click WhatsApp payment reminders or follow up with customers before equipment dispatch.
              </p>
            </div>
          </div>
          <button 
            onClick={() => setStatusFilter('OVERDUE')}
            className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 self-start sm:self-auto"
          >
            Review Overdue Invoices
          </button>
        </div>
      )}

      {/* FILTER TABS & SEARCH */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl overflow-x-auto max-w-full">
          {[
            { id: 'ALL', label: 'All Invoices' },
            { id: 'OVERDUE', label: `Overdue ${overdueCount > 0 ? `(${overdueCount})` : ''}`, isDanger: overdueCount > 0 },
            { id: 'PENDING', label: 'Unpaid' },
            { id: 'PARTIAL', label: 'Partially Paid' },
            { id: 'PAID', label: 'Fully Paid' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
                statusFilter === tab.id
                  ? tab.isDanger 
                    ? 'bg-rose-600 text-white shadow-sm' 
                    : 'bg-white text-slate-900 shadow-sm'
                  : tab.isDanger 
                    ? 'text-rose-600 hover:bg-rose-50' 
                    : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search invoice #, customer, phone, milestone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2 text-xs font-semibold focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
      </div>

      {/* INVOICES TABLE */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] font-extrabold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Invoice / Milestone</th>
                <th className="px-6 py-4">Customer Details</th>
                <th className="px-6 py-4">System & Project</th>
                <th className="px-6 py-4">Due Date</th>
                <th className="px-6 py-4">Billed Amount</th>
                <th className="px-6 py-4">Payment Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                  </td>
                </tr>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500 font-medium">
                    No invoices found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const totalPaid = inv.totalPaid ?? (inv.payments || []).reduce((s: number, p: any) => s + (p.amount || 0), 0);
                  const balance = inv.balance ?? Math.max(0, (inv.amount || 0) - totalPaid);
                  const isPaid = (inv.computedStatus || inv.status) === 'PAID';
                  const isOverdue = inv.isOverdue || (inv.dueDate && new Date(inv.dueDate) < new Date() && !isPaid);

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors group">
                      
                      {/* Invoice & Milestone */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 font-black text-slate-900">
                          <FileText size={16} className="text-emerald-600" /> 
                          {inv.invoiceNumber || inv.id}
                        </div>
                        <p className="text-xs text-slate-500 font-semibold mt-0.5 truncate max-w-[220px]">
                          {inv.milestoneTitle || inv.milestone || 'Solar EPC Milestone'}
                        </p>
                      </td>

                      {/* Customer Details */}
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900">{inv.customer?.name || 'Walk-in Customer'}</p>
                        <p className="text-xs text-slate-400 font-medium">
                          {inv.customer?.mobile || inv.customer?.phone || 'No phone'}
                        </p>
                      </td>

                      {/* System & Project */}
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-800 text-xs truncate max-w-[180px]">
                          {inv.project?.name || 'Rooftop Solar Kit'}
                        </p>
                        {inv.project?.capacity && (
                          <span className="inline-block mt-0.5 text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            {inv.project.capacity} {inv.project.capacityUnit || 'kWp'}
                          </span>
                        )}
                      </td>

                      {/* Due Date */}
                      <td className="px-6 py-4">
                        <div className={`flex items-center gap-1.5 text-xs font-semibold ${isOverdue ? 'text-rose-600 font-bold' : 'text-slate-600'}`}>
                          <Calendar size={13} className={isOverdue ? 'text-rose-500' : 'text-slate-400'} />
                          {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-IN') : 'Net 15 Days'}
                        </div>
                        {isOverdue && (
                          <span className="text-[10px] text-rose-500 font-bold block mt-0.5">Payment Overdue</span>
                        )}
                      </td>

                      {/* Total Amount & Balance */}
                      <td className="px-6 py-4">
                        <div className="font-black text-slate-900 text-sm">
                          ₹ {(inv.amount || 0).toLocaleString('en-IN')}
                        </div>
                        {totalPaid > 0 && !isPaid ? (
                          <div className="text-[11px] text-blue-600 font-semibold mt-0.5">
                            ₹ {totalPaid.toLocaleString('en-IN')} paid • <span className="text-amber-600 font-bold">₹ {balance.toLocaleString('en-IN')} due</span>
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-400 font-medium mt-0.5">
                            {isPaid ? 'Fully settled' : `Due: ₹ ${balance.toLocaleString('en-IN')}`}
                          </div>
                        )}
                      </td>

                      {/* Payment Status */}
                      <td className="px-6 py-4">
                        {getStatusBadge(inv)}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          
                          {/* Pay Button */}
                          {!isPaid && (
                            <button
                              onClick={() => {
                                setSelectedInvoice(inv);
                                setPaymentForm({
                                  amount: String(balance || inv.amount || ''),
                                  mode: 'UPI',
                                  reference: '',
                                  notes: `Payment for ${inv.milestoneTitle || inv.invoiceNumber}`,
                                  date: new Date().toISOString().slice(0, 10)
                                });
                                setShowPaymentModal(true);
                              }}
                              className="text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-xl font-bold text-xs inline-flex items-center gap-1 shadow-sm transition-all active:scale-95"
                            >
                              <CreditCard size={13} /> Record Pay
                            </button>
                          )}

                          {/* WhatsApp Reminder Button */}
                          <button
                            onClick={() => handleWhatsAppShare(inv.id)}
                            title="Send invoice & bank details on WhatsApp"
                            className="text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 px-2.5 py-1.5 rounded-xl transition-colors font-bold text-xs inline-flex items-center gap-1"
                          >
                            <MessageSquare size={13} className="text-emerald-600" /> WhatsApp
                          </button>

                          {/* View Receipt if has payments */}
                          {inv.payments && inv.payments.length > 0 && (
                            <button
                              onClick={() => openReceipt(inv.id, inv.payments[0].id)}
                              title="View Payment Receipt"
                              className="text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 px-2.5 py-1.5 rounded-xl transition-colors font-bold text-xs inline-flex items-center gap-1"
                            >
                              <Receipt size={13} /> Receipt
                            </button>
                          )}

                          {/* Export PDF */}
                          <button 
                            onClick={() => generatePDF(inv)}
                            disabled={generatingPdf === inv.id}
                            title="Export Tax Invoice PDF"
                            className="text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-xl transition-colors font-bold text-xs inline-flex items-center gap-1"
                          >
                            <Download size={13} /> 
                            {generatingPdf === inv.id ? 'PDF...' : 'PDF'}
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

      {/* MILESTONE INVOICE GENERATOR MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-black text-slate-900">Generate Milestone Tax Invoice</h3>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full uppercase">
                    GST Compliant
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Standard Indian Rooftop 4-Stage Milestones with DBT Subsidy Disclosure
                </p>
              </div>
              <button 
                onClick={() => setShowModal(false)} 
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            
            {/* Form */}
            <form onSubmit={handleCreate} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              
              {/* Customer & Project */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-extrabold text-slate-600 uppercase tracking-wider block mb-1">
                    Customer *
                  </label>
                  <select 
                    required 
                    value={formData.customerId} 
                    onChange={e => {
                      const cId = e.target.value;
                      const linkedProj = projects.find(p => p.customerId === cId);
                      setFormData(prev => ({
                        ...prev, 
                        customerId: cId,
                        projectId: linkedProj ? linkedProj.id : prev.projectId
                      }));
                    }} 
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all bg-white font-medium text-slate-700 text-xs"
                  >
                    <option value="">Select Customer</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.mobile || c.phone || 'No phone'})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-extrabold text-slate-600 uppercase tracking-wider block mb-1">
                    Associated Project
                  </label>
                  <select 
                    value={formData.projectId} 
                    onChange={e => {
                      const pId = e.target.value;
                      const proj = projects.find(p => p.id === pId);
                      setFormData(prev => ({
                        ...prev, 
                        projectId: pId,
                        customerId: proj?.customerId || prev.customerId,
                        systemPrice: proj?.estimatedValue || prev.systemPrice
                      }));
                      if (proj?.estimatedValue) {
                        handleSystemPriceChange(proj.estimatedValue);
                      }
                    }} 
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all bg-white font-medium text-slate-700 text-xs"
                  >
                    <option value="">Select Project (Optional)</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.capacity ? `(${p.capacity} ${p.capacityUnit || 'kWp'})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Milestone Preset Picker */}
              <div>
                <label className="text-xs font-extrabold text-slate-600 uppercase tracking-wider block mb-1">
                  Solar Milestone Deliverable
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {MILESTONE_PRESETS.map((preset) => (
                    <button
                      type="button"
                      key={preset.key}
                      onClick={() => handleMilestoneChange(preset.key)}
                      className={`p-3 rounded-2xl text-left border transition-all ${
                        formData.milestone === preset.key
                          ? 'bg-emerald-50/80 border-emerald-500 text-emerald-950 ring-1 ring-emerald-500'
                          : 'bg-slate-50/60 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black">{preset.title.split(':')[0]}</span>
                        {preset.pct > 0 && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-200/60 text-emerald-900">
                            {preset.pct}%
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] font-medium text-slate-500 mt-1 line-clamp-1">{preset.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Milestone Title if customized */}
              <div>
                <label className="text-xs font-extrabold text-slate-600 uppercase tracking-wider block mb-1">
                  Milestone Label / Description
                </label>
                <input 
                  type="text" 
                  value={formData.milestoneTitle} 
                  onChange={e => setFormData({ ...formData, milestoneTitle: e.target.value })} 
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-xs font-semibold text-slate-800"
                />
              </div>

              {/* Financial Calculation */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Project Price (₹)
                  </label>
                  <input 
                    type="number" 
                    value={formData.systemPrice} 
                    onChange={e => handleSystemPriceChange(Number(e.target.value))} 
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Taxable Base (₹)
                  </label>
                  <input 
                    type="number" 
                    value={formData.subtotal} 
                    onChange={e => {
                      const val = Number(e.target.value);
                      setFormData({ ...formData, subtotal: val, amount: val });
                    }} 
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    GST Split
                  </label>
                  <select 
                    value={formData.taxRate} 
                    onChange={e => setFormData({ ...formData, taxRate: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-white"
                  >
                    <option value={13.8}>13.8% (Solar Split)</option>
                    <option value={18}>18% (Standard GST)</option>
                    <option value={12}>12% (Goods Only)</option>
                    <option value={0}>0% (Exempt)</option>
                  </select>
                </div>

              </div>

              {/* Due Date & PM Surya Ghar Subsidy Toggle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-extrabold text-slate-600 uppercase tracking-wider block mb-1">
                    Invoice Due Date
                  </label>
                  <input 
                    type="date" 
                    value={formData.dueDate} 
                    onChange={e => setFormData({ ...formData, dueDate: e.target.value })} 
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-xs font-semibold text-slate-800"
                  />
                </div>

                <div>
                  <label className="text-xs font-extrabold text-slate-600 uppercase tracking-wider block mb-1">
                    PM Surya Ghar Subsidy Note
                  </label>
                  <select 
                    value={formData.subsidyDeduction} 
                    onChange={e => setFormData({ ...formData, subsidyDeduction: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-xs font-semibold text-slate-800 bg-white"
                  >
                    <option value={0}>Standard (Direct DBT to Customer)</option>
                    <option value={78000}>3kW+ Cap (₹78,000 DBT Credit Note)</option>
                    <option value={60000}>2kW Cap (₹60,000 DBT Credit Note)</option>
                    <option value={30000}>1kW Cap (₹30,000 DBT Credit Note)</option>
                  </select>
                </div>
              </div>

              {/* Total Invoice Value Card */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                    Total Invoice Payable:
                  </span>
                  <p className="text-[11px] text-emerald-600 font-medium">All applicable GST included</p>
                </div>
                <div className="text-2xl font-black text-emerald-800">
                  ₹ {formData.amount.toLocaleString('en-IN')}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="flex-1 py-2.5 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-xs transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md shadow-emerald-600/20 transition-all active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <Plus size={16} /> Issue Tax Invoice
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* RECORD PAYMENT MODAL */}
      {showPaymentModal && selectedInvoice && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-xl font-black text-slate-900">Record Payment</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Invoice {selectedInvoice.invoiceNumber || selectedInvoice.id} • Balance: ₹{(selectedInvoice.balance ?? selectedInvoice.amount ?? 0).toLocaleString('en-IN')}
                </p>
              </div>
              <button 
                onClick={() => setShowPaymentModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="p-6 space-y-4">
              
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-extrabold uppercase text-slate-500 tracking-wider">
                    Amount Received (₹) *
                  </label>
                  <button 
                    type="button"
                    onClick={() => setPaymentForm(prev => ({ ...prev, amount: String(selectedInvoice.balance ?? selectedInvoice.amount ?? '') }))}
                    className="text-[11px] font-bold text-emerald-600 hover:underline"
                  >
                    Pay Full Balance
                  </button>
                </div>
                <input
                  type="number"
                  required
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-extrabold uppercase text-slate-500 tracking-wider mb-1 block">
                    Payment Mode
                  </label>
                  <select
                    value={paymentForm.mode}
                    onChange={(e) => setPaymentForm({ ...paymentForm, mode: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:bg-white"
                  >
                    <option value="UPI">UPI / QR Code</option>
                    <option value="BANK_TRANSFER">NEFT / RTGS</option>
                    <option value="CHEQUE">Cheque</option>
                    <option value="CASH">Cash</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-extrabold uppercase text-slate-500 tracking-wider mb-1 block">
                    Payment Date
                  </label>
                  <input
                    type="date"
                    value={paymentForm.date}
                    onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-extrabold uppercase text-slate-500 tracking-wider mb-1 block">
                  Transaction / UTR Reference No
                </label>
                <input
                  type="text"
                  placeholder="e.g. UTR-90812345 or Cheque #4021"
                  value={paymentForm.reference}
                  onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-extrabold uppercase text-slate-500 tracking-wider mb-1 block">
                  Remarks / Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Advance received via PhonePe"
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={recordingPayment}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all active:scale-95 disabled:opacity-50"
                >
                  <CreditCard size={14} />
                  {recordingPayment ? 'Recording...' : 'Record Payment & Receipt'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* PAYMENT RECEIPT MODAL */}
      {showReceiptModal && receiptData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-emerald-50/50">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Official Payment Receipt</h3>
                  <p className="text-xs text-slate-500 font-semibold">{receiptData.receiptNumber}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowReceiptModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-500 font-bold uppercase">Customer:</span>
                <span className="font-black text-slate-900 text-sm">{receiptData.customer?.name}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-500 font-bold uppercase">Invoice No:</span>
                <span className="font-bold text-slate-800">{receiptData.invoiceNumber}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-500 font-bold uppercase">Milestone Deliverable:</span>
                <span className="font-semibold text-slate-700">{receiptData.milestone}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-500 font-bold uppercase">Amount Received:</span>
                <span className="font-black text-emerald-700 text-base">₹ {receiptData.amountPaid.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-500 font-bold uppercase">Mode & Reference:</span>
                <span className="font-bold text-slate-800">{receiptData.mode} {receiptData.reference ? `(${receiptData.reference})` : ''}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-500 font-bold uppercase">Remaining Invoice Balance:</span>
                <span className="font-bold text-amber-600">₹ {receiptData.balanceRemaining.toLocaleString('en-IN')}</span>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Printer size={15} /> Print Receipt
                </button>
                <button
                  type="button"
                  onClick={() => setShowReceiptModal(false)}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HIDDEN INVOICE TEMPLATES FOR HIGH RESOLUTION PDF EXPORT */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        {invoices.map(inv => {
          const totalPaid = inv.totalPaid ?? (inv.payments || []).reduce((s: number, p: any) => s + (p.amount || 0), 0);
          const balance = inv.balance ?? Math.max(0, (inv.amount || 0) - totalPaid);
          const taxableBase = inv.subtotal || Math.round((inv.amount || 0) / 1.138);
          const effectiveGst = Math.round((inv.amount || 0) - taxableBase);
          const cgst = Math.round(effectiveGst / 2);
          const sgst = effectiveGst - cgst;

          return (
            <div key={`template-${inv.id}`} id={`invoice-template-${inv.id}`} className="p-12 w-[820px]" style={{ fontFamily: 'Inter, sans-serif', backgroundColor: '#ffffff', color: '#0f172a' }}>
              
              {/* Header */}
              <div className="flex justify-between items-start pb-8 border-b-2" style={{ borderColor: '#0f172a' }}>
                <div>
                  {tenant?.logoUrl ? (
                    <img src={tenant.logoUrl} alt="Logo" className="h-16 object-contain mb-4" crossOrigin="anonymous" />
                  ) : (
                    <h1 className="text-3xl font-black mb-1" style={{ color: '#059669' }}>{tenant?.name || 'Solar Energy EPC'}</h1>
                  )}
                  <p className="text-xs max-w-xs text-slate-500 font-medium">{tenant?.address || 'Solar Engineering Headquarters'}</p>
                  <p className="text-xs text-slate-500 font-medium">{tenant?.city}, {tenant?.state} {tenant?.pincode}</p>
                  {tenant?.gstin && <p className="text-xs font-bold text-slate-700 mt-1">GSTIN: {tenant.gstin}</p>}
                  <p className="text-xs text-slate-500">Contact: {tenant?.phone} • {tenant?.email}</p>
                </div>

                <div className="text-right">
                  <h2 className="text-3xl font-black uppercase tracking-widest text-slate-900 mb-2">TAX INVOICE</h2>
                  <p className="text-xs font-bold text-slate-800">Invoice No: <span className="font-normal text-slate-600">{inv.invoiceNumber || inv.id}</span></p>
                  <p className="text-xs font-bold text-slate-800 mt-1">Date: <span className="font-normal text-slate-600">{new Date(inv.date || inv.createdAt).toLocaleDateString('en-IN')}</span></p>
                  <p className="text-xs font-bold text-slate-800 mt-1">Due Date: <span className="font-normal text-slate-600">{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-IN') : 'Net 15 Days'}</span></p>
                  <p className="text-xs font-bold text-slate-800 mt-1">Status: <span className="font-extrabold uppercase" style={{ color: inv.status === 'PAID' ? '#059669' : '#d97706' }}>{inv.status}</span></p>
                </div>
              </div>

              {/* Billed To & Installation Address */}
              <div className="grid grid-cols-2 gap-8 my-8 pb-6 border-b border-slate-100">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">BILLED TO (CONSUMER):</p>
                  <h3 className="text-base font-bold text-slate-900">{inv.customer?.name}</h3>
                  <p className="text-xs text-slate-600 mt-0.5">{inv.customer?.mobile || inv.customer?.phone}</p>
                  <p className="text-xs text-slate-600">{inv.customer?.email}</p>
                  <p className="text-xs text-slate-600 mt-1">{inv.customer?.address || 'Site Address as per contract'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">PROJECT & SYSTEM DETAILS:</p>
                  <h3 className="text-base font-bold text-emerald-800">{inv.project?.name || 'Rooftop Solar EPC Project'}</h3>
                  {inv.project?.capacity && (
                    <p className="text-xs font-bold text-slate-700 mt-0.5">Capacity: {inv.project.capacity} {inv.project.capacityUnit || 'kWp'} On-Grid</p>
                  )}
                  <p className="text-xs text-slate-600">Milestone: {inv.milestoneTitle || 'Solar Deliverable Milestone'}</p>
                  <p className="text-[11px] text-blue-700 font-semibold mt-1">PM Surya Ghar DBT Subsidy Eligible</p>
                </div>
              </div>

              {/* Line Items Table */}
              <table className="w-full text-left mb-8 border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-900 text-[11px] font-black uppercase tracking-wider text-slate-800">
                    <th className="py-2.5">Item & Scope Description</th>
                    <th className="py-2.5 text-center">HSN/SAC</th>
                    <th className="py-2.5 text-center">Qty</th>
                    <th className="py-2.5 text-right">Taxable Amt</th>
                    <th className="py-2.5 text-right">GST %</th>
                    <th className="py-2.5 text-right">Total (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs">
                  <tr>
                    <td className="py-3 pr-2">
                      <p className="font-bold text-slate-900">{inv.milestoneTitle || 'Solar Power Generation Plant Installation & Supply'}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Supply of Mono PERC DCR PV Modules, Grid Inverter, Mounting Hardware & Commissioning Services.
                      </p>
                    </td>
                    <td className="py-3 text-center text-slate-600 font-semibold">{inv.milestone === 'MATERIAL_DELIVERY' ? '8541' : '9954'}</td>
                    <td className="py-3 text-center text-slate-800 font-bold">1 Set</td>
                    <td className="py-3 text-right font-bold text-slate-800">₹ {taxableBase.toLocaleString('en-IN')}</td>
                    <td className="py-3 text-right font-bold text-slate-800">13.8%</td>
                    <td className="py-3 text-right font-black text-slate-900">₹ {(inv.amount || 0).toLocaleString('en-IN')}</td>
                  </tr>
                </tbody>
              </table>

              {/* Tax Breakdown & Totals */}
              <div className="flex justify-between items-start pt-4 border-t border-slate-200 mb-8">
                <div className="max-w-xs text-xs space-y-2">
                  <p className="font-bold text-slate-800">Bank Transfer Details:</p>
                  <p className="text-slate-600">Bank Name: HDFC Bank</p>
                  <p className="text-slate-600">Account: Solar EPC Solutions Current A/c</p>
                  <p className="text-slate-600">IFSC Code: HDFC0001234</p>
                  <p className="text-slate-600 font-semibold">UPI ID: solar.epc@upi</p>
                  <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 mt-3">
                    <p className="text-[11px] font-bold text-blue-900">PM Surya Ghar DBT Note:</p>
                    <p className="text-[10px] text-blue-800 mt-0.5">
                      Central Govt subsidy of ₹78,000 will be credited directly to consumer Aadhaar-seeded bank account upon DISCOM net meter installation and CEIG inspection.
                    </p>
                  </div>
                </div>

                <div className="w-72 space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Taxable Subtotal</span>
                    <span className="font-bold text-slate-800">₹ {taxableBase.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">CGST (6.9%)</span>
                    <span className="font-bold text-slate-800">₹ {cgst.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">SGST (6.9%)</span>
                    <span className="font-bold text-slate-800">₹ {sgst.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b-2 border-slate-900">
                    <span className="font-black text-slate-900 text-sm">Total Invoice Value</span>
                    <span className="font-black text-slate-900 text-base">₹ {(inv.amount || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-emerald-700 font-bold">Amount Paid to Date</span>
                    <span className="font-bold text-emerald-700">₹ {totalPaid.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between py-1 font-black">
                    <span className="text-amber-700">Balance Outstanding</span>
                    <span className="text-amber-700">₹ {balance.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Signatures & Footer */}
              <div className="pt-8 border-t flex justify-between items-end" style={{ borderColor: '#e2e8f0' }}>
                <div>
                  <p className="text-[11px] text-slate-400">Thank you for powering the future with clean solar energy!</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">This is a computer generated tax invoice.</p>
                </div>
                <div className="text-center">
                  {tenant?.signatureUrl ? (
                    <img src={tenant.signatureUrl} alt="Signature" className="h-14 mx-auto mb-1 object-contain" crossOrigin="anonymous" />
                  ) : (
                    <div className="h-12 w-28 mx-auto border-b-2 mb-1" style={{ borderColor: '#94a3b8' }}></div>
                  )}
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-900">Authorized Signatory</p>
                  <p className="text-[11px] text-slate-500">{tenant?.name}</p>
                </div>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
