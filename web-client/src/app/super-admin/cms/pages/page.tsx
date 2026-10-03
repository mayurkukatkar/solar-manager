"use client";
import { Globe, Plus, MoreHorizontal, Edit, LayoutTemplate } from 'lucide-react';

export default function CMSPages() {
  const pages = [
    { id: 1, title: 'Homepage', url: '/', status: 'PUBLISHED', lastUpdated: '2 hours ago' },
    { id: 2, title: 'Pricing', url: '/pricing', status: 'PUBLISHED', lastUpdated: '1 day ago' },
    { id: 3, title: 'About Us', url: '/about', status: 'PUBLISHED', lastUpdated: '3 days ago' },
    { id: 4, title: 'Features Overview', url: '/features', status: 'DRAFT', lastUpdated: '5 hours ago' },
    { id: 5, title: 'Contact', url: '/contact', status: 'PUBLISHED', lastUpdated: '1 week ago' },
  ];

  return (
    <div className="animate-in fade-in duration-500 pb-20">
      
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">CMS Pages</h1>
          <p className="text-slate-500 mt-1">Manage public marketing pages and content.</p>
        </div>
        <button className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-lg font-semibold shadow-sm transition-all text-sm">
          <Plus size={18} /> Create Page
        </button>
      </div>

      <div className="bg-white shadow-sm border-x border-t border-b border-slate-200 overflow-x-auto rounded-xl">
        <table className="w-full text-left min-w-[800px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Page Title</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">URL Slug</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Last Updated</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pages.map(page => (
              <tr key={page.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500">
                      <LayoutTemplate size={16} />
                    </div>
                    <span className="font-bold text-slate-900">{page.title}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <a href="#" className="text-blue-600 hover:underline text-sm font-medium flex items-center gap-1.5">
                    <Globe size={14}/> {page.url}
                  </a>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    page.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {page.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-slate-600">{page.lastUpdated}</div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-bold text-sm flex items-center gap-1">
                      <Edit size={16}/> Edit
                    </button>
                    <button className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
                      <MoreHorizontal size={20} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
