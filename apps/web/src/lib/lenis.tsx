import React, { useEffect, useRef, createContext, useContext } from 'react';

export interface LenisOptions {
  lerp?: number;
  duration?: number;
  smoothWheel?: boolean;
  wheelMultiplier?: number;
  touchMultiplier?: number;
  infinite?: boolean;
  autoResize?: boolean;
  [key: string]: any;
}

export class Lenis {
  public isSmooth: boolean = true;
  private options: LenisOptions;

  constructor(options: LenisOptions = {}) {
    this.options = options;
    if (typeof window !== 'undefined') {
      document.documentElement.style.scrollBehavior = 'smooth';
    }
  }

  public start() {}
  public stop() {}
  public destroy() {}

  public scrollTo(target: number | HTMLElement | string, options: any = {}) {
    if (typeof window === 'undefined') return;
    let top = 0;
    if (typeof target === 'number') {
      top = target;
    } else if (typeof target === 'string') {
      const el = document.querySelector(target);
      if (el) top = el.getBoundingClientRect().top + window.scrollY;
    } else if (target instanceof HTMLElement) {
      top = target.getBoundingClientRect().top + window.scrollY;
    }
    window.scrollTo({
      top,
      behavior: options.immediate ? 'auto' : 'smooth',
    });
  }
}

export const LenisContext = createContext<Lenis | null>(null);

export const useLenis = () => useContext(LenisContext);

export interface ReactLenisProps {
  root?: boolean;
  options?: LenisOptions;
  children: React.ReactNode;
  className?: string;
}

export const ReactLenis: React.FC<ReactLenisProps> = ({
  options = {},
  children,
  className,
}) => {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    document.documentElement.style.scrollBehavior = 'smooth';
    lenisRef.current = new Lenis(options);

    return () => {
      lenisRef.current?.destroy();
    };
  }, []);

  return (
    <LenisContext.Provider value={lenisRef.current}>
      <div className={className}>{children}</div>
    </LenisContext.Provider>
  );
};

export default Lenis;
