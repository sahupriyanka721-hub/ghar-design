import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  Printer,
  Calendar,
  Layers,
  Check,
  ArrowRight,
  DollarSign,
  FileText,
  User,
} from 'lucide-react';
import {
  getProfessionalPayoutRequests,
  createProfessionalPayoutRequest,
  ProfessionalPayoutRequest,
} from '../../data/professionalStore.js';
import { getExecutionProjects } from '../../data/projectExecutionStore.js';

type TabKey = 'earnings' | 'schedule' | 'history' | 'payouts' | 'invoices';

interface MilestoneScheduleItem {
  id: string;
  milestoneNumber: number;
  title: string;
  percentage: number;
  amountPaise: number;
  status: 'RELEASED' | 'IN_ESCROW' | 'UPCOMING';
  releasedAt?: string;
  utrNumber?: string;
}

interface TaxInvoiceItem {
  id: string;
  invoiceNumber: string;
  date: string;
  clientName: string;
  projectName: string;
  sacCode: string;
  baseAmountPaise: number;
  gstPaise: number;
  totalAmountPaise: number;
  status: 'PAID' | 'PENDING';
}

export const ProfessionalBilling: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = (searchParams.get('tab') as TabKey) || 'earnings';
  const activeTab: TabKey = useMemo(() => {
    if (
      tabParam === 'earnings' ||
      tabParam === 'schedule' ||
      tabParam === 'history' ||
      tabParam === 'payouts' ||
      tabParam === 'invoices'
    ) {
      return tabParam;
    }
    return 'earnings';
  }, [tabParam]);

  const setActiveTab = (tab: TabKey) => {
    setSearchParams({ tab });
  };

  const [payouts, setPayouts] = useState<ProfessionalPayoutRequest[]>([]);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<TaxInvoiceItem | null>(null);

  // Form states for payout request
  const [claimAmountRupees, setClaimAmountRupees] = useState(48000);
  const [milestoneTitle, setMilestoneTitle] = useState('2D Floor Plan Approval & Vastu Layout Sign-off');
  const [bankAcc, setBankAcc] = useState('50100456789123');
  const [ifsc, setIfsc] = useState('HDFC0001234');
  const [bankName, setBankName] = useState('HDFC Bank Ltd, Sector 62');
  const [holderName, setHolderName] = useState(user?.name || 'Apex Architectural Studio');

  const loadData = () => {
    const list = getProfessionalPayoutRequests(user?.phone || '');
    if (list.length > 0) {
      setPayouts(list);
    } else {
      // Seed realistic past payout settlements
      const defaultPayouts: ProfessionalPayoutRequest[] = [
        {
          id: 'pay-01',
          requestNumber: 'PAY-2026-IND-01',
          professionalPhone: user?.phone || '',
          milestoneTitle: 'Mobilization Retainer & Concept Design Approval (20%)',
          amountPaise: 4800000,
          platformFeePaise: 480000,
          tdsPaise: 48000,
          netPayoutPaise: 4272000,
          status: 'SETTLED',
          requestedAt: '2026-11-12T10:00:00Z',
          processedAt: '2026-11-13T14:00:00Z',
          bankAccountDetails: {
            accountNumber: '50100456789123',
            ifsc: 'HDFC0001234',
            bankName: 'HDFC Bank Ltd, Super Corridor Branch',
            holderName: user?.name || 'Apex Architectural Studio',
          },
          utrNumber: 'HDFCR202611130987654',
        },
      ];
      setPayouts(defaultPayouts);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Derived financials
  const projects = getExecutionProjects();
  const totalContractPaise = 24000000; // ₹2.40 Lakh for current Villa engagement
  const totalEarnedPaise = 12000000; // 50% milestone achieved = ₹1.20 Lakh
  const platformFeePaise = Math.round(totalEarnedPaise * 0.1); // 10% BuildGhar commission = ₹12,000
  const tdsPaise = Math.round(totalEarnedPaise * 0.01); // 1% TDS Section 194C = ₹1,200
  const netEarningsPaise = totalEarnedPaise - platformFeePaise - tdsPaise; // ₹1,06,800

  // 11.2 Payment Schedule
  const milestoneSchedule: MilestoneScheduleItem[] = [
    {
      id: 'ms-1',
      milestoneNumber: 1,
      title: 'Mobilization Advance & Concept Design Sign-off',
      percentage: 20,
      amountPaise: 4800000,
      status: 'RELEASED',
      releasedAt: '2026-11-13',
      utrNumber: 'HDFCR202611130987654',
    },
    {
      id: 'ms-2',
      milestoneNumber: 2,
      title: 'Municipal & Preliminary 2D Floor Plans Approved',
      percentage: 30,
      amountPaise: 7200000,
      status: 'RELEASED',
      releasedAt: '2026-11-22',
      utrNumber: 'HDFCR202611220456789',
    },
    {
      id: 'ms-3',
      milestoneNumber: 3,
      title: '3D Elevation & Structural IS 456 Vetting Complete',
      percentage: 30,
      amountPaise: 7200000,
      status: 'IN_ESCROW',
    },
    {
      id: 'ms-4',
      milestoneNumber: 4,
      title: 'Final Working Drawings & MEP Conduit Handover',
      percentage: 20,
      amountPaise: 4800000,
      status: 'UPCOMING',
    },
  ];

  // 11.5 Tax Invoices
  const invoicesList: TaxInvoiceItem[] = [
    {
      id: 'inv-01',
      invoiceNumber: 'INV-2026-ARCH-001',
      date: '2026-11-13',
      clientName: 'Sharika Mishra',
      projectName: 'Modern Luxury Villa (G+2) - Super Corridor, Indore',
      sacCode: '998321 (Architectural Services)',
      baseAmountPaise: 4067796,
      gstPaise: 732204, // 18%
      totalAmountPaise: 4800000,
      status: 'PAID',
    },
    {
      id: 'inv-02',
      invoiceNumber: 'INV-2026-ARCH-002',
      date: '2026-11-22',
      clientName: 'Sharika Mishra',
      projectName: 'Modern Luxury Villa (G+2) - Super Corridor, Indore',
      sacCode: '998321 (Architectural Services)',
      baseAmountPaise: 6101695,
      gstPaise: 1098305, // 18%
      totalAmountPaise: 7200000,
      status: 'PAID',
    },
  ];

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

    success(
      `Payout request ${created.requestNumber} of ₹${claimAmountRupees.toLocaleString(
        'en-IN'
      )} submitted to Finance Desk!`
    );
    setShowPayoutModal(false);
    loadData();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* =========================================================================
          PAGE HEADER & SECTION BADGE (Master Spec Section 11)
      ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-900 shadow-2xs">
              <CreditCard className="w-5 h-5 text-blue-900" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold font-display text-navy-950">
                  11. Billing, Payments & Escrow Disbursements
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-100 text-blue-900">
                  Escrow Protected
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Milestone fee releases, 10% platform commission, 1% TDS Section 194C, NEFT/RTGS payouts, and GST invoices.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Action */}
        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <button
            onClick={() => setShowPayoutModal(true)}
            className="btn-gold text-xs font-bold py-2.5 px-4 rounded-xl transition flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Request Payout</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          FINANCIAL KPI SUMMARY CARDS (11.1)
      ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block">Total Contracted</span>
          <div className="text-xl font-black text-navy-950 font-mono">{formatINR(totalContractPaise)}</div>
          <span className="text-[11px] text-slate-500 block">Across active projects</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-blue-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-mono font-bold text-blue-900 uppercase block">Verified Earnings</span>
          <div className="text-xl font-black text-blue-900 font-mono">{formatINR(totalEarnedPaise)}</div>
          <span className="text-[11px] text-blue-900 font-bold block">Milestones Approved</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block">Platform Fee (10%)</span>
          <div className="text-xl font-black text-slate-700 font-mono">{formatINR(platformFeePaise)}</div>
          <span className="text-[11px] text-slate-500 block">Escrow & lead custody</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-blue-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-mono font-bold text-blue-900 uppercase block">Net Disbursable</span>
          <div className="text-xl font-black text-blue-900 font-mono">{formatINR(netEarningsPaise)}</div>
          <span className="text-[11px] text-blue-900 font-bold block">Post TDS (1% Sec 194C)</span>
        </div>
      </div>

      {/* =========================================================================
          SECTION 11 SUB-NAVIGATION TABS (11.1 to 11.5)
      ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-2xs">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none text-xs font-bold">
          <button
            onClick={() => setActiveTab('earnings')}
            className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'earnings'
                ? 'bg-blue-900 text-white shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>11.1 My Earnings & Wallet</span>
          </button>

          <button
            onClick={() => setActiveTab('schedule')}
            className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'schedule'
                ? 'bg-blue-900 text-white shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>11.2 Payment Schedule ({milestoneSchedule.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'history'
                ? 'bg-blue-900 text-white shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>11.3 Payment History ({payouts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('payouts')}
            className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'payouts'
                ? 'bg-blue-900 text-white shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>11.4 Payout Management</span>
          </button>

          <button
            onClick={() => setActiveTab('invoices')}
            className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'invoices'
                ? 'bg-blue-900 text-white shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>11.5 Tax Invoices & GST ({invoicesList.length})</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          TAB 1: MY EARNINGS
      ========================================================================= */}
      {activeTab === 'earnings' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-6">
          <div className="pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-navy-950">Earnings & Escrow Liquidity Breakdown</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              BuildGhar protects professional architect fees using milestone escrow contracts. Funds are locked prior to kickoff and released upon verified customer deliverables.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-xs">
              <h3 className="font-bold text-slate-900 uppercase font-mono tracking-wider text-[11px]">
                Fee Distribution Model
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-slate-600">
                  <span>Gross Project Milestones Billed:</span>
                  <span className="font-mono font-bold text-slate-900">{formatINR(totalEarnedPaise)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>BuildGhar Platform Fee (10%):</span>
                  <span className="font-mono font-bold text-amber-700">-{formatINR(platformFeePaise)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>TDS Deducted (1% Sec 194C):</span>
                  <span className="font-mono font-bold text-slate-700">-{formatINR(tdsPaise)}</span>
                </div>
                <div className="flex justify-between font-bold text-blue-900 border-t border-slate-200 pt-2 text-sm">
                  <span>Net Disbursable to Bank:</span>
                  <span className="font-mono font-black">{formatINR(netEarningsPaise)}</span>
                </div>
              </div>
            </div>

            <div className="p-5 bg-blue-50/60 rounded-2xl border border-blue-200 space-y-3 text-xs">
              <div className="flex items-center gap-2 text-blue-900 font-bold">
                <ShieldCheck className="w-5 h-5 text-blue-900" />
                <span>Bank Escrow Guarantee</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                All client funds are held in scheduled commercial bank escrow. Once you submit drawings and the homeowner verifies them, funds are disbursed within 24 business hours directly to your designated bank account.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => setShowPayoutModal(true)}
                  className="btn-gold px-4 py-2 rounded-xl text-xs font-bold shadow-sm cursor-pointer"
                >
                  Withdraw Available Balance
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: PAYMENT SCHEDULE (11.2)
      ========================================================================= */}
      {activeTab === 'schedule' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-6">
          <div className="pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-navy-950">4-Stage Professional Milestone Schedule</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Standard BuildGhar payment release milestones linked to architectural deliverables.
            </p>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-mono uppercase text-slate-500">
                <tr>
                  <th className="py-3 px-4 font-bold">Milestone</th>
                  <th className="py-3 px-4 font-bold">Description</th>
                  <th className="py-3 px-4 font-bold">% Share</th>
                  <th className="py-3 px-4 font-bold text-right">Fee (₹)</th>
                  <th className="py-3 px-4 font-bold">Status</th>
                  <th className="py-3 px-4 font-bold">Disbursement UTR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {milestoneSchedule.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      M{item.milestoneNumber}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {item.title}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                      {item.percentage}%
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-black text-blue-900">
                      {formatINR(item.amountPaise)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        item.status === 'RELEASED'
                          ? 'bg-blue-100 text-blue-900'
                          : item.status === 'IN_ESCROW'
                          ? 'bg-sky-100 text-sky-900'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                      {item.utrNumber ? (
                        <span className="text-blue-900 font-bold">{item.utrNumber}</span>
                      ) : (
                        <span className="text-slate-400 italic">In Escrow Custody</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3 & 4: PAYMENT HISTORY & PAYOUT MANAGEMENT (11.3 & 11.4)
      ========================================================================= */}
      {(activeTab === 'history' || activeTab === 'payouts') && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm">Disbursement & Settlement Ledger</h3>
            <span className="text-xs text-slate-400 font-mono font-bold">{payouts.length} Settlements</span>
          </div>

          {payouts.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs space-y-2">
              <Receipt className="w-10 h-10 text-slate-300 mx-auto" />
              <p>No payout requests logged yet. Use "Request Payout" above to claim completed deliverables.</p>
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
                    <div className="text-slate-600 font-medium">{p.milestoneTitle || 'Milestone Deliverable'}</div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      Bank: {p.bankAccountDetails.bankName} (A/C: •••••{p.bankAccountDetails.accountNumber.slice(-4)})
                    </div>
                  </div>

                  <div className="text-left sm:text-right space-y-0.5">
                    <div className="font-mono font-black text-slate-900 text-sm">{formatINR(p.amountPaise)}</div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      Net Received: <strong className="text-blue-900">{formatINR(p.netPayoutPaise)}</strong>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">{formatDate(p.requestedAt)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 5: TAX INVOICES & GST (11.5)
      ========================================================================= */}
      {activeTab === 'invoices' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-6">
          <div className="pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-navy-950">GST Tax Invoices (SAC 998321)</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Official tax invoices issued to homeowners for professional architectural services rendered.
            </p>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-mono uppercase text-slate-500">
                <tr>
                  <th className="py-3 px-4 font-bold">Invoice #</th>
                  <th className="py-3 px-4 font-bold">Date</th>
                  <th className="py-3 px-4 font-bold">Client / Project</th>
                  <th className="py-3 px-4 font-bold">SAC Code</th>
                  <th className="py-3 px-4 font-bold text-right">Base Amount</th>
                  <th className="py-3 px-4 font-bold text-right">GST (18%)</th>
                  <th className="py-3 px-4 font-bold text-right">Total (₹)</th>
                  <th className="py-3 px-4 font-bold text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {invoicesList.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      {formatDate(inv.date)}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{inv.clientName}</div>
                      <div className="text-[11px] text-slate-500 truncate max-w-xs">{inv.projectName}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                      {inv.sacCode}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-700">
                      {formatINR(inv.baseAmountPaise)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-[11px] text-slate-500">
                      {formatINR(inv.gstPaise)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-black text-blue-900">
                      {formatINR(inv.totalAmountPaise)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => setSelectedInvoice(inv)}
                        className="px-3 py-1 bg-sky-50 text-sky-800 hover:bg-sky-100 border border-sky-200 rounded-lg text-xs font-bold transition flex items-center gap-1 mx-auto cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          REQUEST PAYOUT MODAL
      ========================================================================= */}
      {showPayoutModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-sky-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Request Milestone Payout</h3>
              <button
                onClick={() => setShowPayoutModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
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
                <label className="block text-slate-700 font-bold mb-1">Claim Amount (₹ INR)</label>
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
                  <span>₹{claimAmountRupees.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-amber-700">
                  <span>Platform Fee (10%):</span>
                  <span>-₹{(claimAmountRupees * 0.1).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>TDS (1% Sec 194C):</span>
                  <span>-₹{(claimAmountRupees * 0.01).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between font-bold text-blue-900 border-t border-slate-200 pt-1">
                  <span>Net Payout to Bank:</span>
                  <span>₹{(claimAmountRupees * 0.89).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowPayoutModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-gold px-5 py-2 text-xs font-bold rounded-xl shadow-md cursor-pointer"
                >
                  Submit Payout Claim
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          PRINT INVOICE MODAL
      ========================================================================= */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-navy-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-base">GST Tax Invoice</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="btn-gold px-3.5 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Invoice</span>
                </button>
                <button onClick={() => setSelectedInvoice(null)} className="p-1.5 text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-4 font-sans">
              <div className="flex justify-between items-start border-b border-slate-200 pb-3">
                <div>
                  <h4 className="font-black text-slate-900 text-base">Apex Architectural Studio</h4>
                  <p className="text-[11px] text-slate-500">Council of Architecture Reg: CA/2018/98765</p>
                  <p className="text-[11px] text-slate-500">GSTIN: 23AABCA1234D1Z5</p>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-slate-900 text-sm">{selectedInvoice.invoiceNumber}</span>
                  <div className="text-[11px] text-slate-500 font-mono">Date: {formatDate(selectedInvoice.date)}</div>
                </div>
              </div>

              <div>
                <strong>Billed To:</strong> {selectedInvoice.clientName}
                <div className="text-[11px] text-slate-500">{selectedInvoice.projectName}</div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1.5 font-mono">
                <div className="flex justify-between text-slate-600">
                  <span>SAC 998321 Base Architecture Fee:</span>
                  <span>{formatINR(selectedInvoice.baseAmountPaise)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>CGST (9%) + SGST (9%):</span>
                  <span>{formatINR(selectedInvoice.gstPaise)}</span>
                </div>
                <div className="flex justify-between font-black text-blue-900 border-t border-slate-200 pt-1 text-sm">
                  <span>Total Tax Paid:</span>
                  <span>{formatINR(selectedInvoice.totalAmountPaise)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
