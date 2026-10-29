"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { 
  Calendar, Clock, User, Wrench, Shield, ArrowLeft, CheckCircle2, AlertCircle 
} from 'lucide-react';
import { Button, Input, Select, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui';
import { useToast } from '@/context/ToastContext';

export default function ScheduleInstallationPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [projects, setProjects] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    projectId: '',
    scheduledDate: new Date().toISOString().split('T')[0],
    scheduledStartTime: '09:00',
    estimatedDuration: '8',
    priority: 'NORMAL',
    assignedTechs: [] as string[],
    notes: '',
  });

  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  useEffect(() => {
    async function loadData() {
      try {
        const [projRes, staffRes] = await Promise.all([
          axios.get(`${apiBase}/api/tenant/projects`, { withCredentials: true }).catch(() => ({ data: { projects: [] } })),
          axios.get(`${apiBase}/api/tenant/staff`, { withCredentials: true }).catch(() => ({ data: { staff: [] } }))
        ]);

        if (projRes.data?.projects) {
          setProjects(projRes.data.projects);
          if (projRes.data.projects.length > 0) {
            setFormData(prev => ({ ...prev, projectId: projRes.data.projects[0].id }));
          }
        }
        if (staffRes.data?.staff) {
          setTechnicians(staffRes.data.staff);
        }
      } catch (err) {
        console.error('Error fetching data for schedule:', err);
      } finally {
        setLoadingInitial(false);
      }
    }
    loadData();
  }, [apiBase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.projectId) {
      showToast({ type: 'warning', message: 'Please select an EPC project to schedule.' });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        projectId: formData.projectId,
        scheduledDate: formData.scheduledDate,
        scheduledStartTime: formData.scheduledStartTime,
        estimatedDuration: parseFloat(formData.estimatedDuration) || 8,
        priority: formData.priority,
        notes: formData.notes,
        assignments: formData.assignedTechs,
      };

      const res = await axios.post(`${apiBase}/api/tenant/installations/schedule`, payload, {
        withCredentials: true,
      });

      showToast({
        type: 'success',
        title: 'Job Scheduled',
        message: `Installation job ${res.data?.installation?.jobId || 'created'} scheduled successfully!`,
      });
      router.push('/tenant/installation/jobs');
    } catch (err: any) {
      console.error(err);
      showToast({
        type: 'error',
        title: 'Scheduling Failed',
        message: err.response?.data?.error || 'Failed to schedule installation job. Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const selectedProject = projects.find(p => p.id === formData.projectId);

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="flex items-center gap-3">
        <Link
          href="/tenant/installation"
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition"
          aria-label="Back to Installation"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Schedule Installation Job</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Dispatch field engineering teams and assign solar PV site execution dates.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <Wrench size={18} />
              </div>
              <div>
                <CardTitle>Project & Site Details</CardTitle>
                <CardDescription>Select the solar rooftop project requiring field installation</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select
              label="Select Project *"
              required
              value={formData.projectId}
              onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
              options={projects.map((p) => ({
                value: p.id,
                label: `${p.name || p.projectNumber || 'Solar Project'} — ${p.customer?.name || 'Customer'} (${p.systemCapacity || p.capacityKw || 3} kWp)`,
              }))}
            />

            {selectedProject && (
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <span className="font-semibold text-slate-900">Customer:</span> {selectedProject.customer?.name || 'N/A'}
                </div>
                <div>
                  <span className="font-semibold text-slate-900">Capacity:</span> {selectedProject.systemCapacity || selectedProject.capacityKw || 0} kWp
                </div>
                <div>
                  <span className="font-semibold text-slate-900">Location:</span> {selectedProject.city || 'Site'}, {selectedProject.state || 'India'}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Calendar size={18} />
              </div>
              <div>
                <CardTitle>Schedule & Timing</CardTitle>
                <CardDescription>Date, shift kickoff time, and expected completion duration</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Scheduled Date *"
                type="date"
                required
                value={formData.scheduledDate}
                onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
              />
              <Input
                label="Scheduled Start Time"
                type="time"
                value={formData.scheduledStartTime}
                onChange={(e) => setFormData({ ...formData, scheduledStartTime: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Estimated Duration (Hours)"
                type="number"
                step="0.5"
                min="1"
                max="72"
                value={formData.estimatedDuration}
                onChange={(e) => setFormData({ ...formData, estimatedDuration: e.target.value })}
              />
              <Select
                label="Execution Priority"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                options={[
                  { value: 'NORMAL', label: 'Normal Priority' },
                  { value: 'HIGH', label: 'High Priority (Urgent Commissioning)' },
                  { value: 'CRITICAL', label: 'Critical (DISCOM Inspection Deadline)' },
                ]}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <User size={18} />
              </div>
              <div>
                <CardTitle>Team Assignment & Field Notes</CardTitle>
                <CardDescription>Assign certified installers and add statutory access notes</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {technicians.length > 0 && (
              <div>
                <label className="text-xs font-bold text-slate-700 tracking-wide block mb-2">
                  Assign Technicians / Field Engineers
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border border-slate-200 rounded-xl bg-slate-50/50">
                  {technicians.map((t) => {
                    const isChecked = formData.assignedTechs.includes(t.id);
                    return (
                      <label
                        key={t.id}
                        className={`flex items-center gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition ${
                          isChecked
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                assignedTechs: [...formData.assignedTechs, t.id],
                              });
                            } else {
                              setFormData({
                                ...formData,
                                assignedTechs: formData.assignedTechs.filter((id) => id !== t.id),
                              });
                            }
                          }}
                          className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                        />
                        <span>{t.name || t.fullName}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-slate-700 tracking-wide block mb-1.5">
                Site Safety & Special Instructions
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Roof ladder required for parapet access. Inverter DB panel to be mounted near meter room."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Link href="/tenant/installation">
              <Button type="button" variant="outline" size="md">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={submitting}
              leftIcon={<CheckCircle2 size={16} />}
            >
              Confirm & Dispatch Job
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
