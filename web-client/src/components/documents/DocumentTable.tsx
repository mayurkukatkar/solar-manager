import React, { useState } from 'react';
import { FileText, CheckCircle, Clock, XCircle, Eye, Download, Share2, Trash2, FolderOpen } from 'lucide-react';

export default function DocumentTable({ documents, onDelete, onView }: { documents: any[], onDelete: (id: string) => void, onView: (doc: any) => void }) {
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, ACTION_NEEDED, VERIFIED

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full text-xs font-medium flex items-center gap-1.5 w-fit"><CheckCircle className="w-3.5 h-3.5" /> Verified</span>;
      case 'PENDING_UPLOAD':
      case 'UNDER_REVIEW':
      case 'UPLOADED':
        return <span className="px-2.5 py-1 bg-amber-50 text-amber-600 border border-amber-200 rounded-full text-xs font-medium flex items-center gap-1.5 w-fit"><Clock className="w-3.5 h-3.5" /> Action Needed</span>;
      case 'REJECTED':
      case 'MISSING':
      case 'EXPIRED':
        return <span className="px-2.5 py-1 bg-red-50 text-red-600 border border-red-200 rounded-full text-xs font-medium flex items-center gap-1.5 w-fit"><XCircle className="w-3.5 h-3.5" /> Problem</span>;
      default:
        return <span className="px-2.5 py-1 bg-gray-50 text-gray-500 border border-gray-200 rounded-full text-xs font-medium w-fit">{status}</span>;
    }
  };

  const filteredDocs = documents.filter(doc => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'VERIFIED') return doc.status === 'VERIFIED';
    if (activeTab === 'ACTION_NEEDED') return ['PENDING_UPLOAD', 'UPLOADED', 'UNDER_REVIEW', 'REJECTED', 'MISSING', 'EXPIRED'].includes(doc.status);
    return true;
  });

  return (
    <div className="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden">
      
      {/* Friendly Tabs */}
      <div className="flex border-b border-gray-200">
        <button 
          onClick={() => setActiveTab('ALL')}
          className={`px-6 py-4 text-sm font-medium transition-colors border-b-2 ${activeTab === 'ALL' ? 'border-emerald-500 text-emerald-600 bg-emerald-50/30' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
        >
          All Documents
        </button>
        <button 
          onClick={() => setActiveTab('ACTION_NEEDED')}
          className={`px-6 py-4 text-sm font-medium transition-colors border-b-2 ${activeTab === 'ACTION_NEEDED' ? 'border-amber-500 text-amber-600 bg-amber-50/30' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
        >
          Action Needed
        </button>
        <button 
          onClick={() => setActiveTab('VERIFIED')}
          className={`px-6 py-4 text-sm font-medium transition-colors border-b-2 ${activeTab === 'VERIFIED' ? 'border-emerald-500 text-emerald-600 bg-emerald-50/30' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
        >
          Verified
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="text-xs uppercase bg-gray-50 text-gray-500 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 font-semibold">Document Name</th>
              <th className="px-6 py-4 font-semibold">Category</th>
              <th className="px-6 py-4 font-semibold">Linked To</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold">Uploaded On</th>
              <th className="px-6 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredDocs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-400">
                      <FolderOpen className="w-8 h-8" />
                    </div>
                    <div className="text-gray-900 font-medium text-lg">No documents found</div>
                    <p className="text-gray-500 max-w-sm">
                      {activeTab === 'ALL' 
                        ? "You haven't uploaded any documents yet. Click 'Upload Document' to get started." 
                        : `No documents matching the '${activeTab.replace('_', ' ')}' filter.`}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredDocs.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-100 rounded-lg text-gray-500">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 truncate max-w-[250px]" title={doc.title}>{doc.title}</div>
                        <div className="text-xs text-gray-500">
                          {doc.fileSize ? (doc.fileSize / 1024 / 1024).toFixed(2) + ' MB' : '0 MB'} • v{doc.version}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-md text-xs font-medium">
                      {doc.category || 'Other'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      {doc.project && <span className="text-gray-900 font-medium truncate max-w-[150px]">{doc.project.name}</span>}
                      {doc.customer && <span className="text-xs text-gray-500 truncate max-w-[150px]">{doc.customer.name}</span>}
                      {!doc.project && !doc.customer && <span className="text-gray-400">—</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(doc.status)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-gray-900 font-medium">{new Date(doc.createdAt).toLocaleDateString()}</span>
                      <span className="text-xs text-gray-500">{doc.user?.name || 'System'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <button onClick={() => onView(doc)} className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="View Details">
                        <Eye className="w-4 h-4" />
                      </button>
                      <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Download File">
                        <Download className="w-4 h-4" />
                      </a>
                      <button onClick={() => onDelete(doc.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete Document">
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
