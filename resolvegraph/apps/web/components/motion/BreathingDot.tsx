'use client';

import React, { memo } from 'react';

interface BreathingDotProps {
  status?: 'active' | 'warning' | 'error' | 'neutral';
  className?: string;
}

export const BreathingDot = memo(({ status = 'active', className = '' }: BreathingDotProps) => {
  const colorClass =
    status === 'active'
      ? 'bg-emerald-400'
      : status === 'warning'
      ? 'bg-amber-400'
      : status === 'error'
      ? 'bg-rose-400'
      : 'bg-zinc-400';

  return (
    <span className={`relative inline-flex items-center justify-center shrink-0 w-2 h-2 ${className}`}>
      <span className={`animate-breathe absolute inline-flex h-full w-full rounded-full ${colorClass}`} />
      <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${colorClass}`} />
    </span>
  );
});

BreathingDot.displayName = 'BreathingDot';
