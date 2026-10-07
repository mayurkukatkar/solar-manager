"use client";
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Receipt, Plus, Search, Calendar, FileText, IndianRupee, ArrowUpRight, Download } from 'lucide-react';

export default function Finance() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [tenant, setTenant] = useState<any>(null);
  const [generatingPdf, setGeneratingPdf] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    customerId: '', projectId: '', amount: 0, status: 'PENDING'
  });

  const fetchData = async () => {
    try {
      const [finRes, custRes, projRes, tenantRes] = await Promise.all([
        axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/finance`, { withCredentials: true }),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/customers`, { withCredentials: true }),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/projects`, { withCredentials: true }),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/settings`, { withCredentials: true })
      ]);
      setInvoices(finRes.data.finance);
      setCustomers(custRes.data.customers);
      setProjects(projRes.data.projects);
      setTenant(tenantRes.data.tenant);
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
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to generate invoice');
    }
  };

  const generatePDF = async (invoice: any) => {
    setGeneratingPdf(invoice.id);
    try {
      // Dynamic import to avoid SSR issues
      const html2pdf = (await import('html2pdf.js')).default;
      const element = document.getElementById(`invoice-template-${invoice.id}`);
      
      const opt = {
        margin: 0.5,
        filename: `Invoice_${invoice.id}.pdf`,
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
      case 'PENDING': return 'bg-amber-50 text-amber-700';
      case 'PAID': return 'bg-emerald-50 text-emerald-700';
      case 'OVERDUE': return 'bg-red-50 text-red-700';
      default: return 'bg-slate-50 text-slate-700';
    }
  };

  const totalRevenue = invoices.filter(i => i.status === 'PAID').reduce((acc, curr) => acc + curr.amount, 0);
  const pendingAmount = invoices.filter(i => i.status === 'PENDING').reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Finance & Billing</h1>
          <p className="text-sm text-slate-500 mt-1">Manage project invoices and track customer payments.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-full font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-sm"
        >
          <Plus size={18} /> Generate Invoice
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
              <IndianRupee size={28} />
            </div>
            <div>
              <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Total Revenue</p>
              <p className="text-2xl font-black text-slate-800">₹ {(totalRevenue / 100000).toFixed(2)} L</p>
            </div>
         </div>
         <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
              <Receipt size={28} />
            </div>
            <div>
              <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Pending Payments</p>
              <p className="text-2xl font-black text-slate-800">₹ {(pendingAmount / 100000).toFixed(2)} L</p>
            </div>
         </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex gap-4 bg-slate-50/50">
           <div className="relative flex-1 max-w-md">
             <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
             <input type="text" placeholder="Search invoices..." className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-emerald-500 transition-colors" />
           </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-xs font-bold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Invoice No</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Project</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 font-medium">
                    No invoices generated yet.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 font-bold text-slate-900">
                        <FileText size={16} className="text-slate-400" /> {inv.invoiceNumber || inv.id}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-700">
                      {inv.customer?.name || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-600">
                      {inv.project?.name || 'No Project'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                        <Calendar size={14} className="text-slate-400" /> {new Date(inv.date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900 flex items-center gap-1">
                      <IndianRupee size={14} className="text-slate-500" /> {inv.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${getStatusColor(inv.status)}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => generatePDF(inv)}
                        disabled={generatingPdf === inv.id}
                        className="text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 p-2 rounded-lg transition-colors inline-flex items-center gap-1 text-xs font-bold"
                      >
                        <Download size={14} /> 
                        {generatingPdf === inv.id ? 'Wait...' : 'PDF'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* NEW INVOICE MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Generate Invoice</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700 p-2">✕</button>
            </div>
            
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-extrabold text-slate-600 uppercase tracking-wider">Customer *</label>
                <select required value={formData.customerId} onChange={e => setFormData({...formData, customerId: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all bg-white font-medium text-slate-700">
                  <option value="">Select a Customer</option>
                  {customers.map(c => (
                     <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-extrabold text-slate-600 uppercase tracking-wider">Project (Optional)</label>
                <select value={formData.projectId} onChange={e => setFormData({...formData, projectId: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all bg-white font-medium text-slate-700">
                  <option value="">Select a Project</option>
                  {projects.filter(p => !formData.customerId || p.customerId === formData.customerId).map(p => (
                     <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-600 uppercase tracking-wider">Amount (₹)</label>
                  <input type="number" required value={formData.amount} onChange={e => setFormData({...formData, amount: Number(e.target.value)})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium text-slate-700" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-600 uppercase tracking-wider">Initial Status</label>
                  <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all bg-white font-medium text-slate-700">
                    <option value="PENDING">Pending</option>
                    <option value="PAID">Paid</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold transition-colors">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md transition-colors">
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
                  <h1 className="text-3xl font-black mb-2" style={{ color: '#0f172a' }}>{tenant?.name || 'Company Name'}</h1>
                )}
                <p className="text-sm max-w-xs" style={{ color: '#64748b' }}>{tenant?.address || 'Company Address'}</p>
                <p className="text-sm" style={{ color: '#64748b' }}>{tenant?.city}, {tenant?.state} {tenant?.pincode}</p>
                {tenant?.gstin && <p className="text-sm font-semibold mt-2" style={{ color: '#475569' }}>GSTIN: {tenant.gstin}</p>}
              </div>
              <div className="text-right">
                <h2 className="text-4xl font-black uppercase tracking-widest mb-4" style={{ color: '#e2e8f0' }}>INVOICE</h2>
                <p className="text-sm font-bold" style={{ color: '#1e293b' }}>Invoice No: <span className="font-normal" style={{ color: '#64748b' }}>{inv.invoiceNumber || inv.id}</span></p>
                <p className="text-sm font-bold mt-1" style={{ color: '#1e293b' }}>Date: <span className="font-normal" style={{ color: '#64748b' }}>{new Date(inv.date).toLocaleDateString()}</span></p>
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
                  <td className="py-4 text-sm" style={{ color: '#334155' }}>{inv.project ? `Payment for Project: ${inv.project.name}` : 'Solar Installation Services'}</td>
                  <td className="py-4 text-sm font-bold text-right" style={{ color: '#0f172a' }}>₹ {inv.amount.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>

            {/* Totals */}
            <div className="flex justify-end mb-16">
              <div className="w-64">
                <div className="flex justify-between py-2 border-b" style={{ borderColor: '#e2e8f0' }}>
                  <span className="text-sm" style={{ color: '#64748b' }}>Subtotal</span>
                  <span className="text-sm font-bold" style={{ color: '#1e293b' }}>₹ {inv.amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-3">
                  <span className="text-base font-bold" style={{ color: '#0f172a' }}>Total Due</span>
                  <span className="text-base font-black" style={{ color: '#059669' }}>₹ {inv.amount.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Footer / Signature */}
            <div className="mt-20 pt-8 border-t flex justify-between items-end" style={{ borderColor: '#e2e8f0' }}>
              <div>
                <p className="text-xs font-medium" style={{ color: '#94a3b8' }}>Thank you for your business!</p>
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
