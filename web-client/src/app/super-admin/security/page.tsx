"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { 
  ShieldCheck, ShieldAlert, Lock, Key, History, Activity, 
  ArrowRight, CheckCircle2, AlertTriangle, FileText, Server, Users
} from 'lucide-react';
import { Button, Badge, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui';

export default function SecurityOverviewPage() {
  const [auditStats, setAuditStats] = useState({
    totalEvents: 0,
    recentEvents: [] as any[],
  });
  const [loading, setLoading] = useState(true);

  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  useEffect(() => {
    async function fetchSecurityData() {
      try {
        const res = await axios.get(`${apiBase}/api/super-admin/audit-logs`, { withCredentials: true });
        const logs = res.data?.logs || [];
        setAuditStats({
          totalEvents: logs.length,
          recentEvents: logs.slice(0, 5),
        });
      } catch (err) {
        console.error('Error fetching audit logs for security overview:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchSecurityData();
  }, [apiBase]);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Security & Governance</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Platform-wide multi-tenant cryptographic safeguards, access controls, and immutable audit logs.
          </p>
        </div>

        <Link href="/super-admin/security/audit-logs">
          <Button variant="primary" size="md" rightIcon={<ArrowRight size={16} />}>
            View Immutable Audit Logs
          </Button>
        </Link>
      </div>

      {/* Security Posture Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Multi-Tenancy</p>
              <h3 className="text-xl font-bold text-emerald-700">Strictly Isolated</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">tenantId partition on all queries</p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <ShieldCheck size={24} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Data Encryption</p>
              <h3 className="text-xl font-bold text-blue-700">AES-256 / TLS 1.3</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Rest & transit encrypted</p>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Lock size={24} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">DPDP Act 2023</p>
              <h3 className="text-xl font-bold text-indigo-700">Compliant</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">India local data residency</p>
            </div>
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <Server size={24} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Logged Events</p>
              <h3 className="text-xl font-bold text-slate-900">{auditStats.totalEvents}</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Tamper-evident trail</p>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <Activity size={24} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Security Controls (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Platform Security Controls</CardTitle>
              <CardDescription>Enterprise authorization safeguards and session policies</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3.5">
                <CheckCircle2 size={18} className="text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Tenant Boundary Isolation</h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Middleware enforces <code className="text-xs font-mono bg-white px-1 py-0.5 rounded border border-slate-200">requireTenantAuth</code> and verifies ownership on all child entity mutations (tasks, milestones, invoices, DISCOM forms).
                  </p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3.5">
                <CheckCircle2 size={18} className="text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-slate-900">JWT Token Security & Anti-Spoofing</h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    User identity is strictly extracted from signed JWT payloads. Suspended tenants are rejected automatically across all API routes with HTTP 403.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3.5">
                <CheckCircle2 size={18} className="text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Role-Based Access Control (RBAC)</h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Fine-grained employee permission keys for CRM, Site Surveys, Quotations, Procurement, Finance, and Solar Subsidy Funnels.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Audit Log Quick View (1 Col) */}
        <div>
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Recent Audit Events</CardTitle>
                <CardDescription>Latest administrative operations</CardDescription>
              </div>
              <Link href="/super-admin/security/audit-logs" className="text-xs font-bold text-emerald-600 hover:underline">
                View All
              </Link>
            </CardHeader>
            <CardContent>
              {auditStats.recentEvents.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">No recent audit log events recorded.</p>
              ) : (
                <div className="space-y-3">
                  {auditStats.recentEvents.map((evt, idx) => (
                    <div key={evt.id || idx} className="p-3 bg-slate-50/70 rounded-xl border border-slate-100 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-900">{evt.action}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {evt.createdAt ? new Date(evt.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">
                        Entity: <span className="font-mono text-slate-700">{evt.entity}</span>
                        {evt.ipAddress && ` • IP: ${evt.ipAddress}`}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Link href="/super-admin/security/audit-logs" className="w-full">
                <Button variant="outline" size="sm" className="w-full">
                  Open Audit Log Explorer
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
