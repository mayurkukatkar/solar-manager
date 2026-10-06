"use client";
import { MessageSquare } from "lucide-react";

export default function CommunicationPage() {
  return (
    <div className="flex flex-col items-center justify-center h-[70vh]">
      <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center max-w-md shadow-sm">
        <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <MessageSquare size={40} className="text-blue-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Customer Communication</h1>
        <p className="text-slate-500 mb-6">
          Integrated Email, SMS, and WhatsApp messaging for streamlined customer updates and support is currently under development.
        </p>
        <button disabled className="px-6 py-2.5 bg-slate-100 text-slate-400 font-semibold rounded-xl cursor-not-allowed">
          Coming Soon
        </button>
      </div>
    </div>
  );
}
