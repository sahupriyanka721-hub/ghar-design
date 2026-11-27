import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Badge } from '../../components/common/Badge.js';
import { formatDate } from '../../lib/utils.js';
import { useToast } from '../../context/ToastContext.js';
import {
  FileText,
  Users,
  ChevronRight,
  Search,
  Plus,
  X,
  ArrowLeft,
  ArrowRight,
  Check,
  Building,
  Phone,
  User,
  MapPin,
  Layers,
  ShoppingBag,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RotateCcw,
  Send,
  MessageSquare,
  HelpCircle,
  Eye,
  ExternalLink,
  Calendar,
  ShieldCheck,
  ChevronDown,
  RefreshCw,
  Sliders,
  Award,
  AlertCircle,
} from 'lucide-react';
import {
  getPlatformRequests,
  savePlatformRequest,
  updatePlatformRequestStatus,
  syncChannel,
  PlatformProjectRequest,
} from '../../data/customerStore.js';
import { getVendorMaterialRequests, VendorMaterialRequest } from '../../data/vendorStore.js';
import { getArchitectAccounts } from '../../data/architectStore.js';
import { logAdminAuditAction } from '../../data/adminRbacStore.js';

export const AdminRequests: React.FC = () => {
  const { success, error } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlView = searchParams.get('view') || 'NEW_REQUESTS';
  const [requests, setRequests] = useState<PlatformProjectRequest[]>([]);
  const [materialRequests, setMaterialRequests] = useState<VendorMaterialRequest[]>([]);
  const [architects, setArchitects] = useState<any[]>([]);
  const [quotations, setQuotations] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'projects' | 'materials'>('projects');
  const [selectedView, setSelectedView] = useState<string>(urlView);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [requestStep, setRequestStep] = useState<number>(1);

  // Modals state
  const [showClarifyModal, setShowClarifyModal] = useState<PlatformProjectRequest | null>(null);
  const [clarifyQuestion, setClarifyQuestion] = useState('');
  const [clarifyChannel, setClarifyChannel] = useState<'WHATSAPP' | 'PORTAL' | 'ALL'>('ALL');

  const [showAssignModal, setShowAssignModal] = useState<PlatformProjectRequest | null>(null);
  const [assignSelectedIds, setAssignSelectedIds] = useState<string[]>([]);
  const [assignDeadline, setAssignDeadline] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });

  const [showCancelModal, setShowCancelModal] = useState<PlatformProjectRequest | null>(null);
  const [cancelReasonText, setCancelReasonText] = useState('Customer requested to postpone project');

  const [viewingHistoryReq, setViewingHistoryReq] = useState<PlatformProjectRequest | null>(null);

  useEffect(() => {
    if (urlView && urlView !== selectedView) {
      setSelectedView(urlView);
    }
  }, [urlView]);

  const handleSelectView = (viewKey: string) => {
    setSelectedView(viewKey);
    setSearchParams({ view: viewKey });
    setActiveTab('projects');
  };
  const [newReq, setNewReq] = useState({
    customerName: '',
    customerPhone: '',
    categorySlug: 'new-house-construction',
    propertyType: 'Residential Villa',
    plotArea: 1500,
    measurementUnit: 'SQ_FT',
    city: '',
    locality: '',
    budgetRange: 'Flexible',
    description: '',
    status: 'VERIFIED',
  });

  const loadRequests = () => {
    setRequests(getPlatformRequests());
    setMaterialRequests(getVendorMaterialRequests());
    setArchitects(getArchitectAccounts());
    try {
      const qStored = localStorage.getItem('platform_quotations');
      if (qStored) {
        setQuotations(JSON.parse(qStored));
      }
    } catch {}
  };

  const getRequestAmount = (req: PlatformProjectRequest) => {
    const matchingQuote = quotations.find((q: any) =>
      (q.requestId && (q.requestId === req.id || q.requestId === req.requestCode)) ||
      (q.requestCode && (q.requestCode === req.requestCode || q.requestCode === req.id))
    );
    if (matchingQuote) {
      const paise = matchingQuote.finalAmountPaise || matchingQuote.totalAmountPaise;
      if (paise) {
        return `₹${(paise / 100).toLocaleString('en-IN')}`;
      }
      if (matchingQuote.grandTotal) {
        return `₹${Number(matchingQuote.grandTotal).toLocaleString('en-IN')}`;
      }
    }
    return req.budgetRange || 'Flexible';
  };

  const getAssignedArchitects = (req: PlatformProjectRequest) => {
    // 1. If status is NOT an assigned or active state, do not show any assigned architects
    const unassignedStatuses = ['SUBMITTED', 'UNDER_REVIEW', 'UNDER_ADMIN_REVIEW', 'VERIFIED', 'CANCELLED', 'REJECTED'];
    if (unassignedStatuses.includes(req.status)) {
      return [];
    }

    // 2. If structured assignedProfessionals array exists, deduplicate and return
    if (req.assignedProfessionals && Array.isArray(req.assignedProfessionals) && req.assignedProfessionals.length > 0) {
      const seen = new Set<string>();
      return req.assignedProfessionals
        .filter((p: any) => {
          if (!p) return false;
          const key = (p.id || p.phone || p.name || p.firmName || '').toLowerCase().trim();
          if (!key || seen.has(key)) return false;
          seen.add(key);
          return true;
        })
        .map((p: any) => ({
          firmName: p.firmName || p.name || 'Architectural Partner',
          architectName: p.name || 'Verified Architect',
          phone: p.phone ? `+91 ${String(p.phone).replace(/\D/g, '').slice(-10)}` : '',
        }));
    }

    // 3. Otherwise, resolve from selectedProfessionalIds or assignedProfessionalIds
    const sourceIds = (req.selectedProfessionalIds && req.selectedProfessionalIds.length > 0)
      ? req.selectedProfessionalIds
      : req.assignedProfessionalIds || [];

    if (sourceIds.length === 0) return [];

    // Deduplicate by clean architect ID / phone number so each architect appears AT MOST ONCE
    const uniqueMap = new Map<string, { firmName: string; architectName: string; phone: string }>();

    sourceIds.forEach((id) => {
      const cleanTarget = String(id).trim().toLowerCase();
      const cleanPhone = cleanTarget.replace(/\D/g, '').slice(-10);

      const matched = architects.find((a: any) => {
        if (!a) return false;
        if (a.id && a.id.toLowerCase() === cleanTarget) return true;
        if (a.userId && a.userId.toLowerCase() === cleanTarget) return true;
        if (a.applicationNumber && a.applicationNumber.toLowerCase() === cleanTarget) return true;
        const aPhone = (a.phone || '').replace(/\D/g, '').slice(-10);
        if (cleanPhone && cleanPhone.length === 10 && aPhone === cleanPhone) return true;
        if (a.firmName && (a.firmName.toLowerCase() === cleanTarget || cleanTarget === a.firmName.toLowerCase().replace(/\s+/g, ''))) return true;
        if (a.name && (a.name.toLowerCase() === cleanTarget || cleanTarget === a.name.toLowerCase().replace(/\s+/g, ''))) return true;
        return false;
      });

      if (matched) {
        const uniqueKey = (matched.phone ? String(matched.phone).replace(/\D/g, '').slice(-10) : '') || matched.id || matched.name;
        if (!uniqueMap.has(uniqueKey)) {
          uniqueMap.set(uniqueKey, {
            firmName: matched.firmName || matched.name,
            architectName: matched.name,
            phone: matched.phone ? `+91 ${String(matched.phone).replace(/\D/g, '').slice(-10)}` : '',
          });
        }
      }
    });

    // If req.selectedProfessionalIds was explicitly set, but didn't match the registered architects list
    if (uniqueMap.size === 0 && req.selectedProfessionalIds && req.selectedProfessionalIds.length > 0) {
      req.selectedProfessionalIds.forEach((id) => {
        if (!id.includes('+91') && !id.startsWith('usr-') && !uniqueMap.has(id)) {
          uniqueMap.set(id, {
            firmName: id,
            architectName: 'Assigned Partner',
            phone: '',
          });
        }
      });
    }

    return Array.from(uniqueMap.values());
  };

  useEffect(() => {
    loadRequests();
    const interval = setInterval(loadRequests, 30000);
    window.addEventListener('storage', loadRequests);
    window.addEventListener('admin_global_refresh', loadRequests);

    const onSync = (event: MessageEvent) => {
      if (
        event.data?.type === 'PROJECT_REQUESTS_UPDATED' ||
        event.data?.type === 'MATERIAL_REQUESTS_UPDATED' ||
        event.data?.type === 'DATA_PURGED'
      ) {
        loadRequests();
      }
    };
    if (syncChannel) {
      syncChannel.addEventListener('message', onSync);
    }

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', loadRequests);
      window.removeEventListener('admin_global_refresh', loadRequests);
      if (syncChannel) {
        syncChannel.removeEventListener('message', onSync);
      }
    };
  }, []);

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReq.customerName.trim()) {
      error('Customer name is required');
      return;
    }
    const cleanPhone = newReq.customerPhone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      error('Please enter a valid 10-digit customer mobile number');
      return;
    }

    const year = new Date().getFullYear();
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    const requestCode = `GHR-REQ-${year}-${randomCode}`;
    const id = `req-${Date.now()}`;

    const created: PlatformProjectRequest = {
      id,
      requestCode,
      customerId: `usr-cust-${Date.now()}`,
      customerName: newReq.customerName.trim(),
      customerPhone: `+91 ${cleanPhone}`,
      customerEmail: 'Not Provided',
      categorySlug: newReq.categorySlug,
      propertyType: newReq.propertyType,
      plotArea: Number(newReq.plotArea) || 2000,
      measurementUnit: newReq.measurementUnit,
      city: newReq.city.trim() || 'Gurugram',
      locality: newReq.locality.trim() || 'Locality',
      address: `${newReq.locality}, ${newReq.city}`,
      budgetRange: newReq.budgetRange,
      description: newReq.description.trim() || 'Direct structural planning and construction inquiry.',
      status: newReq.status,
      isFeePaid: true,
      quoteFeePaise: 49900,
      assignedCount: 0,
      quotationsCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    savePlatformRequest(created);
    logAdminAuditAction({
      action: 'CREATE_QUOTATION_REQUEST_MANUAL',
      module: 'QUOTATION_REQUEST_MANAGEMENT',
      targetId: created.id,
      targetName: created.requestCode,
      details: {
        customerName: created.customerName,
        city: created.city,
        plotArea: created.plotArea,
      },
    });
    loadRequests();
    setShowAddModal(false);
    setNewReq({
      customerName: '',
      customerPhone: '',
      categorySlug: 'new-house-construction',
      propertyType: 'Residential Villa',
      plotArea: 2400,
      measurementUnit: 'SQ_FT',
      city: 'Gurugram',
      locality: 'Sector 57',
      budgetRange: '₹50 Lakhs - ₹1 Crore',
      description: '',
      status: 'VERIFIED',
    });
    success(`Project request ${requestCode} created with status "${created.status}"!`);
  };

  // ---------------- 6 SUB-FEATURES CALCULATIONS & HANDLERS ----------------
  const newRequestsCount = requests.filter(
    (r) =>
      r.status === 'SUBMITTED' ||
      r.status === 'UNDER_REVIEW' ||
      r.status === 'UNDER_ADMIN_REVIEW' ||
      r.status === 'NEW' ||
      !r.status
  ).length;

  const pendingAssignmentCount = requests.filter((r) => {
    const hasArchitect =
      (r.assignedProfessionals && r.assignedProfessionals.length > 0) ||
      (r.selectedProfessionalIds && r.selectedProfessionalIds.length > 0);
    return (
      !hasArchitect &&
      r.status !== 'CANCELLED' &&
      r.status !== 'COMPLETED' &&
      r.status !== 'CLARIFICATION_REQUESTED'
    );
  }).length;

  const assignedCount = requests.filter(
    (r) =>
      r.status === 'ASSIGNED' ||
      (r.assignedProfessionals && r.assignedProfessionals.length > 0) ||
      (r.selectedProfessionalIds && r.selectedProfessionalIds.length > 0)
  ).length;

  const clarificationCount = requests.filter(
    (r) =>
      r.status === 'CLARIFICATION_REQUESTED' ||
      r.status === 'CHANGES_REQUESTED' ||
      Boolean(r.clarifications && r.clarifications.length > 0)
  ).length;

  const historyCount = requests.length;

  const cancelledCount = requests.filter(
    (r) => r.status === 'CANCELLED' || r.status === 'REJECTED'
  ).length;

  const SUB_VIEWS = [
    {
      id: 'NEW_REQUESTS',
      order: 1,
      label: 'New Quotation Requests',
      icon: Plus,
      count: newRequestsCount,
      highlight: newRequestsCount > 0,
      desc: 'Fresh incoming quotation inquiries awaiting initial screening and verification',
    },
    {
      id: 'PENDING_ASSIGNMENT',
      order: 2,
      label: 'Pending Assignment',
      icon: Clock,
      count: pendingAssignmentCount,
      highlight: pendingAssignmentCount > 0,
      desc: 'Verified requests awaiting architect matching and assignment dispatch',
    },
    {
      id: 'ASSIGNED',
      order: 3,
      label: 'Assigned Requests',
      icon: CheckCircle2,
      count: assignedCount,
      desc: 'Active requests assigned to certified architectural partner practices',
    },
    {
      id: 'CLARIFICATION',
      order: 4,
      label: 'Request Clarification',
      icon: HelpCircle,
      count: clarificationCount,
      highlight: clarificationCount > 0,
      desc: 'Requests pending homeowner clarification on setbacks, soil reports, or scope',
    },
    {
      id: 'HISTORY',
      order: 5,
      label: 'Request History',
      icon: FileText,
      count: historyCount,
      desc: 'Comprehensive historical audit ledger and lifecycle timeline of all inquiries',
    },
    {
      id: 'CANCELLED',
      order: 6,
      label: 'Cancelled Requests',
      icon: XCircle,
      count: cancelledCount,
      desc: 'Disapproved or homeowner-cancelled requests with logged audit reasons',
    },
  ];

  const generateWhatsAppClarifyUrl = (
    phone: string,
    customerName: string,
    requestCode: string,
    question: string
  ) => {
    const cleanPhone = (phone || '').replace(/\D/g, '').slice(-10);
    const text = encodeURIComponent(
      `Hello ${customerName},\n\nRegarding your BuildGhar Quotation Request (${requestCode}):\n\nOur Central Engineering Desk requires a quick clarification:\n"${question}"\n\nPlease reply to this message or visit your BuildGhar homeowner dashboard to confirm, so our architects can finalize your drawings & quotation.`
    );
    return `https://wa.me/91${cleanPhone}?text=${text}`;
  };

  const handleVerifyRequest = (req: PlatformProjectRequest) => {
    const updated = updatePlatformRequestStatus(req.id, 'VERIFIED');
    if (updated) {
      loadRequests();
      logAdminAuditAction({
        action: 'VERIFY_QUOTATION_REQUEST',
        module: 'QUOTATION_REQUEST_MANAGEMENT',
        targetId: req.id,
        targetName: req.requestCode || req.id,
        details: { verifiedAt: new Date().toISOString() },
      });
      success(`Request ${req.requestCode} verified and ready for assignment! ✓`);
    }
  };

  const handleSendClarification = (
    req: PlatformProjectRequest,
    question: string,
    channel: 'WHATSAPP' | 'PORTAL' | 'ALL'
  ) => {
    if (!question.trim()) {
      error('Please enter the clarification question.');
      return;
    }
    const newClarif = {
      id: `clarif-${Date.now()}`,
      question: question.trim(),
      askedBy: 'Admin Engineering Desk',
      askedAt: new Date().toISOString(),
      channel,
      status: 'PENDING' as const,
    };
    const updatedClarifs = [newClarif, ...(req.clarifications || [])];
    const updated = updatePlatformRequestStatus(req.id, 'CLARIFICATION_REQUESTED', {
      clarifications: updatedClarifs,
      adminNotes: `Clarification requested: ${question.trim()}`,
    });

    if (updated) {
      loadRequests();
      logAdminAuditAction({
        action: 'REQUEST_CUSTOMER_CLARIFICATION',
        module: 'QUOTATION_REQUEST_MANAGEMENT',
        targetId: req.id,
        targetName: req.requestCode || req.id,
        details: { question, channel },
      });
      success(`Clarification inquiry recorded for ${req.customerName}!`);
      setShowClarifyModal(null);
      setClarifyQuestion('');

      if (channel === 'WHATSAPP' || channel === 'ALL') {
        const waUrl = generateWhatsAppClarifyUrl(
          req.customerPhone,
          req.customerName,
          req.requestCode,
          question
        );
        window.open(waUrl, '_blank');
      }
    }
  };

  const handleResolveClarification = (req: PlatformProjectRequest) => {
    const updatedClarifs = (req.clarifications || []).map((c) => ({
      ...c,
      status: 'RESOLVED' as const,
      resolvedAt: new Date().toISOString(),
    }));
    const updated = updatePlatformRequestStatus(req.id, 'VERIFIED', {
      clarifications: updatedClarifs,
    });
    if (updated) {
      loadRequests();
      logAdminAuditAction({
        action: 'RESOLVE_CUSTOMER_CLARIFICATION',
        module: 'QUOTATION_REQUEST_MANAGEMENT',
        targetId: req.id,
        targetName: req.requestCode || req.id,
        details: { resolvedAt: new Date().toISOString() },
      });
      success(`Clarification marked resolved! Request moved to Pending Assignment. ✓`);
    }
  };

  const handleQuickAssign = (
    req: PlatformProjectRequest,
    selectedIds: string[],
    deadline: string
  ) => {
    if (selectedIds.length === 0) {
      error('Please select at least one architect practice.');
      return;
    }
    const assignedFirms = selectedIds.map((id) => {
      const arch = architects.find((a) => a.id === id || a.phone === id || a.name === id);
      return {
        id: arch?.id || id,
        firmName: arch?.firmName || arch?.name || id,
        architectName: arch?.name || 'Architect Partner',
        phone: arch?.phone || '',
      };
    });

    const updated = updatePlatformRequestStatus(req.id, 'ASSIGNED', {
      assignedProfessionals: assignedFirms,
      assignedProfessionalIds: selectedIds,
      selectedProfessionalIds: selectedIds,
      assignedCount: selectedIds.length,
      responseDeadline: deadline,
    });

    if (updated) {
      loadRequests();
      logAdminAuditAction({
        action: 'ASSIGN_ARCHITECT_TO_REQUEST',
        module: 'QUOTATION_REQUEST_MANAGEMENT',
        targetId: req.id,
        targetName: req.requestCode || req.id,
        details: { assignedFirms, deadline },
      });
      success(`Request ${req.requestCode} assigned to ${selectedIds.length} architect practice(s)!`);
      setShowAssignModal(null);
      setAssignSelectedIds([]);
    }
  };

  const handleCancelRequest = (req: PlatformProjectRequest, reason: string) => {
    const updated = updatePlatformRequestStatus(req.id, 'CANCELLED', {
      cancellationReason: reason.trim() || 'Cancelled by Admin Operations Desk',
      cancelledAt: new Date().toISOString(),
      cancelledBy: 'Admin Operations Desk',
    });
    if (updated) {
      loadRequests();
      logAdminAuditAction({
        action: 'CANCEL_QUOTATION_REQUEST',
        module: 'QUOTATION_REQUEST_MANAGEMENT',
        targetId: req.id,
        targetName: req.requestCode || req.id,
        details: { reason },
      });
      success(`Request ${req.requestCode} cancelled.`);
      setShowCancelModal(null);
    }
  };

  const handleReopenRequest = (req: PlatformProjectRequest) => {
    const updated = updatePlatformRequestStatus(req.id, 'VERIFIED', {
      cancellationReason: undefined,
      cancelledAt: undefined,
      cancelledBy: undefined,
    });
    if (updated) {
      loadRequests();
      logAdminAuditAction({
        action: 'REOPEN_QUOTATION_REQUEST',
        module: 'QUOTATION_REQUEST_MANAGEMENT',
        targetId: req.id,
        targetName: req.requestCode || req.id,
        details: { reopenedAt: new Date().toISOString() },
      });
      success(`Request ${req.requestCode} reopened and placed in Pending Assignment! ✓`);
    }
  };

  const filteredProjects = requests.filter((r) => {
    let matchesView = true;
    if (selectedView === 'NEW_REQUESTS') {
      matchesView =
        r.status === 'SUBMITTED' ||
        r.status === 'UNDER_REVIEW' ||
        r.status === 'UNDER_ADMIN_REVIEW' ||
        r.status === 'NEW' ||
        !r.status;
    } else if (selectedView === 'PENDING_ASSIGNMENT') {
      const hasArchitect =
        (r.assignedProfessionals && r.assignedProfessionals.length > 0) ||
        (r.selectedProfessionalIds && r.selectedProfessionalIds.length > 0);
      matchesView =
        !hasArchitect &&
        r.status !== 'CANCELLED' &&
        r.status !== 'COMPLETED' &&
        r.status !== 'CLARIFICATION_REQUESTED';
    } else if (selectedView === 'ASSIGNED') {
      const hasArchitect =
        (r.assignedProfessionals && r.assignedProfessionals.length > 0) ||
        (r.selectedProfessionalIds && r.selectedProfessionalIds.length > 0) ||
        r.status === 'ASSIGNED';
      matchesView = hasArchitect && r.status !== 'CANCELLED';
    } else if (selectedView === 'CLARIFICATION') {
      matchesView =
        r.status === 'CLARIFICATION_REQUESTED' ||
        r.status === 'CHANGES_REQUESTED' ||
        Boolean(r.clarifications && r.clarifications.length > 0);
    } else if (selectedView === 'HISTORY') {
      matchesView = true;
    } else if (selectedView === 'CANCELLED') {
      matchesView = r.status === 'CANCELLED' || r.status === 'REJECTED';
    }

    const q = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !q ||
      r.requestCode?.toLowerCase().includes(q) ||
      r.customerName?.toLowerCase().includes(q) ||
      r.customerPhone?.includes(q) ||
      r.city?.toLowerCase().includes(q) ||
      r.categorySlug?.toLowerCase().includes(q) ||
      r.address?.toLowerCase().includes(q);

    return matchesView && matchesSearch;
  });

  const filteredMaterials = materialRequests.filter(
    (r) =>
      r.requestCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.materialItem?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 font-sans">
      {/* ---------------- 6 FEATURE SWITCHER DROPDOWN & MODULE STRIP ---------------- */}
      <div className="space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3.5 bg-white rounded-3xl border border-blue-200/90 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
              <FileText className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md font-mono">
                  Module 4: Quotation Request Management
                </span>
                <span className="text-[10px] text-slate-400 font-mono">6 Features Active</span>
              </div>
              <div className="text-sm font-black text-navy-950 mt-0.5">
                {SUB_VIEWS.find((v) => v.id === selectedView)?.label || 'Quotation Requests'}
              </div>
            </div>
          </div>

          {/* Prominent Feature Selector Dropdown */}
          <div className="flex items-center gap-2 flex-1 max-w-md w-full justify-end">
            <div className="relative flex-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Select Feature View (Dropdown):
              </label>
              <div className="relative">
                <select
                  value={selectedView}
                  onChange={(e) => handleSelectView(e.target.value)}
                  className="w-full pl-3 pr-10 py-2.5 bg-blue-50/70 hover:bg-blue-100/70 border border-blue-300/80 rounded-2xl text-xs font-bold text-navy-950 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-2xs transition appearance-none"
                >
                  {SUB_VIEWS.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.order}. {v.label} ({v.count})
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-blue-600">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="mt-4 px-3.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-2xl flex items-center gap-1.5 shadow-xs transition shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Request</span>
            </button>
          </div>
        </div>

        {/* 6 Feature Pill Navigation Strip */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-white border border-slate-200 shadow-2xs overflow-x-auto scrollbar-thin">
          {SUB_VIEWS.map((t) => {
            const Icon = t.icon;
            const isCurrent = activeTab === 'projects' && selectedView === t.id;
            return (
              <button
                key={t.id}
                onClick={() => handleSelectView(t.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
                  isCurrent
                    ? 'bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 text-white shadow-xs font-black'
                    : 'text-slate-600 hover:bg-blue-50 hover:text-blue-900'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isCurrent ? 'text-amber-300' : 'text-blue-600'}`} />
                <span>{t.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-black ${
                    isCurrent
                      ? 'bg-white/20 text-white'
                      : t.highlight && t.count > 0
                      ? 'bg-amber-100 text-amber-900'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {t.count}
                </span>
              </button>
            );
          })}

          <div className="h-5 w-px bg-slate-200 mx-1 shrink-0" />

          {/* Secondary Material Orders Utility Tab */}
          <button
            onClick={() => setActiveTab('materials')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'materials'
                ? 'bg-amber-600 text-white shadow-xs font-black'
                : 'text-slate-600 hover:bg-amber-50 hover:text-amber-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-amber-500" />
            <span>Material BOQ Inquiries</span>
            <span className="px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-900 text-[10px] font-mono font-black">
              {materialRequests.length}
            </span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Request Code (GHR-REQ-...), Customer Name, Contact, City, Locality, or Plot Specs..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:border-sky-500 focus:bg-white shadow-2xs"
          />
        </div>
      </div>

      {activeTab === 'projects' ? (
        <div className="space-y-4">
          {/* Status-Specific Context Banners */}
          {selectedView === 'NEW_REQUESTS' && (
            <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 text-xs text-sky-950 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Plus className="w-4 h-4 text-sky-600" />
                <span>
                  <strong>1. New Quotation Requests:</strong> Incoming customer inquiry files awaiting administrative screening and verification before assignment.
                </span>
              </div>
              <span className="font-mono font-bold text-sky-800">{filteredProjects.length} Incoming</span>
            </div>
          )}

          {selectedView === 'PENDING_ASSIGNMENT' && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-950 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>
                  <strong>2. Pending Assignment Desk:</strong> Verified homeowner requests ready to be matched and assigned to certified architectural partner practices.
                </span>
              </div>
              <span className="font-mono font-bold text-amber-800">{filteredProjects.length} Ready to Assign</span>
            </div>
          )}

          {selectedView === 'ASSIGNED' && (
            <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-950 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                <span>
                  <strong>3. Assigned Requests:</strong> Active requests currently under review by assigned architectural practices awaiting blueprint and quotation submission.
                </span>
              </div>
              <span className="font-mono font-bold text-indigo-800">{filteredProjects.length} Assigned</span>
            </div>
          )}

          {selectedView === 'CLARIFICATION' && (
            <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 text-xs text-purple-950 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <HelpCircle className="w-4 h-4 text-purple-600" />
                <span>
                  <strong>4. Request Clarification Desk:</strong> Specific inquiries forwarded to homeowners regarding site setbacks, soil classification, or floor heights.
                </span>
              </div>
              <span className="font-mono font-bold text-purple-800">{filteredProjects.length} In Clarification</span>
            </div>
          )}

          {selectedView === 'HISTORY' && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-slate-600" />
                <span>
                  <strong>5. Request History &amp; Audit Ledger:</strong> Chronological record of all platform quotation requests with full lifecycle event timelines.
                </span>
              </div>
              <span className="font-mono font-bold text-slate-800">{filteredProjects.length} Total Requests</span>
            </div>
          )}

          {selectedView === 'CANCELLED' && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-950 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <XCircle className="w-4 h-4 text-rose-600" />
                <span>
                  <strong>6. Cancelled Requests Directory:</strong> Requests cancelled by homeowner or rejected by admin with logged reason and 1-click restore action.
                </span>
              </div>
              <span className="font-mono font-bold text-rose-800">{filteredProjects.length} Cancelled</span>
            </div>
          )}

          {/* Clean Executive Quotation Requests Table */}
          <div className="card overflow-hidden bg-white border border-slate-200 shadow-sm rounded-3xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-4">Request Code</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Site Address</th>
                  <th className="p-4">Budget / Amount</th>
                  <th className="p-4">Assigned Architect</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProjects.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-slate-500">
                      <div className="space-y-1">
                        <p className="font-bold text-slate-700 text-sm">No quotation requests found in this view</p>
                        <p className="text-[11px] text-slate-400">
                          {selectedView === 'NEW_REQUESTS' && 'No new incoming requests awaiting screening.'}
                          {selectedView === 'PENDING_ASSIGNMENT' && 'No verified requests waiting for architect assignment.'}
                          {selectedView === 'ASSIGNED' && 'No active requests currently assigned to architects.'}
                          {selectedView === 'CLARIFICATION' && 'No open clarification threads with customers.'}
                          {selectedView === 'CANCELLED' && 'No cancelled requests recorded on the platform.'}
                          {selectedView === 'HISTORY' && 'No quotation requests match the current search.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredProjects.map((req) => {
                    const assignedFirms = getAssignedArchitects(req);
                    const isNew =
                      req.status === 'SUBMITTED' ||
                      req.status === 'UNDER_REVIEW' ||
                      req.status === 'UNDER_ADMIN_REVIEW' ||
                      req.status === 'NEW' ||
                      !req.status;
                    const isAssigned =
                      req.status === 'ASSIGNED' || assignedFirms.length > 0;
                    const isCancelled =
                      req.status === 'CANCELLED' || req.status === 'REJECTED';
                    const hasClarification =
                      req.status === 'CLARIFICATION_REQUESTED' ||
                      Boolean(req.clarifications && req.clarifications.length > 0);

                    return (
                      <tr key={req.id} className="hover:bg-slate-50/80 transition group">
                        {/* 1. Request Code & Date */}
                        <td className="p-4 font-mono font-bold text-navy-950">
                          <Link
                            to={`/admin/requests/${req.id}`}
                            className="hover:text-blue-600 hover:underline transition block font-bold text-xs"
                            title="Click to inspect complete request details"
                          >
                            {req.requestCode}
                          </Link>
                          <div className="text-[10px] text-slate-400 font-normal mt-0.5">
                            {formatDate(req.createdAt)}
                          </div>
                        </td>

                        {/* 2. Customer Name & Contact */}
                        <td className="p-4">
                          <Link
                            to={`/admin/requests/${req.id}`}
                            className="font-bold text-slate-800 hover:text-blue-600 hover:underline block transition cursor-pointer text-xs"
                          >
                            {req.customerName}
                          </Link>
                          <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{req.customerPhone}</span>
                          </div>
                        </td>

                        {/* 3. Customer Site Address & Scope */}
                        <td className="p-4 min-w-[180px]">
                          <div className="flex items-start gap-1 text-slate-700">
                            <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                            <span className="text-xs font-semibold leading-snug">
                              {req.address || [req.locality, req.city, req.state].filter(Boolean).join(', ') || 'Address on file'}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5 font-medium">
                            {req.plotArea ? `${req.plotArea} ${req.measurementUnit?.toLowerCase() || 'sq.ft'}` : ''} • {req.categorySlug?.replace(/-/g, ' ')}
                          </div>
                        </td>

                        {/* 4. Total Amount / Budget */}
                        <td className="p-4 whitespace-nowrap">
                          <span className="font-bold text-navy-950 text-xs px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200 inline-block">
                            {getRequestAmount(req)}
                          </span>
                        </td>

                        {/* 5. Assigned Architect(s) Firm Name, Architect Name & Contact */}
                        <td className="p-4 min-w-[190px]">
                          {assignedFirms.length === 0 ? (
                            <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 inline-flex items-center gap-1">
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>Pending Assignment</span>
                            </span>
                          ) : (
                            <div className="space-y-1">
                              {assignedFirms.map((firm, idx) => (
                                <div key={idx} className="text-xs leading-tight">
                                  <div className="font-bold text-slate-900">{firm.firmName}</div>
                                  <div className="text-[10px] text-slate-500">
                                    {firm.architectName} {firm.phone && <span className="font-mono text-slate-600">• {firm.phone}</span>}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>

                        {/* 6. Status Badge */}
                        <td className="p-4">
                          <div className="flex flex-col gap-1 items-start">
                            <Badge status={req.status} />
                            {hasClarification && (
                              <span className="text-[9px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                                Clarification Sent
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 7. Context Tailored Actions */}
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            {/* Verify Button for New Requests */}
                            {isNew && (
                              <button
                                type="button"
                                onClick={() => handleVerifyRequest(req)}
                                className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center gap-1 transition shadow-2xs cursor-pointer"
                                title="Screen and mark request as Verified"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Verify ✓</span>
                              </button>
                            )}

                            {/* Assign Button */}
                            {!isCancelled && assignedFirms.length === 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setShowAssignModal(req);
                                  setAssignSelectedIds([]);
                                }}
                                className="px-2.5 py-1 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs inline-flex items-center gap-1 transition shadow-2xs cursor-pointer"
                                title="Quick Assign Architect"
                              >
                                <Layers className="w-3.5 h-3.5" />
                                <span>Assign</span>
                              </button>
                            )}

                            {/* Clarify Button */}
                            {!isCancelled && (
                              <button
                                type="button"
                                onClick={() => {
                                  setShowClarifyModal(req);
                                  setClarifyQuestion(
                                    req.clarifications?.[0]?.question ||
                                      'Please provide confirmation regarding municipal setback compliance and preferred architectural design style.'
                                  );
                                }}
                                className="px-2.5 py-1 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs inline-flex items-center gap-1 transition shadow-2xs cursor-pointer"
                                title="Send Clarification Question to Homeowner"
                              >
                                <HelpCircle className="w-3.5 h-3.5" />
                                <span>Clarify</span>
                              </button>
                            )}

                            {/* Reopen Button for Cancelled Requests */}
                            {isCancelled && (
                              <button
                                type="button"
                                onClick={() => handleReopenRequest(req)}
                                className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center gap-1 transition shadow-2xs cursor-pointer"
                                title="Reopen Cancelled Request"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Reopen</span>
                              </button>
                            )}

                            {/* History Timeline Button */}
                            <button
                              type="button"
                              onClick={() => setViewingHistoryReq(req)}
                              className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs inline-flex items-center gap-1 transition cursor-pointer"
                              title="View Request Event Timeline"
                            >
                              <Clock className="w-3.5 h-3.5 text-slate-500" />
                              <span>Timeline</span>
                            </button>

                            {/* Inspect Link */}
                            <Link
                              to={`/admin/requests/${req.id}`}
                              className="btn-outline text-xs py-1 px-2.5 inline-flex items-center gap-1"
                              title="Open Full Request Dossier"
                            >
                              <span>Inspect</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card overflow-hidden bg-white border border-slate-200 shadow-sm rounded-3xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-4">Inquiry Code</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Delivery Site</th>
                <th className="p-4">Scope / BOQ Items</th>
                <th className="p-4">Status</th>
                <th className="p-4">Submitted</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMaterials.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-slate-500">
                    <div className="space-y-1">
                      <p className="font-semibold text-slate-700">No bulk material inquiries found</p>
                      <p className="text-[11px] text-slate-400">
                        When customers request house civil material quotes on /materials, they will appear here.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredMaterials.map((mReq) => (
                  <tr key={mReq.id} className="hover:bg-slate-50">
                    <td className="p-4 font-mono font-bold text-navy-950">
                      <Link
                        to="/admin/materials"
                        className="hover:text-amber-700 hover:underline transition"
                        title="Click to inspect quotes & bids"
                      >
                        {mReq.requestCode}
                      </Link>
                    </td>
                    <td className="p-4">
                      <Link
                        to="/admin/materials"
                        className="font-semibold text-slate-800 hover:text-amber-700 hover:underline block transition cursor-pointer"
                        title="Click to inspect quotes & bids"
                      >
                        {mReq.customerName}
                      </Link>
                      <div className="text-[11px] text-slate-400 font-mono">{mReq.customerPhone}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-slate-800 font-medium">{mReq.city}</div>
                      <div className="text-[11px] text-slate-400 truncate max-w-xs">{mReq.deliverySiteAddress}</div>
                    </td>
                    <td className="p-4 text-slate-700">
                      <div className="font-semibold text-slate-900">
                        {mReq.materialItem || `${mReq.builtUpAreaSqFt} sq.ft Package`}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {mReq.items?.length ? `${mReq.items.length} BOQ categories specified` : 'Standard Civil Package'}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold uppercase">
                        {mReq.status}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500 text-[11px]">
                      {formatDate(mReq.createdAt)}
                    </td>
                    <td className="p-4 text-right">
                      <Link
                        to="/admin/materials"
                        className="btn-outline text-xs py-1.5 px-3 inline-flex items-center gap-1 text-amber-700 hover:text-amber-800"
                      >
                        <span>Inspect Quotes & Bids</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Manual Request Creation Modal (Stepper Wizard) */}
      {showAddModal && (
        <div className="admin-fullscreen-modal fixed inset-0 z-50 overflow-y-auto bg-[#f0f7ff] flex flex-col font-sans animate-in fade-in duration-150">
          <div className="h-[2px] bg-gradient-to-r from-transparent via-amber-400 via-sky-400 to-transparent pointer-events-none shrink-0" />
          <div className="sticky top-0 z-40 bg-navy-950 text-white px-4 sm:px-8 py-3.5 border-b border-navy-900 flex items-center justify-between shadow-xl shrink-0">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setRequestStep(1);
                }}
                className="px-3.5 py-2 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs flex items-center gap-2 border border-slate-700/80 hover:border-slate-500 transition group cursor-pointer shrink-0"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="hidden sm:inline">Back / Cancel</span>
                <span className="sm:hidden">Back</span>
              </button>
              <div className="h-6 w-px bg-slate-700 hidden sm:block shrink-0" />
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-base font-display shrink-0">
                  <FileText className="w-5 h-5 text-blue-400" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base sm:text-lg font-black font-display text-white truncate">
                    Create Customer Quotation Request
                  </h2>
                  <div className="text-[11px] text-slate-400 font-mono truncate">
                    Step {requestStep} of 3 • Civil Planning & Quotation Intake Wizard
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setRequestStep(1);
                }}
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span className="hidden sm:inline">Close</span>
              </button>
            </div>
          </div>

          <div className="flex-1 max-w-[1100px] w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
            {/* Stepper Header */}
            <div className="bg-white rounded-2xl p-4 sm:p-6 border border-blue-200/80 shadow-sm">
              <div className="flex items-center justify-between max-w-xl mx-auto">
                {[
                  { step: 1, title: 'Customer & Category', icon: User },
                  { step: 2, title: 'Property & Dimensions', icon: Building },
                  { step: 3, title: 'Scope & Budget', icon: Layers },
                ].map((item, idx, arr) => (
                  <div key={item.step} className="flex items-center flex-1 last:flex-none">
                    <button
                      type="button"
                      onClick={() => {
                        if (item.step < requestStep) setRequestStep(item.step);
                      }}
                      className="flex flex-col items-center gap-1 group text-center cursor-pointer"
                    >
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xs transition ${
                          requestStep === item.step
                            ? 'bg-blue-600 text-white shadow-md ring-4 ring-blue-100'
                            : requestStep > item.step
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-400 border border-slate-200'
                        }`}
                      >
                        {requestStep > item.step ? (
                          <Check className="w-5 h-5 text-white" />
                        ) : (
                          <item.icon className="w-5 h-5" />
                        )}
                      </div>
                      <span
                        className={`text-[11px] font-bold mt-1 transition ${
                          requestStep === item.step
                            ? 'text-blue-900'
                            : requestStep > item.step
                            ? 'text-emerald-700'
                            : 'text-slate-400'
                        }`}
                      >
                        {item.title}
                      </span>
                    </button>
                    {idx < arr.length - 1 && (
                      <div
                        className={`flex-1 h-0.5 mx-3 mb-5 transition ${
                          requestStep > item.step ? 'bg-emerald-500' : 'bg-slate-200'
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Stepper Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-blue-200/80 shadow-xl">
              <form onSubmit={handleCreateRequest}>
                {/* STEP 1: CUSTOMER & CATEGORY */}
                {requestStep === 1 && (
                  <div className="space-y-6 animate-in fade-in duration-150">
                    <div className="border-b border-slate-100 pb-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
                        <span>Step 1 of 3</span>
                      </div>
                      <h3 className="text-xl font-bold text-navy-950 font-display">
                        Client Identity & Primary Engineering Service
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Enter client contact and select core architectural or civil construction package.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                          <User className="w-4 h-4 text-blue-600" />
                          <span>Customer Full Name</span>
                          <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder=""
                          value={newReq.customerName}
                          onChange={(e) => setNewReq({ ...newReq, customerName: e.target.value })}
                          className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl font-bold text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                          <Phone className="w-4 h-4 text-blue-600" />
                          <span>Customer Mobile Number</span>
                          <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-3.5 text-slate-400 font-bold text-xs">+91</span>
                          <input
                            type="tel"
                            required
                            maxLength={10}
                            placeholder="10-digit mobile"
                            value={newReq.customerPhone}
                            onChange={(e) => setNewReq({ ...newReq, customerPhone: e.target.value })}
                            className="w-full pl-14 pr-4 py-3.5 bg-slate-50 border border-slate-300 rounded-2xl font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5 sm:col-span-2">
                        <label className="font-bold text-slate-800 text-sm">Primary Service Category <span className="text-rose-500">*</span></label>
                        <select
                          value={newReq.categorySlug}
                          onChange={(e) => setNewReq({ ...newReq, categorySlug: e.target.value })}
                          className="w-full p-3.5 border border-slate-300 rounded-2xl font-bold text-slate-800 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none text-xs"
                        >
                          <option value="new-house-construction">Complete Turnkey New House Construction</option>
                          <option value="home-renovation">Whole Home Renovation & Remodeling</option>
                          <option value="house-map-planning">Architectural House Map & 3D Spatial Planning</option>
                          <option value="structural-engineering">Structural Engineering & RCC Drawings</option>
                          <option value="interior-designing">Luxury Interior Architecture & Styling</option>
                          <option value="complete-construction-package">Complete Construction & Material Supply Package</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: PROPERTY & DIMENSIONS */}
                {requestStep === 2 && (
                  <div className="space-y-6 animate-in fade-in duration-150">
                    <div className="border-b border-slate-100 pb-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
                        <span>Step 2 of 3</span>
                      </div>
                      <h3 className="text-xl font-bold text-navy-950 font-display">
                        Property Typology & Site Geometry
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Specify building type, plot area dimensions, and site location.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-800 text-sm">Property Type <span className="text-rose-500">*</span></label>
                        <input
                          type="text"
                          required
                          placeholder=""
                          value={newReq.propertyType}
                          onChange={(e) => setNewReq({ ...newReq, propertyType: e.target.value })}
                          className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-800 text-sm">Plot Area (Sq. Ft) <span className="text-rose-500">*</span></label>
                        <input
                          type="number"
                          min={100}
                          value={newReq.plotArea}
                          onChange={(e) => setNewReq({ ...newReq, plotArea: Number(e.target.value) })}
                          className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-blue-600" />
                          <span>City / District</span>
                          <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder=""
                          value={newReq.city}
                          onChange={(e) => setNewReq({ ...newReq, city: e.target.value })}
                          className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-800 text-sm">Locality / Sector</label>
                        <input
                          type="text"
                          placeholder=""
                          value={newReq.locality}
                          onChange={(e) => setNewReq({ ...newReq, locality: e.target.value })}
                          className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3: SCOPE & BUDGET */}
                {requestStep === 3 && (
                  <div className="space-y-6 animate-in fade-in duration-150">
                    <div className="border-b border-slate-100 pb-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
                        <span>Step 3 of 3</span>
                      </div>
                      <h3 className="text-xl font-bold text-navy-950 font-display">
                        Budget Range, Notes & Request Publishing
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Review customer scope and publish request to architects and contractor bidding desks.
                      </p>
                    </div>

                    <div className="space-y-4 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="font-bold text-slate-800 text-sm">Budget Range <span className="text-rose-500">*</span></label>
                          <select
                            value={newReq.budgetRange}
                            onChange={(e) => setNewReq({ ...newReq, budgetRange: e.target.value })}
                            className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl font-bold text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                          >
                            <option value="₹25 - ₹50 Lakhs">₹25 - ₹50 Lakhs</option>
                            <option value="₹50 Lakhs - ₹1 Crore">₹50 Lakhs - ₹1 Crore</option>
                            <option value="₹1 Crore - ₹2.5 Crores">₹1 Crore - ₹2.5 Crores</option>
                            <option value="Above ₹2.5 Crores">Above ₹2.5 Crores</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="font-bold text-slate-800 text-sm">Initial Verification Status</label>
                          <select
                            value={newReq.status}
                            onChange={(e) => setNewReq({ ...newReq, status: e.target.value })}
                            className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl font-bold text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                          >
                            <option value="VERIFIED">VERIFIED (Technical Scope Approved & Open for Quotes)</option>
                            <option value="UNDER_REVIEW">UNDER REVIEW (Vetting Pending)</option>
                            <option value="SUBMITTED">SUBMITTED (Raw Homeowner Lead)</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-800 text-sm">Scope Description / Engineering Notes</label>
                        <textarea
                          rows={4}
                          placeholder=""
                          value={newReq.description}
                          onChange={(e) => setNewReq({ ...newReq, description: e.target.value })}
                          className="w-full p-4 bg-slate-50 border border-slate-300 rounded-2xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>

                      {/* Request Summary Preview */}
                      <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Customer</span>
                          <p className="text-sm font-bold text-navy-950 mt-0.5">{newReq.customerName || 'Not Entered'} (+91 {newReq.customerPhone})</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Selected Service</span>
                          <p className="text-sm font-bold text-blue-900 mt-0.5">{newReq.categorySlug}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Site Footprint</span>
                          <p className="text-xs font-bold text-slate-800 mt-0.5">{newReq.plotArea} Sq. Ft ({newReq.propertyType})</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Site Location</span>
                          <p className="text-xs font-semibold text-slate-700 mt-0.5">{newReq.locality ? `${newReq.locality}, ` : ''}{newReq.city}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation Footer */}
                <div className="flex items-center justify-between gap-3 pt-6 border-t border-slate-200 mt-6">
                  {requestStep > 1 ? (
                    <button
                      type="button"
                      onClick={() => setRequestStep(requestStep - 1)}
                      className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 transition flex items-center gap-2 text-xs cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Previous Step</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-600 font-bold hover:bg-slate-100 transition text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}

                  <div className="text-xs text-slate-400 font-mono hidden sm:block">
                    Step {requestStep} of 3
                  </div>

                  {requestStep < 3 ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (requestStep === 1) {
                          if (!newReq.customerName.trim()) {
                            error('Please enter the customer name');
                            return;
                          }
                          const clean = newReq.customerPhone.replace(/\D/g, '').slice(-10);
                          if (clean.length !== 10) {
                            error('Please enter a valid 10-digit mobile number');
                            return;
                          }
                        } else if (requestStep === 2) {
                          if (!newReq.city.trim()) {
                            error('Please enter the city');
                            return;
                          }
                        }
                        setRequestStep(requestStep + 1);
                      }}
                      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md flex items-center gap-2 text-xs transition cursor-pointer"
                    >
                      <span>Proceed to Step {requestStep + 1}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md flex items-center gap-2 text-xs transition cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Publish Quotation Request</span>
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- 1. CLARIFICATION MODAL ---------------- */}
      {showClarifyModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-navy-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-navy-950">
                    Request Homeowner Clarification
                  </h3>
                  <div className="text-[11px] text-slate-500 font-mono">
                    {showClarifyModal.requestCode} • {showClarifyModal.customerName}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowClarifyModal(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Clarification Question / Technical Inquiry:
                </label>
                <textarea
                  rows={3}
                  value={clarifyQuestion}
                  onChange={(e) => setClarifyQuestion(e.target.value)}
                  placeholder="Enter the specific clarification required from the customer (e.g. municipal setback rules, soil report, plot elevation height)..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-purple-500 focus:bg-white transition"
                />
              </div>

              {/* Quick Presets */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Quick Question Presets:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Please confirm front and rear municipal setback allowances.',
                    'Please specify soil report or existing foundation type.',
                    'Confirm total number of floors (G+1, G+2) and parking bays.',
                    'Confirm whether interior 3D renderings are required in this phase.',
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setClarifyQuestion(preset)}
                      className="text-[10px] font-medium text-slate-600 bg-slate-100 hover:bg-purple-50 hover:text-purple-700 px-2.5 py-1 rounded-lg transition text-left"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Communication Channel */}
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Dispatch Channel:
                </label>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {[
                    { id: 'ALL', label: 'WhatsApp + Portal' },
                    { id: 'WHATSAPP', label: 'WhatsApp Direct' },
                    { id: 'PORTAL', label: 'Customer Portal' },
                  ].map((ch) => (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => setClarifyChannel(ch.id as any)}
                      className={`py-2 px-2 rounded-xl text-center font-bold text-[11px] border transition cursor-pointer ${
                        clarifyChannel === ch.id
                          ? 'bg-purple-50 border-purple-400 text-purple-900 shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {ch.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowClarifyModal(null)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() =>
                  handleSendClarification(showClarifyModal, clarifyQuestion, clarifyChannel)
                }
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send to Homeowner</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- 2. QUICK ASSIGN ARCHITECT MODAL ---------------- */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-navy-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-navy-950">
                    Assign Architect Practice to Request
                  </h3>
                  <div className="text-[11px] text-slate-500 font-mono">
                    {showAssignModal.requestCode} • {showAssignModal.city} ({showAssignModal.plotArea} {showAssignModal.measurementUnit || 'sq.ft'})
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAssignModal(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Select Certified Architectural Practice(s):
                </label>
                <div className="max-h-60 overflow-y-auto space-y-1.5 p-1 rounded-2xl bg-slate-50 border border-slate-200 scrollbar-thin">
                  {architects
                    .filter((a) => a.accountStatus === 'APPROVED' || a.isVerified)
                    .map((arch) => {
                      const isSelected = assignSelectedIds.includes(arch.id);
                      return (
                        <div
                          key={arch.id}
                          onClick={() => {
                            setAssignSelectedIds((prev) =>
                              prev.includes(arch.id)
                                ? prev.filter((id) => id !== arch.id)
                                : [...prev, arch.id]
                            );
                          }}
                          className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                            isSelected
                              ? 'bg-indigo-50 border-indigo-300 text-indigo-950'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                                isSelected
                                  ? 'bg-indigo-600 border-indigo-600 text-white'
                                  : 'border-slate-300 bg-white'
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3" />}
                            </div>
                            <div className="min-w-0">
                              <span className="font-bold text-xs truncate block">
                                {arch.firmName || arch.name}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono block">
                                COA: {arch.coaNumber || 'COA Verified'} • {arch.city || 'Central'} • {arch.experienceYears || 5} Yrs Exp
                              </span>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono font-bold text-slate-400 shrink-0">
                            +91 {arch.phone ? arch.phone.replace(/\D/g, '').slice(-10) : ''}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Assignment Deadline */}
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Quotation Submission Deadline:
                </label>
                <input
                  type="date"
                  value={assignDeadline}
                  onChange={(e) => setAssignDeadline(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-navy-950 focus:outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-bold">
                {assignSelectedIds.length} Practice(s) Selected
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(null)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleQuickAssign(showAssignModal, assignSelectedIds, assignDeadline)
                  }
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Confirm Assignment</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- 3. CANCEL REQUEST MODAL ---------------- */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-navy-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                  <XCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-navy-950">
                    Cancel Quotation Request
                  </h3>
                  <div className="text-[11px] text-slate-500 font-mono">
                    {showCancelModal.requestCode} • {showCancelModal.customerName}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCancelModal(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Cancellation Reason:
                </label>
                <input
                  type="text"
                  value={cancelReasonText}
                  onChange={(e) => setCancelReasonText(e.target.value)}
                  placeholder="Reason for cancellation..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-rose-500 focus:bg-white"
                />
              </div>

              <div className="flex flex-wrap gap-1.5">
                {[
                  'Customer requested to postpone project',
                  'Plot outside current municipal coverage zone',
                  'Duplicate quotation request submitted',
                  'Land title verification pending',
                ].map((reason, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCancelReasonText(reason)}
                    className="text-[10px] font-medium text-slate-600 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 px-2 py-1 rounded-lg transition"
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCancelModal(null)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
              >
                Keep Active
              </button>
              <button
                type="button"
                onClick={() => handleCancelRequest(showCancelModal, cancelReasonText)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- 4. REQUEST LIFECYCLE TIMELINE MODAL ---------------- */}
      {viewingHistoryReq && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-navy-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-navy-950">
                    Request Lifecycle Event Timeline
                  </h3>
                  <div className="text-[11px] text-slate-500 font-mono">
                    {viewingHistoryReq.requestCode} • {viewingHistoryReq.customerName}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingHistoryReq(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Event Timeline Steps */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 text-xs">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <span className="font-bold text-slate-900 block">Customer Inquiry Submitted</span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {formatDate(viewingHistoryReq.createdAt)} • Via BuildGhar Web Portal
                  </span>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Plot Area: {viewingHistoryReq.plotArea} {viewingHistoryReq.measurementUnit || 'sq.ft'} • {viewingHistoryReq.city}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <span className="font-bold text-slate-900 block">Administrative Screening &amp; Fee Status</span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Verified by Central Governance Desk • Fee: {viewingHistoryReq.isFeePaid ? 'Paid ₹499 ✓' : 'Waived'}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
                    viewingHistoryReq.assignedProfessionals?.length
                      ? 'bg-indigo-100 text-indigo-800'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  3
                </div>
                <div>
                  <span className="font-bold text-slate-900 block">Architect Assignment Status</span>
                  {viewingHistoryReq.assignedProfessionals?.length ? (
                    <span className="text-[11px] text-indigo-700 font-semibold block">
                      Assigned to {viewingHistoryReq.assignedProfessionals.length} certified practice(s)
                    </span>
                  ) : (
                    <span className="text-[11px] text-amber-700 font-semibold block">
                      Pending Architect Matching
                    </span>
                  )}
                  {viewingHistoryReq.responseDeadline && (
                    <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                      Submission Deadline: {viewingHistoryReq.responseDeadline}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
                    viewingHistoryReq.status === 'COMPLETED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : viewingHistoryReq.status === 'CANCELLED'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  4
                </div>
                <div>
                  <span className="font-bold text-slate-900 block">Current Milestone Status</span>
                  <span className="text-[11px] font-bold text-navy-950 font-mono">
                    Status: {viewingHistoryReq.status.replace(/_/g, ' ')}
                  </span>
                  {viewingHistoryReq.cancellationReason && (
                    <p className="text-[11px] text-rose-700 mt-1 p-2 bg-rose-50 rounded-lg">
                      Cancellation Reason: {viewingHistoryReq.cancellationReason}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setViewingHistoryReq(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
              >
                Close Timeline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
