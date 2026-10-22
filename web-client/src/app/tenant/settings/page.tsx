"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Building2,
  MapPin,
  FileText,
  CreditCard,
  Landmark,
  Palette,
  SunMedium,
  Hash,
  ShieldCheck,
  Save,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Sparkles,
  ExternalLink,
  Layers,
  Award,
  Zap,
  Clock,
  Briefcase
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface BankDetails {
  accountName?: string;
  bankName?: string;
  accountNumber?: string;
  ifsc?: string;
  branch?: string;
  upiId?: string;
  qrCodeUrl?: string;
}

interface CommercialDefaults {
  defaultTariff?: number;
  defaultDiscom?: string;
  defaultSubsidy?: string;
  quoteValidityDays?: number;
  panelWarrantyYears?: number;
  inverterWarrantyYears?: number;
  workmanshipWarrantyYears?: number;
  defaultMilestones?: string;
}

interface DocumentPrefixes {
  lead?: string;
  quotation?: string;
  project?: string;
  invoice?: string;
  survey?: string;
  purchaseOrder?: string;
}

interface TenantData {
  id?: string;
  name?: string;
  legalName?: string;
  email?: string;
  phone?: string;
  website?: string;
  tagline?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  gstin?: string;
  pan?: string;
  msmeNumber?: string;
  contractorLicense?: string;
  logoUrl?: string;
  signatureUrl?: string;
  companyStampUrl?: string;
  signatoryName?: string;
  signatoryTitle?: string;
  primaryColor?: string;
  accentColor?: string;
  bankDetails?: BankDetails;
  commercialDefaults?: CommercialDefaults;
  documentPrefixes?: DocumentPrefixes;
  subscription?: {
    status?: string;
    endDate?: string;
    amount?: number;
    plan?: {
      name?: string;
      billingCycle?: string;
      userLimit?: number;
      storageLimit?: number;
    };
  };
  _count?: {
    users?: number;
    projects?: number;
    leads?: number;
    customers?: number;
  };
}

type TabType = "PROFILE" | "STATUTORY" | "BANKING" | "BRANDING" | "COMMERCIAL" | "PREFIXES" | "PLAN";

export default function SettingsPage() {
  const [tenant, setTenant] = useState<TenantData | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("PROFILE");
  const [form, setForm] = useState<TenantData>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Upload States
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await axios.get(`${API}/api/tenant/settings`, { withCredentials: true });
      const data: TenantData = res.data.tenant || {};
      setTenant(data);
      setForm({
        ...data,
        bankDetails: data.bankDetails || {
          accountName: data.legalName || data.name || "",
          bankName: "",
          accountNumber: "",
          ifsc: "",
          branch: "",
          upiId: "",
          qrCodeUrl: ""
        },
        commercialDefaults: data.commercialDefaults || {
          defaultTariff: 8.5,
          defaultDiscom: "MSEDCL",
          defaultSubsidy: "PM_SURYA_GHAR",
          quoteValidityDays: 15,
          panelWarrantyYears: 25,
          inverterWarrantyYears: 10,
          workmanshipWarrantyYears: 5,
          defaultMilestones: "20% Advance, 60% Material Delivery, 20% Net Metering Commissioning"
        },
        documentPrefixes: data.documentPrefixes || {
          lead: "LD-",
          quotation: "QT-",
          project: "PRJ-",
          invoice: "INV-",
          survey: "SRV-",
          purchaseOrder: "PO-"
        }
      });
    } catch (err: any) {
      console.error(err);
      if (err.response?.status === 401) {
        window.location.href = "/login";
      } else {
        setError("Failed to load settings. Please verify backend connection.");
      }
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await axios.patch(
        `${API}/api/tenant/settings`,
        {
          name: form.name,
          legalName: form.legalName,
          email: form.email,
          phone: form.phone,
          website: form.website,
          tagline: form.tagline,
          address: form.address,
          city: form.city,
          state: form.state,
          country: form.country,
          pincode: form.pincode,
          gstin: form.gstin,
          pan: form.pan,
          msmeNumber: form.msmeNumber,
          contractorLicense: form.contractorLicense,
          logoUrl: form.logoUrl,
          signatureUrl: form.signatureUrl,
          companyStampUrl: form.companyStampUrl,
          signatoryName: form.signatoryName,
          signatoryTitle: form.signatoryTitle,
          primaryColor: form.primaryColor,
          accentColor: form.accentColor,
          bankDetails: form.bankDetails,
          commercialDefaults: form.commercialDefaults,
          documentPrefixes: form.documentPrefixes
        },
        { withCredentials: true }
      );
      setTenant(res.data.tenant);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingField(fieldName);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post(`${API}/api/tenant/settings/upload`, formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" }
      });
      const url = res.data.url;

      if (fieldName === "qrCodeUrl") {
        setForm(prev => ({
          ...prev,
          bankDetails: { ...(prev.bankDetails || {}), qrCodeUrl: url }
        }));
      } else {
        setForm(prev => ({ ...prev, [fieldName]: url }));
      }
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to upload image asset");
    } finally {
      setUploadingField(null);
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-80 text-red-500">
        <AlertCircle size={32} className="mb-2" />
        <p className="font-semibold">{error}</p>
        <button
          onClick={fetchSettings}
          className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="flex flex-col items-center justify-center h-80 text-slate-400">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-sm font-medium">Loading solar configuration & company assets...</p>
      </div>
    );
  }

  const tabs = [
    { id: "PROFILE" as const, label: "Company Profile", icon: Building2 },
    { id: "STATUTORY" as const, label: "Tax & Statutory", icon: ShieldCheck },
    { id: "BANKING" as const, label: "EPC Bank & UPI", icon: Landmark },
    { id: "BRANDING" as const, label: "Branding & Assets", icon: Palette },
    { id: "COMMERCIAL" as const, label: "Solar Defaults", icon: SunMedium },
    { id: "PREFIXES" as const, label: "Document Prefixes", icon: Hash },
    { id: "PLAN" as const, label: "Plan & Usage", icon: Zap }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-7xl mx-auto pb-16">
      {/* HEADER WITH SAVE ACTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
            {form.logoUrl ? (
              <img src={form.logoUrl} alt="Logo" className="w-full h-full object-contain p-1 rounded-2xl" />
            ) : (
              <Building2 size={28} />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                {form.name || "Company Configuration"}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {tenant.subscription?.plan?.name || "Solar Pro ERP"}
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-0.5">
              Manage statutory legal identity, official EPC bank account, solar sizing defaults, and branding.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm ${
              saved
                ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                : "bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-md"
            }`}
          >
            {saved ? (
              <>
                <CheckCircle2 size={16} /> Configuration Saved!
              </>
            ) : saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={16} /> Save All Changes
              </>
            )}
          </button>
        </div>
      </div>

      {/* HORIZONTAL TAB NAVIGATION */}
      <div className="flex overflow-x-auto gap-2 p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200 scrollbar-none">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? "bg-white text-slate-900 shadow-sm border border-slate-200/80"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
            >
              <Icon size={16} className={isActive ? "text-emerald-600" : "text-slate-400"} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: COMPANY PROFILE */}
      {activeTab === "PROFILE" && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Building2 size={16} className="text-emerald-600" /> General Company Information
            </h2>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Company Display Name *</label>
              <input
                value={form.name || ""}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. WhereReady Solar Technologies"
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Official Legal Entity Name *</label>
              <input
                value={form.legalName || ""}
                onChange={e => setForm({ ...form, legalName: e.target.value })}
                placeholder="e.g. WhereReady Energy Solutions Pvt Ltd"
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">Printed on formal tax invoices and agreements.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Company Tagline / Mission</label>
              <input
                value={form.tagline || ""}
                onChange={e => setForm({ ...form, tagline: e.target.value })}
                placeholder="e.g. India's Premier Rooftop Solar Engineering Partner"
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Official Email</label>
                <input
                  type="email"
                  value={form.email || ""}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="contact@company.com"
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Official Phone</label>
                <input
                  value={form.phone || ""}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  placeholder="+91 98220 XXXXX"
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Official Website</label>
              <input
                value={form.website || ""}
                onChange={e => setForm({ ...form, website: e.target.value })}
                placeholder="https://www.wherereadysolar.com"
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <MapPin size={16} className="text-emerald-600" /> Registered Office Address
            </h2>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Premises / Street Address</label>
              <textarea
                rows={3}
                value={form.address || ""}
                onChange={e => setForm({ ...form, address: e.target.value })}
                placeholder="Suite 401, Solar Hub Commercial Complex, FC Road"
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">City</label>
                <input
                  value={form.city || ""}
                  onChange={e => setForm({ ...form, city: e.target.value })}
                  placeholder="Pune"
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">State</label>
                <input
                  value={form.state || ""}
                  onChange={e => setForm({ ...form, state: e.target.value })}
                  placeholder="Maharashtra"
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Pincode</label>
                <input
                  value={form.pincode || ""}
                  onChange={e => setForm({ ...form, pincode: e.target.value })}
                  placeholder="411005"
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Country</label>
                <input
                  value={form.country || "India"}
                  onChange={e => setForm({ ...form, country: e.target.value })}
                  placeholder="India"
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TAX & STATUTORY */}
      {activeTab === "STATUTORY" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-sm">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck size={18} className="text-emerald-600" /> Government & Statutory Registrations
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Required for DISCOM grid synchronization, net metering Form A-1, CEIG electrical clearances, and PM Surya Ghar subsidy claims.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <label className="block text-xs font-bold text-slate-700 mb-1">Goods & Services Tax (GSTIN) *</label>
              <input
                value={form.gstin || ""}
                onChange={e => setForm({ ...form, gstin: e.target.value.toUpperCase() })}
                placeholder="27AABCS1429B1Z8"
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
              />
              <p className="text-[11px] text-slate-500 mt-1.5">Mandatory for GST B2B & B2C Tax Invoices.</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <label className="block text-xs font-bold text-slate-700 mb-1">Permanent Account Number (PAN) *</label>
              <input
                value={form.pan || ""}
                onChange={e => setForm({ ...form, pan: e.target.value.toUpperCase() })}
                placeholder="AABCS1429B"
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
              />
              <p className="text-[11px] text-slate-500 mt-1.5">Company or proprietary entity PAN.</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <label className="block text-xs font-bold text-slate-700 mb-1">MSME / Udyam Registration No.</label>
              <input
                value={form.msmeNumber || ""}
                onChange={e => setForm({ ...form, msmeNumber: e.target.value.toUpperCase() })}
                placeholder="UDYAM-MH-26-0019283"
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
              />
              <p className="text-[11px] text-slate-500 mt-1.5">Printed on vendor credentials & procurement tenders.</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <label className="block text-xs font-bold text-slate-700 mb-1">Electrical Contractor License Number</label>
              <input
                value={form.contractorLicense || ""}
                onChange={e => setForm({ ...form, contractorLicense: e.target.value })}
                placeholder="MSEDCL/ELECT/LIC/2023/8892"
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
              />
              <p className="text-[11px] text-slate-500 mt-1.5">Required for DISCOM CEIG inspection & statutory WCR reports.</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: EPC BANK & PAYMENTS */}
      {activeTab === "BANKING" && (
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Landmark size={18} className="text-emerald-600" /> Official EPC Bank Account
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                These banking coordinates appear on Quotations, Proforma Invoices, Milestone Receipts, and PDF agreements.
              </p>
            </div>

            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Beneficiary / Account Name *</label>
                <input
                  value={form.bankDetails?.accountName || ""}
                  onChange={e =>
                    setForm({
                      ...form,
                      bankDetails: { ...(form.bankDetails || {}), accountName: e.target.value }
                    })
                  }
                  placeholder="e.g. WhereReady Solar Solutions Pvt Ltd"
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Bank Name *</label>
                  <input
                    value={form.bankDetails?.bankName || ""}
                    onChange={e =>
                      setForm({
                        ...form,
                        bankDetails: { ...(form.bankDetails || {}), bankName: e.target.value }
                      })
                    }
                    placeholder="e.g. HDFC Bank Ltd"
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Account Number *</label>
                  <input
                    value={form.bankDetails?.accountNumber || ""}
                    onChange={e =>
                      setForm({
                        ...form,
                        bankDetails: { ...(form.bankDetails || {}), accountNumber: e.target.value }
                      })
                    }
                    placeholder="50200088992211"
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">IFSC Code *</label>
                  <input
                    value={form.bankDetails?.ifsc || ""}
                    onChange={e =>
                      setForm({
                        ...form,
                        bankDetails: { ...(form.bankDetails || {}), ifsc: e.target.value.toUpperCase() }
                      })
                    }
                    placeholder="HDFC0001234"
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Branch Name</label>
                  <input
                    value={form.bankDetails?.branch || ""}
                    onChange={e =>
                      setForm({
                        ...form,
                        bankDetails: { ...(form.bankDetails || {}), branch: e.target.value }
                      })
                    }
                    placeholder="Shivajinagar, Pune"
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">UPI ID / VPA</label>
                <input
                  value={form.bankDetails?.upiId || ""}
                  onChange={e =>
                    setForm({
                      ...form,
                      bankDetails: { ...(form.bankDetails || {}), upiId: e.target.value.toLowerCase() }
                    })
                  }
                  placeholder="solarmanager@hdfcbank"
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* UPI QR CODE & PREVIEW */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-1">
                <QrCode size={16} className="text-emerald-600" /> Payment QR Code
              </h3>
              <p className="text-xs text-slate-500">
                Uploaded QR code is rendered directly on proposal invoices and milestone vouchers.
              </p>

              <div className="mt-4 flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 min-h-[180px]">
                {form.bankDetails?.qrCodeUrl ? (
                  <img
                    src={form.bankDetails.qrCodeUrl}
                    alt="UPI QR Code"
                    className="w-36 h-36 object-contain rounded-xl shadow-sm bg-white p-2"
                  />
                ) : (
                  <div className="text-center p-4">
                    <QrCode size={40} className="text-slate-300 mx-auto mb-2" />
                    <p className="text-xs text-slate-500 font-medium">No QR Code Uploaded</p>
                  </div>
                )}
              </div>

              <div className="mt-4">
                <label
                  className={`w-full cursor-pointer flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                    uploadingField === "qrCodeUrl"
                      ? "bg-slate-100 text-slate-400"
                      : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                  }`}
                >
                  <UploadCloud size={14} />
                  {uploadingField === "qrCodeUrl" ? "Uploading..." : "Upload UPI QR Code"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploadingField === "qrCodeUrl"}
                    onChange={e => handleUpload(e, "qrCodeUrl")}
                  />
                </label>
              </div>
            </div>

            {/* LIVE BANK CHEAT CARD */}
            <div className="p-3.5 rounded-xl bg-emerald-950 text-white text-xs font-mono space-y-1">
              <p className="text-emerald-400 text-[10px] uppercase font-bold tracking-wider">Proposal Print Preview</p>
              <p className="font-bold truncate text-white">{form.bankDetails?.accountName || "Account Name"}</p>
              <p className="text-slate-300">
                {form.bankDetails?.bankName || "Bank"} • {form.bankDetails?.accountNumber || "A/C Number"}
              </p>
              <p className="text-emerald-300 font-bold">IFSC: {form.bankDetails?.ifsc || "IFSC Code"}</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: BRANDING & ASSETS */}
      {activeTab === "BRANDING" && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-3 gap-6">
            {/* COMPANY LOGO */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Palette size={16} className="text-emerald-600" /> Company Logo
              </h3>
              <p className="text-xs text-slate-500">
                Displayed in the mobile header, web navigation, and PDF proposal covers.
              </p>

              <div className="w-full h-32 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden p-2">
                {form.logoUrl ? (
                  <img src={form.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <div className="text-center text-slate-400">
                    <Building2 size={32} className="mx-auto mb-1 text-slate-300" />
                    <span className="text-xs">No Logo Uploaded</span>
                  </div>
                )}
              </div>

              <label
                className={`w-full cursor-pointer flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                  uploadingField === "logoUrl"
                    ? "bg-slate-100 text-slate-400"
                    : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                }`}
              >
                <UploadCloud size={14} />
                {uploadingField === "logoUrl" ? "Uploading..." : "Upload Logo (PNG/JPG)"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploadingField === "logoUrl"}
                  onChange={e => handleUpload(e, "logoUrl")}
                />
              </label>
            </div>

            {/* AUTHORIZED SIGNATURE */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText size={16} className="text-emerald-600" /> Authorized Signature
              </h3>
              <p className="text-xs text-slate-500">
                Appears on Page 6 Acceptance and statutory Annexure-2 Agreements.
              </p>

              <div className="w-full h-32 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden p-2">
                {form.signatureUrl ? (
                  <img src={form.signatureUrl} alt="Signature" className="w-full h-full object-contain" />
                ) : (
                  <div className="text-center text-slate-400">
                    <FileText size={32} className="mx-auto mb-1 text-slate-300" />
                    <span className="text-xs">No Signature Uploaded</span>
                  </div>
                )}
              </div>

              <label
                className={`w-full cursor-pointer flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                  uploadingField === "signatureUrl"
                    ? "bg-slate-100 text-slate-400"
                    : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                }`}
              >
                <UploadCloud size={14} />
                {uploadingField === "signatureUrl" ? "Uploading..." : "Upload Signature (PNG)"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploadingField === "signatureUrl"}
                  onChange={e => handleUpload(e, "signatureUrl")}
                />
              </label>
            </div>

            {/* COMPANY STAMP / SEAL */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Award size={16} className="text-emerald-600" /> Company Seal / Stamp
              </h3>
              <p className="text-xs text-slate-500">
                Official circular or rectangular stamp for statutory filings and invoices.
              </p>

              <div className="w-full h-32 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden p-2">
                {form.companyStampUrl ? (
                  <img src={form.companyStampUrl} alt="Stamp" className="w-full h-full object-contain" />
                ) : (
                  <div className="text-center text-slate-400">
                    <Award size={32} className="mx-auto mb-1 text-slate-300" />
                    <span className="text-xs">No Stamp Uploaded</span>
                  </div>
                )}
              </div>

              <label
                className={`w-full cursor-pointer flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                  uploadingField === "companyStampUrl"
                    ? "bg-slate-100 text-slate-400"
                    : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                }`}
              >
                <UploadCloud size={14} />
                {uploadingField === "companyStampUrl" ? "Uploading..." : "Upload Company Stamp"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploadingField === "companyStampUrl"}
                  onChange={e => handleUpload(e, "companyStampUrl")}
                />
              </label>
            </div>
          </div>

          {/* SIGNATORY DETAILS & BRAND COLORS */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Briefcase size={16} className="text-emerald-600" /> Signatory Name & Designation
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Authorized Person Name</label>
                  <input
                    value={form.signatoryName || ""}
                    onChange={e => setForm({ ...form, signatoryName: e.target.value })}
                    placeholder="e.g. Vikram Joshi"
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Designation / Title</label>
                  <input
                    value={form.signatoryTitle || ""}
                    onChange={e => setForm({ ...form, signatoryTitle: e.target.value })}
                    placeholder="e.g. Managing Director"
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Palette size={16} className="text-emerald-600" /> Brand Theme Colors
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Primary Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={form.primaryColor || "#059669"}
                      onChange={e => setForm({ ...form, primaryColor: e.target.value })}
                      className="w-10 h-10 rounded-lg cursor-pointer border border-slate-200 p-0.5"
                    />
                    <input
                      value={form.primaryColor || "#059669"}
                      onChange={e => setForm({ ...form, primaryColor: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Accent Gold / Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={form.accentColor || "#0284c7"}
                      onChange={e => setForm({ ...form, accentColor: e.target.value })}
                      className="w-10 h-10 rounded-lg cursor-pointer border border-slate-200 p-0.5"
                    />
                    <input
                      value={form.accentColor || "#0284c7"}
                      onChange={e => setForm({ ...form, accentColor: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: SOLAR & COMMERCIAL DEFAULTS */}
      {activeTab === "COMMERCIAL" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-sm">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <SunMedium size={18} className="text-emerald-600" /> Solar Sizing & Commercial Presets
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Default values automatically prepopulate new Quick Quotes, Quotation Wizard, and Site Surveys.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Default Tariff Rate (₹/kWh) *</label>
              <input
                type="number"
                step="0.05"
                value={form.commercialDefaults?.defaultTariff ?? 8.5}
                onChange={e =>
                  setForm({
                    ...form,
                    commercialDefaults: {
                      ...(form.commercialDefaults || {}),
                      defaultTariff: parseFloat(e.target.value) || 0
                    }
                  })
                }
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">Used to calculate annual utility bill savings.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Default Electricity Board (DISCOM)</label>
              <input
                value={form.commercialDefaults?.defaultDiscom || "MSEDCL"}
                onChange={e =>
                  setForm({
                    ...form,
                    commercialDefaults: {
                      ...(form.commercialDefaults || {}),
                      defaultDiscom: e.target.value
                    }
                  })
                }
                placeholder="e.g. MSEDCL, Tata Power, BESCOM"
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Default Subsidy Scheme</label>
              <select
                value={form.commercialDefaults?.defaultSubsidy || "PM_SURYA_GHAR"}
                onChange={e =>
                  setForm({
                    ...form,
                    commercialDefaults: {
                      ...(form.commercialDefaults || {}),
                      defaultSubsidy: e.target.value
                    }
                  })
                }
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
              >
                <option value="PM_SURYA_GHAR">PM Surya Ghar: Muft Bijli Yojana (Up to ₹78,000)</option>
                <option value="STATE_ADDITIONAL">PM Surya Ghar + State Add-on Subsidy</option>
                <option value="COMMERCIAL_TAX">Commercial Section 32 Accelerated Depreciation (40%)</option>
                <option value="NONE">No Subsidy / Industrial Direct EPC</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Quotation Validity (Days)</label>
              <input
                type="number"
                value={form.commercialDefaults?.quoteValidityDays ?? 15}
                onChange={e =>
                  setForm({
                    ...form,
                    commercialDefaults: {
                      ...(form.commercialDefaults || {}),
                      quoteValidityDays: parseInt(e.target.value) || 15
                    }
                  })
                }
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">PV Panel Warranty (Years)</label>
              <input
                type="number"
                value={form.commercialDefaults?.panelWarrantyYears ?? 25}
                onChange={e =>
                  setForm({
                    ...form,
                    commercialDefaults: {
                      ...(form.commercialDefaults || {}),
                      panelWarrantyYears: parseInt(e.target.value) || 25
                    }
                  })
                }
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Inverter Warranty (Years)</label>
              <input
                type="number"
                value={form.commercialDefaults?.inverterWarrantyYears ?? 10}
                onChange={e =>
                  setForm({
                    ...form,
                    commercialDefaults: {
                      ...(form.commercialDefaults || {}),
                      inverterWarrantyYears: parseInt(e.target.value) || 10
                    }
                  })
                }
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Standard Payment Milestone Schedule</label>
            <textarea
              rows={2}
              value={form.commercialDefaults?.defaultMilestones || ""}
              onChange={e =>
                setForm({
                  ...form,
                  commercialDefaults: {
                    ...(form.commercialDefaults || {}),
                    defaultMilestones: e.target.value
                  }
                })
              }
              placeholder="e.g. 20% on booking, 60% on delivery of solar panels & inverters, 20% on DISCOM net-metering commissioning"
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
            />
          </div>
        </div>
      )}

      {/* TAB 6: DOCUMENT PREFIXES */}
      {activeTab === "PREFIXES" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-sm">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Hash size={18} className="text-emerald-600" /> Automatic Sequence & Document Prefixes
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Customize the numbering codes generated for newly created system entities.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              { key: "quotation" as const, label: "Quotation Code", default: "QT-", sample: "QT-2024-0012" },
              { key: "project" as const, label: "Project Code", default: "PRJ-", sample: "PRJ-2024-0045" },
              { key: "invoice" as const, label: "Tax Invoice Code", default: "INV-", sample: "INV-2024-0091" },
              { key: "lead" as const, label: "Lead Code", default: "LD-", sample: "LD-00192" },
              { key: "survey" as const, label: "Site Survey Code", default: "SRV-", sample: "SRV-0082" },
              { key: "purchaseOrder" as const, label: "Purchase Order Code", default: "PO-", sample: "PO-0034" }
            ].map(item => (
              <div key={item.key} className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <label className="block text-xs font-bold text-slate-700 mb-1">{item.label}</label>
                <input
                  value={form.documentPrefixes?.[item.key] || item.default}
                  onChange={e =>
                    setForm({
                      ...form,
                      documentPrefixes: {
                        ...(form.documentPrefixes || {}),
                        [item.key]: e.target.value.toUpperCase()
                      }
                    })
                  }
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono font-bold bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
                <p className="text-[11px] text-slate-400 mt-1.5 font-mono">Example: {form.documentPrefixes?.[item.key] || item.default}2024-001</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 7: SUBSCRIPTION & USAGE */}
      {activeTab === "PLAN" && (
        <div className="space-y-6">
          {/* SUBSCRIPTION BANNER */}
          {tenant.subscription && (
            <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-slate-900 rounded-2xl p-6 text-white shadow-lg shadow-emerald-950/20">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-white/20 text-white backdrop-blur-md">
                    {tenant.subscription.status === "ACTIVE" ? "Active Enterprise Subscription" : tenant.subscription.status}
                  </span>
                  <h2 className="text-3xl font-black mt-2 tracking-tight">
                    {tenant.subscription.plan?.name || "Solar Pro ERP"} Plan
                  </h2>
                  <p className="text-emerald-100 text-sm mt-1">
                    Valid Until:{" "}
                    <strong>
                      {tenant.subscription.endDate
                        ? new Date(tenant.subscription.endDate).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "long",
                            year: "numeric"
                          })
                        : "Ongoing"}
                    </strong>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black">₹{(tenant.subscription.amount || 0).toLocaleString()}</p>
                  <p className="text-emerald-200 text-xs">
                    per {tenant.subscription.plan?.billingCycle?.toLowerCase() || "month"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* RESOURCE CONSUMPTION STATS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Active Users / Staff", value: tenant._count?.users || 0, max: tenant.subscription?.plan?.userLimit || 10, icon: Building2 },
              { label: "Total Solar Projects", value: tenant._count?.projects || 0, max: "Unlimited", icon: Zap },
              { label: "Sales Pipeline Leads", value: tenant._count?.leads || 0, max: "Unlimited", icon: Hash },
              { label: "Installed Customers", value: tenant._count?.customers || 0, max: "Unlimited", icon: ShieldCheck }
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-500">{stat.label}</span>
                    <Icon size={16} className="text-emerald-600" />
                  </div>
                  <p className="text-2xl font-black text-slate-900">{stat.value}</p>
                  <p className="text-[11px] text-slate-400 mt-1">Limit: {stat.max}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
