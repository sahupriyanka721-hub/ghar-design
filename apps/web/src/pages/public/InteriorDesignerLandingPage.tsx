import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Palette,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ChevronDown,
  Check,
  Layers,
  Building2,
  CreditCard,
  Star,
  FileCheck2,
  Zap,
  PhoneCall,
  Clock,
  Eye,
  Sliders,
  DollarSign,
  Maximize2,
  Box,
  Image as ImageIcon,
} from 'lucide-react';
import { ALL_INTERIOR_SPECIALIZATIONS, SEED_INTERIOR_DESIGNERS } from '../../data/interiorDesignerStore.js';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';

export const InteriorDesignerLandingPage: React.FC = () => {
  // Auto-scroll on initial load or anchor change
  React.useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (!hash) return;
      if (hash === 'overview') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      setTimeout(() => {
        const el = document.getElementById(hash);
        if (el) {
          const headerOffset = 76;
          const targetPos = el.getBoundingClientRect().top + window.pageYOffset - headerOffset;
          window.scrollTo({ top: Math.max(0, targetPos), behavior: 'smooth' });
        }
      }, 100);
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const { loginProfessionalWithOtp } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const handleTestLogin = async (phone: string, name: string) => {
    try {
      await loginProfessionalWithOtp(phone, '123456', name);
      success(`Logged in as Interior Designer: ${name}`);
      navigate('/interior-designer/dashboard');
    } catch (e: any) {
      error(e.message || 'Demo login failed');
    }
  };

  const categories = ['All', 'Residential', 'Rooms', 'Kitchen', 'Storage', 'Commercial', 'Fitout', 'Furniture'];

  const filteredSpecializations =
    selectedCategory === 'All'
      ? ALL_INTERIOR_SPECIALIZATIONS
      : ALL_INTERIOR_SPECIALIZATIONS.filter((s) => s.category.toLowerCase().includes(selectedCategory.toLowerCase()));

  const faqs = [
    {
      q: 'Who is eligible to join as an Interior Design Professional on BuildGhar?',
      a: 'Individual interior designers, freelance stylists, boutique interior Design Centers, and full-service luxury interior architecture firms with experience in luxury residential, commercial, or modular kitchen execution are eligible.',
    },
    {
      q: 'How does the 100% Escrow Milestone Payout system work?',
      a: 'Homeowners deposit 100% of each project milestone fee into an escrow account before design or execution begins. Once the design phase (concept, 2D plans, 3D renders) or site execution (carpentry, false ceiling, finishes) is completed and approved, funds are automatically transferred to your bank account with zero payment chasing.',
    },
    {
      q: 'What documents are required for Interior Designer verification?',
      a: 'You need to upload: 1) Business or Personal PAN Card, 2) Aadhaar/Identity Proof, 3) Professional Qualification Degree or Diploma certificate, 4) GSTIN (if registered), and 5) At least 1-2 completed portfolio projects with before-and-after photographs or 3D renders.',
    },
    {
      q: 'Can I provide design-only services, or must I provide full execution?',
      a: 'Both options are supported! You can register as a design-only consultancy (2D drawings, 3D visualization, mood boards) or offer complete execution contracts with modular supply, carpentry, civil modifications, and on-site styling.',
    },
    {
      q: 'How quickly does the Admin Governance Desk review applications?',
      a: 'Our operations team reviews submissions within 24 to 48 hours. If additional clarifications are required, the status updates to DOCUMENTS_REQUIRED and you can re-upload specific items directly.',
    },
    {
      q: 'Is there any upfront joining fee for Interior Designers?',
      a: 'No. Registration, Professional Profile setup, and portfolio hosting are completely free. BuildGhar charges only a transparent nominal commission fee on successfully released milestone payouts.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f0f7ff] via-[#f8fbff] to-white text-slate-800 font-sans selection:bg-sky-200 selection:text-sky-950">
      {/* ---------------- 1. HERO SECTION ---------------- */}
      <section id="overview" className="relative pt-12 pb-20 overflow-hidden border-b border-blue-100 scroll-mt-24">
        {/* Ambient Teal / Emerald Atmospheric Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-r from-sky-200/40 via-blue-200/30 to-indigo-100/30 blur-3xl pointer-events-none rounded-full" />
        <div className="absolute -top-20 right-10 w-96 h-96 bg-amber-200/20 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto space-y-5">
            {/* Top Pill Badge */}
            <motion.div
              initial={{ opacity: 0, y: -15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 border border-blue-300 text-navy-950 text-xs font-black uppercase tracking-wider shadow-sm font-mono"
            >
              <Palette className="w-4 h-4 text-blue-600 animate-spin-slow" />
              <span>BuildGhar Interior Design & Spatial Architecture Network</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </motion.div>

            {/* Display Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-black font-display text-navy-950 tracking-tight leading-[1.15]"
            >
              Empowering India's Elite{' '}
              <span className="bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-700 bg-clip-text text-transparent">
                Interior Designers & Firms
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-base sm:text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed font-medium"
            >
              Connect with high-intent homeowners across Delhi NCR, build room-wise itemized BOQs, upload 3D renders
              & mood boards, and receive 100% escrow-backed milestone payouts with zero defaults.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4"
            >
              <Link
                to="/interior-designer/register"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-700 hover:from-sky-500 hover:to-blue-600 text-white font-extrabold text-sm shadow-lg shadow-sky-600/25 hover:shadow-xl hover:scale-[1.02] active:scale-[0.99] transition-all flex items-center justify-center gap-2 group"
              >
                <span>Register as Interior Designer</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                to="/interior-designer/login"
                className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-white hover:bg-blue-50/80 text-navy-950 border-2 border-blue-200 hover:border-blue-400 font-extrabold text-sm shadow-sm transition-all flex items-center justify-center gap-2"
              >
                <Palette className="w-4 h-4 text-blue-600" />
                <span>Interior Designer Sign In</span>
              </Link>
            </motion.div>

            {/* Metrics */}
            <div className="pt-10 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
              {[
                { label: 'Verified Design Centers', value: '240+', icon: Palette },
                { label: 'Interior Escrow Released', value: '₹18.4 Cr+', icon: CreditCard },
                { label: 'Completed Residencies', value: '820+', icon: Building2 },
                { label: 'Client Satisfaction', value: '4.9 / 5', icon: Star },
              ].map((m, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-white/95 border border-blue-100 shadow-xs hover:border-blue-300 transition-all text-center"
                >
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center mb-2">
                    <m.icon className="w-4 h-4" />
                  </div>
                  <div className="text-2xl font-black font-display text-navy-950">{m.value}</div>
                  <div className="text-xs font-semibold text-slate-500 mt-0.5">{m.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- 2. 4-STEP ONBOARDING JOURNEY ---------------- */}
      <section id="process" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-navy-950 text-xs font-bold uppercase tracking-wider font-mono">
            <Zap className="w-3.5 h-3.5 text-blue-600" />
            <span>Frictionless Partner Journey</span>
          </div>
          <h2 className="text-3xl font-black font-display text-navy-950">How Interior Designer Onboarding Works</h2>
          <p className="text-sm text-slate-600">
            A transparent pathway from phone OTP registration to receiving high-budget customer assignments.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            {
              step: '01',
              title: 'Mobile OTP Sign Up',
              desc: 'Sign up with your +91 Indian mobile number, verify OTP in 10 seconds, and agree to platform terms.',
              tag: '10 Seconds',
              icon: PhoneCall,
            },
            {
              step: '02',
              title: '8-Step Professional Profile',
              desc: 'Enter business details, pick from 19 specializations, upload qualifications, KYC documents & past portfolio.',
              tag: '8-Step Wizard',
              icon: FileCheck2,
            },
            {
              step: '03',
              title: 'Admin Verification',
              desc: 'Our governance desk audits credentials and past projects within 24 to 48 hours for quality assurance.',
              tag: 'Fast-Track 24-48h',
              icon: ShieldCheck,
            },
            {
              step: '04',
              title: 'Launch Design Center',
              desc: 'Receive direct client briefs, build room-wise BOQ estimates, upload 3D renders, and get escrow payouts.',
              tag: 'Guaranteed Escrow',
              icon: Palette,
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="p-6 rounded-3xl bg-white border-2 border-blue-100 shadow-sm hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                    <item.icon className="w-6 h-6" />
                  </div>
                  <span className="text-3xl font-black font-mono text-blue-200 group-hover:text-blue-300 transition-colors">
                    {item.step}
                  </span>
                </div>
                <div className="inline-block px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 text-[10px] font-black uppercase mb-2">
                  {item.tag}
                </div>
                <h3 className="text-lg font-bold text-navy-950 mb-2">{item.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center text-xs font-bold text-blue-700 group-hover:text-blue-800">
                <span>Phase {item.step}</span>
                <ArrowRight className="w-3.5 h-3.5 ml-auto group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- 3. ALL 19 MASTER INTERIOR SPECIALIZATIONS ---------------- */}
      <section id="services" className="py-16 bg-gradient-to-b from-teal-50/60 to-white border-y border-blue-100 scroll-mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10 space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-navy-950 text-xs font-bold uppercase tracking-wider font-mono">
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span>Full Scope of Interior Design</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black font-display text-navy-950">
              19 Interior Design Specializations
            </h2>
            <p className="text-sm text-slate-600">
              Select your firm's exact proficiencies. Homeowners can commission individual room transformations or
              complete residential contracts.
            </p>

            {/* Filter Tabs */}
            <div className="pt-4 flex flex-wrap items-center justify-center gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                    selectedCategory === cat
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white text-slate-600 hover:bg-blue-100/70 border border-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSpecializations.map((srv, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-white border border-blue-100 hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-800 border border-blue-200">
                      {srv.category}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-400">#{idx + 1}</span>
                  </div>
                  <h4 className="text-sm font-bold text-navy-950 mb-1.5 group-hover:text-blue-700 transition-colors">
                    {srv.name}
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">{srv.desc}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                  <span>Standard IS / IIID Compliant</span>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- 4. INTERIOR Design Center ADVANTAGES ---------------- */}
      <section id="studio" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-5 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
              <span>Zero Payment Delay Guarantee</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black font-display text-navy-950 leading-tight">
              Why Premier Interior Designs Choose BuildGhar
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              We eliminate traditional pain points: delayed milestone payments, unvetted clients, and scope revisions
              without budget adjustments.
            </p>

            <div className="space-y-3 pt-2">
              {[
                {
                  title: '100% Escrow Milestone Payouts',
                  desc: 'Every milestone (concept, 3D renders, carpentry shell, final styling) is funded into Escrow before work begins.',
                },
                {
                  title: 'Room-Wise BOQ Builder',
                  desc: 'Itemize modular kitchens, wardrobes, false ceilings, and decor line items with automatic tax and discount calculations.',
                },
                {
                  title: 'Centralized 3D Design & Client Approvals',
                  desc: 'Share 2D floor plans, 3ds Max/V-Ray renders, and material finishes with clients with explicit revision version tracking.',
                },
              ].map((feat, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3.5 rounded-2xl bg-white border border-blue-100 shadow-2xs">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">{feat.title}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">{feat.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <Link
                to="/interior-designer/register"
                className="inline-flex items-center gap-2 text-xs font-black text-blue-700 hover:text-navy-950 group"
              >
                <span>Read Full Professional Partner Guidelines</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Right Visual Card */}
          <div className="lg:col-span-7 bg-gradient-to-br from-[#e8f3fe] via-[#f1f7fe] to-[#e4f0fc] text-slate-800 rounded-3xl p-6 sm:p-8 border border-blue-200/90 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between pb-6 border-b border-blue-200/80">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 border border-blue-200 text-blue-700 flex items-center justify-center">
                  <Palette className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-sm font-black text-navy-950">Live Interior Designer Workspace</div>
                  <div className="text-xs text-blue-700 font-mono font-bold">14 Integrated Modules Ready</div>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold font-mono">
                Active Partner Panel
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
              <div className="p-4 rounded-2xl bg-white/95 border border-blue-200/80 shadow-xs">
                <div className="text-xs text-slate-500 font-medium">Assigned Quotation Requests</div>
                <div className="text-2xl font-black text-navy-950 mt-1">9 Active Briefs</div>
                <div className="text-[11px] text-emerald-700 mt-1 flex items-center gap-1 font-mono font-medium">
                  <span>DLF Aralias • Camellias • Nirvana</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/95 border border-blue-200/80 shadow-xs">
                <div className="text-xs text-slate-500 font-medium">Escrow Protected Payouts</div>
                <div className="text-2xl font-black text-amber-700 mt-1">₹6,80,000</div>
                <div className="text-[11px] text-slate-600 mt-1 font-medium">Ready for milestone settlement</div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/90 border border-blue-200/80 text-xs text-navy-950 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="font-medium">End-to-End Escrow Protection & Design Version Control</span>
              </div>
              <Link
                to="/interior-designer/login"
                className="text-xs font-bold text-blue-700 hover:text-blue-900 underline shrink-0 ml-2"
              >
                Sign In to Panel →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- 5. TESTIMONIALS ---------------- */}
      <section id="escrow" className="py-16 bg-gradient-to-b from-white via-teal-50/40 to-white border-t border-blue-100 scroll-mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold uppercase tracking-wider">
              <Star className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
              <span>Partner Reviews</span>
            </div>
            <h2 className="text-3xl font-black font-display text-navy-950">Trusted by India's Top Interior Designs</h2>
            <p className="text-sm text-slate-600">Hear how registered interior designers grow their practice on BuildGhar.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: 'Pooja Mehra',
                firm: 'Pooja Mehra Luxury Living & Interiors (Gurugram)',
                quote:
                  'The escrow payment structure is a game changer for interior designers. In the past, clients would dispute 10-15% of final styling fees. Here, funds are pre-allocated and released immediately on design sign-off.',
                rating: 5,
              },
              {
                name: 'Kunal Bansal',
                firm: 'Aura Interior Spaces (New Delhi)',
                quote:
                  'The quotation builder lets us itemize room-wise modular kitchens, false ceilings, and finishes with clean tax breakdowns. Customers appreciate the clarity and quotation conversion is exceptionally high.',
                rating: 5,
              },
              {
                name: 'Siddharth Varma',
                firm: 'Varma Interior Architecture Lab (Noida)',
                quote:
                  'Having a dedicated 3D visual approval hub and site snag manager inside the platform has cut our project delivery timeline by 3 weeks per home.',
                rating: 5,
              },
            ].map((t, idx) => (
              <div
                key={idx}
                className="p-6 rounded-3xl bg-white border border-blue-100 shadow-sm hover:border-blue-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-1 text-amber-500 mb-3">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-xs text-slate-600 italic leading-relaxed mb-4">"{t.quote}"</p>
                </div>
                <div className="pt-4 border-t border-slate-100">
                  <div className="font-extrabold text-navy-950 text-sm">{t.name}</div>
                  <div className="text-[11px] text-slate-500 font-medium">{t.firm}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- 6. FAQS ---------------- */}
      <section id="faq" className="py-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24">
        <div className="text-center mb-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-navy-950 text-xs font-bold uppercase tracking-wider font-mono">
            <Zap className="w-3.5 h-3.5 text-blue-600" />
            <span>Frequently Asked Questions</span>
          </div>
          <h2 className="text-3xl font-black font-display text-navy-950">Interior Designer Partner FAQs</h2>
          <p className="text-sm text-slate-600">Everything you need to know about registering your practice on BuildGhar.</p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-blue-200/80 bg-white overflow-hidden shadow-2xs transition-all"
            >
              <button
                onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-navy-950 hover:text-blue-700 transition"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-blue-600 shrink-0 transition-transform duration-200 ${
                    activeFaq === idx ? 'rotate-180' : ''
                  }`}
                />
              </button>
              <AnimatePresence>
                {activeFaq === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-teal-50 pt-3">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- 7. BOTTOM CTA BANNER ---------------- */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-700 rounded-3xl p-8 sm:p-12 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-2 max-w-xl text-center md:text-left relative z-10">
            <span className="px-3 py-1 rounded-full bg-white/20 text-white text-[11px] font-black uppercase tracking-wider font-mono">
              Join 240+ Elite Design Centers
            </span>
            <h2 className="text-3xl sm:text-4xl font-black font-display">Ready to Grow Your Interior Practice?</h2>
            <p className="text-xs sm:text-sm text-blue-100 font-medium">
              Register Your Practice today. Connect with qualified homeowners and secure guaranteed escrow milestone payouts.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 relative z-10 w-full sm:w-auto">
            <Link
              to="/interior-designer/register"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-white hover:bg-blue-50 text-navy-950 font-black text-xs sm:text-sm shadow-md transition-all text-center flex items-center justify-center gap-2 group"
            >
              <span>Apply as Interior Designer</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/interior-designer/login"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-navy-900/60 hover:bg-navy-900/80 text-white border border-white/20 font-black text-xs sm:text-sm transition-all text-center"
            >
              Designer Sign In
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
