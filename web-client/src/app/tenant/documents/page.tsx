"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FileText, UploadCloud, Search, AlertCircle, FileBox, 
  CheckCircle, Clock, PieChart, Filter, ShieldCheck,
  FolderLock, RefreshCw, LayoutGrid, ListFilter
} from 'lucide-react';
import DocumentTable from '../../../components/documents/DocumentTable';
import UploadModal from '../../../components/documents/UploadModal';
import DocumentDrawer from '../../../components/documents/DocumentDrawer';
import ProjectDossierGrid from '../../../components/documents/ProjectDossierGrid';

export default function DocumentsDashboard() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [projectSummaries, setProjectSummaries] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // View Mode: 'DOSSIERS' | 'ALL_FILES'
  const [viewMode, setViewMode] = useState<'DOSSIERS' | 'ALL_FILES'>('DOSSIERS');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals & Panels
  const [showUpload, setShowUpload] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
  const [uploadProjectId, setUploadProjectId] = useState<string>('');
  const [uploadCustomerId, setUploadCustomerId] = useState<string>('');

  const fetchDocumentsData = async () => {
    try {
      const [docRes, summaryRes, projRes, custRes] = await Promise.all([
        axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/documents`, { withCredentials: true }).catch(() => ({ data: [] })),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/documents/projects-summary`, { withCredentials: true }).catch(() => ({ data: { projects: [] } })),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/projects`, { withCredentials: true }).catch(() => ({ data: { projects: [] } })),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/customers`, { withCredentials: true }).catch(() => ({ data: { customers: [] } }))
      ]);

      setDocuments(Array.isArray(docRes.data) ? docRes.data : []);
      setProjectSummaries(summaryRes.data?.projects || []);
      setProjects(projRes.data?.projects || []);
      setCustomers(custRes.data?.customers || []);
    } catch (err) {
      console.error('Error fetching documents dashboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDocumentsData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDocumentsData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document from the vault?')) return;
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/documents/${id}`, { withCredentials: true });
      fetchDocumentsData();
      if (selectedDoc?.id === id) setSelectedDoc(null);
    } catch (err) {
      console.error(err);
      alert('Failed to delete document');
    }
  };

  const handleUploadForProject = (projId: string, custId?: string) => {
    setUploadProjectId(projId);
    setUploadCustomerId(custId || '');
    setShowUpload(true);
  };

  // Stats calculation
  const totalDocs = documents.length;
  const verifiedDocs = documents.filter(d => d.status === 'VERIFIED').length;
  const pendingDocs = documents.filter(d => ['PENDING_UPLOAD', 'UPLOADED', 'UNDER_REVIEW'].includes(d.status)).length;
  const dbtReadyProjects = projectSummaries.filter(p => p.isDbtReady).length;
  const totalProjects = projectSummaries.length;

  if (loading) {
    return (
      <div className="p-8 text-gray-600 flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold text-gray-500">Loading Solar Document Vault & Dossiers...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Solar Document Hub</h1>
            <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full flex items-center gap-1">
              <FolderLock className="w-3.5 h-3.5 text-emerald-600" />
              Private Supabase Vault
            </span>
          </div>
          <p className="text-gray-500 text-sm mt-1">
            PM Surya Ghar DBT subsidy dossiers, DISCOM liaison permits, and engineering drawing repository.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200 rounded-xl transition-all shadow-sm"
            title="Refresh documents"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
          
          <button 
            onClick={() => {
              setUploadProjectId('');
              setUploadCustomerId('');
              setShowUpload(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-emerald-500/20"
          >
            <UploadCloud className="w-4 h-4" />
            Upload Document
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white shadow-sm border border-gray-200 p-5 rounded-2xl flex items-start justify-between">
          <div>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Total Vault Files</p>
            <h3 className="text-2xl font-black text-gray-900">{totalDocs}</h3>
            <p className="text-[11px] text-gray-400 mt-1">Across {totalProjects} installations</p>
          </div>
          <div className="p-3 bg-gray-100 rounded-xl text-gray-700">
            <FileBox className="w-5 h-5" />
          </div>
        </div>
        
        <div className="bg-emerald-500/5 border border-emerald-500/15 p-5 rounded-2xl flex items-start justify-between">
          <div>
            <p className="text-emerald-700 text-xs font-bold uppercase tracking-wider mb-1">Verified & Approved</p>
            <h3 className="text-2xl font-black text-emerald-600">{verifiedDocs}</h3>
            <p className="text-[11px] text-emerald-600/70 mt-1">Ready for DISCOM submission</p>
          </div>
          <div className="p-3 bg-emerald-500/15 rounded-xl text-emerald-600">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-amber-500/5 border border-amber-500/15 p-5 rounded-2xl flex items-start justify-between">
          <div>
            <p className="text-amber-700 text-xs font-bold uppercase tracking-wider mb-1">Action / Review Needed</p>
            <h3 className="text-2xl font-black text-amber-600">{pendingDocs}</h3>
            <p className="text-[11px] text-amber-600/70 mt-1">Pending approval or resubmission</p>
          </div>
          <div className="p-3 bg-amber-500/15 rounded-xl text-amber-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-blue-500/5 border border-blue-500/15 p-5 rounded-2xl flex items-start justify-between">
          <div>
            <p className="text-blue-700 text-xs font-bold uppercase tracking-wider mb-1">DBT Subsidy Ready</p>
            <h3 className="text-2xl font-black text-blue-600">
              {dbtReadyProjects} <span className="text-sm font-semibold text-gray-400">/ {totalProjects}</span>
            </h3>
            <p className="text-[11px] text-blue-600/70 mt-1">Complete KYC + Passbook + Bill</p>
          </div>
          <div className="p-3 bg-blue-500/15 rounded-xl text-blue-600">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Content & View Mode Switcher */}
      <div className="space-y-4">
        {/* Navigation & Search Bar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-3.5 rounded-2xl border border-gray-200 shadow-sm">
          {/* View Mode Buttons */}
          <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl w-full sm:w-auto">
            <button
              onClick={() => setViewMode('DOSSIERS')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                viewMode === 'DOSSIERS'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              Project Dossiers & DBT Readiness
            </button>
            <button
              onClick={() => setViewMode('ALL_FILES')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                viewMode === 'ALL_FILES'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <ListFilter className="w-4 h-4" />
              All Vault Files ({documents.length})
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder={viewMode === 'DOSSIERS' ? "Search client, project, consumer no..." : "Search files, category, client..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 hover:bg-white focus:bg-white border border-gray-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors shadow-sm"
            />
          </div>
        </div>

        {/* View Component Switcher */}
        {viewMode === 'DOSSIERS' ? (
          <ProjectDossierGrid
            projects={projectSummaries}
            onUploadForProject={handleUploadForProject}
            onViewDoc={(doc) => setSelectedDoc(doc)}
            searchQuery={searchQuery}
          />
        ) : (
          <DocumentTable 
            documents={documents} 
            onDelete={handleDelete}
            onView={(doc) => setSelectedDoc(doc)}
            searchQuery={searchQuery}
          />
        )}
      </div>

      {/* Upload Modal */}
      <UploadModal 
        isOpen={showUpload} 
        onClose={() => {
          setShowUpload(false);
          setUploadProjectId('');
          setUploadCustomerId('');
        }} 
        onUploadSuccess={fetchDocumentsData}
        projects={projects}
        customers={customers}
        initialProjectId={uploadProjectId}
        initialCustomerId={uploadCustomerId}
      />

      {/* Document Inspector Drawer */}
      <DocumentDrawer 
        isOpen={!!selectedDoc} 
        document={selectedDoc} 
        onClose={() => setSelectedDoc(null)}
        onUpdate={() => { fetchDocumentsData(); setSelectedDoc(null); }}
      />
    </div>
  );
}
