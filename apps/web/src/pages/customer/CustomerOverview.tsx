import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { formatINR, formatDate } from '../../lib/utils.js';
import {
  FileText,
  FileCheck2,
  CalendarCheck,
  CreditCard,
  PlusCircle,
  ArrowRight,
  Clock,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Truck,
  Eye,
  Hammer,
  ShoppingBag,
  Building2,
  MapPin,
  Calculator,
  ShieldCheck,
  DollarSign,
  Activity,
  Calendar,
  Layers,
  HardHat,
  MessageSquare,
  Package,
} from 'lucide-react';
import {
  getPlatformRequests,
  getPlatformBookings,
  PlatformProjectRequest,
  PlatformBooking,
} from '../../data/customerStore.js';
import {
  getExecutionProjects,
  ExecutionProject,
  calculateProjectWeightedProgress,
} from '../../data/projectExecutionStore.js';
import { getVendorOrders } from '../../data/vendorStore.js';

export const CustomerOverview: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<PlatformProjectRequest[]>([]);
  const [executionProjects, setExecutionProjects] = useState<ExecutionProject[]>([]);
  const [quotations, setQuotations] = useState<any[]>([]);
  const [bookings, setBookings] = useState<PlatformBooking[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRealData = () => {
    const rawPhone = user?.phone ? user.phone.replace(/\D/g, '').slice(-10) : '';

    // 1. Real Requests
    const allReqs = getPlatformRequests().filter((r) => {
      if (
        r.customerId === 'usr-cust-1' ||
        r.customerName?.toLowerCase().includes('vikram') ||
        r.customerPhone?.includes('9876543220')
      )
        return false;
      if (user?.id && r.customerId === user.id) return true;
      if (rawPhone && r.customerPhone) {
        return r.customerPhone.replace(/\D/g, '').slice(-10) === rawPhone;
      }
      return !user?.id && !rawPhone;
    });

    // 2. Real Execution Projects
    const allProjects = getExecutionProjects(user?.id, user?.phone);

    // 3. Real Quotations
    let allQuotes: any[] = [];
    try {
      const stored = localStorage.getItem('platform_quotations');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          allQuotes = parsed.filter((q: any) => {
            const qPhone = (q.customerPhone || '').replace(/\D/g, '').slice(-10);
            if (rawPhone && qPhone === rawPhone) return true;
            if (user?.id && q.customerId === user.id) return true;
            return false;
          });
        }
      }
    } catch {}

    // 4. Real Bookings
    const allBks = getPlatformBookings().filter((b) => {
      if (
        b.customerId === 'usr-cust-1' ||
        b.customerName?.toLowerCase().includes('vikram') ||
        b.customerPhone?.includes('9876543220')
      )
        return false;
      if (user?.id && b.customerId === user.id) return true;
      if (rawPhone && b.customerPhone) {
        return b.customerPhone.replace(/\D/g, '').slice(-10) === rawPhone;
      }
      return !user?.id && !rawPhone;
    });

    // 5. Real Material Orders
    const allOrds = getVendorOrders(user?.phone || user?.id || '');

    setRequests(allReqs);
    setExecutionProjects(allProjects);
    setQuotations(allQuotes);
    setBookings(allBks);
    setOrders(allOrds);
    setLoading(false);
  };

  useEffect(() => {
    loadRealData();
    const interval = setInterval(loadRealData, 30000);
    window.addEventListener('storage', loadRealData);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', loadRealData);
    };
  }, [user?.phone, user?.id]);

  // Calculations for 8 KPI Cards
  const kpis = useMemo(() => {
    const totalQuotations = quotations.length || requests.length;
    const pendingQuotations =
      requests.filter((r) => r.status === 'UNDER_REVIEW' || r.status === 'ASSIGNED').length +
      quotations.filter((q) => q.status === 'SUBMITTED' || q.status === 'UNDER_REVIEW').length;

    const activeProjectsList = executionProjects.filter(
      (p) => p.status !== 'COMPLETED' && p.status !== 'CANCELLED'
    );
    const completedProjectsList = executionProjects.filter((p) => p.status === 'COMPLETED');

    const totalProjectValue = activeProjectsList.reduce(
      (sum, p) => sum + (p.contractValuePaise || 0),
      0
    );
    const totalAmountPaid = activeProjectsList.reduce(
      (sum, p) => sum + (p.totalPaidPaise || 0),
      0
    );
    const pendingPayments = activeProjectsList.reduce(
      (sum, p) => sum + (p.amountDuePaise || 0),
      0
    );

    const pendingApprovals = activeProjectsList.reduce((sum, p) => {
      const submittedMilestones = (p.milestones || []).filter(
        (m) => m.status === 'SUBMITTED' || m.status === 'UNDER_REVIEW'
      ).length;
      return sum + submittedMilestones;
    }, 0);

    return {
      totalQuotations,
      pendingQuotations,
      activeProjectsCount: activeProjectsList.length,
      completedProjectsCount: completedProjectsList.length,
      totalProjectValue,
      totalAmountPaid,
      pendingPayments,
      pendingApprovals,
      activeProjectsList,
      completedProjectsList,
    };
  }, [quotations, requests, executionProjects]);

  const primaryActiveProject = kpis.activeProjectsList.length > 0 ? kpis.activeProjectsList[0] : null;

  // Upcoming Milestones across projects
  const upcomingMilestones = useMemo(() => {
    const list: any[] = [];
    kpis.activeProjectsList.forEach((p) => {
      (p.milestones || []).forEach((m) => {
        if (m.status === 'PENDING' || m.status === 'SUBMITTED') {
          list.push({ ...m, projectName: p.name, projectId: p.id });
        }
      });
    });
    return list.slice(0, 5);
  }, [kpis.activeProjectsList]);

  // Recent Site Reports across projects
  const recentSiteReports = useMemo(() => {
    const reports: any[] = [];
    kpis.activeProjectsList.forEach((p) => {
      (p.dailySiteReports || []).forEach((r) => {
        reports.push({ ...r, projectName: p.name, projectId: p.id });
      });
    });
    return reports.slice(0, 4);
  }, [kpis.activeProjectsList]);

  return (
    <div className="space-y-6 font-sans">
      {/* ---------------- 1. TOP EXECUTIVE WELCOME BANNER ---------------- */}
      <div className="bg-gradient-to-br from-[#e8f3fe] via-[#f1f7fe] to-[#e4f0fc] rounded-3xl p-6 sm:p-8 border border-blue-200/90 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-blue-900 text-xs font-semibold uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span className="bg-blue-100/90 px-2.5 py-0.5 rounded-full border border-blue-200/80 font-mono text-[11px] font-bold text-blue-950">
                BuildGhar Customer Workspace
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-black text-navy-950">
              Welcome back, {user?.name || 'Homeowner'}!
            </h1>
            <p className="text-slate-600 font-medium text-xs sm:text-sm max-w-xl leading-relaxed">
              Track your residential construction live, inspect daily site logs, approve engineering milestones, and manage escrow disbursements.
            </p>
          </div>

          {/* Quick Action Buttons (Section 6 requirement) */}
          <div className="flex flex-wrap items-center gap-2.5 pt-2 md:pt-0 shrink-0">
            <Link
              to="/dashboard/create-request"
              className="px-4 py-2 bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-700 hover:from-sky-500 hover:to-blue-600 text-white font-black text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition font-display cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Get New Quotation</span>
            </Link>
            <Link
              to="/dashboard/projects"
              className="px-4 py-2.5 bg-white hover:bg-blue-50 text-slate-800 hover:text-blue-950 font-bold text-xs rounded-xl border border-blue-200 shadow-xs flex items-center gap-1.5 transition font-display cursor-pointer"
            >
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>View My Projects</span>
            </Link>
            <Link
              to="/dashboard/materials"
              className="px-4 py-2.5 bg-white hover:bg-blue-50 text-slate-800 hover:text-blue-950 font-bold text-xs rounded-xl border border-blue-200 shadow-xs flex items-center gap-1.5 transition font-display cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4 text-blue-600" />
              <span>Buy Construction Materials</span>
            </Link>
            <Link
              to="/dashboard/book-services"
              className="px-4 py-2.5 bg-white hover:bg-blue-50 text-slate-800 hover:text-blue-950 font-bold text-xs rounded-xl border border-blue-200 shadow-xs flex items-center gap-1.5 transition font-display cursor-pointer"
            >
              <CalendarCheck className="w-4 h-4 text-blue-600" />
              <span>Book a Service</span>
            </Link>
            <Link
              to="/dashboard/project-payments?tab=approvals"
              className="px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs rounded-xl border border-amber-300 shadow-xs flex items-center gap-1.5 transition font-display cursor-pointer"
            >
              <Eye className="w-4 h-4 text-amber-600" />
              <span>View Pending Approvals ({kpis.pendingApprovals})</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ---------------- 2. REAL SUMMARY METRICS (8 CARDS - SECTION 6 SPEC) ---------------- */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 font-display">
          Real Database Portfolio KPIs
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 text-xs">
          {/* 1. Total Quotations */}
          <Link
            to="/dashboard/quotations"
            className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-blue-600 transition flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <FileText className="w-4 h-4 text-blue-600" />
              <span className="text-[10px] font-bold text-slate-400">Total</span>
            </div>
            <div className="text-xl font-black text-slate-900 font-display">{kpis.totalQuotations}</div>
            <div className="text-[11px] text-slate-500 truncate mt-1">Total Quotations</div>
          </Link>

          {/* 2. Pending Quotations */}
          <Link
            to="/dashboard/quotations?tab=pending"
            className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-gold-500 transition flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <FileCheck2 className="w-4 h-4 text-gold-600" />
              <span className="w-2 h-2 rounded-full bg-gold-500" />
            </div>
            <div className="text-xl font-black text-gold-700 font-display">
              {kpis.pendingQuotations}
            </div>
            <div className="text-[11px] text-slate-500 truncate mt-1">Pending Quotations</div>
          </Link>

          {/* 3. Active Projects */}
          <Link
            to="/dashboard/projects"
            className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-purple-600 transition flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <Hammer className="w-4 h-4 text-purple-600" />
              <span className="text-[10px] font-bold text-purple-600">Live</span>
            </div>
            <div className="text-xl font-black text-slate-900 font-display">
              {kpis.activeProjectsCount}
            </div>
            <div className="text-[11px] text-slate-500 truncate mt-1">Active Projects</div>
          </Link>

          {/* 4. Completed Projects */}
          <Link
            to="/dashboard/projects"
            className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-emerald-600 transition flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-xl font-black text-slate-900 font-display">
              {kpis.completedProjectsCount}
            </div>
            <div className="text-[11px] text-slate-500 truncate mt-1">Completed Projects</div>
          </Link>

          {/* 5. Total Project Value */}
          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <DollarSign className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-sm font-black text-slate-900 font-display truncate">
              {formatINR(kpis.totalProjectValue)}
            </div>
            <div className="text-[11px] text-slate-500 truncate mt-1">Total Project Value</div>
          </div>

          {/* 6. Total Amount Paid */}
          <Link
            to="/dashboard/billing"
            className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-emerald-600 transition flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-sm font-black text-emerald-700 font-display truncate">
              {formatINR(kpis.totalAmountPaid)}
            </div>
            <div className="text-[11px] text-slate-500 truncate mt-1">Total Amount Paid</div>
          </Link>

          {/* 7. Pending Payments */}
          <Link
            to="/dashboard/project-payments?tab=due"
            className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-rose-500 transition flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <CreditCard className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-sm font-black text-rose-700 font-display truncate">
              {formatINR(kpis.pendingPayments)}
            </div>
            <div className="text-[11px] text-slate-500 truncate mt-1">Pending Payments</div>
          </Link>

          {/* 8. Pending Approvals */}
          <Link
            to="/dashboard/project-payments?tab=approvals"
            className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-amber-500 transition flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <Eye className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-xl font-black text-amber-700 font-display">
              {kpis.pendingApprovals}
            </div>
            <div className="text-[11px] text-slate-500 truncate mt-1">Pending Approvals</div>
          </Link>
        </div>
      </div>

      {/* ---------------- 3. DASHBOARD WIDGETS (9 SPECIFIC WIDGETS) ---------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols Wide) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Widget 1 & 2: My Active Projects & Project Completion Progress */}
          {primaryActiveProject ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    Project ID: {primaryActiveProject.id}
                  </span>
                  <h3 className="font-bold text-lg text-navy-950 font-display mt-1">
                    {primaryActiveProject.name}
                  </h3>
                  <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                    <HardHat className="w-3.5 h-3.5 text-slate-400" />
                    <span>Contractor: {primaryActiveProject.contractorFirm || primaryActiveProject.contractorName}</span>
                    <span>•</span>
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{primaryActiveProject.city || 'Main Site'}</span>
                  </div>
                </div>
                <Link
                  to={`/dashboard/projects/${primaryActiveProject.id}`}
                  className="px-3.5 py-2 rounded-xl bg-navy-950 hover:bg-navy-900 text-gold-400 font-bold text-xs flex items-center gap-1.5 transition font-display"
                >
                  <span>Open Project Workspace</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Progress Gauges */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-500">Verified Project Progress: </span>
                    <strong className="text-emerald-700 font-black text-sm">
                      {primaryActiveProject.overallVerifiedProgress || 0}%
                    </strong>
                  </div>
                  <div className="text-slate-400 text-[11px]">
                    Contractor Reported: {primaryActiveProject.overallReportedProgress || 0}%
                  </div>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-teal-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(primaryActiveProject.overallVerifiedProgress || 5, 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span>Current Stage: <strong className="text-slate-800">{primaryActiveProject.currentStage || 'Initial Planning'}</strong></span>
                  <span>Contract Value: <strong className="text-navy-950 font-mono">{formatINR(primaryActiveProject.contractValuePaise)}</strong></span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-8 shadow-xs text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Hammer className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-base font-display text-slate-800">
                  No Active Construction Projects Underway
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  Approve an architectural proposal or request a new house construction quotation to launch your project workspace.
                </p>
              </div>
              <div className="pt-2">
                <Link
                  to="/dashboard/create-request"
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-navy-950 text-gold-400 font-bold font-display text-xs rounded-xl shadow-md transition hover:bg-navy-900"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Request New Quotation</span>
                </Link>
              </div>
            </div>
          )}

          {/* Widget 3: Upcoming Milestones */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-600" />
                <h3 className="font-bold text-sm font-display text-slate-900">Upcoming Construction Milestones</h3>
              </div>
              <Link to="/dashboard/project-payments?tab=schedule" className="text-xs text-navy-950 font-bold hover:underline">
                View Schedule
              </Link>
            </div>

            {upcomingMilestones.length === 0 ? (
              <div className="p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center space-y-1 text-xs">
                <Layers className="w-7 h-7 text-slate-300 mx-auto" />
                <div className="font-bold text-slate-700">No Pending Milestones Scheduled</div>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                  Stage completion milestones and milestone payment schedules will display here once your project is underway.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {upcomingMilestones.map((m, idx) => (
                  <div key={idx} className="p-3.5 bg-slate-50 hover:bg-blue-50/50 rounded-2xl border border-slate-200 flex items-center justify-between gap-3 text-xs transition">
                    <div>
                      <div className="font-bold text-navy-950">{m.title || `Stage ${idx + 1}`}</div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        {m.projectName} • Expected Completion: {m.targetDate || 'Scheduled'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-black text-slate-900">{formatINR(m.amountPaise)}</div>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        m.status === 'SUBMITTED' ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {m.status === 'SUBMITTED' ? 'Awaiting Your Approval' : 'Upcoming'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Widget 5: Recent Site Reports */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-sm font-display text-slate-900">Recent Daily Site Reports</h3>
              </div>
              <Link to="/dashboard/projects/active?tab=daily-reports" className="text-xs text-navy-950 font-bold hover:underline">
                View All Reports
              </Link>
            </div>

            {recentSiteReports.length === 0 ? (
              <div className="p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center space-y-1 text-xs">
                <Activity className="w-7 h-7 text-slate-300 mx-auto" />
                <div className="font-bold text-slate-700">No Daily Site Logs Submitted Yet</div>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                  Site engineers submit daily logs with attendance, weather, material consumption, and photographs.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {recentSiteReports.map((r, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-navy-950 font-display">{r.reportDate || formatDate(r.createdAt)}</span>
                      <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">
                        {r.workersCount || 8} Workers On-Site
                      </span>
                    </div>
                    <p className="text-slate-600 text-[11px] line-clamp-2 leading-relaxed">
                      {r.workCompletedSummary || 'Structural and civil execution work in progress according to approved drawings.'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Widget 6: Recent Material Orders */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-cyan-600" />
                <h3 className="font-bold text-sm font-display text-slate-900">Recent Material Orders</h3>
              </div>
              <Link to="/dashboard/purchases" className="text-xs text-navy-950 font-bold hover:underline">
                View All Orders ({orders.length})
              </Link>
            </div>

            {orders.length === 0 ? (
              <div className="p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center space-y-2 text-xs">
                <ShoppingBag className="w-7 h-7 text-slate-300 mx-auto" />
                <div className="font-bold text-slate-700">No Material Purchases Yet</div>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                  Order verified building materials, cement, steel, tiles, and fittings with direct on-site delivery tracking.
                </p>
                <div className="pt-2">
                  <Link
                    to="/dashboard/materials"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Browse Material Catalog</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                {orders.slice(0, 3).map((ord) => (
                  <div key={ord.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="font-bold text-navy-950">{ord.orderCode || ord.id}</div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        {ord.items?.length || 1} items • {formatDate(ord.createdAt)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-black text-slate-900">{formatINR(ord.totalPaise || ord.totalAmount * 100)}</div>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-cyan-100 text-cyan-800">
                        {ord.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1 Col Wide) */}
        <div className="space-y-6">
          {/* Widget 4: Pending Payment Schedule */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-sm font-display text-navy-950">Pending Payment Schedule</h3>
              </div>
              <Link to="/dashboard/project-payments?tab=due" className="text-xs text-navy-950 font-bold hover:underline">
                View Dues
              </Link>
            </div>

            {kpis.pendingPayments === 0 ? (
              <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-200 text-center space-y-1 text-xs">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
                <div className="font-bold text-emerald-950">All Current Dues Settled</div>
                <p className="text-[11px] text-emerald-700">Zero outstanding milestone dues pending escrow release.</p>
              </div>
            ) : (
              <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-rose-900">Total Milestone Dues:</span>
                  <span className="font-mono font-black text-base text-rose-950">{formatINR(kpis.pendingPayments)}</span>
                </div>
                <Link
                  to="/dashboard/project-payments?tab=due"
                  className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Release Escrow Milestone Payment</span>
                </Link>
              </div>
            )}
          </div>

          {/* Widget 7: Upcoming Appointments & Site Visits */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-sm font-display text-navy-950">Upcoming Appointments</h3>
              </div>
              <Link to="/dashboard/bookings" className="text-xs text-navy-950 font-bold hover:underline">
                View All
              </Link>
            </div>

            {bookings.length === 0 ? (
              <div className="p-5 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center space-y-1 text-xs">
                <Calendar className="w-6 h-6 text-slate-300 mx-auto" />
                <div className="font-bold text-slate-700">No Appointments Scheduled</div>
                <p className="text-[11px] text-slate-400">Book an on-site engineer visit or architectural consultation.</p>
                <div className="pt-2">
                  <Link
                    to="/dashboard/book-services"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-navy-950 text-white font-bold rounded-xl text-xs"
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-gold-400" />
                    <span>Book Site Visit</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                {bookings.slice(0, 3).map((bk) => (
                  <div key={bk.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1 text-xs">
                    <div className="font-bold text-navy-950">{bk.serviceName}</div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      Date: {bk.scheduledDate} • {bk.scheduledTimeSlot || '10:00 AM - 1:00 PM'}
                    </div>
                    <div className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded inline-block">
                      {bk.status}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Widget 8 & 9: Notifications & Recent Transactions */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-gold-600" />
                <h3 className="font-bold text-sm font-display text-navy-950">Recent Financial Transactions</h3>
              </div>
              <Link to="/dashboard/billing" className="text-xs text-navy-950 font-bold hover:underline">
                View All
              </Link>
            </div>

            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-500">
                <span>Account Status:</span>
                <span className="font-bold text-emerald-700">Escrow Protected</span>
              </div>
              <div className="flex items-center justify-between text-slate-500">
                <span>Cumulative Settlements:</span>
                <span className="font-mono font-bold text-navy-950">{formatINR(kpis.totalAmountPaid)}</span>
              </div>
              <div className="pt-2 border-t border-slate-200">
                <Link
                  to="/dashboard/invoices"
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Download Invoices &amp; Receipts</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
