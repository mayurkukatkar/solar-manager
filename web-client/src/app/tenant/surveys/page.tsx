"use client";

import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import Link from 'next/link';
import {
  MapPin, Search, Calendar, User, Clock, FileText, CheckCircle2,
  AlertTriangle, Plus, X, ChevronRight, Phone, ArrowUpRight, Zap,
  Sun, ShieldCheck, Filter, Compass, Layers, CheckCircle, RefreshCw,
  ExternalLink, Building, HelpCircle, FileCheck
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';

interface Survey {
  id: string;
  surveyNumber?: string;
  surveyDate?: string;
  status: string;
  proposedCap?: number;
  recommendedCapacity?: number;
  maxInstallableCapacity?: number;
  roofType?: string;
  totalRoofArea?: number;
  usableShadowFreeArea?: number;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  googleMapsUrl?: string;
  discomName?: string;
  discomConsumerNo?: string;
  sanctionedLoad?: number;
  electricalPhase?: string;
  feasibilityVerdict?: string;
  estimatedAnnualUnits?: number;
  estimatedAnnualSavings?: number;
  notes?: string;
  photos?: string[];
  customer?: { id: string; name: string; phone?: string; email?: string; address?: string };
  assignedEngineer?: { id: string; name: string; email: string };
  quotations?: Array<{ id: string; qNumber: string; total: number; status: string }>;
  createdAt: string;
}

interface Metrics {
  totalSurveys: number;
  scheduled: number;
  inProgress: number;
  completed: number;
  approvedFeasible: number;
  totalFeasibleKw: number;
}

export default function SiteSurveysPage() {
  const { showToast } = useToast();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [metrics, setMetrics] = useState<Metrics>({
    totalSurveys: 0,
    scheduled: 0,
    inProgress: 0,
    completed: 0,
    approvedFeasible: 0,
    totalFeasibleKw: 0
  });
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<any[]>([]);
  const [engineers, setEngineers] = useState<any[]>([]);

  // Filtering & Search
  const [activeTab, setActiveTab] = useState<'ALL' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'APPROVED' | 'REJECTED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRoof, setFilterRoof] = useState('ALL');

  // Modal State
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [quoteConvertingId, setQuoteConvertingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    customerId: '',
    customerName: '',
    phone: '',
    address: '',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '',
    surveyDate: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
    proposedCap: '5.0',
    roofType: 'RCC Flat Roof',
    totalRoofArea: '700',
    usableShadowFreeArea: '550',
    discomName: 'MSEDCL',
    discomConsumerNo: '',
    sanctionedLoad: '5',
    electricalPhase: 'Three Phase',
    assignedEngineerId: '',
    notes: ''
  });

  const fetchSurveysData = async () => {
    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const [surveyRes, custRes, engRes] = await Promise.all([
        axios.get(`${apiUrl}/api/tenant/surveys`, { withCredentials: true }),
        axios.get(`${apiUrl}/api/tenant/customers`, { withCredentials: true }).catch(() => ({ data: { customers: [] } })),
        axios.get(`${apiUrl}/api/tenant/surveys/engineers`, { withCredentials: true }).catch(() => ({ data: { engineers: [] } }))
      ]);

      if (surveyRes.data.surveys) {
        setSurveys(surveyRes.data.surveys);
      }
      if (surveyRes.data.metrics) {
        setMetrics(surveyRes.data.metrics);
      }
      if (custRes.data.customers) {
        setCustomers(custRes.data.customers);
      }
      if (engRes.data.engineers) {
        setEngineers(engRes.data.engineers);
      }
    } catch (err) {
      console.error('Failed to fetch surveys:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSurveysData();
  }, []);

  // Filtered surveys
  const filteredSurveys = useMemo(() => {
    return surveys.filter((s) => {
      // Status filter
      if (activeTab !== 'ALL' && s.status !== activeTab) return false;
      // Roof filter
      if (filterRoof !== 'ALL' && s.roofType !== filterRoof) return false;
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const num = s.surveyNumber?.toLowerCase() || '';
        const name = s.customer?.name?.toLowerCase() || '';
        const phone = s.customer?.phone?.toLowerCase() || '';
        const city = s.city?.toLowerCase() || '';
        const consumer = s.discomConsumerNo?.toLowerCase() || '';
        const roof = s.roofType?.toLowerCase() || '';
        if (!num.includes(q) && !name.includes(q) && !phone.includes(q) && !city.includes(q) && !consumer.includes(q) && !roof.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [surveys, activeTab, filterRoof, searchQuery]);

  // Handle Create Survey
  const handleCreateSurvey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerName.trim() && !formData.customerId) {
      showToast({ type: 'warning', message: 'Please select or specify a Customer Name' });
      return;
    }
    try {
      setSubmitting(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      await axios.post(`${apiUrl}/api/tenant/surveys`, formData, { withCredentials: true });
      setShowScheduleModal(false);
      showToast({ type: 'success', message: 'Site survey scheduled successfully!' });
      // Reset form
      setFormData({
        customerId: '',
        customerName: '',
        phone: '',
        address: '',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '',
        surveyDate: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
        proposedCap: '5.0',
        roofType: 'RCC Flat Roof',
        totalRoofArea: '700',
        usableShadowFreeArea: '550',
        discomName: 'MSEDCL',
        discomConsumerNo: '',
        sanctionedLoad: '5',
        electricalPhase: 'Three Phase',
        assignedEngineerId: '',
        notes: ''
      });
      fetchSurveysData();
    } catch (err: any) {
      console.error(err);
      showToast({ type: 'error', message: err.response?.data?.error || 'Failed to schedule site survey' });
    } finally {
      setSubmitting(false);
    }
  };

  // One-click convert to Quote
  const handleConvertToQuote = async (surveyId: string) => {
    try {
      setQuoteConvertingId(surveyId);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await axios.post(`${apiUrl}/api/tenant/surveys/${surveyId}/convert-to-quote`, {}, { withCredentials: true });
      showToast({ type: 'success', message: `Quotation ${res.data.quotation?.qNumber || ''} created successfully from Survey!` });
      fetchSurveysData();
    } catch (err: any) {
      console.error(err);
      showToast({ type: 'error', message: err.response?.data?.error || 'Failed to generate quotation' });
    } finally {
      setQuoteConvertingId(null);
    }
  };

  const getStatusBadge = (status: string, verdict?: string) => {
    if (status === 'APPROVED' || verdict === 'FEASIBLE') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 size={13} className="text-emerald-600" />
          FEASIBLE
        </span>
      );
    }
    if (status === 'IN_PROGRESS') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <Clock size={13} className="text-amber-600 animate-spin" />
          IN PROGRESS
        </span>
      );
    }
    if (status === 'COMPLETED' || status === 'SUBMITTED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
          <FileCheck size={13} className="text-purple-600" />
          EVALUATED
        </span>
      );
    }
    if (status === 'REJECTED' || verdict === 'NOT_FEASIBLE') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <AlertTriangle size={13} className="text-rose-600" />
          NOT FEASIBLE
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
        <Calendar size={13} className="text-blue-600" />
        SCHEDULED
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 p-6 md:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden border border-slate-700/50">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-extrabold uppercase tracking-wider border border-emerald-500/30">
              EPC Field Intelligence
            </span>
            <span className="text-slate-400 text-xs">Pre-Engineering Feasibility</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
            Site Survey & Feasibility Studio
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-xl">
            Dispatch technical engineers, evaluate 3D rooftop shade profiles, electrical connection parameters, and auto-convert feasible surveys to commercial proposals.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-3">
          <button
            onClick={fetchSurveysData}
            className="p-3 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-2xl border border-slate-700 transition-all flex items-center justify-center shadow-sm"
            title="Refresh Data"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => setShowScheduleModal(true)}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-5 py-3 rounded-2xl font-bold text-sm transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/25 active:scale-95"
          >
            <Plus size={18} /> Schedule Site Survey
          </button>
        </div>
      </div>

      {/* KPI METRICS RIBBON */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Surveys</span>
            <Layers size={18} className="text-slate-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">{metrics.totalSurveys}</div>
          <div className="text-[11px] text-slate-500 mt-1">Recorded to date</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-blue-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Scheduled Visits</span>
            <Calendar size={18} />
          </div>
          <div className="text-2xl font-black text-blue-600">{metrics.scheduled}</div>
          <div className="text-[11px] text-slate-500 mt-1">Awaiting field visit</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">In Progress</span>
            <Clock size={18} />
          </div>
          <div className="text-2xl font-black text-amber-600">{metrics.inProgress}</div>
          <div className="text-[11px] text-slate-500 mt-1">Inspection ongoing</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-purple-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Evaluated</span>
            <FileCheck size={18} />
          </div>
          <div className="text-2xl font-black text-purple-600">{metrics.completed}</div>
          <div className="text-[11px] text-slate-500 mt-1">Reports submitted</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-200 bg-emerald-50/30 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-600 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Approved Feasible</span>
            <ShieldCheck size={18} />
          </div>
          <div className="text-2xl font-black text-emerald-700">{metrics.approvedFeasible}</div>
          <div className="text-[11px] text-emerald-600 mt-1">Ready for quote/EPC</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Feasible Capacity</span>
            <Sun size={18} className="text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">{metrics.totalFeasibleKw} <span className="text-xs font-semibold text-slate-500">kWp</span></div>
          <div className="text-[11px] text-slate-500 mt-1">Installable potential</div>
        </div>
      </div>

      {/* CONTROLS BAR: SEARCH, TABS & FILTERS */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
        {/* Status Tabs */}
        <div className="flex items-center overflow-x-auto pb-1 lg:pb-0 gap-1.5 scrollbar-none">
          {[
            { id: 'ALL', label: 'All Surveys' },
            { id: 'SCHEDULED', label: 'Scheduled' },
            { id: 'IN_PROGRESS', label: 'In Progress' },
            { id: 'COMPLETED', label: 'Evaluated' },
            { id: 'APPROVED', label: 'Feasible' },
            { id: 'REJECTED', label: 'Rejected' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Roof Filter */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
          <div className="relative flex-1 sm:w-72">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search survey #, customer, city, CA #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X size={14} />
              </button>
            )}
          </div>

          <select
            value={filterRoof}
            onChange={(e) => setFilterRoof(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">All Roof Types</option>
            <option value="RCC Flat Roof">RCC Flat Roof</option>
            <option value="Metal Sheet Trapezoidal">Metal Sheet Trapezoidal</option>
            <option value="Standing Seam Metal Roof">Standing Seam Metal</option>
            <option value="Tile / Mangalore Roof">Tile / Mangalore</option>
            <option value="Elevated Superstructure">Elevated Superstructure</option>
          </select>
        </div>
      </div>

      {/* SURVEY CARDS GRID */}
      {loading ? (
        <div className="py-24 text-center bg-white rounded-3xl border border-slate-200">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
          <p className="text-xs font-semibold text-slate-500 mt-3">Loading site surveys and engineering data...</p>
        </div>
      ) : filteredSurveys.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-12 text-center">
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-emerald-600 border border-emerald-100">
            <Compass size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No Site Surveys Found</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            {searchQuery || activeTab !== 'ALL' || filterRoof !== 'ALL'
              ? 'No surveys match your active filters. Try adjusting your query or resetting filters.'
              : 'You have not scheduled any site surveys yet. Book your first rooftop evaluation now.'}
          </p>
          <button
            onClick={() => setShowScheduleModal(true)}
            className="mt-5 inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-sm transition-all"
          >
            <Plus size={16} /> Schedule First Survey
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSurveys.map((survey) => {
            const hasQuote = survey.quotations && survey.quotations.length > 0;
            const quote = hasQuote ? survey.quotations![0] : null;

            return (
              <div
                key={survey.id}
                className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Card Header: Survey ID & Status */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="font-mono text-[11px] font-extrabold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                      {survey.surveyNumber || `SRV-${survey.id.substring(0, 8).toUpperCase()}`}
                    </span>
                    {getStatusBadge(survey.status, survey.feasibilityVerdict)}
                  </div>

                  {/* Customer & Address */}
                  <div className="mb-4">
                    <Link
                      href={`/tenant/surveys/${survey.id}`}
                      className="text-base font-bold text-slate-900 group-hover:text-emerald-600 transition-colors flex items-center gap-1.5"
                    >
                      {survey.customer?.name || 'Prospect Client'}
                      <ArrowUpRight size={15} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <Phone size={12} className="text-slate-400" />
                      {survey.customer?.phone || 'No phone recorded'}
                    </p>
                    <p className="text-xs text-slate-600 flex items-center gap-1 mt-1 truncate">
                      <MapPin size={12} className="text-slate-400 shrink-0" />
                      {survey.address || survey.city ? `${survey.address ? survey.address + ', ' : ''}${survey.city || ''}` : 'Location pending site visit'}
                    </p>
                  </div>

                  {/* Technical Feasibility Snapshot */}
                  <div className="bg-slate-50/80 rounded-2xl p-3 border border-slate-100 space-y-2 mb-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Proposed / Sized:</span>
                      <span className="font-bold text-slate-900">
                        {survey.recommendedCapacity || survey.proposedCap || 3.0} kWp
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Roof Type:</span>
                      <span className="font-semibold text-slate-800 truncate max-w-[150px]">
                        {survey.roofType || 'RCC Flat'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Usable Area:</span>
                      <span className="font-semibold text-slate-800">
                        {survey.usableShadowFreeArea ? `${survey.usableShadowFreeArea} sq.ft` : 'TBD on site'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/50">
                      <span className="text-slate-500 font-medium">DISCOM CA #:</span>
                      <span className="font-mono text-slate-700 font-semibold">
                        {survey.discomConsumerNo || 'Pending KYC'}
                      </span>
                    </div>
                  </div>

                  {/* Engineer & Date Footer */}
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-4 px-1">
                    <div className="flex items-center gap-1.5 truncate">
                      <User size={13} className="text-slate-400" />
                      <span className="truncate">{survey.assignedEngineer?.name || 'Unassigned Tech'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Calendar size={13} className="text-slate-400" />
                      <span>{survey.surveyDate ? new Date(survey.surveyDate).toLocaleDateString() : 'TBD'}</span>
                    </div>
                  </div>
                </div>

                {/* Card Bottom Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <Link
                    href={`/tenant/surveys/${survey.id}`}
                    className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs text-center transition-colors flex items-center justify-center gap-1.5"
                  >
                    <FileText size={14} /> Full Evaluation
                  </Link>

                  {hasQuote ? (
                    <span className="py-2 px-3 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-[11px] border border-emerald-200 flex items-center gap-1">
                      <CheckCircle size={13} /> Quote: {quote?.qNumber}
                    </span>
                  ) : (
                    <button
                      onClick={() => handleConvertToQuote(survey.id)}
                      disabled={quoteConvertingId === survey.id}
                      className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
                      title="Convert approved survey into customer quotation"
                    >
                      {quoteConvertingId === survey.id ? (
                        <RefreshCw size={13} className="animate-spin" />
                      ) : (
                        <Zap size={13} />
                      )}
                      Make Quote
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SCHEDULE SITE SURVEY MODAL */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 md:p-8 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div>
                <h3 className="text-xl font-black text-slate-900">Schedule Site Survey</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Book a technical rooftop shadow & electrical feasibility evaluation
                </p>
              </div>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSurvey} className="space-y-4">
              {/* Customer Selector / Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Customer / Lead *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <select
                    value={formData.customerId}
                    onChange={(e) => {
                      const selId = e.target.value;
                      const c = customers.find((x) => x.id === selId);
                      setFormData({
                        ...formData,
                        customerId: selId,
                        customerName: c ? c.name : formData.customerName,
                        phone: c ? (c.phone || formData.phone) : formData.phone,
                        address: c ? (c.address || formData.address) : formData.address,
                        city: c ? (c.city || formData.city) : formData.city
                      });
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">-- Choose Existing Customer --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.phone ? `(${c.phone})` : ''}
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    placeholder="Or enter Prospect Name *"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Contact & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Contact Phone *
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. +91 98201 12345"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Survey Appointment Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.surveyDate}
                    onChange={(e) => setFormData({ ...formData, surveyDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              {/* Site Address */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Site Street Address
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Bungalow 4B, Green Acres, Baner"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    City
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Roof Specs & Capacity */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Roof Type
                  </label>
                  <select
                    value={formData.roofType}
                    onChange={(e) => setFormData({ ...formData, roofType: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="RCC Flat Roof">RCC Flat Roof</option>
                    <option value="Metal Sheet Trapezoidal">Metal Sheet Trapezoidal</option>
                    <option value="Standing Seam Metal Roof">Standing Seam Metal</option>
                    <option value="Tile / Mangalore Roof">Tile / Mangalore</option>
                    <option value="Elevated Superstructure">Elevated Superstructure</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Proposed Sizing (kWp)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    value={formData.proposedCap}
                    onChange={(e) => setFormData({ ...formData, proposedCap: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Usable Roof Area (sq.ft)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 500"
                    value={formData.usableShadowFreeArea}
                    onChange={(e) => setFormData({ ...formData, usableShadowFreeArea: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Electrical & DISCOM Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    DISCOM Provider
                  </label>
                  <input
                    type="text"
                    value={formData.discomName}
                    onChange={(e) => setFormData({ ...formData, discomName: e.target.value })}
                    placeholder="e.g. MSEDCL, TPDDL"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    DISCOM Consumer # (CA)
                  </label>
                  <input
                    type="text"
                    value={formData.discomConsumerNo}
                    onChange={(e) => setFormData({ ...formData, discomConsumerNo: e.target.value })}
                    placeholder="e.g. 028540192842"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Electrical Phase
                  </label>
                  <select
                    value={formData.electricalPhase}
                    onChange={(e) => setFormData({ ...formData, electricalPhase: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Single Phase">Single Phase (230V)</option>
                    <option value="Three Phase">Three Phase (415V)</option>
                  </select>
                </div>
              </div>

              {/* Engineer Assignment */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Assigned Field Engineer
                </label>
                <select
                  value={formData.assignedEngineerId}
                  onChange={(e) => setFormData({ ...formData, assignedEngineerId: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- Unassigned (Assign Later) --</option>
                  {engineers.map((eng) => (
                    <option key={eng.id} value={eng.id}>
                      {eng.name} ({eng.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Inspection Instructions / Roof Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Customer concerned about trees on east side, bring 20ft ladder for parapet access..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                  Confirm Appointment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
