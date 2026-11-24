import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiRequest } from '../../lib/api.js';
import { Badge } from '../../components/common/Badge.js';
import { formatDate } from '../../lib/utils.js';
import { useToast } from '../../context/ToastContext.js';
import {
  FileText,
  MapPin,
  Calendar,
  Layers,
  CheckCircle2,
  Clock,
  PlusCircle,
  ShieldCheck,
  Building,
  User,
  Phone,
  Mail,
  Share2,
  Check,
  X,
  ArrowLeft,
} from 'lucide-react';
import {
  getPlatformRequestById,
  getRegisteredCustomers,
  updatePlatformRequestStatus,
} from '../../data/customerStore.js';

export const ProfessionalRequestDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [request, setRequest] = useState<any | null>(null);
  const [status, setStatus] = useState<'PENDING' | 'ACCEPTED' | 'DECLINED'>('PENDING');
  const { success } = useToast();

  const getSavedResponses = () => {
    try {
      const raw = localStorage.getItem('professional_inquiry_responses');
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  };

  const saveInquiryResponse = (requestId: string, newStatus: 'ACCEPTED' | 'DECLINED') => {
    try {
      const responses = getSavedResponses();
      responses[requestId] = newStatus;
      localStorage.setItem('professional_inquiry_responses', JSON.stringify(responses));
    } catch {}
  };

  useEffect(() => {
    if (!id) return;
    const local = getPlatformRequestById(id);
    if (local) {
      setRequest(local);
      const responses = getSavedResponses();
      if (responses[local.id]) {
        setStatus(responses[local.id]);
      } else {
        setStatus(local.status === 'ASSIGNED' ? 'PENDING' : 'ACCEPTED');
      }
      return;
    }

    apiRequest(`/requests/${id}`)
      .then((res) => {
        if (res.data && res.data.id !== 'req-1001') {
          setRequest(res.data);
          const responses = getSavedResponses();
          if (responses[res.data.id]) {
            setStatus(responses[res.data.id]);
          } else {
            setStatus(res.data.status === 'ASSIGNED' ? 'PENDING' : 'ACCEPTED');
          }
        } else {
          setRequest(null);
        }
      })
      .catch(() => setRequest(null));
  }, [id]);

  const matchedCustomer = useMemo(() => {
    if (!request) return null;
    const customers = getRegisteredCustomers();
    const rawPhone = (request.customerPhone || '').replace(/\D/g, '').slice(-10);
    return (
      customers.find((c) => {
        if (request.customerId && c.id === request.customerId) return true;
        if (rawPhone && c.phone.replace(/\D/g, '').slice(-10) === rawPhone) return true;
        if (request.customerName && c.name.toLowerCase().trim() === request.customerName.toLowerCase().trim()) return true;
        return false;
      }) || null
    );
  }, [request]);

  const handleRespond = (newStatus: 'ACCEPTED' | 'DECLINED') => {
    if (!request) return;
    saveInquiryResponse(request.id, newStatus);
    if (newStatus === 'ACCEPTED') {
      updatePlatformRequestStatus(request.id, 'QUOTATIONS_AVAILABLE');
    }
    setStatus(newStatus);
    success(`Inquiry marked as ${newStatus === 'ACCEPTED' ? 'Accepted' : 'Declined'}`);
  };

  if (!request) return <div className="p-8 text-center text-slate-500 font-sans">Loading project specifications...</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16 font-sans">
      {/* Top Breadcrumb & Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <Link
            to="/professional/assigned"
            className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Assigned Requests</span>
          </Link>
          <div className="flex items-center gap-3 mt-1.5">
            <h1 className="text-2xl font-black font-display text-navy-950">{request.requestCode}</h1>
            <Badge status={status} />
            <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full capitalize">
              {request.categorySlug?.replace(/-/g, ' ') || 'Architectural Planning'}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {status === 'PENDING' ? (
            <>
              <button
                onClick={() => handleRespond('ACCEPTED')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Accept Inquiry</span>
              </button>
              <button
                onClick={() => handleRespond('DECLINED')}
                className="px-4 py-2 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 rounded-xl text-xs font-bold transition border border-slate-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Decline</span>
              </button>
            </>
          ) : status === 'ACCEPTED' ? (
            <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
              ✓ Assignment Accepted
            </span>
          ) : (
            <span className="text-xs text-slate-400 bg-slate-100 px-3 py-1.5 rounded-xl">
              Assignment Declined
            </span>
          )}

          {status === 'ACCEPTED' ? (
            <Link
              to={`/professional/quotation-builder?requestId=${request.id}`}
              className="px-4 py-2 bg-navy-950 hover:bg-navy-900 text-gold-400 font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-gold-400" />
              <span>Prepare Itemized BOQ</span>
            </Link>
          ) : (
            <span className="text-xs text-slate-500 italic">Accept inquiry to prepare quotation</span>
          )}
        </div>
      </div>

      {/* 1. Verified Homeowner Profile Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-blue-600/10 text-blue-600 border border-blue-200 flex items-center justify-center font-black text-xl font-display shrink-0">
              {(request.customerName || 'CU').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">{request.customerName}</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {matchedCustomer?.status || 'VERIFIED HOMEOWNER'}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                Customer ID: {matchedCustomer?.id || `BG/${(request.customerName || 'CUS').replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase()}/0001`}
                {matchedCustomer?.registeredAt && ` • Member since ${formatDate(matchedCustomer.registeredAt)}`}
              </div>
            </div>
          </div>

          {/* Direct Contact Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {request.customerPhone && (
              <a
                href={`tel:${request.customerPhone.replace(/\D/g, '')}`}
                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-bold border border-blue-200 transition flex items-center gap-1.5 text-xs"
                title="Call Homeowner"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>{request.customerPhone}</span>
              </a>
            )}
            {request.customerPhone && (
              <a
                href={`https://wa.me/91${request.customerPhone.replace(/\D/g, '').slice(-10)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl font-bold border border-emerald-200 transition flex items-center gap-1.5 text-xs"
                title="Chat on WhatsApp"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </a>
            )}
            {request.customerEmail && (
              <a
                href={`mailto:${request.customerEmail}`}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition flex items-center gap-1.5 text-xs"
                title="Send Email"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Email</span>
              </a>
            )}
          </div>
        </div>

        {/* Address Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block text-[10px] uppercase font-bold mb-0.5">Plot / House Address:</span>
            <span className="font-semibold text-slate-800">
              {matchedCustomer?.housePlotNumber || request.address || 'Site Plot Specified'}
            </span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block text-[10px] uppercase font-bold mb-0.5">Locality / Sector:</span>
            <span className="font-semibold text-slate-800">
              {matchedCustomer?.streetLocality || request.locality || 'Locality'}
            </span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block text-[10px] uppercase font-bold mb-0.5">City & State:</span>
            <span className="font-semibold text-slate-800">
              {request.city}, {matchedCustomer?.state || request.state || 'India'} {matchedCustomer?.pinCode ? `(${matchedCustomer.pinCode})` : ''}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Engineering & Architectural Brief */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs space-y-6">
        <h2 className="text-sm font-bold text-navy-950 uppercase tracking-wider flex items-center gap-2">
          <Building className="w-4 h-4 text-blue-600" />
          <span>Property & Plot Specifications</span>
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block text-[10px] uppercase font-bold mb-0.5">Dimensions:</span>
            <span className="font-semibold text-slate-800">
              {request.plotWidth && request.plotLength
                ? `${request.plotWidth} × ${request.plotLength} ${request.measurementUnit || 'ft'}`
                : `${request.plotArea || '1500'} ${request.measurementUnit || 'SQFT'}`}
            </span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block text-[10px] uppercase font-bold mb-0.5">Total Plot Area:</span>
            <span className="font-bold text-blue-900">
              {request.plotArea || 1500} {request.measurementUnit || 'SQFT'}
            </span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block text-[10px] uppercase font-bold mb-0.5">Floors / Structure:</span>
            <span className="font-semibold text-slate-800">{request.floors ? `${request.floors} Floors` : 'Ground + 1'}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block text-[10px] uppercase font-bold mb-0.5">Target Budget:</span>
            <span className="font-bold text-amber-700">{request.budgetRange || 'Market Rate'}</span>
          </div>
        </div>

        {/* Requested Services */}
        {request.requiredServices && request.requiredServices.length > 0 && (
          <div className="space-y-1.5 text-xs">
            <span className="text-slate-500 font-semibold block">Requested Drawings & Deliverables:</span>
            <div className="flex flex-wrap gap-1.5">
              {request.requiredServices.map((s: string, i: number) => (
                <span key={i} className="px-2.5 py-1 bg-blue-50 text-blue-900 border border-blue-200 rounded-lg text-xs font-semibold">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        <div className="space-y-1 text-xs">
          <span className="text-slate-500 font-semibold block">Client Project Description:</span>
          <p className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 leading-relaxed">
            {request.description}
          </p>
        </div>

        {/* Admin Notes */}
        {request.adminNotes && (
          <div className="text-blue-900 bg-blue-50 p-4 rounded-xl border border-blue-200 text-xs flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">GharDesign Chief Engineer Technical Note:</span>
              <span className="text-blue-800 mt-0.5 block">{request.adminNotes}</span>
            </div>
          </div>
        )}

        {request.siteAccessibilityNotes && (
          <div className="space-y-1 text-xs">
            <span className="text-slate-500 font-semibold block">Site Accessibility & Road Width:</span>
            <p className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700">
              {request.siteAccessibilityNotes}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
