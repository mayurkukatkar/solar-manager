"use client";
import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Truck, Plus, Package, Search, Calendar, FileText, CheckCircle2, 
  Clock, IndianRupee, ArrowUpRight, AlertCircle, RefreshCw, X, ChevronRight, Check
} from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface POItem {
  id?: string;
  productId: string;
  product?: { name: string; sku?: string; unit?: string };
  quantity: number;
  unitCost: number;
  totalCost: number;
}

interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplier: string;
  status: 'ORDERED' | 'SHIPPED' | 'RECEIVED' | 'CANCELLED';
  totalCost: number;
  createdAt: string;
  project?: { id: string; name: string };
  items: POItem[];
  itemSummary?: string;
}

export default function ProcurementPage() {
  const [procurement, setProcurement] = useState<PurchaseOrder[]>([]);
  const [metrics, setMetrics] = useState({ totalOrders: 0, activeOrders: 0, receivedValue: 0, pendingOrders: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    supplier: '',
    productId: '',
    qty: 1,
    unitCost: 0
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (search) params.search = search;

      const [poRes, prodRes] = await Promise.all([
        axios.get(`${API}/api/tenant/procurement`, { params, withCredentials: true }),
        axios.get(`${API}/api/tenant/products`, { withCredentials: true }).catch(() => ({ data: { products: [] } }))
      ]);

      setProcurement(poRes.data.procurement || []);
      if (poRes.data.metrics) setMetrics(poRes.data.metrics);
      setProducts(prodRes.data.products || []);
    } catch (err) {
      console.error('Error fetching procurement data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const handleProductSelect = (prodId: string) => {
    const selected = products.find(p => p.id === prodId);
    setFormData(prev => ({
      ...prev,
      productId: prodId,
      unitCost: selected?.purchaseCost || 0
    }));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.supplier.trim() || !formData.productId) {
      alert('Please fill supplier name and select a product');
      return;
    }

    try {
      setSubmitting(true);
      await axios.post(`${API}/api/tenant/procurement`, {
        supplier: formData.supplier,
        productId: formData.productId,
        qty: Number(formData.qty) || 1,
        unitCost: Number(formData.unitCost) || 0
      }, { withCredentials: true });

      setShowModal(false);
      setFormData({ supplier: '', productId: '', qty: 1, unitCost: 0 });
      fetchData();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to create Purchase Order');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (poId: string, newStatus: string) => {
    const confirmMsg = newStatus === 'RECEIVED'
      ? 'Mark this PO as RECEIVED? Items will automatically be added to your warehouse stock inventory.'
      : `Update PO status to ${newStatus}?`;

    if (!confirm(confirmMsg)) return;

    try {
      await axios.patch(`${API}/api/tenant/procurement/${poId}/status`, { status: newStatus }, { withCredentials: true });
      fetchData();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to update status');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ORDERED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">ORDERED</span>;
      case 'SHIPPED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">SHIPPED</span>;
      case 'RECEIVED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">RECEIVED</span>;
      case 'CANCELLED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">CANCELLED</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-50 text-slate-700">{status}</span>;
    }
  };

  const calculatedTotal = (Number(formData.qty) || 0) * (Number(formData.unitCost) || 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Procurement & POs</h1>
          <p className="text-sm text-slate-500 mt-1">Manage hardware supplier orders, dispatch tracking & stock inwarding.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchData} 
            className="p-2.5 text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            title="Refresh"
          >
            <RefreshCw size={16} />
          </button>
          <button 
            onClick={() => setShowModal(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <Plus size={18} /> New Purchase Order
          </button>
        </div>
      </div>

      {/* METRICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Orders</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">{metrics.totalOrders}</p>
          <p className="text-xs text-slate-400 mt-1">All supplier POs issued</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active In-Transit</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Truck size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold text-amber-600">{metrics.activeOrders}</p>
          <p className="text-xs text-slate-400 mt-1">Ordered or currently shipped</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Received Value</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <IndianRupee size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-600">₹{metrics.receivedValue.toLocaleString('en-IN')}</p>
          <p className="text-xs text-slate-400 mt-1">Inwarded into inventory</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Delivery</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Clock size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold text-purple-600">{metrics.pendingOrders}</p>
          <p className="text-xs text-slate-400 mt-1">Awaiting dispatch confirmation</p>
        </div>
      </div>

      {/* FILTER TABS & SEARCH */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
            {['ALL', 'ORDERED', 'SHIPPED', 'RECEIVED', 'CANCELLED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  statusFilter === st 
                    ? 'bg-emerald-600 text-white shadow-sm' 
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-80">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search PO# or supplier..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchData()}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-emerald-500 transition-colors" 
            />
          </div>
        </div>

        {/* PO TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-xs font-bold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">PO Number</th>
                <th className="px-6 py-4">Supplier</th>
                <th className="px-6 py-4">Hardware Items</th>
                <th className="px-6 py-4">PO Amount</th>
                <th className="px-6 py-4">Order Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                  </td>
                </tr>
              ) : procurement.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500 font-medium">
                    No Purchase Orders found for this filter.
                  </td>
                </tr>
              ) : (
                procurement.map((po) => (
                  <tr key={po.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 font-bold text-slate-900">
                        <FileText size={16} className="text-emerald-600" /> {po.poNumber}
                      </div>
                      {po.project && (
                        <div className="text-xs text-slate-400 mt-0.5">Project: {po.project.name}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-700">
                      {po.supplier}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900 max-w-xs truncate">
                        {po.itemSummary || po.items?.[0]?.product?.name || 'Solar Hardware'}
                      </div>
                      <div className="text-xs text-slate-500">
                        {po.items?.length || 1} line item(s)
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900">
                      ₹{po.totalCost?.toLocaleString('en-IN') || 0}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <div className="flex items-center gap-1.5 font-medium">
                        <Calendar size={14} className="text-slate-400" />
                        {new Date(po.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(po.status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {po.status === 'ORDERED' && (
                          <button
                            onClick={() => handleUpdateStatus(po.id, 'SHIPPED')}
                            className="px-2.5 py-1 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 transition-colors"
                          >
                            Mark Shipped
                          </button>
                        )}
                        {(po.status === 'ORDERED' || po.status === 'SHIPPED') && (
                          <button
                            onClick={() => handleUpdateStatus(po.id, 'RECEIVED')}
                            className="px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors flex items-center gap-1"
                          >
                            <Check size={12} /> Receive & Restock
                          </button>
                        )}
                        {po.status !== 'RECEIVED' && po.status !== 'CANCELLED' && (
                          <button
                            onClick={() => handleUpdateStatus(po.id, 'CANCELLED')}
                            className="px-2 py-1 text-xs text-slate-400 hover:text-rose-600 transition-colors"
                          >
                            Cancel
                          </button>
                        )}
                        {po.status === 'RECEIVED' && (
                          <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                            <CheckCircle2 size={14} /> Stock Inwarded
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE PURCHASE ORDER MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">New Purchase Order</h2>
                <p className="text-xs text-slate-500 mt-0.5">Order PV modules, inverters, or mounting structures</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700 p-2">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Supplier / Manufacturer *</label>
                <input 
                  required 
                  type="text" 
                  value={formData.supplier} 
                  onChange={e => setFormData({...formData, supplier: e.target.value})} 
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium text-slate-800" 
                  placeholder="e.g. Waaree Solar / Growatt India" 
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Hardware Product *</label>
                <select 
                  required 
                  value={formData.productId} 
                  onChange={e => handleProductSelect(e.target.value)} 
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all bg-white font-medium text-slate-800"
                >
                  <option value="">Select Hardware Item</option>
                  {products.map(prod => (
                    <option key={prod.id} value={prod.id}>
                      {prod.name} ({prod.brand || 'Tier-1'}) - Stock: {prod.currentStock || 0} {prod.unit || 'Nos'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Order Quantity</label>
                  <input 
                    type="number" 
                    required 
                    min="1"
                    value={formData.qty} 
                    onChange={e => setFormData({...formData, qty: Math.max(1, parseInt(e.target.value) || 1)})} 
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium text-slate-800" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Unit Cost (₹)</label>
                  <input 
                    type="number" 
                    required 
                    min="0"
                    value={formData.unitCost} 
                    onChange={e => setFormData({...formData, unitCost: parseFloat(e.target.value) || 0})} 
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium text-slate-800" 
                  />
                </div>
              </div>

              {/* ESTIMATED TOTAL BOX */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Total Purchase Value</span>
                  <p className="text-xl font-extrabold text-emerald-900 mt-0.5">₹{calculatedTotal.toLocaleString('en-IN')}</p>
                </div>
                <span className="text-xs font-medium text-emerald-700 bg-white px-2.5 py-1 rounded-full border border-emerald-200">
                  {formData.qty} units
                </span>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="flex-1 py-3 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? 'Creating...' : 'Issue PO'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
