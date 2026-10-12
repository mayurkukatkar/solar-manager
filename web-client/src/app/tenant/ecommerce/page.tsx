"use client";
import { useState } from "react";
import { 
  ShoppingCart, Package, Plus, Search, Filter, IndianRupee, 
  Truck, CheckCircle2, AlertTriangle, Eye, Edit3, Trash2, 
  ArrowUpRight, Tag, ShieldCheck, Zap, Sparkles, X, ChevronRight
} from "lucide-react";

interface ProductItem {
  id: string;
  name: string;
  category: "PANELS" | "INVERTERS" | "BATTERIES" | "CLEANING" | "AMC";
  sku: string;
  price: number;
  mrp: number;
  stock: number;
  warranty: string;
  rating: number;
  featured: boolean;
}

interface OrderItem {
  id: string;
  customerName: string;
  customerPhone: string;
  items: string;
  total: number;
  paymentMode: "UPI" | "NETBANKING" | "COD";
  paymentStatus: "PAID" | "PENDING";
  fulfillmentStatus: "PROCESSING" | "DISPATCHED" | "DELIVERED";
  date: string;
}

const INITIAL_PRODUCTS: ProductItem[] = [
  {
    id: "PROD-101",
    name: "550W Monocrystalline Half-Cut Bifacial Solar Panel",
    category: "PANELS",
    sku: "PAN-550-BIF",
    price: 13200,
    mrp: 16500,
    stock: 48,
    warranty: "25 Years",
    rating: 4.9,
    featured: true
  },
  {
    id: "PROD-102",
    name: "5kW Single-Phase Dual MPPT On-Grid Inverter with Wi-Fi",
    category: "INVERTERS",
    sku: "INV-5KW-WIFI",
    price: 42000,
    mrp: 49500,
    stock: 14,
    warranty: "10 Years",
    rating: 4.8,
    featured: true
  },
  {
    id: "PROD-103",
    name: "5.12 kWh LiFePO4 Lithium Solar Battery Storage (48V 100Ah)",
    category: "BATTERIES",
    sku: "BAT-LFP-512",
    price: 98000,
    mrp: 115000,
    stock: 6,
    warranty: "7 Years",
    rating: 4.9,
    featured: true
  },
  {
    id: "PROD-104",
    name: "High-Pressure Telescopic Solar Panel Cleaning Sprinkler Kit",
    category: "CLEANING",
    sku: "CLN-SPR-KIT",
    price: 4800,
    mrp: 6500,
    stock: 32,
    warranty: "1 Year",
    rating: 4.7,
    featured: false
  },
  {
    id: "PROD-105",
    name: "Annual Solar Maintenance & Cleaning Comprehensive Pass (4 Visits)",
    category: "AMC",
    sku: "AMC-PASS-ANN",
    price: 6500,
    mrp: 8500,
    stock: 99,
    warranty: "1 Year AMC",
    rating: 5.0,
    featured: true
  },
  {
    id: "PROD-106",
    name: "Copper Bonded Chemical Earthing Rod & Lightning Surge Arrestor",
    category: "CLEANING",
    sku: "EAR-CHM-ROD",
    price: 3200,
    mrp: 4200,
    stock: 28,
    warranty: "5 Years",
    rating: 4.6,
    featured: false
  }
];

const INITIAL_ORDERS: OrderItem[] = [
  {
    id: "ORD-9421",
    customerName: "Rakesh Singhal",
    customerPhone: "+91 98112 34567",
    items: "1x Cleaning Sprinkler Kit, 1x AMC Pass",
    total: 11300,
    paymentMode: "UPI",
    paymentStatus: "PAID",
    fulfillmentStatus: "DELIVERED",
    date: "Today, 10:30 AM"
  },
  {
    id: "ORD-9420",
    customerName: "Venkatesh Rao",
    customerPhone: "+91 94451 88990",
    items: "2x 550W Bifacial Panels (Expansion)",
    total: 26400,
    paymentMode: "NETBANKING",
    paymentStatus: "PAID",
    fulfillmentStatus: "DISPATCHED",
    date: "Yesterday"
  },
  {
    id: "ORD-9419",
    customerName: "Amit Joshi",
    customerPhone: "+91 97234 11223",
    items: "1x 5.12 kWh LiFePO4 Battery",
    total: 98000,
    paymentMode: "UPI",
    paymentStatus: "PAID",
    fulfillmentStatus: "PROCESSING",
    date: "2 days ago"
  }
];

export default function EcommercePage() {
  const [activeTab, setActiveTab] = useState<"PRODUCTS" | "ORDERS">("PRODUCTS");
  const [products, setProducts] = useState<ProductItem[]>(INITIAL_PRODUCTS);
  const [orders, setOrders] = useState<OrderItem[]>(INITIAL_ORDERS);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [toast, setToast] = useState("");

  // New product form
  const [form, setForm] = useState({
    name: "",
    category: "PANELS" as any,
    sku: "",
    price: "",
    mrp: "",
    stock: "",
    warranty: "5 Years"
  });

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const newProduct: ProductItem = {
      id: `PROD-${Math.floor(107 + Math.random() * 50)}`,
      name: form.name,
      category: form.category,
      sku: form.sku || `SKU-${Date.now().toString().slice(-4)}`,
      price: parseFloat(form.price) || 0,
      mrp: parseFloat(form.mrp) || (parseFloat(form.price) * 1.25),
      stock: parseInt(form.stock) || 1,
      warranty: form.warranty,
      rating: 5.0,
      featured: false
    };
    setProducts([newProduct, ...products]);
    setShowAddModal(false);
    setToast(`Product "${form.name}" added to customer store!`);
    setTimeout(() => setToast(""), 3500);
    setForm({
      name: "",
      category: "PANELS",
      sku: "",
      price: "",
      mrp: "",
      stock: "",
      warranty: "5 Years"
    });
  };

  const handleUpdateFulfillment = (orderId: string, nextStatus: any) => {
    setOrders(orders.map(o => o.id === orderId ? { ...o, fulfillmentStatus: nextStatus } : o));
    setToast(`Order ${orderId} updated to ${nextStatus}!`);
    setTimeout(() => setToast(""), 3500);
  };

  const filteredProducts = products.filter(p => {
    const matchesCat = selectedCategory === "ALL" || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const totalGMV = orders.reduce((sum, o) => sum + o.total, 0);
  const lowStockCount = products.filter(p => p.stock < 10).length;

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-7xl mx-auto pb-12">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-pink-100 text-pink-800">
              Solar After-Sales Store
            </span>
            <span className="flex items-center gap-1 text-xs text-emerald-600 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Storefront Online
            </span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">E-Commerce & Accessories</h1>
          <p className="text-sm text-slate-500 mt-1">
            Sell solar add-ons, cleaning gear, lithium batteries, and AMC maintenance packages directly to rooftop owners.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-pink-600 hover:bg-pink-700 text-white px-5 py-2.5 rounded-2xl font-bold text-sm transition-all flex items-center gap-2 shadow-lg shadow-pink-600/20 active:scale-95"
          >
            <Plus size={18} /> Add Store Item
          </button>
        </div>
      </div>

      {toast && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-600" />
            <span className="text-sm font-semibold">{toast}</span>
          </div>
          <button onClick={() => setToast("")} className="text-emerald-600 hover:text-emerald-800">
            <X size={16} />
          </button>
        </div>
      )}

      {/* METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Gross Merchandise Value</p>
            <h3 className="text-2xl font-black text-slate-900">₹ {(totalGMV / 1000).toFixed(1)}k</h3>
            <p className="text-[11px] font-semibold text-emerald-600 mt-1">Direct online orders</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <IndianRupee size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Orders</p>
            <h3 className="text-2xl font-black text-slate-900">{orders.length}</h3>
            <p className="text-[11px] font-semibold text-blue-600 mt-1">100% prepaid UPI/NetBanking</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <ShoppingCart size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Catalog Products</p>
            <h3 className="text-2xl font-black text-slate-900">{products.length}</h3>
            <p className="text-[11px] font-semibold text-slate-500 mt-1">Listed in customer app</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Package size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Low Stock Alerts</p>
            <h3 className="text-2xl font-black text-amber-600">{lowStockCount}</h3>
            <p className="text-[11px] font-semibold text-amber-600 mt-1">Replenishment needed</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertTriangle size={22} />
          </div>
        </div>
      </div>

      {/* VIEW SELECTOR TABS */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab("PRODUCTS")}
          className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 ${
            activeTab === "PRODUCTS"
              ? "bg-slate-900 text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80"
          }`}
        >
          <Package size={16} /> Products & Spares Catalog ({products.length})
        </button>

        <button
          onClick={() => setActiveTab("ORDERS")}
          className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 ${
            activeTab === "ORDERS"
              ? "bg-slate-900 text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80"
          }`}
        >
          <Truck size={16} /> Customer Orders & Dispatches ({orders.length})
        </button>
      </div>

      {/* PRODUCTS VIEW */}
      {activeTab === "PRODUCTS" && (
        <div className="space-y-6">
          {/* FILTER BAR */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {[
                { id: "ALL", label: "All Items" },
                { id: "PANELS", label: "Solar Panels" },
                { id: "INVERTERS", label: "Inverters" },
                { id: "BATTERIES", label: "Lithium Batteries" },
                { id: "CLEANING", label: "Cleaning & Earthing" },
                { id: "AMC", label: "AMC Service Plans" },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedCategory === c.id
                      ? "bg-pink-600 text-white shadow-sm"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <div className="relative w-72">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search products or SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500"
              />
            </div>
          </div>

          {/* PRODUCT CARDS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProducts.map((p) => (
              <div 
                key={p.id}
                className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {p.category}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-400">{p.sku}</span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm group-hover:text-pink-600 transition-colors line-clamp-2">
                    {p.name}
                  </h3>

                  <div className="flex items-baseline gap-2 mt-3">
                    <span className="text-xl font-black text-slate-900">₹ {p.price.toLocaleString()}</span>
                    <span className="text-xs font-medium text-slate-400 line-through">₹ {p.mrp.toLocaleString()}</span>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                      {Math.round(((p.mrp - p.price) / p.mrp) * 100)}% OFF
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 mt-4 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-medium">Warranty:</span>
                    <span className="font-bold text-slate-800">{p.warranty}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-medium">Available Units:</span>
                    <span className={`font-bold ${p.stock < 10 ? "text-amber-600" : "text-emerald-700"}`}>
                      {p.stock} in stock
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ORDERS VIEW */}
      {activeTab === "ORDERS" && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h3 className="font-bold text-sm text-slate-800">Store Orders Pipeline</h3>
            <span className="text-xs text-slate-400">{orders.length} orders total</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] font-extrabold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Order ID & Date</th>
                  <th className="px-6 py-4">Customer Details</th>
                  <th className="px-6 py-4">Ordered Items</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Fulfillment Status</th>
                  <th className="px-6 py-4 text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900">{ord.id}</p>
                      <p className="text-xs text-slate-400">{ord.date}</p>
                    </td>

                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800">{ord.customerName}</p>
                      <p className="text-xs text-slate-500">{ord.customerPhone}</p>
                    </td>

                    <td className="px-6 py-4 text-xs text-slate-700 max-w-xs truncate">
                      {ord.items}
                    </td>

                    <td className="px-6 py-4">
                      <p className="font-black text-slate-900">₹ {ord.total.toLocaleString()}</p>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                        {ord.paymentMode} ({ord.paymentStatus})
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                        ord.fulfillmentStatus === "DELIVERED" ? "bg-emerald-50 text-emerald-700" :
                        ord.fulfillmentStatus === "DISPATCHED" ? "bg-blue-50 text-blue-700" :
                        "bg-amber-50 text-amber-700"
                      }`}>
                        {ord.fulfillmentStatus}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      {ord.fulfillmentStatus === "PROCESSING" && (
                        <button
                          onClick={() => handleUpdateFulfillment(ord.id, "DISPATCHED")}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all"
                        >
                          Mark Dispatched
                        </button>
                      )}
                      {ord.fulfillmentStatus === "DISPATCHED" && (
                        <button
                          onClick={() => handleUpdateFulfillment(ord.id, "DELIVERED")}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all"
                        >
                          Mark Delivered
                        </button>
                      )}
                      {ord.fulfillmentStatus === "DELIVERED" && (
                        <span className="text-xs font-bold text-slate-400 flex items-center justify-end gap-1">
                          <CheckCircle2 size={14} className="text-emerald-600" /> Completed
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD ITEM MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-xl font-black text-slate-900">Add Item to Store</h3>
                <p className="text-xs text-slate-500 mt-0.5">List a new solar accessory or spare part</p>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-extrabold uppercase text-slate-500 tracking-wider mb-1 block">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 10kW Hybrid Inverter"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:bg-white focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-extrabold uppercase text-slate-500 tracking-wider mb-1 block">
                    Category
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:bg-white"
                  >
                    <option value="PANELS">Solar Panels</option>
                    <option value="INVERTERS">Inverters</option>
                    <option value="BATTERIES">Batteries</option>
                    <option value="CLEANING">Cleaning & Spares</option>
                    <option value="AMC">AMC Plans</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-extrabold uppercase text-slate-500 tracking-wider mb-1 block">
                    SKU Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. INV-10KW-HYB"
                    value={form.sku}
                    onChange={(e) => setForm({ ...form, sku: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-extrabold uppercase text-slate-500 tracking-wider mb-1 block">
                    Selling Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 45000"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-extrabold uppercase text-slate-500 tracking-wider mb-1 block">
                    MRP (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 52000"
                    value={form.mrp}
                    onChange={(e) => setForm({ ...form, mrp: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-extrabold uppercase text-slate-500 tracking-wider mb-1 block">
                    Stock Quantity *
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 20"
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-extrabold uppercase text-slate-500 tracking-wider mb-1 block">
                    Warranty
                  </label>
                  <input
                    type="text"
                    value={form.warranty}
                    onChange={(e) => setForm({ ...form, warranty: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-pink-600/20 transition-all active:scale-95"
                >
                  <Plus size={14} />
                  Add to Store
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
