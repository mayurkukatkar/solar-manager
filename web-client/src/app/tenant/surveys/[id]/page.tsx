"use client";
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';
import { ArrowLeft, MapPin, Calendar, CheckCircle, UploadCloud, Image as ImageIcon, CheckCircle2 } from 'lucide-react';

export default function SurveyDetail() {
  const params = useParams();
  const [survey, setSurvey] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const fetchSurvey = async () => {
    try {
      // In a real app we would have a GET /surveys/:id endpoint.
      // For now, let's just fetch all and find the one.
      const res = await axios.get(`\${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/surveys`, { withCredentials: true });
      const found = res.data.surveys.find((s: any) => s.id === params.id);
      setSurvey(found);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSurvey();
  }, [params.id]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setUploading(true);
    const formData = new FormData();
    for (let i = 0; i < e.target.files.length; i++) {
      formData.append('photos', e.target.files[i]);
    }

    try {
      const res = await axios.post(`\${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/surveys/${params.id}/photos`, formData, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSurvey({ ...survey, photos: res.data.photos });
      alert('Photos uploaded successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to upload photos');
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div className="p-8 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto"></div></div>;
  if (!survey) return <div className="p-8 text-center text-red-500">Survey not found</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/tenant/surveys" className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-slate-200 text-slate-500 hover:text-slate-900 transition-colors shadow-sm">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Survey Details</h1>
          <p className="text-sm text-slate-500">{survey.customer?.name} - {survey.id.substring(0,8).toUpperCase()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1 space-y-6">
           <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Survey Info</h3>
              <div className="space-y-4">
                 <div className="flex justify-between text-sm">
                   <span className="text-slate-500">Status</span>
                   <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">{survey.status}</span>
                 </div>
                 <div className="flex justify-between text-sm">
                   <span className="text-slate-500">Date</span>
                   <span className="font-bold text-slate-900">{survey.surveyDate ? new Date(survey.surveyDate).toLocaleDateString() : 'TBD'}</span>
                 </div>
                 <div className="flex justify-between text-sm">
                   <span className="text-slate-500">Prop. Cap</span>
                   <span className="font-bold text-slate-900">{survey.proposedCap ? `${survey.proposedCap} kW` : '-'}</span>
                 </div>
                 <div className="flex justify-between text-sm">
                   <span className="text-slate-500">Roof Type</span>
                   <span className="font-bold text-slate-900">{survey.roofType || '-'}</span>
                 </div>
              </div>
           </div>
        </div>

        <div className="col-span-2 space-y-6">
           <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-6">
                 <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Site Photos</h3>
                 <div>
                    <input type="file" id="photo-upload" multiple accept="image/*" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                    <label htmlFor="photo-upload" className={`cursor-pointer px-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors ${uploading ? 'opacity-50 pointer-events-none' : 'hover:bg-emerald-100'}`}>
                       <UploadCloud size={16} />
                       {uploading ? 'Uploading...' : 'Upload Photos'}
                    </label>
                 </div>
              </div>
              
              {survey.photos && survey.photos.length > 0 ? (
                 <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {survey.photos.map((url: string, idx: number) => (
                       <a key={idx} href={url} target="_blank" rel="noreferrer" className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-square block">
                          <img src={url} alt={`Site Photo ${idx+1}`} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                             <span className="text-white text-xs font-bold bg-black/50 px-3 py-1 rounded-full">View Full</span>
                          </div>
                       </a>
                    ))}
                 </div>
              ) : (
                 <div className="py-12 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 bg-slate-50">
                    <ImageIcon size={32} className="mb-2" />
                    <p className="text-sm font-medium">No photos uploaded yet.</p>
                 </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
}
