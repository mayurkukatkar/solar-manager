"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  CheckCircle2, ArrowLeft, Plus, ShieldCheck, Camera, FileCheck, 
  Trash2, Edit3, AlertCircle 
} from 'lucide-react';
import { Button, Input, Select, Badge, Card, CardHeader, CardTitle, CardDescription, CardContent, Modal } from '@/components/ui';
import { useToast } from '@/context/ToastContext';

interface ChecklistItem {
  id: string;
  category: string;
  title: string;
  description: string;
  isRequired: boolean;
  requiresPhoto: boolean;
  statutoryStandard?: string;
}

const DEFAULT_CHECKLISTS: ChecklistItem[] = [
  {
    id: 'chk-1',
    category: 'Mechanical & Structure',
    title: 'Structure Anchor Pull-Out Test',
    description: 'Verify anchor chemical/mechanical bolt tightness to specified torque rating (minimum 45 Nm).',
    isRequired: true,
    requiresPhoto: true,
    statutoryStandard: 'IS 875 (Part 3) Wind Load',
  },
  {
    id: 'chk-2',
    category: 'Mechanical & Structure',
    title: 'Module Tilt Angle & Orientation Verification',
    description: 'Ensure accurate southern azimuth orientation and tilt degree within ±1° tolerance of design.',
    isRequired: true,
    requiresPhoto: false,
    statutoryStandard: 'MNRE Design Guidelines',
  },
  {
    id: 'chk-3',
    category: 'DC Cabling & Inverter',
    title: 'Solar DC String Polarity & VOC Measurement',
    description: 'Verify string polarity with digital multimeter and record Open Circuit Voltage (Voc).',
    isRequired: true,
    requiresPhoto: true,
    statutoryStandard: 'IEC 62446-1 / CEA Regulations',
  },
  {
    id: 'chk-4',
    category: 'DC Cabling & Inverter',
    title: 'MC4 Connector Crimping & UV Conduit Sealing',
    description: 'Ensure genuine tool crimping with no exposed conductors and weatherproof UV-resistant conduit piping.',
    isRequired: true,
    requiresPhoto: true,
    statutoryStandard: 'IP67 / IEC 60364',
  },
  {
    id: 'chk-5',
    category: 'Earthing & Protection',
    title: 'Earth Pit Resistance Testing (< 5.0 Ω)',
    description: 'Dual earthing pits for structure and electrical surge protection tested with Earth Tester.',
    isRequired: true,
    requiresPhoto: true,
    statutoryStandard: 'IS 3043:2018 Statutory Earthing',
  },
  {
    id: 'chk-6',
    category: 'Earthing & Protection',
    title: 'Lightning Arrestor Spike Connection Continuity',
    description: 'Verify dedicated chemical earthing down-conductor bonding and absence of sharp bends.',
    isRequired: true,
    requiresPhoto: true,
    statutoryStandard: 'IEC 62305 Protection',
  },
  {
    id: 'chk-7',
    category: 'Grid Sync & Commissioning',
    title: 'Inverter Anti-Islanding Auto-Trip Test (< 2.0s)',
    description: 'Simulate grid outage and confirm inverter shuts down feeding into grid within statutory 2 seconds.',
    isRequired: true,
    requiresPhoto: false,
    statutoryStandard: 'IEEE 1547 / DISCOM Interconnection Code',
  },
  {
    id: 'chk-8',
    category: 'Grid Sync & Commissioning',
    title: 'Net-Meter Generation / Bi-Directional Sign-Off',
    description: 'Verify optical pulse reading on export/import registers before statutory DISCOM officer handover.',
    isRequired: true,
    requiresPhoto: true,
    statutoryStandard: 'CEA Metering Regulations 2006',
  },
];

export default function InstallationChecklistsPage() {
  const { showToast } = useToast();
  const [checklists, setChecklists] = useState<ChecklistItem[]>(DEFAULT_CHECKLISTS);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    category: 'Mechanical & Structure',
    title: '',
    description: '',
    statutoryStandard: '',
    isRequired: true,
    requiresPhoto: true,
  });

  const categories = [
    'ALL',
    'Mechanical & Structure',
    'DC Cabling & Inverter',
    'Earthing & Protection',
    'Grid Sync & Commissioning',
  ];

  const filteredChecklists = selectedCategory === 'ALL'
    ? checklists
    : checklists.filter((item) => item.category === selectedCategory);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      showToast({ type: 'warning', message: 'Please provide a checklist item title.' });
      return;
    }

    const newItem: ChecklistItem = {
      id: `chk-${Date.now()}`,
      category: formData.category,
      title: formData.title.trim(),
      description: formData.description.trim(),
      statutoryStandard: formData.statutoryStandard.trim() || undefined,
      isRequired: formData.isRequired,
      requiresPhoto: formData.requiresPhoto,
    };

    setChecklists((prev) => [...prev, newItem]);
    setIsAddModalOpen(false);
    setFormData({
      category: 'Mechanical & Structure',
      title: '',
      description: '',
      statutoryStandard: '',
      isRequired: true,
      requiresPhoto: true,
    });

    showToast({
      type: 'success',
      title: 'Item Added',
      message: 'New QA checklist requirement registered successfully.',
    });
  };

  const handleDeleteItem = (id: string) => {
    setChecklists((prev) => prev.filter((i) => i.id !== id));
    showToast({
      type: 'info',
      message: 'Checklist item removed.',
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/tenant/installation"
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition"
            aria-label="Back to Installation"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">QA Checklist Templates</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Standardized statutory and electrical quality verification criteria for site engineers
            </p>
          </div>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => setIsAddModalOpen(true)}
          leftIcon={<Plus size={16} />}
        >
          Add Checklist Rule
        </Button>
      </div>

      {/* Category Pills Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              selectedCategory === cat
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {cat === 'ALL' ? 'All Categories' : cat}
          </button>
        ))}
      </div>

      {/* Checklists Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredChecklists.map((item) => (
          <Card key={item.id} className="hover:border-slate-300 transition flex flex-col justify-between">
            <CardContent className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
                  {item.category}
                </span>
                <div className="flex items-center gap-1.5">
                  {item.isRequired && (
                    <Badge variant="danger" size="sm">
                      Mandatory
                    </Badge>
                  )}
                  {item.requiresPhoto && (
                    <Badge variant="info" size="sm">
                      <Camera size={11} className="mr-1" /> Photo Required
                    </Badge>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900 leading-snug">{item.title}</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.description}</p>
              </div>

              {item.statutoryStandard && (
                <div className="p-2 bg-slate-50 rounded-lg text-[11px] text-slate-600 flex items-center gap-1.5 font-medium">
                  <ShieldCheck size={13} className="text-emerald-600 shrink-0" />
                  <span>Standard: {item.statutoryStandard}</span>
                </div>
              )}
            </CardContent>

            <div className="px-4 sm:px-6 py-2.5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
              <span className="font-mono text-[11px]">{item.id}</span>
              <button
                type="button"
                onClick={() => handleDeleteItem(item.id)}
                className="text-slate-400 hover:text-red-600 p-1 rounded transition"
                title="Remove checklist item"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </Card>
        ))}
      </div>

      {/* Add Item Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add QA Checklist Item"
        description="Define a new technical validation criterion for field technicians"
        size="md"
      >
        <form onSubmit={handleAddItem} className="space-y-4">
          <Select
            label="Category *"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            options={[
              { value: 'Mechanical & Structure', label: 'Mechanical & Structure' },
              { value: 'DC Cabling & Inverter', label: 'DC Cabling & Inverter' },
              { value: 'Earthing & Protection', label: 'Earthing & Protection' },
              { value: 'Grid Sync & Commissioning', label: 'Grid Sync & Commissioning' },
            ]}
          />

          <Input
            label="Checklist Requirement Title *"
            required
            placeholder="e.g. Earth Pit Resistance Measurement"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />

          <div>
            <label className="text-xs font-bold text-slate-700 tracking-wide block mb-1.5">
              Testing Procedure & Description
            </label>
            <textarea
              rows={3}
              placeholder="Detailed instructions for the site technician..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition"
            />
          </div>

          <Input
            label="Statutory Code / Standard Reference"
            placeholder="e.g. IS 3043:2018 / CEA Technical Standard"
            value={formData.statutoryStandard}
            onChange={(e) => setFormData({ ...formData, statutoryStandard: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isRequired}
                onChange={(e) => setFormData({ ...formData, isRequired: e.target.checked })}
                className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
              />
              <span className="text-xs font-semibold text-slate-800">Mandatory Gate</span>
            </label>

            <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.requiresPhoto}
                onChange={(e) => setFormData({ ...formData, requiresPhoto: e.target.checked })}
                className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
              />
              <span className="text-xs font-semibold text-slate-800">Photo Proof Required</span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" size="md" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md">
              Save Requirement
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
