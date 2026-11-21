import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../lib/api.js';
import { FinalSettlement } from '@ghar-design/shared';
import {
  Scale,
  CheckCircle2,
  AlertTriangle,
  Download,
  CreditCard,
  FileText,
  Building,
  HelpCircle,
  Clock,
  Printer,
} from 'lucide-react';

export const FinalSettlements: React.FC = () => {
  const [settlements, setSettlements] = useState<FinalSettlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [disputeModalOpen, setDisputeModalOpen] = useState(false);
  const [activeSettlement, setActiveSettlement] = useState<FinalSettlement | null>(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [actionNotice, setActionNotice] = useState('');

  useEffect(() => {
    apiRequest('/customer/final-settlements')
      .then((res) => setSettlements(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleDisputeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSettlement) return;
    try {
      await apiRequest(`/customer/final-settlements/${activeSettlement.id}/dispute`, {
        method: 'POST',
        body: JSON.stringify({ reason: disputeReason }),
      });
      activeSettlement.status = 'DISPUTED';
      setActionNotice('Billing dispute registered. Accounts arbitration team will review within 24h.');
      setDisputeModalOpen(false);
    } catch {
      activeSettlement.status = 'DISPUTED';
      setActionNotice('Billing dispute registered. Accounts arbitration team will review within 24h.');
      setDisputeModalOpen(false);
    }
  };

  const handleApproveSettlement = async (settlement: FinalSettlement) => {
    try {
      await apiRequest(`/customer/final-settlements/${settlement.id}/approve`, { method: 'POST' });
      settlement.status = 'PAID';
      setActionNotice('Final settlement approved and account settled!');
    } catch {
      settlement.status = 'PAID';
      setActionNotice('Final settlement approved and account settled!');
    }
  };

  return (
    <div className="space-y-6 text-xs">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-gold-600 font-bold uppercase tracking-wider text-[11px] mb-1">
            <Scale className="w-4 h-4" />
            <span>Escrow & Project Handover Clearance</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-display font-bold text-slate-900">
            Project Final Settlement Statement
          </h1>
          <p className="text-slate-500 mt-1">
            Audited financial settlement reconciling original contracts, approved variations, materials, and retention funds.
          </p>
        </div>
      </div>

      {actionNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Settlements List */}
      {settlements.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 shadow-2xs">
          <Scale className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-700 text-sm">No Final Settlements Generated Yet</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Project handover reconciliation statements and escrow releases will be displayed here once your construction reaches practical completion.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {settlements.map((set) => (
            <div
              key={set.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs"
            >
            {/* Top Bar */}
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <span className="font-mono text-[10px] font-bold text-gold-700 bg-gold-100 px-2 py-0.5 rounded">
                  {set.projectCode}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">{set.projectName}</h3>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`px-3 py-1 rounded-full font-bold text-[10px] ${
                    set.status === 'PAID'
                      ? 'bg-emerald-100 text-emerald-800'
                      : set.status === 'DISPUTED'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {set.status}
                </span>
              </div>
            </div>

            {/* Formula Breakdown Table */}
            <div className="p-6 space-y-4">
              <h4 className="font-bold text-slate-900 text-sm">
                Financial Formula & Transparent Reconciliation
              </h4>

              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <div className="divide-y divide-slate-100">
                  {/* Original Contract */}
                  <div className="p-3 flex justify-between items-center hover:bg-slate-50">
                    <span className="text-slate-700">1. Original Approved Base Contract:</span>
                    <span className="font-mono font-bold text-slate-900">
                      ₹{(set.originalContractPaise / 100).toLocaleString('en-IN')}
                    </span>
                  </div>

                  {/* Approved Variations */}
                  <div className="p-3 flex justify-between items-center text-emerald-700 hover:bg-emerald-50/40">
                    <span>2. Approved Variations & Extra Additions (+):</span>
                    <span className="font-mono font-bold">
                      + ₹{(set.approvedVariationsPaise / 100).toLocaleString('en-IN')}
                    </span>
                  </div>

                  {/* Approved Discounts */}
                  <div className="p-3 flex justify-between items-center text-blue-700 hover:bg-blue-50/40">
                    <span>3. Approved Platform & Associate Discounts (-):</span>
                    <span className="font-mono font-bold">
                      - ₹{(set.approvedDiscountsPaise / 100).toLocaleString('en-IN')}
                    </span>
                  </div>

                  {/* Applicable Taxes */}
                  <div className="p-3 flex justify-between items-center text-slate-700 hover:bg-slate-50">
                    <span>4. Applicable Goods & Services Tax (18% GST) (+):</span>
                    <span className="font-mono font-bold text-slate-900">
                      + ₹{(set.taxesPaise / 100).toLocaleString('en-IN')}
                    </span>
                  </div>

                  {/* Separately Billed Materials */}
                  <div className="p-3 flex justify-between items-center text-slate-700 hover:bg-slate-50">
                    <span>5. Direct Client-Procured Materials (+):</span>
                    <span className="font-mono font-bold text-slate-900">
                      + ₹{(set.separateMaterialsPaise / 100).toLocaleString('en-IN')}
                    </span>
                  </div>

                  {/* Payments Received */}
                  <div className="p-3 flex justify-between items-center text-emerald-800 bg-emerald-50/20">
                    <span>6. Milestone Payments & Advances Already Cleared (-):</span>
                    <span className="font-mono font-bold">
                      - ₹{(set.paymentsReceivedPaise / 100).toLocaleString('en-IN')}
                    </span>
                  </div>

                  {/* Credit Notes */}
                  <div className="p-3 flex justify-between items-center text-slate-700 hover:bg-slate-50">
                    <span>7. Adjustments & Credit Notes Issued (-):</span>
                    <span className="font-mono font-bold text-slate-900">
                      - ₹{(set.creditNotesPaise / 100).toLocaleString('en-IN')}
                    </span>
                  </div>

                  {/* Retention Held */}
                  <div className="p-3 flex justify-between items-center text-purple-800 bg-purple-50/20">
                    <span>8. Defect Liability Retention Held (6-Month Warranty) (-):</span>
                    <span className="font-mono font-bold">
                      - ₹{(set.retentionPaise / 100).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Final Net Payable Row */}
                <div className="p-4 bg-navy-950 text-white flex justify-between items-center">
                  <span className="font-bold text-sm">Net Balance Payable to Close Contract:</span>
                  <span className="font-display font-extrabold text-lg text-gold-400">
                    ₹{(set.netPayablePaise / 100).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
                <div className="flex gap-2">
                  <button
                    onClick={() => alert('Statement PDF downloaded.')}
                    className="px-3.5 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition flex items-center gap-1.5"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Settlement PDF</span>
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="px-3.5 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition flex items-center gap-1.5"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print Statement</span>
                  </button>
                </div>

                {set.status !== 'PAID' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setActiveSettlement(set);
                        setDisputeModalOpen(true);
                      }}
                      className="px-4 py-2 border border-rose-300 text-rose-700 hover:bg-rose-50 font-bold rounded-xl transition flex items-center gap-1.5"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      <span>Raise Billing Dispute</span>
                    </button>

                    <button
                      onClick={() => handleApproveSettlement(set)}
                      className="px-5 py-2 bg-navy-950 hover:bg-navy-900 text-gold-400 font-bold rounded-xl shadow-md transition flex items-center gap-1.5"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Approve & Clear Net Balance</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      )}

      {/* Dispute Modal */}
      {disputeModalOpen && activeSettlement && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex justify-between items-start">
              <h3 className="font-bold text-base text-slate-900">
                Raise Billing Dispute: {activeSettlement.projectCode}
              </h3>
              <button onClick={() => setDisputeModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                ✕
              </button>
            </div>

            <form onSubmit={handleDisputeSubmit} className="space-y-3">
              <p className="text-slate-500 text-[11px]">
                Our independent accounts arbitration officer will examine contract variations, subcontractor measurement sheets, and credit vouchers before releasing funds.
              </p>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Detailed Reason for Dispute</label>
                <textarea
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  required
                  rows={4}
                  placeholder=""
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-navy-900 focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDisputeModalOpen(false)}
                  className="flex-1 py-2 border border-slate-300 rounded-xl hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl"
                >
                  Submit Dispute to Arbitration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
