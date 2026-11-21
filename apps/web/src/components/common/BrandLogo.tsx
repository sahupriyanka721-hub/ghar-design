import React from 'react';

interface BrandLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  theme?: 'dark' | 'light' | 'auto';
  variant?: 'badge' | 'transparent';
  subtitle?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = '',
  size = 'md',
  showText = true,
  theme = 'auto',
  variant = 'badge',
  subtitle = '',
}) => {
  // Sizing definitions - Responsive Tailwind classes for mobile & laptop (Prominent, Elegant & Majestic)
  const badgeSizes = {
    sm: 'w-8 h-9 sm:w-9 sm:h-10',
    md: 'w-10 h-12 sm:w-11 sm:h-13 md:w-12 md:h-14',
    lg: 'w-16 h-19 sm:w-18 sm:h-21 md:w-20 md:h-24',
    xl: 'w-20 h-24 sm:w-24 sm:h-28 md:w-28 md:h-32',
  };

  const titleSizes = {
    sm: 'text-base sm:text-lg',
    md: 'text-lg sm:text-xl md:text-2xl',
    lg: 'text-2xl sm:text-3xl md:text-4xl',
    xl: 'text-3xl sm:text-4xl md:text-5xl',
  };

  const subSizes = {
    sm: 'text-[8px] sm:text-[9px] tracking-[0.22em]',
    md: 'text-[9px] sm:text-[10px] md:text-[11.5px] tracking-[0.25em]',
    lg: 'text-[11px] sm:text-xs tracking-[0.28em]',
    xl: 'text-xs sm:text-sm tracking-[0.32em]',
  };

  return (
    <div className={`inline-flex items-center justify-center gap-2 sm:gap-3 select-none group cursor-pointer shrink-0 ${className}`}>
      {/* 
        -------------------------------------------------------------
        AUTHENTIC 3D METALLIC GOLD EMBLEM (Light, Radiant & Transparent)
        With Dynamic Larger Interactive Hover Scale & Specular Bloom
        ------------------------------------------------------------- 
      */}
      <div
        className={`${badgeSizes[size]} relative shrink-0 flex items-center justify-center transition-all duration-300 ease-out transform group-hover:scale-115 group-hover:-translate-y-1`}
      >
        <img
          src="/brand-emblem-web.png"
          alt="BuildGhar Logo"
          className="w-full h-full object-contain filter drop-shadow-[0_2px_8px_rgba(245,158,11,0.25)] group-hover:drop-shadow-[0_0_18px_rgba(251,191,36,0.6)] transition-all duration-300 ease-out"
        />
      </div>

      {/* 
        -------------------------------------------------------------
        PREMIUM BRAND TYPOGRAPHY: "BuildGhar" (With Hover Glow & Shift)
        ------------------------------------------------------------- 
      */}
      {showText && (
        <div className="flex flex-col justify-center transition-transform duration-300 ease-out group-hover:translate-x-1.5 shrink-0">
          <div
            className={`font-display font-black ${titleSizes[size]} tracking-tight leading-none flex items-center`}
          >
            <span
              className={`transition-colors duration-300 ${
                theme === 'dark'
                  ? 'text-white group-hover:text-amber-100'
                  : 'text-[#102646] group-hover:text-blue-700'
              }`}
              style={theme === 'dark' ? { color: '#ffffff' } : { color: '#102646' }}
            >
              Build
            </span>
            <span
              className="bg-gradient-to-r from-amber-400 via-gold-400 to-amber-500 bg-clip-text text-transparent font-black ml-1 group-hover:brightness-125 transition-all duration-300"
              style={{
                filter: 'drop-shadow(0 1px 3px rgba(180, 83, 9, 0.4))',
              }}
            >
              Ghar
            </span>
          </div>

          {subtitle && subtitle.trim() !== '' ? (
            <span
              className={`font-bold uppercase tracking-[0.28em] ${
                theme === 'dark' ? 'text-slate-400 group-hover:text-gold-400' : 'text-slate-500 group-hover:text-gold-600'
              } ${subSizes[size]} mt-0.5 font-sans transition-colors duration-300`}
              style={theme === 'dark' ? { color: '#94a3b8' } : { color: '#64748b' }}
            >
              {subtitle}
            </span>
          ) : (
            <span
              className={`font-extrabold uppercase tracking-[0.22em] ${
                theme === 'dark' ? 'text-amber-400/90' : 'text-amber-700/90'
              } ${subSizes[size]} mt-0.5 font-sans`}
            >
              Homes & Construction
            </span>
          )}
        </div>
      )}
    </div>
  );
};
