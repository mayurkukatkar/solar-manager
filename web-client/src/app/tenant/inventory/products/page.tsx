"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { 
  Plus, Search, List, Filter, Edit, Trash2, ArrowRight
} from 'lucide-react';

export default function ProductsList() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await axios.get(`\${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/inventory/products`, { withCredentials: true });
      setProducts(res.data.products);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || (p.sku && p.sku.toLowerCase().includes(search.toLowerCase())));

  if (loading) {
    return <div className="flex justify-center items-center h-64 text-slate-400">Loading products...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/tenant/inventory" className="text-slate-400 hover:text-emerald-600 transition-colors">Inventory</Link>
          <span className="text-slate-300">/</span>
          <h1 className="text-2xl font-bold text-slate-900">Product Catalog</h1>
        </div>
        <Link href="/tenant/inventory/products/new" className="px-4 py-2 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-sm shadow-emerald-200">
          <Plus size={16} /> New Product
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex gap-4">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by name or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-sm"
            />
          </div>
          <button className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2 hover:bg-slate-100 transition-colors text-slate-600 text-sm font-semibold">
            <Filter size={16} /> Filter
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-medium">
              <tr>
                <th className="p-4 rounded-tl-xl">Product</th>
                <th className="p-4">SKU</th>
                <th className="p-4">Category</th>
                <th className="p-4 text-right">Physical Qty</th>
                <th className="p-4 text-right">Available Qty</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-right rounded-tr-xl">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-slate-400">No products found.</td></tr>
              ) : (
                filtered.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="p-4 font-medium text-slate-900">{p.name}</td>
                    <td className="p-4 font-mono text-xs">{p.sku || 'N/A'}</td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold">
                        {p.category}
                      </span>
                    </td>
                    <td className="p-4 text-right font-bold">{p.totalPhysical} {p.unit}</td>
                    <td className="p-4 text-right font-bold text-emerald-600">{p.totalAvailable} {p.unit}</td>
                    <td className="p-4 text-center">
                      <span className={"px-2.5 py-1 rounded-lg text-xs font-bold " + (
                        p.status === 'Healthy' ? 'bg-emerald-50 text-emerald-600' :
                        p.status === 'Low Stock' ? 'bg-amber-50 text-amber-600' :
                        'bg-red-50 text-red-600'
                      )}>
                        {p.status}
                      </span>
                    </td>
                    <td className="p-4 flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit size={16} /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
