import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { apiRequest } from '../../lib/api.js';
import { Badge } from '../../components/common/Badge.js';
import { useToast } from '../../context/ToastContext.js';
import {
  syncChannel,
  getPlatformRequests,
  purgeDummyData,
  PlatformProjectRequest,
  getRegisteredCustomers,
} from '../../data/customerStore.js';
import { cleanRecords } from '../../data/cloudSync.js';
import { formatINR, formatDate } from '../../lib/utils.js';
import { downloadInquiryReceiptPdf } from '../../lib/pdfGenerator.js';
import {
  FileCheck2,
  Check,
  ArrowRight,
  ArrowLeft,
  Download,
  Building,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  Calendar,
  Sparkles,
  User,
  Phone,
  Mail,
  MapPin,
  X,
  Layers,
  ShieldCheck,
  Receipt,
  FileText,
  ExternalLink,
  PlusCircle,
  MessageSquare,
} from 'lucide-react';
import { Quotation } from '@ghar-design/shared';

export const MyQuotations: React.FC = () => {
  const { user } = useAuth();
  const { success } = useToast();
  const navigate = useNavigate();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [requests, setRequests] = useState<PlatformProjectRequest[]>([]);
  const [selectedProjectRequest, setSelectedProjectRequest] = useState<PlatformProjectRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'amount-asc' | 'amount-desc' | 'date'>('date');

  const activeProjectRequest = useMemo(() => {
    if (!requests || requests.length === 0) return null;
    const rawPhone = user?.phone?.replace(/\D/g, '').slice(-10);
    if (user?.id) {
      const match = requests.find((r) => r.customerId === user.id);
      if (match) return match;
    }
    if (rawPhone) {
      const match = requests.find((r) => (r.customerPhone || '').replace(/\D/g, '').slice(-10) === rawPhone);
      if (match) return match;
    }
    if (quotations.length > 0 && quotations[0].requestId) {
      const match = requests.find((r) => r.id === quotations[0].requestId || r.requestCode === quotations[0].requestCode);
      if (match) return match;
    }
    return requests[0] || null;
  }, [requests, user, quotations]);

  const matchedCustomer = useMemo(() => {
    if (!selectedProjectRequest) return null;
    const custs = getRegisteredCustomers();
    const rawTargetPhone = (selectedProjectRequest.customerPhone || '').replace(/\D/g, '').slice(-10);
    return (
      custs.find((c) => {
        if (selectedProjectRequest.customerId && c.id === selectedProjectRequest.customerId) return true;
        if (rawTargetPhone && c.phone && c.phone.replace(/\D/g, '').slice(-10) === rawTargetPhone) return true;
        if (
          c.name &&
          selectedProjectRequest.customerName &&
          c.name.trim().toLowerCase() === selectedProjectRequest.customerName.trim().toLowerCase()
        )
          return true;
        return false;
      }) || null
    );
  }, [selectedProjectRequest]);

  useEffect(() => {
    const loadAllQuotes = () => {
      purgeDummyData();
      let localQuotes: any[] = [];
      try {
        const stored = localStorage.getItem('platform_quotations');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            localQuotes = cleanRecords(parsed);
          }
        }
      } catch (e) {
        console.error(e);
      }

      const allPlatformReqs = getPlatformRequests();
      setRequests(allPlatformReqs);

      // Filter for current logged-in customer if phone/id matches
      const rawPhone = user?.phone?.replace(/\D/g, '').slice(-10);
      const userRequests = allPlatformReqs;
      const userReqIds = new Set(
        userRequests
          .filter((r) => {
            if (user?.id && r.customerId === user.id) return true;
            if (rawPhone && r.customerPhone?.includes(rawPhone)) return true;
            return false;
          })
          .map((r) => r.id)
      );

      const customerQuotes = localQuotes.filter((q: any) => {
        if (user?.id && q.customerId === user.id) return true;
        if (rawPhone && q.customerPhone?.includes(rawPhone)) return true;
        if (q.requestId && userReqIds.has(q.requestId)) return true;
        // If single user testing without explicit customer ID, show all real quotes
        if (!rawPhone && !user?.id) return true;
        return false;
      });

      const displayQuotes = customerQuotes;

      apiRequest('/quotations')
        .then((res) => {
          if (res.data && Array.isArray(res.data) && res.data.length > 0) {
            setQuotations(res.data);
          } else {
            setQuotations(displayQuotes);
          }
        })
        .catch(() => {
          setQuotations(displayQuotes);
        })
        .finally(() => setLoading(false));
    };

    loadAllQuotes();
    const interval = setInterval(loadAllQuotes, 30000);
    window.addEventListener('storage', loadAllQuotes);
    const onSync = (event: MessageEvent) => {
      if (event.data?.type === 'QUOTATIONS_UPDATED' || event.data?.type === 'PROJECT_REQUESTS_UPDATED') {
        loadAllQuotes();
      }
    };
    if (syncChannel) syncChannel.addEventListener('message', onSync);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', loadAllQuotes);
      if (syncChannel) syncChannel.removeEventListener('message', onSync);
    };
  }, [user?.phone, user?.id]);

  const filterTabs = [
    'ALL',
    'PUBLISHED',
    'SELECTED',
    'UNDER_ADMIN_REVIEW',
    'EXPIRED',
  ];

  const filteredQuotes = quotations
    .filter((q) => {
      if (filterStatus !== 'ALL') {
        if (filterStatus === 'PUBLISHED') {
          if (q.status !== 'PUBLISHED' && q.status !== 'PUBLISHED_TO_CUSTOMER' && q.status !== 'APPROVED') return false;
        } else if (q.status !== filterStatus) {
          return false;
        }
      }
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          q.quotationCode.toLowerCase().includes(query) ||
          q.professional?.firmName.toLowerCase().includes(query) ||
          q.scopeOfWork.toLowerCase().includes(query)
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'amount-asc') return a.finalAmountPaise - b.finalAmountPaise;
      if (sortBy === 'amount-desc') return b.finalAmountPaise - a.finalAmountPaise;
      return 0;
    });

  const lowestQuote = quotations.length > 0 ? Math.min(...quotations.map((q) => q.finalAmountPaise)) : 0;
  const highestQuote = quotations.length > 0 ? Math.max(...quotations.map((q) => q.finalAmountPaise)) : 0;

  return (
    <div className="space-y-6 text-xs">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-gold-600 font-bold uppercase tracking-wider text-[11px] mb-1">
            <FileCheck2 className="w-4 h-4" />
            <span>Quotation Registry & Competitive BOQs</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-display font-bold text-slate-900">
            My Quotations & Technical Bids
          </h1>
          <p className="text-slate-500 mt-1">
            Review detailed BOQs, deliverables, revision terms, and milestones submitted by vetted engineers and technical specialists.
          </p>
        </div>

        {/* Side-by-Side Compare CTA */}
        {quotations.length > 0 ? (
          <Link
            to={`/dashboard/requests/${quotations[0]?.requestId || quotations[0]?.requestCode || 'active'}/quotations`}
            className="px-4 py-2.5 bg-navy-950 hover:bg-navy-900 text-gold-400 font-bold rounded-xl shadow-sm flex items-center gap-1.5 self-start md:self-auto transition"
          >
            <Sparkles className="w-4 h-4" />
            <span>Compare Side-by-Side Matrix</span>
          </Link>
        ) : (
          <Link
            to="/dashboard/create-request"
            className="px-4 py-2.5 bg-gold-500 hover:bg-gold-400 text-navy-950 font-bold rounded-xl shadow-sm flex items-center gap-1.5 self-start md:self-auto transition"
          >
            <Sparkles className="w-4 h-4" />
            <span>Request New Quotation</span>
          </Link>
        )}
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase">Total Bids Received</span>
          <div className="text-xl font-bold text-slate-900 mt-0.5">{quotations.length} Proposals</div>
          <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">Admin Vetted & Published</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase">Competitive Quote Range</span>
          <div className="text-xl font-bold text-navy-950 mt-0.5">
            {lowestQuote > 0 ? `${formatINR(lowestQuote)} - ${formatINR(highestQuote)}` : 'Awaiting Bids'}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Includes 18% GST & Supervision</div>
        </div>

        <div
          onClick={() => {
            if (activeProjectRequest) {
              setSelectedProjectRequest(activeProjectRequest);
            }
          }}
          className={`p-4 bg-white rounded-xl border border-slate-200 shadow-2xs transition-all relative overflow-hidden ${
            activeProjectRequest
              ? 'cursor-pointer hover:border-blue-500 hover:shadow-md hover:bg-gradient-to-br hover:from-white hover:to-blue-50/40 active:scale-[0.99] group'
              : ''
          }`}
          title={activeProjectRequest ? "Click to view full customer and architectural project specifications dossier" : undefined}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Active Associated Project</span>
            {activeProjectRequest && (
              <span className="text-[10px] font-bold text-blue-600 group-hover:text-blue-700 group-hover:underline flex items-center gap-0.5">
                <span>View Details</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </span>
            )}
          </div>
          <div className="text-sm font-black text-slate-900 group-hover:text-blue-700 transition truncate mt-0.5 font-mono">
            {activeProjectRequest?.requestCode || quotations[0]?.requestCode || 'No Active Project'}
          </div>
          <div className="text-[10px] text-gold-700 font-semibold mt-0.5 flex items-center gap-1.5 flex-wrap">
            <span>
              {activeProjectRequest?.plotArea ? `${activeProjectRequest.plotArea} sq ft (${activeProjectRequest.city})` : 'Submit RFQ to request proposals'}
            </span>
            {activeProjectRequest?.customerName && (
              <span className="text-slate-500 font-medium truncate max-w-[150px]">
                • {activeProjectRequest.customerName}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by quote code, firm name, or technical scope..."
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-navy-900 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium shrink-0">Sort By:</span>
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-navy-900 focus:outline-none"
            >
              <option value="date">Date Published</option>
              <option value="amount-asc">Price: Low to High</option>
              <option value="amount-desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Status Pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 text-[11px] whitespace-nowrap">
          {filterTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterStatus(tab)}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                filterStatus === tab
                  ? 'bg-navy-950 text-gold-400 shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Quotations List */}
      {filteredQuotes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center">
            <FileCheck2 className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-base font-display">No Quotations Received Yet</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Once you submit a project request, our verified contractorure and engineering partners will prepare comparative itemized BOQs for you to review and select.
          </p>
          <Link
            to="/dashboard/create-request"
            className="btn-gold text-xs py-2 px-4 inline-flex items-center gap-1.5"
          >
            <span>Create New Project Request</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredQuotes.map((quote) => {
            const isSelected = quote.status === 'SELECTED';
            return (
              <div
                key={quote.id}
                className={`bg-white rounded-2xl border p-5 shadow-xs flex flex-col justify-between space-y-4 transition ${
                  isSelected
                    ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-800 text-sm">{quote.quotationCode}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const matched = requests.find((r) => r.id === quote.requestId || r.requestCode === quote.requestId);
                          if (matched) setSelectedProjectRequest(matched);
                        }}
                        className="text-[10px] text-slate-500 hover:text-blue-700 bg-slate-100 hover:bg-blue-50 px-2 py-0.5 rounded font-mono font-medium transition cursor-pointer"
                        title="Click to view full customer and project specifications"
                      >
                        Ref: {quote.requestId}
                      </button>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        quote.status === 'SELECTED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : quote.status === 'PUBLISHED'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {quote.status}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-base text-slate-900">{quote.professional?.firmName}</h3>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {quote.professional?.qualifications} • {quote.professional?.experienceYears} Yrs Experience
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Total Contract Price:</span>
                      <div className="text-xl font-bold font-display text-navy-950">
                        {formatINR(quote.finalAmountPaise)}
                      </div>
                    </div>
                    <div className="text-right text-[10px] text-slate-500">
                      <div>Includes 18% GST</div>
                      <div>Est: {quote.estimatedDurationDays} Days</div>
                    </div>
                  </div>

                  <p className="text-slate-600 line-clamp-2 text-[11px] leading-relaxed">
                    {quote.scopeOfWork}
                  </p>

                  {/* Included Deliverables preview */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Included Deliverables:</span>
                    <div className="flex flex-wrap gap-1">
                      {quote.includedDeliverables?.slice(0, 3).map((d, i) => (
                        <span key={i} className="px-2 py-0.5 bg-emerald-50 text-emerald-800 text-[10px] rounded font-medium">
                          ✓ {d}
                        </span>
                      ))}
                      {(quote.includedDeliverables?.length || 0) > 3 && (
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] rounded">
                          +{quote.includedDeliverables.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">
                    Valid until: <strong className="text-slate-700">{formatDate(quote.validUntil)}</strong>
                  </span>

                  <div className="flex gap-2">
                    <Link
                      to={`/dashboard/quotations/${quote.id}`}
                      className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-lg transition"
                    >
                      View BOQ
                    </Link>

                    <Link
                      to={`/dashboard/requests/${quote.requestId}/quotations`}
                      className="px-3 py-1.5 border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-lg transition"
                    >
                      Compare
                    </Link>

                    <Link
                      to={`/dashboard/requests/${quote.requestId}/quotations`}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-2xs transition flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Accept & Book</span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* FULL-SCREEN EXECUTIVE CUSTOMER & PROJECT SPECIFICATIONS DOSSIER           */}
      {/* ========================================================================= */}
      {selectedProjectRequest && (
        <div className="admin-fullscreen-modal fixed inset-0 z-50 overflow-y-auto bg-[#f0f7ff] flex flex-col font-sans animate-in fade-in duration-150">
          <div className="h-[2px] bg-gradient-to-r from-transparent via-amber-400 via-sky-400 to-transparent pointer-events-none shrink-0" />

          {/* Sticky Top Bar */}
          <div className="sticky top-0 z-40 bg-navy-950 text-white px-4 sm:px-8 py-3.5 border-b border-navy-900 flex items-center justify-between shadow-xl shrink-0">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <button
                type="button"
                onClick={() => setSelectedProjectRequest(null)}
                className="px-3.5 py-2 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs flex items-center gap-2 border border-slate-700/80 hover:border-slate-500 transition group cursor-pointer shrink-0"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="hidden sm:inline">Back to Quotations</span>
                <span className="sm:hidden">Back</span>
              </button>
              <div className="h-6 w-px bg-slate-700 hidden sm:block shrink-0" />
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-base font-display shrink-0">
                  <Building className="w-5 h-5 text-blue-400" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-base sm:text-lg font-black font-display text-white truncate">
                      {selectedProjectRequest.requestCode || selectedProjectRequest.id}
                    </h2>
                    <Badge status={selectedProjectRequest.status} />
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono truncate">
                    Homeowner: {selectedProjectRequest.customerName || 'Registered Homeowner'} • Submitted {formatDate(selectedProjectRequest.createdAt)}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link
                to={`/professional/quotation-builder?requestId=${selectedProjectRequest.id || selectedProjectRequest.requestCode}`}
                className="px-3.5 py-2 rounded-xl bg-gold-500 hover:bg-gold-400 text-navy-950 font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                title="Prepare and publish itemized BOQ quotation"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Prepare BOQ Quote</span>
              </Link>
              <button
                type="button"
                onClick={() => {
                  const filename = downloadInquiryReceiptPdf(selectedProjectRequest);
                  success(`Inquiry receipt downloaded: ${filename}`);
                }}
                className="px-3 py-2 rounded-xl bg-emerald-600/30 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                title="Download official receipt & specification PDF"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Receipt PDF</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedProjectRequest(null)}
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
                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Homeowner / Client</span>
                <div className="text-lg sm:text-xl font-black font-display text-navy-950 mt-1 truncate">
                  {selectedProjectRequest.customerName || 'Registered Homeowner'}
                </div>
                <div className="text-[11px] text-emerald-600 font-medium mt-0.5">Verified Contact Record</div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-blue-200/80 shadow-xs">
                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Target Budget</span>
                <div className="text-lg sm:text-xl font-black font-display text-amber-700 mt-1">
                  {selectedProjectRequest.budgetRange || 'Flexible Market Rate'}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">Client Financial Expectation</div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-blue-200/80 shadow-xs">
                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Plot Footprint</span>
                <div className="text-lg sm:text-xl font-black font-display text-blue-700 mt-1">
                  {selectedProjectRequest.plotArea ? `${selectedProjectRequest.plotArea} ${selectedProjectRequest.measurementUnit === 'METRES' ? 'sq.m' : 'sq.ft'}` : 'Dimensions Specified'}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {selectedProjectRequest.plotWidth && selectedProjectRequest.plotLength ? `${selectedProjectRequest.plotWidth} × ${selectedProjectRequest.plotLength} ft` : 'Site Footprint'}
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-blue-200/80 shadow-xs">
                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Project City / State</span>
                <div className="text-lg sm:text-xl font-black font-display text-slate-900 mt-1 truncate">
                  {selectedProjectRequest.city || 'India'}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5 truncate">{selectedProjectRequest.state || 'Local Municipal Jurisdiction'}</div>
              </div>
            </div>

            {/* 2-Column Main Dossier */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              {/* Left Column: Homeowner Details & Address */}
              <div className="space-y-6">
                {/* 1. Customer Profile */}
                <div className="bg-white p-6 rounded-3xl border border-blue-200/80 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="font-extrabold text-navy-950 text-sm font-display flex items-center gap-2">
                      <User className="w-4 h-4 text-blue-600" />
                      <span>Homeowner & Client Profile</span>
                    </h3>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      Verified Client
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-700 to-navy-950 text-white font-bold flex items-center justify-center text-xl font-display shadow-md shrink-0">
                      {(selectedProjectRequest.customerName || 'CU').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="text-lg font-black text-navy-950 truncate">
                        {selectedProjectRequest.customerName || 'Registered Homeowner'}
                      </div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">
                        Client ID: {matchedCustomer?.id || `BG/${(selectedProjectRequest.customerName || 'CUS').replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase()}/0001`}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {/* Phone */}
                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Contact Phone</span>
                      <div className="font-bold text-slate-900 font-mono text-sm">
                        {selectedProjectRequest.customerPhone || '—'}
                      </div>
                      {selectedProjectRequest.customerPhone && (
                        <div className="flex items-center gap-2 pt-1">
                          <a
                            href={`tel:${selectedProjectRequest.customerPhone.replace(/\D/g, '')}`}
                            className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1"
                          >
                            <Phone className="w-3 h-3" />
                            <span>Call Now</span>
                          </a>
                          <span className="text-slate-300">•</span>
                          <a
                            href={`https://wa.me/91${selectedProjectRequest.customerPhone.replace(/\D/g, '').slice(-10)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] font-bold text-emerald-600 hover:underline flex items-center gap-1"
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span>WhatsApp</span>
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Email */}
                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Email Address</span>
                      <div className="font-semibold text-slate-800 text-xs truncate" title={selectedProjectRequest.customerEmail || matchedCustomer?.email}>
                        {selectedProjectRequest.customerEmail || matchedCustomer?.email || 'None on file'}
                      </div>
                      {(selectedProjectRequest.customerEmail || matchedCustomer?.email) && (
                        <a
                          href={`mailto:${selectedProjectRequest.customerEmail || matchedCustomer?.email}`}
                          className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1 pt-1"
                        >
                          <Mail className="w-3 h-3" />
                          <span>Send Email</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. Site Address & Road Access */}
                <div className="bg-white p-6 rounded-3xl border border-blue-200/80 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="font-extrabold text-navy-950 text-sm font-display flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-rose-500" />
                      <span>Property Site Location & Delivery Address</span>
                    </h3>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">House / Plot Address:</span>
                      <span className="font-bold text-slate-900 text-right">
                        {matchedCustomer?.housePlotNumber || selectedProjectRequest.address || 'Plot Specified'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Locality / Sector:</span>
                      <span className="font-semibold text-slate-800 text-right">
                        {matchedCustomer?.streetLocality || selectedProjectRequest.locality || selectedProjectRequest.city}
                      </span>
                    </div>
                    {matchedCustomer?.landmark && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Nearby Landmark:</span>
                        <span className="font-semibold text-slate-800 text-right">{matchedCustomer.landmark}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-slate-200/60 pt-2">
                      <span className="text-slate-500">City, State & PIN:</span>
                      <span className="font-bold text-navy-950 text-right">
                        {selectedProjectRequest.city}, {matchedCustomer?.state || selectedProjectRequest.state || 'India'} {matchedCustomer?.pinCode ? `- ${matchedCustomer.pinCode}` : ''}
                      </span>
                    </div>
                  </div>

                  {selectedProjectRequest.siteAccessibilityNotes && (
                    <div className="p-3 bg-blue-50/60 rounded-2xl border border-blue-100 text-xs">
                      <span className="text-[10px] text-blue-900 font-bold uppercase block mb-0.5">Approach Road & Site Logistics:</span>
                      <p className="text-slate-700">{selectedProjectRequest.siteAccessibilityNotes}</p>
                    </div>
                  )}
                </div>

                {/* 3. Inquiry Fee Payment Receipt */}
                <div className="bg-gradient-to-br from-slate-900 to-navy-950 text-white p-5 rounded-3xl shadow-sm border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                    <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-amber-400" />
                      <span>Inquiry Registration & Vetting Receipt</span>
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 inline-flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      <span>PAID ₹499</span>
                    </span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-300">
                      <span className="text-[11px] text-slate-400">Receipt Voucher:</span>
                      <span className="font-mono font-bold text-amber-300">
                        BG/REC/{(selectedProjectRequest.requestCode || selectedProjectRequest.id || '').replace(/[^a-zA-Z0-9]/g, '')}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span className="text-[11px] text-slate-400">Scope Covered:</span>
                      <span className="text-slate-200">Civil & Architectural Feasibility Dispatch</span>
                    </div>
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          const filename = downloadInquiryReceiptPdf(selectedProjectRequest);
                          success(`Receipt downloaded: ${filename}`);
                        }}
                        className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download Spec & Inquiry Receipt PDF</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Property Dimensions & Engineering Specifications */}
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-3xl border border-blue-200/80 shadow-xs space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="font-extrabold text-navy-950 text-sm font-display flex items-center gap-2">
                      <Layers className="w-4 h-4 text-blue-600" />
                      <span>Property Dimensions & Civil Parameters</span>
                    </h3>
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                      IS 456 Standards
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block mb-0.5">Plot Dimensions</span>
                      <span className="font-bold text-slate-900 text-sm">
                        {selectedProjectRequest.plotWidth && selectedProjectRequest.plotLength
                          ? `${selectedProjectRequest.plotWidth} × ${selectedProjectRequest.plotLength} ${selectedProjectRequest.measurementUnit?.toLowerCase() || 'ft'}`
                          : selectedProjectRequest.plotArea
                          ? `${selectedProjectRequest.plotArea} ${selectedProjectRequest.measurementUnit?.toLowerCase() || 'sq.ft'}`
                          : 'Not Specified'}
                      </span>
                      {selectedProjectRequest.plotArea && (
                        <span className="text-[10px] text-blue-700 font-semibold block mt-0.5">
                          ({selectedProjectRequest.plotArea} {selectedProjectRequest.measurementUnit === 'METRES' ? 'sq.m' : 'sq.ft'})
                        </span>
                      )}
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block mb-0.5">Floors / Height</span>
                      <span className="font-bold text-slate-900 text-sm">
                        {selectedProjectRequest.floors !== undefined && selectedProjectRequest.floors !== null
                          ? `${selectedProjectRequest.floors} Floor${selectedProjectRequest.floors > 1 ? 's' : ''} (G+${Math.max(0, selectedProjectRequest.floors - 1)})`
                          : 'Not Specified'}
                      </span>
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block mb-0.5">Room Configuration</span>
                      <span className="font-semibold text-slate-900">
                        {selectedProjectRequest.bedrooms !== undefined || selectedProjectRequest.bathrooms !== undefined
                          ? `${selectedProjectRequest.bedrooms ?? 0} Beds • ${selectedProjectRequest.bathrooms ?? 0} Baths • ${selectedProjectRequest.kitchens ?? 0} Kitchens`
                          : 'Not Specified'}
                      </span>
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block mb-0.5">Property Type</span>
                      <span className="font-bold text-slate-900">{selectedProjectRequest.propertyType || 'Residential Plot'}</span>
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block mb-0.5">Built-Up Area</span>
                      <span className="font-bold text-slate-900">
                        {selectedProjectRequest.builtUpArea ? `${selectedProjectRequest.builtUpArea} sq.ft` : 'As per FSI & Guidelines'}
                      </span>
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block mb-0.5">Current Site State</span>
                      <span className="font-bold text-slate-900">{selectedProjectRequest.currentCondition || 'Vacant / Ready for Planning'}</span>
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block mb-0.5">Architectural Style</span>
                      <span className="font-semibold text-slate-900">{selectedProjectRequest.designStyle || 'Modern & Contemporary'}</span>
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block mb-0.5">Preferred Start</span>
                      <span className="font-bold text-slate-900">{selectedProjectRequest.preferredStartDate || 'Immediate'}</span>
                    </div>
                  </div>

                  {/* Required Deliverables */}
                  {selectedProjectRequest.requiredServices && selectedProjectRequest.requiredServices.length > 0 && (
                    <div className="pt-2">
                      <span className="text-xs font-bold text-slate-700 block mb-2">
                        Required Drawings & Technical Deliverables:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {selectedProjectRequest.requiredServices.map((srv: string, idx: number) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-blue-50 text-blue-900 border border-blue-200 rounded-lg text-xs font-medium flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5 text-blue-600" />
                            <span>{srv}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Vision */}
                  <div className="pt-2">
                    <span className="text-xs font-bold text-slate-700 block mb-1">Customer Scope & Vision:</span>
                    <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                      {selectedProjectRequest.description || 'Full architectural design and civil engineering drawings required as per local municipal bylaws.'}
                    </p>
                  </div>
                </div>

                {/* Professional Architect Call to Action Box */}
                <div className="p-6 bg-gradient-to-r from-blue-900 via-navy-950 to-slate-900 text-white rounded-3xl shadow-lg space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gold-500/20 text-gold-400 border border-gold-400/30 flex items-center justify-center font-bold">
                      <Compass className="w-5 h-5 text-gold-400" />
                    </div>
                    <div>
                      <h4 className="font-black text-sm font-display text-white">
                        Architect & Engineering Partner Workspace
                      </h4>
                      <p className="text-[11px] text-slate-300">
                        Review this homeowner's site brief and submit an itemized BOQ quotation.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                    <Link
                      to={`/professional/quotation-builder?requestId=${selectedProjectRequest.id || selectedProjectRequest.requestCode}`}
                      className="flex-1 py-3 px-4 bg-gold-500 hover:bg-gold-400 text-navy-950 font-black text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Prepare Itemized BOQ Quotation Now</span>
                    </Link>
                    <Link
                      to={`/dashboard/requests/${selectedProjectRequest.id}`}
                      className="py-3 px-4 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 transition flex items-center justify-center gap-1.5"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Open Dedicated Page</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
