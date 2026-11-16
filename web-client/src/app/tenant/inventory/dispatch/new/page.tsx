"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { 
  Truck, Search, ArrowLeft, Package, Boxes, Check, AlertCircle, Plus, Trash2, 
  Barcode, CheckCircle2, X, ShieldCheck
} from 'lucide-react';

/**
 * 2D Barcode Parser and DCR Domestic Content Validator (Matching Mobile App logic)
 */
function parseAndValidateSerial(raw: string): { serial: string; dcrCompliant: boolean } {
  const trimmed = raw.trim().toUpperCase();
  const dcrPatterns = [
    /DCR/i,
    /ALMM/i,
    /DOMESTIC/i,
    /^WAA[\-_]?DCR/i,
    /^ADANI[\-_]?DCR/i,
    /^TATA[\-_]?DCR/i,
    /^VIKRAM[\-_]?DCR/i,
    /^GOLDI[\-_]?DCR/i,
    /^PREMIER[\-_]?DCR/i,
    /^RAYZON[\-_]?DCR/i,
    /^IND[\-_]/i,
  ];
  const dcrCompliant = dcrPatterns.some(p => p.test(trimmed));
  return { serial: trimmed, dcrCompliant };
}

export default function NewMaterialDispatch() {
  const router = useRouter();
  const [projects, setProjects] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [projectId, setProjectId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [notes, setNotes] = useState('');
  
  // Picked Items
  const [items, setItems] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState('1');

  // Serial Entry Modal State
  const [activeItemIndex, setActiveItemIndex] = useState<number | null>(null);
  const [tempSerial, setTempSerial] = useState('');
  const [serialError, setSerialError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [projRes, wareRes, prodRes] = await Promise.all([
        axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/projects`, { withCredentials: true }),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/inventory/warehouses`, { withCredentials: true }),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/inventory/products`, { withCredentials: true })
      ]);
      setProjects(projRes.data.projects || []);
      setWarehouses(wareRes.data.warehouses || []);
      setProducts(prodRes.data.products || []);
    } catch (err) {
      console.error(err);
      setError('Failed to load required data.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    if (!selectedProduct) return;
    const prod = products.find(p => p.id === selectedProduct);
    if (!prod) return;
    
    const existingIndex = items.findIndex(i => i.productId === selectedProduct);
    if (existingIndex > -1) {
      const updated = [...items];
      updated[existingIndex].quantity = (parseFloat(updated[existingIndex].quantity) + parseFloat(quantity)).toString();
      setItems(updated);
    } else {
      setItems([...items, {
        productId: prod.id,
        name: prod.name,
        sku: prod.sku,
        isSerialized: Boolean(prod.isSerialized),
        quantity: quantity,
        serialNumbers: []
      }]);
    }
    
    setSelectedProduct('');
    setQuantity('1');
  };

  const handleRemoveItem = (idx: number) => {
    const updated = [...items];
    updated.splice(idx, 1);
    setItems(updated);
  };

  const handleAddSerialToItem = () => {
    setSerialError('');
    if (!tempSerial.trim() || activeItemIndex === null) return;
    const { serial } = parseAndValidateSerial(tempSerial);
    
    const item = items[activeItemIndex];
    if (item.serialNumbers && item.serialNumbers.includes(serial)) {
      setSerialError('Serial number already recorded in this dispatch batch');
      return;
    }

    const updated = [...items];
    const currentSerials = updated[activeItemIndex].serialNumbers || [];
    updated[activeItemIndex].serialNumbers = [...currentSerials, serial];
    setItems(updated);
    setTempSerial('');
  };

  const handleRemoveSerial = (itemIdx: number, serialIdx: number) => {
    const updated = [...items];
    updated[itemIdx].serialNumbers.splice(serialIdx, 1);
    setItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!projectId || !warehouseId || items.length === 0) {
      setError('Please select a project, warehouse, and add at least one item.');
      return;
    }

    setSubmitting(true);
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/inventory/dispatch`, {
        projectId,
        warehouseId,
        receiverName,
        notes,
        items
      }, { withCredentials: true });
      
      router.push('/tenant/inventory/ledger');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to dispatch materials. Please check stock availability.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64 text-slate-400">Loading dispatch wizard...</div>;
  }

  const activeItem = activeItemIndex !== null ? items[activeItemIndex] : null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-3">
        <Link href="/tenant/inventory" className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-500">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">New Material Dispatch</h1>
          <p className="text-sm text-slate-500">Dispatch stock to a project installation site with 2D serial tracking.</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3 text-sm font-semibold border border-red-100">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
          <h2 className="font-bold text-slate-800 border-b border-slate-100 pb-2">Dispatch Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Select Project <span className="text-red-500">*</span></label>
              <select 
                value={projectId} 
                onChange={e => setProjectId(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-sm"
                required
              >
                <option value="">-- Choose a project --</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.projectNumber || 'PRJ'} - {p.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Source Warehouse <span className="text-red-500">*</span></label>
              <select 
                value={warehouseId} 
                onChange={e => setWarehouseId(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-sm"
                required
              >
                <option value="">-- Choose warehouse --</option>
                {warehouses.map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Receiver Name</label>
              <input 
                type="text" 
                value={receiverName}
                onChange={e => setReceiverName(e.target.value)}
                placeholder="e.g. Lead Technician Ramesh"
                className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-sm"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Notes / Vehicle No</label>
              <input 
                type="text" 
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="e.g. MH-12-AB-1234 (Tata Ace)"
                className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-sm"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
          <h2 className="font-bold text-slate-800 border-b border-slate-100 pb-2 flex justify-between items-center">
            Items to Dispatch
            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">{items.length} items</span>
          </h2>
          
          <div className="flex gap-4 items-end bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="flex-1 space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Product</label>
              <select 
                value={selectedProduct} 
                onChange={e => setSelectedProduct(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-sm"
              >
                <option value="">-- Select Product --</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.sku ? '[' + p.sku + '] ' : ''}{p.name} (Avail: {p.totalAvailable})</option>
                ))}
              </select>
            </div>
            <div className="w-24 space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Qty</label>
              <input 
                type="number"
                min="0.1"
                step="0.1"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-sm text-center"
              />
            </div>
            <button 
              type="button"
              onClick={handleAddItem}
              disabled={!selectedProduct}
              className="p-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Plus size={18} />
            </button>
          </div>
          
          {items.length > 0 && (
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 font-medium">
                  <tr>
                    <th className="p-4">Product</th>
                    <th className="p-4 text-right">Quantity</th>
                    <th className="p-4 text-center">Type / Serials</th>
                    <th className="p-4 w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-4 font-medium text-slate-900">
                        {item.name}
                        {item.sku && <span className="block text-xs font-mono text-slate-500">{item.sku}</span>}
                      </td>
                      <td className="p-4 text-right font-bold">{item.quantity}</td>
                      <td className="p-4 text-center">
                        {item.isSerialized ? (
                          <button 
                            type="button"
                            onClick={() => {
                              setActiveItemIndex(idx);
                              setTempSerial('');
                              setSerialError('');
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors"
                          >
                            <Barcode size={13} />
                            {item.serialNumbers?.length || 0} / {item.quantity} Serials
                          </button>
                        ) : (
                          <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded">BULK</span>
                        )}
                      </td>
                      <td className="p-4">
                        <button 
                          type="button" 
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-200">
          <button 
            type="submit" 
            disabled={submitting || items.length === 0}
            className="px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
          >
            {submitting ? 'Dispatching...' : 'Dispatch Material'} <Check size={18} />
          </button>
        </div>
      </form>

      {/* SERIAL NUMBER RECORDING MODAL */}
      {activeItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 max-w-lg w-full space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Record Serial Numbers</h3>
                <p className="text-xs text-slate-500">{activeItem.name} ({activeItem.serialNumbers?.length || 0}/{activeItem.quantity} recorded)</p>
              </div>
              <button onClick={() => setActiveItemIndex(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            {serialError && (
              <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-semibold">
                {serialError}
              </div>
            )}

            <div className="flex gap-2">
              <input 
                type="text" 
                value={tempSerial}
                onChange={e => setTempSerial(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSerialToItem();
                  }
                }}
                placeholder="Enter or scan serial (e.g. WAA-DCR-550-001)"
                className="flex-1 p-2.5 rounded-xl border border-slate-200 font-mono text-sm uppercase"
              />
              <button 
                type="button"
                onClick={handleAddSerialToItem}
                disabled={!tempSerial.trim()}
                className="px-4 py-2.5 bg-indigo-600 text-white font-bold rounded-xl text-sm hover:bg-indigo-700 disabled:opacity-50"
              >
                Add
              </button>
            </div>

            {/* LIST OF RECORDED SERIALS */}
            <div className="max-h-60 overflow-y-auto space-y-2 border border-slate-100 p-2 rounded-xl bg-slate-50">
              {activeItem.serialNumbers && activeItem.serialNumbers.length > 0 ? (
                activeItem.serialNumbers.map((s: string, sIdx: number) => {
                  const { dcrCompliant } = parseAndValidateSerial(s);
                  return (
                    <div key={sIdx} className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-slate-200 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-400">#{sIdx + 1}</span>
                        <span className="font-mono font-bold text-slate-800">{s}</span>
                        {dcrCompliant && (
                          <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 font-extrabold text-[9px] rounded">
                            ✓ DCR
                          </span>
                        )}
                      </div>
                      <button 
                        type="button"
                        onClick={() => handleRemoveSerial(activeItemIndex!, sIdx)}
                        className="text-slate-400 hover:text-red-600 p-1"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-xs text-slate-400 py-4">No serial numbers entered for this item.</p>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button 
                type="button"
                onClick={() => setActiveItemIndex(null)}
                className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl text-sm"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
