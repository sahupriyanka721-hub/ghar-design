import React, { useState, useEffect, useMemo } from 'react';
import { formatINR, formatDate } from '../../lib/utils.js';
import { useToast } from '../../context/ToastContext.js';
import { Badge } from '../../components/common/Badge.js';
import { Link, useSearchParams } from 'react-router-dom';
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
  Sliders,
  ChevronDown,
  User,
  RefreshCw,
  FileCheck2,
  DollarSign,
  Download,
  Receipt,
  Copy,
  Send,
  History,
  Clock,
  UserCheck,
  Banknote,
  HelpCircle,
  ArrowRight,
} from 'lucide-react';
import {
  getArchitectPayouts,
  saveArchitectPayout,
  approveArchitectPayout,
  disburseArchitectPayout,
  holdArchitectPayout,
  reconcileArchitectPayout,
  retryFailedArchitectPayout,
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

export type PayoutSubView =
  | 'PENDING_PAYOUTS'
  | 'ELIGIBLE'
  | 'APPROVAL_QUEUE'
  | 'PROCESS_PAYMENT'
  | 'SUCCESSFUL_PAYOUTS'
  | 'FAILED_PAYOUTS'
  | 'PAYOUT_HISTORY'
  | 'ARCHITECT_EARNINGS'
  | 'COMMISSION_FEES'
  | 'PAYOUT_RECONCILIATION';

interface SubViewConfig {
  id: PayoutSubView;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
  badgeColor: string;
  description: string;
}

const SUB_VIEWS: SubViewConfig[] = [
  {
    id: 'PENDING_PAYOUTS',
    label: '1. Pending Architect Payouts',
    shortLabel: 'Pending Payouts',
    icon: Clock,
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    description: 'All pending partner liabilities across approval, processing, and verification queues.',
  },
  {
    id: 'ELIGIBLE',
    label: '2. Eligible for Payout',
    shortLabel: 'Eligible Payouts',
    icon: ArrowUpRight,
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    description: 'Milestones with cleared customer escrow receipt & client sign-off eligible for bank transfer.',
  },
  {
    id: 'APPROVAL_QUEUE',
    label: '3. Payout Approval',
    shortLabel: 'Approval Queue',
    icon: ShieldCheck,
    badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    description: 'Dual-control finance audit gate verifying milestone deliverables, 10% platform fee, and 1% TDS.',
  },
  {
    id: 'PROCESS_PAYMENT',
    label: '4. Process Architect Payment',
    shortLabel: 'Process Payment',
    icon: Banknote,
    badgeColor: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    description: 'Batch disbursement desk for releasing escrow funds via NEFT/RTGS bank transfer with UTR entry.',
  },
  {
    id: 'SUCCESSFUL_PAYOUTS',
    label: '5. Successful Payouts',
    shortLabel: 'Successful Payouts',
    icon: CheckCircle2,
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    description: 'Completed bank transfers with bank UTR numbers, settlement advice vouchers, and tax invoices.',
  },
  {
    id: 'FAILED_PAYOUTS',
    label: '6. Failed Payouts',
    shortLabel: 'Failed / Held',
    icon: AlertTriangle,
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
    description: 'Payouts on hold or returned due to bank IFSC changes, drawing defects, or customer disputes.',
  },
  {
    id: 'PAYOUT_HISTORY',
    label: '7. Payout History',
    shortLabel: 'Payout History',
    icon: History,
    badgeColor: 'bg-slate-100 text-slate-800 border-slate-200',
    description: 'Master chronological audit ledger of all disbursements, TDS deductions, and escrow releases.',
  },
  {
    id: 'ARCHITECT_EARNINGS',
    label: '8. Architect Earnings',
    shortLabel: 'Architect Earnings',
    icon: UserCheck,
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    description: 'Partner-level ledger summarizing lifetime earnings, platform commission, TDS, and net paid.',
  },
  {
    id: 'COMMISSION_FEES',
    label: '9. Commission & Platform Fees',
    shortLabel: 'Platform Commission',
    icon: BadgePercent,
    badgeColor: 'bg-violet-100 text-violet-800 border-violet-200',
    description: 'BuildGhar platform revenue breakdown (10% fee) and Section 194M/194C TDS remittance log.',
  },
  {
    id: 'PAYOUT_RECONCILIATION',
    label: '10. Payout Reconciliation',
    shortLabel: 'BRS Reconciliation',
    icon: RefreshCw,
    badgeColor: 'bg-teal-100 text-teal-800 border-teal-200',
    description: 'Automated Bank Reconciliation Statement matching platform disbursements with HDFC Escrow statement.',
  },
];

export const AdminPayouts: React.FC = () => {
  const { success, error } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedView = (searchParams.get('view') as PayoutSubView) || 'PENDING_PAYOUTS';
  const handleSelectView = (view: PayoutSubView) => {
    setSearchParams({ view });
  };

  const [discipline, setDiscipline] = useState<'ARCHITECT' | 'INTERIOR'>('ARCHITECT');
  const [payouts, setPayouts] = useState<ArchitectPayoutItem[]>([]);
  const [interiorPayouts, setInteriorPayouts] = useState<InteriorPayoutRequest[]>(() => getInteriorPayouts());
  const [selectedInteriorPayout, setSelectedInteriorPayout] = useState<InteriorPayoutRequest | null>(null);
  const [isInteriorDisburseModalOpen, setIsInteriorDisburseModalOpen] = useState(false);
  const [isInteriorHoldModalOpen, setIsInteriorHoldModalOpen] = useState(false);
  const [interiorUtr, setInteriorUtr] = useState('');
  const [interiorHoldReason, setInteriorHoldReason] = useState('');
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

  // Aggregate Metrics
  const stats = useMemo(() => {
    const paidList = payouts.filter((p) => p.status === 'PAID');
    const totalDisbursed = paidList.reduce((sum, p) => sum + p.netPayablePaise, 0);

    const eligibleList = payouts.filter((p) => p.status === 'ELIGIBLE');
    const totalEligible = eligibleList.reduce((sum, p) => sum + p.netPayablePaise, 0);

    const processingList = payouts.filter((p) => p.status === 'PROCESSING');
    const totalProcessing = processingList.reduce((sum, p) => sum + p.netPayablePaise, 0);

    const totalGross = payouts.reduce((sum, p) => sum + p.grossCollectedPaise, 0);
    const totalCommission = payouts.reduce((sum, p) => sum + p.platformCommissionPaise, 0);
    const totalTds = payouts.reduce((sum, p) => sum + p.tdsDeductionPaise, 0);

    const heldList = payouts.filter((p) => p.status === 'HELD' || p.status === 'REJECTED');
    const matchedReconciled = payouts.filter((p) => p.status === 'PAID' && p.reconciliationStatus === 'MATCHED');

    return {
      totalDisbursed,
      paidCount: paidList.length,
      totalEligible,
      eligibleCount: eligibleList.length,
      totalProcessing,
      processingCount: processingList.length,
      totalGross,
      totalCommission,
      totalTds,
      heldCount: heldList.length,
      matchedReconciledCount: matchedReconciled.length,
    };
  }, [payouts]);

  // Grouped Architect Earnings
  const architectEarningsList = useMemo(() => {
    const map = new Map<string, {
      architectId: string;
      architectName: string;
      architectFirm: string;
      architectPhone: string;
      bankName: string;
      accountNumberMasked: string;
      milestonesCount: number;
      grossPaise: number;
      commissionPaise: number;
      tdsPaise: number;
      paidPaise: number;
      pendingPaise: number;
    }>();

    payouts.forEach((p) => {
      const key = p.architectId || p.architectName;
      const existing = map.get(key) || {
        architectId: p.architectId,
        architectName: p.architectName,
        architectFirm: p.architectFirm,
        architectPhone: p.architectPhone,
        bankName: p.bankName || 'HDFC Bank',
        accountNumberMasked: p.accountNumberMasked || '•••• •••• 4912',
        milestonesCount: 0,
        grossPaise: 0,
        commissionPaise: 0,
        tdsPaise: 0,
        paidPaise: 0,
        pendingPaise: 0,
      };

      existing.milestonesCount += 1;
      existing.grossPaise += p.grossCollectedPaise;
      existing.commissionPaise += p.platformCommissionPaise;
      existing.tdsPaise += p.tdsDeductionPaise;

      if (p.status === 'PAID') {
        existing.paidPaise += p.netPayablePaise;
      } else {
        existing.pendingPaise += p.netPayablePaise;
      }

      map.set(key, existing);
    });

    return Array.from(map.values());
  }, [payouts]);

  // Counts for each of the 10 views
  const subCounts = useMemo(() => {
    return {
      PENDING_PAYOUTS: payouts.filter((p) => p.status !== 'PAID').length,
      ELIGIBLE: payouts.filter((p) => p.status === 'ELIGIBLE').length,
      APPROVAL_QUEUE: payouts.filter((p) => p.status === 'PENDING_APPROVAL' || p.status === 'ELIGIBLE').length,
      PROCESS_PAYMENT: payouts.filter((p) => p.status === 'PROCESSING').length,
      SUCCESSFUL_PAYOUTS: payouts.filter((p) => p.status === 'PAID').length,
      FAILED_PAYOUTS: payouts.filter((p) => p.status === 'HELD' || p.status === 'REJECTED').length,
      PAYOUT_HISTORY: payouts.length,
      ARCHITECT_EARNINGS: architectEarningsList.length,
      COMMISSION_FEES: formatINR(stats.totalCommission),
      PAYOUT_RECONCILIATION: `${stats.matchedReconciledCount}/${stats.paidCount}`,
    };
  }, [payouts, architectEarningsList, stats]);

  // Filtered Payouts based on Sub-View
  const viewFilteredPayouts = useMemo(() => {
    let list = payouts;

    switch (selectedView) {
      case 'PENDING_PAYOUTS':
        list = payouts.filter((p) => p.status !== 'PAID');
        break;
      case 'ELIGIBLE':
        list = payouts.filter((p) => p.status === 'ELIGIBLE');
        break;
      case 'APPROVAL_QUEUE':
        list = payouts.filter((p) => p.status === 'PENDING_APPROVAL' || p.status === 'ELIGIBLE');
        break;
      case 'PROCESS_PAYMENT':
        list = payouts.filter((p) => p.status === 'PROCESSING');
        break;
      case 'SUCCESSFUL_PAYOUTS':
        list = payouts.filter((p) => p.status === 'PAID');
        break;
      case 'FAILED_PAYOUTS':
        list = payouts.filter((p) => p.status === 'HELD' || p.status === 'REJECTED');
        break;
      case 'PAYOUT_HISTORY':
      case 'ARCHITECT_EARNINGS':
      case 'COMMISSION_FEES':
      case 'PAYOUT_RECONCILIATION':
      default:
        list = payouts;
        break;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((p) => {
        const matchCode = p.payoutCode.toLowerCase().includes(q);
        const matchArc = p.architectName.toLowerCase().includes(q) || p.architectFirm.toLowerCase().includes(q);
        const matchProj = p.projectId.toLowerCase().includes(q) || p.projectTitle.toLowerCase().includes(q);
        const matchUTR = (p.utrNumber || '').toLowerCase().includes(q);
        return matchCode || matchArc || matchProj || matchUTR;
      });
    }

    return list;
  }, [payouts, selectedView, searchQuery]);

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

  const handleApprovePayout = (payout: ArchitectPayoutItem) => {
    try {
      const updated = approveArchitectPayout(payout.id, {
        approvedBy: 'Super Admin (Audit Desk)',
        notes: 'Dual-control audit verification passed. Milestone deliverables verified for bank NEFT transfer.',
      });

      if (updated) {
        logAdminAuditAction({
          action: 'PAYOUT_APPROVED',
          targetType: 'PAYOUT',
          targetId: updated.payoutCode,
          description: `Approved payout ${updated.payoutCode} for ${updated.architectName} (${updated.architectFirm}) to PROCESSING state.`,
        });
        success(`Payout ${updated.payoutCode} approved! Moved to Processing Queue.`);
        loadData();
      }
    } catch (err: any) {
      error(err.message || 'Failed to approve payout');
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
      failureReason: undefined,
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

  const handleRetryFailedPayout = (payout: ArchitectPayoutItem) => {
    try {
      const updated = retryFailedArchitectPayout(payout.id);
      if (updated) {
        logAdminAuditAction({
          action: 'PAYOUT_RETRY',
          targetType: 'PAYOUT',
          targetId: updated.payoutCode,
          description: `Cleared hold and retried payout for ${updated.architectName}. Status reset to ELIGIBLE.`,
        });
        success(`Payout ${updated.payoutCode} cleared from hold! Moved to Eligible for Transfer.`);
        loadData();
      }
    } catch (err: any) {
      error(err.message || 'Failed to retry payout');
    }
  };

  const handleReconcilePayout = (payout: ArchitectPayoutItem) => {
    try {
      const updated = reconcileArchitectPayout(payout.id);
      if (updated) {
        success(`Payout ${updated.payoutCode} matched & reconciled with HDFC Escrow Statement!`);
        loadData();
      }
    } catch (err: any) {
      error(err.message || 'Failed to reconcile payout');
    }
  };

  const handleRunAutoReconciliation = () => {
    try {
      let count = 0;
      payouts.forEach((p) => {
        if (p.status === 'PAID' && p.reconciliationStatus !== 'MATCHED') {
          reconcileArchitectPayout(p.id);
          count += 1;
        }
      });
      if (count > 0) {
        success(`Auto-Reconciliation Complete: ${count} cleared escrow disbursement(s) matched with bank ledger.`);
      } else {
        success('All cleared escrow payouts are already 100% matched with bank statements.');
      }
      loadData();
    } catch (err: any) {
      error(err.message || 'Failed to run auto-reconciliation');
    }
  };

  const handleSendEarningsStatement = (architectName: string, firm: string) => {
    success(`Monthly Partner Earnings Statement & Form 16A dispatched to ${architectName} (${firm}) via Email & WhatsApp.`);
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

  const activeSubViewConfig = SUB_VIEWS.find((s) => s.id === selectedView) || SUB_VIEWS[0];

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold font-display text-navy-950">
              11. Architect Payout Management
            </h1>
            <Badge variant="blue" className="text-[10px] uppercase font-bold tracking-wider">
              Escrow Governance
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

          {/* Top-Level Dropdown View Switcher & 10 Sub-Feature Strip */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Architect Payout Sub-Module Switcher:
                </span>
              </div>
              <div className="relative min-w-[280px]">
                <select
                  value={selectedView}
                  onChange={(e) => handleSelectView(e.target.value as PayoutSubView)}
                  className="w-full appearance-none pl-3.5 pr-8 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {SUB_VIEWS.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.label} ({subCounts[v.id]})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* 10-Pill Action Strip */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
              {SUB_VIEWS.map((v) => {
                const Icon = v.icon;
                const isActive = selectedView === v.id;
                const count = subCounts[v.id];

                return (
                  <button
                    key={v.id}
                    onClick={() => handleSelectView(v.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap border shrink-0 ${
                      isActive
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                    <span>{v.shortLabel}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Contextual Feature Header Banner */}
          <div className="bg-gradient-to-r from-navy-950 via-slate-900 to-navy-900 rounded-2xl p-4 text-white shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <activeSubViewConfig.icon className="w-4 h-4 text-blue-400" />
                <h2 className="text-sm font-bold tracking-tight text-white">
                  {activeSubViewConfig.label}
                </h2>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${activeSubViewConfig.badgeColor}`}>
                  Active View
                </span>
              </div>
              <p className="text-xs text-slate-300">
                {activeSubViewConfig.description}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {selectedView === 'PAYOUT_RECONCILIATION' && (
                <button
                  onClick={handleRunAutoReconciliation}
                  className="px-3.5 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-navy-950 text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Auto-Reconcile Cleared Escrow</span>
                </button>
              )}

              {selectedView === 'COMMISSION_FEES' && (
                <button
                  onClick={() => success('Form 26Q TDS Remittance Ledger & Platform Commission Report downloaded.')}
                  className="px-3.5 py-1.5 rounded-xl bg-purple-500 hover:bg-purple-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download TDS & Fee Ledger</span>
                </button>
              )}

              {selectedView === 'APPROVAL_QUEUE' && (
                <div className="text-[11px] font-medium text-indigo-200 bg-white/10 px-3 py-1 rounded-xl">
                  Dual-Control Audit Gate: Requires Admin Approval before NEFT
                </div>
              )}

              {selectedView === 'PROCESS_PAYMENT' && (
                <div className="text-[11px] font-medium text-cyan-200 bg-white/10 px-3 py-1 rounded-xl">
                  Direct Escrow Batch Disbursement Mode
                </div>
              )}
            </div>
          </div>

          {/* Search Bar for Table/List Views */}
          {selectedView !== 'ARCHITECT_EARNINGS' && (
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
              <div className="text-xs text-slate-500 font-medium">
                Showing <span className="font-bold text-slate-800">{viewFilteredPayouts.length}</span> records
              </div>
            </div>
          )}

          {/* ============================================================================== */}
          {/* SPECIALIZED VIEW 8: ARCHITECT EARNINGS (PARTNER LEDGER) */}
          {/* ============================================================================== */}
          {selectedView === 'ARCHITECT_EARNINGS' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {architectEarningsList.map((arch) => (
                  <div
                    key={arch.architectId || arch.architectName}
                    className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-4 hover:border-purple-300 transition"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Compass className="w-4 h-4 text-purple-600" />
                          <h3 className="font-bold text-navy-950 text-base">{arch.architectName}</h3>
                          <Badge variant="blue" className="text-[10px]">
                            {arch.milestonesCount} Milestones
                          </Badge>
                        </div>
                        <p className="text-xs font-medium text-slate-600 mt-0.5">{arch.architectFirm}</p>
                        <p className="text-[11px] text-slate-400">{arch.architectPhone}</p>
                      </div>

                      <button
                        onClick={() => handleSendEarningsStatement(arch.architectName, arch.architectFirm)}
                        className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold border border-purple-200 flex items-center gap-1.5 transition"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Send Statement</span>
                      </button>
                    </div>

                    {/* Financial Summary Grid */}
                    <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Gross Billed</span>
                        <div className="font-bold text-slate-800 font-mono mt-0.5">{formatINR(arch.grossPaise)}</div>
                      </div>
                      <div>
                        <span className="text-[10px] text-purple-700 font-bold uppercase tracking-wider">BuildGhar (10%)</span>
                        <div className="font-bold text-purple-700 font-mono mt-0.5">-{formatINR(arch.commissionPaise)}</div>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">TDS (1%)</span>
                        <div className="font-bold text-slate-600 font-mono mt-0.5">-{formatINR(arch.tdsPaise)}</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                      <div>
                        <span className="text-[10px] text-emerald-700 font-bold uppercase">Net Disbursed (Paid)</span>
                        <div className="font-bold text-emerald-700 font-display text-base">
                          {formatINR(arch.paidPaise)}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-amber-700 font-bold uppercase">In-Flight / Pending</span>
                        <div className="font-bold text-amber-800 font-display text-base">
                          {formatINR(arch.pendingPaise)}
                        </div>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-500 font-mono bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 flex items-center justify-between">
                      <span>Registered Escrow Beneficiary Bank:</span>
                      <span className="font-bold text-slate-700">{arch.bankName} ({arch.accountNumberMasked})</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ============================================================================== */}
          {/* SPECIALIZED VIEW 9: COMMISSION & PLATFORM FEES */}
          {/* ============================================================================== */}
          {selectedView === 'COMMISSION_FEES' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-white rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-50/50 to-indigo-50/20 shadow-2xs space-y-1">
                  <span className="text-xs font-semibold text-purple-800">Total Platform Commission (10%)</span>
                  <div className="text-2xl font-bold text-purple-950 font-display">
                    {formatINR(stats.totalCommission)}
                  </div>
                  <div className="text-[11px] text-purple-700 font-medium">
                    10% take-rate retained across architectural projects
                  </div>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                  <span className="text-xs font-semibold text-slate-600">Total TDS Withheld (1% Sec 194M/C)</span>
                  <div className="text-2xl font-bold text-slate-900 font-display">
                    {formatINR(stats.totalTds)}
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">
                    Remitted to IT Dept under BuildGhar PAN AAACB2489C
                  </div>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                  <span className="text-xs font-semibold text-slate-600">Total Gross Turnover Processed</span>
                  <div className="text-2xl font-bold text-navy-950 font-display">
                    {formatINR(stats.totalGross)}
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">
                    Escrow contractual billing volume
                  </div>
                </div>
              </div>

              {/* Commission Ledger Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-navy-950">Platform Revenue & Statutory TDS Audit Ledger</h3>
                    <p className="text-xs text-slate-500">Breakdown of 10% platform facilitation fee and 1% TDS per milestone</p>
                  </div>
                  <Badge variant="purple" className="text-xs font-bold">
                    Section 16 Compliant
                  </Badge>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="py-3 px-4">Disbursement Code</th>
                        <th className="py-3 px-4">Partner Firm</th>
                        <th className="py-3 px-4">Project & Milestone</th>
                        <th className="py-3 px-4 text-right">Gross Milestone (₹)</th>
                        <th className="py-3 px-4 text-right font-bold text-purple-700">Platform 10% (₹)</th>
                        <th className="py-3 px-4 text-right">TDS 1% (₹)</th>
                        <th className="py-3 px-4 text-right">Partner Net (₹)</th>
                        <th className="py-3 px-4 text-center">Settlement Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {payouts.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-3 px-4 font-mono font-bold text-slate-900">{p.payoutCode}</td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-navy-950">{p.architectFirm}</div>
                            <div className="text-[10px] text-slate-400">{p.architectName}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-medium text-blue-700 truncate max-w-xs">{p.projectTitle}</div>
                            <div className="text-[10px] text-slate-500">{p.milestoneTitle}</div>
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-slate-700">
                            {formatINR(p.grossCollectedPaise)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-purple-700">
                            +{formatINR(p.platformCommissionPaise)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-slate-600">
                            {formatINR(p.tdsDeductionPaise)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                            {formatINR(p.netPayablePaise)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                p.status === 'PAID'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              {p.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================================== */}
          {/* SPECIALIZED VIEW 10: PAYOUT RECONCILIATION (ESCROW BRS) */}
          {/* ============================================================================== */}
          {selectedView === 'PAYOUT_RECONCILIATION' && (
            <div className="space-y-4">
              <div className="p-4 bg-teal-50 border border-teal-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-teal-700" />
                    <h3 className="font-bold text-teal-950 text-sm">Escrow Bank Reconciliation Statement (BRS)</h3>
                  </div>
                  <p className="text-xs text-teal-800 mt-0.5">
                    Matching BuildGhar NEFT Escrow disbursements against HDFC Bank Escrow Statement (A/c #50200084920192).
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs font-bold text-teal-950">
                      {stats.matchedReconciledCount} of {stats.paidCount} Matched
                    </div>
                    <div className="text-[10px] text-teal-700">100% Audit Verified</div>
                  </div>
                  <button
                    onClick={handleRunAutoReconciliation}
                    className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition"
                  >
                    Run Auto-Match
                  </button>
                </div>
              </div>

              {/* BRS Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="py-3 px-4">Payout Code</th>
                        <th className="py-3 px-4">Partner Firm</th>
                        <th className="py-3 px-4">Disbursed Net Amount</th>
                        <th className="py-3 px-4">Bank UTR Transaction Ref</th>
                        <th className="py-3 px-4 text-center">Disbursed Date</th>
                        <th className="py-3 px-4 text-center">BRS Status</th>
                        <th className="py-3 px-4 text-right">Reconciliation Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {payouts
                        .filter((p) => p.status === 'PAID')
                        .map((p) => (
                          <tr key={p.id} className="hover:bg-slate-50/80 transition">
                            <td className="py-3 px-4 font-mono font-bold text-slate-900">{p.payoutCode}</td>
                            <td className="py-3 px-4">
                              <div className="font-semibold text-navy-950">{p.architectFirm}</div>
                              <div className="text-[10px] text-slate-400">{p.bankName}</div>
                            </td>
                            <td className="py-3 px-4 font-mono font-bold text-emerald-700">
                              {formatINR(p.netPayablePaise)}
                            </td>
                            <td className="py-3 px-4 font-mono text-[11px] text-slate-800">
                              {p.utrNumber || 'Pending Gateway Sync'}
                            </td>
                            <td className="py-3 px-4 text-center text-slate-500">
                              {p.paidAt ? formatDate(p.paidAt) : formatDate(p.createdAt)}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {p.reconciliationStatus === 'MATCHED' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Matched</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                  <Clock className="w-3 h-3" />
                                  <span>Pending Match</span>
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              {p.reconciliationStatus === 'MATCHED' ? (
                                <span className="text-[11px] font-bold text-slate-400">Reconciled</span>
                              ) : (
                                <button
                                  onClick={() => handleReconcilePayout(p)}
                                  className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-[11px] shadow-2xs transition"
                                >
                                  Match UTR
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================================== */}
          {/* GENERAL PAYOUTS TABLE FOR STANDARD SUB-VIEWS */}
          {/* ============================================================================== */}
          {selectedView !== 'ARCHITECT_EARNINGS' &&
            selectedView !== 'COMMISSION_FEES' &&
            selectedView !== 'PAYOUT_RECONCILIATION' && (
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
                      {viewFilteredPayouts.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-12 text-center text-slate-400">
                            <CreditCard className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                            <p className="font-semibold text-sm">No architect payout records match criteria</p>
                          </td>
                        </tr>
                      ) : (
                        viewFilteredPayouts.map((p) => (
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
                              {p.status === 'PENDING_APPROVAL' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                  <ShieldCheck className="w-3 h-3 text-indigo-600" />
                                  <span>Pending Approval</span>
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
                              {p.status === 'REJECTED' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                                  <X className="w-3 h-3 text-rose-700" />
                                  <span>Rejected</span>
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

                                {/* Direct Approval Action for Approval Queue */}
                                {p.status === 'PENDING_APPROVAL' && (
                                  <button
                                    onClick={() => handleApprovePayout(p)}
                                    title="Audit Sign-off & Approve for NEFT"
                                    className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-2xs transition"
                                  >
                                    <ShieldCheck className="w-3 h-3" />
                                    <span>Approve</span>
                                  </button>
                                )}

                                {/* Direct Disburse Action */}
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

                                {/* Release/Retry Action for Failed/Held */}
                                {(p.status === 'HELD' || p.status === 'REJECTED') && (
                                  <button
                                    onClick={() => handleRetryFailedPayout(p)}
                                    title="Clear snag & retry payout"
                                    className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-2xs transition"
                                  >
                                    <RotateCcw className="w-3 h-3" />
                                    <span>Retry</span>
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
            )}
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
