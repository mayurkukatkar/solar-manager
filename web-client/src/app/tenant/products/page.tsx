"use client";
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Search, Filter, Package, AlertCircle, Edit } from 'lucide-react';

export default function ProductsList() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '', category: '', sku: '', brand: '', unit: 'NOS', purchaseCost: '', sellingPrice: '', taxRate: '', minStock: '', currentStock: ''
  });
  const [errorMsg, setErrorMsg] = useState('');

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`\${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/products`, { withCredentials: true });
      setProducts(res.data.products);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleCreateProduct = async (e: any) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      await axios.post(`\${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/products`, {
        ...formData,
        purchaseCost: parseFloat(formData.purchaseCost) || 0,
        sellingPrice: parseFloat(formData.sellingPrice) || 0,
        taxRate: parseFloat(formData.taxRate) || 0,
        minStock: parseInt(formData.minStock) || 0,
        currentStock: parseInt(formData.currentStock) || 0
      }, { withCredentials: true });
      setShowModal(false);
      setFormData({ name: '', category: '', sku: '', brand: '', unit: 'NOS', purchaseCost: '', sellingPrice: '', taxRate: '', minStock: '', currentStock: '' });
      fetchProducts();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to create product.');
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()));
    const matchesCat = categoryFilter ? p.category === categoryFilter : true;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Product Catalog</h1>
          <p className="text-sm text-slate-500 mt-1">Manage your inventory, pricing, and stock levels.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2 shadow-sm"
        >
          <Plus size={18} /> Add Product
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center gap-4 bg-slate-50/50">
           <div className="relative flex-1 min-w-[280px]">
             <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
             <input 
               type="text" 
               placeholder="Search by name or SKU..." 
               value={search}
               onChange={(e) => setSearch(e.target.value)}
               className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm transition-all bg-white"
             />
           </div>
           
           <div className="flex gap-2">
             <select 
               value={categoryFilter} 
               onChange={e => setCategoryFilter(e.target.value)}
               className="px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm bg-white text-slate-700"
             >
               <option value="">All Categories</option>
               <option value="Solar Panels">Solar Panels</option>
               <option value="Inverters">Inverters</option>
               <option value="Batteries">Batteries</option>
               <option value="Cables">Cables</option>
               <option value="Structures">Structures</option>
               <option value="Services">Services</option>
               <option value="Other">Other</option>
             </select>
           </div>
        </div>

        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-xs font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Product Name</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4 text-right">Selling Price</th>
                <th className="px-6 py-4 text-center">Tax %</th>
                <th className="px-6 py-4 text-center">In Stock</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-slate-500">
                    No products found. Add a product to get started!
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                          <Package size={18} />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{product.name}</p>
                          <p className="text-xs text-slate-500">SKU: {product.sku || 'N/A'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <span className="px-2.5 py-1 bg-slate-100 rounded-lg text-xs font-medium">{product.category}</span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-slate-900">
                      ₹{product.sellingPrice?.toLocaleString()} /{product.unit}
                    </td>
                    <td className="px-6 py-4 text-center text-slate-600">
                      {product.taxRate}%
                    </td>
                    <td className="px-6 py-4 text-center">
                       <span className={`font-semibold ${product.currentStock <= product.minStock ? 'text-red-600' : 'text-emerald-600'}`}>
                         {product.currentStock}
                       </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 text-slate-400 hover:text-emerald-600 transition-colors">
                        <Edit size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Add New Product</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700 p-2">✕</button>
            </div>
            
            <form onSubmit={handleCreateProduct} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-100 flex items-center gap-2">
                  <AlertCircle size={16} /> {errorMsg}
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Product Name *</label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Category *</label>
                  <select required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none bg-white">
                    <option value="">Select Category</option>
                    <option value="Solar Panels">Solar Panels</option>
                    <option value="Inverters">Inverters</option>
                    <option value="Batteries">Batteries</option>
                    <option value="Cables">Cables</option>
                    <option value="Structures">Structures</option>
                    <option value="Services">Services</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">SKU</label>
                  <input type="text" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Brand</label>
                  <input type="text" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Unit</label>
                  <input type="text" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} placeholder="NOS, MTR, KG" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Purchase Cost</label>
                  <input type="number" step="0.01" value={formData.purchaseCost} onChange={e => setFormData({...formData, purchaseCost: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Selling Price *</label>
                  <input required type="number" step="0.01" value={formData.sellingPrice} onChange={e => setFormData({...formData, sellingPrice: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Tax Rate (%)</label>
                  <input type="number" step="0.1" value={formData.taxRate} onChange={e => setFormData({...formData, taxRate: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Current Stock</label>
                  <input type="number" value={formData.currentStock} onChange={e => setFormData({...formData, currentStock: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Min Alert Stock</label>
                  <input type="number" value={formData.minStock} onChange={e => setFormData({...formData, minStock: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl font-semibold transition-colors">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-md transition-colors">
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
