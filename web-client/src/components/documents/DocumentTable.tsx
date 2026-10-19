"use client";

import React, { useState } from 'react';
import { 
  FileText, CheckCircle, Clock, XCircle, Eye, Download, 
  Trash2, FolderOpen, Filter, Search, Tag, ExternalLink, ShieldCheck
} from 'lucide-react';

export default function DocumentTable({ 
  documents, 
  onDelete, 
  onView,
  searchQuery = ''
}: { 
  documents: any[]; 
  onDelete: (id: string) => void; 
  onView: (doc: any) => void;
  searchQuery?: string;
}) {
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, ACTION_NEEDED, VERIFIED
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const CATEGORIES = [
    'ALL',
    'Customer KYC',
    'Electricity / DISCOM',
    'Property',
    'Solar Project',
    'Installation',
    'Subsidy',
    'Commissioning',
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return (
          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold flex items-center gap-1.5 w-fit">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Verified
          </span>
        );
      case 'PENDING_UPLOAD':
      case 'UNDER_REVIEW':
      case 'UPLOADED':
        return (
          <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-semibold flex items-center gap-1.5 w-fit">
            <Clock className="w-3.5 h-3.5 text-amber-600" /> Needs Review
          </span>
        );
      case 'REJECTED':
      case 'MISSING':
      case 'EXPIRED':
        return (
          <span className="px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 rounded-full text-xs font-semibold flex items-center gap-1.5 w-fit">
            <XCircle className="w-3.5 h-3.5 text-red-600" /> Problem
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 bg-gray-50 text-gray-600 border border-gray-200 rounded-full text-xs font-medium w-fit">
            {status}
          </span>
        );
    }
  };

  const filteredDocs = documents.filter((doc) => {
    // Status Filter
    if (statusFilter === 'VERIFIED' && doc.status !== 'VERIFIED') return false;
    if (statusFilter === 'ACTION_NEEDED' && !['PENDING_UPLOAD', 'UPLOADED', 'UNDER_REVIEW', 'REJECTED', 'MISSING', 'EXPIRED'].includes(doc.status)) {
      return false;
    }

    // Category Filter
    if (categoryFilter !== 'ALL' && doc.category !== categoryFilter) {
      return false;
    }

    // Search Query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const titleMatch = (doc.title || '').toLowerCase().includes(q);
      const projMatch = (doc.project?.name || '').toLowerCase().includes(q);
      const custMatch = (doc.customer?.name || '').toLowerCase().includes(q);
      const catMatch = (doc.category || '').toLowerCase().includes(q);
      if (!titleMatch && !projMatch && !custMatch && !catMatch) return false;
    }

    return true;
  });

  return (
    <div className="bg-white shadow-sm border border-gray-200 rounded-2xl overflow-hidden">
      
      {/* Top Filter Bar */}
      <div className="p-4 border-b border-gray-200 bg-gray-50/70 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex gap-1 bg-gray-200/60 p-1 rounded-xl self-start">
          <button 
            onClick={() => setStatusFilter('ALL')}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
              statusFilter === 'ALL' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            All Files ({documents.length})
          </button>
          <button 
            onClick={() => setStatusFilter('ACTION_NEEDED')}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
              statusFilter === 'ACTION_NEEDED' ? 'bg-amber-500 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Action Needed ({documents.filter(d => ['PENDING_UPLOAD', 'UPLOADED', 'UNDER_REVIEW', 'REJECTED', 'MISSING'].includes(d.status)).length})
          </button>
          <button 
            onClick={() => setStatusFilter('VERIFIED')}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
              statusFilter === 'VERIFIED' ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Verified ({documents.filter(d => d.status === 'VERIFIED').length})
          </button>
        </div>

        {/* Category Pill Dropdown / Selector */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs text-gray-500 font-semibold whitespace-nowrap flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Category:
          </span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs font-semibold bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-gray-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            {CATEGORIES.map(c => (
              <option key={c} value={c}>{c === 'ALL' ? 'All Categories' : c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="text-[11px] uppercase tracking-wider bg-gray-50 text-gray-500 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3.5 font-bold">Document Name</th>
              <th className="px-6 py-3.5 font-bold">Category</th>
              <th className="px-6 py-3.5 font-bold">Project / Customer</th>
              <th className="px-6 py-3.5 font-bold">Status</th>
              <th className="px-6 py-3.5 font-bold">Uploaded Date</th>
              <th className="px-6 py-3.5 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredDocs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center text-gray-400">
                      <FolderOpen className="w-7 h-7" />
                    </div>
                    <div className="text-gray-900 font-bold text-base">No documents found</div>
                    <p className="text-gray-500 text-xs max-w-sm">
                      {searchQuery 
                        ? `No documents matched "${searchQuery}".` 
                        : "No documents match the current status or category filter."}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredDocs.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50/80 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-600">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <div 
                          onClick={() => onView(doc)}
                          className="font-bold text-gray-900 hover:text-emerald-600 cursor-pointer truncate max-w-[240px]" 
                          title={doc.title}
                        >
                          {doc.title}
                        </div>
                        <div className="text-[11px] text-gray-400 mt-0.5">
                          {doc.fileSize ? `${(doc.fileSize / 1024 / 1024).toFixed(2)} MB` : 'Standard'} • v{doc.version || 1}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-medium">
                      {doc.category || 'Other'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      {doc.project ? (
                        <span className="text-gray-900 font-semibold truncate max-w-[160px] text-xs">
                          {doc.project.name}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">No project</span>
                      )}
                      {doc.customer && (
                        <span className="text-[11px] text-gray-500 truncate max-w-[160px]">
                          👤 {doc.customer.name}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(doc.status)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-gray-900 text-xs font-medium">
                        {new Date(doc.createdAt).toLocaleDateString()}
                      </span>
                      <span className="text-[11px] text-gray-400">
                        {doc.user?.name || 'Field Officer'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button 
                        onClick={() => onView(doc)} 
                        className="p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" 
                        title="Inspect Document"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {doc.fileUrl && (
                        <a 
                          href={doc.fileUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" 
                          title="Open Secure File"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                      <button 
                        onClick={() => onDelete(doc.id)} 
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" 
                        title="Delete Document"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
