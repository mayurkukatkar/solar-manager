"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { ShieldAlert, Lock, Mail, ArrowRight, RefreshCw, LogOut } from 'lucide-react';

export default function SuspendedPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const checkStatusAgain = async () => {
    setChecking(true);
    setMessage(null);
    try {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/me`,
        { withCredentials: true }
      );
      if (res.data?.user?.tenant?.status === 'ACTIVE' || res.data?.user?.role === 'SUPER_ADMIN') {
        router.push('/tenant/dashboard');
        return;
      }
      setMessage('Account is still marked as SUSPENDED by platform admin.');
    } catch (err: any) {
      if (err.response?.status === 401) {
        router.push('/login');
      } else {
        setMessage(err.response?.data?.error || 'Account remains suspended.');
      }
    } finally {
      setChecking(false);
    }
  };

  const handleLogout = async () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('auth_token');
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/logout`,
        {},
        { withCredentials: true }
      );
    } catch {}
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-rose-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-rose-100 overflow-hidden text-center p-8 relative">
        {/* Glow accent */}
        <div className="w-40 h-40 bg-rose-500/10 rounded-full blur-3xl absolute -top-10 -right-10 pointer-events-none" />

        {/* Lock Icon */}
        <div className="w-20 h-20 bg-rose-50 border-2 border-rose-200 rounded-2xl flex items-center justify-center mx-auto mb-6 text-rose-600 shadow-sm">
          <ShieldAlert size={42} strokeWidth={2.2} />
        </div>

        <span className="inline-block px-3 py-1 bg-rose-100 border border-rose-200 text-rose-700 text-xs font-black uppercase tracking-widest rounded-full mb-3">
          ACCESS FROZEN
        </span>

        <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
          Organization Suspended
        </h1>

        <p className="text-slate-600 text-sm leading-relaxed mb-6">
          Your solar organization account has been suspended by the Super Administrator. Operational access to CRM leads, installations, projects, and billing is temporarily locked.
        </p>

        {message && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold p-3 rounded-xl mb-5">
            {message}
          </div>
        )}

        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-6 text-left space-y-2.5">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Next Steps:</div>
          <div className="flex items-start gap-2.5 text-xs text-slate-700 font-medium">
            <span className="text-rose-500 font-bold">•</span>
            <span>Contact your platform Super Admin or support team to verify account standing.</span>
          </div>
          <div className="flex items-start gap-2.5 text-xs text-slate-700 font-medium">
            <span className="text-rose-500 font-bold">•</span>
            <span>Once reinstated by the admin, click Check Status below to restore your session.</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={checkStatusAgain}
            disabled={checking}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
          >
            <RefreshCw size={16} className={checking ? 'animate-spin' : ''} />
            {checking ? 'Checking Status...' : 'Check Status Again'}
          </button>

          <a
            href="mailto:support@solarmanager.com?subject=Account%20Reactivation%20Request"
            className="w-full border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
          >
            <Mail size={16} className="text-slate-400" />
            Contact Platform Support
          </a>

          <button
            onClick={handleLogout}
            className="w-full text-slate-400 hover:text-slate-700 text-xs font-bold py-2 transition-colors flex items-center justify-center gap-1.5"
          >
            <LogOut size={13} /> Return to Login
          </button>
        </div>
      </div>
    </div>
  );
}
