import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Layers,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  HardHat,
  Camera,
  DollarSign,
  ShieldCheck,
  Building,
  Eye,
  Check,
  X,
  ArrowLeft,
  Plus,
  ArrowRight,
  TrendingUp,
  CreditCard,
  Lock,
  Unlock,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext.js';
import { formatINR, formatDate } from '../../lib/utils.js';
import {
  getExecutionProjects,
  saveExecutionProject,
  ExecutionProject,
  PaymentMilestoneItem,
} from '../../data/projectExecutionStore.js';
import { recordPlatformAuditLog } from '../../data/adminStore.js';

export const AdminSiteTimeline: React.FC = () => {
  const { success, error } = useToast();

  const [search, setSearch] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [refreshKey, setRefreshKey] = useState(0);

  // Milestone Approval Modal
  const [approvalModalMilestone, setApprovalModalMilestone] = useState<{
    project: ExecutionProject;
    milestone: PaymentMilestoneItem;
  } | null>(null);
  const [verificationNotes, setVerificationNotes] = useState('');

  const projects = useMemo(() => getExecutionProjects(), [refreshKey]);

  // Set default selected project
  const currentProject = useMemo(() => {
    if (!projects.length) return null;
    if (selectedProjectId) {
      return projects.find((p) => p.id === selectedProjectId) || projects[0];
    }
    return projects[0];
  }, [projects, selectedProjectId]);

  // Master Construction Milestones for Current Project
  const milestones = useMemo(() => {
    if (!currentProject) return [];
    if (currentProject.paymentMilestones && currentProject.paymentMilestones.length > 0) {
      return currentProject.paymentMilestones;
    }
    // Default milestones if empty
    return [
      {
        id: 'ms-1',
        title: 'Site Preparation & Excavation',
        percentage: 10,
        amountPaise: Math.round(currentProject.budgetPaise * 0.1),
        status: 'PAID' as const,
        description: 'Site clearance, leveling, soil testing and perimeter excavation.',
      },
      {
        id: 'ms-2',
        title: 'Foundation & Plinth RCC Casting',
        percentage: 20,
        amountPaise: Math.round(currentProject.budgetPaise * 0.2),
        status: 'PENDING_APPROVAL' as const,
        description: 'M25 grade footing, raft reinforcement, plinth beam and anti-termite treatment.',
      },
      {
        id: 'ms-3',
        title: 'Ground Floor Column & Roof Slab',
        percentage: 25,
        amountPaise: Math.round(currentProject.budgetPaise * 0.25),
        status: 'LOCKED' as const,
        description: 'RCC columns, shuttering, beam reinforcement and roof casting.',
      },
      {
        id: 'ms-4',
        title: 'Brickwork, Plastering & MEP Conduit',
        percentage: 20,
        amountPaise: Math.round(currentProject.budgetPaise * 0.2),
        status: 'LOCKED' as const,
        description: 'AAC block masonry, internal/external sand-face plastering, electrical conduit piping.',
      },
      {
        id: 'ms-5',
        title: 'Flooring, Tiling & Sanitary Fixtures',
        percentage: 15,
        amountPaise: Math.round(currentProject.budgetPaise * 0.15),
        status: 'LOCKED' as const,
        description: 'Vitrified tiles, bathroom CP fittings, door frames and waterproofing.',
      },
      {
        id: 'ms-6',
        title: 'Final Paint, Handover & Completion',
        percentage: 10,
        amountPaise: Math.round(currentProject.budgetPaise * 0.1),
        status: 'LOCKED' as const,
        description: 'Primer + 2 coats royal luxury emulsion, final electrical switchboards, site snagging.',
      },
    ];
  }, [currentProject]);

  const handleApproveMilestoneRelease = (e: React.FormEvent) => {
    e.preventDefault();
    if (!approvalModalMilestone) return;

    const { project, milestone } = approvalModalMilestone;

    const updatedMilestones = (project.paymentMilestones?.length ? project.paymentMilestones : milestones).map((m) =>
      m.id === milestone.id ? { ...m, status: 'PAID' as const } : m
    );

    const updatedProject: ExecutionProject = {
      ...project,
      paymentMilestones: updatedMilestones,
      progressPercentage: Math.min(100, project.progressPercentage + milestone.percentage),
      updatedAt: new Date().toISOString(),
    };

    saveExecutionProject(updatedProject);
    recordPlatformAuditLog({
      action: 'RELEASE_MILESTONE_PAYMENT',
      module: 'SITE_TIMELINE_MANAGEMENT',
      entity: `Project #${project.code} - ${milestone.title}`,
      newValue: `Escrow Released: ${formatINR(milestone.amountPaise)}. Verification: ${verificationNotes}`,
    });

    success(
      `Milestone "${milestone.title}" approved! Escrow payment of ${formatINR(milestone.amountPaise)} released to contractor.`
    );
    setApprovalModalMilestone(null);
    setVerificationNotes('');
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-amber-500/10 text-amber-700 rounded-xl">
              <Layers className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black font-display text-navy-950">
              Site Timeline & Milestone Management
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Construction stages, on-site photo proofs, structural engineer verification and escrow payment release gates.
          </p>
        </div>

        {/* Project Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-500">Active Site:</label>
          <select
            value={currentProject?.id || ''}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-navy-950 focus:outline-none"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} - {p.name} ({p.siteLocation?.city || 'Delhi NCR'})
              </option>
            ))}
          </select>
        </div>
      </div>

      {currentProject ? (
        <div className="space-y-6">
          {/* Site Overview Banner */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                  {currentProject.code}
                </span>
                <h2 className="text-lg font-black text-navy-950">{currentProject.name}</h2>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Homeowner: <strong>{currentProject.customerName}</strong> ({currentProject.customerPhone}) · Site:{' '}
                <strong>
                  {currentProject.siteLocation?.addressLine1}, {currentProject.siteLocation?.city}
                </strong>
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <div className="text-right">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">OVERALL PROGRESS</span>
                <strong className="text-lg font-black font-mono text-blue-700">
                  {currentProject.progressPercentage}%
                </strong>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">TOTAL BUDGET</span>
                <strong className="text-lg font-black font-mono text-navy-950">
                  {formatINR(currentProject.budgetPaise)}
                </strong>
              </div>
            </div>
          </div>

          {/* Milestones Stepper & Verification List */}
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-navy-950 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Construction Stage Gates & Payment Authorization</span>
            </h3>

            <div className="grid grid-cols-1 gap-3.5">
              {milestones.map((ms, idx) => {
                const isPaid = ms.status === 'PAID';
                const isPending = ms.status === 'PENDING_APPROVAL';
                const isLocked = ms.status === 'LOCKED';

                return (
                  <div
                    key={ms.id}
                    className={`bg-white rounded-2xl border p-5 transition shadow-2xs space-y-3 ${
                      isPending
                        ? 'border-amber-400 bg-amber-50/20'
                        : isPaid
                        ? 'border-emerald-200'
                        : 'border-slate-200'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                            isPaid
                              ? 'bg-emerald-600 text-white'
                              : isPending
                              ? 'bg-amber-500 text-white'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {idx + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-navy-950">{ms.title}</h4>
                            <span className="font-mono text-xs font-bold text-blue-700">({ms.percentage}%)</span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">{ms.description}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block uppercase font-bold">RELEASE VALUE</span>
                          <strong className="text-sm font-black font-mono text-slate-900">
                            {formatINR(ms.amountPaise)}
                          </strong>
                        </div>

                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isPaid
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : isPending
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {ms.status}
                        </span>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-500 text-[11px]">
                        Assigned Contractor:{' '}
                        <strong>{currentProject.contractorName || 'Yadav Civil Works'}</strong>
                      </span>

                      <div className="flex items-center gap-2">
                        {isPending && (
                          <button
                            onClick={() =>
                              setApprovalModalMilestone({
                                project: currentProject,
                                milestone: ms,
                              })
                            }
                            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-xs transition flex items-center gap-1.5"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Verify & Authorize Payment</span>
                          </button>
                        )}
                        {isPaid && (
                          <span className="text-emerald-700 font-semibold flex items-center gap-1 text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Payment Released</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border">
          <Layers className="w-10 h-10 mx-auto mb-2 text-slate-300" />
          <p className="font-bold text-slate-600">No active projects found to display milestones.</p>
        </div>
      )}

      {/* MODAL: VERIFY MILESTONE & AUTHORIZE RELEASE (Full-Screen Executive Mode) */}
      {approvalModalMilestone && (
        <div className="admin-fullscreen-modal fixed inset-0 z-50 overflow-y-auto bg-[#f0f7ff] flex flex-col font-sans animate-in fade-in duration-150">
          <div className="h-[2px] bg-gradient-to-r from-transparent via-amber-400 via-sky-400 to-transparent pointer-events-none shrink-0" />
          <div className="sticky top-0 z-40 bg-navy-950 text-white px-4 sm:px-8 py-3.5 border-b border-navy-900 flex items-center justify-between shadow-xl shrink-0">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <button
                type="button"
                onClick={() => setApprovalModalMilestone(null)}
                className="px-3.5 py-2 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs flex items-center gap-2 border border-slate-700/80 hover:border-slate-500 transition group cursor-pointer shrink-0"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="hidden sm:inline">Back to Construction Timeline</span>
                <span className="sm:hidden">Back</span>
              </button>
              <div className="h-6 w-px bg-slate-700 hidden sm:block shrink-0" />
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-base font-display shrink-0">
                  <ShieldCheck className="w-5 h-5 text-amber-400" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base sm:text-lg font-black font-display text-white truncate">
                    Milestone Inspection & Payment Release Gate
                  </h2>
                  <div className="text-[11px] text-slate-400 font-mono truncate">
                    {approvalModalMilestone.project.code} • {approvalModalMilestone.milestone.title}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setApprovalModalMilestone(null)}
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span className="hidden sm:inline">Close</span>
              </button>
            </div>
          </div>

          <div className="flex-1 max-w-[1100px] w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-blue-200/80 shadow-xl space-y-6">
              <div className="p-5 bg-amber-50 rounded-2xl border border-amber-200 text-amber-950 space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm text-amber-900">
                  <ShieldCheck className="w-5 h-5 text-amber-600" />
                  <span>Strict Escrow Verification Protocol (Zero Dummy Payout Rule)</span>
                </div>
                <p className="text-xs text-amber-800 leading-relaxed">
                  By confirming this payment release, you certify as an Admin that the civil site engineer has inspected
                  physical progress photos, verified structural and material integrity, and confirmed homeowner milestone completion.
                </p>
              </div>

              <div className="p-5 bg-navy-950 text-white rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
                <div>
                  <span className="text-xs text-slate-400 block uppercase font-bold tracking-wider">Authorized Escrow Release Amount</span>
                  <span className="text-sm text-slate-300 font-medium">Milestone: {approvalModalMilestone.milestone.title} ({approvalModalMilestone.milestone.percentage}%)</span>
                </div>
                <strong className="text-2xl sm:text-3xl font-mono font-black text-amber-400">
                  {formatINR(approvalModalMilestone.milestone.amountPaise)}
                </strong>
              </div>

              <form onSubmit={handleApproveMilestoneRelease} className="space-y-6 text-xs text-slate-700">
                <div className="space-y-2">
                  <label className="font-bold text-slate-800 text-sm block">
                    Inspection Remarks / Quality Verification Notes <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder=""
                    value={verificationNotes}
                    onChange={(e) => setVerificationNotes(e.target.value)}
                    className="w-full p-4 bg-slate-50 border border-slate-300 rounded-2xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setApprovalModalMilestone(null)}
                    className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md flex items-center gap-2 transition"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Authorize & Release Funds</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
