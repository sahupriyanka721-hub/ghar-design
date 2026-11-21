import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { apiRequest } from '../../lib/api.js';
import { syncChannel, getPlatformRequests, purgeDummyData } from '../../data/customerStore.js';
import { cleanRecords } from '../../data/cloudSync.js';
import { formatINR, formatDate } from '../../lib/utils.js';
import {
  FileCheck2,
  Check,
  ArrowRight,
  Download,
  Building,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { Quotation } from '@ghar-design/shared';

export const MyQuotations: React.FC = () => {
  const { user } = useAuth();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'amount-asc' | 'amount-desc' | 'date'>('date');

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

      // Filter for current logged-in customer if phone/id matches
      const rawPhone = user?.phone?.replace(/\D/g, '').slice(-10);
      const userRequests = getPlatformRequests();
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

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase">Active Associated Project</span>
          <div className="text-sm font-bold text-slate-900 truncate mt-0.5">
            {getPlatformRequests()[0]?.requestCode || quotations[0]?.requestCode || 'No Active Project'}
          </div>
          <div className="text-[10px] text-gold-700 font-semibold mt-0.5">
            {getPlatformRequests()[0]?.plotArea ? `${getPlatformRequests()[0].plotArea} sq ft (${getPlatformRequests()[0].city})` : 'Submit RFQ to request proposals'}
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
                      <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                        Ref: {quote.requestId}
                      </span>
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
    </div>
  );
};
