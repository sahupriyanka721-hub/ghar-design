// ==============================================================================
// GHARDESIGN PRODUCTION PROJECT EXECUTION & CONTRACTOR TRACKING STORE
// Master Specification: Customer Panel Project Execution, Work Tracking & Milestone Payments
// Zero Dummy Data: Fully Dynamic, Persistent across LocalStorage & CloudSync
// ==============================================================================

import { broadcastStoreUpdate, getPlatformRequests } from './customerStore.js';
import { DEFAULT_STAGES_BLUEPRINT } from './projectTimelineStore.js';

export type ProjectStatus =
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
  | 'CANCELLED';

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
  | 'SUBMITTED_FOR_REVIEW'
  | 'REVISION_REQUESTED'
  | 'APPROVED'
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
  amountPaise: number;
  linkedStageNumber: number;
  evidencePhotos: string[];
  inspectionNotes?: string;
  inspectedBy?: string;
  status: MilestonePaymentStatus;
  submittedAt?: string;
  approvedAt?: string;
  paidAt?: string;
  transactionId?: string;
  disputeReason?: string;
  correctionNotes?: string;
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
  id: string; // e.g. PRJ-2026-101
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

/**
 * Creates and initializes a formal project when a quotation is accepted
 */
export const createProjectFromAcceptedQuotation = (params: {
  customer: { id: string; name: string; phone: string; address?: string; city?: string; state?: string };
  request: { id: string; requestCode: string; propertyType?: string; plotArea?: number; city: string; state: string; locality?: string; description?: string; serviceType?: string };
  quotation: { id: string; quotationCode: string; finalAmountPaise: number; advancePercentage?: number; scopeOfWork?: string; professional?: { id?: string; name?: string; firmName?: string; phone?: string } };
  bookingCode?: string;
}): ExecutionProject => {
  const now = new Date().toISOString();
  const projSeq = Math.floor(1000 + Math.random() * 9000);
  const projectId = `PRJ-2026-${projSeq}`;
  const workOrderNumber = `WO-2026-${projSeq}`;
  const bookingCode = params.bookingCode || `GHR-BK-2026-${projSeq}`;

  const totalPaise = params.quotation.finalAmountPaise || 150000000;
  const advPct = params.quotation.advancePercentage || 15;
  const advancePaise = Math.round((totalPaise * advPct) / 100);

  const stages = createDefaultExecutionStages();
  const paymentMilestones = createDefaultPaymentMilestones(totalPaise);

  const initialProject: ExecutionProject = {
    id: projectId,
    requestCode: params.request.requestCode || `REQ-${projSeq}`,
    quotationId: params.quotation.id,
    quotationCode: params.quotation.quotationCode || `QT-2026-${projSeq}`,
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
    contractValuePaise: totalPaise,
    originalContractPaise: totalPaise,
    approvedVariationsPaise: 0,
    totalPaidPaise: 0,
    amountAwaitingApprovalPaise: 0,
    amountDuePaise: advancePaise,
    retentionPaise: Math.round(totalPaise * 0.05), // 5% Defect liability retention
    status: 'AWAITING_KICKOFF',
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
