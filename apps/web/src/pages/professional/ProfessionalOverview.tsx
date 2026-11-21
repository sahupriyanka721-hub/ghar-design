import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { Badge } from '../../components/common/Badge.js';
import { formatINR, formatDate } from '../../lib/utils.js';
import {
  Building2,
  FileText,
  FileCheck2,
  CalendarCheck,
  PlusCircle,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Inbox,
  Clock,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  CreditCard,
  Layers,
  MapPin,
  Calendar,
  MessageSquare,
} from 'lucide-react';
import { getPlatformRequests, getPlatformBookings, syncChannel } from '../../data/customerStore.js';
import { getExecutionProjects } from '../../data/projectExecutionStore.js';
import {
  getProfessionalByPhone,
  getProfessionalAccounts,
  getProfessionalPayoutRequests,
} from '../../data/professionalStore.js';

export const ProfessionalOverview: React.FC = () => {
  const { user } = useAuth();
  const [dateFilter, setDateFilter] = useState<'7D' | '30D' | 'ALL'>('ALL');

  // Load real store data with fallback to primary professional fixture
  const archAccount =
    (user?.phone ? getProfessionalByPhone(user.phone) : null) || getProfessionalAccounts()[0] || null;
  const [requests, setRequests] = useState(() =>
    getPlatformRequests().filter((r) => !r.categorySlug || !r.categorySlug.toLowerCase().includes('interior'))
  );

  useEffect(() => {
    const loadRequests = () => {
      setRequests(
        getPlatformRequests().filter((r) => !r.categorySlug || !r.categorySlug.toLowerCase().includes('interior'))
      );
    };
    window.addEventListener('storage', loadRequests);
    const onSync = (event: MessageEvent) => {
      if (
        event.data?.type === 'PROJECT_REQUESTS_UPDATED' ||
        event.data?.type === 'QUOTATIONS_UPDATED'
      ) {
        loadRequests();
      }
    };
    if (syncChannel) {
      syncChannel.addEventListener('message', onSync);
    }
    return () => {
      window.removeEventListener('storage', loadRequests);
      if (syncChannel) {
        syncChannel.removeEventListener('message', onSync);
      }
    };
  }, []);
  const bookings = getPlatformBookings();
  const projects = getExecutionProjects();
  const payouts = getProfessionalPayoutRequests(user?.phone || '');

  // Summary Metrics
  const totalAssigned = requests.length;
  const draftQuotations = 1;
  const submittedQuotations = Math.max(1, requests.length);
  const awaitingRevision = 0;
  const customerSelected = bookings.length;
  const activeBookings = bookings.filter((b) => b.status === 'CONFIRMED' || b.status === 'PENDING').length;
  const activeProjects = projects.filter((p) => p.status !== 'COMPLETED' && p.status !== 'CANCELLED').length;
  const completedProjects = projects.filter((p) => p.status === 'COMPLETED').length;
  const totalContractPaise = projects.reduce((acc, p) => acc + (p.contractValuePaise || (p as any).totalContractPaise || 0), 0) ;
  const totalEarningsPaise = Math.round(totalContractPaise * 0.45);
  const pendingPaymentsPaise = Math.round(totalContractPaise * 0.55);

  const firmTitle = archAccount?.business?.firmName || (user?.name ? `${user.name}` : 'Associate Professional Firm');

  return (
    <div className="space-y-6">
      {/* Top Banner with Light Blue Background & High-Contrast Visible Typography */}
      <div className="bg-gradient-to-br from-[#e8f3fe] via-[#f1f7fe] to-[#e4f0fc] text-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-blue-200/90 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-10 -bottom-10 w-60 h-60 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-black bg-blue-100 text-blue-900 border border-blue-200 uppercase tracking-wider font-mono">
                Civil Engineering Practice
              </span>
              <span className="flex items-center gap-1 text-[11px] text-emerald-800 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> IEI Accredited
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-navy-950">
              {firmTitle}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 font-medium max-w-2xl leading-relaxed">
              Real-time engineering operations desk: assigned homeowner briefs, IS 456 compliant progress tracking, and milestone escrow settlements.
            </p>
          </div>

          {/* Quick Actions & Date Filter */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="bg-white/90 backdrop-blur-md rounded-2xl p-1 border border-blue-200/90 shadow-2xs flex text-xs font-bold text-slate-700">
              {(['7D', '30D', 'ALL'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setDateFilter(mode)}
                  className={`px-3 py-1.5 rounded-xl transition font-bold ${
                    dateFilter === mode ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-navy-950 hover:bg-blue-50'
                  }`}
                >
                  {mode === '7D' ? 'Last 7 Days' : mode === '30D' ? 'Last 30 Days' : 'All Time'}
                </button>
              ))}
            </div>

            <Link
              to="/professional/quotation-builder"
              className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white text-xs font-bold rounded-2xl shadow-md shadow-blue-600/20 transition flex items-center gap-2 active:scale-98"
            >
              <PlusCircle className="w-4 h-4 text-white" />
              <span>Create BOQ Quotation</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 10 Summary Cards Grid (Master Prompt Section 8) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* 1. Total Assigned Requests */}
        <Link
          to="/professional/assigned"
          className="bg-white p-4 rounded-2xl border border-sky-200/90 shadow-2xs hover:border-sky-400 hover:shadow-xs transition space-y-1 block"
        >
          <div className="text-[10px] font-mono text-slate-400 font-bold uppercase truncate">
            Assigned Requests
          </div>
          <div className="text-xl font-black text-navy-950 font-mono">{totalAssigned}</div>
          <span className="text-[10px] text-sky-800 font-bold flex items-center gap-1">
            View allocated <ArrowRight className="w-3 h-3" />
          </span>
        </Link>

        {/* 2. Quotations in Draft */}
        <Link
          to="/professional/quotations"
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:border-sky-400 hover:shadow-xs transition space-y-1 block"
        >
          <div className="text-[10px] font-mono text-slate-400 font-bold uppercase truncate">
            Draft Quotations
          </div>
          <div className="text-xl font-black text-slate-700 font-mono">{draftQuotations}</div>
          <span className="text-[10px] text-slate-500 font-medium">Unsubmitted drafts</span>
        </Link>

        {/* 3. Quotations Submitted */}
        <Link
          to="/professional/quotations"
          className="bg-white p-4 rounded-2xl border border-sky-200/90 shadow-2xs hover:border-sky-400 hover:shadow-xs transition space-y-1 block"
        >
          <div className="text-[10px] font-mono text-slate-400 font-bold uppercase truncate">
            Bids Submitted
          </div>
          <div className="text-xl font-black text-sky-800 font-mono">{submittedQuotations}</div>
          <span className="text-[10px] text-sky-800 font-bold">Admin review queue</span>
        </Link>

        {/* 4. Quotations Awaiting Revision */}
        <Link
          to="/professional/quotations"
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:border-amber-400 hover:shadow-xs transition space-y-1 block"
        >
          <div className="text-[10px] font-mono text-slate-400 font-bold uppercase truncate">
            Revisions Req.
          </div>
          <div className="text-xl font-black text-amber-800 font-mono">{awaitingRevision}</div>
          <span className="text-[10px] text-amber-700 font-medium">Action pending</span>
        </Link>

        {/* 5. Customer-Selected Quotations */}
        <Link
          to="/professional/quotations/approved"
          className="bg-white p-4 rounded-2xl border border-blue-200/90 shadow-2xs hover:border-blue-400 hover:shadow-xs transition space-y-1 block"
        >
          <div className="text-[10px] font-mono text-blue-700 font-bold uppercase truncate">
            Customer Selected
          </div>
          <div className="text-xl font-black text-blue-900 font-mono">{customerSelected}</div>
          <span className="text-[10px] text-blue-800 font-bold flex items-center gap-1">
            Confirmed bids <ArrowRight className="w-3 h-3" />
          </span>
        </Link>

        {/* 6. Active Bookings */}
        <Link
          to="/professional/bookings"
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:border-sky-400 hover:shadow-xs transition space-y-1 block"
        >
          <div className="text-[10px] font-mono text-slate-400 font-bold uppercase truncate">
            Active Bookings
          </div>
          <div className="text-xl font-black text-slate-900 font-mono">{activeBookings}</div>
          <span className="text-[10px] text-slate-500 font-medium">Site visits & contracts</span>
        </Link>

        {/* 7. Active Projects */}
        <Link
          to="/professional/projects"
          className="bg-white p-4 rounded-2xl border border-sky-200/90 shadow-2xs hover:border-sky-400 hover:shadow-xs transition space-y-1 block"
        >
          <div className="text-[10px] font-mono text-sky-800 font-bold uppercase truncate">
            Active Projects
          </div>
          <div className="text-xl font-black text-sky-900 font-mono">{activeProjects}</div>
          <span className="text-[10px] text-sky-800 font-bold">IS 456 tracking</span>
        </Link>

        {/* 8. Completed Projects */}
        <Link
          to="/professional/projects"
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:border-sky-400 hover:shadow-xs transition space-y-1 block"
        >
          <div className="text-[10px] font-mono text-slate-400 font-bold uppercase truncate">
            Completed Projects
          </div>
          <div className="text-xl font-black text-slate-800 font-mono">{completedProjects}</div>
          <span className="text-[10px] text-slate-500 font-medium">Handed over</span>
        </Link>

        {/* 9. Pending Payments */}
        <Link
          to="/professional/billing"
          className="bg-white p-4 rounded-2xl border border-amber-200/90 shadow-2xs hover:border-amber-400 hover:shadow-xs transition space-y-1 block"
        >
          <div className="text-[10px] font-mono text-amber-700 font-bold uppercase truncate">
            Pending Escrow
          </div>
          <div className="text-sm font-black text-amber-900 font-mono truncate">
            {formatINR(pendingPaymentsPaise)}
          </div>
          <span className="text-[10px] text-amber-700 font-medium">Stage locked</span>
        </Link>

        {/* 10. Total Earnings */}
        <Link
          to="/professional/billing"
          className="bg-white p-4 rounded-2xl border border-emerald-200/90 shadow-2xs hover:border-emerald-400 hover:shadow-xs transition space-y-1 block"
        >
          <div className="text-[10px] font-mono text-emerald-700 font-bold uppercase truncate">
            Total Earnings
          </div>
          <div className="text-sm font-black text-emerald-800 font-mono truncate">
            {formatINR(totalEarningsPaise)}
          </div>
          <span className="text-[10px] text-emerald-700 font-bold">Disbursed & ready</span>
        </Link>
      </div>

      {/* Main Two Columns Dashboard Body */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Projects Execution Snapshot */}
          <div className="bg-white rounded-2xl border border-sky-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-sky-600" />
                <h3 className="font-bold text-slate-900 text-sm">Active Projects Execution & Progress</h3>
              </div>
              <Link
                to="/professional/projects"
                className="text-xs font-bold text-sky-800 hover:text-navy-950 flex items-center gap-1"
              >
                <span>Full Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {projects.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">No active projects linked yet.</div>
            ) : (
              <div className="space-y-4">
                {projects.slice(0, 3).map((p) => (
                  <div key={p.id} className="p-4 rounded-xl border border-slate-200 hover:border-sky-300 transition space-y-2.5 text-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-sky-700">{(p as any).projectCode || p.requestCode || p.id}</span>
                          <span className="font-bold text-slate-900">{(p as any).title || p.name}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Client: {p.customerName} • {(p as any).location?.locality || p.propertyAddress || p.city || 'Site'}, {(p as any).location?.city || p.city || ''}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-mono font-bold text-blue-900">{formatINR((p as any).totalContractPaise || p.contractValuePaise || 0)}</span>
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-mono">
                        <span className="text-slate-500">IS 456 Structural Milestone Progress</span>
                        <span className="font-bold text-sky-800">{Math.round((p as any).weightedProgressPercent ?? p.overallVerifiedProgress ?? p.overallReportedProgress ?? 0)}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-sky-500 to-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${Math.round((p as any).weightedProgressPercent ?? p.overallVerifiedProgress ?? p.overallReportedProgress ?? 0)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Assigned Requests */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-sky-600" />
                <h3 className="font-bold text-slate-900 text-sm">Recent Assigned Customer Requests</h3>
              </div>
              <Link
                to="/professional/assigned"
                className="text-xs font-bold text-sky-800 hover:text-navy-950 flex items-center gap-1"
              >
                <span>View All ({requests.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {requests.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">No pending requests allocated.</div>
            ) : (
              <div className="divide-y divide-slate-100 text-xs">
                {requests.slice(0, 4).map((r) => (
                  <div key={r.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 font-mono font-bold text-slate-900">
                        <span>{r.requestCode}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-sky-100 text-sky-900">
                          {r.category}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        {(r as any).locality || r.city || 'Site'}, {r.city || ''} • Plot: {r.plotArea || ''} {r.measurementUnit || 'sq.ft'}
                      </div>
                    </div>

                    <Link
                      to={`/professional/quotation-builder?requestId=${r.id}`}
                      className="px-3.5 py-1.5 bg-sky-50 text-sky-800 hover:bg-sky-100 border border-sky-200 rounded-xl font-bold transition flex items-center gap-1 self-start sm:self-auto"
                    >
                      <PlusCircle className="w-3.5 h-3.5 text-sky-600" />
                      <span>Prepare Quotation</span>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1 Col) */}
        <div className="space-y-6">
          {/* IEI Accreditation & Verification Card */}
          <div className="bg-gradient-to-br from-blue-50 to-sky-50/60 rounded-2xl border border-blue-200/80 p-5 shadow-2xs space-y-3 text-xs">
            <div className="flex items-center gap-2 font-bold text-blue-900">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              <span>IEI & Firm Verification Desk</span>
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              your firm is verified under the Council of Professionalure and GharDesign engineering standards. Authorized to generate BOQs and structural drawing packages.
            </p>
            <div className="pt-2 border-t border-blue-100 flex items-center justify-between text-[11px]">
              <span className="text-slate-500 font-mono">App Ref: {archAccount?.applicationNumber || 'APP-2026-1001'}</span>
              <Link to="/professional/profile" className="font-bold text-blue-800 hover:underline">
                View Credentials ?
              </Link>
            </div>
          </div>

          {/* Upcoming Deadlines Widget */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3 text-xs">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>Upcoming Milestones & Deadlines</span>
            </div>

            <div className="space-y-2.5">
              <div className="p-3 bg-amber-50/60 border border-amber-200/70 rounded-xl space-y-1">
                <div className="flex justify-between font-bold text-amber-900">
                  <span>Preliminary 2D Floor Plan</span>
                  <span className="text-[10px] font-mono">2 Days Left</span>
                </div>
                <div className="text-[11px] text-slate-600">Client: Arpit Sharma (Noida Sector 150)</div>
              </div>

              <div className="p-3 bg-sky-50/60 border border-sky-200/70 rounded-xl space-y-1">
                <div className="flex justify-between font-bold text-sky-900">
                  <span>3D Front Elevation Walkthrough</span>
                  <span className="text-[10px] font-mono">5 Days Left</span>
                </div>
                <div className="text-[11px] text-slate-600">Client: Sunita Verma (Gurugram Sec 48)</div>
              </div>
            </div>
          </div>

          {/* Quick Support Desk Link */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <MessageSquare className="w-4 h-4 text-sky-600" />
                <span>Admin Messages Desk</span>
              </div>
              <Link to="/professional/support" className="text-sky-800 font-bold hover:underline">
                Open
              </Link>
            </div>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Need assistance with client revision limits, drawing signoffs, or escrow settlements? Connect directly with the verification cell.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
