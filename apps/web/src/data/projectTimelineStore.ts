// ==============================================================================
// GHARDESIGN PROJECT TIMELINE & REAL SITE WORK PROGRESS STORE
// Authentic IS 456 & CPWD 10-Stage Milestone Progress Tracking & Audit Trail
// ==============================================================================

import { broadcastStoreUpdate } from './customerStore.js';

export interface ProjectMilestone {
  id: string;
  stageNumber: number;
  name: string;
  category: 'PLANNING' | 'FOUNDATION' | 'RCC_STRUCTURE' | 'MASONRY' | 'FINISHING' | 'HANDOVER';
  description: string;
  weightagePercent: number; // Sums to 100%
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';
  completionPercent: number; // 0 to 100%
  startDate?: string;
  completedDate?: string;
  lastUpdatedAt: string;
  lastUpdatedBy: string;
  lastUpdatedRole: 'PROFESSIONAL' | 'ADMIN' | 'CUSTOMER';
  notes?: string;
  sitePhotoUrl?: string;
  inspectedBy?: string;
}

export interface ProjectTimelineLog {
  id: string;
  timestamp: string;
  stageNumber: number;
  stageName: string;
  action: string;
  previousPercent: number;
  newPercent: number;
  newStatus: string;
  updatedBy: string;
  updatedByRole: string;
  notes?: string;
  sitePhotoUrl?: string;
}

export interface ProjectTimeline {
  projectId: string; // matches Request ID or Code
  projectCode: string;
  projectTitle: string;
  customerName: string;
  customerPhone: string;
  city: string;
  locality: string;
  builtUpAreaSqFt?: number;
  assignedProfessionalName?: string;
  assignedProfessionalRole?: string;
  totalProgressPercent: number; // 0 to 100%
  createdAt: string;
  lastUpdatedAt: string;
  targetCompletionDate?: string;
  milestones: ProjectMilestone[];
  logs: ProjectTimelineLog[];
}

const STORAGE_PREFIX = 'gd_project_timeline_';
const ALL_TIMELINES_INDEX_KEY = 'gd_all_project_timelines_index';

// Official CPWD Benchmark 10-Stage Milestone Blueprint
export const DEFAULT_STAGES_BLUEPRINT = [
  {
    stageNumber: 1,
    name: 'Engineering Drawings & Municipal Sanction',
    category: 'PLANNING' as const,
    weightagePercent: 8,
    description: 'Vastu-compliant 2D floor plans, 3D elevations, structural RCC details & municipal map sanction.',
  },
  {
    stageNumber: 2,
    name: 'Site Clearing, Soil Investigation & Excavation',
    category: 'FOUNDATION' as const,
    weightagePercent: 7,
    description: 'Safe site layout demarcation, soil load-bearing capacity test, and mechanized earthwork excavation.',
  },
  {
    stageNumber: 3,
    name: 'PCC Bed & RCC Foundation Footings',
    category: 'FOUNDATION' as const,
    weightagePercent: 12,
    description: 'Anti-termite treatment, plain cement concrete (PCC) bed, column footing cage rebar & M25 concrete pouring.',
  },
  {
    stageNumber: 4,
    name: 'Plinth Beam Casting, DPC & Backfilling',
    category: 'FOUNDATION' as const,
    weightagePercent: 10,
    description: 'Tie plinth beam shuttering and casting, damp-proof course (DPC) membrane, and compacted earth filling.',
  },
  {
    stageNumber: 5,
    name: 'Ground Floor RCC Columns & Roof Slab',
    category: 'RCC_STRUCTURE' as const,
    weightagePercent: 18,
    description: 'Vertical column casting, slab staging/centering, 2-way reinforcement steel tying & pump casting.',
  },
  {
    stageNumber: 6,
    name: 'Upper Floor Columns & Terrace Slab',
    category: 'RCC_STRUCTURE' as const,
    weightagePercent: 15,
    description: 'First floor column raising, beam shuttering, terrace slab reinforcement, 21-day pond curing.',
  },
  {
    stageNumber: 7,
    name: 'Red Clay Brick Masonry & Lintel Bands',
    category: 'MASONRY' as const,
    weightagePercent: 10,
    description: '9-inch perimeter brick walls, 4.5-inch partition walls, door/window RCC lintels and chajjas.',
  },
  {
    stageNumber: 8,
    name: 'Internal/External Plaster & Waterproofing',
    category: 'FINISHING' as const,
    weightagePercent: 8,
    description: '12mm double-coat sand-faced cement plaster, chicken mesh joint strapping & terrace chemical waterproofing.',
  },
  {
    stageNumber: 9,
    name: 'MEP (Plumbing & Electrical) & Vitrified Flooring',
    category: 'FINISHING' as const,
    weightagePercent: 7,
    description: 'Concealed CPVC/UPVC waterlines, fire-retardant wiring conduits, and nano-polished floor tile laying.',
  },
  {
    stageNumber: 10,
    name: 'Final Paint, Sanitary Fittings & Handover',
    category: 'HANDOVER' as const,
    weightagePercent: 5,
    description: '3-coat wall putty + luxury acrylic emulsion, Jaquar/Kohler sanitary fitments, snagging & keys handover.',
  },
];

/**
 * Calculates weighted project completion percentage
 */
export const calculateTotalProgress = (milestones: ProjectMilestone[]): number => {
  let weightedSum = 0;
  for (const m of milestones) {
    weightedSum += (m.completionPercent * m.weightagePercent) / 100;
  }
  return Math.min(100, Math.round(weightedSum));
};

/**
 * Initializes a new clean Timeline for a project
 */
export const createInitialTimeline = (
  projectId: string,
  projectMeta: {
    projectCode?: string;
    projectTitle?: string;
    customerName?: string;
    customerPhone?: string;
    city?: string;
    locality?: string;
    builtUpAreaSqFt?: number;
    assignedProfessionalName?: string;
  }
): ProjectTimeline => {
  const now = new Date().toISOString();

  const milestones: ProjectMilestone[] = DEFAULT_STAGES_BLUEPRINT.map((b) => ({
    id: `mstone-${projectId}-${b.stageNumber}`,
    stageNumber: b.stageNumber,
    name: b.name,
    category: b.category,
    description: b.description,
    weightagePercent: b.weightagePercent,
    status: b.stageNumber === 1 ? 'IN_PROGRESS' : 'PENDING',
    completionPercent: 0,
    lastUpdatedAt: now,
    lastUpdatedBy: projectMeta.assignedProfessionalName || 'Lead Project Engineer',
    lastUpdatedRole: 'PROFESSIONAL',
    notes: undefined,
  }));

  const initialLog: ProjectTimelineLog = {
    id: `log-${Date.now()}-init`,
    timestamp: now,
    stageNumber: 1,
    stageName: milestones[0].name,
    action: 'Project Timeline Created & Initialized',
    previousPercent: 0,
    newPercent: 0,
    newStatus: 'IN_PROGRESS',
    updatedBy: projectMeta.assignedProfessionalName || projectMeta.customerName || 'System',
    updatedByRole: 'PROFESSIONAL',
    notes: 'Kickoff: Stage 1 Engineering drawings initiated.',
  };

  const timeline: ProjectTimeline = {
    projectId,
    projectCode: projectMeta.projectCode || `PRJ-${projectId.slice(-6).toUpperCase()}`,
    projectTitle: projectMeta.projectTitle || 'Civil Construction Project',
    customerName: projectMeta.customerName || 'Customer',
    customerPhone: projectMeta.customerPhone || '',
    city: projectMeta.city || '',
    locality: projectMeta.locality || '',
    builtUpAreaSqFt: projectMeta.builtUpAreaSqFt || 0,
    assignedProfessionalName: projectMeta.assignedProfessionalName || 'Awaiting Project Engineer Allocation',
    assignedProfessionalRole: projectMeta.assignedProfessionalName ? 'Lead Project Engineer' : 'Pending Allocation',
    totalProgressPercent: 0,
    createdAt: now,
    lastUpdatedAt: now,
    milestones,
    logs: [initialLog],
  };

  saveTimelineToStorage(timeline);
  return timeline;
};

/**
 * Saves timeline to local storage and updates index
 */
export const saveTimelineToStorage = (timeline: ProjectTimeline): void => {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${timeline.projectId}`, JSON.stringify(timeline));

    // Update global index of timelines
    const rawIndex = localStorage.getItem(ALL_TIMELINES_INDEX_KEY);
    let index: string[] = rawIndex ? JSON.parse(rawIndex) : [];
    if (!index.includes(timeline.projectId)) {
      index.push(timeline.projectId);
      localStorage.setItem(ALL_TIMELINES_INDEX_KEY, JSON.stringify(index));
    }

    broadcastStoreUpdate('TIMELINE_UPDATED', { projectId: timeline.projectId, progress: timeline.totalProgressPercent });
  } catch (err) {
    console.error('Error saving timeline to localStorage:', err);
  }
};

/**
 * Retrieves timeline for a project, or initializes if missing
 */
export const getProjectTimeline = (
  projectId: string,
  projectMeta?: {
    projectCode?: string;
    projectTitle?: string;
    customerName?: string;
    customerPhone?: string;
    city?: string;
    locality?: string;
    builtUpAreaSqFt?: number;
    assignedProfessionalName?: string;
  }
): ProjectTimeline => {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${projectId}`);
    if (raw) {
      const parsed: ProjectTimeline = JSON.parse(raw);
      if (parsed.milestones && parsed.milestones.length === 10) {
        return parsed;
      }
    }
  } catch (e) {}

  // If not found, create new timeline with genuine details
  return createInitialTimeline(projectId, projectMeta || {});
};

/**
 * REAL UPDATE FUNCTION: Updates milestone completion percentage and logs the action
 */
export const updateMilestoneProgress = (
  projectId: string,
  stageNumber: number,
  update: {
    completionPercent: number; // 0 to 100
    status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';
    notes?: string;
    sitePhotoUrl?: string;
    updatedBy?: string;
    updatedByRole?: 'PROFESSIONAL' | 'ADMIN' | 'CUSTOMER';
  }
): ProjectTimeline => {
  const timeline = getProjectTimeline(projectId);
  const now = new Date().toISOString();

  const milestoneIndex = timeline.milestones.findIndex((m) => m.stageNumber === stageNumber);
  if (milestoneIndex === -1) {
    throw new Error(`Stage ${stageNumber} not found in project timeline.`);
  }

  const current = timeline.milestones[milestoneIndex];
  const previousPercent = current.completionPercent;
  const newPercent = Math.max(0, Math.min(100, Math.round(update.completionPercent)));

  let derivedStatus = update.status;
  if (!derivedStatus) {
    if (newPercent === 100) derivedStatus = 'COMPLETED';
    else if (newPercent > 0) derivedStatus = 'IN_PROGRESS';
    else derivedStatus = 'PENDING';
  }

  // Update Milestone
  const updatedMilestone: ProjectMilestone = {
    ...current,
    completionPercent: newPercent,
    status: derivedStatus,
    lastUpdatedAt: now,
    lastUpdatedBy: update.updatedBy || current.lastUpdatedBy || 'Site Engineer',
    lastUpdatedRole: update.updatedByRole || 'PROFESSIONAL',
    notes: update.notes !== undefined ? update.notes : current.notes,
    sitePhotoUrl: update.sitePhotoUrl || current.sitePhotoUrl,
    completedDate: newPercent === 100 ? (current.completedDate || now) : undefined,
    startDate: newPercent > 0 && !current.startDate ? now : current.startDate,
  };

  timeline.milestones[milestoneIndex] = updatedMilestone;

  // Auto-advance next stage to IN_PROGRESS if current reached 100%
  if (newPercent === 100 && milestoneIndex < timeline.milestones.length - 1) {
    const nextMilestone = timeline.milestones[milestoneIndex + 1];
    if (nextMilestone.status === 'PENDING') {
      timeline.milestones[milestoneIndex + 1] = {
        ...nextMilestone,
        status: 'IN_PROGRESS',
        startDate: now,
        lastUpdatedAt: now,
      };
    }
  }

  // Recalculate Total Overall Progress
  timeline.totalProgressPercent = calculateTotalProgress(timeline.milestones);
  timeline.lastUpdatedAt = now;

  // Append Real Audit Trail Log
  const newLog: ProjectTimelineLog = {
    id: `log-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
    timestamp: now,
    stageNumber,
    stageName: current.name,
    action: `Stage ${stageNumber} progress updated to ${newPercent}% (${derivedStatus.replace('_', ' ')})`,
    previousPercent,
    newPercent,
    newStatus: derivedStatus,
    updatedBy: update.updatedBy || 'Site Engineer',
    updatedByRole: update.updatedByRole || 'PROFESSIONAL',
    notes: update.notes || `Work completed: ${newPercent}%.`,
    sitePhotoUrl: update.sitePhotoUrl,
  };

  timeline.logs = [newLog, ...(timeline.logs || [])];

  // Save to storage
  saveTimelineToStorage(timeline);

  return timeline;
};

/**
 * Returns all active timelines
 */
export const getAllProjectTimelines = (): ProjectTimeline[] => {
  try {
    const rawIndex = localStorage.getItem(ALL_TIMELINES_INDEX_KEY);
    const index: string[] = rawIndex ? JSON.parse(rawIndex) : [];
    return index
      .map((id) => {
        try {
          const raw = localStorage.getItem(`${STORAGE_PREFIX}${id}`);
          return raw ? JSON.parse(raw) : null;
        } catch (e) {
          return null;
        }
      })
      .filter((t): t is ProjectTimeline => t !== null);
  } catch (e) {
    return [];
  }
};
