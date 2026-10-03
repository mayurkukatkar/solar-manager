"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { 
  Boxes, Plus, MapPin, Package
} from 'lucide-react';

export default function WarehousesList() {
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const fetchWarehouses = async () => {
    try {
      const res = await axios.get(`\${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/inventory/warehouses`, { withCredentials: true });
      setWarehouses(res.data.warehouses);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64 text-slate-400">Loading warehouses...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/tenant/inventory" className="text-slate-400 hover:text-emerald-600 transition-colors">Inventory</Link>
          <span className="text-slate-300">/</span>
          <h1 className="text-2xl font-bold text-slate-900">Warehouses</h1>
        </div>
        <button className="px-4 py-2 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-sm shadow-emerald-200">
          <Plus size={16} /> Add Location
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {warehouses.length === 0 ? (
          <div className="col-span-full p-8 text-center bg-white rounded-2xl border border-slate-200">
            <Boxes size={48} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500">No warehouses configured yet.</p>
          </div>
        ) : (
          warehouses.map(w => {
            const totalItems = w.balances?.reduce((sum: number, b: any) => sum + b.quantity, 0) || 0;
            return (
              <div key={w.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-indigo-300 transition-colors group">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <Boxes size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg">{w.name}</h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <MapPin size={12} /> {w.location || 'Location not specified'}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-600 font-medium text-sm">
                    <Package size={16} className="text-slate-400" />
                    <span>{totalItems} items in stock</span>
                  </div>
                  <button className="text-indigo-600 text-sm font-semibold hover:underline">
                    View Stock
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  );
}
