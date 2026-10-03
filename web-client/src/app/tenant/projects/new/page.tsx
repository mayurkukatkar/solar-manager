"use client";
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Briefcase, Zap, MapPin, Calendar, Users, DollarSign } from 'lucide-react';

export default function NewProject() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [leads, setLeads] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  
  // Basic Form State
  const [formData, setFormData] = useState({
    name: '',
    customerId: '',
    leadId: '',
    quotationId: '',
    surveyId: '',
    capacity: '',
    systemType: 'On-Grid',
    projectType: 'Residential',
    projectOwnerId: '',
    installationAddress: '',
    city: '',
    state: '',
    pincode: '',
    startDate: '',
    expectedCompletionDate: '',
    priority: 'Medium',
    estimatedValue: '',
    estimatedCost: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [leadsRes, usersRes] = await Promise.all([
          axios.get(`\${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/leads`, { withCredentials: true }),
          axios.get(`\${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/staff`, { withCredentials: true }).catch(() => ({ data: { staff: [] } }))
        ]);
        
        // Only show WON leads that can be converted, or ALL leads if needed. For simplicity, just get leads with their quotations
        setLeads(leadsRes.data.leads || []);
        
        // Just use any available staff, assuming an endpoint exists or default to empty
        if (usersRes.data && usersRes.data.staff) {
          setUsers(usersRes.data.staff);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  const handleLeadSelect = (e: any) => {
    const leadId = e.target.value;
    const lead = leads.find(l => l.id === leadId);
    
    if (lead) {
      setFormData(prev => ({
        ...prev,
        leadId: lead.id,
        name: `${lead.name} - ${lead.estimatedCap || ''} ${lead.capacityUnit || 'kW'} ${lead.systemType || 'Solar'} Project`,
        capacity: lead.estimatedCap ? lead.estimatedCap.toString() : '',
        systemType: lead.systemType || 'On-Grid',
        installationAddress: lead.address || '',
        city: lead.city || '',
        state: lead.state || ''
      }));
    } else {
      setFormData(prev => ({ ...prev, leadId: '' }));
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`\${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/projects`, formData, { withCredentials: true });
      router.push(`/tenant/projects/${res.data.project.id}`);
    } catch (err) {
      console.error(err);
      setLoading(false);
      alert('Failed to create project');
    }
  };

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors">
        <ArrowLeft size={16} /> Back to Projects
      </button>

      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Briefcase className="text-emerald-600" /> Create New Project
        </h1>
        <p className="text-slate-500 mt-1 text-sm">Convert a won lead into an active solar installation project.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Link from Lead */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-6 text-slate-800 font-semibold border-b border-slate-100 pb-3">
            <Users size={18} className="text-emerald-600" /> Link to Existing Lead / Customer
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">Import from Lead (Optional)</label>
              <select 
                value={formData.leadId} 
                onChange={handleLeadSelect}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm bg-slate-50"
              >
                <option value="">-- Select a Lead --</option>
                {leads.map(lead => (
                  <option key={lead.id} value={lead.id}>{lead.name} ({lead.company || lead.status})</option>
                ))}
              </select>
              <p className="text-xs text-slate-500 mt-1">This will automatically populate address and capacity details.</p>
            </div>
            
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">Project Name *</label>
              <input 
                required
                type="text" 
                name="name"
                value={formData.name} 
                onChange={handleChange}
                placeholder="e.g. Rajesh Sharma - 5kW Residential"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
              />
            </div>
          </div>
        </div>

        {/* Step 2: System Configuration */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-6 text-slate-800 font-semibold border-b border-slate-100 pb-3">
            <Zap size={18} className="text-emerald-600" /> System Configuration
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">System Capacity (kW) *</label>
              <input 
                required
                type="number" 
                step="0.1"
                name="capacity"
                value={formData.capacity} 
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">System Type</label>
              <select 
                name="systemType"
                value={formData.systemType} 
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
              >
                <option value="On-Grid">On-Grid (Grid-Tied)</option>
                <option value="Off-Grid">Off-Grid (Standalone)</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">Project Type</label>
              <select 
                name="projectType"
                value={formData.projectType} 
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
              >
                <option value="Residential">Residential</option>
                <option value="Commercial">Commercial</option>
                <option value="Industrial">Industrial</option>
                <option value="Utility">Utility Scale</option>
              </select>
            </div>
          </div>
        </div>

        {/* Step 3: Location */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-6 text-slate-800 font-semibold border-b border-slate-100 pb-3">
            <MapPin size={18} className="text-emerald-600" /> Installation Location
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1 md:col-span-2">
              <label className="text-sm font-semibold text-slate-700">Address Line 1</label>
              <input 
                type="text" 
                name="installationAddress"
                value={formData.installationAddress} 
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">City</label>
              <input 
                type="text" 
                name="city"
                value={formData.city} 
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">State / Pincode</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  name="state"
                  placeholder="State"
                  value={formData.state} 
                  onChange={handleChange}
                  className="w-1/2 px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                />
                <input 
                  type="text" 
                  name="pincode"
                  placeholder="PIN"
                  value={formData.pincode} 
                  onChange={handleChange}
                  className="w-1/2 px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Step 4: Financials & Dates */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-6 text-slate-800 font-semibold border-b border-slate-100 pb-3">
            <Calendar size={18} className="text-emerald-600" /> Schedule & Financials
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">Planned Start Date</label>
              <input 
                type="date" 
                name="startDate"
                value={formData.startDate} 
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">Expected Completion Date</label>
              <input 
                type="date" 
                name="expectedCompletionDate"
                value={formData.expectedCompletionDate} 
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-1"><DollarSign size={14} className="text-slate-400"/> Estimated Project Value (Revenue)</label>
              <input 
                type="number"
                step="0.01" 
                name="estimatedValue"
                placeholder="₹"
                value={formData.estimatedValue} 
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-medium text-slate-800"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-1"><DollarSign size={14} className="text-slate-400"/> Estimated Cost (Budget)</label>
              <input 
                type="number" 
                step="0.01"
                name="estimatedCost"
                placeholder="₹"
                value={formData.estimatedCost} 
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-medium text-slate-800"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-4">
          <button 
            type="submit"
            disabled={loading}
            className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-colors shadow-md flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={18} />}
            {loading ? 'Creating Project...' : 'Create Project'}
          </button>
        </div>

      </form>
    </div>
  );
}
