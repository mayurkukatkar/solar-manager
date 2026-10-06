import React from 'react';
import { FileText, MoreVertical, CheckCircle, Clock, XCircle, Eye, Download, Share2, Trash2 } from 'lucide-react';

export default function DocumentTable({ documents, onDelete, onView }: { documents: any[], onDelete: (id: string) => void, onView: (doc: any) => void }) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-medium flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5" /> Verified</span>;
      case 'PENDING_UPLOAD':
        return <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-xs font-medium flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Pending Upload</span>;
      case 'UPLOADED':
        return <span className="px-2.5 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-xs font-medium flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> Uploaded</span>;
      case 'REJECTED':
        return <span className="px-2.5 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full text-xs font-medium flex items-center gap-1.5"><XCircle className="w-3.5 h-3.5" /> Rejected</span>;
      case 'MISSING':
        return <span className="px-2.5 py-1 bg-neutral-500/10 text-neutral-400 border border-neutral-500/20 rounded-full text-xs font-medium flex items-center gap-1.5"><XCircle className="w-3.5 h-3.5" /> Missing</span>;
      case 'EXPIRED':
        return <span className="px-2.5 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full text-xs font-medium flex items-center gap-1.5"><XCircle className="w-3.5 h-3.5" /> Expired</span>;
      default:
        return <span className="px-2.5 py-1 bg-white/5 text-white/60 border border-white/10 rounded-full text-xs font-medium">{status}</span>;
    }
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-white/70">
          <thead className="text-xs uppercase bg-black/20 text-white/40 border-b border-white/10">
            <tr>
              <th className="px-6 py-4 font-semibold">Document</th>
              <th className="px-6 py-4 font-semibold">Category</th>
              <th className="px-6 py-4 font-semibold">Project / Customer</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold">Uploaded</th>
              <th className="px-6 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {documents.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-white/40">
                  No documents found.
                </td>
              </tr>
            ) : (
              documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/5 rounded-lg text-emerald-400">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-medium text-white truncate max-w-[250px]" title={doc.title}>{doc.title}</div>
                        <div className="text-xs text-white/40">
                          {doc.fileSize ? (doc.fileSize / 1024 / 1024).toFixed(2) + ' MB' : '0 MB'} • v{doc.version}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 bg-white/5 rounded-md text-xs border border-white/10 whitespace-nowrap">
                      {doc.category || 'Other'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      {doc.project && <span className="text-white truncate max-w-[150px]">{doc.project.name}</span>}
                      {doc.customer && <span className="text-xs text-white/40 truncate max-w-[150px]">{doc.customer.name}</span>}
                      {!doc.project && !doc.customer && <span className="text-white/30">—</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(doc.status)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-white/80">{new Date(doc.createdAt).toLocaleDateString()}</span>
                      <span className="text-xs text-white/40">{doc.user?.name || 'System'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => onView(doc)} className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded-md transition-colors" title="Preview">
                        <Eye className="w-4 h-4" />
                      </button>
                      <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 text-white/50 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-md transition-colors" title="Download">
                        <Download className="w-4 h-4" />
                      </a>
                      <button className="p-1.5 text-white/50 hover:text-blue-400 hover:bg-blue-400/10 rounded-md transition-colors" title="Share">
                        <Share2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => onDelete(doc.id)} className="p-1.5 text-white/50 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors" title="Delete">
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
