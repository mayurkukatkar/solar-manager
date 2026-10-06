"use client";
import { ShoppingCart } from "lucide-react";

export default function EcommercePage() {
  return (
    <div className="flex flex-col items-center justify-center h-[70vh]">
      <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center max-w-md shadow-sm">
        <div className="w-20 h-20 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShoppingCart size={40} className="text-pink-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">E-Commerce</h1>
        <p className="text-slate-500 mb-6">
          An integrated storefront to sell solar accessories, cleaning kits, and AMC packages directly to your customers.
        </p>
        <button disabled className="px-6 py-2.5 bg-slate-100 text-slate-400 font-semibold rounded-xl cursor-not-allowed">
          Coming Soon
        </button>
      </div>
    </div>
  );
}
