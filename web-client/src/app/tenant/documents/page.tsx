"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FileText, UploadCloud, Search, AlertCircle, FileBox, 
  CheckCircle, Clock, PieChart, Filter
} from 'lucide-react';
import DocumentTable from '../../../components/documents/DocumentTable';
import UploadModal from '../../../components/documents/UploadModal';
import DocumentDrawer from '../../../components/documents/DocumentDrawer';

export default function DocumentsDashboard() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals & Panels
  const [showUpload, setShowUpload] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);

  const fetchDocuments = async () => {
    try {
      const [docRes, projRes, custRes] = await Promise.all([
        axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/documents`, { withCredentials: true }),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/projects`, { withCredentials: true }),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/customers`, { withCredentials: true })
      ]);
      setDocuments(docRes.data);
      setProjects(projRes.data.projects || []);
      setCustomers(custRes.data.customers || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/documents/${id}`, { withCredentials: true });
      fetchDocuments();
      if (selectedDoc?.id === id) setSelectedDoc(null);
    } catch (err) {
      console.error(err);
      alert('Failed to delete document');
    }
  };

  // Stats calculation
  const totalDocs = documents.length;
  const pendingDocs = documents.filter(d => ['PENDING_UPLOAD', 'UPLOADED', 'UNDER_REVIEW'].includes(d.status)).length;
  const verifiedDocs = documents.filter(d => d.status === 'VERIFIED').length;
  const missingDocs = documents.filter(d => d.status === 'MISSING').length;

  if (loading) {
    return <div className="p-8 text-gray-600 flex items-center justify-center min-h-screen">Loading documents module...</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Documents</h1>
          <p className="text-gray-500 mt-1">Central repository for all project and customer documentation.</p>
        </div>
        <button 
          onClick={() => setShowUpload(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors shadow-lg shadow-emerald-500/20"
        >
          <UploadCloud className="w-5 h-5" />
          Upload Document
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white shadow-sm border border-gray-200 p-5 rounded-xl flex items-start justify-between">
          <div>
            <p className="text-gray-500 text-sm font-medium mb-1">Total Documents</p>
            <h3 className="text-2xl font-bold text-gray-900">{totalDocs}</h3>
          </div>
          <div className="p-3 bg-white shadow-sm rounded-lg text-gray-900"><FileBox className="w-6 h-6" /></div>
        </div>
        
        <div className="bg-emerald-500/5 border border-emerald-500/10 p-5 rounded-xl flex items-start justify-between">
          <div>
            <p className="text-emerald-400/70 text-sm font-medium mb-1">Verified</p>
            <h3 className="text-2xl font-bold text-emerald-400">{verifiedDocs}</h3>
          </div>
          <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-400"><CheckCircle className="w-6 h-6" /></div>
        </div>

        <div className="bg-amber-500/5 border border-amber-500/10 p-5 rounded-xl flex items-start justify-between">
          <div>
            <p className="text-amber-400/70 text-sm font-medium mb-1">Pending Verification</p>
            <h3 className="text-2xl font-bold text-amber-400">{pendingDocs}</h3>
          </div>
          <div className="p-3 bg-amber-500/10 rounded-lg text-amber-400"><Clock className="w-6 h-6" /></div>
        </div>

        <div className="bg-red-500/5 border border-red-500/10 p-5 rounded-xl flex items-start justify-between">
          <div>
            <p className="text-red-400/70 text-sm font-medium mb-1">Missing Action</p>
            <h3 className="text-2xl font-bold text-red-400">{missingDocs}</h3>
          </div>
          <div className="p-3 bg-red-500/10 rounded-lg text-red-400"><AlertCircle className="w-6 h-6" /></div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-gray-100 p-4 rounded-xl border border-gray-100">
          <div className="flex gap-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-emerald-400" />
              Document Library
            </h2>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search documents..."
                className="w-full pl-9 pr-4 py-2 bg-white shadow-sm border border-gray-200 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <button className="p-2 bg-white shadow-sm hover:bg-gray-100 border border-gray-200 rounded-lg text-gray-600 transition-colors">
              <Filter className="w-5 h-5" />
            </button>
          </div>
        </div>

        <DocumentTable 
          documents={documents} 
          onDelete={handleDelete}
          onView={(doc) => setSelectedDoc(doc)}
        />
      </div>

      <UploadModal 
        isOpen={showUpload} 
        onClose={() => setShowUpload(false)} 
        onUploadSuccess={fetchDocuments}
        projects={projects}
        customers={customers}
      />

      <DocumentDrawer 
        isOpen={!!selectedDoc} 
        document={selectedDoc} 
        onClose={() => setSelectedDoc(null)}
        onUpdate={() => { fetchDocuments(); setSelectedDoc(null); }}
      />
    </div>
  );
}
