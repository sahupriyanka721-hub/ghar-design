import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../../lib/api.js';
import { Badge } from '../../components/common/Badge.js';
import { useToast } from '../../context/ToastContext.js';
import { useAuth } from '../../context/AuthContext.js';
import {
  Building,
  PlusCircle,
  Check,
  X,
  Calendar,
  AlertCircle,
  Layers,
  MapPin,
  Clock,
  ArrowRight,
  ShieldCheck,
  User,
  Phone,
  Mail,
  Eye,
  ExternalLink,
  FileText,
  CheckCircle2,
  Share2,
  ArrowLeft,
} from 'lucide-react';
import {
  getPlatformRequests,
  getRegisteredCustomers,
  updatePlatformRequestStatus,
  getPlatformProfessionals,
  syncChannel,
} from '../../data/customerStore.js';
import {
  getArchitectByPhone,
  getArchitectAccounts,
} from '../../data/architectStore.js';
import { formatDate } from '../../lib/utils.js';

export const AssignedRequests: React.FC = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [selectedInquiry, setSelectedInquiry] = useState<any | null>(null);
  const { success, error } = useToast();

  const getSavedResponses = () => {
    try {
      const raw = localStorage.getItem('professional_inquiry_responses');
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  };

  const saveInquiryResponse = (requestId: string, status: 'ACCEPTED' | 'DECLINED') => {
    try {
      const responses = getSavedResponses();
      responses[requestId] = status;
      localStorage.setItem('professional_inquiry_responses', JSON.stringify(responses));
    } catch {}
  };

  const loadAssignments = () => {
    const realReqs = getPlatformRequests();
    const savedResponses = getSavedResponses();

    const proUserStored = (() => {
      try {
        return (
          JSON.parse(localStorage.getItem('gd_pro_user') || 'null') ||
          JSON.parse(localStorage.getItem('pro_user') || 'null') ||
          JSON.parse(localStorage.getItem('user') || '{}')
        );
      } catch {
        return {};
      }
    })();

    const effectivePhone =
      (user?.role === 'PROFESSIONAL' ? user.phone : null) ||
      proUserStored?.phone ||
      localStorage.getItem('auth_phone') ||
      user?.phone ||
      '';
    const cleanUserPhone = effectivePhone.replace(/\D/g, '').slice(-10);
    const archByPhone = cleanUserPhone ? getArchitectByPhone(cleanUserPhone) : null;
    const allArchs = getArchitectAccounts();
    const allPros = getPlatformProfessionals();

    const effectiveName =
      (user?.role === 'PROFESSIONAL' ? user.name : null) ||
      proUserStored?.name ||
      '';

    const matchedArch =
      archByPhone ||
      (cleanUserPhone ? allArchs.find((a) => (a.phone || '').replace(/\D/g, '').slice(-10) === cleanUserPhone) : null) ||
      (effectiveName ? allArchs.find((a) => a.name?.toLowerCase().trim() === effectiveName.toLowerCase().trim() || a.firmName?.toLowerCase().trim() === effectiveName.toLowerCase().trim()) : null) ||
      (user?.id ? allArchs.find((a) => a.userId === user.id || a.id === user.id) : null) ||
      (proUserStored?.id ? allArchs.find((a) => a.userId === proUserStored.id || a.id === proUserStored.id) : null);

    const matchedPro =
      (cleanUserPhone ? allPros.find((p) => (p.phone || '').replace(/\D/g, '').slice(-10) === cleanUserPhone) : null) ||
      (user?.id ? allPros.find((p) => p.userId === user.id || p.id === user.id) : null);

    // Build comprehensive set of all tokens that represent this professional/architect
    const myPossibleIds = new Set<string>();
    if (user?.id) myPossibleIds.add(user.id);
    if (proUserStored?.id) myPossibleIds.add(proUserStored.id);
    if (cleanUserPhone) {
      myPossibleIds.add(cleanUserPhone);
      myPossibleIds.add(`+91 ${cleanUserPhone}`);
      myPossibleIds.add(`+91${cleanUserPhone}`);
      myPossibleIds.add(`usr-arch-${cleanUserPhone}`);
      myPossibleIds.add(`pro-${cleanUserPhone}`);
      myPossibleIds.add(`arch-${cleanUserPhone}`);
    }
    if (matchedArch?.id) {
      myPossibleIds.add(matchedArch.id);
      myPossibleIds.add(matchedArch.id.toLowerCase());
      myPossibleIds.add(matchedArch.id.replace(/\s+/g, ''));
      myPossibleIds.add(matchedArch.id.toLowerCase().replace(/\s+/g, ''));
    }
    if (matchedArch?.applicationNumber) {
      myPossibleIds.add(matchedArch.applicationNumber);
      myPossibleIds.add(matchedArch.applicationNumber.toLowerCase());
    }
    if (matchedArch?.firmName) {
      myPossibleIds.add(matchedArch.firmName);
      myPossibleIds.add(matchedArch.firmName.toLowerCase());
      myPossibleIds.add(matchedArch.firmName.toLowerCase().trim());
    }
    if (matchedArch?.name) {
      myPossibleIds.add(matchedArch.name);
      myPossibleIds.add(matchedArch.name.toLowerCase());
      myPossibleIds.add(matchedArch.name.toLowerCase().trim());
    }
    if (matchedArch?.userId) myPossibleIds.add(matchedArch.userId);
    if (matchedArch?.phone) {
      const p = matchedArch.phone.replace(/\D/g, '').slice(-10);
      if (p) {
        myPossibleIds.add(p);
        myPossibleIds.add(`+91 ${p}`);
        myPossibleIds.add(`+91${p}`);
        myPossibleIds.add(`usr-arch-${p}`);
        myPossibleIds.add(`pro-${p}`);
        myPossibleIds.add(`arch-${p}`);
      }
    }
    if (matchedPro?.id) myPossibleIds.add(matchedPro.id);
    if (matchedPro?.userId) myPossibleIds.add(matchedPro.userId);

    // Filter requests suitable for Architecture / Civil engineering / Contractors
    const allocated = realReqs.filter((r) => {
      const isAssignedStatus =
        r.status === 'ASSIGNED' ||
        r.status === 'QUOTATIONS_AVAILABLE' ||
        r.status === 'BOOKING_CONFIRMED' ||
        r.status === 'IN_PROGRESS';

      const isArchOrCivil =
        !r.categorySlug ||
        !r.categorySlug.toLowerCase().includes('interior') ||
        (r.assignedProfessionalIds && r.assignedProfessionalIds.length > 0);

      // If no specific professional IDs list is set, request is not dispatched to this architect yet
      if (!r.assignedProfessionalIds || r.assignedProfessionalIds.length === 0) {
        return false;
      }

      // Check if explicitly assigned to this architect via ANY of their identifiers
      const matchesExplicit = r.assignedProfessionalIds.some((assignedId) => {
        if (!assignedId) return false;
        const normAssigned = assignedId.trim();
        const normLower = normAssigned.toLowerCase();

        if (myPossibleIds.has(normAssigned) || myPossibleIds.has(normLower)) return true;
        if (myPossibleIds.has(normAssigned.replace(/\s+/g, ''))) return true;

        const assignedCleanPh = normAssigned.replace(/\D/g, '').slice(-10);
        if (cleanUserPhone && assignedCleanPh && cleanUserPhone === assignedCleanPh) return true;

        if (
          matchedArch?.id &&
          (normAssigned === matchedArch.id || normAssigned.replace(/\s+/g, '') === matchedArch.id.replace(/\s+/g, ''))
        ) {
          return true;
        }

        if (matchedArch?.firmName && normLower.includes(matchedArch.firmName.toLowerCase().trim())) {
          return true;
        }

        if (matchedArch?.name && normLower.includes(matchedArch.name.toLowerCase().trim())) {
          return true;
        }

        if (matchedArch?.name && r.adminNotes && r.adminNotes.toLowerCase().includes(matchedArch.name.toLowerCase())) {
          return true;
        }

        if (matchedArch?.firmName && r.adminNotes && r.adminNotes.toLowerCase().includes(matchedArch.firmName.toLowerCase())) {
          return true;
        }

        return false;
      });

      return isAssignedStatus && isArchOrCivil && matchesExplicit;
    });

    const mapped = allocated.map((r) => {
      const localStatus = savedResponses[r.id];
      const status = localStatus || (r.status === 'ASSIGNED' ? 'PENDING' : 'ACCEPTED');
      return {
        id: `asg-${r.id}`,
        requestId: r.id,
        status,
        responseDeadline: r.responseDeadline || '2026-11-20',
        internalNotes: r.adminNotes || 'Scope verified by GharDesign Technical Desk. Ready for competitive BOQ bidding.',
        rawRequest: r,
        request: {
          id: r.id,
          requestCode: r.requestCode,
          customerId: r.customerId,
          customerName: r.customerName || 'Verified Homeowner',
          customerPhone: r.customerPhone || 'Contact via Platform',
          customerEmail: r.customerEmail || '',
          city: r.city || 'Delhi NCR',
          locality: r.locality || 'Locality',
          address: r.address || '',
          state: r.state || '',
          pinCode: r.pinCode || '',
          plotArea: r.plotArea || 1800,
          plotWidth: r.plotWidth,
          plotLength: r.plotLength,
          floors: r.floors,
          builtUpArea: r.builtUpArea,
          bedrooms: r.bedrooms,
          bathrooms: r.bathrooms,
          kitchens: r.kitchens,
          currentCondition: r.currentCondition,
          measurementUnit: r.measurementUnit || 'SQFT',
          budgetRange: r.budgetRange || '₹45 Lakhs - ₹60 Lakhs',
          description: r.description || 'Full architectural planning and civil structural execution.',
          propertyType: r.propertyType || 'Residential Villa',
          categorySlug: r.categorySlug || 'architectural-design',
          requiredServices: r.requiredServices || [],
          attachments: r.attachments || [],
          createdAt: r.createdAt,
        },
      };
    });

    setAssignments(mapped);
  };

  useEffect(() => {
    loadAssignments();

    window.addEventListener('storage', loadAssignments);

    const onSync = (event: MessageEvent) => {
      if (
        event.data?.type === 'PROJECT_REQUESTS_UPDATED' ||
        event.data?.type === 'QUOTATIONS_UPDATED'
      ) {
        loadAssignments();
      }
    };

    if (syncChannel) {
      syncChannel.addEventListener('message', onSync);
    }

    return () => {
      window.removeEventListener('storage', loadAssignments);
      if (syncChannel) {
        syncChannel.removeEventListener('message', onSync);
      }
    };
  }, [user]);

  // Match full customer record from central store when an inquiry is selected
  const matchedCustomer = useMemo(() => {
    if (!selectedInquiry) return null;
    const customers = getRegisteredCustomers();
    const req = selectedInquiry.request;
    const rawPhone = (req.customerPhone || '').replace(/\D/g, '').slice(-10);
    return (
      customers.find((c) => {
        if (req.customerId && c.id === req.customerId) return true;
        if (rawPhone && c.phone.replace(/\D/g, '').slice(-10) === rawPhone) return true;
        if (req.customerName && c.name.toLowerCase().trim() === req.customerName.toLowerCase().trim()) return true;
        return false;
      }) || null
    );
  }, [selectedInquiry]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedInquiry(null);
    };
    if (selectedInquiry) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedInquiry]);

  const handleRespond = (asgId: string, status: 'ACCEPTED' | 'DECLINED') => {
    const asg = assignments.find((a) => a.id === asgId);
    if (asg) {
      saveInquiryResponse(asg.requestId, status);
      if (status === 'ACCEPTED') {
        updatePlatformRequestStatus(asg.requestId, 'QUOTATIONS_AVAILABLE');
      }
    }
    setAssignments((prev) =>
      prev.map((a) => (a.id === asgId ? { ...a, status } : a))
    );
    if (selectedInquiry && selectedInquiry.id === asgId) {
      setSelectedInquiry((prev: any) => (prev ? { ...prev, status } : null));
    }
    success(`Inquiry marked as ${status === 'ACCEPTED' ? 'Accepted' : 'Declined'}`);
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black font-display text-navy-950">
            Assigned Customer Project Requests
          </h1>
          <p className="text-xs text-slate-500">
            Homeowner briefs dispatched to your architectural firm by GharDesign Admin. Accept inquiry and prepare BOQ.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-blue-100 text-blue-900 rounded-full font-mono text-xs font-bold border border-blue-200">
            {assignments.length} Allocated Inquiries
          </span>
        </div>
      </div>

      {assignments.length === 0 ? (
        <div className="card p-12 text-center text-slate-500 space-y-3 bg-white border border-slate-200/90 rounded-2xl shadow-xs">
          <Building className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 text-sm">No Assigned Project Inquiries</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            When the platform administrator allocates verified customer project inquiries to your firm, assignment details will appear live here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {assignments.map((asg) => (
            <div
              key={asg.id}
              className="card p-6 bg-white border border-slate-200/90 rounded-2xl shadow-xs hover:border-blue-300 transition space-y-4"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedInquiry(asg)}
                    className="font-bold font-display text-navy-950 hover:text-blue-600 text-base transition flex items-center gap-1.5 cursor-pointer group text-left"
                    title="Click to inspect complete customer profile & project brief"
                  >
                    <span className="group-hover:underline">{asg.request?.requestCode}</span>
                    <Eye className="w-3.5 h-3.5 text-blue-500 opacity-60 group-hover:opacity-100 transition-opacity" />
                  </button>
                  <Badge status={asg.status} />
                  <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full capitalize">
                    {asg.request?.categorySlug?.replace(/-/g, ' ')}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedInquiry(asg)}
                    className="text-xs font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-xl border border-blue-200 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Customer & Specs</span>
                  </button>
                  <div className="text-xs text-rose-600 font-semibold flex items-center gap-1.5 bg-rose-50 px-3 py-1 rounded-xl border border-rose-200">
                    <Calendar className="w-4 h-4 text-rose-500" />
                    <span>Bid Deadline: {asg.responseDeadline}</span>
                  </div>
                </div>
              </div>

              {/* Inquiry Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl hover:bg-blue-50/60 transition group">
                  <span className="text-slate-400 block mb-0.5 text-[11px]">Homeowner:</span>
                  <button
                    type="button"
                    onClick={() => setSelectedInquiry(asg)}
                    className="font-bold text-slate-900 hover:text-blue-600 transition flex items-center gap-1.5 cursor-pointer text-left w-full"
                    title="Click to view full homeowner dossier & contact"
                  >
                    <span className="underline decoration-blue-300 underline-offset-2 group-hover:decoration-blue-600">
                      {asg.request?.customerName}
                    </span>
                    <Eye className="w-3.5 h-3.5 text-blue-500 opacity-70 group-hover:opacity-100 shrink-0" />
                  </button>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 block mb-0.5 text-[11px]">Site Location:</span>
                  <span className="font-semibold text-slate-800">
                    {asg.request?.locality}, {asg.request?.city}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 block mb-0.5 text-[11px]">Plot Dimensions:</span>
                  <span className="font-bold text-slate-900">
                    {asg.request?.plotArea} {asg.request?.measurementUnit}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 block mb-0.5 text-[11px]">Estimated Budget:</span>
                  <span className="font-bold text-amber-700">{asg.request?.budgetRange}</span>
                </div>
              </div>

              <div className="text-xs text-slate-600 space-y-1">
                <div>
                  <strong>Project Description:</strong> {asg.request?.description}
                </div>
                {asg.internalNotes && (
                  <div className="text-blue-800 bg-blue-50/70 p-2.5 rounded-xl border border-blue-200/80 text-[11px] font-medium flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Admin Technical Note: {asg.internalNotes}</span>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  {asg.status === 'PENDING' ? (
                    <>
                      <button
                        onClick={() => handleRespond(asg.id, 'ACCEPTED')}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Accept Inquiry</span>
                      </button>
                      <button
                        onClick={() => handleRespond(asg.id, 'DECLINED')}
                        className="px-4 py-2 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 rounded-xl text-xs font-bold transition border border-slate-200 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Decline</span>
                      </button>
                    </>
                  ) : asg.status === 'ACCEPTED' ? (
                    <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                      ✓ Assignment Accepted
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                      Assignment Declined
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => setSelectedInquiry(asg)}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-xl text-xs font-bold transition border border-slate-200 cursor-pointer flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5 text-blue-600" />
                    <span>Inspect Details</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {asg.status === 'ACCEPTED' ? (
                    <Link
                      to={`/professional/quotation-builder?requestId=${asg.requestId}`}
                      className="px-4 py-2 bg-navy-950 hover:bg-navy-900 text-gold-400 font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <PlusCircle className="w-4 h-4 text-gold-400" />
                      <span>Build / Edit BOQ Quotation</span>
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setSelectedInquiry(asg)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Accept Inquiry to Quote</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ================= FULL INQUIRY & CUSTOMER DOSSIER FULL PAGE VIEW ================= */}
      {selectedInquiry && (
        <div className="fixed inset-0 z-50 bg-[#f4f7fb] overflow-y-auto flex flex-col w-full h-full min-h-screen font-sans animate-in fade-in duration-150">
          <div className="h-1 bg-gradient-to-r from-amber-400 via-sky-500 to-indigo-600 pointer-events-none shrink-0" />

          {/* Sticky Executive Top Navigation Header */}
          <div className="sticky top-0 z-40 bg-navy-950 text-white px-4 sm:px-8 py-3.5 border-b border-navy-900 flex items-center justify-between shadow-xl shrink-0">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <button
                type="button"
                onClick={() => setSelectedInquiry(null)}
                className="px-3.5 py-2 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs flex items-center gap-2 border border-slate-700/80 hover:border-slate-500 transition group cursor-pointer shrink-0"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span>Back to Assigned Inquiries</span>
              </button>

              <div className="h-6 w-px bg-slate-700 hidden sm:block shrink-0" />

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[10px] font-mono font-bold uppercase tracking-wider">
                    Customer Project Dossier
                  </span>
                  <Badge status={selectedInquiry.status} />
                  <span className="text-[11px] font-semibold text-slate-300 bg-white/10 px-2 py-0.5 rounded-full capitalize">
                    {selectedInquiry.request?.categorySlug?.replace(/-/g, ' ')}
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-black font-display text-white truncate mt-0.5">
                  {selectedInquiry.request?.requestCode}
                  <span className="text-xs font-normal text-slate-300 ml-2 font-sans">
                    • Homeowner: <strong className="text-white">{selectedInquiry.request?.customerName}</strong>
                    • Site: <strong className="text-white">{selectedInquiry.request?.locality}, {selectedInquiry.request?.city}</strong>
                    • <span className="text-amber-300">Bid Deadline: {selectedInquiry.responseDeadline}</span>
                  </span>
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedInquiry(null)}
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                title="Close Full Page Dossier"
              >
                <X className="w-4 h-4" />
                <span className="hidden sm:inline">Close</span>
              </button>
            </div>
          </div>

          {/* Full Page Body */}
          <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-6">
            {/* Homeowner Profile Strip */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-blue-600/10 text-blue-600 border border-blue-200 flex items-center justify-center font-black text-2xl font-display shrink-0">
                    {(selectedInquiry.request?.customerName || 'CU').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h3 className="text-lg font-bold text-slate-900">
                        {selectedInquiry.request?.customerName}
                      </h3>
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {matchedCustomer?.status || 'VERIFIED HOMEOWNER'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 font-mono mt-1">
                      Customer ID: {matchedCustomer?.id || `BG/${(selectedInquiry.request?.customerName || 'CUS').replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase()}/0001`}
                      {matchedCustomer?.registeredAt && ` • Member since ${formatDate(matchedCustomer.registeredAt)}`}
                    </div>
                  </div>
                </div>

                {/* Direct Contact Buttons */}
                <div className="flex flex-wrap items-center gap-2.5">
                  {selectedInquiry.request?.customerPhone && (
                    <a
                      href={`tel:${selectedInquiry.request.customerPhone.replace(/\D/g, '')}`}
                      className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-bold border border-blue-200 transition flex items-center gap-2 text-xs"
                      title="Call Homeowner"
                    >
                      <Phone className="w-4 h-4" />
                      <span>{selectedInquiry.request.customerPhone}</span>
                    </a>
                  )}
                  {selectedInquiry.request?.customerPhone && (
                    <a
                      href={`https://wa.me/91${selectedInquiry.request.customerPhone.replace(/\D/g, '').slice(-10)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl font-bold border border-emerald-200 transition flex items-center gap-2 text-xs"
                      title="Chat on WhatsApp"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>WhatsApp Chat</span>
                    </a>
                  )}
                  {selectedInquiry.request?.customerEmail && (
                    <a
                      href={`mailto:${selectedInquiry.request.customerEmail}`}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition flex items-center gap-2 text-xs"
                      title="Send Email"
                    >
                      <Mail className="w-4 h-4" />
                      <span>Send Email</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Customer Address Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
                <div className="p-3.5 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold mb-1">Plot / House Address:</span>
                  <span className="font-semibold text-slate-800 text-sm">
                    {matchedCustomer?.housePlotNumber || selectedInquiry.request?.address || 'Site Plot Specified'}
                  </span>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold mb-1">Locality / Sector:</span>
                  <span className="font-semibold text-slate-800 text-sm">
                    {matchedCustomer?.streetLocality || selectedInquiry.request?.locality || 'Locality'}
                  </span>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold mb-1">City & State:</span>
                  <span className="font-semibold text-slate-800 text-sm">
                    {selectedInquiry.request?.city}, {matchedCustomer?.state || selectedInquiry.request?.state || 'India'} {matchedCustomer?.pinCode ? `(${matchedCustomer.pinCode})` : ''}
                  </span>
                </div>
              </div>
            </div>

            {/* Project Engineering & Architectural Brief */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-6">
              <h4 className="text-sm font-black uppercase tracking-wider text-navy-950 font-display flex items-center gap-2 border-b border-slate-100 pb-3">
                <Building className="w-5 h-5 text-blue-600" />
                <span>Property & Architectural Specifications</span>
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="p-4 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold mb-1">Property Type:</span>
                  <span className="font-bold text-slate-900 text-sm">{selectedInquiry.request?.propertyType || 'Residential'}</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold mb-1">Plot Dimensions:</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {selectedInquiry.request?.plotWidth && selectedInquiry.request?.plotLength
                      ? `${selectedInquiry.request.plotWidth} × ${selectedInquiry.request.plotLength} ${selectedInquiry.request.measurementUnit || 'ft'}`
                      : `${selectedInquiry.request?.plotArea || '1500'} ${selectedInquiry.request?.measurementUnit || 'SQFT'}`}
                  </span>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold mb-1">Total Plot Area:</span>
                  <span className="font-extrabold text-blue-900 text-sm">
                    {selectedInquiry.request?.plotArea || 1500} {selectedInquiry.request?.measurementUnit || 'SQFT'}
                  </span>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold mb-1">Target Budget:</span>
                  <span className="font-bold text-amber-700 text-sm">{selectedInquiry.request?.budgetRange || 'Market Rate'}</span>
                </div>
              </div>

              {/* Floors, Bedrooms, Bathrooms if present */}
              {(selectedInquiry.request?.floors || selectedInquiry.request?.bedrooms || selectedInquiry.request?.bathrooms || selectedInquiry.request?.builtUpArea) && (
                <div className="flex flex-wrap gap-2.5 pt-1 text-xs">
                  {selectedInquiry.request?.floors && (
                    <span className="px-3.5 py-1.5 bg-slate-100 rounded-xl font-semibold text-slate-700 border border-slate-200">
                      Structure: <strong>{selectedInquiry.request.floors} Floors</strong>
                    </span>
                  )}
                  {selectedInquiry.request?.bedrooms && (
                    <span className="px-3.5 py-1.5 bg-slate-100 rounded-xl font-semibold text-slate-700 border border-slate-200">
                      Bedrooms: <strong>{selectedInquiry.request.bedrooms} BHK</strong>
                    </span>
                  )}
                  {selectedInquiry.request?.bathrooms && (
                    <span className="px-3.5 py-1.5 bg-slate-100 rounded-xl font-semibold text-slate-700 border border-slate-200">
                      Bathrooms: <strong>{selectedInquiry.request.bathrooms}</strong>
                    </span>
                  )}
                  {selectedInquiry.request?.builtUpArea && (
                    <span className="px-3.5 py-1.5 bg-slate-100 rounded-xl font-semibold text-slate-700 border border-slate-200">
                      Built-up: <strong>{selectedInquiry.request.builtUpArea} sq ft</strong>
                    </span>
                  )}
                </div>
              )}

              {/* Requested Services Tags */}
              {selectedInquiry.request?.requiredServices && selectedInquiry.request.requiredServices.length > 0 && (
                <div className="space-y-2 pt-2">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">
                    Requested Technical Drawings & Engineering Deliverables:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {selectedInquiry.request.requiredServices.map((srv: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-50 text-blue-900 border border-blue-200 shadow-2xs"
                      >
                        {srv}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Customer Project Description */}
              <div className="space-y-2 pt-2">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">
                  Client's Detailed Project Scope & Instructions:
                </span>
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 text-slate-800 leading-relaxed font-sans text-sm">
                  {selectedInquiry.request?.description || 'Full architectural design and civil engineering drawings required as per local municipal bylaws.'}
                </div>
              </div>

              {/* Admin Technical Note */}
              {selectedInquiry.internalNotes && (
                <div className="text-blue-900 bg-blue-50/90 p-4 rounded-2xl border border-blue-200 text-xs flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-sm">GharDesign Chief Engineer Technical Note:</span>
                    <span className="text-blue-800 mt-1 block leading-relaxed">{selectedInquiry.internalNotes}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sticky Full Page Action Footer */}
          <div className="sticky bottom-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 sm:px-8 py-4 shadow-2xl flex flex-wrap items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-3">
              {selectedInquiry.status === 'PENDING' ? (
                <>
                  <button
                    onClick={() => handleRespond(selectedInquiry.id, 'ACCEPTED')}
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 shadow-sm cursor-pointer active:scale-98"
                  >
                    <Check className="w-4 h-4" />
                    <span>Accept Inquiry</span>
                  </button>
                  <button
                    onClick={() => handleRespond(selectedInquiry.id, 'DECLINED')}
                    className="px-5 py-3 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 rounded-xl text-xs sm:text-sm font-bold transition border border-slate-200 cursor-pointer active:scale-98"
                  >
                    <X className="w-4 h-4" />
                    <span>Decline</span>
                  </button>
                </>
              ) : selectedInquiry.status === 'ACCEPTED' ? (
                <span className="text-xs sm:text-sm text-emerald-800 font-bold bg-emerald-50 px-4 py-2.5 rounded-xl border border-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Inquiry Accepted & Active</span>
                </span>
              ) : (
                <span className="text-xs sm:text-sm text-slate-500 bg-slate-100 px-4 py-2.5 rounded-xl border border-slate-200">
                  Inquiry Declined
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              {selectedInquiry.request?.status === 'BOOKING_CONFIRMED' ? (
                <Link
                  to="/professional/quotations/approved"
                  className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer active:scale-98"
                >
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>Homeowner Booked! Accept Work &amp; Start Project</span>
                </Link>
              ) : selectedInquiry.status === 'ACCEPTED' ? (
                <Link
                  to={`/professional/quotation-builder?requestId=${selectedInquiry.requestId}`}
                  className="px-6 py-3 bg-navy-950 hover:bg-navy-900 text-gold-400 font-extrabold text-xs sm:text-sm rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer border border-gold-500/30 active:scale-98"
                >
                  <PlusCircle className="w-4 h-4 text-gold-400" />
                  <span>Prepare Itemized BOQ Quotation</span>
                </Link>
              ) : (
                <span className="text-xs text-slate-500 italic hidden sm:inline">
                  Accept inquiry above to unlock BOQ Quotation Builder
                </span>
              )}
              <button
                type="button"
                onClick={() => setSelectedInquiry(null)}
                className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm rounded-xl transition cursor-pointer"
              >
                Back to Inquiries
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
