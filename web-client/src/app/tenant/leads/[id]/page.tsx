"use client";
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit, Phone, Mail, Calendar, MapPin, Zap, MessageSquare, Plus, CheckCircle2, FileText, ArrowRight, User, FileSpreadsheet, Trash2 } from 'lucide-react';

export default function LeadDetails() {
  const params = useParams();
  const router = useRouter();
  const [lead, setLead] = useState<any>(null);
  const [quotations, setQuotations] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState<'TIMELINE' | 'QUOTATIONS'>('TIMELINE');
  
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  
  const [showFollowupModal, setShowFollowupModal] = useState(false);
  const [followupData, setFollowupData] = useState({ type: 'CALL', scheduledAt: '', notes: '' });
  
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [convertData, setConvertData] = useState({ projectName: '' });

  // Quotation Modal State
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [quoteItems, setQuoteItems] = useState<any[]>([{ productId: '', description: '', quantity: 1, unitPrice: 0, taxRate: 0 }]);
  const [quoteDiscount, setQuoteDiscount] = useState(0);

  const fetchLead = async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/leads/${params.id}`, { withCredentials: true });
      setLead(res.data.lead);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuotations = async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/leads/${params.id}/quotations`, { withCredentials: true });
      setQuotations(res.data.quotations);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/products`, { withCredentials: true });
      setProducts(res.data.products);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchLead();
    fetchQuotations();
    fetchProducts();
  }, [params.id]);

  const handleStatusChange = async (e: any) => {
    const newStatus = e.target.value;
    if (newStatus === 'WON') {
       setShowConvertModal(true);
       return;
    }
    try {
      await axios.patch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/leads/${params.id}`, { status: newStatus }, { withCredentials: true });
      fetchLead();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddNote = async (e: any) => {
    e.preventDefault();
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/leads/${params.id}/notes`, { content: noteContent }, { withCredentials: true });
      setShowNoteModal(false);
      setNoteContent('');
      fetchLead();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddFollowup = async (e: any) => {
    e.preventDefault();
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/leads/${params.id}/followups`, followupData, { withCredentials: true });
      setShowFollowupModal(false);
      setFollowupData({ type: 'CALL', scheduledAt: '', notes: '' });
      fetchLead();
    } catch (err) {
      console.error(err);
    }
  };

  const handleConvertLead = async (e: any) => {
    e.preventDefault();
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/leads/${params.id}/convert`, convertData, { withCredentials: true });
      setShowConvertModal(false);
      fetchLead();
    } catch (err) {
      console.error(err);
    }
  };

  // Quotation Handlers
  const handleProductSelect = (index: number, productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const newItems = [...quoteItems];
    newItems[index] = {
      ...newItems[index],
      productId: product.id,
      description: product.name,
      unitPrice: product.sellingPrice,
      taxRate: product.taxRate
    };
    setQuoteItems(newItems);
  };

  const handleQuoteItemChange = (index: number, field: string, value: any) => {
    const newItems = [...quoteItems];
    newItems[index][field] = value;
    setQuoteItems(newItems);
  };

  const handleAddQuoteItem = () => {
    setQuoteItems([...quoteItems, { productId: '', description: '', quantity: 1, unitPrice: 0, taxRate: 0 }]);
  };

  const handleRemoveQuoteItem = (index: number) => {
    const newItems = quoteItems.filter((_, i) => i !== index);
    setQuoteItems(newItems);
  };

  const calculateQuoteTotals = () => {
    let subtotal = 0;
    let taxTotal = 0;
    quoteItems.forEach(item => {
      const lineTotal = (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0);
      const lineTax = lineTotal * ((parseFloat(item.taxRate) || 0) / 100);
      subtotal += lineTotal;
      taxTotal += lineTax;
    });
    return { subtotal, taxTotal, grandTotal: subtotal + taxTotal - (parseFloat(quoteDiscount as any) || 0) };
  };

  const handleGenerateQuote = async (e: any) => {
    e.preventDefault();
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/leads/${params.id}/quotations`, {
        items: quoteItems.map(item => ({
          ...item,
          quantity: parseFloat(item.quantity),
          unitPrice: parseFloat(item.unitPrice),
          taxRate: parseFloat(item.taxRate)
        })),
        discount: parseFloat(quoteDiscount as any) || 0
      }, { withCredentials: true });
      setShowQuoteModal(false);
      setQuoteItems([{ productId: '', description: '', quantity: 1, unitPrice: 0, taxRate: 0 }]);
      setQuoteDiscount(0);
      fetchQuotations();
      fetchLead(); // Refresh timeline activities
    } catch (err) {
      console.error(err);
    }
  };

  const handleQuoteStatusChange = async (quoteId: string, status: string) => {
    try {
      await axios.patch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/quotations/${quoteId}`, { status }, { withCredentials: true });
      fetchQuotations();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div></div>;
  if (!lead) return <div className="text-center py-20 text-slate-500">Lead not found.</div>;

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'NEW': return 'bg-blue-100 text-blue-700';
      case 'CONTACTED': return 'bg-indigo-100 text-indigo-700';
      case 'QUALIFIED': return 'bg-purple-100 text-purple-700';
      case 'SITE_SURVEY': return 'bg-amber-100 text-amber-700';
      case 'PROPOSAL_SENT': return 'bg-orange-100 text-orange-700';
      case 'NEGOTIATION': return 'bg-pink-100 text-pink-700';
      case 'WON': return 'bg-emerald-100 text-emerald-700';
      case 'LOST': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const timelineEvents = [
    ...(lead.activities || []).map((a: any) => ({ ...a, eventType: 'ACTIVITY', date: new Date(a.createdAt) })),
    ...(lead.leadNotes || []).map((n: any) => ({ ...n, eventType: 'NOTE', date: new Date(n.createdAt) })),
    ...(lead.followUps || []).map((f: any) => ({ ...f, eventType: 'FOLLOWUP', date: new Date(f.scheduledAt) }))
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors">
        <ArrowLeft size={16} /> Back to Leads
      </button>

      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
            <User size={32} />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">{lead.name}</h1>
              <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${getStatusColor(lead.status)}`}>
                {lead.status.replace('_', ' ')}
              </span>
            </div>
            <p className="text-slate-500 mt-1 flex items-center gap-4 text-sm">
              <span>{lead.company || lead.customerType || 'Individual'}</span>
              {lead.assignee && <span className="flex items-center gap-1.5"><User size={14}/> Assigned to {lead.assignee.name}</span>}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select 
            value={lead.status}
            onChange={handleStatusChange}
            disabled={lead.status === 'WON'}
            className="px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-medium bg-slate-50 text-slate-700 disabled:opacity-50"
          >
            <option value="NEW">New</option>
            <option value="CONTACTED">Contacted</option>
            <option value="QUALIFIED">Qualified</option>
            <option value="SITE_SURVEY">Site Survey</option>
            <option value="PROPOSAL_SENT">Proposal Sent</option>
            <option value="NEGOTIATION">Negotiation</option>
            <option value="WON">Won</option>
            <option value="LOST">Lost</option>
            <option value="ON_HOLD">On Hold</option>
          </select>

          {lead.status !== 'WON' ? (
            <button onClick={() => setShowConvertModal(true)} className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium text-sm transition-colors shadow-sm flex items-center gap-2">
              <CheckCircle2 size={16} /> Convert to Customer
            </button>
          ) : (
            <Link href={`/tenant/crm/${lead.id}`} className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium text-sm transition-colors shadow-sm flex items-center gap-2">
              <span>Customer 360° Hub</span>
              <ArrowRight size={16} />
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Details */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">Contact Details</h3>
              <button className="text-slate-400 hover:text-emerald-600"><Edit size={16} /></button>
            </div>
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <Phone size={16} className="text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-slate-900 font-mono">{lead.mobile}</p>
                    <p className="text-xs text-slate-500">Primary Phone</p>
                  </div>
                </div>
                {lead.mobile && (
                  <div className="flex items-center gap-1.5">
                    <a 
                      href={`tel:${lead.mobile.replace(/[^0-9]/g, '')}`} 
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 transition-colors"
                      title="Call"
                    >
                      <Phone size={14} />
                    </a>
                    <a 
                      href={`https://wa.me/${lead.mobile.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello ${lead.name}, regarding your solar rooftop inquiry with WhereReady Solar OS...`)}`} 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors"
                      title="WhatsApp"
                    >
                      <MessageSquare size={14} />
                    </a>
                  </div>
                )}
              </div>
              {lead.email && (
                <div className="flex items-start gap-3">
                  <Mail size={16} className="text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">{lead.email}</p>
                    <p className="text-xs text-slate-500">Email Address</p>
                  </div>
                </div>
              )}
              {(lead.address || lead.city) && (
                <div className="flex items-start gap-3">
                  <MapPin size={16} className="text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">{[lead.address, lead.city, lead.state].filter(Boolean).join(', ')}</p>
                    <p className="text-xs text-slate-500">Location</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">Solar Requirement</h3>
              <button className="text-slate-400 hover:text-emerald-600"><Edit size={16} /></button>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Zap size={16} className="text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-900">{lead.estimatedCap ? `${lead.estimatedCap} ${lead.capacityUnit || 'kW'}` : 'Not specified'}</p>
                  <p className="text-xs text-slate-500">Estimated Capacity</p>
                </div>
              </div>
              {lead.systemType && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">System Type</span>
                  <span className="text-sm font-medium text-slate-900">{lead.systemType}</span>
                </div>
              )}
              {lead.monthlyBill && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Monthly Bill</span>
                  <span className="text-sm font-medium text-slate-900">₹{lead.monthlyBill}</span>
                </div>
              )}
              {lead.roofType && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Roof Type</span>
                  <span className="text-sm font-medium text-slate-900">{lead.roofType}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Tabs */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="flex border-b border-slate-100 bg-slate-50/50">
              <button 
                onClick={() => setActiveTab('TIMELINE')} 
                className={`flex-1 py-4 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${activeTab === 'TIMELINE' ? 'text-emerald-600 border-b-2 border-emerald-600 bg-white' : 'text-slate-500 hover:text-slate-700 hover:bg-white'}`}
              >
                <Calendar size={18} /> Timeline & Activity
              </button>
              <button 
                onClick={() => setActiveTab('QUOTATIONS')} 
                className={`flex-1 py-4 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${activeTab === 'QUOTATIONS' ? 'text-emerald-600 border-b-2 border-emerald-600 bg-white' : 'text-slate-500 hover:text-slate-700 hover:bg-white'}`}
              >
                <FileSpreadsheet size={18} /> Quotations ({quotations.length})
              </button>
            </div>

            <div className="p-6">
              {activeTab === 'TIMELINE' && (
                <div className="space-y-6">
                  <div className="flex gap-2 justify-end mb-6">
                    <button onClick={() => setShowFollowupModal(true)} className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 border border-slate-200">
                      <Calendar size={14} /> Schedule Follow-up
                    </button>
                    <button onClick={() => setShowNoteModal(true)} className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 border border-slate-200">
                      <MessageSquare size={14} /> Add Note
                    </button>
                  </div>
                  <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                    {timelineEvents.map((evt, idx) => (
                      <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-slate-100 text-slate-500 shadow-sm shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                          {evt.eventType === 'NOTE' ? <MessageSquare size={16} /> : 
                           evt.eventType === 'FOLLOWUP' ? <Calendar size={16} /> : 
                           <FileText size={16} />}
                        </div>
                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-slate-50 p-4 rounded-xl border border-slate-100">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{evt.eventType}</span>
                            <time className="text-xs text-slate-400">{evt.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</time>
                          </div>
                          <p className="text-sm text-slate-700">{evt.content || evt.description || evt.notes}</p>
                        </div>
                      </div>
                    ))}
                    {timelineEvents.length === 0 && (
                      <div className="text-center py-10 text-slate-500 text-sm">
                        No activities recorded yet.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'QUOTATIONS' && (
                <div className="space-y-6">
                  <div className="flex justify-end mb-4">
                    <button onClick={() => setShowQuoteModal(true)} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-2 shadow-sm">
                      <Plus size={16} /> Create Quotation
                    </button>
                  </div>
                  
                  {quotations.length === 0 ? (
                    <div className="text-center py-16 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      <FileSpreadsheet size={48} className="mx-auto text-slate-300 mb-3" />
                      <p className="text-slate-500 font-medium">No quotations sent yet.</p>
                      <p className="text-slate-400 text-sm mt-1">Create a quotation to outline the project costs.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {quotations.map(quote => (
                        <div key={quote.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:border-emerald-200 transition-colors">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-slate-900 text-lg">₹{quote.total.toLocaleString()}</h4>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${quote.status === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-700' : quote.status === 'REJECTED' ? 'bg-red-100 text-red-700' : quote.status === 'SENT' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'}`}>
                                  {quote.status}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 mt-1">Created on {new Date(quote.createdAt).toLocaleDateString()}</p>
                            </div>
                            <select 
                              value={quote.status} 
                              onChange={(e) => handleQuoteStatusChange(quote.id, e.target.value)}
                              className="text-xs border border-slate-200 rounded px-2 py-1 outline-none focus:border-emerald-500 bg-slate-50"
                            >
                              <option value="DRAFT">Draft</option>
                              <option value="SENT">Sent</option>
                              <option value="ACCEPTED">Accepted</option>
                              <option value="REJECTED">Rejected</option>
                            </select>
                          </div>
                          
                          <div className="bg-slate-50 rounded-lg p-3 text-sm">
                            <div className="font-medium text-slate-700 mb-2 border-b border-slate-200 pb-2">Line Items ({quote.items.length})</div>
                            <ul className="space-y-2">
                              {quote.items.map((item: any) => (
                                <li key={item.id} className="flex justify-between items-center text-slate-600 text-xs">
                                  <span>{item.quantity}x {item.description}</span>
                                  <span className="font-medium text-slate-900">₹{item.total.toLocaleString()}</span>
                                </li>
                              ))}
                            </ul>
                            <div className="mt-3 pt-2 border-t border-slate-200 flex justify-between items-center font-medium text-slate-800 text-xs">
                              <span>Subtotal + Tax - Discount</span>
                              <span>₹{quote.total.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CREATE QUOTATION MODAL */}
      {showQuoteModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h2 className="text-xl font-bold text-slate-900">Generate Quotation</h2>
              <button onClick={() => setShowQuoteModal(false)} className="text-slate-400 hover:text-slate-700 p-2">✕</button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-4">
                <div className="flex font-semibold text-slate-500 text-xs uppercase tracking-wider pb-2 border-b border-slate-100">
                  <div className="w-1/3 pr-2">Product / Service</div>
                  <div className="w-1/6 px-2">Description</div>
                  <div className="w-1/12 px-2 text-center">Qty</div>
                  <div className="w-1/6 px-2 text-right">Unit Price (₹)</div>
                  <div className="w-1/12 px-2 text-center">Tax %</div>
                  <div className="w-1/6 pl-2 text-right">Total (₹)</div>
                  <div className="w-10"></div>
                </div>

                {quoteItems.map((item, index) => {
                  const lineTotal = (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0);
                  const lineTax = lineTotal * ((parseFloat(item.taxRate) || 0) / 100);
                  
                  return (
                    <div key={index} className="flex items-start group">
                      <div className="w-1/3 pr-2">
                        <select 
                          value={item.productId}
                          onChange={(e) => handleProductSelect(index, e.target.value)}
                          className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                        >
                          <option value="">Select a Product</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id}>{p.name} (₹{p.sellingPrice})</option>
                          ))}
                        </select>
                      </div>
                      <div className="w-1/6 px-2">
                        <input type="text" value={item.description} onChange={(e) => handleQuoteItemChange(index, 'description', e.target.value)} placeholder="Description" className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none" />
                      </div>
                      <div className="w-1/12 px-2">
                        <input type="number" min="1" step="0.1" value={item.quantity} onChange={(e) => handleQuoteItemChange(index, 'quantity', e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-center" />
                      </div>
                      <div className="w-1/6 px-2">
                        <input type="number" step="0.01" value={item.unitPrice} onChange={(e) => handleQuoteItemChange(index, 'unitPrice', e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-right" />
                      </div>
                      <div className="w-1/12 px-2">
                        <input type="number" step="0.1" value={item.taxRate} onChange={(e) => handleQuoteItemChange(index, 'taxRate', e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-center" />
                      </div>
                      <div className="w-1/6 pl-2 text-right py-2 text-sm font-medium text-slate-800">
                        ₹{(lineTotal + lineTax).toLocaleString()}
                      </div>
                      <div className="w-10 flex justify-end">
                        <button onClick={() => handleRemoveQuoteItem(index)} className="p-2 text-slate-300 hover:text-red-500 transition-colors" disabled={quoteItems.length === 1}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4">
                <button onClick={handleAddQuoteItem} className="text-sm font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1.5 px-3 py-2 hover:bg-emerald-50 rounded-lg transition-colors">
                  <Plus size={16} /> Add Line Item
                </button>
              </div>

              <div className="mt-8 border-t border-slate-100 pt-6 flex justify-end">
                <div className="w-1/3 space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Subtotal</span>
                    <span className="font-medium text-slate-800">₹{calculateQuoteTotals().subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Tax</span>
                    <span className="font-medium text-slate-800">₹{calculateQuoteTotals().taxTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-100">
                    <span className="text-slate-500 font-medium">Discount (₹)</span>
                    <input type="number" value={quoteDiscount} onChange={e => setQuoteDiscount(parseFloat(e.target.value) || 0)} className="w-32 px-3 py-1.5 text-sm rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-right" />
                  </div>
                  <div className="flex justify-between items-center text-lg font-bold text-emerald-700 pt-3 border-t border-emerald-100">
                    <span>Grand Total</span>
                    <span>₹{calculateQuoteTotals().grandTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 flex gap-3 shrink-0 bg-slate-50">
              <button onClick={() => setShowQuoteModal(false)} className="flex-1 py-3 text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl font-semibold transition-colors shadow-sm">
                Cancel
              </button>
              <button onClick={handleGenerateQuote} className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-md transition-colors flex items-center justify-center gap-2">
                <FileSpreadsheet size={18} /> Generate & Save Quotation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Convert Modal */}
      {showConvertModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-emerald-700">Convert Lead to Customer</h2>
              <button onClick={() => setShowConvertModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>
            <form onSubmit={handleConvertLead} className="p-5 space-y-4">
              <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 text-emerald-800 text-sm mb-4">
                This action will mark the lead as WON, create a new Customer profile, and start a new Project pipeline.
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Project Name</label>
                <input required type="text" value={convertData.projectName} onChange={e => setConvertData({projectName: e.target.value})} placeholder="e.g. 5kW Residential Installation" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowConvertModal(false)} className="flex-1 py-2.5 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl font-medium transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium shadow-sm transition-colors">Confirm Conversion</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Note & Followup modals kept simple here as well */}
      {showNoteModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-slate-900">Add Note</h2>
              <button onClick={() => setShowNoteModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>
            <form onSubmit={handleAddNote} className="p-5 space-y-4">
              <textarea 
                required
                rows={4}
                value={noteContent}
                onChange={e => setNoteContent(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm resize-none"
              />
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowNoteModal(false)} className="flex-1 py-2.5 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl font-medium transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium shadow-sm transition-colors">Save Note</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showFollowupModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-slate-900">Schedule Follow-up</h2>
              <button onClick={() => setShowFollowupModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>
            <form onSubmit={handleAddFollowup} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Scheduled Date & Time</label>
                <input required type="datetime-local" value={followupData.scheduledAt} onChange={e => setFollowupData({...followupData, scheduledAt: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowFollowupModal(false)} className="flex-1 py-2.5 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl font-medium transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium shadow-sm transition-colors">Schedule</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
