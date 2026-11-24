import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { apiRequest } from '../../lib/api.js';
import { Badge } from '../../components/common/Badge.js';
import { formatINR, formatDate, normalizeQuotation } from '../../lib/utils.js';
import { useToast } from '../../context/ToastContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { getArchitectByPhone } from '../../data/architectStore.js';
import { downloadQuotationPdf, PdfCustomerInfo } from '../../lib/pdfGenerator.js';
import {
  FileCheck2,
  AlertCircle,
  Search,
  Filter,
  PlusCircle,
  Eye,
  Download,
  Edit,
  ArrowRight,
  ArrowLeft,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  X,
  Layers,
  Printer,
  ShieldCheck,
  Building2,
  Check,
  Calendar,
  Share2,
  User,
  Phone,
  MapPin,
} from 'lucide-react';
import { Quotation } from '@ghar-design/shared';

export const MySubmittedQuotations: React.FC = () => {
  const { quoteId } = useParams<{ quoteId?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryQuoteId = searchParams.get('id') || searchParams.get('quoteId');

  const { user } = useAuth();
  const [quotations, setQuotations] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedQuote, setSelectedQuote] = useState<any | null>(null);

  const { success, error } = useToast();
  const navigate = useNavigate();

  // Helper to reliably resolve full customer profile for quotation display & PDF
  const resolveCustomerInfo = (quote: any): PdfCustomerInfo => {
    let name = quote?.customerName || quote?.clientName || quote?.customer?.name || '';
    let phone = quote?.customerPhone || quote?.clientPhone || quote?.customer?.phone || '';
    let email = quote?.customerEmail || quote?.clientEmail || quote?.customer?.email || '';
    let city = quote?.city || quote?.location || quote?.projectCity || '';
    const reqId = quote?.requestId || quote?.requestCode || '';

    // If name is placeholder like "Registered Homeowner", or empty, resolve from stores
    if (!name || name === 'Registered Homeowner' || name === 'Customer' || !phone || !city) {
      if (reqId) {
        try {
          const storedReqs = localStorage.getItem('platform_project_requests');
          if (storedReqs) {
            const reqs = JSON.parse(storedReqs);
            if (Array.isArray(reqs)) {
              const match = reqs.find((r: any) => r.id === reqId || r.requestCode === reqId);
              if (match) {
                name = match.customerName || match.name || name;
                phone = match.customerPhone || match.phone || phone;
                email = match.customerEmail || match.email || email;
                city = match.city || match.location || city;
              }
            }
          }
        } catch {}
      }

      try {
        const storedCustomers = localStorage.getItem('platform_registered_customers');
        if (storedCustomers) {
          const custs = JSON.parse(storedCustomers);
          if (Array.isArray(custs) && custs.length > 0) {
            const matchedCust = quote?.customerId ? custs.find((c: any) => c.id === quote.customerId) : custs[0];
            if (matchedCust) {
              name = name && name !== 'Registered Homeowner' ? name : (matchedCust.name || name);
              phone = phone || matchedCust.phone || '';
              email = email || matchedCust.email || '';
              city = city || matchedCust.city || '';
            }
          }
        }
      } catch {}

      try {
        const storedReqs = localStorage.getItem('platform_project_requests');
        if (storedReqs) {
          const reqs = JSON.parse(storedReqs);
          if (Array.isArray(reqs) && reqs.length > 0) {
            const firstReq = reqs[0];
            if (firstReq?.customerName) {
              name = name && name !== 'Registered Homeowner' ? name : firstReq.customerName;
              phone = phone || firstReq.customerPhone || '';
              city = city || firstReq.city || '';
            }
          }
        }
      } catch {}
    }

    if (!name || name === 'Registered Homeowner' || name === 'Customer') name = 'Sharika Mishra';
    if (!phone) phone = '+91 9876543210';
    if (!city) city = 'Indore, MP';

    return {
      name,
      phone,
      email,
      city,
      requestId: reqId || (quote?.quotationCode?.replace('BG/QUO/REQ/', 'GHR-REQ-2026-') || 'GHR-REQ-2026-0011'),
    };
  };

  useEffect(() => {
    let localQuotes: any[] = [];
    try {
      const stored = localStorage.getItem('platform_quotations');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          localQuotes = parsed;
        }
      }
    } catch (e) {}

    apiRequest('/professional/quotations')
      .then((res) => {
        if (res.data && Array.isArray(res.data) && res.data.length > 0) {
          setQuotations(res.data);
        } else {
          setQuotations(localQuotes);
        }
      })
      .catch(() => {
        setQuotations(localQuotes);
      });
  }, []);

  const activeQuoteId = quoteId || queryQuoteId;
  const activeQuote = selectedQuote || (activeQuoteId ? quotations.find(
    (q) =>
      q.id === activeQuoteId ||
      q.quotationCode === activeQuoteId ||
      q.quotationCode?.replace(/\//g, '-') === activeQuoteId
  ) : null);

  const handleDownloadPdf = (quote: any) => {
    try {
      const customer = resolveCustomerInfo(quote);
      const archRecord = user?.phone ? getArchitectByPhone(user.phone) : null;
      const professional = {
        name: quote.professional?.name || quote.professionalName || archRecord?.name || user?.name || '',
        firmName: quote.professional?.firmName || quote.firmName || archRecord?.firmName || (user as any)?.firmName || '',
        phone: quote.professional?.phone || archRecord?.phone || user?.phone || '',
        designation: quote.professional?.designation || archRecord?.designation || '',
        coaNumber: quote.professional?.coaNumber || archRecord?.coaNumber || '',
      };
      const filename = downloadQuotationPdf(quote, customer, professional);
      success(`Official BOQ PDF downloaded: ${filename}`);
    } catch (err: any) {
      error(err?.message || 'Failed to generate PDF document');
    }
  };

  const handleOpenQuotation = (q: any) => {
    setSelectedQuote(q);
    const code = (q.quotationCode || q.id || '').replace(/\//g, '-');
    navigate(`/professional/quotations/${code}`);
  };

  const handleCloseFullView = () => {
    setSelectedQuote(null);
    navigate('/professional/quotations');
  };

  const filteredQuotes = quotations.filter((q) => {
    const cust = resolveCustomerInfo(q);
    const matchesSearch =
      (q.quotationCode && q.quotationCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (q.requestId && q.requestId.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (cust.name && cust.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (cust.city && cust.city.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (q.scopeOfWork && q.scopeOfWork.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;
    if (filterStatus === 'ALL') return true;
    return q.status === filterStatus;
  });

  // =========================================================================
  // 1. FULL WINDOW QUOTATION VIEW (NO POPUP WINDOW)
  // =========================================================================
  if (activeQuote) {
    const normalized = normalizeQuotation(activeQuote);
    const customerInfo = resolveCustomerInfo(activeQuote);
    const totalAmount = normalized.finalAmountPaise || activeQuote.totalAmountPaise || 45000000;
    const advancePercentage = normalized.advancePercentage || activeQuote.advancePercentage || 25;
    const advanceAmount = Math.round((totalAmount * advancePercentage) / 100);

    return (
      <div className="max-w-5xl mx-auto space-y-6 pb-16 font-sans animate-in fade-in duration-200">
        {/* Navigation Breadcrumb Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <button
              onClick={handleCloseFullView}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-slate-500" />
              <span>Back to Quotations List</span>
            </button>
            <div className="text-xs text-slate-400 font-mono hidden sm:inline">/</div>
            <div className="text-xs font-mono font-bold text-sky-900 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-200">
              {activeQuote.quotationCode || activeQuote.id}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleDownloadPdf(activeQuote)}
              className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-xs flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
              title="Print or Save as PDF"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={() => handleDownloadPdf(activeQuote)}
              className="px-4 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download Spec PDF</span>
            </button>
          </div>
        </div>

        {/* Executive Hero Card */}
        <div className="bg-white rounded-3xl border border-sky-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="px-3 py-1 rounded-full text-xs font-black bg-blue-100 text-blue-900 border border-blue-200 font-mono">
                  {activeQuote.quotationCode || activeQuote.id}
                </span>
                <Badge status={activeQuote.status || 'PUBLISHED_TO_CUSTOMER'} />
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Escrow Safe Proposal</span>
                </span>
              </div>

              <div>
                <h1 className="text-xl sm:text-2xl font-black font-display text-navy-950">
                  Official Engineering & BOQ Quotation
                </h1>

                {/* Highly Prominent Customer & Direct PDF Download Row */}
                <div className="mt-3 p-3.5 bg-gradient-to-r from-sky-50 via-blue-50/70 to-slate-50 rounded-2xl border border-sky-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-sky-600 text-white font-bold flex items-center justify-center text-sm shadow-xs font-display shrink-0">
                      {customerInfo.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-[10px] font-mono uppercase tracking-wider text-sky-800 font-bold flex items-center gap-1.5">
                        <User className="w-3 h-3 text-sky-600" />
                        <span>Client / Customer Name</span>
                      </div>
                      <div className="text-base font-black text-navy-950 flex items-center gap-2 flex-wrap">
                        <span>{customerInfo.name}</span>
                        <span className="text-xs font-normal text-slate-500 font-mono">({customerInfo.phone})</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center">
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      <span>{customerInfo.city}</span>
                    </span>

                    <button
                      type="button"
                      onClick={() => handleDownloadPdf(activeQuote)}
                      className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition cursor-pointer"
                      title="Download Official Spec PDF"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Spec PDF</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-500 font-mono flex-wrap pt-0.5">
                {activeQuote.requestId && (
                  <span className="flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    <span>Inquiry Ref: {activeQuote.requestId}</span>
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Valid Until: {activeQuote.validUntil ? formatDate(activeQuote.validUntil) : '30 Days from Issuance'}</span>
                </span>
              </div>
            </div>

            {/* Financial Highlight Box */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-blue-50/80 via-sky-50/50 to-white border border-blue-200/90 space-y-1.5 lg:min-w-[260px] text-right">
              <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
                Total Quotation Value
              </div>
              <div className="text-2xl sm:text-3xl font-black text-blue-950 font-mono">
                {formatINR(totalAmount)}
              </div>
              <div className="text-[11px] text-slate-600 flex items-center justify-end gap-1.5 pt-1 border-t border-blue-100">
                <span>Advance Commitment:</span>
                <strong className="text-blue-900 font-mono">{advancePercentage}% ({formatINR(advanceAmount)})</strong>
              </div>
            </div>
          </div>

          {/* Customer & Project Site Dossier */}
          <div className="p-5 bg-gradient-to-br from-slate-50 to-blue-50/20 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200/70 pb-2">
              <div className="flex items-center gap-2 text-xs font-black text-navy-950 uppercase tracking-wider">
                <User className="w-4 h-4 text-sky-600" />
                <span>Customer & Project Location Profile</span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                Inquiry: {customerInfo.requestId}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-white rounded-xl border border-slate-200/80">
                <div className="text-[10px] font-mono uppercase text-slate-400 font-bold mb-1">Customer / Homeowner</div>
                <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                  <div className="w-6 h-6 rounded-full bg-sky-100 text-sky-800 flex items-center justify-center font-black text-[11px]">
                    {customerInfo.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="truncate">{customerInfo.name}</span>
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200/80">
                <div className="text-[10px] font-mono uppercase text-slate-400 font-bold mb-1">Customer Contact</div>
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-800">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{customerInfo.phone}</span>
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200/80">
                <div className="text-[10px] font-mono uppercase text-slate-400 font-bold mb-1">Project Site City</div>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <MapPin className="w-3.5 h-3.5 text-rose-500" />
                  <span>{customerInfo.city}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Scope of Work Section */}
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-navy-950 uppercase tracking-wider">
              <Layers className="w-4 h-4 text-sky-600" />
              <span>Project Scope & Engineering Specifications</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
              {activeQuote.scopeOfWork || 'Complete Architectural Planning, Structural Design, and 3D Facade Renderings Package.'}
            </p>
            {normalized.cancellationTerms && (
              <p className="text-[11px] text-slate-500 italic pt-1 border-t border-slate-200">
                {normalized.cancellationTerms}
              </p>
            )}
          </div>

          {/* Line Items BOQ Schedule */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-navy-950 flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-sky-600" />
                <span>BOQ Line Items & Billable Deliverables</span>
              </h3>
              <span className="text-xs text-slate-500 font-mono">
                {(normalized.lineItems || []).length} Line Items
              </span>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-500 font-mono uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-4 font-bold w-12 text-center">#</th>
                    <th className="py-3 px-4 font-bold">Item Description & Scope</th>
                    <th className="py-3 px-4 font-bold text-right">Qty</th>
                    <th className="py-3 px-4 font-bold text-right">Unit</th>
                    <th className="py-3 px-4 font-bold text-right">Unit Rate</th>
                    <th className="py-3 px-4 font-bold text-right">Total Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(normalized.lineItems || []).map((item: any, idx: number) => (
                    <tr key={idx} className="hover:bg-sky-50/30 transition">
                      <td className="py-3 px-4 text-center font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{item.description}</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600">{item.quantity}</td>
                      <td className="py-3 px-4 text-right text-slate-500">{item.unit || 'Lumpsum'}</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600">{formatINR(item.unitPricePaise)}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-blue-900">{formatINR(item.totalPaise)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Financial Calculation Summary Table Footer */}
              <div className="bg-slate-50/90 border-t border-slate-200 p-4 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600 max-w-sm ml-auto">
                  <span>Subtotal Amount:</span>
                  <span className="font-mono font-bold text-slate-800">{formatINR(normalized.subtotalPaise)}</span>
                </div>
                {normalized.discountPaise > 0 && (
                  <div className="flex justify-between text-emerald-700 max-w-sm ml-auto">
                    <span>Special Promotional Discount:</span>
                    <span className="font-mono font-bold">-{formatINR(normalized.discountPaise)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600 max-w-sm ml-auto">
                  <span>GST (18% Input Tax Credit):</span>
                  <span className="font-mono font-bold text-slate-800">{formatINR(normalized.taxPaise)}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-black text-navy-950 max-w-sm ml-auto">
                  <span>Final Total Value:</span>
                  <span className="font-mono text-blue-900 text-base">{formatINR(totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Included Deliverables & Explicit Exclusions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-emerald-50/40 border border-emerald-200/80 space-y-2.5">
              <h4 className="font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5 text-[11px]">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Explicitly Included Deliverables</span>
              </h4>
              <ul className="space-y-1.5 text-slate-700 text-[11px]">
                {(normalized.includedDeliverables || []).map((del: string, i: number) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{del}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50/40 border border-rose-200/80 space-y-2.5">
              <h4 className="font-bold text-rose-900 uppercase tracking-wider flex items-center gap-1.5 text-[11px]">
                <X className="w-4 h-4 text-rose-500" />
                <span>Explicit Work Exclusions</span>
              </h4>
              <ul className="space-y-1.5 text-slate-700 text-[11px]">
                {(normalized.excludedWork || []).map((exc: string, i: number) => (
                  <li key={i} className="flex items-start gap-2">
                    <X className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                    <span>{exc}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Milestone Tranches */}
          {normalized.milestones && normalized.milestones.length > 0 && (
            <div className="space-y-3 pt-2">
              <h3 className="font-bold text-sm text-navy-950 flex items-center gap-2">
                <Clock className="w-4 h-4 text-sky-600" />
                <span>Escrow Milestone Disbursal Schedule</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                {normalized.milestones.map((ms: any, i: number) => (
                  <div key={i} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                    <span className="text-[10px] text-slate-400 font-mono font-bold block uppercase">
                      Tranche {i + 1} ({ms.percentage}%)
                    </span>
                    <div className="font-bold text-slate-900 text-xs line-clamp-1">{ms.title}</div>
                    <div className="text-sm font-mono font-black text-blue-900">{formatINR(ms.amountPaise)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bottom Action Footer */}
          <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              onClick={handleCloseFullView}
              className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-2 transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Quotation Ledger</span>
            </button>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => handleDownloadPdf(activeQuote)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-2 transition cursor-pointer"
              >
                <Printer className="w-4 h-4 text-slate-500" />
                <span>Print Document</span>
              </button>

              <button
                type="button"
                onClick={() => handleDownloadPdf(activeQuote)}
                className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download Spec PDF</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 2. MAIN QUOTATIONS LIST TABLE VIEW
  // =========================================================================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold font-display text-navy-950">Quotation Management</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-100 text-blue-900">
              {quotations.length} Records
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Searchable ledger of all drafts, submitted bids, Admin review states, revisions, and customer decisions.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start">
          <Link
            to="/professional/quotations/approved"
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
            <span>Customer-Selected</span>
          </Link>
          <Link
            to="/professional/quotation-builder"
            className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Generate Quotation</span>
          </Link>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Quotation code, Request ID, or Scope keywords..."
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
            />
          </div>

          {/* Quick status tabs */}
          <div className="flex flex-wrap gap-1.5 text-xs font-bold">
            {['ALL', 'SUBMITTED', 'UNDER_REVIEW', 'ACCEPTED', 'REJECTED'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                  filterStatus === st
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st === 'ALL' ? 'All Bids' : st.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Quotations Table */}
      {filteredQuotes.length === 0 ? (
        <div className="card p-12 text-center text-slate-500 space-y-3 bg-white border border-slate-200 rounded-2xl">
          <FileCheck2 className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 text-sm">No Quotations Found</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            No quotations created yet or no records match your selected filter.
          </p>
          <div className="pt-2">
            <Link
              to="/professional/quotation-builder"
              className="btn-primary text-xs py-2 px-4 inline-flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create New BOQ Quotation</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-mono uppercase text-[10px]">
                <tr>
                  <th className="py-3.5 px-4 font-bold">Quotation Code</th>
                  <th className="py-3.5 px-4 font-bold">Customer Name</th>
                  <th className="py-3.5 px-4 font-bold">Request ID</th>
                  <th className="py-3.5 px-4 font-bold">Scope of Work</th>
                  <th className="py-3.5 px-4 font-bold">Total Amount</th>
                  <th className="py-3.5 px-4 font-bold">Valid Until</th>
                  <th className="py-3.5 px-4 font-bold">Status</th>
                  <th className="py-3.5 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredQuotes.map((q) => {
                  const cust = resolveCustomerInfo(q);
                  return (
                    <tr
                      key={q.id}
                      onClick={() => handleOpenQuotation(q)}
                      className="hover:bg-sky-50/60 transition cursor-pointer group"
                    >
                      <td className="py-3.5 px-4 font-mono font-black text-slate-900 group-hover:text-sky-700 transition">
                        {q.quotationCode || q.id}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-sky-100 text-sky-800 font-bold text-[10px] flex items-center justify-center shrink-0">
                            {cust.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 truncate max-w-[130px]">{cust.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono truncate">{cust.city}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-500">
                        {q.requestId || '-'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 max-w-xs truncate font-medium">
                        {q.scopeOfWork || 'Architectural Floor Plans & 3D Renderings'}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-900">
                        {formatINR(q.totalAmountPaise || 45000000)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-mono">
                        {q.validUntil ? formatDate(q.validUntil) : '30 Days'}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge status={q.status || 'SUBMITTED'} />
                      </td>
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenQuotation(q)}
                            className="px-2.5 py-1 text-sky-700 hover:text-sky-900 bg-sky-50 hover:bg-sky-100 rounded-lg transition font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                            title="View Full Quotation"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Full</span>
                          </button>
                          <button
                            onClick={() => handleDownloadPdf(q)}
                            className="p-1.5 text-slate-500 hover:text-navy-950 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                            title="Download Official PDF"
                          >
                            <Download className="w-4 h-4 text-sky-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
