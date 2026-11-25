import { BuildGharLoader } from '../../../components/common/BuildGharLoader.js';
import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext.js';
import { useToast } from '../../../context/ToastContext.js';
import {
  getExecutionProjects,
  getExecutionProjectById,
  saveExecutionProject,
  ExecutionProject,
  calculateProjectWeightedProgress,
  DailySiteReport,
  ProjectIssue,
  ChangeOrder,
  PaymentMilestoneItem,
  ExecutionStage,
  SnagItem,
} from '../../../data/projectExecutionStore.js';
import {
  Building2,
  HardHat,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  PauseCircle,
  PlayCircle,
  ArrowRight,
  ArrowLeft,
  DollarSign,
  MapPin,
  FileText,
  FileCheck2,
  Layers,
  Sparkles,
  ShieldCheck,
  Percent,
  PlusCircle,
  Send,
  MessageSquare,
  Package,
  Camera,
  Download,
  ExternalLink,
  ChevronDown,
  Info,
  Check,
  X,
  RotateCcw,
  Sliders,
  History,
  Truck,
  Eye,
  Key,
  Flame,
  Award,
} from 'lucide-react';

const formatINR = (paise: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format((paise || 0) / 100);
};

export const ProjectWorkspace: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [project, setProject] = useState<ExecutionProject | null>(null);
  const [allUserProjects, setAllUserProjects] = useState<ExecutionProject[]>([]);
  const [loading, setLoading] = useState(true);

  // Tab State
  const activeTab = searchParams.get('tab') || 'overview';
  const setActiveTab = (tab: string) => {
    setSearchParams({ tab });
  };

  // Math calculation explanation modal
  const [showMathModal, setShowMathModal] = useState(false);

  // Daily Site Report Modal / State
  const [showNewReportModal, setShowNewReportModal] = useState(false);
  const [dsrWeather, setDsrWeather] = useState<'Sunny / Clear' | 'Partly Cloudy' | 'Rainy / Monsoon' | 'Extreme Heat' | 'Windy'>('Sunny / Clear');
  const [dsrWorkers, setDsrWorkers] = useState<number>(8);
  const [dsrWorkDone, setDsrWorkDone] = useState('');
  const [dsrMaterials, setDsrMaterials] = useState('');
  const [dsrVideoUrl, setDsrVideoUrl] = useState('');
  const [dsrNextTasks, setDsrNextTasks] = useState('');
  const [newCommentText, setNewCommentText] = useState<Record<string, string>>({});

  // Chat message state
  const [chatMessage, setChatMessage] = useState('');

  // New Issue Modal
  const [showNewIssueModal, setShowNewIssueModal] = useState(false);
  const [issueTitle, setIssueTitle] = useState('');
  const [issueDesc, setIssueDesc] = useState('');
  const [issueCategory, setIssueCategory] = useState<any>('TECHNICAL_DEFECT');
  const [issueSeverity, setIssueSeverity] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('MEDIUM');

  // Milestone Approval / Dispute Modal
  const [selectedMilestone, setSelectedMilestone] = useState<PaymentMilestoneItem | null>(null);
  const [disputeNotes, setDisputeNotes] = useState('');
  const [correctionNotes, setCorrectionNotes] = useState('');
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);

  // Snag Item Modal
  const [showNewSnagModal, setShowNewSnagModal] = useState(false);
  const [snagTitle, setSnagTitle] = useState('');
  const [snagArea, setSnagArea] = useState('');
  const [snagPriority, setSnagPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('MEDIUM');

  useEffect(() => {
    const reload = () => {
      const list = getExecutionProjects(user?.id, user?.phone);
      setAllUserProjects(list);

      let activeP = projectId ? getExecutionProjectById(projectId) : undefined;
      if (!activeP && list.length > 0) {
        activeP = list[0];
      }

      if (activeP) {
        setProject(activeP);
      }
      setLoading(false);
    };

    reload();
    const interval = setInterval(reload, 30000);
    window.addEventListener('storage', reload);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', reload);
    };
  }, [projectId, user?.id, user?.phone]);

  if (loading) {
    return <div className="p-16 flex items-center justify-center"><BuildGharLoader message="Loading project execution workspace..." /></div>;
  }

  if (!project) {
    return (
      <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center max-w-lg mx-auto space-y-4 my-8 font-sans">
        <Building2 className="w-12 h-12 text-slate-400 mx-auto" />
        <h2 className="text-lg font-bold text-navy-950 font-display">No Active Project Selected</h2>
        <p className="text-xs text-slate-500">
          You do not currently have any execution projects underway. Please select an approved quotation to initiate your project.
        </p>
        <div className="flex justify-center gap-3 pt-2">
          <Link to="/dashboard/quotations" className="btn-primary text-xs py-2 px-4">
            View Quotations
          </Link>
          <Link to="/dashboard/projects" className="btn-secondary text-xs py-2 px-4">
            All Projects
          </Link>
        </div>
      </div>
    );
  }

  const { verifiedProgress, reportedProgress, explanation } = calculateProjectWeightedProgress(project.stages);

  // 1. Send Chat Message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    const now = new Date().toISOString();
    const updated: ExecutionProject = {
      ...project,
      messages: [
        ...project.messages,
        {
          id: `msg-${Date.now()}`,
          senderId: user?.id || 'cust-1',
          senderName: user?.name || 'Homeowner',
          senderRole: 'CUSTOMER',
          message: chatMessage.trim(),
          timestamp: now,
        },
      ],
    };

    saveExecutionProject(updated);
    setProject(updated);
    setChatMessage('');
    success('Message sent to contractor & project desk.');
  };

  // 2. Add Customer Comment to Daily Site Report
  const handleAddDsrComment = (reportId: string) => {
    const comment = newCommentText[reportId];
    if (!comment?.trim()) return;

    const now = new Date().toISOString();
    const updatedReports = (project.dailyReports || []).map((r) => {
      if (r.id === reportId) {
        return {
          ...r,
          customerComments: [
            ...r.customerComments,
            {
              id: `c-${Date.now()}`,
              author: user?.name || 'Homeowner',
              role: 'CUSTOMER' as const,
              comment: comment.trim(),
              timestamp: now,
            },
          ],
        };
      }
      return r;
    });

    const updated: ExecutionProject = {
      ...project,
      dailyReports: updatedReports,
    };

    saveExecutionProject(updated);
    setProject(updated);
    setNewCommentText((prev) => ({ ...prev, [reportId]: '' }));
    success('Comment added to daily site report.');
  };

  // 3. Submit New Daily Site Report (Simulate Site Engineer / Contractor log)
  const handleCreateDailyReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dsrWorkDone.trim()) {
      error('Please describe work performed on site.');
      return;
    }

    const now = new Date().toISOString();
    const newReport: DailySiteReport = {
      id: `dsr-${Date.now()}`,
      reportDate: now.split('T')[0],
      submittedAt: now,
      submittedBy: `${project.contractorName} (Site Engineer)`,
      weather: dsrWeather,
      workersPresent: dsrWorkers,
      workPerformed: dsrWorkDone,
      tasksUpdated: [project.currentStage],
      quantitiesCompleted: 'Full daily schedule executed',
      materialsReceived: dsrMaterials || 'None today',
      materialsConsumed: 'Standard site consumables',
      equipmentUsed: 'Concrete mixer, vibrator, scaffolding',
      sitePhotos: [
        'https://images.unsplash.com/photo-1541888946425-d0fbb18f15f7?auto=format&fit=crop&w=600&q=80',
      ],
      siteVideos: dsrVideoUrl.trim() ? [dsrVideoUrl.trim()] : [],
      blockers: 'None',
      safetyObservations: 'Helmets & safety boots verified across all workers.',
      nextPlannedActivities: dsrNextTasks || 'Continuing stage concrete curing and reinforcement steel binding.',
      customerComments: [],
    };

    const updated: ExecutionProject = {
      ...project,
      dailyReports: [newReport, ...project.dailyReports],
      updatedAt: now,
    };

    saveExecutionProject(updated);
    setProject(updated);
    setShowNewReportModal(false);
    setDsrWorkDone('');
    setDsrMaterials('');
    setDsrVideoUrl('');
    setDsrNextTasks('');
    success('Daily Site Report logged with site evidence photos & video logs.');
  };

  // 4. Milestone Approval & Payment Release
  const handleApproveMilestone = (milestoneId: string) => {
    const now = new Date().toISOString();
    let approvedAmount = 0;

    const updatedMilestones = (project.paymentMilestones || []).map((m) => {
      if (m.id === milestoneId) {
        approvedAmount = m.amountPaise;
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
      ...project,
      paymentMilestones: updatedMilestones,
      totalPaidPaise: project.totalPaidPaise + approvedAmount,
      amountDuePaise: Math.max(0, project.amountDuePaise - approvedAmount),
      updatedAt: now,
      messages: [
        ...project.messages,
        {
          id: `msg-${Date.now()}`,
          senderId: user?.id || 'cust-1',
          senderName: user?.name || 'Homeowner',
          senderRole: 'CUSTOMER',
          message: `Milestone verified and payment of ${formatINR(approvedAmount)} released to contractor.`,
          timestamp: now,
        },
      ],
    };

    saveExecutionProject(updated);
    setProject(updated);
    success(`Milestone approved! ${formatINR(approvedAmount)} released via Escrow.`);
  };

  // 5. Raise Milestone Dispute
  const handleRaiseDispute = () => {
    if (!selectedMilestone || !disputeNotes.trim()) {
      error('Please explain the reason for the dispute.');
      return;
    }

    const now = new Date().toISOString();
    const updatedMilestones = (project.paymentMilestones || []).map((m) => {
      if (m.id === selectedMilestone.id) {
        return {
          ...m,
          status: 'DISPUTED' as const,
          disputeReason: disputeNotes.trim(),
        };
      }
      return m;
    });

    const newIssue: ProjectIssue = {
      id: `issue-${Date.now()}`,
      category: 'PAYMENT_DISPUTE',
      title: `Disputed Milestone: ${selectedMilestone.title}`,
      description: disputeNotes.trim(),
      severity: 'HIGH',
      status: 'OPEN',
      raisedBy: 'CUSTOMER',
      raisedAt: now,
      timelineImpactDays: 3,
      disputedAmountPaise: selectedMilestone.amountPaise,
      linkedStageNumber: selectedMilestone.linkedStageNumber,
      supportingDocs: [],
    };

    const updated: ExecutionProject = {
      ...project,
      paymentMilestones: updatedMilestones,
      issues: [newIssue, ...project.issues],
      updatedAt: now,
    };

    saveExecutionProject(updated);
    setProject(updated);
    setShowDisputeModal(false);
    setDisputeNotes('');
    success('Milestone payment paused. Dispute logged for GharDesign engineering audit.');
  };

  // 6. Raise Correction Request
  const handleRequestCorrection = () => {
    if (!selectedMilestone || !correctionNotes.trim()) {
      error('Please specify the required corrections.');
      return;
    }

    const now = new Date().toISOString();
    const updatedMilestones = (project.paymentMilestones || []).map((m) => {
      if (m.id === selectedMilestone.id) {
        return {
          ...m,
          status: 'REVISION_REQUESTED' as const,
          correctionNotes: correctionNotes.trim(),
        };
      }
      return m;
    });

    const updated: ExecutionProject = {
      ...project,
      paymentMilestones: updatedMilestones,
      updatedAt: now,
    };

    saveExecutionProject(updated);
    setProject(updated);
    setShowCorrectionModal(false);
    setCorrectionNotes('');
    success('Correction request submitted to contractor with requested rework.');
  };

  // 7. Add New Project Issue
  const handleCreateIssue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueTitle.trim() || !issueDesc.trim()) {
      error('Please complete all issue fields.');
      return;
    }

    const now = new Date().toISOString();
    const newIssue: ProjectIssue = {
      id: `issue-${Date.now()}`,
      category: issueCategory,
      title: issueTitle.trim(),
      description: issueDesc.trim(),
      severity: issueSeverity,
      status: 'OPEN',
      raisedBy: 'CUSTOMER',
      raisedAt: now,
      timelineImpactDays: 2,
      disputedAmountPaise: 0,
      supportingDocs: [],
    };

    const updated: ExecutionProject = {
      ...project,
      issues: [newIssue, ...project.issues],
      updatedAt: now,
    };

    saveExecutionProject(updated);
    setProject(updated);
    setShowNewIssueModal(false);
    setIssueTitle('');
    setIssueDesc('');
    success('Issue logged. GharDesign civil desk will investigate.');
  };

  // 8. Add Snag Item in Handover
  const handleAddSnag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!snagTitle.trim() || !snagArea.trim()) {
      error('Please enter snag title and location area.');
      return;
    }

    const now = new Date().toISOString();
    const newSnag: SnagItem = {
      id: `snag-${Date.now()}`,
      title: snagTitle.trim(),
      area: snagArea.trim(),
      priority: snagPriority,
      status: 'IDENTIFIED',
      reportedAt: now,
    };

    const updated: ExecutionProject = {
      ...project,
      handover: {
        ...project.handover,
        snags: [...project.handover.snags, newSnag],
      },
      updatedAt: now,
    };

    saveExecutionProject(updated);
    setProject(updated);
    setShowNewSnagModal(false);
    setSnagTitle('');
    setSnagArea('');
    success('Snag defect recorded on final inspection checklist.');
  };

  // 9. Sign Handover & Accept Possession
  const handleSignHandover = () => {
    const now = new Date().toISOString();
    const updated: ExecutionProject = {
      ...project,
      status: 'HANDED_OVER',
      actualEndDate: now.split('T')[0],
      handover: {
        ...project.handover,
        status: 'HANDED_OVER',
        handoverDate: now.split('T')[0],
        possessionSignoff: true,
        warrantyStartDate: now.split('T')[0],
        warrantyEndDate: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
        completionSummary: 'All structural, MEP and finishing works verified and approved.',
      },
      updatedAt: now,
    };

    saveExecutionProject(updated);
    setProject(updated);
    success('Project officially handed over! 10-Year Structural & 1-Year Workmanship Warranty active.');
  };

  const navTabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'work-plan', label: 'Work Plan' },
    { id: 'progress', label: 'Progress Tracking' },
    { id: 'daily-reports', label: `Daily Reports (${project.dailyReports.length})` },
    { id: 'tasks', label: 'Tasks & Milestones' },
    { id: 'drawings', label: 'Drawings & Approvals' },
    { id: 'materials', label: `Materials (${project.linkedMaterials.length})` },
    { id: 'payments', label: 'Payments & Escrow' },
    { id: 'documents', label: `Documents (${project.documents.length})` },
    { id: 'messages', label: `Messages (${project.messages.length})` },
    { id: 'issues', label: `Issues & Delays (${project.issues.length})` },
    { id: 'handover', label: 'Handover & Snags' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 font-sans">
      {/* Top Project Selector & Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              to="/dashboard/projects"
              className="text-xs text-navy-700 hover:text-navy-950 font-semibold flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> All Projects
            </Link>
            <span className="text-slate-300">/</span>
            <span className="font-mono text-xs font-bold text-navy-900 bg-navy-50 px-2 py-0.5 rounded border border-navy-200">
              {project.id}
            </span>
            <span className="font-mono text-[11px] text-slate-500">WO: {project.workOrderNumber}</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold font-display text-navy-950">{project.name}</h1>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span>{project.propertyAddress}</span>
            <span>•</span>
            <span className="font-semibold text-slate-700">{project.contractorFirm}</span>
          </div>
        </div>

        {/* Project Switcher & Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {allUserProjects.length > 1 && (
            <select
              value={project.id}
              onChange={(e) => navigate(`/dashboard/projects/${e.target.value}`)}
              className="text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-semibold text-navy-950 focus:outline-none focus:ring-2 focus:ring-navy-900"
            >
              {allUserProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.id}: {p.name.slice(0, 24)}...
                </option>
              ))}
            </select>
          )}

          <Link
            to={`/dashboard/projects/${project.id}/kickoff`}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
          >
            <Sliders className="w-3.5 h-3.5 text-slate-600" />
            <span>Kickoff Checklist</span>
          </Link>
        </div>
      </div>

      {/* 12-Tab Responsive Navigation Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs px-2 py-1.5 flex items-center gap-1 overflow-x-auto text-xs font-medium">
        {navTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-2 rounded-xl whitespace-nowrap transition flex items-center gap-1.5 ${
              activeTab === tab.id
                ? 'bg-navy-950 text-white font-bold shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ============================================================== */}
      {/* TAB 1: OVERVIEW */}
      {/* ============================================================== */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metric Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>Verified Progress</span>
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-bold font-mono text-emerald-700 mt-2">
                {verifiedProgress}%
              </div>
              <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                <span>Contractor Reported: {reportedProgress}%</span>
                <button
                  onClick={() => setShowMathModal(true)}
                  className="text-navy-900 font-bold hover:underline"
                >
                  Math Formula
                </button>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>Contract Value</span>
                <DollarSign className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-bold font-mono text-navy-950 mt-2">
                {formatINR(project.contractValuePaise)}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Original: {formatINR(project.originalContractPaise)}
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>Amount Paid</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-bold font-mono text-emerald-700 mt-2">
                {formatINR(project.totalPaidPaise)}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Due: {formatINR(project.amountDuePaise)}
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>Current Stage</span>
                <Layers className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-sm font-bold text-navy-950 mt-2 line-clamp-1">
                {project.currentStage}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Target: {project.plannedEndDate}
              </div>
            </div>
          </div>

          {/* Stakeholder and Stage Progress Split */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-navy-950 font-display flex items-center justify-between">
                <span>IS 456 Construction Stages</span>
                <span className="text-xs font-normal text-slate-500">10-Stage Milestone Blueprint</span>
              </h2>

              <div className="space-y-3">
                {(project.stages || []).map((stg) => (
                  <div key={stg.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="font-bold text-slate-800">
                        Stage {stg.stageNumber}: {stg.name}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] text-slate-500">
                          Weight: {stg.weightPercent}%
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            stg.verifiedProgress === 100
                              ? 'bg-emerald-100 text-emerald-800'
                              : stg.status === 'IN_PROGRESS'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {stg.status}
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all"
                        style={{ width: `${stg.verifiedProgress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Contractor Contact Card & Quick Info */}
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <h3 className="text-xs uppercase font-bold text-slate-400">Assigned Professional Partner</h3>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-navy-900 text-gold-400 flex items-center justify-center font-bold text-sm">
                    <HardHat className="w-6 h-6 text-amber-400" />
                  </div>
                  <div className="text-xs">
                    <div className="font-bold text-navy-950 text-sm">{project.contractorFirm}</div>
                    <div className="text-slate-500">{project.contractorName}</div>
                    <div className="text-slate-400 text-[11px]">{project.contractorRole}</div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Contact Number:</span>
                    <span className="font-semibold text-navy-950">{project.contractorPhone}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Defect Liability Retention:</span>
                    <span className="font-mono font-bold text-slate-900">{formatINR(project.retentionPaise)}</span>
                  </div>
                </div>
              </div>

              {/* Recent Daily Report Snippet */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase text-slate-400">Latest Site Report</h3>
                  <button
                    onClick={() => setActiveTab('daily-reports')}
                    className="text-xs text-blue-700 font-semibold hover:underline"
                  >
                    View All
                  </button>
                </div>
                {project.dailyReports.length > 0 ? (
                  <div className="text-xs space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>Date: {project.dailyReports[0].reportDate}</span>
                      <span>Workers: {project.dailyReports[0].workersPresent}</span>
                    </div>
                    <p className="text-slate-700 text-xs line-clamp-3">
                      {project.dailyReports[0].workPerformed}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">No site reports logged yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: WORK PLAN */}
      {/* ============================================================== */}
      {activeTab === 'work-plan' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <h2 className="text-base font-bold text-navy-950 font-display">Work Breakdown Structure (WBS)</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Stage-wise execution breakdown, planned dates, weights, and inspection criteria.
              </p>
            </div>
            <span className="px-3 py-1 bg-navy-50 text-navy-800 text-xs font-bold rounded-lg border border-navy-200">
              IS 456 & CPWD Certified Structure
            </span>
          </div>

          <div className="space-y-4">
            {(project.stages || []).map((stg) => (
              <div key={stg.id} className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold bg-navy-900 text-white px-2 py-0.5 rounded">
                        Stage {stg.stageNumber}
                      </span>
                      <h3 className="text-xs font-bold text-navy-950">{stg.name}</h3>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">{stg.description}</p>
                  </div>

                  <div className="flex items-center gap-3 text-xs shrink-0">
                    <span className="font-mono font-bold text-slate-700">Weight: {stg.weightPercent}%</span>
                    <span className="text-slate-400">|</span>
                    <span className="text-slate-600">{stg.plannedStartDate} → {stg.plannedEndDate}</span>
                    <span className="px-2 py-0.5 bg-white border border-slate-200 rounded font-semibold text-[10px]">
                      {stg.status}
                    </span>
                  </div>
                </div>

                {/* Subtasks */}
                <div className="divide-y divide-slate-100 p-4 space-y-2 bg-white">
                  {(stg.tasks || []).map((tsk) => (
                    <div key={tsk.id} className="flex items-center justify-between text-xs py-1.5">
                      <div className="flex items-center gap-2">
                        <CheckCircle2
                          className={`w-4 h-4 ${
                            tsk.verifiedFraction === 1.0 ? 'text-emerald-600' : 'text-slate-300'
                          }`}
                        />
                        <span className="text-slate-800">{tsk.title}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs font-mono">
                        <span className="text-slate-400">Weight: {tsk.weight}%</span>
                        <span className="font-semibold text-slate-700">
                          Verified: {Math.round(tsk.verifiedFraction * 100)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: PROGRESS TRACKING */}
      {/* ============================================================== */}
      {activeTab === 'progress' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <h2 className="text-base font-bold text-navy-950 font-display">
                  Transparent Weighted Completion Engine
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Distinguishing contractor-reported progress from verified engineering milestones.
                </p>
              </div>

              <button
                onClick={() => setShowMathModal(true)}
                className="px-3 py-1.5 bg-navy-50 text-navy-900 border border-navy-200 text-xs font-bold rounded-xl flex items-center gap-1.5 hover:bg-navy-100 transition"
              >
                <Percent className="w-3.5 h-3.5" />
                <span>View Calculation Formula</span>
              </button>
            </div>

            {/* Progress Gauges */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-3">
                <div className="flex justify-between items-center text-xs font-bold text-emerald-950">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" /> Verified Customer Completion
                  </span>
                  <span className="font-mono text-xl text-emerald-700">{verifiedProgress}%</span>
                </div>
                <div className="w-full bg-emerald-200 h-3 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-600 h-full rounded-full transition-all duration-700"
                    style={{ width: `${verifiedProgress}%` }}
                  />
                </div>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  Based strictly on approved engineering milestones with site photographic evidence and measurement verification.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-3">
                <div className="flex justify-between items-center text-xs font-bold text-blue-950">
                  <span className="flex items-center gap-1.5">
                    <HardHat className="w-4 h-4 text-blue-600" /> Contractor-Reported Site Progress
                  </span>
                  <span className="font-mono text-xl text-blue-700">{reportedProgress}%</span>
                </div>
                <div className="w-full bg-blue-200 h-3 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all duration-700"
                    style={{ width: `${reportedProgress}%` }}
                  />
                </div>
                <p className="text-[11px] text-blue-800 leading-relaxed">
                  Claimed by site supervisor awaiting your milestone approval and escrow payment release.
                </p>
              </div>
            </div>

            {/* Stage-wise status indicators */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Stage Level Verification Status
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {(project.stages || []).map((stg) => (
                  <div key={stg.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-900 truncate">Stage {stg.stageNumber}</span>
                      <span className="font-mono font-bold text-emerald-700">{stg.verifiedProgress}%</span>
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">{stg.name}</div>
                    <div className="text-[10px] text-slate-400">Weight: {stg.weightPercent}% of Total Contract</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 4: DAILY SITE REPORTS */}
      {/* ============================================================== */}
      {activeTab === 'daily-reports' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <h2 className="text-base font-bold text-navy-950 font-display">Daily Site Reports (DSR)</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Authentic daily logs of workers, weather, materials consumed, and site photographs.
              </p>
            </div>

            <button
              onClick={() => setShowNewReportModal(true)}
              className="px-4 py-2 bg-navy-950 text-white rounded-xl text-xs font-bold hover:bg-navy-900 transition flex items-center gap-1.5 self-start sm:self-auto"
            >
              <PlusCircle className="w-4 h-4 text-gold-400" />
              <span>Log Site Report</span>
            </button>
          </div>

          {project.dailyReports.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-slate-300 max-w-lg mx-auto space-y-3">
              <Camera className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="text-sm font-bold text-navy-950">No Daily Reports Logged Yet</h3>
              <p className="text-xs text-slate-500">
                Daily reports submitted by the site engineer or contractor will appear here with photos and progress logs.
              </p>
              <button
                onClick={() => setShowNewReportModal(true)}
                className="btn-primary text-xs py-2 px-4"
              >
                Log First Site Report
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {(project.dailyReports || []).map((rpt) => (
                <div key={rpt.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                  {/* Report Header */}
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-4 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-navy-950 text-sm">{rpt.reportDate}</span>
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-800 text-[10px] font-bold rounded">
                          {rpt.weather}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Logged by {rpt.submittedBy} • {rpt.workersPresent} active workers on site
                      </div>
                    </div>

                    <div className="text-xs text-slate-400 font-mono">
                      Timestamp: {new Date(rpt.submittedAt).toLocaleTimeString()}
                    </div>
                  </div>

                  {/* Work description and specs */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <div className="font-bold text-slate-800 uppercase text-[10px] tracking-wider">
                        Work Executed Today
                      </div>
                      <p className="text-slate-700 leading-relaxed">{rpt.workPerformed}</p>
                    </div>

                    <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <div className="font-bold text-slate-800 uppercase text-[10px] tracking-wider">
                        Materials & Consumables
                      </div>
                      <p className="text-slate-700 leading-relaxed">
                        Received: {rpt.materialsReceived} <br />
                        Consumed: {rpt.materialsConsumed}
                      </p>
                    </div>
                  </div>

                  {/* Site Photographs */}
                  {rpt.sitePhotos && rpt.sitePhotos.length > 0 && (
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400 mb-2">Site Photographs</div>
                      <div className="flex flex-wrap gap-3">
                        {(rpt.sitePhotos || []).map((url, i) => (
                          <img
                            key={i}
                            src={url}
                            alt="Site work evidence"
                            className="w-36 h-24 object-cover rounded-xl border border-slate-200 shadow-2xs hover:scale-105 transition"
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Site Video Footage (Section 8 Spec) */}
                  {rpt.siteVideos && rpt.siteVideos.length > 0 && (
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400 mb-2">Site Video & Drone Logs</div>
                      <div className="flex flex-wrap gap-2">
                        {rpt.siteVideos.map((vid, idx) => (
                          <a
                            key={idx}
                            href={vid}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-lg text-xs font-semibold transition"
                          >
                            <PlayCircle className="w-3.5 h-3.5 text-blue-600" />
                            <span>View Site Video #{idx + 1}</span>
                            <ExternalLink className="w-3 h-3 text-slate-400" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Customer Clarification / Comments */}
                  <div className="pt-3 border-t border-slate-100 space-y-3">
                    <div className="text-xs font-bold text-slate-700">Discussion & Clarifications</div>
                    {(rpt.customerComments || []).map((c) => (
                      <div key={c.id} className="text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <div className="font-semibold text-slate-800">
                          {c.author} ({c.role}):
                        </div>
                        <div className="text-slate-600 mt-0.5">{c.comment}</div>
                      </div>
                    ))}

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newCommentText[rpt.id] || ''}
                        onChange={(e) =>
                          setNewCommentText((prev) => ({ ...prev, [rpt.id]: e.target.value }))
                        }
                        placeholder="Ask for clarification or leave a note on this site report..."
                        className="flex-1 p-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-navy-900 bg-slate-50"
                      />
                      <button
                        onClick={() => handleAddDsrComment(rpt.id)}
                        className="px-3 py-2 bg-navy-950 text-white rounded-xl text-xs font-bold hover:bg-navy-900"
                      >
                        Comment
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 5: TASKS & MILESTONES */}
      {/* ============================================================== */}
      {activeTab === 'tasks' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div>
            <h2 className="text-base font-bold text-navy-950 font-display">Itemized Project Tasks</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Granular task checklist with percentage weights, completion status, and engineering verification.
            </p>
          </div>

          <div className="space-y-4">
            {(project.stages || []).map((stg) => (
              <div key={stg.id} className="border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center text-xs font-bold text-navy-950 border-b border-slate-100 pb-2">
                  <span>Stage {stg.stageNumber}: {stg.name}</span>
                  <span className="font-mono text-emerald-700">Verified: {stg.verifiedProgress}%</span>
                </div>

                <div className="space-y-2">
                  {(stg.tasks || []).map((tsk) => (
                    <div key={tsk.id} className="flex items-center justify-between text-xs p-2 bg-slate-50 rounded-lg">
                      <span className="text-slate-800">{tsk.title}</span>
                      <div className="flex items-center gap-3 font-mono text-[11px]">
                        <span className="text-slate-500">Weight: {tsk.weight}%</span>
                        <span
                          className={`font-bold ${
                            tsk.verifiedFraction === 1.0 ? 'text-emerald-700' : 'text-slate-600'
                          }`}
                        >
                          {tsk.verifiedFraction === 1.0 ? '✓ Verified' : 'In Progress'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 6: DRAWINGS & APPROVALS */}
      {/* ============================================================== */}
      {activeTab === 'drawings' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-base font-bold text-navy-950 font-display">Engineering Drawings & Design Approvals</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Review and approve 2D floor plans, 3D elevations, structural column details, and interior moodboards.
              </p>
            </div>
            <Link
              to="/dashboard/design-approvals"
              className="text-xs font-bold text-blue-700 hover:underline flex items-center gap-1"
            >
              <span>Design Approval Workbench</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-bold text-navy-950 text-sm">2D Vastu Floor Plan (G+2 Set)</div>
                  <div className="text-[11px] text-slate-500">DWG & PDF • Version 1.2 Approved</div>
                </div>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">
                  ✓ Approved
                </span>
              </div>
              <p className="text-slate-600">
                Ground floor parking + 1BHK, First floor luxury 3BHK with central courtyard, terrace garden.
              </p>
              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => success('Downloading Engineering 2D Plan CAD Blueprint...')}
                  className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-semibold hover:bg-slate-100 transition flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Blueprint PDF
                </button>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-bold text-navy-950 text-sm">3D Front Elevation & Lighting Blueprint</div>
                  <div className="text-[11px] text-slate-500">4K Ultra-HD Render • Version 2.0</div>
                </div>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">
                  ✓ Approved
                </span>
              </div>
              <p className="text-slate-600">
                Contemporary louvers, warm exterior LED strip profiles, texture stone cladding.
              </p>
              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => success('Downloading 3D Ultra-HD Elevation Renders...')}
                  className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-semibold hover:bg-slate-100 transition flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> 3D Elevation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 7: MATERIALS */}
      {/* ============================================================== */}
      {activeTab === 'materials' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <h2 className="text-base font-bold text-navy-950 font-display">Project Building Materials</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Bulk cement, TMT rebar, sand, and bricks procured directly from mill depots linked to this project.
              </p>
            </div>

            <Link
              to="/dashboard/materials"
              className="px-4 py-2 bg-navy-950 text-white rounded-xl text-xs font-bold hover:bg-navy-900 transition flex items-center gap-1.5"
            >
              <Package className="w-4 h-4 text-gold-400" />
              <span>Order Bulk Materials</span>
            </Link>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <div className="text-[10px] uppercase font-bold text-slate-400">Total Material Allocation</div>
                <div className="text-lg font-bold font-mono text-navy-950">₹7,50,000</div>
                <div className="text-[11px] text-slate-500">Included in master contract</div>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <div className="text-[10px] uppercase font-bold text-slate-400">TMT Steel Rebar (Fe 550D)</div>
                <div className="text-lg font-bold font-mono text-emerald-700">4.8 / 6.2 Tons</div>
                <div className="text-[11px] text-emerald-800">Tata Tiscon / Jindal Panther</div>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <div className="text-[10px] uppercase font-bold text-slate-400">Grade 53 Cement</div>
                <div className="text-lg font-bold font-mono text-emerald-700">320 / 480 Bags</div>
                <div className="text-[11px] text-emerald-800">UltraTech Premium Weather Plus</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 8: PAYMENTS & ESCROW */}
      {/* ============================================================== */}
      {activeTab === 'payments' && (
        <div className="space-y-6">
          {/* Financial summary bar */}
          <div className="bg-navy-950 text-white p-6 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <div className="text-xs text-gold-400 uppercase font-semibold">Total Approved Contract</div>
              <div className="text-3xl font-bold font-mono text-white mt-1">
                {formatINR(project.contractValuePaise)}
              </div>
              <div className="text-xs text-slate-300 mt-1">
                Paid: <span className="text-emerald-400 font-bold">{formatINR(project.totalPaidPaise)}</span> • Remaining Due:{' '}
                <span className="text-amber-400 font-bold">{formatINR(project.amountDuePaise)}</span>
              </div>
            </div>

            <div className="bg-white/10 p-4 rounded-xl text-xs space-y-1">
              <div className="text-slate-300">Milestone Escrow Protection</div>
              <div className="text-emerald-400 font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" /> 100% Tranche Protected
              </div>
              <div className="text-[11px] text-slate-300">
                Payments released only after you verify milestone site evidence.
              </div>
            </div>
          </div>

          {/* Payment Milestones Table */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-navy-950 font-display">Work-Linked Milestone Schedule</h3>

            <div className="space-y-3">
              {(project.paymentMilestones || []).map((m) => (
                <div
                  key={m.id}
                  className={`p-4 rounded-xl border transition flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
                    m.status === 'PAID'
                      ? 'bg-slate-50 border-slate-200'
                      : m.status === 'PAYMENT_DUE'
                      ? 'bg-amber-50/60 border-amber-300'
                      : m.status === 'DISPUTED'
                      ? 'bg-rose-50/60 border-rose-300'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="space-y-1 text-xs">
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
                            ? 'bg-amber-200 text-amber-900'
                            : m.status === 'DISPUTED'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {m.status}
                      </span>
                    </div>
                    <p className="text-slate-500 text-[11px]">{m.description}</p>
                    {m.transactionId && (
                      <div className="font-mono text-[10px] text-emerald-700">
                        Paid via {m.transactionId} on {m.paidAt?.split('T')[0]}
                      </div>
                    )}
                    {m.disputeReason && (
                      <div className="text-[11px] text-rose-700 font-semibold">
                        Dispute Active: {m.disputeReason}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4 self-end md:self-center shrink-0">
                    <div className="text-right">
                      <div className="text-sm font-bold font-mono text-navy-950">{formatINR(m.amountPaise)}</div>
                      <div className="text-[10px] text-slate-400">{m.percentage}% of Contract</div>
                    </div>

                    {m.status === 'PAYMENT_DUE' && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedMilestone(m);
                            setShowDisputeModal(true);
                          }}
                          className="px-2.5 py-1.5 bg-rose-50 text-rose-700 border border-rose-300 rounded-lg text-xs font-bold hover:bg-rose-100 transition"
                        >
                          Dispute
                        </button>
                        <button
                          onClick={() => {
                            setSelectedMilestone(m);
                            setShowCorrectionModal(true);
                          }}
                          className="px-2.5 py-1.5 bg-amber-50 text-amber-800 border border-amber-300 rounded-lg text-xs font-bold hover:bg-amber-100 transition"
                        >
                          Correction
                        </button>
                        <button
                          onClick={() => handleApproveMilestone(m.id)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition"
                        >
                          Approve & Pay
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 9: DOCUMENTS */}
      {/* ============================================================== */}
      {activeTab === 'documents' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-base font-bold text-navy-950 font-display">Project Document Vault</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                All legally binding work orders, approved BOQs, municipal sanctions, and structural certificates.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {(project.documents || []).map((doc) => (
              <div
                key={doc.id}
                className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-4 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-blue-700">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-navy-950">{doc.title}</div>
                    <div className="text-[11px] text-slate-500">
                      {doc.version} • {doc.fileSize} • Uploaded by {doc.uploadedBy}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">
                    {doc.approvalStatus}
                  </span>
                  <button
                    onClick={() => success(`Downloading document: ${doc.title}`)}
                    className="p-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 text-slate-700 transition"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 10: MESSAGES */}
      {/* ============================================================== */}
      {activeTab === 'messages' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-navy-950 font-display">Project Discussion Thread</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Direct communication between Customer, Contractor Firm, and GharDesign engineering desk.
            </p>
          </div>

          {/* Messages list */}
          <div className="h-80 overflow-y-auto space-y-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            {(project.messages || []).map((m) => (
              <div
                key={m.id}
                className={`max-w-md p-3 rounded-2xl text-xs space-y-1 ${
                  m.senderRole === 'CUSTOMER'
                    ? 'ml-auto bg-navy-950 text-white'
                    : 'bg-white border border-slate-200 text-slate-800'
                }`}
              >
                <div
                  className={`text-[10px] font-bold ${
                    m.senderRole === 'CUSTOMER' ? 'text-gold-400' : 'text-slate-500'
                  }`}
                >
                  {m.senderName} ({m.senderRole})
                </div>
                <p className="leading-relaxed">{m.message}</p>
                <div
                  className={`text-[9px] text-right ${
                    m.senderRole === 'CUSTOMER' ? 'text-slate-400' : 'text-slate-400'
                  }`}
                >
                  {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
          </div>

          {/* Input field */}
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              placeholder="Write a message or query regarding this project..."
              className="flex-1 p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-navy-900 focus:bg-white"
            />
            <button
              type="submit"
              className="px-5 py-3 bg-navy-950 hover:bg-navy-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
            >
              <Send className="w-3.5 h-3.5 text-gold-400" />
              <span>Send</span>
            </button>
          </form>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 11: ISSUES & DELAYS */}
      {/* ============================================================== */}
      {activeTab === 'issues' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <h2 className="text-base font-bold text-navy-950 font-display">Issues, Delays & Dispute Log</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Official dispute and technical blocker escalation. All records are audit-tracked.
              </p>
            </div>

            <button
              onClick={() => setShowNewIssueModal(true)}
              className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition flex items-center gap-1.5"
            >
              <AlertCircle className="w-4 h-4" />
              <span>Raise Project Issue</span>
            </button>
          </div>

          {project.issues.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-slate-300 max-w-lg mx-auto space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <h3 className="text-sm font-bold text-navy-950">No Active Issues or Disputes</h3>
              <p className="text-xs text-slate-500">Your site execution is progressing smoothly without unresolved escalations.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(project.issues || []).map((iss) => (
                <div key={iss.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-navy-950 text-sm">{iss.title}</span>
                      <span className="px-2 py-0.5 bg-rose-100 text-rose-800 font-bold rounded text-[10px]">
                        {iss.severity} Priority
                      </span>
                    </div>
                    <span className="text-slate-400 font-mono text-[11px]">{iss.raisedAt.split('T')[0]}</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">{iss.description}</p>
                  <div className="text-[11px] text-slate-500 pt-1 flex justify-between border-t border-slate-100">
                    <span>Category: {iss.category}</span>
                    <span>Status: {iss.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 12: HANDOVER & SNAGS */}
      {/* ============================================================== */}
      {activeTab === 'handover' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <h2 className="text-base font-bold text-navy-950 font-display">Final Inspection & Handover Checklist</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Defect snagging, final paint/fittings signoff, and official possession handover certificate.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowNewSnagModal(true)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4 text-slate-600" />
                <span>Add Snag / Defect</span>
              </button>

              {!project.handover.possessionSignoff && (
                <button
                  onClick={handleSignHandover}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5"
                >
                  <Key className="w-4 h-4 text-white" />
                  <span>Accept Possession & Sign Handover</span>
                </button>
              )}
            </div>
          </div>

          {/* Warranty Certificate Banner if Handed Over */}
          {project.handover.possessionSignoff && (
            <div className="bg-emerald-900 text-white p-6 rounded-2xl border border-emerald-700 shadow-md space-y-3">
              <div className="flex items-center gap-2 text-gold-400 font-bold text-sm">
                <Award className="w-5 h-5 text-gold-400" />
                <span>Official Possession Handover Completed & Verified</span>
              </div>
              <p className="text-xs text-emerald-100 leading-relaxed">
                Congratulations! Keys handed over on {project.handover.handoverDate}. Active Warranty Coverage:{' '}
                <span className="font-semibold text-white">
                  10-Year RCC Structural Guarantee & 1-Year Workmanship Warranty (Valid until {project.handover.warrantyEndDate})
                </span>.
              </p>
            </div>
          )}

          {/* Snag list table */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase text-slate-400">
              Snagging Defect Items ({project.handover.snags.length})
            </h3>

            {project.handover.snags.length === 0 ? (
              <p className="text-xs text-slate-400">No defects or snag items identified.</p>
            ) : (
              <div className="space-y-2">
                {(project.handover.snags || []).map((s) => (
                  <div key={s.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                    <div>
                      <div className="font-bold text-slate-900">{s.title}</div>
                      <div className="text-[11px] text-slate-500">Location: {s.area}</div>
                    </div>
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-900 rounded font-semibold text-[10px]">
                      {s.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MATH FORMULA EXPLANATION MODAL */}
      {/* ============================================================== */}
      {showMathModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 font-sans">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-base font-bold text-navy-950 font-display">
                  Weighted Progress Calculation Engine
                </h3>
                <p className="text-xs text-slate-500">IS 456 & CPWD Engineering Benchmark Formula</p>
              </div>
              <button
                onClick={() => setShowMathModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono text-xs text-slate-800 space-y-2">
              <div className="font-bold text-navy-950">Formula:</div>
              <div className="p-2 bg-white rounded border border-slate-200 text-center">
                Project Completion % = [ ∑ (Stage Weight × Verified Completion Fraction) / Total Weights ] × 100
              </div>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              <div className="text-xs font-bold uppercase text-slate-400">Current Project Breakdown</div>
              {(explanation.breakdown || []).map((b, i) => (
                <div key={i} className="flex justify-between items-center text-xs p-2 bg-slate-50 rounded-lg">
                  <span className="text-slate-800">{b.stageName}</span>
                  <span className="font-mono text-slate-600 font-bold">
                    {b.weight}% × {b.verifiedFraction} = {b.contribution}%
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
              <span className="font-bold text-slate-800">Total Verified Progress:</span>
              <span className="font-mono font-bold text-lg text-emerald-700">{verifiedProgress}%</span>
            </div>
          </div>
        </div>
      )}

      {/* NEW REPORT MODAL */}
      {showNewReportModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateDailyReport}
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 font-sans"
          >
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-navy-950 font-display">Log Daily Site Report</h3>
              <button
                type="button"
                onClick={() => setShowNewReportModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Weather Condition</label>
                <select
                  value={dsrWeather}
                  onChange={(e) => setDsrWeather(e.target.value as any)}
                  className="w-full p-2 border border-slate-300 rounded-xl bg-slate-50"
                >
                  <option value="Sunny / Clear">Sunny / Clear</option>
                  <option value="Partly Cloudy">Partly Cloudy</option>
                  <option value="Rainy / Monsoon">Rainy / Monsoon</option>
                  <option value="Extreme Heat">Extreme Heat</option>
                  <option value="Windy">Windy</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Workers on Site</label>
                <input
                  type="number"
                  value={dsrWorkers}
                  onChange={(e) => setDsrWorkers(Number(e.target.value))}
                  min={1}
                  max={100}
                  className="w-full p-2 border border-slate-300 rounded-xl bg-slate-50"
                />
              </div>
            </div>

            <div className="text-xs">
              <label className="block text-slate-700 font-semibold mb-1">Work Performed Today</label>
              <textarea
                value={dsrWorkDone}
                onChange={(e) => setDsrWorkDone(e.target.value)}
                rows={3}
                placeholder=""
                className="w-full p-2.5 border border-slate-300 rounded-xl bg-slate-50"
              />
            </div>

            <div className="text-xs">
              <label className="block text-slate-700 font-semibold mb-1">Materials Received on Site</label>
              <input
                type="text"
                value={dsrMaterials}
                onChange={(e) => setDsrMaterials(e.target.value)}
                placeholder=""
                className="w-full p-2 border border-slate-300 rounded-xl bg-slate-50"
              />
            </div>

            <div className="text-xs">
              <label className="block text-slate-700 font-semibold mb-1">Site Video / Drone Footage URL (Optional)</label>
              <input
                type="url"
                value={dsrVideoUrl}
                onChange={(e) => setDsrVideoUrl(e.target.value)}
                placeholder="https://... (Video MP4 or Stream link)"
                className="w-full p-2 border border-slate-300 rounded-xl bg-slate-50 font-mono"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNewReportModal(false)}
                className="px-4 py-2 text-xs text-slate-600 rounded-xl hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-navy-950 text-white font-bold text-xs rounded-xl hover:bg-navy-900"
              >
                Submit Site Report
              </button>
            </div>
          </form>
        </div>
      )}

      {/* DISPUTE MODAL */}
      {showDisputeModal && selectedMilestone && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 font-sans">
            <h3 className="text-base font-bold text-navy-950 font-display">
              Dispute Milestone: {selectedMilestone.title}
            </h3>
            <p className="text-xs text-slate-500">
              Disputing this milestone will pause release of {formatINR(selectedMilestone.amountPaise)} while preserving unrelated payment tranches.
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Dispute Reason & Site Discrepancy</label>
              <textarea
                value={disputeNotes}
                onChange={(e) => setDisputeNotes(e.target.value)}
                rows={3}
                placeholder="Explain what is unverified or defective on site..."
                className="w-full p-2 text-xs border border-slate-300 rounded-xl bg-slate-50"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDisputeModal(false)}
                className="px-4 py-2 text-xs text-slate-600 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRaiseDispute}
                className="px-4 py-2 bg-rose-600 text-white font-bold text-xs rounded-xl hover:bg-rose-700"
              >
                Confirm Dispute
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CORRECTION MODAL */}
      {showCorrectionModal && selectedMilestone && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 font-sans">
            <h3 className="text-base font-bold text-navy-950 font-display">
              Request Work Correction: {selectedMilestone.title}
            </h3>
            <p className="text-xs text-slate-500">
              Submit required adjustments before milestone payment approval.
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Required Corrections</label>
              <textarea
                value={correctionNotes}
                onChange={(e) => setCorrectionNotes(e.target.value)}
                rows={3}
                placeholder=""
                className="w-full p-2 text-xs border border-slate-300 rounded-xl bg-slate-50"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCorrectionModal(false)}
                className="px-4 py-2 text-xs text-slate-600 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRequestCorrection}
                className="px-4 py-2 bg-amber-600 text-white font-bold text-xs rounded-xl hover:bg-amber-700"
              >
                Submit Correction
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW ISSUE MODAL */}
      {showNewIssueModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateIssue}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 font-sans"
          >
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-navy-950 font-display">Raise Project Issue / Delay</h3>
              <button
                type="button"
                onClick={() => setShowNewIssueModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs">
              <label className="block text-slate-700 font-semibold mb-1">Issue Title</label>
              <input
                type="text"
                value={issueTitle}
                onChange={(e) => setIssueTitle(e.target.value)}
                placeholder=""
                className="w-full p-2 border border-slate-300 rounded-xl bg-slate-50"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Category</label>
                <select
                  value={issueCategory}
                  onChange={(e) => setIssueCategory(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-xl bg-slate-50"
                >
                  <option value="MATERIAL_DELAY">Material Delay</option>
                  <option value="WEATHER">Weather / Rain</option>
                  <option value="LABOR_SHORTAGE">Labor Shortage</option>
                  <option value="DESIGN_CHANGE">Design Change</option>
                  <option value="PAYMENT_DISPUTE">Payment Dispute</option>
                  <option value="TECHNICAL_DEFECT">Technical Defect</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Severity</label>
                <select
                  value={issueSeverity}
                  onChange={(e) => setIssueSeverity(e.target.value as any)}
                  className="w-full p-2 border border-slate-300 rounded-xl bg-slate-50"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>
            </div>

            <div className="text-xs">
              <label className="block text-slate-700 font-semibold mb-1">Description</label>
              <textarea
                value={issueDesc}
                onChange={(e) => setIssueDesc(e.target.value)}
                rows={3}
                placeholder="Provide detailed background and requested resolution..."
                className="w-full p-2.5 border border-slate-300 rounded-xl bg-slate-50"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNewIssueModal(false)}
                className="px-4 py-2 text-xs text-slate-600 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-rose-600 text-white font-bold text-xs rounded-xl hover:bg-rose-700"
              >
                Log Issue
              </button>
            </div>
          </form>
        </div>
      )}

      {/* NEW SNAG MODAL */}
      {showNewSnagModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleAddSnag}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 font-sans"
          >
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-navy-950 font-display">Add Snag / Defect Item</h3>
              <button
                type="button"
                onClick={() => setShowNewSnagModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs">
              <label className="block text-slate-700 font-semibold mb-1">Defect Title</label>
              <input
                type="text"
                value={snagTitle}
                onChange={(e) => setSnagTitle(e.target.value)}
                placeholder=""
                className="w-full p-2 border border-slate-300 rounded-xl bg-slate-50"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Room / Area Location</label>
                <input
                  type="text"
                  value={snagArea}
                  onChange={(e) => setSnagArea(e.target.value)}
                  placeholder=""
                  className="w-full p-2 border border-slate-300 rounded-xl bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Priority</label>
                <select
                  value={snagPriority}
                  onChange={(e) => setSnagPriority(e.target.value as any)}
                  className="w-full p-2 border border-slate-300 rounded-xl bg-slate-50"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNewSnagModal(false)}
                className="px-4 py-2 text-xs text-slate-600 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-navy-950 text-white font-bold text-xs rounded-xl hover:bg-navy-900"
              >
                Record Snag
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
