import React from 'react';
import { X, ExternalLink, Download, FileText, CheckCircle, XCircle, AlertTriangle, FileBadge2 } from 'lucide-react';
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
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;
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
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-[#111111] border-l border-white/10 shadow-2xl z-50 flex flex-col transform transition-transform duration-300">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FileBadge2 className="w-5 h-5 text-emerald-400" />
            Document Details
          </h2>
          <button onClick={onClose} className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* Header Info */}
          <div>
            <div className="flex items-start gap-4">
              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <FileText className="w-8 h-8 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white leading-tight mb-1">{document.title}</h3>
                <span className="inline-block px-2.5 py-1 bg-white/5 border border-white/10 rounded-md text-xs text-white/70">
                  {document.category || 'Uncategorized'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <a 
              href={document.fileUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors"
            >
              <ExternalLink className="w-4 h-4" /> Open
            </a>
            <a 
              href={document.fileUrl}
              download
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" /> Download
            </a>
          </div>

          {/* Verification Section */}
          <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-3">
            <h4 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Verification Status</h4>
            <div className="flex items-center gap-2 mb-4">
              {document.status === 'VERIFIED' && (
                <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                  <CheckCircle className="w-5 h-5" /> Verified
                </span>
              )}
              {document.status === 'REJECTED' && (
                <span className="flex items-center gap-1.5 text-red-400 font-medium">
                  <XCircle className="w-5 h-5" /> Rejected
                </span>
              )}
              {['UPLOADED', 'PENDING_UPLOAD', 'UNDER_REVIEW'].includes(document.status) && (
                <span className="flex items-center gap-1.5 text-amber-400 font-medium">
                  <AlertTriangle className="w-5 h-5" /> Pending Verification
                </span>
              )}
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={handleVerify}
                className="flex-1 py-1.5 border border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 rounded-lg text-sm font-medium transition-colors"
              >
                Approve
              </button>
              <button 
                onClick={handleReject}
                className="flex-1 py-1.5 border border-red-500/50 text-red-400 hover:bg-red-500/10 rounded-lg text-sm font-medium transition-colors"
              >
                Reject
              </button>
            </div>
          </div>

          {/* Details List */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-white/60 uppercase tracking-wider border-b border-white/10 pb-2">Properties</h4>
            
            <div className="grid grid-cols-2 gap-y-4 text-sm">
              <div className="text-white/50">Customer</div>
              <div className="text-white font-medium text-right">{document.customer?.name || '—'}</div>
              
              <div className="text-white/50">Project</div>
              <div className="text-white font-medium text-right">{document.project?.name || '—'}</div>

              <div className="text-white/50">Uploaded By</div>
              <div className="text-white font-medium text-right">{document.user?.name || 'System'}</div>

              <div className="text-white/50">Upload Date</div>
              <div className="text-white font-medium text-right">{new Date(document.createdAt).toLocaleDateString()}</div>

              <div className="text-white/50">File Size</div>
              <div className="text-white font-medium text-right">{document.fileSize ? (document.fileSize / 1024 / 1024).toFixed(2) + ' MB' : 'Unknown'}</div>

              <div className="text-white/50">Version</div>
              <div className="text-white font-medium text-right">v{document.version}</div>
            </div>
          </div>

          {/* Description */}
          {document.description && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Description</h4>
              <p className="text-sm text-white/80 leading-relaxed bg-white/5 p-3 rounded-lg">
                {document.description}
              </p>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
