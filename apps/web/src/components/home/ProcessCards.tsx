import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ClipboardList,
  ShieldCheck,
  Scale,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const PROCESS_STEPS = [
  {
    step: '01',
    badge: 'Step 1: Submission',
    title: 'Post Property Details',
    tagline: 'Plot Size & Requirements',
    desc: 'Submit your plot size, location, floor requirements, and budget preference with a nominal quotation token.',
    perk: 'Dedicated Senior Engineer Assigned',
    icon: ClipboardList,
    accentColor: 'from-amber-500/20 to-gold-500/10',
    borderColor: 'border-amber-400/40',
  },
  {
    step: '02',
    badge: 'Step 2: Operations Vetting',
    title: 'Admins Assign Pros',
    tagline: 'Strict Technical Screening',
    desc: 'Our administrative civil engineers evaluate qualified local structural engineers and civil contractors.',
    perk: 'Certified & IEI Verified Associates Only',
    icon: ShieldCheck,
    accentColor: 'from-purple-500/20 to-indigo-500/10',
    borderColor: 'border-purple-400/40',
  },
  {
    step: '03',
    badge: 'Step 3: Multi-Quote Compare',
    title: 'Review & Compare',
    tagline: 'Itemized BOQ Line Items',
    desc: 'Receive 3+ vetted, standardized quotations side-by-side with transparent scope, brand specifications, and fixed pricing.',
    perk: 'Zero Hidden Costs or Markup Surprises',
    icon: Scale,
    accentColor: 'from-blue-500/20 to-sky-500/10',
    borderColor: 'border-blue-400/40',
  },
  {
    step: '04',
    badge: 'Step 4: Safe Execution',
    title: 'Book & Track Work',
    tagline: 'Milestone Escrow Protection',
    desc: 'Approve blueprints digitally, track site progress across 10 stages, and release payments in tranches only after quality verification.',
    perk: '100% Escrow Protection Guaranteed',
    icon: CheckCircle2,
    accentColor: 'from-emerald-500/20 to-teal-500/10',
    borderColor: 'border-emerald-400/40',
  },
];

export const ProcessCards: React.FC = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = (dir: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = window.innerWidth < 640 ? 280 : 320;
      scrollRef.current.scrollBy({
        left: dir === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const handleScrollListener = () => {
    if (scrollRef.current) {
      const scrollLeft = scrollRef.current.scrollLeft;
      const cardWidth = 300;
      const newIdx = Math.round(scrollLeft / cardWidth);
      setActiveIndex(Math.min(Math.max(newIdx, 0), PROCESS_STEPS.length - 1));
    }
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', handleScrollListener);
      return () => el.removeEventListener('scroll', handleScrollListener);
    }
  }, []);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-gold-100 text-gold-950 text-xs font-black uppercase tracking-wider shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-gold-600" />
          <span>Transparent 4-Step Building & Execution Process</span>
        </div>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black font-display tracking-tight text-navy-950">
          How BuildGhar Protects Your Dream Home
        </h2>
        <p className="text-slate-600 text-sm sm:text-base max-w-xl mx-auto font-sans">
          We don't leave you at the mercy of contractor estimates. Every quotation and milestone is reviewed by our engineering desk.
        </p>
      </div>

      {/* ---------------- SLIDING / HORIZONTAL TOUCH CARDS ---------------- */}
      <div
        ref={scrollRef}
        className="flex md:grid md:grid-cols-4 gap-6 overflow-x-auto pb-4 pt-2 snap-x snap-mandatory scrollbar-none -mx-4 px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {PROCESS_STEPS.map((item, idx) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: idx * 0.12 }}
              whileHover={{ y: -8, scale: 1.02 }}
              className="w-[85vw] sm:w-[320px] md:w-auto shrink-0 snap-start bg-white p-7 rounded-3xl border border-slate-200/90 shadow-md hover:shadow-2xl hover:border-gold-500/60 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden"
            >
              {/* Subtle Ambient Hover Glow */}
              <div
                className={`absolute -right-12 -top-12 w-32 h-32 bg-gradient-to-br ${item.accentColor} rounded-full blur-2xl opacity-60 group-hover:opacity-100 transition-opacity pointer-events-none`}
              />

              <div className="space-y-4 relative z-10">
                {/* Step Pill & Step Number */}
                <div className="flex items-center justify-between">
                  <div className="w-14 h-14 rounded-2xl bg-navy-950 text-gold-400 group-hover:bg-gradient-to-tr group-hover:from-gold-600 group-hover:to-amber-400 group-hover:text-navy-950 transition-all duration-300 flex items-center justify-center font-black font-display text-2xl shadow-md group-hover:rotate-6">
                    {item.step}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                    {item.badge}
                  </span>
                </div>

                {/* Title & Tagline */}
                <div>
                  <h3 className="text-xl font-extrabold font-display text-navy-950 group-hover:text-gold-700 transition-colors">
                    {item.title}
                  </h3>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wide mt-0.5">
                    {item.tagline}
                  </div>
                </div>

                {/* Description */}
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed font-sans">
                  {item.desc}
                </p>
              </div>

              {/* Bottom Guarantee Perk Pill */}
              <div className="pt-5 mt-4 border-t border-slate-100 relative z-10">
                <div className="flex items-center gap-2 text-[11px] font-bold text-slate-800 bg-slate-50 p-2.5 rounded-xl border border-slate-200/70 group-hover:border-gold-300/80 transition-colors">
                  <Icon className="w-4 h-4 text-gold-600 shrink-0" />
                  <span className="truncate">{item.perk}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Mobile Step Indicators & Swipe Controls */}
      <div className="md:hidden flex items-center justify-between px-2 pt-1">
        <div className="flex items-center gap-1.5">
          {PROCESS_STEPS.map((_, i) => (
            <span
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                activeIndex === i ? 'w-6 bg-gold-600' : 'w-2 bg-slate-300'
              }`}
            />
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handleScroll('left')}
            className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 shadow-xs"
            aria-label="Previous step"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleScroll('right')}
            className="w-9 h-9 rounded-xl bg-navy-950 text-gold-400 flex items-center justify-center shadow-xs"
            aria-label="Next step"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
