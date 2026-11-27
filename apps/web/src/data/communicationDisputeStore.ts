import { broadcastStoreUpdate } from './customerStore.js';
import { holdArchitectPayout } from './financialLedgerStore.js';

// ==============================================================================
// BUILDGHAR COMMUNICATION ROUTER & COMPLAINT/DISPUTE STORE
// Specification: Sections 14 & 15 (Modules 14 & 15)
// Core Rule: Admin acts as Central Router for all business communication
// ==============================================================================

export type MessageSenderRole = 'CUSTOMER' | 'ARCHITECT' | 'ADMIN';
export type MessageRoutingStatus =
  | 'PENDING_ADMIN_ROUTING'
  | 'FORWARDED_TO_TARGET'
  | 'CLARIFICATION_PENDING'
  | 'HELD_FLAGGED'
  | 'REJECTED';

export type CommunicationCategory =
  | 'DESIGN_INQUIRY'
  | 'TECHNICAL_CLARIFICATION'
  | 'TIMELINE_QUERY'
  | 'BUDGET_REVISION'
  | 'SITE_CONDITION';

export interface CommunicationMessage {
  id: string; // e.g. MSG-1001
  threadId: string;
  senderRole: MessageSenderRole;
  senderName: string;
  recipientRole: MessageSenderRole;
  recipientName: string;
  content: string;
  timestamp: string;
  attachments?: Array<{ name: string; url: string; size?: string }>;
  routingStatus: MessageRoutingStatus;
  forwardedAt?: string;
  forwardedByAdmin?: string;
  forwardingNotes?: string;
  internalAdminNotes?: string; // STRICTLY PRIVATE TO ADMIN
  holdReason?: string;
  clarificationRequest?: string;
}

export interface CommunicationThread {
  id: string; // e.g. TH-2026-001
  threadCode: string;
  projectId: string; // Shared Project ID e.g. BG-2026-0001
  projectTitle: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  architectId: string;
  architectName: string;
  architectFirm: string;
  subject: string;
  category: CommunicationCategory;
  direction: 'CUSTOMER_TO_ARCHITECT' | 'ARCHITECT_TO_CUSTOMER';
  status: 'PENDING_ADMIN_REVIEW' | 'FORWARDED' | 'CLARIFICATION_REQUESTED' | 'HELD' | 'RESOLVED';
  latestMessageAt: string;
  messages: CommunicationMessage[];
  internalAdminNotes?: string[];
  createdAt: string;
  updatedAt: string;
}

export type DisputeCategory =
  | 'QUOTATION_DISPUTE'
  | 'DESIGN_QUALITY_COMPLAINT'
  | 'DELAYED_DELIVERABLES'
  | 'MILESTONE_COMPLETION_DISPUTE'
  | 'PAYMENT_DISPUTE'
  | 'PAYOUT_DISPUTE'
  | 'PROJECT_CANCELLATION'
  | 'COMMUNICATION_COMPLAINT';

export type DisputePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL_URGENT';

export type DisputeStatus =
  | 'OPEN_RECEIVED'
  | 'INVESTIGATING'
  | 'PENDING_CLARIFICATION'
  | 'CORRECTION_IN_PROGRESS'
  | 'RESOLVED'
  | 'REJECTED'
  | 'ESCALATED_SUPER_ADMIN';

export type ResolutionDecisionType =
  | 'CORRECTION_ORDERED'
  | 'FULL_REFUND_APPROVED'
  | 'PARTIAL_REFUND_APPROVED'
  | 'DISMISSED_INVALID'
  | 'MUTUAL_SETTLEMENT'
  | 'PAYOUT_RELEASE_APPROVED';

export interface ComplaintDisputeItem {
  id: string; // e.g. DISP-2026-001
  disputeCode: string; // e.g. DISP-2026-1001
  projectId: string; // BG-2026-XXXX
  projectTitle: string;
  complainantRole: 'CUSTOMER' | 'ARCHITECT' | 'CONTRACTOR';
  complainantName: string;
  complainantPhone: string;
  complainantEmail?: string;
  respondentRole: 'ARCHITECT' | 'CUSTOMER' | 'PLATFORM';
  respondentName: string;
  disputeType: DisputeCategory;
  priority: DisputePriority;
  subject: string;
  description: string;
  evidenceFiles: Array<{ name: string; type: string; url: string }>;
  status: DisputeStatus;
  assignedAdmin: string;
  holdAssociatedPayout: boolean;
  associatedPayoutId?: string;
  resolutionDecision?: ResolutionDecisionType;
  resolutionNotes?: string;
  resolutionDate?: string;
  resolvedBy?: string;
  auditHistory: Array<{ timestamp: string; action: string; actor: string; details: string }>;
  createdAt: string;
  updatedAt: string;
}

// Storage Keys
const STORAGE_KEYS = {
  COMMUNICATIONS: 'gd_central_communication_threads_v2',
  DISPUTES: 'gd_central_complaints_disputes_v2',
};

const safeJsonParse = <T>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (e) {
    console.error(`Failed to parse localStorage[${key}]:`, e);
    return fallback;
  }
};

const safeJsonSave = <T>(key: string, data: T, eventType?: string): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    if (eventType) {
      broadcastStoreUpdate(eventType, data);
    }
  } catch (e) {
    console.error(`Failed to write localStorage[${key}]:`, e);
  }
};

// ==============================================================================
// SEED COMMUNICATIONS (Section 14)
// ==============================================================================
export const getDefaultSeedThreads = (): CommunicationThread[] => [
  {
    id: 'TH-2026-001',
    threadCode: 'COMM-2026-1001',
    projectId: 'BG-2026-0001',
    projectTitle: 'Modern Luxury Villa (G+2) - Super Corridor, Indore',
    customerId: 'CUST-IND-992',
    customerName: 'Sharika Mishra',
    customerPhone: '+91 98765 43210',
    architectId: 'ARC-2026-001',
    architectName: 'Ar. Rajesh Verma',
    architectFirm: 'Verma & Associates Architects',
    subject: 'Vastu Alignment & Master Bedroom North-West Bathroom Query',
    category: 'DESIGN_INQUIRY',
    direction: 'CUSTOMER_TO_ARCHITECT',
    status: 'PENDING_ADMIN_REVIEW',
    latestMessageAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    internalAdminNotes: [
      'Customer wants to verify if bathroom shift interferes with ground floor shear wall.',
      'Check Section 10 structural checklist before forwarding.',
    ],
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    messages: [
      {
        id: 'MSG-1001-1',
        threadId: 'TH-2026-001',
        senderRole: 'CUSTOMER',
        senderName: 'Sharika Mishra',
        recipientRole: 'ARCHITECT',
        recipientName: 'Ar. Rajesh Verma',
        content:
          'Namaste Ar. Rajesh, in the latest concept plan v2.1, can we shift the attached bathroom in the first-floor master bedroom towards the north-west zone? Our family Vastu consultant suggested keeping the north-east corner open for the pooja alcove.',
        timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
        routingStatus: 'PENDING_ADMIN_ROUTING',
        attachments: [
          { name: 'Vastu_Consultant_Marked_Notes.pdf', url: '#', size: '1.2 MB' },
        ],
      },
    ],
  },
  {
    id: 'TH-2026-002',
    threadCode: 'COMM-2026-1002',
    projectId: 'BG-2026-0002',
    projectTitle: 'Independent Residential House (G+1) - Gurugram Sector 57',
    customerId: 'usr-cust-102',
    customerName: 'Vikramaditya Roy',
    customerPhone: '+91 98112 00099',
    architectId: 'ARC-2026-003',
    architectName: 'Ar. Sneha Kulkarni',
    architectFirm: 'Sneha Kulkarni Architectural Atelier',
    subject: 'HUDA Setback Norms & Municipal Elevation Compliance',
    category: 'TECHNICAL_CLARIFICATION',
    direction: 'ARCHITECT_TO_CUSTOMER',
    status: 'FORWARDED',
    latestMessageAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    internalAdminNotes: [
      'Elevation drawings reviewed by BuildGhar Chief Architect. Meets 2.4m front setback.',
    ],
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    messages: [
      {
        id: 'MSG-1002-1',
        threadId: 'TH-2026-002',
        senderRole: 'ARCHITECT',
        senderName: 'Ar. Sneha Kulkarni',
        recipientRole: 'CUSTOMER',
        recipientName: 'Vikramaditya Roy',
        content:
          'Dear Mr. Roy, please find attached the revised front elevation matching HUDA municipal bye-laws. We adjusted the cantilever balcony projection from 1.5m to 1.2m to ensure instantaneous approval from DTCP Haryana.',
        timestamp: new Date(Date.now() - 86400000 * 1.5).toISOString(),
        routingStatus: 'FORWARDED_TO_TARGET',
        forwardedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
        forwardedByAdmin: 'Super Admin',
        forwardingNotes: 'Verified against Haryana Building Code 2017 Chapter 4 setbacks. Approved for customer view.',
        attachments: [
          { name: 'Elevation_DTCP_Compliant_v3.dwg', url: '#', size: '4.8 MB' },
        ],
      },
      {
        id: 'MSG-1002-2',
        threadId: 'TH-2026-002',
        senderRole: 'CUSTOMER',
        senderName: 'Vikramaditya Roy',
        recipientRole: 'ARCHITECT',
        recipientName: 'Ar. Sneha Kulkarni',
        content:
          'Thank you Ar. Sneha & BuildGhar team. The revised 1.2m projection looks balanced and we are glad it complies with the municipal guidelines.',
        timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
        routingStatus: 'FORWARDED_TO_TARGET',
        forwardedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
        forwardedByAdmin: 'Operations Desk',
        forwardingNotes: 'Customer satisfaction acknowledged.',
      },
    ],
  },
];

// ==============================================================================
// SEED COMPLAINTS & DISPUTES (Section 15)
// ==============================================================================
export const getDefaultSeedDisputes = (): ComplaintDisputeItem[] => [
  {
    id: 'DISP-2026-001',
    disputeCode: 'DISP-2026-1001',
    projectId: 'BG-2026-0002',
    projectTitle: 'Independent Residential House (G+1) - Gurugram Sector 57',
    complainantRole: 'CUSTOMER',
    complainantName: 'Vikramaditya Roy',
    complainantPhone: '+91 98112 00099',
    complainantEmail: 'v.roy@delhi-enterprises.com',
    respondentRole: 'ARCHITECT',
    respondentName: 'Ar. Sneha Kulkarni',
    disputeType: 'DELAYED_DELIVERABLES',
    priority: 'HIGH',
    subject: 'Municipal Sanction Submission Delayed by 6 Calendar Days',
    description:
      'Milestone 1 contract states that structural framing and municipal submission package must be finalized within 14 days of kickoff. It has been 20 days and the portal was awaiting elevation sanction.',
    evidenceFiles: [
      { name: 'Milestone_1_Agreement_Clause_7.pdf', type: 'PDF', url: '#' },
      { name: 'Portal_Submission_Timeline_Audit.png', type: 'IMAGE', url: '#' },
    ],
    status: 'INVESTIGATING',
    assignedAdmin: 'Grievance Officer (Legal & Compliance)',
    holdAssociatedPayout: true,
    associatedPayoutId: 'PAYOUT-2026-003',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    auditHistory: [
      {
        timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
        action: 'COMPLAINT_FILED',
        actor: 'Vikramaditya Roy (Customer)',
        details: 'Grievance filed under Clause 7 Delayed Deliverables.',
      },
      {
        timestamp: new Date(Date.now() - 86400000 * 1.8).toISOString(),
        action: 'PAYOUT_HELD',
        actor: 'Admin System',
        details: 'Escrow release frozen for Milestone 1 pending investigation.',
      },
      {
        timestamp: new Date(Date.now() - 86400000 * 1).toISOString(),
        action: 'INVESTIGATION_OPENED',
        actor: 'Grievance Officer',
        details: 'Architect requested to furnish DTCP portal acknowledgment receipt.',
      },
    ],
  },
  {
    id: 'DISP-2026-002',
    disputeCode: 'DISP-2026-1002',
    projectId: 'BG-2026-0001',
    projectTitle: 'Modern Luxury Villa (G+2) - Super Corridor, Indore',
    complainantRole: 'ARCHITECT',
    complainantName: 'Ar. Rajesh Verma',
    complainantPhone: '+91 98112 34567',
    complainantEmail: 'rajesh.verma@vermaarchitects.com',
    respondentRole: 'CUSTOMER',
    respondentName: 'Sharika Mishra',
    disputeType: 'DESIGN_QUALITY_COMPLAINT',
    priority: 'MEDIUM',
    subject: 'Excess Revision Request Beyond Standard Scope (4th Layout Redesign)',
    description:
      'Homeowner is requesting a 4th complete structural grid overhaul after approving Milestone 2 concept zoning. Agreement specifies maximum 2 major floorplan iterations.',
    evidenceFiles: [
      { name: 'Design_Revision_History_Log.pdf', type: 'PDF', url: '#' },
    ],
    status: 'PENDING_CLARIFICATION',
    assignedAdmin: 'Chief Architect / Technical Reviewer',
    holdAssociatedPayout: false,
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    auditHistory: [
      {
        timestamp: new Date(Date.now() - 86400000 * 4).toISOString(),
        action: 'COMPLAINT_FILED',
        actor: 'Ar. Rajesh Verma (Architect)',
        details: 'Reported scope creep on floorplan revisions.',
      },
      {
        timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
        action: 'ADMIN_PROPOSAL_SENT',
        actor: 'Chief Architect',
        details: 'Proposed standard Change Order for ₹15,000 for additional architectural drafting.',
      },
    ],
  },
];

// ==============================================================================
// 1. COMMUNICATION ROUTER METHODS (Section 14)
// ==============================================================================
export const getCommunicationThreads = (): CommunicationThread[] => {
  let list = safeJsonParse<CommunicationThread[]>(STORAGE_KEYS.COMMUNICATIONS, []);
  if (!list || list.length === 0) {
    list = getDefaultSeedThreads();
    safeJsonSave(STORAGE_KEYS.COMMUNICATIONS, list);
  }
  return list;
};

export const getCommunicationThreadById = (threadId: string): CommunicationThread | null => {
  const all = getCommunicationThreads();
  return all.find((t) => t.id === threadId || t.threadCode === threadId) || null;
};

export const saveCommunicationThread = (thread: CommunicationThread): CommunicationThread => {
  const all = getCommunicationThreads();
  const idx = all.findIndex((t) => t.id === thread.id);
  let updated: CommunicationThread[];
  if (idx >= 0) {
    updated = [...all];
    updated[idx] = thread;
  } else {
    updated = [thread, ...all];
  }
  safeJsonSave(STORAGE_KEYS.COMMUNICATIONS, updated, 'COMMUNICATION_THREADS_UPDATED');
  return thread;
};

/**
 * Admin forwards message to target party (Customer -> Architect OR Architect -> Customer)
 */
export const forwardMessageToTarget = (
  threadId: string,
  messageId: string,
  params: { forwardedBy: string; forwardingNotes?: string }
): CommunicationThread | null => {
  const thread = getCommunicationThreadById(threadId);
  if (!thread) return null;

  const now = new Date().toISOString();
  const updatedMessages = thread.messages.map((m) => {
    if (m.id === messageId) {
      return {
        ...m,
        routingStatus: 'FORWARDED_TO_TARGET' as MessageRoutingStatus,
        forwardedAt: now,
        forwardedByAdmin: params.forwardedBy,
        forwardingNotes: params.forwardingNotes,
      };
    }
    return m;
  });

  const hasPending = updatedMessages.some((m) => m.routingStatus === 'PENDING_ADMIN_ROUTING');
  const updatedThread: CommunicationThread = {
    ...thread,
    status: hasPending ? 'PENDING_ADMIN_REVIEW' : 'FORWARDED',
    messages: updatedMessages,
    updatedAt: now,
  };

  saveCommunicationThread(updatedThread);
  return updatedThread;
};

/**
 * Admin asks the sender for clarification before routing
 */
export const requestClarificationOnMessage = (
  threadId: string,
  messageId: string,
  params: { requestedBy: string; reason: string }
): CommunicationThread | null => {
  const thread = getCommunicationThreadById(threadId);
  if (!thread) return null;

  const now = new Date().toISOString();
  const updatedMessages = thread.messages.map((m) => {
    if (m.id === messageId) {
      return {
        ...m,
        routingStatus: 'CLARIFICATION_PENDING' as MessageRoutingStatus,
        clarificationRequest: params.reason,
      };
    }
    return m;
  });

  const updatedThread: CommunicationThread = {
    ...thread,
    status: 'CLARIFICATION_REQUESTED',
    messages: updatedMessages,
    updatedAt: now,
  };

  saveCommunicationThread(updatedThread);
  return updatedThread;
};

/**
 * Admin holds or rejects inappropriate/contractually void message
 */
export const holdRejectMessage = (
  threadId: string,
  messageId: string,
  params: { heldBy: string; reason: string; action: 'HELD' | 'REJECTED' }
): CommunicationThread | null => {
  const thread = getCommunicationThreadById(threadId);
  if (!thread) return null;

  const now = new Date().toISOString();
  const updatedMessages = thread.messages.map((m) => {
    if (m.id === messageId) {
      return {
        ...m,
        routingStatus: (params.action === 'HELD' ? 'HELD_FLAGGED' : 'REJECTED') as MessageRoutingStatus,
        holdReason: params.reason,
      };
    }
    return m;
  });

  const updatedThread: CommunicationThread = {
    ...thread,
    status: 'HELD',
    messages: updatedMessages,
    updatedAt: now,
  };

  saveCommunicationThread(updatedThread);
  return updatedThread;
};

/**
 * Admin adds internal private note (NEVER visible to Customer or Architect)
 */
export const addAdminInternalNote = (threadId: string, note: string): CommunicationThread | null => {
  const thread = getCommunicationThreadById(threadId);
  if (!thread) return null;

  const currentNotes = thread.internalAdminNotes || [];
  const updatedThread: CommunicationThread = {
    ...thread,
    internalAdminNotes: [...currentNotes, note],
    updatedAt: new Date().toISOString(),
  };

  saveCommunicationThread(updatedThread);
  return updatedThread;
};

/**
 * Admin injects official routing message or mediation advice
 */
export const sendAdminRouterMessage = (
  threadId: string,
  params: { content: string; targetRole: 'CUSTOMER' | 'ARCHITECT'; adminName: string }
): CommunicationThread | null => {
  const thread = getCommunicationThreadById(threadId);
  if (!thread) return null;

  const now = new Date().toISOString();
  const recipientName =
    params.targetRole === 'CUSTOMER' ? thread.customerName : thread.architectName;

  const newMsg: CommunicationMessage = {
    id: `MSG-${Date.now()}`,
    threadId: thread.id,
    senderRole: 'ADMIN',
    senderName: params.adminName,
    recipientRole: params.targetRole,
    recipientName,
    content: params.content,
    timestamp: now,
    routingStatus: 'FORWARDED_TO_TARGET',
    forwardedAt: now,
    forwardedByAdmin: params.adminName,
  };

  const updatedThread: CommunicationThread = {
    ...thread,
    latestMessageAt: now,
    messages: [...thread.messages, newMsg],
    updatedAt: now,
  };

  saveCommunicationThread(updatedThread);
  return updatedThread;
};

// ==============================================================================
// 2. COMPLAINT & DISPUTE RESOLUTION METHODS (Section 15)
// ==============================================================================
export const getComplaintDisputes = (): ComplaintDisputeItem[] => {
  let list = safeJsonParse<ComplaintDisputeItem[]>(STORAGE_KEYS.DISPUTES, []);
  if (!list || list.length === 0) {
    list = getDefaultSeedDisputes();
    safeJsonSave(STORAGE_KEYS.DISPUTES, list);
  }
  return list;
};

export const getComplaintDisputeById = (id: string): ComplaintDisputeItem | null => {
  const all = getComplaintDisputes();
  return all.find((d) => d.id === id || d.disputeCode === id) || null;
};

export const saveComplaintDispute = (dispute: ComplaintDisputeItem): ComplaintDisputeItem => {
  const all = getComplaintDisputes();
  const idx = all.findIndex((d) => d.id === dispute.id);
  let updated: ComplaintDisputeItem[];
  if (idx >= 0) {
    updated = [...all];
    updated[idx] = dispute;
  } else {
    updated = [dispute, ...all];
  }
  safeJsonSave(STORAGE_KEYS.DISPUTES, updated, 'COMPLAINTS_DISPUTES_UPDATED');
  return dispute;
};

/**
 * Assign complaint to an Admin officer
 */
export const assignDisputeOfficer = (
  disputeId: string,
  officerName: string
): ComplaintDisputeItem | null => {
  const item = getComplaintDisputeById(disputeId);
  if (!item) return null;

  const now = new Date().toISOString();
  const updated: ComplaintDisputeItem = {
    ...item,
    assignedAdmin: officerName,
    status: item.status === 'OPEN_RECEIVED' ? 'INVESTIGATING' : item.status,
    updatedAt: now,
    auditHistory: [
      ...item.auditHistory,
      {
        timestamp: now,
        action: 'OFFICER_ASSIGNED',
        actor: 'Admin',
        details: `Assigned to ${officerName} for investigation.`,
      },
    ],
  };

  saveComplaintDispute(updated);
  return updated;
};

/**
 * Update Priority or Status of dispute
 */
export const updateDisputeStatus = (
  disputeId: string,
  params: { status: DisputeStatus; priority?: DisputePriority; actor: string; notes: string }
): ComplaintDisputeItem | null => {
  const item = getComplaintDisputeById(disputeId);
  if (!item) return null;

  const now = new Date().toISOString();
  const updated: ComplaintDisputeItem = {
    ...item,
    status: params.status,
    priority: params.priority || item.priority,
    updatedAt: now,
    auditHistory: [
      ...item.auditHistory,
      {
        timestamp: now,
        action: `STATUS_${params.status}`,
        actor: params.actor,
        details: params.notes,
      },
    ],
  };

  saveComplaintDispute(updated);
  return updated;
};

/**
 * Freeze or release associated payout
 */
export const toggleDisputePayoutHold = (
  disputeId: string,
  hold: boolean,
  actor: string
): ComplaintDisputeItem | null => {
  const item = getComplaintDisputeById(disputeId);
  if (!item) return null;

  if (hold && item.associatedPayoutId) {
    holdArchitectPayout(item.associatedPayoutId, `Dispute ${item.disputeCode}: ${item.subject}`);
  }

  const now = new Date().toISOString();
  const updated: ComplaintDisputeItem = {
    ...item,
    holdAssociatedPayout: hold,
    updatedAt: now,
    auditHistory: [
      ...item.auditHistory,
      {
        timestamp: now,
        action: hold ? 'PAYOUT_FROZEN' : 'PAYOUT_HOLD_RELEASED',
        actor,
        details: hold
          ? 'Architect payout frozen under Section 15 contract dispute clause.'
          : 'Payout hold released by Admin.',
      },
    ],
  };

  saveComplaintDispute(updated);
  return updated;
};

/**
 * Record resolution decision (correction, refund, dismissal, mutual settlement)
 */
export const resolveDispute = (
  disputeId: string,
  params: {
    decision: ResolutionDecisionType;
    resolutionNotes: string;
    resolvedBy: string;
    releaseHold?: boolean;
  }
): ComplaintDisputeItem | null => {
  const item = getComplaintDisputeById(disputeId);
  if (!item) return null;

  const now = new Date().toISOString();
  const updated: ComplaintDisputeItem = {
    ...item,
    status: 'RESOLVED',
    resolutionDecision: params.decision,
    resolutionNotes: params.resolutionNotes,
    resolutionDate: now,
    resolvedBy: params.resolvedBy,
    holdAssociatedPayout: params.releaseHold === true ? false : item.holdAssociatedPayout,
    updatedAt: now,
    auditHistory: [
      ...item.auditHistory,
      {
        timestamp: now,
        action: 'DISPUTE_RESOLVED',
        actor: params.resolvedBy,
        details: `Decision: ${params.decision}. Notes: ${params.resolutionNotes}`,
      },
    ],
  };

  saveComplaintDispute(updated);
  return updated;
};

/**
 * Escalate to Super Admin
 */
export const escalateDisputeToSuperAdmin = (
  disputeId: string,
  params: { escalatedBy: string; reason: string }
): ComplaintDisputeItem | null => {
  const item = getComplaintDisputeById(disputeId);
  if (!item) return null;

  const now = new Date().toISOString();
  const updated: ComplaintDisputeItem = {
    ...item,
    status: 'ESCALATED_SUPER_ADMIN',
    priority: 'CRITICAL_URGENT',
    updatedAt: now,
    auditHistory: [
      ...item.auditHistory,
      {
        timestamp: now,
        action: 'ESCALATED_SUPER_ADMIN',
        actor: params.escalatedBy,
        details: `Escalated to Super Admin: ${params.reason}`,
      },
    ],
  };

  saveComplaintDispute(updated);
  return updated;
};
