'use client';

import React from 'react';
import { Skeleton } from '../ui/Skeleton';

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col min-h-0 w-full px-6 py-4 animate-fade-up">
      {/* Subheader Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-4 border-b border-zinc-800">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-16 rounded-full" />
          </div>
          <Skeleton className="h-3.5 w-72" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-36 rounded-lg" />
          <Skeleton className="h-8 w-28 rounded-lg" />
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>
      </div>

      {/* 3-Column Core Grid */}
      <div className="grid grid-cols-12 gap-5 flex-1 min-h-0 pt-4">
        {/* Left column skeleton */}
        <div className="col-span-12 lg:col-span-3 space-y-3.5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>

        {/* Center column DAG skeleton */}
        <div className="col-span-12 lg:col-span-6 flex flex-col space-y-3.5">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="flex-1 min-h-[360px] rounded-2xl" />
        </div>

        {/* Right column tasks skeleton */}
        <div className="col-span-12 lg:col-span-3 space-y-3.5">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-12" />
          </div>
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
        </div>
      </div>

      {/* Bottom Audit skeleton */}
      <div className="pt-4 border-t border-zinc-800/80 mt-2">
        <Skeleton className="h-14 w-full rounded-lg" />
      </div>
    </div>
  );
};
