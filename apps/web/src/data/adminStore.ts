import { broadcastStoreUpdate, syncChannel } from './customerStore.js';

// ==============================================================================
// 1. CONTRACTOR MANAGEMENT (Section C.3)
// ==============================================================================
export interface PlatformContractor {
  id: string;
  name: string;
  firmName: string;
  phone: string;
  email: string;
  city: string;
  state: string;
  experienceYears: number;
  specializations: string[];
  kycStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  licenseNumber?: string;
  gstNumber?: string;
  bankDetails?: {
    accountNumber: string;
    ifsc: string;
    bankName: string;
  };
  activeProjectsCount: number;
  completedProjectsCount: number;
  rating: number; // 1-5
  createdAt: string;
}

const CONTRACTORS_STORAGE_KEY = 'platform_contractors_ledger';

export const INITIAL_CONTRACTORS: PlatformContractor[] = [];

export const getPlatformContractors = (): PlatformContractor[] => {
  try {
    const data = localStorage.getItem(CONTRACTORS_STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return [];
};

export const savePlatformContractor = (contractor: Partial<PlatformContractor>): PlatformContractor => {
  const current = getPlatformContractors();
  const newItem: PlatformContractor = {
    id: contractor.id || `cnt-${Date.now()}`,
    name: contractor.name || 'New Contractor',
    firmName: contractor.firmName || 'Contracting Firm',
    phone: contractor.phone || '+91 9800000000',
    email: contractor.email || '',
    city: contractor.city || 'Delhi NCR',
    state: contractor.state || 'Delhi',
    experienceYears: contractor.experienceYears || 5,
    specializations: contractor.specializations || ['Civil Construction'],
    kycStatus: contractor.kycStatus || 'PENDING',
    licenseNumber: contractor.licenseNumber,
    gstNumber: contractor.gstNumber,
    bankDetails: contractor.bankDetails,
    activeProjectsCount: contractor.activeProjectsCount || 0,
    completedProjectsCount: contractor.completedProjectsCount || 0,
    rating: contractor.rating || 5.0,
    createdAt: contractor.createdAt || new Date().toISOString(),
  };

  const existingIdx = current.findIndex((c) => c.id === newItem.id);
  let updatedList: PlatformContractor[];
  if (existingIdx >= 0) {
    updatedList = current.map((c, i) => (i === existingIdx ? { ...c, ...newItem } : c));
  } else {
    updatedList = [newItem, ...current];
  }

  try {
    localStorage.setItem(CONTRACTORS_STORAGE_KEY, JSON.stringify(updatedList));
    broadcastStoreUpdate('CONTRACTORS_UPDATED', newItem);
  } catch {}
  return newItem;
};

export const updateContractorKYCStatus = (
  contractorId: string,
  newStatus: 'PENDING' | 'VERIFIED' | 'REJECTED'
): PlatformContractor[] => {
  const current = getPlatformContractors();
  const updated = current.map((c) => (c.id === contractorId ? { ...c, kycStatus: newStatus } : c));
  try {
    localStorage.setItem(CONTRACTORS_STORAGE_KEY, JSON.stringify(updated));
    broadcastStoreUpdate('CONTRACTORS_UPDATED', contractorId);
  } catch {}
  return updated;
};

// ==============================================================================
// 2. CUSTOMER SUPPORT & COMPLAINT MANAGEMENT (Section Q)
// ==============================================================================
export interface PlatformSupportTicket {
  id: string;
  ticketCode: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  category:
    | 'QUOTATION_ISSUES'
    | 'BOOKING_ISSUES'
    | 'PROFESSIONAL_ISSUES'
    | 'CONSTRUCTION_QUALITY'
    | 'PROJECT_DELAYS'
    | 'MATERIAL_ORDER'
    | 'PAYMENT_ISSUES'
    | 'REFUND_DISPUTE'
    | 'OTHER';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  subject: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'ESCALATED';
  relatedEntityId?: string;
  assignedAgent?: string;
  internalNotes?: string;
  resolutionSummary?: string;
  createdAt: string;
  updatedAt: string;
}

const SUPPORT_TICKETS_STORAGE_KEY = 'platform_central_support_tickets';

export const INITIAL_SUPPORT_TICKETS: PlatformSupportTicket[] = [];

export const getPlatformSupportTickets = (): PlatformSupportTicket[] => {
  try {
    const data = localStorage.getItem(SUPPORT_TICKETS_STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.filter((t: any) => !t.id?.startsWith('tkt-1') && !t.id?.startsWith('tkt-2') && !t.id?.startsWith('tkt-3'));
      }
    }
  } catch {}
  return [];
};

export const createPlatformSupportTicket = (ticket: Partial<PlatformSupportTicket>): PlatformSupportTicket => {
  const current = getPlatformSupportTickets();
  const newItem: PlatformSupportTicket = {
    id: ticket.id || `tkt-${Date.now()}`,
    ticketCode: ticket.ticketCode || `TKT-2026-${Math.floor(100 + Math.random() * 900)}`,
    customerId: ticket.customerId || 'cust-direct',
    customerName: ticket.customerName || 'Homeowner',
    customerPhone: ticket.customerPhone || '+91 9800000000',
    category: ticket.category || 'OTHER',
    priority: ticket.priority || 'MEDIUM',
    subject: ticket.subject || 'Support Ticket',
    description: ticket.description || '',
    status: ticket.status || 'OPEN',
    relatedEntityId: ticket.relatedEntityId,
    assignedAgent: ticket.assignedAgent || 'Support Operations',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const updated = [newItem, ...current];
  try {
    localStorage.setItem(SUPPORT_TICKETS_STORAGE_KEY, JSON.stringify(updated));
    broadcastStoreUpdate('SUPPORT_TICKETS_UPDATED', newItem);
  } catch {}
  return newItem;
};

export const updatePlatformSupportTicketStatus = (
  ticketId: string,
  newStatus: PlatformSupportTicket['status'],
  resolutionNotes?: string
): PlatformSupportTicket[] => {
  const current = getPlatformSupportTickets();
  const updated = current.map((t) =>
    t.id === ticketId
      ? {
          ...t,
          status: newStatus,
          resolutionSummary: resolutionNotes || t.resolutionSummary,
          updatedAt: new Date().toISOString(),
        }
      : t
  );
  try {
    localStorage.setItem(SUPPORT_TICKETS_STORAGE_KEY, JSON.stringify(updated));
    broadcastStoreUpdate('SUPPORT_TICKETS_UPDATED', ticketId);
  } catch {}
  return updated;
};

// ==============================================================================
// 3. BROADCAST NOTIFICATIONS & COMMUNICATIONS (Section R)
// ==============================================================================
export interface PlatformBroadcastNotification {
  id: string;
  title: string;
  message: string;
  targetRole: 'ALL' | 'CUSTOMERS' | 'ARCHITECTS' | 'INTERIOR_DESIGNERS' | 'CONTRACTORS' | 'VENDORS';
  channel: 'IN_APP' | 'SMS' | 'WHATSAPP' | 'EMAIL';
  sentBy: string;
  sentAt: string;
  recipientCount: number;
  status: 'SENT' | 'QUEUED' | 'FAILED';
}

const NOTIFICATIONS_STORAGE_KEY = 'platform_broadcast_notifications_ledger';

export const INITIAL_BROADCAST_NOTIFICATIONS: PlatformBroadcastNotification[] = [];

export const getPlatformBroadcastNotifications = (): PlatformBroadcastNotification[] => {
  try {
    const data = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.filter((b: any) => !b.id?.startsWith('bnotif-1') && !b.id?.startsWith('bnotif-2'));
      }
    }
  } catch {}
  return [];
};

export const sendPlatformBroadcastNotification = (
  notif: Partial<PlatformBroadcastNotification>
): PlatformBroadcastNotification => {
  const current = getPlatformBroadcastNotifications();
  const newItem: PlatformBroadcastNotification = {
    id: notif.id || `bnotif-${Date.now()}`,
    title: notif.title || 'Platform Announcement',
    message: notif.message || '',
    targetRole: notif.targetRole || 'ALL',
    channel: notif.channel || 'IN_APP',
    sentBy: notif.sentBy || 'Super Admin',
    sentAt: new Date().toISOString(),
    recipientCount: notif.recipientCount || 120,
    status: 'SENT',
  };

  const updated = [newItem, ...current];
  try {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
    broadcastStoreUpdate('BROADCAST_NOTIFICATIONS_UPDATED', newItem);
  } catch {}
  return newItem;
};

// ==============================================================================
// 4. COUPONS & PROMOTIONAL CAMPAIGNS (Section S)
// ==============================================================================
export interface PlatformCoupon {
  id: string;
  code: string;
  title: string;
  discountType: 'PERCENTAGE' | 'FLAT_AMOUNT';
  discountValue: number;
  minOrderPaise: number;
  maxDiscountPaise: number;
  validUntil: string;
  usageLimit: number;
  usedCount: number;
  applicableScope: 'ALL' | 'SERVICES' | 'MATERIALS' | 'DESIGN';
  isActive: boolean;
  createdAt: string;
}

const COUPONS_STORAGE_KEY = 'platform_marketing_coupons_ledger';

export const INITIAL_COUPONS: PlatformCoupon[] = [];

export const getPlatformCoupons = (): PlatformCoupon[] => {
  try {
    const data = localStorage.getItem(COUPONS_STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed.filter((c: any) => c.id !== 'cpn-1' && c.id !== 'cpn-2');
      }
    }
  } catch {}
  return [];
};

export const savePlatformCoupon = (coupon: Partial<PlatformCoupon>): PlatformCoupon => {
  const current = getPlatformCoupons();
  const newItem: PlatformCoupon = {
    id: coupon.id || `cpn-${Date.now()}`,
    code: (coupon.code || 'SAVE10').toUpperCase().trim(),
    title: coupon.title || 'Promotional Coupon',
    discountType: coupon.discountType || 'PERCENTAGE',
    discountValue: coupon.discountValue || 10,
    minOrderPaise: coupon.minOrderPaise || 100000,
    maxDiscountPaise: coupon.maxDiscountPaise || 500000,
    validUntil: coupon.validUntil || '2026-12-31',
    usageLimit: coupon.usageLimit || 500,
    usedCount: coupon.usedCount || 0,
    applicableScope: coupon.applicableScope || 'ALL',
    isActive: coupon.isActive !== undefined ? coupon.isActive : true,
    createdAt: coupon.createdAt || new Date().toISOString(),
  };

  const existingIdx = current.findIndex((c) => c.id === newItem.id);
  let updated: PlatformCoupon[];
  if (existingIdx >= 0) {
    updated = current.map((c, i) => (i === existingIdx ? newItem : c));
  } else {
    updated = [newItem, ...current];
  }

  try {
    localStorage.setItem(COUPONS_STORAGE_KEY, JSON.stringify(updated));
    broadcastStoreUpdate('COUPONS_UPDATED', newItem);
  } catch {}
  return newItem;
};

export const togglePlatformCouponStatus = (couponId: string): PlatformCoupon[] => {
  const current = getPlatformCoupons();
  const updated = current.map((c) => (c.id === couponId ? { ...c, isActive: !c.isActive } : c));
  try {
    localStorage.setItem(COUPONS_STORAGE_KEY, JSON.stringify(updated));
    broadcastStoreUpdate('COUPONS_UPDATED', couponId);
  } catch {}
  return updated;
};

export const deletePlatformCoupon = (couponId: string): PlatformCoupon[] => {
  const current = getPlatformCoupons();
  const updated = current.filter((c) => c.id !== couponId);
  try {
    localStorage.setItem(COUPONS_STORAGE_KEY, JSON.stringify(updated));
    broadcastStoreUpdate('COUPONS_UPDATED', couponId);
  } catch {}
  return updated;
};

// ==============================================================================
// 5. LOCATION & SERVICE AREA COVERAGE (Section T)
// ==============================================================================
export interface PlatformServiceLocation {
  id: string;
  state: string;
  city: string;
  pincodes: string[];
  serviceAvailable: boolean;
  deliveryZone: string;
  activeProfessionalsCount: number;
  activeVendorsCount: number;
}

const LOCATIONS_STORAGE_KEY = 'platform_service_locations_ledger';

export const INITIAL_LOCATIONS: PlatformServiceLocation[] = [
  {
    id: 'loc-1',
    state: 'Delhi',
    city: 'New Delhi & NCR',
    pincodes: ['110001', '110020', '110048', '110065', '110092'],
    serviceAvailable: true,
    deliveryZone: 'Capital Express Zone A',
    activeProfessionalsCount: 0,
    activeVendorsCount: 0,
  },
  {
    id: 'loc-2',
    state: 'Haryana',
    city: 'Gurugram',
    pincodes: ['122001', '122002', '122018', '122051'],
    serviceAvailable: true,
    deliveryZone: 'Millennium City Heavy Logistics',
    activeProfessionalsCount: 0,
    activeVendorsCount: 0,
  },
  {
    id: 'loc-3',
    state: 'Uttar Pradesh',
    city: 'Noida & Greater Noida',
    pincodes: ['201301', '201305', '201310'],
    serviceAvailable: true,
    deliveryZone: 'Expressway Transit Hub',
    activeProfessionalsCount: 0,
    activeVendorsCount: 0,
  },
  {
    id: 'loc-4',
    state: 'Rajasthan',
    city: 'Jaipur',
    pincodes: ['302001', '302015', '302020'],
    serviceAvailable: false,
    deliveryZone: 'Tier 2 Expansion Region',
    activeProfessionalsCount: 0,
    activeVendorsCount: 0,
  },
];

export const getPlatformServiceLocations = (): PlatformServiceLocation[] => {
  try {
    const data = localStorage.getItem(LOCATIONS_STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return INITIAL_LOCATIONS;
};

export const toggleLocationServiceStatus = (locId: string): PlatformServiceLocation[] => {
  const current = getPlatformServiceLocations();
  const updated = current.map((l) => (l.id === locId ? { ...l, serviceAvailable: !l.serviceAvailable } : l));
  try {
    localStorage.setItem(LOCATIONS_STORAGE_KEY, JSON.stringify(updated));
    broadcastStoreUpdate('LOCATIONS_UPDATED', locId);
  } catch {}
  return updated;
};

export const addPlatformServiceLocation = (loc: Partial<PlatformServiceLocation>): PlatformServiceLocation => {
  const current = getPlatformServiceLocations();
  const newItem: PlatformServiceLocation = {
    id: loc.id || `loc-${Date.now()}`,
    state: loc.state || 'Delhi',
    city: loc.city || 'Delhi NCR',
    pincodes: loc.pincodes || ['110001'],
    serviceAvailable: loc.serviceAvailable !== undefined ? loc.serviceAvailable : true,
    deliveryZone: loc.deliveryZone || 'Standard Delivery Zone',
    activeProfessionalsCount: loc.activeProfessionalsCount || 0,
    activeVendorsCount: loc.activeVendorsCount || 0,
  };

  const updated = [newItem, ...current];
  try {
    localStorage.setItem(LOCATIONS_STORAGE_KEY, JSON.stringify(updated));
    broadcastStoreUpdate('LOCATIONS_UPDATED', newItem);
  } catch {}
  return newItem;
};

// ==============================================================================
// 6. STAFF & ADMIN ROLES WITH RBAC (Section U)
// ==============================================================================
export interface PlatformAdminStaff {
  id: string;
  name: string;
  email: string;
  phone: string;
  role:
    | 'SUPER_ADMIN'
    | 'OPERATIONS_MANAGER'
    | 'SUPPORT_MANAGER'
    | 'FINANCE_MANAGER'
    | 'VENDOR_MANAGER'
    | 'PROJECT_MANAGER'
    | 'READ_ONLY_ADMIN';
  department: string;
  isActive: boolean;
  permissions: string[];
  lastLogin: string;
  createdAt: string;
}

const ADMIN_STAFF_STORAGE_KEY = 'platform_admin_staff_roles_ledger';

export const INITIAL_ADMIN_STAFF: PlatformAdminStaff[] = [
  {
    id: 'adm-1',
    name: 'Super Administrator',
    email: 'admin@buildghar.com',
    phone: '+91 8319955741',
    role: 'SUPER_ADMIN',
    department: 'Platform Operations & Board',
    isActive: true,
    permissions: ['ALL_PERMISSIONS', 'FINANCIAL_SETTLEMENTS', 'KYC_APPROVALS', 'STAFF_MANAGEMENT'],
    lastLogin: new Date().toISOString(),
    createdAt: '2026-01-01T00:00:00.000Z',
  },
];

export const getPlatformAdminStaff = (): PlatformAdminStaff[] => {
  try {
    const data = localStorage.getItem(ADMIN_STAFF_STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed.filter((s: any) => s.id !== 'adm-2' && s.id !== 'adm-3' && s.id !== 'adm-4');
      }
    }
  } catch {}
  return INITIAL_ADMIN_STAFF;
};

export const savePlatformAdminStaff = (staff: Partial<PlatformAdminStaff>): PlatformAdminStaff => {
  const current = getPlatformAdminStaff();
  const newItem: PlatformAdminStaff = {
    id: staff.id || `adm-${Date.now()}`,
    name: staff.name || 'Admin Staff',
    email: staff.email || '',
    phone: staff.phone || '+91 9800000000',
    role: staff.role || 'OPERATIONS_MANAGER',
    department: staff.department || 'Operations',
    isActive: staff.isActive !== undefined ? staff.isActive : true,
    permissions: staff.permissions || ['PROJECT_MONITORING'],
    lastLogin: new Date().toISOString(),
    createdAt: staff.createdAt || new Date().toISOString(),
  };

  const existingIdx = current.findIndex((s) => s.id === newItem.id);
  let updated: PlatformAdminStaff[];
  if (existingIdx >= 0) {
    updated = current.map((s, i) => (i === existingIdx ? newItem : s));
  } else {
    updated = [newItem, ...current];
  }

  try {
    localStorage.setItem(ADMIN_STAFF_STORAGE_KEY, JSON.stringify(updated));
    broadcastStoreUpdate('ADMIN_STAFF_UPDATED', newItem);
  } catch {}
  return newItem;
};

export const toggleAdminStaffStatus = (staffId: string): PlatformAdminStaff[] => {
  const current = getPlatformAdminStaff();
  const updated = current.map((s) => (s.id === staffId ? { ...s, isActive: !s.isActive } : s));
  try {
    localStorage.setItem(ADMIN_STAFF_STORAGE_KEY, JSON.stringify(updated));
    broadcastStoreUpdate('ADMIN_STAFF_UPDATED', staffId);
  } catch {}
  return updated;
};

// ==============================================================================
// 7. PLATFORM GLOBAL CONFIGURATION (Section V)
// ==============================================================================
export interface PlatformGlobalSettings {
  siteName: string;
  supportEmail: string;
  supportPhone: string;
  quotationFeePaise: number;
  gstRatePercent: number;
  architectCommissionPercent: number;
  interiorDesignerCommissionPercent: number;
  vendorCommissionPercent: number;
  contractorCommissionPercent: number;
  escrowHoldDays: number;
  maintenanceMode: boolean;
  smsGatewayProvider: string;
  paymentGatewayProvider: string;
  autoApproveVerifiedVendors: boolean;
}

const GLOBAL_SETTINGS_KEY = 'platform_global_settings_config';

export const DEFAULT_GLOBAL_SETTINGS: PlatformGlobalSettings = {
  siteName: 'BuildGhar India',
  supportEmail: 'support@buildghar.com',
  supportPhone: '+91 8319955741',
  quotationFeePaise: 49900,
  gstRatePercent: 18,
  architectCommissionPercent: 8,
  interiorDesignerCommissionPercent: 10,
  vendorCommissionPercent: 5,
  contractorCommissionPercent: 6,
  escrowHoldDays: 3,
  maintenanceMode: false,
  smsGatewayProvider: 'Twilio / Fast2SMS Indian Route',
  paymentGatewayProvider: 'Razorpay / Cashfree Verified Escrow',
  autoApproveVerifiedVendors: false,
};

export const getPlatformGlobalSettings = (): PlatformGlobalSettings => {
  try {
    const data = localStorage.getItem(GLOBAL_SETTINGS_KEY);
    if (data) return { ...DEFAULT_GLOBAL_SETTINGS, ...JSON.parse(data) };
  } catch {}
  return DEFAULT_GLOBAL_SETTINGS;
};

export const savePlatformGlobalSettings = (
  settings: Partial<PlatformGlobalSettings>
): PlatformGlobalSettings => {
  const current = getPlatformGlobalSettings();
  const updated = { ...current, ...settings };
  try {
    localStorage.setItem(GLOBAL_SETTINGS_KEY, JSON.stringify(updated));
    broadcastStoreUpdate('SETTINGS_UPDATED', updated);
  } catch {}
  return updated;
};

// ==============================================================================
// 8. AUDIT TRAIL & SYSTEM SECURITY LOGS (Section W)
// ==============================================================================
export interface PlatformAuditLog {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  module: string;
  entity: string;
  previousValue?: string;
  newValue?: string;
  ipAddress: string;
  timestamp: string;
}

const AUDIT_LOGS_STORAGE_KEY = 'platform_security_audit_logs';

export const INITIAL_AUDIT_LOGS: PlatformAuditLog[] = [];

export const getPlatformAuditLogs = (): PlatformAuditLog[] => {
  try {
    const data = localStorage.getItem(AUDIT_LOGS_STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (l: any) => l.id !== 'log-1' && l.id !== 'log-2' && l.id !== 'log-3' && l.id !== 'log-4'
        );
      }
    }
  } catch {}
  return [];
};

export const recordPlatformAuditLog = (log: Partial<PlatformAuditLog>): PlatformAuditLog => {
  const current = getPlatformAuditLogs();
  const newItem: PlatformAuditLog = {
    id: log.id || `log-${Date.now()}`,
    adminId: log.adminId || 'adm-1',
    adminName: log.adminName || 'Platform Administrator',
    action: log.action || 'SYSTEM_ACTION',
    module: log.module || 'GENERAL',
    entity: log.entity || '',
    previousValue: log.previousValue,
    newValue: log.newValue,
    ipAddress: log.ipAddress || '127.0.0.1 (Internal Console)',
    timestamp: new Date().toISOString(),
  };

  const updated = [newItem, ...current];
  try {
    localStorage.setItem(AUDIT_LOGS_STORAGE_KEY, JSON.stringify(updated));
  } catch {}
  return newItem;
};
