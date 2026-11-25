import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  BarChart3,
  TrendingUp,
  Award,
  CheckCircle2,
  Clock,
  Star,
  Layers,
  FileCheck2,
  DollarSign,
  ArrowUpRight,
  Download,
  Printer,
  Calendar,
  Share2,
  FileSpreadsheet,
} from 'lucide-react';
import { formatINR } from '../../lib/utils.js';

type ReportType = 'quotations' | 'projects' | 'designs' | 'financial';

export const ProfessionalReports: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const typeParam = (searchParams.get('type') as ReportType) || 'quotations';
  const activeType: ReportType = useMemo(() => {
    if (
      typeParam === 'quotations' ||
      typeParam === 'projects' ||
      typeParam === 'designs' ||
      typeParam === 'financial'
    ) {
      return typeParam;
    }
    return 'quotations';
  }, [typeParam]);

  const setActiveType = (type: ReportType) => {
    setSearchParams({ type });
  };

  const handleExport = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* =========================================================================
          PAGE HEADER & SECTION BADGE (Master Spec Section 12)
      ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-900 shadow-2xs">
              <BarChart3 className="w-5 h-5 text-blue-900" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold font-display text-navy-950">
                  12. Reports & Multi-dimensional Analytics
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-100 text-blue-900">
                  Real-time Intelligence
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Quotation conversion ratios, milestone delivery velocity, drawing turnaround time, and fee earnings.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Export Action */}
        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <button
            onClick={handleExport}
            className="btn-gold text-xs font-bold py-2.5 px-4 rounded-xl transition flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Export Analytics Report</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          SECTION 12 SUB-NAVIGATION TABS (12.1 to 12.4)
      ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-2xs">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none text-xs font-bold">
          <button
            onClick={() => setActiveType('quotations')}
            className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeType === 'quotations'
                ? 'bg-blue-900 text-white shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FileCheck2 className="w-4 h-4" />
            <span>12.1 Quotation Reports</span>
          </button>

          <button
            onClick={() => setActiveType('projects')}
            className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeType === 'projects'
                ? 'bg-blue-900 text-white shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>12.2 Project Progress Reports</span>
          </button>

          <button
            onClick={() => setActiveType('designs')}
            className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeType === 'designs'
                ? 'bg-blue-900 text-white shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>12.3 Design Deliverable Reports</span>
          </button>

          <button
            onClick={() => setActiveType('financial')}
            className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeType === 'financial'
                ? 'bg-blue-900 text-white shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>12.4 Financial & Payout Reports</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          KEY PERFORMANCE HIGHLIGHT CARDS
      ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block">Win Conversion Rate</span>
          <div className="text-2xl font-black text-navy-950 font-mono">68.4%</div>
          <div className="flex items-center gap-1 text-[11px] text-blue-900 font-bold">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+12% vs platform avg</span>
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-blue-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-mono font-bold text-blue-900 uppercase block">Drawing Turnaround</span>
          <div className="text-2xl font-black text-blue-900 font-mono">3.8 Days</div>
          <span className="text-[11px] text-blue-900 font-medium">Concept to revision</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block">Client Satisfaction</span>
          <div className="text-2xl font-black text-slate-900 font-mono flex items-center gap-1">
            <span>4.9</span>
            <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
          </div>
          <span className="text-[11px] text-slate-500">Based on verified reviews</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-blue-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-mono font-bold text-blue-900 uppercase block">On-Time Milestones</span>
          <div className="text-2xl font-black text-blue-900 font-mono">96.2%</div>
          <span className="text-[11px] text-blue-900 font-bold">Zero SLA penalties</span>
        </div>
      </div>

      {/* =========================================================================
          DETAILED ANALYTICS SECTIONS (12.1 - 12.4)
      ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quotation Funnel */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <FileCheck2 className="w-4 h-4 text-sky-600" />
            <span>12.1 Quotation Performance Funnel</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div className="space-y-1">
              <div className="flex justify-between font-mono">
                <span className="text-slate-600">Assigned Requests Received</span>
                <span className="font-bold text-slate-900">18 Requests</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-blue-600 h-2 rounded-full w-full" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between font-mono">
                <span className="text-slate-600">Quotations Prepared & Submitted</span>
                <span className="font-bold text-slate-900">16 (88%)</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-blue-600 h-2 rounded-full w-[88%]" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between font-mono">
                <span className="text-slate-600">Customer Selections & Bookings</span>
                <span className="font-bold text-blue-900">12 (75%)</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-blue-900 h-2 rounded-full w-[75%]" />
              </div>
            </div>
          </div>
        </div>

        {/* Milestone Delivery Velocity */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-900" />
            <span>12.2 & 12.3 Milestone Delivery Velocity</span>
          </h3>

          <div className="space-y-2.5 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
              <span>Concept Planning (Vastu)</span>
              <span className="font-mono font-bold text-blue-900">Avg 2.5 Days (Target: 4 Days)</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
              <span>2D Dimensional Floor Plans</span>
              <span className="font-mono font-bold text-blue-900">Avg 4.1 Days (Target: 7 Days)</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
              <span>3D Facade Elevation Renders</span>
              <span className="font-mono font-bold text-blue-900">Avg 5.0 Days (Target: 8 Days)</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
              <span>Structural IS 456 Vetting</span>
              <span className="font-mono font-bold text-blue-900">Avg 6.2 Days (Target: 10 Days)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
