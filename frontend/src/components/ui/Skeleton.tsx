import React from 'react';
import clsx from 'clsx';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={clsx('animate-pulse rounded-md bg-[var(--border-color)]/50', className)}
      {...props}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="glass-card p-6 flex flex-col gap-4">
      <Skeleton className="h-6 w-2/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <div className="mt-4 flex justify-between">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-24 rounded-full" />
      </div>
    </div>
  );
}
