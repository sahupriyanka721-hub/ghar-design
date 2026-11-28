import React, { useState, useMemo, useEffect } from 'react';
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
  Search,
  Filter,
  Download,
  FileCode,
  Image as ImageIcon,
  CheckCircle,
  FileSpreadsheet,
  RotateCcw,
  Bell,
  MessageSquare,
  Lock,
  Unlock,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import {
  getInteriorProjectMilestones,
  saveInteriorMilestone,
  submitMilestoneToAdmin,
  calculateProjectMilestoneProgress,
  getInteriorProjects,
  InteriorMilestone,
  ProjectMilestoneProgress,
  InteriorDeliverableItem,
} from '../../data/interiorDesignerStore.js';
import { useToast } from '../../context/ToastContext.js';

export type MilestoneViewMode =
  | 'PROJECT_MILESTONES'
  | 'SUBMIT_DELIVERABLES'
  | 'MILESTONE_SUBMISSION'
  | 'PENDING_ADMIN_REVIEW'
  | 'CUSTOMER_APPROVAL_STATUS'
  | 'REVISION_REQUIRED'
  | 'APPROVED_MILESTONES'
  | 'COMPLETED_DELIVERABLES';

interface CustomDeliverableUpload {
  id: string;
  projectId: string;
  milestoneId: string;
  milestoneName: string;
  title: string;
  category: 'LAYOUT_2D' | 'VISUALIZATION_3D' | 'MATERIAL_FINISHES' | 'MEP_SPECS' | 'SITE_REPORT' | 'BOQ_ESTIMATE' | 'COMPLIANCE';
  version: string;
  fileUrl: string;
  fileSize: string;
  uploadedAt: string;
  status: 'PENDING_ADMIN' | 'APPROVED' | 'REVISION_REQUIRED';
  notes: string;
}

const INITIAL_DELIVERABLES: CustomDeliverableUpload[] = [
  {
    id: 'del-up-101',
    projectId: 'prj-int-1',
    milestoneId: 'BG-MS-INT-101',
    milestoneName: 'Stage 1: Advance Booking & Space Planning Approval',
    title: 'Sanctioned 2D Furniture Placement & Spatial Layout Plan',
    category: 'LAYOUT_2D',
    version: 'v2.1 Final',
    fileUrl: 'https://buildghar.com/docs/spatial-plan-v2.pdf',
    fileSize: '14.2 MB',
    uploadedAt: '2026-10-25',
    status: 'APPROVED',
    notes: 'Laser surveyed and coordinated with structural grid.',
  },
  {
    id: 'del-up-102',
    projectId: 'prj-int-1',
    milestoneId: 'BG-MS-INT-102',
    milestoneName: 'Stage 2: 2D Working CAD Drawings & MEP Electrical Schedule',
    title: 'Reflected False Ceiling (RCP) & Circuit Switchboard Elevation CAD',
    category: 'MEP_SPECS',
    version: 'v1.4 Executable',
    fileUrl: 'https://buildghar.com/docs/mep-electrical-set.pdf',
    fileSize: '28.6 MB',
    uploadedAt: '2026-11-18',
    status: 'APPROVED',
    notes: 'Conduit loops, AC grille margins and 15A power drops marked.',
  },
  {
    id: 'del-up-103',
    projectId: 'prj-int-1',
    milestoneId: 'BG-MS-INT-103',
    milestoneName: 'Stage 3: 3D Photorealistic Visualizations & Material Schedule',
    title: 'Master Suite & Modular Kitchen 4K Photorealistic V-Ray Renderings',
    category: 'VISUALIZATION_3D',
    version: 'v3.0 Ultra-HD',
    fileUrl: 'https://buildghar.com/docs/3d-renders-deck.pdf',
    fileSize: '64.1 MB',
    uploadedAt: '2026-11-24',
    status: 'PENDING_ADMIN',
    notes: 'Includes daylight and warm-cove night illumination passes.',
  },
  {
    id: 'del-up-104',
    projectId: 'prj-int-1',
    milestoneId: 'BG-MS-INT-103',
    milestoneName: 'Stage 3: 3D Photorealistic Visualizations & Material Schedule',
    title: 'Italian Marble, Veneer & Acrylic Laminate Swatch Specification Moodboard',
    category: 'MATERIAL_FINISHES',
    version: 'v1.2 Swatch-Verified',
    fileUrl: 'https://buildghar.com/docs/material-palette-dlf.pdf',
    fileSize: '18.4 MB',
    uploadedAt: '2026-11-25',
    status: 'PENDING_ADMIN',
    notes: 'Physical sample catalog confirmed at Greenlam and Classic Marble depots.',
  },
  {
    id: 'del-up-105',
    projectId: 'prj-int-1',
    milestoneId: 'BG-MS-INT-104',
    milestoneName: 'Stage 4: Woodwork Carcass & False Ceiling Execution Audit',
    title: 'Modular Carcass Dry Alignment & Laser Plumb Line Inspection Dossier',
    category: 'SITE_REPORT',
    version: 'v1.0 In-Progress',
    fileUrl: 'https://buildghar.com/docs/carcass-qc-report.pdf',
    fileSize: '8.7 MB',
    uploadedAt: '2026-11-27',
    status: 'PENDING_ADMIN',
    notes: 'Moisture content recorded at 8.4%. Calibrated 18mm Marine Ply verified.',
  },
];

export const InteriorDesignerMilestones: React.FC = () => {
  const { success, error, info } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active Project Selection
  const projects = getInteriorProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || 'prj-int-1');

  // View Mode
  const currentView = (searchParams.get('view') as MilestoneViewMode) || 'PROJECT_MILESTONES';
  const setViewMode = (mode: MilestoneViewMode) => {
    setSearchParams({ view: mode });
  };

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');

  // Milestone data
  const [milestones, setMilestones] = useState<InteriorMilestone[]>(() =>
    getInteriorProjectMilestones(selectedProjectId)
  );
  const [progress, setProgress] = useState<ProjectMilestoneProgress>(() =>
    calculateProjectMilestoneProgress(selectedProjectId)
  );
  const [deliverablesList, setDeliverablesList] = useState<CustomDeliverableUpload[]>(INITIAL_DELIVERABLES);

  // Modals State
  const [selectedMilestoneForSubmit, setSelectedMilestoneForSubmit] = useState<InteriorMilestone | null>(null);
  const [selectedMilestoneForAudit, setSelectedMilestoneForAudit] = useState<InteriorMilestone | null>(null);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isDeliverableUploadModalOpen, setIsDeliverableUploadModalOpen] = useState(false);

  // Submit Form States
  const [completionNotes, setCompletionNotes] = useState('');
  const [completionDate, setCompletionDate] = useState(new Date().toISOString().slice(0, 10));
  const [documentUrl, setDocumentUrl] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [requestedAmount, setRequestedAmount] = useState<number>(0);

  // Deliverable Upload Form States
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadMilestoneId, setUploadMilestoneId] = useState('');
  const [uploadCategory, setUploadCategory] = useState<CustomDeliverableUpload['category']>('VISUALIZATION_3D');
  const [uploadVersion, setUploadVersion] = useState('v1.0');
  const [uploadUrl, setUploadUrl] = useState('');
  const [uploadNotes, setUploadNotes] = useState('');

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
    success(`Milestone ${selectedMilestoneForSubmit.name} submitted to BuildGhar Admin PMC Desk!`);
  };

  const handleUploadDeliverable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTitle.trim()) {
      error('Please enter deliverable title');
      return;
    }
    const targetMs = milestones.find((m) => m.id === uploadMilestoneId) || milestones[0];
    const newDeliverable: CustomDeliverableUpload = {
      id: `del-up-${Date.now()}`,
      projectId: selectedProjectId,
      milestoneId: targetMs?.id || 'BG-MS-INT-103',
      milestoneName: targetMs?.name || 'Stage Deliverable',
      title: uploadTitle,
      category: uploadCategory,
      version: uploadVersion || 'v1.0',
      fileUrl: uploadUrl || 'https://buildghar.com/docs/deliverables-v1.pdf',
      fileSize: '15.8 MB',
      uploadedAt: new Date().toISOString().slice(0, 10),
      status: 'PENDING_ADMIN',
      notes: uploadNotes || 'Deliverable uploaded and ready for compliance audit.',
    };
    setDeliverablesList([newDeliverable, ...deliverablesList]);
    setIsDeliverableUploadModalOpen(false);
    setUploadTitle('');
    setUploadUrl('');
    setUploadNotes('');
    success(`Deliverable "${newDeliverable.title}" uploaded & cataloged successfully!`);
  };

  // Nav Tabs Definitions with Real-time Count Badges
  const navTabs: { id: MilestoneViewMode; label: string; count: number; badgeColor: string }[] = useMemo(() => {
    const readyForSubmissionCount = milestones.filter(
      (m) => m.status === 'IN_PROGRESS' || m.status === 'CORRECTION_REQUESTED'
    ).length;
    const pendingAdminCount = milestones.filter((m) => m.status === 'SUBMITTED_TO_ADMIN').length;
    const forwardedCustomerCount = milestones.filter((m) => m.status === 'FORWARDED_TO_CUSTOMER').length;
    const revisionCount = milestones.filter(
      (m) => m.status === 'CORRECTION_REQUESTED' || (m as any).status === 'CUSTOMER_CHANGES_REQUESTED'
    ).length;
    const approvedCount = milestones.filter(
      (m) => m.status === 'ADMIN_VERIFIED_COMPLETED' || m.status === 'CUSTOMER_APPROVED'
    ).length;

    return [
      { id: 'PROJECT_MILESTONES', label: 'Project Milestones', count: milestones.length, badgeColor: 'bg-blue-100 text-blue-800' },
      { id: 'SUBMIT_DELIVERABLES', label: 'Submit Deliverables', count: deliverablesList.length, badgeColor: 'bg-indigo-100 text-indigo-800' },
      { id: 'MILESTONE_SUBMISSION', label: 'Milestone Submission', count: readyForSubmissionCount, badgeColor: 'bg-emerald-100 text-emerald-800' },
      { id: 'PENDING_ADMIN_REVIEW', label: 'Pending Admin Review', count: pendingAdminCount, badgeColor: 'bg-amber-100 text-amber-800' },
      { id: 'CUSTOMER_APPROVAL_STATUS', label: 'Customer Approval Status', count: forwardedCustomerCount, badgeColor: 'bg-purple-100 text-purple-800' },
      { id: 'REVISION_REQUIRED', label: 'Revision Required', count: revisionCount, badgeColor: 'bg-rose-100 text-rose-800' },
      { id: 'APPROVED_MILESTONES', label: 'Approved Milestones', count: approvedCount, badgeColor: 'bg-emerald-100 text-emerald-800' },
      { id: 'COMPLETED_DELIVERABLES', label: 'Completed Deliverables', count: deliverablesList.filter((d) => d.status === 'APPROVED').length, badgeColor: 'bg-teal-100 text-teal-800' },
    ];
  }, [milestones, deliverablesList]);

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
    <div className="space-y-6 pb-20">
      {/* ----------------- TOP HERO HEADER ----------------- */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-32 -mb-16 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase bg-blue-500/20 text-blue-200 border border-blue-400/30 font-mono">
                Module 9: Section 13 Governance
              </span>
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                <ShieldCheck className="w-3.5 h-3.5" />
                Escrow Protected Milestones
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <CheckSquare className="w-8 h-8 text-amber-400 shrink-0" />
              <span>Milestone & Deliverable Management</span>
            </h1>
            <p className="text-sm text-blue-100/90 max-w-2xl font-normal leading-relaxed">
              Stage deliverable submissions, 3-tier weighted progress verification (Designer $\rightarrow$ Admin PMC $\rightarrow$ Homeowner sign-off), and milestone escrow disbursement desk.
            </p>
          </div>

          {/* Project Picker & Action */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-2 px-3 flex flex-col justify-center">
              <label className="text-[10px] uppercase font-bold text-blue-200 font-mono">Active Project</label>
              <select
                value={selectedProjectId}
                onChange={(e) => handleProjectChange(e.target.value)}
                className="bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer pr-4"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id} className="text-slate-900 font-medium">
                    {p.name || p.title} ({p.id})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setIsDeliverableUploadModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-2xl transition shadow-lg hover:shadow-amber-400/20"
            >
              <Upload className="w-4 h-4" />
              <span>Submit Deliverable</span>
            </button>
          </div>
        </div>

        {/* 3-Tier Progress Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-6 border-t border-white/10 text-xs">
          <div className="bg-white/10 rounded-2xl p-3 border border-white/10">
            <div className="flex items-center justify-between text-blue-200 text-[11px] mb-1 font-mono">
              <span>Designer Progress</span>
              <span className="text-base font-black text-white">{progress.designerReportedProgress}%</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-1.5 overflow-hidden">
              <div className="bg-blue-400 h-full rounded-full" style={{ width: `${progress.designerReportedProgress}%` }} />
            </div>
          </div>

          <div className="bg-white/10 rounded-2xl p-3 border border-white/10">
            <div className="flex items-center justify-between text-blue-200 text-[11px] mb-1 font-mono">
              <span>Admin Verified (PMC)</span>
              <span className="text-base font-black text-amber-300">{progress.adminVerifiedProgress}%</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-1.5 overflow-hidden">
              <div className="bg-amber-400 h-full rounded-full" style={{ width: `${progress.adminVerifiedProgress}%` }} />
            </div>
          </div>

          <div className="bg-white/10 rounded-2xl p-3 border border-white/10">
            <div className="flex items-center justify-between text-blue-200 text-[11px] mb-1 font-mono">
              <span>Customer Approved</span>
              <span className="text-base font-black text-emerald-300">{progress.customerApprovedProgress}%</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-1.5 overflow-hidden">
              <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${progress.customerApprovedProgress}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* ----------------- SUBMENU VIEW SELECTOR & PILLS ----------------- */}
      <div className="space-y-3">
        {/* Mobile View Switcher */}
        <div className="sm:hidden bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
          <label className="block text-[11px] font-bold text-slate-500 uppercase font-mono mb-1">
            Milestone View Mode
          </label>
          <select
            value={currentView}
            onChange={(e) => setViewMode(e.target.value as MilestoneViewMode)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
          >
            {navTabs.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label} ({t.count})
              </option>
            ))}
          </select>
        </div>

        {/* Desktop 8-Pill Horizontal Strip */}
        <div className="hidden sm:flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-bold scrollbar-none">
          {navTabs.map((tab) => {
            const isActive = currentView === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setViewMode(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl whitespace-nowrap transition-all duration-150 shrink-0 select-none ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20 font-black'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] font-mono font-black px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-white/20 text-white' : tab.badgeColor
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ----------------- SEARCH & FILTERS BAR ----------------- */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${navTabs.find((t) => t.id === currentView)?.label}...`}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <select
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Categories & Statuses</option>
            <option value="CAD_2D">2D CAD & Working Drawings</option>
            <option value="RENDER_3D">3D Visualizations & Renders</option>
            <option value="MATERIAL">Material & Moodboard</option>
            <option value="AUDIT">Execution & Snag Audit</option>
          </select>

          <button
            onClick={() => setIsDeliverableUploadModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Deliverable</span>
          </button>
        </div>
      </div>

      {/* ----------------- SUB-VIEW 1: PROJECT MILESTONES ----------------- */}
      {currentView === 'PROJECT_MILESTONES' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-600" />
              <span>Full Milestone Schedule ({milestones.length} Configured Stages)</span>
            </h2>
            <span className="text-xs font-mono font-bold text-slate-500">
              Total Contract Escrow: ₹{milestones.reduce((s, m) => s + m.targetAmount, 0).toLocaleString('en-IN')}
            </span>
          </div>

          <div className="space-y-4">
            {milestones.map((milestone) => (
              <div
                key={milestone.id}
                className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs hover:border-blue-300 transition space-y-4"
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

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <div className="text-xs text-slate-400 font-bold">Target Payout</div>
                      <div className="text-lg font-black text-slate-900">
                        ₹{milestone.targetAmount.toLocaleString('en-IN')}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        Target Due: {milestone.dueDate}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      {milestone.status !== 'ADMIN_VERIFIED_COMPLETED' && (
                        <button
                          onClick={() => openSubmitModal(milestone)}
                          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Submit Milestone</span>
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
                        <span>Audit History</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Scope Deliverables Checklist */}
                {milestone.deliverables && milestone.deliverables.length > 0 && (
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-400 font-mono tracking-wider block mb-2">
                      Required Stage Deliverables:
                    </span>
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

                {/* Submission Log */}
                {milestone.submissionDetails && (
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between font-bold text-slate-700">
                      <span className="flex items-center gap-1.5 text-blue-800">
                        <FileCheck2 className="w-4 h-4 text-blue-600" />
                        <span>Designer Submission Recorded:</span>
                      </span>
                      <span className="font-mono text-slate-500 text-[11px]">
                        Submitted on {milestone.submissionDetails.completionDate}
                      </span>
                    </div>
                    <p className="text-slate-600 leading-relaxed font-normal">
                      {milestone.submissionDetails.completionDescription}
                    </p>
                  </div>
                )}

                {/* Reviewer Feeds */}
                {milestone.adminReview && (
                  <div className="p-3 rounded-2xl bg-indigo-50/70 border border-indigo-200/60 text-xs text-indigo-950 flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>BuildGhar Admin PMC Note:</strong> {milestone.adminReview.feedback}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ----------------- SUB-VIEW 2: SUBMIT DELIVERABLES ----------------- */}
      {currentView === 'SUBMIT_DELIVERABLES' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Upload className="w-5 h-5 text-indigo-600" />
                  <span>Deliverable Upload & Version Management Desk</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Upload architectural 2D DWGs, 3D photorealistic isometric renders, material moodboards, and site logs tagged by stage.
                </p>
              </div>

              <button
                onClick={() => setIsDeliverableUploadModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition self-start sm:self-auto"
              >
                <Upload className="w-4 h-4" />
                <span>Upload New File</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-mono text-[11px] uppercase border-b border-slate-200">
                  <tr>
                    <th className="p-3.5 pl-4">Deliverable Title & Stage</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5">Version</th>
                    <th className="p-3.5">File Size</th>
                    <th className="p-3.5">Compliance Status</th>
                    <th className="p-3.5 pr-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {deliverablesList.map((del) => (
                    <tr key={del.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3.5 pl-4">
                        <strong className="text-slate-900 block">{del.title}</strong>
                        <span className="text-[11px] text-slate-400 font-mono">{del.milestoneName}</span>
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-mono text-[10px] font-bold border border-blue-200">
                          {del.category}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-slate-800 font-bold">{del.version}</td>
                      <td className="p-3.5 text-slate-500 font-mono">{del.fileSize}</td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            del.status === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {del.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="p-3.5 pr-4 text-right">
                        <a
                          href={del.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-bold"
                        >
                          <span>Preview</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- SUB-VIEW 3: MILESTONE SUBMISSION ----------------- */}
      {currentView === 'MILESTONE_SUBMISSION' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {milestones
              .filter((m) => m.status === 'IN_PROGRESS' || m.status === 'CORRECTION_REQUESTED' || m.status === 'SUBMITTED_TO_ADMIN')
              .map((milestone) => (
                <div
                  key={milestone.id}
                  className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs hover:border-emerald-300 transition space-y-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-xs font-bold text-slate-400 block">Stage {milestone.order}</span>
                      <h3 className="text-sm font-bold text-slate-900 mt-0.5">{milestone.name}</h3>
                      <span className="text-xs text-blue-600 font-bold">Weightage: {milestone.weightPercent}%</span>
                    </div>
                    {getStatusBadge(milestone.status)}
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed font-normal">
                    {milestone.description}
                  </p>

                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-400 text-[10px] block font-mono">Target Escrow Release</span>
                      <strong className="text-slate-900 text-sm">₹{milestone.targetAmount.toLocaleString('en-IN')}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block font-mono">Milestone Target Due</span>
                      <strong className="text-slate-700">{milestone.dueDate}</strong>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-mono">ID: {milestone.id}</span>
                    <button
                      onClick={() => openSubmitModal(milestone)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{milestone.status === 'SUBMITTED_TO_ADMIN' ? 'Resubmit Milestone' : 'Submit Claim'}</span>
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ----------------- SUB-VIEW 4: PENDING ADMIN REVIEW ----------------- */}
      {currentView === 'PENDING_ADMIN_REVIEW' && (
        <div className="space-y-4">
          {milestones.filter((m) => m.status === 'SUBMITTED_TO_ADMIN').length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-dashed border-slate-200">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-800">No Submissions Awaiting Admin Review</h4>
              <p className="text-xs text-slate-500 mt-1">All submitted deliverables have been processed by the BuildGhar PMC compliance team.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {milestones
                .filter((m) => m.status === 'SUBMITTED_TO_ADMIN')
                .map((m) => (
                  <div
                    key={m.id}
                    className="bg-white rounded-3xl border border-amber-200 p-6 shadow-xs hover:border-amber-300 transition space-y-4"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-mono text-[10px] font-bold border border-amber-200">
                          Under PMC Verification
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 mt-1">{m.name}</h4>
                        <span className="text-xs text-slate-400 font-mono">Target: ₹{m.targetAmount.toLocaleString('en-IN')}</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded-lg">
                        SLA: 48h
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-600">
                      <strong>Submission Summary:</strong> {m.submissionDetails?.completionDescription || 'Submitted for compliance verification.'}
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-mono">Date: {m.submissionDetails?.completionDate}</span>
                      <button
                        onClick={() => success(`Admin desk notified for priority review of ${m.id}`)}
                        className="text-amber-700 hover:text-amber-900 font-bold flex items-center gap-1"
                      >
                        <Bell className="w-3.5 h-3.5" />
                        <span>Ping Admin Desk</span>
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* ----------------- SUB-VIEW 5: CUSTOMER APPROVAL STATUS ----------------- */}
      {currentView === 'CUSTOMER_APPROVAL_STATUS' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {milestones
              .filter((m) => m.status === 'FORWARDED_TO_CUSTOMER' || m.status === 'CUSTOMER_APPROVED')
              .map((m) => (
                <div
                  key={m.id}
                  className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs hover:border-purple-300 transition space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-xs text-slate-400">Stage {m.order}</span>
                      <h4 className="text-sm font-bold text-slate-900 mt-0.5">{m.name}</h4>
                    </div>
                    {getStatusBadge(m.status)}
                  </div>

                  <div className="p-3.5 bg-purple-50/70 border border-purple-200/60 rounded-2xl text-xs text-purple-950 space-y-1">
                    <div className="font-bold flex items-center justify-between">
                      <span>Homeowner Approval Channel:</span>
                      <span className="font-mono text-[10px] text-purple-700">Client: Aman Saxena</span>
                    </div>
                    <p className="text-slate-700">
                      {m.customerReview?.feedback || 'Forwarded to homeowner mobile app for formal sign-off.'}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-mono">Amount: ₹{m.targetAmount.toLocaleString('en-IN')}</span>
                    {m.status === 'FORWARDED_TO_CUSTOMER' && (
                      <button
                        onClick={() => success(`WhatsApp sign-off reminder dispatched to homeowner for ${m.name}.`)}
                        className="text-purple-700 hover:text-purple-900 font-bold flex items-center gap-1"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Send WhatsApp Reminder</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ----------------- SUB-VIEW 6: REVISION REQUIRED ----------------- */}
      {currentView === 'REVISION_REQUIRED' && (
        <div className="space-y-4">
          {milestones.filter((m) => m.status === 'CORRECTION_REQUESTED').length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-dashed border-slate-200">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-800">Zero Revision Requests!</h4>
              <p className="text-xs text-slate-500 mt-1">All design deliverables and technical drawings meet full specification standards.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {milestones
                .filter((m) => m.status === 'CORRECTION_REQUESTED')
                .map((m) => (
                  <div
                    key={m.id}
                    className="bg-white rounded-3xl border border-rose-200 p-6 shadow-xs space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-rose-600" />
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">{m.name}</h4>
                          <span className="text-xs text-rose-600 font-semibold">Stage {m.order} Correction Required</span>
                        </div>
                      </div>
                      <button
                        onClick={() => openSubmitModal(m)}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
                      >
                        Resubmit Corrections
                      </button>
                    </div>

                    <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-900 leading-relaxed">
                      <strong>Reviewer Feedback:</strong> {m.adminReview?.feedback || 'Please update drawing line weights and clarify switchboard conduit drops.'}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* ----------------- SUB-VIEW 7: APPROVED MILESTONES ----------------- */}
      {currentView === 'APPROVED_MILESTONES' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {milestones
              .filter((m) => m.status === 'ADMIN_VERIFIED_COMPLETED' || m.status === 'CUSTOMER_APPROVED')
              .map((m) => (
                <div
                  key={m.id}
                  className="bg-white rounded-3xl border border-emerald-200 p-6 shadow-xs hover:border-emerald-300 transition space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-mono text-[10px] font-bold border border-emerald-200">
                        Escrow Payout Cleared
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 mt-1">{m.name}</h4>
                      <span className="text-xs text-slate-400 font-mono">Weight: {m.weightPercent}%</span>
                    </div>
                    <span className="text-base font-black text-emerald-700 font-mono">
                      ₹{m.targetAmount.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-1">
                    <div className="flex items-center justify-between text-slate-600">
                      <span>PMC Technical Sign-off:</span>
                      <strong className="text-emerald-700">Verified & Approved</strong>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Customer Approval:</span>
                      <strong className="text-purple-700">Signed Off</strong>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-mono">Released: {m.submissionDetails?.completionDate || '2026-11-20'}</span>
                    <button
                      onClick={() => success(`Downloading Escrow Release Voucher for ${m.name}...`)}
                      className="text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Release Voucher</span>
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ----------------- SUB-VIEW 8: COMPLETED DELIVERABLES ----------------- */}
      {currentView === 'COMPLETED_DELIVERABLES' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {deliverablesList
              .filter((d) => d.status === 'APPROVED')
              .map((d) => (
                <div
                  key={d.id}
                  className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs hover:border-teal-300 transition space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <span className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 font-mono text-[10px] font-bold border border-teal-200">
                      {d.category}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-500">{d.version}</span>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-900 leading-snug">{d.title}</h4>
                    <span className="text-[11px] text-slate-400 font-mono block mt-1">{d.milestoneName}</span>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2">{d.notes}</p>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-mono">{d.fileSize}</span>
                    <a
                      href={d.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-teal-700 hover:text-teal-900 font-bold"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </a>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

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
                  <label className="block text-slate-700 font-bold mb-1">Deliverable Document Link / PDF URL</label>
                  <input
                    type="url"
                    value={documentUrl}
                    onChange={(e) => setDocumentUrl(e.target.value)}
                    placeholder="https://buildghar.com/docs/deliverables-v2.pdf"
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">On-Site Evidence Photo URL</label>
                  <input
                    type="url"
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsSubmitModalOpen(false)}
                    className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs transition flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit to BuildGhar Admin</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ============================================================== */}
      {/* MODAL: DELIVERABLE UPLOAD PORTAL */}
      {/* ============================================================== */}
      <AnimatePresence>
        {isDeliverableUploadModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-indigo-900 font-black text-base">
                  <Upload className="w-5 h-5 text-indigo-600" />
                  <span>Upload Deliverable Asset</span>
                </div>
                <button
                  onClick={() => setIsDeliverableUploadModalOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUploadDeliverable} className="space-y-3 mt-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Target Milestone Stage</label>
                  <select
                    value={uploadMilestoneId}
                    onChange={(e) => setUploadMilestoneId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 font-medium"
                  >
                    {milestones.map((m) => (
                      <option key={m.id} value={m.id}>
                        Stage {m.order}: {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Deliverable Title *</label>
                  <input
                    type="text"
                    required
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    placeholder="e.g. Master Bedroom 4K Isometric V-Ray Render"
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Category</label>
                    <select
                      value={uploadCategory}
                      onChange={(e) => setUploadCategory(e.target.value as any)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 font-medium"
                    >
                      <option value="LAYOUT_2D">2D Layout Drawing</option>
                      <option value="VISUALIZATION_3D">3D Renderings</option>
                      <option value="MATERIAL_FINISHES">Material Moodboard</option>
                      <option value="MEP_SPECS">MEP Electrical CAD</option>
                      <option value="SITE_REPORT">Site Inspection Log</option>
                      <option value="BOQ_ESTIMATE">BOQ Spreadsheet</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Version Tag</label>
                    <input
                      type="text"
                      value={uploadVersion}
                      onChange={(e) => setUploadVersion(e.target.value)}
                      placeholder="e.g. v2.1 Final"
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Asset URL / Storage Path</label>
                  <input
                    type="url"
                    value={uploadUrl}
                    onChange={(e) => setUploadUrl(e.target.value)}
                    placeholder="https://buildghar.com/docs/master-suite-v2.pdf"
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Specification Remarks</label>
                  <textarea
                    rows={2}
                    value={uploadNotes}
                    onChange={(e) => setUploadNotes(e.target.value)}
                    placeholder="Verified against client design brief..."
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsDeliverableUploadModalOpen(false)}
                    className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-xs transition"
                  >
                    Save & Catalog Deliverable
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ============================================================== */}
      {/* MODAL: AUDIT TRAIL MODAL */}
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
                <div className="flex items-center gap-2 text-slate-900 font-black text-base">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <span>Milestone Audit Trail</span>
                </div>
                <button
                  onClick={() => setIsAuditModalOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="font-mono text-slate-400 block text-[10px]">STAGE {selectedMilestoneForAudit.order}</span>
                  <h4 className="font-bold text-slate-900">{selectedMilestoneForAudit.name}</h4>
                  <span className="text-slate-500 font-mono">ID: {selectedMilestoneForAudit.id} • Target: ₹{selectedMilestoneForAudit.targetAmount.toLocaleString('en-IN')}</span>
                </div>

                <div className="space-y-2 border-l-2 border-blue-200 pl-4 ml-2">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono text-slate-400">Step 1: Configuration</span>
                    <p className="font-semibold text-slate-800">Milestone created & locked in escrow</p>
                  </div>

                  {selectedMilestoneForAudit.submissionDetails && (
                    <div className="space-y-0.5 pt-2">
                      <span className="text-[10px] font-mono text-blue-600">Step 2: Designer Submission</span>
                      <p className="font-semibold text-slate-800">{selectedMilestoneForAudit.submissionDetails.completionDescription}</p>
                      <span className="text-[10px] text-slate-400 font-mono">Date: {selectedMilestoneForAudit.submissionDetails.completionDate}</span>
                    </div>
                  )}

                  {selectedMilestoneForAudit.adminReview && (
                    <div className="space-y-0.5 pt-2">
                      <span className="text-[10px] font-mono text-indigo-600">Step 3: Admin PMC Verification</span>
                      <p className="font-semibold text-slate-800">{selectedMilestoneForAudit.adminReview.feedback}</p>
                    </div>
                  )}

                  {selectedMilestoneForAudit.customerReview && (
                    <div className="space-y-0.5 pt-2">
                      <span className="text-[10px] font-mono text-emerald-600">Step 4: Customer Approval</span>
                      <p className="font-semibold text-slate-800">{selectedMilestoneForAudit.customerReview.feedback}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setIsAuditModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
                >
                  Close Audit Trail
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
