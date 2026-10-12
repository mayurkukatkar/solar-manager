"use client";

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
  X, Download, Share2, ArrowRight, Lock, CheckCircle2, 
  Clock, AlertTriangle, IndianRupee, Sun, Zap, Shield, 
  Calendar, User, FileText, Check, Phone, MessageSquare, 
  RotateCcw, History, ArrowUpRight, Edit3, Trash2, Eye,
  Copy, CheckCheck, Printer, Plus, Save, ExternalLink,
  Package, Layers, Sparkles, Loader2
} from 'lucide-react';
import { QuotationPDF, QuotationData, mapQuotationToPdfData, generatePDF } from '@/components/pdf/QuotationPDF';

interface DetailProps {
  isOpen: boolean;
  onClose: () => void;
  quotation: any;
  onUpdate: () => void;
  onDownloadPdf?: (quote: any) => void;
  tenantInfo?: any;
  initialTab?: 'overview' | 'preview' | 'milestones' | 'revisions';
}

export function QuotationDetailModal({ 
  isOpen, 
  onClose, 
  quotation, 
  onUpdate, 
  onDownloadPdf,
  tenantInfo,
  initialTab = 'overview'
}: DetailProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'preview' | 'milestones' | 'revisions'>(initialTab);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<string>(quotation?.status || 'DRAFT');

  // EDIT STATE
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<any>(null);

  // REVISION MODAL STATE
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [revisionReason, setRevisionReason] = useState('Customer negotiated price & adjusted hardware specifications');

  // WHATSAPP DRAWER STATE
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [whatsAppPhone, setWhatsAppPhone] = useState('');
  const [whatsAppText, setWhatsAppText] = useState('');
  const [copiedPitch, setCopiedPitch] = useState(false);
  const [isDownloadingWhatsAppPdf, setIsDownloadingWhatsAppPdf] = useState(false);

  // Sync initial tab and quotation changes
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, quotation?.id]);

  // Initialize edit form data when quotation changes
  useEffect(() => {
    if (quotation) {
      setNewStatus(quotation.status || 'DRAFT');
      const client = quotation.customer || quotation.lead;
      const phone = client?.mobile || client?.phone || '';
      const rawDigits = phone.replace(/[^0-9]/g, '');
      const normalizedPhone = rawDigits.startsWith('91') ? rawDigits.slice(2) : rawDigits.replace(/^0+/, '');
      setWhatsAppPhone(normalizedPhone || phone);

      const tenantName = tenantInfo?.legalName || tenantInfo?.name || 'WhereReady Solar';
      const webProposalUrl = typeof window !== 'undefined' ? `${window.location.origin}/tenant/quotations/pdf-demo` : '';
      const msg = `Dear ${client?.name || 'Valued Customer'},\n\nGreetings from *${tenantName}*!\n\nWe have prepared your personalized Solar Project Proposal for *${quotation.systemCapacity || 5} kWp Rooftop System*.\n\n*Proposal Highlights:*\n• System Capacity: ${quotation.systemCapacity || 5} kWp (${quotation.systemType || 'On-grid'})\n• Total Investment: ₹${(quotation.total || 0).toLocaleString()}\n• Est. Annual Savings: ₹${(quotation.annualSavings || Math.round((quotation.systemCapacity || 5) * 1460 * 8.5)).toLocaleString()}\n${quotation.indicativeSubsidy > 0 ? `• Indicative Central Subsidy: ₹${quotation.indicativeSubsidy.toLocaleString()}\n• Net Outflow: ₹${Math.max(0, (quotation.total || 0) - quotation.indicativeSubsidy).toLocaleString()}\n` : ''}• Proposal No: ${quotation.qNumber}\n• Valid Until: ${quotation.validityDays || 15} Days\n• 📄 Attached PDF: Proposal_${quotation.qNumber}.pdf\n• 🌐 View Online Proposal: ${webProposalUrl}\n\nPlease review your complete proposal. Feel free to contact us for any technical or commercial queries!\n\nBest Regards,\n*${tenantName}*\nPhone: ${tenantInfo?.phone || '+91 98220 12345'}`;
      setWhatsAppText(msg);

      setEditFormData({
        systemCapacity: quotation.systemCapacity || 5.0,
        systemType: quotation.systemType || 'On-grid',
        connectionType: quotation.connectionType || 'Residential',
        phase: quotation.phase || 'Single Phase',
        roofType: quotation.roofType || 'RCC Flat Roof',
        panelBrand: quotation.panelBrand || 'Waaree',
        panelModel: quotation.panelModel || '550Wp Mono PERC Bifacial',
        panelWattage: quotation.panelWattage || 550,
        panelQuantity: quotation.panelQuantity || 9,
        panelWarranty: quotation.panelWarranty || '25 Years OEM Performance',
        inverterBrand: quotation.inverterBrand || 'Growatt',
        inverterModel: quotation.inverterModel || '5kW Single Phase On-Grid Inverter',
        inverterCapacity: quotation.inverterCapacity || 5.0,
        inverterWarranty: quotation.inverterWarranty || '10 Years Replacement',
        structureBrand: quotation.structureBrand || 'Galvanized HDG High Rise',
        subtotal: quotation.subtotal || quotation.total || 275000,
        discount: quotation.discount || 0,
        tax: quotation.tax || 0,
        validityDays: quotation.validityDays || 15,
        items: Array.isArray(quotation.items) && quotation.items.length > 0
          ? quotation.items.map((it: any) => ({
              id: it.id,
              productId: it.productId || null,
              description: it.description,
              quantity: it.quantity || 1,
              unitPrice: it.unitPrice || 0,
              taxRate: it.taxRate || 0,
              total: it.total || (it.quantity * it.unitPrice)
            }))
          : [
              {
                id: 'item-1',
                description: `${quotation.systemCapacity || 5} kWp Solar PV Power Plant Equipment`,
                quantity: 1,
                unitPrice: Math.round((quotation.subtotal || quotation.total || 275000) * 0.8),
                taxRate: 12,
                total: Math.round((quotation.subtotal || quotation.total || 275000) * 0.8)
              },
              {
                id: 'item-2',
                description: 'Comprehensive Installation, Testing, Liasoning & Commissioning',
                quantity: 1,
                unitPrice: Math.round((quotation.subtotal || quotation.total || 275000) * 0.2),
                taxRate: 18,
                total: Math.round((quotation.subtotal || quotation.total || 275000) * 0.2)
              }
            ]
      });
    }
  }, [quotation, tenantInfo]);

  // Derived state (evaluated unconditionally for strict Hook Rules compliance)
  const isLocked = quotation ? (quotation.isLocked || quotation.status === 'ACCEPTED') : false;
  const client = quotation ? (quotation.customer || quotation.lead) : null;
  const linkedProjects = quotation?.projects || [];
  const hasLinkedProject = linkedProjects.length > 0;

  // Build PDF Data Object for In-App Live Preview & Direct Download (Unconditional useMemo)
  const pdfProposalData: QuotationData | null = useMemo(() => {
    if (!quotation) return null;
    return mapQuotationToPdfData(quotation, tenantInfo);
  }, [quotation, tenantInfo]);

  // Handle status update
  const handleStatusChange = async (status: string) => {
    setLoadingAction('status');
    try {
      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/quotations/${quotation.id}`,
        { status },
        { withCredentials: true }
      );
      setNewStatus(status);
      onUpdate();
    } catch (err: any) {
      alert('Failed to update status: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoadingAction(null);
    }
  };

  // Handle Save Edited Quotation
  const handleSaveEdit = async () => {
    setLoadingAction('saveEdit');
    try {
      const itemsSubtotal = (editFormData.items || []).reduce(
        (sum: number, it: any) => sum + (Number(it.quantity) * Number(it.unitPrice)), 
        0
      );
      const itemsTax = (editFormData.items || []).reduce(
        (sum: number, it: any) => sum + Math.round((Number(it.quantity) * Number(it.unitPrice)) * ((Number(it.taxRate) || 0) / 100)), 
        0
      );

      const payload = {
        systemCapacity: Number(editFormData.systemCapacity),
        systemType: editFormData.systemType,
        connectionType: editFormData.connectionType,
        phase: editFormData.phase,
        roofType: editFormData.roofType,
        panelBrand: editFormData.panelBrand,
        panelModel: editFormData.panelModel,
        panelWattage: Number(editFormData.panelWattage),
        panelQuantity: Number(editFormData.panelQuantity),
        panelWarranty: editFormData.panelWarranty,
        inverterBrand: editFormData.inverterBrand,
        inverterModel: editFormData.inverterModel,
        inverterCapacity: Number(editFormData.inverterCapacity),
        inverterWarranty: editFormData.inverterWarranty,
        structureBrand: editFormData.structureBrand,
        subtotal: itemsSubtotal,
        tax: itemsTax,
        discount: Number(editFormData.discount) || 0,
        validityDays: Number(editFormData.validityDays) || 15,
        items: editFormData.items.map((it: any) => ({
          productId: it.productId || null,
          description: it.description,
          quantity: Number(it.quantity) || 1,
          unitPrice: Number(it.unitPrice) || 0,
          taxRate: Number(it.taxRate) || 0,
          total: Math.round(Number(it.quantity) * Number(it.unitPrice))
        }))
      };

      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/quotations/${quotation.id}`,
        payload,
        { withCredentials: true }
      );

      setIsEditing(false);
      onUpdate();
    } catch (err: any) {
      alert('Failed to update quotation: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoadingAction(null);
    }
  };

  // Handle Create Formal Revision
  const handleCreateRevision = async () => {
    setLoadingAction('revision');
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/quotations/${quotation.id}/revision`,
        { revisionReason },
        { withCredentials: true }
      );
      setShowRevisionModal(false);
      onUpdate();
      setIsEditing(true); // Open edit mode right away for revised quote
    } catch (err: any) {
      alert('Failed to create revision: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoadingAction(null);
    }
  };

  // Handle WhatsApp Link Open
  const handleWhatsAppOpen = async () => {
    const rawDigits = whatsAppPhone.replace(/[^0-9]/g, '');
    const cleanDigits = rawDigits.startsWith('91') ? rawDigits : rawDigits.replace(/^0+/, '');
    const finalPhone = cleanDigits.startsWith('91') ? cleanDigits : (cleanDigits ? '91' + cleanDigits : '');
    const url = `https://wa.me/${finalPhone}?text=${encodeURIComponent(whatsAppText)}`;
    window.open(url, '_blank');

    // Mark as sent if draft
    if (quotation.status === 'DRAFT') {
      await handleStatusChange('SENT');
    }
    setShowWhatsAppModal(false);
  };

  // Copy WhatsApp Pitch
  const handleCopyPitch = () => {
    navigator.clipboard.writeText(whatsAppText);
    setCopiedPitch(true);
    setTimeout(() => setCopiedPitch(false), 2000);
  };

  // Handle Convert to Project
  const handleConvertToProject = async () => {
    if (!confirm(`Convert Quotation ${quotation.qNumber} into an active Project? This will lock the quotation and scaffold site survey tasks and milestone schedules.`)) {
      return;
    }

    setLoadingAction('convert');
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/quotations/${quotation.id}/convert`,
        {},
        { withCredentials: true }
      );
      alert(`Success! Project ${res.data.project?.name || ''} has been created without re-entering any data.`);
      onUpdate();
      onClose();
    } catch (err: any) {
      const errMsg = err.response?.data?.details || err.response?.data?.error || err.message;
      alert('Failed to convert quotation: ' + errMsg);
    } finally {
      setLoadingAction(null);
    }
  };

  // Handle Delete Quotation
  const handleDeleteQuotation = async () => {
    if (hasLinkedProject) {
      alert('Cannot delete quotation that is converted to an active project.');
      return;
    }

    if (!confirm(`Are you sure you want to permanently delete quotation ${quotation.qNumber}? This action cannot be undone.`)) {
      return;
    }

    setLoadingAction('delete');
    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/quotations/${quotation.id}`,
        { withCredentials: true }
      );
      alert(`Quotation ${quotation.qNumber} deleted successfully.`);
      onUpdate();
      onClose();
    } catch (err: any) {
      alert('Failed to delete quotation: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoadingAction(null);
    }
  };

  // Guard return immediately before JSX rendering (after all React hooks have run unconditionally)
  if (!isOpen || !quotation) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#071A2B]/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        
        {/* MODAL HEADER */}
        <div className="bg-[#071A2B] text-white p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 flex-shrink-0">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-bold px-2.5 py-1 bg-white/10 rounded-lg text-emerald-400 border border-white/10">
                {quotation.qNumber}
              </span>
              {quotation.version > 1 && (
                <span className="text-xs font-bold px-2.5 py-0.5 bg-amber-500/20 text-amber-300 rounded-full border border-amber-500/30">
                  Revision v{quotation.version}
                </span>
              )}
              {isLocked && (
                <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-500/30">
                  <Lock size={12} /> Accepted & Locked
                </span>
              )}
            </div>
            <h2 className="text-2xl font-black tracking-tight mt-2">{client?.name || 'Customer Proposal'}</h2>
            <p className="text-xs text-slate-300 mt-1 flex items-center gap-3">
              <span>{quotation.systemCapacity || 5} kWp {quotation.systemType || 'On-grid'}</span>
              <span>·</span>
              <span>Created: {new Date(quotation.date).toLocaleDateString()}</span>
              <span>·</span>
              <span>Valid: {quotation.validityDays || 15} Days</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!isEditing && (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Edit3 size={14} /> Edit
                </button>
                <button
                  onClick={() => setShowRevisionModal(true)}
                  className="px-3.5 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <History size={14} /> Revise (v{(quotation.version || 1) + 1})
                </button>
                <button
                  onClick={async () => {
                    setActiveTab('preview');
                    setTimeout(async () => {
                      try {
                        setLoadingAction('pdf');
                        const filename = `Proposal_${quotation.qNumber || 'QT'}.pdf`;
                        const { generatePDF } = await import('@/components/pdf/QuotationPDF');
                        await generatePDF('detail-modal-pdf-content', filename);
                      } catch (err) {
                        console.error('PDF generation fallback to print:', err);
                        window.print();
                      } finally {
                        setLoadingAction(null);
                      }
                    }, 350);
                  }}
                  disabled={loadingAction === 'pdf'}
                  className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
                >
                  <Download size={14} /> {loadingAction === 'pdf' ? 'Generating...' : 'Download PDF'}
                </button>
                <button
                  onClick={() => setShowWhatsAppModal(true)}
                  className="px-3.5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <MessageSquare size={14} /> WhatsApp
                </button>
                {!hasLinkedProject && (
                  <button
                    onClick={handleDeleteQuotation}
                    disabled={loadingAction === 'delete'}
                    title="Delete Draft Quotation"
                    className="p-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-xl transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </>
            )}

            {isEditing && (
              <>
                <button
                  onClick={handleSaveEdit}
                  disabled={loadingAction === 'saveEdit'}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors disabled:opacity-50"
                >
                  <Save size={14} /> Save Changes
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-2.5 bg-white/10 hover:bg-white/20 text-slate-300 rounded-xl text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
              </>
            )}

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors ml-1"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* LOCKED STATUS CALLOUT */}
        {isLocked && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-6 sm:px-8 py-3 flex items-center justify-between text-xs text-emerald-800 flex-shrink-0">
            <div className="flex items-center gap-2 font-medium">
              <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
              <span>This proposal is accepted and locked against silent tampering. An immutable snapshot is preserved.</span>
            </div>
            {hasLinkedProject ? (
              <span className="font-bold text-emerald-900 bg-emerald-100 px-3 py-1 rounded-lg flex items-center gap-1">
                Linked Project: {linkedProjects[0].name}
              </span>
            ) : null}
          </div>
        )}

        {/* TABS & STATUS WORKFLOW */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 sm:px-8 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4 flex-shrink-0">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'overview' ? 'bg-[#071A2B] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Overview & Commercials
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'preview' ? 'bg-[#071A2B] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye size={13} />
              In-App Proposal Preview (A4)
            </button>
            <button
              onClick={() => setActiveTab('milestones')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'milestones' ? 'bg-[#071A2B] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Milestone Schedule
            </button>
            <button
              onClick={() => setActiveTab('revisions')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'revisions' ? 'bg-[#071A2B] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <History size={13} />
              Revisions ({Array.isArray(quotation.revisionHistory) ? quotation.revisionHistory.length : 0})
            </button>
          </div>

          {/* STATUS SELECTOR */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status:</span>
            <select
              value={newStatus}
              disabled={loadingAction === 'status'}
              onChange={e => handleStatusChange(e.target.value)}
              className="text-xs font-extrabold px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="DRAFT">Draft</option>
              <option value="SENT">Sent</option>
              <option value="VIEWED">Viewed</option>
              <option value="NEGOTIATION">Negotiation</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="REJECTED">Rejected</option>
              <option value="EXPIRED">Expired</option>
            </select>
          </div>
        </div>

        {/* MODAL BODY (SCROLLABLE) */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1">
          
          {/* TAB 1: OVERVIEW & COMMERCIALS */}
          {activeTab === 'overview' && !isEditing && (
            <div className="space-y-6">
              
              {/* TOP METRICS GRID */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Payable</p>
                  <p className="text-2xl font-black text-[#071A2B] mt-1">₹{(quotation.total || 0).toLocaleString()}</p>
                  <p className="text-[10px] text-slate-500 mt-1">Subtotal ₹{(quotation.subtotal || 0).toLocaleString()}</p>
                </div>

                <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200">
                  <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Est. Annual Generation</p>
                  <p className="text-2xl font-black text-emerald-700 mt-1">
                    {(quotation.annualGeneration || Math.round((quotation.systemCapacity || 5) * 1460)).toLocaleString()} <span className="text-xs font-normal">kWh</span>
                  </p>
                  <p className="text-[10px] text-emerald-800 mt-1">~4.0 kWh/kWp/day</p>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Annual Bill Savings</p>
                  <p className="text-2xl font-black text-slate-900 mt-1">
                    ₹{(quotation.annualSavings || Math.round((quotation.annualGeneration || 7300) * 8.5)).toLocaleString()}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">MSEDCL Solar Net Metering</p>
                </div>

                <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200">
                  <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Payback Period</p>
                  <p className="text-2xl font-black text-amber-900 mt-1">{quotation.paybackYears || 4.5} <span className="text-xs font-normal">Years</span></p>
                  <p className="text-[10px] text-amber-800 mt-1">25-Year System Life</p>
                </div>
              </div>

              {/* TECHNICAL SPECIFICATIONS */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Technical Specifications</h3>
                  <span className="text-[11px] text-slate-400">Maharashtra Grid Code Compliant</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-3 gap-x-6 text-xs">
                  <div>
                    <span className="text-slate-400 block">System Type:</span>
                    <span className="font-bold text-slate-800">{quotation.systemType || 'On-grid'} ({quotation.phase || 'Single Phase'})</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">PV Modules:</span>
                    <span className="font-bold text-slate-800">{quotation.panelBrand || 'Waaree'} {quotation.panelWattage || 550}W ({quotation.panelQuantity || 9} Panels)</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Inverter:</span>
                    <span className="font-bold text-slate-800">{quotation.inverterBrand || 'Growatt'} {quotation.inverterCapacity || quotation.systemCapacity} kW</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Mounting Structure:</span>
                    <span className="font-bold text-slate-800">{quotation.structureBrand || 'Galvanized HDG High Rise'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Roof Architecture:</span>
                    <span className="font-bold text-slate-800">{quotation.roofType || 'RCC Flat Roof'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Tariff Category:</span>
                    <span className="font-bold text-slate-800">{quotation.connectionType || 'Residential'}</span>
                  </div>
                </div>
              </div>

              {/* ITEMIZED LINE ITEMS */}
              <div className="space-y-3">
                <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Commercial Line Items Breakdown</h3>
                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-4">Item & Description</th>
                        <th className="py-2.5 px-3 text-center">Qty</th>
                        <th className="py-2.5 px-3 text-right">Unit Rate (₹)</th>
                        <th className="py-2.5 px-3 text-center">Tax %</th>
                        <th className="py-2.5 px-4 text-right">Total Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(Array.isArray(quotation.items) && quotation.items.length > 0 ? quotation.items : [
                        { description: `${quotation.systemCapacity || 5} kWp Solar PV Power Plant Equipment`, quantity: 1, unitPrice: Math.round((quotation.subtotal || quotation.total) * 0.8), taxRate: 12, total: Math.round((quotation.subtotal || quotation.total) * 0.8) },
                        { description: 'Installation, Engineering & Commissioning', quantity: 1, unitPrice: Math.round((quotation.subtotal || quotation.total) * 0.2), taxRate: 18, total: Math.round((quotation.subtotal || quotation.total) * 0.2) }
                      ]).map((item: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-4 font-bold text-slate-800">{item.description}</td>
                          <td className="py-3 px-3 text-center font-medium text-slate-600">{item.quantity}</td>
                          <td className="py-3 px-3 text-right font-medium text-slate-600">₹{(item.unitPrice || 0).toLocaleString()}</td>
                          <td className="py-3 px-3 text-center font-medium text-slate-500">{item.taxRate || 0}%</td>
                          <td className="py-3 px-4 text-right font-black text-[#071A2B]">₹{(item.total || (item.quantity * item.unitPrice)).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* CONDITIONAL SUBSIDY */}
              {quotation.indicativeSubsidy > 0 && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs flex items-center justify-between">
                  <div>
                    <p className="font-bold text-emerald-900">PM Surya Ghar Central Subsidy: ₹{quotation.indicativeSubsidy.toLocaleString()}</p>
                    <p className="text-slate-600 mt-0.5 text-[11px]">
                      Conditional estimate credited directly to customer's account by MNRE upon MSEDCL net meter installation.
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Effective Outflow</span>
                    <p className="text-lg font-black text-[#071A2B]">
                      ₹{Math.max(0, (quotation.total || 0) - quotation.indicativeSubsidy).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}

              {/* ACTIONS FOOTER */}
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100">
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span>Views: {quotation.viewCount || 0}</span>
                  {quotation.sentAt && <span>· Sent: {new Date(quotation.sentAt).toLocaleDateString()}</span>}
                  {quotation.viewedAt && <span>· Last Viewed: {new Date(quotation.viewedAt).toLocaleDateString()}</span>}
                </div>

                <div className="flex items-center gap-3">
                  {!hasLinkedProject ? (
                    <button
                      onClick={handleConvertToProject}
                      disabled={loadingAction === 'convert'}
                      className="px-5 py-2.5 bg-[#071A2B] hover:bg-[#0B2942] text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all disabled:opacity-50"
                    >
                      {loadingAction === 'convert' ? 'Converting...' : 'Convert to Active Project'} <ArrowRight size={15} />
                    </button>
                  ) : (
                    <span className="px-4 py-2 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-1.5">
                      <CheckCircle2 size={15} className="text-emerald-600" /> Active Project Scaffolded
                    </span>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* EDIT MODE */}
          {isEditing && editFormData && (
            <div className="space-y-6">
              <div className="flex items-center justify-between bg-amber-50 p-4 rounded-2xl border border-amber-200 text-xs">
                <div className="flex items-center gap-2 font-bold text-amber-900">
                  <Edit3 size={16} className="text-amber-600" />
                  <span>Editing Quotation {quotation.qNumber}</span>
                </div>
                <span className="text-amber-700">Modify system specs, items and commercials</span>
              </div>

              {/* SYSTEM CONFIGURATION */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 uppercase">System Capacity (kWp)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={editFormData.systemCapacity}
                    onChange={e => setEditFormData({ ...editFormData, systemCapacity: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 uppercase">Module Make</label>
                  <input
                    type="text"
                    value={editFormData.panelBrand}
                    onChange={e => setEditFormData({ ...editFormData, panelBrand: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 uppercase">Module Count</label>
                  <input
                    type="number"
                    value={editFormData.panelQuantity}
                    onChange={e => setEditFormData({ ...editFormData, panelQuantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 uppercase">Inverter Brand</label>
                  <input
                    type="text"
                    value={editFormData.inverterBrand}
                    onChange={e => setEditFormData({ ...editFormData, inverterBrand: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 uppercase">Structure Type</label>
                  <input
                    type="text"
                    value={editFormData.structureBrand}
                    onChange={e => setEditFormData({ ...editFormData, structureBrand: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 uppercase">Special Discount (₹)</label>
                  <input
                    type="number"
                    value={editFormData.discount}
                    onChange={e => setEditFormData({ ...editFormData, discount: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 font-bold text-emerald-600"
                  />
                </div>
              </div>

              {/* EDITABLE LINE ITEMS */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Itemized Line Items</h3>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = [...editFormData.items, {
                        id: `item-${Date.now()}`,
                        description: 'Custom Service / Hardware',
                        quantity: 1,
                        unitPrice: 5000,
                        taxRate: 18,
                        total: 5900
                      }];
                      setEditFormData({ ...editFormData, items: updated });
                    }}
                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold flex items-center gap-1 text-slate-700"
                  >
                    <Plus size={13} /> Add Line Item
                  </button>
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Description</th>
                        <th className="py-2.5 px-2 w-20">Qty</th>
                        <th className="py-2.5 px-2 w-28">Unit Rate (₹)</th>
                        <th className="py-2.5 px-2 w-20">GST %</th>
                        <th className="py-2.5 px-2 text-center w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {editFormData.items.map((item: any, idx: number) => (
                        <tr key={idx}>
                          <td className="p-2">
                            <input
                              type="text"
                              value={item.description}
                              onChange={e => {
                                const updated = [...editFormData.items];
                                updated[idx].description = e.target.value;
                                setEditFormData({ ...editFormData, items: updated });
                              }}
                              className="w-full px-2 py-1 bg-slate-50 rounded-lg border border-slate-200 font-medium text-xs"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={e => {
                                const updated = [...editFormData.items];
                                updated[idx].quantity = Number(e.target.value);
                                setEditFormData({ ...editFormData, items: updated });
                              }}
                              className="w-full px-2 py-1 bg-slate-50 rounded-lg border border-slate-200 font-bold text-center text-xs"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              value={item.unitPrice}
                              onChange={e => {
                                const updated = [...editFormData.items];
                                updated[idx].unitPrice = Number(e.target.value);
                                setEditFormData({ ...editFormData, items: updated });
                              }}
                              className="w-full px-2 py-1 bg-slate-50 rounded-lg border border-slate-200 font-bold text-xs"
                            />
                          </td>
                          <td className="p-2">
                            <select
                              value={item.taxRate}
                              onChange={e => {
                                const updated = [...editFormData.items];
                                updated[idx].taxRate = Number(e.target.value);
                                setEditFormData({ ...editFormData, items: updated });
                              }}
                              className="w-full px-1.5 py-1 bg-slate-50 rounded-lg border border-slate-200 font-bold text-xs"
                            >
                              <option value="0">0%</option>
                              <option value="5">5%</option>
                              <option value="12">12%</option>
                              <option value="18">18%</option>
                            </select>
                          </td>
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                const updated = editFormData.items.filter((_: any, i: number) => i !== idx);
                                setEditFormData({ ...editFormData, items: updated });
                              }}
                              className="text-slate-400 hover:text-red-600 p-1"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: IN-APP LIVE PROPOSAL PREVIEW (A4) */}
          {activeTab === 'preview' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
                <div>
                  <p className="font-bold text-slate-800">Live Rendered Proposal Document</p>
                  <p className="text-slate-500 text-[11px]">Visual representation of the proposal as presented to the customer.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-bold flex items-center gap-1.5 shadow-sm transition-colors text-xs"
                  >
                    <Printer size={14} /> Print / Save PDF
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        setLoadingAction('pdfPreview');
                        const filename = `Proposal_${quotation.qNumber || 'QT'}.pdf`;
                        const { generatePDF } = await import('@/components/pdf/QuotationPDF');
                        await generatePDF('detail-modal-pdf-content', filename);
                      } catch (err) {
                        console.error(err);
                        window.print();
                      } finally {
                        setLoadingAction(null);
                      }
                    }}
                    disabled={loadingAction === 'pdfPreview'}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-sm transition-colors text-xs"
                  >
                    <Download size={14} /> {loadingAction === 'pdfPreview' ? 'Downloading...' : 'Download PDF'}
                  </button>
                </div>
              </div>

              {/* RENDERED PREVIEW CONTAINER */}
              <div className="border border-slate-200 rounded-3xl overflow-hidden shadow-inner bg-slate-100 p-4 sm:p-6 flex justify-center max-h-[620px] overflow-y-auto">
                <div id="detail-modal-pdf-content" className="w-full max-w-[850px] shadow-2xl rounded-2xl overflow-hidden bg-white">
                  <QuotationPDF data={pdfProposalData} />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MILESTONES */}
          {activeTab === 'milestones' && (
            <div className="space-y-4">
              <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Payment Milestone Schedule</h3>
              <div className="space-y-3">
                {Array.isArray(quotation.paymentMilestones) && quotation.paymentMilestones.length > 0 ? (
                  quotation.paymentMilestones.map((m: any, idx: number) => (
                    <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <span className="w-12 py-1.5 bg-[#071A2B] text-white rounded-lg text-center font-bold">
                          {m.percentage}%
                        </span>
                        <div>
                          <p className="font-bold text-slate-800">{m.description}</p>
                          <p className="text-[11px] text-slate-400">Milestone Stage 0{idx + 1}</p>
                        </div>
                      </div>
                      <span className="text-sm font-black text-slate-900">
                        ₹{(m.amount || Math.round(quotation.total * (m.percentage / 100))).toLocaleString()}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 text-center py-6">No milestones defined for this quotation.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: REVISIONS */}
          {activeTab === 'revisions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Immutable Revision Audit Trail</h3>
                <button
                  onClick={() => setShowRevisionModal(true)}
                  className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <History size={13} /> Create New Revision
                </button>
              </div>

              {Array.isArray(quotation.revisionHistory) && quotation.revisionHistory.length > 0 ? (
                <div className="space-y-3">
                  {quotation.revisionHistory.map((rev: any, idx: number) => (
                    <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">Revision Version v{rev.version}</span>
                        <span className="text-slate-400">{new Date(rev.savedAt).toLocaleString()}</span>
                      </div>
                      <p className="text-slate-600 font-medium">{rev.reason}</p>
                      <div className="p-3 bg-white rounded-xl border border-slate-200 flex justify-between text-[11px] text-slate-500">
                        <span>Total: ₹{(rev.snapshot?.total || 0).toLocaleString()}</span>
                        <span>Capacity: {rev.snapshot?.systemCapacity || 5} kWp</span>
                        <span>Status: {rev.snapshot?.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 bg-slate-50 rounded-2xl border border-slate-200">
                  <CheckCircle2 size={32} className="text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-600">Original Version v1</p>
                  <p className="text-[11px] text-slate-400 mt-1">No prior revisions have been made since proposal creation.</p>
                </div>
              )}
            </div>
          )}

        </div>

      </div>

      {/* REVISION REASON MODAL */}
      {showRevisionModal && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-md w-full space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <History size={16} className="text-amber-600" />
                Create Proposal Revision (v{(quotation.version || 1) + 1})
              </h3>
              <button onClick={() => setShowRevisionModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Archiving current snapshot v{quotation.version || 1} into the immutable audit trail. Please enter the reason for this commercial/technical revision.
            </p>
            <textarea
              value={revisionReason}
              onChange={e => setRevisionReason(e.target.value)}
              rows={3}
              placeholder="e.g., Client requested 540W modules instead of 550W and negotiated ₹15,000 discount"
              className="w-full p-3 rounded-xl border border-slate-200 text-xs font-medium outline-none focus:ring-2 focus:ring-amber-500"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowRevisionModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateRevision}
                disabled={loadingAction === 'revision'}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors disabled:opacity-50"
              >
                {loadingAction === 'revision' ? 'Creating...' : 'Confirm Revision'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WHATSAPP SHARE DRAWER / MODAL */}
      {showWhatsAppModal && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-lg w-full space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <MessageSquare size={16} className="text-emerald-600" />
                Share Proposal via WhatsApp
              </h3>
              <button onClick={() => setShowWhatsAppModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 uppercase">Customer Phone Number</label>
              <input
                type="text"
                value={whatsAppPhone}
                onChange={e => setWhatsAppPhone(e.target.value)}
                placeholder="+91 98220 12345"
                className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 uppercase">Message Preview</label>
              <textarea
                value={whatsAppText}
                onChange={e => setWhatsAppText(e.target.value)}
                rows={7}
                className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono leading-relaxed outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* 1-CLICK ATTACHMENT ACTION */}
            <div className="p-3 bg-emerald-50/80 rounded-xl border border-emerald-200/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold text-emerald-900 flex items-center gap-1.5">
                  <FileText size={14} className="text-emerald-700" />
                  PDF Proposal Attachment
                </span>
                <span className="text-[11px] font-bold text-emerald-700 bg-white px-2 py-0.5 rounded-full border border-emerald-200">
                  Proposal_{quotation.qNumber}.pdf
                </span>
              </div>
              <p className="text-[11px] text-emerald-800 leading-tight">
                Tip: 1. Click below to download the PDF. 2. Click "Open WhatsApp" and drag & drop or attach the downloaded PDF into your chat!
              </p>
              <button
                type="button"
                onClick={async () => {
                  try {
                    setIsDownloadingWhatsAppPdf(true);
                    const filename = `Proposal_${quotation.qNumber || 'QT'}.pdf`;
                    await generatePDF('detail-modal-pdf-content', filename);
                  } catch (err) {
                    console.error('WhatsApp PDF download error:', err);
                    window.print();
                  } finally {
                    setIsDownloadingWhatsAppPdf(false);
                  }
                }}
                disabled={isDownloadingWhatsAppPdf}
                className="w-full py-2 px-3 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
              >
                {isDownloadingWhatsAppPdf ? (
                  <Loader2 size={14} className="animate-spin text-emerald-700" />
                ) : (
                  <Download size={14} className="text-emerald-700" />
                )}
                {isDownloadingWhatsAppPdf ? 'Preparing PDF...' : 'Download PDF to Attach (1-Click)'}
              </button>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleCopyPitch}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
              >
                {copiedPitch ? <CheckCheck size={14} className="text-emerald-600" /> : <Copy size={14} />}
                {copiedPitch ? 'Copied!' : 'Copy Pitch'}
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowWhatsAppModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleWhatsAppOpen}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 transition-colors"
                >
                  <MessageSquare size={14} /> Open WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
