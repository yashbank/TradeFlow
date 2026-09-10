'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export function RouteProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Whenever route changes, finish and clear progress bar
    setProgress(100);
    const timer = setTimeout(() => {
      setLoading(false);
      setProgress(0);
    }, 250);

    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  useEffect(() => {
    // Listen for global link clicks to trigger instant visual reaction
    function handleLinkClick(e: MouseEvent) {
      const target = (e.target as HTMLElement).closest('a');
      if (target && target.href && !target.target && !e.ctrlKey && !e.metaKey) {
        const url = new URL(target.href, window.location.origin);
        if (url.origin === window.location.origin && url.pathname !== window.location.pathname) {
          setLoading(true);
          setProgress(25);
          setTimeout(() => setProgress(65), 80);
          setTimeout(() => setProgress(85), 200);
        }
      }
    }

    document.addEventListener('click', handleLinkClick, { passive: true });
    return () => document.removeEventListener('click', handleLinkClick);
  }, []);

  if (!loading && progress === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 h-1 z-[100] pointer-events-none overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 shadow-sm transition-all duration-200 ease-out"
        style={{
          width: `${progress}%`,
          opacity: progress === 100 ? 0 : 1,
          transition: progress === 100 ? 'width 0.15s ease, opacity 0.25s ease' : 'width 0.2s ease',
        }}
      />
    </div>
  );
}
