import { BuildGharLoader } from '../../components/common/BuildGharLoader.js';
import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import {
  getExecutionProjects,
  saveExecutionProject,
  ExecutionProject,
  PaymentMilestoneItem,
} from '../../data/projectExecutionStore.js';
import {
  DollarSign,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  Receipt,
  Layers,
  FileCheck2,
  ExternalLink,
} from 'lucide-react';

const formatINR = (paise: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format((paise || 0) / 100);
};

export const ProjectPaymentsMilestones: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { success } = useToast();

  const [projects, setProjects] = useState<ExecutionProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const activeTab = searchParams.get('tab') || 'schedule';
  const setActiveTab = (tab: string) => {
    setSearchParams({ tab });
  };

  useEffect(() => {
    const list = getExecutionProjects(user?.id, user?.phone);
    setProjects(list);
    if (list.length > 0) {
      setSelectedProjectId(list[0].id);
    }
    setLoading(false);
  }, [user]);

  const activeProject = projects.find((p) => p.id === selectedProjectId) || projects[0];

  const handleApproveAndPay = (milestoneId: string) => {
    if (!activeProject) return;
    const now = new Date().toISOString();
    let amt = 0;

    const updatedMilestones = (activeProject.paymentMilestones || []).map((m) => {
      if (m.id === milestoneId) {
        amt = m.amountPaise;
        return {
          ...m,
          status: 'PAID' as const,
          approvedAt: now,
          paidAt: now,
          transactionId: `TXN-ESCROW-${Math.floor(100000 + Math.random() * 900000)}`,
        };
      }
      return m;
    });

    const updated: ExecutionProject = {
      ...activeProject,
      paymentMilestones: updatedMilestones,
      totalPaidPaise: activeProject.totalPaidPaise + amt,
      amountDuePaise: Math.max(0, activeProject.amountDuePaise - amt),
      updatedAt: now,
    };

    saveExecutionProject(updated);
    setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    success(`Milestone payment of ${formatINR(amt)} released from Escrow.`);
  };

  if (loading) {
    return <div className="p-16 flex items-center justify-center"><BuildGharLoader message="Loading payment milestones & escrow status..." /></div>;
  }

  if (!activeProject) {
    return (
      <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center max-w-lg mx-auto space-y-4 my-8 font-sans">
        <DollarSign className="w-12 h-12 text-slate-400 mx-auto" />
        <h2 className="text-lg font-bold text-navy-950 font-display">No Milestone Payments Active</h2>
        <p className="text-xs text-slate-500">
          Work-linked payment schedules are generated when you accept a quotation and initialize project kickoff.
        </p>
        <Link to="/dashboard/quotations" className="btn-primary text-xs py-2 px-4 inline-block">
          View Quotations
        </Link>
      </div>
    );
  }

  const pendingMilestones = activeProject.paymentMilestones.filter(
    (m) => m.status === 'SUBMITTED_FOR_REVIEW' || m.status === 'PAYMENT_DUE'
  );
  const paidMilestones = activeProject.paymentMilestones.filter((m) => m.status === 'PAID');

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 font-sans">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-navy-50 text-navy-800 border border-navy-200 mb-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-navy-700" />
            <span>Milestone Escrow Payment Center</span>
          </div>
          <h1 className="text-2xl font-bold font-display text-navy-950">
            Project Payments & Milestone Approvals
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Work-linked stage payments. Payments are released from escrow only after on-site milestone verification.
          </p>
        </div>

        {projects.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-semibold">Project:</span>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold text-navy-950"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.id}: {p.name.slice(0, 30)}...
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Financial Health Snapshot */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-400 uppercase font-semibold">Total Approved Contract</div>
          <div className="text-2xl font-bold font-mono text-navy-950 mt-1">
            {formatINR(activeProject.contractValuePaise)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">WO: {activeProject.workOrderNumber}</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-400 uppercase font-semibold">Amount Released / Paid</div>
          <div className="text-2xl font-bold font-mono text-emerald-700 mt-1">
            {formatINR(activeProject.totalPaidPaise)}
          </div>
          <div className="text-[11px] text-emerald-800 mt-1">Verified work tranches</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-400 uppercase font-semibold">Pending Approvals / Due</div>
          <div className="text-2xl font-bold font-mono text-amber-700 mt-1">
            {formatINR(activeProject.amountDuePaise)}
          </div>
          <div className="text-[11px] text-amber-800 mt-1">
            {pendingMilestones.length} tranche(s) awaiting signoff
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-400 uppercase font-semibold">Defect Liability Retention</div>
          <div className="text-2xl font-bold font-mono text-indigo-700 mt-1">
            {formatINR(activeProject.retentionPaise)}
          </div>
          <div className="text-[11px] text-indigo-800 mt-1">Held until final handover</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-1.5 flex items-center gap-1 overflow-x-auto text-xs font-semibold">
        {[
          { id: 'schedule', label: `Payment Schedule (${activeProject.paymentMilestones.length})` },
          { id: 'pending', label: `Pending Approvals (${pendingMilestones.length})` },
          { id: 'due', label: 'Payments Due' },
          { id: 'history', label: `Payment History (${paidMilestones.length})` },
          { id: 'settlement', label: 'Final Settlement' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 rounded-xl transition ${
              activeTab === t.id
                ? 'bg-navy-950 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB CONTENT */}
      {activeTab === 'schedule' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-navy-950 font-display">Agreed Contract Milestone Schedule</h2>
          <div className="space-y-3">
            {(activeProject.paymentMilestones || []).map((m) => (
              <div
                key={m.id}
                className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold bg-navy-900 text-white px-2 py-0.5 rounded">
                      Tranche {m.milestoneNumber}
                    </span>
                    <span className="font-bold text-navy-950 text-sm">{m.title}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        m.status === 'PAID'
                          ? 'bg-emerald-100 text-emerald-800'
                          : m.status === 'PAYMENT_DUE'
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {m.status}
                    </span>
                  </div>
                  <p className="text-slate-500 text-[11px] mt-1">{m.description}</p>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-base font-bold font-mono text-navy-950">{formatINR(m.amountPaise)}</div>
                  <div className="text-[10px] text-slate-400">{m.percentage}% of Contract</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'pending' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-navy-950 font-display">Milestones Awaiting Your Approval</h2>
          {pendingMilestones.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
              No milestone approvals currently pending customer action.
            </div>
          ) : (
            <div className="space-y-3">
              {pendingMilestones.map((m) => (
                <div
                  key={m.id}
                  className="p-4 bg-amber-50/60 border border-amber-300 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs"
                >
                  <div>
                    <div className="font-bold text-navy-950 text-sm">{m.title}</div>
                    <p className="text-slate-600 text-[11px] mt-0.5">{m.description}</p>
                    <div className="text-emerald-700 font-semibold text-[11px] mt-1">
                      Site photographs and engineering checklist submitted by {activeProject.contractorFirm}.
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="text-base font-bold font-mono text-navy-950">{formatINR(m.amountPaise)}</div>
                    </div>
                    <button
                      onClick={() => handleApproveAndPay(m.id)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
                    >
                      Approve & Release Payment
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'due' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-navy-950 font-display">Immediate Payments Due</h2>
          <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
            <div>
              <div className="font-bold text-navy-950 text-sm">Total Outstanding Work Tranches</div>
              <div className="text-slate-500">Released only upon your digital verification</div>
            </div>
            <div className="text-xl font-bold font-mono text-amber-700">
              {formatINR(activeProject.amountDuePaise)}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-navy-950 font-display">Verified Milestone Payment History</h2>
          {paidMilestones.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
              No milestone payments released yet.
            </div>
          ) : (
            <div className="space-y-3">
              {paidMilestones.map((m) => (
                <div
                  key={m.id}
                  className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center text-xs"
                >
                  <div>
                    <div className="font-bold text-navy-950">{m.title}</div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      Ref: {m.transactionId} • Approved on {m.approvedAt?.split('T')[0]}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold font-mono text-emerald-700">{formatINR(m.amountPaise)}</div>
                    <div className="text-[10px] text-emerald-800 font-semibold">✓ Settled via Escrow</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'settlement' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-navy-950 font-display">Final Project Settlement Audit</h2>
            <Link
              to="/dashboard/final-settlements"
              className="text-xs font-bold text-blue-700 hover:underline flex items-center gap-1"
            >
              <span>Full Settlement Ledger</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-600">Original Contract Value:</span>
              <span className="font-mono font-bold text-slate-900">{formatINR(activeProject.originalContractPaise)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Approved Variations / Change Orders:</span>
              <span className="font-mono font-bold text-slate-900">{formatINR(activeProject.approvedVariationsPaise)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Total Payments Released:</span>
              <span className="font-mono font-bold text-emerald-700">-{formatINR(activeProject.totalPaidPaise)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-bold">
              <span className="text-navy-950">Net Retention & Handover Balance:</span>
              <span className="font-mono text-navy-950">{formatINR(activeProject.amountDuePaise)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
