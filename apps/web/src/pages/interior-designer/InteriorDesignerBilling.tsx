import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard,
  Download,
  Building2,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  FileText,
  DollarSign,
  TrendingUp,
  Landmark,
  Plus,
  X,
  Sparkles,
  Layers,
  Receipt,
  FileCheck2,
  AlertCircle,
  HelpCircle,
  Info,
  Calendar,
  Check,
  Printer,
  Search,
  Filter,
  Percent,
  Calculator,
  Shield,
  FileSpreadsheet,
  ArrowDownLeft,
  ChevronRight,
  Building,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import {
  getInteriorInvoices,
  getInteriorPayouts,
  getInteriorLedger,
  getInteriorProjectMilestones,
  createPayoutRequest,
  InteriorInvoice,
  InteriorPayoutRequest,
  InteriorLedgerEntry,
  getInteriorDesignerByPhone,
  getInteriorProjects,
} from '../../data/interiorDesignerStore.js';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';

export type BillingViewMode =
  | 'PROFESSIONAL_FEES'
  | 'PAYMENT_SCHEDULE'
  | 'ELIGIBLE_PAYOUTS'
  | 'PENDING_PAYOUTS'
  | 'PAYOUT_HISTORY'
  | 'PAYMENT_STATEMENTS'
  | 'INVOICES'
  | 'TAX_STATEMENTS'
  | 'DEDUCTIONS_COMMISSION';

interface TaxStatementItem {
  id: string;
  financialYear: string;
  quarter: string;
  section: string;
  grossAmount: number;
  tdsDeducted: number;
  tdsRate: string;
  certificateNumber: string;
  dateDeposited: string;
  challanBSR: string;
  status: 'DEPOSITED_TO_ITD' | 'GENERATING';
}

const INITIAL_TAX_STATEMENTS: TaxStatementItem[] = [
  {
    id: 'tx-2026-q2',
    financialYear: '2026-27',
    quarter: 'Q2 (Jul - Sep 2026)',
    section: 'Sec 194J (Professional Technical Fees)',
    grossAmount: 470054,
    tdsDeducted: 4701,
    tdsRate: '1.0%',
    certificateNumber: 'FORM-16A-2026-Q2-08912',
    dateDeposited: '2026-10-07',
    challanBSR: 'BSR0290192-20261007',
    status: 'DEPOSITED_TO_ITD',
  },
  {
    id: 'tx-2026-q1',
    financialYear: '2026-27',
    quarter: 'Q1 (Apr - Jun 2026)',
    section: 'Sec 194J (Professional Technical Fees)',
    grossAmount: 620000,
    tdsDeducted: 6200,
    tdsRate: '1.0%',
    certificateNumber: 'FORM-16A-2026-Q1-04182',
    dateDeposited: '2026-07-07',
    challanBSR: 'BSR0290192-20260707',
    status: 'DEPOSITED_TO_ITD',
  },
  {
    id: 'tx-2025-q4',
    financialYear: '2025-26',
    quarter: 'Q4 (Jan - Mar 2026)',
    section: 'Sec 194J (Professional Technical Fees)',
    grossAmount: 850000,
    tdsDeducted: 8500,
    tdsRate: '1.0%',
    certificateNumber: 'FORM-16A-2025-Q4-99210',
    dateDeposited: '2026-04-07',
    challanBSR: 'BSR0290192-20260407',
    status: 'DEPOSITED_TO_ITD',
  },
];

export const InteriorDesignerBilling: React.FC = () => {
  const { user } = useAuth();
  const { success, error, info } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active View Mode
  const currentView = (searchParams.get('view') as BillingViewMode) || 'PROFESSIONAL_FEES';
  const setViewMode = (mode: BillingViewMode) => {
    setSearchParams({ view: mode });
  };

  const designer = user?.phone ? getInteriorDesignerByPhone(user.phone) : null;
  const projects = getInteriorProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || 'prj-int-1');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');

  // Data collections
  const [invoices, setInvoices] = useState<InteriorInvoice[]>(() => getInteriorInvoices());
  const [payouts, setPayouts] = useState<InteriorPayoutRequest[]>(() => getInteriorPayouts());
  const [ledgerEntries, setLedgerEntries] = useState<InteriorLedgerEntry[]>(() => getInteriorLedger());
  const [milestones] = useState(() => getInteriorProjectMilestones('prj-int-1'));
  const [taxStatements] = useState<TaxStatementItem[]>(INITIAL_TAX_STATEMENTS);

  // Modals
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [selectedInvoiceForReceipt, setSelectedInvoiceForReceipt] = useState<InteriorInvoice | null>(null);
  const [payoutAmount, setPayoutAmount] = useState(244036);
  const [payoutMilestoneId, setPayoutMilestoneId] = useState('BG-MS-INT-102');

  // Calculator state
  const [calcGrossFee, setCalcGrossFee] = useState<number>(200000);

  // Financial Balances
  const totalInvoiced = invoices.reduce((acc, inv) => acc + inv.totalAmount, 0);
  const totalPaidByClients = invoices
    .filter((inv) => inv.status === 'PAID')
    .reduce((acc, inv) => acc + inv.totalAmount, 0);
  const totalDisbursedPayouts = payouts
    .filter((p) => p.status === 'PROCESSED')
    .reduce((acc, p) => acc + (p.netPayable || p.amount), 0);
  const pendingPayoutsTotal = payouts
    .filter((p) => p.status === 'PENDING_ADMIN_APPROVAL' || p.status === 'APPROVED_BY_ADMIN')
    .reduce((acc, p) => acc + (p.netPayable || p.amount), 0);
  const availableBalance = Math.max(0, totalPaidByClients * 0.9 - totalDisbursedPayouts);

  // Filtered lists
  const pendingPayoutsList = useMemo(() => {
    return payouts.filter((p) => p.status === 'PENDING_ADMIN_APPROVAL' || p.status === 'APPROVED_BY_ADMIN');
  }, [payouts]);

  const processedPayoutsList = useMemo(() => {
    return payouts.filter((p) => p.status === 'PROCESSED');
  }, [payouts]);

  const eligibleMilestones = useMemo(() => {
    return milestones.filter(
      (m) =>
        m.status === 'ADMIN_VERIFIED_COMPLETED' ||
        m.status === 'CUSTOMER_APPROVED' ||
        m.id === 'BG-MS-INT-102'
    );
  }, [milestones]);

  const refreshData = () => {
    setInvoices(getInteriorInvoices());
    setPayouts(getInteriorPayouts());
    setLedgerEntries(getInteriorLedger());
  };

  const handleRequestPayout = (e: React.FormEvent) => {
    e.preventDefault();
    const gross = payoutAmount;
    const commission = Math.round(gross * 0.1);
    const tds = Math.round(gross * 0.01);
    const net = gross - commission - tds;

    createPayoutRequest({
      projectId: selectedProjectId,
      projectName: projects.find((p) => p.id === selectedProjectId)?.title || 'DLF The Crest Penthouse Oasis',
      milestoneId: payoutMilestoneId,
      milestoneName: 'Stage 2: 2D Working CAD Drawings & MEP Schedule',
      designerId: designer?.id || 'id-101',
      grossAmount: gross,
      platformCommission: commission,
      tdsDeduction: tds,
      netPayable: net,
      amount: net,
      bankAccount: designer?.bankDetails
        ? `${designer.bankDetails.bankName} - ${designer.bankDetails.accountNumber}`
        : 'HDFC Bank - ••••••••8910',
      ifsc: designer?.bankDetails?.ifscCode || 'HDFC0001234',
      status: 'PENDING_ADMIN_APPROVAL',
    });

    refreshData();
    setIsPayoutModalOpen(false);
    success(`Payout claim of ₹${net.toLocaleString('en-IN')} submitted to BuildGhar Finance Desk!`);
  };

  // Nav View Definitions with real-time badges
  const navTabs: { id: BillingViewMode; label: string; count: number | string; badgeColor: string }[] = useMemo(() => {
    return [
      { id: 'PROFESSIONAL_FEES', label: 'My Professional Fees', count: '₹8.6L', badgeColor: 'bg-blue-100 text-blue-800' },
      { id: 'PAYMENT_SCHEDULE', label: 'Payment Schedule', count: milestones.length, badgeColor: 'bg-indigo-100 text-indigo-800' },
      { id: 'ELIGIBLE_PAYOUTS', label: 'Eligible Payouts', count: eligibleMilestones.length, badgeColor: 'bg-emerald-100 text-emerald-800' },
      { id: 'PENDING_PAYOUTS', label: 'Pending Payouts', count: pendingPayoutsList.length, badgeColor: 'bg-amber-100 text-amber-800' },
      { id: 'PAYOUT_HISTORY', label: 'Payout History', count: processedPayoutsList.length, badgeColor: 'bg-teal-100 text-teal-800' },
      { id: 'PAYMENT_STATEMENTS', label: 'Payment Statements', count: ledgerEntries.length, badgeColor: 'bg-slate-100 text-slate-800' },
      { id: 'INVOICES', label: 'Invoices', count: invoices.length, badgeColor: 'bg-blue-100 text-blue-800' },
      { id: 'TAX_STATEMENTS', label: 'Tax Statements', count: taxStatements.length, badgeColor: 'bg-purple-100 text-purple-800' },
      { id: 'DEDUCTIONS_COMMISSION', label: 'Deductions & Commission', count: '10%', badgeColor: 'bg-rose-100 text-rose-800' },
    ];
  }, [milestones, eligibleMilestones, pendingPayoutsList, processedPayoutsList, ledgerEntries, invoices, taxStatements]);

  return (
    <div className="space-y-6 pb-20">
      {/* ----------------- TOP HERO HEADER ----------------- */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-32 -mb-16 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase bg-blue-500/20 text-blue-200 border border-blue-400/30 font-mono">
                Module 11: Financial Management
              </span>
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                <ShieldCheck className="w-3.5 h-3.5" />
                Section 14 Escrow Protected
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <CreditCard className="w-8 h-8 text-amber-400 shrink-0" />
              <span>Billing & Payment Management</span>
            </h1>
            <p className="text-sm text-blue-100/90 max-w-2xl font-normal leading-relaxed">
              Transparent financial desk: professional fee structures, milestone escrow release schedules, eligible withdrawal claims, double-entry passbook statements, and Form 16A tax deductions.
            </p>
          </div>

          {/* Project Picker & Withdrawal Action */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-2 px-3 flex flex-col justify-center">
              <label className="text-[10px] uppercase font-bold text-blue-200 font-mono">Active Project</label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer pr-4"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id} className="text-slate-900 font-medium">
                    {p.name || p.title} ({p.id})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setIsPayoutModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-2xl transition shadow-lg hover:shadow-amber-400/20"
            >
              <Landmark className="w-4 h-4" />
              <span>Request Payout Settlement</span>
            </button>
          </div>
        </div>

        {/* 4 Financial Balances Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10 text-xs">
          <div className="bg-white/10 rounded-2xl p-3 border border-white/10">
            <span className="text-blue-200 text-[11px] block font-mono">Total Invoiced</span>
            <span className="text-lg font-black text-white">₹{totalInvoiced.toLocaleString('en-IN')}</span>
            <span className="text-[10px] text-blue-300 block mt-0.5">GST Invoices Issued</span>
          </div>

          <div className="bg-white/10 rounded-2xl p-3 border border-white/10">
            <span className="text-blue-200 text-[11px] block font-mono">Client Escrow Paid</span>
            <span className="text-lg font-black text-emerald-300">₹{totalPaidByClients.toLocaleString('en-IN')}</span>
            <span className="text-[10px] text-emerald-200 block mt-0.5">100% Platform Verified</span>
          </div>

          <div className="bg-white/10 rounded-2xl p-3 border border-white/10">
            <span className="text-blue-200 text-[11px] block font-mono">Settled to Bank</span>
            <span className="text-lg font-black text-white">₹{totalDisbursedPayouts.toLocaleString('en-IN')}</span>
            <span className="text-[10px] text-slate-300 block mt-0.5">UTR Confirmed</span>
          </div>

          <div className="bg-white/10 rounded-2xl p-3 border border-white/10">
            <span className="text-blue-200 text-[11px] block font-mono">Available Payout</span>
            <span className="text-lg font-black text-amber-300">₹{availableBalance.toLocaleString('en-IN')}</span>
            <span className="text-[10px] text-amber-200 block mt-0.5">Net Withdrawal Ready</span>
          </div>
        </div>
      </div>

      {/* ----------------- SUBMENU VIEW SELECTOR & PILLS ----------------- */}
      <div className="space-y-3">
        {/* Mobile View Switcher */}
        <div className="sm:hidden bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
          <label className="block text-[11px] font-bold text-slate-500 uppercase font-mono mb-1">
            Billing View Mode
          </label>
          <select
            value={currentView}
            onChange={(e) => setViewMode(e.target.value as BillingViewMode)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
          >
            {navTabs.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label} ({t.count})
              </option>
            ))}
          </select>
        </div>

        {/* Desktop 9-Pill Horizontal Strip */}
        <div className="hidden sm:flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-bold scrollbar-none">
          {navTabs.map((tab) => {
            const isActive = currentView === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setViewMode(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl whitespace-nowrap transition-all duration-150 shrink-0 select-none ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20 font-black'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] font-mono font-black px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-white/20 text-white' : tab.badgeColor
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ----------------- VIEW 1: MY PROFESSIONAL FEES ----------------- */}
      {currentView === 'PROFESSIONAL_FEES' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                  <span>Configured Professional Fee Breakdown & Earnings</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Detailed component pricing agreed upon contract execution for 3,800 sq.ft duplex penthouse.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-800 font-mono text-xs font-bold border border-blue-200">
                Rate: ₹150 / sq.ft
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-slate-500 text-xs font-mono font-bold">Component 1</span>
                <h4 className="font-bold text-slate-900 text-sm">Space Planning & 2D Layouts</h4>
                <p className="text-xs text-slate-600">Laser survey, furniture zoning, NBC compliance.</p>
                <div className="pt-2 text-base font-black text-blue-700 font-mono">₹1,50,000</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-slate-500 text-xs font-mono font-bold">Component 2</span>
                <h4 className="font-bold text-slate-900 text-sm">2D Working Drawings & MEP CAD</h4>
                <p className="text-xs text-slate-600">Reflected ceiling plan, electrical loop schedule.</p>
                <div className="pt-2 text-base font-black text-blue-700 font-mono">₹2,20,000</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-slate-500 text-xs font-mono font-bold">Component 3</span>
                <h4 className="font-bold text-slate-900 text-sm">4K 3D Photorealistic Visualizations</h4>
                <p className="text-xs text-slate-600">V-Ray daytime & evening lighting scenes.</p>
                <div className="pt-2 text-base font-black text-blue-700 font-mono">₹2,80,000</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-slate-500 text-xs font-mono font-bold">Component 4</span>
                <h4 className="font-bold text-slate-900 text-sm">On-Site Execution Supervision</h4>
                <p className="text-xs text-slate-600">12 site audits, plumb-line & carcass inspection.</p>
                <div className="pt-2 text-base font-black text-blue-700 font-mono">₹1,50,000</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-slate-500 text-xs font-mono font-bold">Component 5</span>
                <h4 className="font-bold text-slate-900 text-sm">Material Selection Showroom Visits</h4>
                <p className="text-xs text-slate-600">4 designer-assisted depot visits for marble & veneer.</p>
                <div className="pt-2 text-base font-black text-blue-700 font-mono">₹60,000</div>
              </div>

              <div className="p-4 rounded-2xl bg-blue-600 text-white space-y-2 shadow-sm">
                <span className="text-blue-200 text-xs font-mono font-bold">Net Realization</span>
                <h4 className="font-bold text-white text-sm">Gross Contract Value</h4>
                <p className="text-xs text-blue-100">After 10% platform share & 1% TDS statutory deduction.</p>
                <div className="pt-2 text-lg font-black font-mono text-amber-300">₹7,65,400</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- VIEW 2: PAYMENT SCHEDULE ----------------- */}
      {currentView === 'PAYMENT_SCHEDULE' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-indigo-600" />
                  <span>Approved Milestone Payment Schedule</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Configured milestone weights and escrow disbursement release triggers.
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-slate-500">
                5 Stages Total
              </span>
            </div>

            <div className="space-y-3">
              {milestones.map((m) => (
                <div
                  key={m.id}
                  className="p-4 rounded-2xl border border-slate-200 hover:border-indigo-300 transition bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-indigo-800 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-200">
                        Stage {m.order}
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm">{m.name}</h4>
                    </div>
                    <p className="text-xs text-slate-500">{m.description}</p>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 justify-between md:justify-end">
                    <div className="text-right">
                      <span className="text-xs text-slate-400 font-mono block">Weight: {m.weightPercent}%</span>
                      <strong className="text-base font-black text-slate-900 font-mono">
                        ₹{m.targetAmount.toLocaleString('en-IN')}
                      </strong>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        m.status === 'ADMIN_VERIFIED_COMPLETED'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : m.status === 'CUSTOMER_APPROVED'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {m.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ----------------- VIEW 3: ELIGIBLE PAYOUTS ----------------- */}
      {currentView === 'ELIGIBLE_PAYOUTS' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  <span>Eligible Payouts Ready for Bank Withdrawal</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Milestones verified by Admin PMC and approved by homeowner, unlocked for direct bank payout settlement.
                </p>
              </div>

              <button
                onClick={() => setIsPayoutModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition self-start sm:self-auto"
              >
                <Landmark className="w-4 h-4" />
                <span>Withdraw All Eligible (₹{availableBalance.toLocaleString('en-IN')})</span>
              </button>
            </div>

            <div className="space-y-3">
              {eligibleMilestones.map((m) => {
                const gross = m.targetAmount;
                const net = Math.round(gross * 0.89); // 10% commission + 1% TDS

                return (
                  <div
                    key={m.id}
                    className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/30 flex flex-col md:flex-row md:items-center justify-between gap-3"
                  >
                    <div>
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold">
                        Stage {m.order} Unlocked
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm mt-1">{m.name}</h4>
                      <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-3 font-mono">
                        <span>Gross: ₹{gross.toLocaleString('en-IN')}</span>
                        <span>•</span>
                        <span>Commission (10%): -₹{(gross * 0.1).toLocaleString('en-IN')}</span>
                        <span>•</span>
                        <span>TDS (1%): -₹{(gross * 0.01).toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <span className="text-[10px] font-mono text-slate-400 block">Net Bank Credit</span>
                        <strong className="text-lg font-black text-emerald-700 font-mono">
                          ₹{net.toLocaleString('en-IN')}
                        </strong>
                      </div>

                      <button
                        onClick={() => {
                          setPayoutAmount(gross);
                          setPayoutMilestoneId(m.id);
                          setIsPayoutModalOpen(true);
                        }}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
                      >
                        Claim Payout
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ----------------- VIEW 4: PENDING PAYOUTS ----------------- */}
      {currentView === 'PENDING_PAYOUTS' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-600" />
                <span>Pending Payout Claims in Banking Clearing Cycle</span>
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Payout requests submitted and queued for NEFT/RTGS batch clearance with BuildGhar financial escrow desk.
              </p>
            </div>

            {pendingPayoutsList.length === 0 ? (
              <div className="p-10 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                No payout claims are currently pending clearance.
              </div>
            ) : (
              <div className="space-y-3">
                {pendingPayoutsList.map((p) => (
                  <div
                    key={p.id}
                    className="p-4 rounded-2xl border border-amber-200 bg-amber-50/30 flex flex-col md:flex-row md:items-center justify-between gap-3"
                  >
                    <div>
                      <span className="font-mono text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                        {p.id}
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm mt-1">{p.milestoneName}</h4>
                      <span className="text-xs text-slate-500 font-mono">Bank: {p.bankAccount} (IFSC: {p.ifsc})</span>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-amber-700 block">In Clearing Pipeline</span>
                      <strong className="text-lg font-black text-slate-900 font-mono">
                        ₹{(p.netPayable || p.amount).toLocaleString('en-IN')}
                      </strong>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ----------------- VIEW 5: PAYOUT HISTORY ----------------- */}
      {currentView === 'PAYOUT_HISTORY' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                <Landmark className="w-4 h-4 text-teal-600" />
                <span>Disbursed Bank Payout History (UTR Confirmed)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Official record of all successfully cleared NEFT/RTGS bank transfers.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-mono text-[11px] uppercase border-b border-slate-200">
                <tr>
                  <th className="p-3.5 pl-4">Payout ID & Date</th>
                  <th className="p-3.5">Milestone</th>
                  <th className="p-3.5">UTR / Bank Ref</th>
                  <th className="p-3.5 text-right">Gross Amount</th>
                  <th className="p-3.5 text-right">Deductions</th>
                  <th className="p-3.5 text-right">Net Credited</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 pr-4 text-right">Advice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {processedPayoutsList.map((pay) => (
                  <tr key={pay.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3.5 pl-4">
                      <strong className="text-slate-900 block font-mono">{pay.id}</strong>
                      <span className="text-[11px] text-slate-400 font-mono">{pay.processedAt ? new Date(pay.processedAt).toLocaleDateString() : '2026-11-20'}</span>
                    </td>
                    <td className="p-3.5 max-w-xs">{pay.milestoneName}</td>
                    <td className="p-3.5 font-mono text-blue-700 font-bold">{pay.transactionRef || 'HDFCN26327891234'}</td>
                    <td className="p-3.5 text-right font-mono">₹{pay.grossAmount.toLocaleString('en-IN')}</td>
                    <td className="p-3.5 text-right font-mono text-rose-600">
                      -₹{((pay.platformCommission || 0) + (pay.tdsDeduction || 0)).toLocaleString('en-IN')}
                    </td>
                    <td className="p-3.5 text-right font-mono font-black text-emerald-700 text-sm">
                      ₹{(pay.netPayable || pay.amount).toLocaleString('en-IN')}
                    </td>
                    <td className="p-3.5 text-center">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        SETTLED
                      </span>
                    </td>
                    <td className="p-3.5 pr-4 text-right">
                      <button
                        onClick={() => success(`Downloading Bank Transfer Advice for ${pay.id}...`)}
                        className="text-teal-700 hover:text-teal-900 font-bold inline-flex items-center gap-1"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Advice</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ----------------- VIEW 6: PAYMENT STATEMENTS (LEDGER) ----------------- */}
      {currentView === 'PAYMENT_STATEMENTS' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                <span>Financial Passbook & Running Ledger Statement</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Double-entry platform accounting record of client collections, commission fees, and bank withdrawals.
              </p>
            </div>

            <button
              onClick={() => success('Exporting full ledger statement CSV...')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition self-start sm:self-auto"
            >
              <Download className="w-4 h-4" />
              <span>Export Ledger Statement</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-black uppercase text-slate-500 tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3.5 pl-4">Entry ID & Date</th>
                  <th className="p-3.5">Type</th>
                  <th className="p-3.5">Description & Project</th>
                  <th className="p-3.5 text-right">Debit (-)</th>
                  <th className="p-3.5 text-right">Credit (+)</th>
                  <th className="p-3.5 text-right">Running Balance</th>
                  <th className="p-3.5 pr-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {ledgerEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3.5 pl-4">
                      <div className="font-mono font-bold text-slate-900">{entry.id}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {new Date(entry.entryDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          entry.type === 'COLLECTION'
                            ? 'bg-emerald-100 text-emerald-800'
                            : entry.type === 'PAYOUT'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {entry.type}
                      </span>
                    </td>
                    <td className="p-3.5 max-w-sm">
                      <div className="font-semibold text-slate-800">{entry.description}</div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">{entry.projectName}</div>
                    </td>
                    <td className="p-3.5 text-right font-mono text-rose-600 font-semibold">
                      {entry.debit > 0 ? `₹${entry.debit.toLocaleString('en-IN')}` : '-'}
                    </td>
                    <td className="p-3.5 text-right font-mono text-emerald-700 font-semibold">
                      {entry.credit > 0 ? `₹${entry.credit.toLocaleString('en-IN')}` : '-'}
                    </td>
                    <td className="p-3.5 text-right font-mono font-black text-slate-900">
                      ₹{entry.balance.toLocaleString('en-IN')}
                    </td>
                    <td className="p-3.5 pr-4 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {entry.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ----------------- VIEW 7: INVOICES ----------------- */}
      {currentView === 'INVOICES' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>GST-Compliant Milestone Tax Invoices</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Official tax invoices issued per milestone payment with 18% GST breakdown.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-black uppercase text-slate-500 tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3.5 pl-4">Invoice # & Date</th>
                  <th className="p-3.5">Client & Project</th>
                  <th className="p-3.5">Milestone Description</th>
                  <th className="p-3.5 text-right">Taxable</th>
                  <th className="p-3.5 text-right">GST (18%)</th>
                  <th className="p-3.5 text-right">Grand Total</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 pr-4 text-right">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3.5 pl-4">
                      <div className="font-mono font-bold text-slate-900">{inv.invoiceNumber}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{inv.date}</div>
                    </td>
                    <td className="p-3.5">
                      <strong className="text-slate-900 block">{inv.clientName}</strong>
                      <span className="text-[11px] text-slate-500">{inv.projectName}</span>
                    </td>
                    <td className="p-3.5 max-w-xs text-slate-600">{inv.milestoneName}</td>
                    <td className="p-3.5 text-right font-mono">₹{inv.amount.toLocaleString('en-IN')}</td>
                    <td className="p-3.5 text-right font-mono text-slate-500">₹{inv.taxAmount.toLocaleString('en-IN')}</td>
                    <td className="p-3.5 text-right font-mono font-black text-blue-700">₹{inv.totalAmount.toLocaleString('en-IN')}</td>
                    <td className="p-3.5 text-center">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {inv.status}
                      </span>
                    </td>
                    <td className="p-3.5 pr-4 text-right">
                      <button
                        onClick={() => setSelectedInvoiceForReceipt(inv)}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs transition inline-flex items-center gap-1"
                      >
                        <Printer className="w-3.5 h-3.5 text-blue-600" />
                        <span>Receipt</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ----------------- VIEW 8: TAX STATEMENTS (TDS) ----------------- */}
      {currentView === 'TAX_STATEMENTS' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-purple-600" />
                  <span>Section 194J TDS Statements & Form 16A Certificates</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Tax Deducted at Source (1%) deposited directly into Govt TRACES against your verified PAN.
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-200 text-xs font-mono font-bold text-purple-900 self-start sm:self-auto">
                PAN: {designer?.taxDetails?.panNumber || 'AABCP1920K'} (Verified)
              </div>
            </div>

            <div className="space-y-3">
              {taxStatements.map((tax) => (
                <div
                  key={tax.id}
                  className="p-4 rounded-2xl border border-purple-200 bg-purple-50/20 flex flex-col md:flex-row md:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-purple-800 bg-purple-100 px-2 py-0.5 rounded">
                        {tax.certificateNumber}
                      </span>
                      <strong className="text-slate-900 text-sm">{tax.quarter}</strong>
                    </div>
                    <p className="text-xs text-slate-600">{tax.section} • Rate: {tax.tdsRate}</p>
                    <div className="text-[11px] text-slate-400 font-mono">
                      Challan: {tax.challanBSR} • Deposited: {tax.dateDeposited}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 justify-between md:justify-end">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 font-mono block">TDS Deducted</span>
                      <strong className="text-base font-black text-purple-700 font-mono">
                        ₹{tax.tdsDeducted.toLocaleString('en-IN')}
                      </strong>
                    </div>

                    <button
                      onClick={() => success(`Downloading official Form 16A PDF for ${tax.quarter}...`)}
                      className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition inline-flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Form 16A</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ----------------- VIEW 9: DEDUCTIONS & COMMISSION ----------------- */}
      {currentView === 'DEDUCTIONS_COMMISSION' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Percent className="w-5 h-5 text-rose-600" />
                <span>Platform Commission Policy & Statutory Deductions</span>
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Transparent fee framework: BuildGhar platform facilitates escrow safety, client matching, and PMC quality checks for 10% platform share.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-slate-400 text-[10px] font-mono font-bold uppercase">Platform Share</span>
                <h4 className="text-xl font-black text-slate-900">10% Flat</h4>
                <p className="text-xs text-slate-600">
                  Covers PMC site quality audits, escrow bank guarantees, customer dispute resolution, and payment gateway charges.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-slate-400 text-[10px] font-mono font-bold uppercase">Statutory TDS</span>
                <h4 className="text-xl font-black text-purple-700">1.0% (Sec 194J)</h4>
                <p className="text-xs text-slate-600">
                  Deducted at source on professional technical fees and deposited under your PAN with quarterly Form 16A credit.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-slate-400 text-[10px] font-mono font-bold uppercase">GST on Platform Fee</span>
                <h4 className="text-xl font-black text-blue-700">18% GST (ITC Eligible)</h4>
                <p className="text-xs text-slate-600">
                  Levied solely on the 10% platform commission component. Fully claimable as Input Tax Credit with your GSTIN.
                </p>
              </div>
            </div>

            {/* Interactive Fee Payout Calculator Simulator */}
            <div className="p-5 bg-gradient-to-r from-slate-50 to-blue-50/50 rounded-2xl border border-slate-200 space-y-4">
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-blue-600" />
                <h4 className="font-bold text-slate-900 text-sm">Interactive Payout Estimator Simulator</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Gross Milestone Fee (₹)</label>
                  <input
                    type="number"
                    value={calcGrossFee}
                    onChange={(e) => setCalcGrossFee(Number(e.target.value) || 0)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold font-mono text-sm"
                  />
                </div>

                <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-mono block">Platform Share (10%)</span>
                  <span className="font-bold text-rose-600 font-mono text-sm">
                    -₹{(calcGrossFee * 0.1).toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-mono block">TDS Deduction (1%)</span>
                  <span className="font-bold text-purple-600 font-mono text-sm">
                    -₹{(calcGrossFee * 0.01).toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-xs">
                  <span className="text-[10px] text-blue-200 font-mono block">Net Credited to Bank</span>
                  <span className="font-black text-amber-300 font-mono text-base">
                    ₹{(calcGrossFee * 0.89).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: PAYOUT SETTLEMENT REQUEST */}
      {/* ============================================================== */}
      <AnimatePresence>
        {isPayoutModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-slate-900 font-black text-base">
                  <Landmark className="w-5 h-5 text-blue-600" />
                  <span>Request Bank Settlement (Section 14)</span>
                </div>
                <button
                  onClick={() => setIsPayoutModalOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleRequestPayout} className="space-y-4 mt-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Target Milestone</label>
                  <select
                    value={payoutMilestoneId}
                    onChange={(e) => setPayoutMilestoneId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-bold"
                  >
                    {milestones.map((m) => (
                      <option key={m.id} value={m.id}>
                        Stage {m.order}: {m.name} (₹{m.targetAmount.toLocaleString('en-IN')})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Gross Milestone Claim Amount (₹)</label>
                  <input
                    type="number"
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-bold font-mono text-sm"
                  />
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between text-slate-600">
                    <span>Platform Commission (-10%):</span>
                    <span className="text-rose-600 font-bold">-₹{(payoutAmount * 0.1).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Statutory TDS (-1% Sec 194J):</span>
                    <span className="text-purple-600 font-bold">-₹{(payoutAmount * 0.01).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-slate-900 font-bold text-sm pt-1 border-t border-slate-200">
                    <span>Net Disbursable Amount:</span>
                    <span className="text-emerald-700">₹{(payoutAmount * 0.89).toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-900 leading-relaxed space-y-1">
                  <div className="font-bold flex items-center gap-1 text-blue-950">
                    <Building className="w-3.5 h-3.5 text-blue-700" />
                    <span>Beneficiary Bank Account</span>
                  </div>
                  <p>HDFC Bank - ••••••••8910 (IFSC: HDFC0001234)</p>
                  <p className="text-slate-500">Credited within 24-48 business hours via NEFT batch.</p>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsPayoutModalOpen(false)}
                    className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-bold hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs transition"
                  >
                    Confirm & Submit Claim
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ============================================================== */}
      {/* MODAL: INVOICE RECEIPT MODAL */}
      {/* ============================================================== */}
      <AnimatePresence>
        {selectedInvoiceForReceipt && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-slate-900 font-black text-base">
                  <Printer className="w-5 h-5 text-blue-600" />
                  <span>Tax Invoice Receipt</span>
                </div>
                <button
                  onClick={() => setSelectedInvoiceForReceipt(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between font-mono">
                  <span className="text-slate-400">INVOICE NUMBER:</span>
                  <strong className="text-slate-900">{selectedInvoiceForReceipt.invoiceNumber}</strong>
                </div>
                <div className="flex justify-between font-mono">
                  <span className="text-slate-400">DATE:</span>
                  <span>{selectedInvoiceForReceipt.date}</span>
                </div>
                <div className="flex justify-between font-mono">
                  <span className="text-slate-400">PROJECT:</span>
                  <span className="text-slate-800 font-bold">{selectedInvoiceForReceipt.projectName}</span>
                </div>
                <div className="flex justify-between font-mono">
                  <span className="text-slate-400">CLIENT:</span>
                  <span>{selectedInvoiceForReceipt.clientName}</span>
                </div>
                <div className="border-t border-slate-200 pt-2 flex justify-between font-mono font-bold text-sm text-blue-800">
                  <span>TOTAL INCLUDING GST:</span>
                  <span>₹{selectedInvoiceForReceipt.totalAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => setSelectedInvoiceForReceipt(null)}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-bold text-xs"
                >
                  Close
                </button>
                <button
                  onClick={() => success('Printing official GST tax invoice PDF...')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
