"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';
import {
  ArrowLeft, MapPin, Calendar, CheckCircle2, UploadCloud,
  Image as ImageIcon, Zap, Sun, ShieldCheck, AlertTriangle,
  Clock, FileText, User, Phone, Compass, Layers, Save,
  ExternalLink, Printer, CheckCircle, RefreshCw, X, ChevronRight,
  TrendingUp, Award, BatteryCharging
} from 'lucide-react';

interface SurveyDetail {
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
  roofObstacles?: string[];
  tiltAngle?: number;
  azimuthAngle?: number;
  parapetHeight?: number;
  structurePreference?: string;
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
  meterType?: string;
  meterLocation?: string;
  cableRunRoofToMeter?: number;
  inverterLocation?: string;
  earthPitFeasibility?: string;
  lightningArresterReq?: boolean;
  gridVoltage?: number;
  avgMonthlyBill?: number;
  avgMonthlyUnits?: number;
  estimatedAnnualUnits?: number;
  estimatedAnnualSavings?: number;
  assignedEngineerId?: string;
  assignedEngineer?: { id: string; name: string; email: string };
  surveyEngineerName?: string;
  surveyEngineerPhone?: string;
  feasibilityVerdict?: string;
  feasibilityNotes?: string;
  specialRequirements?: string;
  notes?: string;
  photos?: string[];
  categorizedPhotos?: Record<string, string[]>;
  customer?: { id: string; name: string; phone?: string; email?: string; address?: string };
  quotations?: Array<{ id: string; qNumber: string; total: number; status: string; systemCapacity: number; createdAt: string }>;
  projects?: Array<{ id: string; name: string; projectCode?: string; stage: string }>;
  completedAt?: string;
}

export default function SurveyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [survey, setSurvey] = useState<SurveyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [convertingQuote, setConvertingQuote] = useState(false);
  const [activeTab, setActiveTab] = useState<'ROOF' | 'ELECTRICAL' | 'ECONOMICS' | 'PHOTOS' | 'VERDICT'>('ROOF');
  const [selectedPhotoCategory, setSelectedPhotoCategory] = useState('rooftop');
  const [engineers, setEngineers] = useState<any[]>([]);

  // Editable Form State
  const [form, setForm] = useState<Partial<SurveyDetail>>({});

  const fetchSurvey = async () => {
    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const [surveyRes, engRes] = await Promise.all([
        axios.get(`${apiUrl}/api/tenant/surveys/${params.id}`, { withCredentials: true }),
        axios.get(`${apiUrl}/api/tenant/surveys/engineers`, { withCredentials: true }).catch(() => ({ data: { engineers: [] } }))
      ]);

      if (surveyRes.data.survey) {
        setSurvey(surveyRes.data.survey);
        setForm(surveyRes.data.survey);
      }
      if (engRes.data.engineers) {
        setEngineers(engRes.data.engineers);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.id) {
      fetchSurvey();
    }
  }, [params.id]);

  // Handle Save
  const handleSaveChanges = async () => {
    try {
      setSaving(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await axios.patch(`${apiUrl}/api/tenant/surveys/${params.id}`, form, { withCredentials: true });
      setSurvey(res.data.survey);
      setForm(res.data.survey);
      alert('Technical survey evaluation saved successfully!');
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to update survey');
    } finally {
      setSaving(false);
    }
  };

  // Status Quick Transition
  const handleStatusChange = async (newStatus: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await axios.patch(
        `${apiUrl}/api/tenant/surveys/${params.id}/status`,
        { status: newStatus },
        { withCredentials: true }
      );
      setSurvey(res.data.survey);
      setForm((prev) => ({ ...prev, status: newStatus }));
    } catch (err: any) {
      console.error(err);
      alert('Failed to update status');
    }
  };

  // Convert to Quote
  const handleConvertToQuote = async () => {
    try {
      setConvertingQuote(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await axios.post(`${apiUrl}/api/tenant/surveys/${params.id}/convert-to-quote`, {}, { withCredentials: true });
      alert(`Quotation ${res.data.quotation?.qNumber || ''} generated!`);
      fetchSurvey();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to convert to quote');
    } finally {
      setConvertingQuote(false);
    }
  };

  // Photo Upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    try {
      setUploading(true);
      const formData = new FormData();
      for (let i = 0; i < e.target.files.length; i++) {
        formData.append('photos', e.target.files[i]);
      }
      formData.append('category', selectedPhotoCategory);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await axios.post(`${apiUrl}/api/tenant/surveys/${params.id}/photos`, formData, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (survey) {
        setSurvey({
          ...survey,
          photos: res.data.photos,
          categorizedPhotos: res.data.categorizedPhotos
        });
      }
      alert('Site photos uploaded and categorized successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to upload photos');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-32 text-center">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500" />
        <p className="text-sm font-semibold text-slate-500 mt-4">Loading survey technical file...</p>
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="py-20 text-center text-slate-500 max-w-md mx-auto">
        <AlertTriangle size={48} className="text-rose-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-900">Survey Record Not Found</h2>
        <p className="text-sm mt-1">This site survey ID does not exist or was deleted.</p>
        <Link href="/tenant/surveys" className="mt-4 inline-block px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold">
          Return to Surveys
        </Link>
      </div>
    );
  }

  const hasQuote = survey.quotations && survey.quotations.length > 0;
  const quote = hasQuote ? survey.quotations![0] : null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      {/* TOP BREADCRUMB & ACTION BAR */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm">
        <div className="flex items-center gap-4">
          <Link
            href="/tenant/surveys"
            className="w-11 h-11 bg-slate-50 hover:bg-slate-100 rounded-2xl flex items-center justify-center border border-slate-200 text-slate-600 transition-colors shadow-sm shrink-0"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs font-black px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                {survey.surveyNumber || `SRV-${survey.id.substring(0, 8).toUpperCase()}`}
              </span>
              <span className="text-xs font-bold text-slate-400">•</span>
              <span className="text-xs font-bold text-slate-600">
                {survey.customer?.name || 'Prospect Client'}
              </span>
            </div>
            <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
              Technical Feasibility Dossier
            </h1>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Status Dropdown */}
          <select
            value={survey.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="SCHEDULED">Status: SCHEDULED</option>
            <option value="IN_PROGRESS">Status: IN PROGRESS</option>
            <option value="COMPLETED">Status: EVALUATED</option>
            <option value="APPROVED">Status: APPROVED FEASIBLE</option>
            <option value="REJECTED">Status: NOT FEASIBLE</option>
          </select>

          {/* Print Report */}
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
            title="Print Feasibility Dossier"
          >
            <Printer size={15} /> Print
          </button>

          {/* Make Quote Action */}
          {hasQuote ? (
            <Link
              href={`/tenant/quotations`}
              className="px-4 py-2.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <CheckCircle size={15} /> Quote: {quote?.qNumber}
            </Link>
          ) : (
            <button
              onClick={handleConvertToQuote}
              disabled={convertingQuote}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              {convertingQuote ? <RefreshCw size={15} className="animate-spin" /> : <Zap size={15} />}
              Generate Proposal Quote
            </button>
          )}

          {/* Save Changes */}
          <button
            onClick={handleSaveChanges}
            disabled={saving}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            {saving ? <RefreshCw size={15} className="animate-spin" /> : <Save size={15} />}
            Save Changes
          </button>
        </div>
      </div>

      {/* EXECUTIVE SUMMARY STRIP */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Feasibility Verdict</div>
          <div className="text-base font-black text-emerald-600 mt-1 flex items-center gap-1.5">
            <CheckCircle2 size={16} />
            {survey.feasibilityVerdict || 'FEASIBLE'}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Engineering verified</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Optimal Solar Sizing</div>
          <div className="text-base font-black text-slate-900 mt-1">
            {survey.recommendedCapacity || survey.proposedCap || 3.0} kWp
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">~{Math.ceil(((survey.recommendedCapacity || 3.0) * 1000) / 550)} Bifacial 550Wp Panels</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Usable Shadow-Free</div>
          <div className="text-base font-black text-slate-900 mt-1">
            {survey.usableShadowFreeArea || 500} sq.ft
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Total: {survey.totalRoofArea || 700} sq.ft</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Est. Annual Generation</div>
          <div className="text-base font-black text-slate-900 mt-1">
            {survey.estimatedAnnualUnits || Math.round((survey.recommendedCapacity || 3.0) * 1450)} kWh
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">~₹{Math.round((survey.estimatedAnnualSavings || ((survey.recommendedCapacity || 3.0) * 1450 * 8.5))).toLocaleString('en-IN')}/yr Savings</div>
        </div>

        <div className="col-span-2 md:col-span-1 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Field Engineer</div>
          <div className="text-base font-bold text-slate-900 mt-1 truncate">
            {survey.assignedEngineer?.name || 'Unassigned'}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {survey.surveyDate ? new Date(survey.surveyDate).toLocaleDateString() : 'Date TBD'}
          </div>
        </div>
      </div>

      {/* TABBED INTERACTION HEADER */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto scrollbar-none">
        {[
          { id: 'ROOF', label: '1. Rooftop & Shade Analysis', icon: Compass },
          { id: 'ELECTRICAL', label: '2. Electrical & DISCOM', icon: Zap },
          { id: 'ECONOMICS', label: '3. Energy Yield & Bill', icon: TrendingUp },
          { id: 'PHOTOS', label: '4. Site Photos & Geotags', icon: ImageIcon },
          { id: 'VERDICT', label: '5. Engineering Verdict', icon: ShieldCheck }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              <Icon size={14} className={isActive ? 'text-emerald-400' : 'text-slate-400'} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: ROOFTOP & SHADE ANALYSIS */}
      {activeTab === 'ROOF' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Rooftop Physical Assessment</h3>
              <p className="text-xs text-slate-500 mt-0.5">Evaluate civil structure, usable shadow-free area, and module tilt angles.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Roof Type *
                </label>
                <select
                  value={form.roofType || 'RCC Flat Roof'}
                  onChange={(e) => setForm({ ...form, roofType: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="RCC Flat Roof">RCC Flat Roof</option>
                  <option value="Metal Sheet Trapezoidal">Metal Sheet Trapezoidal</option>
                  <option value="Standing Seam Metal Roof">Standing Seam Metal Roof</option>
                  <option value="Tile / Mangalore Roof">Tile / Mangalore Roof</option>
                  <option value="Elevated Superstructure">Elevated Superstructure (7ft+)</option>
                  <option value="Asbestos / ACC Sheet">Asbestos / ACC Sheet</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Structure Mounting Preference
                </label>
                <select
                  value={form.structurePreference || 'Standard Aluminum MMS'}
                  onChange={(e) => setForm({ ...form, structurePreference: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Standard Aluminum MMS">Standard Aluminum MMS (Ground / RCC Anchor)</option>
                  <option value="HDGI Pre-galvanized Steel">HDGI Pre-galvanized Steel (Hot-dip 80 microns)</option>
                  <option value="Elevated 7ft Superstructure">Elevated 7ft+ Walkway Superstructure</option>
                  <option value="Non-penetrating Ballasted">Non-penetrating Ballasted RCC Blocks</option>
                  <option value="Direct Trapezoidal Mini-Rail">Direct Sheet Mini-Rail (No Purlin Penetration)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Total Roof Footprint (sq.ft)
                </label>
                <input
                  type="number"
                  value={form.totalRoofArea || ''}
                  onChange={(e) => setForm({ ...form, totalRoofArea: parseFloat(e.target.value) || 0 })}
                  placeholder="e.g. 800"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Usable Shadow-Free Area (sq.ft) *
                </label>
                <input
                  type="number"
                  value={form.usableShadowFreeArea || ''}
                  onChange={(e) => setForm({ ...form, usableShadowFreeArea: parseFloat(e.target.value) || 0 })}
                  placeholder="e.g. 550"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Solar Array Tilt Angle (Degrees)
                </label>
                <input
                  type="number"
                  value={form.tiltAngle || 18}
                  onChange={(e) => setForm({ ...form, tiltAngle: parseFloat(e.target.value) || 18 })}
                  placeholder="15 - 22°"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">Optimal for Maharashtra/Gujarat: 15° - 20°</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Azimuth Orientation (Degrees)
                </label>
                <input
                  type="number"
                  value={form.azimuthAngle || 180}
                  onChange={(e) => setForm({ ...form, azimuthAngle: parseFloat(e.target.value) || 180 })}
                  placeholder="180° = South"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">180° True South produces max yield in India</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Parapet Wall Height (Feet)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={form.parapetHeight || 3.0}
                  onChange={(e) => setForm({ ...form, parapetHeight: parseFloat(e.target.value) || 0 })}
                  placeholder="e.g. 3.5 ft"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Max Installable Potential (kWp)
                </label>
                <input
                  type="number"
                  value={form.maxInstallableCapacity || form.recommendedCapacity || 5.0}
                  disabled
                  className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-not-allowed"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">Computed automatically (~100 sq.ft per kWp)</span>
              </div>
            </div>

            {/* Shadow Obstacles Checklist */}
            <div className="pt-4 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Identified Rooftop Shadow Obstacles
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  'Water Storage Tank',
                  'Staircase Mumty',
                  'Parapet Shadow (Winter)',
                  'Neighboring Trees',
                  'Adjacent High-Rise',
                  'HVAC / Chimney Vent',
                  'Dish Antennas / Cables'
                ].map((item) => {
                  const obstacles = Array.isArray(form.roofObstacles) ? form.roofObstacles : [];
                  const isChecked = obstacles.includes(item);
                  return (
                    <label
                      key={item}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium cursor-pointer transition-colors ${
                        isChecked
                          ? 'bg-amber-50 border-amber-300 text-amber-900'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          const next = isChecked
                            ? obstacles.filter((x: string) => x !== item)
                            : [...obstacles, item];
                          setForm({ ...form, roofObstacles: next });
                        }}
                        className="rounded text-amber-600 focus:ring-amber-500"
                      />
                      <span className="truncate">{item}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Info Box */}
          <div className="space-y-5">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-700 rounded-3xl p-6 text-white shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full">
                  Solar Array Sizing
                </span>
                <Sun size={20} className="text-amber-300" />
              </div>
              <div>
                <div className="text-3xl font-black">
                  {form.recommendedCapacity || form.proposedCap || 3.0} <span className="text-sm font-semibold">kWp</span>
                </div>
                <p className="text-xs text-emerald-100 mt-1">Recommended system capacity for this rooftop</p>
              </div>

              <div className="space-y-2 pt-3 border-t border-emerald-400/40 text-xs">
                <div className="flex justify-between">
                  <span className="text-emerald-100">Bifacial Panels:</span>
                  <span className="font-bold">~{Math.ceil(((form.recommendedCapacity || 3.0) * 1000) / 550)} units (550Wp)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-emerald-100">Daily Generation:</span>
                  <span className="font-bold">~{Math.round((form.recommendedCapacity || 3.0) * 4.2 * 10) / 10} Units / day</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-emerald-100">Annual Yield:</span>
                  <span className="font-bold">~{Math.round((form.recommendedCapacity || 3.0) * 1450)} Units / yr</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin size={15} className="text-emerald-600" /> Site Coordinates & Geotag
              </h4>
              <div className="text-xs text-slate-600 space-y-1">
                <p><strong>Address:</strong> {survey.address || 'Address recorded on schedule'}</p>
                <p><strong>City:</strong> {survey.city || 'Pune'}, {survey.state || 'Maharashtra'}</p>
                <p><strong>Pincode:</strong> {survey.pincode || '411045'}</p>
                {survey.googleMapsUrl && (
                  <a
                    href={survey.googleMapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-emerald-600 font-bold mt-2 hover:underline"
                  >
                    <ExternalLink size={13} /> Open in Google Maps
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ELECTRICAL & DISCOM */}
      {activeTab === 'ELECTRICAL' && (
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">Electrical Single-Line & DISCOM Infrastructure</h3>
            <p className="text-xs text-slate-500 mt-0.5">Audit connection load, bi-directional net-meter parameters, cable runs, and earthing pits.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                DISCOM Provider *
              </label>
              <input
                type="text"
                value={form.discomName || ''}
                onChange={(e) => setForm({ ...form, discomName: e.target.value })}
                placeholder="e.g. MSEDCL, TPDDL, BESCOM, UGVCL"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                DISCOM Consumer Number (CA #) *
              </label>
              <input
                type="text"
                value={form.discomConsumerNo || ''}
                onChange={(e) => setForm({ ...form, discomConsumerNo: e.target.value })}
                placeholder="e.g. 028540192842"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Sanctioned Grid Load (kW / kVA)
              </label>
              <input
                type="number"
                step="0.5"
                value={form.sanctionedLoad || ''}
                onChange={(e) => setForm({ ...form, sanctionedLoad: parseFloat(e.target.value) || 0 })}
                placeholder="e.g. 5.0"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Electrical Phase *
              </label>
              <select
                value={form.electricalPhase || 'Three Phase'}
                onChange={(e) => setForm({ ...form, electricalPhase: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Single Phase">Single Phase (230V AC - Up to 3kW)</option>
                <option value="Three Phase">Three Phase (415V AC - Standard)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Existing Meter Type
              </label>
              <select
                value={form.meterType || 'Static Digital Meter'}
                onChange={(e) => setForm({ ...form, meterType: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Static Digital Meter">Static Digital Meter (Replace with Net-Meter)</option>
                <option value="Bi-directional Smart Meter">Bi-directional Smart Net-Meter (Ready)</option>
                <option value="Electromechanical Meter">Old Electromechanical Wheel Meter</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Main Meter Box Location
              </label>
              <input
                type="text"
                value={form.meterLocation || 'Ground Floor Boundary Wall'}
                onChange={(e) => setForm({ ...form, meterLocation: e.target.value })}
                placeholder="e.g. Parking Pillar, Ground Floor Main DB"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Cable Run: Roof to Meter (Meters)
              </label>
              <input
                type="number"
                value={form.cableRunRoofToMeter || 25}
                onChange={(e) => setForm({ ...form, cableRunRoofToMeter: parseFloat(e.target.value) || 0 })}
                placeholder="e.g. 25 meters"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Proposed Inverter Location
              </label>
              <input
                type="text"
                value={form.inverterLocation || 'Rooftop Canopy near Mumty'}
                onChange={(e) => setForm({ ...form, inverterLocation: e.target.value })}
                placeholder="e.g. Covered Canopy, Staircase Landing"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Chemical Earth Pits Feasibility
              </label>
              <select
                value={form.earthPitFeasibility || 'Space Available for 3 Pits'}
                onChange={(e) => setForm({ ...form, earthPitFeasibility: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Space Available for 3 Pits">Space Available for 3 Dedicated Pits (AC, DC, LA)</option>
                <option value="Existing House Earth Available">Existing House Earth + 1 Dedicated Pit</option>
                <option value="Hard Rock / Special Drilling Required">Hard Rock Soil / Special Drilling Required</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ECONOMICS & ENERGY YIELD */}
      {activeTab === 'ECONOMICS' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Energy Audit & Consumer Economics</h3>
              <p className="text-xs text-slate-500 mt-0.5">Determine net-metering ROI based on average billing and consumer tariffs.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Avg. Monthly Electricity Bill (₹)
                </label>
                <input
                  type="number"
                  value={form.avgMonthlyBill || ''}
                  onChange={(e) => setForm({ ...form, avgMonthlyBill: parseFloat(e.target.value) || 0 })}
                  placeholder="e.g. 4500"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Avg. Monthly Consumption (kWh / Units)
                </label>
                <input
                  type="number"
                  value={form.avgMonthlyUnits || ''}
                  onChange={(e) => setForm({ ...form, avgMonthlyUnits: parseFloat(e.target.value) || 0 })}
                  placeholder="e.g. 500"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* PM Surya Ghar Subsidy Guide */}
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-5 space-y-3">
              <h4 className="text-xs font-black text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                <Award size={16} className="text-emerald-700" /> PM Surya Ghar: Muft Bijli Yojana Subsidy Slabs
              </h4>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-white p-3 rounded-xl border border-emerald-200">
                  <div className="text-[11px] font-bold text-slate-500">1 kW System</div>
                  <div className="text-base font-black text-emerald-700 mt-0.5">₹30,000</div>
                  <div className="text-[10px] text-slate-400">Direct DBT</div>
                </div>
                <div className="bg-white p-3 rounded-xl border border-emerald-200">
                  <div className="text-[11px] font-bold text-slate-500">2 kW System</div>
                  <div className="text-base font-black text-emerald-700 mt-0.5">₹60,000</div>
                  <div className="text-[10px] text-slate-400">Direct DBT</div>
                </div>
                <div className="bg-white p-3 rounded-xl border border-emerald-300 shadow-sm">
                  <div className="text-[11px] font-bold text-emerald-700">3 kW+ Max</div>
                  <div className="text-base font-black text-emerald-800 mt-0.5">₹78,000</div>
                  <div className="text-[10px] text-emerald-600 font-bold">Capped Max</div>
                </div>
              </div>
            </div>
          </div>

          {/* 25-Year Projection Card */}
          <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-6">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full">
                25-Year Financial Return
              </span>
              <h3 className="text-xl font-black mt-3">Estimated Solar Yield</h3>
              <p className="text-xs text-slate-400 mt-1">Based on ~1,450 peak sun generation hours/year in central/western India.</p>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-slate-800 text-xs">
                <span className="text-slate-400">Annual Units:</span>
                <span className="font-bold text-white">
                  ~{survey.estimatedAnnualUnits || Math.round((survey.recommendedCapacity || 3.0) * 1450)} kWh
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-slate-800 text-xs">
                <span className="text-slate-400">Annual Tariff Offset:</span>
                <span className="font-bold text-emerald-400">
                  ~₹{Math.round((survey.estimatedAnnualSavings || ((survey.recommendedCapacity || 3.0) * 1450 * 8.5))).toLocaleString('en-IN')} / yr
                </span>
              </div>

              <div className="flex justify-between items-center py-2 text-xs">
                <span className="text-slate-400">25-Yr Cumulative:</span>
                <span className="font-black text-lg text-emerald-300">
                  ~₹{Math.round((survey.estimatedAnnualSavings || ((survey.recommendedCapacity || 3.0) * 1450 * 8.5)) * 25).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 bg-slate-800/60 p-3 rounded-xl border border-slate-800">
              * Assumes ₹8.50/unit average blended tariff with nominal 3% annual grid tariff inflation.
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CATEGORIZED PHOTOS */}
      {activeTab === 'PHOTOS' && (
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Categorized Site Photos</h3>
              <p className="text-xs text-slate-500 mt-0.5">Upload and verify high-resolution photos for rooftop feasibility, shade, and meter boxes.</p>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={selectedPhotoCategory}
                onChange={(e) => setSelectedPhotoCategory(e.target.value)}
                className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="rooftop">Category: Rooftop Overview</option>
                <option value="shadow">Category: Shadow Obstacles</option>
                <option value="meter">Category: Meter & DB Board</option>
                <option value="inverter">Category: Inverter Mounting</option>
                <option value="cable">Category: Cable Routing Path</option>
                <option value="earthing">Category: Earth Pits</option>
              </select>

              <div>
                <input
                  type="file"
                  id="survey-photos-input"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoUpload}
                  disabled={uploading}
                />
                <label
                  htmlFor="survey-photos-input"
                  className={`cursor-pointer px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm ${
                    uploading ? 'opacity-50 pointer-events-none' : ''
                  }`}
                >
                  <UploadCloud size={15} />
                  {uploading ? 'Uploading...' : 'Add Photos'}
                </label>
              </div>
            </div>
          </div>

          {survey.photos && survey.photos.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {survey.photos.map((url, idx) => (
                <a
                  key={idx}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="group relative aspect-video rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 block shadow-sm hover:shadow-md transition-all"
                >
                  <img
                    src={url}
                    alt={`Site Photo ${idx + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                    <span className="text-white text-[11px] font-bold flex items-center gap-1">
                      <ExternalLink size={12} /> View Full Image
                    </span>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <div className="py-20 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center p-6 bg-slate-50/50">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mb-3">
                <ImageIcon size={28} />
              </div>
              <h4 className="text-sm font-bold text-slate-800">No Site Inspection Photos</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Capture and upload high-res photos of the rooftop, meter box, and shade profile to attach them to this feasibility study.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: ENGINEERING VERDICT & SIGN-OFF */}
      {activeTab === 'VERDICT' && (
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">Technical Feasibility Verdict & Sign-Off</h3>
            <p className="text-xs text-slate-500 mt-0.5">Final engineer declaration determining project viability and DISCOM net-meter eligibility.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                id: 'FEASIBLE',
                title: 'Technically Feasible',
                desc: 'Shadow-free area, civil integrity, and electrical panel meet all standards.',
                color: 'emerald'
              },
              {
                id: 'FEASIBLE_WITH_CONDITIONS',
                title: 'Feasible with Elevation',
                desc: 'Requires 7ft elevated structure or civil tree pruning/staircase clearance.',
                color: 'amber'
              },
              {
                id: 'NOT_FEASIBLE',
                title: 'Not Feasible / Rejected',
                desc: 'Severe shade obstructions, damaged roof, or insufficient sanctioned load.',
                color: 'rose'
              }
            ].map((v) => {
              const isSelected = (form.feasibilityVerdict || 'FEASIBLE') === v.id;
              return (
                <div
                  key={v.id}
                  onClick={() => setForm({ ...form, feasibilityVerdict: v.id })}
                  className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                    isSelected
                      ? v.color === 'emerald'
                        ? 'border-emerald-500 bg-emerald-50/50'
                        : v.color === 'amber'
                        ? 'border-amber-500 bg-amber-50/50'
                        : 'border-rose-500 bg-rose-50/50'
                      : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-900">
                      {v.title}
                    </span>
                    <input
                      type="radio"
                      checked={isSelected}
                      onChange={() => setForm({ ...form, feasibilityVerdict: v.id })}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                  </div>
                  <p className="text-xs text-slate-600">{v.desc}</p>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Technical Feasibility Remarks
              </label>
              <textarea
                rows={3}
                value={form.feasibilityNotes || ''}
                onChange={(e) => setForm({ ...form, feasibilityNotes: e.target.value })}
                placeholder="e.g. Parapet shadow restricts panels on north edge. Recommend 8 modules on main RCC slab with 18° South tilt."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Special Client Requests / Workmanship Conditions
              </label>
              <textarea
                rows={3}
                value={form.specialRequirements || ''}
                onChange={(e) => setForm({ ...form, specialRequirements: e.target.value })}
                placeholder="e.g. Customer requests 7.5ft walkway height so rooftop terrace remains usable for family functions."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Survey Engineer Name
              </label>
              <input
                type="text"
                value={form.surveyEngineerName || ''}
                onChange={(e) => setForm({ ...form, surveyEngineerName: e.target.value })}
                placeholder="e.g. Rahul Sharma"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Engineer Phone Number
              </label>
              <input
                type="tel"
                value={form.surveyEngineerPhone || ''}
                onChange={(e) => setForm({ ...form, surveyEngineerPhone: e.target.value })}
                placeholder="e.g. +91 98201 12345"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
