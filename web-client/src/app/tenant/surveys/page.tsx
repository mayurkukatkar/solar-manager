"use client";
import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { MapPin, Search, Calendar, User, Clock, FileText, CheckCircle } from 'lucide-react';

export default function SiteSurveys() {
  const [surveys, setSurveys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    customerId: '', surveyDate: '', proposedCap: '', roofType: '', notes: ''
  });

  const fetchData = async () => {
    try {
      const [surveyRes, customerRes] = await Promise.all([
        axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/surveys`, { withCredentials: true }),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/customers`, { withCredentials: true })
      ]);
      setSurveys(surveyRes.data.surveys);
      setCustomers(customerRes.data.customers);
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
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/surveys`, formData, { withCredentials: true });
      setShowModal(false);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to schedule survey');
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'SCHEDULED': return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'IN_PROGRESS': return 'bg-amber-50 text-amber-600 border-amber-200';
      case 'SUBMITTED': return 'bg-purple-50 text-purple-600 border-purple-200';
      case 'APPROVED': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      default: return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Site Surveys</h1>
          <p className="text-sm text-slate-500 mt-1">Manage scheduled site visits and technical evaluations.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-full font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-sm"
        >
          <MapPin size={18} /> Schedule Survey
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
           <div className="col-span-full py-20 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
           </div>
        ) : surveys.length === 0 ? (
           <div className="col-span-full bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden text-center py-20">
             <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                <MapPin size={32} />
             </div>
             <h2 className="text-xl font-bold text-slate-900">No Site Surveys Scheduled</h2>
             <p className="text-slate-500 mt-2 max-w-md mx-auto">You haven't scheduled any site surveys yet.</p>
           </div>
        ) : (
          surveys.map((survey) => (
             <div key={survey.id} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                   <div className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${getStatusColor(survey.status)}`}>
                     {survey.status.replace('_', ' ')}
                   </div>
                   <Link href={`/tenant/surveys/${survey.id}`} className="text-slate-400 hover:text-emerald-600 transition-colors">
                     <FileText size={18} />
                   </Link>
                </div>
                
                <h3 className="text-lg font-bold text-slate-900 mb-1">{survey.customer?.name || 'Unknown Customer'}</h3>
                <p className="text-sm text-slate-500 flex items-center gap-2 mb-6">
                  <MapPin size={14} /> {survey.customer?.address || 'No address provided'}
                </p>

                <div className="grid grid-cols-2 gap-4 mb-6 flex-1">
                   <div>
                     <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Date</p>
                     <p className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                       <Calendar size={14} className="text-slate-400" />
                       {survey.surveyDate ? new Date(survey.surveyDate).toLocaleDateString() : 'TBD'}
                     </p>
                   </div>
                   <div>
                     <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Prop. Capacity</p>
                     <p className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                       <CheckCircle size={14} className="text-emerald-500" />
                       {survey.proposedCap ? `${survey.proposedCap} kW` : 'TBD'}
                     </p>
                   </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                   <div className="flex items-center gap-2">
                     <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                       <User size={14} />
                     </div>
                     <span className="text-xs font-semibold text-slate-600">Unassigned</span>
                   </div>
                   <button className="text-xs font-bold text-emerald-600 hover:text-emerald-700">Update Status</button>
                </div>
             </div>
          ))
        )}
      </div>

      {/* NEW SURVEY MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Schedule Survey</h2>
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-600 uppercase tracking-wider">Date</label>
                  <input type="date" value={formData.surveyDate} onChange={e => setFormData({...formData, surveyDate: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium text-slate-700" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-600 uppercase tracking-wider">Roof Type</label>
                  <select value={formData.roofType} onChange={e => setFormData({...formData, roofType: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all bg-white font-medium text-slate-700">
                    <option value="">Select Type</option>
                    <option value="RCC">RCC (Flat)</option>
                    <option value="Sheet">Tin Sheet</option>
                    <option value="Tile">Tile</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-extrabold text-slate-600 uppercase tracking-wider">Proposed Capacity (kW)</label>
                <input type="number" step="0.1" value={formData.proposedCap} onChange={e => setFormData({...formData, proposedCap: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium text-slate-700" />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-extrabold text-slate-600 uppercase tracking-wider">Notes</label>
                <textarea rows={3} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium text-slate-700"></textarea>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold transition-colors">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md transition-colors">
                  Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
