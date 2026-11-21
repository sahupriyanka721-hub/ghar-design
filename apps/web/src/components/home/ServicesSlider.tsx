import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  Hammer,
  Layers,
  ShieldCheck,
  Paintbrush,
  Sparkles,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Star,
  CheckCircle2,
  SlidersHorizontal,
} from 'lucide-react';

interface ServiceItem {
  id: string;
  slug: string;
  category: 'construction' | 'planning' | 'interiors' | 'all';
  title: string;
  tagline: string;
  desc: string;
  priceTag: string;
  badge: string;
  icon: any;
  image: string;
  highlights: string[];
}

const SERVICES_DATA: ServiceItem[] = [
  {
    id: 'srv-1',
    slug: 'new-house-construction',
    category: 'construction',
    title: 'New House Construction',
    tagline: 'Complete Residential Civil Works',
    desc: 'End-to-end villa construction from soil testing to final painting. Verified civil contractors with daily digital logs and strict structural safety.',
    priceTag: 'From ₹1,650 / sq.ft',
    badge: 'Most Popular',
    icon: Building2,
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
    highlights: ['Tata Tiscon 550D Steel', 'UltraTech M25 Concrete', 'Daily Site Cam Logs'],
  },
  {
    id: 'srv-2',
    slug: 'house-map-planning',
    category: 'planning',
    title: 'House Maps & 3D Blueprints',
    tagline: 'Vastu Aligned Planning Sets',
    desc: 'Complete layout planning, structural load calculations, 3D photorealistic elevations, and government sanction drawings.',
    priceTag: 'From ₹15 / sq.ft',
    badge: '100% Vastu',
    icon: Layers,
    image: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=800&q=80',
    highlights: ['Certified Structural Engineers', '3D Walkthrough Render', 'Municipal Sanction Ready'],
  },
  {
    id: 'srv-3',
    slug: 'structural-engineering',
    category: 'planning',
    title: 'Structural RCC Engineering',
    tagline: 'Earthquake Safe RCC Modeling',
    desc: 'Beam-column structural schedules, footing designs, and seismic load analysis compliant with IS 456 & IS 1893 certified by chartered civil engineers.',
    priceTag: 'From ₹8 / sq.ft',
    badge: 'IS 456 Certified',
    icon: ShieldCheck,
    image: 'https://images.unsplash.com/photo-1541888946425-d0fbb18615f8?auto=format&fit=crop&w=800&q=80',
    highlights: ['Chartered Engineer Seal', 'Soil Bearing Analysis', 'Rebar Optimization'],
  },
  {
    id: 'srv-4',
    slug: 'interior-designing',
    category: 'interiors',
    title: 'Luxury Interior Designing',
    tagline: 'Luxury Modular Fitouts',
    desc: 'Bespoke residential interiors, customized modular kitchens, false ceilings, luxury lighting, and imported wardrobe installations with 10-year warranty.',
    priceTag: 'From ₹950 / sq.ft',
    badge: '10-Yr Warranty',
    icon: Paintbrush,
    image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80',
    highlights: ['HDHMR & Marine Plywood', 'Hafele / Blum Hardware', '45-Day Move-in Guarantee'],
  },
  {
    id: 'srv-5',
    slug: 'home-renovation',
    category: 'construction',
    title: 'Modern Home Renovation',
    tagline: 'Floor Additions & Remodeling',
    desc: 'Structural rehabilitation, additional floor construction, kitchen overhauls, waterproof terrace treatments, and elevation facade transformation.',
    priceTag: 'Custom Quote',
    badge: 'Fast Turnaround',
    icon: Hammer,
    image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80',
    highlights: ['Demolition & Debris Disposal', 'Non-Destructive Testing', 'Zero Leakage Guarantee'],
  },
  {
    id: 'srv-6',
    slug: 'complete-construction-package',
    category: 'construction',
    title: 'Complete Design + Build',
    tagline: 'All-in-One Master Contract',
    desc: 'Single unified contract covering structural blueprint design, civil RCC execution, premium interior fitout, and final handover.',
    priceTag: 'From ₹2,450 / sq.ft',
    badge: 'VIP All-Inclusive',
    icon: Sparkles,
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80',
    highlights: ['Dedicated Project Manager', 'Escrow Milestone Payments', '10-Year Structural Guarantee'],
  },
];

export const ServicesSlider: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const filteredServices = activeCategory === 'all'
    ? SERVICES_DATA
    : SERVICES_DATA.filter((s) => s.category === activeCategory);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = window.innerWidth < 640 ? 300 : 420;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Header with Category Filter Tabs & Sliding Controls */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-50 border border-gold-200 text-gold-900 text-xs font-bold uppercase tracking-wider">
            <SlidersHorizontal className="w-3.5 h-3.5 text-gold-600" />
            <span>Interactive Catalog</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black font-display tracking-tight text-navy-950">
            Civil & Construction Services
          </h2>
          <p className="text-slate-600 text-sm sm:text-base max-w-xl font-sans">
            Slide horizontally to explore certified packages with transparent BOQ costs, vetted engineers, and escrow safety.
          </p>
        </div>

        {/* Filter Pills + Desktop Slide Arrow Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Category Tabs with Sliding Indicator */}
          <div className="relative p-1 bg-slate-100/90 rounded-2xl border border-slate-200/80 flex items-center gap-1 text-xs font-bold">
            {[
              { id: 'all', label: 'All Services' },
              { id: 'construction', label: 'Civil Build' },
              { id: 'planning', label: 'Maps & RCC' },
              { id: 'interiors', label: 'Interiors' },
            ].map((tab) => {
              const isActive = activeCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveCategory(tab.id)}
                  className={`relative px-4 py-2 rounded-xl text-xs font-bold transition-colors z-10 ${
                    isActive ? 'text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="servicesTabIndicator"
                      className="absolute inset-0 bg-slate-900 rounded-xl shadow-sm z-[-1]"
                      transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                    />
                  )}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Slider Prev / Next Arrows */}
          <div className="hidden sm:flex items-center gap-2 ml-2">
            <button
              onClick={() => handleScroll('left')}
              className="w-11 h-11 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-gold-500 text-navy-950 flex items-center justify-center transition active:scale-95 group"
              aria-label="Previous service slide"
            >
              <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
            </button>
            <button
              onClick={() => handleScroll('right')}
              className="w-11 h-11 rounded-2xl bg-navy-950 text-gold-400 hover:bg-navy-900 shadow-md flex items-center justify-center transition active:scale-95 group"
              aria-label="Next service slide"
            >
              <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* ---------------- SLIDING CARDS TRACK (Smooth Touch & Drag Friendly) ---------------- */}
      <div
        ref={scrollContainerRef}
        className="flex gap-6 overflow-x-auto pb-6 pt-2 snap-x snap-mandatory scrollbar-none -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <AnimatePresence mode="popLayout">
          {filteredServices.map((srv, idx) => {
            const Icon = srv.icon;
            return (
              <motion.div
                key={srv.id}
                layout
                initial={{ opacity: 0, scale: 0.92, x: 50 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4, delay: idx * 0.08 }}
                className="w-[88vw] sm:w-[380px] lg:w-[400px] shrink-0 snap-start flex flex-col justify-between bg-white rounded-3xl border border-slate-200/90 shadow-md hover:shadow-2xl hover:border-gold-500/70 transition-all duration-300 group overflow-hidden"
              >
                {/* Image Section with Curtain Reveal & Floating Price Badge */}
                <div className="relative aspect-[16/10] overflow-hidden bg-slate-900">
                  <img
                    src={srv.image}
                    alt={srv.title}
                    className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-700 ease-out"
                    loading="lazy"
                  />
                  {/* Subtle Gradient Shade */}
                  <div className="absolute inset-0 bg-gradient-to-t from-navy-950/80 via-transparent to-black/30" />

                  {/* Top Badges */}
                  <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full bg-navy-950/85 backdrop-blur-md text-gold-400 text-[11px] font-black font-display uppercase tracking-wider border border-white/20 shadow-md">
                      {srv.badge}
                    </span>

                    <span className="px-3 py-1 rounded-full bg-white/95 backdrop-blur-md text-navy-950 text-xs font-black font-display shadow-md">
                      {srv.priceTag}
                    </span>
                  </div>

                  {/* Bottom Category Subtitle on Image */}
                  <div className="absolute bottom-3 left-4 right-4 flex items-center gap-2 text-white">
                    <div className="w-8 h-8 rounded-xl bg-gold-500/90 text-navy-950 flex items-center justify-center font-bold shadow-sm">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold font-display tracking-wide uppercase text-slate-200">
                      {srv.tagline}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <h3 className="text-xl font-extrabold font-display text-navy-950 group-hover:text-gold-700 transition-colors">
                      {srv.title}
                    </h3>
                    <p className="text-slate-600 text-xs sm:text-sm leading-relaxed font-sans line-clamp-3">
                      {srv.desc}
                    </p>
                  </div>

                  {/* Highlights Bullet Pills */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Standard Quality Benchmarks:
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {(srv.highlights || []).map((h, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/80 text-[11px] font-bold text-slate-700"
                        >
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>{h}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Card Action Buttons */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                    <Link
                      to={`/services/${srv.slug}`}
                      className="text-xs font-bold text-slate-700 hover:text-navy-950 flex items-center gap-1 transition"
                    >
                      <span>Full Details</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </Link>

                    <Link
                      to="/dashboard/create-request"
                      className="btn-gold py-2.5 px-4 text-xs font-black rounded-xl shadow-md flex items-center gap-1.5 group-hover:shadow-gold-500/30"
                    >
                      <span>Get Free Quote</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Mobile Swipe Hint Indicator */}
      <div className="sm:hidden flex items-center justify-center gap-2 text-xs font-bold text-slate-400">
        <ChevronLeft className="w-4 h-4 text-gold-600 animate-pulse" />
        <span>Swipe left or right to explore more packages</span>
        <ChevronRight className="w-4 h-4 text-gold-600 animate-pulse" />
      </div>
    </div>
  );
};
