import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  FileCheck,
  Eye,
  SlidersHorizontal,
} from 'lucide-react';

const BUILDGHAR_SLIDES = [
  {
    id: 'buildghar-villa-1',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85',
    alt: 'BuildGhar Contemporary Luxury Villa House Architecture & Elevation',
  },
  {
    id: 'buildghar-home-2',
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=85',
    alt: 'BuildGhar Modern Multi-Story Home Architecture with Landscaped Garden',
  },
  {
    id: 'buildghar-duplex-3',
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=85',
    alt: 'BuildGhar Luxury Duplex House Elevation & Evening Illumination',
  },
  {
    id: 'buildghar-villa-4',
    image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=85',
    alt: 'BuildGhar Iconic Luxury 2-Storey House Elevation with Front Lawn',
  },
  {
    id: 'buildghar-facade-5',
    image: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=85',
    alt: 'BuildGhar Architectural Facade & Premium Residential Elevation',
  },
  {
    id: 'buildghar-modern-6',
    image: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=85',
    alt: 'BuildGhar Modern Residential House with Glass Facade & Courtyard',
  },
  {
    id: 'buildghar-luxury-7',
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=85',
    alt: 'BuildGhar Contemporary Architectural Villa Panoramic Landscape',
  },
];

export const Hero: React.FC = () => {
  const navigate = useNavigate();

  // Interactive Estimator State
  const [selectedService, setSelectedService] = useState('planning');
  const [plotArea, setPlotArea] = useState('1200');
  const [city, setCity] = useState('Delhi NCR');

  // Interactive Visualizer Slider State with Continuous Automatic Rotation
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const SLIDE_DURATION = 3500; // 3.2 seconds automatic slide interval

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlideIndex((prev) => (prev + 1) % BUILDGHAR_SLIDES.length);
    }, SLIDE_DURATION);

    return () => clearInterval(timer);
  }, []);

  const currentSlide = BUILDGHAR_SLIDES[activeSlideIndex] || BUILDGHAR_SLIDES[0];

  const handlePrevSlide = () => {
    setActiveSlideIndex((prev) => (prev - 1 + BUILDGHAR_SLIDES.length) % BUILDGHAR_SLIDES.length);
  };

  const handleNextSlide = () => {
    setActiveSlideIndex((prev) => (prev + 1) % BUILDGHAR_SLIDES.length);
  };

  // Estimate Calculation
  const getDynamicEstimate = () => {
    const area = parseInt(plotArea) || 1200;
    if (selectedService === 'planning') {
      const min = Math.round((area * 14) / 1000) * 1000;
      const max = Math.round((area * 22) / 1000) * 1000;
      return `₹${min.toLocaleString('en-IN')} - ₹${max.toLocaleString('en-IN')} (Full 2D+3D Blueprint Set)`;
    } else if (selectedService === 'construction') {
      const minLakhs = ((area * 1650) / 100000).toFixed(1);
      const maxLakhs = ((area * 2100) / 100000).toFixed(1);
      return `₹${minLakhs}L - ₹${maxLakhs}L (@ ₹1,650/sq.ft Complete Build)`;
    } else if (selectedService === 'renovation') {
      const minLakhs = ((area * 350) / 100000).toFixed(1);
      const maxLakhs = ((area * 650) / 100000).toFixed(1);
      return `₹${minLakhs}L - ₹${maxLakhs}L (Custom Renovation)`;
    } else if (selectedService === 'structural') {
      const min = Math.round((area * 8) / 1000) * 1000;
      const max = Math.round((area * 14) / 1000) * 1000;
      return `₹${min.toLocaleString('en-IN')} - ₹${max.toLocaleString('en-IN')} (IS 456 RCC Schedules)`;
    } else {
      const minLakhs = ((area * 750) / 100000).toFixed(1);
      const maxLakhs = ((area * 1050) / 100000).toFixed(1);
      return `₹${minLakhs}L - ₹${maxLakhs}L (Direct Wholesale Materials)`;
    }
  };

  const handleGetQuotes = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/dashboard/create-request', {
      state: {
        prefill: {
          service: selectedService,
          plotArea,
          city,
        },
      },
    });
  };

  return (
    <section className="relative pt-4 sm:pt-6 pb-6 sm:pb-8 bg-gradient-to-b from-[#edf4fc] via-[#f7faff] to-[#edf4fc]/70 overflow-hidden">
      
      {/* 1. AMBIENT GLOWING ORBS WITH BLUR (Luminous Sapphire & Amber Light Field) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <motion.div
          animate={{
            x: [0, 40, 0],
            y: [0, -30, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-10 left-1/4 w-[480px] h-[480px] bg-gradient-to-br from-amber-400/20 via-gold-300/15 to-transparent rounded-full blur-[100px]"
        />
        <motion.div
          animate={{
            x: [0, -40, 0],
            y: [0, 40, 0],
            scale: [1, 1.15, 1],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/4 -right-20 w-[550px] h-[550px] bg-gradient-to-bl from-blue-500/25 via-sky-400/20 to-transparent rounded-full blur-[120px]"
        />
        <motion.div
          animate={{
            scale: [1, 1.25, 1],
            opacity: [0.35, 0.7, 0.35],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -bottom-10 left-1/3 w-[450px] h-[450px] bg-gradient-to-tr from-sky-400/20 via-blue-300/15 to-transparent rounded-full blur-[110px]"
        />
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          
          {/* Left Column: Authoritative Editorial Copy & Frosted Glass Estimator */}
          <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
            
            {/* Sliding Trust Pill with Glowing Dot */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 backdrop-blur-xl border border-amber-200/90 text-amber-900 text-xs font-bold shadow-sm shadow-amber-500/10 hover:shadow-md transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0 animate-spin" style={{ animationDuration: '10s' }} />
              <span className="tracking-tight">India's Premier Construction & Civil Marketplace</span>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
            </motion.div>

            {/* Headline: "Your House | Your Budget" + "No Surprise." in exact same font */}
            <div className="space-y-1 sm:space-y-1.5">
              <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-[2.6rem] xl:text-[3.25rem] font-black font-display text-slate-900 tracking-tight leading-[1.25] overflow-visible">
                {/* Line 1: Your House | Your Budget */}
                <div className="flex flex-nowrap items-center justify-center lg:justify-start gap-x-2 sm:gap-x-3 md:gap-x-4 overflow-visible pb-1">
                  {/* "Your House" */}
                  <motion.span
                    initial={{ opacity: 0, y: 25 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="text-slate-900 inline-block drop-shadow-xs shrink-0"
                  >
                    Your House
                  </motion.span>

                  {/* Luminous Vertical Laser Divider Beam */}
                  <motion.div
                    initial={{ scaleY: 0, opacity: 0 }}
                    animate={{ scaleY: 1, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.5, ease: 'backOut' }}
                    className="inline-flex items-center justify-center align-middle shrink-0"
                  >
                    <span className="w-1 sm:w-1.5 md:w-2 h-6 sm:h-8 md:h-10 lg:h-11 rounded-full bg-gradient-to-b from-amber-400 via-amber-500 to-amber-600 shadow-[0_0_12px_rgba(245,158,11,0.6)]" />
                  </motion.div>

                  {/* "Your Budget" with pb-3 -mb-3 so 'g' descender is NEVER clipped */}
                  <motion.span
                    initial={{ opacity: 0, y: 25 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700 bg-clip-text text-transparent inline-block pb-3 -mb-3 overflow-visible shrink-0"
                  >
                    Your Budget
                  </motion.span>
                </div>

                {/* Line 2: "No Surprise." - Centered & Logo Color Combination (Navy + Radiant Gold) */}
                <div className="w-full flex items-center justify-center text-center overflow-visible pt-1.5 sm:pt-2.5">
                  <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 0.25, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="inline-flex items-center justify-center text-center overflow-visible select-none"
                  >
                    {/* "No" in Logo Royal Navy Blue */}
                    <span className="text-navy-950 font-display font-black tracking-tight inline-block drop-shadow-xs">
                      No
                    </span>
                    <span className="w-2 sm:w-2.5" />
                    {/* "Surprise" in Logo Radiant Gold Gradient with Specular Glow & Unclipped 'p' */}
                    <span
                      className="bg-gradient-to-r from-amber-500 via-gold-400 to-amber-600 bg-clip-text text-transparent font-display font-black tracking-tight inline-block pb-3 -mb-3 overflow-visible"
                      style={{
                        filter: 'drop-shadow(0 2px 8px rgba(245, 158, 11, 0.3))',
                      }}
                    >
                      Surprise
                    </span>
                    
                  </motion.div>
                </div>
              </h1>
            </div>

            {/* Exact Paragraph requested by user */}
            <motion.p
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed font-sans"
            >
              Predictable pricing, vetted engineers & contractors, and zero hidden costs. Compare itemized BOQ quotes, manage staged escrow tranches, and track site milestones with total peace of mind.
            </motion.p>

            {/* Interactive Hero Requirement Estimator (Frosted Glassmorphism & Smooth Sliding Inputs) */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="relative rounded-3xl p-5 sm:p-6 bg-white/85 backdrop-blur-2xl border border-blue-100/90 shadow-[0_20px_50px_-10px_rgba(20,60,130,0.08)] max-w-2xl text-left transition-all hover:shadow-[0_25px_60px_-10px_rgba(59,130,246,0.12)] group"
            >
              {/* Luminous Shining Sheen on Top of Card */}
              <div className="absolute inset-x-0 -top-px h-[2px] bg-gradient-to-r from-transparent via-amber-400/70 via-sky-300/60 to-transparent rounded-t-3xl pointer-events-none" />

              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100/90">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
                  Instant Project Estimator & Quote Finder
                </span>
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded-full border border-emerald-300 shadow-2xs">
                  Free 3-Contractor Bids
                </span>
              </div>

              <form onSubmit={handleGetQuotes} className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Service Selector */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                      <span>Select Service</span>
                    </label>
                    <select
                      value={selectedService}
                      onChange={(e) => setSelectedService(e.target.value)}
                      className="w-full px-3 py-2.5 text-xs font-semibold bg-white/90 backdrop-blur-md border border-slate-200/90 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs transition hover:border-slate-300"
                    >
                      <option value="planning">📐 2D Map & 3D Elevation</option>
                      <option value="construction">🏠 New House Construction</option>
                      <option value="renovation">🔨 Home Renovation</option>
                      <option value="structural">🏛️ Structural RCC Engineering</option>
                      <option value="materials">🧱 Bulk Building Materials</option>
                    </select>
                  </div>

                  {/* Plot Area */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Plot Area (sq.ft)</label>
                    <select
                      value={plotArea}
                      onChange={(e) => setPlotArea(e.target.value)}
                      className="w-full px-3 py-2.5 text-xs font-semibold bg-white/90 backdrop-blur-md border border-slate-200/90 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs transition hover:border-slate-300"
                    >
                      <option value="800">800 sq.ft (Small Plot)</option>
                      <option value="1000">1,000 sq.ft (Standard 20x50)</option>
                      <option value="1200">1,200 sq.ft (Popular 30x40)</option>
                      <option value="1500">1,500 sq.ft (Spacious 30x50)</option>
                      <option value="2000">2,000 sq.ft (Large 40x50)</option>
                      <option value="2400">2,400+ sq.ft (Luxury Villa)</option>
                    </select>
                  </div>

                  {/* City Selector */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">City / Region</label>
                    <select
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3 py-2.5 text-xs font-semibold bg-white/90 backdrop-blur-md border border-slate-200/90 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs transition hover:border-slate-300"
                    >
                      <option value="Delhi NCR">Delhi NCR / Noida / Gurugram</option>
                      <option value="Mumbai">Mumbai / MMR</option>
                      <option value="Bengaluru">Bengaluru</option>
                      <option value="Lucknow">Lucknow / UP</option>
                      <option value="Jaipur">Jaipur / Rajasthan</option>
                      <option value="Pune">Pune</option>
                      <option value="Hyderabad">Hyderabad</option>
                      <option value="Patna">Patna / Bihar</option>
                    </select>
                  </div>
                </div>

                {/* Dynamic Calculated Budget Bar with Sliding Pill */}
                <motion.div
                  layout
                  className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-gradient-to-r from-amber-50/70 via-slate-50/80 to-amber-50/50 backdrop-blur-md p-3 rounded-2xl border border-amber-200/70"
                >
                  <div className="text-left">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 block">
                      Estimated Cost Guidance:
                    </span>
                    <motion.span
                      key={selectedService + plotArea}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs sm:text-sm font-extrabold text-slate-900 block"
                    >
                      {getDynamicEstimate()}
                    </motion.span>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    type="submit"
                    className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-full bg-navy-950 hover:bg-navy-900 border border-amber-500/40 text-white text-xs font-bold transition shadow-sm hover:shadow-lg hover:shadow-amber-500/10 active:scale-95 shrink-0"
                  >
                    <span>Get 3 Verified Quotes</span>
                    <ArrowRight className="w-3.5 h-3.5 text-amber-400 group-hover:translate-x-1 transition-transform" />
                  </motion.button>
                </motion.div>
              </form>
            </motion.div>

            {/* 3 Executive Trust Pillars with Hover Lift */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="grid grid-cols-3 gap-2 sm:gap-3 pt-1 max-w-2xl text-left"
            >
              {[
                { icon: ShieldCheck, text: 'COA Licensed Pros', color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { icon: FileCheck, text: 'Itemized BOQ Quotes', color: 'text-blue-600', bg: 'bg-blue-50' },
                { icon: CheckCircle2, text: 'Milestone Escrow', color: 'text-amber-600', bg: 'bg-amber-50' },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div
                    key={i}
                    className="p-2 sm:p-2.5 rounded-2xl bg-white/80 backdrop-blur-md border border-slate-200/80 shadow-2xs hover:shadow-md transition-all flex items-center gap-2 group"
                  >
                    <div className={`w-7 h-7 rounded-xl ${item.bg} flex items-center justify-center shrink-0`}>
                      <Icon className={`w-4 h-4 ${item.color} group-hover:scale-110 transition-transform`} />
                    </div>
                    <span className="text-[11px] sm:text-xs font-bold text-slate-800 leading-tight">
                      {item.text}
                    </span>
                  </div>
                );
              })}
            </motion.div>
          </div>

          {/* Right Column: Project Visualizer with Sliding Tab Pill & Frosted Glass */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-6 relative w-full"
          >
            {/* Visualizer Shell (Frosted Glass & Luxury Border) */}
            <div className="bg-white/85 backdrop-blur-2xl rounded-3xl p-2.5 sm:p-3 border border-blue-100/90 shadow-[0_25px_60px_-15px_rgba(15,23,42,0.15)] relative overflow-hidden transition-all duration-300 hover:shadow-2xl">
              
              {/* Automatic Sliding Visual Display Frame - Text-Free, Larger Image, Non-stop Auto Transition */}
              <div className="aspect-[16/10] w-full rounded-2xl overflow-hidden relative bg-gradient-to-br from-[#ebf4fd] via-[#f2f7fe] to-[#e4f0fc] border border-blue-200/80 shadow-inner group">
                
                {/* Auto-Slide Progress Bar */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-black/30 z-30 overflow-hidden">
                  <motion.div
                    key={activeSlideIndex}
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: SLIDE_DURATION / 1000, ease: 'linear' }}
                    className="h-full bg-gradient-to-r from-amber-400 via-gold-400 to-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]"
                  />
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentSlide.id}
                    initial={{ opacity: 0, scale: 1.03 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.6, ease: 'easeInOut' }}
                    className="w-full h-full relative"
                  >
                    <img
                      src={currentSlide.image}
                      alt={currentSlide.alt}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                    />
                  </motion.div>
                </AnimatePresence>

                {/* Left Arrow Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrevSlide();
                  }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-navy-950/70 hover:bg-navy-950 text-white backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 z-20 shadow-lg active:scale-95 border border-white/20"
                  aria-label="Previous Slide"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                {/* Right Arrow Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNextSlide();
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-navy-950/70 hover:bg-navy-950 text-white backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 z-20 shadow-lg active:scale-95 border border-white/20"
                  aria-label="Next Slide"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                {/* Clean Slide Dots Indicators */}
                <div className="absolute bottom-3.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/15">
                  {BUILDGHAR_SLIDES.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveSlideIndex(idx)}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        activeSlideIndex === idx
                          ? 'w-7 bg-amber-400 shadow-sm shadow-amber-400/50'
                          : 'w-2 bg-white/60 hover:bg-white'
                      }`}
                      aria-label={`Slide ${idx + 1}`}
                    />
                  ))}
                </div>
              </div>

            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};
