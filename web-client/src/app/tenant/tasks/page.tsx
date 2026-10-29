"use client";
import { useState, useEffect } from 'react';
import axios from 'axios';
import { CheckSquare, Plus, Clock, User, Briefcase, Filter } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

export default function Tasks() {
  const { showToast } = useToast();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: '', description: '', projectId: '', dueDate: ''
  });

  const fetchData = async () => {
    try {
      const [taskRes, projRes] = await Promise.all([
        axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/tasks`, { withCredentials: true }),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/projects`, { withCredentials: true })
      ]);
      setTasks(taskRes.data.tasks);
      setProjects(projRes.data.projects);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDragStart = (e: any, taskId: string) => {
    e.dataTransfer.setData("taskId", taskId);
  };

  const handleDragOver = (e: any) => {
    e.preventDefault();
  };

  const handleDrop = async (e: any, newStatus: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    if (!taskId) return;
    
    // Optimistic update
    setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));

    try {
      await axios.patch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/tasks/${taskId}`, { status: newStatus }, { withCredentials: true });
    } catch (err) {
      console.error(err);
      fetchData(); // Revert on failure
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    const previousTasks = [...tasks];
    setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));

    try {
      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/tasks/${taskId}`,
        { status: newStatus },
        { withCredentials: true }
      );
      showToast({ type: 'success', message: `Task moved to ${newStatus}` });
    } catch (err: any) {
      console.error(err);
      setTasks(previousTasks);
      showToast({ type: 'error', message: err.response?.data?.error || 'Failed to update task status' });
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
         name: formData.name,
         projectId: formData.projectId,
      };
      if (formData.description) payload.description = formData.description;
      if (formData.dueDate) payload.dueDate = new Date(formData.dueDate).toISOString();

      await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/tasks`, payload, { withCredentials: true });
      setShowModal(false);
      showToast({ type: 'success', message: 'Task created successfully!' });
      fetchData();
    } catch (err: any) {
      console.error(err);
      showToast({ type: 'error', message: err.response?.data?.error || 'Failed to create task' });
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch(priority) {
      case 'HIGH': return 'bg-red-50 text-red-600 border-red-200';
      case 'MEDIUM': return 'bg-amber-50 text-amber-600 border-amber-200';
      case 'LOW': return 'bg-blue-50 text-blue-600 border-blue-200';
      default: return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Task Management</h1>
          <p className="text-sm text-slate-500 mt-1">Assign, track, and manage team activities across all projects.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 px-4 py-2.5 rounded-full font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-sm">
            <Filter size={16} /> Filter
          </button>
          <button 
            onClick={() => setShowModal(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-full font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <Plus size={18} /> New Task
          </button>
        </div>
      </div>

      <div className="flex-1 bg-slate-50 rounded-3xl border border-slate-200 p-6 overflow-hidden flex flex-col">
        {/* Kanban Board Layout */}
        <div className="flex gap-6 h-full overflow-x-auto pb-4 custom-scrollbar">
           
           {[
             { id: 'PENDING', label: 'To Do', color: 'slate' },
             { id: 'IN_PROGRESS', label: 'In Progress', color: 'amber' },
             { id: 'REVIEW', label: 'Review', color: 'purple' },
             { id: 'COMPLETED', label: 'Completed', color: 'emerald' },
           ].map(column => (
             <div 
               key={column.id} 
               className="flex-shrink-0 w-80 flex flex-col gap-4"
               onDragOver={handleDragOver}
               onDrop={(e) => handleDrop(e, column.id)}
             >
                <div className="flex items-center justify-between px-1">
                   <h3 className={`font-extrabold text-${column.color}-600 uppercase tracking-wider text-xs`}>{column.label}</h3>
                   <span className={`bg-${column.color}-100 text-${column.color}-700 px-2 py-0.5 rounded-full text-[10px] font-black`}>
                     {tasks.filter(t => (column.id === 'PENDING' && (t.status === 'PENDING' || t.status === 'TODO')) || (column.id === 'COMPLETED' && (t.status === 'COMPLETED' || t.status === 'DONE')) || t.status === column.id).length}
                   </span>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2 pb-10">
                   {loading && column.id === 'PENDING' ? (
                      <div className="text-center py-4"><div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-500"></div></div>
                   ) : (
                      tasks.filter(t => {
                        if (column.id === 'PENDING') return t.status === 'PENDING' || t.status === 'TODO';
                        if (column.id === 'COMPLETED') return t.status === 'COMPLETED' || t.status === 'DONE';
                        return t.status === column.id;
                      }).map(task => (
                        <div 
                          key={task.id} 
                          draggable 
                          onDragStart={(e) => handleDragStart(e, task.id)}
                          className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing"
                        >
                           <div className="flex items-center justify-between mb-3 gap-2">
                             {/* Touch-Friendly Mobile Quick Status Selector */}
                             <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                               <label htmlFor={`status-select-${task.id}`} className="sr-only">Move Task</label>
                               <select
                                 id={`status-select-${task.id}`}
                                 value={task.status === 'TODO' ? 'PENDING' : task.status === 'DONE' ? 'COMPLETED' : task.status}
                                 onChange={(e) => handleStatusChange(task.id, e.target.value)}
                                 className="text-[11px] font-bold rounded-lg border border-slate-200 py-1 px-2 bg-slate-50 text-slate-700 hover:bg-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer min-h-[32px]"
                                 aria-label={`Advance task status for ${task.name}`}
                               >
                                 <option value="PENDING">TODO</option>
                                 <option value="IN_PROGRESS">IN_PROGRESS</option>
                                 <option value="REVIEW">REVIEW</option>
                                 <option value="COMPLETED">DONE</option>
                               </select>
                             </div>

                             <button 
                               onClick={() => handleStatusChange(task.id, 'COMPLETED')}
                               className="text-slate-400 hover:text-emerald-600 p-1 min-h-[32px] min-w-[32px] flex items-center justify-center rounded-lg hover:bg-slate-50 transition-colors"
                               title="Mark as Done"
                               aria-label="Mark task done"
                             >
                               <CheckSquare size={16} />
                             </button>
                           </div>
                           <h4 className="font-bold text-slate-900 mb-1 leading-snug">{task.name}</h4>
                           
                           {task.project && (
                             <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-4">
                               <Briefcase size={12} className="text-emerald-500" />
                               <span className="truncate">{task.project.name}</span>
                             </div>
                           )}

                           <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                             <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                               <Clock size={12} />
                               {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No Date'}
                             </div>
                             <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center border border-emerald-200">
                               <User size={10} />
                             </div>
                           </div>
                        </div>
                      ))
                   )}
                </div>
             </div>
           ))}

        </div>
      </div>

      {/* NEW TASK MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Create Task</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700 p-2">✕</button>
            </div>
            
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-extrabold text-slate-600 uppercase tracking-wider">Task Title *</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium text-slate-700" placeholder="e.g. Procure 5kW Inverter" />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-extrabold text-slate-600 uppercase tracking-wider">Link to Project</label>
                <select value={formData.projectId} onChange={e => setFormData({...formData, projectId: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all bg-white font-medium text-slate-700">
                  <option value="">No Project (General Task)</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-600 uppercase tracking-wider">Due Date</label>
                  <input type="date" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium text-slate-700" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-extrabold text-slate-600 uppercase tracking-wider">Description</label>
                <textarea rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium text-slate-700"></textarea>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold transition-colors">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md transition-colors">
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

