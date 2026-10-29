"use client";

import React from 'react';
import Link from 'next/link';
import { Button } from './Button';
import { PackageOpen } from 'lucide-react';

export interface EmptyStateAction {
  label: string;
  onClick?: () => void;
  href?: string;
  icon?: React.ElementType;
}

export interface EmptyStateProps {
  icon?: React.ElementType | React.ReactNode;
  title?: string;
  description?: string;
  action?: EmptyStateAction;
  children?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title = 'No items found',
  description = 'There are no records matching your criteria or currently available in this view.',
  action,
  children,
  className = '',
}: EmptyStateProps) {
  const renderIcon = () => {
    if (React.isValidElement(icon)) {
      return icon;
    }
    if (typeof icon === 'function') {
      const IconComponent = icon as React.ElementType;
      return <IconComponent size={28} className="text-slate-400" />;
    }
    return <PackageOpen size={28} className="text-slate-400" />;
  };

  return (
    <div
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center max-w-md mx-auto ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4 shadow-inner">
        {renderIcon()}
      </div>

      <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight mb-1.5">
        {title}
      </h3>

      <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-sm mb-6">
        {description}
      </p>

      {action && (
        <div>
          {action.href ? (
            <Link href={action.href}>
              <Button
                variant="primary"
                size="md"
                leftIcon={action.icon ? React.createElement(action.icon, { size: 16 }) : undefined}
              >
                {action.label}
              </Button>
            </Link>
          ) : (
            <Button
              variant="primary"
              size="md"
              onClick={action.onClick}
              leftIcon={action.icon ? React.createElement(action.icon, { size: 16 }) : undefined}
            >
              {action.label}
            </Button>
          )}
        </div>
      )}

      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}

export default EmptyState;
