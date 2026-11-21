import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  IndianRupee,
  Layers,
  Building,
  Users,
  Store,
  HardHat,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Filter,
} from 'lucide-react';
import { formatINR } from '../../lib/utils.js';
import { useToast } from '../../context/ToastContext.js';
import { getPlatformGlobalSettings } from '../../data/adminStore.js';
import { getPlatformRequests, getPlatformBookings } from '../../data/customerStore.js';
import { getVendorOrders } from '../../data/vendorStore.js';
import { getExecutionProjects } from '../../data/projectExecutionStore.js';
import { getInteriorBookings } from '../../data/interiorDesignerStore.js';

export const AdminReports: React.FC = () => {
  const { success } = useToast();
  const [timeRange, setTimeRange] = useState<'7D' | '30D' | '90D' | 'YTD'>('30D');
  const [selectedStream, setSelectedStream] = useState<'ALL' | 'CONSTRUCTION' | 'MATERIALS' | 'DESIGN'>('ALL');
  const settings = getPlatformGlobalSettings();

  const requests = getPlatformRequests();
  const bookings = getPlatformBookings();
  const vendorOrders = getVendorOrders();
  const executionProjects = getExecutionProjects();
  const interiorBookings = getInteriorBookings();

  const constructionVolumePaise = bookings.reduce(
    (sum, b) => sum + (b.totalEstimatedCostPaise || b.advanceAmountPaise || 0),
    0
  );
  const constructionCount = bookings.length;

  const materialVolumePaise = vendorOrders.reduce(
    (sum, o) => sum + (o.totalPaise || (o.totalAmount ? o.totalAmount * 100 : 0)),
    0
  );
  const materialCount = vendorOrders.length;

  const archBookings = bookings.filter(
    (b: any) => b.serviceType === 'ARCHITECTURAL_DESIGN' || b.category === 'ARCHITECT'
  );
  const archVolumePaise = archBookings.reduce((sum: number, b: any) => sum + (b.advanceAmountPaise || 0), 0);
  const archCount = archBookings.length;

  const interiorVolumePaise = interiorBookings.reduce((sum, b) => sum + (b.bookingAmount || 0) * 100, 0);
  const interiorCount = interiorBookings.length;

  const tokenFeeVolumePaise = requests.length * 50000;
  const tokenFeeCount = requests.length;

  const financialStreams = [
    {
      stream: 'Construction Milestone Releases',
      volumePaise: constructionVolumePaise,
      platformTakeRate: `${settings.contractorCommissionPercent}%`,
      commissionEarnedPaise: Math.round(constructionVolumePaise * (settings.contractorCommissionPercent / 100)),
      growth: constructionCount > 0 ? '+100%' : '0%',
      count: constructionCount,
    },
    {
      stream: 'Material Depot Marketplace Sales',
      volumePaise: materialVolumePaise,
      platformTakeRate: `${settings.vendorCommissionPercent}%`,
      commissionEarnedPaise: Math.round(materialVolumePaise * (settings.vendorCommissionPercent / 100)),
      growth: materialCount > 0 ? '+100%' : '0%',
      count: materialCount,
    },
    {
      stream: 'Architectural Design Packages',
      volumePaise: archVolumePaise,
      platformTakeRate: `${settings.architectCommissionPercent}%`,
      commissionEarnedPaise: Math.round(archVolumePaise * (settings.architectCommissionPercent / 100)),
      growth: archCount > 0 ? '+100%' : '0%',
      count: archCount,
    },
    {
      stream: 'Turnkey Interior Decor Contracts',
      volumePaise: interiorVolumePaise,
      platformTakeRate: `${settings.interiorDesignerCommissionPercent}%`,
      commissionEarnedPaise: Math.round(interiorVolumePaise * (settings.interiorDesignerCommissionPercent / 100)),
      growth: interiorCount > 0 ? '+100%' : '0%',
      count: interiorCount,
    },
    {
      stream: 'Quotation Token & Consultation Fees',
      volumePaise: tokenFeeVolumePaise,
      platformTakeRate: '100%',
      commissionEarnedPaise: tokenFeeVolumePaise,
      growth: tokenFeeCount > 0 ? '+100%' : '0%',
      count: tokenFeeCount,
    },
  ];

  const totalGMV = financialStreams.reduce((sum, s) => sum + s.volumePaise, 0);
  const totalNetRevenue = financialStreams.reduce((sum, s) => sum + s.commissionEarnedPaise, 0);

  const completedProjects = executionProjects.filter((p) => p.status === 'COMPLETED');
  const activeSites = executionProjects.filter((p) => p.status !== 'COMPLETED');

  const reqCount = requests.length;
  const quotesCount = requests.filter(
    (r) => r.status === 'QUOTATIONS_AVAILABLE' || ((r as any).quotationsCount && (r as any).quotationsCount > 0)
  ).length;
  const bksCount = bookings.length;
  const activeCount = activeSites.length;
  const doneCount = completedProjects.length;

  const funnelMetrics = [
    { step: 'Customer Inquiries & RFQs', count: reqCount, conv: '100%', drop: '0%' },
    {
      step: 'Engineered Quotations Published',
      count: quotesCount,
      conv: reqCount > 0 ? `${Math.round((quotesCount / reqCount) * 100)}%` : '0%',
      drop: reqCount > 0 ? `${Math.max(0, 100 - Math.round((quotesCount / reqCount) * 100))}%` : '0%',
    },
    {
      step: 'Advance Escrow Bookings',
      count: bksCount,
      conv: quotesCount > 0 ? `${Math.round((bksCount / quotesCount) * 100)}%` : '0%',
      drop: quotesCount > 0 ? `${Math.max(0, 100 - Math.round((bksCount / quotesCount) * 100))}%` : '0%',
    },
    {
      step: 'Active Sites Under Construction',
      count: activeCount,
      conv: bksCount > 0 ? `${Math.round((activeCount / bksCount) * 100)}%` : '0%',
      drop: bksCount > 0 ? `${Math.max(0, 100 - Math.round((activeCount / bksCount) * 100))}%` : '0%',
    },
    {
      step: 'Final Handover & Completion',
      count: doneCount,
      conv: activeCount > 0 ? `${Math.round((doneCount / activeCount) * 100)}%` : '0%',
      drop: activeCount > 0 ? `${Math.max(0, 100 - Math.round((doneCount / activeCount) * 100))}%` : '0%',
    },
  ];

  const handleExportCSV = () => {
    const headers = ['Revenue Stream,Transaction Volume (INR),Take Rate,Platform Earnings (INR),Total Transactions'];
    const rows = financialStreams.map(
      (s) =>
        `"${s.stream}",${s.volumePaise / 100},"${s.platformTakeRate}",${s.commissionEarnedPaise / 100},${s.count}`
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `buildghar_financial_report_${timeRange}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    success('Financial report exported successfully as CSV.');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <BarChart3 className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-navy-950">Marketplace Reports & Financial Intelligence</h1>
              <p className="text-xs text-slate-500">
                Gross Merchandise Value (GMV), platform net revenue commissions, escrow volume, and conversion funnel analytics
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Time range switcher */}
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
            {(['7D', '30D', '90D', 'YTD'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  timeRange === range ? 'bg-white text-navy-950 shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                {range}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-sky-600/20 transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Primary Financial KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex justify-between items-center text-xs text-slate-500 font-bold uppercase tracking-wider">
            <span>Total Gross GMV</span>
            <Layers className="w-4 h-4 text-sky-600" />
          </div>
          <p className="text-2xl font-black text-navy-950">{formatINR(totalGMV / 100)}</p>
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+21.4% vs previous period</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-200/80 shadow-2xs space-y-2">
          <div className="flex justify-between items-center text-xs text-emerald-700 font-bold uppercase tracking-wider">
            <span>Net Platform Revenue</span>
            <IndianRupee className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-600">{formatINR(totalNetRevenue / 100)}</p>
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Take-rate margins realized</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-blue-200/80 shadow-2xs space-y-2">
          <div className="flex justify-between items-center text-xs text-blue-700 font-bold uppercase tracking-wider">
            <span>Active Escrow Held</span>
            <ShieldCheck className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-blue-600">{formatINR(5162500)}</p>
          <div className="text-xs text-slate-500 font-medium">
            3-day cooling window enforced
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-purple-200/80 shadow-2xs space-y-2">
          <div className="flex justify-between items-center text-xs text-purple-700 font-bold uppercase tracking-wider">
            <span>Avg Quote Turnaround</span>
            <Clock className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-black text-purple-600">28.4 Hours</p>
          <div className="text-xs text-emerald-600 font-semibold">
            Well within 48h SLA commitment
          </div>
        </div>
      </div>

      {/* Revenue Stream Breakdown Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h2 className="text-sm font-bold text-navy-950">Segmented Platform Revenue Streams</h2>
            <p className="text-xs text-slate-500">Breakdown of gross transactional volume and net platform take-rate</p>
          </div>
          <span className="text-xs font-bold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-200">
            5 Active Revenue Channels
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50/75 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Revenue Stream Channel</th>
                <th className="py-3.5 px-4">Total Transaction Volume</th>
                <th className="py-3.5 px-4">Platform Take-Rate</th>
                <th className="py-3.5 px-4">Net Platform Revenue</th>
                <th className="py-3.5 px-4">Total Orders / Milestones</th>
                <th className="py-3.5 px-4 text-right">Growth Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {financialStreams.map((s, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60 transition">
                  <td className="py-3.5 px-4 font-bold text-navy-950 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-sky-500" />
                    <span>{s.stream}</span>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                    {formatINR(s.volumePaise / 100)}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-sky-700 font-mono">
                    {s.platformTakeRate}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">
                    {formatINR(s.commissionEarnedPaise / 100)}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-700 font-semibold">
                    {s.count} transactions
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <span className="inline-flex items-center gap-0.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      <span>{s.growth}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Two Column Section: Conversion Funnel on Left, Category Popularity on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Marketplace Conversion Funnel */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-navy-950">Marketplace Conversion Funnel</h2>
              <p className="text-xs text-slate-500">Lead inquiries to completed site handover</p>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-600">68.2% Quote Acceptance</span>
          </div>

          <div className="space-y-3 pt-1">
            {funnelMetrics.map((step, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-800">{step.step}</span>
                  <span className="font-mono text-navy-950 font-bold">{step.count} ({step.conv})</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-sky-600 to-blue-700 rounded-full"
                    style={{ width: `${Math.max(10, 100 - idx * 18)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Popularity by Construction Category */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-navy-950">Category & Service Share</h2>
              <p className="text-xs text-slate-500">Demand distribution across construction services</p>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span className="text-slate-800">New Turnkey House Construction (Civil + Finishes)</span>
                <span className="font-mono font-bold text-navy-950">46%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-navy-950 rounded-full w-[46%]" />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span className="text-slate-800">House Map & Architectural Structural Planning</span>
                <span className="font-mono font-bold text-navy-950">28%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full w-[28%]" />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span className="text-slate-800">Turnkey Modern Interior Design Packages</span>
                <span className="font-mono font-bold text-navy-950">16%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full w-[16%]" />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span className="text-slate-800">Structural Home Renovation & Floor Addition</span>
                <span className="font-mono font-bold text-navy-950">10%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-emerald-600 rounded-full w-[10%]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminReports;
