import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import {
  getExecutionProjects,
  ExecutionProject,
  createProjectFromAcceptedQuotation,
} from '../../data/projectExecutionStore.js';
import {
  getPlatformRequests,
  getPlatformBookings,
  syncChannel,
  getPlatformRequestById,
} from '../../data/customerStore.js';
import { cleanRecords } from '../../data/cloudSync.js';
import {
  FileCheck2,
  Building2,
  HardHat,
  ArrowRight,
  ShieldCheck,
  Calendar,
  CheckCircle2,
  DollarSign,
  MapPin,
  Clock,
  Sparkles,
  FileText,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

const formatINR = (paise: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format((paise || 0) / 100);
};

export const AcceptedQuotations: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<ExecutionProject[]>([]);
  const [pendingQuotes, setPendingQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAcceptedEngagements = useCallback(() => {
    const rawUserPhone = user?.phone?.replace(/\D/g, '').slice(-10);

    // 1. Get execution projects directly
    let projectList = getExecutionProjects(user?.id, user?.phone);

    // 2. Read stored quotations
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

    // Identify user's submitted request IDs
    const userRequests = getPlatformRequests();
    const userReqIds = new Set(
      userRequests
        .filter((r) => {
          if (user?.id && r.customerId === user.id) return true;
          if (rawUserPhone && r.customerPhone?.includes(rawUserPhone)) return true;
          return false;
        })
        .map((r) => r.id)
    );

    // Match pending quotations (published to customer, but not yet accepted)
    const pending = localQuotes.filter((q: any) => {
      const isPublished =
        q.status === 'PUBLISHED' || q.status === 'PUBLISHED_TO_CUSTOMER' || q.status === 'APPROVED';
      if (!isPublished) return false;

      if (user?.id && q.customerId === user.id) return true;
      if (rawUserPhone && q.customerPhone?.replace(/\D/g, '').slice(-10) === rawUserPhone) return true;
      if (q.requestId && userReqIds.has(q.requestId)) return true;
      // If single customer testing without specific phone, include
      if (!user?.id && !rawUserPhone) return true;
      return false;
    });
    setPendingQuotes(pending);

    // Match accepted quotations
    const acceptedQuotes = localQuotes.filter((q: any) => {
      const isAccepted = q.status === 'ACCEPTED' || q.status === 'SELECTED' || q.status === 'CONFIRMED';
      if (!isAccepted) return false;

      if (user?.id && q.customerId === user.id) return true;
      if (rawUserPhone && q.customerPhone?.replace(/\D/g, '').slice(-10) === rawUserPhone) return true;
      if (q.requestId && userReqIds.has(q.requestId)) return true;
      if (!user?.id && !rawUserPhone) return true;
      return false;
    });

    // Auto-hydrate execution projects if accepted quotes exist but missing from execution store
    const existingQuoteIds = new Set(
      projectList.map((p) => p.quotationId || p.quotationCode)
    );

    for (const quote of acceptedQuotes) {
      const qKey = quote.id || quote.quotationCode;
      if (!existingQuoteIds.has(qKey) && !existingQuoteIds.has(quote.quotationCode)) {
        const existingReq = quote.requestId ? getPlatformRequestById(quote.requestId) : undefined;
        const newProj = createProjectFromAcceptedQuotation({
          customer: {
            id: user?.id || quote.customerId || `usr-cust-${Date.now()}`,
            name: user?.name || quote.customerName || 'Registered Homeowner',
            phone: user?.phone || quote.customerPhone || '',
          },
          request: {
            id: quote.requestId || `req-${Date.now()}`,
            requestCode: existingReq?.requestCode || quote.requestCode || 'REQ-AUTO',
            city: existingReq?.city || quote.city || 'Indore',
            state: existingReq?.state || quote.state || 'Madhya Pradesh',
            locality: existingReq?.locality || quote.locality || 'Site Address',
            serviceType: existingReq?.serviceType || quote.serviceType || 'Civil House Construction',
          },
          quotation: {
            id: quote.id,
            quotationCode: quote.quotationCode,
            finalAmountPaise: quote.finalAmountPaise,
            advancePercentage: quote.advancePercentage,
            scopeOfWork: quote.scopeOfWork,
            professional: quote.professional,
          },
          bookingCode: quote.bookingCode,
        });
        projectList = [newProj, ...projectList];
        existingQuoteIds.add(qKey);
      }
    }

    setProjects(projectList);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadAcceptedEngagements();

    const interval = setInterval(loadAcceptedEngagements, 30000);
    window.addEventListener('storage', loadAcceptedEngagements);

    const onSync = (event: MessageEvent) => {
      const type = event.data?.type;
      if (
        type === 'QUOTATIONS_UPDATED' ||
        type === 'PROJECT_REQUESTS_UPDATED' ||
        type === 'BOOKINGS_UPDATED' ||
        type === 'PROJECTS_UPDATED'
      ) {
        loadAcceptedEngagements();
      }
    };

    if (syncChannel) {
      syncChannel.addEventListener('message', onSync);
    }

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', loadAcceptedEngagements);
      if (syncChannel) {
        syncChannel.removeEventListener('message', onSync);
      }
    };
  }, [loadAcceptedEngagements]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 font-sans">
      {/* Header bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 mb-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Accepted Quotations & Contracts</span>
          </div>
          <h1 className="text-2xl font-bold font-display text-navy-950">
            Accepted Quotations & Active Engagements
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Contractor & engineer quotations accepted by you, with generated Work Orders and linked execution projects.
          </p>
        </div>

        <Link
          to="/dashboard/quotations"
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition self-start sm:self-auto"
        >
          View All Quotations
        </Link>
      </div>

      {/* Pending Quotation Alert Banner */}
      {pendingQuotes.length > 0 && (
        <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-amber-950">
                  {pendingQuotes.length === 1
                    ? '1 Quotation Waiting for Your Acceptance'
                    : `${pendingQuotes.length} Quotations Waiting for Your Acceptance`}
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-200 text-amber-900">
                  Action Required
                </span>
              </div>
              <p className="text-xs text-amber-800/90 mt-0.5">
                Our verified architect/contractor submitted a competitive quotation for your project. Review and accept it to generate your Work Order and start site execution.
              </p>
            </div>
          </div>

          <Link
            to={
              pendingQuotes.length === 1
                ? `/dashboard/quotations/${pendingQuotes[0].id}`
                : '/dashboard/quotations'
            }
            className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition shrink-0 self-start sm:self-auto"
          >
            <span>Review Quotation</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Main Content Area */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
          Loading accepted quotations...
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center max-w-lg mx-auto space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 mx-auto flex items-center justify-center">
            <FileCheck2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-navy-950">No Quotations Accepted Yet</h3>
            {pendingQuotes.length > 0 ? (
              <p className="text-xs text-amber-700 mt-1 max-w-md mx-auto">
                You have {pendingQuotes.length} active quotation(s) received from our vetted partners. Click below to review the BOQ and accept it.
              </p>
            ) : (
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                When you accept a contractor or engineer quotation, your verified Work Order, escrow agreement, and live site tracking project will appear here.
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <Link
              to="/dashboard/quotations"
              className="btn-gold text-xs py-2 px-4 inline-flex items-center gap-1.5 font-bold"
            >
              <span>{pendingQuotes.length > 0 ? 'Review Incoming Quotations' : 'Browse All Quotations'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              to="/dashboard/create-request"
              className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition"
            >
              Request New Quotation
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {projects.map((p) => (
            <div
              key={p.id}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:border-navy-300 transition"
            >
              <div className="space-y-2 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-navy-800 bg-navy-50 px-2.5 py-0.5 rounded border border-navy-200">
                    Quote: {p.quotationCode}
                  </span>
                  <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                    WO: {p.workOrderNumber}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                    Project: {p.id}
                  </span>
                </div>

                <h3 className="text-base font-bold text-navy-950 font-display">{p.name}</h3>

                <div className="flex flex-wrap items-center gap-3 text-slate-500">
                  <span className="flex items-center gap-1">
                    <HardHat className="w-3.5 h-3.5 text-amber-600" />
                    <span className="font-semibold text-slate-700">{p.contractorFirm}</span> ({p.contractorName})
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {p.propertyAddress}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 self-stretch md:self-center shrink-0 justify-between md:justify-end">
                <div className="text-left sm:text-right">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Accepted Contract Value</div>
                  <div className="text-lg font-bold font-mono text-navy-950">{formatINR(p.contractValuePaise)}</div>
                  <div className="text-[10px] text-emerald-700 font-semibold">✓ 100% Escrow Protected</div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link
                    to={`/dashboard/quotations/${p.quotationId || p.quotationCode}`}
                    className="px-3.5 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                  >
                    <span>View BOQ</span>
                  </Link>

                  <Link
                    to={`/dashboard/projects/${p.id}/kickoff`}
                    className="px-3.5 py-2.5 bg-gold-500 hover:bg-gold-400 text-navy-950 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
                  >
                    <span>Kickoff Work</span>
                  </Link>

                  <Link
                    to={`/dashboard/projects/${p.id}`}
                    className="px-4 py-2.5 bg-navy-950 hover:bg-navy-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
                  >
                    <span>Open Desk</span>
                    <ArrowRight className="w-3.5 h-3.5 text-gold-400" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};