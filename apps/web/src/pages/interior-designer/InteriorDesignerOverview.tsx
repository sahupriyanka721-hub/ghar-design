import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Palette,
  FileCheck2,
  CalendarCheck,
  HardHat,
  CreditCard,
  TrendingUp,
  Clock,
  ArrowRight,
  Plus,
  Eye,
  CheckCircle2,
  Sparkles,
  MapPin,
  Camera,
  Layers,
  Box,
} from 'lucide-react';
import { formatINR } from '../../lib/utils.js';
import { getInteriorQuotations, SEED_INTERIOR_DESIGNERS, InteriorQuotation } from '../../data/interiorDesignerStore.js';
import { syncChannel } from '../../data/customerStore.js';
import { useAuth } from '../../context/AuthContext.js';

export const InteriorDesignerOverview: React.FC = () => {
  const { user } = useAuth();
  const [quotations, setQuotations] = useState<InteriorQuotation[]>(() => getInteriorQuotations());

  useEffect(() => {
    const loadData = () => setQuotations(getInteriorQuotations());
    window.addEventListener('storage', loadData);
    const onSync = (event: MessageEvent) => {
      if (
        event.data?.type === 'INTERIOR_QUOTATIONS_UPDATED' ||
        event.data?.type === 'QUOTATIONS_UPDATED' ||
        event.data?.type === 'PROJECT_REQUESTS_UPDATED'
      ) {
        loadData();
      }
    };
    if (syncChannel) {
      syncChannel.addEventListener('message', onSync);
    }
    return () => {
      window.removeEventListener('storage', loadData);
      if (syncChannel) {
        syncChannel.removeEventListener('message', onSync);
      }
    };
  }, []);
  const activeDesigner = SEED_INTERIOR_DESIGNERS[0]; // Pooja Mehra as primary fixture

  const acceptedQuotes = quotations.filter((q) => q.status === 'ACCEPTED');
  const submittedQuotes = quotations.filter((q) => q.status === 'SUBMITTED');

  return (
    <div className="space-y-6 font-sans">
      {/* ---------------- WELCOME BANNER (Light Blue Background & High-Contrast Typography) ---------------- */}
      <div className="bg-gradient-to-br from-[#e8f3fe] via-[#f1f7fe] to-[#e4f0fc] text-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-blue-200/90 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-900 text-[11px] font-black uppercase font-mono tracking-wider border border-blue-200">
            <Palette className="w-3.5 h-3.5 text-blue-700" />
            <span>Active Interior Design Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-display text-navy-950 leading-tight">
            Welcome back, {user?.name || activeDesigner.name}!
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-medium">
            {activeDesigner.businessName} • 9 Active Inquiries in Gurugram & South Delhi
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <Link
            to="/interior-designer/quotations"
            className="px-5 py-2.5 rounded-xl bg-white hover:bg-blue-50 text-navy-950 text-xs font-black shadow-md transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4 text-blue-600" />
            <span>Create New Quotation</span>
          </Link>
          <Link
            to="/interior-designer/designs"
            className="px-5 py-2.5 rounded-xl bg-navy-900/60 hover:bg-navy-900 text-white border border-white/20 text-xs font-bold transition flex items-center gap-2"
          >
            <Box className="w-4 h-4" />
            <span>Open 3D Design</span>
          </Link>
        </div>
      </div>

      {/* ---------------- 10 REAL SUMMARY CARDS (Section 6) ---------------- */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {[
          { label: 'Total RFQ Briefs', value: '14', icon: FileCheck2, color: 'text-blue-600 bg-blue-50' },
          { label: 'Pending Quotations', value: '3', icon: Clock, color: 'text-amber-600 bg-amber-50' },
          { label: 'Submitted Quotes', value: `${submittedQuotes.length}`, icon: TrendingUp, color: 'text-blue-600 bg-blue-50' },
          { label: 'Accepted Quotations', value: `${acceptedQuotes.length}`, icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Active Projects', value: '4', icon: HardHat, color: 'text-indigo-600 bg-indigo-50' },
          { label: 'Upcoming Site Visits', value: '2', icon: CalendarCheck, color: 'text-purple-600 bg-purple-50' },
          { label: 'Projects Completed', value: '95', icon: Palette, color: 'text-blue-600 bg-blue-50' },
          { label: 'Outstanding Payments', value: formatINR(420000), icon: CreditCard, color: 'text-rose-600 bg-rose-50' },
          { label: 'Total Earnings', value: formatINR(2840000), icon: Sparkles, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Escrow Available', value: formatINR(680000), icon: CreditCard, color: 'text-blue-600 bg-blue-50' },
        ].map((c, i) => (
          <div key={i} className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:shadow-xs transition">
            <div className={`w-8 h-8 rounded-xl ${c.color} flex items-center justify-center mb-2`}>
              <c.icon className="w-4 h-4" />
            </div>
            <div className="text-xl font-black text-navy-950 font-display">{c.value}</div>
            <div className="text-[11px] font-semibold text-slate-500 mt-0.5 truncate">{c.label}</div>
          </div>
        ))}
      </div>

      {/* ---------------- 2-COLUMN OPERATIONAL HUB ---------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Recent Assigned Quotation Requests */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-black text-navy-950 text-base">Assigned Homeowner RFQs</h3>
              <p className="text-xs text-slate-500">High-budget residential briefs waiting for room-wise BOQs</p>
            </div>
            <Link
              to="/interior-designer/quotations"
              className="text-xs font-bold text-blue-700 hover:text-navy-950 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {quotations.map((q) => (
              <div
                key={q.id}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 hover:border-blue-300 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-navy-950 text-xs">{q.customerName}</span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-100 text-navy-950 text-[10px] font-bold font-mono">
                      {q.quotationNumber}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[10px] font-black uppercase">
                      {q.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span className="truncate max-w-[260px]">{q.projectAddress}</span>
                    <span>•</span>
                    <span className="font-bold text-slate-700">{q.propertyType}</span>
                  </div>
                  <div className="text-[11px] text-blue-800 font-semibold mt-1">
                    Style: {q.preferredStyle} • Budget: {formatINR(q.targetBudget)}
                  </div>
                </div>

                <div className="text-right sm:self-center shrink-0">
                  <div className="text-xs font-black text-navy-950 font-mono">{formatINR(q.grandTotal)}</div>
                  <Link
                    to="/interior-designer/quotations"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 hover:underline mt-1"
                  >
                    <span>Inspect BOQ</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Active Project Lifecycle Progress */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-black text-navy-950 text-base">Active Project Tracking</h3>
              <p className="text-xs text-slate-500">Milestone stages & client design sign-offs</p>
            </div>
            <Link
              to="/interior-designer/projects"
              className="text-xs font-bold text-blue-700 hover:text-navy-950 flex items-center gap-1"
            >
              <span>Projects</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-navy-950">The Camellias Penthouse Oasis</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[10px] font-bold">
                  Phase 5: Execution
                </span>
              </div>
              <div className="text-xs text-slate-600">
                Client: Vivek Singhania • Budget: ₹45.0 Lakhs
              </div>
              <div>
                <div className="flex justify-between text-[11px] font-bold mb-1">
                  <span>Overall Verified Progress</span>
                  <span className="text-blue-800 font-mono">68%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-blue-200/60 overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full" style={{ width: '68%' }} />
                </div>
              </div>
              <div className="text-[11px] text-navy-950 font-medium flex items-center justify-between pt-1 border-t border-blue-200">
                <span>Next: Quartz Countertop Installation</span>
                <span className="font-bold">Due in 4 Days</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-navy-950">Magnolia Contemporary Duplex</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold">
                  Phase 3: 3D Approvals
                </span>
              </div>
              <div className="text-xs text-slate-600">
                Client: Anandita Roy • Budget: ₹60.0 Lakhs
              </div>
              <div>
                <div className="flex justify-between text-[11px] font-bold mb-1">
                  <span>Progress</span>
                  <span className="text-slate-800 font-mono">35%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: '35%' }} />
                </div>
              </div>
              <div className="text-[11px] text-slate-500 font-medium flex items-center justify-between pt-1 border-t border-slate-200">
                <span>Master Suite Renders Pending Client Review</span>
                <span className="font-bold text-amber-700">Awaiting Sign-off</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
