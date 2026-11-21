import { z } from 'zod';

// Phone number regex for 10-digit Indian numbers starting with 6, 7, 8, 9
export const indianPhoneRegex = /^[6-9]\d{9}$/;
export const indianPinCodeRegex = /^[1-9][0-9]{5}$/;

// OTP request and verify
export const requestOtpSchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(indianPhoneRegex, 'Please enter a valid 10-digit Indian mobile number'),
  name: z.string().trim().min(2, 'Name must be at least 2 characters').optional(),
  role: z.enum(['CUSTOMER', 'PROFESSIONAL', 'ADMIN']).default('CUSTOMER'),
});

export const verifyOtpSchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(indianPhoneRegex, 'Please enter a valid 10-digit Indian mobile number'),
  otp: z
    .string()
    .trim()
    .length(6, 'OTP must be 6 digits')
    .regex(/^\d+$/, 'OTP must be numeric'),
});

// -------------------------------------------------------------
// CUSTOMER SIGNUP SCHEMA (Section 2.1)
// -------------------------------------------------------------
export const customerSignupSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters'),
  mobileNumber: z
    .string()
    .trim()
    .regex(indianPhoneRegex, 'Please enter a valid 10-digit Indian mobile number'),
  housePlotNumber: z.string().trim().min(1, 'House/Flat/Plot number is required'),
  streetLocality: z.string().trim().min(2, 'Street/Locality is required'),
  city: z.string().trim().min(2, 'City is required'),
  state: z.string().trim().min(2, 'State is required'),
  pinCode: z.string().trim().regex(indianPinCodeRegex, 'Please enter a valid 6-digit PIN code'),
  country: z.string().trim().default('India'),
  email: z.string().trim().email('Invalid email address').optional().or(z.literal('')),
  landmark: z.string().trim().optional(),
  alternateContact: z
    .string()
    .trim()
    .regex(indianPhoneRegex, 'Alternate number must be a valid 10-digit Indian number')
    .optional()
    .or(z.literal('')),
});

export type CustomerSignupInput = z.infer<typeof customerSignupSchema>;

// -------------------------------------------------------------
// CUSTOMER ADDRESS SCHEMA
// -------------------------------------------------------------
export const customerAddressSchema = z.object({
  id: z.string().optional(),
  label: z.string().min(1, 'Address label is required (e.g. Home, Site Office)'),
  houseNo: z.string().min(1, 'House/Plot number is required'),
  street: z.string().min(1, 'Street is required'),
  locality: z.string().min(1, 'Locality is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  pinCode: z.string().regex(indianPinCodeRegex, 'Valid 6-digit PIN code required'),
  country: z.string().default('India'),
  landmark: z.string().optional(),
  isDefaultBilling: z.boolean().default(false),
  isDefaultDelivery: z.boolean().default(false),
});

// -------------------------------------------------------------
// PASSWORD & ACCOUNT SECURITY SCHEMA (Section 2.3 & 11.2)
// -------------------------------------------------------------
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().optional(),
    newPassword: z
      .string()
      .min(8, 'New password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    confirmPassword: z.string(),
    invalidateOtherSessions: z.boolean().default(true),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

// -------------------------------------------------------------
// PROJECT REQUEST WIZARD SCHEMAS (Section 6.1)
// -------------------------------------------------------------
export const step1ServiceCategorySchema = z.object({
  categorySlug: z.string().min(1, 'Please select a primary service category'),
});

export const step2PropertyDetailsSchema = z.object({
  propertyType: z.enum([
    'EMPTY_PLOT',
    'EXISTING_HOUSE',
    'FLAT_APARTMENT',
    'COMMERCIAL_PROPERTY',
    'VILLA_BUNGALOW',
  ]),
  plotWidth: z.number().positive('Width must be greater than 0'),
  plotLength: z.number().positive('Length must be greater than 0'),
  measurementUnit: z.enum(['FEET', 'METRES']),
  builtUpArea: z.number().nonnegative().optional().nullable(),
  floors: z.number().int().min(1, 'Minimum 1 floor').max(10, 'Maximum 10 floors'),
  bedrooms: z.number().int().min(0, 'Cannot be negative'),
  bathrooms: z.number().int().min(0, 'Cannot be negative'),
  kitchens: z.number().int().min(0, 'Cannot be negative'),
  currentCondition: z.string().min(3, 'Please describe current condition'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  locality: z.string().min(2, 'Locality is required'),
  address: z.string().optional().nullable(),
  ownershipConfirmed: z.boolean().refine((val) => val === true, {
    message: 'You must confirm property ownership or authorization',
  }),
});

export const step3RequiredServicesSchema = z.object({
  requiredServices: z
    .array(z.string())
    .min(1, 'Please select at least one required service'),
});

export const step4AdditionalDetailsSchema = z.object({
  budgetRange: z.string().min(1, 'Please select approximate budget range'),
  preferredStartDate: z.string().optional().nullable(),
  expectedCompletionDate: z.string().optional().nullable(),
  description: z
    .string()
    .min(20, 'Please provide a detailed description (minimum 20 characters)'),
  designStyle: z.string().optional().nullable(),
  siteAccessibilityNotes: z.string().optional().nullable(),
});

export const step5ReviewSchema = z.object({
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: 'You must accept the terms and conditions to proceed',
  }),
});

export const createProjectRequestSchema = z
  .object({
    ...step1ServiceCategorySchema.shape,
    ...step2PropertyDetailsSchema.shape,
    ...step3RequiredServicesSchema.shape,
    ...step4AdditionalDetailsSchema.shape,
    termsAccepted: z.boolean().refine((val) => val === true),
  })
  .transform((data) => {
    const plotArea = Math.round(data.plotWidth * data.plotLength * 100) / 100;
    return {
      ...data,
      plotArea,
    };
  });

// -------------------------------------------------------------
// BOOK SERVICE WIZARD (Section 7.1)
// -------------------------------------------------------------
export const bookServiceSchema = z.object({
  serviceType: z.string().min(1, 'Please select a service type'),
  quotationId: z.string().optional().nullable(),
  projectName: z.string().min(2, 'Project / Property reference is required'),
  visitDate: z.string().min(10, 'Please select an appointment date'),
  visitTimeSlot: z.string().min(1, 'Please select an available time slot'),
  siteAddress: z.string().min(10, 'Full site visit address is required'),
  notes: z.string().optional(),
  agreedToTerms: z.boolean().refine((val) => val === true, {
    message: 'You must agree to service terms',
  }),
});

// -------------------------------------------------------------
// SUPPORT TICKET SCHEMA (Section 12.1)
// -------------------------------------------------------------
export const supportTicketSchema = z.object({
  category: z.enum(['QUOTATION', 'BILLING', 'PROJECT_EXECUTION', 'MATERIALS', 'GENERAL']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  description: z.string().min(15, 'Please provide detailed description'),
  relatedReference: z.string().optional(),
});

// -------------------------------------------------------------
// MATERIAL ORDER & BULK QUOTE SCHEMA (Section 8.1)
// -------------------------------------------------------------
export const bulkQuoteRequestSchema = z.object({
  productId: z.string().min(1),
  productName: z.string().min(1),
  quantity: z.number().positive('Quantity must be greater than 0'),
  unit: z.string(),
  deliveryLocation: z.string().min(3, 'Delivery city or PIN code required'),
  requiredByDate: z.string().optional(),
  notes: z.string().optional(),
});

// -------------------------------------------------------------
// DESIGN APPROVAL ACTION SCHEMA (Section 7.3 & 12.4)
// -------------------------------------------------------------
export const designApprovalActionSchema = z.object({
  documentId: z.string().min(1),
  version: z.string().min(1),
  action: z.enum(['APPROVE', 'REQUEST_CHANGES']),
  comments: z.string().min(5, 'Please provide comments or revision requests'),
});

// -------------------------------------------------------------
// FINAL SETTLEMENT DISPUTE SCHEMA (Section 9.3)
// -------------------------------------------------------------
export const finalSettlementDisputeSchema = z.object({
  settlementId: z.string().min(1),
  reason: z.string().min(10, 'Please describe reason for dispute'),
  disputedLineItems: z.array(z.string()).optional(),
});

// -------------------------------------------------------------
// CUSTOMER REVIEW SCHEMA (Section 12.6)
// -------------------------------------------------------------
export const customerReviewSchema = z.object({
  bookingId: z.string().min(1),
  overallRating: z.number().min(1).max(5),
  qualityRating: z.number().min(1).max(5),
  punctualityRating: z.number().min(1).max(5),
  comment: z.string().min(10, 'Please write at least 10 characters of feedback'),
});

// Professional Quotation schemas
export const quotationLineItemSchema = z.object({
  description: z.string().min(3),
  quantity: z.number().positive(),
  unit: z.string().min(1),
  unitPricePaise: z.number().int().nonnegative(),
  totalPaise: z.number().int().nonnegative(),
});

export const quotationMilestoneSchema = z.object({
  title: z.string().min(2),
  percentage: z.number().min(1).max(100),
  amountPaise: z.number().int().nonnegative(),
  description: z.string().optional(),
});

export const createQuotationSchema = z.object({
  requestId: z.string().min(1),
  scopeOfWork: z.string().min(20),
  lineItems: z.array(quotationLineItemSchema).min(1),
  discountPaise: z.number().int().nonnegative().default(0),
  taxPaise: z.number().int().nonnegative().default(0),
  includedDeliverables: z.array(z.string()).min(1),
  excludedWork: z.array(z.string()).min(1),
  revisionsCount: z.number().int().min(0).default(2),
  drawingFormats: z.array(z.string()).default(['PDF', 'DWG']),
  siteVisitChargesPaise: z.number().int().nonnegative().default(0),
  estimatedDurationDays: z.number().int().positive(),
  advancePercentage: z.number().min(0).max(100).default(20),
  milestones: z.array(quotationMilestoneSchema).min(1),
  validUntil: z.string().min(10),
  cancellationTerms: z.string().min(10),
  additionalTerms: z.string().optional().nullable(),
});

export const assignProfessionalsSchema = z.object({
  requestId: z.string().min(1),
  professionalIds: z.array(z.string()).min(1).max(4),
  responseDeadlineDays: z.number().int().min(1).max(14).default(3),
  adminNotes: z.string().optional().nullable(),
});

export const reviewQuotationSchema = z.object({
  quotationId: z.string().min(1),
  action: z.enum(['APPROVE', 'REQUEST_CHANGES', 'REJECT']),
  feedback: z.string().optional().nullable(),
});
