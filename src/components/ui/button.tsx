import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'destructive' | 'ghost' | 'success';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-semibold rounded-xl min-h-[44px] select-none cursor-pointer transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.965]';

    const variants = {
      primary:
        'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-sm shadow-blue-500/25 border border-blue-500/20 focus-visible:ring-blue-500',
      secondary:
        'bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-100 border border-transparent dark:border-zinc-700/50 focus-visible:ring-slate-400',
      outline:
        'border border-slate-200/90 dark:border-zinc-700/80 bg-white dark:bg-zinc-800/90 text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-700/60 shadow-2xs hover:shadow-xs focus-visible:ring-slate-400',
      destructive:
        'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white shadow-sm shadow-rose-500/25 border border-rose-500/20 focus-visible:ring-rose-500',
      ghost:
        'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-zinc-100 border border-transparent focus-visible:ring-slate-400',
      success:
        'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-sm shadow-emerald-500/25 border border-emerald-500/20 focus-visible:ring-emerald-500',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
      icon: 'h-11 w-11 p-0',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
