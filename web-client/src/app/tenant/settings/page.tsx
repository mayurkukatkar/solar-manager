"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { Settings, Save, Building2, MapPin, FileText, CreditCard, Image as ImageIcon, UploadCloud } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function SettingsPage() {
  const [tenant, setTenant] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingSig, setUploadingSig] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios.get(`${API}/api/tenant/settings`, { withCredentials: true })
      .then(res => {
        setTenant(res.data.tenant || {});
        setForm(res.data.tenant || {});
      }).catch(err => {
        console.error(err);
        setError("Failed to load settings. Please check your connection or backend server.");
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { name, legalName, email, phone, address, city, state, country, pincode, gstin, pan } = form;
      await axios.patch(`${API}/api/tenant/settings`, { name, legalName, email, phone, address, city, state, country, pincode, gstin, pan }, { withCredentials: true });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) { alert(err.response?.data?.error || "Failed to save"); }
    setSaving(false);
  };

  const handleUpload = async (e, field) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (field === 'logoUrl') setUploadingLogo(true);
    if (field === 'signatureUrl') setUploadingSig(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post(`${API}/api/tenant/settings/upload`, formData, { 
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setForm(prev => ({ ...prev, [field]: res.data.url }));
    } catch (err) {
      alert("Failed to upload image");
    } finally {
      if (field === 'logoUrl') setUploadingLogo(false);
      if (field === 'signatureUrl') setUploadingSig(false);
    }
  };

  if (error) return <div className="flex items-center justify-center h-64 text-red-500 font-semibold">{error}</div>;
  if (!tenant) return <div className="flex items-center justify-center h-64 text-slate-400">Loading settings...</div>;

  const InputField = ({ label, field, placeholder, icon: Icon }) => (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1.5">{label}</label>
      <div className="relative">
        {Icon && <Icon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />}
        <input
          value={form[field] || ""}
          onChange={e => setForm({ ...form, [field]: e.target.value })}
          placeholder={placeholder}
          className={`w-full border border-slate-200 rounded-xl ${Icon ? "pl-9" : "pl-3"} pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all`}
        />
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Company Settings</h1>
          <p className="text-sm text-slate-500 mt-1">Manage your company profile and configuration</p>
        </div>
        <button onClick={handleSave} disabled={saving} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm ${saved ? "bg-emerald-100 text-emerald-700" : "bg-emerald-600 text-white hover:bg-emerald-700"}`}>
          {saved ? <><Save size={16} /> Saved!</> : saving ? "Saving..." : <><Save size={16} /> Save Changes</>}
        </button>
      </div>

      {/* Subscription Info */}
      {tenant.subscription && (
        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white mb-8 shadow-lg shadow-emerald-200/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-xs font-semibold uppercase tracking-wider">Current Plan</p>
              <h2 className="text-2xl font-bold mt-1">{tenant.subscription.plan?.name || "Free"}</h2>
              <p className="text-emerald-100 text-sm mt-1">Status: {tenant.subscription.status} • Expires: {new Date(tenant.subscription.endDate).toLocaleDateString()}</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold">₹{(tenant.subscription.amount || 0).toLocaleString()}</p>
              <p className="text-emerald-100 text-xs">/ {tenant.subscription.plan?.billingCycle?.toLowerCase() || "month"}</p>
            </div>
          </div>
        </div>
      )}

      {/* Usage Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Users", value: tenant._count?.users || 0 },
          { label: "Projects", value: tenant._count?.projects || 0 },
          { label: "Leads", value: tenant._count?.leads || 0 },
          { label: "Customers", value: tenant._count?.customers || 0 }
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <p className="text-2xl font-bold text-slate-800">{s.value}</p>
            <p className="text-xs font-semibold text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Company Info */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2"><Building2 size={16} className="text-emerald-600" /> Company Information</h3>
          <div className="space-y-4">
            <InputField label="Company Name" field="name" placeholder="Your Company Name" icon={Building2} />
            <InputField label="Legal Name" field="legalName" placeholder="Legal Entity Name" />
            <InputField label="Email" field="email" placeholder="company@example.com" />
            <InputField label="Phone" field="phone" placeholder="+91 XXXXX XXXXX" />
          </div>
        </div>

        {/* Address */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2"><MapPin size={16} className="text-emerald-600" /> Address</h3>
          <div className="space-y-4">
            <InputField label="Address" field="address" placeholder="Street Address" icon={MapPin} />
            <div className="grid grid-cols-2 gap-3">
              <InputField label="City" field="city" placeholder="City" />
              <InputField label="State" field="state" placeholder="State" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <InputField label="Country" field="country" placeholder="Country" />
              <InputField label="Pincode" field="pincode" placeholder="Pincode" />
            </div>
          </div>
        </div>

        {/* Tax Info */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 md:col-span-2">
          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2"><CreditCard size={16} className="text-emerald-600" /> Tax & Legal</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <InputField label="GSTIN" field="gstin" placeholder="22AAAAA0000A1Z5" icon={FileText} />
            <InputField label="PAN" field="pan" placeholder="AAAAA0000A" icon={CreditCard} />
          </div>
        </div>

        {/* Branding & Assets */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 md:col-span-2">
          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2"><ImageIcon size={16} className="text-emerald-600" /> Branding & Assets</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-2">Company Logo</label>
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden">
                  {form.logoUrl ? (
                    <img src={form.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                  ) : (
                    <Building2 size={24} className="text-slate-300" />
                  )}
                </div>
                <div className="flex-1">
                  <label className={`cursor-pointer inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${uploadingLogo ? 'bg-slate-100 text-slate-400' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}>
                    <UploadCloud size={16} />
                    {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
                    <input type="file" accept="image/*" className="hidden" disabled={uploadingLogo} onChange={e => handleUpload(e, 'logoUrl')} />
                  </label>
                  <p className="text-xs text-slate-500 mt-2">Recommended: Square image, max 2MB (PNG/JPG)</p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-2">Authorized Signature</label>
              <div className="flex items-center gap-4">
                <div className="w-32 h-16 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden">
                  {form.signatureUrl ? (
                    <img src={form.signatureUrl} alt="Signature" className="w-full h-full object-contain" />
                  ) : (
                    <FileText size={24} className="text-slate-300" />
                  )}
                </div>
                <div className="flex-1">
                  <label className={`cursor-pointer inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${uploadingSig ? 'bg-slate-100 text-slate-400' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}>
                    <UploadCloud size={16} />
                    {uploadingSig ? 'Uploading...' : 'Upload Signature'}
                    <input type="file" accept="image/*" className="hidden" disabled={uploadingSig} onChange={e => handleUpload(e, 'signatureUrl')} />
                  </label>
                  <p className="text-xs text-slate-500 mt-2">Recommended: Transparent background (PNG)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
