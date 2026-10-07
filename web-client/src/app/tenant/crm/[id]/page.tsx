"use client";
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { 
  User, Phone, Mail, MapPin, CheckCircle2, ChevronRight,
  ClipboardList, Calculator, Briefcase, Truck, Receipt, Wrench, FileText, ArrowLeft
} from 'lucide-react';

export default function Customer360View() {
  const params = useParams();
  const router = useRouter();
  const [lead, setLead] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeStage, setActiveStage] = useState('LEAD');

  useEffect(() => {
    const fetchLeadData = async () => {
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/leads/${params.id}`, { withCredentials: true });
        setLead(res.data.lead);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeadData();
  }, [params.id]);

  // Stages of the Pipeline
  const PIPELINE_STAGES = [
    { id: 'LEAD', name: 'Lead Info', icon: User, color: 'text-slate-600' },
    { id: 'SURVEY', name: 'Site Survey', icon: ClipboardList, color: 'text-amber-600' },
    { id: 'QUOTE', name: 'Quotation', icon: Calculator, color: 'text-blue-600' },
    { id: 'PROJECT', name: 'Project', icon: Briefcase, color: 'text-indigo-600' },
    { id: 'PROCUREMENT', name: 'Materials', icon: Truck, color: 'text-orange-600' },
    { id: 'FINANCE', name: 'Finance', icon: Receipt, color: 'text-emerald-600' },
    { id: 'SERVICE', name: 'Support / AMC', icon: Wrench, color: 'text-slate-600' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!lead) {
    return <div className="text-red-500 p-8 text-center">Lead/Customer not found</div>;
  }

  const { customer, surveys, quotations, projects, invoices } = lead;
  const activeProject = projects && projects.length > 0 ? projects[0] : null;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto">
      
      {/* HEADER: Customer Profile Card */}
      <div className="flex items-center gap-4 mb-2">
        <Link href="/tenant/crm" className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-slate-200 text-slate-500 hover:text-slate-900 transition-colors shadow-sm">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Customer 360°</h1>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex items-start justify-between">
         <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center font-bold text-xl shadow-inner border-2 border-white">
              {lead.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight">{lead.name}</h1>
              <div className="flex items-center gap-4 mt-2 text-sm font-semibold text-slate-500">
                <span className="flex items-center gap-1.5"><Phone size={14} className="text-slate-400" /> {lead.mobile}</span>
                {lead.email && <span className="flex items-center gap-1.5"><Mail size={14} className="text-slate-400" /> {lead.email}</span>}
                {lead.city && <span className="flex items-center gap-1.5"><MapPin size={14} className="text-slate-400" /> {lead.city}</span>}
              </div>
            </div>
         </div>
         <div className="text-right">
           <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${lead.status === 'WON' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
             <CheckCircle2 size={12} /> {lead.status === 'WON' ? 'Active Customer' : 'Active Lead'}
           </span>
         </div>
      </div>

      {/* PIPELINE TRACKER */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex overflow-x-auto custom-scrollbar">
        {PIPELINE_STAGES.map((stage, index) => {
          const isActive = activeStage === stage.id;
          const Icon = stage.icon;
          return (
            <button
              key={stage.id}
              onClick={() => setActiveStage(stage.id)}
              className={`flex-1 min-w-[120px] flex flex-col items-center justify-center p-4 gap-2 transition-colors relative border-b-2 ${
                isActive ? 'bg-slate-50 border-slate-800' : 'bg-white border-transparent hover:bg-slate-50/50'
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                isActive ? 'bg-white shadow-md text-slate-900' : 'bg-slate-50 text-slate-400'
              }`}>
                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={`text-[11px] font-bold tracking-wider ${isActive ? 'text-slate-900' : 'text-slate-400'}`}>
                {stage.name}
              </span>

              {index < PIPELINE_STAGES.length - 1 && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 text-slate-200 hidden md:block">
                  <ChevronRight size={20} />
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* DYNAMIC CONTENT AREA */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 min-h-[400px] p-8 relative overflow-hidden">
        
        {/* Placeholder for actual content based on stage */}
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
           {activeStage === 'LEAD' && <User size={200} />}
           {activeStage === 'SURVEY' && <ClipboardList size={200} />}
           {activeStage === 'QUOTE' && <Calculator size={200} />}
           {activeStage === 'PROJECT' && <Briefcase size={200} />}
           {activeStage === 'PROCUREMENT' && <Truck size={200} />}
           {activeStage === 'FINANCE' && <Receipt size={200} />}
           {activeStage === 'SERVICE' && <Wrench size={200} />}
        </div>

        <div className="relative z-10">
          <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
            {PIPELINE_STAGES.find(s => s.id === activeStage)?.name} Details
          </h2>
          
          {/* LEAD INFO */}
          {activeStage === 'LEAD' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl">
              <div className="space-y-4">
                 <h3 className="font-bold text-slate-900 mb-4 text-lg">Lead Details</h3>
                 <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-5">
                   <InfoRow label="Requirement" value={lead?.estimatedCap ? `${lead.estimatedCap} kW` : 'Not Specified'} />
                   <InfoRow label="Source" value={lead?.source || 'Direct Entry'} />
                   <InfoRow label="Company" value={lead.company || 'Individual'} />
                   <InfoRow label="Creation Date" value={new Date(lead.createdAt).toLocaleDateString()} />
                 </div>
                 
                 {lead.status !== 'WON' && (
                   <div className="pt-4 border-t border-slate-100 mt-4 flex gap-3">
                     <button onClick={async () => {
                        if (!window.confirm("Convert this Lead into a Customer and create a Project?")) return;
                        try {
                          await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/leads/${lead.id}/convert`, {}, { withCredentials: true });
                          window.location.reload();
                        } catch (err) {
                          alert("Failed to convert lead.");
                        }
                     }} className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-600/20 hover:bg-emerald-700 transition-colors w-full">
                       Convert to Customer & Project
                     </button>
                   </div>
                 )}
                 <div className="pt-4 border-t border-slate-100 mt-4 flex gap-3">
                   <Link href="/tenant/surveys" className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-md shadow-slate-900/20 hover:bg-slate-800 transition-colors text-center w-full">
                     Schedule Site Survey
                   </Link>
                 </div>
              </div>
              
              <div>
                 <h3 className="font-bold text-slate-900 mb-4 text-lg">Activity Timeline</h3>
                 <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                   {lead?.activities?.map((activity: any) => (
                     <div key={activity.id} className="flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shrink-0 mt-1">
                          <CheckCircle2 size={14} />
                        </div>
                        <div className="flex-1 bg-white border border-slate-100 p-3 rounded-xl shadow-sm">
                          <p className="text-sm font-semibold text-slate-800">{activity.description}</p>
                          <p className="text-xs text-slate-400 mt-1">{new Date(activity.createdAt).toLocaleString()}</p>
                        </div>
                     </div>
                   ))}
                   {!lead?.activities?.length && (
                     <div className="text-slate-500 text-sm italic p-4 text-center border border-dashed border-slate-200 rounded-xl">
                       No activities recorded yet.
                     </div>
                   )}
                 </div>
              </div>
            </div>
          )}

          {/* SURVEY INFO */}
          {activeStage === 'SURVEY' && (
            <div className="space-y-4 max-w-2xl">
               {surveys && surveys.length > 0 ? (
                 surveys.map((survey: any) => (
                   <div key={survey.id} className="p-4 border border-slate-100 rounded-xl mb-4 bg-slate-50/50">
                     <InfoRow label="Survey Date" value={survey.surveyDate ? new Date(survey.surveyDate).toLocaleDateString() : 'Pending'} />
                     <InfoRow label="Proposed Cap" value={survey.proposedCap ? `${survey.proposedCap} kW` : '-'} />
                     <InfoRow label="Roof Type" value={survey.roofType || '-'} />
                     <InfoRow label="Status" value={survey.status} isBadge color="blue" />
                   </div>
                 ))
               ) : (
                 <div className="text-slate-500 py-8 text-center font-medium border border-dashed border-slate-200 rounded-2xl">
                   No site surveys have been conducted yet.
                 </div>
               )}
               <div className="pt-6 border-t border-slate-100 mt-6 flex gap-3">
                 <Link href="/tenant/quotations" className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-600/20 hover:bg-blue-700 transition-colors">
                   Generate Quotation
                 </Link>
               </div>
            </div>
          )}

          {/* QUOTE INFO */}
          {activeStage === 'QUOTE' && (
            <div className="space-y-4 max-w-2xl">
               {quotations && quotations.length > 0 ? (
                 quotations.map((quote: any) => (
                   <div key={quote.id} className="p-4 border border-slate-100 rounded-xl mb-4 bg-slate-50/50">
                     <InfoRow label="Quote ID" value={quote.qNumber} />
                     <InfoRow label="Total Value" value={`₹${quote.total}`} />
                     <InfoRow label="Status" value={quote.status} isBadge color={quote.status === 'ACCEPTED' ? 'emerald' : 'amber'} />
                     {quote.status !== 'ACCEPTED' && (
                       <div className="pt-4 border-t border-slate-100 mt-4 flex gap-3">
                         <button onClick={async () => {
                             if(!window.confirm('Convert quote to active Project?')) return;
                             try {
                               await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/quotations/${quote.id}/convert`, {}, { withCredentials: true });
                               window.location.reload();
                             } catch(err) { alert('Failed to convert'); }
                         }} className="px-6 py-2 bg-amber-500 text-white rounded-xl text-sm font-bold shadow-md hover:bg-amber-600 transition-colors">
                           Convert to Project
                         </button>
                       </div>
                     )}
                   </div>
                 ))
               ) : (
                 <div className="text-slate-500 py-8 text-center font-medium border border-dashed border-slate-200 rounded-2xl">
                   No quotations have been generated yet.
                 </div>
               )}
               <div className="pt-6 border-t border-slate-100 mt-6 flex gap-3">
                 <Link href="/tenant/quotations" className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-md shadow-slate-900/20 hover:bg-slate-800 transition-colors">
                   Create New Quotation
                 </Link>
               </div>
            </div>
          )}

          {/* PROJECT INFO */}
          {activeStage === 'PROJECT' && (
            <div className="space-y-4 max-w-2xl">
               {activeProject ? (
                 <div className="p-4 border border-slate-100 rounded-xl mb-4 bg-slate-50/50">
                   <InfoRow label="Project Name" value={activeProject.name} />
                   <InfoRow label="Status" value={activeProject.status} isBadge color="emerald" />
                   <InfoRow label="Capacity" value={activeProject.capacity ? `${activeProject.capacity} kW` : '-'} />
                 </div>
               ) : (
                 <div className="text-slate-500 py-8 text-center font-medium border border-dashed border-slate-200 rounded-2xl">
                   No active projects found for this customer.
                 </div>
               )}
            </div>
          )}

          {/* FINANCE INFO */}
          {activeStage === 'FINANCE' && (
            <div className="space-y-4 max-w-2xl">
               {invoices && invoices.length > 0 ? (
                 invoices.map((inv: any) => (
                   <div key={inv.id} className="p-4 border border-slate-100 rounded-xl mb-4 bg-slate-50/50">
                     <InfoRow label="Invoice No" value={inv.invoiceNumber} />
                     <InfoRow label="Amount" value={`₹${inv.amount}`} />
                     <InfoRow label="Status" value={inv.status} isBadge color={inv.status === 'PAID' ? 'emerald' : 'amber'} />
                   </div>
                 ))
               ) : (
                 <div className="text-slate-500 py-8 text-center font-medium border border-dashed border-slate-200 rounded-2xl">
                   No invoices have been generated yet.
                 </div>
               )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// Helper for displaying rows of info cleanly
function InfoRow({ label, value, isBadge, color }: any) {
  const badgeColors: any = {
    emerald: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
    blue: 'bg-blue-50 text-blue-600 border border-blue-200',
    amber: 'bg-amber-50 text-amber-600 border border-amber-200',
    default: 'bg-slate-100 text-slate-700 border border-slate-200',
  };
  
  const badgeClass = badgeColors[color] || badgeColors.default;

  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
      <span className="text-sm font-bold text-slate-400">{label}</span>
      {isBadge ? (
        <span className={`px-2 py-0.5 rounded text-xs font-bold ${badgeClass}`}>{value}</span>
      ) : (
        <span className="text-sm font-bold text-slate-800">{value}</span>
      )}
    </div>
  );
}
