import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { Badge } from '../../components/common/Badge.js';
import { formatINR, formatDate } from '../../lib/utils.js';
import {
  CreditCard,
  TrendingUp,
  Receipt,
  Download,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Building,
  PlusCircle,
  FileCheck2,
  X,
  Wallet,
  AlertCircle,
} from 'lucide-react';
import {
  getProfessionalPayoutRequests,
  createProfessionalPayoutRequest,
  ProfessionalPayoutRequest,
  getProfessionalByPhone,
} from '../../data/professionalStore.js';
import { getExecutionProjects } from '../../data/projectExecutionStore.js';

export const ProfessionalBilling: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [payouts, setPayouts] = useState<ProfessionalPayoutRequest[]>([]);
  const [showPayoutModal, setShowPayoutModal] = useState(false);

  // Form states for payout request
  const [claimAmountRupees, setClaimAmountRupees] = useState(50000);
  const [milestoneTitle, setMilestoneTitle] = useState('2D Professionalural Layout Signoff');
  const [bankAcc, setBankAcc] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [bankName, setBankName] = useState('HDFC Bank Ltd, Sector 62 Noida');
  const [holderName, setHolderName] = useState(user?.name || 'Principal Professional');

  const loadData = () => {
    const list = getProfessionalPayoutRequests(user?.phone || '');
    setPayouts(list);
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Derived financials
  const projects = getExecutionProjects();
  const totalContractPaise = projects.reduce((acc, p) => acc + (p.contractValuePaise || (p as any).totalContractPaise || 0), 0) || 55000000;
  const totalEarnedPaise = Math.round(totalContractPaise * 0.45); // 45% stage reached
  const platformFeePaise = Math.round(totalEarnedPaise * 0.1); // 10% Build Ghar commission
  const tdsPaise = Math.round(totalEarnedPaise * 0.01); // 1% TDS Section 194C
  const netEarningsPaise = totalEarnedPaise - platformFeePaise - tdsPaise;

  const handleRequestPayout = (e: React.FormEvent) => {
    e.preventDefault();
    if (claimAmountRupees <= 0) {
      error('Please enter a valid claim amount');
      return;
    }

    if (!bankAcc || !ifsc) {
      error('Please provide complete bank account credentials');
      return;
    }

    const created = createProfessionalPayoutRequest({
      professionalPhone: user?.phone || '',
      milestoneTitle,
      amountPaise: claimAmountRupees * 100,
      bankAccountDetails: {
        accountNumber: bankAcc,
        ifsc: ifsc.toUpperCase(),
        bankName,
        holderName,
      },
    });

    success(`Payout request ${created.requestNumber} of ?${claimAmountRupees.toLocaleString('en-IN')} submitted to Finance Desk!`);
    setShowPayoutModal(false);
    loadData();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-navy-950">Billing & Milestone Settlements</h1>
          <p className="text-xs text-slate-500 mt-1">
            Track milestone payments, client escrow releases, 10% platform fee calculations, and NEFT/RTGS payouts.
          </p>
        </div>

        <button
          onClick={() => setShowPayoutModal(true)}
          className="px-4 py-2 bg-gradient-to-r from-sky-600 to-blue-600 text-white font-bold rounded-xl shadow-md shadow-sky-600/20 hover:from-sky-700 hover:to-blue-700 transition flex items-center gap-2 text-xs self-start"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Request Milestone Payout</span>
        </button>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-sky-200/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono font-bold">
            <span>TOTAL CONTRACTED</span>
            <Wallet className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-black text-navy-950 font-mono">{formatINR(totalContractPaise)}</div>
          <span className="text-[11px] text-slate-500 font-medium">Across all approved project briefs</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-blue-200/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-blue-700 font-mono font-bold">
            <span>VERIFIED EARNINGS</span>
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-900 font-mono">{formatINR(totalEarnedPaise)}</div>
          <span className="text-[11px] text-blue-700 font-medium">Milestones approved by clients</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-200/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-amber-700 font-mono font-bold">
            <span>PLATFORM FEE (10%)</span>
            <TrendingUp className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-900 font-mono">{formatINR(platformFeePaise)}</div>
          <span className="text-[11px] text-amber-700 font-medium">Lead gen & escrow custody fee</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-200/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-emerald-700 font-mono font-bold">
            <span>NET DISBURSABLE</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-800 font-mono">{formatINR(netEarningsPaise)}</div>
          <span className="text-[11px] text-emerald-700 font-medium">Post TDS (1% Sec 194C)</span>
        </div>
      </div>

      {/* Payout Requests Ledger */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 text-sm">Disbursement & Settlement History</h3>
          <span className="text-xs text-slate-400 font-mono font-bold">{payouts.length} Settlements</span>
        </div>

        {payouts.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs space-y-2">
            <Receipt className="w-10 h-10 text-slate-300 mx-auto" />
            <p>No payout requests logged yet. Use "Request Milestone Payout" above to claim completed deliverables.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 text-xs">
            {payouts.map((p) => (
              <div key={p.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900">{p.requestNumber}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        p.status === 'SETTLED'
                          ? 'bg-blue-100 text-blue-900'
                          : 'bg-amber-100 text-amber-900'
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>
                  <div className="text-slate-600">{p.milestoneTitle || 'Milestone Deliverable'}</div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    Bank: {p.bankAccountDetails.bankName} (A/C: ?????{p.bankAccountDetails.accountNumber.slice(-4)})
                  </div>
                </div>

                <div className="text-right sm:text-right space-y-1">
                  <div className="font-mono font-black text-slate-900 text-sm">{formatINR(p.amountPaise)}</div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    Net: <strong className="text-emerald-700">{formatINR(p.netPayoutPaise)}</strong>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">{formatDate(p.requestedAt)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Request Payout Modal */}
      {showPayoutModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-sky-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Request Milestone Payout</h3>
              <button
                onClick={() => setShowPayoutModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRequestPayout} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Approved Milestone Title</label>
                <input
                  type="text"
                  required
                  value={milestoneTitle}
                  onChange={(e) => setMilestoneTitle(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Claim Amount (? INR)</label>
                <input
                  type="number"
                  required
                  value={claimAmountRupees}
                  onChange={(e) => setClaimAmountRupees(Number(e.target.value))}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-hidden font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Bank Account Number</label>
                  <input
                    type="text"
                    required
                    value={bankAcc}
                    onChange={(e) => setBankAcc(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-hidden font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">IFSC Code</label>
                  <input
                    type="text"
                    required
                    value={ifsc}
                    onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-hidden font-mono uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Bank & Branch Name</label>
                <input
                  type="text"
                  required
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                />
              </div>

              {/* Deductions Breakdown */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 font-mono text-[11px]">
                <div className="flex justify-between text-slate-600">
                  <span>Gross Claim:</span>
                  <span>?{claimAmountRupees.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-amber-700">
                  <span>Platform Fee (10%):</span>
                  <span>-?{(claimAmountRupees * 0.1).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>TDS (1% Sec 194C):</span>
                  <span>-?{(claimAmountRupees * 0.01).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between font-bold text-emerald-800 border-t border-slate-200 pt-1">
                  <span>Net Payout to Bank:</span>
                  <span>?{(claimAmountRupees * 0.89).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowPayoutModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-sky-600 to-blue-600 text-white font-bold rounded-xl shadow-md shadow-sky-600/20 hover:from-sky-700 hover:to-blue-700 transition"
                >
                  Submit Payout Claim
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
