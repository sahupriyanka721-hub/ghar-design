import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
  forwardRef,
  createContext,
  useContext,
} from 'react';

// Context for staggered child animations
const StaggerContext = createContext<{
  indexCounter: { current: number };
  staggerDelay: number;
} | null>(null);

export interface MotionProps extends React.HTMLAttributes<HTMLElement> {
  initial?: Record<string, any> | string | boolean;
  animate?: Record<string, any> | string;
  exit?: Record<string, any> | string;
  transition?: {
    duration?: number;
    delay?: number;
    ease?: string | number[];
    staggerChildren?: number;
    type?: string;
    repeat?: number;
  };
  whileHover?: Record<string, any>;
  whileTap?: Record<string, any>;
  whileInView?: Record<string, any>;
  viewport?: {
    once?: boolean;
    margin?: string;
    amount?: number | 'some' | 'all';
  };
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  [key: string]: any;
}

function parseTransforms(values: any): {
  transform: string;
  otherStyles: React.CSSProperties;
} {
  if (!values || typeof values !== 'object' || Array.isArray(values)) {
    return { transform: '', otherStyles: {} };
  }

  const transforms: string[] = [];
  const otherStyles: Record<string, any> = {};

  for (const [key, rawVal] of Object.entries(values)) {
    // If rawVal is an array (e.g. animate={{ scale: [1, 1.1, 1] }}), pick the terminal value
    const val = Array.isArray(rawVal) ? rawVal[rawVal.length - 1] : rawVal;

    if (key === 'x') {
      transforms.push(`translateX(${typeof val === 'number' ? `${val}px` : val})`);
    } else if (key === 'y') {
      transforms.push(`translateY(${typeof val === 'number' ? `${val}px` : val})`);
    } else if (key === 'z') {
      transforms.push(`translateZ(${typeof val === 'number' ? `${val}px` : val})`);
    } else if (key === 'scale') {
      transforms.push(`scale(${val})`);
    } else if (key === 'scaleX') {
      transforms.push(`scaleX(${val})`);
    } else if (key === 'scaleY') {
      transforms.push(`scaleY(${val})`);
    } else if (key === 'rotate') {
      transforms.push(`rotate(${typeof val === 'number' ? `${val}deg` : val})`);
    } else if (key === 'rotateX') {
      transforms.push(`rotateX(${typeof val === 'number' ? `${val}deg` : val})`);
    } else if (key === 'rotateY') {
      transforms.push(`rotateY(${typeof val === 'number' ? `${val}deg` : val})`);
    } else if (key === 'rotateZ') {
      transforms.push(`rotateZ(${typeof val === 'number' ? `${val}deg` : val})`);
    } else if (key === 'opacity') {
      otherStyles.opacity = val;
    } else if (key === 'backgroundColor') {
      otherStyles.backgroundColor = val;
    } else if (key === 'boxShadow') {
      otherStyles.boxShadow = val;
    } else if (key === 'color') {
      otherStyles.color = val;
    } else {
      otherStyles[key] = val;
    }
  }

  return {
    transform: transforms.join(' '),
    otherStyles,
  };
}

const createMotionComponent = (Tag: string) => {
  const Component = forwardRef<HTMLElement, MotionProps>((props, externalRef) => {
    const {
      initial,
      animate,
      exit,
      transition = {},
      whileHover,
      whileTap,
      whileInView,
      viewport = { once: true },
      children,
      className,
      style,
      onMouseEnter,
      onMouseLeave,
      onMouseDown,
      onMouseUp,
      ...restProps
    } = props;

    const internalRef = useRef<HTMLElement | null>(null);
    const staggerCtx = useContext(StaggerContext);

    // Calculate staggered delay if inside a stagger parent
    const childIndex = useMemo(() => {
      if (staggerCtx) {
        const idx = staggerCtx.indexCounter.current;
        staggerCtx.indexCounter.current += 1;
        return idx;
      }
      return 0;
    }, [staggerCtx]);

    const calculatedDelay = useMemo(() => {
      const baseDelay = transition.delay || 0;
      if (staggerCtx && staggerCtx.staggerDelay) {
        return baseDelay + childIndex * staggerCtx.staggerDelay;
      }
      return baseDelay;
    }, [transition.delay, staggerCtx, childIndex]);

    const isInitialObject = typeof initial === 'object' && initial !== null;
    const isAnimateObject = typeof animate === 'object' && animate !== null;
    const isWhileInViewObject = typeof whileInView === 'object' && whileInView !== null;

    const [hasAnimated, setHasAnimated] = useState(!isInitialObject);
    const [isInView, setIsInView] = useState(!isWhileInViewObject);
    const [isHovered, setIsHovered] = useState(false);
    const [isTapped, setIsTapped] = useState(false);

    // Handle initial -> animate transition
    useEffect(() => {
      if (isAnimateObject && isInitialObject) {
        const timer = setTimeout(() => {
          setHasAnimated(true);
        }, calculatedDelay * 1000);
        return () => clearTimeout(timer);
      }
    }, [isAnimateObject, isInitialObject, calculatedDelay]);

    // Handle whileInView with IntersectionObserver AND automatic fallback
    useEffect(() => {
      if (!isWhileInViewObject) return;

      // Guaranteed fallback: ensures elements are NEVER permanently hidden
      const fallbackTimer = setTimeout(() => {
        setIsInView(true);
      }, Math.min(350, calculatedDelay * 1000 + 120));

      const node = internalRef.current;
      if (!node || typeof IntersectionObserver === 'undefined') {
        setIsInView(true);
        return () => clearTimeout(fallbackTimer);
      }

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setIsInView(true);
              clearTimeout(fallbackTimer);
              if (viewport.once !== false) {
                observer.unobserve(entry.target);
              }
            } else if (!viewport.once) {
              setIsInView(false);
            }
          });
        },
        {
          rootMargin: viewport.margin || '0px',
          threshold: typeof viewport.amount === 'number' ? viewport.amount : 0.05,
        }
      );

      observer.observe(node);
      return () => {
        clearTimeout(fallbackTimer);
        observer.disconnect();
      };
    }, [isWhileInViewObject, viewport.once, viewport.margin, viewport.amount, calculatedDelay]);

    // Compute effective animation target
    let activeState: Record<string, any> = {};

    if (isWhileInViewObject) {
      activeState = isInView ? whileInView : (isInitialObject ? initial : {});
    } else if (isAnimateObject) {
      activeState = hasAnimated ? animate : (isInitialObject ? initial : {});
    }

    // Merge hover state if active
    if (isHovered && whileHover && typeof whileHover === 'object') {
      activeState = { ...activeState, ...whileHover };
    }

    // Merge tap state if active
    if (isTapped && whileTap && typeof whileTap === 'object') {
      activeState = { ...activeState, ...whileTap };
    }

    const { transform, otherStyles } = parseTransforms(activeState);

    const duration = transition.duration ?? 0.45;
    const ease =
      typeof transition.ease === 'string'
        ? transition.ease
        : 'cubic-bezier(0.16, 1, 0.3, 1)';

    const computedStyle: React.CSSProperties = {
      ...style,
      ...otherStyles,
      transform: [style?.transform, transform].filter(Boolean).join(' ') || undefined,
      transition: `transform ${duration}s ${ease}, opacity ${duration}s ${ease}, box-shadow ${duration}s ${ease}, border-color ${duration}s ${ease}`,
      willChange: 'transform, opacity',
    };

    // Stagger container setup for children
    const newStaggerCtx = useMemo(() => {
      if (transition.staggerChildren) {
        return {
          indexCounter: { current: 0 },
          staggerDelay: transition.staggerChildren,
        };
      }
      return null;
    }, [transition.staggerChildren]);

    const combinedRef = (el: HTMLElement | null) => {
      internalRef.current = el;
      if (typeof externalRef === 'function') externalRef(el);
      else if (externalRef) (externalRef as any).current = el;
    };

    const element = React.createElement(
      Tag,
      {
        ...restProps,
        ref: combinedRef,
        className,
        style: computedStyle,
        onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
          setIsHovered(true);
          onMouseEnter?.(e);
        },
        onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
          setIsHovered(false);
          setIsTapped(false);
          onMouseLeave?.(e);
        },
        onMouseDown: (e: React.MouseEvent<HTMLElement>) => {
          setIsTapped(true);
          onMouseDown?.(e);
        },
        onMouseUp: (e: React.MouseEvent<HTMLElement>) => {
          setIsTapped(false);
          onMouseUp?.(e);
        },
      },
      newStaggerCtx ? (
        <StaggerContext.Provider value={newStaggerCtx}>
          {children}
        </StaggerContext.Provider>
      ) : (
        children
      )
    );

    return element;
  });

  Component.displayName = `motion.${Tag}`;
  return Component;
};

// Target tags supported by motion
const tags = [
  'div',
  'span',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'p',
  'a',
  'button',
  'section',
  'article',
  'header',
  'footer',
  'nav',
  'ul',
  'ol',
  'li',
  'form',
  'input',
  'img',
  'svg',
];

const motionMap: Record<string, any> = {};
tags.forEach((tag) => {
  motionMap[tag] = createMotionComponent(tag);
});

export const motion = new Proxy(motionMap, {
  get: (target, prop: string) => {
    if (!target[prop]) {
      target[prop] = createMotionComponent(prop);
    }
    return target[prop];
  },
});

export const AnimatePresence: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

export const useInView = (ref: React.RefObject<HTMLElement>, options?: any) => {
  const [isInView, setIsInView] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(([entry]) => {
      setIsInView(entry.isIntersecting);
      if (entry.isIntersecting && options?.once) {
        observer.disconnect();
      }
    }, options);
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref, options?.once]);
  return isInView;
};

export const useAnimation = () => ({
  start: async () => {},
  set: () => {},
  stop: () => {},
});

export default { motion, AnimatePresence, useInView, useAnimation };
