"use client";
import { Globe } from "lucide-react";

export default function WebsitePage() {
  return (
    <div className="flex flex-col items-center justify-center h-[70vh]">
      <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center max-w-md shadow-sm">
        <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <Globe size={40} className="text-purple-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Website & CMS</h1>
        <p className="text-slate-500 mb-6">
          A built-in content management system to launch and manage your branded customer-facing portal and lead generation forms.
        </p>
        <button disabled className="px-6 py-2.5 bg-slate-100 text-slate-400 font-semibold rounded-xl cursor-not-allowed">
          Coming Soon
        </button>
      </div>
    </div>
  );
}
