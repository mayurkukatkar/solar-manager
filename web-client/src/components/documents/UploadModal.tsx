import React, { useState } from 'react';
import axios from 'axios';
import { X, UploadCloud, File, AlertCircle, CheckCircle2 } from 'lucide-react';

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
  const [category, setCategory] = useState('Customer KYC');
  const [projectId, setProjectId] = useState('');
  const [customerId, setCustomerId] = useState('');
  
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file && !title) {
      setError('Please choose a file or enter a document title to create a placeholder.');
      return;
    }

    setUploading(true);
    setError('');

    const formData = new FormData();
    if (file) formData.append('file', file);
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
      setError('Oops! Something went wrong while saving the document. Please try again.');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
      <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50 rounded-t-2xl">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <UploadCloud className="w-6 h-6 text-emerald-500" />
              Upload a New Document
            </h2>
            <p className="text-sm text-gray-500 mt-1">Add a file to your central repository</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-lg flex items-center gap-3 text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <form id="upload-form" onSubmit={handleUpload} className="space-y-8">
            
            {/* Step 1: File Selection */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">1</span>
                <h3 className="text-base font-semibold text-gray-900">Choose your file (Optional)</h3>
              </div>
              
              <div className="relative group">
                <input 
                  type="file" 
                  id="file-upload" 
                  className="hidden" 
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
                <label 
                  htmlFor="file-upload" 
                  className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl cursor-pointer transition-all ${file ? 'border-emerald-500 bg-emerald-50' : 'border-gray-300 hover:border-emerald-400 hover:bg-emerald-50/30 bg-gray-50'}`}
                >
                  {file ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-3 bg-white shadow-sm rounded-full text-emerald-500">
                        <CheckCircle2 className="w-8 h-8" />
                      </div>
                      <div className="text-center">
                        <span className="text-emerald-700 font-bold block">{file.name}</span>
                        <span className="text-sm text-emerald-600/70">{(file.size / 1024 / 1024).toFixed(2)} MB • Click to change file</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-4 bg-white shadow-sm rounded-full text-emerald-500 group-hover:scale-110 transition-transform">
                        <UploadCloud className="w-8 h-8" />
                      </div>
                      <div className="text-center">
                        <span className="text-gray-700 font-medium block text-lg">Click to browse or drag and drop</span>
                        <span className="text-sm text-gray-500">Supports PDF, JPG, PNG, DOCX (Max 10MB)</span>
                      </div>
                    </div>
                  )}
                </label>
              </div>
            </div>

            <div className="w-full h-px bg-gray-100"></div>

            {/* Step 2: Details */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">2</span>
                <h3 className="text-base font-semibold text-gray-900">Add details (Optional but recommended)</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">What is this document called? *</label>
                  <input 
                    type="text" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required={!file}
                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 shadow-sm"
                    placeholder="E.g., Electricity Bill Aug 2026"
                  />
                  <p className="text-xs text-gray-500 mt-1.5">{file ? "If left empty, we'll use the file name." : "Required if no file is selected."}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">What type of document is this? *</label>
                  <select 
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    required
                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 shadow-sm"
                  >
                    {categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Link to a Project</label>
                  <select 
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 shadow-sm"
                  >
                    <option value="">-- No Project --</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.projectId})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Link to a Customer</label>
                  <select 
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 shadow-sm"
                  >
                    <option value="">-- No Customer --</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50 rounded-b-2xl">
          <button 
            type="button" 
            onClick={onClose}
            className="px-6 py-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 font-medium rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit"
            form="upload-form"
            disabled={uploading || (!file && !title)}
            className={`px-8 py-2.5 font-medium rounded-lg transition-all flex items-center gap-2 shadow-sm
              ${uploading || (!file && !title) 
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20'
              }
            `}
          >
            {uploading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              'Save Document'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
