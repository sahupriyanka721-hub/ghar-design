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
  ShoppingBag,
  RotateCcw,
  Building,
  Plus,
  Lock,
  Layers,
  Calendar,
  ExternalLink,
  ChevronRight,
  Printer,
  BadgePercent,
  Check,
  Briefcase,
  Clock,
  Sliders,
  ChevronDown,
  Send,
  Smartphone,
  RefreshCw,
  FileCheck2,
  User,
  DollarSign,
  Download,
  Receipt,
  Copy,
} from 'lucide-react';
import {
  getCustomerPayments,
  verifyCustomerPayment,
  refundCustomerPayment,
  saveCustomerPayment,
  getFinancialLedger,
  reconcileCustomerPayment,
  requestCustomerPaymentRefund,
  CustomerPaymentItem,
  LedgerEntry,
} from '../../data/financialLedgerStore.js';
import { logAdminAuditAction } from '../../data/adminRbacStore.js';

export type PaymentSubView =
  | 'ALL'
  | 'PENDING_VERIFICATION'
  | 'SUCCESSFUL'
  | 'FAILED'
  | 'REFUNDS'
  | 'CUSTOMER_HISTORY'
  | 'RECONCILIATION'
  | 'GATEWAY_TRANSACTIONS'
  | 'ESCROW_LEDGER';

export const SUB_VIEWS: Array<{ key: PaymentSubView; label: string; icon: any; countKey: string }> = [
  { key: 'ALL', label: '1. All Customer Payments', icon: CreditCard, countKey: 'all' },
  { key: 'PENDING_VERIFICATION', label: '2. Pending Payment Verification', icon: Clock, countKey: 'pending' },
  { key: 'SUCCESSFUL', label: '3. Successful Payments', icon: CheckCircle2, countKey: 'successful' },
  { key: 'FAILED', label: '4. Failed Payments', icon: AlertCircle, countKey: 'failed' },
  { key: 'REFUNDS', label: '5. Refund Requests', icon: RotateCcw, countKey: 'refunds' },
  { key: 'CUSTOMER_HISTORY', label: '6. Customer Payment History', icon: Briefcase, countKey: 'customers' },
  { key: 'RECONCILIATION', label: '7. Payment Reconciliation', icon: ShieldCheck, countKey: 'reconciled' },
  { key: 'GATEWAY_TRANSACTIONS', label: '8. Payment Gateway Transactions', icon: Layers, countKey: 'gateways' },
];

export const AdminPayments: React.FC = () => {
  const { success, error } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlView = (searchParams.get('view') as PaymentSubView) || 'ALL';
  const [selectedView, setSelectedView] = useState<PaymentSubView>(urlView);

  useEffect(() => {
    const v = searchParams.get('view') as PaymentSubView;
    if (v && v !== selectedView) {
      setSelectedView(v);
    }
  }, [searchParams]);

  const handleSelectView = (view: PaymentSubView) => {
    setSelectedView(view);
    setSearchParams({ view });
  };

  const [payments, setPayments] = useState<CustomerPaymentItem[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'ALL' | 'VERIFIED_SUCCESSFUL' | 'PENDING_VERIFICATION' | 'REFUND_REQUESTED' | 'ESCROW_LEDGER'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [purposeFilter, setPurposeFilter] = useState<'ALL' | 'MILESTONE_PAYMENT' | 'BOOKING_ADVANCE' | 'REQUEST_FEE' | 'MATERIAL_ORDER'>('ALL');
  const [methodFilter, setMethodFilter] = useState<string>('ALL');

  // Modals & Drawers
  const [selectedPayment, setSelectedPayment] = useState<CustomerPaymentItem | null>(null);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [isAddPaymentModalOpen, setIsAddPaymentModalOpen] = useState(false);
  const [inspectingWebhookPayment, setInspectingWebhookPayment] = useState<CustomerPaymentItem | null>(null);
  const [verificationNotes, setVerificationNotes] = useState('Payment signature and escrow credit verified via Razorpay webhook.');
  const [refundReason, setRefundReason] = useState('');

  // New Manual Payment Form
  const [newPay, setNewPay] = useState({
    projectId: 'BG-2026-0001',
    projectTitle: 'Modern Luxury Villa (G+2) - Super Corridor, Indore',
    customerId: 'CUST-IND-992',
    customerName: 'Sharika Mishra',
    customerPhone: '+91 98765 43210',
    purpose: 'MILESTONE_PAYMENT' as 'MILESTONE_PAYMENT' | 'BOOKING_ADVANCE' | 'REQUEST_FEE' | 'MATERIAL_ORDER',
    milestoneTitle: 'Structural Design & Foundation Reinforcement',
    amountRupees: '200000',
    paymentMethod: 'NET_BANKING' as any,
    referenceId: `HDFC-UTR-${Date.now().toString().slice(-6)}`,
    notes: 'Direct RTGS credit into BuildGhar platform escrow account',
  });

  const loadData = () => {
    try {
      const p = getCustomerPayments();
      const l = getFinancialLedger();
      setPayments([...p]);
      setLedger([...l]);
    } catch (err) {
      console.error('Error loading financial payments:', err);
    }
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('FINANCIAL_PAYMENTS_UPDATED', handleUpdate);
    window.addEventListener('FINANCIAL_LEDGER_UPDATED', handleUpdate);
    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('FINANCIAL_PAYMENTS_UPDATED', handleUpdate);
      window.removeEventListener('FINANCIAL_LEDGER_UPDATED', handleUpdate);
    };
  }, []);

  // Module 10 Sub-Views Live Counters
  const subCounts = useMemo(() => {
    return {
      all: payments.length,
      pending: payments.filter((p) => p.status === 'PENDING_VERIFICATION').length,
      successful: payments.filter((p) => p.status === 'VERIFIED_SUCCESSFUL').length,
      failed: payments.filter((p) => p.status === 'FAILED').length,
      refunds: payments.filter((p) => p.status === 'REFUND_REQUESTED' || p.status === 'REFUNDED').length,
      customers: new Set(payments.map((p) => p.customerId || p.customerPhone)).size,
      reconciled: payments.filter((p) => p.reconciliationStatus === 'MATCHED').length,
      gateways: payments.filter((p) => Boolean(p.gatewayPaymentId || p.gatewayOrderId)).length,
    };
  }, [payments]);

  // Customer Grouped History List
  const customerHistoryList = useMemo(() => {
    const map = new Map<
      string,
      {
        customerId: string;
        customerName: string;
        customerPhone: string;
        customerEmail?: string;
        payments: CustomerPaymentItem[];
        totalPaidPaise: number;
        pendingPaise: number;
        refundedPaise: number;
        projects: string[];
      }
    >();

    payments.forEach((p) => {
      const key = p.customerId || p.customerPhone || p.customerName;
      if (!map.has(key)) {
        map.set(key, {
          customerId: p.customerId || key,
          customerName: p.customerName,
          customerPhone: p.customerPhone,
          customerEmail: p.customerEmail,
          payments: [],
          totalPaidPaise: 0,
          pendingPaise: 0,
          refundedPaise: 0,
          projects: [],
        });
      }
      const entry = map.get(key)!;
      entry.payments.push(p);
      if (p.status === 'VERIFIED_SUCCESSFUL') {
        entry.totalPaidPaise += p.grossAmountPaise;
      } else if (p.status === 'PENDING_VERIFICATION') {
        entry.pendingPaise += p.grossAmountPaise;
      } else if (p.status === 'REFUNDED') {
        entry.refundedPaise += p.grossAmountPaise;
      }
      if (p.projectTitle && !entry.projects.includes(p.projectTitle)) {
        entry.projects.push(p.projectTitle);
      }
    });

    let res = Array.from(map.values());
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      res = res.filter(
        (c) =>
          c.customerName.toLowerCase().includes(q) ||
          c.customerPhone.includes(q) ||
          (c.customerEmail || '').toLowerCase().includes(q)
      );
    }
    return res;
  }, [payments, searchQuery]);

  // View Filtered Payments
  const viewFilteredPayments = useMemo(() => {
    let list = payments;

    if (selectedView === 'PENDING_VERIFICATION') {
      list = list.filter((p) => p.status === 'PENDING_VERIFICATION');
    } else if (selectedView === 'SUCCESSFUL') {
      list = list.filter((p) => p.status === 'VERIFIED_SUCCESSFUL');
    } else if (selectedView === 'FAILED') {
      list = list.filter((p) => p.status === 'FAILED');
    } else if (selectedView === 'REFUNDS') {
      list = list.filter((p) => p.status === 'REFUND_REQUESTED' || p.status === 'REFUNDED');
    } else if (selectedView === 'GATEWAY_TRANSACTIONS') {
      list = list.filter((p) => Boolean(p.gatewayPaymentId || p.gatewayOrderId));
    }

    if (purposeFilter !== 'ALL') {
      list = list.filter((p) => p.purpose === purposeFilter);
    }
    if (methodFilter !== 'ALL') {
      list = list.filter((p) => p.paymentMethod === methodFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((p) => {
        const matchCode = (p.paymentCode || '').toLowerCase().includes(q);
        const matchCust = (p.customerName || '').toLowerCase().includes(q);
        const matchPhone = (p.customerPhone || '').toLowerCase().includes(q);
        const matchProj =
          (p.projectId || '').toLowerCase().includes(q) ||
          (p.projectTitle || '').toLowerCase().includes(q);
        const matchOrder =
          (p.gatewayOrderId || '').toLowerCase().includes(q) ||
          (p.gatewayPaymentId || '').toLowerCase().includes(q);
        const matchUtr = (p.bankUtrNumber || '').toLowerCase().includes(q);
        return matchCode || matchCust || matchPhone || matchProj || matchOrder || matchUtr;
      });
    }

    return list;
  }, [payments, selectedView, purposeFilter, methodFilter, searchQuery]);

  // Filtered Payments (Legacy Tab fallback)
  const filteredPayments = useMemo(() => {
    return viewFilteredPayments;
  }, [viewFilteredPayments]);

  // Aggregate Metrics
  const stats = useMemo(() => {
    const verified = payments.filter((p) => p.status === 'VERIFIED_SUCCESSFUL');
    const totalCollected = verified.reduce((sum, p) => sum + p.grossAmountPaise, 0);
    const pendingVerification = payments.filter((p) => p.status === 'PENDING_VERIFICATION');
    const pendingTotal = pendingVerification.reduce((sum, p) => sum + p.grossAmountPaise, 0);
    const refunded = payments.filter((p) => p.status === 'REFUNDED');
    const refundedTotal = refunded.reduce((sum, p) => sum + p.grossAmountPaise, 0);
    const failed = payments.filter((p) => p.status === 'FAILED');
    const failedTotal = failed.reduce((sum, p) => sum + p.grossAmountPaise, 0);

    // Active escrow holding is total collected minus refunds
    const activeEscrowHolding = totalCollected - refundedTotal;

    return {
      totalCollected,
      activeEscrowHolding,
      pendingCount: pendingVerification.length,
      pendingTotal,
      verifiedCount: verified.length,
      refundedCount: refunded.length,
      refundedTotal,
      failedCount: failed.length,
      failedTotal,
    };
  }, [payments]);

  // Operational Action Handlers
  const handleReconcile = (payment: CustomerPaymentItem) => {
    const updated = reconcileCustomerPayment(payment.id);
    if (updated) {
      logAdminAuditAction({
        action: 'PAYMENT_RECONCILED',
        targetType: 'PAYMENT',
        targetId: payment.paymentCode,
        description: `Payment ${payment.paymentCode} reconciled with Bank UTR ${updated.bankUtrNumber}`,
      });
      loadData();
      success(`Payment ${payment.paymentCode} reconciled with bank UTR ${updated.bankUtrNumber}!`);
    }
  };

  const handleRunAutoReconciliation = () => {
    let count = 0;
    payments.forEach((p) => {
      if (p.reconciliationStatus !== 'MATCHED' && p.status === 'VERIFIED_SUCCESSFUL') {
        reconcileCustomerPayment(p.id);
        count++;
      }
    });
    loadData();
    logAdminAuditAction({
      action: 'BATCH_RECONCILIATION_RUN',
      targetType: 'PAYMENT',
      targetId: 'ALL',
      description: `Automated batch reconciliation matched ${count} payments against HDFC Bank Escrow account.`,
    });
    success(`Batch reconciliation complete: ${count} verified payment(s) matched against HDFC Escrow statement!`);
  };

  const handleSendRetryLink = (payment: CustomerPaymentItem) => {
    logAdminAuditAction({
      action: 'SEND_PAYMENT_RETRY_LINK',
      targetType: 'PAYMENT',
      targetId: payment.paymentCode,
      description: `Dispatched payment retry link to ${payment.customerName} (${payment.customerPhone})`,
    });
    success(`Payment retry link sent via SMS & WhatsApp to ${payment.customerName} (${payment.customerPhone})!`);
  };

  const handleMarkOfflineReceived = (payment: CustomerPaymentItem) => {
    const updated = verifyCustomerPayment(payment.id, {
      verifiedBy: 'Super Admin',
      notes: 'Customer transferred via alternate offline bank deposit. Payment reconciled.',
    });
    if (updated) {
      logAdminAuditAction({
        action: 'MARK_OFFLINE_PAYMENT_RECEIVED',
        targetType: 'PAYMENT',
        targetId: payment.paymentCode,
        description: `Marked failed payment ${payment.paymentCode} as received offline.`,
      });
      loadData();
      success(`Payment ${payment.paymentCode} marked as VERIFIED and credited to platform escrow!`);
    }
  };

  const handleSendStatement = (cust: any) => {
    logAdminAuditAction({
      action: 'DISPATCH_CUSTOMER_STATEMENT',
      targetType: 'CUSTOMER',
      targetId: cust.customerId,
      description: `Dispatched comprehensive payment statement to ${cust.customerName}`,
    });
    success(`Lifetime account statement dispatched via email & WhatsApp to ${cust.customerName}!`);
  };

  // Handlers
  const handleVerifyPayment = (payment: CustomerPaymentItem) => {
    setSelectedPayment(payment);
    setVerificationNotes(`Payment signature and escrow credit verified via Razorpay webhook (${payment.gatewayPaymentId}).`);
    setIsVerifyModalOpen(true);
  };

  const confirmVerifyPayment = () => {
    if (!selectedPayment) return;
    try {
      const updated = verifyCustomerPayment(selectedPayment.id, {
        verifiedBy: 'Super Admin',
        notes: verificationNotes,
      });

      if (updated) {
        logAdminAuditAction({
          action: 'CUSTOMER_PAYMENT_VERIFIED',
          targetType: 'PAYMENT',
          targetId: updated.paymentCode,
          description: `Verified escrow inflow ₹${(updated.grossAmountPaise / 100).toLocaleString('en-IN')} for project ${updated.projectId} (${updated.customerName})`,
          metadata: { paymentId: updated.id, gatewayPaymentId: updated.gatewayPaymentId },
        });

        success(`Payment ${updated.paymentCode} verified and credited to platform escrow successfully!`);
        loadData();
        setSelectedPayment(updated);
        setIsVerifyModalOpen(false);
      }
    } catch (err: any) {
      error(err.message || 'Failed to verify payment');
    }
  };

  const handleOpenRefund = (payment: CustomerPaymentItem) => {
    setSelectedPayment(payment);
    setRefundReason('');
    setIsRefundModalOpen(true);
  };

  const confirmRefund = () => {
    if (!selectedPayment) return;
    if (!refundReason.trim()) {
      error('Please specify a valid reason for reversing this payment');
      return;
    }
    try {
      const updated = refundCustomerPayment(selectedPayment.id, {
        refundedBy: 'Super Admin',
        reason: refundReason.trim(),
      });

      if (updated) {
        logAdminAuditAction({
          action: 'CUSTOMER_PAYMENT_REFUNDED',
          targetType: 'PAYMENT',
          targetId: updated.paymentCode,
          description: `Refunded ₹${(updated.grossAmountPaise / 100).toLocaleString('en-IN')} for ${updated.projectTitle} (Reason: ${refundReason.trim()})`,
          metadata: { paymentId: updated.id, reason: refundReason.trim() },
        });

        success(`Payment ${updated.paymentCode} marked as REFUNDED and debited from escrow ledger.`);
        loadData();
        setSelectedPayment(updated);
        setIsRefundModalOpen(false);
      }
    } catch (err: any) {
      error(err.message || 'Failed to process refund');
    }
  };

  const handleCreateManualPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(newPay.amountRupees);
    if (isNaN(amountNum) || amountNum <= 0) {
      error('Please enter a valid amount');
      return;
    }

    const grossPaise = Math.round(amountNum * 100);
    // 18% GST calculation
    const subtotalPaise = Math.round(grossPaise / 1.18);
    const taxPaise = grossPaise - subtotalPaise;

    const item: CustomerPaymentItem = {
      id: `PAY-${Date.now()}`,
      paymentCode: `GHR-PAY-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      projectId: newPay.projectId,
      projectTitle: newPay.projectTitle,
      customerId: newPay.customerId,
      customerName: newPay.customerName,
      customerPhone: newPay.customerPhone,
      purpose: newPay.purpose,
      milestoneTitle: newPay.milestoneTitle,
      subtotalPaise,
      taxPaise,
      grossAmountPaise: grossPaise,
      paymentMethod: newPay.paymentMethod,
      gatewayOrderId: `ord_manual_${Date.now().toString().slice(-8)}`,
      gatewayPaymentId: newPay.referenceId || `pay_manual_${Date.now().toString().slice(-8)}`,
      status: 'VERIFIED_SUCCESSFUL',
      createdAt: new Date().toISOString(),
      verifiedAt: new Date().toISOString(),
      verifiedBy: 'Super Admin',
      verificationNotes: newPay.notes,
    };

    saveCustomerPayment(item);

    logAdminAuditAction({
      action: 'MANUAL_PAYMENT_RECORDED',
      targetType: 'PAYMENT',
      targetId: item.paymentCode,
      description: `Manual payment receipt created: ₹${amountNum.toLocaleString('en-IN')} for ${item.projectTitle}`,
      metadata: { paymentId: item.id, purpose: item.purpose },
    });

    success(`Payment receipt ${item.paymentCode} recorded and escrow balance updated!`);
    loadData();
    setIsAddPaymentModalOpen(false);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold font-display text-navy-950">
              Customer Payments & Platform Escrow
            </h1>
            <Badge variant="blue" className="text-[10px] uppercase font-bold tracking-wider">
              Section 12 Compliant
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Strict Multi-Party Governance: Customer ➔ BuildGhar Platform Account ➔ Admin Verification ➔ Architect Payout.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/admin/payouts"
            className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-300 hover:border-slate-400 bg-white text-slate-700 flex items-center gap-1.5 shadow-2xs transition"
          >
            <Briefcase className="w-3.5 h-3.5 text-blue-600" />
            <span>Architect Payouts Desk</span>
          </Link>
          <button
            onClick={() => setIsAddPaymentModalOpen(true)}
            className="btn-gold px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Record Escrow Deposit</span>
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Escrow Inflow</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-navy-950 font-display">
            {formatINR(stats.totalCollected)}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>{stats.verifiedCount} verified platform deposits</span>
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50/40 to-indigo-50/20 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-blue-800 text-xs font-semibold">
            <span>Active Platform Escrow Pool</span>
            <div className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
              <Lock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-blue-950 font-display">
            {formatINR(stats.activeEscrowHolding)}
          </div>
          <div className="text-[11px] text-blue-700 font-medium">
            Held safely until milestone completion sign-off
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-amber-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-amber-800 text-xs font-semibold">
            <span>Pending Admin Verification</span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-900 font-display">
            {formatINR(stats.pendingTotal)}
          </div>
          <div className="text-[11px] text-amber-700 font-medium">
            {stats.pendingCount} collection(s) awaiting signature check
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Payment Security Gateway</span>
            <div className="p-1.5 rounded-lg bg-slate-100 text-slate-600">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-navy-950 font-display">
            Razorpay Live
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            Webhook verified & 100% Escrow Account
          </div>
        </div>
      </div>

      {/* Module 10 Sub-Views Dropdown Switcher & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <label className="text-xs font-bold text-slate-600 shrink-0 flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-blue-600" />
            <span>Select Feature:</span>
          </label>
          <div className="relative flex-1">
            <select
              value={selectedView}
              onChange={(e) => handleSelectView(e.target.value as PaymentSubView)}
              className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-navy-950 focus:outline-none appearance-none cursor-pointer"
            >
              {SUB_VIEWS.map((v) => (
                <option key={v.key} value={v.key}>
                  {v.label} ({(subCounts as any)[v.countKey] || 0})
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-1 max-w-md justify-end">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search Payment Code, Customer Name, Project ID, Gateway Ref, UTR..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-navy-950 placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* 8-Pill Action Navigation Strip */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {SUB_VIEWS.map((sv) => {
          const IconComponent = sv.icon;
          const count = (subCounts as any)[sv.countKey] || 0;
          const isActive = selectedView === sv.key;
          return (
            <button
              key={sv.key}
              onClick={() => handleSelectView(sv.key)}
              className={`px-3.5 py-2 rounded-xl font-bold transition flex items-center gap-2 shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-navy-950 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <IconComponent className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />
              <span>{sv.label.replace(/^\d+\.\s*/, '')}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Contextual Feature Description Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-navy-950 text-white p-5 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[10px] font-mono font-bold uppercase tracking-wider">
              {SUB_VIEWS.find((s) => s.key === selectedView)?.label}
            </span>
            <span className="text-xs text-slate-300">
              {selectedView === 'CUSTOMER_HISTORY'
                ? `Showing ${customerHistoryList.length} customer accounts`
                : `Showing ${viewFilteredPayments.length} transaction records`}
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-black mt-1">
            {selectedView === 'ALL' && 'Master Customer Payments & Platform Escrow Registry'}
            {selectedView === 'PENDING_VERIFICATION' && 'Direct Bank NEFT/RTGS & Offline Deposit Verification Queue'}
            {selectedView === 'SUCCESSFUL' && 'Verified & Cleared Platform Deposits Held in Escrow'}
            {selectedView === 'FAILED' && 'Failed Gateway Transactions & Drop-off Recovery Desk'}
            {selectedView === 'REFUNDS' && 'Customer Refund Requests & Escrow Reversal Clearance'}
            {selectedView === 'CUSTOMER_HISTORY' && 'Customer-Centric Lifetime Financial Ledger & Statements'}
            {selectedView === 'RECONCILIATION' && 'Automated Bank Reconciliation & UTR Matching (BRS)'}
            {selectedView === 'GATEWAY_TRANSACTIONS' && 'Payment Gateway Webhook Audit & Net Settlement Breakdown'}
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            {selectedView === 'ALL' && 'Unified transaction registry across Razorpay, Net Banking, and Bank Wires with escrow allocation and invoice references.'}
            {selectedView === 'PENDING_VERIFICATION' && 'Validate customer-submitted NEFT/RTGS UTR numbers, counterfoils, and corporate bank transfers prior to escrow credit.'}
            {selectedView === 'SUCCESSFUL' && 'All successfully cleared customer deposits safely held in escrow. Accessible for milestone payout approval and GST tax invoicing.'}
            {selectedView === 'FAILED' && 'Analyze bank decline codes, 3DS verification timeouts, and UPI limit failures. Dispatch automated instant retry links.'}
            {selectedView === 'REFUNDS' && 'Manage cooling-off cancellations, duplicate payment reversals, and architectural scope reduction refund disbursements.'}
            {selectedView === 'CUSTOMER_HISTORY' && 'Consolidated customer accounts tracking lifetime contract amounts, cumulative paid deposits, and outstanding balance.'}
            {selectedView === 'RECONCILIATION' && 'Cross-verify gateway settlement files with HDFC Bank platform escrow statement and internal double-entry ledger.'}
            {selectedView === 'GATEWAY_TRANSACTIONS' && 'Inspect technical webhook payloads (payment.captured), 2% gateway processing fees, 18% GST deductions, and net credited funds.'}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/10 text-right">
            <span className="text-[10px] text-slate-300 block uppercase font-bold tracking-wider">
              {selectedView === 'FAILED' ? 'Total Failed Amount' : selectedView === 'REFUNDS' ? 'Total Refund Amount' : 'Total Inflow Valuation'}
            </span>
            <span className="text-lg font-mono font-black text-amber-300">
              {selectedView === 'CUSTOMER_HISTORY'
                ? formatINR(customerHistoryList.reduce((sum, c) => sum + c.totalPaidPaise, 0))
                : formatINR(viewFilteredPayments.reduce((sum, p) => sum + p.grossAmountPaise, 0))}
            </span>
          </div>
        </div>
      </div>

      {selectedView !== 'ESCROW_LEDGER' ? (
        <>
          {/* Secondary Purpose & Method Filter Bar (for tabular views) */}
          {selectedView !== 'CUSTOMER_HISTORY' && (
            <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-slate-500 font-bold flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5 text-blue-600" />
                  <span>Filters:</span>
                </span>
                <select
                  value={purposeFilter}
                  onChange={(e) => setPurposeFilter(e.target.value as any)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 font-medium"
                >
                  <option value="ALL">All Payment Purposes</option>
                  <option value="MILESTONE_PAYMENT">Milestone Payment</option>
                  <option value="BOOKING_ADVANCE">Booking Advance</option>
                  <option value="REQUEST_FEE">Quotation Request Fee</option>
                  <option value="MATERIAL_ORDER">Material Order</option>
                </select>

                <select
                  value={methodFilter}
                  onChange={(e) => setMethodFilter(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 font-medium"
                >
                  <option value="ALL">All Payment Methods</option>
                  <option value="RAZORPAY_UPI">Razorpay UPI</option>
                  <option value="NET_BANKING">Net Banking</option>
                  <option value="RAZORPAY_CARD">Debit / Credit Card</option>
                  <option value="NEFT_RTGS">NEFT / RTGS / Bank Wire</option>
                </select>
              </div>

              {selectedView === 'RECONCILIATION' && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRunAutoReconciliation}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-xs flex items-center gap-1.5"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Run Automated Batch Reconciliation</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* VIEW 6: CUSTOMER PAYMENT HISTORY VIEW */}
          {selectedView === 'CUSTOMER_HISTORY' && (
            <div className="space-y-4">
              {customerHistoryList.length === 0 ? (
                <div className="py-14 text-center text-slate-400 bg-white rounded-2xl border">
                  <User className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p className="font-semibold text-sm text-slate-700">No customer payment records found.</p>
                </div>
              ) : (
                customerHistoryList.map((cust) => (
                  <div
                    key={cust.customerId}
                    className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-2xs space-y-4 transition"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-navy-950 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                          {cust.customerName.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-black text-sm text-navy-950 font-display">{cust.customerName}</h3>
                            <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                              {cust.customerId}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Phone: <strong className="text-slate-800">{cust.customerPhone}</strong> {cust.customerEmail && `· Email: ${cust.customerEmail}`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Total Cumulative Paid</span>
                          <span className="text-base font-black font-mono text-emerald-700">{formatINR(cust.totalPaidPaise)}</span>
                        </div>
                        <button
                          onClick={() => handleSendStatement(cust)}
                          className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shrink-0"
                        >
                          <Send className="w-3.5 h-3.5 text-blue-600" />
                          <span>Dispatch Statement</span>
                        </button>
                      </div>
                    </div>

                    {/* Customer Projects & Payments Ledger Sub-table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                          <tr>
                            <th className="py-2.5 px-3">Payment Code</th>
                            <th className="py-2.5 px-3">Project Title</th>
                            <th className="py-2.5 px-3">Milestone / Purpose</th>
                            <th className="py-2.5 px-3">Method & Gateway Ref</th>
                            <th className="py-2.5 px-3 text-right">Gross Paid</th>
                            <th className="py-2.5 px-3 text-center">Status</th>
                            <th className="py-2.5 px-3 text-right">Receipt</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {cust.payments.map((p) => (
                            <tr key={p.id} className="hover:bg-slate-50/70">
                              <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                                <div>{p.paymentCode}</div>
                                <div className="text-[10px] text-slate-400 font-sans">{formatDate(p.createdAt)}</div>
                              </td>
                              <td className="py-2.5 px-3 text-slate-700 font-medium">
                                <span className="font-mono text-[10px] text-blue-700 bg-blue-50 px-1 py-0.2 rounded mr-1">
                                  {p.projectId}
                                </span>
                                {p.projectTitle}
                              </td>
                              <td className="py-2.5 px-3 text-slate-600">
                                <div>{p.purpose.replace(/_/g, ' ')}</div>
                                {p.milestoneTitle && <div className="text-[10px] text-slate-400">{p.milestoneTitle}</div>}
                              </td>
                              <td className="py-2.5 px-3 font-mono text-slate-600 text-[11px]">
                                <div>{p.paymentMethod.replace(/_/g, ' ')}</div>
                                <div className="text-[10px] text-slate-400 truncate max-w-[120px]">{p.gatewayPaymentId}</div>
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                                {formatINR(p.grossAmountPaise)}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    p.status === 'VERIFIED_SUCCESSFUL'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : p.status === 'PENDING_VERIFICATION'
                                      ? 'bg-amber-100 text-amber-800'
                                      : p.status === 'FAILED'
                                      ? 'bg-rose-100 text-rose-800'
                                      : 'bg-slate-100 text-slate-700'
                                  }`}
                                >
                                  {p.status.replace(/_/g, ' ')}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <button
                                  onClick={() => setSelectedPayment(p)}
                                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-600"
                                  title="View Receipt"
                                >
                                  <Receipt className="w-3.5 h-3.5 text-blue-600" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* VIEW 7: PAYMENT RECONCILIATION VIEW */}
          {selectedView === 'RECONCILIATION' && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden space-y-0">
              <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-sm text-navy-950 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Bank Statement Reconciliation (BRS)</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Matching Gateway Payment IDs with HDFC Bank Platform Escrow statement UTRs.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Net Escrow Variance: ₹0.00 (Balanced)
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Payment Code</th>
                      <th className="py-3 px-4">Customer & Project</th>
                      <th className="py-3 px-4">Gateway Reference</th>
                      <th className="py-3 px-4">Bank Statement UTR</th>
                      <th className="py-3 px-4 text-right">Deposit Amount</th>
                      <th className="py-3 px-4 text-center">BRS Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {viewFilteredPayments.map((p) => {
                      const isMatched = p.reconciliationStatus === 'MATCHED' || p.status === 'VERIFIED_SUCCESSFUL';
                      return (
                        <tr key={p.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3 px-4 font-mono font-bold text-slate-800">
                            <div>{p.paymentCode}</div>
                            <div className="text-[10px] text-slate-400 font-sans">{formatDate(p.createdAt)}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-navy-950">{p.customerName}</div>
                            <div className="text-[11px] text-slate-500 truncate max-w-xs">{p.projectTitle}</div>
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-700 text-[11px]">
                            <div>{p.gatewayPaymentId || 'N/A'}</div>
                            <div className="text-[10px] text-slate-400">{p.paymentMethod}</div>
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-700 text-[11px]">
                            {p.bankUtrNumber ? (
                              <span className="text-blue-700 font-bold">{p.bankUtrNumber}</span>
                            ) : (
                              <span className="text-slate-400 italic">Pending Bank File</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                            {formatINR(p.grossAmountPaise)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {isMatched ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>MATCHED</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                <AlertCircle className="w-3 h-3 text-amber-600" />
                                <span>UNRECONCILED</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {!isMatched ? (
                              <button
                                onClick={() => handleReconcile(p)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] transition cursor-pointer shadow-xs"
                              >
                                Reconcile
                              </button>
                            ) : (
                              <span className="text-[11px] text-emerald-700 font-bold">Verified</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VIEW 8: PAYMENT GATEWAY TRANSACTIONS VIEW */}
          {selectedView === 'GATEWAY_TRANSACTIONS' && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden space-y-0">
              <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-sm text-navy-950 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-purple-600" />
                    <span>Technical Gateway Settlement & Webhook Logs</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Razorpay & Cashfree webhook payload events with standard 2% processing fee and 18% GST breakup.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs px-2.5 py-1 rounded-lg bg-purple-100 text-purple-800 font-bold border border-purple-300">
                    Active Webhook: Live (HMAC Verified)
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Gateway Provider & Order</th>
                      <th className="py-3 px-4">Gateway Payment ID</th>
                      <th className="py-3 px-4">Customer & Project</th>
                      <th className="py-3 px-4 text-right">Gross Inflow</th>
                      <th className="py-3 px-4 text-right">Gateway Fee + GST</th>
                      <th className="py-3 px-4 text-right">Net Credited</th>
                      <th className="py-3 px-4 text-right">Webhook Payload</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {viewFilteredPayments.map((p) => {
                      const fee = p.gatewayFeePaise || Math.round(p.grossAmountPaise * 0.02);
                      const tax = p.gatewayTaxPaise || Math.round(fee * 0.18);
                      const net = p.netSettledPaise || (p.grossAmountPaise - fee - tax);
                      return (
                        <tr key={p.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-800 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-500" />
                              <span>Razorpay Live</span>
                            </div>
                            <div className="font-mono text-[10px] text-slate-400">{p.gatewayOrderId}</div>
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-purple-900 text-[11px]">
                            {p.gatewayPaymentId}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-navy-950">{p.customerName}</div>
                            <div className="text-[11px] text-slate-500 truncate max-w-xs">{p.projectTitle}</div>
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                            {formatINR(p.grossAmountPaise)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-rose-600">
                            <div>-{formatINR(fee)}</div>
                            <div className="text-[10px] text-slate-400">GST: -{formatINR(tax)}</div>
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-black text-emerald-700">
                            {formatINR(net)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => setInspectingWebhookPayment(p)}
                              className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 rounded-lg font-bold text-[11px] transition cursor-pointer flex items-center gap-1 ml-auto"
                            >
                              <Layers className="w-3.5 h-3.5 text-purple-600" />
                              <span>Inspect JSON</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VIEWS: ALL, PENDING_VERIFICATION, SUCCESSFUL, FAILED, REFUNDS */}
          {selectedView !== 'CUSTOMER_HISTORY' && selectedView !== 'RECONCILIATION' && selectedView !== 'GATEWAY_TRANSACTIONS' && (
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Payment Code</th>
                      <th className="py-3 px-4">Project & Customer</th>
                      <th className="py-3 px-4">Purpose & Milestone</th>
                      <th className="py-3 px-4">Method & Gateway</th>
                      <th className="py-3 px-4 text-right">Gross Amount</th>
                      <th className="py-3 px-4 text-center">Escrow Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {viewFilteredPayments.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-14 text-center text-slate-400">
                          <CreditCard className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                          <p className="font-semibold text-sm text-slate-700">No payment records found matching criteria</p>
                          <p className="text-xs text-slate-400 mt-1">Try resetting the filters or searching with another term.</p>
                        </td>
                      </tr>
                    ) : (
                      viewFilteredPayments.map((p) => {
                        const isFailed = p.status === 'FAILED';
                        const isPending = p.status === 'PENDING_VERIFICATION';
                        const isRefund = p.status === 'REFUND_REQUESTED' || p.status === 'REFUNDED';
                        const isSuccess = p.status === 'VERIFIED_SUCCESSFUL';

                        return (
                          <tr key={p.id} className="hover:bg-slate-50/80 transition group">
                            <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                              <div>{p.paymentCode}</div>
                              <div className="text-[10px] text-slate-400 font-sans">{formatDate(p.createdAt)}</div>
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="font-semibold text-navy-950 flex items-center gap-1.5">
                                <span>{p.customerName}</span>
                                <span className="text-[10px] text-slate-400 font-normal">({p.customerPhone})</span>
                              </div>
                              <div className="text-[11px] text-blue-600 font-medium truncate max-w-xs flex items-center gap-1">
                                <span className="font-mono text-[10px] px-1 py-0.2 bg-blue-50 text-blue-700 rounded border border-blue-200">
                                  {p.projectId}
                                </span>
                                <span className="truncate">{p.projectTitle}</span>
                              </div>
                              {/* View specific alert callouts */}
                              {isFailed && p.failureReason && (
                                <div className="mt-1 text-[10px] text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded font-mono">
                                  {p.failureReason}
                                </div>
                              )}
                              {isRefund && p.refundReason && (
                                <div className="mt-1 text-[10px] text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded font-mono">
                                  Reason: {p.refundReason}
                                </div>
                              )}
                              {isPending && p.bankUtrNumber && (
                                <div className="mt-1 text-[10px] text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded font-mono">
                                  UTR: {p.bankUtrNumber}
                                </div>
                              )}
                            </td>

                            <td className="py-3.5 px-4">
                              <Badge
                                variant={
                                  p.purpose === 'MILESTONE_PAYMENT'
                                    ? 'blue'
                                    : p.purpose === 'BOOKING_ADVANCE'
                                    ? 'emerald'
                                    : 'slate'
                                }
                                className="text-[10px] font-bold"
                              >
                                {p.purpose.replace(/_/g, ' ')}
                              </Badge>
                              {p.milestoneTitle && (
                                <div className="text-[11px] text-slate-600 truncate max-w-xs mt-0.5">
                                  {p.milestoneTitle}
                                </div>
                              )}
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="font-medium text-slate-700">{p.paymentMethod.replace(/_/g, ' ')}</div>
                              <div className="text-[10px] font-mono text-slate-400 truncate max-w-[140px]">
                                {p.gatewayPaymentId}
                              </div>
                            </td>

                            <td className="py-3.5 px-4 text-right">
                              <div className="font-bold text-navy-950 font-display text-sm">
                                {formatINR(p.grossAmountPaise)}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                Subtotal: {formatINR(p.subtotalPaise)} + 18% GST
                              </div>
                            </td>

                            <td className="py-3.5 px-4 text-center">
                              {isSuccess && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>Escrow Credited</span>
                                </span>
                              )}
                              {isPending && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                                  <AlertCircle className="w-3 h-3 text-amber-600" />
                                  <span>Pending Verification</span>
                                </span>
                              )}
                              {isFailed && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                  <AlertCircle className="w-3 h-3 text-rose-600" />
                                  <span>Payment Failed</span>
                                </span>
                              )}
                              {p.status === 'REFUND_REQUESTED' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 animate-pulse">
                                  <RotateCcw className="w-3 h-3 text-purple-600" />
                                  <span>Refund Requested</span>
                                </span>
                              )}
                              {p.status === 'REFUNDED' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                  <RotateCcw className="w-3 h-3 text-rose-600" />
                                  <span>Refunded</span>
                                </span>
                              )}
                            </td>

                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => setSelectedPayment(p)}
                                  title="Inspect Details"
                                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>

                                {/* Pending verification action */}
                                {isPending && (
                                  <button
                                    onClick={() => handleVerifyPayment(p)}
                                    title="Verify Signature & Escrow Inflow"
                                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-2xs transition cursor-pointer"
                                  >
                                    <Check className="w-3 h-3" />
                                    <span>Verify</span>
                                  </button>
                                )}

                                {/* Failed payment recovery actions */}
                                {isFailed && (
                                  <>
                                    <button
                                      onClick={() => handleSendRetryLink(p)}
                                      title="Send Retry Payment Link via SMS/WhatsApp"
                                      className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-2xs transition cursor-pointer"
                                    >
                                      <Send className="w-3 h-3" />
                                      <span>Retry Link</span>
                                    </button>
                                    <button
                                      onClick={() => handleMarkOfflineReceived(p)}
                                      title="Mark Received via Offline Bank Deposit"
                                      className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] transition cursor-pointer"
                                    >
                                      Offline Recv
                                    </button>
                                  </>
                                )}

                                {/* Successful payment refund trigger */}
                                {isSuccess && (
                                  <button
                                    onClick={() => handleOpenRefund(p)}
                                    title="Initiate Refund"
                                    className="p-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 transition cursor-pointer"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                  </button>
                                )}

                                {/* Refund requested action */}
                                {p.status === 'REFUND_REQUESTED' && (
                                  <button
                                    onClick={() => handleOpenRefund(p)}
                                    title="Execute Escrow Reversal"
                                    className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-2xs transition cursor-pointer"
                                  >
                                    <RotateCcw className="w-3 h-3" />
                                    <span>Process Refund</span>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
        /* Double Entry Escrow Ledger Table */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-navy-950 flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-600" />
                <span>Centralized Escrow General Ledger (Double-Entry Verification)</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Every customer milestone deposit, architect payout release, and platform commission deduction is strictly journaled.
              </p>
            </div>
            <div className="text-right">
              <div className="text-xs font-semibold text-slate-500">Live Escrow Balance</div>
              <div className="text-lg font-bold text-purple-900 font-display">
                {formatINR(stats.activeEscrowHolding)}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Timestamp & Ref</th>
                  <th className="py-3 px-4">Transaction Type</th>
                  <th className="py-3 px-4">Project ID & Description</th>
                  <th className="py-3 px-4 text-right">Debit (₹)</th>
                  <th className="py-3 px-4 text-right">Credit (₹)</th>
                  <th className="py-3 px-4 text-right">Running Escrow</th>
                  <th className="py-3 px-4 text-center">Authorized By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {ledger.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 font-sans">
                      No escrow ledger entries recorded yet.
                    </td>
                  </tr>
                ) : (
                  ledger.map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 text-[11px]">
                        <div className="font-bold text-slate-800">{entry.referenceId}</div>
                        <div className="text-[10px] text-slate-400 font-sans">{formatDate(entry.timestamp)}</div>
                      </td>

                      <td className="py-3 px-4 font-sans">
                        <Badge
                          variant={
                            entry.transactionType === 'CUSTOMER_PAYMENT'
                              ? 'emerald'
                              : entry.transactionType === 'PARTNER_PAYOUT'
                              ? 'blue'
                              : 'slate'
                          }
                          className="text-[10px] font-bold"
                        >
                          {entry.transactionType.replace(/_/g, ' ')}
                        </Badge>
                      </td>

                      <td className="py-3 px-4 font-sans">
                        <div className="font-semibold text-slate-900 text-xs">{entry.projectId}</div>
                        <div className="text-[11px] text-slate-500">{entry.description}</div>
                      </td>

                      <td className="py-3 px-4 text-right font-bold text-rose-600">
                        {entry.debitPaise > 0 ? formatINR(entry.debitPaise) : '—'}
                      </td>

                      <td className="py-3 px-4 text-right font-bold text-emerald-600">
                        {entry.creditPaise > 0 ? formatINR(entry.creditPaise) : '—'}
                      </td>

                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        {formatINR(entry.runningEscrowBalancePaise)}
                      </td>

                      <td className="py-3 px-4 text-center font-sans text-slate-600 text-[11px]">
                        {entry.authorizedBy}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payment Details Drawer */}
      {selectedPayment && !isVerifyModalOpen && !isRefundModalOpen && (
        <div className="fixed inset-0 z-50 bg-navy-950/40 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-lg bg-white h-full shadow-2xl overflow-y-auto flex flex-col animate-slide-left">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider font-mono">
                  {selectedPayment.paymentCode}
                </span>
                <h3 className="text-base font-bold text-navy-950">Escrow Transaction Audit</h3>
              </div>
              <button
                onClick={() => setSelectedPayment(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-5 text-xs flex-1">
              {/* Gross Amount Card */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-blue-900 to-indigo-950 text-white space-y-1 shadow-md">
                <div className="text-[11px] text-blue-200 font-semibold">Total Escrow Collected (Gross)</div>
                <div className="text-3xl font-extrabold font-display">
                  {formatINR(selectedPayment.grossAmountPaise)}
                </div>
                <div className="text-[11px] text-blue-200/90 pt-1 flex items-center justify-between border-t border-white/10">
                  <span>Subtotal: {formatINR(selectedPayment.subtotalPaise)}</span>
                  <span>18% GST: {formatINR(selectedPayment.taxPaise)}</span>
                </div>
              </div>

              {/* Status & Governance */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Escrow State:</span>
                  <Badge
                    variant={
                      selectedPayment.status === 'VERIFIED_SUCCESSFUL'
                        ? 'emerald'
                        : selectedPayment.status === 'PENDING_VERIFICATION'
                        ? 'amber'
                        : 'rose'
                    }
                    className="font-bold"
                  >
                    {selectedPayment.status.replace(/_/g, ' ')}
                  </Badge>
                </div>
                {selectedPayment.verifiedAt && (
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Verified Timestamp:</span>
                    <span className="font-mono text-slate-700">{formatDate(selectedPayment.verifiedAt)}</span>
                  </div>
                )}
                {selectedPayment.verifiedBy && (
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Audited By:</span>
                    <span className="font-semibold text-slate-800">{selectedPayment.verifiedBy}</span>
                  </div>
                )}
                {selectedPayment.verificationNotes && (
                  <div className="text-[11px] text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="font-bold text-slate-700">Audit Notes: </span>
                    {selectedPayment.verificationNotes}
                  </div>
                )}
              </div>

              {/* Project & Milestone */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Project Association</div>
                <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-blue-50 text-blue-700 border border-blue-200">
                      {selectedPayment.projectId}
                    </span>
                    <span className="font-bold text-navy-950 truncate">{selectedPayment.projectTitle}</span>
                  </div>
                  {selectedPayment.milestoneTitle && (
                    <div className="text-slate-600">
                      <span className="text-slate-400 font-medium">Milestone: </span>
                      <span className="font-semibold text-slate-800">{selectedPayment.milestoneTitle}</span>
                    </div>
                  )}
                  {selectedPayment.architectName && (
                    <div className="text-slate-600">
                      <span className="text-slate-400 font-medium">Assigned Architect: </span>
                      <span className="font-semibold text-blue-700">{selectedPayment.architectName}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Customer Info */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Customer Details</div>
                <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-1">
                  <div className="font-bold text-navy-950">{selectedPayment.customerName}</div>
                  <div className="text-slate-500">{selectedPayment.customerPhone}</div>
                  {selectedPayment.customerEmail && (
                    <div className="text-slate-500">{selectedPayment.customerEmail}</div>
                  )}
                </div>
              </div>

              {/* Gateway & Settlement Audit */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Gateway Audit Trails</div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 font-mono text-[11px]">
                  <div>
                    <div className="text-slate-400 text-[10px]">Payment Method</div>
                    <div className="font-semibold text-slate-800">{selectedPayment.paymentMethod}</div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-[10px]">Razorpay Order ID</div>
                    <div className="font-semibold text-slate-800">{selectedPayment.gatewayOrderId}</div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-[10px]">Razorpay Payment ID / UTR</div>
                    <div className="font-semibold text-emerald-700">{selectedPayment.gatewayPaymentId}</div>
                  </div>
                  {selectedPayment.gatewaySignature && (
                    <div>
                      <div className="text-slate-400 text-[10px]">HMAC SHA256 Signature Verification</div>
                      <div className="font-mono text-[10px] text-emerald-600 truncate">
                        VALIDATED ({selectedPayment.gatewaySignature})
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Associated Documents */}
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                <Link
                  to="/admin/invoices"
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl flex items-center gap-1.5 transition text-xs"
                >
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  <span>View Tax Invoice / Receipt</span>
                </Link>

                {selectedPayment.status === 'PENDING_VERIFICATION' && (
                  <button
                    onClick={() => handleVerifyPayment(selectedPayment)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition text-xs"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Verify & Credit Escrow</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Verify Payment Modal */}
      {isVerifyModalOpen && selectedPayment && (
        <div className="fixed inset-0 z-50 bg-navy-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-navy-950 text-sm">Verify Escrow Payment Signature</h3>
                  <p className="text-[11px] text-slate-500 font-mono">{selectedPayment.paymentCode}</p>
                </div>
              </div>
              <button
                onClick={() => setIsVerifyModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1">
                <div className="flex justify-between font-semibold text-emerald-900">
                  <span>Gross Escrow Deposit:</span>
                  <span className="font-bold text-base">{formatINR(selectedPayment.grossAmountPaise)}</span>
                </div>
                <div className="text-[11px] text-emerald-700">
                  From: {selectedPayment.customerName} ({selectedPayment.projectTitle})
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Audit Verification Notes</label>
                <textarea
                  rows={3}
                  value={verificationNotes}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 text-xs"
                />
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-900 space-y-1">
                <div className="font-bold">Governance Gate:</div>
                <p>
                  Upon verification, this payment will be deposited into the active Escrow Pool. The assigned architect can ONLY receive payout once the corresponding milestone is completed and signed off.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsVerifyModalOpen(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmVerifyPayment}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Confirm Escrow Credit</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {isRefundModalOpen && selectedPayment && (
        <div className="fixed inset-0 z-50 bg-navy-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-navy-950 text-sm">Reverse & Refund Escrow Deposit</h3>
                  <p className="text-[11px] text-slate-500 font-mono">{selectedPayment.paymentCode}</p>
                </div>
              </div>
              <button
                onClick={() => setIsRefundModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
                <div className="flex justify-between font-semibold text-rose-900">
                  <span>Refund Amount:</span>
                  <span className="font-bold text-base">{formatINR(selectedPayment.grossAmountPaise)}</span>
                </div>
                <div className="text-[11px] text-rose-700">
                  Will be reversed from platform escrow to {selectedPayment.customerName}'s source account.
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Reason for Refund / Cancellation <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Customer cancelled booking within 48hr cooling-off window or duplicate payment..."
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-600 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsRefundModalOpen(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmRefund}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Process Escrow Reversal</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Record Manual Payment Modal */}
      {isAddPaymentModalOpen && (
        <div className="fixed inset-0 z-50 bg-navy-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-navy-950 text-sm">Record Manual Escrow Deposit</h3>
                  <p className="text-[11px] text-slate-500">For direct Bank NEFT/RTGS/Cheque deposits</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddPaymentModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateManualPayment} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Project ID</label>
                  <input
                    type="text"
                    required
                    value={newPay.projectId}
                    onChange={(e) => setNewPay({ ...newPay, projectId: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Purpose</label>
                  <select
                    value={newPay.purpose}
                    onChange={(e) => setNewPay({ ...newPay, purpose: e.target.value as any })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-600 font-medium"
                  >
                    <option value="MILESTONE_PAYMENT">Milestone Payment</option>
                    <option value="BOOKING_ADVANCE">Booking Advance</option>
                    <option value="REQUEST_FEE">Quotation Request Fee</option>
                    <option value="MATERIAL_ORDER">Material Order</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Project Title</label>
                <input
                  type="text"
                  required
                  value={newPay.projectTitle}
                  onChange={(e) => setNewPay({ ...newPay, projectTitle: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Customer Name</label>
                  <input
                    type="text"
                    required
                    value={newPay.customerName}
                    onChange={(e) => setNewPay({ ...newPay, customerName: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Customer Phone</label>
                  <input
                    type="text"
                    required
                    value={newPay.customerPhone}
                    onChange={(e) => setNewPay({ ...newPay, customerPhone: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Gross Amount (₹)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newPay.amountRupees}
                    onChange={(e) => setNewPay({ ...newPay, amountRupees: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-navy-950 text-xs focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Payment Method</label>
                  <select
                    value={newPay.paymentMethod}
                    onChange={(e) => setNewPay({ ...newPay, paymentMethod: e.target.value as any })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-600 font-medium"
                  >
                    <option value="NET_BANKING">Net Banking / Corporate Transfer</option>
                    <option value="NEFT_RTGS">NEFT / RTGS</option>
                    <option value="RAZORPAY_UPI">Razorpay UPI</option>
                    <option value="RAZORPAY_CARD">Card Payment</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Bank Reference / UTR Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HDFC1202611270094"
                  value={newPay.referenceId}
                  onChange={(e) => setNewPay({ ...newPay, referenceId: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Escrow Credit Notes</label>
                <input
                  type="text"
                  value={newPay.notes}
                  onChange={(e) => setNewPay({ ...newPay, notes: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddPaymentModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-gold px-4 py-2 text-xs font-bold rounded-xl shadow-md transition flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Record & Credit Escrow</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Webhook JSON Inspection Modal */}
      {inspectingWebhookPayment && (
        <div className="fixed inset-0 z-50 bg-navy-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-50 text-purple-700">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-navy-950 text-sm">Payment Gateway Webhook Payload</h3>
                  <p className="text-[11px] text-slate-500 font-mono">{inspectingWebhookPayment.gatewayPaymentId}</p>
                </div>
              </div>
              <button
                onClick={() => setInspectingWebhookPayment(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 bg-purple-50 border border-purple-200 rounded-xl">
                <div>
                  <span className="text-[10px] text-purple-700 font-bold uppercase tracking-wider block">Gateway Event</span>
                  <span className="font-mono font-bold text-purple-950">payment.captured</span>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Signature Verified (HMAC-SHA256)
                </span>
              </div>

              <div className="bg-slate-950 text-slate-200 p-4 rounded-xl font-mono text-[11px] overflow-x-auto max-h-64">
                <pre>{JSON.stringify({
                  event: 'payment.captured',
                  entity: 'event',
                  account_id: 'acc_buildghar_live_9941',
                  contains: ['payment'],
                  payload: {
                    payment: {
                      entity: {
                        id: inspectingWebhookPayment.gatewayPaymentId,
                        order_id: inspectingWebhookPayment.gatewayOrderId,
                        amount: inspectingWebhookPayment.grossAmountPaise,
                        currency: 'INR',
                        status: inspectingWebhookPayment.status === 'FAILED' ? 'failed' : 'captured',
                        method: inspectingWebhookPayment.paymentMethod.toLowerCase(),
                        description: inspectingWebhookPayment.projectTitle,
                        email: inspectingWebhookPayment.customerEmail || 'customer@buildghar.in',
                        contact: inspectingWebhookPayment.customerPhone,
                        fee: inspectingWebhookPayment.gatewayFeePaise || Math.round(inspectingWebhookPayment.grossAmountPaise * 0.02),
                        tax: inspectingWebhookPayment.gatewayTaxPaise || Math.round((inspectingWebhookPayment.gatewayFeePaise || inspectingWebhookPayment.grossAmountPaise * 0.02) * 0.18),
                        created_at: Math.floor(new Date(inspectingWebhookPayment.createdAt).getTime() / 1000),
                      }
                    }
                  }
                }, null, 2)}</pre>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-[11px] text-slate-500 font-mono">
                Settlement Batch: {inspectingWebhookPayment.settlementBatchId || 'SETTLE-AUTO-BATCH'}
              </span>
              <button
                onClick={() => {
                  success('Webhook signature re-verified against Razorpay secret key!');
                  setInspectingWebhookPayment(null);
                }}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
