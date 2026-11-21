import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext.js';
import { formatINR, formatDate } from '../../lib/utils.js';
import {
  getVendorPayouts,
  getVendorOrders,
  getVendorByPhone,
  VendorCommissionPayout,
} from '../../data/vendorStore.js';
import {
  CreditCard,
  IndianRupee,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Building,
  HelpCircle,
  FileText,
  Download,
  AlertCircle,
  Wallet,
  Sparkles,
  Search,
  Filter,
  Receipt,
  Landmark,
  ArrowDownLeft,
  X,
} from 'lucide-react';

export const VendorPayments: React.FC = () => {
  const { user } = useAuth();

  const currentVendor = useMemo(() => {
    if (!user?.phone) return null;
    return getVendorByPhone(user.phone) || null;
  }, [user?.phone]);

  const [payouts, setPayouts] = useState<VendorCommissionPayout[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'SETTLEMENTS' | 'COD_RECONCILIATION' | 'COMMISSION_POLICY'>('SETTLEMENTS');
  const [search, setSearch] = useState('');

  const loadFinancialData = () => {
    const p = getVendorPayouts(currentVendor?.id);
    setPayouts(p);
    const ords = getVendorOrders(currentVendor?.phone || currentVendor?.id);
    setOrders(ords);
  };

  useEffect(() => {
    loadFinancialData();
    const interval = setInterval(loadFinancialData, 4000);
    return () => clearInterval(interval);
  }, [currentVendor?.id, currentVendor?.phone]);

  // Aggregate gross sales from orders
  const grossSalesPaise = useMemo(() => {
    return orders.reduce((sum, o) => {
      if (o.fulfillmentStatus === 'CANCELLED') return sum;
      return sum + (o.totalAmountPaise || 0);
    }, 0);
  }, [orders]);

  // Platform Commission is Admin-configured (e.g. 5%)
  const commissionRatePercent = currentVendor?.commissionRatePercent ?? 5;
  const platformCommissionPaise = Math.round((grossSalesPaise * commissionRatePercent) / 100);

  // TDS / TCS under GST (1%)
  const taxDeductedPaise = Math.round((grossSalesPaise * 1) / 100);

  // Net Vendor Earnings
  const netEarningsPaise = grossSalesPaise - platformCommissionPaise - taxDeductedPaise;

  // Paid vs Pending
  const settledAmountPaise = useMemo(() => {
    return payouts
      .filter((p) => p.status === 'SETTLED' || p.status === 'COMPLETED')
      .reduce((sum, p) => sum + (p.netAmountPaise || 0), 0);
  }, [payouts]);

  const pendingSettlementPaise = Math.max(0, netEarningsPaise - settledAmountPaise);

  // COD orders
  const codOrders = useMemo(() => {
    return orders.filter((o) => o.paymentMethod === 'COD');
  }, [orders]);

  // Download Financial Statement CSV
  const handleDownloadStatementCSV = () => {
    const headers = [
      'Settlement ID',
      'Date',
      'Order Ref',
      'Gross Amount (INR)',
      'Commission (INR)',
      'TDS/TCS (INR)',
      'Net Payable (INR)',
      'Bank UTR Number',
      'Status',
    ];

    const rows = payouts.map((p) => [
      p.id,
      formatDate(p.createdAt),
      p.orderId || 'BATCH_PAYOUT',
      ((p.grossAmountPaise || 0) / 100).toFixed(2),
      ((p.commissionPaise || 0) / 100).toFixed(2),
      ((p.taxPaise || 0) / 100).toFixed(2),
      ((p.netAmountPaise || 0) / 100).toFixed(2),
      p.bankUtr || p.utrNumber || 'PENDING',
      p.status,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `BuildGhar_Settlement_Statement_${currentVendor?.id || 'vendor'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-blue-200/80/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-500/10 text-emerald-700 rounded-xl">
              <CreditCard className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black font-display text-navy-950">
              Payment & Settlement Management
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Transparent revenue ledgers, commission breakdowns, bank UTR transfer logs and statement exports.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleDownloadStatementCSV}
            className="px-3.5 py-2 bg-sky-50/30 hover:bg-slate-100 text-slate-700 border border-blue-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Download Statement (CSV)</span>
          </button>
        </div>
      </div>

      {/* Financial Overview 4 Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 bg-white rounded-2xl border border-blue-200/80 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Gross Sales</span>
          <div className="text-2xl font-black font-display text-navy-950">{formatINR(grossSalesPaise)}</div>
          <span className="text-[10px] text-slate-400">Total customer order payments</span>
        </div>

        <div className="p-4 bg-amber-50/70 rounded-2xl border border-blue-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">
            Platform Commission ({commissionRatePercent}%)
          </span>
          <div className="text-2xl font-black font-display text-amber-700">{formatINR(platformCommissionPaise)}</div>
          <span className="text-[10px] text-amber-800 font-semibold">Admin configured marketplace fee</span>
        </div>

        <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">Already Settled</span>
          <div className="text-2xl font-black font-display text-emerald-700">{formatINR(settledAmountPaise)}</div>
          <span className="text-[10px] text-emerald-800 font-semibold">Credited to registered bank account</span>
        </div>

        <div className="p-4 bg-navy-950 text-white rounded-2xl shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Pending Settlement</span>
          <div className="text-2xl font-black font-display text-amber-400">{formatINR(pendingSettlementPaise)}</div>
          <span className="text-[10px] text-slate-300">Under 48hr delivery audit hold</span>
        </div>
      </div>

      {/* Bank Account Details Card */}
      <div className="p-4 bg-gradient-to-r from-slate-900 to-navy-950 text-white rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-navy-800 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
            <Landmark className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              REGISTERED SETTLEMENT BANK ACCOUNT
            </span>
            <div className="text-sm font-bold text-white">
              {currentVendor?.bankDetails?.bankName || 'HDFC Bank Ltd.'} - A/C No:{' '}
              <span className="font-mono text-amber-400">
                {currentVendor?.bankDetails?.accountNumber
                  ? `•••• •••• ${currentVendor.bankDetails.accountNumber.slice(-4)}`
                  : '•••• •••• 9821'}
              </span>
            </div>
            <div className="text-[11px] text-slate-300 font-mono mt-0.5">
              IFSC: {currentVendor?.bankDetails?.ifscCode || 'HDFC0001234'} | Branch:{' '}
              {currentVendor?.bankDetails?.branchName || 'Nehru Place, New Delhi'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-bold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Penny Drop Verified</span>
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white p-4 rounded-2xl border border-blue-200/80/90 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <button
            onClick={() => setActiveTab('SETTLEMENTS')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'SETTLEMENTS'
                ? 'bg-navy-950 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Bank Settlement Ledger ({payouts.length})
          </button>
          <button
            onClick={() => setActiveTab('COD_RECONCILIATION')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'COD_RECONCILIATION'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-800 border border-blue-200 hover:bg-amber-100'
            }`}
          >
            COD Cash Reconciliation ({codOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('COMMISSION_POLICY')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'COMMISSION_POLICY'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100'
            }`}
          >
            Commission Policy & Rules
          </button>
        </div>

        {/* Tab 1: Settlements Table */}
        {activeTab === 'SETTLEMENTS' && (
          <div className="overflow-x-auto rounded-xl border border-blue-200/80">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-sky-50/30 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-blue-200/80">
                <tr>
                  <th className="py-3 px-3.5">Settlement Ref</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Order / Batch</th>
                  <th className="py-3 px-3 text-right">Gross Sales</th>
                  <th className="py-3 px-3 text-right">Commission</th>
                  <th className="py-3 px-3 text-right">TDS / Deductions</th>
                  <th className="py-3 px-3 text-right">Net Transferred</th>
                  <th className="py-3 px-3">Bank UTR Ref</th>
                  <th className="py-3 px-3.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payouts.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      <Wallet className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="font-bold text-slate-600">No bank settlements recorded yet.</p>
                      <p className="text-[11px] mt-0.5">As customer orders are delivered, settlement entries appear here.</p>
                    </td>
                  </tr>
                ) : (
                  payouts.map((p) => {
                    const isSettled = p.status === 'SETTLED' || p.status === 'COMPLETED';

                    return (
                      <tr key={p.id} className="hover:bg-blue-50/70 transition">
                        <td className="py-3 px-3.5 font-mono font-bold text-slate-900 text-[11px]">
                          {p.id}
                        </td>

                        <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">
                          {formatDate(p.createdAt)}
                        </td>

                        <td className="py-3 px-3 font-mono font-bold text-blue-700">
                          {p.orderId || 'BATCH_PAYOUT'}
                        </td>

                        <td className="py-3 px-3 text-right font-mono text-slate-900">
                          {formatINR(p.grossAmountPaise)}
                        </td>

                        <td className="py-3 px-3 text-right font-mono text-amber-700">
                          -{formatINR(p.commissionPaise)}
                        </td>

                        <td className="py-3 px-3 text-right font-mono text-slate-500">
                          -{formatINR(p.taxPaise || 0)}
                        </td>

                        <td className="py-3 px-3 text-right font-mono font-black text-emerald-700 text-sm">
                          {formatINR(p.netAmountPaise)}
                        </td>

                        <td className="py-3 px-3 font-mono text-slate-600 text-[11px]">
                          {p.bankUtr || p.utrNumber ? (
                            <span className="bg-slate-100 px-2 py-0.5 rounded font-bold text-slate-800">
                              {p.bankUtr || p.utrNumber}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Processing batch</span>
                          )}
                        </td>

                        <td className="py-3 px-3.5 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              isSettled
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-amber-100 text-amber-800 border border-blue-200'
                            }`}
                          >
                            {isSettled ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                            <span>{p.status}</span>
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: COD Cash Reconciliation */}
        {activeTab === 'COD_RECONCILIATION' && (
          <div className="space-y-3">
            <div className="p-3.5 bg-amber-50 rounded-xl border border-blue-200 text-xs text-amber-950 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Cash on Delivery (COD) Reconciliation Policy:</strong>
                <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                  For self-delivered COD orders, cash is directly collected by the depot driver from the customer. The
                  applicable BuildGhar platform commission is automatically deducted from your upcoming prepaid payouts.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-blue-200/80">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-sky-50/30 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-blue-200/80">
                  <tr>
                    <th className="py-3 px-3.5">Order Ref</th>
                    <th className="py-3 px-3">Customer</th>
                    <th className="py-3 px-3 text-right">Cash Amount Collected</th>
                    <th className="py-3 px-3 text-right">Commission to Remit</th>
                    <th className="py-3 px-3 text-center">Delivery Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {codOrders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400">
                        No Cash on Delivery orders recorded.
                      </td>
                    </tr>
                  ) : (
                    codOrders.map((cord) => (
                      <tr key={cord.id}>
                        <td className="py-3 px-3.5 font-mono font-bold text-slate-900">{cord.orderCode}</td>
                        <td className="py-3 px-3">{cord.customerName}</td>
                        <td className="py-3 px-3 text-right font-mono font-bold">{formatINR(cord.totalAmountPaise)}</td>
                        <td className="py-3 px-3 text-right font-mono text-amber-700 font-bold">
                          {formatINR(Math.round((cord.totalAmountPaise * commissionRatePercent) / 100))}
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-slate-800">{cord.fulfillmentStatus}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Commission Policy */}
        {activeTab === 'COMMISSION_POLICY' && (
          <div className="p-5 bg-sky-50/30 rounded-xl border border-blue-200/80 space-y-4 text-xs">
            <h3 className="text-sm font-bold text-navy-950">BuildGhar Platform Commission Structure</h3>
            <p className="text-slate-600 leading-relaxed">
              Commission rates are centrally configured by BuildGhar Platform Administrators based on material category,
              volume agreements, and verified seller tier. Vendors cannot independently alter agreed commission tiers.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-white rounded-xl border border-blue-200/80">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">CEMENT & SAND</span>
                <div className="text-lg font-black text-navy-950 mt-1">3% - 5%</div>
                <span className="text-[10px] text-slate-500">Low-margin high-bulk commodities</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-blue-200/80">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">STEEL & REBAR</span>
                <div className="text-lg font-black text-navy-950 mt-1">2.5% - 4%</div>
                <span className="text-[10px] text-slate-500">TMT Primary brand wholesale</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-blue-200/80">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">TILES, BATH & PAINTS</span>
                <div className="text-lg font-black text-navy-950 mt-1">8% - 12%</div>
                <span className="text-[10px] text-slate-500">Finishes & architectural materials</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
