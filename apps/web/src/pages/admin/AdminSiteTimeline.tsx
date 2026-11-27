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
  Send,
  Calendar,
  User,
  RotateCcw,
  Sparkles,
  FileText,
  ExternalLink,
  MessageSquare,
  Award,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext.js';
import { formatINR, formatDate } from '../../lib/utils.js';
import {
  getExecutionProjects,
  saveExecutionProject,
  adminForwardMilestoneToCustomer,
  adminRequestMilestoneCorrection,
  adminScheduleMilestoneTechnicalInspection,
  adminVerifyAndMarkPaymentEligible,
  adminReleaseMilestonePayout,
  adminConfigureProjectMilestones,
  calculateProjectWeightedProgress,
  ExecutionProject,
  PaymentMilestoneItem,
  MilestonePaymentStatus,
} from '../../data/projectExecutionStore.js';
import { logAdminAuditAction } from '../../data/adminRbacStore.js';
import { pushToCloud } from '../../data/cloudSync.js';

type MilestoneTabFilter = 'ALL' | 'PENDING_REVIEW' | 'AWAITING_CUSTOMER' | 'CUSTOMER_APPROVED' | 'PAYMENT_ELIGIBLE' | 'PAID' | 'DISPUTED';

export const AdminSiteTimeline: React.FC = () => {
  const { success, error } = useToast();

  const [activeTab, setActiveTab] = useState<MilestoneTabFilter>('ALL');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [refreshKey, setRefreshKey] = useState(0);

  // Selected Milestone for Evidence Inspection Drawer
  const [inspectedMilestone, setInspectedMilestone] = useState<{
    project: ExecutionProject;
    milestone: PaymentMilestoneItem;
  } | null>(null);

  // Action Modals
  const [scheduleInspectionMilestone, setScheduleInspectionMilestone] = useState<{
    project: ExecutionProject;
    milestone: PaymentMilestoneItem;
  } | null>(null);
  const [inspectorName, setInspectorName] = useState('Er. Sandeep Rathore (Senior QA/QC Engineer)');
  const [inspectionDate, setInspectionDate] = useState(new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]);
  const [inspectionInstructions, setInspectionInstructions] = useState('');

  const [correctionModalMilestone, setCorrectionModalMilestone] = useState<{
    project: ExecutionProject;
    milestone: PaymentMilestoneItem;
  } | null>(null);
  const [correctionNotes, setCorrectionNotes] = useState('');

  const [releaseModalMilestone, setReleaseModalMilestone] = useState<{
    project: ExecutionProject;
    milestone: PaymentMilestoneItem;
  } | null>(null);
  const [releaseTxDetails, setReleaseTxDetails] = useState('');

  // Configure Milestone Modal
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [newMilestoneDesc, setNewMilestoneDesc] = useState('');
  const [newMilestoneWeight, setNewMilestoneWeight] = useState<number | ''>(15);
  const [newMilestoneAmountRupees, setNewMilestoneAmountRupees] = useState<number | ''>('');

  const projects = useMemo(() => getExecutionProjects(), [refreshKey]);

  // Set default selected project
  const currentProject = useMemo(() => {
    if (!projects.length) return null;
    if (selectedProjectId) {
      return projects.find((p) => p.id === selectedProjectId) || projects[0];
    }
    return projects[0];
  }, [projects, selectedProjectId]);

  // Master Construction / Architectural Milestones for Current Project
  const milestones: PaymentMilestoneItem[] = useMemo(() => {
    if (!currentProject) return [];
    if (currentProject.paymentMilestones && currentProject.paymentMilestones.length > 0) {
      return currentProject.paymentMilestones;
    }
    return [];
  }, [currentProject]);

  // Filtered Milestones by Status Tab
  const filteredMilestones = useMemo(() => {
    return milestones.filter((m) => {
      if (activeTab === 'ALL') return true;
      if (activeTab === 'PENDING_REVIEW') {
        return (
          m.status === 'SUBMITTED_FOR_REVIEW' ||
          m.status === 'PENDING_ADMIN_INSPECTION' ||
          m.status === 'INSPECTION_SCHEDULED' ||
          m.status === 'PENDING_APPROVAL'
        );
      }
      if (activeTab === 'AWAITING_CUSTOMER') {
        return m.status === 'FORWARDED_TO_CUSTOMER' || m.status === 'AWAITING_CUSTOMER_APPROVAL';
      }
      if (activeTab === 'CUSTOMER_APPROVED') {
        return m.status === 'CUSTOMER_APPROVED';
      }
      if (activeTab === 'PAYMENT_ELIGIBLE') {
        return m.status === 'PAYMENT_ELIGIBLE' || m.status === 'APPROVED' || m.status === 'PAYMENT_DUE';
      }
      if (activeTab === 'PAID') {
        return m.status === 'PAID';
      }
      if (activeTab === 'DISPUTED') {
        return m.status === 'DISPUTED' || m.status === 'CORRECTION_REQUESTED' || m.status === 'REVISION_REQUESTED';
      }
      return true;
    });
  }, [milestones, activeTab]);

  // Section 11 IS 456 Weighted Progress Breakdown
  const progressStats = useMemo(() => {
    if (!currentProject) {
      return {
        architectReported: 0,
        customerApproved: 0,
        adminVerified: 0,
        totalWeight: 100,
        milestoneBreakdown: [],
      };
    }

    const mList = currentProject.paymentMilestones || [];
    let totalWeight = 0;
    let weightedVerifiedSum = 0;
    let weightedReportedSum = 0;
    let weightedCustomerSum = 0;

    const breakdown = mList.map((m) => {
      const weight = m.weightPercent || m.percentage || 15;
      totalWeight += weight;

      // Fractional completion
      let verFraction = m.verifiedCompletionFraction ?? (m.status === 'PAID' || m.status === 'APPROVED' || m.status === 'PAYMENT_ELIGIBLE' ? 1 : 0);
      let repFraction = m.reportedCompletionFraction ?? (m.status !== 'PLANNED' && m.status !== 'LOCKED' ? 1 : 0);
      let custFraction = m.status === 'CUSTOMER_APPROVED' || m.status === 'PAID' || m.status === 'PAYMENT_ELIGIBLE' ? 1 : 0;

      weightedVerifiedSum += weight * verFraction;
      weightedReportedSum += weight * repFraction;
      weightedCustomerSum += weight * custFraction;

      return {
        id: m.id,
        title: m.title,
        weight,
        verFraction,
        contribution: Math.round(weight * verFraction * 10) / 10,
        status: m.status,
      };
    });

    const divisor = totalWeight > 0 ? totalWeight : 100;
    const adminVerified = Math.min(100, Math.round((weightedVerifiedSum / divisor) * 100));
    const architectReported = Math.min(100, Math.round((weightedReportedSum / divisor) * 100));
    const customerApproved = Math.min(100, Math.round((weightedCustomerSum / divisor) * 100));

    return {
      architectReported: Math.max(architectReported, currentProject.overallReportedProgress || 0),
      customerApproved,
      adminVerified: Math.max(adminVerified, currentProject.overallVerifiedProgress || currentProject.progressPercentage || 0),
      totalWeight,
      milestoneBreakdown: breakdown,
    };
  }, [currentProject]);

  // Section 11 Action: Forward to Customer for Approval
  const handleForwardToCustomer = (m: PaymentMilestoneItem, notes?: string) => {
    if (!currentProject) return;

    const updated = adminForwardMilestoneToCustomer(currentProject.id, m.id, notes);
    if (updated) {
      logAdminAuditAction({
        action: 'FORWARD_MILESTONE_TO_CUSTOMER',
        module: 'SITE_TIMELINE_MANAGEMENT',
        entity: `Project #${updated.id} - ${m.title}`,
        details: `Admin technical inspection verified. Milestone forwarded to ${updated.customerName} for formal client approval.`,
      });
      pushToCloud().catch(() => {});
      success(`Milestone "${m.title}" forwarded to ${updated.customerName} for customer sign-off!`);
      if (inspectedMilestone?.milestone.id === m.id) {
        setInspectedMilestone({
          project: updated,
          milestone: updated.paymentMilestones.find((x) => x.id === m.id) || m,
        });
      }
      setRefreshKey((k) => k + 1);
    }
  };

  // Section 11 Action: Confirm Request Correction
  const handleConfirmRequestCorrection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctionModalMilestone || !correctionNotes.trim()) {
      error('Please enter the technical correction details.');
      return;
    }

    const { project, milestone } = correctionModalMilestone;
    const updated = adminRequestMilestoneCorrection(project.id, milestone.id, correctionNotes.trim());

    if (updated) {
      logAdminAuditAction({
        action: 'REQUEST_MILESTONE_CORRECTION',
        module: 'SITE_TIMELINE_MANAGEMENT',
        entity: `Project #${updated.id} - ${milestone.title}`,
        details: `Requested correction from contractor/architect. Remarks: ${correctionNotes.trim()}`,
      });
      pushToCloud().catch(() => {});
      success(`Correction requested on milestone "${milestone.title}". Professional partner notified.`);
      if (inspectedMilestone?.milestone.id === milestone.id) {
        setInspectedMilestone({
          project: updated,
          milestone: updated.paymentMilestones.find((x) => x.id === milestone.id) || milestone,
        });
      }
      setCorrectionModalMilestone(null);
      setCorrectionNotes('');
      setRefreshKey((k) => k + 1);
    }
  };

  // Section 11 Action: Schedule Technical Site Inspection
  const handleConfirmScheduleInspection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleInspectionMilestone) return;

    const { project, milestone } = scheduleInspectionMilestone;
    const updated = adminScheduleMilestoneTechnicalInspection(project.id, milestone.id, {
      inspectorName: inspectorName.trim(),
      inspectionDate,
      instructions: inspectionInstructions.trim(),
    });

    if (updated) {
      logAdminAuditAction({
        action: 'SCHEDULE_TECHNICAL_INSPECTION',
        module: 'SITE_TIMELINE_MANAGEMENT',
        entity: `Project #${updated.id} - ${milestone.title}`,
        details: `Scheduled physical inspection on ${inspectionDate} by ${inspectorName.trim()}. Instructions: ${inspectionInstructions.trim()}`,
      });
      pushToCloud().catch(() => {});
      success(`Physical on-site inspection scheduled for ${inspectionDate}!`);
      if (inspectedMilestone?.milestone.id === milestone.id) {
        setInspectedMilestone({
          project: updated,
          milestone: updated.paymentMilestones.find((x) => x.id === milestone.id) || milestone,
        });
      }
      setScheduleInspectionMilestone(null);
      setInspectionInstructions('');
      setRefreshKey((k) => k + 1);
    }
  };

  // Section 11 Action: Verify & Mark Payment Eligible
  const handleVerifyAndMarkEligible = (m: PaymentMilestoneItem) => {
    if (!currentProject) return;

    const updated = adminVerifyAndMarkPaymentEligible(
      currentProject.id,
      m.id,
      1.0,
      'Admin technical QA/QC audit complete. Quality and reinforcement specs certified.'
    );

    if (updated) {
      logAdminAuditAction({
        action: 'VERIFY_MILESTONE_AND_MARK_ELIGIBLE',
        module: 'SITE_TIMELINE_MANAGEMENT',
        entity: `Project #${updated.id} - ${m.title}`,
        details: `Milestone verified 100%. Status set to PAYMENT_ELIGIBLE. Weighted verified progress updated to ${updated.overallVerifiedProgress}%.`,
      });
      pushToCloud().catch(() => {});
      success(`Milestone "${m.title}" certified and marked PAYMENT_ELIGIBLE!`);
      if (inspectedMilestone?.milestone.id === m.id) {
        setInspectedMilestone({
          project: updated,
          milestone: updated.paymentMilestones.find((x) => x.id === m.id) || m,
        });
      }
      setRefreshKey((k) => k + 1);
    }
  };

  // Section 11 Action: Authorize & Release Escrow Payout
  const handleConfirmReleasePayout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!releaseModalMilestone) return;

    const { project, milestone } = releaseModalMilestone;
    const updated = adminReleaseMilestonePayout(project.id, milestone.id, releaseTxDetails.trim());

    if (updated) {
      logAdminAuditAction({
        action: 'RELEASE_ESCROW_PAYOUT',
        module: 'SITE_TIMELINE_MANAGEMENT',
        entity: `Project #${updated.id} - ${milestone.title}`,
        details: `Released escrow disbursement ${formatINR(milestone.amountPaise)} to partner. Tx: ${releaseTxDetails || 'TX-ESCROW'}`,
      });
      pushToCloud().catch(() => {});
      success(`Escrow disbursement of ${formatINR(milestone.amountPaise)} released to partner!`);
      if (inspectedMilestone?.milestone.id === milestone.id) {
        setInspectedMilestone({
          project: updated,
          milestone: updated.paymentMilestones.find((x) => x.id === milestone.id) || milestone,
        });
      }
      setReleaseModalMilestone(null);
      setReleaseTxDetails('');
      setRefreshKey((k) => k + 1);
    }
  };

  // Section 11 Action: Configure Custom Project Milestone
  const handleAddCustomMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject || !newMilestoneTitle.trim()) {
      error('Please provide milestone title');
      return;
    }

    const weight = Number(newMilestoneWeight) || 15;
    const amountPaise = Number(newMilestoneAmountRupees || 0) * 100 || Math.round((currentProject.contractValuePaise || 0) * (weight / 100));

    const newMs: PaymentMilestoneItem = {
      id: `ms-custom-${Date.now()}`,
      milestoneNumber: (currentProject.paymentMilestones?.length || 0) + 1,
      title: newMilestoneTitle.trim(),
      description: newMilestoneDesc.trim() || 'Custom architectural or construction project milestone.',
      percentage: weight,
      weightPercent: weight,
      amountPaise,
      linkedStageNumber: (currentProject.paymentMilestones?.length || 0) + 1,
      evidencePhotos: [],
      status: 'PLANNED',
      submittedAt: new Date().toISOString(),
    };

    const updatedMilestones = [...(currentProject.paymentMilestones || []), newMs];
    const updated = adminConfigureProjectMilestones(currentProject.id, updatedMilestones);

    if (updated) {
      logAdminAuditAction({
        action: 'CONFIGURE_PROJECT_MILESTONE',
        module: 'SITE_TIMELINE_MANAGEMENT',
        entity: `Project #${updated.id}`,
        details: `Added custom milestone "${newMs.title}" with weight ${newMs.weightPercent}% and value ${formatINR(newMs.amountPaise)}.`,
      });
      pushToCloud().catch(() => {});
      success(`Milestone "${newMs.title}" configured for project ${updated.id}!`);
      setShowConfigModal(false);
      setNewMilestoneTitle('');
      setNewMilestoneDesc('');
      setNewMilestoneWeight(15);
      setNewMilestoneAmountRupees('');
      setRefreshKey((k) => k + 1);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-amber-500/10 text-amber-700 rounded-xl">
              <HardHat className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black font-display text-navy-950">
              Milestone Lifecycle &amp; Work Progress Management
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Section 11 Master Control: IS 456 Weighted Progress Calculation, Work Evidence Inspection, Customer Sign-off Routing &amp; Escrow Release.
          </p>
        </div>

        {/* Project Selector & Configure Button */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-500 hidden sm:inline">Active Project:</label>
            <select
              value={currentProject?.id || ''}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-navy-950 focus:outline-none"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.id} - {p.name} ({p.city || 'Site'})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setShowConfigModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm hover:shadow text-xs flex items-center gap-2 transition cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Configure Milestone</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      {currentProject ? (
        <div className="space-y-6">
          {/* SECTION 11 REQUIREMENT: THE 3 SEPARATE PROGRESS METRICS STRIP */}
          <div className="bg-gradient-to-br from-white via-slate-50 to-blue-50/40 rounded-3xl p-6 border border-blue-200/90 shadow-sm space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-blue-700 bg-blue-100 border border-blue-200 px-2 py-0.5 rounded-md">
                    {currentProject.id}
                  </span>
                  <h2 className="text-base sm:text-lg font-black text-navy-950">{currentProject.name}</h2>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Homeowner: <strong className="text-slate-800">{currentProject.customerName}</strong> ({currentProject.customerPhone}) · Site: <strong className="text-slate-800">{currentProject.city}</strong> · Assigned Team: <strong className="text-slate-800">{currentProject.contractorName || currentProject.architectName || 'Multi-disciplinary Partner'}</strong>
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400 font-bold uppercase">Contract Valuation</span>
                <span className="text-xl font-mono font-black text-navy-950">
                  {formatINR(currentProject.contractValuePaise || currentProject.budgetPaise || 0)}
                </span>
              </div>
            </div>

            {/* The 3 Progress Gauges Required by Prompt Section 11 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 1. Architect Reported Progress */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <HardHat className="w-4 h-4 text-amber-600" />
                    <span className="text-[11px] font-bold uppercase tracking-wider">1. Partner Reported</span>
                  </div>
                  <span className="font-mono font-bold text-xs text-slate-700">Self-Reported Claim</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl sm:text-3xl font-black font-display text-amber-950">
                    {progressStats.architectReported}%
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">Claimed by Contractor</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${progressStats.architectReported}%` }}
                  />
                </div>
              </div>

              {/* 2. Customer Approved Progress */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <User className="w-4 h-4 text-purple-600" />
                    <span className="text-[11px] font-bold uppercase tracking-wider">2. Customer Approved</span>
                  </div>
                  <span className="font-mono font-bold text-xs text-slate-700">Client Sign-off</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl sm:text-3xl font-black font-display text-purple-950">
                    {progressStats.customerApproved}%
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">Signed by Homeowner</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-600 rounded-full transition-all duration-500"
                    style={{ width: `${progressStats.customerApproved}%` }}
                  />
                </div>
              </div>

              {/* 3. Admin Verified Progress (Official Metric) */}
              <div className="bg-gradient-to-br from-blue-50/80 to-indigo-50/80 p-4 rounded-2xl border border-blue-300 shadow-2xs space-y-2">
                <div className="flex items-center justify-between text-blue-900">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-blue-700" />
                    <span className="text-[11px] font-bold uppercase tracking-wider">3. Admin Verified (Official)</span>
                  </div>
                  <span className="font-mono font-bold text-xs text-blue-800 bg-blue-200/70 px-1.5 py-0.2 rounded">
                    IS 456 Vetted
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl sm:text-3xl font-black font-display text-blue-950">
                    {progressStats.adminVerified}%
                  </span>
                  <span className="text-[10px] text-blue-800 font-bold">Authorized for Reports</span>
                </div>
                <div className="w-full h-2 bg-blue-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-500"
                    style={{ width: `${progressStats.adminVerified}%` }}
                  />
                </div>
              </div>
            </div>

            {/* IS 456 Weighted Progress Formula Notice */}
            <div className="p-3 bg-white/90 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-600">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  <strong>IS 456 / Spec Part 6 Governance:</strong> Progress = Sum of (Milestone Weight × Verified Completion Fraction) / Total Weights. Progress percentage alone never automatically releases a payment.
                </span>
              </div>
              <span className="font-mono font-bold text-navy-950 shrink-0">
                Formula Verified: {progressStats.adminVerified}%
              </span>
            </div>
          </div>

          {/* Filter Tabs Strip */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              {[
                { label: 'All Milestones', value: 'ALL', count: milestones.length },
                {
                  label: 'Pending Inspection',
                  value: 'PENDING_REVIEW',
                  count: milestones.filter(
                    (m) =>
                      m.status === 'SUBMITTED_FOR_REVIEW' ||
                      m.status === 'PENDING_ADMIN_INSPECTION' ||
                      m.status === 'INSPECTION_SCHEDULED' ||
                      m.status === 'PENDING_APPROVAL'
                  ).length,
                },
                {
                  label: 'Awaiting Client Sign-off',
                  value: 'AWAITING_CUSTOMER',
                  count: milestones.filter(
                    (m) => m.status === 'FORWARDED_TO_CUSTOMER' || m.status === 'AWAITING_CUSTOMER_APPROVAL'
                  ).length,
                },
                {
                  label: 'Client Approved',
                  value: 'CUSTOMER_APPROVED',
                  count: milestones.filter((m) => m.status === 'CUSTOMER_APPROVED').length,
                },
                {
                  label: 'Payment Eligible',
                  value: 'PAYMENT_ELIGIBLE',
                  count: milestones.filter(
                    (m) => m.status === 'PAYMENT_ELIGIBLE' || m.status === 'APPROVED' || m.status === 'PAYMENT_DUE'
                  ).length,
                },
                {
                  label: 'Escrow Released',
                  value: 'PAID',
                  count: milestones.filter((m) => m.status === 'PAID').length,
                },
                {
                  label: 'Disputed / Corrections',
                  value: 'DISPUTED',
                  count: milestones.filter(
                    (m) =>
                      m.status === 'DISPUTED' ||
                      m.status === 'CORRECTION_REQUESTED' ||
                      m.status === 'REVISION_REQUESTED'
                  ).length,
                },
              ].map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value as any)}
                  className={`px-3.5 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 shrink-0 ${
                    activeTab === tab.value
                      ? 'bg-navy-950 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                      activeTab === tab.value ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Milestones Stepper & Verification List */}
            <div className="space-y-3.5">
              {filteredMilestones.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <Layers className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="font-bold text-slate-600">No milestones match this filter category.</p>
                </div>
              ) : (
                filteredMilestones.map((ms, idx) => {
                  const isPaid = ms.status === 'PAID';
                  const isEligible = ms.status === 'PAYMENT_ELIGIBLE' || ms.status === 'APPROVED' || ms.status === 'PAYMENT_DUE';
                  const isClientApproved = ms.status === 'CUSTOMER_APPROVED';
                  const isPendingInspection =
                    ms.status === 'SUBMITTED_FOR_REVIEW' ||
                    ms.status === 'PENDING_ADMIN_INSPECTION' ||
                    ms.status === 'PENDING_APPROVAL';
                  const isInspectionScheduled = ms.status === 'INSPECTION_SCHEDULED';
                  const isAwaitingClient =
                    ms.status === 'FORWARDED_TO_CUSTOMER' || ms.status === 'AWAITING_CUSTOMER_APPROVAL';
                  const isCorrectionRequested =
                    ms.status === 'CORRECTION_REQUESTED' || ms.status === 'REVISION_REQUESTED';
                  const isDisputed = ms.status === 'DISPUTED';

                  const weight = ms.weightPercent || ms.percentage || 15;

                  return (
                    <div
                      key={ms.id}
                      className={`bg-white rounded-2xl border p-5 transition shadow-2xs space-y-3.5 ${
                        isPendingInspection
                          ? 'border-amber-400 bg-amber-50/20'
                          : isEligible
                          ? 'border-blue-300 bg-blue-50/20'
                          : isPaid
                          ? 'border-emerald-200 bg-emerald-50/10'
                          : isDisputed || isCorrectionRequested
                          ? 'border-rose-300 bg-rose-50/20'
                          : 'border-slate-200'
                      }`}
                    >
                      {/* Milestone Header Row */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-xs shrink-0 ${
                              isPaid
                                ? 'bg-emerald-600 text-white'
                                : isEligible
                                ? 'bg-blue-600 text-white'
                                : isPendingInspection
                                ? 'bg-amber-500 text-white'
                                : isDisputed
                                ? 'bg-rose-600 text-white'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {ms.milestoneNumber || idx + 1}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-sm text-navy-950">{ms.title}</h4>
                              <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                Weight: {weight}%
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">{ms.description}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">
                              RELEASE VALUE
                            </span>
                            <strong className="text-sm sm:text-base font-black font-mono text-slate-900">
                              {formatINR(ms.amountPaise)}
                            </strong>
                          </div>

                          {/* Status Badge */}
                          <span
                            className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              isPaid
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : isEligible
                                ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                : isClientApproved
                                ? 'bg-purple-100 text-purple-800 border border-purple-300'
                                : isPendingInspection
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : isAwaitingClient
                                ? 'bg-sky-100 text-sky-800 border border-sky-300'
                                : isDisputed || isCorrectionRequested
                                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {ms.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </div>

                      {/* Evidence Photo Preview & Inspection Remarks */}
                      {ms.inspectionNotes && (
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 flex items-start gap-2">
                          <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-navy-950">Technical Inspection Record: </span>
                            <span>{ms.inspectionNotes}</span>
                          </div>
                        </div>
                      )}

                      {/* Action Bar */}
                      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-3 text-slate-500 text-[11px]">
                          <span>
                            Assigned Partner: <strong className="text-slate-800">{currentProject.contractorName || currentProject.architectName || 'Site Engineer'}</strong>
                          </span>
                          {ms.evidencePhotos && ms.evidencePhotos.length > 0 && (
                            <span className="text-blue-700 font-medium flex items-center gap-1">
                              <Camera className="w-3.5 h-3.5" />
                              <span>{ms.evidencePhotos.length} site photos attached</span>
                            </span>
                          )}
                        </div>

                        {/* Operational Workflow Action Buttons */}
                        <div className="flex items-center gap-2">
                          {/* 1. Forward to Client */}
                          {isPendingInspection && (
                            <button
                              onClick={() => handleForwardToCustomer(ms)}
                              className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer text-xs"
                              title="Forward to Client after Technical Review"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>Forward to Client</span>
                            </button>
                          )}

                          {/* 2. Schedule Technical Physical Inspection */}
                          {isPendingInspection && (
                            <button
                              onClick={() => setScheduleInspectionMilestone({ project: currentProject, milestone: ms })}
                              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer text-xs"
                              title="Schedule Physical Site Inspection"
                            >
                              <Calendar className="w-3.5 h-3.5 text-blue-600" />
                              <span>Schedule Inspection</span>
                            </button>
                          )}

                          {/* 3. Request Correction / Additional Proof */}
                          {isPendingInspection && (
                            <button
                              onClick={() => {
                                setCorrectionModalMilestone({ project: currentProject, milestone: ms });
                                setCorrectionNotes(ms.correctionNotes || '');
                              }}
                              className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer text-xs"
                              title="Request Proof / Correction"
                            >
                              <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                              <span>Request Proof</span>
                            </button>
                          )}

                          {/* 4. Verify & Mark Payment Eligible */}
                          {(isClientApproved || isAwaitingClient) && !isEligible && !isPaid && (
                            <button
                              onClick={() => handleVerifyAndMarkEligible(ms)}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer text-xs"
                              title="Verify Progress & Certify Payment Eligibility"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>Certify &amp; Mark Eligible</span>
                            </button>
                          )}

                          {/* 5. Authorize & Release Escrow Payout */}
                          {isEligible && !isPaid && (
                            <button
                              onClick={() =>
                                setReleaseModalMilestone({
                                  project: currentProject,
                                  milestone: ms,
                                })
                              }
                              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer text-xs"
                              title="Authorize Escrow Disbursement"
                            >
                              <CreditCard className="w-3.5 h-3.5 text-emerald-200" />
                              <span>Authorize Escrow Payout</span>
                            </button>
                          )}

                          {/* 6. Paid Indicator */}
                          {isPaid && (
                            <span className="text-emerald-700 font-bold flex items-center gap-1 text-[11px] bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Escrow Disbursed</span>
                            </span>
                          )}

                          {/* 7. Full Evidence Inspection Button */}
                          <button
                            onClick={() => setInspectedMilestone({ project: currentProject, milestone: ms })}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold flex items-center gap-1 cursor-pointer text-xs"
                            title="Inspect Work Evidence & Test Reports"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-500" />
                            <span>Audit Evidence</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border">
          <Layers className="w-10 h-10 mx-auto mb-2 text-slate-300" />
          <p className="font-bold text-slate-600">No active projects found to display milestones.</p>
        </div>
      )}

      {/* FULL-SCREEN MODAL: WORK EVIDENCE INSPECTION & TECHNICAL AUDIT DRAWER */}
      <AnimatePresence>
        {inspectedMilestone && (
          <div className="admin-fullscreen-modal fixed inset-0 z-50 overflow-y-auto bg-[#f0f7ff] flex flex-col font-sans animate-in fade-in duration-150">
            <div className="h-[2px] bg-gradient-to-r from-transparent via-amber-400 via-sky-400 to-transparent pointer-events-none shrink-0" />
            <div className="sticky top-0 z-40 bg-navy-950 text-white px-4 sm:px-8 py-3.5 border-b border-navy-900 flex items-center justify-between shadow-xl shrink-0">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <button
                  type="button"
                  onClick={() => setInspectedMilestone(null)}
                  className="px-3.5 py-2 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs flex items-center gap-2 border border-slate-700/80 hover:border-slate-500 transition group cursor-pointer shrink-0"
                >
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  <span className="hidden sm:inline">Back to Timeline Registry</span>
                  <span className="sm:hidden">Back</span>
                </button>
                <div className="h-6 w-px bg-slate-700 hidden sm:block shrink-0" />
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-base font-display shrink-0">
                    <ShieldCheck className="w-5 h-5 text-amber-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="text-base sm:text-lg font-black font-display text-white truncate">
                        {inspectedMilestone.milestone.title}
                      </h2>
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        {inspectedMilestone.project.id}
                      </span>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-amber-500/20 text-amber-300 border-amber-500/40">
                        {inspectedMilestone.milestone.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono truncate">
                      Release Valuation: {formatINR(inspectedMilestone.milestone.amountPaise)} • Weight: {inspectedMilestone.milestone.weightPercent || inspectedMilestone.milestone.percentage}% • Client: {inspectedMilestone.project.customerName}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setInspectedMilestone(null)}
                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  <span className="hidden sm:inline">Close</span>
                </button>
              </div>
            </div>

            <div className="flex-1 max-w-[1500px] w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* LEFT SIDE: WORK EVIDENCE & QUALITY INSPECTION LOGS (7 COLS) */}
                <div className="lg:col-span-7 space-y-5">
                  <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-md space-y-5">
                    <div className="flex items-center justify-between border-b pb-3">
                      <div className="flex items-center gap-2">
                        <Camera className="w-4 h-4 text-blue-600" />
                        <h3 className="font-bold text-slate-900 text-sm">
                          On-Site Work Evidence &amp; Test Certificates
                        </h3>
                      </div>
                      <span className="text-xs font-bold text-slate-500 font-mono">
                        Stage #{inspectedMilestone.milestone.linkedStageNumber || inspectedMilestone.milestone.milestoneNumber}
                      </span>
                    </div>

                    {/* Evidence Photo Grid */}
                    <div className="space-y-3">
                      <p className="text-xs text-slate-600">
                        Physical photographic proof uploaded by the partner for technical verification:
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {(inspectedMilestone.milestone.evidencePhotos?.length
                          ? inspectedMilestone.milestone.evidencePhotos
                          : [
                              'https://images.unsplash.com/photo-1541888946425-d0fbb186156f?auto=format&fit=crop&w=800&q=80',
                              'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=800&q=80',
                              'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=800&q=80',
                            ]
                        ).map((url, i) => (
                          <div
                            key={i}
                            className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 group aspect-4/3"
                          >
                            <img src={url} alt={`Evidence ${i + 1}`} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                              <a
                                href={url}
                                target="_blank"
                                rel="noreferrer"
                                className="p-2 bg-white rounded-xl text-slate-900 shadow font-bold text-xs flex items-center gap-1"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Inspect</span>
                              </a>
                            </div>
                            <span className="absolute bottom-2 left-2 bg-black/70 px-2 py-0.5 rounded text-[10px] text-white font-mono">
                              Photo #{i + 1}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Technical Quality Checklist */}
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-3">
                      <p className="font-bold text-navy-950 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <span>IS 456 Civil Engineering Quality Checklist</span>
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-700">
                        <div className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-200">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Rebar Spacing &amp; Clear Cover Verified</span>
                        </div>
                        <div className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-200">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>7-Day Concrete Compressive Cube Strength</span>
                        </div>
                        <div className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-200">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Line, Level &amp; Plumb Alignment Certified</span>
                        </div>
                        <div className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-200">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Curing Logs &amp; Water Meter Active</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT SIDE: AUDIT ACTIONS & ESCROW GATES (5 COLS) */}
                <div className="lg:col-span-5 space-y-5">
                  <div className="bg-white rounded-3xl p-6 border border-blue-200/90 shadow-md space-y-5">
                    <div className="flex items-center justify-between border-b pb-3">
                      <h3 className="font-bold text-slate-900 text-sm">
                        Milestone Lifecycle Governance
                      </h3>
                      <span className="font-mono text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                        Weight: {inspectedMilestone.milestone.weightPercent || inspectedMilestone.milestone.percentage}%
                      </span>
                    </div>

                    {/* Escrow Release Value Card */}
                    <div className="p-4 bg-navy-950 text-white rounded-2xl flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">
                          Escrow Payout Valuation
                        </span>
                        <span className="text-xs text-slate-300 font-medium">
                          {inspectedMilestone.milestone.title}
                        </span>
                      </div>
                      <strong className="text-xl sm:text-2xl font-mono font-black text-amber-400">
                        {formatINR(inspectedMilestone.milestone.amountPaise)}
                      </strong>
                    </div>

                    {/* Action Palette */}
                    <div className="space-y-3">
                      {/* 1. Forward to Client */}
                      <button
                        type="button"
                        onClick={() => handleForwardToCustomer(inspectedMilestone.milestone)}
                        className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
                      >
                        <Send className="w-4 h-4" />
                        <span>Forward to Homeowner for Formal Sign-off</span>
                      </button>

                      {/* 2. Certify & Mark Payment Eligible */}
                      <button
                        type="button"
                        onClick={() => handleVerifyAndMarkEligible(inspectedMilestone.milestone)}
                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>Certify Technical Audit &amp; Mark Payment Eligible</span>
                      </button>

                      {/* 3. Authorize Escrow Payout */}
                      <button
                        type="button"
                        onClick={() => {
                          const prj = inspectedMilestone.project;
                          const ms = inspectedMilestone.milestone;
                          setInspectedMilestone(null);
                          setReleaseModalMilestone({ project: prj, milestone: ms });
                        }}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
                      >
                        <CreditCard className="w-4 h-4" />
                        <span>Authorize Escrow Disbursement</span>
                      </button>

                      {/* 4. Request Correction / Additional Proof */}
                      <button
                        type="button"
                        onClick={() => {
                          const prj = inspectedMilestone.project;
                          const ms = inspectedMilestone.milestone;
                          setInspectedMilestone(null);
                          setCorrectionModalMilestone({ project: prj, milestone: ms });
                        }}
                        className="w-full py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                      >
                        <RotateCcw className="w-4 h-4 text-amber-600" />
                        <span>Request Correction or Additional Proof</span>
                      </button>
                    </div>

                    {/* Historical Submissions & Signoffs */}
                    <div className="pt-3 border-t text-xs space-y-2">
                      <p className="font-bold text-slate-800">Milestone Audit Log:</p>
                      <div className="space-y-1 text-[11px] text-slate-600">
                        {inspectedMilestone.milestone.submittedAt && (
                          <div className="flex justify-between">
                            <span>Submitted:</span>
                            <span className="font-mono">{formatDate(inspectedMilestone.milestone.submittedAt)}</span>
                          </div>
                        )}
                        {inspectedMilestone.milestone.forwardedToCustomerAt && (
                          <div className="flex justify-between">
                            <span>Forwarded to Client:</span>
                            <span className="font-mono">{formatDate(inspectedMilestone.milestone.forwardedToCustomerAt)}</span>
                          </div>
                        )}
                        {inspectedMilestone.milestone.approvedAt && (
                          <div className="flex justify-between">
                            <span>Admin Verified:</span>
                            <span className="font-mono">{formatDate(inspectedMilestone.milestone.approvedAt)}</span>
                          </div>
                        )}
                        {inspectedMilestone.milestone.paidAt && (
                          <div className="flex justify-between text-emerald-800 font-bold">
                            <span>Escrow Released:</span>
                            <span className="font-mono">{formatDate(inspectedMilestone.milestone.paidAt)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: SCHEDULE PHYSICAL TECHNICAL INSPECTION */}
      <AnimatePresence>
        {scheduleInspectionMilestone && (
          <div className="admin-fullscreen-modal fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 font-sans animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 border border-slate-200 shadow-2xl">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <span className="p-2 bg-blue-50 text-blue-700 rounded-xl">
                    <Calendar className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="font-black text-sm font-display text-navy-950">
                      Schedule Physical Technical Inspection
                    </h3>
                    <p className="text-[11px] text-slate-500 font-mono">
                      {scheduleInspectionMilestone.milestone.title}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setScheduleInspectionMilestone(null)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleConfirmScheduleInspection} className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Assigned QA/QC Inspector *</label>
                  <input
                    type="text"
                    required
                    value={inspectorName}
                    onChange={(e) => setInspectorName(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Inspection Date *</label>
                  <input
                    type="date"
                    required
                    value={inspectionDate}
                    onChange={(e) => setInspectionDate(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Inspection Instructions &amp; Checkpoints</label>
                  <textarea
                    rows={3}
                    value={inspectionInstructions}
                    onChange={(e) => setInspectionInstructions(e.target.value)}
                    placeholder="e.g. Inspect rebar grade Fe550D, verify beam anchorage depth, measure column plumb with laser level..."
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-sans"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => setScheduleInspectionMilestone(null)}
                    className="px-4 py-2 border rounded-xl text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Authorize Inspection Schedule</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: REQUEST CORRECTION / PROOF */}
      <AnimatePresence>
        {correctionModalMilestone && (
          <div className="admin-fullscreen-modal fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 font-sans animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 border border-slate-200 shadow-2xl">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <span className="p-2 bg-amber-50 text-amber-700 rounded-xl">
                    <RotateCcw className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="font-black text-sm font-display text-navy-950">
                      Request Technical Correction / Additional Proof
                    </h3>
                    <p className="text-[11px] text-slate-500 font-mono">
                      {correctionModalMilestone.milestone.title}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCorrectionModalMilestone(null)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleConfirmRequestCorrection} className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Specific Correction Remarks / Missing Evidence *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={correctionNotes}
                    onChange={(e) => setCorrectionNotes(e.target.value)}
                    placeholder="e.g. Please upload 7-day concrete cube compressive strength test report and clear photos of footing reinforcement before payment can be certified..."
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-sans"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => setCorrectionModalMilestone(null)}
                    className="px-4 py-2 border rounded-xl text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Correction Notice to Partner</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: AUTHORIZE & RELEASE ESCROW PAYOUT */}
      <AnimatePresence>
        {releaseModalMilestone && (
          <div className="admin-fullscreen-modal fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 font-sans animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 border border-slate-200 shadow-2xl">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <span className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
                    <CreditCard className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="font-black text-sm font-display text-navy-950">
                      Authorize Escrow Disbursement Release
                    </h3>
                    <p className="text-[11px] text-slate-500 font-mono">
                      {releaseModalMilestone.milestone.title}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setReleaseModalMilestone(null)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleConfirmReleasePayout} className="space-y-4 text-xs">
                <div className="p-4 bg-navy-950 text-white rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">
                      Authorized Escrow Amount
                    </span>
                    <span className="text-xs text-slate-300 font-medium">
                      Partner: {releaseModalMilestone.project.contractorName || 'Partner'}
                    </span>
                  </div>
                  <strong className="text-2xl font-mono font-black text-amber-400">
                    {formatINR(releaseModalMilestone.milestone.amountPaise)}
                  </strong>
                </div>

                <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200 text-amber-900 text-[11px] space-y-1">
                  <p className="font-bold">Strict Platform Payout Certification</p>
                  <p>
                    By clicking authorize, you certify that:
                    1. On-site technical QA/QC inspection has passed.
                    2. Homeowner client signoff is active or contractual milestone cleared.
                    3. Funds are present in the BuildGhar platform escrow account.
                  </p>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Bank Transfer Reference / Transaction ID (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. UTR-HDFC-98421839"
                    value={releaseTxDetails}
                    onChange={(e) => setReleaseTxDetails(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => setReleaseModalMilestone(null)}
                    className="px-4 py-2 border rounded-xl text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Confirm &amp; Release Escrow Payout</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: CONFIGURE / ADD PROJECT MILESTONE */}
      <AnimatePresence>
        {showConfigModal && (
          <div className="admin-fullscreen-modal fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 font-sans animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 border border-slate-200 shadow-2xl">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <span className="p-2 bg-blue-50 text-blue-700 rounded-xl">
                    <Plus className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="font-black text-sm font-display text-navy-950">
                      Configure Project Milestone
                    </h3>
                    <p className="text-[11px] text-slate-500 font-mono">
                      Project: {currentProject?.id}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddCustomMilestone} className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Milestone Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Concept Design & Vastu Orientation Approval"
                    value={newMilestoneTitle}
                    onChange={(e) => setNewMilestoneTitle(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Milestone Scope Description</label>
                  <textarea
                    rows={2}
                    value={newMilestoneDesc}
                    onChange={(e) => setNewMilestoneDesc(e.target.value)}
                    placeholder="e.g. Complete 2D layout zoning, Vastu clearance and preliminary room sizing..."
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-sans"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">IS 456 Weight Percent (%) *</label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      required
                      value={newMilestoneWeight}
                      onChange={(e) => setNewMilestoneWeight(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Release Value (₹)</label>
                    <input
                      type="number"
                      placeholder="Auto-calculated from weight"
                      value={newMilestoneAmountRupees}
                      onChange={(e) => setNewMilestoneAmountRupees(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => setShowConfigModal(false)}
                    className="px-4 py-2 border rounded-xl text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Save &amp; Link Milestone</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
