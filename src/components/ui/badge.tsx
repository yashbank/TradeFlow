import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants = {
    default:
      'bg-blue-50 text-blue-700 border-blue-200/80 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800/80',
    secondary:
      'bg-slate-100 text-slate-700 border-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700',
    success:
      'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/80',
    warning:
      'bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/80',
    destructive:
      'bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800/80',
    outline:
      'border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 bg-transparent',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider transition-colors shadow-2xs',
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
