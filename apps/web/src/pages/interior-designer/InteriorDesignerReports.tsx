import React from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  CheckCircle2,
  Star,
  DollarSign,
  PieChart,
  FileText,
  ShieldCheck,
} from 'lucide-react';
import { getInteriorProjects, getInteriorQuotations } from '../../data/interiorDesignerStore.js';

export const InteriorDesignerReports: React.FC = () => {
  const quotations = getInteriorQuotations();
  const projects = getInteriorProjects();

  const totalQuotes = quotations.length;
  const acceptedQuotes = quotations.filter((q) => q.status === 'ACCEPTED').length;
  const winRate = totalQuotes > 0 ? Math.round((acceptedQuotes / totalQuotes) * 100) : 75;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold mb-2">
            <BarChart3 className="w-3.5 h-3.5 text-blue-600" />
            <span>Performance Analytics</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            Reports & Analytics
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Real-time quotation conversion rates, project turnaround times, and financial statements.
          </p>
        </div>

        <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition">
          <Download className="w-4 h-4" />
          <span>Export FY26 Statement (PDF)</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="text-slate-500 text-xs font-semibold">Quotation Win Rate</div>
          <div className="text-2xl font-black text-blue-600 mt-1">{winRate}%</div>
          <div className="text-[11px] text-blue-700 font-bold mt-1">Industry Average: 42%</div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="text-slate-500 text-xs font-semibold">Average Turnaround</div>
          <div className="text-2xl font-black text-slate-900 mt-1">11 Wks</div>
          <div className="text-[11px] text-slate-500 mt-1">Concept to Handover</div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="text-slate-500 text-xs font-semibold">Client Satisfaction</div>
          <div className="text-2xl font-black text-amber-600 mt-1 flex items-center gap-1">
            <span>4.9</span>
            <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
          </div>
          <div className="text-[11px] text-amber-700 font-bold mt-1">From 48 Verified Reviews</div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="text-slate-500 text-xs font-semibold">On-Time Completion</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">96%</div>
          <div className="text-[11px] text-emerald-700 font-bold mt-1">Zero Milestone Penalties</div>
        </div>
      </div>

      {/* Breakdown Grids */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
          <h3 className="text-base font-black text-slate-900 mb-4 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-blue-600" />
            <span>Revenue by Interior Category</span>
          </h3>
          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between font-bold mb-1">
                <span>Full Home Residential Interiors</span>
                <span className="text-blue-700 font-mono">65%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full w-[65%]" />
              </div>
            </div>
            <div>
              <div className="flex justify-between font-bold mb-1">
                <span>Modular Kitchens & Wardrobes</span>
                <span className="text-blue-700 font-mono">20%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full w-[20%]" />
              </div>
            </div>
            <div>
              <div className="flex justify-between font-bold mb-1">
                <span>3D Renders & Design Consultation Only</span>
                <span className="text-amber-700 font-mono">15%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-amber-600 rounded-full w-[15%]" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
          <h3 className="text-base font-black text-slate-900 mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <span>Available Accounting Downloads</span>
          </h3>
          <div className="space-y-2.5 text-xs">
            {[
              { title: 'Q3 FY26 Milestone Escrow & Tax Summary', date: 'Generated Oct 30, 2026', size: '1.4 MB' },
              { title: 'Annual GST Reconciliation Report (GSTR-1 Data)', date: 'Generated Sep 30, 2026', size: '2.8 MB' },
              { title: 'Contractor & Material Settlement Statement', date: 'Generated Oct 15, 2026', size: '920 KB' },
            ].map((rep, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between hover:bg-blue-50/50 transition"
              >
                <div>
                  <div className="font-bold text-slate-900">{rep.title}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{rep.date} • {rep.size}</div>
                </div>
                <button className="p-2 rounded-xl text-blue-700 hover:bg-blue-100 transition">
                  <Download className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
