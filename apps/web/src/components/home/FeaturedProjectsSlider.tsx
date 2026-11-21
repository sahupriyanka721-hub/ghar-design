import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MapPin,
  Maximize2,
  ShieldCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

interface ProjectCard {
  id: string;
  name: string;
  location: string;
  area: string;
  type: string;
  leadEngineer: string;
  stage: string;
  progressPercent: number;
  escrowStatus: string;
  image: string;
}

const FEATURED_PROJECTS: ProjectCard[] = [
  {
    id: 'proj-1',
    name: 'The Grand Nirvana Villa',
    location: 'Sector 65, Golf Course Ext., Gurugram',
    area: '4,800 sq.ft • 5 BHK',
    type: 'Contemporary Luxury Villa',
    leadEngineer: 'Er. Rajesh Sharma (Certified Civil)',
    stage: 'Stage 8: Flooring & Interior Fitout',
    progressPercent: 82,
    escrowStatus: '₹1.42 Cr Escrow Protected',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'proj-2',
    name: 'Skyline Minimalist Residence',
    location: 'DLF Phase 2, Gurugram, Haryana',
    area: '3,200 sq.ft • G+2 Duplex',
    type: 'Earthquake-Resistant RCC Frame',
    leadEngineer: 'Er. Alok Mathur (IEI Fellow)',
    stage: 'Stage 5: First Floor Slab Cast',
    progressPercent: 58,
    escrowStatus: '₹95 Lakhs Milestone Escrow',
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'proj-3',
    name: 'Heritage Brick & Courtyard Villa',
    location: 'Greater Kailash II, New Delhi',
    area: '5,400 sq.ft • 4 BHK Luxury',
    type: 'Vastu-Compliant Master Residence',
    leadEngineer: 'Er. Sunita Deshmukh (Structural Lead)',
    stage: 'Stage 6: Brickwork & Electrical Piping',
    progressPercent: 68,
    escrowStatus: '₹1.85 Cr Vetted Contract',
    image: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'proj-4',
    name: 'Zenith Glasshouse Penthouse',
    location: 'Whitefield, Bengaluru, Karnataka',
    area: '3,600 sq.ft • Bespoke House Build',
    type: 'Luxury Interior Fitout',
    leadEngineer: 'Er. Vikramaditya Verma',
    stage: 'Stage 10: Final Snagging & Handover',
    progressPercent: 96,
    escrowStatus: 'Final Milestone Settlement',
    image: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80',
  },
];

export const FeaturedProjectsSlider: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleScroll = (dir: 'left' | 'right') => {
    if (containerRef.current) {
      const scrollDist = window.innerWidth < 640 ? 310 : 420;
      containerRef.current.scrollBy({
        left: dir === 'left' ? -scrollDist : scrollDist,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Title & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold uppercase tracking-wider">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            <span>Live Site Progress</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black font-display tracking-tight text-navy-950">
            Real Homes Under Construction
          </h2>
          <p className="text-slate-600 text-sm sm:text-base max-w-xl font-sans">
            Every site is inspected by our chartered engineers with milestone-based funds release. Slide to see ongoing projects.
          </p>
        </div>

        {/* Slide Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleScroll('left')}
            className="w-11 h-11 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-gold-500 text-navy-950 flex items-center justify-center transition active:scale-95 group"
            aria-label="Previous project slide"
          >
            <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <button
            onClick={() => handleScroll('right')}
            className="w-11 h-11 rounded-2xl bg-navy-950 text-gold-400 hover:bg-navy-900 shadow-md flex items-center justify-center transition active:scale-95 group"
            aria-label="Next project slide"
          >
            <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* ---------------- SLIDING PROJECTS TRACK ---------------- */}
      <div
        ref={containerRef}
        className="flex gap-6 overflow-x-auto pb-6 pt-2 snap-x snap-mandatory scrollbar-none -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {FEATURED_PROJECTS.map((proj, idx) => (
          <motion.div
            key={proj.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.45, delay: idx * 0.1 }}
            className="w-[88vw] sm:w-[380px] lg:w-[420px] shrink-0 snap-start bg-white rounded-3xl border border-slate-200/90 shadow-md hover:shadow-2xl hover:border-gold-500/70 transition-all duration-300 group overflow-hidden flex flex-col justify-between"
          >
            {/* Project Image & Floating Badges */}
            <div className="relative aspect-[16/11] overflow-hidden bg-slate-900">
              <img
                src={proj.image}
                alt={proj.name}
                className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-700 ease-out"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy-950/90 via-navy-950/20 to-black/30" />

              {/* Top Details */}
              <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-navy-950/85 backdrop-blur-md text-emerald-400 text-[11px] font-black font-display tracking-wide border border-emerald-500/30 flex items-center gap-1.5 shadow-md">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Verified Active Site</span>
                </span>

                <span className="px-3 py-1 rounded-full bg-white/95 backdrop-blur-md text-navy-950 text-xs font-black font-display shadow-md">
                  {proj.area}
                </span>
              </div>

              {/* Bottom Project Name & Location on Image */}
              <div className="absolute bottom-3.5 left-4 right-4 text-white space-y-1">
                <h3 className="text-lg font-black font-display text-white group-hover:text-gold-300 transition-colors leading-tight">
                  {proj.name}
                </h3>
                <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-gold-400 shrink-0" />
                  <span className="truncate">{proj.location}</span>
                </div>
              </div>
            </div>

            {/* Project Card Body */}
            <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
              {/* Engineer & Escrow Badges */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2 text-slate-700 font-bold">
                    <ShieldCheck className="w-4 h-4 text-purple-600" />
                    <span>{proj.leadEngineer}</span>
                  </div>
                </div>

                {/* Live Milestone Progress Bar */}
                <div className="space-y-1.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-navy-950 font-display">{proj.stage}</span>
                    <span className="text-gold-600 font-black">{proj.progressPercent}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-gold-500 via-amber-400 to-emerald-500 rounded-full transition-all duration-1000"
                      style={{ width: `${proj.progressPercent}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                    <span>10-Stage Inspection System</span>
                    <span className="font-semibold text-emerald-700">{proj.escrowStatus}</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <Link
                  to="/dashboard/create-request"
                  className="btn-primary w-full py-3 text-xs font-black rounded-xl flex items-center justify-center gap-2 shadow-md group-hover:bg-navy-900"
                >
                  <span>Build Similar Home with Us</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
