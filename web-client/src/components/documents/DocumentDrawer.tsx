"use client";

import React, { useState } from 'react';
import { 
  X, ExternalLink, Download, FileText, CheckCircle, XCircle, 
  AlertTriangle, FileBadge2, User, Calendar, HardDrive, 
  ShieldCheck, Share2, Eye, Lock, RefreshCw, Copy, Check
} from 'lucide-react';
import axios from 'axios';

export default function DocumentDrawer({ 
  document, 
  isOpen, 
  onClose,
  onUpdate
}: { 
  document: any | null; 
  isOpen: boolean; 
  onClose: () => void;
  onUpdate: () => void;
}) {
  const [rejecting, setRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen || !document) return null;

  const isImage = document.fileUrl && /\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i.test(document.fileUrl);
  const isPdf = document.fileUrl && (/\.pdf(\?.*)?$/i.test(document.fileUrl) || document.fileType?.includes('pdf'));

  const handleVerify = async () => {
    setActionLoading(true);
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/documents/${document.id}/verify`, 
        {}, 
        { withCredentials: true }
      );
      onUpdate();
    } catch (err) {
      console.error(err);
      alert('Failed to verify document');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    const finalReason = rejectReason === 'Other' ? customReason : (rejectReason || customReason);
    if (!finalReason) {
      alert('Please select or specify a reason for rejection.');
      return;
    }

    setActionLoading(true);
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/documents/${document.id}/reject`, 
        { reason: finalReason }, 
        { withCredentials: true }
      );
      setRejecting(false);
      setRejectReason('');
      setCustomReason('');
      onUpdate();
    } catch (err) {
      console.error(err);
      alert('Failed to reject document');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (document.fileUrl) {
      navigator.clipboard.writeText(document.fileUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleShareWhatsApp = () => {
    const custPhone = document.customer?.mobile;
    const cleanPhone = custPhone ? custPhone.replace(/[^0-9]/g, '') : '';
    const target = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    
    const text = encodeURIComponent(
      `*Document Update: ${document.title}*\n` +
      `Category: ${document.category || 'General'}\n` +
      `Status: ${document.status}\n\n` +
      `Secure Download Link:\n${document.fileUrl}`
    );

    const waUrl = target ? `https://wa.me/${target}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(waUrl, '_blank');
  };

  const REJECTION_PRESETS = [
    'Blurry or unreadable photo',
    'Name mismatch with electricity bill',
    'Cancelled cheque missing IFSC / Name',
    'Expired electricity bill (>6 months old)',
    'Incomplete document / Page missing',
    'Other'
  ];

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-white shadow-2xl z-50 flex flex-col transform transition-transform duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/70">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <FileBadge2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Document Inspector</h2>
              <p className="text-xs text-gray-500">Solar Project Dossier & Verification</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Document Title & Category */}
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="inline-flex items-center px-2.5 py-0.5 bg-gray-100 text-gray-700 rounded-md text-xs font-semibold">
                {document.category || 'Uncategorized'}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] text-gray-500">
                <Lock className="w-3 h-3 text-emerald-600" />
                Private Supabase Vault
              </span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 leading-snug">{document.title}</h3>
          </div>

          {/* LIVE INLINE PREVIEW */}
          {document.fileUrl ? (
            <div className="border border-gray-200 rounded-2xl overflow-hidden bg-gray-50">
              <div className="bg-gray-100/80 px-4 py-2 border-b border-gray-200 flex items-center justify-between text-xs text-gray-600 font-medium">
                <span className="flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-emerald-600" />
                  Live Preview
                </span>
                <span className="text-[11px] text-gray-400">
                  {isPdf ? 'PDF Document' : isImage ? 'Image Document' : 'Attachment'}
                </span>
              </div>

              <div className="p-2 flex items-center justify-center min-h-[220px] max-h-[360px] overflow-hidden bg-slate-900/5">
                {isImage ? (
                  <img 
                    src={document.fileUrl} 
                    alt={document.title}
                    className="max-h-[340px] w-auto max-w-full object-contain rounded-lg shadow-sm"
                  />
                ) : isPdf ? (
                  <iframe 
                    src={document.fileUrl} 
                    className="w-full h-[320px] rounded-lg border-0 bg-white"
                    title={document.title}
                  />
                ) : (
                  <div className="text-center p-8">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-gray-700">Preview not available directly</p>
                    <p className="text-xs text-gray-400 mt-1">Click "Open File" to inspect in full resolution.</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 bg-amber-50 border border-amber-100 rounded-2xl text-center">
              <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
              <p className="text-sm font-semibold text-amber-900">No physical file attached yet</p>
              <p className="text-xs text-amber-700 mt-1">This is currently a placeholder checklist item awaiting file upload.</p>
            </div>
          )}

          {/* Core Action Buttons */}
          <div className="grid grid-cols-3 gap-2">
            <a 
              href={document.fileUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Full Screen
            </a>
            <button
              onClick={handleCopyLink}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-xl border border-gray-300 transition-colors shadow-sm"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-gray-500" />}
              {copiedLink ? 'Copied!' : 'Copy Link'}
            </button>
            <button
              onClick={handleShareWhatsApp}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm"
            >
              <Share2 className="w-3.5 h-3.5" /> WhatsApp
            </button>
          </div>

          <div className="w-full h-px bg-gray-100" />

          {/* VERIFICATION & COMPLIANCE WORKFLOW */}
          <div className="p-5 bg-gray-50 border border-gray-200 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Compliance Approval
              </h4>
              {document.status === 'VERIFIED' && (
                <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Verified
                </span>
              )}
              {document.status === 'REJECTED' && (
                <span className="px-2.5 py-0.5 bg-red-100 text-red-800 text-xs font-bold rounded-full flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5 text-red-600" /> Rejected
                </span>
              )}
              {['UPLOADED', 'PENDING_UPLOAD', 'UNDER_REVIEW'].includes(document.status) && (
                <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 text-xs font-bold rounded-full flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Needs Review
                </span>
              )}
            </div>

            <p className="text-xs text-gray-500 leading-relaxed">
              {document.status === 'VERIFIED'
                ? 'This document has been verified by the solar engineering liaison desk.'
                : 'Inspect the document for PM Surya Ghar portal submission validity before approving.'}
            </p>

            {!rejecting ? (
              <div className="flex gap-2.5">
                <button 
                  onClick={handleVerify}
                  disabled={actionLoading || document.status === 'VERIFIED'}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm ${
                    document.status === 'VERIFIED' 
                      ? 'bg-emerald-50 text-emerald-400 border border-emerald-100 cursor-not-allowed'
                      : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20'
                  }`}
                >
                  <CheckCircle className="w-4 h-4" />
                  {document.status === 'VERIFIED' ? 'Approved' : 'Approve & Verify'}
                </button>
                <button 
                  onClick={() => setRejecting(true)}
                  disabled={actionLoading}
                  className="flex-1 py-2.5 bg-white hover:bg-red-50 text-red-600 border border-red-200 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <XCircle className="w-4 h-4" /> Reject with Reason
                </button>
              </div>
            ) : (
              <div className="space-y-3 bg-white p-4 rounded-xl border border-red-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-red-700">Select Reason for Rejection:</span>
                  <button 
                    onClick={() => setRejecting(false)}
                    className="text-xs text-gray-400 hover:text-gray-700"
                  >
                    Cancel
                  </button>
                </div>
                <div className="space-y-1.5">
                  {REJECTION_PRESETS.map((preset) => (
                    <label 
                      key={preset}
                      className="flex items-center gap-2 p-1.5 hover:bg-gray-50 rounded text-xs text-gray-700 cursor-pointer"
                    >
                      <input 
                        type="radio" 
                        name="rejectionReason" 
                        checked={rejectReason === preset} 
                        onChange={() => setRejectReason(preset)}
                        className="text-red-600 focus:ring-red-500"
                      />
                      <span>{preset}</span>
                    </label>
                  ))}
                </div>

                {rejectReason === 'Other' && (
                  <input 
                    type="text" 
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Describe issue (e.g., photo has reflection on meter)..."
                    className="w-full text-xs p-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                )}

                <button
                  onClick={handleReject}
                  disabled={actionLoading || (!rejectReason && !customReason)}
                  className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors"
                >
                  Confirm Rejection & Notify Team
                </button>
              </div>
            )}
          </div>

          {/* METADATA SECTION */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-gray-900">Audit & Storage Details</h4>
            
            <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100 text-xs">
              <div className="flex items-center justify-between p-3">
                <div className="text-gray-500 flex items-center gap-2"><User className="w-3.5 h-3.5"/> Customer</div>
                <div className="font-semibold text-gray-900">{document.customer?.name || '—'}</div>
              </div>
              <div className="flex items-center justify-between p-3">
                <div className="text-gray-500 flex items-center gap-2"><HardDrive className="w-3.5 h-3.5"/> Project</div>
                <div className="font-semibold text-gray-900">{document.project?.name || '—'}</div>
              </div>
              <div className="flex items-center justify-between p-3">
                <div className="text-gray-500 flex items-center gap-2"><Lock className="w-3.5 h-3.5"/> Storage Provider</div>
                <div className="font-medium text-emerald-700 flex items-center gap-1">
                  Supabase Private Bucket (Signed)
                </div>
              </div>
              <div className="flex items-center justify-between p-3">
                <div className="text-gray-500 flex items-center gap-2"><Calendar className="w-3.5 h-3.5"/> Uploaded On</div>
                <div className="font-medium text-gray-900">{new Date(document.createdAt).toLocaleString()}</div>
              </div>
              <div className="flex items-center justify-between p-3">
                <div className="text-gray-500 flex items-center gap-2"><FileText className="w-3.5 h-3.5"/> File Size & Type</div>
                <div className="font-medium text-gray-900">
                  {document.fileSize ? (document.fileSize / 1024 / 1024).toFixed(2) + ' MB' : 'Standard'} • {document.fileType || 'Auto'}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
