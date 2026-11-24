import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { formatINR, formatDate } from '../../lib/utils.js';
import {
  getRegisteredCustomers,
  getPlatformBookings,
  getPlatformRequests,
  getPlatformProfessionals,
  clearAllPlatformData,
  RegisteredCustomer,
  PlatformProjectRequest,
  PlatformBooking,
} from '../../data/customerStore.js';
import {
  getRegisteredVendors,
  getVendorProducts,
  getVendorOrders,
  getVendorPayouts,
} from '../../data/vendorStore.js';
import {
  getPlatformContractors,
  getPlatformSupportTickets,
  getPlatformAuditLogs,
} from '../../data/adminStore.js';
import { getExecutionProjects } from '../../data/projectExecutionStore.js';
import { getArchitectAccounts } from '../../data/architectStore.js';
import { getInteriorDesignerAccounts } from '../../data/interiorDesignerStore.js';
import { pullFromCloud, clearCloudData } from '../../data/cloudSync.js';
import { useToast } from '../../context/ToastContext.js';
import {
  Users,
  Compass,
  Palette,
  HardHat,
  Store,
  FileText,
  FileCheck2,
  CalendarCheck,
  Building,
  HardDrive,
  ShoppingBag,
  CreditCard,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Filter,
  RefreshCw,
  Trash2,
  Sparkles,
  ShieldCheck,
  Crown,
  MapPin,
  ExternalLink,
  Layers,
  HelpCircle,
  Truck,
} from 'lucide-react';

export const AdminOverview: React.FC = () => {
  const [timeFilter, setTimeFilter] = useState<'TODAY' | 'YESTERDAY' | 'LAST_7_DAYS' | 'LAST_30_DAYS' | 'THIS_MONTH' | 'ALL'>('THIS_MONTH');
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearing, setClearing] = useState(false);
  const { success } = useToast();

  const handleClearAllData = async () => {
    setClearing(true);
    try {
      clearAllPlatformData();
      await clearCloudData();
      setRefreshKey((k) => k + 1);
      setShowClearModal(false);
      success('Admin platform data completely cleared! All counts are now 0.');
    } catch {
      clearAllPlatformData();
      setRefreshKey((k) => k + 1);
      setShowClearModal(false);
      success('Platform data cleared.');
    } finally {
      setClearing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await pullFromCloud();
      setRefreshKey((k) => k + 1);
      success('Platform analytics & database refreshed successfully!');
    } catch {
      setRefreshKey((k) => k + 1);
      success('Analytics refreshed.');
    } finally {
      setTimeout(() => setRefreshing(false), 600);
    }
  };

  useEffect(() => {
    const onRefresh = () => setRefreshKey((k) => k + 1);
    window.addEventListener('storage', onRefresh);
    window.addEventListener('admin_global_refresh', onRefresh);
    window.addEventListener('architect_store_updated', onRefresh);
    return () => {
      window.removeEventListener('storage', onRefresh);
      window.removeEventListener('admin_global_refresh', onRefresh);
      window.removeEventListener('architect_store_updated', onRefresh);
    };
  }, []);

  // Live Data Stores
  const customers = useMemo(() => getRegisteredCustomers(), [refreshKey]);
  const architects = useMemo(() => getArchitectAccounts(), [refreshKey]);
  const designers = useMemo(() => getInteriorDesignerAccounts(), [refreshKey]);
  const contractors = useMemo(() => getPlatformContractors(), [refreshKey]);
  const vendors = useMemo(() => getRegisteredVendors(), [refreshKey]);
  const requests = useMemo(() => getPlatformRequests(), [refreshKey]);
  const bookings = useMemo(() => getPlatformBookings(), [refreshKey]);
  const projects = useMemo(() => getExecutionProjects(), [refreshKey]);
  const vendorOrders = useMemo(() => getVendorOrders(), [refreshKey]);
  const vendorPayouts = useMemo(() => getVendorPayouts(), [refreshKey]);
  const supportTickets = useMemo(() => getPlatformSupportTickets(), [refreshKey]);
  const auditLogs = useMemo(() => getPlatformAuditLogs(), [refreshKey]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    // Customers
    const totalCustomers = customers.length;
    const activeCustomers = customers.filter((c) => c.status !== 'SUSPENDED').length;
    const pendingCustomers = customers.filter((c) => c.status === 'PENDING').length;

    // Professionals
    const totalArchitects = architects.length;
    const pendingArchitects = architects.filter(
      (a) => a.accountStatus === 'PENDING_APPROVAL' || (a as any).verificationStatus === 'PENDING'
    ).length;
    const totalDesigners = designers.length;
    const pendingDesigners = designers.filter((d) => d.verificationStatus === 'PENDING').length;
    const totalContractors = contractors.length;
    const pendingContractors = contractors.filter((c) => c.kycStatus === 'PENDING').length;
    const totalVendors = vendors.length;
    const pendingVendors = vendors.filter((v) => v.status === 'PENDING_APPROVAL').length;

    // Requests & Quotations
    const totalRequests = requests.length;
    const newRequests = requests.filter((r) => r.status === 'NEW').length;
    const assignedRequests = requests.filter((r) => r.status === 'ASSIGNED_TO_PROFESSIONAL' || r.status === 'IN_PROGRESS').length;

    // Bookings & Projects
    const totalBookings = bookings.length;
    const confirmedBookings = bookings.filter((b) => b.status === 'CONFIRMED').length;
    const totalProjects = projects.length;
    const activeProjects = projects.filter((p) => p.status === 'IN_PROGRESS' || p.status === 'ACTIVE').length;
    const completedProjects = projects.filter((p) => p.status === 'COMPLETED').length;

    // Material Store & Orders
    const totalMaterialOrders = vendorOrders.length;
    const pendingMaterialOrders = vendorOrders.filter((o) => o.fulfillmentStatus === 'CONFIRMED' || o.fulfillmentStatus === 'PROCESSING').length;
    const totalMaterialSalesPaise = vendorOrders.reduce((sum, o) => sum + (o.fulfillmentStatus !== 'CANCELLED' ? o.totalAmountPaise || 0 : 0), 0);

    // Platform Financials
    const totalCustomerPaymentsPaise = totalMaterialSalesPaise + bookings.reduce((sum, b) => sum + (b.totalAmountPaise || 0), 0);
    const platformCommissionPaise = Math.round(totalMaterialSalesPaise * 0.05 + bookings.reduce((sum, b) => sum + (b.totalAmountPaise || 0) * 0.08, 0));
    const settledPayoutsPaise = vendorPayouts.filter((p) => p.status === 'SETTLED' || p.status === 'COMPLETED').reduce((sum, p) => sum + (p.netAmountPaise || 0), 0);
    const pendingSettlementsPaise = Math.max(0, Math.round(totalMaterialSalesPaise * 0.94) - settledPayoutsPaise);

    // Support Desk
    const openSupportTickets = supportTickets.filter((t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length;

    return {
      totalCustomers,
      activeCustomers,
      pendingCustomers,
      totalArchitects,
      pendingArchitects,
      totalDesigners,
      pendingDesigners,
      totalContractors,
      pendingContractors,
      totalVendors,
      pendingVendors,
      totalProfessionals: totalArchitects + totalDesigners + totalContractors,
      totalRequests,
      newRequests,
      assignedRequests,
      totalBookings,
      confirmedBookings,
      totalProjects,
      activeProjects,
      completedProjects,
      totalMaterialOrders,
      pendingMaterialOrders,
      totalMaterialSalesPaise,
      totalCustomerPaymentsPaise,
      platformCommissionPaise,
      settledPayoutsPaise,
      pendingSettlementsPaise,
      openSupportTickets,
    };
  }, [
    customers,
    architects,
    designers,
    contractors,
    vendors,
    requests,
    bookings,
    projects,
    vendorOrders,
    vendorPayouts,
    supportTickets,
  ]);

  return (
    <div className="space-y-6">
      {/* Top Welcome & Master Filter Banner */}
      <div className="bg-gradient-to-r from-navy-950 via-[#0d223f] to-[#122e57] text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-navy-800 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-400/15 border border-amber-400/30 rounded-full text-gold-300 font-mono text-[11px] font-bold uppercase tracking-wider mb-2">
              <Crown className="w-3.5 h-3.5 text-gold-400 fill-gold-400" />
              <span>Super Administrator Operations Console</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-white">
              Platform Master Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-1 leading-relaxed">
              Unified command center overseeing customer requests, architecture plans, turnkey construction projects,
              building materials logistics, and escrow financial disbursements across India.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Time Filter Pill */}
            <div className="flex items-center gap-1 bg-white/10 p-1 rounded-2xl border border-white/15 backdrop-blur-md text-xs font-semibold">
              {[
                { label: 'Today', value: 'TODAY' },
                { label: '7 Days', value: 'LAST_7_DAYS' },
                { label: 'This Month', value: 'THIS_MONTH' },
                { label: 'All Time', value: 'ALL' },
              ].map((pill) => (
                <button
                  key={pill.value}
                  onClick={() => setTimeFilter(pill.value as any)}
                  className={`px-3 py-1.5 rounded-xl transition ${
                    timeFilter === pill.value
                      ? 'bg-amber-400 text-navy-950 font-bold shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-slate-200 transition disabled:opacity-50 flex items-center justify-center cursor-pointer"
              title="Refresh Platform Analytics & Sync Cloud"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-amber-300' : ''}`} />
            </button>

            <button
              onClick={() => setShowClearModal(true)}
              disabled={clearing}
              className="px-3 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/30 text-rose-200 hover:text-white transition flex items-center gap-1.5 cursor-pointer text-xs font-bold shadow-xs disabled:opacity-50"
              title="Clear All Platform Data"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">Clear Data</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 PRIMARY METRICS BANNERS (Section A) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Customers */}
        <Link
          to="/admin/customers"
          className="bg-white p-5 rounded-2xl border border-blue-200/80 hover:border-blue-400 shadow-2xs hover:shadow-md transition space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Total Customers
            </span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black font-display text-navy-950">{metrics.totalCustomers}</div>
          <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{metrics.activeCustomers} active verified homeowners</span>
          </div>
        </Link>

        {/* Total Professionals */}
        <Link
          to="/admin/professionals"
          className="bg-white p-5 rounded-2xl border border-purple-200/80 hover:border-purple-400 shadow-2xs hover:shadow-md transition space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Professionals & Contractors
            </span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition">
              <HardHat className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black font-display text-navy-950">{metrics.totalProfessionals}</div>
          <div className="text-[11px] text-slate-500">
            {metrics.totalArchitects} Architects · {metrics.totalDesigners} Designers · {metrics.totalContractors} Contractors
          </div>
        </Link>

        {/* Active Projects */}
        <Link
          to="/admin/projects"
          className="bg-white p-5 rounded-2xl border border-amber-200/80 hover:border-amber-400 shadow-2xs hover:shadow-md transition space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Active Construction Sites
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition">
              <Building className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black font-display text-navy-950">{metrics.activeProjects}</div>
          <div className="text-[11px] text-amber-700 font-semibold flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>{metrics.totalProjects} total sites tracked in milestones</span>
          </div>
        </Link>

        {/* Platform Gross Revenue */}
        <Link
          to="/admin/payments"
          className="bg-white p-5 rounded-2xl border border-emerald-200/80 hover:border-emerald-400 shadow-2xs hover:shadow-md transition space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Gross Platform Turnover
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-display text-emerald-700">
            {formatINR(metrics.totalCustomerPaymentsPaise)}
          </div>
          <div className="text-[11px] text-emerald-800 font-semibold">
            Platform Commission: {formatINR(metrics.platformCommissionPaise)}
          </div>
        </Link>
      </div>

      {/* SECONDARY OPERATIONAL METRIC ROW */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">RFQs & REQUESTS</span>
          <div className="text-xl font-black font-display text-slate-900">{metrics.totalRequests}</div>
          <span className="text-[10px] text-blue-600 font-semibold">{metrics.newRequests} pending triage</span>
        </div>

        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">CONFIRMED BOOKINGS</span>
          <div className="text-xl font-black font-display text-slate-900">{metrics.confirmedBookings}</div>
          <span className="text-[10px] text-emerald-600 font-semibold">Ready for kickoff</span>
        </div>

        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">DEPOTS & VENDORS</span>
          <div className="text-xl font-black font-display text-slate-900">{metrics.totalVendors}</div>
          <span className="text-[10px] text-amber-600 font-semibold">{metrics.pendingVendors} pending KYC</span>
        </div>

        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">MATERIAL ORDERS</span>
          <div className="text-xl font-black font-display text-slate-900">{metrics.totalMaterialOrders}</div>
          <span className="text-[10px] text-slate-500">{metrics.pendingMaterialOrders} in transit / prep</span>
        </div>

        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">PENDING SETTLEMENTS</span>
          <div className="text-xl font-black font-display text-amber-600">
            {formatINR(metrics.pendingSettlementsPaise)}
          </div>
          <span className="text-[10px] text-amber-700">Audit hold</span>
        </div>

        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">SUPPORT TICKETS</span>
          <div className="text-xl font-black font-display text-rose-600">{metrics.openSupportTickets}</div>
          <span className="text-[10px] text-rose-700">Awaiting agent reply</span>
        </div>
      </div>

      {/* TWO COLUMN WORKSPACE: PENDING ACTIONS & LIVE ACTIVITY */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Action Queue & Recent Projects */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Action Hub */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <h3 className="font-bold text-sm text-navy-950">Administrative Action Hub</h3>
              </div>
              <span className="text-xs text-slate-400">Direct shortcuts to pending review desks</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <Link
                to="/admin/vendors"
                className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl hover:bg-amber-100/70 transition flex flex-col justify-between gap-2"
              >
                <Store className="w-4 h-4 text-amber-700" />
                <div>
                  <strong className="text-amber-950 block">Vendor KYC Desk</strong>
                  <span className="text-[10px] text-amber-800">{metrics.pendingVendors} pending applications</span>
                </div>
              </Link>

              <Link
                to="/admin/professionals"
                className="p-3 bg-purple-50/70 border border-purple-200/80 rounded-xl hover:bg-purple-100/70 transition flex flex-col justify-between gap-2"
              >
                <Compass className="w-4 h-4 text-purple-700" />
                <div>
                  <strong className="text-purple-950 block">Architect & Pro Vetting</strong>
                  <span className="text-[10px] text-purple-800">
                    {metrics.pendingArchitects + metrics.pendingDesigners + metrics.pendingContractors} pending audits
                  </span>
                </div>
              </Link>

              <Link
                to="/admin/requests"
                className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl hover:bg-blue-100/70 transition flex flex-col justify-between gap-2"
              >
                <FileText className="w-4 h-4 text-blue-700" />
                <div>
                  <strong className="text-blue-950 block">Homeowner RFQs</strong>
                  <span className="text-[10px] text-blue-800">{metrics.newRequests} ready to assign</span>
                </div>
              </Link>

              <Link
                to="/admin/payments"
                className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl hover:bg-emerald-100/70 transition flex flex-col justify-between gap-2"
              >
                <CreditCard className="w-4 h-4 text-emerald-700" />
                <div>
                  <strong className="text-emerald-950 block">Payout Settlements</strong>
                  <span className="text-[10px] text-emerald-800">Batch ledger & UTR logs</span>
                </div>
              </Link>
            </div>
          </div>

          {/* Active Construction Sites Table */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-navy-950" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800">
                  Active Construction & Interior Sites
                </h3>
              </div>
              <Link to="/admin/projects" className="text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1">
                <span>View All Sites</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-100 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                  <tr>
                    <th className="py-3 px-4">Project Name & Site</th>
                    <th className="py-3 px-3">Customer</th>
                    <th className="py-3 px-3">Team Assigned</th>
                    <th className="py-3 px-3 text-right">Budget</th>
                    <th className="py-3 px-3 text-center">Progress</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {projects.slice(0, 4).map((prj) => (
                    <tr key={prj.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4">
                        <strong className="text-slate-900 block">{prj.name}</strong>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{prj.siteLocation?.city || 'Delhi NCR'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-900">{prj.customerName}</td>
                      <td className="py-3 px-3">
                        <span className="text-slate-800 font-medium block">{prj.contractorName || 'Assigned Contractor'}</span>
                        <span className="text-[10px] text-slate-400">{prj.architectName || 'Ar. Lead'}</span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        {formatINR(prj.budgetPaise)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="inline-flex items-center gap-1 font-mono font-bold text-blue-700">
                          <span>{prj.progressPercentage}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                          {prj.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Col: Live Security Audit Trail & Notifications */}
        <div className="space-y-6">
          {/* Audit Trail Activity Widget */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900">
                  Live Security Audit Log
                </h3>
              </div>
              <Link to="/admin/audit-logs" className="text-xs font-bold text-blue-600 hover:text-blue-800">
                All Logs →
              </Link>
            </div>

            <div className="space-y-3">
              {auditLogs.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  No security audit events recorded yet. Platform actions will appear here in real-time.
                </div>
              ) : (
                auditLogs.slice(0, 5).map((log) => (
                  <div key={log.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold text-blue-700 uppercase bg-blue-100 px-1.5 py-0.2 rounded">
                        {log.action}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">
                        {formatDate(log.timestamp)}
                      </span>
                    </div>
                    <strong className="text-slate-900 block text-xs">{log.entity}</strong>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>By: {log.adminName}</span>
                      <span className="font-mono text-[10px]">{log.ipAddress}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Customer Support Complaints Quick Widget */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-rose-600" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900">
                  Escalated Support Desk
                </h3>
              </div>
              <Link to="/admin/support" className="text-xs font-bold text-rose-600 hover:text-rose-800">
                Desk ({metrics.openSupportTickets}) →
              </Link>
            </div>

            <div className="space-y-2.5">
              {supportTickets.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  No open support tickets. All customer and partner queries are resolved.
                </div>
              ) : (
                supportTickets.slice(0, 3).map((tkt) => (
                  <div key={tkt.id} className="p-3 bg-rose-50/50 rounded-xl border border-rose-200/70 text-xs space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-mono font-bold text-rose-900 text-[10px]">{tkt.ticketCode}</span>
                      <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                        {tkt.priority}
                      </span>
                    </div>
                    <strong className="text-slate-900 block">{tkt.subject}</strong>
                    <p className="text-[11px] text-slate-600 line-clamp-1">{tkt.description}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal: Clear All Platform Data */}
      {showClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-navy-950 font-display">Clear All Platform Data?</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Admin me maujood saara data (Customers, Architects, Designers, Contractors, Vendors, Requests, Quotations, Bookings, Projects, Orders, Tickets) permanently clear ho jayega aur count 0 ho jayega.
              </p>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-800 font-semibold">
              ⚠️ Note: Aapka Super Admin login session safe rahega.
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
                onClick={handleClearAllData}
                disabled={clearing}
                className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{clearing ? 'Clearing...' : 'Yes, Clear Everything'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
