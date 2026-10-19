"use client";

import React, { useState } from 'react';
import { 
  Building2, Zap, CheckCircle2, AlertTriangle, FileText, 
  UploadCloud, ExternalLink, ChevronDown, ChevronUp, MessageSquare,
  ShieldCheck, User, Phone, Check, Clock, Eye
} from 'lucide-react';

interface ProjectDossier {
  id: string;
  name: string;
  projectNumber?: string;
  capacity?: number;
  currentStage?: string;
  status?: string;
  customer?: {
    id: string;
    name: string;
    mobile?: string;
    email?: string;
    consumerNumber?: string;
  };
  totalDocuments: number;
  verifiedDocuments: number;
  pendingDocuments: number;
  readinessScore: number;
  missingChecklist: string[];
  isDbtReady: boolean;
  isDiscomReady: boolean;
  documents: any[];
}

interface ProjectDossierGridProps {
  projects: ProjectDossier[];
  onUploadForProject: (projectId: string, customerId?: string) => void;
  onViewDoc: (doc: any) => void;
  searchQuery?: string;
}

export default function ProjectDossierGrid({
  projects,
  onUploadForProject,
  onViewDoc,
  searchQuery = '',
}: ProjectDossierGridProps) {
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedProjectId(prev => (prev === id ? null : id));
  };

  const filtered = projects.filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const custName = p.customer?.name?.toLowerCase() || '';
    const projName = p.name?.toLowerCase() || '';
    const projNo = p.projectNumber?.toLowerCase() || '';
    const consumerNo = p.customer?.consumerNumber?.toLowerCase() || '';
    return custName.includes(q) || projName.includes(q) || projNo.includes(q) || consumerNo.includes(q);
  });

  const handleWhatsAppNudge = (project: ProjectDossier) => {
    const phone = project.customer?.mobile;
    if (!phone) {
      alert('No customer phone number available for this project.');
      return;
    }
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const targetNumber = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    
    const missingList = project.missingChecklist.length > 0 
      ? project.missingChecklist.join(', ')
      : 'pending documentation';

    const message = encodeURIComponent(
      `*Namaste ${project.customer?.name || 'Sir/Madam'}*,\n\n` +
      `Regarding your Solar Plant (*${project.projectNumber || project.name}*):\n\n` +
      `To process your *PM Surya Ghar ₹78,000 DBT Subsidy* and DISCOM Net Metering without delay, we need the following document(s):\n` +
      `👉 *${missingList}*\n\n` +
      `Kindly send photo or PDF of these documents here on WhatsApp so our engineering & liaison team can submit your application.\n\n` +
      `_Best regards,_\n*Solar Operations Team*`
    );

    window.open(`https://wa.me/${targetNumber}?text=${message}`, '_blank');
  };

  if (filtered.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center shadow-sm">
        <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-gray-800">No Project Dossiers Found</h3>
        <p className="text-gray-500 text-sm mt-1 max-w-md mx-auto">
          {searchQuery ? `No dossiers match "${searchQuery}". Try adjusting your search query.` : 'Active installation projects and their document dossiers will appear here.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {filtered.map((p) => {
        const isExpanded = expandedProjectId === p.id;
        const score = p.readinessScore || 0;
        
        let scoreBadgeColor = 'bg-red-50 text-red-700 border-red-200';
        let scoreBarColor = 'bg-red-500';
        if (score >= 80) {
          scoreBadgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
          scoreBarColor = 'bg-emerald-500';
        } else if (score >= 50) {
          scoreBadgeColor = 'bg-amber-50 text-amber-700 border-amber-200';
          scoreBarColor = 'bg-amber-500';
        }

        return (
          <div 
            key={p.id}
            className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden"
          >
            {/* Top Bar Summary */}
            <div className="p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Left: Project & Customer Identity */}
              <div className="flex items-start gap-4 flex-1">
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-600 flex-shrink-0 mt-0.5">
                  <Building2 className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="px-2.5 py-0.5 bg-gray-100 text-gray-700 text-xs font-semibold rounded-md">
                      {p.projectNumber || 'PRJ'}
                    </span>
                    <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-md">
                      {p.currentStage || p.status || 'Planning'}
                    </span>
                    {p.capacity && (
                      <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 text-xs font-semibold rounded-md flex items-center gap-1">
                        <Zap className="w-3 h-3 text-amber-500" />
                        {p.capacity} kWp
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 truncate">{p.name}</h3>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-1 flex-wrap">
                    {p.customer?.name && (
                      <span className="flex items-center gap-1 font-medium text-gray-700">
                        <User className="w-3.5 h-3.5 text-gray-400" />
                        {p.customer.name}
                      </span>
                    )}
                    {p.customer?.mobile && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                        {p.customer.mobile}
                      </span>
                    )}
                    {p.customer?.consumerNumber && (
                      <span className="px-2 py-0.5 bg-gray-50 border border-gray-200 text-gray-600 rounded text-[11px] font-mono">
                        DISCOM #{p.customer.consumerNumber}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Middle: Subsidy & Compliance Readiness */}
              <div className="w-full lg:w-72 bg-gray-50/80 border border-gray-100 p-3.5 rounded-xl">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-gray-700 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    DBT Subsidy Readiness
                  </span>
                  <span className={`px-2 py-0.5 rounded-full border text-xs font-bold ${scoreBadgeColor}`}>
                    {score}%
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${scoreBarColor}`}
                    style={{ width: `${score}%` }}
                  />
                </div>

                {/* Mini Checklist Badges */}
                <div className="flex items-center gap-2 mt-2.5 text-[11px]">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded ${p.isDbtReady ? 'bg-emerald-100/70 text-emerald-800' : 'bg-red-100/70 text-red-800'}`}>
                    {p.isDbtReady ? <Check className="w-3 h-3 text-emerald-600" /> : <AlertTriangle className="w-3 h-3 text-red-600" />}
                    DBT KYC
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded ${p.isDiscomReady ? 'bg-emerald-100/70 text-emerald-800' : 'bg-amber-100/70 text-amber-800'}`}>
                    {p.isDiscomReady ? <Check className="w-3 h-3 text-emerald-600" /> : <Clock className="w-3 h-3 text-amber-600" />}
                    DISCOM Bill
                  </span>
                  <span className="text-gray-400 ml-auto">
                    {p.totalDocuments} files
                  </span>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                {p.missingChecklist.length > 0 && p.customer?.mobile && (
                  <button
                    onClick={() => handleWhatsAppNudge(p)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm shadow-emerald-500/20 transition-all"
                    title="Send WhatsApp document reminder to customer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    WhatsApp Nudge
                  </button>
                )}

                <button
                  onClick={() => onUploadForProject(p.id, p.customer?.id)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg text-xs font-semibold shadow-sm transition-all"
                  title="Upload a new document to this project"
                >
                  <UploadCloud className="w-3.5 h-3.5 text-gray-500" />
                  Add File
                </button>

                <button
                  onClick={() => toggleExpand(p.id)}
                  className="flex items-center gap-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold transition-all"
                >
                  Dossier ({p.totalDocuments})
                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5 ml-0.5" /> : <ChevronDown className="w-3.5 h-3.5 ml-0.5" />}
                </button>
              </div>
            </div>

            {/* Missing Items Banner if any */}
            {p.missingChecklist.length > 0 && (
              <div className="bg-amber-50/70 border-t border-amber-100 px-6 py-2.5 flex items-center gap-2 text-xs text-amber-800">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span className="font-semibold">Missing for Government Approval:</span>
                <span className="text-amber-900 font-medium">{p.missingChecklist.join(' • ')}</span>
              </div>
            )}

            {/* Expanded Document Grid */}
            {isExpanded && (
              <div className="border-t border-gray-100 bg-gray-50/50 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    Attached Project Files & Compliance Records
                  </h4>
                  <span className="text-xs text-gray-500">
                    {p.verifiedDocuments} Verified • {p.pendingDocuments} Under Review
                  </span>
                </div>

                {p.documents.length === 0 ? (
                  <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
                    <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-gray-700">No documents uploaded for this project yet</p>
                    <p className="text-xs text-gray-400 mt-1">Upload Electricity Bill, Aadhaar, PAN or rooftop photos to begin compliance.</p>
                    <button
                      onClick={() => onUploadForProject(p.id, p.customer?.id)}
                      className="mt-3 px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 shadow-sm"
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      Upload First Document
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {p.documents.map((doc: any) => (
                      <div
                        key={doc.id}
                        className="bg-white border border-gray-200 hover:border-emerald-300 rounded-xl p-3.5 flex flex-col justify-between transition-all group shadow-sm hover:shadow"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[11px] font-medium rounded truncate max-w-[150px]">
                              {doc.category || 'Customer KYC'}
                            </span>
                            {doc.status === 'VERIFIED' ? (
                              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded-full flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Verified
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold rounded-full flex items-center gap-1">
                                <Clock className="w-3 h-3 text-amber-600" />
                                {doc.status || 'Pending'}
                              </span>
                            )}
                          </div>
                          <h5 className="text-sm font-bold text-gray-900 line-clamp-1" title={doc.title}>
                            {doc.title}
                          </h5>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(doc.createdAt).toLocaleDateString()} • {doc.fileSize ? `${(doc.fileSize / 1024 / 1024).toFixed(2)} MB` : 'File'}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-100">
                          <button
                            onClick={() => onViewDoc(doc)}
                            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Inspect & Verify
                          </button>
                          {doc.fileUrl && (
                            <a
                              href={doc.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-gray-500 hover:text-gray-800 flex items-center gap-1"
                              title="Open original file"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
