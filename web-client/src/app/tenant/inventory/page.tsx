"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { 
  Package, Boxes, AlertTriangle, AlertOctagon, List, FileBox, Truck, ArrowRight, Activity, Plus
} from 'lucide-react';

export default function InventoryDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await axios.get(`\${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/inventory/dashboard`, { withCredentials: true });
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64 text-slate-400">Loading inventory data...</div>;
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inventory Dashboard</h1>
          <p className="text-slate-500 mt-1">Monitor real-time stock levels and movements</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/tenant/inventory/dispatch/new" className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-2">
            <Truck size={16} /> New Dispatch
          </Link>
          <Link href="/tenant/inventory/products/new" className="px-4 py-2 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors flex items-center gap-2">
            <Plus size={16} /> Add Product
          </Link>
        </div>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-start justify-between group hover:border-blue-200 transition-colors">
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Total Products</p>
            <h3 className="text-3xl font-bold text-slate-900">{data?.totalProducts || 0}</h3>
            <Link href="/tenant/inventory/products" className="text-xs font-medium text-blue-600 mt-2 flex items-center gap-1 hover:underline">
              View Catalog <ArrowRight size={12} />
            </Link>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
            <List size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-start justify-between group hover:border-emerald-200 transition-colors">
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Stock Value</p>
            <h3 className="text-3xl font-bold text-slate-900">₹{((data?.totalStockValue || 0) / 100000).toFixed(2)}L</h3>
            <p className="text-xs font-medium text-emerald-600 mt-2 flex items-center gap-1">
              <Activity size={12} /> Estimated Cost
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
            <Boxes size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-start justify-between group hover:border-amber-200 transition-colors">
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Reserved Stock</p>
            <h3 className="text-3xl font-bold text-slate-900">{data?.reserved || 0}</h3>
            <p className="text-xs font-medium text-amber-600 mt-2 flex items-center gap-1">
              <Package size={12} /> Across all projects
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-amber-50 group-hover:text-amber-600 transition-colors">
            <FileBox size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Alerts</p>
              <div className="flex gap-4 mt-2">
                <div>
                  <h3 className="text-2xl font-bold text-amber-600">{data?.lowStock || 0}</h3>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Low</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-red-600">{data?.outOfStock || 0}</h3>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Empty</span>
                </div>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
              <AlertOctagon size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* SUB MENUS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/tenant/inventory/products" className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all group">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <List size={20} />
          </div>
          <h3 className="font-bold text-slate-800 text-lg">Product Catalog</h3>
          <p className="text-sm text-slate-500 mt-1">Manage SKUs, categories, and reorder levels.</p>
        </Link>
        
        <Link href="/tenant/inventory/warehouses" className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all group">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Boxes size={20} />
          </div>
          <h3 className="font-bold text-slate-800 text-lg">Warehouses</h3>
          <p className="text-sm text-slate-500 mt-1">Manage physical locations and stock balances.</p>
        </Link>

        <Link href="/tenant/inventory/ledger" className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all group">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Activity size={20} />
          </div>
          <h3 className="font-bold text-slate-800 text-lg">Stock Ledger</h3>
          <p className="text-sm text-slate-500 mt-1">Immutable audit trail of all inventory movements.</p>
        </Link>
      </div>
    </div>
  );
}
