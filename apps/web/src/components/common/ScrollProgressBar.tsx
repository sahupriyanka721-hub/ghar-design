import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useLenis } from 'lenis/react';

export const ScrollProgressBar: React.FC = () => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const rafRef = useRef<number | null>(null);

  // Precision calculator ensuring 100% "pura tak" at bottom across all screens & browsers
  const calculateProgress = useCallback(() => {
    const winScroll = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
    const docHeight = Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.offsetHeight,
      document.body.clientHeight,
      document.documentElement.clientHeight
    );
    const winHeight = window.innerHeight || document.documentElement.clientHeight || 1;
    const scrollableDist = docHeight - winHeight;

    if (scrollableDist <= 0) {
      return 100;
    }

    // When within 35px of page end, snap cleanly to 100% (ensures "pura tak" on mobile URL bars, zoom, and desktop)
    if (winScroll + winHeight >= docHeight - 35) {
      return 100;
    }

    const raw = (winScroll / scrollableDist) * 100;
    return Math.min(100, Math.max(0, raw));
  }, []);

  // 1. Lenis Smooth Scroll Synchronizer (60fps/120fps hardware lerp)
  useLenis((lenis) => {
    if (lenis && typeof lenis.progress === 'number') {
      const pct = lenis.progress * 100;
      if (pct >= 98.5) {
        setScrollProgress(100);
      } else {
        setScrollProgress(Math.min(100, Math.max(0, pct)));
      }
    }
  });

  // 2. Passive native scroll fallback & window resize listener
  useEffect(() => {
    const handleScroll = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const p = calculateProgress();
        setScrollProgress(p);
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [calculateProgress]);

  const isFull = scrollProgress >= 99.5;

  return (
    <div
      className="fixed top-0 left-0 right-0 h-[4px] z-[9999] pointer-events-none bg-slate-900/15 backdrop-blur-[1px] select-none"
      aria-hidden="true"
    >
      {/* Soft Ambient Light Spill Behind the Main Beam */}
      <div
        className="absolute top-0 left-0 h-[8px] bg-gradient-to-r from-amber-500/25 via-gold-400/35 to-yellow-300/40 blur-[3px] transition-all duration-75 ease-out"
        style={{ width: `${scrollProgress}%` }}
      />

      {/* Main Laser Light Graphic Beam */}
      <div
        className={`relative h-full transition-all duration-75 ease-out ${
          isFull
            ? 'bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-300 shadow-[0_0_18px_rgba(245,158,11,1),0_0_32px_rgba(251,191,36,0.85)]'
            : 'bg-gradient-to-r from-amber-600 via-amber-400 via-yellow-300 to-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.9),0_0_22px_rgba(251,191,36,0.6)]'
        }`}
        style={{ width: `${scrollProgress}%` }}
      >
        {/* Shimmer sweep traveling through the beam */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full animate-shimmer-sweep pointer-events-none" />

        {/* Leading Luminous Particle Photon Head */}
        {scrollProgress > 0.5 && !isFull && (
          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 flex items-center justify-center">
            {/* Outer Pulsing Aura */}
            <span className="absolute w-5 h-5 rounded-full bg-amber-400/40 animate-ping pointer-events-none" />
            {/* Middle Glowing Diamond / Orb */}
            <span className="w-3 h-3 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-200 shadow-[0_0_12px_#fbbf24,0_0_20px_#f59e0b] border border-white" />
            {/* Core White Spark */}
            <span className="absolute w-1 h-1 rounded-full bg-white shadow-[0_0_6px_#ffffff]" />
          </div>
        )}

        {/* Terminal Flush Flare when reaches 100% (Pura Tak) */}
        {isFull && (
          <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
            <span className="w-2.5 h-full bg-white shadow-[0_0_12px_#ffffff,0_0_24px_#fbbf24]" />
          </div>
        )}
      </div>
    </div>
  );
};
