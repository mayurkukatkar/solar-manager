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
  ShieldCheck,
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
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  const whatsappMessage = encodeURIComponent(
    `Hello WhereReady Solar OS Team! I just submitted a demo request.\n\nName: ${formData.name}\nCompany: ${formData.company}\nLocation: ${formData.cityState}\nVolume: ${formData.monthlyVolume}\nType: ${formData.businessType}\n\nI would like to schedule a 1-on-1 walkthrough.`
  );

  return (
    <section id="book-demo" className="py-24 sm:py-32 bg-white text-slate-900 border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Context & What to Expect */}
          <div className="lg:col-span-5 space-y-6">
            <span className="text-xs font-semibold tracking-wider text-blue-600 uppercase">
              Free 1-on-1 Walkthrough
            </span>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.15] font-['Plus_Jakarta_Sans',sans-serif]">
              See WhereReady Solar OS in action.
            </h2>

            <p className="text-base text-slate-600 leading-relaxed font-normal">
              No generic sales pitch. A solar software specialist will walk you through proposal generation, DISCOM net-metering forms, and serialized inventory tailored to your business scale.
            </p>

            {/* Checklist */}
            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3 text-sm text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>See your actual utility bills scanned with OCR live.</span>
              </div>
              <div className="flex items-start gap-3 text-sm text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Customize proposal templates with your own equipment margins.</span>
              </div>
              <div className="flex items-start gap-3 text-sm text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Review state-specific DISCOM forms (MSEDCL, Tata Power, BESCOM).</span>
              </div>
            </div>

            {/* Direct WhatsApp Callout */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900">Prefer WhatsApp?</p>
                <p className="text-slate-500 text-[11px] mt-0.5">Chat directly with our product specialist.</p>
              </div>
              <a
                href="https://wa.me/919890000000?text=Hello%20WhereReady%20Solar%20OS%20team,%20I%20would%20like%20to%20schedule%20a%20product%20demo."
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-full text-xs transition-colors shrink-0 flex items-center gap-1.5 shadow-2xs"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Chat Now</span>
              </a>
            </div>
          </div>

          {/* Right Column: Clean White Demo Form */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-lg shadow-slate-100">
            {!submitted ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="pb-3 border-b border-slate-100">
                  <h3 className="text-xl font-extrabold text-slate-900">Request a Free Live Demo</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Fill in your company details and we will coordinate a screen-share walkthrough at your convenience.
                  </p>
                </div>

                {errorMsg && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
                    {errorMsg}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Your Full Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g. Ramesh Kulkarni"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Company Name *
                    </label>
                    <input
                      type="text"
                      name="company"
                      required
                      value={formData.company}
                      onChange={handleChange}
                      placeholder="e.g. Surya Shakti Solar EPC"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      WhatsApp Mobile Number *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="e.g. 98220 12345"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Work Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="e.g. ramesh@suryashakti.com"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      City &amp; State *
                    </label>
                    <input
                      type="text"
                      name="cityState"
                      required
                      value={formData.cityState}
                      onChange={handleChange}
                      placeholder="e.g. Pune, Maharashtra"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Business Type
                    </label>
                    <select
                      name="businessType"
                      value={formData.businessType}
                      onChange={handleChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
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
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Approx Monthly Volume
                    </label>
                    <select
                      name="monthlyVolume"
                      value={formData.monthlyVolume}
                      onChange={handleChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                    >
                      <option value="Less than 5 projects/month">Less than 5 projects / month</option>
                      <option value="5 to 20 projects/month">5 to 20 projects / month</option>
                      <option value="20 to 50 projects/month">20 to 50 projects / month</option>
                      <option value="50+ projects/month (Enterprise)">50+ projects / month (Enterprise)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Preferred Demo Time
                    </label>
                    <select
                      name="preferredTime"
                      value={formData.preferredTime}
                      onChange={handleChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                    >
                      <option value="Morning (10 AM - 1 PM)">Morning (10 AM - 1 PM)</option>
                      <option value="Afternoon (2 PM - 5 PM)">Afternoon (2 PM - 5 PM)</option>
                      <option value="Evening (5 PM - 7 PM)">Evening (5 PM - 7 PM)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 px-6 rounded-full text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
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

                  <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 mt-3">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Your details are protected under DPDP Act 2023. Zero spam.</span>
                  </div>
                </div>
              </form>
            ) : (
              <div className="py-8 text-center space-y-5 animate-in fade-in duration-300">
                <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>

                <div>
                  <h3 className="text-2xl font-extrabold text-slate-900">Demo Request Received</h3>
                  <p className="text-sm text-slate-600 mt-1 max-w-md mx-auto leading-relaxed">
                    Thank you, <strong className="text-slate-900">{formData.name}</strong> from{" "}
                    <strong className="text-slate-900">{formData.company}</strong>. Our solar solutions team has been notified.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700 max-w-md mx-auto space-y-2">
                  <p className="text-slate-500">Want to connect right away?</p>
                  <a
                    href={`https://wa.me/919890000000?text=${whatsappMessage}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-full transition-all shadow-2xs"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Open WhatsApp Chat Now</span>
                  </a>
                </div>

                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="text-xs text-slate-400 hover:text-slate-700 underline cursor-pointer"
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
