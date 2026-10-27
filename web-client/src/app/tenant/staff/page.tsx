"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { UserPlus, Plus, X, Shield, Key, Trash2, RotateCcw, Copy } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const ALL_PERMISSIONS = [
  { module: "leads", actions: ["view", "create", "edit", "delete", "assign"] },
  { module: "crm", actions: ["view", "create", "edit"] },
  { module: "surveys", actions: ["view", "create", "edit", "approve"] },
  { module: "quotations", actions: ["view", "create", "send", "approve"] },
  { module: "projects", actions: ["view", "edit", "assign_tasks"] },
  { module: "inventory", actions: ["view", "dispatch", "receive"] },
  { module: "finance", actions: ["view", "create_invoice", "record_payment"] },
  { module: "tickets", actions: ["view", "reply", "resolve"] },
];

export default function StaffPage() {
  const [staff, setStaff] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showPermsModal, setShowPermsModal] = useState<any>(null);
  const [tempPassword, setTempPassword] = useState("");
  const [form, setForm] = useState<any>({ name: "", email: "", permissions: [] });
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);

  const fetchStaff = async () => {
    try {
      const res = await axios.get(`${API}/api/tenant/staff`, { withCredentials: true });
      setStaff(res.data.staff || []);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchStaff(); }, []);

  const handleCreate = async () => {
    try {
      const res = await axios.post(`${API}/api/tenant/staff`, { ...form, permissions: form.permissions }, { withCredentials: true });
      setTempPassword(res.data.tempPassword || "");
      setForm({ name: "", email: "", permissions: [] });
      fetchStaff();
    } catch (err: any) { alert(err.response?.data?.error || "Failed"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this staff member?")) return;
    try {
      await axios.delete(`${API}/api/tenant/staff/${id}`, { withCredentials: true });
      fetchStaff();
    } catch (err: any) { alert(err.response?.data?.error || "Failed"); }
  };

  const handleResetPassword = async (id: string) => {
    try {
      const res = await axios.post(`${API}/api/tenant/staff/${id}/reset-password`, {}, { withCredentials: true });
      alert(`New temporary password: ${res.data.tempPassword}`);
    } catch (err: any) { alert(err.response?.data?.error || "Failed"); }
  };

  const openPermsModal = (member: any) => {
    setShowPermsModal(member);
    setSelectedPerms(Array.isArray(member.permissions) ? [...member.permissions] : []);
  };

  const togglePerm = (perm: string) => {
    setSelectedPerms(prev => prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]);
  };

  const savePerms = async () => {
    try {
      await axios.patch(`${API}/api/tenant/staff/${showPermsModal.id}/permissions`, { permissions: selectedPerms }, { withCredentials: true });
      setShowPermsModal(null);
      fetchStaff();
    } catch (err: any) { alert(err.response?.data?.error || "Failed"); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Staff Management</h1>
          <p className="text-sm text-slate-500 mt-1">Manage your team members and their permissions</p>
        </div>
        <button onClick={() => { setShowModal(true); setTempPassword(""); }} className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors shadow-sm">
          <Plus size={16} /> Add Staff
        </button>
      </div>

      <div className="grid gap-4">
        {staff.map(m => (
          <div key={m.id} className="bg-white rounded-xl border border-slate-200 p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold text-sm">
                {m.name?.charAt(0)?.toUpperCase() || "?"}
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">{m.name}</h3>
                <p className="text-sm text-slate-500">{m.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${m.role === "TENANT_ADMIN" ? "bg-purple-50 text-purple-700" : "bg-blue-50 text-blue-700"}`}>
                {m.role === "TENANT_ADMIN" ? "Admin" : "Sub-Admin"}
              </span>
              {m.mustChangePassword && <span className="px-2 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700">Pending Setup</span>}
              <span className="text-xs text-slate-400">{Array.isArray(m.permissions) ? m.permissions.length : 0} permissions</span>
              {m.role === "TENANT_SUB_ADMIN" && (
                <>
                  <button onClick={() => openPermsModal(m)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-emerald-600 transition-colors" title="Manage Permissions"><Shield size={16} /></button>
                  <button onClick={() => handleResetPassword(m.id)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition-colors" title="Reset Password"><RotateCcw size={16} /></button>
                  <button onClick={() => handleDelete(m.id)} className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors" title="Remove"><Trash2 size={16} /></button>
                </>
              )}
            </div>
          </div>
        ))}
        {staff.length === 0 && <div className="text-center py-16 text-slate-400 bg-white rounded-xl border border-slate-200">No staff members yet</div>}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-800">Add Staff Member</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            {tempPassword ? (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto"><UserPlus size={28} className="text-emerald-600" /></div>
                <h3 className="text-lg font-bold text-slate-800">Staff Member Created!</h3>
                <p className="text-sm text-slate-500">Share these temporary credentials securely:</p>
                <div className="bg-slate-50 rounded-xl p-4 text-left space-y-2">
                  <p className="text-sm"><span className="font-semibold text-slate-600">Email:</span> <span className="text-slate-800">{form.email}</span></p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm"><span className="font-semibold text-slate-600">Password:</span> <code className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded">{tempPassword}</code></p>
                    <button onClick={() => navigator.clipboard.writeText(tempPassword)} className="text-slate-400 hover:text-slate-600"><Copy size={14} /></button>
                  </div>
                </div>
                <p className="text-xs text-amber-600 font-semibold">⚠️ User will be asked to change password on first login</p>
                <button onClick={() => { setShowModal(false); setTempPassword(""); }} className="w-full bg-emerald-600 text-white py-2.5 rounded-xl text-sm font-semibold">Done</button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name *</label>
                  <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm" placeholder="John Doe" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Email *</label>
                  <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm" placeholder="john@company.com" />
                </div>
                <button onClick={handleCreate} disabled={!form.name || !form.email} className="w-full bg-emerald-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors">Create Staff Account</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Permissions Modal */}
      {showPermsModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowPermsModal(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-800">Permissions — {showPermsModal.name}</h2>
              <button onClick={() => setShowPermsModal(null)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              {ALL_PERMISSIONS.map(group => (
                <div key={group.module} className="border border-slate-200 rounded-xl p-4">
                  <h3 className="text-sm font-bold text-slate-700 mb-3 capitalize">{group.module}</h3>
                  <div className="flex flex-wrap gap-2">
                    {group.actions.map(action => {
                      const perm = `${group.module}.${action}`;
                      const isSelected = selectedPerms.includes(perm);
                      return (
                        <button key={perm} onClick={() => togglePerm(perm)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${isSelected ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                          {action}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <button onClick={() => setSelectedPerms(ALL_PERMISSIONS.flatMap(g => g.actions.map(a => `${g.module}.${a}`)))} className="flex-1 py-2 rounded-xl text-sm font-semibold border border-slate-200 hover:bg-slate-50">Select All</button>
                <button onClick={() => setSelectedPerms([])} className="flex-1 py-2 rounded-xl text-sm font-semibold border border-slate-200 hover:bg-slate-50">Clear All</button>
              </div>
              <button onClick={savePerms} className="w-full bg-emerald-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors">Save Permissions ({selectedPerms.length} selected)</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
