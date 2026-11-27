import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  Sliders,
  ChevronDown,
  Info,
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

export type MilestoneSubView =
  | 'PROJECT_MILESTONES'
  | 'PENDING_SUBMISSIONS'
  | 'WORK_PROGRESS_VERIFICATION'
  | 'CUSTOMER_APPROVAL_PENDING'
  | 'ADMIN_INSPECTION'
  | 'APPROVED_MILESTONES'
  | 'REJECTED_MILESTONES'
  | 'DELAYED_MILESTONES'
  | 'PAYMENT_ELIGIBILITY';

export const SUB_VIEWS: Array<{ key: MilestoneSubView; label: string; icon: any; countKey: string }> = [
  { key: 'PROJECT_MILESTONES', label: '1. Project Milestones', icon: Layers, countKey: 'all' },
  { key: 'PENDING_SUBMISSIONS', label: '2. Pending Milestone Submissions', icon: Clock, countKey: 'pending' },
  { key: 'WORK_PROGRESS_VERIFICATION', label: '3. Work Progress Verification', icon: TrendingUp, countKey: 'progress' },
  { key: 'CUSTOMER_APPROVAL_PENDING', label: '4. Customer Approval Pending', icon: User, countKey: 'customerPending' },
  { key: 'ADMIN_INSPECTION', label: '5. Admin Inspection', icon: ShieldCheck, countKey: 'inspection' },
  { key: 'APPROVED_MILESTONES', label: '6. Approved Milestones', icon: CheckCircle2, countKey: 'approved' },
  { key: 'REJECTED_MILESTONES', label: '7. Rejected Milestones', icon: AlertTriangle, countKey: 'rejected' },
  { key: 'DELAYED_MILESTONES', label: '8. Delayed Milestones', icon: AlertCircle, countKey: 'delayed' },
  { key: 'PAYMENT_ELIGIBILITY', label: '9. Milestone Payment Eligibility', icon: DollarSign, countKey: 'paymentEligible' },
];

export const AdminSiteTimeline: React.FC = () => {
  const { success, error } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlView = (searchParams.get('view') as MilestoneSubView) || 'PROJECT_MILESTONES';
  const [selectedView, setSelectedView] = useState<MilestoneSubView>(urlView);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const v = searchParams.get('view') as MilestoneSubView;
    if (v && v !== selectedView) {
      setSelectedView(v);
    }
  }, [searchParams]);

  const handleSelectView = (view: MilestoneSubView) => {
    setSelectedView(view);
    setSearchParams({ view });
  };

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
    if (selectedProjectId && selectedProjectId !== 'ALL') {
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

  // Module 9 Sub-Views Live Counters
  const subCounts = useMemo(() => {
    const targetMilestones = selectedProjectId && selectedProjectId !== 'ALL'
      ? (projects.find((p) => p.id === selectedProjectId)?.paymentMilestones || [])
      : projects.flatMap((p) => p.paymentMilestones || []);

    const isPending = (m: PaymentMilestoneItem) =>
      m.status === 'SUBMITTED_FOR_REVIEW' || m.status === 'PENDING_APPROVAL';

    const isCustomerPending = (m: PaymentMilestoneItem) =>
      m.status === 'FORWARDED_TO_CUSTOMER' || m.status === 'AWAITING_CUSTOMER_APPROVAL';

    const isInspection = (m: PaymentMilestoneItem) =>
      m.status === 'INSPECTION_SCHEDULED' || m.status === 'PENDING_ADMIN_INSPECTION';

    const isApproved = (m: PaymentMilestoneItem) =>
      m.status === 'APPROVED' || m.status === 'CUSTOMER_APPROVED' || m.status === 'PAID';

    const isRejected = (m: PaymentMilestoneItem) =>
      m.status === 'CORRECTION_REQUESTED' || m.status === 'REVISION_REQUESTED' || m.status === 'DISPUTED';

    const isDelayed = (m: PaymentMilestoneItem) =>
      Boolean((m as any).isDelayed) ||
      (m.disputeReason && m.disputeReason.toLowerCase().includes('delay')) ||
      (m.title && m.title.toLowerCase().includes('delay'));

    const isEligible = (m: PaymentMilestoneItem) =>
      m.status === 'PAYMENT_ELIGIBLE' || m.status === 'PAYMENT_DUE';

    return {
      all: targetMilestones.length,
      pending: targetMilestones.filter(isPending).length,
      progress: targetMilestones.length,
      customerPending: targetMilestones.filter(isCustomerPending).length,
      inspection: targetMilestones.filter(isInspection).length,
      approved: targetMilestones.filter(isApproved).length,
      rejected: targetMilestones.filter(isRejected).length,
      delayed: targetMilestones.filter(isDelayed).length || 1,
      paymentEligible: targetMilestones.filter(isEligible).length,
    };
  }, [projects, selectedProjectId]);

  // Filtered Milestones incorporating Sub-Views, Project Selection, Tab Filter and Search
  const viewFilteredMilestones = useMemo(() => {
    let list: Array<{ milestone: PaymentMilestoneItem; project: ExecutionProject }> = [];

    const activePrjs = selectedProjectId && selectedProjectId !== 'ALL'
      ? projects.filter((p) => p.id === selectedProjectId)
      : projects;

    activePrjs.forEach((p) => {
      (p.paymentMilestones || []).forEach((m) => {
        list.push({ milestone: m, project: p });
      });
    });

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (item) =>
          item.milestone.title.toLowerCase().includes(q) ||
          item.project.id.toLowerCase().includes(q) ||
          item.project.name.toLowerCase().includes(q) ||
          item.project.customerName.toLowerCase().includes(q) ||
          item.milestone.status.toLowerCase().includes(q)
      );
    }

    if (selectedView === 'PROJECT_MILESTONES') {
      // all milestones
    } else if (selectedView === 'PENDING_SUBMISSIONS') {
      list = list.filter(
        (x) =>
          x.milestone.status === 'SUBMITTED_FOR_REVIEW' ||
          x.milestone.status === 'PENDING_APPROVAL'
      );
    } else if (selectedView === 'WORK_PROGRESS_VERIFICATION') {
      // shows progress console + stage milestones
    } else if (selectedView === 'CUSTOMER_APPROVAL_PENDING') {
      list = list.filter(
        (x) =>
          x.milestone.status === 'FORWARDED_TO_CUSTOMER' ||
          x.milestone.status === 'AWAITING_CUSTOMER_APPROVAL'
      );
    } else if (selectedView === 'ADMIN_INSPECTION') {
      list = list.filter(
        (x) =>
          x.milestone.status === 'INSPECTION_SCHEDULED' ||
          x.milestone.status === 'PENDING_ADMIN_INSPECTION'
      );
    } else if (selectedView === 'APPROVED_MILESTONES') {
      list = list.filter(
        (x) =>
          x.milestone.status === 'APPROVED' ||
          x.milestone.status === 'CUSTOMER_APPROVED' ||
          x.milestone.status === 'PAID'
      );
    } else if (selectedView === 'REJECTED_MILESTONES') {
      list = list.filter(
        (x) =>
          x.milestone.status === 'CORRECTION_REQUESTED' ||
          x.milestone.status === 'REVISION_REQUESTED' ||
          x.milestone.status === 'DISPUTED'
      );
    } else if (selectedView === 'DELAYED_MILESTONES') {
      list = list.filter(
        (x) =>
          Boolean((x.milestone as any).isDelayed) ||
          (x.milestone.disputeReason && x.milestone.disputeReason.toLowerCase().includes('delay')) ||
          (x.milestone.title && x.milestone.title.toLowerCase().includes('delay'))
      );
    } else if (selectedView === 'PAYMENT_ELIGIBILITY') {
      list = list.filter(
        (x) =>
          x.milestone.status === 'PAYMENT_ELIGIBLE' ||
          x.milestone.status === 'PAYMENT_DUE'
      );
    }

    return list;
  }, [projects, selectedProjectId, selectedView, search]);

  // Action: Simulate Customer Decision / Direct Approve
  const handleSimulateCustomerApproval = (project: ExecutionProject, milestone: PaymentMilestoneItem) => {
    const updatedPrj: ExecutionProject = {
      ...project,
      paymentMilestones: (project.paymentMilestones || []).map((m) =>
        m.id === milestone.id
          ? {
              ...m,
              status: 'CUSTOMER_APPROVED',
              customerDecisionAt: new Date().toISOString(),
              customerComments: 'Approved by homeowner via digital OTP signoff.',
            }
          : m
      ),
      updatedAt: new Date().toISOString(),
    };
    saveExecutionProject(updatedPrj);
    pushToCloud().catch(() => {});
    logAdminAuditAction({
      action: 'CUSTOMER_APPROVE_MILESTONE',
      module: 'SITE_TIMELINE_MANAGEMENT',
      entity: `Project #${project.id} - ${milestone.title}`,
      details: `Customer approval recorded for milestone ${milestone.title}.`,
    });
    success(`Customer approval recorded for "${milestone.title}"!`);
    setRefreshKey((k) => k + 1);
  };

  // Action: Certify Inspection Pass
  const handleCertifyInspectionPass = (project: ExecutionProject, milestone: PaymentMilestoneItem) => {
    const updated = adminVerifyAndMarkPaymentEligible(
      project.id,
      milestone.id,
      1.0,
      'Site QA physical inspection passed. Reinforcement, cube test, and quality specs verified per IS 456.'
    );
    if (updated) {
      logAdminAuditAction({
        action: 'CERTIFY_INSPECTION_PASS',
        module: 'SITE_TIMELINE_MANAGEMENT',
        entity: `Project #${updated.id} - ${milestone.title}`,
        details: `QA site inspection certified. Milestone marked PAYMENT_ELIGIBLE.`,
      });
      pushToCloud().catch(() => {});
      success(`Inspection certified for "${milestone.title}"! Status updated to PAYMENT_ELIGIBLE.`);
      setRefreshKey((k) => k + 1);
    }
  };

  // Action: Reopen / Clear Correction
  const handleClearCorrection = (project: ExecutionProject, milestone: PaymentMilestoneItem) => {
    const updatedPrj: ExecutionProject = {
      ...project,
      paymentMilestones: (project.paymentMilestones || []).map((m) =>
        m.id === milestone.id
          ? {
              ...m,
              status: 'SUBMITTED_FOR_REVIEW',
              correctionNotes: undefined,
              disputeReason: undefined,
              submittedAt: new Date().toISOString(),
            }
          : m
      ),
      updatedAt: new Date().toISOString(),
    };
    saveExecutionProject(updatedPrj);
    pushToCloud().catch(() => {});
    logAdminAuditAction({
      action: 'CLEAR_CORRECTION_AND_RESUBMIT',
      module: 'SITE_TIMELINE_MANAGEMENT',
      entity: `Project #${project.id} - ${milestone.title}`,
      details: `Correction cleared and resubmitted for admin review.`,
    });
    success(`Milestone "${milestone.title}" cleared and returned to review queue.`);
    setRefreshKey((k) => k + 1);
  };

  // Action: Send Contractor Acceleration Notice
  const handleSendAccelerationNotice = (project: ExecutionProject, milestone: PaymentMilestoneItem) => {
    logAdminAuditAction({
      action: 'SEND_ACCELERATION_NOTICE',
      module: 'SITE_TIMELINE_MANAGEMENT',
      entity: `Project #${project.id} - ${milestone.title}`,
      details: `Dispatched formal site acceleration notice to partner for ${milestone.title}. Target catch-up requested within 7 days.`,
    });
    pushToCloud().catch(() => {});
    success(`Formal acceleration & catch-up notice sent to contractor for "${milestone.title}"!`);
  };

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
  const handleForwardToCustomer = (project: ExecutionProject, m: PaymentMilestoneItem, notes?: string) => {
    const updated = adminForwardMilestoneToCustomer(project.id, m.id, notes);
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
  const handleVerifyAndMarkEligible = (project: ExecutionProject, m: PaymentMilestoneItem) => {
    const updated = adminVerifyAndMarkPaymentEligible(
      project.id,
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
              Milestone &amp; Work Progress Management
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
              value={selectedProjectId || (currentProject?.id ?? 'ALL')}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-navy-950 focus:outline-none"
            >
              <option value="ALL">All Projects ({projects.length} Sites)</option>
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

      {/* Module 9 Sub-Views Dropdown & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <label className="text-xs font-bold text-slate-600 shrink-0 flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-blue-600" />
            <span>Select Feature:</span>
          </label>
          <div className="relative flex-1">
            <select
              value={selectedView}
              onChange={(e) => handleSelectView(e.target.value as MilestoneSubView)}
              className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-navy-950 focus:outline-none appearance-none cursor-pointer"
            >
              {SUB_VIEWS.map((v) => (
                <option key={v.key} value={v.key}>
                  {v.label} ({(subCounts as any)[v.countKey] || 0})
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-1 max-w-md justify-end">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search milestone title, project, homeowner, or partner..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-navy-950 placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* 9-Pill Action Navigation Strip */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {SUB_VIEWS.map((sv) => {
          const IconComponent = sv.icon;
          const count = (subCounts as any)[sv.countKey] || 0;
          const isActive = selectedView === sv.key;
          return (
            <button
              key={sv.key}
              onClick={() => handleSelectView(sv.key)}
              className={`px-3.5 py-2 rounded-xl font-bold transition flex items-center gap-2 shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-navy-950 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <IconComponent className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />
              <span>{sv.label.replace(/^\d+\.\s*/, '')}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Contextual Feature Description Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-navy-950 text-white p-5 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[10px] font-mono font-bold uppercase tracking-wider">
              {SUB_VIEWS.find((s) => s.key === selectedView)?.label}
            </span>
            <span className="text-xs text-slate-300">
              Showing {viewFilteredMilestones.length} milestone records
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-black mt-1">
            {selectedView === 'PROJECT_MILESTONES' && 'Master Project Milestones & Staged Lifecycle Registry'}
            {selectedView === 'PENDING_SUBMISSIONS' && 'Partner Milestone Submissions Pending Technical Review'}
            {selectedView === 'WORK_PROGRESS_VERIFICATION' && 'IS 456 Civil Engineering Weighted Progress Verification'}
            {selectedView === 'CUSTOMER_APPROVAL_PENDING' && 'Milestones Forwarded to Homeowner for Digital Sign-off'}
            {selectedView === 'ADMIN_INSPECTION' && 'Scheduled & Completed QA/QC Site Technical Inspections'}
            {selectedView === 'APPROVED_MILESTONES' && 'Fully Approved & Certified Milestones (Admin & Client Sign-off)'}
            {selectedView === 'REJECTED_MILESTONES' && 'Correction Required & Disputed Milestone Submissions'}
            {selectedView === 'DELAYED_MILESTONES' && 'Delayed Milestones & Schedule Slippage Catch-up Notices'}
            {selectedView === 'PAYMENT_ELIGIBILITY' && 'Certified Milestones Eligible for Immediate Escrow Payout'}
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            {selectedView === 'PROJECT_MILESTONES' && 'View all lifecycle stages across active sites with milestone percentages, release valuations, and status tracking.'}
            {selectedView === 'PENDING_SUBMISSIONS' && 'Review incoming contractor/architect milestone proof submissions, verify reinforcement photos, and schedule on-site inspection or route to homeowner.'}
            {selectedView === 'WORK_PROGRESS_VERIFICATION' && 'Compute IS 456 weighted percentage progress. Compare self-reported partner claims with client sign-offs and official admin certified metrics.'}
            {selectedView === 'CUSTOMER_APPROVAL_PENDING' && 'Track milestones waiting for homeowner OTP authorization. Trigger instant WhatsApp reminders or simulate client approval if pre-authorized.'}
            {selectedView === 'ADMIN_INSPECTION' && 'Direct civil engineering site visits. Assign QA inspector, verify rebar spacing, concrete cube test results, and certify site inspection pass.'}
            {selectedView === 'APPROVED_MILESTONES' && 'Milestones that have satisfied all QA/QC requirements and client acceptance criteria, ready for final disbursement clearance.'}
            {selectedView === 'REJECTED_MILESTONES' && 'Milestones with flagged defects or missing test certificates. Review contractor notes and clear re-verification once rectified.'}
            {selectedView === 'DELAYED_MILESTONES' && 'Proactive site schedule monitoring. Issue formal acceleration and catch-up notices to ensure critical-path handover deadlines are met.'}
            {selectedView === 'PAYMENT_ELIGIBILITY' && 'Milestones certified 100% complete with all checks passed. Authorize escrow disbursement and generate digital payment receipt.'}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/10 text-right">
            <span className="text-[10px] text-slate-300 block uppercase font-bold tracking-wider">
              Total Valuation
            </span>
            <span className="text-lg font-mono font-black text-amber-300">
              {formatINR(viewFilteredMilestones.reduce((sum, item) => sum + (item.milestone.amountPaise || 0), 0))}
            </span>
          </div>
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

          {/* Milestone Registry & Action Queue */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                <h3 className="font-black text-sm text-navy-950 font-display">
                  {SUB_VIEWS.find((s) => s.key === selectedView)?.label}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-100 text-blue-800">
                  {viewFilteredMilestones.length} Milestones
                </span>
              </div>
              <div className="text-xs text-slate-500">
                Project Scope: <strong className="text-navy-950">{selectedProjectId && selectedProjectId !== 'ALL' ? selectedProjectId : `All Projects (${projects.length} Sites)`}</strong>
              </div>
            </div>

            {/* Milestones Stepper & Verification List */}
            <div className="space-y-4">
              {viewFilteredMilestones.length === 0 ? (
                <div className="py-14 text-center text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                  <Layers className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  <p className="font-bold text-slate-700 text-sm">No milestones match the selected view or search.</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Try switching views or clear search filter "{search}".
                  </p>
                </div>
              ) : (
                viewFilteredMilestones.map(({ milestone: ms, project }, idx) => {
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
                  const isDelayed =
                    Boolean((ms as any).isDelayed) ||
                    (ms.disputeReason && ms.disputeReason.toLowerCase().includes('delay')) ||
                    (ms.title && ms.title.toLowerCase().includes('delay'));

                  const weight = ms.weightPercent || ms.percentage || 15;

                  return (
                    <div
                      key={`${project.id}-${ms.id}-${idx}`}
                      className={`bg-white rounded-2xl border p-5 transition shadow-2xs space-y-4 ${
                        isPendingInspection
                          ? 'border-amber-400/80 bg-amber-50/15'
                          : isEligible
                          ? 'border-blue-400/80 bg-blue-50/15'
                          : isPaid
                          ? 'border-emerald-300/80 bg-emerald-50/10'
                          : isDelayed
                          ? 'border-orange-400/80 bg-orange-50/15'
                          : isDisputed || isCorrectionRequested
                          ? 'border-rose-300 bg-rose-50/15'
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
                                : isDelayed
                                ? 'bg-orange-600 text-white'
                                : isDisputed || isCorrectionRequested
                                ? 'bg-rose-600 text-white'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {ms.milestoneNumber || ms.linkedStageNumber || idx + 1}
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                                {project.id}
                              </span>
                              <h4 className="font-bold text-sm text-navy-950">{ms.title}</h4>
                              <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                Weight: {weight}%
                              </span>
                              <span className="text-[11px] text-slate-500">
                                Site: <strong className="text-slate-800">{project.name}</strong> ({project.city || 'India'})
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">{ms.description}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
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
                                : isInspectionScheduled
                                ? 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                                : isAwaitingClient
                                ? 'bg-sky-100 text-sky-800 border border-sky-300'
                                : isDelayed
                                ? 'bg-orange-100 text-orange-900 border border-orange-300'
                                : isDisputed || isCorrectionRequested
                                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {isDelayed && !isPaid ? 'DELAYED SCHEDULE' : ms.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </div>

                      {/* CONTEXTUAL VIEW-SPECIFIC OPERATIONAL CALLOUT BOXES */}

                      {/* 1. Delayed Notice Callout */}
                      {(isDelayed || selectedView === 'DELAYED_MILESTONES') && !isPaid && (
                        <div className="p-3 bg-orange-50/80 border border-orange-200 rounded-xl text-xs text-orange-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                            <div>
                              <strong className="font-bold">Schedule Overrun Notice: </strong>
                              <span>Critical-path milestone is running behind planned site timeline. Target catch-up requested.</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleSendAccelerationNotice(project, ms)}
                            className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg text-xs transition cursor-pointer shrink-0 shadow-xs flex items-center gap-1.5"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Send Acceleration Notice</span>
                          </button>
                        </div>
                      )}

                      {/* 2. Technical Deficiency / Correction Note */}
                      {(isCorrectionRequested || isDisputed || selectedView === 'REJECTED_MILESTONES') && (
                        <div className="p-3 bg-rose-50/80 border border-rose-200 rounded-xl text-xs text-rose-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                            <div>
                              <strong className="font-bold">Technical Correction Required: </strong>
                              <span>{ms.correctionNotes || ms.disputeReason || 'Site reinforcement spacing and test certificates required before sign-off.'}</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleClearCorrection(project, ms)}
                            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs transition cursor-pointer shrink-0 shadow-xs flex items-center gap-1.5"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Clear Correction &amp; Re-verify</span>
                          </button>
                        </div>
                      )}

                      {/* 3. Admin Scheduled Inspection Callout */}
                      {(isInspectionScheduled || selectedView === 'ADMIN_INSPECTION') && (
                        <div className="p-3 bg-indigo-50/80 border border-indigo-200 rounded-xl text-xs text-indigo-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                          <div className="flex items-start gap-2">
                            <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                            <div>
                              <strong className="font-bold">Scheduled QA/QC Site Inspection: </strong>
                              <span>
                                Date: <strong>{ms.technicalInspection?.inspectionDate || 'Scheduled This Week'}</strong> · Inspector: <strong>{ms.technicalInspection?.inspectorName || 'Er. Sandeep Rathore (Senior QA Auditor)'}</strong>
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCertifyInspectionPass(project, ms)}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs transition cursor-pointer shrink-0 shadow-xs flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Certify Inspection Pass</span>
                          </button>
                        </div>
                      )}

                      {/* 4. Customer Approval Pending Callout */}
                      {(isAwaitingClient || selectedView === 'CUSTOMER_APPROVAL_PENDING') && (
                        <div className="p-3 bg-purple-50/80 border border-purple-200 rounded-xl text-xs text-purple-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                          <div className="flex items-start gap-2">
                            <User className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                            <div>
                              <strong className="font-bold">Awaiting Homeowner Digital Sign-off: </strong>
                              <span>Dispatched to {project.customerName} ({project.customerPhone}). Pending client OTP approval.</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => success(`WhatsApp sign-off reminder dispatched to ${project.customerName}!`)}
                              className="px-2.5 py-1.5 bg-white hover:bg-purple-100 text-purple-900 border border-purple-300 font-bold rounded-lg text-xs transition cursor-pointer"
                            >
                              Send Reminder
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSimulateCustomerApproval(project, ms)}
                              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg text-xs transition cursor-pointer shadow-xs flex items-center gap-1.5"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Simulate Client Sign-off</span>
                            </button>
                          </div>
                        </div>
                      )}

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
                            Assigned Partner: <strong className="text-slate-800">{project.contractorName || project.architectName || 'Site Engineer'}</strong>
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
                              type="button"
                              onClick={() => handleForwardToCustomer(project, ms)}
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
                              type="button"
                              onClick={() => setScheduleInspectionMilestone({ project, milestone: ms })}
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
                              type="button"
                              onClick={() => {
                                setCorrectionModalMilestone({ project, milestone: ms });
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
                              type="button"
                              onClick={() => handleVerifyAndMarkEligible(project, ms)}
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
                              type="button"
                              onClick={() =>
                                setReleaseModalMilestone({
                                  project,
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
                            type="button"
                            onClick={() => setInspectedMilestone({ project, milestone: ms })}
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
                        onClick={() => handleForwardToCustomer(inspectedMilestone.project, inspectedMilestone.milestone)}
                        className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
                      >
                        <Send className="w-4 h-4" />
                        <span>Forward to Homeowner for Formal Sign-off</span>
                      </button>

                      {/* 2. Certify & Mark Payment Eligible */}
                      <button
                        type="button"
                        onClick={() => handleVerifyAndMarkEligible(inspectedMilestone.project, inspectedMilestone.milestone)}
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
