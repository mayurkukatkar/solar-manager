"use client";
import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

export default function SuperAdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); // Also used as temporary password
  
  // Password Reset State
  const [requiresReset, setRequiresReset] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await axios.post(`\${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/login`, { email, password }, { withCredentials: true });
      
      if (res.data.requiresPasswordReset) {
        setRequiresReset(true);
      } else if (res.data.role === 'SUPER_ADMIN') {
        router.push('/super-admin/dashboard');
      } else {
        router.push('/tenant/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Authentication Failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForceReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await axios.post(`\${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/force-reset-password`, {
        email,
        temporaryPassword: password,
        newPassword
      }, { withCredentials: true });

      setSuccess('Password reset successfully. Please log in with your new password.');
      setRequiresReset(false);
      setPassword('');
      setNewPassword('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
        
        {requiresReset ? (
           <div className="text-center mb-10 animate-in fade-in slide-in-from-right-4">
             <div className="w-12 h-12 bg-amber-100 text-amber-600 flex items-center justify-center rounded-full mx-auto mb-4">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
               </svg>
             </div>
             <h1 className="text-2xl font-bold tracking-tight text-slate-900">Set New Password</h1>
             <p className="text-sm text-slate-500 mt-2 px-4">For security reasons, you must change your temporary password before proceeding.</p>
           </div>
        ) : (
          <div className="text-center mb-10">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Platform Control</h1>
            <p className="text-sm text-slate-500 mt-2">Enter your credentials to access your workspace</p>
          </div>
        )}

        <form onSubmit={requiresReset ? handleForceReset : handleLogin} className="space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100 text-center font-medium">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-emerald-50 text-emerald-700 p-3 rounded-lg text-sm border border-emerald-100 text-center font-medium">
              {success}
            </div>
          )}
          
          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-700">Email Address</label>
            <input 
              type="email" 
              value={email}
              disabled={requiresReset}
              onChange={e => setEmail(e.target.value)}
              placeholder="platform@whereready.com"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:bg-slate-50 disabled:text-slate-500"
              required
            />
          </div>
          
          {!requiresReset && (
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                required
              />
            </div>
          )}

          {requiresReset && (
             <div className="space-y-1 animate-in fade-in">
                <label className="text-sm font-semibold text-slate-700">New Password</label>
                <input 
                  type="password" 
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  required
                />
             </div>
          )}
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold shadow-md transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : (requiresReset ? 'Set Password & Login' : 'Sign In')}
          </button>
        </form>
      </div>
    </div>
  );
}
