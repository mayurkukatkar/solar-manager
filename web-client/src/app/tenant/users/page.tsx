"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { 
  Shield, UserCheck, Key, Lock, CheckCircle2, AlertTriangle, 
  Plus, Search, Filter, ShieldAlert, Sparkles, RefreshCw, X,
  User, Check, Eye, Edit3, Trash2, Smartphone, ShieldOff, Copy
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: "TENANT_ADMIN" | "TENANT_SUB_ADMIN";
  department: string;
  permissions?: any;
  mfaEnabled: boolean;
  status: "ACTIVE" | "INVITED" | "SUSPENDED";
  lastActive: string;
}

const AVAILABLE_MODULES = [
  { key: "leads", label: "Leads Management" },
  { key: "crm", label: "CRM Pipeline" },
  { key: "surveys", label: "Site Surveys" },
  { key: "quotations", label: "Quotations & Proposals" },
  { key: "projects", label: "Projects & DISCOM Docs" },
  { key: "inventory", label: "Inventory & Dispatch" },
  { key: "finance", label: "Finance & Invoicing" },
  { key: "service", label: "Service Tickets & AMC" }
];

export default function UsersPermissionsPage() {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

  // Modals & Temp Password
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [tempPasswordModal, setTempPasswordModal] = useState<{ user: string; pass: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "TENANT_SUB_ADMIN",
    department: "Field Engineering",
    permissions: {
      modules: ["leads", "crm", "projects", "surveys", "quotations"]
    }
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (search) params.search = search;

      const res = await axios.get(`${API}/api/tenant/users`, { params, withCredentials: true });
      setUsers(res.data.users || []);
    } catch (err) {
      console.error("Error fetching tenant users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleModulePerm = (modKey: string) => {
    const curMods: string[] = formData.permissions.modules || [];
    const nextMods = curMods.includes(modKey)
      ? curMods.filter(m => m !== modKey)
      : [...curMods, modKey];

    setFormData(prev => ({
      ...prev,
      permissions: { ...prev.permissions, modules: nextMods }
    }));
  };

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      alert("Please provide full name and email address");
      return;
    }

    try {
      setSubmitting(true);
      const res = await axios.post(`${API}/api/tenant/users/invite`, formData, { withCredentials: true });
      setShowInviteModal(false);
      
      if (res.data?.tempPassword) {
        setTempPasswordModal({
          user: formData.email,
          pass: res.data.tempPassword
        });
      }

      setFormData({
        name: "",
        email: "",
        role: "TENANT_SUB_ADMIN",
        department: "Field Engineering",
        permissions: {
          modules: ["leads", "crm", "projects", "surveys", "quotations"]
        }
      });
      fetchUsers();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to invite user");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (userId: string, email: string) => {
    if (!confirm(`Reset password for ${email}? A new temporary password will be generated.`)) return;

    try {
      const res = await axios.post(`${API}/api/tenant/users/${userId}/reset-password`, {}, { withCredentials: true });
      if (res.data?.tempPassword) {
        setTempPasswordModal({
          user: email,
          pass: res.data.tempPassword
        });
      }
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to reset password");
    }
  };

  const handleDeleteUser = async (userId: string, name: string) => {
    if (!confirm(`Remove ${name} from your team? They will lose access immediately.`)) return;

    try {
      await axios.delete(`${API}/api/tenant/users/${userId}`, { withCredentials: true });
      fetchUsers();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to remove user");
    }
  };

  const copyPassword = () => {
    if (!tempPasswordModal?.pass) return;
    navigator.clipboard?.writeText(tempPasswordModal.pass);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredUsers = users.filter(u => {
    if (roleFilter !== "ALL" && u.role !== roleFilter) return false;
    if (search) {
      return u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    }
    return true;
  });

  const adminCount = users.filter(u => u.role === "TENANT_ADMIN").length;
  const subAdminCount = users.filter(u => u.role !== "TENANT_ADMIN").length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Users & RBAC Permissions</h1>
          <p className="text-sm text-slate-500 mt-1">Control engineer, sales rep, and manager access privileges.</p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={fetchUsers} 
            className="p-2.5 text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            title="Refresh"
          >
            <RefreshCw size={16} />
          </button>
          <button 
            onClick={() => setShowInviteModal(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <Plus size={18} /> Invite Team Member
          </button>
        </div>
      </div>

      {/* METRICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Team</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <UserCheck size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">{users.length}</p>
          <p className="text-xs text-slate-400 mt-1">Active operators & staff</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tenant Admins</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Shield size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-600">{adminCount}</p>
          <p className="text-xs text-slate-400 mt-1">Full system privilege</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sub-Admins / Engineers</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Lock size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold text-purple-600">{subAdminCount}</p>
          <p className="text-xs text-slate-400 mt-1">Granular module permissions</p>
        </div>
      </div>

      {/* FILTER TABS & SEARCH */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
            {["ALL", "TENANT_ADMIN", "TENANT_SUB_ADMIN"].map((rf) => (
              <button
                key={rf}
                onClick={() => setRoleFilter(rf)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  roleFilter === rf 
                    ? "bg-emerald-600 text-white shadow-sm" 
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                {rf === "TENANT_ADMIN" ? "Admins" : rf === "TENANT_SUB_ADMIN" ? "Sub-Admins" : "All Users"}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-80">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by name or email..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-emerald-500 transition-colors" 
            />
          </div>
        </div>

        {/* USERS LIST */}
        <div className="divide-y divide-slate-100">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-12 text-center text-slate-500 font-medium">
              No users found.
            </div>
          ) : (
            filteredUsers.map((user) => (
              <div key={user.id} className="p-5 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-bold text-slate-900 text-base">{user.name}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                      user.role === 'TENANT_ADMIN' 
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                        : 'bg-purple-50 text-purple-800 border-purple-200'
                    }`}>
                      {user.role === 'TENANT_ADMIN' ? 'TENANT ADMIN' : 'SUB-ADMIN'}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                      {user.department}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 font-mono">{user.email}</p>

                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">Access:</span>
                    {user.role === 'TENANT_ADMIN' ? (
                      <span className="text-xs text-emerald-700 font-semibold">Full Global Access to All Modules</span>
                    ) : user.permissions?.modules?.length ? (
                      user.permissions.modules.map((m: string) => (
                        <span key={m} className="text-[11px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                          {m}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400 italic">No custom modules assigned</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    onClick={() => handleResetPassword(user.id, user.email)}
                    className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl flex items-center gap-1.5 shadow-sm transition-colors"
                  >
                    <Key size={13} className="text-amber-500" /> Reset Password
                  </button>

                  <button
                    onClick={() => handleDeleteUser(user.id, user.name)}
                    className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors"
                    title="Remove user"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* TEMPORARY PASSWORD MODAL ALERT */}
      {tempPasswordModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <Key size={24} />
            </div>

            <h3 className="text-lg font-bold text-slate-900">Credentials Generated</h3>
            <p className="text-xs text-slate-500">
              Share these temporary credentials with <span className="font-semibold text-slate-700">{tempPasswordModal.user}</span>. They will be prompted to choose a new password upon first sign-in.
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
              <span className="font-mono text-base font-bold text-slate-900 tracking-wider">
                {tempPasswordModal.pass}
              </span>
              <button
                onClick={copyPassword}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-colors"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>

            <button
              onClick={() => setTempPasswordModal(null)}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-sm transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* INVITE TEAM MEMBER MODAL */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Invite Team Member</h2>
                <p className="text-xs text-slate-500 mt-0.5">Configure role and granular module permissions</p>
              </div>
              <button onClick={() => setShowInviteModal(false)} className="text-slate-400 hover:text-slate-700 p-2">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleInviteUser} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Full Name *</label>
                  <input 
                    required 
                    type="text" 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                    placeholder="e.g. Vikram Patil" 
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium text-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Email Address *</label>
                  <input 
                    required 
                    type="email" 
                    value={formData.email} 
                    onChange={e => setFormData({...formData, email: e.target.value})} 
                    placeholder="vikram@solarcompany.in" 
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Role</label>
                  <select 
                    value={formData.role} 
                    onChange={e => setFormData({...formData, role: e.target.value as any})} 
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all bg-white font-medium text-slate-800"
                  >
                    <option value="TENANT_SUB_ADMIN">Sub-Admin (Restricted)</option>
                    <option value="TENANT_ADMIN">Tenant Admin (Full Access)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Department</label>
                  <select 
                    value={formData.department} 
                    onChange={e => setFormData({...formData, department: e.target.value})} 
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all bg-white font-medium text-slate-800"
                  >
                    <option value="Field Engineering">Field Engineering</option>
                    <option value="Sales & CRM">Sales & CRM</option>
                    <option value="Project Execution">Project Execution</option>
                    <option value="Finance & Accounts">Finance & Accounts</option>
                    <option value="Executive Management">Executive Management</option>
                  </select>
                </div>
              </div>

              {formData.role !== "TENANT_ADMIN" && (
                <div className="space-y-2 pt-2">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                    Module Access Permissions
                  </label>
                  <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    {AVAILABLE_MODULES.map(m => {
                      const checked = formData.permissions.modules.includes(m.key);
                      return (
                        <label 
                          key={m.key} 
                          onClick={() => handleToggleModulePerm(m.key)}
                          className={`flex items-center gap-2 p-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors border ${
                            checked ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-white text-slate-600 border-slate-200'
                          }`}
                        >
                          <input 
                            type="checkbox" 
                            checked={checked} 
                            onChange={() => {}} 
                            className="rounded text-emerald-600 focus:ring-emerald-500" 
                          />
                          <span>{m.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowInviteModal(false)} 
                  className="flex-1 py-3 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <UserCheck size={16} />
                  {submitting ? "Inviting..." : "Send Invitation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
