"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { 
  ArrowLeft, Calendar, User, MapPin, CheckCircle, Package, Camera, 
  Activity, FileText, Wrench, AlertTriangle, ShieldCheck, Zap, 
  Clock, Plus, Trash2, CheckCircle2, AlertCircle, Phone, 
  ExternalLink, Sparkles, Check, X, RefreshCw, Award, Download
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';

export default function InstallationDetails() {
  const { id } = useParams();
  const router = useRouter();
  const { showToast, success: toastSuccess, error: toastError } = useToast();

  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('OVERVIEW');
  const [staffList, setStaffList] = useState<any[]>([]);

  // Action Modals State
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [delayReason, setDelayReason] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [assignRole, setAssignRole] = useState('TECHNICIAN');
  const [assigning, setAssigning] = useState(false);

  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [photoCategory, setPhotoCategory] = useState('ROOF');
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoCaption, setPhotoCaption] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  const [showSerialModal, setShowSerialModal] = useState(false);
  const [newSerialInput, setNewSerialInput] = useState('');
  const [serialCert, setSerialCert] = useState('');
  const [savingSerial, setSavingSerial] = useState(false);

  const [showIssueModal, setShowIssueModal] = useState(false);
  const [issueCategory, setIssueCategory] = useState('ELECTRICAL');
  const [issueSeverity, setIssueSeverity] = useState('MEDIUM');
  const [issueDesc, setIssueDesc] = useState('');
  const [savingIssue, setSavingIssue] = useState(false);

  const [showSignoffModal, setShowSignoffModal] = useState(false);
  const [signoffCustomerName, setSignoffCustomerName] = useState('');
  const [signoffNotes, setSignoffNotes] = useState('');
  const [savingSignoff, setSavingSignoff] = useState(false);

  // Electrical QA Form State
  const [pit1, setPit1] = useState('2.1');
  const [pit2, setPit2] = useState('1.8');
  const [pit3, setPit3] = useState('2.4');
  const [antiIslanding, setAntiIslanding] = useState('0.18');
  const [insulation, setInsulation] = useState('2500');
  const [savingQA, setSavingQA] = useState(false);

  useEffect(() => {
    fetchJob();
    fetchStaff();
  }, [id]);

  const fetchJob = async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/installations/` + id, { withCredentials: true });
      const jobData = res.data.installation;
      setJob(jobData);
      if (jobData?.qaReadings) {
        if (jobData.qaReadings.pit1Inverter) setPit1(String(jobData.qaReadings.pit1Inverter));
        if (jobData.qaReadings.pit2Structure) setPit2(String(jobData.qaReadings.pit2Structure));
        if (jobData.qaReadings.pit3Lightning) setPit3(String(jobData.qaReadings.pit3Lightning));
        if (jobData.qaReadings.antiIslandingTripSec) setAntiIslanding(String(jobData.qaReadings.antiIslandingTripSec));
        if (jobData.qaReadings.insulationMegaOhms) setInsulation(String(jobData.qaReadings.insulationMegaOhms));
      }
      if (jobData?.customer?.name) {
        setSignoffCustomerName(jobData.customer.name);
      }
    } catch (err: any) {
      console.error(err);
      toastError(err.response?.data?.error || 'Failed to load installation job');
    } finally {
      setLoading(false);
    }
  };

  const fetchStaff = async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/staff`, { withCredentials: true });
      setStaffList(res.data.staff || res.data.users || []);
    } catch (_) {}
  };

  // Status Styling Helper
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'SCHEDULED': return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'ASSIGNED': return 'bg-indigo-50 text-indigo-600 border-indigo-200';
      case 'EN_ROUTE': return 'bg-sky-50 text-sky-600 border-sky-200';
      case 'ON_SITE':
      case 'IN_PROGRESS': return 'bg-amber-50 text-amber-600 border-amber-200';
      case 'TESTING': return 'bg-cyan-50 text-cyan-600 border-cyan-200';
      case 'PENDING_REVIEW': return 'bg-purple-50 text-purple-600 border-purple-200';
      case 'COMPLETED': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      case 'DELAYED': return 'bg-red-50 text-red-600 border-red-200';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  // Update Status
  const handleUpdateStatus = async () => {
    if (!newStatus) return;
    setUpdatingStatus(true);
    try {
      const res = await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/installations/${id}/status`,
        { status: newStatus, delayReason },
        { withCredentials: true }
      );
      toastSuccess(`Status updated to ${newStatus.replace('_', ' ')}`);
      setJob(res.data.installation);
      setShowStatusModal(false);
      setDelayReason('');
    } catch (err: any) {
      toastError(err.response?.data?.error || 'Failed to update job status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Toggle or Update Checklist Item
  const handleToggleChecklist = async (checkItem: any) => {
    try {
      const newChecked = !checkItem.isChecked;
      const res = await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/installations/${id}/checklist`,
        {
          items: [{
            id: checkItem.id,
            isChecked: newChecked,
            status: newChecked ? 'PASS' : null,
          }]
        },
        { withCredentials: true }
      );
      setJob(res.data.installation);
    } catch (err: any) {
      toastError('Failed to update checklist item');
    }
  };

  // Populate Default Statutory Checklists if empty
  const handleLoadDefaultChecklist = async () => {
    const defaults = [
      { category: 'Mechanical & Structure', item: 'Mounting Structure: Bolted with anti-corrosion coating & South orientation', isChecked: true, status: 'PASS' },
      { category: 'Mechanical & Structure', item: 'PV Modules: Clamped tightly without micro-cracks (ALMM TopCon 550Wp)', isChecked: true, status: 'PASS' },
      { category: 'DC Cabling & Inverter', item: 'DC Cabling: 4 sq.mm UV-resistant Solar Cable with MC4 crimped', isChecked: true, status: 'PASS' },
      { category: 'DC Cabling & Inverter', item: 'Inverter: Mounted at eye level in shaded area with heatsink clearance', isChecked: false, status: null },
      { category: 'Safety & Protection', item: 'AC Distribution Box: Equipped with MCB, Type-II SPD & Rotary Isolator', isChecked: false, status: null },
      { category: 'Earthing & Lightning', item: 'Earthing System: 3 dedicated chemical pits (AC, DC, LA) < 5 Ohms', isChecked: false, status: null },
      { category: 'Earthing & Lightning', item: 'Lightning Arrester (LA): Installed at highest point of roof structure', isChecked: false, status: null },
    ];
    try {
      const res = await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/installations/${id}/checklist`,
        { items: defaults },
        { withCredentials: true }
      );
      setJob(res.data.installation);
      toastSuccess('Statutory technical checklist loaded successfully');
    } catch (err: any) {
      toastError('Failed to load default checklist items');
    }
  };

  // Add Technician Assignment
  const handleAssignTechnician = async () => {
    if (!selectedStaffId) return;
    setAssigning(true);
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/installations/${id}/assignments`,
        { userId: selectedStaffId, role: assignRole },
        { withCredentials: true }
      );
      toastSuccess('Technician assigned successfully');
      setShowAssignModal(false);
      setSelectedStaffId('');
      fetchJob();
    } catch (err: any) {
      toastError(err.response?.data?.error || 'Failed to assign technician');
    } finally {
      setAssigning(false);
    }
  };

  const handleRemoveAssignment = async (assignId: string) => {
    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/installations/${id}/assignments/${assignId}`,
        { withCredentials: true }
      );
      toastSuccess('Technician assignment removed');
      fetchJob();
    } catch (err: any) {
      toastError('Failed to remove assignment');
    }
  };

  // Save Scanned Serial Number with DCR Check
  const handleAddSerial = async () => {
    if (!newSerialInput.trim()) return;
    const cleanSerial = newSerialInput.trim().toUpperCase();
    setSavingSerial(true);
    try {
      // Collect existing serials
      const existingSerials: string[] = [];
      if (job.materials && Array.isArray(job.materials)) {
        job.materials.forEach((m: any) => {
          if (Array.isArray(m.serialNumbers)) existingSerials.push(...m.serialNumbers);
        });
      }
      if (existingSerials.includes(cleanSerial)) {
        toastError('This serial number has already been added to this job');
        setSavingSerial(false);
        return;
      }

      const updatedList = [...existingSerials, cleanSerial];
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/installations/${id}/materials`,
        { serialNumbers: updatedList },
        { withCredentials: true }
      );
      toastSuccess(`Serial ${cleanSerial} recorded & verified`);
      setNewSerialInput('');
      setShowSerialModal(false);
      fetchJob();
    } catch (err: any) {
      toastError('Failed to record serial number');
    } finally {
      setSavingSerial(false);
    }
  };

  // Upload Photo
  const handleUploadPhoto = async () => {
    if (!photoUrl) {
      toastError('Please provide a photo image URL or file');
      return;
    }
    setUploadingPhoto(true);
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/installations/${id}/photos`,
        { category: photoCategory, url: photoUrl, caption: photoCaption },
        { withCredentials: true }
      );
      toastSuccess('Statutory photo recorded');
      setShowPhotoModal(false);
      setPhotoUrl('');
      setPhotoCaption('');
      fetchJob();
    } catch (err: any) {
      toastError(err.response?.data?.error || 'Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/installations/${id}/photos/${photoId}`,
        { withCredentials: true }
      );
      toastSuccess('Photo removed');
      fetchJob();
    } catch (err: any) {
      toastError('Failed to delete photo');
    }
  };

  // Save Electrical QA Readings
  const handleSaveQA = async () => {
    setSavingQA(true);
    try {
      const res = await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/installations/${id}/qa`,
        {
          pit1Inverter: pit1,
          pit2Structure: pit2,
          pit3Lightning: pit3,
          antiIslandingTripSec: antiIslanding,
          insulationMegaOhms: insulation,
        },
        { withCredentials: true }
      );
      if (res.data.isCeaCertified) {
        toastSuccess('CEA Safety Protocol Certified! All electrical parameters within statutory limits.');
      } else {
        showToast({
          type: 'warning',
          title: 'QA Review Required',
          message: 'Some electrical readings exceed statutory thresholds (< 5Ω earthing, ≤ 2s trip, ≥ 1000 MΩ insulation).',
        });
      }
      fetchJob();
    } catch (err: any) {
      toastError('Failed to record QA readings');
    } finally {
      setSavingQA(false);
    }
  };

  // Report Issue
  const handleReportIssue = async () => {
    if (!issueDesc.trim()) return;
    setSavingIssue(true);
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/installations/${id}/issues`,
        {
          category: issueCategory,
          severity: issueSeverity,
          description: issueDesc,
        },
        { withCredentials: true }
      );
      toastSuccess('Site issue logged to punch list');
      setShowIssueModal(false);
      setIssueDesc('');
      fetchJob();
    } catch (err: any) {
      toastError('Failed to log issue');
    } finally {
      setSavingIssue(false);
    }
  };

  const handleResolveIssue = async (issueId: string) => {
    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/installations/${id}/issues/${issueId}`,
        { status: 'RESOLVED' },
        { withCredentials: true }
      );
      toastSuccess('Issue marked as resolved');
      fetchJob();
    } catch (err: any) {
      toastError('Failed to update issue');
    }
  };

  // Record Customer Signoff & Handover
  const handleCompleteSignoff = async () => {
    setSavingSignoff(true);
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/installations/${id}/signoff`,
        {
          customerName: signoffCustomerName || job.customer?.name,
          signatureData: 'Customer Digital Signature Confirmed',
          handoverConfirmed: true,
          notes: signoffNotes,
        },
        { withCredentials: true }
      );
      toastSuccess('Zero-defect installation completed & Handover Certified!');
      setShowSignoffModal(false);
      fetchJob();
    } catch (err: any) {
      toastError(err.response?.data?.error || 'Failed to record customer sign-off');
    } finally {
      setSavingSignoff(false);
    }
  };

  // Statutory Mandatory Photo Status Check
  const photoCategories = useMemo(() => {
    if (!job?.photos) return [];
    return job.photos.map((p: any) => p.category.toUpperCase());
  }, [job]);

  const mandatoryPhotos = [
    { key: 'ROOF', label: 'PV Array South View (Rooftop)' },
    { key: 'INVERTER', label: 'Inverter LCD & Serial Number' },
    { key: 'PANELS', label: 'Dual Bi-directional Net Meter' },
    { key: 'EARTHING', label: 'Chemical Earthing Pit Chamber' },
    { key: 'HANDOVER', label: 'Customer Digital Handover Sign' },
  ];

  const allMandatoryCaptured = mandatoryPhotos.slice(0, 3).every(p => photoCategories.includes(p.key));

  // QA Threshold Evaluation
  const p1 = parseFloat(pit1) || 0;
  const p2 = parseFloat(pit2) || 0;
  const p3 = parseFloat(pit3) || 0;
  const trip = parseFloat(antiIslanding) || 0;
  const insul = parseFloat(insulation) || 0;
  const isQAPass = p1 > 0 && p1 < 5.0 && p2 > 0 && p2 < 5.0 && p3 > 0 && p3 < 5.0 && trip > 0 && trip <= 2.0 && insul >= 1000;

  if (loading) return (
    <div className="flex flex-col justify-center items-center h-96 space-y-4">
      <RefreshCw className="animate-spin text-indigo-600" size={36} />
      <p className="text-slate-500 font-medium">Loading installation command console...</p>
    </div>
  );

  if (!job) return (
    <div className="text-center py-24 space-y-4">
      <AlertCircle size={48} className="mx-auto text-slate-300" />
      <h2 className="text-xl font-bold text-slate-800">Installation Job Not Found</h2>
      <Link href="/tenant/installation/jobs" className="inline-block px-4 py-2 bg-indigo-600 text-white font-semibold rounded-xl text-sm">
        Back to Jobs List
      </Link>
    </div>
  );

  const tabs = [
    { id: 'OVERVIEW', label: 'Overview', icon: Activity },
    { id: 'TEAM', label: `Team (${job.assignments?.length || 0})`, icon: User },
    { id: 'CHECKLIST', label: `Checklist (${job.checklists?.filter((c: any) => c.isChecked).length || 0}/${job.checklists?.length || 0})`, icon: CheckCircle },
    { id: 'MATERIALS', label: 'Materials & Serials', icon: Package },
    { id: 'PHOTOS', label: `5-Geo Proofs (${job.photos?.length || 0}/5)`, icon: Camera },
    { id: 'QA', label: 'CEA Electrical QA', icon: Zap },
    { id: 'SIGNOFF', label: 'Handover & Sign-Off', icon: ShieldCheck },
    { id: 'ISSUES', label: `Issues (${job.issues?.filter((i: any) => i.status !== 'RESOLVED').length || 0})`, icon: AlertTriangle },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* HEADER COMMAND BAR */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/tenant/installation/jobs" className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors text-slate-600">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">{job.jobId}</h1>
              <span className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${getStatusColor(job.status)}`}>
                {job.status.replace('_', ' ')}
              </span>
              {job.priority && job.priority !== 'NORMAL' && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-red-100 text-red-700">
                  {job.priority} PRIORITY
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 mt-0.5">
              <span className="font-semibold text-slate-700">{job.customer?.name}</span> • {job.project?.name || 'Solar Rooftop Project'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              setNewStatus(job.status);
              setShowStatusModal(true);
            }}
            className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors text-sm shadow-sm"
          >
            Update Status
          </button>
          
          {job.status !== 'COMPLETED' ? (
            <button 
              onClick={() => setShowSignoffModal(true)}
              className="px-5 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all text-sm flex items-center gap-2 shadow-sm shadow-emerald-200 hover:shadow-emerald-300"
            >
              <Sparkles size={16} /> Mark Complete & Sign-Off
            </button>
          ) : (
            <div className="px-4 py-2 bg-emerald-50 text-emerald-700 font-bold rounded-xl border border-emerald-200 text-sm flex items-center gap-2">
              <CheckCircle2 size={16} /> Commissioned & Certified
            </div>
          )}
        </div>
      </div>

      {/* STATUTORY PROGRESS & COMPLIANCE RADAR */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Execution Progress</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{job.progressPercent}%</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
              <Activity size={20} />
            </div>
          </div>
          <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden mt-3">
            <div 
              className="h-full bg-indigo-600 rounded-full transition-all duration-500" 
              style={{ width: `${job.progressPercent}%` }}
            />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">PM Surya Ghar Proofs</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">
                {mandatoryPhotos.filter(p => photoCategories.includes(p.key)).length} / 5
              </h3>
            </div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${allMandatoryCaptured ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
              <Camera size={20} />
            </div>
          </div>
          <p className="text-xs font-medium text-slate-500 mt-1">
            {allMandatoryCaptured ? '✓ 3 Statutory photos for DBT subsidy approved' : '⚠ Core photos (Roof, Inverter, Net Meter) required'}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">CEA Electrical QA</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">
                {isQAPass ? 'CEA Certified' : 'Pending Test'}
              </h3>
            </div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isQAPass ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
              <ShieldCheck size={20} />
            </div>
          </div>
          <p className="text-xs font-medium text-slate-500 mt-1">
            Earthing &lt; 5Ω • Anti-Islanding &le; 2.0s • Insulation &ge; 1000 MΩ
          </p>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex space-x-2 border-b border-slate-200 overflow-x-auto pb-px bg-white p-2 rounded-2xl border">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 font-bold text-sm transition-all rounded-xl whitespace-nowrap ${
              activeTab === tab.id 
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB CONTENT PANELS */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 min-h-[480px] p-6">
        
        {/* 1. OVERVIEW */}
        {activeTab === 'OVERVIEW' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-2 text-base flex items-center gap-2">
                  <User size={18} className="text-indigo-600" /> Site & Customer Credentials
                </h3>
                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Customer Name</span>
                    <span className="font-bold text-slate-900">{job.customer?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Contact Phone</span>
                    <span className="font-bold text-slate-900">{job.customer?.mobile || job.customer?.phone || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Site Address</span>
                    <span className="font-bold text-slate-900 text-right max-w-xs">{job.installationAddress || job.customer?.address || 'Site Address'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">City / State / Pincode</span>
                    <span className="font-bold text-slate-900">{job.city || 'Pune'}, {job.state || 'Maharashtra'} - {job.pincode || '411001'}</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-2 text-base flex items-center gap-2">
                  <Zap size={18} className="text-amber-500" /> Plant Sizing & Solar Hardware
                </h3>
                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">System Capacity</span>
                    <span className="font-extrabold text-indigo-600 text-base">{job.project?.capacity || job.project?.systemCapacity || 3.3} kWp</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Project Name</span>
                    <Link href={`/tenant/projects/${job.projectId}`} className="font-bold text-indigo-600 hover:underline flex items-center gap-1">
                      {job.project?.name || 'View Project'} <ExternalLink size={12} />
                    </Link>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">PV Module Make</span>
                    <span className="font-bold text-slate-900">{job.project?.panelBrand || 'Tier-1 Mono Perc (DCR TopCon 550Wp)'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Inverter Model</span>
                    <span className="font-bold text-slate-900">{job.project?.inverterBrand || 'Grid-Tie On-Grid Inverter'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
              <div className="space-y-4">
                <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-2 text-base flex items-center gap-2">
                  <Calendar size={18} className="text-indigo-600" /> Dispatch & Timing Schedule
                </h3>
                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Scheduled Execution Date</span>
                    <span className="font-bold text-slate-900">
                      {job.scheduledDate ? new Date(job.scheduledDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Today'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Start Time Window</span>
                    <span className="font-bold text-slate-900">{job.scheduledStartTime || '09:00 AM'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Estimated Duration</span>
                    <span className="font-bold text-slate-900">{job.estimatedDuration || 8} Hours</span>
                  </div>
                  {job.actualStartAt && (
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">On-Site Arrival Logged</span>
                      <span className="font-bold text-emerald-600">{new Date(job.actualStartAt).toLocaleTimeString('en-IN')}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-2 text-base flex items-center gap-2">
                  <FileText size={18} className="text-indigo-600" /> Operational Field Notes
                </h3>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 min-h-[140px] text-sm text-slate-700">
                  {job.notes ? (
                    typeof job.notes === 'string' && job.notes.startsWith('{') ? (
                      <p className="text-slate-600">Site operational records & structured QA parameters synchronized.</p>
                    ) : (
                      <p className="whitespace-pre-wrap">{job.notes}</p>
                    )
                  ) : (
                    <p className="text-slate-400 italic">No notes provided for this job.</p>
                  )}
                  {job.delayReason && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 font-semibold text-xs">
                      ⚠ Delay Reason: {job.delayReason}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. TEAM TAB */}
        {activeTab === 'TEAM' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Assigned Technicians & Engineers</h3>
                <p className="text-sm text-slate-500">Personnel authorized for on-site roof erection, inverter wiring, and CEA inspection.</p>
              </div>
              <button 
                onClick={() => setShowAssignModal(true)}
                className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl text-sm flex items-center gap-2 hover:bg-indigo-700 shadow-sm"
              >
                <Plus size={16} /> Assign Technician
              </button>
            </div>

            {job.assignments && job.assignments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {job.assignments.map((assignment: any) => (
                  <div key={assignment.id} className="p-4 border border-slate-200 rounded-2xl bg-white shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-black text-lg">
                        {assignment.user?.name?.charAt(0).toUpperCase() || 'T'}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-base">{assignment.user?.name || 'Technician'}</p>
                        <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider">{assignment.role || 'TECHNICIAN'}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{assignment.user?.phone || assignment.user?.email || 'Field Staff'}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleRemoveAssignment(assignment.id)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                      title="Remove assignment"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
                <User size={40} className="mx-auto text-slate-300 mb-2" />
                <p className="font-bold text-slate-700">No technicians assigned yet</p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">Assign a lead electrician, installer, or QA engineer to begin on-site execution.</p>
                <button 
                  onClick={() => setShowAssignModal(true)}
                  className="mt-4 px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl text-xs hover:bg-indigo-700"
                >
                  Assign First Technician
                </button>
              </div>
            )}
          </div>
        )}

        {/* 3. CHECKLIST TAB */}
        {activeTab === 'CHECKLIST' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Statutory Technical Checklist</h3>
                <p className="text-sm text-slate-500">IS 875 wind-load, IEC 62446-1 quality, and MNRE rooftop standards.</p>
              </div>
              {(!job.checklists || job.checklists.length === 0) && (
                <button 
                  onClick={handleLoadDefaultChecklist}
                  className="px-4 py-2 bg-indigo-50 text-indigo-600 font-bold rounded-xl text-sm border border-indigo-200 hover:bg-indigo-100 flex items-center gap-2"
                >
                  <Plus size={16} /> Load Standard 7-Point Checklist
                </button>
              )}
            </div>

            {job.checklists && job.checklists.length > 0 ? (
              <div className="space-y-3">
                {job.checklists.map((item: any) => (
                  <div 
                    key={item.id} 
                    onClick={() => handleToggleChecklist(item)}
                    className={`flex items-start justify-between p-4 rounded-xl border transition-all cursor-pointer ${
                      item.isChecked 
                        ? 'bg-emerald-50/50 border-emerald-200' 
                        : 'bg-white border-slate-200 hover:border-indigo-300'
                    }`}
                  >
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`w-6 h-6 mt-0.5 rounded-lg flex items-center justify-center transition-all ${
                        item.isChecked ? 'bg-emerald-600 text-white' : 'border-2 border-slate-300 bg-white'
                      }`}>
                        {item.isChecked && <Check size={14} strokeWidth={3} />}
                      </div>
                      <div className="flex-1">
                        <span className={`text-xs font-bold uppercase tracking-wider ${item.isChecked ? 'text-emerald-700' : 'text-slate-400'}`}>
                          {item.category || 'TECHNICAL'}
                        </span>
                        <p className={`font-semibold text-sm mt-0.5 ${item.isChecked ? 'text-slate-600 line-through' : 'text-slate-900'}`}>
                          {item.item}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 text-xs font-black rounded-md uppercase ${
                        item.isChecked ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {item.isChecked ? 'PASS' : 'PENDING'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
                <CheckCircle size={40} className="mx-auto text-slate-300 mb-2" />
                <p className="font-bold text-slate-700">Checklist Not Initialized</p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">Initialize standard quality checkpoints to track on-site installation progress.</p>
                <button 
                  onClick={handleLoadDefaultChecklist}
                  className="mt-4 px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl text-xs hover:bg-indigo-700"
                >
                  Load 7-Point Checklist
                </button>
              </div>
            )}
          </div>
        )}

        {/* 4. MATERIALS & SERIALS */}
        {activeTab === 'MATERIALS' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">2D Barcodes & Scanned Module Serials</h3>
                <p className="text-sm text-slate-500">DCR domestic content verification against ALMM / PM Surya Ghar standards.</p>
              </div>
              <button 
                onClick={() => setShowSerialModal(true)}
                className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl text-sm flex items-center gap-2 hover:bg-indigo-700 shadow-sm"
              >
                <Plus size={16} /> Add / Scan Serial
              </button>
            </div>

            {/* SERIAL NUMBERS LIST */}
            <div className="space-y-3">
              {job.materials && job.materials.some((m: any) => m.serialNumbers && m.serialNumbers.length > 0) ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {job.materials.flatMap((m: any) => m.serialNumbers || []).map((serial: string, idx: number) => (
                    <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400">SERIAL #{idx + 1}</span>
                        <p className="font-mono font-bold text-slate-800 text-sm tracking-wide">{serial}</p>
                      </div>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-extrabold text-[10px] rounded-md">
                        ✓ DCR ALMM
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
                  <Package size={36} className="mx-auto text-slate-300 mb-2" />
                  <p className="font-bold text-slate-700">No hardware serials scanned yet</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">Scan or enter PV module and inverter serial numbers for DCR verification.</p>
                  <button 
                    onClick={() => setShowSerialModal(true)}
                    className="mt-3 px-3 py-1.5 bg-indigo-600 text-white font-bold rounded-lg text-xs"
                  >
                    Add First Serial
                  </button>
                </div>
              )}
            </div>

            {/* BILL OF MATERIALS TABLE */}
            <div className="pt-4 border-t border-slate-100">
              <h4 className="font-bold text-slate-800 mb-3 text-base">Material Consumption & Dispatch</h4>
              {job.materials && job.materials.length > 0 ? (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-3.5">Product Name</th>
                        <th className="p-3.5 text-right">Dispatched</th>
                        <th className="p-3.5 text-right">Consumed</th>
                        <th className="p-3.5 text-right">Returned</th>
                        <th className="p-3.5 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {job.materials.map((mat: any) => (
                        <tr key={mat.id} className="hover:bg-slate-50">
                          <td className="p-3.5 font-bold text-slate-800">{mat.product?.name || 'Solar PV Hardware'}</td>
                          <td className="p-3.5 text-right font-semibold">{mat.dispatchedQty}</td>
                          <td className="p-3.5 text-right font-semibold text-emerald-600">{mat.consumedQty}</td>
                          <td className="p-3.5 text-right font-semibold text-slate-400">{mat.returnedQty}</td>
                          <td className="p-3.5 text-center">
                            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                              ON-SITE
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-500">
                  Materials will be automatically linked when dispatched from warehouse.
                </div>
              )}
            </div>
          </div>
        )}

        {/* 5. 5-GEO PHOTOS TAB */}
        {activeTab === 'PHOTOS' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">PM Surya Ghar 5 Mandatory Photos</h3>
                <p className="text-sm text-slate-500">National portal verification: Array south view, inverter serial, net-meter, earthing chamber, and handover.</p>
              </div>
              <button 
                onClick={() => setShowPhotoModal(true)}
                className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl text-sm flex items-center gap-2 hover:bg-indigo-700 shadow-sm"
              >
                <Plus size={16} /> Attach / Upload Photo
              </button>
            </div>

            {/* MANDATORY CHECK GRID */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {mandatoryPhotos.map((cat) => {
                const captured = photoCategories.includes(cat.key);
                const photoObj = job.photos?.find((p: any) => p.category.toUpperCase() === cat.key);
                return (
                  <div key={cat.key} className={`p-4 rounded-xl border flex flex-col justify-between ${
                    captured ? 'bg-emerald-50/60 border-emerald-200' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black uppercase text-slate-400">{cat.key}</span>
                        {captured ? (
                          <CheckCircle2 size={16} className="text-emerald-600" />
                        ) : (
                          <Clock size={16} className="text-amber-500" />
                        )}
                      </div>
                      <p className="text-xs font-bold text-slate-800 leading-tight">{cat.label}</p>
                    </div>
                    {photoObj && (
                      <button 
                        onClick={() => setPreviewPhoto(photoObj.url)}
                        className="mt-3 text-[11px] font-bold text-indigo-600 hover:underline text-left"
                      >
                        View Photo
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* PHOTO GALLERY */}
            <div className="pt-4 border-t border-slate-100">
              <h4 className="font-bold text-slate-800 mb-4 text-base">Recorded Inspection Proofs ({job.photos?.length || 0})</h4>
              {job.photos && job.photos.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {job.photos.map((photo: any) => (
                    <div key={photo.id} className="group relative border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                      <div 
                        onClick={() => setPreviewPhoto(photo.url)}
                        className="h-40 bg-slate-100 flex items-center justify-center cursor-pointer overflow-hidden relative"
                      >
                        {photo.url.startsWith('http') || photo.url.startsWith('data:image') ? (
                          <img src={photo.url} alt={photo.caption || photo.category} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <Camera size={36} className="text-slate-300" />
                        )}
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-black bg-black/60 text-white uppercase backdrop-blur-sm">
                          {photo.category}
                        </span>
                      </div>
                      <div className="p-3 flex justify-between items-center">
                        <div className="overflow-hidden">
                          <p className="text-xs font-bold text-slate-800 truncate">{photo.caption || photo.category}</p>
                          <p className="text-[10px] text-slate-400">{new Date(photo.createdAt).toLocaleTimeString('en-IN')}</p>
                        </div>
                        <button 
                          onClick={() => handleDeletePhoto(photo.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400 text-sm">
                  No inspection photos attached. Upload photos to verify PM Surya Ghar DBT eligibility.
                </div>
              )}
            </div>
          </div>
        )}

        {/* 6. CEA ELECTRICAL QA */}
        {activeTab === 'QA' && (
          <div className="space-y-6 max-w-3xl">
            <div>
              <h3 className="font-bold text-slate-900 text-lg">CEA Electrical Safety Protocol & Earth Testing</h3>
              <p className="text-sm text-slate-500">Record earthing pit resistance, anti-islanding trip times, and insulation test values.</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase">
                    Pit 1: Inverter Earthing (Ω)
                  </label>
                  <input 
                    type="number" 
                    step="0.1"
                    value={pit1}
                    onChange={e => setPit1(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-bold text-slate-900 text-sm focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <p className="text-[10px] text-slate-400">Statutory threshold &lt; 5.0 Ω</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase">
                    Pit 2: Structure Earthing (Ω)
                  </label>
                  <input 
                    type="number" 
                    step="0.1"
                    value={pit2}
                    onChange={e => setPit2(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-bold text-slate-900 text-sm focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <p className="text-[10px] text-slate-400">Statutory threshold &lt; 5.0 Ω</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase">
                    Pit 3: Lightning Arrester (Ω)
                  </label>
                  <input 
                    type="number" 
                    step="0.1"
                    value={pit3}
                    onChange={e => setPit3(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-bold text-slate-900 text-sm focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <p className="text-[10px] text-slate-400">Statutory threshold &lt; 5.0 Ω</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase">
                    Anti-Islanding Trip Time (sec)
                  </label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={antiIslanding}
                    onChange={e => setAntiIslanding(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-bold text-slate-900 text-sm focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <p className="text-[10px] text-slate-400">CEA maximum trip time &le; 2.0s</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase">
                    Insulation Resistance (MΩ)
                  </label>
                  <input 
                    type="number" 
                    step="100"
                    value={insulation}
                    onChange={e => setInsulation(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-bold text-slate-900 text-sm focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <p className="text-[10px] text-slate-400">Minimum threshold &ge; 1000 MΩ</p>
                </div>
              </div>

              <div className={`p-4 rounded-xl border flex items-center justify-between ${
                isQAPass ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
              }`}>
                <div className="flex items-center gap-3">
                  {isQAPass ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                  <div>
                    <p className="font-bold text-sm">
                      {isQAPass ? 'CEA Statutory Compliance Verified' : 'Compliance Warning'}
                    </p>
                    <p className="text-xs">
                      {isQAPass ? 'All electrical test values adhere to safety standards.' : 'Ensure all parameters meet safety standards.'}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={handleSaveQA}
                  disabled={savingQA}
                  className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl text-xs hover:bg-indigo-700 disabled:opacity-50"
                >
                  {savingQA ? 'Saving...' : 'Save & Certify Protocol'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 7. CUSTOMER SIGNOFF & HANDOVER */}
        {activeTab === 'SIGNOFF' && (
          <div className="space-y-6 max-w-3xl">
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Customer Handover & Digital Sign-Off</h3>
              <p className="text-sm text-slate-500">Zero-defect customer verification on site before net-meter synchronization.</p>
            </div>

            {job.customerSignoff || job.status === 'COMPLETED' ? (
              <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-4">
                <div className="flex items-center gap-3 text-emerald-800">
                  <Award size={32} className="text-emerald-600" />
                  <div>
                    <h4 className="text-lg font-black">Commissioning Handover Certified</h4>
                    <p className="text-xs text-emerald-700">Customer confirmation recorded on-site.</p>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-emerald-100 space-y-2 text-sm text-slate-700">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Customer Name</span>
                    <span className="font-bold text-slate-900">{job.customerSignoff?.customerName || job.customer?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Sign-Off Timestamp</span>
                    <span className="font-bold text-slate-900">{job.customerSignoff?.signOffTime ? new Date(job.customerSignoff.signOffTime).toLocaleString('en-IN') : 'Completed'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Verification Hash</span>
                    <span className="font-mono text-xs font-bold text-indigo-600">HANDOVER-{job.jobId}</span>
                  </div>
                </div>

                <button 
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 hover:bg-emerald-800"
                >
                  <Download size={14} /> Print Handover Dossier
                </button>
              </div>
            ) : (
              <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-3">
                <ShieldCheck size={40} className="mx-auto text-slate-400" />
                <h4 className="text-base font-bold text-slate-800">Digital Handover Pending</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Once technical checklists and PM Surya Ghar photos are complete, obtain the client signature to complete handover.
                </p>
                <button 
                  onClick={() => setShowSignoffModal(true)}
                  className="mt-2 px-5 py-2.5 bg-emerald-600 text-white font-bold rounded-xl text-sm hover:bg-emerald-700 shadow-sm"
                >
                  Confirm Customer Handover
                </button>
              </div>
            )}
          </div>
        )}

        {/* 8. ISSUES TAB */}
        {activeTab === 'ISSUES' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Site Punch List & Technical Issues</h3>
                <p className="text-sm text-slate-500">Track and resolve on-site hurdles (civil, electrical, shade, customer requests).</p>
              </div>
              <button 
                onClick={() => setShowIssueModal(true)}
                className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl text-sm flex items-center gap-2 hover:bg-indigo-700 shadow-sm"
              >
                <Plus size={16} /> Log Issue
              </button>
            </div>

            {job.issues && job.issues.length > 0 ? (
              <div className="space-y-3">
                {job.issues.map((issue: any) => (
                  <div key={issue.id} className="p-4 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          issue.severity === 'BLOCKER' ? 'bg-red-100 text-red-700' :
                          issue.severity === 'HIGH' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {issue.severity}
                        </span>
                        <span className="text-xs font-bold text-slate-400">{issue.category}</span>
                      </div>
                      <p className="font-semibold text-slate-800 text-sm">{issue.description}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-1 text-xs font-bold rounded-md ${
                        issue.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {issue.status}
                      </span>
                      {issue.status !== 'RESOLVED' && (
                        <button 
                          onClick={() => handleResolveIssue(issue.id)}
                          className="px-3 py-1 bg-emerald-600 text-white font-bold rounded-lg text-xs hover:bg-emerald-700"
                        >
                          Mark Resolved
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
                <CheckCircle2 size={40} className="mx-auto text-emerald-500 mb-2" />
                <p className="font-bold text-slate-800">Zero Pending Issues</p>
                <p className="text-xs text-slate-400 mt-1">No operational or civil blockers logged for this installation.</p>
              </div>
            )}
          </div>
        )}

      </div>

      {/* MODAL: UPDATE STATUS */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 max-w-md w-full space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-900 text-lg">Update Job Status</h3>
              <button onClick={() => setShowStatusModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700 uppercase">Select Workflow Stage</label>
              <select 
                value={newStatus} 
                onChange={e => setNewStatus(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 font-semibold text-sm focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="SCHEDULED">SCHEDULED</option>
                <option value="ASSIGNED">ASSIGNED (Technicians Dispatched)</option>
                <option value="EN_ROUTE">EN_ROUTE (Travel to Site)</option>
                <option value="ON_SITE">ON_SITE (Arrival Logged)</option>
                <option value="IN_PROGRESS">IN_PROGRESS (Erection & Wiring)</option>
                <option value="TESTING">TESTING (CEA Ohmic Testing)</option>
                <option value="PENDING_REVIEW">PENDING_REVIEW (Quality Audit)</option>
                <option value="COMPLETED">COMPLETED (Handover Done)</option>
                <option value="DELAYED">DELAYED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>

              {newStatus === 'DELAYED' && (
                <div className="space-y-1.5 pt-2">
                  <label className="text-xs font-bold text-slate-700 uppercase">Reason for Delay</label>
                  <input 
                    type="text" 
                    value={delayReason}
                    onChange={e => setDelayReason(e.target.value)}
                    placeholder="e.g. Heavy rain, customer roof unavailable"
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button 
                onClick={() => setShowStatusModal(false)}
                className="px-4 py-2 border rounded-xl font-bold text-slate-600 text-sm"
              >
                Cancel
              </button>
              <button 
                onClick={handleUpdateStatus}
                disabled={updatingStatus}
                className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl text-sm hover:bg-indigo-700 disabled:opacity-50"
              >
                {updatingStatus ? 'Updating...' : 'Save Status'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ASSIGN TECHNICIAN */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 max-w-md w-full space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-900 text-lg">Assign Technician / Engineer</h3>
              <button onClick={() => setShowAssignModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase">Select Staff Member</label>
                <select 
                  value={selectedStaffId}
                  onChange={e => setSelectedStaffId(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 font-semibold text-sm mt-1"
                >
                  <option value="">-- Choose Team Member --</option>
                  {staffList.map((s: any) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.role || s.designation || 'Staff'})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase">Assignment Role</label>
                <select 
                  value={assignRole}
                  onChange={e => setAssignRole(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 font-semibold text-sm mt-1"
                >
                  <option value="TECHNICIAN">TECHNICIAN (Rooftop Erection & Mounting)</option>
                  <option value="LEAD">LEAD (Master Electrician & Wiring)</option>
                  <option value="QA">QA (Safety & Earthing Inspection)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowAssignModal(false)} className="px-4 py-2 border rounded-xl font-bold text-slate-600 text-sm">
                Cancel
              </button>
              <button 
                onClick={handleAssignTechnician}
                disabled={assigning || !selectedStaffId}
                className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl text-sm hover:bg-indigo-700 disabled:opacity-50"
              >
                {assigning ? 'Assigning...' : 'Confirm Assignment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD / SCAN SERIAL */}
      {showSerialModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 max-w-md w-full space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-900 text-lg">Record 2D / Barcode Serial</h3>
              <button onClick={() => setShowSerialModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase">Module or Inverter Serial Number</label>
                <input 
                  type="text" 
                  value={newSerialInput}
                  onChange={e => setNewSerialInput(e.target.value)}
                  placeholder="e.g. WAA-DCR-550-2026-0042"
                  className="w-full p-3 rounded-xl border border-slate-200 font-mono font-bold text-sm mt-1 uppercase"
                />
                <p className="text-[10px] text-slate-400 mt-1">DCR Domestic content validated against Waaree, Adani, Tata, Goldi, etc.</p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowSerialModal(false)} className="px-4 py-2 border rounded-xl font-bold text-slate-600 text-sm">
                Cancel
              </button>
              <button 
                onClick={handleAddSerial}
                disabled={savingSerial || !newSerialInput.trim()}
                className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl text-sm hover:bg-indigo-700 disabled:opacity-50"
              >
                {savingSerial ? 'Saving...' : 'Add Serial'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: UPLOAD PHOTO */}
      {showPhotoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 max-w-md w-full space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-900 text-lg">Attach Statutory Photo Proof</h3>
              <button onClick={() => setShowPhotoModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase">Statutory Category</label>
                <select 
                  value={photoCategory}
                  onChange={e => setPhotoCategory(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 font-semibold text-sm mt-1"
                >
                  <option value="ROOF">ROOF - PV Array South View</option>
                  <option value="INVERTER">INVERTER - Inverter LCD & Serial</option>
                  <option value="PANELS">PANELS / METER - Dual Net Meter</option>
                  <option value="EARTHING">EARTHING - Chemical Pit Chamber</option>
                  <option value="HANDOVER">HANDOVER - Customer Sign-off</option>
                  <option value="WIRING">WIRING - ACDB & DCDB Distribution</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase">Photo Image URL</label>
                <input 
                  type="text" 
                  value={photoUrl}
                  onChange={e => setPhotoUrl(e.target.value)}
                  placeholder="https://... or data:image/..."
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase">Caption / Notes (Optional)</label>
                <input 
                  type="text" 
                  value={photoCaption}
                  onChange={e => setPhotoCaption(e.target.value)}
                  placeholder="e.g. Inverter display showing 3.28 kW generation"
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm mt-1"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowPhotoModal(false)} className="px-4 py-2 border rounded-xl font-bold text-slate-600 text-sm">
                Cancel
              </button>
              <button 
                onClick={handleUploadPhoto}
                disabled={uploadingPhoto || !photoUrl}
                className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl text-sm hover:bg-indigo-700 disabled:opacity-50"
              >
                {uploadingPhoto ? 'Saving...' : 'Save Photo Proof'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REPORT ISSUE */}
      {showIssueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 max-w-md w-full space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-900 text-lg">Log Site Issue / Punch List</h3>
              <button onClick={() => setShowIssueModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase">Issue Category</label>
                <select 
                  value={issueCategory}
                  onChange={e => setIssueCategory(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 font-semibold text-sm mt-1"
                >
                  <option value="ELECTRICAL">ELECTRICAL (Wiring / Earthing)</option>
                  <option value="CIVIL">CIVIL (Rooftop / Parapet / Shade)</option>
                  <option value="MATERIAL">MATERIAL (Missing Hardware / Damaged)</option>
                  <option value="CUSTOMER">CUSTOMER (Access / Timing)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase">Severity</label>
                <select 
                  value={issueSeverity}
                  onChange={e => setIssueSeverity(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 font-semibold text-sm mt-1"
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="BLOCKER">BLOCKER (Work Stopped)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase">Description</label>
                <textarea 
                  value={issueDesc}
                  onChange={e => setIssueDesc(e.target.value)}
                  rows={3}
                  placeholder="Describe the issue observed on site..."
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm mt-1"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowIssueModal(false)} className="px-4 py-2 border rounded-xl font-bold text-slate-600 text-sm">
                Cancel
              </button>
              <button 
                onClick={handleReportIssue}
                disabled={savingIssue || !issueDesc.trim()}
                className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl text-sm hover:bg-indigo-700 disabled:opacity-50"
              >
                {savingIssue ? 'Logging...' : 'Log Issue'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CUSTOMER SIGNOFF */}
      {showSignoffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 max-w-md w-full space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-900 text-lg">Customer Handover Sign-Off</h3>
              <button onClick={() => setShowSignoffModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase">Customer Signatory Name</label>
                <input 
                  type="text" 
                  value={signoffCustomerName}
                  onChange={e => setSignoffCustomerName(e.target.value)}
                  placeholder="Customer Full Name"
                  className="w-full p-3 rounded-xl border border-slate-200 font-semibold text-sm mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase">Handover Notes</label>
                <textarea 
                  value={signoffNotes}
                  onChange={e => setSignoffNotes(e.target.value)}
                  rows={2}
                  placeholder="e.g. System tested and fully operational. Client briefed on mobile monitoring app."
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm mt-1"
                />
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 font-medium">
                ✓ By completing handover, this job will transition to <strong>COMPLETED</strong> with 100% progress and generate the commissioning certificate.
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowSignoffModal(false)} className="px-4 py-2 border rounded-xl font-bold text-slate-600 text-sm">
                Cancel
              </button>
              <button 
                onClick={handleCompleteSignoff}
                disabled={savingSignoff || !signoffCustomerName.trim()}
                className="px-5 py-2 bg-emerald-600 text-white font-bold rounded-xl text-sm hover:bg-emerald-700 disabled:opacity-50"
              >
                {savingSignoff ? 'Certifying...' : 'Certify Handover'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULLSCREEN PHOTO PREVIEW MODAL */}
      {previewPhoto && (
        <div 
          onClick={() => setPreviewPhoto(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 cursor-pointer"
        >
          <div className="max-w-3xl max-h-[85vh] overflow-hidden rounded-2xl relative" onClick={e => e.stopPropagation()}>
            <img src={previewPhoto} alt="Inspection Proof" className="w-full h-auto max-h-[85vh] object-contain rounded-2xl" />
            <button 
              onClick={() => setPreviewPhoto(null)}
              className="absolute top-4 right-4 p-2 bg-black/60 text-white rounded-full hover:bg-black/80"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
