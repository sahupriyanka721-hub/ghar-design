import { broadcastStoreUpdate } from './customerStore.js';

export type AuditLogCategory =
  | 'ADMIN_ACTIVITY'
  | 'CUSTOMER_ACTIVITY'
  | 'ARCHITECT_ACTIVITY'
  | 'PAYMENT_ACTIVITY'
  | 'PROJECT_ACTIVITY'
  | 'STATUS_HISTORY'
  | 'LOGIN_HISTORY';

export interface ComprehensiveAuditLogEntry {
  id: string;
  category: AuditLogCategory;
  timestamp: string;
  actorName: string;
  actorRole: string;
  actorEmail?: string;
  actionCode: string;
  targetEntity: string;
  targetId: string;
  previousState?: string;
  newState?: string;
  amountRupees?: number;
  utrOrTxnId?: string;
  ipAddress: string;
  deviceOrChannel?: string;
  status: 'SUCCESS' | 'WARNING' | 'FAILED' | 'FLAGGED';
  details: string;
}

export const INITIAL_AUDIT_TRAIL_RECORDS: ComprehensiveAuditLogEntry[] = [
  // 1. ADMIN ACTIVITY
  {
    id: 'adt-adm-1',
    category: 'ADMIN_ACTIVITY',
    timestamp: '2026-11-27T18:45:22Z',
    actorName: 'Priyanka Sharma',
    actorRole: 'SUPER_ADMIN',
    actorEmail: 'admin@buildghar.com',
    actionCode: 'UPDATE_COMMISSION_RATES',
    targetEntity: 'COMMISSION_SETTINGS',
    targetId: 'GLOBAL_CONFIG',
    previousState: 'Arch: 10%, Cont: 8%',
    newState: 'Arch: 8%, Cont: 6%',
    ipAddress: '103.21.244.18',
    deviceOrChannel: 'Admin Chrome (Windows 11)',
    status: 'SUCCESS',
    details: 'Adjusted platform commercial commission fee schedules for Q4 growth cycle.',
  },
  {
    id: 'adt-adm-2',
    category: 'ADMIN_ACTIVITY',
    timestamp: '2026-11-27T16:12:05Z',
    actorName: 'Rajesh Verma',
    actorRole: 'OPERATIONS_ADMIN',
    actorEmail: 'operations@buildghar.com',
    actionCode: 'REASSIGN_ARCHITECT',
    targetEntity: 'QUOTATION_REQUEST',
    targetId: 'REQ-2026-8812',
    previousState: 'Ar. Ananya Deshmukh (CA/2018/98412)',
    newState: 'Ar. Rohan Mehta (CA/2015/67890)',
    ipAddress: '103.21.244.22',
    deviceOrChannel: 'Admin Firefox (macOS)',
    status: 'SUCCESS',
    details: 'Reassigned 4,200 sq.ft luxury villa quote request to Star Architect due to SLA delay.',
  },
  {
    id: 'adt-adm-3',
    category: 'ADMIN_ACTIVITY',
    timestamp: '2026-11-27T14:30:19Z',
    actorName: 'Priyanka Sharma',
    actorRole: 'SUPER_ADMIN',
    actorEmail: 'admin@buildghar.com',
    actionCode: 'APPROVE_ARCHITECT_COA',
    targetEntity: 'ARCHITECT_PROFILE',
    targetId: 'arch-104',
    previousState: 'PENDING_VERIFICATION',
    newState: 'APPROVED_COA_ACTIVE',
    ipAddress: '103.21.244.18',
    deviceOrChannel: 'Admin Chrome (Windows 11)',
    status: 'SUCCESS',
    details: 'Verified COA registration CA/2019/104521 with Council of Architecture India database.',
  },

  // 2. CUSTOMER ACTIVITY
  {
    id: 'adt-cst-1',
    category: 'CUSTOMER_ACTIVITY',
    timestamp: '2026-11-27T17:50:11Z',
    actorName: 'Aditya Birla',
    actorRole: 'CUSTOMER',
    actorEmail: 'aditya.birla@gmail.com',
    actionCode: 'SUBMIT_QUOTATION_REQUEST',
    targetEntity: 'QUOTATION_REQUEST',
    targetId: 'REQ-2026-9041',
    previousState: 'DRAFT',
    newState: 'NEW_REQUESTS',
    ipAddress: '49.36.120.45',
    deviceOrChannel: 'Mobile Safari (iOS 18)',
    status: 'SUCCESS',
    details: 'Homeowner created quotation request for G+2 Luxury Villa in Cyber City Gurugram (3,600 sq.ft).',
  },
  {
    id: 'adt-cst-2',
    category: 'CUSTOMER_ACTIVITY',
    timestamp: '2026-11-27T15:20:44Z',
    actorName: 'Sunita Rao',
    actorRole: 'CUSTOMER',
    actorEmail: 'sunita.rao@outlook.com',
    actionCode: 'APPROVE_FLOOR_PLAN_DESIGN',
    targetEntity: 'PROJECT_DOCUMENT',
    targetId: 'DOC-FP-401',
    previousState: 'SUBMITTED_AWAITING_CUSTOMER',
    newState: 'CUSTOMER_APPROVED',
    ipAddress: '122.161.45.89',
    deviceOrChannel: 'Desktop Chrome (Windows 10)',
    status: 'SUCCESS',
    details: 'Approved 2D architectural layout and Vastu room orientations for Milestone 1.',
  },
  {
    id: 'adt-cst-3',
    category: 'CUSTOMER_ACTIVITY',
    timestamp: '2026-11-26T19:10:33Z',
    actorName: 'Kunal Kapoor',
    actorRole: 'CUSTOMER',
    actorEmail: 'kunal.kapoor@yahoo.com',
    actionCode: 'REQUEST_DESIGN_REVISION',
    targetEntity: '3D_ELEVATION_RENDER',
    targetId: 'DOC-3D-912',
    previousState: 'SUBMITTED',
    newState: 'REVISION_REQUESTED',
    ipAddress: '157.34.88.12',
    deviceOrChannel: 'Android App (v2.4.1)',
    status: 'WARNING',
    details: 'Requested change in exterior Italian stone cladding color and terrace pergola structure.',
  },

  // 3. ARCHITECT ACTIVITY
  {
    id: 'adt-arc-1',
    category: 'ARCHITECT_ACTIVITY',
    timestamp: '2026-11-27T18:05:30Z',
    actorName: 'Ar. Rohan Mehta',
    actorRole: 'ARCHITECT',
    actorEmail: 'rohan.mehta@buildghar-studios.com',
    actionCode: 'SUBMIT_QUOTATION_PROPOSAL',
    targetEntity: 'QUOTATION',
    targetId: 'QUO-2026-5519',
    previousState: 'ASSIGNED',
    newState: 'UNDER_ADMIN_REVIEW',
    amountRupees: 68000,
    ipAddress: '103.45.67.89',
    deviceOrChannel: 'Desktop Web CAD Studio',
    status: 'SUCCESS',
    details: 'Submitted comprehensive architectural quote with 4 milestone schedules and structural BOQ.',
  },
  {
    id: 'adt-arc-2',
    category: 'ARCHITECT_ACTIVITY',
    timestamp: '2026-11-27T13:40:15Z',
    actorName: 'Ar. Ananya Deshmukh',
    actorRole: 'ARCHITECT',
    actorEmail: 'ananya@deshmukh-architects.in',
    actionCode: 'UPLOAD_STRUCTURAL_DRAWINGS',
    targetEntity: 'PROJECT_DOCUMENT',
    targetId: 'DOC-STR-702',
    previousState: 'IN_PROGRESS',
    newState: 'SUBMISSIONS',
    ipAddress: '182.72.19.4',
    deviceOrChannel: 'Revit CAD Bridge API',
    status: 'SUCCESS',
    details: 'Uploaded IS 456 compliant column reinforcement schedule, footing layout and CAD .DWG set.',
  },
  {
    id: 'adt-arc-3',
    category: 'ARCHITECT_ACTIVITY',
    timestamp: '2026-11-26T16:22:19Z',
    actorName: 'Ar. Vikramaditya Solanki',
    actorRole: 'ARCHITECT',
    actorEmail: 'vikram@solankidesign.com',
    actionCode: 'SUBMIT_MILESTONE_INSPECTION',
    targetEntity: 'PROJECT_MILESTONE',
    targetId: 'MLS-PRJ-304-2',
    previousState: 'IN_PROGRESS',
    newState: 'ADMIN_INSPECTION_PENDING',
    ipAddress: '49.207.180.99',
    deviceOrChannel: 'Mobile Site Engineer App',
    status: 'SUCCESS',
    details: 'Uploaded geo-tagged physical site photos and slump test concrete report for Plinth level sign-off.',
  },

  // 4. PAYMENT ACTIVITY
  {
    id: 'adt-pay-1',
    category: 'PAYMENT_ACTIVITY',
    timestamp: '2026-11-27T17:55:00Z',
    actorName: 'Aditya Birla',
    actorRole: 'CUSTOMER',
    actionCode: 'ESCROW_TOKEN_PAYMENT_SUCCESS',
    targetEntity: 'CUSTOMER_PAYMENT',
    targetId: 'PAY-RZP-990142',
    amountRupees: 499,
    utrOrTxnId: 'pay_P9q1Xk9zL01A',
    ipAddress: '49.36.120.45',
    deviceOrChannel: 'Razorpay UPI (GPay)',
    status: 'SUCCESS',
    details: 'Token quotation fee paid successfully. Held in escrow; 100% refundable upon project booking.',
  },
  {
    id: 'adt-pay-2',
    category: 'PAYMENT_ACTIVITY',
    timestamp: '2026-11-27T16:40:12Z',
    actorName: 'Vikram Sethi',
    actorRole: 'CUSTOMER',
    actionCode: 'MILESTONE_ESCROW_DEPOSIT',
    targetEntity: 'CUSTOMER_PAYMENT',
    targetId: 'PAY-RZP-881923',
    amountRupees: 145000,
    utrOrTxnId: 'pay_K7m4Bn2xQ98Z',
    ipAddress: '115.111.45.2',
    deviceOrChannel: 'HDFC Netbanking Escrow Gateway',
    status: 'SUCCESS',
    details: 'Milestone 2 (Structural Framing) payment deposited into BuildGhar Escrow account.',
  },
  {
    id: 'adt-pay-3',
    category: 'PAYMENT_ACTIVITY',
    timestamp: '2026-11-27T14:15:30Z',
    actorName: 'BuildGhar Treasury Payouts Engine',
    actorRole: 'FINANCE_MANAGER',
    actionCode: 'ARCHITECT_PAYOUT_DISBURSED',
    targetEntity: 'ARCHITECT_PAYOUT',
    targetId: 'PO-2026-3391',
    amountRupees: 42320,
    utrOrTxnId: 'CMS39014920491HDFC',
    ipAddress: '10.0.4.12 (Internal VPC)',
    deviceOrChannel: 'RazorpayX Automated Payout API',
    status: 'SUCCESS',
    details: 'Disbursed net earnings to Ar. Rohan Mehta after 8% commission (₹3,680) and 1% TDS (₹460).',
  },
  {
    id: 'adt-pay-4',
    category: 'PAYMENT_ACTIVITY',
    timestamp: '2026-11-26T11:05:40Z',
    actorName: 'Rajeev Singhania',
    actorRole: 'CUSTOMER',
    actionCode: 'PAYMENT_GATEWAY_FAILURE',
    targetEntity: 'CUSTOMER_PAYMENT',
    targetId: 'PAY-FAIL-10492',
    amountRupees: 55000,
    utrOrTxnId: 'pay_FAIL_BnkTimeOut_01',
    ipAddress: '182.68.22.10',
    deviceOrChannel: 'SBI Netbanking Gateway',
    status: 'FAILED',
    details: 'Customer bank gateway timed out during OTP handshake. Auto-retry link dispatched via SMS.',
  },

  // 5. PROJECT ACTIVITY
  {
    id: 'adt-prj-1',
    category: 'PROJECT_ACTIVITY',
    timestamp: '2026-11-27T15:00:22Z',
    actorName: 'Priyanka Sharma',
    actorRole: 'SUPER_ADMIN',
    actionCode: 'PROJECT_KICKOFF_AUTHORIZED',
    targetEntity: 'BUILDGHAR_PROJECT',
    targetId: 'PRJ-2026-041',
    previousState: 'NEW',
    newState: 'KICKOFF',
    ipAddress: '103.21.244.18',
    deviceOrChannel: 'Admin Project Desk',
    status: 'SUCCESS',
    details: 'Kickoff meeting completed. Customer funded Milestone 1; architect assigned site workspace.',
  },
  {
    id: 'adt-prj-2',
    category: 'PROJECT_ACTIVITY',
    timestamp: '2026-11-26T18:30:45Z',
    actorName: 'Sanjay Dutt',
    actorRole: 'PROJECT_MANAGER',
    actionCode: 'SLA_DELAY_FLAGGED',
    targetEntity: 'BUILDGHAR_PROJECT',
    targetId: 'PRJ-2026-028',
    previousState: 'ACTIVE',
    newState: 'DELAYED',
    ipAddress: '103.21.244.30',
    deviceOrChannel: 'Admin Project Delivery Suite',
    status: 'WARNING',
    details: 'Flagged 4-day schedule delay in Working Drawings delivery; automated notice sent to architect.',
  },
  {
    id: 'adt-prj-3',
    category: 'PROJECT_ACTIVITY',
    timestamp: '2026-11-25T12:00:00Z',
    actorName: 'Priyanka Sharma',
    actorRole: 'SUPER_ADMIN',
    actionCode: 'PROJECT_COMPLETED_HANDOVER',
    targetEntity: 'BUILDGHAR_PROJECT',
    targetId: 'PRJ-2026-015',
    previousState: 'ACTIVE',
    newState: 'COMPLETED',
    ipAddress: '103.21.244.18',
    deviceOrChannel: 'Admin Project Desk',
    status: 'SUCCESS',
    details: 'All 4 milestone blueprints, 3D renders and municipal BOQ signed off. Final escrow closed.',
  },

  // 6. STATUS CHANGE HISTORY
  {
    id: 'adt-sts-1',
    category: 'STATUS_HISTORY',
    timestamp: '2026-11-27T17:10:00Z',
    actorName: 'Rajesh Verma',
    actorRole: 'OPERATIONS_ADMIN',
    actionCode: 'QUOTATION_STATUS_MUTATION',
    targetEntity: 'QUOTATION',
    targetId: 'QUO-2026-5510',
    previousState: 'UNDER_REVIEW',
    newState: 'SENT_TO_CUSTOMER',
    ipAddress: '103.21.244.22',
    deviceOrChannel: 'Admin Review Inbox',
    status: 'SUCCESS',
    details: 'Admin verified line items, applied 8% platform fee and sent quote proposal to customer.',
  },
  {
    id: 'adt-sts-2',
    category: 'STATUS_HISTORY',
    timestamp: '2026-11-27T13:15:20Z',
    actorName: 'Priyanka Sharma',
    actorRole: 'SUPER_ADMIN',
    actionCode: 'ARCHITECT_KYC_STATUS_MUTATION',
    targetEntity: 'ARCHITECT_APPLICATION',
    targetId: 'APP-COA-9812',
    previousState: 'PENDING_VERIFICATION',
    newState: 'APPROVED',
    ipAddress: '103.21.244.18',
    deviceOrChannel: 'Admin KYC Desk',
    status: 'SUCCESS',
    details: 'Verified COA license certificate and professional architecture degree from CEPT University.',
  },
  {
    id: 'adt-sts-3',
    category: 'STATUS_HISTORY',
    timestamp: '2026-11-26T14:40:19Z',
    actorName: 'Amit Saxena',
    actorRole: 'CUSTOMER_SUPPORT_ADMIN',
    actionCode: 'DISPUTE_RESOLUTION_STATUS_MUTATION',
    targetEntity: 'CUSTOMER_COMPLAINT',
    targetId: 'CMP-2026-092',
    previousState: 'OPEN',
    newState: 'RESOLVED',
    ipAddress: '103.21.244.35',
    deviceOrChannel: 'Support Ticket Portal',
    status: 'SUCCESS',
    details: 'Arbitrated revision dispute: architect agreed to deliver 2 additional 3D exterior renders at no extra cost.',
  },

  // 7. LOGIN HISTORY
  {
    id: 'adt-lgn-1',
    category: 'LOGIN_HISTORY',
    timestamp: '2026-11-27T19:02:11Z',
    actorName: 'Priyanka Sharma',
    actorRole: 'SUPER_ADMIN',
    actorEmail: 'admin@buildghar.com',
    actionCode: 'ADMIN_LOGIN_SUCCESS',
    targetEntity: 'ADMIN_CONSOLE',
    targetId: 'SESSION-ADM-9941',
    ipAddress: '103.21.244.18',
    deviceOrChannel: 'Chrome 131 on Windows 11 (Gurugram HQ)',
    status: 'SUCCESS',
    details: 'Super Administrator authenticated successfully via 2FA mobile OTP.',
  },
  {
    id: 'adt-lgn-2',
    category: 'LOGIN_HISTORY',
    timestamp: '2026-11-27T18:15:40Z',
    actorName: 'Ar. Rohan Mehta',
    actorRole: 'ARCHITECT',
    actorEmail: 'rohan.mehta@buildghar-studios.com',
    actionCode: 'ARCHITECT_LOGIN_SUCCESS',
    targetEntity: 'ARCHITECT_PORTAL',
    targetId: 'SESSION-ARC-3312',
    ipAddress: '103.45.67.89',
    deviceOrChannel: 'Chrome 130 on macOS (Bengaluru Hub)',
    status: 'SUCCESS',
    details: 'Architect partner authenticated via verified mobile OTP (+91 98765 12345).',
  },
  {
    id: 'adt-lgn-3',
    category: 'LOGIN_HISTORY',
    timestamp: '2026-11-27T17:48:02Z',
    actorName: 'Aditya Birla',
    actorRole: 'CUSTOMER',
    actorEmail: 'aditya.birla@gmail.com',
    actionCode: 'CUSTOMER_LOGIN_SUCCESS',
    targetEntity: 'HOMEOWNER_PORTAL',
    targetId: 'SESSION-CST-8819',
    ipAddress: '49.36.120.45',
    deviceOrChannel: 'Safari on iPhone 16 Pro (New Delhi)',
    status: 'SUCCESS',
    details: 'Customer verified mobile OTP (+91 83199 55741) to access project timeline.',
  },
  {
    id: 'adt-lgn-4',
    category: 'LOGIN_HISTORY',
    timestamp: '2026-11-26T22:14:55Z',
    actorName: 'Unknown Caller',
    actorRole: 'GUEST_UNAUTHENTICATED',
    actorEmail: 'unknown@tor-exit.net',
    actionCode: 'ADMIN_LOGIN_FAILED_AUTH',
    targetEntity: 'ADMIN_CONSOLE',
    targetId: 'AUTH-FAIL-LOCKOUT',
    ipAddress: '185.220.101.5',
    deviceOrChannel: 'Tor Browser / Headless Linux',
    status: 'FLAGGED',
    details: 'Repeated invalid OTP attempts blocked by platform brute-force firewall. IP temporarily rate-limited.',
  },
];

const AUDIT_TRAIL_STORAGE_KEY = 'buildghar_master_audit_trail_v1';

export const getComprehensiveAuditLogs = (): ComprehensiveAuditLogEntry[] => {
  try {
    const raw = localStorage.getItem(AUDIT_TRAIL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return INITIAL_AUDIT_TRAIL_RECORDS;
};

export const saveComprehensiveAuditLogs = (
  logs: ComprehensiveAuditLogEntry[]
): ComprehensiveAuditLogEntry[] => {
  try {
    localStorage.setItem(AUDIT_TRAIL_STORAGE_KEY, JSON.stringify(logs));
    broadcastStoreUpdate('AUDIT_TRAIL_UPDATED', logs);
  } catch {}
  return logs;
};

export const appendAuditTrailEntry = (
  entry: Omit<ComprehensiveAuditLogEntry, 'id' | 'timestamp'> & { timestamp?: string }
): ComprehensiveAuditLogEntry => {
  const current = getComprehensiveAuditLogs();
  const newEntry: ComprehensiveAuditLogEntry = {
    ...entry,
    id: `adt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: entry.timestamp || new Date().toISOString(),
  };
  const updated = [newEntry, ...current];
  saveComprehensiveAuditLogs(updated);
  return newEntry;
};
