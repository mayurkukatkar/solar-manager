"use client";

import React from 'react';
import { Skeleton } from './Skeleton';

export interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  containerClassName?: string;
  isLoading?: boolean;
  loadingRows?: number;
  loadingCols?: number;
  emptyState?: React.ReactNode;
  emptyMessage?: string;
}

export function Table({
  containerClassName = '',
  className = '',
  isLoading = false,
  loadingRows = 5,
  loadingCols = 4,
  emptyState,
  emptyMessage = 'No records found.',
  children,
  ...props
}: TableProps) {
  return (
    <div className={`w-full overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs ${containerClassName}`}>
      <table className={`w-full text-left text-sm text-slate-700 ${className}`} {...props}>
        {isLoading ? (
          <tbody>
            {Array.from({ length: loadingRows }).map((_, rIdx) => (
              <tr key={`loading-row-${rIdx}`} className="border-b border-slate-100 last:border-0">
                {Array.from({ length: loadingCols }).map((__, cIdx) => (
                  <td key={`loading-col-${cIdx}`} className="px-4 py-3.5">
                    <Skeleton className="h-4 w-full max-w-[120px]" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        ) : (
          children
        )}
      </table>

      {!isLoading && emptyState && (
        <div className="p-8 text-center">{emptyState}</div>
      )}
    </div>
  );
}

export function TableHeader({ className = '', children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead className={`bg-slate-50/80 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500 ${className}`} {...props}>
      {children}
    </thead>
  );
}

export function TableBody({ className = '', children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody className={`divide-y divide-slate-100 bg-white ${className}`} {...props}>
      {children}
    </tbody>
  );
}

export function TableRow({ className = '', children, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr className={`hover:bg-slate-50/80 transition-colors ${className}`} {...props}>
      {children}
    </tr>
  );
}

export function TableHead({ className = '', children, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th className={`px-4 py-3 font-semibold ${className}`} {...props}>
      {children}
    </th>
  );
}

export function TableCell({ className = '', children, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={`px-4 py-3.5 text-sm align-middle ${className}`} {...props}>
      {children}
    </td>
  );
}

export default Table;
