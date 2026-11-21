import React, { useEffect, useState } from 'react';
import {
  Link, useSearchParams } from 'react-router-dom';
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
import { pushToCloud, cleanRecords } from '../../data/cloudSync.js';
import { purgeDummyData } from '../../data/customerStore.js';
import { safeSetStorage, safeGetStorage } from '../../lib/safeStorage.js';

export const AdminQuotationsReview: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'requests' ? 'REQUESTS' : 'QUOTATIONS';
  const [activeTab, setActiveTab] = useState<'REQUESTS' | 'QUOTATIONS'>(initialTab);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'requests') {
      setActiveTab('REQUESTS');
    } else if (tabParam === 'quotations') {
      setActiveTab('QUOTATIONS');
    }
  }, [searchParams]);
  const [requests, setRequests] = useState<PlatformProjectRequest[]>([]);
  const [quotations, setQuotations] = useState<any[]>([]);
  const { success, error } = useToast();
  const [reviewNote, setReviewNote] = useState('');
  const [activeQuoteId, setActiveQuoteId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Modal for admin direct quotation creation
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [quoteStep, setQuoteStep] = useState<1 | 2 | 3>(1);
  const [newQuote, setNewQuote] = useState({
    requestCode: '',
    scopeOfWork: 'Complete Engineering & Structural Design Package',
    totalAmountRupees: '185000',
    city: 'Gurugram',
    timelineDays: '45',
  });

  const loadData = () => {
    // 1. Load customer project requests
    const allReqs = getPlatformRequests();
    setRequests(allReqs);

    // 2. Load generated quotations
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
    } catch (e) {
      console.error(e);
    }
    setQuotations(localQuotes);
  };

  const handleRefresh = (manual = false) => {
    setRefreshing(true);
    loadData();
    if (manual) {
      success('Quotations & requests refreshed.');
    }
    setTimeout(() => setRefreshing(false), 500);
  };

  useEffect(() => {
    loadData();

    // Auto-refresh silently every 1 minute (60,000 ms)
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

    // Try fetching from API if backend is active
    apiRequest('/admin/quotations')
      .then((res) => {
        if (res.data && Array.isArray(res.data) && res.data.length > 0) {
          setQuotations(res.data);
        }
      })
      .catch(() => {});

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', loadData);
      if (syncChannel) {
        syncChannel.removeEventListener('message', onSync);
      }
    };
  }, []);

  const openQuoteModalForRequest = (req: PlatformProjectRequest) => {
    setNewQuote({
      requestCode: req.requestCode || req.id,
      scopeOfWork: `Complete Turnkey ${req.categorySlug || 'Engineering'} package for ${req.plotArea ? `${req.plotArea} sq ft` : 'Property'} in ${req.city || 'Delhi NCR'}`,
      totalAmountRupees: req.estimatedBudgetPaise ? String(req.estimatedBudgetPaise / 100) : '185000',
      city: req.city || 'Gurugram',
      timelineDays: '45',
    });
    setQuoteStep(1);
    setIsAddModalOpen(true);
  };

  const handleCreateQuotation = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(newQuote.totalAmountRupees);
    if (isNaN(amountNum) || amountNum <= 0) {
      error('Please enter a valid quotation amount in ₹');
      return;
    }

    const allRequests = getPlatformRequests();
    const matchedReq = allRequests.find(
      (r) =>
        r.requestCode?.toLowerCase() === newQuote.requestCode?.trim().toLowerCase() ||
        r.id === newQuote.requestCode?.trim()
    );

    const created: any = {
      id: `quote-${Date.now()}`,
      quotationCode: generateQuotationCode(),
      requestId: matchedReq?.id || `req-${Date.now()}`,
      requestCode: matchedReq?.requestCode || newQuote.requestCode,
      customerId: matchedReq?.customerId || `usr-cust-${Date.now()}`,
      customerName: matchedReq?.customerName || 'Registered Homeowner',
      customerPhone: matchedReq?.customerPhone || '',
      professionalId: 'prof-admin',
      professionalName: 'BuildGhar Platform Engineering Desk',
      professional: {
        id: 'prof-admin',
        name: 'BuildGhar Platform Engineering Desk',
        firmName: 'BuildGhar Central Technical Advisory',
        rating: 4.9,
        completedProjects: 85,
        verifiedBadge: true,
        city: newQuote.city,
        phone: '+91 8319955741',
      },
      finalAmountPaise: Math.round(amountNum * 100),
      scopeOfWork: newQuote.scopeOfWork,
      city: newQuote.city,
      timelineDays: parseInt(newQuote.timelineDays) || 30,
      advancePercentage: 15,
      status: 'PUBLISHED_TO_CUSTOMER',
      adminFeedback: 'Created and verified directly by Platform Administrator.',
      items: [
        {
          id: `item-1`,
          title: `Turnkey Execution Package: ${newQuote.scopeOfWork}`,
          description: 'Comprehensive structural supervision, verified materials, and milestone stage quality audits.',
          category: 'Civil & Architectural Execution',
          ratePaise: Math.round(amountNum * 100),
          quantity: 1,
          unit: 'lumpsum',
          totalPaise: Math.round(amountNum * 100),
        },
      ],
      lineItems: [
        {
          id: `item-1`,
          description: `Turnkey Execution Package: ${newQuote.scopeOfWork}`,
          quantity: 1,
          unit: 'lumpsum',
          unitPricePaise: Math.round(amountNum * 100),
          totalPaise: Math.round(amountNum * 100),
        },
      ],
      milestones: [
        { title: 'Project Mobilization & Architectural Approvals', percentage: 15, amountPaise: Math.round(amountNum * 100 * 0.15) },
        { title: 'Foundation & Plinth Structural Completion', percentage: 25, amountPaise: Math.round(amountNum * 100 * 0.25) },
        { title: 'Superstructure RCC Slab Casting & Masonry', percentage: 35, amountPaise: Math.round(amountNum * 100 * 0.35) },
        { title: 'Final Finishing, Snag Clearance & Handover', percentage: 25, amountPaise: Math.round(amountNum * 100 * 0.25) },
      ],
      includedDeliverables: [
        'Vetted architectural 2D structural blueprints and elevation concepts',
        'Certified IS-code standard construction materials and batch testing reports',
        'Dedicated senior site supervisor and daily WhatsApp milestone photo updates',
        '10-year structural warranty certificate signed upon completion',
      ],
      excludedWork: [
        'Municipal authority building permission fees and external liaisoning',
        'State electricity board transformer or secondary meter connection tariffs',
        'Luxury false ceiling and loose furniture (available as optional add-on)',
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (matchedReq) {
      updatePlatformRequestStatus(matchedReq.id, 'QUOTATIONS_AVAILABLE', {
        quotationsCount: (matchedReq.quotationsCount || 0) + 1,
      });
    }

    try {
      const parsed = safeGetStorage<any[]>('platform_quotations', []);
      const updated = [created, ...parsed];
      safeSetStorage('platform_quotations', updated);
      broadcastStoreUpdate('QUOTATIONS_UPDATED', created);
      setQuotations((prev) => [created, ...prev]);
      pushToCloud().catch(() => {});
      success(`Direct quotation ${created.quotationCode} created and published to customer successfully!`);
      setIsAddModalOpen(false);
      setActiveTab('QUOTATIONS');
    } catch (err: any) {
      error(err.message || 'Failed to save quotation');
    }
  };

  const handleAction = async (quoteId: string, action: 'APPROVE' | 'REQUEST_CHANGES' | 'REJECT' | 'PUBLISH') => {
    try {
      const res = await apiRequest(`/admin/quotations/${quoteId}/review`, {
        method: 'POST',
        body: JSON.stringify({
          action,
          adminFeedback: reviewNote || `Quotation ${action.toLowerCase()}ed by administrator.`,
        }),
      }).catch(() => null);

      const newStatus =
        action === 'APPROVE'
          ? 'APPROVED'
          : action === 'PUBLISH'
          ? 'PUBLISHED_TO_CUSTOMER'
          : action === 'REJECT'
          ? 'REJECTED'
          : 'CHANGES_REQUESTED';

      const updated = quotations.map((q) =>
        q.id === quoteId
          ? {
              ...q,
              status: res?.data?.status || newStatus,
              adminFeedback: reviewNote || `Quotation ${action.toLowerCase()}ed by administrator.`,
            }
          : q
      );

      setQuotations(updated);
      safeSetStorage('platform_quotations', updated);
      broadcastStoreUpdate('QUOTATIONS_UPDATED', updated);
      pushToCloud().catch(() => {});

      success(`Quotation ${action.toLowerCase()}ed successfully.`);
      setActiveQuoteId(null);
      setReviewNote('');
    } catch (err: any) {
      error(err.message || 'Action failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-navy-950">Quotations Review & Publish Desk</h1>
          <p className="text-xs text-slate-500">
            Monitor incoming customer RFQ requests, inspect property specifications, and publish vetted BOQ quotations.
          </p>
        </div>

        <button
          onClick={() => handleRefresh(true)}
          disabled={refreshing}
          className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-2xs self-start sm:self-auto"
          title="Auto-refreshes every 1 minute. Click to refresh immediately."
        >
          <RotateCcw className={`w-3.5 h-3.5 text-slate-500 ${refreshing ? 'animate-spin text-amber-600' : ''}`} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      {/* Main Tab Switcher */}
      <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-2xl w-fit border border-slate-200">
        <button
          onClick={() => {
            setActiveTab('QUOTATIONS');
            setSearchParams({ tab: 'quotations' });
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'QUOTATIONS'
              ? 'bg-white text-navy-950 shadow-xs'
              : 'text-slate-600 hover:text-navy-950'
          }`}
        >
          <FileCheck2 className="w-4 h-4 text-gold-600" />
          <span>Professional Quotations & Publish</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800">
            {quotations.length}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab('REQUESTS');
            setSearchParams({ tab: 'requests' });
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'REQUESTS'
              ? 'bg-white text-navy-950 shadow-xs'
              : 'text-slate-600 hover:text-navy-950'
          }`}
        >
          <FileText className="w-4 h-4 text-blue-600" />
          <span>Customer Inquiries Awaiting Quotes</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-800">
            {requests.length}
          </span>
        </button>
      </div>

      {/* ================= TAB 2: GENERATED QUOTATIONS ================= */}
      {activeTab === 'QUOTATIONS' && (
        <div className="space-y-6">
          {quotations.length === 0 ? (
            <div className="card p-12 text-center space-y-3 bg-white border border-slate-200">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-gold-600 mx-auto flex items-center justify-center">
                <FileCheck2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-navy-950 text-base font-display">No Quotations Under Review</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No quotations have been generated yet. Incoming quotation submissions from verified architects and professionals will appear here for governance review.
              </p>
            </div>
          ) : (
            quotations.map((q) => (
              <div key={q.id} className="card p-6 space-y-4 bg-white border border-slate-200">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-3">
                      <Link
                        to={`/admin/requests/${q.requestId}`}
                        className="font-mono text-sm font-bold text-navy-950 hover:text-blue-600 hover:underline transition"
                        title="Click to inspect and assign"
                      >
                        {q.quotationCode}
                      </Link>
                      <span className="text-xs text-slate-500">
                        For Request:{' '}
                        <Link
                          to={`/admin/requests/${q.requestId}`}
                          className="font-bold text-slate-800 hover:text-blue-600 hover:underline"
                        >
                          {q.requestCode}
                        </Link>
                      </span>
                      <Badge status={q.status} />
                    </div>
                    <div className="text-xs text-slate-400">
                      Customer:{' '}
                      <Link
                        to={`/admin/requests/${q.requestId}`}
                        className="font-bold text-slate-700 hover:text-blue-600 hover:underline"
                      >
                        {q.customerName || 'Registered Homeowner'}
                      </Link>{' '}
                      • Location: {q.city} • Submitted {formatDate(q.createdAt)}
                    </div>
                  </div>

                  <div className="text-lg font-bold font-display text-navy-950">
                    {formatINR(q.finalAmountPaise)}
                  </div>
                </div>

                <div className="text-xs text-slate-600 space-y-2">
                  <p>
                    <strong>Scope:</strong> {q.scopeOfWork}
                  </p>
                  {q.professionalName && (
                    <p className="text-slate-500">
                      <strong>Submitted By:</strong> {q.professionalName} ({q.professional?.firmName || 'Certified Firm'})
                    </p>
                  )}
                  {q.adminFeedback && (
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded text-slate-700">
                      <strong>Current Admin Log:</strong> {q.adminFeedback}
                    </div>
                  )}
                </div>

                {/* Line Items if available */}
                {q.items && q.items.length > 0 && (
                  <div className="border border-slate-100 rounded-xl overflow-hidden text-xs">
                    <div className="bg-slate-50 p-2 font-bold text-slate-700">Itemized BOQ Schedule ({q.items.length} items)</div>
                    <div className="divide-y divide-slate-100">
                      {q.items.slice(0, 3).map((it: any, idx: number) => (
                        <div key={idx} className="p-2 flex justify-between text-slate-600">
                          <span>{it.title}</span>
                          <span className="font-mono font-bold">{formatINR(it.ratePaise)}</span>
                        </div>
                      ))}
                      {q.items.length > 3 && (
                        <div className="p-1.5 text-center text-[11px] text-slate-400 bg-slate-50/50">
                          + {q.items.length - 3} more schedule items
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Admin Controls */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleAction(q.id, 'APPROVE')}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 flex items-center gap-1 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => handleAction(q.id, 'PUBLISH')}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 flex items-center gap-1 cursor-pointer"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Publish to Customer</span>
                    </button>
                    <button
                      onClick={() => setActiveQuoteId(activeQuoteId === q.id ? null : q.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 flex items-center gap-1 cursor-pointer"
                    >
                      <span>Add Admin Note</span>
                    </button>
                  </div>
                </div>

                {/* Note Editor Drawer */}
                {activeQuoteId === q.id && (
                  <div className="p-3 bg-slate-50 rounded-xl space-y-2 border border-slate-200">
                    <textarea
                      value={reviewNote}
                      onChange={(e) => setReviewNote(e.target.value)}
                      placeholder="Enter technical audit remarks or requested rate modifications..."
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white"
                      rows={2}
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setActiveQuoteId(null)}
                        className="px-3 py-1 text-xs text-slate-600 hover:bg-slate-200 rounded"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleAction(q.id, 'REQUEST_CHANGES')}
                        className="px-3 py-1 text-xs font-semibold bg-navy-950 text-white rounded hover:bg-navy-900"
                      >
                        Save & Request Modification
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* ================= TAB 1: CUSTOMER REQUESTS AWAITING QUOTES ================= */}
      {activeTab === 'REQUESTS' && (
        <div className="space-y-4">
          {requests.length === 0 ? (
            <div className="card p-12 text-center space-y-3 bg-white border border-slate-200">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-navy-950 text-base font-display">No Customer Requests Found</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                When customers submit project inquiries on <code>/create-request</code>, they will appear here immediately for quotation creation and professional matching.
              </p>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
              <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-700">
                  Incoming Customer Quotation Inquiries ({requests.length})
                </span>
                <span className="text-[11px] text-slate-500">
                  Assign certified professionals or create an immediate verified quote for the customer.
                </span>
              </div>
              <div className="divide-y divide-slate-100">
                {requests.map((req) => (
                  <div
                    key={req.id}
                    className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50/50 transition"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <Link
                          to={`/admin/requests/${req.id}`}
                          className="font-mono text-xs font-bold text-navy-950 hover:text-blue-600 hover:underline transition"
                          title="Click to inspect and assign"
                        >
                          {req.requestCode}
                        </Link>
                        <Badge status={req.status} />
                        <Link
                          to={`/admin/requests/${req.id}`}
                          className="text-xs font-bold text-navy-950 hover:text-blue-600 hover:underline transition"
                          title="Click to inspect and assign"
                        >
                          {req.customerName}
                        </Link>
                        <span className="text-xs text-slate-400 font-mono">({req.customerPhone})</span>
                      </div>
                      <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2">
                        <span>City: <strong>{req.city}</strong></span>
                        <span>•</span>
                        <span>Category: <strong>{req.categorySlug || 'Civil & Architectural'}</strong></span>
                        <span>•</span>
                        <span>Plot Area: <strong>{req.plotArea ? `${req.plotArea} sq ft` : 'Custom'}</strong></span>
                        {req.budgetRange && (
                          <>
                            <span>•</span>
                            <span>Budget: <strong className="text-emerald-700">{req.budgetRange}</strong></span>
                          </>
                        )}
                        <span>•</span>
                        <span className="text-slate-400 font-mono">Submitted: {formatDate(req.createdAt)}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {((req.quotationsCount || 0) > 0 || req.status === 'QUOTATIONS_AVAILABLE') && (
                        <button
                          onClick={() => setActiveTab('QUOTATIONS')}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-300 transition flex items-center gap-1 cursor-pointer shadow-2xs"
                        >
                          <Share2 className="w-3.5 h-3.5 text-blue-600" />
                          <span>View & Publish Quotes</span>
                        </button>
                      )}
                      <button
                        onClick={() => openQuoteModalForRequest(req)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 transition flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5 text-amber-700" />
                        <span>Create Direct Quote</span>
                      </button>
                      <Link
                        to={`/admin/requests/${req.id}`}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-navy-950 hover:bg-navy-900 text-white transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <span>Inspect & Assign Pros</span>
                        <ArrowRight className="w-3.5 h-3.5 text-gold-400" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= MODAL: DIRECT QUOTATION CREATION ================= */}
      {isAddModalOpen && (
        <div className="admin-fullscreen-modal fixed inset-0 z-50 overflow-y-auto bg-[#f0f7ff] flex flex-col font-sans animate-in fade-in duration-150">
          <div className="h-[2px] bg-gradient-to-r from-transparent via-amber-400 via-sky-400 to-transparent pointer-events-none shrink-0" />
          <div className="sticky top-0 z-40 bg-navy-950 text-white px-4 sm:px-8 py-3.5 border-b border-navy-900 flex items-center justify-between shadow-xl shrink-0">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-3.5 py-2 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs flex items-center gap-2 border border-slate-700/80 hover:border-slate-500 transition group cursor-pointer shrink-0"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="hidden sm:inline">Back / Cancel</span>
                <span className="sm:hidden">Back</span>
              </button>
              <div className="h-6 w-px bg-slate-700 hidden sm:block shrink-0" />
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-base font-display shrink-0">
                  <FileCheck2 className="w-5 h-5 text-blue-400" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base sm:text-lg font-black font-display text-white truncate">
                    Create Direct Commercial Quotation
                  </h2>
                  <div className="text-[11px] text-slate-400 font-mono truncate">
                    Quotations Review • Admin Platform Operations
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span className="hidden sm:inline">Close</span>
              </button>
            </div>
          </div>

          <div className="flex-1 max-w-[1200px] w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
            {/* STEPPER PROGRESS INDICATOR */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-blue-200/80 shadow-sm">
              <div className="grid grid-cols-3 gap-2 sm:gap-4">
                {[
                  { step: 1, title: '1. Request & Scope', desc: 'Association & Package Scope' },
                  { step: 2, title: '2. Valuation & Timeline', desc: 'Pricing, City & Days' },
                  { step: 3, title: '3. Review & Dispatch', desc: 'Final Check & Publication' },
                ].map((s) => {
                  const isActive = quoteStep === s.step;
                  const isCompleted = quoteStep > s.step;
                  return (
                    <button
                      key={s.step}
                      type="button"
                      onClick={() => {
                        if (isCompleted || s.step < quoteStep) setQuoteStep(s.step as 1 | 2 | 3);
                      }}
                      className={`text-left p-3 rounded-xl border transition cursor-pointer flex flex-col justify-center ${
                        isActive
                          ? 'bg-blue-50/80 border-blue-500 ring-2 ring-blue-500/20'
                          : isCompleted
                          ? 'bg-emerald-50/60 border-emerald-300 text-emerald-800'
                          : 'bg-slate-50 border-slate-200 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            isActive
                              ? 'bg-blue-600 text-white'
                              : isCompleted
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-300 text-slate-700'
                          }`}
                        >
                          {isCompleted ? <Check className="w-3 h-3" /> : s.step}
                        </span>
                        <span className="font-bold text-xs text-navy-950 truncate">{s.title}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 mt-1 pl-7 hidden sm:inline truncate">{s.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* STEP CONTENT PANELS */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-blue-200/80 shadow-xl">
              <form onSubmit={handleCreateQuotation} className="space-y-6">
                {/* STEP 1: REQUEST & SCOPE */}
                {quoteStep === 1 && (
                  <div className="space-y-5 animate-in fade-in duration-200">
                    <div className="border-b border-slate-100 pb-3">
                      <h3 className="text-base font-bold text-navy-950">Step 1: Link Customer Request & Outline Scope</h3>
                      <p className="text-xs text-slate-500">Associate an active project request or enter custom details for quotation.</p>
                    </div>

                    <div className="space-y-4 text-xs">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Select Customer Request</label>
                        {requests.length > 0 ? (
                          <select
                            className="input-field font-mono"
                            value={newQuote.requestCode}
                            onChange={(e) => {
                              const selectedCode = e.target.value;
                              const matched = requests.find(
                                (r) => r.requestCode === selectedCode || r.id === selectedCode
                              );
                              if (matched) {
                                setNewQuote({
                                  ...newQuote,
                                  requestCode: selectedCode,
                                  city: matched.city || newQuote.city,
                                  scopeOfWork: `Complete Turnkey ${matched.categorySlug || 'Engineering'} package for ${matched.plotArea ? `${matched.plotArea} sq ft` : 'Property'} in ${matched.city || 'Delhi NCR'}`,
                                });
                              } else {
                                setNewQuote({ ...newQuote, requestCode: selectedCode });
                              }
                            }}
                          >
                            <option value="">-- Choose Customer Request --</option>
                            {requests.map((r) => (
                              <option key={r.id} value={r.requestCode}>
                                {r.requestCode} - {r.customerName} ({r.city})
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            required
                            placeholder=""
                            className="input-field font-mono"
                            value={newQuote.requestCode}
                            onChange={(e) => setNewQuote({ ...newQuote, requestCode: e.target.value })}
                          />
                        )}
                        <p className="text-[11px] text-slate-400 mt-1">Selecting a request automatically pre-fills site city and scope summary.</p>
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Scope of Work & Deliverables *</label>
                        <textarea
                          required
                          rows={4}
                          placeholder="Describe engineering drawings, 3D elevations, structural vetted stamps included..."
                          className="input-field"
                          value={newQuote.scopeOfWork}
                          onChange={(e) => setNewQuote({ ...newQuote, scopeOfWork: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setIsAddModalOpen(false)}
                        className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs transition cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!newQuote.scopeOfWork.trim()) {
                            alert('Please enter a scope of work description.');
                            return;
                          }
                          setQuoteStep(2);
                        }}
                        className="px-6 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs flex items-center gap-2 shadow-md transition cursor-pointer"
                      >
                        <span>Proceed to Valuation & Timeline</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 2: VALUATION & TIMELINE */}
                {quoteStep === 2 && (
                  <div className="space-y-5 animate-in fade-in duration-200">
                    <div className="border-b border-slate-100 pb-3">
                      <h3 className="text-base font-bold text-navy-950">Step 2: Commercial Valuation & Schedule</h3>
                      <p className="text-xs text-slate-500">Specify contract amount, execution timeline, and target site city.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Total Fee / Quote (₹) *</label>
                        <input
                          type="number"
                          required
                          placeholder=""
                          className="input-field font-mono"
                          value={newQuote.totalAmountRupees}
                          onChange={(e) => setNewQuote({ ...newQuote, totalAmountRupees: e.target.value })}
                        />
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Timeline (Days) *</label>
                        <input
                          type="number"
                          required
                          placeholder=""
                          className="input-field font-mono"
                          value={newQuote.timelineDays}
                          onChange={(e) => setNewQuote({ ...newQuote, timelineDays: e.target.value })}
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="font-bold text-slate-700 block mb-1">Project Site City *</label>
                        <input
                          type="text"
                          required
                          placeholder=""
                          className="input-field"
                          value={newQuote.city}
                          onChange={(e) => setNewQuote({ ...newQuote, city: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setQuoteStep(1)}
                        className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back to Step 1</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const amt = parseFloat(newQuote.totalAmountRupees);
                          if (isNaN(amt) || amt <= 0) {
                            alert('Please enter a valid quotation amount.');
                            return;
                          }
                          if (!newQuote.city.trim()) {
                            alert('Please enter a site city.');
                            return;
                          }
                          setQuoteStep(3);
                        }}
                        className="px-6 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs flex items-center gap-2 shadow-md transition cursor-pointer"
                      >
                        <span>Proceed to Final Review</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3: REVIEW & PUBLISH */}
                {quoteStep === 3 && (
                  <div className="space-y-5 animate-in fade-in duration-200">
                    <div className="border-b border-slate-100 pb-3">
                      <h3 className="text-base font-bold text-navy-950">Step 3: Review & Publish Direct Quotation</h3>
                      <p className="text-xs text-slate-500">Confirm commercial terms before dispatching to the customer portal.</p>
                    </div>

                    <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-500 font-semibold uppercase block">Request Association</span>
                          <span className="font-mono font-bold text-navy-950 text-sm">{newQuote.requestCode || 'Direct Platform Offer'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 font-semibold uppercase block">Site Location</span>
                          <span className="font-bold text-navy-950 text-sm">{newQuote.city}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 font-semibold uppercase block">Execution Schedule</span>
                          <span className="font-bold text-navy-950 text-sm">{newQuote.timelineDays} Calendar Days</span>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-200">
                        <span className="text-[10px] text-slate-500 font-semibold uppercase block mb-1">Contract Scope & Deliverables</span>
                        <p className="text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-200 font-mono leading-relaxed whitespace-pre-wrap">
                          {newQuote.scopeOfWork}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-slate-500 font-semibold uppercase block">Total Turnkey Commercial Value</span>
                          <div className="text-2xl font-black text-emerald-600 font-mono">
                            ₹{Number(newQuote.totalAmountRupees || 0).toLocaleString('en-IN')}
                          </div>
                        </div>
                        <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-full">
                          Ready for Issuance
                        </span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setQuoteStep(2)}
                        className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back to Step 2</span>
                      </button>
                      <button
                        type="submit"
                        className="btn-gold px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg text-xs cursor-pointer active:scale-95"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Publish & Dispatch Quotation</span>
                      </button>
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
