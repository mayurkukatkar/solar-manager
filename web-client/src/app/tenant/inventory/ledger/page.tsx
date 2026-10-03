"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { 
  Activity, ArrowRight, ArrowDownLeft, ArrowUpRight, Search, Filter
} from 'lucide-react';


export default function StockLedgerView() {
  const [ledger, setLedger] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLedger();
  }, []);

  const fetchLedger = async () => {
    try {
      const res = await axios.get(`\${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tenant/inventory/stock-ledger`, { withCredentials: true });
      setLedger(res.data.ledger);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64 text-slate-400">Loading ledger...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/tenant/inventory" className="text-slate-400 hover:text-emerald-600 transition-colors">Inventory</Link>
          <span className="text-slate-300">/</span>
          <h1 className="text-2xl font-bold text-slate-900">Stock Ledger</h1>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex gap-4">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by reference or product..."
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
                <th className="p-4 rounded-tl-xl">Date</th>
                <th className="p-4">Type</th>
                <th className="p-4">Product</th>
                <th className="p-4">Warehouse</th>
                <th className="p-4 text-right">Qty Before</th>
                <th className="p-4 text-center">Change</th>
                <th className="p-4 text-right">Qty After</th>
                <th className="p-4 rounded-tr-xl">Reference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ledger.length === 0 ? (
                <tr><td colSpan={8} className="p-8 text-center text-slate-400">No stock movements recorded.</td></tr>
              ) : (
                ledger.map(entry => {
                  const isPositive = entry.quantity > 0;
                  return (
                    <tr key={entry.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 whitespace-nowrap text-xs text-slate-500 font-medium">
                        {new Date(entry.createdAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="p-4">
                        <span className={"px-2.5 py-1 rounded-lg text-xs font-bold flex items-center w-max gap-1 " + (
                          isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                        )}>
                          {isPositive ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
                          {entry.movementType}
                        </span>
                      </td>
                      <td className="p-4 font-medium text-slate-900">{entry.product.name}</td>
                      <td className="p-4 text-slate-500">{entry.warehouse.name}</td>
                      <td className="p-4 text-right font-mono text-xs">{entry.quantityBefore}</td>
                      <td className="p-4 text-center">
                        <span className={"font-bold " + (isPositive ? 'text-emerald-600' : 'text-red-600')}>
                          {isPositive ? '+' : ''}{entry.quantity}
                        </span>
                      </td>
                      <td className="p-4 text-right font-mono text-xs font-bold text-slate-900">{entry.quantityAfter}</td>
                      <td className="p-4 font-mono text-xs text-slate-500">
                        {entry.referenceType}: {entry.referenceId || 'N/A'}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
