"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, UploadCloud, File, AlertCircle, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';

export default function UploadModal({ 
  isOpen, 
  onClose, 
  onUploadSuccess,
  projects = [],
  customers = [],
  initialProjectId = '',
  initialCustomerId = ''
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onUploadSuccess: () => void;
  projects?: any[];
  customers?: any[];
  initialProjectId?: string;
  initialCustomerId?: string;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Customer KYC');
  const [projectId, setProjectId] = useState(initialProjectId);
  const [customerId, setCustomerId] = useState(initialCustomerId);
  
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialProjectId) setProjectId(initialProjectId);
    if (initialCustomerId) setCustomerId(initialCustomerId);
  }, [initialProjectId, initialCustomerId, isOpen]);

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
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/documents/upload`, 
        formData, 
        {
          withCredentials: true,
          headers: { 'Content-Type': 'multipart/form-data' }
        }
      );
      onUploadSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.error || 'Oops! Something went wrong while saving the document to Supabase.');
    } finally {
      setUploading(false);
    }
  };

  const SOLAR_EPC_CATEGORIES = [
    'Customer KYC',
    'Electricity / DISCOM',
    'Bank Cheque / Passbook (DBT)',
    'Property / Index II',
    'Single Line Diagram (SLD)',
    'ALMM / DCR Module Certificate',
    'Inverter Factory Test Report',
    'Rooftop Survey Photos',
    'Net Metering Application',
    'Subsidy Claim (DBT)',
    'Work Completion Report (WCR)',
    'Handover & Warranty Card',
    'Other'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
      <div className="bg-white border border-gray-200 rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/70 rounded-t-3xl">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <UploadCloud className="w-6 h-6 text-emerald-500" />
              Upload Document to Vault
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Encrypted private storage with automated PM Surya Ghar dossier linkage
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
              <p className="text-xs font-semibold">{error}</p>
            </div>
          )}

          <form id="upload-form" onSubmit={handleUpload} className="space-y-6">
            
            {/* Step 1: File Dropzone */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                <File className="w-3.5 h-3.5 text-emerald-600" />
                Select File (PDF, Images, CAD drawings)
              </label>
              
              <div className="relative group">
                <input 
                  type="file" 
                  id="file-upload" 
                  className="hidden" 
                  onChange={(e) => {
                    const picked = e.target.files?.[0] || null;
                    setFile(picked);
                    if (picked && !title) {
                      setTitle(picked.name.replace(/\.[^/.]+$/, ''));
                    }
                  }}
                />
                <label 
                  htmlFor="file-upload" 
                  className={`flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${
                    file 
                      ? 'border-emerald-500 bg-emerald-50/50' 
                      : 'border-gray-300 hover:border-emerald-400 hover:bg-emerald-50/20 bg-gray-50/50'
                  }`}
                >
                  {file ? (
                    <div className="flex flex-col items-center gap-2 p-4 text-center">
                      <div className="p-2.5 bg-white shadow-sm rounded-full text-emerald-600">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <span className="text-emerald-800 font-bold text-sm truncate max-w-sm">{file.name}</span>
                      <span className="text-xs text-emerald-600/70">{(file.size / 1024 / 1024).toFixed(2)} MB • Click to replace file</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 p-4 text-center">
                      <div className="p-3 bg-white shadow-sm rounded-full text-emerald-500 group-hover:scale-110 transition-transform">
                        <UploadCloud className="w-6 h-6" />
                      </div>
                      <span className="text-gray-700 font-semibold text-sm">Click to browse or drop file here</span>
                      <span className="text-xs text-gray-400">PDF, JPG, PNG, WEBP (Direct encrypted streaming)</span>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Step 2: Metadata Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Document Title *</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required={!file}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-sm"
                  placeholder="E.g., MSEDCL Electricity Bill - Oct 2026"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Category *</label>
                <select 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                  className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-sm"
                >
                  {SOLAR_EPC_CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Link to Solar Project</label>
                <select 
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-sm"
                >
                  <option value="">-- No Project (General) --</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.projectNumber ? `(${p.projectNumber})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Link to Customer</label>
                <select 
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-sm"
                >
                  <option value="">-- No Customer --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Optional Notes / Remarks</label>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-sm"
                placeholder="E.g., Consumer number clearly visible, sanction letter received from sub-division office."
              />
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/70 rounded-b-3xl">
          <button 
            type="button" 
            onClick={onClose}
            className="px-5 py-2 text-gray-600 hover:text-gray-900 text-xs font-semibold rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit"
            form="upload-form"
            disabled={uploading || (!file && !title)}
            className={`px-6 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 shadow-sm
              ${uploading || (!file && !title) 
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20'
              }
            `}
          >
            {uploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Encrypting & Uploading...
              </>
            ) : (
              'Save to Vault'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
