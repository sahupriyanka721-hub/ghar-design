import { BuildGharLoader } from '../../components/common/BuildGharLoader.js';
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiRequest } from '../../lib/api.js';
import { formatINR, formatDate, normalizeQuotation } from '../../lib/utils.js';
import { useToast } from '../../context/ToastContext.js';
import { Badge } from '../../components/common/Badge.js';
import { useAuth } from '../../context/AuthContext.js';
import { downloadQuotationPdf } from '../../lib/pdfGenerator.js';
import {
  savePlatformBooking,
  PlatformBooking,
  getPlatformRequestById,
  updatePlatformQuotationStatus,
  updatePlatformRequestStatus,
} from '../../data/customerStore.js';
import { createProjectFromAcceptedQuotation } from '../../data/projectExecutionStore.js';
import {
  FileText,
  Download,
  Calendar,
  Check,
  X,
  ShieldCheck,
  Building,
  ArrowRight,
  Clock,
  Printer,
  MessageSquare,
  RotateCcw,
  Ban,
  Send,
  AlertTriangle,
  CheckCircle2,
  User,
  MapPin,
  Phone,
} from 'lucide-react';
import { Quotation } from '@ghar-design/shared';

export const QuotationDetail: React.FC = () => {
  const { quoteId } = useParams<{ quoteId: string }>();
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  // Modals
  const [acceptModalOpen, setAcceptModalOpen] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);

  const [clarificationModalOpen, setClarificationModalOpen] = useState(false);
  const [clarificationText, setClarificationText] = useState('');

  const [revisionModalOpen, setRevisionModalOpen] = useState(false);
  const [revisionText, setRevisionText] = useState('');

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    let foundQuote: any = null;
    try {
      const stored = localStorage.getItem('platform_quotations');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          foundQuote = parsed.find(
            (q: any) =>
              (q.id === quoteId || q.quotationCode === quoteId) &&
              q.quotationCode !== 'QT-2026-001' &&
              q.requestId !== 'req-1001'
          );
        }
      }
    } catch (e) {}

    if (foundQuote) {
      setQuotation(normalizeQuotation(foundQuote));
      setLoading(false);
      return;
    }

    if (quoteId) {
      apiRequest(`/quotations/${quoteId}`)
        .then((res) => {
          if (res.data) setQuotation(normalizeQuotation(res.data));
          else setQuotation(null);
        })
        .catch(() => {
          setQuotation(null);
        })
        .finally(() => setLoading(false));
    } else {
      setQuotation(null);
      setLoading(false);
    }
  }, [quoteId]);

  if (loading) {
    return <div className="p-16 flex items-center justify-center"><BuildGharLoader message="Loading quotation details & itemized BOQ..." /></div>;
  }

  if (!quotation) {
    return (
      <div className="card p-12 text-center space-y-4 max-w-xl mx-auto my-8 bg-white border border-slate-200 font-sans">
        <h2 className="text-xl font-bold font-display text-navy-950">Quotation Not Found</h2>
        <p className="text-xs text-slate-500">
          The requested quotation does not exist or has been removed.
        </p>
        <Link to="/dashboard/quotations" className="btn-primary text-xs py-2 px-5 inline-block">
          Return to My Quotations
        </Link>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    if (!quotation) return;
    try {
      const qAny = quotation as any;
      const customer = {
        name: qAny.customerName || user?.name || '',
        phone: qAny.customerPhone || user?.phone || '',
        city: qAny.city || '',
        requestId: qAny.requestCode || qAny.requestId || '',
      };
      const professional = {
        name: quotation.professional?.name || qAny.professionalName || '',
        firmName: quotation.professional?.firmName || qAny.firmName || '',
        phone: quotation.professional?.phone || '',
        coaNumber: (quotation.professional as any)?.coaNumber || '',
      };
      const filename = downloadQuotationPdf(quotation, customer, professional);
      success(`Official BOQ PDF downloaded: ${filename}`);
    } catch (err: any) {
      error(err?.message || 'Failed to download PDF');
    }
  };

  const handleConfirmAcceptQuotation = async () => {
    if (!quotation) return;
    setIsAccepting(true);

    try {
      const bookingCode = `GHR-BK-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const existingReq = quotation.requestId ? getPlatformRequestById(quotation.requestId) : undefined;

      const totalPaise = quotation.finalAmountPaise || 0;
      const advPct = quotation.advancePercentage || 15;
      const advancePaise = Math.round((totalPaise * advPct) / 100);

      const newBooking: PlatformBooking = {
        id: `bk-${Date.now()}`,
        bookingCode,
        customerId: user?.id || (quotation as any).customerId || `usr-cust-${Date.now()}`,
        customerName: user?.name || (quotation as any).customerName || 'Registered Homeowner',
        customerPhone: user?.phone || (quotation as any).customerPhone || '',
        customerEmail: user?.email || '',
        serviceTitle: `${quotation.professional?.firmName || 'Certified Partner'} - Complete Project Engagement`,
        serviceType: (quotation as any).serviceType || existingReq?.serviceType || 'Civil Construction Contract',
        firmName: quotation.professional?.firmName || 'BuildGhar Certified Partner',
        totalAmountPaise: totalPaise,
        advancePaise,
        status: 'CONFIRMED',
        confirmedAt: new Date().toISOString(),
        requestId: quotation.requestId || '',
        quoteCode: quotation.quotationCode,
        notes: `Contract value: ${formatINR(totalPaise)}. Advance Commitment: ${advPct}% (${formatINR(advancePaise)})`,
      };

      savePlatformBooking(newBooking);

      const newProj = createProjectFromAcceptedQuotation({
        customer: {
          id: user?.id || (quotation as any).customerId || `usr-cust-${Date.now()}`,
          name: user?.name || (quotation as any).customerName || 'Registered Homeowner',
          phone: user?.phone || (quotation as any).customerPhone || '',
        },
        request: {
          id: quotation.requestId || `req-${Date.now()}`,
          requestCode: existingReq?.requestCode || (quotation as any).requestCode || `REQ-${Math.floor(1000 + Math.random() * 9000)}`,
          city: existingReq?.city || (quotation as any).city || 'Indore',
          state: existingReq?.state || (quotation as any).state || 'Madhya Pradesh',
          locality: existingReq?.locality || (quotation as any).locality || 'Site Address',
          serviceType: existingReq?.serviceType || (quotation as any).serviceType || 'Civil House Construction',
        },
        quotation: {
          id: quotation.id,
          quotationCode: quotation.quotationCode,
          finalAmountPaise: totalPaise,
          advancePercentage: advPct,
          scopeOfWork: quotation.scopeOfWork,
          professional: {
            id: quotation.professional?.id,
            name: quotation.professional?.name,
            firmName: quotation.professional?.firmName,
            phone: quotation.professional?.phone,
          },
        },
        bookingCode,
      });

      updatePlatformQuotationStatus(quotation.id, 'ACCEPTED', {
        bookingCode,
        projectId: newProj.id,
        workOrderNumber: newProj.workOrderNumber,
        acceptedAt: new Date().toISOString(),
      });

      if (quotation.requestId) {
        updatePlatformRequestStatus(quotation.requestId, 'BOOKING_CONFIRMED');
      }

      setQuotation((prev) => (prev ? { ...prev, status: 'ACCEPTED' } : null));

      try {
        await apiRequest(`/quotations/${quotation.id}/select`, {
          method: 'POST',
          body: JSON.stringify({ requestId: quotation.requestId }),
        });
      } catch (e) {
        // Local persistent state handles client mode
      }

      success(`Quotation ${quotation.quotationCode} accepted! Work Order ${newProj.workOrderNumber} generated.`);
      setAcceptModalOpen(false);
      navigate('/dashboard/accepted-quotations');
    } catch (err: any) {
      console.error(err);
      error(err.message || 'Failed to accept quotation. Please try again.');
    } finally {
      setIsAccepting(false);
    }
  };

  const handleSendClarification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clarificationText.trim()) return;
    success(`Clarification inquiry sent to ${quotation.professional?.firmName || 'the contractor'}.`);
    setClarificationText('');
    setClarificationModalOpen(false);
  };

  const handleSendRevision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!revisionText.trim()) return;
    success(`Revision request submitted to ${quotation.professional?.firmName || 'the contractor'}.`);
    setRevisionText('');
    setRevisionModalOpen(false);
  };

  const handleRejectQuotation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectReason.trim()) return;
    setQuotation((prev) => (prev ? { ...prev, status: 'REJECTED' } : null));
    success(`Quotation ${quotation.quotationCode} declined.`);
    setRejectReason('');
    setRejectModalOpen(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16 font-sans">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <Link to="/dashboard/quotations" className="text-xs text-gold-600 hover:underline">
            ← Back to All Quotations
          </Link>
          <div className="flex items-center gap-3 mt-1">
            <h1 className="text-2xl sm:text-3xl font-bold font-display text-navy-950">
              Quotation {quotation.quotationCode}
            </h1>
            <Badge status={quotation.status} />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setClarificationModalOpen(true)}
            className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl shadow-2xs flex items-center gap-1.5 transition"
          >
            <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
            <span>Clarification</span>
          </button>
          <button
            onClick={() => setRevisionModalOpen(true)}
            className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl shadow-2xs flex items-center gap-1.5 transition"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
            <span>Request Revision</span>
          </button>
          <button
            onClick={handleDownloadPdf}
            className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-2xs flex items-center gap-1.5 transition cursor-pointer"
            title="Download Official Engineering Spec PDF"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Spec PDF</span>
          </button>
          <button
            onClick={handlePrint}
            className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl shadow-2xs flex items-center gap-1.5 transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>
          {quotation.status === 'ACCEPTED' && (
            <Link
              to="/dashboard/accepted-quotations"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition"
            >
              <Check className="w-3.5 h-3.5" />
              <span>View Accepted Engagement</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
          {(quotation.status === 'PUBLISHED' || quotation.status === 'PUBLISHED_TO_CUSTOMER' || quotation.status === 'APPROVED') && (
            <>
              <button
                onClick={() => setRejectModalOpen(true)}
                className="px-3 py-2 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl shadow-2xs flex items-center gap-1.5 transition"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>Reject</span>
              </button>
              <button
                onClick={() => setAcceptModalOpen(true)}
                className="btn-gold text-xs py-2 px-4 flex items-center gap-1.5 font-bold rounded-xl shadow-sm"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Accept & Book Service</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Quotation Paper Layout */}
      <div className="card p-6 sm:p-10 space-y-8 bg-white border border-slate-200 shadow-lg rounded-2xl">
        {/* Header Strip */}
        <div className="flex flex-col sm:flex-row justify-between gap-6 pb-6 border-b border-slate-200">
          <div>
            <div className="text-xl font-bold font-display text-navy-950">{quotation.professional?.firmName}</div>
            <div className="text-xs text-slate-500 mt-0.5">{quotation.professional?.qualifications}</div>
            <div className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 mt-2 font-semibold">
              <ShieldCheck className="w-3 h-3" /> Accredited GharDesign Associate
            </div>
          </div>

          <div className="text-left sm:text-right text-xs space-y-1">
            <div className="text-slate-400">Date Issued:</div>
            <div className="font-semibold text-slate-800">{formatDate(quotation.createdAt)}</div>
            <div className="text-slate-400 pt-1">Quotation Valid Until:</div>
            <div className="font-bold text-navy-950">{formatDate(quotation.validUntil)}</div>
          </div>
        </div>

        {/* Customer & Project Site Dossier Strip */}
        <div className="p-4 bg-gradient-to-r from-sky-50 via-blue-50/70 to-slate-50 rounded-2xl border border-sky-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-600 text-white font-bold flex items-center justify-center text-sm shadow-xs font-display shrink-0">
              {(user?.name || (quotation as any).customerName || 'S').charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-sky-800 font-bold flex items-center gap-1.5">
                <User className="w-3 h-3 text-sky-600" />
                <span>Quotation Issued For (Customer)</span>
              </div>
              <div className="text-sm font-black text-navy-950 flex items-center gap-2 flex-wrap">
                <span>{user?.name || (quotation as any).customerName || 'Sharika Mishra'}</span>
                <span className="text-xs font-normal text-slate-500 font-mono">
                  ({user?.phone || (quotation as any).customerPhone || '+91 9876543210'})
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 bg-white px-2.5 py-1 rounded-xl border border-slate-200 shadow-2xs">
              <MapPin className="w-3.5 h-3.5 text-rose-500" />
              <span>{(quotation as any).city || 'Indore, MP'}</span>
            </span>

            <button
              type="button"
              onClick={handleDownloadPdf}
              className="px-3 py-1 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>
          </div>
        </div>

        {/* Scope of Work */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Scope of Work</h3>
          <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            {quotation.scopeOfWork}
          </p>
        </div>

        {/* Itemized BOQ Table */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Itemized Bill of Quantities (BOQ)
          </h3>
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Item Description</th>
                  <th className="p-3 text-right">Quantity</th>
                  <th className="p-3 text-right">Unit Rate</th>
                  <th className="p-3 text-right">Amount (INR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(quotation.lineItems || []).map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="p-3 font-medium text-slate-800">{item.description}</td>
                    <td className="p-3 text-right text-slate-600">
                      {item.quantity} {item.unit}
                    </td>
                    <td className="p-3 text-right text-slate-600">{formatINR(item.unitPricePaise)}</td>
                    <td className="p-3 text-right font-bold text-navy-950">{formatINR(item.totalPaise)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="flex justify-end">
          <div className="w-full sm:w-80 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-semibold text-slate-800">{formatINR(quotation.subtotalPaise)}</span>
            </div>
            {Boolean(quotation.discountPaise) && (
              <div className="flex justify-between text-emerald-700">
                <span>Discount to Client:</span>
                <span className="font-semibold">-{formatINR(quotation.discountPaise)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <span>Net Total:</span>
              <span className="font-semibold text-slate-800">
                {formatINR(quotation.netTotalPaise || quotation.taxableAmountPaise || Math.max(0, (quotation.subtotalPaise || 0) - (quotation.discountPaise || 0)))}
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>GST (18%):</span>
              <span className="font-semibold text-slate-800">{formatINR(quotation.taxPaise)}</span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-bold text-navy-950">
              <span>Final Quotation Total:</span>
              <span className="text-gold-700">{formatINR(quotation.finalAmountPaise)}</span>
            </div>
            <div className="pt-1 text-[11px] text-slate-500">
              Advance Commitment: {quotation.advancePercentage}% (
              {formatINR(Math.round((quotation.finalAmountPaise * quotation.advancePercentage) / 100))})
            </div>
          </div>
        </div>

        {/* Deliverables & Exclusions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-200 text-xs">
          <div className="space-y-2">
            <h4 className="font-bold text-emerald-800 uppercase tracking-wider">Included Deliverables</h4>
            <ul className="space-y-1.5 text-slate-600 text-[11px]">
              {(quotation.includedDeliverables || []).map((del, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>{del}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-rose-800 uppercase tracking-wider">Explicit Exclusions</h4>
            <ul className="space-y-1.5 text-slate-600 text-[11px]">
              {(quotation.excludedWork || []).map((exc, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <X className="w-3.5 h-3.5 text-rose-500 flex-shrink-0 mt-0.5" />
                  <span>{exc}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Milestone Schedule */}
        <div className="space-y-3 pt-4 border-t border-slate-200">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Milestone Escrow Schedule
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {(quotation.milestones || []).map((m, i) => (
              <div key={i} className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 flex justify-between">
                <div>
                  <div className="font-semibold text-slate-800">{m.title}</div>
                  <div className="text-[11px] text-slate-400">Phase {i + 1}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-navy-950">{formatINR(m.amountPaise)}</div>
                  <div className="text-[10px] text-slate-500">{m.percentage}% of total</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Terms & Validity Note */}
        <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl text-xs text-amber-950 space-y-1">
          <div className="font-bold">Cancellation & Revision Terms:</div>
          <p className="text-[11px] leading-relaxed">
            {quotation.cancellationTerms || 'Standard BuildGhar Escrow Protection: Full milestone refund before site demarcation. 100% money-back guarantee on unapproved design revisions.'}
          </p>
          <p className="text-[11px] text-slate-500 pt-1">
            Included drawing formats: {(quotation.drawingFormats && Array.isArray(quotation.drawingFormats) && quotation.drawingFormats.length > 0 ? quotation.drawingFormats : ['AutoCAD (.DWG)', 'Architectural PDF', '3D High-Res Elevation', 'Structural Schedules']).join(', ')} • Revisions: {quotation.revisionsCount || 2}
          </p>
        </div>
      </div>

      {/* Clarification Modal */}
      {clarificationModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="min-h-screen px-4 flex items-center justify-center">
            <div className="fixed inset-0 bg-navy-950/70 backdrop-blur-sm" onClick={() => setClarificationModalOpen(false)} />
            <div className="relative bg-white rounded-2xl max-w-md w-full p-6 text-left shadow-2xl border border-slate-100 space-y-4 z-10 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-navy-950 text-sm">Request Scope Clarification</h3>
                <button onClick={() => setClarificationModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-slate-500">
                Send a technical question regarding materials, drawing schedules, or price breakdown to <strong>{quotation.professional?.firmName}</strong>.
              </p>
              <textarea
                rows={4}
                required
                value={clarificationText}
                onChange={(e) => setClarificationText(e.target.value)}
                placeholder="Ask specific questions about BOQ items, material grades, or milestone deliverables..."
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-navy-900 focus:outline-none"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setClarificationModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSendClarification}
                  className="px-4 py-2 bg-navy-950 text-gold-400 font-bold rounded-xl flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Inquiry</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Revision Modal */}
      {revisionModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="min-h-screen px-4 flex items-center justify-center">
            <div className="fixed inset-0 bg-navy-950/70 backdrop-blur-sm" onClick={() => setRevisionModalOpen(false)} />
            <div className="relative bg-white rounded-2xl max-w-md w-full p-6 text-left shadow-2xl border border-slate-100 space-y-4 z-10 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-navy-950 text-sm">Request Quotation Revision</h3>
                <button onClick={() => setRevisionModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-slate-500">
                Specify changes to deliverables, room layout requirements, or budget constraints. The designer will update and re-issue the quotation.
              </p>
              <textarea
                rows={4}
                required
                value={revisionText}
                onChange={(e) => setRevisionText(e.target.value)}
                placeholder=""
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-navy-900 focus:outline-none"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRevisionModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSendRevision}
                  className="px-4 py-2 bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-700 hover:from-sky-500 hover:to-blue-600 text-white font-bold rounded-xl flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Submit Revision Request</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="min-h-screen px-4 flex items-center justify-center">
            <div className="fixed inset-0 bg-navy-950/70 backdrop-blur-sm" onClick={() => setRejectModalOpen(false)} />
            <div className="relative bg-white rounded-2xl max-w-md w-full p-6 text-left shadow-2xl border border-slate-100 space-y-4 z-10 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-rose-700 text-sm">Decline / Reject Quotation</h3>
                <button onClick={() => setRejectModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-slate-500">
                Provide a reason for declining this proposal. This feedback helps improve future bids.
              </p>
              <textarea
                rows={3}
                required
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder=""
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRejectQuotation}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl flex items-center gap-1.5"
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>Confirm Decline</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Accept & Book Service Modal */}
      {acceptModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="min-h-screen px-4 flex items-center justify-center">
            <div className="fixed inset-0 bg-navy-950/70 backdrop-blur-sm" onClick={() => !isAccepting && setAcceptModalOpen(false)} />
            <div className="relative bg-white rounded-2xl max-w-lg w-full p-6 sm:p-7 text-left shadow-2xl border border-slate-100 space-y-5 z-10 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-navy-950 text-sm">Accept Quotation & Confirm Engagement</h3>
                    <p className="text-[11px] text-slate-500">Official Work Order and Project Initialization</p>
                  </div>
                </div>
                <button
                  disabled={isAccepting}
                  onClick={() => setAcceptModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Quotation Code:</span>
                  <span className="font-mono font-bold text-navy-950">{quotation.quotationCode}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Architect / Contractor:</span>
                  <span className="font-semibold text-slate-800">{quotation.professional?.firmName || 'Certified Partner'}</span>
                </div>
                <div className="flex items-center justify-between border-t border-slate-200/80 pt-2">
                  <span className="text-slate-500 font-medium">Total Contract Price:</span>
                  <span className="text-base font-bold font-mono text-navy-950">{formatINR(quotation.finalAmountPaise)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Advance Commitment ({quotation.advancePercentage || 15}%):</span>
                  <span className="font-bold font-mono text-emerald-700">
                    {formatINR(Math.round((quotation.finalAmountPaise * (quotation.advancePercentage || 15)) / 100))}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-emerald-50/70 border border-emerald-200/70 rounded-xl text-emerald-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-[11px]">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>BuildGhar Escrow & Guarantee Protection</span>
                </div>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  By accepting, an official Work Order is generated and your project workspace is created. Funds remain protected until milestones are completed and verified by you.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={isAccepting}
                  onClick={() => setAcceptModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isAccepting}
                  onClick={handleConfirmAcceptQuotation}
                  className="btn-gold py-2 px-5 font-bold rounded-xl flex items-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {isAccepting ? (
                    <span>Processing Acceptance...</span>
                  ) : (
                    <>
                      <span>Confirm & Sign Work Order</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
