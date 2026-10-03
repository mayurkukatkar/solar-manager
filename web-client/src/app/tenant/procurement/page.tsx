"use client";
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Truck, Plus, Package, Search, Calendar, FileText } from 'lucide-react';

export default function Procurement() {
  const [procurement, setProcurement] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [inventory, setInventory] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    supplier: '', productId: '', qty: 0, status: 'ORDERED'
  });

  const fetchData = async () => {
    try {
      const [poRes, invRes] = await Promise.all([
         axios.get(`\${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/procurement`, { withCredentials: true }),
         axios.get(`\${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/inventory`, { withCredentials: true })
      ]);
      setProcurement(poRes.data.procurement);
      setInventory(invRes.data.inventory);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`\${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/procurement`, {
        ...formData, 
        qty: Number(formData.qty)
      }, { withCredentials: true });
      setShowModal(false);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to create Purchase Order');
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'ORDERED': return 'bg-blue-50 text-blue-700';
      case 'SHIPPED': return 'bg-amber-50 text-amber-700';
      case 'RECEIVED': return 'bg-emerald-50 text-emerald-700';
      default: return 'bg-slate-50 text-slate-700';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Procurement</h1>
          <p className="text-sm text-slate-500 mt-1">Manage purchase orders and supplier deliveries.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-full font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-sm"
        >
          <Plus size={18} /> New PO
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex gap-4 bg-slate-50/50">
           <div className="relative flex-1 max-w-md">
             <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
             <input type="text" placeholder="Search PO number or supplier..." className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-emerald-500 transition-colors" />
           </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-xs font-bold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">PO Number</th>
                <th className="px-6 py-4">Supplier</th>
                <th className="px-6 py-4">Item Ordered</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                  </td>
                </tr>
              ) : procurement.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 font-medium">
                    No Purchase Orders found.
                  </td>
                </tr>
              ) : (
                procurement.map((po) => (
                  <tr key={po.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 font-bold text-slate-900">
                        <FileText size={16} className="text-slate-400" /> {po.id}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-700">
                      {po.vendor}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{po.items?.[0]?.product?.name || 'Unknown Item'}</div>
                      <div className="text-xs font-bold text-slate-500">Qty: {po.items?.[0]?.quantity || 0}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                        <Calendar size={14} className="text-slate-400" /> {new Date(po.date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${getStatusColor(po.status)}`}>
                        {po.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* NEW PO MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Create Purchase Order</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700 p-2">✕</button>
            </div>
            
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-extrabold text-slate-600 uppercase tracking-wider">Supplier Name *</label>
                <input required type="text" value={formData.supplier} onChange={e => setFormData({...formData, supplier: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium text-slate-700" placeholder="e.g. Luminous India" />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-extrabold text-slate-600 uppercase tracking-wider">Item Needed *</label>
                <select required value={formData.productId} onChange={e => setFormData({...formData, productId: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all bg-white font-medium text-slate-700">
                  <option value="">Select an Item</option>
                  {inventory.map(inv => (
                     <option key={inv.id} value={inv.id}>{inv.name} (Stock: {inv.stock || inv.currentStock})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-600 uppercase tracking-wider">Quantity</label>
                  <input type="number" required value={formData.qty} onChange={e => setFormData({...formData, qty: Number(e.target.value)})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium text-slate-700" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-600 uppercase tracking-wider">Initial Status</label>
                  <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all bg-white font-medium text-slate-700">
                    <option value="ORDERED">Ordered</option>
                    <option value="SHIPPED">Shipped</option>
                    <option value="RECEIVED">Received</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold transition-colors">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md transition-colors">
                  Create PO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
