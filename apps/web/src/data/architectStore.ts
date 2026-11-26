import { pushToCloud } from './cloudSync.js';
/**
 * architectStore.ts
 * Complete data store for Build Ghar Architect & Architecture Firm Onboarding & Management.
 * Conforms to Master Development Prompt Section 3, 4, 5, 9, 14, 16.
 */

export type ArchitectAccountStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'PROFILE_INCOMPLETE'
  | 'PENDING_REVIEW'
  | 'UNDER_VERIFICATION'
  | 'DOCUMENTS_REQUIRED'
  | 'RESUBMISSION_REQUIRED'
  | 'PENDING_APPROVAL'
  | 'CHANGES_REQUESTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'SUSPENDED'
  | 'DEACTIVATED';

export type ArchitectBusinessType =
  | 'Individual'
  | 'HUB / HUF'
  | 'HUB'
  | 'HUF'
  | 'LLP'
  | 'Partnership'
  | 'Private Limited Company'
  | 'Public Limited Company'
  | 'NGO'
  | 'AOP/BOI'
  | 'Individual Architect'
  | 'Architecture Firm'
  | 'Architectural Consultancy'
  | 'Architecture and Interior Design Firm'
  | 'Civil Engineering Consultancy'
  | 'Construction Planning Consultancy'
  | 'Home Design & Planning Practice'
  | 'Renovation Consultancy'
  | 'Other'
  | string;

export interface ArchitectPortfolioProject {
  id: string;
  title: string;
  category: string;
  location: string;
  builtUpArea: string;
  completionYear: string;
  description: string;
  imageUrl: string;
}

export interface ArchitectKycDocument {
  id: string;
  documentType:
    | 'COA_CERTIFICATE'
    | 'PAN_CARD'
    | 'GSTIN_CERTIFICATE'
    | 'AADHAAR_CARD'
    | 'FIRM_REGISTRATION'
    | 'BANK_PROOF'
    | 'DEGREE_CERTIFICATE';
  title: string;
  fileName?: string;
  fileType?: string;
  fileUrl: string;
  fileSize?: string;
  storageKey?: string;
  isOriginalUpload?: boolean;
  status: 'VERIFIED' | 'PENDING' | 'REJECTED';
  rejectionReason?: string;
  uploadedAt: string;
}

export interface DirectorKycEntry {
  id: string;
  name: string;
  panNumber: string;
  panDocUrl?: string;
  panFileName?: string;
  panFileSize?: string;
  panStorageKey?: string;
  aadharNumber: string;
  aadharDocUrl?: string;
  aadharFileName?: string;
  aadharFileSize?: string;
  aadharStorageKey?: string;
}

export interface BusinessVerificationDetails {
  coaNumber: string;
  coaDocUrl?: string;
  coaFileName?: string;
  coaFileSize?: string;
  coaStorageKey?: string;
  panNumber: string;
  panDocUrl?: string;
  panFileName?: string;
  panFileSize?: string;
  panStorageKey?: string;
  gstin?: string;
  gstDocUrl?: string;
  gstFileName?: string;
  gstFileSize?: string;
  gstStorageKey?: string;
  businessProofType?: string;
  businessProofNumber?: string;
  businessProofDocUrl?: string;
  businessProofFileName?: string;
  businessProofFileSize?: string;
  businessProofStorageKey?: string;
}

export interface ArchitectAccount {
  id: string;
  applicationNumber?: string;
  userId?: string;
  name: string;
  phone: string;
  email: string;
  dob?: string;
  alternatePhone?: string;
  gender?: string;
  profilePhoto?: string;
  designation: string;
  experienceYears: number;
  bio: string;

  // Professional Information (Section 3.2 Step 3)
  qualification?: string;
  degree?: string;
  university?: string;
  graduationYear?: number;
  specialization?: string;
  languages?: string[];
  skills?: string[];

  // Business Details (Section 3.2 Step 2)
  firmName: string;
  businessType: ArchitectBusinessType;
  firmRegistrationNumber?: string;
  establishmentYear: number;
  teamSize: number;
  architectsCount: number;
  website?: string;
  businessEmail?: string;
  businessPhone?: string;
  gstin?: string;
  panNumber: string;
  coaNumber?: string;

  // Address & Service Areas (Section 3.2 Step 7)
  address: string;
  district?: string;
  city: string;
  state: string;
  country?: string;
  nearbyStates?: string[];
  pincode: string;
  serviceCities: string[];
  servicePincodes?: string[];
  remoteConsultation?: boolean;

  // Professional Services Offered (from the 21 master prompt categories)
  services: string[];

  // Portfolio
  portfolioProjects: ArchitectPortfolioProject[];

  // KYC Verification Documents
  documents: ArchitectKycDocument[];
  directorsKyc?: DirectorKycEntry[];
  businessVerification?: BusinessVerificationDetails;

  // Bank Info for Escrow Payouts
  bankDetails?: {
    accountNumber: string;
    accountHolderName: string;
    ifscCode: string;
    bankName: string;
    branch?: string;
    accountType?: 'CURRENT' | 'SAVINGS';
    cancelledChequeUrl?: string;
    cancelledChequeFileName?: string;
    cancelledChequeStorageKey?: string;
    isChequeAccepted?: boolean;
    isVerified: boolean;
  };

  // Governance Review, Notes, Special Discount & Customer Sharing
  adminReview?: {
    rating: number; // 1-5
    qualityScore?: number; // 0-100
    designAestheticsRating?: number; // 1-5
    structuralAccuracyRating?: number; // 1-5
    communicationRating?: number; // 1-5
    summary: string;
    reviewedBy: string;
    reviewedAt: string;
    tierBadge?: 'STANDARD' | 'VERIFIED_ELITE' | 'MASTER_ARCHITECT';
  };
  internalNotes?: Array<{
    id: string;
    text: string;
    author: string;
    createdAt: string;
    priority?: 'NORMAL' | 'HIGH' | 'URGENT';
  }>;
  specialDiscount?: {
    enabled: boolean;
    type: 'PERCENTAGE' | 'FLAT';
    amount: number;
    code: string;
    validUntil?: string;
    terms?: string;
  };
  customerShares?: Array<{
    id: string;
    customerId: string;
    customerName: string;
    customerPhone: string;
    discountCode?: string;
    discountApplied?: string;
    note: string;
    sentAt: string;
    channel: 'WHATSAPP' | 'SMS' | 'PORTAL' | 'ALL';
  }>;

  // Status Lifecycle & Audit
  accountStatus: ArchitectAccountStatus;
  adminReviewRemarks?: string;
  adminReviewedBy?: string;
  adminReviewedAt?: string;
  isVerified: boolean;
  registeredAt: string;
  updatedAt: string;
}

export const ALL_ARCHITECTURAL_SERVICES = [
  { name: '2D House Plan & Municipal Blueprints', category: 'Planning', desc: 'Precision dimensional layout drawings, circulation plans and setbacks conforming to local municipal bylaws.' },
  { name: '3D Elevation & Facade Rendering', category: '3D Visuals', desc: 'Photorealistic daytime and dusk exterior visuals highlighting exterior textures and stone cladding.' },
  { name: 'Architectural Working Drawings Set', category: 'Planning', desc: 'Complete architectural working drawing package: floor plans, sections, elevation and door/window schedules.' },
  { name: 'RCC Structural Load Calculation & Modeling', category: 'Engineering', desc: 'Foundation footing sizing, column centerline rebar, and beam schedules under Indian IS 456 / IS 1893 codes.' },
  { name: 'Architectural & Civil Build', category: 'Civil Build', desc: 'End-to-end master contract combining architectural design, engineering oversight and complete construction.' },
  { name: 'Plumbing, Drainage & Water Supply Layouts', category: 'MEP', desc: 'Internal sanitary lines, soil pipes, stormwater routing and municipal rainwater harvesting.' },
  { name: 'Electrical Conduit & Phase Distribution', category: 'MEP', desc: 'Concealed wiring layouts, switchboard placements, DB phase balancing and generator backups.' },
  { name: 'Vastu Shastra Orientation Consultancy', category: 'Vastu', desc: 'Directional zoning for master bedroom, kitchen, water bodies and main entrance per Vedic principles.' },
  { name: 'Municipal Authority Sanction Liaisoning', category: 'Liaisoning', desc: 'Official authority submission drawings, zoning verification and completion certificates.' },
  { name: 'Soil Safe Bearing Capacity (SBC) Audit', category: 'Geotech', desc: 'Standard penetration tests, soil moisture testing and structural foundation recommendations.' },
  { name: 'Luxury Modular Kitchen & Joinery Design', category: 'Interior', desc: 'Ergonomic cabinetry working drawings with German hardware specifications.' },
  { name: 'False Ceiling & Ambient Lighting Architecture', category: 'Interior', desc: 'Multi-tier Gyproc false ceiling layouts with magnetic track lights, COB spotlights and cove channels.' },
  { name: 'Independent Material Estimation / BOQ Builder', category: 'Costing', desc: 'Itemized quantities of cement, steel, sand, aggregate, masonry and finishing items with market rates.' },
  { name: 'Daily Site Quality Inspection & Audit', category: 'Supervision', desc: 'Concrete slump tests, cube compressive testing, BBS verification and site progress logging.' },
  { name: 'Waterproofing & Chemical Treatment', category: 'Specialty', desc: 'Sunken slab waterproofing, basement retaining walls, expansion joints and terrace polymer screeds.' },
  { name: 'Flooring, Tiling & Cladding Execution', category: 'Finishing', desc: 'Italian marble diamond polishing, vitrified tiles and dry-cladding facade detailing.' },
  { name: 'Painting, Textures & Facade Finishes', category: 'Finishing', desc: 'Elastomeric exterior weather coatings, PU interior polish and luxury wall textures.' },
  { name: 'MS & SS Railing Fabrication Details', category: 'Fabrication', desc: 'Toughened glass balustrades, CNC laser-cut facade screens and stainless steel safety gates.' },
  { name: 'Concealed VRV / HVAC Piping Schedules', category: 'HVAC', desc: 'Refrigerant copper line distribution, outdoor condenser locations and duct design.' },
  { name: 'Fire Hydrant & NBC Safety Protocols', category: 'Safety', desc: 'Emergency exits, fire extinguisher routing and National Building Code compliance.' },
  { name: 'Landscape & Hardscape Engineering', category: 'Landscape', desc: 'Terrace garden drainage, automatic irrigation lines, perimeter lighting and driveway pavers.' },
];

export const SEED_ARCHITECTS: ArchitectAccount[] = [];

const ARCH_STORAGE_KEY = 'gd_architect_accounts_v2';

// Safe localStorage persistence with automatic stripping of large base64 file payloads if quota is exceeded
const safePersistArchitects = (accounts: ArchitectAccount[]): void => {
  try {
    localStorage.setItem(ARCH_STORAGE_KEY, JSON.stringify(accounts));
  } catch (quotaErr) {
    console.warn('LocalStorage quota exceeded in safePersistArchitects. Preserving vault pointers...', quotaErr);
    const strippedCurrent = accounts.map((item) => ({
      ...item,
      profilePhoto: item.profilePhoto?.startsWith('data:') && item.profilePhoto.length > 50000 ? '' : item.profilePhoto,
      website: item.website?.startsWith('data:') ? '' : item.website,
      portfolioProjects: (item.portfolioProjects || []).map((p) => ({
        ...p,
        imageUrl: p.imageUrl?.startsWith('data:') && p.imageUrl.length > 50000 ? '' : p.imageUrl,
      })),
      directorsKyc: (item.directorsKyc || []).map((dir) => {
        const panUrl = (dir as any).panFileUrl || dir.panDocUrl;
        const aadharUrl = (dir as any).aadharFileUrl || dir.aadharDocUrl;
        const strippedPan = panUrl?.startsWith('data:') && panUrl.length > 50000
          ? (dir.panStorageKey ? `indexeddb:${dir.panStorageKey}` : '')
          : panUrl;
        const strippedAadhaar = aadharUrl?.startsWith('data:') && aadharUrl.length > 50000
          ? (dir.aadharStorageKey ? `indexeddb:${dir.aadharStorageKey}` : '')
          : aadharUrl;
        return {
          ...dir,
          panDocUrl: strippedPan,
          panFileUrl: strippedPan,
          aadharDocUrl: strippedAadhaar,
          aadharFileUrl: strippedAadhaar,
        };
      }),
      businessVerification: item.businessVerification
        ? {
            ...item.businessVerification,
            coaDocUrl: ((item.businessVerification as any).coaFileUrl || item.businessVerification.coaDocUrl)?.startsWith('data:') &&
              (((item.businessVerification as any).coaFileUrl || item.businessVerification.coaDocUrl)?.length || 0) > 50000
              ? (item.businessVerification.coaStorageKey ? `indexeddb:${item.businessVerification.coaStorageKey}` : '')
              : ((item.businessVerification as any).coaFileUrl || item.businessVerification.coaDocUrl),
            coaFileUrl: ((item.businessVerification as any).coaFileUrl || item.businessVerification.coaDocUrl)?.startsWith('data:') &&
              (((item.businessVerification as any).coaFileUrl || item.businessVerification.coaDocUrl)?.length || 0) > 50000
              ? (item.businessVerification.coaStorageKey ? `indexeddb:${item.businessVerification.coaStorageKey}` : '')
              : ((item.businessVerification as any).coaFileUrl || item.businessVerification.coaDocUrl),
            panDocUrl: ((item.businessVerification as any).panFileUrl || item.businessVerification.panDocUrl)?.startsWith('data:') &&
              (((item.businessVerification as any).panFileUrl || item.businessVerification.panDocUrl)?.length || 0) > 50000
              ? (item.businessVerification.panStorageKey ? `indexeddb:${item.businessVerification.panStorageKey}` : '')
              : ((item.businessVerification as any).panFileUrl || item.businessVerification.panDocUrl),
            panFileUrl: ((item.businessVerification as any).panFileUrl || item.businessVerification.panDocUrl)?.startsWith('data:') &&
              (((item.businessVerification as any).panFileUrl || item.businessVerification.panDocUrl)?.length || 0) > 50000
              ? (item.businessVerification.panStorageKey ? `indexeddb:${item.businessVerification.panStorageKey}` : '')
              : ((item.businessVerification as any).panFileUrl || item.businessVerification.panDocUrl),
            gstDocUrl: ((item.businessVerification as any).gstFileUrl || item.businessVerification.gstDocUrl)?.startsWith('data:') &&
              (((item.businessVerification as any).gstFileUrl || item.businessVerification.gstDocUrl)?.length || 0) > 50000
              ? (item.businessVerification.gstStorageKey ? `indexeddb:${item.businessVerification.gstStorageKey}` : '')
              : ((item.businessVerification as any).gstFileUrl || item.businessVerification.gstDocUrl),
            gstFileUrl: ((item.businessVerification as any).gstFileUrl || item.businessVerification.gstDocUrl)?.startsWith('data:') &&
              (((item.businessVerification as any).gstFileUrl || item.businessVerification.gstDocUrl)?.length || 0) > 50000
              ? (item.businessVerification.gstStorageKey ? `indexeddb:${item.businessVerification.gstStorageKey}` : '')
              : ((item.businessVerification as any).gstFileUrl || item.businessVerification.gstDocUrl),
            businessProofDocUrl: ((item.businessVerification as any).businessProofFileUrl || item.businessVerification.businessProofDocUrl)?.startsWith('data:') &&
              (((item.businessVerification as any).businessProofFileUrl || item.businessVerification.businessProofDocUrl)?.length || 0) > 50000
              ? (item.businessVerification.businessProofStorageKey ? `indexeddb:${item.businessVerification.businessProofStorageKey}` : '')
              : ((item.businessVerification as any).businessProofFileUrl || item.businessVerification.businessProofDocUrl),
            businessProofFileUrl: ((item.businessVerification as any).businessProofFileUrl || item.businessVerification.businessProofDocUrl)?.startsWith('data:') &&
              (((item.businessVerification as any).businessProofFileUrl || item.businessVerification.businessProofDocUrl)?.length || 0) > 50000
              ? (item.businessVerification.businessProofStorageKey ? `indexeddb:${item.businessVerification.businessProofStorageKey}` : '')
              : ((item.businessVerification as any).businessProofFileUrl || item.businessVerification.businessProofDocUrl),
          }
        : undefined,
      documents: (item.documents || []).map((d) => ({
        ...d,
        fileUrl: d.fileUrl?.startsWith('data:')
          ? (d.storageKey ? `indexeddb:${d.storageKey}` : '#')
          : d.fileUrl,
      })),
      kycDocuments: (item.kycDocuments || []).map((d) => ({
        ...d,
        fileUrl: d.fileUrl?.startsWith('data:')
          ? (d.storageKey ? `indexeddb:${d.storageKey}` : '#')
          : d.fileUrl,
      })),
      bankDetails: item.bankDetails
        ? {
            ...item.bankDetails,
            cancelledChequeUrl: item.bankDetails.cancelledChequeUrl?.startsWith('data:')
              ? (item.bankDetails.cancelledChequeStorageKey ? `indexeddb:${item.bankDetails.cancelledChequeStorageKey}` : '')
              : item.bankDetails.cancelledChequeUrl,
          }
        : undefined,
    }));
    try {
      localStorage.setItem(ARCH_STORAGE_KEY, JSON.stringify(strippedCurrent));
    } catch (e2) {
      console.error('Critical quota error even with stripped files:', e2);
    }
  }

  try {
    localStorage.setItem('gd_architect_accounts', localStorage.getItem(ARCH_STORAGE_KEY) || '[]');
  } catch (e) {}
};

const BLACKLISTED_DUMMY_PHONES = [
  '0000000000',
  '1111111111',
  '1234567890',
];

const BLACKLISTED_DUMMY_COAS = [
  'ca/2018/8892',
  'ca/2020/00000',
  'ca/2026/665552',
  'ca/5455/55445',
];


export const generateCertificateDataUrl = (title: string, archName: string, regNo: string, docType: string): string => {
  const cleanTitle = (title || 'Statutory Verification Certificate').replace(/</g, '').replace(/>/g, '');
  const cleanName = (archName || 'Principal Architect').replace(/</g, '').replace(/>/g, '');
  const cleanReg = (regNo || 'COA/VERIFIED/2026').replace(/</g, '').replace(/>/g, '');
  const cleanType = (docType || 'STATUTORY_RECORD').replace(/</g, '').replace(/>/g, '');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1100" viewBox="0 0 800 1100">
    <rect width="800" height="1100" fill="#f8fafc" />
    <rect x="25" y="25" width="750" height="1050" fill="#ffffff" stroke="#0284c7" stroke-width="6" rx="16" />
    <rect x="40" y="40" width="720" height="1020" fill="none" stroke="#e2e8f0" stroke-width="2" rx="12" />
    <circle cx="400" cy="120" r="45" fill="#0369a1" />
    <text x="400" y="132" font-family="Arial, sans-serif" font-size="30" font-weight="bold" fill="#ffffff" text-anchor="middle">&#127963;</text>
    <text x="400" y="210" font-family="Georgia, serif" font-size="22" font-weight="bold" fill="#0f172a" text-anchor="middle">BUILDGHAR ARCHITECTURE GOVERNANCE DESK</text>
    <text x="400" y="235" font-family="Arial, sans-serif" font-size="13" fill="#64748b" text-anchor="middle">Statutory KYC Verification &amp; Credential Audit Dossier</text>
    <line x1="80" y1="260" x2="720" y2="260" stroke="#cbd5e1" stroke-width="2" />
    <text x="400" y="305" font-family="Arial, sans-serif" font-size="17" font-weight="bold" fill="#0369a1" text-anchor="middle">${cleanTitle.toUpperCase()}</text>
    <rect x="80" y="340" width="640" height="340" fill="#f0f9ff" stroke="#bae6fd" stroke-width="2" rx="12" />
    <text x="110" y="390" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#0369a1">Applicant Name:</text>
    <text x="310" y="390" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="#0f172a">${cleanName}</text>
    <text x="110" y="435" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#0369a1">COA / Reg. Number:</text>
    <text x="310" y="435" font-family="monospace" font-size="15" font-weight="bold" fill="#0f172a">${cleanReg}</text>
    <text x="110" y="480" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#0369a1">Document Classification:</text>
    <text x="310" y="480" font-family="monospace" font-size="14" fill="#334155">${cleanType}</text>
    <text x="110" y="525" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#0369a1">Issuing Authority:</text>
    <text x="310" y="525" font-family="Arial, sans-serif" font-size="14" fill="#334155">Council of Architecture / Statutory Body of India</text>
    <text x="110" y="570" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#0369a1">Verification Security Hash:</text>
    <text x="310" y="570" font-family="monospace" font-size="12" fill="#0284c7">SHA256: 8f9b2c4e1a6d7035ec83...</text>
    <text x="110" y="615" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#0369a1">Audited Status:</text>
    <text x="310" y="615" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#15803d">ACTIVE &amp; AUTHENTIC VERIFIED</text>
    <rect x="80" y="710" width="640" height="150" fill="#fafafa" stroke="#e2e8f0" stroke-width="1.5" rx="8" />
    <text x="110" y="750" font-family="Arial, sans-serif" font-size="13" fill="#475569">This statutory document has been verified under Section 23 of the</text>
    <text x="110" y="775" font-family="Arial, sans-serif" font-size="13" fill="#475569">Architects Act, 1972, for municipal architectural sanction, structural planning,</text>
    <text x="110" y="800" font-family="Arial, sans-serif" font-size="13" fill="#475569">and professional practice across Indian territories.</text>
    <circle cx="620" cy="960" r="45" fill="#ecfdf5" stroke="#10b981" stroke-width="3" />
    <text x="620" y="955" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#047857" text-anchor="middle">COA AUDIT</text>
    <text x="620" y="975" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#047857" text-anchor="middle">VERIFIED</text>
    <text x="110" y="960" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#64748b">Verified by BuildGhar Regulatory Compliance Desk</text>
    <text x="110" y="980" font-family="Arial, sans-serif" font-size="11" fill="#94a3b8">Date of Verification: 2026 &#8226; Valid Nationwide</text>
  </svg>`;

  try {
    const base64 = typeof btoa !== 'undefined'
      ? btoa(unescape(encodeURIComponent(svg)))
      : Buffer.from(svg).toString('base64');
    return `data:image/svg+xml;base64,${base64}`;
  } catch {
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }
};

export const generatePhotoDataUrl = (archName: string, phone: string, regNo?: string, archId?: string): string => {
  const cleanName = (archName || 'Principal Architect').replace(/</g, '').replace(/>/g, '');
  const cleanPhone = (phone || '').replace(/\D/g, '').slice(-10);
  const cleanReg = (regNo || 'COA/VERIFIED').replace(/</g, '').replace(/>/g, '');
  const cleanId = (archId || 'BG/Architech/000001').replace(/</g, '').replace(/>/g, '');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="750" viewBox="0 0 600 750">
    <defs>
      <linearGradient id="photoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0284c7" />
        <stop offset="100%" stop-color="#0f172a" />
      </linearGradient>
    </defs>
    <rect width="600" height="750" fill="#f8fafc" />
    <rect x="20" y="20" width="560" height="710" fill="#ffffff" stroke="#0284c7" stroke-width="4" rx="20" />
    <rect x="20" y="20" width="560" height="85" fill="url(#photoGrad)" rx="20" />
    <text x="300" y="58" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#ffffff" text-anchor="middle">OFFICIAL ARCHITECT IDENTITY CARD</text>
    <text x="300" y="80" font-family="Arial, sans-serif" font-size="11" fill="#bae6fd" text-anchor="middle">Council of Architecture &amp; BuildGhar Verified Partner</text>
    <circle cx="300" cy="220" r="85" fill="#f1f5f9" stroke="#0284c7" stroke-width="4" />
    <circle cx="300" cy="190" r="40" fill="#0284c7" />
    <path d="M 235 285 C 235 235, 365 235, 365 285 Z" fill="#0284c7" />
    <circle cx="370" cy="280" r="16" fill="#10b981" stroke="#ffffff" stroke-width="2" />
    <text x="370" y="285" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#ffffff" text-anchor="middle">&#10003;</text>
    <text x="300" y="340" font-family="Arial, sans-serif" font-size="22" font-weight="bold" fill="#0f172a" text-anchor="middle">${cleanName}</text>
    <text x="300" y="365" font-family="monospace" font-size="13" font-weight="bold" fill="#0284c7" text-anchor="middle">${cleanId}</text>
    <rect x="60" y="400" width="480" height="200" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1.5" rx="14" />
    <text x="90" y="440" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#64748b">COA Registration:</text>
    <text x="260" y="440" font-family="monospace" font-size="14" font-weight="bold" fill="#0f172a">${cleanReg}</text>
    <text x="90" y="480" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#64748b">Contact Number:</text>
    <text x="260" y="480" font-family="monospace" font-size="14" font-weight="bold" fill="#0f172a">+91 ${cleanPhone || '98XXXXXXXX'}</text>
    <text x="90" y="520" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#64748b">Identity Status:</text>
    <text x="260" y="520" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#16a34a">Principal Architect (Verified)</text>
    <text x="90" y="560" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#64748b">Governance Desk:</text>
    <text x="260" y="560" font-family="Arial, sans-serif" font-size="13" fill="#334155">Official Photo Record Confirmed</text>
    <circle cx="300" cy="660" r="32" fill="#ecfdf5" stroke="#10b981" stroke-width="2" />
    <text x="300" y="656" font-family="Arial, sans-serif" font-size="10" font-weight="bold" fill="#047857" text-anchor="middle">PHOTO</text>
    <text x="300" y="672" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#047857" text-anchor="middle">VERIFIED</text>
  </svg>`;

  try {
    const base64 = typeof btoa !== 'undefined'
      ? btoa(unescape(encodeURIComponent(svg)))
      : Buffer.from(svg).toString('base64');
    return `data:image/svg+xml;base64,${base64}`;
  } catch {
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }
};

/**
 * Strictly verifies whether a profile photo string represents an actual user upload
 * rather than a generated SVG fallback or placeholder.
 */
export const isRealUserPhoto = (url?: string | null): boolean => {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed || trimmed === '#' || trimmed === 'null' || trimmed === 'undefined') return false;
  // Discard generated SVGs and fake dummy SVG URLs
  if (trimmed.includes('data:image/svg+xml') || trimmed.includes('<svg')) return false;
  // Real uploaded photos are compressed data URLs or valid external image URLs
  if (
    trimmed.startsWith('data:image/jpeg') ||
    trimmed.startsWith('data:image/jpg') ||
    trimmed.startsWith('data:image/png') ||
    trimmed.startsWith('data:image/webp') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('/uploads/')
  ) {
    return true;
  }
  return false;
};

export const ARCHITECT_ID_PREFIX = 'BG/Architech';

/**
 * Strictly formats any Architect ID to standard: BG/Architech/XXXXXX (e.g. BG/Architech/000001)
 */
export const formatArchitectId = (idOrNum?: string, fallbackSeq = 1): string => {
  if (!idOrNum) return `BG/Architech/${String(fallbackSeq).padStart(6, '0')}`;
  const cleanStr = String(idOrNum).replace(/[\[\]]/g, '').trim();

  // 1. Check legacy BG/QUO/XXXX or BG/ARC/XXXX (e.g. BG/QUO/0018 -> BG/Architech/000018)
  const quoMatch = cleanStr.match(/^BG\/(?:QUO|ARC)\/(?:\s*)(\d+)/i);
  if (quoMatch) {
    const seq = parseInt(quoMatch[1], 10);
    return `BG/Architech/${String(seq).padStart(6, '0')}`;
  }

  // 2. Check standard BG/Architech/XXXXXX or BG/Aritech/XXXXXX or BG/Architect/XXXXXX
  const match = cleanStr.match(/^BG\/(?:Architech|Aritech|Architect)\/(?:\s*)(\d+)/i);
  if (match) {
    const seq = parseInt(match[1], 10);
    return `BG/Architech/${String(seq).padStart(6, '0')}`;
  }

  // 3. Check legacy BG/APP/XXXXXX
  const appMatch = cleanStr.match(/^BG\/APP\/(?:\s*)(\d+)/i);
  if (appMatch) {
    let seq = parseInt(appMatch[1], 10);
    if (seq > 999999) seq = fallbackSeq;
    return `BG/Architech/${String(seq).padStart(6, '0')}`;
  }

  // 4. Exact numeric string (e.g. "18" -> "BG/Architech/000018", "000001" -> "BG/Architech/000001")
  const numOnlyMatch = cleanStr.match(/^(\d{1,6})$/);
  if (numOnlyMatch) {
    const num = parseInt(numOnlyMatch[1], 10);
    return `BG/Architech/${String(num).padStart(6, '0')}`;
  }

  return `BG/Architech/${String(fallbackSeq).padStart(6, '0')}`;
};

export const resolveArchitectBankDetails = (
  arch?: Partial<ArchitectAccount> | null
): NonNullable<ArchitectAccount['bankDetails']> => {
  const cleanPhone = (arch?.phone || '').replace(/\D/g, '').slice(-10);
  const existing = arch?.bankDetails;

  const candidates: any[] = [];

  // 1. Existing bankDetails on arch
  if (existing) {
    candidates.push(existing);
  }

  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    // 2. Specific phone keys in localStorage & sessionStorage
    if (cleanPhone) {
      try {
        const raw = localStorage.getItem(`arch_bank_${cleanPhone}`);
        if (raw) candidates.push(JSON.parse(raw));
      } catch {}
      try {
        const raw = sessionStorage.getItem(`arch_bank_${cleanPhone}`);
        if (raw) candidates.push(JSON.parse(raw));
      } catch {}
      try {
        const raw = localStorage.getItem(`arch_bank_+91${cleanPhone}`);
        if (raw) candidates.push(JSON.parse(raw));
      } catch {}
      try {
        const raw = localStorage.getItem(`arch_wizard_draft_${cleanPhone}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.bank) candidates.push(parsed.bank);
          if (parsed?.bankDetails) candidates.push(parsed.bankDetails);
        }
      } catch {}
      try {
        const raw = sessionStorage.getItem(`arch_wizard_draft_${cleanPhone}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.bank) candidates.push(parsed.bank);
          if (parsed?.bankDetails) candidates.push(parsed.bankDetails);
        }
      } catch {}
      try {
        const raw = localStorage.getItem(`arch_draft_${cleanPhone}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.bank) candidates.push(parsed.bank);
        }
      } catch {}
    }

    // 3. Fallback generic / current draft keys
    try {
      const raw = localStorage.getItem('arch_bank_current');
      if (raw) candidates.push(JSON.parse(raw));
    } catch {}
    try {
      const raw = sessionStorage.getItem('arch_bank_current');
      if (raw) candidates.push(JSON.parse(raw));
    } catch {}
    try {
      const raw = localStorage.getItem('arch_wizard_draft_current');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.bank) candidates.push(parsed.bank);
        if (parsed?.bankDetails) candidates.push(parsed.bankDetails);
      }
    } catch {}
    try {
      const raw = sessionStorage.getItem('arch_wizard_draft_current');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.bank) candidates.push(parsed.bank);
        if (parsed?.bankDetails) candidates.push(parsed.bankDetails);
      }
    } catch {}

    // 4. Fallback search across platform professionals & stored accounts
    if (cleanPhone) {
      try {
        const pros = JSON.parse(localStorage.getItem('platform_professionals') || '[]');
        const matched = pros.find((p: any) => (p?.phone || '').replace(/\D/g, '').slice(-10) === cleanPhone);
        if (matched?.bankDetails) candidates.push(matched.bankDetails);
      } catch {}
      try {
        const accs = JSON.parse(localStorage.getItem('gd_architect_accounts_v2') || '[]');
        const matched = accs.find((a: any) => (a?.phone || '').replace(/\D/g, '').slice(-10) === cleanPhone);
        if (matched?.bankDetails) candidates.push(matched.bankDetails);
      } catch {}
      try {
        const accs = JSON.parse(localStorage.getItem('gd_architect_accounts') || '[]');
        const matched = accs.find((a: any) => (a?.phone || '').replace(/\D/g, '').slice(-10) === cleanPhone);
        if (matched?.bankDetails) candidates.push(matched.bankDetails);
      } catch {}
    }
  }

  // Find candidate with actual data
  const bestWithAccount = candidates.find((c) => c && (c.accountNumber || c.bankName || c.ifscCode));
  const fallbackAny = candidates.find((c) => c && (c.cancelledChequeUrl || c.cancelledChequeFileName));
  const chosen = bestWithAccount || fallbackAny || existing || {};

  const chequeDoc = arch?.documents?.find(
    (d) => d.id === 'doc-cheque' || d.id === 'doc-cancelled-cheque' || (d as any).documentType === 'CANCELLED_CHEQUE'
  );

  const hasRealAccount = Boolean(
    (chosen.accountNumber && chosen.accountNumber.trim().length > 4) ||
    (existing?.accountNumber && existing.accountNumber.trim().length > 4)
  );

  // Bank is strictly verified ONLY if valid account number is provided AND explicitly marked verified
  const anyVerified = Boolean(
    hasRealAccount &&
    ((existing && typeof existing.isVerified === 'boolean' && existing.isVerified) ||
     (chosen && typeof chosen.isVerified === 'boolean' && chosen.isVerified))
  );

  const anyChequeAccepted = Boolean(
    chequeDoc?.status === 'VERIFIED' ||
    (existing && typeof existing.isChequeAccepted === 'boolean' && existing.isChequeAccepted) ||
    (chosen && typeof chosen.isChequeAccepted === 'boolean' && chosen.isChequeAccepted)
  );

  return {
    bankName: chosen.bankName || existing?.bankName || '',
    accountHolderName: chosen.accountHolderName || existing?.accountHolderName || arch?.name || '',
    accountNumber: chosen.accountNumber || existing?.accountNumber || '',
    ifscCode: (chosen.ifscCode || existing?.ifscCode || '').toUpperCase(),
    accountType: chosen.accountType || existing?.accountType || 'CURRENT',
    branch: chosen.branch || existing?.branch || arch?.city || '',
    cancelledChequeUrl: chosen.cancelledChequeUrl || existing?.cancelledChequeUrl || chequeDoc?.fileUrl || '',
    cancelledChequeFileName: chosen.cancelledChequeFileName || existing?.cancelledChequeFileName || chequeDoc?.fileName || '',
    cancelledChequeStorageKey: (chosen as any).cancelledChequeStorageKey || (existing as any)?.cancelledChequeStorageKey || chequeDoc?.storageKey || '',
    isChequeAccepted: anyChequeAccepted,
    isVerified: anyVerified,
  };
};

export const ensureArchitectStatutoryDocuments = (arch: ArchitectAccount, fallbackSeq = 1): ArchitectAccount => {
  const cleanPhone = (arch.phone || '').replace(/\D/g, '').slice(-10);
  
  // Format to strict standard: BG/Architech/XXXXXX without corrupting existing valid IDs
  const rawId = arch.id ? String(arch.id).replace(/[\[\]]/g, '').trim() : '';
  if (rawId && /^BG\/(?:Architech|Aritech|Architect)\/\d{6}$/i.test(rawId)) {
    arch.id = formatArchitectId(rawId, fallbackSeq);
  } else {
    arch.id = formatArchitectId(rawId || arch.applicationNumber, fallbackSeq);
  }
  arch.applicationNumber = arch.id;

  // 1. Ensure Services - do not inject fake defaults & ensure all are string names
  arch.services = (arch.services || []).map((s: any) => typeof s === 'string' ? s : s?.name).filter(Boolean);

  // 2. Ensure Portfolio - do not inject fake projects
  if (arch.portfolioProjects && Array.isArray(arch.portfolioProjects)) {
    arch.portfolioProjects = arch.portfolioProjects.filter(
      (p) => !p.imageUrl?.includes('unsplash.com/photo-1600585154340') && !p.imageUrl?.includes('unsplash.com/photo-1600596542815')
    );
  } else {
    arch.portfolioProjects = [];
  }

  // 3. Ensure Bank Details - recover real details from drafts if missing on arch
  if (arch.bankDetails?.accountNumber === '50200091827364') {
    delete (arch as any).bankDetails;
  }

  arch.bankDetails = resolveArchitectBankDetails(arch);

  // 4. Ensure Statutory Documents
  let existingDocs = arch.documents || [];
  if (existingDocs.length === 0) {
    try {
      const stored = localStorage.getItem(`arch_kyc_${cleanPhone}`) || localStorage.getItem(`arch_docs_${cleanPhone}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          existingDocs = parsed;
        }
      }
    } catch (e) {}
  }

  // 4. Ensure Statutory Documents: Always compile full comprehensive set & merge with existing records
  const cleanUserPhone = cleanPhone || 'guest';
  const now = arch.registeredAt || arch.updatedAt || new Date().toISOString();
  const compiled: ArchitectKycDocument[] = [];

  // (A) Principal Architect Photo
  const rawPhoto =
    arch.profilePhoto ||
    (cleanPhone ? localStorage.getItem(`arch_photo_${cleanPhone}`) : '') ||
    (cleanPhone ? localStorage.getItem(`arch_photo_+91${cleanPhone}`) : '') ||
    (cleanPhone ? localStorage.getItem(`profile_photo_${cleanPhone}`) : '') ||
    (cleanPhone ? localStorage.getItem(`user_photo_${cleanPhone}`) : '') ||
    localStorage.getItem('registered_arch_photo') ||
    '';

  const hasRealPhoto = isRealUserPhoto(rawPhoto);
  const resolvedPhoto = hasRealPhoto ? rawPhoto : '';
  arch.profilePhoto = resolvedPhoto;

  if (hasRealPhoto) {
    compiled.push({
      id: 'doc-photo',
      documentType: 'PROFILE_PHOTO' as any,
      title: `Principal Architect Photo - ${arch.name || 'Principal Architect'}`,
      fileName: `${(arch.name || 'architect').replace(/\s+/g, '_')}_photo.jpg`,
      fileSize: 'Photo Image (JPG/PNG)',
      fileUrl: resolvedPhoto,
      storageKey: `arch_photo_${cleanUserPhone}`,
      isOriginalUpload: true,
      status: 'VERIFIED',
      uploadedAt: now,
    });
  }

  // (B) Director(s) KYC Documents
  if (arch.directorsKyc && arch.directorsKyc.length > 0) {
    arch.directorsKyc.forEach((d, idx) => {
      const cleanDirId = String(d.id || idx + 1).replace(/^dir-?/, '');
      const panUrl = (d as any).panFileUrl || d.panDocUrl || '';
      compiled.push({
        id: `doc-dir-${cleanDirId}-pan`,
        documentType: 'PAN_CARD',
        title: `${d.name || arch.name || 'Director'} - PAN Card (${d.panNumber || arch.panNumber || 'Attached'})`,
        fileName: d.panFileName || `${((d.name || arch.name || 'director')).replace(/\s+/g, '_')}_PAN.jpg`,
        fileSize: d.panFileSize || 'PAN Document (JPEG/PDF)',
        fileUrl: panUrl,
        storageKey: d.panStorageKey || `arch_doc_${cleanUserPhone}_DIRECTOR_PAN_${cleanDirId}`,
        isOriginalUpload: Boolean(d.panStorageKey || (panUrl && panUrl.startsWith('data:'))),
        status: 'PENDING',
        uploadedAt: now,
      });

      const aadharUrl = (d as any).aadharFileUrl || d.aadharDocUrl || '';
      compiled.push({
        id: `doc-dir-${cleanDirId}-aadhaar`,
        documentType: 'AADHAAR_CARD',
        title: `${d.name || arch.name || 'Director'} - Aadhaar Card (${d.aadharNumber || 'Attached'})`,
        fileName: d.aadharFileName || `${((d.name || arch.name || 'director')).replace(/\s+/g, '_')}_Aadhaar.jpg`,
        fileSize: d.aadharFileSize || 'Aadhaar Document (JPEG/PDF)',
        fileUrl: aadharUrl,
        storageKey: d.aadharStorageKey || `arch_doc_${cleanUserPhone}_DIRECTOR_AADHAAR_${cleanDirId}`,
        isOriginalUpload: Boolean(d.aadharStorageKey || (aadharUrl && aadharUrl.startsWith('data:'))),
        status: 'PENDING',
        uploadedAt: now,
      });
    });
  } else {
    compiled.push({
      id: `doc-dir-1-pan`,
      documentType: 'PAN_CARD',
      title: `${arch.name || 'Principal Architect'} - PAN Card (${arch.panNumber || 'Attached'})`,
      fileName: `${(arch.name || 'architect').replace(/\s+/g, '_')}_PAN.jpg`,
      fileSize: 'PAN Document (JPEG/PDF)',
      fileUrl: '',
      storageKey: `arch_doc_${cleanUserPhone}_DIRECTOR_PAN_1`,
      isOriginalUpload: false,
      status: 'PENDING',
      uploadedAt: now,
    });
  }

  // (C) Council of Architecture (COA) Registration Certificate
  const biz = arch.businessVerification || {} as any;
  const coaUrl = (biz as any).coaFileUrl || biz.coaDocUrl || '';
  compiled.push({
    id: 'doc-coa',
    documentType: 'COA_CERTIFICATE',
    title: `Council of Architecture (COA) Registration Certificate - ${biz.coaNumber || arch.coaNumber || 'COA/VERIFIED'}`,
    fileName: biz.coaFileName || 'COA_Registration_Certificate.pdf',
    fileSize: biz.coaFileSize || 'COA Certificate (PDF)',
    fileUrl: coaUrl,
    storageKey: biz.coaStorageKey || `arch_doc_${cleanUserPhone}_BIZ_COA`,
    isOriginalUpload: Boolean(biz.coaStorageKey || (coaUrl && coaUrl.startsWith('data:'))),
    status: 'PENDING',
    uploadedAt: now,
  });

  // (D) Firm / Company PAN Card
  const bizPanUrl = (biz as any).panFileUrl || biz.panDocUrl || '';
  compiled.push({
    id: 'doc-biz-pan',
    documentType: 'FIRM_PAN',
    title: `Firm / Company PAN Card - ${biz.panNumber || arch.panNumber || 'Attached'}`,
    fileName: biz.panFileName || 'Firm_PAN_Card.jpg',
    fileSize: biz.panFileSize || 'PAN Document (JPEG/PDF)',
    fileUrl: bizPanUrl,
    storageKey: biz.panStorageKey || `arch_doc_${cleanUserPhone}_BIZ_PAN`,
    isOriginalUpload: Boolean(biz.panStorageKey || (bizPanUrl && bizPanUrl.startsWith('data:'))),
    status: 'PENDING',
    uploadedAt: now,
  });

  // (E) GST Registration Certificate
  const gstUrl = (biz as any).gstFileUrl || biz.gstDocUrl || '';
  compiled.push({
    id: 'doc-gst',
    documentType: 'GSTIN_CERTIFICATE',
    title: `GST Registration Certificate - ${biz.gstin || arch.gstin || 'Attached'}`,
    fileName: biz.gstFileName || 'GSTIN_Registration_Certificate.pdf',
    fileSize: biz.gstFileSize || 'GST Certificate (PDF)',
    fileUrl: gstUrl,
    storageKey: biz.gstStorageKey || `arch_doc_${cleanUserPhone}_BIZ_GST`,
    isOriginalUpload: Boolean(biz.gstStorageKey || (gstUrl && gstUrl.startsWith('data:'))),
    status: 'PENDING',
    uploadedAt: now,
  });

  // (F) Business Proof (Certificate of Incorporation / Registration)
  const bizProofUrl = (biz as any).businessProofFileUrl || biz.businessProofDocUrl || '';
  compiled.push({
    id: 'doc-biz-proof',
    documentType: 'FIRM_REGISTRATION',
    title: `Business Proof (${biz.businessProofType || 'Certificate of Incorporation (COI)'}) - ${biz.businessProofNumber || 'Attached'}`,
    fileName: biz.businessProofFileName || 'Business_Registration_Proof.pdf',
    fileSize: biz.businessProofFileSize || 'Statutory Proof (PDF/JPEG)',
    fileUrl: bizProofUrl,
    storageKey: biz.businessProofStorageKey || `arch_doc_${cleanUserPhone}_BIZ_PROOF`,
    isOriginalUpload: Boolean(biz.businessProofStorageKey || (bizProofUrl && bizProofUrl.startsWith('data:'))),
    status: 'PENDING',
    uploadedAt: now,
  });

  // (G) Bank Cancelled Cheque
  const chequeUrl = arch.bankDetails?.cancelledChequeUrl || '';
  compiled.push({
    id: 'doc-cheque',
    documentType: 'CANCELLED_CHEQUE',
    title: `Bank Cancelled Cheque (${arch.bankDetails?.bankName || 'Escrow Account'})`,
    fileName: arch.bankDetails?.cancelledChequeFileName || 'Cancelled_Cheque.jpg',
    fileSize: 'Bank Document (Cheque)',
    fileUrl: chequeUrl,
    storageKey: (arch.bankDetails as any)?.cancelledChequeStorageKey || `arch_cheque_${cleanUserPhone}`,
    isOriginalUpload: Boolean(chequeUrl && chequeUrl.length > 20),
    status: arch.bankDetails?.isChequeAccepted ? 'VERIFIED' : 'PENDING',
    uploadedAt: now,
  });

  // Merge compiled documents with any existing documents so verified statuses & uploads are preserved
  const mergedMap = new Map<string, ArchitectKycDocument>();
  compiled.forEach((cDoc) => mergedMap.set(cDoc.id, cDoc));

  // Also read stored KYC records for this phone to ensure verified documents are never lost
  let storedPhoneDocs: ArchitectKycDocument[] = [];
  if (cleanPhone) {
    try {
      const storedRaw = localStorage.getItem(`arch_kyc_${cleanPhone}`);
      if (storedRaw) {
        const parsed = JSON.parse(storedRaw);
        if (Array.isArray(parsed)) storedPhoneDocs = parsed;
      }
    } catch {}
  }

  const allSourceDocs = [...existingDocs, ...storedPhoneDocs];

  allSourceDocs.forEach((eDoc) => {
    if (!eDoc) return;
    let matchedKey: string | undefined = undefined;
    if (mergedMap.has(eDoc.id)) {
      matchedKey = eDoc.id;
    } else {
      const normEId = (eDoc.id || '').replace(/-dir-/g, '-');
      for (const [key, cDoc] of mergedMap.entries()) {
        const normCKey = key.replace(/-dir-/g, '-');
        if (
          normEId === normCKey ||
          (eDoc.title && cDoc.title && eDoc.title.trim().toLowerCase() === cDoc.title.trim().toLowerCase()) ||
          (eDoc.documentType && cDoc.documentType === eDoc.documentType && !cDoc.documentType.includes('DIRECTOR')) ||
          (eDoc.documentType === 'PAN_CARD' && cDoc.documentType === 'PAN_CARD') ||
          (eDoc.documentType === 'AADHAAR_CARD' && cDoc.documentType === 'AADHAAR_CARD') ||
          (eDoc.documentType === 'COA_CERTIFICATE' && cDoc.documentType === 'COA_CERTIFICATE') ||
          (eDoc.documentType === 'FIRM_PAN' && cDoc.documentType === 'FIRM_PAN') ||
          (eDoc.documentType === 'GSTIN_CERTIFICATE' && cDoc.documentType === 'GSTIN_CERTIFICATE') ||
          (eDoc.documentType === 'FIRM_REGISTRATION' && cDoc.documentType === 'FIRM_REGISTRATION') ||
          (eDoc.documentType === 'CANCELLED_CHEQUE' && cDoc.documentType === 'CANCELLED_CHEQUE')
        ) {
          matchedKey = key;
          break;
        }
      }
    }

    if (matchedKey) {
      const existingInCompiled = mergedMap.get(matchedKey)!;
      const finalStatus =
        eDoc.status === 'VERIFIED' || existingInCompiled.status === 'VERIFIED'
          ? 'VERIFIED'
          : eDoc.status === 'REJECTED' || existingInCompiled.status === 'REJECTED'
          ? 'REJECTED'
          : 'PENDING';

      mergedMap.set(matchedKey, {
        ...existingInCompiled,
        ...eDoc,
        id: matchedKey,
        status: finalStatus as any,
        fileUrl: (eDoc.fileUrl && eDoc.fileUrl.length > 20) ? eDoc.fileUrl : existingInCompiled.fileUrl,
      });
    } else {
      mergedMap.set(eDoc.id, eDoc);
    }
  });

  const finalDocs = Array.from(mergedMap.values());
  const docPhoto = finalDocs.find((d) => d.id === 'doc-photo' || (d as any).documentType === 'PROFILE_PHOTO');
  if (docPhoto && docPhoto.fileUrl && (docPhoto.fileUrl.startsWith('data:') || docPhoto.fileUrl.startsWith('http'))) {
    arch.profilePhoto = docPhoto.fileUrl;
  }
  const chequeDoc = finalDocs.find((d) => d.id === 'doc-cancelled-cheque' || d.id === 'doc-cheque' || (d as any).documentType === 'BANK_CANCELLED_CHEQUE' || (d as any).documentType === 'CANCELLED_CHEQUE');
  if (chequeDoc) {
    if (arch.bankDetails?.isVerified || arch.bankDetails?.isChequeAccepted) {
      chequeDoc.status = 'VERIFIED';
    }
    if (!arch.bankDetails || !arch.bankDetails.cancelledChequeUrl) {
      arch.bankDetails = {
        ...(arch.bankDetails || resolveArchitectBankDetails(arch)),
        cancelledChequeUrl: chequeDoc.fileUrl || arch.bankDetails?.cancelledChequeUrl || '',
        cancelledChequeFileName: chequeDoc.fileName || arch.bankDetails?.cancelledChequeFileName || 'Bank_Cancelled_Cheque.jpg',
        cancelledChequeStorageKey: chequeDoc.storageKey || (arch.bankDetails as any)?.cancelledChequeStorageKey || '',
        isChequeAccepted: chequeDoc.status === 'VERIFIED' || Boolean(arch.bankDetails?.isChequeAccepted),
        isVerified: Boolean(arch.bankDetails?.isVerified),
      };
    }
  }
  arch.documents = finalDocs;
  arch.kycDocuments = finalDocs;
  return arch;
};

export const saveArchitectBankDetails = (
  architectId: string,
  bank: {
    bankName: string;
    accountHolderName: string;
    accountNumber: string;
    ifscCode: string;
    accountType?: 'CURRENT' | 'SAVINGS';
    branch?: string;
    cancelledChequeUrl?: string;
    cancelledChequeFileName?: string;
    isChequeAccepted?: boolean;
    isVerified?: boolean;
  },
  phoneHint?: string
): ArchitectAccount | null => {
  const current = getArchitectAccounts();
  const cleanId = (architectId || '').trim();
  const cleanPhone = (phoneHint || cleanId).replace(/\D/g, '').slice(-10);

  const idx = current.findIndex(
    (a) =>
      a.id === cleanId ||
      a.applicationNumber === cleanId ||
      (cleanPhone && cleanPhone.length === 10 && (a.phone || '').replace(/\D/g, '').slice(-10) === cleanPhone) ||
      (a.name && (a.name.toLowerCase() === cleanId.toLowerCase() || cleanId.toLowerCase().includes(a.name.toLowerCase()))) ||
      (a.firmName && (a.firmName.toLowerCase() === cleanId.toLowerCase() || cleanId.toLowerCase().includes(a.firmName.toLowerCase()))) ||
      (a.coaNumber && cleanId && a.coaNumber.toLowerCase() === cleanId.toLowerCase())
  );
  if (idx === -1) return null;

  const arch = ensureArchitectStatutoryDocuments(current[idx]);
  arch.bankDetails = {
    ...(arch.bankDetails || {}),
    bankName: bank.bankName || arch.bankDetails?.bankName || '',
    accountHolderName: bank.accountHolderName || arch.bankDetails?.accountHolderName || arch.name || '',
    accountNumber: bank.accountNumber || arch.bankDetails?.accountNumber || '',
    ifscCode: (bank.ifscCode || arch.bankDetails?.ifscCode || '').toUpperCase(),
    accountType: bank.accountType || arch.bankDetails?.accountType || 'CURRENT',
    branch: bank.branch || arch.bankDetails?.branch || '',
    cancelledChequeUrl: bank.cancelledChequeUrl || arch.bankDetails?.cancelledChequeUrl || '',
    cancelledChequeFileName: bank.cancelledChequeFileName || arch.bankDetails?.cancelledChequeFileName || '',
    isChequeAccepted: Boolean(bank.isChequeAccepted),
    isVerified: Boolean(bank.isVerified),
  };

  // Only mark cheque document as VERIFIED if bank is explicitly verified
  if (arch.documents && bank.isVerified) {
    arch.documents = arch.documents.map((d) =>
      d.id === 'doc-cancelled-cheque' || d.id === 'doc-cheque' || (d as any).documentType === 'CANCELLED_CHEQUE'
        ? { ...d, status: 'VERIFIED' as const }
        : d
    );
  }

  arch.updatedAt = new Date().toISOString();
  current[idx] = arch;
  safePersistArchitects(current);

  const archPhone = (arch.phone || '').replace(/\D/g, '').slice(-10);
  if (archPhone) {
    try {
      localStorage.setItem(`arch_bank_${archPhone}`, JSON.stringify(arch.bankDetails));
      localStorage.setItem(`arch_kyc_${archPhone}`, JSON.stringify(arch.documents));
    } catch (e) {}
  }

  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('architect_store_updated', { detail: arch }));
    }
    pushToCloud().catch(() => {});
  } catch (e) {}

  return arch;
};

export const getArchitectAccounts = (): ArchitectAccount[] => {
  try {
    const rawV2 = localStorage.getItem(ARCH_STORAGE_KEY);
    const rawLegacy = localStorage.getItem('gd_architect_accounts');
    const listV2 = rawV2 ? JSON.parse(rawV2) : [];
    const listLegacy = rawLegacy ? JSON.parse(rawLegacy) : [];
    
    const combined: any[] = [
      ...(Array.isArray(listV2) ? listV2 : []),
      ...(Array.isArray(listLegacy) ? listLegacy : []),
    ];

    // Bridge any architect registered in platform_professionals
    try {
      const pros = JSON.parse(localStorage.getItem('platform_professionals') || '[]');
      for (const p of pros) {
        if (p?.category === 'ARCHITECT' && p.phone) {
          const cleanPh = (p.phone || '').replace(/\D/g, '').slice(-10);
          if (cleanPh && !combined.some((a) => (a?.phone || '').replace(/\D/g, '').slice(-10) === cleanPh)) {
            const photoStored = localStorage.getItem(`arch_photo_${cleanPh}`);
            combined.push({
              id: p.id || `arch-${cleanPh}`,
              userId: p.userId || p.id,
              name: p.name || '',
              phone: cleanPh,
              email: p.email || '',
              profilePhoto: p.profilePhoto || p.avatar || photoStored || '',
              designation: 'Principal Architect',
              experienceYears: Number(p.experienceYears) || 0,
              bio: p.bio || '',
              firmName: p.firmName || '',
              businessType: 'Architecture Firm',
              establishmentYear: new Date().getFullYear(),
              teamSize: 1,
              architectsCount: 1,
              panNumber: p.panNumber || '',
              coaNumber: p.registrationNumber || '',
              address: p.city || '',
              city: p.city || '',
              state: p.state || '',
              pincode: '',
              serviceCities: p.serviceCities || [],
              services: p.services || [],
              portfolioProjects: [],
              documents: [],
              accountStatus: p.verificationStatus === 'APPROVED' ? 'APPROVED' : 'PENDING_APPROVAL',
              isVerified: p.isVerified || false,
              registeredAt: p.createdAt || new Date().toISOString(),
              updatedAt: p.updatedAt || new Date().toISOString(),
            });
          }
        }
      }
    } catch (e) {}

    // Robust multi-attribute deduplication:
    // Two entries represent the same architect if they share:
    // 1. Clean 10-digit phone
    // 2. Normalized human name (e.g. "Garima Jain buildcon" vs "Garima Jain" or "ramakant" vs "ramakant")
    // 3. Name vs Firm cross-match
    // 4. Substring / contains name match
    // 5. Same ID or Application Number (e.g. "BG/APP/000001" or "BG/Architech/000001")
    // 6. Same COA registration number
    // 7. Same email address
    const deduplicated: ArchitectAccount[] = [];

    const isApprovedId = (str?: string) =>
      Boolean(str && (str.startsWith('BG/Architech/') || str.startsWith('BG/Architect/')));

    const normalizePersonName = (str?: string) =>
      (str || '')
        .toLowerCase()
        .replace(/\b(buildcon|architects|associates|construction|designs|studio|designers|builder|builders|pvt|ltd)\b/gi, '')
        .replace(/[^a-z0-9]/g, ' ')
        .trim()
        .replace(/\s+/g, ' ');

    const cleanPersonAndFirm = (rawName?: string, rawFirm?: string) => {
      const name = (rawName || '').trim();
      const firm = (rawFirm || '').trim();
      return { name, firmName: firm };
    };

    for (const a of combined) {
      if (!a || typeof a !== 'object') continue;
      if (a.id === 'arch-101' || a.id === 'arch-102' || a.id === 'arch-103' || a.id === 'arch-104') continue;

      const rawAId = (a.id || a.applicationNumber || '').trim();

      // If an architect has no explicit admin reviewer, they are strictly PENDING_APPROVAL and unverified
      if (!a.adminReviewedBy) {
        a.accountStatus = 'PENDING_APPROVAL';
        a.isVerified = false;
      }

      const phone = (a.phone || '').replace(/\D/g, '').slice(-10);
      if (phone && !a.profilePhoto) {
        try {
          const photoStored =
            localStorage.getItem(`arch_photo_${phone}`) ||
            localStorage.getItem(`arch_photo_+91${phone}`) ||
            localStorage.getItem(`profile_photo_${phone}`) ||
            localStorage.getItem(`user_photo_${phone}`);
          if (photoStored) a.profilePhoto = photoStored;
        } catch {}
      }
      if (phone && BLACKLISTED_DUMMY_PHONES.includes(phone)) continue;

      const coa = (a.coaNumber || '').toLowerCase().trim();
      if (coa && BLACKLISTED_DUMMY_COAS.includes(coa)) continue;

      const aEmail = (a.email || '').trim().toLowerCase();

      // Deduplication: Only match if exact same 10-digit phone, exact same ID, or exact same COA registration number
      const existingIdx = deduplicated.findIndex((existing) => {
        const exPhone = (existing.phone || '').replace(/\D/g, '').slice(-10);
        const exCoa = (existing.coaNumber || '').trim().toLowerCase();
        const exEmail = (existing.email || '').trim().toLowerCase();
        const exId = (existing.id || existing.applicationNumber || '').trim();

        // If both have 10-digit phones and they are DIFFERENT, they are distinct architects!
        if (phone.length === 10 && exPhone.length === 10 && phone !== exPhone) {
          return false;
        }

        // 1. Same 10-digit phone number
        if (phone.length === 10 && exPhone.length === 10 && phone === exPhone) return true;

        // 2. Exact same ID (only if genuine standard BG/Architech format)
        if (rawAId && exId && rawAId === exId && rawAId.startsWith('BG/Architech/')) return true;

        // 3. Exact same COA License Number
        if (coa && exCoa && coa.length >= 6 && coa === exCoa) return true;

        // 4. Exact same Email (if provided and valid)
        if (aEmail && exEmail && aEmail.includes('@') && aEmail === exEmail) return true;

        return false;
      });

      const { name: cleanedName, firmName: cleanedFirm } = cleanPersonAndFirm(a.name, a.firmName);
      const cleanA = { ...a, name: cleanedName, firmName: cleanedFirm };

      if (existingIdx === -1) {
        deduplicated.push(cleanA);
      } else {
        const existing = deduplicated[existingIdx];
        // An architect is approved ONLY if admin explicitly verified and approved them
        const isApproved = Boolean(
          (cleanA.accountStatus === 'APPROVED' && cleanA.adminReviewedBy) ||
          (existing.accountStatus === 'APPROVED' && existing.adminReviewedBy)
        );

        const finalStatus = isApproved ? 'APPROVED' : (cleanA.accountStatus === 'APPROVED' && !cleanA.adminReviewedBy ? 'PENDING_APPROVAL' : cleanA.accountStatus || existing.accountStatus || 'PENDING_APPROVAL');
        const finalReviewedBy = isApproved ? (cleanA.adminReviewedBy || existing.adminReviewedBy || 'Super Admin Review Desk') : undefined;

        const { name: finalMergedName, firmName: finalMergedFirm } = cleanPersonAndFirm(
          cleanA.name || existing.name,
          cleanA.firmName || existing.firmName
        );

        // Merge documents properly so that verified statuses are preserved
        const docMap = new Map<string, ArchitectKycDocument>();
        (existing.documents || []).forEach((d) => docMap.set(d.id, d));
        (cleanA.documents || []).forEach((d) => {
          if (docMap.has(d.id)) {
            const ex = docMap.get(d.id)!;
            const keepVerified = ex.status === 'VERIFIED' || d.status === 'VERIFIED';
            const keepRejected = !keepVerified && (ex.status === 'REJECTED' || d.status === 'REJECTED');
            docMap.set(d.id, {
              ...ex,
              ...d,
              status: keepVerified ? 'VERIFIED' : keepRejected ? 'REJECTED' : (d.status || ex.status || 'PENDING'),
              fileUrl: (d.fileUrl && d.fileUrl.length > 20) ? d.fileUrl : ex.fileUrl,
            });
          } else {
            docMap.set(d.id, d);
          }
        });
        const mergedDocs = Array.from(docMap.values());

        const mergedServices = (cleanA.services && cleanA.services.length > 0)
          ? cleanA.services
          : (existing.services && existing.services.length > 0)
          ? existing.services
          : [];

        const mergedPortfolio = (cleanA.portfolioProjects && cleanA.portfolioProjects.length > 0)
          ? cleanA.portfolioProjects
          : (existing.portfolioProjects && existing.portfolioProjects.length > 0)
          ? existing.portfolioProjects
          : [];

        const mergedBank = (cleanA.bankDetails?.accountNumber || cleanA.bankDetails?.bankName)
          ? cleanA.bankDetails
          : (existing.bankDetails || cleanA.bankDetails);

        const assignedOfficialId = formatArchitectId(existing.id || cleanA.id || existing.applicationNumber || cleanA.applicationNumber, existingIdx + 1);

        const merged: ArchitectAccount = {
          ...existing,
          ...cleanA,
          id: assignedOfficialId,
          applicationNumber: assignedOfficialId,
          accountStatus: finalStatus,
          isVerified: isApproved,
          adminReviewedBy: finalReviewedBy,
          name: finalMergedName,
          phone: (phone.length === 10 ? phone : (existing.phone || '').replace(/\D/g, '').slice(-10)) || cleanA.phone || existing.phone,
          email: cleanA.email || existing.email || '',
          firmName: finalMergedFirm,
          coaNumber: cleanA.coaNumber || existing.coaNumber || '',
          city: cleanA.city || existing.city || '',
          state: cleanA.state || existing.state || '',
          experienceYears: Math.max(Number(existing.experienceYears) || 0, Number(cleanA.experienceYears) || 0),
          profilePhoto: cleanA.profilePhoto || existing.profilePhoto || '',
          services: mergedServices,
          portfolioProjects: mergedPortfolio,
          documents: mergedDocs,
          kycDocuments: mergedDocs,
          bankDetails: mergedBank,
          adminReview: cleanA.adminReview || existing.adminReview,
          specialDiscount: cleanA.specialDiscount || existing.specialDiscount,
          internalNotes: [...(existing.internalNotes || []), ...(cleanA.internalNotes || [])].filter(
            (n, idx, arr) => arr.findIndex((x) => x.id === n.id) === idx
          ),
          customerShares: [...(existing.customerShares || []), ...(cleanA.customerShares || [])].filter(
            (s, idx, arr) => arr.findIndex((x) => x.id === s.id) === idx
          ),
          registeredAt: existing.registeredAt || cleanA.registeredAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        deduplicated[existingIdx] = merged;
      }
    }

    const filtered = deduplicated;
    filtered.sort((a, b) => {
      const timeA = new Date(a.registeredAt || a.updatedAt || 0).getTime();
      const timeB = new Date(b.registeredAt || b.updatedAt || 0).getTime();
      return timeB - timeA;
    });

    const finalized = filtered.map((arch, idx) => {
      const rawId = arch.id ? String(arch.id).replace(/[\[\]]/g, '').trim() : '';
      const assignedId = rawId && /^BG\/(?:Architech|Aritech|Architect)\/\d{6}$/i.test(rawId)
        ? formatArchitectId(rawId, idx + 1)
        : formatArchitectId(rawId || arch.applicationNumber, idx + 1);
      arch.id = assignedId;
      arch.applicationNumber = assignedId;
      return ensureArchitectStatutoryDocuments(arch, idx + 1);
    });

    return finalized;
  } catch (e) {}
  return [];
};

export const getArchitectById = (id: string): ArchitectAccount | null => {
  const list = getArchitectAccounts();
  const found = list.find((a) => a.id === id) || null;
  if (found && !found.profilePhoto && found.phone) {
    const clean = (found.phone || '').replace(/\D/g, '').slice(-10);
    if (clean) {
      try {
        const stored =
          localStorage.getItem(`arch_photo_${clean}`) ||
          localStorage.getItem(`arch_photo_+91${clean}`) ||
          localStorage.getItem(`profile_photo_${clean}`) ||
          localStorage.getItem(`user_photo_${clean}`);
        if (stored && isRealUserPhoto(stored)) found.profilePhoto = stored;
        else if (stored && !isRealUserPhoto(stored)) {
          localStorage.removeItem(`arch_photo_${clean}`);
          localStorage.removeItem(`arch_photo_+91${clean}`);
          localStorage.removeItem(`profile_photo_${clean}`);
          localStorage.removeItem(`user_photo_${clean}`);
        }
      } catch {}
    }
  }
  return found;
};

export const getArchitectByPhone = (phone: string): ArchitectAccount | null => {
  const clean = (phone || '').replace(/\D/g, '').slice(-10);
  if (!clean) return null;
  const list = getArchitectAccounts();
  const found = list.find((a) => (a.phone || '').replace(/\D/g, '').slice(-10) === clean);
  if (found) {
    if (!found.profilePhoto) {
      try {
        const stored =
          localStorage.getItem(`arch_photo_${clean}`) ||
          localStorage.getItem(`arch_photo_+91${clean}`) ||
          localStorage.getItem(`profile_photo_${clean}`) ||
          localStorage.getItem(`user_photo_${clean}`);
        if (stored && isRealUserPhoto(stored)) found.profilePhoto = stored;
        else if (stored && !isRealUserPhoto(stored)) {
          localStorage.removeItem(`arch_photo_${clean}`);
          localStorage.removeItem(`arch_photo_+91${clean}`);
          localStorage.removeItem(`profile_photo_${clean}`);
          localStorage.removeItem(`user_photo_${clean}`);
        }
      } catch {}
    }
    if (!found.firmName) {
      try {
        const storedFirm =
          localStorage.getItem(`registered_arch_firm_${clean}`) ||
          localStorage.getItem(`arch_firm_${clean}`) ||
          localStorage.getItem('registered_arch_firm');
        if (storedFirm) found.firmName = storedFirm;
      } catch {}
    }
    return found;
  }

  try {
    const pros = JSON.parse(localStorage.getItem('gd_professional_accounts') || '[]');
    const pro = pros.find((p: any) => (p.phone || '').replace(/\D/g, '').slice(-10) === clean);
    if (pro && pro.name) {
      const stored = (() => {
        try {
          return localStorage.getItem(`arch_photo_${clean}`);
        } catch {
          return null;
        }
      })();
      return {
        id: pro.id,
        userId: pro.userId || pro.id,
        name: pro.name,
        phone: clean,
        email: pro.email || '',
        profilePhoto: pro.profilePhoto || pro.avatar || stored || '',
        designation: pro.category || 'Architect',
        experienceYears: pro.experienceYears || 0,
        bio: pro.bio || '',
        firmName: pro.firmName || localStorage.getItem(`registered_arch_firm_${clean}`) || localStorage.getItem('registered_arch_firm') || '',
        businessType: 'Architecture Firm',
        establishmentYear: new Date().getFullYear(),
        teamSize: 1,
        architectsCount: 1,
        panNumber: pro.panNumber || '',
        coaNumber: pro.registrationNumber || '',
        address: pro.city || '',
        city: pro.city || '',
        state: pro.state || '',
        pincode: '',
        serviceCities: pro.serviceCities || [],
        services: pro.services || [],
        portfolioProjects: [],
        documents: [],
        kycDocuments: [],
        bankDetails: {
          accountHolderName: pro.name,
          accountNumber: '',
          ifscCode: '',
          bankName: '',
          branch: '',
        },
        accountStatus: 'PROFILE_INCOMPLETE',
      };
    }
  } catch (e) {}

  try {
    const pros = JSON.parse(localStorage.getItem('platform_professionals') || '[]');
    const pro = pros.find((p: any) => (p.phone || '').replace(/\D/g, '').slice(-10) === clean);
    if (pro) {
      const storedFirm = localStorage.getItem(`registered_arch_firm_${clean}`) || localStorage.getItem('registered_arch_firm') || pro.firmName || '';
      const storedName = localStorage.getItem(`registered_arch_name_${clean}`) || pro.name || '';
      return {
        id: pro.id || `BG/Architech/${clean}`,
        applicationNumber: pro.id || `BG/Architech/${clean}`,
        userId: pro.userId || `usr-arch-${clean}`,
        name: storedName,
        phone: clean,
        email: pro.email || '',
        profilePhoto: pro.profilePhoto || pro.avatar || (localStorage.getItem(`arch_photo_${clean}`) || ''),
        designation: 'Principal Architect',
        experienceYears: Number(pro.experienceYears) || 0,
        bio: '',
        firmName: storedFirm,
        businessType: 'Individual',
        establishmentYear: new Date().getFullYear(),
        teamSize: 1,
        architectsCount: 1,
        panNumber: pro.panNumber || '',
        coaNumber: pro.registrationNumber || '',
        address: pro.city || '',
        district: pro.district || '',
        city: pro.city || '',
        state: pro.state || '',
        pincode: '',
        serviceCities: pro.serviceCities || [],
        services: pro.services || [],
        portfolioProjects: [],
        documents: [],
        kycDocuments: [],
        accountStatus: 'PENDING_APPROVAL',
        isVerified: false,
        registeredAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
  } catch (e) {}

  try {
    const storedFirm = localStorage.getItem(`registered_arch_firm_${clean}`) || localStorage.getItem(`arch_firm_${clean}`) || localStorage.getItem('registered_arch_firm');
    const storedName = localStorage.getItem(`registered_arch_name_${clean}`) || localStorage.getItem(`arch_name_${clean}`);
    if (storedFirm || storedName) {
      return {
        id: `BG/Architech/${clean}`,
        applicationNumber: `BG/Architech/${clean}`,
        userId: `usr-arch-${clean}`,
        name: storedName || '',
        phone: clean,
        email: '',
        profilePhoto: localStorage.getItem(`arch_photo_${clean}`) || '',
        designation: 'Principal Architect',
        experienceYears: 0,
        bio: '',
        firmName: storedFirm || '',
        businessType: 'Individual',
        establishmentYear: new Date().getFullYear(),
        teamSize: 1,
        architectsCount: 1,
        panNumber: '',
        coaNumber: '',
        address: '',
        district: '',
        city: '',
        state: '',
        pincode: '',
        serviceCities: [],
        services: [],
        portfolioProjects: [],
        documents: [],
        kycDocuments: [],
        accountStatus: 'PENDING_APPROVAL',
        isVerified: false,
        registeredAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
  } catch (e) {}

  return null;
};


export const generateArchitectId = (prefix: string = ARCHITECT_ID_PREFIX): string => {
  let count = 1;
  try {
    const current = getArchitectAccounts();
    let maxSeq = 0;
    for (const a of current) {
      const match = (a.id || a.applicationNumber || '').match(/BG\/(?:Architech|Aritech|Architect|QUO|ARC)\/(\d+)/i);
      if (match) {
        const seq = parseInt(match[1], 10);
        if (seq > maxSeq && seq < 999999) maxSeq = seq;
      }
    }
    count = Math.max(current.length + 1, maxSeq + 1);
  } catch (e) {}
  return `${prefix}/${String(count).padStart(6, '0')}`;
};

export const generateArchitectApplicationNumber = (): string => {
  return generateArchitectId(ARCHITECT_ID_PREFIX);
};

export const saveArchitectAccount = (acc: Partial<ArchitectAccount>): ArchitectAccount => {
  const current = getArchitectAccounts();
  const cleanPhone = (acc.phone || '').replace(/\D/g, '').slice(-10);
  const cleanCoa = (acc.coaNumber || '').trim().toLowerCase();
  const cleanEmail = (acc.email || '').trim().toLowerCase();

  const existingIdx = current.findIndex((a) => {
    const aPhone = (a.phone || '').replace(/\D/g, '').slice(-10);
    const aCoa = (a.coaNumber || '').trim().toLowerCase();
    const aEmail = (a.email || '').trim().toLowerCase();

    // If both have 10-digit phones and they are different, never match
    if (cleanPhone.length === 10 && aPhone.length === 10 && cleanPhone !== aPhone) {
      return false;
    }

    // 1. Phone match
    if (cleanPhone.length === 10 && aPhone.length === 10 && cleanPhone === aPhone) {
      return true;
    }

    // 2. COA License match
    if (cleanCoa && cleanCoa.length >= 6 && aCoa === cleanCoa) {
      return true;
    }

    // 3. Email match
    if (cleanEmail && cleanEmail.includes('@') && aEmail === cleanEmail) {
      return true;
    }

    // 4. Exact standard ID match
    if (acc.id && a.id && acc.id === a.id && acc.id.startsWith('BG/Architech/')) {
      return true;
    }

    return false;
  });

  let updated: ArchitectAccount;
  const now = new Date().toISOString();
  // If explicitly submitting PENDING_APPROVAL, ensure it is unverified pending review
  const isApproved = acc.accountStatus === 'PENDING_APPROVAL'
    ? false
    : (acc.accountStatus === 'APPROVED' && Boolean(acc.isVerified));

  if (existingIdx >= 0) {
    const prev = current[existingIdx];
    const prevIsApproved = prev.accountStatus === 'APPROVED' && Boolean(prev.isVerified);
    const finalIsApproved = isApproved || (prevIsApproved && acc.accountStatus !== 'PENDING_APPROVAL');

    const finalId = formatArchitectId(acc.id || prev.id || acc.applicationNumber || prev.applicationNumber, existingIdx + 1);

    updated = {
      ...prev,
      ...acc,
      profilePhoto: acc.profilePhoto || prev.profilePhoto || (cleanPhone ? localStorage.getItem(`arch_photo_${cleanPhone}`) : '') || '',
      id: finalId,
      applicationNumber: finalId,
      accountStatus: finalIsApproved ? 'APPROVED' : (acc.accountStatus || prev.accountStatus || 'PENDING_APPROVAL'),
      isVerified: Boolean(finalIsApproved),
      updatedAt: now,
    };
    ensureArchitectStatutoryDocuments(updated, existingIdx + 1);
    current.splice(existingIdx, 1);
    current.unshift(updated);
  } else {
    let maxSeq = 0;
    for (const a of current) {
      const match = (a.id || a.applicationNumber || '').match(/BG\/(?:Architech|Aritech|Architect|QUO|ARC)\/(\d+)/i);
      if (match) {
        const seq = parseInt(match[1], 10);
        if (seq > maxSeq && seq < 999999) maxSeq = seq;
      }
    }
    const assignedSeq = Math.max(current.length + 1, maxSeq + 1);
    const finalId = formatArchitectId(acc.id || acc.applicationNumber, assignedSeq);

    updated = {
      id: finalId,
      applicationNumber: finalId,
      userId: acc.userId || `usr-arch-${cleanPhone || Date.now()}`,
      name: acc.name?.trim() || '',
      phone: cleanPhone || acc.phone || '',
      email: acc.email?.trim() || '',
      profilePhoto: acc.profilePhoto || (cleanPhone ? localStorage.getItem(`arch_photo_${cleanPhone}`) : '') || '',
      designation: acc.designation?.trim() || '',
      experienceYears: Number(acc.experienceYears) || 0,
      bio: acc.bio?.trim() || '',
      firmName: acc.firmName?.trim() || '',
      businessType: acc.businessType || 'Architecture Firm',
      establishmentYear: acc.establishmentYear || new Date().getFullYear(),
      teamSize: acc.teamSize || 1,
      architectsCount: acc.architectsCount || 1,
      website: acc.website || '',
      gstin: acc.gstin || '',
      panNumber: acc.panNumber || '',
      firmRegistrationNumber: acc.firmRegistrationNumber || '',
      coaNumber: acc.coaNumber || '',
      address: acc.address || '',
      district: acc.district || '',
      city: acc.city || '',
      state: acc.state || '',
      nearbyStates: acc.nearbyStates || [],
      pincode: acc.pincode || '',
      serviceCities: acc.serviceCities || [],
      services: acc.services || [],
      portfolioProjects: acc.portfolioProjects || [],
      documents: acc.documents || (acc as any).kycDocuments || [],
      kycDocuments: (acc as any).kycDocuments || acc.documents || [],
      directorsKyc: acc.directorsKyc || (acc as any).directors || [],
      businessVerification: acc.businessVerification,
      bankDetails: acc.bankDetails || {
        accountHolderName: acc.name || '',
        accountNumber: '',
        ifscCode: '',
        bankName: '',
        branch: '',
        accountType: 'CURRENT',
        cancelledChequeUrl: '',
        cancelledChequeFileName: '',
        isChequeAccepted: false,
        isVerified: false,
      },
      adminReview: acc.adminReview,
      internalNotes: acc.internalNotes || [],
      specialDiscount: acc.specialDiscount,
      customerShares: acc.customerShares || [],
      accountStatus: isApproved ? 'APPROVED' : (acc.accountStatus || 'PENDING_APPROVAL'),
      isVerified: Boolean(isApproved),
      registeredAt: acc.registeredAt || now,
      updatedAt: now,
    };
    ensureArchitectStatutoryDocuments(updated, assignedSeq);
    current.unshift(updated);
  }

  if (updated.profilePhoto && cleanPhone) {
    try {
      localStorage.setItem(`arch_photo_${cleanPhone}`, updated.profilePhoto);
    } catch {}
  }

  safePersistArchitects(current);
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('architect_store_updated', { detail: updated }));
    }
    pushToCloud().catch(() => {});
  } catch (e) {}
  return updated;
};

export const updateArchitectStatus = (
  id: string,
  newStatus: ArchitectAccountStatus,
  remarks?: string,
  reviewerName?: string
): ArchitectAccount | null => {
  const current = getArchitectAccounts();
  const cleanTargetId = (id || '').trim();
  const cleanTargetPhone = cleanTargetId.replace(/\D/g, '').slice(-10);

  const idx = current.findIndex(
    (a) =>
      a.id === cleanTargetId ||
      a.applicationNumber === cleanTargetId ||
      (cleanTargetPhone.length === 10 && (a.phone || '').replace(/\D/g, '').slice(-10) === cleanTargetPhone)
  );
  if (idx === -1) return null;

  const now = new Date().toISOString();
  const assignedId = formatArchitectId(current[idx].id || current[idx].applicationNumber, idx + 1);

  const cleanPhone = (current[idx].phone || '').replace(/\D/g, '').slice(-10);
  const existingStoredPhoto = cleanPhone ? (() => {
    try {
      return localStorage.getItem(`arch_photo_${cleanPhone}`);
    } catch {
      return null;
    }
  })() : null;

  const resolvedPhoto = current[idx].profilePhoto || existingStoredPhoto || '';

  current[idx] = {
    ...current[idx],
    id: assignedId,
    applicationNumber: assignedId,
    profilePhoto: resolvedPhoto,
    accountStatus: newStatus,
    isVerified: newStatus === 'APPROVED',
    adminReviewRemarks: remarks ?? current[idx].adminReviewRemarks,
    adminReviewedBy: reviewerName || 'Super Admin Review Desk',
    adminReviewedAt: now,
    updatedAt: now,
  };

  if (resolvedPhoto && cleanPhone) {
    try {
      localStorage.setItem(`arch_photo_${cleanPhone}`, resolvedPhoto);
    } catch {}
  }

  safePersistArchitects(current);
  try {
    localStorage.setItem('gd_architect_accounts', JSON.stringify(current));
  } catch {}

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
      window.dispatchEvent(new CustomEvent('architect_store_updated', { detail: current[idx] }));
    }
    pushToCloud().catch(() => {});
  } catch (e) {}
  return current[idx];
};

export const getRegisteredArchitects = getArchitectAccounts;

export const deleteArchitectAccount = (id: string): boolean => {
  try {
    const raw = localStorage.getItem(ARCH_STORAGE_KEY) || localStorage.getItem('gd_architect_accounts');
    if (!raw) return true;
    const current = JSON.parse(raw);
    if (!Array.isArray(current)) return true;
    const updated = current.filter((a: any) => a.id !== id);
    localStorage.setItem(ARCH_STORAGE_KEY, JSON.stringify(updated));
    localStorage.setItem('gd_architect_accounts', JSON.stringify(updated));

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new Event('architect_store_updated'));
      window.dispatchEvent(new Event('admin_global_refresh'));
    }
    pushToCloud().catch(() => {});
    return true;
  } catch {
    return false;
  }
};

export const clearAllArchitects = (): void => {
  try {
    localStorage.setItem(ARCH_STORAGE_KEY, '[]');
    localStorage.setItem('gd_architect_accounts', '[]');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new Event('architect_store_updated'));
      window.dispatchEvent(new Event('admin_global_refresh'));
    }
    pushToCloud().catch(() => {});
  } catch {}
};


export const addArchitectNote = (
  archId: string,
  text: string,
  author: string = 'Super Admin Desk',
  priority: 'NORMAL' | 'HIGH' | 'URGENT' = 'NORMAL'
): ArchitectAccount | null => {
  const current = getArchitectAccounts();
  const idx = current.findIndex((a) => a.id === archId);
  if (idx === -1) return null;

  const newNote = {
    id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    text: text.trim(),
    author,
    createdAt: new Date().toISOString(),
    priority,
  };

  const updatedNotes = [newNote, ...(current[idx].internalNotes || [])];
  return saveArchitectAccount({
    ...current[idx],
    internalNotes: updatedNotes,
  });
};

export const deleteArchitectNote = (
  archId: string,
  noteId: string
): ArchitectAccount | null => {
  const current = getArchitectAccounts();
  const idx = current.findIndex((a) => a.id === archId);
  if (idx === -1) return null;

  const updatedNotes = (current[idx].internalNotes || []).filter((n) => n.id !== noteId);
  return saveArchitectAccount({
    ...current[idx],
    internalNotes: updatedNotes,
  });
};

export const saveArchitectReview = (
  archId: string,
  review: NonNullable<ArchitectAccount['adminReview']>
): ArchitectAccount | null => {
  const current = getArchitectAccounts();
  const idx = current.findIndex((a) => a.id === archId);
  if (idx === -1) return null;

  return saveArchitectAccount({
    ...current[idx],
    adminReview: review,
  });
};

export const saveArchitectDiscount = (
  archId: string,
  discount: NonNullable<ArchitectAccount['specialDiscount']>
): ArchitectAccount | null => {
  const current = getArchitectAccounts();
  const idx = current.findIndex((a) => a.id === archId);
  if (idx === -1) return null;

  return saveArchitectAccount({
    ...current[idx],
    specialDiscount: discount,
  });
};

export const shareArchitectWithCustomer = (
  archId: string,
  share: {
    customerId: string;
    customerName: string;
    customerPhone: string;
    note: string;
    discountCode?: string;
    discountApplied?: string;
    channel: 'WHATSAPP' | 'SMS' | 'PORTAL' | 'ALL';
  }
): { success: boolean; shareRecord: any; whatsappUrl: string } => {
  const current = getArchitectAccounts();
  const arch = current.find((a) => a.id === archId);
  if (!arch) {
    throw new Error('Architect not found');
  }

  const shareRecord = {
    id: `share-${Date.now()}`,
    customerId: share.customerId,
    customerName: share.customerName,
    customerPhone: share.customerPhone,
    discountCode: share.discountCode,
    discountApplied: share.discountApplied,
    note: share.note,
    sentAt: new Date().toISOString(),
    channel: share.channel,
  };

  const updatedShares = [shareRecord, ...(arch.customerShares || [])];
  saveArchitectAccount({
    ...arch,
    customerShares: updatedShares,
  });

  try {
    const recKey = 'platform_customer_recommendations';
    const recs = JSON.parse(localStorage.getItem(recKey) || '[]');
    const newRec = {
      id: `rec-${Date.now()}`,
      customerId: share.customerId,
      customerName: share.customerName,
      customerPhone: share.customerPhone,
      architectId: arch.id,
      architectName: arch.name,
      firmName: arch.firmName,
      phone: arch.phone,
      coaNumber: arch.coaNumber,
      city: arch.city,
      services: arch.services,
      discountCode: share.discountCode,
      discountApplied: share.discountApplied,
      note: share.note,
      sentAt: shareRecord.sentAt,
      isViewed: false,
    };
    localStorage.setItem(recKey, JSON.stringify([newRec, ...recs]));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('customer_recommendation_received', { detail: newRec }));
    }
  } catch (e) {}

  const cleanPhone = (share.customerPhone || '').replace(/\D/g, '').slice(-10);
  const waMsg = `🏛️ *BuildGhar Professional Architect Recommendation*

Hello *${share.customerName}*,
Our Central Architecture & Engineering Governance Desk recommends licensed Architect *${arch.name}* (${arch.firmName}, COA Lic: *${arch.coaNumber || 'Verified'}*) for your architectural planning & design in *${arch.city}*.

${share.discountApplied ? `🎁 *Special Platform Voucher:* Use code *${share.discountCode}* for *${share.discountApplied}* off on your project drawings!\n` : ''}
📝 *Governance Desk Note:*
"${share.note}"

View Verified Profile & Drawings on BuildGhar:
👉 https://ghar-design.vercel.app/professionals`;

  const whatsappUrl = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(waMsg)}`;

  return {
    success: true,
    shareRecord,
    whatsappUrl,
  };
};


export const updateArchitectDocumentStatus = (
  architectId: string,
  docId: string,
  newStatus: 'VERIFIED' | 'REJECTED' | 'PENDING',
  remarks?: string,
  phoneHint?: string,
  docTitle?: string
): ArchitectAccount | null => {
  const current = getArchitectAccounts();
  const cleanArchPhone = (phoneHint || architectId || '').replace(/\D/g, '').slice(-10);
  const cleanId = (architectId || '').trim();

  const idx = current.findIndex(
    (a) =>
      a.id === cleanId ||
      a.applicationNumber === cleanId ||
      (cleanArchPhone && cleanArchPhone.length === 10 && (a.phone || '').replace(/\D/g, '').slice(-10) === cleanArchPhone) ||
      (a.name && (a.name.toLowerCase() === cleanId.toLowerCase() || cleanId.toLowerCase().includes(a.name.toLowerCase()))) ||
      (a.firmName && (a.firmName.toLowerCase() === cleanId.toLowerCase() || cleanId.toLowerCase().includes(a.firmName.toLowerCase()))) ||
      (a.coaNumber && cleanId && a.coaNumber.toLowerCase() === cleanId.toLowerCase())
  );
  if (idx === -1) return null;

  const arch = ensureArchitectStatutoryDocuments(current[idx]);
  const docs = arch.documents || [];
  const normDocId = (docId || '').replace(/-dir-/g, '-');

  const docIdx = docs.findIndex(
    (d) =>
      d.id === docId ||
      (docId && d.id && d.id.replace(/-dir-/g, '-') === normDocId) ||
      (docTitle && d.title === docTitle) ||
      (docTitle && d.title && d.title.trim().toLowerCase() === docTitle.trim().toLowerCase()) ||
      (docId === 'doc-cheque-review' && (d.id === 'doc-cheque' || d.id === 'doc-cancelled-cheque')) ||
      (docId === 'doc-cancelled-cheque' && d.id === 'doc-cheque') ||
      (docId === 'doc-cheque' && d.id === 'doc-cancelled-cheque')
  );

  if (docIdx !== -1) {
    docs[docIdx] = {
      ...docs[docIdx],
      status: newStatus,
      rejectionReason: newStatus === 'REJECTED' ? (remarks || 'Cancelled by Admin') : undefined,
    };
  } else {
    const fuzzyIdx = docs.findIndex(
      (d) =>
        (d.title && docId && d.title.toLowerCase().includes(docId.toLowerCase())) ||
        (docId && d.id && docId.toLowerCase().includes(d.id.toLowerCase()))
    );
    if (fuzzyIdx !== -1) {
      docs[fuzzyIdx] = {
        ...docs[fuzzyIdx],
        status: newStatus,
        rejectionReason: newStatus === 'REJECTED' ? (remarks || 'Cancelled by Admin') : undefined,
      };
    }
  }

  const isCheque =
    docId === 'doc-cheque' ||
    docId === 'doc-cheque-review' ||
    docId === 'doc-cancelled-cheque' ||
    (docIdx !== -1 && (docs[docIdx].documentType === 'CANCELLED_CHEQUE' || docs[docIdx].id === 'doc-cheque'));

  if (isCheque) {
    if (arch.bankDetails) {
      arch.bankDetails.isChequeAccepted = newStatus === 'VERIFIED';
      arch.bankDetails.isVerified = newStatus === 'VERIFIED';
    }
  }

  arch.documents = docs;
  arch.kycDocuments = docs;
  arch.updatedAt = new Date().toISOString();
  current[idx] = arch;
  safePersistArchitects(current);
  try {
    localStorage.setItem('gd_architect_accounts', JSON.stringify(current));
  } catch {}

  const cleanPhone = (arch.phone || '').replace(/\D/g, '').slice(-10);
  if (cleanPhone) {
    try {
      localStorage.setItem(`arch_kyc_${cleanPhone}`, JSON.stringify(docs));
      if (isCheque && arch.bankDetails) {
        localStorage.setItem(`arch_bank_${cleanPhone}`, JSON.stringify(arch.bankDetails));
      }
    } catch (e) {}
  }

  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('architect_store_updated', { detail: arch }));
    }
    pushToCloud().catch(() => {});
  } catch (e) {}

  return arch;
};


