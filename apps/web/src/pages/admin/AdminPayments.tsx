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
} from 'lucide-react';
import {
  getCustomerPayments,
  verifyCustomerPayment,
  refundCustomerPayment,
  saveCustomerPayment,
  getFinancialLedger,
  CustomerPaymentItem,
  LedgerEntry,
} from '../../data/financialLedgerStore.js';
import { logAdminAuditAction } from '../../data/adminRbacStore.js';

export const AdminPayments: React.FC = () => {
  const { success, error } = useToast();

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

  // Filtered Payments
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      if (activeTab === 'VERIFIED_SUCCESSFUL' && p.status !== 'VERIFIED_SUCCESSFUL') return false;
      if (activeTab === 'PENDING_VERIFICATION' && p.status !== 'PENDING_VERIFICATION') return false;
      if (activeTab === 'REFUND_REQUESTED' && p.status !== 'REFUND_REQUESTED' && p.status !== 'REFUNDED') return false;

      if (purposeFilter !== 'ALL' && p.purpose !== purposeFilter) return false;
      if (methodFilter !== 'ALL' && p.paymentMethod !== methodFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode = p.paymentCode.toLowerCase().includes(q);
        const matchCust = p.customerName.toLowerCase().includes(q);
        const matchPhone = p.customerPhone.toLowerCase().includes(q);
        const matchProj = (p.projectId || '').toLowerCase().includes(q) || (p.projectTitle || '').toLowerCase().includes(q);
        const matchOrder = (p.gatewayOrderId || '').toLowerCase().includes(q) || (p.gatewayPaymentId || '').toLowerCase().includes(q);
        return matchCode || matchCust || matchPhone || matchProj || matchOrder;
      }
      return true;
    });
  }, [payments, activeTab, purposeFilter, methodFilter, searchQuery]);

  // Aggregate Metrics
  const stats = useMemo(() => {
    const verified = payments.filter((p) => p.status === 'VERIFIED_SUCCESSFUL');
    const totalCollected = verified.reduce((sum, p) => sum + p.grossAmountPaise, 0);
    const pendingVerification = payments.filter((p) => p.status === 'PENDING_VERIFICATION');
    const pendingTotal = pendingVerification.reduce((sum, p) => sum + p.grossAmountPaise, 0);
    const refunded = payments.filter((p) => p.status === 'REFUNDED');
    const refundedTotal = refunded.reduce((sum, p) => sum + p.grossAmountPaise, 0);

    // Active escrow holding is total collected minus refunds
    const activeEscrowHolding = totalCollected - refundedTotal;

    return {
      totalCollected,
      activeEscrowHolding,
      pendingCount: pendingVerification.length,
      pendingTotal,
      verifiedCount: verified.length,
      refundedCount: refunded.length,
    };
  }, [payments]);

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
            <span>All Customer Inflows</span>
            <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-[10px] text-slate-600">
              {payments.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('VERIFIED_SUCCESSFUL')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'VERIFIED_SUCCESSFUL'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Verified & In Escrow</span>
            <span className="px-1.5 py-0.5 rounded-full bg-emerald-50 text-[10px] text-emerald-700">
              {stats.verifiedCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('PENDING_VERIFICATION')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'PENDING_VERIFICATION'
                ? 'border-amber-600 text-amber-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            <span>Pending Verification</span>
            {stats.pendingCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-[10px] font-bold text-amber-800 animate-pulse">
                {stats.pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('REFUND_REQUESTED')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'REFUND_REQUESTED'
                ? 'border-rose-600 text-rose-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
            <span>Refunds</span>
            {stats.refundedCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-rose-50 text-[10px] text-rose-700">
                {stats.refundedCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('ESCROW_LEDGER')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'ESCROW_LEDGER'
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-purple-600" />
            <span>Double-Entry Escrow Ledger</span>
            <span className="px-1.5 py-0.5 rounded-full bg-purple-50 text-[10px] text-purple-700">
              {ledger.length}
            </span>
          </button>
        </div>
      </div>

      {activeTab !== 'ESCROW_LEDGER' ? (
        <>
          {/* Search & Filter Bar */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by Payment Code, Customer Name, Project ID (BG-2026-XXXX), Gateway Order..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={purposeFilter}
                onChange={(e) => setPurposeFilter(e.target.value as any)}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 font-medium"
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
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 font-medium"
              >
                <option value="ALL">All Payment Methods</option>
                <option value="RAZORPAY_UPI">Razorpay UPI</option>
                <option value="NET_BANKING">Net Banking</option>
                <option value="RAZORPAY_CARD">Debit / Credit Card</option>
                <option value="NEFT_RTGS">NEFT / RTGS / Bank Wire</option>
              </select>
            </div>
          </div>

          {/* Payments Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
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
                  {filteredPayments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <CreditCard className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                        <p className="font-semibold text-sm">No payment records found matching criteria</p>
                        <p className="text-xs text-slate-400 mt-1">Try resetting the filters or searching with another term.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredPayments.map((p) => (
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
                          {p.status === 'VERIFIED_SUCCESSFUL' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Escrow Credited</span>
                            </span>
                          )}
                          {p.status === 'PENDING_VERIFICATION' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                              <AlertCircle className="w-3 h-3 text-amber-600" />
                              <span>Pending Verification</span>
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
                              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {p.status === 'PENDING_VERIFICATION' && (
                              <button
                                onClick={() => handleVerifyPayment(p)}
                                title="Verify Signature & Escrow Inflow"
                                className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-2xs transition"
                              >
                                <Check className="w-3 h-3" />
                                <span>Verify</span>
                              </button>
                            )}

                            {p.status === 'VERIFIED_SUCCESSFUL' && (
                              <button
                                onClick={() => handleOpenRefund(p)}
                                title="Initiate Refund"
                                className="p-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 transition"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
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
    </div>
  );
};
