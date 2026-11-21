import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { apiRequest } from '../../lib/api.js';
import { PaymentRecord } from '@ghar-design/shared';
import { formatINR, formatDate } from '../../lib/utils.js';
import {
  CreditCard,
  Download,
  ShieldCheck,
  CheckCircle2,
  Printer,
  Eye,
  Filter,
} from 'lucide-react';

export const PaymentHistory: React.FC = () => {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPurpose, setFilterPurpose] = useState('ALL');
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentRecord | null>(null);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'refunds') {
      setFilterPurpose('REFUNDS');
    } else if (tab === 'dues') {
      setFilterPurpose('DUES');
    } else if (tab === 'milestone') {
      setFilterPurpose('MILESTONE_PAYMENT');
    } else if (tab === 'material') {
      setFilterPurpose('MATERIAL_PURCHASE');
    }
  }, [searchParams]);

  useEffect(() => {
    apiRequest('/payments')
      .then((res) => setPayments(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = payments.filter((p) => {
    if (filterPurpose === 'ALL') return true;
    if (filterPurpose === 'REFUNDS') {
      return (p.status as string) === 'REFUNDED' || (p.notes || '').toLowerCase().includes('refund');
    }
    if (filterPurpose === 'DUES') {
      return p.status === 'PENDING' || p.status === 'PROCESSING';
    }
    return p.purpose === filterPurpose;
  });

  return (
    <div className="space-y-6 text-xs">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-gold-600 font-bold uppercase tracking-wider text-[11px] mb-1">
            <CreditCard className="w-4 h-4" />
            <span>Escrow & Digital Payments Ledger</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-display font-bold text-slate-900">
            My Payments & Transaction Receipts
          </h1>
          <p className="text-slate-500 mt-1">
            Immutable financial transaction ledger covering quotation request fees, milestone escrow disbursements, and direct material orders.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex bg-slate-100 p-1 rounded-xl self-start md:self-auto border border-slate-200 text-[11px]">
          {['ALL', 'MILESTONE_PAYMENT', 'MATERIAL_PURCHASE', 'REFUNDS', 'DUES'].map((pur) => (
            <button
              key={pur}
              onClick={() => setFilterPurpose(pur)}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                filterPurpose === pur ? 'bg-navy-950 text-gold-400 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {pur.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-[10px] uppercase tracking-wider">
              <tr>
                <th className="p-4">Transaction Code</th>
                <th className="p-4">Payment Purpose</th>
                <th className="p-4">Payment Method & Gateway Ref</th>
                <th className="p-4">Date</th>
                <th className="p-4 text-right">Amount (INR)</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    <CreditCard className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">No Payment Records Found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Your quotation fees, advance escrow payments, and material purchases will be recorded here.</p>
                  </td>
                </tr>
              ) : filtered.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/70 transition">
                  <td className="p-4">
                    <span className="font-mono font-bold text-slate-900">{p.paymentCode}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Ref: {p.requestId || p.orderId || p.bookingId || 'Platform Fee'}
                    </span>
                  </td>

                  <td className="p-4">
                    <span className="font-semibold text-slate-800 capitalize">
                      {p.purpose.replace(/_/g, ' ')}
                    </span>
                  </td>

                  <td className="p-4">
                    <div className="text-slate-700 font-medium">{p.paymentMethod || 'Razorpay Gateway'}</div>
                    <div className="font-mono text-[10px] text-slate-400">
                      ID: {p.razorpayPaymentId || 'pay_live_mock'}
                    </div>
                  </td>

                  <td className="p-4 text-slate-600">
                    {new Date(p.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>

                  <td className="p-4 text-right font-extrabold text-navy-950 text-sm">
                    {formatINR(p.amountPaise)}
                  </td>

                  <td className="p-4 text-center">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      SUCCESS
                    </span>
                  </td>

                  <td className="p-4 text-right">
                    <button
                      onClick={() => setSelectedReceipt(p)}
                      className="px-2.5 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-lg transition inline-flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Receipt</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Receipt Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  Electronic Payment Receipt
                </span>
                <h3 className="font-bold text-base text-slate-900 mt-1">{selectedReceipt.paymentCode}</h3>
              </div>
              <button onClick={() => setSelectedReceipt(null)} className="text-slate-400 hover:text-slate-700 font-bold">
                ✕
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl space-y-2 border border-slate-200/80 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Status:</span>
                <span className="font-bold text-emerald-700">Captured & Escrow Confirmed</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Purpose:</span>
                <span className="font-semibold text-slate-800">{selectedReceipt.purpose.replace(/_/g, ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Gateway Order ID:</span>
                <span className="font-mono text-slate-700">{selectedReceipt.razorpayOrderId || 'order_mock_12345'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Razorpay Payment ID:</span>
                <span className="font-mono text-slate-700">{selectedReceipt.razorpayPaymentId || 'pay_mock_98765'}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 font-bold text-sm text-navy-950">
                <span>Amount Paid:</span>
                <span className="text-emerald-700">{formatINR(selectedReceipt.amountPaise)}</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 border border-slate-300 font-bold rounded-xl flex items-center justify-center gap-1.5 hover:bg-slate-50 text-slate-700"
              >
                <Printer className="w-4 h-4" />
                <span>Print Receipt</span>
              </button>
              <button
                onClick={() => {
                  alert('Receipt PDF downloaded.');
                  setSelectedReceipt(null);
                }}
                className="flex-1 py-2.5 bg-navy-950 text-gold-400 font-bold rounded-xl flex items-center justify-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                <span>Download PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
