import { broadcastStoreUpdate } from './customerStore.js';
import { getExecutionProjects } from './projectExecutionStore.js';

// ==============================================================================
// BUILDGHAR MASTER FINANCIAL LEDGER & ESCROW DISBURSEMENT STORE
// Specification: Sections 12, 13, 16 - Customer Payments, Payouts, Ledger & Invoices
// Strict Governance: Customer -> Platform Escrow -> Admin Audit -> Partner Payout
// ==============================================================================

export type PaymentMethodType = 'RAZORPAY_UPI' | 'RAZORPAY_CARD' | 'NET_BANKING' | 'NEFT_RTGS' | 'BANK_TRANSFER';
export type PaymentVerificationStatus = 'PENDING_VERIFICATION' | 'VERIFIED_SUCCESSFUL' | 'FAILED' | 'REFUND_REQUESTED' | 'REFUNDED';
export type PayoutStatus = 'ELIGIBLE' | 'PENDING_APPROVAL' | 'PROCESSING' | 'PAID' | 'HELD' | 'REJECTED';
export type InvoiceType = 'CUSTOMER_TAX_INVOICE' | 'CUSTOMER_PAYMENT_RECEIPT' | 'ARCHITECT_PAYOUT_VOUCHER' | 'PLATFORM_COMMISSION_NOTE';

export interface CustomerPaymentItem {
  id: string; // e.g. PAY-2026-001
  paymentCode: string;
  projectId: string; // Shared Project ID e.g. BG-2026-0001
  projectTitle: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  architectId?: string;
  architectName?: string;
  milestoneId?: string;
  milestoneTitle?: string;
  purpose: 'MILESTONE_PAYMENT' | 'BOOKING_ADVANCE' | 'REQUEST_FEE' | 'MATERIAL_ORDER' | 'CHANGE_ORDER';
  grossAmountPaise: number;
  taxPaise: number; // 18% GST component
  subtotalPaise: number;
  paymentMethod: PaymentMethodType;
  gatewayOrderId: string;
  gatewayPaymentId: string;
  gatewaySignature?: string;
  status: PaymentVerificationStatus;
  createdAt: string;
  verifiedAt?: string;
  verifiedBy?: string;
  verificationNotes?: string;
  refundReason?: string;
  refundedAt?: string;
  associatedInvoiceId?: string;
  failureReason?: string;
  retryUrl?: string;
  gatewayFeePaise?: number; // e.g. 2% gateway fee
  gatewayTaxPaise?: number; // 18% GST on gateway fee
  netSettledPaise?: number; // Net amount credited to platform bank account
  settlementBatchId?: string;
  reconciliationStatus?: 'MATCHED' | 'UNMATCHED' | 'PENDING_RECONCILIATION';
  bankUtrNumber?: string;
}

export interface ArchitectPayoutItem {
  id: string; // e.g. PAYOUT-2026-001
  payoutCode: string;
  projectId: string; // BG-2026-XXXX
  projectTitle: string;
  architectId: string;
  architectName: string;
  architectFirm: string;
  architectPhone: string;
  milestoneId: string;
  milestoneTitle: string;
  customerPaymentId: string;
  customerPaymentRef: string;
  customerName: string;
  grossCollectedPaise: number;
  platformCommissionPercent: number; // e.g. 10%
  platformCommissionPaise: number;
  tdsDeductionPercent: number; // e.g. 1% TDS u/s 194M / 194C
  tdsDeductionPaise: number;
  otherDeductionsPaise: number;
  netPayablePaise: number;
  status: PayoutStatus;
  createdAt: string;
  approvedAt?: string;
  approvedBy?: string;
  paidAt?: string;
  utrNumber?: string;
  bankName?: string;
  accountNumberMasked?: string;
  ifscCode?: string;
  transferProofUrl?: string;
  holdReason?: string;
  failureReason?: string;
  reconciliationStatus?: 'MATCHED' | 'UNMATCHED' | 'PENDING_RECONCILIATION';
  notes?: string;
  associatedInvoiceId?: string;
}

export interface LedgerEntry {
  id: string;
  timestamp: string;
  transactionType: 'CUSTOMER_PAYMENT' | 'PLATFORM_COMMISSION' | 'TDS_WITHHOLDING' | 'PARTNER_PAYOUT' | 'REFUND_DISBURSEMENT';
  referenceId: string;
  projectId: string;
  description: string;
  debitPaise: number;
  creditPaise: number;
  runningEscrowBalancePaise: number;
  authorizedBy: string;
}

export interface TaxInvoiceItem {
  id: string; // e.g. INV-2026-CUST-1001
  invoiceNumber: string;
  invoiceType: InvoiceType;
  invoiceDate: string;
  dueDate?: string;
  projectId: string;
  projectTitle: string;
  // Billed To
  billedToName: string;
  billedToPhone: string;
  billedToAddress: string;
  billedToGstin?: string;
  // Billed By
  billedByName: string;
  billedByGstin: string;
  billedByPan: string;
  billedByAddress: string;
  // Line items
  items: Array<{
    description: string;
    hsnSacCode: string;
    quantity: number;
    ratePaise: number;
    amountPaise: number;
  }>;
  subtotalPaise: number;
  cgstPaise: number; // 9%
  sgstPaise: number; // 9%
  igstPaise: number; // 18% if inter-state
  totalTaxPaise: number;
  grandTotalPaise: number;
  paymentStatus: 'PAID' | 'PENDING' | 'CANCELLED';
  linkedTransactionId?: string;
}

// Storage Keys
const STORAGE_KEYS = {
  PAYMENTS: 'gd_financial_customer_payments_v2',
  PAYOUTS: 'gd_financial_architect_payouts_v2',
  LEDGER: 'gd_financial_general_ledger_v2',
  INVOICES: 'gd_financial_tax_invoices_v2',
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

// ==============================================================================
// SEED FINANCIAL DATA (Section 12 & 13 Multi-Party Compliance)
// ==============================================================================
export const getDefaultSeedPayments = (): CustomerPaymentItem[] => [
  {
    id: 'PAY-2026-0001',
    paymentCode: 'GHR-PAY-2026-1001',
    projectId: 'BG-2026-0001',
    projectTitle: 'Modern Luxury Villa (G+2) - Super Corridor, Indore',
    customerId: 'CUST-IND-992',
    customerName: 'Sharika Mishra',
    customerPhone: '+91 98765 43210',
    customerEmail: 'sharika.mishra@gmail.com',
    architectId: 'ARC-2026-001',
    architectName: 'Ar. Rajesh Verma',
    milestoneId: 'ms-1',
    milestoneTitle: 'Mobilization & Architectural Sign-off',
    purpose: 'MILESTONE_PAYMENT',
    subtotalPaise: 15000000, // ₹1,50,000
    taxPaise: 2700000, // 18% GST ₹27,000
    grossAmountPaise: 17700000, // ₹1,77,000
    paymentMethod: 'RAZORPAY_UPI',
    gatewayOrderId: 'order_rzp_bg_indore_001',
    gatewayPaymentId: 'pay_rzp_984210984',
    gatewaySignature: 'sig_verified_sha256_mock_001',
    status: 'VERIFIED_SUCCESSFUL',
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    verifiedAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    verifiedBy: 'Super Admin',
    verificationNotes: 'Escrow deposit verified via Razorpay webhook. Webhook signature validated.',
    associatedInvoiceId: 'INV-2026-CUST-1001',
    gatewayFeePaise: 354000,
    gatewayTaxPaise: 63720,
    netSettledPaise: 17282280,
    settlementBatchId: 'SETTLE-RZP-2026-041',
    reconciliationStatus: 'MATCHED',
    bankUtrNumber: 'HDFCR520261117009842',
  },
  {
    id: 'PAY-2026-0002',
    paymentCode: 'GHR-PAY-2026-1002',
    projectId: 'BG-2026-0001',
    projectTitle: 'Modern Luxury Villa (G+2) - Super Corridor, Indore',
    customerId: 'CUST-IND-992',
    customerName: 'Sharika Mishra',
    customerPhone: '+91 98765 43210',
    customerEmail: 'sharika.mishra@gmail.com',
    architectId: 'ARC-2026-001',
    architectName: 'Ar. Rajesh Verma',
    milestoneId: 'ms-2',
    milestoneTitle: 'Concept Floor Plan & Vastu Zoning',
    purpose: 'MILESTONE_PAYMENT',
    subtotalPaise: 25000000, // ₹2,50,000
    taxPaise: 4500000, // 18% GST ₹45,000
    grossAmountPaise: 29500000, // ₹2,95,000
    paymentMethod: 'NET_BANKING',
    gatewayOrderId: 'order_rzp_bg_indore_002',
    gatewayPaymentId: 'pay_rzp_984210999',
    status: 'VERIFIED_SUCCESSFUL',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    verifiedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    verifiedBy: 'Finance Manager',
    verificationNotes: 'HDFC Corporate NetBanking credit reflected in BuildGhar platform escrow account.',
    associatedInvoiceId: 'INV-2026-CUST-1002',
    gatewayFeePaise: 200000,
    gatewayTaxPaise: 36000,
    netSettledPaise: 29264000,
    settlementBatchId: 'SETTLE-RZP-2026-048',
    reconciliationStatus: 'MATCHED',
    bankUtrNumber: 'HDFCR520261124001923',
  },
  {
    id: 'PAY-2026-0003',
    paymentCode: 'GHR-PAY-2026-1003',
    projectId: 'BG-2026-0002',
    projectTitle: 'Independent Residential House (G+1) - Gurugram Sector 57',
    customerId: 'usr-cust-102',
    customerName: 'Vikramaditya Roy',
    customerPhone: '+91 98112 00099',
    customerEmail: 'v.roy@delhi-enterprises.com',
    architectId: 'ARC-2026-003',
    architectName: 'Ar. Sneha Kulkarni',
    milestoneId: 'ms-gur-1',
    milestoneTitle: 'Mobilization Advance & Municipal Sanctions',
    purpose: 'BOOKING_ADVANCE',
    subtotalPaise: 30000000, // ₹3,00,000
    taxPaise: 5400000, // 18% GST ₹54,000
    grossAmountPaise: 35400000, // ₹3,54,000
    paymentMethod: 'RAZORPAY_CARD',
    gatewayOrderId: 'order_rzp_bg_gur_001',
    gatewayPaymentId: 'pay_rzp_887766554',
    status: 'PENDING_VERIFICATION',
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    verificationNotes: 'Awaiting automatic gateway reconciliation batch clearance.',
    gatewayFeePaise: 708000,
    gatewayTaxPaise: 127440,
    netSettledPaise: 34564560,
    reconciliationStatus: 'PENDING_RECONCILIATION',
  },
  {
    id: 'PAY-2026-0004',
    paymentCode: 'GHR-PAY-2026-1004',
    projectId: 'BG-2026-0003',
    projectTitle: 'Contemporary 3BHK Duplex - Bodakdev, Ahmedabad',
    customerId: 'usr-cust-103',
    customerName: 'Amit Patel',
    customerPhone: '+91 98980 11223',
    customerEmail: 'amit.patel@pateltextiles.in',
    architectId: 'ARC-2026-002',
    architectName: 'Ar. Meera Sengupta',
    milestoneId: 'ms-ahmed-1',
    milestoneTitle: 'Plinth Level & Column Reinforcement',
    purpose: 'MILESTONE_PAYMENT',
    subtotalPaise: 35000000, // ₹3,50,000
    taxPaise: 6300000, // 18% GST ₹63,000
    grossAmountPaise: 41300000, // ₹4,13,000
    paymentMethod: 'NEFT_RTGS',
    gatewayOrderId: 'order_direct_neft_004',
    gatewayPaymentId: 'HDFCR52026112500892',
    status: 'PENDING_VERIFICATION',
    createdAt: new Date(Date.now() - 86400000 * 0.5).toISOString(),
    verificationNotes: 'Customer submitted NEFT counterfoil. Pending bank statement ledger match.',
    reconciliationStatus: 'PENDING_RECONCILIATION',
    bankUtrNumber: 'HDFCR52026112500892',
  },
  {
    id: 'PAY-2026-0005',
    paymentCode: 'GHR-PAY-2026-1005',
    projectId: 'BG-2026-0004',
    projectTitle: 'Traditional Haveli Restoration - Mansarovar, Jaipur',
    customerId: 'usr-cust-104',
    customerName: 'Priya Sharma',
    customerPhone: '+91 94140 55667',
    customerEmail: 'priya.sharma@rajasthancrafts.com',
    purpose: 'REQUEST_FEE',
    subtotalPaise: 10000000, // ₹1,00,000
    taxPaise: 1800000, // ₹18,000
    grossAmountPaise: 11800000, // ₹1,18,000
    paymentMethod: 'RAZORPAY_CARD',
    gatewayOrderId: 'order_rzp_bg_jpr_005',
    gatewayPaymentId: 'pay_rzp_failed_554433',
    status: 'FAILED',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    failureReason: 'PAYMENT_DECLINED_BY_BANK: Customer issuing bank declined transaction during 3D Secure OTP verification.',
    retryUrl: 'https://buildghar.in/pay/retry/GHR-PAY-2026-1005',
    reconciliationStatus: 'UNMATCHED',
  },
  {
    id: 'PAY-2026-0006',
    paymentCode: 'GHR-PAY-2026-1006',
    projectId: 'BG-2026-0005',
    projectTitle: 'Eco-Smart Residential Rowhouse - Sector 8, Chandigarh',
    customerId: 'usr-cust-105',
    customerName: 'Manish Aggarwal',
    customerPhone: '+91 97800 23456',
    customerEmail: 'm.aggarwal@punjabtrading.com',
    purpose: 'BOOKING_ADVANCE',
    subtotalPaise: 7500000, // ₹75,000
    taxPaise: 1350000, // ₹13,500
    grossAmountPaise: 8850000, // ₹88,500
    paymentMethod: 'RAZORPAY_UPI',
    gatewayOrderId: 'order_rzp_bg_chd_006',
    gatewayPaymentId: 'pay_rzp_failed_667788',
    status: 'FAILED',
    createdAt: new Date(Date.now() - 86400000 * 1.5).toISOString(),
    failureReason: 'UPI_TRANSACTION_LIMIT_EXCEEDED: Bank daily UPI transaction limit of ₹1,00,000 exceeded. Advised to retry via Net Banking.',
    retryUrl: 'https://buildghar.in/pay/retry/GHR-PAY-2026-1006',
    reconciliationStatus: 'UNMATCHED',
  },
  {
    id: 'PAY-2026-0007',
    paymentCode: 'GHR-PAY-2026-1007',
    projectId: 'BG-2026-0006',
    projectTitle: 'Lakeview G+3 Penthouse - Gomti Nagar, Lucknow',
    customerId: 'usr-cust-106',
    customerName: 'Rajeev Singhania',
    customerPhone: '+91 99350 44332',
    customerEmail: 'rajeev.singhania@lucknowgroup.in',
    purpose: 'BOOKING_ADVANCE',
    subtotalPaise: 12711864,
    taxPaise: 2288136,
    grossAmountPaise: 15000000, // ₹1,50,000
    paymentMethod: 'NET_BANKING',
    gatewayOrderId: 'order_rzp_bg_lko_007',
    gatewayPaymentId: 'pay_rzp_898912345',
    status: 'REFUND_REQUESTED',
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    refundReason: 'Customer requested architectural scope reduction & advance refund for uninitiated site excavation.',
    reconciliationStatus: 'MATCHED',
  },
  {
    id: 'PAY-2026-0008',
    paymentCode: 'GHR-PAY-2026-1008',
    projectId: 'BG-2026-0007',
    projectTitle: 'Heritage Bungalow Refurbishment - Salt Lake, Kolkata',
    customerId: 'usr-cust-107',
    customerName: 'Ananya Sen',
    customerPhone: '+91 98300 77889',
    customerEmail: 'ananya.sen@bengalarts.org',
    purpose: 'REQUEST_FEE',
    subtotalPaise: 2118644,
    taxPaise: 381356,
    grossAmountPaise: 2500000, // ₹25,000
    paymentMethod: 'RAZORPAY_UPI',
    gatewayOrderId: 'order_rzp_bg_kol_008',
    gatewayPaymentId: 'pay_rzp_ref_778899',
    status: 'REFUNDED',
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    refundedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    refundReason: 'Duplicate consultation deposit reversed back to customer UPI ID via Razorpay instant refund.',
    reconciliationStatus: 'MATCHED',
  },
  {
    id: 'PAY-2026-0009',
    paymentCode: 'GHR-PAY-2026-1009',
    projectId: 'BG-2026-0002',
    projectTitle: 'Independent Residential House (G+1) - Gurugram Sector 57',
    customerId: 'usr-cust-102',
    customerName: 'Vikramaditya Roy',
    customerPhone: '+91 98112 00099',
    customerEmail: 'v.roy@delhi-enterprises.com',
    architectId: 'ARC-2026-003',
    architectName: 'Ar. Sneha Kulkarni',
    milestoneId: 'ms-gur-2',
    milestoneTitle: '2D Architectural Drawings & Structural Calculation',
    purpose: 'MILESTONE_PAYMENT',
    subtotalPaise: 15000000,
    taxPaise: 2700000,
    grossAmountPaise: 17700000, // ₹1,77,000
    paymentMethod: 'NET_BANKING',
    gatewayOrderId: 'order_rzp_bg_gur_009',
    gatewayPaymentId: 'pay_rzp_991122334',
    status: 'VERIFIED_SUCCESSFUL',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    verifiedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    verifiedBy: 'Finance Manager',
    verificationNotes: 'Verified via bank direct ledger integration.',
    associatedInvoiceId: 'INV-2026-CUST-1009',
    gatewayFeePaise: 200000,
    gatewayTaxPaise: 36000,
    netSettledPaise: 17464000,
    settlementBatchId: 'SETTLE-RZP-2026-045',
    reconciliationStatus: 'MATCHED',
    bankUtrNumber: 'HDFCR520261122007812',
  },
  {
    id: 'PAY-2026-0010',
    paymentCode: 'GHR-PAY-2026-1010',
    projectId: 'BG-2026-0003',
    projectTitle: 'Contemporary 3BHK Duplex - Bodakdev, Ahmedabad',
    customerId: 'usr-cust-103',
    customerName: 'Amit Patel',
    customerPhone: '+91 98980 11223',
    customerEmail: 'amit.patel@pateltextiles.in',
    architectId: 'ARC-2026-002',
    architectName: 'Ar. Meera Sengupta',
    milestoneId: 'ms-ahmed-2',
    milestoneTitle: '3D Elevation & Interior Layout Rendering',
    purpose: 'MILESTONE_PAYMENT',
    subtotalPaise: 20000000,
    taxPaise: 3600000,
    grossAmountPaise: 23600000, // ₹2,36,000
    paymentMethod: 'RAZORPAY_UPI',
    gatewayOrderId: 'order_rzp_bg_ahmed_010',
    gatewayPaymentId: 'pay_rzp_992233445',
    status: 'VERIFIED_SUCCESSFUL',
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    verifiedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    verifiedBy: 'Super Admin',
    verificationNotes: 'Razorpay UPI payment captured and verified.',
    associatedInvoiceId: 'INV-2026-CUST-1010',
    gatewayFeePaise: 472000,
    gatewayTaxPaise: 84960,
    netSettledPaise: 23043040,
    settlementBatchId: 'SETTLE-RZP-2026-046',
    reconciliationStatus: 'MATCHED',
    bankUtrNumber: 'HDFCR520261123005544',
  },
];

export const getDefaultSeedPayouts = (): ArchitectPayoutItem[] => [
  {
    id: 'PAYOUT-2026-001',
    payoutCode: 'DISB-2026-1001',
    projectId: 'BG-2026-0001',
    projectTitle: 'Modern Luxury Villa (G+2) - Super Corridor, Indore',
    architectId: 'ARC-2026-001',
    architectName: 'Ar. Rajesh Verma',
    architectFirm: 'Verma & Associates Architects',
    architectPhone: '+91 98112 34567',
    milestoneId: 'ms-1',
    milestoneTitle: 'Mobilization & Architectural Sign-off',
    customerPaymentId: 'PAY-2026-0001',
    customerPaymentRef: 'GHR-PAY-2026-1001',
    customerName: 'Sharika Mishra',
    grossCollectedPaise: 15000000, // ₹1,50,000 subtotal
    platformCommissionPercent: 10, // 10%
    platformCommissionPaise: 1500000, // ₹15,000
    tdsDeductionPercent: 1, // 1% TDS
    tdsDeductionPaise: 150000, // ₹1,500
    otherDeductionsPaise: 0,
    netPayablePaise: 13350000, // ₹1,33,500
    status: 'PAID',
    createdAt: new Date(Date.now() - 86400000 * 9).toISOString(),
    approvedAt: new Date(Date.now() - 86400000 * 9).toISOString(),
    approvedBy: 'Super Admin',
    paidAt: new Date(Date.now() - 86400000 * 8).toISOString(),
    utrNumber: 'HDFCR520261118009842',
    bankName: 'HDFC Bank',
    accountNumberMasked: '•••• •••• 4912',
    ifscCode: 'HDFC0001248',
    reconciliationStatus: 'MATCHED',
    notes: 'NEFT transfer confirmed by bank gateway. Payout statement issued.',
    associatedInvoiceId: 'PAYOUT-INV-2026-001',
  },
  {
    id: 'PAYOUT-2026-002',
    payoutCode: 'DISB-2026-1002',
    projectId: 'BG-2026-0001',
    projectTitle: 'Modern Luxury Villa (G+2) - Super Corridor, Indore',
    architectId: 'ARC-2026-001',
    architectName: 'Ar. Rajesh Verma',
    architectFirm: 'Verma & Associates Architects',
    architectPhone: '+91 98112 34567',
    milestoneId: 'ms-2',
    milestoneTitle: 'Concept Floor Plan & Vastu Zoning',
    customerPaymentId: 'PAY-2026-0002',
    customerPaymentRef: 'GHR-PAY-2026-1002',
    customerName: 'Sharika Mishra',
    grossCollectedPaise: 25000000, // ₹2,50,000
    platformCommissionPercent: 10,
    platformCommissionPaise: 2500000, // ₹25,000
    tdsDeductionPercent: 1,
    tdsDeductionPaise: 250000, // ₹2,500
    otherDeductionsPaise: 0,
    netPayablePaise: 22250000, // ₹2,22,500
    status: 'ELIGIBLE',
    reconciliationStatus: 'PENDING_RECONCILIATION',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    notes: 'Milestone verified by Admin. Customer signoff received. Eligible for bank transfer.',
  },
  {
    id: 'PAYOUT-2026-003',
    payoutCode: 'DISB-2026-1003',
    projectId: 'BG-2026-0002',
    projectTitle: 'Independent Residential House (G+1) - Gurugram Sector 57',
    architectId: 'ARC-2026-003',
    architectName: 'Ar. Sneha Kulkarni',
    architectFirm: 'Kulkarni Atelier & Associates',
    architectPhone: '+91 98230 44556',
    milestoneId: 'ms-gur-2',
    milestoneTitle: '2D Architectural Drawings & Structural Calculation',
    customerPaymentId: 'PAY-2026-0009',
    customerPaymentRef: 'GHR-PAY-2026-1009',
    customerName: 'Vikramaditya Roy',
    grossCollectedPaise: 15000000, // ₹1,50,000
    platformCommissionPercent: 10,
    platformCommissionPaise: 1500000,
    tdsDeductionPercent: 1,
    tdsDeductionPaise: 150000,
    otherDeductionsPaise: 0,
    netPayablePaise: 13350000,
    status: 'PENDING_APPROVAL',
    reconciliationStatus: 'PENDING_RECONCILIATION',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    notes: 'Drawings approved by customer. Pending finance manager authorization gate.',
  },
  {
    id: 'PAYOUT-2026-004',
    payoutCode: 'DISB-2026-1004',
    projectId: 'BG-2026-0003',
    projectTitle: 'Contemporary 3BHK Duplex - Bodakdev, Ahmedabad',
    architectId: 'ARC-2026-002',
    architectName: 'Ar. Meera Sengupta',
    architectFirm: 'Studio Vistara Architecture',
    architectPhone: '+91 98450 12345',
    milestoneId: 'ms-ahmed-2',
    milestoneTitle: '3D Elevation & Photorealistic Renderings',
    customerPaymentId: 'PAY-2026-0010',
    customerPaymentRef: 'GHR-PAY-2026-1010',
    customerName: 'Amit Patel',
    grossCollectedPaise: 20000000, // ₹2,00,000
    platformCommissionPercent: 10,
    platformCommissionPaise: 2000000,
    tdsDeductionPercent: 1,
    tdsDeductionPaise: 200000,
    otherDeductionsPaise: 0,
    netPayablePaise: 17800000, // ₹1,78,000
    status: 'PROCESSING',
    approvedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    approvedBy: 'Finance Lead (P. Nambiar)',
    reconciliationStatus: 'PENDING_RECONCILIATION',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    notes: 'Admin authorization complete. Batch queue ready for bank NEFT disburse.',
  },
  {
    id: 'PAYOUT-2026-005',
    payoutCode: 'DISB-2026-1005',
    projectId: 'BG-2026-0002',
    projectTitle: 'Independent Residential House (G+1) - Gurugram Sector 57',
    architectId: 'ARC-2026-003',
    architectName: 'Ar. Sneha Kulkarni',
    architectFirm: 'Kulkarni Atelier & Associates',
    architectPhone: '+91 98230 44556',
    milestoneId: 'ms-gur-1',
    milestoneTitle: 'Site Survey & Concept Layout',
    customerPaymentId: 'PAY-2026-0003',
    customerPaymentRef: 'GHR-PAY-2026-1003',
    customerName: 'Vikramaditya Roy',
    grossCollectedPaise: 10000000, // ₹1,00,000
    platformCommissionPercent: 10,
    platformCommissionPaise: 1000000,
    tdsDeductionPercent: 1,
    tdsDeductionPaise: 100000,
    otherDeductionsPaise: 0,
    netPayablePaise: 8900000, // ₹89,000
    status: 'PAID',
    createdAt: new Date(Date.now() - 86400000 * 12).toISOString(),
    approvedAt: new Date(Date.now() - 86400000 * 11).toISOString(),
    approvedBy: 'Super Admin',
    paidAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    utrNumber: 'HDFCR520261122007812',
    bankName: 'ICICI Bank Corporate',
    accountNumberMasked: '•••• •••• 8821',
    ifscCode: 'ICIC0000104',
    reconciliationStatus: 'MATCHED',
    notes: 'Escrow payment cleared. Partner acknowledged receipt on portal.',
  },
  {
    id: 'PAYOUT-2026-006',
    payoutCode: 'DISB-2026-1006',
    projectId: 'BG-2026-0003',
    projectTitle: 'Contemporary 3BHK Duplex - Bodakdev, Ahmedabad',
    architectId: 'ARC-2026-002',
    architectName: 'Ar. Meera Sengupta',
    architectFirm: 'Studio Vistara Architecture',
    architectPhone: '+91 98450 12345',
    milestoneId: 'ms-ahmed-1',
    milestoneTitle: 'Concept Master Plan & Zoning Approval',
    customerPaymentId: 'PAY-2026-0004',
    customerPaymentRef: 'GHR-PAY-2026-1004',
    customerName: 'Amit Patel',
    grossCollectedPaise: 12000000, // ₹1,20,000
    platformCommissionPercent: 10,
    platformCommissionPaise: 1200000,
    tdsDeductionPercent: 1,
    tdsDeductionPaise: 120000,
    otherDeductionsPaise: 0,
    netPayablePaise: 10680000, // ₹1,06,800
    status: 'PAID',
    createdAt: new Date(Date.now() - 86400000 * 14).toISOString(),
    approvedAt: new Date(Date.now() - 86400000 * 13).toISOString(),
    approvedBy: 'Super Admin',
    paidAt: new Date(Date.now() - 86400000 * 12).toISOString(),
    utrNumber: 'HDFCR520261123005544',
    bankName: 'Axis Bank Escrow Settlement',
    accountNumberMasked: '•••• •••• 3341',
    ifscCode: 'UTIB0000256',
    reconciliationStatus: 'MATCHED',
    notes: 'Disbursement completed with e-voucher delivery.',
  },
  {
    id: 'PAYOUT-2026-007',
    payoutCode: 'DISB-2026-1007',
    projectId: 'BG-2026-0005',
    projectTitle: 'Eco-Smart Residential Rowhouse - Sector 8, Chandigarh',
    architectId: 'ARC-2026-004',
    architectName: 'Ar. Vikram Rathore',
    architectFirm: 'Rathore Heritage Studio',
    architectPhone: '+91 98720 77889',
    milestoneId: 'ms-chd-1',
    milestoneTitle: 'MEP Engineering & Plumbing Schematics',
    customerPaymentId: 'PAY-2026-0006',
    customerPaymentRef: 'GHR-PAY-2026-1006',
    customerName: 'Manish Aggarwal',
    grossCollectedPaise: 13500000, // ₹1,35,000
    platformCommissionPercent: 10,
    platformCommissionPaise: 1350000,
    tdsDeductionPercent: 1,
    tdsDeductionPaise: 135000,
    otherDeductionsPaise: 0,
    netPayablePaise: 12015000, // ₹1,20,150
    status: 'ELIGIBLE',
    reconciliationStatus: 'PENDING_RECONCILIATION',
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    notes: 'Milestone verified by Structural auditor. Escrow receipt confirmed.',
  },
  {
    id: 'PAYOUT-2026-008',
    payoutCode: 'DISB-2026-1008',
    projectId: 'BG-2026-0005',
    projectTitle: 'Eco-Smart Residential Rowhouse - Sector 8, Chandigarh',
    architectId: 'ARC-2026-004',
    architectName: 'Ar. Vikram Rathore',
    architectFirm: 'Rathore Heritage Studio',
    architectPhone: '+91 98720 77889',
    milestoneId: 'ms-chd-2',
    milestoneTitle: 'Working Drawing Set & Municipal Sanction',
    customerPaymentId: 'PAY-2026-0007',
    customerPaymentRef: 'GHR-PAY-2026-1007',
    customerName: 'Manish Aggarwal',
    grossCollectedPaise: 18000000, // ₹1,80,000
    platformCommissionPercent: 10,
    platformCommissionPaise: 1800000,
    tdsDeductionPercent: 1,
    tdsDeductionPaise: 180000,
    otherDeductionsPaise: 0,
    netPayablePaise: 16020000, // ₹1,60,200
    status: 'HELD',
    holdReason: 'Partner bank IFSC code (PUNB0024800) invalidated due to Punjab National Bank branch merger. Awaiting updated bank details.',
    failureReason: 'BANK_ACCOUNT_IFSC_INVALID: Escrow transfer bounced. Partner bank branch changed IFSC post merger.',
    reconciliationStatus: 'UNMATCHED',
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    notes: 'NEFT returned with error: INVALID_IFSC. Architect contacted to upload new cancelled cheque.',
  },
  {
    id: 'PAYOUT-2026-009',
    payoutCode: 'DISB-2026-1009',
    projectId: 'BG-2026-0001',
    projectTitle: 'Modern Luxury Villa (G+2) - Super Corridor, Indore',
    architectId: 'ARC-2026-001',
    architectName: 'Ar. Rajesh Verma',
    architectFirm: 'Verma & Associates Architects',
    architectPhone: '+91 98112 34567',
    milestoneId: 'ms-3',
    milestoneTitle: 'Structural Reinforcement Schedule (IS 456 / IS 13920)',
    customerPaymentId: 'PAY-2026-0008',
    customerPaymentRef: 'GHR-PAY-2026-1008',
    customerName: 'Sharika Mishra',
    grossCollectedPaise: 20000000, // ₹2,00,000
    platformCommissionPercent: 10,
    platformCommissionPaise: 2000000,
    tdsDeductionPercent: 1,
    tdsDeductionPaise: 200000,
    otherDeductionsPaise: 0,
    netPayablePaise: 17800000, // ₹1,78,000
    status: 'PENDING_APPROVAL',
    reconciliationStatus: 'PENDING_RECONCILIATION',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    notes: 'Milestone verified by Structural auditor. Escrow receipt confirmed.',
  },
  {
    id: 'PAYOUT-2026-010',
    payoutCode: 'DISB-2026-1010',
    projectId: 'BG-2026-0002',
    projectTitle: 'Independent Residential House (G+1) - Gurugram Sector 57',
    architectId: 'ARC-2026-003',
    architectName: 'Ar. Sneha Kulkarni',
    architectFirm: 'Kulkarni Atelier & Associates',
    architectPhone: '+91 98230 44556',
    milestoneId: 'ms-gur-3',
    milestoneTitle: 'HVAC & Electrical Ducting Plan',
    customerPaymentId: 'PAY-2026-0011',
    customerPaymentRef: 'GHR-PAY-2026-1011',
    customerName: 'Vikramaditya Roy',
    grossCollectedPaise: 11000000, // ₹1,10,000
    platformCommissionPercent: 10,
    platformCommissionPaise: 1100000,
    tdsDeductionPercent: 1,
    tdsDeductionPaise: 110000,
    otherDeductionsPaise: 0,
    netPayablePaise: 9790000, // ₹97,900
    status: 'REJECTED',
    holdReason: 'Client reported revision required on ceiling duct clearance before final payment release.',
    failureReason: 'AUDIT_HOLD: Quality inspection flagged clearance snag in ducting heights.',
    reconciliationStatus: 'UNMATCHED',
    createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
    notes: 'Payout rejected pending architectural sheet revision v2.0.',
  },
];

export const getDefaultSeedInvoices = (): TaxInvoiceItem[] => [
  {
    id: 'INV-2026-CUST-1001',
    invoiceNumber: 'BG/2026-27/INV-1001',
    invoiceType: 'CUSTOMER_TAX_INVOICE',
    invoiceDate: new Date(Date.now() - 86400000 * 10).toISOString().split('T')[0],
    projectId: 'BG-2026-0001',
    projectTitle: 'Modern Luxury Villa (G+2) - Super Corridor, Indore',
    billedToName: 'Sharika Mishra',
    billedToPhone: '+91 98765 43210',
    billedToAddress: 'Plot 42, Super Corridor, Scheme 151, Indore, MP - 452005',
    billedByName: 'BuildGhar Technologies Private Limited',
    billedByGstin: '07AAACB2489C1Z5',
    billedByPan: 'AAACB2489C',
    billedByAddress: 'Tower B, 4th Floor, Signature Towers, South City 1, Gurugram, HR - 122001',
    items: [
      {
        description: 'Architectural Project Initiation & Mobilization Advance (Milestone 1)',
        hsnSacCode: '998321', // Architectural services
        quantity: 1,
        ratePaise: 15000000,
        amountPaise: 15000000,
      },
    ],
    subtotalPaise: 15000000,
    cgstPaise: 1350000, // 9%
    sgstPaise: 1350000, // 9%
    igstPaise: 0,
    totalTaxPaise: 2700000,
    grandTotalPaise: 17700000,
    paymentStatus: 'PAID',
    linkedTransactionId: 'PAY-2026-0001',
  },
  {
    id: 'INV-2026-CUST-1002',
    invoiceNumber: 'BG/2026-27/INV-1002',
    invoiceType: 'CUSTOMER_TAX_INVOICE',
    invoiceDate: new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0],
    projectId: 'BG-2026-0001',
    projectTitle: 'Modern Luxury Villa (G+2) - Super Corridor, Indore',
    billedToName: 'Sharika Mishra',
    billedToPhone: '+91 98765 43210',
    billedToAddress: 'Plot 42, Super Corridor, Scheme 151, Indore, MP - 452005',
    billedByName: 'BuildGhar Technologies Private Limited',
    billedByGstin: '07AAACB2489C1Z5',
    billedByPan: 'AAACB2489C',
    billedByAddress: 'Tower B, 4th Floor, Signature Towers, South City 1, Gurugram, HR - 122001',
    items: [
      {
        description: 'Concept Design, Vastu Orientation & 2D Floor Plan Approval (Milestone 2)',
        hsnSacCode: '998321',
        quantity: 1,
        ratePaise: 25000000,
        amountPaise: 25000000,
      },
    ],
    subtotalPaise: 25000000,
    cgstPaise: 2250000,
    sgstPaise: 2250000,
    igstPaise: 0,
    totalTaxPaise: 4500000,
    grandTotalPaise: 29500000,
    paymentStatus: 'PAID',
    linkedTransactionId: 'PAY-2026-0002',
  },
];

// ==============================================================================
// 1. CUSTOMER PAYMENT COLLECTION CRUD
// ==============================================================================
export const getCustomerPayments = (): CustomerPaymentItem[] => {
  let list = safeJsonParse<CustomerPaymentItem[]>(STORAGE_KEYS.PAYMENTS, []);
  if (!list || list.length === 0) {
    list = getDefaultSeedPayments();
    safeJsonSave(STORAGE_KEYS.PAYMENTS, list);
  }
  return list;
};

export const saveCustomerPayment = (payment: CustomerPaymentItem): CustomerPaymentItem => {
  const all = getCustomerPayments();
  const idx = all.findIndex((p) => p.id === payment.id);
  let updated: CustomerPaymentItem[];
  if (idx >= 0) {
    updated = [...all];
    updated[idx] = payment;
  } else {
    updated = [payment, ...all];
  }
  safeJsonSave(STORAGE_KEYS.PAYMENTS, updated, 'FINANCIAL_PAYMENTS_UPDATED');
  return payment;
};

export const verifyCustomerPayment = (
  paymentId: string,
  params: { verifiedBy: string; notes?: string }
): CustomerPaymentItem | null => {
  const all = getCustomerPayments();
  const idx = all.findIndex((p) => p.id === paymentId);
  if (idx < 0) return null;

  const current = all[idx];
  const now = new Date().toISOString();

  const updated: CustomerPaymentItem = {
    ...current,
    status: 'VERIFIED_SUCCESSFUL',
    verifiedAt: now,
    verifiedBy: params.verifiedBy,
    verificationNotes: params.notes || 'Payment signature and escrow credit verified by Admin.',
  };

  all[idx] = updated;
  safeJsonSave(STORAGE_KEYS.PAYMENTS, all, 'FINANCIAL_PAYMENTS_UPDATED');

  // Record ledger entry
  recordLedgerEntry({
    id: `LEDGER-${Date.now()}`,
    timestamp: now,
    transactionType: 'CUSTOMER_PAYMENT',
    referenceId: updated.id,
    projectId: updated.projectId,
    description: `Customer collection verified for ${updated.projectTitle} (${updated.purpose})`,
    debitPaise: 0,
    creditPaise: updated.grossAmountPaise,
    runningEscrowBalancePaise: updated.grossAmountPaise,
    authorizedBy: params.verifiedBy,
  });

  return updated;
};

export const refundCustomerPayment = (
  paymentId: string,
  params: { refundedBy: string; reason: string }
): CustomerPaymentItem | null => {
  const all = getCustomerPayments();
  const idx = all.findIndex((p) => p.id === paymentId);
  if (idx < 0) return null;

  const current = all[idx];
  const now = new Date().toISOString();

  const updated: CustomerPaymentItem = {
    ...current,
    status: 'REFUNDED',
    refundedAt: now,
    refundReason: params.reason,
  };

  all[idx] = updated;
  safeJsonSave(STORAGE_KEYS.PAYMENTS, all, 'FINANCIAL_PAYMENTS_UPDATED');

  // Record debit in ledger
  recordLedgerEntry({
    id: `LEDGER-${Date.now()}-REFUND`,
    timestamp: now,
    transactionType: 'REFUND_DISBURSEMENT',
    referenceId: updated.id,
    projectId: updated.projectId,
    description: `Refund reversed to customer for ${updated.projectTitle} (Reason: ${params.reason})`,
    debitPaise: updated.grossAmountPaise,
    creditPaise: 0,
    runningEscrowBalancePaise: 0,
    authorizedBy: params.refundedBy,
  });

  return updated;
};

export const reconcileCustomerPayment = (
  paymentId: string,
  bankUtr?: string
): CustomerPaymentItem | null => {
  const all = getCustomerPayments();
  const idx = all.findIndex((p) => p.id === paymentId);
  if (idx < 0) return null;

  const current = all[idx];
  const updated: CustomerPaymentItem = {
    ...current,
    reconciliationStatus: 'MATCHED',
    bankUtrNumber: bankUtr || current.bankUtrNumber || `HDFC-REC-${Date.now().toString().slice(-6)}`,
  };

  all[idx] = updated;
  safeJsonSave(STORAGE_KEYS.PAYMENTS, all, 'FINANCIAL_PAYMENTS_UPDATED');
  return updated;
};

export const requestCustomerPaymentRefund = (
  paymentId: string,
  reason: string
): CustomerPaymentItem | null => {
  const all = getCustomerPayments();
  const idx = all.findIndex((p) => p.id === paymentId);
  if (idx < 0) return null;

  const current = all[idx];
  const updated: CustomerPaymentItem = {
    ...current,
    status: 'REFUND_REQUESTED',
    refundReason: reason,
  };

  all[idx] = updated;
  safeJsonSave(STORAGE_KEYS.PAYMENTS, all, 'FINANCIAL_PAYMENTS_UPDATED');
  return updated;
};

// ==============================================================================
// 2. ARCHITECT PAYOUT MANAGEMENT CRUD (Section 12 & 13)
// ==============================================================================
export const getArchitectPayouts = (): ArchitectPayoutItem[] => {
  let list = safeJsonParse<ArchitectPayoutItem[]>(STORAGE_KEYS.PAYOUTS, []);
  if (!list || list.length === 0) {
    list = getDefaultSeedPayouts();
    safeJsonSave(STORAGE_KEYS.PAYOUTS, list);
  }
  return list;
};

export const saveArchitectPayout = (payout: ArchitectPayoutItem): ArchitectPayoutItem => {
  const all = getArchitectPayouts();
  const idx = all.findIndex((p) => p.id === payout.id);
  let updated: ArchitectPayoutItem[];
  if (idx >= 0) {
    updated = [...all];
    updated[idx] = payout;
  } else {
    updated = [payout, ...all];
  }
  safeJsonSave(STORAGE_KEYS.PAYOUTS, updated, 'FINANCIAL_PAYOUTS_UPDATED');
  return payout;
};

/**
 * Creates an eligible payout when a milestone is verified and customer payment cleared
 */
export const createEligiblePayoutFromMilestone = (params: {
  projectId: string;
  projectTitle: string;
  architectId: string;
  architectName: string;
  architectFirm: string;
  architectPhone: string;
  milestoneId: string;
  milestoneTitle: string;
  customerPaymentId: string;
  customerPaymentRef: string;
  customerName: string;
  grossCollectedPaise: number;
  commissionPercent?: number; // defaults to 10%
  tdsPercent?: number; // defaults to 1%
}): ArchitectPayoutItem => {
  const commPct = params.commissionPercent ?? 10;
  const tdsPct = params.tdsPercent ?? 1;

  const commissionPaise = Math.round((params.grossCollectedPaise * commPct) / 100);
  const tdsPaise = Math.round((params.grossCollectedPaise * tdsPct) / 100);
  const netPayablePaise = params.grossCollectedPaise - commissionPaise - tdsPaise;

  const newPayout: ArchitectPayoutItem = {
    id: `PAYOUT-${Date.now()}`,
    payoutCode: `DISB-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    projectId: params.projectId,
    projectTitle: params.projectTitle,
    architectId: params.architectId,
    architectName: params.architectName,
    architectFirm: params.architectFirm,
    architectPhone: params.architectPhone,
    milestoneId: params.milestoneId,
    milestoneTitle: params.milestoneTitle,
    customerPaymentId: params.customerPaymentId,
    customerPaymentRef: params.customerPaymentRef,
    customerName: params.customerName,
    grossCollectedPaise: params.grossCollectedPaise,
    platformCommissionPercent: commPct,
    platformCommissionPaise: commissionPaise,
    tdsDeductionPercent: tdsPct,
    tdsDeductionPaise: tdsPaise,
    otherDeductionsPaise: 0,
    netPayablePaise,
    status: 'ELIGIBLE',
    createdAt: new Date().toISOString(),
    notes: 'Generated after technical milestone verification and cleared escrow receipt.',
  };

  saveArchitectPayout(newPayout);
  return newPayout;
};

/**
 * Admin approves payout to processing stage
 */
export const approveArchitectPayout = (
  payoutId: string,
  params: { approvedBy: string; notes?: string }
): ArchitectPayoutItem | null => {
  const all = getArchitectPayouts();
  const idx = all.findIndex((p) => p.id === payoutId);
  if (idx < 0) return null;

  const current = all[idx];
  const now = new Date().toISOString();

  const updated: ArchitectPayoutItem = {
    ...current,
    status: 'PROCESSING',
    approvedAt: now,
    approvedBy: params.approvedBy,
    notes: params.notes || current.notes,
  };

  all[idx] = updated;
  safeJsonSave(STORAGE_KEYS.PAYOUTS, all, 'FINANCIAL_PAYOUTS_UPDATED');
  return updated;
};

/**
 * Admin confirms bank transfer / dispatches escrow disbursement
 */
export const disburseArchitectPayout = (
  payoutId: string,
  params: {
    utrNumber: string;
    bankName: string;
    accountNumberMasked?: string;
    ifscCode?: string;
    notes?: string;
  }
): ArchitectPayoutItem | null => {
  const all = getArchitectPayouts();
  const idx = all.findIndex((p) => p.id === payoutId);
  if (idx < 0) return null;

  const current = all[idx];
  const now = new Date().toISOString();

  const updated: ArchitectPayoutItem = {
    ...current,
    status: 'PAID',
    paidAt: now,
    utrNumber: params.utrNumber,
    bankName: params.bankName,
    accountNumberMasked: params.accountNumberMasked || '•••• •••• 4912',
    ifscCode: params.ifscCode || 'HDFC0001248',
    notes: params.notes || 'Bank transfer completed and verified.',
  };

  all[idx] = updated;
  safeJsonSave(STORAGE_KEYS.PAYOUTS, all, 'FINANCIAL_PAYOUTS_UPDATED');

  // Record Double-Entry in Ledger
  recordLedgerEntry({
    id: `LEDGER-${Date.now()}-DISB`,
    timestamp: now,
    transactionType: 'PARTNER_PAYOUT',
    referenceId: updated.id,
    projectId: updated.projectId,
    description: `Escrow payout released to ${updated.architectName} (${updated.architectFirm}) via ${updated.bankName} (UTR: ${updated.utrNumber})`,
    debitPaise: updated.netPayablePaise,
    creditPaise: 0,
    runningEscrowBalancePaise: 0,
    authorizedBy: 'Super Admin',
  });

  return updated;
};

/**
 * Admin holds payout due to dispute or defect
 */
export const holdArchitectPayout = (payoutId: string, reason: string): ArchitectPayoutItem | null => {
  const all = getArchitectPayouts();
  const idx = all.findIndex((p) => p.id === payoutId);
  if (idx < 0) return null;

  const current = all[idx];
  const updated: ArchitectPayoutItem = {
    ...current,
    status: 'HELD',
    holdReason: reason,
  };

  all[idx] = updated;
  safeJsonSave(STORAGE_KEYS.PAYOUTS, all, 'FINANCIAL_PAYOUTS_UPDATED');
  return updated;
};

/**
 * Reconciles architect payout with bank escrow disbursement account
 */
export const reconcileArchitectPayout = (
  payoutId: string,
  bankUtr?: string
): ArchitectPayoutItem | null => {
  const all = getArchitectPayouts();
  const idx = all.findIndex((p) => p.id === payoutId);
  if (idx < 0) return null;

  const current = all[idx];
  const updated: ArchitectPayoutItem = {
    ...current,
    reconciliationStatus: 'MATCHED',
    utrNumber: bankUtr || current.utrNumber || `HDFC-REC-${Date.now().toString().slice(-6)}`,
  };

  all[idx] = updated;
  safeJsonSave(STORAGE_KEYS.PAYOUTS, all, 'FINANCIAL_PAYOUTS_UPDATED');
  return updated;
};

/**
 * Resets failed or held payout back to eligible state
 */
export const retryFailedArchitectPayout = (
  payoutId: string
): ArchitectPayoutItem | null => {
  const all = getArchitectPayouts();
  const idx = all.findIndex((p) => p.id === payoutId);
  if (idx < 0) return null;

  const current = all[idx];
  const updated: ArchitectPayoutItem = {
    ...current,
    status: 'ELIGIBLE',
    holdReason: undefined,
    failureReason: undefined,
  };

  all[idx] = updated;
  safeJsonSave(STORAGE_KEYS.PAYOUTS, all, 'FINANCIAL_PAYOUTS_UPDATED');
  return updated;
};

// ==============================================================================
// 3. FINANCIAL LEDGER CRUD (Section 13)
// ==============================================================================
export const getFinancialLedger = (): LedgerEntry[] => {
  return safeJsonParse<LedgerEntry[]>(STORAGE_KEYS.LEDGER, []);
};

export const recordLedgerEntry = (entry: LedgerEntry): void => {
  const ledger = getFinancialLedger();
  const updated = [entry, ...ledger];
  safeJsonSave(STORAGE_KEYS.LEDGER, updated, 'FINANCIAL_LEDGER_UPDATED');
};

// ==============================================================================
// 4. TAX INVOICE & BILLING CRUD (Section 16)
// ==============================================================================
export const getTaxInvoices = (): TaxInvoiceItem[] => {
  let list = safeJsonParse<TaxInvoiceItem[]>(STORAGE_KEYS.INVOICES, []);
  if (!list || list.length === 0) {
    list = getDefaultSeedInvoices();
    safeJsonSave(STORAGE_KEYS.INVOICES, list);
  }
  return list;
};

export const saveTaxInvoice = (invoice: TaxInvoiceItem): TaxInvoiceItem => {
  const all = getTaxInvoices();
  const idx = all.findIndex((i) => i.id === invoice.id);
  let updated: TaxInvoiceItem[];
  if (idx >= 0) {
    updated = [...all];
    updated[idx] = invoice;
  } else {
    updated = [invoice, ...all];
  }
  safeJsonSave(STORAGE_KEYS.INVOICES, updated, 'FINANCIAL_INVOICES_UPDATED');
  return invoice;
};
