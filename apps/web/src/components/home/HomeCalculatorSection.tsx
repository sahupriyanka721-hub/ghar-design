import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { formatRupees } from '../../lib/utils.js';
import {
  Calculator,
  Building2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  Layers,
  MapPin,
  TrendingUp,
} from 'lucide-react';

export const HomeCalculatorSection: React.FC = () => {
  const navigate = useNavigate();

  // Quick Interactive Controls
  const [plotArea, setPlotArea] = useState<number>(1500); // sq ft
  const [floors, setFloors] = useState<number>(2); // G+1
  const [packageTier, setPackageTier] = useState<'standard' | 'premium' | 'luxury'>('premium');
  const [cityMultiplier, setCityMultiplier] = useState<number>(1.0);

  // Rate mapping: Dynamically synched with Admin Cost Calculator settings & defaults
  const rates: Record<'standard' | 'premium' | 'luxury', number> = useMemo(() => {
    try {
      const saved = localStorage.getItem('gd_admin_packages');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const std = parsed.find((item: any) => item.id === 'standard')?.ratePerSqFt || 1550;
          const prm = parsed.find((item: any) => item.id === 'premium')?.ratePerSqFt || 1850;
          const lux = parsed.find((item: any) => item.id === 'luxury')?.ratePerSqFt || 2350;
          return { standard: std, premium: prm, luxury: lux };
        }
      }
    } catch (_) {}
    return { standard: 1550, premium: 1850, luxury: 2350 };
  }, []);

  const calculatedBuiltUp = Math.round(plotArea * 0.8 * floors);
  const totalCost = Math.round(calculatedBuiltUp * rates[packageTier] * cityMultiplier);

  // Bill of Materials Quick Counts
  const cementBags = Math.round(calculatedBuiltUp * 0.40);
  const steelTonnes = ((calculatedBuiltUp * 3.75) / 1000).toFixed(1);
  const sandCft = Math.round(calculatedBuiltUp * 1.85);

  const handleLaunchFullCalculator = () => {
    navigate('/cost-calculator');
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 35 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.55 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
    >
      <div className="bg-gradient-to-br from-[#e8f3fe] via-[#f1f7fe] to-[#e4f0fc] text-slate-800 rounded-3xl p-6 sm:p-9 border border-blue-200/90 shadow-xl relative overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute right-0 top-0 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/4 -bottom-24 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-blue-200/80">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-black uppercase tracking-wider border border-amber-300 font-mono">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Instant Construction Estimator</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-black font-display text-navy-950 tracking-tight">
                Calculate Your House Construction & Material Budget
              </h2>
              <p className="text-slate-600 text-xs sm:text-sm font-sans font-medium leading-relaxed">
                Plan before you build. Get real-time cost forecasts, structural material bills (Cement, TMT Steel, Sand), and design & planning fee estimates based on Indian IS 456 engineering standards.
              </p>
            </div>

            <Link
              to="/cost-calculator"
              className="px-5 py-3 bg-white hover:bg-blue-50 text-blue-900 font-bold text-xs rounded-xl border border-blue-300 shadow-xs flex items-center gap-2 transition shrink-0 font-display"
            >
              <span>Open Advanced 3D Estimator</span>
              <ChevronRight className="w-4 h-4 text-blue-600" />
            </Link>
          </div>

          {/* Quick Parametric Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left 7 cols: Controls */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Plot Area Slider */}
              <div className="bg-white/95 p-5 rounded-2xl border border-blue-200/80 shadow-xs space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                    1. Plot Size (Ground Footprint):
                  </span>
                  <span className="text-blue-900 font-black font-mono text-sm bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200">
                    {plotArea.toLocaleString('en-IN')} Sq.Ft
                  </span>
                </div>
                <input
                  type="range"
                  min={600}
                  max={6000}
                  step={50}
                  value={plotArea}
                  onChange={(e) => setPlotArea(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                  <span>600 Sq.Ft (20x30)</span>
                  <span>1,500 Sq.Ft (30x50 Standard)</span>
                  <span>6,000 Sq.Ft (Luxury Villa)</span>
                </div>
              </div>

              {/* Floors Selector */}
              <div className="space-y-2">
                <span className="text-slate-700 font-bold uppercase tracking-wider text-[11px] block">
                  2. Number of Floors:
                </span>
                <div className="grid grid-cols-4 gap-2.5">
                  {[
                    { num: 1, label: 'Ground (1 Flr)' },
                    { num: 2, label: 'G + 1 (2 Flr)' },
                    { num: 3, label: 'G + 2 (3 Flr)' },
                    { num: 4, label: 'G + 3 (4 Flr)' },
                  ].map((f) => (
                    <button
                      key={f.num}
                      onClick={() => setFloors(f.num)}
                      className={`p-3 rounded-xl border text-center transition ${
                        floors === f.num
                          ? 'bg-gradient-to-r from-amber-400 via-gold-400 to-amber-500 text-navy-950 font-black border-amber-400 shadow-md'
                          : 'bg-white hover:bg-blue-50 text-navy-950 border-blue-200/80 shadow-xs'
                      }`}
                    >
                      <div className="text-sm font-black">{f.num}</div>
                      <div className="text-[10px] opacity-90">{f.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quality Package Selector */}
              <div className="space-y-2">
                <span className="text-slate-700 font-bold uppercase tracking-wider text-[11px] block">
                  3. Quality Specification Tier:
                </span>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { id: 'standard', name: 'Silver (₹1,550/sq.ft)', desc: 'Standard Brands' },
                    { id: 'premium', name: 'Gold (₹1,850/sq.ft)', desc: 'UltraTech + Tata TMT' },
                    { id: 'luxury', name: 'Platinum (₹2,350/sq.ft)', desc: 'Italian Marble + UPVC' },
                  ].map((pkg) => (
                    <button
                      key={pkg.id}
                      onClick={() => setPackageTier(pkg.id as any)}
                      className={`p-3 rounded-xl border text-left transition ${
                        packageTier === pkg.id
                          ? 'bg-gradient-to-r from-amber-400 via-gold-400 to-amber-500 text-navy-950 font-black border-amber-400 shadow-md'
                          : 'bg-white hover:bg-blue-50 text-slate-800 border-blue-200/80 shadow-xs'
                      }`}
                    >
                      <div className="text-xs font-black">{pkg.name}</div>
                      <div className="text-[10px] opacity-80 mt-0.5">{pkg.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right 5 cols: Live Estimate Display Card */}
            <div className="lg:col-span-5 bg-white border border-blue-200/90 rounded-3xl p-6 sm:p-7 space-y-6 shadow-md">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Total Slab Construction Area
                </span>
                <div className="text-xl font-black text-navy-950 font-mono mt-0.5">
                  {calculatedBuiltUp.toLocaleString('en-IN')} Sq.Ft <span className="text-xs text-slate-500 font-sans font-normal">({floors} Floors)</span>
                </div>
              </div>

              {/* Big Estimated Price */}
              <div className="p-4 bg-gradient-to-r from-blue-50 via-sky-50 to-amber-50/50 border border-amber-300/80 rounded-2xl space-y-1">
                <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">
                  Estimated Project Investment
                </span>
                <div className="flex flex-wrap items-baseline gap-2">
                  <div className="text-3xl sm:text-4xl font-black font-display text-navy-950">
                    {formatRupees(totalCost)}
                  </div>
                  <span className="text-sm sm:text-base font-bold text-amber-700 font-display">
                    ({totalCost >= 10000000 ? `₹${(totalCost / 10000000).toFixed(2)} Cr` : `₹${(totalCost / 100000).toFixed(2)} Lakhs`})
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 font-medium">
                  Approx ₹{rates[packageTier].toLocaleString('en-IN')} / sq.ft all-inclusive
                </div>
              </div>

              {/* IS-456 Material Quantities Preview */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                  <span>Major Material Requirements:</span>
                  <span className="text-blue-700 font-bold">IS 456 Thumb Rules</span>
                </span>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2.5 bg-blue-50/80 rounded-xl border border-blue-200/80">
                    <div className="font-mono font-black text-navy-950">{cementBags}</div>
                    <div className="text-[10px] text-slate-600 font-medium">Cement Bags</div>
                  </div>
                  <div className="p-2.5 bg-blue-50/80 rounded-xl border border-blue-200/80">
                    <div className="font-mono font-black text-navy-950">{steelTonnes} MT</div>
                    <div className="text-[10px] text-slate-600 font-medium">TMT Steel</div>
                  </div>
                  <div className="p-2.5 bg-blue-50/80 rounded-xl border border-blue-200/80">
                    <div className="font-mono font-black text-navy-950">{sandCft} CFT</div>
                    <div className="text-[10px] text-slate-600 font-medium">Sand / River</div>
                  </div>
                </div>
              </div>

              {/* CTA Action Buttons */}
              <div className="space-y-2.5 pt-2">
                <Link
                  to="/cost-calculator"
                  className="w-full py-3.5 bg-gradient-to-r from-amber-400 via-gold-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-navy-950 font-black text-xs rounded-xl shadow-md shadow-amber-500/25 flex items-center justify-center gap-2 transition font-display border border-amber-300"
                >
                  <span>View Detailed Material & Cost Breakdown</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <div className="flex items-center justify-center gap-4 text-[11px] text-slate-500 pt-1 font-medium">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Free Estimate</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span>No Signup Required</span>
                  </span>
                </div>
              </div>

            </div>

          </div>
        </div>
      </div>
    </motion.section>
  );
};
