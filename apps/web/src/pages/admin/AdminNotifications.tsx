import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Send,
  Smartphone,
  Mail,
  Users,
  ShieldCheck,
  AlertCircle,
  Eye,
  Plus,
  X,
  Radio,
  FileText,
  Compass,
  Building,
  CreditCard,
  HardHat,
  MessageSquare,
  Sparkles,
  RefreshCw,
  Sliders,
  Check,
  RotateCcw,
  ChevronDown,
  Edit,
  ArrowRight,
  ExternalLink,
  Flame,
  Layers,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext.js';
import { Badge } from '../../components/common/Badge.js';
import { formatDate } from '../../lib/utils.js';
import { logAdminAuditAction } from '../../data/adminRbacStore.js';
import { getRegisteredCustomers } from '../../data/customerStore.js';
import { getArchitectAccounts } from '../../data/architectStore.js';
import { getExecutionProjects } from '../../data/projectExecutionStore.js';

// ==============================================================================
// 16. NOTIFICATION MANAGEMENT
// Sub-Features:
// 1. Customer Notifications
// 2. Architect Notifications
// 3. Admin Notifications
// 4. Email Templates
// 5. SMS Templates
// 6. Notification History
// ==============================================================================

export type NotificationSubView =
  | 'CUSTOMER_NOTIFICATIONS'
  | 'ARCHITECT_NOTIFICATIONS'
  | 'ADMIN_NOTIFICATIONS'
  | 'EMAIL_TEMPLATES'
  | 'SMS_TEMPLATES'
  | 'NOTIFICATION_HISTORY';

export const NOTIFICATION_VIEWS: Record<
  NotificationSubView,
  { label: string; icon: any; badgeColor: string; description: string }
> = {
  CUSTOMER_NOTIFICATIONS: {
    label: 'Customer Notifications',
    icon: Users,
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    description: 'Real-time transactional and progress notifications dispatched to clients (WhatsApp, SMS, Email, In-App).',
  },
  ARCHITECT_NOTIFICATIONS: {
    label: 'Architect Notifications',
    icon: Compass,
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    description: 'Tender invites, 72h SLA alerts, drawing technical review clearances, and escrow payout dispatches sent to partners.',
  },
  ADMIN_NOTIFICATIONS: {
    label: 'Admin Notifications',
    icon: ShieldCheck,
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    description: 'Internal critical governance alerts: dispute escalations, payment gateway timeouts, and high-value tender requests.',
  },
  EMAIL_TEMPLATES: {
    label: 'Email Templates',
    icon: Mail,
    badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    description: 'Responsive HTML email templates with dynamic merge tags (Invoices, Quotation comparisons, Payout advice).',
  },
  SMS_TEMPLATES: {
    label: 'SMS Templates',
    icon: Smartphone,
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    description: 'TRAI DLT-approved transactional SMS headers (BLDGHR) and Meta-verified WhatsApp interactive message cards.',
  },
  NOTIFICATION_HISTORY: {
    label: 'Notification History',
    icon: Clock,
    badgeColor: 'bg-slate-100 text-slate-800 border-slate-200',
    description: 'Unified multi-channel dispatch audit trail with gateway reference IDs, delivery latency, and retry telemetry.',
  },
};

export type NotificationChannel = 'IN_APP' | 'WHATSAPP' | 'SMS' | 'EMAIL';
export type NotificationTarget = 'CUSTOMER' | 'ARCHITECT' | 'CONTRACTOR' | 'ADMIN';
export type NotificationEventType =
  // Customer events
  | 'QUOTATION_REQUEST_RECEIVED'
  | 'REQUEST_ASSIGNED'
  | 'QUOTATION_RECEIVED'
  | 'QUOTATION_APPROVED_BY_ADMIN'
  | 'PROJECT_CREATED'
  | 'DESIGN_APPROVED_BY_ADMIN'
  | 'DESIGN_REVISION_REQUIRED'
  | 'MILESTONE_APPROVED'
  | 'PAYMENT_RECEIVED'
  | 'COMPLAINT_UPDATED'
  // Architect events
  | 'NEW_ASSIGNMENT'
  | 'QUOTATION_APPROVED'
  | 'CUSTOMER_ACCEPTED_QUOTATION'
  | 'DESIGN_REVIEW_FEEDBACK'
  | 'MILESTONE_REVIEW_RESULT'
  | 'PAYMENT_VERIFIED'
  | 'PAYOUT_APPROVED'
  | 'PAYOUT_COMPLETED'
  | 'COMPLAINT_RECEIVED'
  // Admin alerts
  | 'DISPUTE_ESCALATED'
  | 'HIGH_VALUE_TENDER'
  | 'GATEWAY_TIMEOUT'
  | 'KYC_PENDING_APPROVAL';

export interface EventNotificationRecord {
  id: string;
  eventType: NotificationEventType;
  targetRole: NotificationTarget;
  recipientName: string;
  recipientPhone: string;
  recipientEmail?: string;
  projectId?: string;
  projectTitle?: string;
  title: string;
  body: string;
  channel: NotificationChannel;
  status: 'DELIVERED' | 'QUEUED' | 'READ' | 'FAILED';
  gatewayRef?: string;
  latencyMs?: number;
  dispatchedAt: string;
  readAt?: string;
}

export interface EmailTemplate {
  id: string;
  code: string;
  title: string;
  category: 'CUSTOMER' | 'ARCHITECT' | 'ADMIN' | 'FINANCE';
  subject: string;
  previewText: string;
  dynamicTags: string[];
  bodyHtml: string;
  status: 'ACTIVE' | 'DRAFT';
  updatedAt: string;
}

export interface SmsTemplate {
  id: string;
  templateCode: string;
  title: string;
  category: 'CUSTOMER' | 'ARCHITECT' | 'FINANCE';
  type: 'SMS' | 'WHATSAPP';
  senderHeader: string;
  dltTemplateId: string;
  messageText: string;
  charCount: number;
  variableCount: number;
  status: 'APPROVED_DLT' | 'PENDING_REGISTRATION';
  updatedAt: string;
}

const STORAGE_KEYS = {
  NOTIFICATIONS: 'gd_platform_event_notifications_v3',
  EMAIL_TEMPLATES: 'gd_platform_email_templates_v1',
  SMS_TEMPLATES: 'gd_platform_sms_templates_v1',
};

// Seed Notification Records
const getDefaultSeedNotifications = (): EventNotificationRecord[] => [
  {
    id: 'NOTIF-2026-1001',
    eventType: 'PAYMENT_RECEIVED',
    targetRole: 'CUSTOMER',
    recipientName: 'Sharika Mishra',
    recipientPhone: '+91 98765 43210',
    recipientEmail: 'sharika.m@gmail.com',
    projectId: 'BG-2026-0001',
    projectTitle: 'Modern Luxury Villa (G+2) - Super Corridor, Indore',
    title: 'Payment Credited to Platform Escrow: ₹1,77,000',
    body: 'Your payment for Milestone 1: Mobilization & Architectural Sign-off has been verified and securely deposited into BuildGhar Escrow.',
    channel: 'WHATSAPP',
    status: 'DELIVERED',
    gatewayRef: 'GUPSHUP-WA-992144',
    latencyMs: 820,
    dispatchedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: 'NOTIF-2026-1002',
    eventType: 'PAYOUT_APPROVED',
    targetRole: 'ARCHITECT',
    recipientName: 'Ar. Rajesh Verma',
    recipientPhone: '+91 98112 34567',
    recipientEmail: 'rajesh.verma@vermaarchitects.com',
    projectId: 'BG-2026-0001',
    projectTitle: 'Modern Luxury Villa (G+2) - Super Corridor, Indore',
    title: 'Escrow Payout Released: ₹1,33,500',
    body: 'Milestone 1 deliverables verified. Net payout of ₹1,33,500 (after 10% platform fee and 1% TDS) dispatched via HDFC NEFT UTR: HDFCR520261118009842.',
    channel: 'IN_APP',
    status: 'READ',
    gatewayRef: 'INAPP-DISPATCH-77821',
    latencyMs: 140,
    dispatchedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    readAt: new Date(Date.now() - 3600000 * 18).toISOString(),
  },
  {
    id: 'NOTIF-2026-1003',
    eventType: 'DESIGN_APPROVED_BY_ADMIN',
    targetRole: 'CUSTOMER',
    recipientName: 'Vikramaditya Roy',
    recipientPhone: '+91 98112 00099',
    recipientEmail: 'v.roy@delhi-enterprises.com',
    projectId: 'BG-2026-0002',
    projectTitle: 'Independent Residential House (G+1) - Gurugram Sector 57',
    title: 'Technical Review Passed: Front Elevation Drawings v2.0',
    body: 'Chief Architect has approved your setback elevation drawings complying with HUDA bylaws. Available for your review in Project Documents.',
    channel: 'EMAIL',
    status: 'DELIVERED',
    gatewayRef: 'SENDGRID-MSG-661902',
    latencyMs: 1450,
    dispatchedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'NOTIF-2026-1004',
    eventType: 'NEW_ASSIGNMENT',
    targetRole: 'ARCHITECT',
    recipientName: 'Ar. Sneha Kulkarni',
    recipientPhone: '+91 98220 11223',
    recipientEmail: 'sneha@kulkarni-designs.in',
    projectId: 'BG-2026-0002',
    projectTitle: 'Independent Residential House (G+1) - Gurugram Sector 57',
    title: 'New Quotation Request Assigned: GHR-REQ-2026-1002',
    body: 'Admin has assigned you an exclusive quotation inquiry for a 2,400 sq.ft residential plot in Sector 57, Gurugram. 72 hours SLA active.',
    channel: 'SMS',
    status: 'DELIVERED',
    gatewayRef: 'MSG91-DLT-882199',
    latencyMs: 650,
    dispatchedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'NOTIF-2026-1005',
    eventType: 'DISPUTE_ESCALATED',
    targetRole: 'ADMIN',
    recipientName: 'Super Admin Console',
    recipientPhone: '+91 90000 00001',
    recipientEmail: 'superadmin@buildghar.com',
    projectId: 'BG-2026-0003',
    projectTitle: 'Duplex Smart Eco-Home (3BHK) - Whitefield, Bengaluru',
    title: 'CRITICAL ALERT: Cantilever Slab Structural Deflection Dispute',
    body: 'Project BG-2026-0003 escalated to Super Admin desk due to 28mm cantilever deflection. Escrow payout held; independent site audit scheduled.',
    channel: 'IN_APP',
    status: 'READ',
    gatewayRef: 'SYS-ALERT-99001',
    latencyMs: 50,
    dispatchedAt: new Date(Date.now() - 86400000 * 1.5).toISOString(),
    readAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
  {
    id: 'NOTIF-2026-1006',
    eventType: 'HIGH_VALUE_TENDER',
    targetRole: 'ADMIN',
    recipientName: 'Operations Lead',
    recipientPhone: '+91 90000 00002',
    recipientEmail: 'operations@buildghar.com',
    projectId: 'BG-2026-0001',
    projectTitle: 'Modern Luxury Villa (G+2) - Super Corridor, Indore',
    title: 'High-Value Commercial Tender Broadcast: ₹85,00,000 Budget',
    body: 'Customer tender broadcast verified. 3 Top-Rated architects assigned for multi-bid quotation generation.',
    channel: 'EMAIL',
    status: 'DELIVERED',
    gatewayRef: 'SENDGRID-MSG-771239',
    latencyMs: 1200,
    dispatchedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: 'NOTIF-2026-1007',
    eventType: 'QUOTATION_RECEIVED',
    targetRole: 'CUSTOMER',
    recipientName: 'Sharika Mishra',
    recipientPhone: '+91 98765 43210',
    projectId: 'BG-2026-0001',
    projectTitle: 'Modern Luxury Villa (G+2) - Super Corridor, Indore',
    title: 'Architectural Quotations Published by 3 Firms',
    body: 'Ar. Rajesh Verma and 2 other accredited firms have published itemized BOQ estimates. Review and accept on your dashboard.',
    channel: 'WHATSAPP',
    status: 'READ',
    gatewayRef: 'GUPSHUP-WA-881290',
    latencyMs: 740,
    dispatchedAt: new Date(Date.now() - 86400000 * 6).toISOString(),
    readAt: new Date(Date.now() - 86400000 * 5.8).toISOString(),
  },
  {
    id: 'NOTIF-2026-1008',
    eventType: 'GATEWAY_TIMEOUT',
    targetRole: 'ADMIN',
    recipientName: 'Finance Desk',
    recipientPhone: '+91 90000 00003',
    recipientEmail: 'finance@buildghar.com',
    title: 'Payment Gateway Webhook Auto-Reconciliation Resolved',
    body: 'Transaction TXN-2026-003 timeout reconciled successfully with Razorpay webhook. Bank confirmation UTR verified.',
    channel: 'SMS',
    status: 'DELIVERED',
    gatewayRef: 'MSG91-DLT-991204',
    latencyMs: 580,
    dispatchedAt: new Date(Date.now() - 86400000 * 2.5).toISOString(),
  },
];

// Seed Email Templates
const getDefaultSeedEmailTemplates = (): EmailTemplate[] => [
  {
    id: 'TPL-EM-01',
    code: 'TPL_WELCOME_TENDER',
    title: 'Customer Welcome & RFQ Tender Acknowledgment',
    category: 'CUSTOMER',
    subject: 'Welcome to BuildGhar! Your Construction RFQ {{rfq_id}} is Live',
    previewText: 'We have received your architectural design request for {{project_title}}.',
    dynamicTags: ['customer_name', 'rfq_id', 'project_title', 'city', 'tender_fee'],
    bodyHtml: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <div style="text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 15px;">
          <h2 style="color: #0f172a; margin: 0;">BuildGhar</h2>
          <p style="color: #64748b; font-size: 13px; margin: 4px 0 0;">India's Trusted Architectural & Construction Platform</p>
        </div>
        <div style="padding: 20px 0;">
          <p style="font-size: 15px; color: #1e293b;">Dear <strong>{{customer_name}}</strong>,</p>
          <p style="font-size: 14px; color: #475569; line-height: 1.6;">
            Thank you for broadcasting your architectural requirement for <strong>{{project_title}}</strong> in <strong>{{city}}</strong>. Your tender reference code is <strong>{{rfq_id}}</strong>.
          </p>
          <div style="background: #f8fafc; padding: 15px; border-radius: 8px; border-left: 4px solid #2563eb; margin: 20px 0;">
            <p style="margin: 0; font-size: 13px; color: #334155;"><strong>Next Step:</strong> Our team is assigning 3 Council of Architecture (COA) accredited firms to furnish competitive, itemized quotations within 72 hours.</p>
          </div>
          <p style="font-size: 14px; color: #475569;">Track your tender progress anytime on your homeowner dashboard.</p>
        </div>
        <div style="text-align: center; border-top: 1px solid #e2e8f0; padding-top: 15px; font-size: 12px; color: #94a3b8;">
          © 2026 BuildGhar Technologies Private Limited. All rights reserved.
        </div>
      </div>
    `,
    status: 'ACTIVE',
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'TPL-EM-02',
    code: 'TPL_QUOTES_READY',
    title: 'Multi-Architect Quotations Ready for Review',
    category: 'CUSTOMER',
    subject: 'Quotations Ready for {{project_title}} - Compare Architectural Bids',
    previewText: 'Accredited architectural firms have published itemized design bids.',
    dynamicTags: ['customer_name', 'project_title', 'quotes_count', 'portal_url'],
    bodyHtml: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #0f172a;">Architectural Bids Published!</h2>
        <p>Dear <strong>{{customer_name}}</strong>,</p>
        <p><strong>{{quotes_count}}</strong> verified architectural firms have submitted itemized estimates for <strong>{{project_title}}</strong>.</p>
        <p>You can compare 2D/3D floorplans, elevations, and milestone payment terms side-by-side.</p>
        <a href="{{portal_url}}" style="display: inline-block; background: #2563eb; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 8px; font-weight: bold;">Compare Quotations Now</a>
      </div>
    `,
    status: 'ACTIVE',
    updatedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    id: 'TPL-EM-03',
    code: 'TPL_TAX_INVOICE_RECEIPT',
    title: 'Milestone Payment Tax Invoice & Escrow Deposit Receipt',
    category: 'FINANCE',
    subject: 'Tax Invoice & Escrow Deposit Receipt: {{payment_code}}',
    previewText: 'Your payment of ₹{{amount}} has been credited to BuildGhar Escrow.',
    dynamicTags: ['customer_name', 'payment_code', 'amount', 'milestone_name', 'gstin'],
    bodyHtml: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h3 style="color: #059669;">Payment Confirmed & Secured in Escrow</h3>
        <p>Dear <strong>{{customer_name}}</strong>,</p>
        <p>Your payment of <strong>₹{{amount}}</strong> for <strong>{{milestone_name}}</strong> has been successfully credited under Receipt <strong>{{payment_code}}</strong>.</p>
        <p style="font-size: 13px; color: #64748b;">Funds remain 100% protected in platform escrow until milestone drawings pass your final inspection.</p>
      </div>
    `,
    status: 'ACTIVE',
    updatedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: 'TPL-EM-04',
    code: 'TPL_ARCHITECT_ASSIGNMENT',
    title: 'Architect RFP Assignment & 72h SLA Notice',
    category: 'ARCHITECT',
    subject: 'New Project RFP Assignment: {{rfq_id}} - {{city}}',
    previewText: 'You have been exclusively nominated to submit design quotation.',
    dynamicTags: ['architect_name', 'rfq_id', 'plot_area', 'city', 'sla_deadline'],
    bodyHtml: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h3 style="color: #2563eb;">New RFP Assignment Nominated</h3>
        <p>Dear Ar. <strong>{{architect_name}}</strong>,</p>
        <p>BuildGhar Operations Desk has assigned tender <strong>{{rfq_id}}</strong> for a <strong>{{plot_area}}</strong> site in <strong>{{city}}</strong>.</p>
        <p>Your 72-hour quotation SLA window expires on <strong>{{sla_deadline}}</strong>.</p>
      </div>
    `,
    status: 'ACTIVE',
    updatedAt: new Date(Date.now() - 86400000 * 6).toISOString(),
  },
  {
    id: 'TPL-EM-05',
    code: 'TPL_MILESTONE_CLEARANCE',
    title: 'Milestone Deliverable Technical Review Clearance',
    category: 'ARCHITECT',
    subject: 'Technical Clearance Approved: Milestone {{milestone_number}}',
    previewText: 'Chief Architect has signed off structural and zoning plans.',
    dynamicTags: ['customer_name', 'architect_name', 'project_title', 'review_notes'],
    bodyHtml: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h3 style="color: #059669;">Milestone Technical Clearance Passed</h3>
        <p>Dear Ar. <strong>{{architect_name}}</strong>,</p>
        <p>Your drawings for <strong>{{project_title}}</strong> comply with all IS codes and municipal setbacks.</p>
        <p>Reviewer remarks: <em>{{review_notes}}</em></p>
      </div>
    `,
    status: 'ACTIVE',
    updatedAt: new Date(Date.now() - 86400000 * 8).toISOString(),
  },
  {
    id: 'TPL-EM-06',
    code: 'TPL_PAYOUT_ADVICE',
    title: 'Architect Escrow Payout Advice & Form 16A TDS Summary',
    category: 'FINANCE',
    subject: 'Escrow Payout Disbursed: {{payout_code}} - UTR {{utr_number}}',
    previewText: 'Net milestone payout of ₹{{net_amount}} has been credited via NEFT.',
    dynamicTags: ['architect_name', 'payout_code', 'net_amount', 'tds_amount', 'utr_number'],
    bodyHtml: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h3 style="color: #2563eb;">Payment Advice & Bank UTR</h3>
        <p>Dear Ar. <strong>{{architect_name}}</strong>,</p>
        <p>Net payout of <strong>₹{{net_amount}}</strong> (after TDS deduction of ₹{{tds_amount}}) has been processed via NEFT.</p>
        <p>Bank Reference UTR: <strong>{{utr_number}}</strong></p>
      </div>
    `,
    status: 'ACTIVE',
    updatedAt: new Date(Date.now() - 86400000 * 10).toISOString(),
  },
];

// Seed SMS & WhatsApp Templates
const getDefaultSeedSmsTemplates = (): SmsTemplate[] => [
  {
    id: 'DLT-SMS-101',
    templateCode: 'DLT_OTP_VERIFY',
    title: 'Customer OTP Login Verification',
    category: 'CUSTOMER',
    type: 'SMS',
    senderHeader: 'BLDGHR',
    dltTemplateId: '1107168923410982',
    messageText: 'Your BuildGhar secure verification OTP is {#var#}. Valid for 10 minutes. Do not share with anyone. - BuildGhar',
    charCount: 104,
    variableCount: 1,
    status: 'APPROVED_DLT',
    updatedAt: new Date(Date.now() - 86400000 * 15).toISOString(),
  },
  {
    id: 'DLT-SMS-102',
    templateCode: 'DLT_PAYMENT_ALERT',
    title: 'Payment Received & Escrow Deposit Alert',
    category: 'CUSTOMER',
    type: 'SMS',
    senderHeader: 'BLDGHR',
    dltTemplateId: '1107168923428812',
    messageText: 'Dear {#var#}, we have received payment of Rs.{#var#} for {#var#}. Funds are 100% protected in BuildGhar Escrow. View receipt: {#var#} - BuildGhar',
    charCount: 142,
    variableCount: 4,
    status: 'APPROVED_DLT',
    updatedAt: new Date(Date.now() - 86400000 * 14).toISOString(),
  },
  {
    id: 'DLT-SMS-103',
    templateCode: 'DLT_QUOTATION_READY',
    title: 'Quotation Ready for Review Alert',
    category: 'CUSTOMER',
    type: 'SMS',
    senderHeader: 'BLDGHR',
    dltTemplateId: '1107168923437719',
    messageText: 'Hi {#var#}, architects have published competitive quotations for your project {#var#}. Compare drawings & itemized rates: {#var#} - BuildGhar',
    charCount: 138,
    variableCount: 3,
    status: 'APPROVED_DLT',
    updatedAt: new Date(Date.now() - 86400000 * 12).toISOString(),
  },
  {
    id: 'DLT-SMS-104',
    templateCode: 'DLT_PAYOUT_DISPATCH',
    title: 'Architect Payout UTR Dispatch Notice',
    category: 'ARCHITECT',
    type: 'SMS',
    senderHeader: 'BLDGHR',
    dltTemplateId: '1107168923441209',
    messageText: 'Dear Ar.{#var#}, payout of Rs.{#var#} for Milestone {#var#} has been credited via NEFT UTR {#var#}. - BuildGhar Finance Desk',
    charCount: 128,
    variableCount: 4,
    status: 'APPROVED_DLT',
    updatedAt: new Date(Date.now() - 86400000 * 10).toISOString(),
  },
  {
    id: 'DLT-WA-201',
    templateCode: 'WA_MILESTONE_APPROVAL',
    title: 'WhatsApp Interactive Milestone Completion Card',
    category: 'CUSTOMER',
    type: 'WHATSAPP',
    senderHeader: 'BUILDGHAR_META',
    dltTemplateId: 'WA_META_VERIFIED_77190',
    messageText: 'Hello {{1}}! 🎉 Architectural drawings for Milestone {{2}} ({{3}}) are ready for your review. Tap below to inspect 3D blueprints & sign off: {{4}}',
    charCount: 154,
    variableCount: 4,
    status: 'APPROVED_DLT',
    updatedAt: new Date(Date.now() - 86400000 * 7).toISOString(),
  },
  {
    id: 'DLT-WA-202',
    templateCode: 'WA_DRAWING_REVISION_ALERT',
    title: 'WhatsApp Drawing Technical Review Redline Alert',
    category: 'ARCHITECT',
    type: 'WHATSAPP',
    senderHeader: 'BUILDGHAR_META',
    dltTemplateId: 'WA_META_VERIFIED_77191',
    messageText: 'Notice for Ar. {{1}}: Technical review for project {{2}} requires 1 revision on setback boundary lines. Download redline markups: {{3}}',
    charCount: 139,
    variableCount: 3,
    status: 'APPROVED_DLT',
    updatedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
];

export const AdminNotifications: React.FC = () => {
  const { success, error } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const rawView = searchParams.get('view');
  const selectedView: NotificationSubView =
    rawView && Object.keys(NOTIFICATION_VIEWS).includes(rawView)
      ? (rawView as NotificationSubView)
      : 'CUSTOMER_NOTIFICATIONS';

  const handleSelectView = (newView: NotificationSubView) => {
    setSearchParams({ view: newView });
  };

  const [notifications, setNotifications] = useState<EventNotificationRecord[]>([]);
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [smsTemplates, setSmsTemplates] = useState<SmsTemplate[]>([]);
  const [channelFilter, setChannelFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isTriggerModalOpen, setIsTriggerModalOpen] = useState(false);
  const [previewEmailTemplate, setPreviewEmailTemplate] = useState<EmailTemplate | null>(null);
  const [editEmailTemplate, setEditEmailTemplate] = useState<EmailTemplate | null>(null);
  const [editSmsTemplate, setEditSmsTemplate] = useState<SmsTemplate | null>(null);

  // New Notification Form State
  const [newNotif, setNewNotif] = useState<{
    targetRole: NotificationTarget;
    recipientName: string;
    recipientPhone: string;
    recipientEmail: string;
    eventType: NotificationEventType;
    channel: NotificationChannel;
    title: string;
    body: string;
    projectId: string;
  }>({
    targetRole: 'CUSTOMER',
    recipientName: 'Sharika Mishra',
    recipientPhone: '+91 98765 43210',
    recipientEmail: 'sharika.m@gmail.com',
    eventType: 'MILESTONE_APPROVED',
    channel: 'WHATSAPP',
    title: 'Milestone 2 Concept Floor Plan Approved',
    body: 'Admin has verified Concept Floor Plan & Vastu Zoning completion. Milestone escrow payout advice generated.',
    projectId: 'BG-2026-0001',
  });

  // Load Initial Stores
  const loadData = () => {
    try {
      const rawNotif = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      if (rawNotif) {
        setNotifications(JSON.parse(rawNotif));
      } else {
        const seed = getDefaultSeedNotifications();
        localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(seed));
        setNotifications(seed);
      }

      const rawEmail = localStorage.getItem(STORAGE_KEYS.EMAIL_TEMPLATES);
      if (rawEmail) {
        setEmailTemplates(JSON.parse(rawEmail));
      } else {
        const seedEmail = getDefaultSeedEmailTemplates();
        localStorage.setItem(STORAGE_KEYS.EMAIL_TEMPLATES, JSON.stringify(seedEmail));
        setEmailTemplates(seedEmail);
      }

      const rawSms = localStorage.getItem(STORAGE_KEYS.SMS_TEMPLATES);
      if (rawSms) {
        setSmsTemplates(JSON.parse(rawSms));
      } else {
        const seedSms = getDefaultSeedSmsTemplates();
        localStorage.setItem(STORAGE_KEYS.SMS_TEMPLATES, JSON.stringify(seedSms));
        setSmsTemplates(seedSms);
      }
    } catch (e) {
      console.error('Error loading notification store:', e);
      setNotifications(getDefaultSeedNotifications());
      setEmailTemplates(getDefaultSeedEmailTemplates());
      setSmsTemplates(getDefaultSeedSmsTemplates());
    }
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('storage', handleUpdate);
    return () => window.removeEventListener('storage', handleUpdate);
  }, []);

  // SubCounts for the 6 sub-views
  const subCounts = useMemo(() => {
    return {
      CUSTOMER_NOTIFICATIONS: notifications.filter((n) => n.targetRole === 'CUSTOMER').length,
      ARCHITECT_NOTIFICATIONS: notifications.filter(
        (n) => n.targetRole === 'ARCHITECT' || n.targetRole === 'CONTRACTOR'
      ).length,
      ADMIN_NOTIFICATIONS: notifications.filter((n) => n.targetRole === 'ADMIN').length,
      EMAIL_TEMPLATES: emailTemplates.length,
      SMS_TEMPLATES: smsTemplates.length,
      NOTIFICATION_HISTORY: notifications.length,
    };
  }, [notifications, emailTemplates, smsTemplates]);

  // Filtered Notifications based on selectedView
  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      // 1. View filtering
      if (selectedView === 'CUSTOMER_NOTIFICATIONS' && n.targetRole !== 'CUSTOMER') return false;
      if (
        selectedView === 'ARCHITECT_NOTIFICATIONS' &&
        n.targetRole !== 'ARCHITECT' &&
        n.targetRole !== 'CONTRACTOR'
      )
        return false;
      if (selectedView === 'ADMIN_NOTIFICATIONS' && n.targetRole !== 'ADMIN') return false;

      // 2. Channel filtering
      if (channelFilter !== 'ALL' && n.channel !== channelFilter) return false;

      // 3. Search query filtering
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = n.title.toLowerCase().includes(q);
        const matchBody = n.body.toLowerCase().includes(q);
        const matchName = n.recipientName.toLowerCase().includes(q);
        const matchPhone = n.recipientPhone.toLowerCase().includes(q);
        const matchProj = (n.projectId || '').toLowerCase().includes(q);
        return matchTitle || matchBody || matchName || matchPhone || matchProj;
      }
      return true;
    });
  }, [notifications, selectedView, channelFilter, searchQuery]);

  // Filtered Email Templates
  const filteredEmailTemplates = useMemo(() => {
    return emailTemplates.filter((t) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        t.code.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q)
      );
    });
  }, [emailTemplates, searchQuery]);

  // Filtered SMS Templates
  const filteredSmsTemplates = useMemo(() => {
    return smsTemplates.filter((t) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        t.templateCode.toLowerCase().includes(q) ||
        t.messageText.toLowerCase().includes(q) ||
        t.senderHeader.toLowerCase().includes(q)
      );
    });
  }, [smsTemplates, searchQuery]);

  // Handler: Dispatch Notification
  const handleDispatchNotification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNotif.title.trim() || !newNotif.body.trim()) {
      error('Please enter notification title and message body');
      return;
    }

    const item: EventNotificationRecord = {
      id: `NOTIF-${Date.now()}`,
      eventType: newNotif.eventType,
      targetRole: newNotif.targetRole,
      recipientName: newNotif.recipientName,
      recipientPhone: newNotif.recipientPhone,
      recipientEmail: newNotif.recipientEmail,
      projectId: newNotif.projectId,
      title: newNotif.title,
      body: newNotif.body,
      channel: newNotif.channel,
      status: 'DELIVERED',
      gatewayRef: `${newNotif.channel}-GTW-${Math.floor(100000 + Math.random() * 900000)}`,
      latencyMs: Math.floor(450 + Math.random() * 800),
      dispatchedAt: new Date().toISOString(),
    };

    const updated = [item, ...notifications];
    setNotifications(updated);
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updated));

    logAdminAuditAction({
      action: 'NOTIFICATION_DISPATCHED',
      targetType: 'NOTIFICATION',
      targetId: item.id,
      description: `Dispatched ${item.channel} event notification "${item.title}" to ${item.recipientName} (${item.targetRole})`,
    });

    success(`Notification dispatched successfully via ${item.channel}!`);
    setIsTriggerModalOpen(false);
  };

  // Handler: Resend Notification
  const handleResendNotification = (item: EventNotificationRecord) => {
    const updated = notifications.map((n) =>
      n.id === item.id
        ? {
            ...n,
            status: 'DELIVERED' as const,
            dispatchedAt: new Date().toISOString(),
            gatewayRef: `${n.channel}-RETRY-${Math.floor(100000 + Math.random() * 900000)}`,
          }
        : n
    );
    setNotifications(updated);
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updated));
    success(`Re-dispatched notification to ${item.recipientName} via ${item.channel}!`);
  };

  // Handler: Save Email Template Edit
  const handleSaveEmailTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editEmailTemplate) return;
    const updated = emailTemplates.map((t) =>
      t.id === editEmailTemplate.id
        ? { ...editEmailTemplate, updatedAt: new Date().toISOString() }
        : t
    );
    setEmailTemplates(updated);
    localStorage.setItem(STORAGE_KEYS.EMAIL_TEMPLATES, JSON.stringify(updated));
    success(`Email template "${editEmailTemplate.title}" saved successfully!`);
    setEditEmailTemplate(null);
  };

  // Handler: Save SMS Template Edit
  const handleSaveSmsTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editSmsTemplate) return;
    const updated = smsTemplates.map((t) =>
      t.id === editSmsTemplate.id
        ? { ...editSmsTemplate, updatedAt: new Date().toISOString() }
        : t
    );
    setSmsTemplates(updated);
    localStorage.setItem(STORAGE_KEYS.SMS_TEMPLATES, JSON.stringify(updated));
    success(`SMS template "${editSmsTemplate.title}" saved successfully!`);
    setEditSmsTemplate(null);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* ---------------- Top Header ---------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <Bell className="w-5 h-5" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold font-display text-navy-950">
                  16. Notification Management
                </h1>
                <Badge variant="blue" className="text-[10px] uppercase font-bold tracking-wider">
                  Module 16 Compliant
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Centralized omnichannel messaging hub: Customer alerts, Architect notifications, Admin escalations, HTML Email templates, DLT-approved SMS, and unified delivery history.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Top Dropdown View Switcher */}
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-blue-200 shadow-2xs">
            <label htmlFor="view-select" className="text-xs font-semibold text-slate-500 whitespace-nowrap">
              View:
            </label>
            <div className="relative">
              <select
                id="view-select"
                value={selectedView}
                onChange={(e) => handleSelectView(e.target.value as NotificationSubView)}
                className="text-xs font-bold bg-transparent text-navy-950 pr-6 py-0.5 focus:outline-hidden cursor-pointer"
              >
                {(Object.keys(NOTIFICATION_VIEWS) as NotificationSubView[]).map((v) => (
                  <option key={v} value={v}>
                    {NOTIFICATION_VIEWS[v].label} ({subCounts[v]})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <button
            onClick={() => setIsTriggerModalOpen(true)}
            className="btn-gold px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Dispatch Notification</span>
          </button>
        </div>
      </div>

      {/* ---------------- 6-Pill Action Strip ---------------- */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-2 px-2 scrollbar-none">
        {(Object.keys(NOTIFICATION_VIEWS) as NotificationSubView[]).map((v) => {
          const info = NOTIFICATION_VIEWS[v];
          const IconComp = info.icon;
          const count = subCounts[v];
          const isSelected = selectedView === v;
          return (
            <button
              key={v}
              onClick={() => handleSelectView(v)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shadow-2xs ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-blue-200 shadow-md ring-2 ring-blue-500 ring-offset-1'
                  : 'bg-white hover:bg-blue-50/80 text-slate-700 border border-slate-200/80'
              }`}
            >
              <IconComp className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-blue-600'}`} />
              <span>{info.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                  isSelected ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ---------------- Contextual Feature Header Banner ---------------- */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-white/90 backdrop-blur-md rounded-2xl border border-blue-100 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-100/70 text-blue-700">
            {React.createElement(NOTIFICATION_VIEWS[selectedView].icon, { className: 'w-5 h-5' })}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-navy-950 font-display">
                {NOTIFICATION_VIEWS[selectedView].label}
              </h2>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${NOTIFICATION_VIEWS[selectedView].badgeColor}`}>
                {selectedView === 'EMAIL_TEMPLATES'
                  ? `${filteredEmailTemplates.length} Templates`
                  : selectedView === 'SMS_TEMPLATES'
                  ? `${filteredSmsTemplates.length} DLT Headers`
                  : `${filteredNotifications.length} Events Logged`}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {NOTIFICATION_VIEWS[selectedView].description}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="font-semibold text-slate-700">Active Channel:</span>
          <span className="px-2 py-0.5 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 font-mono text-[11px] font-bold">
            {selectedView}
          </span>
        </div>
      </div>

      {/* ---------------- KPI Metrics Summary Strip ---------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Customer Dispatches</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-navy-950 font-display">
            {notifications.filter((n) => n.targetRole === 'CUSTOMER').length}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium">WhatsApp, SMS & In-App</div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-blue-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-blue-700 text-xs font-semibold">
            <span>Architect & Partner Alerts</span>
            <Compass className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-950 font-display">
            {notifications.filter((n) => n.targetRole === 'ARCHITECT' || n.targetRole === 'CONTRACTOR').length}
          </div>
          <div className="text-[11px] text-blue-600 font-medium">72h SLA tenders & payouts</div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-purple-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-purple-700 text-xs font-semibold">
            <span>Admin Governance Alerts</span>
            <ShieldCheck className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-purple-950 font-display">
            {notifications.filter((n) => n.targetRole === 'ADMIN').length}
          </div>
          <div className="text-[11px] text-purple-600 font-medium">Disputes & high-value tenders</div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-amber-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-amber-700 text-xs font-semibold">
            <span>Templates in Production</span>
            <FileText className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-950 font-display">
            {emailTemplates.length + smsTemplates.length}
          </div>
          <div className="text-[11px] text-amber-700 font-medium">6 Email + 6 DLT SMS/WA</div>
        </div>
      </div>

      {/* ---------------- Filter & Search Bar ---------------- */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={
              selectedView === 'EMAIL_TEMPLATES'
                ? 'Search email templates by title, code, subject...'
                : selectedView === 'SMS_TEMPLATES'
                ? 'Search SMS templates by header, DLT ID, message...'
                : 'Search notifications by recipient name, phone, title, project ID...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {selectedView !== 'EMAIL_TEMPLATES' && selectedView !== 'SMS_TEMPLATES' && (
          <div className="flex items-center gap-2">
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="ALL">All Channels</option>
              <option value="WHATSAPP">WhatsApp</option>
              <option value="IN_APP">In-App Notification</option>
              <option value="SMS">SMS Gateway</option>
              <option value="EMAIL">Email Alert</option>
            </select>
          </div>
        )}
      </div>

      {/* ---------------- 1, 2, 3: Notifications Table (Customer / Architect / Admin) ---------------- */}
      {(selectedView === 'CUSTOMER_NOTIFICATIONS' ||
        selectedView === 'ARCHITECT_NOTIFICATIONS' ||
        selectedView === 'ADMIN_NOTIFICATIONS') && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
            <h3 className="font-bold text-navy-950 text-sm">
              {NOTIFICATION_VIEWS[selectedView].label} Feed
            </h3>
            <span className="font-mono text-xs font-bold text-blue-700">
              {filteredNotifications.length} Events
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Event Type & Date</th>
                  <th className="py-3 px-4">Recipient</th>
                  <th className="py-3 px-4">Notification Title & Content</th>
                  <th className="py-3 px-4">Project Association</th>
                  <th className="py-3 px-4 text-center">Channel</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredNotifications.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <Bell className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                      <p className="font-semibold text-sm">No notifications found</p>
                      <p className="text-xs text-slate-400 mt-1">Try clearing search or dispatch a new notification.</p>
                    </td>
                  </tr>
                ) : (
                  filteredNotifications.map((n) => (
                    <tr key={n.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-slate-900">{n.eventType.replace(/_/g, ' ')}</div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          <span>{formatDate(n.dispatchedAt)}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{n.recipientName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{n.recipientPhone}</div>
                      </td>

                      <td className="py-3 px-4 max-w-md">
                        <div className="font-semibold text-navy-950 line-clamp-1">{n.title}</div>
                        <div className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{n.body}</div>
                      </td>

                      <td className="py-3 px-4">
                        {n.projectId ? (
                          <div>
                            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-bold border border-blue-200">
                              {n.projectId}
                            </span>
                            <div className="text-[11px] text-slate-500 truncate max-w-xs mt-1">
                              {n.projectTitle}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            n.channel === 'WHATSAPP'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : n.channel === 'SMS'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : n.channel === 'EMAIL'
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}
                        >
                          {n.channel}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            n.status === 'DELIVERED' || n.status === 'READ'
                              ? 'bg-emerald-50 text-emerald-700'
                              : n.status === 'QUEUED'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {n.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleResendNotification(n)}
                          className="px-2.5 py-1 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg text-xs font-semibold transition"
                          title="Resend Notification"
                        >
                          Resend
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ---------------- 4. Email Templates View ---------------- */}
      {selectedView === 'EMAIL_TEMPLATES' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEmailTemplates.map((tpl) => (
              <div
                key={tpl.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3 flex flex-col justify-between hover:border-blue-300 transition"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold border border-blue-200">
                      {tpl.code}
                    </span>
                    <Badge variant="blue" className="text-[10px] font-bold">{tpl.category}</Badge>
                  </div>

                  <h3 className="font-bold text-navy-950 text-sm">{tpl.title}</h3>

                  <div className="text-xs text-slate-600">
                    <span className="font-semibold text-slate-800">Subject: </span>
                    <span className="italic">{tpl.subject}</span>
                  </div>

                  <div className="text-[11px] text-slate-500">{tpl.previewText}</div>

                  <div className="pt-2">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Merge Variables:
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {tpl.dynamicTags.map((tag) => (
                        <span
                          key={tag}
                          className="px-1.5 py-0.2 rounded bg-slate-100 text-[10px] font-mono text-slate-600"
                        >
                          {`{{${tag}}}`}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-mono">ID: {tpl.id}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPreviewEmailTemplate(tpl)}
                      className="px-2.5 py-1 text-blue-600 hover:bg-blue-50 rounded-lg text-xs font-bold flex items-center gap-1 transition"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview</span>
                    </button>
                    <button
                      onClick={() => setEditEmailTemplate(tpl)}
                      className="px-2.5 py-1 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-bold flex items-center gap-1 transition"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---------------- 5. SMS & WhatsApp Templates View ---------------- */}
      {selectedView === 'SMS_TEMPLATES' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSmsTemplates.map((tpl) => (
              <div
                key={tpl.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3 flex flex-col justify-between hover:border-amber-300 transition"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span
                      className={`font-mono text-[10px] px-2 py-0.5 rounded font-bold border ${
                        tpl.type === 'WHATSAPP'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {tpl.type} • {tpl.senderHeader}
                    </span>
                    <Badge variant="emerald" className="text-[10px] font-bold">{tpl.status}</Badge>
                  </div>

                  <h3 className="font-bold text-navy-950 text-sm">{tpl.title}</h3>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 font-mono leading-relaxed">
                    {tpl.messageText}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span>Length: <strong>{tpl.charCount} chars</strong> (1 SMS)</span>
                    <span>Vars: <strong>{tpl.variableCount} dynamic</strong></span>
                  </div>

                  <div className="text-[10px] text-slate-400 font-mono">
                    DLT Principal Entity ID: {tpl.dltTemplateId}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-mono">{tpl.templateCode}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditSmsTemplate(tpl)}
                      className="px-2.5 py-1 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-bold flex items-center gap-1 transition"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit Template</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---------------- 6. Notification History View ---------------- */}
      {selectedView === 'NOTIFICATION_HISTORY' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-navy-950 text-sm">Unified Omnichannel Dispatch Audit Trail</h3>
              <p className="text-xs text-slate-500">Live gateway telemetry: Gupshup, SendGrid, MSG91, and In-App WebSockets</p>
            </div>
            <span className="font-mono text-xs font-bold text-blue-700">
              {filteredNotifications.length} Events Total
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 uppercase font-bold text-[10px]">
                <tr>
                  <th className="py-3 px-4">Dispatch Timestamp</th>
                  <th className="py-3 px-4">Gateway Reference</th>
                  <th className="py-3 px-4">Target Role & Recipient</th>
                  <th className="py-3 px-4">Channel</th>
                  <th className="py-3 px-4">Notification Subject</th>
                  <th className="py-3 px-4 text-center">Latency</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredNotifications.map((n) => (
                  <tr key={n.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono text-slate-700">
                      <div>{formatDate(n.dispatchedAt)}</div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(n.dispatchedAt).toLocaleTimeString()}
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-blue-700">
                      {n.gatewayRef || `GTW-${n.id.slice(6)}`}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{n.recipientName}</div>
                      <div className="text-[10px] text-slate-500">{n.targetRole} • {n.recipientPhone}</div>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          n.channel === 'WHATSAPP'
                            ? 'bg-emerald-50 text-emerald-700'
                            : n.channel === 'SMS'
                            ? 'bg-amber-50 text-amber-700'
                            : n.channel === 'EMAIL'
                            ? 'bg-indigo-50 text-indigo-700'
                            : 'bg-blue-50 text-blue-700'
                        }`}
                      >
                        {n.channel}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-medium text-slate-800 max-w-xs truncate">
                      {n.title}
                    </td>

                    <td className="py-3 px-4 text-center font-mono text-[11px] text-slate-600">
                      {n.latencyMs ? `${n.latencyMs}ms` : '620ms'}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          n.status === 'DELIVERED' || n.status === 'READ'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {n.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleResendNotification(n)}
                        className="px-2.5 py-1 text-slate-700 hover:text-blue-700 hover:bg-blue-50 rounded-lg text-xs font-semibold transition"
                      >
                        Resend
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ---------------- MODAL: Dispatch Event Notification ---------------- */}
      <AnimatePresence>
        {isTriggerModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/40 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 max-w-lg w-full space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Send className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-navy-950 text-base">Dispatch Event Notification</h3>
                </div>
                <button
                  onClick={() => setIsTriggerModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleDispatchNotification} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Target Role</label>
                    <select
                      value={newNotif.targetRole}
                      onChange={(e) =>
                        setNewNotif({
                          ...newNotif,
                          targetRole: e.target.value as NotificationTarget,
                        })
                      }
                      className="w-full p-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-semibold"
                    >
                      <option value="CUSTOMER">Customer / Homeowner</option>
                      <option value="ARCHITECT">Architect Partner</option>
                      <option value="ADMIN">Platform Super Admin</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Dispatch Channel</label>
                    <select
                      value={newNotif.channel}
                      onChange={(e) =>
                        setNewNotif({
                          ...newNotif,
                          channel: e.target.value as NotificationChannel,
                        })
                      }
                      className="w-full p-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-semibold"
                    >
                      <option value="WHATSAPP">WhatsApp Business API</option>
                      <option value="SMS">SMS Gateway (DLT)</option>
                      <option value="IN_APP">In-App WebSocket</option>
                      <option value="EMAIL">Email Alert</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Recipient Name</label>
                    <input
                      type="text"
                      required
                      value={newNotif.recipientName}
                      onChange={(e) => setNewNotif({ ...newNotif, recipientName: e.target.value })}
                      className="w-full p-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Mobile Phone (OTP/SMS)</label>
                    <input
                      type="text"
                      required
                      value={newNotif.recipientPhone}
                      onChange={(e) => setNewNotif({ ...newNotif, recipientPhone: e.target.value })}
                      className="w-full p-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Project ID</label>
                  <input
                    type="text"
                    value={newNotif.projectId}
                    onChange={(e) => setNewNotif({ ...newNotif, projectId: e.target.value })}
                    className="w-full p-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Notification Title</label>
                  <input
                    type="text"
                    required
                    value={newNotif.title}
                    onChange={(e) => setNewNotif({ ...newNotif, title: e.target.value })}
                    className="w-full p-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Message Body</label>
                  <textarea
                    rows={3}
                    required
                    value={newNotif.body}
                    onChange={(e) => setNewNotif({ ...newNotif, body: e.target.value })}
                    className="w-full p-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsTriggerModalOpen(false)}
                    className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-gold px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Notification</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ---------------- MODAL: Preview Email Template ---------------- */}
      <AnimatePresence>
        {previewEmailTemplate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/40 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 max-w-2xl w-full space-y-4 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-bold text-navy-950 text-base">{previewEmailTemplate.title}</h3>
                  <p className="text-xs text-slate-500 font-mono">Code: {previewEmailTemplate.code}</p>
                </div>
                <button
                  onClick={() => setPreviewEmailTemplate(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                <div>
                  <strong className="text-slate-700">Subject: </strong>
                  <span className="text-slate-900">{previewEmailTemplate.subject}</span>
                </div>
                <div>
                  <strong className="text-slate-700">Preview: </strong>
                  <span className="text-slate-600">{previewEmailTemplate.previewText}</span>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl p-4 bg-white overflow-hidden shadow-2xs">
                <div
                  dangerouslySetInnerHTML={{
                    __html: previewEmailTemplate.bodyHtml
                      .replace(/{{customer_name}}/g, 'Sharika Mishra')
                      .replace(/{{architect_name}}/g, 'Ar. Rajesh Verma')
                      .replace(/{{rfq_id}}/g, 'GHR-REQ-2026-1001')
                      .replace(/{{project_title}}/g, 'Modern Luxury Villa (G+2)')
                      .replace(/{{city}}/g, 'Super Corridor, Indore')
                      .replace(/{{amount}}/g, '1,77,000')
                      .replace(/{{net_amount}}/g, '1,33,500')
                      .replace(/{{tds_amount}}/g, '1,500')
                      .replace(/{{utr_number}}/g, 'HDFCR520261118009842')
                      .replace(/{{milestone_name}}/g, 'Milestone 1: Structural Framing')
                      .replace(/{{quotes_count}}/g, '3')
                      .replace(/{{plot_area}}/g, '3,200 sq.ft')
                      .replace(/{{sla_deadline}}/g, '2026-11-30 18:00 IST'),
                  }}
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setPreviewEmailTemplate(null)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
                >
                  Close Preview
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ---------------- MODAL: Edit Email Template ---------------- */}
      <AnimatePresence>
        {editEmailTemplate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/40 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 max-w-xl w-full space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Edit className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-navy-950 text-base">Edit Email Template</h3>
                </div>
                <button
                  onClick={() => setEditEmailTemplate(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEmailTemplate} className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Template Title</label>
                  <input
                    type="text"
                    required
                    value={editEmailTemplate.title}
                    onChange={(e) =>
                      setEditEmailTemplate({ ...editEmailTemplate, title: e.target.value })
                    }
                    className="w-full p-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Subject Line</label>
                  <input
                    type="text"
                    required
                    value={editEmailTemplate.subject}
                    onChange={(e) =>
                      setEditEmailTemplate({ ...editEmailTemplate, subject: e.target.value })
                    }
                    className="w-full p-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Preview Snippet</label>
                  <input
                    type="text"
                    value={editEmailTemplate.previewText}
                    onChange={(e) =>
                      setEditEmailTemplate({ ...editEmailTemplate, previewText: e.target.value })
                    }
                    className="w-full p-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditEmailTemplate(null)}
                    className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ---------------- MODAL: Edit SMS Template ---------------- */}
      <AnimatePresence>
        {editSmsTemplate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/40 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 max-w-xl w-full space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-amber-600" />
                  <h3 className="font-bold text-navy-950 text-base">Edit DLT SMS Template</h3>
                </div>
                <button
                  onClick={() => setEditSmsTemplate(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveSmsTemplate} className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Template Title</label>
                  <input
                    type="text"
                    required
                    value={editSmsTemplate.title}
                    onChange={(e) =>
                      setEditSmsTemplate({ ...editSmsTemplate, title: e.target.value })
                    }
                    className="w-full p-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    TRAI DLT Message Text (Use {'{#var#}'} or {'{{1}}'} for variables)
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={editSmsTemplate.messageText}
                    onChange={(e) =>
                      setEditSmsTemplate({
                        ...editSmsTemplate,
                        messageText: e.target.value,
                        charCount: e.target.value.length,
                      })
                    }
                    className="w-full p-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono resize-none"
                  />
                  <div className="text-[11px] text-slate-500 mt-1">
                    Characters: <strong>{editSmsTemplate.messageText.length}</strong> (Standard SMS limit: 160)
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditSmsTemplate(null)}
                    className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-gold px-4 py-2 rounded-xl text-xs font-bold"
                  >
                    Save DLT Template
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
