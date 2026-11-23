import React, { useState, useEffect, useMemo } from 'react';
import { formatINR, formatDate } from '../../lib/utils.js';
import { useToast } from '../../context/ToastContext.js';
import { Badge } from '../../components/common/Badge.js';
import {
  CreditCard,
  RotateCcw,
  Download,
  Check,
  AlertCircle,
  Eye,
  X,
  User,
  ArrowLeft,
  ArrowRight,
  FileText,
  ShoppingBag,
  ArrowUpRight,
  Search,
  Filter,
  ShieldCheck,
  Printer,
  CheckCircle2,
  Building,
  Plus,
} from 'lucide-react';
import { broadcastStoreUpdate } from '../../data/customerStore.js';

export interface PaymentRecord {
  id: string;
  paymentCode: string;
  customerName: string;
  phone: string;
  email?: string;
  purpose: 'MATERIAL_PURCHASE' | 'REQUEST_FEE' | 'BOOKING_ADVANCE';
  amountPaise: number;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  paymentMethod?: string;
  status: 'PAYMENT_SUCCESSFUL' | 'PENDING_COLLECTION' | 'REFUNDED' | 'FAILED';
  createdAt: string;
  items?: Array<{
    name: string;
    quantity: number;
    unit: string;
    unitPricePaise?: number;
    totalPaise?: number;
  }>;
  subtotalPaise?: number;
  taxPaise?: number;
  deliveryFeePaise?: number;
  deliveryAddress?: any;
  associatedProject?: string;
}

export const AdminPayments: React.FC = () => {
  const { success, error } = useToast();

  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [purposeFilter, setPurposeFilter] = useState<'ALL' | 'MATERIAL_PURCHASE' | 'REQUEST_FEE' | 'BOOKING_ADVANCE'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAYMENT_SUCCESSFUL' | 'PENDING_COLLECTION' | 'REFUNDED'>('ALL');

  const loadPayments = () => {
    let combinedPayments: PaymentRecord[] = [];

    // 1. Load Material Orders from localStorage (Real customer purchases only)
    try {
      const ordersJson = localStorage.getItem('material_orders');
      if (ordersJson) {
        const parsed = JSON.parse(ordersJson);
        const matPayments: PaymentRecord[] = parsed
          .filter((o: any) => o.customerName !== 'Vikram Malhotra' && o.orderCode !== 'GHR-ORD-2026-9042' && o.orderCode !== 'GHR-ORD-2026-8812')
          .map((o: any) => ({
            id: `pay-mat-${o.id}`,
            paymentCode: `PAY-${o.orderCode}`,
            customerName: o.customerName || o.deliveryAddress?.customerName || 'Homeowner',
            phone: o.customerPhone || o.deliveryAddress?.phone || '',
            email: o.customerEmail || 'homeowner@ghar-design.in',
            purpose: 'MATERIAL_PURCHASE' as const,
            amountPaise: o.totalAmountPaise,
            subtotalPaise: o.subtotalPaise,
            taxPaise: o.taxPaise,
            deliveryFeePaise: o.deliveryFeePaise,
            razorpayOrderId: `ord_rzp_${o.orderCode}`,
            razorpayPaymentId: `pay_rzp_${o.id?.slice(-8) || 'mat99'}`,
            paymentMethod: o.paymentMethod || 'Online Razorpay Payment',
            status: o.paymentStatus || 'PAYMENT_SUCCESSFUL',
            createdAt: o.orderDate || new Date().toISOString(),
            items: o.items || [],
            deliveryAddress: o.deliveryAddress,
            associatedProject: o.associatedProject,
          }));
        combinedPayments = [...matPayments, ...combinedPayments];
      }
    } catch (e) {
      console.error('Error loading material payments:', e);
    }

    // 2. Load Project Requests from localStorage (Real homeowner quotation requests)
    try {
      const reqJson = localStorage.getItem('platform_project_requests');
      if (reqJson) {
        const parsedReqs = JSON.parse(reqJson);
        const newReqPayments: PaymentRecord[] = parsedReqs
          .filter((r: any) => r.customerName !== 'Vikram Malhotra' && r.requestCode !== 'GHR-REQ-2026-1001')
          .map((r: any) => ({
            id: `pay-dyn-req-${r.id}`,
            paymentCode: `PAY-${r.requestCode || r.id}`,
            customerName: r.customerName || 'Registered Homeowner',
            phone: r.customerPhone || '',
            email: r.customerEmail || 'customer@ghar-design.in',
            purpose: 'REQUEST_FEE' as const,
            amountPaise: r.quoteFeePaise || 49900,
            razorpayOrderId: `ord_rzp_${r.id}`,
            razorpayPaymentId: `pay_rzp_${Date.now()}`,
            paymentMethod: 'Razorpay Instant UPI',
            status: 'PAYMENT_SUCCESSFUL' as const,
            createdAt: r.createdAt || new Date().toISOString(),
            associatedProject: `${r.categorySlug?.replace(/-/g, ' ')} (${r.city})`,
          }));

        // Avoid duplicates by paymentCode
        const existingCodes = new Set(combinedPayments.map((p) => p.paymentCode));
        for (const reqPay of newReqPayments) {
          if (!existingCodes.has(reqPay.paymentCode)) {
            combinedPayments.push(reqPay);
            existingCodes.add(reqPay.paymentCode);
          }
        }
      }
    } catch (e) {
      console.error('Error loading request fee payments:', e);
    }

    // 3. Load Bookings & Consultations from localStorage
    try {
      const bookingsJson = localStorage.getItem('platform_bookings');
      if (bookingsJson) {
        const parsedBookings = JSON.parse(bookingsJson);
        const bookingPayments: PaymentRecord[] = parsedBookings
          .filter((b: any) => b.customerName !== 'Vikram Malhotra' && b.bookingCode !== 'BK-2026-8492')
          .map((b: any) => ({
            id: `pay-bk-${b.id}`,
            paymentCode: `PAY-${b.bookingCode}`,
            customerName: b.customerName || 'Registered Homeowner',
            phone: b.customerPhone || '',
            email: b.customerEmail || 'homeowner@ghar-design.in',
            purpose: 'BOOKING_ADVANCE' as const,
            amountPaise: b.totalAmountPaise || 499000,
            razorpayOrderId: `ord_rzp_${b.bookingCode}`,
            razorpayPaymentId: `pay_rzp_${b.id?.slice(-8) || 'bk99'}`,
            paymentMethod: 'Razorpay Instant UPI / Escrow Deposit',
            status: 'PAYMENT_SUCCESSFUL' as const,
            createdAt: b.confirmedAt || new Date().toISOString(),
            associatedProject: b.serviceTitle,
          }));

        const existingCodes = new Set(combinedPayments.map((p) => p.paymentCode));
        for (const bkPay of bookingPayments) {
          if (!existingCodes.has(bkPay.paymentCode)) {
            combinedPayments.push(bkPay);
            existingCodes.add(bkPay.paymentCode);
          }
        }
      }
    } catch (e) {
      console.error('Error loading booking payments:', e);
    }

    // 4. Load Manual Payments from localStorage
    try {
      const manualJson = localStorage.getItem('platform_manual_payments');
      if (manualJson) {
        const parsedManual = JSON.parse(manualJson);
        if (Array.isArray(parsedManual)) {
          combinedPayments = [...parsedManual, ...combinedPayments];
        }
      }
    } catch (e) {
      console.error('Error loading manual payments:', e);
    }

    setPayments(combinedPayments);
  };

  // State for Add Manual Payment Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [paymentStep, setPaymentStep] = useState<number>(1);
  const [newPayment, setNewPayment] = useState({
    customerName: '',
    phone: '',
    email: '',
    purpose: 'REQUEST_FEE' as 'MATERIAL_PURCHASE' | 'REQUEST_FEE' | 'BOOKING_ADVANCE',
    amountRupees: '499',
    referenceId: '',
    notes: '',
  });

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(newPayment.amountRupees);
    if (isNaN(amountNum) || amountNum <= 0) {
      error('Please enter a valid payment amount in ₹');
      return;
    }
    const cleanPhone = newPayment.phone.replace(/\D/g, '').slice(-10);
    const formattedPhone = cleanPhone ? `+91 ${cleanPhone}` : '';

    const rec: PaymentRecord = {
      id: `pay-manual-${Date.now()}`,
      paymentCode: `PAY-MANUAL-${Date.now().toString().slice(-4)}`,
      customerName: newPayment.customerName.trim() || 'Homeowner',
      phone: formattedPhone,
      email: newPayment.email.trim() || undefined,
      purpose: newPayment.purpose,
      amountPaise: Math.round(amountNum * 100),
      razorpayOrderId: newPayment.referenceId ? `ref_${newPayment.referenceId}` : `manual_${Date.now()}`,
      razorpayPaymentId: newPayment.referenceId || `utr_${Date.now().toString().slice(-8)}`,
      paymentMethod: 'Bank Transfer / RTGS / Admin Receipt',
      status: 'PAYMENT_SUCCESSFUL',
      createdAt: new Date().toISOString(),
      associatedProject: newPayment.notes || 'Recorded by Admin',
    };

    try {
      const stored = localStorage.getItem('platform_manual_payments');
      const list = stored ? JSON.parse(stored) : [];
      const updated = [rec, ...list];
      localStorage.setItem('platform_manual_payments', JSON.stringify(updated));
      broadcastStoreUpdate('PAYMENTS_UPDATED', rec);
      setPayments((prev) => [rec, ...prev]);
      success(`Payment receipt ${rec.paymentCode} recorded successfully!`);
      setIsAddModalOpen(false);
      setNewPayment({
        customerName: '',
        phone: '',
        email: '',
        purpose: 'REQUEST_FEE',
        amountRupees: '499',
        referenceId: '',
        notes: '',
      });
    } catch (err: any) {
      error(err.message || 'Failed to record payment');
    }
  };

  useEffect(() => {
    loadPayments();
    const interval = setInterval(loadPayments, 30000);
    window.addEventListener('storage', loadPayments);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', loadPayments);
    };
  }, []);

  const handleInitiateRefund = (paymentId: string) => {
    setPayments((prev) =>
      prev.map((p) => (p.id === paymentId ? { ...p, status: 'REFUNDED' } : p))
    );
    if (selectedPayment?.id === paymentId) {
      setSelectedPayment((prev) => (prev ? { ...prev, status: 'REFUNDED' } : null));
    }
    success(`Refund initiated for transaction ${paymentId}. Processing through Razorpay gateway.`);
  };

  // Filtered payments
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      if (purposeFilter !== 'ALL' && p.purpose !== purposeFilter) return false;
      if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesCode = p.paymentCode.toLowerCase().includes(q);
        const matchesName = p.customerName.toLowerCase().includes(q);
        const matchesPhone = p.phone.toLowerCase().includes(q);
        const matchesOrder = p.razorpayOrderId.toLowerCase().includes(q);
        return matchesCode || matchesName || matchesPhone || matchesOrder;
      }
      return true;
    });
  }, [payments, purposeFilter, statusFilter, searchQuery]);

  // Aggregate Stats
  const stats = useMemo(() => {
    const totalRevenue = payments
      .filter((p) => p.status === 'PAYMENT_SUCCESSFUL')
      .reduce((sum, p) => sum + p.amountPaise, 0);

    const materialRevenue = payments
      .filter((p) => p.purpose === 'MATERIAL_PURCHASE' && p.status === 'PAYMENT_SUCCESSFUL')
      .reduce((sum, p) => sum + p.amountPaise, 0);

    const requestFeeRevenue = payments
      .filter((p) => p.purpose === 'REQUEST_FEE' && p.status === 'PAYMENT_SUCCESSFUL')
      .reduce((sum, p) => sum + p.amountPaise, 0);

    return {
      totalRevenue,
      materialRevenue,
      requestFeeRevenue,
      totalCount: payments.length,
      successCount: payments.filter((p) => p.status === 'PAYMENT_SUCCESSFUL').length,
    };
  }, [payments]);

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-navy-950">
            Payments & Financial Ledger
          </h1>
          <p className="text-xs text-slate-500">
            Real-time tracking of customer material purchases, quotation request fees, and gateway settlements.
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="btn-gold px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 self-start sm:self-auto shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>Record Manual Payment / Escrow Receipt</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Revenue Collected</span>
            <CreditCard className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-navy-950 font-display">
            {formatINR(stats.totalRevenue)}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold">
            Across {stats.successCount} successful transactions
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Material Store Sales</span>
            <ShoppingBag className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-950 font-display">
            {formatINR(stats.materialRevenue)}
          </div>
          <div className="text-[11px] text-blue-600 font-semibold">
            Construction supplies & e-commerce
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Quotation Request Fees</span>
            <FileText className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-950 font-display">
            {formatINR(stats.requestFeeRevenue)}
          </div>
          <div className="text-[11px] text-blue-600 font-semibold">
            ₹499 per professional inquiry
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Payment Gateway</span>
            <ShieldCheck className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-700 font-display">
            Razorpay Live
          </div>
          <div className="text-[11px] text-slate-400">100% Escrow & Instant UPI</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by customer name, phone, transaction code, or order ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Purpose Filter */}
          <select
            value={purposeFilter}
            onChange={(e) => setPurposeFilter(e.target.value as any)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none focus:border-blue-600"
          >
            <option value="ALL">All Categories</option>
            <option value="MATERIAL_PURCHASE">🛒 Material Purchases</option>
            <option value="REQUEST_FEE">📋 Quotation Request Fees</option>
            <option value="BOOKING_ADVANCE">🤝 Booking Advances</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none focus:border-blue-600"
          >
            <option value="ALL">All Statuses</option>
            <option value="PAYMENT_SUCCESSFUL">Successful</option>
            <option value="PENDING_COLLECTION">Pending COD</option>
            <option value="REFUNDED">Refunded</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="card overflow-hidden bg-white border border-slate-200 shadow-xs rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px]">
              <tr>
                <th className="p-4">Transaction Code</th>
                <th className="p-4">Customer Details</th>
                <th className="p-4">Purpose</th>
                <th className="p-4">Payment Method & Gateway</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    No transactions matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition">
                    <td className="p-4 font-mono font-bold text-navy-950">
                      <div>{p.paymentCode}</div>
                      <div className="text-[10px] text-slate-400 font-sans mt-0.5">
                        {formatDate(p.createdAt)}
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="font-bold text-slate-900">{p.customerName}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{p.phone}</div>
                    </td>

                    <td className="p-4">
                      {p.purpose === 'MATERIAL_PURCHASE' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 text-[11px] font-bold border border-blue-200">
                          <ShoppingBag className="w-3 h-3 text-blue-600" />
                          Material Purchase
                        </span>
                      ) : p.purpose === 'REQUEST_FEE' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 text-[11px] font-bold border border-blue-200">
                          <FileText className="w-3 h-3 text-blue-600" />
                          Quotation Fee
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Service Booking
                        </span>
                      )}
                      {p.associatedProject && (
                        <div className="text-[10px] text-slate-400 truncate max-w-[160px] mt-0.5">
                          {p.associatedProject}
                        </div>
                      )}
                    </td>

                    <td className="p-4">
                      <div className="font-semibold text-slate-800 text-xs">
                        {p.paymentMethod || 'Razorpay Gateway'}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Ref: {p.razorpayPaymentId}
                      </div>
                    </td>

                    <td className="p-4 font-bold text-navy-950 text-sm">
                      {formatINR(p.amountPaise)}
                    </td>

                    <td className="p-4">
                      {p.status === 'PAYMENT_SUCCESSFUL' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Paid
                        </span>
                      ) : p.status === 'PENDING_COLLECTION' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                          COD Pending
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-800 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                          Refunded
                        </span>
                      )}
                    </td>

                    <td className="p-4 text-right space-y-1">
                      <button
                        onClick={() => setSelectedPayment(p)}
                        className="px-2.5 py-1 text-[11px] font-bold text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg flex items-center gap-1 ml-auto transition"
                      >
                        <Eye className="w-3 h-3 text-blue-600" />
                        <span>View Details</span>
                      </button>

                      {p.status === 'PAYMENT_SUCCESSFUL' && (
                        <button
                          onClick={() => handleInitiateRefund(p.id)}
                          className="px-2.5 py-0.5 text-[10px] font-semibold text-rose-700 hover:text-rose-900 hover:bg-rose-50 rounded flex items-center gap-1 ml-auto transition"
                        >
                          <RotateCcw className="w-2.5 h-2.5" />
                          <span>Issue Refund</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction & Order Breakdown Details Modal */}
      {selectedPayment && (
        <div className="admin-fullscreen-modal fixed inset-0 z-50 overflow-y-auto bg-[#f0f7ff] flex flex-col font-sans animate-in fade-in duration-150">
          {/* Top Luminous Ambient Shining Edge */}
          <div className="h-[2px] bg-gradient-to-r from-transparent via-amber-400 via-sky-400 to-transparent pointer-events-none shrink-0" />

          {/* Sticky Full-Page Header */}
          <div className="sticky top-0 z-40 bg-navy-950 text-white px-4 sm:px-8 py-3.5 border-b border-navy-900 flex items-center justify-between shadow-xl shrink-0">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <button
                onClick={() => setSelectedPayment(null)}
                className="px-3.5 py-2 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs flex items-center gap-2 border border-slate-700/80 hover:border-slate-500 transition group cursor-pointer shrink-0"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="hidden sm:inline">Back to Payments & Transactions</span>
                <span className="sm:hidden">Back</span>
              </button>

              <div className="h-6 w-px bg-slate-700 hidden sm:block shrink-0" />

              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-base font-display shrink-0">
                  <CreditCard className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-black font-display text-white truncate">
                      {selectedPayment.paymentCode}
                    </h2>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        selectedPayment.status === 'COMPLETED'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : selectedPayment.status === 'PENDING'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      }`}
                    >
                      {selectedPayment.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono truncate">
                    Transaction ID: {selectedPayment.id} • {selectedPayment.gateway}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <button
                onClick={() => setSelectedPayment(null)}
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span className="hidden sm:inline">Close</span>
              </button>
            </div>
          </div>

          {/* Full Page Body */}
          <div className="flex-1 max-w-[1500px] w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
            {/* Top 4 KPI Metrics Strip */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-blue-200/80 shadow-xs">
                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Total Amount Paid</span>
                <div className="text-2xl font-black font-display text-navy-950 mt-1">
                  {formatINR(selectedPayment.amountPaise)}
                </div>
                <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">
                  100% Escrow Backed
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-blue-200/80 shadow-xs">
                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Payment Type</span>
                <div className="text-lg font-bold font-display text-blue-700 mt-1">
                  {selectedPayment.type.replace(/_/g, ' ')}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">Platform Settlement Category</div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-blue-200/80 shadow-xs">
                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Settlement Milestone</span>
                <div className="text-lg font-bold font-display text-slate-900 mt-1">
                  {selectedPayment.milestoneName || 'Milestone Stage'}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">Project Phase Disbursal</div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-blue-200/80 shadow-xs">
                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Gateway Channel</span>
                <div className="text-lg font-bold font-display text-navy-950 mt-1">
                  {selectedPayment.gateway}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5 font-mono">{selectedPayment.referenceId || '—'}</div>
              </div>
            </div>

            {/* 2-Column Wide Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column (5 Cols) - Payer & Customer Profile */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-white p-6 rounded-3xl border border-blue-200/80 shadow-xs space-y-4">
                  <h3 className="font-extrabold text-navy-950 text-sm font-display flex items-center gap-2 border-b border-slate-100 pb-3">
                    <User className="w-4 h-4 text-blue-600" />
                    <span>Payer & Customer Information</span>
                  </h3>

                  <div className="space-y-3">
                    <div className="p-3.5 bg-blue-50/50 rounded-2xl border border-blue-100">
                      <span className="text-[10px] text-slate-500 font-bold uppercase block">Customer Full Name</span>
                      <span className="font-bold text-navy-950 text-sm block">
                        {selectedPayment.customerName}
                      </span>
                      <span className="font-mono text-slate-600 text-xs">
                        {selectedPayment.phone}
                      </span>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Project Title</span>
                        <div className="font-bold text-slate-900 text-sm mt-0.5">
                          {selectedPayment.projectTitle}
                        </div>
                      </div>
                      <div className="pt-2 border-t border-slate-200/60 flex justify-between">
                        <span className="text-slate-500">Transaction Date:</span>
                        <span className="font-semibold text-slate-800 font-mono">
                          {formatDate(selectedPayment.paidAt || selectedPayment.createdAt)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Payment Channel:</span>
                        <span className="font-bold text-blue-800">{selectedPayment.gateway}</span>
                      </div>
                    </div>

                    {/* Escrow Release Button */}
                    {selectedPayment.status === 'PENDING' && (
                      <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 space-y-3">
                        <div>
                          <span className="text-[10px] font-bold text-amber-800 uppercase block">Pending Escrow Authorization</span>
                          <p className="text-xs text-amber-900 mt-0.5">
                            Verify project milestone completion and release funds to vendor/contractor escrow account.
                          </p>
                        </div>
                        <button
                          onClick={() => handleUpdateStatus(selectedPayment.id, 'COMPLETED')}
                          className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          <span>Authorize & Complete Disbursal</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column (7 Cols) - Detailed Transaction Audit Breakdown */}
              <div className="lg:col-span-7 space-y-6">
                <div className="bg-white p-6 rounded-3xl border border-blue-200/80 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="font-extrabold text-navy-950 text-sm font-display flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span>Official Transaction Audit Receipt</span>
                    </h3>
                    <span className="font-mono text-xs font-bold text-slate-400">
                      REF: {selectedPayment.referenceId || selectedPayment.paymentCode || '—'}
                    </span>
                  </div>

                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 font-sans">
                    <div className="flex justify-between text-xs text-slate-600">
                      <span>Receipt Voucher Code:</span>
                      <span className="font-mono font-bold text-navy-950">{selectedPayment.paymentCode}</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-600">
                      <span>Customer Phone:</span>
                      <span className="font-mono font-bold text-navy-950">{selectedPayment.phone}</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-600">
                      <span>Milestone Name:</span>
                      <span className="font-semibold text-slate-800">{selectedPayment.milestoneName || 'Milestone Stage'}</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-600">
                      <span>Linked Construction Project:</span>
                      <span className="font-bold text-slate-900">{selectedPayment.projectTitle}</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-600">
                      <span>Payment Gateway / Escrow:</span>
                      <span className="font-mono font-bold text-blue-700">{selectedPayment.gateway}</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-600">
                      <span>Gateway Reference Hash:</span>
                      <span className="font-mono text-[11px] text-slate-500">{selectedPayment.referenceId || '—'}</span>
                    </div>

                    <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                      <span className="font-bold text-slate-900 text-sm">Total Disbursed Amount:</span>
                      <span className="text-emerald-700 font-display font-black text-2xl">
                        {formatINR(selectedPayment.amountPaise)}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-200/80 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-blue-700" />
                      <span className="font-semibold text-blue-950">
                        Authenticated with 256-Bit Escrow Protection
                      </span>
                    </div>
                    <span className="text-[11px] text-blue-700 font-mono font-bold">
                      GharDesign B2B Secure
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Record Manual Payment / Escrow Receipt Modal (Stepper Wizard) */}
      {isAddModalOpen && (
        <div className="admin-fullscreen-modal fixed inset-0 z-50 overflow-y-auto bg-[#f0f7ff] flex flex-col font-sans animate-in fade-in duration-150">
          <div className="h-[2px] bg-gradient-to-r from-transparent via-amber-400 via-sky-400 to-transparent pointer-events-none shrink-0" />
          <div className="sticky top-0 z-40 bg-navy-950 text-white px-4 sm:px-8 py-3.5 border-b border-navy-900 flex items-center justify-between shadow-xl shrink-0">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <button
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setPaymentStep(1);
                }}
                className="px-3.5 py-2 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs flex items-center gap-2 border border-slate-700/80 hover:border-slate-500 transition group cursor-pointer shrink-0"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="hidden sm:inline">Back / Cancel</span>
                <span className="sm:hidden">Back</span>
              </button>
              <div className="h-6 w-px bg-slate-700 hidden sm:block shrink-0" />
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-base font-display shrink-0">
                  <CreditCard className="w-5 h-5 text-blue-400" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base sm:text-lg font-black font-display text-white truncate">
                    Record Manual Payment & Escrow Receipt
                  </h2>
                  <div className="text-[11px] text-slate-400 font-mono truncate">
                    Step {paymentStep} of 3 • Escrow Banking Audit Desk
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setPaymentStep(1);
                }}
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span className="hidden sm:inline">Close</span>
              </button>
            </div>
          </div>

          <div className="flex-1 max-w-[1100px] w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
            {/* Stepper Header */}
            <div className="bg-white rounded-2xl p-4 sm:p-6 border border-blue-200/80 shadow-sm">
              <div className="flex items-center justify-between max-w-xl mx-auto">
                {[
                  { step: 1, title: 'Payer & Purpose', icon: User },
                  { step: 2, title: 'Amount & Banking UTR', icon: CreditCard },
                  { step: 3, title: 'Verify & Issue Receipt', icon: CheckCircle2 },
                ].map((item, idx, arr) => (
                  <div key={item.step} className="flex items-center flex-1 last:flex-none">
                    <button
                      type="button"
                      onClick={() => {
                        if (item.step < paymentStep) setPaymentStep(item.step);
                      }}
                      className="flex flex-col items-center gap-1 group text-center cursor-pointer"
                    >
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xs transition ${
                          paymentStep === item.step
                            ? 'bg-blue-600 text-white shadow-md ring-4 ring-blue-100'
                            : paymentStep > item.step
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-400 border border-slate-200'
                        }`}
                      >
                        {paymentStep > item.step ? (
                          <Check className="w-5 h-5 text-white" />
                        ) : (
                          <item.icon className="w-5 h-5" />
                        )}
                      </div>
                      <span
                        className={`text-[11px] font-bold mt-1 transition ${
                          paymentStep === item.step
                            ? 'text-blue-900'
                            : paymentStep > item.step
                            ? 'text-emerald-700'
                            : 'text-slate-400'
                        }`}
                      >
                        {item.title}
                      </span>
                    </button>
                    {idx < arr.length - 1 && (
                      <div
                        className={`flex-1 h-0.5 mx-3 mb-5 transition ${
                          paymentStep > item.step ? 'bg-emerald-500' : 'bg-slate-200'
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Stepper Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-blue-200/80 shadow-xl">
              <form onSubmit={handleRecordPayment}>
                {/* STEP 1: PAYER & PURPOSE */}
                {paymentStep === 1 && (
                  <div className="space-y-6 animate-in fade-in duration-150">
                    <div className="border-b border-slate-100 pb-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
                        <span>Step 1 of 3</span>
                      </div>
                      <h3 className="text-xl font-bold text-navy-950 font-display">
                        Customer Identification & Transaction Purpose
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Identify customer depositing funds and designate transaction purpose for audit trail.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-1.5 sm:col-span-2">
                        <label className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                          <User className="w-4 h-4 text-blue-600" />
                          <span>Customer Full Name</span>
                          <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder=""
                          value={newPayment.customerName}
                          onChange={(e) => setNewPayment({ ...newPayment, customerName: e.target.value })}
                          className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl font-bold text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-800 text-sm">Customer Mobile Number</label>
                        <input
                          type="tel"
                          maxLength={10}
                          placeholder="10-digit mobile"
                          value={newPayment.phone}
                          onChange={(e) => setNewPayment({ ...newPayment, phone: e.target.value })}
                          className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl font-mono text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-800 text-sm">Official Purpose / Account</label>
                        <select
                          className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl font-bold text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                          value={newPayment.purpose}
                          onChange={(e: any) => setNewPayment({ ...newPayment, purpose: e.target.value })}
                        >
                          <option value="REQUEST_FEE">Quotation Request Fee (₹499)</option>
                          <option value="BOOKING_ADVANCE">Service Booking Milestone / Advance</option>
                          <option value="MATERIAL_PURCHASE">Wholesale Building Material Purchase</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: AMOUNT & BANKING UTR */}
                {paymentStep === 2 && (
                  <div className="space-y-6 animate-in fade-in duration-150">
                    <div className="border-b border-slate-100 pb-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
                        <span>Step 2 of 3</span>
                      </div>
                      <h3 className="text-xl font-bold text-navy-950 font-display">
                        Receipt Value & Corporate Banking Reference
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Enter amount collected and bank reference / IMPS UTR number for account reconciliation.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                          <CreditCard className="w-4 h-4 text-blue-600" />
                          <span>Amount Received (₹)</span>
                          <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-3 text-slate-400 font-bold text-base">₹</span>
                          <input
                            type="number"
                            required
                            min="1"
                            placeholder=""
                            value={newPayment.amountRupees}
                            onChange={(e) => setNewPayment({ ...newPayment, amountRupees: e.target.value })}
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl font-mono text-base font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-800 text-sm">Bank Reference / UTR Number</label>
                        <input
                          type="text"
                          placeholder=""
                          value={newPayment.referenceId}
                          onChange={(e) => setNewPayment({ ...newPayment, referenceId: e.target.value.toUpperCase() })}
                          className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl font-mono uppercase text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>

                      <div className="space-y-1.5 sm:col-span-2">
                        <label className="font-bold text-slate-800 text-sm">Associated Project / Description Notes</label>
                        <input
                          type="text"
                          placeholder=""
                          value={newPayment.notes}
                          onChange={(e) => setNewPayment({ ...newPayment, notes: e.target.value })}
                          className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3: VERIFY & ISSUE RECEIPT */}
                {paymentStep === 3 && (
                  <div className="space-y-6 animate-in fade-in duration-150">
                    <div className="border-b border-slate-100 pb-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
                        <span>Step 3 of 3</span>
                      </div>
                      <h3 className="text-xl font-bold text-navy-950 font-display">
                        Audit Confirmation & Escrow Receipt Issuance
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Review recorded escrow receipt details and broadcast platform ledger update.
                      </p>
                    </div>

                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Customer</span>
                        <p className="text-sm font-bold text-navy-950 mt-0.5">{newPayment.customerName || 'Not Entered'}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Transaction Purpose</span>
                        <p className="text-sm font-bold text-blue-900 mt-0.5">{newPayment.purpose}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Bank UTR Reference</span>
                        <p className="text-xs font-mono font-bold text-slate-800 mt-0.5">{newPayment.referenceId || 'Manual Admin Cash/Cheque'}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Project Note</span>
                        <p className="text-xs font-semibold text-slate-700 mt-0.5">{newPayment.notes || 'Recorded by Admin Desk'}</p>
                      </div>
                    </div>

                    <div className="p-5 bg-navy-950 text-white rounded-2xl flex items-center justify-between shadow-lg">
                      <div>
                        <span className="text-xs text-slate-400 block uppercase font-bold tracking-wider">Total Recorded Escrow Value</span>
                        <span className="text-xs text-slate-300">Method: Bank Transfer / RTGS / Admin Receipt</span>
                      </div>
                      <strong className="text-2xl font-mono font-black text-amber-400">
                        {formatINR(Number(newPayment.amountRupees || 0) * 100)}
                      </strong>
                    </div>
                  </div>
                )}

                {/* Navigation Footer */}
                <div className="flex items-center justify-between gap-3 pt-6 border-t border-slate-200 mt-6">
                  {paymentStep > 1 ? (
                    <button
                      type="button"
                      onClick={() => setPaymentStep(paymentStep - 1)}
                      className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 transition flex items-center gap-2 text-xs cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Previous Step</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsAddModalOpen(false)}
                      className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-600 font-bold hover:bg-slate-100 transition text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}

                  <div className="text-xs text-slate-400 font-mono hidden sm:block">
                    Step {paymentStep} of 3
                  </div>

                  {paymentStep < 3 ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (paymentStep === 1) {
                          if (!newPayment.customerName.trim()) {
                            error('Please enter the customer name');
                            return;
                          }
                        } else if (paymentStep === 2) {
                          const amt = parseFloat(newPayment.amountRupees);
                          if (isNaN(amt) || amt <= 0) {
                            error('Please enter a valid amount');
                            return;
                          }
                        }
                        setPaymentStep(paymentStep + 1);
                      }}
                      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md flex items-center gap-2 text-xs transition cursor-pointer"
                    >
                      <span>Proceed to Step {paymentStep + 1}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md flex items-center gap-2 text-xs transition cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Record Payment & Issue Receipt</span>
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
