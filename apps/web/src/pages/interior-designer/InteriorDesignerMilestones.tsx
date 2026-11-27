import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckSquare,
  Clock,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Calendar,
  FileText,
  Upload,
  Send,
  ShieldCheck,
  Check,
  ChevronRight,
  ExternalLink,
  Layers,
  Sparkles,
  Info,
  X,
  FileCheck2,
  DollarSign,
  ArrowUpRight,
  Eye,
} from 'lucide-react';
import {
  getInteriorProjectMilestones,
  saveInteriorMilestone,
  submitMilestoneToAdmin,
  calculateProjectMilestoneProgress,
  getInteriorProjects,
  InteriorMilestone,
  ProjectMilestoneProgress,
} from '../../data/interiorDesignerStore.js';

export const InteriorDesignerMilestones: React.FC = () => {
  const projects = getInteriorProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || 'prj-int-1');

  const [milestones, setMilestones] = useState<InteriorMilestone[]>(() =>
    getInteriorProjectMilestones(selectedProjectId)
  );
  const [progress, setProgress] = useState<ProjectMilestoneProgress>(() =>
    calculateProjectMilestoneProgress(selectedProjectId)
  );

  // Modals
  const [selectedMilestoneForSubmit, setSelectedMilestoneForSubmit] = useState<InteriorMilestone | null>(null);
  const [selectedMilestoneForAudit, setSelectedMilestoneForAudit] = useState<InteriorMilestone | null>(null);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);

  // Submit Form States
  const [completionNotes, setCompletionNotes] = useState('');
  const [completionDate, setCompletionDate] = useState(new Date().toISOString().slice(0, 10));
  const [documentUrl, setDocumentUrl] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [requestedAmount, setRequestedAmount] = useState<number>(0);

  const refreshData = (projId: string) => {
    const list = getInteriorProjectMilestones(projId);
    setMilestones(list);
    setProgress(calculateProjectMilestoneProgress(projId));
  };

  const handleProjectChange = (projId: string) => {
    setSelectedProjectId(projId);
    refreshData(projId);
  };

  const openSubmitModal = (m: InteriorMilestone) => {
    setSelectedMilestoneForSubmit(m);
    setCompletionNotes(m.submissionDetails?.completionDescription || '');
    setCompletionDate(m.submissionDetails?.completionDate || new Date().toISOString().slice(0, 10));
    setDocumentUrl(m.submissionDetails?.supportingFiles?.[0] || 'https://buildghar.com/docs/deliverables-v2.pdf');
    setPhotoUrl(m.submissionDetails?.photos?.[0] || 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=600');
    setRequestedAmount(m.targetAmount);
    setIsSubmitModalOpen(true);
  };

  const handleSubmitMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMilestoneForSubmit) return;

    submitMilestoneToAdmin(selectedMilestoneForSubmit.id, {
      completionDescription: completionNotes,
      completionDate,
      supportingFiles: documentUrl ? [documentUrl] : [],
      photos: photoUrl ? [photoUrl] : [],
      requestedAmount,
    });

    refreshData(selectedProjectId);
    setIsSubmitModalOpen(false);
    setSelectedMilestoneForSubmit(null);
  };

  const getStatusBadge = (status: InteriorMilestone['status']) => {
    switch (status) {
      case 'ADMIN_VERIFIED_COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Admin Verified & Completed</span>
          </span>
        );
      case 'CUSTOMER_APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-purple-100 text-purple-800 border border-purple-300">
            <Check className="w-3.5 h-3.5 text-purple-600" />
            <span>Customer Approved</span>
          </span>
        );
      case 'FORWARDED_TO_CUSTOMER':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-blue-100 text-blue-800 border border-blue-300">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span>Awaiting Customer Approval</span>
          </span>
        );
      case 'SUBMITTED_TO_ADMIN':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Submitted for Admin Review</span>
          </span>
        );
      case 'CORRECTION_REQUESTED':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-300">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>Correction Requested</span>
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Layers className="w-3.5 h-3.5 text-indigo-500" />
            <span>In Progress</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
            <span>Pending Start</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold mb-2">
            <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
            <span>Section 13 Governance: Configurable Milestone & Deliverable Desk</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            Milestone & Deliverable Management
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Submit stage deliverables and photo evidence to Admin. Track 3-tier progress and customer approval routing.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs text-slate-500 font-bold shrink-0">Active Project:</span>
          <select
            value={selectedProjectId}
            onChange={(e) => handleProjectChange(e.target.value)}
            className="p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-semibold"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Governance Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-5 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm border border-blue-800/40">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-blue-500/20 rounded-xl text-blue-300 shrink-0">
            <ShieldCheck className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-sm uppercase tracking-wider text-blue-300">
                Rule 13 Milestone Routing & Progress Protocol
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                Escrow Protected
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
              Interior Designer submits deliverables $\rightarrow$ BuildGhar Admin verifies compliance $\rightarrow$ Forwarded to Homeowner for review.
              <strong> Important:</strong> Progress percentage alone never triggers a payout. Payouts require verified completion and authorized Admin escrow release.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 font-mono text-xs bg-white/10 px-3 py-1.5 rounded-xl border border-white/15">
          🔒 Section 13 Compliant
        </div>
      </div>

      {/* 3 Progress KPI Cards (Section 13 Mandatory Metric) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Designer Reported Progress */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between pb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Designer Reported Progress
            </span>
            <span className="text-xl font-black text-blue-700">
              {progress.designerReportedProgress}%
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress.designerReportedProgress}%` }}
              transition={{ duration: 0.8 }}
              className="bg-blue-600 h-full rounded-full"
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-3 flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span>Weighted calculation based on submitted & executed milestone tasks.</span>
          </p>
        </div>

        {/* Admin Verified Progress */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between pb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Admin Verified Progress
            </span>
            <span className="text-xl font-black text-indigo-700">
              {progress.adminVerifiedProgress}%
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress.adminVerifiedProgress}%` }}
              transition={{ duration: 0.8 }}
              className="bg-indigo-600 h-full rounded-full"
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-3 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <span>Technical audit verified by BuildGhar PMC engineering desk.</span>
          </p>
        </div>

        {/* Customer Approved Progress */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between pb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Customer Approved Progress
            </span>
            <span className="text-xl font-black text-emerald-700">
              {progress.customerApprovedProgress}%
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress.customerApprovedProgress}%` }}
              transition={{ duration: 0.8 }}
              className="bg-emerald-600 h-full rounded-full"
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-3 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>Formally signed-off by homeowner Aman Saxena.</span>
          </p>
        </div>
      </div>

      {/* Milestone List & Timeline Roadmap */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600" />
            <span>Configured Milestone Roadmap ({milestones.length} Stages)</span>
          </h2>
          <span className="text-xs font-mono font-bold text-slate-500">
            Total Milestone Value: ₹{milestones.reduce((s, m) => s + m.targetAmount, 0).toLocaleString()}
          </span>
        </div>

        <div className="space-y-4">
          {milestones.map((milestone) => (
            <motion.div
              key={milestone.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs hover:border-blue-200 transition"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-md bg-slate-100 font-mono text-xs font-bold text-slate-700">
                      Stage {milestone.order}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-mono text-xs font-bold border border-blue-200">
                      {milestone.id}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-xs font-black">
                      Weight: {milestone.weightPercent}%
                    </span>
                    {getStatusBadge(milestone.status)}
                  </div>
                  <h3 className="text-base font-black text-slate-900">{milestone.name}</h3>
                  <p className="text-xs text-slate-500 max-w-3xl leading-relaxed">
                    {milestone.description}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <div className="text-xs text-slate-400 font-bold">Target Payout</div>
                    <div className="text-lg font-black text-slate-900">
                      ₹{milestone.targetAmount.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      Due: {milestone.dueDate}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    {milestone.status !== 'ADMIN_VERIFIED_COMPLETED' && (
                      <button
                        onClick={() => openSubmitModal(milestone)}
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Submit Deliverables</span>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setSelectedMilestoneForAudit(milestone);
                        setIsAuditModalOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs transition flex items-center justify-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-400" />
                      <span>Audit Trail</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Deliverable Checklist Items */}
              {milestone.deliverables && milestone.deliverables.length > 0 && (
                <div className="mt-4">
                  <div className="text-[11px] font-black uppercase text-slate-400 tracking-wider mb-2">
                    Scope Deliverables:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {milestone.deliverables.map((del) => (
                      <span
                        key={del.id}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold border ${
                          del.status === 'APPROVED'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                            : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        {del.status === 'APPROVED' ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <FileText className="w-3 h-3 text-slate-400" />
                        )}
                        <span>{del.title}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Submission Details Banner if Submitted */}
              {milestone.submissionDetails && (
                <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between font-bold text-slate-700">
                    <span className="flex items-center gap-1.5 text-blue-800">
                      <FileCheck2 className="w-4 h-4 text-blue-600" />
                      <span>Designer Submission Logged:</span>
                    </span>
                    <span className="font-mono text-slate-500 text-[11px]">
                      Submitted: {milestone.submissionDetails.completionDate}
                    </span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    {milestone.submissionDetails.completionDescription}
                  </p>
                  {milestone.submissionDetails.supportingFiles && milestone.submissionDetails.supportingFiles.length > 0 && (
                    <div className="flex items-center gap-2 pt-1">
                      <span className="font-bold text-slate-600">Attached Deliverable:</span>
                      <a
                        href={milestone.submissionDetails.supportingFiles[0]}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline flex items-center gap-1 font-semibold"
                      >
                        <span>View Deliverable Document</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Admin Review Feedback Banner */}
              {milestone.adminReview && (
                <div className="mt-3 p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-950 space-y-1">
                  <div className="font-bold flex items-center justify-between text-indigo-900">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-indigo-600" />
                      <span>Admin PMC Verification Review:</span>
                    </span>
                    <span className="font-mono text-[10px] text-indigo-700">
                      {new Date(milestone.adminReview.reviewedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-slate-700 leading-relaxed">{milestone.adminReview.feedback}</p>
                </div>
              )}

              {/* Customer Review Feedback Banner */}
              {milestone.customerReview && (
                <div className="mt-3 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 space-y-1">
                  <div className="font-bold flex items-center justify-between text-emerald-900">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Homeowner Approval & Feedback:</span>
                    </span>
                    <span className="font-mono text-[10px] text-emerald-700">
                      {new Date(milestone.customerReview.reviewedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-slate-700 leading-relaxed">{milestone.customerReview.feedback}</p>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODAL: SUBMIT DELIVERABLES & EVIDENCE TO ADMIN */}
      {/* ============================================================== */}
      <AnimatePresence>
        {isSubmitModalOpen && selectedMilestoneForSubmit && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-blue-800 font-black text-base">
                  <Upload className="w-5 h-5 text-blue-600" />
                  <span>Submit Milestone Deliverables (Section 13)</span>
                </div>
                <button
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitMilestone} className="space-y-3 mt-4 text-xs">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-900 leading-relaxed">
                  <strong>Admin Routing Rule:</strong> Submissions are thoroughly evaluated by BuildGhar PMC engineering desk before being released to customer for formal sign-off.
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Target Milestone</label>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-black text-slate-900">
                    Stage {selectedMilestoneForSubmit.order}: {selectedMilestoneForSubmit.name}
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Completion Description & Deliverable Summary *</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="e.g. Uploaded 4K photorealistic isometric renders of living and kitchen areas. Finish moodboard verified."
                    value={completionNotes}
                    onChange={(e) => setCompletionNotes(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Completion Date *</label>
                    <input
                      type="date"
                      required
                      value={completionDate}
                      onChange={(e) => setCompletionDate(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Claimed Milestone Amount (₹) *</label>
                    <input
                      type="number"
                      required
                      value={requestedAmount}
                      onChange={(e) => setRequestedAmount(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Deliverable Document URL / CAD / PDF</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={documentUrl}
                    onChange={(e) => setDocumentUrl(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Supporting Render / Site Photo URL</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsSubmitModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm transition"
                  >
                    Submit Milestone to Admin
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ============================================================== */}
      {/* MODAL: AUDIT TRAIL & DOSSIER */}
      {/* ============================================================== */}
      <AnimatePresence>
        {isAuditModalOpen && selectedMilestoneForAudit && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-indigo-900 font-black text-base">
                  <ShieldCheck className="w-5 h-5 text-indigo-600" />
                  <span>Milestone Chain of Custody & Audit Trail</span>
                </div>
                <button
                  onClick={() => setIsAuditModalOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="font-black text-slate-900">{selectedMilestoneForAudit.name}</div>
                  <div className="text-slate-500 font-mono mt-0.5">ID: {selectedMilestoneForAudit.id} • Due: {selectedMilestoneForAudit.dueDate}</div>
                </div>

                <div className="space-y-3 pl-2 border-l-2 border-blue-200">
                  <div className="relative pl-4">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-600 absolute -left-[21px] top-1" />
                    <div className="font-bold text-slate-800">1. Designer Deliverable Submission</div>
                    <div className="text-slate-500 font-mono text-[11px]">
                      {selectedMilestoneForAudit.submissionDetails?.submittedAt
                        ? new Date(selectedMilestoneForAudit.submissionDetails.submittedAt).toLocaleString()
                        : 'Pending submission'}
                    </div>
                  </div>

                  <div className="relative pl-4">
                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 absolute -left-[21px] top-1" />
                    <div className="font-bold text-slate-800">2. Admin PMC Engineering Verification</div>
                    <div className="text-slate-500 font-mono text-[11px]">
                      {selectedMilestoneForAudit.adminReview?.reviewedAt
                        ? new Date(selectedMilestoneForAudit.adminReview.reviewedAt).toLocaleString()
                        : 'Awaiting Admin review'}
                    </div>
                  </div>

                  <div className="relative pl-4">
                    <div className="w-2.5 h-2.5 rounded-full bg-purple-600 absolute -left-[21px] top-1" />
                    <div className="font-bold text-slate-800">3. Customer Review & Sign-off</div>
                    <div className="text-slate-500 font-mono text-[11px]">
                      {selectedMilestoneForAudit.customerReview?.reviewedAt
                        ? new Date(selectedMilestoneForAudit.customerReview.reviewedAt).toLocaleString()
                        : 'Pending customer review'}
                    </div>
                  </div>

                  <div className="relative pl-4">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-600 absolute -left-[21px] top-1" />
                    <div className="font-bold text-slate-800">4. Escrow Payout Authorization</div>
                    <div className="text-slate-500 font-mono text-[11px]">
                      {selectedMilestoneForAudit.status === 'ADMIN_VERIFIED_COMPLETED'
                        ? 'Authorized for payment'
                        : 'Locked until approval'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-3 flex justify-end border-t border-slate-100">
                <button
                  onClick={() => setIsAuditModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
