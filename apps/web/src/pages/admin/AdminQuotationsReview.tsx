import React, { useEffect, useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiRequest } from '../../lib/api.js';
import { Badge } from '../../components/common/Badge.js';
import { formatINR, formatDate } from '../../lib/utils.js';
import { useToast } from '../../context/ToastContext.js';
import {
  FileCheck2,
  CheckCircle2,
  Check,
  AlertTriangle,
  XCircle,
  Share2,
  Layers,
  ChevronDown,
  Plus,
  X,
  ArrowLeft,
  FileText,
  ArrowRight,
  Clock,
  Sparkles,
  RotateCcw,
  User,
  Phone,
  MapPin,
  Building,
  Building2,
  HardHat,
  ShieldCheck,
  Calendar,
  Eye,
  Search,
  MessageSquare,
  Send,
  History,
  UserCheck,
  ThumbsUp,
  ThumbsDown,
  Hourglass,
  ExternalLink,
  Edit3,
  Sliders,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { Quotation } from '@ghar-design/shared';
import {
  broadcastStoreUpdate,
  generateQuotationCode,
  getPlatformRequests,
  updatePlatformRequestStatus,
  syncChannel,
  PlatformProjectRequest,
} from '../../data/customerStore.js';
import { pushToCloud } from '../../data/cloudSync.js';
import { safeSetStorage, safeGetStorage } from '../../lib/safeStorage.js';
import { getArchitectById, getArchitectByPhone } from '../../data/architectStore.js';
import { logAdminAuditAction } from '../../data/adminRbacStore.js';

// ============================================================================
// SUB-VIEWS DEFINITION (Module 6: Quotation Management)
// ============================================================================
export const SUB_VIEWS = [
  { key: 'PENDING_ARCHITECT', label: 'Pending Architect Quotations', desc: 'Assigned inquiries awaiting partner quote submittal' },
  { key: 'UNDER_REVIEW', label: 'Quotation Under Review', desc: 'Submitted BOQs pending technical verification' },
  { key: 'APPROVED', label: 'Approved Quotations', desc: 'Vetted BOQs approved and ready for homeowner dispatch' },
  { key: 'REJECTED', label: 'Rejected Quotations', desc: 'Declined submissions with logged technical remarks' },
  { key: 'REVISION_REQUIRED', label: 'Revision Required', desc: 'Quotes returned to architect for drawing / rate corrections' },
  { key: 'SENT_TO_CUSTOMER', label: 'Sent to Customer', desc: 'Published proposals delivered to homeowner portal' },
  { key: 'CUSTOMER_ACCEPTED', label: 'Customer Accepted Quotations', desc: 'Homeowner accepted, ready for site escrow mobilization' },
  { key: 'CUSTOMER_REJECTED', label: 'Customer Rejected Quotations', desc: 'Declined by customer with comparative feedback' },
  { key: 'EXPIRED', label: 'Expired Quotations', desc: 'Lapsed proposal validity ready for extension' },
  { key: 'HISTORY', label: 'Quotation History', desc: 'Immutable chronological audit log of all quotation movements' },
];

// ============================================================================
// QUOTATION HISTORY STORAGE MODEL
// ============================================================================
export interface QuotationHistoryEntry {
  id: string;
  timestamp: string;
  quotationId: string;
  quotationCode: string;
  requestId: string;
  requestCode: string;
  customerName: string;
  architectName: string;
  firmName: string;
  amountPaise: number;
  action:
    | 'SUBMITTED'
    | 'APPROVED'
    | 'REJECTED'
    | 'REVISION_REQUESTED'
    | 'PUBLISHED'
    | 'CUSTOMER_ACCEPTED'
    | 'CUSTOMER_REJECTED'
    | 'VALIDITY_EXTENDED';
  notes?: string;
  adminName: string;
  adminRole: string;
}

const QUOTATION_HISTORY_KEY = 'platform_quotation_history';

export const getQuotationHistory = (quotations: any[] = []): QuotationHistoryEntry[] => {
  try {
    const raw = localStorage.getItem(QUOTATION_HISTORY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {}

  // Auto-seed if empty
  const seeded: QuotationHistoryEntry[] = [];
  quotations.forEach((q, idx) => {
    seeded.push({
      id: `qhist-${q.id || idx}`,
      timestamp: q.updatedAt || q.createdAt || new Date().toISOString(),
      quotationId: q.id || `quote-${idx}`,
      quotationCode: q.quotationCode || `QT-${idx}`,
      requestId: q.requestId || '',
      requestCode: q.requestCode || q.requestId || 'REQ',
      customerName: q.customerName || 'Homeowner',
      architectName: q.architectName || q.professionalName || 'Lead Architect',
      firmName: q.firmName || q.professional?.firmName || 'Practice Studio',
      amountPaise: q.finalAmountPaise || q.totalAmountPaise || 15000000,
      action:
        q.status === 'PUBLISHED_TO_CUSTOMER' || q.status === 'SENT_TO_CUSTOMER'
          ? 'PUBLISHED'
          : q.status === 'CUSTOMER_ACCEPTED' || q.status === 'ACCEPTED'
          ? 'CUSTOMER_ACCEPTED'
          : q.status === 'APPROVED'
          ? 'APPROVED'
          : q.status === 'REJECTED'
          ? 'REJECTED'
          : 'SUBMITTED',
      notes: q.adminFeedback || 'Quotation processed via BuildGhar Central Desk',
      adminName: 'Super Administrator',
      adminRole: 'SUPER_ADMIN',
    });
  });

  try {
    localStorage.setItem(QUOTATION_HISTORY_KEY, JSON.stringify(seeded));
  } catch {}

  return seeded;
};

export const logQuotationHistoryEvent = (entry: Omit<QuotationHistoryEntry, 'id' | 'timestamp'>): void => {
  try {
    const existing = getQuotationHistory();
    const newEntry: QuotationHistoryEntry = {
      ...entry,
      id: `qhist-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    const updated = [newEntry, ...existing];
    localStorage.setItem(QUOTATION_HISTORY_KEY, JSON.stringify(updated));
  } catch {}
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export const AdminQuotationsReview: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlView = searchParams.get('view') || 'UNDER_REVIEW';

  const [selectedView, setSelectedView] = useState<string>(urlView);
  const [viewMode, setViewMode] = useState<'REQUEST_GROUPS' | 'ALL_QUOTES'>('ALL_QUOTES');
  const [requests, setRequests] = useState<PlatformProjectRequest[]>([]);
  const [quotations, setQuotations] = useState<any[]>([]);
  const { success, error } = useToast();
  const [reviewNote, setReviewNote] = useState('');
  const [activeQuoteId, setActiveQuoteId] = useState<string | null>(null);
  const [inspectingQuote, setInspectingQuote] = useState<any | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals for actions
  const [showRevisionModal, setShowRevisionModal] = useState<any | null>(null);
  const [revisionFeedback, setRevisionFeedback] = useState('Please revise RCC footing sizing and provide line-item break up for interior false ceiling.');

  const [showRejectModal, setShowRejectModal] = useState<any | null>(null);
  const [rejectionReason, setRejectionReason] = useState('Quotation exceeds client specified budget envelope by >30%');

  const [showPublishModal, setShowPublishModal] = useState<any | null>(null);
  const [validityDays, setValidityDays] = useState('15');
  const [publishCoverNote, setPublishCoverNote] = useState('Your customized architectural plan and comprehensive BOQ quotation is ready for review.');

  const [showExtendModal, setShowExtendModal] = useState<any | null>(null);
  const [extensionDays, setExtensionDays] = useState('15');

  const [showCustomerDecisionModal, setShowCustomerDecisionModal] = useState<any | null>(null);
  const [customerDecision, setCustomerDecision] = useState<'ACCEPT' | 'REJECT'>('ACCEPT');
  const [customerDecisionNote, setCustomerDecisionNote] = useState('Client confirmed proposal approval via phone consultation.');

  // Direct Create Quote Stepper
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [quoteStep, setQuoteStep] = useState<1 | 2 | 3>(1);
  const [newQuote, setNewQuote] = useState({
    requestCode: '',
    scopeOfWork: '',
    totalAmountRupees: '',
    city: '',
    timelineDays: '45',
  });

  // History State
  const [historyList, setHistoryList] = useState<QuotationHistoryEntry[]>([]);
  const [historyFilterAction, setHistoryFilterAction] = useState<string>('ALL');

  useEffect(() => {
    if (urlView && urlView !== selectedView) {
      setSelectedView(urlView);
    }
  }, [urlView]);

  const handleSelectView = (viewKey: string) => {
    setSelectedView(viewKey);
    setSearchParams({ view: viewKey });
  };

  const resolveArchitectInfo = (q: any) => {
    const cleanPhone = (q.professionalPhone || q.phone || q.professional?.phone || '').replace(/\D/g, '').slice(-10);
    const matchedArch = cleanPhone
      ? getArchitectByPhone(cleanPhone)
      : (q.architectId || q.professionalId)
      ? getArchitectById(q.architectId || q.professionalId)
      : null;

    const archId =
      q.architectId ||
      matchedArch?.id ||
      q.professional?.architectId ||
      (typeof q.professionalId === 'string' && q.professionalId.startsWith('ARC') ? q.professionalId : null) ||
      (q.professionalName?.toLowerCase().includes('platform') || q.professional?.name?.toLowerCase().includes('platform')
        ? 'ARC-HQ-ADMIN'
        : (q.professionalId || 'ARC-PENDING'));

    const firmName =
      q.firmName ||
      matchedArch?.firmName ||
      q.professional?.firmName ||
      (q.professionalName?.toLowerCase().includes('platform') || q.professional?.name?.toLowerCase().includes('platform')
        ? 'BuildGhar Platform Engineering'
        : 'Architect Partner Firm');

    const architectName =
      q.architectName ||
      matchedArch?.name ||
      q.professionalName ||
      q.professional?.name ||
      'Architect Partner';

    const coaNumber = q.coaNumber || matchedArch?.coaNumber || q.professional?.coaNumber || '';
    const archPhone = q.professionalPhone || matchedArch?.phone || q.professional?.phone || '';

    return { archId, firmName, architectName, coaNumber, archPhone };
  };

  const loadData = () => {
    const allReqs = getPlatformRequests();
    setRequests(allReqs);

    let localQuotes: any[] = [];
    try {
      const stored = localStorage.getItem('platform_quotations');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          localQuotes = parsed.filter(
            (q: any) =>
              q.quotationCode !== 'QT-2026-001' &&
              q.requestCode !== 'GHR-REQ-2026-1001'
          );
        }
      }
      const storedInterior = localStorage.getItem('gd_interior_quotations_v1');
      if (storedInterior) {
        const parsedInterior = JSON.parse(storedInterior);
        if (Array.isArray(parsedInterior)) {
          for (const iq of parsedInterior) {
            if (!localQuotes.some((lq) => (lq.id && lq.id === iq.id) || (lq.quotationCode && lq.quotationCode === iq.quotationCode))) {
              localQuotes.push(iq);
            }
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
    setQuotations(localQuotes);
    setHistoryList(getQuotationHistory(localQuotes));
  };

  const handleRefresh = (manual = false) => {
    setRefreshing(true);
    loadData();
    if (manual) {
      success('Quotations & customer requests refreshed.');
    }
    setTimeout(() => setRefreshing(false), 500);
  };

  useEffect(() => {
    loadData();

    const interval = setInterval(() => {
      handleRefresh(false);
    }, 60000);

    const onSync = (event: MessageEvent) => {
      if (
        event.data?.type === 'QUOTATIONS_UPDATED' ||
        event.data?.type === 'PROJECT_REQUESTS_UPDATED'
      ) {
        loadData();
      }
    };

    if (syncChannel) {
      syncChannel.addEventListener('message', onSync);
    }
    window.addEventListener('storage', loadData);

    return () => {
      clearInterval(interval);
      if (syncChannel) {
        syncChannel.removeEventListener('message', onSync);
      }
      window.removeEventListener('storage', loadData);
    };
  }, []);

  // ---------------- 10 SUB-VIEW CALCULATIONS & FILTERS ----------------
  // 1. Pending Architect Quotations
  // Requests assigned to architects where quote has not yet been submitted
  const pendingArchitectRequests = useMemo(() => {
    return requests.filter((r) => {
      const isAssigned = r.assignedProfessionalIds && r.assignedProfessionalIds.length > 0;
      if (!isAssigned) return false;
      if (r.status === 'CANCELLED' || r.status === 'COMPLETED') return false;

      // Check if quotes exist for this request
      const existingQuotes = quotations.filter(
        (q) => q.requestId === r.id || q.requestCode === r.requestCode
      );
      return existingQuotes.length === 0;
    });
  }, [requests, quotations]);

  // 2. Quotation Under Review
  const underReviewQuotations = useMemo(() => {
    return quotations.filter(
      (q) =>
        q.status === 'SUBMITTED' ||
        q.status === 'UNDER_REVIEW' ||
        q.status === 'PENDING_REVIEW' ||
        q.status === 'DRAFT' ||
        !q.status
    );
  }, [quotations]);

  // 3. Approved Quotations
  const approvedQuotations = useMemo(() => {
    return quotations.filter(
      (q) => q.status === 'APPROVED' || q.status === 'APPROVED_BY_ADMIN'
    );
  }, [quotations]);

  // 4. Rejected Quotations
  const rejectedQuotations = useMemo(() => {
    return quotations.filter(
      (q) => q.status === 'REJECTED' || q.status === 'ADMIN_REJECTED'
    );
  }, [quotations]);

  // 5. Revision Required
  const revisionRequiredQuotations = useMemo(() => {
    return quotations.filter(
      (q) =>
        q.status === 'CHANGES_REQUESTED' ||
        q.status === 'REVISION_REQUESTED' ||
        q.status === 'REVISION_REQUIRED'
    );
  }, [quotations]);

  // 6. Sent to Customer
  const sentToCustomerQuotations = useMemo(() => {
    return quotations.filter((q) => {
      const isSent = q.status === 'PUBLISHED_TO_CUSTOMER' || q.status === 'SENT_TO_CUSTOMER';
      if (!isSent) return false;
      // Not expired
      if (q.validUntil && new Date(q.validUntil).getTime() < Date.now()) return false;
      return true;
    });
  }, [quotations]);

  // 7. Customer Accepted Quotations
  const customerAcceptedQuotations = useMemo(() => {
    return quotations.filter(
      (q) =>
        q.status === 'CUSTOMER_ACCEPTED' ||
        q.status === 'ACCEPTED' ||
        q.status === 'BOOKING_CONFIRMED'
    );
  }, [quotations]);

  // 8. Customer Rejected Quotations
  const customerRejectedQuotations = useMemo(() => {
    return quotations.filter(
      (q) =>
        q.status === 'CUSTOMER_REJECTED' ||
        q.status === 'DECLINED' ||
        q.status === 'CUSTOMER_DECLINED'
    );
  }, [quotations]);

  // 9. Expired Quotations
  const expiredQuotations = useMemo(() => {
    return quotations.filter((q) => {
      if (q.status === 'EXPIRED') return true;
      if (
        q.validUntil &&
        new Date(q.validUntil).getTime() < Date.now() &&
        q.status !== 'CUSTOMER_ACCEPTED' &&
        q.status !== 'ACCEPTED' &&
        q.status !== 'BOOKING_CONFIRMED'
      ) {
        return true;
      }
      return false;
    });
  }, [quotations]);

  // Active View Items
  const activeViewQuotes = useMemo(() => {
    let list: any[] = [];
    if (selectedView === 'UNDER_REVIEW') list = underReviewQuotations;
    else if (selectedView === 'APPROVED') list = approvedQuotations;
    else if (selectedView === 'REJECTED') list = rejectedQuotations;
    else if (selectedView === 'REVISION_REQUIRED') list = revisionRequiredQuotations;
    else if (selectedView === 'SENT_TO_CUSTOMER') list = sentToCustomerQuotations;
    else if (selectedView === 'CUSTOMER_ACCEPTED') list = customerAcceptedQuotations;
    else if (selectedView === 'CUSTOMER_REJECTED') list = customerRejectedQuotations;
    else if (selectedView === 'EXPIRED') list = expiredQuotations;
    else list = quotations;

    if (!searchTerm.trim()) return list;
    const term = searchTerm.toLowerCase();
    return list.filter((q) => {
      const code = (q.quotationCode || q.id || '').toLowerCase();
      const reqCode = (q.requestCode || '').toLowerCase();
      const cust = (q.customerName || '').toLowerCase();
      const city = (q.city || '').toLowerCase();
      const { archId, firmName, architectName } = resolveArchitectInfo(q);
      return (
        code.includes(term) ||
        reqCode.includes(term) ||
        cust.includes(term) ||
        city.includes(term) ||
        archId.toLowerCase().includes(term) ||
        firmName.toLowerCase().includes(term) ||
        architectName.toLowerCase().includes(term)
      );
    });
  }, [
    selectedView,
    underReviewQuotations,
    approvedQuotations,
    rejectedQuotations,
    revisionRequiredQuotations,
    sentToCustomerQuotations,
    customerAcceptedQuotations,
    customerRejectedQuotations,
    expiredQuotations,
    quotations,
    searchTerm,
  ]);

  // Filtered History
  const filteredHistory = useMemo(() => {
    let list = historyList;
    if (historyFilterAction !== 'ALL') {
      list = list.filter((h) => h.action === historyFilterAction);
    }
    if (!searchTerm.trim()) return list;
    const term = searchTerm.toLowerCase();
    return list.filter((h) => {
      return (
        h.quotationCode.toLowerCase().includes(term) ||
        h.requestCode.toLowerCase().includes(term) ||
        h.customerName.toLowerCase().includes(term) ||
        h.architectName.toLowerCase().includes(term) ||
        h.firmName.toLowerCase().includes(term)
      );
    });
  }, [historyList, historyFilterAction, searchTerm]);

  // Filtered Pending Architect Requests
  const filteredPendingArchitectRequests = useMemo(() => {
    if (!searchTerm.trim()) return pendingArchitectRequests;
    const term = searchTerm.toLowerCase();
    return pendingArchitectRequests.filter((r) => {
      return (
        r.requestCode?.toLowerCase().includes(term) ||
        r.customerName?.toLowerCase().includes(term) ||
        r.city?.toLowerCase().includes(term) ||
        r.assignedProfessionals?.some(
          (p: any) => p.name?.toLowerCase().includes(term) || p.firmName?.toLowerCase().includes(term)
        )
      );
    });
  }, [pendingArchitectRequests, searchTerm]);

  // Multi-Architect Grouped comparison
  const groupedByRequest = useMemo(() => {
    const map = new Map<string, { request: PlatformProjectRequest | null; quotes: any[] }>();

    for (const q of activeViewQuotes) {
      const key = q.requestId || q.requestCode || 'DIRECT';
      if (!map.has(key)) {
        const matched = requests.find((r) => r.id === key || r.requestCode === key) || null;
        map.set(key, { request: matched, quotes: [] });
      }
      map.get(key)!.quotes.push(q);
    }

    return Array.from(map.entries()).map(([reqKey, data]) => ({
      reqKey,
      request: data.request,
      quotes: data.quotes,
    }));
  }, [activeViewQuotes, requests]);

  // ---------------- ACTION HANDLERS ----------------
  // 1. Approve Quotation
  const handleApproveQuote = (quote: any, note = 'Approved by administrator for homeowner presentation.') => {
    const updated = quotations.map((q) =>
      q.id === quote.id
        ? {
            ...q,
            status: 'APPROVED',
            adminFeedback: note,
            approvedAt: new Date().toISOString(),
          }
        : q
    );
    setQuotations(updated);
    safeSetStorage('platform_quotations', updated);
    broadcastStoreUpdate('QUOTATIONS_UPDATED', updated);
    pushToCloud().catch(() => {});

    logQuotationHistoryEvent({
      quotationId: quote.id,
      quotationCode: quote.quotationCode || quote.id,
      requestId: quote.requestId || '',
      requestCode: quote.requestCode || 'REQ',
      customerName: quote.customerName || 'Homeowner',
      architectName: quote.architectName || quote.professionalName || 'Lead Architect',
      firmName: quote.firmName || 'Practice Studio',
      amountPaise: quote.finalAmountPaise || quote.totalAmountPaise || 0,
      action: 'APPROVED',
      notes: note,
      adminName: 'Super Administrator',
      adminRole: 'SUPER_ADMIN',
    });

    logAdminAuditAction({
      action: 'APPROVE_ARCHITECT_QUOTATION',
      module: 'QUOTATION_MANAGEMENT',
      targetId: quote.id,
      targetName: quote.quotationCode || quote.id,
      details: { note },
    });

    success(`Quotation ${quote.quotationCode || quote.id} approved successfully!`);
    if (inspectingQuote?.id === quote.id) {
      setInspectingQuote((prev: any) => ({ ...prev, status: 'APPROVED', adminFeedback: note }));
    }
  };

  // 2. Reject Quotation
  const handleConfirmReject = () => {
    if (!showRejectModal) return;
    const quote = showRejectModal;
    const updated = quotations.map((q) =>
      q.id === quote.id
        ? {
            ...q,
            status: 'REJECTED',
            adminFeedback: rejectionReason,
            rejectedAt: new Date().toISOString(),
          }
        : q
    );
    setQuotations(updated);
    safeSetStorage('platform_quotations', updated);
    broadcastStoreUpdate('QUOTATIONS_UPDATED', updated);
    pushToCloud().catch(() => {});

    logQuotationHistoryEvent({
      quotationId: quote.id,
      quotationCode: quote.quotationCode || quote.id,
      requestId: quote.requestId || '',
      requestCode: quote.requestCode || 'REQ',
      customerName: quote.customerName || 'Homeowner',
      architectName: quote.architectName || quote.professionalName || 'Lead Architect',
      firmName: quote.firmName || 'Practice Studio',
      amountPaise: quote.finalAmountPaise || quote.totalAmountPaise || 0,
      action: 'REJECTED',
      notes: rejectionReason,
      adminName: 'Super Administrator',
      adminRole: 'SUPER_ADMIN',
    });

    success(`Quotation ${quote.quotationCode || quote.id} rejected.`);
    setShowRejectModal(null);
  };

  // 3. Request Revision
  const handleConfirmRevision = () => {
    if (!showRevisionModal) return;
    const quote = showRevisionModal;
    const updated = quotations.map((q) =>
      q.id === quote.id
        ? {
            ...q,
            status: 'CHANGES_REQUESTED',
            adminFeedback: revisionFeedback,
            revisionRequestedAt: new Date().toISOString(),
          }
        : q
    );
    setQuotations(updated);
    safeSetStorage('platform_quotations', updated);
    broadcastStoreUpdate('QUOTATIONS_UPDATED', updated);
    pushToCloud().catch(() => {});

    logQuotationHistoryEvent({
      quotationId: quote.id,
      quotationCode: quote.quotationCode || quote.id,
      requestId: quote.requestId || '',
      requestCode: quote.requestCode || 'REQ',
      customerName: quote.customerName || 'Homeowner',
      architectName: quote.architectName || quote.professionalName || 'Lead Architect',
      firmName: quote.firmName || 'Practice Studio',
      amountPaise: quote.finalAmountPaise || quote.totalAmountPaise || 0,
      action: 'REVISION_REQUESTED',
      notes: revisionFeedback,
      adminName: 'Super Administrator',
      adminRole: 'SUPER_ADMIN',
    });

    success(`Revision requested for ${quote.quotationCode || quote.id}. Architect notified.`);
    setShowRevisionModal(null);
  };

  // 4. Publish / Send to Customer
  const handleConfirmPublish = () => {
    if (!showPublishModal) return;
    const quote = showPublishModal;
    const vDays = parseInt(validityDays) || 15;
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + vDays);

    const updated = quotations.map((q) =>
      q.id === quote.id
        ? {
            ...q,
            status: 'PUBLISHED_TO_CUSTOMER',
            publishedAt: new Date().toISOString(),
            validUntil: expiry.toISOString(),
            customerCoverNote: publishCoverNote,
          }
        : q
    );

    setQuotations(updated);
    safeSetStorage('platform_quotations', updated);
    broadcastStoreUpdate('QUOTATIONS_UPDATED', updated);
    pushToCloud().catch(() => {});

    // Advance request status
    const reqKey = quote.requestId || quote.requestCode;
    if (reqKey) {
      const matchedReq = requests.find((r) => r.id === reqKey || r.requestCode === reqKey);
      if (matchedReq) {
        updatePlatformRequestStatus(matchedReq.id, 'QUOTATIONS_AVAILABLE', {
          quotationsCount: (matchedReq.quotationsCount || 0) + 1,
        });
      }
    }

    logQuotationHistoryEvent({
      quotationId: quote.id,
      quotationCode: quote.quotationCode || quote.id,
      requestId: quote.requestId || '',
      requestCode: quote.requestCode || 'REQ',
      customerName: quote.customerName || 'Homeowner',
      architectName: quote.architectName || quote.professionalName || 'Lead Architect',
      firmName: quote.firmName || 'Practice Studio',
      amountPaise: quote.finalAmountPaise || quote.totalAmountPaise || 0,
      action: 'PUBLISHED',
      notes: `Sent to customer with ${vDays} days validity. Note: ${publishCoverNote}`,
      adminName: 'Super Administrator',
      adminRole: 'SUPER_ADMIN',
    });

    success(`Quotation ${quote.quotationCode || quote.id} published and sent to customer!`);
    setShowPublishModal(null);
  };

  // 5. Extend Validity
  const handleConfirmExtend = () => {
    if (!showExtendModal) return;
    const quote = showExtendModal;
    const addDays = parseInt(extensionDays) || 15;
    const currentExpiry = quote.validUntil ? new Date(quote.validUntil) : new Date();
    currentExpiry.setDate(currentExpiry.getDate() + addDays);

    const updated = quotations.map((q) =>
      q.id === quote.id
        ? {
            ...q,
            status: 'PUBLISHED_TO_CUSTOMER',
            validUntil: currentExpiry.toISOString(),
            validityExtendedAt: new Date().toISOString(),
          }
        : q
    );

    setQuotations(updated);
    safeSetStorage('platform_quotations', updated);
    broadcastStoreUpdate('QUOTATIONS_UPDATED', updated);
    pushToCloud().catch(() => {});

    logQuotationHistoryEvent({
      quotationId: quote.id,
      quotationCode: quote.quotationCode || quote.id,
      requestId: quote.requestId || '',
      requestCode: quote.requestCode || 'REQ',
      customerName: quote.customerName || 'Homeowner',
      architectName: quote.architectName || quote.professionalName || 'Lead Architect',
      firmName: quote.firmName || 'Practice Studio',
      amountPaise: quote.finalAmountPaise || quote.totalAmountPaise || 0,
      action: 'VALIDITY_EXTENDED',
      notes: `Extended validity by +${addDays} days until ${currentExpiry.toISOString().split('T')[0]}`,
      adminName: 'Super Administrator',
      adminRole: 'SUPER_ADMIN',
    });

    success(`Validity extended by ${addDays} days for ${quote.quotationCode || quote.id}!`);
    setShowExtendModal(null);
  };

  // 6. Record Customer Decision Manually
  const handleConfirmCustomerDecision = () => {
    if (!showCustomerDecisionModal) return;
    const quote = showCustomerDecisionModal;
    const isAccept = customerDecision === 'ACCEPT';

    const updated = quotations.map((q) =>
      q.id === quote.id
        ? {
            ...q,
            status: isAccept ? 'CUSTOMER_ACCEPTED' : 'CUSTOMER_REJECTED',
            customerDecisionAt: new Date().toISOString(),
            customerFeedback: customerDecisionNote,
          }
        : q
    );

    setQuotations(updated);
    safeSetStorage('platform_quotations', updated);
    broadcastStoreUpdate('QUOTATIONS_UPDATED', updated);
    pushToCloud().catch(() => {});

    if (isAccept) {
      const reqKey = quote.requestId || quote.requestCode;
      if (reqKey) {
        const matchedReq = requests.find((r) => r.id === reqKey || r.requestCode === reqKey);
        if (matchedReq) {
          updatePlatformRequestStatus(matchedReq.id, 'BOOKING_CONFIRMED', {
            winningQuotationId: quote.id,
          });
        }
      }
    }

    logQuotationHistoryEvent({
      quotationId: quote.id,
      quotationCode: quote.quotationCode || quote.id,
      requestId: quote.requestId || '',
      requestCode: quote.requestCode || 'REQ',
      customerName: quote.customerName || 'Homeowner',
      architectName: quote.architectName || quote.professionalName || 'Lead Architect',
      firmName: quote.firmName || 'Practice Studio',
      amountPaise: quote.finalAmountPaise || quote.totalAmountPaise || 0,
      action: isAccept ? 'CUSTOMER_ACCEPTED' : 'CUSTOMER_REJECTED',
      notes: customerDecisionNote,
      adminName: 'Super Administrator',
      adminRole: 'SUPER_ADMIN',
    });

    success(`Recorded customer ${isAccept ? 'ACCEPTANCE' : 'REJECTION'} for ${quote.quotationCode || quote.id}.`);
    setShowCustomerDecisionModal(null);
  };

  // 7. Reconsider / Reopen Rejected Quote
  const handleReconsiderQuote = (quote: any) => {
    const updated = quotations.map((q) =>
      q.id === quote.id
        ? {
            ...q,
            status: 'UNDER_REVIEW',
            adminFeedback: 'Re-opened for administrative technical review.',
          }
        : q
    );
    setQuotations(updated);
    safeSetStorage('platform_quotations', updated);
    broadcastStoreUpdate('QUOTATIONS_UPDATED', updated);
    pushToCloud().catch(() => {});

    logQuotationHistoryEvent({
      quotationId: quote.id,
      quotationCode: quote.quotationCode || quote.id,
      requestId: quote.requestId || '',
      requestCode: quote.requestCode || 'REQ',
      customerName: quote.customerName || 'Homeowner',
      architectName: quote.architectName || quote.professionalName || 'Lead Architect',
      firmName: quote.firmName || 'Practice Studio',
      amountPaise: quote.finalAmountPaise || quote.totalAmountPaise || 0,
      action: 'SUBMITTED',
      notes: 'Reconsidered by administrator back to Under Review queue.',
      adminName: 'Super Administrator',
      adminRole: 'SUPER_ADMIN',
    });

    success(`Quotation ${quote.quotationCode || quote.id} returned to Under Review.`);
  };

  // 8. WhatsApp Nudge to Architect for Pending Quote
  const handleNudgeArchitectWhatsApp = (r: PlatformProjectRequest, arch: any) => {
    const phone = (arch.phone || '').replace(/\D/g, '').slice(-10);
    const message = encodeURIComponent(
      `Hello ${arch.name}, this is BuildGhar Central Technical Desk regarding Request ${r.requestCode} for ${r.customerName} in ${r.city}. Your architectural design & BOQ quotation is pending submission. The current submission deadline is ${r.responseDeadline || 'Within 48h'}. Please submit your quotation via the partner portal: https://buildghar.com/architect/requests/${r.id}`
    );
    window.open(`https://wa.me/91${phone}?text=${message}`, '_blank');
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-16 font-sans">
      {/* ---------------- 1. EXECUTIVE HEADER BANNER ---------------- */}
      <div className="bg-gradient-to-r from-navy-950 via-[#0e2a4f] to-[#163b6b] text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-navy-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-400/15 border border-blue-400/30 rounded-full text-blue-300 font-mono text-[11px] font-bold uppercase tracking-wider">
              <FileCheck2 className="w-3.5 h-3.5 text-blue-400" />
              <span>Quotation Management Desk (Module 6)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-white flex items-center gap-3">
              <span>Full Lifecycle Architectural Quotations Desk</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Track pending architect submissions, audit structural BOQs, approve turnkey proposals, manage customer revisions,
              dispatch competitive quotations, and monitor contract conversions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => handleRefresh(true)}
              disabled={refreshing}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-slate-200 transition disabled:opacity-50 flex items-center gap-2 font-bold text-xs cursor-pointer shadow-xs"
              title="Refresh Live Quotation Queues"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-amber-300' : ''}`} />
              <span className="hidden sm:inline">Sync Quotations</span>
            </button>
          </div>
        </div>
      </div>

      {/* ---------------- 2. TOP VIEW SWITCHER DROPDOWN & 10-PILL ACTION STRIP ---------------- */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Select Quotation Lifecycle View:
            </span>
          </div>

          {/* Feature Dropdown Selector */}
          <div className="relative w-full sm:w-96">
            <select
              value={selectedView}
              onChange={(e) => handleSelectView(e.target.value)}
              className="w-full appearance-none px-3.5 py-2.5 bg-slate-50 border border-slate-300 hover:border-blue-500 text-slate-900 font-bold text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer pr-10"
            >
              <option value="PENDING_ARCHITECT">1. Pending Architect Quotations ({pendingArchitectRequests.length} Waiting)</option>
              <option value="UNDER_REVIEW">2. Quotation Under Review ({underReviewQuotations.length} Pending)</option>
              <option value="APPROVED">3. Approved Quotations ({approvedQuotations.length} Vetted)</option>
              <option value="REJECTED">4. Rejected Quotations ({rejectedQuotations.length} Declined)</option>
              <option value="REVISION_REQUIRED">5. Revision Required ({revisionRequiredQuotations.length} Changes)</option>
              <option value="SENT_TO_CUSTOMER">6. Sent to Customer ({sentToCustomerQuotations.length} Live)</option>
              <option value="CUSTOMER_ACCEPTED">7. Customer Accepted Quotations ({customerAcceptedQuotations.length} Won)</option>
              <option value="CUSTOMER_REJECTED">8. Customer Rejected Quotations ({customerRejectedQuotations.length} Lost)</option>
              <option value="EXPIRED">9. Expired Quotations ({expiredQuotations.length} Lapsed)</option>
              <option value="HISTORY">10. Quotation History ({historyList.length} Ledger Logs)</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-3 pointer-events-none" />
          </div>
        </div>

        {/* 10-Pill Action Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 pt-2 border-t border-slate-100">
          {SUB_VIEWS.map((sv) => {
            const isActive = selectedView === sv.key;
            let badge = '';
            if (sv.key === 'PENDING_ARCHITECT') badge = `${pendingArchitectRequests.length}`;
            if (sv.key === 'UNDER_REVIEW') badge = `${underReviewQuotations.length}`;
            if (sv.key === 'APPROVED') badge = `${approvedQuotations.length}`;
            if (sv.key === 'REJECTED') badge = `${rejectedQuotations.length}`;
            if (sv.key === 'REVISION_REQUIRED') badge = `${revisionRequiredQuotations.length}`;
            if (sv.key === 'SENT_TO_CUSTOMER') badge = `${sentToCustomerQuotations.length}`;
            if (sv.key === 'CUSTOMER_ACCEPTED') badge = `${customerAcceptedQuotations.length}`;
            if (sv.key === 'CUSTOMER_REJECTED') badge = `${customerRejectedQuotations.length}`;
            if (sv.key === 'EXPIRED') badge = `${expiredQuotations.length}`;
            if (sv.key === 'HISTORY') badge = `${historyList.length}`;

            return (
              <button
                key={sv.key}
                type="button"
                onClick={() => handleSelectView(sv.key)}
                className={`p-2.5 rounded-2xl text-left border transition cursor-pointer flex flex-col justify-between gap-1 ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-700 to-navy-950 text-white border-blue-700 shadow-md font-bold'
                    : 'bg-slate-50/70 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-[11px] font-bold truncate leading-tight">{sv.label}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800'
                    }`}
                  >
                    {badge}
                  </span>
                </div>
                <span
                  className={`text-[9px] truncate block ${
                    isActive ? 'text-blue-200' : 'text-slate-400'
                  }`}
                >
                  {sv.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ---------------- 3. EXECUTIVE KPI CARDS ---------------- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-amber-200/90 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">
            Awaiting Review
          </span>
          <div className="text-3xl font-black font-display text-amber-900">{underReviewQuotations.length}</div>
          <span className="text-[11px] text-amber-800 font-semibold flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Pending BOQ audit</span>
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-blue-200/90 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block">
            Live with Homeowners
          </span>
          <div className="text-3xl font-black font-display text-navy-950">{sentToCustomerQuotations.length}</div>
          <span className="text-[11px] text-blue-700 font-semibold flex items-center gap-1">
            <Send className="w-3.5 h-3.5 text-blue-600" />
            <span>Active customer proposals</span>
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-200/90 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
            Customer Accepted
          </span>
          <div className="text-3xl font-black font-display text-emerald-950">{customerAcceptedQuotations.length}</div>
          <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Ready for site contract</span>
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-purple-200/90 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 block">
            Awaiting Partner Quote
          </span>
          <div className="text-3xl font-black font-display text-purple-950">{pendingArchitectRequests.length}</div>
          <span className="text-[11px] text-purple-700 font-semibold flex items-center gap-1">
            <Hourglass className="w-3.5 h-3.5 text-purple-600" />
            <span>Assigned, quote in prep</span>
          </span>
        </div>
      </div>

      {/* ============================================================================
          VIEW 1: PENDING ARCHITECT QUOTATIONS
      ============================================================================ */}
      {selectedView === 'PENDING_ARCHITECT' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
          <div className="p-5 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-purple-50 text-purple-700 border border-purple-100">
                <Hourglass className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-navy-950">1. Pending Architect Quotations Desk</h3>
                <p className="text-xs text-slate-500">
                  Customer RFQs assigned to architectural practices where the formal BOQ quote has not yet been submitted
                </p>
              </div>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search request, customer, architect..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100 text-slate-600 uppercase tracking-wider text-[10px] font-bold">
                <tr>
                  <th className="py-3 px-4">Request Code</th>
                  <th className="py-3 px-3">Homeowner &amp; Site</th>
                  <th className="py-3 px-3">Assigned Practice</th>
                  <th className="py-3 px-3">Target Budget</th>
                  <th className="py-3 px-3 text-center">Submission Deadline</th>
                  <th className="py-3 px-4 text-right">Partner Nudge Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPendingArchitectRequests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <div className="space-y-1">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                        <p className="font-bold text-slate-700 text-xs">No pending architect submissions!</p>
                        <p className="text-[11px] text-slate-400">
                          All assigned architects have delivered their quotations.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredPendingArchitectRequests.map((r) => {
                    const leadArch = r.assignedProfessionals?.[0] || { name: 'Architect Partner', firmName: 'Firm' };
                    return (
                      <tr key={r.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3.5 px-4 font-mono font-bold text-blue-700">
                          <Link to={`/admin/requests/${r.id}`} className="hover:underline">
                            {r.requestCode || r.id.slice(0, 8)}
                          </Link>
                          <span className="text-[10px] text-slate-400 block font-mono">
                            {formatDate(r.createdAt)}
                          </span>
                        </td>
                        <td className="py-3.5 px-3">
                          <strong className="text-slate-900 block">{r.customerName}</strong>
                          <span className="text-[11px] text-slate-500">
                            {r.city} • {r.plotArea ? `${r.plotArea} sq.ft` : 'Plot'}
                          </span>
                        </td>
                        <td className="py-3.5 px-3">
                          <strong className="text-slate-900 block">{leadArch.name}</strong>
                          <span className="text-[11px] text-slate-500 font-mono">
                            {leadArch.firmName || 'Practice'} {leadArch.phone ? `• ${leadArch.phone}` : ''}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-indigo-700 font-semibold">
                          {r.budgetRange || 'Flexible'}
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 font-mono font-bold text-[11px]">
                            {r.responseDeadline || 'Within 7 Days'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-2">
                          <button
                            type="button"
                            onClick={() => handleNudgeArchitectWhatsApp(r, leadArch)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer shadow-xs"
                            title="Open WhatsApp with pre-filled submission reminder"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>WhatsApp Nudge</span>
                          </button>
                          <Link
                            to={`/admin/requests/${r.id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
                          >
                            <span>Inspect</span>
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================================
          VIEW 2 - 9: QUOTATIONS LIST VIEWS (UNDER REVIEW, APPROVED, SENT, REJECTED, ETC.)
      ============================================================================ */}
      {selectedView !== 'PENDING_ARCHITECT' && selectedView !== 'HISTORY' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
          <div className="p-5 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-700 border border-blue-100">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-navy-950">
                  {SUB_VIEWS.find((s) => s.key === selectedView)?.label || 'Quotations Desk'}
                </h3>
                <p className="text-xs text-slate-500">
                  {SUB_VIEWS.find((s) => s.key === selectedView)?.desc}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search quotation code, homeowner, city..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100 text-slate-600 uppercase tracking-wider text-[10px] font-bold">
                <tr>
                  <th className="py-3 px-4">Quotation &amp; Date</th>
                  <th className="py-3 px-3">Homeowner &amp; Location</th>
                  <th className="py-3 px-3">Submitting Practice</th>
                  <th className="py-3 px-3 text-right">Quotation Amount</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeViewQuotes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      No quotations match your active view ({selectedView}).
                    </td>
                  </tr>
                ) : (
                  activeViewQuotes.map((q) => {
                    const { archId, firmName, architectName, coaNumber } = resolveArchitectInfo(q);
                    return (
                      <tr key={q.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3.5 px-4">
                          <strong className="text-blue-700 font-mono block text-xs">
                            {q.quotationCode || q.id}
                          </strong>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Req: {q.requestCode || q.requestId || '—'}
                          </span>
                        </td>

                        <td className="py-3.5 px-3">
                          <strong className="text-slate-900 block">{q.customerName || 'Homeowner'}</strong>
                          <span className="text-[11px] text-slate-500">
                            {q.city || 'Site City'} • {q.customerPhone || ''}
                          </span>
                        </td>

                        <td className="py-3.5 px-3">
                          <strong className="text-slate-900 block">{architectName}</strong>
                          <span className="text-[11px] text-slate-500">{firmName}</span>
                          {coaNumber && (
                            <span className="text-[10px] text-indigo-700 font-mono block">{coaNumber}</span>
                          )}
                        </td>

                        <td className="py-3.5 px-3 text-right">
                          <span className="font-mono font-black text-sm text-navy-950 block">
                            {formatINR(q.finalAmountPaise || q.totalAmountPaise || 0)}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {q.timelineDays ? `${q.timelineDays} Days Timeline` : 'Turnkey BOQ'}
                          </span>
                        </td>

                        <td className="py-3.5 px-3 text-center">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              q.status === 'APPROVED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : q.status === 'PUBLISHED_TO_CUSTOMER' || q.status === 'SENT_TO_CUSTOMER'
                                ? 'bg-blue-100 text-blue-800'
                                : q.status === 'CUSTOMER_ACCEPTED' || q.status === 'ACCEPTED'
                                ? 'bg-purple-100 text-purple-800'
                                : q.status === 'REJECTED'
                                ? 'bg-rose-100 text-rose-800'
                                : q.status === 'CHANGES_REQUESTED' || q.status === 'REVISION_REQUIRED'
                                ? 'bg-amber-100 text-amber-800'
                                : q.status === 'EXPIRED'
                                ? 'bg-slate-200 text-slate-700'
                                : 'bg-amber-50 text-amber-900 border border-amber-200'
                            }`}
                          >
                            {q.status?.replace(/_/g, ' ') || 'UNDER REVIEW'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right space-x-1.5">
                          {/* Inspect Full Dossier */}
                          <button
                            type="button"
                            onClick={() => setInspectingQuote(q)}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs inline-flex items-center gap-1 transition cursor-pointer"
                            title="Inspect full line-item BOQ schedule"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>BOQ</span>
                          </button>

                          {/* Action depending on view */}
                          {selectedView === 'UNDER_REVIEW' && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleApproveQuote(q)}
                                className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center gap-1 transition cursor-pointer shadow-2xs"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Approve</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setShowRevisionModal(q)}
                                className="px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs inline-flex items-center gap-1 border border-amber-200 transition cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Revision</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setShowRejectModal(q)}
                                className="px-2 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs inline-flex items-center gap-1 border border-rose-200 transition cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}

                          {selectedView === 'APPROVED' && (
                            <button
                              type="button"
                              onClick={() => setShowPublishModal(q)}
                              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs inline-flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>Send to Customer</span>
                            </button>
                          )}

                          {selectedView === 'SENT_TO_CUSTOMER' && (
                            <button
                              type="button"
                              onClick={() => setShowCustomerDecisionModal(q)}
                              className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 font-bold text-xs inline-flex items-center gap-1.5 transition cursor-pointer"
                            >
                              <UserCheck className="w-3.5 h-3.5 text-purple-700" />
                              <span>Log Decision</span>
                            </button>
                          )}

                          {selectedView === 'CUSTOMER_ACCEPTED' && (
                            <Link
                              to="/admin/projects"
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center gap-1.5 transition shadow-xs"
                            >
                              <TrendingUp className="w-3.5 h-3.5" />
                              <span>To Projects</span>
                            </Link>
                          )}

                          {selectedView === 'REJECTED' && (
                            <button
                              type="button"
                              onClick={() => handleReconsiderQuote(q)}
                              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs inline-flex items-center gap-1 transition cursor-pointer"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Reconsider</span>
                            </button>
                          )}

                          {selectedView === 'REVISION_REQUIRED' && (
                            <button
                              type="button"
                              onClick={() => {
                                const arch = resolveArchitectInfo(q);
                                window.open(
                                  `https://wa.me/91${(arch.archPhone || '').replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent(`Hello ${arch.architectName}, this is BuildGhar regarding quotation revision requested for ${q.quotationCode}. Please submit revised drawing/BOQ on the partner portal.`)}`,
                                  '_blank'
                                );
                              }}
                              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs inline-flex items-center gap-1 transition cursor-pointer"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>Follow Up</span>
                            </button>
                          )}

                          {selectedView === 'EXPIRED' && (
                            <button
                              type="button"
                              onClick={() => setShowExtendModal(q)}
                              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs inline-flex items-center gap-1 transition cursor-pointer"
                            >
                              <Clock className="w-3.5 h-3.5" />
                              <span>Extend +15d</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================================
          VIEW 10: QUOTATION HISTORY AUDIT TRAIL
      ============================================================================ */}
      {selectedView === 'HISTORY' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
          <div className="p-5 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-700 border border-blue-100">
                <History className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-navy-950">10. Quotation Lifecycle Audit History</h3>
                <p className="text-xs text-slate-500">
                  Full chronological log of submittals, technical audits, homeowner dispatches, and contract wins
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-xl text-xs font-bold">
                {['ALL', 'SUBMITTED', 'APPROVED', 'PUBLISHED', 'CUSTOMER_ACCEPTED'].map((act) => (
                  <button
                    key={act}
                    type="button"
                    onClick={() => setHistoryFilterAction(act)}
                    className={`px-3 py-1 rounded-lg transition cursor-pointer text-[11px] ${
                      historyFilterAction === act ? 'bg-white text-navy-950 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    {act}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-60">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search history..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100 text-slate-600 uppercase tracking-wider text-[10px] font-bold">
                <tr>
                  <th className="py-3 px-4">Date &amp; Time</th>
                  <th className="py-3 px-3">Quotation Code</th>
                  <th className="py-3 px-3">Homeowner</th>
                  <th className="py-3 px-3">Practice Firm</th>
                  <th className="py-3 px-3 text-right">Value</th>
                  <th className="py-3 px-3 text-center">Lifecycle Action</th>
                  <th className="py-3 px-3">Audit Remarks</th>
                  <th className="py-3 px-4 text-right">Operator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      No quotation history records found.
                    </td>
                  </tr>
                ) : (
                  filteredHistory.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                        {formatDate(item.timestamp)}
                      </td>
                      <td className="py-3.5 px-3 font-mono font-bold text-blue-700">
                        {item.quotationCode}
                      </td>
                      <td className="py-3.5 px-3 font-semibold text-slate-900">
                        {item.customerName}
                      </td>
                      <td className="py-3.5 px-3 text-slate-700">
                        {item.firmName || item.architectName}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono font-bold text-navy-950">
                        {formatINR(item.amountPaise)}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.action === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.action === 'PUBLISHED'
                              ? 'bg-blue-100 text-blue-800'
                              : item.action === 'CUSTOMER_ACCEPTED'
                              ? 'bg-purple-100 text-purple-800'
                              : item.action === 'REVISION_REQUESTED'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {item.action}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-slate-600 max-w-xs truncate text-[11px]">
                        {item.notes}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-[10px] text-slate-500 font-bold">
                        {item.adminName}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================================
          MODALS: REVISION, REJECT, PUBLISH, EXTEND, CUSTOMER DECISION
      ============================================================================ */}
      {/* 1. Revision Modal */}
      {showRevisionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-navy-950 text-sm flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-amber-600" />
                <span>Request Revision from Architect</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowRevisionModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <label className="font-bold text-slate-700 block">
                Technical Feedback / Drawing Corrections *
              </label>
              <textarea
                value={revisionFeedback}
                onChange={(e) => setRevisionFeedback(e.target.value)}
                rows={4}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                placeholder="Specify required structural adjustments, BOQ rate revisions..."
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowRevisionModal(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRevision}
                className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs"
              >
                Dispatch Revision Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-navy-950 text-sm flex items-center gap-2 text-rose-700">
                <XCircle className="w-4 h-4 text-rose-600" />
                <span>Reject Quotation</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowRejectModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <label className="font-bold text-slate-700 block">
                Rejection Reason *
              </label>
              <input
                type="text"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowRejectModal(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Publish Modal */}
      {showPublishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-navy-950 text-sm flex items-center gap-2 text-blue-700">
                <Send className="w-4 h-4 text-blue-600" />
                <span>Send Quotation to Customer</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowPublishModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Quotation Validity Window (Days) *
                </label>
                <select
                  value={validityDays}
                  onChange={(e) => setValidityDays(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                >
                  <option value="7">7 Days</option>
                  <option value="15">15 Days (Recommended)</option>
                  <option value="30">30 Days</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Homeowner Cover Note
                </label>
                <textarea
                  value={publishCoverNote}
                  onChange={(e) => setPublishCoverNote(e.target.value)}
                  rows={3}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowPublishModal(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPublish}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs"
              >
                Confirm &amp; Send to Customer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Extend Validity Modal */}
      {showExtendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-navy-950 text-sm flex items-center gap-2 text-blue-700">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>Extend Quotation Validity</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowExtendModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <label className="font-bold text-slate-700 block">
                Additional Validity Days *
              </label>
              <select
                value={extensionDays}
                onChange={(e) => setExtensionDays(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
              >
                <option value="15">+15 Additional Calendar Days</option>
                <option value="30">+30 Additional Calendar Days</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowExtendModal(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmExtend}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs"
              >
                Extend Validity
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Customer Decision Manual Log Modal */}
      {showCustomerDecisionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-navy-950 text-sm flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-purple-600" />
                <span>Log Customer Decision</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowCustomerDecisionModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCustomerDecision('ACCEPT')}
                  className={`flex-1 py-2.5 rounded-xl font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    customerDecision === 'ACCEPT'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  <ThumbsUp className="w-4 h-4" />
                  <span>Customer Accepted</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCustomerDecision('REJECT')}
                  className={`flex-1 py-2.5 rounded-xl font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    customerDecision === 'REJECT'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  <ThumbsDown className="w-4 h-4" />
                  <span>Customer Declined</span>
                </button>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Homeowner Confirmation Remarks
                </label>
                <textarea
                  value={customerDecisionNote}
                  onChange={(e) => setCustomerDecisionNote(e.target.value)}
                  rows={3}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowCustomerDecisionModal(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmCustomerDecision}
                className="px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-xs"
              >
                Save Decision
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================================
          FULL BOQ DOSSIER INSPECTION MODAL (Enhanced)
      ============================================================================ */}
      {inspectingQuote && (
        <div className="admin-fullscreen-modal fixed inset-0 z-50 overflow-y-auto bg-[#f0f7ff] flex flex-col font-sans animate-in fade-in duration-150">
          <div className="h-[2px] bg-gradient-to-r from-transparent via-amber-400 via-sky-400 to-transparent pointer-events-none shrink-0" />
          <div className="sticky top-0 z-40 bg-navy-950 text-white px-4 sm:px-8 py-3.5 border-b border-navy-900 flex items-center justify-between shadow-xl shrink-0">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <button
                type="button"
                onClick={() => setInspectingQuote(null)}
                className="px-3.5 py-2 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs flex items-center gap-2 border border-slate-700/80 hover:border-slate-500 transition group cursor-pointer shrink-0"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span>Back to Desk</span>
              </button>
              <div className="h-6 w-px bg-slate-700 hidden sm:block shrink-0" />
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg font-black font-display text-white truncate">
                  Inspect Quotation: {inspectingQuote.quotationCode || inspectingQuote.id}
                </h2>
                <div className="flex items-center gap-2 text-xs text-slate-300 font-mono">
                  <span>Customer: {inspectingQuote.customerName}</span>
                  <span>•</span>
                  <span>{inspectingQuote.city}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleApproveQuote(inspectingQuote)}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
              >
                Approve Quotation
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPublishModal(inspectingQuote);
                  setInspectingQuote(null);
                }}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
              >
                Publish to Homeowner
              </button>
            </div>
          </div>

          <div className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-8 space-y-6">
            {/* Value & Timeline Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400">Total Quotation Amount</span>
                <div className="text-2xl font-black font-display text-navy-950">
                  {formatINR(inspectingQuote.finalAmountPaise || inspectingQuote.totalAmountPaise || 0)}
                </div>
                <span className="text-[10px] text-emerald-600 font-semibold">Inclusive of GST</span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400">Execution Timeline</span>
                <div className="text-2xl font-black font-display text-blue-700">
                  {inspectingQuote.timelineDays || 45} Days
                </div>
                <span className="text-[10px] text-slate-400 font-mono">Turnkey Delivery</span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400">Advance Escrow Tranche</span>
                <div className="text-2xl font-black font-display text-purple-700">
                  {inspectingQuote.advancePercentage || 15}%
                </div>
                <span className="text-[10px] text-purple-600 font-semibold">Mobilization Deposit</span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400">Current Status</span>
                <div className="text-lg font-black font-display text-navy-950 uppercase">
                  {inspectingQuote.status?.replace(/_/g, ' ') || 'UNDER REVIEW'}
                </div>
                <span className="text-[10px] text-slate-400">Governed by Admin</span>
              </div>
            </div>

            {/* Submitting Architect Details */}
            {(() => {
              const insArch = resolveArchitectInfo(inspectingQuote);
              return (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    <span>Architectural Practice Details</span>
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block">Lead Architect:</span>
                      <strong className="text-slate-900">{insArch.architectName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Firm Name:</span>
                      <strong className="text-slate-900">{insArch.firmName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">COA Number:</span>
                      <span className="font-mono text-indigo-700 font-bold">{insArch.coaNumber || 'COA Verified'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Contact Phone:</span>
                      <span className="font-mono text-slate-900">{insArch.archPhone || inspectingQuote.customerPhone}</span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Scope of Work */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Scope of Architectural Work</span>
              </h4>
              <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                {inspectingQuote.scopeOfWork || 'Comprehensive turnkey design, 2D floor plans, 3D elevation renders, structural load calculations, and site progress audits.'}
              </p>
            </div>

            {/* Itemized BOQ Schedule */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-xs text-navy-950 flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                <span>Itemized BOQ Cost Schedule</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] font-bold">
                    <tr>
                      <th className="p-3">#</th>
                      <th className="p-3">Description</th>
                      <th className="p-3 text-center">Unit</th>
                      <th className="p-3 text-center">Qty</th>
                      <th className="p-3 text-right">Unit Rate</th>
                      <th className="p-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(inspectingQuote.items || inspectingQuote.lineItems || []).length > 0 ? (
                      (inspectingQuote.items || inspectingQuote.lineItems).map((it: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-3 font-mono text-slate-400">{idx + 1}</td>
                          <td className="p-3">
                            <strong className="text-slate-900 block">{it.title || it.description}</strong>
                            {it.category && <span className="text-[10px] text-slate-400">{it.category}</span>}
                          </td>
                          <td className="p-3 text-center font-mono">{it.unit || 'sq.ft'}</td>
                          <td className="p-3 text-center font-mono font-bold">{it.quantity || 1}</td>
                          <td className="p-3 text-right font-mono">{formatINR(it.ratePaise || it.unitPricePaise || 0)}</td>
                          <td className="p-3 text-right font-mono font-bold text-navy-950">{formatINR(it.totalPaise || 0)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-slate-400">
                          Turnkey package quotation: {formatINR(inspectingQuote.finalAmountPaise || inspectingQuote.totalAmountPaise || 0)}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Escrow Milestones */}
            {inspectingQuote.milestones && inspectingQuote.milestones.length > 0 && (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Staged Escrow Milestone Disbursals</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  {inspectingQuote.milestones.map((m: any, idx: number) => (
                    <div key={idx} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                          Stage {idx + 1}
                        </span>
                        <span className="font-mono font-bold text-slate-900">{m.percentage}%</span>
                      </div>
                      <strong className="text-slate-900 block">{m.title || m.name}</strong>
                      <span className="font-mono font-bold text-navy-950 block">{formatINR(m.amountPaise || 0)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
