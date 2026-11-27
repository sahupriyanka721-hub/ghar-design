import {
  PlatformGlobalSettings,
  getPlatformGlobalSettings,
  savePlatformGlobalSettings,
} from './adminStore.js';

import { broadcastStoreUpdate } from './customerStore.js';

// ==============================================================================
// 1. GENERAL SETTINGS
// ==============================================================================
export interface GeneralSettingsData {
  siteName: string;
  tagline: string;
  legalEntityName: string;
  cinNumber: string;
  supportEmail: string;
  supportPhone: string;
  headquartersAddress: string;
  defaultTimezone: string;
  currencySymbol: string;
  maintenanceMode: boolean;
  maintenanceNotice: string;
}

// ==============================================================================
// 2. PAYMENT GATEWAY SETTINGS
// ==============================================================================
export interface PaymentGatewaySettingsData {
  primaryGateway: 'RAZORPAY' | 'CASHFREE' | 'STRIPE' | 'PAYU';
  environment: 'SANDBOX' | 'PRODUCTION';
  keyId: string;
  keySecret: string;
  webhookSecret: string;
  webhookEndpoint: string;
  enableUpi: boolean;
  enableCards: boolean;
  enableNetbanking: boolean;
  enableEmi: boolean;
  autoCapture: boolean;
  surchargePercent: number;
}

// ==============================================================================
// 3. PAYOUT SETTINGS
// ==============================================================================
export interface PayoutSettingsData {
  payoutEngine: 'RAZORPAY_X' | 'CASHFREE_PAYOUTS' | 'DIRECT_BANK_NEFT';
  escrowHoldDays: number;
  minPayoutThresholdRupees: number;
  maxSinglePayoutRupees: number;
  autoApproveThresholdRupees: number;
  dualSignOffRequired: boolean;
  pennyDropVerification: boolean;
  batchPayoutWindow: string;
  instantUpiPayouts: boolean;
}

// ==============================================================================
// 4. OTP SETTINGS
// ==============================================================================
export interface OtpSettingsData {
  otpGatewayProvider: 'FAST2SMS_DLT' | 'TWILIO' | 'MSG91' | 'GUPSHUP';
  otpLength: 4 | 6;
  otpValiditySeconds: number;
  maxRetryAttempts: number;
  resendCooldownSeconds: number;
  enableWhatsAppFallback: boolean;
  whatsAppFallbackSeconds: number;
  testBypassPhoneNumbers: string;
  universalTestOtp: string;
}

// ==============================================================================
// 5. EMAIL / SMS SETTINGS
// ==============================================================================
export interface EmailSmsSettingsData {
  smtpProvider: 'AWS_SES' | 'SENDGRID' | 'POSTMARK' | 'GOOGLE_WORKSPACE';
  smtpHost: string;
  smtpPort: number;
  senderName: string;
  senderEmail: string;
  dltSenderHeader: string;
  dltEntityId: string;
  notifyOnQuotationSubmitted: boolean;
  notifyOnMilestoneReleased: boolean;
  notifyOnInspectionSigned: boolean;
  notifyOnPayoutSettled: boolean;
}

// ==============================================================================
// 6. TAX SETTINGS
// ==============================================================================
export interface TaxSettingsData {
  corporateGstin: string;
  corporatePan: string;
  standardGstRatePercent: number;
  hsnSacArchitecture: string;
  hsnSacConstruction: string;
  tdsEcommerceSection194O: number;
  tdsProfessionalSection194J: number;
  invoicePrefix: string;
  einvoicingEnabled: boolean;
  digitalSignatureEnabled: boolean;
}

// ==============================================================================
// 7. DOCUMENT SETTINGS
// ==============================================================================
export interface DocumentSettingsData {
  allowedExtensions: string;
  maxUploadSizeMb: number;
  maxImageSizeMb: number;
  watermarkUnpaidDrawings: boolean;
  watermarkText: string;
  storageProvider: 'AWS_S3_MUMBAI' | 'CLOUDFLARE_R2' | 'GOOGLE_CLOUD_MUMBAI';
  storageBucketName: string;
  documentRetentionYears: number;
  virusScanEnabled: boolean;
}

// ==============================================================================
// 8. SECURITY SETTINGS
// ==============================================================================
export interface SecuritySettingsData {
  enforceAdminMfa: boolean;
  sessionTimeoutMinutes: number;
  maxFailedLoginsBeforeLock: number;
  lockoutDurationMinutes: number;
  maskPiiInUi: boolean;
  ipWhitelistingEnabled: boolean;
  whitelistedIps: string;
  auditLogRetentionDays: number;
  immutableAuditMode: boolean;
}

// ==============================================================================
// UNIFIED PLATFORM SETTINGS MASTER RECORD
// ==============================================================================
export interface MasterPlatformSettings {
  general: GeneralSettingsData;
  paymentGateway: PaymentGatewaySettingsData;
  payout: PayoutSettingsData;
  otp: OtpSettingsData;
  emailSms: EmailSmsSettingsData;
  tax: TaxSettingsData;
  document: DocumentSettingsData;
  security: SecuritySettingsData;
}

export const DEFAULT_PLATFORM_MASTER_SETTINGS: MasterPlatformSettings = {
  general: {
    siteName: 'BuildGhar India',
    tagline: "India's Premier Architecture & Construction Network",
    legalEntityName: 'BuildGhar Tech Solutions Pvt Ltd',
    cinNumber: 'U72900DL2024PTC123456',
    supportEmail: 'support@buildghar.com',
    supportPhone: '+91 8319955741',
    headquartersAddress: 'Level 6, Cyber Green Tower B, DLF Cyber City, Gurugram, Haryana - 122002',
    defaultTimezone: 'Asia/Kolkata (IST +5:30)',
    currencySymbol: 'INR ₹',
    maintenanceMode: false,
    maintenanceNotice: 'BuildGhar is temporarily undergoing scheduled structural upgrades. We will be back shortly.',
  },
  paymentGateway: {
    primaryGateway: 'RAZORPAY',
    environment: 'SANDBOX',
    keyId: 'rzp_test_buildghar_2026',
    keySecret: '••••••••••••••••••••••••',
    webhookSecret: 'whsec_BuildGharEscrow2026',
    webhookEndpoint: 'https://api.buildghar.com/v1/webhooks/escrow',
    enableUpi: true,
    enableCards: true,
    enableNetbanking: true,
    enableEmi: true,
    autoCapture: true,
    surchargePercent: 1.8,
  },
  payout: {
    payoutEngine: 'RAZORPAY_X',
    escrowHoldDays: 3,
    minPayoutThresholdRupees: 1000,
    maxSinglePayoutRupees: 1000000,
    autoApproveThresholdRupees: 50000,
    dualSignOffRequired: true,
    pennyDropVerification: true,
    batchPayoutWindow: 'DAILY_11AM_4PM',
    instantUpiPayouts: true,
  },
  otp: {
    otpGatewayProvider: 'FAST2SMS_DLT',
    otpLength: 6,
    otpValiditySeconds: 300,
    maxRetryAttempts: 3,
    resendCooldownSeconds: 30,
    enableWhatsAppFallback: true,
    whatsAppFallbackSeconds: 25,
    testBypassPhoneNumbers: '+919999999999, +919876543210',
    universalTestOtp: '123456',
  },
  emailSms: {
    smtpProvider: 'AWS_SES',
    smtpHost: 'email-smtp.ap-south-1.amazonaws.com',
    smtpPort: 587,
    senderName: 'BuildGhar India',
    senderEmail: 'notifications@buildghar.com',
    dltSenderHeader: 'BLDGHR',
    dltEntityId: '1401567890000012345',
    notifyOnQuotationSubmitted: true,
    notifyOnMilestoneReleased: true,
    notifyOnInspectionSigned: true,
    notifyOnPayoutSettled: true,
  },
  tax: {
    corporateGstin: '07AAAAA0000A1Z5',
    corporatePan: 'AAAAA0000A',
    standardGstRatePercent: 18,
    hsnSacArchitecture: '998321',
    hsnSacConstruction: '995411',
    tdsEcommerceSection194O: 1.0,
    tdsProfessionalSection194J: 10.0,
    invoicePrefix: 'BG/26-27/INV-',
    einvoicingEnabled: true,
    digitalSignatureEnabled: true,
  },
  document: {
    allowedExtensions: '.dwg, .dxf, .pdf, .rvt, .skp, .jpg, .jpeg, .png, .zip',
    maxUploadSizeMb: 150,
    maxImageSizeMb: 25,
    watermarkUnpaidDrawings: true,
    watermarkText: 'BUILDGHAR CONFIDENTIAL - ESCROW PROTECTED',
    storageProvider: 'AWS_S3_MUMBAI',
    storageBucketName: 'buildghar-production-drawings',
    documentRetentionYears: 7,
    virusScanEnabled: true,
  },
  security: {
    enforceAdminMfa: true,
    sessionTimeoutMinutes: 60,
    maxFailedLoginsBeforeLock: 5,
    lockoutDurationMinutes: 30,
    maskPiiInUi: true,
    ipWhitelistingEnabled: false,
    whitelistedIps: '103.21.244.0/24, 14.139.0.0/16',
    auditLogRetentionDays: 365,
    immutableAuditMode: true,
  },
};

const MASTER_SETTINGS_KEY = 'platform_unified_master_settings_v1';

export const getMasterPlatformSettings = (): MasterPlatformSettings => {
  try {
    const raw = localStorage.getItem(MASTER_SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        general: { ...DEFAULT_PLATFORM_MASTER_SETTINGS.general, ...(parsed.general || {}) },
        paymentGateway: { ...DEFAULT_PLATFORM_MASTER_SETTINGS.paymentGateway, ...(parsed.paymentGateway || {}) },
        payout: { ...DEFAULT_PLATFORM_MASTER_SETTINGS.payout, ...(parsed.payout || {}) },
        otp: { ...DEFAULT_PLATFORM_MASTER_SETTINGS.otp, ...(parsed.otp || {}) },
        emailSms: { ...DEFAULT_PLATFORM_MASTER_SETTINGS.emailSms, ...(parsed.emailSms || {}) },
        tax: { ...DEFAULT_PLATFORM_MASTER_SETTINGS.tax, ...(parsed.tax || {}) },
        document: { ...DEFAULT_PLATFORM_MASTER_SETTINGS.document, ...(parsed.document || {}) },
        security: { ...DEFAULT_PLATFORM_MASTER_SETTINGS.security, ...(parsed.security || {}) },
      };
    }
  } catch {}
  return DEFAULT_PLATFORM_MASTER_SETTINGS;
};

export const saveMasterPlatformSettings = (
  updated: Partial<MasterPlatformSettings>
): MasterPlatformSettings => {
  const current = getMasterPlatformSettings();
  const merged: MasterPlatformSettings = {
    general: { ...current.general, ...(updated.general || {}) },
    paymentGateway: { ...current.paymentGateway, ...(updated.paymentGateway || {}) },
    payout: { ...current.payout, ...(updated.payout || {}) },
    otp: { ...current.otp, ...(updated.otp || {}) },
    emailSms: { ...current.emailSms, ...(updated.emailSms || {}) },
    tax: { ...current.tax, ...(updated.tax || {}) },
    document: { ...current.document, ...(updated.document || {}) },
    security: { ...current.security, ...(updated.security || {}) },
  };

  try {
    localStorage.setItem(MASTER_SETTINGS_KEY, JSON.stringify(merged));

    // Synchronize backwards compatibility with adminStore.ts
    savePlatformGlobalSettings({
      siteName: merged.general.siteName,
      supportEmail: merged.general.supportEmail,
      supportPhone: merged.general.supportPhone,
      gstRatePercent: merged.tax.standardGstRatePercent,
      escrowHoldDays: merged.payout.escrowHoldDays,
      maintenanceMode: merged.general.maintenanceMode,
      paymentGatewayProvider: `${merged.paymentGateway.primaryGateway} (${merged.paymentGateway.environment})`,
      smsGatewayProvider: merged.otp.otpGatewayProvider,
    });

    broadcastStoreUpdate('PLATFORM_SETTINGS_UPDATED', merged);
  } catch {}

  return merged;
};

export const restoreFactorySettings = (): MasterPlatformSettings => {
  localStorage.removeItem(MASTER_SETTINGS_KEY);
  broadcastStoreUpdate('PLATFORM_SETTINGS_UPDATED', DEFAULT_PLATFORM_MASTER_SETTINGS);
  return DEFAULT_PLATFORM_MASTER_SETTINGS;
};
