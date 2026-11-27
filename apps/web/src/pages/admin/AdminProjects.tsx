import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  UserCheck,
  HardHat,
  Compass,
  Palette,
  Eye,
  Plus,
  X,
  ArrowLeft,
  ArrowRight,
  Check,
  Calendar,
  DollarSign,
  Layers,
  MapPin,
  TrendingUp,
  FileText,
  Camera,
  ShieldCheck,
  AlertCircle,
  Play,
  Pause,
  Award,
  Sparkles,
  ExternalLink,
  ChevronRight,
  CheckSquare,
  Square,
  RefreshCw,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext.js';
import { formatINR, formatDate } from '../../lib/utils.js';
import {
  getExecutionProjects,
  saveExecutionProject,
  createDefaultExecutionStages,
  createDefaultPaymentMilestones,
  generateNextProjectId,
  approveProjectKickoff,
  updateProjectKickoffChecklist,
  reassignProjectTeam,
  flagProjectDelayOrHold,
  completeProjectClosure,
  ExecutionProject,
  ProjectKickoffInfo,
  ProjectStatus,
} from '../../data/projectExecutionStore.js';
import { registerNewCustomer } from '../../data/customerStore.js';
import { pushToCloud } from '../../data/cloudSync.js';
import { getRegisteredArchitects } from '../../data/architectStore.js';
import { getRegisteredInteriorDesigners } from '../../data/interiorDesignerStore.js';
import { getPlatformContractors } from '../../data/adminStore.js';
import { logAdminAuditAction } from '../../data/adminRbacStore.js';

type ProjectFilterTab = 'ALL' | 'PENDING_REVIEW' | 'READY_FOR_KICKOFF' | 'ACTIVE' | 'DELAYED' | 'COMPLETED';

export const AdminProjects: React.FC = () => {
  const { success, error } = useToast();

  const [activeTab, setActiveTab] = useState<ProjectFilterTab>('ALL');
  const [search, setSearch] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  // Selected project for details drawer
  const [selectedProject, setSelectedProject] = useState<ExecutionProject | null>(null);

  // Assign Team modal
  const [teamModalProject, setTeamModalProject] = useState<ExecutionProject | null>(null);
  const [assignedArchitectId, setAssignedArchitectId] = useState('');
  const [assignedDesignerId, setAssignedDesignerId] = useState('');
  const [assignedContractorId, setAssignedContractorId] = useState('');

  // Flag Delay / Hold modal
  const [delayModalProject, setDelayModalProject] = useState<ExecutionProject | null>(null);
  const [delayReason, setDelayReason] = useState('');
  const [delayTargetStatus, setDelayTargetStatus] = useState<'DELAYED' | 'ON_HOLD' | 'ACTIVE'>('DELAYED');

  // Complete Closure modal
  const [closureModalProject, setClosureModalProject] = useState<ExecutionProject | null>(null);
  const [closureNotes, setClosureNotes] = useState('');

  // Create Project modal (Stepper Wizard)
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [projectStep, setProjectStep] = useState<number>(1);
  const [projectName, setProjectName] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [city, setCity] = useState('');
  const [budgetRupees, setBudgetRupees] = useState<number | ''>('');
  const [projectType, setProjectType] = useState<'VILLA' | 'FLOOR' | 'RENOVATION' | 'INTERIOR'>('VILLA');

  const projects = useMemo(() => getExecutionProjects(), [refreshKey]);
  const architects = useMemo(() => getRegisteredArchitects(), [refreshKey]);
  const designers = useMemo(() => getRegisteredInteriorDesigners(), [refreshKey]);
  const contractors = useMemo(() => getPlatformContractors(), [refreshKey]);

  // Section 9 Master Filter Counts
  const counts = useMemo(() => {
    return {
      all: projects.length,
      pending: projects.filter(
        (p) =>
          p.status === 'PENDING_ADMIN_REVIEW' ||
          p.status === 'AGREEMENT_PENDING' ||
          p.status === 'ADVANCE_PAYMENT_PENDING' ||
          p.status === 'AWAITING_KICKOFF' ||
          p.status === 'START_REQUESTED' ||
          p.status === 'AWAITING_TEAM'
      ).length,
      ready: projects.filter((p) => p.status === 'READY_FOR_KICKOFF').length,
      active: projects.filter(
        (p) => p.status === 'ACTIVE' || p.status === 'IN_PROGRESS' || p.status === 'SCHEDULED'
      ).length,
      delayed: projects.filter(
        (p) => p.status === 'DELAYED' || p.status === 'ON_HOLD' || p.status === 'WORK_PAUSED'
      ).length,
      completed: projects.filter((p) => p.status === 'COMPLETED' || p.status === 'HANDED_OVER').length,
    };
  }, [projects]);

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const pCode = p.id || p.projectCode || p.code || '';
      const matchSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        pCode.toLowerCase().includes(search.toLowerCase()) ||
        p.customerName.toLowerCase().includes(search.toLowerCase()) ||
        (p.city && p.city.toLowerCase().includes(search.toLowerCase())) ||
        (p.siteLocation?.city && p.siteLocation.city.toLowerCase().includes(search.toLowerCase()));

      if (!matchSearch) return false;

      if (activeTab === 'PENDING_REVIEW') {
        return (
          p.status === 'PENDING_ADMIN_REVIEW' ||
          p.status === 'AGREEMENT_PENDING' ||
          p.status === 'ADVANCE_PAYMENT_PENDING' ||
          p.status === 'AWAITING_KICKOFF' ||
          p.status === 'START_REQUESTED' ||
          p.status === 'AWAITING_TEAM'
        );
      }
      if (activeTab === 'READY_FOR_KICKOFF') return p.status === 'READY_FOR_KICKOFF';
      if (activeTab === 'ACTIVE') return p.status === 'ACTIVE' || p.status === 'IN_PROGRESS' || p.status === 'SCHEDULED';
      if (activeTab === 'DELAYED') return p.status === 'DELAYED' || p.status === 'ON_HOLD' || p.status === 'WORK_PAUSED';
      if (activeTab === 'COMPLETED') return p.status === 'COMPLETED' || p.status === 'HANDED_OVER';

      return true;
    });
  }, [projects, search, activeTab]);

  // 1-Click Kickoff Approval (Section 9 Requirement)
  const handleApproveKickoff = (project: ExecutionProject, notes?: string) => {
    const updated = approveProjectKickoff(project.id, notes);
    if (updated) {
      logAdminAuditAction({
        action: 'APPROVE_PROJECT_KICKOFF',
        module: 'PROJECT_MANAGEMENT',
        entity: `Project #${updated.id} (${updated.name})`,
        details: `Approved site commencement for ${updated.name}. Status transitioned to ACTIVE. Pre-commencement verification checklist cleared.`,
      });
      pushToCloud().catch(() => {});
      success(`Project ${updated.id} kickoff approved! Site status is now ACTIVE.`);
      setSelectedProject(updated);
      setRefreshKey((k) => k + 1);
    } else {
      error('Failed to approve kickoff');
    }
  };

  // Toggle Verification Checklist Item (Section 9 Requirement)
  const handleToggleChecklistItem = (
    project: ExecutionProject,
    field: keyof ProjectKickoffInfo,
    currentValue: boolean
  ) => {
    const updated = updateProjectKickoffChecklist(project.id, {
      [field]: !currentValue,
    });
    if (updated) {
      logAdminAuditAction({
        action: 'UPDATE_PROJECT_KICKOFF_CHECKLIST',
        module: 'PROJECT_MANAGEMENT',
        entity: `Project #${updated.id}`,
        details: `Updated checklist item ${String(field)} to ${!currentValue}. Status is now ${updated.status}.`,
      });
      pushToCloud().catch(() => {});
      setSelectedProject(updated);
      setRefreshKey((k) => k + 1);
      success(`Checklist item updated: ${String(field)} is now ${!currentValue ? 'Verified' : 'Pending'}`);
    }
  };

  // Flag Delay / Hold Action
  const handleSaveDelayOrHold = (e: React.FormEvent) => {
    e.preventDefault();
    if (!delayModalProject) return;

    const updated = flagProjectDelayOrHold(delayModalProject.id, delayTargetStatus, delayReason);
    if (updated) {
      logAdminAuditAction({
        action: delayTargetStatus === 'ACTIVE' ? 'RESUME_PROJECT' : 'FLAG_PROJECT_DELAY',
        module: 'PROJECT_MANAGEMENT',
        entity: `Project #${updated.id} (${updated.name})`,
        details: `Project status set to ${delayTargetStatus}. Notes: ${delayReason}`,
      });
      pushToCloud().catch(() => {});
      success(`Project status updated to ${delayTargetStatus}!`);
      if (selectedProject?.id === updated.id) {
        setSelectedProject(updated);
      }
      setDelayModalProject(null);
      setDelayReason('');
      setRefreshKey((k) => k + 1);
    }
  };

  // Complete Final Handover & Closure Action
  const handleSaveClosure = (e: React.FormEvent) => {
    e.preventDefault();
    if (!closureModalProject) return;

    const updated = completeProjectClosure(closureModalProject.id, closureNotes);
    if (updated) {
      logAdminAuditAction({
        action: 'COMPLETE_PROJECT_CLOSURE',
        module: 'PROJECT_MANAGEMENT',
        entity: `Project #${updated.id} (${updated.name})`,
        details: `Project officially closed and handed over. Remarks: ${closureNotes}`,
      });
      pushToCloud().catch(() => {});
      success(`Project ${updated.id} marked COMPLETED! Possession and warranty signoff recorded.`);
      if (selectedProject?.id === updated.id) {
        setSelectedProject(updated);
      }
      setClosureModalProject(null);
      setClosureNotes('');
      setRefreshKey((k) => k + 1);
    }
  };

  const handleOpenTeamModal = (prj: ExecutionProject) => {
    setTeamModalProject(prj);
    setAssignedArchitectId(prj.architectId || '');
    setAssignedDesignerId(prj.interiorDesignerId || '');
    setAssignedContractorId(prj.contractorId || '');
  };

  const handleSaveTeamAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamModalProject) return;

    const arch = architects.find((a) => a.id === assignedArchitectId);
    const des = designers.find((d) => d.id === assignedDesignerId);
    const cnt = contractors.find((c) => c.id === assignedContractorId);

    const updated = reassignProjectTeam(teamModalProject.id, {
      architectId: assignedArchitectId || undefined,
      architectName: arch?.personal?.fullName || arch?.business?.firmName || teamModalProject.architectName,
      architectFirm: arch?.business?.firmName,
      interiorDesignerId: assignedDesignerId || undefined,
      interiorDesignerName: des?.personal?.fullName || des?.business?.studioName || teamModalProject.interiorDesignerName,
      contractorId: assignedContractorId || undefined,
      contractorName: cnt?.firmName || cnt?.name || teamModalProject.contractorName,
      contractorFirm: cnt?.firmName,
    });

    if (updated) {
      logAdminAuditAction({
        action: 'ASSIGN_PROJECT_TEAM',
        module: 'PROJECT_MANAGEMENT',
        entity: `Project #${updated.id} (${updated.name})`,
        details: `Architect: ${updated.architectName || 'None'}, Contractor: ${updated.contractorName || 'None'}`,
      });
      pushToCloud().catch(() => {});
      success(`Project team assigned to ${updated.name}!`);
      if (selectedProject?.id === updated.id) {
        setSelectedProject(updated);
      }
      setTeamModalProject(null);
      setRefreshKey((k) => k + 1);
    }
  };

  // Centralized Project Creation (Section 9 Specification: Shared Project ID BG-2026-XXXX)
  const handleCreateProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim() || !customerName.trim() || !customerPhone.trim()) {
      error('Please provide project name and customer details');
      return;
    }

    const totalContractPaise = Number(budgetRupees || 0) * 100;
    const stages = createDefaultExecutionStages();
    const paymentMilestones = createDefaultPaymentMilestones(totalContractPaise);
    
    // Shared Project ID Standard (Section 9: BG-2026-XXXX)
    const nextProjectId = generateNextProjectId();
    const workOrderNumber = `WO-${nextProjectId}`;
    const bookingCode = `BK-${nextProjectId}`;

    const newPrj: ExecutionProject = {
      id: nextProjectId,
      code: nextProjectId,
      projectCode: nextProjectId,
      requestCode: `REQ-${nextProjectId}`,
      quotationId: `quote-${Date.now()}`,
      quotationCode: `QT-${nextProjectId}`,
      bookingCode,
      workOrderNumber,
      name: projectName.trim(),
      customerId: `usr-cust-${Date.now()}`,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      propertyAddress: `Site Location, ${city}`,
      city,
      state: 'Delhi NCR',
      serviceType: projectType,
      category: 'CONSTRUCTION',
      contractorId: 'pro-unassigned',
      contractorName: 'Team Allocation Pending',
      contractorFirm: 'Platform Partner Network',
      contractorPhone: '+91 98112 00000',
      contractorRole: 'Site Engineer',
      contractValuePaise: totalContractPaise,
      originalContractPaise: totalContractPaise,
      approvedVariationsPaise: 0,
      totalPaidPaise: Math.round(totalContractPaise * 0.10),
      amountAwaitingApprovalPaise: 0,
      amountDuePaise: Math.round(totalContractPaise * 0.15),
      retentionPaise: Math.round(totalContractPaise * 0.05),
      budgetPaise: totalContractPaise,
      progressPercentage: 0,
      overallVerifiedProgress: 0,
      overallReportedProgress: 0,
      currentStage: 'Stage 1: Working Drawings & Sanctions',
      pendingApprovalsCount: 1,
      status: 'PENDING_ADMIN_REVIEW',
      startDate: new Date().toISOString(),
      expectedEndDate: new Date(Date.now() + 180 * 86400000).toISOString(),
      plannedStartDate: new Date().toISOString().split('T')[0],
      plannedEndDate: new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0],
      kickoff: {
        advanceRequiredPaise: Math.round(totalContractPaise * 0.15),
        advancePaid: false,
        advancePaidPaise: 0,
        siteDemarcationReady: false,
        sanctionReceived: false,
        utilityConnectionReady: false,
        contractAgreed: true,
        specialInstructions: 'Project initialized by Admin Desk. Complete Section 9 Pre-Commencement Verification Checklist prior to site kickoff.',
      },
      stages,
      paymentMilestones,
      dailyReports: [],
      issues: [],
      changeOrders: [],
      linkedMaterials: [],
      documents: [
        {
          id: `doc-${Date.now()}-1`,
          title: `Project Charter & Scope (${workOrderNumber})`,
          category: 'CONTRACT',
          version: 'v1.0 (Official)',
          fileUrl: '#',
          fileSize: '1.2 MB',
          uploadedAt: new Date().toISOString(),
          uploadedBy: 'BuildGhar Central Desk',
          approvalStatus: 'APPROVED',
        },
      ],
      messages: [
        {
          id: `msg-${Date.now()}-1`,
          senderId: 'sys-admin',
          senderName: 'BuildGhar Project Desk',
          senderRole: 'ADMIN',
          message: `Shared Project ID ${nextProjectId} has been created. Awaiting pre-commencement checklist clearance.`,
          timestamp: new Date().toISOString(),
        },
      ],
      snags: [],
      handover: {
        status: 'NOT_READY',
        possessionSignoff: false,
        snags: [],
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveExecutionProject(newPrj);

    // Register customer in store so they can log in and see their project immediately
    registerNewCustomer({
      id: newPrj.customerId,
      name: newPrj.customerName,
      phone: newPrj.customerPhone,
      email: 'customer@buildghar.in',
      housePlotNumber: `Plot Site, ${city}`,
      streetLocality: city,
      city: city,
      state: 'Delhi NCR',
      pinCode: '110001',
      requestsCount: 1,
      bookingsCount: 1,
    });

    pushToCloud().catch(() => {});
    logAdminAuditAction({
      action: 'CREATE_PROJECT',
      module: 'PROJECT_MANAGEMENT',
      entity: `${newPrj.name} (${newPrj.id})`,
      details: `Initialized centralized project ${newPrj.id} for client ${newPrj.customerName} with budget ₹${Number(budgetRupees || 0).toLocaleString('en-IN')}`,
    });

    success(`Project ${newPrj.id} created successfully with Shared Project ID standard!`);
    setShowCreateModal(false);
    setProjectName('');
    setCustomerName('');
    setCustomerPhone('');
    setCity('');
    setBudgetRupees('');
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-blue-500/10 text-blue-700 rounded-xl">
              <Building className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black font-display text-navy-950">
              Turnkey Projects &amp; Site Management
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Section 9 Centralized Project Creation, Shared Project ID (<span className="font-mono font-bold text-blue-700">BG-2026-XXXX</span>), Kickoff Clearance &amp; Execution Tracking.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setShowCreateModal(true);
              setProjectStep(1);
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm hover:shadow text-xs flex items-center gap-2 transition cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Project</span>
          </button>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {[
              { label: 'All Projects', value: 'ALL', count: counts.all },
              {
                label: 'Pending Review',
                value: 'PENDING_REVIEW',
                count: counts.pending,
              },
              {
                label: 'Ready for Kickoff',
                value: 'READY_FOR_KICKOFF',
                count: counts.ready,
              },
              {
                label: 'Active Sites',
                value: 'ACTIVE',
                count: counts.active,
              },
              {
                label: 'Delayed / Hold',
                value: 'DELAYED',
                count: counts.delayed,
              },
              {
                label: 'Completed',
                value: 'COMPLETED',
                count: counts.completed,
              },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value as any)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
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

          <div className="relative sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search project ID, name, city, customer..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-sans"
            />
          </div>
        </div>

        {/* Projects List Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Shared Project ID / Site</th>
                <th className="py-3 px-3">Homeowner</th>
                <th className="py-3 px-3">Assigned Team</th>
                <th className="py-3 px-3 text-right">Project Budget</th>
                <th className="py-3 px-3 text-center">Progress</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-right">Operational Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Building className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-bold text-slate-600">No construction projects found in this category.</p>
                  </td>
                </tr>
              ) : (
                filteredProjects.map((p) => {
                  const hasTeam = Boolean(p.contractorId && (p.architectId || p.contractorName));
                  const budget = p.contractValuePaise || p.budgetPaise || p.originalContractPaise || 0;
                  const progress = p.overallVerifiedProgress ?? p.progressPercentage ?? p.overallReportedProgress ?? 0;
                  const projectCode = p.id || p.projectCode || p.code || 'BG-2026';
                  const siteCity = p.city || p.siteLocation?.city || '—';

                  const isPendingKickoff =
                    p.status === 'PENDING_ADMIN_REVIEW' ||
                    p.status === 'AGREEMENT_PENDING' ||
                    p.status === 'ADVANCE_PAYMENT_PENDING' ||
                    p.status === 'READY_FOR_KICKOFF' ||
                    p.status === 'AWAITING_KICKOFF';

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4">
                        <div
                          onClick={() => setSelectedProject(p)}
                          className="cursor-pointer group"
                          title="Click to view Section 9 project manifest"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-700 group-hover:bg-blue-100 transition">
                              {projectCode}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">({siteCity})</span>
                          </div>
                          <strong className="text-slate-900 group-hover:text-blue-600 transition-colors block text-xs mt-1">
                            {p.name}
                          </strong>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div
                          onClick={() => setSelectedProject(p)}
                          className="cursor-pointer group"
                          title="Click to view client manifest"
                        >
                          <span className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors block">
                            {p.customerName}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">{p.customerPhone}</span>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        {hasTeam ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1 text-[11px] text-slate-800 font-medium">
                              <HardHat className="w-3 h-3 text-amber-600" />
                              <span>{p.contractorName || 'Contractor Team'}</span>
                            </div>
                            {p.architectName && (
                              <div className="flex items-center gap-1 text-[10px] text-slate-500">
                                <Compass className="w-3 h-3 text-purple-600" />
                                <span>{p.architectName}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded text-[10px] font-bold">
                            Team Pending
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        {formatINR(budget)}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <div className="w-24 mx-auto space-y-1">
                          <div className="flex justify-between text-[10px] font-mono">
                            <span className="text-slate-500">Completed</span>
                            <span className="font-bold text-blue-700">{progress}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-600 rounded-full"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center">
                        {p.status === 'READY_FOR_KICKOFF' ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center justify-center gap-1">
                            <Sparkles className="w-3 h-3 text-emerald-600" />
                            <span>Ready for Kickoff</span>
                          </span>
                        ) : p.status === 'PENDING_ADMIN_REVIEW' || p.status === 'AGREEMENT_PENDING' || p.status === 'ADVANCE_PAYMENT_PENDING' ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            Pending Review
                          </span>
                        ) : p.status === 'ACTIVE' || p.status === 'IN_PROGRESS' ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                            Active Site
                          </span>
                        ) : p.status === 'DELAYED' || p.status === 'ON_HOLD' ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                            {p.status}
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-300">
                            {p.status}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isPendingKickoff && (
                            <button
                              onClick={() => handleApproveKickoff(p)}
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                              title="1-Click Approve Kickoff"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Kickoff</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleOpenTeamModal(p)}
                            className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                            title="Assign Architect & Contractor"
                          >
                            <UserCheck className="w-3 h-3 text-amber-600" />
                            <span>Team</span>
                          </button>

                          <button
                            onClick={() => setSelectedProject(p)}
                            className="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                            title="View Project Manifest & Verification Checklist"
                          >
                            <Eye className="w-3.5 h-3.5 text-sky-600" />
                            <span>Manifest</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: ASSIGN PROJECT TEAM */}
      <AnimatePresence>
        {teamModalProject && (
          <div className="admin-fullscreen-modal fixed inset-0 z-50 overflow-y-auto bg-[#f0f7ff] flex flex-col font-sans animate-in fade-in duration-150">
            <div className="h-[2px] bg-gradient-to-r from-transparent via-amber-400 via-sky-400 to-transparent pointer-events-none shrink-0" />
            <div className="sticky top-0 z-40 bg-navy-950 text-white px-4 sm:px-8 py-3.5 border-b border-navy-900 flex items-center justify-between shadow-xl shrink-0">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <button
                  type="button"
                  onClick={() => setTeamModalProject(null)}
                  className="px-3.5 py-2 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs flex items-center gap-2 border border-slate-700/80 hover:border-slate-500 transition group cursor-pointer shrink-0"
                >
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  <span className="hidden sm:inline">Back / Cancel</span>
                  <span className="sm:hidden">Back</span>
                </button>
                <div className="h-6 w-px bg-slate-700 hidden sm:block shrink-0" />
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-base font-display shrink-0">
                    <Compass className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-base sm:text-lg font-black font-display text-white truncate">
                      Assign Project Execution Team
                    </h2>
                    <div className="text-[11px] text-slate-400 font-mono truncate">
                      Shared Project ID: {teamModalProject.id} • {teamModalProject.name}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setTeamModalProject(null)}
                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  <span className="hidden sm:inline">Close</span>
                </button>
              </div>
            </div>

            <div className="flex-1 max-w-[1000px] w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-blue-200/80 shadow-xl">
                <form onSubmit={handleSaveTeamAssignment} className="space-y-5 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1 flex items-center gap-1.5">
                      <Compass className="w-3.5 h-3.5 text-purple-600" />
                      <span>Project Architect (Drawings &amp; Structural Approvals)</span>
                    </label>
                    <select
                      value={assignedArchitectId}
                      onChange={(e) => setAssignedArchitectId(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold focus:outline-none"
                    >
                      <option value="">-- Choose Architect --</option>
                      {architects.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name} - {a.firmName} ({a.city})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1 flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Interior Designer (Optional)</span>
                    </label>
                    <select
                      value={assignedDesignerId}
                      onChange={(e) => setAssignedDesignerId(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold focus:outline-none"
                    >
                      <option value="">-- Choose Interior Designer --</option>
                      {designers.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} - {d.businessName} ({d.city})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1 flex items-center gap-1.5">
                      <HardHat className="w-3.5 h-3.5 text-amber-600" />
                      <span>Civil / Turnkey Contractor (On-Site Execution) *</span>
                    </label>
                    <select
                      value={assignedContractorId}
                      onChange={(e) => setAssignedContractorId(e.target.value)}
                      required
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold focus:outline-none"
                    >
                      <option value="">-- Choose Contractor --</option>
                      {contractors.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.firmName} ({c.name} - {c.city})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t">
                    <button
                      type="button"
                      onClick={() => setTeamModalProject(null)}
                      className="px-4 py-2 border rounded-xl text-slate-600 font-bold hover:bg-slate-50 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-navy-950 text-gold-400 font-bold rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer hover:bg-navy-900 transition"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Save Assignment</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: SITE DETAILS / PROJECT MANIFEST (SECTION 9 ENHANCED) */}
      <AnimatePresence>
        {selectedProject && (
          <div className="admin-fullscreen-modal fixed inset-0 z-50 overflow-y-auto bg-[#f0f7ff] flex flex-col font-sans animate-in fade-in duration-150">
            <div className="h-[2px] bg-gradient-to-r from-transparent via-amber-400 via-sky-400 to-transparent pointer-events-none shrink-0" />
            <div className="sticky top-0 z-40 bg-navy-950 text-white px-4 sm:px-8 py-3.5 border-b border-navy-900 flex items-center justify-between shadow-xl shrink-0">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <button
                  onClick={() => setSelectedProject(null)}
                  className="px-3.5 py-2 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs flex items-center gap-2 border border-slate-700/80 hover:border-slate-500 transition group cursor-pointer shrink-0"
                >
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  <span className="hidden sm:inline">Back to Projects Directory</span>
                  <span className="sm:hidden">Back</span>
                </button>
                <div className="h-6 w-px bg-slate-700 hidden sm:block shrink-0" />
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center font-bold text-base font-display shrink-0">
                    <Building className="w-5 h-5 text-sky-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="text-base sm:text-lg font-black font-display text-white truncate">
                        {selectedProject.name}
                      </h2>
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        {selectedProject.id}
                      </span>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-sky-500/20 text-sky-300 border-sky-500/40">
                        {selectedProject.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono truncate">
                      Client: {selectedProject.customerName} ({selectedProject.customerPhone}) • Work Order: {selectedProject.workOrderNumber}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <button
                  onClick={() => setSelectedProject(null)}
                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  <span className="hidden sm:inline">Close</span>
                </button>
              </div>
            </div>

            <div className="flex-1 max-w-[1500px] w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-blue-200/80 shadow-xl space-y-6">
                
                {/* SECTION 9: PRE-COMMENCEMENT VERIFICATION CHECKLIST CARD */}
                <div className="bg-gradient-to-br from-slate-50 via-white to-blue-50/40 rounded-2xl p-5 border border-blue-200/90 shadow-2xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 bg-blue-600 text-white rounded-lg">
                          <ShieldCheck className="w-4 h-4" />
                        </span>
                        <h3 className="font-black text-sm font-display text-navy-950">
                          Section 9: Pre-Commencement Verification Checklist
                        </h3>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Master Governance Rule: Project acceptance &amp; project start are separate events. Verify all legal, financial, and site conditions before authorizing active site works.
                      </p>
                    </div>

                    {/* Kickoff CTA Button */}
                    {selectedProject.status !== 'ACTIVE' && selectedProject.status !== 'COMPLETED' && selectedProject.status !== 'IN_PROGRESS' ? (
                      <button
                        type="button"
                        onClick={() => handleApproveKickoff(selectedProject)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg flex items-center gap-2 text-xs transition cursor-pointer shrink-0"
                      >
                        <Sparkles className="w-4 h-4 text-emerald-200" />
                        <span>Approve Project Kickoff &amp; Mark Active</span>
                      </button>
                    ) : selectedProject.status === 'ACTIVE' || selectedProject.status === 'IN_PROGRESS' ? (
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1.5 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0">
                          <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                          <span>Site Kickoff Authorized &amp; Active</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setDelayModalProject(selectedProject);
                            setDelayTargetStatus('DELAYED');
                          }}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <Pause className="w-3.5 h-3.5 text-rose-600" />
                          <span>Flag Delay / Pause</span>
                        </button>
                      </div>
                    ) : selectedProject.status === 'DELAYED' || selectedProject.status === 'ON_HOLD' ? (
                      <button
                        type="button"
                        onClick={() => {
                          setDelayModalProject(selectedProject);
                          setDelayTargetStatus('ACTIVE');
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md flex items-center gap-2 text-xs transition cursor-pointer"
                      >
                        <Play className="w-4 h-4 text-white" />
                        <span>Resume Active Execution</span>
                      </button>
                    ) : null}
                  </div>

                  {/* Checklist Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {/* 1. Formal Agreement */}
                    <div className={`p-3.5 rounded-xl border transition ${selectedProject.kickoff?.contractAgreed ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <FileText className={`w-4 h-4 ${selectedProject.kickoff?.contractAgreed ? 'text-emerald-600' : 'text-slate-400'}`} />
                          <span className="font-bold text-xs">1. Agreement &amp; Work Order</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleChecklistItem(selectedProject, 'contractAgreed', Boolean(selectedProject.kickoff?.contractAgreed))}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition ${selectedProject.kickoff?.contractAgreed ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'}`}
                        >
                          {selectedProject.kickoff?.contractAgreed ? 'Verified' : 'Verify'}
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1.5">
                        {selectedProject.kickoff?.contractAgreed ? 'Formal Work Order agreement executed with homeowner.' : 'Contract agreement awaiting homeowner signoff.'}
                      </p>
                    </div>

                    {/* 2. Advance Mobilization Payment */}
                    <div className={`p-3.5 rounded-xl border transition ${selectedProject.kickoff?.advancePaid ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <DollarSign className={`w-4 h-4 ${selectedProject.kickoff?.advancePaid ? 'text-emerald-600' : 'text-slate-400'}`} />
                          <span className="font-bold text-xs">2. Advance Mobilization</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleChecklistItem(selectedProject, 'advancePaid', Boolean(selectedProject.kickoff?.advancePaid))}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition ${selectedProject.kickoff?.advancePaid ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'}`}
                        >
                          {selectedProject.kickoff?.advancePaid ? 'Paid' : 'Mark Paid'}
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1.5">
                        Advance Required: <strong className="text-slate-900 font-mono">{formatINR(selectedProject.kickoff?.advanceRequiredPaise || Math.round((selectedProject.contractValuePaise || 0) * 0.15))}</strong>
                        {selectedProject.kickoff?.advancePaid ? ' (Escrow cleared)' : ' (Awaiting deposit)'}
                      </p>
                    </div>

                    {/* 3. Site Demarcation & Survey */}
                    <div className={`p-3.5 rounded-xl border transition ${selectedProject.kickoff?.siteDemarcationReady ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <MapPin className={`w-4 h-4 ${selectedProject.kickoff?.siteDemarcationReady ? 'text-emerald-600' : 'text-slate-400'}`} />
                          <span className="font-bold text-xs">3. Boundary Demarcation</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleChecklistItem(selectedProject, 'siteDemarcationReady', Boolean(selectedProject.kickoff?.siteDemarcationReady))}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition ${selectedProject.kickoff?.siteDemarcationReady ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'}`}
                        >
                          {selectedProject.kickoff?.siteDemarcationReady ? 'Ready' : 'Verify'}
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1.5">
                        {selectedProject.kickoff?.siteDemarcationReady ? 'Plot boundary pegs & total station survey confirmed.' : 'Physical site boundary demarcation pending.'}
                      </p>
                    </div>

                    {/* 4. Sanction Drawings & Clearances */}
                    <div className={`p-3.5 rounded-xl border transition ${selectedProject.kickoff?.sanctionReceived ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Layers className={`w-4 h-4 ${selectedProject.kickoff?.sanctionReceived ? 'text-emerald-600' : 'text-slate-400'}`} />
                          <span className="font-bold text-xs">4. Sanction Drawings</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleChecklistItem(selectedProject, 'sanctionReceived', Boolean(selectedProject.kickoff?.sanctionReceived))}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition ${selectedProject.kickoff?.sanctionReceived ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'}`}
                        >
                          {selectedProject.kickoff?.sanctionReceived ? 'Cleared' : 'Verify'}
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1.5">
                        {selectedProject.kickoff?.sanctionReceived ? 'Municipal sanction & structural drawings signed off.' : 'Authority drawings or sanction signoff pending.'}
                      </p>
                    </div>

                    {/* 5. Utility Connections (Water & Power) */}
                    <div className={`p-3.5 rounded-xl border transition ${selectedProject.kickoff?.utilityConnectionReady ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Compass className={`w-4 h-4 ${selectedProject.kickoff?.utilityConnectionReady ? 'text-emerald-600' : 'text-slate-400'}`} />
                          <span className="font-bold text-xs">5. Site Water &amp; Electricity</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleChecklistItem(selectedProject, 'utilityConnectionReady', Boolean(selectedProject.kickoff?.utilityConnectionReady))}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition ${selectedProject.kickoff?.utilityConnectionReady ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'}`}
                        >
                          {selectedProject.kickoff?.utilityConnectionReady ? 'Connected' : 'Verify'}
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1.5">
                        {selectedProject.kickoff?.utilityConnectionReady ? 'Construction water & temporary power source active.' : 'Water / power connections pending activation on site.'}
                      </p>
                    </div>

                    {/* 6. Execution Team Mapping */}
                    <div className={`p-3.5 rounded-xl border transition ${selectedProject.contractorId && selectedProject.architectId ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950' : 'bg-amber-50/60 border-amber-200 text-amber-950'}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <HardHat className={`w-4 h-4 ${selectedProject.contractorId && selectedProject.architectId ? 'text-emerald-600' : 'text-amber-600'}`} />
                          <span className="font-bold text-xs">6. Multi-Disciplinary Team</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const p = selectedProject;
                            setSelectedProject(null);
                            handleOpenTeamModal(p);
                          }}
                          className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-200 hover:bg-amber-300 text-amber-900 cursor-pointer transition"
                        >
                          {selectedProject.contractorId && selectedProject.architectId ? 'Manage Team' : 'Assign Team'}
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1.5">
                        {selectedProject.architectName ? `Arch: ${selectedProject.architectName}` : 'Architect: Pending'}
                        {' • '}
                        {selectedProject.contractorName ? `Contractor: ${selectedProject.contractorName}` : 'Contractor: Pending'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 1. Location & Customer Grid */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Homeowner</p>
                    <p className="font-bold text-slate-900 mt-0.5">{selectedProject.customerName}</p>
                    <p className="text-[11px] text-slate-500 font-mono">{selectedProject.customerPhone}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Site Location</p>
                    <p className="font-bold text-slate-900 mt-0.5">
                      {selectedProject.city || selectedProject.siteLocation?.city || '—'}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {selectedProject.propertyAddress || selectedProject.siteLocation?.addressLine1 || '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Shared Project ID</p>
                    <p className="font-mono font-bold text-blue-700 mt-0.5">{selectedProject.id}</p>
                    <p className="text-[11px] text-slate-500 truncate">{selectedProject.workOrderNumber}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Service Category</p>
                    <p className="font-bold text-slate-900 mt-0.5">{selectedProject.category || 'CONSTRUCTION'}</p>
                    <p className="text-[11px] text-slate-500 truncate">{selectedProject.serviceType || 'Civil Execution'}</p>
                  </div>
                </div>

                {/* 2. Financial Summary Cards */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-sky-50/70 border border-sky-200 rounded-xl">
                    <p className="text-[10px] font-bold text-sky-800 uppercase">Contract Budget</p>
                    <p className="text-base font-black text-navy-950 mt-0.5 font-mono">
                      {formatINR(selectedProject.contractValuePaise || selectedProject.budgetPaise || selectedProject.originalContractPaise || 0)}
                    </p>
                  </div>
                  <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                    <p className="text-[10px] font-bold text-emerald-800 uppercase">Total Paid / Escrow</p>
                    <p className="text-base font-black text-emerald-700 mt-0.5 font-mono">
                      {formatINR(selectedProject.totalPaidPaise || 0)}
                    </p>
                  </div>
                  <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl">
                    <p className="text-[10px] font-bold text-amber-800 uppercase">Amount Due / Pending</p>
                    <p className="text-base font-black text-amber-800 mt-0.5 font-mono">
                      {formatINR(selectedProject.amountDuePaise || selectedProject.amountAwaitingApprovalPaise || 0)}
                    </p>
                  </div>
                </div>

                {/* 3. Assigned Execution Team */}
                <div>
                  <h4 className="font-bold text-slate-800 text-xs mb-2 flex items-center gap-1.5">
                    <HardHat className="w-4 h-4 text-amber-600" />
                    <span>Assigned Multi-Disciplinary Site Team</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl border border-slate-200 bg-white">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                          C
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{selectedProject.contractorName || 'Contractor Pending'}</p>
                          <p className="text-[10px] text-slate-500 font-mono">{selectedProject.contractorFirm || selectedProject.contractorRole || 'Civil Execution Team'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl border border-slate-200 bg-white">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                          A
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{selectedProject.architectName || 'Architect Assigned'}</p>
                          <p className="text-[10px] text-slate-500 font-mono">Design &amp; Structural Review</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Progress & Current Active Stage */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <h4 className="font-bold text-slate-800 text-xs">Work Progress &amp; Verification</h4>
                    <span className="font-mono font-bold text-blue-700">
                      {selectedProject.overallVerifiedProgress ?? selectedProject.progressPercentage ?? 0}% Verified
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden mb-3">
                    <div
                      className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full"
                      style={{
                        width: `${selectedProject.overallVerifiedProgress ?? selectedProject.progressPercentage ?? 0}%`,
                      }}
                    />
                  </div>

                  {selectedProject.currentStage && (
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-slate-700 flex items-center justify-between text-[11px]">
                      <span className="font-semibold">Current Active Stage:</span>
                      <span className="font-bold text-navy-950">{selectedProject.currentStage}</span>
                    </div>
                  )}
                </div>

                {/* 5. Milestones Escrow Schedule */}
                {selectedProject.paymentMilestones && selectedProject.paymentMilestones.length > 0 && (
                  <div>
                    <h4 className="font-bold text-slate-800 text-xs mb-2">Milestone Escrow Schedule</h4>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                      {(selectedProject.paymentMilestones || []).map((m: any, idx: number) => (
                        <div
                          key={idx}
                          className="p-2 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-[11px]"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-mono text-[10px] font-bold flex items-center justify-center">
                              {m.milestoneNumber || idx + 1}
                            </span>
                            <span className="font-semibold text-slate-800">{m.title}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-900">{formatINR(m.amountPaise || 0)}</span>
                            <span
                              className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                m.status === 'PAID'
                                   ? 'bg-emerald-100 text-emerald-800'
                                  : m.status === 'APPROVED'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {m.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Footer */}
                <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const prj = selectedProject;
                        setSelectedProject(null);
                        handleOpenTeamModal(prj);
                      }}
                      className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer text-xs"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-amber-600" />
                      <span>Reassign Team</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setClosureModalProject(selectedProject);
                      }}
                      className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer text-xs"
                    >
                      <Award className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Complete Closure &amp; Handover</span>
                    </button>

                    <a
                      href="/admin/timeline"
                      className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-xl font-bold flex items-center gap-1.5 transition text-xs"
                    >
                      <HardHat className="w-3.5 h-3.5 text-blue-600" />
                      <span>Inspect Milestones</span>
                    </a>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedProject(null)}
                    className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition cursor-pointer text-xs"
                  >
                    Close Manifest
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: FLAG DELAY / SITE HOLD */}
      <AnimatePresence>
        {delayModalProject && (
          <div className="admin-fullscreen-modal fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 font-sans animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 border border-slate-200 shadow-2xl">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <span className="p-2 bg-rose-50 text-rose-700 rounded-xl">
                    <AlertTriangle className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="font-black text-sm font-display text-navy-950">Update Site Operating Status</h3>
                    <p className="text-[11px] text-slate-500 font-mono">Project {delayModalProject.id}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDelayModalProject(null)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveDelayOrHold} className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Target Status</label>
                  <select
                    value={delayTargetStatus}
                    onChange={(e) => setDelayTargetStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold focus:outline-none"
                  >
                    <option value="DELAYED">DELAYED (Site Bottleneck / Material / Weather Delay)</option>
                    <option value="ON_HOLD">ON_HOLD (Work Suspended / Dispute / Permit Pending)</option>
                    <option value="ACTIVE">ACTIVE (Bottleneck Resolved - Resume Site Works)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Detailed Reason &amp; Mitigation Notes *</label>
                  <textarea
                    required
                    rows={3}
                    value={delayReason}
                    onChange={(e) => setDelayReason(e.target.value)}
                    placeholder="Enter reason for status change, audit remarks and timeline impact..."
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-sans"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => setDelayModalProject(null)}
                    className="px-4 py-2 border rounded-xl text-slate-600 font-bold hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-navy-950 text-gold-400 font-bold rounded-xl shadow-md flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Confirm Status Update</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: COMPLETE CLOSURE & HANDOVER */}
      <AnimatePresence>
        {closureModalProject && (
          <div className="admin-fullscreen-modal fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 font-sans animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 border border-slate-200 shadow-2xl">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <span className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
                    <Award className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="font-black text-sm font-display text-navy-950">Project Closure &amp; Handover Signoff</h3>
                    <p className="text-[11px] text-slate-500 font-mono">Project {closureModalProject.id}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setClosureModalProject(null)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveClosure} className="space-y-4 text-xs">
                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-emerald-950 space-y-1">
                  <p className="font-bold">Final Settlement Conditions</p>
                  <p className="text-[11px] text-emerald-800">
                    Marking this project completed will release final escrow disbursements, archive snag records, and start the 1-Year Structural Defect Liability Warranty period.
                  </p>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Handover Summary &amp; Homeowner Remarks</label>
                  <textarea
                    rows={3}
                    value={closureNotes}
                    onChange={(e) => setClosureNotes(e.target.value)}
                    placeholder="Enter final handover summary, possession keys delivered, warranty certificate issued..."
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-sans"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => setClosureModalProject(null)}
                    className="px-4 py-2 border rounded-xl text-slate-600 font-bold hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Authorize Final Handover</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: CREATE PROJECT (Stepper Wizard - Section 9 Enhanced) */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="admin-fullscreen-modal fixed inset-0 z-50 overflow-y-auto bg-[#f0f7ff] flex flex-col font-sans animate-in fade-in duration-150">
            <div className="h-[2px] bg-gradient-to-r from-transparent via-blue-400 via-sky-400 to-transparent pointer-events-none shrink-0" />
            <div className="sticky top-0 z-40 bg-navy-950 text-white px-4 sm:px-8 py-3.5 border-b border-navy-900 flex items-center justify-between shadow-xl shrink-0">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setProjectStep(1);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs flex items-center gap-2 border border-slate-700/80 hover:border-slate-500 transition group cursor-pointer shrink-0"
                >
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  <span className="hidden sm:inline">Back / Cancel</span>
                  <span className="sm:hidden">Back</span>
                </button>
                <div className="h-6 w-px bg-slate-700 hidden sm:block shrink-0" />
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-base font-display shrink-0">
                    <Building className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-base sm:text-lg font-black font-display text-white truncate">
                      Create Centralized Project
                    </h2>
                    <div className="text-[11px] text-slate-400 font-mono truncate">
                      Shared Project ID Standard: BG-2026-XXXX • Step {projectStep} of 3
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setProjectStep(1);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  <span className="hidden sm:inline">Close</span>
                </button>
              </div>
            </div>

            <div className="flex-1 max-w-[1100px] w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
              {/* Stepper Header */}
              <div className="bg-white rounded-2xl p-4 sm:p-6 border border-blue-200/80 shadow-sm">
                <div className="flex items-center justify-between max-w-xl mx-auto">
                  {[
                    { step: 1, title: 'Project Typology', icon: Building },
                    { step: 2, title: 'Client & Location', icon: MapPin },
                    { step: 3, title: 'Budget & Launch', icon: DollarSign },
                  ].map((item, idx, arr) => (
                    <div key={item.step} className="flex items-center flex-1 last:flex-none">
                      <button
                        type="button"
                        onClick={() => {
                          if (item.step < projectStep) setProjectStep(item.step);
                        }}
                        className="flex flex-col items-center gap-1 group text-center cursor-pointer"
                      >
                        <div
                          className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xs transition ${
                            projectStep === item.step
                              ? 'bg-blue-600 text-white shadow-md ring-4 ring-blue-100'
                              : projectStep > item.step
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'bg-slate-100 text-slate-400 border border-slate-200'
                          }`}
                        >
                          {projectStep > item.step ? (
                            <Check className="w-5 h-5 text-white" />
                          ) : (
                            <item.icon className="w-5 h-5" />
                          )}
                        </div>
                        <span
                          className={`text-[11px] font-bold mt-1 transition ${
                            projectStep === item.step
                              ? 'text-blue-900'
                              : projectStep > item.step
                              ? 'text-emerald-700'
                              : 'text-slate-400'
                          }`}
                        >
                          {item.title}
                        </span>
                      </button>
                      {idx < arr.length - 1 && (
                        <div
                          className={`flex-1 h-0.5 mx-3 mb-5 transition ${
                            projectStep > item.step ? 'bg-emerald-500' : 'bg-slate-200'
                          }`}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Stepper Card */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-blue-200/80 shadow-xl">
                <form onSubmit={handleCreateProjectSubmit}>
                  {/* STEP 1: TYPOLOGY */}
                  {projectStep === 1 && (
                    <div className="space-y-6 animate-in fade-in duration-150">
                      <div className="border-b border-slate-100 pb-4">
                        <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
                          <span>Step 1 of 3</span>
                        </div>
                        <h3 className="text-xl font-bold text-navy-950 font-display">
                          Project Name &amp; Construction Typology
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Define project title, site identification, and building classification.
                        </p>
                      </div>

                      <div className="space-y-4 text-xs">
                        <div className="space-y-1.5">
                          <label className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                            <Building className="w-4 h-4 text-blue-600" />
                            <span>Official Project Title</span>
                            <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. 4BHK Luxury Villa at Sushant Lok"
                            value={projectName}
                            onChange={(e) => setProjectName(e.target.value)}
                            className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl font-bold text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="font-bold text-slate-800 text-sm block">
                            Building Typology <span className="text-rose-500">*</span>
                          </label>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {[
                              { type: 'VILLA', label: 'Bespoke Villa', desc: 'Independent Luxury Residence' },
                              { type: 'FLOOR', label: 'Builder Floor', desc: 'Stilt + 4 Floors' },
                              { type: 'RENOVATION', label: 'Home Renovation', desc: 'Structural Modernization' },
                              { type: 'INTERIOR', label: 'Turnkey Interior', desc: 'Complete Spatial Fitout' },
                            ].map((t) => (
                              <button
                                key={t.type}
                                type="button"
                                onClick={() => setProjectType(t.type as any)}
                                className={`p-4 rounded-2xl border text-left transition ${
                                  projectType === t.type
                                    ? 'bg-blue-50/80 border-blue-500 ring-2 ring-blue-200'
                                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                <span className="font-bold text-navy-950 text-xs block">{t.label}</span>
                                <span className="text-[10px] text-slate-500 mt-1 block">{t.desc}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STEP 2: CLIENT & LOCATION */}
                  {projectStep === 2 && (
                    <div className="space-y-6 animate-in fade-in duration-150">
                      <div className="border-b border-slate-100 pb-4">
                        <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
                          <span>Step 2 of 3</span>
                        </div>
                        <h3 className="text-xl font-bold text-navy-950 font-display">
                          Homeowner Client &amp; Project Site Location
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Specify client contact and geographical site city for logistical matching.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div className="space-y-1.5">
                          <label className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                            <Building className="w-4 h-4 text-blue-600" />
                            <span>Homeowner Full Name</span>
                            <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Ramesh Kumar Sharma"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                            <Building className="w-4 h-4 text-blue-600" />
                            <span>Client Mobile Number</span>
                            <span className="text-rose-500">*</span>
                          </label>
                          <div className="relative">
                            <span className="absolute left-4 top-3.5 text-slate-400 font-bold text-xs">+91</span>
                            <input
                              type="tel"
                              required
                              maxLength={10}
                              placeholder="10-digit mobile"
                              value={customerPhone}
                              onChange={(e) => setCustomerPhone(e.target.value)}
                              className="w-full pl-14 pr-4 py-3.5 bg-slate-50 border border-slate-300 rounded-2xl font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5 sm:col-span-2">
                          <label className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                            <MapPin className="w-4 h-4 text-blue-600" />
                            <span>Site City / District</span>
                            <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Gurugram, Delhi NCR"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STEP 3: BUDGET & LAUNCH */}
                  {projectStep === 3 && (
                    <div className="space-y-6 animate-in fade-in duration-150">
                      <div className="border-b border-slate-100 pb-4">
                        <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
                          <span>Step 3 of 3</span>
                        </div>
                        <h3 className="text-xl font-bold text-navy-950 font-display">
                          Total Project Budget &amp; Shared ID Initialization
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Set approved construction valuation. GharDesign will assign a Shared Project ID (<strong className="text-blue-700 font-mono">BG-2026-XXXX</strong>) and auto-generate physical stage gates &amp; escrow milestones.
                        </p>
                      </div>

                      <div className="space-y-4 text-xs">
                        <div className="space-y-1.5">
                          <label className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                            <DollarSign className="w-4 h-4 text-blue-600" />
                            <span>Estimated Construction Budget (₹)</span>
                            <span className="text-rose-500">*</span>
                          </label>
                          <div className="relative">
                            <span className="absolute left-4 top-3 text-slate-400 font-bold text-base">₹</span>
                            <input
                              type="number"
                              min={100000}
                              step={50000}
                              placeholder="e.g. 8500000"
                              value={budgetRupees}
                              onChange={(e) => setBudgetRupees(e.target.value === '' ? '' : Number(e.target.value))}
                              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl font-mono text-base font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                            />
                          </div>
                          <p className="text-xs text-blue-800 font-semibold mt-1">
                            Formatted: {formatINR(Number(budgetRupees || 0) * 100)}
                          </p>
                        </div>

                        {/* Project Manifest Preview */}
                        <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase">Project Title</span>
                            <p className="text-sm font-bold text-navy-950 mt-0.5">{projectName || 'Not Entered'}</p>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase">Building Typology</span>
                            <p className="text-sm font-bold text-blue-900 mt-0.5">{projectType}</p>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase">Client Contact</span>
                            <p className="text-xs font-bold text-slate-800 mt-0.5">{customerName} (+91 {customerPhone})</p>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase">Site City</span>
                            <p className="text-xs font-semibold text-slate-700 mt-0.5">{city}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Navigation Footer */}
                  <div className="flex items-center justify-between gap-3 pt-6 border-t border-slate-200 mt-6">
                    {projectStep > 1 ? (
                      <button
                        type="button"
                        onClick={() => setProjectStep(projectStep - 1)}
                        className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 transition flex items-center gap-2 text-xs cursor-pointer"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Previous Step</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowCreateModal(false)}
                        className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-600 font-bold hover:bg-slate-100 transition text-xs cursor-pointer"
                      >
                        Cancel
                      </button>
                    )}

                    <div className="text-xs text-slate-400 font-mono hidden sm:block">
                      Step {projectStep} of 3
                    </div>

                    {projectStep < 3 ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (projectStep === 1) {
                            if (!projectName.trim()) {
                              error('Please enter the project name');
                              return;
                            }
                          } else if (projectStep === 2) {
                            if (!customerName.trim()) {
                              error('Please enter the customer name');
                              return;
                            }
                            const clean = customerPhone.replace(/\D/g, '').slice(-10);
                            if (clean.length !== 10) {
                              error('Please enter a valid 10-digit mobile number');
                              return;
                            }
                          }
                          setProjectStep(projectStep + 1);
                        }}
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md flex items-center gap-2 text-xs transition cursor-pointer"
                      >
                        <span>Proceed to Step {projectStep + 1}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        type="submit"
                        className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md flex items-center gap-2 text-xs transition cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        <span>Initialize &amp; Launch Project</span>
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
