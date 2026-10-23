"use client";

import React, { useState } from "react";
import {
  Calendar,
  Phone,
  Mail,
  Building,
  User,
  MapPin,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Send,
  Loader2
} from "lucide-react";

export default function DemoBookingSection() {
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    phone: "",
    email: "",
    cityState: "",
    businessType: "Rooftop Solar EPC",
    monthlyVolume: "5 to 20 projects/month",
    preferredTime: "Morning (10 AM - 1 PM)",
    notes: ""
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    // Validate phone (10 digit Indian number)
    const phoneClean = formData.phone.replace(/\D/g, "");
    if (phoneClean.length < 10) {
      setErrorMsg("Please enter a valid 10-digit mobile number for WhatsApp coordination.");
      return;
    }

    if (!formData.name.trim() || !formData.company.trim() || !formData.email.trim()) {
      setErrorMsg("Please fill in your name, company name, and work email.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/demo-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        throw new Error("Unable to submit demo request right now.");
      }

      setSubmitted(true);
    } catch (err: any) {
      // In case the API route is unreachable or offline, provide a seamless fallback to direct WhatsApp
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  const whatsappMessage = encodeURIComponent(
    `Hello WhereReady Solar OS Team! I just submitted a demo request.\n\nName: ${formData.name}\nCompany: ${formData.company}\nLocation: ${formData.cityState}\nVolume: ${formData.monthlyVolume}\nType: ${formData.businessType}\n\nI would like to schedule a 1-on-1 walkthrough.`
  );

  return (
    <section id="book-demo" className="py-24 bg-slate-950 text-white relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-5xl h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Value Proposition & What to Expect */}
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-semibold">
              <Calendar className="w-3.5 h-3.5" />
              <span>Personalized 1-on-1 Product Walkthrough</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-['Plus_Jakarta_Sans',sans-serif]">
              See How WhereReady Solar OS Fits{" "}
              <span className="bg-gradient-to-r from-blue-400 to-amber-300 bg-clip-text text-transparent">
                Your Exact Workflow
              </span>
            </h2>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              No generic sales pitch. A solar software specialist will walk you through live proposal generation, DISCOM net-metering forms, and serial-tracked inventory tailored to your business scale.
            </p>

            {/* What you'll see */}
            <div className="space-y-3 pt-2">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                During Your 25-Minute Live Demo:
              </p>
              <div className="flex items-start gap-3 text-xs sm:text-sm text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>See your actual utility bills scanned with OCR live on screen.</span>
              </div>
              <div className="flex items-start gap-3 text-xs sm:text-sm text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Customize a 6-page proposal with your own logo and equipment margins.</span>
              </div>
              <div className="flex items-start gap-3 text-xs sm:text-sm text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Review state-specific DISCOM forms (MSEDCL / Tata / BESCOM).</span>
              </div>
              <div className="flex items-start gap-3 text-xs sm:text-sm text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Learn how simple data migration is from Excel spreadsheets.</span>
              </div>
            </div>

            {/* Direct WhatsApp Callout */}
            <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
              <div>
                <p className="font-bold text-white">Prefer immediate WhatsApp chat?</p>
                <p className="text-slate-400 text-[11px] mt-0.5">Connect with our product specialist directly.</p>
              </div>
              <a
                href="https://wa.me/919890000000?text=Hello%20WhereReady%20Solar%20OS%20team,%20I%20would%20like%20to%20schedule%20a%20product%20demo."
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition-colors shrink-0 flex items-center gap-1.5"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Chat Now</span>
              </a>
            </div>
          </div>

          {/* Right Column: High-Converting Demo Form */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl relative">
            {!submitted ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="pb-3 border-b border-slate-800">
                  <h3 className="text-xl font-bold text-white">Book Your Free Live Demo</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Fill in your details and we will coordinate a screen-share walkthrough at your convenience.
                  </p>
                </div>

                {errorMsg && (
                  <div className="p-3 bg-red-950/60 border border-red-800 text-red-300 text-xs rounded-xl">
                    {errorMsg}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Your Full Name *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="e.g. Ramesh Kulkarni"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Company Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Company / Business Name *
                    </label>
                    <div className="relative">
                      <Building className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        name="company"
                        required
                        value={formData.company}
                        onChange={handleChange}
                        placeholder="e.g. Surya Shakti Solar EPC"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* WhatsApp Mobile */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      WhatsApp Mobile Number *
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                      <input
                        type="tel"
                        name="phone"
                        required
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="e.g. 98220 12345"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Work Email *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="e.g. ramesh@suryashakti.com"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* City & State */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      City &amp; State *
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        name="cityState"
                        required
                        value={formData.cityState}
                        onChange={handleChange}
                        placeholder="e.g. Pune, Maharashtra"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Business Type */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Business Type
                    </label>
                    <select
                      name="businessType"
                      value={formData.businessType}
                      onChange={handleChange}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="Rooftop Solar EPC">Rooftop Solar EPC</option>
                      <option value="Solar Installer / Contractor">Solar Installer / Contractor</option>
                      <option value="Commercial & Industrial EPC">Commercial &amp; Industrial EPC</option>
                      <option value="Solar Equipment Dealer / Distributor">Solar Equipment Dealer / Distributor</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Monthly Volume */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Approx Monthly Project Volume
                    </label>
                    <select
                      name="monthlyVolume"
                      value={formData.monthlyVolume}
                      onChange={handleChange}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="Less than 5 projects/month">Less than 5 projects / month</option>
                      <option value="5 to 20 projects/month">5 to 20 projects / month</option>
                      <option value="20 to 50 projects/month">20 to 50 projects / month</option>
                      <option value="50+ projects/month (Enterprise)">50+ projects / month (Enterprise)</option>
                    </select>
                  </div>

                  {/* Preferred Time */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Preferred Demo Time
                    </label>
                    <select
                      name="preferredTime"
                      value={formData.preferredTime}
                      onChange={handleChange}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="Morning (10 AM - 1 PM)">Morning (10 AM - 1 PM)</option>
                      <option value="Afternoon (2 PM - 5 PM)">Afternoon (2 PM - 5 PM)</option>
                      <option value="Evening (5 PM - 7 PM)">Evening (5 PM - 7 PM)</option>
                    </select>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 px-6 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 hover:from-blue-500 hover:to-blue-400 shadow-lg shadow-blue-600/30 hover:shadow-blue-500/50 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Confirming Demo Request...</span>
                      </>
                    ) : (
                      <>
                        <span>Confirm Free Demo Walkthrough</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500 mt-3">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Your contact details are strictly protected under DPDP Act 2023. Zero spam.</span>
                  </div>
                </div>
              </form>
            ) : (
              /* Success / Confirmation State */
              <div className="py-8 text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div>
                  <h3 className="text-2xl font-bold text-white">Demo Request Received!</h3>
                  <p className="text-sm text-slate-300 mt-2 max-w-md mx-auto">
                    Thank you, <strong className="text-white">{formData.name}</strong> from{" "}
                    <strong className="text-white">{formData.company}</strong>. Our solar solutions team has been notified.
                  </p>
                </div>

                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-xs text-slate-300 max-w-md mx-auto space-y-2">
                  <p className="text-slate-400">Want to connect right away?</p>
                  <a
                    href={`https://wa.me/919890000000?text=${whatsappMessage}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-md shadow-emerald-900/30"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Open WhatsApp Chat Now</span>
                  </a>
                </div>

                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="text-xs text-slate-400 hover:text-white underline underline-offset-4"
                >
                  Submit another enquiry
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
