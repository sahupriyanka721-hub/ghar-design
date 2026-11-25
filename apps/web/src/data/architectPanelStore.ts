import { syncChannel, broadcastStoreUpdate, getPlatformRequests } from './customerStore.js';
import { getExecutionProjects } from './projectExecutionStore.js';

// ==========================================
// 1. ARCHITECTURAL DESIGNS & DRAWINGS
// ==========================================
export type DesignCategory =
  | 'HOUSE_MAP'
  | 'FLOOR_PLAN_GROUND'
  | 'FLOOR_PLAN_FIRST'
  | 'FLOOR_PLAN_MULTI'
  | 'ELEVATION_3D'
  | 'DRAWING_2D'
  | 'SITE_LAYOUT'
  | 'SECTION_DRAWINGS'
  | 'WORKING_DRAWINGS'
  | 'STRUCTURAL_COORDINATION'
  | 'RENOVATION_DRAWING';

export type DesignStatus =
  | 'DRAFT'
  | 'SUBMITTED_TO_ADMIN'
  | 'ADMIN_APPROVED'
  | 'PENDING_CUSTOMER_APPROVAL'
  | 'APPROVED'
  | 'REVISION_REQUESTED'
  | 'REJECTED'
  | 'ARCHIVED';

export interface DesignVersionItem {
  versionNumber: string;
  fileUrl: string;
  fileName: string;
  fileSize: string;
  uploadedAt: string;
  revisionNotes: string;
  status: DesignStatus;
  customerComments?: string;
  adminReviewNotes?: string;
}

export interface ArchitecturalDesign {
  id: string;
  projectId: string;
  projectTitle: string;
  customerId: string;
  customerName: string;
  category: DesignCategory;
  title: string;
  description: string;
  fileUrl: string;
  fileName: string;
  fileSize: string;
  fileType: 'PDF' | 'JPG' | 'PNG' | 'DWG' | 'DXF';
  currentVersion: string;
  status: DesignStatus;
  uploadedAt: string;
  updatedAt: string;
  revisionNotes: string;
  customerComments?: string;
  adminReviewNotes?: string;
  approvedAt?: string;
  versions: DesignVersionItem[];
}

// ==========================================
// 2. BOQ & COST ESTIMATION
// ==========================================
export type BOQCategory =
  | 'CIVIL'
  | 'STRUCTURAL'
  | 'MASONRY'
  | 'PLUMBING'
  | 'ELECTRICAL'
  | 'FLOORING'
  | 'PAINTING'
  | 'INTERIOR'
  | 'OTHER';

export interface BOQItem {
  id: string;
  itemNumber: number;
  itemName: string;
  description: string;
  category: BOQCategory;
  unit: string;
  quantity: number;
  rate: number;
  taxPercent: number;
  amount: number;
  totalWithTax: number;
}

export type BOQStatus =
  | 'DRAFT'
  | 'SUBMITTED_TO_ADMIN'
  | 'APPROVED_BY_ADMIN'
  | 'SENT_TO_CUSTOMER'
  | 'ACCEPTED_BY_CUSTOMER'
  | 'REVISED';

export interface ArchitectBOQ {
  id: string;
  projectId: string;
  projectTitle: string;
  requestId?: string;
  quotationId?: string;
  customerName: string;
  customerPhone?: string;
  propertyLocation: string;
  plotDimensions?: string;
  builtUpAreaSqFt?: number;
  version: number;
  status: BOQStatus;
  items: BOQItem[];
  subtotal: number;
  totalTax: number;
  grandTotal: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
  adminApprovedAt?: string;
  customerAcceptedAt?: string;
}

// ==========================================
// 3. SITE VISIT MANAGEMENT
// ==========================================
export type SiteVisitStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface SitePhotoItem {
  id: string;
  url: string;
  caption: string;
  uploadedAt: string;
}

export interface SiteVisitMeasurement {
  plotWidth: string;
  plotLength: string;
  totalPlotArea: string;
  frontRoadWidth: string;
  northSetback: string;
  southSetback: string;
  eastSetback: string;
  westSetback: string;
  soilCondition?: string;
  groundLevelRelative?: string;
  existingStructures?: string;
}

export interface ArchitectSiteVisit {
  id: string;
  projectId: string;
  projectTitle: string;
  customerName: string;
  customerPhone: string;
  propertyLocation: string;
  visitDate: string;
  visitTime: string;
  status: SiteVisitStatus;
  purpose: string;
  measurements: SiteVisitMeasurement;
  photographs: SitePhotoItem[];
  siteConditions: string;
  observations: string;
  recommendations: string;
  nextSteps: string;
  reportSubmitted: boolean;
  reportSubmittedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// 4. ARCHITECTURE DELIVERABLES & MILESTONES
// ==========================================
export type DeliverableStatus =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'SUBMITTED_FOR_REVIEW'
  | 'REVISION_REQUIRED'
  | 'COMPLETED';

export type DeliverablePriority = 'HIGH' | 'MEDIUM' | 'LOW';

export interface ArchitectDeliverable {
  id: string;
  projectId: string;
  projectTitle: string;
  customerName: string;
  title: string;
  stageKey: string;
  description: string;
  assignedMember: string;
  dueDate: string;
  priority: DeliverablePriority;
  status: DeliverableStatus;
  progressPercent: number;
  revisionCount: number;
  attachments: Array<{ name: string; url: string; size: string }>;
  customerFeedback?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// 5. CUSTOMER REVIEWS & RATINGS
// ==========================================
export interface ArchitectReviewItem {
  id: string;
  projectId: string;
  projectTitle: string;
  customerName: string;
  customerCity: string;
  rating: number; // 1 to 5
  reviewDate: string;
  feedback: string;
  verifiedClient: boolean;
  architectReply?: string;
  replyDate?: string;
}

// ==========================================
// 6. NOTIFICATION SYSTEM
// ==========================================
export type NotificationSeverity = 'INFO' | 'SUCCESS' | 'WARNING' | 'ALERT';

export interface ArchitectNotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  linkPath?: string;
  severity: NotificationSeverity;
}

// ==========================================
// 7. COLLABORATION MESSAGES
// ==========================================
export type ChatChannel = 'CUSTOMER' | 'ADMIN' | 'CONTRACTOR' | 'INTERIOR_DESIGNER';

export interface ArchitectChatMessageItem {
  id: string;
  projectId: string;
  channel: ChatChannel;
  senderId: string;
  senderName: string;
  senderRole: string;
  message: string;
  attachments?: Array<{ name: string; url: string }>;
  timestamp: string;
  read: boolean;
}

// ==========================================
// STORAGE KEYS & EVENT HELPERS
// ==========================================
const STORAGE_KEYS = {
  DESIGNS: 'ghar_architect_designs',
  BOQS: 'ghar_architect_boqs',
  SITE_VISITS: 'ghar_architect_site_visits',
  DELIVERABLES: 'ghar_architect_deliverables',
  REVIEWS: 'ghar_architect_reviews',
  NOTIFICATIONS: 'ghar_architect_notifications',
  MESSAGES: 'ghar_architect_messages',
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

// ==========================================
// ARCHITECT DESIGNS CRUD
// ==========================================
export const getArchitectDesigns = (projectId?: string): ArchitecturalDesign[] => {
  const designs = safeJsonParse<ArchitecturalDesign[]>(STORAGE_KEYS.DESIGNS, []);
  if (!projectId) return designs;
  return designs.filter((d) => d.projectId === projectId);
};

export const saveArchitectDesign = (design: ArchitecturalDesign): ArchitecturalDesign => {
  const all = getArchitectDesigns();
  const idx = all.findIndex((d) => d.id === design.id);
  let updated: ArchitecturalDesign[];
  if (idx >= 0) {
    updated = [...all];
    updated[idx] = { ...design, updatedAt: new Date().toISOString() };
  } else {
    updated = [design, ...all];
  }
  safeJsonSave(STORAGE_KEYS.DESIGNS, updated, 'ARCHITECT_DESIGNS_UPDATED');
  return design;
};

export const updateArchitectDesignStatus = (
  designId: string,
  status: DesignStatus,
  notes?: string
): ArchitecturalDesign | null => {
  const all = getArchitectDesigns();
  const idx = all.findIndex((d) => d.id === designId);
  if (idx < 0) return null;
  const current = all[idx];
  const updatedItem: ArchitecturalDesign = {
    ...current,
    status,
    updatedAt: new Date().toISOString(),
    customerComments: notes || current.customerComments,
    approvedAt: status === 'APPROVED' ? new Date().toISOString() : current.approvedAt,
  };
  all[idx] = updatedItem;
  safeJsonSave(STORAGE_KEYS.DESIGNS, all, 'ARCHITECT_DESIGNS_UPDATED');
  return updatedItem;
};

export const addDesignVersion = (
  designId: string,
  newVersion: {
    fileUrl: string;
    fileName: string;
    fileSize: string;
    revisionNotes: string;
  }
): ArchitecturalDesign | null => {
  const all = getArchitectDesigns();
  const idx = all.findIndex((d) => d.id === designId);
  if (idx < 0) return null;
  const current = all[idx];
  const nextVerNum = `v${(current.versions.length + 1).toFixed(1)}`;
  const verItem: DesignVersionItem = {
    versionNumber: nextVerNum,
    fileUrl: newVersion.fileUrl,
    fileName: newVersion.fileName,
    fileSize: newVersion.fileSize,
    uploadedAt: new Date().toISOString(),
    revisionNotes: newVersion.revisionNotes,
    status: 'PENDING_CUSTOMER_APPROVAL',
  };

  const updatedItem: ArchitecturalDesign = {
    ...current,
    fileUrl: newVersion.fileUrl,
    fileName: newVersion.fileName,
    fileSize: newVersion.fileSize,
    currentVersion: nextVerNum,
    revisionNotes: newVersion.revisionNotes,
    status: 'PENDING_CUSTOMER_APPROVAL',
    updatedAt: new Date().toISOString(),
    versions: [verItem, ...current.versions],
  };
  all[idx] = updatedItem;
  safeJsonSave(STORAGE_KEYS.DESIGNS, all, 'ARCHITECT_DESIGNS_UPDATED');
  return updatedItem;
};

// ==========================================
// BOQ & COST ESTIMATION CRUD
// ==========================================
export const getArchitectBOQs = (projectId?: string): ArchitectBOQ[] => {
  const boqs = safeJsonParse<ArchitectBOQ[]>(STORAGE_KEYS.BOQS, []);
  if (!projectId) return boqs;
  return boqs.filter((b) => b.projectId === projectId);
};

export const saveArchitectBOQ = (boq: ArchitectBOQ): ArchitectBOQ => {
  const all = getArchitectBOQs();
  const idx = all.findIndex((b) => b.id === boq.id);
  let updated: ArchitectBOQ[];
  if (idx >= 0) {
    updated = [...all];
    updated[idx] = { ...boq, updatedAt: new Date().toISOString() };
  } else {
    updated = [boq, ...all];
  }
  safeJsonSave(STORAGE_KEYS.BOQS, updated, 'ARCHITECT_BOQ_UPDATED');
  return boq;
};

export const updateArchitectBOQStatus = (boqId: string, status: BOQStatus): ArchitectBOQ | null => {
  const all = getArchitectBOQs();
  const idx = all.findIndex((b) => b.id === boqId);
  if (idx < 0) return null;
  const current = all[idx];
  const updatedItem: ArchitectBOQ = {
    ...current,
    status,
    updatedAt: new Date().toISOString(),
    adminApprovedAt: status === 'APPROVED_BY_ADMIN' ? new Date().toISOString() : current.adminApprovedAt,
    customerAcceptedAt: status === 'ACCEPTED_BY_CUSTOMER' ? new Date().toISOString() : current.customerAcceptedAt,
  };
  all[idx] = updatedItem;
  safeJsonSave(STORAGE_KEYS.BOQS, all, 'ARCHITECT_BOQ_UPDATED');
  return updatedItem;
};

// ==========================================
// SITE VISITS CRUD
// ==========================================
export const getArchitectSiteVisits = (projectId?: string): ArchitectSiteVisit[] => {
  const visits = safeJsonParse<ArchitectSiteVisit[]>(STORAGE_KEYS.SITE_VISITS, []);
  if (!projectId) return visits;
  return visits.filter((v) => v.projectId === projectId);
};

export const saveArchitectSiteVisit = (visit: ArchitectSiteVisit): ArchitectSiteVisit => {
  const all = getArchitectSiteVisits();
  const idx = all.findIndex((v) => v.id === visit.id);
  let updated: ArchitectSiteVisit[];
  if (idx >= 0) {
    updated = [...all];
    updated[idx] = { ...visit, updatedAt: new Date().toISOString() };
  } else {
    updated = [visit, ...all];
  }
  safeJsonSave(STORAGE_KEYS.SITE_VISITS, updated, 'ARCHITECT_SITE_VISITS_UPDATED');
  return visit;
};

// ==========================================
// DELIVERABLES CRUD
// ==========================================
export const getArchitectDeliverables = (projectId?: string): ArchitectDeliverable[] => {
  const deliverables = safeJsonParse<ArchitectDeliverable[]>(STORAGE_KEYS.DELIVERABLES, []);
  if (!projectId) return deliverables;
  return deliverables.filter((d) => d.projectId === projectId);
};

export const saveArchitectDeliverable = (deliverable: ArchitectDeliverable): ArchitectDeliverable => {
  const all = getArchitectDeliverables();
  const idx = all.findIndex((d) => d.id === deliverable.id);
  let updated: ArchitectDeliverable[];
  if (idx >= 0) {
    updated = [...all];
    updated[idx] = { ...deliverable, updatedAt: new Date().toISOString() };
  } else {
    updated = [deliverable, ...all];
  }
  safeJsonSave(STORAGE_KEYS.DELIVERABLES, updated, 'ARCHITECT_DELIVERABLES_UPDATED');
  return deliverable;
};

// ==========================================
// REVIEWS CRUD
// ==========================================
export const getArchitectReviews = (): ArchitectReviewItem[] => {
  return safeJsonParse<ArchitectReviewItem[]>(STORAGE_KEYS.REVIEWS, []);
};

export const saveArchitectReviewReply = (
  reviewId: string,
  replyText: string
): ArchitectReviewItem | null => {
  const all = getArchitectReviews();
  const idx = all.findIndex((r) => r.id === reviewId);
  if (idx < 0) return null;
  all[idx] = {
    ...all[idx],
    architectReply: replyText,
    replyDate: new Date().toISOString(),
  };
  safeJsonSave(STORAGE_KEYS.REVIEWS, all, 'ARCHITECT_REVIEWS_UPDATED');
  return all[idx];
};

// ==========================================
// NOTIFICATIONS CRUD
// ==========================================
export const getArchitectNotifications = (): ArchitectNotificationItem[] => {
  return safeJsonParse<ArchitectNotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, []);
};

export const addArchitectNotification = (
  notif: Omit<ArchitectNotificationItem, 'id' | 'timestamp' | 'read'>
): ArchitectNotificationItem => {
  const all = getArchitectNotifications();
  const newItem: ArchitectNotificationItem = {
    id: `NOTIF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    ...notif,
    timestamp: new Date().toISOString(),
    read: false,
  };
  safeJsonSave(STORAGE_KEYS.NOTIFICATIONS, [newItem, ...all], 'ARCHITECT_NOTIFICATIONS_UPDATED');
  return newItem;
};

export const markNotificationRead = (notifId: string): void => {
  const all = getArchitectNotifications();
  const updated = all.map((n) => (n.id === notifId ? { ...n, read: true } : n));
  safeJsonSave(STORAGE_KEYS.NOTIFICATIONS, updated, 'ARCHITECT_NOTIFICATIONS_UPDATED');
};

export const markAllNotificationsRead = (): void => {
  const all = getArchitectNotifications();
  const updated = all.map((n) => ({ ...n, read: true }));
  safeJsonSave(STORAGE_KEYS.NOTIFICATIONS, updated, 'ARCHITECT_NOTIFICATIONS_UPDATED');
};

// ==========================================
// MESSAGES & COLLABORATION CRUD
// ==========================================
export const getArchitectChatMessages = (
  projectId: string,
  channel?: ChatChannel
): ArchitectChatMessageItem[] => {
  const all = safeJsonParse<ArchitectChatMessageItem[]>(STORAGE_KEYS.MESSAGES, []);
  let filtered = all.filter((m) => m.projectId === projectId);
  if (channel) {
    filtered = filtered.filter((m) => m.channel === channel);
  }
  return filtered.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
};

export const sendArchitectChatMessage = (
  msg: Omit<ArchitectChatMessageItem, 'id' | 'timestamp' | 'read'>
): ArchitectChatMessageItem => {
  const all = safeJsonParse<ArchitectChatMessageItem[]>(STORAGE_KEYS.MESSAGES, []);
  const newItem: ArchitectChatMessageItem = {
    id: `MSG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    ...msg,
    timestamp: new Date().toISOString(),
    read: false,
  };
  safeJsonSave(STORAGE_KEYS.MESSAGES, [...all, newItem], 'ARCHITECT_MESSAGES_UPDATED');
  return newItem;
};
