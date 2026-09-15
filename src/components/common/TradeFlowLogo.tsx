'use client';

import React from 'react';

interface TradeFlowLogoProps {
  variant?: 'icon' | 'full';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showText?: boolean;
}

export const TradeFlowLogo: React.FC<TradeFlowLogoProps> = ({
  variant = 'icon',
  size = 'md',
  className = '',
  showText = false,
}) => {
  const sizeClasses = {
    xs: 'w-5 h-5',
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
    xl: 'w-14 h-14',
  };

  const textClasses = {
    xs: 'text-sm font-bold',
    sm: 'text-base font-extrabold',
    md: 'text-lg font-black',
    lg: 'text-2xl font-black',
    xl: 'text-3xl font-black',
  };

  const svgSize = sizeClasses[size] || sizeClasses.md;
  const textSize = textClasses[size] || textClasses.md;

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <div className={`relative flex-shrink-0 ${svgSize} flex items-center justify-center`}>
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-sm transition-transform hover:scale-105 duration-200"
        >
          <defs>
            <linearGradient id="tf-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0284c7" />
              <stop offset="50%" stopColor="#0ea5e9" />
              <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>
            <linearGradient id="tf-grad-2" x1="100%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="60%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>
          </defs>

          {/* Primary Flow Streamline */}
          <path
            d="M22 28 C 48 14, 76 22, 82 46 C 86 64, 74 80, 58 82 C 40 84, 30 72, 38 56 C 44 44, 58 42, 66 48"
            stroke="url(#tf-grad-1)"
            strokeWidth="11"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Secondary Interlocking Hydraulic Stream */}
          <path
            d="M78 72 C 52 86, 24 78, 18 54 C 14 36, 26 20, 42 18 C 60 16, 70 28, 62 44"
            stroke="url(#tf-grad-2)"
            strokeWidth="9"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="opacity-90"
          />

          {/* Precision Core Node */}
          <circle cx="50" cy="50" r="5" fill="#ffffff" className="dark:fill-cyan-300 shadow-sm" />
        </svg>
      </div>

      {(variant === 'full' || showText) && (
        <span
          className={`tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-sky-900 to-indigo-950 dark:from-white dark:via-sky-200 dark:to-cyan-400 ${textSize}`}
        >
          TradeFlow
        </span>
      )}
    </div>
  );
};
