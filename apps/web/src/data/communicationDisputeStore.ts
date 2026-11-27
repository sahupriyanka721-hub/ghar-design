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
  {
    id: 'TH-2026-003',
    threadCode: 'COMM-2026-1003',
    projectId: 'BG-2026-0003',
    projectTitle: 'Duplex Villa with Swimming Pool - E-City Phase 1, Bengaluru',
    customerId: 'CUST-BLR-003',
    customerName: 'Rahul Sharma',
    customerPhone: '+91 98450 11223',
    architectId: 'ARC-2026-002',
    architectName: 'Ar. Priya Nair',
    architectFirm: 'Studio Verdant Green Architecture',
    subject: 'Structural Beam Sizing & Central Living Room Column-Free Span',
    category: 'TECHNICAL_CLARIFICATION',
    direction: 'CUSTOMER_TO_ARCHITECT',
    status: 'CLARIFICATION_REQUESTED',
    latestMessageAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    internalAdminNotes: [
      'Customer wants 24-foot clear span in living room. Needs structural engineer signoff.',
      'Clarification sent asking customer if false ceiling height can accommodate 450mm downstand beam.',
    ],
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    messages: [
      {
        id: 'MSG-1003-1',
        threadId: 'TH-2026-003',
        senderRole: 'CUSTOMER',
        senderName: 'Rahul Sharma',
        recipientRole: 'ARCHITECT',
        recipientName: 'Ar. Priya Nair',
        content:
          'Can we remove the central column near the dining foyer to keep a seamless open hall from the entry to the pool deck?',
        timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
        routingStatus: 'CLARIFICATION_PENDING',
        clarificationRequest:
          'Please specify if you prefer an inverted hidden beam on the first floor slab or a conventional drop beam with false ceiling encasing.',
      },
    ],
  },
  {
    id: 'TH-2026-004',
    threadCode: 'COMM-2026-1004',
    projectId: 'BG-2026-0004',
    projectTitle: 'Heritage Courtyard Bungalow - Civil Lines, Jaipur',
    customerId: 'CUST-JAI-004',
    customerName: 'Dr. Ramesh Patel',
    customerPhone: '+91 94140 88776',
    architectId: 'ARC-2026-001',
    architectName: 'Ar. Rajesh Verma',
    architectFirm: 'Verma & Associates Architects',
    subject: 'Jodhpur Stone Cladding Specification & Jaali Detail Drawings',
    category: 'DESIGN_INQUIRY',
    direction: 'ARCHITECT_TO_CUSTOMER',
    status: 'FORWARDED',
    latestMessageAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    internalAdminNotes: [
      'Jaali pattern verified for wind load resistance as per NBC 2016 Part 6 Section 3.',
    ],
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    messages: [
      {
        id: 'MSG-1004-1',
        threadId: 'TH-2026-004',
        senderRole: 'ARCHITECT',
        senderName: 'Ar. Rajesh Verma',
        recipientRole: 'CUSTOMER',
        recipientName: 'Dr. Ramesh Patel',
        content:
          'Respected Dr. Patel, we have finalized the 50mm thick hand-carved Jodhpur yellow sandstone screens for the central courtyard. Structural anchoring details are enclosed in the drawing sheet.',
        timestamp: new Date(Date.now() - 3600000 * 10).toISOString(),
        routingStatus: 'FORWARDED_TO_TARGET',
        forwardedAt: new Date(Date.now() - 3600000 * 8).toISOString(),
        forwardedByAdmin: 'Super Admin',
        forwardingNotes: 'Verified stone load anchoring specs. Approved for customer view.',
        attachments: [
          { name: 'Jodhpur_Sandstone_Screen_Detail_v1.pdf', url: '#', size: '2.1 MB' },
        ],
      },
    ],
  },
  {
    id: 'TH-2026-005',
    threadCode: 'COMM-2026-1005',
    projectId: 'BG-2026-0005',
    projectTitle: 'Contemporary Lakeview Residence - Banjara Hills, Hyderabad',
    customerId: 'CUST-HYD-005',
    customerName: 'Ananya Deshmukh',
    customerPhone: '+91 97000 44332',
    architectId: 'ARC-2026-003',
    architectName: 'Ar. Sneha Kulkarni',
    architectFirm: 'Sneha Kulkarni Architectural Atelier',
    subject: 'Electrical BOQ Breakdown & Home Automation Conduit Inclusions',
    category: 'BUDGET_REVISION',
    direction: 'CUSTOMER_TO_ARCHITECT',
    status: 'PENDING_ADMIN_REVIEW',
    latestMessageAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    internalAdminNotes: [
      'Customer seeking itemized rate for KNX bus wiring conduits.',
      'Check if electrical consultant rate falls within standard Telangana PWD schedule of rates.',
    ],
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    messages: [
      {
        id: 'MSG-1005-1',
        threadId: 'TH-2026-005',
        senderRole: 'CUSTOMER',
        senderName: 'Ananya Deshmukh',
        recipientRole: 'ARCHITECT',
        recipientName: 'Ar. Sneha Kulkarni',
        content:
          'Could we get the itemized rate comparison between standard copper conduit wiring versus smart home automation conduits before milestone 3 signoff?',
        timestamp: new Date(Date.now() - 3600000 * 1.5).toISOString(),
        routingStatus: 'PENDING_ADMIN_ROUTING',
        attachments: [
          { name: 'Smart_Home_Automation_Requirement.pdf', url: '#', size: '1.5 MB' },
        ],
      },
    ],
  },
  {
    id: 'TH-2026-006',
    threadCode: 'COMM-2026-1006',
    projectId: 'BG-2026-0001',
    projectTitle: 'Modern Luxury Villa (G+2) - Super Corridor, Indore',
    customerId: 'CUST-IND-992',
    customerName: 'Sharika Mishra',
    customerPhone: '+91 98765 43210',
    architectId: 'ARC-2026-001',
    architectName: 'Ar. Rajesh Verma',
    architectFirm: 'Verma & Associates Architects',
    subject: 'Soil Investigation Report & Raft Foundation Depth Signoff',
    category: 'SITE_CONDITION',
    direction: 'CUSTOMER_TO_ARCHITECT',
    status: 'RESOLVED',
    latestMessageAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    internalAdminNotes: [
      'Geotechnical soil SBC verified at 180 kN/sq.m. Raft footing thickness set to 450mm.',
      'Private note: Client requested expedited approval, verified no surcharge on adjoining boundary.',
      'Final settlement clause 14 passed.',
    ],
    createdAt: new Date(Date.now() - 86400000 * 12).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    messages: [
      {
        id: 'MSG-1006-1',
        threadId: 'TH-2026-006',
        senderRole: 'CUSTOMER',
        senderName: 'Sharika Mishra',
        recipientRole: 'ARCHITECT',
        recipientName: 'Ar. Rajesh Verma',
        content:
          'Attaching the core bore soil test lab results from SGS Lab Indore. Safe bearing capacity is verified at 180 kN/m2. Please proceed with the structural foundation sizing.',
        timestamp: new Date(Date.now() - 86400000 * 7).toISOString(),
        routingStatus: 'FORWARDED_TO_TARGET',
        forwardedAt: new Date(Date.now() - 86400000 * 6.5).toISOString(),
        forwardedByAdmin: 'Super Admin',
        forwardingNotes: 'Soil lab report verified. Forwarded to Ar. Rajesh.',
        attachments: [
          { name: 'SGS_Soil_Bore_Log_Indore.pdf', url: '#', size: '3.1 MB' },
        ],
      },
      {
        id: 'MSG-1006-2',
        threadId: 'TH-2026-006',
        senderRole: 'ARCHITECT',
        senderName: 'Ar. Rajesh Verma',
        recipientRole: 'CUSTOMER',
        recipientName: 'Sharika Mishra',
        content:
          'Soil bearing capacity of 180 kN/m2 is optimal. We have released the structural raft footing drawings and bar bending schedule accordingly.',
        timestamp: new Date(Date.now() - 86400000 * 5.5).toISOString(),
        routingStatus: 'FORWARDED_TO_TARGET',
        forwardedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
        forwardedByAdmin: 'Operations Desk',
        forwardingNotes: 'Raft drawings confirmed and released into Project Vault.',
        attachments: [
          { name: 'Raft_Footing_Foundation_Approved.dwg', url: '#', size: '5.2 MB' },
        ],
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
    id: 'DISP-2026-004',
    disputeCode: 'DISP-2026-1004',
    projectId: 'BG-2026-0001',
    projectTitle: 'Modern Luxury Villa (G+2) - Super Corridor, Indore',
    complainantRole: 'CUSTOMER',
    complainantName: 'Sharika Mishra',
    complainantPhone: '+91 98765 43210',
    complainantEmail: 'sharika.m@gmail.com',
    respondentRole: 'ARCHITECT',
    respondentName: 'Ar. Rajesh Verma',
    disputeType: 'DESIGN_QUALITY_COMPLAINT',
    priority: 'HIGH',
    subject: 'Living Room Column Protrusion Not Shown in 3D Architectural Render',
    description:
      'The approved 3D walkthrough showed a flush open-plan dining space, but structural frame drawing reveals a 350mm column offset obstructing kitchen access.',
    evidenceFiles: [
      { name: '3D_Render_Vs_Structural_Plan.pdf', type: 'PDF', url: '#' },
    ],
    status: 'OPEN_RECEIVED',
    assignedAdmin: 'Chief Architect / Technical Reviewer',
    holdAssociatedPayout: false,
    createdAt: new Date(Date.now() - 86400000 * 1.2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    auditHistory: [
      {
        timestamp: new Date(Date.now() - 86400000 * 1.2).toISOString(),
        action: 'COMPLAINT_FILED',
        actor: 'Sharika Mishra (Customer)',
        details: 'Raised design inconsistency between 3D model and structural engineering detailing.',
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
    disputeType: 'CUSTOMER_REQUIREMENT_DISPUTES',
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
  {
    id: 'DISP-2026-005',
    disputeCode: 'DISP-2026-1005',
    projectId: 'BG-2026-0002',
    projectTitle: 'Independent Residential House (G+1) - Gurugram Sector 57',
    complainantRole: 'ARCHITECT',
    complainantName: 'Ar. Sneha Kulkarni',
    complainantPhone: '+91 98220 11223',
    complainantEmail: 'sneha@kulkarni-designs.in',
    respondentRole: 'CUSTOMER',
    respondentName: 'Vikramaditya Roy',
    disputeType: 'SITE_ACCESS_PROBLEMS',
    priority: 'MEDIUM',
    subject: 'Delayed Boundary Survey Verification & Topography Non-Clearance',
    description:
      'Client delayed boundary demarcation by 10 days while demanding continuous drawing revisions without verified physical benchmarks.',
    evidenceFiles: [
      { name: 'Surveyor_Appointment_Timeline.pdf', type: 'PDF', url: '#' },
    ],
    status: 'OPEN_RECEIVED',
    assignedAdmin: 'Grievance Officer (Legal & Compliance)',
    holdAssociatedPayout: false,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1.5).toISOString(),
    auditHistory: [
      {
        timestamp: new Date(Date.now() - 86400000 * 3).toISOString(),
        action: 'COMPLAINT_FILED',
        actor: 'Ar. Sneha Kulkarni (Architect)',
        details: 'Lodged operational grievance regarding delayed site demarcation.',
      },
    ],
  },
  {
    id: 'DISP-2026-003',
    disputeCode: 'DISP-2026-1003',
    projectId: 'BG-2026-0002',
    projectTitle: 'Independent Residential House (G+1) - Gurugram Sector 57',
    complainantRole: 'CUSTOMER',
    complainantName: 'Vikramaditya Roy',
    complainantPhone: '+91 98112 00099',
    complainantEmail: 'v.roy@delhi-enterprises.com',
    respondentRole: 'PLATFORM',
    respondentName: 'BuildGhar Finance Desk',
    disputeType: 'PAYMENT_DISPUTE',
    priority: 'HIGH',
    subject: 'Double Deduction & Inconsistent GST Slab on Milestone 1 Advance',
    description:
      'Payment transaction TXN-2026-001 billed ₹50,000 plus GST twice due to gateway retry timeout. Requesting immediate refund of duplicate charge.',
    evidenceFiles: [
      { name: 'Bank_Statement_Duplicate_Charge.pdf', type: 'PDF', url: '#' },
      { name: 'Gateway_Transaction_Receipt.pdf', type: 'PDF', url: '#' },
    ],
    status: 'INVESTIGATING',
    assignedAdmin: 'Finance & Payment Desk',
    holdAssociatedPayout: true,
    associatedPayoutId: 'PAYOUT-2026-003',
    createdAt: new Date(Date.now() - 86400000 * 2.5).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    auditHistory: [
      {
        timestamp: new Date(Date.now() - 86400000 * 2.5).toISOString(),
        action: 'DISPUTE_FILED',
        actor: 'Vikramaditya Roy (Customer)',
        details: 'Payment dispute filed with bank duplicate charge slip.',
      },
      {
        timestamp: new Date(Date.now() - 86400000 * 2.4).toISOString(),
        action: 'PAYOUT_FROZEN',
        actor: 'Finance Desk',
        details: 'Milestone escrow hold placed to avoid double payout.',
      },
    ],
  },
  {
    id: 'DISP-2026-006',
    disputeCode: 'DISP-2026-1006',
    projectId: 'BG-2026-0001',
    projectTitle: 'Modern Luxury Villa (G+2) - Super Corridor, Indore',
    complainantRole: 'ARCHITECT',
    complainantName: 'Ar. Rajesh Verma',
    complainantPhone: '+91 98112 34567',
    complainantEmail: 'rajesh.verma@vermaarchitects.com',
    respondentRole: 'PLATFORM',
    respondentName: 'BuildGhar Payout Desk',
    disputeType: 'PAYOUT_DISPUTE',
    priority: 'MEDIUM',
    subject: 'TDS Rate Calculation Discrepancy on Milestone 2 Payout Settlement',
    description:
      'Form 16A professional service TDS was deducted at 10% instead of 2% under section 194C for integrated technical drafting consortium. Requires recalculation.',
    evidenceFiles: [
      { name: 'PAN_TDS_Undertaking_Certificate.pdf', type: 'PDF', url: '#' },
    ],
    status: 'PENDING_CLARIFICATION',
    assignedAdmin: 'Finance & Payment Desk',
    holdAssociatedPayout: true,
    associatedPayoutId: 'PAYOUT-2026-001',
    createdAt: new Date(Date.now() - 86400000 * 3.5).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    auditHistory: [
      {
        timestamp: new Date(Date.now() - 86400000 * 3.5).toISOString(),
        action: 'DISPUTE_FILED',
        actor: 'Ar. Rajesh Verma (Architect)',
        details: 'Submitted Section 194C clarification on withholding tax rate.',
      },
    ],
  },
  {
    id: 'DISP-2026-007',
    disputeCode: 'DISP-2026-1007',
    projectId: 'BG-2026-0003',
    projectTitle: 'Duplex Smart Eco-Home (3BHK) - Whitefield, Bengaluru',
    complainantRole: 'CUSTOMER',
    complainantName: 'Anita Sharma',
    complainantPhone: '+91 99887 76655',
    complainantEmail: 'anita.s@techcorp.com',
    respondentRole: 'ARCHITECT',
    respondentName: 'Ar. Sneha Kulkarni',
    disputeType: 'SCOPE_DISPUTES',
    priority: 'HIGH',
    subject: 'Boundary Setback Discrepancy Violating BBMP Bye-Laws',
    description:
      'The western side setback was planned at 1.2m while BBMP norms require minimum 1.5m for a 12m road frontage, risking municipal fine during inspection.',
    evidenceFiles: [
      { name: 'BBMP_Zonal_Bylaws_Excerpts.pdf', type: 'PDF', url: '#' },
    ],
    status: 'INVESTIGATING',
    assignedAdmin: 'Senior Project Coordinator (Architecture)',
    holdAssociatedPayout: false,
    createdAt: new Date(Date.now() - 86400000 * 2.8).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    auditHistory: [
      {
        timestamp: new Date(Date.now() - 86400000 * 2.8).toISOString(),
        action: 'COMPLAINT_FILED',
        actor: 'Anita Sharma (Customer)',
        details: 'Requested legal zoning setback realignment before ground excavation.',
      },
    ],
  },
  {
    id: 'DISP-2026-008',
    disputeCode: 'DISP-2026-1008',
    projectId: 'BG-2026-0002',
    projectTitle: 'Independent Residential House (G+1) - Gurugram Sector 57',
    complainantRole: 'CUSTOMER',
    complainantName: 'Vikramaditya Roy',
    complainantPhone: '+91 98112 00099',
    respondentRole: 'CONTRACTOR',
    respondentName: 'Apex Civil Contractors',
    disputeType: 'PROJECT_DELAY_ISSUES',
    priority: 'HIGH',
    subject: 'Site Mobilization Delayed by 12 Days Past Demolition Date',
    description:
      'Old structure was cleared 12 days ago but civil contractor has failed to mobilize excavator and shoring machinery, jeopardizing pre-monsoon footing completion.',
    evidenceFiles: [
      { name: 'Demolition_Handover_Receipt.pdf', type: 'PDF', url: '#' },
    ],
    status: 'OPEN_RECEIVED',
    assignedAdmin: 'Senior Project Coordinator (Civil)',
    holdAssociatedPayout: false,
    createdAt: new Date(Date.now() - 86400000 * 1.1).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    auditHistory: [
      {
        timestamp: new Date(Date.now() - 86400000 * 1.1).toISOString(),
        action: 'DISPUTE_FILED',
        actor: 'Vikramaditya Roy (Customer)',
        details: 'Contractor site mobilization delay escalated for operational intervention.',
      },
    ],
  },
  {
    id: 'DISP-2026-009',
    disputeCode: 'DISP-2026-1009',
    projectId: 'BG-2026-0004',
    projectTitle: 'Contemporary Urban Residence - New Town, Kolkata',
    complainantRole: 'CUSTOMER',
    complainantName: 'Suresh Patel',
    complainantPhone: '+91 98300 44556',
    complainantEmail: 'suresh.p@pateltraders.com',
    respondentRole: 'ARCHITECT',
    respondentName: 'Ar. Rajesh Verma',
    disputeType: 'MILESTONE_COMPLETION_DISPUTE',
    priority: 'HIGH',
    subject: 'Milestone 3 Electrical & Plumbing Drawings Missing Invert Levels',
    description:
      'Milestone 3 submission does not include external sewer connection slope grades or rainwater harvesting sump invert levels specified in milestone checklist.',
    evidenceFiles: [
      { name: 'Milestone_3_Checklist_Comparison.pdf', type: 'PDF', url: '#' },
    ],
    status: 'INVESTIGATING',
    assignedAdmin: 'Chief Architect / Technical Reviewer',
    holdAssociatedPayout: true,
    associatedPayoutId: 'PAYOUT-2026-004',
    createdAt: new Date(Date.now() - 86400000 * 3.2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 7).toISOString(),
    auditHistory: [
      {
        timestamp: new Date(Date.now() - 86400000 * 3.2).toISOString(),
        action: 'COMPLAINT_FILED',
        actor: 'Suresh Patel (Customer)',
        details: 'Milestone completion challenged due to missing sanitary plumbing invert levels.',
      },
    ],
  },
  {
    id: 'DISP-2026-010',
    disputeCode: 'DISP-2026-1010',
    projectId: 'BG-2026-0002',
    projectTitle: 'Independent Residential House (G+1) - Gurugram Sector 57',
    complainantRole: 'CUSTOMER',
    complainantName: 'Vikramaditya Roy',
    complainantPhone: '+91 98112 00099',
    respondentRole: 'ARCHITECT',
    respondentName: 'Ar. Sneha Kulkarni',
    disputeType: 'DESIGN_QUALITY_COMPLAINT',
    priority: 'MEDIUM',
    subject: 'Milestone 2 Elevation 3D Visual Rendering Texture Quality Defect',
    description:
      'Elevation renders lack specified Italian travertine cladding texture mapping and ambient evening lighting passes required under Milestone 2 scope.',
    evidenceFiles: [
      { name: 'Milestone_2_Elevation_Render_LowRes.jpg', type: 'IMAGE', url: '#' },
    ],
    status: 'CORRECTION_IN_PROGRESS',
    assignedAdmin: 'Chief Architect / Technical Reviewer',
    holdAssociatedPayout: true,
    associatedPayoutId: 'PAYOUT-2026-003',
    resolutionDecision: 'CORRECTION_ORDERED',
    resolutionNotes: 'Architect committed to delivering 4K high-resolution renders with realistic material shaders by tomorrow evening.',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    auditHistory: [
      {
        timestamp: new Date(Date.now() - 86400000 * 5).toISOString(),
        action: 'COMPLAINT_FILED',
        actor: 'Vikramaditya Roy (Customer)',
        details: 'Grievance on render realism.',
      },
      {
        timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
        action: 'CORRECTION_ORDERED',
        actor: 'Chief Architect',
        details: 'Ordered 4K rerender with physically based materials.',
      },
    ],
  },
  {
    id: 'DISP-2026-011',
    disputeCode: 'DISP-2026-1011',
    projectId: 'BG-2026-0001',
    projectTitle: 'Modern Luxury Villa (G+2) - Super Corridor, Indore',
    complainantRole: 'CUSTOMER',
    complainantName: 'Sharika Mishra',
    complainantPhone: '+91 98765 43210',
    respondentRole: 'ARCHITECT',
    respondentName: 'Ar. Rajesh Verma',
    disputeType: 'COMMUNICATION_COMPLAINT',
    priority: 'MEDIUM',
    subject: 'Mutual Settlement Reached on Landscape Terrace Design Revisions',
    description:
      'Dispute regarding rooftop terrace garden layout revisions resolved via platform mediation. Architect agreed to provide 1 final layout revision; client approved milestone release.',
    evidenceFiles: [
      { name: 'Terrace_Revision_Signed_Agreement.pdf', type: 'PDF', url: '#' },
    ],
    status: 'RESOLVED',
    assignedAdmin: 'Super Admin',
    holdAssociatedPayout: false,
    resolutionDecision: 'MUTUAL_SETTLEMENT',
    resolutionNotes: 'Both parties mutually agreed on scope adjustment with no financial penalties. Milestone payment released.',
    resolutionDate: new Date(Date.now() - 86400000 * 2).toISOString(),
    resolvedBy: 'Super Admin',
    createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    auditHistory: [
      {
        timestamp: new Date(Date.now() - 86400000 * 8).toISOString(),
        action: 'DISPUTE_FILED',
        actor: 'Sharika Mishra (Customer)',
        details: 'Grievance lodged.',
      },
      {
        timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
        action: 'DISPUTE_RESOLVED',
        actor: 'Super Admin',
        details: 'Mutual settlement ratified and escrow release executed.',
      },
    ],
  },
  {
    id: 'DISP-2026-012',
    disputeCode: 'DISP-2026-1012',
    projectId: 'BG-2026-0005',
    projectTitle: 'Traditional Kerala Courtyard Home - Kochi Bypass',
    complainantRole: 'CUSTOMER',
    complainantName: 'Pradeep Menon',
    complainantPhone: '+91 98470 12345',
    respondentRole: 'ARCHITECT',
    respondentName: 'Ar. Sneha Kulkarni',
    disputeType: 'PROJECT_CANCELLATION',
    priority: 'HIGH',
    subject: 'Project Cancellation Settlement & Partial Escrow Refund Released',
    description:
      'Homeowner had to cancel construction due to municipal road widening notification. Refund of unutilized Milestone 2 funds processed after deduction of completed Milestone 1 architectural fees.',
    evidenceFiles: [
      { name: 'Road_Widening_Notice_Kochi.pdf', type: 'PDF', url: '#' },
      { name: 'Escrow_Refund_Calculation_Sheet.pdf', type: 'PDF', url: '#' },
    ],
    status: 'RESOLVED',
    assignedAdmin: 'Grievance Officer (Legal & Compliance)',
    holdAssociatedPayout: false,
    resolutionDecision: 'PARTIAL_REFUND_APPROVED',
    resolutionNotes: 'Partial refund of ₹35,000 processed to customer account. Architect compensated ₹25,000 for preliminary structural detailing.',
    resolutionDate: new Date(Date.now() - 86400000 * 4).toISOString(),
    resolvedBy: 'Grievance Officer (Legal & Compliance)',
    createdAt: new Date(Date.now() - 86400000 * 14).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    auditHistory: [
      {
        timestamp: new Date(Date.now() - 86400000 * 14).toISOString(),
        action: 'DISPUTE_FILED',
        actor: 'Pradeep Menon (Customer)',
        details: 'Cancellation request due to government road widening acquisition.',
      },
      {
        timestamp: new Date(Date.now() - 86400000 * 4).toISOString(),
        action: 'PARTIAL_REFUND_APPROVED',
        actor: 'Grievance Officer',
        details: 'Settlement calculated and refunded.',
      },
    ],
  },
  {
    id: 'DISP-2026-013',
    disputeCode: 'DISP-2026-1013',
    projectId: 'BG-2026-0003',
    projectTitle: 'Duplex Smart Eco-Home (3BHK) - Whitefield, Bengaluru',
    complainantRole: 'CUSTOMER',
    complainantName: 'Anita Sharma',
    complainantPhone: '+91 99887 76655',
    complainantEmail: 'anita.s@techcorp.com',
    respondentRole: 'ARCHITECT',
    respondentName: 'Ar. Sneha Kulkarni',
    disputeType: 'TECHNICAL_ISSUES',
    priority: 'CRITICAL_URGENT',
    subject: 'Critical Cantilever Balcony Slab Reinforcement Deflection Risk',
    description:
      'Site engineer flagged excessive 28mm deflection on first-floor cantilever balcony slab. Requires urgent Super Admin review and independent structural auditor visit.',
    evidenceFiles: [
      { name: 'Deflection_Site_Measurement_Log.pdf', type: 'PDF', url: '#' },
      { name: 'Slab_Cracking_Photos.jpg', type: 'IMAGE', url: '#' },
    ],
    status: 'ESCALATED_SUPER_ADMIN',
    assignedAdmin: 'Super Admin',
    holdAssociatedPayout: true,
    associatedPayoutId: 'PAYOUT-2026-005',
    createdAt: new Date(Date.now() - 86400000 * 1.8).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    auditHistory: [
      {
        timestamp: new Date(Date.now() - 86400000 * 1.8).toISOString(),
        action: 'COMPLAINT_FILED',
        actor: 'Anita Sharma (Customer)',
        details: 'Emergency safety concern flagged on cantilever slab.',
      },
      {
        timestamp: new Date(Date.now() - 86400000 * 1.5).toISOString(),
        action: 'ESCALATED_SUPER_ADMIN',
        actor: 'Grievance Officer',
        details: 'Escalated to Super Admin due to life-safety structural concern.',
      },
    ],
  },
  {
    id: 'DISP-2026-014',
    disputeCode: 'DISP-2026-1014',
    projectId: 'BG-2026-0002',
    projectTitle: 'Independent Residential House (G+1) - Gurugram Sector 57',
    complainantRole: 'CUSTOMER',
    complainantName: 'Vikramaditya Roy',
    complainantPhone: '+91 98112 00099',
    respondentRole: 'ARCHITECT',
    respondentName: 'Ar. Sneha Kulkarni',
    disputeType: 'PAYMENT_DISPUTE',
    priority: 'CRITICAL_URGENT',
    subject: 'Breach of Deliverable Contract Exceeding ₹2,00,000 Milestone Threshold',
    description:
      'Contractor and architect failed to adhere to municipal plan submission timeline causing project halt. Escrow payout of ₹2,20,000 frozen and escalated for executive tribunal hearing.',
    evidenceFiles: [
      { name: 'Breach_Notice_And_Legal_Notice.pdf', type: 'PDF', url: '#' },
    ],
    status: 'ESCALATED_SUPER_ADMIN',
    assignedAdmin: 'Super Admin',
    holdAssociatedPayout: true,
    associatedPayoutId: 'PAYOUT-2026-003',
    createdAt: new Date(Date.now() - 86400000 * 2.1).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    auditHistory: [
      {
        timestamp: new Date(Date.now() - 86400000 * 2.1).toISOString(),
        action: 'DISPUTE_FILED',
        actor: 'Vikramaditya Roy (Customer)',
        details: 'High-value threshold breach filed.',
      },
      {
        timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
        action: 'ESCALATED_SUPER_ADMIN',
        actor: 'Compliance Desk',
        details: 'Directly escalated to Super Admin console.',
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
  } else {
    // Merge any new seed records added in recent updates
    const seeds = getDefaultSeedDisputes();
    let hasNew = false;
    for (const seed of seeds) {
      if (!list.some((item) => item.id === seed.id || item.disputeCode === seed.disputeCode)) {
        list.push(seed);
        hasNew = true;
      }
    }
    if (hasNew) {
      safeJsonSave(STORAGE_KEYS.DISPUTES, list);
    }
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
