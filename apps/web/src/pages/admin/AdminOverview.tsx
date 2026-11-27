import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { formatINR, formatDate } from '../../lib/utils.js';
import {
  getRegisteredCustomers,
  getPlatformRequests,
  getPlatformBookings,
  clearAllPlatformData,
  RegisteredCustomer,
  PlatformProjectRequest,
  PlatformBooking,
} from '../../data/customerStore.js';
import {
  getArchitectAccounts,
  updateArchitectStatus,
  ArchitectAccount,
} from '../../data/architectStore.js';
import { getInteriorDesignerAccounts } from '../../data/interiorDesignerStore.js';
import {
  getPlatformContractors,
  getPlatformSupportTickets,
  getPlatformAuditLogs,
} from '../../data/adminStore.js';
import {
  getExecutionProjects,
  ExecutionProject,
} from '../../data/projectExecutionStore.js';
import {
  getRegisteredVendors,
  getVendorOrders,
  getVendorPayouts,
} from '../../data/vendorStore.js';
import {
  getActiveAdminRole,
  ADMIN_ROLES_V2,
  logAdminAuditAction,
} from '../../data/adminRbacStore.js';
import { pullFromCloud, clearCloudData, pushToCloud } from '../../data/cloudSync.js';
import { ensureDemoDataInitialized } from '../../data/seedDemoData.js';
import { useToast } from '../../context/ToastContext.js';
import {
  Users,
  Compass,
  HardHat,
  Building,
  FileText,
  FileCheck2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Trash2,
  Sparkles,
  ShieldCheck,
  Crown,
  MapPin,
  HelpCircle,
  CreditCard,
  TrendingUp,
  AlertCircle,
  Eye,
  Check,
  ChevronRight,
  Activity,
  DollarSign,
  Wallet,
  Send,
  Layers,
  Filter,
} from 'lucide-react';

export const AdminOverview: React.FC = () => {
  const [timeFilter, setTimeFilter] = useState<
    'TODAY' | 'YESTERDAY' | 'LAST_7_DAYS' | 'LAST_30_DAYS' | 'THIS_MONTH' | 'ALL'
  >('THIS_MONTH');
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [activeTabTable, setActiveTabTable] = useState<
    'REQUESTS' | 'ARCHITECTS' | 'QUOTATIONS' | 'MILESTONES' | 'PAYMENTS' | 'COMPLAINTS'
  >('REQUESTS');

  const { success, error: toastError } = useToast();
  const activeRole = getActiveAdminRole();
  const roleMeta = ADMIN_ROLES_V2[activeRole];

  // Refresh trigger listeners
  useEffect(() => {
    const onRefresh = () => setRefreshKey((k) => k + 1);
    window.addEventListener('storage', onRefresh);
    window.addEventListener('admin_global_refresh', onRefresh);
    window.addEventListener('architect_store_updated', onRefresh);
    window.addEventListener('admin_role_switched', onRefresh);
    return () => {
      window.removeEventListener('storage', onRefresh);
      window.removeEventListener('admin_global_refresh', onRefresh);
      window.removeEventListener('architect_store_updated', onRefresh);
      window.removeEventListener('admin_role_switched', onRefresh);
    };
  }, []);

  // Live Database Stores
  const customers = useMemo(() => getRegisteredCustomers(), [refreshKey]);
  const architects = useMemo(() => getArchitectAccounts(), [refreshKey]);
  const requests = useMemo(() => getPlatformRequests(), [refreshKey]);
  const bookings = useMemo(() => getPlatformBookings(), [refreshKey]);
  const projects = useMemo(() => getExecutionProjects(), [refreshKey]);
  const supportTickets = useMemo(() => getPlatformSupportTickets(), [refreshKey]);
  const auditLogs = useMemo(() => getPlatformAuditLogs(), [refreshKey]);
  const vendorOrders = useMemo(() => getVendorOrders(), [refreshKey]);
  const vendorPayouts = useMemo(() => getVendorPayouts(), [refreshKey]);

  // Load Quotations from localStorage
  const quotations = useMemo(() => {
    try {
      const stored = localStorage.getItem('platform_quotations');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // fallback
    }
    return [];
  }, [refreshKey]);

  // Load Payments from localStorage (Aggregated across material orders and quotation/request fees)
  const paymentsList = useMemo(() => {
    const list: Array<{
      id: string;
      code: string;
      payerName: string;
      payerPhone: string;
      purpose: string;
      amountPaise: number;
      status: 'PAYMENT_SUCCESSFUL' | 'PENDING_COLLECTION' | 'FAILED' | 'REFUNDED';
      date: string;
      method: string;
    }> = [];

    // 1. Material Orders
    vendorOrders.forEach((order) => {
      list.push({
        id: `pay-order-${order.id}`,
        code: order.orderCode || `ORD-${order.id.slice(0, 6)}`,
        payerName: order.customerName || 'Customer',
        payerPhone: order.customerPhone || '',
        purpose: 'Building Materials & Fittings',
        amountPaise: order.totalAmountPaise || 0,
        status:
          order.paymentStatus === 'PAID' || order.paymentStatus === 'PAYMENT_SUCCESSFUL'
            ? 'PAYMENT_SUCCESSFUL'
            : order.paymentStatus === 'FAILED'
            ? 'FAILED'
            : 'PENDING_COLLECTION',
        date: order.createdAt || new Date().toISOString(),
        method: order.paymentMethod || 'Razorpay Gateway',
      });
    });

    // 2. Project Request Fees
    requests.forEach((req) => {
      if (req.quoteFeePaise || req.isFeePaid) {
        list.push({
          id: `pay-req-${req.id}`,
          code: `PAY-REQ-${req.requestCode || req.id.slice(0, 6)}`,
          payerName: req.customerName,
          payerPhone: req.customerPhone,
          purpose: `Design Consultation Fee (${req.categorySlug || 'Architecture'})`,
          amountPaise: req.quoteFeePaise || 99900,
          status: req.isFeePaid ? 'PAYMENT_SUCCESSFUL' : 'PENDING_COLLECTION',
          date: req.createdAt,
          method: 'UPI / NetBanking',
        });
      }
    });

    // 3. Project Milestone Payments
    projects.forEach((prj) => {
      if (Array.isArray(prj.milestones)) {
        prj.milestones.forEach((m) => {
          if (m.status === 'PAID' || m.paidAt) {
            list.push({
              id: `pay-mile-${prj.id}-${m.id}`,
              code: `MIL-PAY-${m.milestoneNumber}`,
              payerName: prj.customerName,
              payerPhone: prj.customerPhone || '',
              purpose: `Milestone #${m.milestoneNumber}: ${m.title} (${prj.name})`,
              amountPaise: m.amountPaise || 0,
              status: 'PAYMENT_SUCCESSFUL',
              date: m.paidAt || prj.updatedAt || new Date().toISOString(),
              method: 'Escrow Bank Transfer',
            });
          } else if (m.status === 'SUBMITTED_FOR_REVIEW' || m.status === 'PAYMENT_DUE') {
            list.push({
              id: `pay-mile-due-${prj.id}-${m.id}`,
              code: `MIL-DUE-${m.milestoneNumber}`,
              payerName: prj.customerName,
              payerPhone: prj.customerPhone || '',
              purpose: `Milestone #${m.milestoneNumber}: ${m.title} (${prj.name})`,
              amountPaise: m.amountPaise || 0,
              status: 'PENDING_COLLECTION',
              date: m.submittedAt || prj.updatedAt || new Date().toISOString(),
              method: 'Awaiting Escrow Deposit',
            });
          }
        });
      }
    });

    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [vendorOrders, requests, projects]);

  // All 15 Master KPIs calculated directly from actual state
  const metrics = useMemo(() => {
    // 1. Total Customers
    const totalCustomers = customers.length;

    // 2. Total Registered Architects
    const totalArchitects = architects.length;

    // 3. Pending Architect Approvals
    const pendingArchitectApprovals = architects.filter(
      (a) =>
        a.accountStatus === 'PENDING_APPROVAL' ||
        (a as any).verificationStatus === 'PENDING' ||
        a.accountStatus === 'KYC_SUBMITTED'
    ).length;

    // 4. Total Quotation Requests
    const totalQuotationRequests = requests.length;

    // 5. Pending Quotation Assignments (Requests awaiting architect allocation)
    const pendingAssignments = requests.filter(
      (r) =>
        !r.assignedArchitectId &&
        (!r.assignedProfessionalIds || r.assignedProfessionalIds.length === 0) &&
        r.status !== 'CANCELLED' &&
        r.status !== 'COMPLETED'
    ).length;

    // 6. Quotations Awaiting Admin Review
    const quotesUnderReview = quotations.filter(
      (q: any) =>
        q.status === 'UNDER_REVIEW' ||
        q.status === 'SUBMITTED' ||
        q.status === 'PENDING_APPROVAL'
    ).length;

    // 7. Quotations Sent to Customers
    const quotesSentToCustomer = quotations.filter(
      (q: any) =>
        q.status === 'SENT_TO_CUSTOMER' ||
        q.status === 'APPROVED' ||
        q.status === 'CUSTOMER_ACCEPTED'
    ).length;

    // 8. Active Projects
    const activeProjects = projects.filter(
      (p) => p.status === 'ACTIVE' || p.status === 'IN_PROGRESS'
    ).length;

    // 9. Projects Delayed
    const projectsDelayed = projects.filter(
      (p) =>
        p.status === 'DELAYED' ||
        p.status === 'ON_HOLD' ||
        (p as any).isDelayed === true
    ).length;

    // 10. Pending Milestone Approvals
    let pendingMilestoneApprovals = 0;
    projects.forEach((p) => {
      if (Array.isArray(p.milestones)) {
        p.milestones.forEach((m) => {
          if (m.status === 'SUBMITTED_FOR_REVIEW') {
            pendingMilestoneApprovals++;
          }
        });
      }
    });

    // 11. Customer Payments Received (Paise)
    const successfulPayments = paymentsList.filter((p) => p.status === 'PAYMENT_SUCCESSFUL');
    const customerPaymentsReceivedPaise = successfulPayments.reduce(
      (sum, p) => sum + (p.amountPaise || 0),
      0
    );

    // 12. Payments Awaiting Verification
    const pendingPayments = paymentsList.filter((p) => p.status === 'PENDING_COLLECTION');
    const paymentsAwaitingVerificationCount = pendingPayments.length;
    const paymentsAwaitingVerificationPaise = pendingPayments.reduce(
      (sum, p) => sum + (p.amountPaise || 0),
      0
    );

    // 13. Architect Payouts Pending (Paise & Count)
    let architectPayoutsPendingCount = 0;
    let architectPayoutsPendingPaise = 0;
    projects.forEach((p) => {
      if (Array.isArray(p.milestones)) {
        p.milestones.forEach((m) => {
          if (m.status === 'APPROVED' || m.status === 'PAYMENT_DUE') {
            architectPayoutsPendingCount++;
            // 90% payout to architect after 10% platform fee
            architectPayoutsPendingPaise += Math.round((m.amountPaise || 0) * 0.9);
          }
        });
      }
    });
    // Add pending vendor payouts
    const pendingVendorPayouts = vendorPayouts.filter(
      (vp) => vp.status === 'PENDING' || vp.status === 'PROCESSING'
    );
    architectPayoutsPendingCount += pendingVendorPayouts.length;
    architectPayoutsPendingPaise += pendingVendorPayouts.reduce(
      (sum, vp) => sum + (vp.netAmountPaise || 0),
      0
    );

    // 14. Total Platform Revenue / Commission (Paise)
    // 10% on project milestones + 5% on material orders + 100% on consultation fees
    const milestoneRevenue = Math.round(
      projects.reduce((sum, p) => {
        if (!Array.isArray(p.milestones)) return sum;
        return (
          sum +
          p.milestones
            .filter((m) => m.status === 'PAID')
            .reduce((s, m) => s + (m.amountPaise || 0), 0) *
            0.1
        );
      }, 0)
    );
    const materialCommission = Math.round(
      vendorOrders
        .filter((o) => o.paymentStatus === 'PAID')
        .reduce((sum, o) => sum + (o.totalAmountPaise || 0), 0) * 0.05
    );
    const consultationFees = requests
      .filter((r) => r.isFeePaid)
      .reduce((sum, r) => sum + (r.quoteFeePaise || 99900), 0);
    const totalPlatformRevenuePaise = milestoneRevenue + materialCommission + consultationFees;

    // 15. Open Complaints & Disputes
    const openComplaints = supportTickets.filter(
      (t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS' || t.status === 'ESCALATED'
    ).length;

    return {
      totalCustomers,
      totalArchitects,
      pendingArchitectApprovals,
      totalQuotationRequests,
      pendingAssignments,
      quotesUnderReview,
      quotesSentToCustomer,
      activeProjects,
      projectsDelayed,
      pendingMilestoneApprovals,
      customerPaymentsReceivedPaise,
      paymentsAwaitingVerificationCount,
      paymentsAwaitingVerificationPaise,
      architectPayoutsPendingCount,
      architectPayoutsPendingPaise,
      totalPlatformRevenuePaise,
      openComplaints,
    };
  }, [
    customers,
    architects,
    requests,
    quotations,
    projects,
    paymentsList,
    vendorOrders,
    vendorPayouts,
    supportTickets,
  ]);

  // Milestones waiting for review across all projects
  const pendingMilestonesList = useMemo(() => {
    const list: Array<{
      projectId: string;
      projectName: string;
      customerName: string;
      architectName?: string;
      milestone: any;
    }> = [];

    projects.forEach((prj) => {
      if (Array.isArray(prj.milestones)) {
        prj.milestones.forEach((m) => {
          if (m.status === 'SUBMITTED_FOR_REVIEW' || m.status === 'PAYMENT_DUE') {
            list.push({
              projectId: prj.id,
              projectName: prj.name,
              customerName: prj.customerName,
              architectName: prj.architectName || 'Assigned Architect',
              milestone: m,
            });
          }
        });
      }
    });

    return list;
  }, [projects]);

  // Handlers for quick admin actions
  const handleApproveArchitect = async (archId: string, archName: string) => {
    updateArchitectStatus(archId, 'ACTIVE', 'COA and identity verified by Admin');
    logAdminAuditAction({
      action: 'APPROVE_ARCHITECT_APPLICATION',
      module: 'ARCHITECT_MANAGEMENT',
      targetId: archId,
      targetName: archName,
      details: { verifiedAt: new Date().toISOString() },
    });
    await pushToCloud();
    setRefreshKey((k) => k + 1);
    success(`Architect ${archName} (${archId}) has been successfully approved & verified!`);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await pullFromCloud();
      setRefreshKey((k) => k + 1);
      success('Platform database synchronized with cloud relay.');
    } catch {
      setRefreshKey((k) => k + 1);
      success('Analytics refreshed.');
    } finally {
      setTimeout(() => setRefreshing(false), 500);
    }
  };

  const handleLoadDemo = () => {
    ensureDemoDataInitialized(true);
    setRefreshKey((k) => k + 1);
    success('Realistic BuildGhar master data loaded across all 25 modules!');
  };

  const handleClearAll = async () => {
    setClearing(true);
    try {
      clearAllPlatformData();
      await clearCloudData();
      setRefreshKey((k) => k + 1);
      setShowClearModal(false);
      success('Platform data cleared completely. All metrics reset to 0.');
    } catch {
      clearAllPlatformData();
      setRefreshKey((k) => k + 1);
      setShowClearModal(false);
      success('Local data reset.');
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
      {/* 1. TOP EXECUTIVE WELCOME & WORKSPACE BANNER */}
      <div className="bg-gradient-to-r from-navy-950 via-[#0d223f] to-[#14325a] text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-navy-800 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-400/15 border border-amber-400/30 rounded-full text-amber-300 font-mono text-[11px] font-bold uppercase tracking-wider">
              <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>{roleMeta.title} Executive Console</span>
              <span className="text-white/40">•</span>
              <span className="text-slate-300 font-normal">BuildGhar 2026 Admin Core</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black font-display tracking-tight text-white">
              Platform Master Dashboard
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              Centralized administrative control and routing router enforcing strict{' '}
              <strong className="text-amber-300 font-semibold">Customer ➔ Admin ➔ Architect</strong>{' '}
              workflows across customer quotation requests, architectural plan submissions, milestone escrow
              disbursements, and pan-India project execution.
            </p>
          </div>

          {/* Quick Header Actions & Time Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Time Filter Pill Strip */}
            <div className="flex items-center gap-1 bg-navy-900/90 p-1 rounded-2xl border border-white/10 backdrop-blur-md text-xs font-semibold">
              {[
                { label: 'Today', value: 'TODAY' },
                { label: '7 Days', value: 'LAST_7_DAYS' },
                { label: 'This Month', value: 'THIS_MONTH' },
                { label: 'All Time', value: 'ALL' },
              ].map((pill) => (
                <button
                  key={pill.value}
                  type="button"
                  onClick={() => setTimeFilter(pill.value as any)}
                  className={`px-3 py-1.5 rounded-xl transition text-xs font-semibold cursor-pointer ${
                    timeFilter === pill.value
                      ? 'bg-amber-400 text-navy-950 font-bold shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            {/* Live Refresh Button */}
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-slate-200 transition disabled:opacity-50 flex items-center justify-center cursor-pointer shadow-xs"
              title="Refresh Platform Analytics & Cloud Sync"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-amber-300' : ''}`} />
            </button>

            {/* Load Realistic Demo Data Button */}
            <button
              type="button"
              onClick={handleLoadDemo}
              className="px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/30 text-emerald-200 hover:text-white transition flex items-center gap-1.5 cursor-pointer text-xs font-bold shadow-xs"
              title="Populate realistic demo records across all modules"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Load Demo Data</span>
            </button>

            {/* Clear Data Button */}
            <button
              type="button"
              onClick={() => setShowClearModal(true)}
              disabled={clearing}
              className="px-3 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/30 text-rose-200 hover:text-white transition flex items-center gap-1.5 cursor-pointer text-xs font-bold shadow-xs disabled:opacity-50"
              title="Reset all counts to 0"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>
        </div>

        {/* Centralized Routing Status Pill Bar */}
        <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 font-mono text-[11px] font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Central Routing Engine Active
            </span>
            <span className="text-slate-400 text-[11px] hidden md:inline">
              Every customer quotation, milestone, and payout is strictly moderated by Admin before client delivery.
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] font-mono text-slate-300">
            <span>Pending Admin Actions:</span>
            <span className="px-2 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 font-bold">
              {metrics.pendingAssignments +
                metrics.pendingArchitectApprovals +
                metrics.quotesUnderReview +
                metrics.pendingMilestoneApprovals +
                metrics.openComplaints}{' '}
              Items
            </span>
          </div>
        </div>
      </div>

      {/* 2. THE 15 MASTER EXECUTIVE KPI CARDS (SECTION 5 SPECIFICATION) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-navy-950" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              Executive Platform KPIs (15 Key Metrics)
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">Real-time database statistics</span>
        </div>

        {/* 15 Cards Grid: 5 cols on 2xl, 3-4 cols on lg, 2 cols on mobile */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3.5">
          {/* KPI 1: Total Customers */}
          <Link
            to="/admin/customers"
            className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-blue-400 shadow-2xs hover:shadow-md transition space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                1. Total Customers
              </span>
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black font-display text-navy-950">
              {metrics.totalCustomers}
            </div>
            <div className="text-[11px] text-blue-700 font-semibold flex items-center gap-1">
              <span>View Customer Directory →</span>
            </div>
          </Link>

          {/* KPI 2: Total Registered Architects */}
          <Link
            to="/admin/architects"
            className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-purple-400 shadow-2xs hover:shadow-md transition space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                2. Registered Architects
              </span>
              <div className="p-2 rounded-xl bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition">
                <Compass className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black font-display text-navy-950">
              {metrics.totalArchitects}
            </div>
            <div className="text-[11px] text-purple-700 font-semibold flex items-center gap-1">
              <span>Architect Network Hub →</span>
            </div>
          </Link>

          {/* KPI 3: Pending Architect Approvals */}
          <Link
            to="/admin/architects"
            className={`p-4 bg-white rounded-2xl border shadow-2xs hover:shadow-md transition space-y-2 group ${
              metrics.pendingArchitectApprovals > 0
                ? 'border-amber-300 bg-amber-50/20'
                : 'border-slate-200 hover:border-amber-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">
                3. Pending Arch. Approvals
              </span>
              <div className="p-2 rounded-xl bg-amber-100 text-amber-800 group-hover:bg-amber-600 group-hover:text-white transition">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black font-display text-amber-900">
              {metrics.pendingArchitectApprovals}
            </div>
            <div className="text-[11px] text-amber-800 font-semibold flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>COA & KYC Verification Required</span>
            </div>
          </Link>

          {/* KPI 4: Total Quotation Requests */}
          <Link
            to="/admin/requests"
            className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-blue-400 shadow-2xs hover:shadow-md transition space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                4. Total RFQ Requests
              </span>
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black font-display text-navy-950">
              {metrics.totalQuotationRequests}
            </div>
            <div className="text-[11px] text-slate-500 font-semibold">
              Homeowner Architecture & Design
            </div>
          </Link>

          {/* KPI 5: Pending Quotation Assignments */}
          <Link
            to="/admin/assignments"
            className={`p-4 bg-white rounded-2xl border shadow-2xs hover:shadow-md transition space-y-2 group ${
              metrics.pendingAssignments > 0
                ? 'border-indigo-300 bg-indigo-50/20'
                : 'border-slate-200 hover:border-indigo-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider">
                5. Pending Assignments
              </span>
              <div className="p-2 rounded-xl bg-indigo-100 text-indigo-800 group-hover:bg-indigo-600 group-hover:text-white transition">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black font-display text-indigo-950">
              {metrics.pendingAssignments}
            </div>
            <div className="text-[11px] text-indigo-800 font-semibold flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>Assign to Approved Architects</span>
            </div>
          </Link>

          {/* KPI 6: Quotations Awaiting Admin Review */}
          <Link
            to="/admin/quotations"
            className={`p-4 bg-white rounded-2xl border shadow-2xs hover:shadow-md transition space-y-2 group ${
              metrics.quotesUnderReview > 0
                ? 'border-amber-300 bg-amber-50/30'
                : 'border-slate-200 hover:border-amber-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">
                6. Quotes Awaiting Review
              </span>
              <div className="p-2 rounded-xl bg-amber-100 text-amber-800 group-hover:bg-amber-600 group-hover:text-white transition">
                <FileCheck2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black font-display text-amber-900">
              {metrics.quotesUnderReview}
            </div>
            <div className="text-[11px] text-amber-800 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Audit Scope & Price Before Client</span>
            </div>
          </Link>

          {/* KPI 7: Quotations Sent to Customers */}
          <Link
            to="/admin/quotations"
            className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-emerald-400 shadow-2xs hover:shadow-md transition space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                7. Sent to Customers
              </span>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition">
                <Send className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black font-display text-emerald-900">
              {metrics.quotesSentToCustomer}
            </div>
            <div className="text-[11px] text-emerald-700 font-semibold">
              Forwarded & Client Accessible
            </div>
          </Link>

          {/* KPI 8: Active Projects */}
          <Link
            to="/admin/projects"
            className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-blue-400 shadow-2xs hover:shadow-md transition space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                8. Active Projects
              </span>
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition">
                <Building className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black font-display text-navy-950">
              {metrics.activeProjects}
            </div>
            <div className="text-[11px] text-blue-700 font-semibold">
              Construction & Design Milestones
            </div>
          </Link>

          {/* KPI 9: Projects Delayed */}
          <Link
            to="/admin/projects"
            className={`p-4 bg-white rounded-2xl border shadow-2xs hover:shadow-md transition space-y-2 group ${
              metrics.projectsDelayed > 0
                ? 'border-rose-300 bg-rose-50/20'
                : 'border-slate-200 hover:border-rose-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">
                9. Projects Delayed
              </span>
              <div className="p-2 rounded-xl bg-rose-100 text-rose-800 group-hover:bg-rose-600 group-hover:text-white transition">
                <AlertCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black font-display text-rose-900">
              {metrics.projectsDelayed}
            </div>
            <div className="text-[11px] text-rose-800 font-semibold flex items-center gap-1">
              <span>Timeline / Stage Bottleneck</span>
            </div>
          </Link>

          {/* KPI 10: Pending Milestone Approvals */}
          <Link
            to="/admin/projects"
            className={`p-4 bg-white rounded-2xl border shadow-2xs hover:shadow-md transition space-y-2 group ${
              metrics.pendingMilestoneApprovals > 0
                ? 'border-amber-300 bg-amber-50/20'
                : 'border-slate-200 hover:border-amber-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">
                10. Milestone Approvals
              </span>
              <div className="p-2 rounded-xl bg-amber-100 text-amber-800 group-hover:bg-amber-600 group-hover:text-white transition">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black font-display text-amber-900">
              {metrics.pendingMilestoneApprovals}
            </div>
            <div className="text-[11px] text-amber-800 font-semibold flex items-center gap-1">
              <span>Site Evidence Inspection</span>
            </div>
          </Link>

          {/* KPI 11: Customer Payments Received */}
          <Link
            to="/admin/payments"
            className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-emerald-400 shadow-2xs hover:shadow-md transition space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                11. Payments Received
              </span>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black font-display text-emerald-900 truncate">
              {formatINR(metrics.customerPaymentsReceivedPaise)}
            </div>
            <div className="text-[11px] text-emerald-700 font-semibold">
              Gross Client Escrow Deposits
            </div>
          </Link>

          {/* KPI 12: Payments Awaiting Verification */}
          <Link
            to="/admin/payments"
            className={`p-4 bg-white rounded-2xl border shadow-2xs hover:shadow-md transition space-y-2 group ${
              metrics.paymentsAwaitingVerificationCount > 0
                ? 'border-amber-300 bg-amber-50/20'
                : 'border-slate-200 hover:border-amber-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">
                12. Awaiting Payment Verification
              </span>
              <div className="p-2 rounded-xl bg-amber-100 text-amber-800 group-hover:bg-amber-600 group-hover:text-white transition">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black font-display text-amber-900 truncate">
              {metrics.paymentsAwaitingVerificationCount} Orders
            </div>
            <div className="text-[11px] text-amber-800 font-semibold">
              {formatINR(metrics.paymentsAwaitingVerificationPaise)} pending ledger
            </div>
          </Link>

          {/* KPI 13: Architect Payouts Pending */}
          <Link
            to="/admin/payouts"
            className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-indigo-400 shadow-2xs hover:shadow-md transition space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                13. Architect Payouts Pending
              </span>
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black font-display text-indigo-950 truncate">
              {formatINR(metrics.architectPayoutsPendingPaise)}
            </div>
            <div className="text-[11px] text-indigo-700 font-semibold">
              {metrics.architectPayoutsPendingCount} disbursements pending release
            </div>
          </Link>

          {/* KPI 14: Total Platform Revenue */}
          <Link
            to="/admin/payments"
            className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-gold-400 shadow-2xs hover:shadow-md transition space-y-2 group bg-gradient-to-br from-white to-amber-50/30"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">
                14. Platform Revenue
              </span>
              <div className="p-2 rounded-xl bg-amber-100 text-amber-800 group-hover:bg-amber-600 group-hover:text-white transition">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black font-display text-amber-950 truncate">
              {formatINR(metrics.totalPlatformRevenuePaise)}
            </div>
            <div className="text-[11px] text-amber-800 font-semibold">
              10% Milestone + 5% Materials Fee
            </div>
          </Link>

          {/* KPI 15: Open Complaints & Disputes */}
          <Link
            to="/admin/support"
            className={`p-4 bg-white rounded-2xl border shadow-2xs hover:shadow-md transition space-y-2 group ${
              metrics.openComplaints > 0
                ? 'border-rose-300 bg-rose-50/20'
                : 'border-slate-200 hover:border-rose-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">
                15. Open Complaints & Disputes
              </span>
              <div className="p-2 rounded-xl bg-rose-100 text-rose-800 group-hover:bg-rose-600 group-hover:text-white transition">
                <HelpCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black font-display text-rose-900">
              {metrics.openComplaints}
            </div>
            <div className="text-[11px] text-rose-800 font-semibold flex items-center gap-1">
              <span>Customer & Architect Support Desk</span>
            </div>
          </Link>
        </div>
      </div>

      {/* 3. VISUAL ANALYTICS SECTION (CHARTS & FUNNELS) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Customer vs Architect Growth & Funnel */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-sm text-navy-950 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span>Quotation Pipeline & Velocity Funnel</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Conversion stages from customer request to verified project execution
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-slate-400 uppercase">
              Routing Analytics
            </span>
          </div>

          {/* Funnel Progress Bars */}
          <div className="space-y-3 pt-2">
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>1. Quotation Requests Submitted</span>
                <span className="font-mono text-navy-950 font-bold">{metrics.totalQuotationRequests}</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${metrics.totalQuotationRequests > 0 ? 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>2. Assigned to Approved Architects</span>
                <span className="font-mono text-indigo-700 font-bold">
                  {Math.max(0, metrics.totalQuotationRequests - metrics.pendingAssignments)}
                </span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                  style={{
                    width: `${
                      metrics.totalQuotationRequests > 0
                        ? Math.round(
                            ((metrics.totalQuotationRequests - metrics.pendingAssignments) /
                              metrics.totalQuotationRequests) *
                              100
                          )
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>3. Architect Quotes Approved by Admin</span>
                <span className="font-mono text-amber-700 font-bold">{metrics.quotesSentToCustomer}</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-500"
                  style={{
                    width: `${
                      metrics.totalQuotationRequests > 0
                        ? Math.min(
                            100,
                            Math.round(
                              (metrics.quotesSentToCustomer / metrics.totalQuotationRequests) * 100
                            )
                          )
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>4. Active Projects Kickoff & Construction</span>
                <span className="font-mono text-emerald-700 font-bold">{metrics.activeProjects}</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{
                    width: `${
                      metrics.totalQuotationRequests > 0
                        ? Math.min(
                            100,
                            Math.round((metrics.activeProjects / metrics.totalQuotationRequests) * 100)
                          )
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Chart 2: Cash Flow & Escrow Revenue Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-sm text-navy-950 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <span>Financial Escrow & Platform Economics</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Gross collections, pending disbursements, and 10% platform earnings
              </p>
            </div>
            <Link
              to="/admin/payments"
              className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <span>Ledger Details</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl space-y-1">
              <span className="text-[10px] font-bold uppercase text-emerald-800 tracking-wider block">
                Collections
              </span>
              <div className="text-lg sm:text-xl font-black font-display text-emerald-950 truncate">
                {formatINR(metrics.customerPaymentsReceivedPaise)}
              </div>
              <span className="text-[10px] text-emerald-700 block">Customer deposits</span>
            </div>

            <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl space-y-1">
              <span className="text-[10px] font-bold uppercase text-amber-800 tracking-wider block">
                Pending Payouts
              </span>
              <div className="text-lg sm:text-xl font-black font-display text-amber-950 truncate">
                {formatINR(metrics.architectPayoutsPendingPaise)}
              </div>
              <span className="text-[10px] text-amber-700 block">Architect & Vendors</span>
            </div>

            <div className="p-4 bg-blue-50/70 border border-blue-200/80 rounded-2xl space-y-1">
              <span className="text-[10px] font-bold uppercase text-blue-800 tracking-wider block">
                Net Revenue
              </span>
              <div className="text-lg sm:text-xl font-black font-display text-blue-950 truncate">
                {formatINR(metrics.totalPlatformRevenuePaise)}
              </div>
              <span className="text-[10px] text-blue-700 block">BuildGhar Platform</span>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-600 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Escrow Protection Active: Payments released only after Milestone verification.</span>
            </div>
            <Link to="/admin/payouts" className="font-bold text-indigo-700 hover:text-indigo-900 text-xs">
              Manage Payouts →
            </Link>
          </div>
        </div>
      </div>

      {/* 4. ACTIONABLE ROUTING REVIEW TABLES (SECTION 5 SPECIFICATION) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Table Tab Selector Header */}
        <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-navy-950" />
            <div>
              <h3 className="font-bold text-sm sm:text-base text-navy-950">
                Actionable Administrative Routing Queues
              </h3>
              <p className="text-xs text-slate-500">
                Direct one-click moderation desks for customer requests, quotes, milestones, and KYC
              </p>
            </div>
          </div>

          {/* Sub-tab navigation buttons */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-200/70 p-1 rounded-2xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTabTable('REQUESTS')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                activeTabTable === 'REQUESTS'
                  ? 'bg-white text-navy-950 shadow-xs'
                  : 'text-slate-600 hover:text-navy-950'
              }`}
            >
              Requests ({requests.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTabTable('ARCHITECTS')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                activeTabTable === 'ARCHITECTS'
                  ? 'bg-white text-navy-950 shadow-xs'
                  : 'text-slate-600 hover:text-navy-950'
              }`}
            >
              Architect KYC ({metrics.pendingArchitectApprovals})
            </button>
            <button
              type="button"
              onClick={() => setActiveTabTable('QUOTATIONS')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                activeTabTable === 'QUOTATIONS'
                  ? 'bg-white text-navy-950 shadow-xs'
                  : 'text-slate-600 hover:text-navy-950'
              }`}
            >
              Quotes Review ({metrics.quotesUnderReview})
            </button>
            <button
              type="button"
              onClick={() => setActiveTabTable('MILESTONES')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                activeTabTable === 'MILESTONES'
                  ? 'bg-white text-navy-950 shadow-xs'
                  : 'text-slate-600 hover:text-navy-950'
              }`}
            >
              Milestones ({pendingMilestonesList.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTabTable('PAYMENTS')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                activeTabTable === 'PAYMENTS'
                  ? 'bg-white text-navy-950 shadow-xs'
                  : 'text-slate-600 hover:text-navy-950'
              }`}
            >
              Payments ({paymentsList.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTabTable('COMPLAINTS')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                activeTabTable === 'COMPLAINTS'
                  ? 'bg-white text-navy-950 shadow-xs'
                  : 'text-slate-600 hover:text-navy-950'
              }`}
            >
              Complaints ({metrics.openComplaints})
            </button>
          </div>
        </div>

        {/* Tab 1: Customer Requests Table */}
        {activeTabTable === 'REQUESTS' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                <tr>
                  <th className="py-3 px-4">Request Code</th>
                  <th className="py-3 px-3">Customer Details</th>
                  <th className="py-3 px-3">Location & Plot Area</th>
                  <th className="py-3 px-3">Required Services</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Routing Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No quotation requests found. Click "Load Demo Data" above to review sample RFQs.
                    </td>
                  </tr>
                ) : (
                  requests.slice(0, 6).map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-700">
                        {req.requestCode || req.id.slice(0, 8)}
                      </td>
                      <td className="py-3.5 px-3">
                        <strong className="text-slate-900 block">{req.customerName}</strong>
                        <span className="text-[11px] text-slate-500">{req.customerPhone}</span>
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-1 text-slate-800">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{req.city || req.locality || 'Delhi NCR'}</span>
                        </div>
                        <span className="text-[10px] text-slate-500">
                          {req.plotArea ? `${req.plotArea} sq ft` : 'Plot dimensions provided'}
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                          {req.categorySlug || 'House Map & 3D'}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            req.status === 'APPROVED' || req.status === 'ASSIGNED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {req.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          to={`/admin/assignments?requestId=${req.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow-2xs"
                        >
                          <span>Assign Architect</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Architect Applications KYC Table */}
        {activeTabTable === 'ARCHITECTS' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                <tr>
                  <th className="py-3 px-4">Architect ID & Name</th>
                  <th className="py-3 px-3">Firm Name & City</th>
                  <th className="py-3 px-3">COA Registration #</th>
                  <th className="py-3 px-3">Phone & Contact</th>
                  <th className="py-3 px-3 text-center">Verification Status</th>
                  <th className="py-3 px-4 text-right">Admin Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {architects.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No architects registered yet.
                    </td>
                  </tr>
                ) : (
                  architects.slice(0, 6).map((arch) => (
                    <tr key={arch.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4">
                        <strong className="text-slate-900 block">{arch.name}</strong>
                        <span className="font-mono text-[10px] text-slate-400">{arch.id}</span>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="text-slate-800 font-medium block">
                          {arch.firmName || 'Independent Studio'}
                        </span>
                        <span className="text-[10px] text-slate-500">{arch.city || 'Pan-India'}</span>
                      </td>
                      <td className="py-3.5 px-3 font-mono font-bold text-slate-800">
                        {arch.coaNumber || 'COA-AUDIT-PENDING'}
                      </td>
                      <td className="py-3.5 px-3 text-slate-700">{arch.phone}</td>
                      <td className="py-3.5 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            arch.accountStatus === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {arch.accountStatus}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        {arch.accountStatus !== 'ACTIVE' ? (
                          <button
                            type="button"
                            onClick={() => handleApproveArchitect(arch.id, arch.name)}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer"
                          >
                            <Check className="w-3 h-3" />
                            <span>Verify & Approve</span>
                          </button>
                        ) : (
                          <Link
                            to={`/admin/architects`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition"
                          >
                            <Eye className="w-3 h-3" />
                            <span>View Profile</span>
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Quotations Review Table */}
        {activeTabTable === 'QUOTATIONS' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                <tr>
                  <th className="py-3 px-4">Quote Code</th>
                  <th className="py-3 px-3">Customer & Request</th>
                  <th className="py-3 px-3">Architect Partner</th>
                  <th className="py-3 px-3 text-right">Total Price</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Routing Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {quotations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No quotations submitted for review yet.
                    </td>
                  </tr>
                ) : (
                  quotations.slice(0, 6).map((q: any) => (
                    <tr key={q.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-navy-950">
                        {q.quotationCode || q.id.slice(0, 8)}
                      </td>
                      <td className="py-3.5 px-3">
                        <strong className="text-slate-900 block">{q.customerName || 'Customer'}</strong>
                        <span className="font-mono text-[10px] text-slate-500">{q.requestCode}</span>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="text-slate-800 font-medium block">
                          {q.architectName || q.professionalName || 'Architect Partner'}
                        </span>
                        <span className="text-[10px] text-slate-400">{q.firmName || 'Design Studio'}</span>
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-900">
                        {formatINR(q.totalAmountRupees ? Number(q.totalAmountRupees) * 100 : 18500000)}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            q.status === 'SENT_TO_CUSTOMER' || q.status === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {q.status || 'UNDER_REVIEW'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          to={`/admin/quotations?quoteId=${q.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-amber-500 hover:bg-amber-600 text-navy-950 rounded-lg text-xs font-bold transition shadow-2xs"
                        >
                          <span>Review & Forward</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 4: Milestones Waiting for Verification Table */}
        {activeTabTable === 'MILESTONES' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                <tr>
                  <th className="py-3 px-4">Project & Milestone</th>
                  <th className="py-3 px-3">Customer</th>
                  <th className="py-3 px-3">Architect Lead</th>
                  <th className="py-3 px-3 text-right">Milestone Amount</th>
                  <th className="py-3 px-3 text-center">Verification Status</th>
                  <th className="py-3 px-4 text-right">Inspection Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingMilestonesList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      All project milestones are fully inspected and up to date.
                    </td>
                  </tr>
                ) : (
                  pendingMilestonesList.slice(0, 6).map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4">
                        <strong className="text-slate-900 block">{item.projectName}</strong>
                        <span className="text-[11px] text-blue-700 font-medium">
                          Milestone #{item.milestone.milestoneNumber}: {item.milestone.title}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 font-medium text-slate-900">{item.customerName}</td>
                      <td className="py-3.5 px-3 text-slate-700">{item.architectName}</td>
                      <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-900">
                        {formatINR(item.milestone.amountPaise)}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          {item.milestone.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          to={`/admin/projects`}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-navy-900 hover:bg-navy-800 text-white rounded-lg text-xs font-bold transition shadow-2xs"
                        >
                          <span>Inspect Evidence</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 5: Recent Customer Payments Table */}
        {activeTabTable === 'PAYMENTS' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                <tr>
                  <th className="py-3 px-4">Payment Code</th>
                  <th className="py-3 px-3">Payer Customer</th>
                  <th className="py-3 px-3">Purpose & Description</th>
                  <th className="py-3 px-3 text-right">Gross Amount</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Ledger Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paymentsList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No payments recorded yet.
                    </td>
                  </tr>
                ) : (
                  paymentsList.slice(0, 6).map((pay) => (
                    <tr key={pay.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-700">{pay.code}</td>
                      <td className="py-3.5 px-3">
                        <strong className="text-slate-900 block">{pay.payerName}</strong>
                        <span className="text-[11px] text-slate-500">{pay.payerPhone}</span>
                      </td>
                      <td className="py-3.5 px-3 text-slate-800 font-medium">{pay.purpose}</td>
                      <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-900">
                        {formatINR(pay.amountPaise)}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            pay.status === 'PAYMENT_SUCCESSFUL'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {pay.status === 'PAYMENT_SUCCESSFUL' ? 'CAPTURED' : 'PENDING'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          to={`/admin/payments`}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-2xs"
                        >
                          <span>Audit Ledger</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 6: Open Complaints & Disputes Table */}
        {activeTabTable === 'COMPLAINTS' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                <tr>
                  <th className="py-3 px-4">Ticket ID</th>
                  <th className="py-3 px-3">Subject & Issue</th>
                  <th className="py-3 px-3">Raised By</th>
                  <th className="py-3 px-3 text-center">Priority</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {supportTickets.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No complaints or disputes reported. All customer and architect tickets resolved.
                    </td>
                  </tr>
                ) : (
                  supportTickets.slice(0, 6).map((tkt) => (
                    <tr key={tkt.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-rose-700">
                        {tkt.ticketCode || tkt.id.slice(0, 8)}
                      </td>
                      <td className="py-3.5 px-3">
                        <strong className="text-slate-900 block">{tkt.subject}</strong>
                        <p className="text-[11px] text-slate-500 line-clamp-1">{tkt.description}</p>
                      </td>
                      <td className="py-3.5 px-3 text-slate-700">
                        <span className="font-semibold block">{tkt.userName || 'Client'}</span>
                        <span className="text-[10px] text-slate-400">{tkt.userRole}</span>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            tkt.priority === 'CRITICAL' || tkt.priority === 'HIGH'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {tkt.priority}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800">
                          {tkt.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          to={`/admin/support`}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition shadow-2xs"
                        >
                          <span>Resolve Issue</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. CONFIRMATION MODAL: RESET / CLEAR DATA */}
      {showClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-navy-950 font-display">
                Reset All Platform Operational Data?
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                All mock and platform data (Customers, Architects, Requests, Quotations, Milestones,
                Payments, Orders, and Tickets) will be cleared to 0. Real registered accounts and your
                administrator session remain unaffected.
              </p>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-800 font-semibold">
              ⚠️ Note: You can reload realistic production demo records anytime by clicking "Load Demo Data".
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowClearModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                disabled={clearing}
                className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{clearing ? 'Clearing...' : 'Yes, Reset to 0'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
