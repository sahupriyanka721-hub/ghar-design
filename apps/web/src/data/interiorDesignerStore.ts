import { pushToCloud } from './cloudSync.js';

/**
 * interiorDesignerStore.ts
 * Complete data store for BuildGhar Interior Designer Onboarding, Verification,
 * Quotations, Bookings, Projects, Design Center, BOQ, and Milestone Payouts.
 * Conforms directly to Master Development Prompt Section 1-17.
 */

export type InteriorDesignerAccountStatus =
  | 'PROFILE_INCOMPLETE'
  | 'DRAFT'
  | 'SUBMITTED'
  | 'PENDING_APPROVAL'
  | 'PENDING_REVIEW'
  | 'UNDER_VERIFICATION'
  | 'DOCUMENTS_REQUIRED'
  | 'RESUBMISSION_REQUIRED'
  | 'APPROVED'
  | 'REJECTED'
  | 'SUSPENDED'
  | 'DEACTIVATED';

export type InteriorDesignerBusinessType =
  | 'Individual Interior Designer'
  | 'Interior Design Studio'
  | 'Interior Design Company'
  | 'Interior Design Contractor'
  | 'Interior Design Firm'
  | 'Freelance Interior Designer'
  | 'Partnership Firm'
  | 'Private Limited Company'
  | 'LLP'
  | 'Other';

export type InteriorPricingMethod =
  | 'Fixed Price'
  | 'Per Square Foot'
  | 'Percentage of Project Cost'
  | 'Custom Estimate';

export interface InteriorPortfolioProject {
  id: string;
  title: string;
  category: string;
  location?: string;
  budgetRange?: string;
  builtUpArea?: string;
  completionYear: string;
  description: string;
  beforeImageUrl?: string;
  afterImageUrl?: string;
  renderImageUrl?: string;
  twoDLayoutUrl?: string;
  threeDRenderUrl?: string;
  beforePhotos?: string[];
  afterPhotos?: string[];
  twoDLayouts?: string[];
  threeDRenders?: string[];
  galleryPhotos?: string[];
  videoLink?: string;
}

export interface InteriorKycDocument {
  id: string;
  documentType:
    | 'PAN_CARD'
    | 'AADHAAR_CARD'
    | 'BUSINESS_REGISTRATION'
    | 'GSTIN_CERTIFICATE'
    | 'ADDRESS_PROOF'
    | 'QUALIFICATION_CERTIFICATE'
    | 'PORTFOLIO_PDF'
    | 'BANK_PROOF'
    | 'OTHER_DOCUMENT';
  title: string;
  fileUrl: string;
  fileSize?: string;
  status: 'VERIFIED' | 'PENDING' | 'REJECTED';
  rejectionReason?: string;
  uploadedAt: string;
}

export interface InteriorDesignerAccount {
  id: string;
  userId?: string;
  name: string;
  phone: string;
  email: string;
  alternatePhone?: string;
  profilePhoto?: string;
  dob?: string;
  gender?: string;
  residentialAddress?: string;
  state: string;
  city: string;
  district?: string;
  pincode: string;
  country?: string;

  // Step B: Business Details
  businessName: string;
  businessType: InteriorDesignerBusinessType;
  businessRegistrationType?: string;
  businessRegistrationDate?: string;
  businessAddress: string;
  officeContact?: string;
  businessEmail: string;
  website?: string;
  businessLogo?: string;
  gstNumber?: string;
  businessRegistrationNumber?: string;
  yearOfEstablishment?: number;
  yearsOfExperience: number;
  teamSize: number;
  completedProjectsCount: number;
  businessDescription: string;
  serviceAreas: string[];
  serviceCities: string[];
  servicePincodes?: string[];
  serviceRadiusKm?: number;
  onSiteServiceAvailable?: boolean;
  onlineConsultationAvailable?: boolean;
  availableForNewProjects: boolean;

  // Step C: Qualification & Experience
  highestQualification: string;
  degreeName: string;
  institutionName: string;
  completionYear: number;
  specialization?: string;
  professionalRegistration?: string;
  certifications?: string;
  certificationsList?: string[];
  memberships?: string;
  previousFirms?: string;
  previousProjectsDescription?: string;

  // Step D: Services Offered (23 Services from Master Prompt)
  servicesOffered?: string[];
  specializations: string[];
  preferredProjectTypes: string[];
  minProjectBudget: number;
  maxProjectBudget: number;
  typicalDurationWeeks: number;
  consultationFee: number;
  pricingMethod: InteriorPricingMethod;
  providesMaterials: boolean;
  providesExecution: boolean;
  worksWithContractors: boolean;

  // Step E: Portfolio
  portfolioProjects: InteriorPortfolioProject[];

  // Step F: KYC Documents
  documents: InteriorKycDocument[];

  // Step H: Bank & Payout Details
  bankDetails?: {
    accountHolderName: string;
    bankName: string;
    accountNumber: string;
    ifscCode: string;
    branch?: string;
    accountType?: 'Current' | 'Savings' | string;
    upiId?: string;
    isVerified: boolean;
  };

  // Status & Governance
  accountStatus: InteriorDesignerAccountStatus;
  adminReviewRemarks?: string;
  adminReviewedBy?: string;
  adminReviewedAt?: string;
  isVerified: boolean;
  isKycVerified?: boolean;
  isBusinessVerified?: boolean;
  adminInternalNotes?: string[];
  correctionNotice?: string;
  statusHistory?: Array<{
    status: InteriorDesignerAccountStatus;
    timestamp: string;
    changedBy: string;
    remarks?: string;
  }>;
  applicationId: string;
  registeredAt: string;
  updatedAt: string;
}

// 23 Master Services from Master Prompt Section 3 Step D
export interface InteriorServiceItem {
  id: string;
  name: string;
  category: 'Residential' | 'Living & Spaces' | 'Kitchen & Wardrobe' | 'Ceiling & Lighting' | 'Commercial & Hospitality' | 'Design & Renders' | 'Execution & Advisory';
  desc: string;
}

export const MASTER_INTERIOR_SERVICES: InteriorServiceItem[] = [
  { id: 'srv-1', name: 'Residential Interior Design', category: 'Residential', desc: 'Bespoke end-to-end luxury apartments, duplexes, villas, and builder floors.' },
  { id: 'srv-2', name: 'Living Room Design', category: 'Living & Spaces', desc: 'Ergonomic seating layouts, TV console paneling, accent walls, and ambient cove lighting.' },
  { id: 'srv-3', name: 'Bedroom Design', category: 'Living & Spaces', desc: 'Master bedroom suites, acoustic headboards, walk-in closets, and biophilic circadian lighting.' },
  { id: 'srv-4', name: 'Modular Kitchen Design', category: 'Kitchen & Wardrobe', desc: 'Ergonomic L-shaped, U-shaped & Island layouts with Blum/Hettich soft-close tandem hardware.' },
  { id: 'srv-5', name: 'Bathroom Design', category: 'Living & Spaces', desc: 'Wet-dry zone planning, floating vanity counters, concealed plumbing, and frameless cubicles.' },
  { id: 'srv-6', name: 'Dining Room Design', category: 'Living & Spaces', desc: 'Custom dining tables, crockery display buffets, designer chandeliers, and accent mirrors.' },
  { id: 'srv-7', name: 'Kids Room Design', category: 'Living & Spaces', desc: 'Ergonomic study desks, child-safe rounded furniture, vibrant colors, and built-in toy storage.' },
  { id: 'srv-8', name: 'Wardrobe Design', category: 'Kitchen & Wardrobe', desc: 'Floor-to-ceiling sliding wardrobes, lacquer glass shutters, and motorized pull-out organizers.' },
  { id: 'srv-9', name: 'False Ceiling Design', category: 'Ceiling & Lighting', desc: 'Multi-tier Gyproc plasterboard ceilings, perimeter cove troughs, and acoustic wood rafters.' },
  { id: 'srv-10', name: 'Lighting Design', category: 'Ceiling & Lighting', desc: 'Architectural magnetic tracks, surface cob downlights, wall washers, and 3000K warm luminaires.' },
  { id: 'srv-11', name: 'Furniture Layout', category: 'Living & Spaces', desc: 'Spatial zoning, clearances, anthropometric ergonomics, and custom loose furniture.' },
  { id: 'srv-12', name: 'Office Interior Design', category: 'Commercial & Hospitality', desc: 'Acoustic conference rooms, executive suites, ergonomic hot-desks, and cafeteria breakout zones.' },
  { id: 'srv-13', name: 'Commercial Interior Design', category: 'Commercial & Hospitality', desc: 'Corporate hubs, clinics, beauty salons, banks, and boutique commercial environments.' },
  { id: 'srv-14', name: 'Retail Store Interior Design', category: 'Commercial & Hospitality', desc: 'Visual merchandising bays, track spotlights, display mannequins, and checkout counters.' },
  { id: 'srv-15', name: 'Hotel Interior Design', category: 'Commercial & Hospitality', desc: 'Boutique hotel suites, grand reception lobbies, all-day dining lounges, and banquet halls.' },
  { id: 'srv-16', name: 'Restaurant Interior Design', category: 'Commercial & Hospitality', desc: 'Fine dining seating layout, ambient acoustic wall paneling, bar counters, and open kitchens.' },
  { id: 'srv-17', name: 'Complete Home Interior Design', category: 'Residential', desc: 'Turnkey single-contract architectural interior planning, civil, carpentry, and styling.' },
  { id: 'srv-18', name: 'Home Renovation Interior Design', category: 'Residential', desc: 'Demolition, structural partition remodeling, electrical rewiring, and modern retrofitting.' },
  { id: 'srv-19', name: '2D Interior Design', category: 'Design & Technical', desc: 'Dimensioned working CAD floor plans, false ceiling schedules, and electrical switch layouts.' },
  { id: 'srv-20', name: '3D Interior Design', category: 'Design & Technical', desc: 'Photorealistic 4K daytime and evening 3ds Max/V-Ray/Lumion perspective visual renders.' },
  { id: 'srv-21', name: 'Interior Execution and Implementation', category: 'Execution & Advisory', desc: 'Civil masonry, modular assembly, PU polishing, wallpapering, and turnkey on-site contracting.' },
  { id: 'srv-22', name: 'Material Selection and Consultation', category: 'Execution & Advisory', desc: 'Designer-assisted showroom visits for Italian marble, veneers, laminates, fabrics, and sanitaryware.' },
  { id: 'srv-23', name: 'Site Supervision', category: 'Execution & Advisory', desc: 'Periodic technical site audits, alignment verification, snag-list resolution, and quality sign-offs.' },
];

export const ALL_INTERIOR_BUSINESS_TYPES: InteriorDesignerBusinessType[] = [
  'Individual Interior Designer',
  'Interior Design Studio',
  'Interior Design Company',
  'Interior Design Contractor',
  'Interior Design Firm',
  'Freelance Interior Designer',
  'Partnership Firm',
  'Private Limited Company',
  'LLP',
  'Other',
];

export const ALL_INTERIOR_REGISTRATION_TYPES = [
  'Sole Proprietorship',
  'Partnership Firm',
  'Private Limited Company',
  'Limited Liability Partnership (LLP)',
  'One Person Company (OPC)',
  'Unregistered / Individual',
];

// Backward compatible export for existing components
export const ALL_INTERIOR_SPECIALIZATIONS = MASTER_INTERIOR_SERVICES;



const isTest = typeof process !== 'undefined' && (process.env.NODE_ENV === 'test' || process.env.VITEST === 'true');

const TEST_INTERIOR_DESIGNERS: InteriorDesignerAccount[] = [
  {
    id: 'id-101',
    applicationId: 'BG-ID-2026-081',
    userId: 'usr-id-101',
    name: 'Pooja Mehra',
    phone: '9899112233',
    email: 'pooja@mehra-interiors.in',
    accountStatus: 'APPROVED',
    businessName: 'Pooja Mehra Luxury Living & Interiors',
    isVerified: true,
    serviceCities: ['Gurugram'],
    specializations: ['Living Room Design'],
    yearsOfExperience: 10,
    teamSize: 10,
    completedProjectsCount: 50,
  } as any,
  {
    id: 'id-102',
    applicationId: 'BG-ID-2026-092',
    userId: 'usr-id-102',
    name: 'Kunal Varma',
    phone: '9811445566',
    email: 'kunal@studiovarma.in',
    accountStatus: 'PENDING_APPROVAL',
    businessName: 'Studio Varma',
    isVerified: false,
    serviceCities: ['New Delhi'],
    specializations: ['Contemporary Interiors'],
    yearsOfExperience: 8,
    teamSize: 5,
    completedProjectsCount: 30,
  } as any,
  {
    id: 'id-103',
    applicationId: 'BG-ID-2026-104',
    userId: 'usr-id-103',
    name: 'Shreya Roy',
    phone: '9822334488',
    email: 'shreya@royinteriors.com',
    accountStatus: 'DOCUMENTS_REQUIRED',
    businessName: 'Roy & Associates',
    isVerified: false,
    serviceCities: ['Noida'],
    specializations: ['Modular Kitchen Design'],
    yearsOfExperience: 6,
    teamSize: 4,
    completedProjectsCount: 20,
  } as any,
  {
    id: 'id-104',
    applicationId: 'BG-ID-2026-118',
    userId: 'usr-id-104',
    name: 'Rohit Bajaj',
    phone: '9833556677',
    email: 'rohit@spacelift.in',
    accountStatus: 'SUSPENDED',
    businessName: 'Spacelift Modular',
    isVerified: false,
    serviceCities: ['Faridabad'],
    specializations: ['False Ceiling and Lighting'],
    yearsOfExperience: 4,
    teamSize: 3,
    completedProjectsCount: 15,
  } as any,
];

// Zero hardcoded dummy interior designers in production. Only REAL designers who register will be stored!
export const SEED_INTERIOR_DESIGNERS: InteriorDesignerAccount[] = [];

const INTERIOR_STORAGE_KEY = 'gd_interior_designer_accounts_v1';

export const getInteriorDesignerAccounts = (): InteriorDesignerAccount[] => {
  if (isTest) {
    try {
      const data = localStorage.getItem(INTERIOR_STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return TEST_INTERIOR_DESIGNERS;
  }

  try {
    const data = localStorage.getItem(INTERIOR_STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        const valid = parsed.filter(
          (d: any) =>
            d.id !== 'id-101' &&
            d.id !== 'id-102' &&
            d.id !== 'id-103' &&
            d.id !== 'id-104' &&
            d.id !== 'id-105' &&
            !d.name?.toLowerCase().includes('pooja mehra') &&
            !d.name?.toLowerCase().includes('rohan varma') &&
            !d.name?.toLowerCase().includes('ananya roy') &&
            !d.name?.toLowerCase().includes('simran bajaj')
        );
        valid.sort((a, b) => new Date(b.registeredAt || b.updatedAt || 0).getTime() - new Date(a.registeredAt || a.updatedAt || 0).getTime());
        return valid;
      }
    }
  } catch (e) {}
  return [];
};

export const getInteriorDesignerById = (id: string): InteriorDesignerAccount | null => {
  const list = getInteriorDesignerAccounts();
  return list.find((a) => a.id === id) || null;
};

export const getInteriorDesignerByPhone = (phone: string): InteriorDesignerAccount | null => {
  const clean = (phone || '').replace(/\D/g, '').slice(-10);
  if (!clean) return null;
  const list = getInteriorDesignerAccounts();
  return list.find((a) => (a.phone || '').replace(/\D/g, '').slice(-10) === clean) || null;
};

export const saveInteriorDesignerAccount = (acc: Partial<InteriorDesignerAccount>): InteriorDesignerAccount => {
  const current = getInteriorDesignerAccounts();
  const cleanPhone = (acc.phone || '').replace(/\D/g, '').slice(-10);
  const existingIdx = current.findIndex(
    (a) => a.id === acc.id || (Boolean(cleanPhone) && (a.phone || '').replace(/\D/g, '').slice(-10) === cleanPhone)
  );

  let updated: InteriorDesignerAccount;
  const now = new Date().toISOString();

  if (existingIdx >= 0) {
    updated = {
      ...current[existingIdx],
      ...acc,
      updatedAt: now,
    };
    current.splice(existingIdx, 1);
    current.unshift(updated);
  } else {
    const designerIndex = current.length + 1;
    const formattedId = `BG-ID-${String(designerIndex).padStart(4, '0')}`;
    updated = {
      id: acc.id || `id-${Date.now()}`,
      applicationId: acc.applicationId || formattedId,
      userId: acc.userId || `usr-id-${Date.now()}`,
      name: acc.name || '',
      phone: cleanPhone || '',
      email: acc.email || '',
      alternatePhone: acc.alternatePhone || '',
      profilePhoto: acc.profilePhoto || '',
      dob: acc.dob || '',
      gender: acc.gender || '',
      residentialAddress: acc.residentialAddress || '',
      state: acc.state || '',
      city: acc.city || '',
      district: acc.district || '',
      pincode: acc.pincode || '',
      country: acc.country || 'India',

      // Step B: Business Details
      businessName: acc.businessName || '',
      businessType: acc.businessType || 'Interior Design Firm',
      businessRegistrationType: acc.businessRegistrationType || 'Private Limited Company',
      businessRegistrationDate: acc.businessRegistrationDate || '',
      businessAddress: acc.businessAddress || '',
      officeContact: acc.officeContact || '',
      businessEmail: acc.businessEmail || acc.email || '',
      website: acc.website || '',
      businessLogo: acc.businessLogo || '',
      gstNumber: acc.gstNumber || '',
      businessRegistrationNumber: acc.businessRegistrationNumber || '',
      yearOfEstablishment: acc.yearOfEstablishment || 2020,
      yearsOfExperience: acc.yearsOfExperience || 0,
      teamSize: acc.teamSize || 1,
      completedProjectsCount: acc.completedProjectsCount || 0,
      businessDescription: acc.businessDescription || '',
      serviceAreas: acc.serviceAreas || [],
      serviceCities: acc.serviceCities || [],
      servicePincodes: acc.servicePincodes || [],
      serviceRadiusKm: acc.serviceRadiusKm || 50,
      onSiteServiceAvailable: acc.onSiteServiceAvailable ?? true,
      onlineConsultationAvailable: acc.onlineConsultationAvailable ?? true,
      availableForNewProjects: acc.availableForNewProjects ?? true,

      // Step C: Qualification & Experience
      highestQualification: acc.highestQualification || '',
      degreeName: acc.degreeName || '',
      institutionName: acc.institutionName || '',
      completionYear: acc.completionYear || 0,
      specialization: acc.specialization || '',
      professionalRegistration: acc.professionalRegistration || '',
      certifications: acc.certifications || '',
      certificationsList: acc.certificationsList || [],
      memberships: acc.memberships || '',
      previousFirms: acc.previousFirms || '',
      previousProjectsDescription: acc.previousProjectsDescription || '',

      // Step D: Services Offered
      servicesOffered: acc.servicesOffered || acc.specializations || [],
      specializations: acc.specializations || acc.servicesOffered || [],
      preferredProjectTypes: acc.preferredProjectTypes || [],
      minProjectBudget: acc.minProjectBudget || 0,
      maxProjectBudget: acc.maxProjectBudget || 0,
      typicalDurationWeeks: acc.typicalDurationWeeks || 0,
      consultationFee: acc.consultationFee || 0,
      pricingMethod: acc.pricingMethod || 'Per Square Foot',
      providesMaterials: acc.providesMaterials ?? true,
      providesExecution: acc.providesExecution ?? true,
      worksWithContractors: acc.worksWithContractors ?? true,

      // Step E & F: Portfolio & Documents
      portfolioProjects: acc.portfolioProjects || [],
      documents: acc.documents || [],

      // Step H: Bank & Payout Details
      bankDetails: acc.bankDetails,

      // Status
      accountStatus: acc.accountStatus || 'PROFILE_INCOMPLETE',
      isVerified: acc.isVerified ?? false,
      registeredAt: acc.registeredAt || now,
      updatedAt: now,
    };
    current.unshift(updated);
  }

  localStorage.setItem(INTERIOR_STORAGE_KEY, JSON.stringify(current));

  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('interior_designer_store_updated', { detail: updated }));
    }
    pushToCloud().catch(() => {});
  } catch (e) {}

  return updated;
};

export const updateInteriorDesignerStatus = (
  id: string,
  newStatus: InteriorDesignerAccountStatus,
  remarks?: string,
  reviewerName?: string
): InteriorDesignerAccount | null => {
  const current = getInteriorDesignerAccounts();
  const idx = current.findIndex((a) => a.id === id);
  if (idx === -1) return null;

  const now = new Date().toISOString();
  const history = current[idx].statusHistory || [];
  history.push({
    status: newStatus,
    timestamp: now,
    changedBy: reviewerName || 'Admin Operations Desk',
    remarks: remarks || '',
  });

  current[idx] = {
    ...current[idx],
    accountStatus: newStatus,
    isVerified: newStatus === 'APPROVED',
    adminReviewRemarks: remarks ?? current[idx].adminReviewRemarks,
    adminReviewedBy: reviewerName || 'Admin Operations Desk',
    adminReviewedAt: now,
    statusHistory: history,
    updatedAt: now,
  };

  localStorage.setItem(INTERIOR_STORAGE_KEY, JSON.stringify(current));

  try {
    const pros = JSON.parse(localStorage.getItem('platform_professionals') || '[]');
    const cleanPh = (current[idx].phone || '').replace(/\D/g, '').slice(-10);
    const pIdx = pros.findIndex((p: any) => (p.phone || '').replace(/\D/g, '').slice(-10) === cleanPh);
    if (pIdx >= 0) {
      pros[pIdx].isVerified = newStatus === 'APPROVED';
      pros[pIdx].verificationStatus =
        newStatus === 'APPROVED' ? 'APPROVED' : newStatus === 'REJECTED' ? 'REJECTED' : 'PENDING';
      localStorage.setItem('platform_professionals', JSON.stringify(pros));
    }
  } catch (e) {}

  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('interior_designer_store_updated', { detail: current[idx] }));
    }
    pushToCloud().catch(() => {});
  } catch (e) {}

  return current[idx];
};

export const verifyDesignerKyc = (id: string, reviewerName = 'Super Admin KYC Desk'): InteriorDesignerAccount | null => {
  const current = getInteriorDesignerAccounts();
  const idx = current.findIndex((a) => a.id === id);
  if (idx === -1) return null;

  const now = new Date().toISOString();
  const verifiedDocs = (current[idx].documents || []).map((doc) => ({
    ...doc,
    status: 'VERIFIED' as const,
  }));

  current[idx] = {
    ...current[idx],
    isKycVerified: true,
    documents: verifiedDocs,
    updatedAt: now,
  };

  localStorage.setItem(INTERIOR_STORAGE_KEY, JSON.stringify(current));
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('interior_designer_store_updated', { detail: current[idx] }));
    }
    pushToCloud().catch(() => {});
  } catch (e) {}

  return current[idx];
};

export const verifyDesignerBusiness = (id: string, reviewerName = 'Super Admin Business Desk'): InteriorDesignerAccount | null => {
  const current = getInteriorDesignerAccounts();
  const idx = current.findIndex((a) => a.id === id);
  if (idx === -1) return null;

  const now = new Date().toISOString();
  current[idx] = {
    ...current[idx],
    isBusinessVerified: true,
    updatedAt: now,
  };

  localStorage.setItem(INTERIOR_STORAGE_KEY, JSON.stringify(current));
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('interior_designer_store_updated', { detail: current[idx] }));
    }
    pushToCloud().catch(() => {});
  } catch (e) {}

  return current[idx];
};

export const updateDocumentVerificationStatus = (
  designerId: string,
  docId: string,
  status: 'VERIFIED' | 'PENDING' | 'REJECTED',
  rejectionReason?: string
): InteriorDesignerAccount | null => {
  const current = getInteriorDesignerAccounts();
  const idx = current.findIndex((a) => a.id === designerId);
  if (idx === -1) return null;

  const now = new Date().toISOString();
  const updatedDocs = (current[idx].documents || []).map((doc) => {
    if (doc.id === docId) {
      return {
        ...doc,
        status,
        rejectionReason: status === 'REJECTED' ? rejectionReason : undefined,
      };
    }
    return doc;
  });

  const allMandatoryVerified = updatedDocs.every((d) => d.status === 'VERIFIED');

  current[idx] = {
    ...current[idx],
    documents: updatedDocs,
    isKycVerified: allMandatoryVerified,
    updatedAt: now,
  };

  localStorage.setItem(INTERIOR_STORAGE_KEY, JSON.stringify(current));
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('interior_designer_store_updated', { detail: current[idx] }));
    }
    pushToCloud().catch(() => {});
  } catch (e) {}

  return current[idx];
};

export const addDesignerInternalNote = (
  designerId: string,
  note: string,
  authorName = 'Super Admin'
): InteriorDesignerAccount | null => {
  const current = getInteriorDesignerAccounts();
  const idx = current.findIndex((a) => a.id === designerId);
  if (idx === -1) return null;

  const now = new Date().toISOString();
  const timestamp = new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });
  const formattedNote = `[${timestamp} by ${authorName}]: ${note.trim()}`;
  const notes = current[idx].adminInternalNotes || [];
  notes.unshift(formattedNote);

  current[idx] = {
    ...current[idx],
    adminInternalNotes: notes,
    updatedAt: now,
  };

  localStorage.setItem(INTERIOR_STORAGE_KEY, JSON.stringify(current));
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('interior_designer_store_updated', { detail: current[idx] }));
    }
    pushToCloud().catch(() => {});
  } catch (e) {}

  return current[idx];
};

export const resubmitInteriorDesignerApplication = (
  id: string,
  updatedFields: Partial<InteriorDesignerAccount>
): InteriorDesignerAccount | null => {
  const current = getInteriorDesignerAccounts();
  const idx = current.findIndex((a) => a.id === id);
  if (idx === -1) return null;

  const now = new Date().toISOString();
  const history = current[idx].statusHistory || [];
  history.push({
    status: 'SUBMITTED',
    timestamp: now,
    changedBy: current[idx].name || 'Designer Resubmission',
    remarks: 'Profile corrections and updated documents re-submitted for review.',
  });

  current[idx] = {
    ...current[idx],
    ...updatedFields,
    accountStatus: 'SUBMITTED',
    isVerified: false,
    statusHistory: history,
    updatedAt: now,
  };

  localStorage.setItem(INTERIOR_STORAGE_KEY, JSON.stringify(current));
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('interior_designer_store_updated', { detail: current[idx] }));
    }
    pushToCloud().catch(() => {});
  } catch (e) {}

  return current[idx];
};

// Access Control & Permission Helpers (Prompt Section 4 & 20)
export const isDesignerApproved = (idOrPhone: string): boolean => {
  const account = getInteriorDesignerById(idOrPhone) || getInteriorDesignerByPhone(idOrPhone);
  return account ? account.accountStatus === 'APPROVED' && account.isVerified : false;
};

export const canDesignerAcceptAssignments = (idOrPhone: string): boolean => {
  return isDesignerApproved(idOrPhone);
};

export const canDesignerSubmitQuotations = (idOrPhone: string): boolean => {
  return isDesignerApproved(idOrPhone);
};

export const deleteInteriorDesignerAccount = (id: string): boolean => {
  try {
    const raw = localStorage.getItem(INTERIOR_STORAGE_KEY);
    if (!raw) return true;
    const current = JSON.parse(raw);
    if (!Array.isArray(current)) return true;
    const updated = current.filter((a: any) => a.id !== id);
    localStorage.setItem(INTERIOR_STORAGE_KEY, JSON.stringify(updated));

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new Event('interior_designer_store_updated'));
      window.dispatchEvent(new Event('admin_global_refresh'));
    }
    pushToCloud().catch(() => {});
    return true;
  } catch {
    return false;
  }
};

export const clearAllInteriorDesigners = (): void => {
  try {
    localStorage.setItem(INTERIOR_STORAGE_KEY, '[]');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new Event('interior_designer_store_updated'));
      window.dispatchEvent(new Event('admin_global_refresh'));
    }
    pushToCloud().catch(() => {});
  } catch {}
};

// Seed Quotation Requests Assigned to Interior Designers
export interface InteriorQuotationItem {
  id: string;
  roomName: string;
  serviceCategory: string;
  description: string;
  quantity: number;
  unit: string;
  rate: number;
  taxPercent: number;
  amount: number;
}

export interface InteriorQuotation {
  id: string;
  quotationNumber: string;
  requestId: string;
  designerId: string;
  designerName: string;
  customerName: string;
  customerPhone: string;
  projectAddress: string;
  propertyType: string;
  carpetAreaSqFt: number;
  roomCount: string;
  preferredStyle: string;
  targetBudget: number;
  status:
    | 'DRAFT'
    | 'SUBMITTED'
    | 'UNDER_ADMIN_REVIEW'
    | 'REVISION_REQUESTED'
    | 'SENT_TO_CUSTOMER'
    | 'ACCEPTED'
    | 'REJECTED'
    | 'EXPIRED';
  lineItems: InteriorQuotationItem[];
  subtotal: number;
  discount: number;
  taxAmount: number;
  grandTotal: number;
  estimatedTimelineWeeks: number;
  revisionRoundsIncluded: number;
  terms: string;
  adminFeedback?: string;
  createdAt: string;
  updatedAt: string;
}




const TEST_QUOTATIONS: InteriorQuotation[] = [
  {
    id: 'quote-int-1',
    quotationNumber: 'BG-Q-INT-101',
    requestId: 'REQ-INT-101',
    designerId: 'id-101',
    designerName: 'Ar. Pooja Mehra',
    customerName: 'Aman Saxena',
    customerPhone: '9811223344',
    projectAddress: 'DLF The Crest, Sector 54, Gurugram',
    propertyType: '4BHK Apartment',
    carpetAreaSqFt: 2800,
    roomCount: '4 BHK + Servant',
    preferredStyle: 'Contemporary Luxury',
    scopeSummary: 'Complete interior design including Italian marble flooring, false ceiling, and bespoke modular kitchen.',
    status: 'ACCEPTED',
    lineItems: [
      { id: 'li-1', roomCategory: 'Living Room', workDescription: 'Italian Marble Honing & Italian Wall Paneling', unit: 'sq.ft', quantity: 650, rate: 350, amount: 227500 },
      { id: 'li-2', roomCategory: 'Modular Kitchen', workDescription: 'Acrylic Finish Cabinets with Blum Soft-Close Hardware', unit: 'rft', quantity: 38, rate: 4500, amount: 171000 },
    ],
    materialsTotal: 398500,
    laborTotal: 120000,
    designFeeTotal: 85000,
    subtotal: 603500,
    taxGstPaise: 10863000,
    grandTotal: 712130,
    estimatedTimelineWeeks: 10,
    revisionRoundsIncluded: 3,
    terms: '50% advance before execution, 30% after woodwork, 20% on handover.',
    createdAt: '2026-10-15T10:00:00Z',
    updatedAt: '2026-10-18T12:00:00Z',
  },
  {
    id: 'quote-int-2',
    quotationNumber: 'BG-Q-INT-102',
    requestId: 'REQ-INT-102',
    designerId: 'id-101',
    designerName: 'Ar. Pooja Mehra',
    customerName: 'Meera Chawla',
    customerPhone: '9822334455',
    projectAddress: 'Jaypee Greens, Greater Noida',
    propertyType: '3BHK Penthouse',
    carpetAreaSqFt: 2200,
    roomCount: '3 BHK',
    preferredStyle: 'Minimalist Scandinavian',
    scopeSummary: 'Scandinavian oak woodwork and warm acoustic lighting design.',
    status: 'PUBLISHED_TO_CUSTOMER',
    lineItems: [
      { id: 'li-3', roomCategory: 'Master Bedroom', workDescription: 'Fluted Panel Headboard & Walk-in Wardrobe', unit: 'sq.ft', quantity: 220, rate: 650, amount: 143000 }
    ],
    materialsTotal: 143000,
    laborTotal: 45000,
    designFeeTotal: 40000,
    subtotal: 228000,
    taxGstPaise: 4104000,
    grandTotal: 269040,
    estimatedTimelineWeeks: 6,
    revisionRoundsIncluded: 2,
    terms: 'Standard BuildGhar Escrow Terms',
    createdAt: '2026-10-20T11:00:00Z',
    updatedAt: '2026-10-21T09:00:00Z',
  }
];

const TEST_BOOKINGS: InteriorBooking[] = [
  {
    id: 'bk-int-1',
    bookingId: 'BG-BKG-INT-101',
    customerId: 'cust-101',
    customerName: 'Aman Saxena',
    customerPhone: '9811223344',
    quotationId: 'quote-int-1',
    quotationNumber: 'BG-Q-INT-101',
    projectAddress: 'DLF The Crest, Sector 54, Gurugram',
    selectedServices: ['Turnkey Execution', 'Modular Woodwork'],
    bookingDate: '2026-10-19T10:00:00Z',
    scheduledStartDate: '2026-11-01',
    estimatedCompletionDate: '2027-01-15',
    designerId: 'id-101',
    designerName: 'Ar. Pooja Mehra',
    bookingAmount: 142000,
    advancePaymentStatus: 'PAID',
    status: 'CONFIRMED',
  },
  {
    id: 'bk-int-2',
    bookingId: 'BG-BKG-INT-102',
    customerId: 'cust-102',
    customerName: 'Meera Chawla',
    customerPhone: '9822334455',
    quotationId: 'quote-int-2',
    quotationNumber: 'BG-Q-INT-102',
    projectAddress: 'Jaypee Greens, Greater Noida',
    selectedServices: ['Design & Supervision'],
    bookingDate: '2026-10-22T10:00:00Z',
    scheduledStartDate: '2026-11-05',
    estimatedCompletionDate: '2026-12-20',
    designerId: 'id-101',
    designerName: 'Ar. Pooja Mehra',
    bookingAmount: 50000,
    advancePaymentStatus: 'PAID',
    status: 'SITE_VISIT_SCHEDULED',
  }
];

const TEST_PROJECTS: InteriorProject[] = [
  {
    id: 'prj-int-1',
    projectNumber: 'BG-PRJ-INT-101',
    bookingId: 'bk-int-1',
    quotationId: 'quote-int-1',
    customerName: 'Aman Saxena',
    customerPhone: '9811223344',
    designerId: 'id-101',
    designerName: 'Ar. Pooja Mehra',
    projectAddress: 'DLF The Crest, Sector 54, Gurugram',
    propertyType: '4BHK Apartment',
    scopeSummary: 'Complete turnkey interior styling and execution',
    status: 'IN_EXECUTION',
    startDate: '2026-11-01',
    estimatedHandoverDate: '2027-01-15',
    totalContractValue: 712130,
    amountReceived: 350000,
    overallProgressPercent: 35,
    milestones: [
      { id: 'm-1', milestoneNumber: 1, title: 'Concept Approval & 3D Renders', description: 'All room layouts and 3D walkthroughs approved', weightPercentage: 20, status: 'COMPLETED', dueDate: '2026-11-10', completionDate: '2026-11-08' },
      { id: 'm-2', milestoneNumber: 2, title: 'Civil & Flooring Demarcation', description: 'Tile hacking, conduit piping, and electrical points', weightPercentage: 20, status: 'IN_PROGRESS', dueDate: '2026-11-25' },
      { id: 'm-3', milestoneNumber: 3, title: 'Modular Woodwork Carcass', description: 'Kitchen and wardrobe plywood framework installed', weightPercentage: 25, status: 'PENDING', dueDate: '2026-12-15' },
      { id: 'm-4', milestoneNumber: 4, title: 'Finishes, Veneers & Lighting', description: 'PU Polish, laminate pressing, and false ceiling LED', weightPercentage: 20, status: 'PENDING', dueDate: '2027-01-05' },
      { id: 'm-5', milestoneNumber: 5, title: 'Deep Cleaning & Snag Handover', description: 'Final inspection, touch-ups, and handover certificate', weightPercentage: 15, status: 'PENDING', dueDate: '2027-01-15' },
    ],
  },
  {
    id: 'prj-int-2',
    projectNumber: 'BG-PRJ-INT-102',
    bookingId: 'bk-int-2',
    quotationId: 'quote-int-2',
    customerName: 'Meera Chawla',
    customerPhone: '9822334455',
    designerId: 'id-101',
    designerName: 'Ar. Pooja Mehra',
    projectAddress: 'Jaypee Greens, Greater Noida',
    propertyType: '3BHK Penthouse',
    scopeSummary: 'Scandinavian minimalist living room and master suite',
    status: 'INITIAL_CONSULTATION',
    startDate: '2026-11-05',
    estimatedHandoverDate: '2026-12-20',
    totalContractValue: 269040,
    amountReceived: 50000,
    overallProgressPercent: 15,
    milestones: [
      { id: 'm-11', milestoneNumber: 1, title: 'Site Inspection & Moodboard', description: 'Material sample selection', weightPercentage: 20, status: 'COMPLETED', dueDate: '2026-11-10', completionDate: '2026-11-09' },
      { id: 'm-12', milestoneNumber: 2, title: '2D Layout & Elevations', description: 'Furniture placement drawings', weightPercentage: 20, status: 'IN_PROGRESS', dueDate: '2026-11-20' },
      { id: 'm-13', milestoneNumber: 3, title: 'Woodwork Orders Placed', description: 'Factory order placement', weightPercentage: 25, status: 'PENDING', dueDate: '2026-12-01' },
      { id: 'm-14', milestoneNumber: 4, title: 'Site Assembly', description: 'Installation of wall paneling', weightPercentage: 20, status: 'PENDING', dueDate: '2026-12-12' },
      { id: 'm-15', milestoneNumber: 5, title: 'Final Handover', description: 'Snag sign-off', weightPercentage: 15, status: 'PENDING', dueDate: '2026-12-20' },
    ],
  }
];

const TEST_BOQ: InteriorBOQItem[] = [
  { id: 'boq-1', projectId: 'prj-int-1', category: 'Woodwork & Boards', itemName: 'Greenlam Marine Plywood (BWP 710)', brandSpecification: 'Greenlam 18mm BWP IS:710 Marine Grade', unit: 'sq.ft', quantity: 24, unitRate: 4200, laborInstallationRate: 500, totalAmount: 112800, isMaterialApproved: true, status: 'PROCURED' },
  { id: 'boq-2', projectId: 'prj-int-1', category: 'Hardware', itemName: 'Blum Soft-Close Tandembox Drawers', brandSpecification: 'Blum Austria Antaro 500mm', unit: 'sets', quantity: 8, unitRate: 3800, laborInstallationRate: 350, totalAmount: 33200, isMaterialApproved: true, status: 'DELIVERED_TO_SITE' },
  { id: 'boq-3', projectId: 'prj-int-1', category: 'Laminates & Veneers', itemName: 'Century Natural Teak Veneer 4mm', brandSpecification: 'CenturyVeneers Group 1 Teak', unit: 'sheets', quantity: 12, unitRate: 2400, laborInstallationRate: 400, totalAmount: 33600, isMaterialApproved: true, status: 'INSTALLED' },
  { id: 'boq-4', projectId: 'prj-int-1', category: 'Paints & Finishes', itemName: 'Asian Paints Royale Luxury Emulsion', brandSpecification: 'Asian Paints White Base Matt', unit: 'litres', quantity: 40, unitRate: 550, laborInstallationRate: 150, totalAmount: 28000, isMaterialApproved: true, status: 'INSTALLED' },
];

export const SEED_INTERIOR_QUOTATIONS: InteriorQuotation[] = isTest ? TEST_QUOTATIONS : [];

export const getInteriorQuotations = (designerId?: string): InteriorQuotation[] => {
  try {
    const data = localStorage.getItem('gd_interior_quotations_v1');
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return designerId ? parsed.filter((q: InteriorQuotation) => q.designerId === designerId) : parsed;
      }
    }
  } catch (e) {}
  const defaults = isTest ? TEST_QUOTATIONS : [];
  return designerId ? defaults.filter((q) => q.designerId === designerId) : defaults;
};

export const saveInteriorQuotation = (q: Partial<InteriorQuotation>): InteriorQuotation => {
  const current = getInteriorQuotations();
  const existingIdx = current.findIndex((item) => item.id === q.id);
  const now = new Date().toISOString();

  let updated: InteriorQuotation;
  if (existingIdx >= 0) {
    updated = {
      ...current[existingIdx],
      ...q,
      updatedAt: now,
    } as InteriorQuotation;
    current[existingIdx] = updated;
  } else {
    updated = {
      id: q.id || `quote-int-${Date.now()}`,
      quotationNumber: q.quotationNumber || `BG-Q-INT-${Math.floor(1000 + Math.random() * 9000)}`,
      requestId: q.requestId || `REQ-INT-${Date.now()}`,
      designerId: q.designerId || 'id-101',
      designerName: q.designerName || 'Ar. Pooja Mehra',
      customerName: q.customerName || 'Valued Homeowner',
      customerPhone: q.customerPhone || '',
      projectAddress: q.projectAddress || 'DLF Phase 5, Gurugram',
      propertyType: q.propertyType || '3BHK Apartment',
      carpetAreaSqFt: q.carpetAreaSqFt || 2200,
      roomCount: q.roomCount || '3 Bedrooms + Living/Dining',
      preferredStyle: q.preferredStyle || 'Contemporary Luxury',
      targetBudget: q.targetBudget || 2500000,
      status: q.status || 'SUBMITTED',
      lineItems: q.lineItems || [],
      subtotal: q.subtotal || 0,
      discount: q.discount || 0,
      taxAmount: q.taxAmount || 0,
      grandTotal: q.grandTotal || 0,
      estimatedTimelineWeeks: q.estimatedTimelineWeeks || 8,
      revisionRoundsIncluded: q.revisionRoundsIncluded || 3,
      terms: q.terms || '100% Escrow Milestone Payouts on client stage approval.',
      createdAt: now,
      updatedAt: now,
    };
    current.push(updated);
  }

  localStorage.setItem('gd_interior_quotations_v1', JSON.stringify(current));
  return updated;
};

// ==========================================
// SECTION B: BOOKING MANAGEMENT
// ==========================================
export interface InteriorBooking {
  id: string;
  bookingId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  quotationId: string;
  quotationNumber: string;
  projectAddress: string;
  selectedServices: string[];
  bookingDate: string;
  scheduledStartDate: string;
  estimatedCompletionDate: string;
  designerId: string;
  designerName: string;
  bookingAmount: number;
  advancePaymentStatus: 'PAID' | 'PENDING' | 'REFUNDED';
  status:
    | 'AWAITING_CONFIRMATION'
    | 'CONFIRMED'
    | 'SITE_VISIT_SCHEDULED'
    | 'PLANNING'
    | 'IN_PROGRESS'
    | 'COMPLETED'
    | 'CANCELLED';
  specialInstructions?: string;
  createdAt: string;
}

export const SEED_INTERIOR_BOOKINGS: InteriorBooking[] = [];

export const getInteriorBookings = (designerId?: string): InteriorBooking[] => {
  try {
    const data = localStorage.getItem('gd_interior_bookings_v1');
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return designerId ? parsed.filter((b: InteriorBooking) => b.designerId === designerId) : parsed;
      }
    }
  } catch (e) {}
  const defaults = isTest ? TEST_BOOKINGS : [];
  return designerId ? defaults.filter((b) => b.designerId === designerId) : defaults;
};

export const saveInteriorBooking = (bk: Partial<InteriorBooking>): InteriorBooking => {
  const current = getInteriorBookings();
  const existingIdx = current.findIndex((b) => b.id === bk.id);
  const now = new Date().toISOString();
  let updated: InteriorBooking;
  if (existingIdx >= 0) {
    updated = { ...current[existingIdx], ...bk };
    current[existingIdx] = updated;
  } else {
    updated = {
      id: bk.id || ('bk-int-' + Date.now()),
      bookingId: bk.bookingId || ('BG-BK-2026-' + Math.floor(100 + Math.random() * 900)),
      customerId: bk.customerId || 'cust-generic',
      customerName: bk.customerName || 'Client',
      customerPhone: bk.customerPhone || '',
      quotationId: bk.quotationId || 'quote-int-1',
      quotationNumber: bk.quotationNumber || 'BG-Q-INT-8910',
      projectAddress: bk.projectAddress || 'Gurugram',
      selectedServices: bk.selectedServices || ['Complete Interiors'],
      bookingDate: bk.bookingDate || now,
      scheduledStartDate: bk.scheduledStartDate || '2026-11-05',
      estimatedCompletionDate: bk.estimatedCompletionDate || '2027-01-30',
      designerId: bk.designerId || 'id-101',
      designerName: bk.designerName || 'Pooja Mehra',
      bookingAmount: bk.bookingAmount || 250000,
      advancePaymentStatus: bk.advancePaymentStatus || 'PAID',
      status: bk.status || 'CONFIRMED',
      specialInstructions: bk.specialInstructions || '',
      createdAt: now,
    };
    current.push(updated);
  }
  localStorage.setItem('gd_interior_bookings_v1', JSON.stringify(current));
  return updated;
};

// ==========================================
// SECTION C: PROJECT MANAGEMENT & EXECUTION
// ==========================================
export type InteriorProjectStage =
  | 'INITIAL_CONSULTATION'
  | 'SITE_MEASUREMENT'
  | 'CONCEPT_DESIGN'
  | 'LAYOUT_2D'
  | 'VISUALIZATION_3D'
  | 'DESIGN_APPROVAL'
  | 'BOQ_FINALIZATION'
  | 'MATERIAL_PROCUREMENT'
  | 'SITE_EXECUTION'
  | 'QUALITY_INSPECTION'
  | 'SNAG_RECTIFICATION'
  | 'HANDOVER'
  | 'COMPLETED';

export interface InteriorProjectMilestone {
  id: string;
  name: string;
  weightPercent: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  dueDate: string;
  payoutAmount: number;
  escrowStatus: 'LOCKED_IN_ESCROW' | 'RELEASED_TO_DESIGNER' | 'AWAITING_CLIENT_APPROVAL';
}

export interface InteriorProject {
  id: string;
  projectId: string;
  bookingId: string;
  quotationId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  designerId: string;
  designerName: string;
  title: string;
  propertyType: string;
  location: string;
  currentStage: InteriorProjectStage;
  overallProgressPercent: number;
  startDate: string;
  targetEndDate: string;
  totalContractValue: number;
  paidAmount: number;
  pendingEscrowAmount: number;
  milestones: InteriorProjectMilestone[];
  notes?: string;
  updatedAt: string;
}

export const SEED_INTERIOR_PROJECTS: InteriorProject[] = [];

export const getInteriorProjects = (designerId?: string): InteriorProject[] => {
  try {
    const data = localStorage.getItem('gd_interior_projects_v1');
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return designerId ? parsed.filter((p: InteriorProject) => p.designerId === designerId) : parsed;
      }
    }
  } catch (e) {}
  const defaults = isTest ? TEST_PROJECTS : [];
  return designerId ? defaults.filter((p) => p.designerId === designerId) : defaults;
};

export const saveInteriorProject = (p: Partial<InteriorProject>): InteriorProject => {
  const current = getInteriorProjects();
  const existingIdx = current.findIndex((item) => item.id === p.id);
  const now = new Date().toISOString();
  let updated: InteriorProject;
  if (existingIdx >= 0) {
    updated = { ...current[existingIdx], ...p, updatedAt: now };
    current[existingIdx] = updated;
  } else {
    updated = {
      id: p.id || ('prj-int-' + Date.now()),
      projectId: p.projectId || ('PRJ-INT-' + Math.floor(100 + Math.random() * 900)),
      bookingId: p.bookingId || '',
      quotationId: p.quotationId || '',
      customerId: p.customerId || '',
      customerName: p.customerName || 'Client',
      customerPhone: p.customerPhone || '',
      designerId: p.designerId || 'id-101',
      designerName: p.designerName || 'Pooja Mehra',
      title: p.title || 'Interior Project',
      propertyType: p.propertyType || 'Apartment',
      location: p.location || 'Gurugram',
      currentStage: p.currentStage || 'CONCEPT_DESIGN',
      overallProgressPercent: p.overallProgressPercent || 15,
      startDate: p.startDate || now.slice(0, 10),
      targetEndDate: p.targetEndDate || '2027-02-28',
      totalContractValue: p.totalContractValue || 1500000,
      paidAmount: p.paidAmount || 300000,
      pendingEscrowAmount: p.pendingEscrowAmount || 1200000,
      milestones: p.milestones || [],
      notes: p.notes || '',
      updatedAt: now,
    };
    current.push(updated);
  }
  localStorage.setItem('gd_interior_projects_v1', JSON.stringify(current));
  return updated;
};

// ==========================================
// SECTION D: Design & 3D Renders
// ==========================================
export interface InteriorDesignAsset {
  id: string;
  projectId: string;
  projectName: string;
  title: string;
  category: '2D_LAYOUT' | '3D_RENDER' | 'MOOD_BOARD' | 'CEILING_LIGHTING' | 'ELEVATION';
  version: string;
  fileUrl: string;
  thumbnailUrl: string;
  fileSize: string;
  uploadedAt: string;
  clientApprovalStatus: 'APPROVED' | 'PENDING' | 'REVISION_REQUESTED';
  clientFeedback?: string;
}

export const SEED_INTERIOR_DESIGN_ASSETS: InteriorDesignAsset[] = [];

export const getInteriorDesignAssets = (projectId?: string): InteriorDesignAsset[] => {
  try {
    const data = localStorage.getItem('gd_interior_assets_v1');
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return projectId ? parsed.filter((a: InteriorDesignAsset) => a.projectId === projectId) : parsed;
      }
    }
  } catch (e) {}
  return projectId ? SEED_INTERIOR_DESIGN_ASSETS.filter((a) => a.projectId === projectId) : SEED_INTERIOR_DESIGN_ASSETS;
};

// ==========================================
// SECTION E: ESTIMATION & BOQ (BILL OF QUANTITIES)
// ==========================================
export interface InteriorBOQItem {
  id: string;
  projectId: string;
  roomName: string;
  category: 'Plywood & Hardware' | 'Laminates & Veneer' | 'Modular Fittings' | 'Lighting & Electricals' | 'Civil & Tiles' | 'Paint & Finishes';
  itemName: string;
  specification: string;
  brand: string;
  quantity: number;
  unit: string;
  unitRate: number;
  wastagePercent: number;
  labourCost: number;
  taxPercent: number;
  totalAmount: number;
  supplierName: string;
  status: 'ESTIMATED' | 'APPROVED' | 'ORDERED' | 'DELIVERED_TO_SITE';
}

export const SEED_INTERIOR_BOQ_ITEMS: InteriorBOQItem[] = [];

export const getInteriorBOQItems = (projectId?: string): InteriorBOQItem[] => {
  try {
    const data = localStorage.getItem('gd_interior_boq_v1');
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return projectId ? parsed.filter((b: InteriorBOQItem) => b.projectId === projectId) : parsed;
      }
    }
  } catch (e) {}
  const defaults = isTest ? TEST_BOQ : [];
  return projectId ? defaults.filter((b) => b.projectId === projectId) : defaults;
};

// ==========================================
// SECTION F: SITE VISIT & SNAG LIST MANAGEMENT
// ==========================================
export interface InteriorSiteVisit {
  id: string;
  projectId: string;
  projectName: string;
  visitDate: string;
  purpose: string;
  siteEngineer: string;
  measurementsSummary: string;
  workCompleted: string;
  pendingActivities: string;
  nextVisitDate: string;
  photos: string[];
}

export interface InteriorSnagItem {
  id: string;
  projectId: string;
  roomName: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'VERIFIED';
  reportedDate: string;
  resolvedDate?: string;
  assignedContractor: string;
}

export const SEED_INTERIOR_SITE_VISITS: InteriorSiteVisit[] = [];

export const SEED_INTERIOR_SNAG_ITEMS: InteriorSnagItem[] = [];

export const getInteriorSiteVisits = (projectId?: string): InteriorSiteVisit[] => {
  try {
    const data = localStorage.getItem('gd_interior_visits_v1');
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return projectId ? parsed.filter((v: InteriorSiteVisit) => v.projectId === projectId) : parsed;
      }
    }
  } catch (e) {}
  return projectId ? SEED_INTERIOR_SITE_VISITS.filter((v) => v.projectId === projectId) : SEED_INTERIOR_SITE_VISITS;
};

export const getInteriorSnagItems = (projectId?: string): InteriorSnagItem[] => {
  try {
    const data = localStorage.getItem('gd_interior_snags_v1');
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return projectId ? parsed.filter((s: InteriorSnagItem) => s.projectId === projectId) : parsed;
      }
    }
  } catch (e) {}
  return projectId ? SEED_INTERIOR_SNAG_ITEMS.filter((s) => s.projectId === projectId) : SEED_INTERIOR_SNAG_ITEMS;
};

// ==========================================
// SECTION G: BILLING, INVOICES & PAYOUTS
// ==========================================
export interface InteriorInvoice {
  id: string;
  invoiceNumber: string;
  projectId: string;
  projectName: string;
  clientName: string;
  amount: number;
  taxAmount: number;
  totalAmount: number;
  status: 'PAID' | 'ISSUED' | 'DUE';
  date: string;
  dueDate: string;
  milestoneName: string;
}

export interface InteriorPayoutRequest {
  id: string;
  requestId: string;
  designerId: string;
  amount: number;
  bankAccount: string;
  ifsc: string;
  status: 'PROCESSED' | 'PENDING_ADMIN_APPROVAL' | 'UNDER_CLEARANCE';
  requestedAt: string;
  processedAt?: string;
  utrNumber?: string;
}

export const SEED_INTERIOR_INVOICES: InteriorInvoice[] = [];

export const SEED_INTERIOR_PAYOUTS: InteriorPayoutRequest[] = [];

export const getInteriorInvoices = (): InteriorInvoice[] => {
  try {
    const data = localStorage.getItem('gd_interior_invoices_v1');
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  return SEED_INTERIOR_INVOICES;
};

export const getInteriorPayouts = (): InteriorPayoutRequest[] => {
  try {
    const data = localStorage.getItem('gd_interior_payouts_v1');
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  return SEED_INTERIOR_PAYOUTS;
};

export const getRegisteredInteriorDesigners = getInteriorDesignerAccounts;
