"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  X, Check, Sparkles, Layers, Sliders, Palette, Type, 
  FileText, Shield, UserCheck, Image, Save, Copy, Trash2, 
  ChevronUp, ChevronDown, Eye, CheckCircle2, AlertCircle, 
  Building2, Phone, Mail, MapPin, Plus, RefreshCw, Star
} from 'lucide-react';

export interface TemplateSectionItem {
  id: string;
  title: string;
  subtitle?: string;
  isEnabled: boolean;
  order: number;
  isRequired?: boolean;
}

export interface ProposalTemplateRecord {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  description?: string;
  projectType: string;
  isDefault: boolean;
  primaryColor: string;
  accentColor: string;
  fontFamily: string;
  coverLayout: string;
  showFinancialCharts: boolean;
  showEquipmentImages: boolean;
  headerText?: string;
  footerText?: string;
  showPageNumbers: boolean;
  sections: TemplateSectionItem[];
  defaultScope?: Array<{ item: string; status: 'INCLUDED' | 'EXCLUDED' | 'CHARGEABLE' }>;
  defaultWarranties?: Record<string, string>;
  defaultTerms?: string[];
  defaultMilestones?: Array<{ percentage: number; description: string }>;
  defaultExclusions?: string[];
  signatoryName?: string;
  signatoryTitle?: string;
  signatureUrl?: string;
  companyStampUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface TemplateDesignerProps {
  isOpen: boolean;
  onClose: () => void;
  tenantInfo?: any;
  onTemplateSaved?: () => void;
}

const PRESET_COLORS = [
  { name: 'Sky Blue & Emerald', primary: '#0284c7', accent: '#059669' },
  { name: 'Navy & Teal', primary: '#1e3a8a', accent: '#0d9488' },
  { name: 'Solar Gold & Green', primary: '#ca8a04', accent: '#16a34a' },
  { name: 'Charcoal & Amber', primary: '#334155', accent: '#d97706' },
  { name: 'Deep Indigo & Cyan', primary: '#3730a3', accent: '#06b6d4' }
];

const FONTS = ['Inter', 'Roboto', 'Outfit', 'Poppins'];
const COVER_LAYOUTS = [
  { id: 'MODERN_FULL', name: 'Modern Full Hero', desc: 'Bold photo hero with solar capacity badge and EPC stats' },
  { id: 'MINIMALIST', name: 'Minimalist Corporate', desc: 'Clean white background, discreet borders, and high contrast typography' },
  { id: 'SPLIT_BANNER', name: 'Split Engineering Grid', desc: 'Dual-panel technical design tailored for Commercial & Industrial EPC' }
];

export function TemplateDesignerModal({ isOpen, onClose, tenantInfo, onTemplateSaved }: TemplateDesignerProps) {
  const [templates, setTemplates] = useState<ProposalTemplateRecord[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ProposalTemplateRecord | null>(null);
  const [activeTab, setActiveTab] = useState<'branding' | 'sections' | 'presets' | 'signatory'>('branding');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states
  const [tplName, setTplName] = useState('');
  const [tplDesc, setTplDesc] = useState('');
  const [projectType, setProjectType] = useState('ALL');
  const [isDefault, setIsDefault] = useState(false);
  const [primaryColor, setPrimaryColor] = useState('#0284c7');
  const [accentColor, setAccentColor] = useState('#059669');
  const [fontFamily, setFontFamily] = useState('Inter');
  const [coverLayout, setCoverLayout] = useState('MODERN_FULL');
  const [showCharts, setShowCharts] = useState(true);
  const [showImages, setShowImages] = useState(true);
  const [headerText, setHeaderText] = useState('');
  const [footerText, setFooterText] = useState('');
  const [showPageNumbers, setShowPageNumbers] = useState(true);
  const [sections, setSections] = useState<TemplateSectionItem[]>([]);
  const [signatoryName, setSignatoryName] = useState('');
  const [signatoryTitle, setSignatoryTitle] = useState('');
  const [signatureUrl, setSignatureUrl] = useState('');
  const [companyStampUrl, setCompanyStampUrl] = useState('');

  // Default Presets states
  const [terms, setTerms] = useState<string[]>([]);
  const [newTerm, setNewTerm] = useState('');
  const [scopeItems, setScopeItems] = useState<Array<{ item: string; status: 'INCLUDED' | 'EXCLUDED' | 'CHARGEABLE' }>>([]);
  const [newScopeText, setNewScopeText] = useState('');
  const [newScopeStatus, setNewScopeStatus] = useState<'INCLUDED' | 'EXCLUDED' | 'CHARGEABLE'>('INCLUDED');

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/templates`, {
        withCredentials: true
      });
      const tpls = res.data.templates || [];
      setTemplates(tpls);
      if (tpls.length > 0 && !selectedTemplate) {
        loadTemplateIntoState(tpls[0]);
      }
    } catch (err: any) {
      console.error('Failed to fetch templates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
    }
  }, [isOpen]);

  const loadTemplateIntoState = (tpl: ProposalTemplateRecord) => {
    setSelectedTemplate(tpl);
    setTplName(tpl.name || '');
    setTplDesc(tpl.description || '');
    setProjectType(tpl.projectType || 'ALL');
    setIsDefault(tpl.isDefault || false);
    setPrimaryColor(tpl.primaryColor || '#0284c7');
    setAccentColor(tpl.accentColor || '#059669');
    setFontFamily(tpl.fontFamily || 'Inter');
    setCoverLayout(tpl.coverLayout || 'MODERN_FULL');
    setShowCharts(tpl.showFinancialCharts ?? true);
    setShowImages(tpl.showEquipmentImages ?? true);
    setHeaderText(tpl.headerText || '');
    setFooterText(tpl.footerText || '');
    setShowPageNumbers(tpl.showPageNumbers ?? true);
    setSections(Array.isArray(tpl.sections) ? [...tpl.sections].sort((a, b) => a.order - b.order) : []);
    setSignatoryName(tpl.signatoryName || '');
    setSignatoryTitle(tpl.signatoryTitle || '');
    setSignatureUrl(tpl.signatureUrl || '');
    setCompanyStampUrl(tpl.companyStampUrl || '');
    setTerms(Array.isArray(tpl.defaultTerms) ? [...tpl.defaultTerms] : []);
    setScopeItems(Array.isArray(tpl.defaultScope) ? [...tpl.defaultScope] : []);
  };

  const handleSave = async () => {
    if (!tplName.trim()) {
      setFeedbackMsg({ type: 'error', text: 'Template name is required.' });
      return;
    }

    try {
      setSaving(true);
      setFeedbackMsg(null);

      const payload = {
        name: tplName,
        description: tplDesc,
        projectType,
        isDefault,
        primaryColor,
        accentColor,
        fontFamily,
        coverLayout,
        showFinancialCharts: showCharts,
        showEquipmentImages: showImages,
        headerText,
        footerText,
        showPageNumbers,
        sections,
        signatoryName,
        signatoryTitle,
        signatureUrl,
        companyStampUrl,
        defaultTerms: terms,
        defaultScope: scopeItems
      };

      if (selectedTemplate?.id) {
        const res = await axios.patch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/templates/${selectedTemplate.id}`,
          payload,
          { withCredentials: true }
        );
        setFeedbackMsg({ type: 'success', text: 'Template updated successfully!' });
        loadTemplateIntoState(res.data.template);
      } else {
        const res = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/templates`,
          payload,
          { withCredentials: true }
        );
        setFeedbackMsg({ type: 'success', text: 'New template created successfully!' });
        loadTemplateIntoState(res.data.template);
      }

      await fetchTemplates();
      if (onTemplateSaved) onTemplateSaved();
    } catch (err: any) {
      console.error('Error saving template:', err);
      setFeedbackMsg({ type: 'error', text: err.response?.data?.error || 'Failed to save template.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDuplicate = async () => {
    if (!selectedTemplate) return;
    try {
      setLoading(true);
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/templates/${selectedTemplate.id}/duplicate`,
        {},
        { withCredentials: true }
      );
      setFeedbackMsg({ type: 'success', text: 'Template duplicated successfully!' });
      await fetchTemplates();
      loadTemplateIntoState(res.data.template);
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: 'Failed to duplicate template.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async () => {
    if (!selectedTemplate) return;
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/templates/${selectedTemplate.id}/set-default`,
        {},
        { withCredentials: true }
      );
      setIsDefault(true);
      setFeedbackMsg({ type: 'success', text: `Set as default template for ${projectType} projects!` });
      await fetchTemplates();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: 'Failed to set as default.' });
    }
  };

  const handleCreateNew = () => {
    setSelectedTemplate(null);
    setTplName('Custom Tenant Proposal Template');
    setTplDesc('Tailored quotation document with custom sections, brand palette, and commercial milestones.');
    setProjectType('ALL');
    setIsDefault(false);
    setPrimaryColor('#0284c7');
    setAccentColor('#059669');
    setFontFamily('Inter');
    setCoverLayout('MODERN_FULL');
    setShowCharts(true);
    setShowImages(true);
    setHeaderText('SOLAR ROOFTOP EPC PROPOSAL');
    setFooterText('Confidential • Prepared by WhereReady Solar OS');
    setShowPageNumbers(true);
    setSections([
      { id: 'cover', title: 'Cover Page', subtitle: 'Executive Presentation', isEnabled: true, order: 1, isRequired: true },
      { id: 'requirements', title: 'Customer & Site Requirements', subtitle: 'Current Consumption Audit', isEnabled: true, order: 2 },
      { id: 'solution', title: 'Recommended Solar Solution', subtitle: 'System Architecture & Specs', isEnabled: true, order: 3, isRequired: true },
      { id: 'savings', title: 'Generation & Financial Analysis', subtitle: '25-Year Cumulative Savings', isEnabled: true, order: 4 },
      { id: 'pricing', title: 'Commercial Quotation', subtitle: 'Itemized Bill of Materials & GST', isEnabled: true, order: 5, isRequired: true },
      { id: 'scope', title: 'Scope of Work', subtitle: 'EPC Inclusions & Exclusions', isEnabled: true, order: 6 },
      { id: 'warranty', title: 'Warranties & Service Commitments', subtitle: 'Tier-1 Hardware Warranties', isEnabled: true, order: 7, isRequired: true },
      { id: 'terms', title: 'Commercial Terms & Milestones', subtitle: 'Payment Schedule', isEnabled: true, order: 8, isRequired: true },
      { id: 'acceptance', title: 'Acceptance & Sign-off', subtitle: 'Work Order Authorization', isEnabled: true, order: 9, isRequired: true }
    ]);
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newIdx = direction === 'up' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= sections.length) return;
    const reordered = [...sections];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(newIdx, 0, moved);
    const updated = reordered.map((sec, i) => ({ ...sec, order: i + 1 }));
    setSections(updated);
  };

  const toggleSection = (id: string) => {
    setSections(prev =>
      prev.map(sec => {
        if (sec.id === id) {
          if (sec.isRequired) return sec; // Cannot disable required section
          return { ...sec, isEnabled: !sec.isEnabled };
        }
        return sec;
      })
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* MODAL HEADER */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                Proposal Template Designer & Branding
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                  Multi-Tenant
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Design custom EPC proposal templates, branding themes, section orders, and legal terms for {tenantInfo?.legalName || tenantInfo?.name || 'Your Company'}.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCreateNew}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              New Template
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* FEEDBACK ALERT */}
        {feedbackMsg && (
          <div className={`px-6 py-2.5 text-xs font-medium flex items-center justify-between border-b ${
            feedbackMsg.type === 'success' 
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}>
            <span className="flex items-center gap-1.5">
              {feedbackMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
              {feedbackMsg.text}
            </span>
            <button onClick={() => setFeedbackMsg(null)} className="text-slate-500 hover:text-slate-700">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* MAIN BODY: 2 COLUMN WORKSPACE */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* LEFT SIDEBAR: TEMPLATES LIST */}
          <div className="w-72 border-r border-slate-200 bg-slate-50 p-4 flex flex-col gap-2 overflow-y-auto">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              Reusable Templates ({templates.length})
            </div>

            {loading ? (
              <div className="py-12 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
                Loading templates...
              </div>
            ) : (
              templates.map(tpl => {
                const isCurrent = selectedTemplate?.id === tpl.id;
                return (
                  <button
                    key={tpl.id}
                    onClick={() => loadTemplateIntoState(tpl)}
                    className={`w-full text-left p-3 rounded-xl border text-xs transition-all relative ${
                      isCurrent
                        ? 'bg-blue-50/70 border-blue-500 text-blue-900 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="font-bold truncate pr-1">{tpl.name}</span>
                      {tpl.isDefault && (
                        <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 text-[10px] font-bold flex items-center gap-0.5">
                          <Star className="w-2.5 h-2.5 fill-blue-600 text-blue-600" />
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                      {tpl.description || 'Standard solar proposal template.'}
                    </p>
                    <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 pt-1.5 border-t border-slate-100">
                      <span className="font-semibold uppercase text-slate-600">{tpl.projectType}</span>
                      <div className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: tpl.primaryColor }} />
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: tpl.accentColor }} />
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* RIGHT CANVAS: TABS & CUSTOMIZATION ENGINE */}
          <div className="flex-1 flex flex-col overflow-y-auto bg-white p-6">
            
            {/* TABS HEADER */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-6">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('branding')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    activeTab === 'branding'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Palette className="w-3.5 h-3.5" />
                  Branding & Layout
                </button>
                <button
                  onClick={() => setActiveTab('sections')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    activeTab === 'sections'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  Document Sections ({sections.filter(s => s.isEnabled).length})
                </button>
                <button
                  onClick={() => setActiveTab('presets')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    activeTab === 'presets'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  Scope & Terms
                </button>
                <button
                  onClick={() => setActiveTab('signatory')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    activeTab === 'signatory'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  Signatory & Stamp
                </button>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex items-center gap-2">
                {selectedTemplate && (
                  <>
                    <button
                      onClick={handleSetDefault}
                      disabled={isDefault}
                      title="Set as default template for this project type"
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-colors ${
                        isDefault 
                          ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                          : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Star className={`w-3.5 h-3.5 ${isDefault ? 'fill-slate-400' : 'text-slate-500'}`} />
                      {isDefault ? 'Default' : 'Set Default'}
                    </button>
                    <button
                      onClick={handleDuplicate}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 flex items-center gap-1.5 transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      Duplicate
                    </button>
                  </>
                )}
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  {saving ? 'Saving...' : 'Save Template'}
                </button>
              </div>
            </div>

            {/* TAB CONTENT 1: BRANDING & LAYOUT */}
            {activeTab === 'branding' && (
              <div className="space-y-6 max-w-4xl">
                
                {/* TEMPLATE IDENTITY */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Template Name *</label>
                    <input
                      type="text"
                      value={tplName}
                      onChange={e => setTplName(e.target.value)}
                      placeholder="e.g. Premium Residential Solar Proposal"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Applicable Project Type</label>
                    <select
                      value={projectType}
                      onChange={e => setProjectType(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="ALL">All Project Types (Universal)</option>
                      <option value="RESIDENTIAL">Residential Rooftop</option>
                      <option value="COMMERCIAL">Commercial & Industrial EPC</option>
                      <option value="HYBRID">Hybrid & Battery Storage</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Description & Objective</label>
                    <input
                      type="text"
                      value={tplDesc}
                      onChange={e => setTplDesc(e.target.value)}
                      placeholder="Concise overview of when sales representatives should choose this proposal format"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* BRAND COLOR PALETTE */}
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Palette className="w-4 h-4 text-blue-600" />
                    Color Palette & Styling Tokens
                  </h3>
                  
                  {/* PRESET PALETTES */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-3">
                    {PRESET_COLORS.map(p => (
                      <button
                        key={p.name}
                        onClick={() => {
                          setPrimaryColor(p.primary);
                          setAccentColor(p.accent);
                        }}
                        className={`p-2 rounded-lg border text-left text-xs transition-all flex items-center gap-2 ${
                          primaryColor === p.primary && accentColor === p.accent
                            ? 'border-blue-600 bg-blue-50 shadow-xs'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex -space-x-1">
                          <span className="w-4 h-4 rounded-full border border-white" style={{ backgroundColor: p.primary }} />
                          <span className="w-4 h-4 rounded-full border border-white" style={{ backgroundColor: p.accent }} />
                        </div>
                        <span className="text-[11px] font-medium truncate text-slate-700">{p.name}</span>
                      </button>
                    ))}
                  </div>

                  {/* CUSTOM COLOR INPUTS */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-slate-800">Primary Brand Color</div>
                        <div className="text-[11px] text-slate-500">Headers, badges, table styling</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={primaryColor}
                          onChange={e => setPrimaryColor(e.target.value)}
                          className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
                        />
                        <span className="text-xs font-mono font-bold text-slate-700">{primaryColor}</span>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-slate-800">Accent / Savings Color</div>
                        <div className="text-[11px] text-slate-500">Highlights, financial gain, badges</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={accentColor}
                          onChange={e => setAccentColor(e.target.value)}
                          className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
                        />
                        <span className="text-xs font-mono font-bold text-slate-700">{accentColor}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* COVER PAGE LAYOUT SELECTOR */}
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Image className="w-4 h-4 text-emerald-600" />
                    Cover Page Layout & Aesthetics
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {COVER_LAYOUTS.map(cov => (
                      <button
                        key={cov.id}
                        onClick={() => setCoverLayout(cov.id)}
                        className={`p-3.5 rounded-xl border text-left transition-all relative ${
                          coverLayout === cov.id
                            ? 'border-blue-600 bg-blue-50/60 shadow-xs'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-slate-900">{cov.name}</span>
                          {coverLayout === cov.id && <Check className="w-4 h-4 text-blue-600" />}
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed">{cov.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* TYPOGRAPHY & HEADERS/FOOTERS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <label className="block text-xs font-bold text-slate-800">PDF-Safe Typography</label>
                    <div className="grid grid-cols-2 gap-2">
                      {FONTS.map(f => (
                        <button
                          key={f}
                          onClick={() => setFontFamily(f)}
                          className={`p-2 rounded-lg border text-xs text-center font-medium transition-all ${
                            fontFamily === f
                              ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold'
                              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <label className="block text-xs font-bold text-slate-800">Page Header & Footer Watermark</label>
                    <input
                      type="text"
                      value={headerText}
                      onChange={e => setHeaderText(e.target.value)}
                      placeholder="Top Running Header Text"
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none"
                    />
                    <input
                      type="text"
                      value={footerText}
                      onChange={e => setFooterText(e.target.value)}
                      placeholder="Bottom Footer Disclaimer Text"
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none"
                    />
                  </div>
                </div>

              </div>
            )}

            {/* TAB CONTENT 2: SECTIONS REORDERING & VISIBILITY */}
            {activeTab === 'sections' && (
              <div className="space-y-4 max-w-4xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Document Sections Organization</h3>
                    <p className="text-xs text-slate-500">
                      Reorder sections using the arrows. Toggle sections to make them active or hidden by default.
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                    {sections.filter(s => s.isEnabled).length} of {sections.length} Active
                  </span>
                </div>

                <div className="space-y-2">
                  {sections.map((sec, idx) => (
                    <div
                      key={sec.id}
                      className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                        sec.isEnabled
                          ? 'bg-white border-slate-200 shadow-xs'
                          : 'bg-slate-50/60 border-dashed border-slate-300 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                            {sec.title}
                            {sec.isRequired && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-semibold">
                                Required
                              </span>
                            )}
                          </div>
                          {sec.subtitle && (
                            <div className="text-[11px] text-slate-500">{sec.subtitle}</div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* REORDER BUTTONS */}
                        <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                          <button
                            onClick={() => moveSection(idx, 'up')}
                            disabled={idx === 0}
                            className="p-1 hover:bg-slate-200 text-slate-600 disabled:opacity-30"
                            title="Move Up"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => moveSection(idx, 'down')}
                            disabled={idx === sections.length - 1}
                            className="p-1 hover:bg-slate-200 text-slate-600 disabled:opacity-30"
                            title="Move Down"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* TOGGLE ENABLE/DISABLE */}
                        <button
                          onClick={() => toggleSection(sec.id)}
                          disabled={sec.isRequired}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                            sec.isEnabled
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                          } ${sec.isRequired ? 'cursor-not-allowed opacity-80' : ''}`}
                        >
                          {sec.isEnabled ? 'Enabled' : 'Disabled'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB CONTENT 3: SCOPE & TERMS PRESETS */}
            {activeTab === 'presets' && (
              <div className="space-y-6 max-w-4xl">
                
                {/* SCOPE OF WORK PRESET */}
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>Default Scope of Work & Deliverables</span>
                    <span className="text-slate-400 font-normal">({scopeItems.length} items)</span>
                  </h3>
                  
                  {/* ADD NEW SCOPE ITEM */}
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={newScopeText}
                      onChange={e => setNewScopeText(e.target.value)}
                      placeholder="Add standard scope item (e.g. Dedicated Dual Chemical Earthing)"
                      className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none"
                    />
                    <select
                      value={newScopeStatus}
                      onChange={e => setNewScopeStatus(e.target.value as any)}
                      className="px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                    >
                      <option value="INCLUDED">Included</option>
                      <option value="EXCLUDED">Excluded</option>
                      <option value="CHARGEABLE">Chargeable</option>
                    </select>
                    <button
                      onClick={() => {
                        if (!newScopeText.trim()) return;
                        setScopeItems([...scopeItems, { item: newScopeText.trim(), status: newScopeStatus }]);
                        setNewScopeText('');
                      }}
                      className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add
                    </button>
                  </div>

                  <div className="space-y-1.5 max-h-60 overflow-y-auto border border-slate-200 rounded-xl p-3 bg-slate-50">
                    {scopeItems.map((sc, i) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200 text-xs">
                        <span className="text-slate-800 font-medium">{sc.item}</span>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            sc.status === 'INCLUDED' ? 'bg-emerald-100 text-emerald-800' :
                            sc.status === 'EXCLUDED' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {sc.status}
                          </span>
                          <button
                            onClick={() => setScopeItems(scopeItems.filter((_, idx) => idx !== i))}
                            className="text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* TERMS & CONDITIONS PRESET */}
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>Default Terms & Conditions</span>
                    <span className="text-slate-400 font-normal">({terms.length} terms)</span>
                  </h3>

                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={newTerm}
                      onChange={e => setNewTerm(e.target.value)}
                      placeholder="Add standard term (e.g. Net metering feasibility subject to MSEDCL approval)"
                      className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none"
                    />
                    <button
                      onClick={() => {
                        if (!newTerm.trim()) return;
                        setTerms([...terms, newTerm.trim()]);
                        setNewTerm('');
                      }}
                      className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add
                    </button>
                  </div>

                  <div className="space-y-1.5 max-h-60 overflow-y-auto border border-slate-200 rounded-xl p-3 bg-slate-50">
                    {terms.map((t, idx) => (
                      <div key={idx} className="flex items-start justify-between p-2 bg-white rounded-lg border border-slate-200 text-xs gap-3">
                        <span className="text-slate-700 leading-relaxed">• {t}</span>
                        <button
                          onClick={() => setTerms(terms.filter((_, i) => i !== idx))}
                          className="text-slate-400 hover:text-rose-600 shrink-0 mt-0.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* TAB CONTENT 4: SIGNATORY & STAMP */}
            {activeTab === 'signatory' && (
              <div className="space-y-6 max-w-3xl">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1">Authorized Company Signatory & Seal</h3>
                  <p className="text-xs text-slate-500">
                    Configure the legal representative name, designation, signature image, and official stamp appearing on Section 9 (Acceptance & Work Order).
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Signatory Full Name</label>
                    <input
                      type="text"
                      value={signatoryName}
                      onChange={e => setSignatoryName(e.target.value)}
                      placeholder="e.g. Er. Mayur Kukatkar"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Official Designation / Title</label>
                    <input
                      type="text"
                      value={signatoryTitle}
                      onChange={e => setSignatoryTitle(e.target.value)}
                      placeholder="e.g. Director - EPC Operations & Liasoning"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Digital Signature Image URL</label>
                    <input
                      type="text"
                      value={signatureUrl}
                      onChange={e => setSignatureUrl(e.target.value)}
                      placeholder="https://.../signature.png"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Company Official Stamp URL</label>
                    <input
                      type="text"
                      value={companyStampUrl}
                      onChange={e => setCompanyStampUrl(e.target.value)}
                      placeholder="https://.../stamp.png"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* PREVIEW BOX */}
                <div className="p-4 bg-white rounded-xl border border-slate-200 max-w-sm">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Proposal Acceptance Box Preview
                  </div>
                  <div className="border border-slate-300 rounded-lg p-4 text-center bg-slate-50/50">
                    <div className="h-16 flex items-center justify-center">
                      {signatureUrl ? (
                        <img src={signatureUrl} alt="Signature" className="max-h-14 object-contain" />
                      ) : (
                        <span className="text-xs text-slate-400 italic font-mono">[Authorized Signature]</span>
                      )}
                    </div>
                    <div className="mt-2 text-xs font-bold text-slate-900">{signatoryName || 'Authorized Signatory'}</div>
                    <div className="text-[11px] text-slate-500">{signatoryTitle || 'Designated Director'}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{tenantInfo?.legalName || tenantInfo?.name || 'Company Name'}</div>
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
