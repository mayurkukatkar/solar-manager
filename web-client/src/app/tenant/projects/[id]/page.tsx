"use client";
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, Briefcase, Calendar, MapPin, Zap, User, Users,
  CheckSquare, Flag, Box, History, DollarSign, Activity, Settings, Plus,
  CheckCircle2, Clock, AlertTriangle, MessageSquare, Trash2, FileText, Download
} from 'lucide-react';
import { WorkCompletionReport, GuaranteeCertificate, DcrDeclaration, AnnexureProforma } from '@/components/pdf/MsedclFormsPDF';

export default function ProjectDetails() {
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('OVERVIEW');
  const [products, setProducts] = useState<any[]>([]);

  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [selectedForm, setSelectedForm] = useState<string | null>(null);

  const handleDownloadForm = (formType: string) => {
    setSelectedForm(formType);
    setIsGeneratingPDF(true);
    setTimeout(async () => {
      try {
        const { generateDiscomPDF } = await import('@/components/pdf/MsedclFormsPDF');
        await generateDiscomPDF(`discom-${formType}`, `${project.projectNumber}_${formType}.pdf`);
      } catch (err) {
        console.error(err);
        alert('Failed to generate PDF');
      } finally {
        setIsGeneratingPDF(false);
        setSelectedForm(null);
      }
    }, 500);
  };

  // Modals state
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [newTask, setNewTask] = useState({ name: '', description: '', priority: 'Medium', dueDate: '' });
  
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [newMilestone, setNewMilestone] = useState({ name: '', description: '', targetDate: '' });
  
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [newMaterial, setNewMaterial] = useState({ productId: '', description: '', quantity: 1 });

  const fetchProject = async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/projects/${params.id}`, { withCredentials: true });
      setProject(res.data.project);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/products`, { withCredentials: true });
      setProducts(res.data.products);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProject();
    fetchProducts();
  }, [params.id]);

  const handleStageChange = async (e: any) => {
    const newStage = e.target.value;
    try {
      await axios.patch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/projects/${params.id}/stage`, { newStage, comment: `Stage updated to ${newStage}` }, { withCredentials: true });
      fetchProject();
    } catch (err) {
      console.error(err);
    }
  };

  const handleStatusChange = async (e: any) => {
    const status = e.target.value;
    try {
      await axios.patch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/projects/${params.id}/status`, { status, updateText: `Status changed to ${status}` }, { withCredentials: true });
      fetchProject();
    } catch (err) {
      console.error(err);
    }
  };

  // Task Actions
  const handleCreateTask = async (e: any) => {
    e.preventDefault();
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/projects/${params.id}/tasks`, newTask, { withCredentials: true });
      setShowTaskModal(false);
      setNewTask({ name: '', description: '', priority: 'Medium', dueDate: '' });
      fetchProject();
    } catch (err) {}
  };
  
  const handleTaskStatusChange = async (taskId: string, status: string) => {
    try {
      await axios.patch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/tasks/${taskId}`, { status, progress: status === 'Completed' ? 100 : undefined }, { withCredentials: true });
      fetchProject();
    } catch (err) {}
  };

  // Milestone Actions
  const handleCreateMilestone = async (e: any) => {
    e.preventDefault();
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/projects/${params.id}/milestones`, newMilestone, { withCredentials: true });
      setShowMilestoneModal(false);
      setNewMilestone({ name: '', description: '', targetDate: '' });
      fetchProject();
    } catch (err) {}
  };

  const handleMilestoneStatusChange = async (id: string, status: string) => {
    try {
      await axios.patch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/milestones/${id}`, { status, actualDate: status === 'Completed' ? new Date().toISOString() : null }, { withCredentials: true });
      fetchProject();
    } catch (err) {}
  };

  // Material Actions
  const handleCreateMaterial = async (e: any) => {
    e.preventDefault();
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/projects/${params.id}/materials`, newMaterial, { withCredentials: true });
      setShowMaterialModal(false);
      setNewMaterial({ productId: '', description: '', quantity: 1 });
      fetchProject();
    } catch (err) {}
  };

  const handleMaterialStatusChange = async (id: string, status: string) => {
    try {
      await axios.patch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/materials/${id}`, { status }, { withCredentials: true });
      fetchProject();
    } catch (err) {}
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'In Progress': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'On Hold': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Delayed': return 'bg-red-100 text-red-700 border-red-200';
      case 'Completed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div></div>;
  if (!project) return <div className="text-center py-20 text-slate-500">Project not found.</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors">
        <ArrowLeft size={16} /> Back to Projects
      </button>

      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col lg:flex-row lg:items-start justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
            <Briefcase size={32} />
          </div>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-900">{project.projectNumber}: {project.name}</h1>
              <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${getStatusColor(project.status)}`}>
                {project.status}
              </span>
            </div>
            <p className="text-slate-500 mt-2 flex flex-wrap items-center gap-4 text-sm font-medium">
              <span className="flex items-center gap-1.5 text-slate-700"><User size={14}/> {project.customer?.name || 'No Customer'}</span>
              <span className="flex items-center gap-1.5"><Settings size={14}/> {project.capacity} {project.capacityUnit} {project.systemType}</span>
              <span className="flex items-center gap-1.5"><Users size={14}/> Owner: {project.projectOwner?.name || 'Unassigned'}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 min-w-[250px]">
          <div className="flex items-center justify-between gap-3">
            <select 
              value={project.currentStage}
              onChange={handleStageChange}
              className="flex-1 px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-semibold bg-slate-50 text-slate-700"
            >
              <option value="Planning">Stage: Planning</option>
              <option value="Design">Stage: Design</option>
              <option value="Procurement">Stage: Procurement</option>
              <option value="Installation">Stage: Installation</option>
              <option value="Testing">Stage: Testing & QA</option>
              <option value="Handover">Stage: Handover</option>
              <option value="Completed">Stage: Completed</option>
            </select>
            
            <select 
              value={project.status}
              onChange={handleStatusChange}
              className="flex-1 px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-semibold bg-slate-50 text-slate-700"
            >
              <option value="Not Started">Status: Not Started</option>
              <option value="In Progress">Status: In Progress</option>
              <option value="On Hold">Status: On Hold</option>
              <option value="Delayed">Status: Delayed</option>
              <option value="Completed">Status: Completed</option>
              <option value="Cancelled">Status: Cancelled</option>
            </select>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <div className="flex justify-between items-center text-xs font-semibold text-slate-500 mb-1.5">
              <span>Overall Progress</span>
              <span className="text-emerald-600">{project.progressPercent || 0}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div className="bg-emerald-500 h-2 rounded-full transition-all duration-500" style={{ width: `${project.progressPercent || 0}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:w-64 shrink-0">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden sticky top-6">
            <button onClick={() => setActiveTab('OVERVIEW')} className={`w-full flex items-center gap-3 px-5 py-4 text-sm font-medium transition-colors border-b border-slate-100 ${activeTab === 'OVERVIEW' ? 'bg-emerald-50 text-emerald-700 border-l-4 border-l-emerald-600' : 'text-slate-600 hover:bg-slate-50'}`}>
              <Activity size={18} /> Overview
            </button>
            <button onClick={() => setActiveTab('TASKS')} className={`w-full flex items-center justify-between px-5 py-4 text-sm font-medium transition-colors border-b border-slate-100 ${activeTab === 'TASKS' ? 'bg-emerald-50 text-emerald-700 border-l-4 border-l-emerald-600' : 'text-slate-600 hover:bg-slate-50'}`}>
              <div className="flex items-center gap-3"><CheckSquare size={18} /> Tasks</div>
              <span className="bg-slate-100 text-slate-500 py-0.5 px-2 rounded-full text-xs">{project.tasks?.length || 0}</span>
            </button>
            <button onClick={() => setActiveTab('MILESTONES')} className={`w-full flex items-center justify-between px-5 py-4 text-sm font-medium transition-colors border-b border-slate-100 ${activeTab === 'MILESTONES' ? 'bg-emerald-50 text-emerald-700 border-l-4 border-l-emerald-600' : 'text-slate-600 hover:bg-slate-50'}`}>
              <div className="flex items-center gap-3"><Flag size={18} /> Milestones</div>
              <span className="bg-slate-100 text-slate-500 py-0.5 px-2 rounded-full text-xs">{project.milestones?.length || 0}</span>
            </button>
            <button onClick={() => setActiveTab('MATERIALS')} className={`w-full flex items-center justify-between px-5 py-4 text-sm font-medium transition-colors border-b border-slate-100 ${activeTab === 'MATERIALS' ? 'bg-emerald-50 text-emerald-700 border-l-4 border-l-emerald-600' : 'text-slate-600 hover:bg-slate-50'}`}>
              <div className="flex items-center gap-3"><Box size={18} /> Material Reqs</div>
              <span className="bg-slate-100 text-slate-500 py-0.5 px-2 rounded-full text-xs">{project.materialReqs?.length || 0}</span>
            </button>
            <button onClick={() => setActiveTab('TIMELINE')} className={`w-full flex items-center gap-3 px-5 py-4 text-sm font-medium transition-colors border-b border-slate-100 ${activeTab === 'TIMELINE' ? 'bg-emerald-50 text-emerald-700 border-l-4 border-l-emerald-600' : 'text-slate-600 hover:bg-slate-50'}`}>
              <History size={18} /> Activity & Timeline
            </button>
            <button onClick={() => setActiveTab('DISCOM')} className={`w-full flex items-center gap-3 px-5 py-4 text-sm font-medium transition-colors ${activeTab === 'DISCOM' ? 'bg-emerald-50 text-emerald-700 border-l-4 border-l-emerald-600' : 'text-slate-600 hover:bg-slate-50'}`}>
              <FileText size={18} /> Discom Forms
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[500px]">
          
          {/* OVERVIEW TAB */}
          {activeTab === 'OVERVIEW' && (
            <div className="p-6 space-y-8 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2"><Settings size={16} className="text-slate-400" /> Configuration</h3>
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">System Capacity</span>
                        <span className="font-semibold text-slate-800">{project.capacity} {project.capacityUnit}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">System Type</span>
                        <span className="font-semibold text-slate-800">{project.systemType}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">Project Type</span>
                        <span className="font-semibold text-slate-800">{project.projectType}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2"><MapPin size={16} className="text-slate-400" /> Location</h3>
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                      <p className="text-sm text-slate-700 leading-relaxed font-medium">
                        {project.installationAddress}<br/>
                        {project.city}, {project.state} {project.pincode}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2"><Calendar size={16} className="text-slate-400" /> Schedule</h3>
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">Start Date</span>
                        <span className="font-semibold text-slate-800">{project.startDate ? new Date(project.startDate).toLocaleDateString() : 'TBD'}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">Expected End</span>
                        <span className="font-semibold text-slate-800">{project.expectedCompletionDate ? new Date(project.expectedCompletionDate).toLocaleDateString() : 'TBD'}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2"><DollarSign size={16} className="text-slate-400" /> Financials</h3>
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">Est. Revenue</span>
                        <span className="font-bold text-slate-900">₹{(project.estimatedValue || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">Est. Cost</span>
                        <span className="font-bold text-slate-900">₹{(project.estimatedCost || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-200">
                        <span className="text-slate-500 font-semibold">Expected Profit</span>
                        <span className="font-bold text-emerald-600">₹{((project.estimatedValue || 0) - (project.estimatedCost || 0)).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TASKS TAB */}
          {activeTab === 'TASKS' && (
            <div className="animate-in fade-in duration-300 h-full flex flex-col">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h2 className="font-bold text-slate-800">Project Tasks</h2>
                <button onClick={() => setShowTaskModal(true)} className="text-sm font-medium bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg hover:bg-emerald-200 transition-colors flex items-center gap-1.5">
                  <Plus size={14} /> Add Task
                </button>
              </div>
              <div className="p-5 flex-1 overflow-y-auto">
                <div className="space-y-3">
                  {(!project.tasks || project.tasks.length === 0) ? (
                    <div className="text-center py-10 text-slate-400 text-sm">No tasks created yet.</div>
                  ) : (
                    project.tasks.map((task: any) => (
                      <div key={task.id} className="border border-slate-200 rounded-xl p-4 hover:border-slate-300 transition-colors flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <button 
                            onClick={() => handleTaskStatusChange(task.id, task.status === 'Completed' ? 'To Do' : 'Completed')}
                            className={`mt-0.5 shrink-0 w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${task.status === 'Completed' ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 text-transparent hover:border-emerald-400'}`}
                          >
                            <CheckCircle2 size={14} />
                          </button>
                          <div>
                            <h4 className={`font-semibold text-sm ${task.status === 'Completed' ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{task.name}</h4>
                            {task.description && <p className="text-xs text-slate-500 mt-1">{task.description}</p>}
                            <div className="flex items-center gap-3 mt-2 text-[11px] font-medium text-slate-400">
                              <span className="flex items-center gap-1"><Clock size={12} /> Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date'}</span>
                              <span className={`px-1.5 py-0.5 rounded ${task.priority === 'High' ? 'bg-red-50 text-red-600' : task.priority === 'Medium' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100'}`}>{task.priority}</span>
                            </div>
                          </div>
                        </div>
                        <select 
                          value={task.status}
                          onChange={(e) => handleTaskStatusChange(task.id, e.target.value)}
                          className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:border-emerald-500 bg-slate-50 text-slate-600"
                        >
                          <option value="To Do">To Do</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Blocked">Blocked</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* MILESTONES TAB */}
          {activeTab === 'MILESTONES' && (
            <div className="animate-in fade-in duration-300 h-full flex flex-col">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h2 className="font-bold text-slate-800">Project Milestones</h2>
                <button onClick={() => setShowMilestoneModal(true)} className="text-sm font-medium bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg hover:bg-emerald-200 transition-colors flex items-center gap-1.5">
                  <Plus size={14} /> Add Milestone
                </button>
              </div>
              <div className="p-5 flex-1 overflow-y-auto">
                <div className="space-y-4">
                  {(!project.milestones || project.milestones.length === 0) ? (
                    <div className="text-center py-10 text-slate-400 text-sm">No milestones defined yet.</div>
                  ) : (
                    project.milestones.map((ms: any) => (
                      <div key={ms.id} className="border border-slate-200 rounded-xl p-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${ms.status === 'Completed' ? 'bg-emerald-100 text-emerald-600' : ms.status === 'Delayed' ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-400'}`}>
                            <Flag size={20} />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 text-sm">{ms.name}</h4>
                            <div className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                              <span>Target: {ms.targetDate ? new Date(ms.targetDate).toLocaleDateString() : 'TBD'}</span>
                              {ms.actualDate && <span className="text-emerald-600 font-medium">Achieved: {new Date(ms.actualDate).toLocaleDateString()}</span>}
                            </div>
                          </div>
                        </div>
                        <select 
                          value={ms.status}
                          onChange={(e) => handleMilestoneStatusChange(ms.id, e.target.value)}
                          className="text-xs font-semibold uppercase tracking-wider border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:border-emerald-500 bg-slate-50"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Completed">Completed</option>
                          <option value="Delayed">Delayed</option>
                        </select>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* MATERIALS TAB */}
          {activeTab === 'MATERIALS' && (
            <div className="animate-in fade-in duration-300 h-full flex flex-col">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h2 className="font-bold text-slate-800">Material Requirements</h2>
                <button onClick={() => setShowMaterialModal(true)} className="text-sm font-medium bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg hover:bg-emerald-200 transition-colors flex items-center gap-1.5">
                  <Plus size={14} /> Add Requirement
                </button>
              </div>
              <div className="p-5">
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500">
                      <tr>
                        <th className="p-3 font-semibold">Material / Product</th>
                        <th className="p-3 font-semibold text-center">Qty</th>
                        <th className="p-3 font-semibold">Status</th>
                        <th className="p-3 font-semibold text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(!project.materialReqs || project.materialReqs.length === 0) ? (
                        <tr><td colSpan={4} className="p-8 text-center text-slate-400">No material requirements listed.</td></tr>
                      ) : (
                        project.materialReqs.map((mat: any) => (
                          <tr key={mat.id} className="hover:bg-slate-50/50">
                            <td className="p-3">
                              <div className="font-medium text-slate-900">{mat.description}</div>
                              {mat.product && <div className="text-xs text-slate-500">SKU: {mat.product.sku}</div>}
                            </td>
                            <td className="p-3 text-center font-semibold">{mat.quantity}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${mat.status === 'Required' ? 'bg-amber-100 text-amber-700' : mat.status === 'Procured' ? 'bg-blue-100 text-blue-700' : mat.status === 'Dispatched' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                {mat.status}
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              <select 
                                value={mat.status}
                                onChange={(e) => handleMaterialStatusChange(mat.id, e.target.value)}
                                className="text-xs border border-slate-200 rounded-lg px-2 py-1 outline-none bg-white"
                              >
                                <option value="Required">Required</option>
                                <option value="Procured">Procured</option>
                                <option value="Dispatched">Dispatched</option>
                                <option value="Consumed">Consumed</option>
                              </select>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TIMELINE TAB */}
          {activeTab === 'TIMELINE' && (
            <div className="animate-in fade-in duration-300 h-full flex flex-col">
              <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                <h2 className="font-bold text-slate-800">Activity & Timeline</h2>
              </div>
              <div className="p-6 flex-1 overflow-y-auto">
                <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-emerald-200 before:via-slate-200 before:to-transparent">
                  {project.timelineEvents?.map((evt: any) => (
                    <div key={evt.id} className="relative flex items-start gap-4 z-10">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-slate-100 text-slate-500 shadow-sm shrink-0">
                        {evt.eventType === 'STAGE_CHANGE' ? <Activity size={16} className="text-blue-500" /> : 
                         evt.eventType === 'STATUS_UPDATE' ? <AlertTriangle size={16} className="text-amber-500" /> : 
                         <History size={16} />}
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 w-full">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-sm font-bold text-slate-900">{evt.title}</h4>
                          <time className="text-xs text-slate-400">{new Date(evt.createdAt).toLocaleString()}</time>
                        </div>
                        {evt.description && <p className="text-sm text-slate-600 mt-1">{evt.description}</p>}
                      </div>
                    </div>
                  ))}
                  {(!project.timelineEvents || project.timelineEvents.length === 0) && (
                    <div className="text-center py-10 text-slate-400 text-sm pl-12">No activity recorded yet.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* DISCOM FORMS TAB */}
          {activeTab === 'DISCOM' && (
            <div className="animate-in fade-in duration-300 h-full flex flex-col">
              <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <div>
                  <h2 className="font-bold text-slate-800">MSEDCL Discom Forms</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Auto-generated official forms pre-filled with project data.</p>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { id: 'WCR', name: 'Work Completion Report (WCR)', desc: 'Official report for completed solar plant' },
                    { id: 'AnnexureI', name: 'Annexure-I & Proforma-A', desc: 'Provisional Commissioning Report' },
                    { id: 'DCR', name: 'DCR Declaration', desc: 'Domestic Content Requirement fulfillment' },
                    { id: 'Guarantee', name: 'Guarantee Certificate', desc: '5-year comprehensive maintenance contract' },
                  ].map(form => (
                    <div key={form.id} className="border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow bg-white flex flex-col justify-between group">
                      <div>
                        <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                          <FileText size={20} />
                        </div>
                        <h4 className="font-bold text-slate-900 mb-1">{form.name}</h4>
                        <p className="text-xs text-slate-500 leading-relaxed mb-6">{form.desc}</p>
                      </div>
                      <button 
                        onClick={() => handleDownloadForm(form.id)}
                        disabled={isGeneratingPDF && selectedForm === form.id}
                        className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                      >
                        {isGeneratingPDF && selectedForm === form.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-700"></div>
                        ) : (
                          <><Download size={16} /> Generate PDF</>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODALS */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-slate-900">Add Task</h2>
              <button onClick={() => setShowTaskModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>
            <form onSubmit={handleCreateTask} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Task Name *</label>
                <input required type="text" value={newTask.name} onChange={e => setNewTask({...newTask, name: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Description</label>
                <textarea rows={2} value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Priority</label>
                  <select value={newTask.priority} onChange={e => setNewTask({...newTask, priority: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm bg-white">
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Due Date</label>
                  <input type="date" value={newTask.dueDate} onChange={e => setNewTask({...newTask, dueDate: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm" />
                </div>
              </div>
              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setShowTaskModal(false)} className="flex-1 py-2.5 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl font-medium transition-colors text-sm">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium shadow-sm transition-colors text-sm">Create Task</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showMilestoneModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-slate-900">Add Milestone</h2>
              <button onClick={() => setShowMilestoneModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>
            <form onSubmit={handleCreateMilestone} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Milestone Name *</label>
                <input required type="text" value={newMilestone.name} onChange={e => setNewMilestone({...newMilestone, name: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm" placeholder="e.g. Design Approved" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Target Date</label>
                <input type="date" value={newMilestone.targetDate} onChange={e => setNewMilestone({...newMilestone, targetDate: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm" />
              </div>
              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setShowMilestoneModal(false)} className="flex-1 py-2.5 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl font-medium transition-colors text-sm">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium shadow-sm transition-colors text-sm">Create Milestone</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showMaterialModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-slate-900">Add Material Requirement</h2>
              <button onClick={() => setShowMaterialModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>
            <form onSubmit={handleCreateMaterial} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Select Product (Catalog)</label>
                <select 
                  value={newMaterial.productId}
                  onChange={e => {
                    const p = products.find(x => x.id === e.target.value);
                    setNewMaterial({...newMaterial, productId: e.target.value, description: p ? p.name : newMaterial.description});
                  }}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm bg-white"
                >
                  <option value="">-- Custom Item --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Description / Name *</label>
                <input required type="text" value={newMaterial.description} onChange={e => setNewMaterial({...newMaterial, description: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm" placeholder="e.g. 5kW Inverter" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Quantity *</label>
                <input required type="number" min="0.1" step="0.1" value={newMaterial.quantity} onChange={e => setNewMaterial({...newMaterial, quantity: parseFloat(e.target.value)})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm" />
              </div>
              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setShowMaterialModal(false)} className="flex-1 py-2.5 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl font-medium transition-colors text-sm">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium shadow-sm transition-colors text-sm">Add Material</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* HIDDEN PDF CONTAINERS FOR DISCOM FORMS */}
      {selectedForm && (
        <div style={{ position: 'absolute', top: 0, left: 0, opacity: 0, pointerEvents: 'none', zIndex: -50 }}>
          <div id={`discom-${selectedForm}`}>
            {selectedForm === 'WCR' && <WorkCompletionReport data={{
              vendorName: "Apex Solar Solutions",
              customerName: project.customer?.name || "Consumer",
              consumerNumber: "1234567890",
              address: project.installationAddress || "Installation Address",
              city: project.city,
              capacity: project.capacity,
              moduleMake: project.materialReqs?.find((r:any) => r.description?.toLowerCase().includes('panel'))?.description?.split(' ')[0] || "Waaree",
              moduleWattage: 540,
              moduleQuantity: Math.ceil((project.capacity * 1000) / 540),
              inverterMake: project.materialReqs?.find((r:any) => r.description?.toLowerCase().includes('inverter'))?.description?.split(' ')[0] || "Growatt",
            }} />}
            {selectedForm === 'Guarantee' && <GuaranteeCertificate data={{
              customerName: project.customer?.name || "Consumer",
            }} />}
            {selectedForm === 'DCR' && <DcrDeclaration data={{
              vendorName: "Apex Solar Solutions",
              customerName: project.customer?.name || "Consumer",
              address: project.installationAddress || "Installation Address",
              capacity: project.capacity,
              moduleMake: project.materialReqs?.find((r:any) => r.description?.toLowerCase().includes('panel'))?.description?.split(' ')[0] || "Waaree",
              moduleWattage: 540,
              moduleQuantity: Math.ceil((project.capacity * 1000) / 540),
            }} />}
            {selectedForm === 'AnnexureI' && <AnnexureProforma data={{
              vendorName: "Apex Solar Solutions",
              customerName: project.customer?.name || "Consumer",
              customerPhone: project.customer?.phone || "+91 9999999999",
              customerEmail: project.customer?.email || "customer@example.com",
              address: project.installationAddress || "Installation Address",
              city: project.city,
              capacity: project.capacity,
              moduleMake: project.materialReqs?.find((r:any) => r.description?.toLowerCase().includes('panel'))?.description?.split(' ')[0] || "Waaree",
              moduleQuantity: Math.ceil((project.capacity * 1000) / 540),
              inverterMake: project.materialReqs?.find((r:any) => r.description?.toLowerCase().includes('inverter'))?.description?.split(' ')[0] || "Growatt",
            }} />}
          </div>
        </div>
      )}
    </div>
  );
}
