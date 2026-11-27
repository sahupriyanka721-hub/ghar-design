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
  Layers,
  Receipt,
  FileCheck2,
  AlertCircle,
  HelpCircle,
  Info,
  Calendar,
  Check,
  Printer,
} from 'lucide-react';
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
} from '../../data/interiorDesignerStore.js';
import { useAuth } from '../../context/AuthContext.js';

export const InteriorDesignerBilling: React.FC = () => {
  const { user } = useAuth();
  const designer = user?.phone ? getInteriorDesignerByPhone(user.phone) : null;

  const [activeTab, setActiveTab] = useState<'PAYOUTS' | 'INVOICES' | 'LEDGER' | 'SCHEDULE'>('PAYOUTS');
  const [invoices, setInvoices] = useState<InteriorInvoice[]>(() => getInteriorInvoices());
  const [payouts, setPayouts] = useState<InteriorPayoutRequest[]>(() => getInteriorPayouts());
  const [ledgerEntries, setLedgerEntries] = useState<InteriorLedgerEntry[]>(() => getInteriorLedger());
  const [milestones] = useState(() => getInteriorProjectMilestones('prj-int-1'));

  // Modals
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [selectedInvoiceForReceipt, setSelectedInvoiceForReceipt] = useState<InteriorInvoice | null>(null);
  const [payoutAmount, setPayoutAmount] = useState(244036);
  const [payoutMilestoneId, setPayoutMilestoneId] = useState('BG-MS-INT-102');

  const totalInvoiced = invoices.reduce((acc, inv) => acc + inv.totalAmount, 0);
  const totalPaidByClients = invoices
    .filter((inv) => inv.status === 'PAID')
    .reduce((acc, inv) => acc + inv.totalAmount, 0);
  const totalDisbursedPayouts = payouts
    .filter((p) => p.status === 'PROCESSED')
    .reduce((acc, p) => acc + (p.netPayable || p.amount), 0);
  const availableBalance = Math.max(0, totalPaidByClients * 0.9 - totalDisbursedPayouts);

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
      projectId: 'prj-int-1',
      projectName: 'DLF The Crest Penthouse Oasis',
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
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold mb-2">
            <CreditCard className="w-3.5 h-3.5 text-blue-600" />
            <span>Section 14 Governance: Centralized Escrow Settlement & Payout Desk</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            Billing, Financial Ledger & Payouts
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Customer $\rightarrow$ BuildGhar Platform Escrow $\rightarrow$ Admin Verification $\rightarrow$ Direct Bank Payouts.
          </p>
        </div>

        <button
          onClick={() => setIsPayoutModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition shrink-0"
        >
          <Landmark className="w-4 h-4" />
          <span>Request Payout Settlement</span>
        </button>
      </div>

      {/* Governance Banner (Section 14 Financial Safety) */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-5 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm border border-blue-800/40">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-blue-500/20 rounded-xl text-blue-300 shrink-0">
            <ShieldCheck className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-sm uppercase tracking-wider text-blue-300">
                Rule 14 Centralized Financial Architecture
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                Direct Client Payments Prohibited
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
              All client milestone funds flow into BuildGhar verified platform escrow accounts. Admin reconciles collections and authorizes bank disbursements. Architect and Interior Designer funds are strictly segregated with immutable ledger accounting.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 font-mono text-xs bg-white/10 px-3 py-1.5 rounded-xl border border-white/15">
          🔒 Section 14 & 23 Test 9 Compliant
        </div>
      </div>

      {/* Financial Ledger Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="text-slate-500 text-xs font-semibold">Total Invoiced</div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            ₹{totalInvoiced.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-blue-600 font-bold mt-1">Milestone Tax Invoices</div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="text-slate-500 text-xs font-semibold">Client Escrow Paid</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            ₹{totalPaidByClients.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-emerald-700 font-bold mt-1">100% Platform Verified</div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="text-slate-500 text-xs font-semibold">Settled to Bank</div>
          <div className="text-2xl font-black text-blue-600 mt-1">
            ₹{totalDisbursedPayouts.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">UTR Confirmed</div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="text-slate-500 text-xs font-semibold">Available for Payout</div>
          <div className="text-2xl font-black text-indigo-700 mt-1">
            ₹{availableBalance.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-indigo-700 font-bold mt-1">Net Eligible for Withdrawal</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-2xl p-2.5 border border-slate-200 shadow-2xs flex items-center gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('PAYOUTS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
            activeTab === 'PAYOUTS'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Landmark className="w-3.5 h-3.5" />
          <span>Designer Payouts (Section 14 Step 8)</span>
        </button>
        <button
          onClick={() => setActiveTab('INVOICES')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
            activeTab === 'INVOICES'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Tax Invoices & Collections ({invoices.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('LEDGER')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
            activeTab === 'LEDGER'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Platform Financial Ledger ({ledgerEntries.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('SCHEDULE')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
            activeTab === 'SCHEDULE'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Payment Schedule (Section 14 Step 1)</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: DESIGNER PAYOUT VISIBILITY (SECTION 14 STEP 8) */}
      {/* ============================================================== */}
      {activeTab === 'PAYOUTS' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                <Landmark className="w-4 h-4 text-blue-600" />
                <span>Interior Designer Payout Visibility Table</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Full breakdown showing Gross Milestone, 10% Platform Commission, 1% TDS, Net Disbursed, and Bank UTR Reference.
              </p>
            </div>
            <span className="text-xs font-mono font-bold bg-slate-100 px-3 py-1 rounded-full text-slate-700">
              {payouts.length} Disbursements
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-black uppercase text-slate-500 tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-4">Payout ID</th>
                  <th className="p-4">Project & Milestone</th>
                  <th className="p-4 text-right">Gross Amount</th>
                  <th className="p-4 text-right">Commission (10%)</th>
                  <th className="p-4 text-right">TDS (1%)</th>
                  <th className="p-4 text-right">Net Payable</th>
                  <th className="p-4">Bank Account</th>
                  <th className="p-4">Date & UTR Ref</th>
                  <th className="p-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payouts.map((pay) => (
                  <tr key={pay.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-4 font-mono font-bold text-slate-900">
                      {pay.requestId || pay.id}
                    </td>
                    <td className="p-4">
                      <div className="font-black text-slate-900">{pay.projectName}</div>
                      <div className="text-[11px] text-blue-700 font-medium">{pay.milestoneName}</div>
                    </td>
                    <td className="p-4 text-right font-mono text-slate-800">
                      ₹{(pay.grossAmount || pay.amount).toLocaleString('en-IN')}
                    </td>
                    <td className="p-4 text-right font-mono text-rose-600">
                      -₹{(pay.platformCommission || Math.round(pay.amount * 0.1)).toLocaleString('en-IN')}
                    </td>
                    <td className="p-4 text-right font-mono text-amber-700">
                      -₹{(pay.tdsDeduction || Math.round(pay.amount * 0.01)).toLocaleString('en-IN')}
                    </td>
                    <td className="p-4 text-right font-mono font-black text-emerald-700 text-sm">
                      ₹{(pay.netPayable || pay.amount).toLocaleString('en-IN')}
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-slate-800">{pay.bankAccount}</div>
                      <div className="text-[11px] text-slate-400 font-mono">IFSC: {pay.ifsc}</div>
                    </td>
                    <td className="p-4 font-mono text-[11px]">
                      <div className="text-slate-700 font-bold">
                        {pay.utrNumber || 'Pending Dispatch'}
                      </div>
                      <div className="text-slate-400">
                        {pay.processedAt ? pay.processedAt.slice(0, 10) : pay.requestedAt.slice(0, 10)}
                      </div>
                    </td>
                    <td className="p-4 text-center">
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: INVOICES & ESCROW COLLECTIONS */}
      {/* ============================================================== */}
      {activeTab === 'INVOICES' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Tax Invoices & Client Escrow Collections</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Formal GST tax invoices generated per milestone sign-off with customer gateway verification.
              </p>
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
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => setSelectedInvoiceForReceipt(inv)}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs transition flex items-center gap-1 ml-auto"
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

      {/* ============================================================== */}
      {/* TAB 3: IMMUTABLE FINANCIAL LEDGER */}
      {/* ============================================================== */}
      {activeTab === 'LEDGER' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                <span>Immutable Financial Ledger (Double-Entry Platform Book)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Audit trail of collections, commission fees, and payouts. Reversal entries maintain non-destructive accounting.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-black uppercase text-slate-500 tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-4">Entry ID & Date</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Description & Project</th>
                  <th className="p-4 text-right">Debit</th>
                  <th className="p-4 text-right">Credit</th>
                  <th className="p-4 text-right">Running Balance</th>
                  <th className="p-4">Reference Number</th>
                  <th className="p-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ledgerEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-4">
                      <div className="font-mono font-bold text-slate-900">{entry.id}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {new Date(entry.entryDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          entry.type === 'COLLECTION'
                            ? 'bg-emerald-100 text-emerald-800'
                            : entry.type === 'PAYOUT'
                            ? 'bg-blue-100 text-blue-800'
                            : entry.type === 'REVERSAL'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {entry.type}
                      </span>
                    </td>
                    <td className="p-4 max-w-sm">
                      <div className="font-semibold text-slate-800">{entry.description}</div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">{entry.projectName}</div>
                    </td>
                    <td className="p-4 text-right font-mono text-rose-600 font-semibold">
                      {entry.debit > 0 ? `₹${entry.debit.toLocaleString('en-IN')}` : '-'}
                    </td>
                    <td className="p-4 text-right font-mono text-emerald-700 font-semibold">
                      {entry.credit > 0 ? `₹${entry.credit.toLocaleString('en-IN')}` : '-'}
                    </td>
                    <td className="p-4 text-right font-mono font-black text-slate-900">
                      ₹{entry.balance.toLocaleString('en-IN')}
                    </td>
                    <td className="p-4 font-mono text-[11px] text-slate-600">
                      {entry.referenceNumber}
                    </td>
                    <td className="p-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          entry.status === 'RECONCILED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : entry.status === 'REVERSED'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
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

      {/* ============================================================== */}
      {/* TAB 4: APPROVED PAYMENT SCHEDULE (SECTION 14 STEP 1) */}
      {/* ============================================================== */}
      {activeTab === 'SCHEDULE' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span>Contractual Milestone Payment Schedule (Section 14 Step 1)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Defined per accepted quotation BG-Q-INT-101. Linked to engineering deliverables and stage gates.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-black uppercase text-slate-500 tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-4">Stage</th>
                  <th className="p-4">Milestone Name & Scope</th>
                  <th className="p-4 text-center">Weight</th>
                  <th className="p-4">Due Date</th>
                  <th className="p-4 text-right">Fee Amount</th>
                  <th className="p-4 text-right">GST (18%)</th>
                  <th className="p-4 text-right">Net Designer Share</th>
                  <th className="p-4 text-center">Stage Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {milestones.map((m) => {
                  const fee = m.targetAmount;
                  const gst = Math.round(fee * 0.18);
                  const netShare = Math.round(fee * 0.89); // after 10% commission + 1% TDS
                  return (
                    <tr key={m.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-4 font-mono font-bold text-slate-900">Stage {m.order}</td>
                      <td className="p-4">
                        <div className="font-black text-slate-900">{m.name}</div>
                        <div className="text-[11px] text-slate-500 max-w-md">{m.description}</div>
                      </td>
                      <td className="p-4 text-center font-mono font-bold text-blue-700">
                        {m.weightPercent}%
                      </td>
                      <td className="p-4 font-mono text-slate-600">{m.dueDate}</td>
                      <td className="p-4 text-right font-mono font-bold text-slate-900">
                        ₹{fee.toLocaleString('en-IN')}
                      </td>
                      <td className="p-4 text-right font-mono text-slate-500">
                        ₹{gst.toLocaleString('en-IN')}
                      </td>
                      <td className="p-4 text-right font-mono font-black text-emerald-700">
                        ₹{netShare.toLocaleString('en-IN')}
                      </td>
                      <td className="p-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            m.status === 'ADMIN_VERIFIED_COMPLETED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : m.status === 'FORWARDED_TO_CUSTOMER'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {m.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
                  <span>Request Bank Settlement (Section 14 Step 7)</span>
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
                    {designer?.bankDetails?.ifscCode || 'HDFC0001234'}
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">
                    Select Completed Milestone for Settlement *
                  </label>
                  <select
                    value={payoutMilestoneId}
                    onChange={(e) => setPayoutMilestoneId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 font-semibold"
                  >
                    <option value="BG-MS-INT-102">
                      Stage 2: 2D Working CAD Drawings & MEP Schedule (₹2,74,198)
                    </option>
                    <option value="BG-MS-INT-103">
                      Stage 3: 3D Visualizations & Material Schedule (₹3,25,000)
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">
                    Gross Settlement Amount (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1000}
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(Number(e.target.value))}
                    className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 font-mono font-bold text-base"
                  />
                  <div className="text-[11px] text-slate-500 mt-1">
                    Calculated Net: ₹{Math.round(payoutAmount * 0.89).toLocaleString()} (after 10% platform fee + 1% TDS).
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
                    Confirm Settlement Request
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Invoice Receipt Modal */}
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
                <div className="flex items-center gap-2 text-blue-900 font-black text-base">
                  <Receipt className="w-5 h-5 text-blue-600" />
                  <span>Tax Invoice & Payment Receipt</span>
                </div>
                <button
                  onClick={() => setSelectedInvoiceForReceipt(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
                <div className="flex justify-between font-bold text-slate-800">
                  <span>Invoice: {selectedInvoiceForReceipt.invoiceNumber}</span>
                  <span className="text-emerald-700">PAID & VERIFIED</span>
                </div>
                <div className="text-slate-500">Date: {selectedInvoiceForReceipt.date}</div>
                <div className="text-slate-700 font-bold pt-1">{selectedInvoiceForReceipt.projectName}</div>
                <div className="text-slate-600">Client: {selectedInvoiceForReceipt.clientName}</div>
                <div className="text-slate-600">Milestone: {selectedInvoiceForReceipt.milestoneName}</div>
                <div className="pt-2 border-t border-slate-200 flex justify-between font-mono">
                  <span>Taxable Value:</span>
                  <span>₹{selectedInvoiceForReceipt.amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-mono text-slate-500">
                  <span>GST (18%):</span>
                  <span>₹{selectedInvoiceForReceipt.taxAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-mono font-black text-sm text-blue-900 pt-1 border-t border-slate-200">
                  <span>Total Amount Paid:</span>
                  <span>₹{selectedInvoiceForReceipt.totalAmount.toLocaleString()}</span>
                </div>
                {selectedInvoiceForReceipt.paymentGatewayRef && (
                  <div className="text-[11px] text-slate-400 font-mono pt-1">
                    Gateway Ref: {selectedInvoiceForReceipt.paymentGatewayRef}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Receipt</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
