"use client";

import React, { useState } from 'react';
import axios from 'axios';
import { 
  X, Download, Share2, ArrowRight, Lock, CheckCircle2, 
  Clock, AlertTriangle, IndianRupee, Sun, Zap, Shield, 
  Calendar, User, FileText, Check, Phone, MessageSquare, 
  RotateCcw, History, ArrowUpRight
} from 'lucide-react';

interface DetailProps {
  isOpen: boolean;
  onClose: () => void;
  quotation: any;
  onUpdate: () => void;
  onDownloadPdf: (quote: any) => void;
}

export function QuotationDetailModal({ isOpen, onClose, quotation, onUpdate, onDownloadPdf }: DetailProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'revisions' | 'milestones'>('overview');
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<string>(quotation?.status || 'DRAFT');

  if (!isOpen || !quotation) return null;

  const isLocked = quotation.isLocked || quotation.status === 'ACCEPTED';
  const client = quotation.customer || quotation.lead;

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

  // Handle WhatsApp Share
  const handleWhatsAppShare = async () => {
    setLoadingAction('whatsapp');
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/quotations/${quotation.id}/share`,
        { channel: 'whatsapp', recipientPhone: client?.mobile || client?.phone },
        { withCredentials: true }
      );
      if (res.data.whatsappUrl) {
        window.open(res.data.whatsappUrl, '_blank');
      }
      onUpdate();
    } catch (err: any) {
      alert('Failed to initiate WhatsApp share: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoadingAction(null);
    }
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
      alert('Failed to convert quotation: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#071A2B]/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* MODAL HEADER */}
        <div className="bg-[#071A2B] text-white p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-bold px-2.5 py-1 bg-white/10 rounded-lg text-emerald-400 border border-white/10">
                {quotation.qNumber}
              </span>
              {quotation.version > 1 && (
                <span className="text-xs font-bold px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded-full border border-amber-500/30">
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

          <div className="flex items-center gap-2">
            <button
              onClick={() => onDownloadPdf(quotation)}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-colors"
            >
              <Download size={15} /> Download PDF
            </button>
            <button
              onClick={handleWhatsAppShare}
              disabled={loadingAction === 'whatsapp'}
              className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <MessageSquare size={15} /> Share WhatsApp
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* LOCKED STATUS CALLOUT */}
        {isLocked && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-8 py-3 flex items-center justify-between text-xs text-emerald-800">
            <div className="flex items-center gap-2 font-medium">
              <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
              <span>This quotation is accepted and locked against silent modifications. An immutable proposal has been archived.</span>
            </div>
            {quotation.projects && quotation.projects.length > 0 ? (
              <span className="font-bold text-emerald-900 bg-emerald-100 px-3 py-1 rounded-lg">
                Linked Project: {quotation.projects[0].name}
              </span>
            ) : null}
          </div>
        )}

        {/* TABS & STATUS WORKFLOW */}
        <div className="bg-slate-50 border-b border-slate-200 px-8 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'overview' ? 'bg-[#071A2B] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Overview & Commercials
            </button>
            <button
              onClick={() => setActiveTab('milestones')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'milestones' ? 'bg-[#071A2B] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Milestone Schedule
            </button>
            <button
              onClick={() => setActiveTab('revisions')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
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
              value={quotation.status}
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

        {/* MODAL CONTENT */}
        <div className="p-8 max-h-[580px] overflow-y-auto">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
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
                  <p className="text-2xl font-black text-emerald-700 mt-1">{(quotation.annualGeneration || Math.round((quotation.systemCapacity || 5) * 1460)).toLocaleString()} <span className="text-xs font-normal">kWh</span></p>
                  <p className="text-[10px] text-emerald-800 mt-1">~4.0 kWh/kWp/day</p>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Annual Bill Savings</p>
                  <p className="text-2xl font-black text-slate-900 mt-1">₹{(quotation.annualSavings || Math.round((quotation.annualGeneration || 7300) * 8.5)).toLocaleString()}</p>
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
                <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Technical Specifications</h3>
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
                  <button
                    onClick={handleConvertToProject}
                    disabled={loadingAction === 'convert'}
                    className="px-5 py-2.5 bg-[#071A2B] hover:bg-[#0B2942] text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all disabled:opacity-50"
                  >
                    {loadingAction === 'convert' ? 'Converting...' : 'Convert to Active Project'} <ArrowRight size={15} />
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: MILESTONES */}
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

          {/* TAB 3: REVISIONS */}
          {activeTab === 'revisions' && (
            <div className="space-y-4">
              <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Immutable Revision Audit Trail</h3>
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
                  <p className="text-[11px] text-slate-400 mt-1">No modifications have been made since proposal creation.</p>
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
