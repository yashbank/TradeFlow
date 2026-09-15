'use client';

import React from 'react';

interface TradeFlowLogoProps {
  variant?: 'icon' | 'full';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showText?: boolean;
}

export const TradeFlowLogo: React.FC<TradeFlowLogoProps> = ({
  variant = 'full',
  size = 'md',
  className = '',
  showText = true,
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const textClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-3xl',
    xl: 'text-4xl',
  };

  const svgSize = sizeClasses[size];
  const textSize = textClasses[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`relative flex-shrink-0 ${svgSize}`}>
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-md dark:drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]"
        >
          <defs>
            <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
            <linearGradient id="gradient2" x1="100%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
          </defs>
          <path
            d="M30 20 C 60 20, 80 40, 80 70 C 80 80, 70 80, 70 70 C 70 50, 50 35, 30 35 C 20 35, 20 20, 30 20 Z"
            fill="url(#gradient1)"
          />
          <path
            d="M70 80 C 40 80, 20 60, 20 30 C 20 20, 30 20, 30 30 C 30 50, 50 65, 70 65 C 80 65, 80 80, 70 80 Z"
            fill="url(#gradient2)"
          />
          <circle cx="50" cy="50" r="10" fill="#ffffff" className="dark:fill-gray-900" />
        </svg>
      </div>

      {(variant === 'full' && showText) && (
        <span
          className={`font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-cyan-400 ${textSize}`}
          style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
        >
          TradeFlow
        </span>
      )}
    </div>
  );
};
