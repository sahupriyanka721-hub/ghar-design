import React, { useState } from 'react';
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
} from 'lucide-react';
import {
  getInteriorInvoices,
  getInteriorPayouts,
  InteriorInvoice,
  InteriorPayoutRequest,
  getInteriorDesignerByPhone,
} from '../../data/interiorDesignerStore.js';
import { useAuth } from '../../context/AuthContext.js';

export const InteriorDesignerBilling: React.FC = () => {
  const { user } = useAuth();
  const designer = user?.phone ? getInteriorDesignerByPhone(user.phone) : null;
  const [invoices, setInvoices] = useState<InteriorInvoice[]>(() => getInteriorInvoices());
  const [payouts, setPayouts] = useState<InteriorPayoutRequest[]>(() => getInteriorPayouts());
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState(200000);

  const totalInvoiced = invoices.reduce((acc, inv) => acc + inv.totalAmount, 0);
  const totalPaidByClients = invoices
    .filter((inv) => inv.status === 'PAID')
    .reduce((acc, inv) => acc + inv.totalAmount, 0);
  const totalDisbursedPayouts = payouts
    .filter((p) => p.status === 'PROCESSED')
    .reduce((acc, p) => acc + p.amount, 0);
  const availableBalance = Math.max(0, totalPaidByClients * 0.95 - totalDisbursedPayouts);

  const handleRequestPayout = (e: React.FormEvent) => {
    e.preventDefault();
    const newReq: InteriorPayoutRequest = {
      id: `pay-${Date.now()}`,
      requestId: `BG-PAY-${Math.floor(1000 + Math.random() * 9000)}`,
      designerId: designer?.id || 'id-101',
      amount: payoutAmount,
      bankAccount: designer?.bankDetails
        ? `${designer.bankDetails.bankName} - ${designer.bankDetails.accountNumber}`
        : 'HDFC Bank - 50200084729182',
      ifsc: designer?.bankDetails?.ifscCode || 'HDFC0000421',
      status: 'PENDING_ADMIN_APPROVAL',
      requestedAt: new Date().toISOString(),
    };

    const updated = [newReq, ...payouts];
    setPayouts(updated);
    try {
      localStorage.setItem('gd_interior_payouts_v1', JSON.stringify(updated));
    } catch (e) {}

    setIsPayoutModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold mb-2">
            <CreditCard className="w-3.5 h-3.5 text-blue-600" />
            <span>Milestone Escrow Payouts & Invoicing</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            Billing & Payouts
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Track client milestone invoice releases, escrow settlements, and request bank payouts.
          </p>
        </div>

        <button
          onClick={() => setIsPayoutModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition"
        >
          <Landmark className="w-4 h-4" />
          <span>Request Payout Settlement</span>
        </button>
      </div>

      {/* Financial Ledger Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="text-slate-500 text-xs font-semibold">Total Invoiced</div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            ₹{(totalInvoiced / 100000).toFixed(1)}L
          </div>
          <div className="text-[11px] text-blue-600 font-bold mt-1">Total Generated Invoices</div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="text-slate-500 text-xs font-semibold">Client Escrow Paid</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            ₹{(totalPaidByClients / 100000).toFixed(1)}L
          </div>
          <div className="text-[11px] text-emerald-700 font-bold mt-1">100% Verified Escrow</div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="text-slate-500 text-xs font-semibold">Settled to Bank</div>
          <div className="text-2xl font-black text-blue-600 mt-1">
            ₹{(totalDisbursedPayouts / 100000).toFixed(1)}L
          </div>
          <div className="text-[11px] text-slate-500 mt-1">UTR Confirmed</div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="text-slate-500 text-xs font-semibold">Available for Payout</div>
          <div className="text-2xl font-black text-blue-600 mt-1">
            ₹{(availableBalance / 100000).toFixed(2)}L
          </div>
          <div className="text-[11px] text-blue-700 font-bold mt-1">Eligible for Withdrawal</div>
        </div>
      </div>

      {/* Invoices List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <span className="font-black text-sm text-slate-900">
              Tax Invoices & Milestone Billing ({invoices.length})
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] font-black uppercase text-slate-500 tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-4">Invoice # & Date</th>
                <th className="p-4">Project & Client</th>
                <th className="p-4">Milestone Description</th>
                <th className="p-4 text-right">Taxable</th>
                <th className="p-4 text-right">GST (18%)</th>
                <th className="p-4 text-right">Grand Total</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-4">
                    <div className="font-mono font-bold text-slate-900">{inv.invoiceNumber}</div>
                    <div className="text-[11px] text-slate-400">{inv.date}</div>
                  </td>
                  <td className="p-4">
                    <div className="font-black text-slate-900">{inv.projectName}</div>
                    <div className="text-[11px] text-blue-700 font-semibold">{inv.clientName}</div>
                  </td>
                  <td className="p-4 max-w-xs text-[11px] text-slate-600">
                    {inv.milestoneName}
                  </td>
                  <td className="p-4 text-right font-mono text-slate-700">
                    ₹{inv.amount.toLocaleString('en-IN')}
                  </td>
                  <td className="p-4 text-right font-mono text-slate-500">
                    ₹{inv.taxAmount.toLocaleString('en-IN')}
                  </td>
                  <td className="p-4 text-right font-mono font-black text-blue-700 text-sm">
                    ₹{inv.totalAmount.toLocaleString('en-IN')}
                  </td>
                  <td className="p-4 text-center">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        inv.status === 'PAID'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button className="p-2 rounded-xl text-slate-500 hover:text-blue-700 hover:bg-blue-50 transition">
                      <Download className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payout History */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Landmark className="w-4 h-4 text-blue-600" />
            <span className="font-black text-sm text-slate-900">
              Direct Bank Settlement History
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] font-black uppercase text-slate-500 tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-4">Request ID</th>
                <th className="p-4">Settlement Bank & IFSC</th>
                <th className="p-4">Amount</th>
                <th className="p-4">UTR Reference</th>
                <th className="p-4">Requested / Settled</th>
                <th className="p-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payouts.map((pay) => (
                <tr key={pay.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-4 font-mono font-bold text-slate-900">{pay.requestId}</td>
                  <td className="p-4">
                    <div className="font-semibold text-slate-800">{pay.bankAccount}</div>
                    <div className="text-[11px] text-slate-400 font-mono">IFSC: {pay.ifsc}</div>
                  </td>
                  <td className="p-4 font-mono font-black text-emerald-700 text-sm">
                    ₹{pay.amount.toLocaleString('en-IN')}
                  </td>
                  <td className="p-4 font-mono text-slate-600">
                    {pay.utrNumber || 'Pending Gateway Dispatch'}
                  </td>
                  <td className="p-4 text-slate-500 text-[11px]">
                    <div>Req: {pay.requestedAt.slice(0, 10)}</div>
                    {pay.processedAt && <div>Set: {pay.processedAt.slice(0, 10)}</div>}
                  </td>
                  <td className="p-4 text-center">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        pay.status === 'PROCESSED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {pay.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payout Request Modal */}
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
                <div className="flex items-center gap-2 text-blue-800 font-black text-base">
                  <Landmark className="w-5 h-5 text-blue-600" />
                  <span>Request Bank Settlement</span>
                </div>
                <button
                  onClick={() => setIsPayoutModalOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleRequestPayout} className="space-y-4 mt-4 text-xs">
                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-navy-950">
                  <div className="text-xs font-bold text-blue-700">Verified Bank Account:</div>
                  <div className="font-black text-slate-900 mt-1">
                    {designer?.bankDetails?.bankName || 'HDFC Bank - DLF Golf Course Road'}
                  </div>
                  <div className="font-mono text-xs text-slate-600">
                    A/C: {designer?.bankDetails?.accountNumber || '50200084729182'} • IFSC:{' '}
                    {designer?.bankDetails?.ifscCode || 'HDFC0000421'}
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">
                    Settlement Amount (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1000}
                    max={Math.max(500000, availableBalance)}
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(Number(e.target.value))}
                    className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 font-mono font-bold text-base"
                  />
                  <div className="text-[11px] text-slate-500 mt-1">
                    Available balance for immediate settlement: ₹{availableBalance.toLocaleString('en-IN')}
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsPayoutModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm transition"
                  >
                    Confirm Withdrawal
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
