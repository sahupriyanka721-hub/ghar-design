import {
  PlatformCategoryItem,
  PlatformSubCategoryItem,
  getPlatformCategories,
  savePlatformCategory,
  updatePlatformCategory,
  deletePlatformCategory,
  togglePlatformCategoryStatus,
  addPlatformSubCategory,
  updatePlatformSubCategory,
  deletePlatformSubCategory,
  togglePlatformSubCategoryStatus,
  broadcastStoreUpdate,
} from './customerStore.js';

import {
  getPlatformGlobalSettings,
  savePlatformGlobalSettings,
} from './adminStore.js';

// ==============================================================================
// 1. SERVICE TYPES
// ==============================================================================
export type ServiceDeliveryMode = 'DIGITAL' | 'PHYSICAL_VISIT' | 'HYBRID' | 'TURNKEY';

export interface ServiceTypeItem {
  id: string;
  name: string;
  code: string;
  categorySlug: string;
  deliveryMode: ServiceDeliveryMode;
  turnaroundSlaDays: number;
  minOrderPaise: number;
  includedDeliverables: string[];
  description: string;
  isActive: boolean;
}

export const DEFAULT_SERVICE_TYPES: ServiceTypeItem[] = [
  {
    id: 'st-1',
    name: '100% Digital Remote Architecture & BIM',
    code: 'REMOTE_CAD_BIM',
    categorySlug: 'planning-design',
    deliveryMode: 'DIGITAL',
    turnaroundSlaDays: 5,
    minOrderPaise: 1200000, // ₹12,000
    includedDeliverables: ['2D Floor Plans', '3D Exterior Render', 'CAD .DWG & PDF Files', 'Vastu Consultation Call'],
    description: 'Fully remote architectural planning with real-time video screen-shares, cloud markup and CAD exports.',
    isActive: true,
  },
  {
    id: 'st-2',
    name: 'Physical Site Survey & Soil Core Testing',
    code: 'PHYSICAL_SITE_SURVEY',
    categorySlug: 'planning-design',
    deliveryMode: 'PHYSICAL_VISIT',
    turnaroundSlaDays: 3,
    minOrderPaise: 800000, // ₹8,000
    includedDeliverables: ['Total Station Contour Survey', 'Soil SBC Bearing Capacity Report', 'Road Level Benchmark', 'Geo-tagged Photos'],
    description: 'Licensed surveyor and geotechnical engineer visits plot to measure contours, boundary levels, and soil load bearing capacity.',
    isActive: true,
  },
  {
    id: 'st-3',
    name: 'Hybrid Architecture + 6 Milestone Site Inspections',
    code: 'HYBRID_ARCH_INSPECTION',
    categorySlug: 'house-map-planning',
    deliveryMode: 'HYBRID',
    turnaroundSlaDays: 14,
    minOrderPaise: 3500000, // ₹35,000
    includedDeliverables: ['Complete Working Drawings', '6 Site Inspection Visits by COA Architect', 'Plinth/Slab Quality Sign-offs', 'Contractor Guidance'],
    description: 'Digital drawings combined with scheduled physical milestone inspections during foundation, column casting, and slab levels.',
    isActive: true,
  },
  {
    id: 'st-4',
    name: 'Complete Turnkey Design & Civil Construction',
    code: 'TURNKEY_DESIGN_BUILD',
    categorySlug: 'complete-construction-package',
    deliveryMode: 'TURNKEY',
    turnaroundSlaDays: 180,
    minOrderPaise: 250000000, // ₹25,00,000
    includedDeliverables: ['Architecture & Structural Approval', 'Branded Civil Materials (Tata/UltraTech)', 'Daily Site Camera Access', '10-Year Structural Warranty'],
    description: 'End-to-end material procurement, labor management, architecture supervision, and handover under escrow milestone releases.',
    isActive: true,
  },
  {
    id: 'st-5',
    name: 'Photorealistic Interior 3D Design & BOQ Pack',
    code: 'INTERIOR_3D_BOQ',
    categorySlug: 'interior-designing',
    deliveryMode: 'DIGITAL',
    turnaroundSlaDays: 10,
    minOrderPaise: 2500000, // ₹25,000
    includedDeliverables: ['4K Photorealistic Renders', 'False Ceiling & Electrical Plan', 'Carpentry Cutting Lists', 'Vendor-Ready Hardware BOQ'],
    description: 'Detailed modular kitchen, wardrobe, living space 3D views with exact laminate codes, hardware specifications, and contractor cost bill.',
    isActive: true,
  },
  {
    id: 'st-6',
    name: 'Structural Stability Audit & Retrofitting Certificate',
    code: 'STRUCTURAL_AUDIT_STABILITY',
    categorySlug: 'structural-engineering',
    deliveryMode: 'PHYSICAL_VISIT',
    turnaroundSlaDays: 7,
    minOrderPaise: 1500000, // ₹15,000
    includedDeliverables: ['Rebound Hammer & UPV Testing', 'Crack Assessment Report', 'Retrofitting Beam Jacketing Plan', 'Municipal Stability Certificate'],
    description: 'Chartered Structural Engineer audit for existing old buildings, floor additions, or municipal regularisation compliance.',
    isActive: true,
  },
];

// ==============================================================================
// 2. PROJECT TYPES
// ==============================================================================
export type ProjectCategoryGroup = 'RESIDENTIAL' | 'COMMERCIAL' | 'INDUSTRIAL' | 'RENOVATION';

export interface ProjectTypeItem {
  id: string;
  name: string;
  code: string;
  group: ProjectCategoryGroup;
  typicalAreaRange: string;
  bylawsCompliance: string;
  complexityScore: number; // 1 to 5
  recommendedServiceCode: string;
  isActive: boolean;
}

export const DEFAULT_PROJECT_TYPES: ProjectTypeItem[] = [
  {
    id: 'pt-1',
    name: 'Residential Independent Bungalow / Luxury Villa',
    code: 'RESIDENTIAL_VILLA',
    group: 'RESIDENTIAL',
    typicalAreaRange: '1,500 – 6,500 sq.ft',
    bylawsCompliance: 'NBC 2016 Part 3 / Municipal Setback & FAR norms',
    complexityScore: 4,
    recommendedServiceCode: 'HYBRID_ARCH_INSPECTION',
    isActive: true,
  },
  {
    id: 'pt-2',
    name: 'Builder Floor / Multi-Dwelling Apartment (Stilt + 4)',
    code: 'BUILDER_FLOOR',
    group: 'RESIDENTIAL',
    typicalAreaRange: '2,000 – 12,000 sq.ft',
    bylawsCompliance: 'Urban Development Authority / Dual Staircase & Parking norms',
    complexityScore: 5,
    recommendedServiceCode: 'REMOTE_CAD_BIM',
    isActive: true,
  },
  {
    id: 'pt-3',
    name: 'Commercial Retail Store / High-Street Showroom',
    code: 'COMMERCIAL_RETAIL',
    group: 'COMMERCIAL',
    typicalAreaRange: '800 – 4,500 sq.ft',
    bylawsCompliance: 'Commercial Zoning, Fire NOC, Universal Accessibility ramp',
    complexityScore: 3,
    recommendedServiceCode: 'INTERIOR_3D_BOQ',
    isActive: true,
  },
  {
    id: 'pt-4',
    name: 'Corporate Office / Co-Working Hub',
    code: 'CORPORATE_OFFICE',
    group: 'COMMERCIAL',
    typicalAreaRange: '2,500 – 25,000 sq.ft',
    bylawsCompliance: 'NBC Part 4 Fire & Life Safety, HVAC Ducting & Acoustics',
    complexityScore: 4,
    recommendedServiceCode: 'INTERIOR_3D_BOQ',
    isActive: true,
  },
  {
    id: 'pt-5',
    name: 'Farmhouse & Eco Weekend Retreat',
    code: 'FARMHOUSE_RETREAT',
    group: 'RESIDENTIAL',
    typicalAreaRange: '0.5 – 3.0 Acres',
    bylawsCompliance: 'Agricultural Zoning, Ground Coverage < 15%, Rainwater Harvesting',
    complexityScore: 4,
    recommendedServiceCode: 'HYBRID_ARCH_INSPECTION',
    isActive: true,
  },
  {
    id: 'pt-6',
    name: 'Pre-Engineered Industrial Shed & Warehouse',
    code: 'INDUSTRIAL_SHED',
    group: 'INDUSTRIAL',
    typicalAreaRange: '5,000 – 50,000 sq.ft',
    bylawsCompliance: 'Industrial Area Development Corp, High Bay Clearance & Crane gantry',
    complexityScore: 3,
    recommendedServiceCode: 'STRUCTURAL_AUDIT_STABILITY',
    isActive: true,
  },
  {
    id: 'pt-7',
    name: 'Full Home Renovation & Structural Extension',
    code: 'RENOVATION_EXTENSION',
    group: 'RENOVATION',
    typicalAreaRange: '1,000 – 4,000 sq.ft',
    bylawsCompliance: 'Structural Load Redistribution, Neighbor Shared-Wall indemnity',
    complexityScore: 4,
    recommendedServiceCode: 'STRUCTURAL_AUDIT_STABILITY',
    isActive: true,
  },
];

// ==============================================================================
// 3. PRICING CONFIGURATION MATRIX
// ==============================================================================
export type PricingModel = 'PER_SQFT' | 'FIXED_PACKAGE' | 'CUSTOM_QUOTE';

export interface PricingConfigItem {
  id: string;
  serviceCategory: string;
  projectTypeCode: string;
  pricingModel: PricingModel;
  baseRateRupees: number;
  rateUnitLabel: string;
  minAreaSqFt: number;
  minOrderAmountRupees: number;
  taxInclusive: boolean;
  gstRatePercent: number;
  discountEligible: boolean;
  isActive: boolean;
}

export const DEFAULT_PRICING_CONFIGS: PricingConfigItem[] = [
  {
    id: 'pr-1',
    serviceCategory: 'House Map & 2D Floor Planning',
    projectTypeCode: 'RESIDENTIAL_VILLA',
    pricingModel: 'PER_SQFT',
    baseRateRupees: 12,
    rateUnitLabel: '₹/sq.ft built-up area',
    minAreaSqFt: 1000,
    minOrderAmountRupees: 12000,
    taxInclusive: false,
    gstRatePercent: 18,
    discountEligible: true,
    isActive: true,
  },
  {
    id: 'pr-2',
    serviceCategory: 'Structural Drawings & Municipal Stamping',
    projectTypeCode: 'RESIDENTIAL_VILLA',
    pricingModel: 'PER_SQFT',
    baseRateRupees: 8,
    rateUnitLabel: '₹/sq.ft built-up area',
    minAreaSqFt: 1200,
    minOrderAmountRupees: 9600,
    taxInclusive: false,
    gstRatePercent: 18,
    discountEligible: false,
    isActive: true,
  },
  {
    id: 'pr-3',
    serviceCategory: '3D Exterior Elevation Render Package',
    projectTypeCode: 'ALL_TYPES',
    pricingModel: 'FIXED_PACKAGE',
    baseRateRupees: 7500,
    rateUnitLabel: 'Per Front Elevation (3 angles)',
    minAreaSqFt: 0,
    minOrderAmountRupees: 7500,
    taxInclusive: true,
    gstRatePercent: 18,
    discountEligible: true,
    isActive: true,
  },
  {
    id: 'pr-4',
    serviceCategory: 'Interior Design & 3D Visualization',
    projectTypeCode: 'RESIDENTIAL_VILLA',
    pricingModel: 'PER_SQFT',
    baseRateRupees: 45,
    rateUnitLabel: '₹/sq.ft carpet area',
    minAreaSqFt: 800,
    minOrderAmountRupees: 36000,
    taxInclusive: false,
    gstRatePercent: 18,
    discountEligible: true,
    isActive: true,
  },
  {
    id: 'pr-5',
    serviceCategory: 'Turnkey Construction - Standard Grade',
    projectTypeCode: 'RESIDENTIAL_VILLA',
    pricingModel: 'PER_SQFT',
    baseRateRupees: 1650,
    rateUnitLabel: '₹/sq.ft built-up area',
    minAreaSqFt: 1200,
    minOrderAmountRupees: 1980000,
    taxInclusive: false,
    gstRatePercent: 18,
    discountEligible: false,
    isActive: true,
  },
  {
    id: 'pr-6',
    serviceCategory: 'Turnkey Construction - Premium Luxury',
    projectTypeCode: 'RESIDENTIAL_VILLA',
    pricingModel: 'PER_SQFT',
    baseRateRupees: 2350,
    rateUnitLabel: '₹/sq.ft built-up area',
    minAreaSqFt: 1500,
    minOrderAmountRupees: 3525000,
    taxInclusive: false,
    gstRatePercent: 18,
    discountEligible: false,
    isActive: true,
  },
  {
    id: 'pr-7',
    serviceCategory: 'Commercial Interior & MEP Fit-Out',
    projectTypeCode: 'CORPORATE_OFFICE',
    pricingModel: 'PER_SQFT',
    baseRateRupees: 65,
    rateUnitLabel: '₹/sq.ft carpet area',
    minAreaSqFt: 1500,
    minOrderAmountRupees: 97500,
    taxInclusive: false,
    gstRatePercent: 18,
    discountEligible: true,
    isActive: true,
  },
];

// ==============================================================================
// 4. QUOTATION REQUEST FEE CONFIGURATION
// ==============================================================================
export interface QuotationFeeConfig {
  feeEnabled: boolean;
  tokenFeeRupees: number;
  refundOnProjectBooking: boolean;
  autoRefundIfUnassignedHours: number;
  freeFirstTimeQuotation: boolean;
  exemptionThresholdAreaSqFt: number;
  architectBiddingDepositRupees: number;
  promoCodeExemptionsAllowed: boolean;
  supportPhoneAssistedFreeQuote: boolean;
}

export const DEFAULT_QUOTATION_FEE_CONFIG: QuotationFeeConfig = {
  feeEnabled: true,
  tokenFeeRupees: 499,
  refundOnProjectBooking: true, // 100% credited into Milestone 1 Escrow
  autoRefundIfUnassignedHours: 48,
  freeFirstTimeQuotation: true,
  exemptionThresholdAreaSqFt: 5000,
  architectBiddingDepositRupees: 0, // Free quotation submissions for verified architects
  promoCodeExemptionsAllowed: true,
  supportPhoneAssistedFreeQuote: true,
};

// ==============================================================================
// 5. PLATFORM COMMISSION SETTINGS
// ==============================================================================
export interface PlatformCommissionConfig {
  architectCommissionPercent: number;
  interiorDesignerCommissionPercent: number;
  contractorCommissionPercent: number;
  vendorMarketplaceMarginPercent: number;
  paymentGatewaySurchargePercent: number;
  tdsDeductionPercent: number;
  minPlatformFloorFeeRupees: number;
  starArchitectDiscountPercent: number; // Discount on platform commission for top-rated architects
}

export const DEFAULT_COMMISSION_CONFIG: PlatformCommissionConfig = {
  architectCommissionPercent: 8.0,
  interiorDesignerCommissionPercent: 10.0,
  contractorCommissionPercent: 6.0,
  vendorMarketplaceMarginPercent: 5.0,
  paymentGatewaySurchargePercent: 1.8,
  tdsDeductionPercent: 1.0, // Section 194-O E-Commerce TDS
  minPlatformFloorFeeRupees: 1500,
  starArchitectDiscountPercent: 2.0, // Top architects pay 6% instead of 8%
};

// ==============================================================================
// 6. MILESTONE TEMPLATES
// ==============================================================================
export interface MilestoneTemplateStage {
  stepNumber: number;
  title: string;
  percentage: number;
  slaDays: number;
  deliverablesRequired: string[];
  physicalInspectionRequired: boolean;
}

export interface MilestoneTemplateItem {
  id: string;
  name: string;
  serviceCategorySlug: string;
  targetProjectType: string;
  stagesCount: number;
  stages: MilestoneTemplateStage[];
  isActive: boolean;
}

export const DEFAULT_MILESTONE_TEMPLATES: MilestoneTemplateItem[] = [
  {
    id: 'mt-1',
    name: 'Architectural & House Map Design (4 Milestones)',
    serviceCategorySlug: 'house-map-planning',
    targetProjectType: 'Residential Villa / Apartment',
    stagesCount: 4,
    stages: [
      {
        stepNumber: 1,
        title: 'Site Analysis & Conceptual Floor Plan',
        percentage: 20,
        slaDays: 3,
        deliverablesRequired: ['2D Zoning Layout', 'Room Dimensions', 'Vastu Grid'],
        physicalInspectionRequired: false,
      },
      {
        stepNumber: 2,
        title: 'Detailed Architectural Working Drawings',
        percentage: 30,
        slaDays: 5,
        deliverablesRequired: ['Door/Window Schedule', 'Sectional Elevation', 'Masonry Setting-Out Plan'],
        physicalInspectionRequired: false,
      },
      {
        stepNumber: 3,
        title: 'Structural Framing & Column Placement',
        percentage: 30,
        slaDays: 4,
        deliverablesRequired: ['Footing Reinforcement Schedule', 'Beam/Column Framing', 'Structural Engineer Sign-off'],
        physicalInspectionRequired: false,
      },
      {
        stepNumber: 4,
        title: 'Photorealistic 3D Elevation & BOQ Delivery',
        percentage: 20,
        slaDays: 4,
        deliverablesRequired: ['4K Day & Dusk 3D Renders', 'High-res Elevation Blueprint', 'Material Estimation BOQ'],
        physicalInspectionRequired: false,
      },
    ],
    isActive: true,
  },
  {
    id: 'mt-2',
    name: 'Complete Interior Design Turnkey (4 Milestones)',
    serviceCategorySlug: 'interior-designing',
    targetProjectType: 'Residential Villa / Flat',
    stagesCount: 4,
    stages: [
      {
        stepNumber: 1,
        title: 'Concept Moodboard & Space Allocation',
        percentage: 25,
        slaDays: 4,
        deliverablesRequired: ['Color Palette Board', 'Furniture Layout Plan', 'Material Selection Reference'],
        physicalInspectionRequired: false,
      },
      {
        stepNumber: 2,
        title: '3D Photorealistic Walkthrough & Views',
        percentage: 35,
        slaDays: 7,
        deliverablesRequired: ['Living, Kitchen & Bedroom 3D Renders', 'False Ceiling Design', 'Lighting Coordinates'],
        physicalInspectionRequired: false,
      },
      {
        stepNumber: 3,
        title: 'Detailed Joinery & Electrical MEP Drawings',
        percentage: 25,
        slaDays: 5,
        deliverablesRequired: ['Carpentry Modular Cutting Specs', 'Switchboard Heights', 'Plumbing Rough-in Drawing'],
        physicalInspectionRequired: false,
      },
      {
        stepNumber: 4,
        title: 'Contractor BOQ & Final Handover Kit',
        percentage: 15,
        slaDays: 3,
        deliverablesRequired: ['Itemized BOQ with Vendor Quotations', 'Print-ready Drawings Folder', 'Warranty Handover'],
        physicalInspectionRequired: false,
      },
    ],
    isActive: true,
  },
  {
    id: 'mt-3',
    name: 'Turnkey Civil Construction Standard (5 Milestones)',
    serviceCategorySlug: 'complete-construction-package',
    targetProjectType: 'Independent House / Bungalow',
    stagesCount: 5,
    stages: [
      {
        stepNumber: 1,
        title: 'Excavation & Plinth Beam Level Casting',
        percentage: 20,
        slaDays: 25,
        deliverablesRequired: ['Anti-termite Certificate', 'Steel Binding Check', 'Soil Compaction Test'],
        physicalInspectionRequired: true,
      },
      {
        stepNumber: 2,
        title: 'Ground & First Floor RCC Slab Casting',
        percentage: 25,
        slaDays: 35,
        deliverablesRequired: ['Cube Test 28-day Report', 'Shuttering Inspection Photos', 'Electrical Conduit Verification'],
        physicalInspectionRequired: true,
      },
      {
        stepNumber: 3,
        title: 'Brickwork Masonry & Internal Plastering',
        percentage: 25,
        slaDays: 30,
        deliverablesRequired: ['Brick Mortar Ratio Check', 'Door Frame Anchors', 'Line-and-Dori Plaster Inspection'],
        physicalInspectionRequired: true,
      },
      {
        stepNumber: 4,
        title: 'Flooring, Plumbing, Wiring & Door Shutters',
        percentage: 20,
        slaDays: 30,
        deliverablesRequired: ['Pressure Test for Concealed CPVC', 'Tile Level & Hollow Sound Check', 'Earthing Test Certificate'],
        physicalInspectionRequired: true,
      },
      {
        stepNumber: 5,
        title: 'Finishing Paint, Fixtures & Final Key Handover',
        percentage: 10,
        slaDays: 20,
        deliverablesRequired: ['Deep Cleaning Completion', 'Sanitary Fittings Live Demo', 'Key Handover & Warranty Dossier'],
        physicalInspectionRequired: true,
      },
    ],
    isActive: true,
  },
];

// ==============================================================================
// 7. PROJECT STATUS SETTINGS
// ==============================================================================
export interface ProjectStatusItem {
  code: string;
  label: string;
  badgeBg: string;
  badgeText: string;
  slaMaxDays: number;
  allowedNextStates: string[];
  customerFacingDescription: string;
  autoEscalateOnBreach: boolean;
  requiresAdminApproval: boolean;
  isTerminal: boolean;
}

export const DEFAULT_PROJECT_STATUS_SETTINGS: ProjectStatusItem[] = [
  {
    code: 'NEW',
    label: 'New Project (Awaiting Kickoff)',
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-800',
    slaMaxDays: 2,
    allowedNextStates: ['KICKOFF', 'CANCELLED'],
    customerFacingDescription: 'Quotation accepted. Admin is preparing dedicated project workspace and assigning onboarding architect.',
    autoEscalateOnBreach: true,
    requiresAdminApproval: false,
    isTerminal: false,
  },
  {
    code: 'KICKOFF',
    label: 'Kickoff & Escrow Funded',
    badgeBg: 'bg-indigo-100',
    badgeText: 'text-indigo-800',
    slaMaxDays: 3,
    allowedNextStates: ['ACTIVE', 'ON_HOLD', 'CANCELLED'],
    customerFacingDescription: 'Onboarding meeting concluded and Milestone 1 advance is safely secured in escrow.',
    autoEscalateOnBreach: true,
    requiresAdminApproval: false,
    isTerminal: false,
  },
  {
    code: 'ACTIVE',
    label: 'Active Execution',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-800',
    slaMaxDays: 45,
    allowedNextStates: ['ON_HOLD', 'DELAYED', 'COMPLETED', 'CANCELLED'],
    customerFacingDescription: 'Architect and site engineers are actively executing agreed project deliverables.',
    autoEscalateOnBreach: false,
    requiresAdminApproval: false,
    isTerminal: false,
  },
  {
    code: 'ON_HOLD',
    label: 'Project On-Hold',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-800',
    slaMaxDays: 14,
    allowedNextStates: ['ACTIVE', 'CANCELLED'],
    customerFacingDescription: 'Temporarily paused due to customer request, plot dispute, or pending design decisions.',
    autoEscalateOnBreach: true,
    requiresAdminApproval: true,
    isTerminal: false,
  },
  {
    code: 'DELAYED',
    label: 'SLA Breached / Delayed',
    badgeBg: 'bg-rose-100',
    badgeText: 'text-rose-800',
    slaMaxDays: 7,
    allowedNextStates: ['ACTIVE', 'ON_HOLD', 'CANCELLED'],
    customerFacingDescription: 'Delivery timeline is delayed. Senior admin has intervened to expedite deliverables.',
    autoEscalateOnBreach: true,
    requiresAdminApproval: true,
    isTerminal: false,
  },
  {
    code: 'COMPLETED',
    label: 'Completed & Delivered',
    badgeBg: 'bg-teal-100',
    badgeText: 'text-teal-800',
    slaMaxDays: 0,
    allowedNextStates: [],
    customerFacingDescription: 'All milestones successfully verified and approved. Final escrow payout settled.',
    autoEscalateOnBreach: false,
    requiresAdminApproval: true,
    isTerminal: true,
  },
  {
    code: 'CANCELLED',
    label: 'Project Cancelled',
    badgeBg: 'bg-red-100',
    badgeText: 'text-red-800',
    slaMaxDays: 0,
    allowedNextStates: [],
    customerFacingDescription: 'Project terminated prematurely. Escrow refund processed as per cancellation guidelines.',
    autoEscalateOnBreach: false,
    requiresAdminApproval: true,
    isTerminal: true,
  },
];

// ==============================================================================
// STORAGE KEYS & ACCESSORS
// ==============================================================================
const SERVICE_TYPES_KEY = 'platform_config_service_types';
const PROJECT_TYPES_KEY = 'platform_config_project_types';
const PRICING_CONFIG_KEY = 'platform_config_pricing_matrix';
const QUOTATION_FEE_KEY = 'platform_config_quotation_fee';
const COMMISSION_CONFIG_KEY = 'platform_config_commission';
const MILESTONE_TEMPLATES_KEY = 'platform_config_milestone_templates';
const PROJECT_STATUS_KEY = 'platform_config_project_statuses';

// 1. Service Types Accessors
export const getPlatformServiceTypes = (): ServiceTypeItem[] => {
  try {
    const data = localStorage.getItem(SERVICE_TYPES_KEY);
    if (data) return JSON.parse(data);
  } catch {}
  return DEFAULT_SERVICE_TYPES;
};

export const savePlatformServiceTypes = (items: ServiceTypeItem[]): ServiceTypeItem[] => {
  try {
    localStorage.setItem(SERVICE_TYPES_KEY, JSON.stringify(items));
    broadcastStoreUpdate('SERVICE_CONFIG_UPDATED', { type: 'SERVICE_TYPES', data: items });
  } catch {}
  return items;
};

// 2. Project Types Accessors
export const getPlatformProjectTypes = (): ProjectTypeItem[] => {
  try {
    const data = localStorage.getItem(PROJECT_TYPES_KEY);
    if (data) return JSON.parse(data);
  } catch {}
  return DEFAULT_PROJECT_TYPES;
};

export const savePlatformProjectTypes = (items: ProjectTypeItem[]): ProjectTypeItem[] => {
  try {
    localStorage.setItem(PROJECT_TYPES_KEY, JSON.stringify(items));
    broadcastStoreUpdate('SERVICE_CONFIG_UPDATED', { type: 'PROJECT_TYPES', data: items });
  } catch {}
  return items;
};

// 3. Pricing Configs Accessors
export const getPlatformPricingConfigs = (): PricingConfigItem[] => {
  try {
    const data = localStorage.getItem(PRICING_CONFIG_KEY);
    if (data) return JSON.parse(data);
  } catch {}
  return DEFAULT_PRICING_CONFIGS;
};

export const savePlatformPricingConfigs = (items: PricingConfigItem[]): PricingConfigItem[] => {
  try {
    localStorage.setItem(PRICING_CONFIG_KEY, JSON.stringify(items));
    broadcastStoreUpdate('SERVICE_CONFIG_UPDATED', { type: 'PRICING_CONFIGS', data: items });
  } catch {}
  return items;
};

// 4. Quotation Fee Accessors
export const getPlatformQuotationFeeConfig = (): QuotationFeeConfig => {
  try {
    const data = localStorage.getItem(QUOTATION_FEE_KEY);
    if (data) return JSON.parse(data);
  } catch {}
  // Also check adminStore global settings
  const globalSettings = getPlatformGlobalSettings();
  if (globalSettings.quotationFeePaise) {
    return {
      ...DEFAULT_QUOTATION_FEE_CONFIG,
      tokenFeeRupees: Math.round(globalSettings.quotationFeePaise / 100),
    };
  }
  return DEFAULT_QUOTATION_FEE_CONFIG;
};

export const savePlatformQuotationFeeConfig = (config: QuotationFeeConfig): QuotationFeeConfig => {
  try {
    localStorage.setItem(QUOTATION_FEE_KEY, JSON.stringify(config));
    // Also sync to global settings
    savePlatformGlobalSettings({ quotationFeePaise: config.tokenFeeRupees * 100 });
    broadcastStoreUpdate('SERVICE_CONFIG_UPDATED', { type: 'QUOTATION_FEE', data: config });
  } catch {}
  return config;
};

// 5. Commission Config Accessors
export const getPlatformCommissionConfig = (): PlatformCommissionConfig => {
  try {
    const data = localStorage.getItem(COMMISSION_CONFIG_KEY);
    if (data) return JSON.parse(data);
  } catch {}
  const globalSettings = getPlatformGlobalSettings();
  return {
    ...DEFAULT_COMMISSION_CONFIG,
    architectCommissionPercent: globalSettings.architectCommissionPercent || 8,
    interiorDesignerCommissionPercent: globalSettings.interiorDesignerCommissionPercent || 10,
    contractorCommissionPercent: globalSettings.contractorCommissionPercent || 6,
    vendorMarketplaceMarginPercent: globalSettings.vendorCommissionPercent || 5,
  };
};

export const savePlatformCommissionConfig = (config: PlatformCommissionConfig): PlatformCommissionConfig => {
  try {
    localStorage.setItem(COMMISSION_CONFIG_KEY, JSON.stringify(config));
    // Sync to adminStore
    savePlatformGlobalSettings({
      architectCommissionPercent: config.architectCommissionPercent,
      interiorDesignerCommissionPercent: config.interiorDesignerCommissionPercent,
      contractorCommissionPercent: config.contractorCommissionPercent,
      vendorCommissionPercent: config.vendorMarketplaceMarginPercent,
    });
    broadcastStoreUpdate('SERVICE_CONFIG_UPDATED', { type: 'COMMISSION_CONFIG', data: config });
  } catch {}
  return config;
};

// 6. Milestone Templates Accessors
export const getPlatformMilestoneTemplates = (): MilestoneTemplateItem[] => {
  try {
    const data = localStorage.getItem(MILESTONE_TEMPLATES_KEY);
    if (data) return JSON.parse(data);
  } catch {}
  return DEFAULT_MILESTONE_TEMPLATES;
};

export const savePlatformMilestoneTemplates = (templates: MilestoneTemplateItem[]): MilestoneTemplateItem[] => {
  try {
    localStorage.setItem(MILESTONE_TEMPLATES_KEY, JSON.stringify(templates));
    broadcastStoreUpdate('SERVICE_CONFIG_UPDATED', { type: 'MILESTONE_TEMPLATES', data: templates });
  } catch {}
  return templates;
};

// 7. Project Status Accessors
export const getPlatformProjectStatusSettings = (): ProjectStatusItem[] => {
  try {
    const data = localStorage.getItem(PROJECT_STATUS_KEY);
    if (data) return JSON.parse(data);
  } catch {}
  return DEFAULT_PROJECT_STATUS_SETTINGS;
};

export const savePlatformProjectStatusSettings = (statuses: ProjectStatusItem[]): ProjectStatusItem[] => {
  try {
    localStorage.setItem(PROJECT_STATUS_KEY, JSON.stringify(statuses));
    broadcastStoreUpdate('SERVICE_CONFIG_UPDATED', { type: 'PROJECT_STATUS', data: statuses });
  } catch {}
  return statuses;
};

// Restore all defaults
export const restoreAllServiceConfigDefaults = () => {
  localStorage.removeItem(SERVICE_TYPES_KEY);
  localStorage.removeItem(PROJECT_TYPES_KEY);
  localStorage.removeItem(PRICING_CONFIG_KEY);
  localStorage.removeItem(QUOTATION_FEE_KEY);
  localStorage.removeItem(COMMISSION_CONFIG_KEY);
  localStorage.removeItem(MILESTONE_TEMPLATES_KEY);
  localStorage.removeItem(PROJECT_STATUS_KEY);
  broadcastStoreUpdate('SERVICE_CONFIG_UPDATED', { type: 'ALL_RESTORED' });
};
