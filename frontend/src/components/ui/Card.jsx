import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function Card({ children, className, glow = false }) {
  return (
    <div className={twMerge(
      'bg-card/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6',
      glow && 'glow-cyan',
      className
    )}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className }) {
  return (
    <div className={twMerge('mb-4', className)}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className }) {
  return (
    <h3 className={twMerge('text-lg font-semibold text-foreground', className)}>
      {children}
    </h3>
  );
}

export function CardContent({ children, className }) {
  return (
    <div className={twMerge(className)}>
      {children}
    </div>
  );
}
