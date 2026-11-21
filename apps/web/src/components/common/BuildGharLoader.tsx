import React from 'react';
import { motion } from 'framer-motion';

interface BuildGharLoaderProps {
  fullScreen?: boolean;
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const BuildGharLoader: React.FC<BuildGharLoaderProps> = ({
  fullScreen = false,
  message = 'Loading BuildGhar...',
  size = 'md',
  className = '',
}) => {
  const emblemSizes = {
    sm: 'w-10 h-12',
    md: 'w-16 h-19 sm:w-20 sm:h-24',
    lg: 'w-24 h-28 sm:w-28 sm:h-32',
  };

  const titleSizes = {
    sm: 'text-lg',
    md: 'text-2xl sm:text-3xl',
    lg: 'text-3xl sm:text-4xl',
  };

  const content = (
    <div className={`flex flex-col items-center justify-center text-center select-none ${className}`}>
      {/* 
        -------------------------------------------------------------
        AUTHENTIC 3D METALLIC GOLD EMBLEM WITH PULSATING GLOW & HALO
        ------------------------------------------------------------- 
      */}
      <div className="relative flex items-center justify-center">
        {/* Soft Golden Ambient Halo */}
        <motion.div
          animate={{
            scale: [1, 1.25, 1],
            opacity: [0.35, 0.7, 0.35],
          }}
          transition={{
            duration: 2.2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-gradient-to-tr from-amber-400/30 via-gold-400/25 to-blue-400/20 blur-2xl pointer-events-none"
        />

        {/* Pulsating Emblem */}
        <motion.div
          animate={{
            scale: [1, 1.05, 1],
            y: [0, -3, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className={`${emblemSizes[size]} relative z-10 shrink-0 flex items-center justify-center drop-shadow-[0_8px_20px_rgba(245,158,11,0.35)]`}
        >
          <img
            src="/brand-emblem-web.png"
            alt="BuildGhar Logo"
            className="w-full h-full object-contain filter drop-shadow-[0_2px_10px_rgba(245,158,11,0.4)]"
          />
        </motion.div>
      </div>

      {/* 
        -------------------------------------------------------------
        BRAND TYPOGRAPHY: "BuildGhar"
        ------------------------------------------------------------- 
      */}
      <div className="mt-4 flex flex-col items-center">
        <div className={`font-display font-black ${titleSizes[size]} tracking-tight leading-none flex items-center`}>
          <span className="text-[#102646] drop-shadow-xs">Build</span>
          <span
            className="bg-gradient-to-r from-amber-400 via-gold-400 to-amber-500 bg-clip-text text-transparent font-black ml-1"
            style={{ filter: 'drop-shadow(0 1px 3px rgba(180, 83, 9, 0.4))' }}
          >
            Ghar
          </span>
        </div>
        <span className="font-extrabold uppercase tracking-[0.25em] text-amber-700/90 text-[9px] sm:text-[10px] mt-1 font-sans">
          Homes & Construction
        </span>
      </div>

      {/* 
        -------------------------------------------------------------
        ANIMATED GOLDEN PROGRESS BAR WITH SHIMMER SWEEP
        ------------------------------------------------------------- 
      */}
      <div className="mt-5 w-48 sm:w-56 h-1.5 bg-blue-100/80 rounded-full overflow-hidden relative border border-blue-200/80 shadow-inner">
        <motion.div
          animate={{
            x: ['-100%', '100%'],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="w-1/2 h-full bg-gradient-to-r from-amber-400 via-gold-400 to-amber-500 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.8)]"
        />
      </div>

      {/* Contextual Status Message */}
      {message && (
        <motion.p
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          className="mt-3 text-xs font-semibold text-slate-600 tracking-wide font-sans"
        >
          {message}
        </motion.p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-b from-[#edf4fc] via-[#f7faff] to-[#edf4fc] backdrop-blur-xl">
        {content}
      </div>
    );
  }

  return content;
};
