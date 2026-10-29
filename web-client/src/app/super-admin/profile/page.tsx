"use client";

import React, { useState } from 'react';
import { 
  User, Mail, Shield, Key, Lock, Smartphone, CheckCircle2, 
  Clock, Laptop, Globe, AlertCircle 
} from 'lucide-react';
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Badge } from '@/components/ui';
import { useToast } from '@/context/ToastContext';

export default function SuperAdminProfilePage() {
  const { showToast } = useToast();

  const [profileData, setProfileData] = useState({
    name: 'WhereReady Platform Super-Admin',
    email: 'platform@whereready.com',
    role: 'SUPER_ADMIN',
    department: 'Platform Architecture & Security',
  });

  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setTimeout(() => {
      setSavingProfile(false);
      showToast({
        type: 'success',
        title: 'Profile Updated',
        message: 'Super-admin personal details updated successfully.',
      });
    }, 600);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwords.currentPassword) {
      showToast({ type: 'warning', message: 'Current password is required.' });
      return;
    }
    if (passwords.newPassword.length < 8) {
      showToast({ type: 'error', message: 'New password must be at least 8 characters long.' });
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      showToast({ type: 'error', message: 'New passwords do not match.' });
      return;
    }

    setChangingPassword(true);
    setTimeout(() => {
      setChangingPassword(false);
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      showToast({
        type: 'success',
        title: 'Security Credentials Updated',
        message: 'Master authentication credentials updated securely.',
      });
    }, 800);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Super-Admin Profile</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Manage master platform administrator credentials, 2FA authorization, and active management sessions.
        </p>
      </div>

      {/* Account Info Card */}
      <form onSubmit={handleSaveProfile}>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <User size={18} />
              </div>
              <div>
                <CardTitle>Master Administrator Identity</CardTitle>
                <CardDescription>System root administrator contact and notification profile</CardDescription>
              </div>
            </div>
            <Badge variant="primary" size="md">
              <Shield size={12} className="mr-1" /> Root Platform Admin
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Administrator Name *"
                required
                value={profileData.name}
                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
              />
              <Input
                label="Platform Email Address *"
                required
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Assigned Role"
                disabled
                value={profileData.role}
                helperText="Fixed system authorization level."
              />
              <Input
                label="Department / Unit"
                value={profileData.department}
                onChange={(e) => setProfileData({ ...profileData, department: e.target.value })}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" variant="primary" size="md" isLoading={savingProfile}>
              Save Profile Changes
            </Button>
          </CardFooter>
        </Card>
      </form>

      {/* Password & Security Card */}
      <form onSubmit={handleChangePassword}>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Lock size={18} />
              </div>
              <div>
                <CardTitle>Authentication Credentials</CardTitle>
                <CardDescription>Rotate master credentials and enforce strong cryptographic passwords</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Current Password *"
                type="password"
                required
                placeholder="••••••••••••"
                value={passwords.currentPassword}
                onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
              />
              <Input
                label="New Password *"
                type="password"
                required
                placeholder="••••••••••••"
                value={passwords.newPassword}
                onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                helperText="Minimum 8 characters with numbers and symbols."
              />
              <Input
                label="Confirm New Password *"
                type="password"
                required
                placeholder="••••••••••••"
                value={passwords.confirmPassword}
                onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" variant="outline" size="md" isLoading={changingPassword} leftIcon={<Key size={16} />}>
              Update Master Password
            </Button>
          </CardFooter>
        </Card>
      </form>

      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Laptop size={18} />
            </div>
            <div>
              <CardTitle>Active Management Sessions</CardTitle>
              <CardDescription>Cryptographically signed web sessions logged into WhereReady platform</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                <Globe size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-xs font-bold text-slate-900">Current Web Session (Windows / Chrome)</p>
                  <Badge variant="success" size="sm">Active Now</Badge>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">IP: 127.0.0.1 • Localhost Platform Console</p>
              </div>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">Verified Session</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
