"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { 
  Shield, UserCheck, Key, Lock, CheckCircle2, AlertTriangle, 
  Plus, Search, Filter, ShieldAlert, Sparkles, RefreshCw, X,
  User, Check, Eye, Edit3, Trash2, Smartphone, ShieldOff
} from "lucide-react";

interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: "TENANT_ADMIN" | "PROJECT_MANAGER" | "SITE_ENGINEER" | "SALES_EXEC" | "FINANCE_OFFICER";
  department: string;
  mfaEnabled: boolean;
  status: "ACTIVE" | "INVITED" | "SUSPENDED";
  lastActive: string;
}

const INITIAL_USERS: UserAccount[] = [
  {
    id: "USR-001",
    name: "Vikram Patil",
    email: "vikram.patil@solarcorp.in",
    role: "TENANT_ADMIN",
    department: "Executive Management",
    mfaEnabled: true,
    status: "ACTIVE",
    lastActive: "Active now"
  },
  {
    id: "USR-002",
    name: "Kavita Rao",
    email: "kavita.rao@solarcorp.in",
    role: "PROJECT_MANAGER",
    department: "Project Execution",
    mfaEnabled: true,
    status: "ACTIVE",
    lastActive: "15 mins ago"
  },
  {
    id: "USR-003",
    name: "Rahul Verma",
    email: "rahul.verma@solarcorp.in",
    role: "SITE_ENGINEER",
    department: "Field Engineering",
    mfaEnabled: false,
    status: "ACTIVE",
    lastActive: "1 hour ago"
  },
  {
    id: "USR-004",
    name: "Sneha Nair",
    email: "sneha.nair@solarcorp.in",
    role: "SALES_EXEC",
    department: "Sales & CRM",
    mfaEnabled: true,
    status: "ACTIVE",
    lastActive: "3 hours ago"
  },
  {
    id: "USR-005",
    name: "Mahesh Chawla",
    email: "mahesh.c@solarcorp.in",
    role: "FINANCE_OFFICER",
    department: "Finance & Accounts",
    mfaEnabled: true,
    status: "ACTIVE",
    lastActive: "Yesterday"
  }
];

const MODULE_PERMISSIONS = [
  { module: "CRM & Leads", admin: true, pm: true, engineer: false, sales: true, finance: false },
  { module: "Site Surveys", admin: true, pm: true, engineer: true, sales: true, finance: false },
  { module: "Quotations & Pricing", admin: true, pm: true, engineer: false, sales: true, finance: true },
  { module: "Projects & Tasks", admin: true, pm: true, engineer: true, sales: false, finance: false },
  { module: "Installation & QA", admin: true, pm: true, engineer: true, sales: false, finance: false },
  { module: "Inventory & Warehouses", admin: true, pm: true, engineer: true, sales: false, finance: false },
  { module: "Invoicing & Payments", admin: true, pm: false, engineer: false, sales: false, finance: true },
  { module: "Discom & Subsidy", admin: true, pm: true, engineer: true, sales: true, finance: true },
  { module: "AMC & Service Tickets", admin: true, pm: true, engineer: true, sales: false, finance: false },
  { module: "Tenant Settings & Staff", admin: true, pm: false, engineer: false, sales: false, finance: false },
];

export default function UsersPermissionsPage() {
  const [users, setUsers] = useState<UserAccount[]>(INITIAL_USERS);
  const [activeTab, setActiveTab] = useState<"USERS" | "MATRIX" | "POLICIES">("USERS");
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [toast, setToast] = useState("");

  // Security policy states
  const [enforceMfa, setEnforceMfa] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState("30");
  const [ipRestricted, setIpRestricted] = useState(false);

  const handleToggleMfa = (userId: string) => {
    setUsers(users.map(u => {
      if (u.id === userId) {
        const nextState = !u.mfaEnabled;
        setToast(`2FA for ${u.name} is now ${nextState ? "Enforced" : "Disabled"}.`);
        setTimeout(() => setToast(""), 3500);
        return { ...u, mfaEnabled: nextState };
      }
      return u;
    }));
  };

  const handleSaveRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setUsers(users.map(u => u.id === selectedUser.id ? selectedUser : u));
    setShowEditModal(false);
    setToast(`Permissions and role updated for ${selectedUser.name}!`);
    setTimeout(() => setToast(""), 3500);
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-7xl mx-auto pb-12">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-100 text-indigo-800">
              Security & RBAC Matrix
            </span>
            <span className="flex items-center gap-1 text-xs text-emerald-600 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Enterprise Role Governance
            </span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Users & Access Permissions</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage employee access, multi-factor authentication, granular module permissions, and security compliance.
          </p>
        </div>
      </div>

      {toast && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-600" />
            <span className="text-sm font-semibold">{toast}</span>
          </div>
          <button onClick={() => setToast("")} className="text-emerald-600 hover:text-emerald-800">
            <X size={16} />
          </button>
        </div>
      )}

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Authorized Users</p>
            <h3 className="text-2xl font-black text-slate-900">{users.length}</h3>
            <p className="text-[11px] font-semibold text-emerald-600 mt-1">All accounts verified</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <UserCheck size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">MFA Compliance</p>
            <h3 className="text-2xl font-black text-emerald-700">
              {Math.round((users.filter(u => u.mfaEnabled).length / users.length) * 100)}%
            </h3>
            <p className="text-[11px] font-semibold text-slate-500 mt-1">
              {users.filter(u => u.mfaEnabled).length} of {users.length} protected
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Shield size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Active Roles</p>
            <h3 className="text-2xl font-black text-slate-900">5 Roles</h3>
            <p className="text-[11px] font-semibold text-blue-600 mt-1">Granular privilege tiers</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Key size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Session Policy</p>
            <h3 className="text-2xl font-black text-slate-900">{sessionTimeout}m Idle</h3>
            <p className="text-[11px] font-semibold text-slate-500 mt-1">Automatic JWT rotation</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Lock size={22} />
          </div>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab("USERS")}
          className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 ${
            activeTab === "USERS"
              ? "bg-slate-900 text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80"
          }`}
        >
          <UserCheck size={16} /> User Directory & Accounts ({users.length})
        </button>

        <button
          onClick={() => setActiveTab("MATRIX")}
          className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 ${
            activeTab === "MATRIX"
              ? "bg-slate-900 text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80"
          }`}
        >
          <Shield size={16} /> Module Access Matrix
        </button>

        <button
          onClick={() => setActiveTab("POLICIES")}
          className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 ${
            activeTab === "POLICIES"
              ? "bg-slate-900 text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80"
          }`}
        >
          <Lock size={16} /> Security & Session Policies
        </button>
      </div>

      {/* TAB 1: USERS DIRECTORY */}
      {activeTab === "USERS" && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-4">
            <div className="relative w-72">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search staff user..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <span className="text-xs text-slate-500 font-medium">Click "Edit Role" to change assigned access privileges</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] font-extrabold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Employee Details</th>
                  <th className="px-6 py-4">Assigned Role</th>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4">2FA Security</th>
                  <th className="px-6 py-4">Status & Activity</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0">
                          {u.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 leading-tight">{u.name}</p>
                          <p className="text-xs text-slate-400 font-medium">{u.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                        u.role === "TENANT_ADMIN" ? "bg-purple-100 text-purple-700" :
                        u.role === "PROJECT_MANAGER" ? "bg-blue-100 text-blue-700" :
                        u.role === "SITE_ENGINEER" ? "bg-emerald-100 text-emerald-700" :
                        u.role === "FINANCE_OFFICER" ? "bg-amber-100 text-amber-700" :
                        "bg-slate-100 text-slate-700"
                      }`}>
                        {u.role.replace("_", " ")}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-xs font-semibold text-slate-600">
                      {u.department}
                    </td>

                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleMfa(u.id)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                          u.mfaEnabled 
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                            : "bg-red-50 text-red-700 border border-red-200"
                        }`}
                      >
                        {u.mfaEnabled ? <Shield size={12} /> : <ShieldOff size={12} />}
                        {u.mfaEnabled ? "2FA Enabled" : "2FA Off"}
                      </button>
                    </td>

                    <td className="px-6 py-4">
                      <p className="text-xs font-bold text-slate-800">{u.status}</p>
                      <p className="text-[11px] text-slate-400">{u.lastActive}</p>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedUser(u);
                          setShowEditModal(true);
                        }}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl transition-colors inline-flex items-center gap-1"
                      >
                        <Edit3 size={13} /> Edit Role
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: ACCESS MATRIX */}
      {activeTab === "MATRIX" && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden p-6 space-y-4">
          <div>
            <h3 className="font-bold text-base text-slate-900">Module Privilege Matrix</h3>
            <p className="text-xs text-slate-500 mt-0.5">Summary of operational rights granted to each role tier across solar modules.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-600 uppercase font-extrabold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">ERP Module</th>
                  <th className="px-4 py-3 text-center">Tenant Admin</th>
                  <th className="px-4 py-3 text-center">Project Manager</th>
                  <th className="px-4 py-3 text-center">Site Engineer</th>
                  <th className="px-4 py-3 text-center">Sales Executive</th>
                  <th className="px-4 py-3 text-center">Finance Officer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {MODULE_PERMISSIONS.map((mp, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-bold text-slate-800">{mp.module}</td>
                    
                    <td className="px-4 py-3 text-center">
                      <span className="inline-block p-1 bg-emerald-100 text-emerald-700 rounded-lg">
                        <Check size={14} />
                      </span>
                    </td>

                    <td className="px-4 py-3 text-center">
                      {mp.pm ? (
                        <span className="inline-block p-1 bg-emerald-100 text-emerald-700 rounded-lg"><Check size={14} /></span>
                      ) : (
                        <span className="inline-block p-1 bg-slate-100 text-slate-300 rounded-lg"><X size={14} /></span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-center">
                      {mp.engineer ? (
                        <span className="inline-block p-1 bg-emerald-100 text-emerald-700 rounded-lg"><Check size={14} /></span>
                      ) : (
                        <span className="inline-block p-1 bg-slate-100 text-slate-300 rounded-lg"><X size={14} /></span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-center">
                      {mp.sales ? (
                        <span className="inline-block p-1 bg-emerald-100 text-emerald-700 rounded-lg"><Check size={14} /></span>
                      ) : (
                        <span className="inline-block p-1 bg-slate-100 text-slate-300 rounded-lg"><X size={14} /></span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-center">
                      {mp.finance ? (
                        <span className="inline-block p-1 bg-emerald-100 text-emerald-700 rounded-lg"><Check size={14} /></span>
                      ) : (
                        <span className="inline-block p-1 bg-slate-100 text-slate-300 rounded-lg"><X size={14} /></span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: SECURITY POLICIES */}
      {activeTab === "POLICIES" && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-6 max-w-2xl">
          <div>
            <h3 className="font-bold text-base text-slate-900">Tenant Access & Security Policies</h3>
            <p className="text-xs text-slate-500 mt-0.5">Enforce organizational cybersecurity controls for all staff members.</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
              <div>
                <p className="font-bold text-xs text-slate-900">Enforce Mandatory Two-Factor Authentication (2FA)</p>
                <p className="text-[11px] text-slate-500">Require Google Authenticator or SMS OTP on every login</p>
              </div>
              <input
                type="checkbox"
                checked={enforceMfa}
                onChange={(e) => {
                  setEnforceMfa(e.target.checked);
                  setToast(`Mandatory 2FA is now ${e.target.checked ? "Enforced" : "Optional"}!`);
                  setTimeout(() => setToast(""), 3500);
                }}
                className="w-5 h-5 accent-indigo-600 rounded"
              />
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-bold text-xs text-slate-900">Session Inactivity Timeout</p>
                  <p className="text-[11px] text-slate-500">Automatically lock screen after period of inactivity</p>
                </div>
                <select
                  value={sessionTimeout}
                  onChange={(e) => {
                    setSessionTimeout(e.target.value);
                    setToast(`Session timeout updated to ${e.target.value} minutes!`);
                    setTimeout(() => setToast(""), 3500);
                  }}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                >
                  <option value="15">15 Minutes</option>
                  <option value="30">30 Minutes</option>
                  <option value="60">60 Minutes</option>
                  <option value="120">2 Hours</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
              <div>
                <p className="font-bold text-xs text-slate-900">Corporate Office IP Range Allowlisting</p>
                <p className="text-[11px] text-slate-500">Restricts finance and admin logins to company VPN / Static IP</p>
              </div>
              <input
                type="checkbox"
                checked={ipRestricted}
                onChange={(e) => {
                  setIpRestricted(e.target.checked);
                  setToast(`IP Allowlisting is now ${e.target.checked ? "Active" : "Disabled"}!`);
                  setTimeout(() => setToast(""), 3500);
                }}
                className="w-5 h-5 accent-indigo-600 rounded"
              />
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-xl font-black text-slate-900">Modify Role Privileges</h3>
                <p className="text-xs text-slate-500 mt-0.5">{selectedUser.name} ({selectedUser.email})</p>
              </div>
              <button 
                onClick={() => setShowEditModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveRole} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-extrabold uppercase text-slate-500 tracking-wider mb-1 block">
                  Assigned Security Role *
                </label>
                <select
                  value={selectedUser.role}
                  onChange={(e) => setSelectedUser({ ...selectedUser, role: e.target.value as any })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:bg-white"
                >
                  <option value="TENANT_ADMIN">Tenant Admin (Full System Access)</option>
                  <option value="PROJECT_MANAGER">Project Manager (Execution & BOM)</option>
                  <option value="SITE_ENGINEER">Site Engineer (Field QA & Surveys)</option>
                  <option value="SALES_EXEC">Sales Executive (Leads & Quotations)</option>
                  <option value="FINANCE_OFFICER">Finance Officer (Billing & Subsidy)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-extrabold uppercase text-slate-500 tracking-wider mb-1 block">
                  Department
                </label>
                <input
                  type="text"
                  value={selectedUser.department}
                  onChange={(e) => setSelectedUser({ ...selectedUser, department: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
                >
                  Save Access Rights
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
