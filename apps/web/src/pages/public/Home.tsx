import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  CheckCircle2,
  Scale,
  Sparkles,
  ArrowRight,
  Award,
  Truck,
  Compass,
  Palette,
} from 'lucide-react';
import { Hero } from '../../components/home/Hero.js';
import { PartnerMarquee } from '../../components/common/PartnerMarquee.js';
import { ServicesSlider } from '../../components/home/ServicesSlider.js';
import { FeaturedProjectsSlider } from '../../components/home/FeaturedProjectsSlider.js';
import { ProcessCards } from '../../components/home/ProcessCards.js';
import { ClientReviewsSlider } from '../../components/home/ClientReviewsSlider.js';
import { HomeCalculatorSection } from '../../components/home/HomeCalculatorSection.js';

export const Home: React.FC = () => {
  return (
    <div className="overflow-x-hidden relative bg-transparent flex flex-col">

      {/* 1. Hero Section (With Instant Estimator & InterActive Partner) */}
      <Hero />

      {/* 2. Infinite Auto-Sliding Certifications & Material Marquee */}
      <PartnerMarquee />

      {/* 3. Interactive 4-Step Process Cards (Horizontal Sliding with Touch Drag on Mobile) */}
      <section className="py-8 sm:py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <ProcessCards />
      </section>

      {/* 4. Interactive Construction & Material Cost Estimator Calculator */}
      <div className="py-6 sm:py-8 w-full">
        <HomeCalculatorSection />
      </div>

      {/* 6. Core Services Sliding Showcase (Interactive Category Filter Tabs + Photography Cards) */}
      <section className="py-8 sm:py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <ServicesSlider />
      </section>

      {/* 7. Live Ongoing Construction Projects Slider (Photos + Stage Progress Bars) */}
      <section className="py-8 sm:py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <FeaturedProjectsSlider />
      </section>

      {/* 8. Why BuildGhar - Luxury Dark Section (Eliminating Contractor Markups) */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.5 }}
        className="py-8 sm:py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full"
      >
        <div className="bg-gradient-to-br from-[#e8f3fe] via-[#f1f7fe] to-[#e4f0fc] text-slate-800 rounded-3xl p-6 sm:p-10 border border-blue-200/90 shadow-xl relative overflow-hidden">
          {/* Subtle Ambient Gold Glow */}
          <div className="absolute right-0 top-0 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            <div className="lg:col-span-5 space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-900 text-xs font-black uppercase tracking-wider border border-blue-200/90 font-mono">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>Zero Markup Guarantee</span>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black font-display text-navy-950 leading-tight">
                Eliminating Unethical Contractor Markups
              </h2>
              <p className="text-slate-600 text-xs sm:text-sm font-medium leading-relaxed font-sans">
                Traditional construction in India suffers from vague verbal estimates, mid-project cost escalation, and
                substandard materials. BuildGhar establishes rigorous transparency:
              </p>
              <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700 pt-1 font-sans">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <span><strong className="text-navy-950 font-extrabold">No Automatic Lowest Bids:</strong> Admins review structural viability, past portfolio, and technical capability before approving any quotation.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <span><strong className="text-navy-950 font-extrabold">Itemized BOQ Scope:</strong> Every single bag of cement, grade of steel, and brand of sanitaryware is locked in writing upfront.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <span><strong className="text-navy-950 font-extrabold">Milestone Escrow Billing:</strong> Contractors are paid in staged tranches only after you verify on-site milestone progress.</span>
                </li>
              </ul>
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {[
                {
                  icon: '₹',
                  isTextIcon: true,
                  title: 'Fixed Quotation Request Fee',
                  desc: 'A nominal token ensures only genuine property owners receive dedicated attention from our verified professionals.',
                },
                {
                  icon: ShieldCheck,
                  isTextIcon: false,
                  title: 'IEI & Industry Vetted Pros',
                  desc: 'All civil engineers and construction professionals are thoroughly verified with certified industry credentials.',
                },
                {
                  icon: Scale,
                  isTextIcon: false,
                  title: 'Zero Conflict of Interest',
                  desc: 'We are a neutral marketplace. The operations desk evaluates bids solely on technical excellence and fair pricing.',
                },
                {
                  icon: Award,
                  isTextIcon: false,
                  title: 'Full Customer Dashboard',
                  desc: 'Track 10 stages of construction, approve CAD drawings, purchase factory-direct materials, and pay invoices online.',
                },
              ].map((card, idx) => {
                const IconComponent = !card.isTextIcon ? (card.icon as any) : null;
                return (
                  <motion.div
                    key={idx}
                    whileHover={{ y: -4, scale: 1.015 }}
                    className="bg-white/95 p-5 rounded-2xl border border-blue-200/80 shadow-xs hover:border-amber-400 hover:shadow-md cursor-pointer transition-all duration-300"
                  >
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 border border-amber-300/80 flex items-center justify-center font-bold text-base mb-2.5 shadow-xs">
                      {card.isTextIcon ? card.icon : <IconComponent className="w-5 h-5 text-amber-700" />}
                    </div>
                    <h3 className="font-extrabold text-navy-950 text-sm sm:text-base mb-1 font-display">{card.title}</h3>
                    <p className="text-slate-600 text-xs leading-relaxed font-sans font-medium">{card.desc}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </motion.section>

      {/* 7.5 Factory-Direct Building Materials & Depot Supplies Showcase */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.5 }}
        className="py-6 sm:py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full"
      >
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl flex flex-col lg:flex-row items-center justify-between gap-6 relative overflow-hidden">
          <div className="space-y-2.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
              <Truck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Direct Mill & Factory Depot</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black font-display text-navy-950">
              Certified Building Materials & House Supplies
            </h3>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
              UltraTech Cement, Tata Tiscon TMT Steel, AAC blocks, Astral pipes, and electricals delivered directly to your plot with hydraulic crane offloading and verified weighbridge slips.
            </p>
            <div className="flex flex-wrap items-center gap-3.5 text-xs font-semibold text-slate-700 pt-1">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                18% GST ITC Invoice
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                IS / BIS Lab Certified
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Instant Buy Now or Bulk Quote
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 w-full sm:w-auto">
            <Link
              to="/materials"
              className="btn-gold px-6 py-3 rounded-xl text-xs font-black flex items-center justify-center shadow-md hover:scale-[1.02]"
            >
              <span>Explore Materials & Buy Now</span>
            </Link>
          </div>
        </div>
      </motion.section>

      {/* 7.6 Architect & Structural Engineering Partner Network Showcase */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.5 }}
        className="py-6 sm:py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full"
      >
        <div className="bg-gradient-to-r from-sky-50 via-blue-50/60 to-white rounded-3xl p-6 sm:p-8 border-2 border-sky-200/90 shadow-lg flex flex-col lg:flex-row items-center justify-between gap-6 relative overflow-hidden">
          <div className="space-y-2.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-100 text-sky-900 text-xs font-black uppercase font-mono border border-sky-300">
              <Compass className="w-3.5 h-3.5 text-sky-600 animate-spin-slow" />
              <span>Architect & Engineering Partner Network</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black font-display text-navy-950">
              Are You a Council of Architecture (COA) Licensed Architect?
            </h3>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
              Join verified architects and structural engineers across Delhi NCR. Connect with verified landowners, build granular BOQ quotes, and receive 100% escrow-backed milestone payouts.
            </p>
            <div className="flex flex-wrap items-center gap-3.5 text-xs font-bold text-sky-900 pt-1">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-sky-600" />
                21 Design Specializations
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-sky-600" />
                100% Escrow Funding Guarantee
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-sky-600" />
                Direct Landowner Inquiries
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 w-full sm:w-auto">
            <Link
              to="/architect"
              className="px-6 py-3.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md hover:scale-[1.02] transition"
            >
              <Compass className="w-4 h-4" />
              <span>Explore Architect Panel</span>
            </Link>
            <Link
              to="/architect/register"
              className="px-5 py-3.5 rounded-xl bg-white hover:bg-sky-50 text-sky-900 border border-sky-300 font-extrabold text-xs flex items-center justify-center transition"
            >
              <span>Register Practice →</span>
            </Link>
          </div>
        </div>
      </motion.section>

      {/* 7.7 Interior Designer & Spatial Design Partner Showcase */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.5 }}
        className="py-6 sm:py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full"
      >
        <div className="bg-gradient-to-r from-teal-50 via-emerald-50/60 to-white rounded-3xl p-6 sm:p-8 border-2 border-teal-200/90 shadow-lg flex flex-col lg:flex-row items-center justify-between gap-6 relative overflow-hidden">
          <div className="space-y-2.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-100 text-teal-900 text-xs font-black uppercase font-mono border border-teal-300">
              <Palette className="w-3.5 h-3.5 text-teal-600" />
              <span>Interior Design & Spatial Planning Network</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black font-display text-navy-950">
              Are You a Professional Interior Designer or Spatial Design?
            </h3>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
              Showcase your 3D portfolio to high-intent premium homeowners. Receive direct RFQs for full-home luxury interiors, modular kitchens, and bespoke woodwork with guaranteed milestone escrow payouts.
            </p>
            <div className="flex flex-wrap items-center gap-3.5 text-xs font-bold text-teal-900 pt-1">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-teal-600" />
                19 Interior Specializations
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-teal-600" />
                3D CAD & Render Approvals Hub
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-teal-600" />
                100% Escrow Milestone Protection
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 w-full sm:w-auto">
            <Link
              to="/interior-designer"
              className="px-6 py-3.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md hover:scale-[1.02] transition"
            >
              <Palette className="w-4 h-4" />
              <span>Explore Interior Design</span>
            </Link>
            <Link
              to="/interior-designer/register"
              className="px-5 py-3.5 rounded-xl bg-white hover:bg-teal-50 text-teal-900 border border-teal-300 font-extrabold text-xs flex items-center justify-center transition"
            >
              <span>Partner Register &rarr;</span>
            </Link>
          </div>
        </div>
      </motion.section>

      {/* 8. Verified Homeowner Testimonials Slider (with Avatars & Ratings) */}
      <section className="py-8 sm:py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <ClientReviewsSlider />
      </section>

      {/* 9. Bottom High-Impact Call To Action Banner */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.5 }}
        className="py-8 sm:py-12 pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full"
      >
        <div className="bg-gradient-to-r from-gold-500 via-amber-400 to-gold-600 rounded-3xl p-6 sm:p-10 text-navy-950 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden border border-gold-300/40">
          <div className="space-y-2.5 text-center md:text-left relative z-10 max-w-2xl">
            <span className="text-xs font-black uppercase tracking-widest text-navy-900/70 bg-white/40 px-3 py-1 rounded-full">
              Start Building Today
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black font-display tracking-tight text-navy-950">
              Ready to Build Your Luxury Dream Home?
            </h2>
            <p className="text-xs sm:text-sm font-semibold text-navy-900/90 leading-relaxed font-sans">
              Post your property details today. Receive 3+ comprehensive, engineer-reviewed itemized quotations within 48-72 hours.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 relative z-10 w-full sm:w-auto">
            <Link
              to="/dashboard/create-request"
              className="px-6 py-3.5 bg-navy-950 hover:bg-navy-900 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 text-center flex items-center justify-center gap-2 group hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Get Free Quotes</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
            </Link>

            <Link
              to="/services"
              className="px-6 py-3.5 bg-white/95 hover:bg-white text-navy-950 font-extrabold text-xs sm:text-sm rounded-xl shadow-md hover:shadow-lg transition-all duration-300 text-center border border-white hover:scale-[1.02] active:scale-[0.98]"
            >
              Explore Packages
            </Link>
          </div>
        </div>
      </motion.section>
    </div>
  );
};
