import React, { useState } from 'react';
import axios from 'axios';
import { X, UploadCloud, File, AlertCircle } from 'lucide-react';

export default function UploadModal({ 
  isOpen, 
  onClose, 
  onUploadSuccess,
  projects = [],
  customers = []
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onUploadSuccess: () => void;
  projects?: any[];
  customers?: any[];
}) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Other');
  const [projectId, setProjectId] = useState('');
  const [customerId, setCustomerId] = useState('');
  
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file to upload.');
      return;
    }

    setUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);
    if (title) formData.append('title', title);
    if (description) formData.append('description', description);
    formData.append('category', category);
    
    if (projectId) {
      formData.append('projectId', projectId);
      formData.append('entityType', 'PROJECT');
      formData.append('entityId', projectId);
    }
    if (customerId) formData.append('customerId', customerId);

    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/documents/upload`, formData, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      onUploadSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      setError('Failed to upload document. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const categories = [
    'Customer KYC',
    'Electricity / DISCOM',
    'Property',
    'Solar Project',
    'Commercial',
    'Installation',
    'Subsidy',
    'Commissioning',
    'Warranty & AMC',
    'Other'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-emerald-400" />
            Upload Document
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-900 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3 text-red-400">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <form id="upload-form" onSubmit={handleUpload} className="space-y-6">
            
            {/* File Dropzone */}
            <div className="relative">
              <input 
                type="file" 
                id="file-upload" 
                className="hidden" 
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              <label 
                htmlFor="file-upload" 
                className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${file ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-gray-300 hover:border-gray-400 bg-white shadow-sm'}`}
              >
                {file ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="p-3 bg-emerald-500/20 rounded-full text-emerald-400">
                      <File className="w-6 h-6" />
                    </div>
                    <span className="text-white font-medium truncate max-w-[200px]">{file.name}</span>
                    <span className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="p-3 bg-gray-100 rounded-full text-gray-500">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <span className="text-white font-medium">Click to upload or drag and drop</span>
                    <span className="text-xs text-gray-500">PDF, JPG, PNG, DOCX (Max 10MB)</span>
                  </div>
                )}
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">Document Title</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-white shadow-sm border border-gray-200 rounded-lg px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50"
                  placeholder="E.g., Electricity Bill Aug 2026"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">Category *</label>
                <select 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                  className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50"
                >
                  {categories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">Associate Project</label>
                <select 
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:border-emerald-500"
                >
                  <option value="">None</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.projectId})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">Associate Customer</label>
                <select 
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:border-emerald-500"
                >
                  <option value="">None</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Description / Notes</label>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full bg-white shadow-sm border border-gray-200 rounded-lg px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-emerald-500 resize-none"
                placeholder="Any additional notes..."
              />
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end gap-3 bg-gray-100">
          <button 
            type="button" 
            onClick={onClose}
            className="px-5 py-2.5 text-gray-600 hover:text-white font-medium transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit"
            form="upload-form"
            disabled={uploading || !file}
            className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-emerald-500/20"
          >
            {uploading ? (
              <>
                <div className="w-4 h-4 border-2 border-gray-300 border-t-white rounded-full animate-spin" />
                Uploading...
              </>
            ) : (
              'Upload Document'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
