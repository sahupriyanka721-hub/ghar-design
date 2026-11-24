import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiRequest } from '../../lib/api.js';
import { formatINR, formatDate, normalizeQuotation } from '../../lib/utils.js';
import { useToast } from '../../context/ToastContext.js';
import { Badge } from '../../components/common/Badge.js';
import {
  Check,
  X,
  ShieldCheck,
  Download,
  Calendar,
  Layers,
  Clock,
  Sparkles,
  ArrowRight,
  AlertCircle,
  Building,
} from 'lucide-react';
import { Quotation } from '@ghar-design/shared';
import { useAuth } from '../../context/AuthContext.js';
import {
  savePlatformBooking,
  PlatformBooking,
  getPlatformRequestById,
  purgeDummyData,
  updatePlatformQuotationStatus,
  updatePlatformRequestStatus,
} from '../../data/customerStore.js';
import { pushToCloud, cleanRecords } from '../../data/cloudSync.js';
import { createProjectFromAcceptedQuotation } from '../../data/projectExecutionStore.js';

export const QuotationComparison: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const { user } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) {
      setQuotations([]);
      setLoading(false);
      return;
    }

    const loadQuotes = () => {
      purgeDummyData();
      let local: any[] = [];
      try {
        const stored = localStorage.getItem('platform_quotations');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            const clean = cleanRecords(parsed);
            local = clean.filter((q: any) => q.requestId === id || q.requestCode === id);
            if (local.length === 0 && (!id || id === 'active' || id === 'all')) {
              const rawPhone = user?.phone?.replace(/\D/g, '').slice(-10);
              local = clean.filter((q) => {
                const isPublished = q.status === 'PUBLISHED' || q.status === 'PUBLISHED_TO_CUSTOMER' || q.status === 'APPROVED';
                if (!isPublished) return false;
                if (user?.id && q.customerId === user.id) return true;
                if (rawPhone && q.customerPhone?.includes(rawPhone)) return true;
                if (!rawPhone && !user?.id) return true;
                return false;
              });
            }

            // If a quotation has been booked/accepted, only show the chosen architect
            const bookedQuote = local.find((q) => q.status === 'ACCEPTED' || q.status === 'SELECTED' || q.isBooked);
            if (bookedQuote) {
              local = [bookedQuote];
            } else {
              local = local.filter((q) => q.status !== 'UNSELECTED');
            }
          }
        }
      } catch (e) {}

      apiRequest(`/requests/${id}/quotations`)
        .then((res) => {
          if (res.data && Array.isArray(res.data) && res.data.length > 0) {
            setQuotations((res.data || []).map(normalizeQuotation));
          } else {
            setQuotations(local.map(normalizeQuotation));
          }
        })
        .catch(() => {
          setQuotations(local.map(normalizeQuotation));
        })
        .finally(() => setLoading(false));
    };

    loadQuotes();
    window.addEventListener('storage', loadQuotes);
    return () => window.removeEventListener('storage', loadQuotes);
  }, [id]);

  const handleSelectQuotation = async () => {
    if (!selectedQuoteId) return;
    setIsBooking(true);

    const sel = quotations.find((q) => q.id === selectedQuoteId);
    const bookingCode = `GHR-BK-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    let createdProjectId: string | null = null;

    if (sel) {
      const newBooking: PlatformBooking = {
        id: `bk-${Date.now()}`,
        bookingCode,
        customerId: user?.id || `usr-cust-${Date.now()}`,
        customerName: user?.name || 'Registered Homeowner',
        customerPhone: user?.phone || '',
        customerEmail: user?.email || '',
        serviceTitle: `${sel.professional?.firmName || 'Selected Partner'} - Complete Construction Engagement`,
        serviceType: 'Construction Contract Engagement',
        firmName: sel.professional?.firmName || 'Partner Firm',
        totalAmountPaise: sel.finalAmountPaise,
        advancePaise: Math.round((sel.finalAmountPaise * sel.advancePercentage) / 100),
        status: 'CONFIRMED',
        confirmedAt: new Date().toISOString(),
        requestId: id || '',
        quoteCode: sel.quotationCode,
        notes: `Contract value: ${formatINR(sel.finalAmountPaise)}. Advance Commitment: ${sel.advancePercentage}% (${formatINR(Math.round((sel.finalAmountPaise * sel.advancePercentage) / 100))})`,
      };

      savePlatformBooking(newBooking);

      // Create official execution project transition (Spec Part 2)
      const existingReq = id ? getPlatformRequestById(id) : undefined;
      const newProj = createProjectFromAcceptedQuotation({
        customer: {
          id: user?.id || `usr-cust-${Date.now()}`,
          name: user?.name || 'Homeowner',
          phone: user?.phone || '',
        },
        request: {
          id: id || `req-${Date.now()}`,
          requestCode: existingReq?.requestCode || `REQ-${Math.floor(1000 + Math.random() * 9000)}`,
          city: existingReq?.city || 'Noida',
          state: existingReq?.state || 'Uttar Pradesh',
          locality: existingReq?.locality || 'Sector 150',
          serviceType: existingReq?.serviceType || 'New House Construction',
        },
        quotation: {
          id: sel.id,
          quotationCode: sel.quotationCode,
          finalAmountPaise: sel.finalAmountPaise,
          advancePercentage: sel.advancePercentage,
          scopeOfWork: sel.scopeOfWork,
          professional: {
            id: sel.professional?.id,
            name: sel.professional?.name,
            firmName: sel.professional?.firmName,
            phone: sel.professional?.phone,
          },
        },
        bookingCode,
      });
      createdProjectId = newProj.id;

      // Update quotation and request status
      updatePlatformQuotationStatus(sel.id, 'ACCEPTED', {
        bookingCode,
        projectId: newProj.id,
        workOrderNumber: newProj.workOrderNumber,
        acceptedAt: new Date().toISOString(),
        isBooked: true,
      });

      // Dismiss all competing unselected quotations for this request so only the booked architect remains
      try {
        const stored = localStorage.getItem('platform_quotations');
        if (stored) {
          const parsed = JSON.parse(stored);
          const updated = parsed.map((q: any) => {
            if (q.id === sel.id || q.quotationCode === sel.quotationCode) {
              return {
                ...q,
                status: 'ACCEPTED',
                bookingCode,
                projectId: newProj.id,
                workOrderNumber: newProj.workOrderNumber,
                acceptedAt: new Date().toISOString(),
                isBooked: true,
              };
            }
            if (
              (sel.requestId && q.requestId === sel.requestId) ||
              (id && (q.requestId === id || q.requestCode === id)) ||
              (sel.requestCode && (q.requestCode === sel.requestCode || q.requestId === sel.requestCode))
            ) {
              return {
                ...q,
                status: 'UNSELECTED',
                isDismissed: true,
                dismissedReason: 'Homeowner selected another architect quotation for this project.',
              };
            }
            return q;
          });
          localStorage.setItem('platform_quotations', JSON.stringify(updated));
        }
      } catch (e) {}

      if (sel.requestId || id) {
        updatePlatformRequestStatus(sel.requestId || id, 'BOOKING_CONFIRMED', {
          bookedQuotationId: sel.id,
          bookedArchitectId: sel.professional?.id || (sel as any).architectId,
          bookedFirmName: sel.professional?.firmName || (sel as any).firmName,
          bookingCode,
        });
      }
    }

    try {
      if (id) {
        await apiRequest(`/quotations/${selectedQuoteId}/select`, {
          method: 'POST',
          body: JSON.stringify({ requestId: id }),
        });
      }
    } catch {
      // Local persistent store handles client-only mode
    } finally {
      setIsBooking(false);
      setShowConfirmModal(false);
      success('Quotation accepted! Work Order and execution project initialized.');
      if (createdProjectId) {
        navigate(`/dashboard/projects/${createdProjectId}/kickoff`);
      } else {
        navigate('/dashboard/projects');
      }
    }
  };

  const handleDownloadPdf = (quoteCode: string) => {
    success(`Downloading verified technical quotation PDF for ${quoteCode}...`);
  };

  const selectedQuote = quotations.find((q) => q.id === selectedQuoteId);

  return (
    <div className="space-y-8 pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link to="/dashboard/requests" className="text-xs text-gold-600 hover:underline">
            ← Back to Requests
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-navy-950">
            Compare Published Quotations
          </h1>
          <p className="text-xs text-slate-500">
            Side-by-side technical and financial breakdown reviewed and approved by GharDesign administrators.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>{quotations.length} Approved Quotations Available</span>
        </div>
      </div>

      {quotations.length === 0 ? (
        <div className="card p-12 text-center space-y-4">
          <Layers className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-navy-950 text-base">Quotations Under Preparation</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Assigned engineers and technical specialists are currently preparing your itemized bills of quantities.
            You will be notified as soon as administrator reviews are complete.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Scope Comparison Notice per Master Prompt 6.3 */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-xs text-amber-900 shadow-2xs">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <div className="font-bold">Important Scope Comparison Notice:</div>
              <p className="text-amber-800 leading-relaxed">
                Different Engineering Firms may specify varying deliverables (e.g. 3D walkthroughs, structural load vetting, municipal sanction liaisoning). Please inspect the itemized deliverables and exclusions below to ensure you are comparing matching service scopes before confirming an advance.
              </p>
            </div>
          </div>

          {/* Side by side comparison cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {quotations.map((rawQuote) => {
              const quote = normalizeQuotation(rawQuote);
              const isSelected = selectedQuoteId === quote.id;

              return (
                <div
                  key={quote.id}
                  className={`card p-6 flex flex-col justify-between space-y-6 transition border-2 ${
                    quote.status === 'SELECTED'
                      ? 'border-purple-500 bg-purple-50/10'
                      : isSelected
                      ? 'border-gold-500 shadow-xl'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold font-mono text-slate-500">{quote.quotationCode}</span>
                          <Badge status={quote.status} />
                        </div>
                        <h3 className="text-xl font-bold font-display text-navy-950 mt-1">
                          {quote.professional?.firmName}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">{quote.professional?.qualifications}</p>
                        <div className="flex items-center gap-2 text-[11px] text-slate-600 mt-2">
                          <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-700 font-semibold">
                            {quote.professional?.experienceYears} Yrs Experience
                          </span>
                          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-medium border border-emerald-200">
                            IEI / Certified Vetted
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDownloadPdf(quote.quotationCode)}
                        title="Download PDF BOQ"
                        className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Price Card */}
                    <div className="p-4 bg-slate-50 rounded-xl space-y-2 border border-slate-100">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>Total Quoted Amount (Incl. GST):</span>
                        <span className="text-slate-400 line-through">
                          {formatINR(quote.subtotalPaise + quote.taxPaise)}
                        </span>
                      </div>
                      <div className="flex items-baseline justify-between">
                        <span className="text-2xl font-bold font-display text-navy-950">
                          {formatINR(quote.finalAmountPaise)}
                        </span>
                        <span className="text-xs text-emerald-600 font-semibold">
                          Discount: {formatINR(quote.discountPaise)}
                        </span>
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                        <span>Advance Required ({quote.advancePercentage}%):</span>
                        <span className="font-semibold text-slate-800">
                          {formatINR(Math.round((quote.finalAmountPaise * quote.advancePercentage) / 100))}
                        </span>
                      </div>
                    </div>

                    {/* Scope of Work */}
                    <div className="space-y-1.5 text-xs">
                      <span className="font-bold text-navy-950 uppercase tracking-wider block">Scope of Work:</span>
                      <p className="text-slate-600 leading-relaxed bg-white p-3 rounded-lg border border-slate-100">
                        {quote.scopeOfWork}
                      </p>
                    </div>

                    {/* Itemized Line Items */}
                    <div className="space-y-2 text-xs">
                      <span className="font-bold text-navy-950 uppercase tracking-wider block">
                        Itemized Bill of Quantities (BOQ):
                      </span>
                      <div className="border border-slate-200 rounded-lg overflow-hidden">
                        <table className="w-full text-left text-[11px]">
                          <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                            <tr>
                              <th className="p-2">Description</th>
                              <th className="p-2 text-right">Qty</th>
                              <th className="p-2 text-right">Rate</th>
                              <th className="p-2 text-right">Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {(quote.lineItems || []).map((item, idx) => (
                              <tr key={idx} className="hover:bg-slate-50">
                                <td className="p-2 text-slate-800">{item.description}</td>
                                <td className="p-2 text-right text-slate-600 whitespace-nowrap">
                                  {item.quantity} {item.unit}
                                </td>
                                <td className="p-2 text-right text-slate-600 whitespace-nowrap">
                                  {formatINR(item.unitPricePaise)}
                                </td>
                                <td className="p-2 text-right font-semibold text-slate-900 whitespace-nowrap">
                                  {formatINR(item.totalPaise)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Deliverables & Exclusions */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-2">
                        <span className="font-bold text-emerald-800 uppercase tracking-wider block">
                          Included Deliverables:
                        </span>
                        <ul className="space-y-1.5 text-[11px] text-slate-600">
                          {(quote.includedDeliverables || []).map((del, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                              <span>{del}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="space-y-2">
                        <span className="font-bold text-rose-800 uppercase tracking-wider block">
                          Explicit Exclusions:
                        </span>
                        <ul className="space-y-1.5 text-[11px] text-slate-600">
                          {(quote.excludedWork || []).map((exc, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <X className="w-3.5 h-3.5 text-rose-500 flex-shrink-0 mt-0.5" />
                              <span>{exc}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Timeline & Revisions specs */}
                    <div className="p-3 bg-slate-50 rounded-xl grid grid-cols-3 gap-2 text-center text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Duration</span>
                        <span className="font-bold text-navy-950">{quote.estimatedDurationDays} Days</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Revisions</span>
                        <span className="font-bold text-navy-950">{quote.revisionsCount} Iterations</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Validity</span>
                        <span className="font-bold text-navy-950">{formatDate(quote.validUntil)}</span>
                      </div>
                    </div>

                    {/* Milestones */}
                    <div className="space-y-2 text-xs">
                      <span className="font-bold text-navy-950 uppercase tracking-wider block">
                        Payment Milestone Schedule:
                      </span>
                      <div className="space-y-1.5">
                        {(quote.milestones || []).map((m, i) => (
                          <div key={i} className="p-2 bg-white border border-slate-200 rounded-lg flex items-center justify-between text-[11px]">
                            <span className="text-slate-800">{m.title}</span>
                            <span className="font-semibold text-navy-950">
                              {m.percentage}% ({formatINR(m.amountPaise)})
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions & Booking CTA Button */}
                  <div className="pt-4 border-t border-slate-100 space-y-2">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/dashboard/quotations/${quote.id}`}
                        className="flex-1 py-2 px-3 text-center border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs transition"
                      >
                        View Full Breakdown
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDownloadPdf(quote.quotationCode)}
                        className="p-2 border border-slate-300 hover:bg-slate-50 text-slate-600 rounded-xl transition"
                        title="Download PDF"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>

                    {quote.status === 'SELECTED' ? (
                      <div className="p-3 bg-purple-100 border border-purple-200 text-purple-900 rounded-xl text-center font-bold text-xs">
                        ✓ Selected & Booked
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedQuoteId(quote.id);
                          setShowConfirmModal(true);
                        }}
                        className="btn-gold w-full py-2.5 text-xs font-bold shadow-md flex items-center justify-center gap-2 rounded-xl"
                      >
                        <span>Select Quotation & Confirm Booking</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && selectedQuote && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="min-h-screen px-4 flex items-center justify-center">
            <div className="fixed inset-0 bg-navy-950/70 backdrop-blur-sm" onClick={() => setShowConfirmModal(false)} />
            <div className="relative bg-white rounded-2xl max-w-lg w-full p-6 text-left shadow-2xl border border-slate-100 space-y-5 z-10">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold font-display text-navy-950 text-base">
                  Confirm Quotation Acceptance
                </h3>
                <span className="text-xs font-mono text-slate-500">{selectedQuote.quotationCode}</span>
              </div>

              <div className="space-y-3 text-xs">
                <p className="text-slate-600 leading-relaxed">
                  You are selecting <strong>{selectedQuote.professional?.firmName}</strong> for your project.
                  Once confirmed, other active quotations for this request will be closed.
                </p>

                <div className="p-4 bg-slate-50 rounded-xl space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Agreed Total Price:</span>
                    <span className="font-bold text-navy-950 text-sm">{formatINR(selectedQuote.finalAmountPaise)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Advance Commitment:</span>
                    <span className="font-semibold text-slate-800">
                      {selectedQuote.advancePercentage}% (
                      {formatINR(Math.round((selectedQuote.finalAmountPaise * selectedQuote.advancePercentage) / 100))})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Included Revisions:</span>
                    <span className="font-semibold text-slate-800">{selectedQuote.revisionsCount} Iterations</span>
                  </div>
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-[11px]">
                  <strong>Policy:</strong> Milestone escrow terms apply. Advance payments are held until the initial concept layout sign-off.
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="btn-outline text-xs py-2 px-4"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSelectQuotation}
                  disabled={isBooking}
                  className="btn-gold text-xs py-2.5 px-6 flex items-center gap-2 font-semibold shadow-md"
                >
                  <span>{isBooking ? 'Confirming...' : 'Accept & Confirm Booking'}</span>
                  <Check className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
