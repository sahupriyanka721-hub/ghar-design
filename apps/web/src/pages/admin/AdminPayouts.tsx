import React, { useState, useEffect, useMemo } from 'react';
import { formatINR, formatDate } from '../../lib/utils.js';
import { useToast } from '../../context/ToastContext.js';
import { Badge } from '../../components/common/Badge.js';
import { Link } from 'react-router-dom';
import {
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Eye,
  X,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  FileText,
  Building,
  Lock,
  ExternalLink,
  ChevronRight,
  Printer,
  BadgePercent,
  Check,
  Briefcase,
  AlertTriangle,
  RotateCcw,
  Landmark,
  Compass,
} from 'lucide-react';
import {
  getArchitectPayouts,
  saveArchitectPayout,
  approveArchitectPayout,
  disburseArchitectPayout,
  holdArchitectPayout,
  ArchitectPayoutItem,
} from '../../data/financialLedgerStore.js';
import {
  getInteriorPayouts,
  adminApprovePayout,
  adminRejectPayout,
  adminHoldPayout,
  InteriorPayoutRequest,
} from '../../data/interiorDesignerStore.js';
import { logAdminAuditAction } from '../../data/adminRbacStore.js';

export const AdminPayouts: React.FC = () => {
  const { success, error } = useToast();

  const [discipline, setDiscipline] = useState<'ARCHITECT' | 'INTERIOR'>('ARCHITECT');
  const [payouts, setPayouts] = useState<ArchitectPayoutItem[]>([]);
  const [interiorPayouts, setInteriorPayouts] = useState<InteriorPayoutRequest[]>(() => getInteriorPayouts());
  const [selectedInteriorPayout, setSelectedInteriorPayout] = useState<InteriorPayoutRequest | null>(null);
  const [isInteriorDisburseModalOpen, setIsInteriorDisburseModalOpen] = useState(false);
  const [isInteriorHoldModalOpen, setIsInteriorHoldModalOpen] = useState(false);
  const [interiorUtr, setInteriorUtr] = useState('');
  const [interiorHoldReason, setInteriorHoldReason] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'ELIGIBLE' | 'PROCESSING' | 'PAID' | 'HELD'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [selectedPayout, setSelectedPayout] = useState<ArchitectPayoutItem | null>(null);
  const [isDisburseModalOpen, setIsDisburseModalOpen] = useState(false);
  const [isHoldModalOpen, setIsHoldModalOpen] = useState(false);
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);

  // Bank Disburse Form
  const [disburseForm, setDisburseForm] = useState({
    utrNumber: `HDFCR5202611${Math.floor(100000 + Math.random() * 900000)}`,
    bankName: 'HDFC Bank Corporate NEFT',
    accountNumberMasked: '•••• •••• 4912',
    ifscCode: 'HDFC0001248',
    notes: 'Escrow released upon milestone quality signoff and customer verification.',
  });

  // Hold Reason Form
  const [holdReason, setHoldReason] = useState('');

  const loadData = () => {
    try {
      const list = getArchitectPayouts();
      setPayouts([...list]);
      setInteriorPayouts(getInteriorPayouts());
    } catch (err) {
      console.error('Error loading architect payouts:', err);
    }
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('FINANCIAL_PAYOUTS_UPDATED', handleUpdate);
    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('FINANCIAL_PAYOUTS_UPDATED', handleUpdate);
    };
  }, []);

  // Filtered Payouts
  const filteredPayouts = useMemo(() => {
    return payouts.filter((p) => {
      if (activeTab !== 'ALL' && p.status !== activeTab) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode = p.payoutCode.toLowerCase().includes(q);
        const matchArc = p.architectName.toLowerCase().includes(q) || p.architectFirm.toLowerCase().includes(q);
        const matchProj = p.projectId.toLowerCase().includes(q) || p.projectTitle.toLowerCase().includes(q);
        const matchUTR = (p.utrNumber || '').toLowerCase().includes(q);
        return matchCode || matchArc || matchProj || matchUTR;
      }
      return true;
    });
  }, [payouts, activeTab, searchQuery]);

  // Aggregate Metrics
  const stats = useMemo(() => {
    const paidList = payouts.filter((p) => p.status === 'PAID');
    const totalDisbursed = paidList.reduce((sum, p) => sum + p.netPayablePaise, 0);

    const eligibleList = payouts.filter((p) => p.status === 'ELIGIBLE');
    const totalEligible = eligibleList.reduce((sum, p) => sum + p.netPayablePaise, 0);

    const processingList = payouts.filter((p) => p.status === 'PROCESSING');
    const totalProcessing = processingList.reduce((sum, p) => sum + p.netPayablePaise, 0);

    const totalCommission = payouts.reduce((sum, p) => sum + p.platformCommissionPaise, 0);
    const totalTds = payouts.reduce((sum, p) => sum + p.tdsDeductionPaise, 0);

    const heldList = payouts.filter((p) => p.status === 'HELD');

    return {
      totalDisbursed,
      paidCount: paidList.length,
      totalEligible,
      eligibleCount: eligibleList.length,
      totalProcessing,
      processingCount: processingList.length,
      totalCommission,
      totalTds,
      heldCount: heldList.length,
    };
  }, [payouts]);

  // Actions
  const handleOpenDisburse = (payout: ArchitectPayoutItem) => {
    setSelectedPayout(payout);
    setDisburseForm({
      utrNumber: `HDFCR5202611${Math.floor(100000 + Math.random() * 900000)}`,
      bankName: payout.bankName || 'HDFC Bank Corporate NEFT',
      accountNumberMasked: payout.accountNumberMasked || '•••• •••• 4912',
      ifscCode: payout.ifscCode || 'HDFC0001248',
      notes: `Escrow disbursement released to ${payout.architectFirm} for milestone ${payout.milestoneTitle}`,
    });
    setIsDisburseModalOpen(true);
  };

  const confirmDisburse = () => {
    if (!selectedPayout) return;
    if (!disburseForm.utrNumber.trim()) {
      error('Please enter a valid bank UTR / NEFT Reference Number');
      return;
    }

    try {
      const updated = disburseArchitectPayout(selectedPayout.id, {
        utrNumber: disburseForm.utrNumber.trim(),
        bankName: disburseForm.bankName,
        accountNumberMasked: disburseForm.accountNumberMasked,
        ifscCode: disburseForm.ifscCode,
        notes: disburseForm.notes,
      });

      if (updated) {
        logAdminAuditAction({
          action: 'PAYOUT_DISBURSED',
          targetType: 'PAYOUT',
          targetId: updated.payoutCode,
          description: `Disbursed net ₹${(updated.netPayablePaise / 100).toLocaleString('en-IN')} to ${updated.architectName} (${updated.architectFirm}) via UTR: ${updated.utrNumber}`,
          metadata: {
            payoutId: updated.id,
            projectId: updated.projectId,
            gross: updated.grossCollectedPaise,
            commission: updated.platformCommissionPaise,
            tds: updated.tdsDeductionPaise,
            net: updated.netPayablePaise,
          },
        });

        success(`Payout ${updated.payoutCode} disbursed successfully! Escrow general ledger updated.`);
        loadData();
        setSelectedPayout(updated);
        setIsDisburseModalOpen(false);
      }
    } catch (err: any) {
      error(err.message || 'Failed to disburse payout');
    }
  };

  const handleOpenHold = (payout: ArchitectPayoutItem) => {
    setSelectedPayout(payout);
    setHoldReason('');
    setIsHoldModalOpen(true);
  };

  const confirmHold = () => {
    if (!selectedPayout) return;
    if (!holdReason.trim()) {
      error('Please enter a specific reason for placing payout on hold');
      return;
    }

    try {
      const updated = holdArchitectPayout(selectedPayout.id, holdReason.trim());
      if (updated) {
        logAdminAuditAction({
          action: 'PAYOUT_HELD',
          targetType: 'PAYOUT',
          targetId: updated.payoutCode,
          description: `Placed payout on hold for ${updated.architectName}: ${holdReason.trim()}`,
          metadata: { payoutId: updated.id, reason: holdReason.trim() },
        });

        success(`Payout ${updated.payoutCode} put on HELD status.`);
        loadData();
        setSelectedPayout(updated);
        setIsHoldModalOpen(false);
      }
    } catch (err: any) {
      error(err.message || 'Failed to hold payout');
    }
  };

  const handleReleaseHold = (payout: ArchitectPayoutItem) => {
    const updated: ArchitectPayoutItem = {
      ...payout,
      status: 'ELIGIBLE',
      holdReason: undefined,
    };
    saveArchitectPayout(updated);
    logAdminAuditAction({
      action: 'PAYOUT_HOLD_RELEASED',
      targetType: 'PAYOUT',
      targetId: updated.payoutCode,
      description: `Released hold on payout for ${updated.architectName}. Ready for disbursement.`,
    });
    success(`Hold released for ${updated.payoutCode}. Status reset to ELIGIBLE.`);
    loadData();
  };

  const handleOpenVoucher = (payout: ArchitectPayoutItem) => {
    setSelectedPayout(payout);
    setIsVoucherModalOpen(true);
  };

  // Interior Designer Payout Handlers (Section 14 Step 7)
  const handleOpenInteriorDisburse = (payout: InteriorPayoutRequest) => {
    setSelectedInteriorPayout(payout);
    setInteriorUtr(`CMS202611${Math.floor(100000 + Math.random() * 900000)}`);
    setIsInteriorDisburseModalOpen(true);
  };

  const confirmInteriorDisburse = () => {
    if (!selectedInteriorPayout) return;
    try {
      adminApprovePayout(selectedInteriorPayout.id, interiorUtr.trim());
      logAdminAuditAction({
        action: 'PAYOUT_DISBURSED',
        targetType: 'PAYOUT',
        targetId: selectedInteriorPayout.id,
        description: `Disbursed net ₹${(selectedInteriorPayout.netPayable || selectedInteriorPayout.amount).toLocaleString('en-IN')} to Interior Designer via UTR: ${interiorUtr.trim()}`,
      });
      success(`Interior payout ${selectedInteriorPayout.id} disbursed successfully via UTR ${interiorUtr.trim()}`);
      loadData();
      setIsInteriorDisburseModalOpen(false);
    } catch (err: any) {
      error(err.message || 'Failed to disburse payout');
    }
  };

  const handleOpenInteriorHold = (payout: InteriorPayoutRequest) => {
    setSelectedInteriorPayout(payout);
    setInteriorHoldReason('');
    setIsInteriorHoldModalOpen(true);
  };

  const confirmInteriorHold = () => {
    if (!selectedInteriorPayout) return;
    try {
      adminHoldPayout(selectedInteriorPayout.id, interiorHoldReason.trim() || 'Quality snag inspection pending');
      success(`Interior payout ${selectedInteriorPayout.id} placed ON HOLD.`);
      loadData();
      setIsInteriorHoldModalOpen(false);
    } catch (err: any) {
      error(err.message || 'Failed to hold payout');
    }
  };

  const handleInteriorReject = (payout: InteriorPayoutRequest) => {
    const reason = window.prompt('Enter reason for rejecting this interior payout request:');
    if (!reason) return;
    try {
      adminRejectPayout(payout.id, reason);
      success(`Interior payout ${payout.id} rejected.`);
      loadData();
    } catch (err: any) {
      error(err.message || 'Failed to reject payout');
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold font-display text-navy-950">
              Architect Payouts & Commission Desk
            </h1>
            <Badge variant="blue" className="text-[10px] uppercase font-bold tracking-wider">
              Section 13 Compliant
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Strict Multi-Party Escrow: Customer Funds ➔ BuildGhar Platform Verification ➔ 10% Commission & 1% TDS Retained ➔ Partner Disbursement.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/admin/payments"
            className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-300 hover:border-slate-400 bg-white text-slate-700 flex items-center gap-1.5 shadow-2xs transition"
          >
            <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
            <span>Customer Escrow Ledger</span>
          </Link>
          <Link
            to="/admin/invoices"
            className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-300 hover:border-slate-400 bg-white text-slate-700 flex items-center gap-1.5 shadow-2xs transition"
          >
            <FileText className="w-3.5 h-3.5 text-blue-600" />
            <span>Tax Invoices & Billing</span>
          </Link>
        </div>
      </div>

      {/* Top-Level Discipline Switcher (Rule 14 Stream Segregation) */}
      <div className="bg-white p-2.5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDiscipline('ARCHITECT')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              discipline === 'ARCHITECT'
                ? 'bg-navy-950 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>🏛️ Architectural CAD Disbursements ({payouts.length})</span>
          </button>
          <button
            onClick={() => setDiscipline('INTERIOR')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              discipline === 'INTERIOR'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Landmark className="w-4 h-4" />
            <span>🛋️ Interior Designer Milestone Settlements (Section 14) ({interiorPayouts.length})</span>
          </button>
        </div>

        <div className="text-[11px] font-mono text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
          Rule 14: Architect & Interior designer escrow accounts segregated
        </div>
      </div>

      {discipline === 'ARCHITECT' && (
        <>
          {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Partner Disbursed</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-navy-950 font-display">
            {formatINR(stats.totalDisbursed)}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium">
            Across {stats.paidCount} completed milestone transfers
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50/50 to-indigo-50/20 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-blue-800 text-xs font-semibold">
            <span>Eligible for Bank Transfer</span>
            <div className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-blue-950 font-display">
            {formatINR(stats.totalEligible)}
          </div>
          <div className="text-[11px] text-blue-700 font-medium">
            {stats.eligibleCount} milestone(s) approved & ready
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Platform Commission (10%)</span>
            <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
              <BadgePercent className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-purple-950 font-display">
            {formatINR(stats.totalCommission)}
          </div>
          <div className="text-[11px] text-purple-700 font-medium">
            BuildGhar Net Platform Revenue
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>TDS Withholding (1%)</span>
            <div className="p-1.5 rounded-lg bg-slate-100 text-slate-600">
              <Landmark className="w-4 h-4 text-slate-700" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-display">
            {formatINR(stats.totalTds)}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            Section 194M/194C IT Remittance
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 gap-2 overflow-x-auto">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'ALL'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>All Payouts</span>
            <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-[10px] text-slate-600">
              {payouts.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('ELIGIBLE')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'ELIGIBLE'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5 text-blue-600" />
            <span>Eligible for Transfer</span>
            {stats.eligibleCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-blue-100 text-[10px] font-bold text-blue-800 animate-pulse">
                {stats.eligibleCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('PROCESSING')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'PROCESSING'
                ? 'border-amber-600 text-amber-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            <span>In Processing</span>
            <span className="px-1.5 py-0.5 rounded-full bg-amber-50 text-[10px] text-amber-700">
              {stats.processingCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('PAID')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'PAID'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Disbursed & Paid</span>
            <span className="px-1.5 py-0.5 rounded-full bg-emerald-50 text-[10px] text-emerald-700">
              {stats.paidCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('HELD')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'HELD'
                ? 'border-rose-600 text-rose-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>On Hold / Disputed</span>
            {stats.heldCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-rose-100 text-[10px] font-bold text-rose-800">
                {stats.heldCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Payout Code, Architect Name, Firm, Project ID (BG-2026-XXXX), UTR..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600"
          />
        </div>
      </div>

      {/* Payouts Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Disbursement Code</th>
                <th className="py-3 px-4">Partner Architect & Firm</th>
                <th className="py-3 px-4">Project & Milestone</th>
                <th className="py-3 px-4 text-right">Gross Milestone</th>
                <th className="py-3 px-4 text-right">Deductions (10% + 1%)</th>
                <th className="py-3 px-4 text-right">Net Partner Payable</th>
                <th className="py-3 px-4 text-center">Payout Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPayouts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <CreditCard className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-sm">No architect payout records match criteria</p>
                  </td>
                </tr>
              ) : (
                filteredPayouts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-mono">
                      <div className="font-bold text-slate-800">{p.payoutCode}</div>
                      <div className="text-[10px] text-slate-400 font-sans">{formatDate(p.createdAt)}</div>
                      {p.utrNumber && (
                        <div className="text-[10px] text-emerald-700 font-mono truncate max-w-[120px]">
                          UTR: {p.utrNumber}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-navy-950 flex items-center gap-1.5">
                        <Compass className="w-3.5 h-3.5 text-blue-600" />
                        <span>{p.architectName}</span>
                      </div>
                      <div className="text-[11px] text-slate-600 font-medium">{p.architectFirm}</div>
                      <div className="text-[10px] text-slate-400">{p.architectPhone}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-[11px] text-blue-700 font-semibold truncate max-w-xs flex items-center gap-1">
                        <span className="font-mono text-[10px] px-1 py-0.2 bg-blue-50 rounded border border-blue-200">
                          {p.projectId}
                        </span>
                        <span className="truncate">{p.projectTitle}</span>
                      </div>
                      <div className="text-[11px] text-slate-700 font-medium mt-0.5">
                        {p.milestoneTitle}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Customer: {p.customerName} ({p.customerPaymentRef})
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right font-medium text-slate-700">
                      {formatINR(p.grossCollectedPaise)}
                    </td>

                    <td className="py-3.5 px-4 text-right text-[11px]">
                      <div className="text-purple-700 font-medium">
                        Comm: -{formatINR(p.platformCommissionPaise)} (10%)
                      </div>
                      <div className="text-slate-500">
                        TDS: -{formatINR(p.tdsDeductionPaise)} (1%)
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="font-bold text-navy-950 font-display text-sm">
                        {formatINR(p.netPayablePaise)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Bank: {p.bankName || 'HDFC Bank'}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      {p.status === 'ELIGIBLE' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 animate-pulse">
                          <ArrowUpRight className="w-3 h-3 text-blue-600" />
                          <span>Eligible</span>
                        </span>
                      )}
                      {p.status === 'PROCESSING' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <AlertCircle className="w-3 h-3 text-amber-600" />
                          <span>Processing</span>
                        </span>
                      )}
                      {p.status === 'PAID' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Disbursed</span>
                        </span>
                      )}
                      {p.status === 'HELD' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                          <span>On Hold</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenVoucher(p)}
                          title="View Payout Settlement Advice"
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
                        >
                          <FileText className="w-3.5 h-3.5 text-blue-600" />
                        </button>

                        {(p.status === 'ELIGIBLE' || p.status === 'PROCESSING') && (
                          <>
                            <button
                              onClick={() => handleOpenDisburse(p)}
                              title="Authorize Bank Transfer & Release Escrow"
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-2xs transition"
                            >
                              <Check className="w-3 h-3" />
                              <span>Transfer</span>
                            </button>
                            <button
                              onClick={() => handleOpenHold(p)}
                              title="Put on Hold / Defect Dispute"
                              className="p-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 transition"
                            >
                              <AlertTriangle className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}

                        {p.status === 'HELD' && (
                          <button
                            onClick={() => handleReleaseHold(p)}
                            title="Release Hold"
                            className="px-2 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-2xs transition"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Release</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      </>
      )}

      {discipline === 'INTERIOR' && (
        <div className="space-y-6">
          {/* Interior KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Total Interior Disbursed</span>
                <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-navy-950 font-display">
                ₹{interiorPayouts.filter((p) => p.status === 'PROCESSED').reduce((s, p) => s + (p.netPayable || p.amount), 0).toLocaleString()}
              </div>
              <div className="text-[11px] text-emerald-600 font-medium">
                {interiorPayouts.filter((p) => p.status === 'PROCESSED').length} completed NEFT transfers
              </div>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50/50 to-indigo-50/20 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-blue-800 text-xs font-semibold">
                <span>Pending Admin Authorization</span>
                <div className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-blue-950 font-display">
                ₹{interiorPayouts.filter((p) => p.status === 'PENDING_ADMIN_APPROVAL').reduce((s, p) => s + (p.netPayable || p.amount), 0).toLocaleString()}
              </div>
              <div className="text-[11px] text-blue-700 font-medium">
                {interiorPayouts.filter((p) => p.status === 'PENDING_ADMIN_APPROVAL').length} request(s) awaiting UTR
              </div>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Interior Commission (10%)</span>
                <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
                  <BadgePercent className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-purple-950 font-display">
                ₹{interiorPayouts.reduce((s, p) => s + (p.platformCommission || Math.round(p.amount * 0.1)), 0).toLocaleString()}
              </div>
              <div className="text-[11px] text-purple-700 font-medium">
                Retained platform revenue
              </div>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>TDS Withheld (1%)</span>
                <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-amber-950 font-display">
                ₹{interiorPayouts.reduce((s, p) => s + (p.tdsDeduction || Math.round(p.amount * 0.01)), 0).toLocaleString()}
              </div>
              <div className="text-[11px] text-amber-700 font-medium">
                Section 194M statutory filing
              </div>
            </div>
          </div>

          {/* Interior Payouts Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-navy-950">Interior Designer Settlement Queue (Section 14 Step 7)</h3>
                <p className="text-xs text-slate-500">Authorize NEFT disbursements, record UTR transaction references, or place on hold.</p>
              </div>
              <span className="text-xs font-mono font-bold bg-white px-3 py-1 rounded-xl border border-slate-200">
                {interiorPayouts.length} Total Settlements
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Payout ID</th>
                    <th className="py-3 px-4">Project & Milestone</th>
                    <th className="py-3 px-4 text-right">Gross Amount</th>
                    <th className="py-3 px-4 text-right">Commission (10%)</th>
                    <th className="py-3 px-4 text-right">TDS (1%)</th>
                    <th className="py-3 px-4 text-right">Net Payable</th>
                    <th className="py-3 px-4">Bank Account</th>
                    <th className="py-3 px-4">UTR & Date</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {interiorPayouts.map((pay) => (
                    <tr key={pay.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{pay.requestId || pay.id}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-navy-950">{pay.projectName}</div>
                        <div className="text-[11px] text-blue-700">{pay.milestoneName}</div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-slate-800">
                        ₹{(pay.grossAmount || pay.amount).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-purple-700">
                        -₹{(pay.platformCommission || Math.round(pay.amount * 0.1)).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-amber-700">
                        -₹{(pay.tdsDeduction || Math.round(pay.amount * 0.01)).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-black text-emerald-700 text-sm">
                        ₹{(pay.netPayable || pay.amount).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{pay.bankAccount}</div>
                        <div className="text-[11px] text-slate-400 font-mono">IFSC: {pay.ifsc}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px]">
                        <div className="text-slate-800 font-bold">{pay.utrNumber || 'Pending'}</div>
                        <div className="text-slate-400">{pay.processedAt ? pay.processedAt.slice(0, 10) : pay.requestedAt.slice(0, 10)}</div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            pay.status === 'PROCESSED'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : pay.status === 'ON_HOLD'
                              ? 'bg-purple-100 text-purple-800 border border-purple-300'
                              : pay.status === 'REJECTED'
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : 'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}
                        >
                          {pay.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {pay.status === 'PENDING_ADMIN_APPROVAL' && (
                            <>
                              <button
                                onClick={() => handleOpenInteriorDisburse(pay)}
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-2xs transition"
                              >
                                <Check className="w-3 h-3" />
                                <span>Disburse</span>
                              </button>
                              <button
                                onClick={() => handleOpenInteriorHold(pay)}
                                className="px-2 py-1.5 rounded-lg border border-amber-300 hover:bg-amber-50 text-amber-700 font-bold text-[11px] transition"
                              >
                                <span>Hold</span>
                              </button>
                              <button
                                onClick={() => handleInteriorReject(pay)}
                                className="px-2 py-1.5 rounded-lg border border-rose-300 hover:bg-rose-50 text-rose-700 font-bold text-[11px] transition"
                              >
                                <span>Reject</span>
                              </button>
                            </>
                          )}
                          {pay.status === 'ON_HOLD' && (
                            <button
                              onClick={() => handleOpenInteriorDisburse(pay)}
                              className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-2xs transition"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Release & Disburse</span>
                            </button>
                          )}
                          {pay.status === 'PROCESSED' && (
                            <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>UTR Paid</span>
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Disburse Modal */}
      {isDisburseModalOpen && selectedPayout && (
        <div className="fixed inset-0 z-50 bg-navy-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <Landmark className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-navy-950 text-sm">Authorize Bank Transfer & Escrow Release</h3>
                  <p className="text-[11px] text-slate-500 font-mono">{selectedPayout.payoutCode}</p>
                </div>
              </div>
              <button
                onClick={() => setIsDisburseModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Financial Summary */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Gross Milestone Collected:</span>
                  <span className="font-semibold text-slate-800">{formatINR(selectedPayout.grossCollectedPaise)}</span>
                </div>
                <div className="flex justify-between text-purple-700">
                  <span>Less 10% Platform Commission:</span>
                  <span className="font-semibold">-{formatINR(selectedPayout.platformCommissionPaise)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Less 1% TDS (Sec 194M/194C):</span>
                  <span className="font-semibold">-{formatINR(selectedPayout.tdsDeductionPaise)}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-navy-950 text-sm">
                  <span>Net Partner Transfer Amount:</span>
                  <span className="text-emerald-700 font-display text-base">
                    {formatINR(selectedPayout.netPayablePaise)}
                  </span>
                </div>
              </div>

              {/* Bank Transfer Inputs */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Bank UTR / NEFT Reference Number <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HDFCR5202611270094"
                  value={disburseForm.utrNumber}
                  onChange={(e) => setDisburseForm({ ...disburseForm, utrNumber: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Transfer Bank</label>
                  <input
                    type="text"
                    value={disburseForm.bankName}
                    onChange={(e) => setDisburseForm({ ...disburseForm, bankName: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">IFSC Code</label>
                  <input
                    type="text"
                    value={disburseForm.ifscCode}
                    onChange={(e) => setDisburseForm({ ...disburseForm, ifscCode: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Audited Settlement Notes</label>
                <input
                  type="text"
                  value={disburseForm.notes}
                  onChange={(e) => setDisburseForm({ ...disburseForm, notes: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-900">
                <span className="font-bold">Accounting Effect: </span>
                Escrow General Ledger will be debited by {formatINR(selectedPayout.netPayablePaise)} and official Payout Voucher will be generated for {selectedPayout.architectFirm}.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsDisburseModalOpen(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmDisburse}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Confirm Bank Disbursement</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hold Modal */}
      {isHoldModalOpen && selectedPayout && (
        <div className="fixed inset-0 z-50 bg-navy-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-navy-950 text-sm">Freeze / Place Payout On Hold</h3>
                  <p className="text-[11px] text-slate-500 font-mono">{selectedPayout.payoutCode}</p>
                </div>
              </div>
              <button
                onClick={() => setIsHoldModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px]">
                Placing this payout on hold will block bank transfer until technical defect resolution or customer signoff is obtained.
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Reason for Withholding Payout <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Unresolved snag list on RCC slab reinforcement or customer revision pending..."
                  value={holdReason}
                  onChange={(e) => setHoldReason(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-600 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsHoldModalOpen(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmHold}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-1.5"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Freeze Payout</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payout Voucher / Advice Modal */}
      {isVoucherModalOpen && selectedPayout && (
        <div className="fixed inset-0 z-50 bg-navy-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-6 max-h-[90vh] overflow-y-auto animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
                  <Building className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="font-bold text-navy-950 text-lg">BuildGhar Technologies Pvt. Ltd.</h2>
                  <p className="text-[11px] text-slate-500">Partner Escrow Settlement Advice & Payout Voucher</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1.5 shadow-2xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Voucher</span>
                </button>
                <button
                  onClick={() => setIsVoucherModalOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Voucher Body */}
            <div className="space-y-4 text-xs font-sans">
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Voucher Number</span>
                  <div className="font-mono font-bold text-navy-950 text-sm">{selectedPayout.payoutCode}</div>
                  <div className="text-[11px] text-slate-500 mt-1">Date: {formatDate(selectedPayout.createdAt)}</div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Settlement Status</span>
                  <div>
                    <Badge
                      variant={selectedPayout.status === 'PAID' ? 'emerald' : 'blue'}
                      className="text-xs font-bold"
                    >
                      {selectedPayout.status}
                    </Badge>
                  </div>
                  {selectedPayout.utrNumber && (
                    <div className="text-[11px] font-mono text-emerald-700 font-bold mt-1">
                      UTR: {selectedPayout.utrNumber}
                    </div>
                  )}
                </div>
              </div>

              {/* Partner & Project Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3.5 border border-slate-200 rounded-xl space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Payable To Partner</div>
                  <div className="font-bold text-navy-950 text-sm">{selectedPayout.architectFirm}</div>
                  <div className="text-slate-600">{selectedPayout.architectName}</div>
                  <div className="text-slate-500">{selectedPayout.architectPhone}</div>
                  <div className="text-[11px] font-mono text-slate-500 pt-1">
                    Bank: {selectedPayout.bankName || 'HDFC Bank'} | A/c: {selectedPayout.accountNumberMasked || '•••• 4912'}
                  </div>
                </div>

                <div className="p-3.5 border border-slate-200 rounded-xl space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Project Association</div>
                  <div className="font-bold text-navy-950">{selectedPayout.projectTitle}</div>
                  <div className="text-[11px] font-mono text-blue-700 font-semibold">{selectedPayout.projectId}</div>
                  <div className="text-slate-600">Milestone: {selectedPayout.milestoneTitle}</div>
                  <div className="text-[11px] text-slate-500">Customer Ref: {selectedPayout.customerName}</div>
                </div>
              </div>

              {/* Financial Calculation Breakdown Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 border-b border-slate-200 font-bold text-slate-600 text-[11px]">
                    <tr>
                      <th className="py-2.5 px-3">Description</th>
                      <th className="py-2.5 px-3 text-center">Rate / Basis</th>
                      <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">
                        Gross Milestone Amount Collected in Escrow
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-500">100% Milestone Fee</td>
                      <td className="py-2.5 px-3 text-right font-semibold">
                        {formatINR(selectedPayout.grossCollectedPaise)}
                      </td>
                    </tr>
                    <tr className="text-purple-700 bg-purple-50/30">
                      <td className="py-2.5 px-3 font-medium">
                        Less: BuildGhar Platform Commission
                      </td>
                      <td className="py-2.5 px-3 text-center">10.00%</td>
                      <td className="py-2.5 px-3 text-right font-medium">
                        -{formatINR(selectedPayout.platformCommissionPaise)}
                      </td>
                    </tr>
                    <tr className="text-slate-600 bg-slate-50/40">
                      <td className="py-2.5 px-3 font-medium">
                        Less: TDS Withheld u/s 194M / 194C
                      </td>
                      <td className="py-2.5 px-3 text-center">1.00%</td>
                      <td className="py-2.5 px-3 text-right font-medium">
                        -{formatINR(selectedPayout.tdsDeductionPaise)}
                      </td>
                    </tr>
                    <tr className="bg-emerald-50/60 font-bold text-emerald-950 text-sm">
                      <td className="py-3 px-3">Net Disbursed to Partner Bank Account</td>
                      <td className="py-3 px-3 text-center font-mono text-xs">Direct NEFT/RTGS</td>
                      <td className="py-3 px-3 text-right font-display text-base text-emerald-700">
                        {formatINR(selectedPayout.netPayablePaise)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Legal & Signatures */}
              <div className="pt-4 border-t border-slate-200 grid grid-cols-2 gap-4 text-[10px] text-slate-500">
                <div>
                  <p>BuildGhar Technologies Private Limited</p>
                  <p>GSTIN: 07AAACB2489C1Z5 | PAN: AAACB2489C</p>
                  <p className="mt-2 text-slate-400">Computer generated disbursement advice. No physical signature required.</p>
                </div>
                <div className="text-right flex flex-col justify-end">
                  <div className="font-bold text-slate-700">Authorized Financial Signatory</div>
                  <div className="font-display font-bold text-blue-900 mt-1">BuildGhar Platform Escrow Audit</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interior Designer Disburse Modal (Section 14 Step 7) */}
      {isInteriorDisburseModalOpen && selectedInteriorPayout && (
        <div className="fixed inset-0 z-50 bg-navy-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <Landmark className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-navy-950 text-sm">Disburse Interior Designer Escrow Payout</h3>
                  <p className="text-[11px] text-slate-500 font-mono">{selectedInteriorPayout.id}</p>
                </div>
              </div>
              <button
                onClick={() => setIsInteriorDisburseModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Gross Milestone Collected:</span>
                  <span className="font-semibold text-slate-800">
                    ₹{(selectedInteriorPayout.grossAmount || selectedInteriorPayout.amount).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-purple-700">
                  <span>Less 10% Platform Commission:</span>
                  <span className="font-semibold">
                    -₹{(selectedInteriorPayout.platformCommission || Math.round(selectedInteriorPayout.amount * 0.1)).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-amber-700">
                  <span>Less 1% TDS (Sec 194M):</span>
                  <span className="font-semibold">
                    -₹{(selectedInteriorPayout.tdsDeduction || Math.round(selectedInteriorPayout.amount * 0.01)).toLocaleString()}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-sm text-emerald-700">
                  <span>Net NEFT Payable to Designer:</span>
                  <span>₹{(selectedInteriorPayout.netPayable || selectedInteriorPayout.amount).toLocaleString()}</span>
                </div>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-navy-950">
                <div className="font-bold">Transfer To:</div>
                <div className="font-semibold">{selectedInteriorPayout.bankAccount}</div>
                <div className="text-[11px] font-mono text-slate-600">IFSC: {selectedInteriorPayout.ifsc}</div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Bank UTR / NEFT Reference Number *</label>
                <input
                  type="text"
                  required
                  value={interiorUtr}
                  onChange={(e) => setInteriorUtr(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs focus:outline-none focus:border-emerald-600 font-bold"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsInteriorDisburseModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmInteriorDisburse}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm transition"
                >
                  Confirm & Disburse Bank NEFT
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interior Designer Hold Modal */}
      {isInteriorHoldModalOpen && selectedInteriorPayout && (
        <div className="fixed inset-0 z-50 bg-navy-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-amber-800 font-bold">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <span>Place Interior Payout ON HOLD</span>
              </div>
              <button
                onClick={() => setIsInteriorHoldModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Reason for Hold *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Quality snag audit pending on modular kitchen carcass alignment."
                  value={interiorHoldReason}
                  onChange={(e) => setInteriorHoldReason(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsInteriorHoldModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmInteriorHold}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-sm transition"
                >
                  Confirm Hold
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
