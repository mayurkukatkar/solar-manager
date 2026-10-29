"use client";

import React from 'react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  variant = 'text',
  width,
  height,
  className = '',
  style,
  ...props
}: SkeletonProps) {
  const variantStyles = {
    text: 'h-4 w-full rounded-md',
    circular: 'rounded-full shrink-0',
    rectangular: 'rounded-xl',
  }[variant];

  const inlineStyles: React.CSSProperties = {
    ...style,
    width: width !== undefined ? width : style?.width,
    height: height !== undefined ? height : style?.height,
  };

  return (
    <div
      aria-hidden="true"
      className={`animate-pulse bg-slate-200/80 ${variantStyles} ${className}`}
      style={inlineStyles}
      {...props}
    />
  );
}

export default Skeleton;
