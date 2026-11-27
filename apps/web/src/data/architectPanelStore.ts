import { syncChannel, broadcastStoreUpdate, getPlatformRequests } from './customerStore.js';
import { getExecutionProjects } from './projectExecutionStore.js';

// ==========================================
// 1. ARCHITECTURAL DESIGNS & DRAWINGS (SECTION 10 COMPLIANT)
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
  | 'RENOVATION_DRAWING'
  | 'BOQ_SPEC'
  | 'MUNICIPAL_SANCTION'
  | 'OTHER';

export type DesignStatus =
  | 'DRAFT'
  | 'SUBMITTED_TO_ADMIN'
  | 'ADMIN_APPROVED'
  | 'FORWARDED_TO_CUSTOMER'
  | 'PENDING_CUSTOMER_APPROVAL'
  | 'APPROVED'
  | 'CUSTOMER_APPROVED'
  | 'REVISION_REQUESTED'
  | 'CUSTOMER_REVISION_REQUESTED'
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
  customerPhone?: string;
  architectId?: string;
  architectName?: string;
  architectFirm?: string;
  architectPhone?: string;
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
  forwardedToCustomerAt?: string;
  customerDecisionAt?: string;
  isLatestApproved?: boolean;
  technicalCompliance?: {
    setbacksChecked?: boolean;
    vastuChecked?: boolean;
    structuralChecked?: boolean;
    municipalNormsChecked?: boolean;
  };
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
// ARCHITECT DESIGNS CRUD & SECTION 10 ADMIN WORKFLOW
// ==========================================
export const getDefaultSeedDesigns = (): ArchitecturalDesign[] => [
  {
    id: 'DSG-IND-01',
    projectId: 'BG-2026-0001',
    projectTitle: 'Modern Luxury Villa (G+2) - Super Corridor, Indore',
    customerId: 'CUST-IND-992',
    customerName: 'Sharika Mishra',
    customerPhone: '+91 98765 43210',
    architectId: 'ARC-2026-001',
    architectName: 'Ar. Rajesh Verma',
    architectFirm: 'Verma & Associates Architects',
    architectPhone: '+91 98112 34567',
    category: 'HOUSE_MAP',
    title: 'Vastu Ground Floor Architectural Plan (30x50 ft - North Facing)',
    description: 'Vastu-compliant G+2 ground layout with double-height living room, pooja in North-East, and kitchen in South-East.',
    fileUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    fileName: 'Ground_Floor_Plan_v2.0_Final.pdf',
    fileSize: '3.40 MB',
    fileType: 'PDF',
    currentVersion: 'v2.0',
    status: 'CUSTOMER_APPROVED',
    uploadedAt: '2026-11-10T10:00:00Z',
    updatedAt: '2026-11-18T14:30:00Z',
    revisionNotes: 'Relocated kitchen to South-East Agni corner and enlarged master bedroom wardrobe.',
    customerComments: 'Approved by Sharika Mishra. Layout matches our family requirements perfectly.',
    adminReviewNotes: 'Complies with Indore Master Plan 2021 setbacks and ground coverage norms.',
    approvedAt: '2026-11-19T09:15:00Z',
    forwardedToCustomerAt: '2026-11-18T15:00:00Z',
    isLatestApproved: true,
    technicalCompliance: {
      setbacksChecked: true,
      vastuChecked: true,
      structuralChecked: true,
      municipalNormsChecked: true,
    },
    versions: [
      {
        versionNumber: 'v1.0',
        fileUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
        fileName: 'Ground_Floor_Plan_v1.0.pdf',
        fileSize: '3.10 MB',
        uploadedAt: '2026-11-10T10:00:00Z',
        revisionNotes: 'Initial concept zoning floor plan.',
        status: 'REVISION_REQUESTED',
        customerComments: 'Please move kitchen closer to the utility area and recheck Vastu orientation.',
      },
      {
        versionNumber: 'v2.0',
        fileUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
        fileName: 'Ground_Floor_Plan_v2.0_Final.pdf',
        fileSize: '3.40 MB',
        uploadedAt: '2026-11-18T14:30:00Z',
        revisionNotes: 'Kitchen placed in SE Agni kon, utility corridor broadened.',
        status: 'CUSTOMER_APPROVED',
        customerComments: 'Approved! Everything looks perfect.',
      },
    ],
  },
  {
    id: 'DSG-IND-02',
    projectId: 'BG-2026-0001',
    projectTitle: 'Modern Luxury Villa (G+2) - Super Corridor, Indore',
    customerId: 'CUST-IND-992',
    customerName: 'Sharika Mishra',
    customerPhone: '+91 98765 43210',
    architectId: 'ARC-2026-001',
    architectName: 'Ar. Rajesh Verma',
    architectFirm: 'Verma & Associates Architects',
    category: 'ELEVATION_3D',
    title: 'Photorealistic 3D Facade Rendering & Daylight Study',
    description: 'Contemporary facade with Italian travertine cladding, vertical aluminum louvers, and warm ambient evening lighting.',
    fileUrl: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80',
    fileName: 'Villa_3D_Facade_Render_v1.1.png',
    fileSize: '8.25 MB',
    fileType: 'PNG',
    currentVersion: 'v1.1',
    status: 'FORWARDED_TO_CUSTOMER',
    uploadedAt: '2026-11-20T11:00:00Z',
    updatedAt: '2026-11-22T16:00:00Z',
    revisionNotes: 'Adjusted wood texture on terrace pergola per client preference.',
    customerComments: 'Reviewing terracotta texture vs grey stone with family.',
    adminReviewNotes: 'Color palette verified against platform luxury guidelines.',
    forwardedToCustomerAt: '2026-11-22T16:30:00Z',
    versions: [
      {
        versionNumber: 'v1.0',
        fileUrl: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80',
        fileName: 'Villa_3D_Facade_Render_v1.0.png',
        fileSize: '7.80 MB',
        uploadedAt: '2026-11-20T11:00:00Z',
        revisionNotes: 'Initial high-res exterior rendering.',
        status: 'REVISION_REQUESTED',
      },
      {
        versionNumber: 'v1.1',
        fileUrl: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80',
        fileName: 'Villa_3D_Facade_Render_v1.1.png',
        fileSize: '8.25 MB',
        uploadedAt: '2026-11-22T16:00:00Z',
        revisionNotes: 'Updated pergola louvers to dark walnut finish.',
        status: 'FORWARDED_TO_CUSTOMER',
      },
    ],
  },
  {
    id: 'DSG-IND-03',
    projectId: 'BG-2026-0001',
    projectTitle: 'Modern Luxury Villa (G+2) - Super Corridor, Indore',
    customerId: 'CUST-IND-992',
    customerName: 'Sharika Mishra',
    architectId: 'ARC-2026-002',
    architectName: 'Er. Alok Sengupta',
    architectFirm: 'Apex Structural Engineering Consultancy',
    category: 'STRUCTURAL_COORDINATION',
    title: 'IS 456 Column-Beam Layout & Ductile Detailing Sheet (Zone III)',
    description: 'M25 grade concrete and Fe500D TMT bar scheduling. Ductile detailing per IS 13920 for seismic resilience.',
    fileUrl: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80',
    fileName: 'IS456_Structural_Column_Grid_v1.0.dwg',
    fileSize: '5.10 MB',
    fileType: 'DWG',
    currentVersion: 'v1.0',
    status: 'APPROVED',
    uploadedAt: '2026-11-21T09:00:00Z',
    updatedAt: '2026-11-21T09:00:00Z',
    revisionNotes: 'Verified by Er. Anil Sharma, Chartered Structural Engineer.',
    adminReviewNotes: 'Complies with National Building Code (NBC 2016) Part 6.',
    isLatestApproved: true,
    technicalCompliance: {
      setbacksChecked: true,
      vastuChecked: true,
      structuralChecked: true,
      municipalNormsChecked: true,
    },
    versions: [
      {
        versionNumber: 'v1.0',
        fileUrl: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80',
        fileName: 'IS456_Structural_Column_Grid_v1.0.dwg',
        fileSize: '5.10 MB',
        uploadedAt: '2026-11-21T09:00:00Z',
        revisionNotes: 'Initial structural vetting release.',
        status: 'APPROVED',
      },
    ],
  },
  {
    id: 'DSG-IND-04',
    projectId: 'BG-2026-0001',
    projectTitle: 'Modern Luxury Villa (G+2) - Super Corridor, Indore',
    customerId: 'CUST-IND-992',
    customerName: 'Sharika Mishra',
    architectId: 'ARC-2026-001',
    architectName: 'Ar. Rajesh Verma',
    architectFirm: 'Verma & Associates Architects',
    category: 'WORKING_DRAWINGS',
    title: 'MEP Internal Plumbing, Drainage & Rainwater Harvesting Layout',
    description: 'Complete soil, waste, and vent pipe (SVP) layout with inspection chambers and rooftop rainwater collection cistern.',
    fileUrl: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=1200&q=80',
    fileName: 'MEP_Plumbing_Rainwater_Harvesting_v1.0.pdf',
    fileSize: '4.60 MB',
    fileType: 'PDF',
    currentVersion: 'v1.0',
    status: 'SUBMITTED_TO_ADMIN',
    uploadedAt: '2026-11-23T15:00:00Z',
    updatedAt: '2026-11-23T15:00:00Z',
    revisionNotes: 'Submitted for Admin technical audit and customer delivery clearance.',
    versions: [
      {
        versionNumber: 'v1.0',
        fileUrl: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=1200&q=80',
        fileName: 'MEP_Plumbing_Rainwater_Harvesting_v1.0.pdf',
        fileSize: '4.60 MB',
        uploadedAt: '2026-11-23T15:00:00Z',
        revisionNotes: 'First submission to Admin audit queue.',
        status: 'SUBMITTED_TO_ADMIN',
      },
    ],
  },
  {
    id: 'DSG-BG-05',
    projectId: 'BG-2026-0002',
    projectTitle: 'Independent Residential House (G+1) - Gurugram Sector 57',
    customerId: 'usr-cust-102',
    customerName: 'Vikramaditya Roy',
    customerPhone: '+91 98112 00099',
    architectId: 'ARC-2026-003',
    architectName: 'Ar. Sneha Kulkarni',
    architectFirm: 'Studio Kulkarni Architects',
    category: 'MUNICIPAL_SANCTION',
    title: 'Town & Country Planning Sanction Map & Setback Blueprint',
    description: 'Official municipal clearance drawing with certified FAR 1.75 and front setback 15 ft.',
    fileUrl: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80',
    fileName: 'Municipal_Sanction_Blueprint_v1.0.pdf',
    fileSize: '6.20 MB',
    fileType: 'PDF',
    currentVersion: 'v1.0',
    status: 'SUBMITTED_TO_ADMIN',
    uploadedAt: '2026-11-25T11:00:00Z',
    updatedAt: '2026-11-25T11:00:00Z',
    revisionNotes: 'Municipal scrutiny fee receipt and sanction stamps included.',
    versions: [
      {
        versionNumber: 'v1.0',
        fileUrl: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80',
        fileName: 'Municipal_Sanction_Blueprint_v1.0.pdf',
        fileSize: '6.20 MB',
        uploadedAt: '2026-11-25T11:00:00Z',
        revisionNotes: 'Official authority seal scan.',
        status: 'SUBMITTED_TO_ADMIN',
      },
    ],
  },
  {
    id: 'DSG-BG-06',
    projectId: 'BG-2026-0002',
    projectTitle: 'Independent Residential House (G+1) - Gurugram Sector 57',
    customerId: 'usr-cust-102',
    customerName: 'Vikramaditya Roy',
    architectId: 'ARC-2026-003',
    architectName: 'Ar. Sneha Kulkarni',
    architectFirm: 'Studio Kulkarni Architects',
    category: 'BOQ_SPEC',
    title: 'Schedule of Architectural Finishes & Detailed BOQ Item Rates',
    description: 'Specification schedule for Italian marble, CPVC plumbing fixtures, and UPVC double-glazed windows.',
    fileUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80',
    fileName: 'BOQ_Specifications_Finishes_v1.0.pdf',
    fileSize: '2.90 MB',
    fileType: 'PDF',
    currentVersion: 'v1.0',
    status: 'CUSTOMER_REVISION_REQUESTED',
    uploadedAt: '2026-11-24T09:00:00Z',
    updatedAt: '2026-11-26T17:00:00Z',
    revisionNotes: 'Initial item schedule.',
    customerComments: 'Client requested upgrade to Kohler Sensate touchless faucets and wooden laminate in master suite.',
    adminReviewNotes: 'Forwarded to Architect Sneha Kulkarni for cost adjustment revision.',
    versions: [
      {
        versionNumber: 'v1.0',
        fileUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80',
        fileName: 'BOQ_Specifications_Finishes_v1.0.pdf',
        fileSize: '2.90 MB',
        uploadedAt: '2026-11-24T09:00:00Z',
        revisionNotes: 'Initial BOQ specification release.',
        status: 'CUSTOMER_REVISION_REQUESTED',
        customerComments: 'Client requested upgrade to Kohler Sensate touchless faucets and wooden laminate in master suite.',
      },
    ],
  },
];

export const getArchitectDesigns = (projectId?: string): ArchitecturalDesign[] => {
  let designs = safeJsonParse<ArchitecturalDesign[]>(STORAGE_KEYS.DESIGNS, []);
  if (!designs || designs.length === 0) {
    designs = getDefaultSeedDesigns();
    safeJsonSave(STORAGE_KEYS.DESIGNS, designs);
  }
  if (!projectId || projectId === 'ALL') return designs;
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

/**
 * Section 10 Core Action: Admin approves architect design and forwards it to Homeowner.
 */
export const adminApproveAndForwardDesign = (
  designId: string,
  params: { adminNotes?: string; handoverInstructions?: string }
): ArchitecturalDesign | null => {
  const all = getArchitectDesigns();
  const idx = all.findIndex((d) => d.id === designId);
  if (idx < 0) return null;

  const current = all[idx];
  const now = new Date().toISOString();

  const updatedItem: ArchitecturalDesign = {
    ...current,
    status: 'FORWARDED_TO_CUSTOMER',
    adminReviewNotes: params.adminNotes || 'Technical compliance audit cleared by Admin Desk.',
    forwardedToCustomerAt: now,
    updatedAt: now,
    versions: current.versions.map((v, i) =>
      i === 0
        ? {
            ...v,
            status: 'FORWARDED_TO_CUSTOMER',
            adminReviewNotes: params.adminNotes,
          }
        : v
    ),
  };

  all[idx] = updatedItem;
  safeJsonSave(STORAGE_KEYS.DESIGNS, all, 'ARCHITECT_DESIGNS_UPDATED');

  // Push architect notification
  addArchitectNotification({
    type: 'DESIGN_FORWARDED',
    title: `Design Forwarded to Client: ${current.title}`,
    message: `Admin verified your design (${current.currentVersion}) and delivered it to ${current.customerName}.`,
    severity: 'SUCCESS',
    linkPath: `/professional/designs?tab=approvals`,
  });

  // Synchronize to customer approvals localStorage key
  try {
    const custKey = `customer_approvals_${current.projectId}`;
    const custExisting = safeJsonParse<any[]>(custKey, []);
    const already = custExisting.find((c) => c.id === current.id || c.documentTitle === current.title);
    if (!already) {
      custExisting.unshift({
        id: current.id,
        projectId: current.projectId,
        documentTitle: current.title,
        category: current.category.includes('STRUCTURAL') ? 'STRUCTURAL' : current.category.includes('INTERIOR') ? 'INTERIOR' : 'ARCHITECTURAL',
        documentVersion: current.currentVersion,
        previewUrl: current.fileUrl,
        status: 'PENDING',
        submittedAt: now,
        designerName: current.architectName || 'Lead Architect Partner',
        designerRole: 'Chartered Project Architect',
        notes: params.adminNotes || current.description,
        history: [{ version: current.currentVersion, comment: 'Forwarded by Admin after technical compliance audit', timestamp: now, by: 'BuildGhar Admin' }],
      });
      localStorage.setItem(custKey, JSON.stringify(custExisting));
    }
  } catch (e) {
    console.warn('Could not sync to customer_approvals:', e);
  }

  return updatedItem;
};

/**
 * Section 10 Core Action: Admin requests technical revision from Architect with redlines.
 */
export const adminRequestDesignRevision = (
  designId: string,
  params: { revisionNotes: string; redlineComments?: string }
): ArchitecturalDesign | null => {
  const all = getArchitectDesigns();
  const idx = all.findIndex((d) => d.id === designId);
  if (idx < 0) return null;

  const current = all[idx];
  const now = new Date().toISOString();

  const updatedItem: ArchitecturalDesign = {
    ...current,
    status: 'REVISION_REQUESTED',
    adminReviewNotes: params.revisionNotes,
    updatedAt: now,
    versions: current.versions.map((v, i) =>
      i === 0
        ? {
            ...v,
            status: 'REVISION_REQUESTED',
            adminReviewNotes: params.revisionNotes,
          }
        : v
    ),
  };

  all[idx] = updatedItem;
  safeJsonSave(STORAGE_KEYS.DESIGNS, all, 'ARCHITECT_DESIGNS_UPDATED');

  // Push architect notification
  addArchitectNotification({
    type: 'REVISION_REQUESTED',
    title: `Revision Required: ${current.title}`,
    message: `Admin requested design revision on ${current.currentVersion}: "${params.revisionNotes}". Please review redlines and upload updated version.`,
    severity: 'WARNING',
    linkPath: `/professional/designs?tab=floor-plan`,
  });

  return updatedItem;
};

/**
 * Section 10 Core Action: Admin rejects architect design submission.
 */
export const adminRejectDesign = (designId: string, reason: string): ArchitecturalDesign | null => {
  const all = getArchitectDesigns();
  const idx = all.findIndex((d) => d.id === designId);
  if (idx < 0) return null;

  const current = all[idx];
  const now = new Date().toISOString();

  const updatedItem: ArchitecturalDesign = {
    ...current,
    status: 'REJECTED',
    adminReviewNotes: reason,
    updatedAt: now,
    versions: current.versions.map((v, i) =>
      i === 0
        ? {
            ...v,
            status: 'REJECTED',
            adminReviewNotes: reason,
          }
        : v
    ),
  };

  all[idx] = updatedItem;
  safeJsonSave(STORAGE_KEYS.DESIGNS, all, 'ARCHITECT_DESIGNS_UPDATED');

  addArchitectNotification({
    type: 'DESIGN_REJECTED',
    title: `Design Submission Rejected: ${current.title}`,
    message: `Submission was rejected by Admin Desk. Reason: ${reason}`,
    severity: 'ALERT',
    linkPath: `/professional/designs?tab=floor-plan`,
  });

  return updatedItem;
};

/**
 * Section 10 Core Action: Admin forwards customer's requested revisions to the Architect.
 */
export const adminForwardCustomerRevisionToArchitect = (
  designId: string,
  adminInstructions?: string
): ArchitecturalDesign | null => {
  const all = getArchitectDesigns();
  const idx = all.findIndex((d) => d.id === designId);
  if (idx < 0) return null;

  const current = all[idx];
  const now = new Date().toISOString();
  const combinedRemarks = `${current.customerComments || 'Customer requested changes.'} ${adminInstructions ? `| Admin Directive: ${adminInstructions}` : ''}`;

  const updatedItem: ArchitecturalDesign = {
    ...current,
    status: 'REVISION_REQUESTED',
    adminReviewNotes: combinedRemarks,
    updatedAt: now,
    versions: current.versions.map((v, i) =>
      i === 0
        ? {
            ...v,
            status: 'REVISION_REQUESTED',
            adminReviewNotes: combinedRemarks,
          }
        : v
    ),
  };

  all[idx] = updatedItem;
  safeJsonSave(STORAGE_KEYS.DESIGNS, all, 'ARCHITECT_DESIGNS_UPDATED');

  addArchitectNotification({
    type: 'CLIENT_REVISION_FORWARDED',
    title: `Client Changes Forwarded: ${current.title}`,
    message: `Admin routed client feedback to you: "${combinedRemarks}". Please update the drawing to ${current.currentVersion === 'v1.0' ? 'v1.1' : 'v2.0'}.`,
    severity: 'WARNING',
    linkPath: `/professional/designs?tab=floor-plan`,
  });

  return updatedItem;
};

/**
 * Section 10 Core Action: Admin directly uploads official project documents/blueprints.
 */
export const adminUploadOfficialDocument = (params: {
  projectId: string;
  projectTitle?: string;
  customerName?: string;
  category: DesignCategory;
  title: string;
  description?: string;
  fileUrl: string;
  fileName: string;
  fileSize?: string;
  fileType?: 'PDF' | 'JPG' | 'PNG' | 'DWG' | 'DXF';
  version?: string;
}): ArchitecturalDesign => {
  const now = new Date().toISOString();
  const ver = params.version || 'v1.0';
  const newDoc: ArchitecturalDesign = {
    id: `DSG-OFFICIAL-${Date.now()}`,
    projectId: params.projectId,
    projectTitle: params.projectTitle || `Project ${params.projectId}`,
    customerId: 'CUST-OFFICIAL',
    customerName: params.customerName || 'Registered Homeowner',
    architectId: 'ADMIN-DESK',
    architectName: 'BuildGhar Engineering Desk',
    architectFirm: 'BuildGhar Central Technical Directorate',
    category: params.category,
    title: params.title,
    description: params.description || 'Official technical document uploaded by Admin Desk.',
    fileUrl: params.fileUrl,
    fileName: params.fileName,
    fileSize: params.fileSize || '3.50 MB',
    fileType: params.fileType || 'PDF',
    currentVersion: ver,
    status: 'FORWARDED_TO_CUSTOMER',
    uploadedAt: now,
    updatedAt: now,
    revisionNotes: 'Official administrative document upload.',
    adminReviewNotes: 'Verified and authorized by Super Admin.',
    approvedAt: now,
    forwardedToCustomerAt: now,
    isLatestApproved: true,
    technicalCompliance: {
      setbacksChecked: true,
      vastuChecked: true,
      structuralChecked: true,
      municipalNormsChecked: true,
    },
    versions: [
      {
        versionNumber: ver,
        fileUrl: params.fileUrl,
        fileName: params.fileName,
        fileSize: params.fileSize || '3.50 MB',
        uploadedAt: now,
        revisionNotes: 'Official document release.',
        status: 'FORWARDED_TO_CUSTOMER',
        adminReviewNotes: 'Direct admin signoff.',
      },
    ],
  };

  saveArchitectDesign(newDoc);
  return newDoc;
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
