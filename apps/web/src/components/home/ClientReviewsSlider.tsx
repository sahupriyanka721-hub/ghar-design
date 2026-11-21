import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { Star, ShieldCheck, CheckCircle2, ChevronLeft, ChevronRight, Quote } from 'lucide-react';

interface ReviewItem {
  id: string;
  name: string;
  location: string;
  projectType: string;
  rating: number;
  highlightTag: string;
  quote: string;
  avatar: string;
}

const CLIENT_REVIEWS: ReviewItem[] = [
  {
    id: 'rev-1',
    name: 'Sanjay & Meera Rathore',
    location: 'Sector 57, Gurugram',
    projectType: '4 BHK Independent Luxury Villa',
    rating: 5,
    highlightTag: 'Saved ₹12.5 Lakhs in Markups',
    quote:
      'We received 3 contractor quotes locally that varied by ₹25 Lakhs without any explanation. BuildGhar gave us itemized BOQs with exact Tata Tiscon steel grades and staged escrow payments. Best decision we ever made.',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
  },
  {
    id: 'rev-2',
    name: 'Dr. Anandita Sen',
    location: 'Greater Kailash, New Delhi',
    projectType: 'G+2 Duplex Modern Rebuild',
    rating: 5,
    highlightTag: '100% Vastu & Municipal Sanction',
    quote:
      'Our assigned engineering lead handled our municipal drawings, structural RCC load testing, and 3D elevations. The Admin review ensured no contractor cut corners on the foundation footing. Handover was on exact scheduled date.',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
  },
  {
    id: 'rev-3',
    name: 'Rohan & Neha Kulkarni',
    location: 'Whitefield, Bengaluru',
    projectType: 'Luxury Interior Fitout',
    rating: 5,
    highlightTag: '45-Day Handover Guaranteed',
    quote:
      'The milestone escrow gave us complete peace of mind. We did not have to run after carpenters. Each tranche was released only after on-site inspection. True 5-star professional experience!',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
  },
  {
    id: 'rev-4',
    name: 'Col. Pradeep Bakshi (Retd.)',
    location: 'DLF Phase 1, Gurugram',
    projectType: 'Complete House Reconstruction',
    rating: 5,
    highlightTag: 'Zero Unplanned Extra Costs',
    quote:
      'In traditional construction, contractors demand 20-30% extra midway citing material inflation. BuildGhar locked the BOQ prices upfront. Every single bag of cement was tracked digitally in my customer dashboard.',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80',
  },
];

export const ClientReviewsSlider: React.FC = () => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = (dir: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = window.innerWidth < 640 ? 300 : 400;
      scrollRef.current.scrollBy({
        left: dir === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="space-y-8">
      {/* Title & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-50 border border-gold-200 text-gold-950 text-xs font-bold uppercase tracking-wider">
            <Star className="w-3.5 h-3.5 fill-gold-500 text-gold-500" />
            <span>Verified Homeowner Testimonials</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black font-display tracking-tight text-navy-950">
            Trusted by 3,200+ Property Owners
          </h2>
          <p className="text-slate-600 text-sm sm:text-base max-w-xl font-sans">
            Read real stories of how homeowners saved millions and avoided construction delays with our audited marketplace.
          </p>
        </div>

        {/* Slide Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleScroll('left')}
            className="w-11 h-11 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-gold-500 text-navy-950 flex items-center justify-center transition active:scale-95 group"
            aria-label="Previous review"
          >
            <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <button
            onClick={() => handleScroll('right')}
            className="w-11 h-11 rounded-2xl bg-navy-950 text-gold-400 hover:bg-navy-900 shadow-md flex items-center justify-center transition active:scale-95 group"
            aria-label="Next review"
          >
            <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* ---------------- SLIDING REVIEWS TRACK ---------------- */}
      <div
        ref={scrollRef}
        className="flex gap-6 overflow-x-auto pb-6 pt-2 snap-x snap-mandatory scrollbar-none -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {CLIENT_REVIEWS.map((rev, idx) => (
          <motion.div
            key={rev.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.45, delay: idx * 0.1 }}
            className="w-[88vw] sm:w-[380px] lg:w-[420px] shrink-0 snap-start bg-white p-7 rounded-3xl border border-slate-200/90 shadow-md hover:shadow-2xl hover:border-gold-500/60 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden"
          >
            {/* Ambient Quote Mark */}
            <Quote className="absolute right-5 top-5 w-16 h-16 text-slate-100 group-hover:text-gold-100/60 transition-colors pointer-events-none" />

            <div className="space-y-4 relative z-10">
              {/* Rating Stars & Highlight Badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {[...Array(rev.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-black uppercase tracking-wider font-display">
                  {rev.highlightTag}
                </span>
              </div>

              {/* Quote Text */}
              <p className="text-slate-700 text-xs sm:text-sm leading-relaxed font-sans italic">
                "{rev.quote}"
              </p>
            </div>

            {/* Author Profile */}
            <div className="pt-5 mt-4 border-t border-slate-100 flex items-center gap-3.5 relative z-10">
              <img
                src={rev.avatar}
                alt={rev.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-gold-400 shadow-sm"
              />
              <div className="text-left font-display">
                <div className="text-sm font-extrabold text-navy-950 flex items-center gap-1.5">
                  <span>{rev.name}</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-gold-600" />
                </div>
                <div className="text-[11px] text-slate-500 font-semibold">{rev.location}</div>
                <div className="text-[10px] text-gold-700 font-bold">{rev.projectType}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
