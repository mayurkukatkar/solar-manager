import React from 'react';
import { X, ExternalLink, Download, FileText, CheckCircle, XCircle, AlertTriangle, FileBadge2, User, Calendar, HardDrive } from 'lucide-react';
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
  if (!isOpen || !document) return null;

  const handleVerify = async () => {
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/documents/${document.id}/verify`, {}, { withCredentials: true });
      onUpdate();
    } catch (err) {
      console.error(err);
      alert('Failed to verify document');
    }
  };

  const handleReject = async () => {
    const reason = prompt('Please enter the reason for rejection (this will be logged):');
    if (reason === null) return; // User cancelled
    
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/documents/${document.id}/reject`, { reason }, { withCredentials: true });
      onUpdate();
    } catch (err) {
      console.error(err);
      alert('Failed to reject document');
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col transform transition-transform duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <FileBadge2 className="w-5 h-5 text-emerald-500" />
            Document Viewer
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* Document Title & Category */}
          <div className="flex gap-4 items-start">
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-emerald-600 flex-shrink-0">
              <FileText className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 leading-tight mb-2">{document.title}</h3>
              <span className="inline-flex items-center px-2.5 py-1 bg-gray-100 text-gray-600 rounded-md text-xs font-medium">
                {document.category || 'Uncategorized'}
              </span>
            </div>
          </div>

          {/* Core Actions */}
          <div className="flex gap-3">
            <a 
              href={document.fileUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-xl transition-colors shadow-sm"
            >
              <ExternalLink className="w-4 h-4" /> Open File
            </a>
            <a 
              href={document.fileUrl}
              download
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-xl border border-gray-300 transition-colors shadow-sm"
            >
              <Download className="w-4 h-4" /> Download
            </a>
          </div>

          <div className="w-full h-px bg-gray-100"></div>

          {/* Verification Box - Made very obvious for non-tech users */}
          <div className="p-5 bg-gray-50 border border-gray-200 rounded-2xl space-y-4">
            <h4 className="text-sm font-bold text-gray-900 flex items-center justify-between">
              Verification Status
              {document.status === 'VERIFIED' && <span className="text-emerald-600 flex items-center gap-1"><CheckCircle className="w-4 h-4"/> Verified</span>}
              {document.status === 'REJECTED' && <span className="text-red-600 flex items-center gap-1"><XCircle className="w-4 h-4"/> Rejected</span>}
              {['UPLOADED', 'PENDING_UPLOAD', 'UNDER_REVIEW'].includes(document.status) && <span className="text-amber-600 flex items-center gap-1"><AlertTriangle className="w-4 h-4"/> Needs Review</span>}
            </h4>
            
            <p className="text-sm text-gray-500">
              {document.status === 'VERIFIED' ? 'This document has been reviewed and approved.' : 'Please review the document and mark it as approved or rejected.'}
            </p>
            
            <div className="flex gap-3">
              <button 
                onClick={handleVerify}
                className="flex-1 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" /> Approve
              </button>
              <button 
                onClick={handleReject}
                className="flex-1 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <XCircle className="w-4 h-4" /> Reject
              </button>
            </div>
          </div>

          {/* Metadata Section */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-gray-900">Document Information</h4>
            
            <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100 text-sm">
              <div className="flex items-center justify-between p-3">
                <div className="text-gray-500 flex items-center gap-2"><User className="w-4 h-4"/> Customer</div>
                <div className="font-medium text-gray-900">{document.customer?.name || '—'}</div>
              </div>
              <div className="flex items-center justify-between p-3">
                <div className="text-gray-500 flex items-center gap-2"><HardDrive className="w-4 h-4"/> Project</div>
                <div className="font-medium text-gray-900">{document.project?.name || '—'}</div>
              </div>
              <div className="flex items-center justify-between p-3">
                <div className="text-gray-500 flex items-center gap-2"><User className="w-4 h-4"/> Uploaded By</div>
                <div className="font-medium text-gray-900">{document.user?.name || 'System'}</div>
              </div>
              <div className="flex items-center justify-between p-3">
                <div className="text-gray-500 flex items-center gap-2"><Calendar className="w-4 h-4"/> Upload Date</div>
                <div className="font-medium text-gray-900">{new Date(document.createdAt).toLocaleDateString()}</div>
              </div>
              <div className="flex items-center justify-between p-3">
                <div className="text-gray-500 flex items-center gap-2"><FileText className="w-4 h-4"/> File Size</div>
                <div className="font-medium text-gray-900">{document.fileSize ? (document.fileSize / 1024 / 1024).toFixed(2) + ' MB' : 'Unknown'}</div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
