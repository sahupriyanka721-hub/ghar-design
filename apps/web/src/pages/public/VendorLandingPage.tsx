import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Store,
  Building2,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  FileCheck2,
  Layers,
  Award,
  Users,
  CreditCard,
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
  Package,
  Truck,
  Boxes,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';

export const VendorLandingPage: React.FC = () => {
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
  const { loginVendorWithOtp } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const handleTestLogin = async (phone: string, businessName: string) => {
    try {
      await loginVendorWithOtp(phone, '123456', businessName);
      success(`Logged in as verified depot: ${businessName}`);
      navigate('/vendor');
    } catch (e: any) {
      error(e.message || 'Demo login failed');
    }
  };

  const categories = [
    {
      title: 'Cement & RMC',
      code: 'CEM-01',
      desc: 'OPC 43/53, PPC grade cement bags, Ready Mix Concrete (M20-M35) with automated slump batching.',
      tag: 'Foundation & RCC',
      units: 'Per 50 kg Bag / Cu.M',
    },
    {
      title: 'TMT Steel Rebar & Structural',
      code: 'STL-02',
      desc: 'Fe550D / Fe500D earthquake-resistant TMT rebars, MS angles, channels, binding wire & beams.',
      tag: 'Structural Steel',
      units: 'Per Metric Tonne / Bundle',
    },
    {
      title: 'Red Bricks & AAC Blocks',
      code: 'BRK-03',
      desc: 'Kiln-fired Grade 1 red clay bricks, lightweight autoclaved aerated concrete (AAC) blocks & joint mortar.',
      tag: 'Masonry & Walls',
      units: 'Per 1,000 Pcs / Block',
    },
    {
      title: 'River Sand & Plaster M-Sand',
      code: 'SND-04',
      desc: 'Double-washed coarse river sand, manufactured sand (M-Sand) & plaster sand for crack-free mortar.',
      tag: 'Aggregates',
      units: 'Per Tonne / Truckload',
    },
    {
      title: 'Plumbing & Drainage Pipes',
      code: 'PLM-05',
      desc: 'CPVC hot & cold water pipes, UPVC drainage conduits, SWR fittings, overhead water tanks & valves.',
      tag: 'Plumbing & Sanitation',
      units: 'Per Length / Fitting',
    },
    {
      title: 'Electrical Cables & Switchgear',
      code: 'ELE-06',
      desc: 'FR/FRLS copper wires, multi-strand cables, MCBs, distribution boards, conduits & modular switchplates.',
      tag: 'Electrical Infrastructure',
      units: 'Per 90m Coil / Modular Unit',
    },
    {
      title: 'Tiles, Granite & Marble',
      code: 'FLR-07',
      desc: 'Vitrified floor tiles, full-body outdoor tiles, kitchen granite slabs, Italian & natural Indian marble.',
      tag: 'Surfacing & Flooring',
      units: 'Per Sq.Ft / Box',
    },
    {
      title: 'Waterproofing & Chemicals',
      code: 'CHM-08',
      desc: 'Liquid membrane coatings, crystalline admixtures, tile adhesives, epoxy grouts & expansion sealants.',
      tag: 'Building Protection',
      units: 'Per 20L Bucket / 50kg Bag',
    },
    {
      title: 'Timber & Marine Plywood',
      code: 'PLY-09',
      desc: 'BWP/BWR grade boiling water proof plywood, blockboards, flush doors, teakwood & veneer sheets.',
      tag: 'Carpentry & Joinery',
      units: 'Per 8x4 Sheet',
    },
    {
      title: 'Glass, Aluminium & UPVC',
      code: 'WND-10',
      desc: 'Double-glazed soundproof UPVC windows, toughened glass railings, aluminium sliding sections.',
      tag: 'Fenestration',
      units: 'Per Sq.Ft / Custom Set',
    },
    {
      title: 'Sanitaryware & Bath Fittings',
      code: 'SNT-11',
      desc: 'Wall-hung commodes, concealed cisterns, quarter-turn brass faucets, rain showers & washbasins.',
      tag: 'Bath & Wellness',
      units: 'Per Set / Piece',
    },
    {
      title: 'Roofing Sheets & Shingles',
      code: 'ROF-12',
      desc: 'Color-coated Galvalume corrugated sheets, polycarbonate skylights, gutter channels & insulation.',
      tag: 'Roofing Systems',
      units: 'Per Meter / Sheet',
    },
    {
      title: 'Paints, Primers & Textures',
      code: 'PNT-13',
      desc: 'Exterior weather-shield acrylic emulsions, interior luxury paints, wall putty & waterproof primers.',
      tag: 'Paints & Finishes',
      units: 'Per 20L Can / 40kg Bag',
    },
    {
      title: 'Tools & Construction Equipment',
      code: 'TLS-14',
      desc: 'Needle vibrators, plate compactors, laser distance meters, safety helmets, scaffolding & cutters.',
      tag: 'Jobsite Tools',
      units: 'Per Unit / Rental Day',
    },
  ];

  const faqs = [
    {
      q: 'Who can register as a Materials Vendor on BuildGhar?',
      a: 'Authorized manufacturer stockists, wholesale building material depots, regional distributors, and registered trade suppliers holding a valid GSTIN number and a physical warehouse or commercial sales yard in India can register.',
    },
    {
      q: 'How does BuildGhar guarantee 100% Escrow secured supplier payments?',
      a: 'Before any material dispatch order is placed, the total purchase amount (including GST and delivery logistics) is secured inside a bank-backed client escrow account. Upon physical delivery at the site and OTP / digital challan verification by the site engineer or contractor, payment is disbursed to your registered bank account within 24 hours.',
    },
    {
      q: 'Can vendors set custom dispatch radius and delivery charges?',
      a: 'Yes. In your Vendor Depot portal, you can specify your delivery radius (e.g., 15 km, 30 km, or Delhi NCR regional), minimum order quantities (MOQ), standard lead times, and whether site drops are included or quoted separately.',
    },
    {
      q: 'Are there any upfront listing fees or subscriptions?',
      a: 'No. Joining the BuildGhar Vendor Depot network and uploading your product catalog is completely free of charge. BuildGhar operates on a transparent, nominal commission on verified site delivery transactions.',
    },
    {
      q: 'How are bulk multi-truckload orders managed?',
      a: 'For high-volume site requirements (10+ metric tonnes of steel, 500+ bags of cement, or truckloads of sand), contractors raise Custom Bulk RFQs directly to verified local depots. You can submit competitive bulk rate quotations with guaranteed delivery windows.',
    },
  ];

  const filteredCategories =
    selectedCategory === 'All'
      ? categories
      : categories.filter((c) => c.tag.toLowerCase().includes(selectedCategory.toLowerCase()));

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f0f7ff] via-[#f8fbff] to-white text-slate-800 font-sans selection:bg-sky-200 selection:text-sky-950">
      {/* ---------------- 1. HERO SECTION ---------------- */}
      <section id="overview" className="relative pt-12 pb-20 overflow-hidden border-b border-blue-200/80 scroll-mt-24">
        {/* Ambient Warm Golden Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-r from-sky-200/40 via-blue-200/30 to-indigo-100/30 blur-3xl pointer-events-none rounded-full" />
        <div className="absolute -top-24 right-10 w-96 h-96 bg-sky-200/20 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto space-y-5">
            {/* Top Pill Badge */}
            <motion.div
              initial={{ opacity: 0, y: -15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 border border-blue-200 text-blue-950 text-xs font-black uppercase tracking-wider shadow-sm font-mono"
            >
              <Store className="w-4 h-4 text-blue-600 animate-spin-slow" />
              <span>Building Materials Wholesale Depot & Supplier Network</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </motion.div>

            {/* Display Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-black font-display text-navy-950 tracking-tight leading-[1.15]"
            >
              Powering Construction Across India With{' '}
              <span className="bg-gradient-to-r from-blue-600 via-sky-600 to-indigo-700 bg-clip-text text-transparent">
                Direct Site Material Deliveries
              </span>
            </motion.h1>

            {/* Sub-headline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-base sm:text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed font-medium"
            >
              Connect your warehouse or distributor depot directly with active residential construction sites. Supply
              cement, TMT steel, AAC blocks, sand & electrical conduits with 100% escrow-backed guaranteed payouts.
            </motion.p>

            {/* Primary Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4"
            >
              <Link
                to="/vendor/register"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-700 hover:from-sky-500 hover:to-blue-600 text-white font-extrabold text-sm shadow-lg shadow-sky-600/25 hover:shadow-xl hover:scale-[1.02] active:scale-[0.99] transition-all flex items-center justify-center gap-2 group"
              >
                <span>Register as Materials Supplier</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                to="/vendor"
                className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-white hover:bg-blue-50 text-navy-950 border-2 border-blue-200 hover:border-blue-400 font-extrabold text-sm shadow-sm transition-all flex items-center justify-center gap-2"
              >
                <Store className="w-4 h-4 text-sky-600" />
                <span>Vendor Depot Sign In</span>
              </Link>
            </motion.div>

            {/* Metric Counters Banner */}
            <div className="pt-10 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
              {[
                { label: 'Verified Depot Suppliers', value: '480+', icon: Store },
                { label: 'Materials Escrow Disbursed', value: '₹32.4 Cr+', icon: CreditCard },
                { label: 'Active Material Categories', value: '14 Categories', icon: Layers },
                { label: 'On-Time Site Deliveries', value: '99.8%', icon: Truck },
              ].map((m, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-white/95 border border-blue-200/80 shadow-xs hover:border-blue-400 transition-all text-center"
                >
                  <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 mx-auto flex items-center justify-center mb-2">
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
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-100 text-sky-950 text-xs font-bold uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5 text-sky-600" />
            <span>Frictionless Partner Journey</span>
          </div>
          <h2 className="text-3xl font-black font-display text-navy-950">How Materials Vendor Onboarding Works</h2>
          <p className="text-sm text-slate-600">
            A transparent pathway from mobile OTP verification to receiving confirmed jobsite material drop orders.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
          {[
            {
              step: '01',
              title: 'Mobile OTP Sign Up',
              desc: 'Enter your business phone number, verify OTP in 10 seconds, and create your vendor profile.',
              tag: '10 Seconds',
              icon: PhoneCall,
            },
            {
              step: '02',
              title: 'Depot & GSTIN KYC',
              desc: 'Provide your trade license, GSTIN, warehouse address, bank account details & delivery radius.',
              tag: 'Quick KYC',
              icon: FileCheck2,
            },
            {
              step: '03',
              title: 'Catalog & Live Pricing',
              desc: 'Select categories, configure your SKU prices, minimum order quantities (MOQ) & site drop rates.',
              tag: 'Self-Serve Portal',
              icon: Boxes,
            },
            {
              step: '04',
              title: 'Site Orders & Escrow Payout',
              desc: 'Receive direct contractor orders, dispatch truckloads, confirm delivery OTP and receive bank payout.',
              tag: 'Guaranteed Escrow',
              icon: Truck,
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="relative p-6 rounded-3xl bg-white border-2 border-blue-100 shadow-sm hover:border-sky-300 hover:shadow-md transition-all group flex flex-col justify-between"
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
                <div className="inline-block px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-900 text-[10px] font-black uppercase mb-2">
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

      {/* ---------------- 3. 14 MASTER MATERIAL CATEGORIES ---------------- */}
      <section id="categories" className="py-16 bg-gradient-to-b from-blue-50/60 to-white border-y border-blue-100 scroll-mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10 space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-100 text-sky-950 text-xs font-bold uppercase tracking-wider">
              <Package className="w-3.5 h-3.5 text-sky-600" />
              <span>Full Marketplace Inventory</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black font-display text-navy-950">
              14 Essential Building Material Categories
            </h2>
            <p className="text-sm text-slate-600">
              Supply individual items or comprehensive turnkey material packages to builders, architects, and homeowners.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredCategories.map((cat, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-white border border-blue-100 hover:border-sky-300 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-900 border border-blue-200">
                      {cat.tag}
                    </span>
                    <span className="text-[11px] font-mono font-bold text-slate-400">{cat.code}</span>
                  </div>
                  <h3 className="font-bold text-base text-navy-950 mb-1.5">{cat.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed mb-3">{cat.desc}</p>
                </div>
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-medium">Standard Unit:</span>
                  <span className="font-bold text-blue-800 font-mono">{cat.units}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- 4. 100% ESCROW SECURITY ---------------- */}
      <section id="escrow" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-6 space-y-5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-950 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Zero Bad Debts • Zero Payment Delay</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black font-display text-navy-950 leading-tight">
              Bank-Backed Escrow Protects Every Delivery Truckload
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Traditional building material supply often suffers from delayed builder checks and credit defaults. With
              BuildGhar, 100% of the material amount is deposited in escrow before you roll the truck out of your depot.
            </p>

            <div className="space-y-3 pt-2">
              {[
                {
                  title: 'Pre-Funded Orders Only',
                  desc: 'Never risk dispatching expensive steel or cement on unconfirmed credit. Every order is pre-locked in bank escrow.',
                },
                {
                  title: 'Digital Proof of Delivery (e-Challan)',
                  desc: 'Site engineers verify vehicle weights, batch numbers, and enter 6-digit confirmation OTP directly on delivery.',
                },
                {
                  title: 'Direct RTGS / NEFT Payouts in 24 Hours',
                  desc: 'Funds are automatically disbursed to your verified bank account with zero withholding or surprise deductions.',
                },
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200/80">
                  <CheckCircle2 className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-xs text-navy-950">{item.title}</div>
                    <div className="text-[11px] text-slate-600 mt-0.5">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="p-7 rounded-3xl bg-gradient-to-br from-navy-950 to-slate-900 text-white shadow-2xl relative overflow-hidden space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Live Site Delivery Verification</div>
                    <div className="text-[10px] text-slate-400">Order: GHR-MAT-2026-9481</div>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-400 text-[10px] font-bold">
                  Funds In Escrow: ₹4,85,000
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1.5 border-b border-white/5">
                  <span className="text-slate-400">Material SKU:</span>
                  <span className="font-bold text-white">Tata Tiscon 550D TMT Steel (6 Tonnes)</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-white/5">
                  <span className="text-slate-400">Drop Location:</span>
                  <span className="font-bold text-white">Plot 42, DLF Phase 2, Gurugram</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-white/5">
                  <span className="text-slate-400">Status:</span>
                  <span className="font-bold text-sky-400">Truck In Transit (Vehicle HR-26-EA-4412)</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  Automated Bank Settlement
                </span>
                <div className="text-xl font-bold font-mono text-emerald-400">Direct Disbursal on Delivery OTP</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- 5. PARTNER FAQ ---------------- */}
      <section id="faq" className="py-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24">
        <div className="text-center mb-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-100 text-sky-950 text-xs font-bold uppercase tracking-wider">
            <HelpCircle className="w-3.5 h-3.5 text-sky-600" />
            <span>Supplier Guidance</span>
          </div>
          <h2 className="text-3xl font-black font-display text-navy-950">Frequently Asked Questions</h2>
          <p className="text-sm text-slate-600">
            Everything you need to know about joining BuildGhar as a verified materials depot.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((f, idx) => (
            <div
              key={idx}
              className="rounded-2xl bg-white border border-blue-100 shadow-2xs overflow-hidden transition"
            >
              <button
                onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                className="w-full p-4 sm:p-5 text-left font-bold text-sm text-navy-950 flex items-center justify-between gap-4"
              >
                <span>{f.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
                    activeFaq === idx ? 'rotate-180 text-sky-600' : ''
                  }`}
                />
              </button>
              {activeFaq === idx && (
                <div className="px-4 sm:px-5 pb-5 text-xs text-slate-600 leading-relaxed border-t border-slate-50 pt-3">
                  {f.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- 6. FINAL BOTTOM CTA ---------------- */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-700 rounded-3xl p-8 sm:p-12 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-2 max-w-xl text-center md:text-left relative z-10">
            <h2 className="text-2xl sm:text-3xl font-black font-display">
              Ready to Expand Your Building Materials Sales?
            </h2>
            <p className="text-xs sm:text-sm text-sky-100 leading-relaxed font-medium">
              Join 480+ verified material depots supplying to active residential projects with guaranteed 24h bank
              settlements.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 relative z-10 w-full md:w-auto">
            <Link
              to="/vendor/register"
              className="px-8 py-4 rounded-2xl bg-white text-navy-950 hover:bg-blue-50 font-extrabold text-xs shadow-lg transition flex items-center justify-center gap-2"
            >
              <span>Register as Supplier</span>
              <ArrowRight className="w-4 h-4 text-sky-600" />
            </Link>
            <Link
              to="/vendor"
              className="px-6 py-4 rounded-2xl bg-navy-950/40 hover:bg-navy-950/60 text-white border border-white/20 font-bold text-xs transition flex items-center justify-center gap-2"
            >
              <span>Depot Sign In</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
