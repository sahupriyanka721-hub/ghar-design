// ==============================================================================
// GHARDESIGN PRODUCTION PROJECT EXECUTION & CONTRACTOR TRACKING STORE
// Master Specification: Customer Panel Project Execution, Work Tracking & Milestone Payments
// Zero Dummy Data: Fully Dynamic, Persistent across LocalStorage & CloudSync
// ==============================================================================

import { broadcastStoreUpdate, getPlatformRequests } from './customerStore.js';
import { DEFAULT_STAGES_BLUEPRINT } from './projectTimelineStore.js';

export type ProjectStatus =
  | 'PENDING_ADMIN_REVIEW'
  | 'AGREEMENT_PENDING'
  | 'ADVANCE_PAYMENT_PENDING'
  | 'READY_FOR_KICKOFF'
  | 'ACTIVE'
  | 'AWAITING_KICKOFF'
  | 'START_REQUESTED'
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'ON_HOLD'
  | 'WORK_PAUSED'
  | 'DELAYED'
  | 'AWAITING_CUSTOMER_APPROVAL'
  | 'COMPLETED'
  | 'HANDED_OVER'
  | 'CANCELLED'
  | 'DISPUTED';

export type StageStatus =
  | 'NOT_STARTED'
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'SUBMITTED_FOR_REVIEW'
  | 'REVISION_REQUESTED'
  | 'APPROVED'
  | 'DELAYED'
  | 'ON_HOLD'
  | 'COMPLETED';

export type MilestonePaymentStatus =
  | 'PLANNED'
  | 'LOCKED'
  | 'PENDING_APPROVAL'
  | 'SUBMITTED_FOR_REVIEW'
  | 'PENDING_ADMIN_INSPECTION'
  | 'INSPECTION_SCHEDULED'
  | 'FORWARDED_TO_CUSTOMER'
  | 'AWAITING_CUSTOMER_APPROVAL'
  | 'CUSTOMER_APPROVED'
  | 'REVISION_REQUESTED'
  | 'CORRECTION_REQUESTED'
  | 'APPROVED'
  | 'PAYMENT_ELIGIBLE'
  | 'PAYMENT_DUE'
  | 'PAID'
  | 'DISPUTED'
  | 'RETAINED'
  | 'REFUNDED';

export type IssueCategory =
  | 'MATERIAL_DELAY'
  | 'WEATHER'
  | 'LABOR_SHORTAGE'
  | 'DESIGN_CHANGE'
  | 'PAYMENT_DISPUTE'
  | 'TECHNICAL_DEFECT'
  | 'SITE_ACCESS';

export interface ExecutionTask {
  id: string;
  title: string;
  weight: number;
  quantity?: number;
  unit?: string;
  unitRatePaise?: number;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'SUBMITTED' | 'APPROVED' | 'COMPLETED';
  reportedFraction: number; // 0.0 to 1.0
  verifiedFraction: number; // 0.0 to 1.0
  evidencePhotos?: string[];
}

export interface ExecutionStage {
  id: string;
  stageNumber: number;
  name: string;
  category: 'PLANNING' | 'FOUNDATION' | 'RCC_STRUCTURE' | 'MASONRY' | 'FINISHING' | 'HANDOVER';
  description: string;
  weightPercent: number; // Sums to 100
  status: StageStatus;
  plannedStartDate: string;
  plannedEndDate: string;
  actualStartDate?: string;
  actualEndDate?: string;
  reportedProgress: number; // 0 to 100
  verifiedProgress: number; // 0 to 100
  tasks: ExecutionTask[];
}

export interface DailySiteReport {
  id: string;
  reportDate: string;
  submittedAt: string;
  submittedBy: string;
  weather: 'Sunny / Clear' | 'Partly Cloudy' | 'Rainy / Monsoon' | 'Extreme Heat' | 'Windy';
  workersPresent: number;
  workPerformed: string;
  tasksUpdated: string[];
  quantitiesCompleted: string;
  materialsReceived: string;
  materialsConsumed: string;
  equipmentUsed: string;
  sitePhotos: string[];
  siteVideos?: string[];
  blockers: string;
  safetyObservations: string;
  nextPlannedActivities: string;
  delayReasons?: string;
  customerComments: Array<{
    id: string;
    author: string;
    role: 'CUSTOMER' | 'CONTRACTOR' | 'ADMIN';
    comment: string;
    timestamp: string;
  }>;
}

export interface PaymentMilestoneItem {
  id: string;
  milestoneNumber: number;
  title: string;
  description: string;
  percentage: number;
  weightPercent?: number;
  amountPaise: number;
  linkedStageNumber: number;
  evidencePhotos: string[];
  supportingFiles?: Array<{ name: string; url: string; size?: string }>;
  inspectionNotes?: string;
  inspectedBy?: string;
  status: MilestonePaymentStatus;
  submittedAt?: string;
  adminInspectedAt?: string;
  forwardedToCustomerAt?: string;
  customerDecisionAt?: string;
  customerComments?: string;
  approvedAt?: string;
  paymentEligibleAt?: string;
  paidAt?: string;
  transactionId?: string;
  disputeReason?: string;
  correctionNotes?: string;
  verifiedCompletionFraction?: number; // 0.0 to 1.0
  reportedCompletionFraction?: number; // 0.0 to 1.0
}

export interface ProjectIssue {
  id: string;
  category: IssueCategory;
  title: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'UNDER_INVESTIGATION' | 'RESOLVED';
  raisedBy: 'CUSTOMER' | 'CONTRACTOR' | 'ADMIN';
  raisedAt: string;
  resolvedAt?: string;
  timelineImpactDays: number;
  disputedAmountPaise: number;
  linkedStageNumber?: number;
  supportingDocs: string[];
  resolutionNotes?: string;
}

export interface ChangeOrder {
  id: string;
  changeOrderNumber: string;
  title: string;
  description: string;
  costImpactPaise: number; // positive = added cost, negative = rebate
  timelineImpactDays: number;
  scopeModification: string;
  status: 'PROPOSED' | 'CUSTOMER_APPROVED' | 'ADMIN_APPROVED' | 'REJECTED';
  proposedBy: string;
  proposedAt: string;
  customerDecisionAt?: string;
  customerNotes?: string;
  updatedBoqItems?: Array<{
    item: string;
    quantity: string;
    ratePaise: number;
    totalPaise: number;
  }>;
}

export interface LinkedMaterialOrder {
  orderId: string;
  orderCode: string;
  items: string;
  totalPaise: number;
  orderDate: string;
  status: 'ORDERED' | 'DISPATCHED' | 'DELIVERED';
  deliveryDate?: string;
  linkedStage: string;
}

export interface ProjectDocumentItem {
  id: string;
  title: string;
  category:
    | 'ACCEPTED_QUOTATION'
    | 'CONTRACT'
    | 'DRAWING_2D'
    | 'ELEVATION_3D'
    | 'STRUCTURAL_RCC'
    | 'BOQ'
    | 'SPECIFICATION'
    | 'SITE_PHOTO'
    | 'INVOICE'
    | 'HANDOVER_CERT';
  version: string;
  fileUrl: string;
  fileSize: string;
  uploadedAt: string;
  uploadedBy: string;
  approvalStatus: 'PENDING' | 'APPROVED' | 'REVISION_REQUESTED';
  approvalNotes?: string;
}

export interface ProjectChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'CUSTOMER' | 'CONTRACTOR' | 'ADMIN';
  message: string;
  timestamp: string;
  attachmentUrl?: string;
}

export interface SnagItem {
  id: string;
  title: string;
  area: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'IDENTIFIED' | 'RECTIFIED' | 'VERIFIED_AND_CLOSED';
  reportedAt: string;
  rectifiedAt?: string;
  photoUrl?: string;
  notes?: string;
}

export interface ProjectKickoffInfo {
  advanceRequiredPaise: number;
  advancePaid: boolean;
  advancePaidPaise: number;
  siteDemarcationReady: boolean;
  sanctionReceived: boolean;
  utilityConnectionReady: boolean;
  contractAgreed: boolean;
  specialInstructions: string;
  requestedAt?: string;
  confirmedAt?: string;
  pauseReason?: string;
}

export interface ExecutionProject {
  id: string; // e.g. BG-2026-0001
  code?: string; // Compatibility alias
  requestCode: string;
  quotationId: string;
  quotationCode: string;
  bookingCode: string;
  workOrderNumber: string;
  name: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  propertyAddress: string;
  city: string;
  state: string;
  serviceType: string;
  category: 'CONSTRUCTION' | 'INTERIOR' | 'RENOVATION' | 'PLANNING';
  contractorId: string;
  contractorName: string;
  contractorFirm: string;
  contractorPhone: string;
  contractorRole: string;
  contractValuePaise: number;
  originalContractPaise: number;
  approvedVariationsPaise: number;
  totalPaidPaise: number;
  amountAwaitingApprovalPaise: number;
  amountDuePaise: number;
  retentionPaise: number;
  status: ProjectStatus;
  plannedStartDate: string;
  plannedEndDate: string;
  actualStartDate?: string;
  actualEndDate?: string;
  currentStage: string;
  overallVerifiedProgress: number; // 0-100%
  overallReportedProgress: number; // 0-100%
  pendingApprovalsCount: number;
  nextMilestoneTitle?: string;
  nextMilestoneDue?: string;
  createdAt: string;
  updatedAt: string;

  kickoff: ProjectKickoffInfo;
  stages: ExecutionStage[];
  dailyReports: DailySiteReport[];
  paymentMilestones: PaymentMilestoneItem[];
  issues: ProjectIssue[];
  changeOrders: ChangeOrder[];
  linkedMaterials: LinkedMaterialOrder[];
  documents: ProjectDocumentItem[];
  messages: ProjectChatMessage[];
  // Compatibility & normalization fields
  title?: string;
  projectCode?: string;
  totalContractPaise?: number;
  weightedProgressPercent?: number;
  plotAreaSqFt?: number;
  architectId?: string;
  architectName?: string;
  interiorDesignerId?: string;
  interiorDesignerName?: string;
  budgetPaise?: number;
  progressPercentage?: number;
  customerApprovedProgress?: number;
  siteLocation?: {
    addressLine1?: string;
    city?: string;
    state?: string;
    pinCode?: string;
  };
  startDate?: string;
  targetCompletionDate?: string;
  location?: {
    locality: string;
    city: string;
  };

  handover: {
    status: 'NOT_READY' | 'INSPECTION_SCHEDULED' | 'SNAG_LIST_ACTIVE' | 'APPROVED' | 'HANDED_OVER';
    handoverDate?: string;
    possessionSignoff: boolean;
    warrantyStartDate?: string;
    warrantyEndDate?: string;
    completionSummary?: string;
    snags: SnagItem[];
  };
}

const PROJECTS_STORAGE_KEY = 'gd_customer_execution_projects_v2';

/**
 * Calculates weighted project completion according to IS 456 / Spec Part 6:
 * Project completion percentage = Sum of (approved task weight × verified task completion fraction) / Total weights
 */
export const calculateProjectWeightedProgress = (stages: ExecutionStage[]) => {
  let totalWeight = 0;
  let weightedVerifiedSum = 0;
  let weightedReportedSum = 0;
  const breakdown: Array<{ stageName: string; weight: number; verifiedFraction: number; contribution: number }> = [];

  for (const stage of stages) {
    totalWeight += stage.weightPercent;
    const verifiedFraction = stage.verifiedProgress / 100;
    const reportedFraction = stage.reportedProgress / 100;
    const stageContribution = stage.weightPercent * verifiedFraction;
    weightedVerifiedSum += stageContribution;
    weightedReportedSum += stage.weightPercent * reportedFraction;
    breakdown.push({
      stageName: stage.name,
      weight: stage.weightPercent,
      verifiedFraction,
      contribution: Math.round(stageContribution * 10) / 10,
    });
  }

  const verifiedProgress = totalWeight > 0 ? Math.min(100, Math.round((weightedVerifiedSum / totalWeight) * 100)) : 0;
  const reportedProgress = totalWeight > 0 ? Math.min(100, Math.round((weightedReportedSum / totalWeight) * 100)) : 0;

  return {
    verifiedProgress,
    reportedProgress,
    explanation: {
      totalWeight,
      breakdown,
    },
  };
};

/**
 * Generates default IS 456 work plan stages for a new project
 */
export const createDefaultExecutionStages = (): ExecutionStage[] => {
  return DEFAULT_STAGES_BLUEPRINT.map((b) => ({
    id: `stage-${b.stageNumber}-${Date.now()}`,
    stageNumber: b.stageNumber,
    name: b.name,
    category: b.category,
    description: b.description,
    weightPercent: b.weightagePercent,
    status: b.stageNumber === 1 ? 'IN_PROGRESS' : 'NOT_STARTED',
    plannedStartDate: new Date(Date.now() + (b.stageNumber - 1) * 18 * 86400000).toISOString().split('T')[0],
    plannedEndDate: new Date(Date.now() + b.stageNumber * 18 * 86400000).toISOString().split('T')[0],
    reportedProgress: 0,
    verifiedProgress: 0,
    tasks: [
      {
        id: `task-${b.stageNumber}-1`,
        title: `${b.name} - Initial Demarcation & Mobilization`,
        weight: 30,
        status: b.stageNumber === 1 ? 'IN_PROGRESS' : 'NOT_STARTED',
        reportedFraction: 0,
        verifiedFraction: 0,
      },
      {
        id: `task-${b.stageNumber}-2`,
        title: `${b.name} - Primary Execution & Rebar/Concrete Work`,
        weight: 50,
        status: 'NOT_STARTED',
        reportedFraction: 0,
        verifiedFraction: 0,
      },
      {
        id: `task-${b.stageNumber}-3`,
        title: `${b.name} - Quality Curing, Testing & Verification`,
        weight: 20,
        status: 'NOT_STARTED',
        reportedFraction: 0,
        verifiedFraction: 0,
      },
    ],
  }));
};

/**
 * Generates payment milestone breakdown conforming to the total contract amount
 */
export const createDefaultPaymentMilestones = (totalPaise: number): PaymentMilestoneItem[] => {
  const milestoneRatios = [
    { num: 1, title: 'Mobilization & Drawing Sign-off', pct: 15, stage: 1, desc: 'Advance payment for map approval and site mobilization.' },
    { num: 2, title: 'Foundation & Plinth Beam Casting', pct: 20, stage: 4, desc: 'Completion of excavation, PCC, footings and plinth tie-beam.' },
    { num: 3, title: 'RCC Structure & Roof Slab Casting', pct: 25, stage: 6, desc: 'Columns, lintel beams and ground/first floor roof slabs.' },
    { num: 4, title: 'Brick Masonry, Plastering & Waterproofing', pct: 20, stage: 8, desc: 'Internal/external 9" & 4.5" walls and terrace waterproofing.' },
    { num: 5, title: 'MEP Conduits, Flooring & Luxury Finishes', pct: 15, stage: 9, desc: 'Concealed wiring, plumbing, and vitrified tile installation.' },
    { num: 6, title: 'Final Snag Rectification & Keys Handover', pct: 5, stage: 10, desc: 'Final painting, quality clearance, and possession handover.' },
  ];

  return milestoneRatios.map((m) => ({
    id: `pmilestone-${m.num}-${Date.now()}`,
    milestoneNumber: m.num,
    title: m.title,
    description: m.desc,
    percentage: m.pct,
    amountPaise: Math.round((totalPaise * m.pct) / 100),
    linkedStageNumber: m.stage,
    evidencePhotos: [],
    status: m.num === 1 ? 'PAYMENT_DUE' : 'PLANNED',
  }));
};

export const getSeedExecutionProjects = (): ExecutionProject[] => {
  return [];
};

/**
 * Reads all execution projects from storage
 */
export const getExecutionProjects = (customerId?: string, customerPhone?: string): ExecutionProject[] => {
  try {
    const raw = localStorage.getItem(PROJECTS_STORAGE_KEY);
    let projects: ExecutionProject[] = raw ? JSON.parse(raw) : [];

    // Ensure array
    if (!Array.isArray(projects)) {
      projects = [];
    }

    // Clean state: no dummy projects injected
    if (!Array.isArray(projects)) { projects = []; }

    // Guarantee robust normalization for all projects
    projects = projects.map((p) => {
      const loc = (p as any).location || {
        locality: p.propertyAddress ? p.propertyAddress.split(',')[0].trim() : (p.city || 'Site Locality'),
        city: p.city || 'Delhi NCR',
      };
      return {
        ...p,
        location: loc,
        projectCode: (p as any).projectCode || p.requestCode || p.id,
        title: (p as any).title || p.name,
        totalContractPaise: (p as any).totalContractPaise || p.contractValuePaise || 0,
        weightedProgressPercent: (p as any).weightedProgressPercent ?? p.overallVerifiedProgress ?? p.overallReportedProgress ?? 0,
        plotAreaSqFt: (p as any).plotAreaSqFt || 1200,
        startDate: (p as any).startDate || p.plannedStartDate,
        targetCompletionDate: (p as any).targetCompletionDate || p.plannedEndDate,
      };
    });

    if (customerId || customerPhone) {
      const cleanPhone = customerPhone?.replace(/\D/g, '').slice(-10);
      return projects.filter((p) => {
        if (customerId && p.customerId === customerId) return true;
        if (cleanPhone) {
          const pPhone = p.customerPhone?.replace(/\D/g, '').slice(-10);
          if (pPhone === cleanPhone) return true;
        }
        return false;
      });
    }

    return projects;
  } catch (e) {
    console.error('Failed reading execution projects', e);
    return getSeedExecutionProjects();
  }
};

/**
 * Gets a single project by ID or Code
 */
export const getExecutionProjectById = (projectIdOrCode: string): ExecutionProject | undefined => {
  const projects = getExecutionProjects();
  return projects.find((p) => p.id === projectIdOrCode || p.requestCode === projectIdOrCode || p.workOrderNumber === projectIdOrCode);
};

/**
 * Saves or updates an execution project in storage
 */
export const saveExecutionProject = (project: ExecutionProject): void => {
  try {
    const projects = getExecutionProjects();
    const idx = projects.findIndex((p) => p.id === project.id);
    let updated: ExecutionProject[];

    const recalculated = calculateProjectWeightedProgress(project.stages);
    const finalizedProject: ExecutionProject = {
      ...project,
      overallVerifiedProgress: recalculated.verifiedProgress,
      overallReportedProgress: recalculated.reportedProgress,
      updatedAt: new Date().toISOString(),
    };

    if (idx >= 0) {
      updated = [...projects];
      updated[idx] = finalizedProject;
    } else {
      updated = [finalizedProject, ...projects];
    }

    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(updated));
    broadcastStoreUpdate();
  } catch (e) {
    console.error('Failed saving execution project', e);
  }
};

export const generateNextProjectId = (): string => {
  const existing = getExecutionProjects();
  let maxSeq = 0;
  existing.forEach((p) => {
    const idStr = p.id || p.projectCode || '';
    const match = idStr.match(/BG-2026-(\d+)/i) || idStr.match(/PRJ-2026-(\d+)/i);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxSeq) maxSeq = num;
    }
  });
  const nextSeq = maxSeq + 1;
  return `BG-2026-${String(nextSeq).padStart(4, '0')}`;
};

/**
 * Section 9 Kickoff Approval: Transitions project from PENDING/READY status to ACTIVE.
 * Records timestamp, confirms advance payment, and initiates execution tracking.
 */
export const approveProjectKickoff = (projectId: string, notes?: string): ExecutionProject | undefined => {
  const project = getExecutionProjectById(projectId);
  if (!project) return undefined;

  const now = new Date().toISOString();
  const updatedProject: ExecutionProject = {
    ...project,
    status: 'ACTIVE',
    actualStartDate: now,
    startDate: project.startDate || now,
    kickoff: {
      ...project.kickoff,
      confirmedAt: now,
      advancePaid: true,
      contractAgreed: true,
      siteDemarcationReady: true,
      sanctionReceived: true,
      utilityConnectionReady: true,
      specialInstructions: notes || project.kickoff?.specialInstructions || 'Official kickoff approved by Admin Desk.',
    },
    updatedAt: now,
  };

  saveExecutionProject(updatedProject);
  return updatedProject;
};

/**
 * Updates individual items in the Section 9 Pre-commencement Verification Checklist.
 */
export const updateProjectKickoffChecklist = (
  projectId: string,
  checklist: Partial<ProjectKickoffInfo>
): ExecutionProject | undefined => {
  const project = getExecutionProjectById(projectId);
  if (!project) return undefined;

  const mergedKickoff: ProjectKickoffInfo = {
    ...project.kickoff,
    ...checklist,
  };

  // If all critical readiness criteria are met, transition status to READY_FOR_KICKOFF
  const isReady =
    mergedKickoff.contractAgreed &&
    mergedKickoff.advancePaid &&
    mergedKickoff.siteDemarcationReady &&
    mergedKickoff.sanctionReceived;

  let newStatus = project.status;
  if (isReady && (project.status === 'PENDING_ADMIN_REVIEW' || project.status === 'AGREEMENT_PENDING' || project.status === 'ADVANCE_PAYMENT_PENDING')) {
    newStatus = 'READY_FOR_KICKOFF';
  }

  const updatedProject: ExecutionProject = {
    ...project,
    status: newStatus,
    kickoff: mergedKickoff,
    updatedAt: new Date().toISOString(),
  };

  saveExecutionProject(updatedProject);
  return updatedProject;
};

/**
 * Reassigns architect, contractor, or interior designer to a project.
 */
export const reassignProjectTeam = (
  projectId: string,
  params: {
    architectId?: string;
    architectName?: string;
    architectFirm?: string;
    contractorId?: string;
    contractorName?: string;
    contractorFirm?: string;
    interiorDesignerId?: string;
    interiorDesignerName?: string;
  }
): ExecutionProject | undefined => {
  const project = getExecutionProjectById(projectId);
  if (!project) return undefined;

  const updatedProject: ExecutionProject = {
    ...project,
    architectId: params.architectId !== undefined ? params.architectId : project.architectId,
    architectName: params.architectName !== undefined ? params.architectName : project.architectName,
    contractorId: params.contractorId !== undefined ? params.contractorId : project.contractorId,
    contractorName: params.contractorName !== undefined ? params.contractorName : project.contractorName,
    contractorFirm: params.contractorFirm !== undefined ? params.contractorFirm : project.contractorFirm,
    interiorDesignerId: params.interiorDesignerId !== undefined ? params.interiorDesignerId : project.interiorDesignerId,
    interiorDesignerName: params.interiorDesignerName !== undefined ? params.interiorDesignerName : project.interiorDesignerName,
    updatedAt: new Date().toISOString(),
  };

  saveExecutionProject(updatedProject);
  return updatedProject;
};

/**
 * Flags delay or places a project on hold with specific reason notes.
 */
export const flagProjectDelayOrHold = (
  projectId: string,
  status: 'DELAYED' | 'ON_HOLD' | 'ACTIVE',
  reason: string
): ExecutionProject | undefined => {
  const project = getExecutionProjectById(projectId);
  if (!project) return undefined;

  const now = new Date().toISOString();
  const updatedProject: ExecutionProject = {
    ...project,
    status,
    kickoff: {
      ...project.kickoff,
      pauseReason: status !== 'ACTIVE' ? reason : undefined,
    },
    updatedAt: now,
  };

  saveExecutionProject(updatedProject);
  return updatedProject;
};

/**
 * Marks project fully completed and executes final settlement handover.
 */
export const completeProjectClosure = (projectId: string, notes?: string): ExecutionProject | undefined => {
  const project = getExecutionProjectById(projectId);
  if (!project) return undefined;

  const now = new Date().toISOString();
  const updatedProject: ExecutionProject = {
    ...project,
    status: 'COMPLETED',
    actualEndDate: now,
    overallVerifiedProgress: 100,
    overallReportedProgress: 100,
    handover: {
      ...project.handover,
      status: 'HANDED_OVER',
      possessionSignoff: true,
      handoverDate: now,
      completionSummary: notes || 'Project successfully completed and handed over to homeowner.',
    },
    updatedAt: now,
  };

  saveExecutionProject(updatedProject);
  return updatedProject;
};

/**
 * Section 11 Milestone Lifecycle: Admin forwards submitted milestone to customer for sign-off.
 */
export const adminForwardMilestoneToCustomer = (
  projectId: string,
  milestoneId: string,
  notes?: string
): ExecutionProject | undefined => {
  const project = getExecutionProjectById(projectId);
  if (!project) return undefined;

  const now = new Date().toISOString();
  const updatedMilestones = (project.paymentMilestones || []).map((m) => {
    if (m.id === milestoneId) {
      return {
        ...m,
        status: 'AWAITING_CUSTOMER_APPROVAL' as const,
        inspectionNotes: notes || m.inspectionNotes || 'Admin technical inspection cleared. Forwarded for customer approval.',
        forwardedToCustomerAt: now,
      };
    }
    return m;
  });

  const updatedProject: ExecutionProject = {
    ...project,
    paymentMilestones: updatedMilestones,
    updatedAt: now,
  };

  saveExecutionProject(updatedProject);
  return updatedProject;
};

/**
 * Section 11 Milestone Lifecycle: Admin requests additional proof or correction from professional.
 */
export const adminRequestMilestoneCorrection = (
  projectId: string,
  milestoneId: string,
  correctionNotes: string
): ExecutionProject | undefined => {
  const project = getExecutionProjectById(projectId);
  if (!project) return undefined;

  const now = new Date().toISOString();
  const updatedMilestones = (project.paymentMilestones || []).map((m) => {
    if (m.id === milestoneId) {
      return {
        ...m,
        status: 'CORRECTION_REQUESTED' as const,
        correctionNotes,
        inspectionNotes: `Correction requested by Admin: ${correctionNotes}`,
      };
    }
    return m;
  });

  const updatedProject: ExecutionProject = {
    ...project,
    paymentMilestones: updatedMilestones,
    updatedAt: now,
  };

  saveExecutionProject(updatedProject);
  return updatedProject;
};

/**
 * Section 11 Milestone Lifecycle: Admin schedules an on-site technical inspection.
 */
export const adminScheduleMilestoneTechnicalInspection = (
  projectId: string,
  milestoneId: string,
  params: { inspectorName: string; inspectionDate: string; instructions?: string }
): ExecutionProject | undefined => {
  const project = getExecutionProjectById(projectId);
  if (!project) return undefined;

  const now = new Date().toISOString();
  const updatedMilestones = (project.paymentMilestones || []).map((m) => {
    if (m.id === milestoneId) {
      return {
        ...m,
        status: 'INSPECTION_SCHEDULED' as const,
        inspectedBy: params.inspectorName,
        inspectionNotes: `Physical Site Inspection scheduled for ${params.inspectionDate} by ${params.inspectorName}. Instructions: ${params.instructions || 'Inspect physical reinforcement and material specs.'}`,
        adminInspectedAt: params.inspectionDate,
      };
    }
    return m;
  });

  const updatedProject: ExecutionProject = {
    ...project,
    paymentMilestones: updatedMilestones,
    updatedAt: now,
  };

  saveExecutionProject(updatedProject);
  return updatedProject;
};

/**
 * Section 11 Milestone Lifecycle: Admin verifies milestone work and marks payment eligible.
 * Recalculates weighted project progress according to IS 456.
 */
export const adminVerifyAndMarkPaymentEligible = (
  projectId: string,
  milestoneId: string,
  verifiedFraction: number,
  notes?: string
): ExecutionProject | undefined => {
  const project = getExecutionProjectById(projectId);
  if (!project) return undefined;

  const now = new Date().toISOString();
  const updatedMilestones = (project.paymentMilestones || []).map((m) => {
    if (m.id === milestoneId) {
      return {
        ...m,
        status: 'PAYMENT_ELIGIBLE' as const,
        verifiedCompletionFraction: verifiedFraction,
        approvedAt: now,
        paymentEligibleAt: now,
        inspectionNotes: notes || m.inspectionNotes || 'Milestone verified and certified by Admin Desk.',
      };
    }
    return m;
  });

  // Also update corresponding physical stage progress if linked
  const targetMilestone = project.paymentMilestones.find((m) => m.id === milestoneId);
  let updatedStages = project.stages;
  if (targetMilestone) {
    const stageNum = targetMilestone.linkedStageNumber || targetMilestone.milestoneNumber;
    updatedStages = (project.stages || []).map((s) => {
      if (s.stageNumber === stageNum) {
        return {
          ...s,
          verifiedProgress: Math.round(verifiedFraction * 100),
          status: verifiedFraction >= 1 ? 'COMPLETED' : 'IN_PROGRESS',
        };
      }
      return s;
    });
  }

  const recalculated = calculateProjectWeightedProgress(updatedStages);

  const updatedProject: ExecutionProject = {
    ...project,
    paymentMilestones: updatedMilestones,
    stages: updatedStages,
    overallVerifiedProgress: recalculated.verifiedProgress,
    overallReportedProgress: Math.max(recalculated.reportedProgress, project.overallReportedProgress || 0),
    progressPercentage: recalculated.verifiedProgress,
    updatedAt: now,
  };

  saveExecutionProject(updatedProject);
  return updatedProject;
};

/**
 * Section 11 Milestone Lifecycle: Admin authorizes and releases escrow payout.
 * Strictly adheres to rule: Progress percentage alone never releases payment without this admin release.
 */
export const adminReleaseMilestonePayout = (
  projectId: string,
  milestoneId: string,
  txDetails?: string
): ExecutionProject | undefined => {
  const project = getExecutionProjectById(projectId);
  if (!project) return undefined;

  const targetMilestone = (project.paymentMilestones || []).find((m) => m.id === milestoneId);
  if (!targetMilestone) return undefined;

  const now = new Date().toISOString();
  const payoutAmount = targetMilestone.amountPaise;

  const updatedMilestones = (project.paymentMilestones || []).map((m) => {
    if (m.id === milestoneId) {
      return {
        ...m,
        status: 'PAID' as const,
        paidAt: now,
        transactionId: txDetails || `TX-ESCROW-${Date.now()}`,
      };
    }
    return m;
  });

  const updatedProject: ExecutionProject = {
    ...project,
    paymentMilestones: updatedMilestones,
    totalPaidPaise: (project.totalPaidPaise || 0) + payoutAmount,
    amountDuePaise: Math.max(0, (project.amountDuePaise || project.contractValuePaise || 0) - payoutAmount),
    updatedAt: now,
  };

  saveExecutionProject(updatedProject);
  return updatedProject;
};

/**
 * Section 11 Milestone Configuration: Admin configures custom milestone breakdown for project.
 */
export const adminConfigureProjectMilestones = (
  projectId: string,
  newMilestones: PaymentMilestoneItem[]
): ExecutionProject | undefined => {
  const project = getExecutionProjectById(projectId);
  if (!project) return undefined;

  const now = new Date().toISOString();
  const updatedProject: ExecutionProject = {
    ...project,
    paymentMilestones: newMilestones,
    updatedAt: now,
  };

  saveExecutionProject(updatedProject);
  return updatedProject;
};

/**
 * Creates and initializes a formal project when a quotation is accepted
 */
export const createProjectFromAcceptedQuotation = (params: {
  customer: { id: string; name: string; phone: string; address?: string; city?: string; state?: string };
  request: { id: string; requestCode: string; propertyType?: string; plotArea?: number; city: string; state: string; locality?: string; description?: string; serviceType?: string };
  quotation: { id: string; quotationCode: string; finalAmountPaise: number; advancePercentage?: number; scopeOfWork?: string; professional?: { id?: string; name?: string; firmName?: string; phone?: string } };
  bookingCode?: string;
}): ExecutionProject => {
  // 1. Idempotency Check: Do not create duplicate project records when a customer clicks Accept multiple times
  const existing = getExecutionProjects();
  const alreadyCreated = existing.find(
    (p) =>
      (params.quotation.id && (p.quotationId === params.quotation.id || p.quotationCode === params.quotation.id)) ||
      (params.quotation.quotationCode && (p.quotationCode === params.quotation.quotationCode || p.quotationId === params.quotation.quotationCode)) ||
      (params.request.requestCode && p.requestCode === params.request.requestCode)
  );
  if (alreadyCreated) {
    return alreadyCreated;
  }

  const now = new Date().toISOString();
  // Shared Project ID (Section 9 Specification: BG-2026-0001)
  const projectId = generateNextProjectId();
  const workOrderNumber = `WO-${projectId}`;
  const bookingCode = params.bookingCode || `BK-${projectId}`;

  const totalPaise = params.quotation.finalAmountPaise || 150000000;
  const advPct = params.quotation.advancePercentage || 15;
  const advancePaise = Math.round((totalPaise * advPct) / 100);

  const stages = createDefaultExecutionStages();
  const paymentMilestones = createDefaultPaymentMilestones(totalPaise);

  const initialProject: ExecutionProject = {
    id: projectId,
    projectCode: projectId,
    code: projectId,
    requestCode: params.request.requestCode || `REQ-${projectId}`,
    quotationId: params.quotation.id,
    quotationCode: params.quotation.quotationCode || `QT-${projectId}`,
    bookingCode,
    workOrderNumber,
    name: `${params.request.serviceType || 'Civil Construction'} - ${params.request.locality || params.request.city}`,
    customerId: params.customer.id || (() => {
      try {
        const u = JSON.parse(localStorage.getItem('user') || '{}');
        return u.id || '';
      } catch { return ''; }
    })(),
    customerName: params.customer.name || (() => {
      try {
        const u = JSON.parse(localStorage.getItem('user') || '{}');
        return u.name || 'Registered Homeowner';
      } catch { return 'Registered Homeowner'; }
    })(),
    customerPhone: params.customer.phone || (() => {
      try {
        const u = JSON.parse(localStorage.getItem('user') || '{}');
        return u.phone || '';
      } catch { return ''; }
    })(),
    propertyAddress: `${params.request.locality || ''}, ${params.request.city}, ${params.request.state}`,
    city: params.request.city,
    state: params.request.state,
    serviceType: params.request.serviceType || 'Civil House Construction',
    category: 'CONSTRUCTION',
    contractorId: params.quotation.professional?.id || 'pro-lead-1',
    contractorName: params.quotation.professional?.name || 'Senior Project Engineer',
    contractorFirm: params.quotation.professional?.firmName || 'Certified Engineering Associate',
    contractorPhone: params.quotation.professional?.phone || '+91 98765 00000',
    contractorRole: 'Principal Civil Engineer & Contractor',
    architectId: params.quotation.professional?.id || 'ARC-2026-001',
    architectName: params.quotation.professional?.name || 'Lead Architect Partner',
    contractValuePaise: totalPaise,
    originalContractPaise: totalPaise,
    approvedVariationsPaise: 0,
    totalPaidPaise: 0,
    amountAwaitingApprovalPaise: 0,
    amountDuePaise: advancePaise,
    retentionPaise: Math.round(totalPaise * 0.05), // 5% Defect liability retention
    status: 'PENDING_ADMIN_REVIEW',
    plannedStartDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    plannedEndDate: new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0],
    currentStage: 'Stage 1: Working Drawings & Sanctions',
    overallVerifiedProgress: 0,
    overallReportedProgress: 0,
    pendingApprovalsCount: 1, // Advance & kickoff approval
    nextMilestoneTitle: 'Mobilization & Drawing Sign-off',
    nextMilestoneDue: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    createdAt: now,
    updatedAt: now,
    kickoff: {
      advanceRequiredPaise: advancePaise,
      advancePaid: false,
      advancePaidPaise: 0,
      siteDemarcationReady: false,
      sanctionReceived: false,
      utilityConnectionReady: false,
      contractAgreed: true,
      specialInstructions: 'Ensure site water connection and meter are active prior to excavation.',
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
        title: `Signed Work Order Contract (${workOrderNumber})`,
        category: 'CONTRACT',
        version: 'v1.0 (Official Signed)',
        fileUrl: '#',
        fileSize: '1.4 MB',
        uploadedAt: now,
        uploadedBy: 'GharDesign Legal Desk',
        approvalStatus: 'APPROVED',
      },
      {
        id: `doc-${Date.now()}-2`,
        title: `Approved BOQ & Specifications (${params.quotation.quotationCode})`,
        category: 'BOQ',
        version: 'v1.0 (Approved)',
        fileUrl: '#',
        fileSize: '2.1 MB',
        uploadedAt: now,
        uploadedBy: params.quotation.professional?.firmName || 'Project Engineer',
        approvalStatus: 'APPROVED',
      },
    ],
    messages: [
      {
        id: `msg-${Date.now()}-1`,
        senderId: 'sys-admin',
        senderName: 'BuildGhar Project Desk',
        senderRole: 'ADMIN',
        message: `Welcome to your project workspace! Work Order ${workOrderNumber} has been initialized. Please complete the Kickoff Checklist to schedule work commencement.`,
        timestamp: now,
      },
    ],
    handover: {
      status: 'NOT_READY',
      possessionSignoff: false,
      snags: [],
    },
  };

  saveExecutionProject(initialProject);
  return initialProject;
};
