import { BuildGharLoader } from '../../components/common/BuildGharLoader.js';
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiRequest } from '../../lib/api.js';
import { Badge } from '../../components/common/Badge.js';
import { formatDate } from '../../lib/utils.js';
import {
  FileText,
  MapPin,
  Calendar,
  Layers,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Building,
  FileCheck2,
  AlertCircle,
  Download,
  Receipt,
  User,
  Phone,
  Mail,
  Printer,
  FileSpreadsheet,
} from 'lucide-react';
import {
  getPlatformRequestById,
  PlatformProjectRequest,
  syncChannel,
} from '../../data/customerStore.js';
import { downloadInquiryReceiptPdf } from '../../lib/pdfGenerator.js';
import { useToast } from '../../context/ToastContext.js';

export const RequestDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [request, setRequest] = useState<PlatformProjectRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const { success } = useToast();

  const handleDownloadReceipt = () => {
    if (!request) return;
    const filename = downloadInquiryReceiptPdf(request);
    success(`Receipt downloaded: ${filename}`);
  };

  const loadData = () => {
    if (!id) return;
    const local = getPlatformRequestById(id);
    if (local) {
      setRequest(local);
      setLoading(false);
      return;
    }

    if (id === 'req-1001' || id === 'GHR-REQ-2026-1001') {
      setRequest(null);
      setLoading(false);
      return;
    }

    apiRequest(`/requests/${id}`)
      .then((res) => {
        if (res.data && res.data.id !== 'req-1001' && !res.data.customerName?.toLowerCase().includes('vikram')) {
          setRequest(res.data);
        } else {
          setRequest(null);
        }
      })
      .catch(() => {
        setRequest(null);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();

    const interval = setInterval(loadData, 30000);
    window.addEventListener('storage', loadData);

    const onSync = (event: MessageEvent) => {
      if (event.data?.type === 'PROJECT_REQUESTS_UPDATED') {
        loadData();
      }
    };
    if (syncChannel) {
      syncChannel.addEventListener('message', onSync);
    }

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', loadData);
      if (syncChannel) {
        syncChannel.removeEventListener('message', onSync);
      }
    };
  }, [id]);

  if (loading) {
    return <div className="p-16 flex items-center justify-center"><BuildGharLoader message="Loading project specifications..." /></div>;
  }

  if (!request) {
    return (
      <div className="card p-12 text-center space-y-4 max-w-xl mx-auto my-8 bg-white border border-slate-200 font-sans">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold font-display text-navy-950">Project Inquiry Not Found</h2>
        <p className="text-xs text-slate-500">
          The requested project inquiry does not exist or has been removed.
        </p>
        <Link to="/dashboard/requests" className="btn-primary text-xs py-2 px-5 inline-block">
          Return to My Requests
        </Link>
      </div>
    );
  }

  const isVerifiedByAdmin = [
    'VERIFIED',
    'APPROVED',
    'ASSIGNED',
    'QUOTATIONS_AVAILABLE',
    'BOOKING_CONFIRMED',
    'IN_PROGRESS',
    'COMPLETED',
  ].includes(request.status);

  const isAssigned = [
    'ASSIGNED',
    'QUOTATIONS_AVAILABLE',
    'BOOKING_CONFIRMED',
    'IN_PROGRESS',
    'COMPLETED',
  ].includes(request.status);

  const hasPublishedQuotesInStore = (() => {
    try {
      const stored = localStorage.getItem('platform_quotations');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed.some(
            (q: any) =>
              (q.requestId === request.id || q.requestCode === request.requestCode || q.requestId === request.requestCode) &&
              (q.status === 'PUBLISHED' || q.status === 'PUBLISHED_TO_CUSTOMER' || q.status === 'APPROVED' || q.status === 'ACCEPTED')
          );
        }
      }
    } catch (e) {}
    return false;
  })();

  const areQuotationsPublished =
    hasPublishedQuotesInStore ||
    [
      'QUOTATIONS_AVAILABLE',
      'BOOKING_CONFIRMED',
      'IN_PROGRESS',
      'COMPLETED',
    ].includes(request.status);

  const isBooked = [
    'BOOKING_CONFIRMED',
    'IN_PROGRESS',
    'COMPLETED',
  ].includes(request.status);

  // 6 Primary milestones in customer timeline
  const timelineStages = [
    {
      title: 'Inquiry Submitted & Fee Paid',
      desc: request.isFeePaid ? 'Quotation request fee received (₹499)' : 'Payment submitted',
      done: true,
      active: false,
    },
    {
      title: 'Admin Technical Verification',
      desc: isVerifiedByAdmin
        ? 'Scope checked & verified by in-house structural engineers'
        : 'In-house vetting desk checking plot measurements & scope',
      done: isVerifiedByAdmin,
      active: request.status === 'UNDER_REVIEW',
    },
    {
      title: 'Certified Professionals Assigned',
      desc: isAssigned
        ? `${request.assignedCount || 2} vetted regional contractorure firms assigned to draft BOQs`
        : 'Awaiting administrator dispatch to accredited firms',
      done: isAssigned,
      active: request.status === 'VERIFIED' || request.status === 'APPROVED',
    },
    {
      title: 'Quotations Prepared & Vetted',
      desc: areQuotationsPublished
        ? 'Itemized BOQ deliverables inspected for neutral rate standards'
        : 'assigned professionals preparing engineering blueprints & rates',
      done: areQuotationsPublished,
      active: request.status === 'ASSIGNED',
    },
    {
      title: 'Quotations Published to Dashboard',
      desc: areQuotationsPublished
        ? 'Available now for side-by-side comparison & instant booking'
        : 'Pending final review before publishing',
      done: areQuotationsPublished,
      active: request.status === 'QUOTATIONS_AVAILABLE',
    },
    {
      title: 'Contract Awarded & Execution',
      desc: isBooked
        ? 'Milestone escrow contract confirmed. Contractor initiated concept layouts.'
        : 'Select your preferred quotation to award project contract',
      done: isBooked,
      active: request.status === 'BOOKING_CONFIRMED',
    },
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link to="/dashboard/requests" className="text-xs text-gold-700 hover:underline font-semibold flex items-center gap-1">
            ← Back to My Requests
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold font-display text-navy-950">{request.requestCode}</h1>
            <Badge status={request.status} />
          </div>
          <p className="text-xs text-slate-500">
            Submitted on {formatDate(request.createdAt)} • <span className="capitalize">{request.categorySlug?.replace(/-/g, ' ')}</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleDownloadReceipt}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-2xl shadow-sm transition flex items-center gap-2 cursor-pointer"
            title="Download official inquiry fee receipt PDF"
          >
            <Download className="w-4 h-4 text-white" />
            <span>Download Receipt PDF</span>
          </button>

          {areQuotationsPublished && (
            <Link
              to={`/dashboard/requests/${request.id}/quotations`}
              className="btn-gold py-2.5 px-6 text-xs font-semibold shadow-md flex items-center gap-2"
            >
              <FileCheck2 className="w-4 h-4" />
              <span>Compare Published Quotations</span>
            </Link>
          )}
        </div>
      </div>

      {/* ---------------- CUSTOMER DOSSIER & OFFICIAL RECEIPT CARD ---------------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Customer & Site Details */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h3 className="text-xs font-bold text-navy-950 uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4 text-sky-600" />
              <span>Homeowner & Site Details</span>
            </h3>
            <span className="text-[10px] text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Verified Contact
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Customer Name</span>
              <span className="font-bold text-slate-900 text-sm">{request.customerName || 'Registered Homeowner'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Mobile Phone</span>
              <span className="font-bold text-slate-800 font-mono flex items-center gap-1 mt-0.5">
                <Phone className="w-3 h-3 text-slate-400" />
                {request.customerPhone ? (request.customerPhone.startsWith('+91') ? request.customerPhone : `+91 ${request.customerPhone}`) : 'Not Provided'}
              </span>
            </div>
            <div className="col-span-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Site Location</span>
              <span className="font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span>{request.locality ? `${request.locality}, ` : ''}{request.city}, {request.state}</span>
              </span>
            </div>
            {request.customerEmail && (
              <div className="col-span-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Email Address</span>
                <span className="font-medium text-slate-700 flex items-center gap-1 mt-0.5">
                  <Mail className="w-3 h-3 text-slate-400" />
                  {request.customerEmail}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Official Inquiry Registration Fee Receipt */}
        <div className="bg-gradient-to-br from-slate-900 to-navy-950 text-white p-5 rounded-3xl shadow-sm border border-slate-800 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
              <Receipt className="w-4 h-4 text-amber-400" />
              <span>Inquiry Registration Receipt</span>
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 inline-flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>PAID ₹499</span>
            </span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-[11px] text-slate-400">Receipt Ref:</span>
              <span className="font-mono font-bold text-amber-300 text-xs">
                BG/REC/{(request.requestCode || request.id || '').replace(/[^a-zA-Z0-9]/g, '')}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-[11px] text-slate-400">Fee Particulars:</span>
              <span className="text-slate-200 font-semibold text-[11px]">Architectural Feasibility & BOQ Dispatch</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-[11px] text-slate-400">Transaction Status:</span>
              <span className="text-emerald-400 font-bold text-[11px]">Success (Escrow Verified)</span>
            </div>
            <div className="pt-2 flex items-center gap-2">
              <button
                onClick={handleDownloadReceipt}
                className="flex-1 py-2 px-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Spec PDF</span>
              </button>
              <button
                onClick={() => window.print()}
                className="py-2 px-3 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 transition flex items-center justify-center gap-1.5 cursor-pointer"
                title="Print Receipt"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Verification Notice Banner */}
      {request.status === 'VERIFIED' && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-900 text-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <div className="font-bold">Admin Verification Completed!</div>
            <div className="text-[11px] text-emerald-700">
              Our engineering desk has verified your property specifications. Certified regional contractors are being assigned to prepare competitive proposals.
            </div>
          </div>
        </div>
      )}

      {/* Assigned Notice Banner */}
      {request.status === 'ASSIGNED' && (
        <div className="p-4 bg-sky-50 border border-sky-200 rounded-2xl flex items-center gap-3 text-sky-950 text-xs shadow-2xs">
          <CheckCircle2 className="w-5 h-5 text-sky-600 shrink-0" />
          <div>
            <div className="font-bold">Architect & Engineering Partner Assigned!</div>
            <div className="text-[11px] text-sky-800">
              Your inquiry has been assigned to a verified COA Architect partner. Engineering blueprints and competitive BOQ quotation are currently being drafted.
            </div>
          </div>
        </div>
      )}

      {/* Visual Status Progress Tracker */}
      <div className="card p-6 bg-white border border-slate-200 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold text-navy-950 uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-gold-600" />
            <span>Project Status Timeline & Milestones</span>
          </h2>
          <span className="text-[11px] text-slate-500 font-semibold">Live Real-Time Status</span>
        </div>

        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {timelineStages.map((stage, idx) => (
            <div key={idx} className="relative flex items-start gap-4">
              <div
                className={`absolute -left-6 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  stage.done
                    ? 'bg-emerald-500 text-white'
                    : stage.active
                    ? 'bg-gold-500 text-white ring-4 ring-gold-100'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                {stage.done ? '✓' : idx + 1}
              </div>
              <div>
                <h3 className={`text-xs font-bold ${stage.done || stage.active ? 'text-navy-950' : 'text-slate-400'}`}>
                  {stage.title}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">{stage.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Property Information Card */}
      <div className="card p-6 bg-white border border-slate-200 space-y-6">
        <h2 className="text-sm font-bold text-navy-950 uppercase tracking-wider">Property & Design Specifications</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block mb-1">Plot Dimensions:</span>
            <span className="font-semibold text-slate-800">
              {request.plotWidth} × {request.plotLength} {request.measurementUnit?.toLowerCase()} ({request.plotArea}{' '}
              {request.measurementUnit === 'FEET' ? 'sq.ft' : 'sq.m'})
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block mb-1">Built-Up Area / Floors:</span>
            <span className="font-semibold text-slate-800">
              {request.builtUpArea || 'Custom'} sq.ft • {request.floors} Floors
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block mb-1">Rooms Breakdown:</span>
            <span className="font-semibold text-slate-800">
              {request.bedrooms} Beds, {request.bathrooms} Baths, {request.kitchens} Kitchens
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block mb-1">Site Location:</span>
            <span className="font-semibold text-slate-800">
              {request.locality}, {request.city}, {request.state}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block mb-1">Budget Allocation:</span>
            <span className="font-semibold text-gold-700">{request.budgetRange}</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block mb-1">Building Style:</span>
            <span className="font-semibold text-slate-800">{request.designStyle || 'Modern'}</span>
          </div>
        </div>

        {request.requiredServices && request.requiredServices.length > 0 && (
          <div className="pt-2 text-xs space-y-2">
            <span className="text-slate-500 font-semibold block">Requested Drawings & Deliverables:</span>
            <div className="flex flex-wrap gap-2">
              {(request.requiredServices || []).map((srv, idx) => (
                <span key={idx} className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md font-medium text-[11px]">
                  {srv}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="pt-2 text-xs space-y-1">
          <span className="text-slate-500 font-semibold block">Detailed Project Vision:</span>
          <p className="text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-lg border border-slate-100">
            {request.description}
          </p>
        </div>
      </div>
    </div>
  );
};
