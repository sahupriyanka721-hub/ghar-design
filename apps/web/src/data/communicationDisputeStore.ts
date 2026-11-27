import { broadcastStoreUpdate } from './customerStore.js';
import { holdArchitectPayout } from './financialLedgerStore.js';

// ==============================================================================
// BUILDGHAR COMMUNICATION ROUTER & COMPLAINT/DISPUTE STORE
// Specification: Sections 14 & 15 (Modules 14 & 15)
// Core Rule: Admin acts as Central Router for all business communication
// ==============================================================================

export type MessageSenderRole =
  | 'CUSTOMER'
  | 'ARCHITECT'
  | 'ADMIN'
  | 'INTERIOR_DESIGNER'
  | 'CONTRACTOR'
  | 'VENDOR';
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
  | 'SITE_CONDITION'
  | 'MATERIAL_SELECTION'
  | 'ARCHITECT_COORDINATION'
  | 'CONTRACTOR_COORDINATION'
  | 'INTERIOR_DESIGN_REVIEW';

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
  architectId?: string;
  architectName?: string;
  architectFirm?: string;
  designerId?: string;
  designerName?: string;
  designerFirm?: string;
  contractorId?: string;
  contractorName?: string;
  subject: string;
  category: CommunicationCategory;
  direction:
    | 'CUSTOMER_TO_ARCHITECT'
    | 'ARCHITECT_TO_CUSTOMER'
    | 'DESIGNER_TO_CUSTOMER'
    | 'CUSTOMER_TO_DESIGNER'
    | 'DESIGNER_TO_ARCHITECT'
    | 'ARCHITECT_TO_DESIGNER'
    | 'DESIGNER_TO_CONTRACTOR'
    | 'CONTRACTOR_TO_DESIGNER'
    | 'ADMIN_BROADCAST';
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
  | 'COMMUNICATION_COMPLAINT'
  | 'PAYMENT_COMPLAINTS'
  | 'SCOPE_DISPUTES'
  | 'CUSTOMER_REQUIREMENT_DISPUTES'
  | 'SITE_ACCESS_PROBLEMS'
  | 'MATERIAL_QUALITY_ISSUES'
  | 'PROJECT_DELAY_ISSUES'
  | 'TECHNICAL_ISSUES';

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
  complainantRole: 'CUSTOMER' | 'ARCHITECT' | 'CONTRACTOR' | 'INTERIOR_DESIGNER';
  complainantName: string;
  complainantPhone: string;
  complainantEmail?: string;
  respondentRole: 'ARCHITECT' | 'CUSTOMER' | 'PLATFORM' | 'INTERIOR_DESIGNER' | 'CONTRACTOR';
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
  {
    id: 'TH-INT-2026-001',
    threadCode: 'COMM-INT-2026-1001',
    projectId: 'BG-INT-2026-001',
    projectTitle: 'Modern Minimalist 3BHK Penthouse - Golf Course Rd, Gurugram',
    customerId: 'usr-cust-102',
    customerName: 'Vikramaditya Roy',
    customerPhone: '+91 98112 00099',
    designerId: 'INT-DES-2026-001',
    designerName: 'Aanya Sharma',
    designerFirm: 'Aura Interior Studio',
    subject: 'Living Room Italian Marble Flooring & Cove Lighting Selection',
    category: 'MATERIAL_SELECTION',
    direction: 'DESIGNER_TO_CUSTOMER',
    status: 'FORWARDED',
    latestMessageAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    internalAdminNotes: [
      'Customer has high sensitivity to ceiling drop height. Verified cove profile meets 150mm clearance.',
    ],
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    messages: [
      {
        id: 'MSG-INT-1001-1',
        threadId: 'TH-INT-2026-001',
        senderRole: 'INTERIOR_DESIGNER',
        senderName: 'Aanya Sharma',
        recipientRole: 'CUSTOMER',
        recipientName: 'Vikramaditya Roy',
        content:
          'Namaste Mr. Roy, we have shortlisted Botticino Fiorito Italian Marble for the formal living area along with warm 3000K indirect LED cove profiles. Please review the 3D moodboard attached.',
        timestamp: new Date(Date.now() - 3600000 * 6).toISOString(),
        routingStatus: 'FORWARDED_TO_TARGET',
        forwardedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
        forwardedByAdmin: 'Operations Desk',
        forwardingNotes: 'Reviewed and forwarded by BuildGhar Admin Desk.',
        attachments: [
          { name: 'Botticino_Cove_Moodboard_v2.pdf', url: '#', size: '3.4 MB' },
        ],
      },
      {
        id: 'MSG-INT-1001-2',
        threadId: 'TH-INT-2026-001',
        senderRole: 'CUSTOMER',
        senderName: 'Vikramaditya Roy',
        recipientRole: 'INTERIOR_DESIGNER',
        recipientName: 'Aanya Sharma',
        content:
          'The moodboard looks wonderful. Could we also check if the Italian marble requires pre-sealing before installation to avoid any etching?',
        timestamp: new Date(Date.now() - 3600000 * 4.5).toISOString(),
        routingStatus: 'FORWARDED_TO_TARGET',
        forwardedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
        forwardedByAdmin: 'Operations Desk',
        forwardingNotes: 'Forwarded to designer for technical advice.',
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
  {
    id: 'DISP-INT-2026-001',
    disputeCode: 'DISP-INT-2026-1001',
    projectId: 'BG-INT-2026-001',
    projectTitle: 'Modern Minimalist 3BHK Penthouse - Golf Course Rd, Gurugram',
    complainantRole: 'INTERIOR_DESIGNER',
    complainantName: 'Aanya Sharma',
    complainantPhone: '+91 98110 55990',
    complainantEmail: 'aanya@aurastudio.in',
    respondentRole: 'CONTRACTOR',
    respondentName: 'Apex MEP Contractors',
    disputeType: 'SITE_ACCESS_PROBLEMS',
    priority: 'HIGH',
    subject: 'Electrical Conduiting Delay Impeding False Ceiling Framing',
    description:
      'MEP contractor has not finished ceiling conduit drops in master bedroom, holding up channel installation by 4 days beyond scheduled handover date.',
    evidenceFiles: [
      { name: 'Site_Delay_Ceiling_Conduits.jpg', type: 'IMAGE', url: '#' },
    ],
    status: 'INVESTIGATING',
    assignedAdmin: 'Senior Project Coordinator (Interiors)',
    holdAssociatedPayout: false,
    createdAt: new Date(Date.now() - 86400000 * 1.5).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    auditHistory: [
      {
        timestamp: new Date(Date.now() - 86400000 * 1.5).toISOString(),
        action: 'COMPLAINT_FILED',
        actor: 'Aanya Sharma (Interior Designer)',
        details: 'Reported site access and coordination delay with MEP contractor.',
      },
      {
        timestamp: new Date(Date.now() - 86400000 * 1).toISOString(),
        action: 'INVESTIGATION_OPENED',
        actor: 'Senior Project Coordinator',
        details: 'Dispatched site inspection notice to MEP contractor.',
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
    if (item.associatedPayoutId.startsWith('BG-PO-')) {
      try {
        const interiorStore = localStorage.getItem('gd_interior_payouts_v1');
        if (interiorStore) {
          const list = JSON.parse(interiorStore);
          const pIdx = list.findIndex((p: any) => p.payoutId === item.associatedPayoutId);
          if (pIdx >= 0) {
            list[pIdx].status = 'ON_HOLD';
            localStorage.setItem('gd_interior_payouts_v1', JSON.stringify(list));
          }
        }
      } catch (e) {
        console.warn('Failed to hold interior payout:', e);
      }
    } else {
      holdArchitectPayout(item.associatedPayoutId, `Dispute ${item.disputeCode}: ${item.subject}`);
    }
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
          ? 'Payout frozen under Section 15/16 contract dispute clause.'
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

// ==============================================================================
// 3. SECTION 15 & MANDATORY TEST 7: ROUTED COMMUNICATION METHODS
// ==============================================================================

/**
 * Send a message within a project thread.
 * Core Rule: Message always starts with routingStatus = 'PENDING_ADMIN_ROUTING'
 * Target party CANNOT see this message until Admin reviews and forwards it.
 */
export const sendRoutedMessage = (params: {
  threadId: string;
  senderRole: MessageSenderRole;
  senderName: string;
  recipientRole: MessageSenderRole;
  recipientName: string;
  content: string;
  attachments?: Array<{ name: string; url: string; size?: string }>;
}): CommunicationMessage => {
  const thread = getCommunicationThreadById(params.threadId);
  if (!thread) {
    throw new Error(`Thread not found: ${params.threadId}`);
  }

  const now = new Date().toISOString();
  const newMsg: CommunicationMessage = {
    id: `MSG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    threadId: thread.id,
    senderRole: params.senderRole,
    senderName: params.senderName,
    recipientRole: params.recipientRole,
    recipientName: params.recipientName,
    content: params.content,
    timestamp: now,
    routingStatus: 'PENDING_ADMIN_ROUTING',
    attachments: params.attachments,
  };

  const updatedThread: CommunicationThread = {
    ...thread,
    status: 'PENDING_ADMIN_REVIEW',
    latestMessageAt: now,
    messages: [...thread.messages, newMsg],
    updatedAt: now,
  };

  saveCommunicationThread(updatedThread);
  return newMsg;
};

/**
 * Admin forwards a message to its intended target party (Section 15 & Test 7)
 */
export const adminForwardMessage = (params: {
  threadId: string;
  messageId: string;
  forwardedBy: string;
  forwardingNotes?: string;
}): CommunicationThread | null => {
  return forwardMessageToTarget(params.threadId, params.messageId, {
    forwardedBy: params.forwardedBy,
    forwardingNotes: params.forwardingNotes || 'Reviewed and forwarded by BuildGhar Admin Desk.',
  });
};

/**
 * Get messages visible to a specific user role.
 * - Admin sees all messages and internal notes.
 * - Senders see their own messages (even if pending admin review).
 * - Recipients ONLY see messages once forwarded by Admin ('FORWARDED_TO_TARGET').
 * - Non-admin roles NEVER receive internalAdminNotes!
 */
export const getVisibleMessagesForRole = (
  thread: CommunicationThread,
  role: MessageSenderRole
): CommunicationMessage[] => {
  return thread.messages
    .filter((msg) => {
      if (role === 'ADMIN') return true;
      if (msg.senderRole === role) return true;
      return msg.recipientRole === role && msg.routingStatus === 'FORWARDED_TO_TARGET';
    })
    .map((msg) => {
      if (role !== 'ADMIN') {
        const { internalAdminNotes, ...rest } = msg;
        return rest as CommunicationMessage;
      }
      return msg;
    });
};

/**
 * Section 16 Core Rule:
 * Do not allow one party to silently close a dispute raised by another party.
 */
export const canCloseDispute = (
  disputeId: string,
  actorRole: string
): { allowed: boolean; reason?: string } => {
  if (actorRole === 'ADMIN' || actorRole === 'SUPER_ADMIN') {
    return { allowed: true };
  }
  return {
    allowed: false,
    reason:
      'Do not allow one party to silently close a dispute raised by another party. Disputes can only be resolved and audited by BuildGhar Admin Desk.',
  };
};

/**
 * Close or settle a dispute with strict audit permission check.
 */
export const closeDisputeWithAudit = (
  disputeId: string,
  params: {
    actorRole: string;
    actorName: string;
    resolutionNotes: string;
    decision: ResolutionDecisionType;
  }
): ComplaintDisputeItem => {
  const perm = canCloseDispute(disputeId, params.actorRole);
  if (!perm.allowed) {
    throw new Error(perm.reason || 'Unauthorized dispute closure attempt');
  }

  const res = resolveDispute(disputeId, {
    decision: params.decision,
    resolutionNotes: params.resolutionNotes,
    resolvedBy: params.actorName,
    releaseHold: true,
  });

  if (!res) {
    throw new Error(`Dispute not found: ${disputeId}`);
  }
  return res;
};
