import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function Skeleton({ className }) {
  return (
    <div className={twMerge(
      'animate-pulse bg-gradient-to-r from-muted via-muted/50 to-muted rounded',
      className
    )} />
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-card/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-4">
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  );
}

export function PoolSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-8 w-24" />
      <Skeleton className="h-4 w-16" />
    </div>
  );
}
