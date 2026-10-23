"use client";

import React, { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  Phone,
  Building2,
  Sparkles,
  Loader2,
  KeyRound,
  AlertCircle
} from "lucide-react";
import GuideCharacter from "@/components/marketing/GuideCharacter";

export default function LoginPage() {
  const router = useRouter();
  const [roleTab, setRoleTab] = useState<"tenant" | "superadmin">("tenant");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // Password Reset State
  const [requiresReset, setRequiresReset] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleRoleTabChange = (role: "tenant" | "superadmin") => {
    setRoleTab(role);
    setError("");
    if (role === "superadmin" && !email) {
      setEmail("platform@whereready.com");
    } else if (role === "tenant" && email === "platform@whereready.com") {
      setEmail("");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/auth/login`,
        { email: email.trim(), password },
        { withCredentials: true }
      );
      
      if (res.data.requiresPasswordReset) {
        setRequiresReset(true);
      } else {
        if (res.data.token) {
          localStorage.setItem("token", res.data.token);
          localStorage.setItem("auth_token", res.data.token);
        }
        if (res.data.role === "SUPER_ADMIN") {
          router.push("/super-admin/dashboard");
        } else {
          router.push("/tenant/dashboard");
        }
      }
    } catch (err: any) {
      const fullUrl = err.config?.url || "server";
      setError(err.response?.data?.error || `Unable to authenticate (${err.message}). Check credentials.`);
    } finally {
      setLoading(false);
    }
  };

  const handleForceReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters long.");
      setLoading(false);
      return;
    }

    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/auth/force-reset-password`,
        {
          email: email.trim(),
          temporaryPassword: password,
          newPassword
        },
        { withCredentials: true }
      );

      setSuccess("Password reset successfully. Please log in with your permanent password.");
      setRequiresReset(false);
      setPassword("");
      setNewPassword("");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to reset password. Please check temporary credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-['Plus_Jakarta_Sans',sans-serif] relative overflow-hidden flex flex-col justify-between">
      
      {/* Subtle Engineering Square Grid Background */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-60"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(15, 23, 42, 0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(15, 23, 42, 0.05) 1px, transparent 1px)
          `,
          backgroundSize: "32px 32px"
        }}
      />

      {/* TOP BRAND NAV BAR */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between">
        <Link 
          href="/" 
          className="flex items-center gap-3 group focus:outline-none"
        >
          <div className="relative w-8 h-8 rounded-xl overflow-hidden border border-slate-200 bg-white shadow-2xs group-hover:scale-105 transition-transform">
            <Image
              src="/images/whereready_logo.png"
              alt="WhereReady Logo"
              width={32}
              height={32}
              className="object-contain"
              priority
            />
          </div>
          <div>
            <span className="text-sm font-extrabold text-slate-900 tracking-tight block leading-tight">
              WhereReady
            </span>
            <span className="text-[10px] font-bold text-blue-600 tracking-wider uppercase block leading-none">
              SOLAR OS
            </span>
          </div>
        </Link>

        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 px-3.5 py-1.5 rounded-full transition-colors"
        >
          <ArrowLeft size={13} />
          <span>Back to Website</span>
        </Link>
      </header>

      {/* MAIN TWO-COLUMN / CENTERED CANVAS */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* LEFT SIDE: Brand Narrative & Sol Mascot (Visible on lg+) */}
          <div className="hidden lg:flex lg:col-span-6 flex-col justify-between space-y-8 pr-4">
            
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-[11px] font-bold text-blue-700 uppercase tracking-wider">
                <Sparkles size={13} className="text-blue-600" />
                <span>Single Operating System for Solar</span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-[1.2]">
                Your solar business. <br />
                <span className="text-blue-600">Completely in sync.</span>
              </h1>

              <p className="text-sm text-slate-600 leading-relaxed font-normal max-w-md">
                Sign in to manage WhatsApp enquiries, 60-second PM Surya Ghar proposals, warehouse stock, and DISCOM installations.
              </p>
            </div>

            {/* Sol Character Greeting */}
            <div className="flex items-center gap-5 p-4 bg-slate-50/80 backdrop-blur-xs border border-slate-200/80 rounded-2xl max-w-md shadow-2xs">
              <GuideCharacter
                pose="wave"
                size={74}
                speechText="Welcome back!"
                className="shrink-0"
              />
              <div className="space-y-1 text-xs text-slate-600">
                <p className="font-bold text-slate-900">Ready to lead your day?</p>
                <p className="text-slate-500 leading-snug">
                  Zero spreadsheets. Every quotation, site survey, and DISCOM form in one unified workspace.
                </p>
              </div>
            </div>

            {/* Trust Points */}
            <div className="space-y-2.5 pt-2 max-w-md">
              <div className="flex items-center gap-2.5 text-xs text-slate-600">
                <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                <span>Multi-tenant data isolation &amp; DPDP Act 2023 compliant</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-600">
                <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                <span>End-to-end 256-bit encrypted authentication</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-600">
                <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                <span>Automated role-based routing (Admin, EPC Staff, Super Admin)</span>
              </div>
            </div>

          </div>

          {/* RIGHT SIDE: Interactive Login Card */}
          <div className="lg:col-span-6 w-full max-w-md mx-auto">
            <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-slate-200 shadow-xl shadow-slate-100 p-6 sm:p-8 relative">
              
              {requiresReset ? (
                /* FORCE RESET VIEW */
                <div className="space-y-6">
                  <div className="text-center space-y-2">
                    <div className="w-12 h-12 bg-amber-50 text-amber-600 border border-amber-200 rounded-2xl flex items-center justify-center mx-auto shadow-2xs">
                      <KeyRound size={22} />
                    </div>
                    <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                      Set Permanent Password
                    </h2>
                    <p className="text-xs text-slate-500 px-4 leading-relaxed">
                      For your company's security, please replace the temporary password assigned to your account.
                    </p>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                      <AlertCircle size={15} className="shrink-0 text-red-500" />
                      <span>{error}</span>
                    </div>
                  )}

                  <form onSubmit={handleForceReset} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Account Email
                      </label>
                      <div className="relative">
                        <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="email"
                          disabled
                          value={email}
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-500 font-medium cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        New Secure Password
                      </label>
                      <div className="relative">
                        <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type={showNewPassword ? "text" : "password"}
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Minimum 8 characters"
                          className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-medium"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                        >
                          {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Use a combination of letters, numbers, and symbols.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          <span>Updating Password...</span>
                        </>
                      ) : (
                        <>
                          <span>Save &amp; Continue to Workspace</span>
                          <ArrowRight size={15} />
                        </>
                      )}
                    </button>
                  </form>
                </div>
              ) : (
                /* STANDARD LOGIN VIEW */
                <div className="space-y-6">
                  
                  {/* Heading & Role Selector */}
                  <div className="space-y-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 block mb-0.5">
                        Secure Authentication
                      </span>
                      <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                        Sign In
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Select your workspace type to access your solar operations dashboard.
                      </p>
                    </div>

                    {/* Role Tabs */}
                    <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
                      <button
                        type="button"
                        onClick={() => handleRoleTabChange("tenant")}
                        className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          roleTab === "tenant"
                            ? "bg-white text-slate-900 shadow-2xs font-bold"
                            : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        <Building2 size={14} className={roleTab === "tenant" ? "text-blue-600" : ""} />
                        <span>EPC Workspace</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRoleTabChange("superadmin")}
                        className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          roleTab === "superadmin"
                            ? "bg-white text-slate-900 shadow-2xs font-bold"
                            : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        <ShieldCheck size={14} className={roleTab === "superadmin" ? "text-blue-600" : ""} />
                        <span>Platform Admin</span>
                      </button>
                    </div>
                  </div>

                  {/* Feedback Messages */}
                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2 animate-in fade-in">
                      <AlertCircle size={15} className="shrink-0 text-red-500" />
                      <span>{error}</span>
                    </div>
                  )}

                  {success && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 animate-in fade-in">
                      <CheckCircle2 size={15} className="shrink-0 text-emerald-600" />
                      <span>{success}</span>
                    </div>
                  )}

                  {/* Login Form */}
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        {roleTab === "tenant" ? "Work Email Address" : "Platform Admin Email"}
                      </label>
                      <div className="relative">
                        <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder={roleTab === "tenant" ? "admin@suryashakti.com" : "platform@whereready.com"}
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-slate-700">
                          Password
                        </label>
                        <a
                          href="https://wa.me/919270201883?text=Hi%20WhereReady%2C%20I%20need%20help%20logging%20into%20my%20Solar%20OS%20account."
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] font-semibold text-blue-600 hover:text-blue-700"
                        >
                          Forgot password?
                        </a>
                      </div>
                      <div className="relative">
                        <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type={showPassword ? "text" : "password"}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-medium"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                          aria-label="Toggle password visibility"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50 mt-2"
                    >
                      {loading ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          <span>Signing In...</span>
                        </>
                      ) : (
                        <>
                          <span>Sign In to Workspace</span>
                          <ArrowRight size={15} />
                        </>
                      )}
                    </button>
                  </form>

                  {/* Direct WhatsApp Assistance */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Need instant assistance?</span>
                    <a
                      href="https://wa.me/919270201883?text=Hi%20WhereReady%20Support%2C%20I%20have%20a%20question%20about%20logging%20in."
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                    >
                      <Phone size={11} />
                      <span>WhatsApp Support</span>
                    </a>
                  </div>

                </div>
              )}

              {/* Bottom Security Badge */}
              <div className="mt-5 flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-medium">
                <ShieldCheck size={13} className="text-emerald-600 shrink-0" />
                <span>Protected by ISO 27001 &amp; DPDP Act 2023 Security Protocols</span>
              </div>

            </div>
          </div>

        </div>
      </main>

      {/* FOOTER */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-center text-xs text-slate-400 border-t border-slate-100">
        <p>© {new Date().getFullYear()} WhereReady Solar OS. All rights reserved. 1/2, Belekar Layout, Hudkeshwar Road, Nagpur - 440034.</p>
      </footer>

    </div>
  );
}
