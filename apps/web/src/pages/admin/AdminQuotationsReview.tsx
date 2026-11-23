import React, { useEffect, useState, useMemo } from 'react';
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
  User,
  Phone,
  MapPin,
  Building,
  ShieldCheck,
  Calendar,
  Eye,
  Search,
  MessageSquare,
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
  const [activeTab, setActiveTab] = useState<'QUOTATIONS'>('QUOTATIONS');
  const [requests, setRequests] = useState<PlatformProjectRequest[]>([]);
  const [quotations, setQuotations] = useState<any[]>([]);
  const { success, error } = useToast();
  const [reviewNote, setReviewNote] = useState('');
  const [activeQuoteId, setActiveQuoteId] = useState<string | null>(null);
  const [inspectingQuote, setInspectingQuote] = useState<any | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | string>('ALL');

  const filteredQuotations = useMemo(() => {
    return quotations.filter((q) => {
      if (statusFilter !== 'ALL' && q.status !== statusFilter) {
        return false;
      }
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      const code = (q.quotationCode || q.id || '').toLowerCase();
      const reqCode = (q.requestCode || '').toLowerCase();
      const cust = (q.customerName || '').toLowerCase();
      const city = (q.city || '').toLowerCase();
      const scope = (q.scopeOfWork || '').toLowerCase();
      const pro = (q.professionalName || '').toLowerCase();
      return (
        code.includes(term) ||
        reqCode.includes(term) ||
        cust.includes(term) ||
        city.includes(term) ||
        scope.includes(term) ||
        pro.includes(term)
      );
    });
  }, [quotations, statusFilter, searchTerm]);

  // Modal for admin direct quotation creation
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [quoteStep, setQuoteStep] = useState<1 | 2 | 3>(1);
  const [newQuote, setNewQuote] = useState({
    requestCode: '',
    scopeOfWork: '',
    totalAmountRupees: '',
    city: '',
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
      setInspectingQuote((prev: any) =>
        prev && prev.id === quoteId
          ? {
              ...prev,
              status: res?.data?.status || newStatus,
              adminFeedback: reviewNote || `Quotation ${action.toLowerCase()}ed by administrator.`,
            }
          : prev
      );
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

      {/* Quotations Metric Badge & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-100 text-navy-950 border border-slate-200 flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-gold-600" />
              <span>Professional Quotations Registered</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800">
                {quotations.length}
              </span>
            </div>
            {filteredQuotations.length !== quotations.length && (
              <span className="text-xs text-slate-500">
                Showing {filteredQuotations.length} of {quotations.length}
              </span>
            )}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search code, request, client, city..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white transition"
            />
          </div>
        </div>

        {/* Status Filters */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Status:</span>
          {[
            { id: 'ALL', label: 'All Quotations' },
            { id: 'PENDING_REVIEW', label: 'Pending Review' },
            { id: 'APPROVED', label: 'Approved' },
            { id: 'PUBLISHED_TO_CUSTOMER', label: 'Published' },
            { id: 'ACCEPTED', label: 'Accepted by Homeowner' },
            { id: 'REJECTED', label: 'Rejected' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-navy-950 text-white shadow-2xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ================= QUOTATIONS TABLE VIEW ================= */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Quotation Code</th>
                <th className="py-3.5 px-4">Request Ref</th>
                <th className="py-3.5 px-4">Customer & City</th>
                <th className="py-3.5 px-4 min-w-[220px]">Scope & BOQ Schedule</th>
                <th className="py-3.5 px-4">Submitted By</th>
                <th className="py-3.5 px-4 text-right">Amount (₹)</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredQuotations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 px-4 text-center space-y-2">
                    <FileCheck2 className="w-8 h-8 text-slate-300 mx-auto" />
                    <div className="text-sm font-bold text-slate-700">No Quotations Found</div>
                    <div className="text-xs text-slate-400">
                      {quotations.length === 0
                        ? 'No quotations generated or submitted yet.'
                        : 'No quotations matching the selected search query or status filter.'}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredQuotations.map((q) => (
                  <React.Fragment key={q.id}>
                    <tr className="hover:bg-sky-50/40 transition group">
                      {/* Quotation Code */}
                      <td className="py-3.5 px-4 align-top">
                        <button
                          type="button"
                          onClick={() => setInspectingQuote(q)}
                          className="font-mono text-xs font-bold text-navy-950 hover:text-sky-600 hover:underline transition text-left cursor-pointer flex items-center gap-1.5"
                          title="Click to inspect full dossier"
                        >
                          <FileText className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                          <span>{q.quotationCode || q.id}</span>
                        </button>
                        <span className="text-[10px] text-slate-400 block mt-1 font-mono">
                          {formatDate(q.createdAt)}
                        </span>
                      </td>

                      {/* Request Ref */}
                      <td className="py-3.5 px-4 align-top">
                        {q.requestId ? (
                          <Link
                            to={`/admin/requests/${q.requestId}`}
                            className="font-mono text-xs font-bold text-sky-700 hover:underline block"
                            title="Inspect parent customer request"
                          >
                            {q.requestCode || q.requestId}
                          </Link>
                        ) : (
                          <span className="font-mono text-xs text-slate-600 font-bold">
                            {q.requestCode || 'Direct'}
                          </span>
                        )}
                      </td>

                      {/* Customer & City */}
                      <td className="py-3.5 px-4 align-top">
                        <span className="font-bold text-slate-900 block truncate max-w-[150px]">
                          {q.customerName || 'Registered Homeowner'}
                        </span>
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[130px]">{q.city || 'Gurugram'}</span>
                        </div>
                      </td>

                      {/* Scope & BOQ */}
                      <td className="py-3.5 px-4 align-top max-w-[280px]">
                        <p className="line-clamp-2 text-slate-600 leading-snug" title={q.scopeOfWork}>
                          {q.scopeOfWork || 'General Architectural Planning & Turnkey Construction Scope'}
                        </p>
                        {q.items && q.items.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setInspectingQuote(q)}
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-full mt-1.5 hover:bg-sky-100 transition cursor-pointer"
                          >
                            <Layers className="w-2.5 h-2.5" />
                            <span>Itemized BOQ ({q.items.length} items)</span>
                          </button>
                        )}
                        {q.adminFeedback && (
                          <div className="text-[10px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 mt-1 truncate">
                            <strong>Log:</strong> {q.adminFeedback}
                          </div>
                        )}
                      </td>

                      {/* Submitted By */}
                      <td className="py-3.5 px-4 align-top max-w-[180px]">
                        <span className="font-bold text-slate-800 block truncate" title={q.professionalName}>
                          {q.professionalName || 'BuildGhar Platform'}
                        </span>
                        <span className="text-[10px] text-slate-400 block truncate">
                          {q.professional?.firmName || 'Platform Technical Advisory'}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 align-top text-right whitespace-nowrap">
                        <span className="text-sm font-black font-display text-navy-950 block">
                          {formatINR(q.finalAmountPaise)}
                        </span>
                        <span className="text-[10px] text-emerald-700 font-bold block">
                          Escrow Guaranteed
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 align-top text-center whitespace-nowrap">
                        <Badge status={q.status} />
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 align-top text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setInspectingQuote(q)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-navy-950 hover:bg-navy-900 text-white flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
                            title="Inspect full BOQ schedule & scope"
                          >
                            <Eye className="w-3.5 h-3.5 text-sky-300" />
                            <span>Inspect</span>
                          </button>

                          {q.status !== 'APPROVED' && q.status !== 'ACCEPTED' && q.status !== 'PUBLISHED_TO_CUSTOMER' && (
                            <button
                              type="button"
                              onClick={() => handleAction(q.id, 'APPROVE')}
                              className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition cursor-pointer"
                              title="Approve quotation"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {q.status !== 'PUBLISHED_TO_CUSTOMER' && q.status !== 'ACCEPTED' && (
                            <button
                              type="button"
                              onClick={() => handleAction(q.id, 'PUBLISH')}
                              className="p-1.5 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 transition cursor-pointer"
                              title="Publish quotation to customer"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {q.status !== 'REJECTED' && (
                            <button
                              type="button"
                              onClick={() => handleAction(q.id, 'REJECT')}
                              className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition cursor-pointer"
                              title="Reject quotation"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setActiveQuoteId(activeQuoteId === q.id ? null : q.id)}
                            className={`p-1.5 rounded-lg border transition cursor-pointer ${
                              activeQuoteId === q.id
                                ? 'bg-amber-100 border-amber-300 text-amber-900'
                                : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
                            }`}
                            title="Add administrative audit note"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expandable Note Drawer */}
                    {activeQuoteId === q.id && (
                      <tr className="bg-amber-50/50">
                        <td colSpan={8} className="p-3 border-t border-amber-100">
                          <div className="space-y-2 max-w-2xl">
                            <span className="text-[11px] font-bold text-amber-950 block">
                              Administrative Audit Note for {q.quotationCode || q.id}:
                            </span>
                            <textarea
                              value={reviewNote}
                              onChange={(e) => setReviewNote(e.target.value)}
                              placeholder="Enter technical audit remarks or requested rate modifications..."
                              className="w-full text-xs p-2.5 border border-amber-200 rounded-xl bg-white focus:outline-none focus:border-amber-400"
                              rows={2}
                            />
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => setActiveQuoteId(null)}
                                className="px-3 py-1 text-xs text-slate-600 hover:bg-slate-200 rounded-lg transition"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleAction(q.id, 'REQUEST_CHANGES')}
                                className="px-3.5 py-1 text-xs font-bold bg-navy-950 text-white rounded-lg hover:bg-navy-900 transition"
                              >
                                Save Note & Request Modification
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>



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

      {/* ========================================================================= */}
      {/* FULL-SCREEN EXECUTIVE QUOTATION DOSSIER MODAL                             */}
      {/* ========================================================================= */}
      {inspectingQuote && (
        <div className="admin-fullscreen-modal fixed inset-0 z-50 overflow-y-auto bg-[#f0f7ff] flex flex-col font-sans animate-in fade-in duration-150">
          <div className="h-[2px] bg-gradient-to-r from-transparent via-amber-400 via-sky-400 to-transparent pointer-events-none shrink-0" />

          {/* Sticky Top Bar */}
          <div className="sticky top-0 z-40 bg-navy-950 text-white px-4 sm:px-8 py-3.5 border-b border-navy-900 flex items-center justify-between shadow-xl shrink-0">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <button
                type="button"
                onClick={() => setInspectingQuote(null)}
                className="px-3.5 py-2 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs flex items-center gap-2 border border-slate-700/80 hover:border-slate-500 transition group cursor-pointer shrink-0"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="hidden sm:inline">Back to Quotations Review</span>
                <span className="sm:hidden">Back</span>
              </button>
              <div className="h-6 w-px bg-slate-700 hidden sm:block shrink-0" />
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center font-bold text-base font-display shrink-0">
                  <FileCheck2 className="w-5 h-5 text-amber-400" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-base sm:text-lg font-black font-display text-white truncate">
                      {inspectingQuote.quotationCode || 'Quotation Dossier'}
                    </h2>
                    <Badge status={inspectingQuote.status} />
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono truncate">
                    Request Ref: {inspectingQuote.requestCode || inspectingQuote.requestId} • Submitted {formatDate(inspectingQuote.createdAt)}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {inspectingQuote.status !== 'APPROVED' && (
                <button
                  type="button"
                  onClick={() => handleAction(inspectingQuote.id, 'APPROVE')}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Approve Quotation</span>
                </button>
              )}
              {inspectingQuote.status !== 'PUBLISHED_TO_CUSTOMER' && (
                <button
                  type="button"
                  onClick={() => handleAction(inspectingQuote.id, 'PUBLISH')}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Publish to Customer</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => handleAction(inspectingQuote.id, 'REJECT')}
                className="px-3.5 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reject</span>
              </button>
              <button
                type="button"
                onClick={() => setInspectingQuote(null)}
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span className="hidden sm:inline">Close</span>
              </button>
            </div>
          </div>

          {/* Dossier Content Body */}
          <div className="flex-1 max-w-[1200px] w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
            {/* Top Metric Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-blue-200/80 shadow-xs">
                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Total Quotation Value</span>
                <div className="text-2xl font-black font-display text-navy-950 mt-1">
                  {formatINR(inspectingQuote.finalAmountPaise || inspectingQuote.totalAmountPaise || 0)}
                </div>
                <div className="text-[11px] text-emerald-600 font-medium mt-0.5">Includes GST & Technical Supervision</div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-blue-200/80 shadow-xs">
                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Estimated Timeline</span>
                <div className="text-2xl font-black font-display text-blue-700 mt-1">
                  {inspectingQuote.timelineDays || inspectingQuote.estimatedDurationDays || 30} Days
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">Phased Milestone Execution</div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-blue-200/80 shadow-xs">
                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Offer Validity</span>
                <div className="text-base font-bold text-slate-900 mt-1 font-mono">
                  {inspectingQuote.validUntil ? formatDate(inspectingQuote.validUntil) : '30 Days from Submission'}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">Guaranteed Rate Commitment</div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-blue-200/80 shadow-xs">
                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Advance Tranche</span>
                <div className="text-2xl font-black font-display text-amber-600 mt-1">
                  {inspectingQuote.advancePercentage || 15}%
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">Mobilization Escrow Deposit</div>
              </div>
            </div>

            {/* Homeowner & Professional Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Homeowner & Site Details */}
              <div className="bg-white p-6 rounded-2xl border border-blue-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-extrabold text-navy-950 text-sm font-display flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-600" />
                    <span>Homeowner & Project Scope</span>
                  </h3>
                  <Link
                    to={`/admin/requests/${inspectingQuote.requestId}`}
                    className="text-xs text-blue-600 hover:underline font-bold"
                  >
                    View Original Request →
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-400 block mb-0.5">Customer Name:</span>
                    <span className="font-bold text-slate-900 text-sm">{inspectingQuote.customerName || 'Registered Homeowner'}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-400 block mb-0.5">Phone Number:</span>
                    <span className="font-bold text-slate-900 font-mono text-sm">{inspectingQuote.customerPhone || '—'}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-400 block mb-0.5">Project City:</span>
                    <span className="font-bold text-slate-900">{inspectingQuote.city || '—'}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-400 block mb-0.5">Inquiry Code:</span>
                    <span className="font-bold text-blue-700 font-mono">{inspectingQuote.requestCode || inspectingQuote.requestId}</span>
                  </div>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 text-xs">
                  <span className="text-slate-400 block mb-1 font-bold">Scope Summary:</span>
                  <p className="text-slate-700 leading-relaxed">{inspectingQuote.scopeOfWork}</p>
                </div>
              </div>

              {/* Submitting Professional Firm Profile */}
              <div className="bg-white p-6 rounded-2xl border border-blue-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-extrabold text-navy-950 text-sm font-display flex items-center gap-2">
                    <Building className="w-4 h-4 text-amber-600" />
                    <span>Certified Submitting Professional</span>
                  </h3>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    Verified Partner
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-400 block mb-0.5">Firm / Studio Name:</span>
                    <span className="font-bold text-slate-900 text-sm">{inspectingQuote.professional?.firmName || inspectingQuote.professionalName || 'Architecture Practice'}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-400 block mb-0.5">Lead Architect / Professional:</span>
                    <span className="font-bold text-slate-900 text-sm">{inspectingQuote.professionalName || inspectingQuote.professional?.name || 'Principal Architect'}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-400 block mb-0.5">Office Phone:</span>
                    <span className="font-bold text-slate-900 font-mono text-sm">{inspectingQuote.professional?.phone || '—'}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-400 block mb-0.5">Registered Office City:</span>
                    <span className="font-bold text-slate-900">{inspectingQuote.professional?.city || inspectingQuote.city || '—'}</span>
                  </div>
                </div>
                <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-100 text-xs flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-blue-900 font-bold uppercase block">Technical Rating & Track Record</span>
                    <span className="font-semibold text-slate-800">
                      ★ {inspectingQuote.professional?.rating || 4.9} • {inspectingQuote.professional?.completedProjects || 15}+ Projects Delivered
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-blue-700 bg-white px-2.5 py-1 rounded-lg border border-blue-200">
                    IS 456 Compliant
                  </span>
                </div>
              </div>
            </div>

            {/* Complete Itemized BOQ Schedule Table */}
            <div className="bg-white rounded-2xl border border-blue-200/80 shadow-xs overflow-hidden">
              <div className="p-5 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-navy-950 text-sm font-display flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-600" />
                    <span>Complete Itemized Bill of Quantities (BOQ Schedule)</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Full line-item breakdown of engineering deliverables, materials, and labor rates.
                  </p>
                </div>
                <span className="text-xs font-bold font-mono text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                  {(inspectingQuote.items || inspectingQuote.lineItems || []).length} Line Items
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="p-4 w-12">#</th>
                      <th className="p-4">Item Scope & Technical Specification</th>
                      <th className="p-4">Category</th>
                      <th className="p-4 text-center">Unit</th>
                      <th className="p-4 text-center">Qty</th>
                      <th className="p-4 text-right">Unit Rate (₹)</th>
                      <th className="p-4 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(inspectingQuote.items && inspectingQuote.items.length > 0) ? (
                      inspectingQuote.items.map((item: any, idx: number) => {
                        const rate = item.ratePaise ? item.ratePaise : (item.unitPricePaise || 0);
                        const total = item.totalPaise ? item.totalPaise : (rate * (item.quantity || 1));
                        return (
                          <tr key={item.id || idx} className="hover:bg-slate-50/80 transition">
                            <td className="p-4 font-mono text-slate-400 font-bold">{idx + 1}</td>
                            <td className="p-4">
                              <div className="font-bold text-slate-900 text-xs">{item.title || item.description}</div>
                              {item.description && item.title && item.description !== item.title && (
                                <div className="text-[11px] text-slate-500 mt-0.5">{item.description}</div>
                              )}
                            </td>
                            <td className="p-4 text-slate-600">
                              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-medium">
                                {item.category || 'Civil & Architectural'}
                              </span>
                            </td>
                            <td className="p-4 text-center font-mono text-slate-600 capitalize">{item.unit || 'lumpsum'}</td>
                            <td className="p-4 text-center font-mono font-bold text-slate-800">{item.quantity || 1}</td>
                            <td className="p-4 text-right font-mono font-bold text-slate-700">{formatINR(rate)}</td>
                            <td className="p-4 text-right font-mono font-bold text-navy-950 text-sm">{formatINR(total)}</td>
                          </tr>
                        );
                      })
                    ) : (inspectingQuote.lineItems && inspectingQuote.lineItems.length > 0) ? (
                      inspectingQuote.lineItems.map((item: any, idx: number) => (
                        <tr key={item.id || idx} className="hover:bg-slate-50/80 transition">
                          <td className="p-4 font-mono text-slate-400 font-bold">{idx + 1}</td>
                          <td className="p-4">
                            <div className="font-bold text-slate-900 text-xs">{item.description}</div>
                          </td>
                          <td className="p-4 text-slate-600">
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-medium">
                              Civil Scope
                            </span>
                          </td>
                          <td className="p-4 text-center font-mono text-slate-600 capitalize">{item.unit || 'lumpsum'}</td>
                          <td className="p-4 text-center font-mono font-bold text-slate-800">{item.quantity || 1}</td>
                          <td className="p-4 text-right font-mono font-bold text-slate-700">{formatINR(item.unitPricePaise || 0)}</td>
                          <td className="p-4 text-right font-mono font-bold text-navy-950 text-sm">{formatINR(item.totalPaise || 0)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-500">
                          <p className="font-bold text-slate-700">Turnkey Scope of Work</p>
                          <p className="text-xs text-slate-500 mt-1">{inspectingQuote.scopeOfWork}</p>
                          <p className="text-base font-bold font-mono text-navy-950 mt-2">{formatINR(inspectingQuote.finalAmountPaise || 0)}</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                    <tr>
                      <td colSpan={6} className="p-4 text-right text-slate-700 text-xs">Total Quotation Value (inclusive of taxes):</td>
                      <td className="p-4 text-right font-display font-black text-navy-950 text-base">
                        {formatINR(inspectingQuote.finalAmountPaise || inspectingQuote.totalAmountPaise || 0)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Milestones & Escrow Tranches */}
            {inspectingQuote.milestones && inspectingQuote.milestones.length > 0 && (
              <div className="bg-white rounded-2xl border border-blue-200/80 shadow-xs p-6 space-y-4">
                <h3 className="font-extrabold text-navy-950 text-sm font-display flex items-center gap-2 border-b border-slate-100 pb-3">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Staged Escrow Milestone Disbursals</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {inspectingQuote.milestones.map((m: any, idx: number) => (
                    <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                          Stage {idx + 1}
                        </span>
                        <span className="text-xs font-bold text-slate-900 font-mono">{m.percentage}%</span>
                      </div>
                      <div className="font-bold text-slate-900 text-xs">{m.title || m.name}</div>
                      <div className="text-sm font-bold text-navy-950 font-mono">{formatINR(m.amountPaise || 0)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Inclusions & Exclusions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {inspectingQuote.includedDeliverables && inspectingQuote.includedDeliverables.length > 0 && (
                <div className="bg-white p-6 rounded-2xl border border-blue-200/80 shadow-xs space-y-3">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Included Engineering Deliverables</span>
                  </h4>
                  <ul className="space-y-2 text-xs text-slate-700">
                    {inspectingQuote.includedDeliverables.map((inc: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-emerald-600 font-bold">✓</span>
                        <span>{inc}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {inspectingQuote.excludedWork && inspectingQuote.excludedWork.length > 0 && (
                <div className="bg-white p-6 rounded-2xl border border-blue-200/80 shadow-xs space-y-3">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Exclusions & Regulatory Clarifications</span>
                  </h4>
                  <ul className="space-y-2 text-xs text-slate-600">
                    {inspectingQuote.excludedWork.map((exc: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-amber-500 font-bold">•</span>
                        <span>{exc}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Admin Audit & Feedback Desk */}
            <div className="bg-white p-6 rounded-2xl border border-blue-200/80 shadow-xs space-y-4">
              <h3 className="font-extrabold text-navy-950 text-sm font-display flex items-center gap-2 border-b border-slate-100 pb-3">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Platform Technical Audit Remarks & Feedback</span>
              </h3>
              {inspectingQuote.adminFeedback && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-950">
                  <strong>Current Administrator Remark:</strong> {inspectingQuote.adminFeedback}
                </div>
              )}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Update Technical Audit Note / Request Modification Instructions:
                </label>
                <textarea
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  placeholder="Enter structural notes, requested rate adjustments, or approval comments..."
                  rows={3}
                  className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="text-xs text-slate-500">
                  Status changes are recorded on the security audit log.
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleAction(inspectingQuote.id, 'REQUEST_CHANGES')}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
                  >
                    Save & Request Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAction(inspectingQuote.id, 'APPROVE')}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
                  >
                    Approve Quotation
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAction(inspectingQuote.id, 'PUBLISH')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
                  >
                    Publish to Customer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
