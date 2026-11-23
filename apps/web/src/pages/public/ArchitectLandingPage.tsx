import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Compass,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  FileCheck2,
  Layers,
  Award,
  Users,
  HardHat,
  ChevronDown,
  Check,
  Zap,
  TrendingUp,
  FileText,
  Lock,
  PhoneCall,
  Clock,
  Eye,
  Star,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import { ALL_ARCHITECTURAL_SERVICES, SEED_ARCHITECTS } from '../../data/architectStore.js';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';

export const ArchitectLandingPage: React.FC = () => {
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
  const [selectedServiceCategory, setSelectedServiceCategory] = useState<string>('All');
  const { loginProfessionalWithOtp } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const handleTestLogin = async (phone: string, name: string) => {
    try {
      await loginProfessionalWithOtp(phone, '123456', name);
      success(`Logged in as test architect: ${name}`);
      navigate('/professional');
    } catch (e: any) {
      error(e.message || 'Demo login failed');
    }
  };

  const serviceCategories = ['All', 'Planning', '3D Visuals', 'Engineering', 'MEP', 'Interior', 'Contracting', 'Costing'];

  const filteredServices =
    selectedServiceCategory === 'All'
      ? ALL_ARCHITECTURAL_SERVICES
      : ALL_ARCHITECTURAL_SERVICES.filter((s) => s.category.toLowerCase().includes(selectedServiceCategory.toLowerCase()));

  const faqs = [
    {
      q: 'Who is eligible to register as an Architect Partner on BuildGhar?',
      a: 'Registered architects holding a valid Council of Architecture (COA) registration number, civil engineering consultancies, structural planning consultancies, and integrated architecture & interior design firms with proven residential or commercial delivery experience are eligible.',
    },
    {
      q: 'How does the Escrow Milestone Payout model protect architects?',
      a: 'Before any planning or architectural drawing phase begins, the client deposits 100% of the milestone fee into a secure bank-backed escrow account. Once your 2D blueprints, 3D models, or structural working drawings are submitted and approved, the milestone funds are instantly transferred to your linked bank account with zero payment delays.',
    },
    {
      q: 'What documents are required during the KYC verification stage?',
      a: 'You will need to submit: 1) Council of Architecture (COA) License Certificate / Registration, 2) Business or Personal PAN Card, 3) GSTIN Certificate (if registered for GST), and 4) At least 2 past project portfolio photos with basic specifications.',
    },
    {
      q: 'How quickly will my architect application be approved?',
      a: 'Our Operations & Verification Governance Desk reviews COA credentials and portfolio submissions within 24 to 48 hours. Once verified, your status changes to APPROVED and you gain immediate access to incoming landowner project RFQs.',
    },
    {
      q: 'Can both individual architects and full-service firms register?',
      a: 'Yes. Our platform accommodates individual freelance architects, boutique Design Centers, civil engineering firms, and complete construction companies. You can specify your team size and capabilities during profile setup.',
    },
    {
      q: 'Is there any joining fee or upfront listing cost?',
      a: 'No. Registration, COA verification, and Professional Profile creation are completely free. BuildGhar only retains a transparent nominal success fee on completed, client-funded project milestones.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f0f7ff] via-[#f8fbff] to-white text-slate-800 font-sans selection:bg-sky-200 selection:text-sky-950">
      {/* ---------------- 1. TOP NOTICE & HERO SECTION ---------------- */}
      <section id="overview" className="relative pt-12 pb-20 overflow-hidden border-b border-sky-100 scroll-mt-24">
        {/* Ambient Luminous Light Blue Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-r from-sky-200/40 via-blue-200/30 to-indigo-100/30 blur-3xl pointer-events-none rounded-full" />
        <div className="absolute -top-24 right-10 w-96 h-96 bg-amber-200/20 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto space-y-5">
            {/* Top Pill Badge */}
            <motion.div
              initial={{ opacity: 0, y: -15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 border border-sky-300 text-sky-900 text-xs font-black uppercase tracking-wider shadow-sm font-mono"
            >
              <Compass className="w-4 h-4 text-sky-600 animate-spin-slow" />
              <span>Council of Architecture & Civil Engineering Partner Network</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </motion.div>

            {/* Main Display Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-black font-display text-navy-950 tracking-tight leading-[1.15]"
            >
              Empowering India’s Elite{' '}
              <span className="bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-700 bg-clip-text text-transparent">
                Architects & Civil Engineers
              </span>
            </motion.h1>

            {/* Sub-headline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-base sm:text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed font-medium"
            >
              Connect with high-intent landowners across Delhi NCR, build granular itemized BOQs, upload BIM & CAD working
              drawings, and receive 100% escrow-guaranteed milestone payouts with zero defaults.
            </motion.p>
          </div>
        </div>
      </section>

      {/* ---------------- 2. 4-STEP ONBOARDING JOURNEY ---------------- */}
      <section id="process" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-100 text-sky-900 text-xs font-bold uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5 text-sky-600" />
            <span>Smooth 4-Step Process</span>
          </div>
          <h2 className="text-3xl font-black font-display text-navy-950">How Architect Onboarding Works</h2>
          <p className="text-sm text-slate-600">
            A frictionless, transparent pathway from Indian mobile OTP verification to receiving qualified landowner RFQs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
          {[
            {
              step: '01',
              title: 'Instant OTP Register',
              desc: 'Sign up with your +91 mobile number, verify OTP in 10 seconds, and create your credentials.',
              tag: '10 Seconds',
              icon: PhoneCall,
            },
            {
              step: '02',
              title: 'Firm & COA KYC Profile',
              desc: 'Select from 21 architecture categories, enter COA details, upload past projects, and attach identity proof.',
              tag: '5-Min Wizard',
              icon: FileCheck2,
            },
            {
              step: '03',
              title: 'Admin Verification',
              desc: 'Our governance desk validates your Council of Architecture license & firm credentials within 24-48 hours.',
              tag: 'Fast-Track Desk',
              icon: ShieldCheck,
            },
            {
              step: '04',
              title: 'Launch Architecture',
              desc: 'Receive direct client plot briefs, build itemized BOQ quotes, and receive 100% escrow milestone payouts.',
              tag: 'Guaranteed Escrow',
              icon: Compass,
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="relative p-6 rounded-3xl bg-white border-2 border-sky-100 shadow-sm hover:border-sky-300 hover:shadow-md transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                    <item.icon className="w-6 h-6" />
                  </div>
                  <span className="text-3xl font-black font-mono text-sky-200 group-hover:text-sky-300 transition-colors">
                    {item.step}
                  </span>
                </div>
                <div className="inline-block px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-800 text-[10px] font-black uppercase mb-2">
                  {item.tag}
                </div>
                <h3 className="text-lg font-bold text-navy-950 mb-2">{item.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center text-xs font-bold text-sky-700 group-hover:text-sky-800">
                <span>Phase {item.step}</span>
                <ArrowRight className="w-3.5 h-3.5 ml-auto group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- 3. ALL 21 MASTER ARCHITECTURAL SERVICES ---------------- */}
      <section id="services" className="py-16 bg-gradient-to-b from-sky-50/60 to-white border-y border-sky-100 scroll-mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10 space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-900 text-xs font-bold uppercase tracking-wider">
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span>Full Scope of Work</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black font-display text-navy-950">
              21 Architectural & Engineering Specializations
            </h2>
            <p className="text-sm text-slate-600">
              Highlight your exact proficiencies during registration. Clients can request standalone services or complete
              complete architectural packages.
            </p>

            {/* Filter Tabs */}
            <div className="pt-4 flex flex-wrap items-center justify-center gap-2">
              {serviceCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedServiceCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                    selectedServiceCategory === cat
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'bg-white text-slate-600 hover:bg-sky-100/70 border border-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Services Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredServices.map((srv, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-white border border-sky-100 hover:border-sky-300 hover:shadow-md transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-sky-50 text-sky-800 border border-sky-200">
                      {srv.category}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-400">#{idx + 1}</span>
                  </div>
                  <h4 className="text-sm font-bold text-navy-950 mb-1.5 group-hover:text-sky-700 transition-colors">
                    {srv.name}
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">{srv.desc}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Standard IS / COA Compliant</span>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- 4. CORE PLATFORM ADVANTAGES FOR ARCHITECTS ---------------- */}
      <section id="escrow" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-5 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
              <span>Architect Security First</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black font-display text-navy-950 leading-tight">
              Why top architectural firms Prefer BuildGhar
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              We remove the standard frictions plaguing private architectural practice in India: payment chasing, client
              scope creep without budget revisions, and unvetted tire-kickers.
            </p>

            <div className="space-y-3 pt-2">
              {[
                {
                  title: '100% Escrow Milestone Funding',
                  desc: 'Every design phase (2D draft, structural schedule, 3D render) is pre-funded by the client into Escrow before you produce drawings.',
                },
                {
                  title: 'Pre-Calculated BOQ Estimation Engine',
                  desc: 'Auto-populate material specifications, IS 456 concrete grades, and labor slabs to deliver transparent quotes in minutes.',
                },
                {
                  title: 'Verified Landowners with Plot Clearances',
                  desc: 'Receive direct inquiries from clients with verified plot dimensions, soil SBC tests, and active construction budgets.',
                },
              ].map((feat, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 rounded-2xl bg-white border border-sky-100 shadow-2xs">
                  <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0 mt-0.5">
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
                to="/architect/register"
                className="inline-flex items-center gap-2 text-xs font-black text-sky-700 hover:text-sky-900 group"
              >
                <span>Read Full Partner Agreement & Code of Conduct</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Right Visual Card */}
          <div className="lg:col-span-7 bg-gradient-to-br from-[#e8f3fe] via-[#f1f7fe] to-[#e4f0fc] text-slate-800 rounded-3xl p-6 sm:p-8 border border-blue-200/90 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between pb-6 border-b border-blue-200/80">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 border border-blue-200 text-blue-700 flex items-center justify-center">
                  <Compass className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-sm font-black text-navy-950">Live Architect Dashboard</div>
                  <div className="text-xs text-blue-700 font-mono font-bold">Module 1 to 10 Ready</div>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold font-mono">
                Active Partner
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
              <div className="p-4 rounded-2xl bg-white/95 border border-blue-200/80 shadow-xs">
                <div className="text-xs text-slate-500 font-medium">Assigned RFQs</div>
                <div className="text-2xl font-black text-navy-950 mt-1">12 Inquiries</div>
                <div className="text-[11px] text-emerald-700 mt-1 flex items-center gap-1 font-medium">
                  <TrendingUp className="w-3 h-3" />
                  <span>4 New this week in Gurugram</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/95 border border-blue-200/80 shadow-xs">
                <div className="text-xs text-slate-500 font-medium">Escrow Protected Balance</div>
                <div className="text-2xl font-black text-amber-700 mt-1">₹4,20,000</div>
                <div className="text-[11px] text-slate-600 mt-1 font-medium">Ready for milestone payout release</div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/90 border border-blue-200/80 text-xs text-navy-950 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="font-medium">End-to-End Architectural Milestone Protection</span>
              </div>
              <Link
                to="/professional"
                className="text-xs font-bold text-blue-700 hover:text-blue-900 underline shrink-0 ml-2"
              >
                Preview Workspace →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- 5. PARTNER TESTIMONIALS ---------------- */}
      <section id="verification" className="py-16 bg-gradient-to-b from-white via-sky-50/40 to-white border-t border-sky-100 scroll-mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold uppercase tracking-wider">
              <Star className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
              <span>Partner Experiences</span>
            </div>
            <h2 className="text-3xl font-black font-display text-navy-950">Trusted by Leading Design Centers</h2>
            <p className="text-sm text-slate-600">Hear how registered architects grow their practice using BuildGhar.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: 'Ar. Rajesh Sharma',
                firm: 'Sharma Architectures (Gurugram)',
                coa: 'CA/2010/48921',
                quote:
                  'BuildGhar solved our biggest challenge: delayed payments and scope creep. With escrow milestones, clients deposit fees before drawing submission. In 2 years, we designed 24 luxury villas across Golf Course Extension.',
                rating: 5,
              },
              {
                name: 'Ar. Ananya Sen',
                firm: 'Sen Spaces & Design Lab (New Delhi)',
                coa: 'CA/2015/78210',
                quote:
                  'The quality of landowner inquiries is unmatched. Clients arrive with clear plot ownership and architectural requirements. The quotation BOQ builder allows us to specify premium materials without ambiguity.',
                rating: 5,
              },
              {
                name: 'Ar. Vikramaditya Rathore',
                firm: 'Vanguard Civil Design Group (Noida)',
                coa: 'CA/2018/93412',
                quote:
                  'The compliance verification is strict, which protects real professionals. Once approved, the workflow for CAD drawings, revisions, and site inspection logs is exceptionally seamless.',
                rating: 5,
              },
            ].map((t, idx) => (
              <div
                key={idx}
                className="p-6 rounded-3xl bg-white border border-sky-100 shadow-sm hover:border-sky-300 transition-all flex flex-col justify-between"
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
                  <div className="text-[10px] text-sky-700 font-mono font-bold mt-0.5">COA Lic: {t.coa}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- 6. ARCHITECT FREQUENTLY ASKED QUESTIONS ---------------- */}
      <section id="faq" className="py-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24">
        <div className="text-center mb-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-100 text-sky-900 text-xs font-bold uppercase tracking-wider">
            <FileText className="w-3.5 h-3.5 text-sky-600" />
            <span>Frequently Asked Questions</span>
          </div>
          <h2 className="text-3xl font-black font-display text-navy-950">Architect Partner FAQs</h2>
          <p className="text-sm text-slate-600">Everything you need to know about joining BuildGhar as an architecture partner.</p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-sky-200/80 bg-white overflow-hidden shadow-2xs transition-all"
            >
              <button
                onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-navy-950 hover:text-sky-700 transition"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-sky-600 shrink-0 transition-transform duration-200 ${
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
                    <div className="px-5 pb-5 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-sky-50 pt-3">
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
          {/* Subtle Ambient Light Rings */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-2xl pointer-events-none" />

          <div className="space-y-2 max-w-xl text-center md:text-left relative z-10">
            <span className="px-3 py-1 rounded-full bg-white/20 text-white text-[11px] font-black uppercase tracking-wider">
              Council of Architecture Partner Network
            </span>
            <h2 className="text-3xl sm:text-4xl font-black font-display">Ready to Elevate Your Architecture Practice?</h2>
            <p className="text-xs sm:text-sm text-sky-100 font-medium">
              Join verified architects across Delhi NCR. Build transparent quotations and secure 100% escrow payouts.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 relative z-10 w-full sm:w-auto">
            <Link
              to="/architect/register"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-white hover:bg-sky-50 text-navy-950 font-black text-xs sm:text-sm shadow-md transition-all text-center flex items-center justify-center gap-2 group"
            >
              <span>Apply as Architect Partner</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/architect/login"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-sky-900/40 hover:bg-sky-900/60 text-white border border-white/20 font-black text-xs sm:text-sm transition-all text-center"
            >
              Architect Sign In
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
