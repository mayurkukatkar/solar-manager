"use client";
import { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, Plus, User, Calendar, IndianRupee, Download } from 'lucide-react';

export default function Quotations() {
  const [quotations, setQuotations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [leads, setLeads] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    leadId: '', subtotal: 0, tax: 0, discount: 0, validityDays: 15
  });

  const fetchData = async () => {
    try {
      const [quoteRes, leadRes] = await Promise.all([
        axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/quotations`, { withCredentials: true }),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/leads`, { withCredentials: true })
      ]);
      setQuotations(quoteRes.data.quotations);
      setLeads(leadRes.data.leads || leadRes.data);
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
      const total = Number(formData.subtotal) + Number(formData.tax) - Number(formData.discount);
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/quotations`, { ...formData, total }, { withCredentials: true });
      setShowModal(false);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to create quotation');
    }
  };

  const handleDownload = async (quote: any) => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/quotations/${quote.id}/pdf`, {
        responseType: 'blob',
        withCredentials: true
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${quote.qNumber || 'Quotation'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("PDF Download Error:", error);
      alert("Failed to download PDF. Please try again.");
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'DRAFT': return 'bg-slate-100 text-slate-700';
      case 'SENT': return 'bg-blue-50 text-blue-700';
      case 'ACCEPTED': return 'bg-emerald-50 text-emerald-700';
      case 'REJECTED': return 'bg-red-50 text-red-700';
      default: return 'bg-slate-50 text-slate-700';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Quotations & Proposals</h1>
          <p className="text-sm text-slate-500 mt-1">Generate and track commercial proposals for your leads.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-full font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-sm"
        >
          <Plus size={18} /> Create Quotation
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-xs font-bold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Quote Number</th>
                <th className="px-6 py-4">Lead</th>
                <th className="px-6 py-4">Date & Validity</th>
                <th className="px-6 py-4">Total Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                  </td>
                </tr>
              ) : quotations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 font-medium">
                    No quotations found.
                  </td>
                </tr>
              ) : (
                quotations.map((quote) => (
                  <tr key={quote.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 font-bold text-slate-900">
                        <FileText size={16} className="text-slate-400" /> {quote.qNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-slate-600">
                          <User size={12} />
                        </div>
                        <span className="font-semibold text-slate-800">{quote.lead?.name || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 text-slate-600">
                        <span className="flex items-center gap-1.5 font-medium"><Calendar size={14} className="text-slate-400" /> {new Date(quote.date).toLocaleDateString()}</span>
                        <span className="text-xs text-slate-400">Valid {quote.validityDays} days</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-900 flex items-center gap-1">
                        <IndianRupee size={14} className="text-slate-500" /> {quote.total.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${getStatusColor(quote.status)}`}>
                        {quote.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleDownload(quote)} className="p-2 text-slate-400 hover:text-emerald-600 rounded-full hover:bg-emerald-50 transition-colors">
                        <Download size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* NEW QUOTATION MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Create Quotation</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700 p-2">✕</button>
            </div>
            
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-extrabold text-slate-600 uppercase tracking-wider">Lead *</label>
                <select required value={formData.leadId} onChange={e => setFormData({...formData, leadId: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all bg-white font-medium text-slate-700">
                  <option value="">Select a Lead</option>
                  {leads.map(l => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-extrabold text-slate-600 uppercase tracking-wider">Validity (Days)</label>
                <input type="number" value={formData.validityDays} onChange={e => setFormData({...formData, validityDays: Number(e.target.value)})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium text-slate-700" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-600 uppercase tracking-wider">Subtotal (₹)</label>
                  <input type="number" required value={formData.subtotal} onChange={e => setFormData({...formData, subtotal: Number(e.target.value)})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium text-slate-700" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-600 uppercase tracking-wider">Tax (₹)</label>
                  <input type="number" value={formData.tax} onChange={e => setFormData({...formData, tax: Number(e.target.value)})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium text-slate-700" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-extrabold text-slate-600 uppercase tracking-wider">Discount (₹)</label>
                <input type="number" value={formData.discount} onChange={e => setFormData({...formData, discount: Number(e.target.value)})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium text-slate-700" />
              </div>
              
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between items-center">
                 <span className="text-sm font-bold text-slate-600">Total Amount</span>
                 <span className="text-lg font-black text-emerald-600">₹ {(Number(formData.subtotal) + Number(formData.tax) - Number(formData.discount)).toLocaleString()}</span>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold transition-colors">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md transition-colors">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
