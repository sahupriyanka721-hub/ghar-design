import React, { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
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
  Sliders,
  ChevronDown,
  History,
  FolderGit2,
  Upload,
  Download,
  Share2,
  RotateCcw,
  Zap,
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
  ProjectDocumentItem,
  ProjectStatus,
} from '../../data/projectExecutionStore.js';
import { registerNewCustomer } from '../../data/customerStore.js';
import { pushToCloud } from '../../data/cloudSync.js';
import { getRegisteredArchitects } from '../../data/architectStore.js';
import { getRegisteredInteriorDesigners } from '../../data/interiorDesignerStore.js';
import { getPlatformContractors } from '../../data/adminStore.js';
import { logAdminAuditAction } from '../../data/adminRbacStore.js';

// ============================================================================
// SUB-VIEWS DEFINITION (Module 7: Project Management)
// ============================================================================
export const SUB_VIEWS = [
  { key: 'ALL', label: 'All Projects', desc: 'Central master directory of all construction projects' },
  { key: 'NEW', label: 'New Projects', desc: 'Newly registered projects awaiting onboarding review' },
  { key: 'KICKOFF', label: 'Project Kickoff', desc: '5-Point pre-commencement clearance & site authorization' },
  { key: 'ACTIVE', label: 'Active Projects', desc: 'Projects under active physical site execution' },
  { key: 'ON_HOLD', label: 'On-Hold Projects', desc: 'Sites temporarily paused with logged hold reasons' },
  { key: 'DELAYED', label: 'Delayed Projects', desc: 'Sites behind planned SLA schedule requiring intervention' },
  { key: 'COMPLETED', label: 'Completed Projects', desc: 'Handed-over buildings with signed warranties' },
  { key: 'CANCELLED', label: 'Cancelled Projects', desc: 'Terminated or disputed contracts with closure logs' },
  { key: 'DOCUMENTS', label: 'Project Documents', desc: 'Blueprints, 3D renders, structural calculations & BOQs' },
  { key: 'TIMELINE', label: 'Project Activity Timeline', desc: 'Chronological event stream across all construction sites' },
];

export const AdminProjects: React.FC = () => {
  const { success, error } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlView = searchParams.get('view') || 'ALL';

  const [selectedView, setSelectedView] = useState<string>(urlView);
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

  // Add Document Modal
  const [showAddDocModal, setShowAddDocModal] = useState(false);
  const [docProjectId, setDocProjectId] = useState('');
  const [docTitle, setDocTitle] = useState('');
  const [docCategory, setDocCategory] = useState<ProjectDocumentItem['category']>('DRAWING_2D');
  const [docVersion, setDocVersion] = useState('v1.0');
  const [docFileUrl, setDocFileUrl] = useState('#');

  // Document Category Filter
  const [docCategoryFilter, setDocCategoryFilter] = useState('ALL');

  useEffect(() => {
    if (urlView && urlView !== selectedView) {
      setSelectedView(urlView);
    }
  }, [urlView]);

  const handleSelectView = (viewKey: string) => {
    setSelectedView(viewKey);
    setSearchParams({ view: viewKey });
  };

  const projects = useMemo(() => getExecutionProjects(), [refreshKey]);
  const architects = useMemo(() => getRegisteredArchitects(), [refreshKey]);
  const designers = useMemo(() => getRegisteredInteriorDesigners(), [refreshKey]);
  const contractors = useMemo(() => getPlatformContractors(), [refreshKey]);

  // Master Filter Counts for the 10 Views
  const counts = useMemo(() => {
    const all = projects.length;
    const newPrjs = projects.filter(
      (p) =>
        p.status === 'PENDING_ADMIN_REVIEW' ||
        p.status === 'AGREEMENT_PENDING' ||
        p.status === 'ADVANCE_PAYMENT_PENDING' ||
        p.status === 'AWAITING_KICKOFF' ||
        p.status === 'START_REQUESTED' ||
        p.status === 'AWAITING_TEAM'
    ).length;
    const kickoff = projects.filter((p) => p.status === 'READY_FOR_KICKOFF' || p.status === 'AWAITING_KICKOFF').length;
    const active = projects.filter(
      (p) => p.status === 'ACTIVE' || p.status === 'IN_PROGRESS' || p.status === 'SCHEDULED'
    ).length;
    const onHold = projects.filter((p) => p.status === 'ON_HOLD' || p.status === 'WORK_PAUSED').length;
    const delayed = projects.filter((p) => p.status === 'DELAYED').length;
    const completed = projects.filter((p) => p.status === 'COMPLETED' || p.status === 'HANDED_OVER').length;
    const cancelled = projects.filter((p) => p.status === 'CANCELLED' || p.status === 'DISPUTED').length;

    // Total documents across all projects
    const totalDocs = projects.reduce((acc, p) => acc + (p.documents?.length || 0), 0);
    // Total timeline items across all projects
    const totalTimeline = projects.reduce(
      (acc, p) => acc + (p.dailyReports?.length || 0) + (p.stages?.filter((s) => s.status === 'COMPLETED').length || 0) + 1,
      0
    );

    return { all, newPrjs, kickoff, active, onHold, delayed, completed, cancelled, totalDocs, totalTimeline };
  }, [projects]);

  // Filtered Projects for Current View
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

      if (selectedView === 'NEW') {
        return (
          p.status === 'PENDING_ADMIN_REVIEW' ||
          p.status === 'AGREEMENT_PENDING' ||
          p.status === 'ADVANCE_PAYMENT_PENDING' ||
          p.status === 'AWAITING_KICKOFF' ||
          p.status === 'START_REQUESTED' ||
          p.status === 'AWAITING_TEAM'
        );
      }
      if (selectedView === 'KICKOFF') {
        return p.status === 'READY_FOR_KICKOFF' || p.status === 'AWAITING_KICKOFF' || p.status === 'START_REQUESTED';
      }
      if (selectedView === 'ACTIVE') {
        return p.status === 'ACTIVE' || p.status === 'IN_PROGRESS' || p.status === 'SCHEDULED';
      }
      if (selectedView === 'ON_HOLD') {
        return p.status === 'ON_HOLD' || p.status === 'WORK_PAUSED';
      }
      if (selectedView === 'DELAYED') {
        return p.status === 'DELAYED';
      }
      if (selectedView === 'COMPLETED') {
        return p.status === 'COMPLETED' || p.status === 'HANDED_OVER';
      }
      if (selectedView === 'CANCELLED') {
        return p.status === 'CANCELLED' || p.status === 'DISPUTED';
      }

      return true;
    });
  }, [projects, search, selectedView]);

  // Aggregate All Project Documents
  const allProjectDocuments = useMemo(() => {
    const docs: Array<ProjectDocumentItem & { project: ExecutionProject }> = [];
    projects.forEach((p) => {
      (p.documents || []).forEach((d) => {
        docs.push({ ...d, project: p });
      });
    });

    if (docCategoryFilter !== 'ALL') {
      return docs.filter((d) => d.category === docCategoryFilter);
    }
    if (!search.trim()) return docs;
    const term = search.toLowerCase();
    return docs.filter((d) => {
      return (
        d.title.toLowerCase().includes(term) ||
        d.project.name.toLowerCase().includes(term) ||
        d.project.id.toLowerCase().includes(term) ||
        d.category.toLowerCase().includes(term)
      );
    });
  }, [projects, docCategoryFilter, search]);

  // Aggregate All Project Activity Timeline Events
  const allActivityTimeline = useMemo(() => {
    const events: Array<{
      id: string;
      timestamp: string;
      type: 'CREATION' | 'KICKOFF' | 'STAGE_UPDATE' | 'HOLD_OR_DELAY' | 'COMPLETION';
      title: string;
      description: string;
      project: ExecutionProject;
    }> = [];

    projects.forEach((p) => {
      // 1. Creation event
      events.push({
        id: `ev-create-${p.id}`,
        timestamp: p.createdAt || p.plannedStartDate || new Date().toISOString(),
        type: 'CREATION',
        title: `Project Initialized: ${p.name}`,
        description: `Shared Project ID standard ${p.id} allocated for client ${p.customerName} in ${p.city}.`,
        project: p,
      });

      // 2. Kickoff event
      if (p.kickoff?.confirmedAt || p.status === 'ACTIVE' || p.status === 'IN_PROGRESS') {
        events.push({
          id: `ev-kickoff-${p.id}`,
          timestamp: p.kickoff?.confirmedAt || p.actualStartDate || p.plannedStartDate || new Date().toISOString(),
          type: 'KICKOFF',
          title: `Site Kickoff Authorized: ${p.name}`,
          description: `All pre-commencement checklist verifications cleared. Physical work commenced.`,
          project: p,
        });
      }

      // 3. Stage completions
      (p.stages || []).forEach((stg) => {
        if (stg.status === 'COMPLETED' || stg.status === 'IN_PROGRESS') {
          events.push({
            id: `ev-stage-${p.id}-${stg.id}`,
            timestamp: stg.actualStartDate || stg.plannedStartDate || new Date().toISOString(),
            type: 'STAGE_UPDATE',
            title: `Stage ${stg.stageNumber}: ${stg.name} (${stg.status})`,
            description: `${stg.category} stage progress: ${stg.verifiedProgress}% verified quality completion.`,
            project: p,
          });
        }
      });

      // 4. On-Hold / Delay flags
      if (p.status === 'ON_HOLD' || p.status === 'WORK_PAUSED' || p.status === 'DELAYED') {
        events.push({
          id: `ev-hold-${p.id}`,
          timestamp: p.updatedAt || new Date().toISOString(),
          type: 'HOLD_OR_DELAY',
          title: `Project Status: ${p.status.replace(/_/g, ' ')}`,
          description: p.kickoff?.pauseReason || 'Operational pause or timeline variation flagged by administrator.',
          project: p,
        });
      }

      // 5. Completion
      if (p.status === 'COMPLETED' || p.status === 'HANDED_OVER') {
        events.push({
          id: `ev-complete-${p.id}`,
          timestamp: p.actualEndDate || p.updatedAt || new Date().toISOString(),
          type: 'COMPLETION',
          title: `Final Handover Completed: ${p.name}`,
          description: `100% verified progress reached. Possession and warranty signoff recorded.`,
          project: p,
        });
      }
    });

    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    if (!search.trim()) return events;
    const term = search.toLowerCase();
    return events.filter(
      (e) =>
        e.title.toLowerCase().includes(term) ||
        e.description.toLowerCase().includes(term) ||
        e.project.name.toLowerCase().includes(term) ||
        e.project.id.toLowerCase().includes(term)
    );
  }, [projects, search]);

  // ---------------- ACTION HANDLERS ----------------
  // 1-Click Kickoff Approval
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

  // Toggle Verification Checklist Item
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

  // Resume Work (Unpause On-Hold project)
  const handleResumeProject = (project: ExecutionProject) => {
    const updated = flagProjectDelayOrHold(project.id, 'ACTIVE', 'Resumed by administrator');
    if (updated) {
      logAdminAuditAction({
        action: 'RESUME_PROJECT',
        module: 'PROJECT_MANAGEMENT',
        entity: `Project #${updated.id} (${updated.name})`,
        details: `Resumed active site works for ${updated.name}.`,
      });
      pushToCloud().catch(() => {});
      success(`Project ${updated.id} is now ACTIVE! Site works resumed.`);
      setRefreshKey((k) => k + 1);
    }
  };

  // Reopen Cancelled project
  const handleReopenProject = (project: ExecutionProject) => {
    const updated = flagProjectDelayOrHold(project.id, 'ACTIVE', 'Reopened by administrator');
    if (updated) {
      logAdminAuditAction({
        action: 'REOPEN_PROJECT',
        module: 'PROJECT_MANAGEMENT',
        entity: `Project #${updated.id} (${updated.name})`,
        details: `Reopened project ${updated.name} back to ACTIVE.`,
      });
      pushToCloud().catch(() => {});
      success(`Project ${updated.id} reopened and marked ACTIVE!`);
      setRefreshKey((k) => k + 1);
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

  // Add Document to Project Handler
  const handleAddDocumentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docProjectId || !docTitle.trim()) {
      error('Please select a project and enter document title');
      return;
    }

    const prj = projects.find((p) => p.id === docProjectId);
    if (!prj) {
      error('Project not found');
      return;
    }

    const newDoc: ProjectDocumentItem = {
      id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: docTitle.trim(),
      category: docCategory,
      version: docVersion.trim() || 'v1.0',
      fileUrl: docFileUrl.trim() || '#',
      fileSize: '2.4 MB',
      uploadedAt: new Date().toISOString(),
      uploadedBy: 'Central Project Governance Desk',
      approvalStatus: 'APPROVED',
      approvalNotes: 'Verified and archived by platform administrator.',
    };

    const updatedDocs = [newDoc, ...(prj.documents || [])];
    const updatedPrj: ExecutionProject = {
      ...prj,
      documents: updatedDocs,
      updatedAt: new Date().toISOString(),
    };

    saveExecutionProject(updatedPrj);
    pushToCloud().catch(() => {});
    logAdminAuditAction({
      action: 'UPLOAD_PROJECT_DOCUMENT',
      module: 'PROJECT_MANAGEMENT',
      entity: `Project #${prj.id}`,
      details: `Attached document ${newDoc.title} (${newDoc.category}) to ${prj.name}.`,
    });

    success(`Document "${newDoc.title}" attached to Project ${prj.id}!`);
    setShowAddDocModal(false);
    setDocTitle('');
    setDocVersion('v1.0');
    setRefreshKey((k) => k + 1);
  };

  // Centralized Project Creation
  const handleCreateProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim() || !customerName.trim() || !customerPhone.trim()) {
      error('Please provide project name and customer details');
      return;
    }

    const totalContractPaise = Number(budgetRupees || 0) * 100;
    const stages = createDefaultExecutionStages();
    const paymentMilestones = createDefaultPaymentMilestones(totalContractPaise);

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
      totalPaidPaise: Math.round(totalContractPaise * 0.1),
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
        advanceRequiredPaise: Math.round(totalContractPaise * 0.1),
        advancePaid: false,
        advancePaidPaise: 0,
        siteDemarcationReady: false,
        sanctionReceived: false,
        utilityConnectionReady: false,
        contractAgreed: false,
        specialInstructions: 'Verify municipal zoning setbacks and water borewell connection.',
      },
      stages,
      dailyReports: [],
      paymentMilestones,
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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveExecutionProject(newPrj);

    registerNewCustomer({
      name: customerName,
      phone: customerPhone,
      email: `${customerName.toLowerCase().replace(/\s+/g, '')}@buildghar.com`,
      housePlotNumber: 'Site Plot',
      streetLocality: 'Project Site',
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
    <div className="space-y-6 max-w-[1600px] mx-auto pb-16 font-sans">
      {/* ---------------- 1. EXECUTIVE HEADER BANNER ---------------- */}
      <div className="bg-gradient-to-r from-navy-950 via-[#0e2a4f] to-[#163b6b] text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-navy-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-400/15 border border-blue-400/30 rounded-full text-blue-300 font-mono text-[11px] font-bold uppercase tracking-wider">
              <FolderGit2 className="w-3.5 h-3.5 text-blue-400" />
              <span>Central Project Management Desk (Module 7)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-white flex items-center gap-3">
              <span>Turnkey Construction &amp; Site Management</span>
              <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 font-bold uppercase">
                Shared ID BG-2026-XXXX
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Complete oversight of residential villas, builder floors, and turnkey interior fitouts. Enforce 5-point
              kickoff clearance, monitor active stages, archive blueprints &amp; BOQs, and verify completion signoffs.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                setShowCreateModal(true);
                setProjectStep(1);
              }}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md text-xs flex items-center gap-2 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Initialize Project</span>
            </button>
            <button
              onClick={() => {
                setDocProjectId(projects[0]?.id || '');
                setShowAddDocModal(true);
              }}
              className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Document</span>
            </button>
          </div>
        </div>
      </div>

      {/* ---------------- 2. TOP VIEW SWITCHER DROPDOWN & 10-PILL ACTION STRIP ---------------- */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Select Project Management View:
            </span>
          </div>

          {/* Feature Dropdown Selector */}
          <div className="relative w-full sm:w-96">
            <select
              value={selectedView}
              onChange={(e) => handleSelectView(e.target.value)}
              className="w-full appearance-none px-3.5 py-2.5 bg-slate-50 border border-slate-300 hover:border-blue-500 text-slate-900 font-bold text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer pr-10"
            >
              <option value="ALL">1. All Projects ({counts.all} Master List)</option>
              <option value="NEW">2. New Projects ({counts.newPrjs} Awaiting Onboarding)</option>
              <option value="KICKOFF">3. Project Kickoff ({counts.kickoff} Ready for Clearance)</option>
              <option value="ACTIVE">4. Active Projects ({counts.active} Under Construction)</option>
              <option value="ON_HOLD">5. On-Hold Projects ({counts.onHold} Paused Sites)</option>
              <option value="DELAYED">6. Delayed Projects ({counts.delayed} Schedule Slippage)</option>
              <option value="COMPLETED">7. Completed Projects ({counts.completed} Handed Over)</option>
              <option value="CANCELLED">8. Cancelled Projects ({counts.cancelled} Closed / Disputed)</option>
              <option value="DOCUMENTS">9. Project Documents ({counts.totalDocs} Vault Files)</option>
              <option value="TIMELINE">10. Project Activity Timeline ({counts.totalTimeline} Events)</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-3 pointer-events-none" />
          </div>
        </div>

        {/* 10-Pill Action Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 pt-2 border-t border-slate-100">
          {SUB_VIEWS.map((sv) => {
            const isActive = selectedView === sv.key;
            let badge = '';
            if (sv.key === 'ALL') badge = `${counts.all}`;
            if (sv.key === 'NEW') badge = `${counts.newPrjs}`;
            if (sv.key === 'KICKOFF') badge = `${counts.kickoff}`;
            if (sv.key === 'ACTIVE') badge = `${counts.active}`;
            if (sv.key === 'ON_HOLD') badge = `${counts.onHold}`;
            if (sv.key === 'DELAYED') badge = `${counts.delayed}`;
            if (sv.key === 'COMPLETED') badge = `${counts.completed}`;
            if (sv.key === 'CANCELLED') badge = `${counts.cancelled}`;
            if (sv.key === 'DOCUMENTS') badge = `${counts.totalDocs}`;
            if (sv.key === 'TIMELINE') badge = `${counts.totalTimeline}`;

            return (
              <button
                key={sv.key}
                type="button"
                onClick={() => handleSelectView(sv.key)}
                className={`p-2.5 rounded-2xl text-left border transition cursor-pointer flex flex-col justify-between gap-1 ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-700 to-navy-950 text-white border-blue-700 shadow-md font-bold'
                    : 'bg-slate-50/70 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-[11px] font-bold truncate leading-tight">{sv.label}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800'
                    }`}
                  >
                    {badge}
                  </span>
                </div>
                <span
                  className={`text-[9px] truncate block ${
                    isActive ? 'text-blue-200' : 'text-slate-400'
                  }`}
                >
                  {sv.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ---------------- 3. EXECUTIVE KPI CARDS ---------------- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-blue-200/90 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block">
            Active Construction Sites
          </span>
          <div className="text-3xl font-black font-display text-navy-950">{counts.active}</div>
          <span className="text-[11px] text-blue-700 font-semibold flex items-center gap-1">
            <HardHat className="w-3.5 h-3.5 text-amber-600" />
            <span>Under site execution</span>
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-200/90 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
            Ready for Kickoff
          </span>
          <div className="text-3xl font-black font-display text-emerald-950">{counts.kickoff}</div>
          <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Checklist awaiting clearance</span>
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-200/90 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">
            Delayed or On Hold
          </span>
          <div className="text-3xl font-black font-display text-amber-900">{counts.onHold + counts.delayed}</div>
          <span className="text-[11px] text-amber-800 font-semibold flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>Requires administrative action</span>
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-purple-200/90 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 block">
            Completed &amp; Handed Over
          </span>
          <div className="text-3xl font-black font-display text-purple-950">{counts.completed}</div>
          <span className="text-[11px] text-purple-700 font-semibold flex items-center gap-1">
            <Award className="w-3.5 h-3.5 text-purple-600" />
            <span>100% verified signoff</span>
          </span>
        </div>
      </div>

      {/* ============================================================================
          VIEWS 1 - 8: PROJECT TABLE VIEWS (ALL, NEW, KICKOFF, ACTIVE, ON_HOLD, DELAYED, COMPLETED, CANCELLED)
      ============================================================================ */}
      {selectedView !== 'DOCUMENTS' && selectedView !== 'TIMELINE' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
          <div className="p-5 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-700 border border-blue-100">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-navy-950">
                  {SUB_VIEWS.find((s) => s.key === selectedView)?.label || 'Project Desk'}
                </h3>
                <p className="text-xs text-slate-500">
                  {SUB_VIEWS.find((s) => s.key === selectedView)?.desc}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search ID, name, customer, city..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100 text-slate-600 uppercase tracking-wider text-[10px] font-bold">
                <tr>
                  <th className="py-3 px-4">Shared Project ID &amp; Title</th>
                  <th className="py-3 px-3">Homeowner &amp; City</th>
                  <th className="py-3 px-3">Assigned Team</th>
                  <th className="py-3 px-3 text-right">Project Budget</th>
                  <th className="py-3 px-3 text-center">Progress</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProjects.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No construction projects match your active view ({selectedView}).
                    </td>
                  </tr>
                ) : (
                  filteredProjects.map((p) => {
                    const hasTeam = Boolean(p.contractorId && (p.architectId || p.contractorName));
                    const budget = p.contractValuePaise || p.budgetPaise || p.originalContractPaise || 0;
                    const progress = p.overallVerifiedProgress ?? p.progressPercentage ?? p.overallReportedProgress ?? 0;
                    const projectCode = p.id || p.projectCode || p.code || 'BG-2026';
                    const siteCity = p.city || p.siteLocation?.city || '—';

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3.5 px-4">
                          <button
                            type="button"
                            onClick={() => setSelectedProject(p)}
                            className="text-left group cursor-pointer"
                          >
                            <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-700 group-hover:bg-blue-100 transition inline-block">
                              {projectCode}
                            </span>
                            <strong className="text-slate-900 group-hover:text-blue-600 transition block text-xs mt-1">
                              {p.name}
                            </strong>
                          </button>
                        </td>

                        <td className="py-3.5 px-3">
                          <strong className="text-slate-900 block">{p.customerName}</strong>
                          <span className="text-[11px] text-slate-500">
                            {siteCity} • {p.customerPhone}
                          </span>
                        </td>

                        <td className="py-3.5 px-3">
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
                            <button
                              type="button"
                              onClick={() => handleOpenTeamModal(p)}
                              className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded text-[10px] font-bold hover:bg-amber-100 cursor-pointer"
                            >
                              + Assign Team
                            </button>
                          )}
                        </td>

                        <td className="py-3.5 px-3 text-right font-mono font-bold text-navy-950">
                          {formatINR(budget)}
                        </td>

                        <td className="py-3.5 px-3 text-center">
                          <div className="w-24 mx-auto space-y-1">
                            <div className="flex justify-between text-[10px] font-mono">
                              <span className="text-slate-500">Done</span>
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

                        <td className="py-3.5 px-3 text-center">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              p.status === 'READY_FOR_KICKOFF'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : p.status === 'ACTIVE' || p.status === 'IN_PROGRESS'
                                ? 'bg-blue-100 text-blue-800'
                                : p.status === 'ON_HOLD' || p.status === 'WORK_PAUSED'
                                ? 'bg-amber-100 text-amber-800'
                                : p.status === 'DELAYED'
                                ? 'bg-rose-100 text-rose-800'
                                : p.status === 'COMPLETED' || p.status === 'HANDED_OVER'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-slate-100 text-slate-800'
                            }`}
                          >
                            {p.status.replace(/_/g, ' ')}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right space-x-1.5">
                          {/* Inspect Manifest */}
                          <button
                            type="button"
                            onClick={() => setSelectedProject(p)}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs inline-flex items-center gap-1 transition cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Manifest</span>
                          </button>

                          {/* Kickoff specific actions */}
                          {(selectedView === 'KICKOFF' || p.status === 'READY_FOR_KICKOFF') && (
                            <button
                              type="button"
                              onClick={() => handleApproveKickoff(p)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center gap-1 transition cursor-pointer shadow-xs"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
                              <span>Authorize Kickoff</span>
                            </button>
                          )}

                          {/* On-Hold action: Resume */}
                          {(p.status === 'ON_HOLD' || p.status === 'WORK_PAUSED') && (
                            <button
                              type="button"
                              onClick={() => handleResumeProject(p)}
                              className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center gap-1 transition cursor-pointer"
                            >
                              <Play className="w-3.5 h-3.5" />
                              <span>Resume</span>
                            </button>
                          )}

                          {/* Cancelled action: Reopen */}
                          {p.status === 'CANCELLED' && (
                            <button
                              type="button"
                              onClick={() => handleReopenProject(p)}
                              className="px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs inline-flex items-center gap-1 transition cursor-pointer"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Reopen</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================================
          VIEW 9: PROJECT DOCUMENTS VAULT
      ============================================================================ */}
      {selectedView === 'DOCUMENTS' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
          <div className="p-5 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-700 border border-indigo-100">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-navy-950">9. Project Document &amp; Blueprint Vault</h3>
                <p className="text-xs text-slate-500">
                  Centralized technical archive: 2D blueprints, 3D elevations, structural calculations, BOQs &amp; contracts
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Category Filter */}
              <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-xl text-xs font-bold">
                {['ALL', 'DRAWING_2D', 'ELEVATION_3D', 'STRUCTURAL_RCC', 'CONTRACT', 'BOQ'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setDocCategoryFilter(cat)}
                    className={`px-3 py-1 rounded-lg transition cursor-pointer text-[11px] ${
                      docCategoryFilter === cat ? 'bg-white text-navy-950 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    {cat.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-60">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search document title, ID..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  setDocProjectId(projects[0]?.id || '');
                  setShowAddDocModal(true);
                }}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Upload Document</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100 text-slate-600 uppercase tracking-wider text-[10px] font-bold">
                <tr>
                  <th className="py-3 px-4">Document Title</th>
                  <th className="py-3 px-3">Linked Project</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Version &amp; Size</th>
                  <th className="py-3 px-3">Uploaded Date</th>
                  <th className="py-3 px-3 text-center">Approval Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allProjectDocuments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No documents found in this vault category.
                    </td>
                  </tr>
                ) : (
                  allProjectDocuments.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4">
                        <strong className="text-slate-900 block text-xs">{doc.title}</strong>
                        <span className="text-[10px] text-slate-400 font-mono">By: {doc.uploadedBy}</span>
                      </td>

                      <td className="py-3.5 px-3">
                        <span className="font-mono font-bold text-blue-700 block">{doc.project.id}</span>
                        <span className="text-[11px] text-slate-600">{doc.project.name}</span>
                      </td>

                      <td className="py-3.5 px-3">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 font-bold text-[10px] uppercase">
                          {doc.category?.replace(/_/g, ' ')}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 font-mono text-[11px] text-slate-600">
                        {doc.version} • {doc.fileSize}
                      </td>

                      <td className="py-3.5 px-3 text-slate-500 font-mono text-[11px]">
                        {formatDate(doc.uploadedAt)}
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            doc.approvalStatus === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : doc.approvalStatus === 'REVISION_REQUESTED'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {doc.approvalStatus}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right space-x-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedProject(doc.project);
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs inline-flex items-center gap-1 cursor-pointer transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Project</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================================
          VIEW 10: PROJECT ACTIVITY TIMELINE
      ============================================================================ */}
      {selectedView === 'TIMELINE' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
          <div className="p-5 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-700 border border-blue-100">
                <History className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-navy-950">10. Central Project Activity Timeline</h3>
                <p className="text-xs text-slate-500">
                  Chronological event stream of site kickoffs, stage inspections, quality signoffs, and milestones
                </p>
              </div>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search events, project ID..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>
          </div>

          <div className="p-6 max-w-4xl mx-auto space-y-6">
            {allActivityTimeline.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                No activity events found.
              </div>
            ) : (
              allActivityTimeline.map((ev, idx) => (
                <div key={ev.id} className="flex items-start gap-4">
                  {/* Timeline Icon Node */}
                  <div
                    className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 shadow-xs ${
                      ev.type === 'KICKOFF'
                        ? 'bg-emerald-500 text-white'
                        : ev.type === 'STAGE_UPDATE'
                        ? 'bg-blue-600 text-white'
                        : ev.type === 'HOLD_OR_DELAY'
                        ? 'bg-amber-500 text-white'
                        : ev.type === 'COMPLETION'
                        ? 'bg-purple-600 text-white'
                        : 'bg-navy-950 text-white'
                    }`}
                  >
                    {ev.type === 'KICKOFF' && <Sparkles className="w-4 h-4" />}
                    {ev.type === 'STAGE_UPDATE' && <HardHat className="w-4 h-4" />}
                    {ev.type === 'HOLD_OR_DELAY' && <AlertTriangle className="w-4 h-4" />}
                    {ev.type === 'COMPLETION' && <Award className="w-4 h-4" />}
                    {ev.type === 'CREATION' && <Building className="w-4 h-4" />}
                  </div>

                  {/* Event Card */}
                  <div className="flex-1 p-4 bg-slate-50 rounded-2xl border border-slate-200 hover:border-slate-300 transition text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <strong className="text-slate-900 text-sm">{ev.title}</strong>
                      <span className="text-[10px] font-mono text-slate-400">
                        {formatDate(ev.timestamp)}
                      </span>
                    </div>

                    <p className="text-slate-600 leading-relaxed">{ev.description}</p>

                    <div className="pt-2 flex items-center justify-between border-t border-slate-100 text-[11px]">
                      <span className="font-mono text-blue-700 font-bold">
                        {ev.project.id} • {ev.project.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedProject(ev.project)}
                        className="text-blue-600 hover:underline font-bold"
                      >
                        Inspect Manifest →
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ============================================================================
          MODAL: ADD DOCUMENT
      ============================================================================ */}
      {showAddDocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-navy-950 text-sm flex items-center gap-2">
                <Upload className="w-4 h-4 text-blue-600" />
                <span>Upload Technical Document to Project Vault</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddDocModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddDocumentSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Select Project *</label>
                <select
                  value={docProjectId}
                  onChange={(e) => setDocProjectId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  required
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.id} - {p.name} ({p.customerName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Document Category *</label>
                <select
                  value={docCategory}
                  onChange={(e) => setDocCategory(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  required
                >
                  <option value="DRAWING_2D">2D Architectural Blueprints</option>
                  <option value="ELEVATION_3D">3D Exterior / Interior Elevation</option>
                  <option value="STRUCTURAL_RCC">Structural RCC Calculations &amp; Modeling</option>
                  <option value="BOQ">Bill of Quantities (BOQ Cost Sheet)</option>
                  <option value="CONTRACT">Contract &amp; Charter Deed</option>
                  <option value="SITE_PHOTO">Site Progress Photo</option>
                  <option value="HANDOVER_CERT">Handover &amp; Warranty Certificate</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Document Title *</label>
                <input
                  type="text"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  placeholder="e.g. Approved Foundation Footing Structural Drawing v1.2"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Revision / Version</label>
                  <input
                    type="text"
                    value={docVersion}
                    onChange={(e) => setDocVersion(e.target.value)}
                    placeholder="v1.0"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">File Size / Format</label>
                  <input
                    type="text"
                    value="2.4 MB (PDF/DWG)"
                    disabled
                    className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddDocModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs"
                >
                  Upload &amp; Archive
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================================
          EXISTING MODALS: ASSIGN TEAM, FLAG DELAY/HOLD, COMPLETE CLOSURE, PROJECT MANIFEST
      ============================================================================ */}
      {/* MODAL: ASSIGN TEAM */}
      <AnimatePresence>
        {teamModalProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-xs">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border space-y-5 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-navy-950">Assign Execution Team</h3>
                    <p className="text-[11px] text-slate-400 font-mono">
                      Project #{teamModalProject.id} ({teamModalProject.name})
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setTeamModalProject(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveTeamAssignment} className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Architect Partner (21 Categories)
                  </label>
                  <select
                    value={assignedArchitectId}
                    onChange={(e) => setAssignedArchitectId(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold focus:outline-none"
                  >
                    <option value="">-- Choose Architect --</option>
                    {architects.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.business?.firmName || a.personal?.fullName} ({a.personal?.city || 'Delhi NCR'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Interior Designer Partner (Optional)
                  </label>
                  <select
                    value={assignedDesignerId}
                    onChange={(e) => setAssignedDesignerId(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold focus:outline-none"
                  >
                    <option value="">-- Choose Interior Designer --</option>
                    {designers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.business?.studioName || d.personal?.fullName} ({d.personal?.city || 'Delhi NCR'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Civil Contractor / Site Engineer *
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
        )}
      </AnimatePresence>

      {/* MODAL: FLAG DELAY / HOLD */}
      <AnimatePresence>
        {delayModalProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-xs">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border space-y-5 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-navy-950">Update Site Status: Delay / On-Hold</h3>
                    <p className="text-[11px] text-slate-400 font-mono">
                      Project #{delayModalProject.id} ({delayModalProject.name})
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDelayModalProject(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveDelayOrHold} className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Target Status</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'DELAYED', label: 'Flag Delayed' },
                      { value: 'ON_HOLD', label: 'Work Paused / Hold' },
                      { value: 'ACTIVE', label: 'Resume Active' },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setDelayTargetStatus(opt.value as any)}
                        className={`py-2 px-3 rounded-xl font-bold border transition text-center cursor-pointer ${
                          delayTargetStatus === opt.value
                            ? 'bg-navy-950 text-white border-navy-950 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Reason &amp; Technical Remarks *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={delayReason}
                    onChange={(e) => setDelayReason(e.target.value)}
                    placeholder="e.g. Unseasonal rain halted concrete slab casting / Client requested design modification..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => setDelayModalProject(null)}
                    className="px-4 py-2 border rounded-xl text-slate-600 font-bold hover:bg-slate-50 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-navy-950 text-gold-400 font-bold rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer hover:bg-navy-900 transition"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Save Status</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: COMPLETE CLOSURE */}
      <AnimatePresence>
        {closureModalProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-xs">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border space-y-5 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-navy-950">Complete Project &amp; Possession Signoff</h3>
                    <p className="text-[11px] text-slate-400 font-mono">
                      Project #{closureModalProject.id} ({closureModalProject.name})
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setClosureModalProject(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveClosure} className="space-y-4 text-xs">
                <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200/90 text-emerald-950 space-y-1">
                  <span className="font-bold block text-sm">Official Handover Certification</span>
                  <p className="text-[11px] text-emerald-800 leading-relaxed">
                    This action marks all stages as 100% completed, records homeowner possession signoff, and initiates the 10-year structural warranty ledger.
                  </p>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Handover Notes &amp; Snag Clearance Certificate *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={closureNotes}
                    onChange={(e) => setClosureNotes(e.target.value)}
                    placeholder="e.g. Final joint inspection completed with homeowner. All snag items resolved..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => setClosureModalProject(null)}
                    className="px-4 py-2 border rounded-xl text-slate-600 font-bold hover:bg-slate-50 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-600 text-white font-bold rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer hover:bg-emerald-700 transition"
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

      {/* MODAL: CREATE PROJECT STEPPER WIZARD */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="admin-fullscreen-modal fixed inset-0 z-50 overflow-y-auto bg-[#f0f7ff] flex flex-col font-sans animate-in fade-in duration-150">
            <div className="h-[2px] bg-gradient-to-r from-transparent via-amber-400 via-sky-400 to-transparent pointer-events-none shrink-0" />
            <div className="sticky top-0 z-40 bg-navy-950 text-white px-4 sm:px-8 py-3.5 border-b border-navy-900 flex items-center justify-between shadow-xl shrink-0">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3.5 py-2 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs flex items-center gap-2 border border-slate-700/80 hover:border-slate-500 transition group cursor-pointer shrink-0"
                >
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  <span>Back / Cancel</span>
                </button>
                <div className="h-6 w-px bg-slate-700 hidden sm:block shrink-0" />
                <div className="min-w-0">
                  <h2 className="text-base sm:text-lg font-black font-display text-white truncate">
                    Section 9 Centralized Project Creator
                  </h2>
                  <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                    <span>Shared Project ID Standard</span>
                    <span>•</span>
                    <span>Auto-generates Stage Gates &amp; Escrow Milestones</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-8">
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6">
                <form onSubmit={handleCreateProjectSubmit}>
                  {/* STEP 1 */}
                  {projectStep === 1 && (
                    <div className="space-y-4 text-xs animate-in fade-in duration-150">
                      <div className="border-b pb-3">
                        <span className="text-[10px] font-bold uppercase text-blue-600 block">Step 1 of 3</span>
                        <h3 className="text-lg font-black text-navy-950">Project Basics &amp; Typology</h3>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="font-bold text-slate-700 block mb-1">Project Name / Title *</label>
                          <input
                            type="text"
                            value={projectName}
                            onChange={(e) => setProjectName(e.target.value)}
                            placeholder="e.g. 4BHK Luxury Villa at Sector 57, Gurugram"
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                            required
                          />
                        </div>

                        <div>
                          <label className="font-bold text-slate-700 block mb-1">Building Typology</label>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {[
                              { key: 'VILLA', label: 'Luxury Villa' },
                              { key: 'FLOOR', label: 'Builder Floor' },
                              { key: 'RENOVATION', label: 'Civil Renovation' },
                              { key: 'INTERIOR', label: 'Turnkey Interior' },
                            ].map((t) => (
                              <button
                                key={t.key}
                                type="button"
                                onClick={() => setProjectType(t.key as any)}
                                className={`p-3 rounded-xl border text-center font-bold transition cursor-pointer ${
                                  projectType === t.key
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                    : 'bg-slate-50 text-slate-700 border-slate-200'
                                }`}
                              >
                                {t.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STEP 2 */}
                  {projectStep === 2 && (
                    <div className="space-y-4 text-xs animate-in fade-in duration-150">
                      <div className="border-b pb-3">
                        <span className="text-[10px] font-bold uppercase text-blue-600 block">Step 2 of 3</span>
                        <h3 className="text-lg font-black text-navy-950">Homeowner Details &amp; Location</h3>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="font-bold text-slate-700 block mb-1">Customer Full Name *</label>
                          <input
                            type="text"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            placeholder="e.g. Rajesh Sharma"
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                            required
                          />
                        </div>

                        <div>
                          <label className="font-bold text-slate-700 block mb-1">Mobile Number *</label>
                          <input
                            type="tel"
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value)}
                            placeholder="10-digit mobile number"
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-mono"
                            required
                          />
                        </div>

                        <div>
                          <label className="font-bold text-slate-700 block mb-1">Project City / Location *</label>
                          <input
                            type="text"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            placeholder="e.g. Gurugram, Delhi NCR"
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STEP 3 */}
                  {projectStep === 3 && (
                    <div className="space-y-4 text-xs animate-in fade-in duration-150">
                      <div className="border-b pb-3">
                        <span className="text-[10px] font-bold uppercase text-blue-600 block">Step 3 of 3</span>
                        <h3 className="text-lg font-black text-navy-950">Total Budget &amp; Initialization</h3>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="font-bold text-slate-700 block mb-1">
                            Estimated Construction Budget (₹) *
                          </label>
                          <input
                            type="number"
                            min={100000}
                            step={50000}
                            placeholder="e.g. 8500000"
                            value={budgetRupees}
                            onChange={(e) => setBudgetRupees(e.target.value === '' ? '' : Number(e.target.value))}
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-base font-bold focus:outline-none"
                            required
                          />
                          <p className="text-xs text-blue-700 font-semibold mt-1">
                            Formatted: {formatINR(Number(budgetRupees || 0) * 100)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-6 border-t border-slate-200 mt-6">
                    {projectStep > 1 ? (
                      <button
                        type="button"
                        onClick={() => setProjectStep(projectStep - 1)}
                        className="px-4 py-2 border rounded-xl text-slate-700 font-bold hover:bg-slate-100 text-xs"
                      >
                        Previous
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowCreateModal(false)}
                        className="px-4 py-2 border rounded-xl text-slate-600 font-bold hover:bg-slate-100 text-xs"
                      >
                        Cancel
                      </button>
                    )}

                    {projectStep < 3 ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (projectStep === 1 && !projectName.trim()) {
                            error('Please enter project name');
                            return;
                          }
                          if (projectStep === 2 && (!customerName.trim() || !customerPhone.trim())) {
                            error('Please enter customer details');
                            return;
                          }
                          setProjectStep(projectStep + 1);
                        }}
                        className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5"
                      >
                        <span>Next Step</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        type="submit"
                        className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5"
                      >
                        <Check className="w-4 h-4" />
                        <span>Launch Project</span>
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* FULL PROJECT MANIFEST MODAL (SECTION 9 ENHANCED) */}
      <AnimatePresence>
        {selectedProject && (
          <div className="admin-fullscreen-modal fixed inset-0 z-50 overflow-y-auto bg-[#f0f7ff] flex flex-col font-sans animate-in fade-in duration-150">
            <div className="h-[2px] bg-gradient-to-r from-transparent via-amber-400 via-sky-400 to-transparent pointer-events-none shrink-0" />
            <div className="sticky top-0 z-40 bg-navy-950 text-white px-4 sm:px-8 py-3.5 border-b border-navy-900 flex items-center justify-between shadow-xl shrink-0">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <button
                  type="button"
                  onClick={() => setSelectedProject(null)}
                  className="px-3.5 py-2 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs flex items-center gap-2 border border-slate-700/80 hover:border-slate-500 transition group cursor-pointer shrink-0"
                >
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  <span className="hidden sm:inline">Back to Directory</span>
                  <span className="sm:hidden">Back</span>
                </button>
                <div className="h-6 w-px bg-slate-700 hidden sm:block shrink-0" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-black font-display text-white truncate">
                      {selectedProject.name}
                    </h2>
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      {selectedProject.id}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono truncate">
                    Client: {selectedProject.customerName} ({selectedProject.customerPhone}) • Work Order: {selectedProject.workOrderNumber}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedProject(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 max-w-[1500px] w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
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
                      Master Rule: Project acceptance &amp; project start are separate events. Verify all legal, financial, and site conditions before authorizing active site works.
                    </p>
                  </div>

                  {selectedProject.status !== 'ACTIVE' && selectedProject.status !== 'COMPLETED' && selectedProject.status !== 'IN_PROGRESS' ? (
                    <button
                      type="button"
                      onClick={() => handleApproveKickoff(selectedProject)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md flex items-center gap-2 text-xs transition cursor-pointer shrink-0"
                    >
                      <Sparkles className="w-4 h-4 text-emerald-200" />
                      <span>Approve Project Kickoff &amp; Mark Active</span>
                    </button>
                  ) : (
                    <span className="px-3 py-1.5 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                      <span>Site Kickoff Authorized &amp; Active</span>
                    </span>
                  )}
                </div>

                {/* 5-Item Checklist */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  {[
                    { key: 'advancePaid', label: '1. Advance Escrow Cleared', val: selectedProject.kickoff?.advancePaid },
                    { key: 'siteDemarcationReady', label: '2. Site Demarcation Ready', val: selectedProject.kickoff?.siteDemarcationReady },
                    { key: 'sanctionReceived', label: '3. Municipal Sanctions Ready', val: selectedProject.kickoff?.sanctionReceived },
                    { key: 'utilityConnectionReady', label: '4. Water & Power Active', val: selectedProject.kickoff?.utilityConnectionReady },
                    { key: 'contractAgreed', label: '5. Contract & BOQ Signed', val: selectedProject.kickoff?.contractAgreed },
                  ].map((chk) => (
                    <button
                      key={chk.key}
                      type="button"
                      onClick={() => handleToggleChecklistItem(selectedProject, chk.key as any, Boolean(chk.val))}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between gap-1.5 ${
                        chk.val
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                          : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase">{chk.label}</span>
                        {chk.val ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Clock className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                      <span className="text-[11px] font-semibold">{chk.val ? 'Verified ✓' : 'Pending Verification'}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* STAGES LIST */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
                <h3 className="font-bold text-sm text-navy-950 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-600" />
                  <span>Physical Stage Gates ({selectedProject.stages?.length || 0} Stages)</span>
                </h3>

                <div className="space-y-3">
                  {(selectedProject.stages || []).map((stg) => (
                    <div
                      key={stg.id}
                      className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-blue-700 font-mono">Stage {stg.stageNumber}</span>
                          <span className="font-bold text-slate-900">{stg.name}</span>
                          <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-800 font-bold text-[10px]">
                            {stg.category}
                          </span>
                        </div>
                        <p className="text-slate-500 text-[11px] mt-0.5">{stg.description}</p>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className="font-bold font-mono text-navy-950 block">{stg.verifiedProgress}% Verified</span>
                          <span className="text-[10px] text-slate-400">Weight: {stg.weightPercent}%</span>
                        </div>
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                            stg.status === 'COMPLETED'
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
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
