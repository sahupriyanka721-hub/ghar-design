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
  Printer,
  Compass,
  CreditCard,
  Briefcase,
  AlertTriangle,
  RotateCcw,
  Search,
  FileText,
} from 'lucide-react';
import { formatINR, formatDate } from '../../lib/utils.js';
import { useToast } from '../../context/ToastContext.js';
import { Badge } from '../../components/common/Badge.js';
import { getPlatformGlobalSettings } from '../../data/adminStore.js';
import { getPlatformRequests, getPlatformBookings, getRegisteredCustomers } from '../../data/customerStore.js';
import { getArchitectAccounts } from '../../data/architectStore.js';
import { getVendorOrders } from '../../data/vendorStore.js';
import { getExecutionProjects } from '../../data/projectExecutionStore.js';
import { getCustomerPayments, getArchitectPayouts, getFinancialLedger } from '../../data/financialLedgerStore.js';
import { getComplaintDisputes } from '../../data/communicationDisputeStore.js';

export const AdminReports: React.FC = () => {
  const { success } = useToast();

  const [timeRange, setTimeRange] = useState<'TODAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'LAST_MONTH' | 'FINANCIAL_YEAR' | 'ALL'>('THIS_MONTH');
  const [activeReportTab, setActiveReportTab] = useState<'FINANCIAL_GMV' | 'COMMERCIAL_QUOTATIONS' | 'PROJECT_DELIVERY' | 'PARTNER_PERFORMANCE' | 'DISPUTES_AUDIT'>('FINANCIAL_GMV');
  const [searchQuery, setSearchQuery] = useState('');

  const settings = getPlatformGlobalSettings();
  const customers = getRegisteredCustomers();
  const architects = getArchitectAccounts();
  const requests = getPlatformRequests();
  const bookings = getPlatformBookings();
  const vendorOrders = getVendorOrders();
  const executionProjects = getExecutionProjects();
  const payments = getCustomerPayments();
  const payouts = getArchitectPayouts();
  const disputes = getComplaintDisputes();

  // Financial Metrics Calculation (Accurate Paise Amounts)
  const financialSummary = useMemo(() => {
    // 1. Customer Escrow Inflows
    const verifiedPayments = payments.filter((p) => p.status === 'VERIFIED_SUCCESSFUL');
    const totalCollectedPaise = verifiedPayments.reduce((sum, p) => sum + p.grossAmountPaise, 0);

    // 2. Material Store Sales
    const materialPaise = vendorOrders
      .filter((o) => o.paymentStatus === 'PAID')
      .reduce((sum, o) => sum + (o.totalAmountPaise || 0), 0);

    // 3. Request Consultation Fees
    const requestFeesPaise = requests
      .filter((r) => r.isFeePaid)
      .reduce((sum, r) => sum + (r.quoteFeePaise || 49900), 0);

    // Total Platform GMV
    const grossGMVPaise = totalCollectedPaise + materialPaise + requestFeesPaise;

    // Platform Net Revenue: 10% on architecture milestones + 5% on material orders + 100% on request fees
    const platformMilestoneRevenuePaise = Math.round(totalCollectedPaise * 0.1);
    const platformMaterialRevenuePaise = Math.round(materialPaise * 0.05);
    const platformNetRevenuePaise = platformMilestoneRevenuePaise + platformMaterialRevenuePaise + requestFeesPaise;

    // Architect Disbursements & TDS
    const disbursedPayouts = payouts.filter((p) => p.status === 'PAID');
    const totalDisbursedPaise = disbursedPayouts.reduce((sum, p) => sum + p.netPayablePaise, 0);
    const totalTdsPaise = payouts.reduce((sum, p) => sum + p.tdsDeductionPaise, 0);

    // Active Escrow Pool
    const activeEscrowHoldingPaise = totalCollectedPaise - totalDisbursedPaise;

    return {
      grossGMVPaise,
      totalCollectedPaise,
      materialPaise,
      requestFeesPaise,
      platformNetRevenuePaise,
      totalDisbursedPaise,
      totalTdsPaise,
      activeEscrowHoldingPaise,
    };
  }, [payments, vendorOrders, requests, payouts]);

  // Funnel & Commercial Metrics
  const commercialFunnel = useMemo(() => {
    const totalRequests = requests.length;
    const quotesGenerated = requests.filter(
      (r) => r.status === 'QUOTATIONS_AVAILABLE' || (r as any).quotationsCount > 0
    ).length;
    const confirmedProjects = executionProjects.length;
    const completedProjects = executionProjects.filter((p) => p.status === 'COMPLETED').length;

    return [
      {
        stage: '1. RFQ Quotation Requests',
        count: totalRequests,
        conversion: '100%',
        dropOff: '0%',
        valuePaise: totalRequests * 49900,
      },
      {
        stage: '2. Multi-Architect Quotations Published',
        count: quotesGenerated,
        conversion: totalRequests > 0 ? `${Math.round((quotesGenerated / totalRequests) * 100)}%` : '0%',
        dropOff: totalRequests > 0 ? `${Math.max(0, 100 - Math.round((quotesGenerated / totalRequests) * 100))}%` : '0%',
        valuePaise: quotesGenerated * 15000000,
      },
      {
        stage: '3. Executed Contracts & Escrow Kickoff',
        count: confirmedProjects,
        conversion: quotesGenerated > 0 ? `${Math.round((confirmedProjects / quotesGenerated) * 100)}%` : '0%',
        dropOff: quotesGenerated > 0 ? `${Math.max(0, 100 - Math.round((confirmedProjects / quotesGenerated) * 100))}%` : '0%',
        valuePaise: financialSummary.totalCollectedPaise,
      },
      {
        stage: '4. IS 456 Compliant Project Handover',
        count: completedProjects,
        conversion: confirmedProjects > 0 ? `${Math.round((completedProjects / confirmedProjects) * 100)}%` : '0%',
        dropOff: confirmedProjects > 0 ? `${Math.max(0, 100 - Math.round((completedProjects / confirmedProjects) * 100))}%` : '0%',
        valuePaise: completedProjects * 45000000,
      },
    ];
  }, [requests, executionProjects, financialSummary]);

  // Export CSV Handler
  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: string[] = [];
    let reportName = 'BuildGhar_Report';

    if (activeReportTab === 'FINANCIAL_GMV') {
      reportName = 'Financial_Collections_Escrow_Ledger';
      headers = ['Payment Code,Project ID,Customer Name,Purpose,Gross Amount (INR),Status,Date,Method'];
      rows = payments.map(
        (p) =>
          `"${p.paymentCode}","${p.projectId}","${p.customerName}","${p.purpose}",${p.grossAmountPaise / 100},"${p.status}","${p.createdAt.slice(0, 10)}","${p.paymentMethod}"`
      );
    } else if (activeReportTab === 'COMMERCIAL_QUOTATIONS') {
      reportName = 'Quotation_Velocity_Report';
      headers = ['Funnel Stage,Count,Conversion Rate,Drop-off Rate,Volume (INR)'];
      rows = commercialFunnel.map(
        (f) => `"${f.stage}",${f.count},"${f.conversion}","${f.dropOff}",${f.valuePaise / 100}`
      );
    } else if (activeReportTab === 'PROJECT_DELIVERY') {
      reportName = 'Project_Milestone_Delivery_Report';
      headers = ['Project ID,Project Name,Customer,Architect,City,Status,Budget (INR)'];
      rows = executionProjects.map(
        (p) => `"${p.id}","${p.name}","${p.customerName}","${p.architectName}","${p.city}","${p.status}",${(p.budgetPaise || 0) / 100}`
      );
    } else if (activeReportTab === 'PARTNER_PERFORMANCE') {
      reportName = 'Architect_Performance_KYC_Report';
      headers = ['Architect ID,Name,Firm,City,COA Reg,Status,Assigned Count'];
      rows = architects.map(
        (a) => `"${a.id}","${a.fullName}","${a.firmName}","${a.city}","${a.coaRegistrationNumber}","${a.accountStatus}",${a.assignedRequestsCount || 0}`
      );
    } else {
      reportName = 'Dispute_Grievance_SLA_Report';
      headers = ['Dispute Code,Project ID,Complainant,Type,Priority,Status,Created At'];
      rows = disputes.map(
        (d) => `"${d.disputeCode}","${d.projectId}","${d.complainantName}","${d.disputeType}","${d.priority}","${d.status}","${d.createdAt.slice(0, 10)}"`
      );
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join('\n'), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${reportName}_${timeRange}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    success(`Exported ${reportName} to CSV successfully.`);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <BarChart3 className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold font-display text-navy-950">
                  Marketplace Intelligence & Comprehensive Reports
                </h1>
                <Badge variant="blue" className="text-[10px] uppercase font-bold tracking-wider">
                  Section 18 Compliant
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Date-filtered financial GMV, platform take-rates, escrow collections, partner payouts, and delivery SLA audits.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Time range switcher */}
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
            {(['TODAY', 'THIS_WEEK', 'THIS_MONTH', 'LAST_MONTH', 'FINANCIAL_YEAR', 'ALL'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-2.5 py-1.5 rounded-lg transition text-[11px] ${
                  timeRange === range ? 'bg-white text-navy-950 shadow-2xs font-extrabold' : 'hover:text-slate-900'
                }`}
              >
                {range.replace(/_/g, ' ')}
              </button>
            ))}
          </div>

          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Primary Financial KPIs (Exact Calculations in Paise) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex justify-between items-center text-xs text-slate-500 font-bold uppercase tracking-wider">
            <span>Gross Platform GMV</span>
            <Layers className="w-4 h-4 text-sky-600" />
          </div>
          <p className="text-2xl font-black text-navy-950 font-display">
            {formatINR(financialSummary.grossGMVPaise)}
          </p>
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Escrow + Materials + Inquiries</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-2xs space-y-2">
          <div className="flex justify-between items-center text-xs text-emerald-700 font-bold uppercase tracking-wider">
            <span>Net Platform Revenue</span>
            <IndianRupee className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-600 font-display">
            {formatINR(financialSummary.platformNetRevenuePaise)}
          </p>
          <div className="text-xs text-emerald-700 font-medium">
            10% Arch Take-Rate + 5% Vendor Fee
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50/40 to-indigo-50/20 shadow-2xs space-y-2">
          <div className="flex justify-between items-center text-xs text-blue-700 font-bold uppercase tracking-wider">
            <span>Active Escrow Pool Held</span>
            <ShieldCheck className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-blue-900 font-display">
            {formatINR(financialSummary.activeEscrowHoldingPaise)}
          </p>
          <div className="text-xs text-blue-700 font-medium">
            Protected customer funds before signoff
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-purple-200 shadow-2xs space-y-2">
          <div className="flex justify-between items-center text-xs text-purple-700 font-bold uppercase tracking-wider">
            <span>TDS Remittance (1%)</span>
            <Building className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-black text-purple-950 font-display">
            {formatINR(financialSummary.totalTdsPaise)}
          </p>
          <div className="text-xs text-slate-500 font-medium">
            Section 194M/194C statutory deposit
          </div>
        </div>
      </div>

      {/* Report Module Tabs (Section 18) */}
      <div className="flex items-center justify-between border-b border-slate-200 gap-2 overflow-x-auto">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveReportTab('FINANCIAL_GMV')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeReportTab === 'FINANCIAL_GMV'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Financial Collections & Escrow Ledger</span>
          </button>

          <button
            onClick={() => setActiveReportTab('COMMERCIAL_QUOTATIONS')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeReportTab === 'COMMERCIAL_QUOTATIONS'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Quotation Velocity & Funnel</span>
          </button>

          <button
            onClick={() => setActiveReportTab('PROJECT_DELIVERY')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeReportTab === 'PROJECT_DELIVERY'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <HardHat className="w-3.5 h-3.5" />
            <span>Project Milestones & Deliverables</span>
          </button>

          <button
            onClick={() => setActiveReportTab('PARTNER_PERFORMANCE')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeReportTab === 'PARTNER_PERFORMANCE'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Architect Network & KYC</span>
          </button>

          <button
            onClick={() => setActiveReportTab('DISPUTES_AUDIT')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeReportTab === 'DISPUTES_AUDIT'
                ? 'border-rose-600 text-rose-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Disputes & Grievance SLA</span>
          </button>
        </div>
      </div>

      {/* Active Report View */}
      {activeReportTab === 'FINANCIAL_GMV' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-navy-950 text-sm">Customer Collections, Platform Escrow & Payout Summary</h3>
              <p className="text-xs text-slate-500">Real-time journal records verified under Sections 12 & 13</p>
            </div>
            <span className="font-mono text-xs font-bold text-blue-700">
              {payments.length} Transactions
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 uppercase font-bold text-[10px]">
                <tr>
                  <th className="py-3 px-4">Payment Code</th>
                  <th className="py-3 px-4">Project Association</th>
                  <th className="py-3 px-4">Customer Name</th>
                  <th className="py-3 px-4">Purpose</th>
                  <th className="py-3 px-4 text-right">Gross Amount</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4">Payment Method</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">{p.paymentCode}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-blue-700">{p.projectId}</div>
                      <div className="text-[11px] text-slate-500 truncate max-w-xs">{p.projectTitle}</div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{p.customerName}</td>
                    <td className="py-3 px-4">
                      <Badge variant="blue" className="text-[9px]">
                        {p.purpose.replace(/_/g, ' ')}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-navy-950 font-display">
                      {formatINR(p.grossAmountPaise)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                        {p.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{p.paymentMethod.replace(/_/g, ' ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeReportTab === 'COMMERCIAL_QUOTATIONS' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <h3 className="font-bold text-navy-950 text-sm">Quotation Commercial Funnel & Take-Rate Velocity</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {commercialFunnel.map((step, idx) => (
                <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{step.stage}</div>
                  <div className="text-2xl font-bold font-display text-navy-950">{step.count}</div>
                  <div className="text-[11px] text-emerald-600 font-semibold flex items-center justify-between">
                    <span>Conv: {step.conversion}</span>
                    <span className="text-slate-400">Drop: {step.dropOff}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-200">
                    Est. Value: {formatINR(step.valuePaise)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeReportTab === 'PROJECT_DELIVERY' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-navy-950 text-sm">Project Delivery & IS 456 Milestone Status</h3>
              <p className="text-xs text-slate-500">Live monitoring of construction deliverables across territories</p>
            </div>
            <span className="font-mono text-xs font-bold text-blue-700">
              {executionProjects.length} Projects Active
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 uppercase font-bold text-[10px]">
                <tr>
                  <th className="py-3 px-4">Project ID</th>
                  <th className="py-3 px-4">Project Title & City</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Assigned Architect</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Contract Budget</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {executionProjects.map((proj) => (
                  <tr key={proj.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono font-bold text-blue-700">{proj.id}</td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{proj.name}</div>
                      <div className="text-[11px] text-slate-500">{proj.city}</div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{proj.customerName}</td>
                    <td className="py-3 px-4 text-blue-700 font-semibold">{proj.architectName}</td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant="blue" className="text-[10px] font-bold">
                        {proj.status.replace(/_/g, ' ')}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-navy-950 font-display">
                      {formatINR(proj.budgetPaise || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeReportTab === 'PARTNER_PERFORMANCE' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-navy-950 text-sm">Architect Partner Directory & COA Accreditation</h3>
              <p className="text-xs text-slate-500">Verified council accreditation and quotation turnaround telemetry</p>
            </div>
            <span className="font-mono text-xs font-bold text-blue-700">
              {architects.length} Registered Architects
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 uppercase font-bold text-[10px]">
                <tr>
                  <th className="py-3 px-4">Architect ID</th>
                  <th className="py-3 px-4">Name & Firm</th>
                  <th className="py-3 px-4">COA Registration</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4 text-center">KYC Status</th>
                  <th className="py-3 px-4 text-center">Assignments</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {architects.map((arc) => (
                  <tr key={arc.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">{arc.id}</td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-navy-950">{arc.fullName}</div>
                      <div className="text-[11px] text-slate-500">{arc.firmName}</div>
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-blue-700">
                      {arc.coaRegistrationNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{arc.city}</td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant="emerald" className="text-[10px] font-bold">
                        {arc.accountStatus}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-slate-800">
                      {arc.assignedRequestsCount || 1}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeReportTab === 'DISPUTES_AUDIT' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-navy-950 text-sm">Grievance & Dispute Resolution Audit Log</h3>
              <p className="text-xs text-slate-500">Section 15 dispute telemetry and payout hold records</p>
            </div>
            <span className="font-mono text-xs font-bold text-rose-700">
              {disputes.length} Disputes Logged
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 uppercase font-bold text-[10px]">
                <tr>
                  <th className="py-3 px-4">Dispute Code</th>
                  <th className="py-3 px-4">Project ID</th>
                  <th className="py-3 px-4">Complainant</th>
                  <th className="py-3 px-4">Dispute Category</th>
                  <th className="py-3 px-4 text-center">Priority</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {disputes.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">{d.disputeCode}</td>
                    <td className="py-3 px-4 font-mono font-bold text-blue-700">{d.projectId}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{d.complainantName}</td>
                    <td className="py-3 px-4">
                      <Badge variant="slate" className="text-[10px]">
                        {d.disputeType.replace(/_/g, ' ')}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant={d.priority === 'CRITICAL_URGENT' ? 'rose' : 'amber'} className="text-[10px]">
                        {d.priority}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800">
                        {d.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
