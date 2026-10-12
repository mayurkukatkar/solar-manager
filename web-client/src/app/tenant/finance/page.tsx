"use client";
import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Receipt, Plus, Search, Calendar, FileText, IndianRupee, ArrowUpRight, 
  Download, CheckCircle2, Clock, AlertCircle, X, CreditCard, ChevronRight,
  TrendingUp, ShieldCheck, Filter
} from 'lucide-react';

export default function Finance() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal State - Generate Invoice
  const [showModal, setShowModal] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [tenant, setTenant] = useState<any>(null);
  const [generatingPdf, setGeneratingPdf] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    customerId: '', projectId: '', amount: 0, status: 'PENDING'
  });

  // Modal State - Record Payment
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: '', mode: 'UPI', reference: '', date: new Date().toISOString().slice(0, 10)
  });
  const [recordingPayment, setRecordingPayment] = useState(false);
  const [toast, setToast] = useState('');

  const fetchData = async () => {
    try {
      const [finRes, custRes, projRes, tenantRes] = await Promise.all([
        axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/finance`, { withCredentials: true }),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/customers`, { withCredentials: true }),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/projects`, { withCredentials: true }),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/settings`, { withCredentials: true })
      ]);
      setInvoices(finRes.data.finance || []);
      setCustomers(custRes.data.customers || []);
      setProjects(projRes.data.projects || []);
      setTenant(tenantRes.data.tenant || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/finance`, {
        ...formData, 
        amount: Number(formData.amount)
      }, { withCredentials: true });
      setShowModal(false);
      setToast('Invoice generated successfully!');
      setTimeout(() => setToast(''), 3500);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to generate invoice');
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    setRecordingPayment(true);
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/invoices/${selectedInvoice.id}/payments`, {
        amount: parseFloat(paymentForm.amount),
        mode: paymentForm.mode,
        reference: paymentForm.reference,
        date: paymentForm.date
      }, { withCredentials: true });
      setShowPaymentModal(false);
      setToast(`Payment of ₹${paymentForm.amount} recorded for Invoice ${selectedInvoice.invoiceNumber || selectedInvoice.id}!`);
      setTimeout(() => setToast(''), 4000);
      fetchData();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to record payment');
    } finally {
      setRecordingPayment(false);
    }
  };

  const generatePDF = async (invoice: any) => {
    setGeneratingPdf(invoice.id);
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const element = document.getElementById(`invoice-template-${invoice.id}`);
      
      const opt = {
        margin: 0.5,
        filename: `Invoice_${invoice.invoiceNumber || invoice.id}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
      };
      
      await html2pdf().set(opt).from(element).save();
    } catch (err: any) {
      console.error(err);
      alert('Failed to generate PDF: ' + (err.message || 'Unknown error'));
    }
    setGeneratingPdf(null);
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'PENDING':
      case 'UNPAID': return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'PARTIAL': return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'PAID': return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'OVERDUE': return 'bg-red-50 text-red-700 border border-red-200';
      default: return 'bg-slate-50 text-slate-700 border border-slate-200';
    }
  };

  // Metrics
  const totalInvoiced = invoices.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const totalRevenue = invoices.filter(i => i.status === 'PAID').reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const pendingAmount = invoices.filter(i => i.status !== 'PAID').reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const gstCollected = Math.round(totalRevenue * 0.18);

  const filteredInvoices = invoices.filter(inv => {
    const matchesStatus = 
      statusFilter === 'ALL' ? true :
      statusFilter === 'PAID' ? inv.status === 'PAID' :
      statusFilter === 'PENDING' ? (inv.status === 'PENDING' || inv.status === 'UNPAID') :
      statusFilter === 'PARTIAL' ? inv.status === 'PARTIAL' :
      inv.status === statusFilter;

    const matchesSearch = 
      (inv.invoiceNumber && inv.invoiceNumber.toLowerCase().includes(search.toLowerCase())) ||
      (inv.customer?.name && inv.customer.name.toLowerCase().includes(search.toLowerCase())) ||
      (inv.project?.name && inv.project.name.toLowerCase().includes(search.toLowerCase()));

    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
              Tax & Invoicing Desk
            </span>
            <span className="flex items-center gap-1 text-xs text-emerald-600 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              GST Compliant (18%)
            </span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Finance & Billing</h1>
          <p className="text-sm text-slate-500 mt-1">
            Generate milestone tax invoices, record customer payments, track GST collections, and export PDFs.
          </p>
        </div>

        <button 
          onClick={() => setShowModal(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-95"
        >
          <Plus size={18} /> Generate Tax Invoice
        </button>
      </div>

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

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/80 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Invoiced</p>
            <h3 className="text-2xl font-black text-slate-900">₹ {(totalInvoiced / 100000).toFixed(2)} L</h3>
            <p className="text-[11px] font-semibold text-slate-500 mt-1">{invoices.length} invoices generated</p>
          </div>
          <div className="w-12 h-12 bg-slate-100 text-slate-700 rounded-2xl flex items-center justify-center">
            <Receipt size={22} />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/80 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Collections Realized</p>
            <h3 className="text-2xl font-black text-emerald-700">₹ {(totalRevenue / 100000).toFixed(2)} L</h3>
            <p className="text-[11px] font-semibold text-emerald-600 mt-1">Paid in full</p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
            <IndianRupee size={22} />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/80 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Outstanding Receivables</p>
            <h3 className="text-2xl font-black text-amber-600">₹ {(pendingAmount / 100000).toFixed(2)} L</h3>
            <p className="text-[11px] font-semibold text-amber-600 mt-1">Pending collection</p>
          </div>
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
            <Clock size={22} />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/80 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">GST Collected (18%)</p>
            <h3 className="text-2xl font-black text-blue-700">₹ {(gstCollected / 1000).toFixed(1)}k</h3>
            <p className="text-[11px] font-semibold text-blue-600 mt-1">CGST 9% + SGST 9%</p>
          </div>
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
            <ShieldCheck size={22} />
          </div>
        </div>
      </div>

      {/* FILTER TABS & SEARCH */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl">
          {[
            { id: 'ALL', label: 'All Invoices' },
            { id: 'PAID', label: 'Paid' },
            { id: 'PARTIAL', label: 'Partial' },
            { id: 'PENDING', label: 'Pending' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all ${
                statusFilter === tab.id
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search invoice #, customer, project..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs font-semibold focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
      </div>

      {/* INVOICES TABLE */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] font-extrabold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Invoice No</th>
                <th className="px-6 py-4">Customer Details</th>
                <th className="px-6 py-4">Associated Project</th>
                <th className="px-6 py-4">Issue Date</th>
                <th className="px-6 py-4">Total Amount</th>
                <th className="px-6 py-4">Status</th>
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
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 font-bold text-slate-900">
                        <FileText size={16} className="text-slate-400" /> {inv.invoiceNumber || inv.id}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800">{inv.customer?.name || 'Walk-in Customer'}</p>
                      <p className="text-xs text-slate-400">{inv.customer?.phone || inv.customer?.mobile || 'No Phone'}</p>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-700 text-xs">
                      {inv.project?.name || 'Standard Rooftop Kit'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-slate-600 font-medium text-xs">
                        <Calendar size={13} className="text-slate-400" /> {new Date(inv.date || inv.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-black text-slate-900">
                      ₹ {(inv.amount || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${getStatusColor(inv.status)}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {inv.status !== 'PAID' && (
                          <button
                            onClick={() => {
                              setSelectedInvoice(inv);
                              setPaymentForm({
                                amount: String(inv.amount || ''),
                                mode: 'UPI',
                                reference: '',
                                date: new Date().toISOString().slice(0, 10)
                              });
                              setShowPaymentModal(true);
                            }}
                            className="text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl transition-colors font-bold text-xs inline-flex items-center gap-1"
                          >
                            <CreditCard size={13} /> Pay
                          </button>
                        )}
                        <button 
                          onClick={() => generatePDF(inv)}
                          disabled={generatingPdf === inv.id}
                          className="text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition-colors font-bold text-xs inline-flex items-center gap-1"
                        >
                          <Download size={13} /> 
                          {generatingPdf === inv.id ? 'Exporting...' : 'PDF'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RECORD PAYMENT MODAL */}
      {showPaymentModal && selectedInvoice && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-xl font-black text-slate-900">Record Payment</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Invoice {selectedInvoice.invoiceNumber || selectedInvoice.id} • Total: ₹{(selectedInvoice.amount || 0).toLocaleString()}
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
                <label className="text-xs font-extrabold uppercase text-slate-500 tracking-wider mb-1 block">
                  Amount Received (₹) *
                </label>
                <input
                  type="number"
                  required
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
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
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
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
                  {recordingPayment ? 'Recording...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NEW INVOICE MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-xl font-black text-slate-900">Generate Invoice</h3>
                <p className="text-xs text-slate-500 mt-0.5">Bill rooftop project milestones & installation kits</p>
              </div>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors">
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-extrabold text-slate-600 uppercase tracking-wider block mb-1">Customer *</label>
                <select required value={formData.customerId} onChange={e => setFormData({...formData, customerId: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all bg-white font-medium text-slate-700 text-xs">
                  <option value="">Select a Customer</option>
                  {customers.map(c => (
                     <option key={c.id} value={c.id}>{c.name} ({c.phone || c.mobile || 'No contact'})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-600 uppercase tracking-wider block mb-1">Project (Optional)</label>
                <select value={formData.projectId} onChange={e => setFormData({...formData, projectId: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all bg-white font-medium text-slate-700 text-xs">
                  <option value="">Select a Project</option>
                  {projects.filter(p => !formData.customerId || p.customerId === formData.customerId).map(p => (
                     <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-extrabold text-slate-600 uppercase tracking-wider block mb-1">Amount (₹)</label>
                  <input type="number" required value={formData.amount} onChange={e => setFormData({...formData, amount: Number(e.target.value)})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium text-slate-700 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-extrabold text-slate-600 uppercase tracking-wider block mb-1">Initial Status</label>
                  <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all bg-white font-medium text-slate-700 text-xs">
                    <option value="PENDING">Pending</option>
                    <option value="PAID">Paid</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-xs transition-colors">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md transition-colors">
                  Generate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* HIDDEN INVOICE TEMPLATES FOR PDF GENERATION */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        {invoices.map(inv => (
          <div key={`template-${inv.id}`} id={`invoice-template-${inv.id}`} className="p-10 w-[800px]" style={{ fontFamily: 'sans-serif', backgroundColor: '#ffffff', color: '#1e293b' }}>
            
            {/* Header */}
            <div className="flex justify-between items-start mb-10 pb-8 border-b" style={{ borderColor: '#e2e8f0' }}>
              <div>
                {tenant?.logoUrl ? (
                  <img src={tenant.logoUrl} alt="Logo" className="h-16 object-contain mb-4" crossOrigin="anonymous" />
                ) : (
                  <h1 className="text-3xl font-black mb-2" style={{ color: '#0f172a' }}>{tenant?.name || 'Solar ERP'}</h1>
                )}
                <p className="text-sm max-w-xs" style={{ color: '#64748b' }}>{tenant?.address || 'Solar Engineering Headquarters'}</p>
                <p className="text-sm" style={{ color: '#64748b' }}>{tenant?.city}, {tenant?.state} {tenant?.pincode}</p>
                {tenant?.gstin && <p className="text-sm font-semibold mt-2" style={{ color: '#475569' }}>GSTIN: {tenant.gstin}</p>}
              </div>
              <div className="text-right">
                <h2 className="text-4xl font-black uppercase tracking-widest mb-4" style={{ color: '#e2e8f0' }}>INVOICE</h2>
                <p className="text-sm font-bold" style={{ color: '#1e293b' }}>Invoice No: <span className="font-normal" style={{ color: '#64748b' }}>{inv.invoiceNumber || inv.id}</span></p>
                <p className="text-sm font-bold mt-1" style={{ color: '#1e293b' }}>Date: <span className="font-normal" style={{ color: '#64748b' }}>{new Date(inv.date || inv.createdAt).toLocaleDateString()}</span></p>
                <p className="text-sm font-bold mt-1" style={{ color: '#1e293b' }}>Status: <span className="uppercase" style={{ color: inv.status === 'PAID' ? '#059669' : '#d97706' }}>{inv.status}</span></p>
              </div>
            </div>

            {/* Bill To */}
            <div className="mb-10">
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#94a3b8' }}>Billed To:</p>
              <h3 className="text-lg font-bold" style={{ color: '#1e293b' }}>{inv.customer?.name}</h3>
              <p className="text-sm" style={{ color: '#475569' }}>{inv.customer?.email}</p>
              <p className="text-sm" style={{ color: '#475569' }}>{inv.customer?.mobile || inv.customer?.phone}</p>
              {inv.project && <p className="text-sm font-semibold mt-2" style={{ color: '#059669' }}>Project: {inv.project.name}</p>}
            </div>

            {/* Line Items */}
            <table className="w-full text-left mb-10 border-collapse">
              <thead>
                <tr className="border-b-2" style={{ borderColor: '#1e293b' }}>
                  <th className="py-3 font-bold text-sm" style={{ color: '#1e293b' }}>Description</th>
                  <th className="py-3 font-bold text-sm text-right" style={{ color: '#1e293b' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b" style={{ borderColor: '#e2e8f0' }}>
                  <td className="py-4 text-sm" style={{ color: '#334155' }}>{inv.project ? `Payment for Project: ${inv.project.name}` : 'Solar Rooftop Installation Services & Material Kit'}</td>
                  <td className="py-4 text-sm font-bold text-right" style={{ color: '#0f172a' }}>₹ {(inv.amount || 0).toLocaleString()}</td>
                </tr>
              </tbody>
            </table>

            {/* Totals */}
            <div className="flex justify-end mb-16">
              <div className="w-64">
                <div className="flex justify-between py-2 border-b" style={{ borderColor: '#e2e8f0' }}>
                  <span className="text-sm" style={{ color: '#64748b' }}>Subtotal</span>
                  <span className="text-sm font-bold" style={{ color: '#1e293b' }}>₹ {(inv.amount || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-3">
                  <span className="text-base font-bold" style={{ color: '#0f172a' }}>Total Due</span>
                  <span className="text-base font-black" style={{ color: '#059669' }}>₹ {(inv.amount || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Footer / Signature */}
            <div className="mt-20 pt-8 border-t flex justify-between items-end" style={{ borderColor: '#e2e8f0' }}>
              <div>
                <p className="text-xs font-medium" style={{ color: '#94a3b8' }}>Thank you for choosing renewable solar energy!</p>
                <p className="text-xs font-medium mt-1" style={{ color: '#94a3b8' }}>{tenant?.email} • {tenant?.phone}</p>
              </div>
              <div className="text-center">
                {tenant?.signatureUrl ? (
                  <img src={tenant.signatureUrl} alt="Signature" className="h-16 mx-auto mb-2 object-contain" crossOrigin="anonymous" />
                ) : (
                  <div className="h-16 w-32 mx-auto border-b-2 mb-2" style={{ borderColor: '#e2e8f0' }}></div>
                )}
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#1e293b' }}>Authorized Signatory</p>
                <p className="text-xs mt-1" style={{ color: '#64748b' }}>{tenant?.name}</p>
              </div>
            </div>
            
          </div>
        ))}
      </div>
    </div>
  );
}
