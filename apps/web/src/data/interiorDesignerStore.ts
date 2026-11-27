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

// ==========================================
// SECTION: INTERIOR DESIGNER ASSIGNMENTS (Section 7 Steps 1 & 2)
// ==========================================
export type InteriorAssignmentStatus =
  | 'NEW'
  | 'ASSIGNED'
  | 'ACCEPTED_BY_DESIGNER'
  | 'DECLINED_BY_DESIGNER'
  | 'CLARIFICATION_REQUESTED'
  | 'QUOTATION_DRAFTED'
  | 'QUOTATION_SUBMITTED'
  | 'CANCELLED';

export interface InteriorDesignerAssignment {
  id: string; // e.g. 'asgn-int-101'
  assignmentCode: string; // e.g. 'BG-ASN-INT-101'
  requestId: string;
  requestCode?: string;
  designerId: string;
  designerName: string;
  designerPhone?: string;
  customerName: string;
  customerPhone?: string;
  projectLocation: string;
  city: string;
  propertyType: string;
  carpetAreaSqFt: number;
  roomCount: string;
  requiredServices: string[];
  targetBudget: number;
  preferredTimeline: string;
  uploadedPhotos?: string[];
  referenceImages?: string[];
  additionalInstructions?: string;
  status: InteriorAssignmentStatus;
  declineReason?: string;
  clarificationNote?: string;
  clarificationReply?: string;
  adminNotes?: string;
  assignedAt: string;
  respondedAt?: string;
  quotationId?: string;
  deadlineDate: string;
}

export const INTERIOR_ASSIGNMENTS_STORAGE_KEY = 'gd_interior_assignments_v1';

export const TEST_ASSIGNMENTS: InteriorDesignerAssignment[] = [
  {
    id: 'asgn-int-101',
    assignmentCode: 'BG-ASN-INT-101',
    requestId: 'REQ-INT-101',
    requestCode: 'BG-REQ-901',
    designerId: 'id-101',
    designerName: 'Ar. Pooja Mehra',
    customerName: 'Aman Saxena',
    customerPhone: '9811223344',
    projectLocation: 'DLF The Crest, Sector 54, Gurugram',
    city: 'Gurugram',
    propertyType: '4BHK Luxury Apartment',
    carpetAreaSqFt: 2800,
    roomCount: '4 BHK + Servant Room',
    requiredServices: [
      'Residential Interior Design',
      'Living Room Design',
      'Modular Kitchen Design',
      'False Ceiling Design',
      'Lighting Design',
      'Wardrobe Design',
    ],
    targetBudget: 3500000,
    preferredTimeline: '10-12 Weeks',
    uploadedPhotos: [
      'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80',
    ],
    referenceImages: [
      'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80',
    ],
    additionalInstructions: 'Client insists on bookmatched Italian Statuario marble in living room and German Blum fittings in kitchen.',
    status: 'ACCEPTED_BY_DESIGNER',
    quotationId: 'quote-int-1',
    assignedAt: '2026-10-10T10:00:00Z',
    respondedAt: '2026-10-11T12:00:00Z',
    deadlineDate: '2026-10-25',
  },
  {
    id: 'asgn-int-102',
    assignmentCode: 'BG-ASN-INT-102',
    requestId: 'REQ-INT-102',
    requestCode: 'BG-REQ-902',
    designerId: 'id-101',
    designerName: 'Ar. Pooja Mehra',
    customerName: 'Meera Chawla',
    customerPhone: '9822334455',
    projectLocation: 'Jaypee Greens, Greater Noida',
    city: 'Greater Noida',
    propertyType: '3BHK Penthouse',
    carpetAreaSqFt: 2200,
    roomCount: '3 BHK',
    requiredServices: [
      'Residential Interior Design',
      'Modular Kitchen Design',
      'Bedroom Design',
      '3D Interior Design',
    ],
    targetBudget: 2500000,
    preferredTimeline: '6-8 Weeks',
    uploadedPhotos: [
      'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=800&q=80',
    ],
    referenceImages: [
      'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=800&q=80',
    ],
    additionalInstructions: 'Minimalist Scandinavian aesthetic with light oak woodwork and cove lighting.',
    status: 'QUOTATION_SUBMITTED',
    quotationId: 'quote-int-2',
    assignedAt: '2026-10-18T10:00:00Z',
    respondedAt: '2026-10-19T11:00:00Z',
    deadlineDate: '2026-11-02',
  },
  {
    id: 'asgn-int-103',
    assignmentCode: 'BG-ASN-INT-103',
    requestId: 'REQ-INT-103',
    requestCode: 'BG-REQ-905',
    designerId: 'id-101',
    designerName: 'Ar. Pooja Mehra',
    customerName: 'Vikramaditya Oberoi',
    customerPhone: '9844001122',
    projectLocation: 'Sushant Lok 1, Block C, Gurugram',
    city: 'Gurugram',
    propertyType: '4BHK Duplex Villa',
    carpetAreaSqFt: 3400,
    roomCount: '4 BHK Duplex + Private Lounge',
    requiredServices: [
      'Residential Interior Design',
      'Living Room Design',
      'Modular Kitchen Design',
      'False Ceiling Design',
      'Lighting Design',
      'Dining Room Design',
      'Interior Execution and Implementation',
    ],
    targetBudget: 4500000,
    preferredTimeline: '12-14 Weeks',
    uploadedPhotos: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
    ],
    additionalInstructions: 'Modern Art Deco theme. Looking for full turnkey delivery including MEP coordination.',
    status: 'NEW',
    assignedAt: '2026-11-20T09:30:00Z',
    deadlineDate: '2026-12-05',
  },
  {
    id: 'asgn-int-104',
    assignmentCode: 'BG-ASN-INT-104',
    requestId: 'REQ-INT-104',
    requestCode: 'BG-REQ-908',
    designerId: 'id-101',
    designerName: 'Ar. Pooja Mehra',
    customerName: 'Sunita & Rajiv Singhal',
    customerPhone: '9899331122',
    projectLocation: 'Golf Course Extension Road, Sector 65, Gurugram',
    city: 'Gurugram',
    propertyType: '3BHK Luxury Apartment',
    carpetAreaSqFt: 1950,
    roomCount: '3 BHK',
    requiredServices: [
      'Modular Kitchen Design',
      'Wardrobe Design',
      'False Ceiling Design',
      'Material Selection and Consultation',
    ],
    targetBudget: 2200000,
    preferredTimeline: '8 Weeks',
    uploadedPhotos: [],
    additionalInstructions: 'Warm Japandi aesthetics. Focus on space saving modular solutions and concealed pantry.',
    status: 'ACCEPTED_BY_DESIGNER',
    assignedAt: '2026-11-22T14:00:00Z',
    respondedAt: '2026-11-23T10:00:00Z',
    deadlineDate: '2026-12-07',
  },
  {
    id: 'asgn-int-105',
    assignmentCode: 'BG-ASN-INT-105',
    requestId: 'REQ-INT-105',
    requestCode: 'BG-REQ-910',
    designerId: 'id-101',
    designerName: 'Ar. Pooja Mehra',
    customerName: 'Kunal Malhotra',
    customerPhone: '9877443322',
    projectLocation: 'Sector 128, Expressway Noida',
    city: 'Noida',
    propertyType: '4BHK Penthouse',
    carpetAreaSqFt: 3100,
    roomCount: '4 BHK Penthouse',
    requiredServices: [
      'Residential Interior Design',
      '2D Interior Design',
      '3D Interior Design',
      'Site Supervision',
    ],
    targetBudget: 3800000,
    preferredTimeline: '10 Weeks',
    uploadedPhotos: [],
    additionalInstructions: 'Double-height ceiling in drawing room requires structural check before ceiling installation.',
    status: 'CLARIFICATION_REQUESTED',
    clarificationNote: 'Please provide structural column clearance and ceiling slab load-bearing CAD drawings from builder.',
    assignedAt: '2026-11-15T11:00:00Z',
    respondedAt: '2026-11-16T15:00:00Z',
    deadlineDate: '2026-11-30',
  },
];

export const getInteriorAssignments = (designerId?: string): InteriorDesignerAssignment[] => {
  try {
    const data = localStorage.getItem(INTERIOR_ASSIGNMENTS_STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return designerId ? parsed.filter((a: InteriorDesignerAssignment) => a.designerId === designerId) : parsed;
      }
    }
  } catch (e) {}
  return designerId ? TEST_ASSIGNMENTS.filter((a) => a.designerId === designerId) : TEST_ASSIGNMENTS;
};

export const getInteriorAssignmentById = (id: string): InteriorDesignerAssignment | null => {
  const all = getInteriorAssignments();
  return all.find((a) => a.id === id || a.assignmentCode === id || a.requestId === id) || null;
};

export const saveInteriorAssignment = (a: Partial<InteriorDesignerAssignment>): InteriorDesignerAssignment => {
  const current = getInteriorAssignments();
  const existingIdx = current.findIndex((item) => item.id === a.id || (a.assignmentCode && item.assignmentCode === a.assignmentCode));
  const now = new Date().toISOString();

  let updated: InteriorDesignerAssignment;
  if (existingIdx >= 0) {
    updated = {
      ...current[existingIdx],
      ...a,
    } as InteriorDesignerAssignment;
    current[existingIdx] = updated;
  } else {
    updated = {
      id: a.id || `asgn-int-${Date.now()}`,
      assignmentCode: a.assignmentCode || `BG-ASN-INT-${Math.floor(100 + Math.random() * 900)}`,
      requestId: a.requestId || `REQ-INT-${Date.now()}`,
      requestCode: a.requestCode || `BG-REQ-${Math.floor(100 + Math.random() * 900)}`,
      designerId: a.designerId || 'id-101',
      designerName: a.designerName || 'Ar. Pooja Mehra',
      designerPhone: a.designerPhone || '9899112233',
      customerName: a.customerName || 'Valued Homeowner',
      customerPhone: a.customerPhone || '',
      projectLocation: a.projectLocation || 'Gurugram',
      city: a.city || 'Gurugram',
      propertyType: a.propertyType || '3BHK Apartment',
      carpetAreaSqFt: a.carpetAreaSqFt || 2000,
      roomCount: a.roomCount || '3 BHK',
      requiredServices: a.requiredServices || ['Residential Interior Design'],
      targetBudget: a.targetBudget || 2500000,
      preferredTimeline: a.preferredTimeline || '8-10 Weeks',
      uploadedPhotos: a.uploadedPhotos || [],
      referenceImages: a.referenceImages || [],
      additionalInstructions: a.additionalInstructions || '',
      status: a.status || 'NEW',
      assignedAt: a.assignedAt || now,
      deadlineDate: a.deadlineDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    };
    current.push(updated);
  }

  try {
    localStorage.setItem(INTERIOR_ASSIGNMENTS_STORAGE_KEY, JSON.stringify(current));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new Event('interior_assignments_updated'));
    }
  } catch (e) {}

  return updated;
};

export const acceptInteriorAssignment = (assignmentId: string, designerId = 'id-101'): InteriorDesignerAssignment => {
  const current = getInteriorAssignments();
  const target = current.find((a) => a.id === assignmentId || a.assignmentCode === assignmentId);
  if (!target) throw new Error('Assignment not found');

  target.status = 'ACCEPTED_BY_DESIGNER';
  target.respondedAt = new Date().toISOString();
  saveInteriorAssignment(target);
  return target;
};

export const declineInteriorAssignment = (
  assignmentId: string,
  reason: string,
  designerId = 'id-101'
): InteriorDesignerAssignment => {
  const current = getInteriorAssignments();
  const target = current.find((a) => a.id === assignmentId || a.assignmentCode === assignmentId);
  if (!target) throw new Error('Assignment not found');

  target.status = 'DECLINED_BY_DESIGNER';
  target.declineReason = reason;
  target.respondedAt = new Date().toISOString();
  saveInteriorAssignment(target);
  return target;
};

export const requestAssignmentClarification = (
  assignmentId: string,
  note: string,
  designerId = 'id-101'
): InteriorDesignerAssignment => {
  const current = getInteriorAssignments();
  const target = current.find((a) => a.id === assignmentId || a.assignmentCode === assignmentId);
  if (!target) throw new Error('Assignment not found');

  target.status = 'CLARIFICATION_REQUESTED';
  target.clarificationNote = note;
  target.respondedAt = new Date().toISOString();
  saveInteriorAssignment(target);
  return target;
};

export const adminAssignRequestToDesigner = (params: {
  requestId: string;
  requestCode?: string;
  designerId: string;
  designerName: string;
  customerName: string;
  customerPhone?: string;
  projectLocation: string;
  city: string;
  propertyType: string;
  carpetAreaSqFt: number;
  roomCount: string;
  requiredServices: string[];
  targetBudget: number;
  preferredTimeline: string;
  adminNotes?: string;
  deadlineDays?: number;
}): InteriorDesignerAssignment => {
  const deadlineDays = params.deadlineDays || 14;
  const deadlineDate = new Date(Date.now() + deadlineDays * 86400000).toISOString().split('T')[0];

  const assignment = saveInteriorAssignment({
    requestId: params.requestId,
    requestCode: params.requestCode,
    designerId: params.designerId,
    designerName: params.designerName,
    customerName: params.customerName,
    customerPhone: params.customerPhone,
    projectLocation: params.projectLocation,
    city: params.city,
    propertyType: params.propertyType,
    carpetAreaSqFt: params.carpetAreaSqFt,
    roomCount: params.roomCount,
    requiredServices: params.requiredServices,
    targetBudget: params.targetBudget,
    preferredTimeline: params.preferredTimeline,
    adminNotes: params.adminNotes,
    status: 'NEW',
    deadlineDate,
  });

  return assignment;
};

// ==========================================
// SECTION: INTERIOR QUOTATIONS & VERSION CONTROL (Section 7 Steps 3, 4 & 5)
// ==========================================
export interface InteriorQuotationItem {
  id: string;
  roomName: string; // e.g. 'Living Room', 'Modular Kitchen', 'Master Bedroom'
  serviceCategory: string; // from MASTER_INTERIOR_SERVICES
  description: string;
  quantity: number;
  unit: string; // 'sq.ft', 'rft', 'Set', 'Job', 'Nos', 'L.S.'
  rate: number;
  taxPercent: number; // default 18
  amount: number;
}

export interface InteriorQuotationDeliverableFees {
  fee2DDesign: number; // 2D Floor Plans & Electrical Working Drawings
  fee3DDesign: number; // 3D Perspectives & High-Res Photorealistic Renders
  feeConsultation: number; // Concept Consultation & Theme Selection
  feeSiteVisit: number; // Site Dimension Verification & Feasibility
  feeDesignDevelopment: number; // Material Swatches & Specification Sheets
  feeExecutionSupervision: number; // On-Site Implementation Supervision
  feeOtherProfessional: number; // Administrative & Handover Documentation
}

export interface QuotationPaymentMilestone {
  id: string;
  stageName: string;
  percentage: number;
  amount: number;
  deliverableDescription: string;
}

export interface InteriorQuotationVersion {
  versionNumber: string; // '1.0', '2.0', etc.
  createdAt: string;
  submittedAt?: string;
  grandTotal: number;
  subtotal: number;
  totalProfessionalFees: number;
  taxAmount: number;
  status: string;
  adminFeedback?: string;
  lineItemsCount: number;
  summaryNotes?: string;
}

export interface InteriorQuotation {
  id: string;
  quotationNumber: string; // BG-Q-INT-XXXX
  version: string; // '1.0', '2.0', etc.
  versionHistory?: InteriorQuotationVersion[];
  assignmentId?: string;
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
  scopeSummary?: string;
  targetBudget: number;
  status:
    | 'DRAFT'
    | 'SUBMITTED'
    | 'UNDER_ADMIN_REVIEW'
    | 'APPROVED_BY_ADMIN'
    | 'REVISION_REQUESTED'
    | 'SENT_TO_CUSTOMER'
    | 'ACCEPTED'
    | 'REJECTED'
    | 'EXPIRED';
  lineItems: InteriorQuotationItem[];
  deliverableFees?: InteriorQuotationDeliverableFees;
  subtotal: number;
  totalProfessionalFees?: number;
  discount: number;
  taxAmount: number; // 18% GST
  grandTotal: number;
  estimatedTimelineWeeks: number;
  revisionRoundsIncluded: number;
  validityDays?: number; // default 30
  paymentSchedule?: QuotationPaymentMilestone[];
  terms: string;
  attachments?: string[];
  adminFeedback?: string;
  adminInternalNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export const DEFAULT_PAYMENT_SCHEDULE: QuotationPaymentMilestone[] = [
  {
    id: 'ms-1',
    stageName: 'Stage 1: Advance Booking & 2D Layout Approval',
    percentage: 25,
    amount: 0,
    deliverableDescription: 'Initial conceptual layout, 2D floor plans, moodboards, and material swatches sign-off.',
  },
  {
    id: 'ms-2',
    stageName: 'Stage 2: Woodwork Carcass & Frame Approval',
    percentage: 35,
    amount: 0,
    deliverableDescription: 'Modular carcass manufacturing, electrical roughing-in, and false ceiling framing completed.',
  },
  {
    id: 'ms-3',
    stageName: 'Stage 3: Veneer/Laminate Pressing & False Ceiling',
    percentage: 25,
    amount: 0,
    deliverableDescription: 'Shutters installed, quartz countertop fitted, surface paint primer, and lighting installations.',
  },
  {
    id: 'ms-4',
    stageName: 'Stage 4: Snag Clearance & Final Handover',
    percentage: 15,
    amount: 0,
    deliverableDescription: 'Deep cleaning, soft furnishings alignment, snag rectification, and formal handover certificate.',
  },
];

const TEST_QUOTATIONS: InteriorQuotation[] = [
  {
    id: 'quote-int-1',
    quotationNumber: 'BG-Q-INT-101',
    version: '1.0',
    assignmentId: 'asgn-int-101',
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
      { id: 'li-1', roomName: 'Living Room', serviceCategory: 'Residential Interior Design', description: 'Italian Statuario Marble Honing & Fluted Wall Paneling', unit: 'sq.ft', quantity: 650, rate: 350, taxPercent: 18, amount: 227500 },
      { id: 'li-2', roomName: 'Modular Kitchen', serviceCategory: 'Modular Kitchen Design', description: 'Acrylic Finish Cabinets with Blum Soft-Close Tandem Hardware', unit: 'rft', quantity: 38, rate: 4500, taxPercent: 18, amount: 171000 },
      { id: 'li-3', roomName: 'Master Bedroom', serviceCategory: 'Wardrobe Design', description: 'Floor to ceiling tinted lacquered glass sliding wardrobes', unit: 'Set', quantity: 1, rate: 220000, taxPercent: 18, amount: 220000 },
    ],
    deliverableFees: {
      fee2DDesign: 35000,
      fee3DDesign: 50000,
      feeConsultation: 25000,
      feeSiteVisit: 10000,
      feeDesignDevelopment: 20000,
      feeExecutionSupervision: 40000,
      feeOtherProfessional: 10000,
    },
    subtotal: 618500,
    totalProfessionalFees: 190000,
    discount: 25000,
    taxAmount: 140940, // 18% of (618500 + 190000 - 25000)
    grandTotal: 924440,
    estimatedTimelineWeeks: 10,
    revisionRoundsIncluded: 3,
    validityDays: 30,
    paymentSchedule: [
      { id: 'ms-1', stageName: 'Stage 1: Advance Booking & 2D Layout Approval', percentage: 25, amount: 231110, deliverableDescription: 'Concept and 2D sign-off.' },
      { id: 'ms-2', stageName: 'Stage 2: Woodwork Carcass & Frame Approval', percentage: 35, amount: 323554, deliverableDescription: 'Carpentry and framing.' },
      { id: 'ms-3', stageName: 'Stage 3: Veneer/Laminate Pressing & False Ceiling', percentage: 25, amount: 231110, deliverableDescription: 'Finishes and lighting.' },
      { id: 'ms-4', stageName: 'Stage 4: Snag Clearance & Final Handover', percentage: 15, amount: 138666, deliverableDescription: 'Deep cleaning and handover.' },
    ],
    terms: '100% Escrow Milestone Payouts. All revisions beyond 3 rounds chargeable at INR 5,000 per room render.',
    createdAt: '2026-10-15T10:00:00Z',
    updatedAt: '2026-10-18T12:00:00Z',
  },
  {
    id: 'quote-int-2',
    quotationNumber: 'BG-Q-INT-102',
    version: '1.0',
    assignmentId: 'asgn-int-102',
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
    scopeSummary: 'Scandinavian oak woodwork, warm acoustic cove lighting, and bespoke pantry unit.',
    status: 'SENT_TO_CUSTOMER',
    lineItems: [
      { id: 'li-4', roomName: 'Master Bedroom', serviceCategory: 'Bedroom Design', description: 'Fluted Panel Headboard & Built-in Walk-in Wardrobe', unit: 'sq.ft', quantity: 220, rate: 650, taxPercent: 18, amount: 143000 },
      { id: 'li-5', roomName: 'Living Room', serviceCategory: 'False Ceiling Design', description: 'Recessed perimeter Gyproc ceiling with magnetic 3000K tracks', unit: 'sq.ft', quantity: 450, rate: 190, taxPercent: 18, amount: 85500 },
    ],
    deliverableFees: {
      fee2DDesign: 25000,
      fee3DDesign: 35000,
      feeConsultation: 15000,
      feeSiteVisit: 8000,
      feeDesignDevelopment: 12000,
      feeExecutionSupervision: 25000,
      feeOtherProfessional: 5000,
    },
    subtotal: 228500,
    totalProfessionalFees: 125000,
    discount: 10000,
    taxAmount: 61830,
    grandTotal: 405330,
    estimatedTimelineWeeks: 6,
    revisionRoundsIncluded: 2,
    validityDays: 30,
    terms: 'BuildGhar verified escrow protection with stage-wise releases.',
    createdAt: '2026-10-20T11:00:00Z',
    updatedAt: '2026-10-21T09:00:00Z',
  },
  {
    id: 'quote-int-3',
    quotationNumber: 'BG-Q-INT-103',
    version: '1.0',
    assignmentId: 'asgn-int-104',
    requestId: 'REQ-INT-104',
    designerId: 'id-101',
    designerName: 'Ar. Pooja Mehra',
    customerName: 'Sunita & Rajiv Singhal',
    customerPhone: '9899331122',
    projectAddress: 'Golf Course Extension Road, Sector 65, Gurugram',
    propertyType: '3BHK Luxury Apartment',
    carpetAreaSqFt: 1950,
    roomCount: '3 BHK',
    preferredStyle: 'Warm Japandi',
    scopeSummary: 'Modular kitchen in marine ply with PU finish shutters and concealed sliding pantry.',
    status: 'UNDER_ADMIN_REVIEW',
    lineItems: [
      { id: 'li-6', roomName: 'Modular Kitchen', serviceCategory: 'Modular Kitchen Design', description: 'Marine Ply IS:710 Carcass, Blum Tandembox drawers, Quartz counter', unit: 'Set', quantity: 1, rate: 480000, taxPercent: 18, amount: 480000 },
      { id: 'li-7', roomName: 'Living & Dining', serviceCategory: 'Furniture Layout', description: 'Oak wood fluted wall panelling and dining console buffet', unit: 'sq.ft', quantity: 320, rate: 450, taxPercent: 18, amount: 144000 },
    ],
    deliverableFees: {
      fee2DDesign: 20000,
      fee3DDesign: 30000,
      feeConsultation: 15000,
      feeSiteVisit: 5000,
      feeDesignDevelopment: 10000,
      feeExecutionSupervision: 20000,
      feeOtherProfessional: 0,
    },
    subtotal: 624000,
    totalProfessionalFees: 100000,
    discount: 15000,
    taxAmount: 127620,
    grandTotal: 836620,
    estimatedTimelineWeeks: 8,
    revisionRoundsIncluded: 3,
    validityDays: 30,
    terms: 'Escrow backed milestone payments on progressive completion.',
    createdAt: '2026-11-24T10:00:00Z',
    updatedAt: '2026-11-24T10:00:00Z',
  },
  {
    id: 'quote-int-4',
    quotationNumber: 'BG-Q-INT-104',
    version: '1.0',
    versionHistory: [
      {
        versionNumber: '1.0',
        createdAt: '2026-11-18T10:00:00Z',
        submittedAt: '2026-11-18T11:00:00Z',
        grandTotal: 1250000,
        subtotal: 950000,
        totalProfessionalFees: 150000,
        taxAmount: 198000,
        status: 'REVISION_REQUESTED',
        adminFeedback: 'Please bifurcate false ceiling track lighting installation charges and add 3D walkthrough video fee in deliverables.',
        lineItemsCount: 4,
        summaryNotes: 'First draft submitted.',
      },
    ],
    assignmentId: 'asgn-int-105',
    requestId: 'REQ-INT-105',
    designerId: 'id-101',
    designerName: 'Ar. Pooja Mehra',
    customerName: 'Kunal Malhotra',
    customerPhone: '9877443322',
    projectAddress: 'Sector 128, Expressway Noida',
    propertyType: '4BHK Penthouse',
    carpetAreaSqFt: 3100,
    roomCount: '4 BHK Penthouse',
    preferredStyle: 'Neo-Classical Luxury',
    scopeSummary: 'Double-height drawing room paneling with motorized drapery and chandelier reinforcement.',
    status: 'REVISION_REQUESTED',
    adminFeedback: 'Please bifurcate false ceiling track lighting installation charges and add 3D walkthrough video fee in deliverables.',
    lineItems: [
      { id: 'li-8', roomName: 'Double Height Living', serviceCategory: 'Residential Interior Design', description: 'DuPont Corian & Charcoal Louver Wall Cladding', unit: 'sq.ft', quantity: 550, rate: 850, taxPercent: 18, amount: 467500 },
      { id: 'li-9', roomName: 'Master Suite', serviceCategory: 'Bedroom Design', description: 'Acoustic Suede Padded Headboard & Walk-in Wardrobe', unit: 'Job', quantity: 1, rate: 320000, taxPercent: 18, amount: 320000 },
    ],
    deliverableFees: {
      fee2DDesign: 30000,
      fee3DDesign: 45000,
      feeConsultation: 20000,
      feeSiteVisit: 10000,
      feeDesignDevelopment: 15000,
      feeExecutionSupervision: 30000,
      feeOtherProfessional: 10000,
    },
    subtotal: 787500,
    totalProfessionalFees: 160000,
    discount: 20000,
    taxAmount: 167850,
    grandTotal: 1095350,
    estimatedTimelineWeeks: 10,
    revisionRoundsIncluded: 3,
    validityDays: 30,
    terms: 'Escrow release per milestone verified by BuildGhar site engineer.',
    createdAt: '2026-11-18T10:00:00Z',
    updatedAt: '2026-11-20T14:00:00Z',
  },
  {
    id: 'quote-int-5',
    quotationNumber: 'BG-Q-INT-105',
    version: '1.0',
    assignmentId: 'asgn-int-103',
    requestId: 'REQ-INT-103',
    designerId: 'id-101',
    designerName: 'Ar. Pooja Mehra',
    customerName: 'Vikramaditya Oberoi',
    customerPhone: '9844001122',
    projectAddress: 'Sushant Lok 1, Block C, Gurugram',
    propertyType: '4BHK Duplex Villa',
    carpetAreaSqFt: 3400,
    roomCount: '4 BHK Duplex + Private Lounge',
    preferredStyle: 'Modern Art Deco',
    scopeSummary: 'Initial draft for duplex villa interior execution.',
    status: 'DRAFT',
    lineItems: [
      { id: 'li-10', roomName: 'Foyer & Entrance', serviceCategory: 'False Ceiling Design', description: 'Brass inlay CNC wooden ceiling with indirect warm LEDs', unit: 'sq.ft', quantity: 180, rate: 380, taxPercent: 18, amount: 68400 },
    ],
    deliverableFees: {
      fee2DDesign: 35000,
      fee3DDesign: 50000,
      feeConsultation: 25000,
      feeSiteVisit: 10000,
      feeDesignDevelopment: 20000,
      feeExecutionSupervision: 45000,
      feeOtherProfessional: 15000,
    },
    subtotal: 68400,
    totalProfessionalFees: 200000,
    discount: 0,
    taxAmount: 48312,
    grandTotal: 316712,
    estimatedTimelineWeeks: 12,
    revisionRoundsIncluded: 3,
    validityDays: 30,
    terms: 'Draft terms under review.',
    createdAt: '2026-11-25T11:00:00Z',
    updatedAt: '2026-11-25T11:00:00Z',
  },
];

export const SEED_INTERIOR_QUOTATIONS: InteriorQuotation[] = TEST_QUOTATIONS;

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
  return designerId ? TEST_QUOTATIONS.filter((q) => q.designerId === designerId) : TEST_QUOTATIONS;
};

export const getInteriorQuotationById = (id: string): InteriorQuotation | null => {
  const all = getInteriorQuotations();
  return all.find((q) => q.id === id || q.quotationNumber === id) || null;
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
    const subtotal = q.subtotal || (q.lineItems ? q.lineItems.reduce((acc, curr) => acc + curr.amount, 0) : 0);
    const deliverableFees = q.deliverableFees || {
      fee2DDesign: 25000,
      fee3DDesign: 35000,
      feeConsultation: 15000,
      feeSiteVisit: 5000,
      feeDesignDevelopment: 10000,
      feeExecutionSupervision: 25000,
      feeOtherProfessional: 5000,
    };
    const totalProfessionalFees =
      q.totalProfessionalFees ??
      Object.values(deliverableFees).reduce((acc: number, val: number) => acc + (Number(val) || 0), 0);
    const discount = q.discount || 0;
    const taxableBase = Math.max(0, subtotal + totalProfessionalFees - discount);
    const taxAmount = q.taxAmount ?? Math.round(taxableBase * 0.18);
    const grandTotal = q.grandTotal ?? Math.round(taxableBase + taxAmount);

    updated = {
      id: q.id || `quote-int-${Date.now()}`,
      quotationNumber: q.quotationNumber || `BG-Q-INT-${Math.floor(1000 + Math.random() * 9000)}`,
      version: q.version || '1.0',
      versionHistory: q.versionHistory || [],
      assignmentId: q.assignmentId,
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
      scopeSummary: q.scopeSummary || '',
      targetBudget: q.targetBudget || 2500000,
      status: q.status || 'DRAFT',
      lineItems: q.lineItems || [],
      deliverableFees,
      subtotal,
      totalProfessionalFees,
      discount,
      taxAmount,
      grandTotal,
      estimatedTimelineWeeks: q.estimatedTimelineWeeks || 8,
      revisionRoundsIncluded: q.revisionRoundsIncluded || 3,
      validityDays: q.validityDays || 30,
      paymentSchedule: q.paymentSchedule || DEFAULT_PAYMENT_SCHEDULE.map((p) => ({
        ...p,
        amount: Math.round((grandTotal * p.percentage) / 100),
      })),
      terms: q.terms || '100% Escrow Milestone Payouts on client stage approval.',
      attachments: q.attachments || [],
      adminFeedback: q.adminFeedback,
      adminInternalNotes: q.adminInternalNotes,
      createdAt: now,
      updatedAt: now,
    };
    current.push(updated);
  }

  try {
    localStorage.setItem('gd_interior_quotations_v1', JSON.stringify(current));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new Event('interior_quotations_updated'));
    }
    pushToCloud().catch(() => {});
  } catch (e) {}

  return updated;
};

export const submitInteriorQuotationToAdmin = (quotationId: string, notes?: string): InteriorQuotation => {
  const current = getInteriorQuotations();
  const quote = current.find((q) => q.id === quotationId || q.quotationNumber === quotationId);
  if (!quote) throw new Error('Quotation not found');

  quote.status = 'UNDER_ADMIN_REVIEW';
  quote.updatedAt = new Date().toISOString();
  if (notes) {
    quote.scopeSummary = quote.scopeSummary ? `${quote.scopeSummary} | Note: ${notes}` : notes;
  }

  saveInteriorQuotation(quote);

  // Also update associated assignment status if linked
  if (quote.assignmentId) {
    const assignment = getInteriorAssignmentById(quote.assignmentId);
    if (assignment) {
      assignment.status = 'QUOTATION_SUBMITTED';
      assignment.quotationId = quote.id;
      saveInteriorAssignment(assignment);
    }
  }

  return quote;
};

export const createInteriorQuotationRevision = (quotationId: string): InteriorQuotation => {
  const current = getInteriorQuotations();
  const quote = current.find((q) => q.id === quotationId || q.quotationNumber === quotationId);
  if (!quote) throw new Error('Quotation not found');

  const prevVersion = quote.version || '1.0';
  const nextMajor = Math.floor(parseFloat(prevVersion) || 1) + 1;
  const newVersion = `${nextMajor}.0`;

  // Push previous version snapshot into history
  const historySnapshot: InteriorQuotationVersion = {
    versionNumber: prevVersion,
    createdAt: quote.createdAt,
    submittedAt: quote.updatedAt,
    grandTotal: quote.grandTotal,
    subtotal: quote.subtotal,
    totalProfessionalFees: quote.totalProfessionalFees || 0,
    taxAmount: quote.taxAmount,
    status: quote.status,
    adminFeedback: quote.adminFeedback,
    lineItemsCount: quote.lineItems.length,
    summaryNotes: `Snapshot preserved before revision to ${newVersion}`,
  };

  quote.versionHistory = [...(quote.versionHistory || []), historySnapshot];
  quote.version = newVersion;
  quote.status = 'DRAFT'; // Designer can now edit and re-submit
  quote.updatedAt = new Date().toISOString();

  saveInteriorQuotation(quote);
  return quote;
};

export const adminReviewInteriorQuotation = (
  quotationId: string,
  action: 'APPROVE' | 'REJECT' | 'REQUEST_REVISION',
  feedback?: string,
  internalNotes?: string
): InteriorQuotation => {
  const current = getInteriorQuotations();
  const quote = current.find((q) => q.id === quotationId || q.quotationNumber === quotationId);
  if (!quote) throw new Error('Quotation not found');

  if (action === 'APPROVE') {
    quote.status = 'APPROVED_BY_ADMIN';
  } else if (action === 'REJECT') {
    quote.status = 'REJECTED';
  } else if (action === 'REQUEST_REVISION') {
    quote.status = 'REVISION_REQUESTED';
  }

  if (feedback) quote.adminFeedback = feedback;
  if (internalNotes) quote.adminInternalNotes = internalNotes;
  quote.updatedAt = new Date().toISOString();

  saveInteriorQuotation(quote);
  return quote;
};

export const adminForwardInteriorQuotationToCustomer = (quotationId: string): InteriorQuotation => {
  const current = getInteriorQuotations();
  const quote = current.find((q) => q.id === quotationId || q.quotationNumber === quotationId);
  if (!quote) throw new Error('Quotation not found');

  quote.status = 'SENT_TO_CUSTOMER';
  quote.updatedAt = new Date().toISOString();

  saveInteriorQuotation(quote);
  return quote;
};

export const customerAcceptInteriorQuotation = (quotationId: string): InteriorQuotation => {
  const current = getInteriorQuotations();
  const quote = current.find((q) => q.id === quotationId || q.quotationNumber === quotationId);
  if (!quote) throw new Error('Quotation not found');

  quote.status = 'ACCEPTED';
  quote.updatedAt = new Date().toISOString();

  saveInteriorQuotation(quote);
  return quote;
};

export const customerRejectInteriorQuotation = (quotationId: string, reason?: string): InteriorQuotation => {
  const current = getInteriorQuotations();
  const quote = current.find((q) => q.id === quotationId || q.quotationNumber === quotationId);
  if (!quote) throw new Error('Quotation not found');

  quote.status = 'REJECTED';
  if (reason) quote.adminFeedback = `Customer declined: ${reason}`;
  quote.updatedAt = new Date().toISOString();

  saveInteriorQuotation(quote);
  return quote;
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

export const TEST_BOOKINGS: InteriorBooking[] = [
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
    createdAt: '2026-10-19T10:00:00Z',
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
    createdAt: '2026-10-22T10:00:00Z',
  },
];

export const SEED_INTERIOR_BOOKINGS: InteriorBooking[] = TEST_BOOKINGS;

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
// SECTION C: PROJECT MANAGEMENT & EXECUTION (Section 8)
// ==========================================
export type InteriorProjectStatus =
  | 'ASSIGNED'
  | 'PENDING_KICKOFF'
  | 'ACTIVE'
  | 'DESIGN_IN_PROGRESS'
  | 'SUBMITTED_FOR_ADMIN_REVIEW'
  | 'CUSTOMER_REVIEW_PENDING'
  | 'REVISION_REQUIRED'
  | 'APPROVED'
  | 'EXECUTION_IN_PROGRESS'
  | 'ON_HOLD'
  | 'DELAYED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'DISPUTED';

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

// Section 9A: Approved Customer Design Brief
export interface InteriorDesignBriefRoom {
  roomName: string;
  dimensions: string; // e.g. "22 ft x 18 ft"
  style: string;
  colorScheme: string;
  requirements: string;
}

export interface InteriorDesignBrief {
  id: string;
  projectId: string;
  customerRequirements: string;
  roomBreakdown: InteriorDesignBriefRoom[];
  designStyle: string; // e.g. 'Contemporary Luxury', 'Minimalist Scandinavian'
  colorPreferences: string[];
  materialPreferences: string[];
  furnitureRequirements: string[];
  lightingRequirements: string[];
  targetBudget: number;
  specialInstructions: string;
  referenceImages: string[];
  adminApprovalStatus: 'APPROVED_BY_ADMIN' | 'PENDING_ADMIN_REVIEW';
  approvedAt: string;
}

export interface InteriorProject {
  id: string;
  projectId: string; // Shared format: BG-2026-0002
  bookingId?: string;
  quotationId?: string;
  quotationNumber?: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  designerId: string;
  designerName: string;
  title: string;
  projectAddress: string;
  location: string;
  propertyType: string;
  carpetAreaSqFt: number;
  approvedScope: string[];
  status: InteriorProjectStatus;
  currentStage: InteriorProjectStage;
  overallProgressPercent: number;
  startDate: string;
  targetEndDate: string;
  projectBudget: number;
  totalContractValue: number;
  paidAmount: number;
  pendingEscrowAmount: number;
  assignedArchitect?: string;
  assignedContractor?: string;
  assignedSiteSupervisor?: string;
  milestones: InteriorProjectMilestone[];
  designBrief?: InteriorDesignBrief;
  documents?: { id: string; name: string; type: string; url: string; uploadedAt: string }[];
  notes?: string;
  updatedAt: string;
}

export const TEST_PROJECTS: InteriorProject[] = [
  {
    id: 'prj-int-1',
    projectId: 'BG-2026-0002',
    bookingId: 'bk-int-1',
    quotationId: 'quote-int-1',
    quotationNumber: 'BG-Q-INT-101',
    customerId: 'cust-101',
    customerName: 'Aman Saxena',
    customerPhone: '9811223344',
    designerId: 'id-101',
    designerName: 'Ar. Pooja Mehra',
    title: 'DLF The Crest Penthouse Oasis',
    projectAddress: 'Tower 4, 18th Floor, DLF The Crest, Sector 54, Gurugram',
    location: 'DLF The Crest, Sector 54, Gurugram',
    propertyType: '4BHK Luxury Apartment',
    carpetAreaSqFt: 2800,
    approvedScope: [
      'Residential Interior Design',
      'Living Room Design',
      'Modular Kitchen Design',
      'False Ceiling Design',
      'Wardrobe Design',
      'Lighting Design',
      'Interior Execution and Implementation',
    ],
    status: 'EXECUTION_IN_PROGRESS',
    currentStage: 'SITE_EXECUTION',
    overallProgressPercent: 45,
    startDate: '2026-11-01',
    targetEndDate: '2027-01-20',
    projectBudget: 3500000,
    totalContractValue: 924440,
    paidAmount: 554664,
    pendingEscrowAmount: 369776,
    assignedArchitect: 'Ar. Rajesh Verma (BuildGhar Senior Council)',
    assignedContractor: 'Apex Civil & Woodcraft Contractors',
    assignedSiteSupervisor: 'Er. Sandeep Yadav (PMC Lead)',
    updatedAt: '2026-11-25T10:00:00Z',
    designBrief: {
      id: 'brief-int-1',
      projectId: 'prj-int-1',
      customerRequirements: 'Contemporary luxury interior with bookmatched Statuario Italian marble, Blum motorized tandem kitchen, and acoustic suede headboards.',
      roomBreakdown: [
        { roomName: 'Living & Dining Room', dimensions: '26 ft x 18 ft', style: 'Contemporary Luxury', colorScheme: 'Charcoal, Off-White & Brass Accents', requirements: 'Statuario marble cladding with indirect warm cove and custom 8-seater table.' },
        { roomName: 'Modular Kitchen', dimensions: '16 ft x 12 ft', style: 'German Minimalist', colorScheme: 'Matte Anthracite & Quartz', requirements: 'Blum Tandembox soft-close, Blum Aventos lift-ups, island breakfast counter.' },
        { roomName: 'Master Bedroom Suite', dimensions: '20 ft x 16 ft', style: 'Modern Luxe', colorScheme: 'Champagne Gold & Warm Beige', requirements: 'Floor-to-ceiling walk-in wardrobe with sensor LED profiles and fluted paneling.' },
      ],
      designStyle: 'Contemporary Luxury with Italian Finishes',
      colorPreferences: ['Off-White', 'Warm Charcoal', 'Champagne Brass', 'Smoked Oak'],
      materialPreferences: ['Statuario Marble', 'Greenlam Marine Ply 710', 'Blum Austria Hardware', 'Caesarstone Quartz'],
      furnitureRequirements: ['Custom 8-Seater Statuario Dining Table', 'King Size Hydraulic Storage Bed', 'L-Shaped Velvet Sectional Lounge'],
      lightingRequirements: ['Magnetic Track Lighting 3000K', 'Perimeter Gyproc Cove Trough', 'Dimmable Architectural Spotlights'],
      targetBudget: 3500000,
      specialInstructions: 'Homeowner requests strict noise restriction between 2 PM and 4 PM as per DLF society bylaws.',
      referenceImages: [
        'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
      ],
      adminApprovalStatus: 'APPROVED_BY_ADMIN',
      approvedAt: '2026-10-18T14:00:00Z',
    },
    milestones: [
      { id: 'm-1', name: 'Stage 1: Advance Booking & 2D Layout Approval', weightPercent: 25, status: 'COMPLETED', dueDate: '2026-11-10', payoutAmount: 231110, escrowStatus: 'RELEASED_TO_DESIGNER' },
      { id: 'm-2', name: 'Stage 2: Woodwork Carcass & Frame Approval', weightPercent: 35, status: 'COMPLETED', dueDate: '2026-11-25', payoutAmount: 323554, escrowStatus: 'RELEASED_TO_DESIGNER' },
      { id: 'm-3', name: 'Stage 3: Veneer/Laminate Pressing & False Ceiling', weightPercent: 25, status: 'IN_PROGRESS', dueDate: '2026-12-15', payoutAmount: 231110, escrowStatus: 'LOCKED_IN_ESCROW' },
      { id: 'm-4', name: 'Stage 4: Snag Clearance & Final Handover', weightPercent: 15, status: 'PENDING', dueDate: '2027-01-20', payoutAmount: 138666, escrowStatus: 'LOCKED_IN_ESCROW' },
    ],
    documents: [
      { id: 'doc-1', name: 'Tri-Party Interior Execution Contract', type: 'PDF', url: 'https://example.com/contract-bg-2026-0002.pdf', uploadedAt: '2026-10-20' },
      { id: 'doc-2', name: 'Structural Column Load Clearance Report', type: 'PDF', url: 'https://example.com/structural-audit.pdf', uploadedAt: '2026-10-22' },
      { id: 'doc-3', name: 'DLF Crest Society Work Permit & Gate Pass', type: 'PDF', url: 'https://example.com/dlf-permit.pdf', uploadedAt: '2026-10-28' },
    ],
  },
  {
    id: 'prj-int-2',
    projectId: 'BG-2026-0008',
    bookingId: 'bk-int-2',
    quotationId: 'quote-int-2',
    quotationNumber: 'BG-Q-INT-102',
    customerId: 'cust-102',
    customerName: 'Meera Chawla',
    customerPhone: '9822334455',
    designerId: 'id-101',
    designerName: 'Ar. Pooja Mehra',
    title: 'Scandinavian Minimalist Penthouse',
    projectAddress: 'Tower B, Jaypee Greens, Greater Noida',
    location: 'Jaypee Greens, Greater Noida',
    propertyType: '3BHK Penthouse',
    carpetAreaSqFt: 2200,
    approvedScope: [
      'Residential Interior Design',
      'Modular Kitchen Design',
      'Bedroom Design',
      '3D Interior Design',
      'Lighting Design',
    ],
    status: 'DESIGN_IN_PROGRESS',
    currentStage: 'VISUALIZATION_3D',
    overallProgressPercent: 25,
    startDate: '2026-11-05',
    targetEndDate: '2026-12-25',
    projectBudget: 2500000,
    totalContractValue: 405330,
    paidAmount: 101332,
    pendingEscrowAmount: 303998,
    assignedArchitect: 'Ar. Pooja Mehra',
    assignedContractor: 'BuildGhar Verified Woodcraft Partner',
    updatedAt: '2026-11-22T12:00:00Z',
    designBrief: {
      id: 'brief-int-2',
      projectId: 'prj-int-2',
      customerRequirements: 'Minimalist Scandinavian design with light natural oak woodwork, acoustic fabric panels, and warm neutral tones.',
      roomBreakdown: [
        { roomName: 'Master Bedroom Suite', dimensions: '18 ft x 14 ft', style: 'Scandinavian', colorScheme: 'Muted Taupe & Nordic Pine', requirements: 'Fluted oak headboard, integrated reading sconces, and sliding wardrobe.' },
        { roomName: 'Modular Kitchen', dimensions: '14 ft x 10 ft', style: 'Modern Scandi', colorScheme: 'Warm White & Light Ash', requirements: 'Concealed cutlery trays and quartz breakfast bar.' },
      ],
      designStyle: 'Minimalist Scandinavian with Acoustic Elements',
      colorPreferences: ['Nordic White', 'Light Ash Grey', 'Sage Green Accents'],
      materialPreferences: ['Natural Oak Veneer', 'Century Ply Gold 710', 'Hettich Soft-Close', 'Kalinga Stone Quartz'],
      furnitureRequirements: ['Scandinavian Platform Bed', 'Concealed Vanity Unit'],
      lightingRequirements: ['Warm 2700K Architectural Downlights', 'Nordic Pendant over Dining'],
      targetBudget: 2500000,
      specialInstructions: 'Preference for sustainable low-VOC paints and non-toxic wood polish.',
      referenceImages: [
        'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1200&q=80',
      ],
      adminApprovalStatus: 'APPROVED_BY_ADMIN',
      approvedAt: '2026-10-25T11:00:00Z',
    },
    milestones: [
      { id: 'm-11', name: 'Stage 1: Advance Booking & 2D Layout Approval', weightPercent: 25, status: 'COMPLETED', dueDate: '2026-11-12', payoutAmount: 101332, escrowStatus: 'RELEASED_TO_DESIGNER' },
      { id: 'm-12', name: 'Stage 2: 3D Visualization & Finishes Sign-Off', weightPercent: 25, status: 'IN_PROGRESS', dueDate: '2026-11-28', payoutAmount: 101332, escrowStatus: 'LOCKED_IN_ESCROW' },
      { id: 'm-13', name: 'Stage 3: Woodwork Carcass & Factory Fabrication', weightPercent: 30, status: 'PENDING', dueDate: '2026-12-10', payoutAmount: 121599, escrowStatus: 'LOCKED_IN_ESCROW' },
      { id: 'm-14', name: 'Stage 4: On-Site Assembly & Handover', weightPercent: 20, status: 'PENDING', dueDate: '2026-12-25', payoutAmount: 81067, escrowStatus: 'LOCKED_IN_ESCROW' },
    ],
  },
  {
    id: 'prj-int-3',
    projectId: 'BG-2026-0015',
    bookingId: 'bk-int-3',
    quotationId: 'quote-int-5',
    quotationNumber: 'BG-Q-INT-105',
    customerId: 'cust-103',
    customerName: 'Vikramaditya Oberoi',
    customerPhone: '9844001122',
    designerId: 'id-101',
    designerName: 'Ar. Pooja Mehra',
    title: 'Sushant Lok Modern Art Deco Villa',
    projectAddress: 'Plot 42, Block C, Sushant Lok 1, Sector 43, Gurugram',
    location: 'Sushant Lok 1, Gurugram',
    propertyType: '4BHK Duplex Villa',
    carpetAreaSqFt: 3400,
    approvedScope: [
      'Residential Interior Design',
      'Living Room Design',
      'False Ceiling Design',
      'Lighting Design',
      'Interior Execution and Implementation',
    ],
    status: 'PENDING_KICKOFF',
    currentStage: 'INITIAL_CONSULTATION',
    overallProgressPercent: 5,
    startDate: '2026-12-01',
    targetEndDate: '2027-03-15',
    projectBudget: 4500000,
    totalContractValue: 1250000,
    paidAmount: 0,
    pendingEscrowAmount: 1250000,
    assignedArchitect: 'Ar. Pooja Mehra',
    updatedAt: '2026-11-26T16:00:00Z',
    designBrief: {
      id: 'brief-int-3',
      projectId: 'prj-int-3',
      customerRequirements: 'Modern Art Deco villa interior with double-height ceiling accents, brass fluting, and chevron parquet wooden flooring.',
      roomBreakdown: [
        { roomName: 'Foyer & Grand Staircase', dimensions: '24 ft x 14 ft', style: 'Art Deco', colorScheme: 'Emerald Green & Burnished Brass', requirements: 'Geometric CNC metal balustrades and statement chandelier.' },
      ],
      designStyle: 'Modern Art Deco & Luxury Classic',
      colorPreferences: ['Emerald Green', 'Deep Navy', 'Champagne Gold'],
      materialPreferences: ['Chevron Engineered Oak', 'Bespoke Brass PVD Inlays', 'Kevlar Backed Louvers'],
      furnitureRequirements: ['Curved Velvet Boucle Sofa', 'Art Deco Console with Tinted Mirror'],
      lightingRequirements: ['Multi-Tier Geometric Chandelier', 'Concealed Step Lighting'],
      targetBudget: 4500000,
      specialInstructions: 'Admin site inspection scheduled for site measurement verification.',
      referenceImages: [],
      adminApprovalStatus: 'APPROVED_BY_ADMIN',
      approvedAt: '2026-11-25T14:00:00Z',
    },
    milestones: [
      { id: 'm-21', name: 'Stage 1: Advance & Demarcation', weightPercent: 25, status: 'PENDING', dueDate: '2026-12-10', payoutAmount: 312500, escrowStatus: 'LOCKED_IN_ESCROW' },
      { id: 'm-22', name: 'Stage 2: Civil & Structural Framing', weightPercent: 35, status: 'PENDING', dueDate: '2027-01-10', payoutAmount: 437500, escrowStatus: 'LOCKED_IN_ESCROW' },
      { id: 'm-23', name: 'Stage 3: Woodcraft & Finishes', weightPercent: 25, status: 'PENDING', dueDate: '2027-02-15', payoutAmount: 312500, escrowStatus: 'LOCKED_IN_ESCROW' },
      { id: 'm-24', name: 'Stage 4: Snag Sign-off & Delivery', weightPercent: 15, status: 'PENDING', dueDate: '2027-03-15', payoutAmount: 187500, escrowStatus: 'LOCKED_IN_ESCROW' },
    ],
  },
];

export const SEED_INTERIOR_PROJECTS: InteriorProject[] = TEST_PROJECTS;

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
  const defaults = TEST_PROJECTS;
  return designerId ? defaults.filter((p) => p.designerId === designerId) : defaults;
};

export const getInteriorProjectById = (id: string): InteriorProject | null => {
  const all = getInteriorProjects();
  return all.find((p) => p.id === id || p.projectId === id) || null;
};

export const saveInteriorProject = (p: Partial<InteriorProject>): InteriorProject => {
  const current = getInteriorProjects();
  const existingIdx = current.findIndex((item) => item.id === p.id || (p.projectId && item.projectId === p.projectId));
  const now = new Date().toISOString();
  let updated: InteriorProject;
  if (existingIdx >= 0) {
    updated = { ...current[existingIdx], ...p, updatedAt: now };
    current[existingIdx] = updated;
  } else {
    updated = {
      id: p.id || ('prj-int-' + Date.now()),
      projectId: p.projectId || ('BG-2026-' + Math.floor(1000 + Math.random() * 9000)),
      bookingId: p.bookingId || '',
      quotationId: p.quotationId || '',
      quotationNumber: p.quotationNumber || '',
      customerId: p.customerId || 'cust-101',
      customerName: p.customerName || 'Homeowner',
      customerPhone: p.customerPhone || '',
      designerId: p.designerId || 'id-101',
      designerName: p.designerName || 'Ar. Pooja Mehra',
      title: p.title || 'Interior Project',
      projectAddress: p.projectAddress || 'DLF Phase 5, Gurugram',
      location: p.location || 'Gurugram',
      propertyType: p.propertyType || 'Apartment',
      carpetAreaSqFt: p.carpetAreaSqFt || 2000,
      approvedScope: p.approvedScope || ['Residential Interior Design'],
      status: p.status || 'ACTIVE',
      currentStage: p.currentStage || 'CONCEPT_DESIGN',
      overallProgressPercent: p.overallProgressPercent || 15,
      startDate: p.startDate || now.slice(0, 10),
      targetEndDate: p.targetEndDate || '2027-02-28',
      projectBudget: p.projectBudget || 2500000,
      totalContractValue: p.totalContractValue || 1500000,
      paidAmount: p.paidAmount || 300000,
      pendingEscrowAmount: p.pendingEscrowAmount || 1200000,
      milestones: p.milestones || [],
      designBrief: p.designBrief,
      documents: p.documents || [],
      notes: p.notes || '',
      updatedAt: now,
    };
    current.push(updated);
  }
  try {
    localStorage.setItem('gd_interior_projects_v1', JSON.stringify(current));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new Event('interior_projects_updated'));
    }
  } catch (e) {}
  return updated;
};

// ==========================================
// SECTION D: INTERIOR DESIGN MANAGEMENT & WORKSPACE (Section 9)
// ==========================================
export type InteriorDesignCategory =
  | 'SPACE_PLANNING' // 9B: Space Planning & Furniture Layout
  | 'LAYOUT_2D' // 9C: 2D Working CAD Plans
  | 'VISUALIZATION_3D' // 9D: 3D Photorealistic Renders
  | 'MATERIAL_FINISHES' // 9E: Material and Finish Selection
  | 'MOOD_BOARD';

export type InteriorAdminReviewStatus =
  | 'PENDING_ADMIN_REVIEW'
  | 'APPROVED_BY_ADMIN'
  | 'REVISION_REQUESTED'
  | 'REJECTED'
  | 'CUSTOMER_REVISION_PENDING_ADMIN_FORWARD';

export type InteriorClientApprovalStatus =
  | 'NOT_FORWARDED'
  | 'PENDING_CUSTOMER_REVIEW'
  | 'APPROVED'
  | 'CHANGES_REQUESTED'
  | 'REVISION_REQUESTED';

export interface InteriorDesignAsset {
  id: string;
  documentId: string; // BG-DOC-INT-XXXX
  projectId: string;
  projectName: string;
  title: string;
  category: InteriorDesignCategory;
  roomName: string;
  version: string; // 'v1.0', 'v2.0'
  fileUrl: string;
  thumbnailUrl: string;
  fileSize: string;
  dimensionsOrSpecs?: string;
  uploadedBy: string;
  uploadedAt: string;
  adminReviewStatus: InteriorAdminReviewStatus;
  adminFeedback?: string;
  forwardedToCustomer?: boolean;
  forwardedAt?: string;
  adminForwardInstructions?: string;
  clientApprovalStatus: InteriorClientApprovalStatus;
  clientFeedback?: string;
  isLatestApproved: boolean;
  versionHistory?: { version: string; fileUrl: string; uploadedAt: string; comments?: string }[];
  customerName?: string;
}

export const TEST_INTERIOR_DESIGN_ASSETS: InteriorDesignAsset[] = [
  {
    id: 'asset-int-1',
    documentId: 'BG-DOC-INT-101',
    projectId: 'prj-int-1',
    projectName: 'DLF The Crest Penthouse Oasis',
    title: 'Living Room 4K Photorealistic Evening Render',
    category: 'VISUALIZATION_3D',
    roomName: 'Living & Dining Room',
    version: 'v1.0',
    fileUrl: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1600&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=400&q=80',
    fileSize: '4.8 MB (PNG)',
    dimensionsOrSpecs: '3840 x 2160 • 4K UHD Render • 3ds Max + V-Ray 6',
    uploadedBy: 'Ar. Pooja Mehra',
    uploadedAt: '2026-11-12T14:30:00Z',
    adminReviewStatus: 'APPROVED_BY_ADMIN',
    clientApprovalStatus: 'APPROVED',
    isLatestApproved: true,
  },
  {
    id: 'asset-int-2',
    documentId: 'BG-DOC-INT-102',
    projectId: 'prj-int-1',
    projectName: 'DLF The Crest Penthouse Oasis',
    title: 'Island Modular Kitchen Working CAD Layout & Elevations',
    category: 'LAYOUT_2D',
    roomName: 'Modular Kitchen',
    version: 'v1.0',
    fileUrl: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1600&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=400&q=80',
    fileSize: '2.1 MB (DWG/PDF)',
    dimensionsOrSpecs: 'Scale 1:25 • Blum Tandembox & Aventos Lift-Up Specs',
    uploadedBy: 'Ar. Pooja Mehra',
    uploadedAt: '2026-11-14T11:00:00Z',
    adminReviewStatus: 'APPROVED_BY_ADMIN',
    clientApprovalStatus: 'APPROVED',
    isLatestApproved: true,
  },
  {
    id: 'asset-int-3',
    documentId: 'BG-DOC-INT-103',
    projectId: 'prj-int-1',
    projectName: 'DLF The Crest Penthouse Oasis',
    title: 'Floor Zoning & Spatial Clearance Plan',
    category: 'SPACE_PLANNING',
    roomName: 'Full Penthouse',
    version: 'v1.0',
    fileUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=400&q=80',
    fileSize: '3.4 MB (PDF)',
    dimensionsOrSpecs: 'Anthropometric Clearances • 2800 sq ft Master Layout',
    uploadedBy: 'Ar. Pooja Mehra',
    uploadedAt: '2026-11-08T09:00:00Z',
    adminReviewStatus: 'APPROVED_BY_ADMIN',
    clientApprovalStatus: 'APPROVED',
    isLatestApproved: true,
  },
  {
    id: 'asset-int-4',
    documentId: 'BG-DOC-INT-104',
    projectId: 'prj-int-1',
    projectName: 'DLF The Crest Penthouse Oasis',
    title: 'Luxury Material & Hardware Swatch Schedule',
    category: 'MATERIAL_FINISHES',
    roomName: 'Living & Kitchen',
    version: 'v1.0',
    fileUrl: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1600&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=400&q=80',
    fileSize: '5.2 MB (PDF)',
    dimensionsOrSpecs: 'Statuario Marble • Greenlam 710 • Century Natural Teak • Blum Antaro',
    uploadedBy: 'Ar. Pooja Mehra',
    uploadedAt: '2026-11-16T16:00:00Z',
    adminReviewStatus: 'APPROVED_BY_ADMIN',
    clientApprovalStatus: 'APPROVED',
    isLatestApproved: true,
  },
  {
    id: 'asset-int-5',
    documentId: 'BG-DOC-INT-105',
    projectId: 'prj-int-2',
    projectName: 'Scandinavian Minimalist Penthouse',
    title: 'Master Bedroom Nordic Oak Headboard 3D Render',
    category: 'VISUALIZATION_3D',
    roomName: 'Master Bedroom Suite',
    version: 'v1.1',
    fileUrl: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1600&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=400&q=80',
    fileSize: '4.2 MB (PNG)',
    dimensionsOrSpecs: '3840 x 2160 • Daylight Ambience • Light Oak Louvers',
    uploadedBy: 'Ar. Pooja Mehra',
    uploadedAt: '2026-11-20T15:00:00Z',
    adminReviewStatus: 'APPROVED_BY_ADMIN',
    clientApprovalStatus: 'PENDING_CUSTOMER_REVIEW',
    isLatestApproved: false,
  },
  {
    id: 'asset-int-6',
    documentId: 'BG-DOC-INT-106',
    projectId: 'prj-int-2',
    projectName: 'Scandinavian Minimalist Penthouse',
    title: 'Ceiling False Cove & Lighting Wiring Schedule',
    category: 'LAYOUT_2D',
    roomName: 'Living & Bedroom',
    version: 'v1.0',
    fileUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1600&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=400&q=80',
    fileSize: '1.9 MB (DWG)',
    dimensionsOrSpecs: 'Magnetic 3000K Tracks • Perimeter Gyproc Cove Rafters',
    uploadedBy: 'Ar. Pooja Mehra',
    uploadedAt: '2026-11-18T10:00:00Z',
    adminReviewStatus: 'PENDING_ADMIN_REVIEW',
    clientApprovalStatus: 'PENDING_CUSTOMER_REVIEW',
    isLatestApproved: false,
  },
];

export const SEED_INTERIOR_DESIGN_ASSETS: InteriorDesignAsset[] = TEST_INTERIOR_DESIGN_ASSETS;

export const getInteriorDesignAssets = (projectId?: string, category?: string): InteriorDesignAsset[] => {
  try {
    const data = localStorage.getItem('gd_interior_assets_v1');
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        let filtered = parsed;
        if (projectId && projectId !== 'ALL') {
          filtered = filtered.filter((a: InteriorDesignAsset) => a.projectId === projectId);
        }
        if (category && category !== 'ALL') {
          filtered = filtered.filter((a: InteriorDesignAsset) => a.category === category);
        }
        return filtered;
      }
    }
  } catch (e) {}
  let defaults = TEST_INTERIOR_DESIGN_ASSETS;
  if (projectId && projectId !== 'ALL') {
    defaults = defaults.filter((a) => a.projectId === projectId);
  }
  if (category && category !== 'ALL') {
    defaults = defaults.filter((a) => a.category === category);
  }
  return defaults;
};

export const saveInteriorDesignAsset = (asset: Partial<InteriorDesignAsset>): InteriorDesignAsset => {
  const all = getInteriorDesignAssets();
  const existingIdx = all.findIndex((a) => a.id === asset.id || (asset.documentId && a.documentId === asset.documentId));
  const now = new Date().toISOString();

  let updated: InteriorDesignAsset;
  if (existingIdx >= 0) {
    updated = {
      ...all[existingIdx],
      ...asset,
    } as InteriorDesignAsset;
    all[existingIdx] = updated;
  } else {
    updated = {
      id: asset.id || `asset-int-${Date.now()}`,
      documentId: asset.documentId || `BG-DOC-INT-${Math.floor(100 + Math.random() * 900)}`,
      projectId: asset.projectId || 'prj-int-1',
      projectName: asset.projectName || 'Interior Project',
      title: asset.title || 'Design Submission',
      category: asset.category || 'VISUALIZATION_3D',
      roomName: asset.roomName || 'Living Room',
      version: asset.version || 'v1.0',
      fileUrl: asset.fileUrl || 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1600',
      thumbnailUrl: asset.thumbnailUrl || asset.fileUrl || 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=400',
      fileSize: asset.fileSize || '3.5 MB (PNG)',
      dimensionsOrSpecs: asset.dimensionsOrSpecs || '3840 x 2160 UHD',
      uploadedBy: asset.uploadedBy || 'Ar. Pooja Mehra',
      uploadedAt: now,
      adminReviewStatus: asset.adminReviewStatus || 'PENDING_ADMIN_REVIEW',
      clientApprovalStatus: asset.clientApprovalStatus || 'PENDING_CUSTOMER_REVIEW',
      isLatestApproved: asset.isLatestApproved || false,
    };
    all.unshift(updated);
  }

  try {
    localStorage.setItem('gd_interior_assets_v1', JSON.stringify(all));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new Event('interior_assets_updated'));
    }
  } catch (e) {}

  return updated;
};

export const submitDesignAssetToAdmin = (assetId: string, notes?: string): InteriorDesignAsset => {
  const all = getInteriorDesignAssets();
  const asset = all.find((a) => a.id === assetId || a.documentId === assetId);
  if (!asset) throw new Error('Design asset not found');

  asset.adminReviewStatus = 'PENDING_ADMIN_REVIEW';
  if (notes) {
    asset.dimensionsOrSpecs = asset.dimensionsOrSpecs ? `${asset.dimensionsOrSpecs} | Note: ${notes}` : notes;
  }
  return saveInteriorDesignAsset(asset);
};

export const adminApproveAndForwardInteriorDesign = (
  assetId: string,
  adminNotes?: string
): InteriorDesignAsset => {
  const all = getInteriorDesignAssets();
  const asset = all.find((a) => a.id === assetId || a.documentId === assetId);
  if (!asset) throw new Error('Design asset not found');

  asset.adminReviewStatus = 'APPROVED_BY_ADMIN';
  asset.forwardedToCustomer = true;
  asset.forwardedAt = new Date().toISOString();
  asset.clientApprovalStatus = 'PENDING_CUSTOMER_REVIEW';
  if (adminNotes) asset.adminFeedback = adminNotes;
  asset.isLatestApproved = true;

  // Sync to customer deliverables storage so homeowner sees it in DesignApprovals immediately
  try {
    const custKey = `customer_approvals_${asset.projectId}`;
    const storedCust = localStorage.getItem(custKey);
    let custApprovals: any[] = storedCust ? JSON.parse(storedCust) : [];
    const existingCustIdx = custApprovals.findIndex((c) => c.id === asset.id || c.documentTitle === asset.title);
    const custItem = {
      id: asset.id,
      projectId: asset.projectId,
      documentTitle: asset.title,
      category: 'INTERIOR',
      documentVersion: asset.version,
      previewUrl: asset.fileUrl,
      status: 'PENDING',
      submittedAt: asset.uploadedAt,
      designerName: asset.uploadedBy,
      designerRole: 'Principal Interior Designer',
      notes: `${asset.roomName} • ${asset.dimensionsOrSpecs || ''}`,
      history: (asset.versionHistory || []).map((v) => ({
        version: v.version,
        comment: v.comments || 'Previous version',
        timestamp: v.uploadedAt,
        by: 'Designer',
      })),
    };
    if (existingCustIdx >= 0) {
      custApprovals[existingCustIdx] = custItem;
    } else {
      custApprovals.unshift(custItem);
    }
    localStorage.setItem(custKey, JSON.stringify(custApprovals));
  } catch (e) {}

  return saveInteriorDesignAsset(asset);
};

export const adminRequestInteriorDesignRevision = (
  assetId: string,
  revisionNotes: string
): InteriorDesignAsset => {
  const all = getInteriorDesignAssets();
  const asset = all.find((a) => a.id === assetId || a.documentId === assetId);
  if (!asset) throw new Error('Design asset not found');

  asset.adminReviewStatus = 'REVISION_REQUESTED';
  asset.adminFeedback = revisionNotes;
  asset.forwardedToCustomer = false;
  return saveInteriorDesignAsset(asset);
};

export const adminRejectInteriorDesign = (
  assetId: string,
  reason: string
): InteriorDesignAsset => {
  const all = getInteriorDesignAssets();
  const asset = all.find((a) => a.id === assetId || a.documentId === assetId);
  if (!asset) throw new Error('Design asset not found');

  asset.adminReviewStatus = 'REJECTED';
  asset.adminFeedback = reason;
  asset.forwardedToCustomer = false;
  return saveInteriorDesignAsset(asset);
};

export const adminForwardCustomerRevisionToInteriorDesigner = (
  assetId: string,
  adminDirectives?: string
): InteriorDesignAsset => {
  const all = getInteriorDesignAssets();
  const asset = all.find((a) => a.id === assetId || a.documentId === assetId);
  if (!asset) throw new Error('Design asset not found');

  asset.adminReviewStatus = 'REVISION_REQUESTED';
  if (adminDirectives) asset.adminForwardInstructions = adminDirectives;
  asset.forwardedToCustomer = false;

  return saveInteriorDesignAsset(asset);
};

export const adminReviewDesignAsset = (
  assetId: string,
  action: 'APPROVE' | 'REJECT' | 'REQUEST_REVISION',
  feedback?: string
): InteriorDesignAsset => {
  if (action === 'APPROVE') {
    return adminApproveAndForwardInteriorDesign(assetId, feedback);
  } else if (action === 'REQUEST_REVISION') {
    return adminRequestInteriorDesignRevision(assetId, feedback || 'Revision required by Admin');
  } else {
    return adminRejectInteriorDesign(assetId, feedback || 'Rejected by Admin');
  }
};

export const customerReviewDesignAsset = (
  assetId: string,
  action: 'APPROVE' | 'REQUEST_REVISION',
  feedback?: string
): InteriorDesignAsset => {
  const all = getInteriorDesignAssets();
  const asset = all.find((a) => a.id === assetId || a.documentId === assetId);
  if (!asset) throw new Error('Design asset not found');

  if (action === 'APPROVE') {
    asset.clientApprovalStatus = 'APPROVED';
    asset.isLatestApproved = true;
    asset.clientFeedback = feedback || 'Approved by customer';
  } else {
    asset.clientApprovalStatus = 'CHANGES_REQUESTED';
    asset.adminReviewStatus = 'CUSTOMER_REVISION_PENDING_ADMIN_FORWARD';
    asset.clientFeedback = feedback || 'Customer requested changes';
  }

  return saveInteriorDesignAsset(asset);
};

export const createDesignAssetRevision = (
  assetId: string,
  newFileUrl: string,
  specs?: string
): InteriorDesignAsset => {
  const all = getInteriorDesignAssets();
  const asset = all.find((a) => a.id === assetId || a.documentId === assetId);
  if (!asset) throw new Error('Design asset not found');

  const prevVersion = asset.version || 'v1.0';
  const match = prevVersion.match(/^v?(\d+)/i);
  const major = match ? parseInt(match[1], 10) : 1;
  const nextVersion = `v${major + 1}.0`;

  const snapshot = {
    version: prevVersion,
    fileUrl: asset.fileUrl,
    uploadedAt: asset.uploadedAt,
    comments: asset.clientFeedback || asset.adminFeedback,
  };

  asset.versionHistory = [...(asset.versionHistory || []), snapshot];
  asset.version = nextVersion;
  asset.fileUrl = newFileUrl;
  asset.thumbnailUrl = newFileUrl;
  if (specs) asset.dimensionsOrSpecs = specs;
  asset.uploadedAt = new Date().toISOString();
  asset.adminReviewStatus = 'PENDING_ADMIN_REVIEW';
  asset.clientApprovalStatus = 'NOT_FORWARDED';
  asset.forwardedToCustomer = false;
  asset.isLatestApproved = false;
  asset.adminFeedback = undefined;
  asset.adminForwardInstructions = undefined;

  return saveInteriorDesignAsset(asset);
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

export const TEST_BOQ: InteriorBOQItem[] = [
  { id: 'boq-1', projectId: 'prj-int-1', roomName: 'Kitchen', category: 'Plywood & Hardware', itemName: 'Greenlam Marine Plywood (BWP 710)', specification: 'Greenlam 18mm BWP IS:710 Marine Grade', brand: 'Greenlam', unit: 'sq.ft', quantity: 24, unitRate: 4200, wastagePercent: 5, labourCost: 500, taxPercent: 18, totalAmount: 112800, supplierName: 'Greenply Industries Ltd', status: 'ORDERED' },
  { id: 'boq-2', projectId: 'prj-int-1', roomName: 'Kitchen', category: 'Modular Fittings', itemName: 'Blum Soft-Close Tandembox Drawers', specification: 'Blum Austria Antaro 500mm', brand: 'Blum', unit: 'sets', quantity: 8, unitRate: 3800, wastagePercent: 0, labourCost: 350, taxPercent: 18, totalAmount: 33200, supplierName: 'Hafele India Pvt Ltd', status: 'DELIVERED_TO_SITE' },
  { id: 'boq-3', projectId: 'prj-int-1', roomName: 'Master Bedroom', category: 'Laminates & Veneer', itemName: 'Century Natural Teak Veneer 4mm', specification: 'CenturyVeneers Group 1 Teak', brand: 'CenturyPly', unit: 'sheets', quantity: 12, unitRate: 2400, wastagePercent: 8, labourCost: 400, taxPercent: 18, totalAmount: 33600, supplierName: 'Century Plyboards Ltd', status: 'APPROVED' },
  { id: 'boq-4', projectId: 'prj-int-1', roomName: 'Living Room', category: 'Paint & Finishes', itemName: 'Asian Paints Royale Luxury Emulsion', specification: 'Asian Paints White Base Matt', brand: 'Asian Paints', unit: 'litres', quantity: 40, unitRate: 550, wastagePercent: 2, labourCost: 150, taxPercent: 18, totalAmount: 28000, supplierName: 'Asian Paints Colour Ideas', status: 'APPROVED' },
];

export const SEED_INTERIOR_BOQ_ITEMS: InteriorBOQItem[] = TEST_BOQ;

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

export const TEST_SITE_VISITS: InteriorSiteVisit[] = [
  {
    id: 'sv-101',
    projectId: 'prj-int-1',
    scheduledDate: '2026-12-02',
    timeSlot: '11:00 AM - 01:00 PM',
    purpose: 'Modular kitchen carcass alignment and countertop measurement verification',
    status: 'SCHEDULED',
    findingsNotes: 'Pending site inspection with contractor.',
  },
  {
    id: 'sv-102',
    projectId: 'prj-int-2',
    scheduledDate: '2026-12-05',
    timeSlot: '02:30 PM - 04:30 PM',
    purpose: 'False ceiling electrical points and perimeter cove light trough inspection',
    status: 'SCHEDULED',
    findingsNotes: 'Verify LED channel dimensions.',
  },
];

export const SEED_INTERIOR_SITE_VISITS: InteriorSiteVisit[] = TEST_SITE_VISITS;

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

export const TEST_INVOICES: InteriorInvoice[] = [
  {
    id: 'inv-101',
    invoiceNumber: 'BG-INV-2026-081',
    projectId: 'prj-int-1',
    projectName: 'DLF The Crest Luxury Suite',
    clientName: 'Aman Saxena',
    amount: 195856,
    taxAmount: 35254,
    totalAmount: 231110,
    status: 'PAID',
    date: '2026-10-25',
    dueDate: '2026-10-30',
    milestoneName: 'Stage 1: Advance Booking & 2D Layout Approval',
  },
  {
    id: 'inv-102',
    invoiceNumber: 'BG-INV-2026-094',
    projectId: 'prj-int-1',
    projectName: 'DLF The Crest Luxury Suite',
    clientName: 'Aman Saxena',
    amount: 274198,
    taxAmount: 49356,
    totalAmount: 323554,
    status: 'ISSUED',
    date: '2026-11-20',
    dueDate: '2026-11-28',
    milestoneName: 'Stage 2: Woodwork Carcass & Frame Approval',
  },
];

export const TEST_PAYOUTS: InteriorPayoutRequest[] = [
  {
    id: 'pay-101',
    requestId: 'REQ-INT-101',
    designerId: 'id-101',
    amount: 185000,
    bankAccount: '••••••••8910',
    ifsc: 'HDFC0001234',
    status: 'PROCESSED',
    requestedAt: '2026-10-28T10:00:00Z',
    processedAt: '2026-10-29T14:30:00Z',
    utrNumber: 'CMS2026102988123',
  },
  {
    id: 'pay-102',
    requestId: 'REQ-INT-101',
    designerId: 'id-101',
    amount: 250000,
    bankAccount: '••••••••8910',
    ifsc: 'HDFC0001234',
    status: 'PENDING_ADMIN_APPROVAL',
    requestedAt: '2026-11-21T11:00:00Z',
  },
];

export const SEED_INTERIOR_INVOICES: InteriorInvoice[] = TEST_INVOICES;

export const SEED_INTERIOR_PAYOUTS: InteriorPayoutRequest[] = TEST_PAYOUTS;

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
