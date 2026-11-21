// ==============================================================================
// GHARDESIGN SHARED TYPES AND ENUMS - COMPLETE CUSTOMER PANEL ECOSYSTEM
// ==============================================================================

export type UserRole = 'CUSTOMER' | 'ADMIN' | 'PROFESSIONAL' | 'VENDOR';

export type ProfessionalCategory =
  | 'ARCHITECT'
  | 'CIVIL_ENGINEER'
  | 'STRUCTURAL_ENGINEER'
  | 'INTERIOR_DESIGNER'
  | 'CONSTRUCTION_CONTRACTOR'
  | 'SPECIALIST';

export type PropertyType =
  | 'EMPTY_PLOT'
  | 'EXISTING_HOUSE'
  | 'FLAT_APARTMENT'
  | 'COMMERCIAL_PROPERTY'
  | 'VILLA_BUNGALOW';

export type MeasurementUnit = 'FEET' | 'METRES';

export type ProjectRequestStatus =
  | 'DRAFT'
  | 'AWAITING_PAYMENT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'AWAITING_ASSIGNMENT'
  | 'ASSIGNED'
  | 'QUOTATIONS_IN_PROGRESS'
  | 'UNDER_QUOTATION_REVIEW'
  | 'QUOTATIONS_AVAILABLE'
  | 'QUOTE_SELECTED'
  | 'BOOKING_PENDING'
  | 'BOOKING_CONFIRMED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REJECTED'
  | 'EXPIRED';

export type AssignmentStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED';

export type QuotationStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_ADMIN_REVIEW'
  | 'CHANGES_REQUESTED'
  | 'APPROVED'
  | 'PUBLISHED'
  | 'REJECTED'
  | 'SELECTED'
  | 'NOT_SELECTED'
  | 'EXPIRED'
  | 'WITHDRAWN';

export type PaymentStatus =
  | 'PAYMENT_PENDING'
  | 'PAYMENT_SUCCESSFUL'
  | 'PAYMENT_FAILED'
  | 'PAYMENT_VERIFICATION_PENDING'
  | 'REFUND_PENDING'
  | 'PARTIALLY_REFUNDED'
  | 'REFUNDED';

export type PaymentPurpose =
  | 'REQUEST_FEE'
  | 'BOOKING_ADVANCE'
  | 'MILESTONE_PAYMENT'
  | 'CONSULTATION_FEE'
  | 'MATERIAL_PURCHASE'
  | 'SETTLEMENT_BALANCE';

export type BookingStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'DISPUTED';

export interface CustomerAddress {
  id: string;
  label: string; // e.g. "Home", "Site Plot 42", "Billing Office"
  houseNo: string;
  street: string;
  locality: string;
  city: string;
  state: string;
  pinCode: string;
  country: string;
  landmark?: string;
  isDefaultBilling?: boolean;
  isDefaultDelivery?: boolean;
}

export interface User {
  id: string;
  phone: string;
  email?: string | null;
  name: string;
  role: UserRole;
  isActive: boolean;
  address?: CustomerAddress | null;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerProfile {
  id: string;
  userId: string;
  addresses: CustomerAddress[];
  alternatePhone?: string | null;
  defaultBillingAddressId?: string;
  defaultDeliveryAddressId?: string;
}

export interface ProfessionalProfile {
  id: string;
  userId: string;
  firmName: string;
  category: ProfessionalCategory;
  qualifications: string;
  experienceYears: number;
  serviceCities: string[];
  portfolioUrls: string[];
  isVerified: boolean;
  availabilityStatus: boolean;
  verificationStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface ServiceCategory {
  id: string;
  slug: string;
  name: string;
  description: string;
  iconName: string;
  isActive: boolean;
}

export interface ProjectRequest {
  id: string;
  requestCode: string;
  customerId: string;
  status: ProjectRequestStatus;
  categorySlug: string;
  propertyType: PropertyType;
  plotWidth: number;
  plotLength: number;
  measurementUnit: MeasurementUnit;
  plotArea: number; // in sq ft or sq m depending on unit
  builtUpArea?: number | null;
  floors: number;
  bedrooms: number;
  bathrooms: number;
  kitchens: number;
  currentCondition: string;
  city: string;
  state: string;
  locality: string;
  address?: string | null;
  ownershipConfirmed: boolean;
  requiredServices: string[];
  budgetRange: string;
  preferredStartDate?: string | null;
  expectedCompletionDate?: string | null;
  description: string;
  designStyle?: string | null;
  siteAccessibilityNotes?: string | null;
  quoteFeePaise: number;
  isFeePaid: boolean;
  selectedQuotationId?: string | null;
  publishedQuotationsCount?: number;
  assignedCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface QuotationLineItem {
  id?: string;
  description: string;
  quantity: number;
  unit: string;
  unitPricePaise: number;
  totalPaise: number;
}

export interface QuotationMilestone {
  title: string;
  percentage: number;
  amountPaise: number;
  description?: string;
}

export interface Quotation {
  id: string;
  quotationCode: string;
  requestId: string;
  professionalId: string;
  professional?: {
    id: string;
    firmName: string;
    category: ProfessionalCategory;
    experienceYears: number;
    qualifications: string;
    isVerified: boolean;
  };
  status: QuotationStatus;
  scopeOfWork: string;
  lineItems: QuotationLineItem[];
  subtotalPaise: number;
  discountPaise: number;
  taxPaise: number;
  finalAmountPaise: number;
  includedDeliverables: string[];
  excludedWork: string[];
  revisionsCount: number;
  drawingFormats: string[];
  siteVisitChargesPaise: number;
  estimatedDurationDays: number;
  advancePercentage: number;
  milestones: QuotationMilestone[];
  validUntil: string;
  cancellationTerms: string;
  additionalTerms?: string | null;
  adminFeedback?: string | null;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentRecord {
  id: string;
  paymentCode: string;
  userId: string;
  requestId?: string | null;
  bookingId?: string | null;
  orderId?: string | null;
  purpose: PaymentPurpose;
  razorpayOrderId?: string | null;
  razorpayPaymentId?: string | null;
  amountPaise: number;
  taxPaise?: number;
  currency: string;
  paymentMethod?: string;
  status: PaymentStatus;
  failureReason?: string | null;
  createdAt: string;
}

export interface Booking {
  id: string;
  bookingCode: string;
  requestId: string;
  quotationId: string;
  customerId: string;
  professionalId: string;
  professionalName?: string;
  serviceTitle: string;
  serviceType: string;
  status: BookingStatus;
  totalAmountPaise: number;
  advancePaidPaise: number;
  visitDate?: string;
  visitTimeSlot?: string;
  siteAddress?: string;
  nextAppointment?: string;
  confirmedAt?: string | null;
  createdAt: string;
}

// -------------------------------------------------------------
// PROJECT TRACKING & STAGES (10 Construction & 10 Interior Stages)
// -------------------------------------------------------------
export type ProjectWorkflowType = 'CONSTRUCTION' | 'INTERIOR' | 'RENOVATION' | 'ARCHITECTURAL';

export interface ProjectStage {
  id: string;
  projectId: string;
  stageNumber: number;
  stageName: string;
  workflowType: ProjectWorkflowType;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';
  assignedPerson: string;
  startDate: string;
  dueDate: string;
  completionDate?: string;
  evidencePhotos: string[];
  notes: string;
  requiresApproval: boolean;
  isApproved?: boolean;
}

export interface ProjectTask {
  id: string;
  stageId: string;
  title: string;
  isCompleted: boolean;
  dueDate: string;
}

export interface ProjectTrackingData {
  projectId: string;
  projectCode: string;
  projectName: string;
  projectManager: string;
  managerPhone: string;
  managerEmail: string;
  overallProgress: number; // 0 to 100
  currentStageIndex: number;
  plannedStartDate: string;
  plannedCompletionDate: string;
  delayedMilestonesCount: number;
  stages: ProjectStage[];
  sitePhotos: { id: string; url: string; caption: string; date: string; stageName: string }[];
  issues: { id: string; title: string; severity: 'LOW' | 'MEDIUM' | 'HIGH'; status: 'OPEN' | 'RESOLVED'; resolution?: string; reportedAt: string }[];
}

// -------------------------------------------------------------
// DESIGN APPROVALS & DOCUMENTS
// -------------------------------------------------------------
export interface DocumentVersion {
  version: string;
  fileUrl: string;
  uploadedAt: string;
  notes?: string;
}

export interface ProjectDocument {
  id: string;
  projectId: string;
  documentCode: string;
  title: string;
  category: 'AGREEMENT' | 'DRAWING' | '3D_DESIGN' | 'BOQ' | 'WORK_ORDER' | 'SPECIFICATION' | 'SITE_REPORT' | 'HANDOVER';
  currentVersion: string;
  fileSize: string;
  fileUrl: string;
  versions: DocumentVersion[];
  createdAt: string;
}

export interface DesignApproval {
  id: string;
  projectId: string;
  documentId: string;
  documentTitle: string;
  documentVersion: string;
  previewUrl: string;
  status: 'PENDING' | 'APPROVED' | 'CHANGES_REQUESTED';
  requestedAt: string;
  decisionDate?: string;
  customerNotes?: string;
  history: { version: string; action: 'SUBMITTED' | 'APPROVED' | 'CHANGES_REQUESTED'; comment: string; timestamp: string }[];
}

// -------------------------------------------------------------
// PROJECT COMMUNICATION & THREADS
// -------------------------------------------------------------
export interface ProjectMessage {
  id: string;
  projectId: string;
  senderId: string;
  senderName: string;
  senderRole: 'CUSTOMER' | 'PROJECT_MANAGER' | 'ARCHITECT' | 'CONTRACTOR';
  content: string;
  timestamp: string;
  attachments?: string[];
}

// -------------------------------------------------------------
// MATERIAL MANAGEMENT (CATALOG, CART, ORDERS)
// -------------------------------------------------------------
export interface MaterialProduct {
  id: string;
  sku: string;
  name: string;
  brand: string;
  category: string;
  specifications: string;
  unit: string;
  pricePaise: number;
  inStock: boolean;
  stockQuantity: number;
  deliveryDays: number;
  imageUrl: string;
  bulkQuoteEligible: boolean;
}

export interface CartItem {
  product: MaterialProduct;
  quantity: number;
}

export interface MaterialOrderItem {
  productId: string;
  name: string;
  sku: string;
  brand: string;
  unit: string;
  quantity: number;
  unitPricePaise: number;
  totalPaise: number;
  imageUrl: string;
}

export interface MaterialOrder {
  id: string;
  orderCode: string;
  customerId: string;
  items: MaterialOrderItem[];
  subtotalPaise: number;
  taxPaise: number;
  deliveryFeePaise: number;
  totalAmountPaise: number;
  deliveryAddress: CustomerAddress;
  paymentStatus: PaymentStatus;
  fulfillmentStatus:
    | 'PENDING_PAYMENT'
    | 'CONFIRMED'
    | 'PROCESSING'
    | 'DISPATCHED'
    | 'OUT_FOR_DELIVERY'
    | 'DELIVERED'
    | 'CANCELLED'
    | 'RETURN_REQUESTED'
    | 'RETURNED'
    | 'REFUNDED';
  orderDate: string;
  expectedDeliveryDate: string;
  trackingNumber?: string;
  trackingSteps: { status: string; date: string; completed: boolean }[];
}

// -------------------------------------------------------------
// INVOICES & FINAL SETTLEMENTS
// -------------------------------------------------------------
export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unit: string;
  unitPricePaise: number;
  totalPaise: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  invoiceType: 'TAX_INVOICE' | 'PRO_FORMA' | 'RECEIPT';
  issueDate: string;
  dueDate: string;
  relatedProject?: string;
  relatedOrder?: string;
  issuerName: string;
  issuerGstin: string;
  customerName: string;
  customerBillingAddress: string;
  lineItems: InvoiceLineItem[];
  subtotalPaise: number;
  discountPaise: number;
  taxPaise: number; // 18% GST
  totalAmountPaise: number;
  paidAmountPaise: number;
  outstandingPaise: number;
  status: 'PAID' | 'PENDING' | 'OVERDUE';
}

export interface FinalSettlement {
  id: string;
  projectId: string;
  projectName: string;
  projectCode: string;
  originalContractPaise: number;
  approvedVariationsPaise: number; // Extra additions (+)
  approvedDiscountsPaise: number; // (-)
  taxesPaise: number; // (+)
  separateMaterialsPaise: number; // (+)
  paymentsReceivedPaise: number; // (-)
  creditNotesPaise: number; // (-)
  retentionPaise: number; // Security deposit / retention held (-)
  netPayablePaise: number; // Formula calculated remaining
  status:
    | 'DRAFT'
    | 'UNDER_REVIEW'
    | 'AWAITING_CUSTOMER_APPROVAL'
    | 'PARTIALLY_PAID'
    | 'PAID'
    | 'DISPUTED'
    | 'CLOSED';
  disputeNotes?: string;
  createdAt: string;
  closedAt?: string;
}

// -------------------------------------------------------------
// SUPPORT TICKETS, NOTIFICATIONS & REVIEWS
// -------------------------------------------------------------
export interface SupportTicketMessage {
  id: string;
  senderName: string;
  senderRole: string;
  message: string;
  timestamp: string;
}

export interface SupportTicket {
  id: string;
  ticketCode: string;
  customerId: string;
  category: 'QUOTATION' | 'BILLING' | 'PROJECT_EXECUTION' | 'MATERIALS' | 'GENERAL';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  subject: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'WAITING_FOR_CUSTOMER' | 'RESOLVED' | 'CLOSED';
  relatedReference?: string;
  messages: SupportTicketMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ALERT';
  isRead: boolean;
  link?: string | null;
  createdAt: string;
}

export interface CustomerReview {
  id: string;
  bookingId: string;
  projectName: string;
  professionalName: string;
  overallRating: number;
  qualityRating: number;
  punctualityRating: number;
  comment: string;
  createdAt: string;
}

export interface NotificationPreferences {
  inApp: boolean;
  email: boolean;
  sms: boolean;
  whatsapp: boolean;
  quotationAlerts: boolean;
  milestoneAlerts: boolean;
  paymentAlerts: boolean;
  materialAlerts: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

// -------------------------------------------------------------
// -------------------------------------------------------------
// BUILDGHAR COMPLETE VENDOR PORTAL DATA MODELS
// -------------------------------------------------------------

export type VendorApplicationStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'UNDER_REVIEW'
  | 'DOCUMENTS_REQUIRED'
  | 'RESUBMITTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'SUSPENDED';

export type ConstructionMeasurementUnit =
  | 'KG'
  | 'GRAM'
  | 'METRIC_TON'
  | 'BAG'
  | 'PIECE'
  | 'BOX'
  | 'BUNDLE'
  | 'CFT'
  | 'CBM'
  | 'SQFT'
  | 'SQM'
  | 'LITRE'
  | 'METER'
  | 'FEET'
  | 'SET'
  | 'PACKET';

export interface VendorDocumentItem {
  id: string;
  name: string;
  type:
    | 'GST_CERTIFICATE'
    | 'PAN_CARD'
    | 'AADHAAR_CARD'
    | 'SHOP_ESTABLISHMENT'
    | 'BUSINESS_REGISTRATION'
    | 'TRADE_LICENSE'
    | 'CANCELLED_CHEQUE'
    | 'OTHER';
  url: string;
  verified: boolean;
  uploadedAt: string;
}

export interface VendorBankDetails {
  accountHolder: string;
  bankName: string;
  accountNumber: string;
  confirmAccountNumber?: string;
  ifsc: string;
  branchName?: string;
  upiId?: string;
  chequeProofUrl?: string;
}

export interface VendorDeliverySettings {
  deliveryAvailable: boolean;
  deliveryLocations: string[];
  serviceablePinCodes: string[];
  maxDeliveryDistanceKm: number;
  deliveryChargesPaise: number;
  minOrderValuePaise: number;
  estimatedDeliveryDays: number;
  selfPickupAvailable: boolean;
  freeDeliveryAbovePaise?: number;
}

export interface VendorBusinessOperations {
  workingDays: string[];
  openingTime: string;
  closingTime: string;
  weeklyOff: string;
  customerSupportNumber: string;
}

export interface RegisteredVendor {
  id: string;
  businessName: string;
  ownerName: string;
  phone: string;
  alternatePhone?: string;
  email: string;
  businessType?: 'PROPRIETORSHIP' | 'PARTNERSHIP' | 'PVT_LTD' | 'LLP' | 'INDIVIDUAL_SUPPLIER';
  yearOfEstablishment?: number;
  businessDescription?: string;
  logoUrl?: string;
  profileImageUrl?: string;

  // Business Category & Tax Details
  businessCategory: string;
  businessSubcategories?: string[];
  supplierType?: 'MANUFACTURER' | 'WHOLESALER' | 'AUTHORIZED_DISTRIBUTOR' | 'RETAIL_DEALER';
  materialsSupplied?: string[];
  gstRegistrationStatus?: 'REGISTERED' | 'COMPOSITION' | 'UNREGISTERED';
  gstin: string;
  panNumber?: string;
  businessRegNumber?: string;
  website?: string;

  // Address
  country?: string;
  state: string;
  district?: string;
  city: string;
  areaLocality?: string;
  warehouseAddress: string;
  pinCode: string;
  mapsLocationUrl?: string;

  // Documents & Bank
  documents?: VendorDocumentItem[];
  bankDetails?: VendorBankDetails;
  deliverySettings?: VendorDeliverySettings;
  businessOperations?: VendorBusinessOperations;

  // Approval Status
  status: VendorApplicationStatus;
  commissionRatePercent: number; // default 5%
  registeredAt: string;
  approvedAt?: string;
  rejectionReason?: string;
  requestedChangesNotes?: string;
  rating?: number;
  totalOrdersCount?: number;
  totalSalesPaise?: number;
}

export interface VendorProductVariant {
  id: string;
  sku: string;
  title: string;
  variantType: 'SIZE' | 'COLOR' | 'WEIGHT' | 'GRADE' | 'PACKAGING' | 'MATERIAL';
  variantValue: string;
  pricePaise: number;
  mrpPaise: number;
  stockQuantity: number;
  barcode?: string;
}

export interface VendorProduct {
  id: string;
  vendorId: string;
  vendorName: string;
  vendorPhone: string;
  name: string;
  sku: string;
  brand: string;
  category: string;
  subcategory?: string;
  productType?: 'RAW_MATERIAL' | 'FINISHED_GOOD' | 'HEAVY_CONSTRUCTION' | 'FIXTURE';
  tags?: string[];
  specifications: string;
  shortDescription?: string;
  unit: ConstructionMeasurementUnit | string;

  // Pricing & Taxation
  costPricePaise?: number;
  pricePaise: number;
  marketPricePaise?: number;
  mrpPaise?: number;
  discountType?: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'NONE';
  discountValue?: number;
  taxRatePercent?: number; // GST 5, 12, 18, 28

  // Inventory
  stockQuantity: number;
  minStockAlert?: number;
  maxStockAlert?: number;
  warehouseLocation?: string;
  allowBackorders?: boolean;
  inStock: boolean;
  minOrderQuantity?: number;

  // Shipping & Bulky Specs
  weightKg?: number;
  dimensions?: { lengthCm: number; widthCm: number; heightCm: number };
  deliveryChargesPaise?: number;
  deliveryDays: number;
  serviceablePinCodes?: string[];

  // Media
  imageUrl: string;
  galleryImages?: string[];
  videoUrl?: string;
  techSheetUrl?: string;

  // Variants
  hasVariants?: boolean;
  variants?: VendorProductVariant[];

  // Approval & Status
  approvalStatus: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'DRAFT' | 'CHANGES_REQUESTED';
  adminNotes?: string;
  isFeatured?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VendorCategoryRequest {
  id: string;
  vendorId: string;
  vendorName: string;
  type: 'CATEGORY' | 'SUBCATEGORY';
  parentCategoryName?: string;
  requestedName: string;
  description: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  adminFeedback?: string;
  createdAt: string;
}

export interface VendorBrandItem {
  id: string;
  name: string;
  logoUrl?: string;
  categories: string[];
  isVerified: boolean;
  isCustomRequest?: boolean;
  status: 'ACTIVE' | 'PENDING_APPROVAL' | 'REJECTED';
  requestedByVendorId?: string;
  createdAt: string;
}

export interface InventoryMovementRecord {
  id: string;
  vendorId: string;
  productId: string;
  productName: string;
  sku: string;
  movementType: 'STOCK_IN' | 'STOCK_OUT' | 'ADJUSTMENT' | 'ORDER_RESERVED' | 'ORDER_RESTORED';
  reason:
    | 'PURCHASE_RECEIPT'
    | 'SALES_DISPATCH'
    | 'CUSTOMER_CANCEL_RESTORE'
    | 'CUSTOMER_RETURN'
    | 'DAMAGED_EXPIRED'
    | 'PHYSICAL_AUDIT_CORRECTION'
    | 'MANUAL_OVERRIDE';
  quantityChange: number; // positive or negative
  previousStock: number;
  resultingStock: number;
  referenceOrderId?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
}

export interface BulkyTransitDetails {
  vehicleType: 'TATA_ACE_MINI' | 'EICHER_TRUCK' | 'TRACTOR_TROLLEY' | 'MULTI_AXLE_TRUCK' | 'BOOM_CRANE' | 'OTHER';
  vehicleNumber: string;
  driverName: string;
  driverPhone: string;
  dispatchChallanNumber?: string;
  challanPdfUrl?: string;
  weighbridgeSlipNumber?: string;
  loadingDate: string;
  dispatchDate: string;
  expectedDeliveryDate: string;
  deliveryProofUrl?: string;
}

export interface VendorSubOrder {
  id: string;
  masterOrderId: string;
  orderCode: string;
  vendorId: string;
  vendorName: string;
  vendorPhone: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: CustomerAddress;
  items: MaterialOrderItem[];
  subtotalPaise: number;
  taxPaise: number;
  shippingChargesPaise: number;
  totalAmountPaise: number;
  commissionRatePercent: number;
  commissionAmountPaise: number;
  vendorNetEarningsPaise: number;
  paymentMethod: 'ONLINE_ESCROW' | 'CASH_ON_DELIVERY';
  paymentStatus: 'PENDING' | 'HELD_IN_ESCROW' | 'COMPLETED' | 'COD_PENDING' | 'COD_RECEIVED' | 'REFUNDED';
  orderStatus:
    | 'NEW_ORDER'
    | 'ACCEPTED'
    | 'REJECTED'
    | 'PROCESSING'
    | 'READY_FOR_DISPATCH'
    | 'SHIPPED'
    | 'OUT_FOR_DELIVERY'
    | 'DELIVERED'
    | 'CANCEL_REQUESTED'
    | 'CANCELLED'
    | 'RETURN_REQUESTED'
    | 'RETURNED'
    | 'REFUND_PROCESSING'
    | 'REFUNDED';
  cancellationReason?: string;
  returnReason?: string;
  transitDetails?: BulkyTransitDetails;
  invoiceNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VendorTaxInvoice {
  id: string;
  invoiceNumber: string;
  invoiceType: 'TAX_INVOICE' | 'CREDIT_NOTE' | 'DEBIT_NOTE' | 'DELIVERY_CHALLAN';
  vendorSubOrderId: string;
  masterOrderId: string;
  invoiceDate: string;
  vendorGstin: string;
  vendorLegalName: string;
  vendorAddress: string;
  customerName: string;
  customerGstin?: string;
  customerAddress: string;
  items: {
    description: string;
    hsnCode: string;
    quantity: number;
    unit: string;
    unitPricePaise: number;
    taxableAmountPaise: number;
    gstRatePercent: number;
    cgstPaise: number;
    sgstPaise: number;
    igstPaise: number;
    totalPaise: number;
  }[];
  subtotalPaise: number;
  totalTaxPaise: number;
  shippingChargesPaise: number;
  roundOffPaise: number;
  grandTotalPaise: number;
  isCancelled?: boolean;
}

export interface VendorSettlementRecord {
  id: string;
  settlementCode: string;
  vendorId: string;
  vendorName: string;
  orderIds: string[];
  grossAmountPaise: number;
  commissionPaise: number;
  taxDeductedPaise: number;
  refundAdjustmentsPaise: number;
  netPayablePaise: number;
  bankAccountRef: string;
  bankUtrNumber?: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'ON_HOLD';
  notes?: string;
  settlementDate?: string;
  createdAt: string;
}

export interface VendorPromotionRule {
  id: string;
  vendorId: string;
  title: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FLAT_DISCOUNT';
  discountValue: number;
  minPurchasePaise: number;
  applicableProductIds: string[]; // empty means all
  startDate: string;
  endDate: string;
  usageLimit?: number;
  usedCount: number;
  isActive: boolean;
  featuredPlacementRequested?: boolean;
  featuredStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface VendorSupportTicket {
  id: string;
  ticketCode: string;
  vendorId: string;
  vendorName: string;
  subject: string;
  category: 'PAYMENTS_SETTLEMENT' | 'ORDER_DISPUTE' | 'PRODUCT_APPROVAL' | 'COMMISSION_QUERY' | 'TECHNICAL_SUPPORT' | 'GENERAL';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'IN_PROGRESS' | 'AWAITING_VENDOR' | 'RESOLVED' | 'CLOSED';
  messages: {
    id: string;
    senderId: string;
    senderRole: 'VENDOR' | 'ADMIN';
    senderName: string;
    text: string;
    attachmentUrl?: string;
    createdAt: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface VendorCustomerQuery {
  id: string;
  vendorId: string;
  productId?: string;
  productName?: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  queryText: string;
  replyText?: string;
  status: 'PENDING' | 'REPLIED';
  createdAt: string;
  repliedAt?: string;
}

export interface VendorProductReview {
  id: string;
  vendorId: string;
  productId: string;
  productName: string;
  customerId: string;
  customerName: string;
  rating: number; // 1-5
  reviewTitle: string;
  reviewComment: string;
  verifiedPurchase: boolean;
  vendorResponse?: string;
  createdAt: string;
}




export interface VendorNotification {
  id: string;
  vendorId: string;
  title: string;
  message: string;
  category: 'ORDER' | 'PAYMENT' | 'ADMIN' | 'PRODUCT' | 'ANNOUNCEMENT';
  isRead: boolean;
  link?: string;
  createdAt: string;
}
